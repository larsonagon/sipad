// ======================================================
// SIPAD · Helper de base de datos para pruebas
// ------------------------------------------------------
// Conecta a Postgres (DATABASE_URL o variables PG*), expone el
// mismo adaptador db { exec, run, all, get } que usa la app
// (traduce placeholders ?→$n), y ofrece resetAndSeed() para
// dejar un esquema limpio con datos deterministas antes de cada
// archivo de pruebas.
//
// Requiere una base Postgres de PRUEBAS (nunca producción):
//   - En CI: el servicio postgres del workflow.
//   - En local: DATABASE_URL=postgres://sipad@/sipadtest?host=/tmp&port=5433
// ======================================================

import pg from 'pg'
import { runTRDMigration } from '../../backend/modules/trd/trd.migration.js'
import { runTRDAIMigration } from '../../backend/modules/trd-ai/trd-ai.migration.js'

export function crearPool() {
  const url = process.env.DATABASE_URL
  if (url) return new pg.Pool({ connectionString: url, ssl: /localhost|127\.0\.0\.1|\/tmp|@\/|host=/.test(url) ? false : { rejectUnauthorized: false } })
  // Config por variables PG* (CI) con valores por defecto locales
  return new pg.Pool({
    host: process.env.PGHOST || '/tmp',
    port: Number(process.env.PGPORT || 5433),
    user: process.env.PGUSER || 'sipad',
    password: process.env.PGPASSWORD || undefined,
    database: process.env.PGDATABASE || 'sipadtest'
  })
}

// Adaptador idéntico al de la app: ? → $n
export function adaptar(pool) {
  const cp = q => { let i = 0; return q.replace(/\?/g, () => '$' + (++i)) }
  return {
    exec: q => pool.query(q),
    run: async (q, p = []) => ({ changes: (await pool.query(cp(q), p)).rowCount }),
    all: async (q, p = []) => (await pool.query(cp(q), p)).rows,
    get: async (q, p = []) => (await pool.query(cp(q), p)).rows[0] || null
  }
}

// Tablas base (las que crean otros módulos) — mínimas para las pruebas.
async function crearTablasBase(db) {
  await db.exec(`CREATE TABLE IF NOT EXISTS entidades (id TEXT PRIMARY KEY, nombre TEXT)`)
  await db.exec(`CREATE TABLE IF NOT EXISTS dependencias (
    id SERIAL PRIMARY KEY, nombre TEXT, activa BOOLEAN DEFAULT true, entidad_id TEXT, created_at TIMESTAMP DEFAULT now())`)
  await db.exec(`CREATE TABLE IF NOT EXISTS segtec_actividades (
    id TEXT PRIMARY KEY, dependencia_id INTEGER, tipo_funcion TEXT, entidad_id TEXT)`)
}

// GUARDIA DE SEGURIDAD: impide que las pruebas (que hacen DROP TABLE)
// corran contra una base que parezca de PRODUCCIÓN.
export function assertNoProd() {
  const url = process.env.DATABASE_URL || ''
  if (/render\.com|oregon-postgres|amazonaws|\.rds\.|supabase|neon\.tech/i.test(url)) {
    throw new Error('SEGURIDAD: DATABASE_URL parece de PRODUCCIÓN. Las pruebas se abortan para no borrar datos reales. Usa una base de datos de prueba.')
  }
  if (url && !/test/i.test(url)) {
    throw new Error('SEGURIDAD: la base de datos de pruebas debe incluir "test" en su nombre (p. ej. sipadtest). Se aborta para proteger datos.')
  }
}

// Deja el esquema TRD limpio (borra lo que gestionan las migraciones que probamos).
export async function resetSchema(db) {
  assertNoProd()
  const tablas = [
    'trd_reglas_retencion', 'trd_series_propuestas', 'trd_observaciones', 'trd_convalidacion',
    'trd_aprendizaje', 'tipologias', 'subseries', 'series', 'trd_versiones',
    'segtec_actividades', 'dependencias', 'entidades'
  ]
  for (const t of tablas) await db.exec(`DROP TABLE IF EXISTS ${t} CASCADE`)
  await crearTablasBase(db)
  await runTRDMigration(db)      // trd_versiones, series, subseries, tipologias, macro/subfunciones
  await runTRDAIMigration(db)    // propuestas, reglas, convalidacion, observaciones, aprendizaje (+ columnas aditivas)
}

export const ENT = 'ENT_TEST'

// Datos deterministas: 1 entidad, 2 dependencias, 5 series aprobadas
// con disposiciones CT/E/S/M para cubrir export, FUID y eliminación.
export async function seed(db) {
  await db.run(`INSERT INTO entidades (id, nombre) VALUES (?, ?)`, [ENT, 'Alcaldía de Prueba'])
  await db.run(`INSERT INTO dependencias (id, nombre, activa, entidad_id) VALUES (1,'Despacho del Alcalde', true, ?)`, [ENT])
  await db.run(`INSERT INTO dependencias (id, nombre, activa, entidad_id) VALUES (2,'Secretaría de Hacienda', true, ?)`, [ENT])
  await db.exec(`SELECT setval(pg_get_serial_sequence('dependencias','id'), 3, false)`)

  const props = [
    ['P1', 'ACTAS', 'Actas de comité institucional de gestión y desempeño', '["Citación","Acta","Anexos"]', 1],
    ['P2', 'CONTRATOS', 'Contratos de prestación de servicios', '["Estudios previos","Minuta","Pólizas"]', 2],
    ['P3', 'HISTORIAS LABORALES', null, '["Hoja de vida","Afiliaciones"]', 2],
    ['P4', 'COMPROBANTES', 'Comprobantes de egreso', '["Comprobante","Soportes"]', 2],
    ['P5', 'CORRESPONDENCIA', 'Comunicaciones oficiales enviadas', '["Oficio","Anexos"]', 1]
  ]
  for (const [id, serie, sub, tip, dep] of props) {
    await db.run(
      `INSERT INTO trd_series_propuestas (id, nombre_serie, nombre_subserie, tipologia_documental, estado, entidad_id, dependencia_id, creado_en)
       VALUES (?, ?, ?, ?, 'aprobada', ?, ?, ?)`,
      [id, serie, sub, tip, ENT, dep, new Date().toISOString()]
    )
  }
  const reglas = [
    ['R1', 'P1', 2, 8, 'CT', 'Valor secundario histórico. Ley 594/2000 art. 24.'],
    ['R2', 'P2', 2, 18, 'S', 'Selección estadística 10%. Acuerdo AGN 004/2019.'],
    ['R3', 'P3', 5, 80, 'CT', 'Conservación por derechos pensionales.'],
    ['R4', 'P4', 2, 8, 'E', 'Eliminación: prescripción contable. Publicar inventario 60 días.'],
    ['R5', 'P5', 2, 3, 'M', 'Digitalización con valor legal.']
  ]
  for (const [id, pid, ag, ac, disp, fund] of reglas) {
    await db.run(
      `INSERT INTO trd_reglas_retencion (id, propuesta_id, retencion_gestion, retencion_central, disposicion_final, fundamento_normativo, creado_en)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [id, pid, ag, ac, disp, fund, new Date().toISOString()]
    )
  }
}

// Prepara todo y devuelve { pool, db }. Cada archivo de test lo llama en before().
export async function prepararBD() {
  const pool = crearPool()
  const db = adaptar(pool)
  await resetSchema(db)
  await seed(db)
  return { pool, db }
}
