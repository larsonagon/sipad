import fs from 'fs'
import path from 'path'

export async function runActividadesMigration(db) {

  const schemaPath = path.resolve('backend/modules/actividades/actividades.schema.sql')
  const schema = fs.readFileSync(schemaPath, 'utf8')

  await db.exec(schema)
}
