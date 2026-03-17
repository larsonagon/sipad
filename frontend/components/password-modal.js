document.addEventListener('DOMContentLoaded', () => {

  const modal = document.getElementById('modalPassword')
  const form = document.getElementById('formCambiarPassword')
  const btnCancelar = document.getElementById('btnCancelarPassword')

  const inputActual = document.getElementById('passwordActual')
  const inputNueva = document.getElementById('passwordNueva')
  const inputConfirmar = document.getElementById('passwordConfirmar')

  let enviando = false

  if (!modal || !form) return

  function cerrarModal() {
    modal.classList.add('hidden')
    form.reset()
  }

  btnCancelar?.addEventListener('click', cerrarModal)

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') cerrarModal()
  })

  form.addEventListener('submit', async (e) => {

    e.preventDefault()

    if (enviando) return
    enviando = true

    try {

      const token = sessionStorage.getItem('token')

      if (!token) {
        alert('Sesión no válida. Inicie sesión nuevamente.')
        enviando = false
        return
      }

      const actual = inputActual.value.trim()
      const nueva = inputNueva.value.trim()
      const confirmar = inputConfirmar.value.trim()

      // =========================
      // VALIDACIONES
      // =========================

      if (!actual || !nueva || !confirmar) {
        alert('Debe completar todos los campos')
        enviando = false
        return
      }

      if (nueva.length < 8) {
        alert('La nueva contraseña debe tener mínimo 8 caracteres')
        enviando = false
        return
      }

      if (nueva !== confirmar) {
        alert('Las contraseñas no coinciden')
        enviando = false
        return
      }

      if (actual === nueva) {
        alert('La nueva contraseña no puede ser igual a la actual')
        enviando = false
        return
      }

      // =========================
      // REQUEST
      // =========================

      const res = await fetch('/api/usuarios/cambiar-password', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          password_actual: actual,
          password_nueva: nueva
        })
      })

      let json = {}

      try {
        json = await res.json()
      } catch {
        json = {}
      }

      if (!res.ok) {
        alert(json.error || 'Error cambiando contraseña')
        enviando = false
        return
      }

      // =========================
      // ÉXITO
      // =========================

      cerrarModal()

      setTimeout(() => {

        alert('Contraseña actualizada correctamente. Debe iniciar sesión nuevamente.')

        sessionStorage.clear()
        localStorage.clear()
        window.location.href = '/'

      }, 150)

    } catch (error) {

      console.error(error)
      alert('Error de conexión con el servidor')

    } finally {

      enviando = false

    }

  })

})