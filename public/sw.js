const CACHE_NAME = 'pigtown-cache-v3';
const ASSETS_TO_CACHE = [
  '/',
  '/index.html',
  '/manifest.json'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS_TO_CACHE);
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('Service Worker: Clearing old cache', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Network First strategy for HTML to avoid stale whitescreens
self.addEventListener('fetch', (event) => {
  // Skip API calls from service worker interception
  if (event.request.url.includes('/api/')) {
    return;
  }

  const isHtml = event.request.mode === 'navigate' || 
                 (event.request.method === 'GET' && event.request.headers.get('accept').includes('text/html'));

  if (isHtml) {
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          const copy = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, copy));
          return response;
        })
        .catch(() => caches.match(event.request))
    );
  } else {
    event.respondWith(
      caches.match(event.request).then((response) => {
        return response || fetch(event.request).catch((err) => {
          // Return a fallback or just a basic offline response safely without throwing unhandled exceptions
          return new Response('Network error occurred', {
            status: 408,
            statusText: 'Network Error'
          });
        });
      })
    );
  }
});
