import { renderHeader } from '../../components/header.js'

const API = '/api/niveles'

let modoEdicion = false
let idEditando = null

let modal
let inputNombre
let form
let inputBuscar

let nivelesCache = []

document.addEventListener('DOMContentLoaded', async () => {

  renderHeader('Administración')

  modal = document.getElementById('modal')
  inputNombre = document.getElementById('inputNombre')
  form = document.getElementById('formNivel')
  inputBuscar = document.getElementById('inputBuscarNivel')

  document.getElementById('btnNuevo')
    .addEventListener('click', abrirModalNuevo)

  document.getElementById('btnCancelar')
    .addEventListener('click', cerrarModal)

  form.addEventListener('submit', guardarNivel)

  inputBuscar.addEventListener('input', filtrarNiveles)

  document.addEventListener('keydown', e=>{
    if(e.key==='Escape') cerrarModal()
  })

  document.addEventListener('click', cerrarMenus)

  await cargarNiveles()
})



/* =========================================
   CARGAR NIVELES
========================================= */

async function cargarNiveles(){

  try{

    const token = localStorage.getItem('token')

    const res = await fetch(API,{
      headers:{ 'Authorization':`Bearer ${token}` }
    })

    const json = await res.json()
    const data = json.data ?? json

    if(!Array.isArray(data)){
      console.error('Niveles no es array',data)
      return
    }

    nivelesCache = data.sort((a,b)=>a.id-b.id)

    renderTabla(nivelesCache)

  }catch(error){
    console.error('Error cargando niveles:',error)
  }

}



/* =========================================
   RENDER TABLA
========================================= */

function renderTabla(data){

  const tbody = document.querySelector('#tablaNiveles tbody')
  tbody.innerHTML=''

  data.forEach(nivel=>{

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

          <button class="btn-menu" data-menu="${nivel.id}">
            ⋮
          </button>

          <div class="menu-dropdown" id="menu-${nivel.id}">

            <button onclick="editar(${nivel.id},'${nivel.nombre.replace(/'/g,"\\'")}')">
              Editar
            </button>

            <button onclick="toggleEstado(${nivel.id},${activo})">
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

function filtrarNiveles(){

  const q = inputBuscar.value.toLowerCase()

  const filtrados = nivelesCache.filter(n=>
    n.nombre.toLowerCase().includes(q)
  )

  renderTabla(filtrados)

}



/* =========================================
   MODAL
========================================= */

function abrirModalNuevo(){

  modoEdicion=false
  idEditando=null

  document.getElementById('modalTitle').innerText='Nuevo Nivel'

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

  document.getElementById('modalTitle').innerText='Editar Nivel'

  inputNombre.value=nombre

  modal.classList.remove('hidden')

}



/* =========================================
   GUARDAR
========================================= */

async function guardarNivel(e){

  e.preventDefault()

  const token = localStorage.getItem('token')

  const nombre = inputNombre.value.trim()

  if(!nombre){
    alert('Nombre obligatorio')
    return
  }

  const url = modoEdicion ? `${API}/${idEditando}` : API
  const method = modoEdicion ? 'PUT' : 'POST'

  try{

    await fetch(url,{
      method,
      headers:{
        'Content-Type':'application/json',
        'Authorization':`Bearer ${token}`
      },
      body:JSON.stringify({nombre})
    })

    cerrarModal()

    await cargarNiveles()

  }catch(error){
    console.error('Error guardando nivel:',error)
  }

}



/* =========================================
   ESTADO
========================================= */

window.toggleEstado = async function(id,activoActual){

  const token = localStorage.getItem('token')

  try{

    await fetch(`${API}/${id}/estado`,{
      method:'PATCH',
      headers:{
        'Content-Type':'application/json',
        'Authorization':`Bearer ${token}`
      },
      body:JSON.stringify({estado:activoActual ? 0 : 1})
    })

    await cargarNiveles()

  }catch(error){
    console.error('Error cambiando estado:',error)
  }

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