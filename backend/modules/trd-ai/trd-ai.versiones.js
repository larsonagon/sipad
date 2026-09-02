// ======================================================
// SIPAD · Versionado y vigencia de la TRD
// ------------------------------------------------------
// Registro de versiones de la TRD por entidad, con su ciclo de
// vigencia y el acto administrativo que la adopta. Reutiliza la
// tabla trd_versiones (estado: borrador|en_revision|aprobada|
// derogada) y añade, de forma aditiva, un snapshot inmutable de
// la TRD aprobada al congelar una versión.
//
//   • Crear versión (borrador).
//   • Congelar: guarda un snapshot JSON de la TRD aprobada actual.
//   • Poner vigente: marca aprobada + fecha de inicio de vigencia,
//     y deroga automáticamente la versión vigente anterior.
//   • Historial y versión vigente.
//
// Todo aislado por entidad_id.
// ======================================================

import crypto from 'crypto'
import { obtenerDatosExport } from './trd-ai.export.js'

const now = () => new Date().toISOString()
const hoy = () => new Date().toISOString().slice(0, 10)

// Garantiza la columna snapshot (aditivo, idempotente). Se llama al
// registrar rutas por si la migración principal aún no la creó.
export async function asegurarColumnaSnapshot(db) {
  try { await db.exec(`ALTER TABLE trd_versiones ADD COLUMN snapshot TEXT`) } catch { /* ya existe */ }
  try { await db.exec(`ALTER TABLE trd_versiones ADD COLUMN creado_en TEXT`) } catch { /* ya existe */ }
}

// ---------- Consultas ----------

export async function listarVersiones(db, entidadId) {
  const rows = await db.all(
    `SELECT id, nombre_version, modo_creacion, estado,
            fecha_inicio_vigencia, fecha_fin_vigencia,
            acto_administrativo, numero_acto, fecha_acto, observaciones,
            creado_en,
            CASE WHEN snapshot IS NULL OR snapshot = '' THEN 0 ELSE 1 END AS tiene_snapshot
     FROM trd_versiones
     WHERE entidad_id ${entidadId ? '= ?' : 'IS NULL'}
     ORDER BY COALESCE(fecha_inicio_vigencia, creado_en, '') DESC, nombre_version DESC`,
    entidadId ? [entidadId] : []
  )
  const vigente = rows.find(v => v.estado === 'aprobada' && !v.fecha_fin_vigencia) || null
  return {
    versiones: rows.map(v => ({ ...v, tiene_snapshot: !!v.tiene_snapshot, vigente: vigente && v.id === vigente.id })),
    vigente_id: vigente?.id || null,
    resumen: {
      total: rows.length,
      vigente: vigente ? (vigente.nombre_version || '(sin nombre)') : null,
      borradores: rows.filter(v => v.estado === 'borrador').length,
      derogadas: rows.filter(v => v.estado === 'derogada').length
    }
  }
}

export async function obtenerVigente(db, entidadId) {
  return db.get(
    `SELECT * FROM trd_versiones
     WHERE estado = 'aprobada' AND fecha_fin_vigencia IS NULL
       AND entidad_id ${entidadId ? '= ?' : 'IS NULL'}
     ORDER BY fecha_inicio_vigencia DESC LIMIT 1`,
    entidadId ? [entidadId] : []
  )
}

// ---------- Comandos ----------

export async function crearVersion(db, entidadId, { nombre_version, modo_creacion = 'asistido', observaciones = null } = {}) {
  const nombre = (nombre_version || '').trim()
  if (!nombre) return { ok: false, error: 'El nombre de la versión es obligatorio (p. ej. "TRD v1 - 2026").' }
  const modo = ['manual', 'asistido', 'mixto'].includes(modo_creacion) ? modo_creacion : 'asistido'
  const id = crypto.randomUUID()
  await db.run(
    `INSERT INTO trd_versiones (id, nombre_version, modo_creacion, estado, observaciones, entidad_id, creado_en)
     VALUES (?, ?, ?, 'borrador', ?, ?, ?)`,
    [id, nombre, modo, observaciones || null, entidadId, now()]
  )
  return { ok: true, id }
}

// Congela un snapshot inmutable de la TRD aprobada actual dentro de la versión.
export async function congelarVersion(db, entidadId, versionId) {
  const v = await db.get(
    `SELECT id FROM trd_versiones WHERE id = ? AND entidad_id ${entidadId ? '= ?' : 'IS NULL'}`,
    entidadId ? [versionId, entidadId] : [versionId]
  )
  if (!v) return { ok: false, error: 'Versión no encontrada' }
  const datos = await obtenerDatosExport(db, entidadId)
  const totalSeries = datos.reduce((a, d) => a + d.series.length, 0)
  if (!totalSeries) return { ok: false, error: 'No hay series aprobadas para congelar en esta versión.' }
  const snap = { congelado_en: now(), dependencias: datos.length, series: totalSeries, trd: datos }
  await db.run(`UPDATE trd_versiones SET snapshot = ? WHERE id = ?`, [JSON.stringify(snap), versionId])
  return { ok: true, series: totalSeries, dependencias: datos.length }
}

export async function obtenerSnapshot(db, entidadId, versionId) {
  const v = await db.get(
    `SELECT snapshot FROM trd_versiones WHERE id = ? AND entidad_id ${entidadId ? '= ?' : 'IS NULL'}`,
    entidadId ? [versionId, entidadId] : [versionId]
  )
  if (!v) return { ok: false, error: 'Versión no encontrada' }
  if (!v.snapshot) return { ok: true, snapshot: null }
  try { return { ok: true, snapshot: JSON.parse(v.snapshot) } }
  catch { return { ok: false, error: 'Snapshot corrupto' } }
}

// Pone una versión como vigente: la marca aprobada con fecha de inicio,
// registra el acto administrativo y deroga la vigente anterior.
export async function ponerVigente(db, entidadId, versionId, { acto_administrativo = null, numero_acto = null, fecha_acto = null, fecha_inicio = null } = {}) {
  const v = await db.get(
    `SELECT id FROM trd_versiones WHERE id = ? AND entidad_id ${entidadId ? '= ?' : 'IS NULL'}`,
    entidadId ? [versionId, entidadId] : [versionId]
  )
  if (!v) return { ok: false, error: 'Versión no encontrada' }

  const inicio = fecha_inicio || hoy()

  // Derogar la vigente anterior (si existe y es distinta)
  const anterior = await obtenerVigente(db, entidadId)
  let derogada = null
  if (anterior && anterior.id !== versionId) {
    await db.run(
      `UPDATE trd_versiones SET estado = 'derogada', fecha_fin_vigencia = ? WHERE id = ?`,
      [inicio, anterior.id]
    )
    derogada = anterior.nombre_version || anterior.id
  }

  await db.run(
    `UPDATE trd_versiones
       SET estado = 'aprobada', fecha_inicio_vigencia = ?, fecha_fin_vigencia = NULL,
           acto_administrativo = COALESCE(?, acto_administrativo),
           numero_acto = COALESCE(?, numero_acto),
           fecha_acto = COALESCE(?, fecha_acto)
     WHERE id = ?`,
    [inicio, acto_administrativo || null, numero_acto || null, fecha_acto || null, versionId]
  )
  return { ok: true, vigente_desde: inicio, derogada }
}

export async function derogarVersion(db, entidadId, versionId, { fecha_fin = null } = {}) {
  const r = await db.run(
    `UPDATE trd_versiones SET estado = 'derogada', fecha_fin_vigencia = ?
     WHERE id = ? AND entidad_id ${entidadId ? '= ?' : 'IS NULL'}`,
    entidadId ? [fecha_fin || hoy(), versionId, entidadId] : [fecha_fin || hoy(), versionId]
  )
  if (!r?.changes) return { ok: false, error: 'Versión no encontrada' }
  return { ok: true }
}

export async function eliminarVersion(db, entidadId, versionId) {
  // Solo borradores sin snapshot pueden eliminarse (higiene); las aprobadas/derogadas se conservan como historial.
  const v = await db.get(
    `SELECT estado, snapshot FROM trd_versiones WHERE id = ? AND entidad_id ${entidadId ? '= ?' : 'IS NULL'}`,
    entidadId ? [versionId, entidadId] : [versionId]
  )
  if (!v) return { ok: false, error: 'Versión no encontrada' }
  if (v.estado !== 'borrador') return { ok: false, error: 'Solo se pueden eliminar versiones en borrador. Las aprobadas o derogadas se conservan como historial.' }
  await db.run(`DELETE FROM trd_versiones WHERE id = ?`, [versionId])
  return { ok: true }
}

// ---------- Rutas ----------
export function registrarVersiones(router, db, guard) {
  const mw = typeof guard === 'function' ? guard : (req, res, next) => next()
  const ent = req => req.entidad_id || null

  asegurarColumnaSnapshot(db).catch(() => {})

  router.get('/versiones', mw, async (req, res) => {
    try { return res.json({ ok: true, ...(await listarVersiones(db, ent(req))) }) }
    catch (err) { console.error('Versiones list error:', err); return res.status(500).json({ ok: false, error: 'No se pudieron cargar las versiones' }) }
  })

  router.post('/versiones', mw, async (req, res) => {
    try { const r = await crearVersion(db, ent(req), req.body || {}); return res.status(r.ok ? 200 : 400).json(r) }
    catch (err) { console.error('Versión crear error:', err); return res.status(500).json({ ok: false, error: 'No se pudo crear la versión' }) }
  })

  router.post('/versiones/:id/congelar', mw, async (req, res) => {
    try { const r = await congelarVersion(db, ent(req), req.params.id); return res.status(r.ok ? 200 : 400).json(r) }
    catch (err) { console.error('Versión congelar error:', err); return res.status(500).json({ ok: false, error: 'No se pudo congelar' }) }
  })

  router.get('/versiones/:id/snapshot', mw, async (req, res) => {
    try { const r = await obtenerSnapshot(db, ent(req), req.params.id); return res.status(r.ok ? 200 : 404).json(r) }
    catch (err) { console.error('Versión snapshot error:', err); return res.status(500).json({ ok: false, error: 'No se pudo leer el snapshot' }) }
  })

  router.post('/versiones/:id/vigente', mw, async (req, res) => {
    try { const r = await ponerVigente(db, ent(req), req.params.id, req.body || {}); return res.status(r.ok ? 200 : 400).json(r) }
    catch (err) { console.error('Versión vigente error:', err); return res.status(500).json({ ok: false, error: 'No se pudo poner vigente' }) }
  })

  router.post('/versiones/:id/derogar', mw, async (req, res) => {
    try { const r = await derogarVersion(db, ent(req), req.params.id, req.body || {}); return res.status(r.ok ? 200 : 404).json(r) }
    catch (err) { console.error('Versión derogar error:', err); return res.status(500).json({ ok: false, error: 'No se pudo derogar' }) }
  })

  router.delete('/versiones/:id', mw, async (req, res) => {
    try { const r = await eliminarVersion(db, ent(req), req.params.id); return res.status(r.ok ? 200 : 400).json(r) }
    catch (err) { console.error('Versión eliminar error:', err); return res.status(500).json({ ok: false, error: 'No se pudo eliminar' }) }
  })
}
