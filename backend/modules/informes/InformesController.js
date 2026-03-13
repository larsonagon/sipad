export default class InformesController {

  constructor(service) {
    this.service = service
  }

  // =====================================
  // UTILIDAD: EXTRAER FILTROS
  // =====================================

  obtenerFiltros(req) {

    return {
      funcionario: req.query.funcionario,
      dependencia: req.query.dependencia,
      proceso: req.query.proceso,
      fechaInicio: req.query.fechaInicio,
      fechaFin: req.query.fechaFin
    }

  }

  // =====================================
  // INFORME 1
  // CONSULTA DE ACTIVIDADES
  // =====================================

  obtenerActividades = async (req, res) => {

    try {

      const filtros = this.obtenerFiltros(req)

      const datos =
        await this.service.obtenerInformeActividades(filtros)

      res.json({
        success: true,
        total: datos.length,
        data: datos
      })

    } catch (error) {

      console.error("Error informe actividades:", error)

      res.status(500).json({
        success: false,
        message: "Error generando informe"
      })

    }

  }

  // =====================================
  // INFORME 2
  // RESUMEN POR DEPENDENCIA
  // =====================================

  obtenerResumenDependencias = async (req, res) => {

    try {

      const datos =
        await this.service.obtenerResumenDependencias()

      res.json({
        success: true,
        total: datos.length,
        data: datos
      })

    } catch (error) {

      console.error("Error resumen dependencias:", error)

      res.status(500).json({
        success: false,
        message: "Error generando informe por dependencia"
      })

    }

  }

  // =====================================
  // GENERAR WORD
  // =====================================

  generarWord = async (req, res) => {

    try {

      const filtros = this.obtenerFiltros(req)

      const buffer =
        await this.service.generarInformeWord(filtros)

      res.setHeader(
        "Content-Type",
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
      )

      res.setHeader(
        "Content-Disposition",
        "attachment; filename=informe_actividades.docx"
      )

      res.send(buffer)

    } catch (error) {

      console.error("Error generando Word:", error)

      res.status(500).json({
        success: false,
        message: "Error generando informe Word"
      })

    }

  }

  // =====================================
  // GENERAR EXCEL
  // =====================================

  generarExcel = async (req, res) => {

    try {

      const filtros = this.obtenerFiltros(req)

      const buffer =
        await this.service.generarInformeExcel(filtros)

      res.setHeader(
        "Content-Type",
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
      )

      res.setHeader(
        "Content-Disposition",
        "attachment; filename=informe_actividades.xlsx"
      )

      res.send(buffer)

    } catch (error) {

      console.error("Error generando Excel:", error)

      res.status(500).json({
        success: false,
        message: "Error generando informe Excel"
      })

    }

  }

  // =====================================
  // PRODUCCIÓN DOCUMENTAL
  // =====================================

  obtenerProduccionDocumental = async (req, res) => {

    try {

      const filtros = this.obtenerFiltros(req)

      const datos =
        await this.service.obtenerProduccionDocumental(filtros)

      res.json({
        success: true,
        total: datos.length,
        data: datos
      })

    } catch (error) {

      console.error("Error informe producción documental:", error)

      res.status(500).json({
        success: false,
        message: "Error generando informe"
      })

    }

  }

}