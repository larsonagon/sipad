// frontend/valoracion/ui.js
// Modales y avisos con el estilo de SIPAD (reemplazan alert/confirm/prompt).

let _init = false
function ensureRoot() {
  if (_init) return
  _init = true
  const style = document.createElement('style')
  style.textContent = `
    .ui-overlay{position:fixed;inset:0;background:rgba(15,31,49,.45);backdrop-filter:blur(2px);
      display:flex;align-items:center;justify-content:center;z-index:10000;opacity:0;transition:opacity .15s;}
    .ui-overlay.show{opacity:1;}
    .ui-modal{background:#fff;border-radius:16px;box-shadow:0 25px 60px rgba(0,0,0,.28);
      width:min(440px,92vw);overflow:hidden;transform:translateY(8px) scale(.98);transition:transform .15s;}
    .ui-overlay.show .ui-modal{transform:none;}
    .ui-modal-head{background:linear-gradient(180deg,#1f4e79,#183f63);color:#fff;padding:14px 18px;font-weight:700;font-size:15px;}
    .ui-modal-body{padding:18px;color:#1f2937;font-size:14px;line-height:1.5;}
    .ui-modal-body input{width:100%;box-sizing:border-box;margin-top:10px;padding:9px 11px;border:1px solid #d1d5db;border-radius:8px;font-size:14px;}
    .ui-modal-body input:focus{outline:none;border-color:#1f4e79;box-shadow:0 0 0 3px rgba(31,78,121,.15);}
    .ui-modal-foot{display:flex;justify-content:flex-end;gap:8px;padding:0 18px 18px;}
    .ui-btn{border:none;border-radius:9px;padding:9px 16px;font-size:13px;font-weight:600;cursor:pointer;transition:.15s;}
    .ui-btn-primary{background:#0d3f77;color:#fff;}.ui-btn-primary:hover{background:#0b3463;}
    .ui-btn-ghost{background:#eef2f7;color:#374151;}.ui-btn-ghost:hover{background:#e2e8f0;}
    .ui-toasts{position:fixed;left:50%;bottom:56px;transform:translateX(-50%);z-index:10001;
      display:flex;flex-direction:column;gap:8px;align-items:center;pointer-events:none;}
    .ui-toast{pointer-events:auto;min-width:220px;max-width:80vw;background:#111827;color:#fff;border-radius:10px;
      padding:11px 16px;font-size:13px;box-shadow:0 10px 30px rgba(0,0,0,.25);display:flex;gap:10px;align-items:center;
      opacity:0;transform:translateY(10px);transition:all .18s;}
    .ui-toast.show{opacity:1;transform:none;}
    .ui-toast.exito{background:#065f46;}.ui-toast.error{background:#991b1b;}.ui-toast.info{background:#1f4e79;}
  `
  document.head.appendChild(style)
  const t = document.createElement('div'); t.className = 'ui-toasts'; t.id = 'ui-toasts'
  document.body.appendChild(t)
}

export function toast(mensaje, tipo = 'info', ms = 3000) {
  ensureRoot()
  const cont = document.getElementById('ui-toasts')
  const el = document.createElement('div')
  el.className = `ui-toast ${tipo}`
  el.textContent = mensaje
  cont.appendChild(el)
  requestAnimationFrame(() => el.classList.add('show'))
  setTimeout(() => { el.classList.remove('show'); setTimeout(() => el.remove(), 200) }, ms)
}

function modal({ titulo, cuerpoHTML, ok = 'Aceptar', cancel = 'Cancelar', onMount }) {
  ensureRoot()
  return new Promise(resolve => {
    const ov = document.createElement('div'); ov.className = 'ui-overlay'
    ov.innerHTML = `
      <div class="ui-modal" role="dialog" aria-modal="true">
        <div class="ui-modal-head">${titulo || 'SIPAD'}</div>
        <div class="ui-modal-body">${cuerpoHTML || ''}</div>
        <div class="ui-modal-foot">
          ${cancel ? `<button class="ui-btn ui-btn-ghost" data-a="cancel">${cancel}</button>` : ''}
          <button class="ui-btn ui-btn-primary" data-a="ok">${ok}</button>
        </div>
      </div>`
    document.body.appendChild(ov)
    requestAnimationFrame(() => ov.classList.add('show'))
    const cerrar = (val) => { ov.classList.remove('show'); setTimeout(() => ov.remove(), 160); resolve(val) }
    ov.querySelector('[data-a="ok"]').addEventListener('click', () => cerrar(onMount ? onMount.get() : true))
    ov.querySelector('[data-a="cancel"]')?.addEventListener('click', () => cerrar(onMount ? null : false))
    ov.addEventListener('click', e => { if (e.target === ov) cerrar(onMount ? null : false) })
    document.addEventListener('keydown', function esc(e){
      if(e.key==='Escape'){ document.removeEventListener('keydown',esc); cerrar(onMount ? null : false) }
      if(e.key==='Enter'){ document.removeEventListener('keydown',esc); cerrar(onMount ? onMount.get() : true) }
    })
    if (onMount) onMount.mount(ov)
  })
}

const esc = s => (s ?? '').toString().replace(/[&<>"]/g, c => ({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;' }[c]))

export function confirmar(mensaje, { titulo = 'Confirmar', ok = 'Aceptar', cancel = 'Cancelar' } = {}) {
  return modal({ titulo, cuerpoHTML: esc(mensaje), ok, cancel })
}

export function preguntar(label, valor = '', { titulo = 'SIPAD', ok = 'Aceptar' } = {}) {
  let input
  return modal({
    titulo, ok, cancel: 'Cancelar',
    cuerpoHTML: `<label>${esc(label)}</label><input id="ui-input" type="text" value="${esc(valor)}">`,
    onMount: {
      mount(ov){ input = ov.querySelector('#ui-input'); setTimeout(()=>{input.focus();input.select()},50) },
      get(){ return input ? input.value.trim() : '' }
    }
  })
}

export function avisar(mensaje, { titulo = 'SIPAD', ok = 'Entendido' } = {}) {
  return modal({ titulo, cuerpoHTML: esc(mensaje), ok, cancel: null })
}
