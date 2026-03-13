// public/js/views/login.view.js
// LOGIN – JWT real contra backend

import { registerRoute, navigate } from '../router.js'
import { login } from '../auth.js'
import { renderMenu } from '../menu.js'

registerRoute('/login', () => {

  const app = document.getElementById('app')
  if (!app) return

  app.innerHTML = `
    <section class="login-container">

      <h2>Ingreso</h2>

      <label>
        Usuario
        <input 
          id="user" 
          autocomplete="username"
          required
        />
      </label>

      <label>
        Contraseña
        <input 
          id="pass" 
          type="password"
          autocomplete="current-password"
          required
        />
      </label>

      <button id="btnLogin">
        Ingresar
      </button>

      <p id="loginError" style="color:red; display:none;"></p>

    </section>
  `

  renderMenu()

  const userInput = document.getElementById('user')
  const passInput = document.getElementById('pass')
  const btn = document.getElementById('btnLogin')
  const errorBox = document.getElementById('loginError')

  async function ejecutarLogin() {

    const username = userInput.value.trim()
    const password = passInput.value.trim()

    if (!username || !password) {
      errorBox.textContent = 'Debe ingresar usuario y contraseña.'
      errorBox.style.display = 'block'
      return
    }

    errorBox.style.display = 'none'
    btn.disabled = true
    btn.textContent = 'Ingresando...'

    const ok = await login({ username, password })

    if (ok) {
      navigate('/')
    } else {
      errorBox.textContent = 'Credenciales inválidas.'
      errorBox.style.display = 'block'
      btn.disabled = false
      btn.textContent = 'Ingresar'
    }
  }

  // Click botón
  btn.onclick = ejecutarLogin

  // Enter en inputs
  passInput.addEventListener('keydown', e => {
    if (e.key === 'Enter') ejecutarLogin()
  })

})
