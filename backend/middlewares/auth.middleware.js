import jwt from 'jsonwebtoken'

export function verificarJWT(req, res, next) {

  const JWT_SECRET = process.env.JWT_SECRET

  if (!JWT_SECRET) {
    console.error('[AUTH] JWT_SECRET no definido')
    return res.status(500).json({
      error: 'Configuración de servidor inválida'
    })
  }

  const authHeader = req.headers.authorization

  if (!authHeader) {
    return res.status(401).json({
      error: 'Token no proporcionado'
    })
  }

  if (!authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      error: 'Formato de token inválido'
    })
  }

  const token = authHeader.split(' ')[1]

  if (!token) {
    return res.status(401).json({
      error: 'Token inválido'
    })
  }

  try {

    const decoded = jwt.verify(token, JWT_SECRET)

    // Validación mínima obligatoria
    if (!decoded.sub && !decoded.id) {
      return res.status(401).json({
        error: 'Token malformado'
      })
    }

    req.user = decoded

    req.isMasterAdmin = decoded.es_master_admin === true

    next()

  } catch (error) {

    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        error: 'Token expirado'
      })
    }

    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        error: 'Token inválido'
      })
    }

    console.error('[AUTH] Error inesperado verificando token:', error)

    return res.status(500).json({
      error: 'Error interno de autenticación'
    })
  }
}