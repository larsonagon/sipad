/**
 * Motor heurístico TRD-AI — V5
 * Biblioteca basada en TRDs aprobadas:
 *   - Alcaldía de Floridablanca (Santander) 2020
 *   - Alcaldía de Pitalito (Huila) consolidada
 * Principio AGN: series por FUNCIÓN, nunca por nombre de dependencia
 */

// ===================================================
// MATRIZ BASE DE RETENCIÓN
// ===================================================

const MATRIZ_RETENCION = {
  misional: {
    alto:  { gestion: 5, central: 10, disposicion: 'CT' },
    medio: { gestion: 3, central: 7,  disposicion: 'CT' },
    bajo:  { gestion: 2, central: 5,  disposicion: 'EL' }
  },
  apoyo: {
    alto:  { gestion: 3, central: 5, disposicion: 'EL' },
    medio: { gestion: 2, central: 3, disposicion: 'EL' }
  },
  estrategica: {
    alto:  { gestion: 5, central: 15, disposicion: 'CT' },
    medio: { gestion: 4, central: 10, disposicion: 'CT' }
  }
}

const MAP_DISPOSICION = {
  CT: 'conservacion_total',
  EL: 'eliminacion',
  ST: 'seleccion',
  MT: 'medio_tecnico'
}

// ===================================================
// MATRIZ ARCHIVÍSTICA — V5
// ~18 series institucionales reales de alcaldías
// ===================================================

const MATRIZ_SERIES = [

  // ── ACCIONES CONSTITUCIONALES ──────────────────
  // Fuente: Floridablanca 101, 104 / Pitalito
  {
    serie: 'ACCIONES CONSTITUCIONALES',
    reglas: [
      { palabras: ['tutela'],                          subserie: 'Acciones de tutela' },
      { palabras: ['accion', 'tutela'],                subserie: 'Acciones de tutela' },
      { palabras: ['accion', 'popular'],               subserie: 'Acciones populares' },
      { palabras: ['accion', 'cumplimiento'],          subserie: 'Acciones de cumplimiento' },
      { palabras: ['accion', 'grupo'],                 subserie: 'Acciones de grupo' },
      { palabras: ['habeas', 'corpus'],                subserie: 'Habeas corpus' }
    ]
  },

  // ── ACTAS ──────────────────────────────────────
  // Fuente: Floridablanca 101, 104, 105 / Pitalito
  // AG: 1 año | AC: 9 años | CT
  {
    serie: 'ACTAS',
    reglas: [
      { palabras: ['acta', 'posesion'],                subserie: 'Actas de posesión' },
      { palabras: ['acta', 'entrega'],                 subserie: 'Actas de entrega' },
      { palabras: ['acta', 'recibo'],                  subserie: 'Actas de recibo a satisfacción' },
      { palabras: ['acta', 'visita'],                  subserie: 'Actas de visita' },
      { palabras: ['acta', 'inspeccion'],              subserie: 'Actas de inspección' },
      { palabras: ['acta', 'seguimiento'],             subserie: 'Actas de seguimiento' },
      { palabras: ['acta', 'baja', 'bien'],            subserie: 'Actas comité de bajas de bienes' },
      { palabras: ['acta', 'asignacion'],              subserie: 'Actas de asignación de bienes' },
      { palabras: ['acta', 'saneamiento'],             subserie: 'Actas comité saneamiento contable' },
      { palabras: ['acta', 'comision', 'personal'],    subserie: 'Actas comisión de personal' },
      { palabras: ['acta', 'copasst'],                 subserie: 'Actas COPASST' },
      { palabras: ['acta', 'comfis'],                  subserie: 'Actas comité COMFIS' },
      { palabras: ['acta', 'consejo', 'gobierno'],     subserie: 'Actas consejo de gobierno' },
      { palabras: ['acta', 'consejo', 'planeacion'],   subserie: 'Actas consejo territorial de planeación' },
      { palabras: ['acta', 'comite', 'tecnico'],       subserie: 'Actas comité técnico' },
      { palabras: ['acta', 'convivencia'],             subserie: 'Actas comité de convivencia laboral' },
      { palabras: ['acta', 'estratificacion'],         subserie: 'Actas comité de estratificación' },
      { palabras: ['acta', 'riesgo'],                  subserie: 'Actas consejo municipal de gestión del riesgo' },
      { palabras: ['acta', 'emergencia'],              subserie: 'Actas comité de emergencias' },
      { palabras: ['acta', 'ambiental'],               subserie: 'Actas comité de gestión ambiental' },
      { palabras: ['acta', 'salud'],                   subserie: 'Actas comité de salud' },
      { palabras: ['acta', 'educacion'],               subserie: 'Actas comité de educación' },
      { palabras: ['acta', 'junta'],                   subserie: 'Actas de junta' },
      { palabras: ['acta', 'consejo'],                 subserie: 'Actas de consejo' },
      { palabras: ['acta', 'comite'],                  subserie: 'Actas de comité' },
      { palabras: ['acta', 'reunion'],                 subserie: 'Actas de reunión' },
      { palabras: ['acta'],                            subserie: 'Actas' }
    ]
  },

  // ── ACTOS ADMINISTRATIVOS ──────────────────────
  // Fuente: Floridablanca 106 / Pitalito
  // Serie por tipo de acto jurídico — NO por tema
  {
    serie: 'ACTOS ADMINISTRATIVOS',
    reglas: [
      { palabras: ['resolucion'],                      subserie: 'Resoluciones' },
      { palabras: ['decreto'],                         subserie: 'Decretos' },
      { palabras: ['acuerdo', 'municipal'],            subserie: 'Acuerdos municipales' },
      { palabras: ['acuerdo'],                         subserie: 'Acuerdos' },
      { palabras: ['ordenanza'],                       subserie: 'Ordenanzas' },
      { palabras: ['circular'],                        subserie: 'Circulares' },
      { palabras: ['directiva'],                       subserie: 'Directivas' },
      { palabras: ['auto', 'remisorio'],               subserie: 'Autos remisorios' },
      { palabras: ['acto', 'administrativo'],          subserie: 'Actos administrativos' }
    ]
  },

  // ── AUDITORÍAS ─────────────────────────────────
  // Fuente: Floridablanca 105 / Pitalito
  // AG: 2 años | AC: 8 años | CT
  {
    serie: 'AUDITORÍAS',
    reglas: [
      { palabras: ['auditoria', 'externa'],            subserie: 'Auditorías externas' },
      { palabras: ['auditoria', 'interna'],            subserie: 'Auditorías internas' },
      { palabras: ['auditoria', 'control'],            subserie: 'Auditorías de vigilancia y control' },
      { palabras: ['plan', 'auditoria'],               subserie: 'Planes anuales de auditoría' },
      { palabras: ['plan', 'mejoramiento'],            subserie: 'Planes de mejoramiento' },
      { palabras: ['auditoria'],                       subserie: 'Auditorías' }
    ]
  },

  // ── BASES DE DATOS ─────────────────────────────
  // Fuente: Pitalito
  {
    serie: 'BASES DE DATOS',
    reglas: [
      { palabras: ['base', 'dato', 'predial'],         subserie: 'Base de datos contribuyentes impuesto predial' },
      { palabras: ['base', 'dato', 'industria'],       subserie: 'Base de datos contribuyentes industria y comercio' },
      { palabras: ['base', 'dato', 'valorizacion'],    subserie: 'Listado contribuyentes valorización' },
      { palabras: ['base', 'dato', 'sisben'],          subserie: 'Base de datos SISBEN' },
      { palabras: ['base', 'dato'],                    subserie: 'Bases de datos' }
    ]
  },

  // ── BOLETINES ──────────────────────────────────
  // Fuente: Floridablanca 107
  {
    serie: 'BOLETINES',
    reglas: [
      { palabras: ['boletin', 'prensa'],               subserie: 'Boletines de prensa' },
      { palabras: ['comunicado', 'prensa'],            subserie: 'Boletines de prensa' },
      { palabras: ['boletin'],                         subserie: 'Boletines' }
    ]
  },

  // ── CERTIFICADOS ───────────────────────────────
  // Fuente: Floridablanca 101 / Pitalito
  {
    serie: 'CERTIFICADOS',
    reglas: [
      { palabras: ['certificado', 'disponibilidad'],   subserie: 'Certificados de disponibilidad presupuestal' },
      { palabras: ['certificado', 'uso', 'suelo'],     subserie: 'Certificados de uso del suelo' },
      { palabras: ['certificado', 'estratificacion'],  subserie: 'Certificados de estratificación' },
      { palabras: ['certificado', 'nomenclatura'],     subserie: 'Certificados de estratificación y nomenclatura' },
      { palabras: ['certificado', 'riesgo'],           subserie: 'Certificados de riesgo ambiental' },
      { palabras: ['certificado', 'residencia'],       subserie: 'Certificados de residencia' },
      { palabras: ['certificado', 'paramento'],        subserie: 'Certificados de paramento' },
      { palabras: ['certificado', 'topografico'],      subserie: 'Certificados visto bueno topográfico' },
      { palabras: ['certificado', 'laboral'],          subserie: 'Certificados laborales' },
      { palabras: ['certificado', 'tradicion'],        subserie: 'Certificados de tradición y libertad' },
      { palabras: ['certificado', 'existencia'],       subserie: 'Certificados de existencia y representación' },
      { palabras: ['certificado', 'patrimonio'],       subserie: 'Certificados de patrimonio cultural' },
      { palabras: ['certificado', 'servicio'],         subserie: 'Certificados de servicios públicos' },
      { palabras: ['certificado', 'viabilidad'],       subserie: 'Certificados de viabilidad' },
      { palabras: ['certificado'],                     subserie: 'Certificados' }
    ]
  },

  // ── COBROS COACTIVOS ───────────────────────────
  // Fuente: Pitalito
  {
    serie: 'COBROS COACTIVOS',
    reglas: [
      { palabras: ['cobro', 'coactivo', 'predial'],    subserie: 'Cobro coactivo impuesto predial' },
      { palabras: ['cobro', 'coactivo'],               subserie: 'Cobros coactivos' },
      { palabras: ['proceso', 'coactivo'],             subserie: 'Cobros coactivos' }
    ]
  },

  // ── COMUNICACIONES OFICIALES ───────────────────
  // Fuente: Pitalito
  {
    serie: 'COMUNICACIONES OFICIALES',
    reglas: [
      { palabras: ['comunicacion', 'oficial'],         subserie: 'Consecutivo de comunicaciones oficiales' },
      { palabras: ['radicacion'],                      subserie: 'Registro y control de comunicaciones' },
      { palabras: ['correspondencia'],                 subserie: 'Consecutivo de comunicaciones oficiales' },
      { palabras: ['oficio'],                          subserie: 'Consecutivo de comunicaciones oficiales' },
      { palabras: ['memorando'],                       subserie: 'Consecutivo de comunicaciones oficiales' }
    ]
  },

  // ── COMPROBANTES CONTABLES ─────────────────────
  // Fuente: Pitalito
  {
    serie: 'COMPROBANTES CONTABLES',
    reglas: [
      { palabras: ['comprobante', 'contabilidad'],     subserie: 'Comprobantes de contabilidad' },
      { palabras: ['comprobante', 'egreso'],           subserie: 'Comprobantes de egreso' },
      { palabras: ['comprobante', 'ingreso'],          subserie: 'Comprobantes de ingreso' },
      { palabras: ['comprobante'],                     subserie: 'Comprobantes contables' }
    ]
  },

  // ── CONCEPTOS TÉCNICOS ─────────────────────────
  // Fuente: Floridablanca 101
  {
    serie: 'CONCEPTOS TÉCNICOS',
    reglas: [
      { palabras: ['concepto', 'urbanistico'],         subserie: 'Conceptos de control urbanístico' },
      { palabras: ['concepto', 'geografico'],          subserie: 'Conceptos de información geográfica' },
      { palabras: ['concepto', 'pot'],                 subserie: 'Conceptos de plan de ordenamiento territorial' },
      { palabras: ['concepto', 'viabilidad'],          subserie: 'Conceptos de viabilidad de uso' },
      { palabras: ['concepto', 'juridico'],            subserie: 'Conceptos jurídicos' },
      { palabras: ['concepto', 'tecnico'],             subserie: 'Conceptos técnicos' },
      { palabras: ['concepto'],                        subserie: 'Conceptos' },
      { palabras: ['dictamen'],                        subserie: 'Dictámenes' }
    ]
  },

  // ── CONTRATOS ──────────────────────────────────
  // Fuente: Floridablanca 103 / Pitalito
  {
    serie: 'CONTRATOS',
    reglas: [
      { palabras: ['contrato', 'prestacion'],          subserie: 'Contratos de prestación de servicios' },
      { palabras: ['contrato', 'obra'],                subserie: 'Contratos de obra' },
      { palabras: ['contrato', 'suministro'],          subserie: 'Contratos de suministro' },
      { palabras: ['contrato', 'consultoria'],         subserie: 'Contratos de consultoría e interventoría' },
      { palabras: ['contrato', 'interventoria'],       subserie: 'Contratos de consultoría e interventoría' },
      { palabras: ['contrato', 'interadministrativo'], subserie: 'Contratos interadministrativos' },
      { palabras: ['contrato', 'concesion'],           subserie: 'Contratos de concesión' },
      { palabras: ['contrato', 'arrendamiento'],       subserie: 'Contratos de arrendamiento' },
      { palabras: ['contrato', 'comodato'],            subserie: 'Contratos de comodato' },
      { palabras: ['contrato'],                        subserie: 'Contratos' },
      { palabras: ['convenio'],                        subserie: 'Convenios' },
      { palabras: ['licitacion'],                      subserie: 'Licitaciones públicas' },
      { palabras: ['minima', 'cuantia'],               subserie: 'Contratos de mínima cuantía' }
    ]
  },

  // ── HISTORIAS ──────────────────────────────────
  // CORRECCIÓN: "Historias laborales" es SUBSERIE, no serie
  // Serie correcta: HISTORIAS
  // Fuente: criterio archivístico AGN + Pitalito
  {
    serie: 'HISTORIAS',
    reglas: [
      { palabras: ['historia', 'laboral', 'docente'],  subserie: 'Historias laborales docentes' },
      { palabras: ['historia', 'laboral'],             subserie: 'Historias laborales' },
      { palabras: ['historia', 'clinica'],             subserie: 'Historias clínicas' },
      { palabras: ['historia', 'vehiculo'],            subserie: 'Historias de vehículos' },
      { palabras: ['historia', 'bien'],                subserie: 'Historias de bienes muebles' },
      { palabras: ['historia', 'informatico'],         subserie: 'Historias de bienes informáticos' },
      { palabras: ['historia', 'equipo'],              subserie: 'Historial de equipos tecnológicos' },
      { palabras: ['historial', 'vehiculo'],           subserie: 'Historial de vehículos' },
      { palabras: ['historial', 'equipo'],             subserie: 'Historial de equipos tecnológicos' },
      { palabras: ['hoja', 'vida'],                    subserie: 'Hojas de vida' },
      { palabras: ['expediente', 'personal'],          subserie: 'Historias laborales' },
      { palabras: ['vinculacion'],                     subserie: 'Historias laborales' },
      { palabras: ['nombramiento'],                    subserie: 'Historias laborales' }
    ]
  },

  // ── INFORMES ───────────────────────────────────
  // Fuente: Floridablanca 101, 104, 105, 107 / Pitalito
  // AG: 1-2 años | AC: 4-9 años | CT
  {
    serie: 'INFORMES',
    reglas: [
      { palabras: ['informe', 'gestion'],              subserie: 'Informes de gestión' },
      { palabras: ['informe', 'control'],              subserie: 'Informes entes de control' },
      { palabras: ['informe', 'ente', 'control'],      subserie: 'Informes entes de control' },
      { palabras: ['informe', 'contraloria'],          subserie: 'Informes entes de control' },
      { palabras: ['informe', 'procuraduria'],         subserie: 'Informes entes de control' },
      { palabras: ['informe', 'publico'],              subserie: 'Informes a entes públicos' },
      { palabras: ['rendicion', 'cuenta'],             subserie: 'Informes de rendición de cuentas' },
      { palabras: ['informe', 'chip'],                 subserie: 'Informes CHIP' },
      { palabras: ['informe', 'regalias'],             subserie: 'Informes sistema general de regalías' },
      { palabras: ['informe', 'presupuesto'],          subserie: 'Informes de presupuesto' },
      { palabras: ['informe', 'auditoria'],            subserie: 'Informes de auditoría' },
      { palabras: ['informe', 'tecnico'],              subserie: 'Informes técnicos' },
      { palabras: ['informe', 'seguimiento'],          subserie: 'Informes de seguimiento' },
      { palabras: ['informe'],                         subserie: 'Informes' }
    ]
  },

  // ── INSTRUMENTOS ARCHIVÍSTICOS ─────────────────
  // Fuente: Pitalito
  {
    serie: 'INSTRUMENTOS ARCHIVÍSTICOS',
    reglas: [
      { palabras: ['tabla', 'retencion'],              subserie: 'Tabla de retención documental' },
      { palabras: ['cuadro', 'clasificacion'],         subserie: 'Cuadro de clasificación documental' },
      { palabras: ['tabla', 'valoracion'],             subserie: 'Tabla de valoración documental' },
      { palabras: ['programa', 'gestion', 'documental'], subserie: 'Programa de gestión documental' },
      { palabras: ['inventario', 'documental'],        subserie: 'Inventarios documentales' },
      { palabras: ['pinar'],                           subserie: 'PINAR' }
    ]
  },

  // ── LICENCIAS Y PERMISOS ───────────────────────
  // Fuente: Floridablanca 101 / Pitalito
  {
    serie: 'LICENCIAS Y PERMISOS',
    reglas: [
      { palabras: ['licencia', 'construccion'],        subserie: 'Licencias de construcción' },
      { palabras: ['licencia', 'espacio', 'publico'],  subserie: 'Licencias de espacio público' },
      { palabras: ['licencia', 'ambiental'],           subserie: 'Licencias ambientales' },
      { palabras: ['permiso', 'mineria'],              subserie: 'Permisos mineros' },
      { palabras: ['permiso', 'subsistencia'],         subserie: 'Permisos mineros de subsistencia' },
      { palabras: ['permiso', 'ambiental'],            subserie: 'Permisos ambientales' },
      { palabras: ['permiso', 'funcionamiento'],       subserie: 'Permisos de funcionamiento' },
      { palabras: ['permiso', 'trasteo'],              subserie: 'Permisos de trasteo' },
      { palabras: ['permiso'],                         subserie: 'Permisos' },
      { palabras: ['licencia'],                        subserie: 'Licencias' },
      { palabras: ['autorizacion'],                    subserie: 'Autorizaciones' }
    ]
  },

  // ── MANUALES ───────────────────────────────────
  // Fuente: Pitalito
  {
    serie: 'MANUALES',
    reglas: [
      { palabras: ['manual', 'sistema'],               subserie: 'Manuales de sistemas de información' },
      { palabras: ['manual', 'infraestructura'],       subserie: 'Manuales de infraestructura tecnológica' },
      { palabras: ['manual', 'seguridad'],             subserie: 'Manuales de seguridad informática' },
      { palabras: ['manual', 'procedimiento'],         subserie: 'Manuales de procedimientos' },
      { palabras: ['manual', 'funcion'],               subserie: 'Manuales de funciones' },
      { palabras: ['manual'],                          subserie: 'Manuales' }
    ]
  },

  // ── PLANES ─────────────────────────────────────
  // Fuente: Floridablanca 101, 104, 105 / Pitalito
  // AG: 1 año | AC: 4-9 años | CT
  {
    serie: 'PLANES',
    reglas: [
      { palabras: ['plan', 'desarrollo'],              subserie: 'Plan de desarrollo municipal' },
      { palabras: ['plan', 'ordenamiento'],            subserie: 'Plan de ordenamiento territorial - POT' },
      { palabras: ['plan', 'parcial'],                 subserie: 'Planes parciales de ordenamiento territorial' },
      { palabras: ['plan', 'accion'],                  subserie: 'Planes de acción' },
      { palabras: ['plan', 'mejoramiento'],            subserie: 'Planes de mejoramiento' },
      { palabras: ['plan', 'emergencia'],              subserie: 'Planes de emergencia' },
      { palabras: ['plan', 'riesgo'],                  subserie: 'Planes de gestión de riesgo de desastres' },
      { palabras: ['plan', 'ambiental'],               subserie: 'Plan ambiental y mitigación del riesgo' },
      { palabras: ['plan', 'salud'],                   subserie: 'Plan territorial de salud' },
      { palabras: ['plan', 'tic'],                     subserie: 'Plan estratégico TIC' },
      { palabras: ['plan', 'seguridad', 'informacion'], subserie: 'Plan de seguridad de la información' },
      { palabras: ['plan', 'capacitacion'],            subserie: 'Planes de capacitación' },
      { palabras: ['plan', 'inversion'],               subserie: 'Planes de inversión' },
      { palabras: ['plan'],                            subserie: 'Planes' }
    ]
  },

  // ── PROCESOS ───────────────────────────────────
  // CORRECCIÓN: "Procesos disciplinarios" es SUBSERIE
  // Serie correcta: PROCESOS
  // Fuente: Floridablanca 106 / Pitalito
  {
    serie: 'PROCESOS',
    reglas: [
      { palabras: ['proceso', 'disciplinario'],        subserie: 'Procesos disciplinarios' },
      { palabras: ['proceso', 'judicial'],             subserie: 'Procesos judiciales' },
      { palabras: ['proceso', 'tributario'],           subserie: 'Procesos tributarios' },
      { palabras: ['proceso', 'consumidor'],           subserie: 'Procesos de protección al consumidor' },
      { palabras: ['proceso', 'coactivo'],             subserie: 'Procesos de cobro coactivo' },
      { palabras: ['proceso', 'administrativo'],       subserie: 'Procesos administrativos' },
      { palabras: ['proceso', 'bono', 'pensional'],    subserie: 'Procesos bono pensional' },
      { palabras: ['proceso', 'traslado'],             subserie: 'Procesos orden de traslado' },
      { palabras: ['investigacion', 'disciplinaria'],  subserie: 'Procesos disciplinarios' }
    ]
  },

  // ── PROGRAMAS ──────────────────────────────────
  // Fuente: Floridablanca 101, 104 / Pitalito
  // Serie independiente de PLANES
  {
    serie: 'PROGRAMAS',
    reglas: [
      { palabras: ['programa', 'meci'],                subserie: 'Programa modelo estándar de control interno' },
      { palabras: ['programa', 'pgirs'],               subserie: 'Programas PGIRS' },
      { palabras: ['programa', 'sisben'],              subserie: 'Programa SISBEN' },
      { palabras: ['programa', 'alimentacion'],        subserie: 'Programa de alimentación y nutrición' },
      { palabras: ['programa', 'vacunacion'],          subserie: 'Programa de vacunación' },
      { palabras: ['programa', 'discapacidad'],        subserie: 'Programa de atención a discapacitados' },
      { palabras: ['programa'],                        subserie: 'Programas' }
    ]
  },

  // ── PROYECTOS ─────────────────────────────────
  // Fuente: Floridablanca 101 / Pitalito
  {
    serie: 'PROYECTOS',
    reglas: [
      { palabras: ['proyecto', 'inversion'],           subserie: 'Proyectos de inversión' },
      { palabras: ['proyecto', 'banco'],               subserie: 'Proyectos inscritos en el banco de proyectos' },
      { palabras: ['proyecto', 'vivienda'],            subserie: 'Proyectos de vivienda' },
      { palabras: ['proyecto', 'infraestructura'],     subserie: 'Proyectos de infraestructura' },
      { palabras: ['proyecto', 'educativo'],           subserie: 'Proyectos educativos' },
      { palabras: ['proyecto'],                        subserie: 'Proyectos' }
    ]
  },

  // ── PQRS ───────────────────────────────────────
  // DERECHOS DE PETICIÓN = subserie de PQRS (criterio del usuario)
  {
    serie: 'PQRS',
    reglas: [
      { palabras: ['derecho', 'peticion'],             subserie: 'Derechos de petición' },
      { palabras: ['peticion'],                        subserie: 'Derechos de petición' },
      { palabras: ['queja'],                           subserie: 'Quejas y reclamos' },
      { palabras: ['reclamo'],                         subserie: 'Quejas y reclamos' },
      { palabras: ['denuncia'],                        subserie: 'Denuncias' },
      { palabras: ['sugerencia'],                      subserie: 'Sugerencias' },
      { palabras: ['pqrs'],                            subserie: 'PQRS' }
    ]
  }

]

// ===================================================
// NORMALIZACIÓN
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

function tokenizar(texto) {
  return normalizar(texto)
    .split(' ')
    .map(t => (t.endsWith('s') && t.length > 4) ? t.slice(0, -1) : t)
}

function extraerTipologias(texto) {
  if (!texto) return []
  return texto.split('\n').map(x => x.trim()).filter(Boolean)
}

function detectarPatronDocumental(tipologia) {
  const t = normalizar(tipologia)
  if (t.startsWith('certificado'))   return { serie: 'CERTIFICADOS' }
  if (t.startsWith('acta de'))       return { serie: 'ACTAS' }
  if (t.startsWith('informe de'))    return { serie: 'INFORMES' }
  if (t.startsWith('concepto'))      return { serie: 'CONCEPTOS TÉCNICOS' }
  if (t.startsWith('permiso de'))    return { serie: 'LICENCIAS Y PERMISOS' }
  if (t.startsWith('licencia de'))   return { serie: 'LICENCIAS Y PERMISOS' }
  if (t.startsWith('proyecto de'))   return { serie: 'PROYECTOS' }
  if (t.startsWith('comprobante'))   return { serie: 'COMPROBANTES CONTABLES' }
  return null
}

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
// CAPA 4: CATÁLOGO BD
// ===================================================

async function buscarEnCatalogo(db, tokensTexto) {
  if (!db) return null
  try {
    const tokens = tokensTexto.filter(t => t.length > 3).slice(0, 8)
    if (tokens.length === 0) return null
    const result = await db.query(
      `SELECT serie, subserie, gestion, central, disposicion, score
       FROM trd_buscar_clasificacion($1)
       WHERE score > 0 LIMIT 1`,
      [tokens]
    )
    if (!result.rows || result.rows.length === 0) return null
    const mejor = result.rows[0]
    const score = Number(mejor.score || 0)
    if (score < 2) return null
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
// CAPA 0: GPT-4o (OpenAI)
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

  const prompt = `Eres un experto archivista colombiano con dominio del Acuerdo 004 de 2019 del AGN y la Ley 594 de 2000.

SERIES VÁLIDAS para alcaldías colombianas (úsalas siempre que aplique):
ACCIONES CONSTITUCIONALES, ACTAS, ACTOS ADMINISTRATIVOS, AUDITORÍAS, BASES DE DATOS, BOLETINES, CERTIFICADOS, COBROS COACTIVOS, COMUNICACIONES OFICIALES, COMPROBANTES CONTABLES, CONCEPTOS TÉCNICOS, CONTRATOS, HISTORIAS, INFORMES, INSTRUMENTOS ARCHIVÍSTICOS, LICENCIAS Y PERMISOS, MANUALES, PLANES, PROCESOS, PROGRAMAS, PROYECTOS, PQRS

REGLAS CRÍTICAS:
- Las series se nombran por FUNCIÓN, nunca por nombre de dependencia
- "Historias laborales" es SUBSERIE de HISTORIAS, no una serie
- "Procesos disciplinarios" es SUBSERIE de PROCESOS, no una serie
- "Gestión ambiental" NO es una serie, es una dependencia
- "Derechos de petición" es SUBSERIE de PQRS

CONTEXTO DEPENDENCIA:
- Tipo de función: ${cfg.tipo_funcion || 'No especificado'}
- Descripción: ${cfg.descripcion_funcional || 'No especificada'}

ACTIVIDAD:
- Nombre: ${actividad.nombre || 'Sin nombre'}
- Documentos generados: ${actividad.documentos_generados || 'No especificado'}
- Documentos requeridos: ${actividad.recepcion_externa || 'No especificado'}

Responde ÚNICAMENTE con JSON válido:
{
  "serie_documental": "NOMBRE EN MAYÚSCULAS",
  "subserie_documental": "Nombre de la subserie",
  "retencion_gestion": número,
  "retencion_central": número,
  "disposicion_final": "conservacion_total"|"eliminacion"|"seleccion"|"medio_tecnico",
  "confianza": número_entre_0_y_1
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
        temperature: 0.1,
        messages: [
          { role: 'system', content: 'Eres archivista colombiano. Responde solo JSON.' },
          { role: 'user',   content: prompt }
        ]
      })
    })
    if (!response.ok) return null
    const json   = await response.json()
    const texto  = json.choices?.[0]?.message?.content || ''
    const limpio = texto.replace(/```json/gi, '').replace(/```/g, '').trim()
    const result = JSON.parse(limpio)
    if (!result.serie_documental) return null
    return {
      serie_sugerida:    { nombre: result.serie_documental },
      subserie_sugerida: { nombre: result.subserie_documental || null },
      retencion_gestion: result.retencion_gestion || null,
      retencion_central: result.retencion_central || null,
      disposicion_final: result.disposicion_final || null,
      confianza:         result.confianza || 0.85,
      origen:            'gpt-4o'
    }
  } catch (err) {
    console.error('Error capa 0 GPT-4o:', err.message)
    return null
  }
}

// ===================================================
// MOTOR PRINCIPAL
// ===================================================

export async function sugerirSerieDesdeActividad(actividad = {}, configuracionDependencia = null, db = null) {

  const texto = normalizar(`
    ${actividad.nombre               || ''}
    ${actividad.descripcion          || ''}
    ${actividad.descripcion_funcional || ''}
    ${actividad.documentos_generados  || ''}
    ${actividad.recepcion_externa     || ''}
  `)

  const tokensTexto = tokenizar(texto)

  console.log('\n========== TRD-AI V5 ==========')
  console.log('Actividad:', actividad.nombre)

  // ---------------------------------------------------
  // CAPA 0: GPT-4o
  // ---------------------------------------------------
  const resultadoIA = await llamarOpenAI(actividad, configuracionDependencia)
  if (resultadoIA) {
    console.log('Capa 0 GPT-4o:', resultadoIA.serie_sugerida.nombre)
    return resultadoIA
  }

  const tipologias = extraerTipologias(actividad.documentos_generados)

  // ---------------------------------------------------
  // CAPA 1A: nombre de la actividad (prioridad alta)
  // ---------------------------------------------------
  const MAPA_NOMBRE_DIRECTO = [
    { palabras: ['tutela'],                     serie: 'ACCIONES CONSTITUCIONALES', subserie: 'Acciones de tutela' },
    { palabras: ['accion', 'popular'],          serie: 'ACCIONES CONSTITUCIONALES', subserie: 'Acciones populares' },
    { palabras: ['accion', 'cumplimiento'],     serie: 'ACCIONES CONSTITUCIONALES', subserie: 'Acciones de cumplimiento' },
    { palabras: ['derecho', 'peticion'],        serie: 'PQRS',                       subserie: 'Derechos de petición' },
    { palabras: ['queja'],                      serie: 'PQRS',                       subserie: 'Quejas y reclamos' },
    { palabras: ['contrato', 'prestacion'],     serie: 'CONTRATOS',                  subserie: 'Contratos de prestación de servicios' },
    { palabras: ['contrato', 'obra'],           serie: 'CONTRATOS',                  subserie: 'Contratos de obra' },
    { palabras: ['historia', 'laboral'],        serie: 'HISTORIAS',                  subserie: 'Historias laborales' },
    { palabras: ['hoja', 'vida'],               serie: 'HISTORIAS',                  subserie: 'Hojas de vida' },
    { palabras: ['proceso', 'disciplinario'],   serie: 'PROCESOS',                   subserie: 'Procesos disciplinarios' },
    { palabras: ['proceso', 'judicial'],        serie: 'PROCESOS',                   subserie: 'Procesos judiciales' },
    { palabras: ['licencia', 'construccion'],   serie: 'LICENCIAS Y PERMISOS',       subserie: 'Licencias de construcción' },
    { palabras: ['plan', 'desarrollo'],         serie: 'PLANES',                     subserie: 'Plan de desarrollo municipal' },
    { palabras: ['plan', 'ordenamiento'],       serie: 'PLANES',                     subserie: 'Plan de ordenamiento territorial - POT' },
    { palabras: ['rendicion', 'cuenta'],        serie: 'INFORMES',                   subserie: 'Informes de rendición de cuentas' },
    { palabras: ['auditoria', 'interna'],       serie: 'AUDITORÍAS',                 subserie: 'Auditorías internas' },
    { palabras: ['auditoria', 'externa'],       serie: 'AUDITORÍAS',                 subserie: 'Auditorías externas' },
    { palabras: ['boletin', 'prensa'],          serie: 'BOLETINES',                  subserie: 'Boletines de prensa' },
    { palabras: ['proyecto', 'inversion'],      serie: 'PROYECTOS',                  subserie: 'Proyectos de inversión' },
    { palabras: ['cobro', 'coactivo'],          serie: 'COBROS COACTIVOS',           subserie: 'Cobros coactivos' },
    { palabras: ['tabla', 'retencion'],         serie: 'INSTRUMENTOS ARCHIVÍSTICOS', subserie: 'Tabla de retención documental' },
    { palabras: ['programa', 'sisben'],         serie: 'PROGRAMAS',                  subserie: 'Programa SISBEN' },
  ]

  const tokensNombre = tokenizar(actividad.nombre || '')
  for (const entrada of MAPA_NOMBRE_DIRECTO) {
    const coincidencias = entrada.palabras.filter(p => tokensNombre.includes(p))
    if (coincidencias.length === entrada.palabras.length) {
      console.log('Capa 1A — nombre:', entrada.serie, '→', entrada.subserie)
      return {
        serie_sugerida:    { nombre: entrada.serie },
        subserie_sugerida: { nombre: entrada.subserie },
        confianza: 0.95,
        origen: 'nombre_actividad'
      }
    }
  }

  // ---------------------------------------------------
  // CAPA 1B: tipologías documentales
  // ---------------------------------------------------
  const TIPOLOGIAS_IGNORAR = ['registro de asistencia', 'registros', 'solicitudes', 'comunicaciones', 'oficios']
  const tipologiasFiltradas = tipologias.filter(t => {
    const tn = normalizar(t)
    return !TIPOLOGIAS_IGNORAR.some(i => tn === i || tn.startsWith(i))
  })

  for (const tipologia of tipologiasFiltradas) {
    const patron = detectarPatronDocumental(tipologia)
    if (patron) {
      console.log('Capa 1B — tipología:', patron.serie)
      return {
        serie_sugerida:    { nombre: patron.serie },
        subserie_sugerida: { nombre: tipologia },
        confianza: 0.85,
        origen: 'patron'
      }
    }
  }

  // ---------------------------------------------------
  // CAPAS 2-3: matriz archivística
  // ---------------------------------------------------
  let mejor      = null
  let mejorScore = 0

  for (const serie of MATRIZ_SERIES) {
    const reglas = serie.reglas || serie.reblas || [] // typo safety
    for (const regla of reglas) {
      const score = calcularScore(tokensTexto, regla.palabras)
      if (score > mejorScore) {
        mejorScore = score
        mejor = { serie: serie.serie, subserie: regla.subserie }
      }
    }
  }

  if (mejorScore >= 0.4) {
    console.log('Capa 2-3 — matriz:', mejor.serie, 'score:', mejorScore)
    return {
      serie_sugerida:    { nombre: mejor.serie },
      subserie_sugerida: { nombre: mejor.subserie },
      confianza: Number((0.65 + mejorScore * 0.25).toFixed(2)),
      origen: 'matriz'
    }
  }

  // ---------------------------------------------------
  // CAPA 4: catálogo BD
  // ---------------------------------------------------
  const resultadoCatalogo = await buscarEnCatalogo(db, tokensTexto)
  if (resultadoCatalogo) {
    console.log('Capa 4 — catálogo:', resultadoCatalogo.serie_sugerida.nombre)
    return resultadoCatalogo
  }

  // ---------------------------------------------------
  // FALLBACK
  // ---------------------------------------------------
  console.log('Fallback — sin coincidencia')
  return {
    serie_sugerida:    { nombre: 'DOCUMENTACIÓN GENERAL' },
    subserie_sugerida: { nombre: null },
    confianza: 0.4,
    origen: 'fallback'
  }
}

// ===================================================
// RETENCIÓN BASE
// ===================================================

export function sugerirRetencionAutomatica({ tipo_funcion, nivel_riesgo }) {
  if (!tipo_funcion || !nivel_riesgo) {
    return { gestion: 2, central: 3, disposicion: 'eliminacion', justificacion: 'Regla por defecto', nivel_confianza: 0.5 }
  }
  const tipo  = tipo_funcion.toLowerCase().trim()
  const riesgo = nivel_riesgo.toLowerCase().trim()
  const regla  = MATRIZ_RETENCION[tipo]?.[riesgo]
  if (!regla) {
    return { gestion: 2, central: 3, disposicion: 'eliminacion', justificacion: 'Regla por defecto', nivel_confianza: 0.5 }
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
// RETENCIÓN CONTEXTUAL
// ===================================================

export function sugerirRetencionContextual(contexto = {}) {
  const { tipo_funcion, nivel_riesgo, impacto_juridico, funcion_permanente, requiere_conservacion, soporte_principal, confianza_lexica } = contexto
  let resultado   = sugerirRetencionAutomatica({ tipo_funcion, nivel_riesgo })
  let gestion     = resultado.gestion
  let central     = resultado.central
  let disposicion = resultado.disposicion
  let confianza   = resultado.nivel_confianza
  let justificaciones = [resultado.justificacion]

  if (impacto_juridico === 'alto')       { gestion += 2; central += 5; confianza += 0.1; justificaciones.push('Impacto jurídico alto') }
  if (funcion_permanente === 'si')       { disposicion = 'seleccion'; confianza += 0.05; justificaciones.push('Actividad permanente') }
  if (requiere_conservacion === 'si')    { disposicion = 'conservacion_total'; central += 5; confianza += 0.1; justificaciones.push('Conservación requerida') }
  if (soporte_principal === 'fisico')    { gestion += 1 }
  if (confianza_lexica >= 0.6)           { confianza += 0.1 }

  return {
    gestion,
    central,
    disposicion,
    justificacion:   justificaciones.join('. '),
    nivel_confianza: Number(Math.min(Math.max(confianza, 0.4), 0.95).toFixed(2))
  }
}