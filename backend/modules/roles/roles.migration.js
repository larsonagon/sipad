export async function runRolesMigration(db) {

  await db.exec(`
    CREATE TABLE IF NOT EXISTS roles (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      nombre TEXT NOT NULL,
      descripcion TEXT,
      nivel_acceso INTEGER NOT NULL DEFAULT 50,
      activo INTEGER DEFAULT 1,
      entidad_id TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      UNIQUE (nombre, entidad_id),
      FOREIGN KEY (entidad_id) REFERENCES entidades(id)
    );
  `)

  await db.exec(`
    CREATE TABLE IF NOT EXISTS auditoria_roles (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      actor_id INTEGER NOT NULL,
      rol_afectado_id INTEGER NOT NULL,
      accion TEXT NOT NULL,
      detalle_json TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (actor_id) REFERENCES usuarios(id),
      FOREIGN KEY (rol_afectado_id) REFERENCES roles(id)
    );
  `)

  console.log('✅ Roles migration ejecutada')
}