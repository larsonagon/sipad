import { renderHeader } from '../components/header.js'

let data = { versiones: [], resumen: {} }

document.addEventListener('DOMContentLoaded', async () => {
  renderHeader('Versiones', sessionStorage.getItem('gestion_entidad_nombre') || null)
  document.getElementById('btnCrear')?.addEventListener('click', crearVersion)
  document.getElementById('nombreVersion')?.addEventListener('keydown', e => { if (e.key === 'Enter') crearVersion() })
  await cargar()
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
function esc(s){ return (s||'').toString().replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;') }

async function cargar() {
  try {
    const resp = await apiFetch('/api/trd-ai/versiones')
    const json = await resp.json()
    if (!resp.ok || !json.ok) throw new Error()
    data = json
    renderResumen(); renderTabla()
  } catch (e) {
    console.error(e); mostrarToast('No se pudieron cargar las versiones', 'error')
  }
}

function renderResumen() {
  const r = data.resumen || {}
  document.getElementById('resumenChips').innerHTML = `
    <span class="rchip info">${r.total || 0} versión(es)</span>
    <span class="rchip ok">Vigente: ${r.vigente ? esc(r.vigente) : '— ninguna'}</span>
    <span class="rchip mut">${r.borradores || 0} borrador(es) · ${r.derogadas || 0} derogada(s)</span>`
}

const CHIP = { aprobada:['vig','Vigente'], borrador:['bor','Borrador'], derogada:['der','Derogada'], en_revision:['rev','En revisión'] }

function renderTabla() {
  const tb = document.getElementById('tabla')
  if (!data.versiones.length) {
    tb.innerHTML = `<tr><td colspan="6" style="text-align:center;color:#9ca3af;padding:1.5rem;">Aún no hay versiones. Crea la primera arriba.</td></tr>`
    return
  }
  tb.innerHTML = data.versiones.map(v => {
    const [cls, txt] = CHIP[v.estado] || ['der', v.estado]
    const chipEstado = v.vigente ? '<span class="chip vig">Vigente</span>' : `<span class="chip ${cls}">${txt}</span>`
    const vig = v.fecha_inicio_vigencia
      ? `${(v.fecha_inicio_vigencia||'').slice(0,10)}${v.fecha_fin_vigencia ? ' → ' + (v.fecha_fin_vigencia||'').slice(0,10) : ' → vigente'}`
      : '—'
    const acto = v.acto_administrativo ? `${esc(v.acto_administrativo)} ${esc(v.numero_acto||'')} ${v.fecha_acto ? '('+(v.fecha_acto||'').slice(0,10)+')' : ''}`.trim() : '—'
    const snap = v.tiene_snapshot ? '<span class="chip vig" style="cursor:pointer" data-acc="snapshot" data-id="'+v.id+'">Congelado</span>' : '<span style="color:#94a3b8;font-size:12px;">Sin respaldo</span>'
    const acciones = []
    acciones.push(`<button class="btn-secondary btn-sm" data-acc="congelar" data-id="${v.id}">Congelar</button>`)
    if (!v.vigente) acciones.push(`<button class="btn-success btn-sm" data-acc="vigente" data-id="${v.id}">Poner vigente</button>`)
    if (v.estado === 'aprobada') acciones.push(`<button class="btn-secondary btn-sm" data-acc="derogar" data-id="${v.id}">Derogar</button>`)
    if (v.estado === 'borrador') acciones.push(`<button class="btn-secondary btn-sm" data-acc="eliminar" data-id="${v.id}">Eliminar</button>`)
    return `
      <tr>
        <td class="v-nombre">${esc(v.nombre_version)}${v.observaciones ? `<div style="font-weight:400;color:#64748b;font-size:12px;">${esc(v.observaciones)}</div>` : ''}</td>
        <td>${chipEstado}</td>
        <td style="color:#475569;">${vig}</td>
        <td style="color:#475569;">${acto}</td>
        <td>${snap}</td>
        <td><div class="v-acc">${acciones.join('')}</div></td>
      </tr>`
  }).join('')

  tb.querySelectorAll('[data-acc]').forEach(b => b.addEventListener('click', () => accion(b.dataset.acc, b.dataset.id)))
}

async function crearVersion() {
  const nombre = document.getElementById('nombreVersion').value.trim()
  const modo = document.getElementById('modoVersion').value
  if (!nombre) { mostrarToast('Escribe el nombre de la versión', 'warning'); return }
  try {
    const resp = await apiFetch('/api/trd-ai/versiones', { method: 'POST', body: JSON.stringify({ nombre_version: nombre, modo_creacion: modo }) })
    const json = await resp.json()
    if (!resp.ok || !json.ok) throw new Error(json.error || '')
    document.getElementById('nombreVersion').value = ''
    mostrarToast('Versión creada', 'success')
    await cargar()
  } catch (e) { console.error(e); mostrarToast(e.message || 'No se pudo crear la versión', 'error') }
}

async function accion(acc, id) {
  try {
    if (acc === 'congelar') {
      if (!confirm('¿Congelar el estado actual de la TRD aprobada en esta versión? Guarda una copia inmutable como respaldo histórico.')) return
      const resp = await apiFetch(`/api/trd-ai/versiones/${id}/congelar`, { method: 'POST' })
      const json = await resp.json()
      if (!resp.ok || !json.ok) throw new Error(json.error || '')
      mostrarToast(`Congelado: ${json.series} series de ${json.dependencias} dependencias`, 'success')
    } else if (acc === 'vigente') {
      const acto = prompt('Tipo de acto administrativo que la adopta (Resolución / Decreto / Acuerdo):', 'Resolución')
      if (acto === null) return
      const numero = prompt('Número del acto administrativo:', '') || ''
      const fecha = prompt('Fecha del acto (AAAA-MM-DD):', new Date().toISOString().slice(0,10)) || ''
      const resp = await apiFetch(`/api/trd-ai/versiones/${id}/vigente`, { method: 'POST', body: JSON.stringify({ acto_administrativo: acto, numero_acto: numero, fecha_acto: fecha }) })
      const json = await resp.json()
      if (!resp.ok || !json.ok) throw new Error(json.error || '')
      mostrarToast(json.derogada ? `Vigente. Se derogó: ${json.derogada}` : 'Versión vigente', 'success')
    } else if (acc === 'derogar') {
      if (!confirm('¿Derogar esta versión? Dejará de estar vigente.')) return
      const resp = await apiFetch(`/api/trd-ai/versiones/${id}/derogar`, { method: 'POST' })
      const json = await resp.json()
      if (!resp.ok || !json.ok) throw new Error(json.error || '')
      mostrarToast('Versión derogada', 'info')
    } else if (acc === 'eliminar') {
      if (!confirm('¿Eliminar esta versión en borrador?')) return
      const resp = await apiFetch(`/api/trd-ai/versiones/${id}`, { method: 'DELETE' })
      const json = await resp.json()
      if (!resp.ok || !json.ok) throw new Error(json.error || '')
      mostrarToast('Versión eliminada', 'info')
    } else if (acc === 'snapshot') {
      const resp = await apiFetch(`/api/trd-ai/versiones/${id}/snapshot`)
      const json = await resp.json()
      if (!resp.ok || !json.ok) throw new Error(json.error || '')
      if (!json.snapshot) { mostrarToast('Esta versión no tiene respaldo congelado', 'warning'); return }
      const s = json.snapshot
      alert(`Respaldo congelado el ${(s.congelado_en||'').slice(0,10)}\n\n${s.series} series en ${s.dependencias} dependencias.`)
      return
    }
    await cargar()
  } catch (e) { console.error(e); mostrarToast(e.message || 'No se pudo completar la acción', 'error') }
}

function mostrarToast(mensaje, tipo = 'info') {
  let c = document.getElementById('sipad-notifications')
  if (!c) { c = document.createElement('div'); c.id = 'sipad-notifications'; document.body.appendChild(c) }
  const t = document.createElement('div'); t.className = `sipad-toast ${tipo}`; t.textContent = mensaje
  c.appendChild(t)
  requestAnimationFrame(() => requestAnimationFrame(() => t.classList.add('visible')))
  setTimeout(() => { t.classList.remove('visible'); setTimeout(() => t.remove(), 300) }, 3500)
}
