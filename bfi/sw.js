// BFI service worker. Its scope is only this bfi/ folder, so it never touches
// the invitation site at the repository root.
// Bump VERSION whenever any file below changes so visitors get the update.
const VERSION = 'bfi-v1';
const SHELL = [
  './',
  'index.html',
  'manifest.webmanifest',
  'css/bfi.css',
  'js/app.js',
  'js/card.js',
  'js/config.js',
  'icons/icon.svg',
  'icons/icon-192.png',
  'icons/icon-512.png',
  'icons/maskable-512.png',
  'icons/apple-touch-icon.png',
];
const FONTS = 'bfi-fonts';

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(VERSION).then((cache) => cache.addAll(SHELL)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k.startsWith('bfi-') && k !== VERSION && k !== FONTS).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  );
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET') return;
  const url = new URL(request.url);

  // Google Fonts: serve from cache, refresh in the background.
  if (url.hostname === 'fonts.googleapis.com' || url.hostname === 'fonts.gstatic.com') {
    event.respondWith(caches.open(FONTS).then(async (cache) => {
      const cached = await cache.match(request);
      const fresh = fetch(request).then((res) => {
        if (res.ok || res.type === 'opaque') cache.put(request, res.clone());
        return res;
      }).catch(() => cached);
      return cached || fresh;
    }));
    return;
  }

  if (url.origin !== location.origin) return;

  // Pages: network first so updates show, cached copy when offline.
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((res) => {
          const copy = res.clone();
          caches.open(VERSION).then((cache) => cache.put('index.html', copy));
          return res;
        })
        .catch(() => caches.match('index.html')),
    );
    return;
  }

  // Everything else: cache first.
  event.respondWith(
    caches.match(request).then((cached) => cached || fetch(request).then((res) => {
      if (res.ok) {
        const copy = res.clone();
        caches.open(VERSION).then((cache) => cache.put(request, copy));
      }
      return res;
    })),
  );
});
