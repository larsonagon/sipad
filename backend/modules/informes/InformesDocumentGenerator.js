import {
  Document,
  Packer,
  Paragraph,
  HeadingLevel,
  TextRun
} from "docx"

export async function generarInformeWord(data = []) {

  const children = []

  // =============================
  // TÍTULO
  // =============================

  children.push(
    new Paragraph({
      text: "INFORME DE REGISTRO DE ACTIVIDADES FUNCIONALES",
      heading: HeadingLevel.TITLE
    })
  )

  children.push(
    new Paragraph({
      children: [
        new TextRun({
          text: `Fecha de generación: ${new Date().toLocaleDateString()}`,
          italics: true
        })
      ]
    })
  )

  children.push(new Paragraph(" "))
  children.push(new Paragraph(" "))

  // =============================
  // ACTIVIDADES
  // =============================

  data.forEach((actividad, index) => {

    const numero = index + 1

    children.push(
      new Paragraph({
        text: `Actividad ${numero}`,
        heading: HeadingLevel.HEADING_1
      })
    )

    children.push(
      new Paragraph({
        children: [
          new TextRun({ text: "Nombre de la actividad: ", bold: true }),
          new TextRun(actividad.nombre || "No registrado")
        ]
      })
    )

    children.push(
      new Paragraph({
        children: [
          new TextRun({ text: "Funcionario: ", bold: true }),
          new TextRun(actividad.funcionario || "No registrado")
        ]
      })
    )

    children.push(
      new Paragraph({
        children: [
          new TextRun({ text: "Dependencia: ", bold: true }),
          new TextRun(actividad.dependencia || "No registrada")
        ]
      })
    )

    if (actividad.proceso) {
      children.push(
        new Paragraph({
          children: [
            new TextRun({ text: "Proceso: ", bold: true }),
            new TextRun(actividad.proceso)
          ]
        })
      )
    }

    children.push(
      new Paragraph({
        children: [
          new TextRun({ text: "Frecuencia: ", bold: true }),
          new TextRun(actividad.frecuencia || "No definida")
        ]
      })
    )

    children.push(
      new Paragraph({
        children: [
          new TextRun({ text: "Descripción funcional: ", bold: true }),
          new TextRun(actividad.descripcion_funcional || "No registrada")
        ]
      })
    )

    if (actividad.created_at) {
      children.push(
        new Paragraph({
          children: [
            new TextRun({ text: "Fecha de registro: ", bold: true }),
            new TextRun(new Date(actividad.created_at).toLocaleDateString())
          ]
        })
      )
    }

    children.push(new Paragraph(" "))
    children.push(new Paragraph(" "))
  })

  // =============================
  // DOCUMENTO
  // =============================

  const doc = new Document({
    sections: [
      {
        properties: {},
        children
      }
    ]
  })

  return await Packer.toBuffer(doc)
}