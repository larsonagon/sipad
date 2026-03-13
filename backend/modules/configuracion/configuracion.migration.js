// backend/modules/configuracion/configuracion.migration.js

export async function runConfiguracionMigration(db) {

  await db.exec(`
    CREATE TABLE IF NOT EXISTS configuracion_entidad (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      id_entidad INTEGER NOT NULL UNIQUE,
      nombre_publico TEXT,
      logo_url TEXT,
      color_primario TEXT DEFAULT '#1E3A8A',
      color_secundario TEXT DEFAULT '#3B82F6',
      color_sidebar TEXT DEFAULT '#0F172A',
      footer_texto TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (id_entidad) REFERENCES entidades(id)
    );
  `)

  console.log('✅ configuracion_entidad migrada correctamente')
}