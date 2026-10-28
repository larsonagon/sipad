// SIPAD · Verificación por dependencia — Modo entrevista (el asesor marca)
import { renderHeader } from '../components/header.js'

// ---------------- Sesión / API ----------------

// Abre el acta o el ICAF en otra pestaña. La sesión vive en sessionStorage (propio de cada
// pestaña); con window.open la pestaña nueva conserva el vínculo con esta y puede tomarla.
function abrirImprimible(url) {
  const w = window.open(url, '_blank')
  if (!w) window.location.href = url // bloqueador de ventanas: se abre en la misma pestaña
}

function usuarioToken() {
  const t = sessionStorage.getItem('token'); if (!t) return null
  try { return JSON.parse(decodeURIComponent(escape(atob(t.split('.')[1].replace(/-/g, '+').replace(/_/g, '/'))))) } catch { return null }
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
  if (!resp.ok || j.ok === false) { const e = new Error(j.error || `Error ${resp.status}`); e.datos = j; throw e }
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
const fechaTxt = (iso) => iso ? new Date(iso.length === 10 ? iso + 'T12:00:00' : iso).toLocaleDateString('es-CO', { day: 'numeric', month: 'short', year: 'numeric' }) : '—'
const hoy = () => new Date().toLocaleDateString('en-CA')
function debounce(fn, ms = 700) { let t; return (...a) => { clearTimeout(t); t = setTimeout(() => fn(...a), ms) } }
const norm = (s) => String(s || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase()
const RESP = { si: 'Sí', no: 'No', ns: 'No sabe' }
const FORMATOS = { fisico: 'Físico', digital: 'Digital', ambos: 'Ambos' }
const FRECUENCIAS = { diaria: 'Diaria', semanal: 'Semanal', mensual: 'Mensual', bimensual: 'Bimensual', trimestral: 'Trimestral', semestral: 'Semestral', anual: 'Anual', eventual: 'Eventual (cuando se requiere)' }
const idAsistente = () => 'as_' + Array.from(crypto.getRandomValues(new Uint8Array(6)), b => b.toString(16).padStart(2, '0')).join('')
let USUARIOS = []

// ---------------- Ruteo ----------------
async function rutear() {
  const h = decodeURIComponent(location.hash.replace(/^#/, ''))
  try {
    if (h.startsWith('nueva:')) await vistaNueva(h.slice(6))
    else if (h === 'nueva') await vistaNueva('')
    else if (h) await vistaEntrevista(h)
    else await vistaInicio()
  } catch (e) { toast(e.message, 'error'); if (h) location.hash = '' }
  window.scrollTo(0, 0)
}
window.addEventListener('hashchange', rutear)

// ======================================================
// Inicio: guías importadas + entrevistas
// ======================================================
async function vistaInicio() {
  const [{ guias }, { entrevistas }] = await Promise.all([api('/api/verificacion/guias'), api('/api/verificacion/entrevistas')])
  const v = $('#vista'); v.replaceChildren()

  // Entrevistas
  v.append(el('div', { class: 'vr-barra' },
    el('h2', { text: `Entrevistas (${entrevistas.length})` }),
    el('button', { class: 'btn-secondary btn-md', type: 'button', text: '+ Entrevista sin guía', onclick: () => { location.hash = 'nueva' } })))
  if (!entrevistas.length) {
    v.append(el('div', { class: 'vr-card vr-vacio' },
      el('p', { text: 'Todavía no hay entrevistas.' }),
      el('p', { class: 'vr-muted', text: guias.length ? 'Elija una oficina en las guías de abajo y pulse Entrevistar.' : 'Primero importe el Excel de guías de entrevista.' })))
  } else {
    const grid = el('div', { class: 'vr-listas' })
    for (const e of entrevistas) {
      const r = e.resumen, hechas = r.subseries - r.pendientes
      const pct = r.subseries ? Math.round(hechas * 100 / r.subseries) : 0
      grid.append(el('div', { class: 'vr-card vr-lista', role: 'button', tabindex: '0',
        onclick: () => { location.hash = e.id }, onkeydown: (ev) => { if (ev.key === 'Enter') location.hash = e.id } },
        el('div', { class: 'en-fila' },
          el('span', { class: `vr-estado ${e.estado === 'cerrada' ? 'abierta' : 'borrador'}`, text: e.estado === 'cerrada' ? (e.aplicado_en ? 'En la TRD' : 'Acta lista') : 'En curso' }),
          el('span', { class: 'vr-muted', text: fechaTxt(e.fecha) })),
        el('h3', { text: e.oficina }),
        el('div', { class: 'vr-muted', text: e.dependencia_nombre || '' }),
        el('div', { class: 'en-progreso', title: `${hechas} de ${r.subseries}` }, el('i', { style: `width:${pct}%` })),
        el('div', { class: 'vr-cifras' },
          el('div', {}, el('b', { text: r.si }), 'Sí'),
          el('div', {}, el('b', { text: r.no }), 'No'),
          el('div', {}, el('b', { text: r.pendientes }), 'por preguntar')),
        // Borrar desde la lista las entrevistas que no se han cerrado (p. ej., abiertas por error)
        e.estado !== 'cerrada' ? el('button', { type: 'button', class: 'vr-volver en-quitar', text: hechas ? 'Eliminar entrevista' : 'Eliminar (sin respuestas)',
          onclick: async (ev) => {
            ev.stopPropagation()
            if (!confirm(`¿Eliminar la entrevista de ${e.oficina}${hechas ? ` con ${hechas} subserie(s) ya respondidas` : ''}? Las propuestas de la TRD ya creadas no se borran.`)) return
            try { await api(`/api/verificacion/entrevistas/${e.id}`, { method: 'DELETE' }); toast('Entrevista eliminada', 'success'); vistaInicio() }
            catch (err) { toast(err.message, 'error') }
          } }) : null))
    }
    v.append(grid)
  }

  // Guías
  const archivo = el('input', { type: 'file', accept: '.xlsx', hidden: true, onchange: () => importar(archivo) })
  v.append(el('div', { class: 'vr-barra en-sep' },
    el('h2', { text: 'Guías de entrevista' }),
    el('div', { class: 'en-fila' },
      archivo,
      el('button', { class: 'btn-primary btn-md', type: 'button', text: guias.length ? 'Actualizar guía (Excel)' : 'Importar guía (Excel)', onclick: () => archivo.click() }))))
  if (!guias.length) {
    v.append(el('div', { class: 'vr-card vr-vacio' },
      el('p', { text: 'No hay guías importadas.' }),
      el('p', { class: 'vr-muted', text: 'Use el Excel «Guías de entrevista»: una hoja por dependencia, con filas Subserie, Tipología y Por validar.' })))
    return
  }
  const porHoja = new Map()
  for (const g of guias) { if (!porHoja.has(g.hoja)) porHoja.set(g.hoja, []); porHoja.get(g.hoja).push(g) }
  for (const [hoja, lista] of porHoja) {
    const cuerpo = el('div', { class: 'en-guias' })
    for (const g of lista) {
      const hechas = entrevistas.filter(e => e.guia_id === g.id)
      cuerpo.append(el('div', { class: 'en-guia' },
        el('div', {},
          el('b', { text: g.oficina }),
          el('div', { class: 'vr-muted', text: `${g.subseries} subseries · ${g.tipologias} tipologías${g.por_validar ? ` · ${g.por_validar} por validar` : ''}` }),
          hechas.length ? el('div', { class: 'en-ok', text: `✓ ${hechas.length} entrevista${hechas.length > 1 ? 's' : ''}` }) : null),
        el('button', { class: hechas.length ? 'btn-secondary btn-sm' : 'btn-primary btn-sm', type: 'button', text: 'Entrevistar', onclick: () => { location.hash = `nueva:${g.id}` } })))
    }
    v.append(el('details', { class: 'vr-card en-hoja', open: true },
      el('summary', {}, el('h3', { text: hoja }), el('span', { class: 'vr-muted', text: `${lista.length} oficinas` })), cuerpo))
  }
  v.append(el('p', { class: 'vr-muted', text: `Última importación: ${fechaTxt(guias.map(g => g.importado_en).sort().at(-1))}. Reimportar reemplaza las guías; las entrevistas ya abiertas no cambian.` }))
}

async function importar(input) {
  const f = input.files?.[0]; if (!f) return
  if (f.size > 10 * 1024 * 1024) { toast('El archivo supera 10 MB', 'error'); return }
  const b64 = await new Promise((ok, mal) => { const r = new FileReader(); r.onload = () => ok(String(r.result)); r.onerror = mal; r.readAsDataURL(f) })
  try {
    const r = await api('/api/verificacion/guias/importar', { method: 'POST', body: { archivo: b64, nombre: f.name } })
    toast(`Guía importada: ${r.oficinas} oficinas, ${r.subseries} subseries, ${r.tipologias} tipologías`, 'success')
    rutear()
  } catch (e) { toast(e.message, 'error') } finally { input.value = '' }
}

// ======================================================
// Nueva entrevista
// ======================================================
async function vistaNueva(guiaId) {
  const [{ dependencias }, { guias }] = await Promise.all([api('/api/verificacion/dependencias'), api('/api/verificacion/guias')])
  const g = guias.find(x => x.id === guiaId) || null
  const v = $('#vista'); v.replaceChildren()
  const sel = el('select', { id: 'nDep', required: true }, el('option', { value: '', text: 'Seleccione…' }), dependencias.map(d => el('option', { value: d.id, text: d.nombre })))
  if (g) { // sugiere la dependencia por el nombre de la hoja (Gobierno → Secretaría de Gobierno)
    const h = norm(g.hoja)
    const m = dependencias.find(d => norm(d.nombre).includes(h)) || dependencias.find(d => h.includes(norm(d.nombre)))
    if (m) sel.value = m.id
  }
  const oficina = el('input', { type: 'text', id: 'nOf', maxlength: '120', value: g?.oficina || '', required: true })
  const fecha = el('input', { type: 'date', id: 'nFecha', value: hoy() })
  const lugar = el('input', { type: 'text', id: 'nLugar', maxlength: '200', placeholder: 'Ej.: oficina de la Comisaría, segundo piso' })
  const entrevistador = el('input', { type: 'text', id: 'nEnt', maxlength: '120', value: USER?.nombre || '' })
  const btn = el('button', { class: 'btn-primary btn-md', type: 'submit', text: 'Iniciar entrevista' })
  const form = el('form', { class: 'vr-card vr-form', onsubmit: async (e) => {
    e.preventDefault()
    if (!sel.value) { toast('Seleccione la dependencia', 'error'); sel.focus(); return }
    btn.disabled = true
    try {
      const r = await api('/api/verificacion/entrevistas', { method: 'POST', body: {
        guia_id: g?.id || null, dependencia_id: sel.value, oficina: oficina.value, fecha: fecha.value, lugar: lugar.value, entrevistador: entrevistador.value } })
      location.hash = r.id
    } catch (err) { toast(err.message, 'error') } finally { btn.disabled = false }
  } },
    g ? el('div', { class: 'full en-aviso' }, el('b', { text: `Guía: ${g.hoja} · ${g.oficina}` }), ` — ${g.subseries} subseries y ${g.tipologias} tipologías para preguntar.`)
      : el('div', { class: 'full en-aviso' }, 'Entrevista sin guía: agregará los documentos a medida que la oficina los mencione.'),
    el('label', { for: 'nDep' }, 'Dependencia en SIPAD (a la que irán las series)', sel),
    el('label', { for: 'nOf' }, 'Oficina productora', oficina),
    el('label', { for: 'nFecha' }, 'Fecha', fecha),
    el('label', { for: 'nLugar' }, 'Lugar', lugar),
    el('label', { class: 'full', for: 'nEnt' }, 'Entrevistador', entrevistador),
    el('div', { class: 'full module-actions' }, el('button', { class: 'btn-secondary btn-md', type: 'button', text: 'Cancelar', onclick: () => { location.hash = '' } }), btn))
  v.append(el('div', { class: 'vr-barra' }, el('button', { class: 'vr-volver', type: 'button', text: '← Entrevistas', onclick: () => { location.hash = '' } })), form)
}

// ======================================================
// Entrevista
// ======================================================
let D = null
let filtro = 'todas'

async function cargar(id) { D = await api(`/api/verificacion/entrevistas/${encodeURIComponent(id)}`) }

async function vistaEntrevista(id) {
  await cargar(id)
  if (!USUARIOS.length) USUARIOS = (await api('/api/verificacion/usuarios').catch(() => ({ usuarios: [] }))).usuarios || []
  pintar()
}

function cerrada() { return D.entrevista.estado === 'cerrada' }

function pintar() {
  const v = $('#vista'); v.replaceChildren()
  const e = D.entrevista
  v.append(el('div', { class: 'vr-barra' }, el('button', { class: 'vr-volver', type: 'button', text: '← Entrevistas', onclick: () => { location.hash = '' } })))

  // Cabecera fija con progreso y filtros
  const cab = el('div', { class: 'en-cab' })
  v.append(cab)
  pintarCabecera(cab)

  if (cerrada()) {
    v.append(el('div', { class: 'vr-card en-cerrada' },
      el('b', { text: e.aplicado_en ? `Resultados llevados a la TRD el ${fechaTxt(e.aplicado_en)}.` : 'Entrevista cerrada. El acta está lista para firma.' }),
      el('div', { class: 'vr-acciones' },
        el('button', { class: 'btn-primary btn-md', type: 'button', text: 'Acta', onclick: () => abrirImprimible(`/entrevista/acta.html?id=${encodeURIComponent(e.id)}`) }),
        el('button', { class: 'btn-primary btn-md', type: 'button', text: 'ICAF para firma', onclick: () => abrirImprimible(`/entrevista/icaf.html?id=${encodeURIComponent(e.id)}`) }),
        el('button', { class: 'btn-secondary btn-md', type: 'button', text: e.aplicado_en ? 'Actualizar TRD e ICAF' : 'Llevar a la TRD y al ICAF', onclick: aplicar }),
        el('button', { class: 'btn-secondary btn-md', type: 'button', text: 'Reabrir para corregir', onclick: () => estado('en_curso') }))))
  }

  v.append(participantes())
  const lista = el('div', { class: 'en-lista' })
  v.append(lista)
  const filas = D.items.filter(s => filtro === 'todas' || (filtro === 'pendientes' ? !s.respuesta : s.respuesta === filtro))
  if (!filas.length) lista.append(el('div', { class: 'vr-card vr-vacio', text: filtro === 'pendientes' ? 'No queda nada por preguntar.' : 'Nada en este filtro.' }))
  let comunEmpezo = false
  for (const s of filas) {
    if (s.comun && !comunEmpezo) { comunEmpezo = true; lista.append(el('h3', { class: 'en-titulo-grupo', text: 'Subseries comunes (se preguntan en todas las oficinas)' })) }
    lista.append(tarjeta(s))
  }

  if (!cerrada()) {
    const t = el('input', { type: 'text', maxlength: '300', placeholder: 'Documento o expediente que mencionó la oficina' })
    const se = el('input', { type: 'text', maxlength: '300', placeholder: 'Serie (si la sabe)' })
    v.append(el('form', { class: 'vr-card en-agregar', onsubmit: async (ev) => {
      ev.preventDefault()
      if (!t.value.trim()) { t.focus(); return }
      try {
        await api(`/api/verificacion/entrevistas/${e.id}/items`, { method: 'POST', body: { texto: t.value, serie: se.value || null } })
        t.value = ''; se.value = ''
        await recargar(); toast('Agregado', 'success')
      } catch (err) { toast(err.message, 'error') }
    } }, el('b', { text: '¿Mencionaron algo que no está en la lista?' }), el('div', { class: 'en-fila2' }, t, se, el('button', { class: 'btn-secondary btn-md', type: 'submit', text: 'Agregar' }))))
  }
  v.append(datosActa())
}

function pintarCabecera(cab) {
  const e = D.entrevista, r = D.resumen
  const hechas = r.subseries - r.pendientes
  const pct = r.subseries ? Math.round(hechas * 100 / r.subseries) : 0
  const chip = (k, txt, n) => el('button', { type: 'button', class: `en-filtro ${filtro === k ? 'on' : ''}`, onclick: () => { filtro = k; pintar() } }, txt, n !== undefined ? el('span', { text: n }) : null)
  cab.replaceChildren(
    el('div', { class: 'en-cab-top' },
      el('div', {}, el('h2', { text: e.oficina }), el('div', { class: 'vr-muted', text: `${e.dependencia_nombre || ''} · ${fechaTxt(e.fecha)}` })),
      el('div', { class: 'en-cuenta' }, el('b', { text: `${hechas}/${r.subseries}` }), 'preguntadas')),
    el('div', { class: 'en-progreso' }, el('i', { style: `width:${pct}%` })),
    el('div', { class: 'en-filtros' },
      chip('todas', 'Todas', r.subseries), chip('pendientes', 'Por preguntar', r.pendientes),
      chip('si', 'Sí', r.si), chip('no', 'No', r.no), chip('ns', 'No sabe', r.ns)))
}

async function recargar() {
  const y = window.scrollY
  await cargar(D.entrevista.id); pintar(); window.scrollTo(0, y)
}

async function guardarItem(id, body) {
  try { await api(`/api/verificacion/entrevista-items/${encodeURIComponent(id)}`, { method: 'PUT', body }); return true }
  catch (e) { toast(e.message, 'error'); return false }
}

function botonesResp(actual, onSel, compacto = false) {
  const g = el('div', { class: `en-resp ${compacto ? 'compacto' : ''}`, role: 'group' })
  for (const k of (compacto ? ['si', 'no'] : ['si', 'no', 'ns'])) {
    g.append(el('button', { type: 'button', class: `${k} ${actual === k ? 'on' : ''}`, 'aria-pressed': actual === k ? 'true' : 'false', disabled: cerrada(),
      text: RESP[k], onclick: () => onSel(actual === k ? null : k) }))
  }
  return g
}

function tarjeta(s) {
  const card = el('div', { class: `vr-card en-sub ${s.respuesta || 'pend'} ${s.nivel === 'por_validar' ? 'pv' : ''}`, id: `s-${s.id}` })
  const recalcular = () => { // sin recargar toda la vista: actualiza cifras de la cabecera
    D.resumen = resumirLocal(); pintarCabecera($('.en-cab'))
  }
  const etiquetas = el('div', { class: 'en-tags' },
    s.serie && !/^por definir$/i.test(s.serie) ? el('span', { class: 'en-tag', text: s.serie }) : null,
    s.nivel === 'por_validar' ? el('span', { class: 'en-tag pv', text: 'Por validar' }) : null,
    s.comun ? el('span', { class: 'en-tag', text: 'Común' }) : null,
    s.origen === 'agregado' ? el('span', { class: 'en-tag nuevo', text: 'Agregado en la entrevista' }) : null)
  card.append(
    el('div', { class: 'en-sub-top' },
      el('div', { class: 'en-sub-txt' }, etiquetas, el('h3', { text: s.texto }),
        s.funcion ? el('details', { class: 'en-fn' }, el('summary', { text: '¿Por qué se pregunta?' }), el('div', { text: s.funcion }), s.fuente ? el('div', { class: 'vr-muted', text: `Tipologías sugeridas: ${s.fuente}` }) : null) : null,
        s.nota_guia ? el('div', { class: 'en-nota-guia', text: s.nota_guia }) : null),
      botonesResp(s.respuesta, async (r) => {
        if (await guardarItem(s.id, { respuesta: r })) { s.respuesta = r; recalcular(); card.replaceWith(tarjeta(s)) }
      })))

  if (s.respuesta === 'si') {
    // Serie editable cuando no viene de la guía o está por validar
    if (s.nivel === 'por_validar' || s.origen === 'agregado') {
      const serie = el('input', { type: 'text', maxlength: '300', value: /^por definir$/i.test(s.serie || '') ? '' : (s.serie || ''), placeholder: 'Serie documental (necesaria para llevarla a la TRD)', disabled: cerrada() })
      const sub = el('input', { type: 'text', maxlength: '300', value: s.subserie || '', placeholder: 'Subserie (opcional)', disabled: cerrada() })
      const guardar = debounce(() => guardarItem(s.id, { serie: serie.value || null, subserie: sub.value || null }).then(ok => { if (ok) { s.serie = serie.value; s.subserie = sub.value } }))
      serie.addEventListener('input', guardar); sub.addEventListener('input', guardar)
      card.append(el('div', { class: 'en-fila2 en-serie' }, serie, sub))
    }
    card.append(bloqueIcaf(s, () => { card.replaceWith(tarjeta(s)) }))
  }

  // Tipologías: se muestran desde el inicio (ayudan a preguntar). Si se marca un documento
  // antes de responder la subserie, la subserie queda en Sí. Se ocultan si la subserie es No.
  if (s.respuesta !== 'no' && (s.tipologias.length || s.respuesta === 'si')) {
    const esSi = s.respuesta === 'si'
    const tips = el('div', { class: 'en-tips' })
    if (!s.tipologias.length) tips.append(el('div', { class: 'en-tips-cab' },
      el('span', { text: 'La guía no trae documentos para esta subserie: pregunte cuáles produce la oficina y agréguelos uno por uno.' })))
    if (s.tipologias.length) {
      const sinMarcar = s.tipologias.filter(t => !t.respuesta).length
      tips.append(el('div', { class: 'en-tips-cab' },
        el('span', { text: esSi ? `Documentos que lleva el expediente${sinMarcar ? ` · faltan ${sinMarcar}` : ''}`
          : `Documentos que suele llevar (${s.tipologias.length}): pregunte por cada uno` }),
        esSi && !cerrada() && sinMarcar ? el('button', { type: 'button', class: 'vr-volver', text: 'Marcar los demás como Sí', onclick: async () => {
          for (const t of s.tipologias.filter(x => !x.respuesta)) { if (await guardarItem(t.id, { respuesta: 'si' })) t.respuesta = 'si' }
          recalcular(); card.replaceWith(tarjeta(s))
        } }) : null))
      for (const t of s.tipologias) {
        const fila = el('div', { class: `en-tip ${t.respuesta || ''}` },
          el('span', { class: 'en-tip-txt' }, t.texto, t.origen === 'agregado' ? el('em', { text: ' (agregado)' }) : null),
          botonesResp(t.respuesta, async (r) => {
            // Marcar un documento como Sí confirma que la oficina produce la subserie
            if (r === 'si' && s.respuesta !== 'si') {
              if (!(await guardarItem(s.id, { respuesta: 'si' }))) return
              s.respuesta = 'si'
            }
            if (await guardarItem(t.id, { respuesta: r })) { t.respuesta = r; recalcular(); card.replaceWith(tarjeta(s)) }
          }, true),
          t.origen === 'agregado' && !cerrada() ? el('button', { type: 'button', class: 'vr-icono', title: 'Quitar', 'aria-label': 'Quitar', text: '✕', onclick: async () => {
            try { await api(`/api/verificacion/entrevista-items/${t.id}`, { method: 'DELETE' }); s.tipologias = s.tipologias.filter(x => x.id !== t.id); card.replaceWith(tarjeta(s)) } catch (e) { toast(e.message, 'error') }
          } }) : null)
        tips.append(fila)
      }
    }
    if (esSi && !cerrada()) {
      const nuevo = el('input', { type: 'text', maxlength: '300', placeholder: 'Otro documento de este expediente' })
      tips.append(el('form', { class: 'en-tip-add', onsubmit: async (ev) => {
        ev.preventDefault(); if (!nuevo.value.trim()) return
        try {
          const r = await api(`/api/verificacion/entrevistas/${D.entrevista.id}/items`, { method: 'POST', body: { padre_id: s.id, texto: nuevo.value } })
          s.tipologias.push({ id: r.id, texto: nuevo.value.trim(), respuesta: 'si', origen: 'agregado' })
          card.replaceWith(tarjeta(s)); $(`#s-${s.id} .en-tip-add input`)?.focus()
        } catch (e) { toast(e.message, 'error') }
      } }, nuevo, el('button', { class: 'btn-secondary btn-sm', type: 'submit', text: 'Agregar' })))
    }
    card.append(tips)
  }

  // Nota
  const nota = el('textarea', { maxlength: '1000', placeholder: 'Nota (desde qué año, dónde se guarda, quién la tiene…)', disabled: cerrada() })
  nota.value = s.nota || ''
  nota.addEventListener('input', debounce(() => guardarItem(s.id, { nota: nota.value }).then(ok => { if (ok) s.nota = nota.value })))
  card.append(el('details', { class: 'en-nota', open: !!s.nota }, el('summary', { text: s.nota ? 'Nota' : 'Agregar nota' }), nota))
  if (s.origen === 'agregado' && !cerrada()) {
    card.append(el('button', { type: 'button', class: 'vr-volver en-quitar', text: 'Quitar este documento', onclick: async () => {
      try { await api(`/api/verificacion/entrevista-items/${s.id}`, { method: 'DELETE' }); await recargar() } catch (e) { toast(e.message, 'error') }
    } }))
  }
  return card
}

// Quién la produce, formato y frecuencia (lo que pide el ICAF)
function bloqueIcaf(s, repintar) {
  const dis = cerrada()
  const asist = D.entrevista.asistentes
  const efectivo = s.responsable || s.responsable_sugerido || ''
  const quien = el('select', { disabled: dis, 'aria-label': 'Quién la produce' },
    el('option', { value: '', text: asist.length ? '¿Quién la produce?' : 'Registre los participantes' }),
    asist.map(a => el('option', { value: a.id, text: `${a.nombre}${a.cargo ? ` · ${a.cargo}` : ''}${!s.responsable && a.id === s.responsable_sugerido ? ' (sugerido)' : ''}` })))
  quien.value = efectivo
  quien.addEventListener('change', async () => { if (await guardarItem(s.id, { responsable: quien.value || null })) { s.responsable = quien.value || null; repintar() } })
  const formato = el('div', { class: 'en-resp compacto', role: 'group', 'aria-label': 'Formato' },
    Object.entries(FORMATOS).map(([k, t]) => el('button', { type: 'button', class: s.formato === k ? 'on sel' : '', disabled: dis, 'aria-pressed': s.formato === k ? 'true' : 'false', text: t,
      onclick: async () => { const v = s.formato === k ? null : k; if (await guardarItem(s.id, { formato: v })) { s.formato = v; repintar() } } })))
  const frec = el('select', { disabled: dis, 'aria-label': 'Frecuencia' }, el('option', { value: '', text: 'Frecuencia…' }), Object.entries(FRECUENCIAS).map(([k, t]) => el('option', { value: k, text: t })))
  frec.value = s.frecuencia || ''
  frec.addEventListener('change', async () => { if (await guardarItem(s.id, { frecuencia: frec.value || null })) s.frecuencia = frec.value || null })
  return el('div', { class: 'en-icaf' }, el('span', { class: 'en-icaf-tit', text: 'ICAF' }), quien, formato, frec)
}

function resumirLocal() {
  const c = (r) => D.items.filter(s => (s.respuesta || null) === r).length
  return { ...D.resumen, subseries: D.items.length, si: c('si'), no: c('no'), ns: c('ns'), pendientes: c(null) }
}

// ---------------- Participantes (firman el acta y su ICAF) ----------------
function participantes() {
  const e = D.entrevista
  const dis = cerrada()
  const asist = (e.asistentes.length ? e.asistentes : [{ nombre: '', cargo: '', jefe: true }]).map(a => ({ ...a, id: a.id || idAsistente() }))
  const filas = el('div', { class: 'en-asist' })
  const guardar = async () => {
    try { await api(`/api/verificacion/entrevistas/${e.id}`, { method: 'PUT', body: { asistentes: asist } }); e.asistentes = asist.filter(a => a.nombre?.trim()) }
    catch (err) { toast(err.message, 'error') }
  }
  const guardarDiferido = debounce(guardar)
  const confirmar = async () => { await guardar(); await recargar() } // recalcula quién produce cada subserie
  const pintarAsist = () => {
    filas.replaceChildren()
    asist.forEach((a, i) => {
      const n = el('input', { type: 'text', maxlength: '120', placeholder: 'Nombre', value: a.nombre || '', disabled: dis })
      const c = el('input', { type: 'text', maxlength: '120', placeholder: 'Cargo (como en el manual)', value: a.cargo || '', disabled: dis })
      const j = el('input', { type: 'checkbox', checked: !!a.jefe, disabled: dis })
      const u = el('select', { disabled: dis, title: 'Usuario de SIPAD: sus actividades quedan en el ICAF de su cuenta' },
        el('option', { value: '', text: 'Sin usuario en SIPAD' }), USUARIOS.map(x => el('option', { value: x.id, text: x.cargo ? `${x.nombre} · ${x.cargo}` : x.nombre })))
      u.value = a.usuario_id ? String(a.usuario_id) : ''
      n.addEventListener('input', () => { a.nombre = n.value; guardarDiferido() })
      c.addEventListener('input', () => { a.cargo = c.value; guardarDiferido() })
      n.addEventListener('change', confirmar); c.addEventListener('change', confirmar)
      j.addEventListener('change', () => { a.jefe = j.checked; confirmar() })
      u.addEventListener('change', () => {
        a.usuario_id = u.value ? Number(u.value) : null
        const x = USUARIOS.find(z => String(z.id) === u.value)
        if (x && !a.nombre) a.nombre = x.nombre
        if (x?.cargo && !a.cargo) a.cargo = x.cargo
        confirmar()
      })
      filas.append(el('div', { class: 'en-asist-fila' }, n, c, u, el('label', { class: 'vr-check' }, j, 'Jefe'),
        !dis && asist.length > 1 ? el('button', { type: 'button', class: 'vr-icono', 'aria-label': 'Quitar participante', text: '✕', onclick: () => { asist.splice(i, 1); pintarAsist(); confirmar() } }) : null))
    })
  }
  pintarAsist()
  const box = el('details', { class: 'vr-card en-part', open: !e.asistentes.length || !dis },
    el('summary', {}, el('h3', { text: `Participantes (${e.asistentes.length})` }),
      el('span', { class: 'vr-muted', text: 'Firman el acta y cada uno su ICAF' })),
    el('p', { class: 'vr-muted', text: 'Registre primero a quienes responden: cada subserie se asigna al funcionario que la produce. Marque al jefe (Acuerdo AGN 001 de 2024, num. 5.1.1.5 y 5.1.1.6). Si tiene usuario en SIPAD, vincúlelo para que sus actividades queden en su ICAF.' }),
    filas)
  if (!dis) box.append(el('button', { type: 'button', class: 'vr-volver', text: '+ Otro participante', onclick: () => { asist.push({ id: idAsistente(), nombre: '', cargo: '', jefe: false }); pintarAsist() } }))
  return box
}

// ---------------- Datos del acta ----------------
function datosActa() {
  const e = D.entrevista
  const dis = cerrada()
  const box = el('div', { class: 'vr-card en-acta' }, el('h3', { text: 'Datos del acta de levantamiento' }))
  const campo = (label, input, full) => el('label', { class: full ? 'full' : '' }, label, input)
  const fecha = el('input', { type: 'date', value: e.fecha || '', disabled: dis })
  const lugar = el('input', { type: 'text', maxlength: '200', value: e.lugar || '', disabled: dis })
  const entr = el('input', { type: 'text', maxlength: '120', value: e.entrevistador || '', disabled: dis })
  const obs = el('textarea', { maxlength: '4000', disabled: dis, placeholder: 'Acuerdos, documentos pendientes por enviar, archivo acumulado que mencionaron…' })
  obs.value = e.observaciones || ''
  const g2 = debounce(() => api(`/api/verificacion/entrevistas/${e.id}`, { method: 'PUT', body: { fecha: fecha.value, lugar: lugar.value, entrevistador: entr.value, observaciones: obs.value } })
    .then(() => Object.assign(e, { fecha: fecha.value, lugar: lugar.value, entrevistador: entr.value, observaciones: obs.value })).catch(err => toast(err.message, 'error')))
  for (const x of [fecha, lugar, entr, obs]) x.addEventListener('input', g2)
  box.append(el('div', { class: 'vr-form en-acta-campos' }, campo('Fecha', fecha), campo('Lugar', lugar), campo('Entrevistador', entr, true), campo('Observaciones', obs, true)))

  if (!dis) {
    box.append(el('div', { class: 'vr-acciones' },
      el('button', { class: 'btn-primary btn-md', type: 'button', text: 'Cerrar entrevista y generar acta e ICAF', onclick: () => estado('cerrada') }),
      el('button', { class: 'btn-danger btn-md', type: 'button', text: 'Eliminar entrevista', onclick: eliminar })))
  }
  return box
}

async function estado(nuevo) {
  if (nuevo === 'cerrada') {
    const sinMarcar = D.items.filter(s => s.respuesta === 'si').reduce((n, s) => n + s.tipologias.filter(t => !t.respuesta).length, 0)
    if (sinMarcar && !confirm(`Hay ${sinMarcar} tipología(s) sin marcar en subseries con Sí. No quedarán en el acta ni en la TRD. ¿Cerrar de todas formas?`)) {
      filtro = 'si'; pintar(); window.scrollTo(0, 0); return
    }
    const si = D.items.filter(s => s.respuesta === 'si')
    const sinQuien = si.filter(s => !(s.responsable || s.responsable_sugerido)).length
    const incompletas = si.filter(s => !s.formato || !s.frecuencia).length
    const avisos = []
    if (sinQuien) avisos.push(`${sinQuien} subserie(s) sin funcionario asignado (no saldrán en ningún ICAF)`)
    if (incompletas) avisos.push(`${incompletas} sin formato o frecuencia (quedarán en blanco en el ICAF)`)
    if (avisos.length && !confirm(`${avisos.join(' y ')}. ¿Cerrar de todas formas?`)) { filtro = 'si'; pintar(); window.scrollTo(0, 0); return }
  }
  try {
    const body = { estado: nuevo }
    await api(`/api/verificacion/entrevistas/${D.entrevista.id}`, { method: 'PUT', body })
    toast(nuevo === 'cerrada' ? 'Entrevista cerrada. El acta está lista.' : 'Entrevista reabierta', 'success')
    filtro = 'todas'
    await recargar()
    if (nuevo === 'cerrada') window.scrollTo(0, 0)
  } catch (e) {
    toast(e.message, 'error')
    if (e.datos?.pendientes) { filtro = 'pendientes'; pintar(); window.scrollTo(0, 0) }
  }
}

async function aplicar() {
  if (!confirm('Las subseries confirmadas crearán o completarán propuestas de series en el Diseño de la TRD, y las actividades quedarán en el ICAF de cada funcionario vinculado a un usuario de SIPAD. ¿Continuar?')) return
  try {
    const r = await api(`/api/verificacion/entrevistas/${D.entrevista.id}/aplicar`, { method: 'POST' })
    const partes = [`${r.creadas} propuesta(s) nuevas`, `${r.completadas} completadas`]
    if (r.anotadas_no) partes.push(`${r.anotadas_no} con constancia de "no la produce"`)
    toast(`Listo: ${partes.join(', ')}.`, 'success')
    if (r.omitidas.length) toast(`${r.omitidas.length} sin serie definida: reabra la entrevista y escriba la serie.`, 'error')
    const ic = r.icaf || {}
    if (ic.registradas || ic.actualizadas) toast(`ICAF: ${ic.registradas} actividad(es) nuevas y ${ic.actualizadas} actualizadas en las cuentas de los funcionarios.`, 'success')
    if (ic.sin_usuario?.length) toast(`Sin usuario en SIPAD: ${ic.sin_usuario.join(', ')}. Su ICAF sale solo impreso.`, 'info')
    await recargar()
  } catch (e) { toast(e.message, 'error') }
}

async function eliminar() {
  if (!confirm('Se borrarán la entrevista y sus respuestas. Las propuestas de la TRD ya creadas no se borran. ¿Eliminar?')) return
  try { await api(`/api/verificacion/entrevistas/${D.entrevista.id}`, { method: 'DELETE' }); location.hash = '' } catch (e) { toast(e.message, 'error') }
}

renderHeader('Verificación')
rutear()
