const CACHE_NAME = 'fresco-cache-v2';
const URLS_TO_CACHE = [
  '/',
  '/index.html',
  '/manifest.json?v=2',
  '/icons/icon-192x192.png?v=2',
  '/icons/icon-512x512.png?v=2',
  '/notification.mp3' // Cache the notification sound
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
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        if (response) {
          return response;
        }
        return fetch(event.request);
      }
    )
  );
});

// Intelligent Push Notification Handler
self.addEventListener('push', event => {
  console.log('[Service Worker] Push Received.');
  
  let data = {};
  if (event.data) {
    try {
      data = event.data.json();
    } catch (e) {
      data = { title: 'Fresco Restaurant', body: event.data.text() };
    }
  }

  const title = data.title || 'Fresco Restaurant';
  const options = {
    body: data.body || 'You have a new notification.',
    icon: data.icon || '/icons/icon-192x192.png',
    badge: '/icons/icon-192x192.png',
    image: data.image,
    data: data.data,
    silent: data.with_sound === false, // Use silent option
  };

  const promiseChain = self.clients.matchAll({
    type: 'window',
    includeUncontrolled: true
  }).then(windowClients => {
    let clientIsVisible = false;
    for (let i = 0; i < windowClients.length; i++) {
      const windowClient = windowClients[i];
      if (windowClient.visibilityState === 'visible') {
        clientIsVisible = true;
        // Send a message to the visible client to handle the notification in-app
        windowClient.postMessage({ type: 'push-notification', data: data });
        break;
      }
    }

    if (clientIsVisible) {
      // If the app is open and visible, don't show the system notification.
      // The app itself will handle it (e.g., play a sound, show a toast).
      console.log('[Service Worker] App is visible. Sending message to client.');
      return Promise.resolve();
    } else {
      // If the app is not visible, show the system notification.
      console.log('[Service Worker] App is not visible. Showing system notification.');
      return self.registration.showNotification(title, options);
    }
  });

  event.waitUntil(promiseChain);
});


self.addEventListener('notificationclick', event => {
  console.log('[Service Worker] Notification click Received.');
  event.notification.close();
  event.waitUntil(
    clients.matchAll({ type: 'window' }).then(clientsArr => {
      const hadWindowToFocus = clientsArr.some(windowClient =>
        windowClient.url === self.registration.scope ? (windowClient.focus(), true) : false
      );
      if (!hadWindowToFocus)
        clients.openWindow(self.registration.scope).then(windowClient => (windowClient ? windowClient.focus() : null));
    })
  );
});