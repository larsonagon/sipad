import { db } from '../../db/database.js'

export async function runUsuariosMasterMigration() {
  try {

    // ===============================
    // Verificar estructura actual
    // ===============================

    const columnas = await db.all(`PRAGMA table_info(usuarios)`)

    const existeEsMaster = columnas.some(col => col.name === 'es_master_admin')
    const existeIdNivel = columnas.some(col => col.name === 'id_nivel')

    // ===============================
    // Agregar es_master_admin si falta
    // ===============================

    if (!existeEsMaster) {
      await db.exec(`
        ALTER TABLE usuarios
        ADD COLUMN es_master_admin INTEGER DEFAULT 0
      `)
      console.log('✅ usuarios.es_master_admin creado')
    } else {
      console.log('ℹ️ usuarios.es_master_admin ya existe')
    }

    // ===============================
    // Verificación crítica estructural
    // ===============================

    if (!existeIdNivel) {
      console.warn(
        '⚠️ ADVERTENCIA: usuarios.id_nivel no existe. ' +
        'La base de datos no está alineada con la arquitectura actual.'
      )
    }

  } catch (err) {
    console.error('❌ Error en usuarios.master.migration:', err)
    throw err
  }
}