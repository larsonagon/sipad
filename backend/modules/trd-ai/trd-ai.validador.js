// ======================================================
// SIPAD · Validador normativo de la TRD (pre-comité)
// Revisa las propuestas (no rechazadas) de una entidad contra
// reglas del AGN (Ley 594/2000, Acuerdo 004/2019) y reporta
// hallazgos: errores (bloquean), advertencias, informativos.
// ======================================================

function norm(s) {
  return (s || '').toString().toLowerCase().normalize('NFD')
    .replace(/[̀-ͯ]/g, '').replace(/\s+/g, ' ').trim()
}

function parseTipologias(raw) {
  if (!raw) return []
  try { const p = JSON.parse(raw); return Array.isArray(p) ? p : [p] }
  catch { return [raw] }
}

function codigoDisposicion(v) {
  if (!v) return null
  const s = v.toString().toLowerCase().trim()
  if (['ct', 'conservacion_total', 'conservación total'].includes(s)) return 'CT'
  if (['el', 'e', 'eliminacion', 'eliminación'].includes(s)) return 'E'
  if (['st', 's', 'seleccion', 'selección'].includes(s)) return 'S'
  if (['mt', 'm', 'medio_tecnico', 'medio técnico', 'microfilmación'].includes(s)) return 'M'
  const up = v.toString().toUpperCase()
  if (['CT', 'E', 'S', 'M'].includes(up)) return up
  if (up === 'EL') return 'E'; if (up === 'ST') return 'S'; if (up === 'MT') return 'M'
  return 'INVALIDA'
}

// Quita plural simple para comparar nombres de serie
function raiz(s) {
  return norm(s).split(' ').map(w => (w.endsWith('s') && w.length > 4) ? w.slice(0, -1) : w).join(' ')
}

export async function validarTRD(db, entidadId) {

  const filas = await db.all(`
    SELECT
      tsp.nombre_serie, tsp.nombre_subserie, tsp.tipologia_documental,
      tsp.confianza, tsp.estado,
      tsp.disposicion_final AS disp_prop,
      r.retencion_gestion, r.retencion_central, r.disposicion_final AS disp_regla
    FROM trd_series_propuestas tsp
    LEFT JOIN trd_reglas_retencion r ON r.propuesta_id = tsp.id
    WHERE tsp.estado <> 'rechazada'
      ${entidadId ? 'AND tsp.entidad_id = ?' : ''}
  `, entidadId ? [entidadId] : [])

  // Dependencias de la entidad (para detectar series nombradas como dependencia)
  const deps = await db.all(
    `SELECT nombre FROM dependencias ${entidadId ? 'WHERE entidad_id = ?' : ''}`,
    entidadId ? [entidadId] : []
  )
  const setDeps = new Set(deps.map(d => norm(d.nombre)))

  // Agrupar por serie + subserie
  const grupos = new Map()
  for (const f of filas) {
    const serie = f.nombre_serie || 'Serie sin nombre'
    const sub = f.nombre_subserie || ''
    const key = `${serie}||${sub}`
    if (!grupos.has(key)) {
      grupos.set(key, {
        serie, subserie: sub, tipologias: new Set(),
        confianza: f.confianza ?? null,
        ag: null, ac: null, disp: null
      })
    }
    const g = grupos.get(key)
    parseTipologias(f.tipologia_documental).forEach(t => { if (t && t.trim()) g.tipologias.add(t.trim()) })
    if (g.ag == null && f.retencion_gestion != null) g.ag = f.retencion_gestion
    if (g.ac == null && f.retencion_central != null) g.ac = f.retencion_central
    if (!g.disp) g.disp = codigoDisposicion(f.disp_regla || f.disp_prop)
    if (g.confianza == null && f.confianza != null) g.confianza = f.confianza
  }

  const hallazgos = []
  const add = (severidad, tipo, g, mensaje, sugerencia) =>
    hallazgos.push({ severidad, tipo, serie: g.serie, subserie: g.subserie || null, mensaje, sugerencia: sugerencia || null })

  const gruposArr = [...grupos.values()]

  for (const g of gruposArr) {
    // ERROR: serie nombrada como una dependencia
    if (setDeps.has(norm(g.serie))) {
      add('error', 'serie_como_dependencia', g,
        `La serie "${g.serie}" coincide con el nombre de una dependencia.`,
        'Las series se nombran por FUNCIÓN, no por dependencia. Renómbrala (p. ej. según el trámite o el tipo documental).')
    }
    // ERROR: sin tipologías
    if (g.tipologias.size === 0) {
      add('error', 'sin_tipologias', g,
        'No tiene tipologías documentales registradas.',
        'Toda serie/subserie debe listar sus tipos documentales.')
    }
    // ERROR: disposición faltante o inválida
    if (!g.disp) {
      add('error', 'sin_disposicion', g,
        'No tiene disposición final definida (CT/E/S/M).',
        'Asigna la disposición en la valoración o en la regla de retención.')
    } else if (g.disp === 'INVALIDA') {
      add('error', 'disposicion_invalida', g,
        'La disposición final no es un valor válido (debe ser CT, E, S o M).',
        'Corrige la disposición a Conservación Total, Eliminación, Selección o Medio Técnico.')
    }
    // ADVERTENCIA: retención faltante
    if (g.ag == null || g.ac == null) {
      add('advertencia', 'retencion_faltante', g,
        'Falta el tiempo de retención en Archivo de Gestión (AG) o Central (AC).',
        'Define AG y AC en años.')
    } else {
      const ag = Number(g.ag), ac = Number(g.ac)
      // ADVERTENCIA: retención en cero total
      if (ag + ac === 0) {
        add('advertencia', 'retencion_cero', g,
          'La retención total (AG + AC) es 0 años.',
          'Verifica los tiempos de retención.')
      }
      // ADVERTENCIA: valores negativos
      if (ag < 0 || ac < 0) {
        add('advertencia', 'retencion_negativa', g, 'La retención tiene valores negativos.', 'Corrige los años.')
      }
      // ADVERTENCIA: conservación total sin archivo central
      if (g.disp === 'CT' && ac === 0) {
        add('advertencia', 'ct_sin_central', g,
          'Conservación Total pero sin tiempo en Archivo Central.',
          'La CT normalmente implica retención en central antes de transferir al histórico.')
      }
    }
    // ADVERTENCIA: confianza baja del motor
    if (g.confianza != null && Number(g.confianza) < 0.6) {
      add('advertencia', 'confianza_baja', g,
        `Clasificación con baja confianza del motor (${Math.round(Number(g.confianza) * 100)}%).`,
        'Revisa que la serie/subserie sea la correcta.')
    }
  }

  // INFO: posibles duplicados por serie (nombres casi iguales)
  const porRaizSerie = new Map()
  for (const g of gruposArr) {
    const r = raiz(g.serie)
    if (!porRaizSerie.has(r)) porRaizSerie.set(r, new Set())
    porRaizSerie.get(r).add(g.serie)
  }
  for (const [, nombres] of porRaizSerie) {
    if (nombres.size > 1) {
      const lista = [...nombres]
      hallazgos.push({
        severidad: 'info', tipo: 'posible_duplicado_serie',
        serie: lista.join(' / '), subserie: null,
        mensaje: `Series con nombres muy parecidos: ${lista.join(', ')}.`,
        sugerencia: 'Si son la misma, fusiónalas (selecciona las filas → Fusionar).'
      })
    }
  }

  const errores = hallazgos.filter(h => h.severidad === 'error').length
  const advertencias = hallazgos.filter(h => h.severidad === 'advertencia').length
  const informativos = hallazgos.filter(h => h.severidad === 'info').length

  // Orden: errores → advertencias → info
  const peso = { error: 0, advertencia: 1, info: 2 }
  hallazgos.sort((a, b) => peso[a.severidad] - peso[b.severidad])

  return {
    resumen: {
      series_evaluadas: gruposArr.length,
      errores, advertencias, informativos,
      lista_para_comite: errores === 0
    },
    hallazgos
  }
}

// ---------- Ruta ----------

export function registrarValidador(router, db, guard) {
  const mw = typeof guard === 'function' ? guard : (req, res, next) => next()
  router.get('/validar', mw, async (req, res) => {
    try {
      const resultado = await validarTRD(db, req.entidad_id || null)
      return res.json({ ok: true, ...resultado })
    } catch (err) {
      console.error('TRD validar error:', err)
      return res.status(500).json({ ok: false, error: 'No se pudo validar la TRD' })
    }
  })
}
