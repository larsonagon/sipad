// backend/middlewares/auth.middleware.js

import jwt from 'jsonwebtoken'

const SECRET = process.env.JWT_SECRET || 'sipad_super_secret_key'

export const verificarJWT = (req, res, next) => {

  const authHeader = req.headers.authorization

  if (!authHeader) {
    return res.status(401).json({
      error: 'Token requerido'
    })
  }

  const parts = authHeader.split(' ')

  if (parts.length !== 2 || parts[0] !== 'Bearer') {
    return res.status(401).json({
      error: 'Formato de token inválido'
    })
  }

  const token = parts[1]

  try {

    const decoded = jwt.verify(token, SECRET)

    if (
      !decoded.id ||
      typeof decoded.nivel_acceso !== 'number'
    ) {
      return res.status(401).json({
        error: 'Token inválido'
      })
    }

    req.user = decoded

    next()

  } catch (err) {

    return res.status(403).json({
      error: 'Token inválido o expirado'
    })

  }
}