import { db } from '../db/database.js'

export function requirePermission(codigoPermiso) {

  return async (req, res, next) => {

    try {

      const userId = req.user.sub

      const permiso = await db.get(`
        SELECT p.codigo
        FROM usuarios u
        JOIN rol_permisos rp ON rp.id_rol = u.id_rol
        JOIN permisos p ON p.id = rp.id_permiso
        WHERE u.id = ?
          AND p.codigo = ?
          AND p.activo = 1
      `, [userId, codigoPermiso])

      if (!permiso) {
        return res.status(403).json({
          error: 'No tienes permiso para realizar esta acción'
        })
      }

      next()

    } catch (err) {
      console.error(err)
      res.status(500).json({
        error: 'Error validando permisos'
      })
    }

  }
}