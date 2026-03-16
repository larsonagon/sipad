import { renderHeader } from '../components/header.js'

function getToken(){
  return sessionStorage.getItem('token')
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

  cargarDatos()

})

async function cargarDatos(){

  try{

    const json =
    await apiFetch('/api/informes/dependencias')

    const data = json.data || []

    renderTabla(data)

  }catch(error){

    console.error('Error cargando informe:',error)

  }

}

function renderTabla(data){

  const tbody =
  document.querySelector('#tablaDependencias tbody')

  tbody.innerHTML=''

  if(!data.length){

    tbody.innerHTML =
    `<tr><td colspan="4">Sin resultados</td></tr>`

    return
  }

  data.forEach(row=>{

    const tr=document.createElement('tr')

    tr.innerHTML=`
      <td>${row.dependencia || ''}</td>
      <td class="text-center">${row.total_actividades}</td>
      <td class="text-center">${row.total_funcionarios}</td>
      <td class="text-center">${row.actividades_analizadas}</td>
    `

    tbody.appendChild(tr)

  })

}