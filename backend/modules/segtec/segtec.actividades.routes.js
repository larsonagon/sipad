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

  // ── NORMALIZAR DEPENDENCIAS ──────────────────────────
  // Soporta 3 formatos:
  //   1. Array de objetos:  [{id:8, nombre:"X"}, ...]
  //   2. Array de IDs:      [8, 12]
  //   3. String JSON:       '[8,12]' o '[{"id":8,"nombre":"X"}]'
  // Retorna siempre un array uniforme de {id, nombre|null}
  // ─────────────────────────────────────────────────────

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

      // Caso 1: ya es objeto {id, nombre}
      if (typeof item === 'object' && item !== null) {
        return {
          id: item.id,
          nombre: item.nombre || null
        }
      }

      // Caso 2: es un ID simple (número o string)
      return {
        id: item,
        nombre: null
      }

    })
  }

  // ── RESOLVER DEPENDENCIAS A TEXTO (para PDF) ─────────
  // Trae TODAS las dependencias de la BD en un mapa,
  // resuelve nombres y retorna string separado por coma.
  // ─────────────────────────────────────────────────────

  async function resolverDependencias(deps) {

    if (!deps?.length) return ''

    // Traer TODAS las dependencias
    const todasDeps = await db.all('SELECT id, nombre FROM dependencias')
    const mapaDeps = {}
    for (const d of todasDeps) {
      mapaDeps[String(d.id)] = d.nombre
    }

    const nombres = deps.map(dep => {

      // Si ya trae nombre (formato nuevo)
      if (dep.nombre) return dep.nombre

      // Buscar en mapa
      const nombre = mapaDeps[String(dep.id)]
      return nombre || `Dependencia ${dep.id}`

    })

    return nombres.join(', ')
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

  // ── GET por ID: resuelve nombres de dependencias antes de responder ──
  router.get('/actividades/:id', attachContext, asyncHandler(async (req, res) => {

    const usuarioId = getUsuarioId(req)
    if (!usuarioId) {
      return res.status(401).json({ ok: false, error: 'No autenticado' })
    }

    const actividad = await service.obtenerPorId(req.params.id, usuarioId)

    if (!actividad) {
      return res.status(404).json({ ok: false, error: 'Actividad no encontrada' })
    }

    // ── Resolver dependencias_relacionadas ──
    try {

      const valorCrudo = actividad.dependencias_relacionadas
      console.log('[SEGTEC] dependencias_relacionadas crudo:', valorCrudo, typeof valorCrudo)

      const depsRaw = normalizarDependencias(valorCrudo)
      console.log('[SEGTEC] deps normalizadas:', JSON.stringify(depsRaw))

      if (depsRaw.length > 0) {

        // Traer TODAS las dependencias en un solo query
        const todasDeps = await db.all('SELECT id, nombre FROM dependencias')
        const mapaDeps = {}
        for (const d of todasDeps) {
          mapaDeps[String(d.id)] = d.nombre
        }

        console.log('[SEGTEC] mapa deps IDs disponibles:', Object.keys(mapaDeps).join(', '))

        const resueltas = depsRaw.map(dep => {

          // Si ya trae nombre (formato nuevo), usarlo directo
          if (dep.nombre) {
            return { id: dep.id, nombre: dep.nombre }
          }

          // Buscar en el mapa por ID (probar como string y como número)
          const idStr = String(dep.id)
          const nombre = mapaDeps[idStr]

          console.log('[SEGTEC] resolviendo dep id:', dep.id, '→', nombre || 'NO ENCONTRADA')

          return {
            id: dep.id,
            nombre: nombre || `ID ${dep.id} (dependencia no encontrada)`
          }
        })

        actividad.dependencias_relacionadas = JSON.stringify(resueltas)
      }

    } catch (err) {
      console.error('[SEGTEC] Error resolviendo dependencias:', err)
    }

    return res.status(200).json({ ok: true, data: actividad })

  }))

  router.post('/actividades', attachContext, asyncHandler(controller.crear))
  router.put('/actividades/:id', attachContext, asyncHandler(controller.actualizar))
  router.delete('/actividades/:id', attachContext, asyncHandler(controller.eliminar))

  router.put('/actividades/:id/bloque1', attachContext, asyncHandler(controller.actualizarBloque1))
  router.put('/actividades/:id/bloque2', attachContext, asyncHandler(controller.actualizarBloque2))
  router.put('/actividades/:id/bloque3', attachContext, asyncHandler(controller.actualizarBloque3))

  router.post('/actividades/:id/analizar', attachContext, asyncHandler(controller.analizar))
  router.post('/actividades/:id/completar', attachContext, asyncHandler(controller.marcarCompleta))

  // =====================================================
  // PDF (CORREGIDO)
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

      // ── Resolver dependencias a nombres ──
      const deps =
        normalizarDependencias(actividad.dependencias_relacionadas)

      actividad.dependencias_relacionadas =
        await resolverDependencias(deps)

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

    })
  )

  return router
}