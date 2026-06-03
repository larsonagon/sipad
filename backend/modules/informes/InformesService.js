import { generarInformeWord } from "./InformesDocumentGenerator.js"
import { generarInformeExcel } from "./InformesExcelGenerator.js"

export default class InformesService {

  constructor(repository) {
    this.repository = repository
  }

  // ======================================
  // INFORME 1
  // REGISTRO COMPLETO DE ACTIVIDADES
  // ======================================

  async obtenerInformeActividades(entidadId, filtros = {}) {

    return await this.repository.obtenerActividades(
      entidadId,
      filtros
    )

  }

  // ======================================
  // GENERAR WORD
  // ======================================

  async generarInformeWord(entidadId, filtros = {}) {

    const datos =
      await this.repository.obtenerActividades(
        entidadId,
        filtros
      )

    return await generarInformeWord(datos)

  }

  // ======================================
  // GENERAR EXCEL
  // ======================================

  async generarInformeExcel(entidadId, filtros = {}) {

    const datos =
      await this.repository.obtenerActividades(
        entidadId,
        filtros
      )

    return await generarInformeExcel(datos)

  }


  // ======================================
  // INFORME 2
  // RESUMEN POR DEPENDENCIA
  // ======================================

  async obtenerResumenDependencias(entidadId) {

    const resultados =
      await this.repository.obtenerResumenPorDependencia(entidadId)

    return resultados

  }

  

  // ======================================
  // INFORME 3
  // PRODUCCIÓN DOCUMENTAL
  // ======================================

  async obtenerProduccionDocumental(entidadId, filtros = {}) {
    return await this.repository.obtenerProduccionDocumental(
      entidadId,
      filtros
    )
  }

}