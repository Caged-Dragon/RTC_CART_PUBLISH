const CACHE = 'rt-crackers-cart-v5-asset-mime-fix';
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

  // Hashed build assets may be cached only when the response matches the requested asset.
  // A hosting fallback can otherwise return index.html (text/html) for a missing CSS/JS file,
  // which causes strict MIME errors and leaves the whole application unstyled.
  if (url.pathname.startsWith('/assets/')) {
    event.respondWith((async () => {
      const cache = await caches.open(CACHE);
      const cached = await cache.match(event.request);
      if (cached) {
        const cachedType = (cached.headers.get('content-type') || '').toLowerCase();
        const wantsCss = url.pathname.endsWith('.css');
        const wantsJs = /\.(?:js|mjs)$/.test(url.pathname);
        const cacheMatches = !cachedType.includes('text/html')
          && (!wantsCss || cachedType.includes('text/css'))
          && (!wantsJs || (cachedType.includes('javascript') || cachedType.includes('ecmascript')));
        if (cacheMatches) return cached;
        await cache.delete(event.request);
      }

      try {
        const response = await fetch(event.request, { cache: 'no-cache' });
        const type = (response.headers.get('content-type') || '').toLowerCase();
        const wantsCss = url.pathname.endsWith('.css');
        const wantsJs = /\.(?:js|mjs)$/.test(url.pathname);
        const matchesAsset = response.ok && !type.includes('text/html')
          && (!wantsCss || type.includes('text/css'))
          && (!wantsJs || (type.includes('javascript') || type.includes('ecmascript')));
        if (matchesAsset) {
          await cache.put(event.request, response.clone()).catch(() => {});
          return response;
        }
        // Do not let a SPA fallback masquerade as a stylesheet or script.
        return new Response('Build asset not found or served with an invalid MIME type. Deploy a complete fresh dist/ build.', {
          status: 404,
          statusText: 'Build asset missing',
          headers: { 'Content-Type': 'text/plain; charset=utf-8', 'Cache-Control': 'no-store' }
        });
      } catch {
        return new Response('Build asset unavailable offline. Reconnect and reload the site.', {
          status: 503,
          statusText: 'Offline',
          headers: { 'Content-Type': 'text/plain; charset=utf-8', 'Cache-Control': 'no-store' }
        });
      }
    })());
    return;
  }
  event.respondWith(fetch(event.request).catch(async () => (await caches.match(event.request)) || new Response('You are offline. Reconnect to load this resource.', { status: 503, statusText: 'Offline', headers: { 'Content-Type': 'text/plain; charset=utf-8' } })));
});
