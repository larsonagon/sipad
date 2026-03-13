import db from './db.js';
import bcrypt from 'bcrypt';

async function seed() {

    console.log('🌱 Ejecutando seed inicial...');

    const password = await bcrypt.hash('Admin123*', 10);

    db.serialize(() => {

        db.run(`
            INSERT OR IGNORE INTO roles (id, nombre, descripcion, nivel_acceso)
            VALUES 
            (1, 'Super Admin', 'Control total del sistema', 100),
            (2, 'Administrador', 'Administrador institucional', 80),
            (3, 'Funcionario', 'Usuario estándar', 40)
        `);

        db.run(`
            INSERT OR IGNORE INTO dependencias (id, nombre, codigo)
            VALUES
            (1, 'Dirección General', 'DG'),
            (2, 'Oficina Jurídica', 'OJ')
        `);

        db.run(`
            INSERT OR IGNORE INTO usuarios (
                id,
                nombre_completo,
                documento,
                email,
                username,
                password_hash,
                id_dependencia,
                id_rol
            )
            VALUES (
                1,
                'Super Administrador',
                '00000000',
                'admin@sipad.local',
                'admin',
                '${password}',
                1,
                1
            )
        `);

        console.log('✅ Seed completado');
    });
}

seed();