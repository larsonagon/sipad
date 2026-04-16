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
import { generarPDFActividad } from './segtec.pdf.service.js'

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
// HELPER: normalizar y resolver dependencias
// =====================================================

function normalizarDependencias(valor) {

  if (!valor) return []

  let arr = valor

  if (typeof valor === 'string') {
    try {
      arr = JSON.parse(valor)
    } catch {
      return valor.split(',').map(x => ({
        id: x.trim(),
        nombre: null
      }))
    }
  }

  if (!Array.isArray(arr)) return []

  return arr.map(item => {
    if (typeof item === 'object' && item !== null) {
      return { id: item.id, nombre: item.nombre || null }
    }
    return { id: item, nombre: null }
  })
}

async function resolverDependenciasEnActividad(actividad) {

  if (!actividad) return actividad

  try {

    const depsRaw = normalizarDependencias(actividad.dependencias_relacionadas)

    if (depsRaw.length > 0) {

      // Traer TODAS las dependencias en un solo query
      const todasDeps = await db.all('SELECT id, nombre FROM dependencias')
      const mapaDeps = {}
      for (const d of todasDeps) {
        mapaDeps[String(d.id)] = d.nombre
      }

      const resueltas = depsRaw.map(dep => {
        if (dep.nombre) return { id: dep.id, nombre: dep.nombre }
        const nombre = mapaDeps[String(dep.id)]
        return { id: dep.id, nombre: nombre || `Dependencia ${dep.id}` }
      })

      actividad.dependencias_relacionadas = JSON.stringify(resueltas)
    }

  } catch (err) {
    console.error('[SEGTEC] Error resolviendo dependencias:', err)
  }

  return actividad
}

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
// ACTIVIDAD POR ID (con resolución de dependencias)
// =====================================================

router.get('/actividades/:id', async (req, res) => {

  try {

    const usuarioId =
      req.user?.id ||
      req.user?.usuario_id ||
      req.user?.sub ||
      null

    if (!usuarioId) {
      return res.status(401).json({ ok: false, error: 'No autenticado' })
    }

    const actividad = await actividadesService.obtenerPorId(
      req.params.id,
      usuarioId
    )

    if (!actividad) {
      return res.status(404).json({ ok: false, error: 'Actividad no encontrada' })
    }

    // Resolver nombres de dependencias
    await resolverDependenciasEnActividad(actividad)

    return res.status(200).json({ ok: true, data: actividad })

  } catch (err) {
    console.error('SEGTEC obtener por id error:', err)
    return res.status(500).json({ ok: false, error: err.message })
  }

})

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
// PDF (con resolución de dependencias y cargo)
// =====================================================

router.get('/actividades/:id/pdf', async (req, res) => {

  try {

    const usuarioId =
      req.user?.id ||
      req.user?.usuario_id ||
      req.user?.sub ||
      null

    if (!usuarioId) {
      return res.status(401).json({ ok: false, error: 'No autenticado' })
    }

    const actividad = await actividadesService.obtenerPorId(
      req.params.id,
      usuarioId
    )

    if (!actividad) {
      return res.status(404).json({ ok: false, error: 'Actividad no encontrada' })
    }

    if (actividad.validacion) {
      actividad.genera_expediente_propio =
        actividad.validacion.genera_expediente_propio
    }

    // ── Resolver dependencias a texto ──
    const depsRaw = normalizarDependencias(actividad.dependencias_relacionadas)

    if (depsRaw.length > 0) {

      const todasDeps = await db.all('SELECT id, nombre FROM dependencias')
      const mapaDeps = {}
      for (const d of todasDeps) {
        mapaDeps[String(d.id)] = d.nombre
      }

      const nombres = depsRaw.map(dep => {
        if (dep.nombre) return dep.nombre
        return mapaDeps[String(dep.id)] || `Dependencia ${dep.id}`
      })

      actividad.dependencias_relacionadas = nombres.join(', ')

    } else {
      actividad.dependencias_relacionadas = ''
    }

    // ── Resolver cargo custodia ──
    if (actividad.cargo_custodia) {

      const cargo = await db.get(
        'SELECT nombre FROM cargos WHERE id = ?',
        [actividad.cargo_custodia]
      )

      if (cargo) {
        actividad.cargo_custodia = cargo.nombre
      }
    }

    actividad.volumen_categoria =
      actividad.volumen_categoria ||
      actividad.volumen_documental ||
      ''

    actividad.custodia_tipo =
      actividad.custodia_tipo ||
      actividad.responsable_custodia ||
      ''

    actividad.localizacion_tipo =
      actividad.localizacion_tipo ||
      actividad.localizacion_documentos ||
      ''

    actividad.tiene_plazo =
      actividad.tiene_plazo ?? 0

    const pdfBuffer = await generarPDFActividad(actividad)

    res.setHeader('Content-Type', 'application/pdf')
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="actividad-segtec-${req.params.id}.pdf"`
    )
    res.setHeader('Content-Length', pdfBuffer.length)

    return res.send(pdfBuffer)

  } catch (err) {
    console.error('SEGTEC PDF error:', err)
    return res.status(500).json({ ok: false, error: 'Error generando PDF' })
  }

})

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