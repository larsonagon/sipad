import { renderHeader } from '../../components/header.js'

const API_URL = '/api/roles'
const token = localStorage.getItem('token')

if (!token) {
  window.location.href = '/'
}

let rolesCache = []
let editandoId = null

let modal
let modalTitle
let formRol
let inputNombre
let inputDescripcion
let inputBuscar

document.addEventListener('DOMContentLoaded', async () => {

  renderHeader('Administración')

  modal = document.getElementById('modal')
  modalTitle = document.getElementById('modalTitle')
  formRol = document.getElementById('formRol')
  inputNombre = document.getElementById('inputNombre')
  inputDescripcion = document.getElementById('inputDescripcion')
  inputBuscar = document.getElementById('inputBuscarRol')

  document
    .getElementById('btnNuevo')
    .addEventListener('click', () => abrirModal('Nuevo Rol'))

  document
    .getElementById('btnCancelar')
    .addEventListener('click', cerrarModal)

  formRol.addEventListener('submit', guardarRol)

  inputBuscar.addEventListener('input', filtrarRoles)

  document.addEventListener('keydown', e=>{
    if(e.key === 'Escape') cerrarModal()
  })

  document.addEventListener('click', cerrarMenus)

  await cargarRoles()

})



/* =========================================
   HEADERS AUTH
========================================= */

function authHeaders(){
  return {
    'Content-Type':'application/json',
    'Authorization':`Bearer ${token}`
  }
}



/* =========================================
   CARGAR ROLES
========================================= */

async function cargarRoles(){

  try{

    const res = await fetch(API_URL,{
      headers:authHeaders()
    })

    if(!res.ok){
      throw new Error('Error al cargar roles')
    }

    const json = await res.json()
    const data = json.data ?? json

    if(!Array.isArray(data)){
      console.error('Roles no es array',data)
      return
    }

    rolesCache = data.sort((a,b)=>a.id-b.id)

    renderTabla(rolesCache)

  }catch(err){

    console.error(err)
    alert('No fue posible cargar los roles.')

  }

}



/* =========================================
   RENDER TABLA
========================================= */

function renderTabla(data){

  const tbody = document.querySelector('#tablaRoles tbody')

  if(!tbody) return

  tbody.innerHTML=''

  data.forEach(rol=>{

    const activo = rol.activo === 1

    const tr = document.createElement('tr')

    tr.innerHTML = `

      <td>${rol.id}</td>

      <td>${escapeHTML(rol.nombre)}</td>

      <td>${escapeHTML(rol.descripcion ?? '')}</td>

      <td>
        <span class="${activo ? 'badge-aprobado' : 'badge-inactivo'}">
          ${activo ? 'Activo' : 'Inactivo'}
        </span>
      </td>

      <td>${formatearFecha(rol.created_at)}</td>

      <td>

        <div class="acciones-menu">

          <button class="btn-menu" data-menu="${rol.id}">
            ⋮
          </button>

          <div class="menu-dropdown" id="menu-${rol.id}">

            <button onclick="editarRol(${rol.id})">
              Editar
            </button>

            <button onclick="toggleEstado(${rol.id},${activo})">
              ${activo ? 'Desactivar' : 'Activar'}
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
   MENÚ ACCIONES
========================================= */

function activarMenus(){

  document.querySelectorAll('.btn-menu').forEach(btn=>{

    btn.onclick = e => {

      e.stopPropagation()

      const id = btn.dataset.menu
      const menu = document.getElementById(`menu-${id}`)

      if(!menu) return

      cerrarMenus()

      menu.classList.toggle('show')

    }

  })

}

function cerrarMenus(){

  document
    .querySelectorAll('.menu-dropdown')
    .forEach(m=>m.classList.remove('show'))

}



/* =========================================
   BUSCAR
========================================= */

function filtrarRoles(){

  const q = inputBuscar.value.toLowerCase().trim()

  const filtrados = rolesCache.filter(r=>
    r.nombre.toLowerCase().includes(q) ||
    (r.descripcion ?? '').toLowerCase().includes(q)
  )

  renderTabla(filtrados)

}



/* =========================================
   MODAL
========================================= */

function abrirModal(titulo){

  modalTitle.textContent = titulo
  modal.classList.remove('hidden')

}

function cerrarModal(){

  modal.classList.add('hidden')
  formRol.reset()
  editandoId = null

}



/* =========================================
   EDITAR
========================================= */

window.editarRol = function(id){

  const rol = rolesCache.find(r=>r.id == id)

  if(!rol) return

  editandoId = id

  inputNombre.value = rol.nombre
  inputDescripcion.value = rol.descripcion ?? ''

  abrirModal('Editar Rol')

}



/* =========================================
   GUARDAR
========================================= */

async function guardarRol(e){

  e.preventDefault()

  const payload = {
    nombre:inputNombre.value.trim(),
    descripcion:inputDescripcion.value.trim()
  }

  if(!payload.nombre){
    alert('Nombre obligatorio')
    return
  }

  try{

    if(editandoId){

      await fetch(`${API_URL}/${editandoId}`,{
        method:'PATCH',
        headers:authHeaders(),
        body:JSON.stringify(payload)
      })

    }else{

      await fetch(API_URL,{
        method:'POST',
        headers:authHeaders(),
        body:JSON.stringify(payload)
      })

    }

    cerrarModal()

    await cargarRoles()

  }catch(err){

    console.error(err)
    alert('No fue posible guardar el rol.')

  }

}



/* =========================================
   ESTADO
========================================= */

window.toggleEstado = async function(id,activoActual){

  try{

    await fetch(`${API_URL}/${id}/estado`,{
      method:'PATCH',
      headers:authHeaders(),
      body:JSON.stringify({
        activo:activoActual ? 0 : 1
      })
    })

    await cargarRoles()

  }catch(err){

    console.error(err)
    alert('No fue posible cambiar el estado.')

  }

}



/* =========================================
   UTILIDADES
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