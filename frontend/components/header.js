// ======================================================
// HEADER INSTITUCIONAL SIPAD
// ======================================================

function getUserFromToken() {

  const token = localStorage.getItem('token')
  if (!token) return null

  try {

    const base64 = token.split('.')[1]

    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map(c =>
          '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2)
        )
        .join('')
    )

    return JSON.parse(jsonPayload)

  } catch (error) {

    console.error('Error decodificando token:', error)
    return null

  }

}

export function renderHeader(activeModule) {

  const user = getUserFromToken()

  if (!user) {
    window.location.href = '/'
    return
  }

  let modulo = 'home'
  let seccion = ''

  if (typeof activeModule === 'string') {
    modulo = activeModule
  }

  if (typeof activeModule === 'object' && activeModule !== null) {
    modulo = activeModule.modulo || 'home'
    seccion = activeModule.seccion || ''
  }

  const nivelAcceso = user?.nivel_acceso || 0

  const esAdmin =
    user?.es_master_admin === true ||
    nivelAcceso >= 90

  const puedeVerInformes =
    nivelAcceso >= 80

  // ======================================================
  // NUEVO CONTROL DE ROL GENERAL
  // ======================================================

  const esRolGeneral =
    (user?.rol || '').toLowerCase() === 'general'

  const header = document.createElement('header')
  header.className = 'pig-header'

  header.innerHTML = `
    <div class="pig-header-inner">

      <div class="pig-header-left">

        <div class="pig-title">
          SIPAD
          <span class="pig-module">
            ${
              modulo === 'home'
                ? 'Panel Principal'
                : modulo
            }
          </span>
        </div>

        ${
          seccion
            ? `<div class="pig-sub">${seccion}</div>`
            : ''
        }

      </div>

      <div class="pig-header-right">

        <nav class="pig-nav">

          <button type="button" id="btnInicio"
            ${modulo === 'home' ? 'class="active"' : ''}>
            Inicio
          </button>

          ${
            !esRolGeneral && esAdmin
              ? `
              <button type="button" id="btnAdmin"
                ${modulo === 'Administración' ? 'class="active"' : ''}>
                Administración
              </button>
              `
              : ''
          }

          <button type="button" id="btnSegtec"
            ${modulo === 'ICAF' ? 'class="active"' : ''}>
            ICAF
          </button>

          ${
            !esRolGeneral
              ? `
              <button type="button" id="btnTRDAI"
                ${modulo === 'TRD-AI' ? 'class="active"' : ''}>
                TRD-AI
              </button>
              `
              : ''
          }

          ${
            !esRolGeneral && puedeVerInformes
              ? `
              <button type="button" id="btnInformes"
                ${modulo === 'Informes' ? 'class="active"' : ''}>
                Informes
              </button>
              `
              : ''
          }

        </nav>

        <div class="pig-user">

          <div class="pig-user-info" id="btnUserMenu">

            <div class="pig-user-name">
              ${user.nombre_completo || user.username}
            </div>

            <div class="pig-user-meta">
              ${user.rol || ''}
              ${
                user.dependencia
                  ? ' – ' + user.dependencia
                  : ''
              }
            </div>

          </div>

          <div class="pig-user-dropdown" id="userDropdown">

            <button type="button" id="btnCambiarPassword">
              Cambiar contraseña
            </button>

            <button type="button" id="btnSalir" class="logout">
              Cerrar sesión
            </button>

          </div>

        </div>

      </div>

    </div>
  `

  document.body.prepend(header)

  // ======================================================
  // NAVEGACIÓN
  // ======================================================

  document.getElementById('btnInicio')
    ?.addEventListener('click', () => {
      window.location.href = '/home/index.html'
    })

  document.getElementById('btnAdmin')
    ?.addEventListener('click', () => {
      window.location.href = '/administracion/index.html'
    })

  document.getElementById('btnSegtec')
    ?.addEventListener('click', () => {
      window.location.href = '/segtec/segtec.html'
    })

  document.getElementById('btnTRDAI')
    ?.addEventListener('click', () => {
      window.location.href = '/trd-ai/trd-ai-dashboard.html'
    })

  document.getElementById('btnInformes')
    ?.addEventListener('click', () => {
      window.location.href = '/informes/index.html'
    })

  // ======================================================
  // CAMBIAR PASSWORD
  // ======================================================

  document.getElementById('btnCambiarPassword')
    ?.addEventListener('click', () => {

      const modal = document.getElementById('modalPassword')

      if (!modal) {
        console.warn('Modal de contraseña no encontrado')
        return
      }

      modal.classList.remove('hidden')

    })

  // ======================================================
  // LOGOUT
  // ======================================================

  document.getElementById('btnSalir')
    ?.addEventListener('click', () => {

      localStorage.removeItem('token')
      localStorage.removeItem('user')

      window.location.href = '/'

    })

  // ======================================================
  // MENÚ USUARIO
  // ======================================================

  const btnUserMenu = document.getElementById('btnUserMenu')
  const dropdown = document.getElementById('userDropdown')

  btnUserMenu?.addEventListener('click', (e) => {
    e.stopPropagation()
    dropdown?.classList.toggle('show')
  })

  document.addEventListener('click', (e) => {

    if (!e.target.closest('.pig-user')) {
      dropdown?.classList.remove('show')
    }

  })

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      dropdown?.classList.remove('show')
    }
  })

}