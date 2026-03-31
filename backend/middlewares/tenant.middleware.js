// 🔒 Middleware Multi-Tenant Global

export function tenantMiddleware(req, res, next) {

  // 🔒 Debe existir usuario autenticado
  if (!req.user) {
    return res.status(401).json({
      error: 'Usuario no autenticado'
    })
  }

  // ✅ FIX: master admin puede hacer override via header X-Entidad-Id
  if (req.user.es_master_admin) {
    const headerRaw = (req.headers['x-entidad-id'] || '').toString().trim()
    if (headerRaw) {
      req.entidad_id = parseInt(headerRaw)
      return next()
    }
  }

  const entidadId = req.user.entidad_id

  if (!entidadId) {
    return res.status(400).json({
      error: 'Entidad no definida en el token'
    })
  }

  // 🔥 Inyectamos en request
  // ✅ FIX: guardar como integer, no string
  req.entidad_id = parseInt(entidadId)

  next()
}