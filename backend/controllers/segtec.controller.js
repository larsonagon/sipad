exports.syncSegTec = (req, res) => {
  const body = req.body;

  if (!body || !Array.isArray(body.registros)) {
    return res.status(400).json({
      ok: false,
      message: 'Payload inválido. Se esperaba { registros: [] }'
    });
  }

  return res.json({
    ok: true,
    modulo: 'SEG-TEC',
    recibidos: body.registros.length,
    aceptados: body.registros.map(r => ({
      localId: r.localId || null,
      estadoSync: 'SINCRONIZADO'
    }))
  });
};
