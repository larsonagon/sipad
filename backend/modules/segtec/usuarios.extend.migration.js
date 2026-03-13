export async function runUsuariosExtendMigration(db) {

  await db.exec(`
    ALTER TABLE usuarios
    ADD COLUMN es_responsable_dependencia INTEGER DEFAULT 0;
  `);

  console.log('✅ usuarios.es_responsable_dependencia creada');
}