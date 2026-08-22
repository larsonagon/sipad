// ======================================================
// SIPAD · Cuadro de Clasificación Documental (CCD) codificado
// Jerarquía dependencia → serie → subserie → tipologías, con
// codificación DD.SS.UU. A partir de las propuestas APROBADAS.
// Exporta Excel y Word. Marco: Acuerdo AGN 004/2019.
// ======================================================

import ExcelJS from 'exceljs'
import {
  Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell,
  WidthType, AlignmentType
} from 'docx'

const pad2 = n => String(n).padStart(2, '0')

function parseTip(raw) {
  if (!raw) return []
  try { const p = JSON.parse(raw); return Array.isArray(p) ? p : [p] } catch { return [raw] }
}

// ---------- Datos ----------

export async function obtenerCCD(db, entidadId) {

  const filas = await db.all(`
    SELECT tsp.nombre_serie, tsp.nombre_subserie, tsp.tipologia_documental,
           d.nombre AS dependencia_nombre
    FROM trd_series_propuestas tsp
    LEFT JOIN segtec_actividades sa ON sa.id = tsp.actividad_id
    LEFT JOIN dependencias d        ON d.id = sa.dependencia_id
    WHERE tsp.estado = 'aprobada'
      ${entidadId ? 'AND tsp.entidad_id = ?' : ''}
    ORDER BY d.nombre NULLS LAST, tsp.nombre_serie, tsp.nombre_subserie
  `, entidadId ? [entidadId] : [])

  // dep → serie → subserie → Set(tipologías)
  const deps = new Map()
  for (const f of filas) {
    const dep = f.dependencia_nombre || 'Sin dependencia asignada'
    const serie = f.nombre_serie || 'Serie sin nombre'
    const sub = f.nombre_subserie || '(general)'
    if (!deps.has(dep)) deps.set(dep, new Map())
    const series = deps.get(dep)
    if (!series.has(serie)) series.set(serie, new Map())
    const subs = series.get(serie)
    if (!subs.has(sub)) subs.set(sub, new Set())
    parseTip(f.tipologia_documental).forEach(t => { if (t && t.trim()) subs.get(sub).add(t.trim()) })
  }

  // Codificación
  const resultado = []
  let di = 0
  for (const [dep, series] of deps) {
    di++
    const depCod = pad2(di)
    const seriesArr = []
    let si = 0
    for (const [serie, subs] of series) {
      si++
      const serieCod = `${depCod}.${pad2(si)}`
      const subArr = []
      let ui = 0
      for (const [sub, tips] of subs) {
        ui++
        subArr.push({ codigo: `${serieCod}.${pad2(ui)}`, nombre: sub, tipologias: [...tips] })
      }
      seriesArr.push({ codigo: serieCod, nombre: serie, subseries: subArr })
    }
    resultado.push({ codigo: depCod, dependencia: dep, series: seriesArr })
  }
  return resultado
}

// ---------- Excel ----------

export async function generarExcelCCD(ccd, meta = {}) {
  const wb = new ExcelJS.Workbook()
  wb.creator = 'SIPAD'
  const ws = wb.addWorksheet('CCD')

  ws.columns = [
    { header: 'Código', key: 'cod', width: 14 },
    { header: 'Dependencia', key: 'dep', width: 30 },
    { header: 'Serie documental', key: 'serie', width: 30 },
    { header: 'Subserie documental', key: 'sub', width: 32 },
    { header: 'Tipos documentales', key: 'tip', width: 52 }
  ]

  ws.insertRow(1, [`CUADRO DE CLASIFICACIÓN DOCUMENTAL — ${meta.entidad || ''}`])
  ws.mergeCells('A1:E1')
  ws.getCell('A1').font = { bold: true, size: 14, color: { argb: 'FF0D3F77' } }
  ws.insertRow(2, [`Versión propuesta · Generado por SIPAD · ${meta.fecha || ''}`])
  ws.mergeCells('A2:E2')
  ws.getCell('A2').font = { italic: true, color: { argb: 'FF666666' } }

  const hr = ws.getRow(3)
  hr.font = { bold: true, color: { argb: 'FFFFFFFF' } }
  hr.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true }
  hr.height = 26
  hr.eachCell(c => { c.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF0D3F77' } } })

  for (const dep of ccd) {
    for (const serie of dep.series) {
      for (const sub of serie.subseries) {
        const row = ws.addRow({
          cod: sub.codigo,
          dep: dep.dependencia,
          serie: serie.nombre,
          sub: sub.nombre,
          tip: sub.tipologias.join('\n')
        })
        row.alignment = { vertical: 'top', wrapText: true }
        row.getCell('cod').alignment = { vertical: 'top', horizontal: 'center' }
      }
    }
  }

  ws.views = [{ state: 'frozen', ySplit: 3 }]
  return Buffer.from(await wb.xlsx.writeBuffer())
}

// ---------- Word ----------

function celda(text, opts = {}) {
  return new TableCell({
    width: opts.width ? { size: opts.width, type: WidthType.PERCENTAGE } : undefined,
    shading: opts.header ? { fill: '0D3F77' } : undefined,
    children: [new Paragraph({
      alignment: opts.center ? AlignmentType.CENTER : AlignmentType.LEFT,
      children: [new TextRun({
        text: text == null ? '' : String(text),
        bold: !!opts.header,
        color: opts.header ? 'FFFFFF' : '000000',
        size: opts.header ? 16 : 15
      })]
    })]
  })
}

export async function generarWordCCD(ccd, meta = {}) {
  const children = [
    new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: 'CUADRO DE CLASIFICACIÓN DOCUMENTAL', bold: true, size: 30, color: '0D3F77' })] }),
    new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: meta.entidad || '', bold: true, size: 24 })] }),
    new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: `Versión propuesta · Generado por SIPAD · ${meta.fecha || ''}`, italics: true, size: 18, color: '666666' })] }),
    new Paragraph({ text: '' })
  ]

  const header = () => new TableRow({
    tableHeader: true,
    children: [
      celda('Código', { header: true, center: true, width: 14 }),
      celda('Serie', { header: true, width: 24 }),
      celda('Subserie', { header: true, width: 28 }),
      celda('Tipos documentales', { header: true, width: 34 })
    ]
  })

  for (const dep of ccd) {
    children.push(new Paragraph({
      spacing: { before: 200, after: 80 },
      children: [new TextRun({ text: `${dep.codigo} · ${dep.dependencia}`, bold: true, size: 20, color: '0D3F77' })]
    }))
    const rows = [header()]
    for (const serie of dep.series) {
      for (const sub of serie.subseries) {
        rows.push(new TableRow({
          children: [
            celda(sub.codigo, { center: true }),
            celda(serie.nombre),
            celda(sub.nombre),
            celda(sub.tipologias.join('; '))
          ]
        }))
      }
    }
    children.push(new Table({ width: { size: 100, type: WidthType.PERCENTAGE }, rows }))
  }

  children.push(new Paragraph({ text: '' }))
  children.push(new Paragraph({ children: [new TextRun({ text: 'Codificación: DD (dependencia) · DD.SS (serie) · DD.SS.UU (subserie). Ajustar a la codificación oficial de la entidad si aplica.', italics: true, size: 16, color: '666666' })] }))

  const doc = new Document({ sections: [{ children }] })
  return await Packer.toBuffer(doc)
}

// ---------- Rutas ----------

export function registrarCCD(router, db, guard) {
  const mw = typeof guard === 'function' ? guard : (req, res, next) => next()

  async function meta(entidadId) {
    let entidad = ''
    try {
      const e = await db.get(`SELECT nombre FROM entidades WHERE id::text = ?`, [String(entidadId)])
      entidad = e?.nombre || ''
    } catch { /* ignore */ }
    return { entidad, fecha: new Date().toLocaleDateString('es-CO') }
  }

  router.get('/ccd/xlsx', mw, async (req, res) => {
    try {
      const ccd = await obtenerCCD(db, req.entidad_id || null)
      const buffer = await generarExcelCCD(ccd, await meta(req.entidad_id))
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')
      res.setHeader('Content-Disposition', 'attachment; filename="CCD-propuesto.xlsx"')
      res.setHeader('Content-Length', buffer.length)
      return res.send(buffer)
    } catch (err) {
      console.error('CCD xlsx error:', err)
      return res.status(500).json({ ok: false, error: 'No se pudo generar el CCD' })
    }
  })

  router.get('/ccd/docx', mw, async (req, res) => {
    try {
      const ccd = await obtenerCCD(db, req.entidad_id || null)
      const buffer = await generarWordCCD(ccd, await meta(req.entidad_id))
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document')
      res.setHeader('Content-Disposition', 'attachment; filename="CCD-propuesto.docx"')
      res.setHeader('Content-Length', buffer.length)
      return res.send(buffer)
    } catch (err) {
      console.error('CCD docx error:', err)
      return res.status(500).json({ ok: false, error: 'No se pudo generar el CCD' })
    }
  })
}
