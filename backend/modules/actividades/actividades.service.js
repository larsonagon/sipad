export const ActividadesService = (repository) => ({

  async create(data) {

    if (!data.proceso_id) {
      throw new Error('proceso_id es obligatorio')
    }

    if (!data.nombre) {
      throw new Error('nombre es obligatorio')
    }

    if (!data.frecuencia) {
      throw new Error('frecuencia es obligatoria')
    }

    if (!data.inicia_por) {
      throw new Error('inicia_por es obligatorio')
    }

    return await repository.create(data)
  },

  async getAll() {
    return await repository.findAll()
  }

})
