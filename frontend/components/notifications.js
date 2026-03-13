let container = null;

function ensureContainer() {
  if (container) return;

  // Reutiliza si ya existe en el HTML
  container = document.getElementById('sipad-notifications');

  if (!container) {
    container = document.createElement('div');
    container.id = 'sipad-notifications';
    document.body.appendChild(container);
  }
}

export function notify(message, type = 'success', duration = 2500) {

  ensureContainer();

  const toast = document.createElement('div');
  toast.className = `sipad-toast ${type}`;
  toast.innerText = message;

  container.appendChild(toast);

  // animación
  requestAnimationFrame(() => {
    toast.classList.add('visible');
  });

  setTimeout(() => {
    toast.classList.remove('visible');
    setTimeout(() => toast.remove(), 300);
  }, duration);
}

// 👇 Esto hace que notify exista también en window (global)
if (typeof window !== 'undefined') {
  window.notify = notify;
}