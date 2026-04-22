import { renderHeader } from '/components/header.js';

document.addEventListener('DOMContentLoaded', async () => {

  const token = sessionStorage.getItem('token');
  const userRaw = sessionStorage.getItem('user');

  if (!token || !userRaw) {
    window.location.href = '/';
    return;
  }

  const user = JSON.parse(userRaw);

  const gestionEntidadNombre = sessionStorage.getItem('gestion_entidad_nombre') || null;
  renderHeader('ICAF', gestionEntidadNombre);

  const rolNormalizado =
    (user?.rol || '')
    .toLowerCase()
    .replace(/\s+/g, '');

  const esSuperAdmin  = rolNormalizado === 'superadmin';
  const esArchivista  = rolNormalizado === 'archivista';
  const puedeAnalizar = esSuperAdmin || esArchivista;
  const puedeCrear    = !esSuperAdmin;

  const nuevaActividadBtn = document.getElementById('nuevaActividad');
  const tablaContainer   = document.getElementById('tablaRegistros');
  const mensaje          = document.getElementById('mensaje');
  const panelMarco       = document.getElementById('panelMarcoFuncional');

  const modal          = document.getElementById('modalBase');
  const modalBody      = document.getElementById('modalBody');
  const modalFooter    = document.getElementById('modalFooter');
  const cerrarModalBtn = document.getElementById('cerrarModal');

  if (!puedeCrear) {
    nuevaActividadBtn?.classList.add('hidden');
  }

  cerrarModalBtn?.addEventListener('click', cerrarModal);

  // =====================================================
  // ESTADO FILTROS + PAGINACIÓN
  // =====================================================

  let actividadesCache = [];
  let paginaActual     = 1;
  const porPagina      = 10;

  // =====================================================
  // API FETCH
  // ✅ Solo Super Admin envía X-Entidad-Id (para cambiar
  //    de entidad). El Archivista usa su entidad del token
  //    y el controller ya le da la vista global.
  // =====================================================

  async function apiFetch(url, options = {}) {

    const headers = {
      Authorization: `Bearer ${token}`,
      ...(options.headers || {})
    };

    if (esSuperAdmin) {
      const entidadId =
        sessionStorage.getItem('gestion_entidad_id') ||
        sessionStorage.getItem('entidad_id') ||
        null;

      if (entidadId) {
        headers['X-Entidad-Id'] = entidadId;
      }
    }

    if (options.body || options.method === 'POST') {
      headers['Content-Type'] = 'application/json';
    }

    const resp = await fetch(url, {
      ...options,
      headers
    });

    if (resp.status === 401) {
      sessionStorage.clear();
      localStorage.clear();
      window.location.href = '/';
      return null;
    }

    return resp;
  }

  // =====================================================
  // UTILIDADES
  // =====================================================

  function capitalizar(texto) {
    if (!texto) return '-';
    const limpio = texto.toString().toLowerCase().trim();
    return limpio.charAt(0).toUpperCase() + limpio.slice(1);
  }

  function formatearFecha(fechaISO) {
    if (!fechaISO) return '-';
    return new Date(fechaISO).toLocaleDateString('es-CO');
  }

  function formatearDisposicion(valor) {

    if (!valor) return '-';

    const mapa = {
      conservacion_total : 'Conservación total',
      eliminacion        : 'Eliminación',
      seleccion          : 'Selección',
      medio_tecnico      : 'Medio técnico (Microfilmación o digitalización)'
    };

    const clave = valor
      .toString()
      .toLowerCase()
      .replace(/\s+/g, '_')
      .trim();

    return mapa[clave] || 'Eliminación';
  }

  function badgeEstado(estado) {

    const normalizado = (estado || 'borrador').toLowerCase();

    const clases = {
      borrador      : 'badge-neutral',
      identificada  : 'badge-warning',
      caracterizada : 'badge-info',
      analizada     : 'badge-success',
      completa      : 'badge-success'
    };

    return `
      <span class="badge ${clases[normalizado] || 'badge-neutral'}">
        ${capitalizar(normalizado)}
      </span>
    `;
  }

  function cerrarModal() {
    if (modal) {
      modal.classList.add('hidden');
      modal.style.display = 'none';
    }
    if (modalBody)   modalBody.innerHTML   = '';
    if (modalFooter) modalFooter.innerHTML = '';
  }

  function mostrarError(texto) {
    mensaje.innerHTML = `
      <div class="alert-error">
        ${texto}
      </div>
    `;
  }

  // =====================================================
  // NUEVA ACTIVIDAD
  // =====================================================

  nuevaActividadBtn?.addEventListener('click', () => {
    window.location.href = '/segtec/actividad.html';
  });

  // =====================================================
  // DESCARGAR PDF
  // =====================================================

  async function descargarPDFActividad(id) {

    const btn = tablaContainer.querySelector(`.pdf-btn[data-id="${id}"]`);

    if (btn) {
      btn.disabled    = true;
      btn.textContent = '⏳';
    }

    try {

      const resp = await fetch(`/api/segtec/actividades/${id}/pdf`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (resp.status === 401) {
        sessionStorage.clear();
        localStorage.clear();
        window.location.href = '/';
        return;
      }

      if (!resp.ok) {
        const text = await resp.text();
        throw new Error(text || 'Error generando PDF');
      }

      const blob = await resp.blob();
      const url  = window.URL.createObjectURL(blob);

      const isSafari =
        /^((?!chrome|android).)*safari/i.test(navigator.userAgent);

      if (isSafari) {
        window.open(url, '_blank');
      } else {
        const a = document.createElement('a');
        a.href     = url;
        a.download = `actividad_${id}.pdf`;
        document.body.appendChild(a);
        a.click();
        a.remove();
      }

      setTimeout(() => window.URL.revokeObjectURL(url), 1500);

    } catch (error) {
      console.error(error);
      alert('Error generando el PDF.');
    } finally {
      if (btn) {
        btn.disabled    = false;
        btn.textContent = 'PDF';
      }
    }
  }

  // =====================================================
  // MODAL ANÁLISIS
  // =====================================================

  async function abrirModalAnalisis(id) {

    try {

      const resp = await apiFetch(
        `/api/segtec/actividades/${id}/analizar`,
        { method: 'POST' }
      );

      if (!resp) return;

      const json = await resp.json();

      console.log('🔍 ANÁLISIS RESPONSE completo:', JSON.stringify(json, null, 2));

      if (!json.ok) {
        alert('No se pudo generar el análisis.');
        return;
      }

      const a = json.data || {};

      const serie = a.serie_documental
        || a.serie_sugerida
        || a.serie
        || a.serie_propuesta
        || '-';

      const subserie = a.subserie_documental
        || a.subserie_sugerida
        || a.subserie
        || a.subserie_propuesta
        || '-';

      const retencionGestion = a.retencion_gestion
        || a.retencion_archivo_gestion
        || a.retention_gestion
        || '-';

      const retencionCentral = a.retencion_central
        || a.retencion_archivo_central
        || a.retention_central
        || '-';

      const disposicion = a.disposicion_final
        || a.disposicion
        || a.disposition_final
        || '-';

      const serieLabel    = serie    !== '-' ? serie    : '<em style="color:var(--color-text-secondary);font-style:normal;">No determinada por la IA</em>';
      const subserieLabel = subserie !== '-' ? subserie : '<em style="color:var(--color-text-secondary);font-style:normal;">No determinada por la IA</em>';

      document.getElementById('modalTitle').textContent = '';

      modalBody.innerHTML = `
        <div style="border-bottom:0.5px solid var(--border-color,#e5e7eb); padding-bottom:0.75rem; margin-bottom:1rem;">
          <p style="margin:0 0 3px; font-size:11px; font-weight:500; text-transform:uppercase; letter-spacing:0.06em; color:var(--text-secondary);">Análisis técnico de la actividad</p>
        </div>

        <div style="display:grid; grid-template-columns:1fr 1fr; gap:1rem; padding-bottom:1rem; margin-bottom:1rem; border-bottom:0.5px solid var(--border-color,#e5e7eb);">
          <div>
            <p style="margin:0 0 4px; font-size:11px; font-weight:500; text-transform:uppercase; letter-spacing:0.06em; color:var(--text-secondary);">Serie documental</p>
            <p style="margin:0; font-size:15px; font-weight:600;">${serieLabel}</p>
          </div>
          <div>
            <p style="margin:0 0 4px; font-size:11px; font-weight:500; text-transform:uppercase; letter-spacing:0.06em; color:var(--text-secondary);">Subserie</p>
            <p style="margin:0; font-size:15px; font-weight:600;">${subserieLabel}</p>
          </div>
        </div>

        <div style="display:grid; grid-template-columns:1fr 1fr 1fr; gap:10px;">
          <div style="background:var(--bg-secondary,#f9fafb); border-radius:8px; padding:12px;">
            <p style="margin:0 0 4px; font-size:11px; color:var(--text-secondary);">Archivo de gestión</p>
            <p style="margin:0; font-size:20px; font-weight:600;">${retencionGestion !== '-' ? retencionGestion : '-'}<span style="font-size:12px; font-weight:400; color:var(--text-secondary);">${retencionGestion !== '-' ? ' años' : ''}</span></p>
          </div>
          <div style="background:var(--bg-secondary,#f9fafb); border-radius:8px; padding:12px;">
            <p style="margin:0 0 4px; font-size:11px; color:var(--text-secondary);">Archivo central</p>
            <p style="margin:0; font-size:20px; font-weight:600;">${retencionCentral !== '-' ? retencionCentral : '-'}<span style="font-size:12px; font-weight:400; color:var(--text-secondary);">${retencionCentral !== '-' ? ' años' : ''}</span></p>
          </div>
          <div style="background:var(--bg-secondary,#f9fafb); border-radius:8px; padding:12px;">
            <p style="margin:0 0 4px; font-size:11px; color:var(--text-secondary);">Disposición</p>
            <p style="margin:0; font-size:13px; font-weight:600;">${formatearDisposicion(disposicion)}</p>
          </div>
        </div>
      `;

      modalFooter.innerHTML = `
        <button class="btn-secondary" id="btnCerrarAnalisis">Cerrar</button>
      `;

      document
        .getElementById('btnCerrarAnalisis')
        ?.addEventListener('click', cerrarModal);

      modal.classList.remove('hidden');
      Object.assign(modal.style, {
        display        : 'flex',
        position       : 'fixed',
        top            : '0',
        left           : '0',
        width          : '100vw',
        height         : '100vh',
        background     : 'rgba(0,0,0,0.5)',
        alignItems     : 'center',
        justifyContent : 'center',
        zIndex         : '9999'
      });

    } catch (error) {
      console.error('Error en análisis:', error);
      alert('Error generando análisis.');
    }
  }

  // =====================================================
  // MARCO FUNCIONAL
  // ✅ FIX: Archivista también obtiene vista global
  //         sin pasar por la validación de dependencia,
  //         pero SÍ puede crear actividades
  // =====================================================

  async function cargarMarcoFuncional() {

    if (esSuperAdmin || esArchivista) {

      panelMarco.innerHTML = `
        <div class="card">
          <div class="module-actions space-between">
            <h2>Vista global de actividades</h2>
          </div>
          <p style="color: var(--text-secondary); margin: 0;">
            Estás viendo todas las actividades registradas en la entidad actual.
          </p>
        </div>
      `;

      return true;
    }

    try {

      const resp = await apiFetch('/api/segtec/configuracion');
      if (!resp) return false;

      const json = await resp.json();

      if (!resp.ok || !json.ok || !json.configuracion) {

        panelMarco.innerHTML = `
          <div class="card card-warning">
            <h3>Configuración funcional no definida</h3>
            <p>
              Antes de registrar actividades técnicas,
              debe definirse la estructura funcional de la dependencia.
            </p>
            <button id="btnConfigurar" class="btn btn-primary">
              Definir configuración inicial
            </button>
          </div>
        `;

        nuevaActividadBtn?.classList.add('hidden');
        tablaContainer.innerHTML = '';

        document
          .getElementById('btnConfigurar')
          ?.addEventListener('click', () => {
            window.location.href = '/segtec/configuracion.html';
          });

        return false;
      }

      const c = json.configuracion;

      panelMarco.innerHTML = `
        <div class="card">

          <div class="module-actions space-between">
            <h2>Marco funcional vigente</h2>

            <button class="btn-secondary"
              onclick="window.location.href='/segtec/configuracion.html'">
              Editar estructura funcional
            </button>
          </div>

          <div class="grid-3">

            <div class="grid-item">
              <label>Versión</label>
              <span>${c.version}</span>
            </div>

            <div class="grid-item">
              <label>Tipo de función</label>
              <span>${capitalizar(c.tipo_funcion)}</span>
            </div>

            <div class="grid-item">
              <label>Nivel decisorio</label>
              <span>${capitalizar(c.nivel_decisorio)}</span>
            </div>

            <div class="grid-item">
              <label>Fecha de definición</label>
              <span>${formatearFecha(c.created_at)}</span>
            </div>

          </div>

        </div>
      `;

      return true;

    } catch (err) {
      console.error(err);
      mostrarError('Error cargando configuración funcional.');
      return false;
    }
  }

  // =====================================================
  // CARGAR ACTIVIDADES
  // =====================================================

  async function cargarActividades() {

    try {

      const resp = await apiFetch('/api/segtec/actividades');
      if (!resp) return;

      const json = await resp.json();

      if (!resp.ok || !json.ok) {
        mostrarError('Error cargando actividades.');
        return;
      }

      actividadesCache = json.data || [];

      if (!actividadesCache.length) {
        tablaContainer.innerHTML = `
          <div class="empty-state">
            <h3>No hay actividades técnicas registradas aún.</h3>
            <p>Al crear una nueva actividad, iniciará el proceso técnico.</p>
          </div>
        `;
        return;
      }

      if (esSuperAdmin || esArchivista) {
        renderFiltros();
      }

      renderTabla(actividadesCache);

    } catch (error) {
      console.error(error);
      mostrarError('Error de conexión con el servidor.');
    }
  }

  // =====================================================
  // FILTROS
  // =====================================================

  function renderFiltros() {

    const contenedor = document.createElement('div');
    contenedor.id = 'filtrosSegtec';
    contenedor.style.cssText = `
      display:flex;gap:10px;flex-wrap:wrap;
      margin-bottom:16px;align-items:center;
    `;

    contenedor.innerHTML = `
      <input
        id="filtroTexto" type="text"
        placeholder="Buscar por actividad, dependencia o funcionario..."
        style="flex:1;min-width:220px;height:34px;padding:0 12px;font-size:13px;
               border:1px solid var(--color-border);border-radius:6px;
               font-family:inherit;box-sizing:border-box;">

      <select id="filtroEstado"
        style="height:34px;padding:0 10px;font-size:13px;
               border:1px solid var(--color-border);border-radius:6px;
               font-family:inherit;background:#fff;">
        <option value="">Todos los estados</option>
        <option value="borrador">Borrador</option>
        <option value="caracterizada">Caracterizada</option>
        <option value="analizada">Analizada</option>
      </select>

      <button id="btnLimpiarFiltros"
        style="height:34px;padding:0 14px;font-size:13px;
               border:1px solid var(--color-border);border-radius:6px;
               background:#f3f4f6;color:#374151;cursor:pointer;font-family:inherit;">
        Limpiar
      </button>

      <span id="infoFiltro"
        style="font-size:12px;color:var(--color-text-muted);white-space:nowrap;margin-left:auto;">
      </span>
    `;

    tablaContainer.parentNode.insertBefore(contenedor, tablaContainer);

    document.getElementById('filtroTexto')
      .addEventListener('input', aplicarFiltros);

    document.getElementById('filtroEstado')
      .addEventListener('change', aplicarFiltros);

    document.getElementById('btnLimpiarFiltros')
      .addEventListener('click', () => {
        document.getElementById('filtroTexto').value  = '';
        document.getElementById('filtroEstado').value = '';
        paginaActual = 1;
        renderTabla(actividadesCache);
      });
  }

  function aplicarFiltros() {
    const texto  = (document.getElementById('filtroTexto')?.value  || '').toLowerCase();
    const estado = (document.getElementById('filtroEstado')?.value || '').toLowerCase();

    const filtradas = actividadesCache.filter(a => {
      const matchTexto = !texto || [
        a.nombre      || '',
        a.dependencia || '',
        a.funcionario || ''
      ].some(c => c.toLowerCase().includes(texto));

      const matchEstado = !estado ||
        (a.estado_general || '').toLowerCase() === estado;

      return matchTexto && matchEstado;
    });

    paginaActual = 1;
    renderTabla(filtradas);
  }

  // =====================================================
  // RENDER TABLA + PAGINACIÓN
  // =====================================================

  function renderTabla(actividades) {

    const total     = actividades.length;
    const totalPags = Math.max(1, Math.ceil(total / porPagina));
    if (paginaActual > totalPags) paginaActual = totalPags;

    const inicio = (paginaActual - 1) * porPagina;
    const slice  = actividades.slice(inicio, inicio + porPagina);

    const infoEl = document.getElementById('infoFiltro');
    if (infoEl) {
      const fin = Math.min(inicio + porPagina, total);
      infoEl.textContent = total === 0
        ? 'Sin resultados'
        : `${inicio + 1}–${fin} de ${total}`;
    }

    const thDependencia = (esSuperAdmin || esArchivista)
      ? '<th>Dependencia</th><th>Funcionario</th>'
      : '';

    const filas = slice.length === 0
      ? `<tr><td colspan="10" style="text-align:center;padding:2rem;color:var(--color-text-muted);">No se encontraron actividades.</td></tr>`
      : slice.map(a => {

          const estado = (a.estado_general || '').toLowerCase().trim();

          let botonAnalizar = '';
          if ((estado === 'caracterizada' || estado === 'analizada') && puedeAnalizar) {
            botonAnalizar = `
              <button class="btn-warning btn-sm analizar-btn" data-id="${a.id}">
                Analizar
              </button>
            `;
          }

          const colDependencia = (esSuperAdmin || esArchivista)
            ? `<td>${a.dependencia || '-'}</td><td>${a.funcionario || '-'}</td>`
            : '';

          return `
            <tr style="vertical-align:middle;">
              <td style="word-break:break-word;min-width:180px;"><strong>${a.nombre || '-'}</strong></td>
              ${colDependencia}
              <td style="white-space:nowrap;">${capitalizar(a.frecuencia)}</td>
              <td style="white-space:nowrap;">${badgeEstado(a.estado_general)}</td>
              <td style="white-space:nowrap;">${formatearFecha(a.created_at)}</td>
              <td style="vertical-align:middle;">
                <div style="display:flex;gap:6px;align-items:center;justify-content:flex-start;">
                  <button class="btn-primary btn-sm abrir-btn" data-id="${a.id}">Abrir</button>
                  ${botonAnalizar}
                  <button class="btn-danger btn-sm pdf-btn" data-id="${a.id}" style="width:70px;">PDF</button>
                </div>
              </td>
            </tr>
          `;
        }).join('');

    tablaContainer.innerHTML = `
      <div style="width:100%;overflow-x:auto;">
        <table class="table" style="width:100%;border-collapse:collapse;">
          <thead>
            <tr>
              <th style="min-width:180px;">Actividad</th>
              ${thDependencia}
              <th style="white-space:nowrap;width:100px;">Frecuencia</th>
              <th style="white-space:nowrap;width:90px;">Estado</th>
              <th style="white-space:nowrap;width:90px;">Creado</th>
              <th style="white-space:nowrap;width:210px;">Acciones</th>
            </tr>
          </thead>
          <tbody>${filas}</tbody>
        </table>
      </div>
    `;

    // Paginación
    if (totalPags > 1) {
      const pag = document.createElement('div');
      pag.style.cssText = `
        display:flex;justify-content:center;align-items:center;
        gap:6px;margin-top:16px;flex-wrap:wrap;
      `;

      const crearBtn = (label, pagina, activo, disabled) => {
        const b = document.createElement('button');
        b.textContent = label;
        b.style.cssText = `
          height:30px;min-width:30px;padding:0 8px;font-size:12px;
          border:1px solid ${activo ? '#1d4ed8' : 'var(--color-border)'};
          border-radius:6px;
          background:${activo ? '#1d4ed8' : '#fff'};
          color:${activo ? '#fff' : 'var(--color-text)'};
          cursor:${disabled ? 'default' : 'pointer'};
          opacity:${disabled ? '0.4' : '1'};
          font-family:inherit;
        `;
        if (!disabled) {
          b.addEventListener('click', () => {
            paginaActual = pagina;
            const texto  = document.getElementById('filtroTexto')?.value  || '';
            const estado = document.getElementById('filtroEstado')?.value || '';
            if (texto || estado) {
              aplicarFiltros();
            } else {
              renderTabla(actividadesCache);
            }
            tablaContainer.scrollIntoView({ behavior: 'smooth', block: 'start' });
          });
        }
        return b;
      };

      const dots = () => {
        const s = document.createElement('span');
        s.textContent = '…';
        s.style.cssText = 'font-size:12px;color:var(--color-text-muted);';
        return s;
      };

      pag.appendChild(crearBtn('‹', paginaActual - 1, false, paginaActual <= 1));

      const desde = Math.max(1, paginaActual - 2);
      const hasta  = Math.min(totalPags, paginaActual + 2);

      if (desde > 1) {
        pag.appendChild(crearBtn('1', 1, false, false));
        if (desde > 2) pag.appendChild(dots());
      }

      for (let i = desde; i <= hasta; i++) {
        pag.appendChild(crearBtn(String(i), i, i === paginaActual, false));
      }

      if (hasta < totalPags) {
        if (hasta < totalPags - 1) pag.appendChild(dots());
        pag.appendChild(crearBtn(String(totalPags), totalPags, false, false));
      }

      pag.appendChild(crearBtn('›', paginaActual + 1, false, paginaActual >= totalPags));

      tablaContainer.appendChild(pag);
    }

    // Event listeners
    tablaContainer.querySelectorAll('.abrir-btn').forEach(b =>
      b.addEventListener('click', () => {
        window.location.href = `/segtec/actividad.html?id=${b.dataset.id}`;
      })
    );

    tablaContainer.querySelectorAll('.pdf-btn').forEach(b =>
      b.addEventListener('click', () => descargarPDFActividad(b.dataset.id))
    );

    tablaContainer.querySelectorAll('.analizar-btn').forEach(b =>
      b.addEventListener('click', () => abrirModalAnalisis(b.dataset.id))
    );
  }

  // =====================================================
  // INIT
  // =====================================================

  const configuracionOk = await cargarMarcoFuncional();

  if (configuracionOk) {
    await cargarActividades();
  }

});