// backend/modules/valoracion/valoracion.repository.js
import crypto from 'crypto'

const uid = () => crypto.randomUUID()
const now = () => new Date().toISOString()

export default class ValoracionRepository {

  constructor(db) {
    this.db = db
  }

  // ============================================================
  // PLANTILLAS
  // ============================================================

  async crearPlantilla({ entidadId, subserieId = null, tipo = 'levantamiento', nombre, descripcion = null, estado = 'borrador' }) {
    const id = uid()
    await this.db.run(
      `INSERT INTO lvd_plantillas (id, entidad_id, subserie_id, tipo, nombre, descripcion, estado, version, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, 1, ?)`,
      [id, entidadId, subserieId, tipo, nombre, descripcion, estado, now()]
    )
    return id
  }

  async listarPlantillas(entidadId, { tipo = null } = {}) {
    let sql = `SELECT id, entidad_id, subserie_id, tipo, nombre, descripcion, estado, version, created_at
               FROM lvd_plantillas WHERE (entidad_id = ? OR entidad_id IS NULL)`
    const params = [entidadId]
    if (tipo) { sql += ` AND tipo = ?`; params.push(tipo) }
    sql += ` ORDER BY created_at DESC`
    return await this.db.all(sql, params)
  }

  async obtenerPlantillaBase(plantillaId, entidadId) {
    return await this.db.get(
      `SELECT * FROM lvd_plantillas WHERE id = ? AND (entidad_id = ? OR entidad_id IS NULL)`,
      [plantillaId, entidadId]
    )
  }

  // Plantilla + secciones + preguntas, en estructura anidada lista para el frontend
  async obtenerPlantillaCompleta(plantillaId, entidadId) {
    const plantilla = await this.obtenerPlantillaBase(plantillaId, entidadId)
    if (!plantilla) return null

    const secciones = await this.db.all(
      `SELECT id, orden, titulo, instrucciones FROM lvd_secciones WHERE plantilla_id = ? ORDER BY orden`,
      [plantillaId]
    )
    const preguntas = await this.db.all(
      `SELECT q.id, q.seccion_id, q.orden, q.codigo, q.enunciado, q.ayuda, q.tipo, q.obligatoria, q.opciones, q.meta
         FROM lvd_preguntas q
         JOIN lvd_secciones s ON s.id = q.seccion_id
        WHERE s.plantilla_id = ?
        ORDER BY s.orden, q.orden`,
      [plantillaId]
    )

    const porSeccion = {}
    for (const q of preguntas) {
      q.obligatoria = !!q.obligatoria
      q.opciones = q.opciones ? safeJSON(q.opciones) : null
      q.meta = q.meta ? safeJSON(q.meta) : null
      ;(porSeccion[q.seccion_id] ||= []).push(q)
    }

    return {
      ...plantilla,
      secciones: secciones.map(s => ({ ...s, preguntas: porSeccion[s.id] || [] }))
    }
  }

  // ============================================================
  // CONSTRUCCIÓN DE PLANTILLAS (usado por el seeder y el editor)
  // Inserta una estructura completa {tipo, nombre, secciones:[{titulo, preguntas:[...]}]}
  // ============================================================

  async crearPlantillaCompleta(entidadId, estructura) {
    const plantillaId = await this.crearPlantilla({
      entidadId,
      subserieId: estructura.subserieId || null,
      tipo: estructura.tipo || 'levantamiento',
      nombre: estructura.nombre,
      descripcion: estructura.descripcion || null,
      estado: estructura.estado || 'activa'
    })

    let ordenS = 0
    for (const sec of (estructura.secciones || [])) {
      const seccionId = uid()
      await this.db.run(
        `INSERT INTO lvd_secciones (id, plantilla_id, orden, titulo, instrucciones) VALUES (?, ?, ?, ?, ?)`,
        [seccionId, plantillaId, ordenS++, sec.titulo, sec.instrucciones || null]
      )
      let ordenP = 0
      for (const p of (sec.preguntas || [])) {
        await this.db.run(
          `INSERT INTO lvd_preguntas (id, seccion_id, orden, codigo, enunciado, ayuda, tipo, obligatoria, opciones, meta)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            uid(), seccionId, ordenP++,
            p.codigo || null, p.enunciado, p.ayuda || null,
            p.tipo || 'texto_largo', p.obligatoria ? 1 : 0,
            p.opciones ? JSON.stringify(p.opciones) : null,
            p.meta ? JSON.stringify(p.meta) : null
          ]
        )
      }
    }
    return plantillaId
  }

  async plantillaExistePorNombre(entidadId, nombre) {
    const row = await this.db.get(
      `SELECT id FROM lvd_plantillas WHERE entidad_id = ? AND nombre = ? LIMIT 1`,
      [entidadId, nombre]
    )
    return row ? row.id : null
  }

  // ============================================================
  // DILIGENCIAMIENTOS (instancias llenadas)
  // ============================================================

  async crearDiligenciamiento({ plantillaId, entidadId, dependenciaId = null, usuarioId = null, titulo = null }) {
    const id = uid()
    await this.db.run(
      `INSERT INTO lvd_diligenciamientos (id, plantilla_id, entidad_id, dependencia_id, usuario_id, titulo, estado, created_at)
       VALUES (?, ?, ?, ?, ?, ?, 'en_proceso', ?)`,
      [id, plantillaId, entidadId, dependenciaId, usuarioId, titulo, now()]
    )
    return id
  }

  async listarDiligenciamientos(entidadId, { plantillaId = null } = {}) {
    let sql = `SELECT id, plantilla_id, dependencia_id, usuario_id, titulo, estado, created_at, updated_at
               FROM lvd_diligenciamientos WHERE entidad_id = ?`
    const params = [entidadId]
    if (plantillaId) { sql += ` AND plantilla_id = ?`; params.push(plantillaId) }
    sql += ` ORDER BY created_at DESC`
    return await this.db.all(sql, params)
  }

  async obtenerDiligenciamiento(id, entidadId) {
    const dil = await this.db.get(
      `SELECT * FROM lvd_diligenciamientos WHERE id = ? AND entidad_id = ?`,
      [id, entidadId]
    )
    if (!dil) return null
    const respuestas = await this.db.all(
      `SELECT pregunta_id, valor, valor_json FROM lvd_respuestas WHERE diligenciamiento_id = ?`,
      [id]
    )
    const casos = await this.db.all(
      `SELECT id, etiqueta, tipo_caso, titulo, descripcion, orden FROM lvd_casos WHERE diligenciamiento_id = ? ORDER BY orden`,
      [id]
    )
    for (const c of casos) {
      c.documentos = await this.db.all(
        `SELECT orden, nombre_documento, soporte, observacion FROM lvd_caso_documentos WHERE caso_id = ? ORDER BY orden`,
        [c.id]
      )
    }
    return { ...dil, respuestas, casos }
  }

  // Guarda (upsert manual) una respuesta por pregunta
  async guardarRespuesta(diligenciamientoId, preguntaId, valor, valorJson = null) {
    const existente = await this.db.get(
      `SELECT id FROM lvd_respuestas WHERE diligenciamiento_id = ? AND pregunta_id = ?`,
      [diligenciamientoId, preguntaId]
    )
    if (existente) {
      await this.db.run(
        `UPDATE lvd_respuestas SET valor = ?, valor_json = ? WHERE id = ?`,
        [valor, valorJson ? JSON.stringify(valorJson) : null, existente.id]
      )
    } else {
      await this.db.run(
        `INSERT INTO lvd_respuestas (id, diligenciamiento_id, pregunta_id, valor, valor_json) VALUES (?, ?, ?, ?, ?)`,
        [uid(), diligenciamientoId, preguntaId, valor, valorJson ? JSON.stringify(valorJson) : null]
      )
    }
    await this.db.run(`UPDATE lvd_diligenciamientos SET updated_at = ? WHERE id = ?`, [now(), diligenciamientoId])
  }

  async pertenece(diligenciamientoId, entidadId) {
    const row = await this.db.get(
      `SELECT id FROM lvd_diligenciamientos WHERE id = ? AND entidad_id = ?`,
      [diligenciamientoId, entidadId]
    )
    return !!row
  }

  async cambiarEstadoDiligenciamiento(id, entidadId, estado) {
    await this.db.run(
      `UPDATE lvd_diligenciamientos SET estado = ?, updated_at = ? WHERE id = ? AND entidad_id = ?`,
      [estado, now(), id, entidadId]
    )
  }

  // ============================================================
  // CASOS (expedientes reales anonimizados)
  // ============================================================

  async crearCaso(diligenciamientoId, { etiqueta = null, tipoCaso = null, titulo = null, descripcion = null, orden = 0 }) {
    const id = uid()
    await this.db.run(
      `INSERT INTO lvd_casos (id, diligenciamiento_id, etiqueta, tipo_caso, titulo, descripcion, orden) VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [id, diligenciamientoId, etiqueta, tipoCaso, titulo, descripcion, orden]
    )
    return id
  }

  async agregarDocumentoCaso(casoId, { orden = 0, nombreDocumento, soporte = null, observacion = null }) {
    const id = uid()
    await this.db.run(
      `INSERT INTO lvd_caso_documentos (id, caso_id, orden, nombre_documento, soporte, observacion) VALUES (?, ?, ?, ?, ?, ?)`,
      [id, casoId, orden, nombreDocumento, soporte, observacion]
    )
    return id
  }

  // ============================================================
  // FICHAS DE VALORACIÓN
  // ============================================================

  // Campos editables de la ficha (lista blanca)
  _camposFicha() {
    return [
      'serie', 'subserie', 'unidad_documental', 'productor_dependencia_id', 'funcion',
      'tipologias', 'valores_primarios', 'valores_secundarios', 'frecuencia_consulta',
      'usuarios_consulta', 'hecho_cierre', 'reglas_excepcion', 'tiempo_gestion',
      'tiempo_central', 'disposicion_final', 'disposicion_justificacion',
      'muestreo_porcentaje', 'muestreo_metodo', 'criterios_conservacion',
      'riesgos', 'fundamento_normativo', 'estado', 'diligenciamiento_id', 'propuesta_id'
    ]
  }

  // ============================================================
  // PUENTES CON TRD-AI y TRD
  // ============================================================

  // Lista las propuestas de TRD-AI (con su retención sugerida, si existe)
  async listarPropuestasTRDAI() {
    return await this.db.all(`
      SELECT p.id, p.nombre_serie, p.nombre_subserie, p.tipologia_documental,
             p.justificacion, p.confianza, p.estado, p.disposicion_final,
             r.retencion_gestion, r.retencion_central, r.disposicion_final AS retencion_disposicion
        FROM trd_series_propuestas p
        LEFT JOIN trd_reglas_retencion r ON r.propuesta_id = p.id
       ORDER BY p.creado_en DESC
    `)
  }

  async obtenerPropuestaTRDAI(id) {
    return await this.db.get(`
      SELECT p.id, p.nombre_serie, p.nombre_subserie, p.tipologia_documental,
             p.justificacion, p.confianza, p.estado, p.disposicion_final,
             r.retencion_gestion, r.retencion_central, r.disposicion_final AS retencion_disposicion
        FROM trd_series_propuestas p
        LEFT JOIN trd_reglas_retencion r ON r.propuesta_id = p.id
       WHERE p.id = ?
       LIMIT 1
    `, [id])
  }

  // Obtiene una versión TRD en borrador de la entidad, o la crea
  async obtenerOCrearVersionTRD(entidadId) {
    let v = await this.db.get(
      `SELECT * FROM trd_versiones WHERE entidad_id = ? AND estado = 'borrador' ORDER BY id DESC LIMIT 1`,
      [entidadId]
    )
    if (v) return v
    const id = uid()
    await this.db.run(
      `INSERT INTO trd_versiones (id, nombre_version, modo_creacion, estado, entidad_id)
       VALUES (?, 'Versión de trabajo — Valoración', 'asistido', 'borrador', ?)`,
      [id, entidadId]
    )
    return { id, nombre_version: 'Versión de trabajo — Valoración', estado: 'borrador' }
  }

  // Inserta o actualiza una serie por nombre dentro de una versión
  async upsertSerieTRD(versionId, entidadId, { nombre, tiempo_gestion, tiempo_central, disposicion_final, propuesta_id }) {
    const existente = await this.db.get(
      `SELECT id FROM series WHERE trd_version_id = ? AND nombre = ? LIMIT 1`,
      [versionId, nombre]
    )
    if (existente) {
      await this.db.run(
        `UPDATE series SET tiempo_gestion = ?, tiempo_central = ?, disposicion_final = ? WHERE id = ?`,
        [tiempo_gestion, tiempo_central, disposicion_final, existente.id]
      )
      return existente.id
    }
    const id = uid()
    await this.db.run(
      `INSERT INTO series (id, trd_version_id, nombre, tiempo_gestion, tiempo_central, disposicion_final, entidad_id, propuesta_id)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [id, versionId, nombre, tiempo_gestion, tiempo_central, disposicion_final, entidadId, propuesta_id || null]
    )
    return id
  }

  // Inserta o actualiza una subserie por nombre dentro de una serie
  async upsertSubserieTRD(serieId, { nombre, tiempo_gestion, tiempo_central, disposicion_final }) {
    const existente = await this.db.get(
      `SELECT id FROM subseries WHERE serie_id = ? AND nombre = ? LIMIT 1`,
      [serieId, nombre]
    )
    if (existente) {
      await this.db.run(
        `UPDATE subseries SET tiempo_gestion = ?, tiempo_central = ?, disposicion_final = ? WHERE id = ?`,
        [tiempo_gestion, tiempo_central, disposicion_final, existente.id]
      )
      return existente.id
    }
    const id = uid()
    await this.db.run(
      `INSERT INTO subseries (id, serie_id, nombre, tiempo_gestion, tiempo_central, disposicion_final)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [id, serieId, nombre, tiempo_gestion, tiempo_central, disposicion_final]
    )
    return id
  }

  _serializar(data) {
    // Serializa a texto los campos JSON conocidos
    const jsonKeys = ['valores_primarios', 'valores_secundarios', 'usuarios_consulta', 'reglas_excepcion']
    const out = {}
    for (const k of this._camposFicha()) {
      if (!(k in data)) continue
      let v = data[k]
      if (jsonKeys.includes(k) && v !== null && typeof v !== 'string') v = JSON.stringify(v)
      out[k] = v ?? null
    }
    return out
  }

  _hidratar(row) {
    if (!row) return row
    for (const k of ['valores_primarios', 'valores_secundarios', 'usuarios_consulta', 'reglas_excepcion']) {
      if (row[k]) row[k] = safeJSON(row[k])
    }
    return row
  }

  async crearFicha(entidadId, data = {}) {
    const id = uid()
    const s = this._serializar(data)
    await this.db.run(
      `INSERT INTO lvd_fichas
        (id, entidad_id, diligenciamiento_id, serie, subserie, unidad_documental,
         productor_dependencia_id, funcion, tipologias, valores_primarios, valores_secundarios,
         frecuencia_consulta, usuarios_consulta, hecho_cierre, reglas_excepcion,
         tiempo_gestion, tiempo_central, disposicion_final, disposicion_justificacion,
         muestreo_porcentaje, muestreo_metodo, criterios_conservacion, riesgos,
         fundamento_normativo, estado, origen, propuesta_id, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        id, entidadId, s.diligenciamiento_id ?? null, s.serie ?? null, s.subserie ?? null,
        s.unidad_documental ?? null, s.productor_dependencia_id ?? null, s.funcion ?? null,
        s.tipologias ?? null, s.valores_primarios ?? null, s.valores_secundarios ?? null,
        s.frecuencia_consulta ?? null, s.usuarios_consulta ?? null, s.hecho_cierre ?? null,
        s.reglas_excepcion ?? null, s.tiempo_gestion ?? null, s.tiempo_central ?? null,
        s.disposicion_final ?? null, s.disposicion_justificacion ?? null,
        s.muestreo_porcentaje ?? null, s.muestreo_metodo ?? null, s.criterios_conservacion ?? null,
        s.riesgos ?? null, s.fundamento_normativo ?? null, s.estado ?? 'borrador',
        data.origen ?? 'manual', s.propuesta_id ?? null, now()
      ]
    )
    return id
  }

  async listarFichas(entidadId) {
    const rows = await this.db.all(
      `SELECT id, serie, subserie, disposicion_final, tiempo_gestion, tiempo_central, estado, updated_at, created_at
         FROM lvd_fichas WHERE entidad_id = ? ORDER BY created_at DESC`,
      [entidadId]
    )
    return rows
  }

  async obtenerFicha(id, entidadId) {
    const row = await this.db.get(
      `SELECT * FROM lvd_fichas WHERE id = ? AND entidad_id = ?`,
      [id, entidadId]
    )
    return this._hidratar(row)
  }

  async pertenceFicha(id, entidadId) {
    const row = await this.db.get(`SELECT id FROM lvd_fichas WHERE id = ? AND entidad_id = ?`, [id, entidadId])
    return !!row
  }

  async eliminarFicha(id, entidadId) {
    const r = await this.db.run(`DELETE FROM lvd_fichas WHERE id = ? AND entidad_id = ?`, [id, entidadId])
    return r?.changes || 0
  }

  async actualizarFicha(id, entidadId, data = {}) {
    const s = this._serializar(data)
    const keys = Object.keys(s)
    if (!keys.length) return
    const sets = keys.map(k => `${k} = ?`).join(', ')
    const params = keys.map(k => s[k])
    params.push(now(), id, entidadId)
    await this.db.run(
      `UPDATE lvd_fichas SET ${sets}, updated_at = ? WHERE id = ? AND entidad_id = ?`,
      params
    )
  }
}

function safeJSON(s) {
  try { return JSON.parse(s) } catch { return s }
}
