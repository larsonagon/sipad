// Pruebas: convalidación (estados, observaciones) y quórum en el acta.
import { test, before, after } from 'node:test'
import assert from 'node:assert/strict'

import { prepararBD, ENT } from './helpers/db.mjs'
import {
  obtenerConvalidacion, actualizarConvalidacion,
  crearObservacion, resolverObservacion, listarObservaciones
} from '../backend/modules/trd-ai/trd-ai.convalidacion.js'
import { generarActaComite } from '../backend/modules/trd-ai/trd-ai.expediente.js'

let pool, db
before(async () => { ({ pool, db } = await prepararBD()) })
after(async () => { await pool.end() })

test('convalidación arranca en borrador y cuenta series aprobadas', async () => {
  const c = await obtenerConvalidacion(db, ENT)
  assert.equal(c.estado, 'borrador')
  assert.equal(Number(c.series_aprobadas), 5)
})

test('rechaza estado inválido', async () => {
  const r = await actualizarConvalidacion(db, ENT, { estado: 'inexistente' })
  assert.equal(r.ok, false)
})

test('guarda acto administrativo y quórum (asistentes array→JSON)', async () => {
  const asistentes = [
    { nombre: 'Juan Pérez', cargo: 'Alcalde', rol: 'Presidente' },
    { nombre: 'Ana Gómez', cargo: 'Secretaria', rol: 'Secretaria Técnica' }
  ]
  const r = await actualizarConvalidacion(db, ENT, {
    estado: 'aprobada_comite', numero_acta: 'CIGD-014',
    acto_administrativo: 'Resolución', numero_acto: '0456',
    asistentes, presidente_comite: 'Juan Pérez', secretario_comite: 'Ana Gómez'
  })
  assert.ok(r.ok)
  const c = await obtenerConvalidacion(db, ENT)
  assert.equal(c.numero_acta, 'CIGD-014')
  assert.equal(c.presidente_comite, 'Juan Pérez')
  const guardado = JSON.parse(c.asistentes)
  assert.equal(guardado.length, 2)
})

test('observaciones: ciclo pendiente → resuelta', async () => {
  const o = await crearObservacion(db, ENT, { serie: 'CONTRATOS', texto: 'Revisar AC', autor: 'Comité' })
  assert.ok(o.ok)
  let pend = await listarObservaciones(db, ENT, { estado: 'pendiente' })
  assert.equal(pend.length, 1)
  await resolverObservacion(db, o.id, ENT, { respuesta: 'Ajustado' })
  pend = await listarObservaciones(db, ENT, { estado: 'pendiente' })
  assert.equal(pend.length, 0)
})

test('acta del comité se genera como documento no vacío', async () => {
  const acta = await generarActaComite(db, ENT, { entidad: 'Alcaldía de Prueba', ciudad: 'X' })
  assert.ok(Buffer.isBuffer(acta) && acta.length > 3000)
})
