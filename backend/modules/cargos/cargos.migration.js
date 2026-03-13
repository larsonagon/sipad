// backend/modules/cargos/cargos.migration.js
// SIPAD – Migración limpia y coherente de Cargos

export async function runCargosMigration(db) {

  await db.exec(`
    CREATE TABLE IF NOT EXISTS cargos (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      nombre TEXT NOT NULL UNIQUE,
      estado INTEGER DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `)

  console.log('✔ Cargos migration OK')
}