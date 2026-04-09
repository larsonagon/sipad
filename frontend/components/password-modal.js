document.addEventListener('DOMContentLoaded', () => {

  let enviando = false

  function inicializar() {

    const modal = document.getElementById('modalPassword')
    const form = document.getElementById('formCambiarPassword')
    const btnCancelar = document.getElementById('btnCancelarPassword')

    const inputActual = document.getElementById('passwordActual')
    const inputNueva = document.getElementById('passwordNueva')
    const inputConfirmar = document.getElementById('passwordConfirmar')

    if (!modal || !form) {
      setTimeout(inicializar, 300)
      return
    }

    function abrirModal() {
      modal.classList.remove('hidden')
      // ✅ FIX: forzar overlay completo por JS igual que modal de análisis
      Object.assign(modal.style, {
        display        : 'flex',
        position       : 'fixed',
        top            : '0',
        left           : '0',
        width          : '100vw',
        height         : '100vh',
        background     : 'rgba(0,0,0,0.5)',
        alignItems     : 'center',
        justifyContent : 'center',
        zIndex         : '9999'
      })
    }

    function cerrarModal() {
      modal.classList.add('hidden')
      modal.style.display = 'none'
      form.reset()
    }

    // ✅ Exponer abrirModal globalmente para que el header pueda llamarlo
    window.abrirModalPassword = abrirModal

    btnCancelar?.addEventListener('click', cerrarModal)

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') cerrarModal()
    })

    if (form.dataset.listener === 'true') return
    form.dataset.listener = 'true'

    form.addEventListener('submit', async (e) => {

      console.log('🔥 SUBMIT DISPARADO')

      e.preventDefault()

      if (enviando) return
      enviando = true

      try {

        const token = sessionStorage.getItem('token')

        if (!token) {
          alert('Sesión no válida. Inicie sesión nuevamente.')
          return
        }

        const actual    = inputActual.value.trim()
        const nueva     = inputNueva.value.trim()
        const confirmar = inputConfirmar.value.trim()

        if (!actual || !nueva || !confirmar) {
          alert('Debe completar todos los campos')
          return
        }

        if (nueva.length < 8) {
          alert('La nueva contraseña debe tener mínimo 8 caracteres')
          return
        }

        if (nueva !== confirmar) {
          alert('Las contraseñas no coinciden')
          return
        }

        if (actual === nueva) {
          alert('La nueva contraseña no puede ser igual a la actual')
          return
        }

        console.log('📡 Enviando request...')

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
        try { json = await res.json() } catch {}

        if (!res.ok) {
          alert(json.error || 'Error cambiando contraseña')
          return
        }

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

  }

  inicializar()

})