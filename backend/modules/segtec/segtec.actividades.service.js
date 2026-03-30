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
  // 🔒 VALIDACIÓN CENTRAL
  // =====================================================

  function validarActividad(data){

    const errores = []

    if(!data.nombre)
      errores.push('1. Nombre de la actividad es obligatorio')

    if(!data.tipo_funcion)
      errores.push('2. Clasificación funcional es obligatoria')

    if(!data.frecuencia)
      errores.push('3. Periodicidad es obligatoria')

    if(data.genera_documentos === null || data.genera_documentos === undefined)
      errores.push('5. Debe indicar si genera documentos')

    if(!data.formato_produccion)
      errores.push('7. Formato de producción es obligatorio')

    if(!data.responsable_custodia)
      errores.push('10. Responsabilidad de custodia es obligatoria')

    if(!data.cargo_custodia)
      errores.push('10a. Cargo responsable de custodia es obligatorio')

    if(!data.localizacion_documentos)
      errores.push('11. Localización de documentos es obligatoria')

    if(data.tiene_pasos_formales === null || data.tiene_pasos_formales === undefined)
      errores.push('13. Debe indicar si tiene pasos formales')

    if(data.requiere_otras_dependencias === null || data.requiere_otras_dependencias === undefined)
      errores.push('14. Debe indicar si requiere otras dependencias')

    if(data.tiene_plazo === null || data.tiene_plazo === undefined)
      errores.push('15. Debe indicar si tiene plazo')

    if(data.genera_expediente_propio === null || data.genera_expediente_propio === undefined)
      errores.push('16. Debe indicar si genera expediente')

    // Condicionales
    if(data.genera_documentos == 1 && !data.documentos_generados)
      errores.push('6. Debe especificar los documentos generados')

    if(data.requiere_otras_dependencias == 1 && !data.dependencias_relacionadas)
      errores.push('14a. Debe indicar las dependencias relacionadas')

    if(errores.length > 0){
      throw new Error(errores.join(' | '))
    }

  }

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
  // ESTADO DE ACTIVIDAD (🔥 AJUSTADO MULTI-TENANT)
  // =====================================================

  async function recalcularEstadoActividad(id, usuarioId) {

    if (!usuarioId)
      throw new Error('usuarioId requerido para multi-tenant')

    const actividad =
      await actividadesRepository.obtenerActividadPorId(id)

    if (!actividad)
      throw new Error('Actividad no encontrada')

    const analisis =
      await actividadesRepository.obtenerUltimoAnalisis(id)

    let estado = 'caracterizada'

    if (analisis)
      estado = 'analizada'

    await actividadesRepository.actualizarEstadoGeneral(id, estado, usuarioId)

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
        proceso_id: procesoId,
        estado_general: 'caracterizada'
      })

    return {
      id: actividad.id,
      proceso_id: procesoId,
      estado_general: 'caracterizada'
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

  async function actualizarCompleto(id, data, usuarioId) {

    await validarEditable(id)

    validarActividad(data)

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

    return recalcularEstadoActividad(id, usuarioId)
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

  async function actualizarBloque1(id, data, usuarioId) {
    await validarEditable(id)
    await actividadesRepository.actualizarBloque1(id, data)
    return recalcularEstadoActividad(id, usuarioId)
  }

  async function actualizarBloque2(id, data, usuarioId) {
    await validarEditable(id)
    await actividadesRepository.actualizarBloque2(id, data)
    return recalcularEstadoActividad(id, usuarioId)
  }

  async function actualizarBloque3(id, data, usuarioId) {
    await validarEditable(id)
    await actividadesRepository.actualizarBloque3(id, data)

    if (data.genera_expediente_propio !== undefined) {
      await validacionRepository.guardar(id, data)
    }

    return recalcularEstadoActividad(id, usuarioId)
  }

  // =====================================================
  // ANALIZAR
  // =====================================================

  async function analizarActividad(id, usuarioId) {

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
        descripcion_funcional: a.descripcion_funcional
      }))
    }

    const resultadoMotor =
      await trdAIService.ejecutarMotorInteligente(contexto)

    if (!resultadoMotor?.length)
      throw new Error('No fue posible generar sugerencia')

    const resultado = resultadoMotor[0] || {}

    const resultadoFinal = {
      serie_propuesta: resultado.serie || null,
      subserie_propuesta: resultado.subserie || null,
      retencion_gestion: resultado.retencion_gestion || 3,
      retencion_central: resultado.retencion_central || 5,
      disposicion_final: resultado.disposicion_final || 'conservacion_parcial',
      justificacion: resultado.justificacion || 'Resultado automático generado por TRD-AI',
      motor_version: '1.2',
      actividades_analizadas: actividadesProceso.length
    }

    await actividadesRepository.guardarAnalisisActividad(
      id,
      resultadoFinal
    )

    const estado =
      await recalcularEstadoActividad(id, usuarioId)

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