// public/js/menu.js
// Menú inteligente
// NO aparece en login
// Solo aparece si hay sesión activa

import state from './state.js'
import { navigate } from './router.js'
import { logout } from './auth.js'

export function renderMenu() {
  const nav = document.querySelector('nav')
  if (!nav) return

  // 🔴 NUNCA mostrar menú en login
  if (window.location.pathname === '/login') {
    nav.innerHTML = ''
    return
  }

  // 🔴 Si no hay usuario, no mostrar nada
  if (!state.user) {
    nav.innerHTML = ''
    return
  }

  nav.innerHTML = ''

  const btnHome = document.createElement('button')
  btnHome.textContent = 'Inicio'
  btnHome.onclick = () => navigate('/')

  const btnSegtec = document.createElement('button')
  btnSegtec.textContent = 'SEG-TEC'
  btnSegtec.onclick = () => navigate('/segtec')

  const btnLogout = document.createElement('button')
  btnLogout.textContent = 'Salir'
  btnLogout.onclick = () => {
    logout()
    navigate('/login')
  }

  nav.append(btnHome, btnSegtec, btnLogout)
}
