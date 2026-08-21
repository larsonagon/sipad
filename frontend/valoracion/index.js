import { renderHeader } from '../components/header.js'

// ============================================================
// AUTH / FETCH
// ============================================================
function getToken() { return sessionStorage.getItem('token') }

function esMasterAdmin() {
  const t = getToken(); if (!t) return false
  try { const p = JSON.parse(atob(t.split('.')[1])); return p.es_master_admin === true || p.es_master_admin === 1 }
  catch { return false }
}

function headers(extra = {}) {
  const h = { Authorization: `Bearer ${getToken()}`, 'Content-Type': 'application/json', ...extra }
  if (esMasterAdmin()) {
    const eid = sessionStorage.getItem('gestion_entidad_id') || sessionStorage.getItem('entidad_id') || null
    if (eid) h['X-Entidad-Id'] = eid
  }
  return h
}

async function api(url, opts = {}) {
  const res = await fetch(url, { ...opts, headers: headers(opts.headers || {}) })
  if (res.status === 401) { sessionStorage.clear(); window.location.href = '/'; return null }
  if (!res.ok) { throw new Error((await res.text()) || `Error ${res.status}`) }
  return res.status === 204 ? null : res.json()
}

const esc = s => (s ?? '').toString().replace(/[&<>"]/g, c => ({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;' }[c]))

// ============================================================
// ESTADO
// ============================================================
let plantillaActual = null
let diligenciamientoId = null

// ============================================================
// INIT
// ============================================================
document.addEventListener('DOMContentLoaded', async () => {
  if (!getToken()) { window.location.href = '/'; return }
  renderHeader('Valoración')

  document.getElementById('btnVolver').addEventListener('click', mostrarCatalogo)
  document.getElementById('btnGuardar').addEventListener('click', guardarRespuestas)
  document.getElementById('btnFinalizar').addEventListener('click', finalizar)
  document.getElementById('btnAgregarCaso').addEventListener('click', () => agregarCasoUI())

  await cargarCatalogo()
})

// ============================================================
// CATÁLOGO
// ============================================================
async function cargarCatalogo() {
  const cont = document.getElementById('listaPlantillas')
  const msg = document.getElementById('msgCatalogo')
  try {
    const json = await api('/api/valoracion/plantillas')
    if (!json) return
    const plantillas = json.data || []
    if (!plantillas.length) {
      cont.innerHTML = `<p class="muted">Aún no hay instrumentos para esta entidad. Un administrador puede crearlos.</p>`
    } else {
      cont.innerHTML = plantillas.map(p => `
        <div class="lvd-card">
          <span class="lvd-tag ${p.tipo === 'valoracion' ? 'val' : ''}">${p.tipo === 'valoracion' ? 'Valoración' : 'Levantamiento'}</span>
          <h4 style="margin:8px 0 4px;">${esc(p.nombre)}</h4>
          <p class="muted" style="margin:0 0 12px;">${esc(p.descripcion || '')}</p>
          <button class="btn-primary" data-plantilla="${p.id}">Nuevo diligenciamiento</button>
        </div>
      `).join('')
      cont.querySelectorAll('button[data-plantilla]').forEach(b =>
        b.addEventListener('click', () => iniciarDiligenciamiento(b.dataset.plantilla)))
    }
    msg.textContent = `${plantillas.length} instrumento(s)`
  } catch (e) {
    console.error(e); cont.innerHTML = `<p class="muted">Error cargando instrumentos.</p>`
  }
  await cargarDiligenciamientos()
}

async function cargarDiligenciamientos() {
  const cont = document.getElementById('listaDiligenciamientos')
  try {
    const json = await api('/api/valoracion/diligenciamientos')
    if (!json) return
    const items = json.data || []
    if (!items.length) { cont.innerHTML = `<p class="muted">Sin diligenciamientos todavía.</p>`; return }
    cont.innerHTML = items.map(d => `
      <div class="lvd-card">
        <span class="lvd-tag">${esc(d.estado)}</span>
        <h4 style="margin:8px 0 4px;">${esc(d.titulo || 'Sin título')}</h4>
        <p class="muted" style="margin:0 0 12px;">${new Date(d.created_at).toLocaleString('es-CO')}</p>
        <button class="btn-secondary" data-dil="${d.id}" data-plantilla="${d.plantilla_id}">Abrir</button>
      </div>
    `).join('')
    cont.querySelectorAll('button[data-dil]').forEach(b =>
      b.addEventListener('click', () => abrirDiligenciamiento(b.dataset.plantilla, b.dataset.dil)))
  } catch (e) { console.error(e) }
}

// ============================================================
// DILIGENCIAR
// ============================================================
async function iniciarDiligenciamiento(plantillaId) {
  const titulo = prompt('Título para este diligenciamiento (ej. dependencia o fecha):', '')
  if (titulo === null) return
  try {
    const json = await api('/api/valoracion/diligenciamientos', {
      method: 'POST', body: JSON.stringify({ plantillaId, titulo })
    })
    if (!json) return
    await abrirDiligenciamiento(plantillaId, json.id)
  } catch (e) { alert('No se pudo iniciar: ' + e.message) }
}

async function abrirDiligenciamiento(plantillaId, dilId) {
  try {
    const [pj, dj] = await Promise.all([
      api(`/api/valoracion/plantillas/${plantillaId}`),
      api(`/api/valoracion/diligenciamientos/${dilId}`)
    ])
    if (!pj || !dj) return
    plantillaActual = pj.data
    diligenciamientoId = dilId
    renderInstrumento(plantillaActual, dj.data)
    document.getElementById('vistaCatalogo').classList.add('hidden')
    document.getElementById('vistaDiligenciar').classList.remove('hidden')
    window.scrollTo(0, 0)
  } catch (e) { alert('No se pudo abrir: ' + e.message) }
}

function renderInstrumento(plantilla, dil) {
  document.getElementById('tituloInstrumento').textContent = plantilla.nombre
  document.getElementById('descInstrumento').textContent = plantilla.descripcion || ''

  const respuestas = {}
  ;(dil.respuestas || []).forEach(r => { respuestas[r.pregunta_id] = r.valor })

  const cont = document.getElementById('secciones')
  cont.innerHTML = plantilla.secciones.map(sec => `
    <div class="lvd-seccion">
      <div class="lvd-seccion-head">
        <h3>${esc(sec.titulo)}</h3>
        ${sec.instrucciones ? `<p>${esc(sec.instrucciones)}</p>` : ''}
      </div>
      ${sec.preguntas.map(q => renderPregunta(q, respuestas[q.id])).join('')}
    </div>
  `).join('')

  // Casos ya guardados
  const casosCont = document.getElementById('casos')
  casosCont.innerHTML = ''
  ;(dil.casos || []).forEach(c => agregarCasoUI(c))
}

function renderPregunta(q, valor = '') {
  const req = q.obligatoria ? '<span class="req">*</span>' : ''
  const cod = q.codigo ? `<span class="lvd-cod">${esc(q.codigo)}.</span>` : ''
  const ayuda = q.ayuda ? `<p class="ayuda">${esc(q.ayuda)}</p>` : ''
  let campo
  if (q.tipo === 'texto_corto') {
    campo = `<input type="text" class="form-control lvd-input" data-preg="${q.id}" value="${esc(valor)}">`
  } else if (q.tipo === 'si_no') {
    campo = `<select class="form-control lvd-input" data-preg="${q.id}">
      <option value="">—</option>
      <option ${valor==='Sí'?'selected':''}>Sí</option>
      <option ${valor==='No'?'selected':''}>No</option>
    </select>`
  } else if (q.tipo === 'opcion_multiple' && Array.isArray(q.opciones)) {
    const sel = (valor || '').split('|').map(s => s.trim())
    campo = `<div class="lvd-input-multi" data-preg="${q.id}">` +
      q.opciones.map(o => `<label style="display:block;font-weight:400;">
        <input type="checkbox" value="${esc(o)}" ${sel.includes(o)?'checked':''}> ${esc(o)}
      </label>`).join('') + `</div>`
  } else {
    campo = `<textarea rows="3" class="form-control lvd-input" data-preg="${q.id}">${esc(valor)}</textarea>`
  }
  return `<div class="lvd-preg"><label>${cod}${esc(q.enunciado)} ${req}</label>${ayuda}${campo}</div>`
}

function recogerRespuestas() {
  const out = []
  document.querySelectorAll('.lvd-input').forEach(el => {
    out.push({ preguntaId: el.dataset.preg, valor: el.value })
  })
  document.querySelectorAll('.lvd-input-multi').forEach(el => {
    const vals = [...el.querySelectorAll('input:checked')].map(c => c.value)
    out.push({ preguntaId: el.dataset.preg, valor: vals.join(' | ') })
  })
  return out
}

async function guardarRespuestas() {
  const estado = document.getElementById('estadoGuardado')
  estado.textContent = 'Guardando…'
  try {
    await api(`/api/valoracion/diligenciamientos/${diligenciamientoId}/respuestas`, {
      method: 'PUT', body: JSON.stringify({ respuestas: recogerRespuestas() })
    })
    estado.textContent = 'Guardado ✓ ' + new Date().toLocaleTimeString('es-CO')
  } catch (e) { estado.textContent = 'Error al guardar'; alert(e.message) }
}

async function finalizar() {
  if (!confirm('¿Marcar este diligenciamiento como finalizado? Podrás seguir consultándolo.')) return
  try {
    await guardarRespuestas()
    await api(`/api/valoracion/diligenciamientos/${diligenciamientoId}/finalizar`, { method: 'POST' })
    alert('Diligenciamiento finalizado.')
    mostrarCatalogo()
  } catch (e) { alert(e.message) }
}

// ============================================================
// CASOS
// ============================================================
function agregarCasoUI(caso = null) {
  const cont = document.getElementById('casos')
  const div = document.createElement('div')
  div.className = 'lvd-card'
  div.style.marginBottom = '12px'
  div.innerHTML = `
    <div style="display:flex;gap:8px;flex-wrap:wrap;align-items:end;">
      <div><label class="muted">Etiqueta</label><input type="text" class="form-control caso-etiqueta" style="width:70px;" value="${esc(caso?.etiqueta || '')}" placeholder="A/B/C"></div>
      <div style="flex:1;min-width:200px;"><label class="muted">Título del caso</label><input type="text" class="form-control caso-titulo" value="${esc(caso?.titulo || '')}"></div>
      <div style="flex:1;min-width:200px;"><label class="muted">Tipo</label><input type="text" class="form-control caso-tipo" value="${esc(caso?.tipo_caso || '')}" placeholder="p.ej. comparendo_pagado"></div>
    </div>
    <p class="muted" style="margin:10px 0 4px;">Documentos del expediente, en orden:</p>
    <div class="caso-docs"></div>
    <button type="button" class="btn-secondary btn-add-doc" style="font-size:12px;padding:4px 10px;">+ documento</button>
    <button type="button" class="btn-primary btn-guardar-caso" style="font-size:12px;padding:4px 10px;">Guardar caso</button>
    <span class="muted caso-estado" style="margin-left:8px;"></span>
  `
  cont.appendChild(div)

  const docsCont = div.querySelector('.caso-docs')
  const addDoc = (d = null) => {
    const row = document.createElement('div')
    row.className = 'lvd-doc-row'
    row.innerHTML = `
      <input type="text" class="form-control doc-nombre" placeholder="Nombre del documento" value="${esc(d?.nombre_documento || '')}">
      <input type="text" class="form-control doc-soporte" style="max-width:120px;" placeholder="soporte" value="${esc(d?.soporte || '')}">`
    docsCont.appendChild(row)
  }
  if (caso?.documentos?.length) caso.documentos.forEach(addDoc); else addDoc()

  div.querySelector('.btn-add-doc').addEventListener('click', () => addDoc())
  div.querySelector('.btn-guardar-caso').addEventListener('click', async () => {
    const estado = div.querySelector('.caso-estado')
    const documentos = [...docsCont.querySelectorAll('.lvd-doc-row')].map(r => ({
      nombreDocumento: r.querySelector('.doc-nombre').value.trim(),
      soporte: r.querySelector('.doc-soporte').value.trim() || null
    })).filter(d => d.nombreDocumento)
    const payload = {
      etiqueta: div.querySelector('.caso-etiqueta').value.trim() || null,
      titulo: div.querySelector('.caso-titulo').value.trim() || null,
      tipoCaso: div.querySelector('.caso-tipo').value.trim() || null,
      documentos
    }
    estado.textContent = 'Guardando…'
    try {
      await api(`/api/valoracion/diligenciamientos/${diligenciamientoId}/casos`, {
        method: 'POST', body: JSON.stringify(payload)
      })
      estado.textContent = 'Guardado ✓'
    } catch (e) { estado.textContent = 'Error'; alert(e.message) }
  })
}

// ============================================================
function mostrarCatalogo() {
  document.getElementById('vistaDiligenciar').classList.add('hidden')
  document.getElementById('vistaCatalogo').classList.remove('hidden')
  plantillaActual = null; diligenciamientoId = null
  cargarCatalogo()
}
