// =====================================================
// SIPAD · ICAF — Medidor de calidad del diligenciamiento
// -----------------------------------------------------
// Panel en vivo que puntúa qué tan bien está diligenciada la
// actividad y le dice al funcionario, en concreto, qué mejorar
// ANTES de guardar. No bloquea el guardado (eso lo maneja
// actividad.js); es una guía para que la clasificación de la
// serie salga más precisa.
//
// Autocontenido: no toca la lógica de actividad.js. Solo lee
// los 8 campos esenciales por su id y se pinta en #calidadICAF.
// =====================================================

(function () {
  'use strict'

  const $ = id => document.getElementById(id)

  // Palabras demasiado vagas para clasificar (si el contenido es SOLO esto)
  const VAGOS = new Set([
    'varios', 'varias', 'otros', 'otras', 'etc', 'etcetera', 'etcétera',
    'na', 'n/a', 'ninguno', 'ninguna', 'documento', 'documentos', 'archivo',
    'archivos', 'papeles', 'cosas', 'x', 'xx', 'xxx', 'ver', 'nada'
  ])

  const val = id => ($(id)?.value || '').trim()
  const palabras = t => (t || '').trim().split(/\s+/).filter(Boolean).length
  const lineas = t => (t || '').split(/\n|,|;/).map(s => s.trim()).filter(Boolean).length

  function esVago(t) {
    const s = (t || '').trim().toLowerCase()
    if (!s) return true
    const limpio = s.replace(/[.\s]/g, '')
    if (limpio.length < 4) return true
    // El contenido completo es una sola palabra vaga
    if (palabras(s) === 1 && VAGOS.has(limpio)) return true
    return false
  }

  const generico = new Set(['actividad', 'proceso', 'gestion', 'gestión', 'tramite', 'trámite', 'documento'])

  // ── Evaluación ──
  function evaluar() {
    const genera = val('generaDoc')            // 'si' | 'no' | ''
    const nombre = val('nombre')
    const desc = val('descripcion')
    const prod = val('documentosGenerados')
    const req = val('recepcionExterna')

    const checks = []

    // 1. Nombre específico
    checks.push((() => {
      if (!nombre) return c('miss', 'Nombre de la actividad', 'Escribe un nombre concreto (ej: "Expedición de certificados de residencia").')
      const soloGenerico = palabras(nombre) === 1 && generico.has(nombre.toLowerCase())
      if (nombre.length < 8 || palabras(nombre) < 2 || soloGenerico)
        return c('warn', 'Nombre de la actividad', 'Hazlo más específico: qué se hace y sobre qué (evita solo "gestión" o "proceso").')
      return c('ok', 'Nombre de la actividad')
    })())

    // 2. Tipo de proceso
    checks.push(val('clasificacion')
      ? c('ok', 'Tipo de proceso')
      : c('miss', 'Tipo de proceso', 'Selecciona si es misional, de apoyo, estratégica o de evaluación.'))

    // 3. Frecuencia
    checks.push(val('periodicidad')
      ? c('ok', 'Frecuencia')
      : c('miss', 'Frecuencia', 'Indica cada cuánto se realiza.'))

    // 4. Descripción clara
    checks.push((() => {
      if (!desc) return c('miss', 'Descripción (¿en qué consiste?)', 'Explica en 1–2 líneas qué se hace, para qué y cuál es el resultado.')
      if (desc.trim().toLowerCase() === nombre.trim().toLowerCase())
        return c('warn', 'Descripción (¿en qué consiste?)', 'No repitas el nombre: describe el trámite y su resultado.')
      if (desc.length < 40 || palabras(desc) < 6)
        return c('warn', 'Descripción (¿en qué consiste?)', 'Amplíala un poco: con más detalle la clasificación es más precisa.')
      return c('ok', 'Descripción (¿en qué consiste?)')
    })())

    // 5. ¿Genera documentos?
    checks.push(genera
      ? c('ok', '¿Genera documentos?')
      : c('miss', '¿Genera documentos?', 'Indica si la actividad produce documentos.'))

    // 6. Formato
    checks.push(val('formato')
      ? c('ok', 'Formato')
      : c('miss', 'Formato', 'Físico, digital o ambos.'))

    // 7. Documentos que produce (LO MÁS IMPORTANTE para la serie)
    checks.push((() => {
      if (genera === 'no') return c('ok', 'Documentos que produce', 'La actividad no genera documentos.')
      if (!prod) return c('miss', 'Documentos que produce ★', 'Lista los documentos, uno por línea. Es lo que más pesa para clasificar la serie.')
      if (esVago(prod)) return c('warn', 'Documentos que produce ★', 'Sé específico: nombra cada documento (ej: "Certificado de disponibilidad presupuestal"), no "varios".')
      if (lineas(prod) < 1 || palabras(prod) < 2)
        return c('warn', 'Documentos que produce ★', 'Nombra cada documento por su nombre real.')
      return c('ok', 'Documentos que produce ★')
    })())

    // 8. Documentos requeridos para iniciar
    checks.push((() => {
      if (!req) return c('miss', 'Documentos requeridos para iniciar', 'Registra los documentos que se necesitan para empezar (uno por línea).')
      if (esVago(req)) return c('warn', 'Documentos requeridos para iniciar', 'Sé específico: nombra cada documento requerido.')
      return c('ok', 'Documentos requeridos para iniciar')
    })())

    const puntos = checks.reduce((n, ch) => n + (ch.estado === 'ok' ? 1 : ch.estado === 'warn' ? 0.5 : 0), 0)
    const score = Math.round((puntos / checks.length) * 100)
    return { score, checks }
  }

  function c(estado, label, hint) { return { estado, label, hint: hint || '' } }

  // ── Render ──
  function nivel(score) {
    if (score >= 85) return { txt: 'Excelente', color: '#12864e', bg: '#e7f6ec', bar: '#12864e' }
    if (score >= 60) return { txt: 'Aceptable', color: '#b45309', bg: '#fffbeb', bar: '#d97706' }
    return { txt: 'Por mejorar', color: '#b42318', bg: '#fdeceb', bar: '#dc2626' }
  }

  const ICON = { ok: '✓', warn: '!', miss: '○' }
  const ICON_COLOR = { ok: '#12864e', warn: '#d97706', miss: '#94a3b8' }

  function render() {
    const cont = $('calidadICAF')
    if (!cont) return
    const { score, checks } = evaluar()
    const nv = nivel(score)

    const items = checks.map(ch => `
      <li style="display:flex;gap:9px;align-items:flex-start;padding:5px 0;">
        <span style="flex:0 0 18px;width:18px;height:18px;border-radius:50%;display:inline-flex;align-items:center;justify-content:center;
          font-size:12px;font-weight:800;color:#fff;background:${ICON_COLOR[ch.estado]};margin-top:1px;">${ICON[ch.estado]}</span>
        <span style="font-size:13px;color:#374151;">
          <span style="font-weight:${ch.estado === 'ok' ? '500' : '700'};color:${ch.estado === 'ok' ? '#475569' : '#0f172a'};">${ch.label}</span>
          ${ch.estado !== 'ok' && ch.hint ? `<span style="display:block;color:#64748b;font-size:12px;margin-top:1px;">${ch.hint}</span>` : ''}
        </span>
      </li>`).join('')

    cont.innerHTML = `
      <div style="border:1px solid #e6eaf0;border-radius:14px;background:#fff;box-shadow:0 1px 2px rgba(16,42,73,.06),0 4px 14px rgba(16,42,73,.05);padding:18px 20px;margin-top:1.1rem;">
        <div style="display:flex;align-items:center;gap:14px;margin-bottom:12px;flex-wrap:wrap;">
          <div style="font-size:15px;font-weight:700;color:#0d3f77;flex:1;min-width:180px;">Calidad del diligenciamiento</div>
          <div style="font-size:22px;font-weight:800;color:${nv.color};">${score}%</div>
          <span style="background:${nv.bg};color:${nv.color};border:1px solid ${nv.color}33;padding:3px 12px;border-radius:999px;font-size:12px;font-weight:700;">${nv.txt}</span>
        </div>
        <div style="height:8px;border-radius:999px;background:#eef2f7;overflow:hidden;margin-bottom:14px;">
          <div style="height:100%;width:${score}%;background:${nv.bar};transition:width .25s ease;border-radius:999px;"></div>
        </div>
        <ul style="list-style:none;margin:0;padding:0;">${items}</ul>
        <div style="font-size:12px;color:#64748b;margin-top:12px;border-top:1px solid #eef1f6;padding-top:10px;">
          Puedes guardar aunque no llegue al 100%. Mejorar los puntos marcados hace que el sistema clasifique la serie con más precisión.
          <span style="color:#0d3f77;">★ = lo que más pesa para clasificar.</span>
        </div>
      </div>`
  }

  // ── Enganche ──
  const CAMPOS = ['nombre', 'clasificacion', 'periodicidad', 'descripcion', 'generaDoc', 'formato', 'documentosGenerados', 'recepcionExterna']

  function enganchar() {
    if (!$('calidadICAF')) return
    CAMPOS.forEach(id => {
      const el = $(id)
      if (!el) return
      el.addEventListener('input', render)
      el.addEventListener('change', render)
    })
    render()
    // Reintento por si actividad.js llena los campos (modo edición) después
    setTimeout(render, 400)
    setTimeout(render, 1200)
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', enganchar)
  } else {
    enganchar()
  }
})()
