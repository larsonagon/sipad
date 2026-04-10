import {
  sugerirSerieDesdeActividad,
  sugerirRetencionContextual
} from './trd-ai.engine.js'

export const TRDAIService = (repository) => ({

  // ===================================================
  // DASHBOARD
  // ===================================================

  async obtenerDashboard() {

    const total           = await repository.countAll()
    const estados         = await repository.countByEstado()
    const ultimasAprobadas = await repository.getUltimasAprobadas()

    let aprobadas   = 0
    let rechazadas  = 0
    let pendientes  = 0
    let incorporadas = 0

    if (Array.isArray(estados)) {
      estados.forEach(e => {
        if (e.estado === 'aprobada')    aprobadas    = e.cantidad
        if (e.estado === 'rechazada')   rechazadas   = e.cantidad
        if (e.estado === 'propuesta')   pendientes   = e.cantidad
        if (e.estado === 'incorporada') incorporadas = e.cantidad
      })
    }

    return {
      resumen: {
        total_propuestas: total,
        aprobadas,
        rechazadas,
        pendientes,
        incorporadas
      },
      ultimas_aprobadas: ultimasAprobadas || []
    }
  },

  // ===================================================
  // ANALISIS SERIES
  // ===================================================

  async analizarSeries() {
    if (!repository.analizarSeries) return []
    return await repository.analizarSeries()
  },

  // ===================================================
  // MOTOR INTELIGENTE
  // ===================================================

  async ejecutarMotorInteligente(contexto = null) {

    // --------------------------------------------------
    // MODO AUTOMÁTICO (usa repository)
    // --------------------------------------------------

    if (!contexto) {
      const resultado = await repository.ejecutarMotorInteligente()
      if (!resultado) return []
      return resultado.map(r => ({
        serie:     r.serie     || null,
        subserie:  r.subserie  || null,
        tipologia: r.tipologia || null,
        confianza: r.confianza || 0.9,
        origen:    'repository'
      }))
    }

    // --------------------------------------------------
    // MODO CONTEXTUAL — ahora usa Claude
    // --------------------------------------------------

    const { actividades, configuracionDependencia } = contexto

    if (!Array.isArray(actividades) || !actividades.length)
      return []

    const resultados = []

    for (const actividad of actividades) {

      // ✅ Pasar configuracionDependencia al engine
      const clasificacion = await sugerirSerieDesdeActividad(
        actividad,
        configuracionDependencia
      )

      resultados.push({

        serie:    clasificacion?.serie_sugerida?.nombre    || null,
        subserie: clasificacion?.subserie_sugerida?.nombre || null,

        // ✅ Claude ya propone retenciones — usarlas si existen
        retencion_gestion: clasificacion?.retencion_gestion ?? null,
        retencion_central: clasificacion?.retencion_central ?? null,
        disposicion_final: clasificacion?.disposicion_final ?? null,

        confianza:     clasificacion?.confianza     ?? 0.6,
        justificacion: clasificacion?.justificacion ?? 'Clasificación generada por TRD-AI',
        origen:        clasificacion?.origen        ?? 'engine'

      })
    }

    return resultados
  },

  // ===================================================
  // LISTADO PROPUESTAS
  // ===================================================

  async listarPropuestas() {
    return await repository.getAllSeriesPropuestas()
  },

  async aprobarPropuesta(id, usuarioId) {
    const propuesta = await repository.getById(id)
    if (!propuesta) throw new Error('Propuesta no encontrada')
    if (propuesta.estado !== 'propuesta')
      throw new Error('Solo se pueden aprobar propuestas en estado propuesta')
    return await repository.cambiarEstado(id, 'aprobada', usuarioId)
  },

  async rechazarPropuesta(id, usuarioId) {
    const propuesta = await repository.getById(id)
    if (!propuesta) throw new Error('Propuesta no encontrada')
    if (propuesta.estado !== 'propuesta')
      throw new Error('Solo se pueden rechazar propuestas en estado propuesta')
    return await repository.cambiarEstado(id, 'rechazada', usuarioId)
  },

  async incorporarASerieOficial(id) {
    const propuesta = await repository.getById(id)
    if (!propuesta) throw new Error('Propuesta no encontrada')
    if (propuesta.estado !== 'aprobada')
      throw new Error('Solo propuestas aprobadas pueden incorporarse')
    const versionActiva = await repository.getVersionAprobada?.()
    if (!versionActiva) throw new Error('No existe una TRD aprobada')
    return await repository.incorporarASerieOficial(id, versionActiva.id)
  },

  // ===================================================
  // REGLAS RETENCIÓN
  // ===================================================

  async guardarReglaRetencion(data) {
    if (!data?.propuesta_id) throw new Error('propuesta_id es obligatorio')
    const propuesta = await repository.getById(data.propuesta_id)
    if (!propuesta) throw new Error('Propuesta no encontrada')
    return await repository.guardarReglaRetencion({ ...data, tipo_regla: 'manual' })
  },

  async obtenerReglaRetencion(propuestaId) {
    if (!propuestaId) throw new Error('propuestaId es obligatorio')
    return await repository.obtenerReglaRetencionPorPropuesta(propuestaId)
  },

  // ===================================================
  // SUGERIR RETENCIÓN AUTOMÁTICA
  // ===================================================

  async sugerirRetencionAutomaticaParaPropuesta(propuestaId) {

    if (!propuestaId) throw new Error('propuestaId es obligatorio')

    const propuesta = await repository.getById(propuestaId)
    if (!propuesta) throw new Error('Propuesta no encontrada')

    const existente = await repository.obtenerReglaRetencionPorPropuesta(propuestaId)

    if (existente) {
      return {
        propuesta_id:        propuestaId,
        retencion_gestion:   existente.retencion_gestion,
        retencion_central:   existente.retencion_central,
        disposicion_final:   existente.disposicion_final,
        fundamento_normativo: existente.fundamento_normativo,
        origen:              'existente'
      }
    }

    // Fallback contextual (los valores hardcodeados se mantienen
    // solo si Claude no pudo proponer retenciones en el análisis)
    const sugerencia = sugerirRetencionContextual({
      tipo_funcion:         'apoyo',
      nivel_riesgo:         'medio',
      confianza_lexica:     propuesta.confianza || 0.6,
      impacto_juridico:     'bajo',
      funcion_permanente:   'no',
      requiere_conservacion: 'no',
      soporte_principal:    'digital'
    })

    await repository.guardarReglaRetencion({
      propuesta_id:        propuestaId,
      retencion_gestion:   sugerencia.gestion,
      retencion_central:   sugerencia.central,
      disposicion_final:   sugerencia.disposicion,
      fundamento_normativo: sugerencia.justificacion,
      nivel_confianza:     sugerencia.nivel_confianza,
      tipo_regla:          'automatica'
    })

    return {
      propuesta_id:        propuestaId,
      retencion_gestion:   sugerencia.gestion,
      retencion_central:   sugerencia.central,
      disposicion_final:   sugerencia.disposicion,
      fundamento_normativo: sugerencia.justificacion,
      origen:              'automatica'
    }
  }

})