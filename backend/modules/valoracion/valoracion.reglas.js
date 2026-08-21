// backend/modules/valoracion/valoracion.reglas.js
// =====================================================================
// Motor de reglas: convierte la EVIDENCIA de un levantamiento en un
// BORRADOR de ficha de valoración (valores, tiempos, hecho de cierre,
// reglas de excepción, disposición), cada cosa con su justificación y
// fundamento normativo. El archivista después revisa y ajusta.
//
// Es plantilla-agnóstico: no depende de códigos fijos. Lee el texto de
// las respuestas y los documentos de los casos reales.
//
// Se conecta con el motor de TRD-AI (sugerirRetencionContextual) para la
// propuesta de tiempos y disposición.
// =====================================================================
import { sugerirRetencionContextual } from '../trd-ai/trd-ai.engine.js'

const NORMA = 'Acuerdo AGN 004 de 2019; Acuerdo AGN 001 de 2024; Ley 594 de 2000'

// Mapea la disposición del motor TRD-AI a los códigos CT/E/S/M
function mapDisposicion(d) {
  if (d === 'conservacion_total') return 'CT'
  if (d === 'seleccion')          return 'S'
  if (d === 'eliminacion')        return 'E'
  return null
}

const tiene = (txt, re) => re.test(txt || '')

export function generarBorradorDesdeEvidencia(plantilla, diligenciamiento) {

  // 1) Índice de respuestas por pregunta (código + enunciado + texto)
  const preguntas = []
  for (const sec of (plantilla?.secciones || [])) {
    for (const q of (sec.preguntas || [])) preguntas.push(q)
  }
  const respById = {}
  for (const r of (diligenciamiento?.respuestas || [])) respById[r.pregunta_id] = r.valor || ''

  const answers = preguntas.map(q => ({
    codigo: q.codigo, enunciado: (q.enunciado || '').toLowerCase(),
    rol: q.meta?.rol || null, valor: respById[q.id] || ''
  }))

  const allText = answers.map(a => a.valor).join(' \n ').toLowerCase()
  const byEnunciado = re => (answers.find(a => re.test(a.enunciado))?.valor || '')
  const byRol = rol => (answers.find(a => a.rol === rol)?.valor || '')
  // Prefiere el 'rol' (instrumento curado); si no hay, cae al texto del enunciado
  const pick = (rol, re) => byRol(rol) || byEnunciado(re)

  const notas = []  // trazabilidad de lo inferido

  // 2) Tipologías: unión de documentos de los casos reales (evidencia dura)
  const docs = []
  for (const c of (diligenciamiento?.casos || [])) {
    for (const d of (c.documentos || [])) if (d.nombre_documento) docs.push(d.nombre_documento.trim())
  }
  const tipologiasCasos = [...new Set(docs)]
  const tipologiasQ = pick('tipologias', /documentos.*(produce|recibe)/)
  const tipologias = tipologiasCasos.length
    ? tipologiasCasos.join(', ')
    : (tipologiasQ || '')
  if (tipologiasCasos.length) notas.push(`Tipologías tomadas de ${diligenciamiento.casos.length} caso(s) real(es).`)

  // 3) Señales (heurística sobre todo el texto)
  const reqJudicial = tiene(allText, /juez|juzgad|fiscal|polic|judicial|dijin/)
  const pendientes  = tiene(allText, /pendiente|investigaci|cautelar|disciplinar|en curso/)
  const derechos    = tiene(allText, /propiedad|tradici|derecho|sanci|registr|matr[ií]cula/)
  const contable    = tiene(allText, /pago|multa|recaud|comprobante|recurso econ/)
  const frecuente   = tiene(allText, /frecuen|semana|diari|varias veces|mensual|constante/)
  const excepcional = tiene(allText, /falsedad|adulter|hurto|excepcional|relevante|controvers/)
  const unicidadTxt = pick('unicidad', /desaparec.*plataforma|no.*runt|perder[íi]a/)
  const unicidad    = (unicidadTxt && !/nada|ninguno|no perder/i.test(unicidadTxt)) ||
                      tiene(allText, /no se recupera|no est[áa] en runt|[úu]nico|irremplaz/)
  const activo      = tiene(allText, /activ[oa]|vigente|matriculad/)
  const soporte     = tiene(allText, /f[íi]sico/) && tiene(allText, /digital|electr[óo]nic/)
                        ? 'ambos' : (tiene(allText, /f[íi]sico/) ? 'fisico' : 'digital')

  // 4) Valores primarios (nivel + sustento con la evidencia)
  const consultaTxt = pick('consulta', /qui[eé]n.*(consulta|solicita)|usuarios/)
  const valores_primarios = [
    { clave:'administrativo', nivel: frecuente ? 'alto' : 'medio',
      sustento: frecuente ? 'Consulta frecuente reportada' : 'Uso administrativo durante la vigencia' },
    { clave:'legal', nivel: reqJudicial ? 'alto' : 'medio',
      sustento: reqJudicial ? `Requerido por autoridad judicial/control. ${consultaTxt}`.trim() : 'Posible uso probatorio' },
    { clave:'juridico', nivel: derechos ? 'alto' : 'bajo',
      sustento: derechos ? 'Documenta derechos/obligaciones o situación registral' : '' },
    { clave:'contable', nivel: contable ? 'medio' : 'na',
      sustento: contable ? 'Registra pagos/recaudos' : '' },
    { clave:'fiscal', nivel: contable ? 'bajo' : 'na', sustento: '' },
    { clave:'tecnico', nivel: 'na', sustento: '' }
  ]

  // 5) Valores secundarios
  const valores_secundarios = [
    { clave:'historico', nivel: excepcional ? 'selectivo' : 'bajo',
      sustento: excepcional ? 'Existen expedientes con actuaciones excepcionales' : '' },
    { clave:'cientifico', nivel: 'bajo', sustento: '' },
    { clave:'cultural', nivel: 'bajo', sustento: '' },
    { clave:'patrimonial', nivel: unicidad ? 'medio' : 'bajo',
      sustento: unicidad ? 'Información no recuperable de otras fuentes (unicidad)' : '' }
  ]

  // 6) Hecho de cierre (matcher preciso: evita la pregunta del caso "ya terminado")
  const hecho_cierre = pick('hecho_cierre',
    /oficialmente terminado|cu[áa]ndo.*terminad|demuestra que.*qued[óo] terminad|est[áa].*terminado/) || ''
  if (hecho_cierre) notas.push('Hecho de cierre tomado de la respuesta del funcionario.')

  // 7) Reglas de excepción (banderas)
  const reglas_excepcion = []
  if (activo)      reglas_excepcion.push('Expediente activo')
  if (pendientes)  reglas_excepcion.push('Actuaciones pendientes')
  if (unicidad)    reglas_excepcion.push('Unicidad (no recuperable de otras fuentes)')
  if (!hecho_cierre || /no siempre|no se sabe|varias fuentes|desconoc/i.test(byEnunciado(/cancel|fecha/)))
    reglas_excepcion.push('Estado registral desconocido')

  // 8) Tiempos y disposición (motor TRD-AI alimentado con la evidencia)
  const ret = sugerirRetencionContextual({
    tipo_funcion:          'misional',
    nivel_riesgo:          (pendientes || unicidad) ? 'alto' : 'medio',
    impacto_juridico:      (reqJudicial || derechos) ? 'alto' : 'medio',
    funcion_permanente:    'no',
    requiere_conservacion: (excepcional || unicidad) ? 'si' : 'no',
    soporte_principal:     soporte === 'fisico' ? 'fisico' : 'digital',
    confianza_lexica:      0.6
  })

  let disposicion_final = mapDisposicion(ret.disposicion)
  // Regla dura de la norma: si no hay valores secundarios y los primarios
  // están vigentes con unicidad/legal alto → NO eliminar; sugerir Selección.
  if (disposicion_final === 'E' && (unicidad || reqJudicial)) {
    disposicion_final = 'S'
    notas.push('No se sugiere Eliminación por unicidad o valor legal alto (art. valoración).')
  }

  const esSeleccion = disposicion_final === 'S'

  // 9) Riesgos y fundamento
  const riesgos = [
    pendientes && 'Actuaciones pendientes que suspenden la disposición final',
    unicidad && 'Pérdida de información única no recuperable',
    !hecho_cierre && 'Hecho de cierre no verificable con claridad'
  ].filter(Boolean).join('. ')

  const disposicion_justificacion = [
    `Propuesta automática (${(ret.nivel_confianza*100).toFixed(0)}% conf.): ${ret.justificacion}.`,
    reqJudicial && 'Uso probatorio ante autoridades.',
    unicidad && 'Información única frente a RUNT/SIMIT.',
    excepcional && 'Existen expedientes de conservación permanente por criterio cualitativo.'
  ].filter(Boolean).join(' ')

  return {
    diligenciamiento_id: diligenciamiento.id,
    serie: '',
    subserie: diligenciamiento.titulo || '',
    tipologias,
    valores_primarios,
    valores_secundarios,
    frecuencia_consulta: pick('frecuencia', /frecuen/) || (frecuente ? 'Frecuente' : ''),
    hecho_cierre,
    reglas_excepcion,
    tiempo_gestion: ret.gestion,
    tiempo_central: ret.central,
    disposicion_final,
    disposicion_justificacion,
    muestreo_porcentaje: esSeleccion ? 10 : null,
    muestreo_metodo: esSeleccion ? 'estratificado sistemático + criterios cualitativos' : null,
    criterios_conservacion: excepcional
      ? 'Conservar permanentemente expedientes con falsedad, hurto, decisiones excepcionales o valor testimonial.'
      : '',
    riesgos,
    fundamento_normativo: NORMA,
    estado: 'borrador',
    origen: 'motor',
    _notas: notas
  }
}
