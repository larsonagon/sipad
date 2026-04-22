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
    'Content-Type': 'application/json',
    ...(options.headers || {})
  }

  if (esMasterAdmin()) {
    const eid = sessionStorage.getItem('gestion_entidad_id') ||
                sessionStorage.getItem('entidad_id') || null
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
// ESTADO
// =====================================================

let versionActualId   = null
let dataCCD           = null
let dataTRD           = null

// =====================================================
// INIT
// =====================================================

document.addEventListener('DOMContentLoaded', async () => {

  renderHeader('TRD', sessionStorage.getItem('gestion_entidad_nombre') || null)

  // Botones versiones
  document.getElementById('btnNuevaVersion')
    .addEventListener('click', () => {
      document.getElementById('formNuevaVersion').style.display = 'block'
      document.getElementById('btnNuevaVersion').style.display  = 'none'
    })

  document.getElementById('btnCancelarVersion')
    .addEventListener('click', () => {
      document.getElementById('formNuevaVersion').style.display = 'none'
      document.getElementById('btnNuevaVersion').style.display  = 'inline-flex'
    })

  document.getElementById('btnGuardarVersion')
    .addEventListener('click', crearVersion)

  document.getElementById('btnVolverVersiones')
    .addEventListener('click', volverAVersiones)

  document.getElementById('btnAprobarVersion')
    .addEventListener('click', aprobarVersion)

  // Tabs
  document.getElementById('tabCCD').addEventListener('click', () => activarTab('CCD'))
  document.getElementById('tabTRD').addEventListener('click', () => activarTab('TRD'))

  await cargarVersiones()
})

// =====================================================
// VERSIONES
// =====================================================

async function cargarVersiones() {

  try {
    const resp = await apiFetch('/api/trd/versiones')
    if (!resp) return

    const json = await resp.json()
    const versiones = json.data || []

    renderVersiones(versiones)

  } catch (err) {
    console.error(err)
    mostrarError('Error cargando versiones TRD.')
  }
}

function renderVersiones(versiones) {

  const container = document.getElementById('listaVersiones')

  if (!versiones.length) {
    container.innerHTML = `
      <div style="text-align:center;padding:2rem;color:var(--text-secondary);">
        <p style="margin:0 0 6px;font-weight:500;">No hay versiones TRD creadas aún.</p>
        <p style="margin:0;font-size:.875rem;">Crea la primera versión para comenzar a organizar la TRD.</p>
      </div>
    `
    return
  }

  container.innerHTML = versiones.map(v => `
    <div style="display:flex;align-items:center;justify-content:space-between;
                padding:12px 0;border-bottom:1px solid var(--color-border);"
         class="version-row">
      <div>
        <p style="margin:0 0 3px;font-weight:600;font-size:14px;">${v.nombre_version}</p>
        <p style="margin:0;font-size:12px;color:var(--text-secondary);">
          ${capitalizarModo(v.modo_creacion)} ·
          ${v.total_series || 0} series incorporadas
        </p>
      </div>
      <div style="display:flex;align-items:center;gap:8px;">
        ${badgeEstado(v.estado)}
        <button class="btn-secondary" style="font-size:12px;padding:5px 12px;"
          onclick="abrirVersion('${v.id}', '${escapar(v.nombre_version)}', '${v.estado}')">
          Ver TRD
        </button>
      </div>
    </div>
  `).join('')
}

window.abrirVersion = async function(id, nombre, estado) {

  versionActualId = id

  document.getElementById('vistaVersiones').style.display = 'none'
  document.getElementById('vistaDetalle').style.display   = 'block'
  document.getElementById('tituloVersion').textContent    = nombre
  document.getElementById('badgeEstadoVersion').innerHTML = badgeEstado(estado)

  const btnAprobar = document.getElementById('btnAprobarVersion')
  btnAprobar.style.display = estado === 'borrador' ? 'inline-flex' : 'none'

  activarTab('CCD')
  await cargarCCD(id)
}

function volverAVersiones() {
  versionActualId = null
  dataCCD = null
  dataTRD = null
  document.getElementById('vistaVersiones').style.display = 'block'
  document.getElementById('vistaDetalle').style.display   = 'none'
  cargarVersiones()
}

async function crearVersion() {

  const nombre = document.getElementById('inputNombreVersion').value.trim()
  const modo   = document.getElementById('selectModoCreacion').value

  if (!nombre) { alert('Ingresa un nombre para la versión.'); return }

  try {
    const resp = await apiFetch('/api/trd/versiones', {
      method: 'POST',
      body: JSON.stringify({ nombre_version: nombre, modo_creacion: modo })
    })
    if (!resp) return
    const json = await resp.json()
    if (!json.ok) throw new Error(json.error)

    document.getElementById('inputNombreVersion').value    = ''
    document.getElementById('formNuevaVersion').style.display = 'none'
    document.getElementById('btnNuevaVersion').style.display  = 'inline-flex'
    await cargarVersiones()

  } catch (err) {
    alert('Error creando versión: ' + err.message)
  }
}

async function aprobarVersion() {
  if (!versionActualId) return
  if (!confirm('¿Aprobar esta versión TRD? Una vez aprobada quedará como versión oficial.')) return

  try {
    const resp = await apiFetch(`/api/trd/versiones/${versionActualId}/aprobar`, { method: 'PATCH' })
    if (!resp) return
    const json = await resp.json()
    if (!json.ok) throw new Error(json.error)
    document.getElementById('badgeEstadoVersion').innerHTML = badgeEstado('aprobada')
    document.getElementById('btnAprobarVersion').style.display = 'none'
    alert('Versión aprobada correctamente.')
  } catch (err) {
    alert('Error: ' + err.message)
  }
}

// =====================================================
// TABS
// =====================================================

function activarTab(tab) {

  const esCCD = tab === 'CCD'

  document.getElementById('contenidoCCD').style.display = esCCD ? 'block' : 'none'
  document.getElementById('contenidoTRD').style.display = esCCD ? 'none'  : 'block'

  const estilo = (activo) => activo
    ? 'border-bottom:2px solid var(--color-primary,#1e40af);margin-bottom:-2px;color:var(--color-primary,#1e40af);'
    : 'color:var(--text-secondary);'

  document.getElementById('tabCCD').style.cssText =
    `padding:8px 20px;font-size:13px;font-weight:500;background:none;border:none;cursor:pointer;${estilo(esCCD)}`
  document.getElementById('tabTRD').style.cssText =
    `padding:8px 20px;font-size:13px;font-weight:500;background:none;border:none;cursor:pointer;${estilo(!esCCD)}`

  if (!esCCD && !dataTRD && versionActualId) {
    cargarTRD(versionActualId)
  }
}

// =====================================================
// CCD — Cuadro de Clasificación Documental
// =====================================================

async function cargarCCD(versionId) {

  document.getElementById('ccdContainer').innerHTML =
    `<p style="color:var(--text-secondary);font-size:13px;">Cargando...</p>`

  try {
    const resp = await apiFetch(`/api/trd/versiones/${versionId}/ccd`)
    if (!resp) return
    const json = await resp.json()
    if (!json.ok) throw new Error(json.error)

    dataCCD = json.ccd || []
    renderCCD(dataCCD)

  } catch (err) {
    document.getElementById('ccdContainer').innerHTML =
      `<div class="alert-error">Error cargando CCD: ${err.message}</div>`
  }
}

function renderCCD(grupos) {

  if (!grupos.length) {
    document.getElementById('ccdContainer').innerHTML = `
      <div style="text-align:center;padding:2rem;color:var(--text-secondary);">
        <p style="margin:0 0 6px;font-weight:500;">Sin series incorporadas aún.</p>
        <p style="margin:0;font-size:.875rem;">
          Aprueba propuestas en el módulo TRD-AI y presiona "Incorporar a TRD oficial".
        </p>
      </div>
    `
    return
  }

  document.getElementById('ccdContainer').innerHTML = grupos.map(grupo => `
    <section class="card" style="margin-bottom:1rem;">

      <div style="margin-bottom:1rem;padding-bottom:.75rem;border-bottom:1px solid var(--color-border);">
        <p style="margin:0 0 2px;font-size:11px;font-weight:600;text-transform:uppercase;
                  letter-spacing:.06em;color:var(--text-secondary);">Unidad administrativa</p>
        <p style="margin:0;font-size:15px;font-weight:700;">${grupo.dependencia_nombre}</p>
        ${grupo.macrofuncion ? `<p style="margin:2px 0 0;font-size:12px;color:var(--text-secondary);">${grupo.macrofuncion}</p>` : ''}
      </div>

      <div class="table-container">
        <table class="table" style="font-size:13px;">
          <thead>
            <tr>
              <th style="width:120px;">Código</th>
              <th>Serie documental</th>
              <th>Subserie documental</th>
              <th>Tipos documentales</th>
            </tr>
          </thead>
          <tbody>
            ${grupo.series.map(serie => {

              if (!serie.subseries.length) return `
                <tr>
                  <td style="color:var(--text-secondary);font-size:12px;">${serie.codigo || '—'}</td>
                  <td style="font-weight:600;">${serie.nombre}</td>
                  <td>—</td>
                  <td>—</td>
                </tr>
              `

              return serie.subseries.map((sub, i) => `
                <tr>
                  ${i === 0
                    ? `<td rowspan="${serie.subseries.length}" style="color:var(--text-secondary);font-size:12px;vertical-align:top;">${serie.codigo || '—'}</td>
                       <td rowspan="${serie.subseries.length}" style="font-weight:600;vertical-align:top;">${serie.nombre}</td>`
                    : ''}
                  <td style="padding-left:1rem;">${sub.codigo ? sub.codigo + ' - ' : ''}${sub.nombre}</td>
                  <td style="font-size:12px;color:var(--text-secondary);">
                    ${sub.tipologias.map(t => t.nombre).join(', ') || '—'}
                  </td>
                </tr>
              `).join('')

            }).join('')}
          </tbody>
        </table>
      </div>

    </section>
  `).join('')
}

// =====================================================
// TRD — Tabla de Retención Documental
// =====================================================

async function cargarTRD(versionId) {

  document.getElementById('trdContainer').innerHTML =
    `<p style="color:var(--text-secondary);font-size:13px;">Cargando TRD...</p>`

  try {
    const resp = await apiFetch(`/api/trd/versiones/${versionId}/trd`)
    if (!resp) return
    const json = await resp.json()
    if (!json.ok) throw new Error(json.error)

    dataTRD = json.trd || []
    renderTRD(dataTRD, json.version)

  } catch (err) {
    document.getElementById('trdContainer').innerHTML =
      `<div class="alert-error">Error cargando TRD: ${err.message}</div>`
  }
}

function renderTRD(grupos, version) {

  if (!grupos.length) {
    document.getElementById('trdContainer').innerHTML = `
      <div style="text-align:center;padding:2rem;color:var(--text-secondary);">
        <p style="margin:0;font-weight:500;">Sin series incorporadas aún.</p>
      </div>
    `
    return
  }

  // Cabecera oficial TRD
  const entidadNombre =
    sessionStorage.getItem('gestion_entidad_nombre') ||
    sessionStorage.getItem('entidad_nombre') ||
    'Entidad'

  document.getElementById('trdContainer').innerHTML = grupos.map(grupo => `

    <section class="card" style="margin-bottom:1.5rem;">

      <!-- Encabezado oficial -->
      <div style="border:1px solid var(--color-border);border-radius:6px;
                  overflow:hidden;margin-bottom:1rem;font-size:12px;">

        <div style="display:grid;grid-template-columns:1fr 1fr;
                    background:var(--bg-secondary,#f9fafb);">
          <div style="padding:8px 12px;border-right:1px solid var(--color-border);">
            <span style="font-weight:600;text-transform:uppercase;font-size:11px;">
              Entidad productora
            </span><br>
            ${entidadNombre}
          </div>
          <div style="padding:8px 12px;">
            <span style="font-weight:600;text-transform:uppercase;font-size:11px;">
              Unidad administrativa
            </span><br>
            ${grupo.dependencia_nombre}
          </div>
        </div>

        <div style="display:grid;grid-template-columns:1fr 1fr;
                    border-top:1px solid var(--color-border);">
          <div style="padding:8px 12px;border-right:1px solid var(--color-border);">
            <span style="font-weight:600;text-transform:uppercase;font-size:11px;">
              Versión TRD
            </span><br>
            ${version?.nombre_version || '—'}
          </div>
          <div style="padding:8px 12px;">
            <span style="font-weight:600;text-transform:uppercase;font-size:11px;">
              Estado
            </span><br>
            ${capitalizarPrimera(version?.estado || '')}
          </div>
        </div>

      </div>

      <!-- Tabla TRD oficial -->
      <div class="table-container" style="overflow-x:auto;">
        <table class="table" style="font-size:12px;min-width:700px;">
          <thead>
            <tr>
              <th style="width:80px;">Código</th>
              <th>Series, subseries y tipos documentales</th>
              <th style="text-align:center;width:60px;">AG<br><span style="font-weight:400;font-size:10px;">(años)</span></th>
              <th style="text-align:center;width:60px;">AC<br><span style="font-weight:400;font-size:10px;">(años)</span></th>
              <th style="text-align:center;width:40px;">CT</th>
              <th style="text-align:center;width:40px;">EL</th>
              <th style="text-align:center;width:40px;">MT</th>
              <th style="text-align:center;width:40px;">S</th>
            </tr>
          </thead>
          <tbody>
            ${grupo.series.map(serie => {

              const filas = []

              // Fila de la serie
              filas.push(`
                <tr style="background:var(--bg-secondary,#f9fafb);">
                  <td style="font-size:11px;color:var(--text-secondary);">${serie.codigo || ''}</td>
                  <td style="font-weight:700;text-transform:uppercase;">${serie.nombre}</td>
                  <td style="text-align:center;">${serie.tiempo_gestion ?? '—'}</td>
                  <td style="text-align:center;">${serie.tiempo_central ?? '—'}</td>
                  ${celdaDisposicion(serie.disposicion_final, 'CT')}
                  ${celdaDisposicion(serie.disposicion_final, 'EL')}
                  ${celdaDisposicion(serie.disposicion_final, 'MT')}
                  ${celdaDisposicion(serie.disposicion_final, 'S')}
                </tr>
              `)

              // Filas de subseries
              for (const sub of serie.subseries) {
                filas.push(`
                  <tr>
                    <td style="font-size:11px;color:var(--text-secondary);padding-left:1.5rem;">${sub.codigo || ''}</td>
                    <td style="padding-left:1.5rem;font-weight:500;">${sub.nombre}</td>
                    <td style="text-align:center;">${sub.tiempo_gestion ?? '—'}</td>
                    <td style="text-align:center;">${sub.tiempo_central ?? '—'}</td>
                    ${celdaDisposicion(sub.disposicion_final, 'CT')}
                    ${celdaDisposicion(sub.disposicion_final, 'EL')}
                    ${celdaDisposicion(sub.disposicion_final, 'MT')}
                    ${celdaDisposicion(sub.disposicion_final, 'S')}
                  </tr>
                `)

                // Tipos documentales
                for (const tip of sub.tipologias) {
                  filas.push(`
                    <tr>
                      <td></td>
                      <td style="padding-left:3rem;font-size:11px;color:var(--text-secondary);">
                        • ${tip.nombre}
                      </td>
                      <td colspan="6"></td>
                    </tr>
                  `)
                }
              }

              return filas.join('')

            }).join('')}
          </tbody>
        </table>
      </div>

      <!-- Leyenda -->
      <p style="margin:8px 0 0;font-size:11px;color:var(--text-secondary);">
        <strong>AG</strong>: Archivo de Gestión &nbsp;|&nbsp;
        <strong>AC</strong>: Archivo Central &nbsp;|&nbsp;
        <strong>CT</strong>: Conservación Total &nbsp;|&nbsp;
        <strong>EL</strong>: Eliminación &nbsp;|&nbsp;
        <strong>MT</strong>: Microfilmación/Digitalización &nbsp;|&nbsp;
        <strong>S</strong>: Selección
      </p>

    </section>

  `).join('')
}

// =====================================================
// HELPERS
// =====================================================

function celdaDisposicion(disposicion, tipo) {
  const marcado = (disposicion || '').toUpperCase() === tipo
  return `<td style="text-align:center;">${marcado ? '✓' : ''}</td>`
}

function badgeEstado(estado) {
  const estilos = {
    borrador   : 'background:#f3f4f6;color:#374151;',
    en_revision: 'background:#fef3c7;color:#92400e;',
    aprobada   : 'background:#d1fae5;color:#065f46;',
    derogada   : 'background:#fee2e2;color:#991b1b;'
  }
  const estilo = estilos[estado] || estilos.borrador
  return `<span style="display:inline-block;padding:2px 8px;border-radius:99px;
    font-size:11px;font-weight:600;${estilo}">${capitalizarPrimera(estado)}</span>`
}

function capitalizarModo(modo) {
  const modos = { manual: 'Manual', asistido: 'Asistido (TRD-AI)', mixto: 'Mixto' }
  return modos[modo] || modo
}

function capitalizarPrimera(s) {
  if (!s) return ''
  return s.charAt(0).toUpperCase() + s.slice(1)
}

function escapar(s) {
  return (s || '').replace(/'/g, "\\'")
}

function mostrarError(msg) {
  document.getElementById('errorMsg').innerHTML =
    `<div class="alert-error" style="margin-top:1rem;">${msg}</div>`
}