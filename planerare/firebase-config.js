// firebase-config.js
// 1. FIREBASE KONFIGURATION
const firebaseConfig = {
  apiKey: "AIzaSyDwCQkUl-je3L3kF7EuxRC6Dm6Gw2N0nJw",
  authDomain: "planerare-f6006.firebaseapp.com",
  projectId: "planerare-f6006",
  storageBucket: "planerare-f6006.firebasestorage.app",
  messagingSenderId: "360462069749",
  appId: "1:360462069749:web:c754879f3f75d5ef3cbabc",
  measurementId: "G-L6516XLZ1Y"
};

// Starta DEFAULT-appen omedelbart
const app = firebase.initializeApp(firebaseConfig);
export const db = app.firestore();
export const auth = firebase.auth();
window.db = db;

// Aktivera lokal lagring för huvud-databasen
db.settings({ cacheSizeBytes: firebase.firestore.CACHE_SIZE_UNLIMITED }); // Tillåt stor cache

db.enablePersistence({ synchronizeTabs: true }) // synchronizeTabs låter flera flikar dela cache
    .then(() => {
        console.log("Offline-lagring aktiverad för Huvudappen");
    })
    .catch((err) => {
        if (err.code == 'failed-precondition') {
            // Förekommer om du har för många flikar öppna samtidigt
            console.warn("Persistence misslyckades: Flera flikar öppna.");
        } else if (err.code == 'unimplemented') {
            // Webbläsaren saknar stöd (ovanligt idag)
            console.warn("Webbläsaren stöder inte offline-lagring.");
        }
    });
