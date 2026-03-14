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

// =========================
// LOGIN INSTITUCIONAL
// =========================

router.post('/login', async (req, res) => {

  try {

    const { username, password } = req.body || {}

    if (!username || !password) {
      return res.status(400).json({
        error: 'Datos incompletos'
      })
    }

    const user = await findUserByUsernameDB(username)

    if (!user) {
      return res.status(401).json({
        error: 'Credenciales inválidas'
      })
    }

    const valid = await bcrypt.compare(password, user.passwordHash)

    if (!valid) {
      return res.status(401).json({
        error: 'Credenciales inválidas'
      })
    }

    // =========================
    // ACCESS TOKEN
    // =========================

    const accessToken = jwt.sign(
      {
        sub: Number(user.id),
        username: user.username,
        nombre: user.nombre_completo,
        rol: user.role,

        // 🔧 CORRECTO
        nivel_acceso: Number(user.nivel),

        id_entidad: Number(user.id_entidad),
        id_dependencia: Number(user.id_dependencia),
        dependencia: user.dependencia_nombre,
        es_master_admin: Boolean(user.es_master_admin),
        es_responsable_dependencia: Boolean(user.es_responsable_dependencia)
      },
      JWT_SECRET,
      { expiresIn: ACCESS_TOKEN_TTL }
    )

    // =========================
    // REFRESH TOKEN
    // =========================

    const refreshToken = crypto.randomUUID()

    const now = new Date()

    const expiresAt = new Date(
      now.getTime() + REFRESH_TOKEN_DAYS * 86400000
    )

    await db.run(
      `
      INSERT INTO refresh_tokens (
        user_id,
        token,
        expires_at,
        created_at
      )
      VALUES (?, ?, ?, ?)
      `,
      [
        Number(user.id),
        refreshToken,
        expiresAt,
        now
      ]
    )

    return res.json({
      token: accessToken,
      refreshToken,
      user: {
        id: Number(user.id),
        username: user.username,
        nombre: user.nombre_completo,
        rol: user.role,

        // 🔧 MISMO CAMPO
        nivel_acceso: Number(user.nivel),

        dependencia: user.dependencia_nombre,
        id_entidad: Number(user.id_entidad),
        id_dependencia: Number(user.id_dependencia),
        es_master_admin: Boolean(user.es_master_admin),
        es_responsable_dependencia: Boolean(user.es_responsable_dependencia)
      }
    })

  } catch (err) {

    console.error('Error login institucional:', err)

    return res.status(500).json({
      error: 'Error interno'
    })
  }

})


// =========================
// REFRESH TOKEN
// =========================

router.post('/refresh', async (req, res) => {

  try {

    const { refreshToken } = req.body || {}

    if (!refreshToken) {
      return res.status(400).json({
        error: 'Refresh token requerido'
      })
    }

    const row = await db.get(
      `
      SELECT
        rt.user_id,
        rt.expires_at,
        u.username,
        u.nombre_completo,
        r.nombre AS rol_nombre,
        r.nivel_acceso,
        u.id_entidad,
        u.id_dependencia,
        d.nombre AS dependencia_nombre,
        u.es_master_admin,
        u.es_responsable_dependencia
      FROM refresh_tokens rt
      JOIN usuarios u ON u.id = rt.user_id
      JOIN roles r ON r.id = u.id_rol
      LEFT JOIN dependencias d ON d.id = u.id_dependencia
      WHERE rt.token = ?
      `,
      [refreshToken]
    )

    if (!row) {
      return res.status(401).json({
        error: 'Refresh inválido'
      })
    }

    if (new Date(row.expires_at) < new Date()) {
      return res.status(401).json({
        error: 'Refresh expirado'
      })
    }

    const newAccessToken = jwt.sign(
      {
        sub: Number(row.user_id),
        username: row.username,
        nombre: row.nombre_completo,
        rol: row.rol_nombre,
        nivel_acceso: Number(row.nivel_acceso),
        id_entidad: Number(row.id_entidad),
        id_dependencia: Number(row.id_dependencia),
        dependencia: row.dependencia_nombre,
        es_master_admin: Boolean(row.es_master_admin),
        es_responsable_dependencia: Boolean(row.es_responsable_dependencia)
      },
      JWT_SECRET,
      { expiresIn: ACCESS_TOKEN_TTL }
    )

    return res.json({
      token: newAccessToken
    })

  } catch (err) {

    console.error('Error refresh:', err)

    return res.status(500).json({
      error: 'Error interno'
    })
  }

})

export default router