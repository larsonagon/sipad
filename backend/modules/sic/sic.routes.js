// ======================================================
// SIPAD · Diagnóstico SIC — Rutas  (/api/sic)
// ------------------------------------------------------
// Diligenciar (cualquier usuario autenticado de la entidad):
//   GET    /formulario                catálogo de preguntas
//   GET    /estado                    respuestas, espacios, repositorios, avance
//   PUT    /respuestas                { respuestas: { 'IN-01': {v:'si'}, ... } }
//   PUT    /meta                      { espacios_declarados }
//   POST   /espacios                  { registro }
//   PUT    /espacios/:id              { registro?, ficha? }   (parche parcial)
//   DELETE /espacios/:id
//   POST   /espacios/:id/fotos        { nombre, mime, datos(base64), ancho, alto }
//   GET    /fotos/:id                 imagen
//   DELETE /fotos/:id
//   POST   /repositorios              { datos }
//   PUT    /repositorios/:id          { datos }
//   DELETE /repositorios/:id
// Analizar y generar (nivel ≥ 60, asesor / gestión documental):
//   GET    /analisis                  resultado del motor + redacción base
//   POST   /resumen                   resumen ejecutivo (asistente, con guardias)
//   GET    /informe.docx              informe Word del diagnóstico
// ======================================================

import express from 'express'
import { requireLevel } from '../../middlewares/role.middleware.js'
import { catalogo } from './sic.formulario.js'
import { analizar } from './sic.motor.js'
import { redaccionBase, resumenEjecutivo } from './sic.redaccion.js'
import { generarInformeSIC } from './sic.informe.js'
import * as repo from './sic.repository.js'

const usuario = (req) => req.user?.nombre || req.user?.username || req.user?.email || String(req.user?.sub || req.user?.id || '')
const ent = (req) => req.entidad_id

async function nombreEntidad(db, entidadId) {
  try { const e = await db.get(`SELECT nombre FROM entidades WHERE id::text = ?`, [String(entidadId)]); return e?.nombre || 'la entidad' }
  catch { try { const e = await db.get(`SELECT nombre FROM entidades WHERE id = ?`, [entidadId]); return e?.nombre || 'la entidad' } catch { return 'la entidad' } }
}

export async function construirAnalisis(db, entidadId) {
  const estado = await repo.obtenerEstado(db, entidadId)
  const analisis = analizar(estado)
  return { estado, analisis }
}

export function buildSICRouter(db, { guardAnalisis = requireLevel(60) } = {}) {
  const r = express.Router()
  const responder = (res, out, okStatus = 200) => res.status(out.ok ? okStatus : (out.status || 400)).json(out)
  const envolver = (fn, msg) => async (req, res) => {
    try { return await fn(req, res) }
    catch (err) { console.error(`SIC · ${msg}:`, err); return res.status(500).json({ ok: false, error: msg }) }
  }

  r.get('/formulario', (req, res) => res.json({ ok: true, ...catalogo() }))

  r.get('/estado', envolver(async (req, res) => {
    const estado = await repo.obtenerEstado(db, ent(req))
    const { avance } = analizar(estado)
    res.json({ ok: true, ...estado, avance })
  }, 'No se pudo cargar el diagnóstico'))

  r.put('/respuestas', envolver(async (req, res) =>
    responder(res, await repo.guardarRespuestas(db, ent(req), req.body?.respuestas, usuario(req))), 'No se pudieron guardar las respuestas'))

  r.put('/meta', envolver(async (req, res) =>
    responder(res, await repo.guardarMeta(db, ent(req), req.body || {})), 'No se pudo guardar'))

  r.post('/espacios', envolver(async (req, res) =>
    responder(res, await repo.crearEspacio(db, ent(req), req.body || {}, usuario(req)), 201), 'No se pudo crear el espacio'))
  r.put('/espacios/:id', envolver(async (req, res) =>
    responder(res, await repo.actualizarEspacio(db, ent(req), req.params.id, req.body || {}, usuario(req))), 'No se pudo guardar el espacio'))
  r.delete('/espacios/:id', envolver(async (req, res) =>
    responder(res, await repo.eliminarEspacio(db, ent(req), req.params.id)), 'No se pudo eliminar el espacio'))

  r.post('/espacios/:id/fotos', envolver(async (req, res) =>
    responder(res, await repo.agregarFoto(db, ent(req), req.params.id, req.body || {}), 201), 'No se pudo guardar la foto'))
  r.get('/fotos/:id', envolver(async (req, res) => {
    const f = await repo.obtenerFoto(db, ent(req), req.params.id)
    if (!f) return res.status(404).json({ ok: false, error: 'Foto no encontrada' })
    const buf = Buffer.from(f.datos, 'base64')
    res.setHeader('Content-Type', f.mime)
    res.setHeader('Content-Length', buf.length)
    res.setHeader('Cache-Control', 'private, max-age=86400')
    res.end(buf)
  }, 'No se pudo leer la foto'))
  r.delete('/fotos/:id', envolver(async (req, res) =>
    responder(res, await repo.eliminarFoto(db, ent(req), req.params.id)), 'No se pudo eliminar la foto'))

  r.post('/repositorios', envolver(async (req, res) =>
    responder(res, await repo.crearRepositorio(db, ent(req), req.body || {}, usuario(req)), 201), 'No se pudo crear el repositorio'))
  r.put('/repositorios/:id', envolver(async (req, res) =>
    responder(res, await repo.actualizarRepositorio(db, ent(req), req.params.id, req.body || {}, usuario(req))), 'No se pudo guardar el repositorio'))
  r.delete('/repositorios/:id', envolver(async (req, res) =>
    responder(res, await repo.eliminarRepositorio(db, ent(req), req.params.id)), 'No se pudo eliminar el repositorio'))

  // ---------- Análisis e informe ----------
  r.get('/analisis', guardAnalisis, envolver(async (req, res) => {
    const { estado, analisis } = await construirAnalisis(db, ent(req))
    const entidad = await nombreEntidad(db, ent(req))
    res.json({ ok: true, entidad, analisis, redaccion: redaccionBase(analisis, { entidad }),
      resumen: estado.redaccion, resumen_en: estado.redaccion_en })
  }, 'No se pudo analizar el diagnóstico'))

  r.post('/resumen', guardAnalisis, envolver(async (req, res) => {
    const { analisis } = await construirAnalisis(db, ent(req))
    const entidad = await nombreEntidad(db, ent(req))
    const out = await resumenEjecutivo(analisis, { entidad })
    if (out.ok && out.fuente === 'asistente') await repo.guardarRedaccion(db, ent(req), { texto: out.texto, advertencias: out.advertencias || [] })
    return responder(res, out)
  }, 'No se pudo redactar el resumen'))

  r.put('/resumen', guardAnalisis, envolver(async (req, res) => {
    const texto = String(req.body?.texto || '').trim().slice(0, 8000)
    if (!texto) return res.status(400).json({ ok: false, error: 'El texto no puede estar vacío' })
    await repo.guardarRedaccion(db, ent(req), { texto, editado: true, advertencias: [] })
    return res.json({ ok: true })
  }, 'No se pudo guardar el resumen'))

  r.get('/informe.docx', guardAnalisis, envolver(async (req, res) => {
    const { estado, analisis } = await construirAnalisis(db, ent(req))
    const entidad = await nombreEntidad(db, ent(req))
    const fotos = await repo.fotosParaInforme(db, ent(req), 3)
    const buffer = await generarInformeSIC({ analisis, estado, entidad, fotos,
      redaccion: redaccionBase(analisis, { entidad }), resumen: estado.redaccion,
      fecha: new Date().toLocaleDateString('es-CO') })
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document')
    res.setHeader('Content-Disposition', 'attachment; filename="Diagnostico-Integral-SIC.docx"')
    res.setHeader('Content-Length', buffer.length)
    res.end(buffer)
  }, 'No se pudo generar el informe'))

  return r
}
