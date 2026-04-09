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

  // ======================================
  // TOKEN: header o query param
  // ✅ FIX: permite ?token= para descargas
  // ======================================

  let token = null

  const authHeader = req.headers.authorization

  if (authHeader && authHeader.startsWith('Bearer ')) {
    token = authHeader.split(' ')[1]?.trim()
  } else if (req.query.token) {
    token = req.query.token
  }

  if (!token) {
    console.warn(`[AUTH][${requestId}] No viene token`)
    return res.status(401).json({
      error: 'Token no proporcionado'
    })
  }

  console.log(`[AUTH][${requestId}] TOKEN RECIBIDO (inicio):`, token.substring(0, 30) + '...')

  try {

    const decoded = jwt.verify(token, JWT_SECRET)

    console.log(`[AUTH][${requestId}] TOKEN DECODIFICADO:`, decoded)

    if (!decoded.sub && !decoded.id) {
      console.warn(`[AUTH][${requestId}] Token sin sub ni id`)
      return res.status(401).json({ error: 'Token malformado' })
    }

    if (!decoded.entidad_id) {
      console.warn(`[AUTH][${requestId}] Token sin entidad_id`)
      return res.status(401).json({ error: 'Token sin entidad válida' })
    }

    if (decoded.nivel_acceso === undefined || decoded.nivel_acceso === null) {
      console.warn(`[AUTH][${requestId}] Token sin nivel_acceso`)
      return res.status(401).json({ error: 'Token incompleto (nivel)' })
    }

    req.user          = decoded
    req.isMasterAdmin = decoded.es_master_admin === true

    console.log(`[AUTH][${requestId}] VERIFY OK`)

    next()

  } catch (error) {

    console.error(`[AUTH][${requestId}] ERROR VERIFY:`, error.name, error.message)

    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'Token expirado' })
    }

    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ error: 'Token inválido' })
    }

    return res.status(500).json({ error: 'Error interno de autenticación' })
  }
}