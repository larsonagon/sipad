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
// CAMBIAR PASSWORD (self-service)
// =====================================================

router.put('/cambiar-password', async (req, res) => {

  try {

    const usuarioId = parseInt(req.user.sub)
    const entidadId = req.user.entidad_id

    const password_actual = req.body.password_actual ?? req.body.passwordActual
    const password_nueva  = req.body.password_nueva  ?? req.body.passwordNueva

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

    const entidad    = req.entidad_id
    const dependencia = req.query.dependencia

    let query = `
      SELECT
        u.id,
        u.nombre_completo,
        u.username,
        u.email,
        u.documento,
        u.id_rol,
        u.id_dependencia,
        u.id_cargo,
        u.id_nivel,
        r.nombre       AS rol,
        r.nivel_acceso,
        c.nombre       AS cargo,
        n.nombre       AS nivel,
        d.nombre       AS dependencia,
        u.estado,
        u.bloqueado,
        u.created_at
      FROM usuarios u
      JOIN roles        r ON r.id = u.id_rol
      JOIN dependencias d ON d.id = u.id_dependencia AND d.entidad_id = u.entidad_id
      LEFT JOIN cargos  c ON c.id = u.id_cargo  AND c.entidad_id = u.entidad_id
      LEFT JOIN niveles n ON n.id = u.id_nivel  AND n.entidad_id = u.entidad_id
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
// ✅ NUEVO: OBTENER USUARIO POR ID
// =====================================================

router.get('/:id', requireLevel(90), async (req, res) => {

  try {

    const entidadId = req.entidad_id
    const id        = parseInt(req.params.id)

    const usuario = await db.get(
      `
      SELECT
        u.id,
        u.nombre_completo,
        u.username,
        u.email,
        u.documento,
        u.id_rol,
        u.id_dependencia,
        u.id_cargo,
        u.id_nivel,
        u.estado,
        u.bloqueado,
        r.nombre       AS rol,
        r.nivel_acceso,
        c.nombre       AS cargo,
        n.nombre       AS nivel,
        d.nombre       AS dependencia
      FROM usuarios u
      JOIN roles        r ON r.id = u.id_rol
      JOIN dependencias d ON d.id = u.id_dependencia AND d.entidad_id = u.entidad_id
      LEFT JOIN cargos  c ON c.id = u.id_cargo  AND c.entidad_id = u.entidad_id
      LEFT JOIN niveles n ON n.id = u.id_nivel  AND n.entidad_id = u.entidad_id
      WHERE u.id = ? AND u.entidad_id = ?
      `,
      [id, entidadId]
    )

    if (!usuario) {
      return res.status(404).json({ error: 'Usuario no encontrado' })
    }

    res.json({ success: true, data: usuario })

  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Error al obtener usuario' })
  }
})

// =====================================================
// CREAR USUARIO
// =====================================================

router.post('/', requireLevel(90), async (req, res) => {

  try {

    const actorNivel = req.user.nivel_acceso
    const entidad    = req.entidad_id

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
// ✅ CORREGIDO: EDITAR USUARIO (ahora sí actualiza la BD)
// =====================================================

router.put('/:id', requireLevel(90), async (req, res) => {

  try {

    const actorId    = parseInt(req.user.sub)
    const actorNivel = req.user.nivel_acceso
    const entidadId  = req.entidad_id
    const id         = parseInt(req.params.id)

    const {
      email, id_rol, id_dependencia, id_cargo, id_nivel,
      estado, bloqueado, password
    } = req.body

    // Verificar que el usuario pertenece a esta entidad
    const existente = await db.get(
      `SELECT id, id_rol FROM usuarios WHERE id = ? AND entidad_id = ?`,
      [id, entidadId]
    )

    if (!existente) {
      return res.status(404).json({ error: 'Usuario no encontrado' })
    }

    if (!(await validarRol(id_rol))) {
      return res.status(400).json({ error: 'Rol inválido' })
    }

    const nivelNuevoRol = await obtenerNivelRol(id_rol)

    if (nivelNuevoRol >= actorNivel && actorNivel !== 100) {
      return res.status(403).json({ error: 'No puedes asignar ese nivel de rol' })
    }

    // Construir campos a actualizar
    const campos = [
      'email = ?',
      'id_rol = ?',
      'id_dependencia = ?',
      'id_cargo = ?',
      'id_nivel = ?',
      'estado = ?',
      'bloqueado = ?'
    ]

    const valores = [
      email,
      id_rol,
      id_dependencia ?? null,
      id_cargo       ?? null,
      id_nivel       ?? null,
      estado  !== undefined ? estado  : existente.estado,
      bloqueado !== undefined ? bloqueado : existente.bloqueado
    ]

    // Si viene nueva contraseña, actualizarla también
    if (password && password.trim() !== '') {
      if (password.length < 8) {
        return res.status(400).json({ error: 'La contraseña debe tener mínimo 8 caracteres' })
      }
      const nuevoHash = await bcrypt.hash(password, 10)
      campos.push('password_hash = ?')
      valores.push(nuevoHash)
    }

    valores.push(id, entidadId)

    await db.run(
      `UPDATE usuarios SET ${campos.join(', ')} WHERE id = ? AND entidad_id = ?`,
      valores
    )

    await registrarAuditoria(actorId, id, 'EDITAR_USUARIO', { email, id_rol, estado, bloqueado })

    res.json({ ok: true })

  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Error actualizando usuario' })
  }
})

// =====================================================
// ✅ NUEVO: RESET PASSWORD
// =====================================================

router.post('/:id/reset-password', requireLevel(90), async (req, res) => {

  try {

    const actorId   = parseInt(req.user.sub)
    const entidadId = req.entidad_id
    const id        = parseInt(req.params.id)

    const usuario = await db.get(
      `SELECT id FROM usuarios WHERE id = ? AND entidad_id = ?`,
      [id, entidadId]
    )

    if (!usuario) return res.status(404).json({ error: 'Usuario no encontrado' })

    const passwordTemporal = generarPasswordTemporal()
    const hash = await bcrypt.hash(passwordTemporal, 10)

    await db.run(
      `UPDATE usuarios SET password_hash = ? WHERE id = ? AND entidad_id = ?`,
      [hash, id, entidadId]
    )

    await registrarAuditoria(actorId, id, 'RESET_PASSWORD', {})

    res.json({ ok: true, password_temporal: passwordTemporal })

  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Error reseteando contraseña' })
  }
})

// =====================================================
// ✅ NUEVO: TOGGLE ESTADO (activar / desactivar)
// =====================================================

router.put('/:id/estado', requireLevel(90), async (req, res) => {

  try {

    const actorId   = parseInt(req.user.sub)
    const entidadId = req.entidad_id
    const id        = parseInt(req.params.id)

    const usuario = await db.get(
      `SELECT id, estado FROM usuarios WHERE id = ? AND entidad_id = ?`,
      [id, entidadId]
    )

    if (!usuario) return res.status(404).json({ error: 'Usuario no encontrado' })

    const nuevoEstado = usuario.estado === 1 ? 0 : 1

    await db.run(
      `UPDATE usuarios SET estado = ? WHERE id = ? AND entidad_id = ?`,
      [nuevoEstado, id, entidadId]
    )

    await registrarAuditoria(actorId, id, nuevoEstado === 1 ? 'ACTIVAR' : 'DESACTIVAR', {})

    res.json({ ok: true, estado: nuevoEstado })

  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Error cambiando estado' })
  }
})

// =====================================================
// ✅ NUEVO: TOGGLE BLOQUEO (bloquear / desbloquear)
// =====================================================

router.put('/:id/bloqueo', requireLevel(90), async (req, res) => {

  try {

    const actorId   = parseInt(req.user.sub)
    const entidadId = req.entidad_id
    const id        = parseInt(req.params.id)

    const usuario = await db.get(
      `SELECT id, bloqueado FROM usuarios WHERE id = ? AND entidad_id = ?`,
      [id, entidadId]
    )

    if (!usuario) return res.status(404).json({ error: 'Usuario no encontrado' })

    const nuevoBloqueado = usuario.bloqueado === 1 ? 0 : 1

    await db.run(
      `UPDATE usuarios SET bloqueado = ? WHERE id = ? AND entidad_id = ?`,
      [nuevoBloqueado, id, entidadId]
    )

    await registrarAuditoria(actorId, id, nuevoBloqueado === 1 ? 'BLOQUEAR' : 'DESBLOQUEAR', {})

    res.json({ ok: true, bloqueado: nuevoBloqueado })

  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Error cambiando bloqueo' })
  }
})

console.log('🔥 USUARIOS ROUTES FIXED')

export default router