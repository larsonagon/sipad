PRAGMA foreign_keys = OFF;

DELETE FROM segtec_analisis_actividad;
DELETE FROM segtec_caracterizacion;
DELETE FROM segtec_propuestas_ai;
DELETE FROM segtec_propuestas_ai_new;

DELETE FROM trd_series_propuestas;
DELETE FROM trd_reglas_retencion;
DELETE FROM trd_versiones;

DELETE FROM segtec_actividades;

DELETE FROM sqlite_sequence
WHERE name IN (
'segtec_actividades',
'segtec_analisis_actividad',
'segtec_caracterizacion',
'trd_series_propuestas',
'trd_reglas_retencion',
'trd_versiones',
'segtec_propuestas_ai',
'segtec_propuestas_ai_new'
);

PRAGMA foreign_keys = ON;