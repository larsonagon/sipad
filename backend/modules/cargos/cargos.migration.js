export async function runCargosMigration(db) {

  await db.exec(`
    CREATE TABLE IF NOT EXISTS cargos (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      nombre TEXT NOT NULL,
      estado INTEGER DEFAULT 1,
      entidad_id TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      UNIQUE (nombre, entidad_id),
      FOREIGN KEY (entidad_id) REFERENCES entidades(id)
    );
  `)

  console.log('✔ Cargos migration OK')
}