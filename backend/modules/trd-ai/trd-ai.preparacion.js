// =====================================================
// SIPAD · Preparación para el comité (readiness)
// -----------------------------------------------------
// Consolida en un solo lugar el estado de la TRD de una
// entidad y responde: ¿está lista para llevar al comité /
// radicar? y ¿qué falta? Reutiliza el validador, la
// convalidación y conteos directos. Sin migración.
// =====================================================

import { validarTRD } from './trd-ai.validador.js'
import { obtenerConvalidacion } from './trd-ai.convalidacion.js'

export async function obtenerPreparacion(db, entidadId) {

  const cond = entidadId ? 'WHERE entidad_id = ?' : ''
  const params = entidadId ? [entidadId] : []

  // Conteo de propuestas por estado
  const filas = await db.all(
    `SELECT estado, COUNT(*) AS n FROM trd_series_propuestas ${cond} GROUP BY estado`, params
  )
  const por = {}
  filas.forEach(f => { por[f.estado] = Number(f.n) })
  const total = Object.values(por).reduce((a, b) => a + b, 0)
  const aprobadas = (por.aprobada || 0) + (por.incorporada || 0)

  // Actividades ICAF registradas
  let actividades = 0
  try {
    const a = await db.get(`SELECT COUNT(*) AS n FROM segtec_actividades ${entidadId ? 'WHERE entidad_id = ?' : ''}`, params)
    actividades = Number(a?.n || 0)
  } catch { /* tabla ausente en algún entorno */ }

  // Valoración: aprobadas/incorporadas con regla de retención
  let valoradas = 0
  try {
    const v = await db.get(
      `SELECT COUNT(DISTINCT p.id) AS n
         FROM trd_series_propuestas p
         JOIN trd_reglas_retencion r ON r.propuesta_id = p.id
        WHERE p.estado IN ('aprobada','incorporada') ${entidadId ? 'AND p.entidad_id = ?' : ''}`, params)
    valoradas = Number(v?.n || 0)
  } catch { /* ignorar */ }

  // Validador normativo
  let val = { series_evaluadas: 0, errores: 0, advertencias: 0, informativos: 0, lista_para_comite: false }
  try {
    const r = await validarTRD(db, entidadId)
    val = r.resumen || val
  } catch { /* ignorar */ }

  // Convalidación
  let conv = { estado: 'borrador', observaciones_pendientes: 0 }
  try {
    const c = await obtenerConvalidacion(db, entidadId)
    conv = { estado: c.estado, observaciones_pendientes: c.observaciones_pendientes }
  } catch { /* ignorar */ }

  // ── Checklist de preparación ──
  const st = (ok, warn) => (ok ? 'ok' : (warn ? 'warn' : 'pend'))
  const pasos = [
    {
      clave: 'icaf',
      titulo: 'Actividades registradas (ICAF)',
      estado: st(actividades > 0),
      detalle: `${actividades} actividad${actividades === 1 ? '' : 'es'} identificada${actividades === 1 ? '' : 's'}.`
    },
    {
      clave: 'propuestas',
      titulo: 'Propuestas de series generadas',
      estado: st(total > 0),
      detalle: `${total} propuesta${total === 1 ? '' : 's'} en total.`
    },
    {
      clave: 'aprobadas',
      titulo: 'Series aprobadas',
      estado: st(aprobadas > 0),
      detalle: aprobadas > 0 ? `${aprobadas} aprobada${aprobadas === 1 ? '' : 's'}.` : 'Aún no has aprobado propuestas.'
    },
    {
      clave: 'valoracion',
      titulo: 'Valoración completa',
      estado: aprobadas === 0 ? 'pend' : st(valoradas >= aprobadas, valoradas > 0),
      detalle: aprobadas === 0
        ? 'Requiere series aprobadas.'
        : `${valoradas} de ${aprobadas} aprobadas con retención y disposición.`
    },
    {
      clave: 'validador',
      titulo: 'Sin errores normativos',
      estado: val.errores === 0 ? (val.series_evaluadas > 0 ? 'ok' : 'pend') : 'warn',
      detalle: val.errores === 0
        ? (val.series_evaluadas > 0 ? 'La revisión no encontró errores que bloqueen.' : 'Aún no hay series que revisar.')
        : `${val.errores} error${val.errores === 1 ? '' : 'es'} por corregir · ${val.advertencias} advertencia(s).`
    },
    {
      clave: 'observaciones',
      titulo: 'Observaciones del comité resueltas',
      estado: conv.observaciones_pendientes === 0 ? 'ok' : 'warn',
      detalle: conv.observaciones_pendientes === 0
        ? 'Sin observaciones pendientes.'
        : `${conv.observaciones_pendientes} observación(es) pendiente(s).`
    }
  ]

  const listo = aprobadas > 0 && val.errores === 0 && conv.observaciones_pendientes === 0
  const pasosOk = pasos.filter(p => p.estado === 'ok').length

  return {
    listo,
    progreso: Math.round((pasosOk / pasos.length) * 100),
    total, por, aprobadas, actividades, valoradas,
    validacion: val,
    convalidacion: conv,
    pasos
  }
}

// ---------- Ruta ----------
export function registrarPreparacion(router, db, guard) {
  const mw = typeof guard === 'function' ? guard : (req, res, next) => next()
  router.get('/preparacion', mw, async (req, res) => {
    try {
      return res.json({ ok: true, ...(await obtenerPreparacion(db, req.entidad_id || null)) })
    } catch (err) {
      console.error('Preparación error:', err)
      return res.status(500).json({ ok: false, error: 'No se pudo calcular la preparación' })
    }
  })
}
