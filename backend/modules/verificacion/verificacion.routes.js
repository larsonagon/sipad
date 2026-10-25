// ======================================================
// SIPAD · Verificación por dependencia — Rutas
// ------------------------------------------------------
// Privadas (/api/verificacion, sesión + nivel ≥ 60: asesor / gestión documental):
//   GET    /dependencias              dependencias de la entidad (selector)
//   GET    /listas                    listas con conteos
//   POST   /listas                    { dependencia_id, titulo?, mensaje?, fecha_limite?, preguntar_soporte?, preguntar_volumen?, precargar? }
//   GET    /listas/:id                detalle + consolidado de respuestas
//   PUT    /listas/:id                { titulo?, mensaje?, fecha_limite?, estado?, preguntar_* }
//   DELETE /listas/:id
//   POST   /listas/:id/token          genera un enlace nuevo (invalida el anterior)
//   POST   /listas/:id/items          { texto, ayuda?, serie?, subserie? } | { lineas }
//   PUT    /items/:id                 { texto?, ayuda?, serie?, subserie?, decision?, orden? }
//   DELETE /items/:id
//   DELETE /respuestas/:id
//   POST   /listas/:id/aplicar        lleva las decisiones a las propuestas de la TRD
//   GET    /listas/:id/resultados.csv
// Modo entrevista (el asesor pregunta y marca):
//   GET    /guias                     guías importadas (una por oficina)
//   POST   /guias/importar            { archivo: base64 .xlsx, nombre? }
//   DELETE /guias/:id
//   GET    /entrevistas
//   POST   /entrevistas               { dependencia_id, guia_id?, oficina?, fecha?, lugar?, entrevistador? }
//   GET    /entrevistas/:id           detalle (árbol subserie → tipologías) + resumen
//   PUT    /entrevistas/:id           { fecha?, lugar?, entrevistador?, oficina?, asistentes?, observaciones?, estado? }
//   DELETE /entrevistas/:id
//   POST   /entrevistas/:id/items     { texto, padre_id?, serie?, subserie? }
//   PUT    /entrevista-items/:id      { respuesta?, nota?, serie?, subserie?, texto? }
//   DELETE /entrevista-items/:id      (solo agregados)
//   POST   /entrevistas/:id/aplicar   lleva lo confirmado a las propuestas de la TRD
// Públicas (/api/publico/verificacion, SIN sesión, por token):
//   GET    /:token                    formulario (solo si la lista está abierta)
//   POST   /:token                    { nombre, cargo?, respuestas: { itemId: { r, desde?, hasta?, soporte?, volumen? } }, adicionales?, observaciones? }
// ======================================================

import express from 'express'
import * as repo from './verificacion.repository.js'
import * as ent from './verificacion.entrevista.js'

const usuario = (req) => req.user?.nombre || req.user?.username || req.user?.email || String(req.user?.sub || req.user?.id || '')
const eid = (req) => req.entidad_id

function utilidades(etiqueta) {
  const responder = (res, out, okStatus = 200) => res.status(out.ok ? okStatus : (out.status || 400)).json(out)
  const envolver = (fn, msg) => async (req, res) => {
    try { return await fn(req, res) }
    catch (err) { console.error(`${etiqueta} · ${msg}:`, err); return res.status(500).json({ ok: false, error: msg }) }
  }
  return { responder, envolver }
}

// Guardia por defecto: nivel ≥ 60 (misma regla que requireLevel(60)). server.js
// pasa el requireLevel institucional; esta copia evita importar la conexión a la
// base desde las rutas (así las pruebas no dejan el proceso abierto).
function nivelMinimo(min) {
  return (req, res, next) => {
    const nivel = Number(req.user?.nivel_acceso ?? 0)
    if (!req.user) return res.status(401).json({ ok: false, error: 'Usuario no autenticado' })
    if (Number.isNaN(nivel) || nivel < min) return res.status(403).json({ ok: false, error: 'Acceso denegado por nivel' })
    next()
  }
}

export function buildVerificacionRouter(db, { guard = nivelMinimo(60) } = {}) {
  const r = express.Router()
  const { responder, envolver } = utilidades('Verificación')
  r.use(guard)

  r.get('/dependencias', envolver(async (req, res) =>
    res.json({ ok: true, dependencias: await repo.dependenciasEntidad(db, eid(req)) }), 'No se pudieron cargar las dependencias'))

  r.get('/listas', envolver(async (req, res) =>
    res.json({ ok: true, listas: await repo.listar(db, eid(req)) }), 'No se pudieron cargar las listas'))

  r.post('/listas', envolver(async (req, res) =>
    responder(res, await repo.crearLista(db, eid(req), req.body || {}, usuario(req)), 201), 'No se pudo crear la lista'))

  r.get('/listas/:id', envolver(async (req, res) =>
    responder(res, await repo.detalle(db, eid(req), req.params.id)), 'No se pudo cargar la lista'))

  r.put('/listas/:id', envolver(async (req, res) =>
    responder(res, await repo.actualizarLista(db, eid(req), req.params.id, req.body || {})), 'No se pudo guardar la lista'))

  r.delete('/listas/:id', envolver(async (req, res) =>
    responder(res, await repo.eliminarLista(db, eid(req), req.params.id)), 'No se pudo eliminar la lista'))

  r.post('/listas/:id/token', envolver(async (req, res) =>
    responder(res, await repo.regenerarToken(db, eid(req), req.params.id)), 'No se pudo generar el enlace'))

  r.post('/listas/:id/items', envolver(async (req, res) =>
    responder(res, await repo.agregarItems(db, eid(req), req.params.id, req.body || {}), 201), 'No se pudo agregar'))

  r.put('/items/:id', envolver(async (req, res) =>
    responder(res, await repo.actualizarItem(db, eid(req), req.params.id, req.body || {})), 'No se pudo guardar el ítem'))

  r.delete('/items/:id', envolver(async (req, res) =>
    responder(res, await repo.eliminarItem(db, eid(req), req.params.id)), 'No se pudo eliminar el ítem'))

  r.delete('/respuestas/:id', envolver(async (req, res) =>
    responder(res, await repo.eliminarRespuesta(db, eid(req), req.params.id)), 'No se pudo eliminar la respuesta'))

  r.post('/listas/:id/aplicar', envolver(async (req, res) =>
    responder(res, await repo.aplicar(db, eid(req), req.params.id, usuario(req))), 'No se pudieron aplicar los resultados'))

  r.get('/listas/:id/resultados.csv', envolver(async (req, res) => {
    const d = await repo.detalle(db, eid(req), req.params.id)
    if (!d.ok) return responder(res, d)
    const nombre = (d.lista.dependencia_nombre || 'dependencia').normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^A-Za-z0-9]+/g, '-')
    res.setHeader('Content-Type', 'text/csv; charset=utf-8')
    res.setHeader('Content-Disposition', `attachment; filename="Verificacion-${nombre}.csv"`)
    res.end(repo.csvResultados(d))
  }, 'No se pudieron exportar los resultados'))

  // ---------------- Modo entrevista ----------------
  r.get('/guias', envolver(async (req, res) =>
    res.json({ ok: true, guias: await ent.listarGuias(db, eid(req)) }), 'No se pudieron cargar las guías'))
  r.post('/guias/importar', envolver(async (req, res) =>
    responder(res, await ent.importarGuias(db, eid(req), req.body || {}, usuario(req)), 201), 'No se pudo importar la guía'))
  r.delete('/guias/:id', envolver(async (req, res) =>
    responder(res, await ent.eliminarGuia(db, eid(req), req.params.id)), 'No se pudo eliminar la guía'))
  r.get('/entrevistas', envolver(async (req, res) =>
    res.json({ ok: true, entrevistas: await ent.listarEntrevistas(db, eid(req)) }), 'No se pudieron cargar las entrevistas'))
  r.post('/entrevistas', envolver(async (req, res) =>
    responder(res, await ent.crearEntrevista(db, eid(req), req.body || {}, usuario(req)), 201), 'No se pudo crear la entrevista'))
  r.get('/entrevistas/:id', envolver(async (req, res) =>
    responder(res, await ent.detalleEntrevista(db, eid(req), req.params.id)), 'No se pudo cargar la entrevista'))
  r.put('/entrevistas/:id', envolver(async (req, res) =>
    responder(res, await ent.actualizarEntrevista(db, eid(req), req.params.id, req.body || {})), 'No se pudo guardar la entrevista'))
  r.delete('/entrevistas/:id', envolver(async (req, res) =>
    responder(res, await ent.eliminarEntrevista(db, eid(req), req.params.id)), 'No se pudo eliminar la entrevista'))
  r.post('/entrevistas/:id/items', envolver(async (req, res) =>
    responder(res, await ent.agregarItemEntrevista(db, eid(req), req.params.id, req.body || {}), 201), 'No se pudo agregar el documento'))
  r.put('/entrevista-items/:id', envolver(async (req, res) =>
    responder(res, await ent.responderItem(db, eid(req), req.params.id, req.body || {})), 'No se pudo guardar la respuesta'))
  r.delete('/entrevista-items/:id', envolver(async (req, res) =>
    responder(res, await ent.eliminarItemEntrevista(db, eid(req), req.params.id)), 'No se pudo quitar el documento'))
  r.post('/entrevistas/:id/aplicar', envolver(async (req, res) =>
    responder(res, await ent.aplicarEntrevista(db, eid(req), req.params.id)), 'No se pudieron aplicar los resultados'))

  return r
}

// Rutas públicas: se montan ANTES de verificarJWT. El token del enlace es el
// único acceso y solo expone la lista abierta (textos de los ítems), nunca
// datos de la entidad ni de otras listas.
export function buildVerificacionPublicaRouter(db, { limitador = null } = {}) {
  const r = express.Router()
  const { responder, envolver } = utilidades('Verificación pública')
  r.use((req, res, next) => { res.setHeader('Cache-Control', 'no-store'); res.setHeader('X-Robots-Tag', 'noindex'); next() })

  r.get('/:token', envolver(async (req, res) =>
    responder(res, await repo.formularioPublico(db, req.params.token)), 'No se pudo cargar el formulario'))

  const enviar = envolver(async (req, res) =>
    responder(res, await repo.enviarPublico(db, req.params.token, req.body || {}), 201), 'No se pudo enviar la respuesta')
  if (limitador) r.post('/:token', limitador, enviar)
  else r.post('/:token', enviar)

  return r
}
