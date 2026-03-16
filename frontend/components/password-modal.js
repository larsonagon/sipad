document.addEventListener('DOMContentLoaded', () => {

const modal = document.getElementById('modalPassword')
const btnCancelar = document.getElementById('btnCancelarPassword')
const form = document.getElementById('formCambiarPassword')

if(!modal) return

// cerrar con cancelar
btnCancelar?.addEventListener('click', () => {
modal.classList.add('hidden')
form?.reset()
})

// cerrar con ESC
document.addEventListener('keydown', e => {
if(e.key === 'Escape'){
modal.classList.add('hidden')
form?.reset()
}
})

})
