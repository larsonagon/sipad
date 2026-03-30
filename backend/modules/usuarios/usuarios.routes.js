// backend/modules/usuarios/usuarios.routes.js
// SIPAD – Módulo Usuarios Institucional (Cargo y Nivel obligatorio real)
// 🔒 MULTI-TENANT HARDENED (SIN ROMPER ESTRUCTURA ORIGINAL)

import express from 'express'
import bcrypt from 'bcrypt'
import crypto from 'crypto'
import { db } from '../../db/database.js'
import { verificarJWT } from '../../middlewares/auth.middleware.js'
import { requireLevel } from '../../middlewares/role.middleware.js'

const router = express.Router()

// =====================================================
// HELPERS
// =====================================================

async function registrarAuditoria(actorId, usuarioId, accion, detalle) {
  await db.run(
    `
    INSERT INTO auditoria_usuarios
    (actor_id, usuario_afectado_id, accion, detalle_json)
    VALUES (?, ?, ?, ?)
    `,
    [actorId, usuarioId, accion, JSON.stringify(detalle)]
  )
}

async function obtenerNivelRol(idRol, entidadId) {
  const row = await db.get(
    `SELECT nivel_acceso FROM roles WHERE id = ? AND entidad_id = ?`,
    [idRol, entidadId]
  )
  return row?.nivel_acceso ?? null
}

async function validarCargo(idCargo, entidadId) {
  const row = await db.get(
    `SELECT id FROM cargos WHERE id = ? AND estado = 1 AND entidad_id = ?`,
    [idCargo, entidadId]
  )
  return !!row
}

async function validarNivel(idNivel, entidadId) {
  const row = await db.get(
    `SELECT id FROM niveles WHERE id = ? AND estado = 1 AND entidad_id = ?`,
    [idNivel, entidadId]
  )
  return !!row
}

async function validarDependencia(idDependencia, entidadId) {
  const row = await db.get(
    `SELECT id FROM dependencias WHERE id = ? AND entidad_id = ?`,
    [idDependencia, entidadId]
  )
  return !!row
}

async function validarRol(idRol, entidadId) {
  const row = await db.get(
    `SELECT id FROM roles WHERE id = ? AND entidad_id = ?`,
    [idRol, entidadId]
  )
  return !!row
}

// =====================================================
// GENERAR PASSWORD TEMPORAL
// =====================================================

function generarPasswordTemporal() {
  return crypto.randomBytes(4).toString('hex')
}

// =====================================================
// CAMBIAR PASSWORD
// =====================================================

router.put(
  '/cambiar-password',
  verificarJWT,
  async (req, res) => {

    try {

      const usuarioId = parseInt(req.user.sub)
      const entidadId = req.user.entidad_id

      const password_actual =
        req.body.password_actual ?? req.body.passwordActual

      const password_nueva =
        req.body.password_nueva ?? req.body.passwordNueva

      if (!password_actual || !password_nueva) {
        return res.status(400).json({
          error: 'Debe indicar la contraseña actual y la nueva'
        })
      }

      if (password_nueva.length < 8) {
        return res.status(400).json({
          error: 'La nueva contraseña debe tener mínimo 8 caracteres'
        })
      }

      const usuario = await db.get(
        `
        SELECT password_hash
        FROM usuarios
        WHERE id = ? AND entidad_id = ?
        `,
        [usuarioId, entidadId]
      )

      if (!usuario) {
        return res.status(404).json({
          error: 'Usuario no encontrado'
        })
      }

      const passwordValida = await bcrypt.compare(
        password_actual,
        usuario.password_hash
      )

      if (!passwordValida) {
        return res.status(400).json({
          error: 'La contraseña actual es incorrecta'
        })
      }

      const nuevoHash = await bcrypt.hash(password_nueva, 10)

      await db.run(
        `
        UPDATE usuarios
        SET password_hash = ?
        WHERE id = ? AND entidad_id = ?
        `,
        [nuevoHash, usuarioId, entidadId]
      )

      await registrarAuditoria(
        usuarioId,
        usuarioId,
        'CAMBIAR_PASSWORD',
        { self_service: true }
      )

      res.json({
        ok: true,
        mensaje: 'Contraseña actualizada correctamente'
      })

    } catch (err) {

      console.error('Error cambiando contraseña:', err)

      res.status(500).json({
        error: 'Error cambiando contraseña'
      })

    }

  }
)

// =====================================================
// LISTAR USUARIOS
// =====================================================

router.get(
  '/',
  verificarJWT,
  requireLevel(80),
  async (req, res) => {

    try {

      const entidad = req.user.entidad_id
      const dependencia = req.query.dependencia

      let query = `
        SELECT
          u.id,
          u.nombre_completo,
          u.username,
          u.email,
          r.nombre AS rol,
          r.nivel_acceso,
          c.nombre AS cargo,
          n.nombre AS nivel,
          d.nombre AS dependencia,
          u.id_dependencia,
          u.estado,
          u.bloqueado,
          u.created_at
        FROM usuarios u
        JOIN roles r ON r.id = u.id_rol AND r.entidad_id = u.entidad_id
        JOIN dependencias d ON d.id = u.id_dependencia AND d.entidad_id = u.entidad_id
        LEFT JOIN cargos c ON c.id = u.id_cargo AND c.entidad_id = u.entidad_id
        LEFT JOIN niveles n ON n.id = u.id_nivel AND n.entidad_id = u.entidad_id
        WHERE 1=1
      `

      const params = []

      if (!req.isMasterAdmin) {
        query += ` AND u.entidad_id = ?`
        params.push(entidad)
      }

      if (dependencia !== undefined && dependencia !== '') {
        query += ` AND u.id_dependencia = ?`
        params.push(parseInt(dependencia))
      }

      query += ` ORDER BY u.nombre_completo ASC`

      const rows = await db.all(query, params)

      res.json({
        success: true,
        data: rows
      })

    } catch (error) {

      console.error('Error listando usuarios:', error)

      res.status(500).json({
        error: 'Error al obtener usuarios'
      })

    }

  }
)

// =====================================================
// OBTENER USUARIO POR ID
// =====================================================

router.get(
  '/:id',
  verificarJWT,
  requireLevel(80),
  async (req, res) => {

    try {

      const id = parseInt(req.params.id)
      const entidadId = req.user.entidad_id

      const usuario = await db.get(
        `
        SELECT
          id,
          nombre_completo,
          documento,
          username,
          email,
          id_dependencia,
          id_rol,
          id_cargo,
          id_nivel,
          estado,
          bloqueado
        FROM usuarios
        WHERE id = ? AND entidad_id = ?
        `,
        [id, entidadId]
      )

      if (!usuario) {
        return res.status(404).json({
          error: 'Usuario no encontrado'
        })
      }

      res.json(usuario)

    } catch (error) {

      console.error('Error obteniendo usuario:', error)

      res.status(500).json({
        error: 'Error al obtener usuario'
      })

    }

  }
)

// =====================================================
// CREAR USUARIO
// =====================================================

router.post(
  '/',
  verificarJWT,
  requireLevel(80),
  async (req, res) => {

    try {

      const actorId = parseInt(req.user.sub)
      const actorNivel = req.user.nivel_acceso
      const entidad = req.user.entidad_id

      const {
        nombre_completo,
        documento,
        email,
        username,
        password,
        id_dependencia,
        id_rol,
        id_cargo,
        id_nivel
      } = req.body

      if (!nombre_completo || !email || !username || !password)
        return res.status(400).json({ error: 'Datos obligatorios incompletos' })

      if (!id_dependencia || !id_rol || !id_cargo || !id_nivel)
        return res.status(400).json({ error: 'Dependencia, rol, cargo y nivel son obligatorios' })

      if (password.length < 8)
        return res.status(400).json({ error: 'La contraseña debe tener mínimo 8 caracteres' })

      // 🔒 DUPLICADOS
      const existe = await db.get(
        `SELECT id FROM usuarios WHERE (email = ? OR username = ?) AND entidad_id = ?`,
        [email, username, entidad]
      )

      if (existe)
        return res.status(400).json({ error: 'Usuario o email ya existe en esta entidad' })

      if (!(await validarDependencia(id_dependencia, entidad)))
        return res.status(400).json({ error: 'Dependencia inválida' })

      if (!(await validarRol(id_rol, entidad)))
        return res.status(400).json({ error: 'Rol inválido' })

      if (!(await validarCargo(id_cargo, entidad)))
        return res.status(400).json({ error: 'Cargo inválido o inactivo' })

      if (!(await validarNivel(id_nivel, entidad)))
        return res.status(400).json({ error: 'Nivel inválido o inactivo' })

      const nivelNuevoRol = await obtenerNivelRol(id_rol, entidad)

      if (!req.isMasterAdmin &&
          actorNivel !== 100 &&
          nivelNuevoRol >= actorNivel) {

        return res.status(403).json({
          error: 'No puedes crear un usuario con nivel igual o superior al tuyo'
        })

      }

      const passwordHash = await bcrypt.hash(password, 10)

      const result = await db.run(`
        INSERT INTO usuarios
        (
          nombre_completo,
          documento,
          email,
          username,
          password_hash,
          id_dependencia,
          id_rol,
          id_cargo,
          id_nivel,
          entidad_id
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `,
      [
        nombre_completo,
        documento,
        email,
        username,
        passwordHash,
        id_dependencia,
        id_rol,
        id_cargo,
        id_nivel,
        entidad
      ])

      await registrarAuditoria(actorId, result.lastID, 'CREAR_USUARIO', {
        username,
        id_rol,
        id_dependencia,
        id_cargo,
        id_nivel
      })

      res.status(201).json({ ok: true })

    } catch (err) {

      console.error('Error creando usuario:', err)

      res.status(500).json({
        error: 'Error creando usuario'
      })

    }

  }
)

// =====================================================
// EDITAR USUARIO
// =====================================================

router.put(
  '/:id',
  verificarJWT,
  requireLevel(80),
  async (req, res) => {

    try {

      const actorId = parseInt(req.user.sub)
      const actorNivel = req.user.nivel_acceso
      const id = parseInt(req.params.id)
      const entidadId = req.user.entidad_id

      const usuarioExiste = await db.get(
        `SELECT id FROM usuarios WHERE id = ? AND entidad_id = ?`,
        [id, entidadId]
      )

      if (!usuarioExiste) {
        return res.status(404).json({
          error: 'Usuario no pertenece a esta entidad'
        })
      }

      const {
        email,
        id_dependencia,
        id_rol,
        id_cargo,
        id_nivel,
        estado,
        bloqueado,
        password
      } = req.body

      if (!email)
        return res.status(400).json({ error: 'Email requerido' })

      if (!(await validarDependencia(id_dependencia, entidadId)))
        return res.status(400).json({ error: 'Dependencia inválida' })

      if (!(await validarRol(id_rol, entidadId)))
        return res.status(400).json({ error: 'Rol inválido' })

      if (!(await validarCargo(id_cargo, entidadId)))
        return res.status(400).json({ error: 'Cargo inválido' })

      if (!(await validarNivel(id_nivel, entidadId)))
        return res.status(400).json({ error: 'Nivel inválido' })

      const nivelNuevoRol = await obtenerNivelRol(id_rol, entidadId)

      if (!req.isMasterAdmin &&
          actorNivel !== 100 &&
          nivelNuevoRol >= actorNivel) {

        return res.status(403).json({
          error: 'No puedes asignar un rol igual o superior al tuyo'
        })

      }

      let passwordHash = null

      if (password && password.trim() !== '') {

        if (password.length < 8)
          return res.status(400).json({
            error: 'La contraseña debe tener mínimo 8 caracteres'
          })

        passwordHash = await bcrypt.hash(password, 10)

      }

      if (passwordHash) {

        await db.run(`
          UPDATE usuarios
          SET
            email = ?,
            id_dependencia = ?,
            id_rol = ?,
            id_cargo = ?,
            id_nivel = ?,
            estado = ?,
            bloqueado = ?,
            password_hash = ?
          WHERE id = ? AND entidad_id = ?
        `,
        [
          email,
          id_dependencia,
          id_rol,
          id_cargo,
          id_nivel,
          estado,
          bloqueado,
          passwordHash,
          id,
          entidadId
        ])

      } else {

        await db.run(`
          UPDATE usuarios
          SET
            email = ?,
            id_dependencia = ?,
            id_rol = ?,
            id_cargo = ?,
            id_nivel = ?,
            estado = ?,
            bloqueado = ?
          WHERE id = ? AND entidad_id = ?
        `,
        [
          email,
          id_dependencia,
          id_rol,
          id_cargo,
          id_nivel,
          estado,
          bloqueado,
          id,
          entidadId
        ])

      }

      await registrarAuditoria(actorId, id, 'EDITAR_USUARIO', {
        email,
        id_dependencia,
        id_rol,
        id_cargo,
        id_nivel,
        estado,
        bloqueado,
        password_cambiado: !!passwordHash
      })

      res.json({ ok: true })

    } catch (err) {

      console.error('Error actualizando usuario:', err)

      res.status(500).json({
        error: 'Error actualizando usuario'
      })

    }

  }
)

// =====================================================
// RESET PASSWORD ADMINISTRATIVO
// =====================================================

router.post(
  '/:id/reset-password',
  verificarJWT,
  requireLevel(80),
  async (req, res) => {

    try {

      const actorId = parseInt(req.user.sub)
      const id = parseInt(req.params.id)
      const entidadId = req.user.entidad_id

      const usuarioExiste = await db.get(
        `SELECT id FROM usuarios WHERE id = ? AND entidad_id = ?`,
        [id, entidadId]
      )

      if (!usuarioExiste) {
        return res.status(404).json({
          error: 'Usuario no pertenece a esta entidad'
        })
      }

      const nuevaPassword = generarPasswordTemporal()
      const hash = await bcrypt.hash(nuevaPassword, 10)

      await db.run(
        `
        UPDATE usuarios
        SET password_hash = ?, bloqueado = 0
        WHERE id = ? AND entidad_id = ?
        `,
        [hash, id, entidadId]
      )

      await registrarAuditoria(actorId, id, 'RESET_PASSWORD', {
        generado_por_admin: true
      })

      res.json({
        ok: true,
        password_temporal: nuevaPassword
      })

    } catch (err) {

      console.error('Error reset password:', err)

      res.status(500).json({
        error: 'Error reseteando contraseña'
      })

    }

  }
)

console.log('🔥 USUARIOS ROUTES (CARGO Y NIVEL OBLIGATORIO REAL) CARGADO')

export default router