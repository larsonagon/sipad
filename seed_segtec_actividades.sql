-- ==========================================
-- LIMPIAR TABLA SIN BORRAR ESTRUCTURA
-- ==========================================

TRUNCATE TABLE segtec_actividades CASCADE;

-- ==========================================
-- ACTIVIDAD 1
-- INFORMES DE GESTIÓN
-- ==========================================

INSERT INTO segtec_actividades (
id,
dependencia_id,
nombre,
cargo_ejecutor,
tipo_funcion,
frecuencia,
descripcion_funcional,
impacto_juridico_directo,
impacto_fiscal_contable,
genera_expediente_propio,
actividad_permanente,
genera_documentos,
formato_produccion,
volumen_documental,
responsable_custodia,
norma_aplicable,
dependencias_relacionadas,
estado_general,
created_at,
updated_at,
requiere_otras_dependencias,
tiene_pasos_formales,
usuario_id,
proceso_id,
documentos_generados,
localizacion_documentos,
plazo_legal,
tiempo_ejecucion,
recepcion_externa,
cargo_custodia,
dependencia_custodia,
localizacion_otro,
volumen_anual_personalizado
)
VALUES (
'ACT001',
1,
'Elaboración de informes de gestión institucional',
'Profesional administrativo',
'misional',
'trimestral',
'Consolidar información institucional para elaborar informes de gestión.',
1,
1,
1,
1,
'si',
'digital',
'medio',
'Archivo de gestión',
'Ley 594 de 2000',
'Oficina de planeación',
'caracterizada',
NOW(),
NOW(),
0,
1,
1,
'PROC001',
'Informes de gestión institucional',
'Archivo de gestión',
'No aplica',
'15 días',
'no',
1,
1,
NULL,
'medio'
);

-- ==========================================
-- ACTIVIDAD 2
-- INFORMES TÉCNICOS
-- ==========================================

INSERT INTO segtec_actividades (
id,dependencia_id,nombre,cargo_ejecutor,tipo_funcion,frecuencia,
descripcion_funcional,impacto_juridico_directo,impacto_fiscal_contable,
genera_expediente_propio,actividad_permanente,genera_documentos,
formato_produccion,volumen_documental,responsable_custodia,
norma_aplicable,dependencias_relacionadas,estado_general,
created_at,updated_at,requiere_otras_dependencias,tiene_pasos_formales,
usuario_id,proceso_id,documentos_generados,localizacion_documentos,
plazo_legal,tiempo_ejecucion,recepcion_externa,cargo_custodia,
dependencia_custodia,localizacion_otro,volumen_anual_personalizado
)
VALUES (
'ACT002',
1,
'Elaboración de informes técnicos especializados',
'Profesional técnico',
'misional',
'mensual',
'Elaborar informes técnicos derivados del análisis de proyectos.',
1,
1,
1,
1,
'si',
'digital',
'alto',
'Archivo de gestión',
'Ley 594 de 2000',
'Oficina técnica',
'caracterizada',
NOW(),
NOW(),
1,
1,
1,
'PROC001',
'Informes técnicos
Informes de diagnóstico
Informes de evaluación',
'Archivo de gestión',
'No aplica',
'10 días',
'no',
1,
1,
NULL,
'alto'
);

-- ==========================================
-- ACTIVIDAD 3
-- PETICIONES CIUDADANAS
-- ==========================================

INSERT INTO segtec_actividades (
id,dependencia_id,nombre,cargo_ejecutor,tipo_funcion,frecuencia,
descripcion_funcional,impacto_juridico_directo,impacto_fiscal_contable,
genera_expediente_propio,actividad_permanente,genera_documentos,
formato_produccion,volumen_documental,responsable_custodia,
norma_aplicable,dependencias_relacionadas,estado_general,
created_at,updated_at,requiere_otras_dependencias,tiene_pasos_formales,
usuario_id,proceso_id,documentos_generados,localizacion_documentos,
plazo_legal,tiempo_ejecucion,recepcion_externa,cargo_custodia,
dependencia_custodia,localizacion_otro,volumen_anual_personalizado
)
VALUES (
'ACT003',
1,
'Atención de peticiones ciudadanas',
'Profesional jurídico',
'misional',
'permanente',
'Recepción y respuesta a derechos de petición.',
1,
0,
1,
1,
'si',
'digital',
'alto',
'Archivo de gestión',
'Ley 1755 de 2015',
'Oficina jurídica',
'caracterizada',
NOW(),
NOW(),
1,
1,
1,
'PROC002',
'Derechos de petición
Respuestas a derechos de petición
Registros de radicación',
'Archivo de gestión',
'15 días',
'variable',
'si',
1,
1,
NULL,
'alto'
);

-- ==========================================
-- ACTIVIDAD 4
-- CONTRATOS
-- ==========================================

INSERT INTO segtec_actividades (
id,dependencia_id,nombre,cargo_ejecutor,tipo_funcion,frecuencia,
descripcion_funcional,impacto_juridico_directo,impacto_fiscal_contable,
genera_expediente_propio,actividad_permanente,genera_documentos,
formato_produccion,volumen_documental,responsable_custodia,
norma_aplicable,dependencias_relacionadas,estado_general,
created_at,updated_at,requiere_otras_dependencias,tiene_pasos_formales,
usuario_id,proceso_id,documentos_generados,localizacion_documentos,
plazo_legal,tiempo_ejecucion,recepcion_externa,cargo_custodia,
dependencia_custodia,localizacion_otro,volumen_anual_personalizado
)
VALUES (
'ACT004',
1,
'Elaboración de contratos institucionales',
'Profesional jurídico',
'apoyo',
'eventual',
'Elaborar contratos para ejecución de proyectos.',
1,
1,
1,
0,
'si',
'digital',
'alto',
'Archivo central',
'Ley 80 de 1993',
'Oficina jurídica',
'caracterizada',
NOW(),
NOW(),
1,
1,
1,
'PROC003',
'Contratos
Minutas contractuales
Actas de inicio',
'Archivo central',
'No aplica',
'30 días',
'no',
1,
1,
NULL,
'alto'
);

-- ==========================================
-- ACTIVIDAD 5
-- RESOLUCIONES
-- ==========================================

INSERT INTO segtec_actividades (
id,dependencia_id,nombre,cargo_ejecutor,tipo_funcion,frecuencia,
descripcion_funcional,impacto_juridico_directo,impacto_fiscal_contable,
genera_expediente_propio,actividad_permanente,genera_documentos,
formato_produccion,volumen_documental,responsable_custodia,
norma_aplicable,dependencias_relacionadas,estado_general,
created_at,updated_at,requiere_otras_dependencias,tiene_pasos_formales,
usuario_id,proceso_id,documentos_generados,localizacion_documentos,
plazo_legal,tiempo_ejecucion,recepcion_externa,cargo_custodia,
dependencia_custodia,localizacion_otro,volumen_anual_personalizado
)
VALUES (
'ACT005',
1,
'Expedición de resoluciones administrativas',
'Director administrativo',
'estrategica',
'eventual',
'Emitir resoluciones para formalizar decisiones institucionales.',
1,
0,
1,
0,
'si',
'digital',
'medio',
'Archivo central',
'Ley 1437 de 2011',
'Dirección general',
'caracterizada',
NOW(),
NOW(),
1,
1,
1,
'PROC004',
'Resoluciones administrativas
Actos administrativos',
'Archivo central',
'No aplica',
'5 días',
'no',
1,
1,
NULL,
'medio'
);