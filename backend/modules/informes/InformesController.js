export default class InformesController {

  constructor(service) {
    this.service = service
  }

  // =====================================
  // UTILIDAD: EXTRAER FILTROS
  // =====================================

  obtenerFiltros(req) {
    const filtros = {
      funcionario: req.query.funcionario,
      dependencia: req.query.dependencia,
      proceso: req.query.proceso,
      fechaInicio: req.query.fechaInicio,
      fechaFin: req.query.fechaFin
    }

    // ✅ Rol "Jefe": solo puede ver su propia dependencia.
    //    Se ignora cualquier "dependencia" que venga por query string.
    if (req.permisos?.informesSoloDependencia) {
      filtros.dependencia = req.user?.id_dependencia ?? filtros.dependencia
    }

    return filtros
  }

  // Nombre de dependencia al que se limita un Jefe (o null si ve todo)
  dependenciaRestringida(req) {
    return req.permisos?.informesSoloDependencia
      ? (req.user?.dependencia ?? null)
      : null
  }

  // =====================================
  // INFORME 1 — CONSULTA DE ACTIVIDADES
  // =====================================

  obtenerActividades = async (req, res) => {
    try {
      const filtros = this.obtenerFiltros(req)
      const datos = await this.service.obtenerInformeActividades(req.entidad_id, filtros)
      res.json({ success: true, total: datos.length, data: datos })
    } catch (error) {
      console.error("Error informe actividades:", error)
      res.status(500).json({ success: false, message: "Error generando informe" })
    }
  }

  // =====================================
  // INFORME 2 — RESUMEN POR DEPENDENCIA
  // =====================================

  obtenerResumenDependencias = async (req, res) => {
    try {
      const datos = await this.service.obtenerResumenDependencias(
        req.entidad_id,
        this.dependenciaRestringida(req)
      )
      res.json({ success: true, total: datos.length, data: datos })
    } catch (error) {
      console.error("Error resumen dependencias:", error)
      res.status(500).json({ success: false, message: "Error generando informe por dependencia" })
    }
  }

  // ✅ NUEVO: Excel del resumen por dependencia
  generarResumenDependenciasExcel = async (req, res) => {
    try {
      const buffer = await this.service.generarResumenDependenciasExcel(
        req.entidad_id,
        this.dependenciaRestringida(req)
      )

      res.setHeader(
        "Content-Type",
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
      )
      res.setHeader(
        "Content-Disposition",
        "attachment; filename=resumen_dependencias.xlsx"
      )
      res.send(Buffer.from(buffer))
    } catch (error) {
      console.error("Error generando Excel resumen dependencias:", error)
      res.status(500).json({ success: false, message: "Error generando informe Excel" })
    }
  }

  // =====================================
  // GENERAR WORD (actividades)
  // =====================================

  generarWord = async (req, res) => {
    try {
      const filtros = this.obtenerFiltros(req)
      const buffer = await this.service.generarInformeWord(req.entidad_id, filtros)

      res.setHeader(
        "Content-Type",
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
      )
      res.setHeader(
        "Content-Disposition",
        "attachment; filename=informe_actividades.docx"
      )
      res.send(Buffer.from(buffer))
    } catch (error) {
      console.error("Error generando Word:", error)
      res.status(500).json({ success: false, message: "Error generando informe Word" })
    }
  }

  // =====================================
  // GENERAR EXCEL (actividades)
  // =====================================

  generarExcel = async (req, res) => {
    try {
      const filtros = this.obtenerFiltros(req)
      const buffer = await this.service.generarInformeExcel(req.entidad_id, filtros)

      res.setHeader(
        "Content-Type",
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
      )
      res.setHeader(
        "Content-Disposition",
        "attachment; filename=informe_actividades.xlsx"
      )
      res.send(Buffer.from(buffer))
    } catch (error) {
      console.error("Error generando Excel:", error)
      res.status(500).json({ success: false, message: "Error generando informe Excel" })
    }
  }

  // =====================================
  // PRODUCCIÓN DOCUMENTAL
  // =====================================

  obtenerProduccionDocumental = async (req, res) => {
    try {
      const filtros = this.obtenerFiltros(req)
      const datos = await this.service.obtenerProduccionDocumental(req.entidad_id, filtros)
      res.json({ success: true, total: datos.length, data: datos })
    } catch (error) {
      console.error("Error informe producción documental:", error)
      res.status(500).json({ success: false, message: "Error generando informe" })
    }
  }

}
