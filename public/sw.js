/* NoteWeb service worker: offline app shell + cached assets. Notes themselves
   live in localStorage and never pass through here. */
const VERSION = 'noteweb-v2-1';
const SHELL = ['/', '/app', '/manifest.webmanifest', '/favicon.svg'];

self.addEventListener('install', event => {
  event.waitUntil(caches.open(VERSION).then(c => c.addAll(SHELL)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches
      .keys()
      .then(keys => Promise.all(keys.filter(k => k !== VERSION).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

const cacheFirst = async request => {
  const cached = await caches.match(request);
  if (cached) return cached;
  const res = await fetch(request);
  if (res.ok) (await caches.open(VERSION)).put(request, res.clone());
  return res;
};

const staleWhileRevalidate = async request => {
  const cache = await caches.open(VERSION);
  const cached = await cache.match(request);
  const network = fetch(request)
    .then(res => {
      if (res.ok) cache.put(request, res.clone());
      return res;
    })
    .catch(() => cached);
  return cached || network;
};

self.addEventListener('fetch', event => {
  const { request } = event;
  if (request.method !== 'GET') return;
  const url = new URL(request.url);

  if (url.origin === self.location.origin) {
    if (url.pathname.startsWith('/api/')) return;
    if (request.mode === 'navigate') {
      event.respondWith(
        fetch(request)
          .then(res => {
            const copy = res.clone();
            caches.open(VERSION).then(c => c.put('/app', copy));
            return res;
          })
          .catch(async () => (await caches.match(request)) || (await caches.match('/app')) || (await caches.match('/')))
      );
      return;
    }
    if (url.pathname.startsWith('/assets/')) {
      event.respondWith(cacheFirst(request));
      return;
    }
    event.respondWith(staleWhileRevalidate(request));
    return;
  }

  if (url.hostname === 'fonts.googleapis.com' || url.hostname === 'fonts.gstatic.com') {
    event.respondWith(staleWhileRevalidate(request));
  }
});
