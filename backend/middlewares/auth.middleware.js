import jwt from 'jsonwebtoken'

export function verificarJWT(req, res, next) {

  const JWT_SECRET = process.env.JWT_SECRET

  const requestId = Date.now().toString(36)

  console.log(`\n[AUTH][${requestId}] ===== INICIO VERIFY =====`)

  if (!JWT_SECRET) {
    console.error(`[AUTH][${requestId}] JWT_SECRET no definido`)
    return res.status(500).json({
      error: 'Configuración de servidor inválida'
    })
  }

  console.log(`[AUTH][${requestId}] JWT_SECRET VERIFY:`, JWT_SECRET)

  const authHeader = req.headers.authorization

  if (!authHeader) {
    console.warn(`[AUTH][${requestId}] No viene Authorization header`)
    return res.status(401).json({
      error: 'Token no proporcionado'
    })
  }

  console.log(`[AUTH][${requestId}] Authorization header:`, authHeader)

  if (!authHeader.startsWith('Bearer ')) {
    console.warn(`[AUTH][${requestId}] Header no inicia con Bearer`)
    return res.status(401).json({
      error: 'Formato de token inválido'
    })
  }

  const token = authHeader.split(' ')[1]

  if (!token) {
    console.warn(`[AUTH][${requestId}] Token vacío tras split`)
    return res.status(401).json({
      error: 'Token inválido'
    })
  }

  console.log(`[AUTH][${requestId}] TOKEN RECIBIDO (inicio):`, token.substring(0, 30) + '...')

  try {

    const decoded = jwt.verify(token, JWT_SECRET)

    console.log(`[AUTH][${requestId}] TOKEN DECODIFICADO:`, decoded)

    // Validación mínima obligatoria
    if (!decoded.sub && !decoded.id) {
      console.warn(`[AUTH][${requestId}] Token sin sub ni id`)
      return res.status(401).json({
        error: 'Token malformado'
      })
    }

    req.user = decoded
    req.isMasterAdmin = decoded.es_master_admin === true

    console.log(`[AUTH][${requestId}] VERIFY OK`)

    next()

  } catch (error) {

    console.error(`[AUTH][${requestId}] ERROR VERIFY:`)
    console.error(`[AUTH][${requestId}] name:`, error.name)
    console.error(`[AUTH][${requestId}] message:`, error.message)

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

    return res.status(500).json({
      error: 'Error interno de autenticación'
    })
  }
}