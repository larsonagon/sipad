// ======================================================
// SIPAD · Diagnóstico SIC — Motor de interpretación (determinista)
// ------------------------------------------------------
// Convierte las respuestas del formulario en:
//   1. (Sin volumen: no se mide en campo.) Estado y riesgo por espacio.
//   2. Indicador 0–100 por componente del SIC.
//   3. Nivel de riesgo por espacio (crítico/alto/medio/bajo) con sus factores.
//   4. Riesgo por repositorio electrónico.
//   5. Hallazgos → programa → acción → prioridad → plazo → costo,
//      cada uno con la(s) pregunta(s) de la que sale (trazabilidad).
//   6. Tareas de verificación (respuestas "No sabe").
//   Las reglas leen el cuestionario de 140 preguntas (P-001…P-140) y, si existe,
//   la inspección opcional por espacio (FI-xx).
//   7. Avance de diligenciamiento.
//
// Funciones puras: sin base de datos ni red. Mismos datos ⇒ mismo resultado.
// Valor de cada respuesta: { v, x?, s?, o? } (valor, extra, soporte, observación).
// ======================================================

import { COMPONENTES, INSTITUCIONAL, FICHA, SISTEMAS, REGISTRO_ESPACIO, REPOSITORIO, FOTOS_MINIMAS, indicePreguntas, aplica } from './sic.formulario.js'

const IDX = indicePreguntas()
export const PRECARGA = 'precarga'

export const PRIORIDADES = ['crítica', 'alta', 'media', 'baja']
export const PLAZOS = {
  'crítica': 'Inmediato (0–1 mes)',
  'alta': 'Corto plazo (1–3 meses)',
  'media': 'Mediano plazo (3–6 meses)',
  'baja': 'Largo plazo (6–12 meses)'
}
export const COSTOS = {
  sin_costo: 'Sin costo (gestión interna)',
  bajo: 'Costo bajo (insumos o compras menores)',
  contratacion: 'Requiere presupuesto o contratación'
}

// ---------------- utilidades de lectura ----------------
const val = (o, id) => (o && o[id] ? o[id].v : undefined)
const ext = (o, id) => (o && o[id] ? o[id].x : undefined)
const num = (x) => { const n = Number(String(x ?? '').replace(',', '.')); return Number.isFinite(n) ? n : null }
const vacio = (v) => v === undefined || v === null || v === '' || (Array.isArray(v) && v.length === 0)
const r1 = (n) => Math.round(n * 10) / 10

export const esSi = (v) => v === 'si'
export const esNo = (v) => v === 'no'
export const esParcial = (v) => v === 'parcial'
export const esNs = (v) => v === 'ns'
const noOParcial = (v) => v === 'no' || v === 'parcial'

const nombreEspacio = (e) => (val(e.registro, 'ESP-01') || '(espacio sin nombre)').toString()

// ---------------- 2. Puntaje de una respuesta (0..1 o null) ----------------
function puntaje(p, v) {
  if (vacio(v) || v === 'ns') return null
  switch (p.tipo) {
    case 'spn': {
      const base = v === 'si' ? 1 : v === 'parcial' ? 0.5 : v === 'no' ? 0 : null
      if (base === null) return null
      return p.inversa ? 1 - base : base
    }
    case 'escala': return v === 'ausente' ? 1 : v === 'puntual' ? 0.5 : v === 'extendido' ? 0 : null
    case 'lista': return p.puntaje && v in p.puntaje ? p.puntaje[v] : null
    default: return null
  }
}

// Reglas de puntaje para preguntas numéricas institucionales
function puntajeNumerico(id, v, ctx) {
  const n = num(v); if (n === null) return null
  if (id === 'IN-02') return Math.min(1, n / 100)
  if (id === 'IN-03') return n >= 2 ? 1 : n === 1 ? 0.5 : 0
  if (id === 'IN-24') return n >= 2 ? 1 : n === 1 ? 0.5 : 0
  if (id === 'IN-11' && ctx.totalDependencias) return Math.min(1, n / ctx.totalDependencias)
  return null
}

// ---------------- 3. Riesgo por espacio ----------------
// Pesos: el agua y los hongos pesan más (riesgo para los documentos y la salud del personal).
export function riesgoEspacio(e) {
  const f = e.ficha || {}
  // La inspección por espacio es opcional: sin ficha no se califica el riesgo del espacio
  if (!Object.values(f).some(x => x && !vacio(x.v))) return { puntos: 0, nivel: null, factores: [] }
  const factores = []
  let pts = 0
  const add = (p, txt, id) => { pts += p; factores.push({ puntos: p, factor: txt, pregunta: id }) }

  const esc = (id, ext, punt, txt) => {
    const v = val(f, id)
    if (v === 'extendido') add(ext, `${txt} (extendido)`, id)
    else if (v === 'puntual') add(punt, `${txt} (puntual)`, id)
  }
  esc('FI-11', 30, 15, 'Hongos o manchas de humedad')
  esc('FI-12', 20, 10, 'Presencia de plagas')
  esc('FI-13', 10, 5, 'Daño por plagas')

  const sp = (id, pSi, txt, pParcial = Math.round(pSi / 2)) => {
    const v = val(f, id)
    if (v === 'si') add(pSi, txt, id); else if (v === 'parcial') add(pParcial, txt + ' (parcial)', id)
  }
  sp('FI-17', 20, 'Filtraciones o goteras')
  sp('FI-19', 15, 'Humedad visible en paredes o piso')
  sp('FI-18', 10, 'Tuberías, baños o tanques cercanos')
  sp('FI-24', 10, 'Acceso de externos sin acompañamiento')
  sp('FI-22', 10, 'Instalaciones eléctricas expuestas')
  sp('FI-25', 5, 'Objetos ajenos o inflamables')

  if (esNo(val(f, 'FI-23'))) add(10, 'Sin cerradura funcional', 'FI-23')
  if (esNo(val(f, 'FI-30'))) add(10, 'Sin extintor', 'FI-30')
  if (esNo(val(f, 'FI-27'))) add(10, 'Documentos en contacto con el piso', 'FI-27')
  if ((val(f, 'FI-26') || []).includes('Cajas en el piso')) add(5, 'Cajas sobre el piso', 'FI-26')

  const malo = num(f['FI-10']?.v?.malo)
  if (malo !== null && malo > 0) add(Math.min(20, Math.round(malo * 0.2)), `${malo} % en mal estado`, 'FI-10')

  if (val(e.registro, 'ESP-04') === 'Inmueble externo o abandonado') add(10, 'Inmueble externo o abandonado', 'ESP-04')

  let nivel = pts >= 70 ? 'crítica' : pts >= 45 ? 'alta' : pts >= 20 ? 'media' : 'baja'
  // Reglas de piso: hongos extendidos o agua + documentos en el piso nunca pueden quedar abajo
  const forzar = (min) => { if (PRIORIDADES.indexOf(nivel) > PRIORIDADES.indexOf(min)) nivel = min }
  if (val(f, 'FI-11') === 'extendido') forzar('crítica')
  if (esSi(val(f, 'FI-17')) && esNo(val(f, 'FI-27'))) forzar('alta')

  return { puntos: pts, nivel, factores: factores.sort((a, b) => b.puntos - a.puntos) }
}

// ---------------- 4. Riesgo por repositorio ----------------
export function riesgoRepositorio(r) {
  const d = r.datos || {}
  const factores = []
  let pts = 0
  const indispensable = esSi(val(d, 'SR-11'))
  const backup = val(d, 'SR-09')
  const tipo = val(d, 'SR-02')
  const sinBackup = backup === 'Nunca' || backup === 'Ocasional'
  const personal = tipo === 'Computador local' || tipo === 'Nube personal'

  if (indispensable) { pts += 30; factores.push('Indispensable para la continuidad del servicio') }
  if (backup === 'Nunca') { pts += 30; factores.push('Sin copia de seguridad') }
  else if (backup === 'Ocasional') { pts += 20; factores.push('Copia de seguridad ocasional') }
  else if (vacio(backup)) { pts += 10; factores.push('Copia de seguridad no informada') }
  if (personal) { pts += 20; factores.push(`Almacenado en ${tipo.toLowerCase()}`) }
  if (vacio(val(d, 'SR-04'))) { pts += 5; factores.push('Sin responsable identificado') }
  if (esSi(val(d, 'SR-12')) && vacio(ext(d, 'SR-12'))) { pts += 5; factores.push('Depende de proveedor sin fecha de vencimiento conocida') }

  let nivel = pts >= 70 ? 'crítica' : pts >= 45 ? 'alta' : pts >= 20 ? 'media' : 'baja'
  if (indispensable && sinBackup && personal) nivel = 'crítica'
  return { puntos: pts, nivel, factores }
}

// ---------------- 5. Indicadores por componente ----------------
export function indicadores(ctx) {
  const acc = {}
  const sumar = (comp, s) => {
    if (!comp || s === null || s === undefined) return
    acc[comp] = acc[comp] || { suma: 0, n: 0 }
    acc[comp].suma += s; acc[comp].n += 1
  }
  for (const b of [...INSTITUCIONAL, ...SISTEMAS]) for (const p of b.preguntas) {
    const v = val(ctx.institucional, p.id)
    const s = p.tipo === 'num' ? puntajeNumerico(p.id, v, ctx) : puntaje(p, v)
    sumar(p.componente, s)
  }
  for (const e of ctx.espacios) for (const b of FICHA) for (const p of b.preguntas) {
    sumar(p.componente, puntaje(p, val(e.ficha, p.id)))
  }
  const out = []
  for (const [k, nombre] of Object.entries(COMPONENTES)) {
    const a = acc[k]
    const valor = a && a.n ? Math.round((a.suma / a.n) * 100) : null
    out.push({ componente: k, nombre, valor, respuestas: a?.n || 0,
      nivel: valor === null ? 'sin datos' : valor < 25 ? 'crítico' : valor < 50 ? 'bajo' : valor < 75 ? 'medio' : 'adecuado' })
  }
  return out
}

// ---------------- 6. Reglas: hallazgo → acción ----------------
// Cada regla devuelve 0..n hallazgos. `evidencia` = preguntas de origen (P-xxx del
// cuestionario de 140; FI-xx y ESP-xx de la inspección opcional por espacio).
// Las respuestas "No sabe" nunca disparan un hallazgo: van a verificaciones.
function reglas(ctx) {
  const I = ctx.institucional
  const E = ctx.espacios
  const R = ctx.repositorios
  const H = []
  const h = (o) => H.push({ costo: 'sin_costo', espacios: [], ...o })
  const espaciosDonde = (pred) => E.filter(pred).map(nombreEspacio)
  const lista = (arr) => arr.join(', ')

  const P = (n) => `P-${String(n).padStart(3, '0')}`
  const r = (n) => val(I, P(n))
  const si = (n) => esSi(r(n))
  const no = (n) => esNo(r(n))
  const noP = (n) => noOParcial(r(n))
  const texto = (n) => `${typeof r(n) === 'string' && !['si', 'no', 'parcial', 'ns'].includes(r(n)) ? r(n) : ''} ${I[P(n)]?.o || ''}`.toLowerCase()
  const ev = (...ns) => ns.map(P)

  // ---- Gobierno y responsabilidades ----
  if (noP(2))
    h({ componente: 'GOB', prioridad: 'alta', evidencia: ev(2),
      hallazgo: 'Las responsabilidades del encargado de la gestión documental no están formalmente asignadas.',
      accion: 'Expedir el acto administrativo que asigna la responsabilidad de la gestión documental y la coordinación del SIC, con funciones y alcance definidos.' })
  if (noP(3) || no(43))
    h({ componente: 'GOB', prioridad: 'alta', costo: 'contratacion', evidencia: ev(3, 43, 62),
      hallazgo: 'El responsable de archivo no está dedicado exclusivamente a la gestión documental y no cuenta con tiempo, personal de apoyo ni recursos para ejecutar la conservación.',
      accion: 'Asignar o contratar personal de apoyo para ejecutar el SIC y aumentar la dedicación del responsable a la gestión documental.' })
  if (noP(5))
    h({ componente: 'GOB', prioridad: 'media', evidencia: ev(5, 60),
      hallazgo: 'No existe una oficina o grupo de gestión documental; la función depende de otra secretaría.',
      accion: 'Formalizar un grupo o área de gestión documental con funciones, responsables y ubicación definida en la estructura de la entidad.' })
  if (noP(107) || no(110))
    h({ componente: 'GOB', prioridad: 'alta', evidencia: ev(106, 107, 110),
      hallazgo: 'El Comité Institucional de Gestión y Desempeño conoce la situación del archivo, pero no hay compromisos ni acciones formales vigentes con seguimiento.',
      accion: 'Presentar el SIC al Comité y dejar en acta los compromisos, responsables, fechas e indicadores de seguimiento.' })
  if (noP(61))
    h({ componente: 'REC', prioridad: 'alta', evidencia: ev(61, 140),
      hallazgo: 'La alta dirección todavía no reconoce la conservación documental como prioridad.',
      accion: 'Presentar a la alta dirección los riesgos del diagnóstico (pérdida de información, sanciones y salud del personal) y obtener la aprobación formal del SIC.' })

  // ---- Instrumentos archivísticos ----
  if (noP(31) || no(32))
    h({ componente: 'INS', prioridad: 'alta', evidencia: ev(31, 32),
      hallazgo: 'Las dependencias no organizan sus documentos con una TRD vigente: las TRD están en actualización y la anterior no se aplica.',
      accion: 'Culminar la actualización de las TRD, aprobarlas en el Comité y convalidarlas; mientras tanto, organizar por asuntos y no eliminar documentos.' })
  if (no(36))
    h({ componente: 'INS', prioridad: 'media', evidencia: ev(36),
      hallazgo: 'No se conocen las TRD aprobadas anteriormente ni el acto administrativo que las aprobó.',
      accion: 'Buscar en los archivos de la Secretaría de Gobierno y en las actas del Comité los actos de aprobación de TRD anteriores y dejar constancia del resultado.' })
  const conFuid = num(r(11)) // compatibilidad con datos anteriores
  if (noP(34) || no(35) || (ctx.totalDependencias && conFuid !== null && conFuid < ctx.totalDependencias))
    h({ componente: 'INS', prioridad: 'alta', evidencia: ev(34, 35, 58),
      hallazgo: 'Los inventarios documentales (FUID) existen solo en algunas dependencias y están desactualizados; no se sabe con certeza qué documentos hay ni dónde.',
      accion: 'Levantar o actualizar el FUID en todas las dependencias, empezando por los espacios de mayor riesgo.' })
  const acumulados = espaciosDonde(e => esSi(val(e.registro, 'ESP-10')))
  if (si(59) || no(126) || no(128) || acumulados.length)
    h({ componente: 'INS', prioridad: 'media', costo: 'contratacion', evidencia: [...ev(59, 126, 127, 128), 'ESP-10'], espacios: acumulados,
      hallazgo: 'Hay documentos de administraciones anteriores acumulados sin organizar; no están identificados los fondos o series con valor histórico y no existe valoración documental.',
      accion: 'Organizar y valorar el fondo acumulado mediante Tabla de Valoración Documental (TVD) e identificar y proteger primero los documentos de conservación permanente.' })
  if (no(37) || no(38) || no(39))
    h({ componente: 'INS', prioridad: 'alta', evidencia: ev(37, 38, 39, 40),
      hallazgo: 'La entidad nunca ha tenido Sistema Integrado de Conservación, Plan de Conservación Documental ni Plan de Preservación Digital.',
      accion: 'Aprobar el SIC con sus dos planes en el Comité Institucional de Gestión y Desempeño e iniciar su ejecución por la fase de estabilización.' })

  // ---- Procedimientos ----
  if (no(66) || no(67) || no(65))
    h({ componente: 'PRO', prioridad: 'alta', evidencia: ev(64, 65, 66, 67),
      hallazgo: 'No hay procedimientos escritos ni un criterio común: cada dependencia organiza y almacena a su manera y no tiene claro quién responde por los documentos.',
      accion: 'Adoptar un procedimiento único de organización, almacenamiento y manipulación de archivos, con responsables por dependencia, y acompañar su aplicación.' })
  if (no(68) || no(69))
    h({ componente: 'PRO', prioridad: 'alta', evidencia: ev(68, 69),
      hallazgo: 'No se hace entrega documental con inventario cuando un funcionario se retira o cambia de cargo.',
      accion: 'Exigir el inventario documental (FUID) y acta de entrega como requisito para el retiro o traslado de funcionarios y contratistas.' })
  if (/ningun|nadie/.test(texto(130)) || /se cree|informal/.test(texto(129)))
    h({ componente: 'PRO', prioridad: 'alta', evidencia: ev(129, 130),
      hallazgo: 'Ninguna instancia autoriza la eliminación de documentos y se presume que ha habido eliminaciones sin procedimiento formal.',
      accion: 'Suspender toda eliminación informal; establecer que solo se elimina lo previsto en la TRD/TVD convalidada, con inventario publicado y aprobación del Comité.' })
  const externos = espaciosDonde(e => esSi(val(e.ficha, 'FI-24')))
  if (noP(118) || noP(119) || no(120))
    h({ componente: 'PRO', prioridad: externos.length ? 'alta' : 'media', evidencia: [...ev(118, 119, 120), 'FI-24'], espacios: externos,
      hallazgo: 'No existe registro de préstamo ni procedimiento de consulta y reproducción, ni medidas para evitar la manipulación innecesaria de originales.',
      accion: 'Implementar el formato de préstamo y consulta (quién, qué, cuándo, devolución) y restringir la manipulación de originales.' })
  if (noP(132) || noP(133))
    h({ componente: 'PRO', prioridad: 'media', evidencia: ev(132, 133, 134),
      hallazgo: 'No todas las dependencias separan los documentos en trámite ni conforman expedientes al terminar un trámite.',
      accion: 'Capacitar y acompañar a las dependencias en la conformación de expedientes y en la separación de documentos en trámite y finalizados.' })
  if (no(33) || no(131))
    h({ componente: 'PRO', prioridad: 'media', evidencia: ev(33, 131),
      hallazgo: 'No se realizan transferencias documentales primarias porque no existe Archivo Central.',
      accion: 'Elaborar el cronograma de transferencias primarias una vez se defina el espacio del Archivo Central y se aprueben las TRD.' })

  // ---- Capacitación ----
  if (noP(16) || no(101) || no(102) || no(71))
    h({ componente: 'CAP', prioridad: 'alta', evidencia: ev(16, 71, 101, 102),
      hallazgo: 'El personal casi no ha recibido capacitación en manejo, conservación ni documento electrónico, y no sabe qué hacer ni a quién informar ante hongos, humedad o plagas.',
      accion: 'Ejecutar el programa de capacitación y sensibilización: manipulación, organización, conservación preventiva, documento electrónico y reporte de deterioro, con registro de asistencia.' })
  if (no(44) || no(103))
    h({ componente: 'CAP', prioridad: 'media', costo: 'bajo', evidencia: ev(44, 103),
      hallazgo: 'Ni el responsable de archivo ni otros funcionarios tienen formación en conservación preventiva o preservación digital.',
      accion: 'Gestionar formación especializada para el responsable (cursos virtuales del ente rector u otras entidades).' })

  // ---- Saneamiento y protección del personal ----
  const conHongos = espaciosDonde(e => ['puntual', 'extendido'].includes(val(e.ficha, 'FI-11')))
  const conPlagas = espaciosDonde(e => ['puntual', 'extendido'].includes(val(e.ficha, 'FI-12')))
  const deterioro = si(14) || conHongos.length > 0
  const plagas = si(50) || si(78) || si(79) || conPlagas.length > 0
  if (deterioro && (noP(72) || no(82)))
    h({ componente: 'SAN', prioridad: 'crítica', costo: 'bajo', evidencia: [...ev(14, 72, 82), 'FI-11'], espacios: conHongos,
      hallazgo: 'Hay documentos deteriorados, incluso con hongos, que se manipulan normalmente y sin elementos de protección personal.',
      accion: 'Suspender la manipulación de documentos con hongos sin protección; dotar elementos de protección personal (tapabocas, guantes, bata), adoptar el protocolo de manipulación e informar a Seguridad y Salud en el Trabajo.' })
  if ((deterioro || plagas) && no(81))
    h({ componente: 'SAN', prioridad: 'crítica', costo: 'bajo', evidencia: [...ev(81), 'FI-11', 'FI-12'], espacios: [...new Set([...conHongos, ...conPlagas])],
      hallazgo: 'No existe un espacio de aislamiento para los documentos afectados por hongos o plagas.',
      accion: 'Habilitar un área de cuarentena (aunque sea provisional) para aislar las unidades afectadas y evitar la contaminación de las demás.' })
  if (plagas && noP(51))
    h({ componente: 'SAN', prioridad: 'crítica', costo: 'contratacion', evidencia: [...ev(50, 51, 78, 79), 'FI-12', 'FI-13'], espacios: conPlagas,
      hallazgo: 'Hay plagas con daño visible en los documentos y no se realiza control de plagas ni fumigación.',
      accion: 'Contratar saneamiento ambiental (desinsectación, desratización y desinfección) de los espacios de archivo, con periodicidad definida y registro.' })
  if (no(13) || no(73) || no(83))
    h({ componente: 'SAN', prioridad: 'alta', evidencia: ev(13, 73, 83),
      hallazgo: 'No se hace limpieza periódica de documentos, cajas y estanterías, ni desinfección después de filtraciones o plagas.',
      accion: 'Establecer jornadas periódicas de limpieza en seco de espacios, estanterías y unidades de conservación, con responsable y registro.' })
  if (deterioro && no(80))
    h({ componente: 'SAN', prioridad: 'media', costo: 'contratacion', evidencia: ev(14, 80),
      hallazgo: 'Los documentos afectados por humedad, hongos o plagas no han tenido ninguna intervención.',
      accion: 'Evaluar con un conservador los documentos afectados y priorizar su intervención según su valor y gravedad.' })

  // ---- Condiciones ambientales ----
  if (no(12) || no(74))
    h({ componente: 'AMB', prioridad: 'media', costo: 'bajo', evidencia: ev(12, 74),
      hallazgo: 'No se monitorean la temperatura ni la humedad relativa en los espacios de archivo.',
      accion: 'Instalar termohigrómetros en los espacios principales y registrar las lecturas periódicamente.' })
  const ventilacion = espaciosDonde(e => ['Deficiente', 'Nula'].includes(val(e.ficha, 'FI-20')))
  if (noP(53) || ventilacion.length)
    h({ componente: 'AMB', prioridad: 'media', costo: 'bajo', evidencia: [...ev(53), 'FI-20'], espacios: ventilacion,
      hallazgo: 'La ventilación de los espacios de archivo es deficiente.',
      accion: 'Mejorar la circulación de aire (ventilación natural controlada o ventiladores) y evitar que las unidades queden contra paredes húmedas.' })
  if (no(75))
    h({ componente: 'AMB', prioridad: 'baja', costo: 'bajo', evidencia: ev(52, 75),
      hallazgo: 'No existen medidas para controlar la iluminación sobre los documentos.',
      accion: 'Usar cortinas o filtros y apagar la iluminación de los depósitos cuando no se usan.' })

  // ---- Instalaciones y agua ----
  const aguaEsp = espaciosDonde(e => esSi(val(e.ficha, 'FI-17')) || esSi(val(e.ficha, 'FI-18')) || esSi(val(e.ficha, 'FI-19')))
  if (si(47) || si(48) || aguaEsp.length)
    h({ componente: 'INSP', prioridad: (si(48) && si(11)) || E.some(e => esSi(val(e.ficha, 'FI-17')) && esNo(val(e.ficha, 'FI-27'))) ? 'crítica' : 'alta',
      costo: 'contratacion', evidencia: [...ev(47, 48, 76, 77), 'FI-17', 'FI-18', 'FI-19'], espacios: aguaEsp,
      hallazgo: 'Hay riesgo de agua (filtraciones o inundación) y el agua ya ha dañado documentos; no todas las unidades están protegidas.',
      accion: 'Reparar filtraciones y fuentes de humedad; mientras tanto, retirar y elevar las unidades expuestas y protegerlas del contacto con el agua.' })
  if (no(42))
    h({ componente: 'INSP', prioridad: 'media', evidencia: ev(40, 42),
      hallazgo: 'No se hace seguimiento periódico al estado de conservación de los documentos ni de los espacios.',
      accion: 'Programar inspecciones periódicas de los espacios de archivo con un formato de registro y reporte al responsable.' })
  const electricas = espaciosDonde(e => esSi(val(e.ficha, 'FI-22')))
  if (electricas.length)
    h({ componente: 'INSP', prioridad: 'alta', costo: 'contratacion', evidencia: ['FI-22'], espacios: electricas,
      hallazgo: `Instalaciones eléctricas expuestas o en mal estado en ${electricas.length} espacio(s).`,
      accion: 'Revisar y corregir las instalaciones eléctricas de los espacios de archivo.' })

  // ---- Almacenamiento ----
  if (no(6) || no(113))
    h({ componente: 'ALM', prioridad: 'alta', costo: 'contratacion', evidencia: ev(6, 7, 113),
      hallazgo: 'No existe Archivo Central ni un espacio identificado para él; la documentación está repartida en varios lugares, algunos inadecuados, y en las oficinas.',
      accion: 'Definir y adecuar progresivamente un espacio para el Archivo Central con capacidad para recibir las transferencias de las dependencias y su crecimiento esperado.' })
  if (si(8))
    h({ componente: 'ALM', prioridad: 'alta', costo: 'contratacion', evidencia: ev(8, 60),
      hallazgo: 'Hay acumulación de documentos y falta de espacio para almacenarlos.',
      accion: 'Liberar espacio con la organización de los archivos de gestión y, una vez convalidadas las TRD y TVD, con las transferencias y eliminaciones autorizadas.' })
  const piso = espaciosDonde(e => esNo(val(e.ficha, 'FI-27')) || (val(e.ficha, 'FI-26') || []).includes('Cajas en el piso'))
  if (si(11) || no(54) || piso.length)
    h({ componente: 'ALM', prioridad: 'alta', costo: 'bajo', evidencia: [...ev(11, 54), 'FI-27', 'FI-26'], espacios: piso,
      hallazgo: 'Hay documentos y cajas directamente sobre el piso, y la estantería no los mantiene separados del piso y de las paredes.',
      accion: 'Elevar del piso todas las unidades (estibas o entrepaño inferior a 10 cm como mínimo) y ubicarlas en estantería.' })
  if (noP(15) || si(122) || noP(121))
    h({ componente: 'ALM', prioridad: 'media', costo: 'contratacion', evidencia: ev(10, 15, 121, 122),
      hallazgo: 'Las unidades de conservación no están estandarizadas: se usan cajas improvisadas y materiales inadecuados junto con los de archivo.',
      accion: 'Re-almacenar en cajas y carpetas de archivo adecuadas, priorizando los espacios de mayor riesgo.' })
  const graves = E.filter(e => esSi(val(e.ficha, 'FI-16')))
  if (no(70) || graves.length)
    h({ componente: 'ALM', prioridad: 'alta', evidencia: [...ev(70), 'FI-16'], espacios: graves.map(nombreEspacio),
      hallazgo: 'Los documentos con deterioro grave no se han identificado ni separado.',
      accion: 'Separar, rotular e inventariar los documentos con daño grave y evaluar su intervención especializada.' })
  if (noP(57))
    h({ componente: 'ALM', prioridad: 'media', evidencia: ev(56, 57),
      hallazgo: 'Solo algunas cajas y carpetas están identificadas y cerca de la mitad de la documentación tiene problemas de organización.',
      accion: 'Rotular todas las unidades (dependencia, serie, fechas, número) a medida que se organizan.' })
  const inestable = espaciosDonde(e => esNo(val(e.ficha, 'FI-29')))
  if (inestable.length)
    h({ componente: 'ALM', prioridad: 'alta', costo: 'bajo', evidencia: ['FI-29'], espacios: inestable,
      hallazgo: `Estantería inestable o sobrecargada en ${inestable.length} espacio(s).`,
      accion: 'Asegurar y descargar la estantería inestable; reemplazar la que no pueda corregirse.' })

  // ---- Emergencias ----
  if (no(18) || no(85) || no(20))
    h({ componente: 'EME', prioridad: 'alta', evidencia: ev(18, 20, 85),
      hallazgo: 'No existe protocolo ni plan de emergencia documental, y no se hacen simulacros ni capacitación en recuperación.',
      accion: 'Incluir los archivos en el plan de emergencias de la entidad, con prioridades de rescate, responsables y procedimiento de recuperación.' })
  const sinExt = espaciosDonde(e => esNo(val(e.ficha, 'FI-30')))
  if (no(19) || no(84) || si(49) || sinExt.length)
    h({ componente: 'EME', prioridad: 'alta', costo: 'bajo', evidencia: [...ev(19, 49, 84), 'FI-30'], espacios: sinExt,
      hallazgo: 'Hay riesgo de incendio y los espacios de archivo no tienen extintores, detectores, alarmas ni equipos para inundaciones.',
      accion: 'Dotar de extintores adecuados para documentos y con carga vigente a cada espacio de archivo, y de detectores de humo.' })
  if (no(17) || no(86) || no(123))
    h({ componente: 'EME', prioridad: 'alta', evidencia: ev(17, 86, 123),
      hallazgo: 'No están identificados los documentos vitales ni los que deben protegerse o recuperarse primero.',
      accion: 'Identificar los documentos vitales por dependencia (los indispensables para la continuidad y los derechos de ciudadanos y entidad) y definir su protección y copia de respaldo.' })
  const ajenos = espaciosDonde(e => esSi(val(e.ficha, 'FI-25')))
  if (ajenos.length)
    h({ componente: 'EME', prioridad: 'alta', evidencia: ['FI-25'], espacios: ajenos,
      hallazgo: `Objetos ajenos al archivo (aseo, químicos, inservibles o inflamables) en ${ajenos.length} espacio(s).`,
      accion: 'Retirar de los espacios de archivo todos los objetos ajenos, en especial químicos y material inflamable.' })

  // ---- Seguridad y acceso ----
  const abandonados = E.filter(e => val(e.registro, 'ESP-04') === 'Inmueble externo o abandonado')
  const abandonoTxt = /abandon/.test(texto(45))
  if (no(46) || abandonoTxt || abandonados.length)
    h({ componente: 'SEG', prioridad: 'crítica', costo: 'bajo', evidencia: [...ev(45, 46), 'ESP-04'], espacios: abandonados.map(nombreEspacio),
      hallazgo: 'Hay documentos en un lugar abandonado, con una sola llave y sin custodia ni revisión.',
      accion: 'Asignar custodio formal, asegurar cerraduras, controlar las llaves y registrar el ingreso; trasladar prioritariamente los documentos del lugar abandonado.' })
  const inseguros = espaciosDonde(e => esNo(val(e.ficha, 'FI-23')) || esSi(val(e.ficha, 'FI-24')))
  if (noP(116) || si(117) || inseguros.length)
    h({ componente: 'SEG', prioridad: 'alta', costo: 'bajo', evidencia: [...ev(115, 116, 117), 'FI-23', 'FI-24'], espacios: inseguros,
      hallazgo: 'Los espacios donde están los documentos se comparten con otros usos y personas externas pueden entrar sin control.',
      accion: 'Restringir el acceso a los documentos al personal autorizado, con registro de ingreso y control de llaves.' })

  // ---- Preservación digital ----
  const personales = /computador|drive|personal|usb/.test(texto(23))
  if (no(24) || (personales && noP(24)))
    h({ componente: 'DIG', prioridad: 'crítica', costo: 'bajo', evidencia: ev(23, 24, 88, 89),
      hallazgo: 'Los documentos electrónicos se guardan en los computadores de los funcionarios o en cuentas personales y no hay copias de seguridad institucionales.',
      accion: 'Adoptar una política de copias de seguridad (frecuencia, responsable, ubicación separada) y probar la restauración al menos una vez por semestre.' })
  if (no(25))
    h({ componente: 'DIG', prioridad: 'alta', evidencia: ev(25),
      hallazgo: 'No hay procedimiento para recuperar los documentos cuando un computador se daña, se pierde o se reemplaza.',
      accion: 'Definir el procedimiento de entrega y respaldo de la información de los equipos antes de su reparación, reemplazo o del retiro del funcionario.' })
  if (no(26) || no(90))
    h({ componente: 'DIG', prioridad: 'alta', costo: 'bajo', evidencia: ev(26, 90),
      hallazgo: 'No existe una cuenta o repositorio institucional administrado por la entidad ni una directriz para trasladar allí los documentos.',
      accion: 'Habilitar un repositorio institucional (la plataforma de gestión documental o una nube administrada por la entidad) y expedir la directriz de traslado de documentos.' })
  if (si(21) && (/no se utiliza|no se usa|sin uso/.test(texto(21)) || texto(136).trim()))
    h({ componente: 'DIG', prioridad: 'alta', evidencia: ev(21, 136, 137, 138),
      hallazgo: 'La entidad tiene una plataforma de gestión documental que no se utiliza por falta de implementación' + (si(138) ? ', aunque la Oficina de Sistemas tiene capacidad técnica para administrarla.' : '.'),
      accion: 'Implementar la plataforma existente con la Oficina de Sistemas: parametrizarla con la TRD, capacitar a los usuarios y centralizar allí los documentos electrónicos.' })
  if (no(30))
    h({ componente: 'DIG', prioridad: 'alta', evidencia: ev(30, 99, 104),
      hallazgo: 'Ninguna persona o área es responsable formal de la preservación digital a largo plazo.',
      accion: 'Asignar formalmente a la Oficina de Sistemas, junto con el responsable de gestión documental, la preservación digital y las copias de seguridad.' })
  if (no(87) || no(97) || no(98))
    h({ componente: 'DIG', prioridad: 'media', evidencia: ev(87, 97, 98),
      hallazgo: 'No están identificados los sistemas, bases de datos y repositorios que producen o guardan documentos electrónicos, ni los indispensables para la continuidad.',
      accion: 'Elaborar el inventario de sistemas y repositorios y el Registro de Activos de Información.' })
  if (no(27) || no(28) || no(95) || no(96))
    h({ componente: 'DIG', prioridad: 'media', evidencia: ev(27, 28, 95, 96),
      hallazgo: 'No hay formatos de preservación, metadatos ni mecanismos institucionales de integridad y autenticidad para los documentos electrónicos.',
      accion: 'Definir los formatos de preservación, los metadatos mínimos y los controles de integridad (huellas digitales, firmas, registro de auditoría).' })
  if (no(29) || no(94))
    h({ componente: 'DIG', prioridad: 'baja', evidencia: ev(29, 94),
      hallazgo: 'No hay estrategia para la obsolescencia tecnológica ni procedimiento de migración de formatos y sistemas.',
      accion: 'Incluir en el Plan de Preservación Digital el procedimiento de migración y la revisión periódica de formatos y sistemas.' })
  if (no(91) || no(92) || no(93))
    h({ componente: 'DIG', prioridad: 'media', evidencia: ev(91, 92, 93),
      hallazgo: 'No hay criterios para acceder, modificar o eliminar documentos electrónicos, ni tiempos de conservación definidos para ellos.',
      accion: 'Definir permisos de acceso por rol y aplicar la TRD también a los documentos electrónicos.' })
  if (/criterio|cada funcionario/.test(texto(100)))
    h({ componente: 'DIG', prioridad: 'media', evidencia: ev(100),
      hallazgo: 'Cada funcionario administra y conserva los correos institucionales con su propio criterio.',
      accion: 'Definir qué correos son documentos de archivo y cómo se exportan al expediente o al repositorio institucional.' })
  if (no(135))
    h({ componente: 'DIG', prioridad: 'media', evidencia: ev(135),
      hallazgo: 'No se conforman expedientes electrónicos institucionalmente.',
      accion: 'Conformar expedientes electrónicos en la plataforma de gestión documental a medida que se implemente.' })
  const criticos = R.filter(x => riesgoRepositorio(x).nivel === 'crítica')
  if (criticos.length)
    h({ componente: 'DIG', prioridad: 'crítica', evidencia: ['SR-09', 'SR-11', 'SR-02'],
      hallazgo: `${criticos.length} repositorio(s) indispensable(s) sin copia de seguridad y en almacenamiento personal: ${lista(criticos.map(x => val(x.datos, 'SR-01') || '(sin nombre)'))}.`,
      accion: 'Copiar de inmediato la información de estos repositorios al repositorio institucional y asignar un responsable de su conservación.' })

  // ---- Recursos ----
  if (no(41) || no(63) || noP(111))
    h({ componente: 'REC', prioridad: 'media', evidencia: ev(41, 63, 111),
      hallazgo: 'No existe presupuesto específico para conservación, preservación digital o adecuación de archivo, y los recursos disponibles son escasos.',
      accion: 'Ejecutar primero las acciones sin costo y de costo bajo; incluir en el anteproyecto de presupuesto de la siguiente vigencia las que requieren contratación.' })

  return H
}

// ---------------- 7. Verificaciones ("No sabe") ----------------
export function verificaciones(ctx) {
  const out = []
  const revisar = (obj, ids, donde) => {
    for (const id of ids) if (val(obj, id) === 'ns') out.push({ pregunta: id, texto: IDX[id]?.texto || id, donde })
  }
  const idsInst = [...INSTITUCIONAL, ...SISTEMAS].flatMap(b => b.preguntas.filter(p => aplica(p, ctx.institucional)).map(p => p.id))
  revisar(ctx.institucional, idsInst, 'Cuestionario institucional')
  for (const e of ctx.espacios) {
    revisar(e.registro, REGISTRO_ESPACIO.map(p => p.id), nombreEspacio(e))
    revisar(e.ficha, FICHA.flatMap(b => b.preguntas.map(p => p.id)), nombreEspacio(e))
  }
  for (const r of ctx.repositorios) revisar(r.datos, REPOSITORIO.map(p => p.id), val(r.datos, 'SR-01') || 'Repositorio')
  return out
}

// ---------------- 8. Avance ----------------
export function avance(ctx) {
  const contar = (obj, ids) => ids.filter(id => !vacio(val(obj, id))).length
  const idsInst = INSTITUCIONAL.flatMap(b => b.preguntas.filter(p => aplica(p, ctx.institucional)).map(p => p.id))
  const idsSis = SISTEMAS.flatMap(b => b.preguntas.filter(p => aplica(p, ctx.institucional)).map(p => p.id))
  const idsFicha = FICHA.flatMap(b => b.preguntas.filter(p => !p.opcional).map(p => p.id))
  const fichas = ctx.espacios.map(e => {
    const resp = contar(e.ficha, idsFicha)
    return { id: e.id, nombre: nombreEspacio(e), respondidas: resp, total: idsFicha.length,
      fotos: e.fotos || 0, completa: resp === idsFicha.length }
  })
  const pct = (a, b) => (b ? Math.round((a / b) * 100) : 0)
  const inst = contar(ctx.institucional, idsInst)
  const sis = contar(ctx.institucional, idsSis)
  return {
    institucional: { respondidas: inst, total: idsInst.length, pct: pct(inst, idsInst.length),
      // Respuestas precargadas (levantamiento preliminar) que aún no confirma quien responde
      precargadas: idsInst.filter(id => !vacio(val(ctx.institucional, id)) && ctx.auditoria?.[id]?.por === PRECARGA).length },
    sistemas: { respondidas: sis, total: idsSis.length, pct: pct(sis, idsSis.length), repositorios: ctx.repositorios.length },
    espacios: { registrados: ctx.espacios.length, declarados: num(ctx.espaciosDeclarados), fichasCompletas: fichas.filter(f => f.completa).length, fichas },
    // El diagnóstico se basa en el cuestionario; espacios y sistemas son complementos opcionales
    general: pct(inst, idsInst.length)
  }
}

// ---------------- ORQUESTADOR ----------------
export function analizar(entrada = {}) {
  const ctx = {
    institucional: entrada.institucional || {},
    espacios: (entrada.espacios || []).map(e => ({ ...e, registro: e.registro || {}, ficha: e.ficha || {} })),
    repositorios: (entrada.repositorios || []).map(r => ({ ...r, datos: r.datos || {} })),
    dependencias: entrada.dependencias || [],
    espaciosDeclarados: entrada.espaciosDeclarados ?? null,
    auditoria: entrada.auditoria || {}
  }
  ctx.totalDependencias = ctx.dependencias.length || null
  const depNombre = Object.fromEntries(ctx.dependencias.map(d => [String(d.id), d.nombre]))

  // Riesgo por espacio
  const espacios = ctx.espacios.map(e => {
    const riesgo = riesgoEspacio(e)
    const deps = (val(e.registro, 'ESP-03') || []).map(id => depNombre[String(id)] || `Dependencia ${id}`)
    return { id: e.id, nombre: nombreEspacio(e), tipo: val(e.registro, 'ESP-04') || null, dependencias: deps,
      estado: e.ficha['FI-10']?.v || null, riesgo, prioridad_tecnico: val(e.ficha, 'FI-35') || null,
      fotos: e.fotos || 0 }
  })
  const rango = (n) => n ? PRIORIDADES.indexOf(n) : PRIORIDADES.length
  const orden = (a, b) => rango(a.riesgo.nivel) - rango(b.riesgo.nivel) || b.riesgo.puntos - a.riesgo.puntos
  espacios.sort(orden)

  const repositorios = ctx.repositorios.map(r => ({
    id: r.id, nombre: val(r.datos, 'SR-01') || '(sin nombre)', tipo: val(r.datos, 'SR-02') || null,
    responsable: val(r.datos, 'SR-04') || null, contenido: val(r.datos, 'SR-05') || null,
    formatos: val(r.datos, 'SR-06') || [], volumen_gb: num(val(r.datos, 'SR-07')),
    copia: val(r.datos, 'SR-09') || null, indispensable: esSi(val(r.datos, 'SR-11')),
    riesgo: riesgoRepositorio(r)
  })).sort((a, b) => PRIORIDADES.indexOf(a.riesgo.nivel) - PRIORIDADES.indexOf(b.riesgo.nivel) || b.riesgo.puntos - a.riesgo.puntos)

  const hallazgos = reglas(ctx)
    .map((x, i) => ({ id: `H-${String(i + 1).padStart(2, '0')}`, ...x, programa: COMPONENTES[x.componente],
      plazo: PLAZOS[x.prioridad], costo_txt: COSTOS[x.costo] }))
    .sort((a, b) => PRIORIDADES.indexOf(a.prioridad) - PRIORIDADES.indexOf(b.prioridad))
    .map((x, i) => ({ ...x, id: `H-${String(i + 1).padStart(2, '0')}` }))

  // Cronograma por fases (prioridad) y por costo
  const cronograma = PRIORIDADES.map(p => ({
    prioridad: p, plazo: PLAZOS[p],
    acciones: hallazgos.filter(x => x.prioridad === p).map(x => ({ id: x.id, programa: x.programa, accion: x.accion, costo: x.costo }))
  })).filter(f => f.acciones.length)

  const porCosto = Object.fromEntries(Object.keys(COSTOS).map(k => [k, hallazgos.filter(x => x.costo === k).length]))

  return {
    generado_en: new Date().toISOString(),
    avance: avance(ctx),
    espacios,
    repositorios,
    indicadores: indicadores(ctx),
    hallazgos,
    resumen: {
      espacios: espacios.length,
      espacios_por_nivel: Object.fromEntries(PRIORIDADES.map(p => [p, espacios.filter(e => e.riesgo.nivel === p).length])),
      repositorios_criticos: repositorios.filter(r => r.riesgo.nivel === 'crítica').length,
      hallazgos_por_prioridad: Object.fromEntries(PRIORIDADES.map(p => [p, hallazgos.filter(x => x.prioridad === p).length])),
      acciones_por_costo: porCosto
    },
    cronograma,
    verificaciones: verificaciones(ctx)
  }
}
