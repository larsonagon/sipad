import { renderHeader } from '../components/header.js'

// Lista completa sin filtrar (para filtrar en el cliente)
let listaCruda = []

document.addEventListener('DOMContentLoaded', async () => {

  const token = sessionStorage.getItem('token')
  if (!token) { window.location.href = '/'; return }

  renderHeader('TRD-AI', sessionStorage.getItem('gestion_entidad_nombre') || null)

  document
    .getElementById('btnGenerarPropuestas')
    ?.addEventListener('click', generarPropuestas)

  document.getElementById('btnExportXlsx')?.addEventListener('click', () => exportarTRD('xlsx'))
  document.getElementById('btnExportDocx')?.addEventListener('click', () => exportarTRD('docx'))
  document.getElementById('btnValidar')?.addEventListener('click', revisarCumplimiento)
  document.getElementById('btnValorar')?.addEventListener('click', valorarAprobadas)
  document.getElementById('btnCcdXlsx')?.addEventListener('click', () => exportarCCD('xlsx'))
  document.getElementById('btnCcdDocx')?.addEventListener('click', () => exportarCCD('docx'))
  document.getElementById('btnReaplicar')?.addEventListener('click', reaplicarAprendizaje)

  // Filtros
  document.getElementById('filtroBusqueda')?.addEventListener('input', aplicarFiltros)
  document.getElementById('filtroEstado')?.addEventListener('change', aplicarFiltros)
  document.getElementById('filtroConfianza')?.addEventListener('change', aplicarFiltros)

  // Acciones en lote
  document.getElementById('btnAprobarSel')?.addEventListener('click', () => accionLoteSeleccion('aprobada'))
  document.getElementById('btnRechazarSel')?.addEventListener('click', () => accionLoteSeleccion('rechazada'))
  document.getElementById('btnFusionarSel')?.addEventListener('click', fusionarSeleccion)
  document.getElementById('btnCancelarSel')?.addEventListener('click', limpiarSeleccion)
  document.getElementById('chkAllTrd')?.addEventListener('change', (e) => {
    document.querySelectorAll('.chk-prop').forEach(c => (c.checked = e.target.checked))
    actualizarBulkBar()
  })

  await cargarPropuestas()
})

// =====================================================
// API FETCH
// =====================================================

function esMasterAdmin() {
  const token = sessionStorage.getItem('token')
  if (!token) return false
  try {
    const p = JSON.parse(atob(token.split('.')[1]))
    return p.es_master_admin === true || p.es_master_admin === 1
  } catch { return false }
}

async function apiFetch(url, options = {}) {

  const token = sessionStorage.getItem('token')

  const headers = {
    Authorization: `Bearer ${token}`,
    ...(options.headers || {})
  }

  if (esMasterAdmin()) {
    const eid =
      sessionStorage.getItem('gestion_entidad_id') ||
      sessionStorage.getItem('entidad_id') || null
    if (eid) headers['X-Entidad-Id'] = eid
  }

  if (options.body) headers['Content-Type'] = 'application/json'

  const resp = await fetch(url, { ...options, headers })

  if (resp.status === 401) {
    sessionStorage.clear()
    window.location.href = '/'
    return null
  }

  return resp
}

// =====================================================
// CARGAR PROPUESTAS
// =====================================================

async function cargarPropuestas() {

  try {

    const resp = await apiFetch('/api/trd-ai/series-propuestas')
    if (!resp) return
    if (!resp.ok) throw new Error('Error cargando propuestas')

    const json = await resp.json()
    if (!json.ok) throw new Error(json.error)

    listaCruda = json.data || []
    aplicarFiltros()

  } catch (err) {
    console.error(err)
    mostrarToast('No fue posible cargar las propuestas', 'error')
  }
}

// =====================================================
// CCD codificado (Excel / Word)
// =====================================================

async function exportarCCD(formato) {
  const aprobadas = listaCruda.filter(p => (p.estado || '') === 'aprobada').length
  if (aprobadas === 0) {
    mostrarToast('No hay propuestas aprobadas para el CCD. Aprueba algunas primero.', 'warning')
    return
  }
  const btn = document.getElementById(formato === 'xlsx' ? 'btnCcdXlsx' : 'btnCcdDocx')
  const original = btn?.textContent
  if (btn) { btn.disabled = true; btn.textContent = 'Generando…' }
  try {
    const resp = await apiFetch(`/api/trd-ai/ccd/${formato}`)
    if (!resp || !resp.ok) throw new Error('Error')
    const blob = await resp.blob()
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = formato === 'xlsx' ? 'CCD-propuesto.xlsx' : 'CCD-propuesto.docx'
    document.body.appendChild(a); a.click(); a.remove(); URL.revokeObjectURL(url)
    mostrarToast(`CCD exportado (${formato.toUpperCase()})`, 'success')
  } catch (e) {
    console.error(e); mostrarToast('No fue posible exportar el CCD', 'error')
  } finally {
    if (btn) { btn.disabled = false; btn.textContent = original }
  }
}

// =====================================================
// RE-APLICAR APRENDIZAJE
// =====================================================

async function reaplicarAprendizaje() {
  const btn = document.getElementById('btnReaplicar')
  const original = btn?.textContent
  if (btn) { btn.disabled = true; btn.textContent = 'Aplicando…' }
  try {
    const resp = await apiFetch('/api/trd-ai/aprendizaje/reaplicar', { method: 'POST', body: JSON.stringify({}) })
    if (!resp || !resp.ok) throw new Error('Error')
    const json = await resp.json()
    if (!json.ok) throw new Error(json.error)
    mostrarToast(`Aprendizaje aplicado: ${json.seriesReasignadas} serie(s) reasignada(s), ${json.tipologiasLimpiadas} con tipologías limpiadas`, 'success')
    await cargarPropuestas()
  } catch (e) {
    console.error(e); mostrarToast('No fue posible re-aplicar el aprendizaje', 'error')
  } finally {
    if (btn) { btn.disabled = false; btn.textContent = original }
  }
}

// =====================================================
// VALORACIÓN (retención + disposición + fundamento)
// =====================================================

async function valorarAprobadas() {
  const aprobadas = listaCruda.filter(p => (p.estado || '') === 'aprobada').length
  if (aprobadas === 0) {
    mostrarToast('No hay propuestas aprobadas para valorar. Aprueba algunas primero.', 'warning')
    return
  }
  const btn = document.getElementById('btnValorar')
  const original = btn?.textContent
  if (btn) { btn.disabled = true; btn.textContent = 'Valorando…' }
  try {
    const resp = await apiFetch('/api/trd-ai/valorar-lote', { method: 'POST', body: JSON.stringify({}) })
    if (!resp || !resp.ok) throw new Error('Error')
    const json = await resp.json()
    if (!json.ok) throw new Error(json.error)
    mostrarToast(`${json.valoradas} propuesta(s) valoradas (retención + disposición + fundamento)`, 'success')
    await cargarPropuestas()
  } catch (e) {
    console.error(e)
    mostrarToast('No fue posible valorar las propuestas', 'error')
  } finally {
    if (btn) { btn.disabled = false; btn.textContent = original }
  }
}

// =====================================================
// VALIDADOR NORMATIVO (pre-comité)
// =====================================================

async function revisarCumplimiento() {
  const btn = document.getElementById('btnValidar')
  const original = btn?.textContent
  if (btn) { btn.disabled = true; btn.textContent = 'Revisando…' }
  try {
    const resp = await apiFetch('/api/trd-ai/validar')
    if (!resp || !resp.ok) throw new Error('Error')
    const json = await resp.json()
    if (!json.ok) throw new Error(json.error)
    mostrarPanelCumplimiento(json)
  } catch (e) {
    console.error(e)
    mostrarToast('No fue posible ejecutar la revisión', 'error')
  } finally {
    if (btn) { btn.disabled = false; btn.textContent = original }
  }
}

function mostrarPanelCumplimiento(data) {
  const r = data.resumen || {}
  const hallazgos = data.hallazgos || []

  const colorSev = { error: '#991b1b', advertencia: '#b45309', info: '#1e40af' }
  const bgSev    = { error: '#fef2f2', advertencia: '#fffbeb', info: '#eff6ff' }
  const bordeSev = { error: '#fecaca', advertencia: '#fde68a', info: '#bfdbfe' }
  const etiqueta = { error: 'Error', advertencia: 'Advertencia', info: 'Sugerencia' }

  const veredicto = r.lista_para_comite
    ? `<div style="background:#e7f7ef;border:1px solid #a7f3d0;color:#0f8a5f;padding:12px 16px;border-radius:10px;font-weight:700;">
         ✓ Sin errores que bloqueen. La TRD está lista para el comité.
       </div>`
    : `<div style="background:#fef2f2;border:1px solid #fecaca;color:#991b1b;padding:12px 16px;border-radius:10px;font-weight:700;">
         ${r.errores} error${r.errores === 1 ? '' : 'es'} por corregir antes de llevar la TRD al comité.
       </div>`

  const chips = `
    <div style="display:flex;gap:10px;margin:12px 0;flex-wrap:wrap;">
      <span style="background:#fef2f2;color:#991b1b;border:1px solid #fecaca;padding:4px 12px;border-radius:999px;font-size:13px;font-weight:600;">${r.errores} errores</span>
      <span style="background:#fffbeb;color:#b45309;border:1px solid #fde68a;padding:4px 12px;border-radius:999px;font-size:13px;font-weight:600;">${r.advertencias} advertencias</span>
      <span style="background:#eff6ff;color:#1e40af;border:1px solid #bfdbfe;padding:4px 12px;border-radius:999px;font-size:13px;font-weight:600;">${r.informativos} sugerencias</span>
      <span style="margin-left:auto;color:#64748b;font-size:13px;align-self:center;">${r.series_evaluadas} series evaluadas</span>
    </div>`

  const items = hallazgos.length
    ? hallazgos.map(h => `
        <div style="border:1px solid ${bordeSev[h.severidad]};background:${bgSev[h.severidad]};border-radius:10px;padding:12px 14px;margin-bottom:8px;">
          <div style="display:flex;gap:8px;align-items:baseline;">
            <span style="font-size:11px;font-weight:700;text-transform:uppercase;color:${colorSev[h.severidad]};">${etiqueta[h.severidad]}</span>
            <span style="font-weight:700;color:#1f2937;">${h.serie}${h.subserie ? ' / ' + h.subserie : ''}</span>
          </div>
          <div style="font-size:13px;color:#374151;margin-top:3px;">${h.mensaje}</div>
          ${h.sugerencia ? `<div style="font-size:12px;color:#6b7280;margin-top:3px;">→ ${h.sugerencia}</div>` : ''}
        </div>`).join('')
    : `<div style="color:#6b7280;padding:8px 0;">No se encontraron observaciones.</div>`

  const overlay = document.createElement('div')
  overlay.className = 'modal'
  overlay.innerHTML = `
    <div class="modal-content" style="max-width:720px;max-height:82vh;display:flex;flex-direction:column;">
      <h3 style="margin:0 0 4px;">Revisión de cumplimiento — TRD</h3>
      <p style="margin:0 0 8px;font-size:13px;color:#6b7280;">Reglas del AGN (Ley 594/2000, Acuerdo 004/2019) sobre las propuestas no rechazadas.</p>
      ${veredicto}
      ${chips}
      <div style="overflow-y:auto;flex:1;padding-right:4px;">${items}</div>
      <div style="margin-top:14px;display:flex;justify-content:flex-end;">
        <button id="cerrarValidacion" class="btn-primary btn-sm">Entendido</button>
      </div>
    </div>`
  document.body.appendChild(overlay)
  overlay.querySelector('#cerrarValidacion').addEventListener('click', () => overlay.remove())
  overlay.addEventListener('click', (e) => { if (e.target === overlay) overlay.remove() })
}

// =====================================================
// EXPORT TRD (Excel / Word) — desde propuestas aprobadas
// =====================================================

async function exportarTRD(formato) {
  const aprobadas = listaCruda.filter(p => (p.estado || '') === 'aprobada').length
  if (aprobadas === 0) {
    mostrarToast('No hay propuestas aprobadas para exportar. Aprueba algunas primero.', 'warning')
    return
  }
  const btnId = formato === 'xlsx' ? 'btnExportXlsx' : 'btnExportDocx'
  const btn = document.getElementById(btnId)
  const original = btn?.textContent
  if (btn) { btn.disabled = true; btn.textContent = 'Generando…' }
  try {
    const resp = await apiFetch(`/api/trd-ai/export/${formato}`)
    if (!resp || !resp.ok) throw new Error('Error generando el archivo')
    const blob = await resp.blob()
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = formato === 'xlsx' ? 'TRD-propuesta.xlsx' : 'TRD-propuesta.docx'
    document.body.appendChild(a)
    a.click()
    a.remove()
    URL.revokeObjectURL(url)
    mostrarToast(`TRD exportada (${formato.toUpperCase()})`, 'success')
  } catch (e) {
    console.error(e)
    mostrarToast('No fue posible exportar la TRD', 'error')
  } finally {
    if (btn) { btn.disabled = false; btn.textContent = original }
  }
}

// =====================================================
// FILTROS (cliente)
// =====================================================

function aplicarFiltros() {
  const q      = (document.getElementById('filtroBusqueda')?.value || '').toLowerCase().trim()
  const estado = document.getElementById('filtroEstado')?.value || ''
  const conf   = document.getElementById('filtroConfianza')?.value || ''

  const filtrada = listaCruda.filter(p => {
    if (estado && (p.estado || 'propuesta') !== estado) return false
    const c = Number(p.confianza ?? 0)
    if (conf === 'baja' && !(c < 0.7)) return false
    if (conf === 'alta' && !(c >= 0.7)) return false
    if (q) {
      const txt = `${p.nombre_serie || ''} ${p.nombre_subserie || ''}`.toLowerCase()
      if (!txt.includes(q)) return false
    }
    return true
  })

  const cont = document.getElementById('contadorPropuestas')
  if (cont) cont.textContent = `${filtrada.length} de ${listaCruda.length} propuestas`

  renderTabla(filtrada)
  limpiarSeleccion()
}

// =====================================================
// UTILIDADES
// =====================================================

function parseTipologias(raw) {
  if (!raw) return []
  try {
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? parsed : [parsed]
  } catch {
    return [raw]
  }
}

function sentenceCase(text) {
  if (!text) return ''
  const s = text.toString().trim()
  return s.charAt(0).toUpperCase() + s.slice(1).toLowerCase()
}

function estadoChip(estado) {
  const e = (estado || '').toLowerCase()
  if (e === 'aprobada')
    return `<span class="estado-chip estado-aprobada">Aprobada</span>`
  if (e === 'rechazada')
    return `<span class="estado-chip estado-rechazada">Rechazada</span>`
  if (e === 'incorporada')
    return `<span class="estado-chip" style="background:#dbeafe;color:#1e40af;">Incorporada</span>`
  return `<span class="estado-chip estado-propuesta">Propuesta</span>`
}

// =====================================================
// AGRUPAR POR SERIE + SUBSERIE + ESTADO
// =====================================================

function agruparSeries(lista) {

  const mapa = {}

  lista.forEach(p => {
    const serie    = p.nombre_serie    || 'Serie sin nombre'
    const subserie = p.nombre_subserie || ''
    const key      = `${serie}__${subserie}__${p.estado}`

    if (!mapa[key]) {
      mapa[key] = {
        serie,
        subserie,
        estado:      p.estado || 'propuesta',
        cantidad:    0,
        ids:         [],
        id:          p.id,
        aprendido:   /aprendido/i.test(p.justificacion || ''),
        tipologias:  parseTipologias(p.tipologia_documental)
      }
    }

    mapa[key].cantidad++
    mapa[key].ids.push(p.id)
  })

  return Object.values(mapa)
}

// =====================================================
// RENDER TABLA
// =====================================================

function renderTabla(lista) {

  const tbody = document.getElementById('tablaPropuestas')

  if (!lista || !lista.length) {
    tbody.innerHTML = `<tr><td colspan="7" style="text-align:center;color:#9ca3af;padding:1.5rem;">No hay propuestas que coincidan.</td></tr>`
    actualizarBulkBar()
    return
  }

  const agrupadas = agruparSeries(lista)

  tbody.innerHTML = agrupadas.map(p => {

    const estado = (p.estado || '').toLowerCase()
    const id     = p.id
    const idsJson = JSON.stringify(p.ids)

    const tips = p.tipologias || []
    const n = tips.length
    const tipHtml = n
      ? `<div class="tip-box">
           <button type="button" class="tip-summary" data-open="0">▸ ${n} tipo${n === 1 ? '' : 's'} documental${n === 1 ? '' : 'es'}</button>
           <ul class="tip-lista tip-hidden">${tips.map(t => `<li>${sentenceCase(t)}</li>`).join('')}</ul>
         </div>`
      : '<span class="tip-vacia">Sin tipologías</span>'

    const btnEditar = estado !== 'incorporada'
      ? `<button class="btn-secondary btn-sm" onclick="editarPropuesta('${id}')">Editar</button>`
      : ''

    const btnAprobar = estado === 'propuesta'
      ? `<button class="btn-success btn-sm" onclick="aprobarGrupo(this)">Aprobar</button>`
      : ''

    const btnRechazar = estado === 'propuesta'
      ? `<button class="btn-danger btn-sm" onclick="rechazarGrupo(this)">Rechazar</button>`
      : ''

    const btnIncorporar = estado === 'aprobada'
      ? `<button class="btn-primary btn-sm btn-incorporar" onclick="incorporar('${id}', this)">Incorporar a TRD</button>`
      : ''

    return `
      <tr data-id="${id}" data-ids='${idsJson.replace(/'/g, "&#39;")}'>
        <td class="col-chk"><input type="checkbox" class="chk-prop"></td>
        <td class="serie-nombre"><strong>${p.serie}</strong>${p.aprendido ? '<span class="badge-aprendido" title="Clasificada a partir de tus correcciones">aprendido</span>' : ''}</td>
        <td class="subserie"><span class="clamp2" title="${(p.subserie || '').replace(/"/g, '&quot;')}">${p.subserie || '—'}</span></td>
        <td class="col-cantidad">${p.cantidad}</td>
        <td class="col-tipos">${tipHtml}</td>
        <td class="td-estado">${estadoChip(p.estado)}</td>
        <td class="trd-actions">
          ${btnEditar}
          ${btnAprobar}
          ${btnRechazar}
          ${btnIncorporar}
        </td>
      </tr>
    `
  }).join('')

  // Tipologías: colapsadas por defecto; se despliegan al hacer clic
  tbody.querySelectorAll('.tip-summary').forEach(btn =>
    btn.addEventListener('click', () => {
      const ul = btn.parentElement.querySelector('.tip-lista')
      const abierto = btn.dataset.open === '1'
      ul.classList.toggle('tip-hidden', abierto) // si estaba abierto → ocultar
      btn.dataset.open = abierto ? '0' : '1'
      const n = ul.querySelectorAll('li').length
      const flecha = abierto ? '▸' : '▾'
      btn.textContent = `${flecha} ${n} tipo${n === 1 ? '' : 's'} documental${n === 1 ? '' : 'es'}`
    })
  )

  // Casillas → actualizar barra de lote
  tbody.querySelectorAll('.chk-prop').forEach(c =>
    c.addEventListener('change', actualizarBulkBar)
  )
  const chkAll = document.getElementById('chkAllTrd')
  if (chkAll) chkAll.checked = false
  actualizarBulkBar()
}

// =====================================================
// SELECCIÓN / ACCIONES EN LOTE
// =====================================================

function filasSeleccionadas() {
  return Array.from(document.querySelectorAll('#tablaPropuestas tr'))
    .filter(tr => tr.querySelector('.chk-prop')?.checked)
}

function idsDeSeleccion() {
  const ids = []
  filasSeleccionadas().forEach(tr => {
    try { JSON.parse(tr.dataset.ids || '[]').forEach(x => ids.push(x)) } catch {}
  })
  return ids
}

function actualizarBulkBar() {
  const grupos = filasSeleccionadas().length
  const ids    = idsDeSeleccion().length
  const bar = document.getElementById('bulkBarTrd')
  const cnt = document.getElementById('bulkCountTrd')

  // La barra queda SIEMPRE visible; los botones se activan al seleccionar.
  if (bar) bar.style.display = 'flex'

  const botones = ['btnAprobarSel', 'btnRechazarSel', 'btnFusionarSel', 'btnCancelarSel']
    .map(id => document.getElementById(id))

  if (grupos > 0) {
    if (cnt) {
      cnt.style.color = '#1e40af'
      cnt.textContent = `${grupos} fila${grupos === 1 ? '' : 's'} · ${ids} propuesta${ids === 1 ? '' : 's'} seleccionada${ids === 1 ? '' : 's'}`
    }
    botones.forEach(b => b && (b.disabled = false))
  } else {
    if (cnt) {
      cnt.style.color = '#64748b'
      cnt.textContent = 'Marca filas (o el encabezado) para aprobar, rechazar o fusionar en lote'
    }
    botones.forEach(b => b && (b.disabled = true))
  }

  const chkAll = document.getElementById('chkAllTrd')
  const todas = document.querySelectorAll('.chk-prop')
  if (chkAll) chkAll.checked = todas.length > 0 && grupos === todas.length
}

function limpiarSeleccion() {
  document.querySelectorAll('.chk-prop').forEach(c => (c.checked = false))
  const chkAll = document.getElementById('chkAllTrd')
  if (chkAll) chkAll.checked = false
  actualizarBulkBar()
}

async function accionLoteSeleccion(estado) {
  const ids = idsDeSeleccion()
  if (!ids.length) return
  const verbo = estado === 'aprobada' ? 'aprobar' : 'rechazar'
  const ok = await confirmarAccion(`¿${verbo.charAt(0).toUpperCase() + verbo.slice(1)} ${ids.length} propuesta(s) seleccionada(s)?`)
  if (!ok) return
  try {
    const resp = await apiFetch('/api/trd-ai/series-propuestas/estado-lote', {
      method: 'POST',
      body: JSON.stringify({ ids, estado })
    })
    const json = resp && await resp.json()
    if (!resp || !json?.ok) throw new Error(json?.error || 'Error')
    mostrarToast(`${json.actualizadas} propuesta(s) ${estado === 'aprobada' ? 'aprobadas' : 'rechazadas'}`, estado === 'aprobada' ? 'success' : 'warning')
    await cargarPropuestas()
  } catch (e) {
    console.error(e)
    mostrarToast('No fue posible actualizar las propuestas', 'error')
  }
}

async function fusionarSeleccion() {
  const filas = filasSeleccionadas()
  if (filas.length < 2) {
    mostrarToast('Seleccione al menos dos filas para fusionar', 'warning')
    return
  }
  const ids = idsDeSeleccion()
  const serieBase = filas[0].querySelector('.serie-nombre strong')?.textContent || ''
  const subBase   = filas[0].querySelector('.subserie')?.textContent?.trim() || ''
  const destino = await pedirDestinoFusion(serieBase, subBase === '—' ? '' : subBase, ids.length)
  if (!destino) return
  try {
    const resp = await apiFetch('/api/trd-ai/series-propuestas/editar-lote', {
      method: 'POST',
      body: JSON.stringify({ ids, nombre_serie: destino.serie, nombre_subserie: destino.subserie })
    })
    const json = resp && await resp.json()
    if (!resp || !json?.ok) throw new Error(json?.error || 'Error')
    mostrarToast(`${json.actualizadas} propuesta(s) fusionadas en "${destino.serie}"`, 'success')
    await cargarPropuestas()
  } catch (e) {
    console.error(e)
    mostrarToast('No fue posible fusionar las propuestas', 'error')
  }
}

// Modal para capturar serie/subserie destino de la fusión
function pedirDestinoFusion(serie, subserie, nProps) {
  return new Promise((resolve) => {
    const overlay = document.createElement('div')
    overlay.className = 'modal'
    overlay.innerHTML = `
      <div class="modal-content" style="max-width:460px;">
        <h3>Fusionar propuestas</h3>
        <p style="margin:0 0 12px;font-size:14px;color:var(--color-text-muted);">
          Se renombrarán ${nProps} propuesta(s) a la misma serie y subserie, quedando en una sola fila.
        </p>
        <div class="form-group">
          <label>Serie documental *</label>
          <input type="text" id="fusSerie" class="form-control" value="${(serie || '').replace(/"/g, '&quot;')}">
        </div>
        <div class="form-group">
          <label>Subserie documental</label>
          <input type="text" id="fusSub" class="form-control" value="${(subserie || '').replace(/"/g, '&quot;')}">
        </div>
        <div class="modal-actions" style="margin-top:14px;display:flex;gap:8px;justify-content:flex-end;">
          <button id="fusCancel" class="btn-secondary btn-sm">Cancelar</button>
          <button id="fusOk" class="btn-primary btn-sm">Fusionar</button>
        </div>
      </div>`
    document.body.appendChild(overlay)
    const cerrar = (val) => { overlay.remove(); resolve(val) }
    overlay.querySelector('#fusCancel').addEventListener('click', () => cerrar(null))
    overlay.querySelector('#fusOk').addEventListener('click', () => {
      const s = overlay.querySelector('#fusSerie').value.trim()
      const sub = overlay.querySelector('#fusSub').value.trim()
      if (!s) { mostrarToast('La serie es obligatoria', 'error'); return }
      cerrar({ serie: s, subserie: sub || null })
    })
    overlay.addEventListener('click', (e) => { if (e.target === overlay) cerrar(null) })
  })
}

// Aprobar/Rechazar un grupo completo (todas sus propuestas)
window.aprobarGrupo = async function(btn) {
  const tr = btn.closest('tr')
  let ids = []
  try { ids = JSON.parse(tr?.dataset.ids || '[]') } catch {}
  if (!ids.length) return
  btn.disabled = true; btn.textContent = '...'
  try {
    const resp = await apiFetch('/api/trd-ai/series-propuestas/estado-lote', {
      method: 'POST', body: JSON.stringify({ ids, estado: 'aprobada' })
    })
    const json = resp && await resp.json()
    if (!resp || !json?.ok) throw new Error(json?.error || 'Error')
    // La aprobación valoriza automáticamente (retención + disposición + fundamento).
    mostrarToast(`${json.actualizadas} propuesta(s) aprobadas y valoradas`, 'success')
    await cargarPropuestas()
  } catch (e) {
    console.error(e); mostrarToast('No fue posible aprobar', 'error')
    btn.disabled = false; btn.textContent = 'Aprobar'
  }
}

window.rechazarGrupo = async function(btn) {
  const tr = btn.closest('tr')
  let ids = []
  try { ids = JSON.parse(tr?.dataset.ids || '[]') } catch {}
  if (!ids.length) return
  btn.disabled = true; btn.textContent = '...'
  try {
    const resp = await apiFetch('/api/trd-ai/series-propuestas/estado-lote', {
      method: 'POST', body: JSON.stringify({ ids, estado: 'rechazada' })
    })
    const json = resp && await resp.json()
    if (!resp || !json?.ok) throw new Error(json?.error || 'Error')
    mostrarToast(`${json.actualizadas} propuesta(s) rechazadas`, 'warning')
    await cargarPropuestas()
  } catch (e) {
    console.error(e); mostrarToast('No fue posible rechazar', 'error')
    btn.disabled = false; btn.textContent = 'Rechazar'
  }
}

// =====================================================
// ACTUALIZAR FILA EN SITIO
// =====================================================

function actualizarFila(id, nuevoEstado) {

  const fila = document.querySelector(`tr[data-id="${id}"]`)
  if (!fila) return

  const tdEstado = fila.querySelector('.td-estado')
  if (tdEstado) tdEstado.innerHTML = estadoChip(nuevoEstado)

  const tdAcciones = fila.querySelector('.trd-actions')
  if (!tdAcciones) return

  const estado = nuevoEstado.toLowerCase()

  const btnEditar = estado !== 'incorporada'
    ? `<button class="btn-secondary btn-sm" onclick="editarPropuesta('${id}')">Editar</button>`
    : ''

  const btnAprobar = estado === 'propuesta'
    ? `<button class="btn-success btn-sm" onclick="aprobar('${id}', this)">Aprobar</button>`
    : ''

  const btnRechazar = estado === 'propuesta'
    ? `<button class="btn-danger btn-sm" onclick="rechazar('${id}', this)">Rechazar</button>`
    : ''

  const btnIncorporar = estado === 'aprobada'
    ? `<button class="btn-primary btn-sm btn-incorporar" onclick="incorporar('${id}', this)">Incorporar a TRD</button>`
    : ''

  tdAcciones.innerHTML = `${btnEditar}${btnAprobar}${btnRechazar}${btnIncorporar}`
}

// =====================================================
// GENERAR PROPUESTAS
// =====================================================

async function generarPropuestas() {

  try {

    const resp = await apiFetch('/api/trd-ai/generar-propuestas', { method: 'POST' })
    if (!resp) return
    if (!resp.ok) throw new Error('Error ejecutando el motor')

    const json = await resp.json()
    if (!json.ok) throw new Error(json.error)

    mostrarToast('Motor TRD-AI ejecutado correctamente', 'success')
    await cargarPropuestas()

  } catch (err) {
    console.error(err)
    mostrarToast('No fue posible ejecutar el motor TRD-AI', 'error')
  }
}

// =====================================================
// EDITAR PROPUESTA
// =====================================================

window.editarPropuesta = async function(id) {

  // Obtener datos actuales de la fila
  const fila = document.querySelector(`tr[data-id="${id}"]`)
  if (!fila) return

  const serieActual    = fila.querySelector('.serie-nombre strong')?.textContent || ''
  const subserieActual = fila.querySelector('.subserie')?.textContent?.trim() || ''

  // Extraer tipologías actuales del DOM — ahora son <li> en .tip-lista
  const tipItems = fila.querySelectorAll('td:nth-child(4) .tip-lista li')
  const tipActuales = Array.from(tipItems)
    .map(li => li.textContent.trim())
    .filter(t => t)
    .join('\n')

  const overlay = document.createElement('div')
  overlay.className = 'modal'

  overlay.innerHTML = `
    <div class="modal-content" style="max-width:520px;">
      <h3>Editar propuesta</h3>
      <p style="margin:0 0 16px;font-size:13px;color:var(--color-text-muted);">
        Corrige los nombres o tipologías antes de aprobar e incorporar a la TRD.
      </p>

      <div class="form-group">
        <label>Serie documental</label>
        <input type="text" id="editSerie" class="form-control" value="${serieActual}">
      </div>

      <div class="form-group">
        <label>Subserie documental</label>
        <input type="text" id="editSubserie" class="form-control" value="${subserieActual !== '—' ? subserieActual : ''}">
      </div>

      <div class="form-group">
        <label>Tipos documentales <span style="font-weight:400;color:var(--color-text-muted);">(uno por línea)</span></label>
        <textarea id="editTipologias" class="form-control" style="height:120px;resize:vertical;">${tipActuales}</textarea>
      </div>

      <div class="modal-actions">
        <button class="btn-secondary" id="btnCancelarEditar">Cancelar</button>
        <button class="btn-primary"   id="btnGuardarEditar">Guardar cambios</button>
      </div>
    </div>
  `

  document.body.appendChild(overlay)

  overlay.querySelector('#btnCancelarEditar').addEventListener('click', () => overlay.remove())

  overlay.querySelector('#btnGuardarEditar').addEventListener('click', async () => {

    const serie     = document.getElementById('editSerie').value.trim()
    const subserie  = document.getElementById('editSubserie').value.trim()
    const tipRaw    = document.getElementById('editTipologias').value
    const tipologias = tipRaw.split('\n').map(t => t.trim()).filter(Boolean)

    if (!serie) { mostrarToast('El nombre de la serie es obligatorio', 'error'); return }

    const btn = overlay.querySelector('#btnGuardarEditar')
    btn.disabled = true; btn.textContent = 'Guardando...'

    try {

      const resp = await apiFetch(`/api/trd-ai/series-propuestas/${id}/editar`, {
        method: 'PATCH',
        body: JSON.stringify({
          nombre_serie:         serie,
          nombre_subserie:      subserie || null,
          tipologia_documental: JSON.stringify(tipologias)
        })
      })

      if (!resp || !resp.ok) throw new Error('Error guardando cambios')

      const json = await resp.json()
      if (!json.ok) throw new Error(json.error)

      overlay.remove()
      mostrarToast('Propuesta actualizada', 'success')
      await cargarPropuestas()

    } catch (err) {
      console.error(err)
      mostrarToast('No fue posible guardar los cambios', 'error')
      btn.disabled = false; btn.textContent = 'Guardar cambios'
    }
  })

  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) overlay.remove()
  })
}

// =====================================================
// APROBAR — integra retención automática
// =====================================================

window.aprobar = async function(id, btn) {

  if (btn) { btn.disabled = true; btn.textContent = '...' }

  try {

    // 1. Aprobar la propuesta
    const resp = await apiFetch(
      `/api/trd-ai/series-propuestas/${id}/aprobar`,
      { method: 'PATCH' }
    )
    if (!resp) return
    const json = await resp.json()
    if (!json.ok) throw new Error(json.error)

    // 2. Obtener retención automática en segundo plano
    apiFetch(`/api/trd-ai/series-propuestas/${id}/retencion-automatica`)
      .catch(() => {}) // silencioso si falla

    mostrarToast('Propuesta aprobada', 'success')
    actualizarFila(id, 'aprobada')

  } catch (err) {
    console.error(err)
    mostrarToast('No fue posible aprobar la propuesta', 'error')
    if (btn) { btn.disabled = false; btn.textContent = 'Aprobar' }
  }
}

// =====================================================
// RECHAZAR
// =====================================================

window.rechazar = async function(id, btn) {

  if (btn) { btn.disabled = true; btn.textContent = '...' }

  try {

    const resp = await apiFetch(
      `/api/trd-ai/series-propuestas/${id}/rechazar`,
      { method: 'PATCH' }
    )
    if (!resp) return
    const json = await resp.json()
    if (!json.ok) throw new Error(json.error)

    mostrarToast('Propuesta rechazada', 'warning')
    actualizarFila(id, 'rechazada')

  } catch (err) {
    console.error(err)
    mostrarToast('No fue posible rechazar la propuesta', 'error')
    if (btn) { btn.disabled = false; btn.textContent = 'Rechazar' }
  }
}

// =====================================================
// INCORPORAR
// =====================================================

window.incorporar = async function(id, btn) {

  const confirmado = await confirmarAccion(
    '¿Incorporar esta serie a la TRD oficial? Se creará la entrada en el módulo TRD.'
  )
  if (!confirmado) return

  if (btn) { btn.disabled = true; btn.textContent = 'Incorporando...' }

  try {

    const resp = await apiFetch(
      `/api/trd-ai/series-propuestas/${id}/incorporar`,
      { method: 'POST' }
    )
    if (!resp) return
    const json = await resp.json()
    if (!json.ok) throw new Error(json.error)

    mostrarToast('Serie incorporada a la TRD oficial ✓', 'success')
    actualizarFila(id, 'incorporada')

  } catch (err) {
    console.error(err)
    mostrarToast('No fue posible incorporar la serie: ' + err.message, 'error')
    if (btn) { btn.disabled = false; btn.textContent = 'Incorporar a TRD' }
  }
}

// =====================================================
// MODAL DE CONFIRMACIÓN
// =====================================================

function confirmarAccion(mensaje) {
  return new Promise((resolve) => {

    const overlay = document.createElement('div')
    overlay.className = 'modal'

    overlay.innerHTML = `
      <div class="modal-content" style="max-width:420px;">
        <h3>Confirmar acción</h3>
        <p style="margin:0 0 8px;font-size:14px;color:var(--color-text-muted);">${mensaje}</p>
        <div class="modal-actions">
          <button class="btn-secondary" id="btnCancelarConfirm">Cancelar</button>
          <button class="btn-primary"   id="btnAceptarConfirm" autofocus>Aceptar</button>
        </div>
      </div>
    `

    document.body.appendChild(overlay)

    overlay.querySelector('#btnAceptarConfirm').addEventListener('click', () => {
      overlay.remove(); resolve(true)
    })
    overlay.querySelector('#btnCancelarConfirm').addEventListener('click', () => {
      overlay.remove(); resolve(false)
    })
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) { overlay.remove(); resolve(false) }
    })
  })
}

// =====================================================
// TOAST — usa sistema existente #sipad-notifications
// =====================================================

function mostrarToast(mensaje, tipo = 'info') {

  let contenedor = document.getElementById('sipad-notifications')

  if (!contenedor) {
    contenedor = document.createElement('div')
    contenedor.id = 'sipad-notifications'
    document.body.appendChild(contenedor)
  }

  const toast = document.createElement('div')
  toast.className = `sipad-toast ${tipo}`
  toast.textContent = mensaje
  contenedor.appendChild(toast)

  requestAnimationFrame(() => {
    requestAnimationFrame(() => toast.classList.add('visible'))
  })

  setTimeout(() => {
    toast.classList.remove('visible')
    setTimeout(() => toast.remove(), 300)
  }, 3500)
}