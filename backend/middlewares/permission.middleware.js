import { db } from '../db/database.js'

export function requirePermission(codigoPermiso) {

  return async (req, res, next) => {

    try {

      if (!req.user) {
        return res.status(401).json({
          error: 'Usuario no autenticado'
        })
      }

      const userId =
        req.user?.sub ??
        req.user?.id ??
        null

      if (!userId) {
        return res.status(401).json({
          error: 'Usuario no identificado'
        })
      }

      const permiso = await db.get(
        `
        SELECT p.codigo
        FROM usuarios u
        JOIN rol_permisos rp ON rp.id_rol = u.id_rol
        JOIN permisos p ON p.id = rp.id_permiso
        WHERE u.id = ?
          AND p.codigo = ?
          AND p.activo = 1
        `,
        [userId, codigoPermiso]
      )

      if (!permiso) {
        return res.status(403).json({
          error: 'No tienes permiso para realizar esta acción'
        })
      }

      next()

    } catch (err) {

      console.error('Error validando permisos:', err)

      return res.status(500).json({
        error: 'Error validando permisos'
      })

    }

  }

}