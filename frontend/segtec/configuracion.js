import { renderHeader } from '/components/header.js';

document.addEventListener('DOMContentLoaded', async () => {

  const token = sessionStorage.getItem('token');
  const userRaw = localStorage.getItem('user');

  if (!token || !userRaw) {
    window.location.href = '/';
    return;
  }

  renderHeader({
    modulo: 'SEG-TEC',
    seccion: 'Configuración funcional'
  });

  const form = document.getElementById('formConfiguracion');
  const btnCancelar = document.getElementById('btnCancelar');

  if (!form) {
    console.error('Formulario formConfiguracion no encontrado');
    return;
  }

  /* ===============================
     BOTÓN CANCELAR
  =============================== */

  if (btnCancelar) {

    btnCancelar.addEventListener('click', () => {

      window.location.href = '/segtec/segtec.html';

    });

  }

  /* ===============================
     TOAST
  =============================== */

  function showToast(message, type = 'success') {

    const toast = document.createElement('div');
    toast.innerText = message;

    toast.style.position = 'fixed';
    toast.style.top = '50%';
    toast.style.left = '50%';
    toast.style.transform = 'translate(-50%, -50%) scale(0.95)';
    toast.style.padding = '16px 22px';
    toast.style.borderRadius = '8px';
    toast.style.fontSize = '15px';
    toast.style.fontWeight = '500';
    toast.style.color = 'white';
    toast.style.opacity = '0';
    toast.style.transition = 'all 0.25s ease';
    toast.style.zIndex = '9999';
    toast.style.boxShadow = '0 10px 25px rgba(0,0,0,0.15)';
    toast.style.background =
      type === 'error' ? '#c82333' : '#1e7e34';

    document.body.appendChild(toast);

    setTimeout(() => {
      toast.style.opacity = '1';
      toast.style.transform = 'translate(-50%, -50%) scale(1)';
    }, 10);

    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translate(-50%, -50%) scale(0.95)';
      setTimeout(() => toast.remove(), 300);
    }, 1600);
  }

  /* ===============================
     NORMALIZAR TEXTO
  =============================== */

  function normalizar(valor){

    if(!valor) return '';

    return valor
      .toString()
      .toLowerCase()
      .trim()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "");

  }

  /* ===============================
     CARGAR CONFIGURACIÓN
  =============================== */

  async function cargarConfiguracion() {

    try {

      const resp = await fetch('/api/segtec/configuracion', {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      if (resp.status === 401) {

        sessionStorage.clear();
        localStorage.clear();
        window.location.href = '/';
        return;

      }

      if (!resp.ok) return;

      const json = await resp.json();

      if (!json || !json.ok || !json.configuracion) return;

      const config = json.configuracion;

      /* ===============================
         TIPO FUNCIÓN
      =============================== */

      const selectTipo = form.querySelector('select[name="tipo_funcion"]');

      if (selectTipo && config.tipo_funcion) {

        const valor = normalizar(config.tipo_funcion);

        const opciones = [...selectTipo.options];

        const match = opciones.find(o => normalizar(o.value) === valor);

        if (match) {
          selectTipo.value = match.value;
        }

      }

      /* ===============================
         NIVEL DECISORIO
      =============================== */

      const selectNivel = form.querySelector('select[name="nivel_decisorio"]');

      if (selectNivel && config.nivel_decisorio) {

        const valor = normalizar(config.nivel_decisorio);

        const opciones = [...selectNivel.options];

        const match = opciones.find(o => normalizar(o.value) === valor);

        if (match) {
          selectNivel.value = match.value;
        }

      }

      /* ===============================
         CHECKBOX BOOLEANOS
      =============================== */

      ['recibe_solicitudes','emite_actos','produce_decisiones']
      .forEach(field => {

        const checkbox = form.querySelector(`input[name="${field}"]`);

        if (!checkbox) return;

        const valor = config[field];

        if (
          valor === 1 ||
          valor === true ||
          valor === '1' ||
          valor === 'true'
        ) {

          checkbox.checked = true;

        }

      });

      /* ===============================
         TEXTAREAS
      =============================== */

      [
        'procesos_principales',
        'tramites_frecuentes',
        'tipo_decisiones',
        'otros_documentos',
        'descripcion_funcional'
      ].forEach(field => {

        const input = form.querySelector(`[name="${field}"]`);

        if (input && config[field]) {

          input.value = config[field];

        }

      });

      /* ===============================
         TIPOS DOCUMENTALES
      =============================== */

      if (config.tipos_documentales) {

        let tipos = [];

        try {

          tipos = JSON.parse(config.tipos_documentales);

        } catch {

          tipos = [];

        }

        if (Array.isArray(tipos)) {

          tipos.forEach(valor => {

            const checkbox = form.querySelector(
              `input[name="tipos_documentales"][value="${valor}"]`
            );

            if (checkbox) checkbox.checked = true;

          });

        }

      }

    } catch (err) {

      console.error('Error cargando configuración:', err);

    }

  }

  /* ===============================
     GUARDAR CONFIGURACIÓN
  =============================== */

  form.addEventListener('submit', async (e) => {

    e.preventDefault();

    const formData = new FormData(form);

    const data = {

      tipo_funcion: formData.get('tipo_funcion') || null,

      nivel_decisorio: formData.get('nivel_decisorio') || null,

      procesos_principales: formData.get('procesos_principales') || '',

      tramites_frecuentes: formData.get('tramites_frecuentes') || '',

      tipo_decisiones: formData.get('tipo_decisiones') || '',

      otros_documentos: formData.get('otros_documentos') || '',

      descripcion_funcional: formData.get('descripcion_funcional') || '',

      recibe_solicitudes:
        form.querySelector('input[name="recibe_solicitudes"]')?.checked || false,

      emite_actos:
        form.querySelector('input[name="emite_actos"]')?.checked || false,

      produce_decisiones:
        form.querySelector('input[name="produce_decisiones"]')?.checked || false,

      tipos_documentales:
        formData.getAll('tipos_documentales')

    };

    try {

      const resp = await fetch('/api/segtec/configuracion', {

        method: 'POST',

        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        },

        body: JSON.stringify(data)

      });

      if (resp.status === 401) {

        sessionStorage.clear();
        localStorage.clear();
        window.location.href = '/';
        return;

      }

      const json = await resp.json();

      if (!resp.ok || !json.ok) {

        showToast(json.error || 'Error guardando estructura', 'error');
        return;

      }

      showToast('Estructura funcional registrada correctamente.');

      setTimeout(() => {

        window.location.href = '/segtec/segtec.html';

      }, 1700);

    } catch (err) {

      console.error(err);

      showToast('Error de conexión.', 'error');

    }

  });

  await cargarConfiguracion();

});