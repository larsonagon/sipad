// =====================================================
// BIBLIOTECA DE TRD DE REFERENCIA
// -----------------------------------------------------
// Arranca del 80%, no de cero. Para un tipo de entidad
// (hoy: alcaldía municipal) entrega una estructura base de
// series → subseries con retención y disposición sugeridas,
// derivada de la matriz del motor + la KB de valoración.
//
// Dos usos:
//   1) Vista/preview de referencia (solo lectura).
//   2) Precargar como PROPUESTAS de la entidad actual, para
//      que el usuario las cure con las herramientas existentes.
//
// Reutiliza:
//   - MATRIZ_SERIES (engine)  → series y subseries de alcaldía
//   - valorarSerie (valoración) → retención + disposición + fundamento
//   - valorarPropuestas (valoración) → adjunta la regla de retención
// =====================================================

import crypto from 'crypto'
import { MATRIZ_SERIES } from './trd-ai.engine.js'
import { valorarSerie, valorarPropuestas } from './trd-ai.valoracion.js'
import { MATRICES_REFERENCIA, BANTER_SERIES, procesosMisionales, anotarMisional } from './trd-ai.biblioteca-matrices.js'

// Normaliza para comparar (sin tildes, minúsculas, sin espacios extremos)
function norm(s) {
  return (s || '')
    .toString()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
    .toLowerCase()
    .replace(/\s+/g, ' ')
}

// Anexa a una serie su etiqueta de proceso misional (capa misional).
// Las series transversales (BANTER) quedan con misional=false.
function anexarMisional(tipo, serie, disposicion, subseries) {
  const m = anotarMisional(tipo, serie)
  return {
    serie,
    disposicion,
    misional:               !!m,
    proceso_misional:       m?.proceso_misional || null,
    dependencia_productora: m?.dependencia_productora || null,
    subseries
  }
}

// =====================================================
// PLANTILLAS DISPONIBLES
// =====================================================

const PLANTILLAS = {
  alcaldia: {
    tipo: 'alcaldia',
    nombre: 'Alcaldía municipal',
    descripcion:
      'Estructura base de series y subseries documentales típicas de una alcaldía ' +
      'municipal colombiana, con retención y disposición sugeridas según valoración ' +
      '(Acuerdo AGN 004 de 2019). Punto de partida para ajustar a la entidad.'
  },
  // Plantillas por tipo de entidad con su propia matriz de referencia.
  ...Object.fromEntries(Object.values(MATRICES_REFERENCIA).map(m => [
    m.tipo, { tipo: m.tipo, nombre: m.nombre, descripcion: m.descripcion }
  ])),
  // BANTER: núcleo transversal común (nombres del banco del AGN). La valoración
  // la calcula el motor de SIPAD al precargar; no son cifras predefinidas a mano.
  banter: {
    tipo: 'banter',
    nombre: 'BANTER — Series comunes (transversales)',
    descripcion:
      'Series y subseries COMUNES a la administración pública, con las denominaciones ' +
      'normalizadas del Banco Terminológico del AGN (BANTER). Pensadas para replicarse en las ' +
      'dependencias que las producen. La retención y disposición las sugiere el motor de SIPAD y ' +
      'las aprueba el Comité; concílielas con la versión vigente del BANTER del Observatorio AGN.'
  }
}

// =====================================================
// CONSTRUIR PLANTILLA (series → subseries + retención)
// =====================================================

export function construirPlantilla(tipo = 'alcaldia') {

  const meta = PLANTILLAS[tipo]
  if (!meta) return null

  // BANTER: nombres normalizados del banco del AGN; la valoración la CALCULA el
  // motor de SIPAD (valorarSerie), no cifras predefinidas a mano.
  if (tipo === 'banter') {
    const series = BANTER_SERIES.map(s => {
      const subs = (s.subseries && s.subseries.length) ? s.subseries : [null]
      const subseries = subs.map(nombre => {
        const v = valorarSerie(s.serie, nombre)
        return {
          subserie:    nombre,
          ag:          v.retencion_gestion,
          ac:          v.retencion_central,
          disposicion: v.disposicion_final,
          fundamento:  v.fundamento_normativo
        }
      })
      return anexarMisional(tipo, s.serie, subseries[0]?.disposicion || 'S', subseries)
    })
    const totalSubseries = series.reduce((n, s) => n + s.subseries.length, 0)
    return { tipo: meta.tipo, nombre: meta.nombre, descripcion: meta.descripcion, totalSeries: series.length, totalSubseries, series }
  }

  // Plantillas con matriz propia (ESE/hospital, tránsito, …): la valoración
  // viene definida en la matriz de referencia (no se deriva de la KB de alcaldía).
  if (tipo !== 'alcaldia') {
    const matriz = MATRICES_REFERENCIA[tipo]
    if (!matriz) return null
    const series = matriz.series.map(s => {
      const subseries = s.subseries.map(sub => ({
        subserie:    sub.subserie,
        ag:          sub.ag,
        ac:          sub.ac,
        disposicion: sub.disposicion,
        fundamento:  sub.fundamento
      }))
      return anexarMisional(tipo, s.serie, subseries[0]?.disposicion || 'S', subseries)
    })
    const totalSubseries = series.reduce((n, s) => n + s.subseries.length, 0)
    return { tipo: meta.tipo, nombre: meta.nombre, descripcion: meta.descripcion, totalSeries: series.length, totalSubseries, series }
  }

  // Alcaldía: se deriva de la matriz del motor + la KB de valoración.
  const series = MATRIZ_SERIES.map(s => {

    // Subseries distintas conservando el orden de aparición
    const vistas = new Set()
    const subseries = []
    for (const r of s.reglas) {
      const clave = norm(r.subserie)
      if (vistas.has(clave)) continue
      vistas.add(clave)
      const v = valorarSerie(s.serie, r.subserie)
      subseries.push({
        subserie:    r.subserie,
        ag:          v.retencion_gestion,
        ac:          v.retencion_central,
        disposicion: v.disposicion_final,
        fundamento:  v.fundamento_normativo
      })
    }

    // Disposición representativa de la serie (la de su primera subserie)
    const disp = subseries[0]?.disposicion || 'S'

    return anexarMisional(tipo, s.serie, disp, subseries)
  })

  const totalSubseries = series.reduce((n, s) => n + s.subseries.length, 0)

  return {
    tipo:          meta.tipo,
    nombre:        meta.nombre,
    descripcion:   meta.descripcion,
    totalSeries:   series.length,
    totalSubseries,
    series
  }
}

// =====================================================
// BANCO MISIONAL — vista de la plantilla agrupada por proceso
// -----------------------------------------------------
// Separa las series misionales (por su proceso y dependencia
// productora) de las transversales (comunes / BANTER). Es la lectura
// que sustituye el mapa de procesos cuando la entidad no lo tiene.
// =====================================================
export function construirBancoMisional(tipo = 'alcaldia') {
  const plantilla = construirPlantilla(tipo)
  if (!plantilla) return null

  const procs = procesosMisionales(tipo)
  const porNombre = new Map(procs.map(p => [p.proceso, {
    proceso:                p.proceso,
    dependencia_productora: p.dependencia_productora,
    fundamento:             p.fundamento,
    series:                 []
  }]))

  const comunes = []
  for (const s of plantilla.series) {
    if (s.misional && porNombre.has(s.proceso_misional)) porNombre.get(s.proceso_misional).series.push(s)
    else comunes.push(s)
  }

  const procesos = [...porNombre.values()].filter(p => p.series.length)
  return {
    tipo:           plantilla.tipo,
    nombre:         plantilla.nombre,
    descripcion:    plantilla.descripcion,
    totalSeries:    plantilla.totalSeries,
    totalSubseries: plantilla.totalSubseries,
    procesos,
    comunes,
    totalMisional:  procesos.reduce((n, p) => n + p.series.length, 0),
    totalComunes:   comunes.length
  }
}

// =====================================================
// LISTAR PLANTILLAS (para el selector)
// =====================================================

export function listarPlantillas() {
  return Object.values(PLANTILLAS).map(p => {
    const full = construirPlantilla(p.tipo)
    return {
      tipo:          p.tipo,
      nombre:        p.nombre,
      descripcion:   p.descripcion,
      totalSeries:   full?.totalSeries || 0,
      totalSubseries: full?.totalSubseries || 0
    }
  })
}

// =====================================================
// PRECARGAR como propuestas de la entidad
// =====================================================

export async function precargarPlantilla(db, { tipo = 'alcaldia', entidadId = null, usuarioId = null, dependencias = [] } = {}) {

  const plantilla = construirPlantilla(tipo)
  if (!plantilla) return { ok: false, error: 'Plantilla no encontrada' }

  // Destinos: si se pasan dependencias, se REPLICA la plantilla en cada una
  // (misma serie/subserie en varias oficinas). Si no, se crea a nivel de
  // entidad (dependencia_id null) para asignarla luego.
  const deps = Array.isArray(dependencias)
    ? [...new Set(dependencias.map(d => (d == null ? null : Number(d))).filter(d => d === null || !Number.isNaN(d)))]
    : []
  const targets = deps.length ? deps : [null]

  // Propuestas ya existentes → no duplicar. Dedup por (dependencia_id, serie, subserie).
  const existentesRows = await db.all(
    `SELECT nombre_serie, nombre_subserie, dependencia_id FROM trd_series_propuestas ${entidadId ? 'WHERE entidad_id = ?' : ''}`,
    entidadId ? [entidadId] : []
  )
  const claveDe = (dep, serie, sub) => `${dep == null ? 'ent' : dep}__${norm(serie)}__${norm(sub)}`
  const existentes = new Set(existentesRows.map(r => claveDe(r.dependencia_id, r.nombre_serie, r.nombre_subserie)))

  const nuevosIds = []
  const pendientesRegla = []   // { id, ag, ac, disposicion, fundamento } (plantillas con matriz propia)
  let omitidas = 0
  const justificacion = `Precargada desde biblioteca de referencia (${plantilla.nombre})`
  const now = () => new Date().toISOString()

  for (const dep of targets) {
    for (const s of plantilla.series) {
      for (const sub of s.subseries) {
        const clave = claveDe(dep, s.serie, sub.subserie)
        if (existentes.has(clave)) { omitidas++; continue }
        existentes.add(clave)

        const id = crypto.randomUUID()
        await db.run(`
          INSERT INTO trd_series_propuestas (
            id, actividad_id, nombre_serie, nombre_subserie,
            tipologia_documental, justificacion, confianza, estado, creado_en, entidad_id, dependencia_id
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `, [
          id, null, s.serie, sub.subserie,
          null, justificacion, 0.9, 'propuesta', now(), entidadId, dep
        ])
        nuevosIds.push(id)
        if (sub.disposicion != null || sub.ag != null || sub.ac != null) {
          pendientesRegla.push({ id, ag: sub.ag, ac: sub.ac, disposicion: sub.disposicion, fundamento: sub.fundamento })
        }
      }
    }
  }

  // Adjunta retención + disposición + fundamento a las recién creadas.
  //   • Alcaldía: usa el motor de valoración (KB).
  //   • Plantillas con matriz propia: escribe la regla definida en la matriz.
  let valoradas = 0
  if (nuevosIds.length) {
    if (tipo === 'alcaldia') {
      try {
        const r = await valorarPropuestas(db, { ids: nuevosIds, entidadId })
        valoradas = r?.valoradas || 0
      } catch (e) {
        console.warn('Precarga: valoración omitida:', e.message)
      }
    } else {
      for (const p of pendientesRegla) {
        try {
          await db.run(`
            INSERT INTO trd_reglas_retencion
              (id, propuesta_id, retencion_gestion, retencion_central, disposicion_final, fundamento_normativo, tipo_regla, creado_en)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
          `, [crypto.randomUUID(), p.id, p.ag ?? null, p.ac ?? null, p.disposicion ?? null, p.fundamento ?? null, 'biblioteca', now()])
          await db.run(`UPDATE trd_series_propuestas SET disposicion_final = ? WHERE id = ?`, [p.disposicion ?? null, p.id])
          valoradas++
        } catch (e) {
          console.warn('Precarga: regla de retención omitida:', e.message)
        }
      }
    }
  }

  return {
    ok: true,
    plantilla: plantilla.nombre,
    creadas: nuevosIds.length,
    omitidas,
    valoradas,
    dependencias: deps.length,
    totalPlantilla: plantilla.totalSubseries
  }
}

// =====================================================
// RUTAS
//   GET  /api/trd-ai/biblioteca                 → lista de plantillas
//   GET  /api/trd-ai/biblioteca/:tipo/preview   → estructura completa
//   POST /api/trd-ai/biblioteca/:tipo/precargar → inserta como propuestas
// =====================================================

export function registrarBiblioteca(router, db, guard) {
  const mw = typeof guard === 'function' ? guard : (req, res, next) => next()

  router.get('/biblioteca', mw, (req, res) => {
    try {
      return res.json({ ok: true, plantillas: listarPlantillas() })
    } catch (err) {
      console.error('Biblioteca listar error:', err)
      return res.status(500).json({ ok: false, error: 'No se pudo listar la biblioteca' })
    }
  })

  router.get('/biblioteca/:tipo/preview', mw, (req, res) => {
    try {
      const plantilla = construirPlantilla(req.params.tipo)
      if (!plantilla) return res.status(404).json({ ok: false, error: 'Plantilla no encontrada' })
      return res.json({ ok: true, ...plantilla })
    } catch (err) {
      console.error('Biblioteca preview error:', err)
      return res.status(500).json({ ok: false, error: 'No se pudo generar la vista previa' })
    }
  })

  router.get('/biblioteca/:tipo/misional', mw, (req, res) => {
    try {
      const banco = construirBancoMisional(req.params.tipo)
      if (!banco) return res.status(404).json({ ok: false, error: 'Plantilla no encontrada' })
      return res.json({ ok: true, ...banco })
    } catch (err) {
      console.error('Biblioteca misional error:', err)
      return res.status(500).json({ ok: false, error: 'No se pudo generar el banco misional' })
    }
  })

  router.post('/biblioteca/:tipo/precargar', mw, async (req, res) => {
    try {
      const r = await precargarPlantilla(db, {
        tipo:         req.params.tipo,
        entidadId:    req.entidad_id || null,
        usuarioId:    req.user?.sub || req.user?.id || null,
        dependencias: Array.isArray(req.body?.dependencias) ? req.body.dependencias : []
      })
      if (!r.ok) return res.status(404).json(r)
      return res.json(r)
    } catch (err) {
      console.error('Biblioteca precargar error:', err)
      return res.status(500).json({ ok: false, error: 'No se pudo precargar la plantilla' })
    }
  })
}
