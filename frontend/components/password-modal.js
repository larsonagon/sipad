// =====================================================
// GLOBAL PASSWORD MODAL
// =====================================================

const token = localStorage.getItem('token')

function crearModalPassword() {

  if (document.getElementById('modalPassword')) return

  const modal = document.createElement('div')

  modal.id = 'modalPassword'
  modal.className = 'modal hidden'

  modal.innerHTML = `
    <div class="modal-content small">

      <h3>Cambiar contraseña</h3>

      <form id="formCambiarPassword">

        <div class="form-group">
          <label>Contraseña actual</label>
          <input type="password" id="passwordActual" required>
        </div>

        <div class="form-group">
          <label>Nueva contraseña</label>
          <input type="password" id="passwordNueva" required>
        </div>

        <div class="form-group">
          <label>Confirmar nueva contraseña</label>
          <input type="password" id="passwordConfirmar" required>
        </div>

        <div class="modal-actions">

          <button type="button"
            id="btnCancelarPassword"
            class="btn-secondary">
            Cancelar
          </button>

          <button type="submit"
            class="btn-primary">
            Actualizar contraseña
          </button>

        </div>

      </form>

    </div>
  `

  document.body.appendChild(modal)

}

crearModalPassword()

// =====================================================
// REFERENCIAS
// =====================================================

const modal = document.getElementById('modalPassword')
const form = document.getElementById('formCambiarPassword')
const btnCancelar = document.getElementById('btnCancelarPassword')

const inputActual = document.getElementById('passwordActual')
const inputNueva = document.getElementById('passwordNueva')
const inputConfirmar = document.getElementById('passwordConfirmar')

let enviando = false


// =====================================================
// ABRIR MODAL GLOBAL
// =====================================================

window.abrirModalPassword = function(){

  if(!modal) return

  modal.classList.remove('hidden')

}


// =====================================================
// CERRAR MODAL
// =====================================================

function cerrarModal(){

  modal?.classList.add('hidden')
  form?.reset()

}

btnCancelar?.addEventListener('click', cerrarModal)


// cerrar haciendo click fuera

modal?.addEventListener('click',(e)=>{

  if(e.target === modal){
    cerrarModal()
  }

})


// =====================================================
// SUBMIT CAMBIO PASSWORD
// =====================================================

form?.addEventListener('submit', async (e)=>{

  e.preventDefault()

  if(enviando) return
  enviando = true

  try{

    if(!token){
      alert('Sesión no válida')
      return
    }

    const actual = inputActual.value.trim()
    const nueva = inputNueva.value.trim()
    const confirmar = inputConfirmar.value.trim()

    if(!actual || !nueva || !confirmar){
      alert('Debe completar todos los campos')
      return
    }

    if(nueva.length < 8){
      alert('La nueva contraseña debe tener mínimo 8 caracteres')
      return
    }

    if(nueva !== confirmar){
      alert('Las contraseñas no coinciden')
      return
    }

    const res = await fetch('/api/usuarios/cambiar-password',{

      method:'PUT',

      headers:{
        'Content-Type':'application/json',
        Authorization:`Bearer ${token}`
      },

      body:JSON.stringify({
        password_actual:actual,
        password_nueva:nueva
      })

    })

    const json = await res.json()

    if(!res.ok){
      alert(json.error || 'Error cambiando contraseña')
      return
    }

    cerrarModal()

    setTimeout(()=>{
      alert('Contraseña actualizada correctamente')
    },150)

  }

  catch(error){

    console.error(error)
    alert('Error de conexión')

  }

  finally{

    enviando = false

  }

})