export function SEGTECActividadesController(service) {

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

  function esSuperAdmin(req) {

    return (
      req.user?.es_master_admin === 1 ||
      req.user?.es_master_admin === true ||
      req.user?.rol === 'Super Admin'
    )
  }

  function validarUsuario(req, res) {

    const usuarioId = obtenerUsuarioId(req)

    if (!usuarioId) {
      res.status(401).json({
        ok: false,
        error: 'No autenticado'
      })
      return null
    }

    return usuarioId
  }

  function obtenerDependencia(req) {

    return (
      req.dependenciaId ||
      req.user?.id_dependencia ||
      req.user?.dependencia_id ||
      null
    )
  }

  function validarId(id, res) {

    if (!id) {
      res.status(400).json({
        ok: false,
        error: 'ID requerido'
      })
      return false
    }

    return true
  }

  // =====================================================
  // NORMALIZAR CAMPOS (ALINEADO CON TABLA)
  // =====================================================

  function normalizarCampos(data = {}) {

    return {

      ...data,

      volumen_documental:
        data.volumen_documental ??
        data.volumen_categoria ??
        data.volumenCategoria ??
        null,

      responsable_custodia:
        data.responsable_custodia ??
        data.custodia_tipo ??
        data.custodiaTipo ??
        null,

      cargo_custodia:
        data.cargo_custodia ??
        data.cargoCustodia ??
        null,

      dependencia_custodia:
        data.dependencia_custodia ??
        data.dependenciaCustodia ??
        null,

      localizacion_documentos:
        data.localizacion_documentos ??
        data.localizacion_tipo ??
        data.localizacionTipo ??
        null,

      localizacion_otro:
        data.localizacion_otro ??
        data.localizacionOtro ??
        null,

      tiene_plazo:
        data.tiene_plazo ??
        data.tienePlazo ??
        null,

      genera_expediente_propio:
        data.genera_expediente_propio ??
        data.generaExpediente ??
        null

    }
  }

  // =====================================================
  // CREAR
  // =====================================================

  async function crear(req, res) {

    try {

      const usuarioId = validarUsuario(req, res)
      if (!usuarioId) return

      const dependenciaId = obtenerDependencia(req)

      if (!dependenciaId) {
        return res.status(403).json({
          ok: false,
          error: 'Usuario sin dependencia asignada'
        })
      }

      const data = normalizarCampos(req.body || {})

      if (!data.nombre || data.nombre.trim() === '') {

        return res.status(400).json({
          ok: false,
          error: 'El nombre de la actividad es obligatorio'
        })

      }

      const result =
        await service.crear(data, dependenciaId, usuarioId)

      return res.status(201).json({
        ok: true,
        data: result
      })

    } catch (err) {

      console.error('SEGTEC actividad crear error:', err)

      return res.status(500).json({
        ok: false,
        error: err.message || 'Error interno al crear actividad'
      })
    }
  }

  // =====================================================
  // ACTUALIZAR COMPLETO
  // =====================================================

  async function actualizar(req, res) {

    try {

      const usuarioId = validarUsuario(req, res)
      if (!usuarioId) return

      const { id } = req.params
      if (!validarId(id, res)) return

      const data = normalizarCampos(req.body || {})

      const estado =
        await service.actualizarCompleto(id, {
          ...data,
          usuario_id: usuarioId
        })

      return res.status(200).json({
        ok: true,
        estado_general: estado
      })

    } catch (err) {

      console.error('SEGTEC actualizar actividad error:', err)

      return res.status(500).json({
        ok: false,
        error: err.message
      })
    }
  }

  // =====================================================
  // OBTENER
  // =====================================================

  async function obtenerPorId(req, res) {

    try {

      const usuarioId = validarUsuario(req, res)
      if (!usuarioId) return

      const { id } = req.params
      if (!validarId(id, res)) return

      const actividad =
        await service.obtenerPorId(id, usuarioId)

      if (!actividad) {

        return res.status(404).json({
          ok: false,
          error: 'Actividad no encontrada'
        })
      }

      return res.status(200).json({
        ok: true,
        data: actividad
      })

    } catch (err) {

      console.error('SEGTEC obtener por id error:', err)

      return res.status(500).json({
        ok: false,
        error: err.message
      })
    }
  }

  // =====================================================
  // LISTAR ANÁLISIS
  // =====================================================

  async function listarAnalisis(req, res) {

    try {

      const usuarioId = validarUsuario(req, res)
      if (!usuarioId) return

      const { id } = req.params
      if (!validarId(id, res)) return

      const analisis =
        await service.obtenerAnalisisPorActividad(id)

      return res.status(200).json({
        ok: true,
        data: analisis || []
      })

    } catch (err) {

      console.error('SEGTEC listar analisis error:', err)

      return res.status(500).json({
        ok: false,
        error: err.message
      })
    }
  }

  // =====================================================
  // BLOQUES (FIX MULTI-TENANT)
  // =====================================================

  async function actualizarBloque1(req, res) {

    try {

      const usuarioId = validarUsuario(req, res)
      if (!usuarioId) return

      const { id } = req.params
      if (!validarId(id, res)) return

      const data = normalizarCampos(req.body || {})

      await service.actualizarBloque1(id, {
        ...data,
        usuario_id: usuarioId
      })

      return res.status(200).json({ ok: true })

    } catch (err) {

      console.error('SEGTEC actualizar bloque1 error:', err)

      return res.status(500).json({
        ok: false,
        error: err.message
      })
    }
  }

  async function actualizarBloque2(req, res) {

    try {

      const usuarioId = validarUsuario(req, res)
      if (!usuarioId) return

      const { id } = req.params
      if (!validarId(id, res)) return

      const data = normalizarCampos(req.body || {})

      await service.actualizarBloque2(id, {
        ...data,
        usuario_id: usuarioId
      })

      return res.status(200).json({ ok: true })

    } catch (err) {

      console.error('SEGTEC actualizar bloque2 error:', err)

      return res.status(500).json({
        ok: false,
        error: err.message
      })
    }
  }

  async function actualizarBloque3(req, res) {

    try {

      const usuarioId = validarUsuario(req, res)
      if (!usuarioId) return

      const { id } = req.params
      if (!validarId(id, res)) return

      const data = normalizarCampos(req.body || {})

      await service.actualizarBloque3(id, {
        ...data,
        usuario_id: usuarioId
      })

      return res.status(200).json({ ok: true })

    } catch (err) {

      console.error('SEGTEC actualizar bloque3 error:', err)

      return res.status(500).json({
        ok: false,
        error: err.message
      })
    }
  }

  // =====================================================
  // LISTAR
  // =====================================================

  async function listar(req, res) {

    try {

      const usuarioId = validarUsuario(req, res)
      if (!usuarioId) return

      const esAdmin = esSuperAdmin(req)

      const actividades =
        await service.listarPorUsuario(usuarioId, esAdmin)

      return res.status(200).json({
        ok: true,
        data: actividades || []
      })

    } catch (err) {

      console.error('SEGTEC listar error:', err)

      return res.status(500).json({
        ok: false,
        error: err.message
      })
    }
  }

  // =====================================================
  // ELIMINAR (FIX)
  // =====================================================

  async function eliminar(req, res) {

    try {

      const usuarioId = validarUsuario(req, res)
      if (!usuarioId) return

      const { id } = req.params
      if (!validarId(id, res)) return

      await service.eliminar(id, usuarioId)

      return res.status(200).json({ ok: true })

    } catch (err) {

      console.error('SEGTEC eliminar error:', err)

      return res.status(500).json({
        ok: false,
        error: err.message
      })
    }
  }

  // =====================================================
  // ANALIZAR
  // =====================================================

  async function analizar(req, res) {

    try {

      const usuarioId = validarUsuario(req, res)
      if (!usuarioId) return

      const { id } = req.params
      if (!validarId(id, res)) return

      const resultado =
        await service.analizarActividad(id)

      if (!resultado) {
        return res.status(400).json({
          ok: false,
          error: 'No se pudo generar análisis'
        })
      }

      return res.status(200).json({
        ok: true,
        data: resultado,
        estado_general: resultado?.estado_general || null
      })

    } catch (err) {

      console.error('SEGTEC analizar error:', err)

      return res.status(400).json({
        ok: false,
        error: err.message
      })
    }
  }

  // =====================================================
  // COMPLETAR (FIX)
  // =====================================================

  async function marcarCompleta(req, res) {

    try {

      const usuarioId = validarUsuario(req, res)
      if (!usuarioId) return

      const { id } = req.params
      if (!validarId(id, res)) return

      const resultado =
        await service.marcarComoCompleta(id, usuarioId)

      return res.status(200).json({
        ok: true,
        ...resultado
      })

    } catch (err) {

      console.error('SEGTEC completar error:', err)

      return res.status(400).json({
        ok: false,
        error: err.message
      })
    }
  }

  return {
    crear,
    actualizar,
    obtenerPorId,
    actualizarBloque1,
    actualizarBloque2,
    actualizarBloque3,
    listar,
    eliminar,
    analizar,
    listarAnalisis,
    marcarCompleta
  }

}