import { db } from '../db/database.js'

export async function multiTenant(req, res, next) {

  if (!req.user) {
    return res.status(401).json({
      error: 'Usuario no autenticado'
    })
  }

  // 🔥 Normalizar header
  const headerEntidad = (req.headers['x-entidad-id'] || '').toString().trim()

  // 🔒 Usuario normal NO puede usar override
  if (!req.user.es_master_admin && headerEntidad) {
    return res.status(403).json({
      error: 'No autorizado para cambiar de entidad'
    })
  }

  // ======================================
  // 🔥 MASTER ADMIN
  // ======================================
  if (req.user.es_master_admin) {

    console.log('🔥 MASTER ADMIN - x-entidad-id:', headerEntidad || '(no enviado)')

    if (headerEntidad) {

      try {

        // ✅ Validar que la entidad exista
        const entidad = await db.get(
          `SELECT id FROM entidades WHERE id = ?`,
          [headerEntidad]
        )

        if (!entidad) {
          return res.status(400).json({
            error: 'Entidad inválida'
          })
        }

        console.log(`[MULTI-TENANT] Master ${req.user.sub} operando en entidad ${headerEntidad}`)

        req.entidad_id = headerEntidad

      } catch (err) {

        console.error('Error validando entidad override:', err)

        return res.status(500).json({
          error: 'Error validando entidad'
        })
      }

    } else {

      // ✔ comportamiento original intacto
      req.entidad_id = req.user.entidad_id
    }

    return next()
  }

  // ======================================
  // 🔒 USUARIO NORMAL
  // ======================================

  const entidadId = req.user.entidad_id

  if (!entidadId) {
    return res.status(400).json({
      error: 'Entidad no definida en el token'
    })
  }

  // ✔ comportamiento original intacto
  req.entidad_id = entidadId

  next()
}