import express from 'express'

import { SEGTECPropuestasRepository } from './segtec.propuestas.repository.js'
import { SEGTECPropuestasService } from './segtec.propuestas.service.js'
import { SEGTECPropuestasController } from './segtec.propuestas.controller.js'

import { TRDAIRepository } from '../trd-ai/trd-ai.repository.js'
import { TRDAIService } from '../trd-ai/trd-ai.service.js'

import { verificarJWT } from '../../middlewares/auth.middleware.js'

export function registerSEGTECPropuestasRoutes(app, db) {

  const router = express.Router()

  // =====================================================
  // INYECTAR DEPENDENCIAS
  // =====================================================

  const trdRepo = TRDAIRepository(db)
  const trdService = TRDAIService(trdRepo)

  const repository = SEGTECPropuestasRepository(db)
  const service =
    SEGTECPropuestasService(repository, trdService, db)

  const controller =
    SEGTECPropuestasController(service)

  // =====================================================
  // GENERAR PROPUESTAS DESDE FORMULARIO
  // =====================================================

  router.post(
    '/:formularioId/generar',
    
    controller.generar
  )

  // =====================================================
  // LISTAR PROPUESTAS
  // =====================================================

  router.get(
    '/:formularioId',
    
    controller.listar
  )

  // =====================================================
  // APROBAR
  // =====================================================

  router.patch(
    '/:id/aprobar',
    
    controller.aprobar
  )

  // =====================================================
  // RECHAZAR
  // =====================================================

  router.patch(
    '/:id/rechazar',
    
    controller.rechazar
  )

  // =====================================================
  // REGISTRO FINAL
  // =====================================================

  app.use('/api/segtec/propuestas', router)
}
