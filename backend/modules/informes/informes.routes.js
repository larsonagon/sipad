import express from 'express'
import InformesRepository from './InformesRepository.js'
import InformesService from './InformesService.js'
import InformesController from './InformesController.js'

import { verificarJWT } from '../../middlewares/auth.middleware.js'
import { attachPermissions, requireInformes } from '../../middlewares/role.middleware.js'

export function buildInformesRouter(db) {

  const router = express.Router()

  console.log('📊 INFORMES ROUTER inicializado')

  const repository = new InformesRepository(db)
  const service = new InformesService(repository)
  const controller = new InformesController(service)

  // Middlewares comunes a todo el módulo
  const guard = [verificarJWT, attachPermissions, requireInformes]

  // ======================================
  // INFORME 1 — REGISTRO COMPLETO DE ACTIVIDADES
  // ======================================

  router.get('/actividades', ...guard, controller.obtenerActividades)
  router.get('/registro-actividades-word', ...guard, controller.generarWord)
  router.get('/registro-actividades-excel', ...guard, controller.generarExcel)

  // ======================================
  // INFORME 2 — RESUMEN POR DEPENDENCIA
  // ======================================

  router.get('/dependencias', ...guard, controller.obtenerResumenDependencias)
  router.get('/dependencias-excel', ...guard, controller.generarResumenDependenciasExcel)

  // ======================================
  // INFORME 3 — PRODUCCIÓN DOCUMENTAL
  // ======================================

  router.get('/produccion-documental', ...guard, controller.obtenerProduccionDocumental)

  // ======================================
  // HEALTHCHECK
  // ======================================

  router.get('/health', (req, res) => {
    res.json({ modulo: 'informes', estado: 'activo' })
  })

  return router
}
