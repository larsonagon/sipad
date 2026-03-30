PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS actividades_funcionales (
  id TEXT PRIMARY KEY,

  proceso_id TEXT NOT NULL,

  nombre TEXT NOT NULL,
  descripcion TEXT,

  frecuencia TEXT CHECK(
    frecuencia IN ('diaria','semanal','mensual','ocasional','segun_solicitud')
  ),

  inicia_por TEXT CHECK(
    inicia_por IN (
      'solicitud_verbal',
      'documento_fisico',
      'correo_electronico',
      'sistema_informacion',
      'acto_administrativo',
      'otro'
    )
  ),

  documento_generado TEXT,
  documento_recibido TEXT,

  conforma_expediente INTEGER DEFAULT 0,
  soporte TEXT CHECK(soporte IN ('fisico','digital','ambos')),

  continuidad_proceso TEXT,

  creado_por TEXT,
  fecha_creacion TEXT,

  FOREIGN KEY (proceso_id) REFERENCES procesos(id)
);
