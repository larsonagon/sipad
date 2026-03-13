// backend/modules/configuracion/configuracion.seeder.js

export async function seedConfiguracionDefault(db) {

  await db.run(`
    INSERT OR IGNORE INTO configuracion_entidad
    (id_entidad, nombre_publico, footer_texto)
    VALUES (1, 'SIPAD Institucional', 'Plataforma SaaS SIPAD')
  `)

  console.log('✅ Configuración por defecto sembrada')
}