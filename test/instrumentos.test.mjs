// Pruebas: export codificado, FUID y eliminación (Acuerdo AGN 004/2019).
import { test, before, after } from 'node:test'
import assert from 'node:assert/strict'

import { prepararBD, ENT } from './helpers/db.mjs'
import { obtenerDatosExport } from '../backend/modules/trd-ai/trd-ai.export.js'
import { filasInventario, generarFUIDExcel, generarFUIDWord } from '../backend/modules/trd-ai/trd-ai.fuid.js'
import {
  filasEliminacion, resumenEliminacion,
  generarInventarioEliminacionExcel, generarActaEliminacion
} from '../backend/modules/trd-ai/trd-ai.eliminacion.js'

let pool, db
before(async () => { ({ pool, db } = await prepararBD()) })
after(async () => { await pool.end() })

test('export agrupa por dependencia y codifica DD.SS.UU', async () => {
  const datos = await obtenerDatosExport(db, ENT)
  assert.equal(datos.length, 2, 'dos dependencias')
  const total = datos.reduce((a, d) => a + d.series.length, 0)
  assert.equal(total, 5, 'cinco series aprobadas')
  const codigos = datos.flatMap(d => d.series.map(s => s.codigo))
  assert.ok(codigos.every(c => /^\d{2}\.\d{2}(\.\d{2})?$/.test(c)), 'códigos jerárquicos válidos')
})

test('FUID: filas de inventario numeradas y completas', async () => {
  const datos = await obtenerDatosExport(db, ENT)
  const filas = filasInventario(datos)
  assert.equal(filas.length, 5)
  assert.equal(filas[0].orden, 1)
  assert.equal(filas[4].orden, 5)
  assert.ok(filas.every(f => f.oficina && f.soporte === 'Papel'))
  assert.ok(filas.some(f => f.nombre.includes(' / ')), 'combina serie/subserie')
})

test('FUID: genera Excel y Word no vacíos', async () => {
  const datos = await obtenerDatosExport(db, ENT)
  const xlsx = await generarFUIDExcel(datos, { entidad: 'X', fecha: 'y' })
  const docx = await generarFUIDWord(datos, { entidad: 'X', fecha: 'y' })
  assert.ok(Buffer.isBuffer(xlsx) && xlsx.length > 3000)
  assert.ok(Buffer.isBuffer(docx) && docx.length > 3000)
})

test('eliminación: solo series con disposición E o S', async () => {
  const datos = await obtenerDatosExport(db, ENT)
  const filas = filasEliminacion(datos)
  assert.equal(filas.length, 2, 'seed tiene 1 E + 1 S')
  assert.ok(!filas.some(f => f.disposicion === 'CT' || f.disposicion === 'M'))
  const r = resumenEliminacion(datos)
  assert.equal(r.eliminacion, 1)
  assert.equal(r.seleccion, 1)
  assert.equal(r.total, 2)
})

test('eliminación: inventario y acta generan documentos', async () => {
  const datos = await obtenerDatosExport(db, ENT)
  const xlsx = await generarInventarioEliminacionExcel(datos, { entidad: 'X' })
  const acta = await generarActaEliminacion(db, ENT, { entidad: 'X', ciudad: 'Y' })
  assert.ok(Buffer.isBuffer(xlsx) && xlsx.length > 3000)
  assert.ok(Buffer.isBuffer(acta) && acta.length > 3000)
})

test('eliminación: sin series E/S no rompe', async () => {
  const xlsx = await generarInventarioEliminacionExcel([], { entidad: 'X' })
  assert.ok(Buffer.isBuffer(xlsx))
})
