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

  // ---------- BANTER: series y subseries COMUNES (transversales) ----------
  // Núcleo común a casi toda entidad pública, basado en el Banco Terminológico
  // de series y subseries documentales comunes del AGN (BANTER). Referencial:
  // los tiempos y disposición son PROPUESTA (ajústelos y apruébelos en comité;
  // concílielos con la versión vigente del BANTER del Observatorio AGN).
  banter: {
    tipo: 'banter',
    nombre: 'BANTER — Series comunes (transversales)',
    descripcion:
      'Series y subseries documentales COMUNES a la administración pública colombiana, basadas en el ' +
      'Banco Terminológico del AGN (BANTER). Pensadas para precargarse en las dependencias que las producen ' +
      '(muchas oficinas manejan las mismas). Valoración de referencia según Ley 594/2000, Decreto 1080/2015 y ' +
      'Acuerdo AGN 004/2019; ajústela a la entidad y a la versión vigente del BANTER antes del comité.',
    series: [
      { serie: 'ACCIONES CONSTITUCIONALES', subseries: [
        { subserie: 'Acciones de tutela', ag: 2, ac: 8, disposicion: 'S', fundamento: 'Valor jurídico y probatorio; cumplida la retención se selecciona una muestra representativa por su valor secundario y el resto se elimina (Acuerdo AGN 004 de 2019).' },
        { subserie: 'Acciones de cumplimiento', ag: 2, ac: 8, disposicion: 'S', fundamento: 'Selección de muestra con valor secundario tras la retención; el resto se elimina.' },
        { subserie: 'Acciones populares', ag: 2, ac: 8, disposicion: 'S', fundamento: 'Selección de muestra representativa; el remanente se elimina.' },
        { subserie: 'Acciones de grupo', ag: 2, ac: 8, disposicion: 'S', fundamento: 'Selección de muestra representativa; el remanente se elimina.' }
      ]},
      { serie: 'PQRSD', subseries: [
        { subserie: 'Peticiones', ag: 2, ac: 5, disposicion: 'S', fundamento: 'Soporte del derecho de petición (Ley 1755 de 2015); selección de muestra por su valor informativo, el resto se elimina.' },
        { subserie: 'Quejas', ag: 2, ac: 5, disposicion: 'S', fundamento: 'Selección de muestra con valor de seguimiento; el resto se elimina.' },
        { subserie: 'Reclamos', ag: 2, ac: 5, disposicion: 'S', fundamento: 'Selección de muestra; el resto se elimina.' },
        { subserie: 'Sugerencias', ag: 2, ac: 5, disposicion: 'E', fundamento: 'Cumplida la retención se elimina previo inventario publicado 60 días (Acuerdo AGN 004 de 2019).' },
        { subserie: 'Denuncias', ag: 2, ac: 8, disposicion: 'S', fundamento: 'Selección de muestra por su valor de control; el resto se elimina.' }
      ]},
      { serie: 'DERECHOS DE PETICIÓN', subseries: [
        { subserie: null, ag: 2, ac: 5, disposicion: 'S', fundamento: 'Derecho fundamental de petición (Ley 1755 de 2015); selección de muestra con valor secundario tras la retención.' }
      ]},
      { serie: 'ACTAS', subseries: [
        { subserie: 'Actas del comité institucional de gestión y desempeño', ag: 2, ac: 8, disposicion: 'CT', fundamento: 'Reflejan decisiones institucionales; conservación total por su valor evidencial e histórico.' },
        { subserie: 'Actas del comité interno de archivo / gestión documental', ag: 2, ac: 8, disposicion: 'CT', fundamento: 'Valor evidencial de la política archivística; conservación total.' },
        { subserie: 'Actas del comité de conciliación', ag: 2, ac: 8, disposicion: 'CT', fundamento: 'Valor jurídico permanente; conservación total.' },
        { subserie: 'Actas de junta o consejo directivo', ag: 2, ac: 8, disposicion: 'CT', fundamento: 'Máximo órgano de decisión; conservación total.' }
      ]},
      { serie: 'RESOLUCIONES', subseries: [
        { subserie: null, ag: 2, ac: 8, disposicion: 'CT', fundamento: 'Actos administrativos con valor normativo y probatorio permanente; conservación total.' }
      ]},
      { serie: 'CIRCULARES', subseries: [
        { subserie: null, ag: 2, ac: 8, disposicion: 'CT', fundamento: 'Directrices internas con valor evidencial; conservación total.' }
      ]},
      { serie: 'CONTRATOS', subseries: [
        { subserie: 'Contratos de prestación de servicios', ag: 2, ac: 18, disposicion: 'S', fundamento: 'Vencidas garantías y término legal, se selecciona muestra; el resto se elimina (Acuerdo AGN 004 de 2019).' },
        { subserie: 'Contratos de obra', ag: 2, ac: 18, disposicion: 'CT', fundamento: 'Valor técnico e histórico de la infraestructura; conservación total.' },
        { subserie: 'Contratos de suministro', ag: 2, ac: 18, disposicion: 'S', fundamento: 'Selección de muestra tras vencer garantías; el resto se elimina.' },
        { subserie: 'Contratos interadministrativos', ag: 2, ac: 18, disposicion: 'CT', fundamento: 'Valor evidencial de la cooperación institucional; conservación total.' }
      ]},
      { serie: 'CONVENIOS', subseries: [
        { subserie: 'Convenios interadministrativos', ag: 2, ac: 18, disposicion: 'CT', fundamento: 'Evidencia de cooperación entre entidades; conservación total.' },
        { subserie: 'Convenios de asociación', ag: 2, ac: 18, disposicion: 'CT', fundamento: 'Valor evidencial permanente; conservación total.' }
      ]},
      { serie: 'CONCEPTOS', subseries: [
        { subserie: 'Conceptos jurídicos', ag: 2, ac: 8, disposicion: 'CT', fundamento: 'Doctrina institucional con valor secundario; conservación total.' },
        { subserie: 'Conceptos técnicos', ag: 2, ac: 8, disposicion: 'S', fundamento: 'Selección de muestra con valor de referencia; el resto se elimina.' }
      ]},
      { serie: 'HISTORIAS LABORALES', subseries: [
        { subserie: null, ag: 5, ac: 80, disposicion: 'CT', fundamento: 'Soportan derechos pensionales y prestacionales del servidor; conservación total por su valor probatorio.' }
      ]},
      { serie: 'NÓMINA', subseries: [
        { subserie: null, ag: 2, ac: 18, disposicion: 'S', fundamento: 'Se selecciona una muestra por su valor para reconstrucción de derechos; el resto se elimina.' }
      ]},
      { serie: 'COMPROBANTES CONTABLES', subseries: [
        { subserie: 'Comprobantes de egreso', ag: 2, ac: 8, disposicion: 'E', fundamento: 'Cumplida la prescripción contable y fiscal, se eliminan previo inventario publicado 60 días (Acuerdo AGN 004 de 2019).' },
        { subserie: 'Comprobantes de ingreso', ag: 2, ac: 8, disposicion: 'E', fundamento: 'Se eliminan cumplida la prescripción contable y fiscal.' }
      ]},
      { serie: 'VIÁTICOS Y GASTOS DE VIAJE', subseries: [
        { subserie: 'Legalización de viáticos y comisiones', ag: 2, ac: 8, disposicion: 'E', fundamento: 'Soporte de la comisión; se elimina cumplida la retención contable.' }
      ]},
      { serie: 'INFORMES', subseries: [
        { subserie: 'Informes de gestión', ag: 2, ac: 8, disposicion: 'CT', fundamento: 'Reflejan la gestión institucional; conservación total por su valor secundario.' },
        { subserie: 'Informes a entes de control', ag: 2, ac: 8, disposicion: 'CT', fundamento: 'Valor evidencial ante organismos de control; conservación total.' },
        { subserie: 'Informes de auditoría', ag: 2, ac: 8, disposicion: 'CT', fundamento: 'Valor de control y mejora; conservación total.' }
      ]},
      { serie: 'PLANES', subseries: [
        { subserie: 'Plan de acción', ag: 2, ac: 8, disposicion: 'CT', fundamento: 'Instrumento de planeación con valor evidencial; conservación total.' },
        { subserie: 'Plan anticorrupción y de atención al ciudadano', ag: 2, ac: 8, disposicion: 'CT', fundamento: 'Valor institucional y de transparencia; conservación total.' },
        { subserie: 'Plan institucional de archivos (PINAR)', ag: 2, ac: 8, disposicion: 'CT', fundamento: 'Instrumento archivístico; conservación total.' },
        { subserie: 'Programa de gestión documental (PGD)', ag: 2, ac: 8, disposicion: 'CT', fundamento: 'Instrumento archivístico obligatorio; conservación total.' }
      ]},
      { serie: 'PROYECTOS', subseries: [
        { subserie: 'Proyectos de inversión', ag: 2, ac: 8, disposicion: 'CT', fundamento: 'Evidencia de la inversión pública; conservación total por su valor histórico y de control.' }
      ]},
      { serie: 'PROCESOS DISCIPLINARIOS', subseries: [
        { subserie: null, ag: 2, ac: 18, disposicion: 'CT', fundamento: 'Valor jurídico y probatorio del proceso; conservación total.' }
      ]},
      { serie: 'PROCESOS JUDICIALES', subseries: [
        { subserie: null, ag: 2, ac: 18, disposicion: 'CT', fundamento: 'Valor jurídico y probatorio; conservación total del expediente del proceso.' }
      ]},
      { serie: 'PROCESOS DE COBRO COACTIVO', subseries: [
        { subserie: null, ag: 2, ac: 10, disposicion: 'S', fundamento: 'Cumplida la obligación y la prescripción, se selecciona muestra; el resto se elimina.' }
      ]},
      { serie: 'COMUNICACIONES OFICIALES', subseries: [
        { subserie: 'Comunicaciones oficiales enviadas', ag: 2, ac: 3, disposicion: 'S', fundamento: 'Selección de comunicaciones con valor informativo; el resto se elimina.' },
        { subserie: 'Comunicaciones oficiales recibidas', ag: 2, ac: 3, disposicion: 'S', fundamento: 'Selección de comunicaciones con valor informativo; el resto se elimina.' }
      ]},
      { serie: 'DECLARACIONES DE BIENES Y RENTAS', subseries: [
        { subserie: null, ag: 2, ac: 8, disposicion: 'E', fundamento: 'Soporte del deber de declaración; se elimina cumplida la retención previo inventario 60 días.' }
      ]},
      { serie: 'INSTRUMENTOS ARCHIVÍSTICOS', subseries: [
        { subserie: 'Tablas de Retención Documental', ag: 2, ac: 8, disposicion: 'CT', fundamento: 'Instrumento archivístico rector; conservación total.' },
        { subserie: 'Inventarios documentales (FUID)', ag: 2, ac: 8, disposicion: 'CT', fundamento: 'Control del patrimonio documental; conservación total.' }
      ]}
    ]
  }
}

export { MATRICES_REFERENCIA }
