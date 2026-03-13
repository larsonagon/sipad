// public/js/auth.js
// Autenticación REAL contra backend JWT

import state from './state.js'

const SESSION_KEY = 'sipad-session'
const TOKEN_KEY = 'token'

export async function login({ username, password }) {

  if (!username || !password) return false

  try {

    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password })
    })

    if (!res.ok) {
      console.error('Credenciales inválidas')
      return false
    }

    const data = await res.json()

    const { token, user } = data

    // Guardar token
    localStorage.setItem(TOKEN_KEY, token)

    // Guardar sesión
    localStorage.setItem(SESSION_KEY, JSON.stringify(user))

    // Actualizar estado
    state.user = user
    state.auth.authenticated = true

    return true

  } catch (err) {
    console.error('Error login:', err)
    return false
  }
}

export function restoreSession() {

  const token = localStorage.getItem(TOKEN_KEY)
  const rawUser = localStorage.getItem(SESSION_KEY)

  if (!token || !rawUser) return false

  try {
    state.user = JSON.parse(rawUser)
    state.auth.authenticated = true
    return true
  } catch {
    return false
  }
}

export function logout() {
  localStorage.removeItem(TOKEN_KEY)
  localStorage.removeItem(SESSION_KEY)
  state.user = null
  state.auth.authenticated = false
}
