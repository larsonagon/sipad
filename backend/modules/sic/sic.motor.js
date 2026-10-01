// ======================================================
// SIPAD · Diagnóstico SIC — Motor de interpretación (determinista)
// ------------------------------------------------------
// Convierte las respuestas del formulario en:
//   1. Volumen documental (metros lineales) por espacio / dependencia / entidad.
//   2. Indicador 0–100 por componente del SIC.
//   3. Nivel de riesgo por espacio (crítico/alto/medio/bajo) con sus factores.
//   4. Riesgo por repositorio electrónico.
//   5. Hallazgos → programa → acción → prioridad → plazo → costo,
//      cada uno con la(s) pregunta(s) de la que sale (trazabilidad).
//   6. Tareas de verificación (respuestas "No sabe").
//   7. Avance de diligenciamiento.
//
// Funciones puras: sin base de datos ni red. Mismos datos ⇒ mismo resultado.
// Valor de cada respuesta: { v, x?, s?, o? } (valor, extra, soporte, observación).
// ======================================================

import { COMPONENTES, INSTITUCIONAL, FICHA, SISTEMAS, REGISTRO_ESPACIO, REPOSITORIO, FOTOS_MINIMAS, indicePreguntas } from './sic.formulario.js'

const IDX = indicePreguntas()

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

// ---------------- 1. Volumen ----------------
export function volumenEspacio(ficha = {}) {
  const estanteria = num(val(ficha, 'FI-01')) || 0
  const cajas = (num(val(ficha, 'FI-02')) || 0) * ((num(ext(ficha, 'FI-02')) ?? 20) / 100)
  const improvisadas = (num(val(ficha, 'FI-03')) || 0) * ((num(ext(ficha, 'FI-03')) ?? 30) / 100)
  const archivadores = num(ext(ficha, 'FI-04')) || 0
  const pilas = (num(ext(ficha, 'FI-05')) || 0) / 100
  const fuera = cajas + improvisadas + pilas
  const total = estanteria + cajas + improvisadas + archivadores + pilas
  return {
    estanteria: r1(estanteria), cajas: r1(cajas), improvisadas: r1(improvisadas),
    archivadores: r1(archivadores), pilas: r1(pilas),
    fuera_de_estanteria: r1(fuera), total: r1(total)
  }
}

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
  if ((num(val(f, 'FI-05')) || 0) > 0) add(5, 'Documentos en pilas', 'FI-05')

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
// Cada regla devuelve 0..n hallazgos. `evidencia` = ids de pregunta de origen.
function reglas(ctx) {
  const I = ctx.institucional
  const E = ctx.espacios
  const R = ctx.repositorios
  const H = []
  const h = (o) => H.push({ costo: 'sin_costo', espacios: [], ...o })
  const espaciosDonde = (pred) => E.filter(pred).map(nombreEspacio)
  const lista = (arr) => arr.join(', ')

  // ---- Gobierno ----
  if (noOParcial(val(I, 'IN-01')))
    h({ componente: 'GOB', prioridad: 'alta', evidencia: ['IN-01'],
      hallazgo: 'La responsabilidad de la gestión documental no está formalizada por acto administrativo.',
      accion: 'Expedir el acto administrativo que asigna la responsabilidad de la gestión documental y la coordinación del SIC, con funciones y alcance definidos.' })

  const dedic = num(val(I, 'IN-02')); const apoyo = num(val(I, 'IN-03'))
  if ((dedic !== null && dedic < 50) || apoyo === 0)
    h({ componente: 'GOB', prioridad: 'alta', costo: 'contratacion', evidencia: ['IN-02', 'IN-03'],
      hallazgo: `El responsable dedica ${dedic ?? '¿?'} % de su tiempo a la gestión documental y cuenta con ${apoyo ?? '¿?'} persona(s) de apoyo.`,
      accion: 'Asignar o contratar personal de apoyo para ejecutar el SIC y aumentar la dedicación del responsable a la gestión documental.' })

  if (noOParcial(val(I, 'IN-05')))
    h({ componente: 'GOB', prioridad: 'alta', evidencia: ['IN-04', 'IN-05'],
      hallazgo: 'El Comité Institucional de Gestión y Desempeño no tiene compromisos vigentes sobre el archivo con responsable y fecha.',
      accion: 'Presentar el SIC al Comité y dejar en acta los compromisos, responsables, fechas e indicadores de seguimiento.' })

  // ---- Instrumentos ----
  if (esNo(val(I, 'IN-08')))
    h({ componente: 'INS', prioridad: 'media', evidencia: ['IN-08'],
      hallazgo: 'No se conoce el acto administrativo de aprobación de TRD anteriores.',
      accion: 'Buscar en los archivos de la Secretaría de Gobierno y en las actas del Comité los actos de aprobación de TRD anteriores y dejar constancia del resultado.' })

  const conFuid = num(val(I, 'IN-11'))
  if (ctx.totalDependencias && conFuid !== null && conFuid < ctx.totalDependencias)
    h({ componente: 'INS', prioridad: 'alta', evidencia: ['IN-10', 'IN-11'],
      hallazgo: `Solo ${conFuid} de ${ctx.totalDependencias} dependencias tienen el inventario documental (FUID) actualizado.`,
      accion: `Levantar o actualizar el FUID en las ${ctx.totalDependencias - conFuid} dependencias restantes, empezando por los espacios de mayor riesgo.` })

  if (noOParcial(val(I, 'IN-15')))
    h({ componente: 'EME', prioridad: 'alta', evidencia: ['IN-15'],
      hallazgo: 'No están identificados los documentos vitales o esenciales de la entidad.',
      accion: 'Identificar los documentos vitales por dependencia (los indispensables para la continuidad y los derechos de ciudadanos y entidad) y definir su protección y copia de respaldo.' })

  const acumulados = espaciosDonde(e => esSi(val(e.registro, 'ESP-10')))
  if (noOParcial(val(I, 'IN-16')) || acumulados.length)
    h({ componente: 'INS', prioridad: 'media', costo: acumulados.length ? 'contratacion' : 'sin_costo', evidencia: ['IN-16', 'ESP-10'], espacios: acumulados,
      hallazgo: acumulados.length
        ? `Existe fondo documental acumulado de administraciones anteriores en ${acumulados.length} espacio(s): ${lista(acumulados)}.`
        : 'No están identificadas las series o fondos con valor histórico.',
      accion: 'Organizar y valorar el fondo acumulado mediante Tabla de Valoración Documental (TVD) e identificar los documentos de conservación permanente.' })

  // ---- Procedimientos ----
  if (noOParcial(val(I, 'IN-17')))
    h({ componente: 'PRO', prioridad: 'media', evidencia: ['IN-17'],
      hallazgo: 'No existe procedimiento escrito de organización de archivos de gestión; cada dependencia organiza con su propio criterio.',
      accion: 'Adoptar un procedimiento único de organización de archivos de gestión (clasificación, ordenación, foliación, rotulación) basado en la TRD.' })

  const externos = espaciosDonde(e => esSi(val(e.ficha, 'FI-24')))
  if (noOParcial(val(I, 'IN-18')))
    h({ componente: 'PRO', prioridad: externos.length ? 'alta' : 'media', evidencia: ['IN-18', 'FI-24'], espacios: externos,
      hallazgo: 'No existe procedimiento ni registro de préstamo y consulta de documentos.',
      accion: 'Implementar el formato de préstamo y consulta (quién, qué, cuándo, devolución) y restringir la manipulación de originales.' })

  if (noOParcial(val(I, 'IN-19')))
    h({ componente: 'PRO', prioridad: 'alta', evidencia: ['IN-19'],
      hallazgo: 'No se hace entrega documental con inventario cuando un funcionario se retira o cambia de cargo.',
      accion: 'Exigir el inventario documental (FUID) y acta de entrega como requisito para el retiro o traslado de funcionarios y contratistas.' })

  if (val(I, 'IN-20') === 'Nadie' || esSi(val(I, 'IN-21')))
    h({ componente: 'PRO', prioridad: 'alta', evidencia: ['IN-20', 'IN-21'],
      hallazgo: 'Las eliminaciones de documentos no tienen una instancia que las autorice' + (esSi(val(I, 'IN-21')) ? ' y se conocen eliminaciones sin acta.' : '.'),
      accion: 'Suspender toda eliminación informal; establecer que solo se elimina lo previsto en la TRD/TVD convalidada, con inventario publicado y aprobación del Comité.' })

  if (noOParcial(val(I, 'IN-22')) || noOParcial(val(I, 'IN-23')))
    h({ componente: 'PRO', prioridad: 'media', evidencia: ['IN-22', 'IN-23'],
      hallazgo: 'No todas las dependencias separan los documentos en trámite ni conforman expedientes al terminar un trámite.',
      accion: 'Capacitar y acompañar a las dependencias en la conformación de expedientes y en la separación de documentos en trámite y finalizados.' })

  // ---- Capacitación ----
  const caps = num(val(I, 'IN-24'))
  if (caps === 0 || noOParcial(val(I, 'IN-27')))
    h({ componente: 'CAP', prioridad: 'alta', evidencia: ['IN-24', 'IN-27'],
      hallazgo: `En el último año se realizaron ${caps ?? '¿?'} capacitaciones sobre archivo y los funcionarios no saben a quién reportar deterioro.`,
      accion: 'Ejecutar el programa de capacitación y sensibilización: manipulación, organización, conservación preventiva y reporte de deterioro, con registro de asistencia.' })
  if (noOParcial(val(I, 'IN-26')))
    h({ componente: 'CAP', prioridad: 'media', costo: 'bajo', evidencia: ['IN-26'],
      hallazgo: 'El responsable de archivo no ha recibido formación en conservación preventiva o preservación digital.',
      accion: 'Gestionar formación especializada para el responsable (cursos virtuales del ente rector u otras entidades).' })

  // ---- Saneamiento y protección del personal ----
  const conHongos = espaciosDonde(e => ['puntual', 'extendido'].includes(val(e.ficha, 'FI-11')))
  const conPlagas = espaciosDonde(e => ['puntual', 'extendido'].includes(val(e.ficha, 'FI-12')))
  const plagaExt = E.some(e => val(e.ficha, 'FI-12') === 'extendido')
  if (conHongos.length && (noOParcial(val(I, 'IN-30')) || noOParcial(val(I, 'IN-31'))))
    h({ componente: 'SAN', prioridad: 'crítica', costo: 'bajo', evidencia: ['FI-11', 'IN-30', 'IN-31', 'IN-33'], espacios: conHongos,
      hallazgo: `Hay documentos con hongos en ${conHongos.length} espacio(s) y el personal no cuenta con protección o protocolo para manipularlos.`,
      accion: 'Suspender la manipulación de documentos con hongos sin protección; dotar elementos de protección personal (tapabocas, guantes, bata), adoptar el protocolo de manipulación e informar a Seguridad y Salud en el Trabajo.' })
  if ((conHongos.length || conPlagas.length) && noOParcial(val(I, 'IN-32')))
    h({ componente: 'SAN', prioridad: 'crítica', costo: 'bajo', evidencia: ['IN-32', 'FI-11', 'FI-12'], espacios: [...new Set([...conHongos, ...conPlagas])],
      hallazgo: 'No existe un espacio de aislamiento para los documentos afectados por hongos o plagas.',
      accion: 'Habilitar un área de cuarentena (aunque sea provisional) para aislar las unidades afectadas y evitar la contaminación de las demás.' })
  const fumig = (val(I, 'IN-29') || '').toString().toLowerCase()
  if (conPlagas.length || fumig.includes('nunca'))
    h({ componente: 'SAN', prioridad: plagaExt ? 'crítica' : 'alta', costo: 'contratacion', evidencia: ['FI-12', 'FI-13', 'IN-29'], espacios: conPlagas,
      hallazgo: conPlagas.length ? `Se encontraron plagas en ${conPlagas.length} espacio(s).` : 'Nunca se ha realizado control de plagas en los espacios de archivo.',
      accion: 'Contratar saneamiento ambiental (desinsectación, desratización y desinfección) de los espacios de archivo, con periodicidad definida y registro.' })
  if (noOParcial(val(I, 'IN-28')))
    h({ componente: 'SAN', prioridad: 'alta', evidencia: ['IN-28'],
      hallazgo: 'No existe un programa de limpieza de documentos, cajas, estanterías y espacios.',
      accion: 'Establecer jornadas periódicas de limpieza en seco de espacios, estanterías y unidades de conservación, con responsable y registro.' })

  // ---- Instalaciones ----
  const agua = espaciosDonde(e => esSi(val(e.ficha, 'FI-17')) || esSi(val(e.ficha, 'FI-18')) || esSi(val(e.ficha, 'FI-19')))
  if (agua.length)
    h({ componente: 'INSP', prioridad: E.some(e => esSi(val(e.ficha, 'FI-17')) && esNo(val(e.ficha, 'FI-27'))) ? 'crítica' : 'alta',
      costo: 'contratacion', evidencia: ['FI-17', 'FI-18', 'FI-19'], espacios: agua,
      hallazgo: `Hay riesgo de agua (filtraciones, tuberías o humedad) en ${agua.length} espacio(s): ${lista(agua)}.`,
      accion: 'Reparar filtraciones y fuentes de humedad; mientras tanto, retirar y elevar las unidades expuestas y protegerlas del contacto con el agua.' })
  const electricas = espaciosDonde(e => esSi(val(e.ficha, 'FI-22')))
  if (electricas.length)
    h({ componente: 'INSP', prioridad: 'alta', costo: 'contratacion', evidencia: ['FI-22'], espacios: electricas,
      hallazgo: `Instalaciones eléctricas expuestas o en mal estado en ${electricas.length} espacio(s).`,
      accion: 'Revisar y corregir las instalaciones eléctricas de los espacios de archivo.' })

  // ---- Almacenamiento ----
  const piso = espaciosDonde(e => esNo(val(e.ficha, 'FI-27')) || (num(val(e.ficha, 'FI-05')) || 0) > 0 || (num(val(e.ficha, 'FI-02')) || 0) + (num(val(e.ficha, 'FI-03')) || 0) > 0)
  if (piso.length) {
    const mlFuera = r1(E.reduce((a, e) => a + volumenEspacio(e.ficha).fuera_de_estanteria, 0))
    h({ componente: 'ALM', prioridad: 'alta', costo: 'bajo', evidencia: ['FI-27', 'FI-02', 'FI-03', 'FI-05'], espacios: piso,
      hallazgo: `En ${piso.length} espacio(s) hay documentos en contacto con el piso o fuera de estantería (${mlFuera} m lineales).`,
      accion: 'Elevar del piso todas las unidades (estibas o entrepaño inferior a 10 cm como mínimo) y ubicarlas en estantería.' })
  }
  const improvis = E.reduce((a, e) => a + (num(val(e.ficha, 'FI-03')) || 0), 0)
  if (improvis > 0)
    h({ componente: 'ALM', prioridad: 'media', costo: 'contratacion', evidencia: ['FI-03'],
      hallazgo: `Se usan ${improvis} cajas improvisadas como unidades de conservación.`,
      accion: 'Re-almacenar en cajas y carpetas de archivo adecuadas, priorizando los espacios de mayor riesgo.' })
  const inestable = espaciosDonde(e => esNo(val(e.ficha, 'FI-29')))
  if (inestable.length)
    h({ componente: 'ALM', prioridad: 'alta', costo: 'bajo', evidencia: ['FI-29'], espacios: inestable,
      hallazgo: `Estantería inestable o sobrecargada en ${inestable.length} espacio(s).`,
      accion: 'Asegurar y descargar la estantería inestable; reemplazar la que no pueda corregirse.' })
  const graves = E.filter(e => esSi(val(e.ficha, 'FI-16')))
  if (graves.length) {
    const cajas = graves.reduce((a, e) => a + (num(ext(e.ficha, 'FI-16')) || 0), 0)
    h({ componente: 'ALM', prioridad: 'alta', evidencia: ['FI-16'], espacios: graves.map(nombreEspacio),
      hallazgo: `Hay documentos con daño grave por separar en ${graves.length} espacio(s)` + (cajas ? ` (unas ${cajas} cajas).` : '.'),
      accion: 'Separar, rotular e inventariar los documentos con daño grave y evaluar su intervención especializada.' })
  }
  if (noOParcial(val(I, 'IN-39')) && ctx.volumen.total > 0)
    h({ componente: 'ALM', prioridad: 'alta', costo: 'contratacion', evidencia: ['IN-39'],
      hallazgo: `La entidad no tiene Archivo Central ni espacio identificado para él; el volumen levantado es de ${ctx.volumen.total} m lineales.`,
      accion: `Definir y adecuar progresivamente un espacio para el Archivo Central con capacidad para al menos ${Math.ceil(ctx.volumen.total)} m lineales más el crecimiento esperado.` })

  // ---- Condiciones ambientales ----
  const ventilacion = espaciosDonde(e => ['Deficiente', 'Nula'].includes(val(e.ficha, 'FI-20')))
  if (ventilacion.length)
    h({ componente: 'AMB', prioridad: 'media', costo: 'bajo', evidencia: ['FI-20'], espacios: ventilacion,
      hallazgo: `Ventilación deficiente o nula en ${ventilacion.length} espacio(s).`,
      accion: 'Mejorar la circulación de aire (ventilación natural controlada o mecánica) y separar la estantería de muros.' })
  if (E.length && E.every(e => !esSi(val(e.ficha, 'FI-33'))))
    h({ componente: 'AMB', prioridad: 'media', costo: 'bajo', evidencia: ['FI-33'],
      hallazgo: 'Ningún espacio cuenta con equipo para medir temperatura y humedad relativa.',
      accion: 'Adquirir termohigrómetros para los espacios principales e iniciar el registro periódico de temperatura y humedad relativa.' })
  const sol = espaciosDonde(e => esSi(val(e.ficha, 'FI-21')))
  if (sol.length)
    h({ componente: 'AMB', prioridad: 'media', costo: 'bajo', evidencia: ['FI-21'], espacios: sol,
      hallazgo: `Luz solar directa sobre documentos en ${sol.length} espacio(s).`,
      accion: 'Instalar cortinas, persianas o filtros y reubicar las unidades expuestas a la luz directa.' })

  // ---- Emergencias ----
  if (noOParcial(val(I, 'IN-34')) || noOParcial(val(I, 'IN-35')))
    h({ componente: 'EME', prioridad: 'alta', evidencia: ['IN-34', 'IN-35'],
      hallazgo: 'El plan de emergencias no incluye los archivos ni hay prioridades de rescate documental.',
      accion: 'Incluir los archivos en el plan de emergencias de la entidad, con prioridades de rescate, responsables y procedimiento de recuperación.' })
  const sinExt = espaciosDonde(e => esNo(val(e.ficha, 'FI-30')))
  if (sinExt.length)
    h({ componente: 'EME', prioridad: 'alta', costo: 'bajo', evidencia: ['FI-30'], espacios: sinExt,
      hallazgo: `${sinExt.length} espacio(s) sin extintor vigente.`,
      accion: 'Dotar de extintores adecuados para documentos y con carga vigente a cada espacio de archivo.' })
  const sinDet = espaciosDonde(e => esNo(val(e.ficha, 'FI-31')))
  if (sinDet.length)
    h({ componente: 'EME', prioridad: 'media', costo: 'bajo', evidencia: ['FI-31'], espacios: sinDet,
      hallazgo: `${sinDet.length} espacio(s) sin detector de humo.`,
      accion: 'Instalar detectores de humo en los espacios de archivo.' })
  const ajenos = espaciosDonde(e => esSi(val(e.ficha, 'FI-25')))
  if (ajenos.length)
    h({ componente: 'EME', prioridad: 'alta', evidencia: ['FI-25'], espacios: ajenos,
      hallazgo: `Objetos ajenos al archivo (aseo, químicos, inservibles o inflamables) en ${ajenos.length} espacio(s).`,
      accion: 'Retirar de los espacios de archivo todos los objetos ajenos, en especial químicos y material inflamable.' })

  // ---- Seguridad y acceso ----
  const abandonados = E.filter(e => val(e.registro, 'ESP-04') === 'Inmueble externo o abandonado')
  const inseguros = E.filter(e => esNo(val(e.ficha, 'FI-23')) || esSi(val(e.ficha, 'FI-24')))
  const todos = [...new Set([...abandonados, ...inseguros])]
  if (todos.length)
    h({ componente: 'SEG', prioridad: abandonados.length ? 'crítica' : 'alta', costo: 'bajo', evidencia: ['ESP-04', 'ESP-07', 'FI-23', 'FI-24'], espacios: todos.map(nombreEspacio),
      hallazgo: abandonados.length
        ? `Hay documentos en ${abandonados.length} inmueble(s) externo(s) o abandonado(s) sin custodia efectiva.`
        : `${inseguros.length} espacio(s) sin control de acceso efectivo.`,
      accion: 'Asignar custodio formal, asegurar cerraduras, controlar las llaves y registrar el ingreso; trasladar prioritariamente los documentos de inmuebles abandonados.' })

  // ---- Preservación digital ----
  if (noOParcial(val(I, 'SI-01')))
    h({ componente: 'DIG', prioridad: 'alta', costo: 'bajo', evidencia: ['SI-01'],
      hallazgo: 'No todos los funcionarios tienen correo institucional; la información oficial circula por cuentas personales.',
      accion: 'Asignar correo institucional a todos los funcionarios y prohibir el uso de cuentas personales para asuntos oficiales.' })
  if (noOParcial(val(I, 'SI-02')))
    h({ componente: 'DIG', prioridad: 'alta', costo: 'bajo', evidencia: ['SI-02'],
      hallazgo: 'No existe una cuenta institucional de almacenamiento administrada por la entidad; los documentos electrónicos quedan en cuentas personales.',
      accion: 'Habilitar un repositorio institucional (la plataforma de gestión documental o una nube administrada por la entidad) y expedir la directriz de traslado de documentos.' })
  if (noOParcial(val(I, 'SI-03')) || noOParcial(val(I, 'SI-04')))
    h({ componente: 'DIG', prioridad: 'crítica', costo: 'bajo', evidencia: ['SI-03', 'SI-04'],
      hallazgo: 'No hay copias de seguridad institucionales periódicas ni pruebas de restauración.',
      accion: 'Adoptar una política de copias de seguridad (frecuencia, responsable, ubicación separada) y probar la restauración al menos una vez por semestre.' })
  const criticos = R.filter(r => riesgoRepositorio(r).nivel === 'crítica')
  if (criticos.length)
    h({ componente: 'DIG', prioridad: 'crítica', evidencia: ['SR-09', 'SR-11', 'SR-02'],
      hallazgo: `${criticos.length} repositorio(s) indispensable(s) sin copia de seguridad y en almacenamiento personal: ${lista(criticos.map(r => val(r.datos, 'SR-01') || '(sin nombre)'))}.`,
      accion: 'Copiar de inmediato la información de estos repositorios al repositorio institucional y asignar un responsable de su conservación.' })
  const plataforma = (val(I, 'SI-05') || '').toString().trim()
  const falta = val(I, 'SI-06')
  if (plataforma)
    h({ componente: 'DIG', prioridad: 'alta', evidencia: ['SI-05', 'SI-06'],
      hallazgo: `La entidad tiene una plataforma de gestión documental sin uso (${plataforma})` + (Array.isArray(falta) && falta.length ? `; falta: ${falta.join(', ').toLowerCase()}.` : '.'),
      accion: 'Implementar la plataforma existente con la Oficina de Sistemas: parametrizarla con la TRD, capacitar a los usuarios y centralizar allí los documentos electrónicos.' })
  if (noOParcial(val(I, 'SI-07')))
    h({ componente: 'DIG', prioridad: 'media', evidencia: ['SI-07'],
      hallazgo: 'No existe Registro de Activos de Información ni inventario de sistemas y repositorios.',
      accion: 'Elaborar el Registro de Activos de Información a partir del inventario de repositorios de este diagnóstico.' })

  // ---- Recursos ----
  if (noOParcial(val(I, 'IN-37')))
    h({ componente: 'REC', prioridad: 'media', evidencia: ['IN-37'],
      hallazgo: 'No existe rubro presupuestal para archivo o conservación en la vigencia actual.',
      accion: 'Ejecutar primero las acciones sin costo y de costo bajo; incluir en el anteproyecto de presupuesto de la siguiente vigencia las que requieren contratación.' })

  return H
}

// ---------------- 7. Verificaciones ("No sabe") ----------------
export function verificaciones(ctx) {
  const out = []
  const revisar = (obj, ids, donde) => {
    for (const id of ids) if (val(obj, id) === 'ns') out.push({ pregunta: id, texto: IDX[id]?.texto || id, donde })
  }
  const idsInst = [...INSTITUCIONAL, ...SISTEMAS].flatMap(b => b.preguntas.map(p => p.id))
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
  const idsInst = INSTITUCIONAL.flatMap(b => b.preguntas.map(p => p.id))
  const idsSis = SISTEMAS.flatMap(b => b.preguntas.map(p => p.id))
  const idsFicha = FICHA.flatMap(b => b.preguntas.filter(p => !p.opcional).map(p => p.id))
  const fichas = ctx.espacios.map(e => {
    const resp = contar(e.ficha, idsFicha)
    return { id: e.id, nombre: nombreEspacio(e), respondidas: resp, total: idsFicha.length,
      fotos: e.fotos || 0, completa: resp === idsFicha.length && (e.fotos || 0) >= FOTOS_MINIMAS }
  })
  const pct = (a, b) => (b ? Math.round((a / b) * 100) : 0)
  const inst = contar(ctx.institucional, idsInst)
  const sis = contar(ctx.institucional, idsSis)
  return {
    institucional: { respondidas: inst, total: idsInst.length, pct: pct(inst, idsInst.length) },
    sistemas: { respondidas: sis, total: idsSis.length, pct: pct(sis, idsSis.length), repositorios: ctx.repositorios.length },
    espacios: { registrados: ctx.espacios.length, declarados: num(ctx.espaciosDeclarados), fichasCompletas: fichas.filter(f => f.completa).length, fichas },
    general: pct(inst + sis + fichas.reduce((a, f) => a + f.respondidas, 0),
      idsInst.length + idsSis.length + fichas.length * idsFicha.length)
  }
}

// ---------------- ORQUESTADOR ----------------
export function analizar(entrada = {}) {
  const ctx = {
    institucional: entrada.institucional || {},
    espacios: (entrada.espacios || []).map(e => ({ ...e, registro: e.registro || {}, ficha: e.ficha || {} })),
    repositorios: (entrada.repositorios || []).map(r => ({ ...r, datos: r.datos || {} })),
    dependencias: entrada.dependencias || [],
    espaciosDeclarados: entrada.espaciosDeclarados ?? null
  }
  ctx.totalDependencias = ctx.dependencias.length || null
  const depNombre = Object.fromEntries(ctx.dependencias.map(d => [String(d.id), d.nombre]))

  // Volumen y riesgo por espacio
  const espacios = ctx.espacios.map(e => {
    const vol = volumenEspacio(e.ficha)
    const riesgo = riesgoEspacio(e)
    const deps = (val(e.registro, 'ESP-03') || []).map(id => depNombre[String(id)] || `Dependencia ${id}`)
    return { id: e.id, nombre: nombreEspacio(e), tipo: val(e.registro, 'ESP-04') || null, dependencias: deps,
      volumen: vol, estado: e.ficha['FI-10']?.v || null, riesgo, prioridad_tecnico: val(e.ficha, 'FI-35') || null,
      fotos: e.fotos || 0 }
  })
  const totalMl = r1(espacios.reduce((a, e) => a + e.volumen.total, 0))
  // ml en mal estado (ponderado por el % malo de cada espacio)
  const mlMalo = r1(espacios.reduce((a, e) => a + e.volumen.total * ((num(e.estado?.malo) || 0) / 100), 0))
  const porDependencia = {}
  for (const e of espacios) {
    const deps = e.dependencias.length ? e.dependencias : ['Sin dependencia asignada']
    for (const d of deps) porDependencia[d] = r1((porDependencia[d] || 0) + e.volumen.total / deps.length)
  }
  ctx.volumen = { total: totalMl }

  const orden = (a, b) => PRIORIDADES.indexOf(a.riesgo.nivel) - PRIORIDADES.indexOf(b.riesgo.nivel) || b.riesgo.puntos - a.riesgo.puntos || b.volumen.total - a.volumen.total
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
    volumen: { total_ml: totalMl, mal_estado_ml: mlMalo, por_dependencia: porDependencia,
      fuera_de_estanteria_ml: r1(espacios.reduce((a, e) => a + e.volumen.fuera_de_estanteria, 0)) },
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
