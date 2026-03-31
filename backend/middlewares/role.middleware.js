/*
  SIPAD – Middleware institucional por nivel de acceso
  Arquitectura basada en nivel numérico + permisos funcionales
*/

import { db } from '../db/database.js'

// =====================================================
// REQUIERE NIVEL NUMÉRICO (SE MANTIENE IGUAL)
// =====================================================

export const requireLevel = (minLevel) => {

  return (req, res, next) => {

    try {

      if (!req.user) {
        return res.status(401).json({
          error: 'Usuario no autenticado'
        })
      }

      const rawLevel = req.user.nivel_acceso
      const nivel = Number(rawLevel ?? 0)

      if (Number.isNaN(nivel)) {
        return res.status(401).json({
          error: 'Nivel de acceso inválido'
        })
      }

      req.user.nivel_acceso = nivel

      if (nivel < minLevel) {
        return res.status(403).json({
          error: 'Acceso denegado por nivel',
          required: minLevel,
          current: nivel
        })
      }

      next()

    } catch (err) {

      console.error('Error requireLevel:', err)

      return res.status(500).json({
        error: 'Error validando nivel de acceso'
      })

    }

  }

}

// =====================================================
// 🔥 NUEVO: RESOLVER PERMISOS FUNCIONALES
// =====================================================

export const resolvePermissions = (user) => {

  const nivel = Number(user?.nivel_acceso ?? 0)

  return {

    esSuperAdmin: user?.es_master_admin === true,

    // 🔹 Administración
    puedeAdministrar: nivel >= 90,

    // 🔹 SEGTEC (ICAF)
    puedeVerICAF: nivel >= 10,

    // 🔹 Informes
    puedeVerInformes:
      nivel === 70 || // Archivista
      nivel === 50 || // Jefe
      user?.es_master_admin === true,

    // 🔹 TRD-AI
    puedeVerTRD:
      nivel === 70 || // Archivista
      user?.es_master_admin === true,

    // 🔹 Visión global (todo el sistema)
    puedeVerTodo:
      nivel === 70 || // Archivista
      user?.es_master_admin === true

  }

}

// =====================================================
// 🔥 NUEVO: MIDDLEWARE GENERADOR DE PERMISOS
// =====================================================

export const attachPermissions = (req, res, next) => {

  try {

    if (!req.user) {
      return res.status(401).json({
        error: 'Usuario no autenticado'
      })
    }

    // 🔥 Inyecta permisos calculados
    req.permisos = resolvePermissions(req.user)

    next()

  } catch (err) {

    console.error('Error attachPermissions:', err)

    return res.status(500).json({
      error: 'Error resolviendo permisos'
    })

  }

}

// =====================================================
// 🔥 NUEVO: REQUIERE ACCESO A INFORMES
// =====================================================

export const requireInformes = (req, res, next) => {

  try {

    if (!req.permisos) {
      return res.status(500).json({
        error: 'Permisos no inicializados'
      })
    }

    if (!req.permisos.puedeVerInformes) {
      return res.status(403).json({
        error: 'No autorizado para acceder a informes'
      })
    }

    next()

  } catch (err) {

    console.error('Error requireInformes:', err)

    return res.status(500).json({
      error: 'Error validando acceso a informes'
    })

  }

}

// =====================================================
// 🔥 NUEVO: REQUIERE ACCESO A TRD-AI
// =====================================================

export const requireTRD = (req, res, next) => {

  try {

    if (!req.permisos) {
      return res.status(500).json({
        error: 'Permisos no inicializados'
      })
    }

    if (!req.permisos.puedeVerTRD) {
      return res.status(403).json({
        error: 'No autorizado para TRD-AI'
      })
    }

    next()

  } catch (err) {

    console.error('Error requireTRD:', err)

    return res.status(500).json({
      error: 'Error validando acceso TRD'
    })

  }

}

// =====================================================
// 🔥 NUEVO: REQUIERE ACCESO A SEGTEC (ICAF)
// =====================================================

export const requireICAF = (req, res, next) => {

  try {

    if (!req.permisos) {
      return res.status(500).json({
        error: 'Permisos no inicializados'
      })
    }

    if (!req.permisos.puedeVerICAF) {
      return res.status(403).json({
        error: 'No autorizado para SEGTEC (ICAF)'
      })
    }

    next()

  } catch (err) {

    console.error('Error requireICAF:', err)

    return res.status(500).json({
      error: 'Error validando acceso ICAF'
    })

  }

}

// =====================================================
// POLÍTICA INSTITUCIONAL SEG-TEC (SE MANTIENE)
// =====================================================

export const requireSEGTECPolicy = async (req, res, next) => {

  try {

    if (!req.user) {
      return res.status(401).json({
        error: 'Usuario no autenticado'
      })
    }

    const usuarioId =
      req.user?.id ??
      req.user?.sub ??
      null

    if (!usuarioId) {
      return res.status(401).json({
        error: 'Usuario no identificado'
      })
    }

    const nivel = Number(req.user?.nivel_acceso ?? 0)

    if (nivel >= 80) {
      return next()
    }

    const usuario = await db.get(
      `
      SELECT
        es_master_admin,
        es_responsable_dependencia
      FROM usuarios
      WHERE id = ?
      `,
      [usuarioId]
    )

    if (!usuario) {
      return res.status(403).json({
        error: 'Usuario inválido'
      })
    }

    const autorizado =
      Number(usuario.es_master_admin) === 1 ||
      Number(usuario.es_responsable_dependencia) === 1

    if (!autorizado) {
      return res.status(403).json({
        error: 'Acceso denegado por política SEG-TEC'
      })
    }

    next()

  } catch (err) {

    console.error('SEGTEC policy error:', err)

    return res.status(500).json({
      error: 'Error validando política SEG-TEC'
    })

  }

}