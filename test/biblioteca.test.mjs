// Pruebas: biblioteca de referencia y plantillas por tipo de entidad.
import { test, before, after } from 'node:test'
import assert from 'node:assert/strict'

import { prepararBD } from './helpers/db.mjs'
import { listarPlantillas, construirPlantilla, precargarPlantilla, construirBancoMisional } from '../backend/modules/trd-ai/trd-ai.biblioteca.js'
import { anotarMisional } from '../backend/modules/trd-ai/trd-ai.biblioteca-matrices.js'
import { valorarSerie } from '../backend/modules/trd-ai/trd-ai.valoracion.js'
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

// --- BANTER (series comunes) + replicado en dependencias ---
test('BANTER está disponible con sus series comunes', () => {
  const full = construirPlantilla('banter')
  assert.ok(full, 'plantilla banter existe')
  const ac = full.series.find(s => s.serie === 'ACCIONES CONSTITUCIONALES')
  assert.ok(ac && ac.subseries.length === 4)
  assert.ok(full.series.some(s => s.serie.startsWith('PETICIONES')))
  assert.ok(full.series.some(s => s.serie === 'DERECHOS DE PETICIÓN'))
})

test('BANTER: replicar en varias dependencias crea una copia por dependencia', async () => {
  const N = construirPlantilla('banter').totalSubseries
  const r = await precargarPlantilla(db, { tipo: 'banter', entidadId: 'ENT_BANTER', dependencias: [1, 2] })
  assert.equal(r.dependencias, 2)
  assert.equal(r.creadas, 2 * N)
  const porDep = await db.all(
    `SELECT dependencia_id, COUNT(*) n FROM trd_series_propuestas WHERE entidad_id='ENT_BANTER' GROUP BY dependencia_id`)
  assert.equal(porDep.length, 2)
  assert.ok(porDep.every(x => Number(x.n) === N))
})

test('BANTER: replicado es idempotente e incremental por dependencia', async () => {
  const N = construirPlantilla('banter').totalSubseries
  const r2 = await precargarPlantilla(db, { tipo: 'banter', entidadId: 'ENT_BANTER', dependencias: [1, 2] })
  assert.equal(r2.creadas, 0)
  assert.equal(r2.omitidas, 2 * N)
  const r3 = await precargarPlantilla(db, { tipo: 'banter', entidadId: 'ENT_BANTER', dependencias: [1, 2, 3] })
  assert.equal(r3.creadas, N, 'solo la dependencia nueva recibe copias')
})

test('BANTER: sin dependencias se precarga a nivel de entidad (una vez)', async () => {
  const N = construirPlantilla('banter').totalSubseries
  const r = await precargarPlantilla(db, { tipo: 'banter', entidadId: 'ENT_BANTER_ENT' })
  assert.equal(r.dependencias, 0)
  assert.equal(r.creadas, N)
})

// --- Capa misional (procesos misionales por tipo de entidad) ---
test('cada serie de la plantilla trae su etiqueta misional', () => {
  const full = construirPlantilla('alcaldia')
  assert.ok(full.series.every(s => typeof s.misional === 'boolean'), 'toda serie declara si es misional')
  const planes = full.series.find(s => s.serie === 'PLANES')
  assert.ok(planes.misional && planes.proceso_misional === 'Planeación y ordenamiento territorial')
  assert.equal(planes.dependencia_productora, 'Secretaría de Planeación')
})

test('las series transversales NO se marcan como misionales', () => {
  const full = construirPlantilla('alcaldia')
  const actas = full.series.find(s => s.serie === 'ACTAS')
  assert.ok(actas && actas.misional === false && actas.proceso_misional === null)
})

test('banco misional de alcaldía separa misional de común y cita fundamento', () => {
  const b = construirBancoMisional('alcaldia')
  assert.ok(b.procesos.length >= 2)
  assert.ok(b.totalMisional > 0 && b.totalComunes > 0)
  assert.ok(b.procesos.every(p => p.fundamento && p.dependencia_productora && p.series.length))
})

test('BANTER no aporta series misionales (todo es transversal)', () => {
  const b = construirBancoMisional('banter')
  assert.equal(b.totalMisional, 0)
  assert.ok(b.totalComunes > 0)
})

test('alcaldía trae series tributarias propias, marcadas misional de Hacienda', () => {
  const full = construirPlantilla('alcaldia')
  const predial = full.series.find(s => s.serie === 'IMPUESTO PREDIAL UNIFICADO')
  const ica = full.series.find(s => s.serie === 'INDUSTRIA Y COMERCIO')
  assert.ok(predial && ica, 'existen las dos series tributarias')
  assert.ok(predial.misional && predial.proceso_misional === 'Gestión tributaria y de rentas')
  assert.ok(ica.misional && ica.dependencia_productora === 'Secretaría de Hacienda')
  // BASES DE DATOS queda transversal (mezcla predial/ICA con SISBEN)
  assert.equal(full.series.find(s => s.serie === 'BASES DE DATOS').misional, false)
  // Valoración aterrizada en el marco fiscal (no el respaldo genérico)
  const subPredial = predial.subseries[0]
  assert.equal(subPredial.disposicion, 'S')
  assert.match(subPredial.fundamento, /817|Ley 44 de 1990/)
})

test('precarga: empareja la productora sugerida con la dependencia de igual nombre', async () => {
  const ENT = 'ENT_MIS'
  await db.run(`INSERT INTO entidades (id, nombre) VALUES (?, ?)`, [ENT, 'Alcaldía Misional'])
  await db.run(`INSERT INTO dependencias (nombre, activa, entidad_id) VALUES (?, true, ?)`, ['Secretaría de Hacienda', ENT])
  const dep = await db.get(`SELECT id FROM dependencias WHERE entidad_id = ? AND nombre = ?`, [ENT, 'Secretaría de Hacienda'])

  const r = await precargarPlantilla(db, { tipo: 'alcaldia', entidadId: ENT })
  assert.ok(r.ok && r.creadas > 0)
  assert.ok(r.seriesAutoasignadas >= 2, 'predial e industria y comercio se auto-asignan a Hacienda')

  // Las series tributarias quedan en la dependencia Hacienda (coincidencia exacta)
  const predial = await db.all(
    `SELECT DISTINCT dependencia_id AS d FROM trd_series_propuestas WHERE entidad_id=? AND nombre_serie='IMPUESTO PREDIAL UNIFICADO'`, [ENT])
  assert.equal(predial.length, 1)
  assert.equal(Number(predial[0].d), Number(dep.id))

  // Planeación no coincide con ninguna dependencia existente → se deja sin asignar
  const planes = await db.all(
    `SELECT dependencia_id AS d FROM trd_series_propuestas WHERE entidad_id=? AND nombre_serie='PLANES'`, [ENT])
  assert.ok(planes.length && planes.every(x => x.d == null))
})

test('alcaldía incluye el proceso misional de Gobierno con sus series', () => {
  const b = construirBancoMisional('alcaldia')
  const gob = b.procesos.find(p => p.proceso === 'Gobierno, seguridad y convivencia')
  assert.ok(gob, 'existe el proceso de Gobierno')
  const cf = gob.series.find(s => s.serie === 'COMISARÍA DE FAMILIA')
  const ip = gob.series.find(s => s.serie === 'INSPECCIÓN DE POLICÍA')
  assert.ok(cf && cf.disposicion === 'CT', 'comisaría de familia se conserva (protección de NNA)')
  assert.ok(ip && ip.disposicion === 'S', 'inspección de policía se selecciona')
})

test('regresión: series con tilde resuelven en el KB (no caen al respaldo)', () => {
  for (const s of ['AUDITORÍAS', 'CONCEPTOS TÉCNICOS', 'COMISARÍA DE FAMILIA', 'INSPECCIÓN DE POLICÍA']) {
    const v = valorarSerie(s, null)
    assert.equal(v.origen, 'kb', `${s} debe valorarse desde el KB, no por contexto`)
  }
})

test('anotarMisional respeta tildes y devuelve null en transversales', () => {
  assert.ok(anotarMisional('alcaldia', 'CONCEPTOS TÉCNICOS'))
  assert.ok(anotarMisional('ese_hospital', 'HISTORIAS CLÍNICAS'))
  assert.equal(anotarMisional('alcaldia', 'INFORMES'), null)
})
