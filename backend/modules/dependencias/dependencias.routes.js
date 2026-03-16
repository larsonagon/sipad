import express from 'express'
import { db } from '../../db/database.js'
import { verificarJWT } from '../../middlewares/auth.middleware.js'
import { requireLevel } from '../../middlewares/role.middleware.js'

const router = express.Router()

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
// 🔹 Todos los usuarios institucionales pueden ver dependencias

router.get(
  '/',
  verificarJWT,
  requireLevel(50),
  async (req, res) => {

    try {

      const rows = await db.all(`
        SELECT id, nombre, activa, created_at
        FROM dependencias
        ORDER BY created_at ASC
      `)

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
// 🔹 Solo administración institucional

router.post(
  '/',
  verificarJWT,
  requireLevel(100),
  async (req, res) => {

    try {

      const actorId = Number(req.user.sub)
      const { nombre } = req.body

      if (!nombre || !nombre.trim()) {
        return res.status(400).json({ error: 'Nombre requerido' })
      }

      const nombreLimpio = nombre.trim()

      const existe = await db.get(
        `SELECT id FROM dependencias WHERE nombre = ?`,
        [nombreLimpio]
      )

      if (existe) {
        return res.status(400).json({
          error: 'Ya existe una dependencia con ese nombre'
        })
      }

      const result = await db.get(
        `
        INSERT INTO dependencias (nombre, activa)
        VALUES (?, 1)
        RETURNING id
        `,
        [nombreLimpio]
      )

      const nuevaDependenciaId = result?.id ?? null

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
  verificarJWT,
  requireLevel(100),
  async (req, res) => {

    try {

      const actorId = Number(req.user.sub)
      const id = Number(req.params.id)
      const { nombre } = req.body

      if (!nombre || !nombre.trim()) {
        return res.status(400).json({ error: 'Nombre requerido' })
      }

      const nombreLimpio = nombre.trim()

      const existe = await db.get(
        `SELECT id FROM dependencias WHERE nombre = ? AND id != ?`,
        [nombreLimpio, id]
      )

      if (existe) {
        return res.status(400).json({
          error: 'Ya existe otra dependencia con ese nombre'
        })
      }

      await db.run(
        `UPDATE dependencias SET nombre = ? WHERE id = ?`,
        [nombreLimpio, id]
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
  verificarJWT,
  requireLevel(100),
  async (req, res) => {

    try {

      const actorId = Number(req.user.sub)
      const id = Number(req.params.id)
      const { activa } = req.body

      if (activa === 0) {

        const usuariosActivos = await db.get(
          `
          SELECT COUNT(*) as total
          FROM usuarios
          WHERE id_dependencia = ? AND estado = 1
          `,
          [id]
        )

        if (usuariosActivos?.total > 0) {
          return res.status(400).json({
            error: 'No puedes desactivar una dependencia con usuarios activos'
          })
        }

      }

      await db.run(
        `UPDATE dependencias SET activa = ? WHERE id = ?`,
        [activa ? 1 : 0, id]
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

console.log('🔥 DEPENDENCIAS ROUTES CARGADO')

export default router