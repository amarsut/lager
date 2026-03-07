// sw.js (FÖR APP 2 - PLANERAREN)
const CACHE_NAME = 'os-terminal-v3'; // Uppdaterad version

self.addEventListener('install', (event) => {
  // Hoppar över addAll helt för att undvika krascher!
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    // Rensar ut alla gamla trasiga cachar från tidigare försök
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('Rensar gammal cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  // VIKTIGASTE: Släpp igenom Firestore och Firebase för att appen ska funka live
  if (event.request.url.includes('firestore.googleapis.com') || 
      event.request.url.includes('google.firestore') ||
      event.request.url.includes('firebase')) {
    return; // Gör ingenting, låt webbläsaren prata direkt med databasen
  }

  // För alla andra filer, hämta dem bara som vanligt från nätverket
  event.respondWith(fetch(event.request));
});
