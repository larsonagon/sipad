// backend/modules/valoracion/valoracion.service.js
import { generarBorradorDesdeEvidencia } from './valoracion.reglas.js'
import { generarInformeValoracion } from './valoracion.informe.js'
import { cargarReferentes } from './valoracion.referentes.js'

export default class ValoracionService {

  constructor(repository) {
    this.repository = repository
  }

  listarPlantillas(entidadId, opts) {
    return this.repository.listarPlantillas(entidadId, opts)
  }

  // Catálogo de referentes por sector (línea base de valoración)
  listarReferentes() {
    return cargarReferentes()
  }

  obtenerPlantilla(plantillaId, entidadId) {
    return this.repository.obtenerPlantillaCompleta(plantillaId, entidadId)
  }

  crearPlantillaCompleta(entidadId, estructura) {
    if (!estructura?.nombre) throw new Error('La plantilla requiere un nombre')
    return this.repository.crearPlantillaCompleta(entidadId, estructura)
  }

  // -------- Diligenciamientos --------

  async iniciarDiligenciamiento(entidadId, { plantillaId, dependenciaId, usuarioId, titulo }) {
    const plantilla = await this.repository.obtenerPlantillaBase(plantillaId, entidadId)
    if (!plantilla) throw new Error('Plantilla no encontrada para esta entidad')
    return this.repository.crearDiligenciamiento({ plantillaId, entidadId, dependenciaId, usuarioId, titulo })
  }

  listarDiligenciamientos(entidadId, opts) {
    return this.repository.listarDiligenciamientos(entidadId, opts)
  }

  obtenerDiligenciamiento(id, entidadId) {
    return this.repository.obtenerDiligenciamiento(id, entidadId)
  }

  // Guarda un lote de respuestas: [{ preguntaId, valor, valorJson }]
  async guardarRespuestas(diligenciamientoId, entidadId, respuestas = []) {
    if (!(await this.repository.pertenece(diligenciamientoId, entidadId))) {
      throw new Error('Diligenciamiento no encontrado para esta entidad')
    }
    for (const r of respuestas) {
      if (!r.preguntaId) continue
      await this.repository.guardarRespuesta(diligenciamientoId, r.preguntaId, r.valor ?? null, r.valorJson ?? null)
    }
    return { guardadas: respuestas.length }
  }

  async finalizar(diligenciamientoId, entidadId) {
    if (!(await this.repository.pertenece(diligenciamientoId, entidadId))) {
      throw new Error('Diligenciamiento no encontrado para esta entidad')
    }
    await this.repository.cambiarEstadoDiligenciamiento(diligenciamientoId, entidadId, 'finalizado')
    return { estado: 'finalizado' }
  }

  // -------- Casos --------

  async agregarCaso(diligenciamientoId, entidadId, caso) {
    if (!(await this.repository.pertenece(diligenciamientoId, entidadId))) {
      throw new Error('Diligenciamiento no encontrado para esta entidad')
    }
    const casoId = await this.repository.crearCaso(diligenciamientoId, caso)
    let orden = 0
    for (const doc of (caso.documentos || [])) {
      await this.repository.agregarDocumentoCaso(casoId, { ...doc, orden: orden++ })
    }
    return { id: casoId }
  }

  // -------- Fichas de valoración --------

  crearFicha(entidadId, data) {
    return this.repository.crearFicha(entidadId, data || {})
  }

  listarFichas(entidadId) {
    return this.repository.listarFichas(entidadId)
  }

  obtenerFicha(id, entidadId) {
    return this.repository.obtenerFicha(id, entidadId)
  }

  async actualizarFicha(id, entidadId, data) {
    if (!(await this.repository.pertenceFicha(id, entidadId))) {
      throw new Error('Ficha no encontrada para esta entidad')
    }
    await this.repository.actualizarFicha(id, entidadId, data || {})
    return this.repository.obtenerFicha(id, entidadId)
  }

  // -------- Motor de reglas: borrador de ficha desde la evidencia --------

  async generarBorradorFicha(diligenciamientoId, entidadId) {
    const dil = await this.repository.obtenerDiligenciamiento(diligenciamientoId, entidadId)
    if (!dil) throw new Error('Diligenciamiento no encontrado para esta entidad')

    const plantilla = await this.repository.obtenerPlantillaCompleta(dil.plantilla_id, entidadId)
    if (!plantilla) throw new Error('Plantilla no encontrada')

    const borrador = generarBorradorDesdeEvidencia(plantilla, dil)
    const notas = borrador._notas || []
    delete borrador._notas

    const id = await this.repository.crearFicha(entidadId, borrador)
    return { id, notas }
  }

  // -------- Informe Técnico de Valoración (Word) --------

  async generarInforme(fichaId, entidadId) {
    const ficha = await this.repository.obtenerFicha(fichaId, entidadId)
    if (!ficha) throw new Error('Ficha no encontrada para esta entidad')
    let dil = null
    if (ficha.diligenciamiento_id) {
      dil = await this.repository.obtenerDiligenciamiento(ficha.diligenciamiento_id, entidadId)
    }
    const buffer = await generarInformeValoracion(ficha, dil)
    const nombre = [ficha.serie, ficha.subserie].filter(Boolean).join('_').replace(/\s+/g, '_') || 'valoracion'
    return { buffer, nombre }
  }
}
