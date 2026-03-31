import { renderHeader } from '../../components/header.js'

const API = '/api/niveles'

let modoEdicion = false
let idEditando = null

let modal
let inputNombre
let form
let inputBuscar

let nivelesCache = []

// 🔥 Contexto de gestión
let gestionEntidadId = null
let gestionEntidadNombre = null

function getToken() {
  return sessionStorage.getItem('token')
}

function getHeaders(extra = {}) {
  const headers = {
    'Authorization': `Bearer ${getToken()}`,
    ...extra
  }
  if (gestionEntidadId) headers['X-Entidad-Id'] = gestionEntidadId
  return headers
}

document.addEventListener('DOMContentLoaded', async () => {

  gestionEntidadId = sessionStorage.getItem('gestion_entidad_id') || null
  gestionEntidadNombre = sessionStorage.getItem('gestion_entidad_nombre') || null

  renderHeader('Administración', gestionEntidadNombre)

  await new Promise(r => requestAnimationFrame(r))
  await new Promise(r => requestAnimationFrame(r))
  document.body.offsetHeight

  modal = document.getElementById('modal')
  inputNombre = document.getElementById('inputNombre')
  form = document.getElementById('formNivel')
  inputBuscar = document.getElementById('inputBuscarNivel')

  document.getElementById('btnNuevo').addEventListener('click', abrirModalNuevo)
  document.getElementById('btnCancelar').addEventListener('click', cerrarModal)
  form.addEventListener('submit', guardarNivel)
  inputBuscar.addEventListener('input', filtrarNiveles)

  document.addEventListener('keydown', e => {
    if (e.key === 'Escape') cerrarModal()
  })

  document.addEventListener('click', cerrarMenus)

  await cargarNiveles()
})

async function cargarNiveles() {

  try {

    const res = await fetch(API, {
      headers: getHeaders()
    })

    const json = await res.json()
    const data = json.data ?? json

    if (!Array.isArray(data)) {
      console.error('Niveles no es array', data)
      return
    }

    nivelesCache = data.sort((a, b) => a.id - b.id)
    renderTabla(nivelesCache)

  } catch (error) {
    console.error('Error cargando niveles:', error)
  }
}

function renderTabla(data) {

  const tbody = document.querySelector('#tablaNiveles tbody')
  tbody.innerHTML = ''

  data.forEach(nivel => {

    const activo = nivel.estado === 1
    const tr = document.createElement('tr')

    tr.innerHTML = `
      <td>${nivel.id}</td>
      <td>${escapeHTML(nivel.nombre)}</td>
      <td>
        <span class="${activo ? 'badge-aprobado' : 'badge-inactivo'}">
          ${activo ? 'Activo' : 'Inactivo'}
        </span>
      </td>
      <td>${formatearFecha(nivel.created_at)}</td>
      <td>
        <div class="acciones-menu">
          <button class="btn-menu" data-menu="${nivel.id}">⋮</button>
          <div class="menu-dropdown" id="menu-${nivel.id}">
            <button onclick="editar(${nivel.id},'${nivel.nombre.replace(/'/g, "\\'")}')">Editar</button>
            <button onclick="toggleEstado(${nivel.id},${activo})">${activo ? 'Desactivar' : 'Activar'}</button>
          </div>
        </div>
      </td>
    `

    tbody.appendChild(tr)
  })

  activarMenus()
}

function activarMenus() {
  document.querySelectorAll('.btn-menu').forEach(btn => {
    btn.addEventListener('click', e => {
      e.stopPropagation()
      const id = btn.dataset.menu
      const menu = document.getElementById(`menu-${id}`)
      cerrarMenus()
      menu.classList.toggle('show')
    })
  })
}

function cerrarMenus() {
  document.querySelectorAll('.menu-dropdown').forEach(m => m.classList.remove('show'))
}

function filtrarNiveles() {
  const q = inputBuscar.value.toLowerCase()
  const filtrados = nivelesCache.filter(n => n.nombre.toLowerCase().includes(q))
  renderTabla(filtrados)
}

function abrirModalNuevo() {
  modoEdicion = false
  idEditando = null
  document.getElementById('modalTitle').innerText = 'Nuevo Nivel'
  inputNombre.value = ''
  modal.classList.remove('hidden')
}

function cerrarModal() {
  modal.classList.add('hidden')
}

window.editar = function(id, nombre) {
  modoEdicion = true
  idEditando = id
  document.getElementById('modalTitle').innerText = 'Editar Nivel'
  inputNombre.value = nombre
  modal.classList.remove('hidden')
}

async function guardarNivel(e) {

  e.preventDefault()

  const nombre = inputNombre.value.trim()

  if (!nombre) {
    alert('Nombre obligatorio')
    return
  }

  const url = modoEdicion ? `${API}/${idEditando}` : API
  const method = modoEdicion ? 'PUT' : 'POST'

  try {
    await fetch(url, {
      method,
      headers: getHeaders({ 'Content-Type': 'application/json' }),
      body: JSON.stringify({ nombre })
    })

    cerrarModal()
    await cargarNiveles()

  } catch (error) {
    console.error('Error guardando nivel:', error)
  }
}

window.toggleEstado = async function(id, activoActual) {

  try {
    await fetch(`${API}/${id}/estado`, {
      method: 'PATCH',
      headers: getHeaders({ 'Content-Type': 'application/json' }),
      body: JSON.stringify({ estado: activoActual ? 0 : 1 })
    })

    await cargarNiveles()

  } catch (error) {
    console.error('Error cambiando estado:', error)
  }
}

function formatearFecha(fechaUTC) {
  if (!fechaUTC) return '-'
  return new Date(fechaUTC).toLocaleDateString('es-CO')
}

function escapeHTML(text) {
  const div = document.createElement('div')
  div.innerText = text
  return div.innerHTML
}