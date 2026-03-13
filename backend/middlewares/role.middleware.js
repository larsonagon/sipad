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

// =====================================================
// 🔥 POLÍTICA INSTITUCIONAL SEG-TEC
// Permite acceso si:
// - Nivel >= 80
// - Es master admin
// - Es responsable de dependencia
// =====================================================

export const requireSEGTECPolicy = async (req, res, next) => {

  try {

    if (!req.user) {
      return res.status(401).json({
        error: 'Usuario no autenticado'
      });
    }

    const usuarioId =
      req.user?.sub ||
      req.user?.id ||
      null;

    if (!usuarioId) {
      return res.status(401).json({
        error: 'Usuario no identificado'
      });
    }

    const nivel = req.user?.nivel_acceso || 0;

    // 🔥 Si nivel alto, pasa directo
    if (nivel >= 80) {
      return next();
    }

    // 🔥 Consultar flags institucionales
    const usuario = await db.get(
      `
      SELECT
        es_master_admin,
        es_responsable_dependencia
      FROM usuarios
      WHERE id = ?
      `,
      [usuarioId]
    );

    if (!usuario) {
      return res.status(403).json({
        error: 'Usuario inválido'
      });
    }

    const autorizado =
      usuario.es_master_admin === 1 ||
      usuario.es_responsable_dependencia === 1;

    if (!autorizado) {
      return res.status(403).json({
        error: 'Acceso denegado por política SEG-TEC'
      });
    }

    next();

  } catch (err) {

    console.error('SEGTEC policy error:', err);

    return res.status(500).json({
      error: 'Error validando política SEG-TEC'
    });
  }
};