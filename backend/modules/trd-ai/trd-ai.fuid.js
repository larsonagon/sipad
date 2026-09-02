// ======================================================
// SIPAD · FUID — Formato Único de Inventario Documental
// (Acuerdo AGN 042 de 2002)
// ------------------------------------------------------
// Genera el FUID en Excel (.xlsx) y Word (.docx) a partir de
// la TRD aprobada de la entidad (obtenerDatosExport): pre-llena
// N.º de orden, código y nombre de series/subseries por oficina
// productora, y deja en blanco las columnas físicas (fechas
// extremas, unidad de conservación, folios, notas) para que el
// archivista las diligencie en la transferencia o eliminación.
// ======================================================

import ExcelJS from 'exceljs'
import {
  Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell,
  WidthType, AlignmentType
} from 'docx'

import { obtenerDatosExport } from './trd-ai.export.js'

// Aplana la TRD aprobada (dep→series) a filas de inventario, con
// numeración de orden continua y el código jerárquico ya calculado.
export function filasInventario(datos) {
  const filas = []
  let orden = 0
  for (const dep of datos) {
    for (const s of dep.series) {
      orden++
      filas.push({
        orden,
        codigo: s.codigo || '',
        oficina: dep.dependencia,
        nombre: s.subserie ? `${s.serie} / ${s.subserie}` : s.serie,
        soporte: 'Papel'
      })
    }
  }
  return filas
}

// ---------- EXCEL ----------

export async function generarFUIDExcel(datos, meta = {}) {
  const filas = filasInventario(datos)
  const wb = new ExcelJS.Workbook()
  wb.creator = 'SIPAD'
  const ws = wb.addWorksheet('FUID')

  ws.columns = [
    { header: 'N.º orden', key: 'orden', width: 9 },
    { header: 'Código', key: 'codigo', width: 12 },
    { header: 'Oficina productora', key: 'oficina', width: 26 },
    { header: 'Nombre de las series, subseries o asuntos', key: 'nombre', width: 42 },
    { header: 'Fecha inicial', key: 'fi', width: 13 },
    { header: 'Fecha final', key: 'ff', width: 13 },
    { header: 'Caja', key: 'caja', width: 7 },
    { header: 'Carpeta', key: 'carpeta', width: 8 },
    { header: 'Tomo', key: 'tomo', width: 7 },
    { header: 'Otro', key: 'otro', width: 7 },
    { header: 'N.º folios', key: 'folios', width: 9 },
    { header: 'Soporte', key: 'soporte', width: 10 },
    { header: 'Frecuencia de consulta', key: 'frec', width: 14 },
    { header: 'Notas', key: 'notas', width: 26 }
  ]

  const NCOL = ws.columns.length
  const colLetter = n => {
    let s = ''
    while (n > 0) { const m = (n - 1) % 26; s = String.fromCharCode(65 + m) + s; n = Math.floor((n - 1) / 26) }
    return s
  }
  const last = colLetter(NCOL)

  // Encabezado institucional (bloque del FUID)
  const bloque = [
    ['FORMATO ÚNICO DE INVENTARIO DOCUMENTAL (FUID)'],
    [`Entidad remitente: ${meta.entidad || ''}`],
    [`Entidad productora: ${meta.entidad || ''}`],
    ['Unidad administrativa: ______________________________    Oficina productora: ______________________________'],
    ['Objeto: Inventario de las series y subseries documentales conforme a la Tabla de Retención Documental (TRD).'],
    [`Registro de entrada N.º ______   ·   Hoja N.º ____ de ____   ·   Generado por SIPAD · ${meta.fecha || ''}`]
  ]
  bloque.forEach((r, i) => {
    ws.insertRow(i + 1, r)
    ws.mergeCells(`A${i + 1}:${last}${i + 1}`)
    const c = ws.getCell(`A${i + 1}`)
    if (i === 0) c.font = { bold: true, size: 14, color: { argb: 'FF0D3F77' } }
    else if (i === bloque.length - 1) c.font = { italic: true, size: 10, color: { argb: 'FF666666' } }
    else c.font = { size: 11 }
  })

  const headRowIdx = bloque.length + 1
  const headerRow = ws.getRow(headRowIdx)
  headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' }, size: 10 }
  headerRow.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true }
  headerRow.height = 34
  headerRow.eachCell(c => {
    c.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF0D3F77' } }
    c.border = thin()
  })

  for (const f of filas) {
    const row = ws.addRow({
      orden: f.orden, codigo: f.codigo, oficina: f.oficina, nombre: f.nombre,
      fi: '', ff: '', caja: '', carpeta: '', tomo: '', otro: '', folios: '',
      soporte: f.soporte, frec: '', notas: ''
    })
    row.alignment = { vertical: 'top', wrapText: true }
    ;['orden', 'codigo', 'caja', 'carpeta', 'tomo', 'otro', 'folios', 'soporte', 'frec'].forEach(k => {
      row.getCell(k).alignment = { vertical: 'middle', horizontal: 'center' }
    })
    row.eachCell(c => { c.border = thin() })
  }

  // Pie de firmas
  const foot = headRowIdx + filas.length + 2
  const firmas = [
    'Elaborado por: __________________________   Cargo: ______________   Lugar y fecha: ______________   Firma: ____________',
    'Entregado por: __________________________   Cargo: ______________   Lugar y fecha: ______________   Firma: ____________',
    'Recibido por:  __________________________   Cargo: ______________   Lugar y fecha: ______________   Firma: ____________'
  ]
  firmas.forEach((t, i) => {
    const r = foot + i
    ws.getCell(`A${r}`).value = t
    ws.mergeCells(`A${r}:${last}${r}`)
    ws.getCell(`A${r}`).font = { size: 10 }
  })

  ws.views = [{ state: 'frozen', ySplit: headRowIdx }]

  // Convenciones
  const conv = wb.addWorksheet('Convenciones')
  conv.columns = [{ width: 70 }]
  ;[
    'Convenciones del FUID (Acuerdo AGN 042 de 2002)',
    'Unidad de conservación: marque la cantidad en Caja, Carpeta, Tomo u Otro.',
    'Soporte: Papel, Electrónico, u otro medio (indique en Notas).',
    'Frecuencia de consulta: Alta, Media o Baja.',
    'Fechas extremas: fecha del documento más antiguo (inicial) y más reciente (final) del expediente.',
    'Las columnas físicas se diligencian al momento de la transferencia o eliminación.'
  ].forEach((t, i) => {
    const r = conv.addRow([t]); if (i === 0) r.font = { bold: true, size: 12 }
  })

  return Buffer.from(await wb.xlsx.writeBuffer())
}

function thin() {
  const s = { style: 'thin', color: { argb: 'FFBFC7D2' } }
  return { top: s, left: s, bottom: s, right: s }
}

// ---------- WORD ----------

function P(text, opts = {}) {
  return new Paragraph({
    alignment: opts.align || AlignmentType.LEFT,
    spacing: { after: opts.after ?? 100, before: opts.before ?? 0 },
    children: [new TextRun({ text: text || '', bold: !!opts.bold, italics: !!opts.italics, size: opts.size || 20, color: opts.color || '000000' })]
  })
}

function celda(text, { bold = false, width, fill, align = AlignmentType.LEFT, size = 15 } = {}) {
  return new TableCell({
    width: width ? { size: width, type: WidthType.PERCENTAGE } : undefined,
    shading: fill ? { fill } : undefined,
    margins: { top: 30, bottom: 30, left: 50, right: 50 },
    children: [new Paragraph({ alignment: align, children: [new TextRun({ text: text ?? '', bold, size })] })]
  })
}

export async function generarFUIDWord(datos, meta = {}) {
  const filas = filasInventario(datos)
  const children = []

  children.push(new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 60 },
    children: [new TextRun({ text: 'FORMATO ÚNICO DE INVENTARIO DOCUMENTAL (FUID)', bold: true, size: 26, color: '0D3F77' })] }))
  children.push(P(`Entidad remitente: ${meta.entidad || ''}`))
  children.push(P(`Entidad productora: ${meta.entidad || ''}`))
  children.push(P('Unidad administrativa: ____________________     Oficina productora: ____________________'))
  children.push(P('Objeto: Inventario de las series y subseries documentales conforme a la Tabla de Retención Documental (TRD).'))
  children.push(P(`Registro de entrada N.º ______   ·   Hoja N.º ____ de ____   ·   Generado por SIPAD · ${meta.fecha || ''}`,
    { italics: true, size: 16, color: '666666', after: 160 }))

  const fill = 'D9E2F3'
  const header = new TableRow({ tableHeader: true, children: [
    celda('N.º', { bold: true, width: 4, fill, align: AlignmentType.CENTER }),
    celda('Código', { bold: true, width: 9, fill, align: AlignmentType.CENTER }),
    celda('Oficina productora', { bold: true, width: 18, fill }),
    celda('Series / subseries o asuntos', { bold: true, width: 27, fill }),
    celda('Fechas extremas', { bold: true, width: 12, fill, align: AlignmentType.CENTER }),
    celda('Unidad de conservación', { bold: true, width: 12, fill, align: AlignmentType.CENTER }),
    celda('Folios', { bold: true, width: 6, fill, align: AlignmentType.CENTER }),
    celda('Soporte', { bold: true, width: 6, fill, align: AlignmentType.CENTER }),
    celda('Notas', { bold: true, width: 6, fill })
  ] })

  const rows = filas.map(f => new TableRow({ children: [
    celda(String(f.orden), { align: AlignmentType.CENTER }),
    celda(f.codigo, { align: AlignmentType.CENTER }),
    celda(f.oficina),
    celda(f.nombre),
    celda('', { align: AlignmentType.CENTER }),
    celda('', { align: AlignmentType.CENTER }),
    celda('', { align: AlignmentType.CENTER }),
    celda(f.soporte, { align: AlignmentType.CENTER }),
    celda('')
  ] }))

  children.push(new Table({ width: { size: 100, type: WidthType.PERCENTAGE }, rows: [header, ...rows] }))

  children.push(P('', { after: 200 }))
  children.push(P('Elaborado por: ____________________   Cargo: __________   Lugar y fecha: __________   Firma: __________', { size: 16 }))
  children.push(P('Entregado por: ____________________   Cargo: __________   Lugar y fecha: __________   Firma: __________', { size: 16 }))
  children.push(P('Recibido por:  ____________________   Cargo: __________   Lugar y fecha: __________   Firma: __________', { size: 16 }))
  children.push(P('Fechas extremas, unidad de conservación (caja/carpeta/tomo) y folios se diligencian en la transferencia o eliminación.',
    { italics: true, size: 14, color: '666666', before: 160 }))

  const doc = new Document({ sections: [{ children, properties: { page: { size: { orientation: 'landscape' } } } }] })
  return await Packer.toBuffer(doc)
}

// ---------- Rutas ----------

export function registrarFUID(router, db, guard) {
  const mw = typeof guard === 'function' ? guard : (req, res, next) => next()

  async function meta(entidadId) {
    let entidad = ''
    try {
      const e = await db.get(`SELECT nombre FROM entidades WHERE id::text = ?`, [String(entidadId)])
      entidad = e?.nombre || ''
    } catch { /* id no castable */ }
    return { entidad, fecha: new Date().toLocaleDateString('es-CO') }
  }

  router.get('/fuid/xlsx', mw, async (req, res) => {
    try {
      const datos = await obtenerDatosExport(db, req.entidad_id || null)
      const buffer = await generarFUIDExcel(datos, await meta(req.entidad_id))
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')
      res.setHeader('Content-Disposition', 'attachment; filename="FUID.xlsx"')
      res.setHeader('Content-Length', buffer.length)
      return res.end(buffer)
    } catch (err) {
      console.error('FUID xlsx error:', err)
      return res.status(500).json({ ok: false, error: 'No se pudo generar el FUID' })
    }
  })

  router.get('/fuid/docx', mw, async (req, res) => {
    try {
      const datos = await obtenerDatosExport(db, req.entidad_id || null)
      const buffer = await generarFUIDWord(datos, await meta(req.entidad_id))
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document')
      res.setHeader('Content-Disposition', 'attachment; filename="FUID.docx"')
      res.setHeader('Content-Length', buffer.length)
      return res.end(buffer)
    } catch (err) {
      console.error('FUID docx error:', err)
      return res.status(500).json({ ok: false, error: 'No se pudo generar el FUID' })
    }
  })
}
