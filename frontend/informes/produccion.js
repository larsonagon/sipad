import { renderHeader } from '../components/header.js'

function getToken() {
  return sessionStorage.getItem('token')
}

function getUserFromToken() {
  const token = getToken()
  if (!token) return null
  try {
    return JSON.parse(atob(token.split('.')[1]))
  } catch {
    return null
  }
}

function esMasterAdmin() {
  const token = getToken()
  if (!token) return false
  try {
    const p = JSON.parse(atob(token.split('.')[1]))
    return p.es_master_admin === true || p.es_master_admin === 1
  } catch { return false }
}

async function apiFetch(url) {

  const token = getToken()

  const headers = {
    Authorization: `Bearer ${token}`,
    'Content-Type': 'application/json'
  }

  if (esMasterAdmin()) {
    const entidadId =
      sessionStorage.getItem('gestion_entidad_id') ||
      sessionStorage.getItem('entidad_id') ||
      null
    if (entidadId) headers['X-Entidad-Id'] = entidadId
  }

  const res = await fetch(url, { headers })

  if (res.status === 401) {
    sessionStorage.clear()
    window.location.href = '/'
    return null
  }

  if (!res.ok) {
    const text = await res.text()
    throw new Error(text || 'Error en API')
  }

  return res.json()
}

document.addEventListener('DOMContentLoaded', async () => {

  const token = getToken()
  if (!token) { window.location.href = '/'; return }

  const user = getUserFromToken()
  if (!user) { window.location.href = '/'; return }

  renderHeader('Informes')

  await cargarDependencias()

  document
    .getElementById('btnConsultar')
    .addEventListener('click', consultar)
})

async function cargarDependencias() {

  const select = document.getElementById('dependencia')
  select.innerHTML = '<option value="">Todas</option>'

  try {
    const json = await apiFetch('/api/dependencias')
    if (!json) return
    const dependencias = json.data || json
    dependencias.forEach(dep => {
      const option = document.createElement('option')
      option.value = dep.id
      option.textContent = dep.nombre
      select.appendChild(option)
    })
  } catch (error) {
    console.error('Error cargando dependencias:', error)
  }
}

async function consultar() {

  const dependencia = document.getElementById('dependencia').value
  const params = new URLSearchParams()

  if (dependencia) {
    params.append('dependencia', dependencia)
  }

  try {
    const json = await apiFetch(`/api/informes/produccion-documental?${params.toString()}`)
    if (!json) return
    const data = json.data || []
    renderTabla(data)
  } catch (error) {
    console.error('Error generando informe:', error)
    const tbody = document.querySelector('#tablaResultados tbody')
    tbody.innerHTML = `<tr><td colspan="7">Error generando informe</td></tr>`
  }
}

function renderTabla(data) {

  const tbody = document.querySelector('#tablaResultados tbody')
  tbody.innerHTML = ''

  if (!data.length) {
    tbody.innerHTML = `<tr><td colspan="7">Sin resultados</td></tr>`
    return
  }

  data.forEach(row => {
    const tr = document.createElement('tr')
    tr.innerHTML = `
      <td>${row.actividad || '-'}</td>
      <td>${row.dependencia || '-'}</td>
      <td>${row.documentos_generados || '-'}</td>
      <td class="text-center">${row.total_tipos_documentales || 0}</td>
      <td>${row.formato || '-'}</td>
      <td>${row.volumen || '-'}</td>
      <td>${row.frecuencia || '-'}</td>
    `
    tbody.appendChild(tr)
  })
}