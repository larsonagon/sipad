import express from 'express'
import { db } from '../../db/database.js'
import { verificarJWT } from '../../middlewares/auth.middleware.js'

const router = express.Router()

router.get(
  '/',
  async (req, res) => {

    try {

      const config = await db.get(
        `SELECT * FROM configuracion_entidad WHERE id_entidad = ?`,
        [req.user.id_entidad]
      )

      res.json(config)

    } catch (err) {
      console.error(err)
      res.status(500).json({ error: 'Error obteniendo configuración' })
    }

  }
)

console.log('🔥 CONFIGURACION ROUTES CARGADO')
export default router