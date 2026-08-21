import { renderHeader } from '../components/header.js'

// ================= AUTH / FETCH =================
const getToken = () => sessionStorage.getItem('token')
function esMaster(){ try{const p=JSON.parse(atob(getToken().split('.')[1]));return p.es_master_admin===true||p.es_master_admin===1}catch{return false} }
function headers(extra={}){
  const h={Authorization:`Bearer ${getToken()}`,'Content-Type':'application/json',...extra}
  if(esMaster()){const e=sessionStorage.getItem('gestion_entidad_id')||sessionStorage.getItem('entidad_id');if(e)h['X-Entidad-Id']=e}
  return h
}
async function api(url,opts={}){
  const r=await fetch(url,{...opts,headers:headers(opts.headers||{})})
  if(r.status===401){sessionStorage.clear();location.href='/';return null}
  if(!r.ok)throw new Error(await r.text()||`Error ${r.status}`)
  return r.status===204?null:r.json()
}
const esc=s=>(s??'').toString().replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]))

// ================= CATÁLOGO DE VALORES (modelo normativo) =================
const PRIMARIOS = [
  ['administrativo','Administrativo','Utilidad para la gestión mientras el asunto sigue vigente'],
  ['legal','Legal / probatorio','Sirve como prueba ante instancias judiciales o de control'],
  ['juridico','Jurídico','Deriva o soporta derechos y obligaciones'],
  ['contable','Contable','Evidencia el manejo de recursos y registros contables'],
  ['fiscal','Fiscal','Soporta la fiscalización presupuestal y el control fiscal'],
  ['tecnico','Técnico','Valor por el conocimiento técnico que contiene']
]
const SECUNDARIOS = [
  ['historico','Histórico','Testimonio de hechos o procesos relevantes'],
  ['cientifico','Científico / investigativo','Potencial para investigación académica'],
  ['cultural','Cultural','Refleja prácticas, costumbres o identidad'],
  ['patrimonial','Patrimonial / testimonial','Herencia documental; testimonio único e irremplazable']
]
const NIVELES = ['','alto','medio','bajo','selectivo','na']
const NIVEL_LABEL = {'':'—',alto:'Alto',medio:'Medio',bajo:'Bajo',selectivo:'Selectivo',na:'No aplica'}
const REGLAS = ['Expediente activo','Actuaciones pendientes','Estado registral desconocido','Unicidad (no recuperable de otras fuentes)']
const DISPOSICIONES = [
  ['CT','Conservación Total','Tiene valores secundarios → transferencia secundaria y conservación permanente'],
  ['S','Selección','Solo una parte tiene interés → muestreo + criterios cualitativos'],
  ['E','Eliminación','Agotados los primarios y sin secundarios → procedimiento con comité, inventario, acta y publicación 60 días'],
  ['M','Medio tecnológico','Reproducción/digitalización para preservación y acceso (no sustituye la valoración)']
]
const METODOS = ['por ejemplares','cualitativo / selectivo','sistemático / cuantitativo','aleatorio','estratificado sistemático + criterios cualitativos']

// ================= ESTADO =================
let fichaId = null
let ficha = {}

document.addEventListener('DOMContentLoaded', async ()=>{
  if(!getToken()){location.href='/';return}
  renderHeader('Valoración')
  document.getElementById('btnNueva').addEventListener('click',()=>nuevaFicha())
  document.getElementById('btnVolver').addEventListener('click',mostrarLista)
  await cargarLista()
  // Abrir directo una ficha si viene ?id= (p. ej. tras generar borrador)
  const id = new URLSearchParams(location.search).get('id')
  if (id) abrir(id)
})

// ================= LISTA =================
async function cargarLista(){
  const cont=document.getElementById('lista')
  try{
    const j=await api('/api/valoracion/fichas'); if(!j)return
    const items=j.data||[]
    cont.innerHTML = items.length ? items.map(f=>{
      const d=(f.disposicion_final||'').toLowerCase()
      return `<div class="fv-list-item">
        <div>
          <div style="font-weight:600;">${esc(f.serie||'—')} · ${esc(f.subserie||'(sin subserie)')}</div>
          <div class="muted">${f.tiempo_gestion??'?'}+${f.tiempo_central??'?'} años · estado: ${esc(f.estado||'')}</div>
        </div>
        <div style="display:flex;gap:10px;align-items:center;">
          ${f.disposicion_final?`<span class="tag ${d}">${esc(f.disposicion_final)}</span>`:''}
          <button class="btn-secondary" data-id="${f.id}">Abrir</button>
        </div>
      </div>`
    }).join('') : `<p class="muted">Aún no hay fichas. Crea una nueva.</p>`
    cont.querySelectorAll('button[data-id]').forEach(b=>b.addEventListener('click',()=>abrir(b.dataset.id)))
  }catch(e){console.error(e);cont.innerHTML='<p class="muted">Error cargando fichas.</p>'}
}

// ================= CREAR / ABRIR =================
async function nuevaFicha(){
  try{
    const j=await api('/api/valoracion/fichas',{method:'POST',body:JSON.stringify({estado:'borrador'})})
    if(!j)return
    await abrir(j.id)
  }catch(e){alert('No se pudo crear: '+e.message)}
}
async function abrir(id){
  try{
    const j=await api(`/api/valoracion/fichas/${id}`); if(!j)return
    fichaId=id; ficha=j.data||{}
    renderForm()
    document.getElementById('vistaLista').classList.add('hidden')
    document.getElementById('vistaForm').classList.remove('hidden')
    window.scrollTo(0,0)
  }catch(e){alert(e.message)}
}
function mostrarLista(){
  document.getElementById('vistaForm').classList.add('hidden')
  document.getElementById('vistaLista').classList.remove('hidden')
  fichaId=null; ficha={}; cargarLista()
}

// ================= FORM =================
function valorRow(tipo,[clave,nombre,desc]){
  const arr = ficha[`valores_${tipo}`] || []
  const v = (Array.isArray(arr)?arr:[]).find(x=>x.clave===clave) || {}
  return `<div class="fv-val" data-tipo="${tipo}" data-clave="${clave}">
    <div class="vname">${nombre}<small>${desc}</small></div>
    <select class="form-control v-nivel">${NIVELES.map(n=>`<option value="${n}" ${v.nivel===n?'selected':''}>${NIVEL_LABEL[n]}</option>`).join('')}</select>
    <input type="text" class="form-control v-sustento" placeholder="Sustento" value="${esc(v.sustento||'')}">
  </div>`
}

function renderForm(){
  const f=ficha
  const reglas = Array.isArray(f.reglas_excepcion)?f.reglas_excepcion:[]
  const disp = f.disposicion_final||''
  const bannerMotor = f.origen === 'motor'
    ? `<div style="background:#eff6ff;border:1px solid #bfdbfe;border-radius:10px;padding:12px 14px;margin-bottom:6px;">
         <b>Borrador generado por el motor</b> a partir de la evidencia del levantamiento.
         <span class="muted">Revisa y ajusta cada valor; la propuesta cita la evidencia y la norma.</span>
       </div>` : ''
  document.getElementById('form').innerHTML = bannerMotor + `

  <div class="fv-sec"><h3>Identificación</h3><div class="fv-body fv-grid">
    <div class="fv-field"><label>Serie</label><input id="f_serie" class="form-control" value="${esc(f.serie||'')}"></div>
    <div class="fv-field"><label>Subserie</label><input id="f_subserie" class="form-control" value="${esc(f.subserie||'')}"></div>
    <div class="fv-field"><label>Unidad documental</label><input id="f_unidad_documental" class="form-control" value="${esc(f.unidad_documental||'')}"></div>
    <div class="fv-field"><label>Función / productor</label><input id="f_funcion" class="form-control" value="${esc(f.funcion||'')}"></div>
    <div class="fv-field" style="grid-column:1/3;"><label>Tipologías documentales</label><textarea id="f_tipologias" rows="2" class="form-control">${esc(f.tipologias||'')}</textarea></div>
  </div></div>

  <div class="fv-sec"><h3>Valores primarios</h3><div class="fv-body">
    ${PRIMARIOS.map(p=>valorRow('primarios',p)).join('')}
  </div></div>

  <div class="fv-sec"><h3>Valores secundarios</h3><div class="fv-body">
    ${SECUNDARIOS.map(s=>valorRow('secundarios',s)).join('')}
  </div></div>

  <div class="fv-sec"><h3>Consulta y ciclo vital</h3><div class="fv-body fv-grid">
    <div class="fv-field"><label>Frecuencia de consulta</label><input id="f_frecuencia_consulta" class="form-control" value="${esc(f.frecuencia_consulta||'')}" placeholder="p. ej. varias veces por semana"></div>
    <div class="fv-field"><label>Hecho de cierre</label><input id="f_hecho_cierre" class="form-control" value="${esc(f.hecho_cierre||'')}" placeholder="evento que cierra el expediente"></div>
    <div class="fv-field"><label>Tiempo en Archivo de Gestión (años)</label><input id="f_tiempo_gestion" type="number" min="0" class="form-control" value="${f.tiempo_gestion??''}"></div>
    <div class="fv-field"><label>Tiempo en Archivo Central (años)</label><input id="f_tiempo_central" type="number" min="0" class="form-control" value="${f.tiempo_central??''}"></div>
    <div class="fv-field" style="grid-column:1/3;"><label>Reglas de excepción (bloquean disposición final)</label>
      <div>${REGLAS.map(r=>`<label class="chk"><input type="checkbox" class="f-regla" value="${esc(r)}" ${reglas.includes(r)?'checked':''}> ${r}</label>`).join('')}</div>
    </div>
  </div></div>

  <div class="fv-sec"><h3>Disposición final</h3><div class="fv-body">
    <div>${DISPOSICIONES.map(([c,n,d])=>`<label class="chk" style="display:flex;margin-bottom:6px;">
      <input type="radio" name="disp" class="f-disp" value="${c}" ${disp===c?'checked':''}>
      <span><b>${c} — ${n}.</b> <span class="muted">${d}</span></span></label>`).join('')}</div>
    <div class="fv-field" style="margin-top:10px;"><label>Justificación de la disposición</label><textarea id="f_disposicion_justificacion" rows="2" class="form-control">${esc(f.disposicion_justificacion||'')}</textarea></div>
    <div id="muestreoBox" class="fv-grid" style="margin-top:10px;${disp==='S'?'':'display:none;'}">
      <div class="fv-field"><label>Muestra (%)</label><input id="f_muestreo_porcentaje" type="number" min="0" max="100" class="form-control" value="${f.muestreo_porcentaje??''}"></div>
      <div class="fv-field"><label>Método de muestreo</label><select id="f_muestreo_metodo" class="form-control">
        <option value="">—</option>${METODOS.map(m=>`<option ${f.muestreo_metodo===m?'selected':''}>${m}</option>`).join('')}</select></div>
      <div class="fv-field" style="grid-column:1/3;"><label>Criterios de conservación permanente</label><textarea id="f_criterios_conservacion" rows="2" class="form-control">${esc(f.criterios_conservacion||'')}</textarea></div>
    </div>
  </div></div>

  <div class="fv-sec"><h3>Cierre técnico</h3><div class="fv-body fv-grid">
    <div class="fv-field" style="grid-column:1/3;"><label>Riesgos</label><textarea id="f_riesgos" rows="2" class="form-control">${esc(f.riesgos||'')}</textarea></div>
    <div class="fv-field" style="grid-column:1/3;"><label>Fundamento normativo</label><textarea id="f_fundamento_normativo" rows="2" class="form-control">${esc(f.fundamento_normativo||'')}</textarea></div>
    <div class="fv-field"><label>Estado</label><select id="f_estado" class="form-control">
      ${['borrador','en_revision','lista'].map(e=>`<option value="${e}" ${(f.estado||'borrador')===e?'selected':''}>${e}</option>`).join('')}</select></div>
  </div></div>

  <div class="save-bar">
    <span id="estado" class="muted"></span>
    <button class="btn-secondary" id="btnInforme">📄 Informe Técnico (Word)</button>
    <button class="btn-primary" id="btnGuardar">Guardar ficha</button>
  </div>`

  document.querySelectorAll('.f-disp').forEach(r=>r.addEventListener('change',()=>{
    document.getElementById('muestreoBox').style.display = r.checked && r.value==='S' ? 'grid':(document.querySelector('.f-disp:checked')?.value==='S'?'grid':'none')
  }))
  document.getElementById('btnGuardar').addEventListener('click',guardar)
  document.getElementById('btnInforme').addEventListener('click',descargarInforme)
}

async function descargarInforme(){
  const est=document.getElementById('estado')
  const btn=document.getElementById('btnInforme')
  est.textContent='Guardando y generando informe…'; btn.disabled=true
  try{
    await guardar()  // asegura que el Word refleje lo último
    const res=await fetch(`/api/valoracion/fichas/${fichaId}/informe`,{headers:headers()})
    if(res.status===401){sessionStorage.clear();location.href='/';return}
    if(!res.ok)throw new Error(`Error ${res.status}`)
    const blob=await res.blob()
    const url=URL.createObjectURL(blob)
    const a=document.createElement('a')
    a.href=url; a.download=`Informe_valoracion_${(ficha.subserie||'ficha').replace(/\s+/g,'_')}.docx`
    document.body.appendChild(a); a.click(); a.remove()
    setTimeout(()=>URL.revokeObjectURL(url),1500)
    est.textContent='Informe generado ✓'
  }catch(e){est.textContent='Error';alert('No se pudo generar el informe: '+e.message)}
  finally{btn.disabled=false}
}

function recogerValores(tipo){
  return [...document.querySelectorAll(`.fv-val[data-tipo="${tipo}"]`)].map(row=>({
    clave:row.dataset.clave,
    nivel:row.querySelector('.v-nivel').value,
    sustento:row.querySelector('.v-sustento').value.trim()
  })).filter(v=>v.nivel||v.sustento)
}

async function guardar(){
  const g=id=>document.getElementById(id)?.value?.trim()||null
  const num=id=>{const v=document.getElementById(id)?.value;return v===''||v==null?null:Number(v)}
  const payload={
    serie:g('f_serie'), subserie:g('f_subserie'), unidad_documental:g('f_unidad_documental'),
    funcion:g('f_funcion'), tipologias:g('f_tipologias'),
    valores_primarios:recogerValores('primarios'),
    valores_secundarios:recogerValores('secundarios'),
    frecuencia_consulta:g('f_frecuencia_consulta'), hecho_cierre:g('f_hecho_cierre'),
    reglas_excepcion:[...document.querySelectorAll('.f-regla:checked')].map(c=>c.value),
    tiempo_gestion:num('f_tiempo_gestion'), tiempo_central:num('f_tiempo_central'),
    disposicion_final:document.querySelector('.f-disp:checked')?.value||null,
    disposicion_justificacion:g('f_disposicion_justificacion'),
    muestreo_porcentaje:num('f_muestreo_porcentaje'), muestreo_metodo:g('f_muestreo_metodo'),
    criterios_conservacion:g('f_criterios_conservacion'),
    riesgos:g('f_riesgos'), fundamento_normativo:g('f_fundamento_normativo'),
    estado:g('f_estado')
  }
  const est=document.getElementById('estado'); est.textContent='Guardando…'
  try{
    const j=await api(`/api/valoracion/fichas/${fichaId}`,{method:'PUT',body:JSON.stringify(payload)})
    ficha=j.data||ficha
    est.textContent='Guardado ✓ '+new Date().toLocaleTimeString('es-CO')
  }catch(e){est.textContent='Error';alert(e.message)}
}
