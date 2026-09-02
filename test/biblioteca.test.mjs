// Pruebas: biblioteca de referencia y plantillas por tipo de entidad.
import { test, before, after } from 'node:test'
import assert from 'node:assert/strict'

import { prepararBD } from './helpers/db.mjs'
import { listarPlantillas, construirPlantilla, precargarPlantilla } from '../backend/modules/trd-ai/trd-ai.biblioteca.js'
import { obtenerDatosExport } from '../backend/modules/trd-ai/trd-ai.export.js'

let pool, db
before(async () => { ({ pool, db } = await prepararBD()) })
after(async () => { await pool.end() })

test('lista incluye alcaldía, ESE/hospital y tránsito', () => {
  const tipos = listarPlantillas().map(p => p.tipo)
  assert.ok(tipos.includes('alcaldia'))
  assert.ok(tipos.includes('ese_hospital'))
  assert.ok(tipos.includes('transito'))
})

test('ESE trae historias clínicas valoradas con su fundamento', () => {
  const full = construirPlantilla('ese_hospital')
  const hc = full.series.find(s => s.serie === 'HISTORIAS CLÍNICAS')
  assert.ok(hc && hc.subseries.length === 3)
  assert.ok(hc.subseries.every(s => s.disposicion && s.fundamento))
})

test('plantilla inexistente devuelve null', () => {
  assert.equal(construirPlantilla('inexistente'), null)
})

test('precargar ESE crea propuestas con su regla de retención', async () => {
  const r = await precargarPlantilla(db, { tipo: 'ese_hospital', entidadId: 'ENT_ESE' })
  assert.ok(r.ok && r.creadas > 0)
  assert.equal(r.valoradas, r.creadas)
  const reglas = await db.all(
    `SELECT r.disposicion_final AS d FROM trd_reglas_retencion r
     JOIN trd_series_propuestas p ON p.id = r.propuesta_id WHERE p.entidad_id = ?`, ['ENT_ESE'])
  assert.equal(reglas.length, r.creadas)
  assert.ok(reglas.every(x => ['CT', 'E', 'S', 'M'].includes(x.d)))
})

test('flujo: precargadas nacen como propuesta; aprobadas entran al export', async () => {
  const pre = await obtenerDatosExport(db, 'ENT_ESE')
  assert.equal(pre.reduce((a, d) => a + d.series.length, 0), 0, 'sin aprobar no aparecen')
  await db.run(`UPDATE trd_series_propuestas SET estado='aprobada' WHERE entidad_id=?`, ['ENT_ESE'])
  const datos = await obtenerDatosExport(db, 'ENT_ESE')
  assert.ok(datos.reduce((a, d) => a + d.series.length, 0) > 0)
  assert.ok(datos.some(d => d.series.some(s => s.disposicion && s.retencion_gestion != null)))
})

test('precarga es idempotente', async () => {
  const r2 = await precargarPlantilla(db, { tipo: 'ese_hospital', entidadId: 'ENT_ESE' })
  assert.equal(r2.creadas, 0)
  assert.ok(r2.omitidas > 0)
})

test('tránsito incluye series misionales', async () => {
  const rt = await precargarPlantilla(db, { tipo: 'transito', entidadId: 'ENT_TRANS' })
  assert.ok(rt.ok && rt.creadas > 0)
  const ft = construirPlantilla('transito')
  assert.ok(ft.series.some(s => s.serie === 'COMPARENDOS'))
  assert.ok(ft.series.some(s => s.serie === 'LICENCIAS DE TRÁNSITO'))
})

test('aislamiento por entidad', async () => {
  const otra = await obtenerDatosExport(db, 'ENT_SIN_DATOS')
  assert.equal(otra.length, 0)
})
