// SEG-TEC – Propuestas IA Service
// Versión integrada con SEG-TEC real (modo contextual seguro)

export function SEGTECPropuestasService(
  repository,
  trdAIService,
  db
) {

  // =====================================================
  // GENERAR DESDE FORMULARIO
  // =====================================================

  async function generarDesdeFormulario(formularioId, usuarioId) {

    // 🔐 Validar propiedad del formulario
    const base = await db.get(`
      SELECT id, estado
      FROM segtec_formularios
      WHERE id = ? AND usuario_id = ?
    `, [formularioId, usuarioId])

    if (!base)
      throw new Error('Formulario no autorizado')

    if (base.estado === 'finalizado')
      throw new Error('Formulario finalizado')

    // 1️⃣ Obtener actividades del formulario
    const actividades =
      await repository.obtenerActividades(formularioId)

    if (!actividades || !actividades.length)
      throw new Error('No existen actividades para analizar')

    // 2️⃣ Limpiar propuestas previas
    await repository.eliminarPorFormulario(formularioId)

    // 3️⃣ Ejecutar motor TRD-AI correctamente
    const resultadoMotor =
      await trdAIService.ejecutarMotorInteligente({
        actividades
      })

    const propuestasGeneradas = []

    // 🔎 Si el motor no generó resultados, no romper flujo
    if (resultadoMotor && resultadoMotor.length) {

      for (const r of resultadoMotor) {

        const propuesta = await repository.crear({
          formulario_id: formularioId,
          tipo_propuesta: r.tipo ?? 'existente',
          contenido: JSON.stringify({
            proceso_id: r.proceso_id ?? null,
            serie_sugerida: r.serie_sugerida ?? null,
            confianza: r.confianza ?? null
          }),
          nivel_confianza: r.confianza ?? null
        })

        propuestasGeneradas.push(propuesta)
      }

      // 4️⃣ Solo avanzar etapa si hubo propuestas
      await repository.actualizarEtapa(formularioId, 4)
    }

    return propuestasGeneradas
  }

  // =====================================================
  // LISTAR PROPUESTAS
  // =====================================================

  async function listar(formularioId, usuarioId) {

    const base = await db.get(`
      SELECT id
      FROM segtec_formularios
      WHERE id = ? AND usuario_id = ?
    `, [formularioId, usuarioId])

    if (!base)
      throw new Error('Formulario no autorizado')

    const propuestas =
      await repository.listarPorFormulario(formularioId)

    return propuestas ?? []
  }

  // =====================================================
  // CAMBIO DE ESTADO
  // =====================================================

  async function aprobar(id) {
    return await repository.cambiarEstado(id, 'aprobada')
  }

  async function rechazar(id) {
    return await repository.cambiarEstado(id, 'rechazada')
  }

  return {
    generarDesdeFormulario,
    listar,
    aprobar,
    rechazar
  }
}
