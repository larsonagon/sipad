import express from 'express'
import { TRDRepository } from './trd.repository.js'
import { TRDService }    from './trd.service.js'
import { TRDController } from './trd.controller.js'

export function registerTRDRoutes(app, db) {

  const repository  = TRDRepository(db)
  const service     = TRDService(repository)
  const controller  = TRDController(service)

  const router = express.Router()

  // =====================================================
  // VERSIONES TRD
  // =====================================================

  router.get(  '/versiones',        controller.getVersions)
  router.post( '/versiones',        controller.createVersion)
  router.patch('/versiones/:id/aprobar', controller.aprobarVersion)

  // =====================================================
  // CCD — Cuadro de Clasificación Documental
  // =====================================================

  router.get('/versiones/:versionId/ccd', controller.getCCD)

  // =====================================================
  // TRD COMPLETA POR VERSIÓN
  // =====================================================

  router.get('/versiones/:versionId/trd', controller.getTRD)

  // =====================================================
  // PROCESOS
  // =====================================================

  router.get( '/procesos', controller.getProcesos)
  router.post('/procesos', controller.createProceso)

  // =====================================================
  // MACROFUNCIONES
  // =====================================================

  router.get('/macrofunciones', controller.getMacrofunciones)

  app.use('/api/trd', router)

  console.log('✅ TRD routes registradas en /api/trd')
}