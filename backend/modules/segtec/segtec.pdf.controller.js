import { generarPDFActividad } from './segtec.pdf.service.js'

export function SEGTECPDFController(service) {

  async function generar(req, res) {

    try {

      const id = req.params.id

      if (!id) {
        return res.status(400).json({
          ok: false,
          error: 'ID inválido'
        })
      }

      const actividad = await service.obtenerPorId(id)

      if (!actividad) {
        return res.status(404).json({
          ok: false,
          error: 'Actividad no encontrada'
        })
      }

      const pdf = await generarPDFActividad(actividad)

      res.setHeader('Content-Type', 'application/pdf')
      res.setHeader(
        'Content-Disposition',
        `inline; filename="actividad-segtec-${id}.pdf"`
      )

      res.send(pdf)

    } catch (err) {

      console.error('SEGTEC PDF error:', err)

      return res.status(500).json({
        ok: false,
        error: err.message
      })

    }

  }

  return {
    generar
  }

}