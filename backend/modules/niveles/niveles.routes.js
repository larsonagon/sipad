// backend/modules/niveles/niveles.routes.js
// SIPAD – Módulo Niveles Institucionales

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
  verificarJWT,
  requireLevel(80),
  async (req, res) => {
    try {

      const niveles = await db.all(`
        SELECT id, nombre, estado, created_at
        FROM niveles
        ORDER BY orden DESC
      `)

      res.json(niveles)

    } catch (err) {
      console.error('Error listando niveles:', err)
      res.status(500).json({ error: 'Error obteniendo niveles' })
    }
  }
)

// =====================================================
// CREAR NIVEL (orden automático)
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
        `SELECT id FROM niveles WHERE nombre = ?`,
        [nombre.trim()]
      )

      if (existe)
        return res.status(400).json({ error: 'El nivel ya existe' })

      // 🔥 Obtener el orden máximo actual
      const maxOrdenRow = await db.get(
        `SELECT MAX(orden) as max FROM niveles`
      )

      const nuevoOrden = (maxOrdenRow?.max || 0) + 10

      await db.run(`
        INSERT INTO niveles (nombre, orden, estado)
        VALUES (?, ?, 1)
      `,
        [nombre.trim(), nuevoOrden]
      )

      res.status(201).json({ ok: true })

    } catch (err) {
      console.error('Error creando nivel:', err)
      res.status(500).json({ error: 'Error creando nivel' })
    }
  }
)

// =====================================================
// EDITAR NIVEL (NO modifica orden)
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
        UPDATE niveles
        SET nombre = ?
        WHERE id = ?
      `,
        [nombre.trim(), id]
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
  verificarJWT,
  requireLevel(90),
  async (req, res) => {

    try {

      const id = parseInt(req.params.id)
      const { estado } = req.body

      await db.run(
        `UPDATE niveles SET estado = ? WHERE id = ?`,
        [estado ? 1 : 0, id]
      )

      res.json({ ok: true })

    } catch (err) {
      console.error('Error cambiando estado nivel:', err)
      res.status(500).json({ error: 'Error actualizando nivel' })
    }
  }
)

console.log('🔥 NIVELES ROUTES CARGADO')

export default router