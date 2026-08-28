// =====================================================
// SIPAD · Asignación de dependencia a las propuestas
// -----------------------------------------------------
// Permite ubicar cada serie/subserie en la dependencia
// productora dentro de la estructura de la entidad. Es
// clave para las propuestas que NO vienen de una actividad
// (p. ej. las precargadas de la biblioteca de referencia),
// que de otro modo el CCD y el export agrupan como
// "Sin dependencia asignada".
//
// La dependencia asignada a la propuesta tiene prioridad
// sobre la de la actividad de origen (COALESCE en las
// consultas de export/CCD/listado).
// =====================================================

// Lista las dependencias de la entidad (para el selector)
export async function listarDependencias(db, entidadId) {
  return db.all(
    `SELECT id, nombre FROM dependencias
     ${entidadId ? 'WHERE entidad_id = ?' : ''}
     ORDER BY nombre`,
    entidadId ? [entidadId] : []
  )
}

// Asigna (o limpia, si dependenciaId es null) la dependencia a varias propuestas
export async function asignarDependencia(db, { ids = [], dependenciaId = null, entidadId = null }) {
  if (!Array.isArray(ids) || !ids.length) return { ok: false, error: 'Sin propuestas seleccionadas' }

  // dependenciaId a entero o null
  let dep = null
  if (dependenciaId !== null && dependenciaId !== '' && dependenciaId !== undefined) {
    dep = parseInt(dependenciaId, 10)
    if (Number.isNaN(dep)) return { ok: false, error: 'Dependencia inválida' }

    // La dependencia debe pertenecer a la entidad (aislamiento)
    const d = await db.get(
      `SELECT id FROM dependencias WHERE id = ? ${entidadId ? 'AND entidad_id = ?' : ''}`,
      entidadId ? [dep, entidadId] : [dep]
    )
    if (!d) return { ok: false, error: 'La dependencia no pertenece a esta entidad' }
  }

  let cambiadas = 0
  for (const id of ids) {
    const r = await db.run(
      `UPDATE trd_series_propuestas SET dependencia_id = ?
       WHERE id = ? ${entidadId ? 'AND entidad_id = ?' : ''}`,
      entidadId ? [dep, id, entidadId] : [dep, id]
    )
    cambiadas += (r?.changes || 0)
  }
  return { ok: true, cambiadas }
}

// ---------- Rutas ----------
export function registrarAsignacion(router, db, guard) {
  const mw = typeof guard === 'function' ? guard : (req, res, next) => next()

  // Dependencias de la entidad (para el selector de la tabla)
  router.get('/dependencias', mw, async (req, res) => {
    try {
      const deps = await listarDependencias(db, req.entidad_id || null)
      return res.json({ ok: true, dependencias: deps })
    } catch (err) {
      console.error('Dependencias list error:', err)
      return res.status(500).json({ ok: false, error: 'No se pudieron cargar las dependencias' })
    }
  })

  // Asignar dependencia en lote
  router.post('/series-propuestas/asignar-dependencia', mw, async (req, res) => {
    try {
      const r = await asignarDependencia(db, {
        ids: req.body?.ids,
        dependenciaId: req.body?.dependenciaId ?? null,
        entidadId: req.entidad_id || null
      })
      if (!r.ok) return res.status(400).json(r)
      return res.json(r)
    } catch (err) {
      console.error('Asignar dependencia error:', err)
      return res.status(500).json({ ok: false, error: 'No se pudo asignar la dependencia' })
    }
  })
}
