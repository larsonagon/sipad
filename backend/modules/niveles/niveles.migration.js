import { db } from '../../db/database.js'

export async function runNivelesMigration(dbInstance) {

  const sql = `
    CREATE TABLE IF NOT EXISTS niveles (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      nombre TEXT NOT NULL UNIQUE,
      orden INTEGER NOT NULL,
      estado INTEGER DEFAULT 1
    );
  `

  await dbInstance.exec(sql)

  // Insertar niveles base si no existen
  const check = await dbInstance.get(`SELECT COUNT(*) as total FROM niveles`)

  if (check.total === 0) {

    const insert = `
      INSERT INTO niveles (nombre, orden) VALUES
      ('Directivo', 100),
      ('Asesor', 90),
      ('Profesional', 80),
      ('Técnico', 60),
      ('Operativo', 40);
    `

    await dbInstance.exec(insert)
  }

  console.log('✔ Niveles migration OK')
}