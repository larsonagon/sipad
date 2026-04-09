import { renderHeader } from '../components/header.js'

let chart = null

function getToken() {
  return sessionStorage.getItem('token')
}

function getUserFromToken() {
  const token = getToken()
  if (!token) return null
  try {
    return JSON.parse(atob(token.split('.')[1]))
  } catch {
    return null
  }
}

async function apiFetch(url) {

  const token = getToken()

  const headers = {
    Authorization: `Bearer ${token}`,
    'Content-Type': 'application/json'
  }

  // ✅ FIX: header X-Entidad-Id para superadmin
  const entidadId =
    sessionStorage.getItem('gestion_entidad_id') ||
    sessionStorage.getItem('entidad_id') ||
    null

  if (entidadId) headers['X-Entidad-Id'] = entidadId

  const res = await fetch(url, { headers })

  if (res.status === 401) {
    sessionStorage.clear()
    window.location.href = '/'
    return null
  }

  if (!res.ok) {
    const text = await res.text()
    throw new Error(text || 'Error en API')
  }

  return res.json()
}

document.addEventListener('DOMContentLoaded', async () => {

  const token = getToken()
  if (!token) return window.location.href = '/'

  const user = getUserFromToken()
  if (!user) return window.location.href = '/'

  // ✅ FIX: solo string, sin pasar user como segundo parámetro
  renderHeader('Informes')

  cargarDatos()
})

async function cargarDatos() {

  try {

    const json = await apiFetch('/api/informes/dependencias')
    if (!json) return

    const data = json.data || []

    renderKPI(data)
    renderTabla(data)
    renderGrafico(data)

  } catch (error) {
    console.error('Error cargando informe:', error)
  }
}

/* ============================= */
/* KPI                           */
/* ============================= */

function renderKPI(data) {

  const container = document.getElementById('kpis')
  if (!container) return

  const totalActividades  = data.reduce((acc, x) => acc + Number(x.total_actividades  || 0), 0)
  const totalAnalizadas   = data.reduce((acc, x) => acc + Number(x.actividades_analizadas || 0), 0)
  const totalDependencias = data.length
  const cumplimiento      = totalActividades === 0
    ? 0
    : Math.round((totalAnalizadas / totalActividades) * 100)

  container.innerHTML = `
    <div class="kpi">
      <h4>Dependencias</h4>
      <span>${totalDependencias}</span>
    </div>
    <div class="kpi">
      <h4>Total actividades</h4>
      <span>${totalActividades}</span>
    </div>
    <div class="kpi">
      <h4>Analizadas</h4>
      <span>${totalAnalizadas}</span>
    </div>
    <div class="kpi">
      <h4>% Cumplimiento</h4>
      <span>${cumplimiento}%</span>
    </div>
  `
}

/* ============================= */
/* TABLA + SEMÁFORO              */
/* ============================= */

function renderTabla(data) {

  const tbody = document.querySelector('#tablaDependencias tbody')
  if (!tbody) return

  tbody.innerHTML = ''

  if (!data.length) {
    tbody.innerHTML = '<tr><td colspan="5">Sin resultados</td></tr>'
    return
  }

  data.forEach(row => {

    const total     = Number(row.total_actividades     || 0)
    const analizadas = Number(row.actividades_analizadas || 0)
    const porcentaje = total === 0 ? 0 : Math.round((analizadas / total) * 100)
    const color      = getColor(porcentaje)

    const tr = document.createElement('tr')

    tr.innerHTML = `
      <td>${row.dependencia || ''}</td>
      <td class="text-center">${total}</td>
      <td class="text-center">${Number(row.total_funcionarios || 0)}</td>
      <td class="text-center">${analizadas}</td>
      <td class="text-center">
        <span style="padding:4px 10px;border-radius:20px;font-size:12px;font-weight:600;color:white;background:${color};">
          ${porcentaje}%
        </span>
      </td>
    `

    tbody.appendChild(tr)
  })
}

function getColor(valor) {
  if (valor >= 80) return '#16a34a'
  if (valor >= 50) return '#f59e0b'
  return '#dc2626'
}

/* ============================= */
/* GRÁFICO                       */
/* ============================= */

function renderGrafico(data) {

  const canvas = document.getElementById('graficoDependencias')
  if (!canvas || !data.length) return

  const ctx = canvas.getContext('2d')

  if (chart) chart.destroy()

  const normalizado = data
    .map(x => ({
      dependencia: x.dependencia || 'Sin dependencia',
      total:       Number(x.total_actividades     || 0),
      analizadas:  Number(x.actividades_analizadas || 0)
    }))
    .sort((a, b) => b.total - a.total)

  const labels     = normalizado.map(x => x.dependencia.length > 18 ? x.dependencia.substring(0, 18) + '...' : x.dependencia)
  const actividades = normalizado.map(x => x.total)
  const analizadas  = normalizado.map(x => x.analizadas)

  chart = new Chart(ctx, {
    type: 'bar',
    data: {
      labels,
      datasets: [
        { label: 'Total',     data: actividades, backgroundColor: '#2563eb', borderRadius: 6 },
        { label: 'Analizadas', data: analizadas,  backgroundColor: '#cbd5f5', borderRadius: 6 }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: true,
      plugins: {
        legend: { position: 'top', labels: { font: { size: 12 } } }
      },
      scales: {
        x: { ticks: { maxRotation: 0, minRotation: 0, font: { size: 11 } } },
        y: { beginAtZero: true, ticks: { stepSize: 1, font: { size: 11 } } }
      }
    }
  })
}