import pkg from 'pg'

const { Pool } = pkg

// =======================================
// CONFIG
// =======================================

const isProduction = process.env.DATABASE_URL !== undefined

// =======================================
// POOL
// =======================================

export const pool = isProduction

  ? new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: {
        rejectUnauthorized: false
      }
    })

  : new Pool({
      user: 'larsonagon',
      host: 'localhost',
      database: 'sipad',
      password: '',
      port: 5432
    })

// =======================================
// TEST CONNECTION
// =======================================

pool.connect()
  .then(client => {
    console.log('🐘 Conectado a PostgreSQL')

    client.release()
  })
  .catch(err => {
    console.error('❌ Error conectando a PostgreSQL:', err)
  })

// =======================================
// QUERY HELPER
// =======================================

export async function query(text, params) {

  const res = await pool.query(text, params)

  return res

}