// ======================================================
// SIPAD · Carga masiva de actividades (ICAF) – frontend
// ======================================================

const $ = id => document.getElementById(id)

const getToken = () => sessionStorage.getItem('token')

if (!getToken()) window.location.href = '/'

function esMasterAdmin() {
  const token = getToken()
  if (!token) return false
  try {
    const p = JSON.parse(atob(token.split('.')[1]))
    return p.es_master_admin === true || p.es_master_admin === 1
  } catch { return false }
}

function baseHeaders(extra = {}) {
  const headers = { Authorization: `Bearer ${getToken()}`, ...extra }
  if (esMasterAdmin()) {
    const entidadId =
      sessionStorage.getItem('gestion_entidad_id') ||
      sessionStorage.getItem('entidad_id') || null
    if (entidadId) headers['X-Entidad-Id'] = entidadId
  }
  return headers
}

// ------------------------------------------------------
// PASO 1 · Descargar plantilla (con auth → blob)
// ------------------------------------------------------

$('btnPlantilla').addEventListener('click', async () => {
  const btn = $('btnPlantilla')
  const original = btn.textContent
  btn.disabled = true
  btn.textContent = 'Generando...'
  try {
    const res = await fetch('/api/segtec/importar/plantilla', { headers: baseHeaders() })
    if (!res.ok) throw new Error('No se pudo descargar la plantilla')
    const blob = await res.blob()
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'plantilla-actividades-sipad.xlsx'
    document.body.appendChild(a)
    a.click()
    a.remove()
    URL.revokeObjectURL(url)
  } catch (e) {
    alert(e.message || 'Error descargando la plantilla')
  } finally {
    btn.disabled = false
    btn.textContent = original
  }
})

// ------------------------------------------------------
// PASO 2 · Selección de archivo
// ------------------------------------------------------

let archivoBase64 = null

const drop = $('drop')
const fileInput = $('file')

function leerArchivo(file) {
  if (!file) return
  const okExt = /\.xlsx$/i.test(file.name)
  if (!okExt) { alert('El archivo debe ser .xlsx'); return }

  $('fileName').textContent = file.name
  $('btnImportar').disabled = true
  $('estado').textContent = 'Leyendo archivo...'

  const reader = new FileReader()
  reader.onload = () => {
    archivoBase64 = reader.result   // data:...;base64,XXXX
    $('btnImportar').disabled = false
    $('estado').textContent = 'Listo para importar'
  }
  reader.onerror = () => { $('estado').textContent = 'No se pudo leer el archivo' }
  reader.readAsDataURL(file)
}

fileInput.addEventListener('change', e => leerArchivo(e.target.files[0]))

;['dragenter', 'dragover'].forEach(ev =>
  drop.addEventListener(ev, e => { e.preventDefault(); drop.classList.add('drag') }))
;['dragleave', 'drop'].forEach(ev =>
  drop.addEventListener(ev, e => { e.preventDefault(); drop.classList.remove('drag') }))
drop.addEventListener('drop', e => {
  const f = e.dataTransfer?.files?.[0]
  if (f) { fileInput.files = e.dataTransfer.files; leerArchivo(f) }
})

// ------------------------------------------------------
// PASO 2 · Importar
// ------------------------------------------------------

$('btnImportar').addEventListener('click', async () => {
  if (!archivoBase64) return
  const btn = $('btnImportar')
  btn.disabled = true
  $('estado').textContent = 'Importando... esto puede tardar unos segundos'

  try {
    const res = await fetch('/api/segtec/importar', {
      method: 'POST',
      headers: baseHeaders({ 'Content-Type': 'application/json' }),
      body: JSON.stringify({ archivoBase64 })
    })
    const json = await res.json().catch(() => null)
    if (!res.ok || !json?.ok) {
      throw new Error(json?.error || 'Error importando el archivo')
    }
    mostrarResumen(json.resumen)
  } catch (e) {
    $('estado').textContent = ''
    alert(e.message || 'Error importando')
    btn.disabled = false
  }
})

// ------------------------------------------------------
// Resultado
// ------------------------------------------------------

function mostrarResumen(r) {
  $('estado').textContent = ''
  $('resumen').classList.remove('hidden')

  $('nCreadas').textContent = r.creadas ?? 0
  $('nDeps').textContent = r.dependenciasNuevas ?? 0
  $('nErrores').textContent = (r.errores?.length) ?? 0

  const nombres = r.nombresDependenciasNuevas || []
  $('depsNuevas').textContent = nombres.length
    ? `Dependencias creadas automáticamente: ${nombres.join(', ')}`
    : ''

  const errBox = $('errBox')
  const ul = $('errUl')
  ul.innerHTML = ''
  if (r.errores?.length) {
    r.errores.forEach(e => {
      const li = document.createElement('li')
      li.textContent = `Fila ${e.fila}: ${e.error}`
      ul.appendChild(li)
    })
    errBox.classList.remove('hidden')
  } else {
    errBox.classList.add('hidden')
  }

  $('resumen').scrollIntoView({ behavior: 'smooth', block: 'start' })
}

$('btnOtra').addEventListener('click', () => {
  archivoBase64 = null
  fileInput.value = ''
  $('fileName').textContent = ''
  $('btnImportar').disabled = true
  $('estado').textContent = ''
  $('resumen').classList.add('hidden')
  window.scrollTo({ top: 0, behavior: 'smooth' })
})
