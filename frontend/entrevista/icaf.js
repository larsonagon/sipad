// SIPAD · ICAF diligenciado por entrevista: una hoja por actividad, con el diseño del ICAF oficial
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

// Mismo diseño del ICAF oficial (backend/modules/segtec/segtec.pdf.service.js): una hoja por actividad.
const cap = (v) => { const t = String(v ?? '').replaceAll('_', ' ').trim(); return t ? esc(t.charAt(0).toUpperCase() + t.slice(1)) : '' }
const FORMATO_OF = { fisico: 'Físico', digital: 'Digital', mixto: 'Mixto', ambos: 'Ambos' }
const fechaCorta = (iso) => iso ? new Date(String(iso).slice(0, 10) + 'T12:00:00').toLocaleDateString('es-CO') : new Date().toLocaleDateString('es-CO')
const campo = (etq, v) => `<div class="campo"><div class="label">${etq}</div><div class="box">${v ?? ''}</div></div>`

function hojaActividad(x, a, d) {
  const e = d.entrevista
  return `<div class="hoja">
    <h1>INSTRUMENTO DE CARACTERIZACIÓN DE ACTIVIDADES FUNCIONALES</h1>
    <div class="grid">
      ${campo('Entidad', esc(d.entidad || ''))}
      ${campo('Dependencia', esc(e.dependencia_nombre || 'No registrada'))}
      ${campo('Funcionario', esc(a.nombre || 'No registrado'))}
      ${campo('Fecha', fechaCorta(e.fecha))}
    </div>
    <h2>BLOQUE 1 — Identificación Básica de la Actividad</h2>
    ${campo('1. Nombre de la actividad', esc(x.nombre))}
    ${campo('2. Cargo responsable', esc(a.cargo || ''))}
    ${campo('3. Clasificación funcional', cap(x.tipo_funcion))}
    ${campo('4. Periodicidad', cap(x.frecuencia))}
    ${campo('5. Descripción detallada', esc(x.descripcion || ''))}
    <h2>BLOQUE 2 — Producción Documental Asociada</h2>
    ${campo('6. ¿Genera documentos?', 'Sí')}
    ${campo('7. Documentos generados', x.documentos.map(esc).join('; '))}
    ${campo('8. Formato de producción', FORMATO_OF[x.formato] || cap(x.formato))}
    ${campo('9. Documentos requeridos para iniciar la actividad', '')}
    ${campo('10. Volumen documental', '')}
    ${campo('11. Responsabilidad de custodia', 'La misma dependencia')}
    ${campo('11a. Cargo responsable de custodia', '')}
    ${campo('12. Localización de documentos', '')}
    <h2>BLOQUE 3 — Gestión y Trámite</h2>
    ${campo('13. ¿Tiene procedimiento formal?', '')}
    ${campo('14. Dependencias involucradas', '')}
    ${campo('15. ¿Tiene plazo para cumplirse?', '')}
    ${campo('15a. Plazo legal establecido', '')}
    ${campo('15b. Tiempo promedio real de ejecución', '')}
    ${campo('16. ¿Genera expediente?', x.expediente ? 'Sí' : 'No')}
    ${campo('17. Norma que exige la actividad', '')}
    <div class="firma"><div class="linea"></div><div class="firma-nombre">${esc(a.nombre || '')}</div><div class="firma-cargo">${esc(a.cargo || '')}</div></div>
    <div class="footer"><div>Sistema inteligente para la planeación archivística documental – SIPAD</div><div>Instrumento de caracterización de actividades funcionales</div></div>
  </div>`
}

function formulario(f, d) {
  return f.actividades.map(x => hojaActividad(x, f.asistente, d)).join('')
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
