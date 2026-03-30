// 🔒 Middleware Multi-Tenant Global

export function tenantMiddleware(req, res, next) {

  // 🔒 Debe existir usuario autenticado
  if (!req.user) {
    return res.status(401).json({
      error: 'Usuario no autenticado'
    })
  }

  const entidadId = req.user.entidad_id

  if (!entidadId) {
    return res.status(400).json({
      error: 'Entidad no definida en el token'
    })
  }

  // 🔥 Inyectamos en request
  req.entidad_id = entidadId

  next()
}