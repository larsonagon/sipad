// ======================================================
// SIPAD · Diagnóstico SIC — Migración y acceso a datos
// ------------------------------------------------------
// Aditivo e idempotente (CREATE TABLE IF NOT EXISTS). Sin claves
// foráneas a otros módulos; aislamiento por entidad_id.
// Las respuestas se guardan como JSON { v, x, s, o } por pregunta.
// Las fotografías se guardan en la base (base64) porque el disco
// del servidor (Render) es efímero.
// ======================================================

import crypto from 'crypto'
import { indicePreguntas, REGISTRO_ESPACIO, FICHA, REPOSITORIO, INSTITUCIONAL, SISTEMAS, ESCALA } from './sic.formulario.js'

const IDX = indicePreguntas()
const now = () => new Date().toISOString()

export const LIMITES = { fotoBytes: 2_500_000, fotosPorEspacio: 12, texto: 2000 }

export async function runSICMigration(db) {
  await db.exec(`
    CREATE TABLE IF NOT EXISTS sic_respuestas (
      entidad_id      TEXT NOT NULL,
      pregunta_id     TEXT NOT NULL,
      valor           TEXT,
      actualizado_por TEXT,
      actualizado_en  TEXT,
      PRIMARY KEY (entidad_id, pregunta_id)
    );
    CREATE TABLE IF NOT EXISTS sic_espacios (
      id              TEXT PRIMARY KEY,
      entidad_id      TEXT NOT NULL,
      registro        TEXT,
      ficha           TEXT,
      creado_en       TEXT,
      actualizado_en  TEXT,
      actualizado_por TEXT
    );
    CREATE INDEX IF NOT EXISTS idx_sic_espacios_entidad ON sic_espacios(entidad_id);
    CREATE TABLE IF NOT EXISTS sic_fotos (
      id          TEXT PRIMARY KEY,
      entidad_id  TEXT NOT NULL,
      espacio_id  TEXT NOT NULL,
      nombre      TEXT,
      mime        TEXT,
      datos       TEXT,
      bytes       INTEGER,
      ancho       INTEGER,
      alto        INTEGER,
      creado_en   TEXT
    );
    CREATE INDEX IF NOT EXISTS idx_sic_fotos_espacio ON sic_fotos(espacio_id);
    CREATE TABLE IF NOT EXISTS sic_repositorios (
      id              TEXT PRIMARY KEY,
      entidad_id      TEXT NOT NULL,
      datos           TEXT,
      creado_en       TEXT,
      actualizado_en  TEXT,
      actualizado_por TEXT
    );
    CREATE INDEX IF NOT EXISTS idx_sic_repos_entidad ON sic_repositorios(entidad_id);
    CREATE TABLE IF NOT EXISTS sic_meta (
      entidad_id          TEXT PRIMARY KEY,
      espacios_declarados INTEGER,
      redaccion           TEXT,
      redaccion_en        TEXT
    );
  `)
}

// ---------------- Validación de valores ----------------
const ID_SETS = {
  respuestas: new Set([...INSTITUCIONAL, ...SISTEMAS].flatMap(b => b.preguntas.map(p => p.id))),
  registro: new Set(REGISTRO_ESPACIO.map(p => p.id)),
  ficha: new Set(FICHA.flatMap(b => b.preguntas.map(p => p.id))),
  repositorio: new Set(REPOSITORIO.map(p => p.id))
}

function txt(v) {
  if (v === undefined || v === null) return null
  return String(v).slice(0, LIMITES.texto)
}

function numero(v, id) {
  if (v === '' || v === null || v === undefined) return null
  const n = Number(String(v).replace(',', '.'))
  if (!Number.isFinite(n) || n < 0) throw new Error(`${id}: debe ser un número mayor o igual a cero`)
  return n
}

// Devuelve el valor saneado { v, x?, s?, o? } o null (borrar). Lanza Error si es inválido.
export function validarValor(id, valor, { dependencias = null } = {}) {
  const p = IDX[id]
  if (!p) throw new Error(`Pregunta desconocida: ${id}`)
  if (valor === null || valor === undefined) return null
  const entrada = typeof valor === 'object' && !Array.isArray(valor) && ('v' in valor || 'x' in valor || 's' in valor || 'o' in valor)
    ? valor : { v: valor }
  let v = entrada.v
  switch (p.tipo) {
    case 'spn':
      if (v !== undefined && v !== null && v !== '' && !['si', 'parcial', 'no', 'ns'].includes(v)) throw new Error(`${id}: respuesta inválida`)
      break
    case 'escala':
      if (v && !ESCALA.includes(v)) throw new Error(`${id}: valor fuera de escala`)
      break
    case 'lista':
      if (v && !p.opciones.includes(v)) throw new Error(`${id}: opción inválida`)
      break
    case 'multi':
      if (v === undefined || v === null || v === '') { v = []; break }
      if (!Array.isArray(v) || v.some(o => !p.opciones.includes(o))) throw new Error(`${id}: opciones inválidas`)
      if (p.max && v.length > p.max) throw new Error(`${id}: máximo ${p.max} opciones`)
      v = [...new Set(v)]
      break
    case 'num':
      v = numero(v, id)
      if (p.unidad === '%' && v !== null && v > 100) throw new Error(`${id}: el porcentaje no puede superar 100`)
      break
    case 'txt':
      v = txt(v)
      break
    case 'pct3': {
      if (!v) { v = null; break }
      const b = numero(v.bueno, id) || 0, r = numero(v.regular, id) || 0, m = numero(v.malo, id) || 0
      if (Math.abs(b + r + m - 100) > 0.5) throw new Error(`${id}: bueno + regular + malo debe sumar 100`)
      v = { bueno: b, regular: r, malo: m }
      break
    }
    case 'dep': {
      if (!v) { v = []; break }
      if (!Array.isArray(v)) throw new Error(`${id}: lista de dependencias inválida`)
      v = [...new Set(v.map(String))]
      if (dependencias) {
        const validas = new Set(dependencias.map(d => String(d.id)))
        if (v.some(d => !validas.has(d))) throw new Error(`${id}: dependencia que no pertenece a la entidad`)
      }
      break
    }
  }
  const out = { v }
  if (p.extra && entrada.x !== undefined && entrada.x !== null && entrada.x !== '')
    out.x = p.extra.tipo === 'num' ? numero(entrada.x, id) : txt(entrada.x)
  if (entrada.s) out.s = txt(entrada.s)
  if (entrada.o) out.o = txt(entrada.o)
  const vacioV = out.v === null || out.v === undefined || out.v === '' || (Array.isArray(out.v) && !out.v.length)
  if (vacioV && out.x === undefined && !out.s && !out.o) return null
  return out
}

function parse(j, def) { try { return j ? JSON.parse(j) : def } catch { return def } }

// Aplica un parche { id: valor|null } sobre un objeto de respuestas
function aplicarParche(actual, parche, conjunto, opts) {
  const nuevo = { ...actual }
  for (const [id, valor] of Object.entries(parche || {})) {
    if (!conjunto.has(id)) throw new Error(`La pregunta ${id} no corresponde a esta sección`)
    const limpio = validarValor(id, valor, opts)
    if (limpio === null) delete nuevo[id]; else nuevo[id] = limpio
  }
  return nuevo
}

// ---------------- Lectura ----------------
export async function listarDependencias(db, entidadId) {
  try {
    return await db.all(`SELECT id, nombre FROM dependencias WHERE entidad_id = ? AND (activa IS NULL OR activa = true) ORDER BY nombre`, [entidadId])
  } catch {
    return db.all(`SELECT id, nombre FROM dependencias WHERE entidad_id = ? ORDER BY nombre`, [entidadId])
  }
}

export async function obtenerEstado(db, entidadId) {
  const filas = await db.all(`SELECT pregunta_id, valor, actualizado_por, actualizado_en FROM sic_respuestas WHERE entidad_id = ?`, [entidadId])
  const institucional = {}
  const auditoria = {}
  for (const f of filas) {
    institucional[f.pregunta_id] = parse(f.valor, null)
    auditoria[f.pregunta_id] = { por: f.actualizado_por, en: f.actualizado_en }
  }
  const esp = await db.all(`SELECT id, registro, ficha, creado_en, actualizado_en, actualizado_por FROM sic_espacios WHERE entidad_id = ? ORDER BY creado_en, id`, [entidadId])
  const fotos = await db.all(`SELECT id, espacio_id, nombre, mime, bytes, creado_en FROM sic_fotos WHERE entidad_id = ? ORDER BY creado_en`, [entidadId])
  const espacios = esp.map(e => {
    const f = fotos.filter(x => x.espacio_id === e.id)
    return { id: e.id, registro: parse(e.registro, {}), ficha: parse(e.ficha, {}), fotos: f.length, fotosLista: f,
      creado_en: e.creado_en, actualizado_en: e.actualizado_en, actualizado_por: e.actualizado_por }
  })
  const reps = await db.all(`SELECT id, datos, actualizado_en, actualizado_por FROM sic_repositorios WHERE entidad_id = ? ORDER BY creado_en, id`, [entidadId])
  const repositorios = reps.map(r => ({ id: r.id, datos: parse(r.datos, {}), actualizado_en: r.actualizado_en, actualizado_por: r.actualizado_por }))
  const meta = await db.get(`SELECT espacios_declarados, redaccion, redaccion_en FROM sic_meta WHERE entidad_id = ?`, [entidadId])
  const dependencias = await listarDependencias(db, entidadId)
  return { institucional, auditoria, espacios, repositorios, dependencias,
    espaciosDeclarados: meta?.espacios_declarados ?? null,
    redaccion: meta?.redaccion ? parse(meta.redaccion, null) : null, redaccion_en: meta?.redaccion_en || null }
}

// ---------------- Escritura ----------------
export async function guardarRespuestas(db, entidadId, parche, usuario) {
  if (!parche || typeof parche !== 'object') return { ok: false, error: 'Sin respuestas' }
  const limpias = []
  try {
    for (const [id, valor] of Object.entries(parche)) {
      if (!ID_SETS.respuestas.has(id)) throw new Error(`La pregunta ${id} no corresponde al cuestionario institucional o de sistemas`)
      limpias.push([id, validarValor(id, valor)])
    }
  } catch (e) { return { ok: false, error: e.message } }
  for (const [id, v] of limpias) {
    if (v === null) {
      await db.run(`DELETE FROM sic_respuestas WHERE entidad_id = ? AND pregunta_id = ?`, [entidadId, id])
    } else {
      await db.run(
        `INSERT INTO sic_respuestas (entidad_id, pregunta_id, valor, actualizado_por, actualizado_en) VALUES (?, ?, ?, ?, ?)
         ON CONFLICT (entidad_id, pregunta_id) DO UPDATE SET valor = EXCLUDED.valor, actualizado_por = EXCLUDED.actualizado_por, actualizado_en = EXCLUDED.actualizado_en`,
        [entidadId, id, JSON.stringify(v), usuario || null, now()])
    }
  }
  return { ok: true, guardadas: limpias.length }
}

export async function guardarMeta(db, entidadId, { espacios_declarados } = {}) {
  let n = null
  if (espacios_declarados !== null && espacios_declarados !== undefined && espacios_declarados !== '') {
    n = Number(espacios_declarados)
    if (!Number.isInteger(n) || n < 0 || n > 1000) return { ok: false, error: 'Número de espacios inválido' }
  }
  await db.run(
    `INSERT INTO sic_meta (entidad_id, espacios_declarados) VALUES (?, ?)
     ON CONFLICT (entidad_id) DO UPDATE SET espacios_declarados = EXCLUDED.espacios_declarados`, [entidadId, n])
  return { ok: true }
}

export async function crearEspacio(db, entidadId, { registro = {} } = {}, usuario) {
  const deps = await listarDependencias(db, entidadId)
  let reg
  try { reg = aplicarParche({}, registro, ID_SETS.registro, { dependencias: deps }) }
  catch (e) { return { ok: false, error: e.message } }
  if (!reg['ESP-01']?.v || !String(reg['ESP-01'].v).trim()) return { ok: false, error: 'El nombre del espacio es obligatorio' }
  const id = crypto.randomUUID()
  await db.run(`INSERT INTO sic_espacios (id, entidad_id, registro, ficha, creado_en, actualizado_en, actualizado_por) VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [id, entidadId, JSON.stringify(reg), '{}', now(), now(), usuario || null])
  return { ok: true, id }
}

export async function actualizarEspacio(db, entidadId, id, { registro, ficha } = {}, usuario) {
  const e = await db.get(`SELECT registro, ficha FROM sic_espacios WHERE id = ? AND entidad_id = ?`, [id, entidadId])
  if (!e) return { ok: false, error: 'Espacio no encontrado', status: 404 }
  const deps = registro ? await listarDependencias(db, entidadId) : null
  let reg = parse(e.registro, {}), fic = parse(e.ficha, {})
  try {
    if (registro) reg = aplicarParche(reg, registro, ID_SETS.registro, { dependencias: deps })
    if (ficha) fic = aplicarParche(fic, ficha, ID_SETS.ficha)
  } catch (err) { return { ok: false, error: err.message } }
  if (!reg['ESP-01']?.v) return { ok: false, error: 'El nombre del espacio es obligatorio' }
  await db.run(`UPDATE sic_espacios SET registro = ?, ficha = ?, actualizado_en = ?, actualizado_por = ? WHERE id = ? AND entidad_id = ?`,
    [JSON.stringify(reg), JSON.stringify(fic), now(), usuario || null, id, entidadId])
  return { ok: true }
}

export async function eliminarEspacio(db, entidadId, id) {
  const r = await db.run(`DELETE FROM sic_espacios WHERE id = ? AND entidad_id = ?`, [id, entidadId])
  if (!r?.changes) return { ok: false, error: 'Espacio no encontrado', status: 404 }
  await db.run(`DELETE FROM sic_fotos WHERE espacio_id = ? AND entidad_id = ?`, [id, entidadId])
  return { ok: true }
}

const MIMES = new Set(['image/jpeg', 'image/png', 'image/webp'])
export async function agregarFoto(db, entidadId, espacioId, { nombre, mime, datos, ancho, alto } = {}) {
  const e = await db.get(`SELECT id FROM sic_espacios WHERE id = ? AND entidad_id = ?`, [espacioId, entidadId])
  if (!e) return { ok: false, error: 'Espacio no encontrado', status: 404 }
  if (!MIMES.has(mime)) return { ok: false, error: 'Formato de imagen no permitido (JPG, PNG o WEBP)' }
  const b64 = String(datos || '').replace(/^data:[^;]+;base64,/, '')
  if (!b64 || !/^[A-Za-z0-9+/=\s]+$/.test(b64)) return { ok: false, error: 'Imagen inválida' }
  const bytes = Math.floor(b64.replace(/\s/g, '').length * 3 / 4)
  if (bytes > LIMITES.fotoBytes) return { ok: false, error: 'La imagen supera el tamaño permitido' }
  const n = await db.get(`SELECT COUNT(*) AS n FROM sic_fotos WHERE espacio_id = ? AND entidad_id = ?`, [espacioId, entidadId])
  if (Number(n?.n || 0) >= LIMITES.fotosPorEspacio) return { ok: false, error: `Máximo ${LIMITES.fotosPorEspacio} fotografías por espacio` }
  const id = crypto.randomUUID()
  const dim = (n) => { const v = Math.round(Number(n)); return Number.isFinite(v) && v > 0 && v < 10000 ? v : null }
  await db.run(`INSERT INTO sic_fotos (id, entidad_id, espacio_id, nombre, mime, datos, bytes, ancho, alto, creado_en) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [id, entidadId, espacioId, txt(nombre) || 'foto', mime, b64.replace(/\s/g, ''), bytes, dim(ancho), dim(alto), now()])
  return { ok: true, id }
}

export async function obtenerFoto(db, entidadId, id) {
  return db.get(`SELECT id, espacio_id, nombre, mime, datos FROM sic_fotos WHERE id = ? AND entidad_id = ?`, [id, entidadId])
}

// Fotos para el informe (hasta `porEspacio` por espacio, solo JPG/PNG)
export async function fotosParaInforme(db, entidadId, porEspacio = 3) {
  const filas = await db.all(`SELECT id, espacio_id, mime, datos, ancho, alto FROM sic_fotos WHERE entidad_id = ? AND mime IN ('image/jpeg','image/png') ORDER BY creado_en`, [entidadId])
  const out = {}
  for (const f of filas) {
    out[f.espacio_id] = out[f.espacio_id] || []
    if (out[f.espacio_id].length < porEspacio) out[f.espacio_id].push(f)
  }
  return out
}

export async function eliminarFoto(db, entidadId, id) {
  const r = await db.run(`DELETE FROM sic_fotos WHERE id = ? AND entidad_id = ?`, [id, entidadId])
  return r?.changes ? { ok: true } : { ok: false, error: 'Foto no encontrada', status: 404 }
}

export async function crearRepositorio(db, entidadId, { datos = {} } = {}, usuario) {
  const deps = await listarDependencias(db, entidadId)
  let d
  try { d = aplicarParche({}, datos, ID_SETS.repositorio, { dependencias: deps }) }
  catch (e) { return { ok: false, error: e.message } }
  if (!d['SR-01']?.v || !String(d['SR-01'].v).trim()) return { ok: false, error: 'El nombre del sistema o repositorio es obligatorio' }
  const id = crypto.randomUUID()
  await db.run(`INSERT INTO sic_repositorios (id, entidad_id, datos, creado_en, actualizado_en, actualizado_por) VALUES (?, ?, ?, ?, ?, ?)`,
    [id, entidadId, JSON.stringify(d), now(), now(), usuario || null])
  return { ok: true, id }
}

export async function actualizarRepositorio(db, entidadId, id, { datos } = {}, usuario) {
  const r = await db.get(`SELECT datos FROM sic_repositorios WHERE id = ? AND entidad_id = ?`, [id, entidadId])
  if (!r) return { ok: false, error: 'Repositorio no encontrado', status: 404 }
  const deps = await listarDependencias(db, entidadId)
  let d
  try { d = aplicarParche(parse(r.datos, {}), datos, ID_SETS.repositorio, { dependencias: deps }) }
  catch (e) { return { ok: false, error: e.message } }
  if (!d['SR-01']?.v) return { ok: false, error: 'El nombre del sistema o repositorio es obligatorio' }
  await db.run(`UPDATE sic_repositorios SET datos = ?, actualizado_en = ?, actualizado_por = ? WHERE id = ? AND entidad_id = ?`,
    [JSON.stringify(d), now(), usuario || null, id, entidadId])
  return { ok: true }
}

export async function eliminarRepositorio(db, entidadId, id) {
  const r = await db.run(`DELETE FROM sic_repositorios WHERE id = ? AND entidad_id = ?`, [id, entidadId])
  return r?.changes ? { ok: true } : { ok: false, error: 'Repositorio no encontrado', status: 404 }
}

export async function guardarRedaccion(db, entidadId, redaccion) {
  await db.run(
    `INSERT INTO sic_meta (entidad_id, redaccion, redaccion_en) VALUES (?, ?, ?)
     ON CONFLICT (entidad_id) DO UPDATE SET redaccion = EXCLUDED.redaccion, redaccion_en = EXCLUDED.redaccion_en`,
    [entidadId, JSON.stringify(redaccion), now()])
}
