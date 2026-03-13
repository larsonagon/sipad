import express from 'express'
import { verificarJWT } from '../../middlewares/auth.middleware.js'
import { db } from '../../db/database.js'

import { SEGTECActividadesRepository } from './segtec.actividades.repository.js'
import { SEGTECActividadesService } from './segtec.actividades.service.js'
import { SEGTECActividadesController } from './segtec.actividades.controller.js'

import { SEGTECValidacionTecnicaRepository } from './segtec.validacion.tecnica.repository.js'
import { SEGTECValidacionTecnicaService } from './segtec.validacion.tecnica.service.js'
import { SEGTECValidacionTecnicaController } from './segtec.validacion.tecnica.controller.js'

import { SEGTECPDFController } from './segtec.pdf.controller.js'

import { TRDAIRepository } from '../trd-ai/trd-ai.repository.js'
import { TRDAIService } from '../trd-ai/trd-ai.service.js'

console.log('🔥 SEGTEC ROUTER CARGADO')

const router = express.Router()

// =====================================================
// INYECCIÓN DEPENDENCIAS
// =====================================================

const trdAIRepository = TRDAIRepository(db)
const trdAIService = TRDAIService(trdAIRepository)

const actividadesRepository = SEGTECActividadesRepository(db)

const actividadesService = SEGTECActividadesService(
  actividadesRepository,
  trdAIService
)

const actividadesController = SEGTECActividadesController(
  actividadesService
)

const validacionRepository = SEGTECValidacionTecnicaRepository(db)

const validacionService =
  SEGTECValidacionTecnicaService(validacionRepository)

const validacionController =
  SEGTECValidacionTecnicaController(validacionService)

// =====================================================
// PDF
// =====================================================

const pdfController = SEGTECPDFController(
  actividadesService
)

// =====================================================
// ACTIVIDADES
// =====================================================

router.get(
  '/actividades',
  verificarJWT,
  actividadesController.listarPorDependencia
)

router.post(
  '/actividades',
  verificarJWT,
  actividadesController.crear
)

router.delete(
  '/actividades/:id',
  verificarJWT,
  actividadesController.eliminar
)

router.put(
  '/actividades/:id/tecnico',
  verificarJWT,
  actividadesController.actualizarCamposTecnicos
)

// =====================================================
// GENERAR PDF ACTIVIDAD
// =====================================================

router.get(
  '/actividades/:id/pdf',
  verificarJWT,
  pdfController.generar
)

// =====================================================
// 🔥 ANÁLISIS SEG-TEC (usa TRD-AI)
// =====================================================

router.post(
  '/actividades/:id/analizar',
  verificarJWT,
  actividadesController.analizar
)

// =====================================================
// HISTÓRICO DE ANÁLISIS
// =====================================================

router.get(
  '/actividades/:id/analisis',
  verificarJWT,
  actividadesController.listarAnalisis
)

// =====================================================
// COMPLETAR ACTIVIDAD
// =====================================================

router.post(
  '/actividades/:id/completar',
  verificarJWT,
  actividadesController.marcarCompleta
)

// =====================================================
// GUARDAR SUGERENCIA
// =====================================================

router.post(
  '/actividades/:id/sugerencia',
  verificarJWT,
  actividadesController.guardarSugerencia
)

// =====================================================
// VALIDACIÓN TÉCNICA
// =====================================================

router.get(
  '/actividades/:actividadId/validacion-tecnica',
  verificarJWT,
  validacionController.obtener
)

router.put(
  '/actividades/:actividadId/validacion-tecnica',
  verificarJWT,
  validacionController.guardar
)

export default router