import express from 'express'
import bcrypt from 'bcrypt'
import jwt from 'jsonwebtoken'
import crypto from 'crypto'

import { db } from '../../db/database.js'
import { findUserByUsernameDB } from '../../models/user.db.model.js'

if (!process.env.JWT_SECRET) {
  throw new Error('JWT_SECRET no definido')
}

const JWT_SECRET = process.env.JWT_SECRET
const ACCESS_TOKEN_TTL = '5h'
const REFRESH_TOKEN_DAYS = 7

const router = express.Router()

// ======================================================
// HELPERS
// ======================================================

function generarRefreshToken() {
  return crypto.randomUUID()
}

function calcularExpiracion() {
  const now = new Date()
  return new Date(now.getTime() + REFRESH_TOKEN_DAYS * 86400000)
}

// ======================================================
// LOGIN
// ======================================================

router.post('/login', async (req, res) => {

  const requestId = Date.now().toString(36)

  console.log(`\n[AUTH][${requestId}] ===== LOGIN =====`)

  try {

    const { username, password } = req.body || {}

    if (!username || !password) {
      return res.status(400).json({ error: 'Datos incompletos' })
    }

    const user = await findUserByUsernameDB(username)

    if (!user) {
      return res.status(401).json({ error: 'Credenciales inválidas' })
    }

    if (user.estado !== 1) {
      return res.status(403).json({ error: 'Usuario inactivo' })
    }

    if (user.bloqueado === 1) {
      return res.status(403).json({ error: 'Usuario bloqueado' })
    }

    const valid = await bcrypt.compare(password, user.passwordHash)

    if (!valid) {
      return res.status(401).json({ error: 'Credenciales inválidas' })
    }

    const nivelAcceso = Number(user.nivel_acceso ?? 0)

    if (!nivelAcceso || nivelAcceso <= 0) {
      return res.status(500).json({ error: 'Usuario sin nivel válido' })
    }

    if (!user.entidad_id) {
      return res.status(500).json({ error: 'Usuario sin entidad válida' })
    }

    const payload = {
      sub: Number(user.id),
      username: user.username,
      nombre: user.nombre_completo,
      rol: user.role,
      cargo: user.cargo_nombre,

      nivel_acceso: nivelAcceso,

      entidad_id: user.entidad_id,
      entidad_nombre: user.entidad_nombre || null,

      id_dependencia: Number(user.id_dependencia ?? 0),
      dependencia: user.dependencia_nombre,

      es_master_admin: Boolean(user.es_master_admin),
      es_responsable_dependencia: Boolean(user.es_responsable_dependencia)
    }

    const accessToken = jwt.sign(payload, JWT_SECRET, {
      expiresIn: ACCESS_TOKEN_TTL
    })

    const refreshToken = generarRefreshToken()
    const expiresAt = calcularExpiracion()

    await db.run(
      `
      INSERT INTO refresh_tokens (user_id, token, expires_at, created_at)
      VALUES (?, ?, ?, ?)
      `,
      [user.id, refreshToken, expiresAt, new Date()]
    )

    return res.json({
      token: accessToken,
      refreshToken,
      user: {
        id: Number(user.id),
        username: user.username,
        nombre: user.nombre_completo,
        rol: user.role,
        cargo: user.cargo_nombre,
        nivel_acceso: nivelAcceso,
        dependencia: user.dependencia_nombre,
        entidad_id: user.entidad_id,
        entidad_nombre: user.entidad_nombre || null,
        id_dependencia: Number(user.id_dependencia ?? 0),
        es_master_admin: Boolean(user.es_master_admin),
        es_responsable_dependencia: Boolean(user.es_responsable_dependencia)
      }
    })

  } catch (err) {

    console.error(`[AUTH] ERROR LOGIN:`, err)

    return res.status(500).json({ error: 'Error interno' })
  }

})

// ======================================================
// REFRESH (ROTACIÓN SEGURA)
// ======================================================

router.post('/refresh', async (req, res) => {

  const requestId = Date.now().toString(36)

  console.log(`\n[AUTH][${requestId}] ===== REFRESH =====`)

  try {

    const { refreshToken } = req.body || {}

    if (!refreshToken) {
      return res.status(400).json({ error: 'Refresh token requerido' })
    }

    const row = await db.get(
      `
      SELECT
        rt.user_id,
        rt.expires_at,
        u.username,
        u.nombre_completo,
        r.nombre AS rol_nombre,
        c.nombre AS cargo_nombre,
        r.nivel_acceso,
        u.entidad_id,
        e.nombre AS entidad_nombre,
        u.id_dependencia,
        d.nombre AS dependencia_nombre,
        u.es_master_admin,
        u.es_responsable_dependencia,
        u.estado,
        u.bloqueado
      FROM refresh_tokens rt
      JOIN usuarios u ON u.id = rt.user_id
      JOIN roles r ON r.id = u.id_rol
      LEFT JOIN cargos c ON c.id = u.id_cargo
      LEFT JOIN dependencias d ON d.id = u.id_dependencia
      LEFT JOIN entidades e ON e.id = u.entidad_id
      WHERE rt.token = ?
      `,
      [refreshToken]
    )

    if (!row) {
      return res.status(401).json({ error: 'Refresh inválido' })
    }

    if (new Date(row.expires_at) < new Date()) {
      return res.status(401).json({ error: 'Refresh expirado' })
    }

    if (row.estado !== 1) {
      return res.status(403).json({ error: 'Usuario inactivo' })
    }

    if (row.bloqueado === 1) {
      return res.status(403).json({ error: 'Usuario bloqueado' })
    }

    // 🔥 ROTACIÓN
    await db.run(`DELETE FROM refresh_tokens WHERE token = ?`, [refreshToken])

    const newRefreshToken = generarRefreshToken()
    const expiresAt = calcularExpiracion()

    await db.run(
      `
      INSERT INTO refresh_tokens (user_id, token, expires_at, created_at)
      VALUES (?, ?, ?, ?)
      `,
      [row.user_id, newRefreshToken, expiresAt, new Date()]
    )

    const payload = {
      sub: Number(row.user_id),
      username: row.username,
      nombre: row.nombre_completo,
      rol: row.rol_nombre,
      cargo: row.cargo_nombre,
      nivel_acceso: Number(row.nivel_acceso ?? 0),
      entidad_id: row.entidad_id,
      entidad_nombre: row.entidad_nombre || null,
      id_dependencia: Number(row.id_dependencia ?? 0),
      dependencia: row.dependencia_nombre,
      es_master_admin: Boolean(row.es_master_admin),
      es_responsable_dependencia: Boolean(row.es_responsable_dependencia)
    }

    const newAccessToken = jwt.sign(payload, JWT_SECRET, {
      expiresIn: ACCESS_TOKEN_TTL
    })

    return res.json({
      token: newAccessToken,
      refreshToken: newRefreshToken
    })

  } catch (err) {

    console.error(`[AUTH] ERROR REFRESH:`, err)

    return res.status(500).json({ error: 'Error interno' })
  }

})

// ======================================================
// LOGOUT (REVOCAR)
// ======================================================

router.post('/logout', async (req, res) => {

  try {

    const { refreshToken } = req.body

    if (!refreshToken) {
      return res.status(400).json({
        error: 'Refresh token requerido'
      })
    }

    await db.run(
      `DELETE FROM refresh_tokens WHERE token = ?`,
      [refreshToken]
    )

    return res.json({ ok: true })

  } catch (err) {

    console.error('[AUTH] ERROR LOGOUT:', err)

    return res.status(500).json({
      error: 'Error cerrando sesión'
    })
  }

})

export default router