const CACHE_NAME = 'luminaai-v2';
const STATIC_ASSETS = [
  '/manifest.webmanifest',
  '/icons/lumina-premium-192.png',
  '/icons/lumina-premium-192-maskable.png',
  '/icons/lumina-premium-512.png',
  '/icons/lumina-premium-512-maskable.png',
  '/icons/lumina-premium-apple-touch.png',
  '/screenshots/home-install-preview.png'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(STATIC_ASSETS)).catch(() => undefined)
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => Promise.all(keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))))
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  const request = event.request;
  const url = new URL(request.url);

  if (request.method !== 'GET') return;
  if (url.pathname.startsWith('/api/')) return;

  if (STATIC_ASSETS.includes(url.pathname) || url.pathname.startsWith('/icons/')) {
    event.respondWith(
      caches.match(request).then((cached) => cached || fetch(request))
    );
  }
});
