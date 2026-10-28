// ======================================================
// SIPAD · Diagnóstico preliminar del SIC — Catálogo del formulario
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
  { id: 'ESP-08', texto: 'Área aproximada (a simple vista)', tipo: 'lista', opcional: true,
    opciones: ['Menos de 10 m²', '10–30 m²', '30–60 m²', 'Más de 60 m²'] },
  { id: 'ESP-09', texto: 'Fechas extremas aproximadas de los documentos (año inicial – año final)', tipo: 'txt' },
  { id: 'ESP-10', texto: '¿Guarda documentos de administraciones anteriores sin organizar (fondo acumulado)?', tipo: 'spn', inversa: true }
]

// ---------------- Sección 1 · Cuestionario de diagnóstico (140 preguntas) ----------------
// Mismas preguntas, misma redacción y mismo orden de la entrevista de levantamiento
// (Entrevista_140_preguntas_SIC). Cada pregunta guarda la respuesta rápida (v) y la
// respuesta en palabras de quien responde (o). inversa: «Sí» es un hallazgo negativo.
export const INSTITUCIONAL = [
  { id: "1", titulo: "Responsable y organización", preguntas: [
    { id: 'P-001', n: 1, tipo: 'txt', texto: "¿Quién es responsable de coordinar/administrar la gestión documental y los archivos?" },
    { id: 'P-002', n: 2, tipo: 'spn', componente: 'GOB', obs: true, texto: "¿El técnico tiene responsabilidades formalmente asignadas?" },
    { id: 'P-003', n: 3, tipo: 'spn', componente: 'GOB', obs: true, texto: "¿El técnico está dedicado exclusivamente a estas funciones?" },
    { id: 'P-004', n: 4, tipo: 'txt', texto: "¿De qué dependencia hace parte?" },
    { id: 'P-005', n: 5, tipo: 'spn', componente: 'GOB', obs: true, texto: "¿Existe una oficina o grupo independiente de gestión documental?" },
    { id: 'P-006', n: 6, tipo: 'spn', componente: 'ALM', obs: true, texto: "¿Existe un Archivo Central independiente?" }
  ]},
  { id: "2", titulo: "Espacios, mobiliario y estado general", preguntas: [
    { id: 'P-007', n: 7, tipo: 'txt', texto: "¿Dónde se encuentra la documentación que debería estar en el Archivo Central?" },
    { id: 'P-008', n: 8, tipo: 'spn', componente: 'ALM', inversa: true, obs: true, texto: "¿Existe acumulación o falta de espacio?" },
    { id: 'P-009', n: 9, tipo: 'txt', texto: "¿Qué problemas presentan los espacios de almacenamiento?" },
    { id: 'P-010', n: 10, tipo: 'txt', texto: "¿Qué tipo de mobiliario se utiliza para almacenar documentos?" },
    { id: 'P-011', n: 11, tipo: 'spn', componente: 'ALM', inversa: true, obs: true, texto: "¿Hay documentos o cajas directamente sobre el piso?" },
    { id: 'P-012', n: 12, tipo: 'spn', componente: 'AMB', obs: true, texto: "¿Se monitorean temperatura y humedad?" },
    { id: 'P-013', n: 13, tipo: 'spn', componente: 'SAN', obs: true, texto: "¿Existe un procedimiento periódico de limpieza, saneamiento o control de plagas?" },
    { id: 'P-014', n: 14, tipo: 'spn', componente: 'SAN', inversa: true, obs: true, texto: "¿Existe deterioro físico o biológico de los documentos?" },
    { id: 'P-015', n: 15, tipo: 'spn', componente: 'ALM', obs: true, texto: "¿Las unidades de conservación están estandarizadas?" }
  ]},
  { id: "3", titulo: "Capacitación, documentos vitales y emergencias", preguntas: [
    { id: 'P-016', n: 16, tipo: 'spn', componente: 'CAP', obs: true, texto: "¿El personal recibe capacitación sobre manejo, organización y conservación?" },
    { id: 'P-017', n: 17, tipo: 'spn', componente: 'EME', obs: true, texto: "¿Están identificados los documentos vitales o esenciales?" },
    { id: 'P-018', n: 18, tipo: 'spn', componente: 'EME', obs: true, texto: "¿Existe un protocolo de emergencia para eventos que afecten documentos?" },
    { id: 'P-019', n: 19, tipo: 'spn', componente: 'EME', obs: true, texto: "¿Existen equipos de emergencia en los espacios de archivo?" },
    { id: 'P-020', n: 20, tipo: 'spn', componente: 'EME', obs: true, texto: "¿Se realizan simulaciones o capacitación para recuperación después de emergencias?" }
  ]},
  { id: "4", titulo: "Documentos electrónicos", preguntas: [
    { id: 'P-021', n: 21, tipo: 'spn', componente: 'DIG', obs: true, texto: "¿La entidad tiene un sistema o plataforma de gestión documental?" },
    { id: 'P-022', n: 22, tipo: 'spn', obs: true, texto: "¿Se producen documentos electrónicos?" },
    { id: 'P-023', n: 23, tipo: 'txt', texto: "¿Dónde se almacenan?" },
    { id: 'P-024', n: 24, tipo: 'spn', componente: 'DIG', obs: true, texto: "¿Existen copias de seguridad institucionales periódicas?" },
    { id: 'P-025', n: 25, tipo: 'spn', componente: 'DIG', obs: true, texto: "¿Existe un procedimiento para recuperar documentos electrónicos si se daña, pierde o reemplaza un computador?" },
    { id: 'P-026', n: 26, tipo: 'spn', componente: 'DIG', obs: true, texto: "¿Existe una directriz institucional para trasladar documentos de computadores o Google Drive a un repositorio institucional?" },
    { id: 'P-027', n: 27, tipo: 'spn', componente: 'DIG', obs: true, texto: "¿Existe una directriz sobre formatos para preservación a largo plazo?" },
    { id: 'P-028', n: 28, tipo: 'spn', componente: 'DIG', obs: true, texto: "¿Existen mecanismos institucionales de integridad y autenticidad, como firmas, metadatos, auditoría o hash?" },
    { id: 'P-029', n: 29, tipo: 'spn', componente: 'DIG', obs: true, texto: "¿Existe una estrategia para obsolescencia o migración tecnológica?" },
    { id: 'P-030', n: 30, tipo: 'spn', componente: 'DIG', obs: true, texto: "¿Existe una persona o área formalmente responsable de la preservación digital a largo plazo?" }
  ]},
  { id: "5", titulo: "Instrumentos, planes y recursos", preguntas: [
    { id: 'P-031', n: 31, tipo: 'spn', componente: 'INS', obs: true, texto: "¿Las dependencias organizan los documentos conforme a las TRD?" },
    { id: 'P-032', n: 32, tipo: 'spn', componente: 'INS', obs: true, texto: "Mientras se actualizan las TRD, ¿se utiliza la TRD anterior?" },
    { id: 'P-033', n: 33, tipo: 'spn', componente: 'PRO', obs: true, texto: "¿Se realizan transferencias al Archivo Central?" },
    { id: 'P-034', n: 34, tipo: 'spn', componente: 'INS', obs: true, texto: "¿Existen inventarios documentales, como FUID?" },
    { id: 'P-035', n: 35, tipo: 'spn', componente: 'INS', obs: true, texto: "¿Esos inventarios están actualizados?" },
    { id: 'P-036', n: 36, tipo: 'spn', componente: 'INS', obs: true, texto: "¿La entidad conoce cuáles TRD fueron aprobadas anteriormente y mediante qué acto administrativo?" },
    { id: 'P-037', n: 37, tipo: 'spn', componente: 'INS', obs: true, texto: "¿Alguna vez se ha elaborado un SIC?" },
    { id: 'P-038', n: 38, tipo: 'spn', componente: 'INS', obs: true, texto: "¿Existe Plan de Conservación Documental?" },
    { id: 'P-039', n: 39, tipo: 'spn', componente: 'DIG', obs: true, texto: "¿Existe Plan de Preservación Digital a Largo Plazo?" },
    { id: 'P-040', n: 40, tipo: 'spn', componente: 'INSP', obs: true, texto: "¿Se realizaron actividades específicas de conservación en 2025/2026?" },
    { id: 'P-041', n: 41, tipo: 'spn', componente: 'REC', obs: true, texto: "¿Existe presupuesto específico para conservación, preservación digital o adecuación de archivo?" },
    { id: 'P-042', n: 42, tipo: 'spn', componente: 'INSP', obs: true, texto: "¿Se realiza seguimiento periódico al estado de conservación?" },
    { id: 'P-043', n: 43, tipo: 'spn', componente: 'GOB', obs: true, texto: "¿El técnico responsable tiene tiempo, personal de apoyo y recursos para ejecutar conservación?" },
    { id: 'P-044', n: 44, tipo: 'spn', componente: 'CAP', obs: true, texto: "¿Ha recibido capacitación especializada reciente en conservación preventiva o preservación digital?" }
  ]},
  { id: "6", titulo: "Seguridad, riesgos físicos y estado de los documentos", preguntas: [
    { id: 'P-045', n: 45, tipo: 'spn', componente: 'SEG', obs: true, texto: "¿Existen controles de acceso físico a los documentos?" },
    { id: 'P-046', n: 46, tipo: 'spn', componente: 'SEG', obs: true, texto: "¿El lugar abandonado está bajo custodia o revisión?" },
    { id: 'P-047', n: 47, tipo: 'spn', componente: 'INSP', inversa: true, obs: true, texto: "¿Existe riesgo de agua, filtraciones o inundación?" },
    { id: 'P-048', n: 48, tipo: 'spn', componente: 'INSP', inversa: true, obs: true, texto: "¿El agua ya ha causado daños a documentos?" },
    { id: 'P-049', n: 49, tipo: 'spn', componente: 'EME', inversa: true, obs: true, texto: "¿Existe riesgo de incendio?" },
    { id: 'P-050', n: 50, tipo: 'spn', componente: 'SAN', inversa: true, obs: true, texto: "¿Existe presencia de plagas?" },
    { id: 'P-051', n: 51, tipo: 'spn', componente: 'SAN', obs: true, texto: "¿Se realiza control de plagas o fumigación?" },
    { id: 'P-052', n: 52, tipo: 'spn', componente: 'AMB', inversa: true, obs: true, texto: "¿Existe exposición directa al sol o a iluminación intensa?" },
    { id: 'P-053', n: 53, tipo: 'spn', componente: 'AMB', obs: true, texto: "¿Los espacios tienen buena ventilación?" },
    { id: 'P-054', n: 54, tipo: 'spn', componente: 'ALM', obs: true, texto: "¿La estantería mantiene cajas separadas del piso y paredes y permite circulación de aire y limpieza?" },
    { id: 'P-055', n: 55, tipo: 'txt', texto: "¿Cuál es el estado de las cajas?" },
    { id: 'P-056', n: 56, tipo: 'txt', texto: "¿Cómo está la organización dentro de cajas y carpetas?" },
    { id: 'P-057', n: 57, tipo: 'spn', componente: 'ALM', obs: true, texto: "¿Las cajas y carpetas están identificadas?" },
    { id: 'P-058', n: 58, tipo: 'spn', componente: 'INS', obs: true, texto: "¿Se puede saber con certeza qué documentos existen, dónde están y cuánto hay?" },
    { id: 'P-059', n: 59, tipo: 'spn', componente: 'INS', inversa: true, obs: true, texto: "¿Existen documentos históricos de administraciones anteriores acumulados y sin organización?" }
  ]},
  { id: "7", titulo: "Problemas principales y viabilidad", preguntas: [
    { id: 'P-060', n: 60, tipo: 'txt', texto: "¿Cuáles son los tres problemas más graves?" },
    { id: 'P-061', n: 61, tipo: 'spn', componente: 'REC', obs: true, texto: "¿La alta dirección reconoce la conservación documental como una prioridad?" },
    { id: 'P-062', n: 62, tipo: 'spn', componente: 'REC', obs: true, texto: "Si se aprueba el SIC, ¿habría suficiente personal?" },
    { id: 'P-063', n: 63, tipo: 'spn', componente: 'REC', obs: true, texto: "¿Existen recursos físicos y financieros para implementar el SIC?" },
    { id: 'P-064', n: 64, tipo: 'spn', componente: 'REC', obs: true, texto: "¿Las dependencias estarían dispuestas a entregar, organizar y trasladar la documentación o habría dificultades?" },
    { id: 'P-065', n: 65, tipo: 'spn', componente: 'PRO', obs: true, texto: "¿Las dependencias tienen claro quién es responsable de organizar, conservar y entregar la documentación?" },
    { id: 'P-066', n: 66, tipo: 'spn', componente: 'PRO', obs: true, texto: "¿Existe un criterio común para organizar y almacenar documentos?" }
  ]},
  { id: "8", titulo: "Procedimientos, saneamiento y emergencias", preguntas: [
    { id: 'P-067', n: 67, tipo: 'spn', componente: 'PRO', obs: true, texto: "¿Existen procedimientos escritos sobre organización, almacenamiento, manipulación y conservación física?" },
    { id: 'P-068', n: 68, tipo: 'spn', componente: 'PRO', obs: true, texto: "¿Existe un procedimiento para entregar formalmente los documentos cuando un funcionario se retira o cambia de cargo?" },
    { id: 'P-069', n: 69, tipo: 'spn', componente: 'PRO', obs: true, texto: "¿Se realiza inventario o acta de entrega documental cuando cambia el responsable de un cargo?" },
    { id: 'P-070', n: 70, tipo: 'spn', componente: 'ALM', obs: true, texto: "¿Se han identificado y separado documentos con deterioro grave?" },
    { id: 'P-071', n: 71, tipo: 'spn', componente: 'CAP', obs: true, texto: "¿Los funcionarios saben qué hacer y a quién informar ante documentos con hongos, humedad, plagas o deterioro grave?" },
    { id: 'P-072', n: 72, tipo: 'spn', componente: 'SAN', obs: true, texto: "¿Existen elementos de protección personal para manipular documentos deteriorados?" },
    { id: 'P-073', n: 73, tipo: 'spn', componente: 'SAN', obs: true, texto: "¿Se realiza limpieza periódica de documentos, cajas, estanterías y espacios?" },
    { id: 'P-074', n: 74, tipo: 'spn', componente: 'AMB', obs: true, texto: "¿Existe control y registro periódico de temperatura y humedad relativa?" },
    { id: 'P-075', n: 75, tipo: 'spn', componente: 'AMB', obs: true, texto: "¿Existen medidas para controlar la iluminación?" },
    { id: 'P-076', n: 76, tipo: 'spn', componente: 'INSP', inversa: true, obs: true, texto: "¿Los espacios están cerca de tuberías, baños, tanques, techos con filtraciones u otras fuentes de agua?" },
    { id: 'P-077', n: 77, tipo: 'spn', componente: 'INSP', obs: true, texto: "¿Las cajas y documentos están protegidos frente al contacto con agua?" },
    { id: 'P-078', n: 78, tipo: 'spn', componente: 'SAN', inversa: true, obs: true, texto: "¿Se han encontrado insectos, roedores, excrementos, nidos u otras señales de plagas?" },
    { id: 'P-079', n: 79, tipo: 'spn', componente: 'SAN', inversa: true, obs: true, texto: "¿Se han encontrado daños visibles causados por plagas?" },
    { id: 'P-080', n: 80, tipo: 'spn', componente: 'SAN', obs: true, texto: "¿Se ha realizado intervención o recuperación de documentos afectados por humedad, hongos o plagas?" },
    { id: 'P-081', n: 81, tipo: 'spn', componente: 'SAN', obs: true, texto: "¿Existe un espacio de aislamiento o cuarentena para documentos afectados?" },
    { id: 'P-082', n: 82, tipo: 'spn', componente: 'SAN', obs: true, texto: "¿Cuando se encuentran documentos con hongos se toma alguna medida especial?" },
    { id: 'P-083', n: 83, tipo: 'spn', componente: 'SAN', obs: true, texto: "¿Después de una filtración, inundación, plaga o contaminación se limpia y desinfecta el espacio?" },
    { id: 'P-084', n: 84, tipo: 'spn', componente: 'EME', obs: true, texto: "¿Existen elementos básicos para responder a emergencias, como extintores, detectores, alarmas o equipos para inundaciones?" },
    { id: 'P-085', n: 85, tipo: 'spn', componente: 'EME', obs: true, texto: "¿Existe un plan de emergencia documental con prioridades, responsables y procedimientos?" },
    { id: 'P-086', n: 86, tipo: 'spn', componente: 'EME', obs: true, texto: "¿Están identificados los documentos que deben recuperarse prioritariamente ante una emergencia?" }
  ]},
  { id: "9", titulo: "Documentos electrónicos: respaldo, acceso y responsables", preguntas: [
    { id: 'P-087', n: 87, tipo: 'spn', componente: 'DIG', obs: true, texto: "¿Están identificados los documentos electrónicos, bases de datos o archivos digitales indispensables para continuidad de servicios?" },
    { id: 'P-088', n: 88, tipo: 'spn', componente: 'DIG', obs: true, texto: "¿Las dependencias o funcionarios realizan copias de seguridad por su cuenta?" },
    { id: 'P-089', n: 89, tipo: 'txt', texto: "¿Dónde se guardan esas copias?" },
    { id: 'P-090', n: 90, tipo: 'spn', componente: 'DIG', obs: true, texto: "¿Existe una cuenta institucional de Google Drive administrada por la entidad?" },
    { id: 'P-091', n: 91, tipo: 'spn', componente: 'DIG', obs: true, texto: "¿Existen criterios institucionales sobre quién puede acceder, modificar, eliminar o compartir documentos electrónicos?" },
    { id: 'P-092', n: 92, tipo: 'spn', componente: 'DIG', obs: true, texto: "¿Existe un procedimiento para eliminar documentos electrónicos?" },
    { id: 'P-093', n: 93, tipo: 'spn', componente: 'DIG', obs: true, texto: "¿Está definido cuánto tiempo deben conservarse los documentos electrónicos?" },
    { id: 'P-094', n: 94, tipo: 'spn', componente: 'DIG', obs: true, texto: "¿Existe procedimiento de migración o conversión cuando cambian tecnologías, sistemas o formatos?" },
    { id: 'P-095', n: 95, tipo: 'spn', componente: 'DIG', obs: true, texto: "¿Están definidos los metadatos de los documentos electrónicos?" },
    { id: 'P-096', n: 96, tipo: 'spn', componente: 'DIG', obs: true, texto: "¿Existe un mecanismo institucional para garantizar autenticidad de documentos electrónicos?" },
    { id: 'P-097', n: 97, tipo: 'spn', componente: 'DIG', obs: true, texto: "¿Están identificados los sistemas de información que producen, reciben o almacenan documentos electrónicos de archivo?" },
    { id: 'P-098', n: 98, tipo: 'spn', componente: 'DIG', obs: true, texto: "¿Existe inventario institucional de sistemas, aplicaciones, bases de datos y repositorios digitales?" },
    { id: 'P-099', n: 99, tipo: 'spn', componente: 'DIG', obs: true, texto: "¿Cada sistema o repositorio tiene un responsable formal de conservar su información?" },
    { id: 'P-100', n: 100, tipo: 'txt', texto: "¿Los correos institucionales relacionados con funciones se conservan como documentos de archivo?" },
    { id: 'P-101', n: 101, tipo: 'spn', componente: 'CAP', obs: true, texto: "¿Los funcionarios han recibido capacitación sobre gestión y protección de documentos electrónicos?" },
    { id: 'P-102', n: 102, tipo: 'spn', componente: 'CAP', obs: true, texto: "¿Han recibido capacitación sobre conservación preventiva de documentos físicos?" },
    { id: 'P-103', n: 103, tipo: 'spn', componente: 'CAP', obs: true, texto: "¿Existen otros funcionarios con formación específica en conservación documental o preservación digital?" },
    { id: 'P-104', n: 104, tipo: 'spn', componente: 'DIG', obs: true, texto: "¿Sistemas estaría disponible para participar en preservación digital, copias de seguridad, seguridad y recuperación?" }
  ]},
  { id: "10", titulo: "Participación, Comité, recursos y espacios", preguntas: [
    { id: 'P-105', n: 105, tipo: 'txt', texto: "¿Qué otras áreas deberían participar directamente en el SIC?" },
    { id: 'P-106', n: 106, tipo: 'spn', componente: 'GOB', obs: true, texto: "¿El Comité Institucional de Gestión y Desempeño conoce la situación del archivo?" },
    { id: 'P-107', n: 107, tipo: 'spn', componente: 'GOB', obs: true, texto: "¿El Comité ha tomado decisiones o establecido compromisos concretos?" },
    { id: 'P-108', n: 108, tipo: 'spn', componente: 'GOB', obs: true, texto: "¿Existen actas, informes, memorandos u otros documentos que registren formalmente la problemática y acciones?" },
    { id: 'P-109', n: 109, tipo: 'spn', componente: 'GOB', obs: true, texto: "¿Esos antecedentes están disponibles actualmente para consulta?" },
    { id: 'P-110', n: 110, tipo: 'spn', componente: 'GOB', obs: true, texto: "¿Existe seguimiento para verificar el cumplimiento de acciones relacionadas con el archivo?" },
    { id: 'P-111', n: 111, tipo: 'spn', componente: 'REC', obs: true, texto: "¿Habría posibilidad de asignar recursos económicos para ejecutar el SIC?" },
    { id: 'P-112', n: 112, tipo: 'spn', componente: 'REC', obs: true, texto: "¿La entidad podría contratar servicios externos especializados?" },
    { id: 'P-113', n: 113, tipo: 'spn', componente: 'ALM', obs: true, texto: "¿Existe algún espacio que pueda destinarse progresivamente como Archivo Central?" },
    { id: 'P-114', n: 114, tipo: 'spn', obs: true, texto: "¿Las dependencias tienen espacios propios donde almacenan sus archivos?" },
    { id: 'P-115', n: 115, tipo: 'spn', componente: 'ALM', obs: true, texto: "¿Esos espacios son exclusivos para archivo?" },
    { id: 'P-116', n: 116, tipo: 'spn', componente: 'SEG', obs: true, texto: "¿Existe control que limite el acceso a los documentos al personal autorizado?" },
    { id: 'P-117', n: 117, tipo: 'spn', componente: 'SEG', inversa: true, obs: true, texto: "¿Personas externas pueden acceder a los espacios documentales sin acompañamiento o control específico?" }
  ]},
  { id: "11", titulo: "Consulta, materiales, valoración y expedientes", preguntas: [
    { id: 'P-118', n: 118, tipo: 'spn', componente: 'PRO', obs: true, texto: "¿Existe registro de préstamo de documentos físicos?" },
    { id: 'P-119', n: 119, tipo: 'spn', componente: 'PRO', obs: true, texto: "¿Existe procedimiento para solicitar, consultar y reproducir documentos?" },
    { id: 'P-120', n: 120, tipo: 'spn', componente: 'PRO', obs: true, texto: "¿Existen medidas para evitar manipulación innecesaria o prácticas que deterioren originales?" },
    { id: 'P-121', n: 121, tipo: 'spn', componente: 'ALM', obs: true, texto: "¿Se utilizan materiales adecuados de conservación documental?" },
    { id: 'P-122', n: 122, tipo: 'spn', componente: 'ALM', inversa: true, obs: true, texto: "¿También se utilizan materiales potencialmente inadecuados?" },
    { id: 'P-123', n: 123, tipo: 'spn', componente: 'EME', obs: true, texto: "¿La entidad sabe cuáles documentos deben protegerse primero por su vulnerabilidad?" },
    { id: 'P-124', n: 124, tipo: 'txt', texto: "¿Existe un inventario o diagnóstico físico detallado por espacio?" },
    { id: 'P-125', n: 125, tipo: 'spn', componente: 'INS', obs: true, texto: "¿El diagnóstico de 2024 contiene información física detallada o es principalmente general?" },
    { id: 'P-126', n: 126, tipo: 'spn', componente: 'INS', obs: true, texto: "¿Están identificados documentos, fondos o series con valor histórico que deban conservarse permanentemente?" },
    { id: 'P-127', n: 127, tipo: 'spn', componente: 'INS', obs: true, texto: "¿Se han transferido documentos históricos al AGN, Archivo Departamental u otro archivo histórico?" },
    { id: 'P-128', n: 128, tipo: 'spn', componente: 'INS', obs: true, texto: "¿Existe actualmente valoración documental para determinar conservación permanente o eliminación?" },
    { id: 'P-129', n: 129, tipo: 'spn', obs: true, texto: "¿Se han realizado eliminaciones documentales formales en los últimos años?" },
    { id: 'P-130', n: 130, tipo: 'txt', texto: "¿Quién autoriza actualmente el retiro o eliminación de documentos que una dependencia considera innecesarios?" },
    { id: 'P-131', n: 131, tipo: 'spn', componente: 'PRO', obs: true, texto: "¿Se realizan transferencias primarias periódicas al Archivo Central u otro espacio institucional?" },
    { id: 'P-132', n: 132, tipo: 'spn', componente: 'PRO', obs: true, texto: "¿Las dependencias separan documentos en trámite de documentos ya terminados?" },
    { id: 'P-133', n: 133, tipo: 'spn', componente: 'PRO', obs: true, texto: "¿Cuando termina un trámite se conforma un expediente con los documentos relacionados?" },
    { id: 'P-134', n: 134, tipo: 'txt', texto: "¿Los documentos de esos expedientes mantienen un orden definido?" },
    { id: 'P-135', n: 135, tipo: 'spn', componente: 'DIG', obs: true, texto: "¿Se conforman expedientes electrónicos institucionalmente?" }
  ]},
  { id: "12", titulo: "Plataforma de gestión documental y cierre", preguntas: [
    { id: 'P-136', n: 136, tipo: 'txt', noAplicaSi: { pregunta: 'P-021', valor: 'no' }, texto: "¿Por qué no se utiliza la plataforma de gestión documental existente?" },
    { id: 'P-137', n: 137, tipo: 'spn', noAplicaSi: { pregunta: 'P-021', valor: 'no' }, componente: 'DIG', obs: true, texto: "¿Debería aprovecharse esa plataforma para centralizar documentos electrónicos y apoyar la preservación digital?" },
    { id: 'P-138', n: 138, tipo: 'spn', noAplicaSi: { pregunta: 'P-021', valor: 'no' }, componente: 'DIG', obs: true, texto: "¿La Oficina de Sistemas tiene capacidad técnica para implementar y administrar la plataforma?" },
    { id: 'P-139', n: 139, tipo: 'spn', componente: 'REC', obs: true, texto: "¿La entidad estaría dispuesta a establecer indicadores y hacer seguimiento periódico al SIC?" },
    { id: 'P-140', n: 140, tipo: 'txt', texto: "¿Cuál es la principal condición que impide mejorar la conservación y preservación documental?" }
  ]}
]

// ---------------- Sección 2 · Ficha de inspección por espacio ----------------
export const FICHA = [
  // Sin bloque de volumen: no es viable medir con flexómetro en campo (decisión oct. 2026).
  { id: 'B', titulo: 'Organización y soportes', preguntas: [
    { id: 'FI-06', tipo: 'multi', texto: 'Soportes distintos al papel presentes',
      opciones: ['Planos', 'Fotografías', 'CD-DVD', 'USB', 'Cintas', 'Libros o tomos', 'Ninguno'] },
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
// FI-34 (fotografías) se maneja como adjuntos del espacio. Son opcionales:
// se recomiendan 3 (panorámica, mobiliario y el deterioro más grave).
export const FOTOS_MINIMAS = 0
export const FOTOS_RECOMENDADAS = 3

// ---------------- Sección 3 · Sistemas ----------------
// Las preguntas de documentos electrónicos están en el cuestionario de 140 (bloques 4 y 9).
// Aquí queda solo el inventario de sistemas y repositorios (opcional).
export const SISTEMAS = []

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

// Aplicabilidad: una pregunta con noAplicaSi deja de aplicar cuando la pregunta
// de la que depende tiene ese valor (p. ej. sin plataforma ⇒ no se pregunta por su uso).
export function aplica(p, respuestas) {
  if (!p?.noAplicaSi) return true
  return respuestas?.[p.noAplicaSi.pregunta]?.v !== p.noAplicaSi.valor
}

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
    ficha: FICHA, fotosMinimas: FOTOS_MINIMAS, fotosRecomendadas: FOTOS_RECOMENDADAS, sistemas: SISTEMAS, repositorio: REPOSITORIO }
}
