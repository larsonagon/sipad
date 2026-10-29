// ======================================================
// SIPAD · Diagnóstico SIC — Informe Word (ejecutivo, vertical)
// ------------------------------------------------------
// "Diagnóstico preliminar del SIC y propuesta de acciones".
// Portada con cifras clave, resumen ejecutivo, gráfico por
// componente, matriz de riesgos (probabilidad × impacto),
// hallazgos en fichas por prioridad y hoja de ruta. Los gráficos
// se arman con tablas de Word: se ven igual en Word, LibreOffice
// y Google Docs, se imprimen nítidos y se pueden editar.
// Es un BORRADOR para validación del asesor.
// ======================================================

import {
  Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell, WidthType, AlignmentType,
  HeadingLevel, ImageRun, Footer, Header, PageNumber, BorderStyle, TableLayoutType, HeightRule,
  VerticalAlign, PageBreak
} from 'docx'
import { COMPONENTES, INSTITUCIONAL, SISTEMAS, aplica } from './sic.formulario.js'
import { PRIORIDADES, PLAZOS, NIVEL_RIESGO } from './sic.motor.js'

// ---------------- Paleta y medidas (carta vertical) ----------------
const AZUL = '0D3F77'
const AZUL_CLARO = 'EEF3FA'
const GRIS = '6B7280'
const PISTA = 'E9ECEF'
const W = 9972 // ancho útil: 12240 − 2 × 1134
const PRIO = { 'crítica': 'C0392B', 'alta': 'E67E22', 'media': 'B7950B', 'baja': '27AE60' }
const COMP = { 'crítico': 'C0392B', 'bajo': 'E67E22', 'medio': 'B7950B', 'adecuado': '27AE60', 'sin datos': 'BFBFBF' }
const RIES = { extremo: 'C0392B', alto: 'E67E22', moderado: 'B7950B', bajo: '27AE60', 'sin datos': 'BFBFBF' }
const CALOR = { extremo: 'E57373', alto: 'F5B041', moderado: 'F7DC6F', bajo: '9AD9B4' }
const COSTO = { sin_costo: { t: 'Sin costo', c: AZUL }, bajo: { t: 'Costo bajo', c: '4F7CC0' }, contratacion: { t: 'Contratación', c: '9DB8E3' } }
const COLOR_NIVEL = { 'crítica': 'F8D7DA', 'alta': 'FDE7C8', 'media': 'FFF6CC', 'baja': 'E2F0D9' }
const fmt = (n) => (n === null || n === undefined || n === '' ? '—' : Number(n).toLocaleString('es-CO', { maximumFractionDigits: 1 }))

// ---------------- Primitivas ----------------
const NB = { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' }
const SIN_BORDES = { top: NB, bottom: NB, left: NB, right: NB, insideHorizontal: NB, insideVertical: NB }
const R = (text, o = {}) => new TextRun({ text: String(text ?? ''), bold: !!o.bold, italics: !!o.italics, size: o.size || 20, color: o.color || '1F2937', font: o.font })
function P(text, o = {}) {
  return new Paragraph({
    alignment: o.align || AlignmentType.JUSTIFIED, keepNext: !!o.keepNext,
    spacing: { after: o.after ?? 120, before: o.before ?? 0, line: o.line },
    children: Array.isArray(text) ? text : [R(text, o)]
  })
}
const espacio = (after = 120) => new Paragraph({ spacing: { after }, children: [] })
const salto = () => new Paragraph({ children: [new PageBreak()] })

function H1(t) {
  return new Paragraph({ heading: HeadingLevel.HEADING_1, keepNext: true, spacing: { before: 240, after: 140 },
    border: { bottom: { style: BorderStyle.SINGLE, size: 12, color: AZUL, space: 4 } },
    children: [new TextRun({ text: t, bold: true, size: 30, color: AZUL })] })
}
const H2 = (t) => new Paragraph({ heading: HeadingLevel.HEADING_2, keepNext: true, spacing: { before: 200, after: 90 },
  children: [new TextRun({ text: t, bold: true, size: 23, color: AZUL })] })
const lectura = (t) => P([R(t, { size: 19, color: GRIS, italics: true })], { after: 200, align: AlignmentType.LEFT })

function C(children, { w, fill, borders, margins, vAlign, span } = {}) {
  return new TableCell({
    width: { size: w, type: WidthType.DXA }, columnSpan: span,
    shading: fill ? { fill, color: 'auto', type: 'clear' } : undefined,
    borders: borders || { top: NB, bottom: NB, left: NB, right: NB },
    margins: margins || { top: 40, bottom: 40, left: 80, right: 80 },
    verticalAlign: vAlign || VerticalAlign.CENTER,
    children: Array.isArray(children) ? children : [children]
  })
}
function grilla(filas, anchos, { borders = SIN_BORDES } = {}) {
  return new Table({
    width: { size: anchos.reduce((a, b) => a + b, 0), type: WidthType.DXA },
    columnWidths: anchos, layout: TableLayoutType.FIXED, borders,
    rows: filas
  })
}
const fila = (celdas, alto, exacto = false) => new TableRow({ cantSplit: true, children: celdas,
  height: alto ? { value: alto, rule: exacto ? HeightRule.EXACT : HeightRule.ATLEAST } : undefined })
const centro = (runs, o = {}) => new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: o.after ?? 0, before: o.before ?? 0 }, children: Array.isArray(runs) ? runs : [runs] })

// Tabla clásica (para anexos y secciones de detalle)
const FINO = { style: BorderStyle.SINGLE, size: 4, color: 'D1D5DB' }
const BORDES_FINOS = { top: FINO, bottom: FINO, left: FINO, right: FINO, insideHorizontal: FINO, insideVertical: FINO }
function tabla(encabezados, filas, porcentajes) {
  const anchos = porcentajes.map(p => Math.round(W * p / 100))
  const celdaT = (v, i, head) => {
    const o = (typeof v === 'object' && v !== null && 'texto' in v) ? v : { texto: v }
    return C(String(o.texto ?? '').split('\n').map(l => new Paragraph({ alignment: o.align || AlignmentType.LEFT,
      children: [R(l, { size: 17, bold: head || o.bold, color: head ? AZUL : '1F2937' })] })),
    { w: anchos[i], fill: head ? AZUL_CLARO : o.fill, borders: { top: FINO, bottom: FINO, left: FINO, right: FINO }, vAlign: VerticalAlign.TOP })
  }
  return grilla([
    new TableRow({ tableHeader: true, cantSplit: true, children: encabezados.map((h, i) => celdaT(h, i, true)) }),
    ...filas.map(f => fila(f.map((v, i) => celdaT(v, i, false))))
  ], anchos, { borders: BORDES_FINOS })
}
const nivelCelda = (n) => (n ? { texto: n.toUpperCase(), fill: COLOR_NIVEL[n], bold: true, align: AlignmentType.CENTER } : { texto: 'Sin inspección', align: AlignmentType.CENTER })

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

// ---------------- Gráficos ----------------

// Portada: franja con título y entidad
function franjaPortada(entidad, fecha) {
  return grilla([fila([C([
    espacio(200),
    P([R('DIAGNÓSTICO PRELIMINAR DEL SIC', { size: 44, bold: true, color: 'FFFFFF' })], { align: AlignmentType.LEFT, after: 60 }),
    P([R('Sistema Integrado de Conservación · hallazgos y propuesta de acciones', { size: 24, color: 'D6E2F3' })], { align: AlignmentType.LEFT, after: 360 }),
    P([R(entidad, { size: 30, bold: true, color: 'FFFFFF' })], { align: AlignmentType.LEFT, after: 60 }),
    P([R(`Fecha de corte: ${fecha}`, { size: 20, color: 'D6E2F3' })], { align: AlignmentType.LEFT, after: 200 })
  ], { w: W, fill: AZUL, margins: { top: 240, bottom: 240, left: 400, right: 400 } })])], [W])
}

// Cifras clave: fichas con número grande
function cifras(items) {
  const gap = 160
  const ancho = Math.floor((W - gap * (items.length - 1)) / items.length)
  const anchos = items.flatMap((_, i) => (i ? [gap, ancho] : [ancho]))
  const celdas = items.flatMap((it, i) => {
    const c = C([
      centro([R(it.valor, { size: 56, bold: true, color: it.color || AZUL })], { before: 80 }),
      centro([R(it.etiqueta, { size: 17, color: '374151' })], { after: 80 })
    ], { w: ancho, fill: AZUL_CLARO, borders: { top: { style: BorderStyle.SINGLE, size: 24, color: it.color || AZUL }, bottom: NB, left: NB, right: NB } })
    return i ? [C(espacio(0), { w: gap }), c] : [c]
  })
  return grilla([fila(celdas, 1300)], anchos)
}

// Recuadro de cita (lo que dice quien responde)
function recuadro(parrafos) {
  return grilla([fila([C(parrafos, { w: W, fill: 'F5F8FC', margins: { top: 140, bottom: 100, left: 240, right: 240 },
    borders: { left: { style: BorderStyle.SINGLE, size: 36, color: AZUL }, top: NB, bottom: NB, right: NB } })])], [W])
}

// Barras horizontales por componente (0–100), 20 segmentos de 5 puntos
function barrasComponentes(indicadores) {
  const NOMBRE = 3700, VALOR = 772, SEG = 20, S = Math.floor((W - NOMBRE - VALOR) / SEG)
  const anchos = [NOMBRE, ...Array(SEG).fill(S), W - NOMBRE - S * SEG]
  const orden = [...indicadores].sort((a, b) => (a.valor ?? 101) - (b.valor ?? 101))
  const filas = orden.map(i => {
    const llenos = i.valor === null ? 0 : Math.round(i.valor / 5)
    const color = COMP[i.nivel] || COMP['sin datos']
    return fila([
      C(P([R(i.nombre, { size: 16 })], { align: AlignmentType.RIGHT, after: 0 }), { w: NOMBRE, margins: { top: 30, bottom: 30, left: 60, right: 140 } }),
      ...Array.from({ length: SEG }, (_, k) => C(espacio(0), { w: S, fill: k < llenos ? color : PISTA,
        borders: { top: { style: BorderStyle.SINGLE, size: 18, color: 'FFFFFF' }, bottom: { style: BorderStyle.SINGLE, size: 18, color: 'FFFFFF' }, left: NB, right: { style: BorderStyle.SINGLE, size: 2, color: 'FFFFFF' } },
        margins: { top: 0, bottom: 0, left: 0, right: 0 } })),
      C(P([R(i.valor === null ? 's. d.' : String(i.valor), { size: 19, bold: true, color })], { align: AlignmentType.LEFT, after: 0 }), { w: anchos.at(-1), margins: { top: 20, bottom: 20, left: 100, right: 40 } })
    ], 340)
  })
  // Eje: 0 · 25 · 50 · 75 · 100
  const eje = fila([C(espacio(0), { w: NOMBRE }),
    ...Array.from({ length: SEG }, (_, k) => C(P([R(k % 5 === 0 ? String(k * 5) : '', { size: 14, color: GRIS })], { align: AlignmentType.LEFT, after: 0 }), { w: S, margins: { top: 20, bottom: 0, left: 0, right: 0 } })),
    C(P([R('100', { size: 14, color: GRIS })], { align: AlignmentType.LEFT, after: 0 }), { w: anchos.at(-1), margins: { top: 20, bottom: 0, left: 0, right: 0 } })])
  return grilla([...filas, eje], anchos)
}

// Leyenda en línea: ■ etiqueta
const leyenda = (items) => P(items.flatMap(([t, c], i) => [R(`${i ? '     ' : ''}■ `, { size: 20, color: c }), R(t, { size: 17, color: '374151' })]), { align: AlignmentType.CENTER, after: 160, before: 80 })

// Mapa de calor 5 × 5 (probabilidad × impacto)
function mapaCalor(riesgos) {
  const EJE = 1700, CEL = Math.floor((W - EJE) / 5), anchos = [EJE, ...Array(5).fill(CEL)]
  const PROB = ['Rara vez', 'Improbable', 'Posible', 'Probable', 'Casi seguro']
  const IMP = ['Insignificante', 'Menor', 'Moderado', 'Mayor', 'Catastrófico']
  const blanco = { style: BorderStyle.SINGLE, size: 24, color: 'FFFFFF' }
  const filas = []
  for (let p = 5; p >= 1; p--) {
    filas.push(fila([
      C([P([R(`${p} · `, { size: 17, bold: true, color: AZUL }), R(PROB.at(p - 1), { size: 16, color: '374151' })], { align: AlignmentType.RIGHT, after: 0 })], { w: EJE, margins: { top: 0, bottom: 0, left: 40, right: 120 } }),
      ...[1, 2, 3, 4, 5].map(i => {
        const aqui = riesgos.filter(r => r.probabilidad === p && r.impacto === i).map(r => r.id)
        return C(centro([R(aqui.join('  '), { size: 22, bold: true, color: '111827' })]),
          { w: CEL, fill: CALOR[NIVEL_RIESGO(p * i)], borders: { top: blanco, bottom: blanco, left: blanco, right: blanco } })
      })
    ], 720, true))
  }
  filas.push(fila([
    C(espacio(0), { w: EJE }),
    ...IMP.map((t, k) => C([centro([R(`${k + 1}`, { size: 17, bold: true, color: AZUL })], { before: 60 }), centro([R(t, { size: 15, color: '374151' })])], { w: CEL, vAlign: VerticalAlign.TOP }))
  ]))
  return grilla(filas, anchos)
}

// Barra apilada 100 % (prioridad, costo)
function barraApilada(etiqueta, partes) {
  const ETQ = 1900, ANCHO = W - ETQ
  const vivas = partes.filter(p => p.n > 0)
  const total = vivas.reduce((a, p) => a + p.n, 0) || 1
  let anchos = vivas.map(p => Math.max(380, Math.round(ANCHO * p.n / total)))
  const exceso = anchos.reduce((a, b) => a + b, 0) - ANCHO
  const mayor = anchos.indexOf(Math.max(...anchos)); anchos[mayor] -= exceso
  return grilla([fila([
    C(P([R(etiqueta, { size: 18, bold: true, color: '374151' })], { align: AlignmentType.RIGHT, after: 0 }), { w: ETQ, margins: { top: 0, bottom: 0, left: 40, right: 160 } }),
    ...vivas.map((p, i) => C(centro([R(String(p.n), { size: 20, bold: true, color: p.texto || 'FFFFFF' })]), { w: anchos[i], fill: p.c,
      borders: { top: NB, bottom: NB, left: NB, right: { style: BorderStyle.SINGLE, size: 12, color: 'FFFFFF' } } }))
  ], 460, true)], [ETQ, ...anchos])
}

// Fichas de hallazgo
function fichas(hs, prio) {
  const IZQ = 1150, DER = W - IZQ
  const linea = { style: BorderStyle.SINGLE, size: 4, color: 'E5E7EB' }
  const n = hs.length
  const banda = new TableRow({ tableHeader: true, cantSplit: true, children: [C(new Paragraph({ keepNext: true, children: [
    R(`PRIORIDAD ${prio.toUpperCase()}`, { size: 20, bold: true, color: 'FFFFFF' }),
    R(`   ·   ${PLAZOS[prio]}   ·   ${n} ${n === 1 ? 'acción' : 'acciones'}`, { size: 18, color: 'FFFFFF' })] }),
  { w: W, span: 2, fill: PRIO[prio], margins: { top: 80, bottom: 80, left: 200, right: 200 } })] })
  return grilla([banda, ...hs.map(h => fila([
    C([P([R(h.id, { size: 22, bold: true, color: PRIO[h.prioridad] })], { align: AlignmentType.LEFT, after: 20 }),
      P([R(COSTO[h.costo]?.t || '', { size: 15, color: GRIS })], { align: AlignmentType.LEFT, after: 0 })],
    { w: IZQ, vAlign: VerticalAlign.TOP, margins: { top: 100, bottom: 100, left: 140, right: 60 },
      borders: { left: { style: BorderStyle.SINGLE, size: 30, color: PRIO[h.prioridad] }, top: NB, right: NB, bottom: linea } }),
    C([
      P([R(h.hallazgo, { size: 19, bold: true })], { after: 60, align: AlignmentType.LEFT }),
      P([R('Acción: ', { size: 19, bold: true, color: AZUL }), R(h.accion, { size: 19 })], { after: 50, align: AlignmentType.LEFT }),
      ...(h.espacios?.length ? [P([R(`Espacios: ${h.espacios.join(', ')}`, { size: 16, color: GRIS })], { after: 30, align: AlignmentType.LEFT })] : []),
      P([R(`${h.programa}  ·  Evidencia: ${h.evidencia.join(', ')}`, { size: 15, color: GRIS })], { after: 0, align: AlignmentType.LEFT })
    ], { w: DER, vAlign: VerticalAlign.TOP, margins: { top: 100, bottom: 100, left: 160, right: 80 }, borders: { top: NB, left: NB, right: NB, bottom: linea } })
  ]))], [IZQ, DER])
}

// Hoja de ruta: cuatro fases con su conteo de acciones y costo
function hojaRuta(cronograma) {
  const gap = 140, n = PRIORIDADES.length, ancho = Math.floor((W - gap * (n - 1)) / n)
  const anchos = PRIORIDADES.flatMap((_, i) => (i ? [gap, ancho] : [ancho]))
  const dato = (p) => cronograma.find(f => f.prioridad === p)?.acciones || []
  const cab = PRIORIDADES.flatMap((p, i) => {
    const c = C([centro([R(p.toUpperCase(), { size: 18, bold: true, color: 'FFFFFF' })]), centro([R(PLAZOS[p], { size: 15, color: 'FFFFFF' })])], { w: ancho, fill: PRIO[p], margins: { top: 80, bottom: 80, left: 60, right: 60 } })
    return i ? [C(centro([R('›', { size: 36, color: 'BFBFBF' })]), { w: gap, margins: { top: 0, bottom: 0, left: 0, right: 0 } }), c] : [c]
  })
  const cuerpo = PRIORIDADES.flatMap((p, i) => {
    const acc = dato(p)
    const k = (c) => acc.filter(x => x.costo === c).length
    const c = C([
      centro([R(String(acc.length), { size: 52, bold: true, color: PRIO[p] })], { before: 60 }),
      centro([R(acc.length === 1 ? 'acción' : 'acciones', { size: 16, color: GRIS })], { after: 100 }),
      centro([R(`${k('sin_costo')} sin costo`, { size: 16 })]),
      centro([R(`${k('bajo')} de costo bajo`, { size: 16 })]),
      centro([R(`${k('contratacion')} con contratación`, { size: 16 })], { after: 80 })
    ], { w: ancho, fill: 'F8FAFC', vAlign: VerticalAlign.TOP })
    return i ? [C(espacio(0), { w: gap }), c] : [c]
  })
  return grilla([fila(cab), fila(cuerpo)], anchos)
}

// ---------------- Informe ----------------
export async function generarInformeSIC({ analisis: a, estado, redaccion, resumen, entidad = 'la entidad', fecha, fotos = {} }) {
  const c = []
  const hoy = fecha || new Date().toISOString().slice(0, 10)
  const av = a.avance
  const hp = a.resumen.hallazgos_por_prioridad
  const riesgos = a.riesgos || []
  const conDatos = a.indicadores.filter(i => i.valor !== null)
  const criticos = conDatos.filter(i => i.nivel === 'crítico')
  const extremos = riesgos.filter(r => r.nivel === 'extremo')
  let num = 0
  const sec = (t) => H1(`${++num}. ${t}`)

  // ---- Portada ----
  c.push(franjaPortada(entidad, hoy), espacio(320))
  c.push(P([R('Cifras clave', { size: 22, bold: true, color: AZUL })], { align: AlignmentType.LEFT, after: 120 }))
  c.push(cifras([
    { valor: String(a.hallazgos.length), etiqueta: 'hallazgos identificados' },
    { valor: String(hp['crítica'] || 0), etiqueta: 'de prioridad crítica', color: PRIO['crítica'] },
    { valor: `${criticos.length}/${conDatos.length}`, etiqueta: 'componentes en nivel crítico', color: PRIO['alta'] },
    { valor: `${extremos.length}/${riesgos.filter(r => r.valor !== null).length}`, etiqueta: 'riesgos en nivel extremo', color: PRIO['crítica'] }
  ]))
  c.push(espacio(320))
  const abiertas = [
    ['P-060', 'Los tres problemas más graves'],
    ['P-140', 'Lo que impide mejorar la conservación'],
    ['P-009', 'Problemas de los espacios de almacenamiento']
  ].map(([id, et]) => [et, estado.institucional[id]?.v]).filter(([, v]) => typeof v === 'string' && v.trim())
  if (abiertas.length) {
    c.push(P([R('Lo que señala quien responde', { size: 22, bold: true, color: AZUL })], { align: AlignmentType.LEFT, after: 120 }))
    c.push(recuadro(abiertas.map(([et, v]) => P([R(`${et}: `, { size: 19, bold: true }), R(`«${v.trim()}»`, { size: 19, italics: true })], { after: 80, align: AlignmentType.LEFT }))))
  }
  c.push(espacio(320))
  c.push(P([R('Documento de trabajo: borrador para validación técnica antes de su presentación al Comité Institucional de Gestión y Desempeño.', { size: 17, italics: true, color: '7A5C00' })], { align: AlignmentType.LEFT }))
  c.push(salto())

  // ---- 1. Resumen ejecutivo ----
  c.push(sec('Resumen ejecutivo'))
  for (const parr of String(resumen?.texto || redaccion.sintesis).split(/\n\s*\n/)) c.push(P(parr.trim()))
  if (extremos.length) c.push(P(`La matriz de riesgos ubica ${extremos.length} de ${riesgos.length} riesgos en nivel extremo: ${extremos.map(r => r.riesgo.toLowerCase()).join('; ')}. Estos se atienden primero, antes que cualquier programa formal.`))
  const inmediatas = a.hallazgos.filter(h => h.prioridad === 'crítica')
  if (inmediatas.length) {
    c.push(H2('Lo que debe hacerse en el primer mes'))
    inmediatas.forEach((h, i) => c.push(new Paragraph({ spacing: { after: 80 }, indent: { left: 360, hanging: 360 },
      children: [R(`${i + 1}.  `, { bold: true, color: PRIO['crítica'], size: 20 }), R(h.accion, { size: 20 })] })))
  }

  // ---- 2. Estado por componente ----
  c.push(sec('Estado por componente del SIC'))
  const peor = conDatos.slice().sort((x, y) => x.valor - y.valor)[0]
  const mejor = conDatos.slice().sort((x, y) => y.valor - x.valor)[0]
  c.push(P(`${criticos.length} de ${conDatos.length} componentes están en nivel crítico (menos de 25 sobre 100).` +
    (mejor ? ` El más fuerte es ${mejor.nombre.toLowerCase()} (${mejor.valor}/100)` : '') +
    (peor && mejor && peor !== mejor ? ` y el más débil, ${peor.nombre.toLowerCase()} (${peor.valor}/100).` : '.')))
  c.push(barrasComponentes(a.indicadores))
  c.push(leyenda([['Crítico (< 25)', COMP['crítico']], ['Bajo (25–49)', COMP.bajo], ['Medio (50–74)', COMP.medio], ['Adecuado (≥ 75)', COMP.adecuado]]))
  c.push(lectura('Cada indicador es el promedio de las respuestas del componente (Sí = 100, Parcial = 50, No = 0); las respuestas "No sabe" no cuentan.'))

  // ---- 3. Matriz de riesgos ----
  if (riesgos.some(r => r.valor !== null)) {
    c.push(sec('Matriz de riesgos'))
    c.push(P(`Diez riesgos de conservación calificados por probabilidad e impacto. ${extremos.length ? `${extremos.length} quedan en la zona roja (extremo) y deben tratarse en la estabilización inmediata.` : 'Ninguno queda en nivel extremo.'}`))
    c.push(P([R('Probabilidad ↑', { size: 16, bold: true, color: GRIS })], { align: AlignmentType.LEFT, after: 40 }))
    c.push(mapaCalor(riesgos.filter(r => r.valor !== null)))
    c.push(P([R('Impacto →', { size: 16, bold: true, color: GRIS })], { align: AlignmentType.RIGHT, after: 40, before: 40 }))
    c.push(leyenda([['Extremo (15–25)', RIES.extremo], ['Alto (10–14)', RIES.alto], ['Moderado (5–9)', RIES.moderado], ['Bajo (1–4)', RIES.bajo]]))
    const linea = { style: BorderStyle.SINGLE, size: 4, color: 'E5E7EB' }
    const A = [800, W - 800 - 1000 - 1500, 1000, 1500]
    c.push(grilla([
      fila(['', 'Riesgo y tratamiento principal', 'P × I', 'Nivel'].map((t, i) => C(P([R(t, { size: 16, bold: true, color: GRIS })], { align: i > 1 ? AlignmentType.CENTER : AlignmentType.LEFT, after: 0 }), { w: A[i], borders: { top: NB, left: NB, right: NB, bottom: { style: BorderStyle.SINGLE, size: 8, color: AZUL } } }))),
      ...riesgos.map(r => fila([
        C(P([R(r.id, { size: 20, bold: true, color: RIES[r.nivel] })], { align: AlignmentType.LEFT, after: 0 }), { w: A[0], borders: { top: NB, left: NB, right: NB, bottom: linea } }),
        C([P([R(r.riesgo, { size: 18, bold: true })], { after: 20, align: AlignmentType.LEFT }), P([R(r.tratamiento, { size: 16, color: GRIS })], { after: 0, align: AlignmentType.LEFT })], { w: A[1], borders: { top: NB, left: NB, right: NB, bottom: linea }, margins: { top: 70, bottom: 70, left: 80, right: 80 } }),
        C(centro([R(r.valor === null ? '—' : `${r.probabilidad} × ${r.impacto} = ${r.valor}`, { size: 17 })]), { w: A[2], borders: { top: NB, left: NB, right: NB, bottom: linea } }),
        C(centro([R(r.nivel.toUpperCase(), { size: 16, bold: true, color: 'FFFFFF' })]), { w: A[3], fill: RIES[r.nivel], borders: { top: { style: BorderStyle.SINGLE, size: 24, color: 'FFFFFF' }, bottom: { style: BorderStyle.SINGLE, size: 24, color: 'FFFFFF' }, left: NB, right: NB } })
      ]))
    ], A))
    c.push(lectura('Probabilidad: promedio de las respuestas que indican si el riesgo está presente o si falta su control. Impacto: daño esperado si ocurre, fijo por riesgo. Se valida en campo durante la estabilización.'))
  }

  // ---- 4. Hallazgos y acciones ----
  c.push(sec('Hallazgos y acciones'))
  if (a.hallazgos.length) {
    const pc = a.resumen.acciones_por_costo
    c.push(P(`${a.hallazgos.length} hallazgos, cada uno con su acción. ${pc.sin_costo} de las acciones no tienen costo y pueden empezar de inmediato; ${pc.contratacion} requieren presupuesto o contratación.`))
    c.push(barraApilada('Por prioridad', PRIORIDADES.map(p => ({ n: hp[p] || 0, c: PRIO[p] }))))
    c.push(leyenda(PRIORIDADES.map(p => [`${p[0].toUpperCase() + p.slice(1)} (${hp[p] || 0})`, PRIO[p]])))
    c.push(barraApilada('Por costo', Object.entries(COSTO).map(([k, v]) => ({ n: pc[k] || 0, c: v.c, texto: k === 'contratacion' ? '0D3F77' : 'FFFFFF' }))))
    c.push(leyenda(Object.entries(COSTO).map(([k, v]) => [`${v.t} (${pc[k] || 0})`, v.c])))
    for (const p of PRIORIDADES) {
      const hs = a.hallazgos.filter(h => h.prioridad === p)
      if (!hs.length) continue
      c.push(espacio(160), fichas(hs, p))
    }
  } else c.push(P('Sin hallazgos con la información diligenciada hasta ahora.', { italics: true }))

  // ---- 5. Hoja de ruta ----
  if (a.cronograma.length) {
    c.push(sec('Hoja de ruta'))
    c.push(P('Las acciones se ejecutan por fases según su prioridad. Dentro de cada fase van primero las que no tienen costo; las que requieren contratación se incluyen en el presupuesto de la vigencia. El plan de trabajo para asignar responsables y fechas está en el Anexo A.'))
    c.push(hojaRuta(a.cronograma), espacio(200))
  }

  // ---- Espacios, riesgos por espacio y repositorios (si se registraron) ----
  const hayInspeccion = a.espacios.some(e => e.riesgo.nivel)
  if (a.espacios.length) {
    c.push(sec('Espacios y estado de conservación'))
    if (a.espacios.some(e => e.estado)) c.push(P('El estado de cada espacio se estimó por observación directa durante la inspección (proporción en buen, regular y mal estado).'))
    c.push(tabla(['Espacio', 'Dependencias', 'Estado B / R / M (%)', 'Riesgo'],
      a.espacios.map(e => [`${e.nombre}${e.tipo ? `\n${e.tipo}` : ''}`, e.dependencias.join(', ') || '—',
        e.estado ? `${fmt(e.estado.bueno)} / ${fmt(e.estado.regular)} / ${fmt(e.estado.malo)}` : '—', nivelCelda(e.riesgo.nivel)]),
      [30, 34, 18, 18]))
    if (hayInspeccion) {
      c.push(H2('Factores de riesgo por espacio inspeccionado'))
      c.push(tabla(['Espacio', 'Nivel', 'Factores principales'],
        a.espacios.filter(e => e.riesgo.nivel).map(e => [e.nombre, nivelCelda(e.riesgo.nivel), e.riesgo.factores.slice(0, 5).map(f => f.factor).join('\n') || 'Sin factores registrados']),
        [26, 16, 58]))
    }
  }
  if (a.repositorios.length) {
    c.push(sec('Documentos electrónicos a preservar'))
    c.push(tabla(['Sistema o repositorio', 'Contenido', 'Copia de seguridad', 'Riesgo'],
      a.repositorios.map(r => [`${r.nombre}${r.responsable ? `\nResponsable: ${r.responsable}` : ''}`, r.contenido || '—', r.copia || '—', nivelCelda(r.riesgo.nivel)]),
      [30, 34, 18, 18]))
  }

  // ---- Verificaciones y nota metodológica ----
  c.push(sec('Información pendiente de verificar'))
  c.push(P(redaccion.verificacion))
  if (a.verificaciones.length) c.push(tabla(['Pregunta', 'Dónde', 'Qué verificar'], a.verificaciones.map(v => [v.pregunta, v.donde, v.texto]), [12, 25, 63]))

  c.push(sec('Nota metodológica'))
  c.push(P(redaccion.metodologia))
  c.push(P(`Avance del cuestionario: ${av.institucional.pct} % (${av.institucional.respondidas} de ${av.institucional.total} preguntas aplicables` +
    (av.institucional.precargadas ? `; ${av.institucional.precargadas} respuestas precargadas aún sin confirmar` : '') + ')' +
    (a.espacios.length ? `; ${av.espacios.registrados} espacio(s) registrado(s)` : '') +
    (a.repositorios.length ? `; ${av.sistemas.repositorios} repositorio(s) inventariado(s)` : '') + '.'))
  const resp = estado.respondientes || []
  if (resp.length) c.push(P('Respondió: ' + resp.map(r => `${r.nombre}${r.cargo ? ', ' + r.cargo : ''} (${r.respuestas} respuesta${r.respuestas === 1 ? '' : 's'})`).join('; ') + '.'))

  // ---- Anexo A: plan de trabajo ----
  c.push(salto(), H1('Anexo A. Plan de trabajo'))
  c.push(P('Para asignar responsable y fecha a cada acción en la sesión del Comité.'))
  c.push(tabla(['ID', 'Acción', 'Prioridad', 'Costo', 'Responsable', 'Fecha'],
    a.hallazgos.map(h => [h.id, h.accion, { texto: h.prioridad, fill: COLOR_NIVEL[h.prioridad], align: AlignmentType.CENTER }, COSTO[h.costo]?.t || '', '', '']),
    [7, 45, 11, 11, 15, 11]))

  // ---- Anexo B: respuestas ----
  c.push(salto(), H1('Anexo B. Respuestas del cuestionario'))
  for (const b of [...INSTITUCIONAL, ...SISTEMAS]) {
    c.push(H2(b.titulo))
    c.push(tabla(['N.º', 'Pregunta', 'Respuesta', 'Observación'],
      b.preguntas.map(p => { const r = estado.institucional[p.id]; return [String(p.n || p.id), p.texto, (aplica(p, estado.institucional) ? textoRespuesta(p, r) : 'No aplica'), [r?.s, r?.o].filter(Boolean).join(' · ') || '—'] }),
      [7, 53, 17, 23]))
  }

  // ---- Anexo C: registro fotográfico ----
  const conFotos = a.espacios.filter(e => fotos[e.id]?.length)
  if (conFotos.length) {
    c.push(salto(), H1('Anexo C. Registro fotográfico'))
    for (const e of conFotos) {
      c.push(H2(e.nombre))
      for (const f of fotos[e.id]) {
        const ancho = 420
        const alto = f.ancho && f.alto ? Math.round(ancho * f.alto / f.ancho) : 315
        try {
          c.push(new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 160 }, children: [
            new ImageRun({ type: f.mime === 'image/png' ? 'png' : 'jpg', data: Buffer.from(f.datos, 'base64'), transformation: { width: ancho, height: Math.min(alto, 520) } })] }))
        } catch { /* imagen corrupta: se omite */ }
      }
    }
  }

  const pie = new Footer({ children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [
    R(`${entidad} · Diagnóstico preliminar del SIC · Página `, { size: 15, color: '9CA3AF' }),
    new TextRun({ children: [PageNumber.CURRENT], size: 15, color: '9CA3AF' })] })] })
  const doc = new Document({
    creator: 'SIPAD', title: 'Diagnóstico preliminar del SIC',
    styles: { default: { document: { run: { font: 'Calibri', size: 20 } } } },
    sections: [{
      properties: { titlePage: true, page: { size: { width: 12240, height: 15840 }, margin: { top: 1134, bottom: 1134, left: 1134, right: 1134 } } },
      headers: {
        first: new Header({ children: [new Paragraph({ children: [] })] }),
        default: new Header({ children: [new Paragraph({ alignment: AlignmentType.RIGHT, children: [R('SIPAD · Diagnóstico preliminar del SIC', { size: 15, color: '9CA3AF' })] })] })
      },
      footers: { default: pie, first: new Footer({ children: [new Paragraph({ children: [] })] }) },
      children: c
    }]
  })
  return Packer.toBuffer(doc)
}

export { PRIORIDADES }
