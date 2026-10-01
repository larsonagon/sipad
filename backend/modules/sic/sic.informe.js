// ======================================================
// SIPAD · Diagnóstico SIC — Informe Word
// ------------------------------------------------------
// "Diagnóstico Integral de Archivos y propuesta de acciones del SIC".
// Llena las secciones que el documento del SIC tenía pendientes:
// diagnóstico (volumen, estado, riesgos), tabla de documentos
// electrónicos a preservar, hallazgos → acciones por programa y
// cronograma propuesto. Es un BORRADOR para validación del asesor.
// ======================================================

import {
  Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell,
  WidthType, AlignmentType, HeadingLevel, ImageRun, PageOrientation, Footer, PageNumber
} from 'docx'
import { COMPONENTES, INSTITUCIONAL, SISTEMAS } from './sic.formulario.js'
import { PRIORIDADES } from './sic.motor.js'

const AZUL = '0D3F77'
const FILL_H = 'D9E2F3'
const COLOR_NIVEL = { 'crítica': 'F8D7DA', 'alta': 'FDE7C8', 'media': 'FFF6CC', 'baja': 'E2F0D9' }
const fmt = (n) => (n === null || n === undefined || n === '' ? '—' : Number(n).toLocaleString('es-CO', { maximumFractionDigits: 1 }))

function P(text, o = {}) {
  return new Paragraph({
    alignment: o.align || AlignmentType.JUSTIFIED,
    spacing: { after: o.after ?? 120, before: o.before ?? 0 },
    children: [new TextRun({ text: text || '', bold: !!o.bold, italics: !!o.italics, size: o.size || 21, color: o.color || '000000' })]
  })
}
const H1 = (t) => new Paragraph({ heading: HeadingLevel.HEADING_1, spacing: { before: 280, after: 120 },
  children: [new TextRun({ text: t, bold: true, size: 26, color: AZUL })] })
const H2 = (t) => new Paragraph({ heading: HeadingLevel.HEADING_2, spacing: { before: 200, after: 80 },
  children: [new TextRun({ text: t, bold: true, size: 22, color: AZUL })] })

function celda(text, { bold = false, width, fill, align = AlignmentType.LEFT, size = 16 } = {}) {
  const lineas = String(text ?? '').split('\n')
  return new TableCell({
    width: width ? { size: width, type: WidthType.PERCENTAGE } : undefined,
    shading: fill ? { fill } : undefined,
    margins: { top: 40, bottom: 40, left: 60, right: 60 },
    children: lineas.map(l => new Paragraph({ alignment: align, children: [new TextRun({ text: l, bold, size })] }))
  })
}

function tabla(encabezados, filas, anchos) {
  const head = new TableRow({ tableHeader: true, children: encabezados.map((h, i) => celda(h, { bold: true, fill: FILL_H, width: anchos?.[i] })) })
  const rows = filas.map(f => new TableRow({ children: f.map((c, i) =>
    typeof c === 'object' && c !== null && 'texto' in c
      ? celda(c.texto, { fill: c.fill, bold: c.bold, width: anchos?.[i], align: c.align })
      : celda(c, { width: anchos?.[i] })) }))
  return new Table({ width: { size: 100, type: WidthType.PERCENTAGE }, rows: [head, ...rows] })
}

const nivelCelda = (n) => ({ texto: (n || '').toUpperCase(), fill: COLOR_NIVEL[n], bold: true, align: AlignmentType.CENTER })

function textoRespuesta(p, r) {
  if (!r) return '—'
  const v = r.v
  let t
  if (p.tipo === 'spn') t = { si: 'Sí', parcial: 'Parcial', no: 'No', ns: 'No sabe' }[v] || '—'
  else if (Array.isArray(v)) t = v.length ? v.join(', ') : '—'
  else if (v === null || v === undefined || v === '') t = '—'
  else t = p.unidad ? `${fmt(v)} ${p.unidad}` : String(v)
  if (r.x !== undefined && p.extra) t += ` · ${p.extra.etiqueta}: ${r.x}`
  return t
}

export async function generarInformeSIC({ analisis: a, estado, redaccion, resumen, entidad = 'la entidad', fecha, fotos = {} }) {
  const c = []
  const hoy = fecha || new Date().toISOString().slice(0, 10)

  // ---- Portada / encabezado ----
  c.push(new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 80 },
    children: [new TextRun({ text: 'DIAGNÓSTICO INTEGRAL DE ARCHIVOS', bold: true, size: 32, color: AZUL })] }))
  c.push(new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 80 },
    children: [new TextRun({ text: 'y propuesta de acciones del Sistema Integrado de Conservación (SIC)', bold: true, size: 24, color: AZUL })] }))
  c.push(P(entidad, { align: AlignmentType.CENTER, bold: true, size: 24 }))
  c.push(P(`Fecha de corte: ${hoy}`, { align: AlignmentType.CENTER, size: 18, color: '555555' }))
  c.push(P('Documento de trabajo: borrador para validación técnica antes de su presentación al Comité Institucional de Gestión y Desempeño.',
    { align: AlignmentType.CENTER, italics: true, size: 17, color: '7A5C00', after: 240 }))

  // ---- 1. Metodología ----
  c.push(H1('1. Alcance y metodología'))
  c.push(P(redaccion.metodologia))
  const av = a.avance
  c.push(P(`Avance del diligenciamiento: cuestionario institucional ${av.institucional.pct} %, sistemas ${av.sistemas.pct} %, ` +
    `${av.espacios.registrados} espacio(s) registrado(s)` + (av.espacios.declarados ? ` de ${av.espacios.declarados} declarados` : '') +
    `, ${av.espacios.fichasCompletas} ficha(s) de inspección completas y ${av.sistemas.repositorios} repositorio(s) electrónico(s) inventariado(s).`))

  // ---- 2. Síntesis ----
  c.push(H1('2. Síntesis del diagnóstico'))
  for (const parr of String(resumen?.texto || redaccion.sintesis).split(/\n\s*\n/)) c.push(P(parr.trim()))

  // ---- 3. Volumen y estado ----
  c.push(H1('3. Volumen documental y estado de conservación'))
  c.push(P(`Volumen total levantado: ${fmt(a.volumen.total_ml)} metros lineales. Fuera de estantería: ${fmt(a.volumen.fuera_de_estanteria_ml)} m. En mal estado (estimado): ${fmt(a.volumen.mal_estado_ml)} m.`))
  if (a.espacios.length) {
    c.push(tabla(
      ['Espacio', 'Tipo', 'Dependencias', 'Estantería (m)', 'Fuera de estantería (m)', 'Total (m)', 'Estado B / R / M (%)', 'Riesgo'],
      [
        ...a.espacios.map(e => [e.nombre, e.tipo || '—', e.dependencias.join(', ') || '—',
          { texto: fmt(e.volumen.estanteria + e.volumen.archivadores), align: AlignmentType.RIGHT },
          { texto: fmt(e.volumen.fuera_de_estanteria), align: AlignmentType.RIGHT },
          { texto: fmt(e.volumen.total), align: AlignmentType.RIGHT, bold: true },
          e.estado ? `${fmt(e.estado.bueno)} / ${fmt(e.estado.regular)} / ${fmt(e.estado.malo)}` : '—',
          nivelCelda(e.riesgo.nivel)]),
        [{ texto: 'TOTAL', bold: true }, '', '', '', { texto: fmt(a.volumen.fuera_de_estanteria_ml), align: AlignmentType.RIGHT, bold: true },
          { texto: fmt(a.volumen.total_ml), align: AlignmentType.RIGHT, bold: true }, '', '']
      ], [18, 12, 18, 9, 10, 8, 13, 12]))
    const porDep = Object.entries(a.volumen.por_dependencia).sort((x, y) => y[1] - x[1])
    if (porDep.length) {
      c.push(H2('Volumen por dependencia'))
      c.push(tabla(['Dependencia', 'Metros lineales'], porDep.map(([d, m]) => [d, { texto: fmt(m), align: AlignmentType.RIGHT }]), [75, 25]))
      c.push(P('Cuando un espacio guarda documentos de varias dependencias, su volumen se reparte en partes iguales entre ellas.', { italics: true, size: 16, color: '666666' }))
    }
  } else {
    c.push(P('Aún no se han registrado espacios con documentos.', { italics: true }))
  }

  // ---- 4. Matriz de riesgos ----
  c.push(H1('4. Matriz de riesgos por espacio'))
  c.push(P('El nivel de riesgo combina los factores observados en la inspección. Los hongos y la presencia de agua pesan más, por el daño que causan a los documentos y por el riesgo para la salud del personal.'))
  if (a.espacios.length) c.push(tabla(['Espacio', 'Nivel', 'Puntos', 'Factores principales', 'Prioridad del técnico'],
    a.espacios.map(e => [e.nombre, nivelCelda(e.riesgo.nivel), { texto: String(e.riesgo.puntos), align: AlignmentType.CENTER },
      e.riesgo.factores.slice(0, 5).map(f => f.factor).join('\n') || 'Sin factores de riesgo registrados', e.prioridad_tecnico || '—']),
    [22, 11, 8, 44, 15]))

  // ---- 5. Indicadores ----
  c.push(H1('5. Evaluación por componente'))
  c.push(tabla(['Componente', 'Indicador (0–100)', 'Nivel', 'Respuestas evaluadas'],
    a.indicadores.map(i => [i.nombre, { texto: i.valor === null ? '—' : String(i.valor), align: AlignmentType.CENTER }, i.nivel,
      { texto: String(i.respuestas), align: AlignmentType.CENTER }]), [46, 18, 18, 18]))

  // ---- 6. Documentos electrónicos ----
  c.push(H1('6. Documentos electrónicos a preservar'))
  if (a.repositorios.length) {
    c.push(tabla(['Sistema o repositorio', 'Tipo', 'Contenido', 'Responsable', 'Copia de seguridad', 'Indispensable', 'Riesgo'],
      a.repositorios.map(r => [r.nombre, r.tipo || '—', r.contenido || '—', r.responsable || '—', r.copia || '—', r.indispensable ? 'Sí' : 'No', nivelCelda(r.riesgo.nivel)]),
      [17, 13, 22, 13, 12, 10, 13]))
  } else c.push(P('La Oficina de Sistemas aún no ha inventariado sistemas ni repositorios.', { italics: true }))

  // ---- 7. Hallazgos y acciones ----
  c.push(H1('7. Hallazgos y acciones por programa'))
  c.push(P('Cada hallazgo indica la pregunta del formulario de la que proviene (columna Evidencia), para su verificación.'))
  const programas = [...new Set(a.hallazgos.map(h => h.componente))]
    .sort((x, y) => Object.keys(COMPONENTES).indexOf(x) - Object.keys(COMPONENTES).indexOf(y))
  for (const k of programas) {
    const hs = a.hallazgos.filter(h => h.componente === k)
    c.push(H2(COMPONENTES[k]))
    c.push(tabla(['ID', 'Prioridad', 'Hallazgo', 'Acción propuesta', 'Plazo', 'Costo', 'Evidencia'],
      hs.map(h => [h.id, nivelCelda(h.prioridad), h.hallazgo + (h.espacios.length ? `\nEspacios: ${h.espacios.join(', ')}` : ''), h.accion,
        h.plazo, h.costo_txt, h.evidencia.join(', ')]), [6, 9, 27, 28, 11, 11, 8]))
  }
  if (!a.hallazgos.length) c.push(P('Sin hallazgos con la información diligenciada hasta ahora.', { italics: true }))

  // ---- 8. Cronograma ----
  c.push(H1('8. Cronograma propuesto'))
  c.push(P('Las acciones se ordenan por prioridad. Dentro de cada fase conviene ejecutar primero las que no tienen costo; las que requieren contratación deben incluirse en el presupuesto.'))
  for (const f of a.cronograma) {
    c.push(H2(`Prioridad ${f.prioridad} · ${f.plazo}`))
    c.push(tabla(['ID', 'Programa', 'Acción', 'Costo', 'Responsable', 'Fecha'],
      f.acciones.map(x => [x.id, x.programa, x.accion, { sin_costo: 'Sin costo', bajo: 'Bajo', contratacion: 'Contratación' }[x.costo], '', '']),
      [6, 18, 44, 10, 12, 10]))
  }

  // ---- 9. Verificaciones ----
  c.push(H1('9. Información pendiente de verificar'))
  c.push(P(redaccion.verificacion))
  if (a.verificaciones.length) c.push(tabla(['Pregunta', 'Dónde', 'Qué verificar'],
    a.verificaciones.map(v => [v.pregunta, v.donde, v.texto]), [12, 25, 63]))

  // ---- Anexo A: respuestas ----
  c.push(H1('Anexo A. Respuestas del cuestionario institucional y de sistemas'))
  for (const b of [...INSTITUCIONAL, ...SISTEMAS]) {
    c.push(H2(b.titulo))
    c.push(tabla(['ID', 'Pregunta', 'Respuesta', 'Soporte / observación'],
      b.preguntas.map(p => { const r = estado.institucional[p.id]; return [p.id, p.texto, textoRespuesta(p, r), [r?.s, r?.o].filter(Boolean).join(' · ') || '—'] }),
      [8, 47, 25, 20]))
  }

  // ---- Anexo B: registro fotográfico ----
  const conFotos = a.espacios.filter(e => fotos[e.id]?.length)
  if (conFotos.length) {
    c.push(H1('Anexo B. Registro fotográfico'))
    for (const e of conFotos) {
      c.push(H2(e.nombre))
      for (const f of fotos[e.id]) {
        const ancho = 300
        const alto = f.ancho && f.alto ? Math.round(ancho * f.alto / f.ancho) : 225
        try {
          c.push(new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 120 }, children: [
            new ImageRun({ type: f.mime === 'image/png' ? 'png' : 'jpg', data: Buffer.from(f.datos, 'base64'), transformation: { width: ancho, height: Math.min(alto, 420) } })] }))
        } catch { /* imagen corrupta: se omite */ }
      }
    }
  }

  const doc = new Document({
    creator: 'SIPAD', title: 'Diagnóstico Integral de Archivos – SIC',
    sections: [{
      properties: { page: { size: { orientation: PageOrientation.LANDSCAPE }, margin: { top: 1000, bottom: 1000, left: 1100, right: 1100 } } },
      footers: { default: new Footer({ children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [
        new TextRun({ text: `${entidad} · Diagnóstico Integral de Archivos · Página `, size: 15, color: '777777' }),
        new TextRun({ children: [PageNumber.CURRENT], size: 15, color: '777777' })] })] }) },
      children: c
    }]
  })
  return Packer.toBuffer(doc)
}

export { PRIORIDADES }
