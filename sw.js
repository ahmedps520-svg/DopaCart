/* ═══════════════════════════════════════════════════════════════
   DopaCart — sw.js
   Service worker: NETWORK-FIRST for everything same-origin, so
   updates always land immediately when online. The cache is only
   the offline fallback (precached at install, refreshed on every
   successful fetch). Works on GitHub Pages subpaths.
   ═══════════════════════════════════════════════════════════════ */

// Version only names the cache generation; updates no longer depend
// on bumping it (network-first serves fresh files regardless).
const CACHE = "dopacart-v1.6.0";

const ASSETS = [
  "./",
  "./index.html",
  "./manifest.json",
  "./css/base.css",
  "./css/components.css",
  "./js/utils.js",
  "./js/sound.js",
  "./js/data.js",
  "./js/state.js",
  "./js/components.js",
  "./js/views/home.js",
  "./js/views/browse.js",
  "./js/views/product.js",
  "./js/views/cart.js",
  "./js/views/orders.js",
  "./js/views/rewards.js",
  "./js/views/settings.js",
  "./js/views/extras.js",
  "./js/app.js",
  "./icons/icon-192.png",
  "./icons/icon-512.png",
  "./icons/icon-maskable-512.png",
  "./icons/icon-180.png",
];

/* Install: precache everything, activate immediately. */
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE).then((cache) => cache.addAll(ASSETS)).then(() => self.skipWaiting())
  );
});

/* Activate: drop stale caches from older versions. */
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

/* Fetch: network-first for same-origin. Fresh files always win; every
   successful response refreshes the offline copy; the cache only
   answers when the network is unreachable. */
self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;

  const url = new URL(request.url);
  if (url.origin !== location.origin) return;   // external images bypass the SW

  event.respondWith(
    fetch(request)
      .then((response) => {
        if (response.ok) {
          const copy = response.clone();
          caches.open(CACHE).then((cache) => cache.put(request, copy));
        }
        return response;
      })
      .catch(() =>
        caches.match(request).then((cached) => {
          if (cached) return cached;
          // Offline navigation with nothing cached → serve the app shell.
          if (request.mode === "navigate") return caches.match("./index.html");
          return Response.error();
        })
      )
  );
});
