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
  // 🔥 PERMISOS DETERMINÍSTICOS POR ROL
  // =====================================================

  let puedeICAF = false;
  let puedeInformes = false;
  let puedeTRDAI = false;
  let puedeAdmin = false;

  // 🔴 SUPER ADMIN
  if (esMaster) {
    puedeICAF = true;
    puedeInformes = true;
    puedeTRDAI = true;
    puedeAdmin = true;
  }

  // 🟠 ADMINISTRADOR (nivel 90)
  else if (nivel === 90) {
    puedeICAF = true;
    puedeAdmin = true;
  }

  // 🔵 ARCHIVISTA (nivel 70)
  else if (nivel === 70) {
    puedeICAF = true;
    puedeInformes = true;
    puedeTRDAI = true;
  }

  // 🟣 JEFE (nivel 50)
  else if (nivel === 50) {
    puedeICAF = true;
    puedeInformes = true;
  }

  // ⚪ GENERAL (nivel >=10)
  else if (nivel >= 10) {
    puedeICAF = true;
  }

  // =====================================================
  // ELEMENTOS
  // =====================================================

  const cardSegtec = document.getElementById('cardSegtec');
  const cardTRD = document.getElementById('cardTRD');
  const cardTRDAI = document.getElementById('cardTRDAI');
  const cardAdmin = document.getElementById('cardAdmin');
  const cardInformes = document.getElementById('cardInformes');

  // =====================================================
  // 🔥 CONTROL VISUAL FORZADO (SIN FALLAS)
  // =====================================================

  function toggle(el, condition) {
    if (!el) return;
    el.style.display = condition ? 'flex' : 'none';
  }

  toggle(cardSegtec, puedeICAF);
  toggle(cardInformes, puedeInformes);
  toggle(cardTRDAI, puedeTRDAI);
  toggle(cardTRD, puedeTRDAI);
  toggle(cardAdmin, puedeAdmin);

  // =====================================================
  // DEBUG (puedes quitar después)
  // =====================================================

  console.log('PERMISOS HOME:', {
    nivel,
    esMaster,
    puedeICAF,
    puedeInformes,
    puedeTRDAI,
    puedeAdmin
  });

  // =====================================================
  // NAVEGACIÓN
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