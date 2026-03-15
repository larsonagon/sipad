import puppeteer from 'puppeteer-core'
import chromium from '@sparticuz/chromium'

export async function generarPDFActividad(actividad) {

  if (!actividad) {
    throw new Error('Actividad no encontrada')
  }

  const html = construirHTML(actividad)

  const browser = await puppeteer.launch({
    args: chromium.args,
    executablePath: await chromium.executablePath(),
    headless: chromium.headless,
    defaultViewport: chromium.defaultViewport
  })

  const page = await browser.newPage()

  await page.setContent(html, {
    waitUntil: 'domcontentloaded'
  })

  const pdf = await page.pdf({
    format: 'A4',
    printBackground: true,
    margin: {
      top: '40px',
      bottom: '60px',
      left: '40px',
      right: '40px'
    }
  })

  await browser.close()

  return pdf
}

////////////////////////////////////////////////////////
// UTILIDADES
////////////////////////////////////////////////////////

function texto(valor) {
  if (valor === null || valor === undefined) return ''
  return escaparHTML(valor.toString())
}

function capitalizar(valor) {

  if (!valor) return ''

  const limpio = valor
    .toString()
    .replaceAll('_', ' ')
    .trim()

  return limpio.charAt(0).toUpperCase() + limpio.slice(1)
}

function siNo(valor) {

  if (valor === null || valor === undefined) return ''

  const v = valor.toString().toLowerCase().trim()

  if (
    v === 'true' ||
    v === '1' ||
    v === 'si' ||
    v === 'sí'
  ) return 'Sí'

  if (
    v === 'false' ||
    v === '0' ||
    v === 'no'
  ) return 'No'

  return ''
}

function etiqueta(valor) {

  if (!valor) return ''

  const mapa = {

    menos_10: 'Menos de 10',
    entre_10_50: 'Entre 10 y 50',
    mas_50: 'Más de 50',

    misma_dependencia: 'La misma dependencia',
    archivo_central: 'Archivo central',
    archivo_historico: 'Archivo histórico',
    otra_dependencia: 'Otra dependencia',
    digital_unico: 'Digital únicamente',

    fisico: 'Físico',
    digital: 'Digital',
    mixto: 'Mixto',
    ambos: 'Ambos',

    carpeta_oficina: 'Carpeta física en oficina',
    archivador: 'Archivador',
    computador_personal: 'Computador personal',
    carpeta_red: 'Carpeta compartida',
    servidor: 'Servidor institucional'
  }

  return mapa[valor] || capitalizar(valor)
}

function escaparHTML(textoValor) {

  if (!textoValor) return ''

  return textoValor
    .toString()
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
}

function formatearFecha(fecha) {

  if (!fecha) {
    return new Date().toLocaleDateString('es-CO')
  }

  return new Date(fecha).toLocaleDateString('es-CO')
}

////////////////////////////////////////////////////////
// HTML
////////////////////////////////////////////////////////

function construirHTML(a) {

  const entidad =
    texto(a.entidad) ||
    'Alcaldía de Aguachica'

  const dependencia =
    texto(a.dependencia) ||
    'No registrada'

  const funcionario =
    texto(a.funcionario) ||
    'No registrado'

  const cargo =
    texto(a.cargo || a.cargo_ejecutor)

  const fecha =
    formatearFecha(a.created_at)

  //////////////////////////////////////////////////////
  // Dependencias involucradas
  //////////////////////////////////////////////////////

  let dependenciasInvolucradas = texto(a.dependencias_relacionadas)

  if (!dependenciasInvolucradas) {

    const requiere = siNo(a.requiere_otras_dependencias)

    if (requiere === 'No') {
      dependenciasInvolucradas = 'No aplica'
    } else if (requiere === 'Sí') {
      dependenciasInvolucradas = 'No especificadas'
    }
  }

  //////////////////////////////////////////////////////
  // Compatibilidad modelo
  //////////////////////////////////////////////////////

  const volumen =
    a.volumen_categoria ||
    a.volumen_documental

  const volumenPersonalizado =
    a.volumen_anual_personalizado

  const custodia =
    a.custodia_tipo ||
    a.responsable_custodia

  const localizacion =
    a.localizacion_tipo ||
    a.localizacion_documentos

  //////////////////////////////////////////////////////
  // PLAZOS
  //////////////////////////////////////////////////////

  const tienePlazo = siNo(a.tiene_plazo)

  const plazoLegal =
    a.tiene_plazo == 1
      ? texto(a.plazo_legal)
      : 'No aplica'

  const tiempoPromedio =
    a.tiene_plazo == 1
      ? texto(a.tiempo_ejecucion)
      : 'No aplica'

  //////////////////////////////////////////////////////
  // HTML
  //////////////////////////////////////////////////////

  return `
<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">

<style>

body{
font-family: Arial, Helvetica, sans-serif;
font-size:12px;
color:#000;
line-height:1.4;
}

h1{
text-align:center;
font-size:18px;
margin-bottom:15px;
}

h2{
font-size:14px;
margin-top:25px;
border-bottom:1px solid #ccc;
padding-bottom:4px;
}

.campo{
margin-bottom:10px;
}

.label{
font-weight:bold;
margin-bottom:3px;
}

.box{
border:1px solid #ccc;
padding:8px;
min-height:18px;
}

.grid{
display:grid;
grid-template-columns:1fr 1fr;
gap:10px;
}

.firma{
margin-top:60px;
text-align:center;
}

.linea{
width:300px;
border-top:2px solid #000;
margin:40px auto 10px auto;
}

.firma-nombre{
font-weight:bold;
}

.firma-cargo{
font-size:11px;
color:#444;
}

.footer{
margin-top:40px;
border-top:1px solid #ccc;
padding-top:8px;
font-size:10px;
color:#666;
display:flex;
justify-content:space-between;
}

</style>

</head>

<body>

<h1>
INSTRUMENTO DE CARACTERIZACIÓN DE ACTIVIDADES FUNCIONALES
</h1>

<div class="grid">

<div class="campo">
<div class="label">Entidad</div>
<div class="box">${entidad}</div>
</div>

<div class="campo">
<div class="label">Dependencia</div>
<div class="box">${dependencia}</div>
</div>

<div class="campo">
<div class="label">Funcionario</div>
<div class="box">${funcionario}</div>
</div>

<div class="campo">
<div class="label">Fecha</div>
<div class="box">${fecha}</div>
</div>

</div>

<h2>BLOQUE 1 — Identificación Básica de la Actividad</h2>

<div class="campo">
<div class="label">1. Nombre de la actividad</div>
<div class="box">${texto(a.nombre)}</div>
</div>

<div class="campo">
<div class="label">2. Cargo responsable</div>
<div class="box">${cargo}</div>
</div>

<div class="campo">
<div class="label">3. Clasificación funcional</div>
<div class="box">${capitalizar(a.tipo_funcion)}</div>
</div>

<div class="campo">
<div class="label">4. Periodicidad</div>
<div class="box">${capitalizar(a.frecuencia)}</div>
</div>

<div class="campo">
<div class="label">5. Descripción detallada</div>
<div class="box">${texto(a.descripcion_funcional)}</div>
</div>

<h2>BLOQUE 2 — Producción Documental Asociada</h2>

<div class="campo">
<div class="label">6. ¿Genera documentos?</div>
<div class="box">${siNo(a.genera_documentos)}</div>
</div>

<div class="campo">
<div class="label">7. Documentos generados</div>
<div class="box">${texto(a.documentos_generados)}</div>
</div>

<div class="campo">
<div class="label">8. Formato de producción</div>
<div class="box">${etiqueta(a.formato_produccion)}</div>
</div>

<div class="campo">
<div class="label">9. Documentos requeridos para iniciar la actividad</div>
<div class="box">${texto(a.recepcion_externa)}</div>
</div>

<div class="campo">
<div class="label">10. Volumen documental</div>
<div class="box">${volumenPersonalizado || etiqueta(volumen)}</div>
</div>

<div class="campo">
<div class="label">11. Responsabilidad de custodia</div>
<div class="box">${etiqueta(custodia)}</div>
</div>

<div class="campo">
<div class="label">11a. Cargo responsable de custodia</div>
<div class="box">${texto(a.cargo_custodia)}</div>
</div>

<div class="campo">
<div class="label">12. Localización de documentos</div>
<div class="box">${etiqueta(localizacion)}</div>
</div>

<h2>BLOQUE 3 — Gestión y Trámite</h2>

<div class="campo">
<div class="label">13. ¿Tiene procedimiento formal?</div>
<div class="box">${siNo(a.tiene_pasos_formales)}</div>
</div>

<div class="campo">
<div class="label">14. Dependencias involucradas</div>
<div class="box">${dependenciasInvolucradas}</div>
</div>

<div class="campo">
<div class="label">15. ¿Tiene plazo para cumplirse?</div>
<div class="box">${tienePlazo}</div>
</div>

<div class="campo">
<div class="label">15a. Plazo legal establecido</div>
<div class="box">${plazoLegal}</div>
</div>

<div class="campo">
<div class="label">15b. Tiempo promedio real de ejecución</div>
<div class="box">${tiempoPromedio}</div>
</div>

<div class="campo">
<div class="label">16. ¿Genera expediente?</div>
<div class="box">${siNo(a.genera_expediente_propio)}</div>
</div>

<div class="campo">
<div class="label">17. Norma que exige la actividad</div>
<div class="box">${texto(a.norma_aplicable)}</div>
</div>

<div class="firma">
<div class="linea"></div>
<div class="firma-nombre">${funcionario}</div>
<div class="firma-cargo">${cargo}</div>
</div>

<div class="footer">
<div>Sistema inteligente para la planeación archivística documental – SIPAD</div>
<div>Instrumento de caracterización de actividades funcionales</div>
</div>

</body>
</html>
`
}