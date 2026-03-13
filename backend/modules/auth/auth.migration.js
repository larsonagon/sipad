import { db } from '../../db/database.js'
import bcrypt from 'bcrypt'

export async function runAuthMigration() {

  console.log('🔧 Ejecutando migración AUTH institucional...')

  const isPostgres = process.env.DB_ENGINE === 'postgres'

  try {

    // =====================================================
    // TABLAS BASE INSTITUCIONALES
    // =====================================================

    if (isPostgres) {

      await db.exec(`

        CREATE TABLE IF NOT EXISTS roles (
          id SERIAL PRIMARY KEY,
          nombre TEXT NOT NULL UNIQUE,
          descripcion TEXT,
          nivel_acceso INTEGER NOT NULL,
          activo INTEGER DEFAULT 1,
          created_at TIMESTAMP DEFAULT NOW()
        );

        CREATE TABLE IF NOT EXISTS dependencias (
          id SERIAL PRIMARY KEY,
          nombre TEXT NOT NULL,
          codigo TEXT UNIQUE,
          descripcion TEXT,
          id_padre INTEGER,
          nivel INTEGER DEFAULT 1,
          activa INTEGER DEFAULT 1,
          created_at TIMESTAMP DEFAULT NOW(),
          updated_at TIMESTAMP,
          FOREIGN KEY (id_padre) REFERENCES dependencias(id)
        );

        CREATE TABLE IF NOT EXISTS usuarios (
          id SERIAL PRIMARY KEY,
          nombre_completo TEXT NOT NULL,
          documento TEXT UNIQUE,
          email TEXT UNIQUE NOT NULL,
          username TEXT UNIQUE NOT NULL,
          password_hash TEXT NOT NULL,
          id_dependencia INTEGER NOT NULL,
          id_rol INTEGER NOT NULL,
          estado INTEGER DEFAULT 1,
          bloqueado INTEGER DEFAULT 0,
          created_at TIMESTAMP DEFAULT NOW(),
          FOREIGN KEY (id_dependencia) REFERENCES dependencias(id),
          FOREIGN KEY (id_rol) REFERENCES roles(id)
        );

        CREATE TABLE IF NOT EXISTS auditoria_usuarios (
          id SERIAL PRIMARY KEY,
          actor_id INTEGER NOT NULL,
          usuario_afectado_id INTEGER NOT NULL,
          accion TEXT NOT NULL,
          detalle_json TEXT,
          created_at TIMESTAMP DEFAULT NOW(),
          FOREIGN KEY (actor_id) REFERENCES usuarios(id),
          FOREIGN KEY (usuario_afectado_id) REFERENCES usuarios(id)
        );

        CREATE TABLE IF NOT EXISTS refresh_tokens (
          id SERIAL PRIMARY KEY,
          user_id INTEGER NOT NULL,
          token TEXT NOT NULL,
          expires_at TIMESTAMP NOT NULL,
          revoked INTEGER DEFAULT 0,
          created_at TIMESTAMP DEFAULT NOW(),
          FOREIGN KEY (user_id) REFERENCES usuarios(id)
        );

      `)

    } else {

      await db.exec(`

        CREATE TABLE IF NOT EXISTS roles (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          nombre TEXT NOT NULL UNIQUE,
          descripcion TEXT,
          nivel_acceso INTEGER NOT NULL,
          activo INTEGER DEFAULT 1,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS dependencias (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          nombre TEXT NOT NULL,
          codigo TEXT UNIQUE,
          descripcion TEXT,
          id_padre INTEGER,
          nivel INTEGER DEFAULT 1,
          activa INTEGER DEFAULT 1,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME,
          FOREIGN KEY (id_padre) REFERENCES dependencias(id)
        );

        CREATE TABLE IF NOT EXISTS usuarios (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          nombre_completo TEXT NOT NULL,
          documento TEXT UNIQUE,
          email TEXT UNIQUE NOT NULL,
          username TEXT UNIQUE NOT NULL,
          password_hash TEXT NOT NULL,
          id_dependencia INTEGER NOT NULL,
          id_rol INTEGER NOT NULL,
          estado INTEGER DEFAULT 1,
          bloqueado INTEGER DEFAULT 0,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (id_dependencia) REFERENCES dependencias(id),
          FOREIGN KEY (id_rol) REFERENCES roles(id)
        );

        CREATE TABLE IF NOT EXISTS auditoria_usuarios (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          actor_id INTEGER NOT NULL,
          usuario_afectado_id INTEGER NOT NULL,
          accion TEXT NOT NULL,
          detalle_json TEXT,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (actor_id) REFERENCES usuarios(id),
          FOREIGN KEY (usuario_afectado_id) REFERENCES usuarios(id)
        );

        CREATE TABLE IF NOT EXISTS refresh_tokens (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          user_id INTEGER NOT NULL,
          token TEXT NOT NULL,
          expires_at DATETIME NOT NULL,
          revoked INTEGER DEFAULT 0,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (user_id) REFERENCES usuarios(id)
        );

      `)
    }

    // =====================================================
    // ROLES BASE
    // =====================================================

    if (isPostgres) {

      await db.exec(`
        INSERT INTO roles (id, nombre, descripcion, nivel_acceso) VALUES
        (1,'Super Admin','Control total del sistema',100),
        (2,'Administrador','Gestión de usuarios',80),
        (3,'Comité TRD','Validación estratégica',60),
        (4,'Profesional','Operativo',40),
        (5,'Auxiliar','Captura',20),
        (6,'Consulta','Solo lectura',10)
        ON CONFLICT (id) DO NOTHING;
      `)

    } else {

      await db.exec(`
        INSERT OR IGNORE INTO roles (id, nombre, descripcion, nivel_acceso) VALUES
        (1,'Super Admin','Control total del sistema',100),
        (2,'Administrador','Gestión de usuarios',80),
        (3,'Comité TRD','Validación estratégica',60),
        (4,'Profesional','Operativo',40),
        (5,'Auxiliar','Captura',20),
        (6,'Consulta','Solo lectura',10);
      `)
    }

    // =====================================================
    // DEPENDENCIA RAÍZ
    // =====================================================

    if (isPostgres) {

      await db.exec(`
        INSERT INTO dependencias (id,nombre,nivel)
        VALUES (1,'Dirección General',1)
        ON CONFLICT (id) DO NOTHING;
      `)

    } else {

      await db.exec(`
        INSERT OR IGNORE INTO dependencias (id,nombre,nivel)
        VALUES (1,'Dirección General',1);
      `)
    }

    // =====================================================
    // SUPER ADMIN AUTOMÁTICO
    // =====================================================

    const existingSuper = await db.get(`
      SELECT id FROM usuarios WHERE username = 'superadmin'
    `)

    if (!existingSuper) {

      const passwordHash = await bcrypt.hash('Admin123*',10)

      await db.run(`
        INSERT INTO usuarios
        (nombre_completo,documento,email,username,password_hash,id_dependencia,id_rol)
        VALUES (?,?,?,?,?,?,?)
      `,[
        'Super Administrador',
        '00000000',
        'super@sipad.local',
        'superadmin',
        passwordHash,
        1,
        1
      ])

      console.log('🔐 Super Admin creado automáticamente')
    }

    console.log('✅ AUTH institucional migrado correctamente')

  } catch (err) {

    console.error('❌ Error migración AUTH:',err)
    throw err

  }
}