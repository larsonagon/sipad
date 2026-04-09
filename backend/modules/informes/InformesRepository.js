export default class InformesRepository {

  constructor(db) {
    this.db = db
  }

  // ======================================
  // UTILIDAD: QUERY POSTGRES
  // ======================================

  async query(sql, params = []) {
    const result = await this.db.query(sql, params)
    return result.rows
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

    const params = []

    let sql = `
      SELECT
        a.id,
        a.created_at,
        a.nombre,
        a.descripcion_funcional,
        a.frecuencia,
        a.estado_general,
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

    if (filtros.funcionario && !isNaN(filtros.funcionario)) {
      params.push(Number(filtros.funcionario))
      sql += ` AND a.usuario_id = $${params.length}`
    }

    if (filtros.dependencia && !isNaN(filtros.dependencia)) {
      const dep = Number(filtros.dependencia)
      params.push(dep)
      sql += ` AND (a.dependencia_id = $${params.length}`
      params.push(dep)
      sql += ` OR u.id_dependencia = $${params.length})`
    }

    const fechaInicio = this.normalizarFecha(filtros.fechaInicio)
    const fechaFin    = this.normalizarFecha(filtros.fechaFin)

    if (fechaInicio) {
      params.push(fechaInicio)
      sql += ` AND a.created_at::date >= $${params.length}::date`
    }

    if (fechaFin) {
      params.push(fechaFin)
      sql += ` AND a.created_at::date <= $${params.length}::date`
    }

    sql += ` ORDER BY a.created_at DESC`

    return await this.query(sql, params)
  }

  // ======================================
  // INFORME 2
  // RESUMEN POR DEPENDENCIA
  // ======================================

  async obtenerResumenPorDependencia() {

    const sql = `
      SELECT
        COALESCE(d.nombre, du.nombre) AS dependencia,
        COUNT(a.id) AS total_actividades,
        COUNT(DISTINCT a.usuario_id) AS total_funcionarios,
        SUM(
          CASE
            WHEN a.estado_general IN ('analizada', 'caracterizada')
            THEN 1 ELSE 0
          END
        ) AS actividades_analizadas
      FROM segtec_actividades a
      LEFT JOIN usuarios u
        ON u.id = a.usuario_id
      LEFT JOIN dependencias d
        ON d.id = a.dependencia_id
      LEFT JOIN dependencias du
        ON du.id = u.id_dependencia
      GROUP BY COALESCE(d.nombre, du.nombre)
      ORDER BY total_actividades DESC
    `

    return await this.query(sql)
  }

  // ======================================
  // INFORME 3
  // PRODUCCIÓN DOCUMENTAL
  // ======================================

  async obtenerProduccionDocumental(filtros = {}) {

    const params = []

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

    if (filtros.dependencia && !isNaN(filtros.dependencia)) {
      const dep = Number(filtros.dependencia)
      params.push(dep)
      sql += ` AND (a.dependencia_id = $${params.length}`
      params.push(dep)
      sql += ` OR u.id_dependencia = $${params.length})`
    }

    sql += ` ORDER BY a.nombre ASC`

    const rows = await this.query(sql, params)

    return rows.map(row => {

      const docs  = row.documentos_generados || ''
      const tipos = docs.split(',').map(d => d.trim()).filter(d => d.length > 0)

      const mapaFormato = { digital: 'Digital', fisico: 'Físico', ambos: 'Físico y digital' }
      const mapaVolumen = { menos_10: 'Menos de 10', entre_10_50: 'Entre 10 y 50', mas_50: 'Más de 50' }
      const mapaFrecuencia = { diaria: 'Diaria', semanal: 'Semanal', mensual: 'Mensual', eventual: 'Eventual' }

      return {
        actividad:               row.actividad,
        dependencia:             row.dependencia,
        documentos_generados:    tipos.join(', '),
        total_tipos_documentales: tipos.length,
        formato:                 mapaFormato[row.formato_produccion]  || row.formato_produccion,
        volumen:                 mapaVolumen[row.volumen_documental]  || row.volumen_documental,
        frecuencia:              mapaFrecuencia[row.frecuencia]       || row.frecuencia
      }
    })
  }
}