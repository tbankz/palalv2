const CACHE_NAME = 'palal-shell-v2';
const APP_SHELL = [
  './',
  './index.html',
  './styles.css',
  './script.js',
  './manifest.json',
  './icons/icon-192.png',
  './icons/icon-512.png'
];

self.addEventListener('install', function(event) {
  event.waitUntil(
    caches.open(CACHE_NAME).then(function(cache) {
      return cache.addAll(APP_SHELL);
    }).then(function() {
      return self.skipWaiting();
    })
  );
});

self.addEventListener('activate', function(event) {
  event.waitUntil(
    caches.keys().then(function(names) {
      return Promise.all(
        names.filter(function(name) { return name !== CACHE_NAME; })
             .map(function(name) { return caches.delete(name); })
      );
    }).then(function() {
      return self.clients.claim();
    })
  );
});

// HTML/CSS/JS are network-first (fresh code every load, cache is just the
// offline fallback) — this app changes constantly, so a stale cache-first
// shell would silently hide new features from anyone with the SW installed.
self.addEventListener('fetch', function(event) {
  const req = event.request;
  if (req.method !== 'GET') return;

  const url = new URL(req.url);
  const isShellRequest = url.origin === self.location.origin;
  if (!isShellRequest) return;

  const isNetworkFirst = req.mode === 'navigate' ||
    /\.(html|css|js)$/.test(url.pathname) ||
    url.pathname === self.registration.scope.replace(self.location.origin, '');

  if (isNetworkFirst) {
    event.respondWith(
      fetch(req).then(function(res) {
        if (res.ok) {
          const copy = res.clone();
          caches.open(CACHE_NAME).then(function(cache) { cache.put(req, copy); });
        }
        return res;
      }).catch(function() {
        return caches.match(req).then(function(cached) {
          return cached || caches.match('./index.html');
        });
      })
    );
    return;
  }

  // Static assets (icons, manifest) — cache-first is fine, they rarely change.
  event.respondWith(
    caches.match(req).then(function(cached) {
      if (cached) return cached;
      return fetch(req).then(function(res) {
        if (res.ok) {
          const copy = res.clone();
          caches.open(CACHE_NAME).then(function(cache) { cache.put(req, copy); });
        }
        return res;
      });
    })
  );
});
