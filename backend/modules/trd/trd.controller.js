console.log('🔥 TRD CONTROLLER REAL CARGADO')

export const TRDController = (service) => ({

  // =========================
  // VERSIONES TRD
  // =========================

  createVersion: async (req, res) => {
    try {
      const result = await service.createVersion(req.body)
      return res.status(201).json(result)
    } catch (error) {
      return res.status(400).json({ error: error.message })
    }
  },

  getVersions: async (req, res) => {
    try {
      const result = await service.getVersions()
      return res.json(result)
    } catch (error) {
      return res.status(500).json({ error: error.message })
    }
  },

  // =========================
  // PROCESOS
  // =========================

  getProcesos: async (req, res) => {
    try {
      const result = await service.getProcesos()
      return res.json(result)
    } catch (error) {
      return res.status(500).json({ error: error.message })
    }
  },

  createProceso: async (req, res) => {
    try {
      const result = await service.createProceso(req.body)
      return res.status(201).json(result)
    } catch (error) {
      return res.status(400).json({ error: error.message })
    }
  }

})
