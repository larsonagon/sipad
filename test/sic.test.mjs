// Pruebas: Diagnóstico Integral para el SIC (formulario, motor, datos, informe, redacción).
import { test, before, after, describe } from 'node:test'
import assert from 'node:assert/strict'

import { crearPool, adaptar, assertNoProd } from './helpers/db.mjs'
import { analizar, volumenEspacio, riesgoEspacio, riesgoRepositorio } from '../backend/modules/sic/sic.motor.js'
import { indicePreguntas, catalogo } from '../backend/modules/sic/sic.formulario.js'
import * as repo from '../backend/modules/sic/sic.repository.js'
import { generarInformeSIC } from '../backend/modules/sic/sic.informe.js'
import { redaccionBase, resumenEjecutivo, normasFueraDeLista, cifrasNoRespaldadas } from '../backend/modules/sic/sic.redaccion.js'

const v = (x, extra) => (extra === undefined ? { v: x } : { v: x, x: extra })

// Escenario parecido al de la entrevista preliminar (Aguachica)
function escenario() {
  return {
    dependencias: [{ id: 1, nombre: 'Secretaría de Gobierno' }, { id: 2, nombre: 'Secretaría de Hacienda' }, { id: 3, nombre: 'Planeación' }, { id: 4, nombre: 'Despacho' }],
    institucional: {
      'IN-01': v('si'), 'IN-02': v(30), 'IN-03': v(0), 'IN-05': v('no'), 'IN-08': v('no'),
      'IN-10': v(2), 'IN-11': v(0), 'IN-15': v('no'), 'IN-16': v('no'), 'IN-17': v('no'), 'IN-18': v('no'),
      'IN-19': v('no'), 'IN-20': v('Nadie'), 'IN-21': v('ns'), 'IN-22': v('parcial'), 'IN-23': v('parcial'),
      'IN-24': v(0), 'IN-26': v('no'), 'IN-27': v('no'), 'IN-28': v('no'), 'IN-29': v('nunca'),
      'IN-30': v('no'), 'IN-31': v('no'), 'IN-32': v('no'), 'IN-34': v('no'), 'IN-35': v('no'),
      'IN-37': v('no'), 'IN-39': v('no'), 'IN-40': v('ns'),
      'SI-01': v('parcial'), 'SI-02': v('no'), 'SI-03': v('no'), 'SI-04': v('no'), 'SI-05': v('Plataforma X'),
      'SI-06': v(['Parametrización', 'Capacitación']), 'SI-07': v('no')
    },
    espacios: [
      { id: 'E1', fotos: 3,
        registro: { 'ESP-01': v('Casa abandonada'), 'ESP-03': v(['1']), 'ESP-04': v('Inmueble externo o abandonado'), 'ESP-07': v(1), 'ESP-10': v('si') },
        ficha: { 'FI-01': v(10), 'FI-02': v(20, 20), 'FI-05': v(3, 150), 'FI-10': v({ bueno: 20, regular: 30, malo: 50 }),
          'FI-11': v('extendido'), 'FI-12': v('puntual'), 'FI-17': v('si'), 'FI-27': v('no'), 'FI-30': v('no'), 'FI-23': v('si') } },
      { id: 'E2', fotos: 1,
        registro: { 'ESP-01': v('Oficina Hacienda'), 'ESP-03': v(['2']), 'ESP-04': v('Oficina compartida') },
        ficha: { 'FI-01': v(25.5), 'FI-10': v({ bueno: 80, regular: 20, malo: 0 }), 'FI-11': v('ausente'), 'FI-12': v('ausente'),
          'FI-17': v('no'), 'FI-27': v('si'), 'FI-30': v('si'), 'FI-24': v('si'), 'FI-23': v('si'), 'FI-33': v('no') } }
    ],
    repositorios: [
      { id: 'R1', datos: { 'SR-01': v('PC del tesorero'), 'SR-02': v('Computador local'), 'SR-09': v('Nunca'), 'SR-11': v('si') } },
      { id: 'R2', datos: { 'SR-01': v('Sistema de predial'), 'SR-02': v('Aplicación misional'), 'SR-04': v('Sistemas'), 'SR-09': v('Diaria'), 'SR-11': v('si') } }
    ]
  }
}

describe('catálogo', () => {
  test('ids únicos y tipos conocidos', () => {
    const c = catalogo()
    const ids = [...c.registroEspacio, ...c.repositorio, ...c.institucional.flatMap(b => b.preguntas), ...c.ficha.flatMap(b => b.preguntas), ...c.sistemas.flatMap(b => b.preguntas)].map(p => p.id)
    assert.equal(ids.length, new Set(ids).size, 'no hay ids repetidos')
    const tipos = new Set(['spn', 'num', 'lista', 'multi', 'txt', 'escala', 'pct3', 'dep'])
    for (const p of Object.values(indicePreguntas())) assert.ok(tipos.has(p.tipo), `${p.id} tipo ${p.tipo}`)
  })
})

describe('motor', () => {
  test('volumen: estantería + cajas fuera + pilas', () => {
    const vol = volumenEspacio({ 'FI-01': v(10), 'FI-02': v(20, 20), 'FI-05': v(3, 150) })
    assert.equal(vol.total, 10 + 4 + 1.5)
    assert.equal(vol.fuera_de_estanteria, 5.5)
  })

  test('hongos extendidos fuerzan riesgo crítico', () => {
    const r = riesgoEspacio({ registro: {}, ficha: { 'FI-11': v('extendido') } })
    assert.equal(r.nivel, 'crítica')
  })

  test('espacio sin factores queda en bajo', () => {
    const r = riesgoEspacio({ registro: {}, ficha: { 'FI-11': v('ausente'), 'FI-17': v('no'), 'FI-30': v('si') } })
    assert.equal(r.nivel, 'baja')
  })

  test('repositorio indispensable, sin copia y en computador local = crítico', () => {
    const r = riesgoRepositorio({ datos: { 'SR-02': v('Computador local'), 'SR-09': v('Nunca'), 'SR-11': v('si') } })
    assert.equal(r.nivel, 'crítica')
  })

  test('análisis completo del escenario', () => {
    const a = analizar(escenario())
    assert.equal(a.volumen.total_ml, 15.5 + 25.5)
    assert.equal(a.espacios[0].nombre, 'Casa abandonada', 'el más riesgoso va primero')
    assert.equal(a.espacios[0].riesgo.nivel, 'crítica')
    assert.equal(a.resumen.repositorios_criticos, 1)
    // Hallazgos críticos clave
    const textos = a.hallazgos.map(h => h.accion).join(' | ')
    assert.match(textos, /protección personal/)
    assert.match(textos, /cuarentena/)
    assert.match(textos, /copias de seguridad/)
    assert.match(textos, /plataforma existente/)
    assert.match(textos, /Archivo Central/)
    // Orden por prioridad
    const ords = a.hallazgos.map(h => ['crítica', 'alta', 'media', 'baja'].indexOf(h.prioridad))
    assert.deepEqual(ords, [...ords].sort((x, y) => x - y))
    // Trazabilidad: todo hallazgo tiene evidencia
    assert.ok(a.hallazgos.every(h => h.evidencia.length > 0))
    // "No sabe" → verificación, nunca hallazgo
    assert.equal(a.verificaciones.length, 2)
    assert.ok(a.verificaciones.some(x => x.pregunta === 'IN-21'))
    // FUID: 0 de 4
    assert.ok(a.hallazgos.some(h => /0 de 4 dependencias/.test(h.hallazgo)))
    // Indicadores con valores 0–100
    for (const i of a.indicadores) assert.ok(i.valor === null || (i.valor >= 0 && i.valor <= 100))
    // Cronograma cubre todos los hallazgos
    assert.equal(a.cronograma.reduce((n, f) => n + f.acciones.length, 0), a.hallazgos.length)
  })

  test('mismos datos, mismo resultado (determinista)', () => {
    const a = analizar(escenario()), b = analizar(escenario())
    delete a.generado_en; delete b.generado_en
    assert.deepEqual(a, b)
  })

  test('diagnóstico vacío no rompe', () => {
    const a = analizar({})
    assert.equal(a.volumen.total_ml, 0)
    assert.equal(a.espacios.length, 0)
  })
})

describe('redacción', () => {
  test('guardia de normas y cifras', () => {
    assert.deepEqual(normasFueraDeLista('Según la Ley 594 de 2000 y el Acuerdo 999 de 2031'), ['Acuerdo 999 de 2031'])
    const hechos = { volumen_total_m: 41, malos: 12.5 }
    assert.deepEqual(cifrasNoRespaldadas('Hay 41 metros, 12,5 en mal estado y 380 cajas', hechos), ['380'])
  })

  test('sin clave usa la síntesis del motor', async () => {
    const a = analizar(escenario())
    const r = await resumenEjecutivo(a, { entidad: 'Alcaldía', apiKey: null })
    assert.equal(r.fuente, 'motor')
    assert.match(r.texto, /41 metros lineales/)
  })

  test('con LLM inyectado advierte cifras inventadas', async () => {
    const a = analizar(escenario())
    const r = await resumenEjecutivo(a, { entidad: 'Alcaldía', llm: async () => 'La entidad tiene 41 metros lineales y 9999 cajas.' })
    assert.equal(r.fuente, 'asistente')
    assert.ok(r.advertencias.some(x => x.includes('9999')))
  })
})

describe('datos (Postgres)', () => {
  let pool, db
  const ENT = 'ENT_SIC', OTRA = 'ENT_SIC_OTRA'
  before(async () => {
    assertNoProd()
    pool = crearPool(); db = adaptar(pool)
    for (const t of ['sic_respuestas', 'sic_espacios', 'sic_fotos', 'sic_repositorios', 'sic_meta']) await db.exec(`DROP TABLE IF EXISTS ${t} CASCADE`)
    await db.exec(`CREATE TABLE IF NOT EXISTS entidades (id TEXT PRIMARY KEY, nombre TEXT)`)
    await db.exec(`CREATE TABLE IF NOT EXISTS dependencias (id SERIAL PRIMARY KEY, nombre TEXT, activa BOOLEAN DEFAULT true, entidad_id TEXT, created_at TIMESTAMP DEFAULT now())`)
    await db.run(`DELETE FROM dependencias WHERE entidad_id IN (?, ?)`, [ENT, OTRA])
    await db.run(`INSERT INTO entidades (id, nombre) VALUES (?, ?) ON CONFLICT (id) DO NOTHING`, [ENT, 'Alcaldía de Prueba SIC'])
    await db.run(`INSERT INTO dependencias (id, nombre, activa, entidad_id) VALUES (901, 'Gobierno', true, ?) ON CONFLICT (id) DO NOTHING`, [ENT])
    await db.run(`INSERT INTO dependencias (id, nombre, activa, entidad_id) VALUES (902, 'Ajena', true, ?) ON CONFLICT (id) DO NOTHING`, [OTRA])
    await repo.runSICMigration(db)
    await repo.runSICMigration(db) // idempotente
  })
  after(async () => { await pool?.end() })

  test('respuestas: guarda, valida y borra', async () => {
    assert.equal((await repo.guardarRespuestas(db, ENT, { 'IN-01': { v: 'si', s: 'Decreto 10' }, 'IN-02': 40 }, 'tecnico')).ok, true)
    assert.equal((await repo.guardarRespuestas(db, ENT, { 'IN-01': 'tal vez' })).ok, false, 'rechaza valor inválido')
    assert.equal((await repo.guardarRespuestas(db, ENT, { 'FI-01': 3 })).ok, false, 'rechaza pregunta de otra sección')
    assert.equal((await repo.guardarRespuestas(db, ENT, { 'IN-02': 150 })).ok, false, 'porcentaje > 100')
    await repo.guardarRespuestas(db, ENT, { 'IN-02': 50 })
    let e = await repo.obtenerEstado(db, ENT)
    assert.equal(e.institucional['IN-02'].v, 50)
    assert.equal(e.institucional['IN-01'].s, 'Decreto 10')
    await repo.guardarRespuestas(db, ENT, { 'IN-02': null })
    e = await repo.obtenerEstado(db, ENT)
    assert.equal(e.institucional['IN-02'], undefined)
  })

  test('espacios: crear, ficha parcial, dependencias de la entidad, fotos', async () => {
    assert.equal((await repo.crearEspacio(db, ENT, { registro: {} })).ok, false, 'exige nombre')
    assert.equal((await repo.crearEspacio(db, ENT, { registro: { 'ESP-01': 'X', 'ESP-03': ['902'] } })).ok, false, 'dependencia ajena')
    const c = await repo.crearEspacio(db, ENT, { registro: { 'ESP-01': 'Bodega', 'ESP-03': ['901'] } }, 'tecnico')
    assert.ok(c.ok)
    assert.ok((await repo.actualizarEspacio(db, ENT, c.id, { ficha: { 'FI-01': 12, 'FI-11': 'puntual' } })).ok)
    assert.ok((await repo.actualizarEspacio(db, ENT, c.id, { ficha: { 'FI-10': { bueno: 50, regular: 30, malo: 20 } } })).ok)
    assert.equal((await repo.actualizarEspacio(db, ENT, c.id, { ficha: { 'FI-10': { bueno: 50, regular: 30, malo: 30 } } })).ok, false, 'suma ≠ 100')
    const png = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg=='
    assert.equal((await repo.agregarFoto(db, ENT, c.id, { mime: 'application/pdf', datos: png })).ok, false)
    const f = await repo.agregarFoto(db, ENT, c.id, { nombre: 'pano.png', mime: 'image/png', datos: png, ancho: 1, alto: 1 })
    assert.ok(f.ok)
    const e = await repo.obtenerEstado(db, ENT)
    const esp = e.espacios.find(x => x.id === c.id)
    assert.equal(esp.ficha['FI-01'].v, 12)
    assert.equal(esp.ficha['FI-11'].v, 'puntual', 'el parche no borra lo anterior')
    assert.equal(esp.fotos, 1)
    assert.equal((await repo.obtenerFoto(db, OTRA, f.id)), null, 'foto aislada por entidad')
  })

  test('repositorios y aislamiento por entidad', async () => {
    const r = await repo.crearRepositorio(db, ENT, { datos: { 'SR-01': 'Drive personal', 'SR-02': 'Nube personal', 'SR-09': 'Nunca', 'SR-11': 'si' } })
    assert.ok(r.ok)
    assert.equal((await repo.actualizarRepositorio(db, OTRA, r.id, { datos: { 'SR-04': 'x' } })).ok, false)
    assert.equal((await repo.eliminarEspacio(db, OTRA, 'cualquiera')).ok, false)
    const otra = await repo.obtenerEstado(db, OTRA)
    assert.equal(otra.espacios.length + otra.repositorios.length + Object.keys(otra.institucional).length, 0)
  })

  test('informe Word se genera con los datos reales', async () => {
    const estado = await repo.obtenerEstado(db, ENT)
    const a = analizar(estado)
    const fotos = await repo.fotosParaInforme(db, ENT)
    const buf = await generarInformeSIC({ analisis: a, estado, entidad: 'Alcaldía de Prueba SIC', fotos, redaccion: redaccionBase(a, { entidad: 'Alcaldía de Prueba SIC' }) })
    assert.ok(buf.length > 5000)
    assert.equal(buf.slice(0, 2).toString(), 'PK', 'es un .docx (zip)')
  })

  test('eliminar espacio borra sus fotos', async () => {
    const e = await repo.obtenerEstado(db, ENT)
    const id = e.espacios[0].id
    assert.ok((await repo.eliminarEspacio(db, ENT, id)).ok)
    const n = await db.get(`SELECT COUNT(*) AS n FROM sic_fotos WHERE espacio_id = ?`, [id])
    assert.equal(Number(n.n), 0)
  })
})
