"use strict";
(() => {
  // src/service-worker.ts
  var CACHE_NAME = "my-app-cache-v1";
  var IMAGE_CACHE = "images-cache-v1";
  var PRECACHE_URLS = ["/"];
  function isSameOrigin(url) {
    return url.startsWith(self.location.origin);
  }
  async function cacheFirst(request, cacheName) {
    const cache = await caches.open(cacheName);
    const cached = await cache.match(request);
    if (cached) {
      return cached;
    }
    try {
      const response = await fetch(request);
      if (response.ok || response.type === "opaque") {
        cache.put(request, response.clone());
      }
      return response;
    } catch (error) {
      console.error("[SW] Fetch failed:", error);
      throw error;
    }
  }
  async function cacheFirstCrossOrigin(request, cacheName) {
    const cache = await caches.open(cacheName);
    const cached = await cache.match(request);
    if (cached) {
      return cached;
    }
    try {
      const response = await fetch(request.url, {
        mode: "no-cors",
        credentials: "omit"
      });
      if (response.type === "opaque" || response.ok) {
        cache.put(request, response.clone());
      }
      return response;
    } catch (error) {
      console.error("[SW] Cross-origin fetch failed:", error);
      throw error;
    }
  }
  self.addEventListener("install", (event) => {
    console.log("[SW] Installing...");
    event.waitUntil(
      caches.open(CACHE_NAME).then((cache) => cache.addAll(PRECACHE_URLS)).then(() => {
        console.log("[SW] Installed");
        return self.skipWaiting();
      })
    );
  });
  self.addEventListener("activate", (event) => {
    console.log("[SW] Activating...");
    event.waitUntil(
      caches.keys().then((cacheNames) => {
        return Promise.all(
          cacheNames.filter((name) => name !== CACHE_NAME && name !== IMAGE_CACHE).map((name) => caches.delete(name))
        );
      }).then(() => {
        console.log("[SW] Activated");
        return self.clients.claim();
      })
    );
  });
  self.addEventListener("fetch", (event) => {
    const { request } = event;
    const url = new URL(request.url);
    if (request.method !== "GET") {
      return;
    }
    if (!request.url.startsWith("http")) {
      return;
    }
    if (url.protocol === "ws:" || url.protocol === "wss:") {
      return;
    }
    if (request.destination === "image") {
      if (isSameOrigin(request.url)) {
        event.respondWith(cacheFirst(request, IMAGE_CACHE));
      } else {
        event.respondWith(cacheFirstCrossOrigin(request, IMAGE_CACHE));
      }
      return;
    }
  });
  self.addEventListener("message", (event) => {
    const { type, payload } = event.data || {};
    switch (type) {
      case "SKIP_WAITING":
        console.log("[SW] Skip waiting requested");
        self.skipWaiting();
        break;
      case "GET_VERSION":
        event.ports[0]?.postMessage({ version: CACHE_NAME });
        break;
      case "CLEAR_CACHE":
        event.waitUntil(
          (async () => {
            const cacheName = payload?.cacheName;
            if (cacheName) {
              await caches.delete(cacheName);
              console.log(`[SW] Cache "${cacheName}" cleared`);
            } else {
              const names = await caches.keys();
              await Promise.all(names.map((name) => caches.delete(name)));
              console.log("[SW] All caches cleared");
            }
            event.ports[0]?.postMessage({ success: true });
          })()
        );
        break;
      default:
        console.log("[SW] Unknown message type:", type);
    }
  });
})();
//# sourceMappingURL=sw.js.map
