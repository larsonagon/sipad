import express from 'express'
import crypto from 'crypto'
import { verificarJWT } from '../../middlewares/auth.middleware.js'

import { SEGTECActividadesRepository } from './segtec.actividades.repository.js'
import { SEGTECValidacionTecnicaRepository } from './segtec.validacion.tecnica.repository.js'

import { SEGTECActividadesService } from './segtec.actividades.service.js'
import { SEGTECActividadesController } from './segtec.actividades.controller.js'

import { generarPDFActividad } from './segtec.pdf.service.js'

export function buildSEGTECRouter(db, trdAIService) {

  if (!db) throw new Error('DB no proporcionada a SEGTEC')
  if (!trdAIService) throw new Error('TRDAIService no proporcionado a SEGTEC')

  const router = express.Router()

  // =====================================================
  // REPOSITORIES
  // =====================================================

  const actividadesRepo = SEGTECActividadesRepository(db)
  const validacionRepo = SEGTECValidacionTecnicaRepository(db)

  // =====================================================
  // SERVICE
  // =====================================================

  const service = SEGTECActividadesService(
    actividadesRepo,
    validacionRepo,
    trdAIService
  )

  const controller = SEGTECActividadesController(service)

  // =====================================================
  // HELPERS
  // =====================================================

  const getUsuarioId = (req) => {
    if (!req.user) return null
    return req.user.sub || req.user.id || req.user.usuario_id || null
  }

  async function getDependenciaId(usuarioId) {

    if (!usuarioId) return null

    const usuario = await db.get(`
      SELECT id_dependencia
      FROM usuarios
      WHERE id = ?
    `, [usuarioId])

    return usuario?.id_dependencia || null
  }

  function normalizarDependencias(valor){

    if(!valor) return []

    if(Array.isArray(valor)) return valor

    if(typeof valor === 'string'){

      try{
        return JSON.parse(valor)
      }catch{
        return valor.split(',').map(x=>x.trim())
      }

    }

    return []
  }

  async function resolverDependencias(ids){

    if(!ids?.length) return ''

    // Si los items son objetos {id, nombre}, ya vienen resueltos
    if(typeof ids[0] === 'object' && ids[0].nombre){
      return ids.map(d => d.nombre).join(', ')
    }

    // Si son solo IDs, resolver contra la base de datos
    const soloIds = ids.map(x => typeof x === 'object' ? x.id : x)

    const placeholders = soloIds.map(()=>'?').join(',')

    const rows = await db.all(`
      SELECT nombre
      FROM dependencias
      WHERE id IN (${placeholders})
    `, soloIds)

    return rows.map(r=>r.nombre).join(', ')
  }

  // =====================================================
  // RESOLVER LOCALIZACIONES
  // ─ Convierte el JSON string / array de localizaciones
  //   en un texto legible para el PDF
  // =====================================================

  function resolverLocalizaciones(valor){

    if(!valor) return ''

    // Mapa de etiquetas legibles
    const etiquetas = {
      carpeta_oficina:     'Carpeta física en oficina',
      archivador:          'Archivador',
      computador_personal: 'Computador',
      carpeta_red:         'Carpeta compartida',
      otro:                'Otro'
    }

    const items = normalizarDependencias(valor)

    // Si no se pudo normalizar como array, usar valor simple (formato antiguo)
    if(!items.length){

      if(typeof valor === 'string' && valor.trim()){
        return etiquetas[valor] || valor
      }

      return ''
    }

    return items.map(item => {

      // Caso 1: objeto {value, nombre}
      if(typeof item === 'object' && item.nombre){
        return item.nombre
      }

      // Caso 2: objeto {value} sin nombre
      if(typeof item === 'object' && item.value){
        return etiquetas[item.value] || item.value
      }

      // Caso 3: string simple
      return etiquetas[item] || item

    }).join(', ')
  }

  // =====================================================
  // CONTEXTO
  // =====================================================

  async function attachContext(req, res, next) {

    try {

      const usuarioId = getUsuarioId(req)

      if (!usuarioId) {
        return res.status(401).json({
          ok: false,
          error: 'No autenticado'
        })
      }

      const dependenciaId = await getDependenciaId(usuarioId)

      if (!dependenciaId) {
        return res.status(400).json({
          ok: false,
          error: 'Usuario sin dependencia asignada'
        })
      }

      req.usuarioId = usuarioId
      req.dependenciaId = dependenciaId

      next()

    } catch (err) {

      console.error('SEGTEC contexto error:', err)

      return res.status(500).json({
        ok: false,
        error: 'Error resolviendo contexto de usuario'
      })

    }
  }

  // =====================================================
  // WRAPPER
  // =====================================================

  const asyncHandler = (fn) => (req, res, next) =>
    Promise.resolve(fn(req, res, next)).catch(next)

  // =====================================================
  // CONFIGURACIÓN
  // =====================================================

  router.get(
    '/configuracion',
    attachContext,
    asyncHandler(async (req, res) => {

      const config = await db.get(`
        SELECT *
        FROM segtec_configuracion_dependencia
        WHERE id_dependencia = ?
        AND activa = 1
        ORDER BY version DESC
        LIMIT 1
      `, [req.dependenciaId])

      res.json({
        ok: true,
        configuracion: config || null
      })

    })
  )

  router.post(
    '/configuracion',
    attachContext,
    asyncHandler(async (req, res) => {

      const usuarioId = req.usuarioId
      const idDependencia = req.dependenciaId
      const body = req.body || {}

      if (!body.tipo_funcion || !body.nivel_decisorio) {
        return res.status(400).json({
          ok: false,
          error: 'Campos obligatorios incompletos'
        })
      }

      const ultimaVersion = await db.get(`
        SELECT MAX(version) as maxVersion
        FROM segtec_configuracion_dependencia
        WHERE id_dependencia = ?
      `, [idDependencia])

      const nuevaVersion = (ultimaVersion?.maxVersion || 0) + 1

      await db.run(`
        UPDATE segtec_configuracion_dependencia
        SET activa = 0
        WHERE id_dependencia = ?
      `, [idDependencia])

      await db.run(`
        INSERT INTO segtec_configuracion_dependencia (
          id,
          id_dependencia,
          version,
          activa,
          tipo_funcion,
          recibe_solicitudes,
          emite_actos,
          produce_decisiones,
          procesos_principales,
          tramites_frecuentes,
          tipo_decisiones,
          tipos_documentales,
          otros_documentos,
          descripcion_funcional,
          nivel_decisorio,
          creado_por,
          created_at
        )
        VALUES (?, ?, ?, 1, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [
        crypto.randomUUID(),
        idDependencia,
        nuevaVersion,
        body.tipo_funcion,
        body.recibe_solicitudes ? 1 : 0,
        body.emite_actos ? 1 : 0,
        body.produce_decisiones ? 1 : 0,
        body.procesos_principales || null,
        body.tramites_frecuentes || null,
        body.tipo_decisiones || null,
        Array.isArray(body.tipos_documentales)
          ? JSON.stringify(body.tipos_documentales)
          : null,
        body.otros_documentos || null,
        body.descripcion_funcional || null,
        body.nivel_decisorio,
        usuarioId,
        new Date().toISOString()
      ])

      res.json({
        ok: true,
        version: nuevaVersion
      })

    })
  )

  // =====================================================
  // ACTIVIDADES
  // =====================================================

  router.get('/actividades', attachContext, asyncHandler(controller.listar))
  router.get('/actividades/:id', attachContext, asyncHandler(controller.obtenerPorId))
  router.post('/actividades', attachContext, asyncHandler(controller.crear))
  router.put('/actividades/:id', attachContext, asyncHandler(controller.actualizar))
  router.delete('/actividades/:id', attachContext, asyncHandler(controller.eliminar))

  router.put('/actividades/:id/bloque1', attachContext, asyncHandler(controller.actualizarBloque1))
  router.put('/actividades/:id/bloque2', attachContext, asyncHandler(controller.actualizarBloque2))
  router.put('/actividades/:id/bloque3', attachContext, asyncHandler(controller.actualizarBloque3))

  router.post('/actividades/:id/analizar', attachContext, asyncHandler(controller.analizar))
  router.post('/actividades/:id/completar', attachContext, asyncHandler(controller.marcarCompleta))

  // =====================================================
  // PDF
  // =====================================================

  router.get(
    '/actividades/:id/pdf',
    attachContext,
    asyncHandler(async (req, res) => {

      const actividad =
        await service.obtenerPorId(req.params.id, req.usuarioId)

      if (!actividad) {
        return res.status(404).json({
          ok: false,
          error: 'Actividad no encontrada'
        })
      }

      if (actividad.validacion) {
        actividad.genera_expediente_propio =
          actividad.validacion.genera_expediente_propio
      }

      // ── DEPENDENCIAS RELACIONADAS ──
      const deps = normalizarDependencias(actividad.dependencias_relacionadas)

      actividad.dependencias_relacionadas =
        await resolverDependencias(deps)

      // ── CARGO DE CUSTODIA ──
      if (actividad.cargo_custodia) {

        const cargo = await db.get(`
          SELECT nombre
          FROM cargos
          WHERE id = ?
        `, [actividad.cargo_custodia])

        if (cargo) {
          actividad.cargo_custodia = cargo.nombre
        }

      }

      // ── CAMPOS NORMALIZADOS ──
      actividad.volumen_categoria =
        actividad.volumen_categoria ||
        actividad.volumen_documental ||
        ''

      actividad.custodia_tipo =
        actividad.custodia_tipo ||
        actividad.responsable_custodia ||
        ''

      // ── LOCALIZACIONES: resolver a texto legible ──
      const locRaw =
        actividad.localizacion_tipo ||
        actividad.localizacion_documentos ||
        ''

      actividad.localizacion_tipo = resolverLocalizaciones(locRaw)
      actividad.localizacion_documentos = actividad.localizacion_tipo

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

    })
  )

  return router
}