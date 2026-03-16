document.addEventListener('DOMContentLoaded', () => {

  // 🔐 Si ya existe token → ir directo a /home
  const existingToken = sessionStorage.getItem('token');
  if (existingToken) {
    window.location.href = '/home';
    return;
  }

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

        // ✅ Guardar sesión (SE BORRA AL CERRAR NAVEGADOR)
        sessionStorage.setItem('token', json.token);
        sessionStorage.setItem('user', JSON.stringify(json.user));

        // 🕒 Registrar actividad inicial
        sessionStorage.setItem('lastActivity', Date.now());

        // 🚀 Redirección correcta
        window.location.href = '/home';

      } else {
        mensaje.textContent = json.error || 'Credenciales inválidas';
      }

    } catch (err) {
      mensaje.textContent = 'Error de conexión con el servidor';
    }

  });

});