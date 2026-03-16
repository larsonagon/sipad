document.addEventListener('DOMContentLoaded', () => {

const token = localStorage.getItem('token')

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

  if (!token) {
    alert('Sesión no válida. Inicie sesión nuevamente.')
    return
  }

  const actual = inputActual.value.trim()
  const nueva = inputNueva.value.trim()
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

  const json = await res.json()

  if (!res.ok) {
    alert(json.error || 'Error cambiando contraseña')
    return
  }

  cerrarModal()

  setTimeout(() => {
    alert('Contraseña actualizada correctamente')
  }, 150)

} catch (error) {

  console.error(error)
  alert('Error de conexión con el servidor')

} finally {

  enviando = false

}


})

})
