console.log('🔥 ACTIVIDADES CONTROLLER CARGADO')

export const ActividadesController = (service) => ({

  create: async (req, res) => {
    try {
      const result = await service.create(req.body)
      res.status(201).json(result)
    } catch (error) {
      res.status(400).json({ error: error.message })
    }
  },

  getAll: async (req, res) => {
    try {
      const result = await service.getAll()
      res.json(result)
    } catch (error) {
      res.status(500).json({ error: error.message })
    }
  }

})
