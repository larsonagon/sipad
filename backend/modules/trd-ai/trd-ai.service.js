import {
  sugerirSerieDesdeActividad,
  sugerirRetencionContextual
} from './trd-ai.engine.js'
import { valorarPropuestas } from './trd-ai.valoracion.js'

export const TRDAIService = (repository, db) => ({

  // ===================================================
  // DASHBOARD
  // ===================================================

  async obtenerDashboard(entidadId = null) {

    const total            = await repository.countAll(entidadId)
    const estados          = await repository.countByEstado(entidadId)
    const ultimasAprobadas = await repository.getUltimasAprobadas(entidadId)

    let aprobadas    = 0
    let rechazadas   = 0
    let pendientes   = 0
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

  async ejecutarMotorInteligente(contexto = null, entidadId = null) {

    if (!contexto) {
      const resultado = await repository.ejecutarMotorInteligente(entidadId)
      if (!resultado) return []
      return resultado.map(r => ({
        serie:     r.serie     || null,
        subserie:  r.subserie  || null,
        tipologia: r.tipologia || null,
        confianza: r.confianza || 0.9,
        origen:    'repository'
      }))
    }

    const { actividades, configuracionDependencia } = contexto

    if (!Array.isArray(actividades) || !actividades.length)
      return []

    const resultados = []

    for (const actividad of actividades) {

      const clasificacion = await sugerirSerieDesdeActividad(
        actividad,
        configuracionDependencia,
        db
      )

      resultados.push({
        serie:    clasificacion?.serie_sugerida?.nombre    || null,
        subserie: clasificacion?.subserie_sugerida?.nombre || null,
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

  async listarPropuestas(entidadId = null) {
    return await repository.getAllSeriesPropuestas(entidadId)
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

  // ===================================================
  // EDITAR PROPUESTA
  // ===================================================

  async editarPropuesta(id, data) {
    const propuesta = await repository.getById(id)
    if (!propuesta) throw new Error('Propuesta no encontrada')
    if (propuesta.estado === 'incorporada')
      throw new Error('No se puede editar una propuesta ya incorporada')
    return await repository.editarPropuesta(id, data)
  },

  // ── Curación en lote ──
  async cambiarEstadoLote(ids, estado, usuarioId, entidadId) {
    if (!['aprobada', 'rechazada'].includes(estado))
      throw new Error('Estado inválido')
    if (!Array.isArray(ids) || ids.length === 0)
      throw new Error('Se requiere una lista de propuestas')
    const res = await repository.cambiarEstadoLote(ids, estado, usuarioId, entidadId)
    // Al aprobar, valorar automáticamente (retención + disposición + fundamento).
    // Nunca debe hacer fallar la aprobación.
    if (estado === 'aprobada' && db) {
      try { await valorarPropuestas(db, { ids, entidadId }) }
      catch (e) { console.error('Auto-valoración al aprobar:', e.message) }
    }
    return res
  },

  async valorarPropuestas(ids, entidadId) {
    if (!db) throw new Error('DB no disponible')
    return await valorarPropuestas(db, { ids: Array.isArray(ids) && ids.length ? ids : null, entidadId })
  },

  async editarLote(ids, data, entidadId) {
    if (!Array.isArray(ids) || ids.length === 0)
      throw new Error('Se requiere una lista de propuestas')
    if (!data?.nombre_serie)
      throw new Error('nombre_serie es obligatorio')
    return await repository.editarLote(ids, data, entidadId)
  },

  // ===================================================
  // INCORPORAR A TRD OFICIAL
  // ===================================================

  async incorporarASerieOficial(id) {
    const propuesta = await repository.getById(id)
    if (!propuesta) throw new Error('Propuesta no encontrada')
    if (propuesta.estado !== 'aprobada')
      throw new Error('Solo propuestas aprobadas pueden incorporarse')
    // Versión de la TRD oficial de la ENTIDAD de la propuesta (multi-tenant)
    const versionActiva = await repository.getVersionAprobada(propuesta.entidad_id || null)
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
        propuesta_id:         propuestaId,
        retencion_gestion:    existente.retencion_gestion,
        retencion_central:    existente.retencion_central,
        disposicion_final:    existente.disposicion_final,
        fundamento_normativo: existente.fundamento_normativo,
        origen:               'existente'
      }
    }

    const sugerencia = sugerirRetencionContextual({
      tipo_funcion:          'apoyo',
      nivel_riesgo:          'medio',
      confianza_lexica:      propuesta.confianza || 0.6,
      impacto_juridico:      'bajo',
      funcion_permanente:    'no',
      requiere_conservacion: 'no',
      soporte_principal:     'digital'
    })

    await repository.guardarReglaRetencion({
      propuesta_id:         propuestaId,
      retencion_gestion:    sugerencia.gestion,
      retencion_central:    sugerencia.central,
      disposicion_final:    sugerencia.disposicion,
      fundamento_normativo: sugerencia.justificacion,
      nivel_confianza:      sugerencia.nivel_confianza,
      tipo_regla:           'automatica'
    })

    return {
      propuesta_id:         propuestaId,
      retencion_gestion:    sugerencia.gestion,
      retencion_central:    sugerencia.central,
      disposicion_final:    sugerencia.disposicion,
      fundamento_normativo: sugerencia.justificacion,
      origen:               'automatica'
    }
  }

})