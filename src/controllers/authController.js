// backend/modules/auth/auth.controller.js

import bcrypt from 'bcrypt'
import jwt from 'jsonwebtoken'
import { db } from '../../db/database.js'

const SECRET = process.env.JWT_SECRET || 'sipad_super_secret_key'

export const login = (req, res) => {

  const { username, password } = req.body

  if (!username || !password) {
    return res.status(400).json({
      error: 'Credenciales incompletas'
    })
  }

  const sql = `
    SELECT 
      u.id,
      u.username,
      u.password_hash,
      u.id_dependencia,
      u.bloqueado,
      r.nivel_acceso
    FROM usuarios u
    JOIN roles r ON u.id_rol = r.id
    WHERE u.username = ?
  `

  db.get(sql, [username], async (err, user) => {

    if (err) {
      console.error('Error login:', err)
      return res.status(500).json({
        error: 'Error interno'
      })
    }

    if (!user) {
      return res.status(401).json({
        error: 'Usuario no encontrado'
      })
    }

    if (user.bloqueado) {
      return res.status(403).json({
        error: 'Usuario bloqueado'
      })
    }

    const validPassword = await bcrypt.compare(
      password,
      user.password_hash
    )

    if (!validPassword) {
      return res.status(401).json({
        error: 'Contraseña incorrecta'
      })
    }

    const token = jwt.sign(
      {
        id: user.id,
        username: user.username,
        nivel_acceso: user.nivel_acceso,
        id_dependencia: user.id_dependencia
      },
      SECRET,
      { expiresIn: '8h' }
    )

    return res.json({
      message: 'Login exitoso',
      token
    })

  })
}