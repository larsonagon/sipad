import { randomUUID } from 'crypto'

export const TRDRepository = (db) => ({

  // =========================
  // VERSIONES TRD
  // =========================

  async createVersion(data) {

    const id = randomUUID()

    await db.run(
      `
      INSERT INTO trd_versiones
      (id, nombre_version, modo_creacion, estado)
      VALUES (?, ?, ?, 'borrador')
      `,
      [id, data.nombre_version, data.modo_creacion]
    )

    return {
      id,
      nombre_version: data.nombre_version,
      modo_creacion: data.modo_creacion,
      estado: 'borrador'
    }
  },

  async getVersions() {
    return await db.all(`
      SELECT * 
      FROM trd_versiones
      ORDER BY rowid DESC
    `)
  },

  // =========================
  // PROCESOS
  // =========================

  async getProcesos() {
    return await db.all(`
      SELECT 
        p.id,
        p.nombre,
        p.descripcion,
        p.estado,
        p.subfuncion_id,
        s.nombre AS subfuncion_nombre
      FROM procesos p
      LEFT JOIN subfunciones s 
        ON s.id = p.subfuncion_id
      ORDER BY p.nombre ASC
    `)
  },

  async createProceso(data) {

    const id = randomUUID()

    await db.run(
      `
      INSERT INTO procesos (
        id,
        subfuncion_id,
        nombre,
        descripcion,
        estado,
        propuesto_por,
        fecha_propuesta
      )
      VALUES (?, ?, ?, ?, 'propuesto', ?, ?)
      `,
      [
        id,
        data.subfuncion_id,
        data.nombre,
        data.descripcion || null,
        data.propuesto_por || null,
        new Date().toISOString()
      ]
    )

    return {
      id,
      subfuncion_id: data.subfuncion_id,
      nombre: data.nombre,
      descripcion: data.descripcion || null,
      estado: 'propuesto'
    }
  }

})
