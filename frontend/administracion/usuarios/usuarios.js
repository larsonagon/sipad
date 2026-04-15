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

  const entidad =
    gestionEntidadId ||
    sessionStorage.getItem('gestion_entidad_id') ||
    sessionStorage.getItem('entidad_id')

  if (entidad) headers['X-Entidad-Id'] = entidad

  return headers
}

let usuariosCache = []

// ── Paginación y ordenamiento ─────────────────────────────
let datosActuales  = []
let paginaActual   = 1
let porPagina      = 10
let sortCol        = 'id'
let sortDir        = 'asc'
// ─────────────────────────────────────────────────────────

// ══════════════════════════════════════════════════════════
// MODAL – Apertura/cierre con inline styles (fix Chrome)
// ══════════════════════════════════════════════════════════

function mostrarModal() {
  const modal = document.getElementById('modalUsuario')
  if (!modal) return
  modal.classList.remove('hidden')
  modal.style.cssText = `
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    background: rgba(0,0,0,.45);
    z-index: 9999;
    padding: 20px;
    box-sizing: border-box;
  `
}

function ocultarModal() {
  const modal = document.getElementById('modalUsuario')
  if (!modal) return
  modal.classList.add('hidden')
  modal.style.cssText = 'display:none;'
}

// ══════════════════════════════════════════════════════════

document.addEventListener('DOMContentLoaded', async () => {

  const token = getToken()
  if (!token) {
    window.location.href = '/'
    return
  }

  gestionEntidadId =
    sessionStorage.getItem('gestion_entidad_id') ||
    sessionStorage.getItem('entidad_id') ||
    null

  gestionEntidadNombre = sessionStorage.getItem('gestion_entidad_nombre') || null

  renderHeader('Administración', gestionEntidadNombre)

  await new Promise(r => requestAnimationFrame(r))
  await new Promise(r => requestAnimationFrame(r))
  document.body.offsetHeight

  _setupTableUI()

  await cargarUsuarios()
  await cargarRoles()
  await cargarDependencias()
  await cargarCargos()
  await cargarNiveles()

  document.getElementById('btnNuevoUsuario')?.addEventListener('click', abrirModalNuevo)
  document.getElementById('btnCancelar')?.addEventListener('click', cerrarModal)
  document.getElementById('formUsuario')?.addEventListener('submit', guardarUsuario)
  document.getElementById('inputBuscarUsuario')?.addEventListener('input', filtrarUsuarios)

  // cerrar modal al hacer clic en el fondo oscuro
  document.getElementById('modalUsuario')?.addEventListener('click', e => {
    if (e.target === e.currentTarget) cerrarModal()
  })

  document.addEventListener('click', e => {
    if (!e.target.closest('.acciones-menu')) {
      document.querySelectorAll('.menu-dropdown').forEach(m => m.classList.remove('show'))
    }
  })

  // ── Ordenamiento por columna ──────────────────────────────
  document.querySelectorAll('#tablaUsuarios thead th[data-sort]').forEach(th => {
    th.style.cursor = 'pointer'
    th.addEventListener('click', () => {
      const col = th.dataset.sort
      if (sortCol === col) {
        sortDir = sortDir === 'asc' ? 'desc' : 'asc'
      } else {
        sortCol = col
        sortDir = 'asc'
      }
      paginaActual = 1
      _actualizarIconosSort()
      renderTabla(datosActuales)
    })
  })
})

// ── Setup inicial de la UI de la tabla ───────────────────────────────────────
function _setupTableUI() {

  const tabla = document.getElementById('tablaUsuarios')
  if (tabla && !tabla.parentElement.classList.contains('tabla-scroll-wrap')) {
    const wrap = document.createElement('div')
    wrap.className = 'tabla-scroll-wrap'
    wrap.style.cssText = 'overflow-x:auto; overflow-y:visible; width:100%;'
    tabla.parentNode.insertBefore(wrap, tabla)
    wrap.appendChild(tabla)
  }

  const colMap = ['id','nombre_completo','username','email','cargo','nivel','dependencia','estado','bloqueado']
  document.querySelectorAll('#tablaUsuarios thead th').forEach((th, i) => {
    if (colMap[i]) {
      th.dataset.sort = colMap[i]
      th.innerHTML += ' <span class="sort-icono" style="font-size:10px;opacity:.5;user-select:none;">↕</span>'
    }
  })

  const section = document.querySelector('#tablaUsuarios')?.closest('section')
  if (section) {
    const barraInferior = document.createElement('div')
    barraInferior.id = 'barraTablaInferior'
    barraInferior.style.cssText = 'display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:8px;margin-top:12px;'

    barraInferior.innerHTML = `
      <div style="display:flex;align-items:center;gap:8px;">
        <label for="selectPorPagina" style="font-size:13px;color:var(--color-muted,#666);">Mostrar</label>
        <select id="selectPorPagina" class="input-search" style="width:auto;padding:4px 8px;font-size:13px;">
          <option value="5">5</option>
          <option value="10" selected>10</option>
          <option value="20">20</option>
          <option value="50">50</option>
          <option value="100">100</option>
        </select>
        <span style="font-size:13px;color:var(--color-muted,#666);">por página</span>
      </div>
      <div id="infoPaginacion" style="font-size:13px;color:var(--color-muted,#666);"></div>
      <div id="contenedorPaginacion" style="display:flex;gap:4px;flex-wrap:wrap;"></div>
    `
    section.appendChild(barraInferior)

    document.getElementById('selectPorPagina').addEventListener('change', e => {
      porPagina = parseInt(e.target.value)
      paginaActual = 1
      renderTabla(datosActuales)
    })
  }
}

function _actualizarIconosSort() {
  document.querySelectorAll('#tablaUsuarios thead th[data-sort]').forEach(th => {
    const icono = th.querySelector('.sort-icono')
    if (!icono) return
    if (th.dataset.sort === sortCol) {
      icono.textContent = sortDir === 'asc' ? ' ↑' : ' ↓'
      icono.style.opacity = '1'
    } else {
      icono.textContent = ' ↕'
      icono.style.opacity = '0.4'
    }
  })
}

function _ordenar(arr) {
  return [...arr].sort((a, b) => {
    let av = a[sortCol] ?? ''
    let bv = b[sortCol] ?? ''
    if (typeof av === 'number' && typeof bv === 'number') {
      return sortDir === 'asc' ? av - bv : bv - av
    }
    av = String(av).toLowerCase()
    bv = String(bv).toLowerCase()
    return sortDir === 'asc' ? av.localeCompare(bv) : bv.localeCompare(av)
  })
}

function _renderPaginacion(total) {
  const totalPaginas = Math.max(1, Math.ceil(total / porPagina))
  if (paginaActual > totalPaginas) paginaActual = totalPaginas

  const inicio = (paginaActual - 1) * porPagina + 1
  const fin    = Math.min(paginaActual * porPagina, total)

  const info = document.getElementById('infoPaginacion')
  if (info) {
    info.textContent = total === 0
      ? 'Sin resultados'
      : `Mostrando ${inicio}–${fin} de ${total} usuario${total !== 1 ? 's' : ''}`
  }

  const cont = document.getElementById('contenedorPaginacion')
  if (!cont) return

  const btnStyle = (activo) =>
    `style="min-width:30px;height:28px;padding:0 6px;font-size:12px;border:1px solid ${activo ? '#555' : '#ccc'};border-radius:4px;background:${activo ? '#f0f0f0' : 'transparent'};cursor:pointer;font-weight:${activo ? '600' : '400'}"`

  let html = `<button ${btnStyle(false)} ${paginaActual <= 1 ? 'disabled' : ''} onclick="window._irPagina(${paginaActual - 1})">‹</button>`

  let desde = Math.max(1, paginaActual - 2)
  let hasta  = Math.min(totalPaginas, paginaActual + 2)
  if (desde > 1)           html += `<button ${btnStyle(false)} onclick="window._irPagina(1)">1</button>${desde > 2 ? '<span style="padding:0 2px;font-size:12px;">…</span>' : ''}`
  for (let i = desde; i <= hasta; i++) {
    html += `<button ${btnStyle(i === paginaActual)} onclick="window._irPagina(${i})">${i}</button>`
  }
  if (hasta < totalPaginas) html += `${hasta < totalPaginas - 1 ? '<span style="padding:0 2px;font-size:12px;">…</span>' : ''}<button ${btnStyle(false)} onclick="window._irPagina(${totalPaginas})">${totalPaginas}</button>`

  html += `<button ${btnStyle(false)} ${paginaActual >= totalPaginas ? 'disabled' : ''} onclick="window._irPagina(${paginaActual + 1})">›</button>`

  cont.innerHTML = html
}

window._irPagina = function(p) {
  paginaActual = p
  renderTabla(datosActuales)
  document.getElementById('tablaUsuarios')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
}

// ── Cargar usuarios desde la API ─────────────────────────────────────────────
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

  datosActuales = data

  const ordenados = _ordenar(datosActuales)

  const totalPaginas = Math.max(1, Math.ceil(ordenados.length / porPagina))
  if (paginaActual > totalPaginas) paginaActual = totalPaginas
  const inicio = (paginaActual - 1) * porPagina
  const slice  = ordenados.slice(inicio, inicio + porPagina)

  if (slice.length === 0) {
    tbody.innerHTML = `<tr><td colspan="10" style="text-align:center;padding:2rem;color:#888;">No se encontraron usuarios.</td></tr>`
  } else {
    slice.forEach(u => {
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

  _renderPaginacion(ordenados.length)
  _actualizarIconosSort()
}

function filtrarUsuarios(e) {
  const texto = e.target.value.toLowerCase()
  paginaActual = 1
  const filtrados = usuariosCache.filter(u =>
    (u.nombre_completo ?? '').toLowerCase().includes(texto) ||
    (u.username ?? '').toLowerCase().includes(texto) ||
    (u.email ?? '').toLowerCase().includes(texto)
  )
  renderTabla(filtrados)
}

window.toggleMenu = function(id) {
  const menu = document.getElementById(`menu-${id}`)
  document.querySelectorAll('.menu-dropdown').forEach(m => {
    if (m !== menu) m.classList.remove('show')
  })
  if (menu) menu.classList.toggle('show')
}

// ── Cargar selects del modal ──────────────────────────────────────────────────
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

// ── Modal: nuevo usuario ──────────────────────────────────────────────────────
function abrirModalNuevo() {
  document.getElementById('modalTitle').textContent = 'Nuevo Usuario'
  document.getElementById('formUsuario').reset()
  document.getElementById('inputUsuarioId').value = ''
  document.getElementById('grupoEstado').style.display = 'none'
  document.getElementById('grupoBloqueado').style.display = 'none'
  document.getElementById('inputNombre').disabled = false
  document.getElementById('inputDocumento').disabled = false
  document.getElementById('inputUsername').disabled = false
  mostrarModal()
}

function cerrarModal() {
  ocultarModal()
  document.getElementById('formUsuario').reset()
}

// ── Modal: editar usuario ─────────────────────────────────────────────────────
window.editarUsuario = async function(id) {
  try {
    const res = await fetch(`/api/usuarios/${id}`, { headers: getHeaders() })
    const json = await res.json()

    if (!res.ok) {
      alert(json.error || 'Error cargando usuario')
      return
    }

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
    mostrarModal()
  } catch (err) {
    console.error('Error cargando usuario', err)
    alert('No fue posible cargar el usuario.')
  }
}

// ── Guardar usuario (POST / PUT) ──────────────────────────────────────────────
async function guardarUsuario(e) {

  e.preventDefault()

  const id       = document.getElementById('inputUsuarioId').value
  const password = document.getElementById('inputPassword').value
  const confirm  = document.getElementById('inputPasswordConfirm').value

  if (password || confirm) {
    if (password !== confirm) {
      alert('Las contraseñas no coinciden')
      return
    }
  }

  const toInt = v => v ? parseInt(v) : null

  let payload = {
    email:          document.getElementById('inputEmail').value,
    id_rol:         toInt(document.getElementById('selectRol').value),
    id_dependencia: toInt(document.getElementById('selectDependencia').value),
    id_cargo:       toInt(document.getElementById('selectCargo').value),
    id_nivel:       toInt(document.getElementById('selectNivel').value),
    estado:         document.getElementById('checkEstado').checked ? 1 : 0,
    bloqueado:      document.getElementById('checkBloqueado').checked ? 1 : 0,
    password
  }

  let url    = '/api/usuarios'
  let method = 'POST'

  if (id) {
    url    = `/api/usuarios/${id}`
    method = 'PUT'
  } else {
    payload = {
      nombre_completo: document.getElementById('inputNombre').value,
      documento:       document.getElementById('inputDocumento').value,
      email:           document.getElementById('inputEmail').value,
      username:        document.getElementById('inputUsername').value,
      password,
      id_rol:          toInt(document.getElementById('selectRol').value),
      id_dependencia:  toInt(document.getElementById('selectDependencia').value),
      id_cargo:        toInt(document.getElementById('selectCargo').value),
      id_nivel:        toInt(document.getElementById('selectNivel').value)
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