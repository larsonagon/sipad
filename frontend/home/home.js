import { renderHeader } from '../components/header.js';

function getUserFromToken() {

  const token = sessionStorage.getItem('token');
  if (!token) return null;

  try {
    const decoded = JSON.parse(atob(token.split('.')[1]));

    // 🔥 NORMALIZAR CAMPOS
    return {
      ...decoded,
      nivel_acceso: Number(
        decoded.nivel_acceso ??
        decoded.nivel ??
        decoded.level ??
        0
      ),
      es_master_admin: decoded.es_master_admin === true
    };

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

  renderHeader('home');
  cargarSelectorEntidad(user);

  const nivel = user.nivel_acceso;
  const esMaster = user.es_master_admin;

  console.log('DEBUG USER:', user);

  // =====================================================
  // 🔥 PERMISOS CLAROS Y SIN ERRORES
  // =====================================================

  const puedeICAF = true;

  const puedeAdmin =
    esMaster || nivel >= 90;

  const puedeInformes =
    esMaster || (nivel >= 50 && nivel < 90);

  const puedeTRDAI =
    esMaster || (nivel >= 70 && nivel < 90);

  // =====================================================

  const cardSegtec = document.getElementById('cardSegtec');
  const cardTRD = document.getElementById('cardTRD');
  const cardTRDAI = document.getElementById('cardTRDAI');
  const cardAdmin = document.getElementById('cardAdmin');
  const cardInformes = document.getElementById('cardInformes');

  if (cardSegtec) cardSegtec.style.display = puedeICAF ? 'block' : 'none';
  if (cardAdmin) cardAdmin.style.display = puedeAdmin ? 'block' : 'none';
  if (cardInformes) cardInformes.style.display = puedeInformes ? 'block' : 'none';
  if (cardTRDAI) cardTRDAI.style.display = puedeTRDAI ? 'block' : 'none';
  if (cardTRD) cardTRD.style.display = puedeTRDAI ? 'block' : 'none';

  // =====================================================

  if (cardSegtec) {
    cardSegtec.onclick = () => window.location.href = '/segtec/segtec.html';
  }

  if (cardAdmin) {
    cardAdmin.onclick = () => window.location.href = '/administracion/index.html';
  }

  if (cardInformes) {
    cardInformes.onclick = () => window.location.href = '/informes/index.html';
  }

  if (cardTRDAI) {
    cardTRDAI.onclick = () => window.location.href = '/trd-ai/trd-ai-dashboard.html';
  }

  if (cardTRD) {
    cardTRD.onclick = () => alert('TRD en construcción');
  }

});