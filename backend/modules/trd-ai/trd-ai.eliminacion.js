// ======================================================
// SIPAD · Proceso de eliminación documental
// (Acuerdo AGN 004 de 2019, art. sobre disposición final)
// ------------------------------------------------------
// A partir de la TRD aprobada toma las series cuya disposición
// final es Eliminación (E) o Selección (S) y genera:
//   1) Inventario de eliminación (.xlsx) — series/subseries a
//      eliminar con su fundamento, para publicar 60 días hábiles.
//   2) Acta de eliminación (.docx) — acta del Comité Institucional
//      de Gestión y Desempeño que autoriza la eliminación.
//   3) Resumen JSON para la UI (cuántas series E/S hay).
// ======================================================

import ExcelJS from 'exceljs'
import {
  Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell,
  WidthType, AlignmentType
} from 'docx'

import { obtenerDatosExport } from './trd-ai.export.js'
import { obtenerConvalidacion } from './trd-ai.convalidacion.js'

const DISP_TEXTO = { CT: 'Conservación total', E: 'Eliminación', S: 'Selección', M: 'Medio técnico' }

// Filas de series con disposición E o S (las que implican descarte).
export function filasEliminacion(datos) {
  const filas = []
  let orden = 0
  for (const dep of datos) {
    for (const s of dep.series) {
      if (s.disposicion !== 'E' && s.disposicion !== 'S') continue
      orden++
      filas.push({
        orden,
        codigo: s.codigo || '',
        oficina: dep.dependencia,
        nombre: s.subserie ? `${s.serie} / ${s.subserie}` : s.serie,
        disposicion: s.disposicion,
        ag: s.retencion_gestion,
        ac: s.retencion_central,
        fundamento: s.procedimiento || ''
      })
    }
  }
  return filas
}

export function resumenEliminacion(datos) {
  const filas = filasEliminacion(datos)
  return {
    total: filas.length,
    eliminacion: filas.filter(f => f.disposicion === 'E').length,
    seleccion: filas.filter(f => f.disposicion === 'S').length,
    series: filas.map(f => ({ codigo: f.codigo, nombre: f.nombre, oficina: f.oficina, disposicion: f.disposicion }))
  }
}

function thin() {
  const s = { style: 'thin', color: { argb: 'FFBFC7D2' } }
  return { top: s, left: s, bottom: s, right: s }
}

// ---------- EXCEL: inventario de eliminación ----------

export async function generarInventarioEliminacionExcel(datos, meta = {}) {
  const filas = filasEliminacion(datos)
  const wb = new ExcelJS.Workbook()
  wb.creator = 'SIPAD'
  const ws = wb.addWorksheet('Inventario eliminación')

  ws.columns = [
    { header: 'N.º', key: 'orden', width: 6 },
    { header: 'Código', key: 'codigo', width: 12 },
    { header: 'Oficina productora', key: 'oficina', width: 24 },
    { header: 'Series / subseries a eliminar', key: 'nombre', width: 38 },
    { header: 'Disposición', key: 'disp', width: 12 },
    { header: 'Fecha inicial', key: 'fi', width: 12 },
    { header: 'Fecha final', key: 'ff', width: 12 },
    { header: 'N.º folios', key: 'folios', width: 9 },
    { header: 'Unidad de conservación', key: 'uc', width: 16 },
    { header: 'Fundamento de la disposición', key: 'fund', width: 44 }
  ]
  const NCOL = ws.columns.length
  const colLetter = n => { let s=''; while(n>0){const m=(n-1)%26; s=String.fromCharCode(65+m)+s; n=Math.floor((n-1)/26)} return s }
  const last = colLetter(NCOL)

  const bloque = [
    ['INVENTARIO DE ELIMINACIÓN DOCUMENTAL'],
    [`Entidad: ${meta.entidad || ''}`],
    ['Fundamento: Acuerdo AGN 004 de 2019. Este inventario se publica en la página web de la entidad por sesenta (60) días hábiles antes de proceder con la eliminación.'],
    [`Acta del Comité N.º ${meta.numero_acta || '______'}   ·   Fecha ${meta.fecha_comite || '__________'}   ·   Generado por SIPAD · ${meta.fecha || ''}`]
  ]
  bloque.forEach((r, i) => {
    ws.insertRow(i + 1, r)
    ws.mergeCells(`A${i + 1}:${last}${i + 1}`)
    const c = ws.getCell(`A${i + 1}`)
    if (i === 0) c.font = { bold: true, size: 14, color: { argb: 'FFB42318' } }
    else if (i === 2) c.font = { size: 10, color: { argb: 'FF92400E' } }
    else if (i === bloque.length - 1) c.font = { italic: true, size: 10, color: { argb: 'FF666666' } }
    else c.font = { size: 11 }
    c.alignment = { wrapText: true, vertical: 'middle' }
  })

  const headRowIdx = bloque.length + 1
  const headerRow = ws.getRow(headRowIdx)
  headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' }, size: 10 }
  headerRow.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true }
  headerRow.height = 32
  headerRow.eachCell(c => { c.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFB42318' } }; c.border = thin() })

  if (!filas.length) {
    const r = ws.addRow(['', '', '', 'No hay series con disposición Eliminación o Selección en la TRD aprobada.', '', '', '', '', '', ''])
    r.getCell(4).font = { italic: true, color: { argb: 'FF999999' } }
  }
  for (const f of filas) {
    const row = ws.addRow({
      orden: f.orden, codigo: f.codigo, oficina: f.oficina, nombre: f.nombre,
      disp: `${f.disposicion} — ${DISP_TEXTO[f.disposicion] || ''}`,
      fi: '', ff: '', folios: '', uc: '', fund: f.fundamento
    })
    row.alignment = { vertical: 'top', wrapText: true }
    ;['orden', 'codigo', 'disp', 'folios'].forEach(k => { row.getCell(k).alignment = { vertical: 'middle', horizontal: 'center' } })
    row.eachCell(c => { c.border = thin() })
  }

  const foot = headRowIdx + Math.max(filas.length, 1) + 2
  const firmas = [
    'Aprobó (Presidente del Comité): __________________________   Firma: ____________',
    'Secretario Técnico del Comité: __________________________   Firma: ____________',
    'Responsable del archivo: __________________________   Firma: ____________'
  ]
  firmas.forEach((t, i) => {
    const r = foot + i; ws.getCell(`A${r}`).value = t; ws.mergeCells(`A${r}:${last}${r}`); ws.getCell(`A${r}`).font = { size: 10 }
  })

  ws.views = [{ state: 'frozen', ySplit: headRowIdx }]
  return Buffer.from(await wb.xlsx.writeBuffer())
}

// ---------- WORD: acta de eliminación ----------

function P(text, opts = {}) {
  return new Paragraph({
    alignment: opts.align || AlignmentType.LEFT,
    spacing: { after: opts.after ?? 120, before: opts.before ?? 0 },
    children: [new TextRun({ text: text || '', bold: !!opts.bold, italics: !!opts.italics, size: opts.size || 22, color: opts.color || '000000' })]
  })
}
function celda(text, { bold = false, width, fill, align = AlignmentType.LEFT, size = 18 } = {}) {
  return new TableCell({
    width: width ? { size: width, type: WidthType.PERCENTAGE } : undefined,
    shading: fill ? { fill } : undefined,
    margins: { top: 40, bottom: 40, left: 80, right: 80 },
    children: [new Paragraph({ alignment: align, children: [new TextRun({ text: text ?? '', bold, size })] })]
  })
}

export async function generarActaEliminacion(db, entidadId, meta = {}) {
  const conv = await obtenerConvalidacion(db, entidadId)
  const datos = await obtenerDatosExport(db, entidadId)
  const filas = filasEliminacion(datos)
  const entidad = meta.entidad || 'la entidad'
  const fechaHoy = meta.fecha || new Date().toLocaleDateString('es-CO')

  const children = []
  children.push(new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 60 },
    children: [new TextRun({ text: entidad.toUpperCase(), bold: true, size: 26 })] }))
  children.push(new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 60 },
    children: [new TextRun({ text: 'COMITÉ INSTITUCIONAL DE GESTIÓN Y DESEMPEÑO', bold: true, size: 24 })] }))
  children.push(new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 200 },
    children: [new TextRun({ text: 'ACTA DE ELIMINACIÓN DE DOCUMENTOS', bold: true, size: 22 })] }))

  children.push(P(`Acta N.º: ${conv.numero_acta || meta.numero_acta || '________'}`, { bold: true }))
  children.push(P(`Fecha de la sesión: ${conv.fecha_comite || meta.fecha_comite || '________'}`))
  children.push(P(''))

  children.push(P('1. Fundamento', { bold: true, size: 24 }))
  children.push(P(
    'En cumplimiento de la Ley 594 de 2000, el Decreto 1080 de 2015 y el Acuerdo AGN 004 de 2019, el Comité ' +
    'Institucional de Gestión y Desempeño autoriza la eliminación de los documentos que cumplieron su tiempo de ' +
    'retención en el archivo de gestión y central y cuya disposición final, conforme a la Tabla de Retención ' +
    'Documental, es Eliminación (E) o Selección (S). Previo a la eliminación, el inventario correspondiente fue ' +
    'publicado en la página web de la entidad durante sesenta (60) días hábiles, sin que se presentaran solicitudes ' +
    'de conservación.'))

  children.push(P('2. Documentos objeto de eliminación', { bold: true, size: 24 }))
  if (filas.length) {
    const fill = 'F4CCCC'
    const header = new TableRow({ tableHeader: true, children: [
      celda('N.º', { bold: true, width: 6, fill, align: AlignmentType.CENTER }),
      celda('Código', { bold: true, width: 12, fill, align: AlignmentType.CENTER }),
      celda('Oficina productora', { bold: true, width: 22, fill }),
      celda('Series / subseries', { bold: true, width: 34, fill }),
      celda('Disp.', { bold: true, width: 10, fill, align: AlignmentType.CENTER }),
      celda('Retención (AG/AC)', { bold: true, width: 16, fill, align: AlignmentType.CENTER })
    ] })
    const rows = filas.map(f => new TableRow({ children: [
      celda(String(f.orden), { align: AlignmentType.CENTER }),
      celda(f.codigo, { align: AlignmentType.CENTER }),
      celda(f.oficina),
      celda(f.nombre),
      celda(f.disposicion, { align: AlignmentType.CENTER }),
      celda(`${f.ag ?? '—'} / ${f.ac ?? '—'}`, { align: AlignmentType.CENTER })
    ] }))
    children.push(new Table({ width: { size: 100, type: WidthType.PERCENTAGE }, rows: [header, ...rows] }))
    children.push(P(`Total de series/subseries a eliminar: ${filas.length}.`, { size: 20, before: 80 }))
  } else {
    children.push(P('No hay series con disposición Eliminación o Selección en la TRD aprobada.', { italics: true }))
  }

  children.push(P('3. Procedimiento de eliminación', { bold: true, size: 24, before: 120 }))
  children.push(P(
    'La eliminación se realiza mediante método que garantice la imposibilidad de reconstrucción (picado, ' +
    'triturado o el que defina la entidad para el soporte electrónico), dejando constancia de las cantidades ' +
    '(metros lineales / unidades) eliminadas. Se conserva la presente acta y el inventario como soporte del proceso.'))
  children.push(P('Cantidad eliminada: ____________ (metros lineales / cajas / unidades).', { size: 20 }))

  children.push(P('4. Aprobación', { bold: true, size: 24, before: 120 }))
  children.push(P('El Comité aprueba la eliminación de los documentos relacionados en la presente acta.'))
  children.push(P(''))
  children.push(P(''))
  children.push(P('_______________________________            _______________________________'))
  children.push(P('Presidente del Comité                                   Secretario Técnico'))
  children.push(P(`${meta.ciudad || '____________'}, ${fechaHoy}.`, { before: 200, italics: true, size: 18 }))

  const doc = new Document({ sections: [{ children }] })
  return await Packer.toBuffer(doc)
}

// ---------- Rutas ----------

export function registrarEliminacion(router, db, guard) {
  const mw = typeof guard === 'function' ? guard : (req, res, next) => next()

  async function meta(entidadId) {
    let entidad = ''
    try {
      const e = await db.get(`SELECT nombre FROM entidades WHERE id::text = ?`, [String(entidadId)])
      entidad = e?.nombre || ''
    } catch { /* id no castable */ }
    let conv = {}
    try { conv = await obtenerConvalidacion(db, entidadId) || {} } catch { /* ignore */ }
    return { entidad, fecha: new Date().toLocaleDateString('es-CO'), numero_acta: conv.numero_acta, fecha_comite: conv.fecha_comite }
  }

  router.get('/eliminacion', mw, async (req, res) => {
    try {
      const datos = await obtenerDatosExport(db, req.entidad_id || null)
      return res.json({ ok: true, ...resumenEliminacion(datos) })
    } catch (err) {
      console.error('Eliminación resumen error:', err)
      return res.status(500).json({ ok: false, error: 'No se pudo calcular la eliminación' })
    }
  })

  router.get('/eliminacion/inventario.xlsx', mw, async (req, res) => {
    try {
      const datos = await obtenerDatosExport(db, req.entidad_id || null)
      const buffer = await generarInventarioEliminacionExcel(datos, await meta(req.entidad_id))
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')
      res.setHeader('Content-Disposition', 'attachment; filename="Inventario-eliminacion.xlsx"')
      res.setHeader('Content-Length', buffer.length)
      return res.end(buffer)
    } catch (err) {
      console.error('Inventario eliminación error:', err)
      return res.status(500).json({ ok: false, error: 'No se pudo generar el inventario' })
    }
  })

  router.get('/eliminacion/acta.docx', mw, async (req, res) => {
    try {
      const buffer = await generarActaEliminacion(db, req.entidad_id || null, await meta(req.entidad_id))
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document')
      res.setHeader('Content-Disposition', 'attachment; filename="Acta-eliminacion.docx"')
      res.setHeader('Content-Length', buffer.length)
      return res.end(buffer)
    } catch (err) {
      console.error('Acta eliminación error:', err)
      return res.status(500).json({ ok: false, error: 'No se pudo generar el acta' })
    }
  })
}
