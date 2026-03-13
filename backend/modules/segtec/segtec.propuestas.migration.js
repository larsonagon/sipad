// backend/modules/segtec/segtec.propuestas.migration.js
// SEG-TEC – Propuestas IA

export async function runSEGTECPropuestasMigration(db) {

  await db.exec(`
    CREATE TABLE IF NOT EXISTS segtec_propuestas_ai (
      id TEXT PRIMARY KEY,

      formulario_id TEXT NOT NULL,

      tipo_propuesta TEXT NOT NULL,
      contenido TEXT NOT NULL,
      nivel_confianza REAL,

      estado TEXT DEFAULT 'generada',

      creado_en TEXT NOT NULL,

      FOREIGN KEY (formulario_id)
        REFERENCES segtec_formularios(id)
        ON DELETE CASCADE
    );
  `);

  await db.exec(`
    CREATE INDEX IF NOT EXISTS idx_segtec_propuestas_formulario
    ON segtec_propuestas_ai(formulario_id);
  `);

  await db.exec(`
    CREATE INDEX IF NOT EXISTS idx_segtec_propuestas_estado
    ON segtec_propuestas_ai(estado);
  `);

  console.log('✅ SEG-TEC Propuestas IA migration ejecutada');
}
