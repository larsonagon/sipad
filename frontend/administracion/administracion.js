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
  const gestionEntidadNombre = sessionStorage.getItem('gestion_entidad_nombre') || null

  renderHeader('Administración', gestionEntidadNombre)

  // =========================
  // CONTROL DE VISIBILIDAD
  // =========================

  const nivel = user?.nivel || user?.nivel_acceso || 0
  const esMaster = user?.es_master_admin === true

  // Cargos solo nivel alto (>=90)
  if (nivel < 90 && !esMaster) {
    const btnCargos = document.getElementById('btnCargos')
    if (btnCargos) btnCargos.style.display = 'none'
  }

  // Entidades solo master admin (ocultar cuando está en modo gestión)
  if (!esMaster) {
    const btnEntidades = document.getElementById('btnEntidades')
    if (btnEntidades) btnEntidades.style.display = 'none'
  }

  // 🔥 Si está en modo gestión, ocultar botón de entidades para no confundir
  if (gestionEntidadNombre) {
    const btnEntidades = document.getElementById('btnEntidades')
    if (btnEntidades) btnEntidades.style.display = 'none'
  }

  // =========================
  // NAVEGACIÓN
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