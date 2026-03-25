import { renderHeader } from '../components/header.js'

let chartDependencias = null

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
  if(!token) return window.location.href='/'

  const user = getUserFromToken()
  if(!user) return window.location.href='/'

  renderHeader('informes',user)

  await cargarDependencias()

  document
  .getElementById('btnConsultar')
  .addEventListener('click',consultar)

})

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

async function consultar(){

  const dependencia = document.getElementById('dependencia').value
  const params = new URLSearchParams()

  if(dependencia){
    params.append('dependencia', dependencia)
  }

  try{

    const json =
    await apiFetch(`/api/informes/produccion-documental?${params.toString()}`)

    const data = json.data || []

    renderTabla(data)
    renderGrafico(data)

  }catch(error){

    console.error('Error generando informe:',error)

    document.querySelector('#tablaResultados tbody').innerHTML =
      `<tr><td colspan="7">Error generando informe</td></tr>`

  }

}

function renderTabla(data){

  const tbody = document.querySelector('#tablaResultados tbody')
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
      <td class="text-center">${row.total_tipos_documentales || 0}</td>
      <td>${row.formato || ''}</td>
      <td>${row.volumen || ''}</td>
      <td>${row.frecuencia || ''}</td>
    `

    tbody.appendChild(tr)
  })
}

function renderGrafico(data){

  const canvas = document.getElementById('graficoDependencias')
  if(!canvas) return

  const ctx = canvas.getContext('2d')

  if(chartDependencias){
    chartDependencias.destroy()
  }

  if(!data.length){
    return
  }

  const agrupado = {}

  data.forEach(row=>{
    const dep = row.dependencia || 'Sin dependencia'
    const valor = Number(row.total_tipos_documentales || 0)

    if(valor > 0){
      agrupado[dep] = (agrupado[dep] || 0) + valor
    }
  })

  const labels = Object.keys(agrupado)
  const values = Object.values(agrupado)

  if(!labels.length){
    return
  }

  chartDependencias = new Chart(ctx,{
    type:'doughnut',
    data:{
      labels,
      datasets:[{
        data:values
      }]
    },
    options:{
      responsive:true,
      maintainAspectRatio:true,
      cutout:'65%',
      plugins:{
        legend:{
          position:'bottom'
        }
      }
    }
  })
}