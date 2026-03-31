import { renderHeader } from '../../components/header.js'

const API_URL = '/api/roles'

// 🔥 Contexto de gestión
let gestionEntidadId = null
let gestionEntidadNombre = null

function getToken() {
  return sessionStorage.getItem('token')
}

function getHeaders(extra = {}) {
  const headers = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${getToken()}`,
    ...extra
  }
  return headers // 🔥 roles ya NO dependen de entidad
}

let rolesCache = []

let inputBuscar

document.addEventListener('DOMContentLoaded', async () => {

  const token = getToken()
  if (!token) {
    window.location.href = '/'
    return
  }

  gestionEntidadId = sessionStorage.getItem('gestion_entidad_id') || null
  gestionEntidadNombre = sessionStorage.getItem('gestion_entidad_nombre') || null

  renderHeader('Administración', gestionEntidadNombre)

  await new Promise(r => requestAnimationFrame(r))
  await new Promise(r => requestAnimationFrame(r))
  document.body.offsetHeight

  inputBuscar = document.getElementById('inputBuscarRol')

  inputBuscar.addEventListener('input', filtrarRoles)

  await cargarRoles()
})

async function cargarRoles() {

  try {

    const res = await fetch(API_URL, { headers: getHeaders() })

    if (!res.ok) throw new Error('Error al cargar roles')

    const json = await res.json()
    const data = json.data ?? json

    if (!Array.isArray(data)) {
      console.error('Roles no es array', data)
      return
    }

    rolesCache = data.sort((a, b) => a.id - b.id)
    renderTabla(rolesCache)

  } catch (err) {
    console.error(err)
    alert('No fue posible cargar los roles.')
  }
}

function renderTabla(data) {

  const tbody = document.querySelector('#tablaRoles tbody')
  if (!tbody) return

  tbody.innerHTML = ''

  data.forEach(rol => {

    const tr = document.createElement('tr')

    tr.innerHTML = `
      <td>${rol.id}</td>
      <td>${escapeHTML(rol.nombre)}</td>
      <td>${rol.nivel_acceso ?? '-'}</td>
    `

    tbody.appendChild(tr)
  })
}

function filtrarRoles() {
  const q = inputBuscar.value.toLowerCase().trim()
  const filtrados = rolesCache.filter(r =>
    r.nombre.toLowerCase().includes(q)
  )
  renderTabla(filtrados)
}

function escapeHTML(text) {
  const div = document.createElement('div')
  div.innerText = text
  return div.innerHTML
}