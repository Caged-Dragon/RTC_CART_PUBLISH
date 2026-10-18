const CACHE = 'rt-crackers-cart-v4';
const SHELL = ['/', '/index.html', '/manifest.webmanifest', '/rt-icon-192.png', '/rt-icon-512.png'];

self.addEventListener('install', event => {
  // Cache each file independently: one missing file must never stop the worker from installing.
  event.waitUntil(
    caches.open(CACHE)
      .then(cache => Promise.all(SHELL.map(url => cache.add(url).catch(() => {}))))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET') return;
  const url = new URL(event.request.url);
  if (url.origin !== self.location.origin) return;   // never cache Supabase / API traffic

  const acceptsHtml = (event.request.headers.get('accept') || '').includes('text/html');
  if (event.request.mode === 'navigate' || (url.pathname === '/login' && acceptsHtml)) {
    event.respondWith(
      fetch(event.request)
        .then(response => {
          if (response.ok) {
            const copy = response.clone();
            caches.open(CACHE).then(c => c.put('/index.html', copy)).catch(() => {});
          }
          return response;
        })
        .catch(async () => {
          // A deep link such as /login must still boot the SPA while offline.
          const cachedPage = await caches.match(event.request)
            || await caches.match('/index.html')
            || await caches.match('/');
          return cachedPage || new Response(
            'You are offline. Reconnect to the internet and try again.',
            { status: 503, statusText: 'Offline', headers: { 'Content-Type': 'text/plain; charset=utf-8' } }
          );
        })
    );
    return;
  }

  // Hashed build assets are immutable -> cache-first. Everything else -> network-first.
  if (url.pathname.startsWith('/assets/')) {
    event.respondWith(
      caches.match(event.request).then(cached => cached || fetch(event.request).then(response => {
        if (response.ok) { const copy = response.clone(); caches.open(CACHE).then(c => c.put(event.request, copy)).catch(() => {}); }
        return response;
      }))
    );
    return;
  }
  event.respondWith(fetch(event.request).catch(async () => (await caches.match(event.request)) || new Response('You are offline. Reconnect to load this resource.', { status: 503, statusText: 'Offline', headers: { 'Content-Type': 'text/plain; charset=utf-8' } })));
});
