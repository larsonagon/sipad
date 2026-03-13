import { registerRoute, navigate } from '../router.js'
import state from '../state.js'
import { renderMenu } from '../menu.js'

// Inyectar CSS de home
const link = document.createElement('link')
link.rel = 'stylesheet'
link.href = '/css/home.css'
document.head.appendChild(link)

registerRoute('/', () => {
  const app = document.getElementById('app')
  const user = state.user

  app.innerHTML = `
    <header>
      <h1>SIPAD</h1>
      <nav>
        <button onclick="navigate('/')">Inicio</button>
        <button class="active">SEG-TEC</button>
        <button onclick="logout()">Salir</button>
      </nav>
    </header>

    <section class="home-container">
      <h2>Bienvenido${user ? `, <strong>${user.nombre}</strong>` : ''}</h2>
      <p>Seleccione un módulo para continuar.</p>

      <div class="home-modulos">
        <div class="modulo-card" id="modSegtec">
          <div class="modulo-info">
            <strong>SEG-TEC</strong>
            <span>Seguimiento técnico archivístico</span>
          </div>
          <div class="modulo-icon">📁</div>
        </div>

        <div class="modulo-card" id="modTRDAI">
          <div class="modulo-info">
            <strong>TRD-AI</strong>
            <span>Motor inteligente de series</span>
          </div>
          <div class="modulo-icon">🤖</div>
        </div>
      </div>
    </section>
  `

  renderMenu()

  document.getElementById('modSegtec').onclick = () => navigate('/segtec')
  document.getElementById('modTRDAI').onclick = () => navigate('/trd-ai')
})
