import { notify } from '/components/notifications.js'

// ======================================================
// SEG-TEC – Vista única actividad
// ======================================================

function notifySafe(message,type="success"){
try{
if(typeof notify === "function"){
notify(message,type)
return
}
}catch(e){}
console.log(message)
}

// ======================================================
// TOAST
// ======================================================

function showToast(message, type = 'success') {

const toast = document.createElement('div');
toast.innerText = message;

toast.style.position = 'fixed';
toast.style.top = '50%';
toast.style.left = '50%';
toast.style.transform = 'translate(-50%, -50%) scale(0.95)';
toast.style.padding = '16px 22px';
toast.style.borderRadius = '8px';
toast.style.fontSize = '15px';
toast.style.fontWeight = '500';
toast.style.color = 'white';
toast.style.opacity = '0';
toast.style.transition = 'all 0.25s ease';
toast.style.zIndex = '9999';
toast.style.boxShadow = '0 10px 25px rgba(0,0,0,0.15)';
toast.style.background =
type === 'error' ? '#c82333' :
type === 'warning' ? '#e0a800' :
'#1e7e34';

document.body.appendChild(toast);

setTimeout(() => {
toast.style.opacity = '1';
toast.style.transform = 'translate(-50%, -50%) scale(1)';
}, 10);

setTimeout(() => {
toast.style.opacity = '0';
toast.style.transform = 'translate(-50%, -50%) scale(0.95)';
setTimeout(() => toast.remove(), 300);
}, 1600);

}

// ======================================================

const token = sessionStorage.getItem('token')

if (!token)
window.location.href = '/login.html'

const params = new URLSearchParams(window.location.search)

let actividadId = params.get('id')

const $ = id => document.getElementById(id)

// ======================================================
// ELEMENTOS UI
// ======================================================

const badge = $('badgeEstado')
const btnGuardar = $('guardarActividadCompleta')
const btnCancelar = $('btnCancelar')

const nombre = $('nombre')
const cargoEjecutor = $('cargoEjecutor')
const clasificacion = $('clasificacion')
const periodicidad = $('periodicidad')
const descripcion = $('descripcion')

const generaDoc = $('generaDoc')
const documentosGenerados = $('documentosGenerados')
const formato = $('formato')
const recepcionExterna = $('recepcionExterna')

const volumenCategoria = $('volumenCategoria')
const volumenAnualPersonalizado = $('volumenAnualPersonalizado')
const grupoVolumenAnual = $('grupoVolumenAnual')

const custodiaTipo = $('custodiaTipo')
const dependenciaCustodia = $('dependenciaCustodia')
const grupoDependenciaCustodia = $('grupoDependenciaCustodia')
const cargoCustodia = $('cargoCustodia')

const localizacionTipo = $('localizacionTipo')
const localizacionOtro = $('localizacionOtro')

const pasosFormales = $('pasosFormales')
const otrasDep = $('otrasDep')
const normaAplicable = $('normaAplicable')

const selectDependencia = $('selectDependencia')
const tagsContainer = $('dependenciasTags')

const tienePlazo = $('tienePlazo')
const plazoLegal = $('plazoLegal')
const tiempoPromedio = $('tiempoPromedio')
const generaExpediente = $('generaExpediente')

// ======================================================

let dependenciasSeleccionadas = []
let estadoActual = "borrador"

// ======================================================
// VALIDACIÓN (NUEVO – NO INTRUSIVO)
// ======================================================

function validarActividad(){

  const errores = []
  const v = (el) => el?.value?.trim()

  if(!v(nombre))
    errores.push('1. Nombre de la actividad es obligatorio')

  if(!v(clasificacion))
    errores.push('2. Clasificación funcional es obligatoria')

  if(!v(periodicidad))
    errores.push('3. Periodicidad es obligatoria')

  if(!v(generaDoc))
    errores.push('5. Debe indicar si genera documentos')

  if(!v(formato))
    errores.push('7. Formato de producción es obligatorio')

  if(!v(custodiaTipo))
    errores.push('10. Responsabilidad de custodia es obligatoria')

  if(!v(cargoCustodia))
    errores.push('10a. Cargo responsable de custodia es obligatorio')

  if(!v(localizacionTipo))
    errores.push('11. Localización de documentos es obligatoria')

  if(!v(pasosFormales))
    errores.push('13. Debe indicar si tiene pasos formales')

  if(!v(otrasDep))
    errores.push('14. Debe indicar si requiere otras dependencias')

  if(!v(tienePlazo))
    errores.push('15. Debe indicar si tiene plazo')

  if(!v(generaExpediente))
    errores.push('16. Debe indicar si genera expediente')

  if(generaDoc.value === 'si'){
    if(!v(documentosGenerados))
      errores.push('6. Debe especificar los documentos generados')
  }

  if(otrasDep.value === 'si'){
    if(dependenciasSeleccionadas.length === 0)
      errores.push('14a. Debe indicar las dependencias relacionadas')
  }

  if(errores.length > 0){
    showToast(errores.join('\n'), 'warning')
    return false
  }

  return true
}

// ======================================================
// CONTROL DEPENDENCIAS
// ======================================================

function actualizarDependenciasUI(){

const requiere = otrasDep.value === "si"

selectDependencia.disabled = !requiere

if(!requiere){
dependenciasSeleccionadas = []
renderTags()
}

}

otrasDep?.addEventListener("change", actualizarDependenciasUI)

// ======================================================
// CONTROL VOLUMEN
// ======================================================

function actualizarVolumenUI(){

const mostrar = volumenCategoria.value === "anual"

if(grupoVolumenAnual)
grupoVolumenAnual.style.display =
mostrar ? "block":"none"

}

volumenCategoria?.addEventListener("change", actualizarVolumenUI)

// ======================================================
// CONTROL CUSTODIA
// ======================================================

function actualizarCustodiaUI(){

const mostrar = custodiaTipo.value === "otra_dependencia"

if(grupoDependenciaCustodia)
grupoDependenciaCustodia.style.display =
mostrar ? "block":"none"

}

custodiaTipo?.addEventListener("change", actualizarCustodiaUI)

// ======================================================
// CONTROL PLAZO
// ======================================================

function actualizarPlazoUI(){

const mostrar = tienePlazo.value === "si"

plazoLegal.parentElement.style.display =
mostrar ? "block":"none"

tiempoPromedio.parentElement.style.display =
mostrar ? "block":"none"

}

tienePlazo?.addEventListener("change", actualizarPlazoUI)

// ======================================================
// SELECCIONAR DEPENDENCIA
// ======================================================

selectDependencia?.addEventListener("change",()=>{

const id = selectDependencia.value
if(!id) return

const nombre =
selectDependencia.options[
selectDependencia.selectedIndex
].textContent

const existe =
dependenciasSeleccionadas.find(d=>String(d.id)===String(id))

if(!existe){

dependenciasSeleccionadas.push({
id,
nombre
})

renderTags()

}

selectDependencia.value=""

})

// ======================================================
// ELIMINAR TAG
// ======================================================

tagsContainer?.addEventListener("click",(e)=>{

if(!e.target.classList.contains("tag-remove")) return

const id = e.target.dataset.id

dependenciasSeleccionadas =
dependenciasSeleccionadas.filter(
d=>String(d.id)!==String(id)
)

renderTags()

})

// ======================================================
// BLOQUEAR FORMULARIO
// ======================================================

function bloquearFormulario(){

document
.querySelectorAll("input,select,textarea")
.forEach(el=>el.disabled=true)

btnGuardar.style.display="none"

}

// ======================================================
// CARGO DESDE TOKEN
// ======================================================

function cargarCargoUsuarioLocal(){

try{

const payload =
JSON.parse(atob(token.split('.')[1]))

const cargo =
payload.cargo ||
payload.cargo_nombre ||
payload.nombre_cargo ||
""

if(cargo){
cargoEjecutor.value = cargo
}

}catch(e){}

}

// ======================================================

function normalizarBoolean(valor){
return (
valor === true ||
valor === 1 ||
valor === "1" ||
valor === "true" ||
valor === "si"
)
}

// ======================================================
// FETCH
// ======================================================

async function fetchSeguro(url, options = {}) {

const res = await fetch(url,{
...options,
headers:{
'Content-Type':'application/json',
Authorization:`Bearer ${token}`
}
})

const text = await res.text()

let json

try { json = JSON.parse(text) }
catch { throw new Error(text) }

if(!res.ok)
throw new Error(json.error || 'Error servidor')

return json

}

// ======================================================
// CREAR ACTIVIDAD
// ======================================================

async function asegurarActividad(){

if(actividadId) return actividadId

const res = await fetchSeguro('/api/segtec/actividades',{
method:'POST',
body:JSON.stringify({
nombre: nombre.value || "Actividad en edición"
})
})

actividadId = res.data?.id || res.id

return actividadId

}

// ======================================================
// DEPENDENCIAS
// ======================================================

async function cargarDependencias(){

const data = await fetchSeguro('/api/dependencias')

selectDependencia.innerHTML =
'<option value="">Seleccione dependencia...</option>'

dependenciaCustodia.innerHTML =
'<option value="">Seleccione dependencia...</option>'

data.forEach(dep=>{

if(dep.activa !== 1) return

const opt=document.createElement('option')
opt.value = dep.id
opt.textContent = dep.nombre
selectDependencia.appendChild(opt)

const opt2 = opt.cloneNode(true)
dependenciaCustodia.appendChild(opt2)

})

}

// ======================================================
// CARGOS
// ======================================================

async function cargarCargos(){

const resp = await fetchSeguro('/api/cargos')

const data = resp.data || resp

cargoCustodia.innerHTML =
'<option value="">Seleccione cargo...</option>'

data.forEach(cargo => {

if(cargo.estado === 0) return

const opt = document.createElement('option')

opt.value = cargo.id
opt.textContent = cargo.nombre

cargoCustodia.appendChild(opt)

})

}

// ======================================================
// TAGS
// ======================================================

function renderTags(){

tagsContainer.innerHTML=''

dependenciasSeleccionadas.forEach(dep=>{

const tag=document.createElement('div')
tag.className='tag-item'

tag.innerHTML = `
${dep.nombre}
<span class="tag-remove" data-id="${dep.id}">✕</span>
`

tagsContainer.appendChild(tag)

})

}

// ======================================================
// NORMALIZAR DEPENDENCIAS
// ======================================================

function normalizarDependencias(valor){

if(!valor) return []

if(Array.isArray(valor)) return valor

if(typeof valor === "string"){
try{
return JSON.parse(valor)
}catch{
return []
}
}

return []

}

// ======================================================
// CARGAR ACTIVIDAD
// ======================================================

async function cargarActividad(){

if(!actividadId) return

const json =
await fetchSeguro(`/api/segtec/actividades/${actividadId}`)

const act = json.data ?? json

estadoActual = act.estado_general || "borrador"

nombre.value = act.nombre ?? ""
clasificacion.value = act.tipo_funcion ?? ""
periodicidad.value = act.frecuencia ?? ""
descripcion.value = act.descripcion_funcional ?? ""

generaDoc.value =
normalizarBoolean(act.genera_documentos) ? "si":"no"

documentosGenerados.value =
act.documentos_generados ?? ""

formato.value =
act.formato_produccion ?? ""

recepcionExterna.value =
act.recepcion_externa ?? ""

function setSelect(select, value){

if(!value) return

const val = String(value).trim().toLowerCase()

const opt =
[...select.options]
.find(o => o.value.trim().toLowerCase() === val)

if(opt){
select.value = opt.value
}

}

setSelect(volumenCategoria, act.volumen_documental ?? act.volumen_categoria)

volumenAnualPersonalizado.value =
act.volumen_anual_personalizado ?? ""

setSelect(custodiaTipo, act.responsable_custodia ?? act.custodia_tipo)

if(act.cargo_custodia){
const optCargo =
[...cargoCustodia.options]
.find(o => String(o.value) === String(act.cargo_custodia))

if(optCargo){
cargoCustodia.value = optCargo.value
}
}

dependenciaCustodia.value =
act.dependencia_custodia ?? ""

setSelect(localizacionTipo, act.localizacion_documentos ?? act.localizacion_tipo)

localizacionOtro.value =
act.localizacion_otro ?? ""

plazoLegal.value =
act.plazo_legal ?? ""

tiempoPromedio.value =
act.tiempo_ejecucion ?? ""

generaExpediente.value =
normalizarBoolean(act.genera_expediente_propio) ? "si":"no"

pasosFormales.value =
normalizarBoolean(act.tiene_pasos_formales) ? "si":"no"

otrasDep.value =
normalizarBoolean(act.requiere_otras_dependencias) ? "si":"no"

tienePlazo.value =
normalizarBoolean(act.tiene_plazo) ? "si":"no"

normaAplicable.value =
act.norma_aplicable ?? ""

const depsGuardadas =
normalizarDependencias(act.dependencias_relacionadas)

dependenciasSeleccionadas = depsGuardadas.map(dep => {

if(typeof dep === "object"){
return {
id: dep.id,
nombre: dep.nombre
}
}

const option =
[...selectDependencia.options]
.find(o => String(o.value) === String(dep))

return {
id: dep,
nombre: option ? option.textContent : `Dependencia ${dep}`
}

})

renderTags()

actualizarDependenciasUI()
actualizarPlazoUI()
actualizarCustodiaUI()
actualizarVolumenUI()

badge.innerText =
(estadoActual || "borrador").toUpperCase()

if(
estadoActual === "caracterizada" ||
estadoActual === "analizada"
){
bloquearFormulario()
}

}

// ======================================================
// GUARDAR
// ======================================================

btnGuardar?.addEventListener('click',async()=>{

if(!validarActividad()) return

try{

await asegurarActividad()

await fetchSeguro(`/api/segtec/actividades/${actividadId}/bloque1`,{
method:'PUT',
body:JSON.stringify({
nombre:nombre.value,
tipo_funcion:clasificacion.value,
frecuencia:periodicidad.value,
descripcion_funcional:descripcion.value
})
})

await fetchSeguro(`/api/segtec/actividades/${actividadId}/bloque2`,{
method:'PUT',
body:JSON.stringify({

genera_documentos:generaDoc.value==="si",
documentos_generados:documentosGenerados.value,
formato_produccion:formato.value,
recepcion_externa:recepcionExterna.value || null,

volumen_documental:volumenCategoria.value,
volumen_anual_personalizado:volumenAnualPersonalizado.value,

responsable_custodia:custodiaTipo.value,
cargo_custodia:cargoCustodia.value,
dependencia_custodia:dependenciaCustodia.value,

localizacion_documentos:localizacionTipo.value,
localizacion_otro:localizacionOtro.value

})
})

await fetchSeguro(`/api/segtec/actividades/${actividadId}/bloque3`,{
method:'PUT',
body:JSON.stringify({

tiene_pasos_formales:pasosFormales.value==="si",
requiere_otras_dependencias:otrasDep.value==="si",

tiene_plazo:tienePlazo.value==="si",

plazo_legal:plazoLegal.value,
tiempo_ejecucion:tiempoPromedio.value,

genera_expediente_propio:generaExpediente.value==="si",

norma_aplicable:normaAplicable.value,

dependencias_relacionadas:
dependenciasSeleccionadas.map(d=>d.id)

})
})

showToast("Actividad guardada correctamente")

setTimeout(()=>{
window.location.href='/segtec/segtec.html'
},1700)

}catch(err){

console.error(err)
showToast("Error al guardar","error")

}

})

// ======================================================
// CANCELAR
// ======================================================

btnCancelar?.addEventListener('click',()=>{
window.location.href='/segtec/segtec.html'
})

// ======================================================
// INIT
// ======================================================

async function init(){

await cargarDependencias()
await cargarCargos()

cargarCargoUsuarioLocal()

await cargarActividad()

actualizarDependenciasUI()
actualizarPlazoUI()
actualizarCustodiaUI()
actualizarVolumenUI()

if(!actividadId)
badge.innerText="NUEVA"

}

init()