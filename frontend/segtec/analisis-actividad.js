let currentStep = 1;
const totalSteps = 3;
let actividadId = null;

document.addEventListener('DOMContentLoaded', async () => {

  const token = localStorage.getItem('token');
  if (!token) {
    window.location.href = '/';
    return;
  }

  const params = new URLSearchParams(window.location.search);
  actividadId = params.get('id');

  if (!actividadId) {
    alert('Actividad no válida');
    window.location.href = '/segtec/segtec.html';
    return;
  }

  document.getElementById('btnNext')?.addEventListener('click', nextStep);
  document.getElementById('btnPrev')?.addEventListener('click', prevStep);
  document.getElementById('btnGuardarValidacion')?.addEventListener('click', guardarValidacionTecnica);
  document.getElementById('btnEjecutarAnalisis')?.addEventListener('click', ejecutarAnalisis);

  await cargarValidacionExistente();
  await cargarUltimoAnalisis();
  updateWizardUI();
});

/* =========================
   WIZARD
========================= */

function nextStep() {
  if (currentStep < totalSteps) {
    currentStep++;
    updateWizardUI();
  }
}

function prevStep() {
  if (currentStep > 1) {
    currentStep--;
    updateWizardUI();
  }
}

function updateWizardUI() {

  document.querySelectorAll('.wizard-step')
    .forEach(section => section.classList.remove('active'));

  document.querySelector(`.wizard-step[data-step="${currentStep}"]`)
    ?.classList.add('active');

  document.querySelectorAll('.wizard-steps li')
    .forEach(li => li.classList.remove('active'));

  document.querySelector(`.wizard-steps li[data-step="${currentStep}"]`)
    ?.classList.add('active');

  const progress = (currentStep / totalSteps) * 100;
  document.getElementById('wizardProgressBar').style.width = progress + '%';

  document.getElementById('wizardProgressText').textContent =
    `Paso ${currentStep} de ${totalSteps}`;

  document.getElementById('btnPrev').style.display =
    currentStep === 1 ? 'none' : 'inline-block';

  document.getElementById('btnNext').style.display =
    currentStep === 1 ? 'inline-block' : 'none';

  document.getElementById('btnGuardarValidacion').style.display =
    currentStep === 1 ? 'inline-block' : 'none';

  document.getElementById('btnEjecutarAnalisis').style.display =
    currentStep === 2 ? 'inline-block' : 'none';
}

/* =========================
   CARGAR VALIDACIÓN EXISTENTE
========================= */

async function cargarValidacionExistente() {

  const token = localStorage.getItem('token');

  try {

    const resp = await fetch(
      `/api/segtec/actividades/${actividadId}/validacion-tecnica`,
      {
        headers: { Authorization: `Bearer ${token}` }
      }
    );

    if (!resp.ok) return;

    const json = await resp.json();
    if (!json.ok || !json.existe) return;

    const data = json.data;

    document.getElementById('vt_soporte_principal').value =
      data.soporte_principal ?? '';

    document.getElementById('vt_impacto_juridico').value =
      data.impacto_juridico_directo ? 1 : 0;

    document.getElementById('vt_impacto_fiscal').value =
      data.impacto_fiscal_contable ? 1 : 0;

    document.getElementById('vt_expediente_propio').value =
      data.genera_expediente_propio ? 1 : 0;

    document.getElementById('vt_actividad_permanente').value =
      data.actividad_permanente ? 1 : 0;

    document.getElementById('vt_observacion_tecnica').value =
      data.observacion_tecnica ?? '';

  } catch (error) {
    console.error('Error cargando validación:', error);
  }
}

/* =========================
   GUARDAR VALIDACIÓN TÉCNICA
========================= */

async function guardarValidacionTecnica() {

  const token = localStorage.getItem('token');

  const payload = {
    soporte_principal: document.getElementById('vt_soporte_principal').value,
    impacto_juridico_directo: Number(document.getElementById('vt_impacto_juridico').value) === 1,
    impacto_fiscal_contable: Number(document.getElementById('vt_impacto_fiscal').value) === 1,
    genera_expediente_propio: Number(document.getElementById('vt_expediente_propio').value) === 1,
    actividad_permanente: Number(document.getElementById('vt_actividad_permanente').value) === 1,
    observacion_tecnica: document.getElementById('vt_observacion_tecnica').value.trim()
  };

  try {

    const resp = await fetch(
      `/api/segtec/actividades/${actividadId}/validacion-tecnica`,
      {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      }
    );

    const json = await resp.json();

    if (!resp.ok || !json.ok) {
      alert(json?.error || 'Error guardando información');
      return;
    }

    alert('Información registrada correctamente.');

  } catch (error) {
    console.error(error);
    alert('Error de conexión');
  }
}

/* =========================
   EJECUTAR ANÁLISIS
========================= */

async function ejecutarAnalisis() {

  const token = localStorage.getItem('token');

  try {

    // 🔎 Verificar validación obligatoria
    const respValidacion = await fetch(
      `/api/segtec/actividades/${actividadId}/validacion-tecnica`,
      {
        headers: { Authorization: `Bearer ${token}` }
      }
    );

    const jsonValidacion = await respValidacion.json();

    if (!jsonValidacion.existe) {
      alert('Debe completar la validación técnica antes del análisis.');
      currentStep = 1;
      updateWizardUI();
      return;
    }

    // 🔥 Ejecutar análisis
    const resp = await fetch(
      `/api/segtec/actividades/${actividadId}/analizar`,
      {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` }
      }
    );

    const json = await resp.json();

    if (!resp.ok || !json.ok) {
      alert(json?.error || 'Error ejecutando análisis');
      return;
    }

    mostrarResultado(json.data);

    currentStep = 3;
    updateWizardUI();

    await cargarUltimoAnalisis();

  } catch (error) {
    console.error(error);
    alert('Error de conexión');
  }
}

/* =========================
   CARGAR HISTÓRICO
========================= */

async function cargarUltimoAnalisis() {

  const token = localStorage.getItem('token');

  try {

    const resp = await fetch(
      `/api/segtec/actividades/${actividadId}/analisis`,
      {
        headers: { Authorization: `Bearer ${token}` }
      }
    );

    if (!resp.ok) return;

    const json = await resp.json();
    if (!json.ok) return;

    const historial = json.data || [];

    if (historial.length > 0) {
      mostrarResultado(historial[0]);
    }

  } catch (error) {
    console.error(error);
  }
}

/* =========================
   MOSTRAR RESULTADO
========================= */

function mostrarResultado(data) {

  document.getElementById('serie_propuesta').value =
    data.serie_propuesta || '';

  document.getElementById('retencion_gestion').value =
    (data.retencion_gestion || 0) + ' años';

  document.getElementById('retencion_central').value =
    (data.retencion_central || 0) + ' años';

  document.getElementById('disposicion_final').value =
    data.disposicion_final || '';

  document.getElementById('justificacion').value =
    data.justificacion || '';
}