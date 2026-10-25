// SIPAD · Acta de levantamiento de información documental (imprimible)
const token = sessionStorage.getItem('token')
const caja = document.getElementById('acta')
document.getElementById('imprimir').addEventListener('click', () => window.print())

function usuarioToken() {
  try { return JSON.parse(decodeURIComponent(escape(atob(token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/'))))) } catch { return null }
}
const esc = (s) => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]))
const fechaLarga = (iso) => iso ? new Date(iso + 'T12:00:00').toLocaleDateString('es-CO', { day: 'numeric', month: 'long', year: 'numeric' }) : '—'
const RESP = { si: 'Sí', no: 'No', ns: 'No sabe' }

async function cargar() {
  const id = new URLSearchParams(location.search).get('id')
  if (!token || !id) { caja.innerHTML = '<div class="error">Abra el acta desde la entrevista en SIPAD.</div>'; return }
  const h = { Authorization: `Bearer ${token}` }
  const u = usuarioToken()
  if (u?.es_master_admin === true || u?.es_master_admin === 1) {
    const eid = sessionStorage.getItem('gestion_entidad_id') || sessionStorage.getItem('entidad_id')
    if (eid) h['X-Entidad-Id'] = eid
  }
  const r = await fetch(`/api/verificacion/entrevistas/${encodeURIComponent(id)}`, { headers: h })
  const d = await r.json().catch(() => ({}))
  if (!r.ok || !d.ok) { caja.innerHTML = `<div class="error">${esc(d.error || 'No se pudo cargar el acta.')}</div>`; return }
  pintar(d)
}

function pintar(d) {
  const e = d.entrevista
  const si = d.items.filter(s => s.respuesta === 'si')
  const no = d.items.filter(s => s.respuesta === 'no')
  const ns = d.items.filter(s => s.respuesta === 'ns')
  const agregados = d.items.filter(s => s.origen === 'agregado')
  const nombreSerie = (s) => (s.serie && !/^por definir$/i.test(s.serie)) ? esc(s.serie) : '<span class="muted">Por definir</span>'
  const filaSi = (s, i) => {
    const tips = s.tipologias.filter(t => t.respuesta === 'si')
    return `<tr><td>${i + 1}</td><td>${nombreSerie(s)}</td><td>${esc(s.subserie || s.texto)}${s.origen === 'agregado' ? ' <span class="muted">(mencionada en la entrevista)</span>' : ''}</td>
      <td>${tips.length ? `<ul class="tips">${tips.map(t => `<li>${esc(t.texto)}</li>`).join('')}</ul>` : '<span class="muted">—</span>'}</td><td>${esc(s.nota || '')}</td></tr>`
  }
  const lista = (arr) => arr.length
    ? `<table><tr><th style="width:30%">Serie</th><th>Subserie</th><th style="width:32%">Observación</th></tr>${arr.map(s => `<tr><td>${nombreSerie(s)}</td><td>${esc(s.subserie || s.texto)}</td><td>${esc(s.nota || '')}</td></tr>`).join('')}</table>`
    : '<p class="muted">Ninguna.</p>'
  const asistentes = e.asistentes.length ? e.asistentes : [{ nombre: '', cargo: '' }]
  const jefe = asistentes.find(a => a.jefe)

  caja.innerHTML = `<div class="hoja">
    <h1>Acta de levantamiento de información documental</h1>
    <div class="ent">${esc(d.entidad)}</div>
    <table class="datos">
      <tr><td>Dependencia</td><td>${esc(e.dependencia_nombre || '')}</td></tr>
      <tr><td>Oficina productora</td><td>${esc(e.oficina)}</td></tr>
      <tr><td>Fecha</td><td>${fechaLarga(e.fecha)}</td></tr>
      <tr><td>Lugar</td><td>${esc(e.lugar || '')}</td></tr>
      <tr><td>Entrevistador</td><td>${esc(e.entrevistador || '')}</td></tr>
      ${jefe ? `<tr><td>Jefe de la oficina</td><td>${esc(jefe.nombre)}${jefe.cargo ? `, ${esc(jefe.cargo)}` : ''}</td></tr>` : ''}
    </table>

    <h2>Objeto</h2>
    <p>Levantar con la oficina productora la información sobre las series, subseries y tipologías documentales que produce o
    recibe en cumplimiento de sus funciones, como insumo para la elaboración y actualización de las Tablas de Retención Documental,
    de acuerdo con el Acuerdo 001 de 2024 del Archivo General de la Nación (numerales 5.1.1.1 y 5.1.1.5). La entrevista se
    realizó con base en el manual de funciones de la entidad: cada subserie consultada corresponde a una función asignada a la oficina.</p>

    <h2>Resumen</h2>
    <table><tr><th>Subseries consultadas</th><th>Confirmadas</th><th>No produce</th><th>No sabe</th><th>Mencionadas por la oficina</th></tr>
      <tr><td>${d.resumen.subseries}</td><td>${d.resumen.si}</td><td>${d.resumen.no}</td><td>${d.resumen.ns}</td><td>${agregados.filter(a => !a.padre_id).length}</td></tr></table>

    <h2>1. Documentación que la oficina confirma que produce</h2>
    ${si.length ? `<table><tr><th style="width:4%">N.º</th><th style="width:20%">Serie</th><th style="width:24%">Subserie</th><th>Tipologías documentales</th><th style="width:18%">Observación</th></tr>${si.map(filaSi).join('')}</table>` : '<p class="muted">Ninguna.</p>'}

    <h2>2. Documentación que la oficina indica que no produce</h2>
    ${lista(no)}

    <h2>3. Pendiente de confirmar</h2>
    ${lista(ns)}

    <h2>Observaciones</h2>
    <p>${e.observaciones ? esc(e.observaciones).replace(/\n/g, '<br>') : '<span class="muted">Sin observaciones.</span>'}</p>

    <p>Los asistentes revisaron la información consignada y la aprueban como la documentación que produce la oficina.</p>

    <div class="firmas">
      ${asistentes.map(a => `<div class="firma"><b>${esc(a.nombre || ' ')}</b><br>${esc(a.cargo || '')}${a.jefe ? '<br><span class="muted">Jefe de la oficina</span>' : ''}</div>`).join('')}
      <div class="firma"><b>${esc(e.entrevistador || ' ')}</b><br>Entrevistador</div>
    </div>
    <div class="pie">Generada en SIPAD${e.cerrado_en ? ` · cerrada el ${fechaLarga(e.cerrado_en.slice(0, 10))}` : ' · BORRADOR: la entrevista no se ha cerrado'}.</div>
  </div>`
  document.title = `Acta – ${e.oficina}`
}

cargar()
