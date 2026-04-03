import { renderHeader } from '../components/header.js';

document.addEventListener('DOMContentLoaded', () => {

  const token = sessionStorage.getItem('token')
  const userRaw = sessionStorage.getItem('user')

  if (!token || !userRaw) {
    window.location.href = '/'
    return
  }

  const user = JSON.parse(userRaw)

  // 🔥 Leer contexto de gestión
  const gestionEntidadId     = sessionStorage.getItem('gestion_entidad_id') || null
  const gestionEntidadNombre = sessionStorage.getItem('gestion_entidad_nombre') || null

  renderHeader('Administración', gestionEntidadNombre)

  const esMaster = user?.es_master_admin === true
  const nivel    = user?.nivel || user?.nivel_acceso || 0

  // =========================
  // SUPER ADMIN SIN ENTIDAD SELECCIONADA
  // → Solo muestra tarjeta Entidades
  // =========================

  if (esMaster && !gestionEntidadId) {

    // Ocultar todo menos Entidades
    const tarjetasOcultar = [
      'btnDependencias',
      'btnCargos',
      'btnNiveles',
      'btnRoles',
      'btnUsuarios'
    ]

    tarjetasOcultar.forEach(id => {
      const btn = document.getElementById(id)
      if (btn) {
        // Ocultar la tarjeta padre
        const card = btn.closest('.module-card') || btn.closest('[class*="card"]') || btn
        card.style.display = 'none'
      }
    })

    // Mostrar mensaje orientativo
    const header = document.querySelector('.module-header')
    if (header) {
      const aviso = document.createElement('p')
      aviso.style.cssText = `
        color: #6b7280;
        font-size: 14px;
        margin-top: 8px;
      `
      aviso.textContent = 'Selecciona una entidad para gestionar su configuración interna.'
      header.appendChild(aviso)
    }

    // Solo navegar a Entidades
    document.getElementById('btnEntidades')
      ?.addEventListener('click', () => {
        window.location.href = '/administracion/entidades/index.html'
      })

    return
  }

  // =========================
  // SUPER ADMIN CON ENTIDAD SELECCIONADA
  // → Muestra todo menos Entidades
  // =========================

  if (esMaster && gestionEntidadId) {

    // Ocultar tarjeta Entidades (ya está gestionando una)
    const btnEntidades = document.getElementById('btnEntidades')
    if (btnEntidades) {
      const card = btnEntidades.closest('.module-card') || btnEntidades.closest('[class*="card"]') || btnEntidades
      card.style.display = 'none'
    }

    // Título dinámico
    const h1 = document.querySelector('.module-header h1')
    const p  = document.querySelector('.module-header p')

    if (h1) h1.textContent = `Gestionando: ${gestionEntidadNombre}`
    if (p)  p.textContent  = 'Configura la estructura interna de esta entidad: dependencias, cargos, niveles, roles y usuarios.'

    // Botón volver
    const btnSalir = document.createElement('button')
    btnSalir.textContent = '← Volver a Entidades'
    btnSalir.style.cssText = `
      margin-top: 16px;
      padding: 10px 24px;
      font-size: 14px;
      font-weight: 600;
      background: #dc2626;
      color: #fff;
      border-radius: 8px;
      box-shadow: 0 4px 12px rgba(220,38,38,0.3);
      border: none;
      cursor: pointer;
      transition: all .2s;
    `

    btnSalir.addEventListener('mouseenter', () => {
      btnSalir.style.background  = '#b91c1c'
      btnSalir.style.boxShadow   = '0 6px 16px rgba(220,38,38,0.4)'
    })

    btnSalir.addEventListener('mouseleave', () => {
      btnSalir.style.background  = '#dc2626'
      btnSalir.style.boxShadow   = '0 4px 12px rgba(220,38,38,0.3)'
    })

    btnSalir.addEventListener('click', () => {
      sessionStorage.removeItem('gestion_entidad_id')
      sessionStorage.removeItem('gestion_entidad_nombre')
      window.location.href = '/administracion/entidades/index.html'
    })

    document.querySelector('.module-header')?.appendChild(btnSalir)

  } else {

    // =========================
    // USUARIO NORMAL
    // =========================

    // Entidades: solo master admin
    const btnEntidades = document.getElementById('btnEntidades')
    if (btnEntidades) {
      const card = btnEntidades.closest('.module-card') || btnEntidades.closest('[class*="card"]') || btnEntidades
      card.style.display = 'none'
    }

    // Cargos: solo nivel >= 90
    if (nivel < 90) {
      const btnCargos = document.getElementById('btnCargos')
      if (btnCargos) {
        const card = btnCargos.closest('.module-card') || btnCargos.closest('[class*="card"]') || btnCargos
        card.style.display = 'none'
      }
    }

  }

  // =========================
  // NAVEGACIÓN (común a todos)
  // =========================

  document.getElementById('btnDependencias')
    ?.addEventListener('click', () => {
      window.location.href = '/administracion/dependencias/index.html'
    })

  document.getElementById('btnRoles')
    ?.addEventListener('click', () => {
      window.location.href = '/administracion/roles/index.html'
    })

  document.getElementById('btnUsuarios')
    ?.addEventListener('click', () => {
      window.location.href = '/administracion/usuarios/index.html'
    })

  document.getElementById('btnCargos')
    ?.addEventListener('click', () => {
      window.location.href = '/administracion/cargos/index.html'
    })

  document.getElementById('btnNiveles')
    ?.addEventListener('click', () => {
      window.location.href = '/administracion/niveles/index.html'
    })

  document.getElementById('btnEntidades')
    ?.addEventListener('click', () => {
      window.location.href = '/administracion/entidades/index.html'
    })

})