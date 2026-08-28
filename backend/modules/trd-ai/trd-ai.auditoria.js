// =====================================================
// SIPAD · Auditoría de dependencias (higiene de datos)
// -----------------------------------------------------
// Para una entidad, lista sus dependencias con cuántas
// actividades, propuestas y series de la TRD las referencian.
// Marca duplicadas (mismo nombre) y sin uso (0 referencias).
// Permite borrar de forma SEGURA solo las que no tienen uso
// (nunca rompe datos: rechaza borrar una referenciada).
// Todo aislado por entidad_id.
// =====================================================

function norm(s) {
  return (s || '').toString().normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .trim().toLowerCase().replace(/\s+/g, ' ')
}

export async function obtenerAuditoriaDependencias(db, entidadId) {
  if (!entidadId) return { ok: false, error: 'Sin entidad en contexto' }

  const rows = await db.all(`
    SELECT d.id, d.nombre, d.activa, d.created_at,
      (SELECT COUNT(*) FROM segtec_actividades a   WHERE a.dependencia_id  = d.id) AS actividades,
      (SELECT COUNT(*) FROM trd_series_propuestas p WHERE p.dependencia_id = d.id) AS propuestas,
      (SELECT COUNT(*) FROM series s               WHERE s.dependencia_id  = d.id) AS series
    FROM dependencias d
    WHERE d.entidad_id = ?
    ORDER BY d.nombre, d.created_at
  `, [entidadId])

  // Conteo por nombre normalizado → para marcar duplicadas
  const porNombre = {}
  rows.forEach(r => { const k = norm(r.nombre); porNombre[k] = (porNombre[k] || 0) + 1 })

  const dependencias = rows.map(r => {
    const act = Number(r.actividades || 0)
    const pro = Number(r.propuestas || 0)
    const ser = Number(r.series || 0)
    const usos = act + pro + ser
    return {
      id: r.id,
      nombre: r.nombre,
      activa: r.activa,
      created_at: r.created_at,
      actividades: act,
      propuestas: pro,
      series: ser,
      usos,
      sin_uso: usos === 0,
      duplicada: porNombre[norm(r.nombre)] > 1
    }
  })

  return {
    ok: true,
    resumen: {
      total: dependencias.length,
      sin_uso: dependencias.filter(d => d.sin_uso).length,
      duplicadas: dependencias.filter(d => d.duplicada).length
    },
    dependencias
  }
}

// Purga en cascada una dependencia + sus datos asociados (series de la TRD
// con sus subseries/tipologías, propuestas con sus reglas, y actividades con
// sus propuestas). Borra hijos antes que padres para no romper llaves foráneas.
async function purgarDependencia(db, id) {
  const removed = { series: 0, subseries: 0, tipologias: 0, propuestas: 0, reglas: 0, actividades: 0 }

  // 1) Series oficiales que apuntan a la dependencia → subseries → tipologías
  const series = await db.all(`SELECT id FROM series WHERE dependencia_id = ?`, [id])
  for (const s of series) {
    const subs = await db.all(`SELECT id FROM subseries WHERE serie_id = ?`, [s.id])
    for (const sub of subs) {
      const r = await db.run(`DELETE FROM tipologias WHERE subserie_id = ?`, [sub.id]); removed.tipologias += r?.changes || 0
    }
    const r2 = await db.run(`DELETE FROM subseries WHERE serie_id = ?`, [s.id]); removed.subseries += r2?.changes || 0
    const r3 = await db.run(`DELETE FROM series WHERE id = ?`, [s.id]);          removed.series += r3?.changes || 0
  }

  // 2) Propuestas que apuntan directo a la dependencia → sus reglas
  const props = await db.all(`SELECT id FROM trd_series_propuestas WHERE dependencia_id = ?`, [id])
  for (const p of props) {
    const r = await db.run(`DELETE FROM trd_reglas_retencion WHERE propuesta_id = ?`, [p.id]); removed.reglas += r?.changes || 0
    const r2 = await db.run(`DELETE FROM trd_series_propuestas WHERE id = ?`, [p.id]);          removed.propuestas += r2?.changes || 0
  }

  // 3) Actividades de la dependencia → sus propuestas (por actividad_id) → reglas → la actividad
  const acts = await db.all(`SELECT id FROM segtec_actividades WHERE dependencia_id = ?`, [id])
  for (const a of acts) {
    const aprops = await db.all(`SELECT id FROM trd_series_propuestas WHERE actividad_id = ?`, [a.id])
    for (const p of aprops) {
      const r = await db.run(`DELETE FROM trd_reglas_retencion WHERE propuesta_id = ?`, [p.id]); removed.reglas += r?.changes || 0
      const r2 = await db.run(`DELETE FROM trd_series_propuestas WHERE id = ?`, [p.id]);          removed.propuestas += r2?.changes || 0
    }
    const r3 = await db.run(`DELETE FROM segtec_actividades WHERE id = ?`, [a.id]); removed.actividades += r3?.changes || 0
  }

  return removed
}

// Elimina dependencias de la entidad.
//   modo 'sin_uso' (por defecto): solo las que NO tienen referencias (100% seguro).
//   modo 'cascada': purga también sus datos de prueba asociados (para limpiar
//   dependencias ficticias con actividades/propuestas/series colgando).
export async function eliminarDependencias(db, { ids = [], entidadId = null, modo = 'sin_uso' } = {}) {
  if (!entidadId) return { ok: false, error: 'Sin entidad en contexto' }
  if (!Array.isArray(ids) || !ids.length) return { ok: false, error: 'Sin dependencias seleccionadas' }

  let eliminadas = 0
  const omitidas = []
  const purgado = { series: 0, subseries: 0, tipologias: 0, propuestas: 0, reglas: 0, actividades: 0 }

  for (const id of ids) {
    const dep = await db.get(`SELECT id, nombre FROM dependencias WHERE id = ? AND entidad_id = ?`, [id, entidadId])
    if (!dep) { omitidas.push({ id, motivo: 'no pertenece a la entidad' }); continue }

    const act = await db.get(`SELECT COUNT(*) AS n FROM segtec_actividades   WHERE dependencia_id = ?`, [id])
    const pro = await db.get(`SELECT COUNT(*) AS n FROM trd_series_propuestas WHERE dependencia_id = ?`, [id])
    const ser = await db.get(`SELECT COUNT(*) AS n FROM series               WHERE dependencia_id = ?`, [id])
    const usos = Number(act?.n || 0) + Number(pro?.n || 0) + Number(ser?.n || 0)

    if (usos > 0) {
      if (modo !== 'cascada') {
        omitidas.push({ id, nombre: dep.nombre, motivo: `en uso (${usos} referencia(s))` })
        continue
      }
      const rem = await purgarDependencia(db, id)
      for (const k of Object.keys(purgado)) purgado[k] += rem[k]
    }

    await db.run(`DELETE FROM dependencias WHERE id = ? AND entidad_id = ?`, [id, entidadId])
    eliminadas++
  }

  return { ok: true, eliminadas, omitidas, purgado }
}

// Compatibilidad: mantiene el nombre anterior (solo sin uso)
export async function eliminarDependenciasSinUso(db, opts) {
  return eliminarDependencias(db, { ...opts, modo: 'sin_uso' })
}

// ---------- Rutas ----------
export function registrarAuditoria(router, db, guard) {
  const mw = typeof guard === 'function' ? guard : (req, res, next) => next()

  router.get('/auditoria-dependencias', mw, async (req, res) => {
    try {
      const r = await obtenerAuditoriaDependencias(db, req.entidad_id || null)
      if (!r.ok) return res.status(400).json(r)
      return res.json(r)
    } catch (err) {
      console.error('Auditoría dependencias error:', err)
      return res.status(500).json({ ok: false, error: 'No se pudo generar la auditoría' })
    }
  })

  router.post('/auditoria-dependencias/eliminar', mw, async (req, res) => {
    try {
      const modo = req.body?.modo === 'cascada' ? 'cascada' : 'sin_uso'
      const r = await eliminarDependencias(db, { ids: req.body?.ids, entidadId: req.entidad_id || null, modo })
      if (!r.ok) return res.status(400).json(r)
      return res.json(r)
    } catch (err) {
      console.error('Auditoría eliminar error:', err)
      return res.status(500).json({ ok: false, error: 'No se pudieron eliminar' })
    }
  })
}
