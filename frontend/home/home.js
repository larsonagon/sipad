import { renderHeader } from '../components/header.js';

function getUserFromToken() {

  const token = sessionStorage.getItem('token');
  if (!token) return null;

  try {
    return JSON.parse(atob(token.split('.')[1]));
  } catch (error) {
    return null;
  }

}

async function cargarSelectorEntidad(user) {

  if (!user) return;

  if (!user.es_master_admin && user.rol !== 'Super Admin') {
    return;
  }

  const select = document.getElementById('selectorEntidad');
  if (!select) return;

  select.style.display = 'inline-block';

  try {

    const res = await fetch('/api/entidades');
    const json = await res.json();

    if (!json.ok) return;

    select.innerHTML = '';

    json.data.forEach(e => {

      const option = document.createElement('option');
      option.value = e.id;
      option.textContent = e.nombre;

      select.appendChild(option);

    });

    const entidadActiva =
      sessionStorage.getItem('entidad_id') || user.id_entidad;

    select.value = entidadActiva;

    select.addEventListener('change', () => {

      sessionStorage.setItem('entidad_id', select.value);

      location.reload();

    });

  } catch (err) {

    console.error('Error cargando entidades:', err);

  }

}

document.addEventListener('DOMContentLoaded', () => {

  const token = sessionStorage.getItem('token');

  if (!token) {
    window.location.href = '/';
    return;
  }

  const user = getUserFromToken();

  if (!user) {
    sessionStorage.clear();
    window.location.href = '/';
    return;
  }

  try {
    renderHeader('home')
  } catch (error) {
    console.error('Error renderizando header:', error);
  }

  cargarSelectorEntidad(user);

  // 🔥 NORMALIZACIÓN REAL
  const nivel    = Number(user.nivel_acceso || 0);
  const esMaster = user.es_master_admin === true;

  // ✅ Super Admin sin entidad seleccionada → no puede usar módulos operativos
  const gestionEntidadId    = sessionStorage.getItem('gestion_entidad_id') || null
  const superAdminSinEntidad = esMaster && !gestionEntidadId

  // =====================================================
  // PERMISOS
  // =====================================================

  let puedeICAF     = false;
  let puedeInformes = false;
  let puedeTRDAI    = false;
  let puedeAdmin    = false;

  if (esMaster) {
    puedeAdmin    = true;
    // ✅ Módulos operativos solo si tiene entidad seleccionada
    puedeICAF     = !superAdminSinEntidad;
    puedeInformes = !superAdminSinEntidad;
    puedeTRDAI    = !superAdminSinEntidad;
  } else {

    switch (nivel) {

      case 90: // ADMINISTRADOR
        puedeICAF  = true;
        puedeAdmin = true;
        break;

      case 70: // ARCHIVISTA
        puedeICAF     = true;
        puedeInformes = true;
        puedeTRDAI    = true;
        break;

      case 50: // JEFE
        puedeICAF     = true;
        puedeInformes = true;
        break;

      case 10: // GENERAL
        puedeICAF = true;
        break;

      default:
        break;
    }

  }

  // =====================================================
  // UI
  // =====================================================

  const cardSegtec   = document.getElementById('cardSegtec');
  const cardTRD      = document.getElementById('cardTRD');
  const cardTRDAI    = document.getElementById('cardTRDAI');
  const cardAdmin    = document.getElementById('cardAdmin');
  const cardInformes = document.getElementById('cardInformes');

  if (cardSegtec)   cardSegtec.style.display   = puedeICAF     ? '' : 'none';
  if (cardInformes) cardInformes.style.display  = puedeInformes ? '' : 'none';
  if (cardTRDAI)    cardTRDAI.style.display     = puedeTRDAI    ? '' : 'none';
  if (cardTRD)      cardTRD.style.display       = puedeTRDAI    ? '' : 'none';
  if (cardAdmin)    cardAdmin.style.display     = puedeAdmin    ? '' : 'none';

  // =====================================================
  // NAVEGACIÓN
  // =====================================================

  if (cardSegtec) {
    cardSegtec.onclick = () => {
      window.location.href = '/segtec/segtec.html';
    };
  }

  if (cardTRD) {
    cardTRD.onclick = () => {
      alert('TRD en construcción');
    };
  }

  if (cardTRDAI) {
    cardTRDAI.onclick = () => {
      window.location.href = '/trd-ai/trd-ai-dashboard.html';
    };
  }

  if (cardAdmin) {
    cardAdmin.onclick = () => {
      window.location.href = '/administracion/index.html';
    };
  }

  if (cardInformes) {
    cardInformes.onclick = () => {
      window.location.href = '/informes/index.html';
    };
  }

});