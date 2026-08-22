// ======================================================
// SIPAD · Motor que aprende (aprendizaje asistido)
// Registra las correcciones del archivista y las aplica en
// futuras generaciones:
//   - serie/subserie por actividad (aprende clasificación)
//   - tipologías por serie (aprende qué NO pertenece)
// Diccionario GLOBAL (compartido entre entidades); los datos
// de cada TRD siguen aislados por entidad.
// ======================================================

import crypto from 'crypto'

const uid = () => crypto.randomUUID()
const now = () => new Date().toISOString()

export function norm(s) {
  return (s || '').toString().toLowerCase().normalize('NFD')
    .replace(/[̀-ͯ]/g, '').replace(/[^\w\s]/g, ' ').replace(/\s+/g, ' ').trim()
}

// ---------- Escritura ----------

async function upsertSerie(db, { clave, serie, subserie, senal, entidadId }) {
  if (!clave || !serie) return
  const row = await db.get(
    `SELECT id FROM trd_aprendizaje
     WHERE tipo='serie' AND clave=? AND serie=? AND coalesce(subserie,'')=coalesce(?,'') AND senal=?`,
    [clave, serie, subserie || null, senal]
  )
  if (row) {
    await db.run(`UPDATE trd_aprendizaje SET peso=peso+1, actualizado_en=? WHERE id=?`, [now(), row.id])
  } else {
    await db.run(
      `INSERT INTO trd_aprendizaje (id, tipo, clave, serie, subserie, tipologia, senal, peso, entidad_id, actualizado_en)
       VALUES (?, 'serie', ?, ?, ?, NULL, ?, 1, ?, ?)`,
      [uid(), clave, serie, subserie || null, senal, entidadId || null, now()]
    )
  }
}

async function upsertTipologia(db, { tipologia, serie, senal, entidadId }) {
  const t = norm(tipologia), s = norm(serie)
  if (!t || !s) return
  const row = await db.get(
    `SELECT id FROM trd_aprendizaje WHERE tipo='tipologia' AND tipologia=? AND serie=? AND senal=?`,
    [t, s, senal]
  )
  if (row) {
    await db.run(`UPDATE trd_aprendizaje SET peso=peso+1, actualizado_en=? WHERE id=?`, [now(), row.id])
  } else {
    await db.run(
      `INSERT INTO trd_aprendizaje (id, tipo, clave, serie, subserie, tipologia, senal, peso, entidad_id, actualizado_en)
       VALUES (?, 'tipologia', NULL, ?, NULL, ?, ?, 1, ?, ?)`,
      [uid(), s, t, senal, entidadId || null, now()]
    )
  }
}

export async function aprenderSerie(db, { nombreActividad, serie, subserie, senal = 'positiva', entidadId = null }) {
  await upsertSerie(db, { clave: norm(nombreActividad), serie, subserie, senal, entidadId })
}

export async function aprenderTipologias(db, { serie, tipologias = [], senal = 'positiva', entidadId = null }) {
  for (const t of tipologias) await upsertTipologia(db, { tipologia: t, serie, senal, entidadId })
}

function parseTip(raw) {
  if (!raw) return []
  try { const p = JSON.parse(raw); return Array.isArray(p) ? p : [p] } catch { return [raw] }
}

// Aprende a partir de una EDICIÓN del archivista sobre una propuesta.
// - serie/subserie nuevas → positiva
// - tipologías retiradas → negativa; conservadas → positiva
export async function aprenderDesdeEdicion(db, { propuesta, nombreActividad, nuevaSerie, nuevaSubserie, nuevasTipologias, entidadId = null }) {
  try {
    if (nombreActividad && nuevaSerie) {
      await aprenderSerie(db, { nombreActividad, serie: nuevaSerie, subserie: nuevaSubserie, senal: 'positiva', entidadId })
    }
    const antes = parseTip(propuesta?.tipologia_documental).map(norm)
    const ahora = (nuevasTipologias || []).map(norm)
    const serieRef = nuevaSerie || propuesta?.nombre_serie
    if (serieRef) {
      const retiradas = antes.filter(t => t && !ahora.includes(t))
      const conservadas = ahora.filter(Boolean)
      if (retiradas.length) await aprenderTipologias(db, { serie: serieRef, tipologias: retiradas, senal: 'negativa', entidadId })
      if (conservadas.length) await aprenderTipologias(db, { serie: serieRef, tipologias: conservadas, senal: 'positiva', entidadId })
    }
  } catch (e) { console.error('aprenderDesdeEdicion:', e.message) }
}

// Aprende de aprobar (refuerza) / rechazar (marca la clasificación como negativa)
export async function aprenderDesdeEstado(db, { nombreActividad, serie, subserie, estado, entidadId = null }) {
  try {
    if (!nombreActividad || !serie) return
    if (estado === 'aprobada') await aprenderSerie(db, { nombreActividad, serie, subserie, senal: 'positiva', entidadId })
    if (estado === 'rechazada') await aprenderSerie(db, { nombreActividad, serie, subserie, senal: 'negativa', entidadId })
  } catch (e) { console.error('aprenderDesdeEstado:', e.message) }
}

// ---------- Lectura / aplicación ----------

// Devuelve la serie/subserie aprendida para una actividad (si el saldo es positivo)
export async function consultarSerieAprendida(db, nombreActividad) {
  const clave = norm(nombreActividad)
  if (!clave) return null
  const rows = await db.all(
    `SELECT serie, subserie, senal, peso FROM trd_aprendizaje WHERE tipo='serie' AND clave=?`, [clave]
  )
  if (!rows.length) return null
  const agg = new Map()
  for (const r of rows) {
    const k = `${r.serie}||${r.subserie || ''}`
    const cur = agg.get(k) || { serie: r.serie, subserie: r.subserie, score: 0 }
    cur.score += (r.senal === 'negativa' ? -1 : 1) * (r.peso || 1)
    agg.set(k, cur)
  }
  const best = [...agg.values()].sort((a, b) => b.score - a.score)[0]
  return best && best.score > 0 ? { serie: best.serie, subserie: best.subserie } : null
}

// Conjunto de tipologías con saldo NEGATIVO para una serie (no pertenecen)
export async function tipologiasNegativas(db, serie) {
  const s = norm(serie)
  if (!s) return new Set()
  const rows = await db.all(
    `SELECT tipologia, senal, peso FROM trd_aprendizaje WHERE tipo='tipologia' AND serie=?`, [s]
  )
  const agg = new Map()
  for (const r of rows) {
    const cur = agg.get(r.tipologia) || 0
    agg.set(r.tipologia, cur + (r.senal === 'negativa' ? -1 : 1) * (r.peso || 1))
  }
  const neg = new Set()
  for (const [t, score] of agg) if (score < 0) neg.add(t)
  return neg
}

export function filtrarTipologias(tipologias, negSet) {
  if (!negSet || !negSet.size) return tipologias
  return tipologias.filter(t => !negSet.has(norm(t)))
}

// ---------- Ruta: estadísticas de aprendizaje ----------

export function registrarAprendizaje(router, db, guard) {
  const mw = typeof guard === 'function' ? guard : (req, res, next) => next()
  router.get('/aprendizaje', mw, async (req, res) => {
    try {
      const total = await db.get(`SELECT COUNT(*)::int n FROM trd_aprendizaje`)
      const porTipo = await db.all(`SELECT tipo, senal, COUNT(*)::int n, COALESCE(SUM(peso),0)::int peso FROM trd_aprendizaje GROUP BY tipo, senal`)
      return res.json({ ok: true, total: total?.n || 0, detalle: porTipo })
    } catch (err) {
      console.error('aprendizaje stats error:', err)
      return res.status(500).json({ ok: false, error: 'No se pudo consultar el aprendizaje' })
    }
  })
}
