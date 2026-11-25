// SIPAD · ICAF por enlace (gestión del asesor): enlace público + bandeja de respuestas
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
function debounce(fn, ms = 700) { let t; return (...a) => { clearTimeout(t); t = setTimeout(() => fn(...a), ms) } }
const fecha = (iso) => iso ? new Date(iso).toLocaleString('es-CO', { day: 'numeric', month: 'short', year: 'numeric', hour: 'numeric', minute: '2-digit' }) : '—'
const enlacePublico = (token) => `${location.origin}/icaf/?t=${token}`

const FRECUENCIA = { diaria: 'Diaria', semanal: 'Semanal', mensual: 'Mensual', trimestral: 'Trimestral', semestral: 'Semestral', anual: 'Anual', eventual: 'Eventual (cuando se requiere)' }
const FORMATO = { fisico: 'Físico', digital: 'Digital', ambos: 'Ambos' }
const TABS = [['pendiente', 'Por revisar'], ['incorporado', 'Incorporadas'], ['descartado', 'Descartadas']]

let ENLACE = null
let CONTEOS = { pendiente: 0, incorporado: 0, descartado: 0 }
let TAB = 'pendiente'
let ENVIOS = []

// ---------------- Carga ----------------
async function cargar() {
  const [a, b] = await Promise.all([api('/api/icaf-publico/enlace'), api(`/api/icaf-publico/envios?estado=${TAB}`)])
  ENLACE = a.enlace; CONTEOS = b.conteos; ENVIOS = b.envios
  pintar()
}
async function recargarEnvios() {
  const b = await api(`/api/icaf-publico/envios?estado=${TAB}`)
  CONTEOS = b.conteos; ENVIOS = b.envios
  pintar()
}
const intentar = (fn) => async () => { try { await fn() } catch (e) { toast(e.message, 'error') } }

// ---------------- Enlace ----------------
function tarjetaEnlace() {
  const caja = el('section', { class: 'vr-card' }, el('h3', { text: 'Enlace del formulario' }))
  if (!ENLACE) {
    caja.append(
      el('p', { class: 'vr-muted', text: 'Todavía no hay enlace. Al crearlo queda abierto y listo para enviar.' }),
      el('div', { class: 'vr-acciones' }, el('button', { class: 'btn-primary', type: 'button', text: 'Crear enlace',
        onclick: intentar(async () => { ENLACE = (await api('/api/icaf-publico/enlace', { method: 'POST', body: {} })).enlace; pintar(); toast('Enlace creado', 'success') }) })))
    return caja
  }
  const abierta = ENLACE.estado === 'abierta'
  const url = enlacePublico(ENLACE.token)
  caja.append(
    el('p', { class: 'vr-muted' }, el('span', { class: `vr-estado ${abierta ? 'abierta' : 'cerrada'}`, text: abierta ? 'Abierto' : 'Cerrado' }),
      abierta ? ' Recibe respuestas. Es un solo enlace para toda la entidad: cada funcionario elige su dependencia.' : ' No recibe respuestas. Quien lo abra verá que el formulario se cerró.'),
    el('div', { class: `vr-enlace ${abierta ? '' : 'inactivo'}` },
      el('code', { text: url }),
      el('button', { class: 'btn-secondary btn-md', type: 'button', text: 'Copiar',
        onclick: async () => { try { await navigator.clipboard.writeText(url); toast('Enlace copiado', 'success') } catch { toast('No se pudo copiar; selecciónelo y cópielo a mano', 'warning') } } }),
      el('a', { class: 'btn-secondary btn-md', href: url, target: '_blank', rel: 'noopener', text: 'Abrir' })))

  const msg = el('textarea', { class: 'ip-mensaje', maxlength: '2000', placeholder: 'Ej.: Por favor diligéncielo antes del viernes. Si tiene dudas, comuníquese con Gestión Documental.' })
  msg.value = ENLACE.mensaje || ''
  const guardarMsg = debounce(async () => {
    try { ENLACE = (await api('/api/icaf-publico/enlace', { method: 'PUT', body: { mensaje: msg.value } })).enlace; toast('Mensaje guardado', 'success') }
    catch (e) { toast(e.message, 'error') }
  })
  msg.addEventListener('input', guardarMsg)
  caja.append(el('label', { class: 'vr-muted', style: 'display:block;margin-top:14px;' }, 'Mensaje que verá el funcionario al abrir el formulario (opcional)', msg))

  const nuevo = el('button', { class: 'btn-secondary btn-md', type: 'button', text: 'Generar enlace nuevo' })
  nuevo.addEventListener('click', intentar(async () => {
    if (nuevo.dataset.confirmar !== '1') { nuevo.dataset.confirmar = '1'; nuevo.textContent = 'Confirmar: el enlace anterior dejará de funcionar'; setTimeout(() => { nuevo.dataset.confirmar = ''; nuevo.textContent = 'Generar enlace nuevo' }, 6000); return }
    ENLACE = (await api('/api/icaf-publico/enlace/token', { method: 'POST' })).enlace; pintar(); toast('Enlace nuevo generado', 'success')
  }))
  caja.append(el('div', { class: 'vr-acciones' },
    el('button', { class: abierta ? 'btn-secondary btn-md' : 'btn-primary btn-md', type: 'button', text: abierta ? 'Cerrar formulario' : 'Abrir formulario',
      onclick: intentar(async () => { ENLACE = (await api('/api/icaf-publico/enlace', { method: 'PUT', body: { estado: abierta ? 'cerrada' : 'abierta' } })).enlace; pintar() }) }),
    nuevo))
  return caja
}

// ---------------- Respuestas ----------------
function fila(dt, dd) { return dd ? [el('dt', { text: dt }), el('dd', { text: dd })] : [] }

function tarjetaEnvio(e) {
  const caja = el('section', { class: 'vr-card' })
  caja.append(el('div', { class: 'ip-envio-cab' },
    el('h3', { text: e.cargo ? `${e.nombre} · ${e.cargo}` : e.nombre }),
    el('span', { class: 'vr-muted', text: `${e.dependencia || 'Dependencia eliminada'} · ${fecha(e.enviado_en)}` })))
  e.actividades.forEach((a, i) => caja.append(el('div', { class: 'ip-act' },
    el('b', { text: `${i + 1}. ${a.nombre}` }),
    el('dl', {},
      fila('Periodicidad', FRECUENCIA[a.frecuencia] || a.frecuencia),
      fila('Genera documentos', a.produce ? 'Sí' : 'No'),
      fila('Documentos que produce', a.documentos),
      fila('Formato', FORMATO[a.formato] || a.formato),
      fila('Documentos requeridos', a.recibe),
      fila('En qué consiste', a.descripcion)))))
  if (e.observaciones) caja.append(el('p', { class: 'vr-muted', text: `Comentario: ${e.observaciones}` }))

  if (e.estado === 'pendiente') {
    const n = e.actividades.length
    caja.append(el('div', { class: 'vr-acciones' },
      el('button', { class: 'btn-primary btn-md', type: 'button', text: n === 1 ? 'Incorporar al ICAF (1 actividad)' : `Incorporar al ICAF (${n} actividades)`,
        onclick: intentar(async () => { const r = await api(`/api/icaf-publico/envios/${encodeURIComponent(e.id)}/incorporar`, { method: 'POST' }); toast(r.creadas === 1 ? '1 actividad creada en el ICAF' : `${r.creadas} actividades creadas en el ICAF`, 'success'); await recargarEnvios() }) }),
      el('button', { class: 'btn-secondary btn-md', type: 'button', text: 'Descartar',
        onclick: intentar(async () => { await api(`/api/icaf-publico/envios/${encodeURIComponent(e.id)}/descartar`, { method: 'POST' }); toast('Respuesta descartada'); await recargarEnvios() }) })))
  } else {
    caja.append(el('p', { class: 'vr-muted', text: `${e.estado === 'incorporado' ? 'Incorporada' : 'Descartada'} el ${fecha(e.revisado_en)}${e.revisado_por ? ` por ${e.revisado_por}` : ''}` }))
  }
  return caja
}

function pintar() {
  const v = $('#vista'); v.replaceChildren(tarjetaEnlace())
  v.append(el('div', { class: 'vr-tabs' }, TABS.map(([k, txt]) => el('button', { type: 'button', class: TAB === k ? 'on' : '', text: `${txt} (${CONTEOS[k] || 0})`,
    onclick: intentar(async () => { TAB = k; await recargarEnvios() }) }))))
  if (!ENVIOS.length) {
    const vacio = { pendiente: 'No hay respuestas por revisar.', incorporado: 'Todavía no se ha incorporado ninguna respuesta.', descartado: 'No hay respuestas descartadas.' }
    v.append(el('div', { class: 'vr-card vr-vacio', text: vacio[TAB] }))
  } else {
    ENVIOS.forEach(e => v.append(tarjetaEnvio(e)))
    if (TAB === 'incorporado') v.append(el('p', { class: 'vr-muted', text: 'Las actividades incorporadas aparecen en el listado del ICAF a nombre del funcionario. Allí puede completarlas, descargar el formato para firma y generar las propuestas de la TRD.' }))
  }
}

renderHeader('ICAF')
cargar().catch(e => { $('#vista').replaceChildren(el('div', { class: 'vr-card vr-vacio', text: e.message })) })
