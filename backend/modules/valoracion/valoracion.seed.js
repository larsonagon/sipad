// backend/modules/valoracion/valoracion.seed.js
// ---------------------------------------------------------------
// Carga plantillas de ejemplo (JSON de ./plantillas) en una entidad.
// Idempotente: si ya existe una plantilla con el mismo nombre en esa
// entidad, no la duplica.
//
// Nota: NO se ejecuta automáticamente al arrancar. Es una utilidad.
// También puedes crear plantillas vía POST /api/valoracion/plantillas
// enviando el mismo JSON como cuerpo (rol administrativo).
//
// Uso como script:
//   DATABASE_URL=... DB_ENGINE=postgres node backend/modules/valoracion/valoracion.seed.js <ENTIDAD_ID>
// ---------------------------------------------------------------
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import ValoracionRepository from './valoracion.repository.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const PLANTILLAS_DIR = path.join(__dirname, 'plantillas')

export async function seedPlantillasEntidad(db, entidadId, { soloArchivos = null } = {}) {
  if (!entidadId) throw new Error('entidadId requerido para sembrar plantillas')

  const repo = new ValoracionRepository(db)
  const archivos = fs.readdirSync(PLANTILLAS_DIR).filter(f => f.endsWith('.json'))
  const resultados = []

  for (const archivo of archivos) {
    if (soloArchivos && !soloArchivos.includes(archivo)) continue

    const estructura = JSON.parse(fs.readFileSync(path.join(PLANTILLAS_DIR, archivo), 'utf8'))

    const yaExiste = await repo.plantillaExistePorNombre(entidadId, estructura.nombre)
    if (yaExiste) {
      resultados.push({ archivo, nombre: estructura.nombre, estado: 'omitida (ya existe)', id: yaExiste })
      continue
    }

    const id = await repo.crearPlantillaCompleta(entidadId, estructura)
    const nSecc = (estructura.secciones || []).length
    const nPreg = (estructura.secciones || []).reduce((s, x) => s + (x.preguntas || []).length, 0)
    resultados.push({ archivo, nombre: estructura.nombre, estado: 'creada', id, secciones: nSecc, preguntas: nPreg })
  }

  return resultados
}

// Ejecución directa como script -------------------------------------------
// Uso:
//   node valoracion.seed.js <ENTIDAD_ID>                      -> siembra todas las plantillas
//   node valoracion.seed.js <ENTIDAD_ID> <archivo.json>       -> solo esa plantilla
//   (ej. levantamiento.generico.json para entidades que no son de tránsito)
if (import.meta.url === `file://${process.argv[1]}`) {
  const entidadId = process.argv[2]
  const archivo   = process.argv[3] || null
  if (!entidadId) {
    console.error('Uso: node valoracion.seed.js <ENTIDAD_ID> [archivo.json]')
    process.exit(1)
  }
  const { db } = await import('../../db/database.js')
  const opts = archivo ? { soloArchivos: [archivo] } : {}
  const res = await seedPlantillasEntidad(db, entidadId, opts)
  console.table(res)
  process.exit(0)
}
