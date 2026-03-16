import { renderHeader } from '../components/header.js'

document.addEventListener('DOMContentLoaded', async () => {

  const token = sessionStorage.getItem('token')

  if (!token) {
    window.location.href = '/'
    return
  }

  // ======================================================
  // RENDER HEADER
  // ======================================================

  renderHeader({
    modulo: 'TRD-AI',
    seccion: 'Dashboard'
  })

  // ======================================================
  // BOTONES
  // ======================================================

  document
    .getElementById('btnVerPropuestas')
    ?.addEventListener('click', () => {

      window.location.href =
        '/trd-ai/trd-ai-propuestas.html'

    })

  // ======================================================
  // CARGAR DASHBOARD
  // ======================================================

  await cargarDashboard()

})



async function apiFetch(url, options = {}) {

  const token = localStorage.getItem('token')

  const resp = await fetch(url,{
    ...options,
    headers:{
      Authorization:`Bearer ${token}`,
      'Content-Type':'application/json'
    }
  })

  return resp

}



// ======================================================
// CARGAR DASHBOARD
// ======================================================

async function cargarDashboard(){

  try{

    const resp = await apiFetch('/api/trd-ai/dashboard')

    if (!resp.ok)
      throw new Error('Error HTTP')

    const json = await resp.json()

    if (!json.ok)
      throw new Error(json.error)

    const data = json.data

    // ==================================================
    // KPIs
    // ==================================================

    document.getElementById('kpiTotal').textContent =
      data.resumen.total_propuestas || 0

    document.getElementById('kpiAprobadas').textContent =
      data.resumen.aprobadas || 0

    document.getElementById('kpiRechazadas').textContent =
      data.resumen.rechazadas || 0

    document.getElementById('kpiPendientes').textContent =
      data.resumen.pendientes || 0

    // ==================================================
    // TABLA ÚLTIMAS APROBADAS
    // ==================================================

    renderUltimas(data.ultimas_aprobadas)

  }
  catch(error){

    console.error('Error dashboard TRD-AI:',error)

  }

}



// ======================================================
// RENDER TABLA ÚLTIMAS
// ======================================================

function renderUltimas(series){

  const tbody = document.getElementById('tablaRecientes')

  if(!series || !series.length){

    tbody.innerHTML =
      '<tr><td colspan="2">No hay registros</td></tr>'

    return
  }

  let html=''

  series.forEach(s=>{

    html+=`
    <tr>
      <td>${s.nombre_serie || '-'}</td>
      <td>${formatearFecha(s.fecha_aprobacion)}</td>
    </tr>
    `

  })

  tbody.innerHTML = html

}

// ======================================================
// UTILIDADES
// ======================================================

function formatearFecha(fecha){

  if(!fecha) return '-'

  const d = new Date(fecha)

  return d.toLocaleDateString('es-CO')

}