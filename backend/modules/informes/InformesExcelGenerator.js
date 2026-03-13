import ExcelJS from "exceljs"

export async function generarInformeExcel(data = []) {

  const workbook = new ExcelJS.Workbook()

  const sheet = workbook.addWorksheet("Actividades")

  sheet.columns = [
    { header: "Actividad", key: "nombre", width: 40 },
    { header: "Funcionario", key: "funcionario", width: 30 },
    { header: "Dependencia", key: "dependencia", width: 30 },
    { header: "Frecuencia", key: "frecuencia", width: 20 },
    { header: "Fecha registro", key: "fecha", width: 20 }
  ]

  data.forEach(a => {

    sheet.addRow({
      nombre: a.nombre,
      funcionario: a.funcionario,
      dependencia: a.dependencia,
      frecuencia: a.frecuencia,
      fecha: a.created_at
        ? new Date(a.created_at).toLocaleDateString()
        : ""
    })

  })

  sheet.getRow(1).font = { bold: true }

  return await workbook.xlsx.writeBuffer()

}