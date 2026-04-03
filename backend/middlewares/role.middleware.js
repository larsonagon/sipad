/*
  SIPAD – Middleware institucional por nivel de acceso
  Arquitectura basada en nivel numérico + permisos funcionales
*/

import { db } from '../db/database.js'

// =====================================================
// REQUIERE NIVEL NUMÉRICO
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
// RESOLVER PERMISOS FUNCIONALES
// =====================================================

export const resolvePermissions = (user) => {

  const rol     = user?.role || user?.rol
  const esMaster = user?.es_master_admin === true || user?.es_master_admin === 1

  const esSuperAdmin  = esMaster || rol === 'Super Admin'
  const esArchivista  = rol === 'Archivista'
  const esJefe        = rol === 'Jefe'
  const esOperativo   = !esSuperAdmin // todos menos Super Admin

  return {

    esSuperAdmin,

    // 🔹 Administración
    puedeAdministrar:
      esSuperAdmin || rol === 'Administrador',

    // 🔹 ICAF – Ver el módulo
    puedeVerICAF: true, // todos los autenticados

    // 🔹 ICAF – Crear actividades (todos menos Super Admin)
    puedeCrearICAF: esOperativo,

    // 🔹 ICAF – Analizar actividades (Super Admin + Archivista)
    puedeAnalizarICAF:
      esSuperAdmin || esArchivista,

    // 🔹 Informes – Ver (Super Admin + Archivista ven todo, Jefe solo su dependencia)
    puedeVerInformes:
      esSuperAdmin || esArchivista || esJefe,

    // 🔹 Informes – Ver solo su dependencia (Jefe)
    informesSoloDependencia:
      esJefe && !esSuperAdmin && !esArchivista,

    // 🔹 TRD-AI (Super Admin + Archivista)
    puedeVerTRD:
      esSuperAdmin || esArchivista,

    // 🔹 Visión global
    puedeVerTodo:
      esSuperAdmin || esArchivista

  }

}

// =====================================================
// MIDDLEWARE GENERADOR DE PERMISOS
// =====================================================

export const attachPermissions = (req, res, next) => {

  try {

    if (!req.user) {
      return res.status(401).json({
        error: 'Usuario no autenticado'
      })
    }

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
// REQUIERE ACCESO A INFORMES
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
// REQUIERE ACCESO A TRD-AI
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
// REQUIERE ACCESO A SEGTEC / ICAF
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
// REQUIERE CREAR ACTIVIDADES ICAF
// (todos menos Super Admin)
// =====================================================

export const requireCrearICAF = (req, res, next) => {

  try {

    if (!req.permisos) {
      return res.status(500).json({
        error: 'Permisos no inicializados'
      })
    }

    if (!req.permisos.puedeCrearICAF) {
      return res.status(403).json({
        error: 'El Super Admin no puede crear actividades operativas'
      })
    }

    next()

  } catch (err) {

    console.error('Error requireCrearICAF:', err)

    return res.status(500).json({
      error: 'Error validando permiso de creación ICAF'
    })

  }

}

// =====================================================
// REQUIERE ANALIZAR ACTIVIDADES ICAF
// (Super Admin + Archivista)
// =====================================================

export const requireAnalizarICAF = (req, res, next) => {

  try {

    if (!req.permisos) {
      return res.status(500).json({
        error: 'Permisos no inicializados'
      })
    }

    if (!req.permisos.puedeAnalizarICAF) {
      return res.status(403).json({
        error: 'No autorizado para analizar actividades'
      })
    }

    next()

  } catch (err) {

    console.error('Error requireAnalizarICAF:', err)

    return res.status(500).json({
      error: 'Error validando permiso de análisis ICAF'
    })

  }

}

// =====================================================
// POLÍTICA INSTITUCIONAL SEG-TEC
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