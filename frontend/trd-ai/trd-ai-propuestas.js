import { renderHeader } from '../components/header.js'

document.addEventListener('DOMContentLoaded', async () => {

  const token = sessionStorage.getItem('token')

  if (!token) {
    window.location.href = '/'
    return
  }

  const user = JSON.parse(localStorage.getItem('user') || '{}')

  renderHeader({
    modulo:'TRD-AI',
    seccion:'Propuestas',
    usuario:user.nombre || 'Usuario'
  })

  document
    .getElementById('btnGenerarPropuestas')
    ?.addEventListener('click', generarPropuestas)

  await cargarPropuestas()

})



// =====================================================
// API
// =====================================================

async function apiFetch(url, options = {}) {

  const token = sessionStorage.getItem('token')

  const headers = {
    Authorization:`Bearer ${token}`,
    ...(options.headers || {})
  }

  if(options.body){
    headers['Content-Type'] = 'application/json'
  }

  const resp = await fetch(url,{
    ...options,
    headers
  })

  if(resp.status === 401){

    sessionStorage.clear()
    localStorage.clear()
    window.location.href = '/'
    return null

  }

  return resp

}



// =====================================================
// CARGAR PROPUESTAS
// =====================================================

async function cargarPropuestas(){

  try{

    const resp = await apiFetch('/api/trd-ai/series-propuestas')

    if(!resp) return

    if(!resp.ok){
      throw new Error('Error cargando propuestas')
    }

    const json = await resp.json()

    if(!json.ok){
      throw new Error(json.error)
    }

    renderTabla(json.data)

  }catch(err){

    console.error(err)
    alert('No fue posible cargar las propuestas')

  }

}



// =====================================================
// UTILIDADES
// =====================================================

function capitalizar(texto){

  if(!texto) return '-'

  const limpio = texto.toString().toLowerCase().trim()

  return limpio.charAt(0).toUpperCase() + limpio.slice(1)

}



function estadoChip(estado){

  const e = (estado || '').toLowerCase()

  if(e === 'aprobada')
    return `<span class="estado-chip estado-aprobada">Aprobada</span>`

  if(e === 'rechazada')
    return `<span class="estado-chip estado-rechazada">Rechazada</span>`

  return `<span class="estado-chip estado-propuesta">Propuesta</span>`

}



// =====================================================
// AGRUPAR POR SERIE + SUBSERIE
// =====================================================

function agruparSeries(lista){

  const mapa = {}

  lista.forEach(p => {

    const serie = p.nombre_serie || 'Serie sin nombre'
    const subserie = p.nombre_subserie || ''

    const key = `${serie}__${subserie}`

    if(!mapa[key]){

      mapa[key] = {
        serie,
        subserie,
        estado: p.estado || 'propuesta',
        cantidad: 0,
        ids: []
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

function renderTabla(lista){

  const tbody = document.getElementById('tablaPropuestas')

  if(!lista || !lista.length){

    tbody.innerHTML =
      `<tr>
        <td colspan="5">No hay propuestas registradas</td>
      </tr>`

    return
  }

  const agrupadas = agruparSeries(lista)

  let html=''

  agrupadas.forEach(p=>{

    const idAccion = p.ids[0]

    html+=`

<tr>

<td class="serie-nombre">
<strong>${p.serie}</strong>
</td>

<td class="subserie">
${p.subserie || '-'}
</td>

<td>
${p.cantidad}
</td>

<td>
${estadoChip(p.estado)}
</td>

<td class="trd-actions">

<button
class="btn-aprobar"
onclick="aprobar('${idAccion}')">
Aprobar
</button>

<button
class="btn-rechazar"
onclick="rechazar('${idAccion}')">
Rechazar
</button>

<button
class="btn-retencion"
onclick="retencion('${idAccion}')">
Retención
</button>

</td>

</tr>
`

  })

  tbody.innerHTML = html

}



// =====================================================
// GENERAR PROPUESTAS
// =====================================================

async function generarPropuestas(){

  try{

    const resp = await apiFetch(
      '/api/trd-ai/generar-propuestas',
      { method:'POST' }
    )

    if(!resp) return

    if(!resp.ok){
      throw new Error('Error ejecutando el motor')
    }

    const json = await resp.json()

    if(!json.ok){
      throw new Error(json.error)
    }

    alert('Motor TRD-AI ejecutado correctamente')

    await cargarPropuestas()

  }catch(err){

    console.error(err)
    alert('No fue posible ejecutar el motor TRD-AI')

  }

}



// =====================================================
// ACCIONES
// =====================================================

window.aprobar = async function(id){

  try{

    const resp = await apiFetch(
      `/api/trd-ai/series-propuestas/${id}/aprobar`,
      { method:'PATCH' }
    )

    if(!resp) return

    if(!resp.ok){
      throw new Error('Error aprobando propuesta')
    }

    const json = await resp.json()

    if(!json.ok){
      throw new Error(json.error)
    }

    alert('Propuesta aprobada')

    await cargarPropuestas()

  }catch(err){

    console.error(err)
    alert('No fue posible aprobar la propuesta')

  }

}



window.rechazar = async function(id){

  try{

    const resp = await apiFetch(
      `/api/trd-ai/series-propuestas/${id}/rechazar`,
      { method:'PATCH' }
    )

    if(!resp) return

    if(!resp.ok){
      throw new Error('Error rechazando propuesta')
    }

    const json = await resp.json()

    if(!json.ok){
      throw new Error(json.error)
    }

    alert('Propuesta rechazada')

    await cargarPropuestas()

  }catch(err){

    console.error(err)
    alert('No fue posible rechazar la propuesta')

  }

}



window.retencion = async function(id){

  try{

    const resp = await apiFetch(
      `/api/trd-ai/series-propuestas/${id}/retencion-automatica`
    )

    if(!resp) return

    if(!resp.ok){
      throw new Error('Error generando retención')
    }

    const json = await resp.json()

    if(!json.ok){
      throw new Error(json.error)
    }

    const regla = json.data || {}

    const gestion = regla.retencion_gestion ?? '-'
    const central = regla.retencion_central ?? '-'
    const disposicion = regla.disposicion_final ?? '-'
    const norma = regla.fundamento_normativo ?? 'No especificado'

    alert(
`RETENCIÓN DOCUMENTAL SUGERIDA

Archivo de Gestión: ${gestion} años
Archivo Central: ${central} años
Disposición final: ${disposicion}

Fundamento normativo:
${norma}`
    )

  }catch(err){

    console.error(err)
    alert('No fue posible generar la retención automática')

  }

}