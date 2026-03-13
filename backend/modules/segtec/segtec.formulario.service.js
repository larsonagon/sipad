import { db } from '../../db/database.js'
import crypto from 'crypto'

export const SEGTECFormService = () => ({

  // =====================================================
  // CREAR NUEVO FORMULARIO BASE
  // =====================================================
  crearNuevo: async (usuarioId, idDependencia, descripcion = null) => {

    if (!usuarioId) {
      throw new Error('Usuario no autenticado')
    }

    const id = crypto.randomUUID()

    const row = await db.get(`
      SELECT COUNT(*) as total FROM segtec_formularios
    `)

    const numero = (row?.total || 0) + 1

    await db.run(`
      INSERT INTO segtec_formularios (
        id,
        numero,
        descripcion,
        estado,
        etapa_actual,
        usuario_id,
        created_at
      )
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `,
      [
        id,
        numero,
        descripcion || null,
        'en_proceso',
        1,
        usuarioId,
        new Date().toISOString()
      ]
    )

    return {
      id,
      numero,
      estado: 'en_proceso',
      etapa_actual: 1
    }
  },

  // =====================================================
  // LISTAR POR USUARIO
  // =====================================================
  listarPorUsuario: async (usuarioId) => {

    return await db.all(`
      SELECT *
      FROM segtec_formularios
      WHERE usuario_id = ?
      ORDER BY created_at DESC
    `, [usuarioId])

  },

  // =====================================================
  // AVANZAR ETAPA
  // =====================================================
  avanzarEtapa: async (formularioId, usuarioId, etapa) => {

    await db.run(`
      UPDATE segtec_formularios
      SET etapa_actual = ?
      WHERE id = ?
      AND usuario_id = ?
    `, [etapa, formularioId, usuarioId])

  },

  // =====================================================
  // FINALIZAR REGISTRO
  // =====================================================
  finalizarRegistro: async (formularioId, usuarioId) => {

    await db.run(`
      UPDATE segtec_formularios
      SET estado = 'finalizado'
      WHERE id = ?
      AND usuario_id = ?
    `, [formularioId, usuarioId])

  }

})