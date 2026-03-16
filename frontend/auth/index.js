document.addEventListener('DOMContentLoaded', () => {

  function tokenValido(token) {

    try {

      const payload = JSON.parse(atob(token.split('.')[1]))

      if (!payload) return false

      if (payload.exp) {

        const ahora = Date.now() / 1000

        if (payload.exp < ahora) return false

      }

      return true

    } catch {
      return false
    }

  }

  const existingToken = sessionStorage.getItem('token')

  if (existingToken && tokenValido(existingToken)) {

    if (!window.location.pathname.startsWith('/home')) {
      window.location.href = '/home'
    }

    return
  }

  const form = document.getElementById('loginForm')
  const mensaje = document.getElementById('mensaje')

  if (!form) return

  form.addEventListener('submit', async (e) => {

    e.preventDefault()

    const username = document.getElementById('usuario').value.trim()
    const password = document.getElementById('password').value.trim()

    mensaje.textContent = ''
    mensaje.style.color = 'red'

    if (!username || !password) {

      mensaje.textContent = 'Debe ingresar usuario y contraseña'
      return

    }

    try {

      const resp = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ username, password })
      })

      const json = await resp.json()

      if (resp.ok && json.token) {

        sessionStorage.setItem('token', json.token)
        sessionStorage.setItem('user', JSON.stringify(json.user))
        sessionStorage.setItem('lastActivity', Date.now())

        window.location.href = '/home'

      } else {

        mensaje.textContent = json.error || 'Credenciales inválidas'

      }

    } catch {

      mensaje.textContent = 'Error de conexión con el servidor'

    }

  })

})