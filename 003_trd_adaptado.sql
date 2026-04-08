-- ============================================================
-- SIPAD — Seed 003: TRDs reales adaptadas a estructura existente
-- disposicion_final: CT | EL | ST | MT
-- CT = Conservación Total
-- EL = Eliminación
-- ST = Selección
-- MT = Microfilmación/Digitalización
-- NOTA: ajusta entidad_id=1 según tu entorno
-- ============================================================

-- ── UNIDADES ─────────────────────────────────────────────────
INSERT INTO trd_unidades (codigo, nombre, entidad_id) VALUES
  ('10', 'Despacho del Alcalde',                    1),
  ('11', 'Control Interno Disciplinario',            1),
  ('12', 'Control Interno Administrativo',           1),
  ('13', 'Oficina de Contratacion',                  1),
  ('14', 'Oficina Juridica',                         1),
  ('15', 'Oficina de Ambiente y Gestion del Riesgo', 1)
ON CONFLICT (codigo, entidad_id) DO NOTHING;

-- ── CATÁLOGO AGN ─────────────────────────────────────────────
INSERT INTO trd_catalogo_series (codigo, nombre) VALUES
  ('1',  'ACCIONES CONSTITUCIONALES'),
  ('2',  'ACCIONES JUDICIALES'),
  ('3',  'ACTAS'),
  ('4',  'ACTOS ADMINISTRATIVOS'),
  ('5',  'ACUERDOS'),
  ('6',  'ANTEPROYECTO DE PRESUPUESTO'),
  ('7',  'AUDITORIAS'),
  ('8',  'BOLETINES'),
  ('9',  'CERTIFICADOS'),
  ('10', 'CIRCULARES'),
  ('11', 'COMPROBANTES CONTABLES'),
  ('12', 'COMPROBANTES DE ALMACEN'),
  ('13', 'CONCEPTOS'),
  ('14', 'CONCILIACIONES BANCARIAS'),
  ('15', 'CONSECUTIVO DE COMUNICACIONES'),
  ('16', 'CONTRATOS'),
  ('17', 'CONVENIOS'),
  ('18', 'DERECHOS DE PETICION'),
  ('19', 'DECLARACIONES TRIBUTARIAS'),
  ('20', 'ESTADOS FINANCIEROS'),
  ('21', 'ESTUDIOS'),
  ('22', 'HISTORIALES'),
  ('23', 'HISTORIAS LABORALES'),
  ('24', 'INFORMES'),
  ('25', 'INSTRUMENTOS ARCHIVISTICOS'),
  ('26', 'INSTRUMENTOS DE CONTROL'),
  ('27', 'INVENTARIOS'),
  ('28', 'LIBROS CONTABLES'),
  ('29', 'MANUALES'),
  ('30', 'NOMINA'),
  ('31', 'PLANES'),
  ('32', 'PROGRAMAS'),
  ('33', 'PROCESOS'),
  ('34', 'PROYECTOS'),
  ('35', 'REGISTROS'),
  ('36', 'RESOLUCIONES'),
  ('37', 'PQRS')
ON CONFLICT (codigo) DO NOTHING;

INSERT INTO trd_catalogo_subseries (codigo, nombre, serie_id) VALUES
  ('1.1','Acciones de cumplimiento', (SELECT id FROM trd_catalogo_series WHERE codigo='1')),
  ('1.2','Acciones de grupo',        (SELECT id FROM trd_catalogo_series WHERE codigo='1')),
  ('1.3','Acciones de tutela',       (SELECT id FROM trd_catalogo_series WHERE codigo='1')),
  ('1.4','Acciones populares',       (SELECT id FROM trd_catalogo_series WHERE codigo='1')),
  ('2.1','Acciones contractuales',                 (SELECT id FROM trd_catalogo_series WHERE codigo='2')),
  ('2.2','Acciones de nulidad',                    (SELECT id FROM trd_catalogo_series WHERE codigo='2')),
  ('2.3','Acciones de nulidad y restablecimiento', (SELECT id FROM trd_catalogo_series WHERE codigo='2')),
  ('2.4','Acciones de reparacion directa',         (SELECT id FROM trd_catalogo_series WHERE codigo='2')),
  ('2.5','Acciones de repeticion',                 (SELECT id FROM trd_catalogo_series WHERE codigo='2')),
  ('2.6','Acciones ordinarias',                    (SELECT id FROM trd_catalogo_series WHERE codigo='2')),
  ('3.1','Actas de comites',        (SELECT id FROM trd_catalogo_series WHERE codigo='3')),
  ('3.2','Actas de consejos',       (SELECT id FROM trd_catalogo_series WHERE codigo='3')),
  ('3.3','Actas de comisiones',     (SELECT id FROM trd_catalogo_series WHERE codigo='3')),
  ('3.4','Actas institucionales',   (SELECT id FROM trd_catalogo_series WHERE codigo='3')),
  ('3.5','Actas de juntas',         (SELECT id FROM trd_catalogo_series WHERE codigo='3')),
  ('3.6','Actas de mesas tecnicas', (SELECT id FROM trd_catalogo_series WHERE codigo='3')),
  ('4.1','Decretos',     (SELECT id FROM trd_catalogo_series WHERE codigo='4')),
  ('4.2','Resoluciones', (SELECT id FROM trd_catalogo_series WHERE codigo='4')),
  ('5.1','Acuerdos municipales', (SELECT id FROM trd_catalogo_series WHERE codigo='5')),
  ('7.1','Auditorias internas', (SELECT id FROM trd_catalogo_series WHERE codigo='7')),
  ('7.2','Auditorias externas', (SELECT id FROM trd_catalogo_series WHERE codigo='7')),
  ('8.1','Boletines administrativos', (SELECT id FROM trd_catalogo_series WHERE codigo='8')),
  ('8.2','Boletines de prensa',       (SELECT id FROM trd_catalogo_series WHERE codigo='8')),
  ('8.3','Boletines epidemiologicos', (SELECT id FROM trd_catalogo_series WHERE codigo='8')),
  ('9.1','Certificados presupuestales',  (SELECT id FROM trd_catalogo_series WHERE codigo='9')),
  ('9.2','Certificados administrativos', (SELECT id FROM trd_catalogo_series WHERE codigo='9')),
  ('9.3','Certificados de residencia',   (SELECT id FROM trd_catalogo_series WHERE codigo='9')),
  ('9.4','Certificados financieros',     (SELECT id FROM trd_catalogo_series WHERE codigo='9')),
  ('10.1','Circulares informativas',  (SELECT id FROM trd_catalogo_series WHERE codigo='10')),
  ('10.2','Circulares dispositivas',  (SELECT id FROM trd_catalogo_series WHERE codigo='10')),
  ('11.1','Ingreso', (SELECT id FROM trd_catalogo_series WHERE codigo='11')),
  ('11.2','Egreso',  (SELECT id FROM trd_catalogo_series WHERE codigo='11')),
  ('12.1','Ingreso', (SELECT id FROM trd_catalogo_series WHERE codigo='12')),
  ('12.2','Egreso',  (SELECT id FROM trd_catalogo_series WHERE codigo='12')),
  ('12.3','Baja',    (SELECT id FROM trd_catalogo_series WHERE codigo='12')),
  ('13.1','Conceptos juridicos', (SELECT id FROM trd_catalogo_series WHERE codigo='13')),
  ('13.2','Conceptos tecnicos',  (SELECT id FROM trd_catalogo_series WHERE codigo='13')),
  ('15.1','Enviadas',  (SELECT id FROM trd_catalogo_series WHERE codigo='15')),
  ('15.2','Recibidas', (SELECT id FROM trd_catalogo_series WHERE codigo='15')),
  ('16.1','Arrendamiento',          (SELECT id FROM trd_catalogo_series WHERE codigo='16')),
  ('16.2','Comodato',               (SELECT id FROM trd_catalogo_series WHERE codigo='16')),
  ('16.3','Compraventa',            (SELECT id FROM trd_catalogo_series WHERE codigo='16')),
  ('16.4','Consultoria',            (SELECT id FROM trd_catalogo_series WHERE codigo='16')),
  ('16.5','Obra publica',           (SELECT id FROM trd_catalogo_series WHERE codigo='16')),
  ('16.6','Prestacion de servicios',(SELECT id FROM trd_catalogo_series WHERE codigo='16')),
  ('16.7','Interadministrativos',   (SELECT id FROM trd_catalogo_series WHERE codigo='16')),
  ('16.8','Seguros',                (SELECT id FROM trd_catalogo_series WHERE codigo='16')),
  ('16.9','Suministros',            (SELECT id FROM trd_catalogo_series WHERE codigo='16')),
  ('17.1','Interadministrativos', (SELECT id FROM trd_catalogo_series WHERE codigo='17')),
  ('17.2','Cooperacion',          (SELECT id FROM trd_catalogo_series WHERE codigo='17')),
  ('17.3','Asociacion',           (SELECT id FROM trd_catalogo_series WHERE codigo='17')),
  ('17.4','ESAL',                 (SELECT id FROM trd_catalogo_series WHERE codigo='17')),
  ('19.1','IVA',                     (SELECT id FROM trd_catalogo_series WHERE codigo='19')),
  ('19.2','Retencion',               (SELECT id FROM trd_catalogo_series WHERE codigo='19')),
  ('19.3','Impuestos territoriales', (SELECT id FROM trd_catalogo_series WHERE codigo='19')),
  ('21.1','Estudios tecnicos',         (SELECT id FROM trd_catalogo_series WHERE codigo='21')),
  ('21.2','Estudios organizacionales', (SELECT id FROM trd_catalogo_series WHERE codigo='21')),
  ('21.3','Diseños',                   (SELECT id FROM trd_catalogo_series WHERE codigo='21')),
  ('22.1','Bienes',        (SELECT id FROM trd_catalogo_series WHERE codigo='22')),
  ('22.2','Equipos',       (SELECT id FROM trd_catalogo_series WHERE codigo='22')),
  ('22.3','Vehiculos',     (SELECT id FROM trd_catalogo_series WHERE codigo='22')),
  ('22.4','Educativos',    (SELECT id FROM trd_catalogo_series WHERE codigo='22')),
  ('22.5','Contribuyentes',(SELECT id FROM trd_catalogo_series WHERE codigo='22')),
  ('24.1','Informes de gestion',        (SELECT id FROM trd_catalogo_series WHERE codigo='24')),
  ('24.2','Informes a entes de control',(SELECT id FROM trd_catalogo_series WHERE codigo='24')),
  ('24.3','Informes financieros',       (SELECT id FROM trd_catalogo_series WHERE codigo='24')),
  ('24.4','Informes tecnicos',          (SELECT id FROM trd_catalogo_series WHERE codigo='24')),
  ('24.5','Informes de seguimiento',    (SELECT id FROM trd_catalogo_series WHERE codigo='24')),
  ('24.6','Informes PQRS',             (SELECT id FROM trd_catalogo_series WHERE codigo='24')),
  ('25.1','CCD',   (SELECT id FROM trd_catalogo_series WHERE codigo='25')),
  ('25.2','TRD',   (SELECT id FROM trd_catalogo_series WHERE codigo='25')),
  ('25.3','PGD',   (SELECT id FROM trd_catalogo_series WHERE codigo='25')),
  ('25.4','PINAR', (SELECT id FROM trd_catalogo_series WHERE codigo='25')),
  ('27.1','Documentales',   (SELECT id FROM trd_catalogo_series WHERE codigo='27')),
  ('27.2','Bienes',         (SELECT id FROM trd_catalogo_series WHERE codigo='27')),
  ('27.3','Transferencias', (SELECT id FROM trd_catalogo_series WHERE codigo='27')),
  ('28.1','Libro diario', (SELECT id FROM trd_catalogo_series WHERE codigo='28')),
  ('28.2','Libro mayor',  (SELECT id FROM trd_catalogo_series WHERE codigo='28')),
  ('28.3','Libro bancos', (SELECT id FROM trd_catalogo_series WHERE codigo='28')),
  ('31.1','Planes de accion',       (SELECT id FROM trd_catalogo_series WHERE codigo='31')),
  ('31.2','Planes estrategicos',    (SELECT id FROM trd_catalogo_series WHERE codigo='31')),
  ('31.3','Planes institucionales', (SELECT id FROM trd_catalogo_series WHERE codigo='31')),
  ('31.4','Planes de mejoramiento', (SELECT id FROM trd_catalogo_series WHERE codigo='31')),
  ('32.1','Programas institucionales', (SELECT id FROM trd_catalogo_series WHERE codigo='32')),
  ('32.2','Programas sociales',        (SELECT id FROM trd_catalogo_series WHERE codigo='32')),
  ('33.1','Procesos judiciales',      (SELECT id FROM trd_catalogo_series WHERE codigo='33')),
  ('33.2','Procesos disciplinarios',  (SELECT id FROM trd_catalogo_series WHERE codigo='33')),
  ('33.3','Procesos administrativos', (SELECT id FROM trd_catalogo_series WHERE codigo='33')),
  ('33.4','Procesos sancionatorios',  (SELECT id FROM trd_catalogo_series WHERE codigo='33')),
  ('34.1','Proyectos de acuerdo',    (SELECT id FROM trd_catalogo_series WHERE codigo='34')),
  ('34.2','Proyectos institucionales',(SELECT id FROM trd_catalogo_series WHERE codigo='34')),
  ('35.1','Registro de usuarios',     (SELECT id FROM trd_catalogo_series WHERE codigo='35')),
  ('35.2','Registros administrativos',(SELECT id FROM trd_catalogo_series WHERE codigo='35')),
  ('37.1','Peticiones',  (SELECT id FROM trd_catalogo_series WHERE codigo='37')),
  ('37.2','Quejas',      (SELECT id FROM trd_catalogo_series WHERE codigo='37')),
  ('37.3','Reclamos',    (SELECT id FROM trd_catalogo_series WHERE codigo='37')),
  ('37.4','Sugerencias', (SELECT id FROM trd_catalogo_series WHERE codigo='37'))
ON CONFLICT (codigo, serie_id) DO NOTHING;

-- ── TRD 10: DESPACHO DEL ALCALDE ────────────────────────────
DO $$
DECLARE v_u TEXT;
BEGIN
  SELECT id::text INTO v_u FROM trd_unidades WHERE codigo='10' AND entidad_id=1;

  INSERT INTO series (id,trd_version_id,nombre,codigo,tiempo_gestion,tiempo_central,disposicion_final,unidad_id,catalogo_serie_id,activo) VALUES
    (gen_random_uuid()::text,'v1-pitalito','ACTAS',           '10-1',NULL,NULL,NULL,  v_u,(SELECT id FROM trd_catalogo_series WHERE codigo='3'), true),
    (gen_random_uuid()::text,'v1-pitalito','ACUERDOS',        '10-2',4,6,  'CT',      v_u,(SELECT id FROM trd_catalogo_series WHERE codigo='5'), true),
    (gen_random_uuid()::text,'v1-pitalito','DECRETOS',        '10-3',4,6,  'CT',      v_u,(SELECT id FROM trd_catalogo_series WHERE codigo='4'), true),
    (gen_random_uuid()::text,'v1-pitalito','INFORMES',        '10-4',NULL,NULL,NULL,  v_u,(SELECT id FROM trd_catalogo_series WHERE codigo='24'),true),
    (gen_random_uuid()::text,'v1-pitalito','PLANES',          '10-5',NULL,NULL,NULL,  v_u,(SELECT id FROM trd_catalogo_series WHERE codigo='31'),true),
    (gen_random_uuid()::text,'v1-pitalito','PROGRAMAS',       '10-6',NULL,NULL,NULL,  v_u,(SELECT id FROM trd_catalogo_series WHERE codigo='32'),true),
    (gen_random_uuid()::text,'v1-pitalito','PROYECTOS DE ACUERDO','10-7',1,9,'CT',   v_u,(SELECT id FROM trd_catalogo_series WHERE codigo='34'),true),
    (gen_random_uuid()::text,'v1-pitalito','RESOLUCIONES',    '10-8',1,9,  'CT',      v_u,(SELECT id FROM trd_catalogo_series WHERE codigo='36'),true)
  ON CONFLICT DO NOTHING;

  -- Subseries 10-1 ACTAS
  INSERT INTO subseries (id,serie_id,nombre,codigo,tiempo_gestion,tiempo_central,disposicion_final,tipos_documentales,activo) VALUES
    (gen_random_uuid()::text,(SELECT id FROM series WHERE codigo='10-1' AND unidad_id=v_u),
     'Actas de Consejo de Gobierno','10-1.1',1,9,'CT',
     ARRAY['Citacion','Agenda','Lista de asistencia','Acta'],true),
    (gen_random_uuid()::text,(SELECT id FROM series WHERE codigo='10-1' AND unidad_id=v_u),
     'Actas de Posesion a cargos de orden Municipal','10-1.2',4,6,'CT',
     ARRAY['Citacion','Anexos','Posesion'],true)
  ON CONFLICT DO NOTHING;

  -- Subseries 10-4 INFORMES
  INSERT INTO subseries (id,serie_id,nombre,codigo,tiempo_gestion,tiempo_central,disposicion_final,tipos_documentales,activo) VALUES
    (gen_random_uuid()::text,(SELECT id FROM series WHERE codigo='10-4' AND unidad_id=v_u),
     'Informes de Gestion','10-4.1',2,8,'CT',
     ARRAY['Solicitud','Plan de mejoramiento','Oficios de respuesta','Informes de avances'],true),
    (gen_random_uuid()::text,(SELECT id FROM series WHERE codigo='10-4' AND unidad_id=v_u),
     'Informes Interinstitucionales','10-4.2',2,8,'CT',
     ARRAY['Solicitud','Plan de mejoramiento','Comunicaciones','Informes de avances'],true),
    (gen_random_uuid()::text,(SELECT id FROM series WHERE codigo='10-4' AND unidad_id=v_u),
     'Informes a Organismos de Vigilancia y Control','10-4.3',2,8,'CT',
     ARRAY['Solicitud','Plan de mejoramiento','Comunicaciones'],true),
    (gen_random_uuid()::text,(SELECT id FROM series WHERE codigo='10-4' AND unidad_id=v_u),
     'Informe de Rendicion de Cuentas','10-4.4',2,8,'CT',
     ARRAY['Solicitud','Informe','Plan de mejoramiento','Oficios de respuesta'],true)
  ON CONFLICT DO NOTHING;

  -- Subseries 10-5 PLANES
  INSERT INTO subseries (id,serie_id,nombre,codigo,tiempo_gestion,tiempo_central,disposicion_final,tipos_documentales,activo) VALUES
    (gen_random_uuid()::text,(SELECT id FROM series WHERE codigo='10-5' AND unidad_id=v_u),
     'Plan de Desarrollo Municipal','10-5.1',1,4,'CT',
     ARRAY['Compendio del plan','Informes de seguimiento','Informes CTP','Conceptos CTP'],true),
    (gen_random_uuid()::text,(SELECT id FROM series WHERE codigo='10-5' AND unidad_id=v_u),
     'Plan de Accion','10-5.2',1,4,'CT',
     ARRAY['Compendio del plan','Informes de seguimiento'],true),
    (gen_random_uuid()::text,(SELECT id FROM series WHERE codigo='10-5' AND unidad_id=v_u),
     'Plan anual de presupuesto','10-5.3',2,8,'CT',
     ARRAY['Plan de presupuesto'],true)
  ON CONFLICT DO NOTHING;

  -- Subseries 10-6 PROGRAMAS
  INSERT INTO subseries (id,serie_id,nombre,codigo,tiempo_gestion,tiempo_central,disposicion_final,activo) VALUES
    (gen_random_uuid()::text,(SELECT id FROM series WHERE codigo='10-6' AND unidad_id=v_u),
     'Programas de cooperacion agencias de empleo con el SENA','10-6.1',2,8,'CT',true)
  ON CONFLICT DO NOTHING;

END $$;

-- ── TRD 11: CONTROL INTERNO DISCIPLINARIO ───────────────────
DO $$
DECLARE v_u TEXT;
BEGIN
  SELECT id::text INTO v_u FROM trd_unidades WHERE codigo='11' AND entidad_id=1;

  INSERT INTO series (id,trd_version_id,nombre,codigo,unidad_id,catalogo_serie_id,activo)
  VALUES (gen_random_uuid()::text,'v1-pitalito','PROCESOS','11-1',v_u,
    (SELECT id FROM trd_catalogo_series WHERE codigo='33'),true)
  ON CONFLICT DO NOTHING;

  INSERT INTO subseries (id,serie_id,nombre,codigo,tiempo_gestion,tiempo_central,disposicion_final,procedimiento,tipos_documentales,activo)
  VALUES (gen_random_uuid()::text,
    (SELECT id FROM series WHERE codigo='11-1' AND unidad_id=v_u),
    'Procesos disciplinarios','11-1.1',2,3,'ST',
    'Seleccion cualitativa 3%. Muestra por impacto, complejidad e instancias. El resto se elimina.',
    ARRAY['Informe servidor publico','Auto de indagacion previa','Auto de investigacion',
          'Inhibitorio','Notificaciones','Edicto','Estados','Electronicas',
          'Apertura indagacion previa','Auto pliego de cargos',
          'Pruebas en etapa de descargos','Alegatos de conclusion','Fallo primera instancia'],
    true)
  ON CONFLICT DO NOTHING;
END $$;

-- ── TRD 12: CONTROL INTERNO ADMINISTRATIVO ──────────────────
DO $$
DECLARE v_u TEXT;
BEGIN
  SELECT id::text INTO v_u FROM trd_unidades WHERE codigo='12' AND entidad_id=1;

  INSERT INTO series (id,trd_version_id,nombre,codigo,unidad_id,catalogo_serie_id,activo) VALUES
    (gen_random_uuid()::text,'v1-pitalito','ACTAS',    '12-1',v_u,(SELECT id FROM trd_catalogo_series WHERE codigo='3'), true),
    (gen_random_uuid()::text,'v1-pitalito','PROGRAMAS','12-2',v_u,(SELECT id FROM trd_catalogo_series WHERE codigo='32'),true),
    (gen_random_uuid()::text,'v1-pitalito','PLANES',   '12-3',v_u,(SELECT id FROM trd_catalogo_series WHERE codigo='31'),true),
    (gen_random_uuid()::text,'v1-pitalito','INFORMES', '12-4',v_u,(SELECT id FROM trd_catalogo_series WHERE codigo='24'),true)
  ON CONFLICT DO NOTHING;

  INSERT INTO subseries (id,serie_id,nombre,codigo,tiempo_gestion,tiempo_central,disposicion_final,tipos_documentales,activo) VALUES
    (gen_random_uuid()::text,(SELECT id FROM series WHERE codigo='12-1' AND unidad_id=v_u),
     'Actas de comite Institucional de coordinacion de control Interno','12-1.1',1,9,'CT',
     ARRAY['Comunicaciones','Registros fotograficos','Registro de asistencia','Actas'],true),
    (gen_random_uuid()::text,(SELECT id FROM series WHERE codigo='12-2' AND unidad_id=v_u),
     'Programa de Auditorias Internas','12-2.1',2,8,'CT',
     ARRAY['Comunicacion','Plan de auditoria','Actas de apertura','Registros','Informe final'],true),
    (gen_random_uuid()::text,(SELECT id FROM series WHERE codigo='12-2' AND unidad_id=v_u),
     'Programa asesoria sobre mejora continua','12-2.2',2,8,'CT',
     ARRAY['Comunicaciones','Seguimiento mapa de riesgos MIPG'],true),
    (gen_random_uuid()::text,(SELECT id FROM series WHERE codigo='12-2' AND unidad_id=v_u),
     'Programa de ambiente y Autocontrol','12-2.3',2,8,'CT',
     ARRAY['Comunicaciones','Actas de seguimiento subcomites de autocontrol'],true),
    (gen_random_uuid()::text,(SELECT id FROM series WHERE codigo='12-3' AND unidad_id=v_u),
     'Planes de Mejoramiento','12-3.1',2,8,'CT',
     ARRAY['Solicitud','Plan','Oficios de respuesta','Informes al plan de mejoramiento'],true),
    (gen_random_uuid()::text,(SELECT id FROM series WHERE codigo='12-4' AND unidad_id=v_u),
     'Informes a Organismos de Vigilancia y Control','12-4.1',2,8,'CT',NULL,true),
    (gen_random_uuid()::text,(SELECT id FROM series WHERE codigo='12-4' AND unidad_id=v_u),
     'Informe de Austeridad Gasto publico','12-4.2',2,8,'CT',NULL,true),
    (gen_random_uuid()::text,(SELECT id FROM series WHERE codigo='12-4' AND unidad_id=v_u),
     'Informe seguimiento PQRSD','12-4.3',2,8,'CT',NULL,true),
    (gen_random_uuid()::text,(SELECT id FROM series WHERE codigo='12-4' AND unidad_id=v_u),
     'Informes Seguimiento planes de mejoramiento','12-4.4',2,8,'CT',NULL,true),
    (gen_random_uuid()::text,(SELECT id FROM series WHERE codigo='12-4' AND unidad_id=v_u),
     'Informes evaluacion plan anticorrupcion','12-4.5',2,8,'CT',NULL,true),
    (gen_random_uuid()::text,(SELECT id FROM series WHERE codigo='12-4' AND unidad_id=v_u),
     'Informe ejecutivo anual','12-4.6',2,8,'CT',NULL,true),
    (gen_random_uuid()::text,(SELECT id FROM series WHERE codigo='12-4' AND unidad_id=v_u),
     'Informe seguimiento control interno contable','12-4.7',2,8,'CT',NULL,true)
  ON CONFLICT DO NOTHING;
END $$;

-- ── TRD 13: OFICINA DE CONTRATACION ─────────────────────────
DO $$
DECLARE v_u TEXT;
BEGIN
  SELECT id::text INTO v_u FROM trd_unidades WHERE codigo='13' AND entidad_id=1;

  INSERT INTO series (id,trd_version_id,nombre,codigo,unidad_id,catalogo_serie_id,procedimiento,activo) VALUES
    (gen_random_uuid()::text,'v1-pitalito','CONTRATOS','13-1',v_u,
     (SELECT id FROM trd_catalogo_series WHERE codigo='16'),
     'Retencion 20 anios desde acta de liquidacion. Seleccion cualitativa 10% al agotar AC.',true),
    (gen_random_uuid()::text,'v1-pitalito','INFORMES','13-2',v_u,
     (SELECT id FROM trd_catalogo_series WHERE codigo='24'),NULL,true)
  ON CONFLICT DO NOTHING;

  INSERT INTO subseries (id,serie_id,nombre,codigo,tiempo_gestion,tiempo_central,disposicion_final,tipos_documentales,activo) VALUES
    (gen_random_uuid()::text,(SELECT id FROM series WHERE codigo='13-1' AND unidad_id=v_u),
     'Contratos de Arrendamiento','13-1.1',3,17,'ST',
     ARRAY['Estudios previos','Propuestas y cotizaciones','Analisis de mercado','Acto administrativo',
           'Minuta o contrato','Recibos de legalizacion','Polizas','Registro presupuestal',
           'Acta de inicio','Relacion de pagos','Acta de terminacion','Acta de liquidacion'],true),
    (gen_random_uuid()::text,(SELECT id FROM series WHERE codigo='13-1' AND unidad_id=v_u),
     'Contratos de Comodato','13-1.2',3,17,'ST',
     ARRAY['Estudio previo','NIT','Resolucion de justificacion','Camara de Comercio',
           'Personeria juridica','Cedula representante legal','Antecedentes fiscales',
           'Antecedentes disciplinarios','Antecedentes judiciales','Minuta contrato',
           'Acta de inicio','Acta de liquidacion'],true),
    (gen_random_uuid()::text,(SELECT id FROM series WHERE codigo='13-1' AND unidad_id=v_u),
     'Contratos de Consultoria-Interventoria-Auditoria','13-1.3',3,17,'ST',
     ARRAY['Plan anual de adquisiciones','Estudios previos','Presupuesto','Analisis del sector',
           'Proyecto de pliegos','Acto de apertura','Pliego definitivo','Propuestas',
           'Evaluacion final','Acto de adjudicacion','Minuta contrato','Polizas',
           'Registro presupuestal','Acta de inicio','Informes de supervision','Liquidacion'],true),
    (gen_random_uuid()::text,(SELECT id FROM series WHERE codigo='13-1' AND unidad_id=v_u),
     'Contratos de Obra (minima cuantia)','13-1.4',3,17,'ST',
     ARRAY['Plan anual de adquisiciones','Estudios previos','Invitacion publica',
           'Propuestas','Evaluacion','Acto de adjudicacion','Contrato','Polizas',
           'Registro presupuestal','Acta de inicio','Relacion de pagos',
           'Modificaciones OtroSi','Acta de terminacion','Liquidacion'],true),
    (gen_random_uuid()::text,(SELECT id FROM series WHERE codigo='13-1' AND unidad_id=v_u),
     'Contratos de Obra (seleccion abreviada)','13-1.4.1',3,17,'ST',
     ARRAY['Matriz de riesgo','Matriz de experiencia','Matriz de indicadores financieros',
           'Pliego de condiciones definitivo','Propuestas','Evaluacion final',
           'Resolucion de adjudicacion','Contrato','Polizas','Liquidacion'],true),
    (gen_random_uuid()::text,(SELECT id FROM series WHERE codigo='13-1' AND unidad_id=v_u),
     'Contratos de Obra (licitacion publica)','13-1.4.2',3,17,'ST',
     ARRAY['Aviso de convocatoria','Proyecto de pliegos','Audiencia de aclaracion',
           'Propuestas','Acta de audiencia de adjudicacion','Resolucion de adjudicacion',
           'Contrato','Liquidacion'],true),
    (gen_random_uuid()::text,(SELECT id FROM series WHERE codigo='13-1' AND unidad_id=v_u),
     'Contrato de Prestacion de Servicios','13-1.5',3,17,'ST',
     ARRAY['Estudios previos','Certificado insuficiencia de personal','Hoja de vida',
           'Cedula de ciudadania','Documentos academicos','Certificados de experiencia',
           'Antecedentes disciplinarios','Antecedentes judiciales','Certificado contraloria',
           'Minuta contrato','Poliza','Registro presupuestal','Acta de inicio',
           'Relacion de pagos','Acta de terminacion y liquidacion'],true),
    (gen_random_uuid()::text,(SELECT id FROM series WHERE codigo='13-1' AND unidad_id=v_u),
     'Contratos de Suministro (minima cuantia)','13-1.6',3,17,'ST',
     ARRAY['Estudios previos','Analisis del sector','Invitacion publica','Propuestas',
           'Evaluacion final','Aceptacion de oferta','Poliza','Registro presupuestal',
           'Acta de inicio','Acta de recibo','Acta de liquidacion'],true),
    (gen_random_uuid()::text,(SELECT id FROM series WHERE codigo='13-1' AND unidad_id=v_u),
     'Convenios o Contratos Interadministrativos','13-1.7',3,17,'ST',
     ARRAY['Estudios previos','Acto administrativo de justificacion','Propuesta firmada',
           'Certificado de existencia','Documentos representante legal',
           'Minuta del contrato','Poliza','Registro presupuestal','Acta de inicio',
           'Relacion de pagos','Liquidacion'],true),
    (gen_random_uuid()::text,(SELECT id FROM series WHERE codigo='13-1' AND unidad_id=v_u),
     'Orden de Compra (Acuerdo Marco)','13-1.8',3,17,'ST',
     ARRAY['Plan anual','CDP','Estudio de mercado','Estudios previos',
           'Orden de compra','Poliza','Registro presupuestal','Acta de inicio'],true),
    (gen_random_uuid()::text,(SELECT id FROM series WHERE codigo='13-1' AND unidad_id=v_u),
     'Bolsa Mercantil','13-1.9',3,17,'ST',
     ARRAY['Plan anual','CDP','Estudio de mercado','Estudios previos'],true),
    (gen_random_uuid()::text,(SELECT id FROM series WHERE codigo='13-2' AND unidad_id=v_u),
     'Informes Interinstitucionales','13-2.1',2,8,'CT',
     ARRAY['Solicitud','Formatos','Plan de mejoramiento','Comunicaciones','Informes de avances'],true),
    (gen_random_uuid()::text,(SELECT id FROM series WHERE codigo='13-2' AND unidad_id=v_u),
     'Informes a Organismos de Vigilancia y Control','13-2.2',2,8,'CT',
     ARRAY['Solicitud','Oficios de respuesta','Informe'],true)
  ON CONFLICT DO NOTHING;
END $$;

-- ── TRD 14: OFICINA JURIDICA ─────────────────────────────────
DO $$
DECLARE v_u TEXT;
BEGIN
  SELECT id::text INTO v_u FROM trd_unidades WHERE codigo='14' AND entidad_id=1;

  INSERT INTO series (id,trd_version_id,nombre,codigo,unidad_id,catalogo_serie_id,activo) VALUES
    (gen_random_uuid()::text,'v1-pitalito','ACCIONES CONSTITUCIONALES','14-1',v_u,
     (SELECT id FROM trd_catalogo_series WHERE codigo='1'),true),
    (gen_random_uuid()::text,'v1-pitalito','ACTAS','14-2',v_u,
     (SELECT id FROM trd_catalogo_series WHERE codigo='3'),true)
  ON CONFLICT DO NOTHING;

  INSERT INTO subseries (id,serie_id,nombre,codigo,disposicion_final,tipos_documentales,activo) VALUES
    (gen_random_uuid()::text,(SELECT id FROM series WHERE codigo='14-1' AND unidad_id=v_u),
     'Acciones de Tutela','14-1.1','CT',
     ARRAY['Notificacion','Pruebas','Contestacion','Fallo','Escrito de impugnacion',
           'Fallo de segunda instancia','Cumplimiento del fallo'],true),
    (gen_random_uuid()::text,(SELECT id FROM series WHERE codigo='14-1' AND unidad_id=v_u),
     'Accion Popular','14-1.2','CT',
     ARRAY['Copia de la demanda','Notificacion','Pruebas','Contestacion','Audiencia inicial',
           'Audiencia de pacto de cumplimiento','Seguimiento al pacto','Fallo',
           'Impugnacion','Fallo de segunda instancia'],true),
    (gen_random_uuid()::text,(SELECT id FROM series WHERE codigo='14-1' AND unidad_id=v_u),
     'Acciones de Grupo','14-1.3','CT',
     ARRAY['Oficios','Solicitudes','Contestaciones'],true),
    (gen_random_uuid()::text,(SELECT id FROM series WHERE codigo='14-1' AND unidad_id=v_u),
     'Acciones de Repeticion','14-1.4','CT',
     ARRAY['Demandas','Notificaciones','Contestacion','Fallos','Impugnacion'],true),
    (gen_random_uuid()::text,(SELECT id FROM series WHERE codigo='14-1' AND unidad_id=v_u),
     'Accion de Cumplimiento','14-1.5','CT',
     ARRAY['Copia de la demanda','Notificacion','Pruebas','Contestacion',
           'Fallo','Impugnacion','Fallo segunda instancia'],true),
    (gen_random_uuid()::text,(SELECT id FROM series WHERE codigo='14-1' AND unidad_id=v_u),
     'Reparacion Directa','14-1.6','CT',
     ARRAY['Auto admisorio','Demanda','Contestacion','Poder','Audiencia inicial',
           'Alegatos','Sentencia primera instancia','Apelacion',
           'Sentencia segunda instancia','Cumplimiento'],true),
    (gen_random_uuid()::text,(SELECT id FROM series WHERE codigo='14-2' AND unidad_id=v_u),
     'Actas de Comite de Conciliacion','14-2.1','CT',
     ARRAY['Traslado de solicitud','Auto admisorio','Estudio de solicitud',
           'Convocatoria','Acta','Certificacion'],true)
  ON CONFLICT DO NOTHING;
END $$;

-- ── TRD 15: OFICINA DE AMBIENTE Y GESTION DEL RIESGO ────────
DO $$
DECLARE v_u TEXT;
BEGIN
  SELECT id::text INTO v_u FROM trd_unidades WHERE codigo='15' AND entidad_id=1;

  INSERT INTO series (id,trd_version_id,nombre,codigo,unidad_id,catalogo_serie_id,activo) VALUES
    (gen_random_uuid()::text,'v1-pitalito','ACTAS',              '15-1',v_u,(SELECT id FROM trd_catalogo_series WHERE codigo='3'), true),
    (gen_random_uuid()::text,'v1-pitalito','CERTIFICADOS',       '15-2',v_u,(SELECT id FROM trd_catalogo_series WHERE codigo='9'), true),
    (gen_random_uuid()::text,'v1-pitalito','CONCEPTOS',          '15-3',v_u,(SELECT id FROM trd_catalogo_series WHERE codigo='13'),true),
    (gen_random_uuid()::text,'v1-pitalito','INFORMES',           '15-4',v_u,(SELECT id FROM trd_catalogo_series WHERE codigo='24'),true),
    (gen_random_uuid()::text,'v1-pitalito','PLANES Y PROYECTOS', '15-5',v_u,(SELECT id FROM trd_catalogo_series WHERE codigo='31'),true),
    (gen_random_uuid()::text,'v1-pitalito','CONTRAVENCIONES',    '15-6',v_u,NULL,true)
  ON CONFLICT DO NOTHING;

  -- Actas
  INSERT INTO subseries (id,serie_id,nombre,codigo,tiempo_gestion,tiempo_central,disposicion_final,tipos_documentales,activo) VALUES
    (gen_random_uuid()::text,(SELECT id FROM series WHERE codigo='15-1' AND unidad_id=v_u),
     'Actas Consejo Municipal Gestion de Riesgo y desastres','15-1.1',1,9,'CT',
     ARRAY['Citacion','Listado de asistencia','Solicitudes','Planes de contingencia','Acta'],true),
    (gen_random_uuid()::text,(SELECT id FROM series WHERE codigo='15-1' AND unidad_id=v_u),
     'Actas Comite interinstitucional ambiental CIDEA','15-1.2',1,9,'CT',
     ARRAY['Citacion','Acta','Listado de asistencia','Solicitudes','Planes de contingencia'],true),
    (gen_random_uuid()::text,(SELECT id FROM series WHERE codigo='15-1' AND unidad_id=v_u),
     'Actas comites conocimiento reduccion y manejo de desastres','15-1.3',1,9,'CT',
     ARRAY['Citacion','Acta','Listado de asistencia','Solicitudes','Planes de contingencia'],true),
    (gen_random_uuid()::text,(SELECT id FROM series WHERE codigo='15-1' AND unidad_id=v_u),
     'Actas Comision arboles de riesgo CAM-Alcaldia-Bombero','15-1.4',1,9,'CT',
     ARRAY['Solicitud','Evaluacion','Permiso para tala y poda','Oficio de no autorizacion'],true),
    (gen_random_uuid()::text,(SELECT id FROM series WHERE codigo='15-1' AND unidad_id=v_u),
     'Actas consejos locales gestion riesgo y cambio climatico','15-1.5',1,9,'CT',
     ARRAY['Citacion','Acta','Listado de asistencia','Planes de contingencia'],true),
    (gen_random_uuid()::text,(SELECT id FROM series WHERE codigo='15-1' AND unidad_id=v_u),
     'Actas Comite local de areas protegidas','15-1.6',1,9,'CT',
     ARRAY['Citacion','Acta','Listado de asistencia','Solicitudes'],true),
    (gen_random_uuid()::text,(SELECT id FROM series WHERE codigo='15-1' AND unidad_id=v_u),
     'Actas Consejo municipal de cambio climatico','15-1.7',1,9,'CT',
     ARRAY['Citacion','Acta','Listado de asistencia','Plan de accion','Informe al plan'],true),
    (gen_random_uuid()::text,(SELECT id FROM series WHERE codigo='15-1' AND unidad_id=v_u),
     'Actas Comite reasentamiento zonas de riesgo no mitigables','15-1.8',1,9,'CT',
     ARRAY['Citacion','Acta','Listado de asistencia','Solicitudes','Planes de contingencia'],true),
    (gen_random_uuid()::text,(SELECT id FROM series WHERE codigo='15-1' AND unidad_id=v_u),
     'Actas Comite monitoreo OSO Y DANTA','15-1.9',1,9,'CT',
     ARRAY['Citacion','Acta','Listado de asistencia','Registro filmico','Planes de contingencia'],true)
  ON CONFLICT DO NOTHING;

  -- Certificados
  INSERT INTO subseries (id,serie_id,nombre,codigo,tiempo_gestion,tiempo_central,disposicion_final,tipos_documentales,activo) VALUES
    (gen_random_uuid()::text,(SELECT id FROM series WHERE codigo='15-2' AND unidad_id=v_u),
     'Emergencias y desastres','15-2.1',2,8,'EL',
     ARRAY['Ficha EDAN','Reporte sector agropecuario','Registro unico de damnificados',
           'Planillas de entrega de ayuda humanitaria'],true),
    (gen_random_uuid()::text,(SELECT id FROM series WHERE codigo='15-2' AND unidad_id=v_u),
     'Certificados de afectaciones incendio-avalancha','15-2.2',2,8,'EL',
     ARRAY['Registro en actas de gestion del riesgo'],true)
  ON CONFLICT DO NOTHING;

  -- Conceptos
  INSERT INTO subseries (id,serie_id,nombre,codigo,tiempo_gestion,tiempo_central,disposicion_final,tipos_documentales,activo) VALUES
    (gen_random_uuid()::text,(SELECT id FROM series WHERE codigo='15-3' AND unidad_id=v_u),
     'Conceptos plan de contingencia para eventos publicos','15-3.1',2,8,'EL',
     ARRAY['Solicitud','Conceptos al plan de contingencia'],true),
    (gen_random_uuid()::text,(SELECT id FROM series WHERE codigo='15-3' AND unidad_id=v_u),
     'Conceptos Tecnicos Prevencion de Incendios y Seguridad Humana','15-3.2',2,8,'EL',
     ARRAY['Gestion riesgo','FR forestal evaluacion del riesgo','Conceptos ambientales',
           'Contravenciones','Solicitud','Concepto'],true)
  ON CONFLICT DO NOTHING;

  -- Informes
  INSERT INTO subseries (id,serie_id,nombre,codigo,tiempo_gestion,tiempo_central,disposicion_final,tipos_documentales,activo) VALUES
    (gen_random_uuid()::text,(SELECT id FROM series WHERE codigo='15-4' AND unidad_id=v_u),
     'Informes Interinstitucionales','15-4.1',2,8,'CT',ARRAY['Solicitud','Informes'],true),
    (gen_random_uuid()::text,(SELECT id FROM series WHERE codigo='15-4' AND unidad_id=v_u),
     'Informe inversion recursos del 1%','15-4.2',2,8,'CT',ARRAY['Solicitud','Informes'],true),
    (gen_random_uuid()::text,(SELECT id FROM series WHERE codigo='15-4' AND unidad_id=v_u),
     'Reporte adquisicion predios de conservacion','15-4.3',2,8,'CT',
     ARRAY['Escritura','Certificado de libertad y tradicion','Solicitud','Informes'],true),
    (gen_random_uuid()::text,(SELECT id FROM series WHERE codigo='15-4' AND unidad_id=v_u),
     'Reporte de damnificados','15-4.4',2,8,'CT',ARRAY['Solicitud','Informes'],true),
    (gen_random_uuid()::text,(SELECT id FROM series WHERE codigo='15-4' AND unidad_id=v_u),
     'Informes a Organismos de Vigilancia y Control','15-4.5',2,8,'CT',
     ARRAY['Solicitud','Informe'],true)
  ON CONFLICT DO NOTHING;

  -- Planes y proyectos
  INSERT INTO subseries (id,serie_id,nombre,codigo,tiempo_gestion,tiempo_central,disposicion_final,activo) VALUES
    (gen_random_uuid()::text,(SELECT id FROM series WHERE codigo='15-5' AND unidad_id=v_u),'Plan de Capacitacion en Gestion del Riesgo','15-5.1',2,8,'CT',true),
    (gen_random_uuid()::text,(SELECT id FROM series WHERE codigo='15-5' AND unidad_id=v_u),'Plan de contencion por ruido PEGIRS','15-5.2',2,8,'CT',true),
    (gen_random_uuid()::text,(SELECT id FROM series WHERE codigo='15-5' AND unidad_id=v_u),'Proyectos ciudadanos de educacion ambiental','15-5.3',2,8,'CT',true),
    (gen_random_uuid()::text,(SELECT id FROM series WHERE codigo='15-5' AND unidad_id=v_u),'Proyectos de inversion ambiental y riesgo','15-5.4',2,8,'CT',true),
    (gen_random_uuid()::text,(SELECT id FROM series WHERE codigo='15-5' AND unidad_id=v_u),'Plan de ordenamiento del rio guarapas','15-5.5',2,8,'CT',true),
    (gen_random_uuid()::text,(SELECT id FROM series WHERE codigo='15-5' AND unidad_id=v_u),'Plan de saneamiento y manejo de vertimientos PSMV','15-5.6',2,8,'CT',true),
    (gen_random_uuid()::text,(SELECT id FROM series WHERE codigo='15-5' AND unidad_id=v_u),'Plan de Gestion Integral de Residuos Solidos PEGIRS','15-5.7',2,8,'CT',true),
    (gen_random_uuid()::text,(SELECT id FROM series WHERE codigo='15-5' AND unidad_id=v_u),'Plan de capacitacion en avistamiento de aves','15-5.8',2,8,'CT',true),
    (gen_random_uuid()::text,(SELECT id FROM series WHERE codigo='15-5' AND unidad_id=v_u),'Planes familiares de emergencia riesgo','15-5.9',2,8,'CT',true),
    (gen_random_uuid()::text,(SELECT id FROM series WHERE codigo='15-5' AND unidad_id=v_u),'Planes comunitarios de emergencia','15-5.10',2,8,'CT',true),
    (gen_random_uuid()::text,(SELECT id FROM series WHERE codigo='15-5' AND unidad_id=v_u),'Plan de capacitacion en primeros auxilios','15-5.11',2,8,'CT',true),
    (gen_random_uuid()::text,(SELECT id FROM series WHERE codigo='15-5' AND unidad_id=v_u),'Planes de emergencia','15-5.12',2,8,'CT',true)
  ON CONFLICT DO NOTHING;

  -- Contravenciones
  INSERT INTO subseries (id,serie_id,nombre,codigo,tiempo_gestion,tiempo_central,disposicion_final,procedimiento,tipos_documentales,activo)
  VALUES (gen_random_uuid()::text,
    (SELECT id FROM series WHERE codigo='15-6' AND unidad_id=v_u),
    'Contravenciones ambientales amonestacion y traslado a autoridad ambiental','15-6.1',
    2,8,'EL',
    'Ley 1801 de 2016. Al agotar AC pierden valores administrativos y penales. Eliminacion por prensado segun AGN.',
    ARRAY['Denuncia','Informe','Notificacion','Sancion'],true)
  ON CONFLICT DO NOTHING;

END $$;
