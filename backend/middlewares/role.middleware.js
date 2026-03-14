/*
  SIPAD – Middleware institucional por nivel de acceso
  Arquitectura basada en nivel numérico
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

      const userLevel = req.user.nivel_acceso

      // 🔒 Validación robusta
      if (userLevel === undefined || userLevel === null) {
        return res.status(401).json({
          error: 'Token sin nivel de acceso'
        })
      }

      const nivel = Number(userLevel)

      if (Number.isNaN(nivel)) {
        return res.status(401).json({
          error: 'Nivel de acceso inválido'
        })
      }

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
// POLÍTICA INSTITUCIONAL SEG-TEC
// Acceso permitido si:
// - Nivel >= 80
// - Master admin
// - Responsable de dependencia
// =====================================================

export const requireSEGTECPolicy = async (req, res, next) => {

  try {

    if (!req.user) {
      return res.status(401).json({
        error: 'Usuario no autenticado'
      })
    }

    const usuarioId =
      req.user?.sub ??
      req.user?.id ??
      null

    if (!usuarioId) {
      return res.status(401).json({
        error: 'Usuario no identificado'
      })
    }

    const nivel = Number(req.user?.nivel_acceso ?? 0)

    // 🔥 Si nivel alto, pasa directo
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