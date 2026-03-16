document.addEventListener('DOMContentLoaded', () => {

  const form = document.getElementById('loginForm');
  const mensaje = document.getElementById('mensaje');

  if (!form) return;

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

        sessionStorage.setItem('token', json.token);
        sessionStorage.setItem('user', JSON.stringify(json.user));
        sessionStorage.setItem('lastActivity', Date.now());

        window.location.href = '/home/index.html'

      } else {

        mensaje.textContent = json.error || 'Credenciales inválidas';

      }

    } catch {

      mensaje.textContent = 'Error de conexión con el servidor';

    }

  });

});