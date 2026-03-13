// backend/modules/segtec/segtec.formulario.controller.js

export const SEGTECFormController = (service) => ({

  // =====================================================
  // CREAR NUEVO REGISTRO (VALIDADO)
  // =====================================================
  crearNuevo: async (req, res) => {
    try {

      const usuarioId = req.user?.sub;

      if (!usuarioId) {
        return res.status(401).json({
          ok: false,
          message: 'Usuario no autenticado'
        });
      }

      const {
        descripcion,
        frecuencia,
        como_inicia,
        documento_generado,
        recibe_documentos,
        abre_expediente,
        flujo_posterior
      } = req.body ?? {};

      // VALIDACIONES ESTRICTAS

      if (!descripcion || descripcion.trim() === '') {
        return res.status(400).json({
          ok: false,
          message: 'La descripción es obligatoria'
        });
      }

      if (!frecuencia || frecuencia.trim() === '') {
        return res.status(400).json({
          ok: false,
          message: 'La frecuencia es obligatoria'
        });
      }

      if (!como_inicia || como_inicia.trim() === '') {
        return res.status(400).json({
          ok: false,
          message: 'Debe indicar cómo inicia la actividad'
        });
      }

      if (!documento_generado || documento_generado.trim() === '') {
        return res.status(400).json({
          ok: false,
          message: 'Debe indicar el documento generado'
        });
      }

      const result = await service.crearNuevo(usuarioId, {
        descripcion: descripcion.trim(),
        frecuencia: frecuencia.trim(),
        como_inicia: como_inicia.trim(),
        documento_generado: documento_generado.trim(),
        recibe_documentos: !!recibe_documentos,
        abre_expediente: !!abre_expediente,
        flujo_posterior: flujo_posterior?.trim() || null
      });

      return res.status(201).json({
        ok: true,
        formularioId: result.id,
        data: result
      });

    } catch (error) {

      console.error('SEG-TEC Crear Error:', error);

      return res.status(500).json({
        ok: false,
        message: error.message
      });
    }
  },

  // =====================================================
  // LISTAR REGISTROS DEL USUARIO
  // =====================================================
  listarPorUsuario: async (req, res) => {
    try {

      const usuarioId = req.user?.sub;

      if (!usuarioId) {
        return res.status(401).json({
          ok: false,
          message: 'Usuario no autenticado'
        });
      }

      const registros = await service.listarPorUsuario(usuarioId);

      return res.status(200).json({
        ok: true,
        registros
      });

    } catch (error) {

      console.error('SEG-TEC Listar Error:', error);

      return res.status(500).json({
        ok: false,
        message: error.message
      });
    }
  },

  // =====================================================
  // AVANZAR ETAPA
  // =====================================================
  avanzarEtapa: async (req, res) => {
    try {

      const formularioId = req.params.formularioId;
      const { etapa } = req.body ?? {};
      const usuarioId = req.user?.sub;

      if (!usuarioId) {
        return res.status(401).json({
          ok: false,
          message: 'Usuario no autenticado'
        });
      }

      if (!formularioId) {
        return res.status(400).json({
          ok: false,
          message: 'formularioId es obligatorio'
        });
      }

      const result = await service.avanzarEtapa(
        formularioId,
        usuarioId,
        etapa
      );

      return res.status(200).json({
        ok: true,
        data: result
      });

    } catch (error) {

      console.error('SEG-TEC Avanzar Error:', error);

      return res.status(400).json({
        ok: false,
        message: error.message
      });
    }
  },

  // =====================================================
  // FINALIZAR REGISTRO
  // =====================================================
  finalizarRegistro: async (req, res) => {
    try {

      const formularioId = req.params.formularioId;
      const usuarioId = req.user?.sub;

      if (!usuarioId) {
        return res.status(401).json({
          ok: false,
          message: 'Usuario no autenticado'
        });
      }

      if (!formularioId) {
        return res.status(400).json({
          ok: false,
          message: 'formularioId es obligatorio'
        });
      }

      const result = await service.finalizarRegistro(
        formularioId,
        usuarioId
      );

      return res.status(200).json({
        ok: true,
        data: result
      });

    } catch (error) {

      console.error('SEG-TEC Finalizar Error:', error);

      return res.status(400).json({
        ok: false,
        message: error.message
      });
    }
  }

});