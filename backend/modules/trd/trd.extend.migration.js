/**
 * Extensión del schema TRD:
 * - trd_versiones.entidad_id  → soporte multi-tenant
 * - series.dependencia_id     → asociar series a unidades administrativas
 * - series.entidad_id         → soporte multi-tenant
 * - series.propuesta_id       → trazabilidad desde TRD-AI
 */

export async function runTRDExtendMigration(db) {

  const columnas = [
    { tabla: 'trd_versiones', col: 'entidad_id',    tipo: 'TEXT'    },
    { tabla: 'series',        col: 'dependencia_id', tipo: 'INTEGER' },
    { tabla: 'series',        col: 'entidad_id',    tipo: 'TEXT'    },
    { tabla: 'series',        col: 'propuesta_id',  tipo: 'TEXT'    },
  ]

  for (const { tabla, col, tipo } of columnas) {
    try {
      await db.run(`ALTER TABLE ${tabla} ADD COLUMN ${col} ${tipo}`)
      console.log(`✅ TRD extend: ${tabla}.${col} agregado`)
    } catch {
      // Columna ya existe — ignorar
    }
  }

  console.log('✅ TRD extend migration completada')
}