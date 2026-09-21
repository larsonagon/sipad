import ExcelJS from "exceljs"

// ======================================================
// INFORME 1 — Registro de actividades
// ======================================================
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

// ======================================================
// INFORME 2 — Resumen por dependencia
// ✅ NUEVO: antes el botón "Exportar Excel" del resumen
//    descargaba por error el listado de actividades.
// ======================================================
export async function generarResumenDependenciasExcel(data = []) {

  const workbook = new ExcelJS.Workbook()

  const sheet = workbook.addWorksheet("Resumen por dependencia")

  sheet.columns = [
    { header: "Dependencia", key: "dependencia", width: 40 },
    { header: "Total actividades", key: "total_actividades", width: 18 },
    { header: "Funcionarios activos", key: "funcionarios_activos", width: 20 },
    { header: "Borrador", key: "borrador", width: 12 },
    { header: "Identificada", key: "identificada", width: 14 },
    { header: "Caracterizada", key: "caracterizada", width: 14 },
    { header: "Analizada", key: "analizada", width: 12 },
    { header: "Completa", key: "completa", width: 12 },
    { header: "Analizadas (total)", key: "actividades_analizadas", width: 18 }
  ]

  data.forEach(r => {
    sheet.addRow({
      dependencia: r.dependencia || "Sin dependencia",
      total_actividades: Number(r.total_actividades ?? 0),
      funcionarios_activos: Number(r.funcionarios_activos ?? 0),
      borrador: Number(r.borrador ?? 0),
      identificada: Number(r.identificada ?? 0),
      caracterizada: Number(r.caracterizada ?? 0),
      analizada: Number(r.analizada ?? 0),
      completa: Number(r.completa ?? 0),
      actividades_analizadas: Number(r.actividades_analizadas ?? 0)
    })
  })

  sheet.getRow(1).font = { bold: true }

  return await workbook.xlsx.writeBuffer()
}

// ======================================================
// INFORME 4 — Funcionarios sin actividad en el ICAF
// ======================================================
export async function generarFuncionariosSinActividadExcel(data = []) {

  const workbook = new ExcelJS.Workbook()

  const sheet = workbook.addWorksheet("Funcionarios sin actividad")

  sheet.columns = [
    { header: "Funcionario", key: "funcionario", width: 34 },
    { header: "Documento", key: "documento", width: 18 },
    { header: "Cargo", key: "cargo", width: 28 },
    { header: "Dependencia (oficina/área)", key: "dependencia", width: 34 },
    { header: "Correo", key: "email", width: 30 },
    { header: "Estado", key: "estado", width: 12 }
  ]

  data.forEach(f => {
    sheet.addRow({
      funcionario: f.funcionario || "Sin nombre",
      documento: f.documento || "",
      cargo: f.cargo || "",
      dependencia: f.dependencia || "Sin dependencia",
      email: f.email || "",
      estado: Number(f.estado) === 0 ? "Inactivo" : "Activo"
    })
  })

  sheet.getRow(1).font = { bold: true }

  return await workbook.xlsx.writeBuffer()
}
