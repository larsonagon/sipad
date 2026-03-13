// public/js/app.js
// SIPAD – Arranque limpio y estable

import state from './state.js'
import { restoreSession } from './auth.js'
import { initRouter } from './router.js'
import { renderMenu } from './menu.js'

// ===============================
// REGISTRO DE VISTAS
// (IMPORTANTE: se registran al importarse)
// ===============================
import './views/login.view.js'
import './views/home.view.js'
import './views/segtec.view.js'
import './views/trd-ai.view.js'
import './views/forbidden.view.js'

// ===============================
// ARRANQUE
// ===============================
document.addEventListener('DOMContentLoaded', () => {

  // 1️⃣ Restaurar sesión primero
  restoreSession()

  // 2️⃣ Inicializar router DESPUÉS
  initRouter()

  // 3️⃣ Render menú
  renderMenu()

})
