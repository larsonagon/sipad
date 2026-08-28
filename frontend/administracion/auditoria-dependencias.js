import { renderHeader } from '../components/header.js'

let deps = []

document.addEventListener('DOMContentLoaded', async () => {
  renderHeader('Administración', sessionStorage.getItem('gestion_entidad_nombre') || null)
  document.getElementById('chkAll')?.addEventListener('change', toggleTodas)
  document.getElementById('btnEliminar')?.addEventListener('click', eliminarSeleccionadas)
  await cargar()
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

function esc(s){ return (s||'').toString().replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;') }

async function cargar() {
  try {
    const resp = await apiFetch('/api/trd-ai/auditoria-dependencias')
    const json = await resp.json()
    if (!resp.ok || !json.ok) throw new Error(json.error || 'error')
    deps = json.dependencias || []
    renderResumen(json.resumen || {})
    renderTabla()
  } catch (e) {
    console.error(e)
    mostrarToast('No se pudo cargar la auditoría', 'error')
  }
}

function renderResumen(r) {
  document.getElementById('resumenChips').innerHTML = `
    <span class="rchip info">${r.total || 0} dependencias</span>
    <span class="rchip sin">${r.sin_uso || 0} sin uso</span>
    <span class="rchip dup">${r.duplicadas || 0} duplicadas</span>`
}

function renderTabla() {
  const tb = document.getElementById('tabla')
  if (!deps.length) { tb.innerHTML = `<tr><td colspan="7" style="text-align:center;color:#9ca3af;padding:1.5rem;">Sin dependencias.</td></tr>`; return }

  tb.innerHTML = deps.map(d => {
    const fecha = (d.created_at || '').toString().slice(0, 10)
    const estado = d.sin_uso
      ? '<span class="chip sin">Sin uso</span>'
      : `<span class="chip uso">En uso (${d.usos})</span>`
    const dup = d.duplicada ? ' <span class="chip dup">Duplicada</span>' : ''
    return `
      <tr data-id="${d.id}" data-nombre="${esc(d.nombre)}" data-usos="${d.usos}" data-act="${d.actividades}" data-pro="${d.propuestas}" data-ser="${d.series}">
        <td class="col-chk"><input type="checkbox" class="chk-dep"></td>
        <td class="dep-nombre">${esc(d.nombre)}</td>
        <td class="col-num">${d.actividades}</td>
        <td class="col-num">${d.propuestas}</td>
        <td class="col-num">${d.series}</td>
        <td>${estado}${dup}</td>
        <td style="color:#64748b;">${fecha}</td>
      </tr>`
  }).join('')

  tb.querySelectorAll('.chk-dep').forEach(c => c.addEventListener('change', actualizarSeleccion))
  actualizarSeleccion()
}

function seleccionadas() {
  return [...document.querySelectorAll('#tabla tr')]
    .filter(tr => tr.querySelector('.chk-dep')?.checked)
    .map(tr => tr.dataset.id)
}

function actualizarSeleccion() {
  const ids = seleccionadas()
  const btn = document.getElementById('btnEliminar')
  const cnt = document.getElementById('conteoSel')
  btn.disabled = ids.length === 0
  cnt.textContent = ids.length ? `${ids.length} seleccionada(s)` : 'Marca las dependencias sin uso que quieras eliminar'
}

function toggleTodas(e) {
  document.querySelectorAll('.chk-dep:not(:disabled)').forEach(c => (c.checked = e.target.checked))
  actualizarSeleccion()
}

function filasSel() {
  return [...document.querySelectorAll('#tabla tr')].filter(tr => tr.querySelector('.chk-dep')?.checked)
}

async function eliminarSeleccionadas() {
  const filas = filasSel()
  if (!filas.length) return
  const ids = filas.map(tr => tr.dataset.id)

  const enUso = filas.filter(tr => Number(tr.dataset.usos) > 0)
  let modo = 'sin_uso'

  if (enUso.length) {
    // Sumar lo que se purgaría en cascada
    const tot = enUso.reduce((a, tr) => ({
      act: a.act + Number(tr.dataset.act), pro: a.pro + Number(tr.dataset.pro), ser: a.ser + Number(tr.dataset.ser)
    }), { act: 0, pro: 0, ser: 0 })
    const nombres = enUso.map(tr => '• ' + tr.dataset.nombre).join('\n')
    const aviso =
      `ATENCIÓN — borrado en cascada.\n\n` +
      `${enUso.length} de las seleccionadas están EN USO:\n${nombres}\n\n` +
      `Además de las dependencias, se eliminarán también sus datos asociados:\n` +
      `  · ${tot.act} actividad(es)\n  · ${tot.pro} propuesta(s)\n  · ${tot.ser} serie(s) de la TRD (con sus subseries y tipologías)\n\n` +
      `Esto NO se puede deshacer. Úsalo solo para datos de prueba/ficticios.\n\n¿Continuar?`
    if (!confirm(aviso)) return
    modo = 'cascada'
  } else {
    if (!confirm(`¿Eliminar ${ids.length} dependencia(s) sin uso? Esta acción no se puede deshacer.`)) return
  }

  try {
    const resp = await apiFetch('/api/trd-ai/auditoria-dependencias/eliminar', {
      method: 'POST', body: JSON.stringify({ ids, modo })
    })
    const json = await resp.json()
    if (!resp.ok || !json.ok) throw new Error(json.error || 'error')
    let msg = `${json.eliminadas} dependencia(s) eliminada(s)`
    const p = json.purgado
    if (p && (p.actividades || p.propuestas || p.series)) {
      msg += ` · purgado: ${p.actividades} act, ${p.propuestas} prop, ${p.series} series`
    }
    if (json.omitidas?.length) msg += ` · ${json.omitidas.length} omitida(s)`
    mostrarToast(msg, json.eliminadas ? 'success' : 'warning')
    await cargar()
  } catch (e) {
    console.error(e)
    mostrarToast('No se pudieron eliminar', 'error')
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
