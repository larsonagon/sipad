import crypto from 'crypto'

export function SEGTECActividadesRepository(db) {

  if (!db) {
    throw new Error('DB no proporcionada al repository')
  }

  const nowISO = () => new Date().toISOString()

  const nullIfEmpty = v => (v === "" || v === undefined ? null : v)
  const intOrNull = v => (v === "" || v === undefined || v === null ? null : Number(v))

  async function ejecutarUpdate(query, params, contexto) {

    const result = await db.run(query, params)

    if (!result || result.changes === 0) {
      throw new Error(`${contexto}: no se encontró actividad`)
    }

    return result
  }

  // 🔥 Obtener entidad del usuario
  async function obtenerEntidadIdPorUsuario(usuarioId) {

    if (!usuarioId) {
      throw new Error('usuarioId requerido para multi-tenant')
    }

    const row = await db.get(
      `SELECT entidad_id FROM usuarios WHERE id = ?`,
      [usuarioId]
    )

    if (!row || !row.entidad_id) {
      throw new Error('Usuario sin entidad válida')
    }

    return row.entidad_id
  }

  // =====================================================
  // NORMALIZAR CAMPOS
  // =====================================================

  function normalizarActividad(row) {

    if (!row) return row

    let dependencias = []

    try {
      dependencias = row.dependencias_relacionadas
        ? JSON.parse(row.dependencias_relacionadas)
        : []
    } catch {
      dependencias = []
    }

    return {
      ...row,

      documentos_generados: row.documentos_generados ?? '',
      recepcion_externa: row.recepcion_externa ?? '',

      formato_produccion: row.formato_produccion ?? '',
      volumen_documental: row.volumen_documental ?? '',

      responsable_custodia: row.responsable_custodia ?? '',
      cargo_custodia: row.cargo_custodia ?? '',
      dependencia_custodia: row.dependencia_custodia ?? '',

      localizacion_documentos: row.localizacion_documentos ?? '',

      dependencias_relacionadas: dependencias,

      plazo_legal: row.plazo_legal ?? '',
      tiempo_ejecucion: row.tiempo_ejecucion ?? '',

      genera_expediente_propio: row.genera_expediente_propio ?? 0
    }
  }

  // =====================================================
  // ACTIVIDAD
  // =====================================================

  async function obtenerActividadPorId(id) {

    if (!id) return null

    const row = await db.get(`
      SELECT
        a.*,
        u.nombre_completo AS funcionario,
        d.nombre AS dependencia,
        c.nombre AS cargo
      FROM segtec_actividades a
      LEFT JOIN usuarios u ON a.usuario_id = u.id
      LEFT JOIN dependencias d ON a.dependencia_id = d.id
      LEFT JOIN cargos c ON u.id_cargo = c.id
      WHERE a.id = ?
    `, [id])

    if (!row) return null

    return normalizarActividad(row)
  }

  async function obtenerActividadPorIdYUsuario(id, usuarioId) {

    if (!id || !usuarioId) return null

    const entidadId = await obtenerEntidadIdPorUsuario(usuarioId)

    const row = await db.get(`
      SELECT
        a.*,
        u.nombre_completo AS funcionario,
        d.nombre AS dependencia,
        c.nombre AS cargo
      FROM segtec_actividades a
      LEFT JOIN usuarios u ON a.usuario_id = u.id
      LEFT JOIN dependencias d ON a.dependencia_id = d.id
      LEFT JOIN cargos c ON u.id_cargo = c.id
      WHERE a.id = ?
      AND a.usuario_id = ?
      AND u.entidad_id = ?
    `, [id, usuarioId, entidadId])

    if (!row) return null

    return normalizarActividad(row)
  }

  // =====================================================
  // PROCESO
  // =====================================================

  async function obtenerPorProcesoId(procesoId) {

    if (!procesoId) return []

    return db.all(`
      SELECT id,nombre,descripcion_funcional,proceso_id
      FROM segtec_actividades
      WHERE proceso_id = ?
      ORDER BY created_at ASC
    `, [procesoId])
  }

  async function asignarProcesoActividad(id, procesoId) {

    return ejecutarUpdate(`
      UPDATE segtec_actividades
      SET proceso_id = ?, updated_at = ?
      WHERE id = ?
    `,[procesoId,nowISO(),id],"ASIGNAR PROCESO")
  }

  // =====================================================
  // CREAR
  // =====================================================

  async function crearActividad(data = {}) {

    const id = crypto.randomUUID()
    const now = nowISO()

    const entidadId = await obtenerEntidadIdPorUsuario(data.usuario_id)

    await db.run(`
      INSERT INTO segtec_actividades (
        id,proceso_id,dependencia_id,usuario_id,
        nombre,frecuencia,tipo_funcion,descripcion_funcional,
        estado_general,created_at,updated_at,entidad_id
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `,[
      id,
      data.proceso_id || null,
      data.dependencia_id,
      data.usuario_id,
      null,
      null,
      null,
      null,
      'borrador',
      now,
      now,
      entidadId
    ])

    return { id }
  }

  // =====================================================
  // LISTAR
  // ✅ FIX: acepta entidadId externo para Super Admin
  // =====================================================

  async function listarPorUsuario(usuarioId, esAdmin = false, entidadIdExterno = null) {

    // Si viene entidadId externo (Super Admin gestionando otra entidad), usarlo
    // Si no, obtenerlo desde la BD del usuario
    const entidadId = entidadIdExterno || await obtenerEntidadIdPorUsuario(usuarioId)

    const queryBase = `
      SELECT
        a.*,
        u.nombre_completo AS funcionario,
        d.nombre AS dependencia,
        c.nombre AS cargo
      FROM segtec_actividades a
      LEFT JOIN usuarios u ON a.usuario_id = u.id
      LEFT JOIN dependencias d ON a.dependencia_id = d.id
      LEFT JOIN cargos c ON u.id_cargo = c.id
    `

    let rows = []

    if (esAdmin === true) {

      // Super Admin y Archivista: todas las actividades de la entidad
      rows = await db.all(`
        ${queryBase}
        WHERE a.entidad_id = ?
        ORDER BY a.created_at DESC
      `, [entidadId])

    } else {

      if (!usuarioId) {
        throw new Error('usuarioId requerido para listar actividades')
      }

      // Operativos: solo sus propias actividades
      rows = await db.all(`
        ${queryBase}
        WHERE a.usuario_id = ?
        AND a.entidad_id = ?
        ORDER BY a.created_at DESC
      `,[usuarioId, entidadId])
    }

    return rows.map(normalizarActividad)
  }

  // =====================================================
  // BLOQUE 1
  // =====================================================

  async function actualizarBloque1(id,data={}) {

    return ejecutarUpdate(`
      UPDATE segtec_actividades
      SET nombre=?,tipo_funcion=?,frecuencia=?,descripcion_funcional=?,updated_at=?
      WHERE id=?
    `,[
      nullIfEmpty(data.nombre),
      nullIfEmpty(data.tipo_funcion),
      nullIfEmpty(data.frecuencia),
      nullIfEmpty(data.descripcion_funcional),
      nowISO(),
      id
    ],"BLOQUE1")
  }

  // =====================================================
  // BLOQUE 2
  // =====================================================

  async function actualizarBloque2(id,data={}) {

    return ejecutarUpdate(`
      UPDATE segtec_actividades
      SET
      genera_documentos=?,
      documentos_generados=?,
      formato_produccion=?,
      recepcion_externa=?,
      volumen_documental=?,
      responsable_custodia=?,
      cargo_custodia=?,
      dependencia_custodia=?,
      localizacion_documentos=?,
      updated_at=?
      WHERE id=?
    `,[
      data.genera_documentos ? 1 : 0,
      nullIfEmpty(data.documentos_generados),
      nullIfEmpty(data.formato_produccion),
      nullIfEmpty(data.recepcion_externa),
      nullIfEmpty(data.volumen_documental),
      nullIfEmpty(data.responsable_custodia),
      intOrNull(data.cargo_custodia),
      intOrNull(data.dependencia_custodia),
      nullIfEmpty(data.localizacion_documentos),
      nowISO(),
      id
    ],"BLOQUE2")
  }

  // =====================================================
  // BLOQUE 3
  // =====================================================

  async function actualizarBloque3(id,data={}) {

    return ejecutarUpdate(`
      UPDATE segtec_actividades
      SET
      tiene_pasos_formales=?,
      requiere_otras_dependencias=?,
      norma_aplicable=?,
      dependencias_relacionadas=?,
      plazo_legal=?,
      tiempo_ejecucion=?,
      genera_expediente_propio=?,
      updated_at=?
      WHERE id=?
    `,[
      data.tiene_pasos_formales ? 1 : 0,
      data.requiere_otras_dependencias ? 1 : 0,
      nullIfEmpty(data.norma_aplicable),

      data.dependencias_relacionadas
        ? JSON.stringify(data.dependencias_relacionadas)
        : null,

      nullIfEmpty(data.plazo_legal),
      nullIfEmpty(data.tiempo_ejecucion),

      data.genera_expediente_propio ? 1 : 0,

      nowISO(),
      id
    ],"BLOQUE3")
  }

  // =====================================================
  // ANALISIS
  // =====================================================

  async function guardarAnalisisActividad(id,data){

    const analisisId = crypto.randomUUID()

    await db.run(`
      INSERT INTO segtec_analisis_actividad
      (id,actividad_id,serie_propuesta,subserie_propuesta,retencion_gestion,retencion_central,disposicion_final,justificacion,motor_version,creado_en)
      VALUES (?,?,?,?,?,?,?,?,?,?)
    `,[
      analisisId,
      id,
      data.serie_propuesta ?? null,
      data.subserie_propuesta ?? null,
      data.retencion_gestion ?? null,
      data.retencion_central ?? null,
      data.disposicion_final ?? null,
      data.justificacion ?? null,
      data.motor_version ?? '1.0',
      nowISO()
    ])

    return { id: analisisId }
  }

  async function obtenerUltimoAnalisis(id){

    return db.get(`
      SELECT *
      FROM segtec_analisis_actividad
      WHERE actividad_id=?
      ORDER BY creado_en DESC
      LIMIT 1
    `,[id])
  }

  async function listarAnalisisPorActividad(id){

    const rows = await db.all(`
      SELECT *
      FROM segtec_analisis_actividad
      WHERE actividad_id=?
      ORDER BY creado_en DESC
    `,[id])

    return rows || []
  }

  // =====================================================
  // ESTADO
  // =====================================================

  async function actualizarEstadoGeneral(id,estado){

    return ejecutarUpdate(`
      UPDATE segtec_actividades
      SET estado_general=?,updated_at=?
      WHERE id=?
    `,[estado,nowISO(),id],"ACTUALIZAR ESTADO")
  }

  async function marcarActividadComoCompleta(id){

    return ejecutarUpdate(`
      UPDATE segtec_actividades
      SET estado_general='caracterizada',updated_at=?
      WHERE id=?
    `,[nowISO(),id],"MARCAR COMPLETA")
  }

  async function eliminarActividad(id){

    return ejecutarUpdate(`
      DELETE FROM segtec_actividades
      WHERE id=?
    `,[id],"ELIMINAR")
  }

  return {
    obtenerActividadPorId,
    obtenerActividadPorIdYUsuario,
    obtenerPorProcesoId,
    asignarProcesoActividad,
    crearActividad,
    listarPorUsuario,
    eliminarActividad,
    actualizarBloque1,
    actualizarBloque2,
    actualizarBloque3,
    guardarAnalisisActividad,
    obtenerUltimoAnalisis,
    listarAnalisisPorActividad,
    actualizarEstadoGeneral,
    marcarActividadComoCompleta
  }
}