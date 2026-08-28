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

// Borra SOLO dependencias sin uso y de la entidad (nunca referenciadas)
export async function eliminarDependenciasSinUso(db, { ids = [], entidadId = null } = {}) {
  if (!entidadId) return { ok: false, error: 'Sin entidad en contexto' }
  if (!Array.isArray(ids) || !ids.length) return { ok: false, error: 'Sin dependencias seleccionadas' }

  let eliminadas = 0
  const omitidas = []

  for (const id of ids) {
    // Debe pertenecer a la entidad
    const dep = await db.get(`SELECT id, nombre FROM dependencias WHERE id = ? AND entidad_id = ?`, [id, entidadId])
    if (!dep) { omitidas.push({ id, motivo: 'no pertenece a la entidad' }); continue }

    // No debe tener referencias
    const act = await db.get(`SELECT COUNT(*) AS n FROM segtec_actividades   WHERE dependencia_id = ?`, [id])
    const pro = await db.get(`SELECT COUNT(*) AS n FROM trd_series_propuestas WHERE dependencia_id = ?`, [id])
    const ser = await db.get(`SELECT COUNT(*) AS n FROM series               WHERE dependencia_id = ?`, [id])
    const usos = Number(act?.n || 0) + Number(pro?.n || 0) + Number(ser?.n || 0)
    if (usos > 0) { omitidas.push({ id, nombre: dep.nombre, motivo: `en uso (${usos} referencia(s))` }); continue }

    await db.run(`DELETE FROM dependencias WHERE id = ? AND entidad_id = ?`, [id, entidadId])
    eliminadas++
  }

  return { ok: true, eliminadas, omitidas }
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
      const r = await eliminarDependenciasSinUso(db, { ids: req.body?.ids, entidadId: req.entidad_id || null })
      if (!r.ok) return res.status(400).json(r)
      return res.json(r)
    } catch (err) {
      console.error('Auditoría eliminar error:', err)
      return res.status(500).json({ ok: false, error: 'No se pudieron eliminar' })
    }
  })
}
