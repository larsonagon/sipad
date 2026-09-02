import { renderHeader } from '../components/header.js'

document.addEventListener('DOMContentLoaded', async () => {
  renderHeader('Instrumentos', sessionStorage.getItem('gestion_entidad_nombre') || null)
  document.querySelectorAll('button[data-doc]').forEach(b =>
    b.addEventListener('click', () => descargarDoc(b.dataset.doc, b.dataset.file, b)))
  document.querySelectorAll('button[data-goto]').forEach(b =>
    b.addEventListener('click', () => { window.location.href = b.dataset.goto }))
  await cargarResumen()
})

function esMasterAdmin() {
  const t = sessionStorage.getItem('token'); if (!t) return false
  try { const p = JSON.parse(atob(t.split('.')[1])); return p.es_master_admin === true || p.es_master_admin === 1 } catch { return false }
}
async function apiFetch(url, options = {}) {
  const token = sessionStorage.getItem('token')
  const headers = { Authorization: `Bearer ${token}`, ...(options.headers || {}) }
  if (esMasterAdmin()) {
    const eid = sessionStorage.getItem('gestion_entidad_id') || sessionStorage.getItem('entidad_id') || null
    if (eid) headers['X-Entidad-Id'] = eid
  }
  if (options.body) headers['Content-Type'] = 'application/json'
  const resp = await fetch(url, { ...options, headers })
  if (resp.status === 401) { sessionStorage.clear(); window.location.href = '/'; return null }
  return resp
}

async function cargarResumen() {
  try {
    const resp = await apiFetch('/api/trd-ai/eliminacion')
    const json = await resp.json()
    if (!resp.ok || !json.ok) throw new Error()
    document.getElementById('resumenChips').innerHTML = `
      <span class="rchip info">${json.series?.length ?? 0} series revisadas para descarte</span>
      <span class="rchip warn">${json.eliminacion} a eliminar (E)</span>
      <span class="rchip ok">${json.seleccion} a seleccionar (S)</span>`
    if ((json.total || 0) === 0) {
      document.getElementById('elimResumen').textContent =
        'No hay series con disposición Eliminación o Selección en la TRD aprobada. El inventario y el acta se generarán vacíos.'
    } else {
      document.getElementById('elimResumen').textContent =
        `${json.total} serie(s) con disposición E/S. El inventario las lista con su fundamento; el acta las consigna para la firma del Comité.`
    }
  } catch (e) {
    console.error(e)
    document.getElementById('resumenChips').innerHTML = '<span class="rchip warn">No se pudo cargar el resumen de eliminación</span>'
  }
}

async function descargarDoc(url, filename, btn) {
  const original = btn?.textContent
  if (btn) { btn.disabled = true; btn.textContent = 'Generando…' }
  try {
    const resp = await apiFetch(url)
    if (!resp || !resp.ok) throw new Error('descarga')
    const blob = await resp.blob()
    const objUrl = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = objUrl; a.download = filename
    document.body.appendChild(a); a.click(); a.remove(); URL.revokeObjectURL(objUrl)
    mostrarToast('Documento generado', 'success')
  } catch (e) {
    console.error(e)
    mostrarToast('No fue posible generar el documento', 'error')
  } finally {
    if (btn) { btn.disabled = false; btn.textContent = original }
  }
}

function mostrarToast(mensaje, tipo = 'info') {
  let c = document.getElementById('sipad-notifications')
  if (!c) { c = document.createElement('div'); c.id = 'sipad-notifications'; document.body.appendChild(c) }
  const t = document.createElement('div'); t.className = `sipad-toast ${tipo}`; t.textContent = mensaje
  c.appendChild(t)
  requestAnimationFrame(() => requestAnimationFrame(() => t.classList.add('visible')))
  setTimeout(() => { t.classList.remove('visible'); setTimeout(() => t.remove(), 300) }, 3500)
}
