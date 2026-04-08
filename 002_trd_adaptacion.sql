-- ============================================================
-- SIPAD — Motor TRD-AI
-- Migración 002: Adaptación a estructura existente
-- Ejecutar en orden, una sola vez
-- ============================================================

-- ── 1. Nuevas tablas (catálogo y unidades) ──────────────────

CREATE TABLE IF NOT EXISTS trd_catalogo_series (
  id      SERIAL PRIMARY KEY,
  codigo  VARCHAR(10)  NOT NULL UNIQUE,
  nombre  VARCHAR(200) NOT NULL,
  activo  BOOLEAN DEFAULT true
);

CREATE TABLE IF NOT EXISTS trd_catalogo_subseries (
  id       SERIAL PRIMARY KEY,
  codigo   VARCHAR(10)  NOT NULL,
  nombre   VARCHAR(200) NOT NULL,
  serie_id INTEGER REFERENCES trd_catalogo_series(id) ON DELETE CASCADE,
  activo   BOOLEAN DEFAULT true,
  UNIQUE(codigo, serie_id)
);

CREATE TABLE IF NOT EXISTS trd_unidades (
  id         SERIAL PRIMARY KEY,
  codigo     VARCHAR(10)  NOT NULL,
  nombre     VARCHAR(200) NOT NULL,
  entidad_id INTEGER REFERENCES entidades(id) ON DELETE CASCADE,
  activo     BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(codigo, entidad_id)
);

-- ── 2. Columnas nuevas en tablas existentes ──────────────────

ALTER TABLE series
  ADD COLUMN IF NOT EXISTS unidad_id         TEXT,
  ADD COLUMN IF NOT EXISTS catalogo_serie_id INTEGER REFERENCES trd_catalogo_series(id),
  ADD COLUMN IF NOT EXISTS procedimiento     TEXT,
  ADD COLUMN IF NOT EXISTS activo            BOOLEAN DEFAULT true;

ALTER TABLE subseries
  ADD COLUMN IF NOT EXISTS catalogo_subserie_id INTEGER REFERENCES trd_catalogo_subseries(id),
  ADD COLUMN IF NOT EXISTS tipos_documentales   TEXT[]  DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS procedimiento        TEXT,
  ADD COLUMN IF NOT EXISTS activo               BOOLEAN DEFAULT true;

-- ── 3. Índices ───────────────────────────────────────────────

CREATE INDEX IF NOT EXISTS idx_trd_unidades_entidad     ON trd_unidades(entidad_id);
CREATE INDEX IF NOT EXISTS idx_series_unidad            ON series(unidad_id);
CREATE INDEX IF NOT EXISTS idx_series_catalogo          ON series(catalogo_serie_id);
CREATE INDEX IF NOT EXISTS idx_subseries_catalogo       ON subseries(catalogo_subserie_id);
