// public/js/actions.js
// SIPAD – Helpers de permisos por acción
// FASE 5.4

import { can } from './permissions.js'

/**
 * Ejecuta una acción solo si el usuario tiene permiso
 * @param {string} permission
 * @param {Function} action
 * @param {Function} [onDenied]
 */
export function runIfAllowed(permission, action, onDenied) {
  if (!can(permission)) {
    if (onDenied) onDenied()
    return false
  }

  action()
  return true
}

/**
 * Configura un botón según permiso
 * @param {HTMLButtonElement} button
 * @param {string} permission
 */
export function guardButton(button, permission) {
  if (!can(permission)) {
    button.disabled = true
    button.title = 'No tienes permisos para esta acción'
  }
}
