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

describe('medición (tabla de posiciones)', () => {
  const t = (nombre, recibe, descripcion) => ({ nombre, recibe: recibe ? 'Solicitud' : null, descripcion: descripcion ? 'Se hace así' : null })
  const envio = (nombre, enviado_en, actividades, extra = {}) => ({ nombre, enviado_en, actividades, dependencia: 'Hacienda', ...extra })

  test('oportunidad: cuenta días calendario de Colombia desde el inicio', () => {
    assert.equal(repo.puntosOportunidad('2026-11-30', '2026-11-30T15:00:00.000Z'), 20)
    assert.equal(repo.puntosOportunidad('2026-11-30', '2026-12-01T04:30:00.000Z'), 20) // 11:30 p. m. del lunes en Colombia
    assert.equal(repo.puntosOportunidad('2026-11-30', '2026-12-01T05:00:00.000Z'), 15) // martes 12:00 a. m.
    assert.equal(repo.puntosOportunidad('2026-11-30', '2026-12-03T20:00:00.000Z'), 5)
    assert.equal(repo.puntosOportunidad('2026-11-30', '2026-12-04T20:00:00.000Z'), 0)
    assert.equal(repo.puntosOportunidad('2026-11-30', '2026-11-27T20:00:00.000Z'), 20) // antes del inicio
    assert.equal(repo.puntosOportunidad(null, '2026-11-30T15:00:00.000Z'), 0)
  })

  test('detalle, cobertura con tope, suma de envíos de la misma persona y empates', () => {
    const r = repo.calcularRanking([
      // Ana: 2 envíos (nombre escrito distinto), una tarea repetida → 3 tareas distintas
      envio('Ana Pérez', '2026-12-01T15:00:00.000Z', [t('Expedir certificados', true, false), t('Atender público', false, false)]),
      envio(' ana  PEREZ ', '2026-11-30T15:00:00.000Z', [t('expedir  certificados', false, true), t('Archivar', true, true)], { cargo: 'Auxiliar' }),
      // Luis: 8 tareas completas → tope de cobertura
      envio('Luis Díaz', '2026-12-04T15:00:00.000Z', Array.from({ length: 8 }, (_, i) => t(`Tarea ${i}`, true, true))),
      // Eva y Leo: empate
      envio('Eva Ruiz', '2026-12-02T15:00:00.000Z', [t('Una', true, true)]),
      envio('Leo Mora', '2026-12-02T15:00:00.000Z', [t('Otra', true, true)]),
      envio('Sin tareas', '2026-11-30T15:00:00.000Z', [])
    ], '2026-11-30')
    const ana = r.find(f => f.nombre === 'Ana Pérez')
    assert.equal(ana.tareas, 3)
    assert.equal(ana.envios, 2)
    assert.equal(ana.cargo, 'Auxiliar')
    assert.equal(ana.detalle, 33)      // (50 + 0 + 50) / 3
    assert.equal(ana.cobertura, 15)
    assert.equal(ana.oportunidad, 20)  // cuenta el primer envío (lunes)
    assert.equal(ana.total, 68)
    const luis = r.find(f => f.nombre === 'Luis Díaz')
    assert.deepEqual([luis.detalle, luis.cobertura, luis.oportunidad, luis.total], [50, 30, 0, 80])
    assert.deepEqual(r.map(f => [f.posicion, f.nombre, f.empate]), [
      [1, 'Luis Díaz', false], [2, 'Ana Pérez', false], [3, 'Eva Ruiz', true], [3, 'Leo Mora', true]])
    assert.equal(r.find(f => f.nombre === 'Eva Ruiz').total, 65) // 50 + 5 + 10
  })

  test('el servicio puntúa lo incorporado en firme, lo pendiente como provisional, y arma el tablero por dependencia', async () => {
    assert.equal((await http('GET', '/api/icaf-publico/medicion')).status, 401)
    assert.equal((await http('PUT', '/api/icaf-publico/enlace', { campana_inicio: '30/11/2026' }, ASESOR)).status, 400)
    const e = await http('PUT', '/api/icaf-publico/enlace', { campana_inicio: '2020-01-01' }, ASESOR)
    assert.equal(e.body.enlace.campana_inicio, '2020-01-01')
    const token = e.body.enlace.token
    await http('POST', `/api/publico/icaf/${token}`, { nombre: 'Pendiente Uno', dependencia_id: '1', actividades: [actividad] })
    const m = await http('GET', '/api/icaf-publico/medicion', null, ASESOR)
    assert.equal(m.status, 200)
    assert.equal(m.body.campana_inicio, '2020-01-01')
    assert.equal(m.body.pendientes, 1)
    // Pendiente Uno (por revisar): 1 tarea con "recibe" → 25 + 5; provisional.
    // Ana Pérez (incorporada): 2 tareas, una con "recibe" → detalle 13, cobertura 10; en firme.
    // Oportunidad 0 para ambos (enviaron años después del inicio). Luis, descartado, no aparece.
    assert.deepEqual(m.body.ranking.map(f => [f.posicion, f.nombre, f.dependencia, f.tareas, f.detalle, f.cobertura, f.oportunidad, f.total, f.provisional]), [
      [1, 'Pendiente Uno', 'Despacho del Alcalde', 1, 25, 5, 0, 30, true],
      [2, 'Ana Pérez', 'Secretaría de Hacienda', 2, 13, 10, 0, 23, false]])
    // Tablero: cuenta pendientes e incorporadas, no descartadas (Luis); a igual número de funcionarios, primero la de más tareas
    assert.deepEqual(m.body.dependencias, [
      { nombre: 'Secretaría de Hacienda', funcionarios: 1, tareas: 2 },
      { nombre: 'Despacho del Alcalde', funcionarios: 1, tareas: 1 }])
    assert.equal((await http('GET', '/api/icaf-publico/medicion', null, AJENO)).body.ranking.length, 0)
    const limpia = await http('PUT', '/api/icaf-publico/enlace', { campana_inicio: null }, ASESOR)
    assert.equal(limpia.body.enlace.campana_inicio, null)
  })
})
