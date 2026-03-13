// public/js/views/trd-ai.view.js
// SIPAD – TRD-AI Dashboard Institucional
// Ajustado para login local SIN JWT real

import { registerRoute } from '../router.js'
import { renderMenu } from '../menu.js'
import state from '../state.js'

registerRoute('/trd-ai', async () => {

  const app = document.getElementById('app')
  if (!app) return

  // 🔧 Ajustado al estado actual del sistema
  const token = localStorage.getItem('token') || null
  const role = state.user?.rol

  const esComite = role === 'admin' || role === 'comite_trd'

  app.innerHTML = `
    <section class="trdai-container">

      <h2>TRD-AI</h2>
      <p class="subtitle">
        Motor inteligente institucional de sugerencia documental
      </p>

      ${
        esComite
          ? `
            <div class="trdai-metricas" id="metricas">
              <p>Cargando métricas...</p>
            </div>

            <div class="trdai-acciones">
              <button id="btn-analizar">Analizar Procesos</button>
              <button id="btn-generar">Generar Propuestas</button>
            </div>
          `
          : ''
      }

      <hr />

      <div id="propuestas">
        <p>Cargando propuestas...</p>
      </div>

    </section>
  `

  renderMenu()

  // ==============================
  // DASHBOARD MÉTRICAS
  // ==============================

  async function cargarDashboard() {

    if (!esComite) return

    const cont = document.getElementById('metricas')
    if (!cont) return

    try {

      const res = await fetch('/api/trd-ai/dashboard', {
        headers: token ? { Authorization: `Bearer ${token}` } : {}
      })

      if (!res.ok) throw new Error('Error dashboard')

      const data = await res.json()

      cont.innerHTML = `
        <div class="metric-grid">
          <div class="metric-card">
            <strong>Total Detectadas</strong>
            <span>${data.resumen?.total_detectadas ?? 0}</span>
          </div>

          <div class="metric-card">
            <strong>Propuestas</strong>
            <span>${data.resumen?.total_propuestas ?? 0}</span>
          </div>

          <div class="metric-card">
            <strong>Aprobadas</strong>
            <span>${data.resumen?.total_aprobadas ?? 0}</span>
          </div>

          <div class="metric-card">
            <strong>Incorporadas</strong>
            <span>${data.resumen?.total_incorporadas ?? 0}</span>
          </div>
        </div>
      `

    } catch (err) {
      cont.innerHTML = `<p>Error cargando métricas.</p>`
    }
  }

  // ==============================
  // LISTAR PROPUESTAS
  // ==============================

  async function cargarPropuestas() {

    const cont = document.getElementById('propuestas')
    if (!cont) return

    try {

      const res = await fetch('/api/trd-ai/series-propuestas', {
        headers: token ? { Authorization: `Bearer ${token}` } : {}
      })

      if (!res.ok) throw new Error('Error propuestas')

      const data = await res.json()

      if (!data || !data.length) {
        cont.innerHTML = `<p>No hay propuestas registradas.</p>`
        return
      }

      cont.innerHTML = `
        <div class="lista-propuestas">
          ${data.map(p => {

            const confianzaColor =
              p.confianza >= 0.7 ? 'green' :
              p.confianza >= 0.4 ? 'orange' :
              'red'

            return `
              <div class="card-propuesta">

                <div class="card-header">
                  <strong>${p.nombre_serie}</strong>
                  <span style="color:${confianzaColor}">
                    Confianza: ${p.confianza ?? 0}
                  </span>
                </div>

                <p><strong>Proceso:</strong> ${p.proceso_nombre ?? p.proceso_id}</p>
                <p><strong>Estado:</strong> ${p.estado}</p>

                ${
                  esComite
                    ? `
                      <div class="acciones">
                        ${
                          p.estado === 'propuesta'
                            ? `
                              <button data-id="${p.id}" class="btn-aprobar">
                                Aprobar
                              </button>

                              <button data-id="${p.id}" class="btn-rechazar">
                                Rechazar
                              </button>
                            `
                            : ''
                        }

                        ${
                          p.estado === 'aprobada'
                            ? `
                              <button data-id="${p.id}" class="btn-incorporar">
                                Incorporar
                              </button>
                            `
                            : ''
                        }
                      </div>
                    `
                    : ''
                }

              </div>
            `
          }).join('')}
        </div>
      `

      if (esComite) activarEventos()

    } catch (err) {
      cont.innerHTML = `<p>Error cargando propuestas.</p>`
    }
  }

  // ==============================
  // EVENTOS DE ACCIÓN
  // ==============================

  function activarEventos() {

    document.querySelectorAll('.btn-aprobar')
      .forEach(btn => {
        btn.onclick = async () => {
          await fetch(
            `/api/trd-ai/series-propuestas/${btn.dataset.id}/aprobar`,
            { method: 'PATCH', headers: token ? { Authorization: `Bearer ${token}` } : {} }
          )
          await cargarDashboard()
          await cargarPropuestas()
        }
      })

    document.querySelectorAll('.btn-rechazar')
      .forEach(btn => {
        btn.onclick = async () => {
          await fetch(
            `/api/trd-ai/series-propuestas/${btn.dataset.id}/rechazar`,
            { method: 'PATCH', headers: token ? { Authorization: `Bearer ${token}` } : {} }
          )
          await cargarPropuestas()
        }
      })

    document.querySelectorAll('.btn-incorporar')
      .forEach(btn => {
        btn.onclick = async () => {
          await fetch(
            `/api/trd-ai/series-propuestas/${btn.dataset.id}/incorporar`,
            { method: 'POST', headers: token ? { Authorization: `Bearer ${token}` } : {} }
          )
          await cargarDashboard()
          await cargarPropuestas()
        }
      })
  }

  // ==============================
  // BOTONES COMITÉ
  // ==============================

  if (esComite) {

    const btnAnalizar = document.getElementById('btn-analizar')
    const btnGenerar = document.getElementById('btn-generar')

    if (btnAnalizar) {
      btnAnalizar.onclick = async () => {
        await fetch('/api/trd-ai/analizar', {
          headers: token ? { Authorization: `Bearer ${token}` } : {}
        })
        alert('Análisis ejecutado')
      }
    }

    if (btnGenerar) {
      btnGenerar.onclick = async () => {
        await fetch('/api/trd-ai/generar-propuestas', {
          method: 'POST',
          headers: token ? { Authorization: `Bearer ${token}` } : {}
        })
        await cargarDashboard()
        await cargarPropuestas()
      }
    }
  }

  await cargarDashboard()
  await cargarPropuestas()

}, { protected: true })
