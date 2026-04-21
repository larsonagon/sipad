import { randomUUID } from 'crypto'
import { sugerirSerieDesdeActividad } from './trd-ai.engine.js'

console.log('🔥 TRD-AI REPOSITORY CARGADO (MOTOR V2 + CATÁLOGO BD)')

// =====================================================
// CONFIGURACIÓN LÉXICA
// =====================================================

const STOPWORDS=[
'de','la','el','los','las','y','a','en','del','para'
]

// =====================================================
// UTILIDADES
// =====================================================

function singularizar(palabra){

if(palabra.endsWith('es') && palabra.length>4)
return palabra.slice(0,-2)

if(palabra.endsWith('s') && palabra.length>3)
return palabra.slice(0,-1)

return palabra

}

function normalizarTexto(texto){

return texto
.toLowerCase()
.normalize('NFD')
.replace(/[\u0300-\u036f]/g,'')
.split(/\s+/)
.map(p=>singularizar(p))
.filter(p=>p.length>2 && !STOPWORDS.includes(p))

}

// =====================================================
// MAPA ARCHIVÍSTICO
// =====================================================

const MAPA_SUBSERIE_SERIE={

'Informes de auditoría':'INFORMES',
'Informes de gestión':'INFORMES',
'Informes técnicos':'INFORMES',

'Resoluciones':'ACTOS ADMINISTRATIVOS',
'Decretos':'ACTOS ADMINISTRATIVOS',
'Circulares':'ACTOS ADMINISTRATIVOS',
'Actos administrativos':'ACTOS ADMINISTRATIVOS',

'Contratos':'CONTRATOS',
'Contratos de prestación de servicios':'CONTRATOS',

'Certificados':'CERTIFICADOS',
'Certificados laborales':'CERTIFICADOS',
'Certificados de disponibilidad presupuestal':'CERTIFICADOS',

'Actas':'ACTAS',
'Actas de comité':'ACTAS',
'Actas de reunión':'ACTAS',

'Conceptos':'CONCEPTOS',

'Peticiones, quejas y reclamos':'PQRS',

'Registros administrativos':'REGISTROS',

'Historias laborales':'TALENTO HUMANO',

'Planes institucionales':'PLANEACION',
'Planes estratégicos':'PLANEACION'

}

function obtenerSerieDesdeSubserie(subserie){

if(!subserie) return null

return MAPA_SUBSERIE_SERIE[subserie]||null

}

// =====================================================
// DETECTOR DE PATRONES DOCUMENTALES
// =====================================================

function detectarPatronDocumental(tipologia){

if(!tipologia) return null

const t=tipologia.toLowerCase()

if(t.startsWith('certificado de'))
return{serie:'CERTIFICADOS',subserie:tipologia}

if(t.startsWith('acta de'))
return{serie:'ACTAS',subserie:tipologia}

if(t.startsWith('informe de'))
return{serie:'INFORMES',subserie:tipologia}

if(t.startsWith('concepto'))
return{serie:'CONCEPTOS',subserie:tipologia}

if(t.startsWith('registro de'))
return{serie:'REGISTROS',subserie:tipologia}

return null

}

// =====================================================
// DETECTOR DE SUBSERIES
// =====================================================

function detectarSubserie(actividad){

const texto=`
${actividad.nombre||''}
${actividad.descripcion_funcional||''}
${actividad.documentos_generados||''}
`

const palabras=normalizarTexto(texto)

// INFORMES

if(palabras.includes('auditoria'))
return'Informes de auditoría'

if(palabras.includes('gestion') && palabras.includes('informe'))
return'Informes de gestión'

if(palabras.includes('tecnico') && palabras.includes('informe'))
return'Informes técnicos'

// ACTOS ADMINISTRATIVOS

if(palabras.includes('resolucion'))
return'Resoluciones'

if(palabras.includes('decreto'))
return'Decretos'

if(palabras.includes('circular'))
return'Circulares'

if(palabras.includes('acto'))
return'Actos administrativos'

// CONTRATOS

if(palabras.includes('contrato') && palabras.includes('servicio'))
return'Contratos de prestación de servicios'

if(palabras.includes('contrato'))
return'Contratos'

// CERTIFICADOS

if(palabras.includes('certificado') && palabras.includes('presupuestal'))
return'Certificados de disponibilidad presupuestal'

if(palabras.includes('certificado') && palabras.includes('laboral'))
return'Certificados laborales'

if(palabras.includes('certificado'))
return'Certificados'

// ACTAS

if(palabras.includes('acta'))
return'Actas'

// CONCEPTOS

if(palabras.includes('concepto'))
return'Conceptos'

// PQRS

if(palabras.includes('pqrs') || palabras.includes('peticion'))
return'Peticiones, quejas y reclamos'

// REGISTROS

if(palabras.includes('registro'))
return'Registros administrativos'

// TALENTO HUMANO

if(palabras.includes('historia') && palabras.includes('laboral'))
return'Historias laborales'

// PLANES

if(palabras.includes('plan') && palabras.includes('estrategico'))
return'Planes estratégicos'

if(palabras.includes('plan') && palabras.includes('institucional'))
return'Planes institucionales'

return null

}

// =====================================================
// EXTRAER TIPOLOGÍAS
// =====================================================

function extraerTipologias(documentos){

if(!documentos) return[]

return documentos
.split('\n')
.map(x=>x.trim())
.filter(Boolean)

}

// =====================================================
// DETECCIÓN AUTO-EVOLUTIVA
// =====================================================

function detectarSerieEmergente(tipologias){

if(!tipologias.length) return null

const patrones={}

for(const t of tipologias){

const palabras=t.toLowerCase().split(' ')

if(palabras.length<2) continue

const raiz=palabras[0]

if(!patrones[raiz]) patrones[raiz]=0

patrones[raiz]++

}

const candidato=Object.entries(patrones)
.sort((a,b)=>b[1]-a[1])[0]

if(!candidato) return null

const raiz=candidato[0]

if(raiz==='certificado') return{serie:'CERTIFICADOS'}
if(raiz==='acta') return{serie:'ACTAS'}
if(raiz==='informe') return{serie:'INFORMES'}
if(raiz==='concepto') return{serie:'CONCEPTOS'}
if(raiz==='registro') return{serie:'REGISTROS'}

return null

}

// =====================================================
// REPOSITORY
// =====================================================

export const TRDAIRepository=(db)=>{

if(!db)
throw new Error('DB no proporcionada')

// =====================================================
// CREAR PROPUESTA
// =====================================================

async function createSeriePropuesta(data){

const id=randomUUID()

await db.run(`
INSERT INTO trd_series_propuestas(
id,
actividad_id,
nombre_serie,
nombre_subserie,
tipologia_documental,
justificacion,
confianza,
estado,
creado_en
)
VALUES(?,?,?,?,?,?,?,?,?)
`,[
id,
data.actividad_id,
data.nombre_serie,
data.nombre_subserie,
data.tipologia_documental||null,
data.justificacion||null,
data.nivel_confianza||null,
'propuesta',
new Date().toISOString()
])

return id

}

// =====================================================
// API REPOSITORY
// =====================================================

return{

async countAll(){

const r=await db.get(`SELECT COUNT(*) as total FROM trd_series_propuestas`)
return r.total

},

async countByEstado(){

return await db.all(`
SELECT estado,COUNT(*) cantidad
FROM trd_series_propuestas
GROUP BY estado
`)

},

async getUltimasAprobadas(){

return await db.all(`
SELECT id,nombre_serie,fecha_aprobacion
FROM trd_series_propuestas
WHERE estado='aprobada'
ORDER BY fecha_aprobacion DESC
LIMIT 5
`)

},

async getAllSeriesPropuestas(){

return await db.all(`
SELECT
tsp.*,
sa.nombre actividad_nombre
FROM trd_series_propuestas tsp
LEFT JOIN segtec_actividades sa
ON tsp.actividad_id=sa.id
ORDER BY tsp.creado_en DESC
`)

},

async getById(id){

if(!id) return null

return await db.get(`
SELECT *
FROM trd_series_propuestas
WHERE id=?
`,[id])

},

async obtenerReglaRetencionPorPropuesta(propuestaId){

if(!propuestaId) return null

return await db.get(`
SELECT *
FROM trd_reglas_retencion
WHERE propuesta_id=?
`,[propuestaId])

},

async guardarReglaRetencion(data){

const id=randomUUID()

await db.run(`
INSERT INTO trd_reglas_retencion(
id,
propuesta_id,
retencion_gestion,
retencion_central,
disposicion_final,
creado_en
)
VALUES(?,?,?,?,?,?)
`,[
id,
data.propuesta_id,
data.retencion_gestion,
data.retencion_central,
data.disposicion_final,
new Date().toISOString()
])

return id

},

createSeriePropuesta,

async cambiarEstado(id,nuevoEstado,usuario,obs){

const propuesta=await db.get(`
SELECT id FROM trd_series_propuestas WHERE id=?
`,[id])

if(!propuesta)
throw new Error('Propuesta no encontrada')

await db.run(`
UPDATE trd_series_propuestas
SET estado=?,
aprobado_por=?,
fecha_aprobacion=?,
observaciones_revision=?
WHERE id=?
`,[
nuevoEstado,
usuario||null,
new Date().toISOString(),
obs||null,
id
])

return true

},

// =====================================================
// MOTOR TRD-AI V2
// Capas 1-3: lógica interna del repository (original)
// Capa 4: catálogo real BD vía engine
// =====================================================

async ejecutarMotorInteligente(){

const actividades=await db.all(`
SELECT id,nombre,descripcion_funcional,documentos_generados
FROM segtec_actividades
WHERE estado_general IN ('analizada','caracterizada')
`)

if(!actividades.length) return[]

const resultados=[]

for(const actividad of actividades){

const existente=await db.get(`
SELECT id
FROM trd_series_propuestas
WHERE actividad_id=?
`,[actividad.id])

if(existente) continue

const tipologias=extraerTipologias(actividad.documentos_generados)

let serie=null
let subserie=null
let confianza=0.7
let origen='desconocido'

// 1️⃣ patrón documental

for(const tipologia of tipologias){

const patron=detectarPatronDocumental(tipologia)

if(patron){

serie=patron.serie
subserie=patron.subserie
confianza=0.92
origen='patron'
break

}

}

// 2️⃣ heurística textual

if(!serie){

const sub=detectarSubserie(actividad)

if(sub){

subserie=sub
serie=obtenerSerieDesdeSubserie(sub)
confianza=0.85
origen='heuristica'

}

}

// 3️⃣ motor auto-evolutivo

if(!serie){

const emergente=detectarSerieEmergente(tipologias)

if(emergente){

serie=emergente.serie
subserie=tipologias[0]||null
confianza=0.75
origen='autoevolutivo'

}

}

// 4️⃣ catálogo real BD (engine V2)

if(!serie){

const clasificacion=await sugerirSerieDesdeActividad(actividad, null, db)

if(clasificacion && clasificacion.serie_sugerida?.nombre &&
   clasificacion.serie_sugerida.nombre !== 'DOCUMENTACION GENERAL'){

serie=clasificacion.serie_sugerida.nombre
subserie=clasificacion.subserie_sugerida?.nombre||null
confianza=clasificacion.confianza??0.65
origen=clasificacion.origen||'catalogo'

}

}

if(!serie) continue

const tipologiaPrincipal=tipologias.length?tipologias[0]:null

const propuestaID=await createSeriePropuesta({

actividad_id:actividad.id,
nombre_serie:serie,
nombre_subserie:subserie,
tipologia_documental:tipologiaPrincipal,
justificacion:`Propuesta generada automáticamente — origen: ${origen}`,
nivel_confianza:confianza

})

resultados.push({

actividad:actividad.id,
serie,
subserie,
tipologia:tipologiaPrincipal,
confianza,
origen,
propuesta:propuestaID

})

}

return resultados

}

}

}