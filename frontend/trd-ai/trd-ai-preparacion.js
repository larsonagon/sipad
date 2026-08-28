// =====================================================
// SIPAD · Panel "Preparación para el comité" (dashboard)
// -----------------------------------------------------
// Autocontenido: consulta GET /api/trd-ai/preparacion y pinta
// un semáforo + checklist con accesos directos. No toca
// trd-ai-dashboard.js.
// =====================================================

(function () {
  'use strict'
  const $ = id => document.getElementById(id)

  function esMasterAdmin() {
    const token = sessionStorage.getItem('token')
    if (!token) return false
    try { const p = JSON.parse(atob(token.split('.')[1])); return p.es_master_admin === true || p.es_master_admin === 1 } catch { return false }
  }

  async function apiFetch(url) {
    const token = sessionStorage.getItem('token')
    const headers = { Authorization: `Bearer ${token}` }
    if (esMasterAdmin()) {
      const eid = sessionStorage.getItem('gestion_entidad_id') || sessionStorage.getItem('entidad_id') || null
      if (eid) headers['X-Entidad-Id'] = eid
    }
    return fetch(url, { headers })
  }

  const ICON = { ok: '✓', warn: '!', pend: '○' }
  const COLOR = { ok: '#12864e', warn: '#d97706', pend: '#94a3b8' }

  function semaforo(data) {
    if (data.listo) return { txt: 'Lista para el comité', color: '#12864e', bg: '#e7f6ec', bar: '#12864e' }
    if (data.progreso >= 60) return { txt: 'Casi lista', color: '#b45309', bg: '#fffbeb', bar: '#d97706' }
    return { txt: 'En preparación', color: '#b42318', bg: '#fdeceb', bar: '#dc2626' }
  }

  async function render() {
    const cont = $('preparacionComite')
    if (!cont) return
    let data
    try {
      const resp = await apiFetch('/api/trd-ai/preparacion')
      if (!resp.ok) throw new Error()
      data = await resp.json()
    } catch { return } // silencioso: si falla, el dashboard sigue normal

    const nv = semaforo(data)

    const items = (data.pasos || []).map(p => `
      <li style="display:flex;gap:10px;align-items:flex-start;padding:7px 0;border-bottom:1px solid #f1f4f8;">
        <span style="flex:0 0 20px;width:20px;height:20px;border-radius:50%;display:inline-flex;align-items:center;justify-content:center;
          font-size:12px;font-weight:800;color:#fff;background:${COLOR[p.estado]};margin-top:1px;">${ICON[p.estado]}</span>
        <span style="font-size:13.5px;">
          <span style="font-weight:${p.estado === 'ok' ? '500' : '700'};color:${p.estado === 'ok' ? '#475569' : '#0f172a'};">${p.titulo}</span>
          <span style="display:block;color:#64748b;font-size:12px;margin-top:1px;">${p.detalle}</span>
        </span>
      </li>`).join('')

    cont.innerHTML = `
      <div style="border:1px solid #e6eaf0;border-radius:14px;background:#fff;box-shadow:0 1px 2px rgba(16,42,73,.06),0 4px 14px rgba(16,42,73,.05);padding:20px 22px;margin:22px 0;">
        <div style="display:flex;align-items:center;gap:14px;margin-bottom:12px;flex-wrap:wrap;">
          <div style="font-size:16px;font-weight:700;color:#0d3f77;flex:1;min-width:200px;">Preparación para el comité</div>
          <div style="font-size:22px;font-weight:800;color:${nv.color};">${data.progreso}%</div>
          <span style="background:${nv.bg};color:${nv.color};border:1px solid ${nv.color}33;padding:4px 14px;border-radius:999px;font-size:13px;font-weight:700;">${nv.txt}</span>
        </div>
        <div style="height:8px;border-radius:999px;background:#eef2f7;overflow:hidden;margin-bottom:16px;">
          <div style="height:100%;width:${data.progreso}%;background:${nv.bar};transition:width .25s ease;border-radius:999px;"></div>
        </div>
        <ul style="list-style:none;margin:0;padding:0;">${items}</ul>
        <div style="display:flex;gap:10px;flex-wrap:wrap;margin-top:16px;">
          <a href="/trd-ai/trd-ai-propuestas.html" class="btn-secondary btn-sm" style="text-decoration:none;">Ir a curar propuestas</a>
          <a href="/trd-ai/trd-ai-convalidacion.html" class="btn-secondary btn-sm" style="text-decoration:none;">Convalidación y expediente</a>
        </div>
      </div>`
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', render)
  else render()
})()
