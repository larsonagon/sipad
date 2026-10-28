// SIPAD · ICAF diligenciado por entrevista: un formulario por funcionario, para firma
// La sesión vive en sessionStorage, propio de cada pestaña: si esta pestaña se abrió
// desde SIPAD, se copia la sesión de la pestaña de origen.
;(() => {
  if (sessionStorage.getItem('token')) return
  try {
    const o = window.opener && window.opener.sessionStorage
    if (!o) return
    for (const k of ['token', 'gestion_entidad_id', 'entidad_id']) { const v = o.getItem(k); if (v) sessionStorage.setItem(k, v) }
  } catch { /* otra pestaña u origen: se queda sin sesión */ }
})()
const token = sessionStorage.getItem('token')
const caja = document.getElementById('acta')
const sel = document.getElementById('quien')
document.getElementById('imprimir').addEventListener('click', () => window.print())

function usuarioToken() {
  try { return JSON.parse(decodeURIComponent(escape(atob(token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/'))))) } catch { return null }
}
const esc = (s) => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]))
const fechaLarga = (iso) => iso ? new Date(iso.slice(0, 10) + 'T12:00:00').toLocaleDateString('es-CO', { day: 'numeric', month: 'long', year: 'numeric' }) : '—'
const TIPO = { misional: 'Misional', apoyo: 'De apoyo', estrategica: 'Estratégica', control: 'Evaluación y control' }
const FORMATO = { fisico: 'Físico', digital: 'Digital', ambos: 'Ambos' }
const FREC = { diaria: 'Diaria', semanal: 'Semanal', mensual: 'Mensual', bimensual: 'Bimensual', trimestral: 'Trimestral', semestral: 'Semestral', anual: 'Anual', eventual: 'Eventual (cuando se requiere)' }
const val = (v) => v ? esc(v) : '<span class="vacio">No indicado</span>'
let DATOS = null

async function cargar() {
  const id = new URLSearchParams(location.search).get('id')
  if (!token || !id) { caja.innerHTML = '<div class="error">Abra el ICAF desde la entrevista en SIPAD.</div>'; return }
  const h = { Authorization: `Bearer ${token}` }
  const u = usuarioToken()
  if (u?.es_master_admin === true || u?.es_master_admin === 1) {
    const eid = sessionStorage.getItem('gestion_entidad_id') || sessionStorage.getItem('entidad_id')
    if (eid) h['X-Entidad-Id'] = eid
  }
  const r = await fetch(`/api/verificacion/entrevistas/${encodeURIComponent(id)}/icaf`, { headers: h })
  const d = await r.json().catch(() => ({}))
  if (!r.ok || !d.ok) { caja.innerHTML = `<div class="error">${esc(d.error || 'No se pudo cargar el ICAF.')}</div>`; return }
  DATOS = d
  sel.innerHTML = `<option value="">Todos (${d.funcionarios.length})</option>` + d.funcionarios.map((f, i) => `<option value="${i}">${esc(f.asistente.nombre)}</option>`).join('')
  sel.onchange = pintar
  pintar()
}

function formulario(f, d) {
  const e = d.entrevista
  const a = f.asistente
  const jefe = e.asistentes.find(x => x.jefe && x.id !== a.id)
  const acts = f.actividades.map((x, i) => `
    <div class="act">
      <h3>Actividad ${i + 1} de ${f.actividades.length}</h3>
      <table>
        <tr><th colspan="2">Bloque 1 — Identificación básica de la actividad</th></tr>
        <tr><td>1. Nombre de la actividad</td><td>${esc(x.nombre)}</td></tr>
        <tr><td>2. Cargo responsable</td><td>${val(a.cargo)}</td></tr>
        <tr><td>3. Clasificación funcional</td><td>${esc(TIPO[x.tipo_funcion] || x.tipo_funcion)}</td></tr>
        <tr><td>4. Periodicidad</td><td>${val(FREC[x.frecuencia])}</td></tr>
        <tr><td>5. Descripción</td><td>${esc(x.descripcion)}</td></tr>
        <tr><th colspan="2">Bloque 2 — Producción documental asociada</th></tr>
        <tr><td>6. ¿Genera documentos?</td><td>Sí</td></tr>
        <tr><td>7. Documentos generados</td><td>${x.documentos.length ? `<ul class="tips">${x.documentos.map(t => `<li>${esc(t)}</li>`).join('')}</ul>` : '<span class="vacio">No se detallaron tipologías</span>'}</td></tr>
        <tr><td>8. Formato de producción</td><td>${val(FORMATO[x.formato])}</td></tr>
        <tr><td>Serie / subserie</td><td>${x.serie ? `${esc(x.serie)} · ` : ''}${esc(x.subserie)}</td></tr>
        <tr><td>¿Conforma expediente?</td><td>${x.expediente ? 'Sí' : 'No'}</td></tr>
        <tr><td>11. Custodia</td><td>La misma dependencia</td></tr>
        ${x.nota ? `<tr><td>Observación</td><td>${esc(x.nota)}</td></tr>` : ''}
      </table>
    </div>`).join('')
  return `<div class="hoja">
    <h1>Instrumento de Caracterización de Actividades Funcionales (ICAF)</h1>
    <div class="ent">${esc(d.entidad)}</div>
    <table class="datos">
      <tr><td>Dependencia</td><td>${esc(e.dependencia_nombre || '')}</td></tr>
      <tr><td>Oficina productora</td><td>${esc(e.oficina)}</td></tr>
      <tr><td>Funcionario</td><td>${esc(a.nombre)}</td></tr>
      <tr><td>Cargo</td><td>${val(a.cargo)}</td></tr>
      <tr><td>Fecha</td><td>${fechaLarga(e.fecha)}</td></tr>
    </table>
    <div class="decl">Formulario diligenciado mediante entrevista realizada el ${fechaLarga(e.fecha)}${e.lugar ? ` en ${esc(e.lugar)}` : ''}.
      La información fue suministrada por el funcionario, quien la revisó y la aprueba con su firma. Las actividades corresponden a las
      funciones de su cargo según el manual de funciones de la entidad.</div>
    ${acts}
    <div class="firmas">
      <div class="firma"><b>${esc(a.nombre)}</b><br>${esc(a.cargo || '')}<br><span class="muted">Funcionario</span></div>
      ${jefe ? `<div class="firma"><b>${esc(jefe.nombre)}</b><br>${esc(jefe.cargo || '')}<br><span class="muted">Jefe de la oficina — Vo. Bo.</span></div>` : ''}
      <div class="firma"><b>${esc(e.entrevistador || ' ')}</b><br><span class="muted">Diligenció (entrevistador)</span></div>
    </div>
    <div class="pie">Generado en SIPAD a partir del acta de levantamiento de información documental de ${esc(e.oficina)}${e.cerrado_en ? '' : ' · BORRADOR: la entrevista no se ha cerrado'}.</div>
  </div>`
}

function pintar() {
  const d = DATOS
  const lista = sel.value === '' ? d.funcionarios : [d.funcionarios[Number(sel.value)]]
  let html = lista.map(f => formulario(f, d)).join('')
  if (!d.funcionarios.length) html = '<div class="error">Ninguna subserie confirmada tiene funcionario asignado. En la entrevista, indique quién produce cada subserie.</div>'
  if (sel.value === '' && d.sin_responsable.length) html += `<div class="error barra-aviso">Sin funcionario asignado (no aparecen en ningún ICAF): ${d.sin_responsable.map(s => esc(s.texto)).join('; ')}.</div>`
  caja.innerHTML = html
  document.title = sel.value === '' ? `ICAF – ${d.entrevista.oficina}` : `ICAF – ${lista[0].asistente.nombre}`
}

cargar()
