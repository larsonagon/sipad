// Pruebas: Verificación · modo entrevista (guía Excel → entrevista → acta → TRD).
import { test, before, after, describe } from 'node:test'
import assert from 'node:assert/strict'
import express from 'express'
import ExcelJS from 'exceljs'

import { prepararBD, ENT } from './helpers/db.mjs'
import * as repo from '../backend/modules/verificacion/verificacion.repository.js'
import * as ent from '../backend/modules/verificacion/verificacion.entrevista.js'
import { buildVerificacionRouter } from '../backend/modules/verificacion/verificacion.routes.js'

let pool, db, server, base

async function libroPrueba() {
  const wb = new ExcelJS.Workbook()
  const g = wb.addWorksheet('Gobierno')
  g.addRow(['Oficina', 'Nivel', 'Serie', 'Subserie', 'Tipología documental', '¿Lo producen?', 'Observación', 'Función del manual', 'Fuente'])
  g.addRow(['Comisaría', 'Subserie', 'PROCESOS', 'Procesos de alimentos', '3 documentos sugeridos', null, null, 'Comisario · F2: Alimentos', 'Banco SIPAD · Procesos'])
  g.addRow(['Comisaría', 'Tipología', 'PROCESOS', 'Procesos de alimentos', 'Solicitud'])
  g.addRow(['Comisaría', 'Tipología', 'PROCESOS', 'Procesos de alimentos', 'Acta de conciliación'])
  g.addRow(['Comisaría', 'Tipología', 'PROCESOS', 'Procesos de alimentos', 'Auto de archivo'])
  g.addRow(['Comisaría', 'Por validar', 'Por definir', 'Despachos comisorios', 'Anotar', null, 'Preguntar', 'Comisario · F9', 'Manual de funciones'])
  g.addRow(['Comisaría', 'Subserie', 'ACTAS', 'Actas de audiencia', '1 documento sugerido', null, null, 'Comisario · F4', 'TRD'])
  g.addRow(['Comisaría', 'Tipología', 'ACTAS', 'Actas de audiencia', 'Acta'])
  g.addRow(['Inspección', 'Subserie', 'PROCESOS', 'Procesos de querellas', '1 documento sugerido', null, null, 'Inspector · F1', 'Banco'])
  g.addRow(['Inspección', 'Tipología', 'PROCESOS', 'Procesos de querellas', 'Querella'])
  const c = wb.addWorksheet('Comunes por oficina')
  c.addRow(['', '', 'ACCIONES CONSTITUCIONALES', 'PQRS'])
  c.addRow(['Dependencia', 'Oficina', 'Acciones de tutela', 'Derechos de petición'])
  c.addRow(['Gobierno', 'Comisaría', null, 'No'])
  c.addRow(['Gobierno', 'Inspección', 'Sí', null])
  const t = wb.addWorksheet('Comunes (tipologías)')
  t.addRow(['Serie', 'Subserie', 'Tipología documental', 'Fuente'])
  t.addRow(['ACCIONES CONSTITUCIONALES', 'Acciones de tutela', 'Escrito de tutela', 'Propuesta'])
  t.addRow(['ACCIONES CONSTITUCIONALES', 'Acciones de tutela', 'Fallo', 'Propuesta'])
  const l = wb.addWorksheet('Léame'); l.addRow(['Guías'])
  return Buffer.from(await wb.xlsx.writeBuffer())
}

before(async () => {
  ;({ pool, db } = await prepararBD())
  for (const t of ['verif_entrevista_items', 'verif_entrevistas', 'verif_guias', 'verif_respuestas', 'verif_items', 'verif_listas']) await db.exec(`DROP TABLE IF EXISTS ${t}`)
  await repo.runVerificacionMigration(db)
  await ent.runEntrevistaMigration(db)
  await ent.runEntrevistaMigration(db) // idempotente
  await db.run(`INSERT INTO entidades (id, nombre) VALUES ('OTRA2', 'Otra entidad') ON CONFLICT DO NOTHING`)
  // Columnas del ICAF que crean otras migraciones en producción
  for (const c of ['usuario_id INTEGER', 'nombre TEXT', 'frecuencia TEXT', 'cargo_ejecutor TEXT', 'descripcion_funcional TEXT', 'genera_documentos INTEGER',
    'documentos_generados TEXT', 'formato_produccion TEXT', 'responsable_custodia TEXT', 'cargo_custodia TEXT', 'genera_expediente_propio INTEGER',
    'estado_general TEXT', 'created_at TEXT', 'updated_at TEXT']) await db.exec(`ALTER TABLE segtec_actividades ADD COLUMN IF NOT EXISTS ${c}`)
  await db.exec(`DROP TABLE IF EXISTS usuarios`); await db.exec(`DROP TABLE IF EXISTS cargos`)
  await db.exec(`CREATE TABLE cargos (id SERIAL PRIMARY KEY, nombre TEXT, entidad_id TEXT)`)
  await db.exec(`CREATE TABLE usuarios (id SERIAL PRIMARY KEY, nombre_completo TEXT, entidad_id TEXT, id_cargo INTEGER, id_dependencia INTEGER)`)
  await db.run(`INSERT INTO cargos (id, nombre, entidad_id) VALUES (1, 'Comisario de Familia', ?)`, [ENT])
  await db.run(`INSERT INTO usuarios (id, nombre_completo, entidad_id, id_cargo, id_dependencia) VALUES (50, 'Ana Pérez', ?, 1, 1), (51, 'Ajeno', 'OTRA2', NULL, 9)`, [ENT])
  // Propuesta existente en la dependencia 1 que la entrevista debe completar (no duplicar)
  await db.run(`INSERT INTO trd_series_propuestas (id, nombre_serie, nombre_subserie, tipologia_documental, estado, entidad_id, dependencia_id, creado_en)
                VALUES ('PE1', 'ACTAS', 'Actas de Audiencia', '["Acta","Citación"]', 'propuesta', ?, 1, ?)`, [ENT, new Date().toISOString()])
  await db.run(`INSERT INTO trd_series_propuestas (id, nombre_serie, nombre_subserie, estado, entidad_id, dependencia_id, creado_en)
                VALUES ('PE2', 'ACCIONES CONSTITUCIONALES', 'Acciones de tutela', 'propuesta', ?, 1, ?)`, [ENT, new Date().toISOString()])

  const app = express()
  app.use(express.json({ limit: '25mb' }))
  app.use('/api/verificacion', (req, res, next) => { req.user = { nombre: 'Asesor', nivel_acceso: 80 }; req.entidad_id = req.headers['x-ent'] || ENT; next() },
    buildVerificacionRouter(db, { guard: (req, res, next) => next() }))
  await new Promise(ok => { server = app.listen(0, ok) })
  base = `http://127.0.0.1:${server.address().port}`
})

after(async () => { server?.close(); await pool.end() })

const http = async (metodo, ruta, body, headers = {}) => {
  const r = await fetch(base + ruta, { method: metodo, headers: { 'Content-Type': 'application/json', ...headers }, body: body ? JSON.stringify(body) : undefined })
  return { status: r.status, body: await r.json() }
}

describe('lectura de la guía', () => {
  test('arma una guía por oficina con subseries, tipologías y comunes', async () => {
    const g = await ent.leerGuiasLibro(await libroPrueba())
    assert.equal(g.length, 2)
    const com = g.find(x => x.oficina === 'Comisaría')
    assert.deepEqual(com.items.map(i => i.nivel), ['subserie', 'por_validar', 'subserie', 'subserie'])
    assert.deepEqual(com.items[0].tipologias, ['Solicitud', 'Acta de conciliación', 'Auto de archivo'])
    assert.equal(com.items[0].funcion, 'Comisario · F2: Alimentos')
    // Tutela se pregunta (celda vacía); derecho de petición no (marcado "No")
    const comun = com.items.find(i => i.comun)
    assert.equal(comun.subserie, 'Acciones de tutela')
    assert.equal(comun.serie, 'ACCIONES CONSTITUCIONALES')
    assert.deepEqual(comun.tipologias, ['Escrito de tutela', 'Fallo'])
    const ins = g.find(x => x.oficina === 'Inspección')
    assert.equal(ins.items.filter(i => i.comun).length, 2)
  })
})

describe('flujo de entrevista por la API', () => {
  let guiaCom, eid, d

  test('importa la guía y reimportar no duplica', async () => {
    const archivo = (await libroPrueba()).toString('base64')
    const r = await http('POST', '/api/verificacion/guias/importar', { archivo, nombre: 'guia.xlsx' })
    assert.equal(r.status, 201)
    assert.equal(r.body.oficinas, 2)
    await http('POST', '/api/verificacion/guias/importar', { archivo: 'data:application/vnd.ms-excel;base64,' + archivo })
    const l = await http('GET', '/api/verificacion/guias')
    assert.equal(l.body.guias.length, 2)
    guiaCom = l.body.guias.find(g => g.oficina === 'Comisaría')
    assert.equal(guiaCom.subseries, 4)
    assert.equal(guiaCom.por_validar, 1)
    // Otra entidad no ve las guías
    const o = await http('GET', '/api/verificacion/guias', null, { 'x-ent': 'OTRA2' })
    assert.equal(o.body.guias.length, 0)
  })

  test('rechaza archivos que no son guía', async () => {
    const r = await http('POST', '/api/verificacion/guias/importar', { archivo: Buffer.from('hola').toString('base64') })
    assert.equal(r.status, 400)
  })

  test('crea la entrevista copiando la guía', async () => {
    const mal = await http('POST', '/api/verificacion/entrevistas', { guia_id: guiaCom.id, dependencia_id: 9 })
    assert.equal(mal.status, 400) // dependencia de otra entidad
    const r = await http('POST', '/api/verificacion/entrevistas', { guia_id: guiaCom.id, dependencia_id: 1, fecha: '2026-10-27', lugar: 'Comisaría' })
    assert.equal(r.status, 201)
    eid = r.body.id
    d = (await http('GET', `/api/verificacion/entrevistas/${eid}`)).body
    assert.equal(d.entrevista.oficina, 'Comisaría')
    assert.equal(d.items.length, 4)
    assert.equal(d.items[0].tipologias.length, 3)
    assert.equal(d.resumen.pendientes, 4)
  })

  test('no se puede cerrar con subseries pendientes ni sin asistentes', async () => {
    const r = await http('PUT', `/api/verificacion/entrevistas/${eid}`, { estado: 'cerrada' })
    assert.equal(r.status, 400)
    assert.equal(r.body.pendientes, 4)
  })

  test('marca respuestas, agrega documentos y cierra', async () => {
    const [alim, desp, actas, tutela] = d.items
    const put = (id, b) => http('PUT', `/api/verificacion/entrevista-items/${id}`, b)
    assert.equal((await put(alim.id, { respuesta: 'si' })).status, 200)
    await put(alim.tipologias[0].id, { respuesta: 'si' })
    await put(alim.tipologias[1].id, { respuesta: 'no' })
    await put(alim.tipologias[2].id, { respuesta: 'si', nota: 'Desde 2019' })
    assert.equal((await put(alim.id, { respuesta: 'quizas' })).status, 400)
    // Tipología que no estaba
    const nueva = await http('POST', `/api/verificacion/entrevistas/${eid}/items`, { padre_id: alim.id, texto: 'Constancia de no comparecencia' })
    assert.equal(nueva.status, 201)
    // Por validar: la oficina sí los tiene; se le define la serie
    await put(desp.id, { respuesta: 'si', serie: 'DESPACHOS COMISORIOS', subserie: null })
    await put(actas.id, { respuesta: 'si' })
    await put(actas.tipologias[0].id, { respuesta: 'si' })
    await put(tutela.id, { respuesta: 'no' })
    await put(alim.id, { formato: 'fisico', frecuencia: 'semanal' })
    assert.equal((await put(alim.id, { formato: 'papiro' })).status, 400)
    assert.equal((await put(alim.id, { responsable: 'as_noexiste' })).status, 400)
    // Subserie nueva sin serie → queda por validar
    const sub = await http('POST', `/api/verificacion/entrevistas/${eid}/items`, { texto: 'Registro de visitas domiciliarias' })
    assert.equal(sub.status, 201)
    // Los de la guía no se borran
    assert.equal((await http('DELETE', `/api/verificacion/entrevista-items/${alim.id}`)).status, 400)

    d = (await http('GET', `/api/verificacion/entrevistas/${eid}`)).body
    assert.equal(d.items[0].tipologias.at(-1).texto, 'Constancia de no comparecencia')
    assert.equal(d.resumen.si, 4)
    assert.equal(d.resumen.no, 1)
    assert.equal(d.resumen.agregados, 2)

    const sinAsist = await http('PUT', `/api/verificacion/entrevistas/${eid}`, { estado: 'cerrada' })
    assert.equal(sinAsist.status, 400)
    // Vincular a otra entidad: rechazado
    const ajeno = await http('PUT', `/api/verificacion/entrevistas/${eid}`, { asistentes: [{ nombre: 'X', usuario_id: 51 }] })
    assert.equal(ajeno.status, 400)
    const ok = await http('PUT', `/api/verificacion/entrevistas/${eid}`, {
      asistentes: [{ nombre: 'Ana Pérez', cargo: 'Comisaria de Familia', jefe: true, usuario_id: 50 }, { nombre: 'Luis Gómez', cargo: 'Secretario' }, { nombre: '' }], estado: 'cerrada'
    })
    assert.equal(ok.status, 200)
    d = (await http('GET', `/api/verificacion/entrevistas/${eid}`)).body
    assert.equal(d.entrevista.estado, 'cerrada')
    assert.equal(d.entrevista.asistentes.length, 2)
    assert.ok(d.entrevista.asistentes.every(a => a.id))
    // Cerrada: no admite cambios
    assert.equal((await put(alim.id, { respuesta: 'no' })).status, 409)
  })

  test('aplica a la TRD: crea, completa sin duplicar y deja constancia de lo negado', async () => {
    const r = await http('POST', `/api/verificacion/entrevistas/${eid}/aplicar`)
    assert.equal(r.status, 200)
    assert.equal(r.body.creadas, 2) // alimentos + despachos comisorios
    assert.equal(r.body.completadas, 1) // actas de audiencia (ya existía)
    assert.equal(r.body.anotadas_no, 1) // tutela
    assert.equal(r.body.omitidas.length, 1) // registro de visitas sin serie

    const alim = await db.get(`SELECT * FROM trd_series_propuestas WHERE nombre_subserie = 'Procesos de alimentos'`)
    assert.deepEqual(JSON.parse(alim.tipologia_documental), ['Solicitud', 'Auto de archivo', 'Constancia de no comparecencia'])
    assert.match(alim.justificacion, /Comisario · F2/)
    assert.equal(String(alim.dependencia_id), '1')
    const actas = await db.get(`SELECT * FROM trd_series_propuestas WHERE id = 'PE1'`)
    assert.deepEqual(JSON.parse(actas.tipologia_documental), ['Acta', 'Citación'])
    assert.match(actas.observaciones_revision, /confirma/)
    const tut = await db.get(`SELECT * FROM trd_series_propuestas WHERE id = 'PE2'`)
    assert.equal(tut.estado, 'propuesta') // no se rechaza: otra oficina puede producirla
    assert.match(tut.observaciones_revision, /no produce/)

    // Reaplicar no duplica propuestas ni constancias
    const r2 = await http('POST', `/api/verificacion/entrevistas/${eid}/aplicar`)
    assert.equal(r2.body.creadas, 0)
    const n = await db.get(`SELECT COUNT(*) AS n FROM trd_series_propuestas WHERE nombre_subserie = 'Procesos de alimentos'`)
    assert.equal(Number(n.n), 1)
    const tut2 = await db.get(`SELECT observaciones_revision FROM trd_series_propuestas WHERE id = 'PE2'`)
    assert.equal(tut2.observaciones_revision.match(/no produce/g).length, 1)
  })

  test('ICAF: un formulario por funcionario y actividades en el ICAF de SIPAD', async () => {
    const r = await http('GET', `/api/verificacion/entrevistas/${eid}/icaf`)
    assert.equal(r.status, 200)
    // Sin cargo coincidente, todo va al jefe (Ana); Luis no tiene actividades
    assert.equal(r.body.funcionarios.length, 1)
    const ana = r.body.funcionarios[0]
    assert.equal(ana.asistente.nombre, 'Ana Pérez')
    const alim = ana.actividades.find(a => a.subserie === 'Procesos de alimentos')
    assert.equal(alim.nombre, 'Alimentos')
    assert.deepEqual(alim.documentos, ['Solicitud', 'Auto de archivo', 'Constancia de no comparecencia'])
    assert.equal(alim.formato, 'fisico')
    assert.equal(alim.tipo_funcion, 'misional')

    const acts = await db.all(`SELECT * FROM segtec_actividades WHERE usuario_id = 50 ORDER BY nombre`)
    assert.equal(acts.length, 4) // alimentos, despachos, actas, visitas
    const a = acts.find(x => x.nombre === 'Alimentos')
    assert.equal(a.documentos_generados, 'Solicitud\nAuto de archivo\nConstancia de no comparecencia')
    assert.equal(a.frecuencia, 'semanal')
    assert.equal(a.estado_general, 'caracterizada')
    assert.match(a.descripcion_funcional, /Diligenciado mediante entrevista/)
    const p = await db.get(`SELECT actividad_id FROM trd_series_propuestas WHERE nombre_subserie = 'Procesos de alimentos'`)
    assert.equal(p.actividad_id, a.id) // el motor de la TRD no la vuelve a proponer
    // Reaplicar actualiza, no duplica
    const r2 = await http('POST', `/api/verificacion/entrevistas/${eid}/aplicar`)
    assert.equal(r2.body.icaf.registradas, 0)
    assert.equal(r2.body.icaf.actualizadas, 4)
    assert.equal(Number((await db.get(`SELECT COUNT(*) AS n FROM segtec_actividades WHERE usuario_id = 50`)).n), 4)
  })

  test('sugerirResponsable empareja por cargo del manual', () => {
    const asis = [{ id: 'j', nombre: 'Jefe', cargo: 'Secretario de Gobierno', jefe: true }, { id: 'i', nombre: 'Inés', cargo: 'Inspectora de Policía' }]
    assert.equal(ent.sugerirResponsable({ funcion: 'Inspector de Policía · F1: Querellas' }, asis), 'i') // coincide «policía»
    assert.equal(ent.sugerirResponsable({ funcion: 'Comisario de Familia · F1: x' }, asis), 'j') // sin coincidencia: el jefe
    assert.equal(ent.sugerirResponsable({ funcion: 'Inspector de Policía Urbano · F1: Querellas' }, [{ id: 'k', cargo: 'Inspector de Policía Urbano' }, ...asis]), 'k')
    assert.equal(ent.sugerirResponsable({ comun: true, funcion: 'x' }, asis), 'j')
    assert.equal(ent.sugerirResponsable({ funcion: 'Trabajo Social y Psicología · F3-F4: Informes' }, [...asis, { id: 'p', cargo: 'Psicólogo' }]), 'p')
    assert.equal(ent.tipoFuncion('Talento Humano', false), 'apoyo')
  })

  test('reabrir permite corregir; eliminar borra todo', async () => {
    assert.equal((await http('PUT', `/api/verificacion/entrevistas/${eid}`, { estado: 'en_curso' })).status, 200)
    const l = await http('GET', '/api/verificacion/entrevistas')
    assert.equal(l.body.entrevistas.length, 1)
    assert.equal(l.body.entrevistas[0].resumen.subseries, 5)
    assert.equal((await http('DELETE', `/api/verificacion/entrevistas/${eid}`, null, { 'x-ent': 'OTRA2' })).status, 404)
    assert.equal((await http('DELETE', `/api/verificacion/entrevistas/${eid}`)).status, 200)
    const n = await db.get(`SELECT COUNT(*) AS n FROM verif_entrevista_items WHERE entrevista_id = ?`, [eid])
    assert.equal(Number(n.n), 0)
  })
})
