export function multiTenant(req, res, next) {

  if (!req.user) {
    return res.status(401).json({
      error: 'Usuario no autenticado'
    })
  }

  // ✅ Master admin bypassa el tenant check
  if (req.user.es_master_admin) {
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