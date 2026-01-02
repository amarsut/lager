// sw.js
const CACHE_NAME = 'os-terminal-v1';

// Install-event: Vi gör det enkelt för att undvika "Failed to execute addAll"
self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(clients.claim());
});

// Fetch-event: Måste finnas för att PWA ska vara "installerbar"
self.addEventListener('fetch', (event) => {
  // Här kan vi lägga till caching-logik senare, 
  // men just nu låter vi den bara passera för stabilitet.
  event.respondWith(fetch(event.request));
});
