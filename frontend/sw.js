/* SIPAD — Service Worker
 * Estrategia:
 *   - Navegaciones (documentos HTML): network-first con reserva a caché y luego a /offline.html.
 *   - API (/api/...): network-only. Nunca se sirve datos del banco desde caché para no mostrar
 *     información desactualizada; si no hay red, el front maneja el error como está hoy.
 *   - Estáticos propios (css/js/img/fuentes/manifest/iconos): stale-while-revalidate.
 *   - Terceros (Google Fonts, etc.): cache-first best-effort, sin romper si falla.
 * Al cambiar la versión se limpian los cachés viejos.
 */
'use strict';

const VERSION = 'sipad-v1';
const STATIC_CACHE = `${VERSION}-static`;
const RUNTIME_CACHE = `${VERSION}-runtime`;

// Núcleo mínimo para arrancar sin red. Se mantiene corto a propósito:
// el resto se cachea sobre la marcha (stale-while-revalidate).
const PRECACHE = [
  '/offline.html',
  '/manifest.webmanifest',
  '/icons/icon-192.png',
  '/icons/icon-512.png'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(STATIC_CACHE)
      .then((cache) => cache.addAll(PRECACHE))
      .catch(() => {}) // que un ícono ausente no bloquee la instalación
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys.filter((k) => !k.startsWith(VERSION)).map((k) => caches.delete(k))
      )
    ).then(() => self.clients.claim())
  );
});

function isApi(url) {
  return url.pathname.startsWith('/api/');
}

function isStaticAsset(url) {
  return /\.(?:css|js|mjs|png|jpg|jpeg|svg|webp|gif|ico|woff2?|ttf|otf|webmanifest|json)$/i.test(url.pathname)
      || url.pathname.startsWith('/icons/');
}

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;

  const url = new URL(req.url);
  const sameOrigin = url.origin === self.location.origin;

  // API: siempre a la red, nunca desde caché.
  if (sameOrigin && isApi(url)) {
    return; // deja pasar el fetch normal del navegador
  }

  // Navegaciones (abrir la app / recargar una vista): network-first.
  if (req.mode === 'navigate') {
    event.respondWith(
      fetch(req)
        .then((res) => {
          const copy = res.clone();
          caches.open(RUNTIME_CACHE).then((c) => c.put(req, copy)).catch(() => {});
          return res;
        })
        .catch(async () => {
          const cached = await caches.match(req);
          if (cached) return cached;
          const offline = await caches.match('/offline.html');
          return offline || new Response('Sin conexión', {
            status: 503, headers: { 'Content-Type': 'text/plain; charset=utf-8' }
          });
        })
    );
    return;
  }

  // Estáticos propios: stale-while-revalidate.
  if (sameOrigin && isStaticAsset(url)) {
    event.respondWith(
      caches.open(RUNTIME_CACHE).then(async (cache) => {
        const cached = await cache.match(req);
        const network = fetch(req)
          .then((res) => {
            if (res && res.status === 200) cache.put(req, res.clone());
            return res;
          })
          .catch(() => null);
        return cached || network || fetch(req);
      })
    );
    return;
  }

  // Terceros (fuentes de Google, etc.): cache-first suave.
  if (!sameOrigin) {
    event.respondWith(
      caches.open(RUNTIME_CACHE).then(async (cache) => {
        const cached = await cache.match(req);
        if (cached) return cached;
        try {
          const res = await fetch(req);
          if (res && (res.status === 200 || res.type === 'opaque')) {
            cache.put(req, res.clone());
          }
          return res;
        } catch (e) {
          return cached || Response.error();
        }
      })
    );
  }
});
