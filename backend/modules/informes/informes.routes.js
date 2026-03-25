import express from 'express'
import InformesRepository from './InformesRepository.js'
import InformesService from './InformesService.js'
import InformesController from './InformesController.js'

export function buildInformesRouter(db) {

  const router = express.Router()

  console.log('📊 INFORMES ROUTER inicializado')

  const repository = new InformesRepository(db)
  const service = new InformesService(repository)
  const controller = new InformesController(service)

  // ======================================
  // INFORME 1
  // REGISTRO COMPLETO DE ACTIVIDADES
  // ======================================

  router.get(
    '/actividades',
    controller.obtenerActividades
  )

  router.get(
    '/registro-actividades-word',
    controller.generarWord
  )

  router.get(
    '/registro-actividades-excel',
    controller.generarExcel
  )

  // ======================================
  // INFORME 2
  // RESUMEN POR DEPENDENCIA
  // ======================================

  router.get(
    '/dependencias',
    controller.obtenerResumenDependencias
  )

  // ======================================
  // INFORME 3
  // PRODUCCIÓN DOCUMENTAL
  // ======================================

  router.get(
    '/produccion-documental',
    controller.obtenerProduccionDocumental
  )

  // ======================================
  // HEALTHCHECK
  // ======================================

  router.get('/health', (req, res) => {

    res.json({
      modulo: 'informes',
      estado: 'activo'
    })

  })

  return router

}