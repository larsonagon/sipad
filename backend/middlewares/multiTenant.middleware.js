export function multiTenant(req, res, next) {

  if (!req.user) {
    return res.status(401).json({
      error: 'Usuario no autenticado'
    })
  }

  if (!req.user.entidad_id) {
    return res.status(400).json({
      error: 'Token sin entidad asociada'
    })
  }

  // 🔥 Inyección segura
  req.entidad_id = req.user.entidad_id

  next()
}