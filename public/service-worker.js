// SIPAD Service Worker (placeholder)
// Se activará en la FASE de offline real

self.addEventListener('install', () => {
  self.skipWaiting();
});

self.addEventListener('activate', () => {
  self.clients.claim();
});
