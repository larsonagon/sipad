// backend/modules/segtec/segtec.validacion.tecnica.routes.js

import { SEGTECValidacionTecnicaRepository } from './segtec.validacion.tecnica.repository.js'
import { SEGTECValidacionTecnicaService } from './segtec.validacion.tecnica.service.js'
import { SEGTECValidacionTecnicaController } from './segtec.validacion.tecnica.controller.js'
import { verificarJWT } from '../../middlewares/auth.middleware.js'

export function registerSEGTECValidacionTecnicaRoutes(app, db) {

  if (!app) {
    throw new Error('Express app no proporcionado en SEGTECValidacionTecnicaRoutes')
  }

  if (!db) {
    throw new Error('DB no proporcionado en SEGTECValidacionTecnicaRoutes')
  }

  // =====================================================
  // INYECCIÓN DE DEPENDENCIAS
  // =====================================================

  const repository = SEGTECValidacionTecnicaRepository(db)
  const service = SEGTECValidacionTecnicaService(repository)
  const controller = SEGTECValidacionTecnicaController(service)

  // =====================================================
  // RUTAS
  // =====================================================

  // 🔹 Obtener validación técnica
  app.get(
    '/api/segtec/actividades/:actividadId/validacion-tecnica',
    verificarJWT,
    controller.obtener
  )

  // 🔹 Guardar / actualizar validación técnica
  app.put(
    '/api/segtec/actividades/:actividadId/validacion-tecnica',
    verificarJWT,
    controller.guardar
  )
}