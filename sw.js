// Import Firebase SDKs
importScripts("https://www.gstatic.com/firebasejs/10.12.2/firebase-app-compat.js");
importScripts("https://www.gstatic.com/firebasejs/10.12.2/firebase-messaging-compat.js");

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyB1G6oWz0Zip_nz9_Aylr2HVuTNgl5bz7s",
  authDomain: "fresco-menu.web.app",
  projectId: "fresco-menu",
  storageBucket: "fresco-menu.appspot.com",
  messagingSenderId: "904925567549",
  appId: "1:904925567549:web:030fa370bc380d2fa2a854"
};

// Initialize Firebase
const app = firebase.initializeApp(firebaseConfig);

try {
  const messaging = firebase.messaging(app);

  // If you want to handle background notifications, you can add a listener here.
  // For now, Firebase handles showing the notification automatically.
  messaging.onBackgroundMessage((payload) => {
    console.log(
      "[firebase-messaging-sw.js] Received background message ",
      payload,
    );
    
    const notificationTitle = payload.notification.title || 'Fresco Restaurant';
    const notificationOptions = {
      body: payload.notification.body || 'You have a new notification.',
      icon: '/icons/icon-192x192.png', // Use a standard small icon for consistency.
      image: payload.notification.image, // Use the image from the payload for the large content image.
    };

    self.registration.showNotification(notificationTitle, notificationOptions);
  });
} catch (e) {
  console.log('Unable to initialize Firebase Messaging in service worker.', e);
}


// --- Standard Service Worker Logic (Caching) ---

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
  const requestUrl = new URL(event.request.url);

  // Bypass cache for API calls and non-GET requests.
  if (requestUrl.href.includes('/api/') || event.request.method !== 'GET') {
    event.respondWith(fetch(event.request));
    return;
  }

  // For other GET requests (local assets), use a cache-first strategy.
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        return response || fetch(event.request);
      })
  );
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