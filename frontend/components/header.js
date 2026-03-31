// ======================================================
// HEADER INSTITUCIONAL SIPAD
// ======================================================

const TIEMPO_INACTIVIDAD = 60 * 60 * 1000 // 60 minutos
let temporizadorSesion = null

function cerrarSesion() {
  sessionStorage.clear()
  window.location.href = '/'
}

function reiniciarTemporizadorSesion() {

  if (temporizadorSesion) {
    clearTimeout(temporizadorSesion)
  }

  sessionStorage.setItem('lastActivity', Date.now())

  temporizadorSesion = setTimeout(() => {
    alert('La sesión ha expirado por inactividad.')
    cerrarSesion()
  }, TIEMPO_INACTIVIDAD)

}

function iniciarControlInactividad() {

  const eventos = ['mousemove', 'keydown', 'click', 'scroll']

  eventos.forEach(e =>
    document.addEventListener(e, reiniciarTemporizadorSesion)
  )

  reiniciarTemporizadorSesion()

}

// ------------------------------------------------------
// DECODIFICAR TOKEN JWT (Base64URL)
// ------------------------------------------------------

function base64UrlToBase64(input) {
  let base64 = input.replace(/-/g, '+').replace(/_/g, '/')
  const pad = base64.length % 4
  if (pad) base64 += '='.repeat(4 - pad)
  return base64
}

function getUserFromToken() {

  const token = sessionStorage.getItem('token')

  if (!token) return null

  try {

    const parts = token.split('.')
    if (parts.length < 2) return null

    const base64 = base64UrlToBase64(parts[1])

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

// ======================================================
// RENDER HEADER
// ======================================================

export function renderHeader(activeModule, gestionEntidadNombre = null) {

  const user = getUserFromToken()

  if (!user) {

    if (!sessionStorage.getItem('token')) {
      sessionStorage.clear()
    }

    if (window.location.pathname !== '/') {
      window.location.replace('/')
    }

    return
  }

  iniciarControlInactividad()

  let modulo = 'home'
  let seccion = ''

  if (typeof activeModule === 'string') {
    modulo = activeModule
  }

  if (typeof activeModule === 'object' && activeModule !== null) {
    modulo = activeModule.modulo || 'home'
    seccion = activeModule.seccion || ''
  }

  const nivelAcceso = Number(user?.nivel_acceso || 0)
  const esMaster = user?.es_master_admin === true

  // ======================================================
  // 🔥 MODELO EXACTO (SIN >=)
  // ======================================================

  let puedeAdmin = false
  let puedeTRDAI = false
  let puedeVerInformes = false
  let esGeneral = false

  if (esMaster) {
    puedeAdmin = true
    puedeTRDAI = true
    puedeVerInformes = true
  } else {

    switch (nivelAcceso) {

      case 90: // ADMINISTRADOR
        puedeAdmin = true
        break

      case 70: // ARCHIVISTA
        puedeTRDAI = true
        puedeVerInformes = true
        break

      case 50: // JEFE
        puedeVerInformes = true
        break

      case 10: // GENERAL
        esGeneral = true
        break

    }

  }

  // ======================================================

  const nombreEntidad =
    user?.entidad ||
    user?.entidad_nombre ||
    'Entidad'

  const nombreUsuario =
    user?.nombre ||
    user?.nombre_completo ||
    user?.username ||
    'Usuario'

  const cargoRaw =
    (user?.cargo || user?.cargo_nombre || '').trim()

  const dependenciaRaw =
    (user?.dependencia || '').trim()

  const limpiar = (texto) =>
    texto
      .replace(/^[\s\-–—]+/, '')
      .replace(/\s+/g, ' ')
      .trim()

  const cargo = limpiar(cargoRaw)
  const dependencia = limpiar(dependenciaRaw)

  let cargoDependencia = ''

  if (cargo && dependencia) {
    cargoDependencia = `${cargo} – ${dependencia}`
  } else if (cargo) {
    cargoDependencia = cargo
  } else if (dependencia) {
    cargoDependencia = dependencia
  }

  // ======================================================
  // HEADER
  // ======================================================

  const header = document.createElement('header')
  header.className = 'pig-header'

  header.innerHTML = `
    <div class="pig-header-inner">

      <div class="pig-header-top">

        <div class="pig-header-left">

          <div class="pig-title">
            SIPAD – ${gestionEntidadNombre || nombreEntidad}
            <span class="pig-module">
              ${modulo === 'home' ? 'Panel Principal' : modulo}
            </span>
          </div>

          ${seccion ? `<div class="pig-sub">${seccion}</div>` : ''}

        </div>

        <div class="pig-header-right">

          <nav class="pig-nav">

            <button type="button" id="btnInicio"
              ${modulo === 'home' ? 'class="active"' : ''}>
              Inicio
            </button>

            ${
              puedeAdmin
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
              puedeTRDAI
                ? `
                <button type="button" id="btnTRDAI"
                  ${modulo === 'TRD-AI' ? 'class="active"' : ''}>
                  TRD-AI
                </button>
                `
                : ''
            }

            ${
              puedeVerInformes
                ? `
                <button type="button" id="btnInformes"
                  ${modulo === 'Informes' ? 'class="active"' : ''}>
                  Informes
                </button>
                `
                : ''
            }

          </nav>

        </div>

      </div>

      <div class="pig-header-bottom">

        <div class="pig-user">

          <div class="pig-user-info" id="btnUserMenu">

            <div class="pig-user-icon">👤</div>

            <div class="pig-user-text">
              <div class="pig-user-name">
                ${nombreUsuario}
              </div>

              <div class="pig-user-meta">
                ${cargoDependencia}
              </div>
            </div>

          </div>

          <div class="pig-user-dropdown" id="userDropdown">

            <button type="button" id="btnCambiarPassword">
              🔑 Cambiar contraseña
            </button>

            <button type="button" id="btnSalir" class="logout">
              🚪 Cerrar sesión
            </button>

          </div>

        </div>

      </div>

    </div>
  `

  document.body.prepend(header)

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

  document.getElementById('btnCambiarPassword')
    ?.addEventListener('click', () => {
      const modal = document.getElementById('modalPassword')
      if (!modal) return
      modal.classList.remove('hidden')
    })

  document.getElementById('btnSalir')
    ?.addEventListener('click', cerrarSesion)

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

  const footer = document.createElement('footer')
  footer.className = 'sipad-footer'

  footer.innerHTML = `
    <div class="sipad-footer-inner">
      <span>SIPAD – Sistema inteligente para la planeación archivística documental</span>
      <span class="sipad-dev">© ${new Date().getFullYear()} · Desarrollado por Larson Agón</span>
    </div>
  `

  document.body.appendChild(footer)

}