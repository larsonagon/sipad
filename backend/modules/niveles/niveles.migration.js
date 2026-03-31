export async function runNivelesMigration(dbInstance) {

  const sql = `
    CREATE TABLE IF NOT EXISTS niveles (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      nombre TEXT NOT NULL,
      orden INTEGER NOT NULL,
      estado INTEGER DEFAULT 1,
      entidad_id TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      UNIQUE (nombre, entidad_id),
      FOREIGN KEY (entidad_id) REFERENCES entidades(id)
    );
  `

  await dbInstance.exec(sql)

  console.log('✔ Niveles migration OK')
}