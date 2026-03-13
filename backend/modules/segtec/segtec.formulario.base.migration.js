// backend/modules/segtec/segtec.formulario.base.migration.js
// SEG-TEC – Tabla base de formularios (estructura definitiva)

export async function runSEGTECFormBaseMigration(db) {

  await db.exec(`
    CREATE TABLE IF NOT EXISTS segtec_formularios (
      id TEXT PRIMARY KEY,

      usuario_id INTEGER NOT NULL,

      numero INTEGER NOT NULL,

      descripcion TEXT,

      estado TEXT NOT NULL DEFAULT 'en_proceso',

      etapa_actual INTEGER NOT NULL DEFAULT 1,

      creado_en TEXT NOT NULL,
      actualizado_en TEXT,

      FOREIGN KEY (usuario_id)
        REFERENCES usuarios(id)
        ON DELETE CASCADE
    );
  `);

  await db.exec(`
    CREATE INDEX IF NOT EXISTS idx_segtec_form_usuario
    ON segtec_formularios(usuario_id);
  `);

  await db.exec(`
    CREATE INDEX IF NOT EXISTS idx_segtec_form_numero
    ON segtec_formularios(numero);
  `);

  console.log('✅ SEG-TEC tabla base creada correctamente (estructura consistente)');
}