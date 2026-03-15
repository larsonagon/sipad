import { renderHeader } from '../components/header.js';

function getUserFromToken() {

  const token = localStorage.getItem('token');
  if (!token) return null;

  try {
    return JSON.parse(atob(token.split('.')[1]));
  } catch (error) {
    return null;
  }

}

document.addEventListener('DOMContentLoaded', () => {

  const token = localStorage.getItem('token');

  // 🔐 Si no hay token → volver al login
  if (!token) {
    window.location.href = '/';
    return;
  }

  const user = getUserFromToken();

  if (!user) {

    localStorage.removeItem('token');
    localStorage.removeItem('user');

    window.location.href = '/';
    return;

  }

  // =========================
  // HEADER DINÁMICO
  // =========================

  try {
    renderHeader('home', user);
  } catch (error) {
    console.error('Error renderizando header:', error);
  }

  const nivel = user.nivel_acceso || 0;
  const esMaster = user.es_master_admin === true;

  // =========================
  // DETECTAR ROL GENERAL (ROBUSTO)
  // =========================

  const rolUsuario = JSON.stringify(user).toLowerCase();
  const esRolGeneral = rolUsuario.includes('general');

  // =========================
  // REFERENCIAS A TARJETAS
  // =========================

  const cardSegtec = document.getElementById('cardSegtec');
  const cardTRD = document.getElementById('cardTRD');
  const cardTRDAI = document.getElementById('cardTRDAI');
  const cardAdmin = document.getElementById('cardAdmin');
  const cardInformes = document.getElementById('cardInformes');

  // =========================
  // CONTROL DE VISIBILIDAD
  // =========================

  // Regla original por nivel de acceso
  if (nivel < 80 && !esMaster) {

    if (cardTRDAI) {
      cardTRDAI.style.display = 'none';
    }

    if (cardAdmin) {
      cardAdmin.style.display = 'none';
    }

  }

  // 👇 NUEVA REGLA PARA ROL GENERAL
  if (esRolGeneral) {

    if (cardTRD) {
      cardTRD.style.display = 'none';
    }

    if (cardTRDAI) {
      cardTRDAI.style.display = 'none';
    }

    if (cardAdmin) {
      cardAdmin.style.display = 'none';
    }

    if (cardInformes) {
      cardInformes.style.display = 'none';
    }

  }

  // =========================
  // NAVEGACIÓN
  // =========================

  // ICAF (antes SEGTEC)
  if (cardSegtec) {
    cardSegtec.addEventListener('click', () => {
      window.location.href = '/segtec/segtec.html';
    });
  }

  // TRD (manual)
  if (cardTRD) {
    cardTRD.addEventListener('click', () => {
      alert('TRD en construcción');
    });
  }

  // TRD-AI
  if (cardTRDAI) {
    cardTRDAI.addEventListener('click', () => {
      window.location.href = '/trd-ai/trd-ai-dashboard.html';
    });
  }

  // ADMINISTRACIÓN
  if (cardAdmin) {
    cardAdmin.addEventListener('click', () => {
      window.location.href = '/administracion/index.html';
    });
  }

  // INFORMES
  if (cardInformes) {
    cardInformes.addEventListener('click', () => {
      window.location.href = '/informes/index.html';
    });
  }

});