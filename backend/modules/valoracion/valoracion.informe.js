// backend/modules/valoracion/valoracion.informe.js
// =====================================================================
// Genera el INFORME TÉCNICO DE VALORACIÓN DOCUMENTAL (Word) a partir
// de una ficha ya valorada (+ la evidencia/casos del levantamiento).
// Estructura alineada con el modelo (identificación → valores → ciclo
// vital → hecho de cierre → tiempos → disposición y su procedimiento →
// validación por casos → riesgos → ficha TRD → conclusiones).
// =====================================================================
import {
  Document, Packer, Paragraph, HeadingLevel, TextRun, AlignmentType,
  Table, TableRow, TableCell, WidthType, ShadingType, BorderStyle
} from 'docx'

const NIVEL = { alto:'Alto', medio:'Medio', bajo:'Bajo', selectivo:'Selectivo', na:'No aplica', '':'—' }
const DISP = {
  CT:'Conservación Total (CT)', E:'Eliminación (E)',
  S:'Selección (S)', M:'Reproducción por medio tecnológico (M)'
}
const NOMBRE_PRIMARIO = {
  administrativo:'Administrativo', legal:'Legal / probatorio', juridico:'Jurídico',
  contable:'Contable', fiscal:'Fiscal', tecnico:'Técnico'
}
const NOMBRE_SECUNDARIO = {
  historico:'Histórico', cientifico:'Científico / investigativo',
  cultural:'Cultural', patrimonial:'Patrimonial / testimonial'
}

const P = (text, opts = {}) => new Paragraph({ spacing:{ after:120 }, ...opts,
  children: [new TextRun({ text: text ?? '', size: 22, ...(opts.run||{}) })] })

const H1 = (text) => new Paragraph({ heading: HeadingLevel.HEADING_1, spacing:{ before:240, after:100 },
  children:[new TextRun({ text, bold:true, size:26, color:'0d3f77' })] })

function tablaValores(titulo, valores, nombres) {
  const rows = [
    new TableRow({ tableHeader:true, children:['Valor','Nivel','Sustento'].map((h,i)=>new TableCell({
      width:{ size:[2600,1400,5600][i], type:WidthType.DXA },
      shading:{ type:ShadingType.CLEAR, fill:'EEF2FF' },
      children:[new Paragraph({ children:[new TextRun({ text:h, bold:true, size:20 })] })]
    })) })
  ]
  for (const v of (valores||[])) {
    rows.push(new TableRow({ children:[
      nombres[v.clave]||v.clave, NIVEL[v.nivel]||v.nivel||'—', v.sustento||'—'
    ].map((c,i)=>new TableCell({
      width:{ size:[2600,1400,5600][i], type:WidthType.DXA },
      children:[new Paragraph({ children:[new TextRun({ text:String(c), size:20 })] })]
    })) }))
  }
  return new Table({ columnWidths:[2600,1400,5600], width:{ size:9600, type:WidthType.DXA }, rows })
}

function procedimientoDisposicion(disp) {
  if (disp === 'E') return [
    P('El procedimiento de eliminación se sujeta al Acuerdo AGN 003 de 2015 y al Acuerdo AGN 001 de 2024:'),
    P('1. Verificar que los documentos cumplieron el tiempo de retención según la TRD/TVD y que no existan actuaciones pendientes.'),
    P('2. Elaborar el inventario de los documentos a eliminar.'),
    P('3. Aprobación por el Comité Institucional de Gestión y Desempeño, consignada en acta.'),
    P('4. Publicar el inventario en la página web de la entidad durante sesenta (60) días hábiles, para observaciones de la ciudadanía.'),
    P('5. Atender el derecho de oposición de terceros y resolver las observaciones.'),
    P('6. Destrucción por método que garantice la irrecuperabilidad, con acta de eliminación.')
  ]
  if (disp === 'S') return [
    P('El procedimiento de selección se aplica así:'),
    P('1. Determinar el universo susceptible de selección mediante inventario cuantitativo.'),
    P('2. Apartar los expedientes con valor excepcional (conservación permanente por criterio cualitativo).'),
    P('3. Estratificar el universo (por período, tipo, servicio, situación).'),
    P('4. Aplicar el método de muestreo definido sobre el universo restante.'),
    P('5. Integrar la muestra con los expedientes excepcionales; el resto se elimina conforme al procedimiento de eliminación.')
  ]
  if (disp === 'CT') return [
    P('Cumplidos los tiempos en Archivo de Gestión y Central, se realiza transferencia secundaria al Archivo Histórico y se conserva de forma permanente. Puede reproducirse por digitalización para consulta y preservación, conservando el original.')
  ]
  if (disp === 'M') return [
    P('Se aplica plan de reproducción por medios tecnológicos (digitalización/microfilmación) priorizando expedientes antiguos y deteriorados. La reproducción no autoriza por sí misma la eliminación del original (Acuerdo AGN 001 de 2024).')
  ]
  return [P('Disposición final por determinar.')]
}

export async function generarInformeValoracion(ficha = {}, diligenciamiento = null) {

  const f = ficha
  const nombreSerie = [f.serie, f.subserie].filter(Boolean).join(' – ') || 'Serie/Subserie'
  const totalRet = (Number(f.tiempo_gestion)||0) + (Number(f.tiempo_central)||0)
  const reglas = Array.isArray(f.reglas_excepcion) ? f.reglas_excepcion : []
  const casos = diligenciamiento?.casos || []

  const c = []

  // Portada
  c.push(new Paragraph({ alignment:AlignmentType.CENTER, spacing:{ after:80 },
    children:[new TextRun({ text:'INFORME TÉCNICO DE VALORACIÓN DOCUMENTAL', bold:true, size:32, color:'0d3f77' })] }))
  c.push(new Paragraph({ alignment:AlignmentType.CENTER, spacing:{ after:60 },
    children:[new TextRun({ text:nombreSerie, bold:true, size:26 })] }))
  c.push(new Paragraph({ alignment:AlignmentType.CENTER, spacing:{ after:240 },
    children:[new TextRun({ text:'Documento técnico para el diseño de las Tablas de Retención Documental — TRD', italics:true, size:20, color:'6b7280' })] }))

  // 1. Introducción
  c.push(H1('1. Introducción'))
  c.push(P(`El presente informe documenta la valoración de la ${f.subserie?('subserie '+f.subserie):'agrupación documental'}${f.serie?(' de la serie '+f.serie):''}, con el fin de determinar sus valores primarios y secundarios, el ciclo vital, el hecho de cierre, los tiempos de retención y la disposición final, conforme a la normatividad archivística colombiana.`))

  // 2. Objeto
  c.push(H1('2. Objeto'))
  c.push(P('Determinar, mediante valoración documental, los valores, tiempos de retención y disposición final de la subserie, con una propuesta técnicamente sustentada para su incorporación en las Tablas de Retención Documental.'))

  // 3. Metodología
  c.push(H1('3. Metodología de valoración'))
  c.push(P('La valoración se apoyó en el levantamiento funcional (evidencia operativa aportada por los funcionarios), el análisis de los valores primarios y secundarios, el contraste normativo y la validación mediante casos prácticos (expedientes reales anonimizados).'))

  // 4. Identificación y caracterización
  c.push(H1('4. Identificación y caracterización'))
  c.push(P(`Serie: ${f.serie||'—'}`, { run:{ bold:false } }))
  c.push(P(`Subserie: ${f.subserie||'—'}`))
  c.push(P(`Unidad documental: ${f.unidad_documental||'—'}`))
  c.push(P(`Función / productor: ${f.funcion||'—'}`))

  // 5. Tipologías
  c.push(H1('5. Tipologías documentales'))
  c.push(P(f.tipologias || 'Por determinar contra muestra física representativa.'))

  // 6. Valores primarios
  c.push(H1('6. Análisis de los valores primarios'))
  c.push(tablaValores('primarios', f.valores_primarios, NOMBRE_PRIMARIO))

  // 7. Valores secundarios
  c.push(H1('7. Análisis de los valores secundarios'))
  c.push(tablaValores('secundarios', f.valores_secundarios, NOMBRE_SECUNDARIO))

  // 8. Consulta
  c.push(H1('8. Frecuencia y usuarios de consulta'))
  c.push(P(f.frecuencia_consulta ? `Frecuencia de consulta: ${f.frecuencia_consulta}.` : 'Frecuencia de consulta por determinar.'))

  // 9. Ciclo vital y hecho de cierre
  c.push(H1('9. Ciclo vital y hecho de cierre'))
  c.push(P(`Hecho de cierre: ${f.hecho_cierre || 'por determinar'}. Los tiempos de retención se cuentan a partir de este hecho, no del simple transcurso del tiempo.`))

  // 10. Reglas de excepción
  c.push(H1('10. Reglas especiales / de excepción'))
  if (reglas.length) {
    c.push(P('No podrá ejecutarse disposición final mientras se presenten:'))
    reglas.forEach(r => c.push(P('•  ' + r)))
  } else {
    c.push(P('No se identificaron reglas de excepción específicas.'))
  }

  // 11. Tiempos de retención
  c.push(H1('11. Propuesta de tiempos de retención'))
  c.push(P(`Archivo de Gestión: ${f.tiempo_gestion ?? '—'} año(s). Archivo Central: ${f.tiempo_central ?? '—'} año(s). Total ordinario: ${totalRet} año(s). Estos tiempos son retenciones ordinarias, no una autorización automática de eliminación; prevalecen las reglas de excepción.`))

  // 12. Disposición final + procedimiento
  c.push(H1('12. Disposición final'))
  c.push(P(`Disposición final propuesta: ${DISP[f.disposicion_final] || 'por determinar'}.`, { run:{ bold:true } }))
  if (f.disposicion_justificacion) c.push(P(f.disposicion_justificacion))
  if (f.disposicion_final === 'S') {
    c.push(P(`Selección propuesta: ${f.muestreo_porcentaje ?? '—'}% del universo susceptible, mediante ${f.muestreo_metodo || 'muestreo por definir'}, sujeta a validación cuantitativa.`))
    if (f.criterios_conservacion) c.push(P(`Criterios de conservación permanente: ${f.criterios_conservacion}`))
  }

  // 13. Procedimiento de la disposición
  c.push(H1('13. Procedimiento de aplicación de la disposición final'))
  procedimientoDisposicion(f.disposicion_final).forEach(p => c.push(p))

  // 14. Validación mediante casos
  c.push(H1('14. Validación mediante casos prácticos'))
  if (casos.length) {
    casos.forEach(caso => {
      c.push(P(`Caso ${caso.etiqueta||''} — ${caso.titulo||caso.tipo_caso||''}`, { run:{ bold:true } }))
      const docs = (caso.documentos||[]).map(d => d.nombre_documento).filter(Boolean)
      c.push(P(docs.length ? ('Documentos: ' + docs.join(' → ')) : 'Sin documentos registrados.'))
    })
  } else {
    c.push(P('No se registraron casos prácticos en el levantamiento. Se recomienda validar contra al menos tres expedientes reales.'))
  }

  // 15. Riesgos
  c.push(H1('15. Riesgos identificados'))
  c.push(P(f.riesgos || 'Sin riesgos registrados.'))

  // 16. Marco normativo
  c.push(H1('16. Marco normativo'))
  c.push(P(f.fundamento_normativo || 'Ley 594 de 2000; Decreto 1080 de 2015; Acuerdo AGN 004 de 2019; Acuerdo AGN 001 de 2024.'))

  // 17. Ficha TRD
  c.push(H1('17. Propuesta definitiva de ficha TRD'))
  const fichaRows = [
    ['Serie', f.serie||'—'], ['Subserie', f.subserie||'—'], ['Unidad documental', f.unidad_documental||'—'],
    ['Archivo de Gestión', `${f.tiempo_gestion ?? '—'} año(s)`], ['Archivo Central', `${f.tiempo_central ?? '—'} año(s)`],
    ['Disposición final', DISP[f.disposicion_final]||'—'],
    ['Muestra', f.disposicion_final==='S' ? `${f.muestreo_porcentaje ?? '—'}% (${f.muestreo_metodo||'—'})` : 'No aplica']
  ]
  c.push(new Table({ columnWidths:[3200,6400], width:{ size:9600, type:WidthType.DXA },
    rows: fichaRows.map(([k,v]) => new TableRow({ children:[
      new TableCell({ width:{ size:3200, type:WidthType.DXA }, shading:{ type:ShadingType.CLEAR, fill:'F3F4F6' },
        children:[new Paragraph({ children:[new TextRun({ text:k, bold:true, size:20 })] })] }),
      new TableCell({ width:{ size:6400, type:WidthType.DXA },
        children:[new Paragraph({ children:[new TextRun({ text:String(v), size:20 })] })] })
    ] })) }))

  // 18. Concepto técnico final
  c.push(H1('18. Concepto técnico final'))
  c.push(P(`Con fundamento en la valoración documental realizada, se considera técnicamente viable proponer para la subserie ${nombreSerie} una retención de ${f.tiempo_gestion ?? '—'} año(s) en Archivo de Gestión y ${f.tiempo_central ?? '—'} año(s) en Archivo Central, con disposición final de ${DISP[f.disposicion_final]||'por determinar'}. La propuesta queda condicionada a la verificación de las reglas de excepción y a la validación cuantitativa del universo documental.`))

  c.push(new Paragraph({ spacing:{ before:240 },
    children:[new TextRun({ text:`Documento generado por SIPAD a partir de la ficha de valoración (estado: ${f.estado||'borrador'}).`, italics:true, size:18, color:'6b7280' })] }))

  const doc = new Document({ sections:[{ properties:{ page:{ size:{ width:12240, height:15840 }, margin:{ top:1000, bottom:1000, left:1200, right:1200 } } }, children:c }] })
  return await Packer.toBuffer(doc)
}
