// SIPAD · Formulario público de verificación por dependencia.
// Se abre con /verificar/?t=<token>. No requiere sesión. Todo el texto que
// viene del servidor se pinta con textContent (nunca innerHTML).

const TOKEN = new URLSearchParams(location.search).get('t') || ''
const API = `/api/publico/verificacion/${encodeURIComponent(TOKEN)}`
const CLAVE_BORRADOR = `sipad_verif_${TOKEN.slice(0, 16)}`

const OPCIONES = [
  { r: 'si', txt: 'Sí' },
  { r: 'no', txt: 'No' },
  { r: 'antes', txt: 'Antes sí, ahora no' },
  { r: 'ns', txt: 'No sé' }
]
const SOPORTES = [{ v: 'papel', txt: 'Papel' }, { v: 'digital', txt: 'Digital' }, { v: 'ambos', txt: 'Ambos' }]
const VOLUMENES = [{ v: 'mucho', txt: 'Mucho' }, { v: 'poco', txt: 'Poco' }, { v: 'casi_nunca', txt: 'Casi nunca' }]

let F = null              // formulario recibido
let R = {}                // respuestas por ítem
let datos = { nombre: '', cargo: '', adicionales: '', observaciones: '' }

const $ = (s, el = document) => el.querySelector(s)
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
  try { localStorage.setItem(CLAVE_BORRADOR, JSON.stringify({ R, datos })) } catch { /* sin almacenamiento */ }
}
function leerBorrador() {
  try { const b = JSON.parse(localStorage.getItem(CLAVE_BORRADOR) || 'null'); if (b) { R = b.R || {}; datos = { ...datos, ...(b.datos || {}) } } } catch { /* nada */ }
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
  // Descarta del borrador ítems que ya no existen
  leerBorrador()
  const ids = new Set(F.items.map(i => i.id))
  for (const k of Object.keys(R)) if (!ids.has(k)) delete R[k]
  pintar()
}

function pantallaMensaje(icono, titulo, texto) {
  $('#barra').hidden = true
  const app = $('#app'); app.replaceChildren(el('div', { class: 'vf-final' }, el('div', { class: 'vf-icono', text: icono }), el('h1', { text: titulo }), el('p', { text: texto })))
}

// --------- Pintar ---------
function pintar() {
  document.title = `${F.dependencia || 'Verificación'} – SIPAD`
  $('#entidad').textContent = F.entidad || ''
  const app = $('#app'); app.replaceChildren()

  const intro = el('section', { class: 'vf-intro' },
    el('h1', { text: F.titulo || 'Verificación de documentos' }),
    F.dependencia ? el('p', { class: 'vf-dep', text: F.dependencia }) : null,
    F.mensaje ? el('p', { class: 'vf-mensaje', text: F.mensaje }) : null,
    el('p', { class: 'vf-como' },
      'Para cada documento o expediente, marque si su dependencia lo produce o tramita: ',
      el('b', { text: 'Sí' }), ', ', el('b', { text: 'No' }), ', ', el('b', { text: 'Antes sí, ahora no' }),
      ' (indique desde y hasta qué año, si lo sabe) o ', el('b', { text: 'No sé' }), '. Toma unos minutos.'),
    F.fecha_limite ? el('div', { class: 'vf-limite', text: `Responder antes del ${fechaLarga(F.fecha_limite)}` }) : null
  )
  app.append(intro)

  const nombre = el('input', { type: 'text', id: 'fNombre', autocomplete: 'name', maxlength: '120', required: true, value: datos.nombre })
  nombre.addEventListener('input', () => { datos.nombre = nombre.value; guardarBorrador() })
  const cargo = el('input', { type: 'text', id: 'fCargo', autocomplete: 'organization-title', maxlength: '120', value: datos.cargo })
  cargo.addEventListener('input', () => { datos.cargo = cargo.value; guardarBorrador() })
  app.append(el('section', { class: 'vf-datos' },
    el('label', { for: 'fNombre' }, 'Su nombre', nombre),
    el('label', { for: 'fCargo' }, el('span', {}, 'Cargo o rol ', el('span', { class: 'vf-opcional', text: '(opcional)' })), cargo)
  ))

  const errores = el('div', { id: 'errores', 'aria-live': 'polite' })
  app.append(errores)

  F.items.forEach((it, i) => app.append(tarjeta(it, i)))

  const trampa = el('input', { type: 'text', name: 'sitio', id: 'fSitio', tabindex: '-1', autocomplete: 'off' })
  const adicionales = el('textarea', { id: 'fAdicionales', maxlength: '2000', placeholder: 'Escriba uno por línea. Ejemplo: Registro de publicidad exterior visual' })
  adicionales.value = datos.adicionales
  adicionales.addEventListener('input', () => { datos.adicionales = adicionales.value; guardarBorrador() })
  const obs = el('textarea', { id: 'fObs', maxlength: '2000' })
  obs.value = datos.observaciones
  obs.addEventListener('input', () => { datos.observaciones = obs.value; guardarBorrador() })
  app.append(el('section', { class: 'vf-extra' },
    el('label', { for: 'fAdicionales' }, '¿Su dependencia produce algún otro documento o expediente que no esté en esta lista?', adicionales),
    el('label', { for: 'fObs' }, el('span', {}, 'Observaciones ', el('span', { class: 'vf-opcional', text: '(opcional)' })), obs),
    el('div', { class: 'vf-trampa', 'aria-hidden': 'true' }, el('label', { for: 'fSitio' }, 'No llenar', trampa))
  ))

  $('#barra').hidden = false
  actualizarProgreso()
}

function tarjeta(it, i) {
  const caja = el('article', { class: 'vf-item', id: `it-${it.id}` })
  const cab = el('div', { class: 'vf-item-cab' },
    el('span', { class: 'vf-num', text: String(i + 1) }),
    el('div', {}, el('div', { class: 'vf-texto', id: `tx-${it.id}`, text: it.texto }), it.ayuda ? el('div', { class: 'vf-ayuda', text: it.ayuda }) : null))
  const grupo = el('div', { class: 'vf-opciones', role: 'group', 'aria-labelledby': `tx-${it.id}` })
  for (const o of OPCIONES) {
    grupo.append(el('button', { type: 'button', 'data-r': o.r, 'aria-pressed': String(R[it.id]?.r === o.r), text: o.txt,
      onclick: () => { R[it.id] = { ...(R[it.id] || {}), r: o.r }; limpiarSegun(it.id); guardarBorrador(); refrescar(caja, it) } }))
  }
  const sub = el('div', { class: 'vf-sub-cont' })
  caja.append(cab, grupo, sub)
  refrescar(caja, it, true)
  return caja
}

// Quita datos que no aplican a la respuesta elegida
function limpiarSegun(id) {
  const a = R[id]; if (!a) return
  if (a.r !== 'antes') { delete a.desde; delete a.hasta }
  if (a.r === 'no') delete a.soporte
  if (a.r !== 'si') delete a.volumen
}

function refrescar(caja, it, inicial = false) {
  const a = R[it.id]
  caja.classList.toggle('listo', !!a?.r)
  if (a?.r) caja.classList.remove('falta')
  caja.querySelectorAll('.vf-opciones button').forEach(b => b.setAttribute('aria-pressed', String(a?.r === b.dataset.r)))
  const cont = caja.querySelector('.vf-sub-cont'); cont.replaceChildren()
  if (a?.r) {
    const sub = el('div', { class: 'vf-sub' })
    if (a.r === 'antes') {
      const max = new Date().getFullYear()
      const mk = (campo, etiqueta) => {
        const inp = el('input', { type: 'number', inputmode: 'numeric', min: '1900', max: String(max), placeholder: 'Año', value: a[campo] ?? '' })
        inp.addEventListener('input', () => { const n = parseInt(inp.value, 10); if (Number.isFinite(n)) a[campo] = n; else delete a[campo]; guardarBorrador() })
        return el('label', {}, etiqueta, inp)
      }
      sub.append(el('div', { class: 'vf-sub-titulo', text: '¿Desde y hasta qué año se produjo? (si lo sabe)' }), el('div', { class: 'vf-anios' }, mk('desde', 'Desde'), mk('hasta', 'Hasta')))
    }
    if (F.preguntar_soporte && a.r !== 'no' && a.r !== 'ns') sub.append(el('div', { class: 'vf-sub-titulo', text: '¿Dónde se guarda?' }), chips(SOPORTES, 'soporte', a, caja, it))
    if (F.preguntar_volumen && a.r === 'si') sub.append(el('div', { class: 'vf-sub-titulo', text: '¿Cuánto se produce?' }), chips(VOLUMENES, 'volumen', a, caja, it))
    if (sub.childNodes.length) cont.append(sub)
  }
  if (!inicial) actualizarProgreso()
}

function chips(opciones, campo, a, caja, it) {
  return el('div', { class: 'vf-chips', role: 'group' }, opciones.map(o => el('button', {
    type: 'button', 'aria-pressed': String(a[campo] === o.v), text: o.txt,
    onclick: () => { a[campo] = a[campo] === o.v ? undefined : o.v; if (!a[campo]) delete a[campo]; guardarBorrador(); refrescar(caja, it) }
  })))
}

function actualizarProgreso() {
  const n = F.items.length
  const listos = F.items.filter(i => R[i.id]?.r).length
  $('#progresoBarra').style.width = n ? `${Math.round(listos / n * 100)}%` : '0'
  $('#progresoTexto').textContent = `${listos} de ${n} respondidos`
}

function fechaLarga(iso) {
  const [a, m, d] = String(iso).split('-').map(Number)
  const meses = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre']
  return d && m ? `${d} de ${meses.at(m - 1)} de ${a}` : iso
}

function mostrarError(texto) {
  const e = $('#errores'); e.replaceChildren(el('p', { class: 'vf-error', text: texto }))
  e.scrollIntoView({ behavior: 'smooth', block: 'center' })
}

// --------- Envío ---------
async function enviar() {
  datos.nombre = $('#fNombre').value.trim()
  if (!datos.nombre) { mostrarError('Escriba su nombre antes de enviar.'); $('#fNombre').focus(); return }
  const faltan = F.items.filter(i => !R[i.id]?.r)
  document.querySelectorAll('.vf-item').forEach(c => c.classList.remove('falta'))
  if (faltan.length) {
    faltan.forEach(i => document.getElementById(`it-${i.id}`)?.classList.add('falta'))
    mostrarError(`Falta responder ${faltan.length} ${faltan.length === 1 ? 'ítem' : 'ítems'}. Si no está seguro, marque «No sé».`)
    document.getElementById(`it-${faltan[0].id}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' })
    return
  }
  const btn = $('#btnEnviar'); btn.disabled = true; btn.textContent = 'Enviando…'
  try {
    const r = await fetch(API, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ nombre: datos.nombre, cargo: $('#fCargo').value.trim(), respuestas: R,
        adicionales: $('#fAdicionales').value.trim(), observaciones: $('#fObs').value.trim(), sitio: $('#fSitio').value })
    })
    const j = await r.json().catch(() => ({}))
    if (!r.ok || !j.ok) { mostrarError(j.error || 'No se pudo enviar. Intente de nuevo.'); return }
    borrarBorrador()
    pantallaMensaje('✅', '¡Gracias! Sus respuestas quedaron registradas.', 'El área de gestión documental las usará para construir las Tablas de Retención Documental. Ya puede cerrar esta página.')
    window.scrollTo(0, 0)
  } catch {
    mostrarError('No hay conexión. Sus respuestas siguen guardadas en este dispositivo; intente enviar de nuevo.')
  } finally {
    btn.disabled = false; btn.textContent = 'Enviar respuestas'
  }
}

$('#btnEnviar').addEventListener('click', enviar)
cargar()
