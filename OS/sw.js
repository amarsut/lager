// sw.js (AutoGrid Offline Core - Skottsäker v6)
const CACHE_NAME = 'autogrid-os-v6';

const ASSETS_TO_CACHE = [
  './',
  './index.html',
  './style.css',
  './calendar.css',
  './app.js',
  './dashboard.js',
  './reference.js',
  './chat.js',
  './supply.js',
  './garage.js',
  './lager.js',
  './calendar.js',
  './newJob.js',
  './customers.js',
  './fleet.js',
  './statistics.js',
  './systemRadar.js',
  './spotlight.js',
  './manifest.json',
  
  // Tredjepartsbibliotek
  'https://cdn.tailwindcss.com',
  'https://unpkg.com/react@18/umd/react.development.js',
  'https://unpkg.com/react-dom@18/umd/react-dom.development.js',
  'https://unpkg.com/@babel/standalone/babel.min.js',
  'https://unpkg.com/lucide@latest',
  'https://cdn.jsdelivr.net/npm/fullcalendar@6.1.10/index.global.min.js',
  
  // Firebase SDKs
  'https://www.gstatic.com/firebasejs/9.6.1/firebase-app-compat.js',
  'https://www.gstatic.com/firebasejs/9.6.1/firebase-auth-compat.js',
  'https://www.gstatic.com/firebasejs/9.6.1/firebase-firestore-compat.js',
  'https://www.gstatic.com/firebasejs/9.6.1/firebase-storage-compat.js'
];

self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return Promise.allSettled(
        ASSETS_TO_CACHE.map(url => cache.add(url))
      );
    })
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  // 1. Släpp alltid igenom specifika API:er direkt, men blockera INTE ".js"-filerna
  if (
      event.request.url.includes('firestore.googleapis.com') || 
      event.request.url.includes('securetoken.googleapis.com') ||
      event.request.url.includes('google.firestore') ||
      event.request.url.includes('smhi.se')
  ) {
    return; 
  }

  if (event.request.method !== 'GET') return;

  event.respondWith(
    caches.match(event.request, { ignoreSearch: true }).then((cachedResponse) => {
      
      const fetchPromise = fetch(event.request).then((networkResponse) => {
        // FIX: networkResponse.status === 0 tillåter webbläsaren att cacha Opaque Responses (som Tailwind CDN)
        if (networkResponse && (networkResponse.ok || networkResponse.status === 0)) {
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, networkResponse.clone());
          });
        }
        return networkResponse;
      }).catch(() => {
        // Tyst felhantering när vi är offline
      });

      // 2. Returnera cachen omedelbart om den finns
      if (cachedResponse) {
        return cachedResponse;
      }

      // 3. Om den inte fanns i cachen, vänta på nätverket
      return fetchPromise.then(response => {
        if (response) return response;
        
        // 4. ULTIMAT FALLBACK
        if (event.request.mode === 'navigate' || event.request.headers.get('accept').includes('text/html')) {
           return caches.match('./index.html', { ignoreSearch: true });
        }
      });
    })
  );
});
