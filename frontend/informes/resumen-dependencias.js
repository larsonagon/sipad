import { renderHeader } from '/components/header.js'

// =====================================================
// AUTH
// =====================================================

const token = sessionStorage.getItem('token')
if (!token) window.location.href = '/'

function esMasterAdmin() {
  try {
    const p = JSON.parse(atob(token.split('.')[1]))
    return p.es_master_admin === true || p.es_master_admin === 1
  } catch { return false }
}

async function apiFetch(url, options = {}) {

  const headers = {
    Authorization: `Bearer ${token}`,
    ...(options.headers || {})
  }

  if (esMasterAdmin()) {
    const eid =
      sessionStorage.getItem('gestion_entidad_id') ||
      sessionStorage.getItem('entidad_id') ||
      null
    if (eid) headers['X-Entidad-Id'] = eid
  }

  const resp = await fetch(url, { ...options, headers })

  if (resp.status === 401) {
    sessionStorage.clear()
    window.location.href = '/'
    return null
  }

  return resp
}

// =====================================================
// INIT
// =====================================================

document.addEventListener('DOMContentLoaded', async () => {

  renderHeader('Informes', sessionStorage.getItem('gestion_entidad_nombre') || null)

  await cargarDatos()

  document.getElementById('btnExcel')
    ?.addEventListener('click', exportarExcel)
})

// =====================================================
// CARGAR DATOS
// =====================================================

async function cargarDatos() {

  try {

    const resp = await apiFetch('/api/informes/dependencias')
    if (!resp) return

    if (!resp.ok) {
      mostrarError(`Error del servidor (${resp.status})`)
      return
    }

    const json = await resp.json()

    // Normaliza cualquier estructura que devuelva el backend
    const rows =
      Array.isArray(json)       ? json            :
      json.data                 ? json.data        :
      json.dependencias         ? json.dependencias :
      json.resumen              ? json.resumen     : []

    if (!rows.length) {
      document.getElementById('emptyState').style.display = 'block'
      return
    }

    renderKPIs(rows)
    renderCharts(rows)
    renderTabla(rows)

    document.getElementById('kpisContainer').style.display   = 'grid'
    document.getElementById('chartsContainer').style.display = 'block'
    document.getElementById('tablaCard').style.display       = 'block'

  } catch (err) {
    console.error('Error cargando resumen dependencias:', err)
    mostrarError('Error de conexión con el servidor.')
  }
}

// =====================================================
// KPIs
// =====================================================

function renderKPIs(rows) {
  document.getElementById('kpiDeps').textContent       = rows.length
  document.getElementById('kpiConAct').textContent     = rows.filter(r => totalR(r) > 0).length
  document.getElementById('kpiTotal').textContent      = rows.reduce((s, r) => s + totalR(r), 0)
  document.getElementById('kpiAnalizadas').textContent = rows.reduce((s, r) => s + analizadasR(r), 0)
}

// =====================================================
// GRÁFICAS
// =====================================================

function renderCharts(rows) {

  const sorted = [...rows].sort((a, b) => totalR(b) - totalR(a))
  const labels = sorted.map(r => truncar(nombreR(r), 28))

  // ── Barra horizontal: total vs analizadas ────────
  new Chart(document.getElementById('chartBarras').getContext('2d'), {
    type: 'bar',
    data: {
      labels,
      datasets: [
        {
          label: 'Total registradas',
          data: sorted.map(r => totalR(r)),
          backgroundColor: '#bfdbfe',
          borderColor: '#3b82f6',
          borderWidth: 1.5,
          borderRadius: 4
        },
        {
          label: 'Analizadas',
          data: sorted.map(r => analizadasR(r)),
          backgroundColor: '#6ee7b7',
          borderColor: '#059669',
          borderWidth: 1.5,
          borderRadius: 4
        }
      ]
    },
    options: {
      indexAxis: 'y',
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { position: 'top', labels: { font: { size: 11 } } },
        tooltip: { mode: 'index' }
      },
      scales: {
        x: {
          beginAtZero: true,
          ticks: { font: { size: 11 }, precision: 0 },
          grid: { color: '#f3f4f6' }
        },
        y: {
          ticks: { font: { size: 11 } },
          grid: { display: false }
        }
      }
    }
  })

  // ── Donut: distribución por estado ───────────────
  const COLORES = {
    borrador      : '#d1d5db',
    identificada  : '#fde68a',
    caracterizada : '#93c5fd',
    analizada     : '#6ee7b7',
    completa      : '#4ade80'
  }

  const acum = {}
  rows.forEach(r => {
    ['borrador', 'identificada', 'caracterizada', 'analizada', 'completa'].forEach(e => {
      acum[e] = (acum[e] || 0) + (r[e] || r[`total_${e}`] || 0)
    })
  })
  const eKeys = Object.keys(acum).filter(k => acum[k] > 0)

  new Chart(document.getElementById('chartEstados').getContext('2d'), {
    type: 'doughnut',
    data: {
      labels: eKeys.map(cap),
      datasets: [{
        data: eKeys.map(k => acum[k]),
        backgroundColor: eKeys.map(k => COLORES[k] || '#d1d5db'),
        borderWidth: 2,
        borderColor: '#fff'
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      cutout: '65%',
      plugins: {
        legend: {
          position: 'bottom',
          labels: { font: { size: 11 }, padding: 10, boxWidth: 12 }
        }
      }
    }
  })

  // ── Donut: cobertura de dependencias ─────────────
  const conAct = rows.filter(r => totalR(r) > 0).length
  const sinAct = rows.length - conAct

  new Chart(document.getElementById('chartCobertura').getContext('2d'), {
    type: 'doughnut',
    data: {
      labels: ['Con actividades', 'Sin actividades'],
      datasets: [{
        data: [conAct, sinAct],
        backgroundColor: ['#6ee7b7', '#fee2e2'],
        borderColor: ['#059669', '#fca5a5'],
        borderWidth: 2
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      cutout: '65%',
      plugins: {
        legend: {
          position: 'bottom',
          labels: { font: { size: 11 }, padding: 10, boxWidth: 12 }
        },
        tooltip: {
          callbacks: {
            label: ctx =>
              ` ${ctx.label}: ${ctx.raw} (${Math.round(ctx.raw / rows.length * 100)}%)`
          }
        }
      }
    }
  })
}

// =====================================================
// TABLA DETALLE
// =====================================================

function renderTabla(rows) {

  document.getElementById('tbodyDetalle').innerHTML = [...rows]
    .sort((a, b) => totalR(b) - totalR(a))
    .map(r => {

      const t   = totalR(r)
      const a   = analizadasR(r)
      const pct = t > 0 ? Math.round(a / t * 100) : 0

      const badge = t === 0
        ? `<span style="display:inline-block;padding:2px 8px;border-radius:99px;font-size:11px;font-weight:600;background:#f3f4f6;color:#374151;">Sin registro</span>`
        : pct >= 80
          ? `<span style="display:inline-block;padding:2px 8px;border-radius:99px;font-size:11px;font-weight:600;background:#d1fae5;color:#065f46;">Avanzado</span>`
          : `<span style="display:inline-block;padding:2px 8px;border-radius:99px;font-size:11px;font-weight:600;background:#fef3c7;color:#92400e;">En proceso</span>`

      return `
        <tr>
          <td style="font-weight:500;max-width:240px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;"
              title="${nombreR(r)}">${nombreR(r)}</td>
          <td style="text-align:center;font-weight:600;">${t}</td>
          <td style="text-align:center;font-weight:600;color:#059669;">${a}</td>
          <td>
            <div style="display:flex;align-items:center;gap:8px;">
              <div style="flex:1;height:6px;background:#e5e7eb;border-radius:99px;overflow:hidden;">
                <div style="height:100%;width:${pct}%;background:#3b82f6;border-radius:99px;"></div>
              </div>
              <span style="font-size:12px;font-weight:600;color:var(--text-secondary);min-width:34px;text-align:right;">${pct}%</span>
            </div>
          </td>
          <td style="text-align:center;">${badge}</td>
        </tr>
      `
    }).join('')
}

// =====================================================
// EXPORTAR EXCEL
// =====================================================

async function exportarExcel() {

  const btn = document.getElementById('btnExcel')
  btn.disabled = true
  btn.textContent = 'Generando...'

  try {
    const resp = await apiFetch('/api/informes/registro-actividades-excel')
    if (!resp || !resp.ok) throw new Error()

    const blob = await resp.blob()
    const url  = URL.createObjectURL(blob)
    const a    = document.createElement('a')
    a.href = url
    a.download = 'resumen-dependencias.xlsx'
    document.body.appendChild(a)
    a.click()
    a.remove()
    setTimeout(() => URL.revokeObjectURL(url), 1500)

  } catch {
    alert('Error generando el archivo Excel.')
  } finally {
    btn.disabled = false
    btn.textContent = 'Exportar Excel'
  }
}

// =====================================================
// NORMALIZACIÓN FLEXIBLE DE CAMPOS
// Soporta cualquier nombre que devuelva el backend
// =====================================================

function nombreR(r)     { return r.dependencia || r.nombre || r.nombre_dependencia || 'Sin nombre' }
function totalR(r)      { return r.total || r.total_actividades || r.actividades || 0 }
function analizadasR(r) { return r.analizadas || r.analizada || r.total_analizada || 0 }

// =====================================================
// UTILIDADES
// =====================================================

function mostrarError(msg) {
  document.getElementById('errorMsg').innerHTML =
    `<div class="alert-error" style="margin-top:1rem;">${msg}</div>`
}

function truncar(s, n) { return s.length > n ? s.slice(0, n) + '…' : s }
function cap(s)        { return s ? s.charAt(0).toUpperCase() + s.slice(1) : '' }