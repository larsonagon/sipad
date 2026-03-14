import { renderHeader } from '../../components/header.js'

const API = '/api/dependencias'

let modoEdicion = false
let idEditando = null

let modal
let inputNombre
let form
let inputBuscar

let dependenciasCache = []

/* =========================================
   UTIL TOKEN
========================================= */

function getToken(){

  const token = localStorage.getItem('token')

  if(!token){
    window.location.href = '/'
    throw new Error('Token no encontrado')
  }

  return token
}


/* =========================================
   INIT
========================================= */

document.addEventListener('DOMContentLoaded', async () => {

  console.log("dependencias.js cargado")

  const token = localStorage.getItem('token')
  const userRaw = localStorage.getItem('user')

  if (!token || !userRaw) {
    window.location.href = '/'
    return
  }

  const user = JSON.parse(userRaw)

  // 🔥 FORZAR A NÚMERO
  const nivel = Number(user?.nivel_acceso ?? user?.nivel ?? 0)

  console.log("Usuario:", user)
  console.log("Nivel detectado:", nivel)

  if (nivel < 80) {
    alert('No autorizado')
    window.location.href = '/home/index.html'
    return
  }

  renderHeader('Administración')

  modal = document.getElementById('modal')
  inputNombre = document.getElementById('inputNombre')
  form = document.getElementById('formDependencia')
  inputBuscar = document.getElementById('inputBuscarDependencia')

  document.getElementById('btnNueva')
    .addEventListener('click', abrirModalNueva)

  document.getElementById('btnCancelar')
    .addEventListener('click', cerrarModal)

  form.addEventListener('submit', guardarDependencia)

  inputBuscar.addEventListener('input', filtrarDependencias)

  document.addEventListener('keydown', e => {
    if (e.key === 'Escape') cerrarModal()
  })

  document.addEventListener('click', cerrarMenus)

  await cargarDependencias()
})



/* =========================================
   CARGAR DEPENDENCIAS
========================================= */

async function cargarDependencias(){

  try{

    const res = await fetch(API,{
      headers:{
        'Authorization':`Bearer ${getToken()}`
      }
    })

    if(res.status === 401 || res.status === 403){
      localStorage.clear()
      alert('Sesión expirada')
      window.location.href = '/'
      return
    }

    const data = await res.json()

    if(!res.ok){
      alert(data.error || 'Error cargando dependencias')
      return
    }

    dependenciasCache = data.sort((a,b)=> a.id - b.id)

    renderTabla(dependenciasCache)

  }catch(err){

    console.error('Error cargando dependencias:',err)
    alert('Error de conexión con el servidor')

  }
}



/* =========================================
   RENDER TABLA
========================================= */

function renderTabla(data){

  const tbody = document.querySelector('#tablaDependencias tbody')
  tbody.innerHTML = ''

  data.forEach(dep => {

    const activa = dep.activa === 1

    const tr = document.createElement('tr')

    tr.innerHTML = `
      <td>${dep.id}</td>
      <td>${escapeHTML(dep.nombre)}</td>

      <td>
        <span class="${activa ? 'badge-aprobado' : 'badge-inactivo'}">
          ${activa ? 'Activa' : 'Inactiva'}
        </span>
      </td>

      <td>${formatearFecha(dep.created_at || dep.creado_en)}</td>

      <td>

        <div class="acciones-menu">

          <button class="btn-menu" data-menu="${dep.id}">
            ⋮
          </button>

          <div class="menu-dropdown" id="menu-${dep.id}">

            <button onclick="editar(${dep.id}, '${dep.nombre.replace(/'/g,"\\'")}')">
              Editar
            </button>

            <button onclick="toggleEstado(${dep.id}, ${activa})">
              ${activa ? 'Desactivar' : 'Activar'}
            </button>

          </div>

        </div>

      </td>
    `

    tbody.appendChild(tr)
  })

  activarMenus()
}



/* =========================================
   MENÚ ⋮
========================================= */

function activarMenus(){

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

function cerrarMenus(){

  document.querySelectorAll('.menu-dropdown')
    .forEach(m => m.classList.remove('show'))
}



/* =========================================
   BUSCAR
========================================= */

function filtrarDependencias(){

  const q = inputBuscar.value.toLowerCase()

  const filtradas = dependenciasCache.filter(d =>
    d.nombre.toLowerCase().includes(q)
  )

  renderTabla(filtradas)
}



/* =========================================
   MODAL
========================================= */

function abrirModalNueva(){

  modoEdicion = false
  idEditando = null

  document.getElementById('modalTitle').innerText = 'Nueva Dependencia'

  inputNombre.value = ''

  modal.classList.remove('hidden')
}

function cerrarModal(){

  modal.classList.add('hidden')
}



/* =========================================
   EDITAR
========================================= */

window.editar = function(id,nombre){

  modoEdicion = true
  idEditando = id

  document.getElementById('modalTitle').innerText = 'Editar Dependencia'

  inputNombre.value = nombre

  modal.classList.remove('hidden')
}



/* =========================================
   GUARDAR
========================================= */

async function guardarDependencia(e){

  e.preventDefault()

  try{

    const nombre = inputNombre.value.trim()

    if(!nombre){
      alert('Nombre requerido')
      return
    }

    const url = modoEdicion ? `${API}/${idEditando}` : API
    const method = modoEdicion ? 'PATCH' : 'POST'

    const res = await fetch(url,{
      method,
      headers:{
        'Content-Type':'application/json',
        'Authorization':`Bearer ${getToken()}`
      },
      body:JSON.stringify({nombre})
    })

    const data = await res.json()

    if(!res.ok){
      alert(data.error || 'Error')
      return
    }

    cerrarModal()

    await cargarDependencias()

  }catch(err){

    console.error(err)
    alert('Error guardando dependencia')

  }
}



/* =========================================
   ESTADO
========================================= */

window.toggleEstado = async function(id,activaActual){

  try{

    const res = await fetch(`${API}/${id}/estado`,{
      method:'PATCH',
      headers:{
        'Content-Type':'application/json',
        'Authorization':`Bearer ${getToken()}`
      },
      body:JSON.stringify({activa:activaActual ? 0 : 1})
    })

    const data = await res.json()

    if(!res.ok){
      alert(data.error || 'Error')
      return
    }

    await cargarDependencias()

  }catch(err){

    console.error(err)
    alert('Error actualizando estado')

  }
}



/* =========================================
   UTIL
========================================= */

function formatearFecha(fecha){

  if(!fecha) return '-'

  const f = new Date(fecha)

  if(isNaN(f.getTime())) return '-'

  const d = String(f.getDate()).padStart(2,'0')
  const m = String(f.getMonth()+1).padStart(2,'0')
  const a = f.getFullYear()

  return `${d}/${m}/${a}`
}

function escapeHTML(text){

  const div = document.createElement('div')
  div.innerText = text

  return div.innerHTML
}