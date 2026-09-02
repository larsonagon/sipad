import { renderHeader } from '../components/header.js'

const historial = []   // [{ rol:'usuario'|'asistente', texto }]

document.addEventListener('DOMContentLoaded', async () => {
  renderHeader('Asistente', sessionStorage.getItem('gestion_entidad_nombre') || null)
  document.getElementById('btnEnviar')?.addEventListener('click', enviar)
  const ta = document.getElementById('entrada')
  ta.addEventListener('keydown', e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); enviar() } })
  ta.addEventListener('input', () => { ta.style.height = 'auto'; ta.style.height = Math.min(ta.scrollHeight, 120) + 'px' })
  document.querySelectorAll('.sug').forEach(s => s.addEventListener('click', () => { ta.value = s.dataset.q; enviar() }))
  await cargarBase()
  bienvenida()
})

function esMasterAdmin() {
  const t = sessionStorage.getItem('token'); if (!t) return false
  try { const p = JSON.parse(atob(t.split('.')[1])); return p.es_master_admin === true || p.es_master_admin === 1 } catch { return false }
}
async function apiFetch(url, options = {}) {
  const token = sessionStorage.getItem('token')
  const headers = { Authorization: `Bearer ${token}`, ...(options.headers || {}) }
  if (esMasterAdmin()) {
    const eid = sessionStorage.getItem('gestion_entidad_id') || sessionStorage.getItem('entidad_id') || null
    if (eid) headers['X-Entidad-Id'] = eid
  }
  if (options.body) headers['Content-Type'] = 'application/json'
  const resp = await fetch(url, { ...options, headers })
  if (resp.status === 401) { sessionStorage.clear(); window.location.href = '/'; return null }
  return resp
}
function esc(s){ return (s||'').toString().replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;') }

async function cargarBase() {
  try {
    const resp = await apiFetch('/api/trd-ai/asistente/base')
    const json = await resp.json()
    if (!resp.ok || !json.ok) throw new Error()
    document.getElementById('fuentesChips').innerHTML =
      `<span class="fchip">Fuentes verificadas:</span>` +
      (json.base || []).map(n => `<span class="fchip">${esc(n.titulo)}</span>`).join('')
    document.getElementById('avisoClave').hidden = !!json.disponible
  } catch (e) {
    console.error(e)
  }
}

function bienvenida() {
  agregarMsg('bot', 'Hola. Puedo ayudarte con retención, disposición final (CT/E/S/M), fundamento normativo y organización documental. Para respuestas aterrizadas a una serie específica, escríbela en el campo "Serie" de abajo.')
}

function agregarMsg(tipo, texto, extra = {}) {
  const chat = document.getElementById('chat')
  const div = document.createElement('div')
  div.className = `msg ${tipo}`
  div.innerHTML = esc(texto)
  if (extra.aviso) { const a = document.createElement('span'); a.className = 'aviso'; a.textContent = extra.aviso; div.appendChild(a) }
  if (extra.fuentes && extra.fuentes.length) { const f = document.createElement('span'); f.className = 'fuentes'; f.textContent = 'Normas citadas: ' + extra.fuentes.join(' · '); div.appendChild(f) }
  chat.appendChild(div)
  chat.scrollTop = chat.scrollHeight
  return div
}

let ocupado = false
async function enviar() {
  if (ocupado) return
  const ta = document.getElementById('entrada')
  const pregunta = ta.value.trim()
  if (!pregunta) return
  const serie = document.getElementById('ctxSerie').value.trim() || null
  const subserie = document.getElementById('ctxSub').value.trim() || null

  agregarMsg('user', pregunta)
  historial.push({ rol: 'usuario', texto: pregunta })
  ta.value = ''; ta.style.height = 'auto'
  document.getElementById('sugerencias').style.display = 'none'

  ocupado = true
  const btn = document.getElementById('btnEnviar'); btn.disabled = true
  const pensando = agregarMsg('bot', 'Pensando…')

  try {
    const resp = await apiFetch('/api/trd-ai/asistente', {
      method: 'POST',
      body: JSON.stringify({ pregunta, serie, subserie, historial: historial.slice(0, -1) })
    })
    const json = await resp.json()
    pensando.remove()
    if (!resp.ok || !json.ok) throw new Error(json.error || 'error')
    agregarMsg('bot', json.respuesta, { aviso: json.advertencia, fuentes: json.citas })
    historial.push({ rol: 'asistente', texto: json.respuesta })
  } catch (e) {
    console.error(e)
    pensando.remove()
    agregarMsg('bot', 'No fue posible responder en este momento. Intenta de nuevo.')
  } finally {
    ocupado = false; btn.disabled = false
  }
}
