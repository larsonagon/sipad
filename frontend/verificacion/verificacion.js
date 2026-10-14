// SIPAD · Verificación por dependencia (gestión del asesor)
import { renderHeader } from '../components/header.js'

// ---------------- Sesión / API ----------------
function usuarioToken() {
  const t = sessionStorage.getItem('token'); if (!t) return null
  try { return JSON.parse(atob(t.split('.')[1])) } catch { return null }
}
const USER = usuarioToken()
const ES_MASTER = USER?.es_master_admin === true || USER?.es_master_admin === 1

function cabeceras(extra = {}) {
  const h = { Authorization: `Bearer ${sessionStorage.getItem('token')}`, ...extra }
  if (ES_MASTER) {
    const eid = sessionStorage.getItem('gestion_entidad_id') || sessionStorage.getItem('entidad_id')
    if (eid) h['X-Entidad-Id'] = eid
  }
  return h
}
async function api(url, options = {}) {
  const headers = cabeceras(options.headers)
  if (options.body && typeof options.body !== 'string') { headers['Content-Type'] = 'application/json'; options.body = JSON.stringify(options.body) }
  const resp = await fetch(url, { ...options, headers })
  if (resp.status === 401) { sessionStorage.clear(); window.location.href = '/'; throw new Error('Sesión vencida') }
  let j = {}
  try { j = await resp.json() } catch { /* sin cuerpo */ }
  if (!resp.ok || j.ok === false) throw new Error(j.error || `Error ${resp.status}`)
  return j
}

// ---------------- Utilidades UI ----------------
const $ = (s, e = document) => e.querySelector(s)
function el(tag, attrs = {}, ...hijos) {
  const e = document.createElement(tag)
  for (const [k, v] of Object.entries(attrs || {})) {
    if (k === 'class') e.className = v
    else if (k === 'text') e.textContent = v
    else if (k.startsWith('on')) e.addEventListener(k.slice(2), v)
    else if (k === 'value') e.value = v ?? ''
    else if (v !== undefined && v !== null && v !== false) e.setAttribute(k, v === true ? '' : v)
  }
  for (const h of hijos.flat()) if (h !== null && h !== undefined && h !== false) e.append(h instanceof Node ? h : document.createTextNode(String(h)))
  return e
}
function toast(mensaje, tipo = 'info') {
  let c = document.getElementById('sipad-notifications')
  if (!c) { c = document.createElement('div'); c.id = 'sipad-notifications'; document.body.appendChild(c) }
  const t = document.createElement('div'); t.className = `sipad-toast ${tipo}`; t.textContent = mensaje
  c.appendChild(t)
  requestAnimationFrame(() => requestAnimationFrame(() => t.classList.add('visible')))
  setTimeout(() => { t.classList.remove('visible'); setTimeout(() => t.remove(), 300) }, 4000)
}
const ESTADO = { borrador: 'Borrador', abierta: 'Abierta', cerrada: 'Cerrada' }
const DECISION = { incluir: 'Incluir en la TRD', descartar: 'Descartar', fondo_acumulado: 'Fondo acumulado (TVD)', pendiente: 'Pendiente (mesa)' }
const fecha = (iso) => iso ? new Date(iso).toLocaleDateString('es-CO', { day: 'numeric', month: 'short', year: 'numeric' }) : '—'
const enlacePublico = (token) => `${location.origin}/verificar/?t=${token}`

function debounce(fn, ms = 600) { let t; return (...a) => { clearTimeout(t); t = setTimeout(() => fn(...a), ms) } }

// ---------------- Ruteo simple por hash ----------------
async function rutear() {
  const id = decodeURIComponent(location.hash.replace(/^#/, ''))
  try {
    if (id === 'nueva') await vistaNueva()
    else if (id) await vistaDetalle(id)
    else await vistaListas()
  } catch (e) { toast(e.message, 'error'); if (id) location.hash = '' }
}
window.addEventListener('hashchange', rutear)

// ---------------- Vista: listas ----------------
async function vistaListas() {
  const { listas } = await api('/api/verificacion/listas')
  const v = $('#vista'); v.replaceChildren()
  v.append(el('div', { class: 'vr-barra' },
    el('h2', { text: `Verificaciones (${listas.length})` }),
    el('button', { class: 'btn-primary btn-md', type: 'button', text: '+ Nueva verificación', onclick: () => { location.hash = 'nueva' } })))
  if (!listas.length) {
    v.append(el('div', { class: 'vr-card vr-vacio' },
      el('p', { text: 'Todavía no hay verificaciones.' }),
      el('p', { class: 'vr-muted', text: 'Cree una por dependencia. Si la dependencia ya tiene series propuestas en el Diseño de la TRD, la lista se precarga con ellas.' })))
    return
  }
  const grid = el('div', { class: 'vr-listas' })
  for (const l of listas) {
    const card = el('div', { class: 'vr-card vr-lista', role: 'button', tabindex: '0',
      onclick: () => { location.hash = l.id }, onkeydown: (e) => { if (e.key === 'Enter') location.hash = l.id } },
      el('div', {}, el('span', { class: `vr-estado ${l.estado}`, text: ESTADO[l.estado] || l.estado })),
      el('h3', { text: l.dependencia_nombre || 'Dependencia' }),
      el('div', { class: 'vr-muted', text: l.titulo }),
      el('div', { class: 'vr-cifras' },
        el('div', {}, el('b', { text: l.items }), 'ítems'),
        el('div', {}, el('b', { text: l.respuestas }), l.respuestas === 1 ? 'respuesta' : 'respuestas')),
      el('div', { class: 'vr-muted', text: l.fecha_limite ? `Plazo: ${fecha(l.fecha_limite + 'T12:00:00')}` : `Creada: ${fecha(l.creado_en)}` }))
    grid.append(card)
  }
  v.append(grid)
}

// ---------------- Vista: nueva ----------------
async function vistaNueva() {
  const { dependencias } = await api('/api/verificacion/dependencias')
  const v = $('#vista'); v.replaceChildren()
  const sel = el('select', { id: 'nDep', required: true }, el('option', { value: '', text: 'Seleccione…' }), dependencias.map(d => el('option', { value: d.id, text: d.nombre })))
  const titulo = el('input', { type: 'text', id: 'nTitulo', maxlength: '200', placeholder: 'Por defecto: Verificación de documentos' })
  const mensaje = el('textarea', { id: 'nMensaje', maxlength: '2000' })
  mensaje.value = 'Estamos actualizando las Tablas de Retención Documental de la entidad. Le pedimos confirmar qué documentos y expedientes produce o tramita su dependencia. Toma unos minutos y no necesita crear una cuenta.'
  const limite = el('input', { type: 'date', id: 'nLimite' })
  const soporte = el('input', { type: 'checkbox', id: 'nSoporte', checked: true })
  const volumen = el('input', { type: 'checkbox', id: 'nVolumen' })
  const precargar = el('input', { type: 'checkbox', id: 'nPrecargar', checked: true })
  const btn = el('button', { class: 'btn-primary btn-md', type: 'submit', text: 'Crear verificación' })
  const form = el('form', { class: 'vr-card vr-form', onsubmit: async (e) => {
    e.preventDefault()
    if (!sel.value) { toast('Seleccione la dependencia', 'error'); sel.focus(); return }
    btn.disabled = true
    try {
      const r = await api('/api/verificacion/listas', { method: 'POST', body: {
        dependencia_id: sel.value, titulo: titulo.value, mensaje: mensaje.value, fecha_limite: limite.value || null,
        preguntar_soporte: soporte.checked, preguntar_volumen: volumen.checked, precargar: precargar.checked } })
      toast(r.precargados ? `Lista creada con ${r.precargados} ítems tomados de las propuestas de la dependencia` : 'Lista creada. Agregue los documentos o expedientes.', 'success')
      location.hash = r.id
    } catch (err) { toast(err.message, 'error') } finally { btn.disabled = false }
  } },
    el('label', { for: 'nDep' }, 'Dependencia', sel),
    el('label', { for: 'nLimite' }, 'Plazo para responder (opcional)', limite),
    el('label', { class: 'full', for: 'nTitulo' }, 'Título (opcional)', titulo),
    el('label', { class: 'full', for: 'nMensaje' }, 'Mensaje para los funcionarios', mensaje),
    el('label', { class: 'vr-check full' }, precargar, 'Precargar con las series ya propuestas para esta dependencia en el Diseño de la TRD'),
    el('label', { class: 'vr-check' }, soporte, 'Preguntar dónde se guarda (papel, digital o ambos)'),
    el('label', { class: 'vr-check' }, volumen, 'Preguntar cuánto se produce'),
    el('div', { class: 'full module-actions' }, el('button', { class: 'btn-secondary btn-md', type: 'button', text: 'Cancelar', onclick: () => { location.hash = '' } }), btn))
  v.append(el('div', { class: 'vr-barra' }, el('button', { class: 'vr-volver', type: 'button', text: '← Verificaciones', onclick: () => { location.hash = '' } })), form)
}

// ---------------- Vista: detalle ----------------
let D = null
let tab = sessionStorage.getItem('vr_tab') || 'items'

async function vistaDetalle(id) {
  D = await api(`/api/verificacion/listas/${encodeURIComponent(id)}`)
  pintarDetalle()
}
async function recargar() { D = await api(`/api/verificacion/listas/${encodeURIComponent(D.lista.id)}`); pintarDetalle() }

function pintarDetalle() {
  const l = D.lista
  const v = $('#vista'); v.replaceChildren()
  v.append(el('div', { class: 'vr-barra' }, el('button', { class: 'vr-volver', type: 'button', text: '← Verificaciones', onclick: () => { location.hash = '' } })))

  const seg = el('div', { class: 'vr-seg', role: 'group', 'aria-label': 'Estado' },
    ['borrador', 'abierta', 'cerrada'].map(e => el('button', { type: 'button', class: l.estado === e ? 'on' : '', text: ESTADO[e], onclick: () => cambiarEstado(e) })))
  const url = enlacePublico(l.token)
  const activo = l.estado === 'abierta'
  const textoWa = encodeURIComponent(`${l.titulo}\n\n${l.mensaje ? l.mensaje + '\n\n' : ''}Responda aquí: ${url}`)
  const enlace = el('div', { class: `vr-enlace ${activo ? '' : 'inactivo'}` },
    el('code', { text: url }),
    el('button', { class: 'btn-secondary btn-sm', type: 'button', text: 'Copiar enlace', onclick: async () => {
      try { await navigator.clipboard.writeText(url); toast('Enlace copiado', 'success') } catch { toast('No se pudo copiar; selecciónelo manualmente', 'error') } } }),
    el('a', { class: 'btn-secondary btn-sm', href: `https://wa.me/?text=${textoWa}`, target: '_blank', rel: 'noopener', text: 'Enviar por WhatsApp' }),
    el('a', { class: 'btn-secondary btn-sm', href: `mailto:?subject=${encodeURIComponent(l.titulo)}&body=${textoWa}`, text: 'Enviar por correo' }),
    el('button', { class: 'btn-secondary btn-sm', type: 'button', text: 'Nuevo enlace', title: 'Invalida el enlace anterior', onclick: nuevoEnlace }))
  const aviso = activo ? null : el('div', { class: 'vr-muted', style: 'margin-top:6px', text: l.estado === 'borrador'
    ? 'El enlace empieza a funcionar cuando la lista esté «Abierta».' : 'La lista está cerrada: el enlace ya no recibe respuestas.' })

  v.append(el('section', { class: 'vr-card' },
    el('div', { class: 'vr-cab' },
      el('div', {}, el('h2', { text: l.dependencia_nombre || 'Dependencia' }), el('div', { class: 'vr-muted', text: l.titulo })),
      seg),
    enlace, aviso))

  v.append(el('nav', { class: 'vr-tabs', role: 'tablist' },
    el('button', { role: 'tab', class: tab === 'items' ? 'on' : '', text: `Ítems (${D.items.length})`, onclick: () => { tab = 'items'; sessionStorage.setItem('vr_tab', tab); pintarDetalle() } }),
    el('button', { role: 'tab', class: tab === 'resultados' ? 'on' : '', text: `Resultados (${D.resumen.respuestas})`, onclick: () => { tab = 'resultados'; sessionStorage.setItem('vr_tab', tab); pintarDetalle() } }),
    el('button', { role: 'tab', class: tab === 'ajustes' ? 'on' : '', text: 'Ajustes', onclick: () => { tab = 'ajustes'; sessionStorage.setItem('vr_tab', tab); pintarDetalle() } })))

  if (tab === 'resultados') v.append(panelResultados())
  else if (tab === 'ajustes') v.append(panelAjustes())
  else v.append(panelItems())
}

async function cambiarEstado(estado) {
  try { await api(`/api/verificacion/listas/${D.lista.id}`, { method: 'PUT', body: { estado } }); toast(`Lista ${ESTADO[estado].toLowerCase()}`, 'success'); await recargar() }
  catch (e) { toast(e.message, 'error') }
}
async function nuevoEnlace() {
  if (!confirm('¿Generar un enlace nuevo? El enlace anterior dejará de funcionar.')) return
  try { await api(`/api/verificacion/listas/${D.lista.id}/token`, { method: 'POST' }); toast('Enlace nuevo generado', 'success'); await recargar() }
  catch (e) { toast(e.message, 'error') }
}

// ----- Ítems -----
function panelItems() {
  const card = el('section', { class: 'vr-card' })
  card.append(el('p', { class: 'vr-muted', style: 'margin-top:0', text: 'Escriba cada ítem como lo reconocería el funcionario (por ejemplo, «Licencias de construcción»). La serie y la subserie no se muestran en el formulario: sirven para crear la propuesta en la TRD si la dependencia confirma.' }))
  if (!D.items.length) card.append(el('div', { class: 'vr-vacio', text: 'Sin ítems todavía. Agregue los documentos o expedientes abajo.' }))
  const lista = el('div')
  D.items.forEach((it, i) => {
    const guardar = debounce(async (campo, valor) => {
      try { await api(`/api/verificacion/items/${it.id}`, { method: 'PUT', body: { [campo]: valor } }) } catch (e) { toast(e.message, 'error') }
    })
    const inp = (campo, ph, clase = '') => {
      const x = el('input', { type: 'text', class: clase, placeholder: ph, value: it[campo] || '', 'aria-label': ph })
      x.addEventListener('input', () => guardar(campo, x.value))
      return x
    }
    lista.append(el('div', { class: 'vr-item' },
      el('span', { class: 'n', text: String(i + 1) }),
      el('div', { class: 'campos' },
        inp('texto', 'Documento o expediente'),
        inp('ayuda', 'Ayuda para el funcionario (opcional)', 'sec'),
        el('div', { class: 'fila2' }, inp('serie', 'Serie (para la TRD)', 'sec'), inp('subserie', 'Subserie', 'sec')),
        el('span', { class: 'vr-origen', text: it.origen === 'propuesta' ? 'Tomado de una propuesta del Diseño de la TRD' : 'Agregado manualmente' })),
      el('button', { class: 'vr-icono', type: 'button', title: 'Eliminar ítem', 'aria-label': 'Eliminar ítem', text: '✕', onclick: async () => {
        if (D.resumen.respuestas && !confirm('Este ítem ya tiene respuestas. ¿Eliminarlo?')) return
        try { await api(`/api/verificacion/items/${it.id}`, { method: 'DELETE' }); await recargar() } catch (e) { toast(e.message, 'error') } } })))
  })
  card.append(lista)

  const pegar = el('textarea', { placeholder: 'Pegue o escriba varios ítems, uno por línea' })
  card.append(el('div', { class: 'vr-add' },
    el('strong', { text: 'Agregar ítems' }), pegar,
    el('div', {}, el('button', { class: 'btn-primary btn-sm', type: 'button', text: 'Agregar', onclick: async () => {
      if (!pegar.value.trim()) return
      try { const r = await api(`/api/verificacion/listas/${D.lista.id}/items`, { method: 'POST', body: { lineas: pegar.value } }); toast(`${r.ids.length} ítem(s) agregado(s)`, 'success'); await recargar() }
      catch (e) { toast(e.message, 'error') } } }))))
  return card
}

// ----- Resultados -----
function panelResultados() {
  const cont = el('div')
  const r = D.resumen
  if (!r.respuestas) {
    cont.append(el('section', { class: 'vr-card vr-vacio' },
      el('p', { text: 'Aún no hay respuestas.' }),
      el('p', { class: 'vr-muted', text: D.lista.estado === 'abierta' ? 'Comparta el enlace con los funcionarios de la dependencia.' : 'Abra la lista y comparta el enlace.' })))
    return cont
  }
  cont.append(el('div', { class: 'vr-resumen' },
    el('span', { class: 'vr-chip', text: `${r.respuestas} ${r.respuestas === 1 ? 'respuesta' : 'respuestas'}` }),
    ['incluir', 'descartar', 'fondo_acumulado', 'pendiente'].map(k => el('span', { class: `vr-chip ${k}`, text: `${DECISION[k]}: ${r[k]}` }))))

  const tabla = el('table', { class: 'vr-tabla' },
    el('thead', {}, el('tr', {},
      el('th', { text: 'Documento o expediente' }), el('th', { class: 'num', text: 'Sí' }), el('th', { class: 'num', text: 'No' }),
      el('th', { class: 'num', text: 'Antes' }), el('th', { class: 'num', text: 'No sé' }), el('th', { class: 'ocultable', text: 'Soporte' }), el('th', { text: 'Decisión' }))))
  const tb = el('tbody')
  for (const f of D.items) {
    const c = f.conteo, tot = f.total || 1
    const barras = el('div', { class: 'vr-barras', 'aria-hidden': 'true' },
      ['si', 'no', 'antes', 'ns'].map(k => el('i', { class: k, style: `width:${c[k] / tot * 100}%` })))
    const sel = el('select', { 'aria-label': `Decisión para ${f.texto}` },
      Object.entries(DECISION).map(([k, t]) => el('option', { value: k, text: t, selected: (f.decision || f.sugerida) === k })))
    sel.addEventListener('change', async () => {
      try { await api(`/api/verificacion/items/${f.id}`, { method: 'PUT', body: { decision: sel.value } }); f.decision = sel.value }
      catch (e) { toast(e.message, 'error') }
    })
    const sop = Object.entries(f.soporte).filter(([, n]) => n).map(([k, n]) => `${k} ${n}`).join(' · ')
    const per = f.periodos.map(p => `${p.desde || '?'}–${p.hasta || '?'}`).join(', ')
    tb.append(el('tr', {},
      el('td', {}, el('div', { text: f.texto }), f.serie ? el('div', { class: 'vr-muted', text: [f.serie, f.subserie].filter(Boolean).join(' / ') }) : null, barras,
        per ? el('div', { class: 'vr-sugerida', text: `Periodos indicados: ${per}` }) : null),
      el('td', { class: 'num', text: c.si }), el('td', { class: 'num', text: c.no }), el('td', { class: 'num', text: c.antes }), el('td', { class: 'num', text: c.ns }),
      el('td', { class: 'ocultable vr-muted', text: sop || '—' }),
      el('td', {}, sel, f.decision && f.decision !== f.sugerida ? el('div', { class: 'vr-sugerida', text: `Sugerida: ${DECISION[f.sugerida]}` }) : null)))
  }
  tabla.append(tb)
  cont.append(el('section', { class: 'vr-card', style: 'overflow-x:auto' }, tabla,
    el('div', { class: 'vr-acciones' },
      el('button', { class: 'btn-primary btn-md', type: 'button', text: 'Aplicar a las propuestas de la TRD', onclick: aplicar }),
      el('button', { class: 'btn-secondary btn-md', type: 'button', text: 'Descargar resultados (CSV)', onclick: descargarCSV })),
    el('p', { class: 'vr-muted', text: D.lista.aplicado_en ? `Última aplicación: ${fecha(D.lista.aplicado_en)}.` : 'Aplicar deja constancia en cada propuesta, crea las nuevas que la dependencia confirmó (si tienen serie) y rechaza las pendientes que la dependencia dice no producir. Las series ya aprobadas no se cambian: quedan con una observación para el comité.' })))

  if (D.adicionales.length) {
    cont.append(el('section', { class: 'vr-card' }, el('h3', { text: 'Otros documentos que mencionaron' }),
      D.adicionales.map(a => el('div', { class: 'vr-resp' }, el('div', { text: a.texto, style: 'white-space:pre-line' }), el('div', { class: 'vr-muted', text: a.nombre })))))
  }
  cont.append(el('section', { class: 'vr-card' }, el('h3', { text: 'Quiénes respondieron' }),
    D.respuestas.map(r => el('div', { class: 'vr-resp' },
      el('div', {}, el('strong', { text: r.nombre }), r.cargo ? el('span', { class: 'vr-muted', text: ` · ${r.cargo}` }) : null,
        r.observaciones ? el('div', { class: 'vr-muted', text: r.observaciones }) : null),
      el('div', { style: 'display:flex;gap:8px;align-items:center' }, el('span', { class: 'vr-muted', text: fecha(r.enviado_en) }),
        el('button', { class: 'vr-icono', type: 'button', title: 'Eliminar respuesta', 'aria-label': `Eliminar respuesta de ${r.nombre}`, text: '✕', onclick: async () => {
          if (!confirm(`¿Eliminar la respuesta de ${r.nombre}?`)) return
          try { await api(`/api/verificacion/respuestas/${r.id}`, { method: 'DELETE' }); await recargar() } catch (e) { toast(e.message, 'error') } } }))))))
  return cont
}

async function aplicar() {
  if (!confirm('¿Aplicar las decisiones a las propuestas de series de esta dependencia?')) return
  try {
    const r = await api(`/api/verificacion/listas/${D.lista.id}/aplicar`, { method: 'POST' })
    const partes = [`${r.confirmadas} confirmadas`, `${r.creadas} creadas`, `${r.descartadas} descartadas`, `${r.fondo_acumulado} a fondo acumulado`]
    toast(`Aplicado: ${partes.join(', ')}`, 'success')
    if (r.omitidas?.length) toast(`${r.omitidas.length} ítem(s) sin serie: indique la serie en la pestaña Ítems y vuelva a aplicar`, 'error')
    await recargar()
  } catch (e) { toast(e.message, 'error') }
}

async function descargarCSV() {
  try {
    const resp = await fetch(`/api/verificacion/listas/${D.lista.id}/resultados.csv`, { headers: cabeceras() })
    if (!resp.ok) throw new Error('No se pudo descargar')
    const blob = await resp.blob()
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob)
    a.download = `Verificacion-${(D.lista.dependencia_nombre || 'dependencia').replace(/[^\p{L}\p{N}]+/gu, '-')}.csv`
    document.body.append(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(a.href), 2000)
  } catch (e) { toast(e.message, 'error') }
}

// ----- Ajustes -----
function panelAjustes() {
  const l = D.lista
  const titulo = el('input', { type: 'text', maxlength: '200', value: l.titulo })
  const mensaje = el('textarea', { maxlength: '2000' }); mensaje.value = l.mensaje || ''
  const limite = el('input', { type: 'date', value: l.fecha_limite || '' })
  const soporte = el('input', { type: 'checkbox', checked: l.preguntar_soporte })
  const volumen = el('input', { type: 'checkbox', checked: l.preguntar_volumen })
  return el('form', { class: 'vr-card vr-form', onsubmit: async (e) => {
    e.preventDefault()
    try {
      await api(`/api/verificacion/listas/${l.id}`, { method: 'PUT', body: { titulo: titulo.value, mensaje: mensaje.value, fecha_limite: limite.value || null, preguntar_soporte: soporte.checked, preguntar_volumen: volumen.checked } })
      toast('Ajustes guardados', 'success'); await recargar()
    } catch (err) { toast(err.message, 'error') }
  } },
    el('label', { class: 'full' }, 'Título', titulo),
    el('label', { class: 'full' }, 'Mensaje para los funcionarios', mensaje),
    el('label', {}, 'Plazo para responder', limite), el('div'),
    el('label', { class: 'vr-check' }, soporte, 'Preguntar dónde se guarda'),
    el('label', { class: 'vr-check' }, volumen, 'Preguntar cuánto se produce'),
    el('div', { class: 'full module-actions space-between' },
      el('button', { class: 'btn-danger btn-md', type: 'button', text: 'Eliminar verificación', onclick: async () => {
        if (!confirm('¿Eliminar esta verificación con sus ítems y respuestas? No se puede deshacer.')) return
        try { await api(`/api/verificacion/listas/${l.id}`, { method: 'DELETE' }); toast('Verificación eliminada', 'success'); location.hash = '' } catch (err) { toast(err.message, 'error') } } }),
      el('button', { class: 'btn-primary btn-md', type: 'submit', text: 'Guardar ajustes' })))
}

// ---------------- Inicio ----------------
renderHeader('Verificación')
rutear()
