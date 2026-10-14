// ======================================================
// SIPAD · Verificación por dependencia — Migración y datos
// ------------------------------------------------------
// Alternativa al ICAF cuando los funcionarios no diligencian:
// el asesor prepara una lista de documentos/expedientes probables
// de una dependencia y la envía por un enlace público (sin cuenta).
// Cada funcionario marca por ítem: Sí · No · Antes sí, ahora no · No sé.
//
// Aditivo e idempotente (CREATE TABLE IF NOT EXISTS), sin claves
// foráneas a otros módulos; aislamiento por entidad_id. Compatible
// con PostgreSQL (producción) y SQLite (desarrollo).
// ======================================================

import crypto from 'crypto'

const now = () => new Date().toISOString()
const nuevoId = (p) => `${p}_${crypto.randomUUID()}`
const nuevoToken = () => crypto.randomBytes(24).toString('base64url')

export const RESPUESTAS = ['si', 'no', 'antes', 'ns']
export const SOPORTES = ['papel', 'digital', 'ambos']
export const VOLUMENES = ['mucho', 'poco', 'casi_nunca']
export const DECISIONES = ['incluir', 'descartar', 'fondo_acumulado', 'pendiente']
export const ESTADOS_LISTA = ['borrador', 'abierta', 'cerrada']

export const LIMITES = {
  texto: 300, ayuda: 600, titulo: 200, mensaje: 2000,
  nombre: 120, cargo: 120, adicionales: 2000, observaciones: 2000,
  itemsPorLista: 150, respuestasPorLista: 300
}

export async function runVerificacionMigration(db) {
  await db.exec(`
    CREATE TABLE IF NOT EXISTS verif_listas (
      id                 TEXT PRIMARY KEY,
      entidad_id         TEXT NOT NULL,
      dependencia_id     TEXT NOT NULL,
      token              TEXT NOT NULL,
      titulo             TEXT,
      mensaje            TEXT,
      estado             TEXT DEFAULT 'borrador',
      fecha_limite       TEXT,
      preguntar_soporte  INTEGER DEFAULT 1,
      preguntar_volumen  INTEGER DEFAULT 0,
      creado_por         TEXT,
      creado_en          TEXT,
      actualizado_en     TEXT,
      aplicado_en        TEXT
    );
    CREATE UNIQUE INDEX IF NOT EXISTS idx_verif_listas_token ON verif_listas(token);
    CREATE INDEX IF NOT EXISTS idx_verif_listas_entidad ON verif_listas(entidad_id);
    CREATE TABLE IF NOT EXISTS verif_items (
      id            TEXT PRIMARY KEY,
      lista_id      TEXT NOT NULL,
      entidad_id    TEXT NOT NULL,
      orden         INTEGER,
      texto         TEXT NOT NULL,
      ayuda         TEXT,
      serie         TEXT,
      subserie      TEXT,
      propuesta_id  TEXT,
      origen        TEXT,
      decision      TEXT,
      creado_en     TEXT
    );
    CREATE INDEX IF NOT EXISTS idx_verif_items_lista ON verif_items(lista_id);
    CREATE TABLE IF NOT EXISTS verif_respuestas (
      id            TEXT PRIMARY KEY,
      lista_id      TEXT NOT NULL,
      entidad_id    TEXT NOT NULL,
      nombre        TEXT,
      cargo         TEXT,
      respuestas    TEXT,
      adicionales   TEXT,
      observaciones TEXT,
      enviado_en    TEXT
    );
    CREATE INDEX IF NOT EXISTS idx_verif_resp_lista ON verif_respuestas(lista_id);
  `)
}

// ---------------- Utilidades ----------------
function txt(v, max) {
  if (v === undefined || v === null) return null
  const s = String(v).replace(/\s+/g, ' ').trim()
  return s ? s.slice(0, max) : null
}
function parse(j, def) { try { return j ? JSON.parse(j) : def } catch { return def } }
const bool = (v) => (v === true || v === 1 || v === '1' || v === 'true') ? 1 : 0

// Tipologías guardadas como JSON (["a","b"]) o texto separado por comas/saltos.
export function partirTipologias(t) {
  if (!t) return []
  const j = parse(t, null)
  const arr = Array.isArray(j) ? j : String(t).split(/[\n;,]+/)
  return [...new Set(arr.map(x => String(x).trim()).filter(Boolean))]
}

// Texto que ve el funcionario: la subserie si existe; si no, la serie en tipo oración.
export function textoItem(serie, subserie) {
  const base = (subserie && String(subserie).trim()) || (serie && String(serie).trim()) || ''
  if (!base) return ''
  if (base === base.toUpperCase()) return base.charAt(0) + base.slice(1).toLowerCase()
  return base
}

// ---------------- Entidad / dependencias ----------------
export async function nombreEntidad(db, entidadId) {
  try {
    const e = await db.get(`SELECT nombre FROM entidades WHERE CAST(id AS TEXT) = ?`, [String(entidadId)])
    return e?.nombre || 'la entidad'
  } catch { return 'la entidad' }
}

export async function dependenciasEntidad(db, entidadId) {
  return db.all(
    `SELECT id, nombre FROM dependencias WHERE CAST(entidad_id AS TEXT) = ? ORDER BY nombre`,
    [String(entidadId)]
  )
}

async function dependencia(db, entidadId, depId) {
  return db.get(
    `SELECT id, nombre FROM dependencias WHERE CAST(entidad_id AS TEXT) = ? AND CAST(id AS TEXT) = ?`,
    [String(entidadId), String(depId)]
  )
}

// Propuestas de series de la dependencia (asignadas a ella o venidas de
// una actividad del ICAF de esa dependencia). Excluye las rechazadas.
export async function propuestasDependencia(db, entidadId, depId) {
  return db.all(
    `SELECT p.id, p.nombre_serie, p.nombre_subserie, p.tipologia_documental, p.estado
       FROM trd_series_propuestas p
       LEFT JOIN segtec_actividades a ON a.id = p.actividad_id
      WHERE CAST(p.entidad_id AS TEXT) = ?
        AND CAST(COALESCE(p.dependencia_id, a.dependencia_id) AS TEXT) = ?
        AND (p.estado IS NULL OR p.estado <> 'rechazada')
      ORDER BY p.nombre_serie, p.nombre_subserie`,
    [String(entidadId), String(depId)]
  )
}

// ---------------- Listas ----------------
export async function listar(db, entidadId) {
  const listas = await db.all(
    `SELECT l.*, d.nombre AS dependencia_nombre
       FROM verif_listas l
       LEFT JOIN dependencias d ON CAST(d.id AS TEXT) = l.dependencia_id
      WHERE l.entidad_id = ?
      ORDER BY l.creado_en DESC`,
    [String(entidadId)]
  )
  const out = []
  for (const l of listas) {
    const ni = await db.get(`SELECT COUNT(*) AS n FROM verif_items WHERE lista_id = ?`, [l.id])
    const nr = await db.get(`SELECT COUNT(*) AS n FROM verif_respuestas WHERE lista_id = ?`, [l.id])
    out.push({ ...publicaLista(l), items: Number(ni?.n || 0), respuestas: Number(nr?.n || 0) })
  }
  return out
}

function publicaLista(l) {
  return {
    id: l.id, dependencia_id: l.dependencia_id, dependencia_nombre: l.dependencia_nombre || null,
    token: l.token, titulo: l.titulo, mensaje: l.mensaje, estado: l.estado,
    fecha_limite: l.fecha_limite, preguntar_soporte: !!Number(l.preguntar_soporte),
    preguntar_volumen: !!Number(l.preguntar_volumen), creado_por: l.creado_por,
    creado_en: l.creado_en, actualizado_en: l.actualizado_en, aplicado_en: l.aplicado_en
  }
}

async function obtenerLista(db, entidadId, id) {
  return db.get(
    `SELECT l.*, d.nombre AS dependencia_nombre
       FROM verif_listas l
       LEFT JOIN dependencias d ON CAST(d.id AS TEXT) = l.dependencia_id
      WHERE l.id = ? AND l.entidad_id = ?`,
    [String(id), String(entidadId)]
  )
}

export async function crearLista(db, entidadId, body = {}, usuario = '') {
  const dep = await dependencia(db, entidadId, body.dependencia_id)
  if (!dep) return { ok: false, status: 400, error: 'Seleccione una dependencia de la entidad' }

  const id = nuevoId('VL')
  const t = now()
  await db.run(
    `INSERT INTO verif_listas (id, entidad_id, dependencia_id, token, titulo, mensaje, estado, fecha_limite,
       preguntar_soporte, preguntar_volumen, creado_por, creado_en, actualizado_en)
     VALUES (?, ?, ?, ?, ?, ?, 'borrador', ?, ?, ?, ?, ?, ?)`,
    [id, String(entidadId), String(dep.id), nuevoToken(),
      txt(body.titulo, LIMITES.titulo) || 'Verificación de documentos',
      txt(body.mensaje, LIMITES.mensaje), fecha(body.fecha_limite),
      body.preguntar_soporte === undefined ? 1 : bool(body.preguntar_soporte),
      bool(body.preguntar_volumen), txt(usuario, LIMITES.nombre), t, t]
  )

  let precargados = 0
  if (body.precargar !== false) {
    const props = await propuestasDependencia(db, entidadId, dep.id)
    const vistos = new Set()
    let orden = 0
    for (const p of props) {
      const clave = `${(p.nombre_serie || '').toLowerCase()}|${(p.nombre_subserie || '').toLowerCase()}`
      if (vistos.has(clave)) continue
      vistos.add(clave)
      const texto = textoItem(p.nombre_serie, p.nombre_subserie)
      if (!texto) continue
      const tip = partirTipologias(p.tipologia_documental).slice(0, 6)
      await db.run(
        `INSERT INTO verif_items (id, lista_id, entidad_id, orden, texto, ayuda, serie, subserie, propuesta_id, origen, creado_en)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'propuesta', ?)`,
        [nuevoId('VI'), id, String(entidadId), ++orden, texto.slice(0, LIMITES.texto),
          tip.length ? `Incluye documentos como: ${tip.join(', ')}`.slice(0, LIMITES.ayuda) : null,
          p.nombre_serie || null, p.nombre_subserie || null, String(p.id), t]
      )
      precargados++
      if (orden >= LIMITES.itemsPorLista) break
    }
  }
  return { ok: true, id, precargados }
}

function fecha(v) {
  if (!v) return null
  const s = String(v).slice(0, 10)
  return /^\d{4}-\d{2}-\d{2}$/.test(s) ? s : null
}

export async function actualizarLista(db, entidadId, id, body = {}) {
  const l = await obtenerLista(db, entidadId, id)
  if (!l) return { ok: false, status: 404, error: 'Lista no encontrada' }
  const campos = []
  const valores = []
  if ('titulo' in body) { campos.push('titulo = ?'); valores.push(txt(body.titulo, LIMITES.titulo) || l.titulo) }
  if ('mensaje' in body) { campos.push('mensaje = ?'); valores.push(txt(body.mensaje, LIMITES.mensaje)) }
  if ('fecha_limite' in body) { campos.push('fecha_limite = ?'); valores.push(fecha(body.fecha_limite)) }
  if ('preguntar_soporte' in body) { campos.push('preguntar_soporte = ?'); valores.push(bool(body.preguntar_soporte)) }
  if ('preguntar_volumen' in body) { campos.push('preguntar_volumen = ?'); valores.push(bool(body.preguntar_volumen)) }
  if ('estado' in body) {
    if (!ESTADOS_LISTA.includes(body.estado)) return { ok: false, status: 400, error: 'Estado inválido' }
    if (body.estado === 'abierta') {
      const n = await db.get(`SELECT COUNT(*) AS n FROM verif_items WHERE lista_id = ?`, [l.id])
      if (!Number(n?.n)) return { ok: false, status: 400, error: 'Agregue al menos un ítem antes de abrir la lista' }
    }
    campos.push('estado = ?'); valores.push(body.estado)
  }
  if (!campos.length) return { ok: true }
  campos.push('actualizado_en = ?'); valores.push(now())
  await db.run(`UPDATE verif_listas SET ${campos.join(', ')} WHERE id = ? AND entidad_id = ?`, [...valores, l.id, String(entidadId)])
  return { ok: true }
}

export async function regenerarToken(db, entidadId, id) {
  const l = await obtenerLista(db, entidadId, id)
  if (!l) return { ok: false, status: 404, error: 'Lista no encontrada' }
  const token = nuevoToken()
  await db.run(`UPDATE verif_listas SET token = ?, actualizado_en = ? WHERE id = ?`, [token, now(), l.id])
  return { ok: true, token }
}

export async function eliminarLista(db, entidadId, id) {
  const l = await obtenerLista(db, entidadId, id)
  if (!l) return { ok: false, status: 404, error: 'Lista no encontrada' }
  await db.run(`DELETE FROM verif_respuestas WHERE lista_id = ?`, [l.id])
  await db.run(`DELETE FROM verif_items WHERE lista_id = ?`, [l.id])
  await db.run(`DELETE FROM verif_listas WHERE id = ?`, [l.id])
  return { ok: true }
}

// ---------------- Ítems ----------------
async function itemsDe(db, listaId) {
  return db.all(`SELECT * FROM verif_items WHERE lista_id = ? ORDER BY orden, creado_en`, [listaId])
}

// Agrega uno o varios ítems. Acepta { texto, ayuda, serie, subserie } o
// { lineas: "texto 1\ntexto 2" } para pegar una lista completa.
export async function agregarItems(db, entidadId, listaId, body = {}) {
  const l = await obtenerLista(db, entidadId, listaId)
  if (!l) return { ok: false, status: 404, error: 'Lista no encontrada' }
  const nuevos = []
  if (typeof body.lineas === 'string') {
    for (const linea of body.lineas.split(/\r?\n/)) {
      const t = txt(linea.replace(/^[-•*\d.)\s]+/, ''), LIMITES.texto)
      if (t) nuevos.push({ texto: t })
    }
  } else {
    const t = txt(body.texto, LIMITES.texto)
    if (t) nuevos.push({ texto: t, ayuda: txt(body.ayuda, LIMITES.ayuda), serie: txt(body.serie, LIMITES.texto), subserie: txt(body.subserie, LIMITES.texto) })
  }
  if (!nuevos.length) return { ok: false, status: 400, error: 'Escriba el documento o expediente' }
  const actuales = await itemsDe(db, l.id)
  if (actuales.length + nuevos.length > LIMITES.itemsPorLista)
    return { ok: false, status: 400, error: `Máximo ${LIMITES.itemsPorLista} ítems por lista` }
  let orden = actuales.reduce((m, i) => Math.max(m, Number(i.orden) || 0), 0)
  const t = now()
  const ids = []
  for (const n of nuevos) {
    const id = nuevoId('VI')
    ids.push(id)
    await db.run(
      `INSERT INTO verif_items (id, lista_id, entidad_id, orden, texto, ayuda, serie, subserie, propuesta_id, origen, creado_en)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, NULL, 'manual', ?)`,
      [id, l.id, String(entidadId), ++orden, n.texto, n.ayuda || null, n.serie || null, n.subserie || null, t]
    )
  }
  await db.run(`UPDATE verif_listas SET actualizado_en = ? WHERE id = ?`, [t, l.id])
  return { ok: true, ids }
}

export async function actualizarItem(db, entidadId, itemId, body = {}) {
  const it = await db.get(`SELECT * FROM verif_items WHERE id = ? AND entidad_id = ?`, [String(itemId), String(entidadId)])
  if (!it) return { ok: false, status: 404, error: 'Ítem no encontrado' }
  const campos = []
  const valores = []
  if ('texto' in body) {
    const t = txt(body.texto, LIMITES.texto)
    if (!t) return { ok: false, status: 400, error: 'El texto no puede quedar vacío' }
    campos.push('texto = ?'); valores.push(t)
  }
  if ('ayuda' in body) { campos.push('ayuda = ?'); valores.push(txt(body.ayuda, LIMITES.ayuda)) }
  if ('serie' in body) { campos.push('serie = ?'); valores.push(txt(body.serie, LIMITES.texto)) }
  if ('subserie' in body) { campos.push('subserie = ?'); valores.push(txt(body.subserie, LIMITES.texto)) }
  if ('decision' in body) {
    if (body.decision !== null && !DECISIONES.includes(body.decision)) return { ok: false, status: 400, error: 'Decisión inválida' }
    campos.push('decision = ?'); valores.push(body.decision)
  }
  if ('orden' in body) {
    const o = Number(body.orden)
    if (!Number.isInteger(o) || o < 0) return { ok: false, status: 400, error: 'Orden inválido' }
    campos.push('orden = ?'); valores.push(o)
  }
  if (!campos.length) return { ok: true }
  await db.run(`UPDATE verif_items SET ${campos.join(', ')} WHERE id = ?`, [...valores, it.id])
  return { ok: true }
}

export async function eliminarItem(db, entidadId, itemId) {
  const it = await db.get(`SELECT id FROM verif_items WHERE id = ? AND entidad_id = ?`, [String(itemId), String(entidadId)])
  if (!it) return { ok: false, status: 404, error: 'Ítem no encontrado' }
  await db.run(`DELETE FROM verif_items WHERE id = ?`, [it.id])
  return { ok: true }
}

// ---------------- Consolidado ----------------
// Cuenta las respuestas por ítem y sugiere una decisión:
//   mayoría Sí → incluir · todos No → descartar · mayoría "Antes sí" → fondo acumulado
//   sin respuestas, empates o "No sé" → pendiente (se resuelve en la mesa).
export function consolidar(items, respuestas) {
  const filas = items.map(it => {
    const c = { si: 0, no: 0, antes: 0, ns: 0 }
    const soporte = { papel: 0, digital: 0, ambos: 0 }
    const volumen = { mucho: 0, poco: 0, casi_nunca: 0 }
    const periodos = []
    for (const r of respuestas) {
      const a = r.respuestas?.[it.id]
      if (!a || !RESPUESTAS.includes(a.r)) continue
      c[a.r]++
      if (a.soporte && soporte[a.soporte] !== undefined) soporte[a.soporte]++
      if (a.volumen && volumen[a.volumen] !== undefined) volumen[a.volumen]++
      if (a.r === 'antes' && (a.desde || a.hasta)) periodos.push({ desde: a.desde || null, hasta: a.hasta || null, nombre: r.nombre })
    }
    const total = c.si + c.no + c.antes + c.ns
    let sugerida = 'pendiente'
    if (total) {
      if (c.si > total / 2) sugerida = 'incluir'
      else if (c.no === total) sugerida = 'descartar'
      else if (c.antes > total / 2) sugerida = 'fondo_acumulado'
    }
    return {
      id: it.id, texto: it.texto, ayuda: it.ayuda, serie: it.serie, subserie: it.subserie,
      propuesta_id: it.propuesta_id, origen: it.origen, orden: it.orden,
      conteo: c, total, soporte, volumen, periodos,
      sugerida, decision: it.decision || null
    }
  })
  const resumen = {
    items: filas.length,
    respuestas: respuestas.length,
    incluir: filas.filter(f => (f.decision || f.sugerida) === 'incluir').length,
    descartar: filas.filter(f => (f.decision || f.sugerida) === 'descartar').length,
    fondo_acumulado: filas.filter(f => (f.decision || f.sugerida) === 'fondo_acumulado').length,
    pendiente: filas.filter(f => (f.decision || f.sugerida) === 'pendiente').length
  }
  return { filas, resumen }
}

async function respuestasDe(db, listaId) {
  const rows = await db.all(`SELECT * FROM verif_respuestas WHERE lista_id = ? ORDER BY enviado_en`, [listaId])
  return rows.map(r => ({
    id: r.id, nombre: r.nombre, cargo: r.cargo, enviado_en: r.enviado_en,
    respuestas: parse(r.respuestas, {}), adicionales: r.adicionales, observaciones: r.observaciones
  }))
}

export async function detalle(db, entidadId, id) {
  const l = await obtenerLista(db, entidadId, id)
  if (!l) return { ok: false, status: 404, error: 'Lista no encontrada' }
  const items = await itemsDe(db, l.id)
  const respuestas = await respuestasDe(db, l.id)
  const { filas, resumen } = consolidar(items, respuestas)
  return {
    ok: true, lista: publicaLista(l), items: filas, resumen,
    respuestas: respuestas.map(r => ({ id: r.id, nombre: r.nombre, cargo: r.cargo, enviado_en: r.enviado_en, adicionales: r.adicionales, observaciones: r.observaciones, respuestas: r.respuestas })),
    adicionales: respuestas.filter(r => r.adicionales).map(r => ({ nombre: r.nombre, cargo: r.cargo, texto: r.adicionales }))
  }
}

// ---------------- Aplicar resultados a las propuestas de la TRD ----------------
// Usa la decisión del asesor (o la sugerida si no la cambió):
//   incluir + ítem manual con serie → crea una propuesta (estado 'propuesta') en la dependencia
//   incluir + ítem ligado → deja constancia en observaciones de la propuesta
//   descartar + ítem ligado en estado 'propuesta' → la marca 'rechazada' (las aprobadas no se tocan)
//   fondo acumulado → constancia en observaciones (va a TVD, no a la TRD vigente)
//   pendiente → no hace nada
export async function aplicar(db, entidadId, id, usuario = '') {
  const d = await detalle(db, entidadId, id)
  if (!d.ok) return d
  const l = d.lista
  const fechaTxt = new Date().toISOString().slice(0, 10)
  const firma = `Verificación con la dependencia (${fechaTxt}, ${d.resumen.respuestas} respuesta(s))`
  const out = { creadas: 0, confirmadas: 0, descartadas: 0, fondo_acumulado: 0, omitidas: [], sin_cambio: 0 }

  for (const f of d.items) {
    const dec = f.decision || f.sugerida
    const prop = f.propuesta_id
      ? await db.get(`SELECT id, estado, observaciones_revision FROM trd_series_propuestas WHERE id = ? AND CAST(entidad_id AS TEXT) = ?`, [f.propuesta_id, String(entidadId)])
      : null
    const anotar = async (nota) => {
      const previa = prop.observaciones_revision ? `${prop.observaciones_revision}\n` : ''
      await db.run(`UPDATE trd_series_propuestas SET observaciones_revision = ? WHERE id = ?`, [`${previa}${nota}`.slice(-4000), prop.id])
    }

    if (dec === 'incluir') {
      if (prop) { await anotar(`${firma}: la dependencia confirma que produce esta documentación.`); out.confirmadas++ }
      else if (!f.propuesta_id) {
        if (!f.serie) { out.omitidas.push({ id: f.id, texto: f.texto, motivo: 'Falta indicar la serie para crear la propuesta' }); continue }
        const pid = nuevoId('VP')
        await db.run(
          `INSERT INTO trd_series_propuestas (id, nombre_serie, nombre_subserie, tipologia_documental, justificacion, confianza, estado, creado_en, entidad_id, dependencia_id)
           VALUES (?, ?, ?, NULL, ?, ?, 'propuesta', ?, ?, ?)`,
          [pid, f.serie.toUpperCase(), f.subserie || null, `${firma}: la dependencia confirma «${f.texto}».`, 0.8, now(), String(entidadId), Number(l.dependencia_id)]
        )
        await db.run(`UPDATE verif_items SET propuesta_id = ? WHERE id = ?`, [pid, f.id])
        out.creadas++
      } else out.omitidas.push({ id: f.id, texto: f.texto, motivo: 'La propuesta ligada ya no existe' })
    } else if (dec === 'descartar') {
      if (prop && prop.estado === 'propuesta') {
        await db.run(`UPDATE trd_series_propuestas SET estado = 'rechazada' WHERE id = ?`, [prop.id])
        await anotar(`${firma}: la dependencia indica que no produce esta documentación.`)
        out.descartadas++
      } else if (prop) {
        await anotar(`${firma}: la dependencia indica que no la produce. Revisar antes del comité (la serie ya estaba ${prop.estado}).`)
        out.descartadas++
      } else out.sin_cambio++
    } else if (dec === 'fondo_acumulado') {
      if (prop) {
        const per = f.periodos.map(p => `${p.desde || '?'}–${p.hasta || '?'}`).join(', ')
        await anotar(`${firma}: se producía antes y ya no${per ? ` (periodos: ${per})` : ''}. Corresponde a fondo acumulado (TVD).`)
      }
      out.fondo_acumulado++
    } else out.sin_cambio++
  }
  await db.run(`UPDATE verif_listas SET aplicado_en = ?, actualizado_en = ? WHERE id = ?`, [now(), now(), l.id])
  return { ok: true, ...out }
}

// ---------------- Exportación ----------------
export function csvResultados(d) {
  const etiqueta = { incluir: 'Incluir', descartar: 'Descartar', fondo_acumulado: 'Fondo acumulado', pendiente: 'Pendiente' }
  const q = (v) => `"${String(v ?? '').replace(/"/g, '""')}"`
  const filas = [['Documento o expediente', 'Serie', 'Subserie', 'Sí', 'No', 'Antes sí, ahora no', 'No sé', 'Papel', 'Digital', 'Ambos', 'Periodos (antes)', 'Decisión']]
  for (const f of d.items) {
    filas.push([f.texto, f.serie, f.subserie, f.conteo.si, f.conteo.no, f.conteo.antes, f.conteo.ns,
      f.soporte.papel, f.soporte.digital, f.soporte.ambos,
      f.periodos.map(p => `${p.desde || '?'}-${p.hasta || '?'}`).join('; '),
      etiqueta[f.decision || f.sugerida]])
  }
  return '﻿' + filas.map(r => r.map(q).join(';')).join('\r\n')
}

// ======================================================
// Acceso PÚBLICO por token (sin sesión)
// ======================================================
async function listaPorToken(db, token) {
  if (!token || typeof token !== 'string' || token.length < 20 || token.length > 64) return null
  return db.get(
    `SELECT l.*, d.nombre AS dependencia_nombre
       FROM verif_listas l
       LEFT JOIN dependencias d ON CAST(d.id AS TEXT) = l.dependencia_id
      WHERE l.token = ?`,
    [token]
  )
}

export async function formularioPublico(db, token) {
  const l = await listaPorToken(db, token)
  if (!l) return { ok: false, status: 404, error: 'El enlace no es válido.' }
  if (l.estado !== 'abierta')
    return { ok: false, status: 410, error: l.estado === 'cerrada' ? 'Esta verificación ya se cerró. Gracias.' : 'Esta verificación todavía no está abierta.' }
  const items = await itemsDe(db, l.id)
  return {
    ok: true,
    entidad: await nombreEntidad(db, l.entidad_id),
    dependencia: l.dependencia_nombre || '',
    titulo: l.titulo, mensaje: l.mensaje, fecha_limite: l.fecha_limite,
    preguntar_soporte: !!Number(l.preguntar_soporte), preguntar_volumen: !!Number(l.preguntar_volumen),
    items: items.map(i => ({ id: i.id, texto: i.texto, ayuda: i.ayuda }))
  }
}

const ANIO_MIN = 1900
function anio(v) {
  if (v === undefined || v === null || v === '') return null
  const n = Number(v)
  const max = new Date().getFullYear()
  if (!Number.isInteger(n) || n < ANIO_MIN || n > max) throw new Error(`Año inválido: use un año entre ${ANIO_MIN} y ${max}`)
  return n
}

export async function enviarPublico(db, token, body = {}) {
  const l = await listaPorToken(db, token)
  if (!l) return { ok: false, status: 404, error: 'El enlace no es válido.' }
  if (l.estado !== 'abierta') return { ok: false, status: 410, error: 'Esta verificación no está recibiendo respuestas.' }
  if (body.sitio) return { ok: true } // trampa para robots: se ignora en silencio

  const nombre = txt(body.nombre, LIMITES.nombre)
  if (!nombre) return { ok: false, status: 400, error: 'Escriba su nombre.' }

  const n = await db.get(`SELECT COUNT(*) AS n FROM verif_respuestas WHERE lista_id = ?`, [l.id])
  if (Number(n?.n || 0) >= LIMITES.respuestasPorLista) return { ok: false, status: 429, error: 'Esta verificación alcanzó el máximo de respuestas.' }

  const items = await itemsDe(db, l.id)
  const validos = new Set(items.map(i => i.id))
  const entrada = body.respuestas && typeof body.respuestas === 'object' ? body.respuestas : {}
  const limpio = {}
  try {
    for (const [itemId, a] of Object.entries(entrada)) {
      if (!validos.has(itemId) || !a || typeof a !== 'object') continue
      if (!RESPUESTAS.includes(a.r)) continue
      const r = { r: a.r }
      if (a.r === 'antes') {
        r.desde = anio(a.desde); r.hasta = anio(a.hasta)
        if (r.desde && r.hasta && r.desde > r.hasta) throw new Error('El año "desde" no puede ser mayor que el año "hasta".')
      }
      if (Number(l.preguntar_soporte) && a.soporte && SOPORTES.includes(a.soporte) && a.r !== 'no') r.soporte = a.soporte
      if (Number(l.preguntar_volumen) && a.volumen && VOLUMENES.includes(a.volumen) && a.r === 'si') r.volumen = a.volumen
      limpio[itemId] = r
    }
  } catch (e) { return { ok: false, status: 400, error: e.message } }

  const faltan = items.filter(i => !limpio[i.id]).length
  if (faltan) return { ok: false, status: 400, error: `Falta responder ${faltan} ${faltan === 1 ? 'ítem' : 'ítems'}.`, faltan }

  await db.run(
    `INSERT INTO verif_respuestas (id, lista_id, entidad_id, nombre, cargo, respuestas, adicionales, observaciones, enviado_en)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [nuevoId('VR'), l.id, l.entidad_id, nombre, txt(body.cargo, LIMITES.cargo), JSON.stringify(limpio),
      txt(body.adicionales, LIMITES.adicionales), txt(body.observaciones, LIMITES.observaciones), now()]
  )
  return { ok: true }
}

export async function eliminarRespuesta(db, entidadId, respuestaId) {
  const r = await db.get(`SELECT id FROM verif_respuestas WHERE id = ? AND entidad_id = ?`, [String(respuestaId), String(entidadId)])
  if (!r) return { ok: false, status: 404, error: 'Respuesta no encontrada' }
  await db.run(`DELETE FROM verif_respuestas WHERE id = ?`, [r.id])
  return { ok: true }
}
