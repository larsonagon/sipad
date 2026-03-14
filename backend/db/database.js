// backend/models/user.db.model.js
// SIPAD – Modelo institucional de usuarios (compatible SQLite/PostgreSQL)

import { db } from '../db/database.js'

/* =========================
   CREAR USUARIO (DB)
========================= */

export async function createUserDB({
  nombreCompleto,
  documento,
  email,
  username,
  passwordHash,
  idDependencia,
  idRol,
  idCargo,
  idEntidad = 1
}) {

  if (!idCargo) {
    throw new Error('El cargo es obligatorio')
  }

  const result = await db.get(
    `
    INSERT INTO usuarios (
      nombre_completo,
      documento,
      email,
      username,
      password_hash,
      id_dependencia,
      id_rol,
      id_cargo,
      id_entidad
    )
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    RETURNING id
    `,
    [
      nombreCompleto,
      documento,
      email,
      username,
      passwordHash,
      idDependencia,
      idRol,
      idCargo,
      idEntidad
    ]
  )

  return { id: result?.id }
}


/* =========================
   BUSCAR POR USERNAME
========================= */

export async function findUserByUsernameDB(username) {

  const row = await db.get(
    `
    SELECT
      u.id,
      u.username,
      u.password_hash,
      u.nombre_completo,
      u.id_entidad,
      u.id_dependencia,
      u.es_master_admin,
      u.es_responsable_dependencia,
      r.nombre AS rol_nombre,
      r.nivel_acceso,
      d.nombre AS dependencia_nombre,
      c.nombre AS cargo_nombre
    FROM usuarios u
    JOIN roles r ON r.id = u.id_rol
    LEFT JOIN dependencias d ON d.id = u.id_dependencia
    LEFT JOIN cargos c ON c.id = u.id_cargo
    WHERE u.username = ?
      AND u.estado = 1
      AND u.bloqueado = false
    `,
    [username]
  )

  if (!row) return null

  return {
    id: row.id,
    username: row.username,
    nombre_completo: row.nombre_completo,
    passwordHash: row.password_hash,
    role: row.rol_nombre,
    nivel: row.nivel_acceso,
    cargo: row.cargo_nombre,
    id_entidad: row.id_entidad,
    id_dependencia: row.id_dependencia,
    dependencia_nombre: row.dependencia_nombre,
    es_master_admin: row.es_master_admin,
    es_responsable_dependencia: row.es_responsable_dependencia
  }
}


/* =========================
   DEBUG
========================= */

export async function getAllUsersDB() {

  return db.all(
    `
    SELECT
      u.id,
      u.username,
      u.nombre_completo,
      c.nombre AS cargo,
      r.nombre AS rol,
      r.nivel_acceso,
      u.id_entidad,
      u.id_dependencia,
      u.es_master_admin,
      u.es_responsable_dependencia,
      u.created_at
    FROM usuarios u
    JOIN roles r ON r.id = u.id_rol
    LEFT JOIN cargos c ON c.id = u.id_cargo
    ORDER BY u.created_at ASC
    `
  )
}