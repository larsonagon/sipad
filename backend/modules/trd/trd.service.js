export const TRDService = (repository) => ({

  // =====================================================
  // VERSIONES TRD
  // =====================================================

  async createVersion(data) {

    if (!data?.nombre_version) {
      throw new Error('nombre_version es obligatorio')
    }

    if (!data.modo_creacion) {
      throw new Error('modo_creacion es obligatorio')
    }

    if (!['manual', 'asistido', 'mixto'].includes(data.modo_creacion)) {
      throw new Error('modo_creacion inválido')
    }

    return await repository.createVersion(data)
  },

  async getVersions(entidadId = null) {
    return await repository.getVersions(entidadId)
  },

  async getVersionById(id) {
    if (!id) throw new Error('id es obligatorio')
    return await repository.getVersionById(id)
  },

  async aprobarVersion(id) {
    if (!id) throw new Error('id es obligatorio')
    const version = await repository.getVersionById(id)
    if (!version) throw new Error('Versión no encontrada')
    if (version.estado === 'aprobada') throw new Error('La versión ya está aprobada')
    return await repository.actualizarEstadoVersion(id, 'aprobada')
  },

  // =====================================================
  // PROCESOS
  // =====================================================

  async getProcesos() {
    return await repository.getProcesos()
  },

  async createProceso(data) {

    if (!data) throw new Error('Datos obligatorios')
    if (!data.subfuncion_id) throw new Error('subfuncion_id es obligatorio')
    if (!data.nombre) throw new Error('nombre es obligatorio')

    return await repository.createProceso(data)
  },

  // =====================================================
  // CCD — Cuadro de Clasificación Documental
  // =====================================================

  async getCCDCompleto(versionId) {
    if (!versionId) throw new Error('versionId es obligatorio')
    const version = await repository.getVersionById(versionId)
    if (!version) throw new Error('Versión no encontrada')
    const ccd = await repository.getCCDCompleto(versionId)
    return { version, ccd }
  },

  // =====================================================
  // TRD COMPLETA
  // =====================================================

  async getTRDCompleta(versionId) {
    if (!versionId) throw new Error('versionId es obligatorio')
    const version = await repository.getVersionById(versionId)
    if (!version) throw new Error('Versión no encontrada')
    const trd = await repository.getTRDCompleta(versionId)
    const dependencias = await repository.getDependenciasConSeries(versionId)
    return { version, trd, dependencias }
  },

  // =====================================================
  // MACROFUNCIONES
  // =====================================================

  async getMacrofunciones() {
    return await repository.getMacrofunciones()
  }

})