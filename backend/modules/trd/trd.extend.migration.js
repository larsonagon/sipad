/**
 * Extensión del schema TRD — agrega columnas si no existen.
 * Compatible con PostgreSQL y SQLite.
 */

export async function runTRDExtendMigration(db) {

  const columnas = [
    { tabla: 'trd_versiones', col: 'entidad_id',     tipo: 'TEXT'    },
    { tabla: 'series',        col: 'dependencia_id', tipo: 'INTEGER' },
    { tabla: 'series',        col: 'entidad_id',     tipo: 'TEXT'    },
    { tabla: 'series',        col: 'propuesta_id',   tipo: 'TEXT'    },
  ]

  for (const { tabla, col, tipo } of columnas) {
    try {
      await db.exec(`ALTER TABLE ${tabla} ADD COLUMN ${col} ${tipo}`)
      console.log(`✅ TRD extend: ${tabla}.${col} agregado`)
    } catch {
      // Columna ya existe — ignorar
    }
  }

  console.log('✅ TRD extend migration completada')
}