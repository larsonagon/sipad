import { renderHeader } from '/components/header.js';

document.addEventListener('DOMContentLoaded', async () => {

  const token = sessionStorage.getItem('token');
  const userRaw = sessionStorage.getItem('user');

  if (!token || !userRaw) {
    window.location.href = '/';
    return;
  }

  const user = JSON.parse(userRaw);

  renderHeader('ICAF');

  /* ======================================================
     CONTROL DE ROLES
  ====================================================== */

  const rolNormalizado =
    (user?.rol || '')
    .toLowerCase()
    .replace(/\s+/g, '');

  const puedeAnalizar =
    rolNormalizado === 'superadmin' ||
    rolNormalizado === 'archivista';

  /* ======================================================
     ELEMENTOS
  ====================================================== */

  const nuevaActividadBtn = document.getElementById('nuevaActividad');
  const tablaContainer = document.getElementById('tablaRegistros');
  const mensaje = document.getElementById('mensaje');
  const panelMarco = document.getElementById('panelMarcoFuncional');

  const modal = document.getElementById('modalBase');
  const modalBody = document.getElementById('modalBody');
  const modalFooter = document.getElementById('modalFooter');
  const cerrarModalBtn = document.getElementById('cerrarModal');

  cerrarModalBtn?.addEventListener('click', cerrarModal);

  /* ======================================================
     FETCH SEGURO
  ====================================================== */

  async function apiFetch(url, options = {}) {

    const headers = {
      Authorization: `Bearer ${token}`,
      ...(options.headers || {})
    };

    if (options.body) {
      headers['Content-Type'] = 'application/json';
    }

    const resp = await fetch(url,{
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

  /* ======================================================
     UTILIDADES
  ====================================================== */

  function capitalizar(texto){
    if(!texto) return '-';
    const limpio = texto.toString().toLowerCase().trim();
    return limpio.charAt(0).toUpperCase() + limpio.slice(1);
  }

  function formatearFecha(fechaISO){
    if(!fechaISO) return '-';
    return new Date(fechaISO).toLocaleDateString('es-CO');
  }

  function formatearDisposicion(valor){

    if(!valor) return '-';

    const mapa = {
      conservacion_total: 'Conservación total',
      eliminacion: 'Eliminación',
      seleccion: 'Selección',
      medio_tecnico: 'Medio técnico (Microfilmación o digitalización)'
    };

    const clave = valor
      .toString()
      .toLowerCase()
      .replace(/\s+/g,'_')
      .trim();

    return mapa[clave] || 'Eliminación';
  }

  function badgeEstado(estado){

    const normalizado = (estado || 'borrador').toLowerCase();

    const clases = {
      borrador:'badge-neutral',
      identificada:'badge-warning',
      caracterizada:'badge-info',
      analizada:'badge-success',
      completa:'badge-success'
    };

    return `
      <span class="badge ${clases[normalizado] || 'badge-neutral'}">
        ${capitalizar(normalizado)}
      </span>
    `;
  }

  function cerrarModal(){
    modal?.classList.add('hidden');
    if(modalBody) modalBody.innerHTML='';
    if(modalFooter) modalFooter.innerHTML='';
  }

  function mostrarError(texto){
    mensaje.innerHTML=`
      <div class="alert-error">
        ${texto}
      </div>
    `;
  }

  nuevaActividadBtn?.addEventListener('click',()=>{
    window.location.href='/segtec/actividad.html';
  });

  /* ======================================================
     DESCARGAR PDF
  ====================================================== */

  async function descargarPDFActividad(id){

    try{

      const resp = await fetch(`/api/segtec/actividades/${id}/pdf`,{
        headers:{
          Authorization:`Bearer ${token}`
        }
      });

      if(resp.status===401){
        sessionStorage.clear();
        localStorage.clear();
        window.location.href='/';
        return;
      }

      if(!resp.ok){
        const text = await resp.text();
        throw new Error(text || 'Error generando PDF');
      }

      const blob = await resp.blob();
      const url = window.URL.createObjectURL(blob);

      const isSafari =
        /^((?!chrome|android).)*safari/i.test(navigator.userAgent);

      if(isSafari){
        window.open(url,'_blank');
      }else{
        const a=document.createElement('a');
        a.href=url;
        a.download=`actividad_${id}.pdf`;
        document.body.appendChild(a);
        a.click();
        a.remove();
      }

      setTimeout(()=>{
        window.URL.revokeObjectURL(url);
      },1500);

    }catch(error){
      console.error(error);
      alert('Error generando el PDF.');
    }

  }

  /* ======================================================
     MODAL DE ANÁLISIS (AJUSTE)
  ====================================================== */

  async function abrirModalAnalisis(id){

    try{

      const resp = await apiFetch(
        `/api/segtec/actividades/${id}/analizar`,
        { method:'POST' }
      );

      if(!resp) return;

      const json = await resp.json();

      if(!json.ok){
        alert('No se pudo generar el análisis.');
        return;
      }

      const a = json.data || {};

      const serie = a.serie || a.serie_propuesta || '-';
      const subserie = a.subserie || a.subserie_propuesta || '-';

      modalBody.innerHTML = `
        <h3>Análisis técnico de la actividad</h3>

        <div class="grid-3">

          <div class="grid-item">
            <label>Serie documental sugerida:</label>
            <strong>${serie}</strong>
          </div>

          <div class="grid-item">
            <label>Subserie sugerida:</label>
            <strong>${subserie}</strong>
          </div>

          <div class="grid-item">
            <label>Retención archivo de gestión:</label>
            <strong>${a.retencion_gestion || '-'} años</strong>
          </div>

          <div class="grid-item">
            <label>Retención archivo central:</label>
            <strong>${a.retencion_central || '-'} años</strong>
          </div>

          <div class="grid-item">
            <label>Disposición final:</label>
            <strong>${formatearDisposicion(a.disposicion_final)}</strong>
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

    }catch(error){
      console.error(error);
      alert('Error generando análisis.');
    }

  }

  /* ======================================================
     MARCO FUNCIONAL (AJUSTE)
  ====================================================== */

  async function cargarMarcoFuncional(){

    try{

      const resp = await apiFetch('/api/segtec/configuracion');
      if(!resp) return false;

      const json = await resp.json();

      if(!resp.ok || !json.ok || !json.configuracion){

        panelMarco.innerHTML=`
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
        tablaContainer.innerHTML='';

        document
        .getElementById('btnConfigurar')
        ?.addEventListener('click',()=>{
          window.location.href='/segtec/configuracion.html';
        });

        return false;
      }

      const c=json.configuracion;

      panelMarco.innerHTML=`
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

    }catch(err){
      console.error(err);
      mostrarError('Error cargando configuración funcional.');
      return false;
    }

  }

  /* ======================================================
     ACTIVIDADES
  ====================================================== */

  async function cargarActividades(){

    try{

      const resp = await apiFetch('/api/segtec/actividades');
      if(!resp) return;

      const json = await resp.json();

      if(!resp.ok || !json.ok){
        mostrarError('Error cargando actividades.');
        return;
      }

      const actividades = json.data || [];

      if(!actividades.length){

        tablaContainer.innerHTML=`
          <div class="empty-state">
            <h3>No hay actividades técnicas registradas aún.</h3>
            <p>Al crear una nueva actividad, iniciará el proceso técnico.</p>
          </div>
        `;

        return;
      }

      renderTabla(actividades);

    }catch(error){
      console.error(error);
      mostrarError('Error de conexión con el servidor.');
    }

  }

  /* ======================================================
     TABLA (SIN CAMBIOS)
  ====================================================== */

  function renderTabla(actividades){

    const filas = actividades.map(a=>{

      const fecha = formatearFecha(a.created_at);
      const estado = (a.estado_general || '').toLowerCase().trim();

      let botonAnalizar='';

      if(
        (estado==='caracterizada' || estado==='analizada')
        && puedeAnalizar
      ){

        const textoBoton =
          estado==='analizada'
          ? 'Reanalizar'
          : 'Analizar';

        botonAnalizar=`
          <button
            class="btn-warning btn-sm analizar-btn"
            data-id="${a.id}">
            ${textoBoton}
          </button>
        `;
      }

      return `
        <tr>
          <td><strong>${a.nombre || '-'}</strong></td>
          <td>${capitalizar(a.frecuencia)}</td>
          <td>${badgeEstado(a.estado_general)}</td>
          <td>${fecha}</td>
          <td class="acciones">

            <button
              class="btn-primary btn-sm abrir-btn"
              data-id="${a.id}">
              Abrir
            </button>

            ${botonAnalizar}

            <button
              class="btn-secondary btn-sm pdf-btn"
              data-id="${a.id}">
              PDF
            </button>

          </td>
        </tr>
      `;
    });

    tablaContainer.innerHTML=`
      <div style="width:100%;">
        <table class="table" style="width:100%;">
          <thead>
            <tr>
              <th>Actividad</th>
              <th>Frecuencia</th>
              <th>Estado</th>
              <th>Creado</th>
              <th style="width:190px;">Acciones</th>
            </tr>
          </thead>
          <tbody>
            ${filas.join('')}
          </tbody>
        </table>
      </div>
    `;

    tablaContainer
    .querySelectorAll('.abrir-btn')
    .forEach(btn=>{
      btn.addEventListener('click',()=>{
        const id=btn.dataset.id;
        window.location.href=
        `/segtec/actividad.html?id=${id}`;
      });
    });

    tablaContainer
    .querySelectorAll('.pdf-btn')
    .forEach(btn=>{
      btn.addEventListener('click',()=>{
        const id=btn.dataset.id;
        descargarPDFActividad(id);
      });
    });

    tablaContainer
    .querySelectorAll('.analizar-btn')
    .forEach(btn=>{
      btn.addEventListener('click',()=>{
        const id = btn.dataset.id;
        abrirModalAnalisis(id);
      });
    });

  }

  const configuracionOk = await cargarMarcoFuncional();

  if(configuracionOk){
    await cargarActividades();
  }

});