--
-- PostgreSQL database dump
--

\restrict ngGcijuW5edkRq2xtCcitIcXEcBqQiD0UJVqQjDbw9opD68wfKmHzbMu5sFneJc

-- Dumped from database version 18.3 (Postgres.app)
-- Dumped by pg_dump version 18.3 (Postgres.app)

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: actividades_funcionales; Type: TABLE; Schema: public; Owner: larsonagon
--

CREATE TABLE public.actividades_funcionales (
    id text NOT NULL,
    proceso_id text NOT NULL,
    nombre text NOT NULL,
    descripcion text,
    frecuencia text,
    inicia_por text,
    documento_generado text,
    documento_recibido text,
    conforma_expediente integer DEFAULT 0,
    soporte text,
    continuidad_proceso text,
    creado_por text,
    fecha_creacion text,
    CONSTRAINT actividades_funcionales_frecuencia_check CHECK ((frecuencia = ANY (ARRAY['diaria'::text, 'semanal'::text, 'mensual'::text, 'ocasional'::text, 'segun_solicitud'::text]))),
    CONSTRAINT actividades_funcionales_inicia_por_check CHECK ((inicia_por = ANY (ARRAY['solicitud_verbal'::text, 'documento_fisico'::text, 'correo_electronico'::text, 'sistema_informacion'::text, 'acto_administrativo'::text, 'otro'::text]))),
    CONSTRAINT actividades_funcionales_soporte_check CHECK ((soporte = ANY (ARRAY['fisico'::text, 'digital'::text, 'ambos'::text])))
);


ALTER TABLE public.actividades_funcionales OWNER TO larsonagon;

--
-- Name: auditoria_dependencias; Type: TABLE; Schema: public; Owner: larsonagon
--

CREATE TABLE public.auditoria_dependencias (
    id integer NOT NULL,
    actor_id integer NOT NULL,
    dependencia_afectada_id integer NOT NULL,
    accion text NOT NULL,
    detalle_json text,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.auditoria_dependencias OWNER TO larsonagon;

--
-- Name: auditoria_dependencias_id_seq; Type: SEQUENCE; Schema: public; Owner: larsonagon
--

CREATE SEQUENCE public.auditoria_dependencias_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.auditoria_dependencias_id_seq OWNER TO larsonagon;

--
-- Name: auditoria_dependencias_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: larsonagon
--

ALTER SEQUENCE public.auditoria_dependencias_id_seq OWNED BY public.auditoria_dependencias.id;


--
-- Name: auditoria_roles; Type: TABLE; Schema: public; Owner: larsonagon
--

CREATE TABLE public.auditoria_roles (
    id integer NOT NULL,
    actor_id integer NOT NULL,
    rol_afectado_id integer NOT NULL,
    accion text NOT NULL,
    detalle_json text,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.auditoria_roles OWNER TO larsonagon;

--
-- Name: auditoria_roles_id_seq; Type: SEQUENCE; Schema: public; Owner: larsonagon
--

CREATE SEQUENCE public.auditoria_roles_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.auditoria_roles_id_seq OWNER TO larsonagon;

--
-- Name: auditoria_roles_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: larsonagon
--

ALTER SEQUENCE public.auditoria_roles_id_seq OWNED BY public.auditoria_roles.id;


--
-- Name: auditoria_usuarios; Type: TABLE; Schema: public; Owner: larsonagon
--

CREATE TABLE public.auditoria_usuarios (
    id integer NOT NULL,
    actor_id integer NOT NULL,
    usuario_afectado_id integer NOT NULL,
    accion text NOT NULL,
    detalle_json text,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.auditoria_usuarios OWNER TO larsonagon;

--
-- Name: auditoria_usuarios_id_seq; Type: SEQUENCE; Schema: public; Owner: larsonagon
--

CREATE SEQUENCE public.auditoria_usuarios_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.auditoria_usuarios_id_seq OWNER TO larsonagon;

--
-- Name: auditoria_usuarios_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: larsonagon
--

ALTER SEQUENCE public.auditoria_usuarios_id_seq OWNED BY public.auditoria_usuarios.id;


--
-- Name: cargos; Type: TABLE; Schema: public; Owner: larsonagon
--

CREATE TABLE public.cargos (
    id integer NOT NULL,
    nombre text NOT NULL,
    estado integer DEFAULT 1,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.cargos OWNER TO larsonagon;

--
-- Name: cargos_id_seq; Type: SEQUENCE; Schema: public; Owner: larsonagon
--

CREATE SEQUENCE public.cargos_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.cargos_id_seq OWNER TO larsonagon;

--
-- Name: cargos_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: larsonagon
--

ALTER SEQUENCE public.cargos_id_seq OWNED BY public.cargos.id;


--
-- Name: configuracion_entidad; Type: TABLE; Schema: public; Owner: larsonagon
--

CREATE TABLE public.configuracion_entidad (
    id integer NOT NULL,
    id_entidad integer NOT NULL,
    nombre_publico text,
    logo_url text,
    color_primario text DEFAULT '#1E3A8A'::text,
    color_secundario text DEFAULT '#3B82F6'::text,
    color_sidebar text DEFAULT '#0F172A'::text,
    footer_texto text,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.configuracion_entidad OWNER TO larsonagon;

--
-- Name: configuracion_entidad_id_seq; Type: SEQUENCE; Schema: public; Owner: larsonagon
--

CREATE SEQUENCE public.configuracion_entidad_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.configuracion_entidad_id_seq OWNER TO larsonagon;

--
-- Name: configuracion_entidad_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: larsonagon
--

ALTER SEQUENCE public.configuracion_entidad_id_seq OWNED BY public.configuracion_entidad.id;


--
-- Name: dependencias; Type: TABLE; Schema: public; Owner: larsonagon
--

CREATE TABLE public.dependencias (
    id integer NOT NULL,
    nombre text NOT NULL,
    codigo text,
    descripcion text,
    id_padre integer,
    nivel integer DEFAULT 1,
    activa integer DEFAULT 1,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone
);


ALTER TABLE public.dependencias OWNER TO larsonagon;

--
-- Name: dependencias_id_seq; Type: SEQUENCE; Schema: public; Owner: larsonagon
--

CREATE SEQUENCE public.dependencias_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.dependencias_id_seq OWNER TO larsonagon;

--
-- Name: dependencias_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: larsonagon
--

ALTER SEQUENCE public.dependencias_id_seq OWNED BY public.dependencias.id;


--
-- Name: entidades; Type: TABLE; Schema: public; Owner: larsonagon
--

CREATE TABLE public.entidades (
    id integer NOT NULL,
    nombre text NOT NULL,
    subdominio text,
    nit text,
    estado integer DEFAULT 1,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.entidades OWNER TO larsonagon;

--
-- Name: entidades_id_seq; Type: SEQUENCE; Schema: public; Owner: larsonagon
--

CREATE SEQUENCE public.entidades_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.entidades_id_seq OWNER TO larsonagon;

--
-- Name: entidades_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: larsonagon
--

ALTER SEQUENCE public.entidades_id_seq OWNED BY public.entidades.id;


--
-- Name: macrofunciones; Type: TABLE; Schema: public; Owner: larsonagon
--

CREATE TABLE public.macrofunciones (
    id text NOT NULL,
    codigo text NOT NULL,
    nombre text NOT NULL,
    descripcion text,
    tipo text,
    activo integer DEFAULT 1,
    CONSTRAINT macrofunciones_tipo_check CHECK ((tipo = ANY (ARRAY['misional'::text, 'apoyo'::text, 'control'::text, 'estrategica'::text])))
);


ALTER TABLE public.macrofunciones OWNER TO larsonagon;

--
-- Name: niveles; Type: TABLE; Schema: public; Owner: larsonagon
--

CREATE TABLE public.niveles (
    id integer NOT NULL,
    nombre text NOT NULL,
    orden integer NOT NULL,
    estado integer DEFAULT 1,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.niveles OWNER TO larsonagon;

--
-- Name: niveles_id_seq; Type: SEQUENCE; Schema: public; Owner: larsonagon
--

CREATE SEQUENCE public.niveles_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.niveles_id_seq OWNER TO larsonagon;

--
-- Name: niveles_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: larsonagon
--

ALTER SEQUENCE public.niveles_id_seq OWNED BY public.niveles.id;


--
-- Name: procesos; Type: TABLE; Schema: public; Owner: larsonagon
--

CREATE TABLE public.procesos (
    id text NOT NULL,
    subfuncion_id text NOT NULL,
    nombre text NOT NULL,
    descripcion text,
    estado text DEFAULT 'propuesto'::text,
    propuesto_por text,
    fecha_propuesta text,
    aprobado_por text,
    fecha_aprobacion text,
    CONSTRAINT procesos_estado_check CHECK ((estado = ANY (ARRAY['propuesto'::text, 'en_revision'::text, 'aprobado'::text, 'rechazado'::text])))
);


ALTER TABLE public.procesos OWNER TO larsonagon;

--
-- Name: refresh_tokens; Type: TABLE; Schema: public; Owner: larsonagon
--

CREATE TABLE public.refresh_tokens (
    id integer NOT NULL,
    user_id integer NOT NULL,
    token text NOT NULL,
    expires_at timestamp without time zone NOT NULL,
    revoked integer DEFAULT 0,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.refresh_tokens OWNER TO larsonagon;

--
-- Name: refresh_tokens_id_seq; Type: SEQUENCE; Schema: public; Owner: larsonagon
--

CREATE SEQUENCE public.refresh_tokens_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.refresh_tokens_id_seq OWNER TO larsonagon;

--
-- Name: refresh_tokens_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: larsonagon
--

ALTER SEQUENCE public.refresh_tokens_id_seq OWNED BY public.refresh_tokens.id;


--
-- Name: roles; Type: TABLE; Schema: public; Owner: larsonagon
--

CREATE TABLE public.roles (
    id integer NOT NULL,
    nombre text NOT NULL,
    descripcion text,
    nivel_acceso integer NOT NULL,
    activo integer DEFAULT 1,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.roles OWNER TO larsonagon;

--
-- Name: roles_id_seq; Type: SEQUENCE; Schema: public; Owner: larsonagon
--

CREATE SEQUENCE public.roles_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.roles_id_seq OWNER TO larsonagon;

--
-- Name: roles_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: larsonagon
--

ALTER SEQUENCE public.roles_id_seq OWNED BY public.roles.id;


--
-- Name: segtec_actividades; Type: TABLE; Schema: public; Owner: larsonagon
--

CREATE TABLE public.segtec_actividades (
    id text NOT NULL,
    dependencia_id integer NOT NULL,
    nombre text,
    cargo_ejecutor text,
    tipo_funcion text,
    frecuencia text,
    descripcion_funcional text,
    impacto_juridico_directo boolean,
    impacto_fiscal_contable boolean,
    genera_expediente_propio boolean,
    actividad_permanente boolean,
    genera_documentos text,
    formato_produccion text,
    volumen_documental text,
    responsable_custodia text,
    norma_aplicable text,
    dependencias_relacionadas text,
    estado_general text DEFAULT 'borrador'::text NOT NULL,
    created_at text NOT NULL,
    updated_at text NOT NULL,
    requiere_otras_dependencias integer DEFAULT 0,
    tiene_pasos_formales integer DEFAULT 0,
    usuario_id integer,
    proceso_id text,
    documentos_generados text,
    localizacion_documentos text,
    plazo_legal text,
    tiempo_ejecucion text,
    recepcion_externa text,
    volumen_categoria text,
    volumen_anual_personalizado integer,
    custodia_tipo text,
    cargo_custodia text,
    dependencia_custodia integer,
    localizacion_tipo text,
    localizacion_otro text,
    tiene_plazo integer DEFAULT 0
);


ALTER TABLE public.segtec_actividades OWNER TO larsonagon;

--
-- Name: segtec_analisis_actividad; Type: TABLE; Schema: public; Owner: larsonagon
--

CREATE TABLE public.segtec_analisis_actividad (
    id text NOT NULL,
    actividad_id text NOT NULL,
    serie_propuesta text,
    subserie_propuesta text,
    retencion_gestion integer,
    retencion_central integer,
    disposicion_final text,
    justificacion text,
    motor_version text,
    creado_en timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.segtec_analisis_actividad OWNER TO larsonagon;

--
-- Name: segtec_caracterizacion; Type: TABLE; Schema: public; Owner: larsonagon
--

CREATE TABLE public.segtec_caracterizacion (
    id integer NOT NULL,
    actividad_id text NOT NULL,
    volumen_mensual integer,
    volumen_anual integer,
    cargo_custodio text,
    dependencia_custodia integer,
    localizacion_actual text,
    plazo_legal integer,
    tiempo_real integer,
    bloqueada integer DEFAULT 0,
    fecha_creacion timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.segtec_caracterizacion OWNER TO larsonagon;

--
-- Name: segtec_caracterizacion_id_seq; Type: SEQUENCE; Schema: public; Owner: larsonagon
--

CREATE SEQUENCE public.segtec_caracterizacion_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.segtec_caracterizacion_id_seq OWNER TO larsonagon;

--
-- Name: segtec_caracterizacion_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: larsonagon
--

ALTER SEQUENCE public.segtec_caracterizacion_id_seq OWNED BY public.segtec_caracterizacion.id;


--
-- Name: segtec_configuracion_dependencia; Type: TABLE; Schema: public; Owner: larsonagon
--

CREATE TABLE public.segtec_configuracion_dependencia (
    id text NOT NULL,
    id_dependencia integer NOT NULL,
    version integer DEFAULT 1 NOT NULL,
    activa integer DEFAULT 1,
    tipo_funcion text,
    nivel_decisorio text,
    recibe_solicitudes integer DEFAULT 0,
    emite_actos integer DEFAULT 0,
    produce_decisiones integer DEFAULT 0,
    procesos_principales text,
    tramites_frecuentes text,
    tipo_decisiones text,
    tipos_documentales text,
    otros_documentos text,
    descripcion_funcional text,
    creado_por integer,
    created_at text NOT NULL
);


ALTER TABLE public.segtec_configuracion_dependencia OWNER TO larsonagon;

--
-- Name: segtec_formularios; Type: TABLE; Schema: public; Owner: larsonagon
--

CREATE TABLE public.segtec_formularios (
    id text NOT NULL,
    usuario_id integer NOT NULL,
    numero integer NOT NULL,
    descripcion text,
    estado text DEFAULT 'en_proceso'::text NOT NULL,
    etapa_actual integer DEFAULT 1 NOT NULL,
    creado_en text NOT NULL,
    actualizado_en text,
    created_at text,
    updated_at text
);


ALTER TABLE public.segtec_formularios OWNER TO larsonagon;

--
-- Name: segtec_propuestas_ai; Type: TABLE; Schema: public; Owner: larsonagon
--

CREATE TABLE public.segtec_propuestas_ai (
    id text NOT NULL,
    formulario_id text NOT NULL,
    tipo_propuesta text NOT NULL,
    contenido text NOT NULL,
    nivel_confianza real,
    estado text DEFAULT 'generada'::text,
    creado_en text NOT NULL
);


ALTER TABLE public.segtec_propuestas_ai OWNER TO larsonagon;

--
-- Name: segtec_validacion_tecnica; Type: TABLE; Schema: public; Owner: larsonagon
--

CREATE TABLE public.segtec_validacion_tecnica (
    actividad_id text NOT NULL,
    impacto_juridico_directo integer DEFAULT 0 NOT NULL,
    impacto_fiscal_contable integer DEFAULT 0 NOT NULL,
    genera_expediente_propio integer DEFAULT 0 NOT NULL,
    actividad_permanente integer DEFAULT 0 NOT NULL,
    soporte_principal text,
    observacion_tecnica text,
    created_at text,
    updated_at text
);


ALTER TABLE public.segtec_validacion_tecnica OWNER TO larsonagon;

--
-- Name: series; Type: TABLE; Schema: public; Owner: larsonagon
--

CREATE TABLE public.series (
    id text NOT NULL,
    trd_version_id text NOT NULL,
    macrofuncion_id text,
    subfuncion_id text,
    nombre text NOT NULL,
    codigo text,
    tiempo_gestion integer,
    tiempo_central integer,
    disposicion_final text,
    CONSTRAINT series_disposicion_final_check CHECK ((disposicion_final = ANY (ARRAY['CT'::text, 'EL'::text, 'ST'::text, 'MT'::text])))
);


ALTER TABLE public.series OWNER TO larsonagon;

--
-- Name: subfunciones; Type: TABLE; Schema: public; Owner: larsonagon
--

CREATE TABLE public.subfunciones (
    id text NOT NULL,
    macrofuncion_id text NOT NULL,
    nombre text NOT NULL,
    descripcion text,
    activo integer DEFAULT 1,
    fecha_creacion text,
    creado_por text
);


ALTER TABLE public.subfunciones OWNER TO larsonagon;

--
-- Name: subseries; Type: TABLE; Schema: public; Owner: larsonagon
--

CREATE TABLE public.subseries (
    id text NOT NULL,
    serie_id text NOT NULL,
    nombre text NOT NULL,
    codigo text,
    tiempo_gestion integer,
    tiempo_central integer,
    disposicion_final text,
    CONSTRAINT subseries_disposicion_final_check CHECK ((disposicion_final = ANY (ARRAY['CT'::text, 'EL'::text, 'ST'::text, 'MT'::text])))
);


ALTER TABLE public.subseries OWNER TO larsonagon;

--
-- Name: sync_events; Type: TABLE; Schema: public; Owner: larsonagon
--

CREATE TABLE public.sync_events (
    id integer NOT NULL,
    user_id integer NOT NULL,
    type text NOT NULL,
    entity_id text,
    payload text,
    created_at text NOT NULL
);


ALTER TABLE public.sync_events OWNER TO larsonagon;

--
-- Name: sync_events_id_seq; Type: SEQUENCE; Schema: public; Owner: larsonagon
--

CREATE SEQUENCE public.sync_events_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.sync_events_id_seq OWNER TO larsonagon;

--
-- Name: sync_events_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: larsonagon
--

ALTER SEQUENCE public.sync_events_id_seq OWNED BY public.sync_events.id;


--
-- Name: tipologias; Type: TABLE; Schema: public; Owner: larsonagon
--

CREATE TABLE public.tipologias (
    id text NOT NULL,
    subserie_id text NOT NULL,
    nombre text NOT NULL,
    descripcion text
);


ALTER TABLE public.tipologias OWNER TO larsonagon;

--
-- Name: trd_series_propuestas; Type: TABLE; Schema: public; Owner: larsonagon
--

CREATE TABLE public.trd_series_propuestas (
    id text NOT NULL,
    actividad_id text NOT NULL,
    nombre_serie text NOT NULL,
    nombre_subserie text,
    tipologia_documental text,
    justificacion text,
    confianza real,
    estado text DEFAULT 'propuesta'::text,
    version_trd_id text,
    aprobado_por text,
    fecha_aprobacion text,
    observaciones_revision text,
    creado_en text NOT NULL,
    CONSTRAINT trd_series_propuestas_estado_check CHECK ((estado = ANY (ARRAY['propuesta'::text, 'en_revision'::text, 'aprobada'::text, 'rechazada'::text, 'incorporada'::text])))
);


ALTER TABLE public.trd_series_propuestas OWNER TO larsonagon;

--
-- Name: trd_versiones; Type: TABLE; Schema: public; Owner: larsonagon
--

CREATE TABLE public.trd_versiones (
    id text NOT NULL,
    nombre_version text NOT NULL,
    modo_creacion text,
    fecha_inicio_vigencia text,
    fecha_fin_vigencia text,
    estado text,
    acto_administrativo text,
    numero_acto text,
    fecha_acto text,
    observaciones text,
    CONSTRAINT trd_versiones_estado_check CHECK ((estado = ANY (ARRAY['borrador'::text, 'en_revision'::text, 'aprobada'::text, 'derogada'::text]))),
    CONSTRAINT trd_versiones_modo_creacion_check CHECK ((modo_creacion = ANY (ARRAY['manual'::text, 'asistido'::text, 'mixto'::text])))
);


ALTER TABLE public.trd_versiones OWNER TO larsonagon;

--
-- Name: usuarios; Type: TABLE; Schema: public; Owner: larsonagon
--

CREATE TABLE public.usuarios (
    id integer NOT NULL,
    nombre_completo text NOT NULL,
    documento text,
    email text NOT NULL,
    username text NOT NULL,
    password_hash text NOT NULL,
    id_dependencia integer NOT NULL,
    id_rol integer NOT NULL,
    id_cargo integer NOT NULL,
    id_nivel integer NOT NULL,
    estado integer DEFAULT 1,
    bloqueado boolean DEFAULT false,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    id_entidad integer DEFAULT 1,
    es_master_admin boolean DEFAULT false,
    es_responsable_dependencia boolean DEFAULT false
);


ALTER TABLE public.usuarios OWNER TO larsonagon;

--
-- Name: usuarios_id_seq; Type: SEQUENCE; Schema: public; Owner: larsonagon
--

CREATE SEQUENCE public.usuarios_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.usuarios_id_seq OWNER TO larsonagon;

--
-- Name: usuarios_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: larsonagon
--

ALTER SEQUENCE public.usuarios_id_seq OWNED BY public.usuarios.id;


--
-- Name: auditoria_dependencias id; Type: DEFAULT; Schema: public; Owner: larsonagon
--

ALTER TABLE ONLY public.auditoria_dependencias ALTER COLUMN id SET DEFAULT nextval('public.auditoria_dependencias_id_seq'::regclass);


--
-- Name: auditoria_roles id; Type: DEFAULT; Schema: public; Owner: larsonagon
--

ALTER TABLE ONLY public.auditoria_roles ALTER COLUMN id SET DEFAULT nextval('public.auditoria_roles_id_seq'::regclass);


--
-- Name: auditoria_usuarios id; Type: DEFAULT; Schema: public; Owner: larsonagon
--

ALTER TABLE ONLY public.auditoria_usuarios ALTER COLUMN id SET DEFAULT nextval('public.auditoria_usuarios_id_seq'::regclass);


--
-- Name: cargos id; Type: DEFAULT; Schema: public; Owner: larsonagon
--

ALTER TABLE ONLY public.cargos ALTER COLUMN id SET DEFAULT nextval('public.cargos_id_seq'::regclass);


--
-- Name: configuracion_entidad id; Type: DEFAULT; Schema: public; Owner: larsonagon
--

ALTER TABLE ONLY public.configuracion_entidad ALTER COLUMN id SET DEFAULT nextval('public.configuracion_entidad_id_seq'::regclass);


--
-- Name: dependencias id; Type: DEFAULT; Schema: public; Owner: larsonagon
--

ALTER TABLE ONLY public.dependencias ALTER COLUMN id SET DEFAULT nextval('public.dependencias_id_seq'::regclass);


--
-- Name: entidades id; Type: DEFAULT; Schema: public; Owner: larsonagon
--

ALTER TABLE ONLY public.entidades ALTER COLUMN id SET DEFAULT nextval('public.entidades_id_seq'::regclass);


--
-- Name: niveles id; Type: DEFAULT; Schema: public; Owner: larsonagon
--

ALTER TABLE ONLY public.niveles ALTER COLUMN id SET DEFAULT nextval('public.niveles_id_seq'::regclass);


--
-- Name: refresh_tokens id; Type: DEFAULT; Schema: public; Owner: larsonagon
--

ALTER TABLE ONLY public.refresh_tokens ALTER COLUMN id SET DEFAULT nextval('public.refresh_tokens_id_seq'::regclass);


--
-- Name: roles id; Type: DEFAULT; Schema: public; Owner: larsonagon
--

ALTER TABLE ONLY public.roles ALTER COLUMN id SET DEFAULT nextval('public.roles_id_seq'::regclass);


--
-- Name: segtec_caracterizacion id; Type: DEFAULT; Schema: public; Owner: larsonagon
--

ALTER TABLE ONLY public.segtec_caracterizacion ALTER COLUMN id SET DEFAULT nextval('public.segtec_caracterizacion_id_seq'::regclass);


--
-- Name: sync_events id; Type: DEFAULT; Schema: public; Owner: larsonagon
--

ALTER TABLE ONLY public.sync_events ALTER COLUMN id SET DEFAULT nextval('public.sync_events_id_seq'::regclass);


--
-- Name: usuarios id; Type: DEFAULT; Schema: public; Owner: larsonagon
--

ALTER TABLE ONLY public.usuarios ALTER COLUMN id SET DEFAULT nextval('public.usuarios_id_seq'::regclass);


--
-- Data for Name: actividades_funcionales; Type: TABLE DATA; Schema: public; Owner: larsonagon
--

COPY public.actividades_funcionales (id, proceso_id, nombre, descripcion, frecuencia, inicia_por, documento_generado, documento_recibido, conforma_expediente, soporte, continuidad_proceso, creado_por, fecha_creacion) FROM stdin;
\.


--
-- Data for Name: auditoria_dependencias; Type: TABLE DATA; Schema: public; Owner: larsonagon
--

COPY public.auditoria_dependencias (id, actor_id, dependencia_afectada_id, accion, detalle_json, created_at) FROM stdin;
1	1	1	EDITAR_DEPENDENCIA	{"nombre":"Dirección"}	2026-02-24 04:27:09
2	1	1	EDITAR_DEPENDENCIA	{"nombre":"Despacho alcalde"}	2026-03-04 02:40:46
3	1	2	CREAR_DEPENDENCIA	{"nombre":"Oficina jurídica"}	2026-03-04 02:40:56
4	1	3	CREAR_DEPENDENCIA	{"nombre":"Oficina de control interno"}	2026-03-04 02:41:09
5	1	4	CREAR_DEPENDENCIA	{"nombre":"Secretaría de gobierno"}	2026-03-04 02:41:17
7	1	5	EDITAR_DEPENDENCIA	{"nombre":"Secretaría de hacienda1"}	2026-03-12 17:49:59.54779
8	1	5	EDITAR_DEPENDENCIA	{"nombre":"Secretaría de hacienda"}	2026-03-12 17:50:08.273163
9	1	6	EDITAR_DEPENDENCIA	{"nombre":"Gerencia de planeación y obras"}	2026-03-12 17:51:11.75912
11	1	7	EDITAR_DEPENDENCIA	{"nombre":"Departamento administrativo de salud de Aguachica (DASA1)"}	2026-03-12 17:55:09.7546
12	1	7	EDITAR_DEPENDENCIA	{"nombre":"Departamento administrativo de salud de Aguachica (DASA)"}	2026-03-12 17:55:14.460017
13	1	8	CREAR_DEPENDENCIA	{"nombre":"Secretaria de educación"}	2026-03-12 17:57:54.23867
\.


--
-- Data for Name: auditoria_roles; Type: TABLE DATA; Schema: public; Owner: larsonagon
--

COPY public.auditoria_roles (id, actor_id, rol_afectado_id, accion, detalle_json, created_at) FROM stdin;
1	1	3	EDITAR_ROL	{"nombre":"Archivista"}	2026-03-04 20:05:27
2	1	3	EDITAR_ROL	{"nombre":"Archivista"}	2026-03-04 20:05:36
3	1	5	EDITAR_ROL	{"nombre":"Técnico"}	2026-03-04 20:06:16
4	1	6	EDITAR_ROL	{"nombre":"Auxiliar"}	2026-03-04 20:06:24
5	1	4	EDITAR_ROL	{"nombre":"Profesional"}	2026-03-04 20:07:00
6	1	4	EDITAR_ROL	{"nombre":"Profesional 1"}	2026-03-04 20:07:27
7	1	5	EDITAR_ROL	{"nombre":"Profesional 2"}	2026-03-04 20:07:40
8	1	6	EDITAR_ROL	{"nombre":"Técnico"}	2026-03-04 20:07:47
9	1	6	EDITAR_ROL	{"nombre":"Técnico"}	2026-03-04 20:07:52
10	1	7	CREAR_ROL	{"nombre":"Técnico 1","nivel_acceso":50}	2026-03-12 18:10:18.914553
\.


--
-- Data for Name: auditoria_usuarios; Type: TABLE DATA; Schema: public; Owner: larsonagon
--

COPY public.auditoria_usuarios (id, actor_id, usuario_afectado_id, accion, detalle_json, created_at) FROM stdin;
3	3	4	CREAR_USUARIO	{"username":"caritoalqui","id_rol":4,"id_dependencia":1,"id_cargo":2,"id_nivel":3}	2026-03-02 23:49:23
14	3	4	EDITAR_USUARIO	{"email":"caritoalqui@gmail.com","id_dependencia":2,"id_rol":4,"id_cargo":2,"id_nivel":3,"estado":1,"bloqueado":0,"password_cambiado":true}	2026-03-11 04:00:20
2	1	3	CREAR_USUARIO	{"username":"larsonagon","id_rol":1,"id_dependencia":1,"id_cargo":1,"id_nivel":6}	2026-03-02 23:47:21
4	1	5	CREAR_USUARIO	{"username":"pepitoperez","id_rol":5,"id_dependencia":1,"id_cargo":2,"id_nivel":3}	2026-03-04 20:17:21
5	1	4	EDITAR_USUARIO	{"email":"caritoalqui@gmail.com","id_dependencia":2,"id_rol":4,"id_cargo":2,"id_nivel":3,"estado":1,"bloqueado":0,"password_cambiado":false}	2026-03-05 03:26:12
6	1	3	EDITAR_USUARIO	{"email":"larsonagon@gmail.com","id_dependencia":1,"id_rol":1,"id_cargo":1,"id_nivel":6,"estado":1,"bloqueado":0,"password_cambiado":true}	2026-03-06 00:53:01
7	1	1	EDITAR_USUARIO	{"email":"super@sipad.local","id_dependencia":1,"id_rol":1,"id_cargo":1,"id_nivel":1,"estado":1,"bloqueado":0,"password_cambiado":false}	2026-03-06 01:41:57
8	1	3	EDITAR_USUARIO	{"email":"larsonagon@gmail.com","id_dependencia":1,"id_rol":1,"id_cargo":1,"id_nivel":6,"estado":1,"bloqueado":0,"password_cambiado":false}	2026-03-06 01:42:13
9	1	3	EDITAR_USUARIO	{"email":"larsonagon@gmail.com","id_dependencia":2,"id_rol":1,"id_cargo":1,"id_nivel":6,"estado":1,"bloqueado":0,"password_cambiado":false}	2026-03-06 01:42:22
10	1	3	EDITAR_USUARIO	{"email":"larsonagon@gmail.com","id_dependencia":1,"id_rol":1,"id_cargo":1,"id_nivel":6,"estado":1,"bloqueado":0,"password_cambiado":false}	2026-03-06 01:42:28
11	1	1	CAMBIAR_PASSWORD	{"self_service":true}	2026-03-10 13:19:34
12	1	5	EDITAR_USUARIO	{"email":"pepito@gmail.com","id_dependencia":3,"id_rol":5,"id_cargo":2,"id_nivel":3,"estado":1,"bloqueado":0,"password_cambiado":false}	2026-03-10 21:41:37
13	1	3	EDITAR_USUARIO	{"email":"larsonagon@gmail.com","id_dependencia":1,"id_rol":1,"id_cargo":1,"id_nivel":1,"estado":1,"bloqueado":0,"password_cambiado":true}	2026-03-11 03:59:42
15	3	3	CAMBIAR_PASSWORD	{"self_service":true}	2026-03-12 18:03:23.690078
\.


--
-- Data for Name: cargos; Type: TABLE DATA; Schema: public; Owner: larsonagon
--

COPY public.cargos (id, nombre, estado, created_at) FROM stdin;
1	Administrador general	1	2026-03-01 14:52:08
2	Profesional universitario	1	2026-03-01 14:52:08
3	Secretario(a) de gobierno	1	2026-03-12 17:36:41.020382
\.


--
-- Data for Name: configuracion_entidad; Type: TABLE DATA; Schema: public; Owner: larsonagon
--

COPY public.configuracion_entidad (id, id_entidad, nombre_publico, logo_url, color_primario, color_secundario, color_sidebar, footer_texto, created_at) FROM stdin;
1	1	SIPAD Institucional	\N	#1E3A8A	#3B82F6	#0F172A	Plataforma SaaS SIPAD	2026-02-24 02:06:06
\.


--
-- Data for Name: dependencias; Type: TABLE DATA; Schema: public; Owner: larsonagon
--

COPY public.dependencias (id, nombre, codigo, descripcion, id_padre, nivel, activa, created_at, updated_at) FROM stdin;
1	Despacho alcalde	\N	\N	\N	1	1	2026-02-24 02:06:06	\N
2	Oficina jurídica	\N	\N	\N	1	1	2026-03-04 02:40:56	\N
3	Oficina de control interno	\N	\N	\N	1	1	2026-03-04 02:41:09	\N
4	Secretaría de gobierno	\N	\N	\N	1	1	2026-03-04 02:41:17	\N
5	Secretaría de hacienda	\N	\N	\N	1	1	2026-03-12 17:35:32.275964	\N
6	Gerencia de planeación y obras	\N	\N	\N	1	1	2026-03-12 17:48:23.572278	\N
7	Departamento administrativo de salud de Aguachica (DASA)	\N	\N	\N	1	1	2026-03-12 17:51:33.73041	\N
8	Secretaria de educación	\N	\N	\N	1	1	2026-03-12 17:57:54.23715	\N
\.


--
-- Data for Name: entidades; Type: TABLE DATA; Schema: public; Owner: larsonagon
--

COPY public.entidades (id, nombre, subdominio, nit, estado, created_at) FROM stdin;
1	Entidad Demo	demo	\N	1	2026-02-24 02:06:06
\.


--
-- Data for Name: macrofunciones; Type: TABLE DATA; Schema: public; Owner: larsonagon
--

COPY public.macrofunciones (id, codigo, nombre, descripcion, tipo, activo) FROM stdin;
\.


--
-- Data for Name: niveles; Type: TABLE DATA; Schema: public; Owner: larsonagon
--

COPY public.niveles (id, nombre, orden, estado, created_at) FROM stdin;
1	Directivo	100	1	2026-03-01 02:55:13
2	Asesor	90	1	2026-03-01 02:55:13
3	Profesional	80	1	2026-03-01 02:55:13
4	Técnico	60	1	2026-03-01 02:55:13
5	Operativo	40	1	2026-03-01 02:55:13
6	Prueba1	110	1	2026-03-01 15:15:43
7	Prueba2	120	1	2026-03-12 17:59:36.017042
\.


--
-- Data for Name: procesos; Type: TABLE DATA; Schema: public; Owner: larsonagon
--

COPY public.procesos (id, subfuncion_id, nombre, descripcion, estado, propuesto_por, fecha_propuesta, aprobado_por, fecha_aprobacion) FROM stdin;
\.


--
-- Data for Name: refresh_tokens; Type: TABLE DATA; Schema: public; Owner: larsonagon
--

COPY public.refresh_tokens (id, user_id, token, expires_at, revoked, created_at) FROM stdin;
1	1	65451229-b780-4676-99bb-fd4da57a100f	2026-03-03 02:13:07.648	0	2026-02-24 02:13:07.648
2	1	b4e1e416-325a-433c-b7bb-ca1092691600	2026-03-03 02:31:45.122	0	2026-02-24 02:31:45.122
3	1	911152a5-3f31-4f69-8c70-686b1a852fec	2026-03-03 02:53:17.013	0	2026-02-24 02:53:17.013
4	1	4772e5a9-3804-4976-bd82-0f77600aeff8	2026-03-03 02:55:11.276	0	2026-02-24 02:55:11.276
5	1	cd925ceb-60e2-4a03-abb4-d9348b3dfcd7	2026-03-03 03:53:52.667	0	2026-02-24 03:53:52.667
6	1	8e4f795e-d6b7-4f8e-a8cb-d64c24767eb8	2026-03-03 03:55:07.676	0	2026-02-24 03:55:07.676
7	1	41a63b2e-41d9-41be-ba90-fc8f857b9aaa	2026-03-03 04:11:11.385	0	2026-02-24 04:11:11.385
8	1	19bbf061-2a3f-4f42-86ce-0f3c09796515	2026-03-03 04:20:17.173	0	2026-02-24 04:20:17.173
9	1	fa101c69-10a8-4530-8787-7cb148eb3619	2026-03-03 04:38:36.895	0	2026-02-24 04:38:36.895
10	1	4b82e3eb-70c9-4695-8b78-fcb1cbeb15b5	2026-03-03 04:41:25.782	0	2026-02-24 04:41:25.782
11	1	03f14b0e-8f02-454b-bf63-4c342c941128	2026-03-03 05:15:48.723	0	2026-02-24 05:15:48.723
12	1	0951cb48-af29-411c-b617-da32f88b63a7	2026-03-03 12:40:25.401	0	2026-02-24 12:40:25.401
13	1	71542d74-5ecc-423a-ab57-7ce9092d5a11	2026-03-03 12:53:02.248	0	2026-02-24 12:53:02.248
14	1	94830b17-fe9e-45b6-a47b-846097855a25	2026-03-03 16:36:59.821	0	2026-02-24 16:36:59.821
15	1	5c1eab4f-efc5-424d-8b47-924b902231e7	2026-03-03 17:16:26.778	0	2026-02-24 17:16:26.778
16	1	97b3b658-9758-4815-b585-24aefba36fc3	2026-03-03 17:17:46.72	0	2026-02-24 17:17:46.72
17	1	7f26ded6-fe6f-44c4-97e1-0c634cc63f16	2026-03-03 19:35:11.846	0	2026-02-24 19:35:11.846
18	1	3d2f4a2b-bb8a-44ea-ab90-74e01c8dcf47	2026-03-03 20:41:31.869	0	2026-02-24 20:41:31.869
19	1	11f9484a-9519-4acc-9313-0fcd8ef71350	2026-03-04 03:12:32.14	0	2026-02-25 03:12:32.14
20	1	3c059aba-1810-48e9-bb19-faa1ce2580a8	2026-03-04 15:36:57.114	0	2026-02-25 15:36:57.114
21	1	fafb4ba3-8861-4a83-967d-03510bc681ef	2026-03-04 22:24:22.538	0	2026-02-25 22:24:22.538
22	1	cf9bbaa4-892e-48b5-9f1c-1ade2c622d11	2026-03-04 22:31:38.954	0	2026-02-25 22:31:38.954
23	1	1d38e466-c818-45d3-b3d7-518d7e3f13fb	2026-03-04 22:34:37.301	0	2026-02-25 22:34:37.301
24	1	fdb45c9f-0ae0-4708-b359-5cc8ccad7323	2026-03-04 22:48:05.939	0	2026-02-25 22:48:05.939
25	1	fa2c6b88-9381-488d-808a-fd8aab15cfea	2026-03-04 22:48:39.455	0	2026-02-25 22:48:39.455
26	1	d10a7ad1-ed4c-4622-b55a-e997d774cab4	2026-03-04 22:51:30.511	0	2026-02-25 22:51:30.511
27	1	7eea646e-0976-466e-b764-8e9053f9d272	2026-03-07 19:22:40.798	0	2026-02-28 19:22:40.798
28	1	75132d73-08ee-4265-997a-8fcc09f035d9	2026-03-07 19:50:23.89	0	2026-02-28 19:50:23.89
29	1	d6caad0f-1226-41f3-9a2d-5730b846edf4	2026-03-07 20:55:53.21	0	2026-02-28 20:55:53.21
30	1	50363acd-e19f-4351-94ea-382c825fa8a7	2026-03-07 20:56:33.376	0	2026-02-28 20:56:33.376
31	1	0aea43f1-e2d8-4aae-9b92-68e10f091646	2026-03-07 21:01:16.542	0	2026-02-28 21:01:16.542
32	1	761379a2-c26b-4c70-9092-b232ab7faf9f	2026-03-07 22:33:16.849	0	2026-02-28 22:33:16.849
33	1	64ad0a6e-99cb-4096-a1a5-fd3484505cb2	2026-03-07 22:33:53.49	0	2026-02-28 22:33:53.49
34	1	073065f8-dd86-4db1-b5df-091a7fd220ef	2026-03-07 22:41:05.709	0	2026-02-28 22:41:05.709
35	1	28af7c40-cf7a-45f8-a58d-9bd1b618a3a9	2026-03-07 22:42:50.939	0	2026-02-28 22:42:50.939
36	1	d749859e-b349-44d6-8c41-441a23f5b0d2	2026-03-07 23:28:00.647	0	2026-02-28 23:28:00.647
37	1	7430b63c-d0ad-46db-8193-b463f34c3e8e	2026-03-07 23:58:13.033	0	2026-02-28 23:58:13.033
38	1	5eb3c358-5d6f-4b46-bc18-365f83712d75	2026-03-08 00:06:25.952	0	2026-03-01 00:06:25.952
39	1	5a9a0783-6a13-43cf-993c-3deeac806731	2026-03-08 00:25:39.135	0	2026-03-01 00:25:39.135
40	1	57dbcccd-da2b-4b2a-922d-355113f5a00e	2026-03-08 02:42:06.995	0	2026-03-01 02:42:06.995
41	1	d529c4f6-06d2-4b0b-9358-1609edb4ce5a	2026-03-08 15:12:08.471	0	2026-03-01 15:12:08.471
42	1	195bdccb-d100-46a1-868d-1abd44130b48	2026-03-08 16:45:25.587	0	2026-03-01 16:45:25.587
43	1	4660aa48-c5d5-40f0-9b51-1d014e38115e	2026-03-09 13:18:23.184	0	2026-03-02 13:18:23.184
44	1	a0ff1c6c-4254-4dd3-9af8-808b0fdf4afc	2026-03-09 23:41:19.228	0	2026-03-02 23:41:19.228
45	1	cb936bc7-b9dc-4c14-9e48-af204e2bf057	2026-03-09 23:46:41.799	0	2026-03-02 23:46:41.799
46	3	75348669-56b5-4b9b-9d03-d21416271f35	2026-03-09 23:47:42.732	0	2026-03-02 23:47:42.732
47	4	2011c441-9ce6-4f4d-a255-f547e22bbb23	2026-03-09 23:49:37.629	0	2026-03-02 23:49:37.629
48	1	2da72472-7989-42cf-aca5-ffa9e6de28f7	2026-03-09 23:50:04.856	0	2026-03-02 23:50:04.856
49	4	2370a822-7a65-4380-bc26-377b12df8871	2026-03-10 00:04:20.091	0	2026-03-03 00:04:20.091
50	1	0630a5c0-4e2b-4d84-be8f-979334b0471d	2026-03-10 00:07:04.498	0	2026-03-03 00:07:04.498
51	1	ecfbda50-b318-4f49-b308-b890ae2fb6a1	2026-03-10 00:22:13.346	0	2026-03-03 00:22:13.346
52	1	39f309f2-f685-479e-bef2-a192852aadcc	2026-03-10 01:37:23.515	0	2026-03-03 01:37:23.515
53	1	ec70ad6d-f7b8-4e64-9411-649df45641d2	2026-03-10 12:56:46.607	0	2026-03-03 12:56:46.607
54	1	8dd5a4b3-999f-4014-aa47-bc8d2558e798	2026-03-10 12:59:03.821	0	2026-03-03 12:59:03.821
55	1	cf85d363-9e62-408d-9800-51644044a5d5	2026-03-10 13:13:02.748	0	2026-03-03 13:13:02.748
56	1	14384dcf-633b-495a-ad9b-97515188c60f	2026-03-10 13:14:38.527	0	2026-03-03 13:14:38.527
57	1	faa26413-0311-4325-bae5-9ee05b62a4cf	2026-03-10 13:45:21.424	0	2026-03-03 13:45:21.424
58	1	ca6df1a3-5a25-4644-bda3-b4908a50c1a5	2026-03-10 20:13:32.502	0	2026-03-03 20:13:32.502
59	1	d2e7cb23-5e79-43d7-b313-23206db47356	2026-03-10 22:02:28.992	0	2026-03-03 22:02:28.992
60	1	5b2ba8e2-f597-45d7-8f67-4f0f84f44250	2026-03-10 23:08:31.646	0	2026-03-03 23:08:31.646
61	1	1071b337-655a-4933-b1b9-12fc2b1375cc	2026-03-11 01:04:29.336	0	2026-03-04 01:04:29.336
62	1	26384cbf-8655-46c2-8c34-c214cb12e795	2026-03-11 01:17:58.219	0	2026-03-04 01:17:58.219
63	1	9b450f0c-5b3c-4517-93a5-60189e69c70b	2026-03-11 02:09:42.064	0	2026-03-04 02:09:42.064
64	1	f3123767-66bd-42d9-979b-5163e38bdc33	2026-03-11 03:25:54.691	0	2026-03-04 03:25:54.691
65	1	084550d0-a5da-468c-9f7b-cce01de61832	2026-03-11 03:52:16.57	0	2026-03-04 03:52:16.57
66	1	af1fcaef-5fb7-481a-aed1-60efb3479623	2026-03-11 17:28:13.068	0	2026-03-04 17:28:13.068
67	1	e22fe8a9-2519-406c-896b-f2728948b623	2026-03-11 18:11:54.61	0	2026-03-04 18:11:54.61
68	1	4d72d05a-ff16-405a-885a-91405a3da856	2026-03-11 18:44:27.645	0	2026-03-04 18:44:27.645
69	5	a378469b-7298-4185-bc48-8edf7ba906fe	2026-03-11 20:17:31.926	0	2026-03-04 20:17:31.926
70	1	2b53385d-c552-4c08-a45c-c531c7d313a6	2026-03-11 20:19:07.985	0	2026-03-04 20:19:07.985
71	1	a60dc505-799c-4d3d-b9f1-0aa130082efd	2026-03-11 20:41:58.925	0	2026-03-04 20:41:58.925
72	1	7501848c-f782-4831-a310-7409afdca58a	2026-03-11 20:49:28.704	0	2026-03-04 20:49:28.704
73	1	bec1bf1e-88a7-40dc-b468-a42c117526d6	2026-03-11 20:52:26.008	0	2026-03-04 20:52:26.008
74	1	7dbb6bfb-0b1d-4c5a-8b09-5faab1c0fedf	2026-03-11 20:52:59.312	0	2026-03-04 20:52:59.312
75	1	d18be9a4-ab67-4a4f-ad0f-c0350b76a3b7	2026-03-11 20:54:03.225	0	2026-03-04 20:54:03.225
76	1	f16286c8-c57b-4a61-b06a-f255eee4bbf7	2026-03-11 20:55:47.117	0	2026-03-04 20:55:47.117
77	1	3d664565-3c71-40d3-8a5f-4718931b0033	2026-03-11 20:57:21.729	0	2026-03-04 20:57:21.729
78	1	7ed8f7d8-a194-4db4-b3ac-1270529c4c2c	2026-03-11 21:00:20.725	0	2026-03-04 21:00:20.725
79	1	045ac026-68d8-422e-b20b-1701c6d66b75	2026-03-11 21:00:58.509	0	2026-03-04 21:00:58.509
80	1	8921bad1-c91e-45e1-93a2-d1d6e0092f5f	2026-03-11 21:04:34.058	0	2026-03-04 21:04:34.058
81	1	a56bc795-6400-4440-b66f-6f80572eb1fd	2026-03-11 21:08:52.751	0	2026-03-04 21:08:52.751
82	1	ceb9b473-b55c-41b5-b240-81b5b60f6354	2026-03-11 21:48:50.226	0	2026-03-04 21:48:50.226
83	5	2c2f5ab2-73c3-4013-b3b3-55b8c559c7f7	2026-03-11 21:56:51.085	0	2026-03-04 21:56:51.085
84	1	6caea5c6-2b0a-4f5f-9d14-02d35726c01d	2026-03-11 22:00:53.57	0	2026-03-04 22:00:53.57
85	1	0f74a1d5-d4cb-44f1-ab52-e68240bfcf36	2026-03-11 22:25:55.243	0	2026-03-04 22:25:55.243
86	1	61a81bc7-487c-4e13-9171-5b37a6ebdff4	2026-03-12 01:20:19.681	0	2026-03-05 01:20:19.681
87	1	16ce9517-8d14-4c14-b966-2fdb4501532d	2026-03-12 03:43:15.894	0	2026-03-05 03:43:15.894
88	1	a991e32c-0454-459d-9e1d-32e22610f6cb	2026-03-12 13:07:04.652	0	2026-03-05 13:07:04.652
89	1	055d129d-f7b7-4a36-8ce3-b70757945299	2026-03-12 21:14:42.111	0	2026-03-05 21:14:42.111
90	3	d7593363-e3b0-4eaa-bf07-5dcd0441637e	2026-03-13 00:53:11.503	0	2026-03-06 00:53:11.503
91	1	57e3fa53-e6c6-428f-a4e7-455ffa30185e	2026-03-13 00:53:21.984	0	2026-03-06 00:53:21.984
92	1	7b7ff228-120f-47ee-a04c-7b4c4afe5cb5	2026-03-13 02:55:08.088	0	2026-03-06 02:55:08.088
93	1	36db1067-e829-4747-8711-85d43768c123	2026-03-13 03:05:34.067	0	2026-03-06 03:05:34.067
94	1	1ec18e03-1c38-4a5f-ae17-20d6475cf314	2026-03-13 19:56:14.518	0	2026-03-06 19:56:14.518
95	1	7b1b5a1b-04c3-43df-b753-ac2073f924ad	2026-03-16 21:11:33.77	0	2026-03-09 21:11:33.77
96	1	073a243e-3651-452c-b916-f1a8136cfe32	2026-03-16 22:23:25.889	0	2026-03-09 22:23:25.889
97	1	65d7b710-646d-42bf-894d-1e6400e63fae	2026-03-17 03:32:52.416	0	2026-03-10 03:32:52.416
98	1	3c149bd2-5c62-44b6-bd5f-dcdd73745e12	2026-03-17 13:03:46.635	0	2026-03-10 13:03:46.635
99	1	2b422159-686e-4f8c-aa7f-65ebe9502949	2026-03-17 13:19:50.922	0	2026-03-10 13:19:50.922
100	1	bf70da65-07ae-4c88-a755-3d2a62494893	2026-03-17 18:30:35.061	0	2026-03-10 18:30:35.061
101	1	13693578-bdbf-4ca2-82fc-5fc4612cfe50	2026-03-17 23:46:29.287	0	2026-03-10 23:46:29.287
102	1	d2abe3eb-35ae-4829-ae01-e524eac21ff2	2026-03-17 23:57:21.479	0	2026-03-10 23:57:21.479
103	1	c7318d79-1721-4e6a-89de-51b5de107d19	2026-03-18 03:59:04.73	0	2026-03-11 03:59:04.73
104	3	d5d7d3af-7aa1-492c-836b-4554af8e8b05	2026-03-18 03:59:56.311	0	2026-03-11 03:59:56.311
105	4	7e120a5f-964e-41b5-8473-7031aceb71eb	2026-03-18 04:00:35.071	0	2026-03-11 04:00:35.071
106	1	d4fc94af-6a6d-4f40-9a7a-4059fa497e0e	2026-03-18 04:03:41.369	0	2026-03-11 04:03:41.369
107	1	8a68cfdc-f85a-41a1-b05e-68952c4780c4	2026-03-19 00:30:20.467	0	2026-03-12 00:30:20.467
108	1	7d423d83-9f94-48f1-83ae-0c290575feab	2026-03-19 17:22:39.691	0	2026-03-12 17:22:39.691
109	1	749aa62e-cef4-4008-bd4e-1686c36f0779	2026-03-19 20:00:19.857	0	2026-03-12 20:00:19.857
110	3	53dd9032-f7a4-46a2-9830-1f0dd320fef3	2026-03-19 23:03:06.197	0	2026-03-12 23:03:06.197
111	3	9672210e-afde-46db-b4f6-0513c75a0c1d	2026-03-19 23:03:43.833	0	2026-03-12 23:03:43.833
112	1	9957a193-da14-4b8a-a4bb-198a27dc57b4	2026-03-19 23:04:12.977	0	2026-03-12 23:04:12.977
113	1	5e34ed3b-5a5b-40b2-ad37-99c7150121b6	2026-03-20 03:35:00.969	0	2026-03-13 03:35:00.969
114	1	c3ad34d0-2b40-43a0-884d-4389c2aadaec	2026-03-21 12:59:23.521	0	2026-03-14 12:59:23.521
115	1	34c4facd-1b50-42b5-9a8d-7cbc84791223	2026-03-21 13:19:40.917	0	2026-03-14 13:19:40.917
116	1	354d715f-5061-4e86-9473-0bc79d37771a	2026-03-22 13:38:14.452	0	2026-03-15 13:38:14.452
117	1	8d740c5c-45d0-4e6a-86ce-15368497cb26	2026-03-23 14:35:43.61	0	2026-03-16 14:35:43.61
118	1	e32b2b2f-85d1-4fc5-9130-c94325300450	2026-03-23 14:44:53.617	0	2026-03-16 14:44:53.617
119	1	441b90b4-32cf-486f-b688-ddccd6799293	2026-03-23 16:23:02.314	0	2026-03-16 16:23:02.314
120	1	cac49656-96fb-4d96-9624-50038189742a	2026-03-23 17:27:09.241	0	2026-03-16 17:27:09.241
121	1	808fb4dc-96b4-4ebd-8531-128a58cee89e	2026-03-23 19:12:44.362	0	2026-03-16 19:12:44.362
\.


--
-- Data for Name: roles; Type: TABLE DATA; Schema: public; Owner: larsonagon
--

COPY public.roles (id, nombre, descripcion, nivel_acceso, activo, created_at) FROM stdin;
1	Super Admin	Control total del sistema	100	1	2026-02-24 02:06:06
2	Administrador	Gestión de usuarios	80	1	2026-02-24 02:06:06
3	Archivista	Validación estratégica	60	1	2026-02-24 02:06:06
4	Profesional 1	Directivo	40	1	2026-02-24 02:06:06
5	Profesional 2	Operativo	20	1	2026-02-24 02:06:06
6	Técnico	Operativo	10	1	2026-02-24 02:06:06
7	Técnico 1	Prueba	50	1	2026-03-12 18:10:18.912662
\.


--
-- Data for Name: segtec_actividades; Type: TABLE DATA; Schema: public; Owner: larsonagon
--

COPY public.segtec_actividades (id, dependencia_id, nombre, cargo_ejecutor, tipo_funcion, frecuencia, descripcion_funcional, impacto_juridico_directo, impacto_fiscal_contable, genera_expediente_propio, actividad_permanente, genera_documentos, formato_produccion, volumen_documental, responsable_custodia, norma_aplicable, dependencias_relacionadas, estado_general, created_at, updated_at, requiere_otras_dependencias, tiene_pasos_formales, usuario_id, proceso_id, documentos_generados, localizacion_documentos, plazo_legal, tiempo_ejecucion, recepcion_externa, volumen_categoria, volumen_anual_personalizado, custodia_tipo, cargo_custodia, dependencia_custodia, localizacion_tipo, localizacion_otro, tiene_plazo) FROM stdin;
57c591dc-0a2d-462f-b272-6950143dce95	1	Prueba	\N	apoyo	semanal	Prueba	\N	\N	t	\N	1	fisico	\N	\N	Prueba	["1","2","4"]	analizada	2026-03-13T00:08:11.474Z	2026-03-16T21:23:06.086Z	1	1	1	d1f9e8b1-ed86-49a4-a5b3-c8a09a6ac900	Prueba\nPrueba1\nPrueba2	\N	Prueba	Prueba	Prueba1\nPrueba2	menos_10	\N	archivo_central	1	\N	archivador	\N	1
24a05d35-e76e-447a-afef-1e8e3a19b366	1	Prueba de registro	\N	misional	diaria	Prueba	\N	\N	\N	\N	1	fisico	menos_10	misma_dependencia	Ninguna	["1","2"]	analizada	2026-03-12T23:25:08.821Z	2026-03-16T21:23:20.260Z	1	1	1	c4040dfe-c297-4f21-be9e-a4c10567b6c3	Prueba documento 1\nPrueba documento 2\nPrueba documento 3	carpeta_oficina	No	No	1	\N	\N	\N	\N	\N	\N	\N	0
f8283faa-6986-4f5e-a0cd-1a2ee21ffa46	1	Prueba de nuevo registro	\N	misional	semanal	Prueba de nuevo registro	\N	\N	\N	\N	1	fisico	\N	\N	Prueba de nuevo registro	["2","3","4"]	identificada	2026-03-12T23:52:41.248Z	2026-03-12T23:52:41.281Z	1	1	1	5a3d80a3-1d46-41ef-bafe-34bc6f25d11a	Prueba de nuevo registro\nPrueba de nuevo registro\nPrueba de nuevo registro	\N	Prueba	Prueba	1	\N	\N	\N	\N	\N	\N	\N	0
c9ac6306-a4c5-484b-9b08-e831574efd10	1	Super prueba	\N	misional	diaria	Super prueba	\N	\N	t	\N	1	fisico	\N	\N	Super prueba	["1"]	analizada	2026-03-15T19:30:44.727Z	2026-03-16T22:27:12.782Z	1	1	1	8f231b1b-4d7f-4a3b-8972-0c13b02011e1	Super prueba	\N	\N	\N	Super prueba	\N	\N	\N	\N	\N	\N	\N	0
\.


--
-- Data for Name: segtec_analisis_actividad; Type: TABLE DATA; Schema: public; Owner: larsonagon
--

COPY public.segtec_analisis_actividad (id, actividad_id, serie_propuesta, subserie_propuesta, retencion_gestion, retencion_central, disposicion_final, justificacion, motor_version, creado_en) FROM stdin;
bf894b40-19c9-44e3-b32d-a359281b37f8	c9ac6306-a4c5-484b-9b08-e831574efd10	DOCUMENTACION GENERAL	Subserie sugerida	3	5	conservacion_parcial	Clasificación automática generada por TRD-AI	1.2	2026-03-16 19:35:47.054
c22210c2-e5df-449d-9193-47a5eded50b3	57c591dc-0a2d-462f-b272-6950143dce95	DOCUMENTACION GENERAL	Subserie sugerida	3	5	conservacion_parcial	Clasificación automática generada por TRD-AI	1.2	2026-03-16 19:35:49.278
6d4e0863-9e13-482f-ae04-9fa409ca4fdc	24a05d35-e76e-447a-afef-1e8e3a19b366	REGISTROS	Registros administrativos	3	5	conservacion_parcial	Clasificación automática generada por TRD-AI	1.2	2026-03-16 19:35:50.847
2a29e1a0-39a8-4ab2-a7ab-fb17de69333f	c9ac6306-a4c5-484b-9b08-e831574efd10	DOCUMENTACION GENERAL	Subserie sugerida	3	5	conservacion_parcial	Clasificación automática generada por TRD-AI	1.2	2026-03-16 19:44:55.985
6272e07c-abc1-4bd5-83b9-87819dea8a9f	57c591dc-0a2d-462f-b272-6950143dce95	DOCUMENTACION GENERAL	\N	3	5	conservacion_parcial	Clasificación automática generada por TRD-AI	1.2	2026-03-16 21:23:06.081
4962fc10-f85c-4eea-ad3e-82e4d56c12de	24a05d35-e76e-447a-afef-1e8e3a19b366	REGISTROS	Registros administrativos	3	5	conservacion_parcial	Clasificación automática generada por TRD-AI	1.2	2026-03-16 21:23:20.256
729a841e-a00a-4312-a07f-5febe0c5fe14	c9ac6306-a4c5-484b-9b08-e831574efd10	DOCUMENTACION GENERAL	\N	3	5	conservacion_parcial	Clasificación automática generada por TRD-AI	1.2	2026-03-16 22:27:12.778
\.


--
-- Data for Name: segtec_caracterizacion; Type: TABLE DATA; Schema: public; Owner: larsonagon
--

COPY public.segtec_caracterizacion (id, actividad_id, volumen_mensual, volumen_anual, cargo_custodio, dependencia_custodia, localizacion_actual, plazo_legal, tiempo_real, bloqueada, fecha_creacion) FROM stdin;
\.


--
-- Data for Name: segtec_configuracion_dependencia; Type: TABLE DATA; Schema: public; Owner: larsonagon
--

COPY public.segtec_configuracion_dependencia (id, id_dependencia, version, activa, tipo_funcion, nivel_decisorio, recibe_solicitudes, emite_actos, produce_decisiones, procesos_principales, tramites_frecuentes, tipo_decisiones, tipos_documentales, otros_documentos, descripcion_funcional, creado_por, created_at) FROM stdin;
619d3c8c-6f25-4033-bf44-44fd47b8fff3	1	1	0	direccion	operativo	1	1	1	Prueba	Prueba	Prueba	["actos_administrativos","informes_tecnicos","comunicaciones_oficiales","conceptos"]	Prueba	Prueba	1	2026-02-24T02:15:46.617Z
552ec1f4-34fa-4644-be2d-d70c3f00a38d	1	2	0	misional	operativo	1	1	1	Prueba	Prueba	Prueba	["actos_administrativos","informes_tecnicos","comunicaciones_oficiales","conceptos"]	Prueba	Prueba	1	2026-02-24T02:44:29.165Z
0759bc4a-88e9-41c2-b1c5-988e48684eae	1	3	0	apoyo	operativo	1	1	1	Prueba	Prueba	Prueba	["actos_administrativos","informes_tecnicos","comunicaciones_oficiales","conceptos"]	Prueba	Prueba	1	2026-02-24T02:47:37.468Z
5b64e71a-2cb4-41cc-85d7-de5d58ee7050	1	4	0	misional	operativo	1	0	0	Prueba	Prueba	Prueba	["actos_administrativos"]	Prueba	Prueba	1	2026-03-03T13:09:17.552Z
9cffc13c-dd25-4014-a66b-93ce4f4f74b9	1	5	0	apoyo	operativo	1	0	0	Prueba	Prueba	Prueba	["actos_administrativos"]	Prueba	Prueba	1	2026-03-03T23:08:43.458Z
9c255d50-da1b-46de-9ad6-4c1d91aae286	1	6	0	misional	operativo	1	0	0	Prueba	Prueba	Prueba	["actos_administrativos"]	Prueba	Prueba	1	2026-03-04T03:03:09.083Z
0ed4413c-3047-4514-b744-4ff51509886c	1	7	0	misional	operativo	1	0	0	Prueba	Prueba	Prueba	["actos_administrativos","informes_tecnicos"]	Prueba	Prueba	1	2026-03-04T04:05:16.487Z
fca6fae2-e84c-4651-9bca-1ae23242325d	1	8	0	apoyo	operativo	1	0	0	Prueba	Prueba	Prueba	["actos_administrativos","informes_tecnicos"]	Prueba	Prueba	1	2026-03-10T18:53:20.810Z
23f0127a-ef24-4894-bf65-cc11e1237ff0	1	9	1	apoyo	operativo	1	1	1	Prueba	Prueba	Prueba	["actos_administrativos","informes_tecnicos"]	Prueba	Prueba	1	2026-03-10T19:21:13.657Z
18474943-63a7-4054-a272-73173ec67d1e	2	1	1	apoyo	directivo	1	1	1	Contratación, procesos jurídicos, respuesta a derechos de petición.	Contratos\nAcciones constitucionales\nDerechos de petición	Acciones constitucionales	["actos_administrativos","informes_tecnicos","comunicaciones_oficiales","conceptos","contratos","expedientes_administrativos"]	Ninguno	N/A	4	2026-03-11T04:03:12.496Z
\.


--
-- Data for Name: segtec_formularios; Type: TABLE DATA; Schema: public; Owner: larsonagon
--

COPY public.segtec_formularios (id, usuario_id, numero, descripcion, estado, etapa_actual, creado_en, actualizado_en, created_at, updated_at) FROM stdin;
a3b88190-4d6d-47fc-906f-e05230f127cd	1	1	\N	en_proceso	1	2026-02-24T03:00:38.386Z	2026-02-24T03:00:38.386Z	2026-02-24T03:00:38.386Z	2026-02-24T03:00:38.386Z
96f2d3b0-40f0-4660-a979-20efcc0df8b1	1	2	\N	en_proceso	1	2026-02-24T03:03:52.344Z	2026-02-24T03:03:52.344Z	2026-02-24T03:03:52.344Z	2026-02-24T03:03:52.344Z
d61cc9f2-b893-4d7f-800f-a94ace1cd8d9	1	3	\N	en_proceso	1	2026-02-24T03:04:48.368Z	2026-02-24T03:04:48.368Z	2026-02-24T03:04:48.368Z	2026-02-24T03:04:48.368Z
ca45b7a4-b25e-4eab-bfca-8798da4e66bb	1	4	\N	en_proceso	1	2026-02-24T03:11:41.500Z	2026-02-24T03:11:41.500Z	2026-02-24T03:11:41.500Z	2026-02-24T03:11:41.500Z
8ecf8965-2d94-44ca-a83a-26ce488f4a82	1	5	\N	en_proceso	1	2026-02-24T03:12:11.611Z	2026-02-24T03:12:11.611Z	2026-02-24T03:12:11.611Z	2026-02-24T03:12:11.611Z
f3d5a63e-3db2-4a1f-a21a-4da9e00bd688	1	6	\N	en_proceso	1	2026-02-24T03:13:01.848Z	2026-02-24T03:13:01.848Z	2026-02-24T03:13:01.848Z	2026-02-24T03:13:01.848Z
59bc1b5d-2137-492b-be3b-70097a5fb214	1	7	\N	en_proceso	1	2026-02-24T03:27:09.885Z	2026-02-24T03:27:09.885Z	2026-02-24T03:27:09.885Z	2026-02-24T03:27:09.885Z
78b414cb-4926-44b2-968e-009959e35020	1	8	\N	en_proceso	1	2026-02-24T03:41:45.963Z	2026-02-24T03:41:45.963Z	2026-02-24T03:41:45.963Z	2026-02-24T03:41:45.963Z
4d4c703c-6051-450c-9274-10f616cde5a1	1	9	\N	en_proceso	1	2026-02-24T04:06:16.649Z	2026-02-24T04:06:16.649Z	2026-02-24T04:06:16.649Z	2026-02-24T04:06:16.649Z
\.


--
-- Data for Name: segtec_propuestas_ai; Type: TABLE DATA; Schema: public; Owner: larsonagon
--

COPY public.segtec_propuestas_ai (id, formulario_id, tipo_propuesta, contenido, nivel_confianza, estado, creado_en) FROM stdin;
\.


--
-- Data for Name: segtec_validacion_tecnica; Type: TABLE DATA; Schema: public; Owner: larsonagon
--

COPY public.segtec_validacion_tecnica (actividad_id, impacto_juridico_directo, impacto_fiscal_contable, genera_expediente_propio, actividad_permanente, soporte_principal, observacion_tecnica, created_at, updated_at) FROM stdin;
57c591dc-0a2d-462f-b272-6950143dce95	0	0	1	0	\N	\N	2026-03-13T00:11:23.542Z	2026-03-13T00:11:23.542Z
c9ac6306-a4c5-484b-9b08-e831574efd10	0	0	1	0	\N	\N	2026-03-15T19:30:44.753Z	2026-03-15T19:30:44.753Z
\.


--
-- Data for Name: series; Type: TABLE DATA; Schema: public; Owner: larsonagon
--

COPY public.series (id, trd_version_id, macrofuncion_id, subfuncion_id, nombre, codigo, tiempo_gestion, tiempo_central, disposicion_final) FROM stdin;
\.


--
-- Data for Name: subfunciones; Type: TABLE DATA; Schema: public; Owner: larsonagon
--

COPY public.subfunciones (id, macrofuncion_id, nombre, descripcion, activo, fecha_creacion, creado_por) FROM stdin;
\.


--
-- Data for Name: subseries; Type: TABLE DATA; Schema: public; Owner: larsonagon
--

COPY public.subseries (id, serie_id, nombre, codigo, tiempo_gestion, tiempo_central, disposicion_final) FROM stdin;
\.


--
-- Data for Name: sync_events; Type: TABLE DATA; Schema: public; Owner: larsonagon
--

COPY public.sync_events (id, user_id, type, entity_id, payload, created_at) FROM stdin;
\.


--
-- Data for Name: tipologias; Type: TABLE DATA; Schema: public; Owner: larsonagon
--

COPY public.tipologias (id, subserie_id, nombre, descripcion) FROM stdin;
\.


--
-- Data for Name: trd_series_propuestas; Type: TABLE DATA; Schema: public; Owner: larsonagon
--

COPY public.trd_series_propuestas (id, actividad_id, nombre_serie, nombre_subserie, tipologia_documental, justificacion, confianza, estado, version_trd_id, aprobado_por, fecha_aprobacion, observaciones_revision, creado_en) FROM stdin;
13e7cd14-63bd-4c2f-8bd1-89754f273050	24a05d35-e76e-447a-afef-1e8e3a19b366	REGISTROS	Registros administrativos	Prueba documento 1	Propuesta generada automáticamente desde SEGTEC TRD-AI	0.85	propuesta	\N	\N	\N	\N	2026-03-14T18:22:09.532Z
\.


--
-- Data for Name: trd_versiones; Type: TABLE DATA; Schema: public; Owner: larsonagon
--

COPY public.trd_versiones (id, nombre_version, modo_creacion, fecha_inicio_vigencia, fecha_fin_vigencia, estado, acto_administrativo, numero_acto, fecha_acto, observaciones) FROM stdin;
trd_001	TRD Inicial	manual	2026-03-11	\N	aprobada	\N	\N	\N	\N
\.


--
-- Data for Name: usuarios; Type: TABLE DATA; Schema: public; Owner: larsonagon
--

COPY public.usuarios (id, nombre_completo, documento, email, username, password_hash, id_dependencia, id_rol, id_cargo, id_nivel, estado, bloqueado, created_at, id_entidad, es_master_admin, es_responsable_dependencia) FROM stdin;
1	Super Administrador	00000000	super@sipad.local	superadmin	$2b$10$zoW91dEc6qJvx/FdomBtxeKgOtK.wDaz7AwbOZPzsdDn9hrbmq5AW	1	1	1	1	1	f	2026-02-24 02:06:06	1	f	f
4	Carolina Alvarez Quimbayo	49664954	caritoalqui@gmail.com	caritoalqui	$2b$10$SqssJE/015GD9xI3mMx5PeSyaCIxO8DqjjghHThjRc4LCD1uTwbvy	2	4	2	3	1	f	2026-03-02 23:49:23	1	f	f
5	Pepito Perez	01010101	pepito@gmail.com	pepitoperez	$2b$10$T3A47KEXl1G2quNTMgzHnewSWA0vwqXgJqS9vTLtJDv0I5TYtGowm	3	5	2	3	1	f	2026-03-04 20:17:21	1	f	f
3	Larson Andrés Agón Quiñonez	91181720	larsonagon@gmail.com	larsonagon	$2b$10$478WiO0V2gKfBBH83oWwH.OJBXVVqrT1hZZ6Hca1W32MBBSfQ3IiC	1	1	1	1	1	f	2026-03-02 23:47:21	1	f	f
\.


--
-- Name: auditoria_dependencias_id_seq; Type: SEQUENCE SET; Schema: public; Owner: larsonagon
--

SELECT pg_catalog.setval('public.auditoria_dependencias_id_seq', 13, true);


--
-- Name: auditoria_roles_id_seq; Type: SEQUENCE SET; Schema: public; Owner: larsonagon
--

SELECT pg_catalog.setval('public.auditoria_roles_id_seq', 10, true);


--
-- Name: auditoria_usuarios_id_seq; Type: SEQUENCE SET; Schema: public; Owner: larsonagon
--

SELECT pg_catalog.setval('public.auditoria_usuarios_id_seq', 15, true);


--
-- Name: cargos_id_seq; Type: SEQUENCE SET; Schema: public; Owner: larsonagon
--

SELECT pg_catalog.setval('public.cargos_id_seq', 3, true);


--
-- Name: configuracion_entidad_id_seq; Type: SEQUENCE SET; Schema: public; Owner: larsonagon
--

SELECT pg_catalog.setval('public.configuracion_entidad_id_seq', 1, false);


--
-- Name: dependencias_id_seq; Type: SEQUENCE SET; Schema: public; Owner: larsonagon
--

SELECT pg_catalog.setval('public.dependencias_id_seq', 8, true);


--
-- Name: entidades_id_seq; Type: SEQUENCE SET; Schema: public; Owner: larsonagon
--

SELECT pg_catalog.setval('public.entidades_id_seq', 1, false);


--
-- Name: niveles_id_seq; Type: SEQUENCE SET; Schema: public; Owner: larsonagon
--

SELECT pg_catalog.setval('public.niveles_id_seq', 7, true);


--
-- Name: refresh_tokens_id_seq; Type: SEQUENCE SET; Schema: public; Owner: larsonagon
--

SELECT pg_catalog.setval('public.refresh_tokens_id_seq', 121, true);


--
-- Name: roles_id_seq; Type: SEQUENCE SET; Schema: public; Owner: larsonagon
--

SELECT pg_catalog.setval('public.roles_id_seq', 7, true);


--
-- Name: segtec_caracterizacion_id_seq; Type: SEQUENCE SET; Schema: public; Owner: larsonagon
--

SELECT pg_catalog.setval('public.segtec_caracterizacion_id_seq', 1, false);


--
-- Name: sync_events_id_seq; Type: SEQUENCE SET; Schema: public; Owner: larsonagon
--

SELECT pg_catalog.setval('public.sync_events_id_seq', 1, false);


--
-- Name: usuarios_id_seq; Type: SEQUENCE SET; Schema: public; Owner: larsonagon
--

SELECT pg_catalog.setval('public.usuarios_id_seq', 1, false);


--
-- Name: actividades_funcionales actividades_funcionales_pkey; Type: CONSTRAINT; Schema: public; Owner: larsonagon
--

ALTER TABLE ONLY public.actividades_funcionales
    ADD CONSTRAINT actividades_funcionales_pkey PRIMARY KEY (id);


--
-- Name: auditoria_dependencias auditoria_dependencias_pkey; Type: CONSTRAINT; Schema: public; Owner: larsonagon
--

ALTER TABLE ONLY public.auditoria_dependencias
    ADD CONSTRAINT auditoria_dependencias_pkey PRIMARY KEY (id);


--
-- Name: auditoria_roles auditoria_roles_pkey; Type: CONSTRAINT; Schema: public; Owner: larsonagon
--

ALTER TABLE ONLY public.auditoria_roles
    ADD CONSTRAINT auditoria_roles_pkey PRIMARY KEY (id);


--
-- Name: auditoria_usuarios auditoria_usuarios_pkey; Type: CONSTRAINT; Schema: public; Owner: larsonagon
--

ALTER TABLE ONLY public.auditoria_usuarios
    ADD CONSTRAINT auditoria_usuarios_pkey PRIMARY KEY (id);


--
-- Name: cargos cargos_nombre_key; Type: CONSTRAINT; Schema: public; Owner: larsonagon
--

ALTER TABLE ONLY public.cargos
    ADD CONSTRAINT cargos_nombre_key UNIQUE (nombre);


--
-- Name: cargos cargos_pkey; Type: CONSTRAINT; Schema: public; Owner: larsonagon
--

ALTER TABLE ONLY public.cargos
    ADD CONSTRAINT cargos_pkey PRIMARY KEY (id);


--
-- Name: configuracion_entidad configuracion_entidad_id_entidad_key; Type: CONSTRAINT; Schema: public; Owner: larsonagon
--

ALTER TABLE ONLY public.configuracion_entidad
    ADD CONSTRAINT configuracion_entidad_id_entidad_key UNIQUE (id_entidad);


--
-- Name: configuracion_entidad configuracion_entidad_pkey; Type: CONSTRAINT; Schema: public; Owner: larsonagon
--

ALTER TABLE ONLY public.configuracion_entidad
    ADD CONSTRAINT configuracion_entidad_pkey PRIMARY KEY (id);


--
-- Name: dependencias dependencias_codigo_key; Type: CONSTRAINT; Schema: public; Owner: larsonagon
--

ALTER TABLE ONLY public.dependencias
    ADD CONSTRAINT dependencias_codigo_key UNIQUE (codigo);


--
-- Name: dependencias dependencias_pkey; Type: CONSTRAINT; Schema: public; Owner: larsonagon
--

ALTER TABLE ONLY public.dependencias
    ADD CONSTRAINT dependencias_pkey PRIMARY KEY (id);


--
-- Name: entidades entidades_pkey; Type: CONSTRAINT; Schema: public; Owner: larsonagon
--

ALTER TABLE ONLY public.entidades
    ADD CONSTRAINT entidades_pkey PRIMARY KEY (id);


--
-- Name: entidades entidades_subdominio_key; Type: CONSTRAINT; Schema: public; Owner: larsonagon
--

ALTER TABLE ONLY public.entidades
    ADD CONSTRAINT entidades_subdominio_key UNIQUE (subdominio);


--
-- Name: macrofunciones macrofunciones_codigo_key; Type: CONSTRAINT; Schema: public; Owner: larsonagon
--

ALTER TABLE ONLY public.macrofunciones
    ADD CONSTRAINT macrofunciones_codigo_key UNIQUE (codigo);


--
-- Name: macrofunciones macrofunciones_pkey; Type: CONSTRAINT; Schema: public; Owner: larsonagon
--

ALTER TABLE ONLY public.macrofunciones
    ADD CONSTRAINT macrofunciones_pkey PRIMARY KEY (id);


--
-- Name: niveles niveles_nombre_key; Type: CONSTRAINT; Schema: public; Owner: larsonagon
--

ALTER TABLE ONLY public.niveles
    ADD CONSTRAINT niveles_nombre_key UNIQUE (nombre);


--
-- Name: niveles niveles_pkey; Type: CONSTRAINT; Schema: public; Owner: larsonagon
--

ALTER TABLE ONLY public.niveles
    ADD CONSTRAINT niveles_pkey PRIMARY KEY (id);


--
-- Name: procesos procesos_pkey; Type: CONSTRAINT; Schema: public; Owner: larsonagon
--

ALTER TABLE ONLY public.procesos
    ADD CONSTRAINT procesos_pkey PRIMARY KEY (id);


--
-- Name: refresh_tokens refresh_tokens_pkey; Type: CONSTRAINT; Schema: public; Owner: larsonagon
--

ALTER TABLE ONLY public.refresh_tokens
    ADD CONSTRAINT refresh_tokens_pkey PRIMARY KEY (id);


--
-- Name: roles roles_nombre_key; Type: CONSTRAINT; Schema: public; Owner: larsonagon
--

ALTER TABLE ONLY public.roles
    ADD CONSTRAINT roles_nombre_key UNIQUE (nombre);


--
-- Name: roles roles_pkey; Type: CONSTRAINT; Schema: public; Owner: larsonagon
--

ALTER TABLE ONLY public.roles
    ADD CONSTRAINT roles_pkey PRIMARY KEY (id);


--
-- Name: segtec_actividades segtec_actividades_pkey; Type: CONSTRAINT; Schema: public; Owner: larsonagon
--

ALTER TABLE ONLY public.segtec_actividades
    ADD CONSTRAINT segtec_actividades_pkey PRIMARY KEY (id);


--
-- Name: segtec_analisis_actividad segtec_analisis_actividad_pkey; Type: CONSTRAINT; Schema: public; Owner: larsonagon
--

ALTER TABLE ONLY public.segtec_analisis_actividad
    ADD CONSTRAINT segtec_analisis_actividad_pkey PRIMARY KEY (id);


--
-- Name: segtec_caracterizacion segtec_caracterizacion_pkey; Type: CONSTRAINT; Schema: public; Owner: larsonagon
--

ALTER TABLE ONLY public.segtec_caracterizacion
    ADD CONSTRAINT segtec_caracterizacion_pkey PRIMARY KEY (id);


--
-- Name: segtec_configuracion_dependencia segtec_configuracion_dependencia_pkey; Type: CONSTRAINT; Schema: public; Owner: larsonagon
--

ALTER TABLE ONLY public.segtec_configuracion_dependencia
    ADD CONSTRAINT segtec_configuracion_dependencia_pkey PRIMARY KEY (id);


--
-- Name: segtec_formularios segtec_formularios_pkey; Type: CONSTRAINT; Schema: public; Owner: larsonagon
--

ALTER TABLE ONLY public.segtec_formularios
    ADD CONSTRAINT segtec_formularios_pkey PRIMARY KEY (id);


--
-- Name: segtec_propuestas_ai segtec_propuestas_ai_pkey; Type: CONSTRAINT; Schema: public; Owner: larsonagon
--

ALTER TABLE ONLY public.segtec_propuestas_ai
    ADD CONSTRAINT segtec_propuestas_ai_pkey PRIMARY KEY (id);


--
-- Name: segtec_validacion_tecnica segtec_validacion_tecnica_pkey; Type: CONSTRAINT; Schema: public; Owner: larsonagon
--

ALTER TABLE ONLY public.segtec_validacion_tecnica
    ADD CONSTRAINT segtec_validacion_tecnica_pkey PRIMARY KEY (actividad_id);


--
-- Name: series series_pkey; Type: CONSTRAINT; Schema: public; Owner: larsonagon
--

ALTER TABLE ONLY public.series
    ADD CONSTRAINT series_pkey PRIMARY KEY (id);


--
-- Name: subfunciones subfunciones_pkey; Type: CONSTRAINT; Schema: public; Owner: larsonagon
--

ALTER TABLE ONLY public.subfunciones
    ADD CONSTRAINT subfunciones_pkey PRIMARY KEY (id);


--
-- Name: subseries subseries_pkey; Type: CONSTRAINT; Schema: public; Owner: larsonagon
--

ALTER TABLE ONLY public.subseries
    ADD CONSTRAINT subseries_pkey PRIMARY KEY (id);


--
-- Name: sync_events sync_events_pkey; Type: CONSTRAINT; Schema: public; Owner: larsonagon
--

ALTER TABLE ONLY public.sync_events
    ADD CONSTRAINT sync_events_pkey PRIMARY KEY (id);


--
-- Name: tipologias tipologias_pkey; Type: CONSTRAINT; Schema: public; Owner: larsonagon
--

ALTER TABLE ONLY public.tipologias
    ADD CONSTRAINT tipologias_pkey PRIMARY KEY (id);


--
-- Name: trd_series_propuestas trd_series_propuestas_pkey; Type: CONSTRAINT; Schema: public; Owner: larsonagon
--

ALTER TABLE ONLY public.trd_series_propuestas
    ADD CONSTRAINT trd_series_propuestas_pkey PRIMARY KEY (id);


--
-- Name: trd_versiones trd_versiones_pkey; Type: CONSTRAINT; Schema: public; Owner: larsonagon
--

ALTER TABLE ONLY public.trd_versiones
    ADD CONSTRAINT trd_versiones_pkey PRIMARY KEY (id);


--
-- Name: usuarios usuarios_pkey; Type: CONSTRAINT; Schema: public; Owner: larsonagon
--

ALTER TABLE ONLY public.usuarios
    ADD CONSTRAINT usuarios_pkey PRIMARY KEY (id);


--
-- Name: idx_segtec_actividades_usuario; Type: INDEX; Schema: public; Owner: larsonagon
--

CREATE INDEX idx_segtec_actividades_usuario ON public.segtec_actividades USING btree (usuario_id);


--
-- Name: idx_segtec_config_dependencia; Type: INDEX; Schema: public; Owner: larsonagon
--

CREATE INDEX idx_segtec_config_dependencia ON public.segtec_configuracion_dependencia USING btree (id_dependencia);


--
-- Name: idx_segtec_form_numero; Type: INDEX; Schema: public; Owner: larsonagon
--

CREATE INDEX idx_segtec_form_numero ON public.segtec_formularios USING btree (numero);


--
-- Name: idx_segtec_form_usuario; Type: INDEX; Schema: public; Owner: larsonagon
--

CREATE INDEX idx_segtec_form_usuario ON public.segtec_formularios USING btree (usuario_id);


--
-- Name: idx_segtec_propuestas_estado; Type: INDEX; Schema: public; Owner: larsonagon
--

CREATE INDEX idx_segtec_propuestas_estado ON public.segtec_propuestas_ai USING btree (estado);


--
-- Name: idx_segtec_propuestas_formulario; Type: INDEX; Schema: public; Owner: larsonagon
--

CREATE INDEX idx_segtec_propuestas_formulario ON public.segtec_propuestas_ai USING btree (formulario_id);


--
-- Name: idx_trd_actividad; Type: INDEX; Schema: public; Owner: larsonagon
--

CREATE INDEX idx_trd_actividad ON public.trd_series_propuestas USING btree (actividad_id);


--
-- Name: idx_trd_estado; Type: INDEX; Schema: public; Owner: larsonagon
--

CREATE INDEX idx_trd_estado ON public.trd_series_propuestas USING btree (estado);


--
-- Name: actividades_funcionales actividades_funcionales_proceso_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: larsonagon
--

ALTER TABLE ONLY public.actividades_funcionales
    ADD CONSTRAINT actividades_funcionales_proceso_id_fkey FOREIGN KEY (proceso_id) REFERENCES public.procesos(id);


--
-- Name: auditoria_dependencias auditoria_dependencias_actor_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: larsonagon
--

ALTER TABLE ONLY public.auditoria_dependencias
    ADD CONSTRAINT auditoria_dependencias_actor_id_fkey FOREIGN KEY (actor_id) REFERENCES public.usuarios(id);


--
-- Name: auditoria_dependencias auditoria_dependencias_dependencia_afectada_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: larsonagon
--

ALTER TABLE ONLY public.auditoria_dependencias
    ADD CONSTRAINT auditoria_dependencias_dependencia_afectada_id_fkey FOREIGN KEY (dependencia_afectada_id) REFERENCES public.dependencias(id);


--
-- Name: auditoria_roles auditoria_roles_actor_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: larsonagon
--

ALTER TABLE ONLY public.auditoria_roles
    ADD CONSTRAINT auditoria_roles_actor_id_fkey FOREIGN KEY (actor_id) REFERENCES public.usuarios(id);


--
-- Name: auditoria_roles auditoria_roles_rol_afectado_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: larsonagon
--

ALTER TABLE ONLY public.auditoria_roles
    ADD CONSTRAINT auditoria_roles_rol_afectado_id_fkey FOREIGN KEY (rol_afectado_id) REFERENCES public.roles(id);


--
-- Name: auditoria_usuarios auditoria_usuarios_actor_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: larsonagon
--

ALTER TABLE ONLY public.auditoria_usuarios
    ADD CONSTRAINT auditoria_usuarios_actor_id_fkey FOREIGN KEY (actor_id) REFERENCES public.usuarios(id);


--
-- Name: auditoria_usuarios auditoria_usuarios_usuario_afectado_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: larsonagon
--

ALTER TABLE ONLY public.auditoria_usuarios
    ADD CONSTRAINT auditoria_usuarios_usuario_afectado_id_fkey FOREIGN KEY (usuario_afectado_id) REFERENCES public.usuarios(id);


--
-- Name: configuracion_entidad configuracion_entidad_id_entidad_fkey; Type: FK CONSTRAINT; Schema: public; Owner: larsonagon
--

ALTER TABLE ONLY public.configuracion_entidad
    ADD CONSTRAINT configuracion_entidad_id_entidad_fkey FOREIGN KEY (id_entidad) REFERENCES public.entidades(id);


--
-- Name: dependencias dependencias_id_padre_fkey; Type: FK CONSTRAINT; Schema: public; Owner: larsonagon
--

ALTER TABLE ONLY public.dependencias
    ADD CONSTRAINT dependencias_id_padre_fkey FOREIGN KEY (id_padre) REFERENCES public.dependencias(id);


--
-- Name: procesos procesos_subfuncion_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: larsonagon
--

ALTER TABLE ONLY public.procesos
    ADD CONSTRAINT procesos_subfuncion_id_fkey FOREIGN KEY (subfuncion_id) REFERENCES public.subfunciones(id);


--
-- Name: refresh_tokens refresh_tokens_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: larsonagon
--

ALTER TABLE ONLY public.refresh_tokens
    ADD CONSTRAINT refresh_tokens_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.usuarios(id);


--
-- Name: segtec_formularios segtec_formularios_usuario_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: larsonagon
--

ALTER TABLE ONLY public.segtec_formularios
    ADD CONSTRAINT segtec_formularios_usuario_id_fkey FOREIGN KEY (usuario_id) REFERENCES public.usuarios(id) ON DELETE CASCADE;


--
-- Name: segtec_propuestas_ai segtec_propuestas_ai_formulario_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: larsonagon
--

ALTER TABLE ONLY public.segtec_propuestas_ai
    ADD CONSTRAINT segtec_propuestas_ai_formulario_id_fkey FOREIGN KEY (formulario_id) REFERENCES public.segtec_formularios(id) ON DELETE CASCADE;


--
-- Name: series series_macrofuncion_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: larsonagon
--

ALTER TABLE ONLY public.series
    ADD CONSTRAINT series_macrofuncion_id_fkey FOREIGN KEY (macrofuncion_id) REFERENCES public.macrofunciones(id);


--
-- Name: series series_subfuncion_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: larsonagon
--

ALTER TABLE ONLY public.series
    ADD CONSTRAINT series_subfuncion_id_fkey FOREIGN KEY (subfuncion_id) REFERENCES public.subfunciones(id);


--
-- Name: series series_trd_version_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: larsonagon
--

ALTER TABLE ONLY public.series
    ADD CONSTRAINT series_trd_version_id_fkey FOREIGN KEY (trd_version_id) REFERENCES public.trd_versiones(id);


--
-- Name: subfunciones subfunciones_macrofuncion_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: larsonagon
--

ALTER TABLE ONLY public.subfunciones
    ADD CONSTRAINT subfunciones_macrofuncion_id_fkey FOREIGN KEY (macrofuncion_id) REFERENCES public.macrofunciones(id);


--
-- Name: subseries subseries_serie_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: larsonagon
--

ALTER TABLE ONLY public.subseries
    ADD CONSTRAINT subseries_serie_id_fkey FOREIGN KEY (serie_id) REFERENCES public.series(id);


--
-- Name: sync_events sync_events_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: larsonagon
--

ALTER TABLE ONLY public.sync_events
    ADD CONSTRAINT sync_events_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.usuarios(id) ON DELETE CASCADE;


--
-- Name: tipologias tipologias_subserie_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: larsonagon
--

ALTER TABLE ONLY public.tipologias
    ADD CONSTRAINT tipologias_subserie_id_fkey FOREIGN KEY (subserie_id) REFERENCES public.subseries(id);


--
-- Name: trd_series_propuestas trd_series_propuestas_actividad_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: larsonagon
--

ALTER TABLE ONLY public.trd_series_propuestas
    ADD CONSTRAINT trd_series_propuestas_actividad_id_fkey FOREIGN KEY (actividad_id) REFERENCES public.segtec_actividades(id) ON DELETE CASCADE;


--
-- Name: trd_series_propuestas trd_series_propuestas_version_trd_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: larsonagon
--

ALTER TABLE ONLY public.trd_series_propuestas
    ADD CONSTRAINT trd_series_propuestas_version_trd_id_fkey FOREIGN KEY (version_trd_id) REFERENCES public.trd_versiones(id);


--
-- PostgreSQL database dump complete
--

\unrestrict ngGcijuW5edkRq2xtCcitIcXEcBqQiD0UJVqQjDbw9opD68wfKmHzbMu5sFneJc

