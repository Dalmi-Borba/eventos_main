// public/sw.js
const CACHE_NAME = 'inscricoes-cache-v7';

const APP_SHELL = [
  '/',
  '/frontend.js',
  '/sw.js',
  '/index.html',
  '/styles.css',
  '/manifest.json'
];

self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE_NAME).then(c => c.addAll(APP_SHELL))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.map(k => k !== CACHE_NAME && k.startsWith('inscricoes-cache-') ? caches.delete(k) : null))
    ).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET') return;

  const url = new URL(req.url);
  const sameOrigin = url.origin === self.location.origin;

  // 1) Navegações -> Cache First (App Shell)
  if (req.mode === 'navigate') {
    e.respondWith(
      caches.match('/index.html').then(r => r || caches.match('/')) // tenta index, senão raiz
        .then(r => r || fetch(req).catch(() => new Response('<h1>Offline</h1>', { headers:{'Content-Type':'text/html'} })))
    );
    return;
  }

  // 2) APIs da mesma origem -> Network First com fallback ao cache (última resposta boa) ou vazio
  if (sameOrigin && url.pathname.startsWith('/api/')) {
    e.respondWith(
      fetch(req).then(res => {
        if (res.ok) {
          const copy = res.clone();
          caches.open(CACHE_NAME).then(c => c.put(req, copy));
        }
        return res;
      }).catch(async () => {
        const cached = await caches.match(req);
        if (cached) return cached;
        return new Response(JSON.stringify({ offline: true, data: [] }), {
          headers: { 'Content-Type': 'application/json' }, status: 200
        });
      })
    );
    return;
  }

  // 3) Estáticos da mesma origem -> Cache First com atualização em segundo plano
  if (sameOrigin && /\.(?:js|css|png|jpg|jpeg|svg|webp|ico|html|json)$/.test(url.pathname)) {
    e.respondWith((async () => {
      const cache = await caches.open(CACHE_NAME);
      const cached = await cache.match(req);
      const net = fetch(req).then(res => {
        if (res && res.status === 200) cache.put(req, res.clone());
        return res;
      }).catch(() => null);
      return cached || net || new Response('', { status: 504 });
    })());
    return;
  }

  // 4) Outras origens -> tenta cache, senão rede
  e.respondWith(
    caches.match(req).then(c => c || fetch(req).catch(() => new Response('', { status: 504 })))
  );
});
