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
  if(!token) return window.location.href='/'

  const user = getUserFromToken()
  if(!user) return window.location.href='/'

  renderHeader('informes',user)

  await cargarDatos()

  const btn = document.getElementById('btnExportar')
  if(btn){
    btn.addEventListener('click',exportarPDF)
  }

})

/* ============================= */
/* CARGA GENERAL */
/* ============================= */

async function cargarDatos(){

  try{

    const json =
    await apiFetch('/api/informes/dependencias')

    const data = json.data || []

    renderTabla(data)
    renderKPI(data)
    renderGrafico(data)

  }catch(error){

    console.error('Error cargando informe:',error)

  }

}

/* ============================= */
/* KPI */
/* ============================= */

function renderKPI(data){

  const container = document.getElementById('kpis')

  const totalActividades =
    data.reduce((acc,x)=>acc + Number(x.total_actividades || 0),0)

  const totalAnalizadas =
    data.reduce((acc,x)=>acc + Number(x.actividades_analizadas || 0),0)

  const totalDependencias = data.length

  const cumplimiento =
    totalActividades === 0
      ? 0
      : Math.round((totalAnalizadas / totalActividades) * 100)

  container.innerHTML = `
    <div class="kpi"><h4>Dependencias</h4><span>${totalDependencias}</span></div>
    <div class="kpi"><h4>Total actividades</h4><span>${totalActividades}</span></div>
    <div class="kpi"><h4>Analizadas</h4><span>${totalAnalizadas}</span></div>
    <div class="kpi"><h4>% Cumplimiento</h4><span>${cumplimiento}%</span></div>
  `
}

/* ============================= */
/* TABLA */
/* ============================= */

function renderTabla(data){

  const tbody = document.querySelector('#tablaDependencias tbody')
  tbody.innerHTML=''

  if(!data.length){
    tbody.innerHTML = `<tr><td colspan="5">Sin resultados</td></tr>`
    return
  }

  data.forEach(row=>{

    const total = Number(row.total_actividades || 0)
    const analizadas = Number(row.actividades_analizadas || 0)

    const porcentaje =
      total === 0 ? 0 : Math.round((analizadas / total) * 100)

    const color =
      porcentaje >= 80 ? '#16a34a' :
      porcentaje >= 50 ? '#f59e0b' :
      '#dc2626'

    const tr=document.createElement('tr')

    tr.innerHTML=`
      <td>${row.dependencia}</td>
      <td class="text-center">${total}</td>
      <td class="text-center">${Number(row.total_funcionarios || 0)}</td>
      <td class="text-center">${analizadas}</td>
      <td class="text-center">
        <span style="background:${color};color:white;padding:4px 10px;border-radius:20px">
          ${porcentaje}%
        </span>
      </td>
    `

    tbody.appendChild(tr)

  })

}

/* ============================= */
/* GRAFICO */
/* ============================= */

function renderGrafico(data){

  const canvas = document.getElementById('graficoDependencias')
  if(!canvas || !data.length) return

  const ctx = canvas.getContext('2d')

  if(chart) chart.destroy()

  const normal = data.map(x => ({
    dep: x.dependencia,
    total: Number(x.total_actividades || 0),
    analizadas: Number(x.actividades_analizadas || 0)
  }))

  normal.sort((a,b)=>b.total - a.total)

  chart = new Chart(ctx,{
    type:'bar',
    data:{
      labels: normal.map(x=>x.dep),
      datasets:[
        {
          label:'Total',
          data:normal.map(x=>x.total),
          backgroundColor:'#2563eb',
          borderRadius:6
        },
        {
          label:'Analizadas',
          data:normal.map(x=>x.analizadas),
          backgroundColor:'#cbd5f5',
          borderRadius:6
        }
      ]
    },
    options:{
      responsive:true,
      maintainAspectRatio:true,
      plugins:{
        legend:{
          position:'top',
          labels:{
            font:{ size:12 }
          }
        }
      },
      scales:{
        x:{
          ticks:{
            font:{ size:11 },
            maxRotation:0,
            minRotation:0
          }
        },
        y:{
          beginAtZero:true,
          ticks:{
            stepSize:1,
            font:{ size:11 }
          }
        }
      }
    }
  })

}

/* ============================= */
/* EXPORTAR PDF (BACKEND) */
/* ============================= */

async function exportarPDF(){

  try{

    const token = getToken()

    const res = await fetch('/api/informes/dependencias/pdf',{
      headers:{
        Authorization:`Bearer ${token}`
      }
    })

    if(!res.ok){
      throw new Error('Error generando PDF')
    }

    const blob = await res.blob()
    const url = window.URL.createObjectURL(blob)

    const a = document.createElement('a')
    a.href = url
    a.download = 'informe_dependencias.pdf'
    document.body.appendChild(a)
    a.click()
    a.remove()

    window.URL.revokeObjectURL(url)

  }catch(error){

    console.error('Error exportando PDF:',error)
    alert('No se pudo generar el PDF')

  }

}