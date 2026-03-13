// public/js/router.js

import state from './state.js'

const routes = {}

export function registerRoute(path, handler, options = {}) {
  routes[path] = {
    handler,
    protected: options.protected === true
  }
}

export function navigate(path) {
  history.pushState({}, '', path)
  handleRoute()
}

function handleRoute() {

  const path = window.location.pathname
  const route = routes[path]

  if (!route) {
    // Si no existe, ir a login
    history.replaceState({}, '', '/login')
    routes['/login']?.handler()
    return
  }

  if (route.protected && !state.auth.authenticated) {
    history.replaceState({}, '', '/login')
    routes['/login']?.handler()
    return
  }

  route.handler()
}

export function initRouter() {

  window.addEventListener('popstate', handleRoute)

  // Ejecutar ruta actual
  handleRoute()
}
