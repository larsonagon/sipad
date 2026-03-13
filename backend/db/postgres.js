import pkg from 'pg'

const { Pool } = pkg

export const pool = new Pool({
  user: 'larsonagon',
  host: 'localhost',
  database: 'sipad',
  password: '',
  port: 5432
})

export async function query(text, params) {
  const res = await pool.query(text, params)
  return res
}