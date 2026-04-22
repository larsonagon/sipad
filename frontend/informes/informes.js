import { renderHeader } from '../components/header.js'

function getToken() {
  return sessionStorage.getItem('token')
}

function getUserFromToken() {
  const token = getToken()
  if (!token) return null
  try {
    return JSON.parse(atob(token.split('.')[1]))
  } catch {
    return null
  }
}

document.addEventListener('DOMContentLoaded', () => {

  const token = getToken()
  if (!token) { window.location.href = '/'; return }

  const user = getUserFromToken()
  if (!user) { window.location.href = '/'; return }

  renderHeader('Informes')

  configurarCards()
})

function configurarCards() {

  document.getElementById('cardRegistro')
    ?.addEventListener('click', () => {
      window.location.href = '/informes/registro.html'
    })

  document.getElementById('cardDependencia')
    ?.addEventListener('click', () => {
      window.location.href = '/informes/resumen-dependencias.html'
    })

  document.getElementById('cardProduccion')
    ?.addEventListener('click', () => {
      window.location.href = '/informes/produccion.html'
    })

  document.querySelectorAll('.module-card').forEach(card => {
    card.addEventListener('keypress', e => {
      if (e.key === 'Enter') card.click()
    })
  })
}