export async function runTRDMigration(db) {

  // =====================================================
  // MACROFUNCIONES
  // =====================================================

  await db.exec(`
    CREATE TABLE IF NOT EXISTS macrofunciones (
      id TEXT PRIMARY KEY,
      codigo TEXT NOT NULL UNIQUE,
      nombre TEXT NOT NULL,
      descripcion TEXT,
      tipo TEXT CHECK(tipo IN ('misional','apoyo','control','estrategica')),
      activo INTEGER DEFAULT 1
    )
  `)

  // =====================================================
  // SUBFUNCIONES
  // =====================================================

  await db.exec(`
    CREATE TABLE IF NOT EXISTS subfunciones (
      id TEXT PRIMARY KEY,
      macrofuncion_id TEXT NOT NULL,
      nombre TEXT NOT NULL,
      descripcion TEXT,
      activo INTEGER DEFAULT 1,
      fecha_creacion TEXT,
      creado_por TEXT,
      FOREIGN KEY (macrofuncion_id) REFERENCES macrofunciones(id)
    )
  `)

  // =====================================================
  // PROCESOS
  // =====================================================

  await db.exec(`
    CREATE TABLE IF NOT EXISTS procesos (
      id TEXT PRIMARY KEY,
      subfuncion_id TEXT NOT NULL,
      nombre TEXT NOT NULL,
      descripcion TEXT,
      estado TEXT CHECK(estado IN ('propuesto','en_revision','aprobado','rechazado')) DEFAULT 'propuesto',
      propuesto_por TEXT,
      fecha_propuesta TEXT,
      aprobado_por TEXT,
      fecha_aprobacion TEXT,
      FOREIGN KEY (subfuncion_id) REFERENCES subfunciones(id)
    )
  `)

  // =====================================================
  // TRD VERSIONES
  // =====================================================

  await db.exec(`
    CREATE TABLE IF NOT EXISTS trd_versiones (
      id TEXT PRIMARY KEY,
      nombre_version TEXT NOT NULL,
      modo_creacion TEXT CHECK(modo_creacion IN ('manual','asistido','mixto')),
      fecha_inicio_vigencia TEXT,
      fecha_fin_vigencia TEXT,
      estado TEXT CHECK(estado IN ('borrador','en_revision','aprobada','derogada')),
      acto_administrativo TEXT,
      numero_acto TEXT,
      fecha_acto TEXT,
      observaciones TEXT,
      entidad_id TEXT
    )
  `)

  // =====================================================
  // SERIES
  // =====================================================

  await db.exec(`
    CREATE TABLE IF NOT EXISTS series (
      id TEXT PRIMARY KEY,
      trd_version_id TEXT NOT NULL,
      macrofuncion_id TEXT,
      subfuncion_id TEXT,
      nombre TEXT NOT NULL,
      codigo TEXT,
      tiempo_gestion INTEGER,
      tiempo_central INTEGER,
      disposicion_final TEXT CHECK(disposicion_final IN ('CT','EL','ST','MT')),
      dependencia_id INTEGER,
      entidad_id TEXT,
      propuesta_id TEXT,
      FOREIGN KEY (trd_version_id) REFERENCES trd_versiones(id),
      FOREIGN KEY (macrofuncion_id) REFERENCES macrofunciones(id),
      FOREIGN KEY (subfuncion_id) REFERENCES subfunciones(id)
    )
  `)

  // =====================================================
  // SUBSERIES
  // =====================================================

  await db.exec(`
    CREATE TABLE IF NOT EXISTS subseries (
      id TEXT PRIMARY KEY,
      serie_id TEXT NOT NULL,
      nombre TEXT NOT NULL,
      codigo TEXT,
      tiempo_gestion INTEGER,
      tiempo_central INTEGER,
      disposicion_final TEXT CHECK(disposicion_final IN ('CT','EL','ST','MT')),
      FOREIGN KEY (serie_id) REFERENCES series(id)
    )
  `)

  // =====================================================
  // TIPOLOGÍAS
  // =====================================================

  await db.exec(`
    CREATE TABLE IF NOT EXISTS tipologias (
      id TEXT PRIMARY KEY,
      subserie_id TEXT NOT NULL,
      nombre TEXT NOT NULL,
      descripcion TEXT,
      FOREIGN KEY (subserie_id) REFERENCES subseries(id)
    )
  `)

  console.log('✅ TRD migration ejecutada')
}