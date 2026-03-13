import PDFDocument from 'pdfkit'

export function SEGTECActividadesPDF(db) {

  async function generarPDF(req, res) {

    try {

      const id = req.params.id

      if (!id) {
        return res.status(400).json({
          ok: false,
          error: 'ID de actividad requerido'
        })
      }

      // =====================================================
      // OBTENER ACTIVIDAD
      // =====================================================

      const actividad = await db.get(`
        SELECT *
        FROM segtec_actividades
        WHERE id = ?
      `, [id])

      if (!actividad) {
        return res.status(404).json({
          ok: false,
          error: 'Actividad no encontrada'
        })
      }

      // =====================================================
      // CONFIGURACIÓN PDF
      // =====================================================

      const doc = new PDFDocument({
        size: 'A4',
        margin: 50
      })

      res.setHeader('Content-Type', 'application/pdf')
      res.setHeader(
        'Content-Disposition',
        `inline; filename=actividad-segtec-${id}.pdf`
      )

      doc.pipe(res)

      // =====================================================
      // ENCABEZADO
      // =====================================================

      doc
        .fontSize(16)
        .text('INSTRUMENTO DE CARACTERIZACIÓN DE ACTIVIDADES FUNCIONALES', {
          align: 'center'
        })

      doc.moveDown()

      doc
        .fontSize(10)
        .text(`Actividad ID: ${actividad.id}`)
        .text(`Fecha de creación: ${actividad.created_at || '-'}`)
        .text(`Estado: ${actividad.estado_general || '-'}`)

      doc.moveDown(2)

      // =====================================================
      // BLOQUE 1
      // IDENTIFICACIÓN
      // =====================================================

      doc
        .fontSize(13)
        .text('1. IDENTIFICACIÓN DE LA ACTIVIDAD', {
          underline: true
        })

      doc.moveDown()

      doc
        .fontSize(11)
        .text(`Nombre de la actividad:`)
        .fontSize(10)
        .text(actividad.nombre || '-')

      doc.moveDown()

      doc
        .fontSize(11)
        .text(`Frecuencia:`)
        .fontSize(10)
        .text(actividad.frecuencia || '-')

      doc.moveDown()

      doc
        .fontSize(11)
        .text(`Tipo de función:`)
        .fontSize(10)
        .text(actividad.tipo_funcion || '-')

      doc.moveDown()

      doc
        .fontSize(11)
        .text(`Nivel decisorio:`)
        .fontSize(10)
        .text(actividad.nivel_decisorio || '-')

      doc.moveDown(2)

      // =====================================================
      // BLOQUE 2
      // CARACTERIZACIÓN FUNCIONAL
      // =====================================================

      doc
        .fontSize(13)
        .text('2. CARACTERIZACIÓN FUNCIONAL', {
          underline: true
        })

      doc.moveDown()

      doc
        .fontSize(11)
        .text('Entradas:')

      doc
        .fontSize(10)
        .text(actividad.entradas || '-')

      doc.moveDown()

      doc
        .fontSize(11)
        .text('Procesos:')

      doc
        .fontSize(10)
        .text(actividad.procesos || '-')

      doc.moveDown()

      doc
        .fontSize(11)
        .text('Resultados:')

      doc
        .fontSize(10)
        .text(actividad.resultados || '-')

      doc.moveDown(2)

      // =====================================================
      // BLOQUE 3
      // ANÁLISIS ARCHIVÍSTICO
      // =====================================================

      doc
        .fontSize(13)
        .text('3. ANÁLISIS ARCHIVÍSTICO', {
          underline: true
        })

      doc.moveDown()

      doc
        .fontSize(11)
        .text(`Serie documental:`)
        .fontSize(10)
        .text(actividad.serie_propuesta || '-')

      doc.moveDown()

      doc
        .fontSize(11)
        .text(`Subserie documental:`)
        .fontSize(10)
        .text(actividad.subserie_propuesta || '-')

      doc.moveDown()

      doc
        .fontSize(11)
        .text(`Retención en gestión:`)
        .fontSize(10)
        .text(
          actividad.retencion_gestion
            ? `${actividad.retencion_gestion} años`
            : '-'
        )

      doc.moveDown()

      doc
        .fontSize(11)
        .text(`Retención en central:`)
        .fontSize(10)
        .text(
          actividad.retencion_central
            ? `${actividad.retencion_central} años`
            : '-'
        )

      doc.moveDown()

      doc
        .fontSize(11)
        .text(`Disposición final:`)
        .fontSize(10)
        .text(actividad.disposicion_final || '-')

      doc.moveDown(2)

      // =====================================================
      // BLOQUE 4
      // JUSTIFICACIÓN
      // =====================================================

      doc
        .fontSize(13)
        .text('4. JUSTIFICACIÓN TÉCNICA', {
          underline: true
        })

      doc.moveDown()

      doc
        .fontSize(10)
        .text(actividad.justificacion || '-')

      doc.moveDown(4)

      // =====================================================
      // FIRMAS
      // =====================================================

      doc
        .fontSize(11)
        .text('________________________________________')

      doc
        .fontSize(10)
        .text('Responsable de la caracterización técnica')

      doc.moveDown()

      doc
        .fontSize(10)
        .text(`Documento generado automáticamente por SIPAD – SEG-TEC`)

      // =====================================================

      doc.end()

    } catch (error) {

      console.error('Error generando PDF SEGTEC:', error)

      return res.status(500).json({
        ok: false,
        error: 'Error generando PDF'
      })
    }
  }

  return {
    generarPDF
  }
}