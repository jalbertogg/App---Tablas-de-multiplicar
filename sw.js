const CACHE = 'tablas-v5';
const ASSETS = [
  '/App---Tablas-de-multiplicar/tablas-multiplicar.html',
  '/App---Tablas-de-multiplicar/manifest.json',
  '/App---Tablas-de-multiplicar/icon-192.png',
  '/App---Tablas-de-multiplicar/icon-512.png',
];

// Install: cache assets and skip waiting immediately
self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE)
      .then(c => c.addAll(ASSETS))
      .then(() => self.skipWaiting()) // Don't wait — activate immediately
  );
});

// Activate: delete old caches, take control of all clients immediately
self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(
        keys.filter(k => k !== CACHE).map(k => caches.delete(k))
      ))
      .then(() => self.clients.claim()) // Take control without waiting for reload
  );
});

// Fetch: network first for HTML, cache first for assets
self.addEventListener('fetch', e => {
  const isHTML = e.request.destination === 'document' ||
                 e.request.url.endsWith('.html');

  if (isHTML) {
    e.respondWith(
      fetch(e.request)
        .then(res => {
          const clone = res.clone();
          caches.open(CACHE).then(c => c.put(e.request, clone));
          return res;
        })
        .catch(() => caches.match(e.request))
    );
  } else {
    e.respondWith(
      caches.match(e.request)
        .then(cached => cached || fetch(e.request))
    );
  }
});

// skipWaiting on message from page
self.addEventListener('message', e => {
  if (e.data === 'skipWaiting') self.skipWaiting();
});
