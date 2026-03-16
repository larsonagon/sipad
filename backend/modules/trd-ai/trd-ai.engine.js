/**
 * Motor heurístico TRD-AI
 *
 * Clasificación archivística determinística
 * - Series
 * - Subseries
 * - Retención
 * - Detección por tipologías
 */

// ===================================================
// MATRIZ BASE DE RETENCIÓN
// ===================================================

const MATRIZ_RETENCION = {

misional:{
alto:{gestion:5,central:10,disposicion:'CT'},
medio:{gestion:3,central:7,disposicion:'CT'},
bajo:{gestion:2,central:5,disposicion:'E'}
},

apoyo:{
alto:{gestion:3,central:5,disposicion:'E'},
medio:{gestion:2,central:3,disposicion:'E'}
},

estrategica:{
alto:{gestion:5,central:15,disposicion:'CT'},
medio:{gestion:4,central:10,disposicion:'CT'}
}

}

// ===================================================
// MAPEO DISPOSICIÓN
// ===================================================

const MAP_DISPOSICION={
CT:'conservacion_total',
E:'eliminacion',
S:'seleccion'
}

// ===================================================
// MATRIZ ARCHIVÍSTICA
// ===================================================

const MATRIZ_SERIES=[

{
serie:'ACTOS ADMINISTRATIVOS',
reglas:[
{palabras:['resolucion'],subserie:'Resoluciones'},
{palabras:['decreto'],subserie:'Decretos'},
{palabras:['circular'],subserie:'Circulares'}
]
},

{
serie:'CERTIFICADOS',
reglas:[
{palabras:['certificado','presupuestal'],subserie:'Certificados de disponibilidad presupuestal'},
{palabras:['certificado','laboral'],subserie:'Certificados laborales'},
{palabras:['certificado'],subserie:'Certificados'}
]
},

{
serie:'CONTRATOS',
reglas:[
{palabras:['contrato','prestacion'],subserie:'Contratos de prestación de servicios'},
{palabras:['contrato'],subserie:'Contratos'}
]
},

{
serie:'ACTAS',
reglas:[
{palabras:['acta','comite'],subserie:'Actas de comité'},
{palabras:['acta','reunion'],subserie:'Actas de reunión'},
{palabras:['acta'],subserie:'Actas'}
]
},

{
serie:'INFORMES',
reglas:[
{palabras:['informe','gestion'],subserie:'Informes de gestión'},
{palabras:['informe','tecnico'],subserie:'Informes técnicos'},
{palabras:['auditoria'],subserie:'Informes de auditoría'}
]
},

{
serie:'PLANES',
reglas:[
{palabras:['plan','estrategico'],subserie:'Planes estratégicos'},
{palabras:['plan','institucional'],subserie:'Planes institucionales'},
{palabras:['plan'],subserie:'Planes'}
]
},

{
serie:'CONCEPTOS',
reglas:[
{palabras:['concepto','juridico'],subserie:'Conceptos jurídicos'},
{palabras:['concepto','tecnico'],subserie:'Conceptos técnicos'},
{palabras:['concepto'],subserie:'Conceptos'}
]
},

{
serie:'PQRS',
reglas:[
{palabras:['pqrs'],subserie:'Peticiones, quejas y reclamos'},
{palabras:['peticion'],subserie:'Peticiones, quejas y reclamos'}
]
},

{
serie:'REGISTROS',
reglas:[
{palabras:['registro'],subserie:'Registros administrativos'}
]
}

]

// ===================================================
// NORMALIZACIÓN TEXTO
// ===================================================

function normalizar(texto=''){

return texto
.toLowerCase()
.normalize('NFD')
.replace(/[\u0300-\u036f]/g,'')
.replace(/[^\w\s]/g,' ')
.replace(/\s+/g,' ')
.trim()

}

// ===================================================
// TOKENIZAR TEXTO
// ===================================================

function tokenizar(texto){

return normalizar(texto)
.split(' ')
.map(t=>{
if(t.endsWith('s') && t.length>4){
return t.slice(0,-1)
}
return t
})

}

// ===================================================
// EXTRAER TIPOLOGÍAS DOCUMENTALES
// ===================================================

function extraerTipologias(texto){

if(!texto) return[]

return texto
.split('\n')
.map(x=>x.trim())
.filter(Boolean)

}

// ===================================================
// DETECTOR DE PATRONES DOCUMENTALES
// ===================================================

function detectarPatronDocumental(tipologia){

const t=normalizar(tipologia)

if(t.startsWith('certificado de')) return{serie:'CERTIFICADOS'}
if(t.startsWith('acta de')) return{serie:'ACTAS'}
if(t.startsWith('informe de')) return{serie:'INFORMES'}
if(t.startsWith('registro de')) return{serie:'REGISTROS'}
if(t.startsWith('concepto ')) return{serie:'CONCEPTOS'}

return null

}

// ===================================================
// SCORE LÉXICO
// ===================================================

function calcularScore(tokensTexto,palabras){

let coincidencias=0

for(const palabra of palabras){

const token=tokenizar(palabra)[0]

if(tokensTexto.includes(token)){
coincidencias++
}

}

return coincidencias/palabras.length

}

// ===================================================
// MOTOR DE CLASIFICACIÓN
// ===================================================

export function sugerirSerieDesdeActividad(actividad={}){

const texto=normalizar(`
${actividad.nombre||''}
${actividad.descripcion||''}
${actividad.descripcion_funcional||''}
${actividad.documentos_generados||''}
`)

const tokensTexto=tokenizar(texto)

const tipologias=extraerTipologias(
actividad.documentos_generados
)

// ---------------------------------------------------
// 1️⃣ detectar por tipologías
// ---------------------------------------------------

for(const tipologia of tipologias){

const patron=detectarPatronDocumental(tipologia)

if(patron){

return{
serie_sugerida:{nombre:patron.serie},
subserie_sugerida:{nombre:tipologia},
confianza:0.92
}

}

}

// ---------------------------------------------------
// 2️⃣ matriz archivística
// ---------------------------------------------------

let mejor=null
let mejorScore=0

for(const serie of MATRIZ_SERIES){

for(const regla of serie.reglas){

const score=calcularScore(tokensTexto,regla.palabras)

if(score>mejorScore){

mejorScore=score
mejor={
serie:serie.serie,
subserie:regla.subserie
}

}

}

}

// ---------------------------------------------------
// resultado
// ---------------------------------------------------

if(mejorScore>=0.4){

return{
serie_sugerida:{nombre:mejor.serie},
subserie_sugerida:{nombre:mejor.subserie},
confianza:Number((0.65+mejorScore*0.25).toFixed(2))
}

}

// ---------------------------------------------------
// fallback
// ---------------------------------------------------

return{
serie_sugerida:{nombre:'DOCUMENTACION GENERAL'},
subserie_sugerida:{nombre:null},
confianza:0.4
}

}

// ===================================================
// MOTOR DE RETENCIÓN BASE
// ===================================================

export function sugerirRetencionAutomatica({tipo_funcion,nivel_riesgo}){

if(!tipo_funcion||!nivel_riesgo){

return{
gestion:2,
central:3,
disposicion:'eliminacion',
justificacion:'Regla por defecto aplicada',
nivel_confianza:0.5
}

}

const tipo=tipo_funcion.toLowerCase().trim()
const riesgo=nivel_riesgo.toLowerCase().trim()

const regla=MATRIZ_RETENCION[tipo]?.[riesgo]

if(!regla){

return{
gestion:2,
central:3,
disposicion:'eliminacion',
justificacion:'Regla por defecto aplicada',
nivel_confianza:0.5
}

}

return{
gestion:regla.gestion,
central:regla.central,
disposicion:MAP_DISPOSICION[regla.disposicion],
justificacion:`Retención base (${tipo} - ${riesgo})`,
nivel_confianza:0.7
}

}

// ===================================================
// MOTOR CONTEXTUAL
// ===================================================

export function sugerirRetencionContextual(contexto={}){

const{
tipo_funcion,
nivel_riesgo,
impacto_juridico,
funcion_permanente,
requiere_conservacion,
soporte_principal,
confianza_lexica
}=contexto

let resultado=sugerirRetencionAutomatica({
tipo_funcion,
nivel_riesgo
})

let gestion=resultado.gestion
let central=resultado.central
let disposicion=resultado.disposicion
let confianza=resultado.nivel_confianza

let justificaciones=[resultado.justificacion]

if(impacto_juridico==='alto'){
gestion+=2
central+=5
confianza+=0.1
justificaciones.push('Ajuste por impacto jurídico alto')
}

if(funcion_permanente==='si'){
disposicion='seleccion'
confianza+=0.05
justificaciones.push('Actividad permanente')
}

if(requiere_conservacion==='si'){
disposicion='conservacion_total'
central+=5
confianza+=0.1
justificaciones.push('Conservación requerida')
}

if(soporte_principal==='fisico'){
gestion+=1
}

if(confianza_lexica>=0.6){
confianza+=0.1
}

confianza=Math.min(Math.max(confianza,0.4),0.95)

return{

gestion,
central,
disposicion,
justificacion:justificaciones.join('. '),
nivel_confianza:Number(confianza.toFixed(2))

}

}