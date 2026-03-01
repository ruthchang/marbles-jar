importScripts("/version.js");

const APP_VERSION = self.APP_VERSION || "dev";
const CACHE_NAME = `marble-jar-${APP_VERSION}`;
const CORE_ASSETS = [
  "/",
  "/index.html",
  "/collection.html",
  "/styles.css",
  "/collection.css",
  "/app.js",
  "/collection.js",
  "/collectibles-data.js",
  "/utils.js",
  "/sync-config.js",
  "/sync.js",
  "/pwa-register.js",
  "/version.js",
  "/manifest.webmanifest",
  "/icons/icon-192.png",
  "/icons/icon-512.png"
];

self.addEventListener("install", (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(CORE_ASSETS))
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter((key) => key !== CACHE_NAME)
            .map((key) => caches.delete(key))
        )
      )
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;

  const url = new URL(event.request.url);
  if (url.origin !== self.location.origin) return;

  // Network-first for HTML navigations to avoid stale app shell.
  if (event.request.mode === "navigate" || event.request.destination === "document") {
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          const copy = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, copy));
          return response;
        })
        .catch(() => caches.match(event.request).then((cached) => cached || caches.match("/index.html")))
    );
    return;
  }

  // Stale-while-revalidate for app static assets.
  const isStaticAsset =
    ["script", "style", "image", "font"].includes(event.request.destination) ||
    /\.(?:js|css|png|jpg|jpeg|gif|svg|webp|ico|json|webmanifest)$/i.test(url.pathname);
  if (!isStaticAsset) return;

  event.respondWith(
    caches.match(event.request).then((cached) => {
      const networkFetch = fetch(event.request)
        .then((response) => {
          const copy = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, copy));
          return response;
        })
        .catch(() => cached);
      return cached || networkFetch;
    })
  );
});
