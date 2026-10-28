// SIPAD · Diagnóstico preliminar del SIC (frontend)
import { renderHeader } from '../components/header.js'

// ---------------- Sesión / API ----------------
function usuarioToken() {
  const t = sessionStorage.getItem('token'); if (!t) return null
  try { return JSON.parse(atob(t.split('.')[1])) } catch { return null }
}
const USER = usuarioToken()
const ES_MASTER = USER?.es_master_admin === true || USER?.es_master_admin === 1
const PUEDE_ANALIZAR = ES_MASTER || Number(USER?.nivel_acceso || 0) >= 60

async function api(url, options = {}) {
  const token = sessionStorage.getItem('token')
  const headers = { Authorization: `Bearer ${token}`, ...(options.headers || {}) }
  if (ES_MASTER) {
    const eid = sessionStorage.getItem('gestion_entidad_id') || sessionStorage.getItem('entidad_id')
    if (eid) headers['X-Entidad-Id'] = eid
  }
  if (options.body && typeof options.body !== 'string') { headers['Content-Type'] = 'application/json'; options.body = JSON.stringify(options.body) }
  const resp = await fetch(url, { ...options, headers })
  if (resp.status === 401) { sessionStorage.clear(); window.location.href = '/'; throw new Error('Sesión vencida') }
  return resp
}
async function apiJson(url, options) {
  const r = await api(url, options)
  let j = {}
  try { j = await r.json() } catch { /* sin cuerpo */ }
  if (!r.ok || j.ok === false) { const e = new Error(j.error || `Error ${r.status}`); e.status = r.status; throw e }
  return j
}

// ---------------- Utilidades UI ----------------
const $ = (s, el = document) => el.querySelector(s)
const esc = (s) => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]))
const fmt = (n) => (n === null || n === undefined ? '—' : Number(n).toLocaleString('es-CO', { maximumFractionDigits: 1 }))
function el(tag, attrs = {}, ...hijos) {
  const e = document.createElement(tag)
  for (const [k, v] of Object.entries(attrs || {})) {
    if (k === 'class') e.className = v
    else if (k.startsWith('on')) e.addEventListener(k.slice(2), v)
    else if (k === 'text') e.textContent = v
    else if (v !== undefined && v !== null && v !== false) e.setAttribute(k, v === true ? '' : v)
  }
  for (const h of hijos.flat()) if (h !== null && h !== undefined) e.append(h instanceof Node ? h : document.createTextNode(String(h)))
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
function estadoGuardado(txt, clase = '') {
  const e = $('#estadoGuardado'); e.textContent = txt; e.className = 'sic-estado-guardado ' + clase
}

// ---------------- Estado ----------------
let CAT = null
let EST = null
let espacioActivo = sessionStorage.getItem('sic_espacio') || null

// ---------------- Guardado automático (por lotes) ----------------
// Cada respuesta se envía al servidor a los 0,7 s. Además queda una copia en este equipo
// hasta que el servidor confirma: si se va el internet, se cierra la pestaña o vence la sesión,
// al volver a abrir el cuestionario se envía lo que faltaba.
const pendientes = new Map() // destino → { id: valor }
let temporizador = null
let reintento = null
const CLAVE_RESPALDO = `sic_pendientes_${USER?.sub || 'x'}_${USER?.entidad_id || ''}_${sessionStorage.getItem('gestion_entidad_id') || ''}`
function respaldar() {
  try {
    if (pendientes.size) localStorage.setItem(CLAVE_RESPALDO, JSON.stringify([...pendientes.entries()]))
    else localStorage.removeItem(CLAVE_RESPALDO)
  } catch { /* sin almacenamiento local: solo queda el envío al servidor */ }
}
function restaurarRespaldo() {
  try {
    const guardado = JSON.parse(localStorage.getItem(CLAVE_RESPALDO) || 'null')
    if (!Array.isArray(guardado)) return 0
    let n = 0
    for (const [destino, parche] of guardado) {
      pendientes.set(destino, { ...parche, ...(pendientes.get(destino) || {}) }); n += Object.keys(parche).length
    }
    return n
  } catch { return 0 }
}
function encolar(destino, id, valor) {
  if (!pendientes.has(destino)) pendientes.set(destino, {})
  pendientes.get(destino)[id] = valor
  respaldar()
  estadoGuardado('Guardando…')
  clearTimeout(temporizador)
  temporizador = setTimeout(vaciarCola, 700)
}
let enviando = null
async function vaciarCola() {
  clearTimeout(temporizador)
  if (enviando) { await enviando; if (!pendientes.size) return }
  if (!pendientes.size) return
  enviando = (async () => {
    const lote = [...pendientes.entries()]; pendientes.clear()
    let error = null, sinConexion = false
    for (const [destino, parche] of lote) {
      try {
        if (destino === 'inst') await apiJson('/api/sic/respuestas', { method: 'PUT', body: { respuestas: parche } })
        else {
          const [tipo, id, parte] = destino.split(':')
          if (tipo === 'esp') await apiJson(`/api/sic/espacios/${id}`, { method: 'PUT', body: { [parte]: parche } })
          if (tipo === 'rep') await apiJson(`/api/sic/repositorios/${id}`, { method: 'PUT', body: { datos: parche } })
        }
        for (const pid of Object.keys(parche)) document.querySelector(`[data-preg="${pid}"]`)?.classList.remove('error')
      } catch (e) {
        if (!e.status || e.status >= 500) {
          // Sin internet o servidor caído: se devuelve a la cola (lo más reciente gana) y se reintenta
          sinConexion = true
          pendientes.set(destino, { ...parche, ...(pendientes.get(destino) || {}) })
        } else {
          error = e.message
          const m = /^([A-Z]{1,3}-\d{2,3})/.exec(e.message)
          if (m) document.querySelector(`[data-preg="${m[1]}"]`)?.classList.add('error')
        }
      }
    }
    respaldar()
    if (sinConexion) {
      estadoGuardado('Sin conexión: sus respuestas quedan guardadas en este equipo y se enviarán solas', 'err')
      clearTimeout(reintento); reintento = setTimeout(vaciarCola, 15000)
    } else if (error) { estadoGuardado('No se guardó: ' + error, 'err'); toast(error, 'error') }
    else { estadoGuardado('Guardado ✓ ' + new Date().toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' }), 'ok'); refrescarAvance() }
  })()
  try { await enviando } finally { enviando = null }
}
window.addEventListener('beforeunload', (e) => { if (pendientes.size) { respaldar(); vaciarCola(); e.preventDefault() } })
window.addEventListener('online', () => vaciarCola())
document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'hidden' && pendientes.size) { respaldar(); vaciarCola() } })

async function refrescarAvance() {
  try { const j = await apiJson('/api/sic/estado'); EST.avance = j.avance; pintarAvance() } catch { /* silencioso */ }
}

// ---------------- Renderizador genérico de preguntas ----------------
const SPN = [['si', 'Sí'], ['parcial', 'Parcial'], ['no', 'No'], ['ns', 'No sabe']]
const ESC = [['ausente', 'Ausente', 'bien'], ['puntual', 'Puntual', 'med'], ['extendido', 'Extendido', 'mal']]

function limpio(o) {
  const out = {}
  for (const [k, v] of Object.entries(o)) if (!(v === undefined || v === null || v === '' || (Array.isArray(v) && !v.length))) out[k] = v
  return Object.keys(out).length ? out : null
}

// p: pregunta; actual: {v,x,s,o}|undefined; guardar(valor|null)
function pregunta(p, actual, guardar, { dependencias = [] } = {}) {
  let estado = { ...(actual || {}) }
  const emitir = () => guardar(limpio(estado))
  const caja = el('div', { class: 'sic-preg', 'data-preg': p.id })
  caja.append(el('div', { class: 'enunciado' }, el('code', { text: p.n ? `${p.n}.` : p.id }), p.texto, p.opcional ? el('span', { class: 'opcional', text: ' (opcional)' }) : null))

  const seg = (opciones, clases = {}) => {
    const w = el('div', { class: 'sic-seg' })
    for (const [val, etq, cl] of opciones) {
      const b = el('button', { type: 'button', class: [cl || clases[val] || '', estado.v === val ? 'on' : ''].join(' ').trim(), text: etq })
      b.addEventListener('click', () => {
        estado.v = estado.v === val ? undefined : val
        w.querySelectorAll('button').forEach(x => x.classList.remove('on'))
        if (estado.v === val) b.classList.add('on')
        emitir()
      })
      w.append(b)
    }
    return w
  }

  switch (p.tipo) {
    case 'spn': caja.append(seg(SPN.map(([v, t]) => [v, t, v === 'ns' ? 'ns' : ''])))
      break
    case 'escala': caja.append(seg(ESC))
      break
    case 'lista':
      if (p.opciones.length <= 5) caja.append(seg(p.opciones.map(o => [o, o])))
      else {
        const s = el('select', {}, el('option', { value: '', text: '— Seleccione —' }), ...p.opciones.map(o => el('option', { value: o, text: o })))
        s.value = estado.v || ''
        s.addEventListener('change', () => { estado.v = s.value || undefined; emitir() })
        caja.append(el('div', { class: 'sic-input' }, s))
      }
      break
    case 'multi':
    case 'dep': {
      const ops = p.tipo === 'dep' ? dependencias.map(d => [String(d.id), d.nombre]) : p.opciones.map(o => [o, o])
      if (!ops.length) { caja.append(el('div', { class: 'meta', text: 'No hay dependencias registradas en la entidad.' })); break }
      const w = el('div', { class: 'sic-chips' })
      const sel = new Set((estado.v || []).map(String))
      for (const [val, etq] of ops) {
        const cb = el('input', { type: 'checkbox', value: val }); cb.checked = sel.has(val)
        cb.addEventListener('change', () => {
          if (cb.checked) { if (p.max && sel.size >= p.max) { cb.checked = false; toast(`Máximo ${p.max} opciones`, 'warning'); return } sel.add(val) } else sel.delete(val)
          estado.v = [...sel]; emitir()
        })
        w.append(el('label', {}, cb, etq))
      }
      caja.append(w)
      break
    }
    case 'num': {
      const i = el('input', { type: 'number', min: '0', step: 'any', inputmode: 'decimal' }); i.value = estado.v ?? ''
      i.addEventListener('input', () => { estado.v = i.value === '' ? undefined : Number(i.value); emitir() })
      caja.append(el('div', { class: 'sic-input' }, i, p.unidad ? el('span', { class: 'unidad', text: p.unidad }) : null))
      break
    }
    case 'txt': {
      const largo = /observaci|qué pasa|plataforma/i.test(p.texto)
      const i = largo ? el('textarea', { rows: '3' }) : el('input', { type: 'text' })
      i.value = estado.v ?? ''
      i.addEventListener('input', () => { estado.v = i.value; emitir() })
      caja.append(el('div', { class: 'sic-input' }, i))
      break
    }
    case 'pct3': {
      const v = estado.v || {}
      const w = el('div', { class: 'sic-pct3' })
      const suma = el('span', { class: 'suma' })
      const ins = {}
      const recalcular = (enviar) => {
        const b = Number(ins.bueno.value || 0), r = Number(ins.regular.value || 0), m = Number(ins.malo.value || 0)
        const s = b + r + m
        const vacioTodo = ['bueno', 'regular', 'malo'].every(k => ins[k].value === '')
        suma.textContent = vacioTodo ? '' : `Suma: ${s} %`
        suma.className = 'suma ' + (vacioTodo ? '' : Math.abs(s - 100) < 0.5 ? 'bien' : 'mal')
        if (!enviar) return
        if (vacioTodo) { estado.v = undefined; emitir() }
        else if (Math.abs(s - 100) < 0.5) { estado.v = { bueno: b, regular: r, malo: m }; emitir() }
      }
      for (const [k, etq] of [['bueno', '% bueno'], ['regular', '% regular'], ['malo', '% malo']]) {
        ins[k] = el('input', { type: 'number', min: '0', max: '100', inputmode: 'numeric' }); ins[k].value = v[k] ?? ''
        ins[k].addEventListener('input', () => recalcular(true))
        w.append(el('label', {}, etq, ins[k]))
      }
      w.append(suma); recalcular(false)
      caja.append(w)
      break
    }
  }

  if (p.extra) {
    const i = el('input', { type: p.extra.tipo === 'num' ? 'number' : 'text', min: '0', step: 'any' })
    i.value = estado.x ?? ''
    if (p.extra.defecto !== undefined) i.placeholder = `Ej.: ${p.extra.defecto}`
    i.addEventListener('input', () => { estado.x = i.value === '' ? undefined : (p.extra.tipo === 'num' ? Number(i.value) : i.value); emitir() })
    caja.append(el('div', { class: 'sic-extra sic-input' }, el('label', { text: p.extra.etiqueta }), i))
  }
  if (p.obs) {
    const i = el('textarea', { rows: '2', placeholder: 'Respuesta en palabras de quien responde (detalle, ejemplos, dónde, cuándo)…' })
    i.value = estado.o ?? ''
    i.addEventListener('input', () => { estado.o = i.value || undefined; emitir() })
    caja.append(el('div', { class: 'sic-obs sic-input' }, i))
  }
  if (p.soporte) {
    const i = el('input', { type: 'text', placeholder: 'Ej.: Decreto 045 de 2023, acta del 12/03/2025…' })
    i.value = estado.s ?? ''
    i.addEventListener('input', () => { estado.s = i.value || undefined; emitir() })
    caja.append(el('div', { class: 'sic-soporte sic-input' }, el('label', { text: 'Documento soporte (si existe)' }), i))
  }
  return caja
}

// Una pregunta con noAplicaSi deja de aplicar según la respuesta de otra (p. ej. sin plataforma ⇒ 136–138 no aplican)
function aplica(p) {
  return !p.noAplicaSi || EST.institucional?.[p.noAplicaSi.pregunta]?.v !== p.noAplicaSi.valor
}
const RECUENTOS = []
function actualizarAplicabilidad() {
  for (const p of (CAT?.institucional || []).flatMap(b => b.preguntas).filter(q => q.noAplicaSi)) {
    const caja = document.querySelector(`[data-preg="${p.id}"]`)
    if (caja) caja.classList.toggle('no-aplica', !aplica(p))
  }
  RECUENTOS.forEach(f => f())
}

function contarRespondidas(preguntas, obj) {
  return preguntas.filter(aplica).filter(p => { const r = obj?.[p.id]; return r && !(r.v === undefined || r.v === null || r.v === '' || (Array.isArray(r.v) && !r.v.length)) }).length
}

function bloque(titulo, preguntas, obj, crearPregunta, { abierto = false, ayuda = null } = {}) {
  const d = el('details', { class: 'sic-bloque' }); if (abierto) d.open = true
  const total = () => preguntas.filter(aplica).length
  const n = contarRespondidas(preguntas, obj)
  const cuenta = el('span', { class: 'cuenta' + (n === total() ? ' lleno' : ''), text: `${n}/${total()}` })
  d.append(el('summary', {}, el('span', { text: titulo }), cuenta))
  const cuerpo = el('div', { class: 'cuerpo' })
  if (ayuda) cuerpo.append(el('p', { class: 'sic-ayuda', text: ayuda }))
  const recontar = () => {
    const m = contarRespondidas(preguntas, obj), t = total()
    cuenta.textContent = `${m}/${t}`; cuenta.classList.toggle('lleno', m === t)
  }
  RECUENTOS.push(recontar)
  for (const p of preguntas) cuerpo.append(crearPregunta(p, recontar))
  d.append(cuerpo)
  return d
}

// ---------------- Avance ----------------
function pintarAvance() {
  const a = EST.avance
  $('#avanceGeneral').innerHTML = `
    <div class="sic-barra" title="Avance general"><i style="width:${a.general}%"></i></div>
    <span><b>${a.institucional.pct}%</b> del cuestionario (${a.institucional.respondidas}/${a.institucional.total})` +
    (a.institucional.precargadas ? ` · <b class="por-confirmar">${a.institucional.precargadas} por confirmar</b>` : '') + '</span>'
}

// ---------------- Panel 0 · Espacios ----------------
function panelEspacios() {
  const p = $('#panel-espacios'); p.innerHTML = ''
  const inp = el('input', { type: 'number', min: '0', step: '1', inputmode: 'numeric' }); inp.value = EST.espaciosDeclarados ?? ''
  let t
  inp.addEventListener('input', () => {
    clearTimeout(t)
    t = setTimeout(async () => {
      try { await apiJson('/api/sic/meta', { method: 'PUT', body: { espacios_declarados: inp.value === '' ? null : Number(inp.value) } }); EST.espaciosDeclarados = inp.value === '' ? null : Number(inp.value); estadoGuardado('Guardado ✓', 'ok'); refrescarAvance() }
      catch (e) { toast(e.message, 'error') }
    }, 600)
  })
  p.append(el('div', { class: 'sic-declarar' },
    el('b', { text: '¿Cuántos espacios guardan documentos de la entidad?' }), inp,
    el('span', { class: 'nota', text: 'Cuente oficinas, bodegas, depósitos e inmuebles externos (también los abandonados). Luego registre cada uno: SIPAD crea su ficha de inspección.' })))

  const form = el('div')
  p.append(el('div', { class: 'sic-acciones-top' },
    el('button', { class: 'btn-primary btn-sm', type: 'button', text: '+ Registrar espacio', onclick: () => formularioEspacio(form) })), form)

  if (!EST.espacios.length) { p.append(el('div', { class: 'sic-vacio', text: 'Aún no hay espacios registrados.' })); return }
  const grid = el('div', { class: 'sic-cards' })
  const totalFicha = CAT.ficha.reduce((n, b) => n + b.preguntas.filter(q => !q.opcional).length, 0)
  for (const e of EST.espacios) {
    const resp = CAT.ficha.reduce((n, b) => n + contarRespondidas(b.preguntas.filter(q => !q.opcional), e.ficha), 0)
    const pct = Math.round(resp / totalFicha * 100)
    const deps = (e.registro['ESP-03']?.v || []).map(id => EST.dependencias.find(d => String(d.id) === String(id))?.nombre).filter(Boolean)
    grid.append(el('div', { class: 'sic-card' },
      el('h3', { text: e.registro['ESP-01']?.v || '(sin nombre)' }),
      el('div', { class: 'meta', text: [e.registro['ESP-04']?.v, e.registro['ESP-02']?.v].filter(Boolean).join(' · ') || 'Sin tipo ni ubicación' }),
      el('div', { class: 'meta', text: deps.length ? deps.join(', ') : 'Sin dependencia asignada' }),
      el('div', { class: 'sic-mini' }, el('i', { style: `width:${pct}%` })),
      el('div', { class: 'meta', text: `Ficha ${resp}/${totalFicha} · ${e.fotos} foto(s) (opcionales)` }),
      el('div', { class: 'acciones-card' },
        el('button', { class: 'btn-primary btn-sm', type: 'button', text: 'Inspeccionar', onclick: () => { espacioActivo = e.id; sessionStorage.setItem('sic_espacio', e.id); irA('inspeccion') } }),
        el('button', { class: 'btn-secondary btn-sm', type: 'button', text: 'Editar registro', onclick: () => formularioEspacio(form, e) }),
        el('button', { class: 'btn-danger btn-sm', type: 'button', text: 'Eliminar', onclick: () => eliminarEspacio(e) }))))
  }
  p.append(grid)
}

function formularioEspacio(cont, existente = null) {
  cont.innerHTML = ''
  const datos = { ...(existente?.registro || {}) }
  const f = el('div', { class: 'sic-form' }, el('h3', { text: existente ? 'Editar registro del espacio' : 'Registrar espacio' }))
  for (const p of CAT.registroEspacio) f.append(pregunta(p, datos[p.id], (v) => {
    if (v === null) delete datos[p.id]; else datos[p.id] = v
    if (existente) encolar(`esp:${existente.id}:registro`, p.id, v)
  }, { dependencias: EST.dependencias }))
  const pie = el('div', { class: 'pie' })
  pie.append(el('button', { class: 'btn-secondary btn-sm', type: 'button', text: existente ? 'Cerrar' : 'Cancelar', onclick: async () => { cont.innerHTML = ''; if (existente) { await vaciarCola(); await recargar('espacios') } } }))
  if (!existente) pie.append(el('button', { class: 'btn-primary btn-sm', type: 'button', text: 'Registrar', onclick: async () => {
    try {
      const r = await apiJson('/api/sic/espacios', { method: 'POST', body: { registro: datos } })
      toast('Espacio registrado', 'success'); espacioActivo = r.id; sessionStorage.setItem('sic_espacio', r.id)
      await recargar('espacios')
    } catch (e) { toast(e.message, 'error') }
  } }))
  f.append(pie)
  cont.append(f)
  f.scrollIntoView({ behavior: 'smooth', block: 'start' })
}

async function eliminarEspacio(e) {
  const nombre = e.registro['ESP-01']?.v || 'este espacio'
  if (!window.confirm(`¿Eliminar "${nombre}" con su ficha y fotografías? Esta acción no se puede deshacer.`)) return
  try { await apiJson(`/api/sic/espacios/${e.id}`, { method: 'DELETE' }); toast('Espacio eliminado', 'success'); await recargar('espacios') }
  catch (err) { toast(err.message, 'error') }
}

// ---------------- Panel 1 · Institucional ----------------
const esPrecargada = (id) => EST.auditoria?.[id]?.por === 'precarga' && EST.institucional[id]
function marcarConfirmada(id) {
  EST.auditoria = EST.auditoria || {}
  EST.auditoria[id] = { por: USER?.nombre || 'usuario', en: new Date().toISOString() }
  document.querySelector(`[data-preg="${id}"]`)?.classList.remove('precargada')
  document.querySelector(`[data-preg="${id}"] .sic-precarga`)?.remove()
}
function panelPreguntasInst(contenedor, bloques) {
  bloques.forEach((b, i) => {
    const d = bloque(`${b.id} · ${b.titulo}`, b.preguntas, EST.institucional, (p, actualizarCuenta) => {
      const caja = pregunta(p, EST.institucional[p.id], (v) => {
        if (v === null) delete EST.institucional[p.id]; else EST.institucional[p.id] = v
        actualizarCuenta(); encolar('inst', p.id, v); marcarConfirmada(p.id)
        if (CAT.institucional.some(b => b.preguntas.some(q => q.noAplicaSi?.pregunta === p.id))) actualizarAplicabilidad()
      })
      if (p.noAplicaSi) {
        caja.querySelector('.enunciado').append(el('span', { class: 'sic-na', text: ` · No aplica: en la pregunta ${CAT.institucional.flatMap(b => b.preguntas).find(q => q.id === p.noAplicaSi.pregunta)?.n ?? p.noAplicaSi.pregunta} se respondió "No"` }))
        if (!aplica(p)) caja.classList.add('no-aplica')
      }
      if (esPrecargada(p.id)) {
        caja.classList.add('precargada')
        caja.insertBefore(el('div', { class: 'sic-precarga' },
          el('span', { text: 'Precargada · por confirmar' }),
          el('button', { type: 'button', class: 'btn-secondary btn-sm', text: 'Confirmar', onclick: () => { encolar('inst', p.id, EST.institucional[p.id]); marcarConfirmada(p.id); refrescarPendientes() } })), caja.children[1] || null)
      }
      return caja
    }, { abierto: i === 0 })
    const pend = b.preguntas.filter(p => esPrecargada(p.id))
    if (pend.length) {
      const btn = el('button', { type: 'button', class: 'vr-link sic-confirmar-bloque', text: `Confirmar las ${pend.length} respuestas precargadas de este bloque`, onclick: () => {
        for (const p of b.preguntas.filter(q => esPrecargada(q.id))) { encolar('inst', p.id, EST.institucional[p.id]); marcarConfirmada(p.id) }
        btn.remove(); refrescarPendientes()
      } })
      d.querySelector('.cuerpo').prepend(btn)
    }
    contenedor.append(d)
  })
}
function refrescarPendientes() {
  const n = CAT.institucional.flatMap(b => b.preguntas).filter(p => esPrecargada(p.id)).length
  const caja = $('#sicPendientes'); if (caja) caja.textContent = n ? `${n} respuesta(s) precargadas por confirmar.` : 'Todas las respuestas precargadas están confirmadas.'
}
function panelInstitucional() {
  const p = $('#panel-institucional'); p.innerHTML = ''
  RECUENTOS.length = 0
  p.append(el('p', { class: 'sic-ayuda', text: 'Lo responde una sola persona que conozca la entidad (por ejemplo, el responsable de archivo). Marque la respuesta rápida y escriba la respuesta en sus palabras. Las respuestas precargadas son un punto de partida: revíselas, cámbielas si no son correctas y confírmelas.' }))
  const hayPrecarga = CAT.institucional.flatMap(b => b.preguntas).some(q => EST.auditoria?.[q.id]?.por === 'precarga')
  const barra = el('div', { class: 'sic-acciones-top' })
  if (hayPrecarga) barra.append(el('div', { class: 'sic-aviso', id: 'sicPendientes' }))
  if (PUEDE_ANALIZAR) {
    const archivo = el('input', { type: 'file', accept: '.docx', hidden: true })
    archivo.addEventListener('change', async () => {
      const f = archivo.files?.[0]; if (!f) return
      const datos = await new Promise((ok, mal) => { const r = new FileReader(); r.onload = () => ok(String(r.result)); r.onerror = mal; r.readAsDataURL(f) })
      try {
        await vaciarCola()
        const r = await apiJson('/api/sic/importar-entrevista', { method: 'POST', body: { archivo: datos } })
        toast(`Precargadas ${r.precargadas} respuestas` + (r.omitidas ? ` (${r.omitidas} ya respondidas no se cambiaron)` : ''), 'success')
        await recargar('institucional')
      } catch (e) { toast(e.message, 'error') } finally { archivo.value = '' }
    })
    barra.append(archivo, el('button', { class: 'btn-secondary btn-sm', type: 'button', text: '⬆ Precargar respuestas desde Word', onclick: () => archivo.click() }))
  }
  p.append(barra)
  panelPreguntasInst(p, CAT.institucional)
  refrescarPendientes()
}

// ---------------- Panel 2 · Inspección ----------------
async function cargarMiniatura(img, id) {
  try { const r = await api(`/api/sic/fotos/${id}`); if (!r.ok) return; img.src = URL.createObjectURL(await r.blob()) } catch { /* sin miniatura */ }
}

function comprimir(file, maxLado = 1600, calidad = 0.75) {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => {
      const k = Math.min(1, maxLado / Math.max(img.width, img.height))
      const w = Math.round(img.width * k), h = Math.round(img.height * k)
      const c = document.createElement('canvas'); c.width = w; c.height = h
      c.getContext('2d').drawImage(img, 0, 0, w, h)
      resolve({ datos: c.toDataURL('image/jpeg', calidad), ancho: w, alto: h })
      URL.revokeObjectURL(img.src)
    }
    img.onerror = () => reject(new Error('No se pudo leer la imagen'))
    img.src = URL.createObjectURL(file)
  })
}

function panelInspeccion() {
  const p = $('#panel-inspeccion'); p.innerHTML = ''
  if (!EST.espacios.length) { p.append(el('div', { class: 'sic-vacio', text: 'Primero registre los espacios en la pestaña 0 · Espacios.' })); return }
  if (!EST.espacios.some(e => e.id === espacioActivo)) espacioActivo = EST.espacios[0].id
  const sel = el('select', {}, ...EST.espacios.map(e => el('option', { value: e.id, text: e.registro['ESP-01']?.v || '(sin nombre)' })))
  sel.value = espacioActivo
  sel.addEventListener('change', async () => { await vaciarCola(); espacioActivo = sel.value; sessionStorage.setItem('sic_espacio', sel.value); panelInspeccion() })
  p.append(el('div', { class: 'sic-selector' }, el('b', { text: 'Espacio:' }), sel))

  const e = EST.espacios.find(x => x.id === espacioActivo)
  CAT.ficha.forEach((b, i) => p.append(bloque(`${b.id} · ${b.titulo}`, b.preguntas, e.ficha, (q, actualizarCuenta) =>
    pregunta(q, e.ficha[q.id], (v) => {
      if (v === null) delete e.ficha[q.id]; else e.ficha[q.id] = v
      actualizarCuenta(); encolar(`esp:${e.id}:ficha`, q.id, v)
    }), { abierto: i === 0, ayuda: b.ayuda || null })))

  // Fotografías
  const fotos = el('div', { class: 'sic-fotos' })
  for (const f of e.fotosLista || []) {
    const img = el('img', { alt: f.nombre || 'foto' })
    cargarMiniatura(img, f.id)
    fotos.append(el('div', { class: 'sic-foto' }, img, el('button', { type: 'button', title: 'Eliminar foto', text: '×', onclick: async () => {
      if (!window.confirm('¿Eliminar esta fotografía?')) return
      try { await apiJson(`/api/sic/fotos/${f.id}`, { method: 'DELETE' }); await recargar('inspeccion') } catch (err) { toast(err.message, 'error') }
    } })))
  }
  const input = el('input', { type: 'file', accept: 'image/*', capture: 'environment', multiple: true })
  input.addEventListener('change', async () => {
    const archivos = [...input.files]; if (!archivos.length) return
    estadoGuardado(`Subiendo ${archivos.length} foto(s)…`)
    let ok = 0
    for (const file of archivos) {
      try {
        const c = await comprimir(file)
        await apiJson(`/api/sic/espacios/${e.id}/fotos`, { method: 'POST', body: { nombre: file.name, mime: 'image/jpeg', ...c } })
        ok++
      } catch (err) { toast(err.message, 'error') }
    }
    estadoGuardado(`${ok} foto(s) guardadas ✓`, 'ok')
    await recargar('inspeccion')
  })
  fotos.append(el('label', { class: 'sic-subir' }, input, '📷 Tomar o subir foto'))
  const d = el('details', { class: 'sic-bloque', open: true },
    el('summary', {}, el('span', { text: 'Fotografías — opcionales (se recomiendan: panorámica, mobiliario y el deterioro más grave)' }),
      el('span', { class: 'cuenta' + ((e.fotos || 0) >= (CAT.fotosRecomendadas || 3) ? ' lleno' : ''), text: `${e.fotos || 0} · opcional` })),
    el('div', { class: 'cuerpo' }, fotos))
  p.append(d)
}

// ---------------- Panel 3 · Sistemas ----------------
function panelSistemas() {
  const p = $('#panel-sistemas'); p.innerHTML = ''
  p.append(el('p', { class: 'sic-ayuda', text: 'Opcional. Las preguntas sobre documentos electrónicos están en el cuestionario (bloques 4 y 9). Aquí, si la Oficina de Sistemas puede, se registra cada sistema, aplicación, carpeta o computador donde se guarden documentos de la entidad, incluidos los computadores y nubes personales.' }))
  panelPreguntasInst(p, CAT.sistemas)

  p.append(el('h2', { class: 'sic-h2', text: 'Inventario de sistemas y repositorios' }))
  const form = el('div')
  p.append(el('div', { class: 'sic-acciones-top' },
    el('button', { class: 'btn-primary btn-sm', type: 'button', text: '+ Registrar sistema o repositorio', onclick: () => formularioRepo(form) })), form)
  if (!EST.repositorios.length) { p.append(el('div', { class: 'sic-vacio', text: 'Aún no hay sistemas ni repositorios registrados.' })); return }
  const grid = el('div', { class: 'sic-cards' })
  for (const r of EST.repositorios) {
    const d = r.datos
    grid.append(el('div', { class: 'sic-card' },
      el('h3', { text: d['SR-01']?.v || '(sin nombre)' }),
      el('div', { class: 'meta', text: [d['SR-02']?.v, d['SR-08']?.v].filter(Boolean).join(' · ') || 'Sin tipo' }),
      el('div', { class: 'meta', text: `Copia de seguridad: ${d['SR-09']?.v || 'sin dato'} · Indispensable: ${({ si: 'Sí', no: 'No', parcial: 'Parcial', ns: 'No sabe' })[d['SR-11']?.v] || 'sin dato'}` }),
      el('div', { class: 'acciones-card' },
        el('button', { class: 'btn-secondary btn-sm', type: 'button', text: 'Editar', onclick: () => formularioRepo(form, r) }),
        el('button', { class: 'btn-danger btn-sm', type: 'button', text: 'Eliminar', onclick: async () => {
          if (!window.confirm(`¿Eliminar "${d['SR-01']?.v || 'repositorio'}"?`)) return
          try { await apiJson(`/api/sic/repositorios/${r.id}`, { method: 'DELETE' }); await recargar('sistemas') } catch (err) { toast(err.message, 'error') }
        } }))))
  }
  p.append(grid)
}

function formularioRepo(cont, existente = null) {
  cont.innerHTML = ''
  const datos = { ...(existente?.datos || {}) }
  const f = el('div', { class: 'sic-form' }, el('h3', { text: existente ? 'Editar sistema o repositorio' : 'Registrar sistema o repositorio' }))
  for (const p of CAT.repositorio) f.append(pregunta(p, datos[p.id], (v) => {
    if (v === null) delete datos[p.id]; else datos[p.id] = v
    if (existente) encolar(`rep:${existente.id}`, p.id, v)
  }, { dependencias: EST.dependencias }))
  const pie = el('div', { class: 'pie' })
  pie.append(el('button', { class: 'btn-secondary btn-sm', type: 'button', text: existente ? 'Cerrar' : 'Cancelar', onclick: async () => { cont.innerHTML = ''; if (existente) { await vaciarCola(); await recargar('sistemas') } } }))
  if (!existente) pie.append(el('button', { class: 'btn-primary btn-sm', type: 'button', text: 'Registrar', onclick: async () => {
    try { await apiJson('/api/sic/repositorios', { method: 'POST', body: { datos } }); toast('Repositorio registrado', 'success'); await recargar('sistemas') }
    catch (e) { toast(e.message, 'error') }
  } }))
  f.append(pie)
  cont.append(f)
  f.scrollIntoView({ behavior: 'smooth', block: 'start' })
}

// ---------------- Panel · Resultados ----------------
const COLOR_IND = (v) => v === null ? '#cbd5e1' : v < 25 ? '#b91c1c' : v < 50 ? '#ea580c' : v < 75 ? '#ca8a04' : '#16a34a'

async function panelResultados() {
  const p = $('#panel-resultados'); p.innerHTML = '<div class="sic-vacio">Analizando el diagnóstico…</div>'
  let j
  try { await vaciarCola(); j = await apiJson('/api/sic/analisis') }
  catch (e) { p.innerHTML = `<div class="sic-vacio">${esc(e.message)}</div>`; return }
  const a = j.analisis, r = a.resumen
  p.innerHTML = ''

  const btnWord = el('button', { class: 'btn-primary btn-sm', type: 'button', text: '⬇ Descargar informe Word', onclick: () => descargarInforme(btnWord) })
  p.append(el('div', { class: 'sic-acciones-top' }, btnWord,
    el('button', { class: 'btn-secondary btn-sm', type: 'button', text: '↻ Actualizar análisis', onclick: panelResultados })))

  const kpi = (n, l, rojo) => el('div', { class: 'sic-kpi' + (rojo ? ' rojo' : '') }, el('div', { class: 'n', text: n }), el('div', { class: 'l', text: l }))
  p.append(el('div', { class: 'sic-kpis' },
    kpi(String(a.hallazgos.length), 'hallazgos con su acción'),
    kpi(String(a.avance.institucional.precargadas || 0), 'respuestas precargadas sin confirmar', (a.avance.institucional.precargadas || 0) > 0),
    kpi(`${a.avance.institucional.respondidas}/${a.avance.institucional.total}`, 'preguntas respondidas'),
    kpi(String(r.hallazgos_por_prioridad['crítica']), 'acciones de prioridad crítica', r.hallazgos_por_prioridad['crítica'] > 0),
    kpi(String(a.verificaciones.length), 'respuestas por verificar', a.verificaciones.length > 0)))

  const quienes = j.respondientes || []
  p.append(el('div', { class: 'meta', style: 'font-size:13px;color:#475569;margin:4px 0 10px',
    text: quienes.length ? 'Respondió: ' + quienes.map(x => `${x.nombre}${x.cargo ? ' (' + x.cargo + ')' : ''} · ${x.respuestas} respuestas`).join('; ')
      : 'Aún nadie ha respondido con su usuario.' }))

  // Resumen ejecutivo
  const res = el('div', { class: 'sic-resumen' })
  const ta = el('textarea', {}); ta.value = j.resumen?.texto || j.redaccion.sintesis
  const avisos = el('div')
  const pintarAvisos = (lista) => { avisos.innerHTML = ''; for (const x of lista || []) avisos.append(el('div', { class: 'sic-aviso', text: x })) }
  pintarAvisos(j.resumen?.advertencias)
  const origen = el('div', { class: 'meta', style: 'font-size:12px;color:#64748b;margin-bottom:6px',
    text: j.resumen ? `Texto ${j.resumen.editado ? 'editado' : 'redactado por el asistente'} (${new Date(j.resumen_en).toLocaleString('es-CO')}). Va al informe.` : 'Síntesis del motor (va al informe si no redacta ni guarda otro texto).' })
  const btnRedactar = el('button', { class: 'btn-secondary btn-sm', type: 'button', text: '✍ Redactar con el asistente', onclick: async () => {
    btnRedactar.disabled = true; btnRedactar.textContent = 'Redactando…'
    try {
      const out = await apiJson('/api/sic/resumen', { method: 'POST' })
      ta.value = out.texto; pintarAvisos([...(out.advertencias || []), ...(out.aviso ? [out.aviso] : [])])
      origen.textContent = out.fuente === 'asistente' ? 'Redactado por el asistente y guardado. Revíselo antes de usarlo.' : 'Síntesis del motor.'
    } catch (e) { toast(e.message, 'error') }
    finally { btnRedactar.disabled = false; btnRedactar.textContent = '✍ Redactar con el asistente' }
  } })
  const btnGuardar = el('button', { class: 'btn-primary btn-sm', type: 'button', text: 'Guardar texto', onclick: async () => {
    try { await apiJson('/api/sic/resumen', { method: 'PUT', body: { texto: ta.value } }); toast('Resumen guardado', 'success'); origen.textContent = 'Texto editado y guardado. Va al informe.' }
    catch (e) { toast(e.message, 'error') }
  } })
  res.append(origen, ta, avisos, el('div', { class: 'sic-acciones-top', style: 'margin-top:8px' }, btnRedactar, btnGuardar))
  p.append(el('h2', { class: 'sic-h2', text: 'Resumen ejecutivo' }), res)

  // Espacios (solo si se registraron)
  if (a.espacios.length) {
    p.append(el('h2', { class: 'sic-h2', text: 'Estado y riesgo por espacio' }))
    const t = el('table', { class: 'sic-tabla' })
    t.innerHTML = `<thead><tr><th>Espacio</th><th>Tipo</th><th>Estado B/R/M</th><th>Riesgo</th><th>Factores principales</th></tr></thead>`
    const tb = el('tbody')
    for (const e of a.espacios) tb.insertAdjacentHTML('beforeend', `<tr>
      <td><b>${esc(e.nombre)}</b></td><td>${esc(e.tipo || '—')}</td>
      <td>${e.estado ? `${fmt(e.estado.bueno)} / ${fmt(e.estado.regular)} / ${fmt(e.estado.malo)}` : '—'}</td>
      <td>${e.riesgo.nivel ? `<span class="nivel ${esc(e.riesgo.nivel)}">${esc(e.riesgo.nivel)}</span>` : '<span class="meta">Sin inspección</span>'}</td>
      <td>${esc(e.riesgo.factores.slice(0, 3).map(f => f.factor).join(' · ') || '—')}</td></tr>`)
    t.append(tb); p.append(el('div', { class: 'sic-tabla-wrap' }, t))
  }

  // Indicadores
  p.append(el('h2', { class: 'sic-h2', text: 'Evaluación por componente (0–100)' }))
  const ind = el('div', { class: 'sic-bloque', style: 'padding:10px 16px' })
  for (const i of a.indicadores) ind.insertAdjacentHTML('beforeend', `<div class="sic-ind"><span>${esc(i.nombre)}</span>
    <div class="b"><i style="width:${i.valor ?? 0}%;background:${COLOR_IND(i.valor)}"></i></div><span class="v">${i.valor ?? '—'}</span></div>`)
  p.append(ind)

  // Repositorios
  if (a.repositorios.length) {
    p.append(el('h2', { class: 'sic-h2', text: 'Documentos electrónicos: riesgo por repositorio' }))
    const t = el('table', { class: 'sic-tabla' })
    t.innerHTML = '<thead><tr><th>Repositorio</th><th>Tipo</th><th>Copia</th><th>Riesgo</th><th>Factores</th></tr></thead>'
    const tb = el('tbody')
    for (const x of a.repositorios) tb.insertAdjacentHTML('beforeend', `<tr><td><b>${esc(x.nombre)}</b></td><td>${esc(x.tipo || '—')}</td><td>${esc(x.copia || '—')}</td>
      <td><span class="nivel ${esc(x.riesgo.nivel)}">${esc(x.riesgo.nivel)}</span></td><td>${esc(x.riesgo.factores.join(' · '))}</td></tr>`)
    t.append(tb); p.append(el('div', { class: 'sic-tabla-wrap' }, t))
  }

  // Hallazgos
  p.append(el('h2', { class: 'sic-h2', text: `Hallazgos y acciones (${a.hallazgos.length})` }))
  if (!a.hallazgos.length) p.append(el('div', { class: 'sic-vacio', text: 'Sin hallazgos con la información diligenciada hasta ahora.' }))
  for (const h of a.hallazgos) p.insertAdjacentHTML('beforeend', `<div class="sic-hallazgo ${esc(h.prioridad)}">
    <span class="nivel ${esc(h.prioridad)}">${esc(h.prioridad)}</span> <b style="font-size:12.5px;color:#475569">${esc(h.id)} · ${esc(h.programa)}</b>
    <div class="t">${esc(h.hallazgo)}</div><div class="a">→ ${esc(h.accion)}</div>
    <div class="m">${esc(h.plazo)} · ${esc(h.costo_txt)} · Evidencia: ${esc(h.evidencia.join(', '))}${h.espacios.length ? ' · Espacios: ' + esc(h.espacios.join(', ')) : ''}</div></div>`)

  // Verificaciones
  if (a.verificaciones.length) {
    p.append(el('h2', { class: 'sic-h2', text: 'Pendiente de verificar ("No sabe")' }))
    const t = el('table', { class: 'sic-tabla' })
    t.innerHTML = '<thead><tr><th>Pregunta</th><th>Dónde</th><th>Qué verificar</th></tr></thead>'
    const tb = el('tbody')
    for (const v of a.verificaciones) tb.insertAdjacentHTML('beforeend', `<tr><td>${esc(v.pregunta)}</td><td>${esc(v.donde)}</td><td>${esc(v.texto)}</td></tr>`)
    t.append(tb); p.append(el('div', { class: 'sic-tabla-wrap' }, t))
  }
}

async function descargarInforme(btn) {
  const original = btn.textContent; btn.disabled = true; btn.textContent = 'Generando…'
  try {
    await vaciarCola()
    const r = await api('/api/sic/informe.docx'); if (!r.ok) throw new Error('No se pudo generar el informe')
    const url = URL.createObjectURL(await r.blob())
    const a = document.createElement('a'); a.href = url; a.download = 'Diagnostico-preliminar-SIC.docx'
    document.body.appendChild(a); a.click(); a.remove(); URL.revokeObjectURL(url)
    toast('Informe generado', 'success')
  } catch (e) { toast(e.message, 'error') }
  finally { btn.disabled = false; btn.textContent = original }
}

// ---------------- Navegación ----------------
const PANELES = { espacios: panelEspacios, institucional: panelInstitucional, inspeccion: panelInspeccion, sistemas: panelSistemas, resultados: panelResultados }
let tabActual = 'institucional'
async function irA(tab) {
  // Espacios, inspección y sistemas ya no se muestran: el diagnóstico es el cuestionario
  if (!['institucional', 'resultados'].includes(tab)) tab = 'institucional'
  if (tab === 'resultados' && !PUEDE_ANALIZAR) tab = 'institucional'
  await vaciarCola()
  tabActual = tab
  sessionStorage.setItem('sic_tab', tab)
  document.querySelectorAll('#tabs button').forEach(b => b.classList.toggle('active', b.dataset.tab === tab))
  document.querySelectorAll('.sic-panel').forEach(s => { s.hidden = s.id !== `panel-${tab}` })
  PANELES[tab]()
  window.scrollTo({ top: 0, behavior: 'smooth' })
}
async function recargar(tab = tabActual) {
  const j = await apiJson('/api/sic/estado')
  EST = j; pintarAvance()
  if (tab) { tabActual = tab; document.querySelectorAll('#tabs button').forEach(b => b.classList.toggle('active', b.dataset.tab === tab))
    document.querySelectorAll('.sic-panel').forEach(s => { s.hidden = s.id !== `panel-${tab}` }); PANELES[tab]() }
}

document.addEventListener('DOMContentLoaded', async () => {
  if (!USER) { window.location.href = '/'; return }
  renderHeader('SIC', sessionStorage.getItem('gestion_entidad_nombre') || null)
  if (PUEDE_ANALIZAR) $('#tabResultados').hidden = false
  document.querySelectorAll('#tabs button').forEach(b => b.addEventListener('click', () => irA(b.dataset.tab)))
  try {
    CAT = await apiJson('/api/sic/formulario')
    // Respuestas que quedaron en este equipo sin llegar al servidor (cierre, caída o sin internet)
    const recuperadas = restaurarRespaldo()
    if (recuperadas) { await vaciarCola(); if (!pendientes.size) toast(`Se recuperaron ${recuperadas} respuesta(s) que no se habían enviado`, 'success') }
    EST = await apiJson('/api/sic/estado')
    pintarAvance()
    await irA(sessionStorage.getItem('sic_tab') || 'institucional')
  } catch (e) {
    $('#panel-institucional').innerHTML = `<div class="sic-vacio">No se pudo cargar el diagnóstico: ${esc(e.message)}</div>`
  }
})
