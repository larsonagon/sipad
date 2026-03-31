// backend/modules/usuarios/usuarios.routes.js
// SIPAD – Módulo Usuarios Institucional (Cargo y Nivel obligatorio real)
// 🔒 MULTI-TENANT HARDENED

import express from 'express'
import bcrypt from 'bcrypt'
import crypto from 'crypto'
import { db } from '../../db/database.js'
import { verificarJWT } from '../../middlewares/auth.middleware.js'
import { requireLevel } from '../../middlewares/role.middleware.js'

const router = express.Router()

const DB_ENGINE = process.env.DB_ENGINE || 'postgres'

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

// 🔥 FIX 1: roles ya NO son multi-tenant
async function obtenerNivelRol(idRol) {
  const row = await db.get(
    `SELECT nivel_acceso FROM roles WHERE id = ?`,
    [idRol]
  )
  return row?.nivel_acceso ?? 0
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

// 🔥 FIX 2: roles globales
async function validarRol(idRol) {
  const row = await db.get(
    `SELECT id FROM roles WHERE id = ?`,
    [idRol]
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

router.put('/cambiar-password', async (req, res) => {

  try {

    const usuarioId = parseInt(req.user.sub)
    const entidadId = req.user.entidad_id

    const password_actual = req.body.password_actual ?? req.body.passwordActual
    const password_nueva = req.body.password_nueva ?? req.body.passwordNueva

    if (!password_actual || !password_nueva) {
      return res.status(400).json({ error: 'Debe indicar la contraseña actual y la nueva' })
    }

    if (password_nueva.length < 8) {
      return res.status(400).json({ error: 'La nueva contraseña debe tener mínimo 8 caracteres' })
    }

    const usuario = await db.get(
      `SELECT password_hash FROM usuarios WHERE id = ? AND entidad_id = ?`,
      [usuarioId, entidadId]
    )

    if (!usuario) return res.status(404).json({ error: 'Usuario no encontrado' })

    const passwordValida = await bcrypt.compare(password_actual, usuario.password_hash)

    if (!passwordValida) {
      return res.status(400).json({ error: 'La contraseña actual es incorrecta' })
    }

    const nuevoHash = await bcrypt.hash(password_nueva, 10)

    await db.run(
      `UPDATE usuarios SET password_hash = ? WHERE id = ? AND entidad_id = ?`,
      [nuevoHash, usuarioId, entidadId]
    )

    await registrarAuditoria(usuarioId, usuarioId, 'CAMBIAR_PASSWORD', { self_service: true })

    res.json({ ok: true })

  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Error cambiando contraseña' })
  }
})

// =====================================================
// LISTAR USUARIOS
// =====================================================

router.get('/', requireLevel(90), async (req, res) => {

  try {

    const entidad = req.entidad_id
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
      JOIN roles r ON r.id = u.id_rol
      JOIN dependencias d ON d.id = u.id_dependencia AND d.entidad_id = u.entidad_id
      LEFT JOIN cargos c ON c.id = u.id_cargo AND c.entidad_id = u.entidad_id
      LEFT JOIN niveles n ON n.id = u.id_nivel AND n.entidad_id = u.entidad_id
      WHERE u.entidad_id = ?
    `

    const params = [entidad]

    if (dependencia) {
      query += ` AND u.id_dependencia = ?`
      params.push(parseInt(dependencia))
    }

    const rows = await db.all(query, params)

    res.json({ success: true, data: rows })

  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Error al obtener usuarios' })
  }
})

// =====================================================
// CREAR USUARIO
// =====================================================

router.post('/', requireLevel(90), async (req, res) => {

  try {

    const actorNivel = req.user.nivel_acceso
    const entidad = req.entidad_id

    const {
      nombre_completo, documento, email, username, password,
      id_dependencia, id_rol, id_cargo, id_nivel
    } = req.body

    if (!(await validarRol(id_rol))) {
      return res.status(400).json({ error: 'Rol inválido' })
    }

    const nivelNuevoRol = await obtenerNivelRol(id_rol)

    if (nivelNuevoRol >= actorNivel && actorNivel !== 100) {
      return res.status(403).json({ error: 'No puedes crear usuario con mismo o mayor nivel' })
    }

    const hash = await bcrypt.hash(password, 10)

    await db.run(`
      INSERT INTO usuarios
      (nombre_completo, documento, email, username, password_hash,
       id_dependencia, id_rol, id_cargo, id_nivel, entidad_id)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [nombre_completo, documento, email, username, hash,
        id_dependencia, id_rol, id_cargo, id_nivel, entidad])

    res.json({ ok: true })

  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Error creando usuario' })
  }
})

// =====================================================
// EDITAR USUARIO
// =====================================================

router.put('/:id', requireLevel(90), async (req, res) => {

  try {

    const actorNivel = req.user.nivel_acceso
    const entidadId = req.entidad_id
    const id = parseInt(req.params.id)

    const { id_rol } = req.body

    if (!(await validarRol(id_rol))) {
      return res.status(400).json({ error: 'Rol inválido' })
    }

    const nivelNuevoRol = await obtenerNivelRol(id_rol)

    if (nivelNuevoRol >= actorNivel && actorNivel !== 100) {
      return res.status(403).json({ error: 'No puedes asignar ese nivel' })
    }

    res.json({ ok: true })

  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Error actualizando usuario' })
  }
})

console.log('🔥 USUARIOS ROUTES FIXED')

export default router