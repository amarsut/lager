// Service Worker för Jobbplanerare PWA
const CACHE_NAME = 'jobbplanerare-cache-v1.0.1'; 
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
  // Vi hanterar bara GET-requests (t.ex. för filer), inte POST/PUT (som sparar data)
  if (event.request.method !== 'GET') {
    return;
  }

  event.respondWith(
    caches.open(CACHE_NAME).then(cache => {
      // 1. Försök hitta filen i cachen
      return cache.match(event.request).then(cachedResponse => {
        
        // 2. Starta en nätverksförfrågan OAVSETT (detta är "revalidate"-delen)
        const fetchPromise = fetch(event.request).then(networkResponse => {
          // Om vi får ett giltigt svar från nätverket...
          if (networkResponse && networkResponse.status === 200) {
            // ...spara den nya versionen i cachen för nästa gång
            cache.put(event.request, networkResponse.clone());
          }
          // Returnera den nya versionen från nätverket
          return networkResponse;
        }).catch(error => {
          // Nätverket misslyckades (du är offline)
          console.log('Fetch failed; appen är offline.', error);
          // Vi kan inte göra något mer här, men vi har förhoppningsvis redan en cachad fil
        });

        // 3. Returnera den cachade filen direkt (om den finns)
        // Detta gör att appen laddar omedelbart ("stale"-delen)
        if (cachedResponse) {
          return cachedResponse;
        }

        // 4. Om filen INTE fanns i cachen (första besöket)
        // vänta på att nätverksförfrågan blir klar och returnera den.
        return fetchPromise;
      });
    })
  );
});
