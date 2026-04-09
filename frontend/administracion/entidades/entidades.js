import { renderHeader } from '../../components/header.js'

const API = '/api/entidades'

let modoEdicion = false
let idEditando = null

let modal
let inputNombre
let form
let inputBuscar
let tabla

let entidadesCache = []

/* =========================================
   UTIL TOKEN
========================================= */

function getToken() {

  const token = sessionStorage.getItem('token')

  if (!token) {
    window.location.href = '/'
    throw new Error('Token no encontrado')
  }

  return token
}

/* =========================================
   INIT
========================================= */

document.addEventListener('DOMContentLoaded', async () => {

  console.log("entidades.js cargado")

  const token = sessionStorage.getItem('token')
  const userRaw = sessionStorage.getItem('user')

  if (!token || !userRaw) {
    window.location.href = '/'
    return
  }

  const user = JSON.parse(userRaw)
  const esMaster = user?.es_master_admin === true

  if (!esMaster) {
    alert('No autorizado')
    window.location.href = '/home/index.html'
    return
  }

  // Limpiar entidad gestionada al entrar a este módulo
  sessionStorage.removeItem('gestion_entidad_id')
  sessionStorage.removeItem('gestion_entidad_nombre')

  renderHeader('Administración')

  await new Promise(r => requestAnimationFrame(r))
  await new Promise(r => requestAnimationFrame(r))
  document.body.offsetHeight

  modal       = document.getElementById('modalEntidad')
  inputNombre = document.getElementById('inputNombre')
  form        = document.getElementById('formEntidad')
  inputBuscar = document.getElementById('inputBuscarEntidad')
  tabla       = document.getElementById('tablaEntidades')

  document.getElementById('btnNueva')
    .addEventListener('click', abrirModalNueva)

  document.getElementById('btnCancelar')
    .addEventListener('click', cerrarModal)

  form.addEventListener('submit', guardarEntidad)

  inputBuscar.addEventListener('input', filtrarEntidades)

  document.addEventListener('keydown', e => {
    if (e.key === 'Escape') cerrarModal()
  })

  tabla.addEventListener('click', manejarClicksTabla)

  document.addEventListener('click', (e) => {
    if (!e.target.closest('.acciones-menu')) {
      cerrarMenus()
    }
  })

  await cargarEntidades()
})

/* =========================================
   CARGAR ENTIDADES
========================================= */

async function cargarEntidades() {

  try {

    const res = await fetch(API, {
      headers: {
        'Authorization': `Bearer ${getToken()}`
      }
    })

    if (res.status === 401 || res.status === 403) {
      sessionStorage.removeItem('token')
      sessionStorage.removeItem('user')
      alert('Sesión expirada')
      window.location.href = '/'
      return
    }

    const data = await res.json()

    if (!res.ok) {
      alert(data.error || 'Error cargando entidades')
      return
    }

    entidadesCache = data.data || []

    renderTabla(entidadesCache)

  } catch (err) {

    console.error('Error cargando entidades:', err)
    alert('Error de conexión con el servidor')

  }
}

/* =========================================
   RENDER TABLA
========================================= */

function renderTabla(data) {

  const tbody = document.querySelector('#tablaEntidades tbody')
  tbody.innerHTML = ''

  data.forEach(ent => {

    const activa = ent.estado === true || ent.estado === 1

    const tr = document.createElement('tr')

    tr.innerHTML = `
      <td>${escapeHTML(ent.nombre)}</td>

      <td>
        <span class="${activa ? 'badge-aprobado' : 'badge-inactivo'}">
          ${activa ? 'Activa' : 'Inactiva'}
        </span>
      </td>

      <td>
        <div class="acciones-menu">

          <button class="btn-menu" data-menu="${ent.id}">
            ⋮
          </button>

          <div class="menu-dropdown" id="menu-${ent.id}">

            <button data-action="gestionar" data-id="${ent.id}" data-nombre="${escapeHTML(ent.nombre)}">
              Gestionar entidad
            </button>

            <button data-action="editar" data-id="${ent.id}" data-nombre="${escapeHTML(ent.nombre)}">
              Editar
            </button>

            <button data-action="toggle" data-id="${ent.id}" data-estado="${ent.estado}">
              ${activa ? 'Desactivar' : 'Activar'}
            </button>

          </div>

        </div>
      </td>
    `

    tbody.appendChild(tr)
  })
}

/* =========================================
   MENÚ Y ACCIONES
========================================= */

function manejarClicksTabla(e) {

  const btnMenu = e.target.closest('.btn-menu')
  if (btnMenu) {
    e.stopPropagation()
    const id = btnMenu.dataset.menu
    const menu = document.getElementById(`menu-${id}`)
    cerrarMenus()
    if (menu) menu.classList.toggle('show')
    return
  }

  const actionBtn = e.target.closest('[data-action]')
  if (!actionBtn) return

  cerrarMenus()

  const action = actionBtn.dataset.action
  const id     = actionBtn.dataset.id
  const nombre = actionBtn.dataset.nombre

  if (action === 'gestionar') {
    gestionarEntidad(id, nombre)
    return
  }

  if (action === 'editar') {
    editar(id, nombre)
    return
  }

  if (action === 'toggle') {
    const estado = actionBtn.dataset.estado
    toggleEstado(id, estado)
    return
  }
}

function cerrarMenus() {
  document.querySelectorAll('.menu-dropdown')
    .forEach(m => m.classList.remove('show'))
}

/* =========================================
   GESTIONAR ENTIDAD
   ✅ FIX: redirige a /home en lugar de /administracion
========================================= */

function gestionarEntidad(id, nombre) {

  sessionStorage.setItem('gestion_entidad_id', id)
  sessionStorage.setItem('gestion_entidad_nombre', nombre)

  // ✅ Va directo al panel principal con todos los módulos
  window.location.href = '/home/index.html'
}

/* =========================================
   BUSCAR
========================================= */

function filtrarEntidades() {

  const q = inputBuscar.value.toLowerCase()

  const filtradas = entidadesCache.filter(e =>
    e.nombre.toLowerCase().includes(q)
  )

  renderTabla(filtradas)
}

/* =========================================
   MODAL
========================================= */

function abrirModalNueva() {

  modoEdicion = false
  idEditando  = null

  document.getElementById('modalTitle').innerText = 'Nueva Entidad'

  inputNombre.value = ''

  modal.classList.remove('hidden')
}

function cerrarModal() {
  modal.classList.add('hidden')
}

/* =========================================
   EDITAR
========================================= */

function editar(id, nombre) {

  modoEdicion = true
  idEditando  = id

  document.getElementById('modalTitle').innerText = 'Editar Entidad'

  inputNombre.value = nombre

  modal.classList.remove('hidden')
}

/* =========================================
   GUARDAR
========================================= */

async function guardarEntidad(e) {

  e.preventDefault()

  try {

    const nombre = inputNombre.value.trim()

    if (!nombre) {
      alert('Nombre requerido')
      return
    }

    const url    = modoEdicion ? `${API}/${idEditando}` : API
    const method = modoEdicion ? 'PATCH' : 'POST'

    const res = await fetch(url, {
      method,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${getToken()}`
      },
      body: JSON.stringify({ nombre })
    })

    const data = await res.json()

    if (!res.ok) {
      alert(data.error || 'Error')
      return
    }

    cerrarModal()
    await cargarEntidades()

  } catch (err) {

    console.error(err)
    alert('Error guardando entidad')

  }
}

/* =========================================
   TOGGLE ESTADO
========================================= */

async function toggleEstado(id, estadoActual) {

  try {

    const nuevoEstado = (estadoActual === 'true' || estadoActual === '1') ? false : true

    const res = await fetch(`${API}/${id}/estado`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${getToken()}`
      },
      body: JSON.stringify({ estado: nuevoEstado })
    })

    const data = await res.json()

    if (!res.ok) {
      alert(data.error || 'Error')
      return
    }

    await cargarEntidades()

  } catch (err) {

    console.error(err)
    alert('Error actualizando estado')

  }
}

/* =========================================
   UTIL
========================================= */

function escapeHTML(text) {
  const div = document.createElement('div')
  div.innerText = text
  return div.innerHTML
}