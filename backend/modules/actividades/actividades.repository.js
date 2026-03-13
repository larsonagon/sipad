import { randomUUID } from 'crypto'

export const ActividadesRepository = (db) => ({

  async create(data) {

    const id = randomUUID()

    await db.run(
      `
      INSERT INTO actividades_funcionales (
        id,
        proceso_id,
        nombre,
        descripcion,
        frecuencia,
        inicia_por,
        documento_generado,
        documento_recibido,
        conforma_expediente,
        soporte,
        continuidad_proceso,
        creado_por,
        fecha_creacion
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `,
      [
        id,
        data.proceso_id,
        data.nombre,
        data.descripcion || null,
        data.frecuencia,
        data.inicia_por,
        data.documento_generado || null,
        data.documento_recibido || null,
        data.conforma_expediente ? 1 : 0,
        data.soporte || null,
        data.continuidad_proceso || null,
        data.creado_por || null,
        new Date().toISOString()
      ]
    )

    return { id, ...data }
  },

  async findAll() {
    return await db.all(
      `SELECT * FROM actividades_funcionales ORDER BY fecha_creacion DESC`
    )
  }

})
