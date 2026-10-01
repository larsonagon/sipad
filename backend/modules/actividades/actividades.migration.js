import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

// Busca el esquema junto al módulo y, si no está, en la raíz del proyecto
// (donde quedó guardado). Si no existe en ninguna, avisa y continúa:
// esta tabla es heredada y no debe impedir el arranque en local (SQLite).
export async function runActividadesMigration(db) {

  const aqui = path.dirname(fileURLToPath(import.meta.url))
  const candidatos = [
    path.join(aqui, 'actividades.schema.sql'),
    path.resolve(aqui, '../../../actividades.schema.sql')
  ]
  const schemaPath = candidatos.find(p => fs.existsSync(p))

  if (!schemaPath) {
    console.warn('⚠️ actividades.schema.sql no encontrado; se omite la migración de actividades')
    return
  }

  const schema = fs.readFileSync(schemaPath, 'utf8')
  await db.exec(schema)
}
