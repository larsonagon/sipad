export function SEGTECValidacionTecnicaController(service) {

  if (!service) {
    throw new Error('SEGTECValidacionTecnicaService no proporcionado')
  }

  // =====================================================
  // HELPERS
  // =====================================================

  function obtenerUsuarioId(req) {

    if (!req.user) return null

    return (
      req.user.sub ||
      req.user.id ||
      req.user.usuario_id ||
      req.usuarioId ||
      null
    )
  }

  function validarUsuario(req, res) {

    const usuarioId = obtenerUsuarioId(req)

    if (!usuarioId) {
      res.status(401).json({
        ok: false,
        error: 'Usuario no autenticado'
      })
      return null
    }

    return usuarioId
  }

  // =====================================================
  // OBTENER VALIDACIÓN TÉCNICA
  // GET /actividades/:actividadId/validacion-tecnica
  // =====================================================

  async function obtener(req, res) {

    try {

      const usuarioId = validarUsuario(req, res)
      if (!usuarioId) return

      const { actividadId } = req.params

      if (!actividadId) {
        return res.status(400).json({
          ok: false,
          error: 'actividadId requerido'
        })
      }

      const data = await service.obtener(actividadId)

      return res.status(200).json({
        ok: true,
        existe: !!data,
        data: data ?? null
      })

    } catch (err) {

      console.error('SEGTEC validación técnica obtener error:', err)

      return res.status(500).json({
        ok: false,
        error: err.message || 'Error obteniendo validación técnica'
      })
    }
  }

  // =====================================================
  // GUARDAR VALIDACIÓN TÉCNICA
  // PUT /actividades/:actividadId/validacion-tecnica
  // =====================================================

  async function guardar(req, res) {

    try {

      const usuarioId = validarUsuario(req, res)
      if (!usuarioId) return

      const { actividadId } = req.params

      if (!actividadId) {
        return res.status(400).json({
          ok: false,
          error: 'actividadId requerido'
        })
      }

      const data = req.body || {}

      const resultado =
        await service.guardar(actividadId, data, usuarioId)

      return res.status(200).json({
        ok: true,
        data: resultado
      })

    } catch (err) {

      console.error('SEGTEC validación técnica guardar error:', err)

      return res.status(400).json({
        ok: false,
        error: err.message || 'Error guardando validación técnica'
      })
    }
  }

  return {
    obtener,
    guardar
  }
}