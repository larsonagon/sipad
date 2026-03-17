-- =====================================================
-- SEED SEGTEC ACTIVIDADES
-- 3 superadmin
-- 3 larsonagon
-- =====================================================


INSERT INTO segtec_actividades (

id,
dependencia_id,
usuario_id,

nombre,
cargo_ejecutor,
tipo_funcion,
frecuencia,
descripcion_funcional,

genera_expediente_propio,
actividad_permanente,

genera_documentos,
documentos_generados,

formato_produccion,
recepcion_externa,

volumen_documental,

responsable_custodia,
cargo_custodia,

localizacion_documentos,

requiere_otras_dependencias,
dependencias_relacionadas,

tiene_pasos_formales,

plazo_legal,
tiempo_ejecucion,

norma_aplicable,

estado_general,
created_at,
updated_at

)

VALUES


-- =====================================================
-- SUPERADMIN
-- =====================================================

(
gen_random_uuid()::text,
1,
1,

'Gestión de correspondencia del despacho del alcalde',
'ALCALDE',
'misional',
'diaria',
'Recepción y asignación de comunicaciones oficiales dirigidas al despacho.',

1,
1,

'si',
'Oficios\nMemorandos\nCirculares',

'digital',
'Correspondencia ciudadana',

'entre_10_50',

'misma_dependencia',
1,

'carpeta_red',

1,
'["2","4"]',

1,

'Ley 1437 de 2011',
'3 días',

'Ley 1437 de 2011',

'caracterizada',
NOW(),
NOW()
),

(
gen_random_uuid()::text,
1,
1,

'Seguimiento a compromisos institucionales',
'ALCALDE',
'estrategica',
'mensual',
'Control del cumplimiento de compromisos adquiridos por el despacho.',

1,
1,

'si',
'Informes de seguimiento',

'digital',
'Reportes internos',

'menos_10',

'misma_dependencia',
1,

'servidor',

1,
'["2","5"]',

1,

NULL,
'10 días',

'Ley 489 de 1998',

'caracterizada',
NOW(),
NOW()
),

(
gen_random_uuid()::text,
1,
1,

'Coordinación de reuniones de gabinete',
'ALCALDE',
'estrategica',
'semanal',
'Organización y documentación de reuniones del gabinete municipal.',

1,
1,

'si',
'Actas de reunión\nListas de asistencia',

'mixto',
'Agenda institucional',

'menos_10',

'misma_dependencia',
1,

'archivador',

1,
'["4","13"]',

1,

NULL,
'2 días',

'Ley 489 de 1998',

'caracterizada',
NOW(),
NOW()
),



-- =====================================================
-- LARSONAGON
-- =====================================================

(
gen_random_uuid()::text,
2,
3,

'Elaboración de conceptos jurídicos',
'PROFESIONAL UNIVERSITARIO',
'misional',
'semanal',
'Análisis jurídico y emisión de conceptos legales.',

1,
1,

'si',
'Conceptos jurídicos',

'fisico',
'Solicitud formal',

'menos_10',

'archivo_central',
10,

'archivador',

1,
'["1","4"]',

1,

'Ley 1437 de 2011',
'5 días',

'Ley 1437 de 2011',

'caracterizada',
NOW(),
NOW()
),

(
gen_random_uuid()::text,
2,
3,

'Revisión de contratos administrativos',
'PROFESIONAL UNIVERSITARIO',
'mensual',
'mensual',
'Análisis jurídico de contratos y verificación normativa.',

1,
1,

'si',
'Conceptos jurídicos\nInformes',

'fisico',
'Contrato firmado',

'entre_10_50',

'archivo_central',
10,

'archivador',

1,
'["4","11"]',

1,

'Ley 80 de 1993',
'7 días',

'Ley 80 de 1993',

'caracterizada',
NOW(),
NOW()
),

(
gen_random_uuid()::text,
2,
3,

'Atención de requerimientos judiciales',
'PROFESIONAL UNIVERSITARIO',
'misional',
'eventual',
'Respuesta jurídica a requerimientos judiciales.',

1,
1,

'si',
'Oficios de respuesta\nInformes jurídicos',

'digital',
'Oficio judicial',

'menos_10',

'archivo_central',
10,

'servidor',

1,
'["1","3"]',

1,

'Código General del Proceso',
'4 días',

'Código General del Proceso',

'caracterizada',
NOW(),
NOW()
);