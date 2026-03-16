// =====================================================
// SEGTEC ACTIVIDADES SERVICE
// =====================================================

import crypto from 'crypto'

export function SEGTECActividadesService(
  actividadesRepository,
  validacionRepository,
  trdAIService
) {

  if (!actividadesRepository)
    throw new Error('SEGTECActividadesRepository no proporcionado')

  if (!validacionRepository)
    throw new Error('SEGTECValidacionTecnicaRepository no proporcionado')

  if (!trdAIService)
    throw new Error('TRDAIService no proporcionado')

  // =====================================================
  // VALIDAR SI ES EDITABLE
  // =====================================================

  async function validarEditable(id) {

    const actividad =
      await actividadesRepository.obtenerActividadPorId(id)

    if (!actividad)
      throw new Error('Actividad no encontrada')

    if (actividad.estado_general === 'analizada') {
      throw new Error(
        `No se puede modificar una actividad en estado ${actividad.estado_general}`
      )
    }

    return actividad
  }

  // =====================================================
  // ESTADO DE ACTIVIDAD
  // =====================================================

  async function recalcularEstadoActividad(id) {

    const actividad =
      await actividadesRepository.obtenerActividadPorId(id)

    if (!actividad)
      throw new Error('Actividad no encontrada')

    const analisis =
      await actividadesRepository.obtenerUltimoAnalisis(id)

    let estado = 'caracterizada'

    if (analisis)
      estado = 'analizada'

    await actividadesRepository.actualizarEstadoGeneral(id, estado)

    return estado
  }

  // =====================================================
  // CREAR
  // =====================================================

  async function crear(data, dependenciaId, usuarioId) {

    if (!dependenciaId)
      throw new Error('dependencia requerida')

    if (!usuarioId)
      throw new Error('usuario requerido')

    const procesoId = crypto.randomUUID()

    const actividad =
      await actividadesRepository.crearActividad({
        dependencia_id: dependenciaId,
        usuario_id: usuarioId,
        proceso_id: procesoId
      })

    return {
      id: actividad.id,
      proceso_id: procesoId,
      estado_general: 'borrador'
    }
  }

  // =====================================================
  // LISTAR
  // =====================================================

  async function listarPorUsuario(usuarioId, esAdmin = false) {

    if (!esAdmin && !usuarioId)
      throw new Error('usuario requerido')

    return actividadesRepository.listarPorUsuario(usuarioId, esAdmin)
  }

  // =====================================================
  // OBTENER POR ID
  // =====================================================

  async function obtenerPorId(id, usuarioId) {

    let actividad = null

    if (usuarioId) {
      actividad =
        await actividadesRepository
          .obtenerActividadPorIdYUsuario(id, usuarioId)
    }

    if (!actividad) {
      actividad =
        await actividadesRepository
          .obtenerActividadPorId(id)
    }

    if (!actividad)
      throw new Error('Actividad no encontrada')

    const validacion =
      await validacionRepository.obtenerPorActividad(id)

    const analisis =
      await actividadesRepository.listarAnalisisPorActividad(id)

    return {
      ...actividad,
      validacion: validacion || null,
      analisis: analisis || []
    }
  }

  // =====================================================
  // ACTUALIZACIÓN COMPLETA
  // =====================================================

  async function actualizarCompleto(id, data) {

    await validarEditable(id)

    if (
      data.nombre ||
      data.frecuencia ||
      data.tipo_funcion ||
      data.descripcion_funcional
    ) {
      await actividadesRepository.actualizarBloque1(id, data)
    }

    if (
      data.genera_documentos !== undefined ||
      data.formato_produccion ||
      data.volumen_categoria ||
      data.volumen_documental ||
      data.custodia_tipo ||
      data.localizacion_tipo
    ) {
      await actividadesRepository.actualizarBloque2(id, data)
    }

    if (
      data.tiene_pasos_formales !== undefined ||
      data.requiere_otras_dependencias !== undefined ||
      data.norma_aplicable ||
      data.dependencias_relacionadas ||
      data.tiene_plazo !== undefined ||
      data.plazo_legal ||
      data.tiempo_ejecucion
    ) {
      await actividadesRepository.actualizarBloque3(id, data)
    }

    if (data.genera_expediente_propio !== undefined) {
      await validacionRepository.guardar(id, data)
    }

    return recalcularEstadoActividad(id)
  }

  // =====================================================
  // ELIMINAR
  // =====================================================

  async function eliminar(id) {

    await validarEditable(id)

    return actividadesRepository.eliminarActividad(id)
  }

  // =====================================================
  // BLOQUES
  // =====================================================

  async function actualizarBloque1(id, data) {
    await validarEditable(id)
    await actividadesRepository.actualizarBloque1(id, data)
    return recalcularEstadoActividad(id)
  }

  async function actualizarBloque2(id, data) {
    await validarEditable(id)
    await actividadesRepository.actualizarBloque2(id, data)
    return recalcularEstadoActividad(id)
  }

  async function actualizarBloque3(id, data) {
    await validarEditable(id)
    await actividadesRepository.actualizarBloque3(id, data)

    if (data.genera_expediente_propio !== undefined) {
      await validacionRepository.guardar(id, data)
    }

    return recalcularEstadoActividad(id)
  }

  // =====================================================
  // ANALIZAR
  // =====================================================

  async function analizarActividad(id) {

    const actividad =
      await actividadesRepository.obtenerActividadPorId(id)

    if (!actividad)
      throw new Error('Actividad no encontrada')

    if (
      actividad.estado_general !== 'caracterizada' &&
      actividad.estado_general !== 'analizada'
    ) {
      throw new Error(
        'Solo se puede analizar una actividad caracterizada o analizada'
      )
    }

    let procesoId = actividad.proceso_id

    if (!procesoId) {

      procesoId = crypto.randomUUID()

      await actividadesRepository.asignarProcesoActividad(
        id,
        procesoId
      )
    }

    const actividadesProceso =
      await actividadesRepository.obtenerPorProcesoId(procesoId)

    if (!actividadesProceso?.length)
      throw new Error('El proceso no tiene actividades registradas')

    const contexto = {
      actividades: actividadesProceso.map(a => ({
        nombre: a.nombre,
        descripcion: a.descripcion_funcional
      }))
    }

    const resultadoMotor =
      await trdAIService.ejecutarMotorInteligente(contexto)

    if (!resultadoMotor?.length)
      throw new Error('No fue posible generar sugerencia')

    const resultado = resultadoMotor[0]

    const resultadoFinal = {

      serie_propuesta:
        resultado?.serie ||
        resultado?.serie_sugerida?.nombre ||
        resultado?.serie_sugerida ||
        'Serie Sugerida',

      subserie_propuesta:
        resultado?.subserie ||
        resultado?.subserie_sugerida?.nombre ||
        resultado?.subserie_sugerida ||
        'Subserie sugerida',

      retencion_gestion:
        resultado.retencion_gestion || 3,

      retencion_central:
        resultado.retencion_central || 5,

      disposicion_final:
        resultado.disposicion_final || 'conservacion_parcial',

      justificacion:
        resultado.justificacion ||
        'Resultado automático generado por TRD-AI',

      motor_version: '1.2',

      actividades_analizadas:
        actividadesProceso.length
    }

    await actividadesRepository.guardarAnalisisActividad(
      id,
      resultadoFinal
    )

    const estado =
      await recalcularEstadoActividad(id)

    return {
      ...resultadoFinal,
      estado_general: estado
    }
  }

  // =====================================================
  // COMPLETAR
  // =====================================================

  async function marcarComoCompleta(id) {

    const actividad =
      await actividadesRepository.obtenerActividadPorId(id)

    if (!actividad)
      throw new Error('Actividad no encontrada')

    if (actividad.estado_general !== 'analizada')
      throw new Error(
        'Solo puede completarse una actividad analizada'
      )

    await actividadesRepository.marcarActividadComoCompleta(id)

    return { caracterizada: true }
  }

  return {
    crear,
    listarPorUsuario,
    obtenerPorId,
    eliminar,
    actualizarCompleto,
    actualizarBloque1,
    actualizarBloque2,
    actualizarBloque3,
    analizarActividad,
    marcarComoCompleta
  }
}