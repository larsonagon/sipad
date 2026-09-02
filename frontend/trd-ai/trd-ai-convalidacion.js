import { renderHeader } from '../components/header.js'

// =====================================================
// CONVALIDACIÓN — página
// =====================================================

let estado = null   // objeto convalidación actual

document.addEventListener('DOMContentLoaded', async () => {
  renderHeader('Convalidación', sessionStorage.getItem('gestion_entidad_nombre') || null)

  document.getElementById('btnGuardarActo')?.addEventListener('click', guardarActo)
  document.getElementById('btnAddObs')?.addEventListener('click', agregarObservacion)
  document.getElementById('obsTexto')?.addEventListener('keydown', e => { if (e.key === 'Enter') agregarObservacion() })

  document.getElementById('btnActa')?.addEventListener('click', () =>
    descargarDoc('/api/trd-ai/convalidacion/acta.docx', 'Acta-Comite-TRD.docx', 'btnActa'))
  document.getElementById('btnOficio')?.addEventListener('click', () =>
    descargarDoc('/api/trd-ai/convalidacion/oficio.docx', 'Oficio-remision-TRD.docx', 'btnOficio'))
  document.getElementById('btnTRDdocx')?.addEventListener('click', () =>
    descargarDoc('/api/trd-ai/export/docx', 'TRD-Formato-Unico.docx', 'btnTRDdocx'))
  document.getElementById('btnCCDdocx')?.addEventListener('click', () =>
    descargarDoc('/api/trd-ai/ccd/docx', 'CCD.docx', 'btnCCDdocx'))

  await cargarTodo()
})

// =====================================================
// API
// =====================================================

function esMasterAdmin() {
  const token = sessionStorage.getItem('token')
  if (!token) return false
  try {
    const p = JSON.parse(atob(token.split('.')[1]))
    return p.es_master_admin === true || p.es_master_admin === 1
  } catch { return false }
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

// =====================================================
// CARGA
// =====================================================

async function cargarTodo() {
  try {
    const resp = await apiFetch('/api/trd-ai/convalidacion')
    if (!resp?.ok) throw new Error('estado')
    estado = await resp.json()
    renderResumen()
    renderStepper()
    llenarForm()
    await cargarObservaciones()
  } catch (e) {
    console.error(e)
    mostrarToast('No fue posible cargar la convalidación', 'error')
  }
}

function renderResumen() {
  const c = document.getElementById('resumenChips')
  c.innerHTML = `
    <span class="rchip info">${estado.series_aprobadas} series aprobadas/incorporadas</span>
    <span class="rchip pend">${estado.observaciones_pendientes} observaciones pendientes</span>
    <span class="rchip ok">${estado.observaciones_resueltas} resueltas</span>`
}

// =====================================================
// STEPPER
// =====================================================

function renderStepper() {
  const cont = document.getElementById('stepper')
  const estados = estado.estados || []
  const actualIdx = estados.findIndex(e => e.clave === estado.estado)

  cont.innerHTML = estados.map((e, i) => {
    const cls = i < actualIdx ? 'done' : (i === actualIdx ? 'actual' : '')
    return `
      <button class="step ${cls}" data-estado="${e.clave}">
        <span class="num">${i < actualIdx ? '✓' : (i + 1)}</span>
        <span class="nom">${e.etiqueta}</span>
        <span class="desc">${e.descripcion}</span>
      </button>`
  }).join('')

  cont.querySelectorAll('.step').forEach(btn =>
    btn.addEventListener('click', () => cambiarEstado(btn.dataset.estado))
  )
}

async function cambiarEstado(nuevo) {
  if (nuevo === estado.estado) return
  try {
    const resp = await apiFetch('/api/trd-ai/convalidacion', {
      method: 'PATCH', body: JSON.stringify({ estado: nuevo })
    })
    const json = await resp.json()
    if (!resp.ok || !json.ok) throw new Error(json.error || 'estado')
    estado = json.convalidacion
    renderResumen(); renderStepper(); llenarForm()
    const lbl = (estado.estados.find(e => e.clave === nuevo) || {}).etiqueta || nuevo
    mostrarToast(`Estado: ${lbl}`, 'success')
  } catch (e) {
    console.error(e)
    mostrarToast('No fue posible cambiar el estado', 'error')
  }
}

// =====================================================
// FORM ACTO
// =====================================================

function llenarForm() {
  const set = (id, v) => { const el = document.getElementById(id); if (el) el.value = v || '' }
  set('fecha_comite', estado.fecha_comite)
  set('numero_acta', estado.numero_acta)
  set('acto_administrativo', estado.acto_administrativo)
  set('numero_acto', estado.numero_acto)
  set('fecha_acto', estado.fecha_acto)
  set('radicado_numero', estado.radicado_numero)
  set('radicado_fecha', estado.radicado_fecha)
  set('nota', estado.nota)
  set('presidente_comite', estado.presidente_comite)
  set('secretario_comite', estado.secretario_comite)
  set('asistentes', asistentesToText(estado.asistentes))
}

// Asistentes: JSON [{nombre,cargo,rol}] <-> texto (una persona por línea: Nombre — Cargo — Rol)
function asistentesToText(raw) {
  if (!raw) return ''
  let arr = raw
  if (typeof raw === 'string') { try { arr = JSON.parse(raw) } catch { return raw } }
  if (!Array.isArray(arr)) return ''
  return arr.map(a => [a.nombre, a.cargo, a.rol].filter(Boolean).join(' — ')).join('\n')
}
function textToAsistentes(text) {
  if (!text || !text.trim()) return []
  return text.split('\n').map(l => l.trim()).filter(Boolean).map(l => {
    const partes = l.split(/\s[—–-]\s/).map(x => x.trim())
    return { nombre: partes[0] || '', cargo: partes[1] || '', rol: partes[2] || '' }
  })
}

async function guardarActo() {
  const val = id => document.getElementById(id)?.value || ''
  const body = {
    fecha_comite: val('fecha_comite'),
    numero_acta: val('numero_acta'),
    acto_administrativo: val('acto_administrativo'),
    numero_acto: val('numero_acto'),
    fecha_acto: val('fecha_acto'),
    radicado_numero: val('radicado_numero'),
    radicado_fecha: val('radicado_fecha'),
    nota: val('nota'),
    presidente_comite: val('presidente_comite'),
    secretario_comite: val('secretario_comite'),
    asistentes: textToAsistentes(val('asistentes'))
  }
  try {
    const resp = await apiFetch('/api/trd-ai/convalidacion', { method: 'PATCH', body: JSON.stringify(body) })
    const json = await resp.json()
    if (!resp.ok || !json.ok) throw new Error(json.error || 'guardar')
    if (json.convalidacion) estado = json.convalidacion
    mostrarToast('Datos guardados', 'success')
  } catch (e) {
    console.error(e)
    mostrarToast('No fue posible guardar', 'error')
  }
}

// =====================================================
// OBSERVACIONES
// =====================================================

async function cargarObservaciones() {
  try {
    const resp = await apiFetch('/api/trd-ai/convalidacion/observaciones')
    const json = await resp.json()
    renderObservaciones(json.observaciones || [])
  } catch (e) {
    console.error(e)
    document.getElementById('listaObs').innerHTML = '<div style="color:#94a3b8;padding:8px 0;">No se pudieron cargar las observaciones.</div>'
  }
}

function esc(s) { return (s || '').toString().replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;') }

function renderObservaciones(obs) {
  const cont = document.getElementById('listaObs')
  const pend = obs.filter(o => o.estado === 'pendiente').length
  document.getElementById('obsContador').textContent = obs.length ? `· ${pend} pendiente${pend === 1 ? '' : 's'} de ${obs.length}` : ''

  if (!obs.length) {
    cont.innerHTML = '<div style="color:#94a3b8;padding:6px 0 10px;">Aún no hay observaciones registradas.</div>'
    return
  }

  cont.innerHTML = obs.map(o => {
    const resuelta = o.estado === 'resuelta'
    const ubic = o.serie ? `${esc(o.serie)}${o.subserie ? ' / ' + esc(o.subserie) : ''}` : 'General'
    const fecha = (o.creado_en || '').slice(0, 10)
    const acciones = resuelta
      ? `<button class="btn-secondary btn-sm" data-accion="reabrir" data-id="${o.id}">Reabrir</button>`
      : `<button class="btn-success btn-sm" data-accion="resolver" data-id="${o.id}">Resolver</button>`
    return `
      <div class="obs-item ${resuelta ? 'resuelta' : ''}">
        <div class="obs-top">
          <span class="obs-ubic">${ubic}</span>
          <span class="pill ${resuelta ? 'res' : 'pend'}">${resuelta ? 'Resuelta' : 'Pendiente'}</span>
          <span class="obs-acc">
            ${acciones}
            <button class="btn-secondary btn-sm" data-accion="eliminar" data-id="${o.id}">Eliminar</button>
          </span>
        </div>
        <div class="obs-texto">${esc(o.texto)}</div>
        ${o.respuesta ? `<div class="obs-resp">→ ${esc(o.respuesta)}</div>` : ''}
        <div class="obs-meta">${o.origen === 'interno' ? 'Interno' : 'Comité'}${o.autor ? ' · ' + esc(o.autor) : ''}${fecha ? ' · ' + fecha : ''}</div>
      </div>`
  }).join('')

  cont.querySelectorAll('button[data-accion]').forEach(b =>
    b.addEventListener('click', () => accionObs(b.dataset.accion, b.dataset.id))
  )
}

async function accionObs(accion, id) {
  try {
    if (accion === 'resolver') {
      const respuesta = prompt('Respuesta / cómo se resolvió (opcional):') || ''
      const resp = await apiFetch(`/api/trd-ai/convalidacion/observaciones/${id}/resolver`, {
        method: 'PATCH', body: JSON.stringify({ respuesta })
      })
      if (!resp.ok) throw new Error()
      mostrarToast('Observación resuelta', 'success')
    } else if (accion === 'reabrir') {
      const resp = await apiFetch(`/api/trd-ai/convalidacion/observaciones/${id}/reabrir`, { method: 'PATCH' })
      if (!resp.ok) throw new Error()
      mostrarToast('Observación reabierta', 'info')
    } else if (accion === 'eliminar') {
      if (!confirm('¿Eliminar esta observación?')) return
      const resp = await apiFetch(`/api/trd-ai/convalidacion/observaciones/${id}`, { method: 'DELETE' })
      if (!resp.ok) throw new Error()
      mostrarToast('Observación eliminada', 'info')
    }
    await refrescarObsYResumen()
  } catch (e) {
    console.error(e)
    mostrarToast('No fue posible completar la acción', 'error')
  }
}

async function agregarObservacion() {
  const texto = document.getElementById('obsTexto').value.trim()
  if (!texto) { mostrarToast('Escribe la observación', 'warning'); return }
  const body = {
    serie: document.getElementById('obsSerie').value.trim() || null,
    subserie: document.getElementById('obsSubserie').value.trim() || null,
    texto
  }
  try {
    const resp = await apiFetch('/api/trd-ai/convalidacion/observaciones', { method: 'POST', body: JSON.stringify(body) })
    const json = await resp.json()
    if (!resp.ok || !json.ok) throw new Error(json.error || 'crear')
    document.getElementById('obsSerie').value = ''
    document.getElementById('obsSubserie').value = ''
    document.getElementById('obsTexto').value = ''
    mostrarToast('Observación agregada', 'success')
    await refrescarObsYResumen()
  } catch (e) {
    console.error(e)
    mostrarToast('No fue posible agregar la observación', 'error')
  }
}

// =====================================================
// DESCARGA DE DOCUMENTOS (expediente)
// =====================================================

async function descargarDoc(url, filename, btnId) {
  const btn = btnId ? document.getElementById(btnId) : null
  const original = btn?.textContent
  if (btn) { btn.disabled = true; btn.textContent = 'Generando…' }
  try {
    const resp = await apiFetch(url)
    if (!resp || !resp.ok) throw new Error('descarga')
    const blob = await resp.blob()
    const objUrl = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = objUrl
    a.download = filename
    document.body.appendChild(a); a.click(); a.remove(); URL.revokeObjectURL(objUrl)
    mostrarToast('Documento generado', 'success')
  } catch (e) {
    console.error(e)
    mostrarToast('No fue posible generar el documento', 'error')
  } finally {
    if (btn) { btn.disabled = false; btn.textContent = original }
  }
}

async function refrescarObsYResumen() {
  await cargarObservaciones()
  try {
    const resp = await apiFetch('/api/trd-ai/convalidacion')
    if (resp?.ok) { estado = await resp.json(); renderResumen() }
  } catch {}
}

// =====================================================
// TOAST
// =====================================================

function mostrarToast(mensaje, tipo = 'info') {
  let contenedor = document.getElementById('sipad-notifications')
  if (!contenedor) {
    contenedor = document.createElement('div')
    contenedor.id = 'sipad-notifications'
    document.body.appendChild(contenedor)
  }
  const toast = document.createElement('div')
  toast.className = `sipad-toast ${tipo}`
  toast.textContent = mensaje
  contenedor.appendChild(toast)
  requestAnimationFrame(() => requestAnimationFrame(() => toast.classList.add('visible')))
  setTimeout(() => { toast.classList.remove('visible'); setTimeout(() => toast.remove(), 300) }, 3500)
}
