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
      `SELECT q.id, q.seccion_id, q.orden, q.codigo, q.enunciado, q.ayuda, q.tipo, q.obligatoria, q.opciones
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
}

function safeJSON(s) {
  try { return JSON.parse(s) } catch { return s }
}
