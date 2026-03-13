// backend/modules/entidades/entidades.migration.js

export async function runEntidadesMigration(db) {

  await db.exec(`
    CREATE TABLE IF NOT EXISTS entidades (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      nombre TEXT NOT NULL,
      subdominio TEXT UNIQUE,
      nit TEXT,
      estado INTEGER DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `)

  // Entidad base para desarrollo
  await db.run(`
    INSERT OR IGNORE INTO entidades
    (id, nombre, subdominio)
    VALUES (1, 'Entidad Demo', 'demo')
  `)

  console.log('✅ Entidades migrada correctamente')
}