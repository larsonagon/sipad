import express from 'express'
import InformesRepository from './InformesRepository.js'
import InformesService from './InformesService.js'
import InformesController from './InformesController.js'

// 🔥 NUEVO (middleware de seguridad)
import { verificarJWT } from '../../middlewares/auth.middleware.js'
import { attachPermissions, requireInformes } from '../../middlewares/role.middleware.js'

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
    verificarJWT,
    attachPermissions,
    requireInformes,
    controller.obtenerActividades
  )

  router.get(
    '/registro-actividades-word',
    verificarJWT,
    attachPermissions,
    requireInformes,
    controller.generarWord
  )

  router.get(
    '/registro-actividades-excel',
    verificarJWT,
    attachPermissions,
    requireInformes,
    controller.generarExcel
  )

  // ======================================
  // INFORME 2
  // RESUMEN POR DEPENDENCIA
  // ======================================

  router.get(
    '/dependencias',
    verificarJWT,
    attachPermissions,
    requireInformes,
    controller.obtenerResumenDependencias
  )

  // ======================================
  // INFORME 3
  // PRODUCCIÓN DOCUMENTAL
  // ======================================

  router.get(
    '/produccion-documental',
    verificarJWT,
    attachPermissions,
    requireInformes,
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