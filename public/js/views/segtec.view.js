// public/js/views/segtec.view.js
import { registerRoute } from '../router.js'
import state from '../state.js'
import { obtenerActividadesSEGTEC, crearActividadSEGTEC, guardarActividadSEGTEC } from '../db.js'
import { renderMenu } from '../menu.js'

import { renderBloque1 } from './bloque1.view.js' // ✅ Importamos Bloque 1

export async function renderSEGTEC(app) {
  app.innerHTML = `
    <section class="segtec-container">
      <div class="segtec-title">
        <h2>SEG-TEC</h2>
        <p class="segtec-subtitle">Seguimiento técnico archivístico</p>
      </div>

      <div id="contenido"></div>

      <div class="segtec-cta">
        <button id="btnNueva" class="btn-nueva">➕ Nueva actividad</button>
      </div>
    </section>
  `

  const cont = document.getElementById('contenido')
  const cta = document.querySelector('.segtec-cta')

  // =========================
  // LISTADO DE ACTIVIDADES
  // =========================
  async function renderListado() {
    // Mostramos el botón
    cta.style.display = 'flex'

    let actividades = []
    try {
      actividades = await obtenerActividadesSEGTEC()
    } catch {
      cont.innerHTML = `<p class="estado-vacio error">Error cargando actividades.</p>`
      return
    }

    actividades = (Array.isArray(actividades) ? actividades : [])
      .filter(a => a && a.fechaRegistro)
      .sort((a,b) => new Date(b.fechaRegistro) - new Date(a.fechaRegistro))

    if (!actividades.length) {
      cont.innerHTML = `<p class="estado-vacio">No hay actividades registradas.</p>`
      return
    }

    cont.innerHTML = `
      <div class="segtec-listado">
        <div class="tarjetas">
          ${actividades.map(a => {
            const fecha = new Date(a.fechaRegistro).toLocaleString()
            const estado = a.sync?.synced ? '✔' : '⏳'

            return `
              <div class="tarjeta-actividad">
                <div class="tarjeta-header">
                  <span class="icono">📁</span>
                  <strong class="dependencia">${a.dependencia?.nombre || 'Dependencia'}</strong>
                  <span class="estado">${estado}</span>
                </div>
                <div class="tarjeta-body">
                  <p class="hallazgo">${a.hallazgo?.descripcion || ''}</p>
                </div>
                <div class="tarjeta-footer">${fecha}</div>
              </div>
            `
          }).join('')}
        </div>
      </div>
    `
  }

  // =========================
  // BOTÓN NUEVA ACTIVIDAD
  // =========================
  document.getElementById('btnNueva').onclick = () => {
    // Ocultamos el listado/botón
    cta.style.display = 'none'

    // Renderizamos Bloque 1 dentro del contenedor
    renderBloque1(cont)
  }

  // =========================
  // RENDER INICIAL
  // =========================
  await renderListado()
  renderMenu()
}

// =========================
// REGISTRAMOS RUTA SPA
// =========================
registerRoute('/segtec', async () => {
  const app = document.getElementById('app')
  await renderSEGTEC(app)
})
