document.addEventListener('DOMContentLoaded', async () => {

  const token = localStorage.getItem('token');
  const formularioId = new URLSearchParams(window.location.search)
    .get('formularioId');

  if (!token || !formularioId) {
    window.location.href = '/';
    return;
  }

  const container = document.getElementById('tablaPropuestas');

  try {

    const resp = await fetch(
      `/api/segtec/propuestas/${formularioId}`,
      {
        headers: { 'Authorization': `Bearer ${token}` }
      }
    );

    if (!resp.ok) {
      throw new Error('Error HTTP');
    }

    const json = await resp.json();

    if (!json.ok) {
      throw new Error(json.error || 'Error en respuesta');
    }

    // 🔥 DEFENSIVO: asegurar array siempre
    const propuestas = Array.isArray(json.data) ? json.data : [];

    if (propuestas.length === 0) {
      container.innerHTML =
        '<p>No se generaron propuestas.</p>';
      return;
    }

    let html = `
      <table class="tabla">
        <thead>
          <tr>
            <th>Serie sugerida</th>
            <th>Confianza</th>
            <th>Tipo</th>
          </tr>
        </thead>
        <tbody>
    `;

    propuestas.forEach(p => {
      html += `
        <tr>
          <td>${p.serie_sugerida?.nombre || 'Nueva serie sugerida'}</td>
          <td>${p.confianza ?? '-'}</td>
          <td>${p.tipo ?? '-'}</td>
        </tr>
      `;
    });

    html += '</tbody></table>';

    container.innerHTML = html;

  } catch (err) {

    container.innerHTML =
      '<p>Error cargando propuestas.</p>';

    console.error('Error propuestas:', err);
  }

});
