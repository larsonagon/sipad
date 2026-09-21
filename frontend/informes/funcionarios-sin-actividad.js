import { renderHeader } from '../components/header.js'

// =====================================================
// AUTH
// =====================================================

function getToken() {
  return sessionStorage.getItem('token')
}

function esMasterAdmin() {
  const token = getToken()
  if (!token) return false
  try {
    const p = JSON.parse(atob(token.split('.')[1]))
    return p.es_master_admin === true || p.es_master_admin === 1
  } catch { return false }
}

function buildHeaders(extra = {}) {
  const token = getToken()
  const headers = { Authorization: `Bearer ${token}`, ...extra }
  if (esMasterAdmin()) {
    const entidadId =
      sessionStorage.getItem('gestion_entidad_id') ||
      sessionStorage.getItem('entidad_id') ||
      null
    if (entidadId) headers['X-Entidad-Id'] = entidadId
  }
  return headers
}

async function apiFetch(url) {
  const res = await fetch(url, {
    headers: buildHeaders({ 'Content-Type': 'application/json' })
  })
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

async function descargarArchivo(url, nombreArchivo, btn) {
  const textoOriginal = btn ? btn.textContent : null
  if (btn) { btn.disabled = true; btn.textContent = 'Generando…' }
  try {
    const res = await fetch(url, { headers: buildHeaders() })
    if (res.status === 401) {
      sessionStorage.clear()
      window.location.href = '/'
      return
    }
    if (!res.ok) throw new Error(`Error ${res.status}`)
    const blob = await res.blob()
    const objUrl = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = objUrl
    a.download = nombreArchivo
    document.body.appendChild(a)
    a.click()
    a.remove()
    setTimeout(() => URL.revokeObjectURL(objUrl), 1500)
  } catch (e) {
    console.error('Error descargando archivo:', e)
    alert('No se pudo generar el archivo. Intente nuevamente.')
  } finally {
    if (btn) { btn.disabled = false; btn.textContent = textoOriginal }
  }
}

// =====================================================
// INIT
// =====================================================

document.addEventListener('DOMContentLoaded', async () => {

  const token = getToken()
  if (!token) { window.location.href = '/'; return }

  renderHeader('Informes', sessionStorage.getItem('gestion_entidad_nombre') || null)

  await cargarDependencias()

  document.getElementById('btnConsultar').addEventListener('click', consultar)
  document.getElementById('btnExcel').addEventListener('click', exportarExcel)
  document.getElementById('btnExcelBottom')?.addEventListener('click', exportarExcel)

  // Primera carga: todo el ámbito
  consultar()
})

async function cargarDependencias() {
  const select = document.getElementById('dependencia')
  select.innerHTML = '<option value="">Todas</option>'
  try {
    const json = await apiFetch('/api/dependencias')
    if (!json) return
    const dependencias = json.data || json
    dependencias.forEach(dep => {
      const o = document.createElement('option')
      o.value = dep.id
      o.textContent = dep.nombre
      select.appendChild(o)
    })
  } catch (e) { console.error('Error cargando dependencias:', e) }
}

// =====================================================
// CONSULTAR
// =====================================================

async function consultar() {
  limpiarError()
  try {
    const json = await apiFetch(`/api/informes/funcionarios-sin-actividad?${obtenerParams()}`)
    if (!json) return
    const data = json.data || []
    renderKPIs(data)
    renderTabla(data)
  } catch (e) {
    console.error('Error generando informe:', e)
    mostrarError('Error de conexión con el servidor.')
  }
}

function renderKPIs(data) {
  const total        = data.length
  const dependencias = new Set(data.map(r => r.dependencia).filter(Boolean)).size

  const select = document.getElementById('dependencia')
  const ambito = select.value
    ? (select.options[select.selectedIndex]?.textContent || 'Dependencia')
    : 'Toda la entidad'

  document.getElementById('kpisContainer').style.display = 'grid'
  document.getElementById('kpiSinActividad').textContent = total
  document.getElementById('kpiDependencias').textContent = dependencias
  document.getElementById('kpiAmbito').textContent       = ambito

  const resHead = document.getElementById('resultadosHead')
  if (resHead) resHead.textContent = `Resultados — ${total} funcionario(s)`
}

function badgeEstado(estado) {
  const inactivo = Number(estado) === 0
  return inactivo
    ? `<span style="display:inline-block;font-size:11px;padding:2px 8px;border-radius:99px;background:#F1EFE8;color:#5F5E5A;">Inactivo</span>`
    : `<span style="display:inline-block;font-size:11px;padding:2px 8px;border-radius:99px;background:#EAF3DE;color:#3B6D11;">Activo</span>`
}

function renderTabla(data) {
  const tbody     = document.querySelector('#tablaResultados tbody')
  const tablaCard = document.getElementById('tablaCard')
  const emptyEl   = document.getElementById('emptyState')

  tbody.innerHTML = ''

  if (!data || !data.length) {
    tablaCard.style.display = 'none'
    emptyEl.style.display   = 'block'
    return
  }

  emptyEl.style.display   = 'none'
  tablaCard.style.display = 'block'

  data.forEach(row => {
    const tr = document.createElement('tr')
    tr.innerHTML = `
      <td style="font-weight:500;">${row.funcionario || '-'}</td>
      <td>${row.documento || '-'}</td>
      <td>${row.cargo || '-'}</td>
      <td>${row.dependencia || 'Sin dependencia'}</td>
      <td>${row.email || '-'}</td>
      <td style="text-align:center;">${badgeEstado(row.estado)}</td>
    `
    tbody.appendChild(tr)
  })
}

function exportarExcel(e) {
  descargarArchivo(
    `/api/informes/funcionarios-sin-actividad-excel?${obtenerParams()}`,
    'funcionarios_sin_actividad.xlsx',
    e?.currentTarget
  )
}

function obtenerParams() {
  return new URLSearchParams({
    dependencia: document.getElementById('dependencia').value
  })
}

// =====================================================
// UTILIDADES
// =====================================================

function mostrarError(msg) {
  document.getElementById('errorMsg').innerHTML =
    `<div class="alert-error" style="margin-top:1rem;">${msg}</div>`
}

function limpiarError() {
  document.getElementById('errorMsg').innerHTML = ''
}
