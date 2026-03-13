// public/js/db.js
// SIPAD – IndexedDB
// SEG-TEC – Modelo completo + Offline-first

const DB_NAME = 'sipad-db'
const DB_VERSION = 2

const STORE_SEGTEC = 'segtec_actividades'

let db = null

/* =========================
   APERTURA DE BD
========================= */

function openDB() {
  return new Promise((resolve, reject) => {
    if (db) return resolve(db)

    const request = indexedDB.open(DB_NAME, DB_VERSION)

    request.onerror = () => reject(request.error)

    request.onupgradeneeded = e => {
      const database = e.target.result
      if (!database.objectStoreNames.contains(STORE_SEGTEC)) {
        database.createObjectStore(STORE_SEGTEC, { keyPath: 'id' })
      }
    }

    request.onsuccess = e => {
      db = e.target.result
      resolve(db)
    }
  })
}

/* =========================
   MODELO SEG-TEC
========================= */

export function crearActividadSEGTEC({
  dependencia,
  procesoArchivistico,
  hallazgo,
  riesgo,
  usuario
}) {
  const ahora = new Date().toISOString()

  return {
    id: crypto.randomUUID(),
    fechaRegistro: ahora,

    usuarioRegistro: usuario,
    dependencia,
    procesoArchivistico,

    hallazgo,
    riesgo,

    estado: {
      actual: 'pendiente',
      fechaCambio: ahora
    },

    sync: {
      synced: false,
      fechaSync: null
    }
  }
}

/* =========================
   CRUD SEG-TEC
========================= */

export async function guardarActividadSEGTEC(actividad) {
  const database = await openDB()

  return new Promise((resolve, reject) => {
    const tx = database.transaction(STORE_SEGTEC, 'readwrite')
    tx.objectStore(STORE_SEGTEC).put(actividad)
    tx.oncomplete = () => resolve(true)
    tx.onerror = () => reject(tx.error)
  })
}

export async function obtenerActividadesSEGTEC() {
  const database = await openDB()

  return new Promise((resolve, reject) => {
    const tx = database.transaction(STORE_SEGTEC, 'readonly')
    const req = tx.objectStore(STORE_SEGTEC).getAll()
    req.onsuccess = () => resolve(req.result || [])
    req.onerror = () => reject(req.error)
  })
}

export async function marcarSincronizadaSEGTEC(id) {
  const database = await openDB()

  return new Promise((resolve, reject) => {
    const tx = database.transaction(STORE_SEGTEC, 'readwrite')
    const store = tx.objectStore(STORE_SEGTEC)
    const req = store.get(id)

    req.onsuccess = () => {
      const actividad = req.result
      if (!actividad) return resolve(false)

      actividad.sync.synced = true
      actividad.sync.fechaSync = new Date().toISOString()
      actividad.estado.actual = 'sincronizada'

      store.put(actividad)
    }

    tx.oncomplete = () => resolve(true)
    tx.onerror = () => reject(tx.error)
  })
}

/* =========================
   CONTADOR PENDIENTES
========================= */

export async function countPendientesSEGTEC() {
  const database = await openDB()

  return new Promise((resolve, reject) => {
    const tx = database.transaction(STORE_SEGTEC, 'readonly')
    const req = tx.objectStore(STORE_SEGTEC).getAll()

    req.onsuccess = () => {
      const pendientes = (req.result || []).filter(
        a => a.sync?.synced === false
      )
      resolve(pendientes.length)
    }

    req.onerror = () => reject(req.error)
  })
}
