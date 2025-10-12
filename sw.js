const CACHE_NAME = 'fresco-cache-v2';
const URLS_TO_CACHE = [
  '/',
  '/index.html',
  '/manifest.json?v=2',
  '/icons/icon-192x192.png?v=2',
  '/icons/icon-512x512.png?v=2'
  // Note: The main JS bundle is usually dynamically named by Vite.
  // A more advanced SW would use a build tool to inject this file name.
  // For now, we rely on the browser's regular caching for the JS.
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Opened cache');
        return cache.addAll(URLS_TO_CACHE);
      })
      .catch(err => {
        console.error('Failed to cache resources during install:', err);
      })
  );
  self.skipWaiting();
});

self.addEventListener('activate', event => {
  const cacheWhitelist = [CACHE_NAME];
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheWhitelist.indexOf(cacheName) === -1) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  return self.clients.claim();
});

self.addEventListener('fetch', event => {
  // We only cache the main app shell files, other requests go to the network.
  // This is a simple strategy. A more robust one might be network-first.
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        // Cache hit - return response
        if (response) {
          return response;
        }
        // Not in cache, fetch from network
        return fetch(event.request);
      }
    )
  );
});
