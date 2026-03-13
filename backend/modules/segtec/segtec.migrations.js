// backend/modules/segtec/segtec.migrations.js
// Registro de todas las migrations del módulo SEG-TEC

import { runSEGTECFormB1Migration } from './segtec.formulario.migration.js'

export async function runSEGTECMigrations(db) {
  await runSEGTECFormB1Migration(db)
  // Futuras migrations Bloque 2, 3, 4 se agregan aquí
}
