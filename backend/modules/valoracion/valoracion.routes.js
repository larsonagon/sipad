// backend/modules/valoracion/valoracion.routes.js
import express from 'express'
import ValoracionRepository from './valoracion.repository.js'
import ValoracionService from './valoracion.service.js'
import ValoracionController from './valoracion.controller.js'

import { verificarJWT } from '../../middlewares/auth.middleware.js'
import { attachPermissions } from '../../middlewares/role.middleware.js'

// Diseñar/crear plantillas requiere rol administrativo
function soloAdmin(req, res, next) {
  if (req.permisos?.esSuperAdmin || req.permisos?.puedeAdministrar) return next()
  return res.status(403).json({ success: false, message: 'No autorizado para administrar plantillas' })
}

// La valoración (fichas) es tarea del archivista: Super Admin + Archivista
function soloValoracion(req, res, next) {
  if (req.permisos?.puedeVerTRD) return next()
  return res.status(403).json({ success: false, message: 'No autorizado para valorar (rol archivista)' })
}

export function buildValoracionRouter(db) {

  const router = express.Router()
  console.log('📋 VALORACIÓN ROUTER inicializado')

  const repository = new ValoracionRepository(db)
  const service = new ValoracionService(repository)
  const controller = new ValoracionController(service)

  const guard = [verificarJWT, attachPermissions]

  // Plantillas (catálogo de instrumentos por entidad)
  router.get('/plantillas', ...guard, controller.listarPlantillas)
  router.get('/plantillas/:id', ...guard, controller.obtenerPlantilla)
  router.post('/plantillas', ...guard, soloAdmin, controller.crearPlantilla)

  // Diligenciamientos (instrumentos llenados)
  router.get('/diligenciamientos', ...guard, controller.listarDiligenciamientos)
  router.post('/diligenciamientos', ...guard, controller.iniciarDiligenciamiento)
  router.get('/diligenciamientos/:id', ...guard, controller.obtenerDiligenciamiento)
  router.put('/diligenciamientos/:id/respuestas', ...guard, controller.guardarRespuestas)
  router.post('/diligenciamientos/:id/finalizar', ...guard, controller.finalizar)
  router.post('/diligenciamientos/:id/casos', ...guard, controller.agregarCaso)
  router.post('/diligenciamientos/:id/borrador-ficha', ...guard, soloValoracion, controller.generarBorradorFicha)

  // Fichas de valoración (las llena/valida el archivista)
  router.get('/fichas', ...guard, controller.listarFichas)
  router.post('/fichas', ...guard, soloValoracion, controller.crearFicha)
  router.get('/fichas/:id', ...guard, controller.obtenerFicha)
  router.put('/fichas/:id', ...guard, soloValoracion, controller.actualizarFicha)
  router.get('/fichas/:id/informe', ...guard, soloValoracion, controller.generarInforme)

  router.get('/health', (req, res) => res.json({ modulo: 'valoracion', estado: 'activo' }))

  return router
}
