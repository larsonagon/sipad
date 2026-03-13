export const TRDService = (repository) => ({

  // =========================
  // VERSIONES TRD
  // =========================

  async createVersion(data) {

    if (!data || !data.nombre_version) {
      throw new Error('nombre_version es obligatorio')
    }

    if (!data.modo_creacion) {
      throw new Error('modo_creacion es obligatorio')
    }

    if (!['manual','asistido','mixto'].includes(data.modo_creacion)) {
      throw new Error('modo_creacion inválido')
    }

    return await repository.createVersion(data)
  },

  async getVersions() {
    return await repository.getVersions()
  },

  // =========================
  // PROCESOS
  // =========================

  async getProcesos() {
    return await repository.getProcesos()
  },

  async createProceso(data) {

    if (!data) {
      throw new Error('Datos obligatorios')
    }

    if (!data.subfuncion_id) {
      throw new Error('subfuncion_id es obligatorio')
    }

    if (!data.nombre) {
      throw new Error('nombre es obligatorio')
    }

    return await repository.createProceso(data)
  }

})
