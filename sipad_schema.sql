CREATE TABLE sync_events (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    type TEXT NOT NULL,
    entity_id TEXT,
    payload TEXT,
    created_at TEXT NOT NULL,
    FOREIGN KEY (user_id)
      REFERENCES usuarios(id)
      ON DELETE CASCADE
  );
CREATE TABLE sqlite_sequence(name,seq);
CREATE TABLE roles (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        nombre TEXT NOT NULL UNIQUE,
        descripcion TEXT,
        nivel_acceso INTEGER NOT NULL,
        activo INTEGER DEFAULT 1,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );
CREATE TABLE dependencias (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        nombre TEXT NOT NULL,
        codigo TEXT UNIQUE,
        descripcion TEXT,
        id_padre INTEGER,
        nivel INTEGER DEFAULT 1,
        activa INTEGER DEFAULT 1,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME,
        FOREIGN KEY (id_padre) REFERENCES dependencias(id)
      );
CREATE TABLE auditoria_usuarios (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        actor_id INTEGER NOT NULL,
        usuario_afectado_id INTEGER NOT NULL,
        accion TEXT NOT NULL,
        detalle_json TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (actor_id) REFERENCES usuarios(id),
        FOREIGN KEY (usuario_afectado_id) REFERENCES usuarios(id)
      );
CREATE TABLE refresh_tokens (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        token TEXT NOT NULL,
        expires_at DATETIME NOT NULL,
        revoked INTEGER DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES usuarios(id)
      );
CREATE TABLE auditoria_roles (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      actor_id INTEGER NOT NULL,
      rol_afectado_id INTEGER NOT NULL,
      accion TEXT NOT NULL,
      detalle_json TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (actor_id) REFERENCES usuarios(id),
      FOREIGN KEY (rol_afectado_id) REFERENCES roles(id)
    );
CREATE TABLE auditoria_dependencias (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      actor_id INTEGER NOT NULL,
      dependencia_afectada_id INTEGER NOT NULL,
      accion TEXT NOT NULL,
      detalle_json TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (actor_id) REFERENCES usuarios(id),
      FOREIGN KEY (dependencia_afectada_id) REFERENCES dependencias(id)
    );
CREATE TABLE entidades (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      nombre TEXT NOT NULL,
      subdominio TEXT UNIQUE,
      nit TEXT,
      estado INTEGER DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
CREATE TABLE configuracion_entidad (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      id_entidad INTEGER NOT NULL UNIQUE,
      nombre_publico TEXT,
      logo_url TEXT,
      color_primario TEXT DEFAULT '#1E3A8A',
      color_secundario TEXT DEFAULT '#3B82F6',
      color_sidebar TEXT DEFAULT '#0F172A',
      footer_texto TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (id_entidad) REFERENCES entidades(id)
    );
CREATE TABLE macrofunciones (
  id TEXT PRIMARY KEY,
  codigo TEXT NOT NULL UNIQUE,
  nombre TEXT NOT NULL,
  descripcion TEXT,
  tipo TEXT CHECK(tipo IN ('misional','apoyo','control','estrategica')),
  activo INTEGER DEFAULT 1
);
CREATE TABLE subfunciones (
  id TEXT PRIMARY KEY,
  macrofuncion_id TEXT NOT NULL,
  nombre TEXT NOT NULL,
  descripcion TEXT,
  activo INTEGER DEFAULT 1,
  fecha_creacion TEXT,
  creado_por TEXT,
  FOREIGN KEY (macrofuncion_id) REFERENCES macrofunciones(id)
);
CREATE TABLE procesos (
  id TEXT PRIMARY KEY,
  subfuncion_id TEXT NOT NULL,
  nombre TEXT NOT NULL,
  descripcion TEXT,
  estado TEXT CHECK(estado IN ('propuesto','en_revision','aprobado','rechazado')) DEFAULT 'propuesto',
  propuesto_por TEXT,
  fecha_propuesta TEXT,
  aprobado_por TEXT,
  fecha_aprobacion TEXT,
  FOREIGN KEY (subfuncion_id) REFERENCES subfunciones(id)
);
CREATE TABLE trd_versiones (
  id TEXT PRIMARY KEY,
  nombre_version TEXT NOT NULL,
  modo_creacion TEXT CHECK(modo_creacion IN ('manual','asistido','mixto')),
  fecha_inicio_vigencia TEXT,
  fecha_fin_vigencia TEXT,
  estado TEXT CHECK(estado IN ('borrador','en_revision','aprobada','derogada')),
  acto_administrativo TEXT,
  numero_acto TEXT,
  fecha_acto TEXT,
  observaciones TEXT
);
CREATE TABLE series (
  id TEXT PRIMARY KEY,
  trd_version_id TEXT NOT NULL,
  macrofuncion_id TEXT,
  subfuncion_id TEXT,
  nombre TEXT NOT NULL,
  codigo TEXT,
  tiempo_gestion INTEGER,
  tiempo_central INTEGER,
  disposicion_final TEXT CHECK(disposicion_final IN ('CT','EL','ST','MT')),
  FOREIGN KEY (trd_version_id) REFERENCES trd_versiones(id),
  FOREIGN KEY (macrofuncion_id) REFERENCES macrofunciones(id),
  FOREIGN KEY (subfuncion_id) REFERENCES subfunciones(id)
);
CREATE TABLE subseries (
  id TEXT PRIMARY KEY,
  serie_id TEXT NOT NULL,
  nombre TEXT NOT NULL,
  codigo TEXT,
  tiempo_gestion INTEGER,
  tiempo_central INTEGER,
  disposicion_final TEXT CHECK(disposicion_final IN ('CT','EL','ST','MT')),
  FOREIGN KEY (serie_id) REFERENCES series(id)
);
CREATE TABLE tipologias (
  id TEXT PRIMARY KEY,
  subserie_id TEXT NOT NULL,
  nombre TEXT NOT NULL,
  descripcion TEXT,
  FOREIGN KEY (subserie_id) REFERENCES subseries(id)
);
CREATE TABLE actividades_funcionales (
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
CREATE TABLE trd_reglas_retencion (
      id TEXT PRIMARY KEY,

      propuesta_id TEXT NOT NULL,

      tiempo_gestion INTEGER,
      tiempo_central INTEGER,

      disposicion_final TEXT CHECK (
        disposicion_final IN (
          'conservacion_total',
          'seleccion',
          'eliminacion'
        )
      ),

      fundamento_normativo TEXT,
      nivel_confianza REAL,

      creado_en TEXT NOT NULL, tipo_regla TEXT DEFAULT 'manual', retencion_gestion INTEGER, retencion_central INTEGER,

      FOREIGN KEY (propuesta_id)
        REFERENCES trd_series_propuestas(id)
        ON DELETE CASCADE
    );
CREATE TABLE segtec_configuracion_dependencia (
      id TEXT PRIMARY KEY,

      id_dependencia INTEGER NOT NULL,

      version INTEGER NOT NULL DEFAULT 1,
      activa INTEGER DEFAULT 1,

      tipo_funcion TEXT,
      nivel_decisorio TEXT,

      recibe_solicitudes INTEGER DEFAULT 0,
      emite_actos INTEGER DEFAULT 0,
      produce_decisiones INTEGER DEFAULT 0,

      procesos_principales TEXT,
      tramites_frecuentes TEXT,
      tipo_decisiones TEXT,

      tipos_documentales TEXT,
      otros_documentos TEXT,
      descripcion_funcional TEXT,

      creado_por INTEGER,
      created_at TEXT NOT NULL
    );
CREATE TABLE segtec_formularios (
      id TEXT PRIMARY KEY,

      usuario_id INTEGER NOT NULL,

      numero INTEGER NOT NULL,

      descripcion TEXT,

      estado TEXT NOT NULL DEFAULT 'en_proceso',

      etapa_actual INTEGER NOT NULL DEFAULT 1,

      creado_en TEXT NOT NULL,
      actualizado_en TEXT, created_at TEXT, updated_at TEXT,

      FOREIGN KEY (usuario_id)
        REFERENCES usuarios(id)
        ON DELETE CASCADE
    );
CREATE TABLE segtec_propuestas_ai (
      id TEXT PRIMARY KEY,

      formulario_id TEXT NOT NULL,

      tipo_propuesta TEXT NOT NULL,
      contenido TEXT NOT NULL,
      nivel_confianza REAL,

      estado TEXT DEFAULT 'generada',

      creado_en TEXT NOT NULL,

      FOREIGN KEY (formulario_id)
        REFERENCES segtec_formularios(id)
        ON DELETE CASCADE
    );
CREATE TABLE IF NOT EXISTS "segtec_validacion_tecnica_old" (
      actividad_id TEXT PRIMARY KEY,

      impacto_juridico_directo INTEGER,
      impacto_fiscal_contable INTEGER,
      genera_expediente_propio INTEGER,
      actividad_permanente INTEGER,
      soporte_principal TEXT,
      observacion_tecnica TEXT,

      created_at TEXT,
      updated_at TEXT,

      FOREIGN KEY (actividad_id)
        REFERENCES segtec_actividades(id)
        ON DELETE CASCADE
    );
CREATE TABLE segtec_validacion_tecnica (
  actividad_id TEXT PRIMARY KEY,
  impacto_juridico_directo INTEGER NOT NULL DEFAULT 0,
  impacto_fiscal_contable INTEGER NOT NULL DEFAULT 0,
  genera_expediente_propio INTEGER NOT NULL DEFAULT 0,
  actividad_permanente INTEGER NOT NULL DEFAULT 0,
  soporte_principal TEXT,
  observacion_tecnica TEXT,
  created_at TEXT,
  updated_at TEXT
);
CREATE TABLE IF NOT EXISTS "niveles" (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  nombre TEXT NOT NULL UNIQUE,
  orden INTEGER NOT NULL,
  estado INTEGER DEFAULT 1,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE IF NOT EXISTS "cargos" (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  nombre TEXT NOT NULL UNIQUE,
  estado INTEGER DEFAULT 1,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE IF NOT EXISTS "usuarios" (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nombre_completo TEXT NOT NULL,
    documento TEXT,
    email TEXT NOT NULL,
    username TEXT NOT NULL,
    password_hash TEXT NOT NULL,

    id_dependencia INTEGER NOT NULL,
    id_rol INTEGER NOT NULL,
    id_cargo INTEGER NOT NULL,
    id_nivel INTEGER NOT NULL,

    estado INTEGER DEFAULT 1,
    bloqueado INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,

    id_entidad INTEGER DEFAULT 1,
    es_master_admin INTEGER DEFAULT 0,
    es_responsable_dependencia INTEGER DEFAULT 0,

    FOREIGN KEY (id_dependencia) REFERENCES dependencias(id),
    FOREIGN KEY (id_rol) REFERENCES roles(id),
    FOREIGN KEY (id_cargo) REFERENCES cargos(id),
    FOREIGN KEY (id_nivel) REFERENCES niveles(id)
);
CREATE TABLE segtec_propuestas_ai_new (
    id TEXT PRIMARY KEY,
    actividad_id INTEGER NOT NULL,

    tipo_propuesta TEXT NOT NULL,
    contenido TEXT NOT NULL,
    nivel_confianza REAL,

    estado TEXT DEFAULT 'generada',
    motor_version TEXT,

    creado_en TEXT NOT NULL,

    FOREIGN KEY (actividad_id)
      REFERENCES segtec_actividades(id)
      ON DELETE CASCADE
);
CREATE TABLE segtec_analisis_actividad (
    id TEXT PRIMARY KEY,
    actividad_id TEXT NOT NULL,

    serie_propuesta TEXT,
    retencion_gestion INTEGER,
    retencion_central INTEGER,
    disposicion_final TEXT,
    justificacion TEXT,

    motor_version TEXT,

    creado_en TEXT NOT NULL, subserie_propuesta TEXT,

    FOREIGN KEY (actividad_id)
        REFERENCES segtec_actividades(id)
        ON DELETE CASCADE
);
CREATE TABLE IF NOT EXISTS "segtec_caracterizacion" (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  actividad_id TEXT NOT NULL,
  volumen_mensual INTEGER,
  volumen_anual INTEGER,
  cargo_custodio TEXT,
  dependencia_custodia INTEGER,
  localizacion_actual TEXT,
  plazo_legal INTEGER,
  tiempo_real INTEGER,
  bloqueada INTEGER DEFAULT 0,
  fecha_creacion DATETIME DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX idx_trd_retencion_propuesta
    ON trd_reglas_retencion(propuesta_id);
CREATE INDEX idx_segtec_config_dependencia
    ON segtec_configuracion_dependencia(id_dependencia);
CREATE INDEX idx_segtec_form_usuario
    ON segtec_formularios(usuario_id);
CREATE INDEX idx_segtec_form_numero
    ON segtec_formularios(numero);
CREATE INDEX idx_segtec_propuestas_formulario
    ON segtec_propuestas_ai(formulario_id);
CREATE INDEX idx_segtec_propuestas_estado
    ON segtec_propuestas_ai(estado);
CREATE INDEX idx_segtec_analisis_actividad
ON segtec_analisis_actividad(actividad_id);
CREATE TABLE segtec_actividades (
  id TEXT PRIMARY KEY,

  dependencia_id TEXT NOT NULL,

  nombre TEXT,
  cargo_ejecutor TEXT,

  tipo_funcion TEXT,
  frecuencia TEXT,
  descripcion_funcional TEXT,

  impacto_juridico_directo INTEGER,
  impacto_fiscal_contable INTEGER,
  genera_expediente_propio INTEGER,
  actividad_permanente INTEGER,

  genera_documentos TEXT,
  formato_produccion TEXT,
  volumen_documental TEXT,
  responsable_custodia TEXT,
  norma_aplicable TEXT,
  dependencias_relacionadas TEXT,

  estado_general TEXT NOT NULL DEFAULT 'borrador',

  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
, requiere_otras_dependencias INTEGER DEFAULT 0, tiene_pasos_formales INTEGER DEFAULT 0, usuario_id INTEGER, proceso_id TEXT, documentos_generados TEXT, localizacion_documentos TEXT, plazo_legal TEXT, tiempo_ejecucion TEXT, recepcion_externa TEXT);
CREATE INDEX idx_segtec_actividades_usuario
ON segtec_actividades(usuario_id);
CREATE TABLE trd_series_propuestas (
      id TEXT PRIMARY KEY,

      actividad_id TEXT NOT NULL,

      nombre_serie TEXT NOT NULL,
      nombre_subserie TEXT,
      tipologia_documental TEXT,

      justificacion TEXT,
      confianza REAL,

      estado TEXT CHECK (
        estado IN (
          'propuesta',
          'en_revision',
          'aprobada',
          'rechazada',
          'incorporada'
        )
      ) DEFAULT 'propuesta',

      version_trd_id TEXT,
      aprobado_por TEXT,
      fecha_aprobacion TEXT,
      observaciones_revision TEXT,

      creado_en TEXT NOT NULL,

      FOREIGN KEY (actividad_id)
        REFERENCES segtec_actividades(id)
        ON DELETE CASCADE,

      FOREIGN KEY (version_trd_id)
        REFERENCES trd_versiones(id)
    );
CREATE INDEX idx_trd_actividad
    ON trd_series_propuestas(actividad_id);
CREATE INDEX idx_trd_estado
    ON trd_series_propuestas(estado);
