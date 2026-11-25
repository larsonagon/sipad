// ======================================================
// SIPAD · ICAF por enlace público — Migración y datos
// ------------------------------------------------------
// El funcionario diligencia el ICAF como un formulario abierto:
// sin usuario ni contraseña, solo escribe su nombre, elige su
// dependencia y describe sus actividades en lenguaje llano.
//
// Lo que envía NO entra directo al ICAF: queda en una bandeja
// (icafp_envios) y el asesor lo incorpora o lo descarta. Al
// incorporar se crean las actividades en segtec_actividades con
// estado 'caracterizada' (elegibles para el generador de la TRD).
//
// Aditivo e idempotente; aislamiento por entidad_id. Compatible
// con PostgreSQL (producción) y SQLite (desarrollo).
// ======================================================

import crypto from 'crypto'

const now = () => new Date().toISOString()
const nuevoId = (p) => `${p}_${crypto.randomUUID()}`
const nuevoToken = () => crypto.randomBytes(24).toString('base64url')

export const FRECUENCIAS = ['diaria', 'semanal', 'mensual', 'trimestral', 'semestral', 'anual', 'eventual']
export const FORMATOS = ['fisico', 'digital', 'ambos']
export const ESTADOS_ENLACE = ['abierta', 'cerrada']
export const ESTADOS_ENVIO = ['pendiente', 'incorporado', 'descartado']

export const LIMITES = {
  nombre: 120, cargo: 120, titulo: 200, mensaje: 2000,
  actividad: 300, descripcion: 2000, documentos: 2000, observaciones: 2000,
  actividadesPorEnvio: 30, enviosPendientes: 500
}

const TITULO_DEFECTO = 'Cuéntenos qué hace en su trabajo'

export async function runIcafPublicoMigration(db) {
  // Nombre de quien diligenció por enlace (no tiene usuario en SIPAD).
  // Va primero y por separado: los listados del ICAF leen esta columna.
  try { await db.exec(`ALTER TABLE segtec_actividades ADD COLUMN IF NOT EXISTS funcionario_externo TEXT`) }
  catch {
    try { await db.exec(`ALTER TABLE segtec_actividades ADD COLUMN funcionario_externo TEXT`) }
    catch { /* SQLite: la columna ya existe */ }
  }

  await db.exec(`
    CREATE TABLE IF NOT EXISTS icafp_enlaces (
      id              TEXT PRIMARY KEY,
      entidad_id      TEXT NOT NULL,
      token           TEXT NOT NULL,
      titulo          TEXT,
      mensaje         TEXT,
      estado          TEXT DEFAULT 'abierta',
      creado_por      TEXT,
      creado_en       TEXT,
      actualizado_en  TEXT
    );
    CREATE UNIQUE INDEX IF NOT EXISTS idx_icafp_enlaces_token ON icafp_enlaces(token);
    CREATE INDEX IF NOT EXISTS idx_icafp_enlaces_entidad ON icafp_enlaces(entidad_id);
    CREATE TABLE IF NOT EXISTS icafp_envios (
      id               TEXT PRIMARY KEY,
      enlace_id        TEXT NOT NULL,
      entidad_id       TEXT NOT NULL,
      dependencia_id   TEXT NOT NULL,
      nombre           TEXT,
      cargo            TEXT,
      actividades      TEXT,
      observaciones    TEXT,
      estado           TEXT DEFAULT 'pendiente',
      enviado_en       TEXT,
      revisado_en      TEXT,
      revisado_por     TEXT,
      actividades_ids  TEXT
    );
    CREATE INDEX IF NOT EXISTS idx_icafp_envios_entidad ON icafp_envios(entidad_id, estado);
  `)
}

// ---------------- Utilidades ----------------
function txt(v, max) {
  if (v === undefined || v === null) return null
  const s = String(v).replace(/\s+/g, ' ').trim()
  return s ? s.slice(0, max) : null
}
// Lista "uno por línea": acepta saltos de línea o punto y coma, sin repetidos.
function lineas(v, max) {
  if (v === undefined || v === null) return null
  const partes = String(v).split(/[\n;]+/).map(s => s.replace(/\s+/g, ' ').trim()).filter(Boolean)
  const s = [...new Set(partes)].join('\n').slice(0, max)
  return s || null
}
function parse(j, def) { try { return j ? JSON.parse(j) : def } catch { return def } }
const si = (v) => v === true || v === 1 || v === '1' || v === 'true' || v === 'si'

async function nombreEntidad(db, entidadId) {
  try {
    const e = await db.get(`SELECT nombre FROM entidades WHERE CAST(id AS TEXT) = ?`, [String(entidadId)])
    return e?.nombre || 'la entidad'
  } catch { return 'la entidad' }
}

// Dependencias activas de la entidad (activa es booleano en Postgres y entero en SQLite).
export async function dependenciasEntidad(db, entidadId) {
  return db.all(
    `SELECT id, nombre FROM dependencias
      WHERE CAST(entidad_id AS TEXT) = ?
        AND COALESCE(CAST(activa AS TEXT), '1') NOT IN ('0', 'false')
      ORDER BY nombre`,
    [String(entidadId)]
  )
}

// ---------------- Enlace (uno por entidad) ----------------
async function enlaceDe(db, entidadId) {
  return db.get(`SELECT * FROM icafp_enlaces WHERE entidad_id = ? ORDER BY creado_en LIMIT 1`, [String(entidadId)])
}

function publicoEnlace(l) {
  return { id: l.id, token: l.token, titulo: l.titulo, mensaje: l.mensaje, estado: l.estado, creado_en: l.creado_en, actualizado_en: l.actualizado_en }
}

async function conteos(db, entidadId) {
  const filas = await db.all(`SELECT estado, COUNT(*) AS n FROM icafp_envios WHERE entidad_id = ? GROUP BY estado`, [String(entidadId)])
  const c = { pendiente: 0, incorporado: 0, descartado: 0 }
  for (const f of filas) if (f.estado in c) c[f.estado] = Number(f.n || 0)
  return c
}

export async function obtenerEnlace(db, entidadId) {
  const l = await enlaceDe(db, entidadId)
  return { ok: true, enlace: l ? publicoEnlace(l) : null, conteos: await conteos(db, entidadId) }
}

// Crea el enlace de la entidad si no existe (queda abierto).
export async function crearEnlace(db, entidadId, body = {}, usuario = '') {
  const existe = await enlaceDe(db, entidadId)
  if (!existe) {
    const t = now()
    await db.run(
      `INSERT INTO icafp_enlaces (id, entidad_id, token, titulo, mensaje, estado, creado_por, creado_en, actualizado_en)
       VALUES (?, ?, ?, ?, ?, 'abierta', ?, ?, ?)`,
      [nuevoId('IE'), String(entidadId), nuevoToken(), txt(body.titulo, LIMITES.titulo) || TITULO_DEFECTO,
        txt(body.mensaje, LIMITES.mensaje), txt(usuario, LIMITES.nombre), t, t]
    )
  }
  return obtenerEnlace(db, entidadId)
}

export async function actualizarEnlace(db, entidadId, body = {}) {
  const l = await enlaceDe(db, entidadId)
  if (!l) return { ok: false, status: 404, error: 'Todavía no se ha creado el enlace' }
  if (body.estado !== undefined && !ESTADOS_ENLACE.includes(body.estado)) return { ok: false, status: 400, error: 'Estado no válido' }
  const titulo = body.titulo !== undefined ? (txt(body.titulo, LIMITES.titulo) || TITULO_DEFECTO) : l.titulo
  const mensaje = body.mensaje !== undefined ? txt(body.mensaje, LIMITES.mensaje) : l.mensaje
  const estado = body.estado !== undefined ? body.estado : l.estado
  await db.run(`UPDATE icafp_enlaces SET titulo = ?, mensaje = ?, estado = ?, actualizado_en = ? WHERE id = ?`, [titulo, mensaje, estado, now(), l.id])
  return obtenerEnlace(db, entidadId)
}

// Genera un enlace nuevo: el anterior deja de funcionar.
export async function regenerarToken(db, entidadId) {
  const l = await enlaceDe(db, entidadId)
  if (!l) return { ok: false, status: 404, error: 'Todavía no se ha creado el enlace' }
  await db.run(`UPDATE icafp_enlaces SET token = ?, actualizado_en = ? WHERE id = ?`, [nuevoToken(), now(), l.id])
  return obtenerEnlace(db, entidadId)
}

// ---------------- Público (por token) ----------------
async function enlacePorToken(db, token) {
  const t = String(token || '')
  if (t.length < 20 || t.length > 80) return null
  return db.get(`SELECT * FROM icafp_enlaces WHERE token = ?`, [t])
}

export async function formularioPublico(db, token) {
  const l = await enlacePorToken(db, token)
  if (!l) return { ok: false, status: 404, error: 'El enlace no es válido.' }
  if (l.estado !== 'abierta') return { ok: false, status: 410, error: 'Este formulario ya se cerró. Gracias.' }
  const deps = await dependenciasEntidad(db, l.entidad_id)
  return {
    ok: true,
    entidad: await nombreEntidad(db, l.entidad_id),
    titulo: l.titulo || TITULO_DEFECTO,
    mensaje: l.mensaje,
    dependencias: deps.map(d => ({ id: String(d.id), nombre: d.nombre }))
  }
}

// Valida y limpia una actividad enviada. Devuelve { actividad } o { error }.
function limpiarActividad(a, n) {
  if (!a || typeof a !== 'object') return { error: `La actividad ${n} no es válida.` }
  const nombre = txt(a.nombre, LIMITES.actividad)
  if (!nombre) return { error: `Escriba qué hace en la actividad ${n}.` }
  if (!FRECUENCIAS.includes(a.frecuencia)) return { error: `Indique cada cuánto hace la actividad ${n}.` }
  const produce = si(a.produce)
  const documentos = produce ? lineas(a.documentos, LIMITES.documentos) : null
  if (produce && !documentos) return { error: `Escriba qué documentos salen de la actividad ${n}, o marque que no produce documentos.` }
  if (produce && !FORMATOS.includes(a.formato)) return { error: `Indique si los documentos de la actividad ${n} quedan en papel, en el computador o en ambos.` }
  return {
    actividad: {
      nombre, frecuencia: a.frecuencia, produce,
      documentos, formato: produce ? a.formato : null,
      recibe: lineas(a.recibe, LIMITES.documentos),
      descripcion: txt(a.descripcion, LIMITES.descripcion)
    }
  }
}

export async function enviarPublico(db, token, body = {}) {
  const l = await enlacePorToken(db, token)
  if (!l) return { ok: false, status: 404, error: 'El enlace no es válido.' }
  if (l.estado !== 'abierta') return { ok: false, status: 410, error: 'Este formulario no está recibiendo respuestas.' }
  if (body.sitio) return { ok: true } // trampa para robots: se ignora en silencio

  const nombre = txt(body.nombre, LIMITES.nombre)
  if (!nombre) return { ok: false, status: 400, error: 'Escriba su nombre.' }

  const deps = await dependenciasEntidad(db, l.entidad_id)
  const dep = deps.find(d => String(d.id) === String(body.dependencia_id))
  if (!dep) return { ok: false, status: 400, error: 'Seleccione la dependencia donde trabaja.' }

  const entrada = Array.isArray(body.actividades) ? body.actividades : []
  if (!entrada.length) return { ok: false, status: 400, error: 'Agregue al menos una actividad.' }
  if (entrada.length > LIMITES.actividadesPorEnvio)
    return { ok: false, status: 400, error: `Puede enviar hasta ${LIMITES.actividadesPorEnvio} actividades por formulario. Envíe las demás en otro.` }

  const actividades = []
  for (let i = 0; i < entrada.length; i++) {
    const r = limpiarActividad(entrada[i], i + 1)
    if (r.error) return { ok: false, status: 400, error: r.error, actividad: i + 1 }
    actividades.push(r.actividad)
  }

  const n = await db.get(`SELECT COUNT(*) AS n FROM icafp_envios WHERE enlace_id = ? AND estado = 'pendiente'`, [l.id])
  if (Number(n?.n || 0) >= LIMITES.enviosPendientes)
    return { ok: false, status: 429, error: 'El formulario alcanzó el máximo de respuestas por revisar. Intente más tarde.' }

  await db.run(
    `INSERT INTO icafp_envios (id, enlace_id, entidad_id, dependencia_id, nombre, cargo, actividades, observaciones, estado, enviado_en)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'pendiente', ?)`,
    [nuevoId('IV'), l.id, l.entidad_id, String(dep.id), nombre, txt(body.cargo, LIMITES.cargo),
      JSON.stringify(actividades), txt(body.observaciones, LIMITES.observaciones), now()]
  )
  return { ok: true, actividades: actividades.length }
}

// ---------------- Bandeja del asesor ----------------
function publicoEnvio(e) {
  return {
    id: e.id, dependencia_id: e.dependencia_id, dependencia: e.dependencia_nombre || null,
    nombre: e.nombre, cargo: e.cargo, actividades: parse(e.actividades, []), observaciones: e.observaciones,
    estado: e.estado, enviado_en: e.enviado_en, revisado_en: e.revisado_en, revisado_por: e.revisado_por
  }
}

export async function listarEnvios(db, entidadId, estado = 'pendiente') {
  const est = ESTADOS_ENVIO.includes(estado) ? estado : 'pendiente'
  const filas = await db.all(
    `SELECT e.*, d.nombre AS dependencia_nombre
       FROM icafp_envios e
       LEFT JOIN dependencias d ON CAST(d.id AS TEXT) = e.dependencia_id
      WHERE e.entidad_id = ? AND e.estado = ?
      ORDER BY e.enviado_en DESC`,
    [String(entidadId), est]
  )
  return { ok: true, estado: est, envios: filas.map(publicoEnvio), conteos: await conteos(db, entidadId) }
}

async function envioDe(db, entidadId, id) {
  return db.get(`SELECT * FROM icafp_envios WHERE id = ? AND entidad_id = ?`, [String(id), String(entidadId)])
}

// Crea en el ICAF las actividades del envío (una por actividad), a nombre del funcionario.
export async function incorporarEnvio(db, entidadId, id, usuario = '') {
  const e = await envioDe(db, entidadId, id)
  if (!e) return { ok: false, status: 404, error: 'Respuesta no encontrada' }
  if (e.estado !== 'pendiente') return { ok: false, status: 409, error: 'Esta respuesta ya fue revisada' }

  const dep = await db.get(
    `SELECT id FROM dependencias WHERE CAST(entidad_id AS TEXT) = ? AND CAST(id AS TEXT) = ?`,
    [String(entidadId), String(e.dependencia_id)]
  )
  if (!dep) return { ok: false, status: 400, error: 'La dependencia de esta respuesta ya no existe' }

  const t = now()
  const ids = []
  for (const a of parse(e.actividades, [])) {
    const actId = crypto.randomUUID()
    await db.run(
      `INSERT INTO segtec_actividades (id, dependencia_id, usuario_id, entidad_id, funcionario_externo, cargo_ejecutor,
         nombre, frecuencia, descripcion_funcional, genera_documentos, documentos_generados, formato_produccion, recepcion_externa,
         estado_general, created_at, updated_at)
       VALUES (?, ?, NULL, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'caracterizada', ?, ?)`,
      [actId, Number(dep.id), String(entidadId), e.nombre, e.cargo,
        a.nombre, a.frecuencia, a.descripcion || null, a.produce ? 1 : 0, a.documentos || null, a.formato || null, a.recibe || null, t, t]
    )
    ids.push(actId)
  }
  await db.run(
    `UPDATE icafp_envios SET estado = 'incorporado', revisado_en = ?, revisado_por = ?, actividades_ids = ? WHERE id = ?`,
    [t, txt(usuario, LIMITES.nombre), JSON.stringify(ids), e.id]
  )
  return { ok: true, creadas: ids.length, actividades_ids: ids }
}

export async function descartarEnvio(db, entidadId, id, usuario = '') {
  const e = await envioDe(db, entidadId, id)
  if (!e) return { ok: false, status: 404, error: 'Respuesta no encontrada' }
  if (e.estado !== 'pendiente') return { ok: false, status: 409, error: 'Esta respuesta ya fue revisada' }
  await db.run(`UPDATE icafp_envios SET estado = 'descartado', revisado_en = ?, revisado_por = ? WHERE id = ?`, [now(), txt(usuario, LIMITES.nombre), e.id])
  return { ok: true }
}
