// ======================================================
// SIPAD · Expediente de convalidación (fase 2)
// ------------------------------------------------------
// Genera, a partir de los datos de convalidación + la TRD
// aprobada, los instrumentos para radicar ante el Consejo
// Departamental de Archivos / AGN:
//   - Acta del Comité Interno de Archivo (.docx)
//   - Oficio de remisión (.docx)
//
// Reutiliza obtenerDatosExport (TRD aprobada codificada) y
// obtenerConvalidacion / listarObservaciones.
// ======================================================

import {
  Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell,
  WidthType, AlignmentType, HeadingLevel, BorderStyle
} from 'docx'

import { obtenerDatosExport } from './trd-ai.export.js'
import { obtenerConvalidacion, listarObservaciones, ESTADOS_CONVALIDACION } from './trd-ai.convalidacion.js'

const DISP_TEXTO = { CT: 'Conservación total', E: 'Eliminación', S: 'Selección', M: 'Medio técnico' }

// ---------- Helpers de párrafo ----------

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

function etiquetaEstado(clave) {
  return (ESTADOS_CONVALIDACION.find(e => e.clave === clave) || {}).etiqueta || clave || '—'
}

// Aplana datos (dep→series) a filas de TRD
function filasTRD(datos) {
  const filas = []
  for (const dep of datos) {
    for (const s of dep.series) {
      filas.push({
        codigo: s.codigo || '',
        dependencia: dep.dependencia,
        serie: s.serie,
        subserie: s.subserie,
        ag: s.retencion_gestion,
        ac: s.retencion_central,
        disp: s.disposicion
      })
    }
  }
  return filas
}

// ======================================================
// ACTA DEL COMITÉ INTERNO DE ARCHIVO
// ======================================================

export async function generarActaComite(db, entidadId, meta = {}) {

  const conv = await obtenerConvalidacion(db, entidadId)
  const obs = await listarObservaciones(db, entidadId)
  const datos = await obtenerDatosExport(db, entidadId)
  const filas = filasTRD(datos)

  const entidad = meta.entidad || 'la entidad'
  const fechaHoy = meta.fecha || new Date().toLocaleDateString('es-CO')

  const children = []

  // Encabezado
  children.push(new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 60 },
    children: [new TextRun({ text: entidad.toUpperCase(), bold: true, size: 26 })] }))
  children.push(new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 60 },
    children: [new TextRun({ text: 'COMITÉ INTERNO DE ARCHIVO', bold: true, size: 24 })] }))
  children.push(new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 200 },
    children: [new TextRun({ text: 'ACTA DE APROBACIÓN DE LA TABLA DE RETENCIÓN DOCUMENTAL (TRD)', bold: true, size: 22 })] }))

  // Datos generales
  children.push(P(`Acta N.º: ${conv.numero_acta || '________'}`, { bold: true }))
  children.push(P(`Fecha de la sesión: ${conv.fecha_comite || '________'}`))
  children.push(P(`Estado del proceso: ${etiquetaEstado(conv.estado)}`))
  children.push(P(''))

  // Marco normativo
  children.push(P('1. Marco normativo', { bold: true, size: 24 }))
  children.push(P(
    'En cumplimiento de la Ley 594 de 2000 (Ley General de Archivos), el Decreto 1080 de 2015 y el ' +
    'Acuerdo AGN 004 de 2019, el Comité Interno de Archivo se reúne para revisar y aprobar la Tabla de ' +
    'Retención Documental de la entidad, así como su valoración documental (tiempos de retención, ' +
    'disposición final y fundamento).'))

  // Objeto
  children.push(P('2. Objeto', { bold: true, size: 24 }))
  children.push(P(
    `Someter a aprobación del Comité la TRD conformada por ${filas.length} subseries documentales ` +
    `distribuidas en las dependencias de ${entidad}, con su respectiva valoración.`))

  // Tabla de la TRD
  children.push(P('3. Tabla de Retención Documental aprobada', { bold: true, size: 24 }))

  if (filas.length) {
    const header = new TableRow({ tableHeader: true, children: [
      celda('Código', { bold: true, width: 12, fill: 'D9E2F3', align: AlignmentType.CENTER }),
      celda('Serie', { bold: true, width: 22, fill: 'D9E2F3' }),
      celda('Subserie', { bold: true, width: 30, fill: 'D9E2F3' }),
      celda('AG', { bold: true, width: 8, fill: 'D9E2F3', align: AlignmentType.CENTER }),
      celda('AC', { bold: true, width: 8, fill: 'D9E2F3', align: AlignmentType.CENTER }),
      celda('Disposición', { bold: true, width: 20, fill: 'D9E2F3', align: AlignmentType.CENTER })
    ] })
    const rows = filas.map(f => new TableRow({ children: [
      celda(f.codigo, { align: AlignmentType.CENTER }),
      celda(f.serie),
      celda(f.subserie),
      celda(f.ag != null ? String(f.ag) : '', { align: AlignmentType.CENTER }),
      celda(f.ac != null ? String(f.ac) : '', { align: AlignmentType.CENTER }),
      celda(f.disp ? `${f.disp} — ${DISP_TEXTO[f.disp] || ''}` : '', { align: AlignmentType.CENTER })
    ] }))
    children.push(new Table({ width: { size: 100, type: WidthType.PERCENTAGE }, rows: [header, ...rows] }))
  } else {
    children.push(P('Aún no hay subseries aprobadas para consignar en el acta.', { italics: true }))
  }
  children.push(P('AG: años en Archivo de Gestión · AC: años en Archivo Central.', { italics: true, size: 18, before: 60 }))

  // Observaciones del comité
  children.push(P('4. Observaciones del comité', { bold: true, size: 24, before: 120 }))
  if (obs.length) {
    obs.forEach((o, i) => {
      const ubic = o.serie ? `${o.serie}${o.subserie ? ' / ' + o.subserie : ''}` : 'General'
      children.push(P(`${i + 1}. [${o.estado === 'resuelta' ? 'RESUELTA' : 'PENDIENTE'}] (${ubic}) ${o.texto}`,
        { size: 20, after: 40 }))
      if (o.respuesta) children.push(P(`     Respuesta: ${o.respuesta}`, { size: 20, italics: true }))
    })
  } else {
    children.push(P('El comité no registró observaciones.', { italics: true }))
  }

  // Decisión y acto administrativo
  children.push(P('5. Decisión y acto administrativo', { bold: true, size: 24, before: 120 }))
  const actoTxt = conv.acto_administrativo
    ? `${conv.acto_administrativo} N.º ${conv.numero_acto || '____'} del ${conv.fecha_acto || '____'}`
    : 'pendiente de expedición'
  children.push(P(
    `El Comité Interno de Archivo aprueba la Tabla de Retención Documental aquí consignada y recomienda ` +
    `su adopción mediante acto administrativo (${actoTxt}), para su posterior remisión y convalidación ante ` +
    `el Consejo Departamental de Archivos.`))
  if (conv.radicado_numero) {
    children.push(P(`Radicado ante el Consejo/AGN: N.º ${conv.radicado_numero} del ${conv.radicado_fecha || '____'}.`))
  }

  // Firmas
  children.push(P(''))
  children.push(P(''))
  children.push(P('En constancia firman,', { before: 200 }))
  children.push(P(''))
  children.push(P(''))
  children.push(P('_______________________________            _______________________________'))
  children.push(P('Presidente del Comité                                   Secretario Técnico'))

  children.push(P(`${meta.ciudad || '____________'}, ${fechaHoy}.`, { before: 200, italics: true, size: 18 }))

  const doc = new Document({ sections: [{ children }] })
  return await Packer.toBuffer(doc)
}

// ======================================================
// OFICIO DE REMISIÓN al Consejo Departamental de Archivos
// ======================================================

export async function generarOficioRemision(db, entidadId, meta = {}) {

  const conv = await obtenerConvalidacion(db, entidadId)
  const datos = await obtenerDatosExport(db, entidadId)
  const filas = filasTRD(datos)

  const entidad = meta.entidad || 'la entidad'
  const fechaHoy = meta.fecha || new Date().toLocaleDateString('es-CO')

  const children = []

  children.push(new Paragraph({ alignment: AlignmentType.RIGHT, spacing: { after: 200 },
    children: [new TextRun({ text: `${meta.ciudad || '____________'}, ${fechaHoy}`, size: 22 })] }))

  children.push(P('Señores', { after: 20 }))
  children.push(P('CONSEJO DEPARTAMENTAL DE ARCHIVOS', { bold: true, after: 20 }))
  children.push(P('E.  S.  D.', { after: 200 }))

  children.push(P('Asunto: Remisión de la Tabla de Retención Documental para convalidación.', { bold: true, after: 200 }))

  children.push(P('Respetados señores:', { after: 160 }))

  const actoTxt = conv.acto_administrativo
    ? `${conv.acto_administrativo} N.º ${conv.numero_acto || '____'} del ${conv.fecha_acto || '____'}`
    : 'acto administrativo (en trámite)'
  const actaTxt = conv.numero_acta
    ? `Acta N.º ${conv.numero_acta}${conv.fecha_comite ? ' del ' + conv.fecha_comite : ''}`
    : 'acta del Comité Interno de Archivo'

  children.push(P(
    `En cumplimiento de la Ley 594 de 2000, el Decreto 1080 de 2015 y el Acuerdo AGN 004 de 2019, ` +
    `${entidad} remite para su evaluación y convalidación la Tabla de Retención Documental (TRD) de la entidad, ` +
    `aprobada por el Comité Interno de Archivo según ${actaTxt} y adoptada mediante ${actoTxt}.`))

  children.push(P(
    `La TRD que se remite está conformada por ${filas.length} subseries documentales, con su respectiva ` +
    `valoración (tiempos de retención en archivo de gestión y central, disposición final y fundamento).`))

  children.push(P('Se anexan los siguientes documentos:', { bold: true, before: 120 }))
  children.push(P('•  Tabla de Retención Documental (Formato Único – Acuerdo AGN 004 de 2019).'))
  children.push(P('•  Cuadro de Clasificación Documental (CCD) codificado.'))
  children.push(P(`•  ${actaTxt} del Comité Interno de Archivo.`))
  children.push(P(`•  Copia del ${actoTxt}.`))

  children.push(P('Agradecemos su gestión y quedamos atentos a las observaciones a que haya lugar.', { before: 160 }))

  children.push(P('Cordialmente,', { before: 240 }))
  children.push(P(''))
  children.push(P(''))
  children.push(P('_______________________________'))
  children.push(P(meta.representante || 'Alcalde(sa) Municipal', { bold: true }))
  children.push(P(entidad))

  const doc = new Document({ sections: [{ children }] })
  return await Packer.toBuffer(doc)
}

// ======================================================
// RUTAS
//   GET /api/trd-ai/convalidacion/acta.docx
//   GET /api/trd-ai/convalidacion/oficio.docx
// ======================================================

export function registrarExpediente(router, db, guard) {
  const mw = typeof guard === 'function' ? guard : (req, res, next) => next()

  async function meta(entidadId) {
    let entidad = ''
    try {
      const e = await db.get(`SELECT nombre FROM entidades WHERE id::text = ?`, [String(entidadId)])
      entidad = e?.nombre || ''
    } catch { /* ignorar */ }
    return { entidad, fecha: new Date().toLocaleDateString('es-CO') }
  }

  router.get('/convalidacion/acta.docx', mw, async (req, res) => {
    try {
      const entidadId = req.entidad_id || null
      const buffer = await generarActaComite(db, entidadId, await meta(entidadId))
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document')
      res.setHeader('Content-Disposition', 'attachment; filename="Acta-Comite-TRD.docx"')
      res.setHeader('Content-Length', buffer.length)
      return res.send(buffer)
    } catch (err) {
      console.error('Expediente acta error:', err)
      return res.status(500).json({ ok: false, error: 'No se pudo generar el acta' })
    }
  })

  router.get('/convalidacion/oficio.docx', mw, async (req, res) => {
    try {
      const entidadId = req.entidad_id || null
      const buffer = await generarOficioRemision(db, entidadId, await meta(entidadId))
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document')
      res.setHeader('Content-Disposition', 'attachment; filename="Oficio-remision-TRD.docx"')
      res.setHeader('Content-Length', buffer.length)
      return res.send(buffer)
    } catch (err) {
      console.error('Expediente oficio error:', err)
      return res.status(500).json({ ok: false, error: 'No se pudo generar el oficio' })
    }
  })
}
