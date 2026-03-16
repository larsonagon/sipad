document.addEventListener('DOMContentLoaded', () => {

const modal = document.getElementById('modalPassword')
const form = document.getElementById('formCambiarPassword')
const btnCancelar = document.getElementById('btnCancelarPassword')

if (!modal) return

// Cerrar con botón Cancelar
btnCancelar?.addEventListener('click', () => {
modal.classList.add('hidden')
form?.reset()
})

// Cerrar con tecla ESC
document.addEventListener('keydown', (e) => {
if (e.key === 'Escape') {
modal.classList.add('hidden')
form?.reset()
}
})

})
