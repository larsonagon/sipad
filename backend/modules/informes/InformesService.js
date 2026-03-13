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

  async obtenerInformeActividades(filtros = {}) {

    const resultados =
      await this.repository.obtenerActividades(filtros)

    return resultados

  }

  // ======================================
  // GENERAR WORD
  // ======================================

  async generarInformeWord(filtros = {}) {

    const datos =
      await this.repository.obtenerActividades(filtros)

    const buffer =
      await generarInformeWord(datos)

    return buffer

  }

  // ======================================
  // GENERAR EXCEL
  // ======================================

  async generarInformeExcel(filtros = {}) {

    const datos =
      await this.repository.obtenerActividades(filtros)

    const buffer =
      await generarInformeExcel(datos)

    return buffer

  }

  // ======================================
  // INFORME 2
  // RESUMEN POR DEPENDENCIA
  // ======================================

  async obtenerResumenDependencias() {

    const resultados =
      await this.repository.obtenerResumenPorDependencia()

    return resultados

  }

  // ======================================
  // INFORME 3
  // PRODUCCIÓN DOCUMENTAL
  // ======================================

  async obtenerProduccionDocumental(filtros = {}) {

    return await this.repository.obtenerProduccionDocumental(filtros)

  }

}