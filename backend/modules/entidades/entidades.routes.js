import express from 'express'
import { db } from '../../db/database.js'

const router = express.Router()

console.log('🔥 ENTIDADES ROUTES ACTUALIZADO')

const DB_ENGINE = process.env.DB_ENGINE || 'postgres'

// ======================================
// LISTAR ENTIDADES
// ======================================

router.get('/', async (req, res) => {

  try {

    const entidades = await db.all(`
      SELECT id, nombre, estado
      FROM entidades
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

    if (!req.user) {
      return res.status(401).json({
        ok: false,
        error: 'No autenticado'
      })
    }

    if (!req.user.es_master_admin) {
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

    let entidadId

    if (DB_ENGINE === 'postgres') {

      const row = await db.get(
        `INSERT INTO entidades (id, nombre, estado) VALUES (gen_random_uuid(), ?, true) RETURNING id`,
        [nombreLimpio]
      )

      entidadId = row.id

    } else {

      const result = await db.run(
        `INSERT INTO entidades (nombre, estado) VALUES (?, true)`,
        [nombreLimpio]
      )

      entidadId = result.lastID

    }

    return res.status(201).json({
      ok: true,
      id: entidadId,
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

// ======================================
// EDITAR ENTIDAD (SOLO MASTER ADMIN)
// ======================================

router.patch('/:id', async (req, res) => {

  try {

    if (!req.user?.es_master_admin) {
      return res.status(403).json({
        ok: false,
        error: 'No autorizado (solo master admin)'
      })
    }

    const { id } = req.params
    const { nombre } = req.body

    if (!nombre || nombre.trim() === '') {
      return res.status(400).json({
        ok: false,
        error: 'Nombre requerido'
      })
    }

    const nombreLimpio = nombre.trim()
    const nombreNormalizado = nombreLimpio.toLowerCase()

    const entidad = await db.get(
      `SELECT id FROM entidades WHERE id = ?`,
      [id]
    )

    if (!entidad) {
      return res.status(404).json({
        ok: false,
        error: 'Entidad no encontrada'
      })
    }

    const existe = await db.get(
      `SELECT id FROM entidades WHERE LOWER(nombre) = ? AND id != ?`,
      [nombreNormalizado, id]
    )

    if (existe) {
      return res.status(400).json({
        ok: false,
        error: 'Ya existe una entidad con ese nombre'
      })
    }

    await db.run(
      `UPDATE entidades SET nombre = ? WHERE id = ?`,
      [nombreLimpio, id]
    )

    return res.json({
      ok: true,
      nombre: nombreLimpio
    })

  } catch (err) {

    console.error('Error editando entidad:', err)

    return res.status(500).json({
      ok: false,
      error: 'Error editando entidad'
    })
  }

})

// ======================================
// ACTIVAR / DESACTIVAR ENTIDAD (SOLO MASTER ADMIN)
// ======================================

router.patch('/:id/estado', async (req, res) => {

  try {

    if (!req.user?.es_master_admin) {
      return res.status(403).json({
        ok: false,
        error: 'No autorizado (solo master admin)'
      })
    }

    const { id } = req.params
    const { estado } = req.body

    const entidad = await db.get(
      `SELECT id FROM entidades WHERE id = ?`,
      [id]
    )

    if (!entidad) {
      return res.status(404).json({
        ok: false,
        error: 'Entidad no encontrada'
      })
    }

    await db.run(
      `UPDATE entidades SET estado = ? WHERE id = ?`,
      [estado ? true : false, id]
    )

    return res.json({
      ok: true
    })

  } catch (err) {

    console.error('Error actualizando estado entidad:', err)

    return res.status(500).json({
      ok: false,
      error: 'Error actualizando estado'
    })
  }

})

export default router