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
  }
}

export { MATRICES_REFERENCIA }
