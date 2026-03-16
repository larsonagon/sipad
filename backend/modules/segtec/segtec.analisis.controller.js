// backend/modules/segtec/segtec.analisis.controller.js
// SEG-TEC – Controller Análisis Técnico (Análisis por Proceso)

export function SEGTECAnalisisController({
  actividadRepository,
  procesoRepository,
  trdAIService
}) {

  // ======================================================
  // POST /api/segtec/procesos/:procesoId/analizar
  // ======================================================

  async function analizar(req, res) {
    try {

      const { procesoId } = req.params

      const usuarioId =
        req.user?.sub ||
        req.user?.id ||
        req.user?.Id ||
        req.user?.IdUsuario

      if (!usuarioId) {
        return res.status(401).json({
          ok: false,
          error: 'Usuario no autenticado'
        })
      }

      if (!procesoId) {
        return res.status(400).json({
          ok: false,
          error: 'Proceso no válido'
        })
      }

      // ==================================================
      // 1️⃣ Obtener proceso
      // ==================================================

      const proceso =
        await procesoRepository.obtenerPorId(procesoId)

      if (!proceso) {
        return res.status(404).json({
          ok: false,
          error: 'Proceso no encontrado'
        })
      }

      // ==================================================
      // 2️⃣ Obtener TODAS las actividades del proceso
      // ==================================================

      const actividades =
        await actividadRepository.obtenerPorProcesoId(procesoId)

      if (!actividades || actividades.length === 0) {
        return res.status(400).json({
          ok: false,
          error: 'El proceso no tiene actividades registradas'
        })
      }

      // ==================================================
      // 3️⃣ Construir contexto para TRD-AI
      // ==================================================

      const contexto = {
        actividades: actividades.map(a => ({
          nombre: a.nombre,
          descripcion: a.descripcion || '',
          descripcion_funcional: a.descripcion_funcional || '',
          documentos_generados: a.documentos_generados || ''
        }))
      }

      // ==================================================
      // 4️⃣ Ejecutar Motor TRD-AI
      // ==================================================

      const resultadoMotor =
        await trdAIService.ejecutarMotorInteligente(contexto)

      if (!resultadoMotor || !resultadoMotor.length) {
        return res.status(400).json({
          ok: false,
          error: 'No fue posible generar sugerencia'
        })
      }

      const resultado = resultadoMotor[0] || {}

      // ==================================================
      // 5️⃣ Extraer Serie y Subserie
      // ==================================================

      const serie =
        resultado.serie ||
        resultado?.serie_sugerida?.nombre ||
        null

      const subserie =
        resultado.subserie ||
        resultado?.subserie_sugerida?.nombre ||
        null

      let propuestaId = null

      if (resultado.propuesta_creada?.id) {
        propuestaId = resultado.propuesta_creada.id
      }

      // ==================================================
      // 6️⃣ Generar retención automática
      // ==================================================

      let retencion = null

      if (propuestaId) {

        const regla =
          await trdAIService
            .sugerirRetencionAutomaticaParaPropuesta(
              propuestaId
            )

        retencion = regla || null
      }

      // ==================================================
      // 7️⃣ Respuesta al Frontend
      // ==================================================

      return res.json({
        ok: true,
        data: {

          proceso_id: procesoId,

          actividades_analizadas: actividades.length,

          // 🔹 CAMPOS PRINCIPALES PARA EL MODAL
          serie: serie,
          subserie: subserie,

          // 🔹 compatibilidad con versiones anteriores
          serie_propuesta: serie,
          subserie_propuesta: subserie,

          confianza: resultado.confianza ?? 0,

          retencion_gestion:
            retencion?.retencion_gestion ??
            resultado.retencion_gestion ??
            2,

          retencion_central:
            retencion?.retencion_central ??
            resultado.retencion_central ??
            3,

          disposicion_final:
            retencion?.disposicion_final ??
            resultado.disposicion_final ??
            'eliminacion',

          justificacion:
            retencion?.fundamento_normativo ??
            resultado.justificacion ??
            'Retención sugerida automáticamente por TRD-AI'
        }
      })

    } catch (error) {

      console.error('Error en análisis SEG-TEC:', error)

      return res.status(500).json({
        ok: false,
        error: 'Error ejecutando análisis técnico'
      })
    }
  }

  return {
    analizar
  }

}