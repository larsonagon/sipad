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

  const nivel    = Number(user.nivel_acceso || 0);
  const esMaster = user.es_master_admin === true;

  const gestionEntidadId    = sessionStorage.getItem('gestion_entidad_id') || null;
  const gestionEntidadNombre = sessionStorage.getItem('gestion_entidad_nombre') || null;

  // ✅ Super Admin sin entidad seleccionada → directo al listado de entidades
  if (esMaster && !gestionEntidadId) {
    window.location.href = '/administracion/entidades/index.html';
    return;
  }

  try {
    renderHeader('home', gestionEntidadNombre);
  } catch (error) {
    console.error('Error renderizando header:', error);
  }

  // =====================================================
  // PERMISOS
  // =====================================================

  let puedeICAF     = false;
  let puedeInformes = false;
  let puedeTRDAI    = false;
  let puedeAdmin    = false;

  if (esMaster) {
    puedeAdmin    = true;
    puedeICAF     = true;
    puedeInformes = true;
    puedeTRDAI    = true;
  } else {

    switch (nivel) {

      case 90:
        puedeICAF  = true;
        puedeAdmin = true;
        break;

      case 70:
        puedeICAF     = true;
        puedeInformes = true;
        puedeTRDAI    = true;
        break;

      case 50:
        puedeICAF     = true;
        puedeInformes = true;
        break;

      case 10:
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

  const grid = document.querySelector('.module-grid');
  if (grid) grid.style.visibility = 'visible';

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