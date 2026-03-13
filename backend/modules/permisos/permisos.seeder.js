export async function seedPermisosBase(db) {

  const permisosBase = [
    ['USUARIOS_VER', 'Ver usuarios', 'USUARIOS'],
    ['USUARIOS_CREAR', 'Crear usuarios', 'USUARIOS'],
    ['USUARIOS_EDITAR', 'Editar usuarios', 'USUARIOS'],
    ['USUARIOS_CAMBIAR_PASSWORD', 'Cambiar contraseña usuarios', 'USUARIOS'],

    ['ROLES_VER', 'Ver roles', 'ROLES'],
    ['ROLES_CREAR', 'Crear roles', 'ROLES'],
    ['ROLES_EDITAR', 'Editar roles', 'ROLES'],

    ['DEPENDENCIAS_VER', 'Ver dependencias', 'DEPENDENCIAS'],
    ['DEPENDENCIAS_CREAR', 'Crear dependencias', 'DEPENDENCIAS'],

    ['AUDITORIA_VER_GLOBAL', 'Ver auditoría global', 'AUDITORIA']
  ]

  for (const [codigo, descripcion, modulo] of permisosBase) {
    await db.run(
      `
      INSERT OR IGNORE INTO permisos
      (codigo, descripcion, modulo)
      VALUES (?, ?, ?)
      `,
      [codigo, descripcion, modulo]
    )
  }

  console.log('✅ Permisos base sembrados')
}