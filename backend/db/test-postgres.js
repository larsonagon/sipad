import { pool } from './postgres.js'

async function test() {
  const res = await pool.query('SELECT NOW()')
  console.log('🐘 PostgreSQL conectado:', res.rows)
  process.exit()
}

test()