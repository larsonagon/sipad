import { renderHeader } from '../components/header.js'

document.addEventListener('DOMContentLoaded', async () => {

  const token = sessionStorage.getItem('token')
  if (!token) { window.location.href = '/'; return }

  renderHeader('TRD-AI', sessionStorage.getItem('gestion_entidad_nombre') || null)

  document
    .getElementById('btnGenerarPropuestas')
    ?.addEventListener('click', generarPropuestas)

  await cargarPropuestas()
})

// =====================================================
// API FETCH
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

  const headers = {
    Authorization: `Bearer ${token}`,
    ...(options.headers || {})
  }

  if (esMasterAdmin()) {
    const eid =
      sessionStorage.getItem('gestion_entidad_id') ||
      sessionStorage.getItem('entidad_id') || null
    if (eid) headers['X-Entidad-Id'] = eid
  }

  if (options.body) headers['Content-Type'] = 'application/json'

  const resp = await fetch(url, { ...options, headers })

  if (resp.status === 401) {
    sessionStorage.clear()
    window.location.href = '/'
    return null
  }

  return resp
}

// =====================================================
// CARGAR PROPUESTAS
// =====================================================

async function cargarPropuestas() {

  try {

    const resp = await apiFetch('/api/trd-ai/series-propuestas')
    if (!resp) return
    if (!resp.ok) throw new Error('Error cargando propuestas')

    const json = await resp.json()
    if (!json.ok) throw new Error(json.error)

    renderTabla(json.data)

  } catch (err) {
    console.error(err)
    mostrarToast('No fue posible cargar las propuestas', 'error')
  }
}

// =====================================================
// UTILIDADES
// =====================================================

function parseTipologias(raw) {
  if (!raw) return []
  try {
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? parsed : [parsed]
  } catch {
    return [raw]
  }
}

function sentenceCase(text) {
  if (!text) return ''
  const s = text.toString().trim()
  return s.charAt(0).toUpperCase() + s.slice(1).toLowerCase()
}

function estadoChip(estado) {
  const e = (estado || '').toLowerCase()
  if (e === 'aprobada')
    return `<span class="estado-chip estado-aprobada">Aprobada</span>`
  if (e === 'rechazada')
    return `<span class="estado-chip estado-rechazada">Rechazada</span>`
  if (e === 'incorporada')
    return `<span class="estado-chip" style="background:#dbeafe;color:#1e40af;">Incorporada</span>`
  return `<span class="estado-chip estado-propuesta">Propuesta</span>`
}

// =====================================================
// AGRUPAR POR SERIE + SUBSERIE + ESTADO
// =====================================================

function agruparSeries(lista) {

  const mapa = {}

  lista.forEach(p => {
    const serie    = p.nombre_serie    || 'Serie sin nombre'
    const subserie = p.nombre_subserie || ''
    const key      = `${serie}__${subserie}__${p.estado}`

    if (!mapa[key]) {
      mapa[key] = {
        serie,
        subserie,
        estado:      p.estado || 'propuesta',
        cantidad:    0,
        ids:         [],
        id:          p.id,
        tipologias:  parseTipologias(p.tipologia_documental)
      }
    }

    mapa[key].cantidad++
    mapa[key].ids.push(p.id)
  })

  return Object.values(mapa)
}

// =====================================================
// RENDER TABLA
// =====================================================

function renderTabla(lista) {

  const tbody = document.getElementById('tablaPropuestas')

  if (!lista || !lista.length) {
    tbody.innerHTML = `<tr><td colspan="6">No hay propuestas registradas</td></tr>`
    return
  }

  const agrupadas = agruparSeries(lista)

  tbody.innerHTML = agrupadas.map(p => {

    const estado = (p.estado || '').toLowerCase()
    const id     = p.id

    const tipHtml = p.tipologias.length
      ? `<ul class="tip-lista">${
          p.tipologias.map(t =>
            `<li>${sentenceCase(t)}</li>`
          ).join('')
        }</ul>`
      : '<span style="color:#9ca3af;font-size:12px;">Sin tipologías</span>'

    const btnEditar = estado !== 'incorporada'
      ? `<button class="btn-secondary btn-sm" onclick="editarPropuesta('${id}')">Editar</button>`
      : ''

    const btnAprobar = estado === 'propuesta'
      ? `<button class="btn-success btn-sm" onclick="aprobar('${id}', this)">Aprobar</button>`
      : ''

    const btnRechazar = estado === 'propuesta'
      ? `<button class="btn-danger btn-sm" onclick="rechazar('${id}', this)">Rechazar</button>`
      : ''

    const btnIncorporar = estado === 'aprobada'
      ? `<button class="btn-primary btn-sm btn-incorporar" onclick="incorporar('${id}', this)">Incorporar a TRD</button>`
      : ''

    return `
      <tr data-id="${id}">
        <td class="serie-nombre"><strong>${p.serie}</strong></td>
        <td class="subserie">${p.subserie || '—'}</td>
        <td>${p.cantidad}</td>
        <td style="max-width:280px;line-height:1.6;">${tipHtml}</td>
        <td class="td-estado">${estadoChip(p.estado)}</td>
        <td class="trd-actions">
          ${btnEditar}
          ${btnAprobar}
          ${btnRechazar}
          ${btnIncorporar}
        </td>
      </tr>
    `
  }).join('')
}

// =====================================================
// ACTUALIZAR FILA EN SITIO
// =====================================================

function actualizarFila(id, nuevoEstado) {

  const fila = document.querySelector(`tr[data-id="${id}"]`)
  if (!fila) return

  const tdEstado = fila.querySelector('.td-estado')
  if (tdEstado) tdEstado.innerHTML = estadoChip(nuevoEstado)

  const tdAcciones = fila.querySelector('.trd-actions')
  if (!tdAcciones) return

  const estado = nuevoEstado.toLowerCase()

  const btnEditar = estado !== 'incorporada'
    ? `<button class="btn-secondary btn-sm" onclick="editarPropuesta('${id}')">Editar</button>`
    : ''

  const btnAprobar = estado === 'propuesta'
    ? `<button class="btn-success btn-sm" onclick="aprobar('${id}', this)">Aprobar</button>`
    : ''

  const btnRechazar = estado === 'propuesta'
    ? `<button class="btn-danger btn-sm" onclick="rechazar('${id}', this)">Rechazar</button>`
    : ''

  const btnIncorporar = estado === 'aprobada'
    ? `<button class="btn-primary btn-sm btn-incorporar" onclick="incorporar('${id}', this)">Incorporar a TRD</button>`
    : ''

  tdAcciones.innerHTML = `${btnEditar}${btnAprobar}${btnRechazar}${btnIncorporar}`
}

// =====================================================
// GENERAR PROPUESTAS
// =====================================================

async function generarPropuestas() {

  try {

    const resp = await apiFetch('/api/trd-ai/generar-propuestas', { method: 'POST' })
    if (!resp) return
    if (!resp.ok) throw new Error('Error ejecutando el motor')

    const json = await resp.json()
    if (!json.ok) throw new Error(json.error)

    mostrarToast('Motor TRD-AI ejecutado correctamente', 'success')
    await cargarPropuestas()

  } catch (err) {
    console.error(err)
    mostrarToast('No fue posible ejecutar el motor TRD-AI', 'error')
  }
}

// =====================================================
// EDITAR PROPUESTA
// =====================================================

window.editarPropuesta = async function(id) {

  // Obtener datos actuales de la fila
  const fila = document.querySelector(`tr[data-id="${id}"]`)
  if (!fila) return

  const serieActual    = fila.querySelector('.serie-nombre strong')?.textContent || ''
  const subserieActual = fila.querySelector('.subserie')?.textContent?.trim() || ''

  // Extraer tipologías actuales del DOM — ahora son <li> en .tip-lista
  const tipItems = fila.querySelectorAll('td:nth-child(4) .tip-lista li')
  const tipActuales = Array.from(tipItems)
    .map(li => li.textContent.trim())
    .filter(t => t)
    .join('\n')

  const overlay = document.createElement('div')
  overlay.className = 'modal'

  overlay.innerHTML = `
    <div class="modal-content" style="max-width:520px;">
      <h3>Editar propuesta</h3>
      <p style="margin:0 0 16px;font-size:13px;color:var(--color-text-muted);">
        Corrige los nombres o tipologías antes de aprobar e incorporar a la TRD.
      </p>

      <div class="form-group">
        <label>Serie documental</label>
        <input type="text" id="editSerie" class="form-control" value="${serieActual}">
      </div>

      <div class="form-group">
        <label>Subserie documental</label>
        <input type="text" id="editSubserie" class="form-control" value="${subserieActual !== '—' ? subserieActual : ''}">
      </div>

      <div class="form-group">
        <label>Tipos documentales <span style="font-weight:400;color:var(--color-text-muted);">(uno por línea)</span></label>
        <textarea id="editTipologias" class="form-control" style="height:120px;resize:vertical;">${tipActuales}</textarea>
      </div>

      <div class="modal-actions">
        <button class="btn-secondary" id="btnCancelarEditar">Cancelar</button>
        <button class="btn-primary"   id="btnGuardarEditar">Guardar cambios</button>
      </div>
    </div>
  `

  document.body.appendChild(overlay)

  overlay.querySelector('#btnCancelarEditar').addEventListener('click', () => overlay.remove())

  overlay.querySelector('#btnGuardarEditar').addEventListener('click', async () => {

    const serie     = document.getElementById('editSerie').value.trim()
    const subserie  = document.getElementById('editSubserie').value.trim()
    const tipRaw    = document.getElementById('editTipologias').value
    const tipologias = tipRaw.split('\n').map(t => t.trim()).filter(Boolean)

    if (!serie) { mostrarToast('El nombre de la serie es obligatorio', 'error'); return }

    const btn = overlay.querySelector('#btnGuardarEditar')
    btn.disabled = true; btn.textContent = 'Guardando...'

    try {

      const resp = await apiFetch(`/api/trd-ai/series-propuestas/${id}/editar`, {
        method: 'PATCH',
        body: JSON.stringify({
          nombre_serie:         serie,
          nombre_subserie:      subserie || null,
          tipologia_documental: JSON.stringify(tipologias)
        })
      })

      if (!resp || !resp.ok) throw new Error('Error guardando cambios')

      const json = await resp.json()
      if (!json.ok) throw new Error(json.error)

      overlay.remove()
      mostrarToast('Propuesta actualizada', 'success')
      await cargarPropuestas()

    } catch (err) {
      console.error(err)
      mostrarToast('No fue posible guardar los cambios', 'error')
      btn.disabled = false; btn.textContent = 'Guardar cambios'
    }
  })

  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) overlay.remove()
  })
}

// =====================================================
// APROBAR — integra retención automática
// =====================================================

window.aprobar = async function(id, btn) {

  if (btn) { btn.disabled = true; btn.textContent = '...' }

  try {

    // 1. Aprobar la propuesta
    const resp = await apiFetch(
      `/api/trd-ai/series-propuestas/${id}/aprobar`,
      { method: 'PATCH' }
    )
    if (!resp) return
    const json = await resp.json()
    if (!json.ok) throw new Error(json.error)

    // 2. Obtener retención automática en segundo plano
    apiFetch(`/api/trd-ai/series-propuestas/${id}/retencion-automatica`)
      .catch(() => {}) // silencioso si falla

    mostrarToast('Propuesta aprobada', 'success')
    actualizarFila(id, 'aprobada')

  } catch (err) {
    console.error(err)
    mostrarToast('No fue posible aprobar la propuesta', 'error')
    if (btn) { btn.disabled = false; btn.textContent = 'Aprobar' }
  }
}

// =====================================================
// RECHAZAR
// =====================================================

window.rechazar = async function(id, btn) {

  if (btn) { btn.disabled = true; btn.textContent = '...' }

  try {

    const resp = await apiFetch(
      `/api/trd-ai/series-propuestas/${id}/rechazar`,
      { method: 'PATCH' }
    )
    if (!resp) return
    const json = await resp.json()
    if (!json.ok) throw new Error(json.error)

    mostrarToast('Propuesta rechazada', 'warning')
    actualizarFila(id, 'rechazada')

  } catch (err) {
    console.error(err)
    mostrarToast('No fue posible rechazar la propuesta', 'error')
    if (btn) { btn.disabled = false; btn.textContent = 'Rechazar' }
  }
}

// =====================================================
// INCORPORAR
// =====================================================

window.incorporar = async function(id, btn) {

  const confirmado = await confirmarAccion(
    '¿Incorporar esta serie a la TRD oficial? Se creará la entrada en el módulo TRD.'
  )
  if (!confirmado) return

  if (btn) { btn.disabled = true; btn.textContent = 'Incorporando...' }

  try {

    const resp = await apiFetch(
      `/api/trd-ai/series-propuestas/${id}/incorporar`,
      { method: 'POST' }
    )
    if (!resp) return
    const json = await resp.json()
    if (!json.ok) throw new Error(json.error)

    mostrarToast('Serie incorporada a la TRD oficial ✓', 'success')
    actualizarFila(id, 'incorporada')

  } catch (err) {
    console.error(err)
    mostrarToast('No fue posible incorporar la serie: ' + err.message, 'error')
    if (btn) { btn.disabled = false; btn.textContent = 'Incorporar a TRD' }
  }
}

// =====================================================
// MODAL DE CONFIRMACIÓN
// =====================================================

function confirmarAccion(mensaje) {
  return new Promise((resolve) => {

    const overlay = document.createElement('div')
    overlay.className = 'modal'

    overlay.innerHTML = `
      <div class="modal-content" style="max-width:420px;">
        <h3>Confirmar acción</h3>
        <p style="margin:0 0 8px;font-size:14px;color:var(--color-text-muted);">${mensaje}</p>
        <div class="modal-actions">
          <button class="btn-secondary" id="btnCancelarConfirm">Cancelar</button>
          <button class="btn-primary"   id="btnAceptarConfirm" autofocus>Aceptar</button>
        </div>
      </div>
    `

    document.body.appendChild(overlay)

    overlay.querySelector('#btnAceptarConfirm').addEventListener('click', () => {
      overlay.remove(); resolve(true)
    })
    overlay.querySelector('#btnCancelarConfirm').addEventListener('click', () => {
      overlay.remove(); resolve(false)
    })
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) { overlay.remove(); resolve(false) }
    })
  })
}

// =====================================================
// TOAST — usa sistema existente #sipad-notifications
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

  requestAnimationFrame(() => {
    requestAnimationFrame(() => toast.classList.add('visible'))
  })

  setTimeout(() => {
    toast.classList.remove('visible')
    setTimeout(() => toast.remove(), 300)
  }, 3500)
}