// backend/modules/valoracion/valoracion.migration.js
// =====================================================================
// Motor de Levantamiento y Valoración Documental (LVD)
// Genérico y multi-entidad. Soporta dos tipos de instrumento:
//   - 'levantamiento'  -> captura operativa de cómo funciona un proceso
//   - 'valoracion'     -> estudio de valoración documental (-> ficha TRD)
//
// Aditivo e idempotente: solo CREATE TABLE/INDEX IF NOT EXISTS.
// No define claves foráneas hacia tablas externas (entidades, subseries)
// para evitar choques de tipos entre entornos (uuid vs text) y para no
// acoplar el motor a otros módulos. El aislamiento se hace por entidad_id.
// =====================================================================

export async function runValoracionMigration(db) {

  if (!db) throw new Error('DB no proporcionada a valoracion.migration')

  await db.exec(`
    -- Plantilla = un instrumento (cuestionario/estudio) de una entidad
    CREATE TABLE IF NOT EXISTS lvd_plantillas (
      id            TEXT PRIMARY KEY,
      entidad_id    TEXT,
      subserie_id   TEXT,
      tipo          TEXT NOT NULL DEFAULT 'levantamiento',
      nombre        TEXT NOT NULL,
      descripcion   TEXT,
      estado        TEXT NOT NULL DEFAULT 'borrador',
      version       INTEGER NOT NULL DEFAULT 1,
      created_at    TEXT NOT NULL,
      updated_at    TEXT
    );

    CREATE INDEX IF NOT EXISTS idx_lvd_plantillas_entidad
      ON lvd_plantillas(entidad_id);

    -- Secciones (bloques) de una plantilla
    CREATE TABLE IF NOT EXISTS lvd_secciones (
      id            TEXT PRIMARY KEY,
      plantilla_id  TEXT NOT NULL,
      orden         INTEGER NOT NULL DEFAULT 0,
      titulo        TEXT NOT NULL,
      instrucciones TEXT,
      FOREIGN KEY (plantilla_id) REFERENCES lvd_plantillas(id) ON DELETE CASCADE
    );

    CREATE INDEX IF NOT EXISTS idx_lvd_secciones_plantilla
      ON lvd_secciones(plantilla_id);

    -- Preguntas de una sección
    CREATE TABLE IF NOT EXISTS lvd_preguntas (
      id            TEXT PRIMARY KEY,
      seccion_id    TEXT NOT NULL,
      orden         INTEGER NOT NULL DEFAULT 0,
      codigo        TEXT,
      enunciado     TEXT NOT NULL,
      ayuda         TEXT,
      tipo          TEXT NOT NULL DEFAULT 'texto_largo',
      obligatoria   INTEGER NOT NULL DEFAULT 0,
      opciones      TEXT,
      meta          TEXT,
      FOREIGN KEY (seccion_id) REFERENCES lvd_secciones(id) ON DELETE CASCADE
    );

    CREATE INDEX IF NOT EXISTS idx_lvd_preguntas_seccion
      ON lvd_preguntas(seccion_id);

    -- Diligenciamiento = una instancia de plantilla llenada por alguien
    CREATE TABLE IF NOT EXISTS lvd_diligenciamientos (
      id             TEXT PRIMARY KEY,
      plantilla_id   TEXT NOT NULL,
      entidad_id     TEXT,
      dependencia_id INTEGER,
      usuario_id     INTEGER,
      titulo         TEXT,
      estado         TEXT NOT NULL DEFAULT 'en_proceso',
      created_at     TEXT NOT NULL,
      updated_at     TEXT,
      FOREIGN KEY (plantilla_id) REFERENCES lvd_plantillas(id) ON DELETE CASCADE
    );

    CREATE INDEX IF NOT EXISTS idx_lvd_dil_plantilla
      ON lvd_diligenciamientos(plantilla_id);
    CREATE INDEX IF NOT EXISTS idx_lvd_dil_entidad
      ON lvd_diligenciamientos(entidad_id);

    -- Respuestas: valor por pregunta dentro de un diligenciamiento
    CREATE TABLE IF NOT EXISTS lvd_respuestas (
      id                 TEXT PRIMARY KEY,
      diligenciamiento_id TEXT NOT NULL,
      pregunta_id        TEXT NOT NULL,
      valor              TEXT,
      valor_json         TEXT,
      FOREIGN KEY (diligenciamiento_id) REFERENCES lvd_diligenciamientos(id) ON DELETE CASCADE,
      FOREIGN KEY (pregunta_id) REFERENCES lvd_preguntas(id) ON DELETE CASCADE
    );

    CREATE INDEX IF NOT EXISTS idx_lvd_respuestas_dil
      ON lvd_respuestas(diligenciamiento_id);

    -- Casos: expedientes reales anonimizados (A/B/C) de un diligenciamiento
    CREATE TABLE IF NOT EXISTS lvd_casos (
      id                 TEXT PRIMARY KEY,
      diligenciamiento_id TEXT NOT NULL,
      etiqueta           TEXT,
      tipo_caso          TEXT,
      titulo             TEXT,
      descripcion        TEXT,
      orden              INTEGER NOT NULL DEFAULT 0,
      FOREIGN KEY (diligenciamiento_id) REFERENCES lvd_diligenciamientos(id) ON DELETE CASCADE
    );

    CREATE INDEX IF NOT EXISTS idx_lvd_casos_dil
      ON lvd_casos(diligenciamiento_id);

    -- Documentos de un caso, en el orden en que aparecen en el expediente
    CREATE TABLE IF NOT EXISTS lvd_caso_documentos (
      id              TEXT PRIMARY KEY,
      caso_id         TEXT NOT NULL,
      orden           INTEGER NOT NULL DEFAULT 0,
      nombre_documento TEXT NOT NULL,
      soporte         TEXT,
      observacion     TEXT,
      FOREIGN KEY (caso_id) REFERENCES lvd_casos(id) ON DELETE CASCADE
    );

    CREATE INDEX IF NOT EXISTS idx_lvd_caso_docs_caso
      ON lvd_caso_documentos(caso_id);
  `)

  console.log('✅ LVD (valoración) migration ejecutada')
}
