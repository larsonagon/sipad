console.log('🔥 TRD CONTROLLER CARGADO')

export const TRDController = (service) => ({

  // =====================================================
  // VERSIONES TRD
  // =====================================================

  createVersion: async (req, res) => {
    try {
      const entidadId = req.entidad_id || req.user?.entidad_id || null
      const result = await service.createVersion({ ...req.body, entidad_id: entidadId })
      return res.status(201).json({ ok: true, data: result })
    } catch (error) {
      return res.status(400).json({ ok: false, error: error.message })
    }
  },

  getVersions: async (req, res) => {
    try {
      const entidadId = req.entidad_id || req.user?.entidad_id || null
      const result = await service.getVersions(entidadId)
      return res.json({ ok: true, data: result })
    } catch (error) {
      return res.status(500).json({ ok: false, error: error.message })
    }
  },

  aprobarVersion: async (req, res) => {
    try {
      await service.aprobarVersion(req.params.id)
      return res.json({ ok: true })
    } catch (error) {
      return res.status(400).json({ ok: false, error: error.message })
    }
  },

  // =====================================================
  // CCD
  // =====================================================

  getCCD: async (req, res) => {
    try {
      const result = await service.getCCDCompleto(req.params.versionId)
      return res.json({ ok: true, ...result })
    } catch (error) {
      return res.status(400).json({ ok: false, error: error.message })
    }
  },

  // =====================================================
  // TRD COMPLETA
  // =====================================================

  getTRD: async (req, res) => {
    try {
      const result = await service.getTRDCompleta(req.params.versionId)
      return res.json({ ok: true, ...result })
    } catch (error) {
      return res.status(400).json({ ok: false, error: error.message })
    }
  },

  // =====================================================
  // PROCESOS
  // =====================================================

  getProcesos: async (req, res) => {
    try {
      const result = await service.getProcesos()
      return res.json({ ok: true, data: result })
    } catch (error) {
      return res.status(500).json({ ok: false, error: error.message })
    }
  },

  createProceso: async (req, res) => {
    try {
      const result = await service.createProceso(req.body)
      return res.status(201).json({ ok: true, data: result })
    } catch (error) {
      return res.status(400).json({ ok: false, error: error.message })
    }
  },

  // =====================================================
  // MACROFUNCIONES
  // =====================================================

  getMacrofunciones: async (req, res) => {
    try {
      const result = await service.getMacrofunciones()
      return res.json({ ok: true, data: result })
    } catch (error) {
      return res.status(500).json({ ok: false, error: error.message })
    }
  }

})