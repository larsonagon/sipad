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
// INYECCIÓN DE DEPENDENCIAS
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
// CONTROLADOR PDF
// =====================================================

const pdfController = SEGTECPDFController(
  actividadesService
)

// =====================================================
// ACTIVIDADES (PROTEGIDAS)
// =====================================================

router.get(
  '/actividades',
  
  actividadesController.listarPorDependencia
)

router.post(
  '/actividades',
  
  actividadesController.crear
)

router.delete(
  '/actividades/:id',
  
  actividadesController.eliminar
)

router.put(
  '/actividades/:id/tecnico',
  
  actividadesController.actualizarCamposTecnicos
)

// =====================================================
// PDF ACTIVIDAD
// ⚠️ SIN JWT PARA PERMITIR DESCARGA DIRECTA
// =====================================================

router.get(
  '/actividades/:id/pdf',
  pdfController.generar
)

// =====================================================
// ANÁLISIS SEG-TEC
// =====================================================

router.post(
  '/actividades/:id/analizar',
  
  actividadesController.analizar
)

// =====================================================
// HISTÓRICO DE ANÁLISIS
// =====================================================

router.get(
  '/actividades/:id/analisis',
  
  actividadesController.listarAnalisis
)

// =====================================================
// COMPLETAR ACTIVIDAD
// =====================================================

router.post(
  '/actividades/:id/completar',
  
  actividadesController.marcarCompleta
)

// =====================================================
// GUARDAR SUGERENCIA
// =====================================================

router.post(
  '/actividades/:id/sugerencia',
  
  actividadesController.guardarSugerencia
)

// =====================================================
// VALIDACIÓN TÉCNICA
// =====================================================

router.get(
  '/actividades/:actividadId/validacion-tecnica',
  
  validacionController.obtener
)

router.put(
  '/actividades/:actividadId/validacion-tecnica',
  
  validacionController.guardar
)

export default router