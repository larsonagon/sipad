// backend/modules/segtec/segtec.validacion.tecnica.migration.js

console.log('🔥 EJECUTANDO MIGRACION VALIDACION TECNICA (MODELO FUERTE LIMPIO)')

export async function runSEGTECValidacionTecnicaMigration(db) {

  if (!db) {
    throw new Error('DB no proporcionada a migración SEGTECValidacionTecnica')
  }

  await db.exec(`
    CREATE TABLE IF NOT EXISTS segtec_validacion_tecnica (
      actividad_id TEXT PRIMARY KEY,

      impacto_juridico_directo INTEGER,
      impacto_fiscal_contable INTEGER,
      genera_expediente_propio INTEGER,
      actividad_permanente INTEGER,
      soporte_principal TEXT,
      observacion_tecnica TEXT,

      created_at TEXT,
      updated_at TEXT,

      FOREIGN KEY (actividad_id)
        REFERENCES segtec_actividades(id)
        ON DELETE CASCADE
    )
  `)

  console.log('✅ Tabla segtec_validacion_tecnica verificada (SIN nivel_riesgo)')
}