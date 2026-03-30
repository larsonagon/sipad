// backend/modules/cargos/cargos.routes.js
// SIPAD – Módulo Cargos Institucional (MULTI-TENANT SEGURO)

import express from 'express'
import { db } from '../../db/database.js'
import { verificarJWT } from '../../middlewares/auth.middleware.js'
import { requireLevel } from '../../middlewares/role.middleware.js'

const router = express.Router()

// =====================================================
// LISTAR CARGOS
// =====================================================

router.get(
  '/',
  async (req, res) => {
    try {

      const entidadId = req.user.entidad_id

      if (!entidadId) {
        return res.status(401).json({ error: 'Entidad no definida en el token' })
      }

      const cargos = await db.all(`
        SELECT id, nombre, estado, created_at
        FROM cargos
        WHERE entidad_id = ?
        ORDER BY nombre ASC
      `, [entidadId])

      res.json(cargos)

    } catch (err) {
      console.error('Error listando cargos:', err)
      res.status(500).json({ error: 'Error obteniendo cargos' })
    }
  }
)

// =====================================================
// CREAR CARGO
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
        `SELECT id FROM cargos WHERE nombre = ? AND entidad_id = ?`,
        [nombreLimpio, entidadId]
      )

      if (existe)
        return res.status(400).json({ error: 'El cargo ya existe en esta entidad' })

      await db.run(`
        INSERT INTO cargos (nombre, estado, entidad_id)
        VALUES (?, 1, ?)
      `,
        [nombreLimpio, entidadId]
      )

      res.status(201).json({ ok: true })

    } catch (err) {
      console.error('Error creando cargo:', err)
      res.status(500).json({ error: 'Error creando cargo' })
    }
  }
)

// =====================================================
// EDITAR CARGO
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

      const cargo = await db.get(
        `SELECT id FROM cargos WHERE id = ? AND entidad_id = ?`,
        [id, entidadId]
      )

      if (!cargo) {
        return res.status(404).json({
          error: 'Cargo no pertenece a esta entidad'
        })
      }

      const nombreLimpio = nombre.trim()

      // 🔒 VALIDACIÓN MULTI-TENANT (evita duplicados)
      const existe = await db.get(
        `SELECT id FROM cargos WHERE nombre = ? AND id != ? AND entidad_id = ?`,
        [nombreLimpio, id, entidadId]
      )

      if (existe) {
        return res.status(400).json({
          error: 'Ya existe otro cargo con ese nombre en esta entidad'
        })
      }

      await db.run(`
        UPDATE cargos
        SET nombre = ?
        WHERE id = ? AND entidad_id = ?
      `,
        [nombreLimpio, id, entidadId]
      )

      res.json({ ok: true })

    } catch (err) {
      console.error('Error editando cargo:', err)
      res.status(500).json({ error: 'Error editando cargo' })
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

      const cargo = await db.get(
        `SELECT id FROM cargos WHERE id = ? AND entidad_id = ?`,
        [id, entidadId]
      )

      if (!cargo) {
        return res.status(404).json({
          error: 'Cargo no pertenece a esta entidad'
        })
      }

      await db.run(
        `UPDATE cargos SET estado = ? WHERE id = ? AND entidad_id = ?`,
        [estado ? 1 : 0, id, entidadId]
      )

      res.json({ ok: true })

    } catch (err) {
      console.error('Error cambiando estado cargo:', err)
      res.status(500).json({ error: 'Error actualizando cargo' })
    }
  }
)

console.log('🔥 CARGOS ROUTES CARGADO (MULTI-TENANT SEGURO)')

export default router