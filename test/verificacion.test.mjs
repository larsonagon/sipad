// Pruebas: Verificación por dependencia (lista prellenada + formulario público por enlace).
import { test, before, after, describe } from 'node:test'
import assert from 'node:assert/strict'
import express from 'express'

import { prepararBD, ENT } from './helpers/db.mjs'
import * as repo from '../backend/modules/verificacion/verificacion.repository.js'
import { buildVerificacionRouter, buildVerificacionPublicaRouter } from '../backend/modules/verificacion/verificacion.routes.js'

let pool, db, server, base

before(async () => {
  ;({ pool, db } = await prepararBD())
  for (const t of ['verif_respuestas', 'verif_items', 'verif_listas']) await db.exec(`DROP TABLE IF EXISTS ${t}`)
  await repo.runVerificacionMigration(db)
  await repo.runVerificacionMigration(db) // idempotente

  // Segunda entidad para comprobar aislamiento
  await db.run(`INSERT INTO entidades (id, nombre) VALUES ('OTRA', 'Otra entidad')`)
  await db.run(`INSERT INTO dependencias (id, nombre, activa, entidad_id) VALUES (9, 'Dependencia ajena', true, 'OTRA')`)
  // Propuesta venida del ICAF (sin dependencia_id, por la actividad)
  await db.run(`INSERT INTO segtec_actividades (id, dependencia_id, entidad_id) VALUES ('A1', 1, ?)`, [ENT])
  await db.run(`INSERT INTO trd_series_propuestas (id, actividad_id, nombre_serie, nombre_subserie, tipologia_documental, estado, entidad_id, creado_en)
                VALUES ('P6', 'A1', 'LICENCIAS', 'Licencias de construcción', 'Solicitud, Planos, Resolución', 'propuesta', ?, ?)`, [ENT, new Date().toISOString()])
  await db.run(`INSERT INTO trd_series_propuestas (id, nombre_serie, nombre_subserie, estado, entidad_id, dependencia_id, creado_en)
                VALUES ('P7', 'CERTIFICADOS', NULL, 'rechazada', ?, 1, ?)`, [ENT, new Date().toISOString()])

  const app = express()
  app.use(express.json())
  app.use('/api/publico/verificacion', buildVerificacionPublicaRouter(db))
  app.use('/api/verificacion', (req, res, next) => { req.user = { nombre: 'Asesor', nivel_acceso: 80 }; req.entidad_id = req.headers['x-ent'] || ENT; next() },
    buildVerificacionRouter(db, { guard: (req, res, next) => next() }))
  await new Promise(ok => { server = app.listen(0, ok) })
  base = `http://127.0.0.1:${server.address().port}`
})

after(async () => { server?.close(); await pool.end() })

const http = async (metodo, ruta, body, headers = {}) => {
  const r = await fetch(base + ruta, { method: metodo, headers: { 'Content-Type': 'application/json', ...headers }, body: body ? JSON.stringify(body) : undefined })
  const tipo = r.headers.get('content-type') || ''
  return { status: r.status, body: tipo.includes('json') ? await r.json() : await r.text(), headers: r.headers }
}

describe('utilidades', () => {
  test('partirTipologias acepta JSON y texto', () => {
    assert.deepEqual(repo.partirTipologias('["Acta","Anexos","Acta"]'), ['Acta', 'Anexos'])
    assert.deepEqual(repo.partirTipologias('Solicitud, Planos;\nResolución'), ['Solicitud', 'Planos', 'Resolución'])
    assert.deepEqual(repo.partirTipologias(null), [])
  })
  test('textoItem prefiere la subserie y baja las mayúsculas sostenidas', () => {
    assert.equal(repo.textoItem('ACTAS', 'Actas de comité'), 'Actas de comité')
    assert.equal(repo.textoItem('HISTORIAS LABORALES', null), 'Historias laborales')
  })
  test('consolidar sugiere la decisión por mayoría', () => {
    const items = [{ id: 'a', texto: 'A' }, { id: 'b', texto: 'B' }, { id: 'c', texto: 'C' }, { id: 'd', texto: 'D' }]
    const resp = [
      { nombre: 'X', respuestas: { a: { r: 'si', soporte: 'papel' }, b: { r: 'no' }, c: { r: 'antes', desde: 2010, hasta: 2018 }, d: { r: 'ns' } } },
      { nombre: 'Y', respuestas: { a: { r: 'si' }, b: { r: 'no' }, c: { r: 'antes' }, d: { r: 'si' } } }
    ]
    const { filas, resumen } = repo.consolidar(items, resp)
    assert.deepEqual(filas.map(f => f.sugerida), ['incluir', 'descartar', 'fondo_acumulado', 'pendiente'])
    assert.equal(filas[0].soporte.papel, 1)
    assert.deepEqual(filas[2].periodos, [{ desde: 2010, hasta: 2018, nombre: 'X' }])
    assert.equal(resumen.pendiente, 1)
  })
})

describe('flujo completo', () => {
  let lista, token, items

  test('crear lista precarga las propuestas de la dependencia (asignadas y del ICAF), sin rechazadas', async () => {
    const r = await http('POST', '/api/verificacion/listas', { dependencia_id: 1, mensaje: 'Marque una opción por fila.' })
    assert.equal(r.status, 201)
    assert.equal(r.body.precargados, 3) // P1 (ACTAS), P5 (CORRESPONDENCIA), P6 (LICENCIAS vía actividad); P7 rechazada fuera
    lista = r.body.id
    const d = await http('GET', `/api/verificacion/listas/${lista}`)
    items = d.body.items
    token = d.body.lista.token
    assert.equal(d.body.lista.estado, 'borrador')
    assert.ok(items.find(i => i.texto === 'Licencias de construcción' && /Planos/.test(i.ayuda)))
    assert.ok(token.length >= 30)
  })

  test('dependencia de otra entidad es rechazada', async () => {
    const r = await http('POST', '/api/verificacion/listas', { dependencia_id: 9 })
    assert.equal(r.status, 400)
  })

  test('agregar ítems pegando una lista', async () => {
    const r = await http('POST', `/api/verificacion/listas/${lista}/items`, { lineas: '- Conceptos de uso del suelo\n\n2. Certificados de estratificación' })
    assert.equal(r.status, 201)
    assert.equal(r.body.ids.length, 2)
    await http('PUT', `/api/verificacion/items/${r.body.ids[0]}`, { serie: 'CONCEPTOS', subserie: 'Conceptos de uso del suelo' })
    const d = await http('GET', `/api/verificacion/listas/${lista}`)
    items = d.body.items
    assert.equal(items.length, 5)
  })

  test('el formulario público solo responde con la lista abierta', async () => {
    let r = await http('GET', `/api/publico/verificacion/${token}`)
    assert.equal(r.status, 410)
    r = await http('PUT', `/api/verificacion/listas/${lista}`, { estado: 'abierta' })
    assert.equal(r.status, 200)
    r = await http('GET', `/api/publico/verificacion/${token}`)
    assert.equal(r.status, 200)
    assert.equal(r.body.dependencia, 'Despacho del Alcalde')
    assert.equal(r.body.entidad, 'Alcaldía de Prueba')
    assert.equal(r.body.items.length, 5)
    assert.equal(r.body.items[0].propuesta_id, undefined, 'no expone datos internos')
    assert.equal(r.headers.get('cache-control'), 'no-store')
    r = await http('GET', `/api/publico/verificacion/tokenquenoexiste1234567890`)
    assert.equal(r.status, 404)
  })

  test('validaciones del envío público', async () => {
    let r = await http('POST', `/api/publico/verificacion/${token}`, { respuestas: {} })
    assert.equal(r.status, 400) // falta nombre
    r = await http('POST', `/api/publico/verificacion/${token}`, { nombre: 'Ana', respuestas: { [items[0].id]: { r: 'si' } } })
    assert.equal(r.status, 400)
    assert.equal(r.body.faltan, 4)
    const todas = Object.fromEntries(items.map(i => [i.id, { r: 'si' }]))
    r = await http('POST', `/api/publico/verificacion/${token}`, { nombre: 'Ana', respuestas: { ...todas, [items[1].id]: { r: 'antes', desde: 2020, hasta: 2010 } } })
    assert.equal(r.status, 400)
    r = await http('POST', `/api/publico/verificacion/${token}`, { nombre: 'Ana', respuestas: { ...todas, [items[1].id]: { r: 'tal vez' } } })
    assert.equal(r.status, 400)
  })

  test('dos funcionarios responden y el consolidado sugiere decisiones', async () => {
    const [actas, corr, lic, conceptos, cert] = items
    let r = await http('POST', `/api/publico/verificacion/${token}`, {
      nombre: 'Ana Pérez', cargo: 'Profesional', adicionales: 'Registro de publicidad exterior visual',
      respuestas: {
        [actas.id]: { r: 'si', soporte: 'ambos' }, [corr.id]: { r: 'no' }, [lic.id]: { r: 'si', soporte: 'papel' },
        [conceptos.id]: { r: 'si' }, [cert.id]: { r: 'antes', desde: 2008, hasta: 2016 }, ITEM_AJENO: { r: 'si' }
      }
    })
    assert.equal(r.status, 201)
    r = await http('POST', `/api/publico/verificacion/${token}`, {
      nombre: 'Luis Gómez',
      respuestas: { [actas.id]: { r: 'si' }, [corr.id]: { r: 'no' }, [lic.id]: { r: 'ns' }, [conceptos.id]: { r: 'si' }, [cert.id]: { r: 'antes' } }
    })
    assert.equal(r.status, 201)
    r = await http('POST', `/api/publico/verificacion/${token}`, { nombre: 'Robot', sitio: 'spam', respuestas: {} })
    assert.equal(r.status, 201) // trampa: se ignora sin guardar

    const d = await http('GET', `/api/verificacion/listas/${lista}`)
    assert.equal(d.body.resumen.respuestas, 2)
    const por = Object.fromEntries(d.body.items.map(i => [i.texto, i]))
    assert.equal(por['Actas de comité institucional de gestión y desempeño'].sugerida, 'incluir')
    assert.equal(por['Comunicaciones oficiales enviadas'].sugerida, 'descartar')
    assert.equal(por['Licencias de construcción'].sugerida, 'pendiente')
    assert.equal(por['Certificados de estratificación'].sugerida, 'fondo_acumulado')
    assert.equal(d.body.adicionales.length, 1)
  })

  test('aplicar lleva las decisiones a las propuestas de la TRD', async () => {
    const d = await http('GET', `/api/verificacion/listas/${lista}`)
    const cert = d.body.items.find(i => i.texto === 'Certificados de estratificación')
    await http('PUT', `/api/verificacion/items/${cert.id}`, { decision: 'pendiente' })
    const r = await http('POST', `/api/verificacion/listas/${lista}/aplicar`)
    assert.equal(r.status, 200)
    assert.equal(r.body.confirmadas, 1)   // ACTAS (aprobada) → constancia
    assert.equal(r.body.creadas, 1)       // Conceptos de uso del suelo → nueva propuesta
    assert.equal(r.body.descartadas, 1)   // CORRESPONDENCIA (aprobada) → constancia, no se rechaza
    const p5 = await db.get(`SELECT estado, observaciones_revision FROM trd_series_propuestas WHERE id = 'P5'`)
    assert.equal(p5.estado, 'aprobada')
    assert.match(p5.observaciones_revision, /no la produce/)
    const nueva = await db.get(`SELECT * FROM trd_series_propuestas WHERE nombre_serie = 'CONCEPTOS'`)
    assert.equal(nueva.estado, 'propuesta')
    assert.equal(Number(nueva.dependencia_id), 1)
    assert.equal(nueva.entidad_id, ENT)
  })

  test('descartar una propuesta pendiente la marca rechazada', async () => {
    const d = await http('GET', `/api/verificacion/listas/${lista}`)
    const lic = d.body.items.find(i => i.texto === 'Licencias de construcción')
    await http('PUT', `/api/verificacion/items/${lic.id}`, { decision: 'descartar' })
    await http('POST', `/api/verificacion/listas/${lista}/aplicar`)
    const p6 = await db.get(`SELECT estado FROM trd_series_propuestas WHERE id = 'P6'`)
    assert.equal(p6.estado, 'rechazada')
  })

  test('CSV de resultados', async () => {
    const r = await http('GET', `/api/verificacion/listas/${lista}/resultados.csv`)
    assert.equal(r.status, 200)
    assert.match(r.body, /"Documento o expediente";"Serie"/)
    assert.match(r.body, /Certificados de estratificación/)
  })

  test('aislamiento: otra entidad no ve ni toca la lista', async () => {
    const h = { 'x-ent': 'OTRA' }
    let r = await http('GET', `/api/verificacion/listas/${lista}`, null, h)
    assert.equal(r.status, 404)
    r = await http('GET', '/api/verificacion/listas', null, h)
    assert.equal(r.body.listas.length, 0)
    r = await http('PUT', `/api/verificacion/items/${items[0].id}`, { texto: 'x' }, h)
    assert.equal(r.status, 404)
  })

  test('nuevo enlace invalida el anterior; cerrar bloquea envíos', async () => {
    const r = await http('POST', `/api/verificacion/listas/${lista}/token`)
    assert.notEqual(r.body.token, token)
    let p = await http('GET', `/api/publico/verificacion/${token}`)
    assert.equal(p.status, 404)
    await http('PUT', `/api/verificacion/listas/${lista}`, { estado: 'cerrada' })
    p = await http('POST', `/api/publico/verificacion/${r.body.token}`, { nombre: 'Tarde', respuestas: {} })
    assert.equal(p.status, 410)
  })

  test('eliminar lista borra ítems y respuestas', async () => {
    await http('DELETE', `/api/verificacion/listas/${lista}`)
    const n = await db.get(`SELECT COUNT(*) AS n FROM verif_items WHERE lista_id = ?`, [lista])
    assert.equal(Number(n.n), 0)
  })
})
