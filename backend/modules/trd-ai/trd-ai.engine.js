/**
 * Motor heurístico TRD-AI
 *
 * Clasificación archivística determinística
 * - Series
 * - Subseries
 * - Retención
 * - Detección por tipologías
 * V4 — Claude como capa 0 + fallback al motor heurístico original intacto
 */

// ===================================================
// MATRIZ BASE DE RETENCIÓNif (resSubseries.rows &&
// ===================================================

const MATRIZ_RETENCION = {

  misional: {
    alto:  { gestion: 5, central: 10, disposicion: 'CT' },
    medio: { gestion: 3, central: 7,  disposicion: 'CT' },
    bajo:  { gestion: 2, central: 5,  disposicion: 'E'  }
  },

  apoyo: {
    alto:  { gestion: 3, central: 5, disposicion: 'E' },
    medio: { gestion: 2, central: 3, disposicion: 'E' }
  },

  estrategica: {
    alto:  { gestion: 5, central: 15, disposicion: 'CT' },
    medio: { gestion: 4, central: 10, disposicion: 'CT' }
  }

}

// ===================================================
// MAPEO DISPOSICIÓN
// ===================================================

const MAP_DISPOSICION = {
  CT: 'conservacion_total',
  E:  'eliminacion',
  S:  'seleccion'
}

// ===================================================
// MATRIZ ARCHIVÍSTICA — V3 EXPANDIDA
// ===================================================

const MATRIZ_SERIES = [

  // ── ACTOS ADMINISTRATIVOS ──────────────────────
  {
    serie: 'ACTOS ADMINISTRATIVOS',
    reglas: [
      { palabras: ['resolucion'],           subserie: 'Resoluciones' },
      { palabras: ['decreto'],              subserie: 'Decretos' },
      { palabras: ['circular'],             subserie: 'Circulares' },
      { palabras: ['acuerdo'],              subserie: 'Acuerdos' },
      { palabras: ['ordenanza'],            subserie: 'Ordenanzas' },
      { palabras: ['directiva'],            subserie: 'Directivas' }
    ]
  },

  // ── CERTIFICADOS ───────────────────────────────
  {
    serie: 'CERTIFICADOS',
    reglas: [
      { palabras: ['certificado', 'presupuestal'], subserie: 'Certificados de disponibilidad presupuestal' },
      { palabras: ['certificado', 'laboral'],      subserie: 'Certificados laborales' },
      { palabras: ['certificado', 'tradicion'],    subserie: 'Certificados de tradición y libertad' },
      { palabras: ['certificado'],                 subserie: 'Certificados' }
    ]
  },

  // ── CONTRATOS ──────────────────────────────────
  {
    serie: 'CONTRATOS',
    reglas: [
      { palabras: ['contrato', 'prestacion'],   subserie: 'Contratos de prestación de servicios' },
      { palabras: ['contrato', 'obra'],         subserie: 'Contratos de obra' },
      { palabras: ['contrato', 'suministro'],   subserie: 'Contratos de suministro' },
      { palabras: ['contrato', 'interadmin'],   subserie: 'Contratos interadministrativos' },
      { palabras: ['contrato', 'concesion'],    subserie: 'Contratos de concesión' },
      { palabras: ['contrato'],                 subserie: 'Contratos' },
      { palabras: ['convenio'],                 subserie: 'Convenios' },
      { palabras: ['acuerdo', 'cooperacion'],   subserie: 'Acuerdos de cooperación' }
    ]
  },

  // ── ACTAS ──────────────────────────────────────
  {
    serie: 'ACTAS',
    reglas: [
      { palabras: ['acta', 'comite'],          subserie: 'Actas de comité' },
      { palabras: ['acta', 'reunion'],         subserie: 'Actas de reunión' },
      { palabras: ['acta', 'entrega'],         subserie: 'Actas de entrega' },
      { palabras: ['acta', 'recibo'],          subserie: 'Actas de recibo' },
      { palabras: ['acta', 'visita'],          subserie: 'Actas de visita' },
      { palabras: ['acta', 'inspeccion'],      subserie: 'Actas de inspección' },
      { palabras: ['acta'],                    subserie: 'Actas' }
    ]
  },

  // ── INFORMES ───────────────────────────────────
  {
    serie: 'INFORMES',
    reglas: [
      { palabras: ['informe', 'gestion'],      subserie: 'Informes de gestión' },
      { palabras: ['informe', 'tecnico'],      subserie: 'Informes técnicos' },
      { palabras: ['informe', 'auditoria'],    subserie: 'Informes de auditoría' },
      { palabras: ['informe', 'control'],      subserie: 'Informes de control interno' },
      { palabras: ['informe', 'rendicion'],    subserie: 'Informes de rendición de cuentas' },
      { palabras: ['rendicion', 'cuentas'],    subserie: 'Informes de rendición de cuentas' },
      { palabras: ['auditoria'],               subserie: 'Informes de auditoría' },
      { palabras: ['informe'],                 subserie: 'Informes' }
    ]
  },

  // ── PLANES ─────────────────────────────────────
  {
    serie: 'PLANES',
    reglas: [
      { palabras: ['plan', 'estrategico'],      subserie: 'Planes estratégicos' },
      { palabras: ['plan', 'institucional'],    subserie: 'Planes institucionales' },
      { palabras: ['plan', 'accion'],           subserie: 'Planes de acción' },
      { palabras: ['plan', 'desarrollo'],       subserie: 'Planes de desarrollo' },
      { palabras: ['plan', 'mejoramiento'],     subserie: 'Planes de mejoramiento' },
      { palabras: ['plan', 'emergencia'],       subserie: 'Planes de emergencia' },
      { palabras: ['plan', 'ordenamiento'],     subserie: 'Planes de ordenamiento territorial' },
      { palabras: ['plan', 'inversion'],        subserie: 'Planes de inversión' },
      { palabras: ['plan', 'capacitacion'],     subserie: 'Planes de capacitación' },
      { palabras: ['plan'],                     subserie: 'Planes' },
      { palabras: ['programa'],                 subserie: 'Programas' }
    ]
  },

  // ── CONCEPTOS ──────────────────────────────────
  {
    serie: 'CONCEPTOS',
    reglas: [
      { palabras: ['concepto', 'juridico'],    subserie: 'Conceptos jurídicos' },
      { palabras: ['concepto', 'tecnico'],     subserie: 'Conceptos técnicos' },
      { palabras: ['concepto', 'fiscal'],      subserie: 'Conceptos fiscales' },
      { palabras: ['concepto'],                subserie: 'Conceptos' },
      { palabras: ['dictamen'],                subserie: 'Dictámenes' },
      { palabras: ['opinion', 'juridica'],     subserie: 'Conceptos jurídicos' }
    ]
  },

  // ── PQRS ───────────────────────────────────────
  {
    serie: 'PQRS',
    reglas: [
      { palabras: ['pqrs'],                    subserie: 'Peticiones, quejas y reclamos' },
      { palabras: ['peticion'],                subserie: 'Peticiones' },
      { palabras: ['queja'],                   subserie: 'Quejas y reclamos' },
      { palabras: ['reclamo'],                 subserie: 'Quejas y reclamos' },
      { palabras: ['derecho', 'peticion'],     subserie: 'Peticiones' },
      { palabras: ['solicitud', 'ciudadano'],  subserie: 'Peticiones' },
      { palabras: ['solicitud', 'apoyo'],      subserie: 'Peticiones' },
      { palabras: ['atencion', 'ciudadano'],   subserie: 'Peticiones' },
      { palabras: ['respuesta', 'oficio'],     subserie: 'Peticiones' },
      { palabras: ['solicitud'],               subserie: 'Peticiones' }
    ]
  },

  // ── REGISTROS ──────────────────────────────────
  {
    serie: 'REGISTROS',
    reglas: [
      { palabras: ['registro'],                subserie: 'Registros administrativos' }
    ]
  },

  // ── LICENCIAS Y PERMISOS ───────────────────────
  {
    serie: 'LICENCIAS Y PERMISOS',
    reglas: [
      { palabras: ['licencia', 'construccion'],  subserie: 'Licencias de construcción' },
      { palabras: ['licencia', 'ambiental'],     subserie: 'Licencias ambientales' },
      { palabras: ['permiso', 'mineria'],        subserie: 'Permisos mineros' },
      { palabras: ['permiso', 'minero'],         subserie: 'Permisos mineros' },
      { palabras: ['permiso', 'subsistencia'],   subserie: 'Permisos mineros de subsistencia' },
      { palabras: ['permiso', 'ambiental'],      subserie: 'Permisos ambientales' },
      { palabras: ['permiso', 'funcionamiento'], subserie: 'Permisos de funcionamiento' },
      { palabras: ['permiso'],                   subserie: 'Permisos' },
      { palabras: ['licencia'],                  subserie: 'Licencias' },
      { palabras: ['autorizacion'],              subserie: 'Autorizaciones' }
    ]
  },

  // ── INSPECCIONES Y VISITAS ─────────────────────
  {
    serie: 'INSPECCIONES Y VISITAS',
    reglas: [
      { palabras: ['inspeccion', 'tecnica'],     subserie: 'Inspecciones técnicas' },
      { palabras: ['inspeccion', 'ocular'],      subserie: 'Inspecciones oculares' },
      { palabras: ['visita', 'inspeccion'],      subserie: 'Visitas de inspección' },
      { palabras: ['visita', 'control'],         subserie: 'Visitas de control' },
      { palabras: ['inspeccion'],                subserie: 'Inspecciones' },
      { palabras: ['visita'],                    subserie: 'Visitas' },
      { palabras: ['supervision'],               subserie: 'Supervisiones' },
      { palabras: ['interventoria'],             subserie: 'Interventorías' }
    ]
  },

  // ── PROYECTOS ─────────────────────────────────
  {
    serie: 'PROYECTOS',
    reglas: [
      { palabras: ['proyecto', 'inversion'],       subserie: 'Proyectos de inversión' },
      { palabras: ['proyecto', 'infraestructura'], subserie: 'Proyectos de infraestructura' },
      { palabras: ['proyecto', 'desarrollo'],      subserie: 'Proyectos de desarrollo' },
      { palabras: ['formulacion', 'proyecto'],     subserie: 'Proyectos de inversión' },
      { palabras: ['aprobacion', 'proyecto'],      subserie: 'Proyectos de inversión' },
      { palabras: ['obra'],                        subserie: 'Proyectos de infraestructura' },
      { palabras: ['proyecto'],                    subserie: 'Proyectos' }
    ]
  },

  // ── CORRESPONDENCIA ────────────────────────────
  {
    serie: 'CORRESPONDENCIA',
    reglas: [
      { palabras: ['oficio'],                    subserie: 'Oficios' },
      { palabras: ['comunicacion', 'oficial'],   subserie: 'Comunicaciones oficiales' },
      { palabras: ['memorando'],                 subserie: 'Memorandos' },
      { palabras: ['correspondencia'],           subserie: 'Correspondencia' }
    ]
  },

  // ── PRESUPUESTO ────────────────────────────────
  {
    serie: 'PRESUPUESTO',
    reglas: [
      { palabras: ['presupuesto', 'anual'],      subserie: 'Presupuesto anual' },
      { palabras: ['adicion', 'presupuestal'],   subserie: 'Adiciones presupuestales' },
      { palabras: ['traslado', 'presupuestal'],  subserie: 'Traslados presupuestales' },
      { palabras: ['presupuesto'],               subserie: 'Presupuesto' }
    ]
  },

  // ── HISTORIAS LABORALES ────────────────────────
  {
    serie: 'HISTORIAS LABORALES',
    reglas: [
      { palabras: ['historia', 'laboral'],       subserie: 'Historias laborales' },
      { palabras: ['hoja', 'vida'],              subserie: 'Hojas de vida' },
      { palabras: ['expediente', 'personal'],    subserie: 'Historias laborales' },
      { palabras: ['vinculacion'],               subserie: 'Historias laborales' },
      { palabras: ['nombramiento'],              subserie: 'Historias laborales' }
    ]
  },

  // ── GESTIÓN AMBIENTAL ──────────────────────────
  {
    serie: 'GESTIÓN AMBIENTAL',
    reglas: [
      { palabras: ['ambiental', 'proyecto'],     subserie: 'Proyectos ambientales' },
      { palabras: ['ambiental'],                 subserie: 'Gestión ambiental' },
      { palabras: ['residuo'],                   subserie: 'Gestión de residuos' },
      { palabras: ['recurso', 'hidrico'],        subserie: 'Recursos hídricos' }
    ]
  },

  // ── FOMENTO Y DESARROLLO ───────────────────────
  {
    serie: 'FOMENTO Y DESARROLLO',
    reglas: [
      { palabras: ['emprendimiento'],            subserie: 'Programas de emprendimiento' },
      { palabras: ['desarrollo', 'economico'],   subserie: 'Desarrollo económico' },
      { palabras: ['desarrollo', 'turistico'],   subserie: 'Desarrollo turístico' },
      { palabras: ['turismo'],                   subserie: 'Desarrollo turístico' },
      { palabras: ['competitividad'],            subserie: 'Competitividad' },
      { palabras: ['fomento'],                   subserie: 'Programas de fomento' }
    ]
  }

]

// ===================================================
// NORMALIZACIÓN TEXTO
// ===================================================

function normalizar(texto = '') {
  return texto
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^\w\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

// ===================================================
// TOKENIZAR TEXTO
// ===================================================

function tokenizar(texto) {
  return normalizar(texto)
    .split(' ')
    .map(t => {
      if (t.endsWith('s') && t.length > 4) return t.slice(0, -1)
      return t
    })
}

// ===================================================
// EXTRAER TIPOLOGÍAS DOCUMENTALES
// ===================================================

function extraerTipologias(texto) {
  if (!texto) return []
  return texto
    .split('\n')
    .map(x => x.trim())
    .filter(Boolean)
}

// ===================================================
// DETECTOR DE PATRONES DOCUMENTALES
// ===================================================

function detectarPatronDocumental(tipologia) {
  const t = normalizar(tipologia)
  if (t.startsWith('certificado de')) return { serie: 'CERTIFICADOS' }
  if (t.startsWith('acta de'))        return { serie: 'ACTAS' }
  if (t.startsWith('informe de'))     return { serie: 'INFORMES' }
  if (t.startsWith('registro de'))    return { serie: 'REGISTROS' }
  if (t.startsWith('concepto '))      return { serie: 'CONCEPTOS' }
  if (t.startsWith('permiso de'))     return { serie: 'LICENCIAS Y PERMISOS' }
  if (t.startsWith('licencia de'))    return { serie: 'LICENCIAS Y PERMISOS' }
  if (t.startsWith('visita de'))      return { serie: 'INSPECCIONES Y VISITAS' }
  if (t.startsWith('proyecto de'))    return { serie: 'PROYECTOS' }
  return null
}

// ===================================================
// SCORE LÉXICO
// ===================================================

function calcularScore(tokensTexto, palabras) {
  let coincidencias = 0
  let totalTokens   = 0

  for (const palabra of palabras) {
    const tokensRegla = tokenizar(palabra)
    for (const token of tokensRegla) {
      totalTokens++
      if (tokensTexto.includes(token)) coincidencias++
    }
  }

  if (totalTokens === 0) return 0
  return coincidencias / totalTokens
}

// ===================================================
// CAPA 4: CATÁLOGO REAL BD  (fix pg)
// ===================================================

async function buscarEnCatalogo(db, tokensTexto) {

  if (!db) return null

  try {

    const tokens = tokensTexto
      .filter(t => t.length > 3)
      .slice(0, 8)

    if (tokens.length === 0) return null

    const result = await db.query(
      `SELECT serie, subserie, gestion, central, disposicion, score
       FROM trd_buscar_clasificacion($1)
       WHERE score > 0
       LIMIT 1`,
      [tokens]
    )

    if (!result.rows || result.rows.length === 0) return null

    const mejor = result.rows[0]
    const score = Number(mejor.score || 0)

    if (score < 2) return null

    console.log('Capa 4 catálogo:', mejor.serie, '→', mejor.subserie, 'score:', score)

    return {
      serie_sugerida:    { nombre: mejor.serie },
      subserie_sugerida: { nombre: mejor.subserie || null },
      retencion_gestion: mejor.gestion   ? Number(mejor.gestion)   : null,
      retencion_central: mejor.central   ? Number(mejor.central)   : null,
      disposicion_final: mejor.disposicion || null,
      confianza:         Math.min(0.50 + (score * 0.04), 0.92),
      origen:            'catalogo'
    }

    } catch (err) {
      console.error('TRD-AI capa 4 error:', err.message)
      return null
    }
  }


// ===================================================
// CAPA 0: OPENAI GPT-4o
// ===================================================

async function llamarOpenAI(actividad, configuracionDependencia) {

  if (!process.env.OPENAI_API_KEY) return null

  const cfg = configuracionDependencia || {}

  const tiposDoc = (() => {
    try {
      const arr = typeof cfg.tipos_documentales === 'string'
        ? JSON.parse(cfg.tipos_documentales)
        : (cfg.tipos_documentales || [])
      return Array.isArray(arr) ? arr.join(', ') : '-'
    } catch { return '-' }
  })()

  const prompt = `Eres un experto archivista colombiano con dominio del Acuerdo 004 de 2019 del AGN y la Ley 594 de 2000. Propón la clasificación archivística correcta para esta actividad institucional.

## CONTEXTO DE LA DEPENDENCIA
- Tipo de función: ${cfg.tipo_funcion || 'No especificado'}
- Nivel decisorio: ${cfg.nivel_decisorio || 'No especificado'}
- Recibe solicitudes externas: ${cfg.recibe_solicitudes ? 'Sí' : 'No'}
- Emite actos administrativos: ${cfg.emite_actos ? 'Sí' : 'No'}
- Produce decisiones que afectan terceros: ${cfg.produce_decisiones ? 'Sí' : 'No'}
- Procesos principales: ${cfg.procesos_principales || 'No especificado'}
- Trámites frecuentes: ${cfg.tramites_frecuentes || 'No especificado'}
- Tipo de decisiones: ${cfg.tipo_decisiones || 'No especificado'}
- Tipos documentales que produce: ${tiposDoc}
- Descripción funcional: ${cfg.descripcion_funcional || 'No especificada'}

## ACTIVIDAD A CLASIFICAR
- Nombre: ${actividad.nombre || 'Sin nombre'}
- Tipo de función: ${actividad.tipo_funcion || 'No especificado'}
- Frecuencia: ${actividad.frecuencia || 'No especificada'}
- Descripción funcional: ${actividad.descripcion_funcional || 'No especificada'}
- Genera documentos: ${actividad.genera_documentos ? 'Sí' : 'No'}
- Documentos que genera: ${actividad.documentos_generados || 'No especificado'}
- Formato de producción: ${actividad.formato_produccion || 'No especificado'}
- Localización de documentos: ${actividad.localizacion_documentos || 'No especificada'}
- Tiene pasos formales: ${actividad.tiene_pasos_formales ? 'Sí' : 'No'}
- Norma aplicable: ${actividad.norma_aplicable || 'No especificada'}
- Plazo legal: ${actividad.plazo_legal || 'No especificado'}
- Genera expediente propio: ${actividad.genera_expediente_propio ? 'Sí' : 'No'}
- Impacto jurídico directo: ${actividad.impacto_juridico_directo ? 'Sí' : 'No'}
- Impacto fiscal/contable: ${actividad.impacto_fiscal_contable ? 'Sí' : 'No'}
- Actividad permanente: ${actividad.actividad_permanente ? 'Sí' : 'No'}
- Localización específica: ${actividad.localizacion_otro || 'No especificada'}

Responde ÚNICAMENTE con JSON válido, sin markdown ni texto adicional:
{
  "serie_documental": "NOMBRE EN MAYÚSCULAS",
  "subserie_documental": "Nombre de la subserie",
  "retencion_gestion": número_entero,
  "retencion_central": número_entero,
  "disposicion_final": "conservacion_total" | "eliminacion" | "seleccion" | "microfilmacion",
  "justificacion": "Explicación breve basada en normativa archivística colombiana",
  "confianza": número_decimal_entre_0_y_1
}`

  try {

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type':  'application/json',
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`
      },
      body: JSON.stringify({
        model:       'gpt-4o',
        temperature: 0.2,
        messages: [
          {
            role:    'system',
            content: 'Eres un experto archivista colombiano. Responde siempre con JSON válido únicamente, sin markdown ni texto adicional.'
          },
          {
            role:    'user',
            content: prompt
          }
        ]
      })
    })

    if (!response.ok) {
      console.error('OpenAI API HTTP error:', response.status)
      return null
    }

    const json   = await response.json()
    const texto  = json.choices?.[0]?.message?.content || ''
    const limpio = texto.replace(/```json/gi, '').replace(/```/g, '').trim()
    const result = JSON.parse(limpio)

    if (!result.serie_documental) return null

    console.log('Capa 0 GPT-4o —', result.serie_documental, '→', result.subserie_documental)

    return {
      serie_sugerida:    { nombre: result.serie_documental },
      subserie_sugerida: { nombre: result.subserie_documental || null },
      retencion_gestion: result.retencion_gestion || null,
      retencion_central: result.retencion_central || null,
      disposicion_final: result.disposicion_final || null,
      justificacion:     result.justificacion     || null,
      confianza:         result.confianza         || 0.85,
      origen:            'gpt-4o'
    }

  } catch (err) {
    console.error('Error capa 0 GPT-4o:', err.message)
    return null
  }
}

// ===================================================
// MOTOR DE CLASIFICACIÓN
// ===================================================

export async function sugerirSerieDesdeActividad(actividad = {}, configuracionDependencia = null, db = null) {

  const texto = normalizar(`
    ${actividad.nombre               || ''}
    ${actividad.descripcion          || ''}
    ${actividad.descripcion_funcional || ''}
    ${actividad.documentos_generados  || ''}
  `)

  const tokensTexto = tokenizar(texto)

  console.log('\n========== TRD-AI DEBUG ==========')
  console.log('Texto analizado:', texto)
  console.log('Tokens actividad:', tokensTexto)

  // ---------------------------------------------------
  // CAPA 0: Claude AI (con contexto completo)
  // ---------------------------------------------------

  const resultadoIA = await llamarOpenAI(actividad, configuracionDependencia)

  if (resultadoIA) {
    return resultadoIA
  }

  console.log('Capa 0 no disponible — usando motor heurístico')

  const tipologias = extraerTipologias(actividad.documentos_generados)

  // =================================================================
// FIX — trd-ai.engine.js
// Problema: Capa 1 detecta "REGISTRO DE ASISTENCIA" como tipología
//           y clasifica como REGISTROS, ignorando que la actividad
//           es una ACCIÓN DE TUTELA.
//
// Solución: Antes de iterar tipologías, intentar clasificar por el
//           NOMBRE de la actividad. Si el nombre da señal fuerte,
//           usar esa clasificación. Solo usar tipologías si el nombre
//           no produce resultado.
// =================================================================

// En sugerirSerieDesdeActividad, reemplaza el bloque completo
// "CAPA 1: detectar por tipologías" con esto:

// ---------------------------------------------------
// CAPA 1A: detectar por NOMBRE de la actividad (prioridad alta)
// ---------------------------------------------------

const nombreNormalizado = normalizar(actividad.nombre || '')

// Mapa directo nombre → serie/subserie para casos comunes
const MAPA_NOMBRE_DIRECTO = [
  { palabras: ['tutela'],                     serie: 'ACCIONES CONSTITUCIONALES', subserie: 'Acciones de tutela' },
  { palabras: ['accion', 'popular'],          serie: 'ACCIONES CONSTITUCIONALES', subserie: 'Acciones populares' },
  { palabras: ['accion', 'cumplimiento'],     serie: 'ACCIONES CONSTITUCIONALES', subserie: 'Acciones de cumplimiento' },
  { palabras: ['habeas', 'corpus'],           serie: 'ACCIONES CONSTITUCIONALES', subserie: 'Acciones de tutela' },
  { palabras: ['derecho', 'peticion'],        serie: 'PQRS',                       subserie: 'Derechos de petición' },
  { palabras: ['queja'],                      serie: 'PQRS',                       subserie: 'Quejas y reclamos' },
  { palabras: ['contrato', 'prestacion'],     serie: 'CONTRATOS',                  subserie: 'Contratos de prestación de servicios' },
  { palabras: ['contrato', 'obra'],           serie: 'CONTRATOS',                  subserie: 'Contratos de obra' },
  { palabras: ['historia', 'laboral'],        serie: 'HISTORIAS LABORALES',        subserie: 'Historias laborales de servidores públicos' },
  { palabras: ['historia', 'clinica'],        serie: 'HISTORIAS CLÍNICAS',         subserie: 'Historias clínicas de pacientes' },
  { palabras: ['licencia', 'construccion'],   serie: 'LICENCIAS Y PERMISOS',       subserie: 'Licencias de construcción' },
  { palabras: ['matricula', 'vehiculo'],      serie: 'REGISTRO AUTOMOTOR',         subserie: 'Matrículas de vehículos' },
  { palabras: ['comparendo'],                 serie: 'INFRACCIONES DE TRÁNSITO',   subserie: 'Comparendos por infracciones de tránsito' },
  { palabras: ['accidente', 'transito'],      serie: 'ACCIDENTES DE TRÁNSITO',     subserie: 'Informes de accidentes de tránsito' },
  { palabras: ['alumbrado'],                  serie: 'PROYECTOS DE INVERSIÓN',     subserie: 'Proyectos de alumbrado público' },
  { palabras: ['presupuesto'],                serie: 'PRESUPUESTO',                subserie: 'Presupuesto anual de rentas y gastos' },
  { palabras: ['nomina'],                     serie: 'NÓMINA Y SEGURIDAD SOCIAL',  subserie: 'Nómina de personal' },
  { palabras: ['plan', 'desarrollo'],         serie: 'PLANES',                     subserie: 'Plan de desarrollo' },
  { palabras: ['plan', 'ordenamiento'],       serie: 'PLANES',                     subserie: 'Plan de ordenamiento territorial - POT' },
  { palabras: ['rendicion', 'cuenta'],        serie: 'INFORMES',                   subserie: 'Informes de rendición de cuentas' },
  { palabras: ['victima'],                    serie: 'ATENCIÓN A VÍCTIMAS',        subserie: 'Caracterización de víctimas del conflicto' },
]

const tokensNombre = tokenizar(actividad.nombre || '')

for (const entrada of MAPA_NOMBRE_DIRECTO) {
  const coincidencias = entrada.palabras.filter(p => tokensNombre.includes(p))
  if (coincidencias.length === entrada.palabras.length) {
    console.log('Capa 1A — nombre actividad:', entrada.serie, '→', entrada.subserie)
    return {
      serie_sugerida:    { nombre: entrada.serie },
      subserie_sugerida: { nombre: entrada.subserie },
      confianza: 0.95,
      origen: 'nombre_actividad'
    }
  }
}

  // ---------------------------------------------------
  // CAPA 1B: detectar por tipologías documentales
  // Solo si el nombre no produjo resultado
  // FILTRO: excluir tipologías genéricas que contaminan
  // ---------------------------------------------------

  const TIPOLOGIAS_IGNORAR = [
    'registro de asistencia',
    'registros',
    'solicitudes',
    'comunicaciones',
    'oficios',
  ]

  const tipologiasFiltradas = tipologias.filter(t => {
    const tn = normalizar(t)
    return !TIPOLOGIAS_IGNORAR.some(ignorar => tn === ignorar || tn.startsWith(ignorar))
  })

  for (const tipologia of tipologiasFiltradas) {
    const patron = detectarPatronDocumental(tipologia)
    if (patron) {
      console.log('Capa 1B — clasificación por tipología:', patron.serie)
      return {
        serie_sugerida:    { nombre: patron.serie },
        subserie_sugerida: { nombre: tipologia },
        confianza: 0.88,
        origen: 'patron'
      }
    }
  }

  // ---------------------------------------------------
  // CAPAS 2-3: matriz archivística expandida
  // ---------------------------------------------------

  let mejor      = null
  let mejorScore = 0

  for (const serie of MATRIZ_SERIES) {
    for (const regla of serie.reglas) {
      const score = calcularScore(tokensTexto, regla.palabras)

      console.log('Regla evaluada:', serie.serie, '→', regla.subserie, 'Score:', score)

      if (score > mejorScore) {
        mejorScore = score
        mejor = { serie: serie.serie, subserie: regla.subserie }
      }
    }
  }

  console.log('Mejor coincidencia:', mejor)
  console.log('Score final:', mejorScore)

  if (mejorScore >= 0.4) {
    console.log('Capa 2-3 — matriz archivística:', mejor.serie)
    return {
      serie_sugerida:    { nombre: mejor.serie },
      subserie_sugerida: { nombre: mejor.subserie },
      confianza: Number((0.65 + mejorScore * 0.25).toFixed(2)),
      origen: 'matriz'
    }
  }

  // ---------------------------------------------------
  // CAPA 4: catálogo real BD
  // ---------------------------------------------------

  console.log('Capa 4 — consultando catálogo BD...')

  const resultadoCatalogo = await buscarEnCatalogo(db, tokensTexto)

  if (resultadoCatalogo) {
    console.log('Capa 4 — encontrado:', resultadoCatalogo.serie_sugerida.nombre)
    return resultadoCatalogo
  }

  // ---------------------------------------------------
  // FALLBACK
  // ---------------------------------------------------

  console.log('No se encontró coincidencia suficiente')

  return {
    serie_sugerida:    { nombre: 'DOCUMENTACION GENERAL' },
    subserie_sugerida: { nombre: null },
    confianza: 0.4,
    origen: 'fallback'
  }

}

// ===================================================
// MOTOR DE RETENCIÓN BASE
// ===================================================

export function sugerirRetencionAutomatica({ tipo_funcion, nivel_riesgo }) {

  if (!tipo_funcion || !nivel_riesgo) {
    return {
      gestion: 2, central: 3,
      disposicion: 'eliminacion',
      justificacion: 'Regla por defecto aplicada',
      nivel_confianza: 0.5
    }
  }

  const tipo   = tipo_funcion.toLowerCase().trim()
  const riesgo = nivel_riesgo.toLowerCase().trim()
  const regla  = MATRIZ_RETENCION[tipo]?.[riesgo]

  if (!regla) {
    return {
      gestion: 2, central: 3,
      disposicion: 'eliminacion',
      justificacion: 'Regla por defecto aplicada',
      nivel_confianza: 0.5
    }
  }

  return {
    gestion: regla.gestion,
    central: regla.central,
    disposicion: MAP_DISPOSICION[regla.disposicion],
    justificacion: `Retención base (${tipo} - ${riesgo})`,
    nivel_confianza: 0.7
  }

}

// ===================================================
// MOTOR CONTEXTUAL
// ===================================================

export function sugerirRetencionContextual(contexto = {}) {

  const {
    tipo_funcion,
    nivel_riesgo,
    impacto_juridico,
    funcion_permanente,
    requiere_conservacion,
    soporte_principal,
    confianza_lexica
  } = contexto

  let resultado   = sugerirRetencionAutomatica({ tipo_funcion, nivel_riesgo })
  let gestion     = resultado.gestion
  let central     = resultado.central
  let disposicion = resultado.disposicion
  let confianza   = resultado.nivel_confianza
  let justificaciones = [resultado.justificacion]

  if (impacto_juridico === 'alto') {
    gestion += 2
    central += 5
    confianza += 0.1
    justificaciones.push('Ajuste por impacto jurídico alto')
  }

  if (funcion_permanente === 'si') {
    disposicion = 'seleccion'
    confianza  += 0.05
    justificaciones.push('Actividad permanente')
  }

  if (requiere_conservacion === 'si') {
    disposicion = 'conservacion_total'
    central    += 5
    confianza  += 0.1
    justificaciones.push('Conservación requerida')
  }

  if (soporte_principal === 'fisico') gestion += 1

  if (confianza_lexica >= 0.6) confianza += 0.1

  confianza = Math.min(Math.max(confianza, 0.4), 0.95)

  return {
    gestion,
    central,
    disposicion,
    justificacion:   justificaciones.join('. '),
    nivel_confianza: Number(confianza.toFixed(2))
  }

}