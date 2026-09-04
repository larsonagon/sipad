// ======================================================
// SIPAD · Valoración documental justificada (por serie)
// Deriva retención (AG/AC), disposición final y un FUNDAMENTO
// archivístico/normativo para cada propuesta, según su serie
// y el contexto de la actividad. Base para alcaldías; editable.
//
// Marco: Ley 594/2000, Decreto 1080/2015, Acuerdo AGN 004/2019.
// ======================================================

import crypto from 'crypto'
import { sugerirRetencionContextual } from './trd-ai.engine.js'

function norm(s) {
  return (s || '').toString().toUpperCase().normalize('NFD').replace(/[̀-ͯ]/g, '').trim()
}

const DISP_TEXTO = {
  CT: 'Conservación Total',
  E:  'Eliminación',
  S:  'Selección',
  M:  'Medio Técnico'
}

const DISP_PROC = {
  CT: 'Se transfiere al archivo histórico por su valor secundario.',
  E:  'Se elimina siguiendo el Acuerdo AGN 004/2019: inventario, aval del Comité Institucional de Gestión y Desempeño, publicación 60 días hábiles y acta.',
  S:  'Se selecciona una muestra representativa para conservación; el remanente se elimina según procedimiento.',
  M:  'Se reproduce en medio técnico garantizando autenticidad e integridad; se conserva el sustituto.'
}

// ---------- Base de conocimiento por serie (alcaldías) ----------
// ag/ac en años; disp = CT|E|S|M; vp = valores primarios; vs = secundarios; cierre = hecho de cierre
const KB = {
  'ACCIONES CONSTITUCIONALES': { ag: 2, ac: 8,  disp: 'CT', vp: ['administrativo', 'legal', 'jurídico'], vs: ['histórico'], cierre: 'ejecutoria del fallo o cierre del trámite' },
  'ACTAS':                     { ag: 2, ac: 8,  disp: 'CT', vp: ['administrativo', 'legal'], vs: ['histórico', 'testimonial'], cierre: 'aprobación y firma del acta' },
  'ACTOS ADMINISTRATIVOS':     { ag: 2, ac: 8,  disp: 'CT', vp: ['administrativo', 'legal', 'jurídico'], vs: ['histórico'], cierre: 'expedición y notificación del acto' },
  'AUDITORÍAS':                { ag: 2, ac: 8,  disp: 'CT', vp: ['administrativo', 'legal', 'fiscal'], vs: ['histórico'], cierre: 'cierre del plan de mejoramiento' },
  'BASES DE DATOS':            { ag: 2, ac: 8,  disp: 'S',  vp: ['administrativo', 'técnico'], vs: ['informativo'], cierre: 'actualización o migración de la base' },
  'BOLETINES':                 { ag: 2, ac: 8,  disp: 'CT', vp: ['administrativo'], vs: ['histórico', 'informativo'], cierre: 'publicación del boletín' },
  'CERTIFICADOS':              { ag: 2, ac: 8,  disp: 'S',  vp: ['administrativo', 'legal'], vs: ['informativo'], cierre: 'expedición del certificado' },
  'COBROS COACTIVOS':          { ag: 3, ac: 7,  disp: 'S',  vp: ['legal', 'fiscal', 'contable'], vs: [], cierre: 'pago total, prescripción o archivo del proceso' },
  'COMUNICACIONES OFICIALES':  { ag: 2, ac: 8,  disp: 'S',  vp: ['administrativo'], vs: ['informativo'], cierre: 'cierre del período del consecutivo' },
  'COMPROBANTES CONTABLES':    { ag: 2, ac: 8,  disp: 'S',  vp: ['contable', 'fiscal', 'legal'], vs: [], cierre: 'cierre de la vigencia fiscal' },
  'CONCEPTOS TÉCNICOS':        { ag: 2, ac: 8,  disp: 'CT', vp: ['administrativo', 'técnico', 'legal'], vs: ['histórico'], cierre: 'emisión del concepto' },
  'CONTRATOS':                 { ag: 2, ac: 18, disp: 'CT', vp: ['administrativo', 'legal', 'fiscal', 'contable'], vs: ['histórico'], cierre: 'liquidación del contrato' },
  'HISTORIAS':                 { ag: 2, ac: 80, disp: 'CT', vp: ['administrativo', 'legal', 'jurídico'], vs: ['histórico'], cierre: 'desvinculación o cierre del expediente' },
  'IMPUESTO PREDIAL UNIFICADO':{ ag: 2, ac: 8,  disp: 'S',  vp: ['fiscal', 'contable', 'legal'], vs: ['estadístico', 'histórico'], cierre: 'pago total o prescripción de la obligación tributaria', norma: 'Ley 44 de 1990 y Estatuto Tributario art. 817 (prescripción 5 años); se conserva muestra por su valor estadístico sobre el desarrollo del municipio' },
  'INDUSTRIA Y COMERCIO':      { ag: 2, ac: 8,  disp: 'S',  vp: ['fiscal', 'contable', 'legal'], vs: ['estadístico', 'histórico'], cierre: 'firmeza de la declaración o prescripción de la obligación', norma: 'Ley 14 de 1983 y Estatuto Tributario art. 817 (prescripción 5 años); se conserva muestra por su valor estadístico de la actividad económica' },
  'INFORMES':                  { ag: 2, ac: 8,  disp: 'CT', vp: ['administrativo', 'legal'], vs: ['histórico'], cierre: 'presentación del informe' },
  'INSTRUMENTOS ARCHIVÍSTICOS':{ ag: 2, ac: 8,  disp: 'CT', vp: ['administrativo', 'técnico'], vs: ['histórico'], cierre: 'convalidación o actualización del instrumento' },
  'LICENCIAS Y PERMISOS':      { ag: 2, ac: 8,  disp: 'CT', vp: ['administrativo', 'legal'], vs: ['histórico', 'patrimonial'], cierre: 'expedición y vencimiento de la licencia' },
  'MANUALES':                  { ag: 2, ac: 8,  disp: 'CT', vp: ['administrativo', 'técnico'], vs: ['histórico'], cierre: 'derogatoria o actualización del manual' },
  'PLANES':                    { ag: 2, ac: 8,  disp: 'CT', vp: ['administrativo', 'legal'], vs: ['histórico'], cierre: 'cierre del período de vigencia del plan' },
  'PROCESOS':                  { ag: 3, ac: 7,  disp: 'S',  vp: ['legal', 'jurídico'], vs: ['histórico'], cierre: 'ejecutoria de la decisión o archivo del proceso' },
  'PROGRAMAS':                 { ag: 2, ac: 8,  disp: 'CT', vp: ['administrativo'], vs: ['histórico'], cierre: 'cierre del programa' },
  'PROYECTOS':                 { ag: 2, ac: 8,  disp: 'CT', vp: ['administrativo', 'fiscal'], vs: ['histórico'], cierre: 'cierre o liquidación del proyecto' },
  'PQRS':                      { ag: 2, ac: 8,  disp: 'S',  vp: ['administrativo', 'legal'], vs: ['informativo'], cierre: 'respuesta y cierre de la petición' }
}

function construirFundamento({ serie, vp, vs, cierre, ag, ac, disp, origen, norma }) {
  const vpTxt = vp && vp.length ? vp.join(', ') : 'administrativo'
  const vsTxt = vs && vs.length ? vs.join(', ') : 'sin valor secundario relevante'
  const dispTxt = DISP_TEXTO[disp] || 'por definir'
  const proc = DISP_PROC[disp] || ''
  const base = origen === 'kb'
    ? `Valoración de la serie ${serie}.`
    : `Valoración contextual (la serie no está en la base de referencia; ajustar si aplica).`
  const normaTxt = norma
    ? `Fundamento normativo: Ley 594 de 2000, Decreto 1080 de 2015, Acuerdo AGN 004 de 2019 y ${norma}.`
    : `Fundamento normativo: Ley 594 de 2000, Decreto 1080 de 2015 y Acuerdo AGN 004 de 2019.`
  return [
    base,
    `Valores primarios: ${vpTxt}.`,
    `Valores secundarios: ${vsTxt}.`,
    `Hecho de cierre: ${cierre || 'cierre del trámite'}.`,
    `Retención: ${ag} año(s) en Archivo de Gestión y ${ac} en Archivo Central.`,
    `Disposición final: ${dispTxt}. ${proc}`,
    normaTxt
  ].join(' ')
}

// Valoriza una propuesta con base en su serie y (opcional) contexto de la actividad
export function valorarSerie(serie, subserie, ctx = {}) {
  const key = norm(serie)
  const base = KB[key]

  if (base) {
    return {
      retencion_gestion: base.ag,
      retencion_central: base.ac,
      disposicion_final: base.disp, // CT|E|S|M
      fundamento_normativo: construirFundamento({ serie, ...base, origen: 'kb' }),
      origen: 'kb'
    }
  }

  // Fallback: motor contextual con lo que se sepa de la actividad
  const r = sugerirRetencionContextual({
    tipo_funcion:       ctx.tipo_funcion || 'apoyo',
    nivel_riesgo:       ctx.nivel_riesgo || 'medio',
    impacto_juridico:   ctx.impacto_juridico || 'bajo',
    funcion_permanente: ctx.funcion_permanente || 'no',
    requiere_conservacion: ctx.requiere_conservacion || 'no',
    soporte_principal:  ctx.soporte_principal || 'digital',
    confianza_lexica:   ctx.confianza_lexica ?? 0.6
  })
  const dispMap = { conservacion_total: 'CT', eliminacion: 'E', seleccion: 'S', medio_tecnico: 'M' }
  const disp = dispMap[r.disposicion] || 'S'
  return {
    retencion_gestion: r.gestion,
    retencion_central: r.central,
    disposicion_final: disp,
    fundamento_normativo: construirFundamento({
      serie, vp: [], vs: [], cierre: 'cierre del trámite',
      ag: r.gestion, ac: r.central, disp, origen: 'contextual'
    }),
    origen: 'contextual'
  }
}

// ---------- Persistencia: valoriza N propuestas ----------

export async function valorarPropuestas(db, { ids = null, entidadId = null, soloSinRegla = false }) {

  // Selección de propuestas objetivo
  let filas
  if (Array.isArray(ids) && ids.length) {
    const objetivo = []
    for (const id of ids) {
      const row = entidadId
        ? await db.get(`SELECT tsp.*, sa.tipo_funcion, sa.entidad_id AS act_ent FROM trd_series_propuestas tsp LEFT JOIN segtec_actividades sa ON sa.id=tsp.actividad_id WHERE tsp.id=? AND tsp.entidad_id=?`, [id, entidadId])
        : await db.get(`SELECT tsp.*, sa.tipo_funcion FROM trd_series_propuestas tsp LEFT JOIN segtec_actividades sa ON sa.id=tsp.actividad_id WHERE tsp.id=?`, [id])
      if (row) objetivo.push(row)
    }
    filas = objetivo
  } else {
    // Todas las aprobadas de la entidad
    filas = await db.all(`
      SELECT tsp.*, sa.tipo_funcion
      FROM trd_series_propuestas tsp
      LEFT JOIN segtec_actividades sa ON sa.id = tsp.actividad_id
      WHERE tsp.estado = 'aprobada' ${entidadId ? 'AND tsp.entidad_id = ?' : ''}
    `, entidadId ? [entidadId] : [])
  }

  let valoradas = 0
  const now = () => new Date().toISOString()

  for (const p of filas) {
    if (soloSinRegla) {
      const existe = await db.get(`SELECT id FROM trd_reglas_retencion WHERE propuesta_id = ?`, [p.id])
      if (existe) continue
    }

    const v = valorarSerie(p.nombre_serie, p.nombre_subserie, {
      tipo_funcion: p.tipo_funcion,
      confianza_lexica: p.confianza ?? 0.6
    })

    // Upsert: reemplaza la regla previa
    await db.run(`DELETE FROM trd_reglas_retencion WHERE propuesta_id = ?`, [p.id])
    await db.run(`
      INSERT INTO trd_reglas_retencion
        (id, propuesta_id, retencion_gestion, retencion_central, disposicion_final, fundamento_normativo, tipo_regla, creado_en)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `, [crypto.randomUUID(), p.id, v.retencion_gestion, v.retencion_central, v.disposicion_final, v.fundamento_normativo, 'valoracion', now()])

    // Refleja la disposición también en la propuesta (para export/validador)
    await db.run(`UPDATE trd_series_propuestas SET disposicion_final = ? WHERE id = ?`, [v.disposicion_final, p.id])

    valoradas++
  }

  return { valoradas }
}

// ---------- Ruta ----------

export function registrarValoracion(router, db, guard) {
  const mw = typeof guard === 'function' ? guard : (req, res, next) => next()

  // Valorar: si vienen ids, esos; si no, todas las aprobadas de la entidad
  router.post('/valorar-lote', mw, async (req, res) => {
    try {
      const ids = Array.isArray(req.body?.ids) ? req.body.ids : null
      const r = await valorarPropuestas(db, { ids, entidadId: req.entidad_id || null })
      return res.json({ ok: true, ...r })
    } catch (err) {
      console.error('TRD valorar-lote error:', err)
      return res.status(500).json({ ok: false, error: 'No se pudo valorar' })
    }
  })
}
