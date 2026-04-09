import { renderHeader } from '../components/header.js'

document.addEventListener('DOMContentLoaded', async () => {

  const token = sessionStorage.getItem('token')

  if (!token) {
    window.location.href = '/'
    return
  }

  const gestionEntidadNombre = sessionStorage.getItem('gestion_entidad_nombre') || null
  renderHeader('TRD-AI', gestionEntidadNombre)

  document
    .getElementById('btnVerPropuestas')
    ?.addEventListener('click', () => {
      window.location.href = '/trd-ai/trd-ai-propuestas.html'
    })

  await cargarDashboard()

})

// ======================================================
// API FETCH
// ======================================================

async function apiFetch(url, options = {}) {

  const token = sessionStorage.getItem('token')

  const headers = {
    Authorization: `Bearer ${token}`,
    'Content-Type': 'application/json',
    ...(options.headers || {})
  }

  const entidadId =
    sessionStorage.getItem('gestion_entidad_id') ||
    sessionStorage.getItem('entidad_id') ||
    null

  if (entidadId) {
    headers['X-Entidad-Id'] = entidadId
  }

  const resp = await fetch(url, {
    ...options,
    headers
  })

  if (resp.status === 401) {
    sessionStorage.clear()
    window.location.href = '/'
    return null
  }

  return resp
}

// ======================================================
// CARGAR DASHBOARD
// ======================================================

async function cargarDashboard() {

  try {

    const resp = await apiFetch('/api/trd-ai/dashboard')

    if (!resp || !resp.ok)
      throw new Error('Error HTTP')

    const json = await resp.json()

    if (!json.ok)
      throw new Error(json.error)

    const data = json.data

    document.getElementById('kpiTotal').textContent =
      data.resumen.total_propuestas || 0

    document.getElementById('kpiAprobadas').textContent =
      data.resumen.aprobadas || 0

    document.getElementById('kpiRechazadas').textContent =
      data.resumen.rechazadas || 0

    document.getElementById('kpiPendientes').textContent =
      data.resumen.pendientes || 0

    renderUltimas(data.ultimas_aprobadas)

  } catch (error) {

    console.error('Error dashboard TRD-AI:', error)

  }

}

// ======================================================
// RENDER TABLA ÚLTIMAS
// ======================================================

function renderUltimas(series) {

  const tbody = document.getElementById('tablaRecientes')

  if (!series || !series.length) {
    tbody.innerHTML = '<tr><td colspan="2">No hay registros</td></tr>'
    return
  }

  tbody.innerHTML = series.map(s => `
    <tr>
      <td>${s.nombre_serie || '-'}</td>
      <td>${formatearFecha(s.fecha_aprobacion)}</td>
    </tr>
  `).join('')

}

// ======================================================
// UTILIDADES
// ======================================================

function formatearFecha(fecha) {
  if (!fecha) return '-'
  return new Date(fecha).toLocaleDateString('es-CO')
}