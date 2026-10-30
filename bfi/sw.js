// Offline shell: app files are cached on install and served cache-first;
// everything else goes to the network, falling back to the cache.
const VERSION = "bfi-v5";
const SHELL = [
  "./", "index.html", "manifest.webmanifest", "css/app.css", "vendor/qrcode.js",
  "js/app.js", "js/db.js", "js/ui.js", "js/icons.js", "js/seed.js", "js/calc.js",
  "js/views/admin.js", "js/views/marketing.js", "js/views/designer.js",
  "js/views/affiliate.js", "js/views/client.js", "js/views/project.js", "js/views/public.js", "js/views/site.js",
  "icons/icon.svg", "icons/icon-192.png", "icons/icon-512.png",
];

self.addEventListener("install", (e) => {
  e.waitUntil(caches.open(VERSION).then((c) => c.addAll(SHELL)).then(() => self.skipWaiting()));
});

self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== VERSION).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (e) => {
  const req = e.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);
  const sameOrigin = url.origin === self.location.origin;
  const isFont = /fonts\.(googleapis|gstatic)\.com$/.test(url.hostname);
  if (!sameOrigin && !isFont) return;

  e.respondWith(
    caches.match(req, { ignoreSearch: sameOrigin }).then((hit) => {
      const fetched = fetch(req).then((res) => {
        if (res.ok || res.type === "opaque") {
          const copy = res.clone();
          caches.open(VERSION).then((c) => c.put(req, copy));
        }
        return res;
      }).catch(() => hit || (req.mode === "navigate" ? caches.match("index.html") : undefined));
      // Stale-while-revalidate: answer from cache, refresh in the background.
      return hit || fetched;
    })
  );
});
