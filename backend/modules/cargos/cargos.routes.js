// backend/modules/cargos/cargos.routes.js
// SIPAD – Módulo Cargos Institucional

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
  verificarJWT,
  requireLevel(80),
  async (req, res) => {
    try {

      const cargos = await db.all(`
        SELECT id, nombre, estado, created_at
        FROM cargos
        ORDER BY nombre ASC
      `)

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
  verificarJWT,
  requireLevel(90),
  async (req, res) => {
    try {

      const { nombre } = req.body

      if (!nombre)
        return res.status(400).json({ error: 'Nombre obligatorio' })

      const existe = await db.get(
        `SELECT id FROM cargos WHERE nombre = ?`,
        [nombre.trim()]
      )

      if (existe)
        return res.status(400).json({ error: 'El cargo ya existe' })

      await db.run(`
        INSERT INTO cargos (nombre, estado)
        VALUES (?, 1)
      `,
        [nombre.trim()]
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
  verificarJWT,
  requireLevel(90),
  async (req, res) => {
    try {

      const id = parseInt(req.params.id)
      const { nombre } = req.body

      if (!nombre)
        return res.status(400).json({ error: 'Nombre obligatorio' })

      await db.run(`
        UPDATE cargos
        SET nombre = ?
        WHERE id = ?
      `,
        [nombre.trim(), id]
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
  verificarJWT,
  requireLevel(90),
  async (req, res) => {
    try {

      const id = parseInt(req.params.id)
      const { estado } = req.body

      await db.run(
        `UPDATE cargos SET estado = ? WHERE id = ?`,
        [estado ? 1 : 0, id]
      )

      res.json({ ok: true })

    } catch (err) {
      console.error('Error cambiando estado cargo:', err)
      res.status(500).json({ error: 'Error actualizando cargo' })
    }
  }
)

console.log('🔥 CARGOS ROUTES CARGADO')

export default router