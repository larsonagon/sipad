import express from 'express'
import { db } from '../../db/database.js'
import { verificarJWT } from '../../middlewares/auth.middleware.js'
import { requireLevel } from '../../middlewares/role.middleware.js'

const router = express.Router()

// =====================================================
// AUDITORÍA GLOBAL INSTITUCIONAL
// =====================================================

router.get(
  '/global',
  verificarJWT,
  requireLevel(80),
  async (req, res) => {

    try {

      const {
        actor,
        modulo,
        fecha_inicio,
        fecha_fin,
        page = 1,
        limit = 20
      } = req.query

      const offset = (parseInt(page) - 1) * parseInt(limit)

      let filtros = []
      let params = []

      // =====================
      // FILTROS DINÁMICOS
      // =====================

      if (actor) {
        filtros.push(`actor_id = ?`)
        params.push(actor)
      }

      if (fecha_inicio) {
        filtros.push(`created_at >= ?`)
        params.push(fecha_inicio)
      }

      if (fecha_fin) {
        filtros.push(`created_at <= ?`)
        params.push(fecha_fin)
      }

      const whereClause = filtros.length
        ? `WHERE ${filtros.join(' AND ')}`
        : ''

      // =====================
      // CONSULTA UNIFICADA
      // =====================

      const query = `
        SELECT * FROM (

          SELECT
            a.id,
            'USUARIOS' as modulo,
            a.accion,
            a.actor_id,
            u.username as actor,
            a.detalle_json,
            a.created_at
          FROM auditoria_usuarios a
          JOIN usuarios u ON u.id = a.actor_id

          UNION ALL

          SELECT
            r.id,
            'ROLES' as modulo,
            r.accion,
            r.actor_id,
            u.username as actor,
            r.detalle_json,
            r.created_at
          FROM auditoria_roles r
          JOIN usuarios u ON u.id = r.actor_id

          UNION ALL

          SELECT
            d.id,
            'DEPENDENCIAS' as modulo,
            d.accion,
            d.actor_id,
            u.username as actor,
            d.detalle_json,
            d.created_at
          FROM auditoria_dependencias d
          JOIN usuarios u ON u.id = d.actor_id

        ) AS auditoria
        ${whereClause}
        ${modulo ? `AND modulo = '${modulo.toUpperCase()}'` : ''}
        ORDER BY created_at DESC
        LIMIT ? OFFSET ?
      `

      const results = await db.all(
        query,
        [...params, parseInt(limit), offset]
      )

      res.json({
        page: parseInt(page),
        limit: parseInt(limit),
        total_registros: results.length,
        data: results
      })

    } catch (err) {
      console.error(err)
      res.status(500).json({
        error: 'Error obteniendo auditoría global'
      })
    }
  }
)

console.log('🔥 AUDITORIA GLOBAL CARGADA')
export default router