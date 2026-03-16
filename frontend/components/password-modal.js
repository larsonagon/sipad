document.addEventListener('DOMContentLoaded', () => {

  const modal = document.getElementById('modalPassword')
  const form = document.getElementById('formCambiarPassword')
  const btnCancelar = document.getElementById('btnCancelarPassword')

  if (!modal) return

  btnCancelar?.addEventListener('click', () => {
    modal.classList.add('hidden')
    form?.reset()
  })

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      modal.classList.add('hidden')
      form?.reset()
    }
  })

})