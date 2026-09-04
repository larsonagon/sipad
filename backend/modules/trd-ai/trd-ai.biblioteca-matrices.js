// =====================================================
// SIPAD · Matrices de referencia por tipo de entidad
// -----------------------------------------------------
// Estructuras base series → subseries con valoración sugerida
// (AG/AC en años, disposición CT|E|S|M y fundamento) para tipos
// de entidad cuyas series NO están en la matriz de alcaldía.
//
// IMPORTANTE: son un PUNTO DE PARTIDA referencial. Cada entidad
// debe ajustar tiempos, disposición y fundamento a su realidad y
// a la normatividad vigente antes de llevarlas al comité.
//
// Disposición: CT=Conservación total · E=Eliminación · S=Selección · M=Medio técnico
// =====================================================

// Series administrativas comunes a la mayoría de entidades públicas.
const ADMIN_COMUNES = [
  { serie: 'ACTOS ADMINISTRATIVOS', subseries: [
    { subserie: 'Resoluciones', ag: 2, ac: 8, disposicion: 'CT', fundamento: 'Valor administrativo y jurídico permanente; conservación total (Ley 594 de 2000).' },
    { subserie: 'Acuerdos', ag: 2, ac: 8, disposicion: 'CT', fundamento: 'Valor normativo permanente; conservación total.' }
  ]},
  { serie: 'CONTRATOS', subseries: [
    { subserie: 'Contratos de prestación de servicios', ag: 2, ac: 18, disposicion: 'S', fundamento: 'Cumplido el término legal y de garantías, se selecciona una muestra; el remanente se elimina (Acuerdo AGN 004 de 2019).' },
    { subserie: 'Contratos de suministro', ag: 2, ac: 18, disposicion: 'S', fundamento: 'Selección tras vencer garantías y término contable (Acuerdo AGN 004 de 2019).' }
  ]},
  { serie: 'HISTORIAS LABORALES', subseries: [
    { subserie: null, ag: 5, ac: 80, disposicion: 'CT', fundamento: 'Soportan derechos pensionales y prestacionales; conservación total por su valor probatorio para el trabajador.' }
  ]},
  { serie: 'COMPROBANTES CONTABLES', subseries: [
    { subserie: 'Comprobantes de egreso', ag: 2, ac: 8, disposicion: 'E', fundamento: 'Cumplida la prescripción contable y fiscal, se eliminan previo inventario publicado 60 días (Acuerdo AGN 004 de 2019).' }
  ]},
  { serie: 'NÓMINA', subseries: [
    { subserie: null, ag: 2, ac: 18, disposicion: 'S', fundamento: 'Se selecciona una muestra por su valor para la reconstrucción de derechos; el resto se elimina.' }
  ]},
  { serie: 'CORRESPONDENCIA', subseries: [
    { subserie: 'Comunicaciones oficiales enviadas', ag: 2, ac: 3, disposicion: 'S', fundamento: 'Selección de comunicaciones con valor informativo; el resto se elimina.' },
    { subserie: 'Comunicaciones oficiales recibidas', ag: 2, ac: 3, disposicion: 'S', fundamento: 'Selección de comunicaciones con valor informativo; el resto se elimina.' }
  ]},
  { serie: 'INFORMES', subseries: [
    { subserie: 'Informes de gestión', ag: 2, ac: 8, disposicion: 'CT', fundamento: 'Reflejan la gestión institucional; valor secundario, conservación total.' }
  ]},
  { serie: 'PLANES', subseries: [
    { subserie: 'Planes de acción', ag: 2, ac: 8, disposicion: 'CT', fundamento: 'Valor evidencial de la planeación institucional; conservación total.' }
  ]},
  { serie: 'PROCESOS JUDICIALES', subseries: [
    { subserie: null, ag: 2, ac: 18, disposicion: 'CT', fundamento: 'Valor jurídico y probatorio; conservación total del expediente del proceso.' }
  ]}
]

const MATRICES_REFERENCIA = {

  // ---------- ESE / Hospital (Empresa Social del Estado) ----------
  ese_hospital: {
    tipo: 'ese_hospital',
    nombre: 'ESE / Hospital (Empresa Social del Estado)',
    descripcion:
      'Estructura base para una Empresa Social del Estado (hospital público). Incluye series ' +
      'misionales de salud (historias clínicas, RIPS, facturación) y administrativas comunes, con ' +
      'valoración sugerida (Ley 594/2000, Resolución 839 de 2017 de Minsalud para historias clínicas, ' +
      'Acuerdo AGN 004 de 2019). Ajuste a su ESE antes del comité.',
    series: [
      { serie: 'HISTORIAS CLÍNICAS', subseries: [
        { subserie: 'Historias clínicas de hospitalización', ag: 5, ac: 15, disposicion: 'S', fundamento: 'Retención mínima de 15 años desde la última atención (Resolución 839 de 2017, Minsalud). Vencido el término se selecciona una muestra con valor científico/epidemiológico; el resto se elimina.' },
        { subserie: 'Historias clínicas de urgencias', ag: 5, ac: 15, disposicion: 'S', fundamento: 'Retención mínima 15 años (Resolución 839 de 2017). Selección de muestra representativa; el remanente se elimina.' },
        { subserie: 'Historias clínicas de consulta externa', ag: 5, ac: 15, disposicion: 'S', fundamento: 'Retención mínima 15 años (Resolución 839 de 2017). Selección de muestra; el resto se elimina.' }
      ]},
      { serie: 'CONSENTIMIENTOS INFORMADOS', subseries: [
        { subserie: null, ag: 5, ac: 15, disposicion: 'S', fundamento: 'Documento anexo a la historia clínica; sigue su misma retención (Resolución 839 de 2017) y disposición por selección.' }
      ]},
      { serie: 'REGISTROS INDIVIDUALES DE PRESTACIÓN DE SERVICIOS DE SALUD', subseries: [
        { subserie: 'RIPS', ag: 2, ac: 8, disposicion: 'S', fundamento: 'Valor estadístico y epidemiológico; se selecciona una muestra, el resto se elimina cumplida la retención.' }
      ]},
      { serie: 'FACTURACIÓN DE SERVICIOS DE SALUD', subseries: [
        { subserie: 'Facturas de servicios de salud', ag: 2, ac: 8, disposicion: 'E', fundamento: 'Cumplida la prescripción contable/fiscal y depuradas las glosas, se eliminan previo inventario publicado 60 días (Acuerdo AGN 004 de 2019).' },
        { subserie: 'Glosas y respuestas', ag: 2, ac: 8, disposicion: 'E', fundamento: 'Soporte de conciliación de cartera; se elimina cumplida la prescripción.' }
      ]},
      { serie: 'BASES DE DATOS DE USUARIOS', subseries: [
        { subserie: null, ag: 2, ac: 8, disposicion: 'S', fundamento: 'Datos de afiliados/usuarios; selección con criterios de valor secundario, protegiendo datos personales (Ley 1581 de 2012).' }
      ]},
      { serie: 'ACTAS', subseries: [
        { subserie: 'Actas del comité de infecciones', ag: 2, ac: 8, disposicion: 'CT', fundamento: 'Valor evidencial de la seguridad del paciente; conservación total.' },
        { subserie: 'Actas del comité de farmacia y terapéutica', ag: 2, ac: 8, disposicion: 'CT', fundamento: 'Valor técnico-científico institucional; conservación total.' },
        { subserie: 'Actas del comité de ética hospitalaria', ag: 2, ac: 8, disposicion: 'CT', fundamento: 'Valor institucional permanente; conservación total.' }
      ]},
      { serie: 'PROGRAMAS', subseries: [
        { subserie: 'Programa de seguridad del paciente', ag: 2, ac: 8, disposicion: 'CT', fundamento: 'Instrumento misional de calidad; conservación total.' },
        { subserie: 'Programa de auditoría para el mejoramiento de la calidad (PAMEC)', ag: 2, ac: 8, disposicion: 'CT', fundamento: 'Evidencia del sistema de calidad; conservación total.' }
      ]},
      ...ADMIN_COMUNES
    ]
  },

  // ---------- Organismo de Tránsito (IMTT / Secretaría de Movilidad) ----------
  transito: {
    tipo: 'transito',
    nombre: 'Organismo de Tránsito y Transporte',
    descripcion:
      'Estructura base para un organismo de tránsito (instituto o secretaría de movilidad). Incluye ' +
      'series misionales de tránsito (licencias, matrículas, comparendos, registro automotor) y ' +
      'administrativas comunes, con valoración sugerida (Ley 594/2000, Ley 769 de 2002 Código Nacional ' +
      'de Tránsito, Acuerdo AGN 004 de 2019). Ajuste a su entidad antes del comité.',
    series: [
      { serie: 'LICENCIAS DE CONDUCCIÓN', subseries: [
        { subserie: 'Expedientes de licencia de conducción', ag: 2, ac: 18, disposicion: 'S', fundamento: 'Soporte del trámite y de la idoneidad del conductor; cumplida la retención se selecciona muestra, el resto se elimina.' }
      ]},
      { serie: 'LICENCIAS DE TRÁNSITO', subseries: [
        { subserie: 'Expedientes de matrícula de vehículos', ag: 2, ac: 20, disposicion: 'CT', fundamento: 'Registro histórico del automotor (Ley 769 de 2002); valor probatorio permanente, conservación total.' }
      ]},
      { serie: 'REGISTRO AUTOMOTOR', subseries: [
        { subserie: 'Traspasos y traslados de cuenta', ag: 2, ac: 20, disposicion: 'CT', fundamento: 'Traza la titularidad del vehículo; conservación total por su valor probatorio.' }
      ]},
      { serie: 'COMPARENDOS', subseries: [
        { subserie: 'Órdenes de comparendo', ag: 2, ac: 8, disposicion: 'S', fundamento: 'Cumplida la prescripción de la sanción y depurada la cartera, se selecciona muestra; el resto se elimina.' },
        { subserie: 'Expedientes contravencionales', ag: 2, ac: 8, disposicion: 'S', fundamento: 'Proceso contravencional resuelto y prescrito; selección de muestra representativa.' }
      ]},
      { serie: 'ACUERDOS DE PAGO', subseries: [
        { subserie: null, ag: 2, ac: 8, disposicion: 'E', fundamento: 'Cumplida la obligación y la prescripción, se eliminan previo inventario publicado 60 días (Acuerdo AGN 004 de 2019).' }
      ]},
      { serie: 'ACCIDENTES DE TRÁNSITO', subseries: [
        { subserie: 'Informes de accidentes de tránsito', ag: 2, ac: 18, disposicion: 'CT', fundamento: 'Valor probatorio y estadístico permanente para movilidad y seguridad vial; conservación total.' }
      ]},
      { serie: 'ESPECIES VENALES', subseries: [
        { subserie: 'Control de especies venales', ag: 2, ac: 8, disposicion: 'E', fundamento: 'Soporte de control de inventario de especies; se elimina cumplida la retención contable.' }
      ]},
      { serie: 'CURSOS PEDAGÓGICOS', subseries: [
        { subserie: 'Cursos de sensibilización a infractores', ag: 2, ac: 5, disposicion: 'E', fundamento: 'Soporte del descuento de la sanción; se elimina cumplida la retención.' }
      ]},
      ...ADMIN_COMUNES
    ]
  },
}

// =====================================================
// BANTER — Series y subseries COMUNES (transversales)
// -----------------------------------------------------
// SOLO NOMBRES normalizados, tomados del Banco Terminológico de
// series y subseries documentales comunes del AGN (subconjunto
// transversal, sin series misionales de un tipo de entidad).
// La VALORACIÓN NO se define aquí: la calcula el motor de SIPAD al
// precargar (criterio consistente y auditable), y la ajusta/aprueba
// el Comité. Concíliese con la versión vigente del Observatorio AGN.
// =====================================================
const BANTER_SERIES = [
  { serie: 'ACCIONES CONSTITUCIONALES', subseries: [
    'Acciones de tutela', 'Acciones de cumplimiento', 'Acciones populares', 'Acciones de grupo'
  ]},
  { serie: 'ACTAS', subseries: [
    'Actas de Comité Institucional de Gestión y Desempeño',
    'Actas de Comité Institucional de Coordinación de Control Interno',
    'Actas de Comité de Conciliación y Defensa Judicial',
    'Actas de Comité de Contratación',
    'Actas de Comité de Convivencia Laboral',
    'Actas de Comité Interno de Archivo',
    'Actas de Comité Paritario de Seguridad y Salud en el Trabajo',
    'Actas de Eliminación Documental',
    'Actas de Reunión'
  ]},
  { serie: 'ACTOS ADMINISTRATIVOS', subseries: [
    'Resoluciones', 'Decretos', 'Circulares'
  ]},
  { serie: 'ANTEPROYECTO DE PRESUPUESTO', subseries: [] },
  { serie: 'BOLETINES', subseries: ['Boletines Internos'] },
  { serie: 'COMISIONES', subseries: ['Comisiones de Servicios'] },
  { serie: 'COMPROBANTES CONTABLES', subseries: [
    'Comprobantes de Egreso', 'Comprobantes de Ingreso', 'Comprobantes de Diario'
  ]},
  { serie: 'CONCEPTOS', subseries: ['Conceptos Jurídicos', 'Conceptos Técnicos'] },
  { serie: 'CONTRATOS', subseries: [
    'Contratos de Prestación de Servicios', 'Contratos de Obra', 'Contratos de Suministro',
    'Contratos Interadministrativos', 'Contratos de Compraventa'
  ]},
  { serie: 'CONVENIOS', subseries: [
    'Convenios Interadministrativos', 'Convenios de Asociación', 'Convenios de Cooperación'
  ]},
  { serie: 'DERECHOS DE PETICIÓN', subseries: [] },
  { serie: 'ESTADOS FINANCIEROS', subseries: [] },
  { serie: 'HISTORIAS LABORALES', subseries: [] },
  { serie: 'INFORMES', subseries: [
    'Informes de Gestión', 'Informes a Entes de Control',
    'Informes a Otros Organismos del Estado', 'Informes de Auditorías Internas de Gestión'
  ]},
  { serie: 'INSTRUMENTOS ARCHIVÍSTICOS', subseries: [
    'Tablas de Retención Documental', 'Cuadros de Clasificación Documental',
    'Inventarios Documentales', 'Programa de Gestión Documental', 'Plan Institucional de Archivos'
  ]},
  { serie: 'MANUALES', subseries: [
    'Manuales de Funciones y Competencias Laborales', 'Manuales de Procesos y Procedimientos'
  ]},
  { serie: 'NÓMINA', subseries: [] },
  { serie: 'PETICIONES, QUEJAS, RECLAMOS, SUGERENCIAS Y DENUNCIAS', subseries: [
    'Peticiones', 'Quejas', 'Reclamos', 'Sugerencias', 'Denuncias'
  ]},
  { serie: 'PLANES', subseries: [
    'Planes de Acción', 'Planes Anticorrupción y de Atención al Ciudadano',
    'Planes Estratégicos Institucionales', 'Planes de Mejoramiento',
    'Planes del Modelo Integrado de Planeación y Gestión'
  ]},
  { serie: 'PROCESOS', subseries: [
    'Procesos Judiciales', 'Procesos de Conciliación Extrajudicial',
    'Procesos Administrativos Sancionatorios', 'Procesos Disciplinarios', 'Procesos de Cobro Coactivo'
  ]},
  { serie: 'PROGRAMAS', subseries: [
    'Programas de Seguridad y Salud en el Trabajo'
  ]},
  { serie: 'PROYECTOS', subseries: ['Proyectos de Inversión'] },
  { serie: 'REGISTROS', subseries: [
    'Registros de Activos de Información', 'Registros de Comunicaciones Oficiales'
  ]}
]

// =====================================================
// CAPA MISIONAL — procesos misionales por tipo de entidad
// -----------------------------------------------------
// Agrupa las series MISIONALES (las que distinguen a la entidad por
// su competencia legal) por el proceso misional que las produce y la
// dependencia productora típica. Sustituye la lectura de "mapa de
// procesos" cuando la entidad no lo tiene formalizado: el proceso
// misional se DEDUCE de la competencia legal (fundamento), no de un
// documento interno que pueda faltar.
//
// Las series NO listadas aquí se consideran transversales/comunes
// (viven en BANTER) y no llevan proceso misional. Esto evita duplicar:
// lo común está una sola vez, lo misional distingue por tipo.
//
// Estructura por tipo: [ { proceso, dependencia_productora, fundamento, series:[nombres de serie] } ]
// Cada proceso cita la norma que crea la competencia (candado anti-invención).
// =====================================================
const PROCESOS_MISIONALES = {

  alcaldia: [
    {
      proceso: 'Planeación y ordenamiento territorial',
      dependencia_productora: 'Secretaría de Planeación',
      fundamento: 'Competencia municipal de ordenar el desarrollo de su territorio y planear el desarrollo económico y social (Constitución art. 311 y 313.7; Ley 136 de 1994 art. 3; Ley 152 de 1994; Ley 388 de 1997).',
      series: ['PLANES', 'LICENCIAS Y PERMISOS', 'CERTIFICADOS', 'CONCEPTOS TÉCNICOS', 'PROYECTOS']
    },
    {
      proceso: 'Gestión tributaria y de rentas',
      dependencia_productora: 'Secretaría de Hacienda',
      fundamento: 'Potestad tributaria propia del municipio: administrar y recaudar sus tributos —impuesto predial unificado e industria y comercio— (Constitución art. 287 y 313.4; Ley 14 de 1983; Ley 44 de 1990; Decreto Ley 1333 de 1986). El cobro coactivo NO es misional: es un proceso (jurisdicción coactiva, Ley 1066 de 2006) transversal, va en la serie PROCESOS.',
      series: ['IMPUESTO PREDIAL UNIFICADO', 'INDUSTRIA Y COMERCIO']
    }
  ],

  ese_hospital: [
    {
      proceso: 'Atención en salud',
      dependencia_productora: 'Área asistencial / Gestión de la información clínica',
      fundamento: 'Prestación del servicio público de salud y manejo de la historia clínica del usuario (Ley 100 de 1993; Ley 23 de 1981; Resolución 1995 de 1999 y Resolución 839 de 2017 de Minsalud).',
      series: ['HISTORIAS CLÍNICAS', 'CONSENTIMIENTOS INFORMADOS', 'REGISTROS INDIVIDUALES DE PRESTACIÓN DE SERVICIOS DE SALUD']
    },
    {
      proceso: 'Garantía de la calidad y seguridad del paciente',
      dependencia_productora: 'Oficina de Calidad',
      fundamento: 'Sistema Obligatorio de Garantía de Calidad de la Atención en Salud (Decreto 1011 de 2006; Resolución 3100 de 2019 de Minsalud).',
      series: ['PROGRAMAS', 'ACTAS']
    },
    {
      proceso: 'Facturación y cartera de servicios de salud',
      dependencia_productora: 'Facturación',
      fundamento: 'Venta y recobro de servicios de salud a las EPS y a la ADRES (Ley 100 de 1993; Resolución 3047 de 2008 de Minsalud).',
      series: ['FACTURACIÓN DE SERVICIOS DE SALUD', 'BASES DE DATOS DE USUARIOS']
    }
  ],

  transito: [
    {
      proceso: 'Registro y control automotor y de conductores',
      dependencia_productora: 'Área de Registro',
      fundamento: 'Función de matrícula y registro de vehículos y conductores y su reporte al RUNT (Ley 769 de 2002, Código Nacional de Tránsito; Ley 1005 de 2006).',
      series: ['LICENCIAS DE TRÁNSITO', 'REGISTRO AUTOMOTOR', 'LICENCIAS DE CONDUCCIÓN', 'ESPECIES VENALES']
    },
    {
      proceso: 'Control operativo y régimen contravencional',
      dependencia_productora: 'Área Operativa / Contravenciones',
      fundamento: 'Vigilancia del tránsito e imposición y cobro de sanciones por infracciones (Ley 769 de 2002; Ley 1383 de 2010).',
      series: ['COMPARENDOS', 'ACCIDENTES DE TRÁNSITO', 'ACUERDOS DE PAGO', 'CURSOS PEDAGÓGICOS']
    }
  ]
}

// Normaliza un nombre de serie para comparar (sin tildes, minúsculas).
function normSerieMis(s) {
  return (s || '').toString().normalize('NFD').replace(/[̀-ͯ]/g, '')
    .trim().toLowerCase().replace(/\s+/g, ' ')
}

// Índice tipo → normSerie → { proceso_misional, dependencia_productora, fundamento_proceso }
function indiceMisional(tipo) {
  const procs = PROCESOS_MISIONALES[tipo] || []
  const idx = {}
  for (const p of procs) {
    for (const serie of p.series) {
      idx[normSerieMis(serie)] = {
        proceso_misional:       p.proceso,
        dependencia_productora: p.dependencia_productora,
        fundamento_proceso:     p.fundamento
      }
    }
  }
  return idx
}

// Lista de procesos misionales de un tipo (para la vista "por proceso").
function procesosMisionales(tipo) {
  return PROCESOS_MISIONALES[tipo] || []
}

// Anota una serie con su proceso misional si aplica; null si es transversal.
function anotarMisional(tipo, serie) {
  return indiceMisional(tipo)[normSerieMis(serie)] || null
}

export { MATRICES_REFERENCIA, BANTER_SERIES, PROCESOS_MISIONALES, procesosMisionales, anotarMisional }
