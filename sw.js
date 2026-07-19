/* ═══════════════════════════════════════════════════════════════
   DopaCart — sw.js
   Service worker: precaches the whole app for full offline use.
   Cache-first for same-origin requests, with a navigation
   fallback to index.html (works on GitHub Pages subpaths).
   ═══════════════════════════════════════════════════════════════ */

// Bump this version whenever any precached file changes — it is what
// triggers installed clients to fetch the new build.
const CACHE = "dopacart-v1.1.0";

const ASSETS = [
  "./",
  "./index.html",
  "./manifest.json",
  "./css/base.css",
  "./css/components.css",
  "./js/utils.js",
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

/* Fetch: cache-first for same-origin; navigations fall back to the shell. */
self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;

  const url = new URL(request.url);
  if (url.origin !== location.origin) return;   // app makes no external requests anyway

  event.respondWith(
    caches.match(request).then((cached) => {
      if (cached) return cached;
      return fetch(request)
        .then((response) => {
          // Runtime-cache anything new we happen to fetch.
          if (response.ok) {
            const copy = response.clone();
            caches.open(CACHE).then((cache) => cache.put(request, copy));
          }
          return response;
        })
        .catch(() => {
          // Offline navigation → serve the app shell.
          if (request.mode === "navigate") return caches.match("./index.html");
          return Response.error();
        });
    })
  );
});
