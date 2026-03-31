import express from 'express'
import { db } from '../../db/database.js'
import { verificarJWT } from '../../middlewares/auth.middleware.js'
import { requireLevel, attachPermissions } from '../../middlewares/role.middleware.js'

const router = express.Router()

const DB_ENGINE = process.env.DB_ENGINE || 'postgres'

// =====================================================
// HELPERS
// =====================================================

async function registrarAuditoria(actorId, rolId, accion, detalle) {

  if (!rolId) {
    console.warn('⚠️ Auditoría cancelada: rolId null')
    return
  }

  try {

    await db.run(
      `
      INSERT INTO auditoria_roles
      (actor_id, rol_afectado_id, accion, detalle_json)
      VALUES (?, ?, ?, ?)
      `,
      [actorId, rolId, accion, JSON.stringify(detalle || {})]
    )

  } catch (err) {
    console.error('⚠️ Error registrando auditoría:', err)
  }

}

async function contarRolesNivel100(entidadId) {

  const row = await db.get(`
    SELECT COUNT(*) as total
    FROM roles
    WHERE nivel_acceso = 100
      AND activo = 1
      AND entidad_id = ?
  `, [entidadId])

  return row?.total ?? 0

}

// =====================================================
// LISTAR ROLES
// =====================================================

router.get(
  '/',
  requireLevel(80),
  attachPermissions, // 🔥 NUEVO (no rompe nada)
  async (req, res) => {

    try {

      const entidadId = req.entidad_id

      if (!entidadId) {
        return res.status(401).json({ error: 'Entidad no definida en el token' })
      }

      const roles = await db.all(`
        SELECT id, nombre, descripcion, nivel_acceso, activo, created_at
        FROM roles
        WHERE entidad_id = ?
        ORDER BY nivel_acceso DESC
      `, [entidadId])

      res.json(roles)

    } catch (err) {
      console.error(err)
      res.status(500).json({ error: 'Error listando roles' })
    }

  }
)

// =====================================================
// CREAR ROL
// =====================================================

router.post(
  '/',
  requireLevel(100),
  attachPermissions, // 🔥 NUEVO
  async (req, res) => {

    try {

      const actorId = parseInt(req.user.sub)
      const actorNivel = req.user.nivel_acceso
      const entidadId = req.entidad_id

      const { nombre, descripcion } = req.body

      if (!entidadId) {
        return res.status(401).json({ error: 'Entidad no definida en el token' })
      }

      if (!nombre || !nombre.trim()) {
        return res.status(400).json({ error: 'Nombre requerido' })
      }

      const nivel = 50

      if (nivel > actorNivel) {
        return res.status(403).json({
          error: 'No puedes crear un rol superior a tu nivel'
        })
      }

      const nombreLimpio = nombre.trim()

      const existeNombre = await db.get(
        `SELECT id FROM roles WHERE nombre = ? AND entidad_id = ?`,
        [nombreLimpio, entidadId]
      )

      if (existeNombre) {
        return res.status(400).json({
          error: 'Ya existe un rol con ese nombre en esta entidad'
        })
      }

      let nuevoRolId

      if (DB_ENGINE === 'postgres') {

        const result = await db.get(
          `
          INSERT INTO roles (nombre, descripcion, nivel_acceso, activo, entidad_id)
          VALUES (?, ?, ?, 1, ?)
          RETURNING id
          `,
          [nombreLimpio, descripcion || null, nivel, entidadId]
        )

        nuevoRolId = result?.id ?? null

      } else {

        const result = await db.run(
          `
          INSERT INTO roles (nombre, descripcion, nivel_acceso, activo, entidad_id)
          VALUES (?, ?, ?, 1, ?)
          `,
          [nombreLimpio, descripcion || null, nivel, entidadId]
        )

        nuevoRolId = result?.lastID ?? null

      }

      await registrarAuditoria(
        actorId,
        nuevoRolId,
        'CREAR_ROL',
        { nombre: nombreLimpio, nivel_acceso: nivel }
      )

      res.status(201).json({ ok: true })

    } catch (err) {
      console.error(err)
      res.status(500).json({ error: 'Error creando rol' })
    }

  }
)

// =====================================================
// EDITAR ROL
// =====================================================

router.patch(
  '/:id',
  requireLevel(100),
  attachPermissions, // 🔥 NUEVO
  async (req, res) => {

    try {

      const actorId = parseInt(req.user.sub)
      const actorNivel = req.user.nivel_acceso
      const entidadId = req.entidad_id
      const id = parseInt(req.params.id)

      const { nombre, descripcion, nivel_acceso } = req.body

      if (!entidadId) {
        return res.status(401).json({ error: 'Entidad no definida en el token' })
      }

      const rol = await db.get(
        `SELECT * FROM roles WHERE id = ? AND entidad_id = ?`,
        [id, entidadId]
      )

      if (!rol) {
        return res.status(404).json({ error: 'Rol no encontrado en esta entidad' })
      }

      const nivelNuevo = nivel_acceso ?? rol.nivel_acceso

      if (rol.nivel_acceso === 100) {

        const total = await contarRolesNivel100(entidadId)

        if (total <= 1 && nivelNuevo !== 100) {
          return res.status(400).json({
            error: 'No puedes degradar el último rol nivel 100'
          })
        }

      }

      if (nivelNuevo > actorNivel) {
        return res.status(403).json({
          error: 'No puedes asignar nivel superior al tuyo'
        })
      }

      const nombreLimpio = nombre ? nombre.trim() : rol.nombre

      if (nombre) {
        const existe = await db.get(
          `SELECT id FROM roles WHERE nombre = ? AND id != ? AND entidad_id = ?`,
          [nombreLimpio, id, entidadId]
        )

        if (existe) {
          return res.status(400).json({
            error: 'Ya existe otro rol con ese nombre en esta entidad'
          })
        }
      }

      await db.run(
        `
        UPDATE roles
        SET nombre = ?, descripcion = ?, nivel_acceso = ?
        WHERE id = ? AND entidad_id = ?
        `,
        [nombreLimpio, descripcion ?? rol.descripcion, nivelNuevo, id, entidadId]
      )

      await registrarAuditoria(
        actorId,
        id,
        'EDITAR_ROL',
        { nombre: nombreLimpio, nivel_acceso: nivelNuevo }
      )

      res.json({ ok: true })

    } catch (err) {
      console.error(err)
      res.status(500).json({ error: 'Error editando rol' })
    }

  }
)

// =====================================================
// ACTIVAR / DESACTIVAR
// =====================================================

router.patch(
  '/:id/estado',
  requireLevel(100),
  attachPermissions, // 🔥 NUEVO
  async (req, res) => {

    try {

      const actorId = parseInt(req.user.sub)
      const entidadId = req.entidad_id
      const id = parseInt(req.params.id)
      const { activo } = req.body

      if (!entidadId) {
        return res.status(401).json({ error: 'Entidad no definida en el token' })
      }

      const rol = await db.get(
        `SELECT * FROM roles WHERE id = ? AND entidad_id = ?`,
        [id, entidadId]
      )

      if (!rol) {
        return res.status(404).json({ error: 'Rol no encontrado en esta entidad' })
      }

      if (rol.nivel_acceso === 100 && !activo) {

        const total = await contarRolesNivel100(entidadId)

        if (total <= 1) {
          return res.status(400).json({
            error: 'No puedes desactivar el último rol nivel 100'
          })
        }

      }

      const usuariosActivos = await db.get(
        `
        SELECT COUNT(*) as total
        FROM usuarios
        WHERE id_rol = ? AND estado = 1 AND entidad_id = ?
        `,
        [id, entidadId]
      )

      if (usuariosActivos?.total > 0 && !activo) {
        return res.status(400).json({
          error: 'No puedes desactivar un rol con usuarios activos'
        })
      }

      await db.run(
        `UPDATE roles SET activo = ? WHERE id = ? AND entidad_id = ?`,
        [activo ? 1 : 0, id, entidadId]
      )

      await registrarAuditoria(
        actorId,
        id,
        activo ? 'ACTIVAR_ROL' : 'DESACTIVAR_ROL',
        {}
      )

      res.json({ ok: true })

    } catch (err) {
      console.error(err)
      res.status(500).json({ error: 'Error actualizando estado del rol' })
    }

  }
)

console.log('🔥 ROLES ROUTES CARGADO (MULTI-TENANT SEGURO)')

export default router