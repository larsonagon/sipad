import express from 'express'
import { db } from '../../db/database.js'
import { verificarJWT } from '../../middlewares/auth.middleware.js'
import { requireLevel, attachPermissions } from '../../middlewares/role.middleware.js'

const router = express.Router()

const DB_ENGINE = process.env.DB_ENGINE || 'postgres'

// =====================================================
// HELPERS (SE MANTIENEN POR COMPATIBILIDAD)
// =====================================================

async function registrarAuditoria() {}
async function contarRolesNivel100() { return 0 }

// =====================================================
// LISTAR ROLES (GLOBAL - SOLO LECTURA)
// =====================================================

router.get(
  '/',
  requireLevel(10), // 🔥 cualquier usuario autenticado
  attachPermissions,
  async (req, res) => {

    try {

      // 🔥 YA NO DEPENDE DE ENTIDAD
      // ✅ FIX: incluir activo en SELECT y filtrar en BD
      const roles = await db.all(`
        SELECT id, nombre, nivel_acceso, activo
        FROM roles
        WHERE activo = 1
        ORDER BY nivel_acceso DESC
      `)

      res.json(roles)

    } catch (err) {
      console.error(err)
      res.status(500).json({ error: 'Error listando roles' })
    }

  }
)

// =====================================================
// BLOQUEO TOTAL DE ESCRITURA
// =====================================================

router.post('/', (req, res) => {
  return res.status(403).json({
    error: 'Los roles son globales y no se pueden crear'
  })
})

router.patch('/:id', (req, res) => {
  return res.status(403).json({
    error: 'Los roles no se pueden editar'
  })
})

router.patch('/:id/estado', (req, res) => {
  return res.status(403).json({
    error: 'Los roles no se pueden modificar'
  })
})

router.delete('/:id', (req, res) => {
  return res.status(403).json({
    error: 'Los roles no se pueden eliminar'
  })
})

console.log('🔥 ROLES ROUTES CARGADO (GLOBAL READ-ONLY)')

export default router