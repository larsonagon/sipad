// backend/db/database.js

import sqlite3 from 'sqlite3'
import { open } from 'sqlite'
import pkg from 'pg'
import path from 'path'
import { fileURLToPath } from 'url'

const { Pool } = pkg

// =======================================
// CONFIG
// =======================================

const DB_ENGINE = process.env.DB_ENGINE || 'postgres'
const DATABASE_URL = process.env.DATABASE_URL

console.log('🗄️ Motor de base de datos:', DB_ENGINE)
console.log('🔗 DATABASE_URL:', DATABASE_URL ? 'CONFIGURADA ✅' : 'NO CONFIGURADA ❌')

// =======================================
// POSTGRES (DINÁMICO)
// =======================================

let pool = null

if (DB_ENGINE === 'postgres') {

  if (!DATABASE_URL) {
    console.warn('⚠️ DATABASE_URL no definida. Usando configuración local.')
  }

  pool = new Pool({
    connectionString: DATABASE_URL || undefined,
    ssl: DATABASE_URL
      ? { rejectUnauthorized: false }
      : false
  })

  pool.connect()
    .then(() => console.log('🐘 Conectado a PostgreSQL'))
    .catch(err => console.error('❌ Error PostgreSQL:', err))
}

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

  async get(query, params = []) {

    if (DB_ENGINE === 'sqlite') {

      await sqliteReady
      return sqliteDb.get(query, params)

    }

    const q = convertPlaceholders(query)
    const result = await pool.query(q, params)

    return result.rows[0] || null
  },

  async all(query, params = []) {

    if (DB_ENGINE === 'sqlite') {

      await sqliteReady
      return sqliteDb.all(query, params)

    }

    const q = convertPlaceholders(query)
    const result = await pool.query(q, params)

    return result.rows
  },

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