import { db } from '../../db/database.js'

export async function runUsuariosExtendMigration() {
  try {

    // ===============================
    // Verificar estructura actual
    // ===============================

    const columns = await db.all(`PRAGMA table_info(usuarios);`);

    const existeResponsable = columns.some(col => col.name === 'es_responsable_dependencia');
    const existeIdNivel = columns.some(col => col.name === 'id_nivel');

    // ===============================
    // Agregar es_responsable_dependencia si falta
    // ===============================

    if (!existeResponsable) {
      await db.exec(`
        ALTER TABLE usuarios
        ADD COLUMN es_responsable_dependencia INTEGER DEFAULT 0;
      `);

      console.log('✅ usuarios.es_responsable_dependencia creada');
    } else {
      console.log('ℹ️ usuarios.es_responsable_dependencia ya existe');
    }

    // ===============================
    // Verificación estructural crítica
    // ===============================

    if (!existeIdNivel) {
      console.warn(
        '⚠️ ADVERTENCIA: usuarios.id_nivel no existe. ' +
        'La base de datos no está alineada con la arquitectura actual.'
      );
    }

  } catch (error) {
    console.error('❌ Error en usuarios.extend.migration:', error);
    throw error;
  }
}