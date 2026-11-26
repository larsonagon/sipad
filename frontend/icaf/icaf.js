// SIPAD · ICAF por enlace público.
// Se abre con /icaf/?t=<token>. No requiere sesión: el funcionario escribe su
// nombre, elige su dependencia y cuenta sus tareas. Todo el texto que viene
// del servidor se pinta con textContent (nunca innerHTML).

const TOKEN = new URLSearchParams(location.search).get('t') || ''
const API = `/api/publico/icaf/${encodeURIComponent(TOKEN)}`
const CLAVE_BORRADOR = `sipad_icaf_${TOKEN.slice(0, 16)}`

const FRECUENCIAS = [
  { v: 'diaria', txt: 'Todos los días' },
  { v: 'semanal', txt: 'Cada semana' },
  { v: 'mensual', txt: 'Cada mes' },
  { v: 'trimestral', txt: 'Cada tres meses' },
  { v: 'semestral', txt: 'Cada seis meses' },
  { v: 'anual', txt: 'Una vez al año' },
  { v: 'eventual', txt: 'Solo cuando se necesita' }
]
const FORMATOS = [
  { v: 'fisico', txt: 'En papel' },
  { v: 'digital', txt: 'En el computador' },
  { v: 'ambos', txt: 'En ambos' }
]
const MAX_TAREAS = 30

const tareaVacia = () => ({ nombre: '', frecuencia: '', produce: '', documentos: '', formato: '', recibe: '', descripcion: '' })

let F = null
let datos = { nombre: '', cargo: '', dependencia_id: '', observaciones: '' }
let tareas = [tareaVacia()]

const $ = (s, e = document) => e.querySelector(s)
function el(tag, attrs = {}, ...hijos) {
  const e = document.createElement(tag)
  for (const [k, v] of Object.entries(attrs)) {
    if (k === 'class') e.className = v
    else if (k === 'text') e.textContent = v
    else if (k.startsWith('on')) e.addEventListener(k.slice(2), v)
    else if (v !== undefined && v !== null && v !== false) e.setAttribute(k, v === true ? '' : v)
  }
  for (const h of hijos.flat()) if (h !== null && h !== undefined && h !== false) e.append(h instanceof Node ? h : document.createTextNode(String(h)))
  return e
}

// --------- Borrador local (por si se cierra la pestaña) ---------
function guardarBorrador() {
  // Se llama con cada cambio: el aviso de error anterior ya no aplica
  document.getElementById('errores')?.replaceChildren()
  try { localStorage.setItem(CLAVE_BORRADOR, JSON.stringify({ datos, tareas })) } catch { /* sin almacenamiento */ }
}
function leerBorrador() {
  try {
    const b = JSON.parse(localStorage.getItem(CLAVE_BORRADOR) || 'null')
    if (!b) return
    datos = { ...datos, ...(b.datos || {}) }
    if (Array.isArray(b.tareas) && b.tareas.length) tareas = b.tareas.slice(0, MAX_TAREAS).map(t => ({ ...tareaVacia(), ...t }))
  } catch { /* nada */ }
}
function borrarBorrador() { try { localStorage.removeItem(CLAVE_BORRADOR) } catch { /* nada */ } }

// --------- Carga ---------
async function cargar() {
  if (!TOKEN) return pantallaMensaje('🔗', 'Enlace incompleto', 'Abra el enlace completo que le enviaron.')
  let r, j
  try { r = await fetch(API, { cache: 'no-store' }); j = await r.json() }
  catch { return pantallaMensaje('📶', 'Sin conexión', 'No se pudo cargar el formulario. Revise su conexión e intente de nuevo.') }
  if (!r.ok || !j.ok) return pantallaMensaje('ℹ️', 'Formulario no disponible', j?.error || 'El enlace no es válido.')
  F = j
  leerBorrador()
  if (!F.dependencias.some(d => d.id === String(datos.dependencia_id))) datos.dependencia_id = ''
  pintar()
}

function pantallaMensaje(icono, titulo, texto, boton = null) {
  $('#barra').hidden = true
  $('#app').replaceChildren(el('div', { class: 'if-caja if-final' },
    el('div', { class: 'if-icono', text: icono }), el('h1', { text: titulo }), el('p', { text: texto }), boton))
}

// --------- ¿La tarea está completa? ---------
function faltantes(t) {
  const f = []
  if (!t.nombre.trim()) f.push('nombre')
  if (!t.frecuencia) f.push('frecuencia')
  if (t.produce !== 'si' && t.produce !== 'no') f.push('produce')
  if (t.produce === 'si') {
    if (!t.documentos.trim()) f.push('documentos')
    if (!t.formato) f.push('formato')
  }
  return f
}
const tareaEnBlanco = (t) => !t.nombre.trim() && !t.frecuencia && !t.produce && !t.documentos.trim() && !t.recibe.trim() && !t.descripcion.trim()

// --------- Pintar ---------
function campoTexto(id, etiqueta, valor, alCambiar, { opcional = false, placeholder = '', autocomplete = 'off' } = {}) {
  const inp = el('input', { type: 'text', id, maxlength: '120', placeholder, autocomplete, value: valor })
  inp.addEventListener('input', () => { alCambiar(inp.value); inp.closest('.if-campo')?.classList.remove('falta'); guardarBorrador() })
  return el('div', { class: 'if-campo', 'data-campo': id },
    el('label', { for: id }, etiqueta, opcional ? el('span', { class: 'if-opcional', text: ' (opcional)' }) : null), inp)
}

function pintar() {
  document.title = `${F.titulo} – SIPAD`
  $('#entidad').textContent = F.entidad || ''
  const app = $('#app'); app.replaceChildren()

  app.append(el('section', { class: 'if-caja if-intro' },
    el('h1', { text: F.titulo }),
    F.mensaje ? el('p', { class: 'if-mensaje', text: F.mensaje }) : null,
    el('p', { text: 'Queremos saber qué tareas hace usted y qué documentos salen de ellas. Con eso se organiza el archivo de la entidad. No hay respuestas buenas ni malas.' }),
    el('ol', { class: 'if-pasos' },
      el('li', { text: 'Escriba su nombre y elija su dependencia.' }),
      el('li', { text: 'Cuente sus tareas, una por una, con sus propias palabras.' }),
      el('li', { text: 'Pulse «Enviar».' })),
    el('p', { class: 'if-guia' }, '¿Primera vez? ',
      el('a', { href: `/icaf/guia.html?t=${encodeURIComponent(TOKEN)}`, text: 'Vea la guía y el video de un minuto' }), '.')
  ))

  const sel = el('select', { id: 'fDependencia' }, el('option', { value: '', text: 'Seleccione…' }),
    F.dependencias.map(d => el('option', { value: d.id, text: d.nombre, selected: d.id === String(datos.dependencia_id) })))
  sel.addEventListener('change', () => { datos.dependencia_id = sel.value; sel.closest('.if-campo').classList.remove('falta'); guardarBorrador() })
  app.append(el('section', { class: 'if-caja' },
    el('h2', { text: 'Sus datos' }),
    campoTexto('fNombre', 'Su nombre completo', datos.nombre, v => { datos.nombre = v }, { autocomplete: 'name' }),
    campoTexto('fCargo', 'Su cargo', datos.cargo, v => { datos.cargo = v }, { opcional: true, autocomplete: 'organization-title', placeholder: 'Ej.: Auxiliar administrativo' }),
    el('div', { class: 'if-campo', 'data-campo': 'fDependencia' }, el('label', { for: 'fDependencia', text: 'Dependencia u oficina donde trabaja' }), sel)
  ))

  app.append(el('div', { id: 'errores', 'aria-live': 'polite' }))
  app.append(el('div', { id: 'tareas' }))
  app.append(el('button', { type: 'button', class: 'if-agregar', id: 'btnAgregar', text: '+ Agregar otra tarea', onclick: agregarTarea }))
  pintarTareas()

  const obs = el('textarea', { id: 'fObs', maxlength: '2000' })
  obs.value = datos.observaciones
  obs.addEventListener('input', () => { datos.observaciones = obs.value; guardarBorrador() })
  const trampa = el('input', { type: 'text', name: 'sitio', id: 'fSitio', tabindex: '-1', autocomplete: 'off' })
  app.append(el('section', { class: 'if-caja' },
    el('div', { class: 'if-campo' }, el('label', { for: 'fObs' }, '¿Quiere agregar algún comentario?', el('span', { class: 'if-opcional', text: ' (opcional)' })), obs),
    el('div', { class: 'if-trampa', 'aria-hidden': 'true' }, el('label', { for: 'fSitio' }, 'No llenar', trampa))
  ))

  $('#barra').hidden = false
  actualizarBarra()
}

function pintarTareas() {
  $('#tareas').replaceChildren(...tareas.map((t, i) => tarjeta(t, i)))
  const b = $('#btnAgregar'); if (b) b.hidden = tareas.length >= MAX_TAREAS
}

function agregarTarea() {
  if (tareas.length >= MAX_TAREAS) return
  tareas.push(tareaVacia()); guardarBorrador(); pintarTareas(); actualizarBarra()
  const nueva = document.getElementById(`tarea-${tareas.length - 1}`)
  nueva?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  nueva?.querySelector('input')?.focus({ preventScroll: true })
}

function chips(opciones, valor, alElegir) {
  return el('div', { class: 'if-chips', role: 'group' }, opciones.map(o => el('button', {
    type: 'button', 'aria-pressed': String(valor === o.v), text: o.txt, onclick: () => alElegir(o.v)
  })))
}

function tarjeta(t, i) {
  const caja = el('section', { class: 'if-caja if-tarea', id: `tarea-${i}` })
  const marcarLista = () => caja.classList.toggle('lista', faltantes(t).length === 0)
  const repintar = () => { guardarBorrador(); caja.replaceWith(tarjeta(t, i)); actualizarBarra() }
  const alEscribir = (campo, nodo) => () => { t[campo] = nodo.value; nodo.closest('.if-campo')?.classList.remove('falta'); guardarBorrador(); marcarLista(); actualizarBarra() }

  caja.append(el('div', { class: 'if-tarea-cab' },
    el('h2', {}, el('span', { class: 'if-num', text: String(i + 1) }), `Tarea ${i + 1}`),
    tareas.length > 1 ? el('button', { type: 'button', class: 'if-quitar', text: 'Quitar', onclick: () => { tareas.splice(i, 1); guardarBorrador(); pintarTareas(); actualizarBarra() } }) : null))

  const nombre = el('input', { type: 'text', id: `t${i}-nombre`, maxlength: '300', placeholder: 'Ej.: Expedir certificados de residencia', value: t.nombre })
  nombre.addEventListener('input', alEscribir('nombre', nombre))
  caja.append(el('div', { class: 'if-campo', 'data-campo': 'nombre' },
    el('label', { for: `t${i}-nombre`, text: '¿Qué tarea hace?' }),
    el('span', { class: 'if-ayuda', text: 'Escríbala como se la contaría a un compañero.' }), nombre))

  caja.append(el('div', { class: 'if-campo', 'data-campo': 'frecuencia' },
    el('span', { class: 'if-pregunta', text: '¿Cada cuánto la hace?' }),
    chips(FRECUENCIAS, t.frecuencia, v => { t.frecuencia = v; repintar() })))

  caja.append(el('div', { class: 'if-campo', 'data-campo': 'produce' },
    el('span', { class: 'if-pregunta', text: '¿De esa tarea sale algún documento?' }),
    el('span', { class: 'if-ayuda', text: 'Un oficio, un acta, un certificado, un informe, un formato, una planilla…' }),
    chips([{ v: 'si', txt: 'Sí' }, { v: 'no', txt: 'No' }], t.produce, v => { t.produce = v; repintar() })))

  if (t.produce === 'si') {
    const docs = el('textarea', { id: `t${i}-docs`, maxlength: '2000', placeholder: 'Certificado de residencia\nOficio de respuesta' })
    docs.value = t.documentos
    docs.addEventListener('input', alEscribir('documentos', docs))
    caja.append(el('div', { class: 'if-sub' },
      el('div', { class: 'if-campo', 'data-campo': 'documentos' },
        el('label', { for: `t${i}-docs`, text: '¿Cuáles documentos?' }),
        el('span', { class: 'if-ayuda', text: 'Escriba uno por renglón.' }), docs),
      el('div', { class: 'if-campo', 'data-campo': 'formato' },
        el('span', { class: 'if-pregunta', text: '¿Dónde quedan guardados?' }),
        chips(FORMATOS, t.formato, v => { t.formato = v; repintar() }))))
  }

  const recibe = el('textarea', { id: `t${i}-recibe`, maxlength: '2000', placeholder: 'Solicitud del ciudadano\nCopia de la cédula' })
  recibe.value = t.recibe
  recibe.addEventListener('input', alEscribir('recibe', recibe))
  caja.append(el('div', { class: 'if-campo' },
    el('label', { for: `t${i}-recibe` }, '¿Qué documentos le entregan o necesita para empezar?', el('span', { class: 'if-opcional', text: ' (opcional)' })),
    el('span', { class: 'if-ayuda', text: 'Lo que le trae el ciudadano o le envía otra oficina. Uno por renglón.' }), recibe))

  const desc = el('textarea', { id: `t${i}-desc`, maxlength: '2000', placeholder: 'Recibo la solicitud, reviso los datos y entrego el certificado firmado.' })
  desc.value = t.descripcion
  desc.addEventListener('input', alEscribir('descripcion', desc))
  caja.append(el('div', { class: 'if-campo' },
    el('label', { for: `t${i}-desc` }, 'Explique en pocas palabras cómo la hace', el('span', { class: 'if-opcional', text: ' (opcional)' })), desc))

  marcarLista()
  return caja
}

function actualizarBarra() {
  const listas = tareas.filter(t => faltantes(t).length === 0).length
  $('#progresoTexto').textContent = listas === 1 ? '1 tarea lista' : `${listas} tareas listas`
}

function mostrarError(texto) {
  $('#errores').replaceChildren(el('p', { class: 'if-error', text: texto }))
}

function marcar(nodo) {
  nodo?.classList.add('falta')
  nodo?.scrollIntoView({ behavior: 'smooth', block: 'center' })
}

// --------- Envío ---------
async function enviar() {
  document.querySelectorAll('.if-campo.falta').forEach(c => c.classList.remove('falta'))
  $('#errores').replaceChildren()

  if (!datos.nombre.trim()) { mostrarError('Escriba su nombre antes de enviar.'); marcar($('[data-campo="fNombre"]')); return }
  if (!datos.dependencia_id) { mostrarError('Elija la dependencia u oficina donde trabaja.'); marcar($('[data-campo="fDependencia"]')); return }

  // Las tarjetas que quedaron totalmente en blanco no se envían
  const indices = tareas.map((t, i) => i).filter(i => !tareaEnBlanco(tareas[i]))
  if (!indices.length) { mostrarError('Cuéntenos al menos una tarea.'); marcar($('#tarea-0 [data-campo="nombre"]')); return }

  for (const i of indices) {
    const f = faltantes(tareas[i])
    if (f.length) {
      mostrarError(`Falta completar la tarea ${i + 1}. Revise lo que está marcado en rojo.`)
      f.forEach(c => $(`#tarea-${i} [data-campo="${c}"]`)?.classList.add('falta'))
      $(`#tarea-${i} [data-campo="${f[0]}"]`)?.scrollIntoView({ behavior: 'smooth', block: 'center' })
      return
    }
  }

  const btn = $('#btnEnviar'); btn.disabled = true; btn.textContent = 'Enviando…'
  try {
    const r = await fetch(API, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        nombre: datos.nombre.trim(), cargo: datos.cargo.trim(), dependencia_id: datos.dependencia_id,
        actividades: indices.map(i => ({ ...tareas[i], produce: tareas[i].produce === 'si' })),
        observaciones: datos.observaciones.trim(), sitio: $('#fSitio').value
      })
    })
    const j = await r.json().catch(() => ({}))
    if (!r.ok || !j.ok) { mostrarError(j.error || 'No se pudo enviar. Intente de nuevo.'); $('#errores').scrollIntoView({ behavior: 'smooth', block: 'center' }); return }
    borrarBorrador()
    const n = indices.length
    pantallaMensaje('✅', '¡Gracias! Su información quedó registrada.',
      `Recibimos ${n === 1 ? '1 tarea' : `${n} tareas`}. El área de gestión documental la usará para construir las Tablas de Retención Documental. Ya puede cerrar esta página.`,
      el('button', { type: 'button', text: 'Enviar otras tareas', onclick: () => { datos.observaciones = ''; tareas = [tareaVacia()]; pintar(); window.scrollTo(0, 0) } }))
    window.scrollTo(0, 0)
  } catch {
    mostrarError('No hay conexión. Lo que escribió sigue guardado en este dispositivo; intente enviar de nuevo.')
    $('#errores').scrollIntoView({ behavior: 'smooth', block: 'center' })
  } finally {
    btn.disabled = false; btn.textContent = 'Enviar'
  }
}

$('#btnEnviar').addEventListener('click', enviar)
cargar()
