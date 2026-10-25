// ======================================================
// SIPAD · Verificación por dependencia — Modo entrevista
// ------------------------------------------------------
// El asesor entrevista al jefe y a los funcionarios de una oficina y marca
// en la app lo que responden. Flujo:
//   1. Importa la guía de entrevista (Excel: una hoja por dependencia, filas
//      Subserie / Tipología / Por validar con la función del manual que la
//      justifica). Queda una guía por oficina productora.
//   2. Abre una entrevista para una oficina: se copia la guía (instantánea).
//   3. Pregunta por cada subserie (Sí · No · No sabe); si es Sí, por sus
//      tipologías. Puede agregar documentos que no estaban.
//   4. Cierra la entrevista y genera el acta de levantamiento (num. 5.1.1.5
//      y 5.1.1.6 del Acuerdo AGN 001 de 2024).
//   5. Aplica: las subseries confirmadas crean o completan propuestas de la
//      TRD de la dependencia; las negadas solo dejan constancia (otra oficina
//      de la misma dependencia puede producirlas).
//
// Aditivo e idempotente; aislamiento por entidad_id; PostgreSQL y SQLite.
// ======================================================

import crypto from 'crypto'
import ExcelJS from 'exceljs'
import { partirTipologias, propuestasDependencia } from './verificacion.repository.js'

const now = () => new Date().toISOString()
const nuevoId = (p) => `${p}_${crypto.randomUUID()}`

export const RESPUESTAS_E = ['si', 'no', 'ns']
export const NIVELES = ['subserie', 'por_validar', 'tipologia']
export const LIM = { texto: 300, nota: 1000, obs: 4000, nombre: 120, cargo: 120, lugar: 200, asistentes: 30, itemsPorGuia: 3000, archivoMB: 10 }
const SIN_SERIE = /^(por definir|por validar)?$/i
// Vocabulario del ICAF (segtec_actividades)
export const FORMATOS = ['fisico', 'digital', 'ambos']
export const FRECUENCIAS = ['diaria', 'semanal', 'mensual', 'bimensual', 'trimestral', 'semestral', 'anual', 'eventual']

export async function runEntrevistaMigration(db) {
  await db.exec(`
    CREATE TABLE IF NOT EXISTS verif_guias (
      id             TEXT PRIMARY KEY,
      entidad_id     TEXT NOT NULL,
      hoja           TEXT NOT NULL,
      oficina        TEXT NOT NULL,
      contenido      TEXT,
      archivo        TEXT,
      importado_por  TEXT,
      importado_en   TEXT
    );
    CREATE INDEX IF NOT EXISTS idx_verif_guias_entidad ON verif_guias(entidad_id);
    CREATE TABLE IF NOT EXISTS verif_entrevistas (
      id              TEXT PRIMARY KEY,
      entidad_id      TEXT NOT NULL,
      dependencia_id  TEXT NOT NULL,
      guia_id         TEXT,
      hoja            TEXT,
      oficina         TEXT NOT NULL,
      fecha           TEXT,
      lugar           TEXT,
      entrevistador   TEXT,
      asistentes      TEXT,
      observaciones   TEXT,
      estado          TEXT DEFAULT 'en_curso',
      creado_por      TEXT,
      creado_en       TEXT,
      actualizado_en  TEXT,
      cerrado_en      TEXT,
      aplicado_en     TEXT
    );
    CREATE INDEX IF NOT EXISTS idx_verif_entrev_entidad ON verif_entrevistas(entidad_id);
    CREATE TABLE IF NOT EXISTS verif_entrevista_items (
      id             TEXT PRIMARY KEY,
      entrevista_id  TEXT NOT NULL,
      entidad_id     TEXT NOT NULL,
      padre_id       TEXT,
      nivel          TEXT NOT NULL,
      orden          INTEGER,
      serie          TEXT,
      subserie       TEXT,
      texto          TEXT NOT NULL,
      funcion        TEXT,
      fuente         TEXT,
      nota_guia      TEXT,
      comun          INTEGER DEFAULT 0,
      origen         TEXT DEFAULT 'guia',
      respuesta      TEXT,
      nota           TEXT,
      propuesta_id   TEXT,
      creado_en      TEXT
    );
    CREATE INDEX IF NOT EXISTS idx_verif_eitems_entrev ON verif_entrevista_items(entrevista_id);
  `)
  // Columnas del ICAF (aditivas; en SQLite no existe ADD COLUMN IF NOT EXISTS)
  for (const [c, t] of [['responsable', 'TEXT'], ['formato', 'TEXT'], ['frecuencia', 'TEXT'], ['actividad_id', 'TEXT']]) {
    try { await db.exec(`ALTER TABLE verif_entrevista_items ADD COLUMN ${c} ${t}`) } catch { /* ya existe */ }
  }
}

// ---------------- Utilidades ----------------
function txt(v, max) {
  if (v === undefined || v === null) return null
  const s = String(v).replace(/\s+/g, ' ').trim()
  return s ? s.slice(0, max) : null
}
function txtLargo(v, max) {
  if (v === undefined || v === null) return null
  const s = String(v).replace(/\r\n/g, '\n').trim()
  return s ? s.slice(0, max) : null
}
function parse(j, def) { try { return j ? JSON.parse(j) : def } catch { return def } }
export const norm = (s) => String(s || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim()
function fecha(v) {
  if (!v) return null
  const s = String(v).slice(0, 10)
  return /^\d{4}-\d{2}-\d{2}$/.test(s) ? s : null
}
function valorCelda(v) {
  if (v === null || v === undefined) return ''
  if (typeof v === 'object') {
    if (Array.isArray(v.richText)) return v.richText.map(r => r.text).join('')
    if (v.text !== undefined) return String(v.text)
    if (v.result !== undefined) return String(v.result)
    return ''
  }
  return String(v)
}

// ======================================================
// Guías: lectura del Excel
// ======================================================
// Hojas de guía: encabezado con Oficina · Nivel · Serie · Subserie · Tipología documental.
// Hoja "Comunes por oficina": fila 1 serie, fila 2 subserie, columnas A-B dependencia/oficina;
// una celda con "Sí" (o vacía) indica que se pregunta en esa oficina.
// Hoja "Comunes (tipologías)": Serie · Subserie · Tipología (opcional).
export async function leerGuiasLibro(buffer) {
  const wb = new ExcelJS.Workbook()
  await wb.xlsx.load(buffer)
  const guias = new Map() // `${hoja}|${oficina}` -> { hoja, oficina, items: [] }
  const guia = (hoja, oficina) => {
    const k = `${hoja}|${oficina}`
    if (!guias.has(k)) guias.set(k, { hoja, oficina, items: [] })
    return guias.get(k)
  }
  const tipsComunes = new Map()
  let hojaComunes = null

  wb.eachSheet(ws => {
    const nombre = ws.name.trim()
    if (/^comunes.*tipolog/i.test(nombre)) {
      ws.eachRow((row, n) => {
        if (n === 1) return
        const [s, ss, t] = [2, 3, 4].map(c => txt(valorCelda(row.getCell(c - 1).value), LIM.texto))
        if (!ss || !t) return
        const k = `${norm(s)}|${norm(ss)}`
        if (!tipsComunes.has(k)) tipsComunes.set(k, [])
        if (!tipsComunes.get(k).includes(t)) tipsComunes.get(k).push(t)
      })
      return
    }
    if (/^comunes/i.test(nombre)) { hojaComunes = ws; return }
    const cab = (ws.getRow(1).values || []).map(v => norm(valorCelda(v)))
    const col = (re) => cab.findIndex(c => re.test(c))
    const c = {
      of: col(/^oficina$/), nivel: col(/^nivel$/), serie: col(/^serie$/), sub: col(/^subserie$/),
      tip: col(/^tipologia/), nota: col(/^observacion/), fn: col(/^funcion/), fuente: col(/^fuente$/)
    }
    if (c.of < 1 || c.nivel < 1 || c.sub < 1 || c.tip < 1) return
    let actual = null
    ws.eachRow((row, n) => {
      if (n === 1) return
      const v = (i) => i > 0 ? valorCelda(row.getCell(i).value) : ''
      const oficina = txt(v(c.of), LIM.nombre)
      const nivel = norm(v(c.nivel))
      if (!oficina || !nivel) return
      const g = guia(nombre, oficina)
      if (nivel === 'subserie' || nivel === 'por validar') {
        actual = {
          nivel: nivel === 'subserie' ? 'subserie' : 'por_validar',
          serie: txt(v(c.serie), LIM.texto), subserie: txt(v(c.sub), LIM.texto),
          funcion: txtLargo(v(c.fn), LIM.nota), fuente: txt(v(c.fuente), LIM.texto),
          nota: txtLargo(v(c.nota), LIM.nota), comun: false, tipologias: []
        }
        actual.texto = actual.subserie || actual.serie
        if (actual.texto) g.items.push(actual)
        else actual = null
      } else if (nivel === 'tipologia' && actual) {
        const t = txt(v(c.tip), LIM.texto)
        if (t && !actual.tipologias.includes(t)) actual.tipologias.push(t)
      }
    })
  })

  if (hojaComunes) {
    const fila1 = hojaComunes.getRow(1), fila2 = hojaComunes.getRow(2)
    const dosFilas = norm(valorCelda(fila2.getCell(1).value)) === 'dependencia'
    const columnas = []
    for (let i = 3; i <= hojaComunes.columnCount; i++) {
      const serie = dosFilas ? txt(valorCelda(fila1.getCell(i).value), LIM.texto) : null
      const sub = txt(valorCelda((dosFilas ? fila2 : fila1).getCell(i).value), LIM.texto)
      if (sub) columnas.push({ i, serie, sub })
    }
    hojaComunes.eachRow((row, n) => {
      if (n <= (dosFilas ? 2 : 1)) return
      const hoja = txt(valorCelda(row.getCell(1).value), LIM.nombre)
      const oficina = txt(valorCelda(row.getCell(2).value), LIM.nombre)
      if (!hoja || !oficina) return
      const g = guia(hoja, oficina)
      for (const cdef of columnas) {
        const marca = norm(valorCelda(row.getCell(cdef.i).value))
        if (marca === 'no') continue // el asesor ya la descartó para esta oficina
        if (g.items.some(it => norm(it.subserie) === norm(cdef.sub))) continue
        g.items.push({
          nivel: 'subserie', serie: cdef.serie, subserie: cdef.sub, texto: cdef.sub, comun: true,
          funcion: 'Subserie común (se pregunta en todas las oficinas)', fuente: 'Propuesta de series comunes', nota: null,
          tipologias: tipsComunes.get(`${norm(cdef.serie)}|${norm(cdef.sub)}`) || []
        })
      }
    })
  }
  return [...guias.values()].filter(g => g.items.length)
}

export async function importarGuias(db, entidadId, body = {}, usuario = '') {
  const b64 = typeof body.archivo === 'string' ? body.archivo.replace(/^data:[^,]*,/, '') : ''
  if (!b64) return { ok: false, status: 400, error: 'Adjunte el Excel de la guía de entrevista' }
  const buffer = Buffer.from(b64, 'base64')
  if (buffer.length > LIM.archivoMB * 1024 * 1024) return { ok: false, status: 400, error: `El archivo supera ${LIM.archivoMB} MB` }
  let guias
  try { guias = await leerGuiasLibro(buffer) } catch { return { ok: false, status: 400, error: 'No se pudo leer el archivo. Use el Excel de guías (.xlsx).' } }
  if (!guias.length) return { ok: false, status: 400, error: 'El archivo no tiene hojas con el formato de guía (Oficina, Nivel, Serie, Subserie, Tipología documental).' }

  const t = now()
  let subseries = 0, tipologias = 0
  for (const g of guias) {
    const items = g.items.slice(0, LIM.itemsPorGuia)
    subseries += items.length
    tipologias += items.reduce((s, i) => s + i.tipologias.length, 0)
    // Reimportar reemplaza la guía de la misma hoja y oficina (las entrevistas ya abiertas no cambian)
    const previa = await db.get(`SELECT id FROM verif_guias WHERE entidad_id = ? AND hoja = ? AND oficina = ?`, [String(entidadId), g.hoja, g.oficina])
    if (previa) {
      await db.run(`UPDATE verif_guias SET contenido = ?, archivo = ?, importado_por = ?, importado_en = ? WHERE id = ?`,
        [JSON.stringify(items), txt(body.nombre, LIM.lugar), txt(usuario, LIM.nombre), t, previa.id])
    } else {
      await db.run(`INSERT INTO verif_guias (id, entidad_id, hoja, oficina, contenido, archivo, importado_por, importado_en) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [nuevoId('VG'), String(entidadId), g.hoja, g.oficina, JSON.stringify(items), txt(body.nombre, LIM.lugar), txt(usuario, LIM.nombre), t])
    }
  }
  return { ok: true, oficinas: guias.length, hojas: [...new Set(guias.map(g => g.hoja))], subseries, tipologias }
}

export async function listarGuias(db, entidadId) {
  const rows = await db.all(`SELECT * FROM verif_guias WHERE entidad_id = ? ORDER BY hoja, oficina`, [String(entidadId)])
  return rows.map(r => {
    const items = parse(r.contenido, [])
    return {
      id: r.id, hoja: r.hoja, oficina: r.oficina, archivo: r.archivo, importado_en: r.importado_en,
      subseries: items.length, por_validar: items.filter(i => i.nivel === 'por_validar').length,
      comunes: items.filter(i => i.comun).length,
      tipologias: items.reduce((s, i) => s + (i.tipologias?.length || 0), 0)
    }
  })
}

export async function eliminarGuia(db, entidadId, id) {
  const r = await db.run(`DELETE FROM verif_guias WHERE id = ? AND entidad_id = ?`, [String(id), String(entidadId)])
  return r.changes ? { ok: true } : { ok: false, status: 404, error: 'Guía no encontrada' }
}

// ======================================================
// Entrevistas
// ======================================================
async function obtener(db, entidadId, id) {
  return db.get(
    `SELECT e.*, d.nombre AS dependencia_nombre FROM verif_entrevistas e
       LEFT JOIN dependencias d ON CAST(d.id AS TEXT) = e.dependencia_id
      WHERE e.id = ? AND e.entidad_id = ?`, [String(id), String(entidadId)])
}
const itemsDe = (db, id) => db.all(`SELECT * FROM verif_entrevista_items WHERE entrevista_id = ? ORDER BY orden, creado_en`, [id])

function publica(e) {
  return {
    id: e.id, dependencia_id: e.dependencia_id, dependencia_nombre: e.dependencia_nombre || null,
    guia_id: e.guia_id, hoja: e.hoja, oficina: e.oficina, fecha: e.fecha, lugar: e.lugar,
    entrevistador: e.entrevistador, asistentes: parse(e.asistentes, []), observaciones: e.observaciones,
    estado: e.estado, creado_en: e.creado_en, actualizado_en: e.actualizado_en, cerrado_en: e.cerrado_en, aplicado_en: e.aplicado_en
  }
}

export async function crearEntrevista(db, entidadId, body = {}, usuario = '') {
  const dep = await db.get(`SELECT id, nombre FROM dependencias WHERE CAST(entidad_id AS TEXT) = ? AND CAST(id AS TEXT) = ?`, [String(entidadId), String(body.dependencia_id ?? '')])
  if (!dep) return { ok: false, status: 400, error: 'Seleccione la dependencia en SIPAD a la que pertenece la oficina' }
  let guia = null
  if (body.guia_id) {
    guia = await db.get(`SELECT * FROM verif_guias WHERE id = ? AND entidad_id = ?`, [String(body.guia_id), String(entidadId)])
    if (!guia) return { ok: false, status: 400, error: 'La guía seleccionada no existe' }
  }
  const oficina = txt(body.oficina, LIM.nombre) || guia?.oficina
  if (!oficina) return { ok: false, status: 400, error: 'Escriba el nombre de la oficina productora' }

  const id = nuevoId('VE'), t = now()
  await db.run(
    `INSERT INTO verif_entrevistas (id, entidad_id, dependencia_id, guia_id, hoja, oficina, fecha, lugar, entrevistador, asistentes, estado, creado_por, creado_en, actualizado_en)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, '[]', 'en_curso', ?, ?, ?)`,
    [id, String(entidadId), String(dep.id), guia?.id || null, guia?.hoja || null, oficina,
      fecha(body.fecha) || t.slice(0, 10), txt(body.lugar, LIM.lugar), txt(body.entrevistador, LIM.nombre) || txt(usuario, LIM.nombre),
      txt(usuario, LIM.nombre), t, t])

  let orden = 0
  for (const it of parse(guia?.contenido, [])) {
    const pid = nuevoId('EI')
    await db.run(
      `INSERT INTO verif_entrevista_items (id, entrevista_id, entidad_id, padre_id, nivel, orden, serie, subserie, texto, funcion, fuente, nota_guia, comun, origen, creado_en)
       VALUES (?, ?, ?, NULL, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'guia', ?)`,
      [pid, id, String(entidadId), NIVELES.includes(it.nivel) ? it.nivel : 'subserie', ++orden, it.serie || null, it.subserie || null,
        String(it.texto || it.subserie || it.serie).slice(0, LIM.texto), it.funcion || null, it.fuente || null, it.nota || null, it.comun ? 1 : 0, t])
    for (const tip of it.tipologias || []) {
      await db.run(
        `INSERT INTO verif_entrevista_items (id, entrevista_id, entidad_id, padre_id, nivel, orden, texto, origen, creado_en)
         VALUES (?, ?, ?, ?, 'tipologia', ?, ?, 'guia', ?)`,
        [nuevoId('EI'), id, String(entidadId), pid, ++orden, String(tip).slice(0, LIM.texto), t])
    }
  }
  return { ok: true, id }
}

export async function listarEntrevistas(db, entidadId) {
  const rows = await db.all(
    `SELECT e.*, d.nombre AS dependencia_nombre FROM verif_entrevistas e
       LEFT JOIN dependencias d ON CAST(d.id AS TEXT) = e.dependencia_id
      WHERE e.entidad_id = ? ORDER BY e.creado_en DESC`, [String(entidadId)])
  const out = []
  for (const e of rows) out.push({ ...publica(e), resumen: resumir(await itemsDe(db, e.id)) })
  return out
}

// Árbol subserie → tipologías + cifras
function arbol(items) {
  const hijos = new Map()
  for (const i of items) if (i.padre_id) { if (!hijos.has(i.padre_id)) hijos.set(i.padre_id, []); hijos.get(i.padre_id).push(i) }
  const fila = (i) => ({
    id: i.id, nivel: i.nivel, serie: i.serie, subserie: i.subserie, texto: i.texto, funcion: i.funcion, fuente: i.fuente,
    nota_guia: i.nota_guia, comun: !!Number(i.comun), origen: i.origen, respuesta: i.respuesta || null, nota: i.nota, propuesta_id: i.propuesta_id,
    responsable: i.responsable || null, formato: i.formato || null, frecuencia: i.frecuencia || null, actividad_id: i.actividad_id || null
  })
  return items.filter(i => !i.padre_id).map(i => ({ ...fila(i), tipologias: (hijos.get(i.id) || []).map(fila) }))
}
export function resumir(items) {
  const raiz = items.filter(i => !i.padre_id)
  const c = (arr, r) => arr.filter(i => (i.respuesta || null) === r).length
  const siIds = new Set(raiz.filter(i => i.respuesta === 'si').map(i => i.id))
  const tipsSi = items.filter(i => i.padre_id && siIds.has(i.padre_id))
  return {
    subseries: raiz.length, si: c(raiz, 'si'), no: c(raiz, 'no'), ns: c(raiz, 'ns'), pendientes: c(raiz, null),
    tipologias_confirmadas: c(tipsSi, 'si'), tipologias_por_marcar: c(tipsSi, null),
    agregados: items.filter(i => i.origen === 'agregado').length
  }
}

export async function detalleEntrevista(db, entidadId, id) {
  const e = await obtener(db, entidadId, id)
  if (!e) return { ok: false, status: 404, error: 'Entrevista no encontrada' }
  const items = await itemsDe(db, e.id)
  const ent = await db.get(`SELECT nombre FROM entidades WHERE CAST(id AS TEXT) = ?`, [String(entidadId)]).catch(() => null)
  const pub = publica(e)
  const arb = arbol(items)
  for (const s of arb) s.responsable_sugerido = sugerirResponsable(s, pub.asistentes)
  return { ok: true, entidad: ent?.nombre || '', entrevista: pub, items: arb, resumen: resumir(items) }
}

export async function actualizarEntrevista(db, entidadId, id, body = {}) {
  const e = await obtener(db, entidadId, id)
  if (!e) return { ok: false, status: 404, error: 'Entrevista no encontrada' }
  const campos = [], valores = []
  if ('fecha' in body) { campos.push('fecha = ?'); valores.push(fecha(body.fecha) || e.fecha) }
  if ('lugar' in body) { campos.push('lugar = ?'); valores.push(txt(body.lugar, LIM.lugar)) }
  if ('entrevistador' in body) { campos.push('entrevistador = ?'); valores.push(txt(body.entrevistador, LIM.nombre)) }
  if ('oficina' in body) { const o = txt(body.oficina, LIM.nombre); if (o) { campos.push('oficina = ?'); valores.push(o) } }
  if ('observaciones' in body) { campos.push('observaciones = ?'); valores.push(txtLargo(body.observaciones, LIM.obs)) }
  if ('asistentes' in body) {
    if (!Array.isArray(body.asistentes)) return { ok: false, status: 400, error: 'Asistentes inválidos' }
    const a = []
    for (const x of body.asistentes.slice(0, LIM.asistentes)) {
      const nombre = txt(x?.nombre, LIM.nombre)
      if (!nombre) continue
      let usuario_id = null
      if (x?.usuario_id !== undefined && x?.usuario_id !== null && x?.usuario_id !== '') {
        const u = await db.get(`SELECT id FROM usuarios WHERE CAST(id AS TEXT) = ? AND CAST(entidad_id AS TEXT) = ?`, [String(x.usuario_id), String(entidadId)]).catch(() => null)
        if (!u) return { ok: false, status: 400, error: `El usuario vinculado a ${nombre} no pertenece a la entidad` }
        usuario_id = Number(u.id)
      }
      const id = /^[A-Za-z0-9_-]{4,40}$/.test(String(x?.id || '')) ? String(x.id) : `as_${crypto.randomBytes(5).toString('hex')}`
      a.push({ id, nombre, cargo: txt(x?.cargo, LIM.cargo), jefe: !!x?.jefe, usuario_id })
    }
    campos.push('asistentes = ?'); valores.push(JSON.stringify(a))
  }
  if ('estado' in body) {
    if (!['en_curso', 'cerrada'].includes(body.estado)) return { ok: false, status: 400, error: 'Estado inválido' }
    if (body.estado === 'cerrada') {
      const r = resumir(await itemsDe(db, e.id))
      if (r.pendientes) return { ok: false, status: 400, error: `Faltan ${r.pendientes} subserie(s) por responder. Marque "No sabe" si la oficina no tiene certeza.`, pendientes: r.pendientes }
      const asist = 'asistentes' in body ? body.asistentes : parse(e.asistentes, [])
      if (!asist.some(x => txt(x?.nombre, LIM.nombre))) return { ok: false, status: 400, error: 'Registre al menos un asistente (quien firma el acta).' }
      campos.push('cerrado_en = ?'); valores.push(now())
    }
    campos.push('estado = ?'); valores.push(body.estado)
  }
  if (!campos.length) return { ok: true }
  campos.push('actualizado_en = ?'); valores.push(now())
  await db.run(`UPDATE verif_entrevistas SET ${campos.join(', ')} WHERE id = ?`, [...valores, e.id])
  return { ok: true }
}

export async function eliminarEntrevista(db, entidadId, id) {
  const e = await obtener(db, entidadId, id)
  if (!e) return { ok: false, status: 404, error: 'Entrevista no encontrada' }
  await db.run(`DELETE FROM verif_entrevista_items WHERE entrevista_id = ?`, [e.id])
  await db.run(`DELETE FROM verif_entrevistas WHERE id = ?`, [e.id])
  return { ok: true }
}

async function itemConEntrevista(db, entidadId, itemId) {
  const it = await db.get(`SELECT * FROM verif_entrevista_items WHERE id = ? AND entidad_id = ?`, [String(itemId), String(entidadId)])
  if (!it) return { error: { ok: false, status: 404, error: 'Ítem no encontrado' } }
  const e = await obtener(db, entidadId, it.entrevista_id)
  if (!e) return { error: { ok: false, status: 404, error: 'Entrevista no encontrada' } }
  if (e.estado === 'cerrada') return { error: { ok: false, status: 409, error: 'La entrevista está cerrada. Reábrala para cambiar respuestas.' } }
  return { it, e }
}

// Marca la respuesta o corrige datos de un ítem (serie/subserie/texto para lo agregado o por validar)
export async function responderItem(db, entidadId, itemId, body = {}) {
  const { it, e, error } = await itemConEntrevista(db, entidadId, itemId)
  if (error) return error
  const campos = [], valores = []
  if ('respuesta' in body) {
    if (body.respuesta !== null && !RESPUESTAS_E.includes(body.respuesta)) return { ok: false, status: 400, error: 'Respuesta inválida' }
    campos.push('respuesta = ?'); valores.push(body.respuesta)
  }
  if ('nota' in body) { campos.push('nota = ?'); valores.push(txtLargo(body.nota, LIM.nota)) }
  if (!it.padre_id) {
    if ('serie' in body) { campos.push('serie = ?'); valores.push(txt(body.serie, LIM.texto)) }
    if ('subserie' in body) { campos.push('subserie = ?'); valores.push(txt(body.subserie, LIM.texto)) }
    if ('formato' in body) {
      if (body.formato !== null && !FORMATOS.includes(body.formato)) return { ok: false, status: 400, error: 'Formato inválido' }
      campos.push('formato = ?'); valores.push(body.formato)
    }
    if ('frecuencia' in body) {
      if (body.frecuencia !== null && !FRECUENCIAS.includes(body.frecuencia)) return { ok: false, status: 400, error: 'Frecuencia inválida' }
      campos.push('frecuencia = ?'); valores.push(body.frecuencia)
    }
    if ('responsable' in body) {
      const asist = parse(e.asistentes, [])
      if (body.responsable !== null && !asist.some(a => a.id === body.responsable)) return { ok: false, status: 400, error: 'Registre primero a la persona en los participantes' }
      campos.push('responsable = ?'); valores.push(body.responsable)
    }
  }
  if ('texto' in body && it.origen === 'agregado') {
    const t = txt(body.texto, LIM.texto)
    if (!t) return { ok: false, status: 400, error: 'El texto no puede quedar vacío' }
    campos.push('texto = ?'); valores.push(t)
  }
  if (!campos.length) return { ok: true }
  await db.run(`UPDATE verif_entrevista_items SET ${campos.join(', ')} WHERE id = ?`, [...valores, it.id])
  await db.run(`UPDATE verif_entrevistas SET actualizado_en = ? WHERE id = ?`, [now(), e.id])
  return { ok: true }
}

// Agrega un documento que la oficina mencionó: con padre_id es una tipología de esa
// subserie; sin padre_id es una subserie nueva (por validar si no trae serie).
export async function agregarItemEntrevista(db, entidadId, entrevistaId, body = {}) {
  const e = await obtener(db, entidadId, entrevistaId)
  if (!e) return { ok: false, status: 404, error: 'Entrevista no encontrada' }
  if (e.estado === 'cerrada') return { ok: false, status: 409, error: 'La entrevista está cerrada. Reábrala para agregar documentos.' }
  const texto = txt(body.texto, LIM.texto)
  if (!texto) return { ok: false, status: 400, error: 'Escriba el documento' }
  let padre = null
  if (body.padre_id) {
    padre = await db.get(`SELECT * FROM verif_entrevista_items WHERE id = ? AND entrevista_id = ? AND padre_id IS NULL`, [String(body.padre_id), e.id])
    if (!padre) return { ok: false, status: 400, error: 'La subserie no existe en esta entrevista' }
  }
  const items = await itemsDe(db, e.id)
  let orden = items.reduce((m, i) => Math.max(m, Number(i.orden) || 0), 0) + 1
  if (padre) { // queda al final de las tipologías de su subserie
    const deEsa = items.filter(i => i.padre_id === padre.id || i.id === padre.id)
    orden = deEsa.reduce((m, i) => Math.max(m, Number(i.orden) || 0), 0) + 1
    await db.run(`UPDATE verif_entrevista_items SET orden = orden + 1 WHERE entrevista_id = ? AND orden >= ?`, [e.id, orden])
  }
  const id = nuevoId('EI')
  const serie = padre ? null : txt(body.serie, LIM.texto)
  await db.run(
    `INSERT INTO verif_entrevista_items (id, entrevista_id, entidad_id, padre_id, nivel, orden, serie, subserie, texto, origen, respuesta, creado_en)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'agregado', 'si', ?)`,
    [id, e.id, String(entidadId), padre?.id || null, padre ? 'tipologia' : (serie ? 'subserie' : 'por_validar'), orden,
      serie, padre ? null : (txt(body.subserie, LIM.texto) || texto), texto, now()])
  if (padre && !padre.respuesta) await db.run(`UPDATE verif_entrevista_items SET respuesta = 'si' WHERE id = ?`, [padre.id])
  await db.run(`UPDATE verif_entrevistas SET actualizado_en = ? WHERE id = ?`, [now(), e.id])
  return { ok: true, id }
}

export async function eliminarItemEntrevista(db, entidadId, itemId) {
  const { it, error } = await itemConEntrevista(db, entidadId, itemId)
  if (error) return error
  if (it.origen !== 'agregado') return { ok: false, status: 400, error: 'Solo se pueden quitar los documentos agregados en la entrevista. Para los de la guía marque "No".' }
  await db.run(`DELETE FROM verif_entrevista_items WHERE id = ? OR padre_id = ?`, [it.id, it.id])
  return { ok: true }
}

// ======================================================
// Aplicar a las propuestas de la TRD
// ======================================================
export async function aplicarEntrevista(db, entidadId, id) {
  const d = await detalleEntrevista(db, entidadId, id)
  if (!d.ok) return d
  const e = d.entrevista
  if (e.estado !== 'cerrada') return { ok: false, status: 409, error: 'Cierre la entrevista (acta) antes de llevar los resultados a la TRD.' }
  const marca = `[Entrevista ${e.id}]`
  const quien = e.asistentes.map(a => a.nombre).join(', ')
  const firma = `${marca} Entrevista con ${e.oficina} (${e.fecha}${quien ? `; ${quien}` : ''})`
  const props = await propuestasDependencia(db, entidadId, e.dependencia_id)
  const buscarProp = (serie, sub) => props.find(p => norm(p.nombre_serie) === norm(serie) && norm(p.nombre_subserie) === norm(sub))
  const out = { creadas: 0, completadas: 0, anotadas_no: 0, omitidas: [] }

  for (const s of d.items) {
    if (s.respuesta !== 'si' && s.respuesta !== 'no') continue
    const serie = txt(s.serie, LIM.texto)
    let prop = null
    if (s.propuesta_id) prop = await db.get(`SELECT id, nombre_serie, nombre_subserie, tipologia_documental, observaciones_revision, estado FROM trd_series_propuestas WHERE id = ? AND CAST(entidad_id AS TEXT) = ?`, [s.propuesta_id, String(entidadId)])
    if (!prop && serie) prop = buscarProp(serie, s.subserie) || null
    if (prop && !('observaciones_revision' in prop)) prop = await db.get(`SELECT id, nombre_serie, nombre_subserie, tipologia_documental, observaciones_revision, estado FROM trd_series_propuestas WHERE id = ?`, [prop.id])
    const anotar = async (nota) => {
      if ((prop.observaciones_revision || '').includes(marca)) return
      const previa = prop.observaciones_revision ? `${prop.observaciones_revision}\n` : ''
      await db.run(`UPDATE trd_series_propuestas SET observaciones_revision = ? WHERE id = ?`, [`${previa}${nota}`.slice(-4000), prop.id])
    }

    if (s.respuesta === 'no') {
      if (prop) { await anotar(`${firma}: la oficina indica que no produce «${s.texto}».`); out.anotadas_no++ }
      continue
    }
    if (!serie || SIN_SERIE.test(serie)) { out.omitidas.push({ id: s.id, texto: s.texto, motivo: 'Defina la serie para llevarla a la TRD' }); continue }
    const tips = s.tipologias.filter(t => t.respuesta === 'si').map(t => t.texto)
    if (prop) {
      const actuales = partirTipologias(prop.tipologia_documental)
      const union = [...new Set([...actuales, ...tips])]
      await db.run(`UPDATE trd_series_propuestas SET tipologia_documental = ? WHERE id = ?`, [union.length ? JSON.stringify(union) : null, prop.id])
      await anotar(`${firma}: la oficina confirma que la produce${tips.length ? ` (${tips.length} tipologías)` : ''}.`)
      await db.run(`UPDATE verif_entrevista_items SET propuesta_id = ? WHERE id = ?`, [prop.id, s.id])
      out.completadas++
    } else {
      const pid = nuevoId('VP')
      const just = `${firma}: la oficina confirma «${s.texto}».${s.funcion ? ` Función del manual: ${s.funcion.replace(/\n/g, '; ')}.` : ''}`
      await db.run(
        `INSERT INTO trd_series_propuestas (id, nombre_serie, nombre_subserie, tipologia_documental, justificacion, confianza, estado, creado_en, entidad_id, dependencia_id, observaciones_revision)
         VALUES (?, ?, ?, ?, ?, ?, 'propuesta', ?, ?, ?, ?)`,
        [pid, serie.toUpperCase(), s.subserie || null, tips.length ? JSON.stringify(tips) : null, just.slice(0, 4000), 0.9, now(),
          String(entidadId), Number(e.dependencia_id), marca])
      await db.run(`UPDATE verif_entrevista_items SET propuesta_id = ? WHERE id = ?`, [pid, s.id])
      props.push({ id: pid, nombre_serie: serie.toUpperCase(), nombre_subserie: s.subserie })
      out.creadas++
    }
  }
  await db.run(`UPDATE verif_entrevistas SET aplicado_en = ?, actualizado_en = ? WHERE id = ?`, [now(), now(), e.id])
  // ICAF: una actividad por subserie confirmada, a nombre del funcionario que la produce
  const icaf = await registrarIcaf(db, entidadId, (await detalleEntrevista(db, entidadId, id)))
  return { ok: true, ...out, icaf }
}

// ======================================================
// ICAF diligenciado por entrevista (un formulario por funcionario)
// ======================================================
// Raíces de 6 letras: empareja variantes (comisario/comisaria, psicología/psicólogo, inspector/inspectora)
const palabras = (s) => new Set(norm(s).split(' ')
  .filter(w => w.length > 3 && !['profesional', 'universitario', 'tecnico', 'auxiliar', 'despacho', 'apoyo', 'municipal'].includes(w))
  .map(w => w.slice(0, 6)))

// Cargos del manual citados en la función ("Comisario de Familia · F2: …; Inspector · F1: …")
function cargosDeFuncion(funcion) {
  return String(funcion || '').split(/\n|;\s*(?=[A-ZÁÉÍÓÚ])/).map(l => l.split(' · ')[0].trim()).filter(Boolean)
}

// Sugiere quién produce la subserie: el participante cuyo cargo coincide con el
// cargo del manual; si no hay coincidencia, el jefe de la oficina.
export function sugerirResponsable(s, asistentes = []) {
  if (!asistentes.length) return null
  if (s.responsable && asistentes.some(a => a.id === s.responsable)) return s.responsable
  let mejor = null, puntos = 0
  if (!s.comun) {
    for (const cargo of cargosDeFuncion(s.funcion)) {
      const pc = palabras(cargo)
      for (const a of asistentes) {
        const n = [...palabras(a.cargo)].filter(w => pc.has(w)).length
        if (n > puntos) { puntos = n; mejor = a.id }
      }
    }
  }
  return mejor || asistentes.find(a => a.jefe)?.id || (asistentes.length === 1 ? asistentes[0].id : null)
}

export function tipoFuncion(oficina, comun) {
  if (comun) return 'apoyo'
  const o = norm(oficina)
  if (/control interno/.test(o)) return 'control'
  if (/despacho|gerente|secretario/.test(o)) return 'estrategica'
  if (/talento|humano|almacen|recursos fisicos|gestion documental|sistemas|atencion al ciudadano|contabilidad|tesoreria|presupuesto/.test(o)) return 'apoyo'
  return 'misional'
}

const minus = (t) => t ? t.charAt(0).toLowerCase() + t.slice(1) : t

function actividadDe(s, asistente, e) {
  const sub = s.subserie || s.texto
  const lineas = String(s.funcion || '').split('\n').map(l => l.trim()).filter(Boolean)
  const pc = palabras(asistente?.cargo)
  const linea = lineas.find(l => [...palabras(l.split(' · ')[0])].some(w => pc.has(w))) || lineas[0] || ''
  const resumen = linea.includes(': ') ? linea.slice(linea.indexOf(': ') + 2).trim() : ''
  const documentos = s.tipologias.filter(t => t.respuesta === 'si').map(t => t.texto)
  const serieOk = s.serie && !SIN_SERIE.test(s.serie)
  const nombre = (!s.comun && resumen) ? resumen : `Trámite de ${minus(sub)}`
  // "Comisario · F5-F8; Trabajo Social · F1-F6: Resumen" → cargo y funciones del renglón que corresponde
  const cab = linea.includes(': ') ? linea.slice(0, linea.indexOf(': ')) : linea
  const partes = cab.split(/;\s*/).map(x => x.split(' · ').map(y => y.trim()))
  const propio = partes.find(([c]) => [...palabras(c)].some(w => pc.has(w))) || partes[0] || []
  const base = s.comun || !resumen
    ? `Atender y tramitar ${minus(sub)} que corresponden a la oficina.`
    : `${resumen}${propio[0] ? `, conforme a ${propio[1] ? (/[-,y]/.test(propio[1]) ? `las funciones ${propio[1]} ` : `la función ${propio[1]} `) : 'las funciones '}del cargo ${propio[0]} en el manual de funciones` : ''}.`
  return {
    item_id: s.id, actividad_id: s.actividad_id, propuesta_id: s.propuesta_id,
    nombre, serie: serieOk ? s.serie : null, subserie: sub, documentos,
    descripcion: `${base} Como resultado produce «${sub}»${serieOk ? ` (serie ${s.serie})` : ''}.`,
    tipo_funcion: tipoFuncion(e.oficina, s.comun), frecuencia: s.frecuencia, formato: s.formato,
    expediente: documentos.length >= 2, nota: s.nota || null
  }
}

// Arma los formularios: { funcionarios: [{ asistente, actividades: [] }], sin_responsable: [] }
export function construirIcaf(d) {
  const e = d.entrevista
  const grupos = new Map(e.asistentes.map(a => [a.id, { asistente: a, actividades: [] }]))
  const sin = []
  for (const s of d.items) {
    if (s.respuesta !== 'si') continue
    const rid = s.responsable || s.responsable_sugerido
    const g = rid && grupos.get(rid)
    if (!g) { sin.push({ id: s.id, texto: s.texto }); continue }
    g.actividades.push(actividadDe(s, g.asistente, e))
  }
  return { funcionarios: [...grupos.values()].filter(g => g.actividades.length), sin_responsable: sin }
}

export async function icafEntrevista(db, entidadId, id) {
  const d = await detalleEntrevista(db, entidadId, id)
  if (!d.ok) return d
  return { ok: true, entidad: d.entidad, entrevista: d.entrevista, ...construirIcaf(d) }
}

// Registra (o actualiza) las actividades en el ICAF de SIPAD para los participantes
// vinculados a un usuario. Quien no tiene usuario igual queda en el formulario impreso.
export async function registrarIcaf(db, entidadId, d) {
  const e = d.entrevista
  const { funcionarios, sin_responsable } = construirIcaf(d)
  const out = { registradas: 0, actualizadas: 0, sin_usuario: [], sin_responsable: sin_responsable.length }
  const t = now()
  const nota = `Diligenciado mediante entrevista del ${e.fecha} (información suministrada por el funcionario y aprobada con su firma).`
  for (const g of funcionarios) {
    const a = g.asistente
    if (!a.usuario_id) { out.sin_usuario.push(a.nombre); continue }
    for (const act of g.actividades) {
      const valores = [act.nombre, act.frecuencia || null, a.cargo || null, `${act.descripcion} ${nota}`.slice(0, 4000), act.tipo_funcion,
        1, act.documentos.join('\n') || null, act.formato || null, 'misma_dependencia', a.cargo || null, act.expediente ? 1 : 0]
      let actId = act.actividad_id
      const existe = actId ? await db.get(`SELECT id FROM segtec_actividades WHERE id = ?`, [actId]) : null
      if (existe) {
        await db.run(
          `UPDATE segtec_actividades SET nombre = ?, frecuencia = ?, cargo_ejecutor = ?, descripcion_funcional = ?, tipo_funcion = ?,
             genera_documentos = ?, documentos_generados = ?, formato_produccion = ?, responsable_custodia = ?, cargo_custodia = ?,
             genera_expediente_propio = ?, usuario_id = ?, updated_at = ? WHERE id = ?`, [...valores, a.usuario_id, t, actId])
        out.actualizadas++
      } else {
        actId = crypto.randomUUID()
        await db.run(
          `INSERT INTO segtec_actividades (id, dependencia_id, usuario_id, entidad_id, nombre, frecuencia, cargo_ejecutor, descripcion_funcional, tipo_funcion,
             genera_documentos, documentos_generados, formato_produccion, responsable_custodia, cargo_custodia, genera_expediente_propio,
             estado_general, created_at, updated_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'caracterizada', ?, ?)`,
          [actId, Number(e.dependencia_id), a.usuario_id, String(entidadId), ...valores, t, t])
        await db.run(`UPDATE verif_entrevista_items SET actividad_id = ? WHERE id = ?`, [actId, act.item_id])
        out.registradas++
      }
      // Enlaza la propuesta de la TRD para que el motor no la vuelva a proponer;
      // si la propuesta ya tenía otra actividad, esta queda "completa" (el motor la omite).
      let enlazada = false
      if (act.propuesta_id) {
        const p = await db.get(`SELECT actividad_id FROM trd_series_propuestas WHERE id = ?`, [act.propuesta_id])
        if (p && (!p.actividad_id || p.actividad_id === actId)) {
          await db.run(`UPDATE trd_series_propuestas SET actividad_id = ? WHERE id = ?`, [actId, act.propuesta_id])
          enlazada = true
        }
      }
      await db.run(`UPDATE segtec_actividades SET estado_general = ? WHERE id = ?`, [enlazada ? 'caracterizada' : 'completa', actId])
    }
  }
  return out
}

// Usuarios de la entidad, para vincular a cada participante con su cuenta (ICAF)
export async function usuariosEntidad(db, entidadId) {
  try {
    return await db.all(
      `SELECT u.id, u.nombre_completo AS nombre, c.nombre AS cargo, d.nombre AS dependencia
         FROM usuarios u
         LEFT JOIN cargos c ON c.id = u.id_cargo
         LEFT JOIN dependencias d ON d.id = u.id_dependencia
        WHERE CAST(u.entidad_id AS TEXT) = ?
        ORDER BY u.nombre_completo`, [String(entidadId)])
  } catch {
    return db.all(`SELECT id, nombre_completo AS nombre FROM usuarios WHERE CAST(entidad_id AS TEXT) = ? ORDER BY nombre_completo`, [String(entidadId)]).catch(() => [])
  }
}
