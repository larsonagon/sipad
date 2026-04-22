import express from 'express'
import { verificarJWT } from '../../middlewares/auth.middleware.js'
import { requireLevel } from '../../middlewares/role.middleware.js'

export function registerTRDAIRoutes(app, controller) {

  const router = express.Router()

  // =====================================================
  // DASHBOARD TRD-AI
  // =====================================================

  router.get(
    '/dashboard',
    requireLevel(60),
    controller.obtenerDashboardTRDAI
  )

  // =====================================================
  // ANALIZAR ACTIVIDADES SEG-TEC
  // =====================================================

  router.get(
    '/analizar',
    controller.analizarSeries
  )

  // =====================================================
  // GENERAR PROPUESTAS DE SERIES
  // =====================================================

  router.post(
    '/generar-propuestas',
    requireLevel(60),
    controller.generarPropuestas
  )

  // =====================================================
  // LISTAR PROPUESTAS GENERADAS
  // =====================================================

  router.get(
    '/series-propuestas',
    requireLevel(60),
    controller.listarPropuestas
  )

  // =====================================================
  // EDITAR PROPUESTA (serie, subserie, tipologías)
  // =====================================================

  router.patch(
    '/series-propuestas/:id/editar',
    requireLevel(60),
    controller.editarPropuesta
  )

  // =====================================================
  // APROBAR PROPUESTA
  // =====================================================

  router.patch(
    '/series-propuestas/:id/aprobar',
    requireLevel(60),
    controller.aprobarPropuesta
  )

  // =====================================================
  // RECHAZAR PROPUESTA
  // =====================================================

  router.patch(
    '/series-propuestas/:id/rechazar',
    requireLevel(60),
    controller.rechazarPropuesta
  )

  // =====================================================
  // INCORPORAR A TRD OFICIAL
  // =====================================================

  router.post(
    '/series-propuestas/:id/incorporar',
    requireLevel(60),
    controller.incorporarASerieOficial
  )

  // =====================================================
  // REGLAS DE RETENCIÓN DOCUMENTAL
  // =====================================================

  router.post(
    '/series-propuestas/:propuestaId/retencion',
    requireLevel(60),
    controller.guardarReglaRetencion
  )

  router.get(
    '/series-propuestas/:propuestaId/retencion',
    requireLevel(60),
    controller.obtenerReglaRetencion
  )

  // =====================================================
  // SUGERENCIA AUTOMÁTICA DE RETENCIÓN
  // =====================================================

  router.get(
    '/series-propuestas/:propuestaId/retencion-automatica',
    requireLevel(60),
    controller.sugerirRetencionAutomatica
  )

  // =====================================================
  // REGISTRO DE RUTAS
  // =====================================================

  app.use('/api/trd-ai', router)

}