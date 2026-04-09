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

  // ✅ Contexto superadmin
  const entidadId =
    sessionStorage.getItem('gestion_entidad_id') ||
    sessionStorage.getItem('entidad_id') ||
    null

  if (entidadId) {
    headers['X-Entidad-Id'] = entidadId
  }

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

  if (!token) {
    window.location.href = '/'
    return
  }

  const user = getUserFromToken()

  if (!user) {
    window.location.href = '/'
    return
  }

  // ✅ FIX: renderHeader solo recibe el nombre del módulo
  renderHeader('Informes')

  await cargarDependencias()

  const selectFuncionario = document.getElementById('funcionario')
  selectFuncionario.disabled = true
  selectFuncionario.innerHTML = '<option value="">Seleccione una dependencia</option>'

  document.getElementById('dependencia').addEventListener('change', cargarFuncionarios)
  document.getElementById('btnConsultar').addEventListener('click', consultar)
  document.getElementById('btnWord').addEventListener('click', exportarWord)
  document.getElementById('btnExcel').addEventListener('click', exportarExcel)

})

/* ============================= */
/* DEPENDENCIAS                  */
/* ============================= */

async function cargarDependencias() {

  const select = document.getElementById('dependencia')
  select.innerHTML = '<option value="">Todas</option>'

  try {

    const json = await apiFetch('/api/dependencias')
    if (!json) return

    const dependencias = json.data || json

    dependencias.forEach(dep => {
      const option = document.createElement('option')
      option.value = dep.id
      option.textContent = dep.nombre
      select.appendChild(option)
    })

  } catch (error) {
    console.error('Error cargando dependencias:', error)
  }
}

/* ============================= */
/* FUNCIONARIOS                  */
/* ============================= */

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
      const option = document.createElement('option')
      option.value = u.id
      option.textContent = u.nombre_completo
      select.appendChild(option)
    })

  } catch (error) {
    console.error('Error cargando funcionarios:', error)
  }
}

/* ============================= */
/* CONSULTAR                     */
/* ============================= */

async function consultar() {

  const dependencia = document.getElementById('dependencia').value
  const funcionario = document.getElementById('funcionario').value
  const fechaInicio = document.getElementById('fechaInicio').value
  const fechaFin    = document.getElementById('fechaFin').value

  const params = new URLSearchParams({ dependencia, funcionario, fechaInicio, fechaFin })

  try {

    const json = await apiFetch(`/api/informes/actividades?${params}`)
    if (!json) return

    renderTabla(json.data || [])

  } catch (error) {
    console.error('Error generando informe:', error)
  }
}

/* ============================= */
/* TABLA                         */
/* ============================= */

function renderTabla(data) {

  const tbody = document.querySelector('#tablaResultados tbody')
  tbody.innerHTML = ''

  if (!data || !data.length) {
    tbody.innerHTML = '<tr><td colspan="5">Sin resultados</td></tr>'
    return
  }

  data.forEach(row => {
    const tr = document.createElement('tr')
    tr.innerHTML = `
      <td>${row.nombre || ''}</td>
      <td>${row.funcionario || ''}</td>
      <td>${row.dependencia || ''}</td>
      <td>${row.frecuencia || ''}</td>
      <td>${formatFecha(row.created_at)}</td>
    `
    tbody.appendChild(tr)
  })
}

function formatFecha(fecha) {
  if (!fecha) return ''
  return new Date(fecha).toLocaleDateString('es-CO')
}

/* ============================= */
/* EXPORTAR WORD                 */
/* ============================= */

function exportarWord() {

  const params = obtenerParams()
  const token  = getToken()

  window.open(`/api/informes/registro-actividades-word?${params}&token=${token}`)
}

/* ============================= */
/* EXPORTAR EXCEL                */
/* ============================= */

function exportarExcel() {

  const params = obtenerParams()
  const token  = getToken()

  window.open(`/api/informes/registro-actividades-excel?${params}&token=${token}`)
}

/* ============================= */
/* UTIL                          */
/* ============================= */

function obtenerParams() {

  const dependencia = document.getElementById('dependencia').value
  const funcionario = document.getElementById('funcionario').value
  const fechaInicio = document.getElementById('fechaInicio').value
  const fechaFin    = document.getElementById('fechaFin').value

  return new URLSearchParams({ dependencia, funcionario, fechaInicio, fechaFin })
}