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
    { col: 'entidad_id', tipo: 'TEXT' },
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
  // BACKFILL: entidad_id de propuestas existentes desde su actividad
  // (multi-tenant). Solo rellena las que están en NULL.
  // =====================================================

  try {
    await db.exec(`
      UPDATE trd_series_propuestas
      SET entidad_id = (
        SELECT sa.entidad_id
        FROM segtec_actividades sa
        WHERE sa.id = trd_series_propuestas.actividad_id
      )
      WHERE entidad_id IS NULL
    `)
    console.log('✅ trd_series_propuestas.entidad_id backfilled')
  } catch (e) {
    console.warn('Backfill entidad_id propuestas omitido:', e.message)
  }

  try {
    await db.exec(`
      CREATE INDEX IF NOT EXISTS idx_trd_propuesta_entidad
      ON trd_series_propuestas(entidad_id)
    `)
  } catch { /* ignorar */ }

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

  // =====================================================
  // APRENDIZAJE (motor que aprende de las correcciones)
  // Diccionario global: serie/subserie por actividad y
  // tipologías por serie, con señal positiva/negativa y peso.
  // =====================================================

  await db.exec(`
    CREATE TABLE IF NOT EXISTS trd_aprendizaje (
      id TEXT PRIMARY KEY,
      tipo TEXT NOT NULL,          -- 'serie' | 'tipologia'
      clave TEXT,                  -- serie: nombre de actividad normalizado
      serie TEXT,                  -- serie objetivo (normalizada en tipologia)
      subserie TEXT,
      tipologia TEXT,              -- tipologia normalizada (tipo='tipologia')
      senal TEXT NOT NULL,         -- 'positiva' | 'negativa'
      peso INTEGER DEFAULT 1,
      entidad_id TEXT,             -- origen (auditoría); se aplica global
      actualizado_en TEXT
    )
  `)

  try {
    await db.exec(`CREATE INDEX IF NOT EXISTS idx_aprendizaje_serie ON trd_aprendizaje(tipo, clave)`)
  } catch { /* ignorar */ }
  try {
    await db.exec(`CREATE INDEX IF NOT EXISTS idx_aprendizaje_tip ON trd_aprendizaje(tipo, serie)`)
  } catch { /* ignorar */ }

  // =====================================================
  // CONVALIDACIÓN (flujo post-comité por entidad)
  //   Estado del proceso + datos del acto administrativo y radicación.
  //   Una fila por entidad.
  // =====================================================

  await db.exec(`
    CREATE TABLE IF NOT EXISTS trd_convalidacion (
      id TEXT PRIMARY KEY,
      entidad_id TEXT,
      estado TEXT DEFAULT 'borrador',   -- borrador|en_comite|con_observaciones|aprobada_comite|convalidada|radicada
      fecha_comite TEXT,
      numero_acta TEXT,
      acto_administrativo TEXT,         -- tipo (Resolución/Decreto)
      numero_acto TEXT,
      fecha_acto TEXT,
      radicado_numero TEXT,
      radicado_fecha TEXT,
      nota TEXT,
      actualizado_en TEXT
    )
  `)
  try {
    await db.exec(`CREATE UNIQUE INDEX IF NOT EXISTS idx_convalidacion_entidad ON trd_convalidacion(entidad_id)`)
  } catch { /* ignorar */ }

  // =====================================================
  // OBSERVACIONES DEL COMITÉ
  //   Anotaciones (generales o sobre una serie/subserie) con
  //   ciclo pendiente → resuelta.
  // =====================================================

  await db.exec(`
    CREATE TABLE IF NOT EXISTS trd_observaciones (
      id TEXT PRIMARY KEY,
      entidad_id TEXT,
      serie TEXT,
      subserie TEXT,
      texto TEXT NOT NULL,
      origen TEXT DEFAULT 'comite',     -- comite|interno
      estado TEXT DEFAULT 'pendiente',  -- pendiente|resuelta
      respuesta TEXT,
      autor TEXT,
      creado_en TEXT,
      resuelto_en TEXT
    )
  `)
  try {
    await db.exec(`CREATE INDEX IF NOT EXISTS idx_observaciones_entidad ON trd_observaciones(entidad_id, estado)`)
  } catch { /* ignorar */ }

  console.log('✅ TRD-AI migration ejecutada')
}