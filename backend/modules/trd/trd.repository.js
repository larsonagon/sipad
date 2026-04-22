import { randomUUID } from 'crypto'

export const TRDRepository = (db) => ({

  // =====================================================
  // VERSIONES TRD
  // =====================================================

  async createVersion(data) {

    const id = randomUUID()

    await db.run(
      `INSERT INTO trd_versiones
       (id, nombre_version, modo_creacion, estado, entidad_id)
       VALUES (?, ?, ?, 'borrador', ?)`,
      [id, data.nombre_version, data.modo_creacion, data.entidad_id || null]
    )

    return {
      id,
      nombre_version: data.nombre_version,
      modo_creacion:  data.modo_creacion,
      estado:         'borrador'
    }
  },

  async getVersions(entidadId = null) {

    if (entidadId) {
      return await db.all(`
        SELECT v.*,
          (SELECT COUNT(*) FROM series s WHERE s.trd_version_id = v.id) AS total_series
        FROM trd_versiones v
        WHERE v.entidad_id = ?
        ORDER BY v.id DESC
      `, [entidadId])
    }

    return await db.all(`
      SELECT v.*,
        (SELECT COUNT(*) FROM series s WHERE s.trd_version_id = v.id) AS total_series
      FROM trd_versiones v
      ORDER BY v.id DESC
    `)
  },

  async getVersionById(id) {
    return await db.get(`SELECT * FROM trd_versiones WHERE id = ?`, [id])
  },

  async actualizarEstadoVersion(id, estado) {
    await db.run(
      `UPDATE trd_versiones SET estado = ? WHERE id = ?`,
      [estado, id]
    )
    return true
  },

  // =====================================================
  // PROCESOS
  // =====================================================

  async getProcesos() {
    return await db.all(`
      SELECT
        p.id, p.nombre, p.descripcion, p.estado,
        p.subfuncion_id,
        s.nombre AS subfuncion_nombre
      FROM procesos p
      LEFT JOIN subfunciones s ON s.id = p.subfuncion_id
      ORDER BY p.nombre ASC
    `)
  },

  async createProceso(data) {

    const id = randomUUID()

    await db.run(
      `INSERT INTO procesos
       (id, subfuncion_id, nombre, descripcion, estado, propuesto_por, fecha_propuesta)
       VALUES (?, ?, ?, ?, 'propuesto', ?, ?)`,
      [
        id,
        data.subfuncion_id,
        data.nombre,
        data.descripcion || null,
        data.propuesto_por || null,
        new Date().toISOString()
      ]
    )

    return { id, subfuncion_id: data.subfuncion_id, nombre: data.nombre, estado: 'propuesto' }
  },

  // =====================================================
  // CCD — Cuadro de Clasificación Documental
  // Devuelve la jerarquía completa:
  // series → subseries → tipologías
  // agrupadas por dependencia
  // =====================================================

  async getCCDCompleto(versionId) {

    // 1. Series de esta versión con info de dependencia y macrofunción
    const series = await db.all(`
      SELECT
        s.*,
        d.nombre  AS dependencia_nombre,
        m.nombre  AS macrofuncion_nombre,
        m.tipo    AS macrofuncion_tipo
      FROM series s
      LEFT JOIN dependencias   d ON d.id = s.dependencia_id
      LEFT JOIN macrofunciones m ON m.id = s.macrofuncion_id
      WHERE s.trd_version_id = ?
      ORDER BY m.nombre ASC, d.nombre ASC, s.nombre ASC
    `, [versionId])

    // 2. Para cada serie, obtener subseries y tipologías
    const resultado = []

    for (const serie of series) {

      const subseries = await db.all(`
        SELECT * FROM subseries WHERE serie_id = ?
        ORDER BY nombre ASC
      `, [serie.id])

      const subseriesConTipologias = []

      for (const sub of subseries) {

        const tipologias = await db.all(`
          SELECT * FROM tipologias WHERE subserie_id = ?
          ORDER BY nombre ASC
        `, [sub.id])

        subseriesConTipologias.push({ ...sub, tipologias })
      }

      resultado.push({ ...serie, subseries: subseriesConTipologias })
    }

    // 3. Agrupar por dependencia para vista CCD
    const porDependencia = {}

    for (const serie of resultado) {

      const key   = serie.dependencia_id   || 'sin_dependencia'
      const label = serie.dependencia_nombre || 'Sin dependencia asignada'

      if (!porDependencia[key]) {
        porDependencia[key] = {
          dependencia_id:     serie.dependencia_id,
          dependencia_nombre: label,
          macrofuncion:       serie.macrofuncion_nombre,
          series:             []
        }
      }

      porDependencia[key].series.push(serie)
    }

    return Object.values(porDependencia)
  },

  // =====================================================
  // TRD COMPLETA POR VERSIÓN
  // Igual que CCD pero incluye retenciones
  // =====================================================

  async getTRDCompleta(versionId) {

    const series = await db.all(`
      SELECT
        s.*,
        d.nombre AS dependencia_nombre,
        m.nombre AS macrofuncion_nombre
      FROM series s
      LEFT JOIN dependencias   d ON d.id = s.dependencia_id
      LEFT JOIN macrofunciones m ON m.id = s.macrofuncion_id
      WHERE s.trd_version_id = ?
      ORDER BY d.nombre ASC, s.nombre ASC
    `, [versionId])

    const resultado = []

    for (const serie of series) {

      const subseries = await db.all(`
        SELECT * FROM subseries WHERE serie_id = ? ORDER BY nombre ASC
      `, [serie.id])

      const subseriesConTipologias = []

      for (const sub of subseries) {

        const tipologias = await db.all(`
          SELECT * FROM tipologias WHERE subserie_id = ? ORDER BY nombre ASC
        `, [sub.id])

        subseriesConTipologias.push({ ...sub, tipologias })
      }

      resultado.push({ ...serie, subseries: subseriesConTipologias })
    }

    // Agrupar por dependencia
    const porDependencia = {}

    for (const serie of resultado) {

      const key = serie.dependencia_id || 'sin_dependencia'

      if (!porDependencia[key]) {
        porDependencia[key] = {
          dependencia_id:     serie.dependencia_id,
          dependencia_nombre: serie.dependencia_nombre || 'Sin dependencia',
          macrofuncion:       serie.macrofuncion_nombre,
          series:             []
        }
      }

      porDependencia[key].series.push(serie)
    }

    return Object.values(porDependencia)
  },

  // =====================================================
  // DEPENDENCIAS CON SERIES EN UNA VERSIÓN
  // =====================================================

  async getDependenciasConSeries(versionId) {
    return await db.all(`
      SELECT DISTINCT
        d.id,
        d.nombre,
        COUNT(s.id) AS total_series
      FROM series s
      LEFT JOIN dependencias d ON d.id = s.dependencia_id
      WHERE s.trd_version_id = ?
      GROUP BY d.id, d.nombre
      ORDER BY d.nombre ASC
    `, [versionId])
  },

  // =====================================================
  // MACROFUNCIONES
  // =====================================================

  async getMacrofunciones() {
    return await db.all(`
      SELECT * FROM macrofunciones WHERE activo = 1 ORDER BY nombre ASC
    `)
  },

  // =====================================================
  // SERIES — operaciones individuales
  // =====================================================

  async getSeriesByVersion(versionId) {
    return await db.all(`
      SELECT s.*, d.nombre AS dependencia_nombre
      FROM series s
      LEFT JOIN dependencias d ON d.id = s.dependencia_id
      WHERE s.trd_version_id = ?
      ORDER BY s.nombre ASC
    `, [versionId])
  },

  async getSubseriesBySerie(serieId) {
    return await db.all(
      `SELECT * FROM subseries WHERE serie_id = ? ORDER BY nombre ASC`,
      [serieId]
    )
  },

  async getTipologiasBySubserie(subserieId) {
    return await db.all(
      `SELECT * FROM tipologias WHERE subserie_id = ? ORDER BY nombre ASC`,
      [subserieId]
    )
  }

})