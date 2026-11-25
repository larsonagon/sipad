// Pruebas: ICAF por enlace público (enlace → formulario sin sesión → bandeja → ICAF).
import { test, before, after, describe } from 'node:test'
import assert from 'node:assert/strict'
import express from 'express'

import { prepararBD, ENT } from './helpers/db.mjs'
import * as repo from '../backend/modules/icaf-publico/icaf-publico.repository.js'
import { buildIcafPublicoRouter, buildIcafPublicoAbiertoRouter } from '../backend/modules/icaf-publico/icaf-publico.routes.js'

let pool, db, server, base

before(async () => {
  ;({ pool, db } = await prepararBD())
  for (const t of ['icafp_envios', 'icafp_enlaces']) await db.exec(`DROP TABLE IF EXISTS ${t}`)
  // Columnas del ICAF que crean otras migraciones en producción
  for (const c of ['usuario_id INTEGER', 'nombre TEXT', 'frecuencia TEXT', 'cargo_ejecutor TEXT', 'descripcion_funcional TEXT', 'genera_documentos INTEGER',
    'documentos_generados TEXT', 'formato_produccion TEXT', 'recepcion_externa TEXT', 'estado_general TEXT', 'created_at TEXT', 'updated_at TEXT'])
    await db.exec(`ALTER TABLE segtec_actividades ADD COLUMN IF NOT EXISTS ${c}`)
  await db.exec(`DROP TABLE IF EXISTS usuarios`)
  await db.exec(`CREATE TABLE usuarios (id SERIAL PRIMARY KEY, nombre_completo TEXT, entidad_id TEXT)`)
  await repo.runIcafPublicoMigration(db)
  await repo.runIcafPublicoMigration(db) // idempotente
  await db.run(`INSERT INTO entidades (id, nombre) VALUES ('OTRA3', 'Otra entidad') ON CONFLICT DO NOTHING`)
  await db.run(`INSERT INTO dependencias (id, nombre, activa, entidad_id) VALUES (7, 'Dependencia inactiva', false, ?), (9, 'Dependencia ajena', true, 'OTRA3')`, [ENT])

  const app = express()
  app.use(express.json())
  app.use('/api/publico/icaf', buildIcafPublicoAbiertoRouter(db))
  app.use('/api/icaf-publico', (req, res, next) => {
    const nivel = req.headers['x-nivel']
    if (nivel) req.user = { nombre: 'Asesor', nivel_acceso: Number(nivel) }
    req.entidad_id = req.headers['x-entidad'] || ENT
    next()
  }, buildIcafPublicoRouter(db))
  await new Promise(ok => { server = app.listen(0, ok) })
  base = `http://127.0.0.1:${server.address().port}`
})

after(async () => { server?.close(); await pool.end() })

const http = async (metodo, ruta, body, headers = {}) => {
  const r = await fetch(base + ruta, { method: metodo, headers: { 'Content-Type': 'application/json', ...headers }, body: body ? JSON.stringify(body) : undefined })
  return { status: r.status, body: await r.json() }
}
const ASESOR = { 'x-nivel': '80' }
const AJENO = { 'x-nivel': '80', 'x-entidad': 'OTRA3' }
const actividad = { nombre: ' Expedir  certificados ', frecuencia: 'eventual', produce: true, documentos: 'Certificado\nOficio; Certificado', formato: 'ambos', recibe: 'Solicitud', descripcion: '' }

describe('ICAF por enlace público', () => {
  let token, envio
  const enviar = (body) => http('POST', `/api/publico/icaf/${token}`, body)

  test('la gestión exige sesión y nivel', async () => {
    assert.equal((await http('GET', '/api/icaf-publico/enlace')).status, 401)
    assert.equal((await http('GET', '/api/icaf-publico/enlace', null, { 'x-nivel': '10' })).status, 403)
  })

  test('el enlace se crea una sola vez por entidad y queda abierto', async () => {
    let r = await http('GET', '/api/icaf-publico/enlace', null, ASESOR)
    assert.equal(r.body.enlace, null)
    r = await http('POST', '/api/icaf-publico/enlace', {}, ASESOR)
    assert.equal(r.status, 201)
    assert.equal(r.body.enlace.estado, 'abierta')
    token = r.body.enlace.token
    assert.ok(token.length >= 30)
    r = await http('POST', '/api/icaf-publico/enlace', {}, ASESOR)
    assert.equal(r.body.enlace.token, token)
  })

  test('el formulario público solo expone la entidad y sus dependencias activas', async () => {
    assert.equal((await http('GET', '/api/publico/icaf/no-existe')).status, 404)
    const r = await http('GET', `/api/publico/icaf/${token}`)
    assert.equal(r.status, 200)
    assert.equal(r.body.entidad, 'Alcaldía de Prueba')
    assert.deepEqual(r.body.dependencias.map(d => d.nombre), ['Despacho del Alcalde', 'Secretaría de Hacienda'])
    assert.deepEqual(Object.keys(r.body).sort(), ['dependencias', 'entidad', 'mensaje', 'ok', 'titulo'])
  })

  test('valida nombre, dependencia y cada actividad', async () => {
    assert.equal((await enviar({ dependencia_id: '1', actividades: [actividad] })).status, 400)
    assert.equal((await enviar({ nombre: 'Ana', dependencia_id: '9', actividades: [actividad] })).status, 400)
    assert.equal((await enviar({ nombre: 'Ana', dependencia_id: '7', actividades: [actividad] })).status, 400)
    assert.equal((await enviar({ nombre: 'Ana', dependencia_id: '1', actividades: [] })).status, 400)
    assert.equal((await enviar({ nombre: 'Ana', dependencia_id: '1', actividades: [{ ...actividad, frecuencia: 'a veces' }] })).status, 400)
    assert.equal((await enviar({ nombre: 'Ana', dependencia_id: '1', actividades: [{ ...actividad, documentos: ' ' }] })).status, 400)
    assert.equal((await enviar({ nombre: 'Ana', dependencia_id: '1', actividades: [{ ...actividad, formato: '' }] })).status, 400)
    const r = await enviar({ nombre: 'Ana', dependencia_id: '1', actividades: [actividad, { ...actividad, nombre: '' }] })
    assert.equal(r.status, 400)
    assert.equal(r.body.actividad, 2)
    assert.equal((await enviar({ nombre: 'Ana', dependencia_id: '1', actividades: Array(repo.LIMITES.actividadesPorEnvio + 1).fill(actividad) })).status, 400)
  })

  test('la trampa para robots no guarda nada', async () => {
    const r = await enviar({ nombre: 'Robot', dependencia_id: '1', actividades: [actividad], sitio: 'http://spam' })
    assert.equal(r.status, 201)
    assert.equal((await http('GET', '/api/icaf-publico/envios', null, ASESOR)).body.envios.length, 0)
  })

  test('un envío válido llega a la bandeja, limpio', async () => {
    const r = await enviar({ nombre: 'Ana Pérez', cargo: 'Auxiliar administrativo', dependencia_id: '2', observaciones: 'Gracias',
      actividades: [actividad, { nombre: 'Atender público', frecuencia: 'diaria', produce: false, documentos: 'se ignora', formato: 'fisico' }] })
    assert.equal(r.status, 201)
    assert.equal(r.body.actividades, 2)
    const b = await http('GET', '/api/icaf-publico/envios', null, ASESOR)
    assert.equal(b.body.conteos.pendiente, 1)
    envio = b.body.envios[0]
    assert.equal(envio.dependencia, 'Secretaría de Hacienda')
    assert.equal(envio.actividades[0].nombre, 'Expedir certificados')
    assert.equal(envio.actividades[0].documentos, 'Certificado\nOficio')
    assert.equal(envio.actividades[1].documentos, null)
    assert.equal(envio.actividades[1].formato, null)
  })

  test('otra entidad no ve ni incorpora el envío', async () => {
    assert.equal((await http('GET', '/api/icaf-publico/envios', null, AJENO)).body.envios.length, 0)
    assert.equal((await http('POST', `/api/icaf-publico/envios/${envio.id}/incorporar`, null, AJENO)).status, 404)
  })

  test('incorporar crea las actividades en el ICAF a nombre del funcionario, una sola vez', async () => {
    const r = await http('POST', `/api/icaf-publico/envios/${envio.id}/incorporar`, null, ASESOR)
    assert.equal(r.status, 200)
    assert.equal(r.body.creadas, 2)
    assert.equal((await http('POST', `/api/icaf-publico/envios/${envio.id}/incorporar`, null, ASESOR)).status, 409)
    assert.equal((await http('POST', `/api/icaf-publico/envios/${envio.id}/descartar`, null, ASESOR)).status, 409)
    // Misma expresión que usan los listados del ICAF
    const filas = await db.all(
      `SELECT a.*, COALESCE(u.nombre_completo, a.funcionario_externo) AS funcionario
         FROM segtec_actividades a LEFT JOIN usuarios u ON a.usuario_id = u.id
        WHERE a.entidad_id = ? AND a.funcionario_externo IS NOT NULL ORDER BY a.nombre`, [ENT])
    assert.equal(filas.length, 2)
    const [atender, expedir] = filas
    assert.equal(expedir.funcionario, 'Ana Pérez')
    assert.equal(expedir.cargo_ejecutor, 'Auxiliar administrativo')
    assert.equal(expedir.usuario_id, null)
    assert.equal(Number(expedir.dependencia_id), 2)
    assert.equal(expedir.estado_general, 'caracterizada')
    assert.equal(expedir.frecuencia, 'eventual')
    assert.equal(expedir.documentos_generados, 'Certificado\nOficio')
    assert.equal(expedir.formato_produccion, 'ambos')
    assert.equal(expedir.recepcion_externa, 'Solicitud')
    assert.equal(atender.genera_documentos, 0)
    const inc = await http('GET', '/api/icaf-publico/envios?estado=incorporado', null, ASESOR)
    assert.equal(inc.body.envios.length, 1)
    assert.equal(inc.body.envios[0].revisado_por, 'Asesor')
  })

  test('descartar saca el envío de la bandeja sin crear actividades', async () => {
    await enviar({ nombre: 'Luis', dependencia_id: '1', actividades: [actividad] })
    const e = (await http('GET', '/api/icaf-publico/envios', null, ASESOR)).body.envios[0]
    assert.equal((await http('POST', `/api/icaf-publico/envios/${e.id}/descartar`, null, ASESOR)).status, 200)
    assert.deepEqual((await http('GET', '/api/icaf-publico/envios', null, ASESOR)).body.conteos, { pendiente: 0, incorporado: 1, descartado: 1 })
    const n = await db.get(`SELECT COUNT(*) AS n FROM segtec_actividades WHERE funcionario_externo = 'Luis'`)
    assert.equal(Number(n.n), 0)
  })

  test('cerrar el formulario y generar un enlace nuevo', async () => {
    let r = await http('PUT', '/api/icaf-publico/enlace', { estado: 'cerrada', mensaje: 'Diligenciar antes del viernes.' }, ASESOR)
    assert.equal(r.body.enlace.estado, 'cerrada')
    assert.equal((await http('GET', `/api/publico/icaf/${token}`)).status, 410)
    assert.equal((await enviar({ nombre: 'Ana', dependencia_id: '1', actividades: [actividad] })).status, 410)
    assert.equal((await http('PUT', '/api/icaf-publico/enlace', { estado: 'otro' }, ASESOR)).status, 400)
    await http('PUT', '/api/icaf-publico/enlace', { estado: 'abierta' }, ASESOR)
    r = await http('POST', '/api/icaf-publico/enlace/token', null, ASESOR)
    assert.notEqual(r.body.enlace.token, token)
    assert.equal((await http('GET', `/api/publico/icaf/${token}`)).status, 404)
    assert.equal((await http('GET', `/api/publico/icaf/${r.body.enlace.token}`)).body.mensaje, 'Diligenciar antes del viernes.')
  })
})
