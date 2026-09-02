// =====================================================
// CONVALIDACIÓN DE LA TRD (flujo post-comité)
// -----------------------------------------------------
// Lleva el proceso de una entidad desde el borrador hasta la
// radicación ante el Consejo Departamental de Archivos / AGN:
//   borrador → en_comite → con_observaciones →
//   aprobada_comite → convalidada → radicada
//
// Registra los datos del acto administrativo y la radicación,
// y gestiona las OBSERVACIONES del comité (pendiente → resuelta).
//
// Multi-tenant: todo se filtra por entidad_id.
// =====================================================

import crypto from 'crypto'

// Orden y etiquetas de los estados del proceso
export const ESTADOS_CONVALIDACION = [
  { clave: 'borrador',          etiqueta: 'Borrador',                descripcion: 'TRD en construcción/curación.' },
  { clave: 'en_comite',         etiqueta: 'En comité',               descripcion: 'Presentada al Comité institucional de gestión y desempeño.' },
  { clave: 'con_observaciones', etiqueta: 'Con observaciones',       descripcion: 'El comité dejó observaciones por resolver.' },
  { clave: 'aprobada_comite',   etiqueta: 'Aprobada por el comité',  descripcion: 'Avalada internamente; lista para acto administrativo.' },
  { clave: 'convalidada',       etiqueta: 'Convalidada',             descripcion: 'Convalidada por el Consejo Departamental de Archivos.' },
  { clave: 'radicada',          etiqueta: 'Radicada',                descripcion: 'Radicada/registrada ante el AGN.' }
]

const CLAVES = ESTADOS_CONVALIDACION.map(e => e.clave)
const now = () => new Date().toISOString()

// =====================================================
// OBTENER (crea la fila si no existe)
// =====================================================

export async function obtenerConvalidacion(db, entidadId) {

  let row = await db.get(
    `SELECT * FROM trd_convalidacion WHERE entidad_id ${entidadId ? '= ?' : 'IS NULL'}`,
    entidadId ? [entidadId] : []
  )

  if (!row) {
    const id = crypto.randomUUID()
    await db.run(
      `INSERT INTO trd_convalidacion (id, entidad_id, estado, actualizado_en) VALUES (?, ?, ?, ?)`,
      [id, entidadId, 'borrador', now()]
    )
    row = await db.get(`SELECT * FROM trd_convalidacion WHERE id = ?`, [id])
  }

  // Métricas de apoyo para la vista
  const pend = await db.get(
    `SELECT COUNT(*) AS n FROM trd_observaciones WHERE estado = 'pendiente' AND entidad_id ${entidadId ? '= ?' : 'IS NULL'}`,
    entidadId ? [entidadId] : []
  )
  const resu = await db.get(
    `SELECT COUNT(*) AS n FROM trd_observaciones WHERE estado = 'resuelta' AND entidad_id ${entidadId ? '= ?' : 'IS NULL'}`,
    entidadId ? [entidadId] : []
  )
  const aprob = await db.get(
    `SELECT COUNT(*) AS n FROM trd_series_propuestas WHERE estado IN ('aprobada','incorporada') AND entidad_id ${entidadId ? '= ?' : 'IS NULL'}`,
    entidadId ? [entidadId] : []
  )

  return {
    ...row,
    observaciones_pendientes: Number(pend?.n || 0),
    observaciones_resueltas:  Number(resu?.n || 0),
    series_aprobadas:         Number(aprob?.n || 0),
    estados: ESTADOS_CONVALIDACION
  }
}

// =====================================================
// ACTUALIZAR estado / datos del acto / radicación
// =====================================================

export async function actualizarConvalidacion(db, entidadId, campos = {}) {

  await obtenerConvalidacion(db, entidadId) // garantiza que exista

  const permitidos = [
    'estado', 'fecha_comite', 'numero_acta',
    'acto_administrativo', 'numero_acto', 'fecha_acto',
    'radicado_numero', 'radicado_fecha', 'nota',
    'asistentes', 'presidente_comite', 'secretario_comite'
  ]

  const sets = []
  const vals = []
  for (const k of permitidos) {
    if (campos[k] === undefined) continue
    if (k === 'estado' && !CLAVES.includes(campos[k])) {
      return { ok: false, error: `Estado inválido: ${campos[k]}` }
    }
    let v = campos[k]
    // asistentes puede llegar como arreglo → se guarda como JSON
    if (k === 'asistentes' && Array.isArray(v)) v = JSON.stringify(v)
    sets.push(`${k} = ?`)
    vals.push(v === '' ? null : v)
  }

  if (!sets.length) return { ok: true, sinCambios: true }

  sets.push(`actualizado_en = ?`)
  vals.push(now())
  vals.push(entidadId)

  await db.run(
    `UPDATE trd_convalidacion SET ${sets.join(', ')} WHERE entidad_id ${entidadId ? '= ?' : 'IS NULL'}`,
    entidadId ? vals : vals.slice(0, -1)
  )

  return { ok: true, convalidacion: await obtenerConvalidacion(db, entidadId) }
}

// =====================================================
// OBSERVACIONES
// =====================================================

export async function listarObservaciones(db, entidadId, { estado = null } = {}) {
  const cond = [`entidad_id ${entidadId ? '= ?' : 'IS NULL'}`]
  const params = entidadId ? [entidadId] : []
  if (estado) { cond.push(`estado = ?`); params.push(estado) }
  return db.all(
    `SELECT * FROM trd_observaciones WHERE ${cond.join(' AND ')} ORDER BY estado DESC, creado_en DESC`,
    params
  )
}

export async function crearObservacion(db, entidadId, { serie = null, subserie = null, texto, origen = 'comite', autor = null }) {
  if (!texto || !texto.trim()) return { ok: false, error: 'La observación no puede estar vacía' }
  const id = crypto.randomUUID()
  await db.run(
    `INSERT INTO trd_observaciones (id, entidad_id, serie, subserie, texto, origen, estado, autor, creado_en)
     VALUES (?, ?, ?, ?, ?, ?, 'pendiente', ?, ?)`,
    [id, entidadId, serie || null, subserie || null, texto.trim(), origen || 'comite', autor || null, now()]
  )
  return { ok: true, id }
}

export async function resolverObservacion(db, id, entidadId, { respuesta = null } = {}) {
  const row = await db.get(
    `SELECT id FROM trd_observaciones WHERE id = ? AND entidad_id ${entidadId ? '= ?' : 'IS NULL'}`,
    entidadId ? [id, entidadId] : [id]
  )
  if (!row) return { ok: false, error: 'Observación no encontrada' }
  await db.run(
    `UPDATE trd_observaciones SET estado = 'resuelta', respuesta = ?, resuelto_en = ? WHERE id = ?`,
    [respuesta || null, now(), id]
  )
  return { ok: true }
}

export async function reabrirObservacion(db, id, entidadId) {
  const row = await db.get(
    `SELECT id FROM trd_observaciones WHERE id = ? AND entidad_id ${entidadId ? '= ?' : 'IS NULL'}`,
    entidadId ? [id, entidadId] : [id]
  )
  if (!row) return { ok: false, error: 'Observación no encontrada' }
  await db.run(`UPDATE trd_observaciones SET estado = 'pendiente', resuelto_en = NULL WHERE id = ?`, [id])
  return { ok: true }
}

export async function eliminarObservacion(db, id, entidadId) {
  const r = await db.run(
    `DELETE FROM trd_observaciones WHERE id = ? AND entidad_id ${entidadId ? '= ?' : 'IS NULL'}`,
    entidadId ? [id, entidadId] : [id]
  )
  return { ok: true, changes: r?.changes || 0 }
}

// =====================================================
// RUTAS
//   GET   /api/trd-ai/convalidacion
//   PATCH /api/trd-ai/convalidacion
//   GET   /api/trd-ai/convalidacion/observaciones
//   POST  /api/trd-ai/convalidacion/observaciones
//   PATCH /api/trd-ai/convalidacion/observaciones/:id/resolver
//   PATCH /api/trd-ai/convalidacion/observaciones/:id/reabrir
//   DELETE/api/trd-ai/convalidacion/observaciones/:id
// =====================================================

export function registrarConvalidacion(router, db, guard) {
  const mw = typeof guard === 'function' ? guard : (req, res, next) => next()
  const ent = req => req.entidad_id || null
  const autor = req => req.user?.nombre || req.user?.username || req.user?.sub || null

  router.get('/convalidacion', mw, async (req, res) => {
    try {
      return res.json({ ok: true, ...(await obtenerConvalidacion(db, ent(req))) })
    } catch (err) {
      console.error('Convalidación get error:', err)
      return res.status(500).json({ ok: false, error: 'No se pudo cargar la convalidación' })
    }
  })

  router.patch('/convalidacion', mw, async (req, res) => {
    try {
      const r = await actualizarConvalidacion(db, ent(req), req.body || {})
      if (!r.ok) return res.status(400).json(r)
      return res.json(r)
    } catch (err) {
      console.error('Convalidación patch error:', err)
      return res.status(500).json({ ok: false, error: 'No se pudo actualizar' })
    }
  })

  router.get('/convalidacion/observaciones', mw, async (req, res) => {
    try {
      const obs = await listarObservaciones(db, ent(req), { estado: req.query?.estado || null })
      return res.json({ ok: true, observaciones: obs })
    } catch (err) {
      console.error('Observaciones list error:', err)
      return res.status(500).json({ ok: false, error: 'No se pudieron cargar las observaciones' })
    }
  })

  router.post('/convalidacion/observaciones', mw, async (req, res) => {
    try {
      const r = await crearObservacion(db, ent(req), { ...(req.body || {}), autor: autor(req) })
      if (!r.ok) return res.status(400).json(r)
      return res.json(r)
    } catch (err) {
      console.error('Observación crear error:', err)
      return res.status(500).json({ ok: false, error: 'No se pudo crear la observación' })
    }
  })

  router.patch('/convalidacion/observaciones/:id/resolver', mw, async (req, res) => {
    try {
      const r = await resolverObservacion(db, req.params.id, ent(req), { respuesta: req.body?.respuesta })
      if (!r.ok) return res.status(404).json(r)
      return res.json(r)
    } catch (err) {
      console.error('Observación resolver error:', err)
      return res.status(500).json({ ok: false, error: 'No se pudo resolver' })
    }
  })

  router.patch('/convalidacion/observaciones/:id/reabrir', mw, async (req, res) => {
    try {
      const r = await reabrirObservacion(db, req.params.id, ent(req))
      if (!r.ok) return res.status(404).json(r)
      return res.json(r)
    } catch (err) {
      console.error('Observación reabrir error:', err)
      return res.status(500).json({ ok: false, error: 'No se pudo reabrir' })
    }
  })

  router.delete('/convalidacion/observaciones/:id', mw, async (req, res) => {
    try {
      const r = await eliminarObservacion(db, req.params.id, ent(req))
      return res.json(r)
    } catch (err) {
      console.error('Observación eliminar error:', err)
      return res.status(500).json({ ok: false, error: 'No se pudo eliminar' })
    }
  })
}
