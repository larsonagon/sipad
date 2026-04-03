import express from 'express'
import { verificarJWT } from '../../middlewares/auth.middleware.js'
import { db } from '../../db/database.js'
import crypto from 'crypto'

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
const trdAIService    = TRDAIService(trdAIRepository)

const actividadesRepository = SEGTECActividadesRepository(db)
const validacionRepository  = SEGTECValidacionTecnicaRepository(db)

const actividadesService = SEGTECActividadesService(
  actividadesRepository,
  validacionRepository,
  trdAIService
)

const actividadesController = SEGTECActividadesController(
  actividadesService
)

const validacionService = SEGTECValidacionTecnicaService(
  validacionRepository,
  actividadesRepository
)

const validacionController = SEGTECValidacionTecnicaController(
  validacionService
)

const pdfController = SEGTECPDFController(
  actividadesService
)

// =====================================================
// CONFIGURACIÓN FUNCIONAL
// =====================================================

router.get('/configuracion', async (req, res) => {

  try {

    const usuarioId = parseInt(req.user.sub)

    const usuario = await db.get(
      `SELECT id_dependencia FROM usuarios WHERE id = ?`,
      [usuarioId]
    )

    if (!usuario || !usuario.id_dependencia) {
      return res.status(400).json({ ok: false, error: 'Usuario sin dependencia asignada' })
    }

    const idDependencia = usuario.id_dependencia

    const config = await db.get(
      `SELECT * FROM segtec_configuracion_dependencia
       WHERE id_dependencia = ? AND activa = 1
       ORDER BY version DESC
       LIMIT 1`,
      [idDependencia]
    )

    if (!config) {
      return res.status(404).json({ ok: false, error: 'Configuración no encontrada' })
    }

    res.json({ ok: true, configuracion: config })

  } catch (err) {
    console.error('Error obteniendo configuración segtec:', err)
    res.status(500).json({ ok: false, error: 'Error del servidor' })
  }

})

router.post('/configuracion', async (req, res) => {

  try {

    const usuarioId = parseInt(req.user.sub)

    const usuario = await db.get(
      `SELECT id_dependencia FROM usuarios WHERE id = ?`,
      [usuarioId]
    )

    if (!usuario || !usuario.id_dependencia) {
      return res.status(400).json({ ok: false, error: 'Usuario sin dependencia asignada' })
    }

    const idDependencia = usuario.id_dependencia

    const {
      tipo_funcion,
      nivel_decisorio,
      recibe_solicitudes,
      emite_actos,
      produce_decisiones,
      procesos_principales,
      tramites_frecuentes,
      tipo_decisiones,
      tipos_documentales,
      otros_documentos,
      descripcion_funcional
    } = req.body

    await db.run(
      `UPDATE segtec_configuracion_dependencia
       SET activa = 0
       WHERE id_dependencia = ? AND activa = 1`,
      [idDependencia]
    )

    const ultima = await db.get(
      `SELECT COALESCE(MAX(version), 0) AS max_version
       FROM segtec_configuracion_dependencia
       WHERE id_dependencia = ?`,
      [idDependencia]
    )

    const nuevaVersion = (ultima?.max_version ?? 0) + 1
    const nuevoId = crypto.randomUUID()

    const tiposJSON = JSON.stringify(
      Array.isArray(tipos_documentales) ? tipos_documentales : []
    )

    await db.run(
      `INSERT INTO segtec_configuracion_dependencia
       (id, id_dependencia, version, activa,
        tipo_funcion, nivel_decisorio,
        recibe_solicitudes, emite_actos, produce_decisiones,
        procesos_principales, tramites_frecuentes, tipo_decisiones,
        tipos_documentales, otros_documentos, descripcion_funcional,
        creado_por, created_at)
       VALUES (?, ?, ?, 1, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())`,
      [
        nuevoId, idDependencia, nuevaVersion,
        tipo_funcion          || null,
        nivel_decisorio       || null,
        recibe_solicitudes    ? 1 : 0,
        emite_actos           ? 1 : 0,
        produce_decisiones    ? 1 : 0,
        procesos_principales  || '',
        tramites_frecuentes   || '',
        tipo_decisiones       || '',
        tiposJSON,
        otros_documentos      || '',
        descripcion_funcional || '',
        usuarioId
      ]
    )

    res.json({ ok: true })

  } catch (err) {
    console.error('Error guardando configuración segtec:', err)
    res.status(500).json({ ok: false, error: 'Error del servidor' })
  }

})

// =====================================================
// ACTIVIDADES – LISTAR Y CREAR
// =====================================================

router.get('/actividades', actividadesController.listar)

router.post('/actividades', actividadesController.crear)

router.delete('/actividades/:id', actividadesController.eliminar)

// =====================================================
// ACTIVIDAD POR ID
// =====================================================

router.get('/actividades/:id', actividadesController.obtenerPorId)

// =====================================================
// ✅ BLOQUES (rutas que el frontend usa al guardar)
// =====================================================

router.put('/actividades/:id/bloque1', actividadesController.actualizarBloque1)

router.put('/actividades/:id/bloque2', actividadesController.actualizarBloque2)

router.put('/actividades/:id/bloque3', actividadesController.actualizarBloque3)

// =====================================================
// RUTA LEGACY (se mantiene por compatibilidad)
// =====================================================

router.put('/actividades/:id/tecnico', actividadesController.actualizar)

// =====================================================
// PDF
// =====================================================

router.get('/actividades/:id/pdf', pdfController.generar)

// =====================================================
// ANÁLISIS
// =====================================================

router.post('/actividades/:id/analizar', actividadesController.analizar)

router.get('/actividades/:id/analisis', actividadesController.listarAnalisis)

// =====================================================
// COMPLETAR
// =====================================================

router.post('/actividades/:id/completar', actividadesController.marcarCompleta)

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