import db from './db.js';

console.log('🚀 Ejecutando migración institucional...');

db.serialize(() => {

    db.run(`
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
    )`);

    db.run(`
    CREATE TABLE IF NOT EXISTS roles (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        nombre TEXT NOT NULL UNIQUE,
        descripcion TEXT,
        nivel_acceso INTEGER NOT NULL,
        activo INTEGER DEFAULT 1,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`);

    db.run(`
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
        ultimo_login DATETIME,
        intentos_fallidos INTEGER DEFAULT 0,
        bloqueado INTEGER DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME,
        FOREIGN KEY (id_dependencia) REFERENCES dependencias(id),
        FOREIGN KEY (id_rol) REFERENCES roles(id)
    )`);

    console.log('✅ Migración completada');
});