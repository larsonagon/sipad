// backend/modules/permisos/permisos.migration.js

export async function runPermisosMigration(db) {

  await db.exec(`
    CREATE TABLE IF NOT EXISTS permisos (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      codigo TEXT NOT NULL UNIQUE,
      descripcion TEXT,
      modulo TEXT,
      activo INTEGER DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `)

  await db.exec(`
    CREATE TABLE IF NOT EXISTS rol_permisos (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      id_rol INTEGER NOT NULL,
      id_permiso INTEGER NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(id_rol, id_permiso),
      FOREIGN KEY (id_rol) REFERENCES roles(id),
      FOREIGN KEY (id_permiso) REFERENCES permisos(id)
    );
  `)

  console.log('✅ Permisos y rol_permisos migrado correctamente')
}