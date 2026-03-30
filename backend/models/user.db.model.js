// backend/models/user.db.model.js
// SIPAD – Modelo institucional de usuarios (SQLite / PostgreSQL)

import { db } from '../db/database.js'

/* =========================
   CREAR USUARIO
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
  entidad_id
}) {

  if (!idCargo) {
    throw new Error('El cargo es obligatorio')
  }

  if (!entidad_id) {
    throw new Error('Entidad obligatoria')
  }

  const row = await db.get(
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
      entidad_id
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
      entidad_id
    ]
  )

  return {
    id: row?.id || null
  }
}


/* =========================
   BUSCAR USUARIO POR USERNAME
========================= */

export async function findUserByUsernameDB(username) {

  const row = await db.get(
    `
    SELECT
      u.id,
      u.username,
      u.password_hash,
      u.nombre_completo,
      u.entidad_id,
      e.nombre AS entidad_nombre, -- 🔥 NUEVO
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
    LEFT JOIN entidades e ON e.id = u.entidad_id -- 🔥 NUEVO JOIN
    WHERE u.username = ?
      AND u.estado = 1
      AND u.bloqueado = false
    `,
    [username]
  )

  if (!row) {
    return null
  }

  return {
    id: Number(row.id),
    username: row.username,
    nombre_completo: row.nombre_completo,
    passwordHash: row.password_hash,

    role: row.rol_nombre,
    nivel_acceso: Number(row.nivel_acceso),

    cargo: row.cargo_nombre,
    cargo_nombre: row.cargo_nombre,

    // 🔥 MULTI-TENANT
    entidad_id: row.entidad_id,
    entidad_nombre: row.entidad_nombre, // 🔥 NUEVO

    id_dependencia: row.id_dependencia ? Number(row.id_dependencia) : null,

    dependencia_nombre: row.dependencia_nombre,

    es_master_admin: Boolean(row.es_master_admin),
    es_responsable_dependencia: Boolean(row.es_responsable_dependencia)
  }
}


/* =========================
   LISTAR USUARIOS (YA MULTI-TENANT)
========================= */

export async function getAllUsersDB(entidad_id) {

  if (!entidad_id) {
    throw new Error('Entidad requerida')
  }

  const rows = await db.all(
    `
    SELECT
      u.id,
      u.username,
      u.nombre_completo,
      c.nombre AS cargo,
      r.nombre AS rol,
      r.nivel_acceso,
      u.entidad_id,
      u.id_dependencia,
      u.es_master_admin,
      u.es_responsable_dependencia,
      u.created_at
    FROM usuarios u
    JOIN roles r ON r.id = u.id_rol
    LEFT JOIN cargos c ON c.id = u.id_cargo
    WHERE u.entidad_id = ?
    ORDER BY u.created_at ASC
    `,
    [entidad_id]
  )

  return rows || []
}