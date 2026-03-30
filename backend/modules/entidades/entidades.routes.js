import express from 'express'
import { db } from '../../db/database.js'

const router = express.Router()

// ======================================
// LISTAR ENTIDADES ACTIVAS
// ======================================

router.get('/', async (req, res) => {

  try {

    const entidades = await db.all(`
      SELECT id, nombre
      FROM entidades
      WHERE estado = true
      ORDER BY nombre ASC
    `)

    return res.json({
      ok: true,
      data: entidades
    })

  } catch (err) {

    console.error('Error obteniendo entidades:', err)

    return res.status(500).json({
      ok: false,
      error: 'Error cargando entidades'
    })
  }

})

export default router