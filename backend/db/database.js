// backend/db/database.js

import sqlite3 from 'sqlite3'
import { open } from 'sqlite'
import { pool } from './postgres.js'
import path from 'path'
import { fileURLToPath } from 'url'

// =======================================
// CONFIG
// =======================================

const DB_ENGINE = process.env.DB_ENGINE || 'postgres'

console.log('🗄️ Motor de base de datos:', DB_ENGINE)

// =======================================
// SQLITE (solo desarrollo)
// =======================================

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const DB_PATH = path.resolve(__dirname, 'sipad.sqlite')

let sqliteDb = null
let sqliteReady = Promise.resolve()

async function initSQLite() {

  console.log('📦 Usando SQLite:', DB_PATH)

  sqliteDb = await open({
    filename: DB_PATH,
    driver: sqlite3.Database
  })

  await sqliteDb.exec('PRAGMA foreign_keys = ON')
  await sqliteDb.exec('PRAGMA journal_mode = WAL')
  await sqliteDb.exec('PRAGMA synchronous = NORMAL')
}

// Inicializar SQLite sin usar top-level await
if (DB_ENGINE === 'sqlite') {
  sqliteReady = initSQLite()
}

// =======================================
// UTIL: convertir ? a $1 $2 $3
// =======================================

function convertPlaceholders(query) {

  let index = 0

  return query.replace(/\?/g, () => {
    index++
    return `$${index}`
  })
}

// =======================================
// ADAPTADOR UNIVERSAL
// =======================================

const db = {

  // ===============================
  // GET (una fila)
  // ===============================

  async get(query, params = []) {

    if (DB_ENGINE === 'sqlite') {

      await sqliteReady
      return sqliteDb.get(query, params)

    }

    const q = convertPlaceholders(query)
    const result = await pool.query(q, params)

    return result.rows[0] || null
  },

  // ===============================
  // ALL (muchas filas)
  // ===============================

  async all(query, params = []) {

    if (DB_ENGINE === 'sqlite') {

      await sqliteReady
      return sqliteDb.all(query, params)

    }

    const q = convertPlaceholders(query)
    const result = await pool.query(q, params)

    return result.rows
  },

  // ===============================
  // RUN (insert/update/delete)
  // ===============================

  async run(query, params = []) {

    if (DB_ENGINE === 'sqlite') {

      await sqliteReady
      return sqliteDb.run(query, params)

    }

    const q = convertPlaceholders(query)
    const result = await pool.query(q, params)

    return {
      changes: result.rowCount
    }
  },

  // ===============================
  // EXEC (migrations / scripts)
  // ===============================

  async exec(query) {

    if (DB_ENGINE === 'sqlite') {

      await sqliteReady
      return sqliteDb.exec(query)

    }

    return pool.query(query)
  }

}

// =======================================
// EXPORT
// =======================================

export { db }