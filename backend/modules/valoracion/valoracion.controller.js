// backend/modules/valoracion/valoracion.controller.js

export default class ValoracionController {

  constructor(service) {
    this.service = service
  }

  // GET /api/valoracion/plantillas?tipo=
  listarPlantillas = async (req, res) => {
    try {
      const data = await this.service.listarPlantillas(req.entidad_id, { tipo: req.query.tipo || null })
      res.json({ success: true, total: data.length, data })
    } catch (e) {
      console.error('Error listar plantillas:', e)
      res.status(500).json({ success: false, message: 'Error listando plantillas' })
    }
  }

  // GET /api/valoracion/plantillas/:id
  obtenerPlantilla = async (req, res) => {
    try {
      const data = await this.service.obtenerPlantilla(req.params.id, req.entidad_id)
      if (!data) return res.status(404).json({ success: false, message: 'Plantilla no encontrada' })
      res.json({ success: true, data })
    } catch (e) {
      console.error('Error obtener plantilla:', e)
      res.status(500).json({ success: false, message: 'Error obteniendo plantilla' })
    }
  }

  // POST /api/valoracion/plantillas   (crear plantilla completa)
  crearPlantilla = async (req, res) => {
    try {
      const id = await this.service.crearPlantillaCompleta(req.entidad_id, req.body || {})
      res.status(201).json({ success: true, id })
    } catch (e) {
      console.error('Error crear plantilla:', e)
      res.status(400).json({ success: false, message: e.message || 'Error creando plantilla' })
    }
  }

  // GET /api/valoracion/diligenciamientos?plantillaId=
  listarDiligenciamientos = async (req, res) => {
    try {
      const data = await this.service.listarDiligenciamientos(req.entidad_id, { plantillaId: req.query.plantillaId || null })
      res.json({ success: true, total: data.length, data })
    } catch (e) {
      console.error('Error listar diligenciamientos:', e)
      res.status(500).json({ success: false, message: 'Error listando diligenciamientos' })
    }
  }

  // POST /api/valoracion/diligenciamientos  { plantillaId, dependenciaId, titulo }
  iniciarDiligenciamiento = async (req, res) => {
    try {
      const usuarioId = req.user?.sub ?? req.user?.id ?? null
      const id = await this.service.iniciarDiligenciamiento(req.entidad_id, {
        plantillaId: req.body?.plantillaId,
        dependenciaId: req.body?.dependenciaId ?? null,
        usuarioId,
        titulo: req.body?.titulo ?? null
      })
      res.status(201).json({ success: true, id })
    } catch (e) {
      console.error('Error iniciar diligenciamiento:', e)
      res.status(400).json({ success: false, message: e.message || 'Error iniciando diligenciamiento' })
    }
  }

  // GET /api/valoracion/diligenciamientos/:id
  obtenerDiligenciamiento = async (req, res) => {
    try {
      const data = await this.service.obtenerDiligenciamiento(req.params.id, req.entidad_id)
      if (!data) return res.status(404).json({ success: false, message: 'No encontrado' })
      res.json({ success: true, data })
    } catch (e) {
      console.error('Error obtener diligenciamiento:', e)
      res.status(500).json({ success: false, message: 'Error obteniendo diligenciamiento' })
    }
  }

  // PUT /api/valoracion/diligenciamientos/:id/respuestas  { respuestas: [...] }
  guardarRespuestas = async (req, res) => {
    try {
      const out = await this.service.guardarRespuestas(req.params.id, req.entidad_id, req.body?.respuestas || [])
      res.json({ success: true, ...out })
    } catch (e) {
      console.error('Error guardar respuestas:', e)
      res.status(400).json({ success: false, message: e.message || 'Error guardando respuestas' })
    }
  }

  // POST /api/valoracion/diligenciamientos/:id/finalizar
  finalizar = async (req, res) => {
    try {
      const out = await this.service.finalizar(req.params.id, req.entidad_id)
      res.json({ success: true, ...out })
    } catch (e) {
      console.error('Error finalizar:', e)
      res.status(400).json({ success: false, message: e.message || 'Error finalizando' })
    }
  }

  // POST /api/valoracion/diligenciamientos/:id/casos  { etiqueta, tipoCaso, titulo, documentos:[...] }
  agregarCaso = async (req, res) => {
    try {
      const out = await this.service.agregarCaso(req.params.id, req.entidad_id, req.body || {})
      res.status(201).json({ success: true, ...out })
    } catch (e) {
      console.error('Error agregar caso:', e)
      res.status(400).json({ success: false, message: e.message || 'Error agregando caso' })
    }
  }

  // ===== Fichas de valoración =====

  // GET /api/valoracion/fichas
  listarFichas = async (req, res) => {
    try {
      const data = await this.service.listarFichas(req.entidad_id)
      res.json({ success: true, total: data.length, data })
    } catch (e) {
      console.error('Error listar fichas:', e)
      res.status(500).json({ success: false, message: 'Error listando fichas' })
    }
  }

  // POST /api/valoracion/fichas
  crearFicha = async (req, res) => {
    try {
      const id = await this.service.crearFicha(req.entidad_id, req.body || {})
      res.status(201).json({ success: true, id })
    } catch (e) {
      console.error('Error crear ficha:', e)
      res.status(400).json({ success: false, message: e.message || 'Error creando ficha' })
    }
  }

  // GET /api/valoracion/fichas/:id
  obtenerFicha = async (req, res) => {
    try {
      const data = await this.service.obtenerFicha(req.params.id, req.entidad_id)
      if (!data) return res.status(404).json({ success: false, message: 'Ficha no encontrada' })
      res.json({ success: true, data })
    } catch (e) {
      console.error('Error obtener ficha:', e)
      res.status(500).json({ success: false, message: 'Error obteniendo ficha' })
    }
  }

  // PUT /api/valoracion/fichas/:id
  actualizarFicha = async (req, res) => {
    try {
      const data = await this.service.actualizarFicha(req.params.id, req.entidad_id, req.body || {})
      res.json({ success: true, data })
    } catch (e) {
      console.error('Error actualizar ficha:', e)
      res.status(400).json({ success: false, message: e.message || 'Error actualizando ficha' })
    }
  }

  // POST /api/valoracion/diligenciamientos/:id/borrador-ficha
  // Genera una ficha borrador desde la evidencia (motor de reglas)
  generarBorradorFicha = async (req, res) => {
    try {
      const out = await this.service.generarBorradorFicha(req.params.id, req.entidad_id)
      res.status(201).json({ success: true, ...out })
    } catch (e) {
      console.error('Error generar borrador ficha:', e)
      res.status(400).json({ success: false, message: e.message || 'Error generando borrador' })
    }
  }
}
