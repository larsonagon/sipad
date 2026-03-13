export async function runTRDAIMigration(db) {

  // =====================================================
  // TABLA PRINCIPAL: SERIES PROPUESTAS
  // =====================================================

  await db.exec(`
    CREATE TABLE IF NOT EXISTS trd_series_propuestas (
      id TEXT PRIMARY KEY,

      actividad_id TEXT NOT NULL,

      nombre_serie TEXT NOT NULL,
      nombre_subserie TEXT,
      tipologia_documental TEXT,

      justificacion TEXT,
      confianza REAL,

      estado TEXT CHECK (
        estado IN (
          'propuesta',
          'en_revision',
          'aprobada',
          'rechazada',
          'incorporada'
        )
      ) DEFAULT 'propuesta',

      version_trd_id TEXT,
      aprobado_por TEXT,
      fecha_aprobacion TEXT,
      observaciones_revision TEXT,

      creado_en TEXT NOT NULL,

      FOREIGN KEY (actividad_id)
        REFERENCES segtec_actividades(id)
        ON DELETE CASCADE,

      FOREIGN KEY (version_trd_id)
        REFERENCES trd_versiones(id)
    );
  `)

  // =====================================================
  // MIGRACIÓN SEGURA: CAMBIAR proceso_id → actividad_id
  // =====================================================

  const columnasSeries = await db.all(`PRAGMA table_info(trd_series_propuestas)`)

  const existeActividadId = columnasSeries.some(c => c.name === 'actividad_id')
  const existeProcesoId = columnasSeries.some(c => c.name === 'proceso_id')

  if (!existeActividadId) {

    await db.exec(`
      ALTER TABLE trd_series_propuestas
      ADD COLUMN actividad_id TEXT
    `)

    console.log('✅ Columna actividad_id agregada a trd_series_propuestas')
  }

  if (existeProcesoId) {
    console.log('⚠️ Columna proceso_id detectada (se mantiene por compatibilidad)')
  }

  // =====================================================
  // TABLA: REGLAS DE RETENCIÓN
  // =====================================================

  await db.exec(`
    CREATE TABLE IF NOT EXISTS trd_reglas_retencion (
      id TEXT PRIMARY KEY,

      propuesta_id TEXT NOT NULL,

      tiempo_gestion INTEGER,
      tiempo_central INTEGER,

      disposicion_final TEXT CHECK (
        disposicion_final IN (
          'conservacion_total',
          'seleccion',
          'eliminacion'
        )
      ),

      fundamento_normativo TEXT,
      nivel_confianza REAL,

      creado_en TEXT NOT NULL,

      FOREIGN KEY (propuesta_id)
        REFERENCES trd_series_propuestas(id)
        ON DELETE CASCADE
    );
  `)

  // =====================================================
  // 🔥 MIGRACIÓN SEGURA: TIPO_REGLA
  // =====================================================

  const columnas = await db.all(`PRAGMA table_info(trd_reglas_retencion)`)

  const existeTipoRegla = columnas.some(c => c.name === 'tipo_regla')

  if (!existeTipoRegla) {

    await db.exec(`
      ALTER TABLE trd_reglas_retencion
      ADD COLUMN tipo_regla TEXT DEFAULT 'manual'
    `)

    console.log('✅ Columna tipo_regla agregada a trd_reglas_retencion')
  }

  // =====================================================
  // ÍNDICES
  // =====================================================

  await db.exec(`
    CREATE INDEX IF NOT EXISTS idx_trd_actividad
    ON trd_series_propuestas(actividad_id);
  `)

  await db.exec(`
    CREATE INDEX IF NOT EXISTS idx_trd_estado
    ON trd_series_propuestas(estado);
  `)

  await db.exec(`
    CREATE INDEX IF NOT EXISTS idx_trd_retencion_propuesta
    ON trd_reglas_retencion(propuesta_id);
  `)

  console.log('✅ TRD-AI migration ejecutada (estructura actualizada)')
}