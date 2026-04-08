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
