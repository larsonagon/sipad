// Pruebas: Diagnóstico Integral para el SIC (formulario, motor, datos, informe, redacción).
import { test, before, after, describe } from 'node:test'
import assert from 'node:assert/strict'

import { crearPool, adaptar, assertNoProd } from './helpers/db.mjs'
import { analizar, riesgoEspacio, riesgoRepositorio, avance } from '../backend/modules/sic/sic.motor.js'
import { indicePreguntas, catalogo, aplica } from '../backend/modules/sic/sic.formulario.js'
import * as repo from '../backend/modules/sic/sic.repository.js'
import { generarInformeSIC } from '../backend/modules/sic/sic.informe.js'
import { redaccionBase, resumenEjecutivo, normasFueraDeLista, cifrasNoRespaldadas } from '../backend/modules/sic/sic.redaccion.js'

const v = (x, extra) => (extra === undefined ? { v: x } : { v: x, x: extra })

// Escenario parecido al de la entrevista preliminar (Aguachica)
function escenario() {
  return {
    dependencias: [{ id: 1, nombre: 'Secretaría de Gobierno' }, { id: 2, nombre: 'Secretaría de Hacienda' }, { id: 3, nombre: 'Planeación' }, { id: 4, nombre: 'Despacho' }],
    institucional: {
      'P-002': v('no'), 'P-003': v('no'), 'P-005': v('no'), 'P-006': v('no'), 'P-011': v('si'),
      'P-014': v('si'), 'P-021': { v: 'si', o: 'Sí, pero no se utiliza.' }, 'P-023': v('En los computadores de los funcionarios y en Google Drive'),
      'P-024': v('no'), 'P-034': v('parcial'), 'P-035': v('no'), 'P-043': v('no'), 'P-046': v('no'), 'P-047': v('si'), 'P-048': v('si'),
      'P-050': v('si'), 'P-051': v('no'), 'P-058': v('ns'), 'P-072': v('no'), 'P-081': v('no'), 'P-082': v('no'),
      'P-107': v('no'), 'P-113': v('no'), 'P-129': { v: 'no', o: 'Nada formal; se cree que sí ha habido eliminaciones.' },
      'P-130': v('Ninguna persona o instancia.'), 'P-112': v('ns')
    },
    espacios: [
      { id: 'E1', fotos: 3,
        registro: { 'ESP-01': v('Casa abandonada'), 'ESP-03': v(['1']), 'ESP-04': v('Inmueble externo o abandonado'), 'ESP-07': v(1), 'ESP-10': v('si') },
        ficha: { 'FI-26': v(['Estantería de madera', 'Cajas en el piso']), 'FI-10': v({ bueno: 20, regular: 30, malo: 50 }),
          'FI-11': v('extendido'), 'FI-12': v('puntual'), 'FI-17': v('si'), 'FI-27': v('no'), 'FI-30': v('no'), 'FI-23': v('si') } },
      { id: 'E2', fotos: 1,
        registro: { 'ESP-01': v('Oficina Hacienda'), 'ESP-03': v(['2']), 'ESP-04': v('Oficina compartida') },
        ficha: { 'FI-10': v({ bueno: 80, regular: 20, malo: 0 }), 'FI-11': v('ausente'), 'FI-12': v('ausente'),
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

describe('cuestionario de 140', () => {
  test('140 preguntas numeradas en orden, con su redacción', () => {
    // Las 140 del levantamiento conservan su número; las preguntas filtro (p. ej. 30A) van aparte
    const ps = catalogo().institucional.flatMap(b => b.preguntas).filter(p => typeof p.n === 'number')
    assert.equal(ps.length, 140)
    assert.deepEqual(ps.map(p => p.n), Array.from({ length: 140 }, (_, i) => i + 1))
    assert.equal(ps[112].texto, '¿Existe algún espacio que pueda destinarse progresivamente como Archivo Central?')
    assert.equal(catalogo().sistemas.length, 0)
  })

  test('preguntas que dependen de otra respuesta', () => {
    const todas = catalogo().institucional.flatMap(b => b.preguntas)
    const ids = new Set(todas.map(p => p.id))
    for (const p of todas.filter(q => q.noAplicaSi)) assert.ok(ids.has(p.noAplicaSi.pregunta), p.id)
    const p31 = todas.find(p => p.id === 'P-031'), p136 = todas.find(p => p.id === 'P-136')
    assert.equal(aplica(p31, { 'P-141': { v: 'no' } }), false)
    assert.equal(aplica(p31, { 'P-141': { v: 'parcial' } }), true)
    assert.equal(aplica(p136, {}), true)
    const base = { espacios: [], repositorios: [], auditoria: {} }
    assert.equal(avance({ ...base, institucional: { 'P-141': v('no'), 'P-034': v('no'), 'P-021': v('no') } }).institucional.total, 134)
  })

  test('interpreta la respuesta en palabras', () => {
    const t = { 'Sí.': 'si', 'Sí, pero no se utiliza.': 'si', 'No.': 'no', 'No existe nada.': 'no', 'Algunas.': 'parcial', 'En algunos casos.': 'parcial',
      'Quizá.': 'ns', 'Lo duda.': 'ns', 'No lo sabe; requiere verificación.': 'ns', 'No muchos.': 'parcial', 'Las TRD se están actualizando.': 'parcial',
      'Cada dependencia lo hace de manera independiente.': 'no' }
    for (const [txt, esperado] of Object.entries(t)) assert.equal(repo.interpretarRespuesta(txt), esperado, txt)
  })

  test('lee el Word de la entrevista y precarga sin pisar lo ya respondido', async () => {
    const { Document, Packer, Paragraph } = await import('docx')
    const parrafos = ['DIAGNÓSTICO PRELIMINAR', '1. ¿Quién es responsable de coordinar/administrar la gestión documental y los archivos?', 'Un técnico administrativo.',
      '6. ¿Existe un Archivo Central independiente?', 'No.', '58. ¿Se puede saber con certeza qué documentos existen, dónde están y cuánto hay?', 'Lo duda.']
    const buf = await Packer.toBuffer(new Document({ sections: [{ children: parrafos.map(t => new Paragraph(t)) }] }))
    const r = repo.respuestasDesdeParrafos(await repo.parrafosDocx(buf))
    assert.deepEqual(r['P-001'], { v: 'Un técnico administrativo.' })
    assert.deepEqual(r['P-006'], { v: 'no', o: 'No.' })
    assert.equal(r['P-058'].v, 'ns')
  })
})

describe('motor', () => {
  test('sin medición: no se pide volumen, el área es un rango opcional y las fotos son opcionales', () => {
    const idx = indicePreguntas()
    for (const id of ['FI-01', 'FI-02', 'FI-03', 'FI-04', 'FI-05']) assert.equal(idx[id], undefined, `${id} ya no se pregunta`)
    assert.equal(idx['ESP-08'].tipo, 'lista')
    assert.ok(idx['ESP-08'].opcional)
    assert.equal(catalogo().fotosMinimas, 0)
    // Una ficha con todas sus preguntas respondidas queda completa aunque no tenga fotos
    const ficha = {}
    for (const b of catalogo().ficha) for (const q of b.preguntas) if (!q.opcional) ficha[q.id] = v('x')
    const av = avance({ institucional: {}, repositorios: [], espacios: [{ id: 'E', registro: {}, ficha, fotos: 0 }] })
    assert.equal(av.espacios.fichasCompletas, 1)
  })

  test('cajas en el piso suman al riesgo y generan la acción de elevarlas', () => {
    const r = riesgoEspacio({ registro: {}, ficha: { 'FI-26': v(['Cajas en el piso']) } })
    assert.ok(r.factores.some(f => /piso/.test(f.factor)))
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
    assert.equal(a.volumen, undefined, 'el análisis ya no reporta volumen')
    assert.ok(a.hallazgos.some(h => /sobre el piso/.test(h.hallazgo)))
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
    assert.match(textos, /eliminación informal/)
    // Todo hallazgo del cuestionario cita su pregunta (P-xxx)
    assert.ok(a.hallazgos.filter(h => h.componente === 'GOB').every(h => h.evidencia.some(e => /^P-\d{3}$/.test(e))))
    // Orden por prioridad
    const ords = a.hallazgos.map(h => ['crítica', 'alta', 'media', 'baja'].indexOf(h.prioridad))
    assert.deepEqual(ords, [...ords].sort((x, y) => x - y))
    // Trazabilidad: todo hallazgo tiene evidencia
    assert.ok(a.hallazgos.every(h => h.evidencia.length > 0))
    // "No sabe" → verificación, nunca hallazgo
    assert.equal(a.verificaciones.length, 2)
    assert.ok(a.verificaciones.some(x => x.pregunta === 'P-058'))
    assert.ok(a.hallazgos.some(h => /FUID/.test(h.hallazgo)))
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
    assert.match(r.texto, /2 espacio\(s\)/)
    assert.doesNotMatch(r.texto, /metros lineales/)
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
    assert.equal((await repo.guardarRespuestas(db, ENT, { 'P-002': { v: 'si', s: 'Decreto 10', o: 'Sí, por decreto.' }, 'P-001': 'Un técnico administrativo.' }, 'tecnico')).ok, true)
    assert.equal((await repo.guardarRespuestas(db, ENT, { 'P-002': 'tal vez' })).ok, false, 'rechaza valor inválido')
    assert.equal((await repo.guardarRespuestas(db, ENT, { 'FI-11': 'puntual' })).ok, false, 'rechaza pregunta de otra sección')
    let e = await repo.obtenerEstado(db, ENT)
    assert.equal(e.institucional['P-001'].v, 'Un técnico administrativo.')
    assert.equal(e.institucional['P-002'].s, 'Decreto 10')
    assert.equal(e.institucional['P-002'].o, 'Sí, por decreto.')
    await repo.guardarRespuestas(db, ENT, { 'P-001': null })
    e = await repo.obtenerEstado(db, ENT)
    assert.equal(e.institucional['P-001'], undefined)
  })

  test('espacios: crear, ficha parcial, dependencias de la entidad, fotos', async () => {
    assert.equal((await repo.crearEspacio(db, ENT, { registro: {} })).ok, false, 'exige nombre')
    assert.equal((await repo.crearEspacio(db, ENT, { registro: { 'ESP-01': 'X', 'ESP-03': ['902'] } })).ok, false, 'dependencia ajena')
    const c = await repo.crearEspacio(db, ENT, { registro: { 'ESP-01': 'Bodega', 'ESP-03': ['901'] } }, 'tecnico')
    assert.ok(c.ok)
    assert.ok((await repo.actualizarEspacio(db, ENT, c.id, { ficha: { 'FI-06': ['Planos'], 'FI-11': 'puntual' } })).ok)
    assert.equal((await repo.actualizarEspacio(db, ENT, c.id, { ficha: { 'FI-01': 12 } })).ok, false, 'el volumen ya no existe')
    assert.ok((await repo.actualizarEspacio(db, ENT, c.id, { ficha: { 'FI-10': { bueno: 50, regular: 30, malo: 20 } } })).ok)
    assert.equal((await repo.actualizarEspacio(db, ENT, c.id, { ficha: { 'FI-10': { bueno: 50, regular: 30, malo: 30 } } })).ok, false, 'suma ≠ 100')
    const png = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg=='
    assert.equal((await repo.agregarFoto(db, ENT, c.id, { mime: 'application/pdf', datos: png })).ok, false)
    const f = await repo.agregarFoto(db, ENT, c.id, { nombre: 'pano.png', mime: 'image/png', datos: png, ancho: 1, alto: 1 })
    assert.ok(f.ok)
    const e = await repo.obtenerEstado(db, ENT)
    const esp = e.espacios.find(x => x.id === c.id)
    assert.deepEqual(esp.ficha['FI-06'].v, ['Planos'])
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
