import { renderHeader } from '../../components/header.js'

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

  // 🔥 FIX (NO ROMPE NADA)
  const entidad =
    gestionEntidadId ||
    sessionStorage.getItem('entidad_id') ||
    sessionStorage.getItem('gestion_entidad_id')

  if (entidad) headers['X-Entidad-Id'] = entidad

  return headers
}

let usuariosCache = []

document.addEventListener('DOMContentLoaded', async () => {

  const token = getToken()
  if (!token) {
    window.location.href = '/'
    return
  }

  // 🔥 FIX AQUÍ (CLAVE)
  gestionEntidadId =
    sessionStorage.getItem('entidad_id') ||
    sessionStorage.getItem('gestion_entidad_id') ||
    null

  gestionEntidadNombre = sessionStorage.getItem('gestion_entidad_nombre') || null

  renderHeader('Administración', gestionEntidadNombre)

  await new Promise(r => requestAnimationFrame(r))
  await new Promise(r => requestAnimationFrame(r))
  document.body.offsetHeight

  await cargarUsuarios()
  await cargarRoles()
  await cargarDependencias()
  await cargarCargos()
  await cargarNiveles()

  document.getElementById('btnNuevoUsuario')?.addEventListener('click', abrirModalNuevo)
  document.getElementById('btnCancelar')?.addEventListener('click', cerrarModal)
  document.getElementById('formUsuario')?.addEventListener('submit', guardarUsuario)
  document.getElementById('inputBuscarUsuario')?.addEventListener('input', filtrarUsuarios)

  document.addEventListener('click', e => {
    if (!e.target.closest('.acciones-menu')) {
      document.querySelectorAll('.menu-dropdown').forEach(m => m.classList.remove('show'))
    }
  })
})

async function cargarUsuarios() {

  try {

    const res = await fetch('/api/usuarios', { headers: getHeaders() })

    if (!res.ok) throw new Error('Error cargando usuarios')

    const json = await res.json()
    const data = json.data ?? json

    if (!Array.isArray(data)) {
      console.error('Usuarios no es array:', data)
      usuariosCache = []
      renderTabla([])
      return
    }

    usuariosCache = data
    renderTabla(data)

  } catch (err) {
    console.error('Error cargando usuarios', err)
    renderTabla([])
  }
}

function renderTabla(data) {

  const tbody = document.querySelector('#tablaUsuarios tbody')
  if (!tbody) return

  tbody.innerHTML = ''
  if (!Array.isArray(data)) return

  data.sort((a, b) => a.id - b.id)

  data.forEach(u => {

    const tr = document.createElement('tr')

    tr.innerHTML = `
      <td>${u.id ?? ''}</td>
      <td>${u.nombre_completo ?? ''}</td>
      <td>${u.username ?? ''}</td>
      <td>${u.email ?? ''}</td>
      <td>${u.cargo ?? '-'}</td>
      <td>${u.nivel ?? '-'}</td>
      <td>${u.dependencia ?? '-'}</td>
      <td>${u.estado === 1 ? '<span class="badge-success">Activo</span>' : '<span class="badge-danger">Inactivo</span>'}</td>
      <td>${u.bloqueado === 1 ? '<span class="badge-danger">Sí</span>' : '<span class="badge-success">No</span>'}</td>
      <td>
        <div class="acciones-menu">
          <button class="btn-menu" onclick="toggleMenu(${u.id})">⋮</button>
          <div class="menu-dropdown" id="menu-${u.id}">
            <button onclick="editarUsuario(${u.id})">Editar</button>
            <button onclick="resetPassword(${u.id})">Reset password</button>
            <button onclick="toggleEstado(${u.id})">${u.estado === 1 ? 'Desactivar' : 'Activar'}</button>
            <button onclick="toggleBloqueo(${u.id})">${u.bloqueado === 1 ? 'Desbloquear' : 'Bloquear'}</button>
          </div>
        </div>
      </td>
    `

    tbody.appendChild(tr)
  })
}

window.toggleMenu = function(id) {
  const menu = document.getElementById(`menu-${id}`)
  document.querySelectorAll('.menu-dropdown').forEach(m => {
    if (m !== menu) m.classList.remove('show')
  })
  if (menu) menu.classList.toggle('show')
}

function filtrarUsuarios(e) {
  const texto = e.target.value.toLowerCase()
  const filtrados = usuariosCache.filter(u =>
    (u.nombre_completo ?? '').toLowerCase().includes(texto) ||
    (u.username ?? '').toLowerCase().includes(texto) ||
    (u.email ?? '').toLowerCase().includes(texto)
  )
  renderTabla(filtrados)
}

async function cargarRoles() {
  try {
    const res = await fetch('/api/roles', { headers: getHeaders() })
    const json = await res.json()
    const roles = json.data ?? json
    const select = document.getElementById('selectRol')
    if (!select) return
    select.innerHTML = '<option value="">Seleccione</option>'
    roles.filter(r => r.activo === 1).forEach(r => {
      const opt = document.createElement('option')
      opt.value = r.id
      opt.textContent = r.nombre
      select.appendChild(opt)
    })
  } catch (err) {
    console.error('Error cargando roles', err)
  }
}

async function cargarDependencias() {
  try {
    const res = await fetch('/api/dependencias', { headers: getHeaders() })
    const json = await res.json()
    const deps = json.data ?? json
    const select = document.getElementById('selectDependencia')
    if (!select) return
    select.innerHTML = '<option value="">Seleccione</option>'
    deps.filter(d => d.activa === 1).forEach(d => {
      const opt = document.createElement('option')
      opt.value = d.id
      opt.textContent = d.nombre
      select.appendChild(opt)
    })
  } catch (err) {
    console.error('Error cargando dependencias', err)
  }
}

async function cargarCargos() {
  try {
    const res = await fetch('/api/cargos', { headers: getHeaders() })
    const json = await res.json()
    const cargos = json.data ?? json
    const select = document.getElementById('selectCargo')
    if (!select) return
    select.innerHTML = '<option value="">Seleccione</option>'
    cargos.filter(c => c.estado === 1).forEach(c => {
      const opt = document.createElement('option')
      opt.value = c.id
      opt.textContent = c.nombre
      select.appendChild(opt)
    })
  } catch (err) {
    console.error('Error cargando cargos', err)
  }
}

async function cargarNiveles() {
  try {
    const res = await fetch('/api/niveles', { headers: getHeaders() })
    const json = await res.json()
    const niveles = json.data ?? json
    const select = document.getElementById('selectNivel')
    if (!select) return
    select.innerHTML = '<option value="">Seleccione</option>'
    niveles.filter(n => n.estado === 1).forEach(n => {
      const opt = document.createElement('option')
      opt.value = n.id
      opt.textContent = n.nombre
      select.appendChild(opt)
    })
  } catch (err) {
    console.error('Error cargando niveles', err)
  }
}

function abrirModalNuevo() {
  document.getElementById('modalTitle').textContent = 'Nuevo Usuario'
  document.getElementById('formUsuario').reset()
  document.getElementById('inputUsuarioId').value = ''
  document.getElementById('grupoEstado').style.display = 'none'
  document.getElementById('grupoBloqueado').style.display = 'none'
  document.getElementById('inputNombre').disabled = false
  document.getElementById('inputDocumento').disabled = false
  document.getElementById('inputUsername').disabled = false
  document.getElementById('modalUsuario').classList.remove('hidden')
}

function cerrarModal() {
  document.getElementById('modalUsuario').classList.add('hidden')
  document.getElementById('formUsuario').reset()
}

window.editarUsuario = async function(id) {
  try {
    const res = await fetch(`/api/usuarios/${id}`, { headers: getHeaders() })
    const json = await res.json()
    const u = json.data ?? json

    document.getElementById('modalTitle').textContent = 'Editar Usuario'
    document.getElementById('grupoEstado').style.display = 'block'
    document.getElementById('grupoBloqueado').style.display = 'block'
    document.getElementById('inputUsuarioId').value = u.id
    document.getElementById('inputNombre').value = u.nombre_completo
    document.getElementById('inputDocumento').value = u.documento
    document.getElementById('inputUsername').value = u.username
    document.getElementById('inputEmail').value = u.email
    document.getElementById('selectRol').value = u.id_rol
    document.getElementById('selectDependencia').value = u.id_dependencia
    document.getElementById('selectCargo').value = u.id_cargo
    document.getElementById('selectNivel').value = u.id_nivel
    document.getElementById('checkEstado').checked = u.estado === 1
    document.getElementById('checkBloqueado').checked = u.bloqueado === 1
    document.getElementById('inputNombre').disabled = true
    document.getElementById('inputDocumento').disabled = true
    document.getElementById('inputUsername').disabled = true
    document.getElementById('modalUsuario').classList.remove('hidden')
  } catch (err) {
    console.error('Error cargando usuario', err)
  }
}

async function guardarUsuario(e) {

  e.preventDefault()

  const id = document.getElementById('inputUsuarioId').value
  const password = document.getElementById('inputPassword').value
  const confirm = document.getElementById('inputPasswordConfirm').value

  if (password || confirm) {
    if (password !== confirm) {
      alert('Las contraseñas no coinciden')
      return
    }
  }

  const toInt = v => v ? parseInt(v) : null

  let payload = {
    email: document.getElementById('inputEmail').value,
    id_rol: toInt(document.getElementById('selectRol').value),
    id_dependencia: toInt(document.getElementById('selectDependencia').value),
    id_cargo: toInt(document.getElementById('selectCargo').value),
    id_nivel: toInt(document.getElementById('selectNivel').value),
    estado: document.getElementById('checkEstado').checked ? 1 : 0,
    bloqueado: document.getElementById('checkBloqueado').checked ? 1 : 0,
    password
  }

  let url = '/api/usuarios'
  let method = 'POST'

  if (id) {
    url = `/api/usuarios/${id}`
    method = 'PUT'
  } else {
    payload = {
      nombre_completo: document.getElementById('inputNombre').value,
      documento: document.getElementById('inputDocumento').value,
      email: document.getElementById('inputEmail').value,
      username: document.getElementById('inputUsername').value,
      password,
      id_rol: toInt(document.getElementById('selectRol').value),
      id_dependencia: toInt(document.getElementById('selectDependencia').value),
      id_cargo: toInt(document.getElementById('selectCargo').value),
      id_nivel: toInt(document.getElementById('selectNivel').value)
    }
  }

  try {

    const res = await fetch(url, {
      method,
      headers: getHeaders({ 'Content-Type': 'application/json' }),
      body: JSON.stringify(payload)
    })

    if (!res.ok) {
      const err = await res.json()
      alert(err.error || 'Error guardando usuario')
      return
    }

    cerrarModal()
    await cargarUsuarios()

  } catch (err) {
    console.error(err)
    alert('No fue posible guardar el usuario.')
  }
} 