// ======================================================
// SIPAD · Diagnóstico Integral para el SIC — Catálogo del formulario
// ------------------------------------------------------
// Definición declarativa (solo datos) de las preguntas del
// formulario de diagnóstico del Sistema Integrado de Conservación.
// El motor (sic.motor.js) y el frontend leen este catálogo; para
// cambiar una pregunta basta con editarla aquí.
//
// Tipos de respuesta:
//   spn    → si | parcial | no | ns  ("ns" = No sabe → tarea de verificación)
//   num    → número (con `unidad`)
//   lista  → una opción de `opciones`
//   multi  → varias opciones de `opciones`
//   txt    → texto corto
//   escala → ausente | puntual | extendido
//   pct3   → { bueno, regular, malo } que suman 100
//   dep    → dependencias de la entidad (múltiple)
//
// Campos opcionales:
//   inversa: true   → responder "Sí" es un hallazgo negativo (p. ej. "¿hay filtraciones?")
//   soporte: true   → admite referencia al documento soporte (acta, resolución…)
//   extra: {...}    → campo adicional (número o texto) junto a la respuesta
//   componente      → componente del Plan de Conservación / SIC al que aporta
// ======================================================

export const COMPONENTES = {
  GOB:  'Gobierno y responsabilidades',
  INS:  'Instrumentos archivísticos',
  PRO:  'Procedimientos',
  CAP:  'Capacitación y sensibilización',
  INSP: 'Inspección y mantenimiento de instalaciones',
  SAN:  'Saneamiento ambiental',
  AMB:  'Monitoreo y control de condiciones ambientales',
  ALM:  'Almacenamiento y re-almacenamiento',
  EME:  'Prevención de emergencias y atención de desastres',
  SEG:  'Seguridad y control de acceso',
  DIG:  'Preservación digital a largo plazo',
  REC:  'Recursos y viabilidad'
}

export const ESCALA = ['ausente', 'puntual', 'extendido']
export const RANGOS_PCT = ['0–25 %', '26–50 %', '51–75 %', '76–100 %']

// ---------------- Sección 0 · Registro de espacios ----------------
export const REGISTRO_ESPACIO = [
  { id: 'ESP-01', texto: 'Nombre del espacio', tipo: 'txt', requerido: true },
  { id: 'ESP-02', texto: 'Ubicación (sede, piso, dirección si es externo)', tipo: 'txt' },
  { id: 'ESP-03', texto: 'Dependencia(s) cuyos documentos guarda', tipo: 'dep' },
  { id: 'ESP-04', texto: 'Tipo de espacio', tipo: 'lista',
    opciones: ['Oficina compartida', 'Depósito exclusivo', 'Bodega', 'Inmueble externo o abandonado', 'Otro'] },
  { id: 'ESP-05', texto: '¿Es de uso exclusivo para archivo?', tipo: 'spn' },
  { id: 'ESP-06', texto: 'Responsable o custodio del espacio', tipo: 'txt' },
  { id: 'ESP-07', texto: '¿Cuántas llaves existen?', tipo: 'num', unidad: 'llaves', extra: { tipo: 'txt', etiqueta: '¿Quién las tiene?' } },
  { id: 'ESP-08', texto: 'Área aproximada', tipo: 'num', unidad: 'm²' },
  { id: 'ESP-09', texto: 'Fechas extremas aproximadas de los documentos (año inicial – año final)', tipo: 'txt' },
  { id: 'ESP-10', texto: '¿Guarda documentos de administraciones anteriores sin organizar (fondo acumulado)?', tipo: 'spn', inversa: true }
]

// ---------------- Sección 1 · Cuestionario institucional ----------------
export const INSTITUCIONAL = [
  { id: '1.1', titulo: 'Gobierno y responsabilidades', preguntas: [
    { id: 'IN-01', componente: 'GOB', tipo: 'spn', soporte: true, texto: '¿La responsabilidad de la gestión documental está asignada mediante acto administrativo?' },
    { id: 'IN-02', componente: 'GOB', tipo: 'num', unidad: '%', texto: '¿Qué porcentaje de su tiempo dedica el responsable a la gestión documental?' },
    { id: 'IN-03', componente: 'GOB', tipo: 'num', unidad: 'personas', texto: '¿Cuántas personas de apoyo tiene para archivo?' },
    { id: 'IN-04', componente: 'GOB', tipo: 'spn', soporte: true, texto: '¿El Comité Institucional de Gestión y Desempeño ha tratado el tema de archivo en sus sesiones?' },
    { id: 'IN-05', componente: 'GOB', tipo: 'spn', soporte: true, texto: '¿Existen compromisos del Comité sobre archivo con responsable y fecha?' },
    { id: 'IN-06', componente: 'GOB', tipo: 'spn', soporte: true, texto: '¿Las actas e informes anteriores sobre la problemática del archivo están disponibles?' },
    { id: 'IN-07', componente: null, tipo: 'multi', texto: '¿Qué áreas deben participar en el SIC?',
      opciones: ['Gobierno', 'Planeación', 'Control Interno', 'Sistemas', 'Hacienda', 'Talento Humano (SST)', 'Otra'] }
  ]},
  { id: '1.2', titulo: 'Instrumentos archivísticos', preguntas: [
    { id: 'IN-08', componente: 'INS', tipo: 'spn', soporte: true, texto: '¿Se conoce el acto administrativo que aprobó TRD anteriores?' },
    { id: 'IN-09', componente: 'INS', tipo: 'spn', texto: '¿Existe Cuadro de Clasificación Documental vigente?' },
    { id: 'IN-10', componente: 'INS', tipo: 'num', unidad: 'dependencias', texto: '¿Cuántas dependencias tienen inventario documental (FUID)?' },
    { id: 'IN-11', componente: 'INS', tipo: 'num', unidad: 'dependencias', texto: 'De ellas, ¿cuántas lo tienen actualizado al último año?' },
    { id: 'IN-12', componente: 'INS', tipo: 'spn', soporte: true, texto: '¿Existe Programa de Gestión Documental (PGD) aprobado?' },
    { id: 'IN-13', componente: 'INS', tipo: 'spn', soporte: true, texto: '¿Existe Plan Institucional de Archivos (PINAR) aprobado?' },
    { id: 'IN-14', componente: 'INS', tipo: 'spn', soporte: true, texto: '¿El diagnóstico de 2024 está disponible?' },
    { id: 'IN-15', componente: 'INS', tipo: 'spn', texto: '¿Están identificados los documentos vitales o esenciales?' },
    { id: 'IN-16', componente: 'INS', tipo: 'spn', texto: '¿Están identificadas series o fondos con valor histórico?' }
  ]},
  { id: '1.3', titulo: 'Procedimientos', preguntas: [
    { id: 'IN-17', componente: 'PRO', tipo: 'spn', soporte: true, texto: '¿Existe procedimiento escrito de organización de archivos de gestión?' },
    { id: 'IN-18', componente: 'PRO', tipo: 'spn', soporte: true, texto: '¿Existe procedimiento de préstamo y consulta de documentos?' },
    { id: 'IN-19', componente: 'PRO', tipo: 'spn', texto: '¿Se hace entrega documental con inventario cuando un funcionario se retira o cambia de cargo?' },
    { id: 'IN-20', componente: 'PRO', tipo: 'lista', texto: '¿Quién autoriza hoy la eliminación de documentos?',
      opciones: ['Nadie', 'Jefe de dependencia', 'Técnico de archivo', 'Comité', 'Otro'],
      puntaje: { 'Nadie': 0, 'Jefe de dependencia': 0.5, 'Técnico de archivo': 0.5, 'Comité': 1, 'Otro': 0.5 } },
    { id: 'IN-21', componente: 'PRO', tipo: 'spn', inversa: true, extra: { tipo: 'txt', etiqueta: '¿Qué se sabe?' }, texto: '¿Se conocen eliminaciones hechas sin acta en los últimos años?' },
    { id: 'IN-22', componente: 'PRO', tipo: 'spn', texto: '¿Las dependencias separan los documentos en trámite de los terminados?' },
    { id: 'IN-23', componente: 'PRO', tipo: 'spn', texto: '¿Al terminar un trámite se conforma un expediente?' }
  ]},
  { id: '1.4', titulo: 'Capacitación y sensibilización', preguntas: [
    { id: 'IN-24', componente: 'CAP', tipo: 'num', unidad: 'capacitaciones', texto: '¿Cuántas capacitaciones sobre archivo se hicieron en el último año?' },
    { id: 'IN-25', componente: 'CAP', tipo: 'num', unidad: 'funcionarios', texto: '¿Cuántos funcionarios asistieron?' },
    { id: 'IN-26', componente: 'CAP', tipo: 'spn', texto: '¿El responsable de archivo ha recibido formación en conservación preventiva o preservación digital?' },
    { id: 'IN-27', componente: 'CAP', tipo: 'spn', texto: '¿Los funcionarios saben a quién reportar documentos con hongos, humedad o plagas?' }
  ]},
  { id: '1.5', titulo: 'Saneamiento y protección del personal', preguntas: [
    { id: 'IN-28', componente: 'SAN', tipo: 'spn', texto: '¿Existe un programa de limpieza de archivos (documentos, cajas, estanterías)?' },
    { id: 'IN-29', componente: 'SAN', tipo: 'txt', texto: 'Fecha de la última fumigación o control de plagas en espacios de archivo (o "nunca")' },
    { id: 'IN-30', componente: 'SAN', tipo: 'spn', texto: '¿Hay elementos de protección personal disponibles (tapabocas, guantes, bata)?' },
    { id: 'IN-31', componente: 'SAN', tipo: 'spn', texto: '¿Existe un protocolo para manipular documentos contaminados (hongos)?' },
    { id: 'IN-32', componente: 'SAN', tipo: 'spn', texto: '¿Existe un espacio de aislamiento o cuarentena para documentos afectados?' },
    { id: 'IN-33', componente: 'SAN', tipo: 'spn', texto: '¿Seguridad y Salud en el Trabajo conoce los riesgos de los espacios de archivo?' }
  ]},
  { id: '1.6', titulo: 'Emergencias', preguntas: [
    { id: 'IN-34', componente: 'EME', tipo: 'spn', soporte: true, texto: '¿El plan de emergencias de la entidad incluye los archivos?' },
    { id: 'IN-35', componente: 'EME', tipo: 'spn', texto: '¿Están definidas las prioridades de rescate documental ante una emergencia?' },
    { id: 'IN-36', componente: 'EME', tipo: 'spn', inversa: true, extra: { tipo: 'txt', etiqueta: 'Cuándo, dónde y qué se perdió' }, texto: '¿Ha ocurrido algún evento (inundación, filtración, incendio, plaga) que haya dañado documentos?' }
  ]},
  { id: '1.7', titulo: 'Recursos y viabilidad', preguntas: [
    { id: 'IN-37', componente: 'REC', tipo: 'spn', extra: { tipo: 'txt', etiqueta: 'Rubro / monto' }, texto: '¿Existe un rubro presupuestal para archivo o conservación en la vigencia actual?' },
    { id: 'IN-38', componente: 'REC', tipo: 'spn', texto: '¿Es viable contratar servicios externos especializados?' },
    { id: 'IN-39', componente: 'REC', tipo: 'spn', extra: { tipo: 'txt', etiqueta: '¿Cuál? ¿Cuántos m²?' }, texto: '¿Existe algún espacio que pueda adecuarse como Archivo Central, aunque sea progresivamente?' },
    { id: 'IN-40', componente: 'REC', tipo: 'spn', texto: '¿La entidad acepta medir indicadores del SIC y reportarlos al Comité?' },
    { id: 'IN-41', componente: null, tipo: 'multi', max: 3, texto: 'Las tres limitaciones principales para mejorar la conservación',
      opciones: ['Espacio', 'Recursos', 'Personal', 'Organización', 'Compromiso institucional', 'Otro'] }
  ]}
]

// ---------------- Sección 2 · Ficha de inspección por espacio ----------------
export const FICHA = [
  { id: 'A', titulo: 'Volumen (medido con flexómetro)', ayuda:
    'Mida el largo ocupado en cada entrepaño y súmelo. Las cajas, archivadores y pilas se cuentan aparte SOLO si NO están sobre estantería.',
    preguntas: [
      { id: 'FI-01', tipo: 'num', unidad: 'm', texto: 'Metros lineales ocupados en estantería (suma del largo ocupado en cada entrepaño)' },
      { id: 'FI-02', tipo: 'num', unidad: 'cajas', texto: 'Cajas de archivo estándar FUERA de estantería (piso, sobre muebles)',
        extra: { tipo: 'num', etiqueta: 'Ancho de una caja (cm)', defecto: 20 } },
      { id: 'FI-03', tipo: 'num', unidad: 'cajas', texto: 'Cajas improvisadas (cartón reciclado, otras) FUERA de estantería',
        extra: { tipo: 'num', etiqueta: 'Ancho de una caja (cm)', defecto: 30 } },
      { id: 'FI-04', tipo: 'num', unidad: 'gavetas', texto: 'Archivadores: número de gavetas ocupadas',
        extra: { tipo: 'num', etiqueta: 'Largo ocupado total (m)' } },
      { id: 'FI-05', tipo: 'num', unidad: 'pilas', texto: 'Documentos en pilas (piso, escritorios): número de pilas',
        extra: { tipo: 'num', etiqueta: 'Altura total sumada (cm)' } },
      { id: 'FI-06', tipo: 'multi', texto: 'Otros soportes presentes',
        opciones: ['Planos', 'Fotografías', 'CD-DVD', 'USB', 'Cintas', 'Libros o tomos', 'Ninguno'] }
    ]},
  { id: 'B', titulo: 'Organización', preguntas: [
    { id: 'FI-07', tipo: 'lista', componente: 'ALM', opciones: RANGOS_PCT, texto: 'Proporción organizada (estimada)',
      puntaje: { '0–25 %': 0, '26–50 %': 0.33, '51–75 %': 0.66, '76–100 %': 1 } },
    { id: 'FI-08', tipo: 'lista', componente: 'ALM', opciones: RANGOS_PCT, texto: 'Proporción de cajas y carpetas rotuladas',
      puntaje: { '0–25 %': 0, '26–50 %': 0.33, '51–75 %': 0.66, '76–100 %': 1 } },
    { id: 'FI-09', tipo: 'spn', componente: 'INS', soporte: true, texto: '¿Existe inventario de este espacio?' }
  ]},
  { id: 'C', titulo: 'Estado de conservación', preguntas: [
    { id: 'FI-10', tipo: 'pct3', texto: 'Distribución del estado (% bueno / % regular / % malo)' },
    { id: 'FI-11', tipo: 'escala', componente: 'SAN', texto: 'Hongos o manchas de humedad en documentos' },
    { id: 'FI-12', tipo: 'escala', componente: 'SAN', texto: 'Plagas: insectos, roedores, excrementos, nidos' },
    { id: 'FI-13', tipo: 'escala', componente: 'SAN', texto: 'Daño visible por plagas (perforaciones, faltantes)' },
    { id: 'FI-14', tipo: 'escala', componente: 'ALM', texto: 'Deterioro físico (rasgaduras, dobleces, ganchos oxidados, cintas adhesivas)' },
    { id: 'FI-15', tipo: 'escala', componente: 'AMB', texto: 'Deterioro químico (papel amarillento o quebradizo, tintas desvanecidas)' },
    { id: 'FI-16', tipo: 'spn', componente: 'ALM', inversa: true, extra: { tipo: 'num', etiqueta: 'Cajas aproximadas' },
      texto: '¿Hay documentos con daño grave que deban separarse ya?' }
  ]},
  { id: 'D', titulo: 'Instalaciones', preguntas: [
    { id: 'FI-17', tipo: 'spn', componente: 'INSP', inversa: true, texto: 'Filtraciones o goteras en el techo' },
    { id: 'FI-18', tipo: 'spn', componente: 'INSP', inversa: true, texto: 'Tuberías, baños o tanques cercanos o encima' },
    { id: 'FI-19', tipo: 'spn', componente: 'INSP', inversa: true, texto: 'Humedad visible en paredes o piso' },
    { id: 'FI-20', tipo: 'lista', componente: 'AMB', opciones: ['Buena', 'Deficiente', 'Nula'], texto: 'Ventilación',
      puntaje: { 'Buena': 1, 'Deficiente': 0.5, 'Nula': 0 } },
    { id: 'FI-21', tipo: 'spn', componente: 'AMB', inversa: true, texto: 'Luz solar directa sobre documentos' },
    { id: 'FI-22', tipo: 'spn', componente: 'INSP', inversa: true, texto: 'Instalaciones eléctricas expuestas o en mal estado' },
    { id: 'FI-23', tipo: 'spn', componente: 'SEG', texto: 'Puerta con cerradura funcional' },
    { id: 'FI-24', tipo: 'spn', componente: 'SEG', inversa: true, texto: '¿Personas externas pueden entrar sin acompañamiento?' },
    { id: 'FI-25', tipo: 'spn', componente: 'EME', inversa: true, extra: { tipo: 'txt', etiqueta: '¿Cuáles?' },
      texto: 'Objetos ajenos al archivo en el espacio (aseo, químicos, inservibles, material inflamable)' }
  ]},
  { id: 'E', titulo: 'Mobiliario', preguntas: [
    { id: 'FI-26', tipo: 'multi', texto: 'Tipos de mobiliario presentes',
      opciones: ['Estantería metálica', 'Estantería de madera', 'Archivador', 'Escritorio', 'Cajas en el piso'] },
    { id: 'FI-27', tipo: 'spn', componente: 'ALM', texto: '¿El entrepaño inferior está separado del piso (al menos 10 cm)?' },
    { id: 'FI-28', tipo: 'spn', componente: 'ALM', texto: '¿La estantería está separada de las paredes?' },
    { id: 'FI-29', tipo: 'spn', componente: 'ALM', texto: '¿La estantería es estable y sin sobrecarga?' }
  ]},
  { id: 'F', titulo: 'Seguridad y condiciones ambientales', preguntas: [
    { id: 'FI-30', tipo: 'spn', componente: 'EME', texto: 'Extintor en el espacio o a la entrada, con carga vigente' },
    { id: 'FI-31', tipo: 'spn', componente: 'EME', texto: 'Detector de humo' },
    { id: 'FI-32', tipo: 'spn', componente: 'AMB', texto: 'Aire acondicionado o deshumidificador' },
    { id: 'FI-33', tipo: 'spn', componente: 'AMB', extra: { tipo: 'txt', etiqueta: 'Lectura (°C / %HR)' }, texto: '¿Hay equipo para medir temperatura y humedad?' }
  ]},
  { id: 'G', titulo: 'Evidencia y cierre', preguntas: [
    { id: 'FI-35', tipo: 'lista', opciones: ['Crítica', 'Alta', 'Media', 'Baja'], texto: 'Prioridad que el técnico le asigna al espacio' },
    { id: 'FI-36', tipo: 'txt', opcional: true, texto: 'Observaciones' }
  ]}
]
// FI-34 (fotografías) se maneja como adjuntos del espacio (mínimo 3).
export const FOTOS_MINIMAS = 3

// ---------------- Sección 3 · Sistemas ----------------
export const SISTEMAS = [
  { id: '3.1', titulo: 'Preguntas institucionales (Sistemas)', preguntas: [
    { id: 'SI-01', componente: 'DIG', tipo: 'spn', texto: '¿La entidad tiene dominio y correo institucional para todos los funcionarios?' },
    { id: 'SI-02', componente: 'DIG', tipo: 'spn', extra: { tipo: 'txt', etiqueta: '¿Cuál?' }, texto: '¿Existe una cuenta institucional de almacenamiento en la nube administrada por la entidad?' },
    { id: 'SI-03', componente: 'DIG', tipo: 'spn', extra: { tipo: 'txt', etiqueta: 'Frecuencia' }, texto: '¿Existe política o rutina de copias de seguridad institucionales?' },
    { id: 'SI-04', componente: 'DIG', tipo: 'spn', texto: '¿Alguna vez se ha probado restaurar una copia de seguridad?' },
    { id: 'SI-05', componente: null, tipo: 'txt', texto: 'Plataforma de gestión documental existente: nombre, licencia vigente, módulos disponibles' },
    { id: 'SI-06', componente: null, tipo: 'multi', texto: '¿Qué falta para poner en uso la plataforma?',
      opciones: ['Parametrización', 'Capacitación', 'TRD', 'Servidor', 'Licencia', 'Decisión directiva', 'Otro'] },
    { id: 'SI-07', componente: 'DIG', tipo: 'spn', soporte: true, texto: '¿Existe Registro de Activos de Información?' },
    { id: 'SI-08', componente: 'DIG', tipo: 'spn', extra: { tipo: 'txt', etiqueta: '¿En qué trámites?' }, texto: '¿Se usa firma electrónica o digital en algún trámite?' },
    { id: 'SI-09', componente: null, tipo: 'txt', texto: '¿Qué pasa con la información de un computador que se daña, se reemplaza o cuyo funcionario se retira?' },
    { id: 'SI-10', componente: null, tipo: 'num', unidad: 'computadores', texto: 'Número aproximado de computadores en uso' }
  ]}
]

export const REPOSITORIO = [
  { id: 'SR-01', texto: 'Nombre del sistema o repositorio', tipo: 'txt', requerido: true },
  { id: 'SR-02', texto: 'Tipo', tipo: 'lista',
    opciones: ['Aplicación misional', 'Plataforma de gestión documental', 'Correo', 'Nube personal', 'Carpeta compartida', 'Servidor', 'Base de datos', 'Computador local'] },
  { id: 'SR-03', texto: 'Dependencia(s) que lo usan', tipo: 'dep' },
  { id: 'SR-04', texto: 'Responsable', tipo: 'txt' },
  { id: 'SR-05', texto: 'Qué documentos o información contiene (series, si se conocen)', tipo: 'txt' },
  { id: 'SR-06', texto: 'Formatos predominantes', tipo: 'multi', opciones: ['PDF', 'Word', 'Excel', 'Imágenes', 'Bases de datos', 'Correo', 'Otro'] },
  { id: 'SR-07', texto: 'Volumen aproximado', tipo: 'num', unidad: 'GB' },
  { id: 'SR-08', texto: 'Ubicación', tipo: 'lista', opciones: ['Local', 'Nube', 'Proveedor externo'] },
  { id: 'SR-09', texto: 'Copia de seguridad: frecuencia', tipo: 'lista', opciones: ['Nunca', 'Ocasional', 'Mensual', 'Semanal', 'Diaria'],
    extra: { tipo: 'txt', etiqueta: '¿Dónde se guarda?' } },
  { id: 'SR-10', texto: '¿Quién puede ver, modificar o borrar?', tipo: 'txt' },
  { id: 'SR-11', texto: '¿Es indispensable para la continuidad del servicio?', tipo: 'spn' },
  { id: 'SR-12', texto: '¿Depende de un proveedor o contrato externo?', tipo: 'spn', extra: { tipo: 'txt', etiqueta: '¿Cuándo vence?' } }
]

// Índice plano id → pregunta (para el motor y validaciones)
export function indicePreguntas() {
  const idx = {}
  for (const p of REGISTRO_ESPACIO) idx[p.id] = { ...p, seccion: 'espacio' }
  for (const b of INSTITUCIONAL) for (const p of b.preguntas) idx[p.id] = { ...p, seccion: 'institucional', bloque: b.titulo }
  for (const b of FICHA) for (const p of b.preguntas) idx[p.id] = { ...p, seccion: 'ficha', bloque: b.titulo }
  for (const b of SISTEMAS) for (const p of b.preguntas) idx[p.id] = { ...p, seccion: 'sistemas', bloque: b.titulo }
  for (const p of REPOSITORIO) idx[p.id] = { ...p, seccion: 'repositorio' }
  return idx
}

export function catalogo() {
  return { componentes: COMPONENTES, escala: ESCALA, registroEspacio: REGISTRO_ESPACIO, institucional: INSTITUCIONAL,
    ficha: FICHA, fotosMinimas: FOTOS_MINIMAS, sistemas: SISTEMAS, repositorio: REPOSITORIO }
}
