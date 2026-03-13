export async function runSEGTECConfiguracionMigration(db) {

  await db.exec(`
    CREATE TABLE IF NOT EXISTS segtec_configuracion_dependencia (
      id TEXT PRIMARY KEY,

      id_dependencia INTEGER NOT NULL,

      version INTEGER NOT NULL DEFAULT 1,
      activa INTEGER DEFAULT 1,

      tipo_funcion TEXT,
      nivel_decisorio TEXT,

      recibe_solicitudes INTEGER DEFAULT 0,
      emite_actos INTEGER DEFAULT 0,
      produce_decisiones INTEGER DEFAULT 0,

      procesos_principales TEXT,
      tramites_frecuentes TEXT,
      tipo_decisiones TEXT,

      tipos_documentales TEXT,
      otros_documentos TEXT,
      descripcion_funcional TEXT,

      creado_por INTEGER,
      created_at TEXT NOT NULL
    );
  `);

  await db.exec(`
    CREATE INDEX IF NOT EXISTS idx_segtec_config_dependencia
    ON segtec_configuracion_dependencia(id_dependencia);
  `);

  console.log('✅ SEG-TEC Configuración migration ejecutada');
}