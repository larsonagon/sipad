document.addEventListener('DOMContentLoaded', () => {

  // ======================================================
  // VALIDAR TOKEN EXISTENTE
  // ======================================================

  const existingToken = sessionStorage.getItem('token');

  if (existingToken) {

    try {

      const payload = JSON.parse(atob(existingToken.split('.')[1]));

      const exp = payload.exp ? payload.exp * 1000 : null;
      const now = Date.now();

      // Si el token sigue vigente
      if (!exp || exp > now) {
        window.location.href = '/home';
        return;
      }

      // Token expirado
      sessionStorage.removeItem('token');
      sessionStorage.removeItem('user');
      sessionStorage.removeItem('lastActivity');

    } catch {

      // Token corrupto
      sessionStorage.removeItem('token');
      sessionStorage.removeItem('user');
      sessionStorage.removeItem('lastActivity');

    }

  }

  // ======================================================
  // ELEMENTOS
  // ======================================================

  const form = document.getElementById('loginForm');
  const mensaje = document.getElementById('mensaje');

  if (!form) return;

  // ======================================================
  // LOGIN
  // ======================================================

  form.addEventListener('submit', async (e) => {

    e.preventDefault();

    const username = document.getElementById('usuario').value.trim();
    const password = document.getElementById('password').value.trim();

    mensaje.textContent = '';
    mensaje.style.color = 'red';

    if (!username || !password) {

      mensaje.textContent = 'Debe ingresar usuario y contraseña';
      return;

    }

    try {

      const resp = await fetch('/api/auth/login', {

        method: 'POST',

        headers: {
          'Content-Type': 'application/json'
        },

        body: JSON.stringify({ username, password })

      });

      const json = await resp.json();

      if (resp.ok && json.token) {

        // ======================================================
        // GUARDAR SESIÓN
        // ======================================================

        sessionStorage.setItem('token', json.token);
        sessionStorage.setItem('user', JSON.stringify(json.user));
        sessionStorage.setItem('lastActivity', Date.now());

        // ======================================================
        // REDIRECCIÓN
        // ======================================================

        window.location.href = '/home';

      } else {

        mensaje.textContent = json.error || 'Credenciales inválidas';

      }

    } catch (err) {

      mensaje.textContent = 'Error de conexión con el servidor';

    }

  });

});