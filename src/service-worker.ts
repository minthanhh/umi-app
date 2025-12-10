/// <reference lib="webworker" />

declare const self: ServiceWorkerGlobalScope;

const CACHE_NAME = 'my-app-cache-v1';
const IMAGE_CACHE = 'images-cache-v1';

// Pre-cache these URLs on install
const PRECACHE_URLS = ['/'];

// Check if request is same-origin
function isSameOrigin(url: string): boolean {
  return url.startsWith(self.location.origin);
}

// Cache-first strategy for same-origin requests
async function cacheFirst(
  request: Request,
  cacheName: string,
): Promise<Response> {
  const cache = await caches.open(cacheName);
  const cached = await cache.match(request);

  if (cached) {
    return cached;
  }

  try {
    const response = await fetch(request);
    // Only cache successful same-origin responses or opaque responses
    if (response.ok || response.type === 'opaque') {
      cache.put(request, response.clone());
    }
    return response;
  } catch (error) {
    console.error('[SW] Fetch failed:', error);
    throw error;
  }
}

// Cache-first strategy for cross-origin requests (images, etc.)
async function cacheFirstCrossOrigin(
  request: Request,
  cacheName: string,
): Promise<Response> {
  const cache = await caches.open(cacheName);
  const cached = await cache.match(request);

  if (cached) {
    return cached;
  }

  try {
    // Use no-cors mode for cross-origin requests
    const response = await fetch(request.url, {
      mode: 'no-cors',
      credentials: 'omit',
    });

    // Opaque responses (from no-cors) can still be cached
    if (response.type === 'opaque' || response.ok) {
      cache.put(request, response.clone());
    }
    return response;
  } catch (error) {
    console.error('[SW] Cross-origin fetch failed:', error);
    throw error;
  }
}

// Network-first strategy
async function networkFirst(request: Request): Promise<Response> {
  const cache = await caches.open(CACHE_NAME);

  try {
    const response = await fetch(request);
    if (response.ok) {
      cache.put(request, response.clone());
    }
    return response;
  } catch (error) {
    const cached = await cache.match(request);
    if (cached) {
      return cached;
    }
    throw error;
  }
}

self.addEventListener('install', (event: ExtendableEvent) => {
  console.log('[SW] Installing...');

  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) => cache.addAll(PRECACHE_URLS))
      .then(() => {
        console.log('[SW] Installed');
        return self.skipWaiting();
      }),
  );
});

self.addEventListener('activate', (event: ExtendableEvent) => {
  console.log('[SW] Activating...');

  // Clean up old caches
  event.waitUntil(
    caches
      .keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames
            .filter((name) => name !== CACHE_NAME && name !== IMAGE_CACHE)
            .map((name) => caches.delete(name)),
        );
      })
      .then(() => {
        console.log('[SW] Activated');
        return self.clients.claim();
      }),
  );
});

self.addEventListener('fetch', (event: FetchEvent) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests
  if (request.method !== 'GET') {
    return;
  }

  // Skip chrome-extension and other non-http requests
  if (!request.url.startsWith('http')) {
    return;
  }

  // Skip WebSocket requests
  if (url.protocol === 'ws:' || url.protocol === 'wss:') {
    return;
  }

  // Handle images (including cross-origin)
  if (request.destination === 'image') {
    if (isSameOrigin(request.url)) {
      event.respondWith(cacheFirst(request, IMAGE_CACHE));
    } else {
      // For cross-origin images, let the browser handle it normally
      // or use no-cors caching strategy
      event.respondWith(cacheFirstCrossOrigin(request, IMAGE_CACHE));
    }
    return;
  }

  // // Skip cross-origin non-image requests (let browser handle them)
  // if (!isSameOrigin(request.url)) {
  //   return;
  // }

  // // Network-first for API calls
  // if (url.pathname.startsWith('/api/')) {
  //   event.respondWith(networkFirst(request));
  //   return;
  // }

  // // Cache-first for same-origin static assets
  // event.respondWith(cacheFirst(request, CACHE_NAME));
});

// Handle messages from the main thread
self.addEventListener('message', (event: ExtendableMessageEvent) => {
  const { type, payload } = event.data || {};

  switch (type) {
    case 'SKIP_WAITING':
      console.log('[SW] Skip waiting requested');
      self.skipWaiting();
      break;

    case 'GET_VERSION':
      event.ports[0]?.postMessage({ version: CACHE_NAME });
      break;

    case 'CLEAR_CACHE':
      event.waitUntil(
        (async () => {
          const cacheName = payload?.cacheName;
          if (cacheName) {
            await caches.delete(cacheName);
            console.log(`[SW] Cache "${cacheName}" cleared`);
          } else {
            const names = await caches.keys();
            await Promise.all(names.map((name) => caches.delete(name)));
            console.log('[SW] All caches cleared');
          }
          event.ports[0]?.postMessage({ success: true });
        })(),
      );
      break;

    default:
      console.log('[SW] Unknown message type:', type);
  }
});

export {};
