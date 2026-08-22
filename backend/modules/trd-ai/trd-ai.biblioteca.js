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
  }
}

// =====================================================
// CONSTRUIR PLANTILLA (series → subseries + retención)
// =====================================================

export function construirPlantilla(tipo = 'alcaldia') {

  const meta = PLANTILLAS[tipo]
  if (!meta) return null

  // Hoy toda plantilla se deriva de la matriz de alcaldía.
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

    return { serie: s.serie, disposicion: disp, subseries }
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

export async function precargarPlantilla(db, { tipo = 'alcaldia', entidadId = null, usuarioId = null } = {}) {

  const plantilla = construirPlantilla(tipo)
  if (!plantilla) return { ok: false, error: 'Plantilla no encontrada' }

  // Propuestas ya existentes en la entidad → para no duplicar
  const existentesRows = await db.all(
    `SELECT nombre_serie, nombre_subserie FROM trd_series_propuestas ${entidadId ? 'WHERE entidad_id = ?' : ''}`,
    entidadId ? [entidadId] : []
  )
  const existentes = new Set(
    existentesRows.map(r => `${norm(r.nombre_serie)}__${norm(r.nombre_subserie)}`)
  )

  const nuevosIds = []
  let omitidas = 0
  const justificacion = `Precargada desde biblioteca de referencia (${plantilla.nombre})`
  const now = () => new Date().toISOString()

  for (const s of plantilla.series) {
    for (const sub of s.subseries) {
      const clave = `${norm(s.serie)}__${norm(sub.subserie)}`
      if (existentes.has(clave)) { omitidas++; continue }
      existentes.add(clave)

      const id = crypto.randomUUID()
      await db.run(`
        INSERT INTO trd_series_propuestas (
          id, actividad_id, nombre_serie, nombre_subserie,
          tipologia_documental, justificacion, confianza, estado, creado_en, entidad_id
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [
        id, null, s.serie, sub.subserie,
        null, justificacion, 0.9, 'propuesta', now(), entidadId
      ])
      nuevosIds.push(id)
    }
  }

  // Adjunta retención + disposición + fundamento a las recién creadas
  let valoradas = 0
  if (nuevosIds.length) {
    try {
      const r = await valorarPropuestas(db, { ids: nuevosIds, entidadId })
      valoradas = r?.valoradas || 0
    } catch (e) {
      console.warn('Precarga: valoración omitida:', e.message)
    }
  }

  return {
    ok: true,
    plantilla: plantilla.nombre,
    creadas: nuevosIds.length,
    omitidas,
    valoradas,
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

  router.post('/biblioteca/:tipo/precargar', mw, async (req, res) => {
    try {
      const r = await precargarPlantilla(db, {
        tipo:      req.params.tipo,
        entidadId: req.entidad_id || null,
        usuarioId: req.user?.sub || req.user?.id || null
      })
      if (!r.ok) return res.status(404).json(r)
      return res.json(r)
    } catch (err) {
      console.error('Biblioteca precargar error:', err)
      return res.status(500).json({ ok: false, error: 'No se pudo precargar la plantilla' })
    }
  })
}
