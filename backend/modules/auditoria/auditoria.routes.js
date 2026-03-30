import express from 'express'
import { db } from '../../db/database.js'
import { verificarJWT } from '../../middlewares/auth.middleware.js'
import { requireLevel } from '../../middlewares/role.middleware.js'

const router = express.Router()

// =====================================================
// AUDITORÍA GLOBAL INSTITUCIONAL (MULTI-TENANT SEGURO)
// =====================================================

router.get(
  '/global',
  requireLevel(80),
  async (req, res) => {

    try {

      const entidadId = req.user.entidad_id

      if (!entidadId) {
        return res.status(401).json({ error: 'Entidad no definida en el token' })
      }

      const {
        actor,
        modulo,
        fecha_inicio,
        fecha_fin,
        page = 1,
        limit = 20
      } = req.query

      const pageInt = parseInt(page)
      const limitInt = parseInt(limit)
      const offset = (pageInt - 1) * limitInt

      let filtros = []
      let params = []

      // 🔒 FILTRO BASE (OBLIGATORIO MULTI-TENANT)
      filtros.push(`entidad_id = ?`)
      params.push(entidadId)

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

      // 🔒 VALIDACIÓN ANTI-INYECCIÓN
      const modulosValidos = ['USUARIOS', 'ROLES', 'DEPENDENCIAS']

      if (modulo && modulosValidos.includes(modulo.toUpperCase())) {
        filtros.push(`modulo = ?`)
        params.push(modulo.toUpperCase())
      }

      const whereClause = `WHERE ${filtros.join(' AND ')}`

      // =====================
      // CONSULTA UNIFICADA SEGURA
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
            a.created_at,
            a.entidad_id
          FROM auditoria_usuarios a
          JOIN usuarios u 
            ON u.id = a.actor_id
           AND u.entidad_id = a.entidad_id

          UNION ALL

          SELECT
            r.id,
            'ROLES' as modulo,
            r.accion,
            r.actor_id,
            u.username as actor,
            r.detalle_json,
            r.created_at,
            r.entidad_id
          FROM auditoria_roles r
          JOIN usuarios u 
            ON u.id = r.actor_id
           AND u.entidad_id = r.entidad_id

          UNION ALL

          SELECT
            d.id,
            'DEPENDENCIAS' as modulo,
            d.accion,
            d.actor_id,
            u.username as actor,
            d.detalle_json,
            d.created_at,
            d.entidad_id
          FROM auditoria_dependencias d
          JOIN usuarios u 
            ON u.id = d.actor_id
           AND u.entidad_id = d.entidad_id

        ) AS auditoria
        ${whereClause}
        ORDER BY created_at DESC
        LIMIT ? OFFSET ?
      `

      const results = await db.all(
        query,
        [...params, limitInt, offset]
      )

      res.json({
        page: pageInt,
        limit: limitInt,
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

console.log('🔥 AUDITORIA GLOBAL CARGADA (MULTI-TENANT SEGURO)')

export default router