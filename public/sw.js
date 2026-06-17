/* PWA service worker: offline shell + static asset caching.
   Navigation pages are private/no-store so we never try to cache them —
   Chrome 117+ silently drops those puts, leaving nothing to serve offline.
   Instead we just fall back to the precached /offline page. */
const CACHE = 'salat-v2';
const OFFLINE_URL = '/offline';
const PRECACHE = [OFFLINE_URL, '/icons/icon-192.png', '/icons/icon-512.png'];

self.addEventListener('install', event => {
  event.waitUntil(
    caches
      .open(CACHE)
      .then(cache => cache.addAll(PRECACHE))
      .then(() => self.skipWaiting()),
  );
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches
      .keys()
      .then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim()),
  );
});

self.addEventListener('fetch', event => {
  const { request } = event;
  if (request.method !== 'GET') return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;
  if (url.pathname.startsWith('/api')) return;

  // Navigation: network-first, fall back to /offline.
  // Don't cache the response — authenticated pages are private/no-store.
  if (request.mode === 'navigate') {
    event.respondWith(fetch(request).catch(() => caches.match(OFFLINE_URL)));
    return;
  }

  // Static assets (JS chunks, icons): cache-first, refresh in background.
  if (url.pathname.startsWith('/_next/static') || url.pathname.startsWith('/icons')) {
    event.respondWith(
      caches.match(request).then(hit => {
        const fresh = fetch(request).then(res => {
          caches.open(CACHE).then(c => c.put(request, res.clone()));
          return res;
        });
        return hit ?? fresh;
      }),
    );
  }
});
