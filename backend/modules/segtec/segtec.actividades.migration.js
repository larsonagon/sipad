export async function runSEGTECActividadesMigration(db) {

  if (!db) {
    throw new Error('DB no proporcionada a SEGTEC actividades migration')
  }

  await db.exec(`
    CREATE TABLE IF NOT EXISTS segtec_actividades (
      id TEXT PRIMARY KEY,
      dependencia_id INTEGER,

      nombre TEXT,
      frecuencia TEXT,
      cargo_ejecutor TEXT,
      descripcion_funcional TEXT,
      tipo_funcion TEXT,

      genera_documentos INTEGER DEFAULT 0,
      formato_produccion TEXT,
      volumen_documental TEXT,
      responsable_custodia TEXT,

      tiene_pasos_formales INTEGER DEFAULT 0,
      requiere_otras_dependencias INTEGER DEFAULT 0,
      dependencias_relacionadas TEXT,

      norma_aplicable TEXT,

      estado_general TEXT DEFAULT 'borrador',

      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );
  `)

  const columnas = await db.all(`
    PRAGMA table_info(segtec_actividades)
  `)

  const nombres = columnas.map(c => c.name)

  async function addColumn(nombre, tipo) {

    if (!nombres.includes(nombre)) {

      await db.exec(`
        ALTER TABLE segtec_actividades
        ADD COLUMN ${nombre} ${tipo}
      `)

    }

  }

  await addColumn('cargo_ejecutor', 'TEXT')
  await addColumn('formato_produccion', 'TEXT')
  await addColumn('volumen_documental', 'TEXT')
  await addColumn('responsable_custodia', 'TEXT')
  await addColumn('tiene_pasos_formales', 'INTEGER DEFAULT 0')
  await addColumn('requiere_otras_dependencias', 'INTEGER DEFAULT 0')
  await addColumn('dependencias_relacionadas', 'TEXT')
  await addColumn('norma_aplicable', 'TEXT')
  await addColumn('estado_general', "TEXT DEFAULT 'borrador'")

  await db.exec(`
    CREATE TABLE IF NOT EXISTS segtec_analisis_actividad (
      id TEXT PRIMARY KEY,

      actividad_id TEXT NOT NULL,

      serie_propuesta TEXT,
      retencion_gestion INTEGER,
      retencion_central INTEGER,
      disposicion_final TEXT,
      justificacion TEXT,

      motor_version TEXT DEFAULT '1.0',

      creado_en TEXT NOT NULL,

      FOREIGN KEY (actividad_id)
        REFERENCES segtec_actividades(id)
        ON DELETE CASCADE
    );
  `)

  await db.exec(`
    CREATE INDEX IF NOT EXISTS idx_segtec_analisis_actividad
    ON segtec_analisis_actividad(actividad_id)
  `)

}