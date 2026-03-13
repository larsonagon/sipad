// public/js/sync.js
// SIPAD – Sincronización SEG-TEC

import state from './state.js'
import {
  obtenerActividadesSEGTEC,
  marcarSincronizadaSEGTEC
} from './db.js'
import { renderMenu } from './menu.js'

export async function runSync() {
  if (!navigator.onLine) return

  try {
    const actividades = await obtenerActividadesSEGTEC()
    const pendientes = actividades.filter(a => !a.sync.synced)

    if (!pendientes.length) return

    const response = await fetch('/api/segtec/sync', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        registros: pendientes.map(a => ({
          localId: a.id,
          datos: a
        }))
      })
    })

    const result = await response.json()

    if (result.ok && Array.isArray(result.aceptados)) {
      for (const a of result.aceptados) {
        await marcarSincronizadaSEGTEC(a.localId)
      }
    }

    await renderMenu()
  } catch (err) {
    console.error('❌ Error de sincronización', err)
  }
}

window.addEventListener('online', runSync)
