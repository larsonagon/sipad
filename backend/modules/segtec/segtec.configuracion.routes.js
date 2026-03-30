import express from 'express'
import crypto from 'crypto'
import { verificarJWT } from '../../middlewares/auth.middleware.js'
import { db } from '../../db/database.js'

export function registerSEGTECConfiguracionRoutes(app) {

  const router = express.Router()

  const getUsuarioId = (req) =>
    req.user?.sub ||
    req.user?.id ||
    null

  const getDependenciaId = (req) =>
    req.user?.id_dependencia || null

  // =========================================================
  // VERIFICAR SI EXISTE CONFIGURACIÓN ACTIVA
  // =========================================================
  router.get('/existe', async (req, res) => {
    try {

      const idDependencia = getDependenciaId(req)

      if (!idDependencia) {
        return res.status(400).json({
          ok: false,
          error: 'Dependencia no encontrada en token'
        })
      }

      const row = await db.get(
        `
        SELECT id
        FROM segtec_configuracion_dependencia
        WHERE id_dependencia = ?
        AND activa = 1
        `,
        [idDependencia]
      )

      return res.json({
        ok: true,
        existe: !!row
      })

    } catch (err) {
      console.error('ERROR /existe:', err)
      return res.status(500).json({ ok: false })
    }
  })

  // =========================================================
  // OBTENER CONFIGURACIÓN ACTIVA
  // =========================================================
  router.get('/', async (req, res) => {
    try {

      const idDependencia = getDependenciaId(req)

      if (!idDependencia) {
        return res.status(400).json({ ok: false })
      }

      const config = await db.get(
        `
        SELECT *
        FROM segtec_configuracion_dependencia
        WHERE id_dependencia = ?
        AND activa = 1
        ORDER BY version DESC
        LIMIT 1
        `,
        [idDependencia]
      )

      return res.json({
        ok: true,
        configuracion: config || null
      })

    } catch (err) {
      console.error('ERROR GET config:', err)
      return res.status(500).json({ ok: false })
    }
  })

  // =========================================================
  // HISTÓRICO DE VERSIONES (SOLO LECTURA)
  // =========================================================
  router.get('/historico', async (req, res) => {
    try {

      const idDependencia = getDependenciaId(req)

      if (!idDependencia) {
        return res.status(400).json({
          ok: false,
          error: 'Dependencia no encontrada en token'
        })
      }

      const versiones = await db.all(
        `
        SELECT 
          id,
          version,
          activa,
          tipo_funcion,
          nivel_decisorio,
          recibe_solicitudes,
          emite_actos,
          produce_decisiones,
          tipos_documentales,
          created_at,
          creado_por
        FROM segtec_configuracion_dependencia
        WHERE id_dependencia = ?
        ORDER BY version DESC
        `,
        [idDependencia]
      )

      return res.json({
        ok: true,
        historico: versiones
      })

    } catch (err) {
      console.error('ERROR histórico SEGTEC:', err)
      return res.status(500).json({
        ok: false,
        error: 'Error interno'
      })
    }
  })

  // =========================================================
  // CREAR NUEVA VERSIÓN
  // =========================================================
  router.post('/', async (req, res) => {
    try {

      const usuarioId = getUsuarioId(req)
      const idDependencia = getDependenciaId(req)

      if (!usuarioId || !idDependencia) {
        return res.status(400).json({
          ok: false,
          error: 'Datos inválidos'
        })
      }

      const body = req.body || {}

      const tipo_funcion = body.tipo_funcion ?? null
      const nivel_decisorio = body.nivel_decisorio ?? null

      if (!tipo_funcion || !nivel_decisorio) {
        return res.status(400).json({
          ok: false,
          error: 'Campos obligatorios incompletos'
        })
      }

      const recibe_solicitudes = body.recibe_solicitudes ? 1 : 0
      const emite_actos = body.emite_actos ? 1 : 0
      const produce_decisiones = body.produce_decisiones ? 1 : 0

      const procesos_principales = body.procesos_principales || null
      const tramites_frecuentes = body.tramites_frecuentes || null
      const tipo_decisiones = body.tipo_decisiones || null
      const otros_documentos = body.otros_documentos || null
      const descripcion_funcional = body.descripcion_funcional || null

      let tipos_documentales = null

      if (Array.isArray(body.tipos_documentales)) {
        tipos_documentales = JSON.stringify(body.tipos_documentales)
      } else if (typeof body.tipos_documentales === 'string') {
        tipos_documentales = JSON.stringify([body.tipos_documentales])
      }

      const ultimaVersion = await db.get(
        `
        SELECT MAX(version) as maxVersion
        FROM segtec_configuracion_dependencia
        WHERE id_dependencia = ?
        `,
        [idDependencia]
      )

      const nuevaVersion = (ultimaVersion?.maxVersion || 0) + 1

      // Desactivar anteriores
      await db.run(
        `
        UPDATE segtec_configuracion_dependencia
        SET activa = 0
        WHERE id_dependencia = ?
        `,
        [idDependencia]
      )

      // Insertar nueva versión activa
      await db.run(
        `
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
        `,
        [
          crypto.randomUUID(),
          idDependencia,
          nuevaVersion,

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
          usuarioId,
          new Date().toISOString()
        ]
      )

      return res.json({
        ok: true,
        version: nuevaVersion
      })

    } catch (err) {
      console.error('ERROR POST config SEGTEC:', err)
      return res.status(500).json({
        ok: false,
        error: 'Error interno'
      })
    }
  })

  app.use('/api/segtec/configuracion', router)
}