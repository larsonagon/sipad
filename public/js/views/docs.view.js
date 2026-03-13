import { registerRoute } from '../router.js';

registerRoute('/documentos', () => {
  document.getElementById('app').innerHTML = `
    <h2>Documentos</h2>
    <p>Listado de documentos soporte.</p>
  `;
});
