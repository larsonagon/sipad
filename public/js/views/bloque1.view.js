// public/js/views/bloque1.view.js
export function renderBloque1(container) {
  container.innerHTML = `
    <div class="bloque1-container">
      <h2>Información General de la Dependencia</h2>
      <form id="bloque1Form">
        <div class="form-group">
          <label for="nombre_entidad">Nombre de la Entidad</label>
          <input type="text" id="nombre_entidad" name="nombre_entidad" value="Alcaldía de Aguachica" required>
        </div>
        <div class="form-group">
          <label for="nombre_dependencia">Nombre de la Dependencia</label>
          <input type="text" id="nombre_dependencia" name="nombre_dependencia" required>
        </div>
        <div class="form-group">
          <label for="nombre_funcionario">Nombre del Funcionario</label>
          <input type="text" id="nombre_funcionario" name="nombre_funcionario" required>
        </div>
        <div class="form-group">
          <label for="cargo_funcionario">Cargo del Funcionario</label>
          <input type="text" id="cargo_funcionario" name="cargo_funcionario" required>
        </div>
        <div class="form-group">
          <label for="correo_funcionario">Correo del Funcionario</label>
          <input type="email" id="correo_funcionario" name="correo_funcionario" required>
        </div>
        <div class="form-group">
          <label for="fecha_diligenciamiento">Fecha de Diligenciamiento</label>
          <input type="date" id="fecha_diligenciamiento" name="fecha_diligenciamiento" required>
        </div>
        <div class="form-actions">
          <button type="submit">Guardar Bloque 1</button>
          <button type="button" id="volverBtn">Volver</button>
        </div>
      </form>
      <div id="mensaje" class="mensaje"></div>
    </div>
  `;

  // Eventos
  const form = document.getElementById('bloque1Form');
  const volverBtn = document.getElementById('volverBtn');

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    document.getElementById('mensaje').textContent = "Formulario guardado (simulado)";
    // Aquí llamarías a la API para guardar Bloque 1
  });

  volverBtn.addEventListener('click', () => {
    import('./segtec.view.js').then(module => {
      module.renderSEGTEC(container);
    });
  });
}
