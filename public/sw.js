const CACHE_NAME = 'dalali-v5';
const STATIC_CACHE = 'dalali-static-v5';
const IMAGE_CACHE = 'dalali-images-v5';

// Critical shell resources cached on install
const SHELL_RESOURCES = [
  '/',
  '/index.html',
  '/logo.png',
  '/favicon.png',
];

// Install — cache the app shell
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(STATIC_CACHE)
      .then((cache) => cache.addAll(SHELL_RESOURCES))
      .then(() => self.skipWaiting())
  );
});

// Activate — remove old caches
self.addEventListener('activate', (event) => {
  const CURRENT_CACHES = [STATIC_CACHE, IMAGE_CACHE];
  event.waitUntil(
    caches.keys()
      .then((names) => Promise.all(
        names
          .filter((n) => !CURRENT_CACHES.includes(n))
          .map((n) => caches.delete(n))
      ))
      .then(() => self.clients.claim())
  );
});

// Fetch strategies
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  if (request.method !== 'GET') return;
  if (!url.protocol.startsWith('http')) return;

  // API requests — always network, no caching
  if (url.pathname.startsWith('/api/')) return;

  // Cross-origin image CDN (Cloudinary) — Cache First, 7-day TTL
  if (url.hostname.includes('res.cloudinary.com') || url.hostname.includes('cloudinary.com')) {
    event.respondWith(cacheFirstWithTTL(request, IMAGE_CACHE, 7 * 24 * 3600));
    return;
  }

  // Skip other cross-origin requests
  if (url.origin !== self.location.origin) return;

  // HTML navigation — Network First with cache fallback
  if (request.mode === 'navigate') {
    event.respondWith(networkFirstWithFallback(request));
    return;
  }

  // JS and CSS — Stale-While-Revalidate (instant from cache, refresh in background)
  if (/\.(js|css)(\?.*)?$/.test(url.pathname)) {
    event.respondWith(staleWhileRevalidate(request, STATIC_CACHE));
    return;
  }

  // Local images — Cache First, 7-day TTL
  if (/\.(png|jpe?g|webp|gif|svg|ico)$/i.test(url.pathname)) {
    event.respondWith(cacheFirstWithTTL(request, IMAGE_CACHE, 7 * 24 * 3600));
    return;
  }

  // Everything else — Stale-While-Revalidate
  event.respondWith(staleWhileRevalidate(request, STATIC_CACHE));
});

// Network First: try network, fall back to cache, fall back to index.html
async function networkFirstWithFallback(request) {
  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(STATIC_CACHE);
      cache.put(request, response.clone());
    }
    return response;
  } catch {
    const cached = await caches.match(request);
    if (cached) return cached;
    return caches.match('/index.html');
  }
}

// Stale-While-Revalidate: serve cached immediately, update in background
async function staleWhileRevalidate(request, cacheName) {
  const cache = await caches.open(cacheName);
  const cached = await cache.match(request);

  const networkFetch = fetch(request).then((response) => {
    if (response.ok) cache.put(request, response.clone());
    return response;
  }).catch(() => null);

  return cached || await networkFetch;
}

// Cache First with TTL check
async function cacheFirstWithTTL(request, cacheName, maxAgeSeconds) {
  const cache = await caches.open(cacheName);
  const cached = await cache.match(request);

  if (cached) {
    const date = cached.headers.get('date');
    if (date) {
      const age = (Date.now() - new Date(date).getTime()) / 1000;
      if (age < maxAgeSeconds) return cached;
    } else {
      return cached;
    }
  }

  try {
    const response = await fetch(request);
    if (response.ok) cache.put(request, response.clone());
    return response;
  } catch {
    return cached;
  }
}

// Push notifications
self.addEventListener('push', (event) => {
  if (!event.data) return;
  const data = event.data.json();
  event.waitUntil(
    self.registration.showNotification(data.title, {
      body: data.body,
      icon: '/logo.png',
      badge: '/logo.png',
    })
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  event.waitUntil(clients.openWindow('/'));
});
