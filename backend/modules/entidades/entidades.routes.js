import express from 'express'
import { db } from '../../db/database.js'

const router = express.Router()

console.log('🔥 ENTIDADES ROUTES ACTUALIZADO')

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


// ======================================
// CREAR ENTIDAD (SOLO MASTER ADMIN)
// ======================================

router.post('/', async (req, res) => {

  try {

    // 🔒 VALIDACIÓN DE SEGURIDAD
    if (!req.user) {
      return res.status(401).json({
        ok: false,
        error: 'No autenticado'
      })
    }

    if (!req.isMasterAdmin) {
      return res.status(403).json({
        ok: false,
        error: 'No autorizado (solo master admin)'
      })
    }

    const { nombre } = req.body

    if (!nombre || nombre.trim() === '') {
      return res.status(400).json({
        ok: false,
        error: 'Nombre requerido'
      })
    }

    const nombreLimpio = nombre.trim()
    const nombreNormalizado = nombreLimpio.toLowerCase()

    // 🔍 VALIDAR DUPLICADO (case insensitive)
    const existe = await db.get(
      `SELECT id FROM entidades WHERE LOWER(nombre) = ?`,
      [nombreNormalizado]
    )

    if (existe) {
      return res.status(400).json({
        ok: false,
        error: 'Ya existe una entidad con ese nombre'
      })
    }

    const result = await db.run(
      `
      INSERT INTO entidades (nombre, estado)
      VALUES (?, true)
      `,
      [nombreLimpio]
    )

    return res.status(201).json({
      ok: true,
      id: result.lastID,
      nombre: nombreLimpio
    })

  } catch (err) {

    console.error('Error creando entidad:', err)

    return res.status(500).json({
      ok: false,
      error: 'Error creando entidad'
    })
  }

})

export default router