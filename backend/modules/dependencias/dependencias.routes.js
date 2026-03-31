import express from 'express'
import { db } from '../../db/database.js'
import { verificarJWT } from '../../middlewares/auth.middleware.js'
import { requireLevel } from '../../middlewares/role.middleware.js'

const router = express.Router()

const DB_ENGINE = process.env.DB_ENGINE || 'postgres'

// =====================================================
// HELPERS
// =====================================================

async function registrarAuditoria(actorId, dependenciaId, accion, detalle) {

  if (!dependenciaId) {
    console.warn('⚠️ Auditoría cancelada: dependenciaId null')
    return
  }

  try {

    await db.run(
      `
      INSERT INTO auditoria_dependencias
      (actor_id, dependencia_afectada_id, accion, detalle_json)
      VALUES (?, ?, ?, ?)
      `,
      [
        actorId,
        dependenciaId,
        accion,
        JSON.stringify(detalle || {})
      ]
    )

  } catch (err) {

    console.error('⚠️ Error registrando auditoría:', err)

  }

}

// =====================================================
// LISTAR DEPENDENCIAS
// =====================================================

router.get(
  '/',
  requireLevel(50),
  async (req, res) => {

    try {

      const entidadId = req.entidad_id

      if (!entidadId) {
        return res.status(401).json({ error: 'Entidad no definida en el token' })
      }

      const rows = await db.all(`
        SELECT id, nombre, activa, created_at
        FROM dependencias
        WHERE entidad_id = ?
        ORDER BY created_at ASC
      `, [entidadId])

      res.json(rows)

    } catch (err) {

      console.error(err)
      res.status(500).json({ error: 'Error listando dependencias' })

    }

  }
)

// =====================================================
// CREAR DEPENDENCIA
// =====================================================

router.post(
  '/',
  requireLevel(90),
  async (req, res) => {

    try {

      const actorId = Number(req.user.sub)
      const entidadId = req.entidad_id
      const { nombre } = req.body

      if (!entidadId) {
        return res.status(401).json({ error: 'Entidad no definida en el token' })
      }

      if (!nombre || !nombre.trim()) {
        return res.status(400).json({ error: 'Nombre requerido' })
      }

      const nombreLimpio = nombre.trim()

      const existe = await db.get(
        `SELECT id FROM dependencias WHERE nombre = ? AND entidad_id = ?`,
        [nombreLimpio, entidadId]
      )

      if (existe) {
        return res.status(400).json({
          error: 'Ya existe una dependencia con ese nombre en esta entidad'
        })
      }

      let nuevaDependenciaId

      if (DB_ENGINE === 'postgres') {

        const result = await db.get(
          `INSERT INTO dependencias (nombre, activa, entidad_id) VALUES (?, 1, ?) RETURNING id`,
          [nombreLimpio, entidadId]
        )

        nuevaDependenciaId = result?.id ?? null

      } else {

        const result = await db.run(
          `INSERT INTO dependencias (nombre, activa, entidad_id) VALUES (?, 1, ?)`,
          [nombreLimpio, entidadId]
        )

        nuevaDependenciaId = result?.lastID ?? null

      }

      if (!nuevaDependenciaId) {

        console.error('❌ No se pudo obtener el ID de la dependencia creada')

        return res.status(500).json({
          error: 'Error creando dependencia'
        })

      }

      await registrarAuditoria(
        actorId,
        nuevaDependenciaId,
        'CREAR_DEPENDENCIA',
        { nombre: nombreLimpio }
      )

      res.status(201).json({ ok: true })

    } catch (err) {

      console.error(err)
      res.status(500).json({ error: 'Error creando dependencia' })

    }

  }
)

// =====================================================
// EDITAR DEPENDENCIA
// =====================================================

router.patch(
  '/:id',
  requireLevel(90),
  async (req, res) => {

    try {

      const actorId = Number(req.user.sub)
      const entidadId = req.entidad_id
      const id = Number(req.params.id)
      const { nombre } = req.body

      if (!entidadId) {
        return res.status(401).json({ error: 'Entidad no definida en el token' })
      }

      const dependencia = await db.get(
        `SELECT id FROM dependencias WHERE id = ? AND entidad_id = ?`,
        [id, entidadId]
      )

      if (!dependencia) {
        return res.status(404).json({
          error: 'Dependencia no pertenece a esta entidad'
        })
      }

      if (!nombre || !nombre.trim()) {
        return res.status(400).json({ error: 'Nombre requerido' })
      }

      const nombreLimpio = nombre.trim()

      const existe = await db.get(
        `SELECT id FROM dependencias WHERE nombre = ? AND id != ? AND entidad_id = ?`,
        [nombreLimpio, id, entidadId]
      )

      if (existe) {
        return res.status(400).json({
          error: 'Ya existe otra dependencia con ese nombre'
        })
      }

      await db.run(
        `UPDATE dependencias SET nombre = ? WHERE id = ? AND entidad_id = ?`,
        [nombreLimpio, id, entidadId]
      )

      await registrarAuditoria(
        actorId,
        id,
        'EDITAR_DEPENDENCIA',
        { nombre: nombreLimpio }
      )

      res.json({ ok: true })

    } catch (err) {

      console.error(err)
      res.status(500).json({ error: 'Error editando dependencia' })

    }

  }
)

// =====================================================
// ACTIVAR / DESACTIVAR DEPENDENCIA
// =====================================================

router.patch(
  '/:id/estado',
  requireLevel(100),
  async (req, res) => {

    try {

      const actorId = Number(req.user.sub)
      const entidadId = req.entidad_id
      const id = Number(req.params.id)
      const { activa } = req.body

      if (!entidadId) {
        return res.status(401).json({ error: 'Entidad no definida en el token' })
      }

      const dependencia = await db.get(
        `SELECT id FROM dependencias WHERE id = ? AND entidad_id = ?`,
        [id, entidadId]
      )

      if (!dependencia) {
        return res.status(404).json({
          error: 'Dependencia no pertenece a esta entidad'
        })
      }

      if (activa === 0) {

        const usuariosActivos = await db.get(
          `
          SELECT COUNT(*) as total
          FROM usuarios
          WHERE id_dependencia = ? AND estado = 1 AND entidad_id = ?
          `,
          [id, entidadId]
        )

        if (usuariosActivos?.total > 0) {
          return res.status(400).json({
            error: 'No puedes desactivar una dependencia con usuarios activos'
          })
        }

      }

      await db.run(
        `UPDATE dependencias SET activa = ? WHERE id = ? AND entidad_id = ?`,
        [activa ? 1 : 0, id, entidadId]
      )

      await registrarAuditoria(
        actorId,
        id,
        activa ? 'ACTIVAR_DEPENDENCIA' : 'DESACTIVAR_DEPENDENCIA',
        {}
      )

      res.json({ ok: true })

    } catch (err) {

      console.error(err)
      res.status(500).json({ error: 'Error actualizando dependencia' })

    }

  }
)

console.log('🔥 DEPENDENCIAS ROUTES CARGADO (MULTI-TENANT SEGURO)')

export default router