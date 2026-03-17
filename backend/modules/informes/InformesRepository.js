export default class InformesRepository {

  constructor(db) {
    this.db = db
  }

  // ======================================
  // UTILIDAD: NORMALIZAR FECHA
  // ======================================

  normalizarFecha(fecha) {

    if (!fecha) return null

    if (fecha.includes('/')) {
      const [d, m, y] = fecha.split('/')
      return `${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`
    }

    return fecha
  }

  // ======================================
  // INFORME 1
  // REGISTRO COMPLETO DE ACTIVIDADES
  // ======================================

  async obtenerActividades(filtros = {}) {

    let sql = `
      SELECT
        a.id,
        a.created_at,
        a.nombre,
        a.descripcion_funcional,
        a.frecuencia,
        u.nombre_completo AS funcionario,
        COALESCE(d.nombre, du.nombre) AS dependencia
      FROM segtec_actividades a
      LEFT JOIN usuarios u
        ON u.id = a.usuario_id
      LEFT JOIN dependencias d
        ON d.id = a.dependencia_id
      LEFT JOIN dependencias du
        ON du.id = u.id_dependencia
      WHERE 1=1
    `

    const params = []

    if (filtros.funcionario && !isNaN(filtros.funcionario)) {
      sql += ` AND a.usuario_id = ?`
      params.push(Number(filtros.funcionario))
    }

    if (filtros.dependencia && !isNaN(filtros.dependencia)) {

      const dep = Number(filtros.dependencia)

      sql += `
        AND (
          a.dependencia_id = ?
          OR u.id_dependencia = ?
        )
      `
      params.push(dep, dep)
    }

    const fechaInicio = this.normalizarFecha(filtros.fechaInicio)
    const fechaFin = this.normalizarFecha(filtros.fechaFin)

    if (fechaInicio) {
      sql += ` AND date(a.created_at) >= date(?)`
      params.push(fechaInicio)
    }

    if (fechaFin) {
      sql += ` AND date(a.created_at) <= date(?)`
      params.push(fechaFin)
    }

    sql += ` ORDER BY a.created_at DESC`

    return await this.db.all(sql, params)

  }


  // ======================================
  // INFORME 2
  // RESUMEN DE ACTIVIDADES POR DEPENDENCIA
  // ======================================

  async obtenerResumenPorDependencia() {

    const sql = `
      SELECT
        COALESCE(d.nombre, du.nombre) AS dependencia,
        COUNT(a.id) AS total_actividades,
        COUNT(DISTINCT a.usuario_id) AS total_funcionarios,
        SUM(
          CASE
            WHEN a.estado_general = 'analizada'
            OR a.estado_general = 'caracterizada'
            THEN 1
            ELSE 0
          END
        ) AS actividades_analizadas
      FROM segtec_actividades a
      LEFT JOIN usuarios u
        ON u.id = a.usuario_id
      LEFT JOIN dependencias d
        ON d.id = a.dependencia_id
      LEFT JOIN dependencias du
        ON du.id = u.id_dependencia
      GROUP BY dependencia
      ORDER BY total_actividades DESC
    `

    return await this.db.all(sql)

  }


  // ======================================
  // INFORME 3
  // PRODUCCIÓN DOCUMENTAL
  // ======================================

  async obtenerProduccionDocumental(filtros = {}) {

    let sql = `
      SELECT
        a.nombre AS actividad,
        COALESCE(d.nombre, du.nombre) AS dependencia,
        a.documentos_generados,
        a.formato_produccion,
        a.volumen_documental,
        a.frecuencia
      FROM segtec_actividades a
      LEFT JOIN usuarios u
        ON u.id = a.usuario_id
      LEFT JOIN dependencias d
        ON d.id = a.dependencia_id
      LEFT JOIN dependencias du
        ON du.id = u.id_dependencia
      WHERE a.genera_documentos IS NOT NULL
      AND a.genera_documentos <> ''
    `

    const params = []

    if (filtros.dependencia && !isNaN(filtros.dependencia)) {

      const dep = Number(filtros.dependencia)

      sql += `
        AND (
          a.dependencia_id = ?
          OR u.id_dependencia = ?
        )
      `
      params.push(dep, dep)

    }

    sql += ` ORDER BY a.nombre ASC`

    const rows = await this.db.all(sql, params)

    const data = rows.map(row => {

      const docs = row.documentos_generados || ""

      const tipos = docs
        .split(',')
        .map(d => d.trim())
        .filter(d => d.length > 0)

      let formato = row.formato_produccion

      if (formato === 'digital') formato = 'Digital'
      if (formato === 'fisico') formato = 'Físico'
      if (formato === 'ambos') formato = 'Físico y digital'

      let volumen = row.volumen_documental

      if (volumen === 'menos_10') volumen = 'Menos de 10'
      if (volumen === 'entre_10_50') volumen = 'Entre 10 y 50'
      if (volumen === 'mas_50') volumen = 'Más de 50'

      let frecuencia = row.frecuencia

      if (frecuencia === 'diaria') frecuencia = 'Diaria'
      if (frecuencia === 'semanal') frecuencia = 'Semanal'
      if (frecuencia === 'mensual') frecuencia = 'Mensual'
      if (frecuencia === 'eventual') frecuencia = 'Eventual'

      return {
        actividad: row.actividad,
        dependencia: row.dependencia,
        documentos_generados: tipos.join(', '),
        total_tipos_documentales: tipos.length,
        formato,
        volumen,
        frecuencia
      }

    })

    return data

  }

}