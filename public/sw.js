const CACHE_NAME = 'luminaai-v4';
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

self.addEventListener('push', (event) => {
  let payload = {};

  try {
    payload = event.data ? event.data.json() : {};
  } catch {
    payload = { body: event.data ? event.data.text() : '' };
  }

  const title = payload.title || 'LuminaAI';
  const options = {
    body: payload.body || payload.message || 'Voce tem um novo lembrete no LuminaAI.',
    icon: '/icons/lumina-premium-192.png',
    badge: '/icons/lumina-premium-192-maskable.png',
    data: {
      url: payload.url || '/',
    },
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const targetUrl = event.notification.data?.url || '/';

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientsList) => {
      const matchingClient = clientsList.find((client) => client.url.includes(targetUrl));
      if (matchingClient) return matchingClient.focus();
      return self.clients.openWindow(targetUrl);
    })
  );
});
