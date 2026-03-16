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
  // NORMALIZADORES
  // =====================================================

  function normalizarBoolean(valor) {

    if (valor === true) return true
    if (valor === false) return false

    if (valor === "si") return true
    if (valor === "no") return false

    if (valor === "true") return true
    if (valor === "false") return false

    if (valor === 1) return true
    if (valor === 0) return false

    return null
  }

  function normalizarDependencias(valor) {

    if (!valor) return []

    if (Array.isArray(valor)) return valor

    if (typeof valor === "string") {
      try {
        return JSON.parse(valor)
      } catch {
        return []
      }
    }

    return []
  }

  // =====================================================
  // NORMALIZAR CAMPOS
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
        normalizarBoolean(
          data.tiene_plazo ??
          data.tienePlazo
        ),

      genera_expediente_propio:
        normalizarBoolean(
          data.genera_expediente_propio ??
          data.generaExpediente
        ),

      genera_documentos:
        normalizarBoolean(
          data.genera_documentos ??
          data.generaDoc
        ),

      tiene_pasos_formales:
        normalizarBoolean(
          data.tiene_pasos_formales ??
          data.pasosFormales
        ),

      requiere_otras_dependencias:
        normalizarBoolean(
          data.requiere_otras_dependencias ??
          data.otrasDep
        ),

      dependencias_relacionadas:
        normalizarDependencias(
          data.dependencias_relacionadas
        )

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
  // ACTUALIZAR BLOQUE 1
  // =====================================================

  async function actualizarBloque1(req, res) {

    try {

      const usuarioId = validarUsuario(req, res)
      if (!usuarioId) return

      const { id } = req.params
      if (!validarId(id, res)) return

      const data = normalizarCampos(req.body || {})

      if (!data.nombre) {
        return res.status(400).json({
          ok:false,
          error:"Nombre obligatorio"
        })
      }

      await service.actualizarBloque1(id, data)

      return res.status(200).json({ ok:true })

    } catch (err) {

      console.error('SEGTEC actualizar bloque1 error:', err)

      return res.status(500).json({
        ok:false,
        error:err.message
      })
    }
  }

  // =====================================================
  // BLOQUE 2
  // =====================================================

  async function actualizarBloque2(req, res) {

    try {

      const usuarioId = validarUsuario(req, res)
      if (!usuarioId) return

      const { id } = req.params
      if (!validarId(id, res)) return

      const data = normalizarCampos(req.body || {})

      await service.actualizarBloque2(id, data)

      return res.status(200).json({ ok:true })

    } catch (err) {

      console.error('SEGTEC actualizar bloque2 error:', err)

      return res.status(500).json({
        ok:false,
        error:err.message
      })
    }
  }

  // =====================================================
  // BLOQUE 3
  // =====================================================

  async function actualizarBloque3(req, res) {

    try {

      const usuarioId = validarUsuario(req, res)
      if (!usuarioId) return

      const { id } = req.params
      if (!validarId(id, res)) return

      const data = normalizarCampos(req.body || {})

      await service.actualizarBloque3(id, data)

      return res.status(200).json({ ok:true })

    } catch (err) {

      console.error('SEGTEC actualizar bloque3 error:', err)

      return res.status(500).json({
        ok:false,
        error:err.message
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
          ok:false,
          error:'Actividad no encontrada'
        })
      }

      return res.status(200).json({
        ok:true,
        data:actividad
      })

    } catch (err) {

      console.error('SEGTEC obtener por id error:', err)

      return res.status(500).json({
        ok:false,
        error:err.message
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
        ok:true,
        data:actividades || []
      })

    } catch (err) {

      console.error('SEGTEC listar error:', err)

      return res.status(500).json({
        ok:false,
        error:err.message
      })
    }
  }

  // =====================================================
  // ELIMINAR
  // =====================================================

  async function eliminar(req, res) {

    try {

      const usuarioId = validarUsuario(req, res)
      if (!usuarioId) return

      const { id } = req.params
      if (!validarId(id, res)) return

      await service.eliminar(id)

      return res.status(200).json({ ok:true })

    } catch (err) {

      console.error('SEGTEC eliminar error:', err)

      return res.status(500).json({
        ok:false,
        error:err.message
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

      return res.status(200).json({
        ok:true,
        data:resultado
      })

    } catch (err) {

      console.error('SEGTEC analizar error:', err)

      return res.status(400).json({
        ok:false,
        error:err.message
      })
    }
  }

  // =====================================================
  // COMPLETAR
  // =====================================================

  async function marcarCompleta(req, res) {

    try {

      const usuarioId = validarUsuario(req, res)
      if (!usuarioId) return

      const { id } = req.params
      if (!validarId(id, res)) return

      const resultado =
        await service.marcarComoCompleta(id)

      return res.status(200).json({
        ok:true,
        ...resultado
      })

    } catch (err) {

      console.error('SEGTEC completar error:', err)

      return res.status(400).json({
        ok:false,
        error:err.message
      })
    }
  }

  return {
    crear,
    obtenerPorId,
    actualizarBloque1,
    actualizarBloque2,
    actualizarBloque3,
    listar,
    eliminar,
    analizar,
    marcarCompleta
  }
}