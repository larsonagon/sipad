export const TRDAIController = (service) => ({

  // ============================================
  // DASHBOARD ANALÍTICO
  // ============================================

  obtenerDashboardTRDAI: async (req, res) => {
    try {

      const result = await service.obtenerDashboard()

      return res.status(200).json({
        ok: true,
        data: result
      })

    } catch (error) {
      console.error('TRD-AI Dashboard Error:', error)
      return res.status(500).json({
        ok: false,
        error: 'Error generando dashboard TRD-AI'
      })
    }
  },

  // ============================================
  // ANALIZAR SERIES
  // ============================================

  analizarSeries: async (req, res) => {
    try {

      const result = await service.analizarSeries()

      return res.status(200).json({
        ok: true,
        data: result
      })

    } catch (error) {
      console.error('TRD-AI Analizar Error:', error)
      return res.status(500).json({
        ok: false,
        error: 'Error al analizar series'
      })
    }
  },

  // ============================================
  // GENERAR PROPUESTAS
  // ============================================

  generarPropuestas: async (req, res) => {
    try {

      const result = await service.ejecutarMotorInteligente()

      return res.status(200).json({
        ok: true,
        data: result
      })

    } catch (error) {
      console.error('TRD-AI Motor Error:', error)
      return res.status(500).json({
        ok: false,
        error: 'Error generando propuestas'
      })
    }
  },

  // ============================================
  // LISTAR PROPUESTAS
  // ============================================

  listarPropuestas: async (req, res) => {
    try {

      const result = await service.listarPropuestas()

      return res.status(200).json({
        ok: true,
        data: result
      })

    } catch (error) {
      console.error('TRD-AI Listar Error:', error)
      return res.status(500).json({
        ok: false,
        error: 'Error al obtener propuestas'
      })
    }
  },

  // ============================================
  // APROBAR
  // ============================================

  aprobarPropuesta: async (req, res) => {
    try {

      const { id } = req.params
      const usuarioId = req.user?.sub

      if (!usuarioId) {
        return res.status(401).json({
          ok: false,
          error: 'Usuario no autenticado'
        })
      }

      const result = await service.aprobarPropuesta(id, usuarioId)

      return res.status(200).json({
        ok: true,
        mensaje: 'Propuesta aprobada correctamente',
        data: result
      })

    } catch (error) {
      console.error('TRD-AI Aprobar Error:', error)
      return res.status(400).json({
        ok: false,
        error: error.message
      })
    }
  },

  // ============================================
  // RECHAZAR
  // ============================================

  rechazarPropuesta: async (req, res) => {
    try {

      const { id } = req.params
      const usuarioId = req.user?.sub

      if (!usuarioId) {
        return res.status(401).json({
          ok: false,
          error: 'Usuario no autenticado'
        })
      }

      const result = await service.rechazarPropuesta(id, usuarioId)

      return res.status(200).json({
        ok: true,
        mensaje: 'Propuesta rechazada correctamente',
        data: result
      })

    } catch (error) {
      console.error('TRD-AI Rechazar Error:', error)
      return res.status(400).json({
        ok: false,
        error: error.message
      })
    }
  },

  // ============================================
  // INCORPORAR
  // ============================================

  incorporarASerieOficial: async (req, res) => {
    try {

      const { id } = req.params

      const result = await service.incorporarASerieOficial(id)

      return res.status(200).json({
        ok: true,
        mensaje: 'Serie incorporada a TRD oficial',
        data: result
      })

    } catch (error) {
      console.error('TRD-AI Incorporar Error:', error)
      return res.status(400).json({
        ok: false,
        error: error.message
      })
    }
  },

  // ============================================
  // 🔥 RETENCIÓN DOCUMENTAL (MANUAL)
  // ============================================

  guardarReglaRetencion: async (req, res) => {
    try {

      const data = req.body

      const result = await service.guardarReglaRetencion(data)

      return res.status(200).json({
        ok: true,
        mensaje: 'Regla de retención guardada correctamente',
        data: result
      })

    } catch (error) {
      console.error('TRD-AI Retención Guardar Error:', error)
      return res.status(400).json({
        ok: false,
        error: error.message
      })
    }
  },

  obtenerReglaRetencion: async (req, res) => {
    try {

      const { propuestaId } = req.params

      const result = await service.obtenerReglaRetencion(propuestaId)

      return res.status(200).json({
        ok: true,
        data: result
      })

    } catch (error) {
      console.error('TRD-AI Retención Obtener Error:', error)
      return res.status(400).json({
        ok: false,
        error: error.message
      })
    }
  },

  // ============================================
  // 🧠 NUEVO: SUGERENCIA AUTOMÁTICA DE RETENCIÓN
  // ============================================

  sugerirRetencionAutomatica: async (req, res) => {
    try {

      const { propuestaId } = req.params

      const result = await service.sugerirRetencionAutomaticaParaPropuesta(propuestaId)

      return res.status(200).json({
        ok: true,
        data: result
      })

    } catch (error) {
      console.error('TRD-AI Retención Automática Error:', error)
      return res.status(400).json({
        ok: false,
        error: error.message
      })
    }
  }

})
