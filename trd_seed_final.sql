-- =================================================================
-- MIGRACIÓN + SEED TRD — SIPAD
-- Adaptado al schema real existente en la base de datos
--
-- Qué hace este script:
--   1. Agrega columnas faltantes a las tablas existentes
--   2. Crea las tablas nuevas necesarias
--   3. Inserta/actualiza el catálogo completo de series y subseries
--
-- Es seguro ejecutar varias veces (idempotente)
-- =================================================================

-- Debe ejecutarse fuera de la transacción
CREATE EXTENSION IF NOT EXISTS unaccent;

BEGIN;

-- =================================================================
-- PASO 1: MIGRAR trd_catalogo_series
-- Agregar columnas que el motor necesita y que no existen aún
-- =================================================================

ALTER TABLE trd_catalogo_series
  ADD COLUMN IF NOT EXISTS nombre_normalizado TEXT,
  ADD COLUMN IF NOT EXISTS tipo_funcion       TEXT
    CHECK (tipo_funcion IN ('misional','apoyo','estrategica')),
  ADD COLUMN IF NOT EXISTS tipo_entidad       TEXT[] NOT NULL DEFAULT '{universal}';

-- Poblar nombre_normalizado para filas existentes
UPDATE trd_catalogo_series
SET nombre_normalizado = lower(unaccent(nombre))
WHERE nombre_normalizado IS NULL;

-- Ahora hacerlo NOT NULL y agregar índice único
ALTER TABLE trd_catalogo_series
  ALTER COLUMN nombre_normalizado SET NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS uq_series_nombre_norm
  ON trd_catalogo_series(nombre_normalizado);

-- =================================================================
-- PASO 2: MIGRAR trd_catalogo_subseries
-- =================================================================

ALTER TABLE trd_catalogo_subseries
  ADD COLUMN IF NOT EXISTS nombre_normalizado TEXT,
  ADD COLUMN IF NOT EXISTS palabras_clave     TEXT[]   NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS retencion_gestion  SMALLINT NOT NULL DEFAULT 2,
  ADD COLUMN IF NOT EXISTS retencion_central  SMALLINT NOT NULL DEFAULT 5,
  ADD COLUMN IF NOT EXISTS disposicion_final  TEXT     NOT NULL DEFAULT 'eliminacion'
    CHECK (disposicion_final IN ('conservacion_total','eliminacion','seleccion','microfilmacion')),
  ADD COLUMN IF NOT EXISTS aplica_entidad     TEXT[]   NOT NULL DEFAULT '{universal}';

UPDATE trd_catalogo_subseries
SET nombre_normalizado = lower(unaccent(nombre))
WHERE nombre_normalizado IS NULL;

ALTER TABLE trd_catalogo_subseries
  ALTER COLUMN nombre_normalizado SET NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS uq_subseries_serie_nombre_norm
  ON trd_catalogo_subseries(serie_id, nombre_normalizado);

-- =================================================================
-- PASO 3: CREAR TABLAS NUEVAS
-- =================================================================

CREATE TABLE IF NOT EXISTS trd_tipologias_documentales (
  id                 SERIAL   PRIMARY KEY,
  subserie_id        INTEGER  NOT NULL
    REFERENCES trd_catalogo_subseries(id) ON DELETE CASCADE,
  nombre             TEXT     NOT NULL,
  nombre_normalizado TEXT     NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_tipologias_subserie
  ON trd_tipologias_documentales(subserie_id);

-- -----------------------------------------------------------------

CREATE TABLE IF NOT EXISTS trd_normas_referencia (
  id            SERIAL  PRIMARY KEY,
  codigo        TEXT    NOT NULL UNIQUE,
  nombre        TEXT    NOT NULL,
  descripcion   TEXT,
  aplica_series TEXT[]  DEFAULT '{}'
);

-- =================================================================
-- PASO 4: FUNCIÓN DE BÚSQUEDA
-- =================================================================

CREATE OR REPLACE FUNCTION trd_buscar_clasificacion(tokens TEXT[])
RETURNS TABLE (
  serie       TEXT,
  subserie    TEXT,
  gestion     SMALLINT,
  central     SMALLINT,
  disposicion TEXT,
  score       INT
)
LANGUAGE SQL STABLE AS $$
  SELECT
    cs.nombre,
    csub.nombre,
    csub.retencion_gestion,
    csub.retencion_central,
    csub.disposicion_final,
    (
      SELECT COUNT(*)::INT FROM unnest(csub.palabras_clave) kw
      WHERE kw = ANY(tokens)
    ) * 3
    + (
      SELECT COUNT(*)::INT FROM unnest(tokens) tk
      WHERE csub.nombre_normalizado ILIKE '%' || tk || '%'
    ) * 2
    + (
      SELECT COUNT(*)::INT FROM unnest(tokens) tk
      WHERE cs.nombre_normalizado ILIKE '%' || tk || '%'
    ) AS score
  FROM trd_catalogo_subseries csub
  JOIN trd_catalogo_series cs ON cs.id = csub.serie_id
  ORDER BY score DESC
  LIMIT 5;
$$;

-- =================================================================
-- PASO 5: INSERTAR SERIES
-- ON CONFLICT sobre codigo: actualiza si ya existe
-- =================================================================

INSERT INTO trd_catalogo_series
  (codigo, nombre, nombre_normalizado, tipo_funcion, tipo_entidad, activo)
VALUES

-- ── TRANSVERSALES ─────────────────────────────────────────────
('S-AA',  'ACTOS ADMINISTRATIVOS',           'actos administrativos',           'estrategica', '{universal}',            true),
('S-CT',  'CONTRATOS',                       'contratos',                       'misional',    '{universal}',            true),
('S-HL',  'HISTORIAS LABORALES',             'historias laborales',             'apoyo',       '{universal}',            true),
('S-IN',  'INFORMES',                        'informes',                        'apoyo',       '{universal}',            true),
('S-PL',  'PLANES',                          'planes',                          'estrategica', '{universal}',            true),
('S-PR',  'PRESUPUESTO',                     'presupuesto',                     'apoyo',       '{universal}',            true),
('S-PQ',  'PQRS',                            'pqrs',                            'misional',    '{universal}',            true),
('S-GD',  'GESTIÓN DOCUMENTAL',              'gestion documental',              'apoyo',       '{universal}',            true),
('S-CO',  'CORRESPONDENCIA',                 'correspondencia',                 'apoyo',       '{universal}',            true),
('S-AC',  'ACTAS',                           'actas',                           'apoyo',       '{universal}',            true),
('S-CE',  'CERTIFICADOS',                    'certificados',                    'apoyo',       '{universal}',            true),
('S-CN',  'CONCEPTOS',                       'conceptos',                       'apoyo',       '{universal}',            true),
('S-BI',  'BIENES E INVENTARIOS',            'bienes e inventarios',            'apoyo',       '{universal}',            true),
('S-CB',  'CONTABILIDAD',                    'contabilidad',                    'apoyo',       '{universal}',            true),
('S-NM',  'NÓMINA Y SEGURIDAD SOCIAL',       'nomina y seguridad social',       'apoyo',       '{universal}',            true),
('S-GC',  'GESTIÓN DE CALIDAD',              'gestion de calidad',              'apoyo',       '{universal}',            true),
('S-TI',  'TECNOLOGÍA E INFORMÁTICA',        'tecnologia e informatica',        'apoyo',       '{universal}',            true),
('S-CI',  'COMUNICACIONES INSTITUCIONALES',  'comunicaciones institucionales',  'apoyo',       '{universal}',            true),

-- ── MISIONALES ALCALDÍA / GOBERNACIÓN ─────────────────────────
-- NOMBRE CORRECTO: ACCIONES CONSTITUCIONALES (verificado BANTER AGN)
('S-ACO', 'ACCIONES CONSTITUCIONALES',       'acciones constitucionales',       'misional',    '{alcaldia,gobernacion,personeria}', true),
('S-LP',  'LICENCIAS Y PERMISOS',            'licencias y permisos',            'misional',    '{alcaldia,gobernacion}', true),
('S-IV',  'INSPECCIONES Y VISITAS',          'inspecciones y visitas',          'misional',    '{alcaldia,gobernacion,transito}', true),
('S-PI',  'PROYECTOS DE INVERSIÓN',          'proyectos de inversion',          'misional',    '{alcaldia,gobernacion}', true),
('S-AV',  'ATENCIÓN A VÍCTIMAS',             'atencion a victimas',             'misional',    '{alcaldia,gobernacion}', true),
('S-GR',  'GESTIÓN DEL RIESGO',              'gestion del riesgo',              'misional',    '{alcaldia,gobernacion}', true),
('S-DS',  'DESARROLLO SOCIAL',               'desarrollo social',               'misional',    '{alcaldia,gobernacion}', true),
('S-OT',  'ORDENAMIENTO TERRITORIAL',        'ordenamiento territorial',        'misional',    '{alcaldia,gobernacion}', true),
('S-SP',  'SALUD PÚBLICA',                   'salud publica',                   'misional',    '{alcaldia,gobernacion,hospital}', true),
('S-EM',  'EDUCACIÓN MUNICIPAL',             'educacion municipal',             'misional',    '{alcaldia,gobernacion}', true),
('S-VV',  'VIVIENDA',                        'vivienda',                        'misional',    '{alcaldia,gobernacion}', true),
('S-GA',  'GESTIÓN AMBIENTAL',               'gestion ambiental',               'misional',    '{alcaldia,gobernacion}', true),
('S-FE',  'FOMENTO Y DESARROLLO ECONÓMICO',  'fomento y desarrollo economico',  'misional',    '{alcaldia,gobernacion}', true),
('S-MI',  'MINERÍA',                         'mineria',                         'misional',    '{alcaldia,gobernacion}', true),
('S-ET',  'ASUNTOS ÉTNICOS',                 'asuntos etnicos',                 'misional',    '{alcaldia,gobernacion}', true),
('S-IA',  'PRIMERA INFANCIA Y ADOLESCENCIA', 'primera infancia y adolescencia', 'misional',    '{alcaldia,gobernacion}', true),

-- ── GOBERNACIÓN ───────────────────────────────────────────────
('S-RG',  'REGALÍAS',                        'regalias',                        'misional',    '{gobernacion}',          true),
('S-RM',  'RELACIONES CON MUNICIPIOS',       'relaciones con municipios',       'misional',    '{gobernacion}',          true),

-- ── CONCEJO MUNICIPAL ─────────────────────────────────────────
('S-CP',  'CONTROL POLÍTICO',                'control politico',                'misional',    '{concejo}',              true),
('S-DL',  'DEBATE LEGISLATIVO',              'debate legislativo',              'misional',    '{concejo}',              true),
('S-PP',  'PROPOSICIONES',                   'proposiciones',                   'misional',    '{concejo}',              true),

-- ── PERSONERÍA ────────────────────────────────────────────────
('S-ID',  'INVESTIGACIONES DISCIPLINARIAS',  'investigaciones disciplinarias',  'misional',    '{personeria}',           true),
('S-DH',  'DERECHOS HUMANOS',                'derechos humanos',                'misional',    '{personeria,alcaldia}',  true),
('S-MP',  'MINISTERIO PÚBLICO',              'ministerio publico',              'misional',    '{personeria}',           true),
('S-VC',  'VEEDURÍA CIUDADANA',              'veeduria ciudadana',              'misional',    '{personeria}',           true),

-- ── HOSPITAL / ESE ────────────────────────────────────────────
('S-HC',  'HISTORIAS CLÍNICAS',              'historias clinicas',              'misional',    '{hospital}',             true),
('S-SS',  'SERVICIOS DE SALUD',              'servicios de salud',              'misional',    '{hospital}',             true),
('S-GF',  'GESTIÓN FARMACÉUTICA',            'gestion farmaceutica',            'misional',    '{hospital}',             true),
('S-UE',  'URGENCIAS Y EMERGENCIAS',         'urgencias y emergencias',         'misional',    '{hospital}',             true),

-- ── TRÁNSITO ──────────────────────────────────────────────────
('S-RA',  'REGISTRO AUTOMOTOR',              'registro automotor',              'misional',    '{transito}',             true),
('S-LC',  'LICENCIAS DE CONDUCCIÓN',         'licencias de conduccion',         'misional',    '{transito}',             true),
('S-IT',  'INFRACCIONES DE TRÁNSITO',        'infracciones de transito',        'misional',    '{transito}',             true),
('S-AT',  'ACCIDENTES DE TRÁNSITO',          'accidentes de transito',          'misional',    '{transito}',             true),
('S-RT',  'REVISIÓN TÉCNICO-MECÁNICA',       'revision tecnico mecanica',       'misional',    '{transito}',             true)

ON CONFLICT (nombre_normalizado) DO UPDATE SET
  codigo       = EXCLUDED.codigo,
  nombre       = EXCLUDED.nombre,
  tipo_funcion = EXCLUDED.tipo_funcion,
  tipo_entidad = EXCLUDED.tipo_entidad;

-- =================================================================
-- PASO 6: INSERTAR SUBSERIES
-- ON CONFLICT sobre (codigo, serie_id): actualiza si ya existe
-- =================================================================

INSERT INTO trd_catalogo_subseries
  (codigo, serie_id, nombre, nombre_normalizado, palabras_clave,
   retencion_gestion, retencion_central, disposicion_final, aplica_entidad, activo)

SELECT
  sub.codigo,
  cs.id AS serie_id,
  sub.nombre,
  lower(unaccent(sub.nombre))         AS nombre_normalizado,
  sub.palabras_clave::text[],
  sub.retencion_gestion::smallint,
  sub.retencion_central::smallint,
  sub.disposicion_final::text,
  sub.aplica_entidad::text[],
  true
FROM (VALUES

  -- ── ACTOS ADMINISTRATIVOS (S-AA) ──────────────────────────────
  ('S-AA','AA-01','Resoluciones',
   '{resolucion,resoluciones,acto,administrativo,numero}',
   5,10,'conservacion_total','{universal}'),

  ('S-AA','AA-02','Decretos',
   '{decreto,decretos,ejecutivo,alcalde,gobernador}',
   5,10,'conservacion_total','{universal}'),

  ('S-AA','AA-03','Circulares',
   '{circular,circulares,instruccion,lineamiento}',
   2,5,'eliminacion','{universal}'),

  ('S-AA','AA-04','Acuerdos municipales',
   '{acuerdo,acuerdos,municipal,municipio,concejo}',
   5,10,'conservacion_total','{alcaldia,concejo}'),

  ('S-AA','AA-05','Ordenanzas departamentales',
   '{ordenanza,ordenanzas,departamental,asamblea,departamento}',
   5,10,'conservacion_total','{gobernacion}'),

  ('S-AA','AA-06','Directivas y lineamientos',
   '{directiva,directivas,lineamiento}',
   2,5,'seleccion','{universal}'),

  -- ── CONTRATOS (S-CT) ──────────────────────────────────────────
  -- Prescripción Art. 50-53 Ley 80/1993: 20 años (5g + 15c)
  ('S-CT','CT-01','Contratos de prestación de servicios',
   '{contrato,prestacion,servicios,honorarios,consultor,profesional,independiente,pss}',
   5,15,'conservacion_total','{universal}'),

  ('S-CT','CT-02','Contratos de obra',
   '{contrato,obra,construccion,infraestructura,obras,civil,pavimento}',
   5,15,'conservacion_total','{universal}'),

  ('S-CT','CT-03','Contratos de suministro',
   '{contrato,suministro,compraventa,bienes,insumos,materiales}',
   5,15,'conservacion_total','{universal}'),

  ('S-CT','CT-04','Convenios interadministrativos',
   '{convenio,interadministrativo,cooperacion,entidades,asociacion}',
   5,15,'conservacion_total','{universal}'),

  ('S-CT','CT-05','Contratos de arrendamiento',
   '{contrato,arrendamiento,arrendar,alquiler,inmueble}',
   5,15,'conservacion_total','{universal}'),

  ('S-CT','CT-06','Contratos de concesión',
   '{contrato,concesion,concesionario,explotacion}',
   5,15,'conservacion_total','{universal}'),

  ('S-CT','CT-07','Contratos de mantenimiento',
   '{contrato,mantenimiento,reparacion,soporte,tecnico}',
   5,15,'conservacion_total','{universal}'),

  ('S-CT','CT-08','Contratos de seguros',
   '{contrato,seguro,poliza,aseguradora,prima}',
   5,5,'eliminacion','{universal}'),

  -- ── HISTORIAS LABORALES (S-HL) ────────────────────────────────
  ('S-HL','HL-01','Historias laborales de servidores públicos',
   '{historia,laboral,servidor,publico,funcionario,empleado,expediente,personal,carrera,administrativa}',
   10,80,'conservacion_total','{universal}'),

  ('S-HL','HL-02','Historias laborales de contratistas',
   '{historia,laboral,contratista,prestacion,servicios,independiente}',
   5,10,'eliminacion','{universal}'),

  ('S-HL','HL-03','Hojas de vida',
   '{hoja,vida,curriculum,aspirante,candidato,inscripcion}',
   2,3,'eliminacion','{universal}'),

  ('S-HL','HL-04','Declaraciones de bienes y rentas',
   '{declaracion,bienes,rentas,patrimonio,transparencia}',
   5,10,'seleccion','{universal}'),

  -- ── INFORMES (S-IN) ───────────────────────────────────────────
  ('S-IN','IN-01','Informes de gestión',
   '{informe,gestion,resultado,avance,ejecucion,logro,balance}',
   2,8,'seleccion','{universal}'),

  ('S-IN','IN-02','Informes de auditoría',
   '{informe,auditoria,hallazgo,control,fiscal}',
   2,8,'conservacion_total','{universal}'),

  ('S-IN','IN-03','Informes de control interno',
   '{informe,control,interno,seguimiento,evaluacion,autocontrol}',
   2,5,'seleccion','{universal}'),

  ('S-IN','IN-04','Informes de rendición de cuentas',
   '{informe,rendicion,cuentas,transparencia,gestion,ciudadano,publico}',
   2,8,'conservacion_total','{universal}'),

  ('S-IN','IN-05','Informes técnicos',
   '{informe,tecnico,estudio,diagnostico,evaluacion,ingenieria}',
   2,5,'seleccion','{universal}'),

  ('S-IN','IN-06','Informes de supervisión de contratos',
   '{informe,supervision,contrato,supervisor,cumplimiento,obligacion}',
   5,15,'conservacion_total','{universal}'),

  ('S-IN','IN-07','Informes de interventoría',
   '{informe,interventoria,interventor,obra,contrato,avance}',
   5,15,'conservacion_total','{universal}'),

  -- Sector Salud — fuente BANTER AGN nov. 2023
  ('S-IN','IN-08','Informes de Auditoría para el Aseguramiento y Prestación del Servicio',
   '{informe,auditoria,aseguramiento,prestacion,servicio,eps,salud,supersalud,ips}',
   5,5,'conservacion_total','{hospital,alcaldia,gobernacion}'),

  -- ── PLANES (S-PL) ─────────────────────────────────────────────
  ('S-PL','PL-01','Plan de desarrollo',
   '{plan,desarrollo,cuatrienal,programa,gobierno}',
   4,30,'conservacion_total','{alcaldia,gobernacion}'),

  ('S-PL','PL-02','Plan de acción',
   '{plan,accion,institucional,anual,actividades}',
   2,5,'seleccion','{universal}'),

  ('S-PL','PL-03','Plan de mejoramiento',
   '{plan,mejoramiento,mejoras,correctivo,hallazgo}',
   2,5,'seleccion','{universal}'),

  ('S-PL','PL-04','Plan institucional de archivos - PINAR',
   '{plan,archivo,institucional,gestion,documental,pinar,archivistica}',
   2,30,'conservacion_total','{universal}'),

  ('S-PL','PL-05','Plan de capacitación',
   '{plan,capacitacion,formacion,entrenamiento,aprendizaje}',
   2,3,'eliminacion','{universal}'),

  ('S-PL','PL-06','Plan de gestión del riesgo',
   '{plan,gestion,riesgo,desastre,emergencia,amenaza,vulnerabilidad}',
   3,30,'conservacion_total','{alcaldia,gobernacion}'),

  ('S-PL','PL-07','Plan de ordenamiento territorial - POT',
   '{plan,ordenamiento,territorial,pot,urbano,rural,uso,suelo}',
   4,30,'conservacion_total','{alcaldia}'),

  ('S-PL','PL-08','Plan anticorrupción y de atención al ciudadano',
   '{plan,anticorrupcion,atencion,ciudadano,transparencia,mapa,riesgo}',
   2,5,'seleccion','{universal}'),

  ('S-PL','PL-09','Plan estratégico institucional',
   '{plan,estrategico,institucional,mision,vision,objetivo}',
   4,10,'conservacion_total','{universal}'),

  -- Sector Salud — fuente BANTER AGN nov. 2023
  ('S-PL','PL-10','Planes de Salud Pública de Intervención Colectiva',
   '{plan,salud,publica,intervencion,colectiva,pic,promocion,prevencion,bienal}',
   5,5,'conservacion_total','{hospital,alcaldia,gobernacion}'),

  -- ── PRESUPUESTO (S-PR) ────────────────────────────────────────
  ('S-PR','PR-01','Presupuesto anual de rentas y gastos',
   '{presupuesto,anual,rentas,gastos,apropiacion,vigencia}',
   2,10,'conservacion_total','{universal}'),

  ('S-PR','PR-02','Adiciones y modificaciones presupuestales',
   '{adicion,modificacion,presupuestal,presupuesto,rubro}',
   2,8,'seleccion','{universal}'),

  ('S-PR','PR-03','Traslados presupuestales',
   '{traslado,presupuestal,rubro,contracredito}',
   2,5,'eliminacion','{universal}'),

  ('S-PR','PR-04','Ejecución presupuestal',
   '{ejecucion,presupuestal,obligacion,pago,reserva}',
   2,10,'conservacion_total','{universal}'),

  ('S-PR','PR-05','Certificados de disponibilidad presupuestal',
   '{certificado,disponibilidad,presupuestal,cdp}',
   2,5,'eliminacion','{universal}'),

  ('S-PR','PR-06','Registros presupuestales de compromiso',
   '{registro,presupuestal,compromiso,rp,obligacion,rubro}',
   2,5,'eliminacion','{universal}'),

  -- ── PQRS (S-PQ) ───────────────────────────────────────────────
  ('S-PQ','PQ-01','Derechos de petición',
   '{derecho,peticion,solicitud,ciudadano,peticionario,requerimiento,respuesta,oficio}',
   2,5,'eliminacion','{universal}'),

  ('S-PQ','PQ-02','Quejas y reclamos',
   '{queja,reclamo,inconformidad,ciudadano,reclamacion}',
   2,3,'eliminacion','{universal}'),

  ('S-PQ','PQ-03','Recursos de reposición y apelación',
   '{recurso,reposicion,apelacion,impugnacion,acto}',
   2,5,'seleccion','{universal}'),

  ('S-PQ','PQ-04','Denuncias ciudadanas',
   '{denuncia,ciudadana,irregularidad,corrupcion}',
   2,5,'seleccion','{universal}'),

  -- ── GESTIÓN DOCUMENTAL (S-GD) ─────────────────────────────────
  ('S-GD','GD-01','Tablas de retención documental',
   '{tabla,retencion,documental,trd,series,subseries,convalidacion,banter}',
   2,30,'conservacion_total','{universal}'),

  ('S-GD','GD-02','Tablas de valoración documental',
   '{tabla,valoracion,documental,tvd,fondos,acumulados}',
   2,30,'conservacion_total','{universal}'),

  ('S-GD','GD-03','Inventarios documentales',
   '{inventario,documental,fuid,formato,unico}',
   2,5,'seleccion','{universal}'),

  ('S-GD','GD-04','Transferencias documentales',
   '{transferencia,documental,archivo,central,historico}',
   2,5,'eliminacion','{universal}'),

  ('S-GD','GD-05','Programa de gestión documental',
   '{programa,gestion,documental,pgd,ciclo,vital}',
   2,30,'conservacion_total','{universal}'),

  ('S-GD','GD-06','Actas de eliminación documental',
   '{acta,eliminacion,documental,baja,destruccion}',
   2,30,'conservacion_total','{universal}'),

  -- ── CORRESPONDENCIA (S-CO) ────────────────────────────────────
  ('S-CO','CO-01','Comunicaciones oficiales recibidas',
   '{comunicacion,oficial,recibida,entrada,oficio,radicado}',
   2,3,'eliminacion','{universal}'),

  ('S-CO','CO-02','Comunicaciones oficiales enviadas',
   '{comunicacion,oficial,enviada,salida,oficio,radicado}',
   2,3,'eliminacion','{universal}'),

  ('S-CO','CO-03','Memorandos',
   '{memorando,memo,memorandum,interno,directivo}',
   2,3,'eliminacion','{universal}'),

  ('S-CO','CO-04','Circulares internas',
   '{circular,interna,instruccion,comunicado}',
   2,3,'eliminacion','{universal}'),

  -- ── ACTAS (S-AC) ──────────────────────────────────────────────
  ('S-AC','AC-01','Actas de consejo de gobierno',
   '{acta,consejo,gobierno,alcaldia,gobernacion,despacho,sesion}',
   5,10,'conservacion_total','{alcaldia,gobernacion}'),

  ('S-AC','AC-02','Actas de comité',
   '{acta,comite,coordinacion,institucional,reunion,sesion}',
   2,5,'seleccion','{universal}'),

  ('S-AC','AC-03','Actas del Comité Institucional de Gestión y Desempeño',
   '{acta,comite,institucional,gestion,desempeno,mipg}',
   5,30,'conservacion_total','{universal}'),

  ('S-AC','AC-04','Actas de reunión',
   '{acta,reunion,sesion,ordinaria,extraordinaria}',
   2,3,'eliminacion','{universal}'),

  ('S-AC','AC-05','Actas de entrega y empalme',
   '{acta,entrega,empalme,cargo,funcionario,servidor}',
   5,10,'conservacion_total','{universal}'),

  ('S-AC','AC-06','Actas de recibo de obras',
   '{acta,recibo,obra,entrega,final,terminacion}',
   5,15,'conservacion_total','{universal}'),

  ('S-AC','AC-07','Actas de visita e inspección',
   '{acta,visita,inspeccion,control,tecnica}',
   2,5,'seleccion','{universal}'),

  ('S-AC','AC-08','Actas de posesión',
   '{acta,posesion,servidor,cargo,juramento,funcionario}',
   5,10,'conservacion_total','{universal}'),

  ('S-AC','AC-09','Actas de concejo municipal',
   '{acta,concejo,sesion,ordinaria,extraordinaria,debate,plenaria}',
   5,30,'conservacion_total','{concejo,alcaldia}'),

  -- Sector Salud — fuente BANTER AGN nov. 2023
  ('S-AC','AC-10','Actas del Comité de Vigilancia Epidemiológica',
   '{acta,comite,vigilancia,epidemiologica,sivigila,cove,decreto3518,epidemio}',
   5,5,'conservacion_total','{hospital,alcaldia,gobernacion}'),

  -- Sector Salud — fuente BANTER AGN nov. 2023
  ('S-AC','AC-11','Actas del Comité de Estadísticas Vitales',
   '{acta,comite,estadisticas,vitales,nacimiento,defuncion,certificado,dane}',
   5,5,'conservacion_total','{hospital,alcaldia,gobernacion}'),

  -- ── CERTIFICADOS (S-CE) ───────────────────────────────────────
  ('S-CE','CE-01','Certificados laborales',
   '{certificado,laboral,salario,tiempo,servicio,trabajo}',
   2,3,'eliminacion','{universal}'),

  ('S-CE','CE-02','Certificados de tradición y libertad',
   '{certificado,tradicion,libertad,inmueble,predio}',
   2,3,'eliminacion','{universal}'),

  ('S-CE','CE-03','Certificados de paz y salvo',
   '{certificado,paz,salvo,deuda,obligacion,impuesto}',
   2,3,'eliminacion','{universal}'),

  -- ── CONCEPTOS (S-CN) ──────────────────────────────────────────
  ('S-CN','CN-01','Conceptos jurídicos',
   '{concepto,juridico,legal,derecho,abogado,oficina,asesoria,juridicos}',
   2,5,'seleccion','{universal}'),

  ('S-CN','CN-02','Conceptos técnicos',
   '{concepto,tecnico,ingeniero,profesional,viabilidad}',
   2,3,'eliminacion','{universal}'),

  ('S-CN','CN-03','Dictámenes periciales',
   '{dictamen,pericial,perito,valoracion,avaluo}',
   5,10,'conservacion_total','{universal}'),

  -- ── BIENES E INVENTARIOS (S-BI) ───────────────────────────────
  ('S-BI','BI-01','Inventarios de bienes muebles',
   '{inventario,bienes,muebles,activos,movibles}',
   2,5,'seleccion','{universal}'),

  ('S-BI','BI-02','Inventarios de bienes inmuebles',
   '{inventario,bienes,inmuebles,predios,edificios,sede}',
   2,30,'conservacion_total','{universal}'),

  ('S-BI','BI-03','Bajas y disposición de bienes',
   '{baja,bienes,activos,obsoleto,desecho,subasta}',
   2,5,'seleccion','{universal}'),

  ('S-BI','BI-04','Donaciones y comodatos',
   '{donacion,comodato,convenio,bien,transferencia,entrega}',
   5,10,'conservacion_total','{universal}'),

  -- ── CONTABILIDAD (S-CB) ───────────────────────────────────────
  ('S-CB','CB-01','Estados financieros',
   '{estado,financiero,balance,resultado,activo,pasivo}',
   2,10,'conservacion_total','{universal}'),

  ('S-CB','CB-02','Comprobantes contables',
   '{comprobante,contable,asiento,diario,egreso,ingreso}',
   2,5,'eliminacion','{universal}'),

  ('S-CB','CB-03','Órdenes de pago',
   '{orden,pago,factura,obligacion,proveedor}',
   2,5,'eliminacion','{universal}'),

  -- ── NÓMINA (S-NM) ─────────────────────────────────────────────
  ('S-NM','NM-01','Nómina de personal',
   '{nomina,personal,salario,sueldo,pago,quincena}',
   2,10,'conservacion_total','{universal}'),

  ('S-NM','NM-02','Seguridad social y parafiscales',
   '{seguridad,social,salud,pension,parafiscal,eps,arl}',
   2,10,'seleccion','{universal}'),

  ('S-NM','NM-03','Liquidaciones laborales',
   '{liquidacion,laboral,cesantia,prestacion,social,definitiva}',
   5,10,'conservacion_total','{universal}'),

  -- ── GESTIÓN DE CALIDAD (S-GC) ─────────────────────────────────
  ('S-GC','GC-01','Manuales de procesos y procedimientos',
   '{manual,proceso,procedimiento,instructivo,calidad,iso}',
   2,5,'seleccion','{universal}'),

  ('S-GC','GC-02','Caracterización de procesos',
   '{caracterizacion,proceso,fichas,calidad,mapa}',
   2,5,'seleccion','{universal}'),

  ('S-GC','GC-03','Acciones correctivas y preventivas',
   '{accion,correctiva,preventiva,no,conformidad,mejora}',
   2,3,'eliminacion','{universal}'),

  -- ── TECNOLOGÍA (S-TI) ─────────────────────────────────────────
  ('S-TI','TI-01','Sistemas de información',
   '{sistema,informacion,software,plataforma,aplicacion}',
   2,5,'seleccion','{universal}'),

  ('S-TI','TI-02','Seguridad informática',
   '{seguridad,informatica,datos,incidente,acceso}',
   2,5,'seleccion','{universal}'),

  -- ── COMUNICACIONES INSTITUCIONALES (S-CI) ────────────────────
  ('S-CI','CI-01','Publicaciones institucionales',
   '{publicacion,boletin,periodico,revista,institucional}',
   2,5,'seleccion','{universal}'),

  ('S-CI','CI-02','Campañas y piezas comunicativas',
   '{campaña,comunicacion,afiche,material,difusion}',
   2,3,'eliminacion','{universal}'),

  -- ── ACCIONES CONSTITUCIONALES (S-ACO) ────────────────────────
  -- Fuente: BANTER AGN + TRD Sec. Jurídica Bogotá 2022
  -- Retención: 20 años (5g + 15c) / Selección
  ('S-ACO','ACO-01','Acciones de tutela',
   '{tutela,accion,amparo,derechos,fundamentales,proyeccion,tutelas,secretaria,gobierno,fallo}',
   5,15,'seleccion','{alcaldia,gobernacion,personeria}'),

  ('S-ACO','ACO-02','Acciones populares',
   '{accion,popular,colectiva,comunidad,intereses,colectivos}',
   5,15,'seleccion','{alcaldia,gobernacion,personeria}'),

  ('S-ACO','ACO-03','Acciones de cumplimiento',
   '{accion,cumplimiento,obligacion,legal,norma,ley}',
   5,15,'seleccion','{alcaldia,gobernacion,personeria}'),

  ('S-ACO','ACO-04','Acciones de grupo',
   '{accion,grupo,colectiva,indemnizacion,pluralidad}',
   5,15,'seleccion','{alcaldia,gobernacion,personeria}'),

  ('S-ACO','ACO-05','Procesos contencioso-administrativos',
   '{proceso,contencioso,administrativo,demanda,juzgado,tribunal}',
   5,15,'conservacion_total','{alcaldia,gobernacion}'),

  ('S-ACO','ACO-06','Procesos ejecutivos y cobro coactivo',
   '{proceso,ejecutivo,cobro,coactivo,deuda,impuesto}',
   5,15,'conservacion_total','{alcaldia,gobernacion}'),

  ('S-ACO','ACO-07','Conciliaciones extrajudiciales',
   '{conciliacion,extrajudicial,acuerdo,conflicto,arreglo}',
   5,15,'conservacion_total','{alcaldia,gobernacion}'),

  ('S-ACO','ACO-08','Poderes y representación judicial',
   '{poder,representacion,judicial,apoderado,procurador}',
   5,15,'conservacion_total','{alcaldia,gobernacion,personeria}'),

  -- ── LICENCIAS Y PERMISOS (S-LP) ───────────────────────────────
  ('S-LP','LP-01','Licencias de construcción',
   '{licencia,construccion,obra,edificar,edificacion,permiso}',
   5,30,'conservacion_total','{alcaldia}'),

  ('S-LP','LP-02','Licencias de urbanismo',
   '{licencia,urbanismo,loteo,subdivision,urbanizar,parcelacion}',
   5,30,'conservacion_total','{alcaldia}'),

  ('S-LP','LP-03','Permisos de funcionamiento',
   '{permiso,funcionamiento,establecimiento,negocio,comercio}',
   2,5,'eliminacion','{alcaldia,gobernacion}'),

  ('S-LP','LP-04','Licencias ambientales',
   '{licencia,ambiental,corporacion,autonoma,impacto}',
   5,20,'conservacion_total','{alcaldia,gobernacion}'),

  ('S-LP','LP-05','Autorizaciones de espacio público',
   '{autorizacion,espacio,publico,via,ocupacion}',
   2,3,'eliminacion','{alcaldia}'),

  -- ── INSPECCIONES Y VISITAS (S-IV) ─────────────────────────────
  ('S-IV','IV-01','Inspecciones técnicas de obras',
   '{inspeccion,tecnica,obra,construccion,visita,seguimiento}',
   5,15,'conservacion_total','{alcaldia}'),

  ('S-IV','IV-02','Visitas de control y vigilancia',
   '{visita,control,vigilancia,establecimiento,inspeccion}',
   2,5,'seleccion','{alcaldia,gobernacion}'),

  ('S-IV','IV-03','Supervisión de contratos',
   '{supervision,contrato,seguimiento,supervisor,cumplimiento}',
   5,15,'conservacion_total','{universal}'),

  ('S-IV','IV-04','Interventorías de obras',
   '{interventoria,obra,contrato,interventor,calidad}',
   5,15,'conservacion_total','{universal}'),

  -- ── PROYECTOS DE INVERSIÓN (S-PI) ─────────────────────────────
  ('S-PI','PI-01','Proyectos de infraestructura',
   '{proyecto,infraestructura,obra,vial,puente,alcantarillado,acueducto}',
   5,20,'conservacion_total','{alcaldia,gobernacion}'),

  ('S-PI','PI-02','Proyectos de alumbrado público',
   '{proyecto,alumbrado,publico,luminaria,expansion,electrico,iluminarias,polideportivo}',
   5,20,'conservacion_total','{alcaldia}'),

  ('S-PI','PI-03','Proyectos sociales',
   '{proyecto,social,comunitario,bienestar,comunidad}',
   3,10,'seleccion','{alcaldia,gobernacion}'),

  ('S-PI','PI-04','Proyectos de desarrollo económico',
   '{proyecto,desarrollo,economico,emprendimiento,productivo}',
   3,10,'seleccion','{alcaldia,gobernacion}'),

  -- ── ATENCIÓN A VÍCTIMAS (S-AV) ────────────────────────────────
  ('S-AV','AV-01','Caracterización de víctimas del conflicto',
   '{victima,conflicto,armado,desplazado,caracterizacion,registro,ruv}',
   5,30,'conservacion_total','{alcaldia,gobernacion}'),

  ('S-AV','AV-02','Planes de retorno y reubicación',
   '{retorno,reubicacion,victima,desplazado,plan,reparacion}',
   5,30,'conservacion_total','{alcaldia,gobernacion}'),

  ('S-AV','AV-03','Atención humanitaria de emergencia',
   '{atencion,humanitaria,emergencia,victima,auxilio}',
   5,20,'conservacion_total','{alcaldia,gobernacion}'),

  ('S-AV','AV-04','Medidas de reparación integral',
   '{reparacion,victima,medida,indemnizacion,integral,ley1448}',
   5,30,'conservacion_total','{alcaldia,gobernacion}'),

  -- ── GESTIÓN DEL RIESGO (S-GR) ─────────────────────────────────
  ('S-GR','GR-01','Declaratorias de calamidad pública',
   '{declaratoria,calamidad,publica,emergencia,desastre,decreto}',
   5,30,'conservacion_total','{alcaldia,gobernacion}'),

  ('S-GR','GR-02','Atención de emergencias y desastres',
   '{atencion,emergencia,desastre,inundacion,deslizamiento,sismo}',
   3,10,'seleccion','{alcaldia,gobernacion}'),

  ('S-GR','GR-03','Evaluación de amenazas y riesgos',
   '{evaluacion,amenaza,riesgo,vulnerabilidad,zona,estudio}',
   3,10,'conservacion_total','{alcaldia,gobernacion}'),

  -- ── DESARROLLO SOCIAL (S-DS) ──────────────────────────────────
  ('S-DS','DS-01','Programas de asistencia social',
   '{programa,asistencia,social,subsidio,beneficiario,ayuda}',
   3,10,'seleccion','{alcaldia,gobernacion}'),

  ('S-DS','DS-02','Programas de primera infancia',
   '{programa,primera,infancia,niñez,menor,jardin,cdi,icbf}',
   3,10,'conservacion_total','{alcaldia,gobernacion}'),

  ('S-DS','DS-03','Programas de adulto mayor',
   '{programa,adulto,mayor,anciano,vejez,pension}',
   3,10,'seleccion','{alcaldia,gobernacion}'),

  ('S-DS','DS-04','Programas de discapacidad e inclusión',
   '{programa,discapacidad,inclusion,discapacitado,especial}',
   3,10,'seleccion','{alcaldia,gobernacion}'),

  -- ── ORDENAMIENTO TERRITORIAL (S-OT) ───────────────────────────
  ('S-OT','OT-01','Plan de ordenamiento territorial',
   '{pot,plan,ordenamiento,territorial,rural,urbano,suelo}',
   4,30,'conservacion_total','{alcaldia}'),

  ('S-OT','OT-02','Estratificación socioeconómica',
   '{estratificacion,socioeconomica,estrato,predio,servicio}',
   3,20,'conservacion_total','{alcaldia}'),

  ('S-OT','OT-03','Nomenclatura urbana y cartografía',
   '{nomenclatura,cartografia,mapa,catastro,predio,direccion}',
   3,30,'conservacion_total','{alcaldia}'),

  -- ── SALUD PÚBLICA (S-SP) ──────────────────────────────────────
  ('S-SP','SP-01','Programas de vigilancia epidemiológica',
   '{vigilancia,epidemiologica,enfermedad,brote,morbilidad}',
   3,10,'conservacion_total','{alcaldia,gobernacion,hospital}'),

  ('S-SP','SP-02','Planes territoriales de salud',
   '{plan,territorial,salud,publica,asis,diagnostico}',
   4,20,'conservacion_total','{alcaldia,gobernacion}'),

  ('S-SP','SP-03','Inspección y vigilancia sanitaria',
   '{inspeccion,vigilancia,sanitaria,establecimientos}',
   2,5,'seleccion','{alcaldia,gobernacion}'),

  -- ── EDUCACIÓN (S-EM) ──────────────────────────────────────────
  ('S-EM','EM-01','Plan educativo municipal',
   '{plan,educativo,municipal,educacion,calidad}',
   4,20,'conservacion_total','{alcaldia,gobernacion}'),

  ('S-EM','EM-02','Programas de cobertura y acceso escolar',
   '{cobertura,escolar,matricula,estudiantes,acceso}',
   2,5,'seleccion','{alcaldia,gobernacion}'),

  -- ── VIVIENDA (S-VV) ───────────────────────────────────────────
  ('S-VV','VV-01','Proyectos de vivienda de interés social',
   '{proyecto,vivienda,interes,social,vis,vip,predio}',
   5,20,'conservacion_total','{alcaldia,gobernacion}'),

  ('S-VV','VV-02','Titulación de predios informales',
   '{titulacion,predio,propiedad,regularizacion,informal}',
   5,30,'conservacion_total','{alcaldia,gobernacion}'),

  -- ── GESTIÓN AMBIENTAL (S-GA) ──────────────────────────────────
  ('S-GA','GA-01','Proyectos ambientales',
   '{proyecto,ambiental,ambiente,ecosistema,prae}',
   3,10,'seleccion','{alcaldia,gobernacion}'),

  ('S-GA','GA-02','Gestión de residuos sólidos',
   '{residuo,solido,basura,reciclaje,relleno,sanitario}',
   3,5,'seleccion','{alcaldia,gobernacion}'),

  ('S-GA','GA-03','Recursos hídricos y cuencas',
   '{recurso,hidrico,agua,rio,fuente,cuenca,pomca}',
   3,10,'conservacion_total','{alcaldia,gobernacion}'),

  -- ── FOMENTO Y DESARROLLO (S-FE) ───────────────────────────────
  ('S-FE','FE-01','Programas de emprendimiento',
   '{emprendimiento,empresa,negocio,empresario,unidad,productiva}',
   2,5,'seleccion','{alcaldia,gobernacion}'),

  ('S-FE','FE-02','Desarrollo turístico y cultural',
   '{turismo,turistico,cultura,cultural,fiestas,festival}',
   2,5,'seleccion','{alcaldia,gobernacion}'),

  ('S-FE','FE-03','Fomento agropecuario',
   '{agropecuario,agricultura,ganaderia,campesino,campo,rural}',
   2,5,'seleccion','{alcaldia,gobernacion}'),

  -- ── MINERÍA (S-MI) ────────────────────────────────────────────
  ('S-MI','MI-01','Permisos mineros de subsistencia',
   '{permiso,minero,subsistencia,mineria,artesanal,barequero}',
   5,10,'conservacion_total','{alcaldia,gobernacion}'),

  ('S-MI','MI-02','Fiscalización y control minero',
   '{fiscalizacion,control,minero,mineria,ilegal,explotacion}',
   3,10,'seleccion','{alcaldia,gobernacion}'),

  -- ── ASUNTOS ÉTNICOS (S-ET) ────────────────────────────────────
  ('S-ET','ET-01','Comunidades indígenas',
   '{indigena,comunidad,resguardo,cabildo,gobernador,etnia}',
   5,20,'conservacion_total','{alcaldia,gobernacion}'),

  ('S-ET','ET-02','Comunidades afrodescendientes',
   '{afro,afrodescendiente,comunidad,negra,consejo}',
   5,20,'conservacion_total','{alcaldia,gobernacion}'),

  ('S-ET','ET-03','Consulta previa',
   '{consulta,previa,etnica,comunidad,convenio,169}',
   5,20,'conservacion_total','{alcaldia,gobernacion}'),

  -- ── PRIMERA INFANCIA (S-IA) ───────────────────────────────────
  ('S-IA','IA-01','Políticas de infancia y adolescencia',
   '{infancia,adolescencia,politica,proteccion,menor,niñez}',
   3,10,'conservacion_total','{alcaldia,gobernacion}'),

  ('S-IA','IA-02','Políticas de juventud',
   '{juventud,joven,politica,sistema,nacional}',
   2,5,'seleccion','{alcaldia,gobernacion}'),

  -- ── REGALÍAS (S-RG) ───────────────────────────────────────────
  ('S-RG','RG-01','Proyectos financiados con regalías',
   '{regalias,proyecto,ocad,sgr,bpin}',
   5,20,'conservacion_total','{gobernacion}'),

  ('S-RG','RG-02','Informes al Sistema General de Regalías',
   '{regalias,informe,sgr,rendicion,monitoreo}',
   2,10,'conservacion_total','{gobernacion}'),

  -- ── RELACIONES CON MUNICIPIOS (S-RM) ─────────────────────────
  ('S-RM','RM-01','Asistencia técnica a municipios',
   '{asistencia,tecnica,municipio,fortalecimiento,departamento}',
   2,5,'seleccion','{gobernacion}'),

  -- ── CONTROL POLÍTICO (S-CP) ───────────────────────────────────
  ('S-CP','CP-01','Debates de control político',
   '{debate,control,politico,concejo,sesion,citar}',
   5,30,'conservacion_total','{concejo}'),

  ('S-CP','CP-02','Citaciones e informes de funcionarios',
   '{citacion,funcionario,concejo,debate,informe}',
   2,8,'conservacion_total','{concejo}'),

  -- ── DEBATE LEGISLATIVO (S-DL) ─────────────────────────────────
  ('S-DL','DL-01','Proyectos de acuerdo',
   '{proyecto,acuerdo,municipal,concejo,presentacion}',
   5,10,'conservacion_total','{concejo}'),

  ('S-DL','DL-02','Acuerdos municipales aprobados',
   '{acuerdo,municipal,aprobado,sancionado,publicado}',
   5,30,'conservacion_total','{concejo}'),

  -- ── PROPOSICIONES (S-PP) ──────────────────────────────────────
  ('S-PP','PP-01','Proposiciones de debate y control',
   '{proposicion,debate,control,concejo,edil,fiscal}',
   2,8,'seleccion','{concejo}'),

  -- ── INVESTIGACIONES DISCIPLINARIAS (S-ID) ────────────────────
  -- Ley 1952/2019: prescripción hasta 10 años faltas gravísimas
  ('S-ID','ID-01','Quejas disciplinarias',
   '{queja,disciplinaria,funcionario,conducta,servidor}',
   5,10,'conservacion_total','{personeria}'),

  ('S-ID','ID-02','Procesos disciplinarios',
   '{proceso,disciplinario,sancion,servidor,falta,grave,ley1952}',
   5,15,'conservacion_total','{personeria}'),

  ('S-ID','ID-03','Autos de archivo disciplinario',
   '{auto,archivo,disciplinario,inhibitorio}',
   5,10,'seleccion','{personeria}'),

  -- ── DERECHOS HUMANOS (S-DH) ───────────────────────────────────
  ('S-DH','DH-01','Casos de vulneración de derechos humanos',
   '{derechos,humanos,vulneracion,denuncia,caso,ddhh}',
   5,20,'conservacion_total','{personeria,alcaldia}'),

  ('S-DH','DH-02','Informes de derechos humanos',
   '{informe,derechos,humanos,situacion,periodico}',
   2,8,'conservacion_total','{personeria}'),

  -- ── MINISTERIO PÚBLICO (S-MP) ─────────────────────────────────
  ('S-MP','MP-01','Intervención en procesos judiciales',
   '{intervencion,proceso,judicial,audiencia,ministerio,publico}',
   5,10,'conservacion_total','{personeria}'),

  -- ── VEEDURÍA (S-VC) ───────────────────────────────────────────
  ('S-VC','VC-01','Control social a la gestión pública',
   '{veeduria,control,social,transparencia,gestion}',
   2,5,'seleccion','{personeria}'),

  -- ── HISTORIAS CLÍNICAS (S-HC) ─────────────────────────────────
  -- *** DATO OFICIAL BANTER AGN (ficha aprobada 31/12/2020) ***
  -- Norma: Res. 839/2017 que modifica Res. 1995/1999
  -- Retención: 15 años desde ÚLTIMA atención (5g + 10c)
  -- Disposición: SELECCIÓN (no conservación total)
  -- Víctimas DDHH/DIH: se duplica → 30 años
  ('S-HC','HC-01','Historias clínicas de pacientes',
   '{historia,clinica,paciente,consulta,atencion,medica,eps,usuario,sgsss}',
   5,10,'seleccion','{hospital}'),

  ('S-HC','HC-02','Historias clínicas de urgencias',
   '{historia,clinica,urgencia,emergencia,triage,admision}',
   5,10,'seleccion','{hospital}'),

  ('S-HC','HC-03','Historias clínicas pediátricas',
   '{historia,clinica,pediatria,niño,menor,pediatra}',
   5,10,'seleccion','{hospital}'),

  ('S-HC','HC-04','Historias clínicas de víctimas de DDHH y DIH',
   '{historia,clinica,victima,ddhh,dih,conflicto,violacion,derechos,humanos,humanitario}',
   10,20,'seleccion','{hospital}'),

  -- ── SERVICIOS DE SALUD (S-SS) ─────────────────────────────────
  ('S-SS','SS-01','Programas de hospitalización',
   '{hospitalizacion,ingreso,cama,paciente,medico}',
   2,5,'seleccion','{hospital}'),

  ('S-SS','SS-02','Consulta externa',
   '{consulta,externa,cita,medico,especialista}',
   2,5,'eliminacion','{hospital}'),

  ('S-SS','SS-03','Programas de cirugía',
   '{cirugia,quirofano,intervencion,programacion}',
   3,8,'seleccion','{hospital}'),

  -- ── GESTIÓN FARMACÉUTICA (S-GF) ───────────────────────────────
  ('S-GF','GF-01','Gestión de medicamentos y dispositivos',
   '{medicamento,farmacia,dispositivo,suministro,insumo}',
   2,5,'eliminacion','{hospital}'),

  ('S-GF','GF-02','Control de cadena de frío',
   '{cadena,frio,vacuna,temperatura,biologico}',
   2,5,'seleccion','{hospital}'),

  -- ── URGENCIAS (S-UE) ──────────────────────────────────────────
  ('S-UE','UE-01','Atención de urgencias',
   '{urgencia,atencion,triage,emergencia,admision}',
   3,8,'conservacion_total','{hospital}'),

  ('S-UE','UE-02','Traslados y remisiones de pacientes',
   '{traslado,remision,paciente,ambulancia,referencia}',
   2,5,'seleccion','{hospital}'),

  -- ── REGISTRO AUTOMOTOR (S-RA) ─────────────────────────────────
  -- Ley 769/2002: registro público permanente
  ('S-RA','RA-01','Matrículas de vehículos',
   '{matricula,vehiculo,automotor,registro,tarjeta,propiedad}',
   5,30,'conservacion_total','{transito}'),

  ('S-RA','RA-02','Traspasos y cambios de propietario',
   '{traspaso,propietario,vehiculo,venta,automotor}',
   5,10,'conservacion_total','{transito}'),

  ('S-RA','RA-03','Cancelaciones de matrícula',
   '{cancelacion,matricula,registro,automotor,baja}',
   5,10,'seleccion','{transito}'),

  -- ── LICENCIAS DE CONDUCCIÓN (S-LC) ────────────────────────────
  ('S-LC','LC-01','Expedición de licencias de conducción',
   '{licencia,conduccion,conducir,categoria,expedicion}',
   5,20,'conservacion_total','{transito}'),

  ('S-LC','LC-02','Renovación de licencias de conducción',
   '{renovacion,licencia,conduccion,vencida}',
   3,5,'eliminacion','{transito}'),

  ('S-LC','LC-03','Suspensión y cancelación de licencias',
   '{suspension,cancelacion,licencia,sancion,conductores}',
   5,10,'conservacion_total','{transito}'),

  -- ── INFRACCIONES DE TRÁNSITO (S-IT) ──────────────────────────
  -- Prescripción infracción: 3 años (Art. 159 Ley 769/2002)
  ('S-IT','IT-01','Comparendos por infracciones de tránsito',
   '{comparendo,infraccion,multa,transito,codigo}',
   3,2,'eliminacion','{transito}'),

  ('S-IT','IT-02','Recursos contra comparendos',
   '{recurso,comparendo,impugnacion,apelacion}',
   3,5,'conservacion_total','{transito}'),

  ('S-IT','IT-03','Inmovilizaciones de vehículos',
   '{inmovilizacion,vehiculo,grua,patio,retencion}',
   2,3,'eliminacion','{transito}'),

  -- ── ACCIDENTES DE TRÁNSITO (S-AT) ────────────────────────────
  -- Prescripción penal/civil: hasta 10 años
  ('S-AT','AT-01','Informes de accidentes de tránsito',
   '{accidente,transito,colision,lesionado,muerto,informe}',
   5,10,'conservacion_total','{transito}'),

  ('S-AT','AT-02','Croquis e informes periciales',
   '{croquis,accidente,transito,peritaje,pericial}',
   5,10,'conservacion_total','{transito}'),

  -- ── REVISIÓN TÉCNICO-MECÁNICA (S-RT) ─────────────────────────
  ('S-RT','RT-01','Certificados de revisión técnico-mecánica',
   '{revision,tecnico,mecanica,certificado,vehiculo,rtm}',
   2,5,'eliminacion','{transito}'),

  ('S-RT','RT-02','Vehículos con incumplimiento de revisión',
   '{revision,vencida,incumplimiento,sancion,tecnica}',
   2,3,'eliminacion','{transito}')

) AS sub(serie_cod, codigo, nombre, palabras_clave,
         retencion_gestion, retencion_central, disposicion_final, aplica_entidad)
JOIN trd_catalogo_series cs ON cs.codigo = sub.serie_cod

ON CONFLICT (serie_id, nombre_normalizado) DO UPDATE SET
  codigo            = EXCLUDED.codigo,
  nombre            = EXCLUDED.nombre,
  palabras_clave    = EXCLUDED.palabras_clave,
  retencion_gestion = EXCLUDED.retencion_gestion,
  retencion_central = EXCLUDED.retencion_central,
  disposicion_final = EXCLUDED.disposicion_final,
  aplica_entidad    = EXCLUDED.aplica_entidad;

-- =================================================================
-- PASO 7: TIPOLOGÍAS DOCUMENTALES
-- =================================================================

-- Tutelas
INSERT INTO trd_tipologias_documentales (subserie_id, nombre, nombre_normalizado)
SELECT s.id, t.nombre, lower(unaccent(t.nombre))
FROM trd_catalogo_subseries s
JOIN trd_catalogo_series cs ON cs.id = s.serie_id
CROSS JOIN LATERAL (VALUES
  ('Notificación de la acción de tutela'),
  ('Demanda'),
  ('Pruebas'),
  ('Poder'),
  ('Contestación'),
  ('Fallo de primera instancia'),
  ('Recurso de apelación'),
  ('Fallo de segunda instancia'),
  ('Oficio de cumplimiento al fallo'),
  ('Auto de trámite o sustanciación'),
  ('Proyección de respuesta a tutela')
) AS t(nombre)
WHERE cs.codigo = 'S-ACO' AND s.codigo = 'ACO-01'
ON CONFLICT DO NOTHING;

-- Historias clínicas (Res. 1995/1999 Art. 8° + BANTER AGN 2020)
INSERT INTO trd_tipologias_documentales (subserie_id, nombre, nombre_normalizado)
SELECT s.id, t.nombre, lower(unaccent(t.nombre))
FROM trd_catalogo_subseries s
JOIN trd_catalogo_series cs ON cs.id = s.serie_id
CROSS JOIN LATERAL (VALUES
  ('Consulta ambulatoria de medicina general'),
  ('Control de crecimiento y desarrollo AIEPI'),
  ('Control prenatal y factores de riesgo'),
  ('Triage de urgencias'),
  ('Consulta de atención de urgencias'),
  ('Consentimiento informado de procedimiento'),
  ('Descripción de procedimiento médico o quirúrgico'),
  ('Récord anestesiológico'),
  ('Evolución médica'),
  ('Evolución de enfermería'),
  ('Administración de medicamentos'),
  ('Certificado de defunción'),
  ('Epicrisis de urgencias'),
  ('Valoración de ingreso a hospitalización'),
  ('Perfil farmacoterapéutico'),
  ('Epicrisis de hospitalización'),
  ('Certificado médico de nacido vivo'),
  ('Informe de exámenes de laboratorio clínico'),
  ('Informe de exámenes de radiología'),
  ('Informe de examen de ultrasonografía'),
  ('Informe de necropsia clínica'),
  ('Orden de exámenes diagnósticos'),
  ('Prescripción médica'),
  ('Incapacidad médica')
) AS t(nombre)
WHERE cs.codigo = 'S-HC' AND s.codigo IN ('HC-01','HC-02','HC-03')
ON CONFLICT DO NOTHING;

-- Contratos PSS
INSERT INTO trd_tipologias_documentales (subserie_id, nombre, nombre_normalizado)
SELECT s.id, t.nombre, lower(unaccent(t.nombre))
FROM trd_catalogo_subseries s
JOIN trd_catalogo_series cs ON cs.id = s.serie_id
CROSS JOIN LATERAL (VALUES
  ('Contrato de prestación de servicios'),
  ('Estudios previos'),
  ('CDP y Registro Presupuestal'),
  ('Póliza de responsabilidad civil'),
  ('Afiliación a seguridad social'),
  ('Acta de inicio'),
  ('Informes de actividades del contratista'),
  ('Acta de liquidación'),
  ('Certificado de cumplimiento')
) AS t(nombre)
WHERE cs.codigo = 'S-CT' AND s.codigo = 'CT-01'
ON CONFLICT DO NOTHING;

-- Contratos de obra
INSERT INTO trd_tipologias_documentales (subserie_id, nombre, nombre_normalizado)
SELECT s.id, t.nombre, lower(unaccent(t.nombre))
FROM trd_catalogo_subseries s
JOIN trd_catalogo_series cs ON cs.id = s.serie_id
CROSS JOIN LATERAL (VALUES
  ('Contrato de obra'),
  ('Estudios y documentos previos'),
  ('Pliego de condiciones'),
  ('Garantías y pólizas'),
  ('Acta de inicio de obra'),
  ('Actas de comité de obra'),
  ('Informes de avance de obra'),
  ('Acta de recibo final y liquidación')
) AS t(nombre)
WHERE cs.codigo = 'S-CT' AND s.codigo = 'CT-02'
ON CONFLICT DO NOTHING;

-- Historias laborales
INSERT INTO trd_tipologias_documentales (subserie_id, nombre, nombre_normalizado)
SELECT s.id, t.nombre, lower(unaccent(t.nombre))
FROM trd_catalogo_subseries s
JOIN trd_catalogo_series cs ON cs.id = s.serie_id
CROSS JOIN LATERAL (VALUES
  ('Acto de nombramiento o contrato'),
  ('Acta de posesión'),
  ('Hoja de vida Función Pública (F-1)'),
  ('Declaración de bienes y rentas'),
  ('Copia de cédula de ciudadanía'),
  ('Título académico y tarjeta profesional'),
  ('Examen médico de ingreso y egreso'),
  ('Evaluaciones de desempeño'),
  ('Resoluciones de vacaciones y traslados'),
  ('Actas de descargos y sanciones'),
  ('Acta de retiro o liquidación definitiva')
) AS t(nombre)
WHERE cs.codigo = 'S-HL' AND s.codigo = 'HL-01'
ON CONFLICT DO NOTHING;

-- =================================================================
-- PASO 8: NORMAS DE REFERENCIA
-- =================================================================

INSERT INTO trd_normas_referencia (codigo, nombre, descripcion, aplica_series)
VALUES
  ('LEY-594-2000',   'Ley 594 de 2000 — Ley General de Archivos',
   'Obligatoriedad de TRDs para entidades del Estado. Art. 24.',                        '{universal}'),
  ('ACU-004-2019',   'Acuerdo 004 de 2019 — AGN',
   'Procedimiento de elaboración, aprobación y convalidación de TRDs.',                 '{universal}'),
  ('RES-1995-1999',  'Resolución 1995 de 1999 — MinSalud',
   'Establece normas para el manejo de la historia clínica.',                           '{S-HC}'),
  ('RES-839-2017',   'Resolución 839 de 2017 — MinSalud',
   'Modifica Res. 1995/1999. Retención 15 años desde última atención. Duplica DDHH.',  '{S-HC}'),
  ('LEY-80-1993',    'Ley 80 de 1993 — Estatuto de Contratación',
   'Art. 50-53: prescripción de responsabilidad contractual en 20 años.',               '{S-CT}'),
  ('DEC-2591-1991',  'Decreto 2591 de 1991',
   'Reglamenta la acción de tutela.',                                                   '{S-ACO}'),
  ('DEC-3518-2006',  'Decreto 3518 de 2006',
   'Crea SIVIGILA. Base legal actas comités epidemiológicos.',                          '{S-AC}'),
  ('RES-518-2015',   'Resolución 518 de 2015 — MinSalud',
   'Reglamenta el Plan de Salud Pública de Intervenciones Colectivas.',                 '{S-PL}'),
  ('LEY-1952-2019',  'Ley 1952 de 2019 — Código General Disciplinario',
   'Vigente julio 2021. Prescripción hasta 10 años faltas gravísimas.',                 '{S-ID}'),
  ('LEY-769-2002',   'Ley 769 de 2002 — Código Nacional de Tránsito',
   'Registro automotor, licencias, infracciones (prescripción 3 años), accidentes.',   '{S-RA,S-LC,S-IT,S-AT}')
ON CONFLICT (codigo) DO NOTHING;

-- =================================================================
-- PASO 9: ACTUALIZAR SECUENCIAS
-- =================================================================

SELECT setval('trd_catalogo_series_id_seq',
  (SELECT MAX(id) FROM trd_catalogo_series));

SELECT setval('trd_catalogo_subseries_id_seq',
  (SELECT MAX(id) FROM trd_catalogo_subseries));

COMMIT;
