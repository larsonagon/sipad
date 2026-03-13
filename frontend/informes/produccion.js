import { renderHeader } from '../components/header.js'

function getToken(){
  return localStorage.getItem('token')
}

function getUserFromToken(){

  const token = getToken()
  if(!token) return null

  try{
    return JSON.parse(atob(token.split('.')[1]))
  }catch{
    return null
  }

}

async function apiFetch(url){

  const token = getToken()

  const res = await fetch(url,{
    headers:{
      Authorization:`Bearer ${token}`,
      'Content-Type':'application/json'
    }
  })

  if(!res.ok){
    const text = await res.text()
    throw new Error(text || 'Error en API')
  }

  return res.json()

}

document.addEventListener('DOMContentLoaded',async()=>{

  const token = getToken()

  if(!token){
    window.location.href='/'
    return
  }

  const user = getUserFromToken()

  if(!user){
    window.location.href='/'
    return
  }

  renderHeader('informes',user)

  await cargarDependencias()

  document
  .getElementById('btnConsultar')
  .addEventListener('click',consultar)

})

/* ============================= */
/* CARGAR DEPENDENCIAS */
/* ============================= */

async function cargarDependencias(){

  const select = document.getElementById('dependencia')

  select.innerHTML = '<option value="">Todas</option>'

  try{

    const json = await apiFetch('/api/dependencias')

    const dependencias = json.data || json

    dependencias.forEach(dep=>{

      const option = document.createElement('option')

      option.value = dep.id
      option.textContent = dep.nombre

      select.appendChild(option)

    })

  }catch(error){

    console.error('Error cargando dependencias:',error)

  }

}

/* ============================= */
/* CONSULTAR INFORME */
/* ============================= */

async function consultar(){

  const dependencia =
  document.getElementById('dependencia').value

  const params = new URLSearchParams({
    dependencia
  })

  try{

    const json =
    await apiFetch(`/api/informes/produccion-documental?${params}`)

    const data = json.data || []

    renderTabla(data)

  }catch(error){

    console.error('Error generando informe:',error)

  }

}

/* ============================= */
/* RENDER TABLA */
/* ============================= */

function renderTabla(data){

  const tbody =
  document.querySelector('#tablaResultados tbody')

  tbody.innerHTML=''

  if(!data.length){

    tbody.innerHTML =
    `<tr><td colspan="7">Sin resultados</td></tr>`

    return
  }

  data.forEach(row=>{

    const tr=document.createElement('tr')

    tr.innerHTML=`

      <td>${row.actividad || ''}</td>

      <td>${row.dependencia || ''}</td>

      <td>${row.documentos_generados || ''}</td>

      <td class="text-center">
        ${row.total_tipos_documentales || 0}
      </td>

      <td>${row.formato || ''}</td>

      <td>${row.volumen || ''}</td>

      <td>${row.frecuencia || ''}</td>

    `

    tbody.appendChild(tr)

  })

}