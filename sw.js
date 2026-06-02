const CACHE = 'tablas-v4';
const ASSETS = [
  '/App---Tablas-de-multiplicar/tablas-multiplicar.html',
  '/App---Tablas-de-multiplicar/manifest.json',
  '/App---Tablas-de-multiplicar/icon-192.png',
  '/App---Tablas-de-multiplicar/icon-512.png',
];

// Install: cache all assets
self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE)
      .then(c => c.addAll(ASSETS))
      .then(() => self.skipWaiting()) // activate immediately, don't wait
  );
});

// Activate: delete old caches and take control immediately
self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(
        keys.filter(k => k !== CACHE).map(k => caches.delete(k))
      ))
      .then(() => self.clients.claim()) // take control of all tabs immediately
  );
});

// Fetch strategy:
// - HTML: network first, fall back to cache
// - Everything else: cache first, fall back to network
self.addEventListener('fetch', e => {
  const url = new URL(e.request.url);
  const isHTML = e.request.destination === 'document' || url.pathname.endsWith('.html');

  if (isHTML) {
    // Network first for HTML — always tries to get fresh version
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
    // Cache first for assets (icons, manifest)
    e.respondWith(
      caches.match(e.request)
        .then(cached => cached || fetch(e.request))
    );
  }
});

// Listen for message from page to skip waiting
self.addEventListener('message', e => {
  if (e.data === 'skipWaiting') self.skipWaiting();
});
