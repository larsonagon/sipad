// public/js/views/forbidden.view.js
// SIPAD – Acceso denegado
// FASE 5.3 – Vista estándar 403

import { registerRoute, navigate } from '../router.js'

registerRoute('/403', () => {
  // 🔹 Mostrar menú (usuario sigue autenticado)
  const nav = document.querySelector('nav')
  if (nav) nav.style.display = ''

  const app = document.getElementById('app')

  app.innerHTML = `
    <h2>Acceso denegado</h2>
    <p>No tienes permisos para acceder a esta sección.</p>
    <button id="btnHome">Volver al inicio</button>
  `

  document.getElementById('btnHome').onclick = () => {
    navigate('/')
  }
})
