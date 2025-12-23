// firebase-config.js
export const storage = firebase.storage(); // Lägg till denna rad

// 1. FIREBASE KONFIGURATION
const firebaseConfig = {
  apiKey: "AIzaSyAC4SLwVEzP3CPO4lLfDeZ71iU0xdr49sw",
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

// 2. INSTÄLLNINGAR (Löser "overriding host"-varningen)
try {
    db.settings({ 
        cacheSizeBytes: firebase.firestore.CACHE_SIZE_UNLIMITED,
        merge: true // <--- DENNA RAD SAKNAS I DIN NUVARANDE FIL
    });
} catch (e) {
    console.log("Firestore-inställningar är redan aktiva.");
}

// Gör db tillgänglig för äldre script (som chat.js)
window.db = db;
window.auth = auth;

// 3. OFFLINE-LAGRING
db.enablePersistence({ synchronizeTabs: true })
    .catch((err) => {
        if (err.code !== 'failed-precondition') {
            console.warn("Persistence kunde inte aktiveras:", err.code);
        }
    });
