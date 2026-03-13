// permissions.js
// Mapa central de permisos por rol para el frontend SIPAD

import state from './state.js'

// =========================
// Definición de permisos
// =========================

const PERMISSIONS = {
  admin: {
    usuarios: true,
    sync: true,
    configuracion: true,
    dashboard: true
  },

  usuario: {
    usuarios: false,
    sync: true,
    configuracion: false,
    dashboard: true
  }
}

// =========================
// Helpers de permisos
// =========================

/**
 * Verifica si el usuario actual tiene un permiso específico
 * @param {string} permission
 * @returns {boolean}
 */
export function can(permission) {
  const role = state.user.role
  if (!role) return false

  return PERMISSIONS[role]?.[permission] === true
}

/**
 * Verifica si el usuario tiene alguno de los permisos indicados
 * @param {string[]} permissions
 * @returns {boolean}
 */
export function canAny(permissions = []) {
  return permissions.some(p => can(p))
}

/**
 * Verifica si el usuario tiene todos los permisos indicados
 * @param {string[]} permissions
 * @returns {boolean}
 */
export function canAll(permissions = []) {
  return permissions.every(p => can(p))
}

// =========================
// Exportación controlada
// =========================

export default PERMISSIONS
