import { renderHeader } from '../components/header.js';

document.addEventListener('DOMContentLoaded', () => {

  const token = sessionStorage.getItem('token')
  const userRaw = sessionStorage.getItem('user')

  if (!token || !userRaw) {
    window.location.href = '/'
    return
  }

  const user = JSON.parse(userRaw)

  const gestionEntidadId     = sessionStorage.getItem('gestion_entidad_id') || null
  const gestionEntidadNombre = sessionStorage.getItem('gestion_entidad_nombre') || null

  renderHeader('Administración', gestionEntidadNombre)

  const esMaster = user?.es_master_admin === true
  const nivel    = user?.nivel || user?.nivel_acceso || 0

  function ocultar(id) {
    const el = document.getElementById(id)
    if (el) el.style.display = 'none'
  }

  // =========================
  // SUPER ADMIN SIN ENTIDAD SELECCIONADA
  // → Solo muestra tarjeta Entidades
  // =========================

  if (esMaster && !gestionEntidadId) {

    ocultar('btnDependencias')
    ocultar('btnCargos')
    ocultar('btnNiveles')
    ocultar('btnRoles')
    ocultar('btnUsuarios')

    const p = document.querySelector('.module-header p')
    if (p) p.textContent = 'Selecciona una entidad para gestionar su configuración interna.'

    document.getElementById('btnEntidades')
      ?.addEventListener('click', () => {
        window.location.href = '/administracion/entidades/index.html'
      })

    return
  }

  // =========================
  // SUPER ADMIN CON ENTIDAD SELECCIONADA
  // → Todo menos Entidades (el botón volver vive en el header)
  // =========================

  if (esMaster && gestionEntidadId) {

    ocultar('btnEntidades')

    const h1 = document.querySelector('.module-header h1')
    const p  = document.querySelector('.module-header p')

    if (h1) h1.textContent = `Gestionando: ${gestionEntidadNombre}`
    if (p)  p.textContent  = 'Configura la estructura interna de esta entidad: dependencias, cargos, niveles, roles y usuarios.'

  } else {

    // =========================
    // USUARIO NORMAL
    // → Sin Entidades, sin Cargos si nivel < 90
    // =========================

    ocultar('btnEntidades')

    if (nivel < 90) {
      ocultar('btnCargos')
    }

  }

  // =========================
  // NAVEGACIÓN (común a todos)
  // =========================

  document.getElementById('btnEntidades')
    ?.addEventListener('click', () => {
      window.location.href = '/administracion/entidades/index.html'
    })

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

})