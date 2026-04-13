--
-- PostgreSQL database dump
--

\restrict MyMFbZcepuwYcpTYFhHQecR5mimbeXsX5YV1Lv7IJzVeinqOHwv7UPlWHdbShfc

-- Dumped from database version 18.3 (Debian 18.3-1.pgdg12+1)
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

--
-- Name: public; Type: SCHEMA; Schema: -; Owner: sipad_user
--

-- *not* creating schema, since initdb creates it


ALTER SCHEMA public OWNER TO sipad_user;

--
-- Name: pgcrypto; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS pgcrypto WITH SCHEMA public;


--
-- Name: EXTENSION pgcrypto; Type: COMMENT; Schema: -; Owner: 
--

COMMENT ON EXTENSION pgcrypto IS 'cryptographic functions';


SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: auditoria_usuarios; Type: TABLE; Schema: public; Owner: sipad_user
--

CREATE TABLE public.auditoria_usuarios (
    id integer NOT NULL,
    id_usuario integer,
    accion text NOT NULL,
    descripcion text,
    ip text,
    user_agent text,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    actor_id integer,
    usuario_afectado_id integer,
    detalle_json text
);


ALTER TABLE public.auditoria_usuarios OWNER TO sipad_user;

--
-- Name: auditoria_usuarios_id_seq; Type: SEQUENCE; Schema: public; Owner: sipad_user
--

CREATE SEQUENCE public.auditoria_usuarios_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.auditoria_usuarios_id_seq OWNER TO sipad_user;

--
-- Name: auditoria_usuarios_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: sipad_user
--

ALTER SEQUENCE public.auditoria_usuarios_id_seq OWNED BY public.auditoria_usuarios.id;


--
-- Name: cargos; Type: TABLE; Schema: public; Owner: sipad_user
--

CREATE TABLE public.cargos (
    id integer NOT NULL,
    nombre text NOT NULL,
    estado integer DEFAULT 1,
    fecha_registro timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    activa integer DEFAULT 1,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    entidad_id uuid NOT NULL
);


ALTER TABLE public.cargos OWNER TO sipad_user;

--
-- Name: cargos_id_seq; Type: SEQUENCE; Schema: public; Owner: sipad_user
--

CREATE SEQUENCE public.cargos_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.cargos_id_seq OWNER TO sipad_user;

--
-- Name: cargos_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: sipad_user
--

ALTER SEQUENCE public.cargos_id_seq OWNED BY public.cargos.id;


--
-- Name: dependencias; Type: TABLE; Schema: public; Owner: sipad_user
--

CREATE TABLE public.dependencias (
    id integer NOT NULL,
    nombre text NOT NULL,
    estado integer DEFAULT 1,
    fecha_registro timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    activa integer DEFAULT 1,
    codigo text,
    descripcion text,
    id_padre integer,
    nivel integer DEFAULT 1,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone,
    entidad_id uuid NOT NULL
);


ALTER TABLE public.dependencias OWNER TO sipad_user;

--
-- Name: dependencias_id_seq; Type: SEQUENCE; Schema: public; Owner: sipad_user
--

CREATE SEQUENCE public.dependencias_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.dependencias_id_seq OWNER TO sipad_user;

--
-- Name: dependencias_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: sipad_user
--

ALTER SEQUENCE public.dependencias_id_seq OWNED BY public.dependencias.id;


--
-- Name: entidades; Type: TABLE; Schema: public; Owner: sipad_user
--

CREATE TABLE public.entidades (
    id uuid NOT NULL,
    nombre character varying(200) NOT NULL,
    estado boolean DEFAULT true,
    fecha_creacion timestamp without time zone DEFAULT now()
);


ALTER TABLE public.entidades OWNER TO sipad_user;

--
-- Name: niveles; Type: TABLE; Schema: public; Owner: sipad_user
--

CREATE TABLE public.niveles (
    id integer NOT NULL,
    nombre text NOT NULL,
    nivel_acceso integer DEFAULT 1 NOT NULL,
    estado integer DEFAULT 1,
    fecha_registro timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    orden integer,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    entidad_id uuid NOT NULL
);


ALTER TABLE public.niveles OWNER TO sipad_user;

--
-- Name: niveles_id_seq; Type: SEQUENCE; Schema: public; Owner: sipad_user
--

CREATE SEQUENCE public.niveles_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.niveles_id_seq OWNER TO sipad_user;

--
-- Name: niveles_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: sipad_user
--

ALTER SEQUENCE public.niveles_id_seq OWNED BY public.niveles.id;


--
-- Name: refresh_tokens; Type: TABLE; Schema: public; Owner: sipad_user
--

CREATE TABLE public.refresh_tokens (
    id integer NOT NULL,
    user_id integer NOT NULL,
    token text NOT NULL,
    creado timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    expiracion timestamp without time zone,
    revocado boolean DEFAULT false,
    expires_at timestamp without time zone,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.refresh_tokens OWNER TO sipad_user;

--
-- Name: refresh_tokens_id_seq; Type: SEQUENCE; Schema: public; Owner: sipad_user
--

CREATE SEQUENCE public.refresh_tokens_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.refresh_tokens_id_seq OWNER TO sipad_user;

--
-- Name: refresh_tokens_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: sipad_user
--

ALTER SEQUENCE public.refresh_tokens_id_seq OWNED BY public.refresh_tokens.id;


--
-- Name: roles; Type: TABLE; Schema: public; Owner: sipad_user
--

CREATE TABLE public.roles (
    id integer NOT NULL,
    nombre text NOT NULL,
    nivel_acceso integer DEFAULT 1,
    estado integer DEFAULT 1,
    fecha_registro timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    activa integer DEFAULT 1,
    descripcion text,
    activo integer DEFAULT 1,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    entidad_id uuid
);


ALTER TABLE public.roles OWNER TO sipad_user;

--
-- Name: roles_id_seq; Type: SEQUENCE; Schema: public; Owner: sipad_user
--

CREATE SEQUENCE public.roles_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.roles_id_seq OWNER TO sipad_user;

--
-- Name: roles_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: sipad_user
--

ALTER SEQUENCE public.roles_id_seq OWNED BY public.roles.id;


--
-- Name: segtec_actividades; Type: TABLE; Schema: public; Owner: sipad_user
--

CREATE TABLE public.segtec_actividades (
    id text NOT NULL,
    dependencia_id integer NOT NULL,
    nombre text,
    cargo_ejecutor text,
    tipo_funcion text,
    frecuencia text,
    descripcion_funcional text,
    impacto_juridico_directo integer,
    impacto_fiscal_contable integer,
    genera_expediente_propio integer,
    actividad_permanente integer,
    genera_documentos text,
    formato_produccion text,
    volumen_documental text,
    responsable_custodia text,
    norma_aplicable text,
    dependencias_relacionadas text,
    estado_general text DEFAULT 'borrador'::text NOT NULL,
    created_at timestamp without time zone NOT NULL,
    updated_at timestamp without time zone NOT NULL,
    requiere_otras_dependencias integer DEFAULT 0,
    tiene_pasos_formales integer DEFAULT 0,
    usuario_id integer,
    proceso_id text,
    documentos_generados text,
    localizacion_documentos text,
    plazo_legal text,
    tiempo_ejecucion text,
    recepcion_externa text,
    cargo_custodia integer,
    dependencia_custodia integer,
    localizacion_otro text,
    volumen_anual_personalizado text,
    entidad_id uuid NOT NULL
);


ALTER TABLE public.segtec_actividades OWNER TO sipad_user;

--
-- Name: segtec_analisis_actividad; Type: TABLE; Schema: public; Owner: sipad_user
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
    creado_en timestamp without time zone NOT NULL
);


ALTER TABLE public.segtec_analisis_actividad OWNER TO sipad_user;

--
-- Name: segtec_configuracion_dependencia; Type: TABLE; Schema: public; Owner: sipad_user
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
    created_at timestamp without time zone NOT NULL
);


ALTER TABLE public.segtec_configuracion_dependencia OWNER TO sipad_user;

--
-- Name: segtec_formularios; Type: TABLE; Schema: public; Owner: sipad_user
--

CREATE TABLE public.segtec_formularios (
    id text NOT NULL,
    usuario_id integer NOT NULL,
    numero integer NOT NULL,
    descripcion text,
    estado text DEFAULT 'en_proceso'::text NOT NULL,
    etapa_actual integer DEFAULT 1 NOT NULL,
    creado_en timestamp without time zone DEFAULT now(),
    actualizado_en timestamp without time zone,
    created_at timestamp without time zone,
    updated_at timestamp without time zone
);


ALTER TABLE public.segtec_formularios OWNER TO sipad_user;

--
-- Name: segtec_propuestas_ai; Type: TABLE; Schema: public; Owner: sipad_user
--

CREATE TABLE public.segtec_propuestas_ai (
    id text NOT NULL,
    formulario_id text NOT NULL,
    tipo_propuesta text NOT NULL,
    contenido text NOT NULL,
    nivel_confianza double precision,
    estado text DEFAULT 'generada'::text,
    creado_en timestamp without time zone DEFAULT now()
);


ALTER TABLE public.segtec_propuestas_ai OWNER TO sipad_user;

--
-- Name: segtec_propuestas_ai_new; Type: TABLE; Schema: public; Owner: sipad_user
--

CREATE TABLE public.segtec_propuestas_ai_new (
    id text NOT NULL,
    actividad_id text NOT NULL,
    tipo_propuesta text NOT NULL,
    contenido text NOT NULL,
    nivel_confianza real,
    estado text DEFAULT 'generada'::text,
    motor_version text,
    creado_en text NOT NULL
);


ALTER TABLE public.segtec_propuestas_ai_new OWNER TO sipad_user;

--
-- Name: segtec_validacion_tecnica; Type: TABLE; Schema: public; Owner: sipad_user
--

CREATE TABLE public.segtec_validacion_tecnica (
    actividad_id text NOT NULL,
    impacto_juridico_directo boolean DEFAULT false NOT NULL,
    impacto_fiscal_contable boolean DEFAULT false NOT NULL,
    genera_expediente_propio boolean DEFAULT false NOT NULL,
    actividad_permanente boolean DEFAULT false NOT NULL,
    soporte_principal text,
    observacion_tecnica text,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone
);


ALTER TABLE public.segtec_validacion_tecnica OWNER TO sipad_user;

--
-- Name: series; Type: TABLE; Schema: public; Owner: sipad_user
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
    unidad_id text,
    procedimiento text,
    activo boolean DEFAULT true,
    catalogo_serie_id integer,
    CONSTRAINT series_disposicion_final_check CHECK ((disposicion_final = ANY (ARRAY['CT'::text, 'EL'::text, 'ST'::text, 'MT'::text])))
);


ALTER TABLE public.series OWNER TO sipad_user;

--
-- Name: subseries; Type: TABLE; Schema: public; Owner: sipad_user
--

CREATE TABLE public.subseries (
    id text NOT NULL,
    serie_id text NOT NULL,
    nombre text NOT NULL,
    codigo text,
    tiempo_gestion integer,
    tiempo_central integer,
    disposicion_final text,
    procedimiento text,
    activo boolean DEFAULT true,
    catalogo_subserie_id integer,
    tipos_documentales text[] DEFAULT '{}'::text[],
    CONSTRAINT subseries_disposicion_final_check CHECK ((disposicion_final = ANY (ARRAY['CT'::text, 'EL'::text, 'ST'::text, 'MT'::text])))
);


ALTER TABLE public.subseries OWNER TO sipad_user;

--
-- Name: tipologias; Type: TABLE; Schema: public; Owner: sipad_user
--

CREATE TABLE public.tipologias (
    id text NOT NULL,
    subserie_id text NOT NULL,
    nombre text NOT NULL,
    descripcion text
);


ALTER TABLE public.tipologias OWNER TO sipad_user;

--
-- Name: trd_catalogo_series; Type: TABLE; Schema: public; Owner: sipad_user
--

CREATE TABLE public.trd_catalogo_series (
    id integer NOT NULL,
    codigo character varying(10) NOT NULL,
    nombre character varying(200) NOT NULL,
    activo boolean DEFAULT true
);


ALTER TABLE public.trd_catalogo_series OWNER TO sipad_user;

--
-- Name: trd_catalogo_series_id_seq; Type: SEQUENCE; Schema: public; Owner: sipad_user
--

CREATE SEQUENCE public.trd_catalogo_series_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.trd_catalogo_series_id_seq OWNER TO sipad_user;

--
-- Name: trd_catalogo_series_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: sipad_user
--

ALTER SEQUENCE public.trd_catalogo_series_id_seq OWNED BY public.trd_catalogo_series.id;


--
-- Name: trd_catalogo_subseries; Type: TABLE; Schema: public; Owner: sipad_user
--

CREATE TABLE public.trd_catalogo_subseries (
    id integer NOT NULL,
    codigo character varying(10) NOT NULL,
    nombre character varying(200) NOT NULL,
    serie_id integer,
    activo boolean DEFAULT true
);


ALTER TABLE public.trd_catalogo_subseries OWNER TO sipad_user;

--
-- Name: trd_catalogo_subseries_id_seq; Type: SEQUENCE; Schema: public; Owner: sipad_user
--

CREATE SEQUENCE public.trd_catalogo_subseries_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.trd_catalogo_subseries_id_seq OWNER TO sipad_user;

--
-- Name: trd_catalogo_subseries_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: sipad_user
--

ALTER SEQUENCE public.trd_catalogo_subseries_id_seq OWNED BY public.trd_catalogo_subseries.id;


--
-- Name: trd_reglas_retencion; Type: TABLE; Schema: public; Owner: sipad_user
--

CREATE TABLE public.trd_reglas_retencion (
    id text NOT NULL,
    propuesta_id text NOT NULL,
    tiempo_gestion integer,
    tiempo_central integer,
    disposicion_final text,
    fundamento_normativo text,
    nivel_confianza real,
    creado_en text NOT NULL,
    tipo_regla text DEFAULT 'manual'::text,
    retencion_gestion integer,
    retencion_central integer
);


ALTER TABLE public.trd_reglas_retencion OWNER TO sipad_user;

--
-- Name: trd_series_propuestas; Type: TABLE; Schema: public; Owner: sipad_user
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


ALTER TABLE public.trd_series_propuestas OWNER TO sipad_user;

--
-- Name: usuarios; Type: TABLE; Schema: public; Owner: sipad_user
--

CREATE TABLE public.usuarios (
    id integer NOT NULL,
    username text NOT NULL,
    password_hash text NOT NULL,
    nombre_completo text,
    id_dependencia integer,
    id_cargo integer,
    id_rol integer,
    estado integer DEFAULT 1,
    bloqueado boolean DEFAULT false,
    es_master_admin boolean DEFAULT false,
    es_responsable_dependencia boolean DEFAULT false,
    fecha_registro timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    documento text,
    email text,
    id_nivel integer,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    entidad_id uuid NOT NULL
);


ALTER TABLE public.usuarios OWNER TO sipad_user;

--
-- Name: usuarios_id_seq; Type: SEQUENCE; Schema: public; Owner: sipad_user
--

CREATE SEQUENCE public.usuarios_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.usuarios_id_seq OWNER TO sipad_user;

--
-- Name: usuarios_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: sipad_user
--

ALTER SEQUENCE public.usuarios_id_seq OWNED BY public.usuarios.id;


--
-- Name: auditoria_usuarios id; Type: DEFAULT; Schema: public; Owner: sipad_user
--

ALTER TABLE ONLY public.auditoria_usuarios ALTER COLUMN id SET DEFAULT nextval('public.auditoria_usuarios_id_seq'::regclass);


--
-- Name: cargos id; Type: DEFAULT; Schema: public; Owner: sipad_user
--

ALTER TABLE ONLY public.cargos ALTER COLUMN id SET DEFAULT nextval('public.cargos_id_seq'::regclass);


--
-- Name: dependencias id; Type: DEFAULT; Schema: public; Owner: sipad_user
--

ALTER TABLE ONLY public.dependencias ALTER COLUMN id SET DEFAULT nextval('public.dependencias_id_seq'::regclass);


--
-- Name: niveles id; Type: DEFAULT; Schema: public; Owner: sipad_user
--

ALTER TABLE ONLY public.niveles ALTER COLUMN id SET DEFAULT nextval('public.niveles_id_seq'::regclass);


--
-- Name: refresh_tokens id; Type: DEFAULT; Schema: public; Owner: sipad_user
--

ALTER TABLE ONLY public.refresh_tokens ALTER COLUMN id SET DEFAULT nextval('public.refresh_tokens_id_seq'::regclass);


--
-- Name: roles id; Type: DEFAULT; Schema: public; Owner: sipad_user
--

ALTER TABLE ONLY public.roles ALTER COLUMN id SET DEFAULT nextval('public.roles_id_seq'::regclass);


--
-- Name: trd_catalogo_series id; Type: DEFAULT; Schema: public; Owner: sipad_user
--

ALTER TABLE ONLY public.trd_catalogo_series ALTER COLUMN id SET DEFAULT nextval('public.trd_catalogo_series_id_seq'::regclass);


--
-- Name: trd_catalogo_subseries id; Type: DEFAULT; Schema: public; Owner: sipad_user
--

ALTER TABLE ONLY public.trd_catalogo_subseries ALTER COLUMN id SET DEFAULT nextval('public.trd_catalogo_subseries_id_seq'::regclass);


--
-- Name: usuarios id; Type: DEFAULT; Schema: public; Owner: sipad_user
--

ALTER TABLE ONLY public.usuarios ALTER COLUMN id SET DEFAULT nextval('public.usuarios_id_seq'::regclass);


--
-- Data for Name: auditoria_usuarios; Type: TABLE DATA; Schema: public; Owner: sipad_user
--

COPY public.auditoria_usuarios (id, id_usuario, accion, descripcion, ip, user_agent, created_at, actor_id, usuario_afectado_id, detalle_json) FROM stdin;
1	\N	EDITAR_USUARIO	\N	\N	\N	2026-03-15 22:18:08.195863	1	1	{"email":"alcalde@gmail.com","id_dependencia":1,"id_rol":1,"id_cargo":10,"id_nivel":4,"estado":1,"bloqueado":0,"password_cambiado":false}
2	\N	EDITAR_USUARIO	\N	\N	\N	2026-03-15 22:18:14.754885	1	1	{"email":"alcalde@gmail.com","id_dependencia":1,"id_rol":1,"id_cargo":10,"id_nivel":3,"estado":1,"bloqueado":0,"password_cambiado":false}
3	\N	CREAR_USUARIO	\N	\N	\N	2026-03-15 22:19:53.605328	1	\N	{"username":"isaacholguin","id_rol":4,"id_dependencia":6,"id_cargo":2,"id_nivel":1}
4	\N	CREAR_USUARIO	\N	\N	\N	2026-03-15 22:44:44.131544	1	\N	{"username":"larsonagon","id_rol":5,"id_dependencia":6,"id_cargo":10,"id_nivel":3}
5	\N	EDITAR_USUARIO	\N	\N	\N	2026-03-15 23:05:42.713939	1	2	{"email":"gobierno@alcaldia-aguachica.gov.co","id_dependencia":6,"id_rol":5,"id_cargo":2,"id_nivel":1,"estado":1,"bloqueado":0,"password_cambiado":false}
6	\N	CAMBIAR_PASSWORD	\N	\N	\N	2026-03-16 01:52:05.388957	1	1	{"self_service":true}
7	\N	CAMBIAR_PASSWORD	\N	\N	\N	2026-03-16 01:52:46.776279	1	1	{"self_service":true}
8	\N	CREAR_USUARIO	\N	\N	\N	2026-03-17 13:35:59.952553	1	\N	{"username":"caroalvarez","id_rol":5,"id_dependencia":5,"id_cargo":10,"id_nivel":3}
9	\N	CAMBIAR_PASSWORD	\N	\N	\N	2026-03-17 20:30:00.310528	1	1	{"self_service":true}
10	\N	EDITAR_USUARIO	\N	\N	\N	2026-03-24 21:48:12.680831	1	5	{"email":"Celso.arevalo211@gmail.com","id_dependencia":5,"id_rol":5,"id_cargo":21,"id_nivel":2,"estado":1,"bloqueado":0,"password_cambiado":true}
11	\N	EDITAR_USUARIO	\N	\N	\N	2026-03-24 21:50:51.883501	1	4	{"email":"caritoalqui@gmail.com","id_dependencia":5,"id_rol":5,"id_cargo":10,"id_nivel":3,"estado":1,"bloqueado":0,"password_cambiado":true}
12	\N	CREAR_USUARIO	\N	\N	\N	2026-03-25 14:53:27.513241	1	\N	{"username":"vianeyariza","id_rol":5,"id_dependencia":3,"id_cargo":5,"id_nivel":1}
13	\N	EDITAR_USUARIO	\N	\N	\N	2026-03-25 16:42:37.420544	1	1	{"email":"alcalde@gmail.com","id_dependencia":1,"id_rol":1,"id_cargo":10,"id_nivel":3,"estado":1,"bloqueado":0,"password_cambiado":true}
14	\N	EDITAR_USUARIO	\N	\N	\N	2026-03-31 14:56:49.446534	1	4	{"email":"caritoalqui@gmail.com","id_dependencia":5,"id_rol":2,"id_cargo":10,"id_nivel":3,"estado":1,"bloqueado":0,"password_cambiado":false}
15	\N	EDITAR_USUARIO	\N	\N	\N	2026-03-31 16:50:06.350591	4	2	{"email":"gobierno@alcaldia-aguachica.gov.co","id_dependencia":6,"id_rol":5,"id_cargo":2,"id_nivel":1,"estado":0,"bloqueado":0,"password_cambiado":false}
16	\N	EDITAR_USUARIO	\N	\N	\N	2026-03-31 16:50:06.462441	4	2	{"email":"gobierno@alcaldia-aguachica.gov.co","id_dependencia":6,"id_rol":5,"id_cargo":2,"id_nivel":1,"estado":0,"bloqueado":0,"password_cambiado":false}
17	\N	EDITAR_USUARIO	\N	\N	\N	2026-03-31 16:50:16.710966	4	2	{"email":"gobierno1@alcaldia-aguachica.gov.co","id_dependencia":6,"id_rol":5,"id_cargo":2,"id_nivel":1,"estado":0,"bloqueado":0,"password_cambiado":false}
18	\N	EDITAR_USUARIO	\N	\N	\N	2026-03-31 16:50:23.726595	4	2	{"email":"gobierno@alcaldia-aguachica.gov.co","id_dependencia":6,"id_rol":5,"id_cargo":2,"id_nivel":1,"estado":0,"bloqueado":0,"password_cambiado":false}
19	\N	EDITAR_USUARIO	\N	\N	\N	2026-03-31 16:50:33.634906	4	2	{"email":"gobierno@alcaldia-aguachica.gov.co","id_dependencia":6,"id_rol":5,"id_cargo":2,"id_nivel":1,"estado":1,"bloqueado":0,"password_cambiado":false}
20	\N	EDITAR_USUARIO	\N	\N	\N	2026-03-31 17:03:42.30131	4	2	{"email":"gobierno@alcaldia-aguachica.gov.co","id_dependencia":6,"id_rol":4,"id_cargo":2,"id_nivel":1,"estado":1,"bloqueado":0,"password_cambiado":false}
21	\N	EDITAR_USUARIO	\N	\N	\N	2026-03-31 17:05:24.454424	1	3	{"email":"larsonagon@gmail.com","id_dependencia":6,"id_rol":3,"id_cargo":10,"id_nivel":3,"estado":1,"bloqueado":0,"password_cambiado":false}
22	\N	CREAR_USUARIO	\N	\N	\N	2026-03-31 17:17:57.826532	1	38	{"username":"larsontransito","id_rol":7,"id_dependencia":21,"id_cargo":22,"id_nivel":6}
23	\N	EDITAR_USUARIO	\N	\N	\N	2026-04-03 01:05:51.30498	4	3	{"email":"larsonagon@gmail.com","id_rol":5,"estado":1,"bloqueado":0}
24	\N	EDITAR_USUARIO	\N	\N	\N	2026-04-03 01:06:51.751377	1	3	{"email":"larsonagon@gmail.com","id_rol":5,"estado":1,"bloqueado":0}
25	\N	CAMBIAR_PASSWORD	\N	\N	\N	2026-04-06 11:39:56.210993	3	3	{"self_service":true}
26	\N	CAMBIAR_PASSWORD	\N	\N	\N	2026-04-06 11:40:32.412116	3	3	{"self_service":true}
27	\N	EDITAR_USUARIO	\N	\N	\N	2026-04-07 14:25:48.410099	1	5	{"email":"Celso.arevalo211@gmail.com","id_rol":5,"estado":1,"bloqueado":0}
28	\N	EDITAR_USUARIO	\N	\N	\N	2026-04-07 14:28:27.155544	1	24	{"email":"adrianafigueroapabon@gmail.com","id_rol":5,"estado":1,"bloqueado":0}
29	\N	CAMBIAR_PASSWORD	\N	\N	\N	2026-04-07 14:31:27.212528	24	24	{"self_service":true}
30	\N	EDITAR_USUARIO	\N	\N	\N	2026-04-07 14:51:53.899573	1	10	{"email":"Cacaca030197@gmail.com","id_rol":5,"estado":1,"bloqueado":0}
31	\N	CAMBIAR_PASSWORD	\N	\N	\N	2026-04-07 14:53:15.210087	10	10	{"self_service":true}
32	\N	EDITAR_USUARIO	\N	\N	\N	2026-04-07 15:16:33.91787	1	25	{"email":"jhaderfajardo@gmail.com","id_rol":5,"estado":1,"bloqueado":0}
33	\N	CAMBIAR_PASSWORD	\N	\N	\N	2026-04-07 15:17:38.956142	25	25	{"self_service":true}
34	\N	EDITAR_USUARIO	\N	\N	\N	2026-04-07 15:51:33.338155	1	27	{"email":"Arq.richardquintero.15@gmail.com","id_rol":5,"estado":1,"bloqueado":0}
35	\N	EDITAR_USUARIO	\N	\N	\N	2026-04-08 04:17:03.051966	1	6	{"email":"danielamsabogada@gmail.com","id_rol":5,"estado":1,"bloqueado":0}
36	\N	EDITAR_USUARIO	\N	\N	\N	2026-04-08 04:17:18.434318	1	7	{"email":"mrcamiloquintero@gmail.com","id_rol":5,"estado":1,"bloqueado":0}
37	\N	EDITAR_USUARIO	\N	\N	\N	2026-04-08 04:17:30.411671	1	8	{"email":"Fabianpacheco0729@gmail.com","id_rol":5,"estado":1,"bloqueado":0}
38	\N	EDITAR_USUARIO	\N	\N	\N	2026-04-08 04:17:41.418098	1	9	{"email":"Edwin.salas1980@gmail.com","id_rol":5,"estado":1,"bloqueado":0}
39	\N	EDITAR_USUARIO	\N	\N	\N	2026-04-08 04:17:52.209194	1	11	{"email":"usaboxgerencia@gmail.com","id_rol":5,"estado":1,"bloqueado":0}
40	\N	EDITAR_USUARIO	\N	\N	\N	2026-04-08 04:18:02.910242	1	12	{"email":"Oswaldomc24@gmail.com","id_rol":5,"estado":1,"bloqueado":0}
41	\N	EDITAR_USUARIO	\N	\N	\N	2026-04-08 04:18:19.011549	1	13	{"email":"inglesliblanco@gmail.com","id_rol":5,"estado":1,"bloqueado":0}
42	\N	EDITAR_USUARIO	\N	\N	\N	2026-04-08 04:18:36.605785	1	14	{"email":"caviedeslozanoluisjavier@gmail.com","id_rol":5,"estado":1,"bloqueado":0}
43	\N	EDITAR_USUARIO	\N	\N	\N	2026-04-08 04:18:47.91553	1	15	{"email":"lopezascaniomaryuri@gmail.com","id_rol":5,"estado":1,"bloqueado":0}
44	\N	EDITAR_USUARIO	\N	\N	\N	2026-04-08 04:18:54.233843	1	17	{"email":"Alejandratorresmora4@gmail.com","id_rol":5,"estado":1,"bloqueado":0}
45	\N	EDITAR_USUARIO	\N	\N	\N	2026-04-08 04:19:01.527554	1	16	{"email":"Fernandaramirezq13@gmail.com","id_rol":5,"estado":1,"bloqueado":0}
46	\N	EDITAR_USUARIO	\N	\N	\N	2026-04-08 04:19:08.213541	1	18	{"email":"Norveyperezgil01@gmail.com","id_rol":5,"estado":1,"bloqueado":0}
47	\N	EDITAR_USUARIO	\N	\N	\N	2026-04-08 04:19:17.51816	1	19	{"email":"yimev@yahoo.es","id_rol":5,"estado":1,"bloqueado":0}
48	\N	EDITAR_USUARIO	\N	\N	\N	2026-04-08 04:19:25.112529	1	20	{"email":"Albertomarquez1016@hotmail.com","id_rol":5,"estado":1,"bloqueado":0}
49	\N	EDITAR_USUARIO	\N	\N	\N	2026-04-08 04:19:31.548529	1	21	{"email":"delgadoangaritayony@gmail.com","id_rol":5,"estado":1,"bloqueado":0}
50	\N	EDITAR_USUARIO	\N	\N	\N	2026-04-08 04:19:41.752563	1	22	{"email":"ingandresangarita28@gmail.com","id_rol":5,"estado":1,"bloqueado":0}
51	\N	EDITAR_USUARIO	\N	\N	\N	2026-04-08 04:19:49.217531	1	23	{"email":"Rovasa08@gmail.com","id_rol":5,"estado":1,"bloqueado":0}
52	\N	EDITAR_USUARIO	\N	\N	\N	2026-04-08 04:19:56.423081	1	26	{"email":"Ac6707605@gmail.com","id_rol":5,"estado":1,"bloqueado":0}
53	\N	EDITAR_USUARIO	\N	\N	\N	2026-04-08 04:20:05.013839	1	28	{"email":"ing.luisbarbudo@gmail.com","id_rol":5,"estado":1,"bloqueado":0}
54	\N	EDITAR_USUARIO	\N	\N	\N	2026-04-08 04:20:16.010624	1	29	{"email":"Jdavid25@hotmail.com","id_rol":5,"estado":1,"bloqueado":0}
55	\N	EDITAR_USUARIO	\N	\N	\N	2026-04-08 04:20:22.619062	1	30	{"email":"tavoch1982@gmail.com","id_rol":5,"estado":1,"bloqueado":0}
56	\N	EDITAR_USUARIO	\N	\N	\N	2026-04-08 04:20:29.408179	1	31	{"email":"carlosmauricioduranduran@gmail.com","id_rol":5,"estado":1,"bloqueado":0}
57	\N	EDITAR_USUARIO	\N	\N	\N	2026-04-08 04:20:35.452131	1	32	{"email":"rojasdominguezclaraines8@gmail.com","id_rol":5,"estado":1,"bloqueado":0}
58	\N	EDITAR_USUARIO	\N	\N	\N	2026-04-08 04:20:42.909328	1	33	{"email":"scsancheza.12@gmail.com","id_rol":5,"estado":1,"bloqueado":0}
59	\N	EDITAR_USUARIO	\N	\N	\N	2026-04-08 04:20:50.019877	1	34	{"email":"gpo.seguimiento@gmail.com","id_rol":5,"estado":1,"bloqueado":0}
60	\N	EDITAR_USUARIO	\N	\N	\N	2026-04-08 04:20:56.723968	1	35	{"email":"usosdesueloplaneacion@gmail.com","id_rol":5,"estado":1,"bloqueado":0}
61	\N	EDITAR_USUARIO	\N	\N	\N	2026-04-08 04:21:04.226748	1	36	{"email":"caye1030@gmail.com","id_rol":5,"estado":1,"bloqueado":0}
62	\N	EDITAR_USUARIO	\N	\N	\N	2026-04-08 04:21:55.250196	1	32	{"email":"rojasdominguezclaraines8@gmail.com","id_rol":5,"estado":1,"bloqueado":0}
63	\N	EDITAR_USUARIO	\N	\N	\N	2026-04-08 04:22:45.716722	1	31	{"email":"carlosmauricioduranduran@gmail.com","id_rol":5,"estado":1,"bloqueado":0}
64	\N	EDITAR_USUARIO	\N	\N	\N	2026-04-08 04:23:26.723611	1	7	{"email":"mrcamiloquintero@gmail.com","id_rol":5,"estado":1,"bloqueado":0}
65	\N	EDITAR_USUARIO	\N	\N	\N	2026-04-08 04:25:26.209725	1	15	{"email":"lopezascaniomaryuri@gmail.com","id_rol":5,"estado":1,"bloqueado":0}
66	\N	EDITAR_USUARIO	\N	\N	\N	2026-04-08 04:25:52.910813	1	16	{"email":"Fernandaramirezq13@gmail.com","id_rol":5,"estado":1,"bloqueado":0}
67	\N	EDITAR_USUARIO	\N	\N	\N	2026-04-08 04:26:19.347539	1	17	{"email":"Alejandratorresmora4@gmail.com","id_rol":5,"estado":1,"bloqueado":0}
68	\N	EDITAR_USUARIO	\N	\N	\N	2026-04-08 04:26:45.00929	1	18	{"email":"Norveyperezgil01@gmail.com","id_rol":5,"estado":1,"bloqueado":0}
69	\N	EDITAR_USUARIO	\N	\N	\N	2026-04-08 04:27:07.32277	1	19	{"email":"yimev@yahoo.es","id_rol":5,"estado":1,"bloqueado":0}
70	\N	EDITAR_USUARIO	\N	\N	\N	2026-04-08 04:27:37.809568	1	20	{"email":"Albertomarquez1016@hotmail.com","id_rol":5,"estado":1,"bloqueado":0}
71	\N	EDITAR_USUARIO	\N	\N	\N	2026-04-08 04:27:58.94309	1	21	{"email":"delgadoangaritayony@gmail.com","id_rol":5,"estado":1,"bloqueado":0}
72	\N	EDITAR_USUARIO	\N	\N	\N	2026-04-08 04:28:33.613056	1	22	{"email":"ingandresangarita28@gmail.com","id_rol":5,"estado":1,"bloqueado":0}
73	\N	EDITAR_USUARIO	\N	\N	\N	2026-04-08 04:28:50.331526	1	23	{"email":"Rovasa08@gmail.com","id_rol":5,"estado":1,"bloqueado":0}
74	\N	EDITAR_USUARIO	\N	\N	\N	2026-04-08 04:29:03.514088	1	26	{"email":"Ac6707605@gmail.com","id_rol":5,"estado":1,"bloqueado":0}
75	\N	EDITAR_USUARIO	\N	\N	\N	2026-04-08 04:29:14.309813	1	27	{"email":"Arq.richardquintero.15@gmail.com","id_rol":5,"estado":1,"bloqueado":0}
76	\N	EDITAR_USUARIO	\N	\N	\N	2026-04-08 04:29:58.516325	1	28	{"email":"ing.luisbarbudo@gmail.com","id_rol":5,"estado":1,"bloqueado":0}
77	\N	EDITAR_USUARIO	\N	\N	\N	2026-04-08 04:30:15.755712	1	29	{"email":"Jdavid25@hotmail.com","id_rol":5,"estado":1,"bloqueado":0}
78	\N	EDITAR_USUARIO	\N	\N	\N	2026-04-08 04:30:39.611198	1	30	{"email":"tavoch1982@gmail.com","id_rol":5,"estado":1,"bloqueado":0}
79	\N	EDITAR_USUARIO	\N	\N	\N	2026-04-08 04:31:05.221118	1	31	{"email":"carlosmauricioduranduran@gmail.com","id_rol":5,"estado":1,"bloqueado":0}
80	\N	EDITAR_USUARIO	\N	\N	\N	2026-04-08 04:31:27.311199	1	32	{"email":"rojasdominguezclaraines8@gmail.com","id_rol":5,"estado":1,"bloqueado":0}
81	\N	EDITAR_USUARIO	\N	\N	\N	2026-04-08 04:31:38.171418	1	33	{"email":"scsancheza.12@gmail.com","id_rol":5,"estado":1,"bloqueado":0}
82	\N	EDITAR_USUARIO	\N	\N	\N	2026-04-08 04:31:48.922711	1	34	{"email":"gpo.seguimiento@gmail.com","id_rol":5,"estado":1,"bloqueado":0}
83	\N	EDITAR_USUARIO	\N	\N	\N	2026-04-08 04:31:59.411535	1	35	{"email":"usosdesueloplaneacion@gmail.com","id_rol":5,"estado":1,"bloqueado":0}
84	\N	EDITAR_USUARIO	\N	\N	\N	2026-04-08 04:32:10.748914	1	36	{"email":"caye1030@gmail.com","id_rol":5,"estado":1,"bloqueado":0}
85	\N	CAMBIAR_PASSWORD	\N	\N	\N	2026-04-08 13:22:28.222255	18	18	{"self_service":true}
86	\N	CAMBIAR_PASSWORD	\N	\N	\N	2026-04-09 14:43:51.978312	6	6	{"self_service":true}
87	\N	CAMBIAR_PASSWORD	\N	\N	\N	2026-04-09 15:02:11.085533	19	19	{"self_service":true}
88	\N	CAMBIAR_PASSWORD	\N	\N	\N	2026-04-11 00:51:09.446839	12	12	{"self_service":true}
\.


--
-- Data for Name: cargos; Type: TABLE DATA; Schema: public; Owner: sipad_user
--

COPY public.cargos (id, nombre, estado, fecha_registro, activa, created_at, entidad_id) FROM stdin;
1	ALCALDE	1	2026-03-14 18:44:53.868075	1	2026-03-14 18:52:20.909818	890ef843-7e01-4971-9a9b-5bf107481c43
2	SECRETARIO DE DESPACHO	1	2026-03-15 17:26:52.446516	1	2026-03-15 17:26:52.446516	890ef843-7e01-4971-9a9b-5bf107481c43
3	GERENTE	1	2026-03-15 17:27:02.291527	1	2026-03-15 17:27:02.291527	890ef843-7e01-4971-9a9b-5bf107481c43
4	DIRECTOR LOCAL DE SALUD	1	2026-03-15 17:27:11.585828	1	2026-03-15 17:27:11.585828	890ef843-7e01-4971-9a9b-5bf107481c43
5	JEFE DE OFICINA DE CONTROL INTERNO	1	2026-03-15 17:27:29.573822	1	2026-03-15 17:27:29.573822	890ef843-7e01-4971-9a9b-5bf107481c43
6	JEFE DE OFICINA ASESORA	1	2026-03-15 17:27:46.26005	1	2026-03-15 17:27:46.26005	890ef843-7e01-4971-9a9b-5bf107481c43
7	COMISARIO(A) DE FAMILIA	1	2026-03-15 17:28:02.229266	1	2026-03-15 17:28:02.229266	890ef843-7e01-4971-9a9b-5bf107481c43
9	PROFESIONAL UNIVERSITARIO DEL ÁREA DE LA SALUD	1	2026-03-15 17:28:40.98267	1	2026-03-15 17:28:40.98267	890ef843-7e01-4971-9a9b-5bf107481c43
10	PROFESIONAL UNIVERSITARIO	1	2026-03-15 17:28:53.452358	1	2026-03-15 17:28:53.452358	890ef843-7e01-4971-9a9b-5bf107481c43
11	ALMACENISTA GENERAL	1	2026-03-15 17:29:11.016529	1	2026-03-15 17:29:11.016529	890ef843-7e01-4971-9a9b-5bf107481c43
12	INSPECTOR(A) DE POLICÍA	1	2026-03-15 17:29:28.818311	1	2026-03-15 17:29:28.818311	890ef843-7e01-4971-9a9b-5bf107481c43
13	INSPECTOR(A) DE POLICÍA RURAL	1	2026-03-15 17:29:43.955021	1	2026-03-15 17:29:43.955021	890ef843-7e01-4971-9a9b-5bf107481c43
14	SECRETARIO(A) EJECUTIVO DEL DESPACHO	1	2026-03-15 17:30:05.277033	1	2026-03-15 17:30:05.277033	890ef843-7e01-4971-9a9b-5bf107481c43
8	TESORERO(A) GENERAL	1	2026-03-15 17:28:11.013301	1	2026-03-15 17:28:11.013301	890ef843-7e01-4971-9a9b-5bf107481c43
15	SECRETARIO(A)	1	2026-03-15 17:31:27.149967	1	2026-03-15 17:31:27.149967	890ef843-7e01-4971-9a9b-5bf107481c43
16	TÉCNICO OPERATIVO	1	2026-03-15 17:31:43.609142	1	2026-03-15 17:31:43.609142	890ef843-7e01-4971-9a9b-5bf107481c43
17	TÉCNICO ADMINISTRATIVO	1	2026-03-15 17:31:58.271723	1	2026-03-15 17:31:58.271723	890ef843-7e01-4971-9a9b-5bf107481c43
18	AUXILIAR ADMINISTATIVO	1	2026-03-15 17:32:06.408391	1	2026-03-15 17:32:06.408391	890ef843-7e01-4971-9a9b-5bf107481c43
19	AUXILIAR DE SERVICIOS GENERALES	1	2026-03-15 17:32:44.666632	1	2026-03-15 17:32:44.666632	890ef843-7e01-4971-9a9b-5bf107481c43
20	AYUDANTE	1	2026-03-15 17:32:50.585916	1	2026-03-15 17:32:50.585916	890ef843-7e01-4971-9a9b-5bf107481c43
21	CONTRATISTA	1	2026-03-24 20:53:59.835164	1	2026-03-24 20:53:59.835164	890ef843-7e01-4971-9a9b-5bf107481c43
23	Subdirector(a) adminitrativo(a) y financiero(a)	1	2026-04-03 00:49:13.93848	1	2026-04-03 00:49:13.93848	95d4a3e1-98c6-4c5b-a5bf-a9ebd7b31273
22	Director(a)	1	2026-03-31 14:15:54.823437	1	2026-03-31 14:15:54.823437	95d4a3e1-98c6-4c5b-a5bf-a9ebd7b31273
\.


--
-- Data for Name: dependencias; Type: TABLE DATA; Schema: public; Owner: sipad_user
--

COPY public.dependencias (id, nombre, estado, fecha_registro, activa, codigo, descripcion, id_padre, nivel, created_at, updated_at, entidad_id) FROM stdin;
2	OFICINA JURÍDICA	1	2026-03-15 15:32:13.833635	1	\N	\N	\N	1	2026-03-15 15:32:13.833635	\N	890ef843-7e01-4971-9a9b-5bf107481c43
3	OFICINA DE CONTROL INTERNO	1	2026-03-15 15:32:22.657698	1	\N	\N	\N	1	2026-03-15 15:32:22.657698	\N	890ef843-7e01-4971-9a9b-5bf107481c43
4	SECRETARÍA DE HACIENDA	1	2026-03-15 15:40:29.998441	1	\N	\N	\N	1	2026-03-15 15:40:29.998441	\N	890ef843-7e01-4971-9a9b-5bf107481c43
5	GERENCIA DE PLANEACIÓN Y OBRAS	1	2026-03-15 15:40:44.640823	1	\N	\N	\N	1	2026-03-15 15:40:44.640823	\N	890ef843-7e01-4971-9a9b-5bf107481c43
6	SECRETARÍA DE GOBIERNO	1	2026-03-15 15:40:56.738258	1	\N	\N	\N	1	2026-03-15 15:40:56.738258	\N	890ef843-7e01-4971-9a9b-5bf107481c43
7	UMATA	1	2026-03-15 15:41:05.635419	1	\N	\N	\N	1	2026-03-15 15:41:05.635419	\N	890ef843-7e01-4971-9a9b-5bf107481c43
8	DEPARTAMENTO ADMINISTRATIVO DE SALUD DE AGUACHICA	1	2026-03-15 15:41:15.259054	1	\N	\N	\N	1	2026-03-15 15:41:15.259054	\N	890ef843-7e01-4971-9a9b-5bf107481c43
9	SECRETARÍA DE EDUCACIÓN	1	2026-03-15 15:41:28.815037	1	\N	\N	\N	1	2026-03-15 15:41:28.815037	\N	890ef843-7e01-4971-9a9b-5bf107481c43
10	DEPARTAMENTO DE CONTABILIDAD	1	2026-03-15 15:41:44.437078	1	\N	\N	\N	1	2026-03-15 15:41:44.437078	\N	890ef843-7e01-4971-9a9b-5bf107481c43
11	TESORERÍA	1	2026-03-15 17:13:10.535537	1	\N	\N	\N	1	2026-03-15 17:13:10.535537	\N	890ef843-7e01-4971-9a9b-5bf107481c43
12	SISBEN	1	2026-03-15 17:13:33.353526	1	\N	\N	\N	1	2026-03-15 17:13:33.353526	\N	890ef843-7e01-4971-9a9b-5bf107481c43
13	UNIDAD DE RECURSOS HUMANOS Y FÍSICOS	1	2026-03-15 17:13:52.209522	1	\N	\N	\N	1	2026-03-15 17:13:52.209522	\N	890ef843-7e01-4971-9a9b-5bf107481c43
14	CENTRO DE CONVIVENCIA	1	2026-03-15 17:14:06.632531	1	\N	\N	\N	1	2026-03-15 17:14:06.632531	\N	890ef843-7e01-4971-9a9b-5bf107481c43
15	COMISARÍA DE FAMILIA I	1	2026-03-15 17:14:23.90552	1	\N	\N	\N	1	2026-03-15 17:14:23.90552	\N	890ef843-7e01-4971-9a9b-5bf107481c43
16	COMISARÍA DE FAMILIA II	1	2026-03-15 17:14:33.762551	1	\N	\N	\N	1	2026-03-15 17:14:33.762551	\N	890ef843-7e01-4971-9a9b-5bf107481c43
17	INSPECCIÓN DE POLICÍA I	1	2026-03-15 17:14:59.118419	1	\N	\N	\N	1	2026-03-15 17:14:59.118419	\N	890ef843-7e01-4971-9a9b-5bf107481c43
18	INSPECCIÓN DE POLICÍA II	1	2026-03-15 17:15:10.056517	1	\N	\N	\N	1	2026-03-15 17:15:10.056517	\N	890ef843-7e01-4971-9a9b-5bf107481c43
19	SALUD PÚBLICA	1	2026-03-15 17:15:25.333924	1	\N	\N	\N	1	2026-03-15 17:15:25.333924	\N	890ef843-7e01-4971-9a9b-5bf107481c43
20	Prueba de creación de dependencia	1	2026-03-31 02:09:32.689886	1	\N	\N	\N	1	2026-03-31 02:09:32.689886	\N	b6275e37-657e-4e00-8334-3cabf9d8607c
21	Dirección	1	2026-03-31 13:10:06.218585	1	\N	\N	\N	1	2026-03-31 13:10:06.218585	\N	95d4a3e1-98c6-4c5b-a5bf-a9ebd7b31273
22	Subdirección administrativa y financiera	1	2026-03-31 13:10:24.313536	1	\N	\N	\N	1	2026-03-31 13:10:24.313536	\N	95d4a3e1-98c6-4c5b-a5bf-a9ebd7b31273
23	Oficina de gestión jurídica	1	2026-03-31 13:11:04.598344	1	\N	\N	\N	1	2026-03-31 13:11:04.598344	\N	95d4a3e1-98c6-4c5b-a5bf-a9ebd7b31273
24	Oficina de control interno	1	2026-03-31 13:11:10.923084	1	\N	\N	\N	1	2026-03-31 13:11:10.923084	\N	95d4a3e1-98c6-4c5b-a5bf-a9ebd7b31273
1	DESPACHO ALCALDE	1	2026-03-14 18:44:48.91895	1	\N	\N	\N	1	2026-03-14 18:50:40.165953	\N	890ef843-7e01-4971-9a9b-5bf107481c43
\.


--
-- Data for Name: entidades; Type: TABLE DATA; Schema: public; Owner: sipad_user
--

COPY public.entidades (id, nombre, estado, fecha_creacion) FROM stdin;
b6275e37-657e-4e00-8334-3cabf9d8607c	Entidad Principal	t	2026-03-29 23:43:51.851385
890ef843-7e01-4971-9a9b-5bf107481c43	Alcaldía de Aguachica	t	2026-03-30 02:25:44.339528
5952fb87-f9bf-4b81-9984-45e8c17a8bf5	Hospital Local de Aguachica	t	2026-03-30 02:25:44.339528
03889f66-e150-4cc7-813f-a0381064612b	Empresa de servicios públicos de Aguachica - ESPA	t	2026-03-31 00:59:57.81409
95d4a3e1-98c6-4c5b-a5bf-a9ebd7b31273	Instituto municipal de tránsito y transporte de Aguachica - IMTTA	t	2026-03-30 02:25:44.339528
\.


--
-- Data for Name: niveles; Type: TABLE DATA; Schema: public; Owner: sipad_user
--

COPY public.niveles (id, nombre, nivel_acceso, estado, fecha_registro, orden, created_at, entidad_id) FROM stdin;
5	ASISTENCIAL	1	1	2026-03-14 19:21:00.568321	40	2026-03-01 02:55:13	890ef843-7e01-4971-9a9b-5bf107481c43
4	TÉCNICO	1	1	2026-03-14 19:21:00.568321	60	2026-03-01 02:55:13	890ef843-7e01-4971-9a9b-5bf107481c43
3	PROFESIONAL	1	1	2026-03-14 19:21:00.568321	80	2026-03-01 02:55:13	890ef843-7e01-4971-9a9b-5bf107481c43
2	ASESOR	1	1	2026-03-14 19:21:00.568321	90	2026-03-01 02:55:13	890ef843-7e01-4971-9a9b-5bf107481c43
6	Directivo	1	1	2026-03-31 14:31:55.555767	10	2026-03-31 14:31:55.555767	95d4a3e1-98c6-4c5b-a5bf-a9ebd7b31273
1	DIRECTIVO	1	1	2026-03-14 19:21:00.568321	100	2026-03-01 02:55:13	890ef843-7e01-4971-9a9b-5bf107481c43
\.


--
-- Data for Name: refresh_tokens; Type: TABLE DATA; Schema: public; Owner: sipad_user
--

COPY public.refresh_tokens (id, user_id, token, creado, expiracion, revocado, expires_at, created_at) FROM stdin;
1	1	55b9eb85-1887-43fa-984d-c373163b6ca7	2026-03-13 03:29:43.943745	\N	f	2026-03-20 03:29:43.945	2026-03-13 03:29:43.945
2	1	a85c3ccb-f1b9-4a07-9718-5da1ec5e647b	2026-03-13 03:32:57.537644	\N	f	2026-03-20 03:32:57.539	2026-03-13 03:32:57.539
3	1	2f3e046c-bc1e-4ac2-bfea-6404f7dcbf16	2026-03-13 03:33:42.043157	\N	f	2026-03-20 03:33:42.045	2026-03-13 03:33:42.045
4	1	85c4bdcc-87ca-4bda-91fd-9826fee24679	2026-03-13 03:39:28.440428	\N	f	2026-03-20 03:39:28.442	2026-03-13 03:39:28.442
5	1	022373f8-fdb5-4817-8f8e-f7ed95065917	2026-03-13 03:41:34.045661	\N	f	2026-03-20 03:41:34.047	2026-03-13 03:41:34.047
6	1	9f4b2602-349c-404e-8598-565ca452b1b3	2026-03-13 03:49:27.031439	\N	f	2026-03-20 03:49:27.033	2026-03-13 03:49:27.033
7	1	ac437622-7c56-400a-b6e0-7c43f86eb1b5	2026-03-13 22:09:00.824317	\N	f	2026-03-20 22:09:00.824	2026-03-13 22:09:00.824
8	1	663191b1-c23d-47d2-bb60-b274a854a03d	2026-03-14 16:17:25.654511	\N	f	2026-03-21 16:17:25.654	2026-03-14 16:17:25.654
9	1	333d1ad7-cf65-4b75-bbd9-9d9f30864bc9	2026-03-14 16:46:00.10515	\N	f	2026-03-21 16:46:00.103	2026-03-14 16:46:00.103
10	1	00d189f5-5a16-4940-ac9b-5ff9650575f8	2026-03-14 17:06:11.841692	\N	f	2026-03-21 17:06:11.839	2026-03-14 17:06:11.839
11	1	8bdb705a-4508-447b-bb39-eed4b2e8d99c	2026-03-14 17:15:02.905361	\N	f	2026-03-21 17:15:02.902	2026-03-14 17:15:02.902
12	1	6e7bf4c4-af04-4102-8a9d-57cb3740a497	2026-03-14 17:22:23.819248	\N	f	2026-03-21 17:22:23.814	2026-03-14 17:22:23.814
13	1	a3ad6f55-28bf-4e9c-9b20-a3356a267df8	2026-03-14 17:24:14.319575	\N	f	2026-03-21 17:24:14.314	2026-03-14 17:24:14.314
14	1	9495c860-613f-4a7f-ae66-61058703aa7e	2026-03-14 17:28:41.922897	\N	f	2026-03-21 17:28:41.918	2026-03-14 17:28:41.918
15	1	750db9c1-a28e-4822-8076-58b74a974982	2026-03-14 17:30:01.10999	\N	f	2026-03-21 17:30:01.105	2026-03-14 17:30:01.105
16	1	59d200fd-cb34-4ba8-88bf-c0937e661658	2026-03-14 17:35:10.053968	\N	f	2026-03-21 17:35:10.05	2026-03-14 17:35:10.05
17	1	e3ada600-7ea4-4910-9bf4-3d5583d34af2	2026-03-14 17:54:31.342031	\N	f	2026-03-21 17:54:31.335	2026-03-14 17:54:31.335
18	1	5cc2e6e3-9dfa-424a-b4ae-2eb0449fc8b5	2026-03-14 18:24:51.328298	\N	f	2026-03-21 18:24:51.325	2026-03-14 18:24:51.325
19	1	363ef53a-f1e5-4799-87f5-98c668d99827	2026-03-14 18:37:22.922255	\N	f	2026-03-21 18:37:22.919	2026-03-14 18:37:22.919
20	1	c437b1ec-7170-4d3e-aa5e-ee5e084b8a01	2026-03-14 19:05:43.785164	\N	f	2026-03-21 19:05:43.787	2026-03-14 19:05:43.787
21	1	39a0242a-da45-433c-b18b-c4f52d7ed9aa	2026-03-15 14:39:36.998554	\N	f	2026-03-22 14:39:36.995	2026-03-15 14:39:36.995
22	1	b94b2afb-f622-4f83-bc24-67986541f643	2026-03-15 15:10:30.112821	\N	f	2026-03-22 15:10:30.029	2026-03-15 15:10:30.029
23	1	422cac3a-e222-4a5e-8324-ca58d2671261	2026-03-15 15:44:24.031844	\N	f	2026-03-22 15:44:24.028	2026-03-15 15:44:24.028
24	1	b741bed5-10f2-46e5-bb14-1b87f5aa6480	2026-03-15 15:44:57.81659	\N	f	2026-03-22 15:44:57.812	2026-03-15 15:44:57.812
25	1	0b18033f-6cc7-4c4e-a3b3-05c99a8e7da0	2026-03-15 15:48:54.518364	\N	f	2026-03-22 15:48:54.513	2026-03-15 15:48:54.513
26	1	9a653056-caa5-49dd-98b2-45e0bbf7373d	2026-03-15 19:47:02.07332	\N	f	2026-03-22 19:47:02.073	2026-03-15 19:47:02.073
27	1	30f39774-e561-4897-af47-8ff9fa09fa3c	2026-03-15 21:45:19.716949	\N	f	2026-03-22 21:45:19.718	2026-03-15 21:45:19.718
28	1	d1cbeec3-f8f2-4993-ba31-b5350f4575ed	2026-03-15 21:56:04.359018	\N	f	2026-03-22 21:56:04.358	2026-03-15 21:56:04.358
29	2	b3430ea7-032e-4edc-8b78-d344929f6984	2026-03-15 22:20:41.202554	\N	f	2026-03-22 22:20:41.198	2026-03-15 22:20:41.198
30	1	df95b62e-b8d7-463d-8fb8-e00a5e657fd9	2026-03-15 22:21:53.201985	\N	f	2026-03-22 22:21:53.201	2026-03-15 22:21:53.201
31	1	33e020f7-74e5-4958-b07e-1310a75d64a5	2026-03-15 22:33:57.141135	\N	f	2026-03-22 22:33:57.138	2026-03-15 22:33:57.138
32	1	dcbbed0f-2d6e-4ff1-8697-e74897ffc7f2	2026-03-15 22:39:34.996432	\N	f	2026-03-22 22:39:34.994	2026-03-15 22:39:34.994
33	3	1defc3b4-4d14-4bd8-a348-4ec9035b9263	2026-03-15 22:44:56.034594	\N	f	2026-03-22 22:44:56.031	2026-03-15 22:44:56.031
34	3	8eb80fec-0fb7-4686-be7f-f0adbdb535a8	2026-03-15 22:47:30.020734	\N	f	2026-03-22 22:47:30.018	2026-03-15 22:47:30.018
35	3	8bda5cd3-702e-4b5e-9609-9da5e0344162	2026-03-15 23:00:53.641934	\N	f	2026-03-22 23:00:53.64	2026-03-15 23:00:53.64
36	1	448faf80-f8c5-439f-9dbc-b4e0b2b322cd	2026-03-15 23:03:44.432815	\N	f	2026-03-22 23:03:44.43	2026-03-15 23:03:44.43
37	2	79ef82ba-86d5-4c75-becf-90c21b8b6e86	2026-03-15 23:04:00.833674	\N	f	2026-03-22 23:04:00.831	2026-03-15 23:04:00.831
38	1	abb510c2-4468-4c23-a475-2bdea638403d	2026-03-15 23:04:27.534397	\N	f	2026-03-22 23:04:27.532	2026-03-15 23:04:27.532
39	2	0bccc028-0062-45bc-8358-cbb6753c9940	2026-03-15 23:05:54.126726	\N	f	2026-03-22 23:05:54.125	2026-03-15 23:05:54.125
40	1	539f3741-8676-407c-9ec7-35d1544738c4	2026-03-15 23:09:36.835711	\N	f	2026-03-22 23:09:36.834	2026-03-15 23:09:36.834
41	1	67e5fbca-f0fb-4638-b6af-422c4802d5e8	2026-03-15 23:12:48.967518	\N	f	2026-03-22 23:12:48.882	2026-03-15 23:12:48.882
42	1	666183c0-d7c7-437e-8427-86a1c8451d88	2026-03-15 23:58:16.458802	\N	f	2026-03-22 23:58:16.449	2026-03-15 23:58:16.449
43	1	07517bd2-0a53-407a-ad78-2716e8170cf2	2026-03-16 01:26:35.509563	\N	f	2026-03-23 01:26:35.506	2026-03-16 01:26:35.506
44	1	a3427673-e217-4f20-9a7c-3244ecca0f65	2026-03-16 01:28:07.411215	\N	f	2026-03-23 01:28:07.409	2026-03-16 01:28:07.409
45	1	4b3924c2-48cf-4617-a35f-321f91384940	2026-03-16 01:52:26.282836	\N	f	2026-03-23 01:52:26.279	2026-03-16 01:52:26.279
46	1	3d049db7-7b22-4228-a147-a43ed82dc0ed	2026-03-16 02:07:26.171073	\N	f	2026-03-23 02:07:26.171	2026-03-16 02:07:26.171
47	1	04e956fe-aa52-4183-8aae-80aa293f1a56	2026-03-16 03:22:43.308276	\N	f	2026-03-23 03:22:43.306	2026-03-16 03:22:43.306
48	1	e262d50c-d8b0-40ee-9b55-6e6a6626a133	2026-03-16 03:27:58.484404	\N	f	2026-03-23 03:27:58.48	2026-03-16 03:27:58.48
49	1	c25d3f42-2d7e-463d-8d94-b145a75ea8c9	2026-03-16 03:28:29.990632	\N	f	2026-03-23 03:28:29.987	2026-03-16 03:28:29.987
50	1	5477a065-e3a3-4c8d-be18-7703f2579d2e	2026-03-16 03:29:07.696583	\N	f	2026-03-23 03:29:07.691	2026-03-16 03:29:07.691
51	1	ff980cfa-3b4b-4f5a-9ecf-4686a396fb20	2026-03-16 03:35:42.293688	\N	f	2026-03-23 03:35:42.29	2026-03-16 03:35:42.29
52	1	c0936f1f-10ed-4f86-a84f-4d0c5f03f6d5	2026-03-16 03:36:12.184185	\N	f	2026-03-23 03:36:12.181	2026-03-16 03:36:12.181
53	1	c973429d-e430-4d65-be36-606dcf676878	2026-03-16 03:42:27.597709	\N	f	2026-03-23 03:42:27.597	2026-03-16 03:42:27.597
54	1	ba4aa148-124a-40b9-9b55-ddaf832735a3	2026-03-16 03:45:50.704858	\N	f	2026-03-23 03:45:50.704	2026-03-16 03:45:50.704
55	1	617a4370-1197-41ac-8144-bc111253ea9d	2026-03-16 03:46:10.825606	\N	f	2026-03-23 03:46:10.824	2026-03-16 03:46:10.824
56	1	02a92fb7-79f1-4cd3-abc6-e1fe42b621d4	2026-03-16 03:46:42.730472	\N	f	2026-03-23 03:46:42.729	2026-03-16 03:46:42.729
57	3	3f0d1830-3a50-4b27-82cd-2d63eac02a7d	2026-03-16 03:50:08.211811	\N	f	2026-03-23 03:50:08.21	2026-03-16 03:50:08.21
58	1	6e9b9879-b73f-4e8c-a05c-dd9f4ee6eb18	2026-03-16 03:54:12.028903	\N	f	2026-03-23 03:54:12.025	2026-03-16 03:54:12.025
59	1	0c92b547-73d1-46f0-86b4-454bb21f47f0	2026-03-16 03:56:43.916626	\N	f	2026-03-23 03:56:43.912	2026-03-16 03:56:43.912
60	1	233b93d4-3ef9-4880-85b0-cd51d0f5262a	2026-03-16 03:56:56.706179	\N	f	2026-03-23 03:56:56.704	2026-03-16 03:56:56.704
61	1	e82fd46c-af58-4756-9540-ddf189c6894d	2026-03-16 04:02:51.58314	\N	f	2026-03-23 04:02:51.582	2026-03-16 04:02:51.582
62	1	330c2c26-147c-4538-a8aa-6f68559c8b58	2026-03-16 04:03:15.681729	\N	f	2026-03-23 04:03:15.681	2026-03-16 04:03:15.681
63	1	33a73558-84bc-43e6-af4d-6dc3c6b1493b	2026-03-16 04:03:45.787446	\N	f	2026-03-23 04:03:45.786	2026-03-16 04:03:45.786
64	1	8c092abe-96f9-4cdf-b7e2-74ebf8a421d7	2026-03-16 04:07:56.883639	\N	f	2026-03-23 04:07:56.883	2026-03-16 04:07:56.883
65	1	ca14a239-d89b-4aac-9f43-a2ef6980e84f	2026-03-16 12:39:25.511169	\N	f	2026-03-23 12:39:25.511	2026-03-16 12:39:25.511
66	1	9358c0ac-4206-43fe-858d-7b804cc74d19	2026-03-16 12:44:38.948672	\N	f	2026-03-23 12:44:38.938	2026-03-16 12:44:38.938
67	1	09b1d629-2714-48c3-8afb-a29dc1ba0ede	2026-03-16 12:45:01.452221	\N	f	2026-03-23 12:45:01.442	2026-03-16 12:45:01.442
68	1	59ff0a1d-ef58-4577-aab9-998c57830bdc	2026-03-16 12:45:35.44925	\N	f	2026-03-23 12:45:35.44	2026-03-16 12:45:35.44
69	1	9d18d515-28e6-417f-9a7f-c987d62da64f	2026-03-16 12:49:55.908068	\N	f	2026-03-23 12:49:55.907	2026-03-16 12:49:55.907
70	1	e955b784-274f-4774-a741-0c73fad90bf9	2026-03-16 12:53:03.699707	\N	f	2026-03-23 12:53:03.699	2026-03-16 12:53:03.699
71	1	e31af909-8dd5-4139-b002-f7d207f8f0e2	2026-03-16 13:03:01.834731	\N	f	2026-03-23 13:03:01.834	2026-03-16 13:03:01.834
72	1	590d44e6-281a-480d-a181-23c17d35d733	2026-03-16 13:12:56.461554	\N	f	2026-03-23 13:12:56.458	2026-03-16 13:12:56.458
73	1	a56446cd-32fc-4c86-9ceb-4c134a57c590	2026-03-16 13:13:12.472093	\N	f	2026-03-23 13:13:12.468	2026-03-16 13:13:12.468
74	1	eb4dc305-07b5-44cf-935b-852aea2c9cd3	2026-03-16 13:18:12.230116	\N	f	2026-03-23 13:18:12.229	2026-03-16 13:18:12.229
75	1	8f6ae39f-46f7-4bf1-b697-8100843cc3d7	2026-03-16 13:20:31.403338	\N	f	2026-03-23 13:20:31.399	2026-03-16 13:20:31.399
76	1	d4ff22ef-c25f-4018-a6af-76e24e049cce	2026-03-16 13:28:20.361839	\N	f	2026-03-23 13:28:20.359	2026-03-16 13:28:20.359
77	1	98a8e16f-a0e4-4c8d-8ed0-33e7f18ca39d	2026-03-16 13:29:20.472687	\N	f	2026-03-23 13:29:20.472	2026-03-16 13:29:20.472
78	3	8e07e387-d042-4e86-b6bc-b71af09eb00a	2026-03-16 13:37:02.159474	\N	f	2026-03-23 13:37:02.158	2026-03-16 13:37:02.158
79	1	1d9f9933-bdde-4927-ab4e-2f68fefa11ea	2026-03-16 13:40:57.584939	\N	f	2026-03-23 13:40:57.585	2026-03-16 13:40:57.585
80	1	5cf66ae3-2979-4578-8a53-bd914f7239c9	2026-03-16 13:42:20.074399	\N	f	2026-03-23 13:42:20.075	2026-03-16 13:42:20.075
81	1	444d8bdd-7505-43d7-bb9e-6e6699d9d284	2026-03-16 13:54:23.334559	\N	f	2026-03-23 13:54:23.281	2026-03-16 13:54:23.281
82	1	d4db01f5-c418-4395-91f4-0c4f30185a51	2026-03-16 13:57:26.671385	\N	f	2026-03-23 13:57:26.671	2026-03-16 13:57:26.671
83	3	09a84d20-8d6f-4539-bf2c-b07c8cebb444	2026-03-16 14:03:57.076747	\N	f	2026-03-23 14:03:57.077	2026-03-16 14:03:57.077
84	1	57ab8ca2-dce7-48a7-87f4-d118e58f4043	2026-03-16 16:13:57.502781	\N	f	2026-03-23 16:13:57.504	2026-03-16 16:13:57.504
85	1	b9ee94e5-856f-43ac-90c8-731a7592b38a	2026-03-16 16:14:14.408966	\N	f	2026-03-23 16:14:14.408	2026-03-16 16:14:14.408
86	1	d59ff76f-52ee-434c-8f82-e8de5a763caa	2026-03-16 16:15:23.300676	\N	f	2026-03-23 16:15:23.302	2026-03-16 16:15:23.302
87	1	6dd3d2a8-e9b4-4522-acfb-b14d4cfaea53	2026-03-16 16:21:19.042192	\N	f	2026-03-23 16:21:19.04	2026-03-16 16:21:19.04
88	1	4800383c-b744-4d09-8b1b-a7fd9129e81f	2026-03-16 16:25:06.252542	\N	f	2026-03-23 16:25:06.249	2026-03-16 16:25:06.249
89	1	1a64a166-5029-4851-8fd2-b6e7f66d7fb2	2026-03-16 16:35:00.305588	\N	f	2026-03-23 16:35:00.29	2026-03-16 16:35:00.29
90	1	03955b60-9fd7-4360-937c-2514d9ee3b60	2026-03-16 16:36:26.705018	\N	f	2026-03-23 16:36:26.702	2026-03-16 16:36:26.702
91	1	801228dd-e931-4e68-97b0-e87af3ffe86f	2026-03-16 16:51:19.309856	\N	f	2026-03-23 16:51:19.307	2026-03-16 16:51:19.307
92	1	55ced3cc-eedb-44d1-8d48-113f611bd5cb	2026-03-16 16:53:14.411239	\N	f	2026-03-23 16:53:14.408	2026-03-16 16:53:14.408
93	1	475664c2-17a0-44c2-9509-f10a49fcffa4	2026-03-16 17:03:08.905305	\N	f	2026-03-23 17:03:08.904	2026-03-16 17:03:08.904
94	1	e17656c8-8a3b-44ec-8658-b6989e298d6f	2026-03-16 17:07:33.611654	\N	f	2026-03-23 17:07:33.61	2026-03-16 17:07:33.61
95	3	dbb779ed-ba97-41b3-89df-1dfaaa7c31b3	2026-03-16 17:07:42.712847	\N	f	2026-03-23 17:07:42.711	2026-03-16 17:07:42.711
96	1	c3162eac-a628-4f51-9f7a-b79c40622c9a	2026-03-16 18:08:03.970077	\N	f	2026-03-23 18:08:03.968	2026-03-16 18:08:03.968
97	1	b5ee8e5b-2a84-4a3f-aec8-b55f997aa4c9	2026-03-16 18:14:59.23856	\N	f	2026-03-23 18:14:59.235	2026-03-16 18:14:59.235
98	1	785e65e6-5000-4f99-a339-aa68364304dd	2026-03-16 18:21:22.812053	\N	f	2026-03-23 18:21:22.809	2026-03-16 18:21:22.809
99	1	b44a76f7-861b-4a27-8b7c-0e1c786d3052	2026-03-16 18:22:23.343948	\N	f	2026-03-23 18:22:23.31	2026-03-16 18:22:23.31
100	1	ce18341c-83d3-49b2-9fe6-9101484375a3	2026-03-16 18:35:19.785686	\N	f	2026-03-23 18:35:19.781	2026-03-16 18:35:19.781
101	1	eb9f1a9a-f035-44dc-ab6d-45bce667a416	2026-03-16 18:50:29.386287	\N	f	2026-03-23 18:50:29.385	2026-03-16 18:50:29.385
102	1	9aaee0f7-c089-412f-b839-7b983ea19547	2026-03-16 18:51:24.654668	\N	f	2026-03-23 18:51:24.65	2026-03-16 18:51:24.65
103	1	dee4f50a-5d29-430d-acc8-d9bd1414b249	2026-03-16 19:03:53.65718	\N	f	2026-03-23 19:03:53.652	2026-03-16 19:03:53.652
104	1	9020d9b8-fc91-416d-985f-7284a257be4f	2026-03-16 19:08:31.574897	\N	f	2026-03-23 19:08:31.573	2026-03-16 19:08:31.573
105	1	282313d6-b220-40a5-8178-b19cb262c58a	2026-03-16 19:18:39.740151	\N	f	2026-03-23 19:18:39.734	2026-03-16 19:18:39.734
106	1	4a547b29-9ef5-4093-9b8b-949e71743cf3	2026-03-16 19:32:38.844421	\N	f	2026-03-23 19:32:38.838	2026-03-16 19:32:38.838
107	1	d20da880-d0ab-416d-89c1-a31de7d46453	2026-03-16 19:36:14.939478	\N	f	2026-03-23 19:36:14.93	2026-03-16 19:36:14.93
108	1	cee16c8d-3009-430b-bb72-4332d9501e7e	2026-03-16 19:45:10.63827	\N	f	2026-03-23 19:45:10.632	2026-03-16 19:45:10.632
109	1	2f5baa59-8bfd-40e3-8233-b220186ac5be	2026-03-16 19:46:54.652548	\N	f	2026-03-23 19:46:54.644	2026-03-16 19:46:54.644
110	1	6c93139b-b7e5-4a3b-8564-19d4f8d3c66c	2026-03-16 20:04:46.041374	\N	f	2026-03-23 20:04:46.031	2026-03-16 20:04:46.031
111	1	82c5c4de-77b4-4f79-88b5-52f7f6b7b0bd	2026-03-16 20:14:53.418267	\N	f	2026-03-23 20:14:53.415	2026-03-16 20:14:53.415
112	1	fadcfa51-f6ca-4871-aa22-e0f235b7397b	2026-03-16 20:25:49.781627	\N	f	2026-03-23 20:25:49.777	2026-03-16 20:25:49.777
113	1	cbd6f303-b874-4273-aa1e-e4f08c424519	2026-03-16 20:49:12.405104	\N	f	2026-03-23 20:49:12.403	2026-03-16 20:49:12.403
114	1	f4b1d10a-60fa-4e33-8c6b-fddf5b175f43	2026-03-16 20:51:22.500866	\N	f	2026-03-23 20:51:22.499	2026-03-16 20:51:22.499
115	1	7abd8115-3c7b-4de3-a05d-4c8d1c49cacc	2026-03-16 21:01:39.911984	\N	f	2026-03-23 21:01:39.909	2026-03-16 21:01:39.909
116	1	698945f8-74ce-4261-a306-404f7755f6fe	2026-03-16 21:25:01.096206	\N	f	2026-03-23 21:25:01.095	2026-03-16 21:25:01.095
117	1	fcfc167f-0d5b-4bb8-b0de-49852b090181	2026-03-16 21:32:30.005253	\N	f	2026-03-23 21:32:30.004	2026-03-16 21:32:30.004
118	1	36509daf-b8de-4856-80b8-703caa460b6d	2026-03-16 21:46:54.043311	\N	f	2026-03-23 21:46:54.041	2026-03-16 21:46:54.041
119	1	0e91870b-2d6a-4bf5-b806-0959e4ba5719	2026-03-16 22:06:20.043261	\N	f	2026-03-23 22:06:20.042	2026-03-16 22:06:20.042
120	1	80696408-738c-4a41-b1c5-c7377d3ddeb3	2026-03-16 22:20:19.098342	\N	f	2026-03-23 22:20:19.094	2026-03-16 22:20:19.094
121	1	446c0278-4965-4e3b-b573-408de73e8c73	2026-03-16 22:26:01.405849	\N	f	2026-03-23 22:26:01.4	2026-03-16 22:26:01.4
122	1	8714fb4f-a476-42e3-b817-91796c8320ab	2026-03-16 22:27:26.215555	\N	f	2026-03-23 22:27:26.211	2026-03-16 22:27:26.211
123	3	2888a014-3796-49c3-9a14-8da0dd484adf	2026-03-16 22:29:07.407043	\N	f	2026-03-23 22:29:07.404	2026-03-16 22:29:07.404
124	1	151e9aff-3782-43a0-b482-b98319226fa3	2026-03-16 22:42:10.873424	\N	f	2026-03-23 22:42:10.872	2026-03-16 22:42:10.872
125	3	eae630c0-eab1-47b0-a2aa-e84627a41c22	2026-03-16 22:45:29.054578	\N	f	2026-03-23 22:45:28.976	2026-03-16 22:45:28.976
126	1	240ed00a-6dd1-4378-a7c3-73afa3162445	2026-03-16 22:49:16.86155	\N	f	2026-03-23 22:49:16.861	2026-03-16 22:49:16.861
127	3	3f6510db-262f-4c2d-95dc-734658d4bb0b	2026-03-16 22:56:53.261978	\N	f	2026-03-23 22:56:53.263	2026-03-16 22:56:53.263
128	1	b6f25045-5347-4346-b171-a9f4da318458	2026-03-16 23:01:37.133654	\N	f	2026-03-23 23:01:37.133	2026-03-16 23:01:37.133
129	1	d8887375-fba8-4c87-ac68-907b011d60ea	2026-03-16 23:14:42.386738	\N	f	2026-03-23 23:14:42.386	2026-03-16 23:14:42.386
130	1	d4d4d0e4-2e84-4dc2-8b51-18c87901f6d8	2026-03-16 23:25:09.33304	\N	f	2026-03-23 23:25:09.33	2026-03-16 23:25:09.33
131	1	78640f1e-c4d2-468e-b62c-9feefd47584d	2026-03-16 23:28:01.230022	\N	f	2026-03-23 23:28:01.142	2026-03-16 23:28:01.142
132	1	0745ba91-355f-4687-b61b-47cda9726146	2026-03-16 23:29:40.235559	\N	f	2026-03-23 23:29:40.233	2026-03-16 23:29:40.233
133	1	9f1893da-e73e-4b03-b55b-9be93622f3b1	2026-03-16 23:34:32.713212	\N	f	2026-03-23 23:34:32.71	2026-03-16 23:34:32.71
134	1	5959f319-d5e8-4c90-92c2-96099fbbd711	2026-03-16 23:39:01.619996	\N	f	2026-03-23 23:39:01.619	2026-03-16 23:39:01.619
135	3	6c14f70f-65b8-4f71-b02e-ff6986d6a4cf	2026-03-16 23:39:38.133672	\N	f	2026-03-23 23:39:38.128	2026-03-16 23:39:38.128
136	1	94420b3b-e0b9-4ef4-954c-9caaa96a4c36	2026-03-16 23:44:46.515766	\N	f	2026-03-23 23:44:46.517	2026-03-16 23:44:46.517
137	3	198ed210-dbaa-4641-9d27-d8bc064fd67e	2026-03-16 23:50:29.667601	\N	f	2026-03-23 23:50:29.665	2026-03-16 23:50:29.665
138	1	cf60ff28-20d6-453e-bcd2-28b19b6eff33	2026-03-16 23:51:30.063676	\N	f	2026-03-23 23:51:30.063	2026-03-16 23:51:30.063
139	1	be1c90c4-c387-4737-83e7-40b15295028b	2026-03-17 00:01:26.531251	\N	f	2026-03-24 00:01:26.531	2026-03-17 00:01:26.531
140	3	ba21a4f3-ebb4-40f6-bb7e-eac70d293adf	2026-03-17 00:01:47.236377	\N	f	2026-03-24 00:01:47.231	2026-03-17 00:01:47.231
141	1	5961496b-f70f-42ba-a78c-df6a265caccd	2026-03-17 00:06:21.631011	\N	f	2026-03-24 00:06:21.631	2026-03-17 00:06:21.631
142	1	c29d8122-3194-4d0c-83db-554429ef5756	2026-03-17 00:20:29.876554	\N	f	2026-03-24 00:20:29.874	2026-03-17 00:20:29.874
143	1	5dc12b40-5bac-4567-8f25-ad3d19e08d70	2026-03-17 00:54:23.667819	\N	f	2026-03-24 00:54:23.668	2026-03-17 00:54:23.668
144	1	83b6b18e-7f55-4b63-8176-6c7abe827a93	2026-03-17 01:10:59.978833	\N	f	2026-03-24 01:10:59.98	2026-03-17 01:10:59.98
145	1	92986ccd-3a26-4c6b-a5da-97d98f551c3b	2026-03-17 01:19:50.571709	\N	f	2026-03-24 01:19:50.572	2026-03-17 01:19:50.572
146	3	3307a373-3707-4e92-af1b-428cee68b899	2026-03-17 01:21:15.272032	\N	f	2026-03-24 01:21:15.273	2026-03-17 01:21:15.273
147	3	fbef36d0-3496-456d-abb5-111f8a2b1c3c	2026-03-17 01:28:22.774766	\N	f	2026-03-24 01:28:22.773	2026-03-17 01:28:22.773
148	3	06612d58-da8d-4da2-a0d7-5f07acbce20a	2026-03-17 01:31:20.896674	\N	f	2026-03-24 01:31:20.897	2026-03-17 01:31:20.897
149	3	a368fe5e-ef88-49f4-98bc-1d6f6826db3a	2026-03-17 01:35:27.696043	\N	f	2026-03-24 01:35:27.694	2026-03-17 01:35:27.694
150	1	cf1577a4-2bc7-46e0-865e-4e56d4b750b6	2026-03-17 02:01:18.51359	\N	f	2026-03-24 02:01:18.512	2026-03-17 02:01:18.512
151	1	29718d7b-cb46-4f80-b91e-9d251f466436	2026-03-17 02:02:13.633626	\N	f	2026-03-24 02:02:13.613	2026-03-17 02:02:13.613
152	3	6a3e2721-3ecc-4b6a-9d77-3fc60b2b65bc	2026-03-17 02:14:39.837538	\N	f	2026-03-24 02:14:39.839	2026-03-17 02:14:39.839
153	1	f28b3b84-c7e4-4208-8e55-ba58e3bc9fee	2026-03-17 02:15:50.541528	\N	f	2026-03-24 02:15:50.538	2026-03-17 02:15:50.538
154	1	c669e678-fbdd-46e8-bad4-793074bb62b6	2026-03-17 02:24:52.034544	\N	f	2026-03-24 02:24:52.037	2026-03-17 02:24:52.037
155	3	723ea9e9-76f3-434e-b9ab-442def377176	2026-03-17 02:25:50.231835	\N	f	2026-03-24 02:25:50.234	2026-03-17 02:25:50.234
156	1	1d66b7ff-3c1f-4fdc-be2d-479cd4f7057f	2026-03-17 02:35:38.024265	\N	f	2026-03-24 02:35:38.027	2026-03-17 02:35:38.027
157	3	04c21b6f-e05e-47a4-88ee-2ce3058809e4	2026-03-17 02:36:04.134411	\N	f	2026-03-24 02:36:04.137	2026-03-17 02:36:04.137
158	1	6cca04d3-b9d3-4319-936e-e02a82c98db7	2026-03-17 02:36:27.735818	\N	f	2026-03-24 02:36:27.738	2026-03-17 02:36:27.738
159	1	43f1408a-d6c1-4c7f-aa06-e60105d68de7	2026-03-17 02:40:38.931403	\N	f	2026-03-24 02:40:38.934	2026-03-17 02:40:38.934
160	1	ff2c4070-eb85-48fb-bebb-9969dd4194ae	2026-03-17 02:55:33.648622	\N	f	2026-03-24 02:55:33.65	2026-03-17 02:55:33.65
161	1	9a3c824e-3a4d-46a2-bf42-dd4e0f6c417d	2026-03-17 03:23:32.531335	\N	f	2026-03-24 03:23:32.529	2026-03-17 03:23:32.529
162	1	063d508e-f9f7-428b-95a6-4a4385993b51	2026-03-17 03:49:12.115658	\N	f	2026-03-24 03:49:12.113	2026-03-17 03:49:12.113
163	1	3c1dda9d-3ab8-4872-a49e-aabbdd462c46	2026-03-17 03:52:02.367275	\N	f	2026-03-24 03:52:02.367	2026-03-17 03:52:02.367
164	1	4465635c-d96f-4a38-9da6-b36443ff13d0	2026-03-17 04:18:49.34957	\N	f	2026-03-24 04:18:49.267	2026-03-17 04:18:49.267
165	1	e0586d96-7b30-4a26-a48b-89727c955c0f	2026-03-17 04:28:52.278936	\N	f	2026-03-24 04:28:52.276	2026-03-17 04:28:52.276
166	1	294009c6-a207-48a0-9586-665924fed456	2026-03-17 13:34:38.956701	\N	f	2026-03-24 13:34:38.943	2026-03-17 13:34:38.943
167	1	7f9eb671-db94-4eee-8b81-60ec6a9ced44	2026-03-17 13:34:55.053843	\N	f	2026-03-24 13:34:55.041	2026-03-17 13:34:55.041
168	4	b41d00fc-3a34-4c80-9103-ad9ed4c89698	2026-03-17 13:36:13.750481	\N	f	2026-03-24 13:36:13.735	2026-03-17 13:36:13.735
169	1	e57dd890-38ad-4b23-97be-47c38b5e5605	2026-03-17 16:59:29.799455	\N	f	2026-03-24 16:59:29.707	2026-03-17 16:59:29.707
170	1	6317c01c-3a4d-4778-b9af-3d38c51a2bbc	2026-03-17 17:15:56.406638	\N	f	2026-03-24 17:15:56.403	2026-03-17 17:15:56.403
171	1	8d556ab4-17cd-4885-b5e4-0538ec7cd68d	2026-03-17 18:51:02.793405	\N	f	2026-03-24 18:51:02.793	2026-03-17 18:51:02.793
172	1	dd77826a-be9c-4279-8bef-2f6b38d49aba	2026-03-17 19:18:54.955021	\N	f	2026-03-24 19:18:54.952	2026-03-17 19:18:54.952
173	1	e9bef84d-c1e6-4d3f-91a1-b735a755d7e7	2026-03-17 19:19:34.155364	\N	f	2026-03-24 19:19:34.153	2026-03-17 19:19:34.153
174	1	adfeceff-9f38-4de4-b41e-9b87b06e0398	2026-03-17 19:25:06.769072	\N	f	2026-03-24 19:25:06.755	2026-03-17 19:25:06.755
175	1	f323eea1-907c-4673-b738-0761dcea972e	2026-03-17 19:51:36.470878	\N	f	2026-03-24 19:51:36.469	2026-03-17 19:51:36.469
176	1	61db2621-14b1-4723-b033-c54b5ca1fbd0	2026-03-17 19:59:44.558742	\N	f	2026-03-24 19:59:44.557	2026-03-17 19:59:44.557
177	1	4ac32663-84a9-4e99-901e-a1b01f3377f9	2026-03-17 20:02:38.761564	\N	f	2026-03-24 20:02:38.76	2026-03-17 20:02:38.76
178	1	81276bc7-41f9-4935-a366-5f746f7381f6	2026-03-17 20:11:53.272979	\N	f	2026-03-24 20:11:53.269	2026-03-17 20:11:53.269
179	1	7161062d-4db6-410d-8395-bb88e5f4cfd6	2026-03-17 20:29:43.910417	\N	f	2026-03-24 20:29:43.908	2026-03-17 20:29:43.908
180	1	665e63e4-94eb-41ce-ab24-87e45ce9b908	2026-03-17 20:30:14.614967	\N	f	2026-03-24 20:30:14.613	2026-03-17 20:30:14.613
181	1	34f8cae5-e053-4381-bcde-4213cfc1c67a	2026-03-17 21:35:39.614345	\N	f	2026-03-24 21:35:39.607	2026-03-17 21:35:39.607
182	3	af53237b-02ec-4e03-a9fc-bbecf6ebdddb	2026-03-17 21:38:31.120805	\N	f	2026-03-24 21:38:31.109	2026-03-17 21:38:31.109
183	1	87289a36-0b5c-46c3-b3a1-7d0a422a1298	2026-03-17 21:44:04.517949	\N	f	2026-03-24 21:44:04.512	2026-03-17 21:44:04.512
184	1	2ffa5c28-33e9-41c8-b00d-06e4f8ca5a37	2026-03-18 15:54:15.589053	\N	f	2026-03-25 15:54:15.588	2026-03-18 15:54:15.588
185	3	c1286431-4066-47e8-b6c1-fd8412b76331	2026-03-18 16:21:08.081339	\N	f	2026-03-25 16:21:08.079	2026-03-18 16:21:08.079
186	1	0c35f58f-bde8-47be-bcb8-a4d85544d6f2	2026-03-18 16:43:02.101082	\N	f	2026-03-25 16:43:02.1	2026-03-18 16:43:02.1
187	1	aaedf5e3-6d37-43cb-bcc3-7c0b958bfa66	2026-03-18 16:43:13.002701	\N	f	2026-03-25 16:43:13.001	2026-03-18 16:43:13.001
188	1	ceff7e07-5ee7-400b-837d-09a4b4678214	2026-03-18 16:56:59.601987	\N	f	2026-03-25 16:56:59.601	2026-03-18 16:56:59.601
189	1	23a2088f-d83f-443b-8b7e-c89ac55093a8	2026-03-18 16:59:09.604594	\N	f	2026-03-25 16:59:09.601	2026-03-18 16:59:09.601
190	1	14538ba9-9f7a-4fce-b3df-274fb56391ac	2026-03-18 22:37:11.511094	\N	f	2026-03-25 22:37:11.508	2026-03-18 22:37:11.508
191	1	fd675659-bacb-4690-a187-d797460ecd1d	2026-03-18 22:47:31.340677	\N	f	2026-03-25 22:47:31.342	2026-03-18 22:47:31.342
192	1	0d3942de-f151-48ea-afc6-3d26ae8dcd3f	2026-03-18 22:48:20.114366	\N	f	2026-03-25 22:48:20.117	2026-03-18 22:48:20.117
193	1	1a885fa1-880d-443d-a4a8-e33784f4f6cd	2026-03-18 22:53:18.415761	\N	f	2026-03-25 22:53:18.418	2026-03-18 22:53:18.418
194	1	c8089a40-2c14-4b72-8c9d-6782e6bf5c47	2026-03-18 23:01:35.684985	\N	f	2026-03-25 23:01:35.683	2026-03-18 23:01:35.683
195	1	be69a4ff-fee3-49a8-9596-0f68ea6026fa	2026-03-18 23:03:45.698933	\N	f	2026-03-25 23:03:45.698	2026-03-18 23:03:45.698
196	1	57a420c0-165e-4d59-849e-0ebfe86a1e01	2026-03-18 23:11:58.5986	\N	f	2026-03-25 23:11:58.6	2026-03-18 23:11:58.6
197	1	34608816-f0ee-4385-bc3a-23b567b5ef8f	2026-03-18 23:45:21.431563	\N	f	2026-03-25 23:45:21.428	2026-03-18 23:45:21.428
198	1	829d5f44-5da4-4a49-a963-974f55e287b6	2026-03-19 00:20:33.333879	\N	f	2026-03-26 00:20:33.334	2026-03-19 00:20:33.334
199	1	238be667-484c-4c7b-b0b1-d65bd9b04b9d	2026-03-19 00:22:54.426195	\N	f	2026-03-26 00:22:54.426	2026-03-19 00:22:54.426
200	1	1604f2dc-aa88-4ae0-8ba5-8bdd4dd19869	2026-03-19 00:34:59.739552	\N	f	2026-03-26 00:34:59.738	2026-03-19 00:34:59.738
201	1	0011768f-50e6-4939-ac5e-9958d29f9dd1	2026-03-19 00:36:04.032546	\N	f	2026-03-26 00:36:04.028	2026-03-19 00:36:04.028
202	1	ceab518a-4f72-4165-995b-258cec3136d4	2026-03-19 00:48:57.084036	\N	f	2026-03-26 00:48:57.083	2026-03-19 00:48:57.083
203	1	9601b52a-5879-43d8-8c8e-8835eb5e72b7	2026-03-19 01:06:47.65856	\N	f	2026-03-26 01:06:47.656	2026-03-19 01:06:47.656
204	1	9752ab0c-bf20-480e-aa7f-39859a579c15	2026-03-19 01:07:37.655099	\N	f	2026-03-26 01:07:37.653	2026-03-19 01:07:37.653
205	1	54404f17-8da6-46a1-819f-e57681d3c10d	2026-03-19 01:44:18.653604	\N	f	2026-03-26 01:44:18.653	2026-03-19 01:44:18.653
206	1	24346c57-f58f-4353-b068-ea56b7e0b42c	2026-03-19 01:44:45.953547	\N	f	2026-03-26 01:44:45.948	2026-03-19 01:44:45.948
207	1	b4b1da3a-bf8d-4738-8ded-0a65c2652e03	2026-03-19 02:14:16.98879	\N	f	2026-03-26 02:14:16.986	2026-03-19 02:14:16.986
208	1	efcf8fff-cb77-47b6-b45d-09f1e25354a7	2026-03-19 02:14:45.37485	\N	f	2026-03-26 02:14:45.372	2026-03-19 02:14:45.372
209	1	c5c34c6a-b686-4d74-848d-a32da4f9341a	2026-03-19 02:55:18.793114	\N	f	2026-03-26 02:55:18.79	2026-03-19 02:55:18.79
210	1	c3af8ae1-5a04-42d3-b8b1-2dd027342252	2026-03-19 03:19:24.037729	\N	f	2026-03-26 03:19:24.034	2026-03-19 03:19:24.034
211	1	8f1f5ed8-fd38-43a3-a848-05d416ac596b	2026-03-19 03:22:24.52921	\N	f	2026-03-26 03:22:24.441	2026-03-19 03:22:24.441
212	1	7c15beea-d0ba-47d5-a9aa-1c3aa1fb1fef	2026-03-19 03:35:44.182425	\N	f	2026-03-26 03:35:44.176	2026-03-19 03:35:44.176
213	1	1b977dab-4d12-4f76-ad65-6a8625bd5228	2026-03-19 03:44:32.85541	\N	f	2026-03-26 03:44:32.854	2026-03-19 03:44:32.854
214	1	3db60113-d58c-4cc2-a10b-811e5d6b37d1	2026-03-19 17:00:48.497377	\N	f	2026-03-26 17:00:48.493	2026-03-19 17:00:48.493
215	1	043005d4-f140-4296-a3e8-61daf5c523d5	2026-03-19 17:02:49.274983	\N	f	2026-03-26 17:02:49.272	2026-03-19 17:02:49.272
216	1	e50281cb-21ad-4a74-a306-fb48dd118224	2026-03-19 17:07:23.265781	\N	f	2026-03-26 17:07:23.18	2026-03-19 17:07:23.18
217	1	6f4fc0bc-27b4-42f7-bf6c-969b16c1281a	2026-03-19 17:28:02.887993	\N	f	2026-03-26 17:28:02.803	2026-03-19 17:28:02.803
218	1	c6d29903-b8e9-43ea-a5a3-acf2b3b54bc5	2026-03-19 20:44:09.753983	\N	f	2026-03-26 20:44:09.758	2026-03-19 20:44:09.758
219	1	a8e32e1f-9e67-47bf-bfea-4a30fa86683c	2026-03-19 20:44:52.254202	\N	f	2026-03-26 20:44:52.259	2026-03-19 20:44:52.259
220	1	152fae7a-f104-4683-95e9-d9eee2128989	2026-03-19 20:55:41.420714	\N	f	2026-03-26 20:55:41.425	2026-03-19 20:55:41.425
221	1	ca4b5957-3ca8-435e-b8e2-07dd260a0670	2026-03-19 21:08:59.618699	\N	f	2026-03-26 21:08:59.622	2026-03-19 21:08:59.622
222	1	0bdcd417-ef28-4cf5-9470-5a3b195df4ee	2026-03-19 21:46:19.527557	\N	f	2026-03-26 21:46:19.524	2026-03-19 21:46:19.524
223	1	31973723-8ebd-4454-8104-4584f759117e	2026-03-19 21:57:50.584003	\N	f	2026-03-26 21:57:50.578	2026-03-19 21:57:50.578
224	1	ebfe5659-a3df-4f6b-9a1d-ba3ee62f5b76	2026-03-19 21:58:33.887306	\N	f	2026-03-26 21:58:33.878	2026-03-19 21:58:33.878
225	1	0d1b2285-0330-4100-bca9-16ff32255f91	2026-03-19 22:05:07.994858	\N	f	2026-03-26 22:05:07.991	2026-03-19 22:05:07.991
226	1	04024594-4849-41af-8b54-b8e51c875ab2	2026-03-19 22:33:40.814315	\N	f	2026-03-26 22:33:40.81	2026-03-19 22:33:40.81
227	1	08e0ab84-b8d6-4269-bfc3-43416654fdaa	2026-03-19 22:35:02.652013	\N	f	2026-03-26 22:35:02.652	2026-03-19 22:35:02.652
228	1	8ad2e3da-7155-47d7-9e31-30f85227edf8	2026-03-19 23:14:19.313851	\N	f	2026-03-26 23:14:19.314	2026-03-19 23:14:19.314
229	1	9b0b3f1c-8f1f-45f2-b8ec-1519f35ae567	2026-03-19 23:16:58.905744	\N	f	2026-03-26 23:16:58.831	2026-03-19 23:16:58.831
230	1	bb8d6ea0-4267-4fa3-ba7d-6f3a140f55d6	2026-03-20 01:03:20.728067	\N	f	2026-03-27 01:03:20.729	2026-03-20 01:03:20.729
231	1	0f94496a-b975-40a0-ac52-884be0442c45	2026-03-20 01:28:08.050305	\N	f	2026-03-27 01:28:08.05	2026-03-20 01:28:08.05
232	1	50e66554-2f8a-4f46-b609-7167937ab14b	2026-03-20 01:44:03.396948	\N	f	2026-03-27 01:44:03.393	2026-03-20 01:44:03.393
233	1	84186897-5477-4a91-9428-efbd775dbe02	2026-03-20 01:55:26.980022	\N	f	2026-03-27 01:55:26.981	2026-03-20 01:55:26.981
234	1	5f821286-780d-4fc5-b9c2-0e452b529e1a	2026-03-20 01:55:46.678538	\N	f	2026-03-27 01:55:46.679	2026-03-20 01:55:46.679
235	1	5758ce75-cc38-4232-8d8e-f9e6a6913077	2026-03-24 16:46:10.812813	\N	f	2026-03-31 16:46:10.729	2026-03-24 16:46:10.729
236	1	21c48172-4584-47c1-84fb-846551e727d2	2026-03-24 20:52:18.788542	\N	f	2026-03-31 20:52:18.698	2026-03-24 20:52:18.698
237	1	b38237b8-2394-4969-a4bf-afd9367bd6c3	2026-03-24 20:52:19.697003	\N	f	2026-03-31 20:52:19.695	2026-03-24 20:52:19.695
238	1	7408fc69-d0f1-43ba-a574-6aec35270778	2026-03-24 21:04:41.698448	\N	f	2026-03-31 21:04:41.697	2026-03-24 21:04:41.697
239	1	10ae293b-34f6-40cc-a8fd-b8dea8e5f7b7	2026-03-24 21:04:42.186774	\N	f	2026-03-31 21:04:42.185	2026-03-24 21:04:42.185
240	1	4bfc53c3-3021-4d35-bc50-647ab5f147fd	2026-03-24 21:23:15.688443	\N	f	2026-03-31 21:23:15.687	2026-03-24 21:23:15.687
241	1	610bb5fa-78bf-4870-a31c-28cac17780a5	2026-03-24 21:35:11.001243	\N	f	2026-03-31 21:35:10.999	2026-03-24 21:35:10.999
242	1	6c6edf3a-11f6-4a6f-bef1-81d2c371a832	2026-03-24 21:47:12.579817	\N	f	2026-03-31 21:47:12.577	2026-03-24 21:47:12.577
243	1	ae1dd2bc-2722-4320-88c9-f5de7de5640e	2026-03-24 21:47:50.890574	\N	f	2026-03-31 21:47:50.888	2026-03-24 21:47:50.888
244	5	fb723c10-7e0e-436e-be99-70ab9df4fe8a	2026-03-24 21:48:28.687867	\N	f	2026-03-31 21:48:28.686	2026-03-24 21:48:28.686
245	1	574bac03-6f10-4d0f-97ca-97a19db3bc29	2026-03-24 21:50:36.494401	\N	f	2026-03-31 21:50:36.492	2026-03-24 21:50:36.492
246	4	68f5041c-7340-437f-9c11-a5b90bee8537	2026-03-24 21:51:18.19079	\N	f	2026-03-31 21:51:18.189	2026-03-24 21:51:18.189
247	1	28b9843a-e27b-4765-b159-6a33c99e885d	2026-03-24 21:55:31.980259	\N	f	2026-03-31 21:55:31.977	2026-03-24 21:55:31.977
248	1	2ef88707-18c0-4511-a01d-d1ffa8794b1e	2026-03-24 22:21:44.139169	\N	f	2026-03-31 22:21:44.136	2026-03-24 22:21:44.136
249	1	05bbed9e-7346-4cd2-ace2-ba63e5097673	2026-03-24 22:49:15.923383	\N	f	2026-03-31 22:49:15.915	2026-03-24 22:49:15.915
250	1	2be3d422-a22e-42c2-8317-a9d386e4e6a8	2026-03-24 23:45:42.606032	\N	f	2026-03-31 23:45:42.607	2026-03-24 23:45:42.607
251	1	ca14fa22-7aa9-46d9-b1a1-b95c1f1a447d	2026-03-24 23:47:56.542548	\N	f	2026-03-31 23:47:56.537	2026-03-24 23:47:56.537
252	1	fd83e971-dbc8-4129-acbd-ec4d0c52fa1a	2026-03-24 23:47:57.440727	\N	f	2026-03-31 23:47:57.436	2026-03-24 23:47:57.436
253	1	dc838976-87d5-44c7-8f02-b544b0844152	2026-03-25 00:19:57.228936	\N	f	2026-04-01 00:19:57.229	2026-03-25 00:19:57.229
254	1	a297401a-6876-4332-9a73-961feaae8da7	2026-03-25 00:20:33.638814	\N	f	2026-04-01 00:20:33.638	2026-03-25 00:20:33.638
255	1	4749b718-ad3c-4a42-bb30-b5fa0403d7fb	2026-03-25 00:55:39.817531	\N	f	2026-04-01 00:55:39.81	2026-03-25 00:55:39.81
256	1	542f5d53-d5c9-4c88-aaaf-5a1e894a2318	2026-03-25 00:56:06.818109	\N	f	2026-04-01 00:56:06.81	2026-03-25 00:56:06.81
257	1	02beea14-ae0f-422a-b631-15110036fb98	2026-03-25 00:58:03.737944	\N	f	2026-04-01 00:58:03.738	2026-03-25 00:58:03.738
258	1	c72a8c3d-254d-494e-ac91-2bf24138706b	2026-03-25 01:09:06.706367	\N	f	2026-04-01 01:09:06.705	2026-03-25 01:09:06.705
259	1	623ab107-3fd4-4dc1-8720-9aaf16b51738	2026-03-25 01:16:57.426571	\N	f	2026-04-01 01:16:57.407	2026-03-25 01:16:57.407
260	1	d93aba9e-c991-435b-ac32-36162efb0f36	2026-03-25 01:37:04.750232	\N	f	2026-04-01 01:37:04.748	2026-03-25 01:37:04.748
261	1	26700c1e-8aa0-426e-b645-472b79a85a8f	2026-03-25 01:59:30.927396	\N	f	2026-04-01 01:59:30.925	2026-03-25 01:59:30.925
262	1	cd4aa659-5a0f-4286-8ec8-43b73952f02a	2026-03-25 02:11:07.369362	\N	f	2026-04-01 02:11:07.368	2026-03-25 02:11:07.368
263	1	899fefd9-46f2-458e-8f3d-308d0b763a39	2026-03-25 02:29:19.335289	\N	f	2026-04-01 02:29:19.334	2026-03-25 02:29:19.334
264	1	ad835e3e-9043-4bf3-9f43-2f71161bb32f	2026-03-25 02:46:46.129044	\N	f	2026-04-01 02:46:46.123	2026-03-25 02:46:46.123
265	1	cfb50d56-ba29-40bd-9a97-8327f8897513	2026-03-25 02:54:12.807556	\N	f	2026-04-01 02:54:12.807	2026-03-25 02:54:12.807
266	1	28e485f3-685e-4514-a48d-90019f367e43	2026-03-25 03:39:05.117153	\N	f	2026-04-01 03:39:05.111	2026-03-25 03:39:05.111
267	1	740ec67e-70e7-4f40-98d8-31edec4a151e	2026-03-25 03:53:06.540448	\N	f	2026-04-01 03:53:06.538	2026-03-25 03:53:06.538
268	1	9d6d2e32-4b05-4d52-8142-ab89b537f1dc	2026-03-25 03:55:29.739409	\N	f	2026-04-01 03:55:29.733	2026-03-25 03:55:29.733
269	1	cce8e388-f19b-4c12-a85f-6c4d74c9489d	2026-03-25 03:56:29.636956	\N	f	2026-04-01 03:56:29.635	2026-03-25 03:56:29.635
270	1	3d0b48ac-ceda-4e64-a627-142212f7dda8	2026-03-25 03:58:24.534257	\N	f	2026-04-01 03:58:24.533	2026-03-25 03:58:24.533
271	1	d3dbc1f2-1cbd-42f5-9546-3e6cf71fe985	2026-03-25 04:24:39.801457	\N	f	2026-04-01 04:24:39.799	2026-03-25 04:24:39.799
272	1	d84eaa3d-2b06-429a-b053-9bb15306a738	2026-03-25 14:36:30.20877	\N	f	2026-04-01 14:36:30.206	2026-03-25 14:36:30.206
273	1	2e430ae1-cba0-4026-b8cf-32ef51859b28	2026-03-25 14:36:30.30855	\N	f	2026-04-01 14:36:30.307	2026-03-25 14:36:30.307
274	1	123cff95-dc79-4164-ab0f-15293213fb07	2026-03-25 14:52:14.219361	\N	f	2026-04-01 14:52:14.217	2026-03-25 14:52:14.217
275	1	59047b7c-3f10-4012-9022-6c4f742f7002	2026-03-25 14:52:15.013555	\N	f	2026-04-01 14:52:15.007	2026-03-25 14:52:15.007
276	37	bd0b2176-a83b-4d38-aa09-737ba298e8c4	2026-03-25 14:53:51.108627	\N	f	2026-04-01 14:53:51.02	2026-03-25 14:53:51.02
277	1	f03730e1-f6f1-4635-97ca-47034621c41e	2026-03-25 15:01:40.508563	\N	f	2026-04-01 15:01:40.505	2026-03-25 15:01:40.505
278	1	71ef3d29-3349-485c-9768-eecd20e17e52	2026-03-25 15:15:06.491638	\N	f	2026-04-01 15:15:06.491	2026-03-25 15:15:06.491
279	1	aea00a6a-8b12-4e9a-8d31-4bcb75b31f5d	2026-03-25 15:26:30.844597	\N	f	2026-04-01 15:26:30.839	2026-03-25 15:26:30.839
280	1	91aad3c9-e685-4eb4-8eb1-e23d5e6d8798	2026-03-25 15:54:50.39609	\N	f	2026-04-01 15:54:50.396	2026-03-25 15:54:50.396
281	1	6435666d-9df0-402e-952e-74164499ad2a	2026-03-25 16:03:04.057889	\N	f	2026-04-01 16:03:04.052	2026-03-25 16:03:04.052
282	1	42d23069-2adf-42de-8470-e392ba6b55e3	2026-03-25 16:42:18.107249	\N	f	2026-04-01 16:42:18.098	2026-03-25 16:42:18.098
283	1	6679435a-899d-484f-b7f0-3fbcbffa8cb7	2026-03-25 16:54:02.44043	\N	f	2026-04-01 16:54:02.353	2026-03-25 16:54:02.353
284	1	cd1a1b69-fba1-40c5-b97a-375fe5dd2f2b	2026-03-25 17:07:11.093117	\N	f	2026-04-01 17:07:11.093	2026-03-25 17:07:11.093
285	1	4feeef29-7d60-43ed-b3a9-4578d4da7298	2026-03-25 17:08:47.693891	\N	f	2026-04-01 17:08:47.694	2026-03-25 17:08:47.694
286	1	e87f5f63-022e-4835-a49f-e5d617b3c821	2026-03-25 19:58:08.587556	\N	f	2026-04-01 19:58:08.584	2026-03-25 19:58:08.584
287	37	ea6a9802-dd02-4615-8248-4bb95cbc4d59	2026-03-25 19:59:48.382252	\N	f	2026-04-01 19:59:48.381	2026-03-25 19:59:48.381
288	1	01ade2ee-e2d6-4be2-a139-379f553aa5a8	2026-03-25 20:11:21.79107	\N	f	2026-04-01 20:11:21.79	2026-03-25 20:11:21.79
289	1	809893c7-8586-4575-9d7b-0ffb3f6f06e2	2026-03-25 21:34:36.095224	\N	f	2026-04-01 21:34:36.092	2026-03-25 21:34:36.092
290	1	ec358aaa-0298-4b3c-90f3-17a7f974f30d	2026-03-25 23:20:13.739522	\N	f	2026-04-01 23:20:13.739	2026-03-25 23:20:13.739
291	3	d1c1e39b-61fb-4c7e-8672-114ab44f9c60	2026-03-26 01:15:22.645757	\N	f	2026-04-02 01:15:22.643	2026-03-26 01:15:22.643
292	3	ad1dbbd9-d586-4559-a9dc-12fecbf6bc96	2026-03-26 01:15:23.143191	\N	f	2026-04-02 01:15:23.14	2026-03-26 01:15:23.14
293	1	ddb4fd44-e1ba-45b6-8e8d-8a534217f7ff	2026-03-26 01:39:46.891065	\N	f	2026-04-02 01:39:46.889	2026-03-26 01:39:46.889
294	1	980db433-8df2-4776-a456-0031459e24b4	2026-03-26 01:52:18.71315	\N	f	2026-04-02 01:52:18.707	2026-03-26 01:52:18.707
295	1	71152fab-74c6-4963-85e2-698d289d7ef1	2026-03-26 02:03:36.002198	\N	f	2026-04-02 02:03:36	2026-03-26 02:03:36
296	1	b36fda69-c3bd-4c84-9b74-b3caa84011b4	2026-03-30 00:05:03.923298	\N	f	2026-04-06 00:05:03.932	2026-03-30 00:05:03.932
297	1	a2625d02-ba10-4a88-b3f0-6f1b5b3b73e5	2026-03-30 00:16:44.668548	\N	f	2026-04-06 00:16:44.665	2026-03-30 00:16:44.665
298	1	ce7a1a76-b870-4b32-8019-1439907a6f2b	2026-03-30 01:26:15.532546	\N	f	2026-04-06 01:26:15.539	2026-03-30 01:26:15.539
299	3	fd152905-c85b-4ee9-934f-489c32ebf9ed	2026-03-30 02:38:51.460138	\N	f	2026-04-06 02:38:51.454	2026-03-30 02:38:51.454
300	3	12ccc027-52cc-4f93-a1fa-13b16beafdae	2026-03-30 02:40:57.556918	\N	f	2026-04-06 02:40:57.468	2026-03-30 02:40:57.468
301	1	624fc89c-062b-400d-b1f4-e28a32c90ccf	2026-03-30 02:56:45.386939	\N	f	2026-04-06 02:56:45.384	2026-03-30 02:56:45.384
302	3	c65ab5c1-4a52-4e0f-8d8c-f51e92ad0a06	2026-03-30 02:57:08.172663	\N	f	2026-04-06 02:57:08.084	2026-03-30 02:57:08.084
303	1	6ef36124-8d21-49c9-8ac9-a524e6d2ba21	2026-03-30 03:30:52.531252	\N	f	2026-04-06 03:30:52.515	2026-03-30 03:30:52.515
304	1	76be09e3-4b30-47b0-a40e-88caff7c1e7c	2026-03-30 04:07:08.840196	\N	f	2026-04-06 04:07:08.838	2026-03-30 04:07:08.838
305	1	abecbba9-4d10-4b96-a68e-5c8dae93e075	2026-03-30 04:14:26.657841	\N	f	2026-04-06 04:14:26.654	2026-03-30 04:14:26.654
306	1	c565c5f0-8a8f-4cb0-afbe-0fe947cf5fdd	2026-03-30 20:09:44.190102	\N	f	2026-04-06 20:09:44.193	2026-03-30 20:09:44.193
307	1	dc092caa-fa62-426a-bcf0-fd2267dc6133	2026-03-30 22:30:00.315245	\N	f	2026-04-06 17:30:00.208	2026-03-30 17:30:00.208
308	1	a5fc2a1e-996a-4051-9705-726fcc38ab3f	2026-03-30 23:22:50.184596	\N	f	2026-04-06 18:22:50.071	2026-03-30 18:22:50.071
309	1	96a7dc78-98b6-4f30-af1c-bde5b55ed2e2	2026-03-30 23:33:34.788529	\N	f	2026-04-06 18:33:34.68	2026-03-30 18:33:34.68
310	1	e46dd258-00c4-4cd5-8fb3-0b2080a22080	2026-03-30 23:39:02.750395	\N	f	2026-04-06 18:39:02.64	2026-03-30 18:39:02.64
311	1	1db6d28e-7a87-4f7b-8735-f93a325842eb	2026-03-30 23:47:34.467966	\N	f	2026-04-06 18:47:34.364	2026-03-30 18:47:34.364
312	1	ad2b23f4-a97e-489e-b99f-662079faf503	2026-03-30 23:56:10.086428	\N	f	2026-04-06 18:56:09.978	2026-03-30 18:56:09.978
313	1	f207e07a-50b3-4a24-b709-f6495cab4096	2026-03-31 00:10:32.618412	\N	f	2026-04-06 19:10:32.507	2026-03-30 19:10:32.507
314	1	09c6adf4-0812-4813-ad68-8b9b04f3d25c	2026-03-31 00:20:00.054699	\N	f	2026-04-06 19:19:59.946	2026-03-30 19:19:59.946
315	1	f8acfa33-5e53-4171-852e-23b296a586c6	2026-03-31 00:27:22.435347	\N	f	2026-04-06 19:27:22.32	2026-03-30 19:27:22.32
316	1	463e60ce-2290-41f0-84e9-2431cd28bfae	2026-03-31 00:32:39.625032	\N	f	2026-04-06 19:32:39.511	2026-03-30 19:32:39.511
317	1	9719e17a-7edc-4c82-bdfa-536a09826c95	2026-03-31 00:42:44.1133	\N	f	2026-04-06 19:42:43.992	2026-03-30 19:42:43.992
318	1	f4920268-18c5-400d-b3f1-2ad0a41e7af4	2026-03-31 00:59:28.337563	\N	f	2026-04-06 19:59:28.148	2026-03-30 19:59:28.148
319	1	e709379f-83fc-44b9-8cd9-c96af941cb54	2026-03-31 01:50:18.651127	\N	f	2026-04-07 01:50:18.647	2026-03-31 01:50:18.647
320	1	3ea89daa-3eb9-46b4-b27d-fcd03992fc96	2026-03-31 02:01:03.162265	\N	f	2026-04-07 02:01:03.157	2026-03-31 02:01:03.157
321	1	d8af3a4f-f5ba-450f-a553-625a05cb3d58	2026-03-31 02:41:40.121215	\N	f	2026-04-07 02:41:40.122	2026-03-31 02:41:40.122
322	1	c7b565e6-aca0-406e-8b32-dc0c96fb0ddf	2026-03-31 03:42:14.79833	\N	f	2026-04-07 03:42:14.798	2026-03-31 03:42:14.798
323	1	ad6b617f-3f06-4096-a97d-d84c6593dd4e	2026-03-31 12:21:09.818306	\N	f	2026-04-07 12:21:09.807	2026-03-31 12:21:09.807
324	3	3bb8f4cd-c07f-4633-8376-9598abea46c5	2026-03-31 12:38:01.719246	\N	f	2026-04-07 12:38:01.705	2026-03-31 12:38:01.705
325	1	8e804239-f654-45b9-b582-a2610d5b450d	2026-03-31 12:40:45.819391	\N	f	2026-04-07 12:40:45.805	2026-03-31 12:40:45.805
326	3	41982c96-8892-4ece-a36d-e738d4404c9a	2026-03-31 14:55:47.621034	\N	f	2026-04-07 14:55:47.619	2026-03-31 14:55:47.619
327	1	3c58e9f5-4d31-4d40-94b8-75708bedcffb	2026-03-31 14:56:16.222862	\N	f	2026-04-07 14:56:16.221	2026-03-31 14:56:16.221
328	4	be713eac-93f5-469a-a92f-8c18153a9edb	2026-03-31 14:57:10.617633	\N	f	2026-04-07 14:57:10.616	2026-03-31 14:57:10.616
329	4	28daf5d9-6aeb-4ce9-897d-24e7d4ecdd26	2026-03-31 14:57:13.140339	\N	f	2026-04-07 14:57:13.122	2026-03-31 14:57:13.122
330	4	0a2d4617-54a5-42c3-8b6c-0458b10b6ef0	2026-03-31 14:57:15.724681	\N	f	2026-04-07 14:57:15.723	2026-03-31 14:57:15.723
331	3	122cca5b-48ba-45d2-9be3-34c70c739a6c	2026-03-31 14:57:49.515708	\N	f	2026-04-07 14:57:49.513	2026-03-31 14:57:49.513
332	4	88af5946-7012-4507-b394-9e3add9308ec	2026-03-31 14:58:07.92239	\N	f	2026-04-07 14:58:07.921	2026-03-31 14:58:07.921
333	4	fd01e16e-cb6f-49dc-891d-a3fcc95b78c4	2026-03-31 15:09:08.943581	\N	f	2026-04-07 15:09:08.939	2026-03-31 15:09:08.939
334	4	c02c7e61-d37b-46c4-bbdf-29b495f47161	2026-03-31 15:10:17.206997	\N	f	2026-04-07 15:10:17.203	2026-03-31 15:10:17.203
335	4	966a2d9e-bdf1-45fc-a84a-4766a9b74ed4	2026-03-31 16:09:10.844346	\N	f	2026-04-07 16:09:10.837	2026-03-31 16:09:10.837
336	1	52f4c061-c386-4af3-9fee-1ea29b5d078f	2026-03-31 16:17:25.480013	\N	f	2026-04-07 16:17:25.474	2026-03-31 16:17:25.474
337	3	9d6098dd-e283-4fd5-aa95-f79f3ccacb0d	2026-03-31 16:17:42.587548	\N	f	2026-04-07 16:17:42.578	2026-03-31 16:17:42.578
338	4	5f092a86-b3ad-4ed3-9347-ffdeaf319434	2026-03-31 16:18:48.58285	\N	f	2026-04-07 16:18:48.577	2026-03-31 16:18:48.577
339	3	d50dedd8-29af-4f83-9ef6-3f2996a1d42c	2026-03-31 16:19:28.682556	\N	f	2026-04-07 16:19:28.677	2026-03-31 16:19:28.677
340	1	97dbcc31-c78f-4d9f-9d69-6cd9d0c8d440	2026-03-31 16:34:32.561672	\N	f	2026-04-07 16:34:32.558	2026-03-31 16:34:32.558
341	4	e93c52a4-4660-4653-8348-6557567e659b	2026-03-31 16:34:44.572376	\N	f	2026-04-07 16:34:44.569	2026-03-31 16:34:44.569
342	4	cea9213e-110f-4ca3-bd35-c96fa6edf069	2026-03-31 16:46:52.799143	\N	f	2026-04-07 16:46:52.793	2026-03-31 16:46:52.793
343	2	c12f1a2a-43da-4974-93a3-0b497b9cb374	2026-03-31 17:03:55.042794	\N	f	2026-04-07 17:03:55.038	2026-03-31 17:03:55.038
344	1	365e6f2a-b18c-404f-aeb7-0951c24cee64	2026-03-31 17:04:45.838249	\N	f	2026-04-07 17:04:45.833	2026-03-31 17:04:45.833
345	3	187a0151-eaeb-45cd-851e-308e634ddc92	2026-03-31 17:05:37.747352	\N	f	2026-04-07 17:05:37.743	2026-03-31 17:05:37.743
346	1	3e869608-f806-40d4-90c7-ce69dd1d5b9e	2026-03-31 17:05:55.549135	\N	f	2026-04-07 17:05:55.544	2026-03-31 17:05:55.544
347	1	7fbbd6b7-2e69-4af6-a1ad-e8627d3e2455	2026-03-31 17:13:24.835469	\N	f	2026-04-07 17:13:24.831	2026-03-31 17:13:24.831
348	1	3a88d2e8-cf23-475d-aecd-75a1421006dd	2026-03-31 17:16:22.31356	\N	f	2026-04-07 17:16:22.312	2026-03-31 17:16:22.312
349	38	b9e34f65-9485-4cd3-ae7c-ca0074df8569	2026-03-31 17:19:00.614384	\N	f	2026-04-07 17:19:00.611	2026-03-31 17:19:00.611
350	1	058796ef-024c-41a6-be2a-e465a97a5405	2026-03-31 17:19:25.306889	\N	f	2026-04-07 17:19:25.307	2026-03-31 17:19:25.307
351	38	049ced06-52bc-4822-86b5-7a27f2f06110	2026-03-31 17:21:24.202258	\N	f	2026-04-07 17:21:24.203	2026-03-31 17:21:24.203
352	4	9722965b-e769-442b-a906-dd077494adf1	2026-03-31 17:21:58.504626	\N	f	2026-04-07 17:21:58.504	2026-03-31 17:21:58.504
353	38	6b69ed3a-8e56-4fd0-8f12-5dea465306c8	2026-03-31 17:38:18.801958	\N	f	2026-04-07 17:38:18.804	2026-03-31 17:38:18.804
354	1	71eb939d-ce51-4685-8576-3ac8b5db27d5	2026-03-31 18:22:39.938128	\N	f	2026-04-07 18:22:39.943	2026-03-31 18:22:39.943
355	1	5aa83a8b-166b-440b-a6f7-9258cbab876c	2026-03-31 18:57:00.755592	\N	f	2026-04-07 18:57:00.765	2026-03-31 18:57:00.765
356	38	f73c1d98-527e-46d0-a1f8-8d90d42d8aa5	2026-03-31 19:02:59.657308	\N	f	2026-04-07 19:02:59.666	2026-03-31 19:02:59.666
357	1	ca422fdc-9382-4686-9919-a932884ec441	2026-03-31 19:26:31.821278	\N	f	2026-04-07 19:26:31.829	2026-03-31 19:26:31.829
358	1	2537a66c-2bf7-4d1d-9691-e191d57009b4	2026-04-03 00:38:30.854667	\N	f	2026-04-10 00:38:30.854	2026-04-03 00:38:30.854
359	1	0ead21b1-6874-4153-a624-2bd01edb9095	2026-04-03 00:52:09.464021	\N	f	2026-04-10 00:52:09.464	2026-04-03 00:52:09.464
360	3	a9c8cf5c-84af-405f-b37f-1eeea19f753b	2026-04-03 01:04:51.371716	\N	f	2026-04-10 01:04:51.371	2026-04-03 01:04:51.371
361	4	c7ca1998-5156-4364-a4b0-2553a5f6ed03	2026-04-03 01:05:23.571996	\N	f	2026-04-10 01:05:23.571	2026-04-03 01:05:23.571
362	3	ed290f58-68d1-4303-9beb-962851084a1c	2026-04-03 01:06:08.966078	\N	f	2026-04-10 01:06:08.965	2026-04-03 01:06:08.965
363	1	a10c3f57-3556-4edb-97a8-6760acb7cb5d	2026-04-03 01:06:30.163555	\N	f	2026-04-10 01:06:30.161	2026-04-03 01:06:30.161
364	3	f296eed7-bd45-4f50-85c1-8de6254c4ce1	2026-04-03 01:07:03.363589	\N	f	2026-04-10 01:07:03.361	2026-04-03 01:07:03.361
365	1	0c9ca229-2feb-4ff5-a7c8-c5b82ef72efb	2026-04-03 01:50:26.66885	\N	f	2026-04-10 01:50:26.65	2026-04-03 01:50:26.65
366	3	5757d6d2-13a9-4188-b9f3-1f0c15fc972d	2026-04-03 02:18:01.687097	\N	f	2026-04-10 02:18:01.684	2026-04-03 02:18:01.684
367	1	b21ba2a6-af8a-46fb-b173-fa2b47c65a7c	2026-04-03 02:22:06.395656	\N	f	2026-04-10 02:22:06.393	2026-04-03 02:22:06.393
368	1	0812f0ec-5ae4-4f24-995f-0d1add572d7b	2026-04-03 02:42:49.976312	\N	f	2026-04-10 02:42:49.973	2026-04-03 02:42:49.973
369	3	dd20c47e-d7ef-4e15-aba9-f4f8c6dcf163	2026-04-03 02:43:51.867265	\N	f	2026-04-10 02:43:51.864	2026-04-03 02:43:51.864
370	1	884c8b1d-5eb2-45ce-9e03-141a22b02e97	2026-04-03 02:51:53.506356	\N	f	2026-04-10 02:51:53.504	2026-04-03 02:51:53.504
371	3	35ac7e4f-05bf-4a00-8612-6921ef8f0bdf	2026-04-03 02:52:24.109569	\N	f	2026-04-10 02:52:24.108	2026-04-03 02:52:24.108
372	1	31c00cf1-f1ec-4caa-b763-7f1ed698ec39	2026-04-03 04:00:48.749373	\N	f	2026-04-10 04:00:48.749	2026-04-03 04:00:48.749
373	1	84794f8b-eecd-4ca1-9071-a237eeaa8011	2026-04-03 04:13:42.569826	\N	f	2026-04-10 04:13:42.568	2026-04-03 04:13:42.568
374	1	fedfdcf8-ea5a-41a3-a83f-ea168daac26f	2026-04-03 04:19:06.678363	\N	f	2026-04-10 04:19:06.677	2026-04-03 04:19:06.677
375	3	e84c2d03-978b-4986-b63c-ae6de3ec0f44	2026-04-03 04:21:27.270248	\N	f	2026-04-10 04:21:27.269	2026-04-03 04:21:27.269
376	3	986ab73c-49a1-4024-b27b-3f0760d8f536	2026-04-03 04:23:31.571056	\N	f	2026-04-10 04:23:31.569	2026-04-03 04:23:31.569
377	1	432e2e5b-8d24-46a2-b46d-26d6657a2055	2026-04-03 05:23:48.406653	\N	f	2026-04-10 05:23:48.396	2026-04-03 05:23:48.396
378	3	bfab967e-c6d7-4cdb-b991-ab49f2ce23fb	2026-04-03 05:24:29.386537	\N	f	2026-04-10 05:24:29.381	2026-04-03 05:24:29.381
379	1	d6469add-f14f-4994-aba6-db5a7a600d4c	2026-04-03 05:29:20.431552	\N	f	2026-04-10 05:29:20.425	2026-04-03 05:29:20.425
380	3	53cd11d3-b71e-477f-930d-f6a88b62fa94	2026-04-03 05:30:42.226912	\N	f	2026-04-10 05:30:42.141	2026-04-03 05:30:42.141
381	3	c9adf27c-7626-48cb-ad4f-7e7316a23090	2026-04-03 06:14:00.579553	\N	f	2026-04-10 06:14:00.558	2026-04-03 06:14:00.558
382	3	6f7b008c-b8d0-4a26-8bb2-7a0ca7cee481	2026-04-03 06:15:06.269592	\N	f	2026-04-10 06:15:06.256	2026-04-03 06:15:06.256
383	3	5527646a-e5e1-40f7-8adf-9188cc314fb5	2026-04-03 06:22:01.074852	\N	f	2026-04-10 06:22:01.071	2026-04-03 06:22:01.071
384	3	bc8c2696-839b-495f-b544-ab2fb79bd2a4	2026-04-03 06:24:01.871033	\N	f	2026-04-10 06:24:01.867	2026-04-03 06:24:01.867
385	5	0968cfed-dde3-463e-b20a-8464896a33be	2026-04-06 11:37:05.102387	\N	f	2026-04-13 11:37:05.098	2026-04-06 11:37:05.098
386	3	526d0b1f-fca8-486d-90e8-a1c5da5f1686	2026-04-06 11:39:22.805793	\N	f	2026-04-13 11:39:22.804	2026-04-06 11:39:22.804
387	3	8d70d0e5-dc2a-4eac-b75e-1387d4b966fb	2026-04-06 11:40:15.094421	\N	f	2026-04-13 11:40:15.007	2026-04-06 11:40:15.007
388	3	1fc9e823-1055-4c08-b76b-cb6f298d0408	2026-04-06 11:40:42.200109	\N	f	2026-04-13 11:40:42.198	2026-04-06 11:40:42.198
389	3	1a3889bf-eb6b-443a-87b6-1edfb24fe0ac	2026-04-06 11:58:22.106661	\N	f	2026-04-13 11:58:22.102	2026-04-06 11:58:22.102
390	1	d0db4cee-25e3-4543-ac49-56cf58379665	2026-04-06 13:05:54.229569	\N	f	2026-04-13 13:05:54.228	2026-04-06 13:05:54.228
391	1	c50b9af3-499a-4561-addb-1093e198dfd9	2026-04-06 16:50:32.586129	\N	f	2026-04-13 16:50:32.584	2026-04-06 16:50:32.584
392	1	75b81fdb-0660-4dac-b0f4-c626f519d015	2026-04-06 18:08:26.592439	\N	f	2026-04-13 18:08:26.585	2026-04-06 18:08:26.585
393	1	058fd037-037c-457a-a64f-a608039e89eb	2026-04-06 18:14:05.514564	\N	f	2026-04-13 18:14:05.504	2026-04-06 18:14:05.504
394	3	c47734f0-c23d-489f-85de-68578b623d5d	2026-04-07 00:24:45.240143	\N	f	2026-04-14 00:24:45.239	2026-04-07 00:24:45.239
395	1	eb00357f-08b5-4645-afa7-40bbb73abca8	2026-04-07 14:23:53.913333	\N	f	2026-04-14 14:23:53.907	2026-04-07 14:23:53.907
396	3	5a6a995d-9092-4bc2-aa25-3075136017fb	2026-04-07 14:25:31.105572	\N	f	2026-04-14 14:25:31.1	2026-04-07 14:25:31.1
397	5	f78e7053-85f1-4adf-b6d8-1ea5daac2e49	2026-04-07 14:26:05.312561	\N	f	2026-04-14 14:26:05.308	2026-04-07 14:26:05.308
398	1	f5feb366-e91d-4263-ac3f-46f2747fde94	2026-04-07 14:27:41.105601	\N	f	2026-04-14 14:27:41.101	2026-04-07 14:27:41.101
399	24	3f9fb6c9-2604-459d-bd2b-233d30341ec4	2026-04-07 14:29:11.743532	\N	f	2026-04-14 14:29:11.739	2026-04-07 14:29:11.739
400	24	a77aa308-a5e3-41c4-8bef-d68d80dfa9ca	2026-04-07 14:29:11.899893	\N	f	2026-04-14 14:29:11.844	2026-04-07 14:29:11.844
401	24	3a8e1b4e-cdda-4032-96c4-88aca6e64a8a	2026-04-07 14:29:51.706043	\N	f	2026-04-14 14:29:51.702	2026-04-07 14:29:51.702
402	24	ef4a4957-22ae-4664-a527-d6a181c31539	2026-04-07 14:31:40.417013	\N	f	2026-04-14 14:31:40.413	2026-04-07 14:31:40.413
403	1	3a21ad6c-a646-4a79-a8a4-5d83a8bcc9a5	2026-04-07 14:50:48.602922	\N	f	2026-04-14 14:50:48.599	2026-04-07 14:50:48.599
404	10	2424ad3e-50a9-42a1-9b15-8bf4db75d1b4	2026-04-07 14:52:25.733227	\N	f	2026-04-14 14:52:25.729	2026-04-07 14:52:25.729
405	10	489fedeb-4cd9-4199-a64c-2aea29374a0e	2026-04-07 14:53:34.30826	\N	f	2026-04-14 14:53:34.304	2026-04-07 14:53:34.304
406	1	4e7309d6-3a3f-40ae-a6a0-7781eef9eb15	2026-04-07 15:15:52.701016	\N	f	2026-04-14 15:15:52.697	2026-04-07 15:15:52.697
407	25	e428b82b-be4b-477a-b13f-776e644ba027	2026-04-07 15:16:59.009216	\N	f	2026-04-14 15:16:59.003	2026-04-07 15:16:59.003
408	25	d799b4a5-57cf-4a1b-aece-ac6975878514	2026-04-07 15:17:50.720576	\N	f	2026-04-14 15:17:50.7	2026-04-07 15:17:50.7
409	1	ae9dd22a-6657-4459-a13a-7d4769b34f55	2026-04-07 15:51:01.643541	\N	f	2026-04-14 15:51:01.638	2026-04-07 15:51:01.638
410	27	f4511a87-498b-425a-ab45-cd0cb9073c76	2026-04-07 15:52:06.006937	\N	f	2026-04-14 15:52:06.002	2026-04-07 15:52:06.002
411	27	f004163b-9865-4c82-8bf3-1f9a97eced92	2026-04-07 16:06:11.833642	\N	f	2026-04-14 16:06:11.82	2026-04-07 16:06:11.82
412	3	f13e5344-74ed-459f-9471-6bcb0cd5db9c	2026-04-07 16:37:48.907958	\N	f	2026-04-14 16:37:48.903	2026-04-07 16:37:48.903
413	1	29e5d088-fccb-4fc4-9a1f-4b21bcbec7d7	2026-04-07 16:38:20.608792	\N	f	2026-04-14 16:38:20.602	2026-04-07 16:38:20.602
414	1	141bf792-c1be-41b8-aeed-0d5f32f81e1f	2026-04-07 20:32:38.030895	\N	f	2026-04-14 20:32:38.025	2026-04-07 20:32:38.025
415	1	f4c1575b-7f83-473b-8d35-42bfca721a1f	2026-04-07 20:35:16.3106	\N	f	2026-04-14 20:35:16.309	2026-04-07 20:35:16.309
416	1	16162ef1-1ca3-4fe2-8366-3946d45b5276	2026-04-08 04:16:38.729994	\N	f	2026-04-15 04:16:38.718	2026-04-08 04:16:38.718
417	1	48331c67-78e6-4b1b-bbe9-87d696abe65a	2026-04-08 04:21:32.526917	\N	f	2026-04-15 04:21:32.519	2026-04-08 04:21:32.519
418	32	e082106c-a9f2-489f-90ce-5310fa1056c1	2026-04-08 04:22:18.307751	\N	f	2026-04-15 04:22:18.3	2026-04-08 04:22:18.3
419	31	6bcd3f24-e1c3-443e-8c2c-20affe167f6c	2026-04-08 04:23:00.234428	\N	f	2026-04-15 04:23:00.227	2026-04-08 04:23:00.227
420	6	e8c5baad-2d2b-4af5-8ab9-ab3396c7d10c	2026-04-08 04:23:08.132639	\N	f	2026-04-15 04:23:08.124	2026-04-08 04:23:08.124
421	7	8502aa7c-b954-4a3d-94d2-527b4f533c82	2026-04-08 04:23:36.609586	\N	f	2026-04-15 04:23:36.599	2026-04-08 04:23:36.599
422	8	8e3fedc5-5b50-40a9-925c-b149d3f56f21	2026-04-08 04:23:49.60737	\N	f	2026-04-15 04:23:49.6	2026-04-08 04:23:49.6
423	9	c2b4d7df-3383-4088-9a5a-1879fcb7ec15	2026-04-08 04:24:00.033813	\N	f	2026-04-15 04:24:00.024	2026-04-08 04:24:00.024
424	11	659ace3e-8a6d-4f58-8603-3542f48d0084	2026-04-08 04:24:13.406512	\N	f	2026-04-15 04:24:13.399	2026-04-08 04:24:13.399
425	12	34157123-6571-43c7-bae6-3815d1278b70	2026-04-08 04:24:30.618404	\N	f	2026-04-15 04:24:30.605	2026-04-08 04:24:30.605
426	13	838fedc7-f09c-4a1e-9adb-6d39cf48a4c3	2026-04-08 04:24:45.512379	\N	f	2026-04-15 04:24:45.505	2026-04-08 04:24:45.505
427	14	917e3fb7-1158-4d42-8509-21ba55586261	2026-04-08 04:24:56.609726	\N	f	2026-04-15 04:24:56.599	2026-04-08 04:24:56.599
428	15	2b451e14-263a-433f-b004-db5f224241ff	2026-04-08 04:25:28.825562	\N	f	2026-04-15 04:25:28.814	2026-04-08 04:25:28.814
429	16	f7a46326-f559-48a7-9221-f6ecdb61c2fa	2026-04-08 04:25:55.011033	\N	f	2026-04-15 04:25:55.003	2026-04-08 04:25:55.003
430	17	64466d2b-b91d-461f-a449-3aa020da0658	2026-04-08 04:26:21.407173	\N	f	2026-04-15 04:26:21.4	2026-04-08 04:26:21.4
431	18	ac2c4665-3d67-4385-81b9-86079acc9c90	2026-04-08 04:26:53.233551	\N	f	2026-04-15 04:26:53.205	2026-04-08 04:26:53.205
432	19	8ccc86c2-6ff2-47e3-8185-02809097cb1b	2026-04-08 04:27:23.649253	\N	f	2026-04-15 04:27:23.642	2026-04-08 04:27:23.642
433	20	46152213-0eaf-473a-a15f-0cbd7182c82c	2026-04-08 04:27:42.946588	\N	f	2026-04-15 04:27:42.939	2026-04-08 04:27:42.939
434	21	e4b32b64-1b4f-4c71-93cc-3db29fe9fcbe	2026-04-08 04:28:06.216571	\N	f	2026-04-15 04:28:06.207	2026-04-08 04:28:06.207
435	22	702d3c8f-5bbe-45b1-9571-e67bd1e3525d	2026-04-08 04:28:37.2069	\N	f	2026-04-15 04:28:37.2	2026-04-08 04:28:37.2
436	26	5f1a2ee7-ad8f-4b7c-be8d-3ac4696c8685	2026-04-08 04:29:24.748407	\N	f	2026-04-15 04:29:24.732	2026-04-08 04:29:24.732
437	28	5de60c3a-f5aa-4ad1-bda1-5b03d148e40c	2026-04-08 04:30:01.219973	\N	f	2026-04-15 04:30:01.213	2026-04-08 04:30:01.213
438	29	6993a173-0b10-4347-ac89-8078ce5e3c76	2026-04-08 04:30:24.208413	\N	f	2026-04-15 04:30:24.201	2026-04-08 04:30:24.201
439	30	fcb03f0b-360d-4ef5-b417-83c41a55314d	2026-04-08 04:30:47.41427	\N	f	2026-04-15 04:30:47.407	2026-04-08 04:30:47.407
440	31	e1f77137-8242-40cd-91cb-24e4b59560f8	2026-04-08 04:31:12.411163	\N	f	2026-04-15 04:31:12.404	2026-04-08 04:31:12.404
441	36	0df796ba-0578-4ffd-bfcd-a87443bc32f3	2026-04-08 04:32:20.53076	\N	f	2026-04-15 04:32:20.521	2026-04-08 04:32:20.521
442	34	a6c2074b-6ac8-4fff-8346-64a29724c4fa	2026-04-08 04:32:32.012638	\N	f	2026-04-15 04:32:32.001	2026-04-08 04:32:32.001
443	33	e617f471-ba84-4843-a957-3a0a822eee80	2026-04-08 04:32:43.434637	\N	f	2026-04-15 04:32:43.398	2026-04-08 04:32:43.398
444	32	db1443e8-0a73-4cbb-967a-9a6a328f9540	2026-04-08 04:32:59.153942	\N	f	2026-04-15 04:32:59.147	2026-04-08 04:32:59.147
445	31	b94a9cd9-0c28-49a2-910b-047b953cb72a	2026-04-08 04:33:12.212901	\N	f	2026-04-15 04:33:12.205	2026-04-08 04:33:12.205
446	18	12cbb29d-8dc0-4bb9-8f5f-46b7fa52fe4b	2026-04-08 13:17:22.534439	\N	f	2026-04-15 13:17:22.533	2026-04-08 13:17:22.533
447	18	9cbb2392-a635-405f-94f3-514524a48505	2026-04-08 13:19:55.400027	\N	f	2026-04-15 13:19:55.399	2026-04-08 13:19:55.399
448	3	224b4700-39dd-47f6-9210-a4afaba7e18e	2026-04-08 13:23:50.403135	\N	f	2026-04-15 13:23:50.401	2026-04-08 13:23:50.401
449	18	0f14fbc0-602f-46ae-9b91-84487348a3b6	2026-04-08 13:24:11.114695	\N	f	2026-04-15 13:24:11.113	2026-04-08 13:24:11.113
450	1	46aaab8b-7f99-4b9f-a634-1147d6abbe8a	2026-04-08 17:01:08.312439	\N	f	2026-04-15 17:01:08.31	2026-04-08 17:01:08.31
451	1	67a0d37f-5754-45be-8d8a-c61eeb72a7bd	2026-04-08 17:28:13.420654	\N	f	2026-04-15 17:28:13.402	2026-04-08 17:28:13.402
452	36	c7d7500b-4176-424c-80a3-bcfc7428c059	2026-04-08 19:32:11.711544	\N	f	2026-04-15 19:32:11.699	2026-04-08 19:32:11.699
453	1	4eafe79d-4b8c-4ba2-b1b1-37014540fc14	2026-04-08 23:53:03.539058	\N	f	2026-04-15 23:53:03.539	2026-04-08 23:53:03.539
454	1	92b3012d-840e-4a68-87c0-c2e25ea9d820	2026-04-08 23:53:47.307648	\N	f	2026-04-15 23:53:47.3	2026-04-08 23:53:47.3
455	1	1ff0f364-d4fb-4eee-9fb2-daf4137fa641	2026-04-09 00:33:18.605512	\N	f	2026-04-16 00:33:18.599	2026-04-09 00:33:18.599
456	1	2ce24894-a348-4fe8-878d-653bb20b3673	2026-04-09 00:38:27.075075	\N	f	2026-04-16 00:38:27.071	2026-04-09 00:38:27.071
457	1	eebd5d32-e993-48e7-bac1-a4aedc2e1eae	2026-04-09 00:45:16.87307	\N	f	2026-04-16 00:45:16.874	2026-04-09 00:45:16.874
458	3	904bcd5c-a2ed-4b4d-8803-bf8a4cb28be4	2026-04-09 01:01:40.425436	\N	f	2026-04-16 01:01:40.428	2026-04-09 01:01:40.428
459	1	ddce7ca2-b15c-4f63-be13-bf6b7b36a19c	2026-04-09 01:01:49.732901	\N	f	2026-04-16 01:01:49.735	2026-04-09 01:01:49.735
460	1	3294855c-5d31-4ed0-8da6-79d90b59ede1	2026-04-09 01:03:18.624089	\N	f	2026-04-16 01:03:18.626	2026-04-09 01:03:18.626
461	1	d2d3bd8e-643c-4328-b5f1-d9e972efac4d	2026-04-09 01:09:50.419758	\N	f	2026-04-16 01:09:50.422	2026-04-09 01:09:50.422
462	1	3f266fd4-7ab9-42b9-a214-e9d6dd7c78a1	2026-04-09 01:49:30.891381	\N	f	2026-04-16 01:49:30.893	2026-04-09 01:49:30.893
463	3	fb438541-2788-4c21-a39e-e2e5236475cd	2026-04-09 02:21:52.246263	\N	f	2026-04-16 02:21:52.246	2026-04-09 02:21:52.246
464	3	ddeb5377-9d31-4e92-b925-0c23350ab109	2026-04-09 02:21:52.583946	\N	f	2026-04-16 02:21:52.584	2026-04-09 02:21:52.584
465	1	462e4646-a26b-4d48-92e4-8368c7f89c76	2026-04-09 02:22:02.15989	\N	f	2026-04-16 02:22:02.16	2026-04-09 02:22:02.16
466	1	ee1d88e2-3ed7-4c2c-ab2f-eb8d1ebf9dea	2026-04-09 13:00:32.173702	\N	f	2026-04-16 13:00:32.171	2026-04-09 13:00:32.171
467	31	b9a056ee-a01a-4a47-b6a8-e465bf4dd3d1	2026-04-09 14:19:17.669021	\N	f	2026-04-16 14:19:17.665	2026-04-09 14:19:17.665
468	1	5badbe54-2c8c-48e4-bacd-f5b80478604d	2026-04-09 14:26:39.402369	\N	f	2026-04-16 14:26:39.401	2026-04-09 14:26:39.401
469	31	04bab0a1-3340-4f5f-a595-1547fb6b47d5	2026-04-09 14:31:10.466071	\N	f	2026-04-16 14:31:10.464	2026-04-09 14:31:10.464
470	6	7414b3b3-0fd5-4b55-bf80-e29b64454f6e	2026-04-09 14:43:29.896594	\N	f	2026-04-16 14:43:29.892	2026-04-09 14:43:29.892
471	6	cb42b043-1b6d-400e-a7c3-d8865aac5f68	2026-04-09 14:44:02.490172	\N	f	2026-04-16 14:44:02.489	2026-04-09 14:44:02.489
472	1	bd32649d-599b-4e40-a880-43ea1f895703	2026-04-09 14:53:49.992585	\N	f	2026-04-16 14:53:49.99	2026-04-09 14:53:49.99
473	19	cdebe253-03a7-4d56-ad2e-c99368e124bd	2026-04-09 15:01:09.466944	\N	f	2026-04-16 15:01:09.466	2026-04-09 15:01:09.466
474	19	b2db686b-e776-4cf4-9a9f-fce0da2e233d	2026-04-09 15:02:28.892828	\N	f	2026-04-16 15:02:28.892	2026-04-09 15:02:28.892
475	1	799e3ac1-52ee-43d7-b3dc-58181901525b	2026-04-09 15:10:03.471563	\N	f	2026-04-16 15:10:03.469	2026-04-09 15:10:03.469
476	18	869c01a8-7d9e-4c21-8d07-95b37e2baedd	2026-04-09 15:26:46.769869	\N	f	2026-04-16 15:26:46.769	2026-04-09 15:26:46.769
477	18	df7d22e7-61de-4228-92d0-e94d0aa96ede	2026-04-09 15:31:07.799167	\N	f	2026-04-16 15:31:07.798	2026-04-09 15:31:07.798
478	32	7be44b95-4c91-4023-b4e2-93c1702be528	2026-04-09 15:42:04.570818	\N	f	2026-04-16 15:42:04.569	2026-04-09 15:42:04.569
479	1	78f5995c-a038-4c0f-bc47-6c251191eb83	2026-04-09 15:55:03.579992	\N	f	2026-04-16 15:55:03.579	2026-04-09 15:55:03.579
480	1	757e2ab9-b9ce-48af-9087-949c2720051a	2026-04-09 17:07:13.433925	\N	f	2026-04-16 17:07:13.397	2026-04-09 17:07:13.397
481	1	fbfc2b1b-d738-4b87-a5d7-7d26d3cbdb16	2026-04-09 22:26:58.064795	\N	f	2026-04-16 22:26:58.067	2026-04-09 22:26:58.067
482	1	e97db618-d2da-40a7-9ae5-b52989c97ee2	2026-04-09 22:27:31.090475	\N	f	2026-04-16 22:27:31.093	2026-04-09 22:27:31.093
483	1	7c3399fa-36b7-4c96-b85c-5f6d58a96630	2026-04-09 22:28:33.492702	\N	f	2026-04-16 22:28:33.494	2026-04-09 22:28:33.494
484	1	15cd3d92-f509-43d7-8474-840fdebe33fc	2026-04-09 22:34:51.662369	\N	f	2026-04-16 22:34:51.664	2026-04-09 22:34:51.664
485	1	f9fbbcd6-0170-4d2e-84ae-da77fb7110c6	2026-04-09 22:42:49.061266	\N	f	2026-04-16 22:42:49.061	2026-04-09 22:42:49.061
486	1	f6754794-fa75-413a-a001-c6c67717cd63	2026-04-09 23:08:07.208456	\N	f	2026-04-16 23:08:07.209	2026-04-09 23:08:07.209
487	1	abefb57c-956b-4ad7-ae99-aeda460fa0f7	2026-04-10 01:14:12.028534	\N	f	2026-04-17 01:14:12.027	2026-04-10 01:14:12.027
488	1	7121faa1-bfad-4453-856a-330b8f265b40	2026-04-10 01:22:05.333444	\N	f	2026-04-17 01:22:05.332	2026-04-10 01:22:05.332
489	1	8d568725-21dc-4b49-999f-aad6078837e4	2026-04-10 03:10:31.686559	\N	f	2026-04-17 03:10:31.683	2026-04-10 03:10:31.684
490	32	a287a58f-73ae-431b-91bd-668f4f10673a	2026-04-10 15:25:05.845539	\N	f	2026-04-17 15:25:05.842	2026-04-10 15:25:05.842
491	1	f5908a68-f437-4d34-bba8-dd8083e11504	2026-04-10 16:32:09.217029	\N	f	2026-04-17 16:32:09.215	2026-04-10 16:32:09.215
492	32	39a56ebf-3e39-4fe9-aa07-743b60517797	2026-04-10 17:43:07.821856	\N	f	2026-04-17 17:43:07.822	2026-04-10 17:43:07.822
493	12	1974b2ad-1185-4854-af5b-0878cabad2ae	2026-04-11 00:50:41.739835	\N	f	2026-04-18 00:50:41.734	2026-04-11 00:50:41.734
494	12	a5a7489f-7f1f-462e-9aae-e158ae74b3c7	2026-04-11 00:51:21.319561	\N	f	2026-04-18 00:51:21.313	2026-04-11 00:51:21.313
495	1	9fe292be-5893-4395-b1d8-79c324f99248	2026-04-11 22:38:03.134619	\N	f	2026-04-18 22:38:03.11	2026-04-11 22:38:03.11
496	1	549d13a3-ccd0-4ee4-940c-0ad23030a6c6	2026-04-11 22:58:31.73764	\N	f	2026-04-18 22:58:31.733	2026-04-11 22:58:31.733
497	1	59e6d1f4-9fde-472d-98d2-c118cd515a6b	2026-04-11 23:14:47.93796	\N	f	2026-04-18 23:14:47.935	2026-04-11 23:14:47.935
498	1	7fed25c0-0473-417a-ae87-408c759c4e60	2026-04-12 15:16:23.7341	\N	f	2026-04-19 15:16:23.732	2026-04-12 15:16:23.732
499	1	9d050c33-232a-44d9-8539-b8707752d3f8	2026-04-12 22:01:03.848567	\N	f	2026-04-19 22:01:03.848	2026-04-12 22:01:03.848
500	1	b62d8f49-c9ec-46c9-8855-aca0f5d3d5e4	2026-04-12 22:05:20.133345	\N	f	2026-04-19 22:05:20.133	2026-04-12 22:05:20.133
501	81	6a360410-f49d-4b47-b07e-54f530587a57	2026-04-12 22:13:30.975625	\N	f	2026-04-19 22:13:30.975	2026-04-12 22:13:30.975
502	76	069e266f-1ff3-41fd-b422-5a6775cc36b9	2026-04-12 22:34:28.338832	\N	f	2026-04-19 22:34:28.338	2026-04-12 22:34:28.338
503	85	e6495c69-4e03-45c4-8ab5-48a4500a8fd2	2026-04-12 22:34:54.974013	\N	f	2026-04-19 22:34:54.96	2026-04-12 22:34:54.96
\.


--
-- Data for Name: roles; Type: TABLE DATA; Schema: public; Owner: sipad_user
--

COPY public.roles (id, nombre, nivel_acceso, estado, fecha_registro, activa, descripcion, activo, created_at, entidad_id) FROM stdin;
1	Super Admin	100	1	2026-03-14 18:44:59.057929	1	Acceso total	1	2026-03-14 18:53:19.454516	890ef843-7e01-4971-9a9b-5bf107481c43
3	Archivista	70	1	2026-03-15 21:57:47.657617	1	Validación estrategica	1	2026-03-15 21:57:47.657617	890ef843-7e01-4971-9a9b-5bf107481c43
4	Jefe	50	1	2026-03-15 21:58:22.260133	1	General de la oficina	1	2026-03-15 21:58:22.260133	890ef843-7e01-4971-9a9b-5bf107481c43
5	General	10	1	2026-03-15 22:43:23.62103	1	Solo acceso al instrumento de caracterización	1	2026-03-15 22:43:23.62103	890ef843-7e01-4971-9a9b-5bf107481c43
2	Administrador	90	1	2026-03-15 21:57:33.501574	1	Gestión administrativa	1	2026-03-15 21:57:33.501574	890ef843-7e01-4971-9a9b-5bf107481c43
\.


--
-- Data for Name: segtec_actividades; Type: TABLE DATA; Schema: public; Owner: sipad_user
--

COPY public.segtec_actividades (id, dependencia_id, nombre, cargo_ejecutor, tipo_funcion, frecuencia, descripcion_funcional, impacto_juridico_directo, impacto_fiscal_contable, genera_expediente_propio, actividad_permanente, genera_documentos, formato_produccion, volumen_documental, responsable_custodia, norma_aplicable, dependencias_relacionadas, estado_general, created_at, updated_at, requiere_otras_dependencias, tiene_pasos_formales, usuario_id, proceso_id, documentos_generados, localizacion_documentos, plazo_legal, tiempo_ejecucion, recepcion_externa, cargo_custodia, dependencia_custodia, localizacion_otro, volumen_anual_personalizado, entidad_id) FROM stdin;
8f2b932e-a62e-45c5-b185-8ec8ef6560d1	5	Permisos de mineria de subsistencia 	\N	misional	eventual	Generacion de permisos de mineria de subsistencia a través de la plataforma Genesis a los paleros y volqueteros del municipio de Aguachica que los soliciten 	\N	\N	1	\N	1	ambos	anual	misma_dependencia	\N	["1"]	analizada	2026-04-07 15:12:28.162	2026-04-09 17:07:44.737	1	1	24	12352445-146a-4c9f-be89-a4fa0844b83c	1. Permiso de mineria de subsistencia \n2. Recibo pago de regalias. 	computador_personal	\N	\N	1. Sisben del solicitante\n2. Rut del solicitante\n3. Cedula del solicitante\n4. Carta de permiso ingreso al predio (opcional)	21	\N	\N	\N	890ef843-7e01-4971-9a9b-5bf107481c43
312ff70d-808a-42ed-8e3f-05baaab9112a	5	Solicitudes de apoyo o acompañamiento 	\N	misional	eventual	Se realizan oficios de solicitud de apoyo o acompañamiento a diferentes entidades o actores con el fin de realizar actividades ambientales en el municipio (Jornadas de limpieza, siembra, senderismo, campañas de educacion ambiental) 	\N	\N	0	\N	1	digital	menos_10	misma_dependencia	No aplica	[]	analizada	2026-04-07 15:06:25.577	2026-04-09 15:10:51.344	0	1	24	37ea8dfb-1a10-44ea-a573-d0e0cb72bd35	1. Oficio de solicitud de acompañamiento a la entidad ya sea publica o privada. 	servidor	\N	\N	No se requiere de ningun documento para nosotros realizar la solicitud de apoyo. 	21	\N	\N	\N	890ef843-7e01-4971-9a9b-5bf107481c43
cb6ab72c-6760-4754-9175-5c876740dc4e	5	Certificado de publicación de AUTOS	\N	misional	eventual	Certificado de publicación de AUTOS expedidos por instituciones departamentales, nacionales o municipales	\N	\N	1	\N	1	ambos	menos_10	misma_dependencia	Ley 1712 de 2014	[]	caracterizada	2026-04-10 20:50:22.939	2026-04-10 20:50:23.793	0	1	32	68c78480-9351-40fa-84d9-9c68caca7f7f	Certificado	carpeta_oficina	\N	un (1) dia	Carta de solicitud\nDocumento a publicar	3	\N	\N	\N	890ef843-7e01-4971-9a9b-5bf107481c43
aa79cc2e-8c62-45e4-897b-422093951039	5	Visitas de inspeccion ocular 	\N	misional	eventual	Visitas de inspeccion ocular para concepto tecnico de poda, tala o denuncias ambientales; por solicitud de la comunidad. 	\N	\N	0	\N	1	ambos	entre_10_50	misma_dependencia	\N	[]	analizada	2026-04-07 14:44:49.346	2026-04-09 15:56:38.191	0	1	24	78a6a184-aca3-4214-a0c8-b6ceef6d9a39	1. Acta de inspeccion ocular con la descripcion detallada y el registro fotografico. 	computador_personal	\N	\N	La solicitud formal de la persona donde requiere una visita de inspeccion ocular. 	21	\N	\N	\N	890ef843-7e01-4971-9a9b-5bf107481c43
992ca27f-b647-4bd4-8d3c-fee3cf1b4753	5	EMPRENDIMIENTO Y DESARROLLO TURISTICO	\N	apoyo	diaria	SE INDAGA SOBRE CONVOCATORIAS DEL ORDEN NACIONAL, DEPARTAMETNAL O MUNICIPAL, PARA ORIENTAR A LOS EMPRENDEDORES Y LOGRAR SU PARTICIPACION Y MEJORAMIETNO EN SU ACTIVIDAD 	\N	\N	1	\N	1	ambos	menos_10	misma_dependencia	\N	["5"]	analizada	2026-04-08 13:39:52.142	2026-04-10 01:29:09.873	1	0	18	c5ed4e02-63aa-43a8-a15d-ab10bbe481c7	OFICIOS DE INFORMACION\nPALNILLAS DE  CONTROL DE ASISTENCIAS \nEVIDENCIAS FOTOGRAFICAS	carpeta_oficina	\N	\N	OFICIOS\nRESOLUCIONES\nFOLLETOS DE PUBLICIPLANILALS \n	21	\N	\N	\N	890ef843-7e01-4971-9a9b-5bf107481c43
6ef74829-02c5-444a-a8cb-10041bf32883	5	Respuestas a oficios en el area ambiental 	\N	misional	eventual	Se proyecta la respuesta a oficios que radican en la gerencia de planeacion y obras correspondientes a un tema ambiental, pueden ser con distintos tipos de finalidades (solicitud de informacion, espacio para reunion, etc) 	\N	\N	0	\N	1	digital	entre_10_50	misma_dependencia	\N	[]	analizada	2026-04-07 15:01:09.35	2026-04-09 00:15:08.362	0	1	24	d4b06eec-d90e-47c0-8ed8-add590dae557	Se genere la respuesta a dicho oficio que nos radicaron. 	servidor	\N	\N	El radicado ya sea fisico o digital del oficio de la persona. 	21	\N	\N	\N	890ef843-7e01-4971-9a9b-5bf107481c43
263a18b4-ddc9-4dd6-8c8e-4e50140a9089	5	Apoyar en la formulación de proyectos de inversión	\N	misional	eventual	Se realiza la formulación de proyectos de inversión publica	\N	\N	1	\N	1	digital	anual	misma_dependencia	\N	["4","6","9","8"]	analizada	2026-04-07 15:37:28.488	2026-04-09 00:15:31.781	1	0	25	4f2b02c5-9d3a-4036-95cc-aceee8d2557f	Documento tecnico\n	computador_personal	\N	\N	Informe basico de los proyectos a formular	21	\N	\N	\N	890ef843-7e01-4971-9a9b-5bf107481c43
33764cc9-20d9-4eec-92ef-1a4cf9a32f9c	5	Inspeccion tecnica y/o ocular 	\N	misional	eventual	Se realiza visita técnica al polideportivo las ferias, con el fin de realizar un inventario de los elementos actuales para la nueva obra realizada en el parque recreo deportivo 	\N	\N	0	\N	1	digital	menos_10	misma_dependencia	\N	[]	analizada	2026-04-07 15:13:13.151	2026-04-09 00:14:20.943	0	0	10	72bd856b-40ad-4506-90a1-134f7d9844ea	1. Acta baja de elementos polideportivo las ferias 	computador_personal	\N	\N	\N	3	\N	\N	\N	890ef843-7e01-4971-9a9b-5bf107481c43
5b10f399-f3e2-49ba-a2bc-1b89fe1f22cd	5	Certificado de limites de barrios y veredas	\N	misional	eventual	Certificado de delimitación de barrios y veredas del municipio de Aguachica 	\N	\N	1	\N	1	ambos	menos_10	misma_dependencia	Ley 388 de 1997	[]	caracterizada	2026-04-10 20:44:59.784	2026-04-10 20:45:00.5	0	1	32	6bb9e7f5-6960-4eff-8849-d0e9b84420e2	Certificado	computador_personal	\N	tres (3) dias	Carta de solicitud\nvisita de campo\nCartografía y documentos del PBOT\nConsulta pagina web Geoportal IGAC\nConsulta pagina web google maps	3	\N	\N	\N	890ef843-7e01-4971-9a9b-5bf107481c43
dc6165f4-7588-49ef-9527-d7d13ed5327c	5	Formulación, revisión y aprobación de proyectos de infraestructura municipal	\N	misional	eventual	La actividad consiste en la formulación, estructuración técnica y revisión de proyectos de infraestructura pública del municipio, incluyendo obras civiles, mejoramiento vial, equipamientos urbanos y proyectos de inversión territorial.	\N	\N	1	\N	1	ambos	entre_10_50	misma_dependencia	Ley 152 de 1994 – Ley Orgánica del Plan de Desarrollo\nLey 80 de 1993 – Contratación estatal\nLey 1150 de 2007\nNormas técnicas sectoriales (INVIAS, NSR-10, etc.)\nMetodología General Ajustada (MGA)	["4","2"]	analizada	2026-04-06 11:48:47.34	2026-04-09 00:22:41.131	1	1	3	d466d522-058e-4eb9-9e65-bc4a9f0ce314	Estudios previos\nDiagnósticos técnicos\nDiseños arquitectónicos y estructurales	carpeta_oficina	Ley 152 de 1994 (Planificación) – lineamientos de formulación de proyectos Metodología General Ajustada (MGA)	15 a 30 días por proyecto (dependiendo de complejidad)	Solicitudes de la comunidad o dependencias\nLineamientos del Plan de Desarrollo	10	\N	\N	\N	890ef843-7e01-4971-9a9b-5bf107481c43
84cb55de-8379-4aed-825c-a1dd6c484b9c	5	Certificado de estratificación	\N	misional	diaria	Certificado de estratificación para impuesto predial, servicios públicos, bancos, etc	\N	\N	1	\N	1	ambos	entre_10_50	misma_dependencia	Ley 142 de 1994 Articulo 101\nLey 505 de 1999\nLey 689 de 2001\nLey 732 de 2002\nDecreto 262 de 2014\nDecreto 007 de 2010	[]	caracterizada	2026-04-10 20:05:57.95	2026-04-10 20:05:58.984	0	1	32	4361c87e-0c22-44bf-b646-8a80b9ba3d47	Certificado de estrato	computador_personal	\N	un (1) dia	Recibo de impuesto predial\nCertificado de tradición y libertad\nEscritura Publica\nCarta venta\nRecibos de servicios públicos\nDecreto municipal 208 de noviembre 19 de 2024\nDecreto municipal 064 de junio 6 de 1995\nPlano de Estratificación\n	3	\N	\N	\N	890ef843-7e01-4971-9a9b-5bf107481c43
9b427399-8a3c-4bf8-a401-2ddb9fc432dd	5	Certificado NBI Aguachica, Cesar	\N	misional	eventual	Certificar NBI según el DANE para el municipio de Aguachica, para focalización de subsidios eléctricos FOES	\N	\N	1	\N	1	ambos	menos_10	misma_dependencia	Ley 1753 de 2015 Art 190	[]	caracterizada	2026-04-10 19:04:58.114	2026-04-10 19:04:58.853	0	1	32	30f0ec2c-447d-4940-a503-f017c7939e7f	Certificado	carpeta_oficina	\N	tres (3) dias	carta de solicitud\nconsulta pagina DANE	3	\N	\N	\N	890ef843-7e01-4971-9a9b-5bf107481c43
15d8fe78-fa52-4e39-8597-afa7183c1f61	5	Certificado proyectos	\N	misional	eventual	Certificados para presentación de proyectos de inversión al nivel Departamental o Nacional, según lo exigido por la entidad receptora 	\N	\N	1	\N	1	ambos	menos_10	digital_unico	Los requisitos establecidos por la entidad nacional o departamental para cada tipo de proyecto 	[]	caracterizada	2026-04-10 18:01:43.064	2026-04-10 18:01:44.261	0	1	32	b0deeae7-ad5f-42f2-9672-79e4e21f029d	Certificado amenazas y riesgo\nCertificado Uso del suelo\nCertificado inclusión PBOT y PDM\nCertificado servicios públicos domiciliarios\nCertificado de no patrimonio cultural\nCertificado de pertenencia a matricula inmobiliaria, código catastral, nomenclatura\nCertificado de no presentación a otra entidad\nAutorización para la ejecución de la obra\nCertificado de vías de acceso alternas\nCertificado de sostenibilidad de la obra\nCertificado no afectación a servicios públicos\n	computador_personal	\N	un (1) dia	Carta de solicitud\nCertificado de tradición y libertad\nRecibo de impuesto predial\nCartografía y documentos del PBOT del municipio de Aguachica\nPlan de Desarrollo Municipal	3	\N	\N	\N	890ef843-7e01-4971-9a9b-5bf107481c43
53ffaa24-9729-40ec-8d7e-9a4159b5703c	5	Certificado existencia de escombrera municipal	\N	misional	mensual	Certificar la existencia o no de la escombrera municipal	\N	\N	1	\N	1	ambos	menos_10	misma_dependencia	Resolución 541 de 1994\nDecreto 357 de 1997\nLey 1258 de 2009	[]	caracterizada	2026-04-10 18:59:51.631	2026-04-10 18:59:52.38	0	1	32	440ea087-7d28-4b63-ab9b-3941d5bdd3a7	Certificado	carpeta_oficina	\N	tres (3) días	Carta de solicitud\nverificación o consulta con la Gerencia de Planeacion 	3	\N	\N	\N	890ef843-7e01-4971-9a9b-5bf107481c43
a832731b-370b-4577-855e-1ffb12ca5a20	5	Certificado de Amenaza y Riesgo	\N	misional	diaria	Amenaza y riesgo de un predio o vivienda, para servicios públicos domiciliarios.  	\N	\N	1	\N	1	ambos	entre_10_50	misma_dependencia	Decreto 149 de febrero 4 de 2020 Ministerio de Vivienda, Ciudad y Territorio\nDecreto 1333 de octubre 6 de 2020 Ministerio de Vivienda, Ciudad y Territorio\nDecreto 523 de mayo 14 de 2021  Presidencia de la Republica de Colombia\nAcuerdo 025 de diciembre 28 de 2002 Plan Básico de Ordenamiento Territorial del municipio de Aguachica, Cesar	[]	caracterizada	2026-04-10 16:54:27.704	2026-04-10 16:54:28.432	0	1	32	1dbe54b2-ba7f-4ef7-8a97-1e0b7dcb0de9	Certificado	computador_personal	\N	un (1) dia	Recibo de impuestos\nCertificado de tradición y libertad\nEscritura Publica\nCartaventa\npagina web Geoportal IGAC\npagina web Google maps\nPlano F02 PBOT\nVisita de campo	3	\N	\N	\N	890ef843-7e01-4971-9a9b-5bf107481c43
3cb4d2f5-ffaa-4bd0-ae94-526a323ba486	5	Certificado para legalización de predios ante Juzgados, Fonvisocial, Agencia Nacional de Tierras y otras entidades	\N	misional	eventual	Certificado solicitado por entidades municipales, nacionales y otras instituciones para la legalización de predios o inmuebles privados o del estado	\N	\N	1	\N	1	ambos	menos_10	misma_dependencia	Ley 1561 de 2012	[]	caracterizada	2026-04-10 18:54:58.048	2026-04-10 18:54:59.109	0	1	32	744393a2-1dea-4165-81cb-5993c1654cd6	Certificado	carpeta_oficina	\N	tres (3) dias	Carta de solicitud\nRecibo de impuesto predial\nCertificado de tradición y libertad\nCartografía y documentos del PBOT\nvisitas de campo\n	3	\N	\N	\N	890ef843-7e01-4971-9a9b-5bf107481c43
a3a0734b-4aa4-4256-a24e-0299ad242b02	5	Certificado de nomenclatura	\N	misional	diaria	Certificar la nomenclatura de un predio o inmueble urbano o  rural	\N	\N	1	\N	1	ambos	entre_10_50	misma_dependencia	Ley 388 de 1997	[]	caracterizada	2026-04-10 19:30:12.99	2026-04-10 19:30:14.512	0	1	32	eb9837c8-4e78-486e-95db-13e775e5355a	Certificado	computador_personal	\N	un (1) dia	Escritura publica\nCertificado de tradición y libertad\nRecibo de impuesto predial\nCarta venta\nRecibos de servicios publicos\nVisita de campo\n	3	\N	\N	\N	890ef843-7e01-4971-9a9b-5bf107481c43
14770592-b0b3-4912-961c-131ab90599fb	5	Certificado de norma urbanística	\N	misional	diaria	Certificado de norma urbanística para las licencias de construcción, subdivisión, reconocimiento, urbanismo, avalúos,  y otros usos	\N	\N	1	\N	1	ambos	entre_10_50	misma_dependencia	Ley 388 de 1997	[]	caracterizada	2026-04-10 20:29:49.473	2026-04-10 20:29:50.24	0	1	32	cd89b106-fc69-4444-a81a-6f7cd2f134dd	Certificado	computador_personal	\N	un (1) día	Recibo de impuesto predial\nCertificado de tradición y libertad\nCartografía y documentos del PBOT\nEstudio e inventario de asentamientos en riesgo\nConsulta paina weg Geoportal IGAC\nConsulta pagina Google maps\nAcuerdo municipal 017 de 2012\nAcuerdo municipal 009 de 2018\nCircular 001 de agosto 15 de 2028  Gerencia de Planeacion\nLeyes, Decretos, Resoluciones del nivel nacional\n\n	3	\N	\N	\N	890ef843-7e01-4971-9a9b-5bf107481c43
\.


--
-- Data for Name: segtec_analisis_actividad; Type: TABLE DATA; Schema: public; Owner: sipad_user
--

COPY public.segtec_analisis_actividad (id, actividad_id, serie_propuesta, subserie_propuesta, retencion_gestion, retencion_central, disposicion_final, justificacion, motor_version, creado_en) FROM stdin;
834d8890-6ce4-45c9-8ad6-888680b3436e	263a18b4-ddc9-4dd6-8c8e-4e50140a9089	DOCUMENTACION GENERAL	\N	3	5	conservacion_parcial	Clasificación automática generada por TRD-AI	1.2	2026-04-07 20:35:41.859
ab7e4a7d-a666-47f8-8e90-a106e69c1513	33764cc9-20d9-4eec-92ef-1a4cf9a32f9c	DOCUMENTACION GENERAL	\N	3	5	conservacion_parcial	Clasificación automática generada por TRD-AI	1.2	2026-04-07 20:35:51.244
d963913e-a373-4fb0-9358-0eb7a702c302	8f2b932e-a62e-45c5-b185-8ec8ef6560d1	DOCUMENTACION GENERAL	\N	3	5	conservacion_parcial	Clasificación automática generada por TRD-AI	1.2	2026-04-07 20:35:56.716
cd227d80-ffa9-42bb-a703-9086f1b9ffdb	312ff70d-808a-42ed-8e3f-05baaab9112a	DOCUMENTACION GENERAL	\N	3	5	conservacion_parcial	Clasificación automática generada por TRD-AI	1.2	2026-04-07 20:35:59.342
65eb1f5b-7142-4a4f-b56f-2374839bb24d	992ca27f-b647-4bd4-8d3c-fee3cf1b4753	DOCUMENTACION GENERAL	\N	3	5	conservacion_parcial	Clasificación automática generada por TRD-AI	1.2	2026-04-08 17:02:05.844
1536b9b7-7367-4754-baf3-1d31534533b0	992ca27f-b647-4bd4-8d3c-fee3cf1b4753	\N	\N	3	5	conservacion_parcial	Clasificación automática generada por TRD-AI	1.2	2026-04-08 17:14:18.319
16021036-9ec3-4ece-9a75-3e9f03c520c9	992ca27f-b647-4bd4-8d3c-fee3cf1b4753	\N	\N	3	5	conservacion_parcial	Clasificación automática generada por TRD-AI	1.2	2026-04-08 17:16:56.237
15881025-f1d7-45db-8123-1ffe58cd870f	992ca27f-b647-4bd4-8d3c-fee3cf1b4753	\N	\N	3	5	conservacion_parcial	Clasificación automática generada por TRD-AI	1.2	2026-04-08 17:24:10.869
aff9e626-9dcf-4b7a-934f-783c4107d519	992ca27f-b647-4bd4-8d3c-fee3cf1b4753	\N	\N	3	5	conservacion_parcial	Clasificación automática generada por TRD-AI	1.2	2026-04-08 17:28:24.583
581db937-9b65-4568-95f6-abb88d25eca3	992ca27f-b647-4bd4-8d3c-fee3cf1b4753	\N	\N	3	5	conservacion_parcial	Clasificación automática generada por TRD-AI	1.2	2026-04-08 17:29:14.38
ae712686-87cd-49ea-81d0-0223306b65ee	992ca27f-b647-4bd4-8d3c-fee3cf1b4753	\N	\N	3	5	conservacion_parcial	Clasificación automática generada por TRD-AI	1.2	2026-04-08 23:53:15.69
e9df2879-dac6-447f-8abd-aca824a79f82	992ca27f-b647-4bd4-8d3c-fee3cf1b4753	\N	\N	3	5	conservacion_parcial	Clasificación automática generada por TRD-AI	1.2	2026-04-08 23:53:57.477
7a030314-2c07-4022-9a28-0c71a1e5c5c7	992ca27f-b647-4bd4-8d3c-fee3cf1b4753	\N	\N	3	5	conservacion_parcial	Clasificación automática generada por TRD-AI	1.2	2026-04-09 00:00:17.533
ab450f34-15ae-4dbd-a74e-3bd524531e9f	992ca27f-b647-4bd4-8d3c-fee3cf1b4753	\N	\N	3	5	conservacion_parcial	Clasificación automática generada por TRD-AI	1.2	2026-04-09 00:00:37.913
fa7c9c36-2a34-4152-b261-d50b949f8aed	992ca27f-b647-4bd4-8d3c-fee3cf1b4753	\N	\N	3	5	conservacion_parcial	Clasificación automática generada por TRD-AI	1.2	2026-04-09 00:04:27.39
45e7fea2-7bda-4ef7-9ad1-52d65217a040	263a18b4-ddc9-4dd6-8c8e-4e50140a9089	\N	\N	3	5	conservacion_parcial	Clasificación automática generada por TRD-AI	1.2	2026-04-09 00:04:57.921
e54cc69e-a5ba-45e0-901a-4f3165597e2a	992ca27f-b647-4bd4-8d3c-fee3cf1b4753	\N	\N	3	5	conservacion_parcial	Clasificación automática generada por TRD-AI	1.2	2026-04-09 00:07:29.142
02623be0-5256-4c77-8354-7c78cda76c5d	992ca27f-b647-4bd4-8d3c-fee3cf1b4753	FOMENTO Y DESARROLLO	Programas de emprendimiento	3	5	conservacion_parcial	Clasificación automática generada por TRD-AI	1.2	2026-04-09 00:12:56.777
d68c19eb-59f5-4055-8622-1ab9e959d38f	263a18b4-ddc9-4dd6-8c8e-4e50140a9089	PLANES	Proyectos	3	5	conservacion_parcial	Clasificación automática generada por TRD-AI	1.2	2026-04-09 00:13:05.705
6644cbfd-7f07-465a-8ca2-6517cabc43f2	33764cc9-20d9-4eec-92ef-1a4cf9a32f9c	INSPECCIONES Y VISITAS	Inspecciones técnicas	3	5	conservacion_parcial	Clasificación automática generada por TRD-AI	1.2	2026-04-09 00:13:14.761
d59c7233-9536-450e-83d4-a9c01c2dd122	8f2b932e-a62e-45c5-b185-8ec8ef6560d1	LICENCIAS Y PERMISOS	Permisos mineros	3	5	conservacion_parcial	Clasificación automática generada por TRD-AI	1.2	2026-04-09 00:13:22.619
38d72820-a312-44c4-923d-84dafefd37fa	312ff70d-808a-42ed-8e3f-05baaab9112a	PQRS	Peticiones	3	5	conservacion_parcial	Clasificación automática generada por TRD-AI	1.2	2026-04-09 00:13:32.288
27a4e41d-bc1e-4954-89b7-cfb98653c706	6ef74829-02c5-444a-a8cb-10041bf32883	PQRS	Peticiones	3	5	conservacion_parcial	Clasificación automática generada por TRD-AI	1.2	2026-04-09 00:13:35.564
5421fac0-f031-4333-9ce0-50b63708b6e0	aa79cc2e-8c62-45e4-897b-422093951039	CONCEPTOS	Conceptos técnicos	3	5	conservacion_parcial	Clasificación automática generada por TRD-AI	1.2	2026-04-09 00:13:40.097
eea867f8-a73d-4348-9dcf-6fee184f5633	6ef74829-02c5-444a-a8cb-10041bf32883	PQRS	Peticiones	3	5	conservacion_parcial	Clasificación automática generada por TRD-AI	1.2	2026-04-09 00:13:44.829
f9c4f53b-9edb-4832-897c-7cae184af5e9	dc6165f4-7588-49ef-9527-d7d13ed5327c	PLANES	Proyectos	3	5	conservacion_parcial	Clasificación automática generada por TRD-AI	1.2	2026-04-09 00:13:47.325
ba3447c8-db18-49ab-a013-2275364b2049	8f2b932e-a62e-45c5-b185-8ec8ef6560d1	LICENCIAS Y PERMISOS	Permisos mineros	3	5	conservacion_parcial	Clasificación automática generada por TRD-AI	1.2	2026-04-09 00:13:58.944
4825f062-0c86-4da5-a82e-876170275da0	6ef74829-02c5-444a-a8cb-10041bf32883	PQRS	Peticiones	3	5	conservacion_parcial	Clasificación automática generada por TRD-AI	1.2	2026-04-09 00:14:08.428
4710f3b1-c32e-41cd-92f2-19773e759be0	33764cc9-20d9-4eec-92ef-1a4cf9a32f9c	INSPECCIONES Y VISITAS	Inspecciones técnicas	3	5	conservacion_parcial	Clasificación automática generada por TRD-AI	1.2	2026-04-09 00:14:20.938
e2307c65-d439-456f-8cd6-4acefc3a1fe3	dc6165f4-7588-49ef-9527-d7d13ed5327c	PLANES	Proyectos	3	5	conservacion_parcial	Clasificación automática generada por TRD-AI	1.2	2026-04-09 00:14:32.066
b795f66d-1923-4335-a9cc-c92a37b75f4a	992ca27f-b647-4bd4-8d3c-fee3cf1b4753	FOMENTO Y DESARROLLO	Programas de emprendimiento	3	5	conservacion_parcial	Clasificación automática generada por TRD-AI	1.2	2026-04-09 00:15:00.737
90ee9be1-4652-42db-9358-539a4d0da32a	6ef74829-02c5-444a-a8cb-10041bf32883	PQRS	Peticiones	3	5	conservacion_parcial	Clasificación automática generada por TRD-AI	1.2	2026-04-09 00:15:08.358
47023b02-8e14-4425-b70f-d511175352ad	263a18b4-ddc9-4dd6-8c8e-4e50140a9089	PLANES	Proyectos	3	5	conservacion_parcial	Clasificación automática generada por TRD-AI	1.2	2026-04-09 00:15:31.756
1467c8ac-f422-48e1-9550-1808e9b93420	dc6165f4-7588-49ef-9527-d7d13ed5327c	PROYECTOS	Proyectos de inversión	3	5	conservacion_parcial	Clasificación automática generada por TRD-AI	1.2	2026-04-09 00:22:41.122
566a73f3-3c15-4a0b-8210-040255479bbd	992ca27f-b647-4bd4-8d3c-fee3cf1b4753	FOMENTO Y DESARROLLO	Programas de emprendimiento	3	5	conservacion_parcial	Clasificación automática generada por TRD-AI	1.2	2026-04-09 00:33:35.783
99b7802c-08aa-403b-aa57-c2fc6730a70d	992ca27f-b647-4bd4-8d3c-fee3cf1b4753	FOMENTO Y DESARROLLO	Programas de emprendimiento	3	5	conservacion_parcial	Clasificación automática generada por TRD-AI	1.2	2026-04-09 00:36:30.433
5ed985eb-54c4-40ab-9436-d9f9f8c56aa0	aa79cc2e-8c62-45e4-897b-422093951039	CONCEPTOS	Conceptos técnicos	3	5	conservacion_parcial	Clasificación automática generada por TRD-AI	1.2	2026-04-09 14:27:32.841
183c7fa5-b0a2-4287-98b5-5b6400b43d39	992ca27f-b647-4bd4-8d3c-fee3cf1b4753	FOMENTO Y DESARROLLO	Programas de emprendimiento	3	5	conservacion_parcial	Clasificación automática generada por TRD-AI	1.2	2026-04-09 14:29:14.146
ba1bebac-447e-44f5-92c0-6b11cd1de4b2	312ff70d-808a-42ed-8e3f-05baaab9112a	PQRS	Peticiones	3	5	conservacion_parcial	Clasificación automática generada por TRD-AI	1.2	2026-04-09 15:10:51.292
bb9674c4-7da2-4b25-8b5c-d5f62a69e571	aa79cc2e-8c62-45e4-897b-422093951039	CONCEPTOS	Conceptos técnicos	3	5	conservacion_parcial	Clasificación automática generada por TRD-AI	1.2	2026-04-09 15:11:31.094
1f9cabfd-7603-4729-9ceb-e3f9bdbe5ab5	aa79cc2e-8c62-45e4-897b-422093951039	CONCEPTOS	Conceptos técnicos	3	5	conservacion_parcial	Clasificación automática generada por TRD-AI	1.2	2026-04-09 15:56:38.185
f04c56bd-3d21-48fd-8ffc-4bbf31c1ce62	8f2b932e-a62e-45c5-b185-8ec8ef6560d1	LICENCIAS Y PERMISOS	Permisos mineros	3	5	conservacion_parcial	Clasificación automática generada por TRD-AI	1.2	2026-04-09 15:57:09.276
c7dcc5df-8522-4608-8bd5-3f5de9ddba56	8f2b932e-a62e-45c5-b185-8ec8ef6560d1	LICENCIAS Y PERMISOS	Permisos mineros	3	5	conservacion_parcial	Clasificación automática generada por TRD-AI	1.2	2026-04-09 17:07:44.729
c99a269d-06c3-40d6-bb30-ace4464b1613	992ca27f-b647-4bd4-8d3c-fee3cf1b4753	CORRESPONDENCIA	Oficios	3	5	conservacion_parcial	Clasificación generada por TRD-AI	2.0-claude	2026-04-10 01:22:15.374
5b3eee08-f407-4ee1-b98a-d31b8225e990	992ca27f-b647-4bd4-8d3c-fee3cf1b4753	CORRESPONDENCIA	Oficios	3	5	conservacion_parcial	Clasificación generada por TRD-AI	2.0-claude	2026-04-10 01:29:09.857
\.


--
-- Data for Name: segtec_configuracion_dependencia; Type: TABLE DATA; Schema: public; Owner: sipad_user
--

COPY public.segtec_configuracion_dependencia (id, id_dependencia, version, activa, tipo_funcion, nivel_decisorio, recibe_solicitudes, emite_actos, produce_decisiones, procesos_principales, tramites_frecuentes, tipo_decisiones, tipos_documentales, otros_documentos, descripcion_funcional, creado_por, created_at) FROM stdin;
619d3c8c-6f25-4033-bf44-44fd47b8fff3	1	1	0	direccion	operativo	1	1	1	Prueba	Prueba	Prueba	["actos_administrativos","informes_tecnicos","comunicaciones_oficiales","conceptos"]	Prueba	Prueba	1	2026-02-24 02:15:46.617
552ec1f4-34fa-4644-be2d-d70c3f00a38d	1	2	0	misional	operativo	1	1	1	Prueba	Prueba	Prueba	["actos_administrativos","informes_tecnicos","comunicaciones_oficiales","conceptos"]	Prueba	Prueba	1	2026-02-24 02:44:29.165
6b351149-b8b4-40d6-9f6c-09db7b19acd2	1	1	1	misional	directivo	1	1	1	Prueba de registro de procesos principales	Prueba de trámites frecuentes	Prueba de tipo de decisiones que produce	["actos_administrativos","informes_tecnicos","comunicaciones_oficiales","conceptos","contratos"]	Prueba de registro de otros tipos documentales	Prueba de registro de descripción estructural del rol del área	1	2026-03-15 14:41:05.902
473325d5-0b07-4dec-b3a6-61d93a85019f	6	1	1	misional	directivo	1	1	1	Formular, implementar y ejecutar las políticas, planes y programas en materia de orden público y seguridad, promoción a la convivencia y participación ciudadana, de defensa de los bienes e intereses del municipio, y dirigir los procesos transversales de apoyo relacionados con la gestión de personal, administrativa, disciplinaria, documental, recursos físicos y el sistema de atención al ciudadano.	Fijar y dirigir las políticas, planes, programas y proyectos relacionados con la convivencia pacífica, el respeto de los derechos humanos, la segundad ciudadana y la preservación del orden público en el municipio de acuerdo con la normatividad vigente y los lineamientos del Alcalde y del plan de desarrollo municipal.\nFijar y dirigir las políticas, planes, programas y proyectos relacionados con la defensa del espacio público, de acuerdo con la normatividad vigente y los lineamientos del Alcalde y del plan de desarrollo municipal.\nFijar y dirigir las políticas, planes, programas y proyectos encaminados a la defensa y promoción de los derechos de los consumidores de bienes y servicios de acuerdo con la normatividad vigente y los lineamientos del Alcalde y del plan de desarrollo municipal.\nFijar y dirigir las políticas de prevención de delitos, contravenciones y problemas de convivencia y seguridad ciudadana para el Municipio de acuerde» con la normatividad vigente y los lineamientos del Alcalde y del plan de desarrollo municipal.\nFijar y dirigir las políticas, planes, programas y proyectos del sistema de justicia y solución de conflictos del municipio de acuerdo con la normatividad vigente y los lineamientos del Alcalde y del plan de desarrollo municipal.	N/A	["actos_administrativos","informes_tecnicos","comunicaciones_oficiales","conceptos","actas","expedientes_administrativos"]	\N	Formular, implementar y ejecutar las políticas, planes y programas en materia de orden público y seguridad, promoción a la convivencia y participación ciudadana, de defensa de los bienes e intereses del municipio, y dirigir los procesos transversales de apoyo relacionados con la gestión de personal, administrativa, disciplinaria, documental, recursos físicos y el sistema de atención al ciudadano.	3	2026-03-16 22:34:32.197
27964877-3443-46ff-95ba-ff681bd06e9d	5	1	1	misional	directivo	1	1	0	Prueba de procesos principales	Prueba de trámites frecuentes	Prueba de decisiones que produce	["actos_administrativos","informes_tecnicos","comunicaciones_oficiales","conceptos","contratos","resoluciones","expedientes_administrativos"]	Prueba de registro de tipos documentales	Prueba de descripción del rol del área	4	2026-03-17 13:38:22.171
4d8053ca-c878-45d6-a0c9-08d693c17fa0	3	1	1	apoyo	directivo	1	1	1	Evaluación y auditoría interna\nRevisión independiente de los procesos, el cumplimiento normativo y el uso de los recursos.\nSeguimiento a planes de mejoramiento\nVerificación de que las dependencias corrijan los hallazgos identificados (internos o de entes de control).\nEvaluación del sistema de control interno\nAnálisis del funcionamiento del sistema (MECI/MIPG) para asegurar que los controles sean efectivos y haya mejora continua.	Atención de requerimientos de entes de control\nRespuesta a solicitudes de información de la Contraloría, Procuraduría u otros organismos de control.\nSeguimiento a planes de mejoramiento\nRegistro y verificación del cumplimiento de acciones correctivas derivadas de auditorías o hallazgos.\nEmisión de informes de control interno\nElaboración y presentación de informes periódicos (pormenorizados, anuales, evaluaciones) sobre el estado del control interno en la entidad.	Formulación de recomendaciones de mejora\nDecisiones orientadas a corregir debilidades detectadas en procesos, controles o cumplimiento normativo.\nDeterminación de niveles de cumplimiento o riesgo\nEvaluación que define si un proceso está conforme, parcialmente conforme o en incumplimiento, así como su nivel de riesgo.\nAprobación o validación de planes de mejoramiento\nDecisión sobre la pertinencia, viabilidad y suficiencia de las acciones propuestas por las dependencias para corregir hallazgos.	["informes_tecnicos","comunicaciones_oficiales","conceptos","expedientes_administrativos"]	\N	La Oficina de Control Interno evalúa la gestión institucional, verifica el cumplimiento de la normatividad y promueve acciones de mejora continua en los procesos de la entidad.	37	2026-03-25 15:00:40.642
\.


--
-- Data for Name: segtec_formularios; Type: TABLE DATA; Schema: public; Owner: sipad_user
--

COPY public.segtec_formularios (id, usuario_id, numero, descripcion, estado, etapa_actual, creado_en, actualizado_en, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: segtec_propuestas_ai; Type: TABLE DATA; Schema: public; Owner: sipad_user
--

COPY public.segtec_propuestas_ai (id, formulario_id, tipo_propuesta, contenido, nivel_confianza, estado, creado_en) FROM stdin;
\.


--
-- Data for Name: segtec_propuestas_ai_new; Type: TABLE DATA; Schema: public; Owner: sipad_user
--

COPY public.segtec_propuestas_ai_new (id, actividad_id, tipo_propuesta, contenido, nivel_confianza, estado, motor_version, creado_en) FROM stdin;
\.


--
-- Data for Name: segtec_validacion_tecnica; Type: TABLE DATA; Schema: public; Owner: sipad_user
--

COPY public.segtec_validacion_tecnica (actividad_id, impacto_juridico_directo, impacto_fiscal_contable, genera_expediente_propio, actividad_permanente, soporte_principal, observacion_tecnica, created_at, updated_at) FROM stdin;
dc6165f4-7588-49ef-9527-d7d13ed5327c	f	f	t	f	\N	\N	2026-04-06 11:48:48.356	2026-04-06 11:48:48.356
aa79cc2e-8c62-45e4-897b-422093951039	f	f	f	f	\N	\N	2026-04-07 14:44:50.082	2026-04-07 14:44:50.082
6ef74829-02c5-444a-a8cb-10041bf32883	f	f	f	f	\N	\N	2026-04-07 15:01:10.129	2026-04-07 15:01:10.129
312ff70d-808a-42ed-8e3f-05baaab9112a	f	f	f	f	\N	\N	2026-04-07 15:06:26.223	2026-04-07 15:06:26.223
8f2b932e-a62e-45c5-b185-8ec8ef6560d1	f	f	t	f	\N	\N	2026-04-07 15:12:28.849	2026-04-07 15:12:28.849
33764cc9-20d9-4eec-92ef-1a4cf9a32f9c	f	f	f	f	\N	\N	2026-04-07 15:13:14.481	2026-04-07 15:13:14.481
263a18b4-ddc9-4dd6-8c8e-4e50140a9089	f	f	t	f	\N	\N	2026-04-07 15:37:29.022	2026-04-07 15:37:29.022
992ca27f-b647-4bd4-8d3c-fee3cf1b4753	f	f	t	f	\N	\N	2026-04-08 13:39:52.877	2026-04-08 13:39:52.877
a832731b-370b-4577-855e-1ffb12ca5a20	f	f	t	f	\N	\N	2026-04-10 16:54:28.418	2026-04-10 16:54:28.418
15d8fe78-fa52-4e39-8597-afa7183c1f61	f	f	t	f	\N	\N	2026-04-10 18:01:44.254	2026-04-10 18:01:44.254
3cb4d2f5-ffaa-4bd0-ae94-526a323ba486	f	f	t	f	\N	\N	2026-04-10 18:54:59.101	2026-04-10 18:54:59.101
53ffaa24-9729-40ec-8d7e-9a4159b5703c	f	f	t	f	\N	\N	2026-04-10 18:59:52.365	2026-04-10 18:59:52.365
9b427399-8a3c-4bf8-a401-2ddb9fc432dd	f	f	t	f	\N	\N	2026-04-10 19:04:58.848	2026-04-10 19:04:58.848
a3a0734b-4aa4-4256-a24e-0299ad242b02	f	f	t	f	\N	\N	2026-04-10 19:30:14.501	2026-04-10 19:30:14.501
84cb55de-8379-4aed-825c-a1dd6c484b9c	f	f	t	f	\N	\N	2026-04-10 20:05:58.957	2026-04-10 20:05:58.957
14770592-b0b3-4912-961c-131ab90599fb	f	f	t	f	\N	\N	2026-04-10 20:29:50.226	2026-04-10 20:29:50.226
5b10f399-f3e2-49ba-a2bc-1b89fe1f22cd	f	f	t	f	\N	\N	2026-04-10 20:45:00.483	2026-04-10 20:45:00.483
cb6ab72c-6760-4754-9175-5c876740dc4e	f	f	t	f	\N	\N	2026-04-10 20:50:23.787	2026-04-10 20:50:23.787
\.


--
-- Data for Name: series; Type: TABLE DATA; Schema: public; Owner: sipad_user
--

COPY public.series (id, trd_version_id, macrofuncion_id, subfuncion_id, nombre, codigo, tiempo_gestion, tiempo_central, disposicion_final, unidad_id, procedimiento, activo, catalogo_serie_id) FROM stdin;
SER_ACTAS	trd_001	\N	\N	ACTAS	\N	\N	\N	\N	\N	\N	t	\N
SER_CONTRATOS	trd_001	\N	\N	CONTRATOS	\N	\N	\N	\N	\N	\N	t	\N
SER_CONVENIOS	trd_001	\N	\N	CONVENIOS	\N	\N	\N	\N	\N	\N	t	\N
SER_ACTOS_ADMIN	trd_001	\N	\N	ACTOS ADMINISTRATIVOS	\N	\N	\N	\N	\N	\N	t	\N
SER_INFORMES	trd_001	\N	\N	INFORMES	\N	\N	\N	\N	\N	\N	t	\N
SER_PROCESOS	trd_001	\N	\N	PROCESOS	\N	\N	\N	\N	\N	\N	t	\N
SER_PLANES	trd_001	\N	\N	PLANES	\N	\N	\N	\N	\N	\N	t	\N
SER_PROGRAMAS	trd_001	\N	\N	PROGRAMAS	\N	\N	\N	\N	\N	\N	t	\N
SER_INVENTARIOS	trd_001	\N	\N	INVENTARIOS	\N	\N	\N	\N	\N	\N	t	\N
SER_HISTORIAS	trd_001	\N	\N	HISTORIAS	\N	\N	\N	\N	\N	\N	t	\N
SER_PQRS	trd_001	\N	\N	PQRS	\N	\N	\N	\N	\N	\N	t	\N
SER_ACCIONES_CONST	trd_001	\N	\N	ACCIONES CONSTITUCIONALES	\N	\N	\N	\N	\N	\N	t	\N
SER_REGISTROS	trd_001	\N	\N	REGISTROS	\N	\N	\N	\N	\N	\N	t	\N
\.


--
-- Data for Name: subseries; Type: TABLE DATA; Schema: public; Owner: sipad_user
--

COPY public.subseries (id, serie_id, nombre, codigo, tiempo_gestion, tiempo_central, disposicion_final, procedimiento, activo, catalogo_subserie_id, tipos_documentales) FROM stdin;
SUB_ACTAS_REUNION	SER_ACTAS	Actas de reunión	\N	\N	\N	\N	\N	t	\N	{}
SUB_ACTAS_COMITE	SER_ACTAS	Actas de comité	\N	\N	\N	\N	\N	t	\N	{}
SUB_ACTAS_CONSEJO	SER_ACTAS	Actas de consejo	\N	\N	\N	\N	\N	t	\N	{}
SUB_CONTRATO_PS	SER_CONTRATOS	Contratos de prestación de servicios	\N	\N	\N	\N	\N	t	\N	{}
SUB_CONTRATO_OBRA	SER_CONTRATOS	Contratos de obra	\N	\N	\N	\N	\N	t	\N	{}
SUB_CONTRATO_SUM	SER_CONTRATOS	Contratos de suministro	\N	\N	\N	\N	\N	t	\N	{}
SUB_CONTRATO_CONSULT	SER_CONTRATOS	Contratos de consultoría	\N	\N	\N	\N	\N	t	\N	{}
SUB_CONV_INTER	SER_CONVENIOS	Convenios interadministrativos	\N	\N	\N	\N	\N	t	\N	{}
SUB_CONV_COOP	SER_CONVENIOS	Convenios de cooperación	\N	\N	\N	\N	\N	t	\N	{}
SUB_DECRETOS	SER_ACTOS_ADMIN	Decretos	\N	\N	\N	\N	\N	t	\N	{}
SUB_RESOLUCIONES	SER_ACTOS_ADMIN	Resoluciones	\N	\N	\N	\N	\N	t	\N	{}
SUB_ACUERDOS	SER_ACTOS_ADMIN	Acuerdos	\N	\N	\N	\N	\N	t	\N	{}
SUB_CIRCULARES	SER_ACTOS_ADMIN	Circulares	\N	\N	\N	\N	\N	t	\N	{}
SUB_INF_GESTION	SER_INFORMES	Informes de gestión	\N	\N	\N	\N	\N	t	\N	{}
SUB_INF_TECNICOS	SER_INFORMES	Informes técnicos	\N	\N	\N	\N	\N	t	\N	{}
SUB_INF_CONTROL	SER_INFORMES	Informes a entes de control	\N	\N	\N	\N	\N	t	\N	{}
SUB_HIST_LAB	SER_HISTORIAS	Historias laborales	\N	\N	\N	\N	\N	t	\N	{}
SUB_HIST_CLIN	SER_HISTORIAS	Historias clínicas	\N	\N	\N	\N	\N	t	\N	{}
SUB_HIST_EQUIP	SER_HISTORIAS	Historias de equipos	\N	\N	\N	\N	\N	t	\N	{}
SUB_PETICIONES	SER_PQRS	Peticiones	\N	\N	\N	\N	\N	t	\N	{}
\.


--
-- Data for Name: tipologias; Type: TABLE DATA; Schema: public; Owner: sipad_user
--

COPY public.tipologias (id, subserie_id, nombre, descripcion) FROM stdin;
\.


--
-- Data for Name: trd_catalogo_series; Type: TABLE DATA; Schema: public; Owner: sipad_user
--

COPY public.trd_catalogo_series (id, codigo, nombre, activo) FROM stdin;
1	1	ACCIONES CONSTITUCIONALES	t
2	2	ACCIONES JUDICIALES	t
3	3	ACTAS	t
4	4	ACTOS ADMINISTRATIVOS	t
5	5	ACUERDOS	t
6	6	ANTEPROYECTO DE PRESUPUESTO	t
7	7	AUDITORIAS	t
8	8	BOLETINES	t
9	9	CERTIFICADOS	t
10	10	CIRCULARES	t
11	11	COMPROBANTES CONTABLES	t
12	12	COMPROBANTES DE ALMACEN	t
13	13	CONCEPTOS	t
14	14	CONCILIACIONES BANCARIAS	t
15	15	CONSECUTIVO DE COMUNICACIONES	t
16	16	CONTRATOS	t
17	17	CONVENIOS	t
18	18	DERECHOS DE PETICION	t
19	19	DECLARACIONES TRIBUTARIAS	t
20	20	ESTADOS FINANCIEROS	t
21	21	ESTUDIOS	t
22	22	HISTORIALES	t
23	23	HISTORIAS LABORALES	t
24	24	INFORMES	t
25	25	INSTRUMENTOS ARCHIVISTICOS	t
26	26	INSTRUMENTOS DE CONTROL	t
27	27	INVENTARIOS	t
28	28	LIBROS CONTABLES	t
29	29	MANUALES	t
30	30	NOMINA	t
31	31	PLANES	t
32	32	PROGRAMAS	t
33	33	PROCESOS	t
34	34	PROYECTOS	t
35	35	REGISTROS	t
36	36	RESOLUCIONES	t
37	37	PQRS	t
\.


--
-- Data for Name: trd_catalogo_subseries; Type: TABLE DATA; Schema: public; Owner: sipad_user
--

COPY public.trd_catalogo_subseries (id, codigo, nombre, serie_id, activo) FROM stdin;
1	1.1	Acciones de cumplimiento	1	t
2	1.2	Acciones de grupo	1	t
3	1.3	Acciones de tutela	1	t
4	1.4	Acciones populares	1	t
5	2.1	Acciones contractuales	2	t
6	2.2	Acciones de nulidad	2	t
7	2.3	Acciones de nulidad y restablecimiento	2	t
8	2.4	Acciones de reparacion directa	2	t
9	2.5	Acciones de repeticion	2	t
10	2.6	Acciones ordinarias	2	t
11	3.1	Actas de comites	3	t
12	3.2	Actas de consejos	3	t
13	3.3	Actas de comisiones	3	t
14	3.4	Actas institucionales	3	t
15	3.5	Actas de juntas	3	t
16	3.6	Actas de mesas tecnicas	3	t
17	4.1	Decretos	4	t
18	4.2	Resoluciones	4	t
19	5.1	Acuerdos municipales	5	t
20	7.1	Auditorias internas	7	t
21	7.2	Auditorias externas	7	t
22	8.1	Boletines administrativos	8	t
23	8.2	Boletines de prensa	8	t
24	8.3	Boletines epidemiologicos	8	t
25	9.1	Certificados presupuestales	9	t
26	9.2	Certificados administrativos	9	t
27	9.3	Certificados de residencia	9	t
28	9.4	Certificados financieros	9	t
29	10.1	Circulares informativas	10	t
30	10.2	Circulares dispositivas	10	t
31	11.1	Ingreso	11	t
32	11.2	Egreso	11	t
33	12.1	Ingreso	12	t
34	12.2	Egreso	12	t
35	12.3	Baja	12	t
36	13.1	Conceptos juridicos	13	t
37	13.2	Conceptos tecnicos	13	t
38	15.1	Enviadas	15	t
39	15.2	Recibidas	15	t
40	16.1	Arrendamiento	16	t
41	16.2	Comodato	16	t
42	16.3	Compraventa	16	t
43	16.4	Consultoria	16	t
44	16.5	Obra publica	16	t
45	16.6	Prestacion de servicios	16	t
46	16.7	Interadministrativos	16	t
47	16.8	Seguros	16	t
48	16.9	Suministros	16	t
49	17.1	Interadministrativos	17	t
50	17.2	Cooperacion	17	t
51	17.3	Asociacion	17	t
52	17.4	ESAL	17	t
53	19.1	IVA	19	t
54	19.2	Retencion	19	t
55	19.3	Impuestos territoriales	19	t
56	21.1	Estudios tecnicos	21	t
57	21.2	Estudios organizacionales	21	t
58	21.3	Diseños	21	t
59	22.1	Bienes	22	t
60	22.2	Equipos	22	t
61	22.3	Vehiculos	22	t
62	22.4	Educativos	22	t
63	22.5	Contribuyentes	22	t
64	24.1	Informes de gestion	24	t
65	24.2	Informes a entes de control	24	t
66	24.3	Informes financieros	24	t
67	24.4	Informes tecnicos	24	t
68	24.5	Informes de seguimiento	24	t
69	24.6	Informes PQRS	24	t
70	25.1	CCD	25	t
71	25.2	TRD	25	t
72	25.3	PGD	25	t
73	25.4	PINAR	25	t
74	27.1	Documentales	27	t
75	27.2	Bienes	27	t
76	27.3	Transferencias	27	t
77	28.1	Libro diario	28	t
78	28.2	Libro mayor	28	t
79	28.3	Libro bancos	28	t
80	31.1	Planes de accion	31	t
81	31.2	Planes estrategicos	31	t
82	31.3	Planes institucionales	31	t
83	31.4	Planes de mejoramiento	31	t
84	32.1	Programas institucionales	32	t
85	32.2	Programas sociales	32	t
86	33.1	Procesos judiciales	33	t
87	33.2	Procesos disciplinarios	33	t
88	33.3	Procesos administrativos	33	t
89	33.4	Procesos sancionatorios	33	t
90	34.1	Proyectos de acuerdo	34	t
91	34.2	Proyectos institucionales	34	t
92	35.1	Registro de usuarios	35	t
93	35.2	Registros administrativos	35	t
94	37.1	Peticiones	37	t
95	37.2	Quejas	37	t
96	37.3	Reclamos	37	t
97	37.4	Sugerencias	37	t
\.


--
-- Data for Name: trd_reglas_retencion; Type: TABLE DATA; Schema: public; Owner: sipad_user
--

COPY public.trd_reglas_retencion (id, propuesta_id, tiempo_gestion, tiempo_central, disposicion_final, fundamento_normativo, nivel_confianza, creado_en, tipo_regla, retencion_gestion, retencion_central) FROM stdin;
\.


--
-- Data for Name: trd_series_propuestas; Type: TABLE DATA; Schema: public; Owner: sipad_user
--

COPY public.trd_series_propuestas (id, actividad_id, nombre_serie, nombre_subserie, tipologia_documental, justificacion, confianza, estado, version_trd_id, aprobado_por, fecha_aprobacion, observaciones_revision, creado_en) FROM stdin;
66f51cfc-95bd-4b9b-8905-d995abb80cad	8f2b932e-a62e-45c5-b185-8ec8ef6560d1	LICENCIAS Y PERMISOS	Permisos mineros	1. Permiso de mineria de subsistencia	Propuesta generada automáticamente — origen: matriz	0.9	propuesta	\N	\N	\N	\N	2026-04-09T01:02:09.301Z
95f29de5-306b-43e0-8e58-53dea32cf1b7	aa79cc2e-8c62-45e4-897b-422093951039	ACTAS	Actas	1. Acta de inspeccion ocular con la descripcion detallada y el registro fotografico.	Propuesta generada automáticamente — origen: heuristica	0.85	propuesta	\N	\N	\N	\N	2026-04-09T01:02:09.305Z
399b2793-8133-48f9-95ca-b045e911299e	312ff70d-808a-42ed-8e3f-05baaab9112a	PQRS	Peticiones	1. Oficio de solicitud de acompañamiento a la entidad ya sea publica o privada.	Propuesta generada automáticamente — origen: matriz	0.9	propuesta	\N	\N	\N	\N	2026-04-09T01:02:09.310Z
1441bae6-a899-4a3f-90ed-1c5ae7ed353a	6ef74829-02c5-444a-a8cb-10041bf32883	PQRS	Peticiones	Se genere la respuesta a dicho oficio que nos radicaron.	Propuesta generada automáticamente — origen: matriz	0.9	propuesta	\N	\N	\N	\N	2026-04-09T01:02:09.315Z
c282b904-882e-477b-9c8b-90c9a78ec603	263a18b4-ddc9-4dd6-8c8e-4e50140a9089	PROYECTOS	Proyectos de inversión	Documento tecnico	Propuesta generada automáticamente — origen: matriz	0.9	propuesta	\N	\N	\N	\N	2026-04-09T01:02:09.323Z
7d08d299-0ba4-440f-ad25-bea80b3cd1ac	33764cc9-20d9-4eec-92ef-1a4cf9a32f9c	ACTAS	Actas	1. Acta baja de elementos polideportivo las ferias	Propuesta generada automáticamente — origen: heuristica	0.85	propuesta	\N	\N	\N	\N	2026-04-09T01:02:09.326Z
fbdd5797-cd7c-4151-b08a-a740f4ec5ae8	992ca27f-b647-4bd4-8d3c-fee3cf1b4753	CORRESPONDENCIA	Oficios	OFICIOS DE INFORMACION	Propuesta generada automáticamente — origen: matriz	0.9	propuesta	\N	\N	\N	\N	2026-04-09T01:02:09.331Z
3fea5ba6-e53e-4764-9880-e5bb888afd6e	dc6165f4-7588-49ef-9527-d7d13ed5327c	PROYECTOS	Proyectos de inversión	Estudios previos	Propuesta generada automáticamente — origen: matriz	0.9	propuesta	\N	\N	\N	\N	2026-04-09T01:02:09.337Z
\.


--
-- Data for Name: usuarios; Type: TABLE DATA; Schema: public; Owner: sipad_user
--

COPY public.usuarios (id, username, password_hash, nombre_completo, id_dependencia, id_cargo, id_rol, estado, bloqueado, es_master_admin, es_responsable_dependencia, fecha_registro, documento, email, id_nivel, created_at, entidad_id) FROM stdin;
3	larsonagon	$2b$10$Bnk7WTFZp/76hfWpI.hVEO/R.a6Uy6rtqCLDiauOoOsSUhMsxeYZy	Larson Andrés Agón Quiñonez	5	10	5	1	f	f	f	2026-03-15 22:44:44.126138	91181720	larsonagon@gmail.com	3	2026-03-15 22:44:44.126138	890ef843-7e01-4971-9a9b-5bf107481c43
5	celsoarevalo	$2b$10$0vZlCw5PVhgGfWq2ldOPuu/Ev6GaVEr8DSFgwcpZtvG1uoorJ5fGG	Celso Arevalo	5	21	5	1	f	f	f	2026-03-24 21:40:52.212015	0	Celso.arevalo211@gmail.com	2	2026-03-24 21:40:52.212015	890ef843-7e01-4971-9a9b-5bf107481c43
7	juanquintero	$2b$10$ebBSCktUWP3ZHho9ZZq8pevi804aGuXY5cIJe4gs80sCfJqEXXnbe	Juan Quintero	5	21	5	1	f	f	f	2026-03-24 21:40:52.212015	0	mrcamiloquintero@gmail.com	2	2026-03-24 21:40:52.212015	890ef843-7e01-4971-9a9b-5bf107481c43
10	carloscastro	$2b$10$cjZalowXD4gOlmmVPzVr/OePAtynm73N3vrg4yzGUixgcpY3FPdc6	Carlos Castro	5	21	5	1	f	f	f	2026-03-24 21:40:52.212015	0	Cacaca030197@gmail.com	2	2026-03-24 21:40:52.212015	890ef843-7e01-4971-9a9b-5bf107481c43
8	yesidpacheco	$2b$10$OSvdb1zBT.CIoJfixJyk6O8jfcyp.gZLGaVkNms6tcBNFIw7siLna	Yesid Pacheco	5	21	5	1	f	f	f	2026-03-24 21:40:52.212015	0	Fabianpacheco0729@gmail.com	2	2026-03-24 21:40:52.212015	890ef843-7e01-4971-9a9b-5bf107481c43
9	edwinsalas	$2b$10$i2TwZDmO1TplCagksfsOXenfjyLS4iIY2h3DS4akawNZsR9jC.nKu	Edwin Salas	5	21	5	1	f	f	f	2026-03-24 21:40:52.212015	0	Edwin.salas1980@gmail.com	2	2026-03-24 21:40:52.212015	890ef843-7e01-4971-9a9b-5bf107481c43
6	danielasanchez	$2b$10$cWWsmK34BBgSUL68jP77L.iZOlDy0yAqfmF1xiWKhm1SMktfYKOc2	Daniela Sanchez	5	21	5	1	f	f	f	2026-03-24 21:40:52.212015	0	danielamsabogada@gmail.com	2	2026-03-24 21:40:52.212015	890ef843-7e01-4971-9a9b-5bf107481c43
1	superadmin	$2b$10$2LoeBPf2Lb6Lah313MALVOw./9K4kbmE5e28ZNcFqL395hwfkwi5C	Administrador del sistema	1	10	1	1	f	t	f	2026-03-14 18:45:06.585806	\N	alcalde@gmail.com	3	2026-03-14 18:53:26.890083	b6275e37-657e-4e00-8334-3cabf9d8607c
4	caroalvarez	$2b$10$PW6X708QGgM9dIGd4PhLEOHjmLH6tQ673iI3eTBQQ5U/m.20uduVm	Carolina Alvarez	5	10	2	1	f	f	f	2026-03-17 13:35:59.949603	0	caritoalqui@gmail.com	3	2026-03-17 13:35:59.949603	890ef843-7e01-4971-9a9b-5bf107481c43
2	isaacholguin	$2b$10$rtzaUVTGKIPYybSNPeVmlOY/WxHQqfVxubQHCinzH7VqvbV9ZsRLy	ISAAC HOLGUIN FELIZZOLA	6	2	4	1	f	f	f	2026-03-15 22:19:53.600565	0	gobierno@alcaldia-aguachica.gov.co	1	2026-03-15 22:19:53.600565	890ef843-7e01-4971-9a9b-5bf107481c43
15	marturilopez	$2b$10$KM75OqqBJ8UfQ40Vrue0zeEkBqGu5.HKN/eRBHMphjvjB45ARhhwG	Maryuri Lopez	5	21	5	1	f	f	f	2026-03-24 21:40:52.212015	0	lopezascaniomaryuri@gmail.com	2	2026-03-24 21:40:52.212015	890ef843-7e01-4971-9a9b-5bf107481c43
16	mariafernandaramirez	$2b$10$bXyV.bAm2B2.AlJMaSpQ5u8BEgRfKBWnI6oSsR6NeuPSMGm5kI6Nm	Maria Fernanda Ramirez	5	21	5	1	f	f	f	2026-03-24 21:40:52.212015	0	Fernandaramirezq13@gmail.com	2	2026-03-24 21:40:52.212015	890ef843-7e01-4971-9a9b-5bf107481c43
17	alejandratorres	$2b$10$oG56mici/75QAY2E9vlZO.qykavEB5vx94zMMdKezZ9O5VJt9sNVu	Alejandra Torres	5	21	5	1	f	f	f	2026-03-24 21:40:52.212015	0	Alejandratorresmora4@gmail.com	2	2026-03-24 21:40:52.212015	890ef843-7e01-4971-9a9b-5bf107481c43
20	albertomarquez	$2b$10$Y00OaFvtIulzvPz6au5wgu//ytzYm.cpazn77.1c9Tt14ATCHTdNq	Alberto Marquez	5	21	5	1	f	f	f	2026-03-24 21:40:52.212015	0	Albertomarquez1016@hotmail.com	2	2026-03-24 21:40:52.212015	890ef843-7e01-4971-9a9b-5bf107481c43
18	norveyperez	$2b$10$fcqXtjSLkfKa0tZNI9eq4uvGq0kKdkQmz9ZbB5FUe5/I5HBlUdLGe	Norvey Perez	5	21	5	1	f	f	f	2026-03-24 21:40:52.212015	0	Norveyperezgil01@gmail.com	2	2026-03-24 21:40:52.212015	890ef843-7e01-4971-9a9b-5bf107481c43
19	yivismena	$2b$10$R..W/eV5NVqLTcJN9BZQY.TwBcblKpq4.ie8moDXl5PKyp0KSMrR.	Yivis Mena	5	21	5	1	f	f	f	2026-03-24 21:40:52.212015	0	yimev@yahoo.es	2	2026-03-24 21:40:52.212015	890ef843-7e01-4971-9a9b-5bf107481c43
12	oswaldomartinez	$2b$10$k20prRZH.B2mPFNpIAWHJOByykem3ZH2OF2fokovdDQBxY.r198Ju	Oswaldo Martinez	5	21	5	1	f	f	f	2026-03-24 21:40:52.212015	0	Oswaldomc24@gmail.com	2	2026-03-24 21:40:52.212015	890ef843-7e01-4971-9a9b-5bf107481c43
68	claudiamartinez	$2b$10$.lSDXJqc3MKVsztK8NvTeuu1hwJS68OaDm0IBWRmyj1km1TbJqCpq	Claudia Martinez	6	21	5	1	f	f	f	2026-04-12 22:11:49.326188	100000206	martinezclaudia47@gmail.com	2	2026-04-12 22:11:49.326188	890ef843-7e01-4971-9a9b-5bf107481c43
69	erliortiz	$2b$10$.lSDXJqc3MKVsztK8NvTeuu1hwJS68OaDm0IBWRmyj1km1TbJqCpq	Erli Maria Ortiz Rojas	6	21	5	1	f	f	f	2026-04-12 22:11:49.326188	100000207	ortizrojaserlymaria@gmail.com	2	2026-04-12 22:11:49.326188	890ef843-7e01-4971-9a9b-5bf107481c43
70	francisconiebles	$2b$10$.lSDXJqc3MKVsztK8NvTeuu1hwJS68OaDm0IBWRmyj1km1TbJqCpq	Francisco Javier Niebles Alsina	6	21	5	1	f	f	f	2026-04-12 22:11:49.326188	100000208	fjna0310@gmail.com	2	2026-04-12 22:11:49.326188	890ef843-7e01-4971-9a9b-5bf107481c43
71	haroldcardenas	$2b$10$.lSDXJqc3MKVsztK8NvTeuu1hwJS68OaDm0IBWRmyj1km1TbJqCpq	Harold Cardenas Galvez	6	21	5	1	f	f	f	2026-04-12 22:11:49.326188	100000209	harda28@gmail.com	2	2026-04-12 22:11:49.326188	890ef843-7e01-4971-9a9b-5bf107481c43
72	henrymoreno	$2b$10$.lSDXJqc3MKVsztK8NvTeuu1hwJS68OaDm0IBWRmyj1km1TbJqCpq	Henry Andres Moreno Gonzales	6	21	5	1	f	f	f	2026-04-12 22:11:49.326188	100000210	henryandresmoreno@hotmail.com	2	2026-04-12 22:11:49.326188	890ef843-7e01-4971-9a9b-5bf107481c43
73	jeannievilardy	$2b$10$.lSDXJqc3MKVsztK8NvTeuu1hwJS68OaDm0IBWRmyj1km1TbJqCpq	Jeannie Vilardy Naranjo	6	21	5	1	f	f	f	2026-04-12 22:11:49.326188	100000211	jevina1703@gmail.com	2	2026-04-12 22:11:49.326188	890ef843-7e01-4971-9a9b-5bf107481c43
74	josefafuyeda	$2b$10$.lSDXJqc3MKVsztK8NvTeuu1hwJS68OaDm0IBWRmyj1km1TbJqCpq	Josefa Fuyeda Vasquez	6	21	5	1	f	f	f	2026-04-12 22:11:49.326188	100000212	jacmariaeugeniaalto@gmail.com	2	2026-04-12 22:11:49.326188	890ef843-7e01-4971-9a9b-5bf107481c43
11	arieltorres	$2b$10$q4DuLcBPgOrUQfCaS1CbtelxunG3NmakXvYEjcRhqdQP4DA6yjXIq	Ariel Torres	5	21	5	1	f	f	f	2026-03-24 21:40:52.212015	0	usaboxgerencia@gmail.com	2	2026-03-24 21:40:52.212015	890ef843-7e01-4971-9a9b-5bf107481c43
13	lesliblanco	$2b$10$79..oWByV2IdOXgSaTVbgewI1LFoCqO5QfG2o7xStBfxNYeHXJ7b6	Lesli Blanco	5	21	5	1	f	f	f	2026-03-24 21:40:52.212015	0	inglesliblanco@gmail.com	2	2026-03-24 21:40:52.212015	890ef843-7e01-4971-9a9b-5bf107481c43
14	luiscaviedes	$2b$10$PJPVIkCQiovfY98rc3sbv.WpAUTQ4dlomkpLEqZl.ODRcpepGArRe	Luis Caviedes	5	21	5	1	f	f	f	2026-03-24 21:40:52.212015	0	caviedeslozanoluisjavier@gmail.com	2	2026-03-24 21:40:52.212015	890ef843-7e01-4971-9a9b-5bf107481c43
75	juanbejarano	$2b$10$.lSDXJqc3MKVsztK8NvTeuu1hwJS68OaDm0IBWRmyj1km1TbJqCpq	Juan Felipe Bejarano Rayo	6	21	5	1	f	f	f	2026-04-12 22:11:49.326188	100000213	jfbejarano12@gamil.com	2	2026-04-12 22:11:49.326188	890ef843-7e01-4971-9a9b-5bf107481c43
76	juanpablo	$2b$10$.lSDXJqc3MKVsztK8NvTeuu1hwJS68OaDm0IBWRmyj1km1TbJqCpq	Juan Pablo Pino	6	21	5	1	f	f	f	2026-04-12 22:11:49.326188	100000214	pinomedallesjuan@hotmail.com	2	2026-04-12 22:11:49.326188	890ef843-7e01-4971-9a9b-5bf107481c43
77	karinahernandez	$2b$10$.lSDXJqc3MKVsztK8NvTeuu1hwJS68OaDm0IBWRmyj1km1TbJqCpq	Karina Hernandez Rolong	6	21	5	1	f	f	f	2026-04-12 22:11:49.326188	100000215	kapahero@gmail.com	2	2026-04-12 22:11:49.326188	890ef843-7e01-4971-9a9b-5bf107481c43
78	karinalozano	$2b$10$.lSDXJqc3MKVsztK8NvTeuu1hwJS68OaDm0IBWRmyj1km1TbJqCpq	Karina Lozano Uriel es	6	21	5	1	f	f	f	2026-04-12 22:11:49.326188	100000216	lozanourieleskarina1992@gmail.com	2	2026-04-12 22:11:49.326188	890ef843-7e01-4971-9a9b-5bf107481c43
79	libardolopez	$2b$10$.lSDXJqc3MKVsztK8NvTeuu1hwJS68OaDm0IBWRmyj1km1TbJqCpq	Libardo Lopez Solano	6	21	5	1	f	f	f	2026-04-12 22:11:49.326188	100000217	libarlopez26@gmail.com	2	2026-04-12 22:11:49.326188	890ef843-7e01-4971-9a9b-5bf107481c43
80	mariapayares	$2b$10$.lSDXJqc3MKVsztK8NvTeuu1hwJS68OaDm0IBWRmyj1km1TbJqCpq	Maria Yadibeth Payares Morales	6	21	5	1	f	f	f	2026-04-12 22:11:49.326188	100000218	yadibethpallares01@gmail.com	2	2026-04-12 22:11:49.326188	890ef843-7e01-4971-9a9b-5bf107481c43
81	mauriciojaimes	$2b$10$.lSDXJqc3MKVsztK8NvTeuu1hwJS68OaDm0IBWRmyj1km1TbJqCpq	Mauricio Jaimes Barragan	6	21	5	1	f	f	f	2026-04-12 22:11:49.326188	100000219	Maujaba941215@gmail.com	2	2026-04-12 22:11:49.326188	890ef843-7e01-4971-9a9b-5bf107481c43
82	velquisalvarado	$2b$10$.lSDXJqc3MKVsztK8NvTeuu1hwJS68OaDm0IBWRmyj1km1TbJqCpq	Velquis Alvarado Castro	6	21	5	1	f	f	f	2026-04-12 22:11:49.326188	100000220	velquis.14@gmail.com	2	2026-04-12 22:11:49.326188	890ef843-7e01-4971-9a9b-5bf107481c43
37	vianeyariza	$2b$10$PbIHJdx.e3TmBG0xhLhFhuB2Qut2ALgudkyasQmdcWG8/HbL4di16	Vianey Etsledy Ariza Hernández	3	5	5	1	f	f	f	2026-03-25 14:53:27.50985	0	controlinterno@aguachica-cesar.gov.co	1	2026-03-25 14:53:27.50985	890ef843-7e01-4971-9a9b-5bf107481c43
38	larsontransito	$2b$10$C0ZUuiCEd5bvXxRO9TW59O9nKOq3UlUT0bBaw9xGlYFMmKXdjCEqO	Larson Andrés Agón Quiñonez	21	22	2	1	f	f	f	2026-03-31 17:17:57.814541	91181720	larsonagon@gmail.com	6	2026-03-31 17:17:57.814541	95d4a3e1-98c6-4c5b-a5bf-a9ebd7b31273
39	caroalvareztransito	$2b$10$SBIYUidBmtAh9l/lFKTwP..l1jT9JtYLmCQO5plZjVe9RMoDsS9uy	Carolina Alvarez	22	23	5	1	f	f	f	2026-04-03 01:03:45.370394	0	caritoalqui@gmail.com	6	2026-04-03 01:03:45.370394	95d4a3e1-98c6-4c5b-a5bf-a9ebd7b31273
24	adrianafigueroa	$2b$10$kKSVEtDn2B9QgKAF0Y83OeydjBSh6GnW2dQLm.Jm3Kjln0C0nUZ0q	Adriana Figueroa	5	21	5	1	f	f	f	2026-03-24 21:40:52.212015	0	adrianafigueroapabon@gmail.com	2	2026-03-24 21:40:52.212015	890ef843-7e01-4971-9a9b-5bf107481c43
25	jhaderfajardo	$2b$10$d1yZuxeIAZXcflkTI2IYTe17l4h9mRnOeMaPJJWFqRQOMcXZGXJlC	Jhader Fajardo	5	21	5	1	f	f	f	2026-03-24 21:40:52.212015	0	jhaderfajardo@gmail.com	2	2026-03-24 21:40:52.212015	890ef843-7e01-4971-9a9b-5bf107481c43
23	roquevargas	$2b$10$n/MUukDuEp8aJQcyR3sZsenQD/CSi7QIL7N2eVY3bWaEyDKFD7cSq	Roque Vargas	5	21	5	1	f	f	f	2026-03-24 21:40:52.212015	0	Rovasa08@gmail.com	2	2026-03-24 21:40:52.212015	890ef843-7e01-4971-9a9b-5bf107481c43
26	lizethcampos	$2b$10$CJVPEh2.l1OVnmim/beB0OUxNnXt6vOjgh0F0BNpX72pERZeKNgBO	Lizeth Campos	5	21	5	1	f	f	f	2026-03-24 21:40:52.212015	0	Ac6707605@gmail.com	2	2026-03-24 21:40:52.212015	890ef843-7e01-4971-9a9b-5bf107481c43
27	richardquintero	$2b$10$edAJ7byrDsygrfPIBqiY1eKv/oEEdpHkNUmUqaX8JxY7KzAgFSZCe	Richard Quintero	5	21	5	1	f	f	f	2026-03-24 21:40:52.212015	0	Arq.richardquintero.15@gmail.com	2	2026-03-24 21:40:52.212015	890ef843-7e01-4971-9a9b-5bf107481c43
28	luisbarbudo	$2b$10$zxGcI6/AanwNE6f4YVmyA.qEy/Ma9GClXqNZU0Wth3CkqP.Clxsbe	Luis Barbudo	5	21	5	1	f	f	f	2026-03-24 21:40:52.212015	0	ing.luisbarbudo@gmail.com	2	2026-03-24 21:40:52.212015	890ef843-7e01-4971-9a9b-5bf107481c43
21	yonydelgado	$2b$10$qc9aB0/oL7Z8MIPSLD3PT.W/qZj9NDogG6A0LJbvA5/aTLhw1Q./2	Yony Delgado	5	21	5	1	f	f	f	2026-03-24 21:40:52.212015	0	delgadoangaritayony@gmail.com	2	2026-03-24 21:40:52.212015	890ef843-7e01-4971-9a9b-5bf107481c43
22	cristianangaria	$2b$10$AoCjHj/cuocTbs/l/l7GgOwOYfxLKUfN2KMPpVhVzwTutrVqyt//S	Cristian Angarita	5	21	5	1	f	f	f	2026-03-24 21:40:52.212015	0	ingandresangarita28@gmail.com	2	2026-03-24 21:40:52.212015	890ef843-7e01-4971-9a9b-5bf107481c43
29	jorgepacheco	$2b$10$alhoeRoS7QrNlzzV1VgYEelJMwPEf/BS11V7xgI9S/H9R.B4g25mS	Jorge Pacheco	5	21	5	1	f	f	f	2026-03-24 21:40:52.212015	0	Jdavid25@hotmail.com	2	2026-03-24 21:40:52.212015	890ef843-7e01-4971-9a9b-5bf107481c43
30	gustavocaceres	$2b$10$Ohztwrdz06gfaK0Yq9cSlOEn/1Wa4MmiVr3bvjQJk.RKqR8xh2N9u	Gustavo Caceres	5	10	5	1	f	f	f	2026-03-24 21:40:52.212015	0	tavoch1982@gmail.com	3	2026-03-24 21:40:52.212015	890ef843-7e01-4971-9a9b-5bf107481c43
31	carlosduran	$2b$10$WAXWc3z5vlR9sUDASRYMq.u5y/YP83g6N.r6iGeGTA10sYxd4gpwK	Carlos Duran	5	10	5	1	f	f	f	2026-03-24 21:40:52.212015	0	carlosmauricioduranduran@gmail.com	3	2026-03-24 21:40:52.212015	890ef843-7e01-4971-9a9b-5bf107481c43
32	clararojas	$2b$10$3OuAmI3sUR9FKdBBHvp.cuoAk2xg.zU65KhzIwE1OJYytVe8cSaqW	Clara Rojas	5	10	5	1	f	f	f	2026-03-24 21:40:52.212015	0	rojasdominguezclaraines8@gmail.com	3	2026-03-24 21:40:52.212015	890ef843-7e01-4971-9a9b-5bf107481c43
33	shirlysanchez	$2b$10$9Rw.0/6MYVJ3DC1mr/v80efFjTApSC.mP945t3TUosvaMtb3bQePm	Shirly Sanchez	5	10	5	1	f	f	f	2026-03-24 21:40:52.212015	0	scsancheza.12@gmail.com	3	2026-03-24 21:40:52.212015	890ef843-7e01-4971-9a9b-5bf107481c43
34	lilibethulloa	$2b$10$WrNm0pZ4xIa71Tz6m2Y/7OW64SRJ9AEWEp.o/pREgNUNFrjDcJrXC	Lilibeth Ulloa	5	10	5	1	f	f	f	2026-03-24 21:40:52.212015	0	gpo.seguimiento@gmail.com	3	2026-03-24 21:40:52.212015	890ef843-7e01-4971-9a9b-5bf107481c43
35	dianaalvarez	$2b$10$pPRmzN2bPnITptfurQc.QutWAfIF6/aouSQR2HimYXSia2OqdYnV6	Diana Alvarez	5	10	5	1	f	f	f	2026-03-24 21:40:52.212015	0	usosdesueloplaneacion@gmail.com	3	2026-03-24 21:40:52.212015	890ef843-7e01-4971-9a9b-5bf107481c43
36	cayetanavilamizar	$2b$10$hHWN5C8t95yfkDXP8hYgr.zqMKeIUPHp54o5mfvOupQt37RjbDK02	Cayetana Vilamizar	5	18	5	1	f	f	f	2026-03-24 21:40:52.212015	0	caye1030@gmail.com	5	2026-03-24 21:40:52.212015	890ef843-7e01-4971-9a9b-5bf107481c43
63	angyduque	$2b$10$.lSDXJqc3MKVsztK8NvTeuu1hwJS68OaDm0IBWRmyj1km1TbJqCpq	Angy Lorena Duque Lobo	6	21	5	1	f	f	f	2026-04-12 22:11:49.326188	100000201	angieduque16@gmail.com	2	2026-04-12 22:11:49.326188	890ef843-7e01-4971-9a9b-5bf107481c43
64	alexandrapinedo	$2b$10$.lSDXJqc3MKVsztK8NvTeuu1hwJS68OaDm0IBWRmyj1km1TbJqCpq	Alexandra Pinedo Ramos	6	21	5	1	f	f	f	2026-04-12 22:11:49.326188	100000202	pinedoramosalexandra@gmail.com	2	2026-04-12 22:11:49.326188	890ef843-7e01-4971-9a9b-5bf107481c43
65	andreajimenez	$2b$10$.lSDXJqc3MKVsztK8NvTeuu1hwJS68OaDm0IBWRmyj1km1TbJqCpq	Andrea Fernanda Jimenez Barragan	6	21	5	1	f	f	f	2026-04-12 22:11:49.326188	100000203	andreitaferjimenez@gmail.com	2	2026-04-12 22:11:49.326188	890ef843-7e01-4971-9a9b-5bf107481c43
66	andreadiaz	$2b$10$.lSDXJqc3MKVsztK8NvTeuu1hwJS68OaDm0IBWRmyj1km1TbJqCpq	Andrea Stefania Diaz Daza	6	21	5	1	f	f	f	2026-04-12 22:11:49.326188	100000204	adiazdaza364@gmail.com	2	2026-04-12 22:11:49.326188	890ef843-7e01-4971-9a9b-5bf107481c43
67	andresseles	$2b$10$.lSDXJqc3MKVsztK8NvTeuu1hwJS68OaDm0IBWRmyj1km1TbJqCpq	Andres Seles Gomez Calderon	6	21	5	1	f	f	f	2026-04-12 22:11:49.326188	100000205	andres.seles@gmail.com	2	2026-04-12 22:11:49.326188	890ef843-7e01-4971-9a9b-5bf107481c43
83	yeimyarias	$2b$10$.lSDXJqc3MKVsztK8NvTeuu1hwJS68OaDm0IBWRmyj1km1TbJqCpq	Yeimy Maria Arias Martinez	6	21	5	1	f	f	f	2026-04-12 22:11:49.326188	100000221	yeimyarias1001@gmail.com	2	2026-04-12 22:11:49.326188	890ef843-7e01-4971-9a9b-5bf107481c43
84	yeniangarita	$2b$10$.lSDXJqc3MKVsztK8NvTeuu1hwJS68OaDm0IBWRmyj1km1TbJqCpq	Yeni Paola Angarita Mendoza	6	21	5	1	f	f	f	2026-04-12 22:11:49.326188	100000222	anagritayeni87@gmail.com	2	2026-04-12 22:11:49.326188	890ef843-7e01-4971-9a9b-5bf107481c43
85	michellcanate	$2b$10$.lSDXJqc3MKVsztK8NvTeuu1hwJS68OaDm0IBWRmyj1km1TbJqCpq	Yolanda Michell Cañate Daza	6	21	5	1	f	f	f	2026-04-12 22:11:49.326188	100000223	michelldaza2410@gmail.com	2	2026-04-12 22:11:49.326188	890ef843-7e01-4971-9a9b-5bf107481c43
\.


--
-- Name: auditoria_usuarios_id_seq; Type: SEQUENCE SET; Schema: public; Owner: sipad_user
--

SELECT pg_catalog.setval('public.auditoria_usuarios_id_seq', 88, true);


--
-- Name: cargos_id_seq; Type: SEQUENCE SET; Schema: public; Owner: sipad_user
--

SELECT pg_catalog.setval('public.cargos_id_seq', 23, true);


--
-- Name: dependencias_id_seq; Type: SEQUENCE SET; Schema: public; Owner: sipad_user
--

SELECT pg_catalog.setval('public.dependencias_id_seq', 24, true);


--
-- Name: niveles_id_seq; Type: SEQUENCE SET; Schema: public; Owner: sipad_user
--

SELECT pg_catalog.setval('public.niveles_id_seq', 6, true);


--
-- Name: refresh_tokens_id_seq; Type: SEQUENCE SET; Schema: public; Owner: sipad_user
--

SELECT pg_catalog.setval('public.refresh_tokens_id_seq', 503, true);


--
-- Name: roles_id_seq; Type: SEQUENCE SET; Schema: public; Owner: sipad_user
--

SELECT pg_catalog.setval('public.roles_id_seq', 5, true);


--
-- Name: trd_catalogo_series_id_seq; Type: SEQUENCE SET; Schema: public; Owner: sipad_user
--

SELECT pg_catalog.setval('public.trd_catalogo_series_id_seq', 74, true);


--
-- Name: trd_catalogo_subseries_id_seq; Type: SEQUENCE SET; Schema: public; Owner: sipad_user
--

SELECT pg_catalog.setval('public.trd_catalogo_subseries_id_seq', 194, true);


--
-- Name: usuarios_id_seq; Type: SEQUENCE SET; Schema: public; Owner: sipad_user
--

SELECT pg_catalog.setval('public.usuarios_id_seq', 85, true);


--
-- Name: auditoria_usuarios auditoria_usuarios_pkey; Type: CONSTRAINT; Schema: public; Owner: sipad_user
--

ALTER TABLE ONLY public.auditoria_usuarios
    ADD CONSTRAINT auditoria_usuarios_pkey PRIMARY KEY (id);


--
-- Name: cargos cargos_pkey; Type: CONSTRAINT; Schema: public; Owner: sipad_user
--

ALTER TABLE ONLY public.cargos
    ADD CONSTRAINT cargos_pkey PRIMARY KEY (id);


--
-- Name: dependencias dependencias_codigo_key; Type: CONSTRAINT; Schema: public; Owner: sipad_user
--

ALTER TABLE ONLY public.dependencias
    ADD CONSTRAINT dependencias_codigo_key UNIQUE (codigo);


--
-- Name: dependencias dependencias_pkey; Type: CONSTRAINT; Schema: public; Owner: sipad_user
--

ALTER TABLE ONLY public.dependencias
    ADD CONSTRAINT dependencias_pkey PRIMARY KEY (id);


--
-- Name: entidades entidades_pkey; Type: CONSTRAINT; Schema: public; Owner: sipad_user
--

ALTER TABLE ONLY public.entidades
    ADD CONSTRAINT entidades_pkey PRIMARY KEY (id);


--
-- Name: niveles niveles_pkey; Type: CONSTRAINT; Schema: public; Owner: sipad_user
--

ALTER TABLE ONLY public.niveles
    ADD CONSTRAINT niveles_pkey PRIMARY KEY (id);


--
-- Name: refresh_tokens refresh_tokens_pkey; Type: CONSTRAINT; Schema: public; Owner: sipad_user
--

ALTER TABLE ONLY public.refresh_tokens
    ADD CONSTRAINT refresh_tokens_pkey PRIMARY KEY (id);


--
-- Name: roles roles_pkey; Type: CONSTRAINT; Schema: public; Owner: sipad_user
--

ALTER TABLE ONLY public.roles
    ADD CONSTRAINT roles_pkey PRIMARY KEY (id);


--
-- Name: segtec_actividades segtec_actividades_pkey; Type: CONSTRAINT; Schema: public; Owner: sipad_user
--

ALTER TABLE ONLY public.segtec_actividades
    ADD CONSTRAINT segtec_actividades_pkey PRIMARY KEY (id);


--
-- Name: segtec_analisis_actividad segtec_analisis_actividad_pkey; Type: CONSTRAINT; Schema: public; Owner: sipad_user
--

ALTER TABLE ONLY public.segtec_analisis_actividad
    ADD CONSTRAINT segtec_analisis_actividad_pkey PRIMARY KEY (id);


--
-- Name: segtec_configuracion_dependencia segtec_configuracion_dependencia_pkey; Type: CONSTRAINT; Schema: public; Owner: sipad_user
--

ALTER TABLE ONLY public.segtec_configuracion_dependencia
    ADD CONSTRAINT segtec_configuracion_dependencia_pkey PRIMARY KEY (id);


--
-- Name: segtec_formularios segtec_formularios_pkey; Type: CONSTRAINT; Schema: public; Owner: sipad_user
--

ALTER TABLE ONLY public.segtec_formularios
    ADD CONSTRAINT segtec_formularios_pkey PRIMARY KEY (id);


--
-- Name: segtec_propuestas_ai_new segtec_propuestas_ai_new_pkey; Type: CONSTRAINT; Schema: public; Owner: sipad_user
--

ALTER TABLE ONLY public.segtec_propuestas_ai_new
    ADD CONSTRAINT segtec_propuestas_ai_new_pkey PRIMARY KEY (id);


--
-- Name: segtec_propuestas_ai segtec_propuestas_ai_pkey; Type: CONSTRAINT; Schema: public; Owner: sipad_user
--

ALTER TABLE ONLY public.segtec_propuestas_ai
    ADD CONSTRAINT segtec_propuestas_ai_pkey PRIMARY KEY (id);


--
-- Name: segtec_validacion_tecnica segtec_validacion_tecnica_pkey; Type: CONSTRAINT; Schema: public; Owner: sipad_user
--

ALTER TABLE ONLY public.segtec_validacion_tecnica
    ADD CONSTRAINT segtec_validacion_tecnica_pkey PRIMARY KEY (actividad_id);


--
-- Name: series series_pkey; Type: CONSTRAINT; Schema: public; Owner: sipad_user
--

ALTER TABLE ONLY public.series
    ADD CONSTRAINT series_pkey PRIMARY KEY (id);


--
-- Name: subseries subseries_pkey; Type: CONSTRAINT; Schema: public; Owner: sipad_user
--

ALTER TABLE ONLY public.subseries
    ADD CONSTRAINT subseries_pkey PRIMARY KEY (id);


--
-- Name: tipologias tipologias_pkey; Type: CONSTRAINT; Schema: public; Owner: sipad_user
--

ALTER TABLE ONLY public.tipologias
    ADD CONSTRAINT tipologias_pkey PRIMARY KEY (id);


--
-- Name: trd_catalogo_series trd_catalogo_series_codigo_key; Type: CONSTRAINT; Schema: public; Owner: sipad_user
--

ALTER TABLE ONLY public.trd_catalogo_series
    ADD CONSTRAINT trd_catalogo_series_codigo_key UNIQUE (codigo);


--
-- Name: trd_catalogo_series trd_catalogo_series_pkey; Type: CONSTRAINT; Schema: public; Owner: sipad_user
--

ALTER TABLE ONLY public.trd_catalogo_series
    ADD CONSTRAINT trd_catalogo_series_pkey PRIMARY KEY (id);


--
-- Name: trd_catalogo_subseries trd_catalogo_subseries_codigo_serie_id_key; Type: CONSTRAINT; Schema: public; Owner: sipad_user
--

ALTER TABLE ONLY public.trd_catalogo_subseries
    ADD CONSTRAINT trd_catalogo_subseries_codigo_serie_id_key UNIQUE (codigo, serie_id);


--
-- Name: trd_catalogo_subseries trd_catalogo_subseries_pkey; Type: CONSTRAINT; Schema: public; Owner: sipad_user
--

ALTER TABLE ONLY public.trd_catalogo_subseries
    ADD CONSTRAINT trd_catalogo_subseries_pkey PRIMARY KEY (id);


--
-- Name: trd_reglas_retencion trd_reglas_retencion_pkey; Type: CONSTRAINT; Schema: public; Owner: sipad_user
--

ALTER TABLE ONLY public.trd_reglas_retencion
    ADD CONSTRAINT trd_reglas_retencion_pkey PRIMARY KEY (id);


--
-- Name: trd_series_propuestas trd_series_propuestas_pkey; Type: CONSTRAINT; Schema: public; Owner: sipad_user
--

ALTER TABLE ONLY public.trd_series_propuestas
    ADD CONSTRAINT trd_series_propuestas_pkey PRIMARY KEY (id);


--
-- Name: roles unique_nombre; Type: CONSTRAINT; Schema: public; Owner: sipad_user
--

ALTER TABLE ONLY public.roles
    ADD CONSTRAINT unique_nombre UNIQUE (nombre);


--
-- Name: usuarios usuarios_pkey; Type: CONSTRAINT; Schema: public; Owner: sipad_user
--

ALTER TABLE ONLY public.usuarios
    ADD CONSTRAINT usuarios_pkey PRIMARY KEY (id);


--
-- Name: usuarios usuarios_username_key; Type: CONSTRAINT; Schema: public; Owner: sipad_user
--

ALTER TABLE ONLY public.usuarios
    ADD CONSTRAINT usuarios_username_key UNIQUE (username);


--
-- Name: idx_segtec_actividades_usuario; Type: INDEX; Schema: public; Owner: sipad_user
--

CREATE INDEX idx_segtec_actividades_usuario ON public.segtec_actividades USING btree (usuario_id);


--
-- Name: idx_segtec_analisis_actividad; Type: INDEX; Schema: public; Owner: sipad_user
--

CREATE INDEX idx_segtec_analisis_actividad ON public.segtec_analisis_actividad USING btree (actividad_id);


--
-- Name: idx_segtec_config_dependencia; Type: INDEX; Schema: public; Owner: sipad_user
--

CREATE INDEX idx_segtec_config_dependencia ON public.segtec_configuracion_dependencia USING btree (id_dependencia);


--
-- Name: idx_segtec_form_numero; Type: INDEX; Schema: public; Owner: sipad_user
--

CREATE INDEX idx_segtec_form_numero ON public.segtec_formularios USING btree (numero);


--
-- Name: idx_segtec_form_usuario; Type: INDEX; Schema: public; Owner: sipad_user
--

CREATE INDEX idx_segtec_form_usuario ON public.segtec_formularios USING btree (usuario_id);


--
-- Name: idx_segtec_propuestas_estado; Type: INDEX; Schema: public; Owner: sipad_user
--

CREATE INDEX idx_segtec_propuestas_estado ON public.segtec_propuestas_ai USING btree (estado);


--
-- Name: idx_segtec_propuestas_formulario; Type: INDEX; Schema: public; Owner: sipad_user
--

CREATE INDEX idx_segtec_propuestas_formulario ON public.segtec_propuestas_ai USING btree (formulario_id);


--
-- Name: idx_series_catalogo; Type: INDEX; Schema: public; Owner: sipad_user
--

CREATE INDEX idx_series_catalogo ON public.series USING btree (catalogo_serie_id);


--
-- Name: idx_series_unidad; Type: INDEX; Schema: public; Owner: sipad_user
--

CREATE INDEX idx_series_unidad ON public.series USING btree (unidad_id);


--
-- Name: idx_subseries_catalogo; Type: INDEX; Schema: public; Owner: sipad_user
--

CREATE INDEX idx_subseries_catalogo ON public.subseries USING btree (catalogo_subserie_id);


--
-- Name: idx_trd_actividad; Type: INDEX; Schema: public; Owner: sipad_user
--

CREATE INDEX idx_trd_actividad ON public.trd_series_propuestas USING btree (actividad_id);


--
-- Name: idx_trd_estado; Type: INDEX; Schema: public; Owner: sipad_user
--

CREATE INDEX idx_trd_estado ON public.trd_series_propuestas USING btree (estado);


--
-- Name: auditoria_usuarios auditoria_usuarios_id_usuario_fkey; Type: FK CONSTRAINT; Schema: public; Owner: sipad_user
--

ALTER TABLE ONLY public.auditoria_usuarios
    ADD CONSTRAINT auditoria_usuarios_id_usuario_fkey FOREIGN KEY (id_usuario) REFERENCES public.usuarios(id);


--
-- Name: cargos fk_cargos_entidad; Type: FK CONSTRAINT; Schema: public; Owner: sipad_user
--

ALTER TABLE ONLY public.cargos
    ADD CONSTRAINT fk_cargos_entidad FOREIGN KEY (entidad_id) REFERENCES public.entidades(id);


--
-- Name: dependencias fk_dependencias_entidad; Type: FK CONSTRAINT; Schema: public; Owner: sipad_user
--

ALTER TABLE ONLY public.dependencias
    ADD CONSTRAINT fk_dependencias_entidad FOREIGN KEY (entidad_id) REFERENCES public.entidades(id);


--
-- Name: dependencias fk_dependencias_padre; Type: FK CONSTRAINT; Schema: public; Owner: sipad_user
--

ALTER TABLE ONLY public.dependencias
    ADD CONSTRAINT fk_dependencias_padre FOREIGN KEY (id_padre) REFERENCES public.dependencias(id);


--
-- Name: niveles fk_niveles_entidad; Type: FK CONSTRAINT; Schema: public; Owner: sipad_user
--

ALTER TABLE ONLY public.niveles
    ADD CONSTRAINT fk_niveles_entidad FOREIGN KEY (entidad_id) REFERENCES public.entidades(id);


--
-- Name: segtec_analisis_actividad fk_segtec_analisis_actividad; Type: FK CONSTRAINT; Schema: public; Owner: sipad_user
--

ALTER TABLE ONLY public.segtec_analisis_actividad
    ADD CONSTRAINT fk_segtec_analisis_actividad FOREIGN KEY (actividad_id) REFERENCES public.segtec_actividades(id) ON DELETE CASCADE;


--
-- Name: usuarios fk_usuarios_nivel; Type: FK CONSTRAINT; Schema: public; Owner: sipad_user
--

ALTER TABLE ONLY public.usuarios
    ADD CONSTRAINT fk_usuarios_nivel FOREIGN KEY (id_nivel) REFERENCES public.niveles(id);


--
-- Name: segtec_formularios segtec_formularios_usuario_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: sipad_user
--

ALTER TABLE ONLY public.segtec_formularios
    ADD CONSTRAINT segtec_formularios_usuario_id_fkey FOREIGN KEY (usuario_id) REFERENCES public.usuarios(id) ON DELETE CASCADE;


--
-- Name: segtec_propuestas_ai segtec_propuestas_ai_formulario_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: sipad_user
--

ALTER TABLE ONLY public.segtec_propuestas_ai
    ADD CONSTRAINT segtec_propuestas_ai_formulario_id_fkey FOREIGN KEY (formulario_id) REFERENCES public.segtec_formularios(id) ON DELETE CASCADE;


--
-- Name: segtec_propuestas_ai_new segtec_propuestas_ai_new_actividad_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: sipad_user
--

ALTER TABLE ONLY public.segtec_propuestas_ai_new
    ADD CONSTRAINT segtec_propuestas_ai_new_actividad_id_fkey FOREIGN KEY (actividad_id) REFERENCES public.segtec_actividades(id) ON DELETE CASCADE;


--
-- Name: segtec_validacion_tecnica segtec_validacion_tecnica_actividad_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: sipad_user
--

ALTER TABLE ONLY public.segtec_validacion_tecnica
    ADD CONSTRAINT segtec_validacion_tecnica_actividad_id_fkey FOREIGN KEY (actividad_id) REFERENCES public.segtec_actividades(id) ON DELETE CASCADE;


--
-- Name: series series_catalogo_serie_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: sipad_user
--

ALTER TABLE ONLY public.series
    ADD CONSTRAINT series_catalogo_serie_id_fkey FOREIGN KEY (catalogo_serie_id) REFERENCES public.trd_catalogo_series(id);


--
-- Name: subseries subseries_catalogo_subserie_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: sipad_user
--

ALTER TABLE ONLY public.subseries
    ADD CONSTRAINT subseries_catalogo_subserie_id_fkey FOREIGN KEY (catalogo_subserie_id) REFERENCES public.trd_catalogo_subseries(id);


--
-- Name: trd_catalogo_subseries trd_catalogo_subseries_serie_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: sipad_user
--

ALTER TABLE ONLY public.trd_catalogo_subseries
    ADD CONSTRAINT trd_catalogo_subseries_serie_id_fkey FOREIGN KEY (serie_id) REFERENCES public.trd_catalogo_series(id) ON DELETE CASCADE;


--
-- Name: trd_series_propuestas trd_series_propuestas_actividad_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: sipad_user
--

ALTER TABLE ONLY public.trd_series_propuestas
    ADD CONSTRAINT trd_series_propuestas_actividad_id_fkey FOREIGN KEY (actividad_id) REFERENCES public.segtec_actividades(id) ON DELETE CASCADE;


--
-- Name: FUNCTION armor(bytea); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION public.armor(bytea) TO sipad_user;


--
-- Name: FUNCTION armor(bytea, text[], text[]); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION public.armor(bytea, text[], text[]) TO sipad_user;


--
-- Name: FUNCTION crypt(text, text); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION public.crypt(text, text) TO sipad_user;


--
-- Name: FUNCTION dearmor(text); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION public.dearmor(text) TO sipad_user;


--
-- Name: FUNCTION decrypt(bytea, bytea, text); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION public.decrypt(bytea, bytea, text) TO sipad_user;


--
-- Name: FUNCTION decrypt_iv(bytea, bytea, bytea, text); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION public.decrypt_iv(bytea, bytea, bytea, text) TO sipad_user;


--
-- Name: FUNCTION digest(bytea, text); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION public.digest(bytea, text) TO sipad_user;


--
-- Name: FUNCTION digest(text, text); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION public.digest(text, text) TO sipad_user;


--
-- Name: FUNCTION encrypt(bytea, bytea, text); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION public.encrypt(bytea, bytea, text) TO sipad_user;


--
-- Name: FUNCTION encrypt_iv(bytea, bytea, bytea, text); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION public.encrypt_iv(bytea, bytea, bytea, text) TO sipad_user;


--
-- Name: FUNCTION fips_mode(); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION public.fips_mode() TO sipad_user;


--
-- Name: FUNCTION gen_random_bytes(integer); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION public.gen_random_bytes(integer) TO sipad_user;


--
-- Name: FUNCTION gen_random_uuid(); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION public.gen_random_uuid() TO sipad_user;


--
-- Name: FUNCTION gen_salt(text); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION public.gen_salt(text) TO sipad_user;


--
-- Name: FUNCTION gen_salt(text, integer); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION public.gen_salt(text, integer) TO sipad_user;


--
-- Name: FUNCTION hmac(bytea, bytea, text); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION public.hmac(bytea, bytea, text) TO sipad_user;


--
-- Name: FUNCTION hmac(text, text, text); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION public.hmac(text, text, text) TO sipad_user;


--
-- Name: FUNCTION pgp_armor_headers(text, OUT key text, OUT value text); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION public.pgp_armor_headers(text, OUT key text, OUT value text) TO sipad_user;


--
-- Name: FUNCTION pgp_key_id(bytea); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION public.pgp_key_id(bytea) TO sipad_user;


--
-- Name: FUNCTION pgp_pub_decrypt(bytea, bytea); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION public.pgp_pub_decrypt(bytea, bytea) TO sipad_user;


--
-- Name: FUNCTION pgp_pub_decrypt(bytea, bytea, text); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION public.pgp_pub_decrypt(bytea, bytea, text) TO sipad_user;


--
-- Name: FUNCTION pgp_pub_decrypt(bytea, bytea, text, text); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION public.pgp_pub_decrypt(bytea, bytea, text, text) TO sipad_user;


--
-- Name: FUNCTION pgp_pub_decrypt_bytea(bytea, bytea); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION public.pgp_pub_decrypt_bytea(bytea, bytea) TO sipad_user;


--
-- Name: FUNCTION pgp_pub_decrypt_bytea(bytea, bytea, text); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION public.pgp_pub_decrypt_bytea(bytea, bytea, text) TO sipad_user;


--
-- Name: FUNCTION pgp_pub_decrypt_bytea(bytea, bytea, text, text); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION public.pgp_pub_decrypt_bytea(bytea, bytea, text, text) TO sipad_user;


--
-- Name: FUNCTION pgp_pub_encrypt(text, bytea); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION public.pgp_pub_encrypt(text, bytea) TO sipad_user;


--
-- Name: FUNCTION pgp_pub_encrypt(text, bytea, text); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION public.pgp_pub_encrypt(text, bytea, text) TO sipad_user;


--
-- Name: FUNCTION pgp_pub_encrypt_bytea(bytea, bytea); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION public.pgp_pub_encrypt_bytea(bytea, bytea) TO sipad_user;


--
-- Name: FUNCTION pgp_pub_encrypt_bytea(bytea, bytea, text); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION public.pgp_pub_encrypt_bytea(bytea, bytea, text) TO sipad_user;


--
-- Name: FUNCTION pgp_sym_decrypt(bytea, text); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION public.pgp_sym_decrypt(bytea, text) TO sipad_user;


--
-- Name: FUNCTION pgp_sym_decrypt(bytea, text, text); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION public.pgp_sym_decrypt(bytea, text, text) TO sipad_user;


--
-- Name: FUNCTION pgp_sym_decrypt_bytea(bytea, text); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION public.pgp_sym_decrypt_bytea(bytea, text) TO sipad_user;


--
-- Name: FUNCTION pgp_sym_decrypt_bytea(bytea, text, text); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION public.pgp_sym_decrypt_bytea(bytea, text, text) TO sipad_user;


--
-- Name: FUNCTION pgp_sym_encrypt(text, text); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION public.pgp_sym_encrypt(text, text) TO sipad_user;


--
-- Name: FUNCTION pgp_sym_encrypt(text, text, text); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION public.pgp_sym_encrypt(text, text, text) TO sipad_user;


--
-- Name: FUNCTION pgp_sym_encrypt_bytea(bytea, text); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION public.pgp_sym_encrypt_bytea(bytea, text) TO sipad_user;


--
-- Name: FUNCTION pgp_sym_encrypt_bytea(bytea, text, text); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION public.pgp_sym_encrypt_bytea(bytea, text, text) TO sipad_user;


--
-- Name: DEFAULT PRIVILEGES FOR SEQUENCES; Type: DEFAULT ACL; Schema: -; Owner: postgres
--

ALTER DEFAULT PRIVILEGES FOR ROLE postgres GRANT ALL ON SEQUENCES TO sipad_user;


--
-- Name: DEFAULT PRIVILEGES FOR TYPES; Type: DEFAULT ACL; Schema: -; Owner: postgres
--

ALTER DEFAULT PRIVILEGES FOR ROLE postgres GRANT ALL ON TYPES TO sipad_user;


--
-- Name: DEFAULT PRIVILEGES FOR FUNCTIONS; Type: DEFAULT ACL; Schema: -; Owner: postgres
--

ALTER DEFAULT PRIVILEGES FOR ROLE postgres GRANT ALL ON FUNCTIONS TO sipad_user;


--
-- Name: DEFAULT PRIVILEGES FOR TABLES; Type: DEFAULT ACL; Schema: -; Owner: postgres
--

ALTER DEFAULT PRIVILEGES FOR ROLE postgres GRANT ALL ON TABLES TO sipad_user;


--
-- PostgreSQL database dump complete
--

\unrestrict MyMFbZcepuwYcpTYFhHQecR5mimbeXsX5YV1Lv7IJzVeinqOHwv7UPlWHdbShfc

