// Service Worker för Jobbplanerare PWA
const CACHE_NAME = 'jobbplanerare-cache-v1.0.0'; 
// Lista alla kritiska filer som behövs för att appen ska starta offline.
const urlsToCache = [
  './plan.html',
  './style.css',
  './manifest.json',
  // Lägg till ikoner (anpassa sökvägen om den är annorlunda)
  'images/icon-192x192.png',
  // Lägg till Firebase & FullCalendar scripts som vi använder via CDN
  'https://www.gstatic.com/firebasejs/8.10.1/firebase-app.js',
  'https://www.gstatic.com/firebasejs/8.10.1/firebase-firestore.js',
  'https://cdn.jsdelivr.net/npm/fullcalendar@6.1.11/index.global.min.js',
  'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap'
];

// 1. Installation: Lagra alla filer i cache
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('Opened cache');
        return cache.addAll(urlsToCache);
      })
  );
});

// 2. Aktivering: Rensa gammalt cache
self.addEventListener('activate', (event) => {
  const cacheWhitelist = [CACHE_NAME];
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheWhitelist.indexOf(cacheName) === -1) {
            console.log('Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});

// 3. Fånga anrop: Servera från cache först, sedan nätverk (Cache-first strategy)
self.addEventListener('fetch', (event) => {
  // Undvik att cacha Firebase-databas anrop
  if (event.request.url.indexOf('firestore.googleapis.com') !== -1) {
    return;
  }
  
  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        // Returnera matchande fil från cache, annars hämta från nätverket
        if (response) {
          return response;
        }
        return fetch(event.request);
      })
  );
});
