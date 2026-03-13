  // SEG-TEC – Propuestas IA Controller

  export function SEGTECPropuestasController(service) {

    // =====================================================
    // GENERAR PROPUESTAS
    // =====================================================

    async function generar(req, res) {
      try {

        const { formularioId } = req.params
        const usuarioId = req.user?.sub

        if (!usuarioId) {
          return res.status(401).json({
            ok: false,
            error: 'Usuario no autenticado'
          })
        }

        const propuestas =
          await service.generarDesdeFormulario(formularioId, usuarioId)

        return res.json({
          ok: true,
          total_generadas: propuestas.length,
          propuestas
        })

      } catch (err) {

        console.error('SEG-TEC Generar Propuestas Error:', err)

        return res.status(400).json({
          ok: false,
          error: err.message
        })
      }
    }

    // =====================================================
    // LISTAR PROPUESTAS
    // =====================================================

    async function listar(req, res) {
      try {

        const { formularioId } = req.params
        const usuarioId = req.user?.sub

        if (!usuarioId) {
          return res.status(401).json({
            ok: false,
            error: 'Usuario no autenticado'
          })
        }

        const propuestas =
          await service.listar(formularioId, usuarioId)

        return res.json({
          ok: true,
          propuestas
        })

      } catch (err) {

        console.error('SEG-TEC Listar Propuestas Error:', err)

        return res.status(400).json({
          ok: false,
          error: err.message
        })
      }
    }

    // =====================================================
    // APROBAR
    // =====================================================

    async function aprobar(req, res) {
      try {

        const { id } = req.params

        await service.aprobar(id)

        return res.json({
          ok: true,
          mensaje: 'Propuesta aprobada correctamente'
        })

      } catch (err) {

        console.error('SEG-TEC Aprobar Propuesta Error:', err)

        return res.status(400).json({
          ok: false,
          error: err.message
        })
      }
    }

    // =====================================================
    // RECHAZAR
    // =====================================================

    async function rechazar(req, res) {
      try {

        const { id } = req.params

        await service.rechazar(id)

        return res.json({
          ok: true,
          mensaje: 'Propuesta rechazada correctamente'
        })

      } catch (err) {

        console.error('SEG-TEC Rechazar Propuesta Error:', err)

        return res.status(400).json({
          ok: false,
          error: err.message
        })
      }
    }

    return {
      generar,
      listar,
      aprobar,
      rechazar
    }
  }
