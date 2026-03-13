import express from 'express'

export function registerTRDRoutes(app, controller) {

  const router = express.Router()

  // =========================
  // VERSIONES TRD
  // =========================

  router.post('/version', controller.createVersion)
  router.get('/version', controller.getVersions)

  // =========================
  // PROCESOS
  // =========================

  router.get('/procesos', controller.getProcesos)
  router.post('/procesos', controller.createProceso)

  app.use('/api/trd', router)
}
