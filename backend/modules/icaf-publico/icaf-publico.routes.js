// ======================================================
// SIPAD · ICAF por enlace público — Rutas
// ------------------------------------------------------
// Privadas (/api/icaf-publico, sesión + nivel ≥ 60):
//   GET    /enlace                 enlace de la entidad (o null) + conteos
//   POST   /enlace                 crea el enlace si no existe { titulo?, mensaje? }
//   PUT    /enlace                 { titulo?, mensaje?, estado?, campana_inicio? }  (abierta | cerrada; fecha AAAA-MM-DD)
//   POST   /enlace/token           genera un enlace nuevo (invalida el anterior)
//   GET    /envios?estado=         pendiente (defecto) | incorporado | descartado
//   POST   /envios/:id/incorporar  crea las actividades en el ICAF
//   POST   /envios/:id/descartar
//   GET    /medicion               tabla de posiciones (puntaje por funcionario) + tablero por dependencia
// Públicas (/api/publico/icaf, SIN sesión, por token):
//   GET    /:token                 formulario (solo si el enlace está abierto)
//   POST   /:token                 { nombre, cargo?, dependencia_id, actividades: [{ nombre, frecuencia, produce, documentos?, formato?, recibe?, descripcion? }], observaciones? }
// ======================================================

import express from 'express'
import * as repo from './icaf-publico.repository.js'

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

function nivelMinimo(min) {
  return (req, res, next) => {
    const nivel = Number(req.user?.nivel_acceso ?? 0)
    if (!req.user) return res.status(401).json({ ok: false, error: 'Usuario no autenticado' })
    if (Number.isNaN(nivel) || nivel < min) return res.status(403).json({ ok: false, error: 'Acceso denegado por nivel' })
    next()
  }
}

export function buildIcafPublicoRouter(db, { guard = nivelMinimo(60) } = {}) {
  const r = express.Router()
  const { responder, envolver } = utilidades('ICAF público')
  r.use(guard)

  r.get('/enlace', envolver(async (req, res) =>
    responder(res, await repo.obtenerEnlace(db, eid(req))), 'No se pudo cargar el enlace'))
  r.post('/enlace', envolver(async (req, res) =>
    responder(res, await repo.crearEnlace(db, eid(req), req.body || {}, usuario(req)), 201), 'No se pudo crear el enlace'))
  r.put('/enlace', envolver(async (req, res) =>
    responder(res, await repo.actualizarEnlace(db, eid(req), req.body || {})), 'No se pudo guardar el enlace'))
  r.post('/enlace/token', envolver(async (req, res) =>
    responder(res, await repo.regenerarToken(db, eid(req))), 'No se pudo generar el enlace'))

  r.get('/envios', envolver(async (req, res) =>
    responder(res, await repo.listarEnvios(db, eid(req), String(req.query.estado || 'pendiente'))), 'No se pudieron cargar las respuestas'))
  r.post('/envios/:id/incorporar', envolver(async (req, res) =>
    responder(res, await repo.incorporarEnvio(db, eid(req), req.params.id, usuario(req))), 'No se pudo incorporar la respuesta'))
  r.post('/envios/:id/descartar', envolver(async (req, res) =>
    responder(res, await repo.descartarEnvio(db, eid(req), req.params.id, usuario(req))), 'No se pudo descartar la respuesta'))

  r.get('/medicion', envolver(async (req, res) =>
    responder(res, await repo.medicion(db, eid(req))), 'No se pudo calcular la medición'))

  return r
}

// Rutas públicas: se montan ANTES de verificarJWT. El token del enlace es el
// único acceso y solo expone el nombre de la entidad y sus dependencias.
export function buildIcafPublicoAbiertoRouter(db, { limitador = null } = {}) {
  const r = express.Router()
  const { responder, envolver } = utilidades('ICAF público (abierto)')
  r.use((req, res, next) => { res.setHeader('Cache-Control', 'no-store'); res.setHeader('X-Robots-Tag', 'noindex'); next() })

  r.get('/:token', envolver(async (req, res) =>
    responder(res, await repo.formularioPublico(db, req.params.token)), 'No se pudo cargar el formulario'))

  const enviar = envolver(async (req, res) =>
    responder(res, await repo.enviarPublico(db, req.params.token, req.body || {}), 201), 'No se pudo enviar la respuesta')
  if (limitador) r.post('/:token', limitador, enviar)
  else r.post('/:token', enviar)

  return r
}
