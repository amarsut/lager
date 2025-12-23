const STATIC_CACHE_NAME = 'jobbplanerare-static-v1.1.0';
const DYNAMIC_CACHE_NAME = 'jobbplanerare-dynamic-v1.1.0';

const APP_SHELL_FILES = [
  './',
  './plan.html',
  './style.css',
  './manifest.json',
  './images/oljemagasinet-favico.png'
  './images/appicon.png'
];

// --- INSTALLATION ---
// Detta körs EN gång när Service Workern installeras.
// Cachar endast app-skalet.
self.addEventListener('install', event => {
    console.log('[SW] Installation påbörjad...');
    event.waitUntil(
        caches.open(STATIC_CACHE_NAME)
            .then(cache => {
                console.log('[SW] Cachar app-skal:', APP_SHELL_FILES);
                // Lägg till alla dina app-skal-filer i den statiska cachen
                return cache.addAll(APP_SHELL_FILES);
            })
            .then(() => {
                // Tvingar den nya Service Workern att aktiveras direkt
                return self.skipWaiting();
            })
            .catch(err => {
                console.error('[SW] Caching av app-skal misslyckades', err);
            })
    );
});

// --- AKTIVERING ---
// Detta körs när en ny Service Worker tar över.
// Den rensar bort gamla cachar som inte matchar de TVÅ nya.
self.addEventListener('activate', event => {
    console.log('[SW] Aktivering påbörjad...');
    const cacheWhitelist = [STATIC_CACHE_NAME, DYNAMIC_CACHE_NAME];
    event.waitUntil(
        caches.keys().then(cacheNames => {
            return Promise.all(
                cacheNames.map(cacheName => {
                    // Om cachen varken är den statiska eller dynamiska vi vill ha, ta bort den!
                    if (cacheWhitelist.indexOf(cacheName) === -1) {
                        console.log('[SW] Rensar gammal cache:', cacheName);
                        return caches.delete(cacheName);
                    }
                })
            );
        }).then(() => {
            // Tvingar Service Workern att ta kontroll över alla öppna flikar
            return self.clients.claim();
        })
    );
});

// --- FETCH (NÄTVERKSANROP) ---
// Detta är den viktigaste delen. Den fångar ALLA nätverksanrop från din app.
self.addEventListener('fetch', event => {
    const url = new URL(event.request.url);

    // 1. Ignorera ALLTID Firebase-anrop och Google API:er.
    // Firebase har sin egen offline-hantering (enablePersistence).
    // Vi får INTE störa den genom att cacha dessa anrop.
    if (url.hostname.includes('firebase') || url.hostname.includes('firestore') || url.hostname.includes('googleapis.com')) {
        // Låt anropet gå direkt till nätverket
        return event.respondWith(fetch(event.request));
    }

    // 2. Hantera App-skalet (Cache First)
    // Om filen finns i vår lista på app-skal-filer...
    if (APP_SHELL_FILES.includes(url.pathname)) {
        // ... svara ALLTID från den statiska cachen. Detta är blixtsnabbt.
        event.respondWith(
            caches.match(event.request, { cacheName: STATIC_CACHE_NAME })
                .then(cachedResponse => {
                    return cachedResponse || fetch(event.request); // Fallback om det *mot förmodan* saknas
                })
        );
        return; // Avsluta här
    }

    // 3. Hantera allt annat (Stale-While-Revalidate)
    // (Gäller t.ex. FullCalendar, Google Fonts, och andra CDNs)
    event.respondWith(
        caches.open(DYNAMIC_CACHE_NAME).then(cache => {
            return cache.match(event.request).then(cachedResponse => {
                
                // Starta ett nätverksanrop som ALLTID körs i bakgrunden
                const networkFetch = fetch(event.request).then(networkResponse => {
                    // Spara den nya versionen i den dynamiska cachen
                    cache.put(event.request, networkResponse.clone());
                    // Returnera den nya versionen
                    return networkResponse;
                }).catch(err => {
                    console.error('[SW] Nätverksfel, kunde inte hämta:', event.request.url, err);
                });

                // Svara omedelbart med cachen om den finns (Stale)
                // annars vänta på nätverksanropet.
                // Oavsett vilket så har 'networkFetch' startat för att uppdatera cachen (Revalidate).
                return cachedResponse || networkFetch;
            });
        })
    );
});
