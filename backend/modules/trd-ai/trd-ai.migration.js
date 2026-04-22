export async function runTRDAIMigration(db) {

  // =====================================================
  // TABLA PRINCIPAL: SERIES PROPUESTAS
  // =====================================================

  await db.exec(`
    CREATE TABLE IF NOT EXISTS trd_series_propuestas (
      id TEXT PRIMARY KEY,
      actividad_id TEXT,
      nombre_serie TEXT NOT NULL,
      nombre_subserie TEXT,
      tipologia_documental TEXT,
      justificacion TEXT,
      confianza REAL,
      estado TEXT DEFAULT 'propuesta',
      version_trd_id TEXT,
      aprobado_por TEXT,
      fecha_aprobacion TEXT,
      observaciones_revision TEXT,
      creado_en TEXT NOT NULL
    )
  `)

  // =====================================================
  // MIGRACIÓN SEGURA: columnas opcionales
  // =====================================================

  const columnasPropuestas = [
    { col: 'actividad_id', tipo: 'TEXT' },
    { col: 'disposicion_final', tipo: 'TEXT' },
  ]

  for (const { col, tipo } of columnasPropuestas) {
    try {
      await db.exec(
        `ALTER TABLE trd_series_propuestas ADD COLUMN ${col} ${tipo}`
      )
      console.log(`✅ trd_series_propuestas.${col} agregado`)
    } catch {
      // Ya existe — ignorar
    }
  }

  // =====================================================
  // TABLA: REGLAS DE RETENCIÓN
  // =====================================================

  await db.exec(`
    CREATE TABLE IF NOT EXISTS trd_reglas_retencion (
      id TEXT PRIMARY KEY,
      propuesta_id TEXT NOT NULL,
      retencion_gestion INTEGER,
      retencion_central INTEGER,
      disposicion_final TEXT,
      fundamento_normativo TEXT,
      nivel_confianza REAL,
      tipo_regla TEXT DEFAULT 'manual',
      creado_en TEXT NOT NULL
    )
  `)

  // =====================================================
  // MIGRACIÓN SEGURA: columnas opcionales retención
  // =====================================================

  const columnasRetencion = [
    { col: 'tipo_regla',          tipo: 'TEXT' },
    { col: 'retencion_gestion',   tipo: 'INTEGER' },
    { col: 'retencion_central',   tipo: 'INTEGER' },
  ]

  for (const { col, tipo } of columnasRetencion) {
    try {
      await db.exec(
        `ALTER TABLE trd_reglas_retencion ADD COLUMN ${col} ${tipo}`
      )
      console.log(`✅ trd_reglas_retencion.${col} agregado`)
    } catch {
      // Ya existe — ignorar
    }
  }

  // =====================================================
  // ÍNDICES
  // =====================================================

  try {
    await db.exec(`
      CREATE INDEX IF NOT EXISTS idx_trd_actividad
      ON trd_series_propuestas(actividad_id)
    `)
  } catch { /* ignorar */ }

  try {
    await db.exec(`
      CREATE INDEX IF NOT EXISTS idx_trd_estado
      ON trd_series_propuestas(estado)
    `)
  } catch { /* ignorar */ }

  try {
    await db.exec(`
      CREATE INDEX IF NOT EXISTS idx_trd_retencion_propuesta
      ON trd_reglas_retencion(propuesta_id)
    `)
  } catch { /* ignorar */ }

  console.log('✅ TRD-AI migration ejecutada')
}