export async function runDependenciasMigration(db) {

  await db.exec(`
    CREATE TABLE IF NOT EXISTS auditoria_dependencias (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      actor_id INTEGER NOT NULL,
      dependencia_afectada_id INTEGER NOT NULL,
      accion TEXT NOT NULL,
      detalle_json TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (actor_id) REFERENCES usuarios(id),
      FOREIGN KEY (dependencia_afectada_id) REFERENCES dependencias(id)
    );
  `)

  console.log('✅ Dependencias migration ejecutada')
}