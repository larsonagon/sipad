export function multiTenant(req, res, next) {

  if (!req.user) {
    return res.status(401).json({
      error: 'Usuario no autenticado'
    })
  }

  // ✅ Master admin puede operar en nombre de otra entidad
  if (req.user.es_master_admin) {

    console.log('🔥 MASTER ADMIN - x-entidad-id:', req.headers['x-entidad-id'])

    const entidadOverride = req.headers['x-entidad-id']

    if (entidadOverride) {
      req.entidad_id = entidadOverride
    } else {
      req.entidad_id = req.user.entidad_id
    }

    return next()
  }

  const entidadId = req.user.entidad_id

  if (!entidadId) {
    return res.status(400).json({
      error: 'Entidad no definida en el token'
    })
  }

  // 🔥 Inyección limpia
  req.entidad_id = entidadId

  next()
}