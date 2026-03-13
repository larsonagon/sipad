// backend/middlewares/role.middleware.js
// SIPAD – Middleware institucional por nivel de acceso

/**
 * Middleware para restringir acceso por nivel mínimo
 * Uso:
 *   requireLevel(80)  // Admin o superior
 *   requireLevel(40)  // Profesional o superior
 */

export const requireLevel = (minLevel) => {
  return (req, res, next) => {

    if (!req.user) {
      return res.status(401).json({
        error: 'Usuario no autenticado'
      });
    }

    const userLevel = req.user.nivel_acceso;

    if (typeof userLevel !== 'number') {
      return res.status(500).json({
        error: 'Token sin nivel_acceso válido'
      });
    }

    if (userLevel < minLevel) {
      return res.status(403).json({
        error: 'Acceso denegado por nivel',
        required: minLevel,
        current: userLevel
      });
    }

    next();
  };
};