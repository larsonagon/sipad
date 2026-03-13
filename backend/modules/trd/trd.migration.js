import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

export async function runTRDMigration(db) {

  const __filename = fileURLToPath(import.meta.url)
  const __dirname = path.dirname(__filename)

  const schemaPath = path.join(__dirname, 'trd.schema.sql')
  const schema = fs.readFileSync(schemaPath, 'utf8')

  await db.exec(schema)
}
