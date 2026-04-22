export const TRDAIController = (service) => ({

  // ===================================================
  // DASHBOARD
  // ===================================================

  obtenerDashboardTRDAI: async (req, res) => {
    try {
      const data = await service.obtenerDashboard()
      return res.json({ ok: true, data })
    } catch (err) {
      console.error('TRD-AI dashboard error:', err)
      return res.status(500).json({ ok: false, error: err.message })
    }
  },

  // ===================================================
  // ANALIZAR SERIES
  // ===================================================

  analizarSeries: async (req, res) => {
    try {
      const data = await service.analizarSeries()
      return res.json({ ok: true, data })
    } catch (err) {
      return res.status(500).json({ ok: false, error: err.message })
    }
  },

  // ===================================================
  // GENERAR PROPUESTAS
  // ===================================================

  generarPropuestas: async (req, res) => {
    try {
      const resultado = await service.ejecutarMotorInteligente()
      return res.json({ ok: true, data: resultado })
    } catch (err) {
      console.error('TRD-AI generar propuestas error:', err)
      return res.status(500).json({ ok: false, error: err.message })
    }
  },

  // ===================================================
  // LISTAR PROPUESTAS
  // ===================================================

  listarPropuestas: async (req, res) => {
    try {
      const data = await service.listarPropuestas()
      return res.json({ ok: true, data })
    } catch (err) {
      return res.status(500).json({ ok: false, error: err.message })
    }
  },

  // ===================================================
  // APROBAR PROPUESTA
  // ===================================================

  aprobarPropuesta: async (req, res) => {
    try {
      const usuarioId = req.user?.sub || req.user?.id || null
      await service.aprobarPropuesta(req.params.id, usuarioId)
      return res.json({ ok: true })
    } catch (err) {
      console.error('TRD-AI Aprobar Error:', err)
      return res.status(400).json({ ok: false, error: err.message })
    }
  },

  // ===================================================
  // RECHAZAR PROPUESTA
  // ===================================================

  rechazarPropuesta: async (req, res) => {
    try {
      const usuarioId = req.user?.sub || req.user?.id || null
      await service.rechazarPropuesta(req.params.id, usuarioId)
      return res.json({ ok: true })
    } catch (err) {
      return res.status(400).json({ ok: false, error: err.message })
    }
  },

  // ===================================================
  // EDITAR PROPUESTA
  // ===================================================

  editarPropuesta: async (req, res) => {
    try {
      const { nombre_serie, nombre_subserie, tipologia_documental } = req.body
      if (!nombre_serie) {
        return res.status(400).json({ ok: false, error: 'nombre_serie es obligatorio' })
      }
      await service.editarPropuesta(req.params.id, {
        nombre_serie,
        nombre_subserie:      nombre_subserie      || null,
        tipologia_documental: tipologia_documental || null
      })
      return res.json({ ok: true })
    } catch (err) {
      console.error('TRD-AI editar propuesta error:', err)
      return res.status(400).json({ ok: false, error: err.message })
    }
  },

  // ===================================================
  // INCORPORAR A TRD OFICIAL
  // ===================================================

  incorporarASerieOficial: async (req, res) => {
    try {
      const resultado = await service.incorporarASerieOficial(req.params.id)
      return res.json({ ok: true, data: resultado })
    } catch (err) {
      console.error('TRD-AI incorporar error:', err)
      return res.status(400).json({ ok: false, error: err.message })
    }
  },

  // ===================================================
  // REGLAS RETENCIÓN
  // ===================================================

  guardarReglaRetencion: async (req, res) => {
    try {
      const id = await service.guardarReglaRetencion({
        ...req.body,
        propuesta_id: req.params.propuestaId
      })
      return res.json({ ok: true, id })
    } catch (err) {
      return res.status(400).json({ ok: false, error: err.message })
    }
  },

  obtenerReglaRetencion: async (req, res) => {
    try {
      const data = await service.obtenerReglaRetencion(req.params.propuestaId)
      return res.json({ ok: true, data })
    } catch (err) {
      return res.status(400).json({ ok: false, error: err.message })
    }
  },

  // ===================================================
  // SUGERIR RETENCIÓN AUTOMÁTICA
  // ===================================================

  sugerirRetencionAutomatica: async (req, res) => {
    try {
      const data = await service.sugerirRetencionAutomaticaParaPropuesta(
        req.params.propuestaId
      )
      return res.json({ ok: true, data })
    } catch (err) {
      console.error('TRD-AI Retención Automática Error:', err)
      return res.status(400).json({ ok: false, error: err.message })
    }
  }

})