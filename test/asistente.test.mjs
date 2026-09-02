// Pruebas: asistente de valoración (GPT aterrizado) con LLM mock — sin red.
import { test } from 'node:test'
import assert from 'node:assert/strict'

import {
  BASE_NORMATIVA, verificarCitas, construirSystemPrompt, construirMensajes, preguntarAsistente
} from '../backend/modules/trd-ai/trd-ai.asistente.js'

test('el system prompt embebe la base normativa y prohíbe inventar', () => {
  const sp = construirSystemPrompt()
  assert.ok(sp.includes('Ley 594 de 2000'))
  assert.ok(sp.includes('Acuerdo AGN 004 de 2019'))
  assert.ok(/PROHIBIDO inventar/i.test(sp))
})

test('verificarCitas: normas de la base NO se marcan fuera de base', () => {
  const t = 'Conforme a la Ley 594 de 2000 y el Acuerdo AGN 004 de 2019, se procede.'
  const r = verificarCitas(t)
  assert.equal(r.fueraDeBase.length, 0)
  assert.ok(r.citadas.includes('ley 594 de 2000'))
  assert.ok(r.citadas.includes('acuerdo agn 004 de 2019'))
})

test('verificarCitas: una norma inventada SÍ se marca fuera de base', () => {
  const t = 'Según la Ley 9999 de 2021 y el Decreto 1080 de 2015, elimine.'
  const r = verificarCitas(t)
  assert.ok(r.fueraDeBase.some(x => /9999/.test(x)))
  assert.ok(!r.fueraDeBase.some(x => /1080/.test(x)), '1080/2015 sí está en la base')
})

test('grounding: al pasar una serie, el prompt incluye la sugerencia del motor', () => {
  const m = construirMensajes({ pregunta: '¿Está bien esa retención?', contextoKB: {
    serie: 'HISTORIAS LABORALES', subserie: null, retencion_gestion: 5, retencion_central: 80,
    disposicion_final: 'CT', fundamento_normativo: 'Derechos pensionales.'
  }})
  const user = m[m.length - 1].content
  assert.ok(user.includes('SUGERENCIA DEL MOTOR'))
  assert.ok(user.includes('HISTORIAS LABORALES'))
  assert.ok(user.includes('CT'))
})

test('preguntarAsistente usa el LLM inyectado (sin red)', async () => {
  const llm = async (mensajes) => {
    assert.equal(mensajes[0].role, 'system')
    return 'La retención propuesta es adecuada según la Ley 594 de 2000.'
  }
  const r = await preguntarAsistente({ pregunta: '¿Qué opinas?', llm })
  assert.ok(r.ok)
  assert.ok(r.respuesta.includes('adecuada'))
  assert.equal(r.advertencia, undefined, 'sin normas fuera de base, sin advertencia')
})

test('preguntarAsistente advierte cuando el modelo cita una norma fuera de base', async () => {
  const llm = async () => 'Aplica la Ley 1234 de 2099 (inventada).'
  const r = await preguntarAsistente({ pregunta: 'x', llm })
  assert.ok(r.ok)
  assert.ok(r.advertencia && /fuera de la base/i.test(r.advertencia))
  assert.ok(/1234 de 2099/.test(r.advertencia))
})

test('fallback sin OPENAI_API_KEY ni LLM: no rompe y ofrece la sugerencia del motor', async () => {
  const r = await preguntarAsistente({ pregunta: '¿retención?', serie: 'HISTORIAS LABORALES', apiKey: '', llm: null })
  assert.ok(r.ok && r.sinClave)
  assert.ok(r.contextoKB && r.contextoKB.disposicion_final)
  assert.ok(/motor de valoración/i.test(r.respuesta))
})

test('valida entrada vacía y demasiado larga', async () => {
  assert.equal((await preguntarAsistente({ pregunta: '', llm: async () => 'x' })).ok, false)
  assert.equal((await preguntarAsistente({ pregunta: 'a'.repeat(2001), llm: async () => 'x' })).ok, false)
})

test('la base normativa tiene entradas verificables', () => {
  assert.ok(BASE_NORMATIVA.length >= 5)
  assert.ok(BASE_NORMATIVA.every(n => n.clave && n.titulo && n.desc))
})
