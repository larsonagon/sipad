// ======================================================
// SIPAD · Export de TRD (Formato Único – Acuerdo AGN 004/2019)
// A partir de las propuestas APROBADAS de una entidad.
// Genera Excel (.xlsx) y Word (.docx).
// ======================================================

import ExcelJS from 'exceljs'
import {
  Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell,
  WidthType, AlignmentType, HeadingLevel, BorderStyle
} from 'docx'

// ---------- Helpers ----------

function parseTipologias(raw) {
  if (!raw) return []
  try {
    const p = JSON.parse(raw)
    return Array.isArray(p) ? p : [p]
  } catch {
    return [raw]
  }
}

// Normaliza cualquier variante de disposición a CT / E / S / M
function codigoDisposicion(v) {
  if (!v) return null
  const s = v.toString().toLowerCase().trim()
  if (['ct', 'conservacion_total', 'conservación total'].includes(s)) return 'CT'
  if (['el', 'e', 'eliminacion', 'eliminación'].includes(s)) return 'E'
  if (['st', 's', 'seleccion', 'selección'].includes(s)) return 'S'
  if (['mt', 'm', 'medio_tecnico', 'microfilmación', 'medio técnico'].includes(s)) return 'M'
  const up = v.toString().toUpperCase()
  if (up === 'CT') return 'CT'
  if (up === 'EL') return 'E'
  if (up === 'ST') return 'S'
  if (up === 'MT') return 'M'
  return null
}

const PROCEDIMIENTO = {
  CT: 'Conservación total. Se transfiere al archivo histórico por su valor secundario (histórico, científico o cultural).',
  E:  'Eliminación conforme al Acuerdo AGN 004 de 2019: levantamiento de inventario, aprobación del Comité Institucional de Gestión y Desempeño, publicación del inventario 60 días hábiles y acta de eliminación.',
  S:  'Selección de una muestra representativa para conservación; el remanente se elimina siguiendo el procedimiento del Acuerdo AGN 004 de 2019.',
  M:  'Reproducción en medio técnico (digitalización/microfilmación) garantizando autenticidad e integridad; conservación del sustituto.'
}

// ---------- Datos ----------

export async function obtenerDatosExport(db, entidadId) {

  const filas = await db.all(`
    SELECT
      tsp.id, tsp.nombre_serie, tsp.nombre_subserie, tsp.tipologia_documental,
      r.retencion_gestion, r.retencion_central, r.disposicion_final AS disp_regla,
      r.fundamento_normativo,
      tsp.disposicion_final AS disp_prop,
      d.nombre AS dependencia_nombre
    FROM trd_series_propuestas tsp
    LEFT JOIN trd_reglas_retencion r ON r.propuesta_id = tsp.id
    LEFT JOIN segtec_actividades sa  ON sa.id = tsp.actividad_id
    LEFT JOIN dependencias d         ON d.id = sa.dependencia_id
    WHERE tsp.estado = 'aprobada'
      ${entidadId ? 'AND tsp.entidad_id = ?' : ''}
    ORDER BY d.nombre NULLS LAST, tsp.nombre_serie, tsp.nombre_subserie
  `, entidadId ? [entidadId] : [])

  // Agrupar por dependencia → serie → subserie
  const mapa = new Map()

  for (const f of filas) {
    const dep = f.dependencia_nombre || 'Sin dependencia asignada'
    const serie = f.nombre_serie || 'Serie sin nombre'
    const sub = f.nombre_subserie || ''
    const key = `${dep}||${serie}||${sub}`

    if (!mapa.has(key)) {
      mapa.set(key, {
        dependencia: dep,
        serie,
        subserie: sub,
        tipologias: new Set(),
        retencion_gestion: null,
        retencion_central: null,
        disposicion: null,
        fundamento: null
      })
    }
    const g = mapa.get(key)
    parseTipologias(f.tipologia_documental).forEach(t => { if (t && t.trim()) g.tipologias.add(t.trim()) })
    if (g.retencion_gestion == null && f.retencion_gestion != null) g.retencion_gestion = f.retencion_gestion
    if (g.retencion_central == null && f.retencion_central != null) g.retencion_central = f.retencion_central
    if (!g.disposicion) g.disposicion = codigoDisposicion(f.disp_regla || f.disp_prop)
    if (!g.fundamento && f.fundamento_normativo) g.fundamento = f.fundamento_normativo
  }

  // Estructura final por dependencia
  const porDep = new Map()
  for (const g of mapa.values()) {
    if (!porDep.has(g.dependencia)) porDep.set(g.dependencia, [])
    porDep.get(g.dependencia).push({
      serie: g.serie,
      subserie: g.subserie,
      tipologias: [...g.tipologias],
      retencion_gestion: g.retencion_gestion,
      retencion_central: g.retencion_central,
      disposicion: g.disposicion,
      procedimiento: g.fundamento || (g.disposicion ? PROCEDIMIENTO[g.disposicion] : '')
    })
  }

  // Codificación jerárquica DD.SS.UU (misma que el CCD)
  const pad2 = n => String(n).padStart(2, '0')
  const salida = []
  let di = 0
  for (const [dependencia, series] of porDep.entries()) {
    di++
    const depCod = pad2(di)
    const serieIdx = new Map()
    const subCount = new Map()
    for (const s of series) {
      if (!serieIdx.has(s.serie)) { serieIdx.set(s.serie, serieIdx.size + 1); subCount.set(s.serie, 0) }
      const si = serieIdx.get(s.serie)
      const ui = subCount.get(s.serie) + 1
      subCount.set(s.serie, ui)
      s.codigo = `${depCod}.${pad2(si)}.${pad2(ui)}`
    }
    salida.push({ dependencia, series })
  }
  return salida
}

// ---------- EXCEL ----------

export async function generarExcelTRD(datos, meta = {}) {
  const wb = new ExcelJS.Workbook()
  wb.creator = 'SIPAD'
  const ws = wb.addWorksheet('TRD')

  ws.columns = [
    { header: 'Dependencia', key: 'dep', width: 30 },
    { header: 'Código', key: 'cod', width: 12 },
    { header: 'Serie documental', key: 'serie', width: 26 },
    { header: 'Subserie documental', key: 'sub', width: 28 },
    { header: 'Tipos documentales', key: 'tip', width: 44 },
    { header: 'AG (años)', key: 'ag', width: 10 },
    { header: 'AC (años)', key: 'ac', width: 10 },
    { header: 'CT', key: 'ct', width: 5 },
    { header: 'E', key: 'e', width: 5 },
    { header: 'S', key: 's', width: 5 },
    { header: 'M', key: 'm', width: 5 },
    { header: 'Procedimiento', key: 'proc', width: 50 }
  ]

  // Título
  ws.insertRow(1, [])
  ws.insertRow(1, [`TABLA DE RETENCIÓN DOCUMENTAL — ${meta.entidad || ''}`])
  ws.mergeCells('A1:L1')
  ws.getCell('A1').font = { bold: true, size: 14, color: { argb: 'FF0D3F77' } }
  ws.getRow(2).values = [`Versión propuesta · Generado por SIPAD · ${meta.fecha || ''}`]
  ws.mergeCells('A2:L2')
  ws.getCell('A2').font = { italic: true, color: { argb: 'FF666666' } }

  const headerRow = ws.getRow(3)
  headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' } }
  headerRow.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true }
  headerRow.height = 30
  headerRow.eachCell(c => { c.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF0D3F77' } } })

  for (const dep of datos) {
    for (const s of dep.series) {
      const row = ws.addRow({
        dep: dep.dependencia,
        cod: s.codigo || '',
        serie: s.serie,
        sub: s.subserie || '',
        tip: s.tipologias.join('\n'),
        ag: s.retencion_gestion ?? '',
        ac: s.retencion_central ?? '',
        ct: s.disposicion === 'CT' ? 'X' : '',
        e:  s.disposicion === 'E' ? 'X' : '',
        s:  s.disposicion === 'S' ? 'X' : '',
        m:  s.disposicion === 'M' ? 'X' : '',
        proc: s.procedimiento || ''
      })
      row.alignment = { vertical: 'top', wrapText: true }
      ;['ct', 'e', 's', 'm', 'ag', 'ac', 'cod'].forEach(k => {
        row.getCell(k).alignment = { vertical: 'middle', horizontal: 'center' }
      })
    }
  }

  ws.views = [{ state: 'frozen', ySplit: 3 }]

  // Hoja de convenciones
  const conv = wb.addWorksheet('Convenciones')
  conv.columns = [{ width: 60 }]
  ;[
    'Convenciones de disposición final',
    'CT = Conservación Total',
    'E = Eliminación',
    'S = Selección',
    'M = Medio Técnico (digitalización / microfilmación)',
    'AG = Archivo de Gestión (años)   ·   AC = Archivo Central (años)',
    '',
    'Marco normativo: Ley 594/2000, Decreto 1080/2015, Acuerdo AGN 004/2019.'
  ].forEach((t, i) => {
    const r = conv.addRow([t])
    if (i === 0) r.font = { bold: true, size: 13, color: { argb: 'FF0D3F77' } }
  })

  return Buffer.from(await wb.xlsx.writeBuffer())
}

// ---------- WORD ----------

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

export async function generarWordTRD(datos, meta = {}) {

  const children = [
    new Paragraph({
      alignment: AlignmentType.CENTER,
      children: [new TextRun({ text: 'TABLA DE RETENCIÓN DOCUMENTAL', bold: true, size: 30, color: '0D3F77' })]
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      children: [new TextRun({ text: meta.entidad || '', bold: true, size: 24 })]
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      children: [new TextRun({ text: `Versión propuesta · Generado por SIPAD · ${meta.fecha || ''}`, italics: true, size: 18, color: '666666' })]
    }),
    new Paragraph({ text: '' })
  ]

  const headerRow = new TableRow({
    tableHeader: true,
    children: [
      celda('Código', { header: true, center: true, width: 7 }),
      celda('Serie', { header: true, width: 16 }),
      celda('Subserie', { header: true, width: 18 }),
      celda('Tipos documentales', { header: true, width: 27 }),
      celda('AG', { header: true, center: true, width: 5 }),
      celda('AC', { header: true, center: true, width: 5 }),
      celda('CT', { header: true, center: true, width: 4 }),
      celda('E', { header: true, center: true, width: 4 }),
      celda('S', { header: true, center: true, width: 4 }),
      celda('M', { header: true, center: true, width: 4 }),
      celda('Procedimiento', { header: true, width: 26 })
    ]
  })

  for (const dep of datos) {
    // Fila de dependencia (banda)
    children.push(new Paragraph({
      spacing: { before: 200, after: 80 },
      children: [new TextRun({ text: `Dependencia: ${dep.dependencia}`, bold: true, size: 20, color: '0D3F77' })]
    }))

    const rows = [headerRow]
    for (const s of dep.series) {
      rows.push(new TableRow({
        children: [
          celda(s.codigo || '', { center: true }),
          celda(s.serie),
          celda(s.subserie || ''),
          celda(s.tipologias.join('; ')),
          celda(s.retencion_gestion ?? '', { center: true }),
          celda(s.retencion_central ?? '', { center: true }),
          celda(s.disposicion === 'CT' ? 'X' : '', { center: true }),
          celda(s.disposicion === 'E' ? 'X' : '', { center: true }),
          celda(s.disposicion === 'S' ? 'X' : '', { center: true }),
          celda(s.disposicion === 'M' ? 'X' : '', { center: true }),
          celda(s.procedimiento || '')
        ]
      }))
    }

    children.push(new Table({
      width: { size: 100, type: WidthType.PERCENTAGE },
      rows
    }))
  }

  children.push(new Paragraph({ text: '' }))
  children.push(new Paragraph({
    children: [new TextRun({ text: 'Convenciones: CT = Conservación Total · E = Eliminación · S = Selección · M = Medio Técnico · AG = Archivo de Gestión (años) · AC = Archivo Central (años).', italics: true, size: 16, color: '666666' })]
  }))
  children.push(new Paragraph({
    children: [new TextRun({ text: 'Marco normativo: Ley 594/2000, Decreto 1080/2015, Acuerdo AGN 004/2019.', italics: true, size: 16, color: '666666' })]
  }))

  const doc = new Document({ sections: [{ children }] })
  return await Packer.toBuffer(doc)
}

// ---------- Rutas ----------

export function registrarExport(router, db, guard) {

  const mw = typeof guard === 'function' ? guard : (req, res, next) => next()

  async function meta(entidadId) {
    let entidad = ''
    try {
      const e = await db.get(`SELECT nombre FROM entidades WHERE id::text = ?`, [String(entidadId)])
      entidad = e?.nombre || ''
    } catch { /* entidades.id no castable → dejar vacío */ }
    return { entidad, fecha: new Date().toLocaleDateString('es-CO') }
  }

  router.get('/export/xlsx', mw, async (req, res) => {
    try {
      const entidadId = req.entidad_id || null
      const datos = await obtenerDatosExport(db, entidadId)
      const buffer = await generarExcelTRD(datos, await meta(entidadId))
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')
      res.setHeader('Content-Disposition', 'attachment; filename="TRD-propuesta.xlsx"')
      res.setHeader('Content-Length', buffer.length)
      return res.send(buffer)
    } catch (err) {
      console.error('TRD export xlsx error:', err)
      return res.status(500).json({ ok: false, error: 'No se pudo generar el Excel' })
    }
  })

  router.get('/export/docx', mw, async (req, res) => {
    try {
      const entidadId = req.entidad_id || null
      const datos = await obtenerDatosExport(db, entidadId)
      const buffer = await generarWordTRD(datos, await meta(entidadId))
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document')
      res.setHeader('Content-Disposition', 'attachment; filename="TRD-propuesta.docx"')
      res.setHeader('Content-Length', buffer.length)
      return res.send(buffer)
    } catch (err) {
      console.error('TRD export docx error:', err)
      return res.status(500).json({ ok: false, error: 'No se pudo generar el Word' })
    }
  })
}
