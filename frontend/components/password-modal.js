document.addEventListener('DOMContentLoaded', () => {

const modal = document.getElementById('modalPassword')
const form = document.getElementById('formCambiarPassword')
const btnCancelar = document.getElementById('btnCancelarPassword')

if (!modal || !form) return

// Cerrar con botón Cancelar
btnCancelar?.addEventListener('click', () => {
cerrarModal()
})

// Cerrar al enviar el formulario (botón Actualizar contraseña)
form.addEventListener('submit', () => {
cerrarModal()
})

// Cerrar con tecla ESC
document.addEventListener('keydown', (e) => {
if (e.key === 'Escape') {
cerrarModal()
}
})

function cerrarModal() {
modal.classList.add('hidden')
form.reset()
}

})
