// backend/modules/segtec/segtec.validacion.tecnica.repository.js

export function SEGTECValidacionTecnicaRepository(db) {

  if (!db) {
    throw new Error('DB no proporcionada al SEGTECValidacionTecnicaRepository')
  }

  // =====================================================
  // OBTENER VALIDACIÓN TÉCNICA POR ACTIVIDAD
  // =====================================================

  async function obtenerPorActividad(actividadId) {

    if (!actividadId) return null

    const registro = await db.get(`
      SELECT *
      FROM segtec_validacion_tecnica
      WHERE actividad_id = ?
    `, [actividadId])

    return registro ?? null
  }

  // =====================================================
  // GUARDAR / ACTUALIZAR (UPSERT FUERTE LIMPIO)
  // =====================================================

  async function guardar(actividadId, data) {

    if (!actividadId) {
      throw new Error('actividadId requerido')
    }

    const now = new Date().toISOString()

    const existente = await db.get(`
      SELECT actividad_id
      FROM segtec_validacion_tecnica
      WHERE actividad_id = ?
    `, [actividadId])

    const valores = [
      data.impacto_juridico_directo ? 1 : 0,
      data.impacto_fiscal_contable ? 1 : 0,
      data.genera_expediente_propio ? 1 : 0,
      data.actividad_permanente ? 1 : 0,
      data.soporte_principal ?? null,
      data.observacion_tecnica ?? null
    ]

    if (existente) {

      await db.run(`
        UPDATE segtec_validacion_tecnica
        SET impacto_juridico_directo = ?,
            impacto_fiscal_contable = ?,
            genera_expediente_propio = ?,
            actividad_permanente = ?,
            soporte_principal = ?,
            observacion_tecnica = ?,
            updated_at = ?
        WHERE actividad_id = ?
      `, [
        ...valores,
        now,
        actividadId
      ])

      return { actualizado: true }

    } else {

      await db.run(`
        INSERT INTO segtec_validacion_tecnica (
          actividad_id,
          impacto_juridico_directo,
          impacto_fiscal_contable,
          genera_expediente_propio,
          actividad_permanente,
          soporte_principal,
          observacion_tecnica,
          created_at,
          updated_at
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [
        actividadId,
        ...valores,
        now,
        now
      ])

      return { creado: true }
    }
  }

  return {
    obtenerPorActividad,
    guardar
  }
}