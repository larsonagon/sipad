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

      console.log('Entidad activa:', select.value);

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

    sessionStorage.removeItem('token')
    sessionStorage.removeItem('user')

    window.location.href = '/';
    return;

  }

  try {
    renderHeader('home')
  } catch (error) {
    console.error('Error renderizando header:', error);
  }

  cargarSelectorEntidad(user);

  const nivel = Number(user.nivel_acceso || 0);
  const esMaster = user.es_master_admin === true;

  // =====================================================
  // 🔥 MODELO CORREGIDO (POR RANGOS, NO IGUALDAD)
  // =====================================================

  const puedeICAF = nivel >= 10;

  let puedeInformes =
    (nivel >= 50 && nivel < 90) || esMaster;

  let puedeTRDAI =
    (nivel >= 70 && nivel < 90) || esMaster;

  const puedeAdmin =
    (nivel >= 90);

  // 🔥 ADMINISTRADOR (90+) NO VE INFORMES NI TRD
  if (nivel >= 90 && !esMaster) {
    puedeInformes = false;
    puedeTRDAI = false;
  }

  // =====================================================

  const cardSegtec = document.getElementById('cardSegtec');
  const cardTRD = document.getElementById('cardTRD');
  const cardTRDAI = document.getElementById('cardTRDAI');
  const cardAdmin = document.getElementById('cardAdmin');
  const cardInformes = document.getElementById('cardInformes');

  // =====================================================
  // 🔥 CONTROL VISUAL (SEGURO Y PREDECIBLE)
  // =====================================================

  if (cardSegtec) {
    cardSegtec.style.display = puedeICAF ? 'block' : 'none';
  }

  if (cardInformes) {
    cardInformes.style.display = puedeInformes ? 'block' : 'none';
  }

  if (cardTRDAI) {
    cardTRDAI.style.display = puedeTRDAI ? 'block' : 'none';
  }

  if (cardTRD) {
    cardTRD.style.display = puedeTRDAI ? 'block' : 'none';
  }

  if (cardAdmin) {
    cardAdmin.style.display = puedeAdmin ? 'block' : 'none';
  }

  // =====================================================
  // NAVEGACIÓN (SIN CAMBIOS)
  // =====================================================

  if (cardSegtec) {
    cardSegtec.addEventListener('click', () => {
      window.location.href = '/segtec/segtec.html';
    });
  }

  if (cardTRD) {
    cardTRD.addEventListener('click', () => {
      alert('TRD en construcción');
    });
  }

  if (cardTRDAI) {
    cardTRDAI.addEventListener('click', () => {
      window.location.href = '/trd-ai/trd-ai-dashboard.html';
    });
  }

  if (cardAdmin) {
    cardAdmin.addEventListener('click', () => {
      window.location.href = '/administracion/index.html';
    });
  }

  if (cardInformes) {
    cardInformes.addEventListener('click', () => {
      window.location.href = '/informes/index.html';
    });
  }

});