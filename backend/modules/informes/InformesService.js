import { generarInformeWord } from "./InformesDocumentGenerator.js"
import {
  generarInformeExcel,
  generarResumenDependenciasExcel
} from "./InformesExcelGenerator.js"

export default class InformesService {

  constructor(repository) {
    this.repository = repository
  }

  // ======================================
  // INFORME 1
  // REGISTRO COMPLETO DE ACTIVIDADES
  // ======================================

  async obtenerInformeActividades(entidadId, filtros = {}) {
    return await this.repository.obtenerActividades(entidadId, filtros)
  }

  // ======================================
  // GENERAR WORD
  // ======================================

  async generarInformeWord(entidadId, filtros = {}) {
    const datos = await this.repository.obtenerActividades(entidadId, filtros)
    return await generarInformeWord(datos)
  }

  // ======================================
  // GENERAR EXCEL (actividades)
  // ======================================

  async generarInformeExcel(entidadId, filtros = {}) {
    const datos = await this.repository.obtenerActividades(entidadId, filtros)
    return await generarInformeExcel(datos)
  }

  // ======================================
  // INFORME 2
  // RESUMEN POR DEPENDENCIA
  // ======================================

  async obtenerResumenDependencias(entidadId, soloDependencia = null) {
    const datos = await this.repository.obtenerResumenPorDependencia(entidadId)
    return this._filtrarPorDependencia(datos, soloDependencia)
  }

  // ✅ NUEVO: Excel del resumen por dependencia
  async generarResumenDependenciasExcel(entidadId, soloDependencia = null) {
    const datos = await this.repository.obtenerResumenPorDependencia(entidadId)
    const filtrados = this._filtrarPorDependencia(datos, soloDependencia)
    return await generarResumenDependenciasExcel(filtrados)
  }

  // Rol "Jefe": limita el resumen a su propia dependencia (por nombre)
  _filtrarPorDependencia(datos, soloDependencia) {
    if (!soloDependencia) return datos
    return datos.filter(r => r.dependencia === soloDependencia)
  }

  // ======================================
  // INFORME 3
  // PRODUCCIÓN DOCUMENTAL
  // ======================================

  async obtenerProduccionDocumental(entidadId, filtros = {}) {
    return await this.repository.obtenerProduccionDocumental(entidadId, filtros)
  }

}
