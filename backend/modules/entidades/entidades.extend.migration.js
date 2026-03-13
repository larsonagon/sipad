export async function runMultiTenantMigration(db) {

  // Agregar id_entidad a usuarios si no existe
  await db.exec(`
    ALTER TABLE usuarios ADD COLUMN id_entidad INTEGER DEFAULT 1;
  `).catch(() => {})

  // Agregar FK si no existe (SQLite no permite alter FK fácil,
  // lo manejamos lógicamente en código)
  
  console.log('✅ Multi-tenant migration ejecutada (usuarios)')
}