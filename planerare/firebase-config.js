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

// Starta DEFAULT-appen bara om den inte redan är initierad
if (!firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
}

export const db = firebase.firestore();
export const auth = firebase.auth();

// Gör db tillgänglig för äldre script (som chat.js)
window.db = db;

// 2. INSTÄLLNINGAR (Använd try/catch för att undvika "overriding host"-varningen)
try {
    db.settings({ 
        cacheSizeBytes: firebase.firestore.CACHE_SIZE_UNLIMITED 
    });
} catch (e) {
    // Om inställningarna redan är satta (t.ex. vid en snabb omstart) loggas detta istället för att krascha
    console.log("Firestore-inställningar är redan aktiva.");
}

// 3. OFFLINE-LAGRING
db.enablePersistence({ synchronizeTabs: true })
    .then(() => {
        console.log("Offline-lagring aktiverad för Huvudappen");
    })
    .catch((err) => {
        if (err.code == 'failed-precondition') {
            console.warn("Persistence misslyckades: Flera flikar öppna.");
        } else if (err.code == 'unimplemented') {
            console.warn("Webbläsaren stöder inte offline-lagring.");
        }
    });
