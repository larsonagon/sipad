import { renderHeader } from '../components/header.js'

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
  if (!token) { window.location.href = '/'; return }

  const user = getUserFromToken()
  if (!user) { window.location.href = '/'; return }

  renderHeader('Informes')

  await cargarDependencias()

  const selectFuncionario = document.getElementById('funcionario')
  selectFuncionario.disabled = true
  selectFuncionario.innerHTML = '<option value="">Seleccione una dependencia</option>'

  document.getElementById('dependencia').addEventListener('change', cargarFuncionarios)
  document.getElementById('btnConsultar').addEventListener('click', consultar)
  document.getElementById('btnWord').addEventListener('click', exportarWord)
  document.getElementById('btnExcel').addEventListener('click', exportarExcel)
  document.getElementById('btnWordBottom')?.addEventListener('click', exportarWord)
  document.getElementById('btnExcelBottom')?.addEventListener('click', exportarExcel)
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

async function cargarFuncionarios() {
  const dependenciaId = document.getElementById('dependencia').value
  const select = document.getElementById('funcionario')
  select.innerHTML = ''
  if (!dependenciaId) {
    select.disabled = true
    select.innerHTML = '<option value="">Seleccione una dependencia</option>'
    return
  }
  try {
    const json = await apiFetch(`/api/usuarios?dependencia=${dependenciaId}`)
    if (!json) return
    const usuarios = json.data || json
    select.disabled = false
    select.innerHTML = '<option value="">Todos</option>'
    usuarios.forEach(u => {
      const o = document.createElement('option')
      o.value = u.id
      o.textContent = u.nombre_completo
      select.appendChild(o)
    })
  } catch (e) { console.error('Error cargando funcionarios:', e) }
}

async function consultar() {
  const params = obtenerParams()
  try {
    const json = await apiFetch(`/api/informes/actividades?${params}`)
    if (!json) return
    const data = json.data || []
    renderKPIs(data)
    renderTabla(data)
  } catch (e) {
    console.error('Error generando informe:', e)
  }
}

function renderKPIs(data) {
  const total          = data.length
  const analizadas     = data.filter(r => (r.estado_general || '').toLowerCase() === 'analizada').length
  const caracterizadas = data.filter(r => (r.estado_general || '').toLowerCase() === 'caracterizada').length
  const dependencias   = new Set(data.map(r => r.dependencia).filter(Boolean)).size

  const kpisEl = document.getElementById('kpisContainer')
  if (!kpisEl) return
  kpisEl.style.display = 'grid'

  document.getElementById('kpiTotal').textContent        = total
  document.getElementById('kpiAnalizadas').textContent   = analizadas
  document.getElementById('kpiCaracterizadas').textContent = caracterizadas
  document.getElementById('kpiDependencias').textContent = dependencias

  const resHead = document.getElementById('resultadosHead')
  if (resHead) resHead.textContent = `Resultados — ${total} actividades`
}

function badgeEstado(estado) {
  const e = (estado || '').toLowerCase()
  if (e === 'analizada')
    return `<span style="display:inline-block;font-size:11px;padding:2px 8px;border-radius:99px;background:#EAF3DE;color:#3B6D11;">Analizada</span>`
  if (e === 'caracterizada')
    return `<span style="display:inline-block;font-size:11px;padding:2px 8px;border-radius:99px;background:#E6F1FB;color:#185FA5;">Caracterizada</span>`
  return `<span style="display:inline-block;font-size:11px;padding:2px 8px;border-radius:99px;background:#F1EFE8;color:#5F5E5A;">${estado || '-'}</span>`
}

function renderTabla(data) {
  const tbody = document.querySelector('#tablaResultados tbody')
  tbody.innerHTML = ''
  if (!data || !data.length) {
    tbody.innerHTML = '<tr><td colspan="6">Sin resultados</td></tr>'
    return
  }
  data.forEach(row => {
    const tr = document.createElement('tr')
    tr.innerHTML = `
      <td>${row.nombre || '-'}</td>
      <td>${row.funcionario || '-'}</td>
      <td>${row.dependencia || '-'}</td>
      <td>${row.frecuencia || '-'}</td>
      <td>${badgeEstado(row.estado_general)}</td>
      <td>${formatFecha(row.created_at)}</td>
    `
    tbody.appendChild(tr)
  })
}

function formatFecha(fecha) {
  if (!fecha) return '-'
  return new Date(fecha).toLocaleDateString('es-CO')
}

function exportarWord() {
  window.open(`/api/informes/registro-actividades-word?${obtenerParams()}&token=${getToken()}`)
}

function exportarExcel() {
  window.open(`/api/informes/registro-actividades-excel?${obtenerParams()}&token=${getToken()}`)
}

function obtenerParams() {
  return new URLSearchParams({
    dependencia: document.getElementById('dependencia').value,
    funcionario: document.getElementById('funcionario').value,
    fechaInicio: document.getElementById('fechaInicio').value,
    fechaFin:    document.getElementById('fechaFin').value
  })
}