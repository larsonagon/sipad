// ======================================================
// SIPAD · Diagnóstico SIC — Redacción
// ------------------------------------------------------
// 1) Redacción DETERMINISTA (siempre disponible): convierte el
//    análisis del motor en párrafos para el informe.
// 2) Resumen ejecutivo con el asistente (opcional, OPENAI_API_KEY):
//    el modelo SOLO recibe los hechos calculados por el motor y
//    tiene prohibido inventar cifras o normas. Dos guardias
//    posteriores revisan (a) normas citadas fuera de la lista y
//    (b) cifras que no aparecen en los datos.
//    La llamada al LLM es inyectable para probar sin red.
// ======================================================

import { llamarOpenAI } from '../trd-ai/trd-ai.asistente.js'

export const NORMAS_PERMITIDAS = ['ley 594 de 2000', 'decreto 1080 de 2015']

const fmt = (n) => (n === null || n === undefined ? '—' : Number(n).toLocaleString('es-CO', { maximumFractionDigits: 1 }))

// ---------------- Redacción determinista ----------------
export function redaccionBase(a, { entidad = 'la entidad' } = {}) {
  const r = a.resumen
  const niv = r.espacios_por_nivel
  const crit = a.indicadores.filter(i => i.valor !== null).sort((x, y) => x.valor - y.valor)
  const peores = crit.slice(0, 3).map(i => `${i.nombre.toLowerCase()} (${i.valor}/100)`)

  const sintesis = [
    `El diagnóstico se levantó en ${r.espacios} espacio(s) donde ${entidad} guarda documentos, con un volumen total de ${fmt(a.volumen.total_ml)} metros lineales, de los cuales cerca de ${fmt(a.volumen.mal_estado_ml)} m están en mal estado y ${fmt(a.volumen.fuera_de_estanteria_ml)} m se encuentran fuera de estantería.`,
    r.espacios ? `Por nivel de riesgo, ${niv['crítica']} espacio(s) quedaron en nivel crítico, ${niv['alta']} en alto, ${niv['media']} en medio y ${niv['baja']} en bajo.` : '',
    a.repositorios.length ? `En el componente electrónico se inventariaron ${a.repositorios.length} sistema(s) o repositorio(s), ${r.repositorios_criticos} de ellos en riesgo crítico de pérdida de información.` : 'No se inventariaron sistemas ni repositorios electrónicos.',
    peores.length ? `Los componentes más débiles son ${peores.join(', ')}.` : '',
    `El análisis arroja ${a.hallazgos.length} hallazgo(s): ${r.hallazgos_por_prioridad['crítica']} de prioridad crítica, ${r.hallazgos_por_prioridad['alta']} alta, ${r.hallazgos_por_prioridad['media']} media y ${r.hallazgos_por_prioridad['baja']} baja.`,
    `De las acciones propuestas, ${r.acciones_por_costo.sin_costo} no tienen costo, ${r.acciones_por_costo.bajo} son de costo bajo y ${r.acciones_por_costo.contratacion} requieren presupuesto o contratación.`
  ].filter(Boolean).join(' ')

  const metodologia =
    'La información se obtuvo mediante el formulario de Diagnóstico Integral de SIPAD, diligenciado por el responsable de archivo ' +
    '(cuestionario institucional e inspección de cada espacio con medición de metros lineales y registro fotográfico) y por la Oficina de Sistemas ' +
    '(inventario de sistemas y repositorios electrónicos). El análisis lo realiza un motor de reglas: cada hallazgo indica la pregunta de la que proviene, ' +
    'y las respuestas "No sabe" se registran como tareas de verificación, no como hechos.'

  const componentes = a.indicadores.map(i => ({
    componente: i.nombre,
    texto: i.valor === null
      ? `Sin información suficiente para evaluar ${i.nombre.toLowerCase()}.`
      : `${i.nombre}: ${i.valor}/100 (${i.nivel}). ` +
        (a.hallazgos.filter(h => h.programa === i.nombre).length
          ? `Se identificaron ${a.hallazgos.filter(h => h.programa === i.nombre).length} hallazgo(s) en este componente.`
          : 'No se identificaron hallazgos en este componente.')
  }))

  const verificacion = a.verificaciones.length
    ? `Quedan ${a.verificaciones.length} respuesta(s) marcadas como "No sabe", que deben verificarse antes de presentar el SIC al Comité.`
    : 'No quedan respuestas pendientes de verificación.'

  return { metodologia, sintesis, componentes, verificacion }
}

// ---------------- Hechos para el asistente ----------------
export function hechosParaLLM(a) {
  return {
    volumen_total_m: a.volumen.total_ml,
    volumen_mal_estado_m: a.volumen.mal_estado_ml,
    volumen_fuera_estanteria_m: a.volumen.fuera_de_estanteria_ml,
    espacios: a.espacios.map(e => ({ nombre: e.nombre, tipo: e.tipo, metros: e.volumen.total, riesgo: e.riesgo.nivel,
      factores: e.riesgo.factores.slice(0, 4).map(f => f.factor) })),
    repositorios: a.repositorios.map(r => ({ nombre: r.nombre, tipo: r.tipo, riesgo: r.riesgo.nivel, factores: r.riesgo.factores })),
    indicadores: a.indicadores.filter(i => i.valor !== null).map(i => ({ componente: i.nombre, valor: i.valor, nivel: i.nivel })),
    hallazgos: a.hallazgos.map(h => ({ id: h.id, prioridad: h.prioridad, programa: h.programa, hallazgo: h.hallazgo, accion: h.accion, costo: h.costo_txt })),
    pendientes_de_verificar: a.verificaciones.length
  }
}

export function mensajesResumen(hechos, entidad) {
  const system = [
    'Eres un asesor archivístico colombiano. Redactas el RESUMEN EJECUTIVO del Diagnóstico Integral de Archivos',
    'que sustenta el Sistema Integrado de Conservación (SIC) de una entidad pública, para presentarlo ante el Comité',
    'Institucional de Gestión y Desempeño. Español formal, claro y concreto. Entre 250 y 400 palabras, en prosa (sin viñetas).',
    '',
    'REGLAS ESTRICTAS:',
    '1. Usa ÚNICAMENTE los hechos del JSON. No inventes cifras, espacios, sistemas, fechas ni situaciones.',
    '   Toda cifra que escribas debe aparecer tal cual en el JSON.',
    '2. No cites normas. Las justificaciones se explican en concepto (por qué es un riesgo y qué se evita).',
    '3. Estructura: situación general (volumen y riesgos), problemas más graves (prioridad crítica), qué se propone',
    '   hacer primero y qué puede hacerse sin presupuesto, y la decisión que se le pide al Comité.',
    '4. Si hay respuestas pendientes de verificar, menciónalo en una frase.',
    '5. No menciones a SIPAD, al motor ni a la inteligencia artificial.'
  ].join('\n')
  const user = `Entidad: ${entidad}\n\nHECHOS (JSON):\n${JSON.stringify(hechos)}`
  return [{ role: 'system', content: system }, { role: 'user', content: user }]
}

// Normas citadas que no estén en la lista permitida
export function normasFueraDeLista(texto) {
  const re = /\b(ley|decreto|acuerdo|resoluci[oó]n|circular)\s+(agn\s+)?n?[.º°o]*\s*(\d{1,4})\s*(?:de|\/|-)?\s*(\d{4})/gi
  const fuera = []
  let m
  while ((m = re.exec(texto || '')) !== null) {
    const tipo = m[1].normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase()
    const clave = `${tipo} ${m[2] ? 'agn ' : ''}${Number(m[3])} de ${m[4]}`
    const claveSinCeros = `${tipo} ${m[2] ? 'agn ' : ''}${m[3]} de ${m[4]}`
    if (!NORMAS_PERMITIDAS.includes(clave) && !NORMAS_PERMITIDAS.includes(claveSinCeros)) fuera.push(m[0].trim())
  }
  return [...new Set(fuera)]
}

// Cifras del texto que no aparecen en los hechos (anti-invención)
export function cifrasNoRespaldadas(texto, hechos) {
  const norm = (s) => String(s).replace(/\./g, '').replace(',', '.')
  const enHechos = new Set()
  const recorrer = (o) => {
    if (o === null || o === undefined) return
    if (typeof o === 'number') { enHechos.add(String(o)); return }
    if (typeof o === 'string') { for (const m of o.match(/\d+(?:[.,]\d+)?/g) || []) enHechos.add(norm(m)); return }
    if (Array.isArray(o)) { enHechos.add(String(o.length)); o.forEach(recorrer); return }
    if (typeof o === 'object') Object.values(o).forEach(recorrer)
  }
  recorrer(hechos)
  const sospechosas = []
  for (const m of (texto || '').match(/\d+(?:[.,]\d+)*(?:[.,]\d+)?/g) || []) {
    const n = norm(m)
    if (Number(n) <= 10 && !n.includes('.')) continue // conteos pequeños (uno, dos, tres…) se toleran
    if (/^(19|20)\d{2}$/.test(n)) continue          // años
    if (!enHechos.has(n) && !enHechos.has(String(Number(n)))) sospechosas.push(m)
  }
  return [...new Set(sospechosas)]
}

export async function resumenEjecutivo(a, { entidad = 'la entidad', llm = null, apiKey = process.env.OPENAI_API_KEY, model = process.env.OPENAI_MODEL || 'gpt-4o-mini' } = {}) {
  const base = redaccionBase(a, { entidad })
  if (!a.espacios.length && !a.repositorios.length)
    return { ok: false, error: 'Aún no hay espacios ni repositorios diligenciados para redactar el resumen.' }
  if (!llm && !apiKey)
    return { ok: true, fuente: 'motor', texto: base.sintesis, aviso: 'Asistente no configurado (falta OPENAI_API_KEY): se usa la síntesis del motor.' }

  const hechos = hechosParaLLM(a)
  let texto
  try {
    texto = llm ? await llm(mensajesResumen(hechos, entidad)) : await llamarOpenAI(mensajesResumen(hechos, entidad), { apiKey, model, timeoutMs: 45000 })
  } catch (e) {
    return { ok: true, fuente: 'motor', texto: base.sintesis, aviso: 'No fue posible consultar al asistente; se usa la síntesis del motor.', detalle: e.message }
  }
  const normas = normasFueraDeLista(texto)
  const cifras = cifrasNoRespaldadas(texto, hechos)
  const advertencias = []
  if (normas.length) advertencias.push(`Menciona normas no verificadas: ${normas.join('; ')}.`)
  if (cifras.length) advertencias.push(`Contiene cifras que no aparecen en el diagnóstico: ${cifras.join(', ')}. Revíselas antes de usar el texto.`)
  return { ok: true, fuente: 'asistente', texto, advertencias }
}
