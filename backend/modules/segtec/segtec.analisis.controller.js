// backend/modules/segtec/segtec.analisis.controller.js
// SEG-TEC – Controller Análisis Técnico (Proceso o Actividad)

export function SEGTECAnalisisController({
  actividadRepository,
  procesoRepository,
  trdAIService
}) {

  async function analizar(req, res) {

    try {

      const procesoId = req.params.procesoId || null
      const actividadId = req.params.id || req.params.actividadId || null

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

      let actividades = []

      // ==================================================
      // 1️⃣ ANÁLISIS POR ACTIVIDAD
      // ==================================================

      if (actividadId) {

        const actividad =
          await actividadRepository.obtenerPorId(actividadId)

        if (!actividad) {
          return res.status(404).json({
            ok: false,
            error: 'Actividad no encontrada'
          })
        }

        actividades = [actividad]

      }

      // ==================================================
      // 2️⃣ ANÁLISIS POR PROCESO
      // ==================================================

      else if (procesoId) {

        const proceso =
          await procesoRepository.obtenerPorId(procesoId)

        if (!proceso) {
          return res.status(404).json({
            ok: false,
            error: 'Proceso no encontrado'
          })
        }

        actividades =
          await actividadRepository.obtenerPorProcesoId(procesoId)

        if (!actividades || actividades.length === 0) {
          return res.status(400).json({
            ok: false,
            error: 'El proceso no tiene actividades registradas'
          })
        }

      }

      else {

        return res.status(400).json({
          ok: false,
          error: 'Parámetro de análisis no válido'
        })

      }

      // ==================================================
      // 3️⃣ CONTEXTO PARA TRD-AI
      // ==================================================

      const contexto = {
        actividades: actividades.map(a => ({
          nombre: a.nombre || '',
          descripcion: a.descripcion || '',
          descripcion_funcional: a.descripcion_funcional || '',
          documentos_generados: a.documentos_generados || ''
        }))
      }

      // ==================================================
      // 4️⃣ EJECUTAR MOTOR
      // ==================================================

      const resultadoMotor =
        await trdAIService.ejecutarMotorInteligente(contexto)

      if (!resultadoMotor || !resultadoMotor.length) {

        return res.json({
          ok: true,
          data: {
            serie: null,
            subserie: null,
            confianza: 0
          }
        })

      }

      const resultado = resultadoMotor[0] || {}

      const serie =
        resultado?.serie ||
        resultado?.serie_sugerida?.nombre ||
        null

      const subserie =
        resultado?.subserie ||
        resultado?.subserie_sugerida?.nombre ||
        null

      let propuestaId = null

      if (resultado.propuesta_creada?.id) {
        propuestaId = resultado.propuesta_creada.id
      }

      // ==================================================
      // 5️⃣ RETENCIÓN AUTOMÁTICA
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
      // 6️⃣ RESPUESTA
      // ==================================================

      return res.json({

        ok: true,

        data: {

          serie,
          subserie,

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

    }

    catch (error) {

      console.error('Error en análisis SEG-TEC:', error)

      return res.status(500).json({
        ok: false,
        error: 'Error ejecutando análisis técnico'
      })

    }

  }

  return { analizar }

}