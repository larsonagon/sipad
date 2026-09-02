// Pruebas: versionado y vigencia de la TRD.
import { test, before, after } from 'node:test'
import assert from 'node:assert/strict'

import { prepararBD, ENT } from './helpers/db.mjs'
import {
  crearVersion, congelarVersion, obtenerSnapshot,
  ponerVigente, obtenerVigente, listarVersiones, eliminarVersion
} from '../backend/modules/trd-ai/trd-ai.versiones.js'

let pool, db
before(async () => { ({ pool, db } = await prepararBD()) })
after(async () => { await pool.end() })

test('crear versión exige nombre', async () => {
  assert.equal((await crearVersion(db, ENT, { nombre_version: '' })).ok, false)
  const c = await crearVersion(db, ENT, { nombre_version: 'TRD v1 - 2026' })
  assert.ok(c.ok && c.id)
})

test('congelar guarda snapshot inmutable de la TRD aprobada', async () => {
  const c = await crearVersion(db, ENT, { nombre_version: 'TRD snap' })
  const fr = await congelarVersion(db, ENT, c.id)
  assert.ok(fr.ok)
  assert.equal(fr.series, 5)
  const snap = await obtenerSnapshot(db, ENT, c.id)
  assert.ok(snap.ok && snap.snapshot && snap.snapshot.series === 5)
})

test('poner vigente deroga la anterior', async () => {
  const v1 = await crearVersion(db, ENT, { nombre_version: 'v1' })
  await ponerVigente(db, ENT, v1.id, { acto_administrativo: 'Resolución', numero_acto: '1' })
  const vig1 = await obtenerVigente(db, ENT)
  assert.equal(vig1.id, v1.id)

  const v2 = await crearVersion(db, ENT, { nombre_version: 'v2' })
  const pv2 = await ponerVigente(db, ENT, v2.id, { acto_administrativo: 'Decreto', numero_acto: '2' })
  assert.ok(pv2.ok && pv2.derogada, 'derogó la anterior')
  const vig2 = await obtenerVigente(db, ENT)
  assert.equal(vig2.id, v2.id)
})

test('historial conserva aprobadas/derogadas; borra solo borradores', async () => {
  const lista = await listarVersiones(db, ENT)
  const derogada = lista.versiones.find(v => v.estado === 'derogada')
  assert.ok(derogada, 'hay al menos una derogada')
  assert.equal((await eliminarVersion(db, ENT, derogada.id)).ok, false, 'no borra derogada')
  const b = await crearVersion(db, ENT, { nombre_version: 'borrador' })
  assert.equal((await eliminarVersion(db, ENT, b.id)).ok, true, 'borra borrador')
})

test('aislamiento por entidad', async () => {
  const otra = await listarVersiones(db, 'ENT_OTRA')
  assert.equal(otra.resumen.total, 0)
})
