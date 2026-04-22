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
// ✅ Fix: solo master admin envía X-Entidad-Id
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

  if (options.body) {
    headers['Content-Type'] = 'application/json'
  }

  const resp = await fetch(url, { ...options, headers })

  if (resp.status === 401) {
    sessionStorage.clear()
    localStorage.clear()
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

function capitalizar(texto) {
  if (!texto) return '-'
  const limpio = texto.toString().toLowerCase().trim()
  return limpio.charAt(0).toUpperCase() + limpio.slice(1)
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
// AGRUPAR POR SERIE + SUBSERIE
// ✅ Fix: el estado del grupo es el del primer id,
//    pero ahora mostramos una fila por propuesta
//    individual para que el estado sea exacto
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
        estado:   p.estado || 'propuesta',
        cantidad: 0,
        ids:      [],
        id:       p.id  // id representativo para acciones
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
    tbody.innerHTML = `<tr><td colspan="5">No hay propuestas registradas</td></tr>`
    return
  }

  const agrupadas = agruparSeries(lista)

  tbody.innerHTML = agrupadas.map(p => {

    const estado = (p.estado || '').toLowerCase()
    const idAccion = p.id

    // Botones según estado
    const btnAprobar = estado === 'propuesta'
      ? `<button class="btn-aprobar" onclick="aprobar('${idAccion}', this)">Aprobar</button>`
      : ''

    const btnRechazar = estado === 'propuesta'
      ? `<button class="btn-rechazar" onclick="rechazar('${idAccion}', this)">Rechazar</button>`
      : ''

    const btnRetencion = (estado === 'propuesta' || estado === 'aprobada')
      ? `<button class="btn-retencion" onclick="retencion('${idAccion}')">Retención</button>`
      : ''

    // ✅ Botón Incorporar — solo para aprobadas
    const btnIncorporar = estado === 'aprobada'
      ? `<button class="btn-incorporar" onclick="incorporar('${idAccion}', this)"
           style="background:#7c3aed;color:white;padding:6px 12px;border-radius:6px;
                  font-size:12px;font-weight:600;border:none;cursor:pointer;white-space:nowrap;">
           Incorporar a TRD
         </button>`
      : ''

    return `
      <tr data-id="${idAccion}">
        <td class="serie-nombre"><strong>${p.serie}</strong></td>
        <td class="subserie">${(p.subserie || '-').replace(/\\n/g, '<br>')}</td>
        <td>${p.cantidad}</td>
        <td class="td-estado">${estadoChip(p.estado)}</td>
        <td class="trd-actions">
          ${btnAprobar}
          ${btnRechazar}
          ${btnRetencion}
          ${btnIncorporar}
        </td>
      </tr>
    `
  }).join('')
}

// =====================================================
// ACTUALIZAR FILA EN SITIO
// ✅ Evita re-render completo de la tabla
// =====================================================

function actualizarFila(id, nuevoEstado) {

  const fila = document.querySelector(`tr[data-id="${id}"]`)
  if (!fila) return

  // Actualizar chip
  const tdEstado = fila.querySelector('.td-estado')
  if (tdEstado) tdEstado.innerHTML = estadoChip(nuevoEstado)

  // Actualizar botones
  const tdAcciones = fila.querySelector('.trd-actions')
  if (!tdAcciones) return

  const estado = nuevoEstado.toLowerCase()

  const btnAprobar = estado === 'propuesta'
    ? `<button class="btn-aprobar" onclick="aprobar('${id}', this)">Aprobar</button>`
    : ''

  const btnRechazar = estado === 'propuesta'
    ? `<button class="btn-rechazar" onclick="rechazar('${id}', this)">Rechazar</button>`
    : ''

  const btnRetencion = (estado === 'propuesta' || estado === 'aprobada')
    ? `<button class="btn-retencion" onclick="retencion('${id}')">Retención</button>`
    : ''

  const btnIncorporar = estado === 'aprobada'
    ? `<button class="btn-incorporar" onclick="incorporar('${id}', this)"
         style="background:#7c3aed;color:white;padding:6px 12px;border-radius:6px;
                font-size:12px;font-weight:600;border:none;cursor:pointer;white-space:nowrap;">
         Incorporar a TRD
       </button>`
    : ''

  tdAcciones.innerHTML = `${btnAprobar}${btnRechazar}${btnRetencion}${btnIncorporar}`
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
// ACCIONES
// =====================================================

window.aprobar = async function(id, btn) {

  if (btn) { btn.disabled = true; btn.textContent = '...' }

  try {

    const resp = await apiFetch(
      `/api/trd-ai/series-propuestas/${id}/aprobar`,
      { method: 'PATCH' }
    )
    if (!resp) return

    const json = await resp.json()
    if (!json.ok) throw new Error(json.error)

    mostrarToast('Propuesta aprobada', 'success')
    actualizarFila(id, 'aprobada')  // ✅ actualización reactiva en sitio

  } catch (err) {
    console.error(err)
    mostrarToast('No fue posible aprobar la propuesta', 'error')
    if (btn) { btn.disabled = false; btn.textContent = 'Aprobar' }
  }
}

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
    actualizarFila(id, 'rechazada')  // ✅ actualización reactiva en sitio

  } catch (err) {
    console.error(err)
    mostrarToast('No fue posible rechazar la propuesta', 'error')
    if (btn) { btn.disabled = false; btn.textContent = 'Rechazar' }
  }
}

window.retencion = async function(id) {

  try {

    const resp = await apiFetch(
      `/api/trd-ai/series-propuestas/${id}/retencion-automatica`
    )
    if (!resp) return

    const json = await resp.json()
    if (!json.ok) throw new Error(json.error)

    const regla = json.data || {}
    const gestion    = regla.retencion_gestion  ?? '-'
    const central    = regla.retencion_central   ?? '-'
    const disposicion = regla.disposicion_final  ?? '-'
    const norma      = regla.fundamento_normativo ?? 'No especificado'

    mostrarToast(
      `Retención: Gestión ${gestion} años · Central ${central} años · ${disposicion}`,
      'success'
    )

  } catch (err) {
    console.error(err)
    mostrarToast('No fue posible generar la retención automática', 'error')
  }
}

// =====================================================
// MODAL DE CONFIRMACIÓN (reemplaza confirm() nativo)
// =====================================================

function confirmarAccion(mensaje) {
  return new Promise((resolve) => {

    const overlay = document.createElement('div')
    overlay.className = 'modal'
    overlay.innerHTML = `
      <div class="modal-content" style="max-width:420px;">
        <h3 style="margin:0 0 12px;">Confirmar acción</h3>
        <p style="margin:0 0 20px;font-size:14px;color:var(--color-text-muted);">${mensaje}</p>
        <div class="modal-actions">
          <button class="btn-secondary" id="btnCancelarConfirm">Cancelar</button>
          <button class="btn-primary" id="btnAceptarConfirm">Aceptar</button>
        </div>
      </div>
    `

    document.body.appendChild(overlay)

    document.getElementById('btnAceptarConfirm').addEventListener('click', () => {
      overlay.remove()
      resolve(true)
    })

    document.getElementById('btnCancelarConfirm').addEventListener('click', () => {
      overlay.remove()
      resolve(false)
    })

    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) { overlay.remove(); resolve(false) }
    })
  })
}

// =====================================================
// ✅ INCORPORAR A TRD OFICIAL
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
// TOAST
// =====================================================

function mostrarToast(mensaje, tipo = 'info') {

  const colores = {
    success : '#27ae60',
    error   : '#e74c3c',
    warning : '#f39c12',
    info    : '#2c7be5'
  }

  const toast = document.createElement('div')

  toast.textContent = mensaje

  Object.assign(toast.style, {
    position       : 'fixed',
    bottom         : '24px',
    right          : '24px',
    background     : colores[tipo] || colores.info,
    color          : 'white',
    padding        : '12px 20px',
    borderRadius   : '8px',
    fontSize       : '13px',
    fontWeight     : '500',
    zIndex         : '9999',
    boxShadow      : '0 4px 12px rgba(0,0,0,0.15)',
    maxWidth       : '360px',
    lineHeight     : '1.4',
    whiteSpace     : 'pre-line'
  })

  document.body.appendChild(toast)

  setTimeout(() => toast.remove(), 4000)
}