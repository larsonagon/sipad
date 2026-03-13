// backend/modules/segtec/segtec.validacion.tecnica.service.js

export function SEGTECValidacionTecnicaService(
  validacionRepository,
  actividadesRepository
) {

  if (!validacionRepository) {
    throw new Error('SEGTECValidacionTecnicaRepository no proporcionado')
  }

  if (!actividadesRepository) {
    throw new Error('SEGTECActividadesRepository no proporcionado')
  }

  // =====================================================
  // VALIDACIÓN ESTRUCTURAL
  // =====================================================

  function validarDatos(data) {

    if (!data) {
      throw new Error('Datos requeridos')
    }

    const nivelesValidos = ['bajo', 'medio', 'alto']

    if (!data.nivel_riesgo ||
        !nivelesValidos.includes(data.nivel_riesgo)) {
      throw new Error('nivel_riesgo inválido (bajo | medio | alto)')
    }

    const soportesValidos = ['papel', 'electronico', 'mixto']

    if (data.soporte_principal &&
        !soportesValidos.includes(data.soporte_principal)) {
      throw new Error(
        'soporte_principal inválido (papel | electronico | mixto)'
      )
    }
  }

  // =====================================================
  // OBTENER
  // =====================================================

  async function obtener(actividadId) {

    if (!actividadId) {
      throw new Error('actividadId requerido')
    }

    return validacionRepository.obtenerPorActividad(actividadId)
  }

  // =====================================================
  // GUARDAR + TRANSICIÓN FORMAL
  // =====================================================

  async function guardar(actividadId, data) {

    if (!actividadId) {
      throw new Error('actividadId requerido')
    }

    validarDatos(data)

    // 1️⃣ Guardar validación técnica
    const resultado = await validacionRepository.guardar(
      actividadId,
      data
    )

    // 2️⃣ Transición formal del ciclo técnico
    await actividadesRepository.actualizarEstadoGeneral(
      actividadId,
      'validada'
    )

    return resultado
  }

  return {
    obtener,
    guardar
  }
}