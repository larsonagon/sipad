// ======================================================
// SIPAD — Diagnóstico preliminar del SIC: informe en Excel
// Mismo contenido del informe Word, en hojas para filtrar,
// ordenar y asignar responsables. Fuente: Century Gothic.
// ======================================================

import ExcelJS from 'exceljs'
import { INSTITUCIONAL, SISTEMAS, aplica } from './sic.formulario.js'
import { PRIORIDADES, PLAZOS, COSTOS } from './sic.motor.js'
import { textoRespuesta, FUENTE } from './sic.informe.js'

const AZUL = 'FF0D3F77'
const AZUL_CLARO = 'FFEEF3FA'
const PRIO = { 'crítica': 'FFF8D7DA', 'alta': 'FFFDE7C8', 'media': 'FFFFF6CC', 'baja': 'FFE2F0D9' }
const NIVEL = { 'crítico': 'FFF8D7DA', 'bajo': 'FFFDE7C8', 'medio': 'FFFFF6CC', 'adecuado': 'FFE2F0D9' }
const RIES = { extremo: 'FFF8D7DA', alto: 'FFFDE7C8', moderado: 'FFFFF6CC', bajo: 'FFE2F0D9' }
const ESTADOS = ['Pendiente', 'En curso', 'Cumplida', 'Aplazada']
const may = (t) => (t ? t[0].toUpperCase() + t.slice(1) : '')
const borde = { style: 'thin', color: { argb: 'FFD9DEE5' } }
const BORDES = { top: borde, bottom: borde, left: borde, right: borde }
const relleno = (argb) => ({ type: 'pattern', pattern: 'solid', fgColor: { argb } })

function encabezado(ws, titulo, subtitulo, ncols) {
  ws.mergeCells(1, 1, 1, ncols)
  const t = ws.getCell(1, 1)
  t.value = titulo
  t.font = { name: FUENTE, size: 14, bold: true, color: { argb: 'FFFFFFFF' } }
  t.fill = relleno(AZUL)
  t.alignment = { vertical: 'middle', indent: 1 }
  ws.getRow(1).height = 28
  ws.mergeCells(2, 1, 2, ncols)
  const s = ws.getCell(2, 1)
  s.value = subtitulo
  s.font = { name: FUENTE, size: 9, italic: true, color: { argb: 'FF6B7280' } }
  s.alignment = { vertical: 'middle', indent: 1 }
  ws.getRow(2).height = 18
}

// Hoja tabular: columnas [{ t, w, key?, center? }], filas = arrays
function hojaTabla(wb, nombre, titulo, subtitulo, cols, filas, { colorFila, validaciones } = {}) {
  const ws = wb.addWorksheet(nombre, { views: [{ state: 'frozen', ySplit: 4 }], pageSetup: { orientation: 'landscape', fitToPage: true, fitToWidth: 1, fitToHeight: 0, paperSize: 1 } })
  encabezado(ws, titulo, subtitulo, cols.length)
  ws.columns = cols.map(c => ({ width: c.w }))
  const h = ws.getRow(4)
  cols.forEach((c, i) => {
    const cell = h.getCell(i + 1)
    cell.value = c.t
    cell.font = { name: FUENTE, size: 10, bold: true, color: { argb: 'FFFFFFFF' } }
    cell.fill = relleno(AZUL)
    cell.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true }
    cell.border = BORDES
  })
  h.height = 30
  filas.forEach((f, k) => {
    const row = ws.getRow(5 + k)
    f.forEach((v, i) => {
      const cell = row.getCell(i + 1)
      cell.value = v ?? ''
      cell.font = { name: FUENTE, size: 9 }
      cell.alignment = { vertical: 'top', wrapText: true, horizontal: cols[i].center ? 'center' : 'left' }
      cell.border = BORDES
      if (k % 2 === 1) cell.fill = relleno('FFF8FAFC')
    })
    if (colorFila) colorFila(row, f, k)
  })
  if (filas.length) ws.autoFilter = { from: { row: 4, column: 1 }, to: { row: 4 + filas.length, column: cols.length } }
  if (validaciones) validaciones(ws, filas.length)
  ws.headerFooter.oddFooter = `&"${FUENTE},Regular"&8${nombre} · Página &P de &N`
  return ws
}

const pintar = (cell, argb, bold = true) => { cell.fill = relleno(argb); cell.font = { name: FUENTE, size: 9, bold } }

export async function generarExcelSIC({ analisis: a, estado, redaccion, resumen, entidad = 'la entidad', fecha }) {
  const wb = new ExcelJS.Workbook()
  wb.creator = 'SIPAD'
  wb.created = new Date()
  const hoy = fecha || new Date().toLocaleDateString('es-CO')
  const sub = `${entidad} · Diagnóstico preliminar del SIC · Generado el ${hoy}`
  const hp = a.resumen.hallazgos_por_prioridad
  const pc = a.resumen.acciones_por_costo
  const riesgos = a.riesgos || []
  const conDatos = a.indicadores.filter(i => i.valor !== null)
  const av = a.avance

  // ---- 1. Resumen ----
  const ws = wb.addWorksheet('Resumen', { pageSetup: { orientation: 'portrait', fitToPage: true, fitToWidth: 1, fitToHeight: 0, paperSize: 1 } })
  ws.columns = [{ width: 42 }, { width: 90 }]
  encabezado(ws, 'Diagnóstico preliminar del Sistema Integrado de Conservación', sub, 2)
  let r = 4
  const seccion = (t) => {
    ws.mergeCells(r, 1, r, 2)
    const c = ws.getCell(r, 1)
    c.value = t
    c.font = { name: FUENTE, size: 11, bold: true, color: { argb: AZUL } }
    c.fill = relleno(AZUL_CLARO)
    c.border = { bottom: { style: 'medium', color: { argb: AZUL } } }
    ws.getRow(r).height = 20
    r++
  }
  const par = (etq, val, o = {}) => {
    const a1 = ws.getCell(r, 1), b1 = ws.getCell(r, 2)
    a1.value = etq; b1.value = val ?? '—'
    a1.font = { name: FUENTE, size: 10, bold: true }
    b1.font = { name: FUENTE, size: 10, italic: !!o.italic, bold: !!o.bold, color: o.color ? { argb: o.color } : undefined }
    a1.alignment = { vertical: 'top', wrapText: true }
    b1.alignment = { vertical: 'top', wrapText: true, horizontal: o.left === false ? 'center' : 'left' }
    a1.border = BORDES; b1.border = BORDES
    if (o.fill) b1.fill = relleno(o.fill)
    const largo = String(val ?? '').length
    if (largo > 95) ws.getRow(r).height = Math.min(400, 14 * Math.ceil(largo / 95))
    r++
  }
  const texto = (t) => {
    ws.mergeCells(r, 1, r, 2)
    const c = ws.getCell(r, 1)
    c.value = t
    c.font = { name: FUENTE, size: 10 }
    c.alignment = { vertical: 'top', wrapText: true }
    ws.getRow(r).height = Math.min(409, Math.max(16, 14 * Math.ceil(String(t).length / 125)))
    r++
  }

  seccion('Datos generales')
  par('Entidad', entidad)
  par('Fecha de generación', hoy)
  const resp = estado.respondientes || []
  par('Respondió', resp.length ? resp.map(x => `${x.nombre}${x.cargo ? ', ' + x.cargo : ''} (${x.respuestas} respuesta${x.respuestas === 1 ? '' : 's'})`).join('; ') : '—')
  par('Avance del cuestionario', `${av.institucional.pct} % (${av.institucional.respondidas} de ${av.institucional.total} preguntas aplicables)` +
    (av.institucional.precargadas ? `; ${av.institucional.precargadas} precargadas sin confirmar` : ''))
  r++

  seccion('Cifras clave')
  par('Hallazgos identificados', a.hallazgos.length)
  PRIORIDADES.forEach(p => par(`   Prioridad ${p}`, hp[p] || 0, { fill: PRIO[p] }))
  par('Acciones sin costo', pc.sin_costo || 0)
  par('Acciones de costo bajo', pc.bajo || 0)
  par('Acciones que requieren contratación', pc.contratacion || 0)
  par('Componentes en nivel crítico', `${conDatos.filter(i => i.nivel === 'crítico').length} de ${conDatos.length}`)
  par('Riesgos en nivel extremo', `${riesgos.filter(x => x.nivel === 'extremo').length} de ${riesgos.filter(x => x.valor !== null).length}`)
  r++

  const abiertas = [['P-060', 'Los tres problemas más graves'], ['P-140', 'Lo que impide mejorar la conservación'], ['P-009', 'Problemas de los espacios de almacenamiento']]
    .map(([id, et]) => [et, estado.institucional[id]?.v]).filter(([, v]) => typeof v === 'string' && v.trim())
  if (abiertas.length) {
    seccion('Lo que señala quien responde')
    abiertas.forEach(([et, v]) => par(et, `«${v.trim()}»`, { italic: true }))
    r++
  }

  seccion('Resumen ejecutivo')
  for (const p of String(resumen?.texto || redaccion.sintesis).split(/\n\s*\n/)) if (p.trim()) texto(p.trim())
  r++
  seccion('Nota metodológica')
  texto(redaccion.metodologia)
  texto('Cada indicador de componente es el promedio de sus respuestas (Sí = 100, Parcial = 50, No = 0); "No sabe" no cuenta. Riesgos: probabilidad (1–5) × impacto (1–5); extremo 15–25, alto 10–14, moderado 5–9, bajo 1–4.')
  r++
  seccion('Contenido del libro')
  ;[['Componentes', 'Indicador 0–100 por componente del SIC'], ['Riesgos', 'Matriz de riesgos de conservación'],
    ['Plan de trabajo', 'Hallazgos, acciones, plazo y costo; columnas para responsable, fecha y estado'],
    ['Verificar', 'Información pendiente de verificar en campo'], ['Respuestas', 'Respuestas del cuestionario']]
    .forEach(([h, d]) => par(h, d))
  ws.headerFooter.oddFooter = `&"${FUENTE},Regular"&8Resumen · Página &P de &N`

  // ---- 2. Componentes ----
  hojaTabla(wb, 'Componentes', 'Estado por componente del SIC', sub,
    [{ t: 'Código', w: 10, center: true }, { t: 'Componente', w: 52 }, { t: 'Indicador (0–100)', w: 16, center: true }, { t: 'Nivel', w: 14, center: true }, { t: 'Respuestas consideradas', w: 16, center: true }],
    a.indicadores.map(i => [i.componente, i.nombre, i.valor ?? '—', may(i.nivel), i.respuestas ?? 0]),
    { colorFila: (row, f, k) => { const n = a.indicadores[k].nivel; if (NIVEL[n]) pintar(row.getCell(4), NIVEL[n]) } })

  // ---- 3. Riesgos ----
  if (riesgos.length) hojaTabla(wb, 'Riesgos', 'Matriz de riesgos de conservación', sub,
    [{ t: 'ID', w: 8, center: true }, { t: 'Riesgo', w: 40 }, { t: 'Tratamiento principal', w: 60 }, { t: 'Probabilidad', w: 13, center: true }, { t: 'Impacto', w: 11, center: true }, { t: 'P × I', w: 9, center: true }, { t: 'Nivel', w: 13, center: true }],
    riesgos.map(x => [x.id, x.riesgo, x.tratamiento, x.probabilidad ?? '—', x.impacto ?? '—', x.valor ?? '—', may(x.nivel)]),
    { colorFila: (row, f, k) => { const n = riesgos[k].nivel; if (RIES[n]) pintar(row.getCell(7), RIES[n]) } })

  // ---- 4. Plan de trabajo (hallazgos y acciones) ----
  const H = a.hallazgos
  hojaTabla(wb, 'Plan de trabajo', 'Hallazgos, acciones y plan de trabajo', sub,
    [{ t: 'ID', w: 8, center: true }, { t: 'Prioridad', w: 11, center: true }, { t: 'Plazo', w: 17 }, { t: 'Componente', w: 26 },
      { t: 'Hallazgo', w: 48 }, { t: 'Acción', w: 52 }, { t: 'Costo', w: 22 }, { t: 'Evidencia (preguntas)', w: 18 },
      { t: 'Responsable', w: 20 }, { t: 'Fecha', w: 13, center: true }, { t: 'Estado', w: 13, center: true }, { t: 'Observaciones', w: 28 }],
    H.map(h => [h.id, may(h.prioridad), PLAZOS[h.prioridad] || '', h.programa || h.componente || '', h.hallazgo, h.accion,
      COSTOS[h.costo] || '', (h.evidencia || []).join(', '), '', null, 'Pendiente', '']),
    {
      colorFila: (row, f, k) => { const p = H[k].prioridad; if (PRIO[p]) pintar(row.getCell(2), PRIO[p]); row.getCell(10).numFmt = 'dd/mm/yyyy' },
      validaciones: (ws, n) => {
        for (let i = 0; i < n; i++) {
          ws.getCell(5 + i, 11).dataValidation = { type: 'list', allowBlank: true, formulae: [`"${ESTADOS.join(',')}"`] }
          ws.getCell(5 + i, 10).dataValidation = { type: 'date', operator: 'greaterThan', allowBlank: true, formulae: [new Date(2020, 0, 1)], showErrorMessage: true, error: 'Escriba una fecha válida (dd/mm/aaaa).' }
        }
      }
    })

  // ---- 5. Espacios y repositorios (si existen) ----
  if (a.espacios.length) hojaTabla(wb, 'Espacios', 'Espacios y estado de conservación', sub,
    [{ t: 'Espacio', w: 30 }, { t: 'Tipo', w: 18 }, { t: 'Dependencias', w: 40 }, { t: 'Bueno %', w: 10, center: true }, { t: 'Regular %', w: 10, center: true }, { t: 'Malo %', w: 10, center: true }, { t: 'Riesgo', w: 12, center: true }, { t: 'Factores principales', w: 50 }],
    a.espacios.map(e => [e.nombre, e.tipo || '', e.dependencias.join(', '), e.estado?.bueno ?? '', e.estado?.regular ?? '', e.estado?.malo ?? '',
      may(e.riesgo.nivel || ''), (e.riesgo.factores || []).slice(0, 5).map(f => f.factor).join('\n')]),
    { colorFila: (row, f, k) => { const n = a.espacios[k].riesgo.nivel; if (PRIO[n]) pintar(row.getCell(7), PRIO[n]) } })
  if (a.repositorios.length) hojaTabla(wb, 'Repositorios', 'Documentos electrónicos a preservar', sub,
    [{ t: 'Sistema o repositorio', w: 32 }, { t: 'Responsable', w: 22 }, { t: 'Contenido', w: 44 }, { t: 'Copia de seguridad', w: 24 }, { t: 'Riesgo', w: 12, center: true }],
    a.repositorios.map(x => [x.nombre, x.responsable || '', x.contenido || '', x.copia || '', may(x.riesgo.nivel || '')]),
    { colorFila: (row, f, k) => { const n = a.repositorios[k].riesgo.nivel; if (PRIO[n]) pintar(row.getCell(5), PRIO[n]) } })

  // ---- 6. Verificar ----
  hojaTabla(wb, 'Verificar', 'Información pendiente de verificar', sub,
    [{ t: 'Pregunta', w: 12, center: true }, { t: 'Dónde', w: 34 }, { t: 'Qué verificar', w: 80 }, { t: 'Verificado', w: 13, center: true }, { t: 'Resultado', w: 40 }],
    a.verificaciones.map(v => [v.pregunta, v.donde, v.texto, 'No', '']),
    { validaciones: (ws, n) => { for (let i = 0; i < n; i++) ws.getCell(5 + i, 4).dataValidation = { type: 'list', allowBlank: true, formulae: ['"Sí,No"'] } } })

  // ---- 7. Respuestas ----
  const filas = []
  for (const b of [...INSTITUCIONAL, ...SISTEMAS]) for (const p of b.preguntas) {
    const x = estado.institucional[p.id]
    filas.push([b.titulo, String(p.n || p.id), p.texto, aplica(p, estado.institucional) ? textoRespuesta(p, x) : 'No aplica', [x?.s, x?.o].filter(Boolean).join(' · ')])
  }
  hojaTabla(wb, 'Respuestas', 'Respuestas del cuestionario', sub,
    [{ t: 'Bloque', w: 30 }, { t: 'N.º', w: 7, center: true }, { t: 'Pregunta', w: 70 }, { t: 'Respuesta', w: 24 }, { t: 'Observación', w: 40 }],
    filas)

  return Buffer.from(await wb.xlsx.writeBuffer())
}
