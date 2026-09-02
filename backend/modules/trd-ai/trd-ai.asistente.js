// =====================================================
// SIPAD · Asistente conversacional de valoración (GPT aterrizado)
// -----------------------------------------------------
// Responde dudas de valoración y organización documental para
// una TRD colombiana, ATERRIZADO en:
//   1) Una base normativa cerrada (allowlist) — solo puede citar
//      esas normas; se le prohíbe inventar leyes o artículos.
//   2) El motor de valoración determinista de SIPAD (valorarSerie):
//      cuando la pregunta trae una serie, se le entrega la
//      sugerencia de la KB para que la EXPLIQUE, no la invente.
//
// La llamada al LLM es inyectable (opción `llm`) para poder
// probar sin red ni gasto de API. En producción usa OPENAI_API_KEY.
// Un guardia posterior detecta si el modelo citó una norma fuera
// de la base y lo advierte al usuario.
// =====================================================

import { valorarSerie } from './trd-ai.valoracion.js'

// ---------- Base normativa (allowlist) ----------
// Solo estas normas puede citar el asistente. Son las que SIPAD ya
// usa en su valoración; ampliar aquí con cuidado y verificación.
export const BASE_NORMATIVA = [
  { clave: 'ley 594 de 2000',        titulo: 'Ley 594 de 2000',        desc: 'Ley General de Archivos. Marco de la gestión documental y las TRD.' },
  { clave: 'decreto 1080 de 2015',   titulo: 'Decreto 1080 de 2015',   desc: 'Decreto Único Reglamentario del Sector Cultura; reglamenta la función archivística.' },
  { clave: 'acuerdo agn 004 de 2019', titulo: 'Acuerdo AGN 004 de 2019', desc: 'Elaboración, evaluación y convalidación de TRD/TVD; disposición final (CT/E/S/M), eliminación con publicación de 60 días.' },
  { clave: 'acuerdo agn 042 de 2002', titulo: 'Acuerdo AGN 042 de 2002', desc: 'Organización de archivos de gestión y Formato Único de Inventario Documental (FUID).' },
  { clave: 'resolucion 839 de 2017',  titulo: 'Resolución 839 de 2017 (Minsalud)', desc: 'Manejo y retención de la historia clínica: mínimo 15 años.' },
  { clave: 'ley 769 de 2002',        titulo: 'Ley 769 de 2002',        desc: 'Código Nacional de Tránsito Terrestre.' },
  { clave: 'ley 1581 de 2012',       titulo: 'Ley 1581 de 2012',       desc: 'Protección de datos personales.' }
]

const DISP_TXT = { CT: 'Conservación total', E: 'Eliminación', S: 'Selección', M: 'Medio técnico' }

function norm(s) {
  return (s || '').toString().normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .toLowerCase().replace(/n\.?[º°o]\.?/g, '').replace(/\s+/g, ' ').trim()
}

// ---------- Guardia de citas: detecta normas fuera de la base ----------
// Busca menciones tipo "Ley 594 de 2000", "Acuerdo AGN 004 de 2019",
// "Decreto 1080/2015", "Resolución 839 de 2017".
export function verificarCitas(texto) {
  const re = /\b(ley|decreto|acuerdo|resoluci[oó]n|circular)\s+(agn\s+)?n?[.º°o]*\s*(\d{1,4})\s*(?:de|\/|-)?\s*(\d{4})/gi
  const permitidas = new Set(BASE_NORMATIVA.map(n => n.clave))
  const citadas = []
  const fueraDeBase = []
  let m
  while ((m = re.exec(texto || '')) !== null) {
    const tipo = norm(m[1])
    const agn = m[2] ? 'agn ' : ''
    const numero = m[3]
    const anio = m[4]
    const clave = `${tipo} ${agn}${numero} de ${anio}`.replace(/\s+/g, ' ').trim()
    citadas.push(clave)
    if (!permitidas.has(clave)) fueraDeBase.push(`${m[1]} ${m[2] || ''}${numero} de ${anio}`.replace(/\s+/g, ' ').trim())
  }
  return { citadas: [...new Set(citadas)], fueraDeBase: [...new Set(fueraDeBase)] }
}

// ---------- Prompt ----------
export function construirSystemPrompt() {
  const base = BASE_NORMATIVA.map(n => `- ${n.titulo}: ${n.desc}`).join('\n')
  return [
    'Eres el asistente archivístico de SIPAD, especializado en valoración documental y Tablas de',
    'Retención Documental (TRD) para entidades públicas colombianas. Respondes en español, con precisión',
    'y de forma concreta y práctica.',
    '',
    'REGLAS ESTRICTAS DE ATERRIZAJE:',
    '1. Solo puedes citar normas de esta BASE NORMATIVA. Está PROHIBIDO inventar leyes, decretos,',
    '   acuerdos, resoluciones o números de artículo que no estén aquí. Si no estás seguro de una norma o',
    '   un dato, dilo explícitamente y recomienda verificar con la normatividad vigente o el Archivo General',
    '   de la Nación; NO inventes.',
    '2. Cuando SIPAD te entregue una "SUGERENCIA DEL MOTOR" para una serie, tu tarea es EXPLICARLA y, si',
    '   procede, matizarla — no la contradigas sin justificar con la base normativa.',
    '3. La disposición final se expresa como CT (conservación total), E (eliminación), S (selección) o',
    '   M (medio técnico). La eliminación exige inventario publicado 60 días hábiles y aval del Comité',
    '   Institucional de Gestión y Desempeño (Acuerdo AGN 004 de 2019).',
    '4. No des asesoría jurídica definitiva: aclara que la valoración final la aprueba el Comité y la',
    '   convalida el Consejo Departamental de Archivos / AGN.',
    '',
    'BASE NORMATIVA (única fuente citable):',
    base
  ].join('\n')
}

export function construirMensajes({ pregunta, contextoKB = null, historial = [] }) {
  const mensajes = [{ role: 'system', content: construirSystemPrompt() }]
  // Historial acotado (últimos 8 turnos), saneado
  for (const h of (historial || []).slice(-8)) {
    const role = h.rol === 'asistente' || h.role === 'assistant' ? 'assistant' : 'user'
    const content = (h.texto || h.content || '').toString().slice(0, 4000)
    if (content) mensajes.push({ role, content })
  }
  let user = pregunta
  if (contextoKB) {
    user =
      `SUGERENCIA DEL MOTOR de SIPAD para la serie "${contextoKB.serie}"` +
      (contextoKB.subserie ? ` / subserie "${contextoKB.subserie}"` : '') + ':\n' +
      `- Retención: ${contextoKB.retencion_gestion} año(s) en Archivo de Gestión, ${contextoKB.retencion_central} en Archivo Central.\n` +
      `- Disposición final: ${contextoKB.disposicion_final} (${DISP_TXT[contextoKB.disposicion_final] || ''}).\n` +
      `- Fundamento: ${contextoKB.fundamento_normativo}\n\n` +
      `Pregunta del usuario: ${pregunta}`
  }
  mensajes.push({ role: 'user', content: user })
  return mensajes
}

// ---------- Llamada a OpenAI (aislada para poder mockear) ----------
export async function llamarOpenAI(mensajes, { apiKey, model = 'gpt-4o-mini', fetchImpl, timeoutMs = 30000 } = {}) {
  const f = fetchImpl || globalThis.fetch
  if (!f) throw new Error('fetch no disponible en este entorno')
  const ctrl = new AbortController()
  const t = setTimeout(() => ctrl.abort(), timeoutMs)
  try {
    const resp = await f('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
      body: JSON.stringify({ model, messages: mensajes, temperature: 0.2, max_tokens: 700 }),
      signal: ctrl.signal
    })
    if (!resp.ok) {
      const txt = await resp.text().catch(() => '')
      throw new Error(`OpenAI ${resp.status}: ${txt.slice(0, 200)}`)
    }
    const json = await resp.json()
    return json?.choices?.[0]?.message?.content?.trim() || ''
  } finally {
    clearTimeout(t)
  }
}

// ---------- Orquestación ----------
export async function preguntarAsistente({ pregunta, serie = null, subserie = null, historial = [], llm = null, apiKey = process.env.OPENAI_API_KEY, model = process.env.OPENAI_MODEL || 'gpt-4o-mini' } = {}) {
  const q = (pregunta || '').toString().trim()
  if (!q) return { ok: false, error: 'La pregunta no puede estar vacía' }
  if (q.length > 2000) return { ok: false, error: 'La pregunta es demasiado larga (máx. 2000 caracteres)' }

  // Aterrizaje en el motor determinista si viene una serie
  let contextoKB = null
  if (serie) {
    try {
      const v = valorarSerie(serie, subserie || null)
      contextoKB = { serie, subserie: subserie || null, ...v }
    } catch { /* si falla, seguimos sin contexto KB */ }
  }

  const mensajes = construirMensajes({ pregunta: q, contextoKB, historial })

  // Sin clave ni LLM inyectado → respuesta de reserva (no rompe la app)
  if (!llm && !apiKey) {
    let respuesta = 'El asistente conversacional no está configurado (falta OPENAI_API_KEY en el servidor). '
    if (contextoKB) {
      respuesta += `Según el motor de valoración de SIPAD, para "${serie}"` +
        (subserie ? ` / "${subserie}"` : '') +
        `: retención ${contextoKB.retencion_gestion}/${contextoKB.retencion_central} años (AG/AC), ` +
        `disposición ${contextoKB.disposicion_final} (${DISP_TXT[contextoKB.disposicion_final] || ''}). ${contextoKB.fundamento_normativo}`
    } else {
      respuesta += 'Aun así puedes usar el validador, la valoración y los instrumentos del sistema.'
    }
    return { ok: true, respuesta, sinClave: true, contextoKB }
  }

  let texto
  try {
    texto = llm ? await llm(mensajes) : await llamarOpenAI(mensajes, { apiKey, model })
  } catch (e) {
    return { ok: false, error: 'No fue posible consultar al asistente en este momento.', detalle: e.message }
  }

  const { citadas, fueraDeBase } = verificarCitas(texto)
  const out = { ok: true, respuesta: texto, citas: citadas, contextoKB }
  if (fueraDeBase.length) {
    out.advertencia =
      `Atención: la respuesta menciona normas fuera de la base verificada de SIPAD (${fueraDeBase.join('; ')}). ` +
      `Verifícalas con la normatividad vigente antes de usarlas.`
  }
  return out
}

// ---------- Ruta ----------
export function registrarAsistente(router, db, guard) {
  const mw = typeof guard === 'function' ? guard : (req, res, next) => next()

  router.get('/asistente/base', mw, (req, res) => {
    res.json({ ok: true, base: BASE_NORMATIVA, disponible: !!process.env.OPENAI_API_KEY })
  })

  router.post('/asistente', mw, async (req, res) => {
    try {
      const { pregunta, serie, subserie, historial } = req.body || {}
      const r = await preguntarAsistente({ pregunta, serie, subserie, historial })
      if (!r.ok) return res.status(400).json(r)
      return res.json(r)
    } catch (err) {
      console.error('Asistente error:', err)
      return res.status(500).json({ ok: false, error: 'No fue posible procesar la consulta' })
    }
  })
}
