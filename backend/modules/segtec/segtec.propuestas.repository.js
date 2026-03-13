// SEG-TEC – Propuestas IA Repository
// Versión extendida sin romper estructura actual

import { randomUUID } from 'crypto'

export function SEGTECPropuestasRepository(db) {

  // =====================================================
  // CREAR PROPUESTA IA
  // =====================================================

  async function crear(data) {

    const id = randomUUID()
    const now = new Date().toISOString()

    await db.run(`
      INSERT INTO segtec_propuestas_ai (
        id,
        formulario_id,
        tipo_propuesta,
        contenido,
        nivel_confianza,
        estado,
        creado_en
      )
      VALUES (?, ?, ?, ?, ?, 'generada', ?)
    `, [
      id,
      data.formulario_id,
      data.tipo_propuesta,
      data.contenido,
      data.nivel_confianza ?? null,
      now
    ])

    return { id }
  }

  // =====================================================
  // LISTAR PROPUESTAS POR FORMULARIO
  // =====================================================

  async function listarPorFormulario(formularioId) {
    return await db.all(`
      SELECT *
      FROM segtec_propuestas_ai
      WHERE formulario_id = ?
      ORDER BY creado_en DESC
    `, [formularioId])
  }

  // =====================================================
  // CAMBIAR ESTADO
  // =====================================================

  async function cambiarEstado(id, nuevoEstado) {

    await db.run(`
      UPDATE segtec_propuestas_ai
      SET estado = ?
      WHERE id = ?
    `, [nuevoEstado, id])

    return { id, estado: nuevoEstado }
  }

  // =====================================================
  // 🔥 OBTENER ACTIVIDADES DEL FORMULARIO
  // =====================================================

  async function obtenerActividades(formularioId) {

  return await db.all(`
    SELECT nombre, frecuencia, inicia_como
    FROM segtec_actividades
    WHERE formulario_id = ?
    ORDER BY created_at ASC
  `, [formularioId])
}


  // =====================================================
  // 🔥 LIMPIAR PROPUESTAS PREVIAS (REGENERACIÓN)
  // =====================================================

  async function eliminarPorFormulario(formularioId) {

    await db.run(`
      DELETE FROM segtec_propuestas_ai
      WHERE formulario_id = ?
    `, [formularioId])
  }

  // =====================================================
  // 🔥 ACTUALIZAR ETAPA DEL FORMULARIO
  // =====================================================

  async function actualizarEtapa(formularioId, etapa) {

    await db.run(`
      UPDATE segtec_formularios
      SET etapa_actual = ?
      WHERE id = ?
    `, [etapa, formularioId])
  }

  return {
    crear,
    listarPorFormulario,
    cambiarEstado,
    obtenerActividades,
    eliminarPorFormulario,
    actualizarEtapa
  }
}
