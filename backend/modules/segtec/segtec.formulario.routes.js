// backend/modules/segtec/segtec.formulario.routes.js
// SIPAD – SEG-TEC Formulario Routes (Refactor sin Bloque 1)

import express from 'express'
import { verificarJWT } from '../../middlewares/auth.middleware.js'
import { db } from '../../db/database.js'

export function registerSEGTECRoutes(app, service) {

  if (!service) {
    throw new Error('SEGTECFormService no proporcionado')
  }

  const router = express.Router()

  // =====================================================
  // HELPER – OBTENER USUARIO ID DESDE JWT
  // =====================================================
  const getUsuarioId = (req) =>
    req.user?.sub ||
    req.user?.Id ||
    req.user?.id ||
    req.user?.IdUsuario ||
    null

  // =====================================================
  // HELPER – VERIFICAR CONFIGURACIÓN FUNCIONAL
  // =====================================================
  const verificarConfiguracionDependencia = async (idDependencia) => {

    const config = await db.get(
      `
      SELECT id
      FROM segtec_configuracion_dependencia
      WHERE id_dependencia = ?
      `,
      [idDependencia]
    )

    return !!config
  }

  // =====================================================
  // CREAR NUEVO REGISTRO
  // =====================================================
  router.post(
    '/nuevo',
    verificarJWT,
    async (req, res) => {
      try {

        const usuarioId = getUsuarioId(req)

        if (!usuarioId) {
          return res.status(401).json({
            ok: false,
            error: 'Usuario no autenticado'
          })
        }

        const tieneConfiguracion =
          await verificarConfiguracionDependencia(req.user.id_dependencia)

        if (!tieneConfiguracion) {
          return res.status(400).json({
            ok: false,
            error: 'Debe configurar la dependencia antes de crear registros'
          })
        }

        const { descripcion } = req.body || {}

        const nuevo = await service.crearNuevo(
          usuarioId,
          req.user.id_dependencia,
          descripcion
        )

        return res.status(201).json({
          ok: true,
          formularioId: nuevo.id,
          numero: nuevo.numero
        })

      } catch (err) {
        console.error('SEGTEC nuevo error:', err)
        return res.status(400).json({
          ok: false,
          error: err.message
        })
      }
    }
  )

  // =====================================================
  // LISTAR REGISTROS DEL USUARIO
  // =====================================================
  router.get(
    '/mis',
    verificarJWT,
    async (req, res) => {
      try {

        const usuarioId = getUsuarioId(req)

        if (!usuarioId) {
          return res.status(401).json({
            ok: false,
            error: 'Usuario no autenticado'
          })
        }

        const registros = await service.listarPorUsuario(usuarioId)

        return res.json({
          ok: true,
          registros
        })

      } catch (err) {
        console.error('SEGTEC listar error:', err)
        return res.status(400).json({
          ok: false,
          error: err.message
        })
      }
    }
  )

  // =====================================================
  // FINALIZAR REGISTRO
  // =====================================================
  router.put(
    '/finalizar/:id',
    verificarJWT,
    async (req, res) => {
      try {

        const usuarioId = getUsuarioId(req)

        if (!usuarioId) {
          return res.status(401).json({
            ok: false,
            error: 'Usuario no autenticado'
          })
        }

        const { id } = req.params

        await service.finalizarRegistro(id, usuarioId)

        return res.json({ ok: true })

      } catch (err) {
        console.error('SEGTEC finalizar error:', err)
        return res.status(400).json({
          ok: false,
          error: err.message
        })
      }
    }
  )

  // =====================================================
  // AVANZAR ETAPA
  // =====================================================
  router.patch(
    '/avanzar/:formularioId',
    verificarJWT,
    async (req, res) => {
      try {

        const usuarioId = getUsuarioId(req)

        if (!usuarioId) {
          return res.status(401).json({
            ok: false,
            error: 'Usuario no autenticado'
          })
        }

        const { formularioId } = req.params
        const { etapa } = req.body

        if (!etapa || typeof etapa !== 'number') {
          return res.status(400).json({
            ok: false,
            error: 'Etapa inválida'
          })
        }

        await service.avanzarEtapa(
          formularioId,
          usuarioId,
          etapa
        )

        return res.json({ ok: true })

      } catch (err) {
        console.error('SEGTEC avanzar error:', err)
        return res.status(400).json({
          ok: false,
          error: err.message
        })
      }
    }
  )

  app.use('/api/segtec/formulario', router)
}