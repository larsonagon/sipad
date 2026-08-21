// ======================================================
// SIPAD · Carga masiva de actividades ICAF por Excel
// ------------------------------------------------------
// Permite crear muchas actividades de una vez a partir de
// una plantilla .xlsx. Resuelve (o crea) la dependencia por
// nombre y normaliza tipo de proceso, frecuencia y formato.
//
// La lógica está separada de las rutas para poder validarla
// contra Postgres sin levantar Express.
// ======================================================

import crypto from 'crypto'
import ExcelJS from 'exceljs'

// ---------- Normalizadores ----------

const norm = s => (s === null || s === undefined ? '' : s).toString().trim()

const lower = s =>
  norm(s).toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')

function mapTipo(v) {
  const t = lower(v)
  if (!t) return null
  if (t.startsWith('mision')) return 'misional'
  if (t.startsWith('estrateg')) return 'estrategica'
  if (t.startsWith('apoyo')) return 'apoyo'
  if (t.startsWith('evalua')) return 'evaluacion'
  return t
}

function mapFormato(v) {
  const t = lower(v)
  if (!t) return null
  if (t.startsWith('fis')) return 'fisico'
  if (t.startsWith('dig')) return 'digital'
  if (t.startsWith('amb')) return 'ambos'
  return t
}

const FRECUENCIAS = ['diaria', 'semanal', 'mensual', 'bimensual', 'trimestral', 'semestral', 'anual', 'eventual']

function mapFrecuencia(v) {
  const t = lower(v)
  if (!t) return null
  return FRECUENCIAS.find(f => t.startsWith(f.slice(0, 5))) || t
}

function mapSiNo(v) {
  const t = lower(v)
  if (t === '') return null
  return (t === 'si' || t === 's' || t === '1' || t === 'x' || t === 'true') ? 1 : 0
}

// exceljs a veces entrega objetos (richText, hyperlink, result). Extrae texto plano.
function cellText(cell) {
  const v = cell && cell.value
  if (v === null || v === undefined) return ''
  if (typeof v === 'object') {
    if (Array.isArray(v.richText)) return v.richText.map(r => r.text).join('')
    if (v.text !== undefined) return norm(v.text)
    if (v.result !== undefined) return norm(v.result)
    if (v.hyperlink !== undefined) return norm(v.text || v.hyperlink)
    return norm(v.toString())
  }
  return norm(v)
}

// ---------- Columnas de la plantilla ----------

const COLUMNAS = [
  { header: 'Dependencia', key: 'dependencia', width: 34 },
  { header: 'Actividad', key: 'actividad', width: 42 },
  { header: 'Tipo de proceso (misional / estrategica / apoyo / evaluacion)', key: 'tipo', width: 34 },
  { header: 'Frecuencia (diaria / semanal / mensual / anual / eventual...)', key: 'frecuencia', width: 30 },
  { header: '¿En qué consiste?', key: 'descripcion', width: 52 },
  { header: '¿Genera documentos? (si / no)', key: 'genera', width: 20 },
  { header: 'Formato (fisico / digital / ambos)', key: 'formato', width: 22 },
  { header: 'Documentos que produce (uno por línea o separados por ;)', key: 'documentos', width: 52 }
]

// ======================================================
// Genera el buffer .xlsx de la plantilla
// ======================================================

export async function generarPlantillaBuffer() {

  const wb = new ExcelJS.Workbook()
  wb.creator = 'SIPAD'
  const ws = wb.addWorksheet('Actividades')

  ws.columns = COLUMNAS

  ws.addRow({
    dependencia: 'Secretaría de Hacienda',
    actividad: 'Expedición de certificados de disponibilidad presupuestal',
    tipo: 'apoyo',
    frecuencia: 'eventual',
    descripcion: 'Se recibe la solicitud, se verifica la disponibilidad de recursos y se expide el certificado firmado.',
    genera: 'si',
    formato: 'ambos',
    documentos: 'Certificado de disponibilidad presupuestal; Registro de solicitud; Oficio de respuesta'
  })

  const header = ws.getRow(1)
  header.font = { bold: true, color: { argb: 'FFFFFFFF' } }
  header.height = 34
  header.alignment = { vertical: 'middle', wrapText: true }
  header.eachCell(c => {
    c.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF0D3F77' } }
  })
  ws.getRow(2).alignment = { vertical: 'top', wrapText: true }
  ws.views = [{ state: 'frozen', ySplit: 1 }]

  // Hoja de instrucciones
  const ins = wb.addWorksheet('Instrucciones')
  ins.columns = [{ width: 100 }]
  const lineas = [
    'SIPAD · Carga masiva de actividades (ICAF)',
    '',
    'Cómo usar esta plantilla:',
    '1. Diligencie una fila por cada actividad, en la hoja "Actividades".',
    '2. Solo son obligatorias las columnas "Dependencia" y "Actividad".',
    '3. Si la dependencia no existe en SIPAD, se creará automáticamente al importar.',
    '4. "Documentos que produce": escriba uno por línea o sepárelos con punto y coma (;).',
    '5. No borre ni cambie el orden de la fila de encabezados.',
    '',
    'Valores sugeridos:',
    '· Tipo de proceso: misional, estrategica, apoyo, evaluacion',
    '· Frecuencia: diaria, semanal, mensual, bimensual, trimestral, semestral, anual, eventual',
    '· Formato: fisico, digital, ambos',
    '· ¿Genera documentos?: si / no'
  ]
  lineas.forEach((t, i) => {
    const r = ins.addRow([t])
    if (i === 0) r.font = { bold: true, size: 14, color: { argb: 'FF0D3F77' } }
    if (t.endsWith(':')) r.font = { bold: true }
  })

  return Buffer.from(await wb.xlsx.writeBuffer())
}

// ======================================================
// Resuelve (o crea) una dependencia por nombre
// ======================================================

async function resolverDependencia(db, nombre, entidadId, cache) {
  const clave = lower(nombre)
  if (cache.has(clave)) return cache.get(clave)

  let row = await db.get(
    `SELECT id FROM dependencias WHERE lower(nombre) = lower(?) AND entidad_id = ?`,
    [norm(nombre), entidadId]
  )

  let creada = false
  if (!row || !row.id) {
    await db.run(
      `INSERT INTO dependencias (nombre, activa, entidad_id) VALUES (?, 1, ?)`,
      [norm(nombre), entidadId]
    )
    row = await db.get(
      `SELECT id FROM dependencias WHERE lower(nombre) = lower(?) AND entidad_id = ?`,
      [norm(nombre), entidadId]
    )
    creada = true
  }

  const res = { id: row?.id ?? null, creada }
  cache.set(clave, res)
  return res
}

// ======================================================
// Núcleo: importa actividades desde un buffer .xlsx
// ======================================================

export async function importarDesdeBuffer(db, { usuarioId, entidadId, buffer }) {

  const wb = new ExcelJS.Workbook()
  await wb.xlsx.load(buffer)

  const ws = wb.getWorksheet('Actividades') || wb.worksheets[0]
  if (!ws) {
    return { ok: false, error: 'El archivo no contiene hojas de datos.' }
  }

  const cache = new Map()
  const nuevasDependencias = new Set()
  const errores = []
  let total = 0
  let creadas = 0

  const nowISO = () => new Date().toISOString()

  const filas = []
  ws.eachRow((row, idx) => { if (idx > 1) filas.push({ idx, row }) })

  for (const { idx, row } of filas) {

    const dependencia = cellText(row.getCell(1))
    const actividad = cellText(row.getCell(2))

    // Fila vacía → ignorar en silencio
    if (!dependencia && !actividad) continue

    total++

    if (!dependencia) { errores.push({ fila: idx, error: 'Falta la dependencia' }); continue }
    if (!actividad) { errores.push({ fila: idx, error: 'Falta el nombre de la actividad' }); continue }

    try {
      const dep = await resolverDependencia(db, dependencia, entidadId, cache)
      if (!dep.id) { errores.push({ fila: idx, error: 'No se pudo resolver la dependencia' }); continue }
      if (dep.creada) nuevasDependencias.add(lower(dependencia))

      const documentos = cellText(row.getCell(8))
        .split(/[\n;]+/).map(s => s.trim()).filter(Boolean).join('\n')

      const generaRaw = mapSiNo(cellText(row.getCell(6)))
      const genera = generaRaw === null ? (documentos ? 1 : 0) : generaRaw

      const id = crypto.randomUUID()

      await db.run(
        `INSERT INTO segtec_actividades (
           id, dependencia_id, usuario_id,
           nombre, frecuencia, tipo_funcion, descripcion_funcional,
           genera_documentos, documentos_generados, formato_produccion,
           estado_general, created_at, updated_at, entidad_id
         ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          id, dep.id, usuarioId,
          actividad,
          mapFrecuencia(cellText(row.getCell(4))),
          mapTipo(cellText(row.getCell(3))),
          cellText(row.getCell(5)) || null,
          genera,
          documentos || null,
          mapFormato(cellText(row.getCell(7))),
          // 'caracterizada' → elegible para el generador de propuestas TRD-AI
          'caracterizada', nowISO(), nowISO(), entidadId
        ]
      )

      creadas++

    } catch (e) {
      errores.push({ fila: idx, error: e.message })
    }
  }

  return {
    ok: true,
    resumen: {
      total,
      creadas,
      dependenciasNuevas: nuevasDependencias.size,
      nombresDependenciasNuevas: [...nuevasDependencias],
      errores
    }
  }
}

// ======================================================
// Registra las rutas de importación en el router SEGTEC
// ======================================================

export function registrarImportacion(router, db, getUsuarioId) {

  async function getEntidadId(req, usuarioId) {
    // multiTenant middleware ya deja req.entidad_id
    if (req.entidad_id) return req.entidad_id
    const u = await db.get(`SELECT entidad_id FROM usuarios WHERE id = ?`, [usuarioId])
    return u?.entidad_id || null
  }

  // Descargar plantilla
  router.get('/importar/plantilla', async (req, res) => {
    try {
      const buffer = await generarPlantillaBuffer()
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')
      res.setHeader('Content-Disposition', 'attachment; filename="plantilla-actividades-sipad.xlsx"')
      res.setHeader('Content-Length', buffer.length)
      return res.send(buffer)
    } catch (e) {
      console.error('Plantilla import error:', e)
      return res.status(500).json({ ok: false, error: 'No se pudo generar la plantilla' })
    }
  })

  // Importar archivo (base64 en el body)
  router.post('/importar', async (req, res) => {
    try {
      const usuarioId = getUsuarioId(req)
      if (!usuarioId) return res.status(401).json({ ok: false, error: 'No autenticado' })

      const entidadId = await getEntidadId(req, usuarioId)
      if (!entidadId) return res.status(400).json({ ok: false, error: 'Usuario sin entidad válida' })

      const b64 = req.body?.archivoBase64
      if (!b64) return res.status(400).json({ ok: false, error: 'Archivo requerido' })

      let buffer
      try {
        buffer = Buffer.from(b64.toString().split(',').pop(), 'base64')
      } catch {
        return res.status(400).json({ ok: false, error: 'Archivo inválido' })
      }

      const resultado = await importarDesdeBuffer(db, { usuarioId, entidadId, buffer })
      if (!resultado.ok) return res.status(400).json(resultado)

      return res.json(resultado)

    } catch (e) {
      console.error('Importar actividades error:', e)
      return res.status(500).json({ ok: false, error: 'Error procesando el archivo' })
    }
  })
}
