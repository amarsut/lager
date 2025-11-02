const CACHE_NAME = 'lager-cache-v39'; // Öka versionsnumret för att tvinga fram en ny installation
const urlsToCache = [
    // BASFILER (Dessa måste ligga i samma mapp)
    './lager.html',
    './apps.js',
    './manifest.json',
    
    // IKONER (Dubbelkolla att mappen heter images/ med litet i och att filnamnen är exakta)
    './images/192x192.png',
    './images/512x512.png',
    './images/maskable.png',

    // EXTERNA RESURSER (Måste vara fullständiga och korrekta URL:er)
    'https://fonts.googleapis.com/css2?family=Inter:wght@100..900&display=swap',
    'https://www.gstatic.com/firebasejs/9.6.1/firebase-app.js',
    'https://www.gstatic.com/firebasejs/9.6.1/firebase-firestore.js'
];

// Installation: Cacha app-skalet (app shell)
self.addEventListener('install', event => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => {
                console.log('Service Worker: Caching App Shell');
                return cache.addAll(urlsToCache);
            })
            .catch(err => {
                console.error('Service Worker: Caching failed', err);
            })
    );
});

// Aktivering: Rensar gamla cachar
self.addEventListener('activate', event => {
    const cacheWhitelist = [CACHE_NAME];
    event.waitUntil(
        caches.keys().then(cacheNames => {
            return Promise.all(
                cacheNames.map(cacheName => {
                    if (cacheWhitelist.indexOf(cacheName) === -1) {
                        console.log('Service Worker: Deleting old cache:', cacheName);
                        return caches.delete(cacheName);
                    }
                })
            );
        })
    );
    // Säkerställ att service worker tar kontroll omedelbart
    return self.clients.claim();
});

// Hämtning: Servera från cache först, sedan nätverk (Cache-First)
self.addEventListener('fetch', event => {
    event.respondWith(
        caches.match(event.request)
            .then(response => {
                // Returnera cachad respons om den finns
                if (response) {
                    return response;
                }
                // Annars, hämta från nätverket
                return fetch(event.request);
            })
            .catch(error => {
                // Kan lägga till en fallback-sida här för offline-användning
                console.log('Fetch failed:', error);
            })
    );
});
