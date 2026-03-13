import { renderHeader } from '../../components/header.js'

const API = '/api/cargos'

let modoEdicion = false
let idEditando = null

let modal
let inputNombre
let form
let inputBuscar

let cargosCache = []

document.addEventListener('DOMContentLoaded', async () => {

  renderHeader('Administración')

  modal = document.getElementById('modal')
  inputNombre = document.getElementById('inputNombre')
  form = document.getElementById('formCargo')
  inputBuscar = document.getElementById('inputBuscarCargo')

  document.getElementById('btnNuevo')
    .addEventListener('click', abrirModalNuevo)

  document.getElementById('btnCancelar')
    .addEventListener('click', cerrarModal)

  form.addEventListener('submit', guardarCargo)

  inputBuscar.addEventListener('input', filtrarCargos)

  document.addEventListener('keydown', e => {
    if (e.key === 'Escape') cerrarModal()
  })

  document.addEventListener('click', cerrarMenus)

  await cargarCargos()
})


/* =========================================
   CARGAR
========================================= */

async function cargarCargos(){

  const token = localStorage.getItem('token')

  const res = await fetch(API,{
    headers:{ 'Authorization':`Bearer ${token}` }
  })

  const json = await res.json()
  const data = json.data ?? json

  if(!Array.isArray(data)){
    console.error('Cargos no es array',data)
    return
  }

  cargosCache = data.sort((a,b)=>a.id-b.id)

  renderTabla(cargosCache)
}



/* =========================================
   RENDER TABLA
========================================= */

function renderTabla(data){

  const tbody = document.querySelector('#tablaCargos tbody')
  tbody.innerHTML = ''

  data.forEach(cargo=>{

    const activo = cargo.estado === 1

    const tr = document.createElement('tr')

    tr.innerHTML = `
      <td>${cargo.id}</td>

      <td>${escapeHTML(cargo.nombre)}</td>

      <td>
        <span class="${activo ? 'badge-aprobado' : 'badge-inactivo'}">
          ${activo ? 'Activo' : 'Inactivo'}
        </span>
      </td>

      <td>${formatearFecha(cargo.created_at)}</td>

      <td>

        <div class="acciones-menu">

          <button class="btn-menu" data-menu="${cargo.id}">
            ⋮
          </button>

          <div class="menu-dropdown" id="menu-${cargo.id}">

            <button onclick="editar(${cargo.id},'${cargo.nombre.replace(/'/g,"\\'")}')">
              Editar
            </button>

            <button onclick="toggleEstado(${cargo.id},${activo})">
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
   MENÚ ⋮
========================================= */

function activarMenus(){

  document.querySelectorAll('.btn-menu').forEach(btn=>{

    btn.addEventListener('click',e=>{

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
    .forEach(m=>m.classList.remove('show'))
}



/* =========================================
   BUSCAR
========================================= */

function filtrarCargos(){

  const q = inputBuscar.value.toLowerCase()

  const filtrados = cargosCache.filter(c=>
    c.nombre.toLowerCase().includes(q)
  )

  renderTabla(filtrados)
}



/* =========================================
   MODAL
========================================= */

function abrirModalNuevo(){

  modoEdicion = false
  idEditando = null

  document.getElementById('modalTitle').innerText='Nuevo Cargo'

  inputNombre.value=''

  modal.classList.remove('hidden')
}

function cerrarModal(){
  modal.classList.add('hidden')
}



/* =========================================
   EDITAR
========================================= */

window.editar=function(id,nombre){

  modoEdicion=true
  idEditando=id

  document.getElementById('modalTitle').innerText='Editar Cargo'

  inputNombre.value=nombre

  modal.classList.remove('hidden')
}



/* =========================================
   GUARDAR
========================================= */

async function guardarCargo(e){

  e.preventDefault()

  const token = localStorage.getItem('token')

  const nombre = inputNombre.value.trim()

  if(!nombre){
    alert('Nombre obligatorio')
    return
  }

  const url = modoEdicion ? `${API}/${idEditando}` : API
  const method = modoEdicion ? 'PUT' : 'POST'

  await fetch(url,{
    method,
    headers:{
      'Content-Type':'application/json',
      'Authorization':`Bearer ${token}`
    },
    body:JSON.stringify({nombre})
  })

  cerrarModal()

  await cargarCargos()
}



/* =========================================
   ESTADO
========================================= */

window.toggleEstado = async function(id,activoActual){

  const token = localStorage.getItem('token')

  await fetch(`${API}/${id}/estado`,{
    method:'PATCH',
    headers:{
      'Content-Type':'application/json',
      'Authorization':`Bearer ${token}`
    },
    body:JSON.stringify({estado:activoActual ? 0 : 1})
  })

  await cargarCargos()
}



/* =========================================
   UTIL
========================================= */

function formatearFecha(fechaUTC){

  if(!fechaUTC) return '-'

  const fecha = new Date(fechaUTC)

  return fecha.toLocaleDateString('es-CO')
}

function escapeHTML(text){

  const div = document.createElement('div')
  div.innerText=text
  return div.innerHTML
}