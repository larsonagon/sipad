// backend/modules/niveles/niveles.routes.js
// SIPAD – Módulo Niveles Institucionales (MULTI-TENANT SEGURO)

import express from 'express'
import { db } from '../../db/database.js'
import { verificarJWT } from '../../middlewares/auth.middleware.js'
import { requireLevel } from '../../middlewares/role.middleware.js'

const router = express.Router()

// =====================================================
// LISTAR NIVELES
// =====================================================

router.get(
  '/',
  requireLevel(80),
  async (req, res) => {
    try {

      const entidadId = req.user.entidad_id

      if (!entidadId) {
        return res.status(401).json({ error: 'Entidad no definida en el token' })
      }

      const niveles = await db.all(`
        SELECT id, nombre, estado, created_at, orden
        FROM niveles
        WHERE entidad_id = ?
        ORDER BY orden DESC
      `, [entidadId])

      res.json(niveles)

    } catch (err) {
      console.error('Error listando niveles:', err)
      res.status(500).json({ error: 'Error obteniendo niveles' })
    }
  }
)

// =====================================================
// CREAR NIVEL (orden automático por entidad)
// =====================================================

router.post(
  '/',
  requireLevel(90),
  async (req, res) => {

    try {

      const entidadId = req.user.entidad_id
      const { nombre } = req.body

      if (!entidadId) {
        return res.status(401).json({ error: 'Entidad no definida en el token' })
      }

      if (!nombre || !nombre.trim())
        return res.status(400).json({ error: 'Nombre obligatorio' })

      const nombreLimpio = nombre.trim()

      const existe = await db.get(
        `SELECT id FROM niveles WHERE nombre = ? AND entidad_id = ?`,
        [nombreLimpio, entidadId]
      )

      if (existe)
        return res.status(400).json({ error: 'El nivel ya existe en esta entidad' })

      // 🔥 Orden por entidad (seguro)
      const maxOrdenRow = await db.get(
        `SELECT MAX(orden) as max FROM niveles WHERE entidad_id = ?`,
        [entidadId]
      )

      const nuevoOrden = (maxOrdenRow?.max || 0) + 10

      await db.run(`
        INSERT INTO niveles (nombre, orden, estado, entidad_id)
        VALUES (?, ?, 1, ?)
      `,
        [nombreLimpio, nuevoOrden, entidadId]
      )

      res.status(201).json({ ok: true })

    } catch (err) {
      console.error('Error creando nivel:', err)
      res.status(500).json({ error: 'Error creando nivel' })
    }
  }
)

// =====================================================
// EDITAR NIVEL
// =====================================================

router.put(
  '/:id',
  requireLevel(90),
  async (req, res) => {

    try {

      const entidadId = req.user.entidad_id
      const id = parseInt(req.params.id)
      const { nombre } = req.body

      if (!entidadId) {
        return res.status(401).json({ error: 'Entidad no definida en el token' })
      }

      if (!nombre || !nombre.trim())
        return res.status(400).json({ error: 'Nombre obligatorio' })

      const nivel = await db.get(
        `SELECT id FROM niveles WHERE id = ? AND entidad_id = ?`,
        [id, entidadId]
      )

      if (!nivel) {
        return res.status(404).json({
          error: 'Nivel no pertenece a esta entidad'
        })
      }

      const nombreLimpio = nombre.trim()

      // 🔒 VALIDACIÓN MULTI-TENANT (evita duplicados)
      const existe = await db.get(
        `SELECT id FROM niveles WHERE nombre = ? AND id != ? AND entidad_id = ?`,
        [nombreLimpio, id, entidadId]
      )

      if (existe) {
        return res.status(400).json({
          error: 'Ya existe otro nivel con ese nombre en esta entidad'
        })
      }

      await db.run(`
        UPDATE niveles
        SET nombre = ?
        WHERE id = ? AND entidad_id = ?
      `,
        [nombreLimpio, id, entidadId]
      )

      res.json({ ok: true })

    } catch (err) {
      console.error('Error editando nivel:', err)
      res.status(500).json({ error: 'Error editando nivel' })
    }
  }
)

// =====================================================
// ACTIVAR / DESACTIVAR
// =====================================================

router.patch(
  '/:id/estado',
  requireLevel(90),
  async (req, res) => {

    try {

      const entidadId = req.user.entidad_id
      const id = parseInt(req.params.id)
      const { estado } = req.body

      if (!entidadId) {
        return res.status(401).json({ error: 'Entidad no definida en el token' })
      }

      const nivel = await db.get(
        `SELECT id FROM niveles WHERE id = ? AND entidad_id = ?`,
        [id, entidadId]
      )

      if (!nivel) {
        return res.status(404).json({
          error: 'Nivel no pertenece a esta entidad'
        })
      }

      await db.run(
        `UPDATE niveles SET estado = ? WHERE id = ? AND entidad_id = ?`,
        [estado ? 1 : 0, id, entidadId]
      )

      res.json({ ok: true })

    } catch (err) {
      console.error('Error cambiando estado nivel:', err)
      res.status(500).json({ error: 'Error actualizando nivel' })
    }
  }
)

console.log('🔥 NIVELES ROUTES CARGADO (MULTI-TENANT SEGURO)')

export default router