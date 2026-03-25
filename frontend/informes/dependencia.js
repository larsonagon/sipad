import { renderHeader } from '../components/header.js'

let chart = null

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
    renderGrafico(data)

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

function renderGrafico(data){

  const canvas = document.getElementById('graficoDependencias')
  if(!canvas || !data.length) return

  const ctx = canvas.getContext('2d')

  if(chart){
    chart.destroy()
  }

  const labels = data.map(x => x.dependencia)
  const actividades = data.map(x => x.total_actividades)
  const analizadas = data.map(x => x.actividades_analizadas)

  chart = new Chart(ctx,{
    type:'bar',
    data:{
      labels,
      datasets:[
        {
          label:'Total actividades',
          data:actividades
        },
        {
          label:'Analizadas',
          data:analizadas
        }
      ]
    },
    options:{
      responsive:true,
      maintainAspectRatio:true,
      scales:{
        y:{
          beginAtZero:true
        }
      }
    }
  })

}