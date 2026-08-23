import express from 'express'
import { verificarJWT } from '../../middlewares/auth.middleware.js'
import { requireLevel } from '../../middlewares/role.middleware.js'
import { registrarExport } from './trd-ai.export.js'
import { registrarValidador } from './trd-ai.validador.js'
import { registrarValoracion } from './trd-ai.valoracion.js'
import { registrarAprendizaje } from './trd-ai.aprendizaje.js'
import { registrarCCD } from './trd-ai.ccd.js'
import { registrarBiblioteca } from './trd-ai.biblioteca.js'
import { registrarConvalidacion } from './trd-ai.convalidacion.js'
import { registrarExpediente } from './trd-ai.expediente.js'

export function registerTRDAIRoutes(app, controller, db) {

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
  // CURACIÓN EN LOTE (aprobar/rechazar/renombrar varias)
  // Deben ir ANTES de las rutas con :id.
  // =====================================================

  router.post(
    '/series-propuestas/estado-lote',
    requireLevel(60),
    controller.estadoLote
  )

  router.post(
    '/series-propuestas/editar-lote',
    requireLevel(60),
    controller.editarLote
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
  // EXPORT DE TRD (Formato Único – Excel / Word)
  //   GET /api/trd-ai/export/xlsx
  //   GET /api/trd-ai/export/docx
  // =====================================================
  if (db) registrarExport(router, db, requireLevel(60))

  // =====================================================
  // VALIDADOR NORMATIVO (pre-comité)
  //   GET /api/trd-ai/validar
  // =====================================================
  if (db) registrarValidador(router, db, requireLevel(60))

  // =====================================================
  // VALORACIÓN JUSTIFICADA (retención + disposición + fundamento)
  //   POST /api/trd-ai/valorar-lote  { ids? }
  // =====================================================
  if (db) registrarValoracion(router, db, requireLevel(60))

  // =====================================================
  // APRENDIZAJE (estadísticas del motor que aprende)
  //   GET /api/trd-ai/aprendizaje
  // =====================================================
  if (db) registrarAprendizaje(router, db, requireLevel(60))

  // =====================================================
  // CCD codificado (Cuadro de Clasificación Documental)
  //   GET /api/trd-ai/ccd/xlsx  ·  /api/trd-ai/ccd/docx
  // =====================================================
  if (db) registrarCCD(router, db, requireLevel(60))

  // =====================================================
  // BIBLIOTECA DE TRD DE REFERENCIA
  //   GET  /api/trd-ai/biblioteca
  //   GET  /api/trd-ai/biblioteca/:tipo/preview
  //   POST /api/trd-ai/biblioteca/:tipo/precargar
  // =====================================================
  if (db) registrarBiblioteca(router, db, requireLevel(60))

  // =====================================================
  // CONVALIDACIÓN (flujo post-comité: estado + observaciones)
  //   GET/PATCH /api/trd-ai/convalidacion
  //   .../convalidacion/observaciones (GET/POST) + :id/resolver|reabrir|DELETE
  // =====================================================
  if (db) registrarConvalidacion(router, db, requireLevel(60))

  // =====================================================
  // EXPEDIENTE DE CONVALIDACIÓN (acta del comité + oficio)
  //   GET /api/trd-ai/convalidacion/acta.docx
  //   GET /api/trd-ai/convalidacion/oficio.docx
  // =====================================================
  if (db) registrarExpediente(router, db, requireLevel(60))

  // =====================================================
  // REGISTRO DE RUTAS
  // =====================================================

  app.use('/api/trd-ai', router)

}