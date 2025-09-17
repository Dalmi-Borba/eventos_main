const CACHE_NAME = 'inscricoes-cache-v4';
const ASSETS = [
  './',            // Garante que / seja cacheado
  'index.html',
  'styles.css',
  'frontend.js',
  'manifest.json',
  'sw.js'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(ASSETS))
  );
  self.skipWaiting();
});

self.addEventListener('activate', event => {
  const cacheWhitelist = [CACHE_NAME];
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (!cacheWhitelist.includes(cacheName)) {
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', event => {
  const req = event.request;
  const url = new URL(req.url);

  // Ignora requisições para o CouchDB, /api/ ou métodos não-GET

  if (url.host === 'couch.intranet-app.duckdns.org' || url.pathname.startsWith('/api/') || req.method !== 'GET') {
    return event.respondWith(
      fetch(req).catch(() => {
        if (req.mode === 'navigate') {
          return caches.match('index.html');
        }
      })
    );
  }

  // Para navegação no SPA: sempre responda com index.html
  if (req.mode === 'navigate') {
    return event.respondWith(caches.match('index.html'));
  }

  // Primeiro tenta cache, depois rede, e atualiza cache
  event.respondWith(
    caches.match(req).then(cached => {
      if (cached) return cached;
      return fetch(req).then(networkRes => {
        // Só armazena no cache se a URL começar com http ou https
        if (url.protocol.startsWith('http')) {
          caches.open(CACHE_NAME).then(cache => {
            cache.put(req, networkRes.clone());
          });
        }
        return networkRes;
      }).catch(() => {
        // Fallback para index.html se for requisição de navegação
        if (req.mode === 'navigate') {
          return caches.match('index.html');
        }
      });
    })
  );
});