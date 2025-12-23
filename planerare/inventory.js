// inventory.js

// 1. LAGER FIREBASE KONFIGURATION
const lagerFirebaseConfig = {
    apiKey: "AIzaSyAC4SLwVEzP3CPO4lLfDeZ71iU0xdr49sw", 
    authDomain: "lagerdata-a9b39.firebaseapp.com",
    projectId: "lagerdata-a9b39",
    storageBucket: "lagerdata-a9b39.firebasestorage.app",
    messagingSenderId: "615646392577",
    appId: "1:615646392577:web:fd816443728e88b218eb00"
};

// 2. INITIERA LAGER-APPEN
const lagerApp = firebase.initializeApp(lagerFirebaseConfig, "lagerApp");
export const lagerDb = lagerApp.firestore();

/**
 * Söker i lagret baserat på en term
 */
export async function searchLager(term) {
    const searchTerm = term.toUpperCase();
    try {
        const snapshot = await lagerDb.collection('lager').get();
        return snapshot.docs
            .map(doc => ({ id: doc.id, ...doc.data(), isLager: true }))
            .filter(item => 
                (item.name && item.name.toUpperCase().includes(searchTerm)) || 
                (item.service_filter && item.service_filter.toUpperCase().includes(searchTerm))
            );
    } catch (err) {
        console.error("Kunde inte söka i lagret:", err);
        return [];
    }
}
