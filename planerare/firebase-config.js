// firebase-config.js
const firebaseConfig = {
    apiKey: "AIzaSyC2...", // Kopiera hela ditt firebaseConfig-objekt från app.js här
    authDomain: "bilvards-pro.firebaseapp.com",
    projectId: "bilvards-pro",
    storageBucket: "bilvards-pro.appspot.com",
    messagingSenderId: "365311050730",
    appId: "1:365311050730:web:10c01a97d41a5f6e917631",
    measurementId: "G-GVE09B3654"
};

// Starta DEFAULT-appen omedelbart
const app = firebase.initializeApp(firebaseConfig);
export const db = app.firestore();
export const auth = firebase.auth();
