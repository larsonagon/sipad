// backend/modules/valoracion/valoracion.referentes.js
// Carga (cacheada) el catálogo de referentes por sector.
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const CATALOGO = path.join(__dirname, 'referentes', 'catalogo.json')

let _cache = null

export function cargarReferentes() {
  if (_cache) return _cache
  try {
    _cache = JSON.parse(fs.readFileSync(CATALOGO, 'utf8'))
  } catch (e) {
    console.error('No se pudo cargar el catálogo de referentes:', e.message)
    _cache = { sectores: [] }
  }
  return _cache
}
