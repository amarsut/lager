import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-app.js";
import { getAuth, signInWithEmailAndPassword, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-firestore.js";
import { getStorage } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-storage.js";

// 1. FIREBASE SETUP
const firebaseConfig = {
    apiKey: "AIzaSyCGMRpAkcWM48tNdmdYW73cl4WXAjCtMGw",
    authDomain: "bmg-motorgrupp.firebaseapp.com",
    projectId: "bmg-motorgrupp",
    storageBucket: "bmg-motorgrupp.firebasestorage.app",
    messagingSenderId: "76404952256",
    appId: "1:76404952256:web:be47f7e752c4c79d62f125"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);

// 2. CENTRAL STATE (Appens Minne)
export const AppState = {
    leads: [],
    searchQuery: "",
    filterMode: "active",
    currentLeadId: null,
    settings: { faqs: [], heroBgHistory: [], reviews: [] },
    inventory: [],
    documents: [],
    todos: [],
    docFilter: "all",
    testDrives: [],
    tdFilter: 'active',
    calendarEvents: []
};
window.AppState = AppState;

// 3. UI & SYSTEM INITIALISERING
lucide.createIcons();
Chart.defaults.color = '#64748b';
Chart.defaults.font.family = 'Inter';

export function setupTheme() {
    const htmlEl = document.documentElement;
    if (localStorage.getItem('theme') === 'light' || (!('theme' in localStorage) && !window.matchMedia('(prefers-color-scheme: dark)').matches)) {
        htmlEl.classList.remove('dark');
    } else {
        htmlEl.classList.add('dark');
    }

    document.getElementById('themeToggleBtn')?.addEventListener('click', () => {
        htmlEl.classList.toggle('dark');
        localStorage.setItem('theme', htmlEl.classList.contains('dark') ? 'dark' : 'light');
        if(window.processDashboard && AppState.inventory.length) window.processDashboard(AppState.inventory);
    });
}

// 4. MODALER & NOTISER (Tillgängliga överallt via window)
window.openModal = function(id) {
    const modal = document.getElementById(id);
    const inner = modal.querySelector('.modal-inner');
    modal.classList.remove('hidden');
    modal.classList.add('flex');
    void modal.offsetWidth; 
    modal.classList.remove('opacity-0');
    inner?.classList.remove('scale-95');
}

window.closeModal = function(id) {
    const modal = document.getElementById(id);
    const inner = modal.querySelector('.modal-inner');
    modal.classList.add('opacity-0');
    inner?.classList.add('scale-95');
    setTimeout(() => { 
        modal.classList.add('hidden'); 
        modal.classList.remove('flex');
    }, 300);
}

window.closeAllModals = function() {
    document.querySelectorAll('.fixed.inset-0:not(.hidden)').forEach(m => window.closeModal(m.id));
}

export function showToast(msg, type = 'success') {
    const container = document.getElementById('toastContainer');
    const toast = document.createElement('div');
    const color = type === 'success' ? 'bg-emerald-500' : 'bg-red-500';
    const icon = type === 'success' ? 'check' : 'alert-triangle';
    
    toast.className = `transform translate-y-full opacity-0 transition-all duration-300 ${color} text-white px-5 py-3 rounded-lg font-bold shadow-xl flex items-center gap-3 text-sm`;
    toast.innerHTML = `<i data-lucide="${icon}" class="w-4 h-4"></i> <span>${msg}</span>`;
    container.appendChild(toast);
    lucide.createIcons({root: toast});
    
    setTimeout(() => toast.classList.remove('translate-y-full', 'opacity-0'), 10);
    setTimeout(() => { 
        toast.classList.add('translate-y-full', 'opacity-0'); 
        setTimeout(() => toast.remove(), 300); 
    }, 3000);
}

export function formatRelativeDate(firebaseTimestamp) {
    if (!firebaseTimestamp) return 'Nyss';
    const date = firebaseTimestamp.toDate ? firebaseTimestamp.toDate() : new Date(firebaseTimestamp);
    const today = new Date();
    const yesterday = new Date(today); yesterday.setDate(yesterday.getDate() - 1);
    if (date.toDateString() === today.toDateString()) return 'Idag';
    if (date.toDateString() === yesterday.toDateString()) return 'Igår';
    return date.toLocaleDateString('sv-SE', { day: 'numeric', month: 'short' });
}

window.copyToClipboard = async function(elementId, successMsg) {
    const text = document.getElementById(elementId).innerText;
    if (text === '-') return;
    try { await navigator.clipboard.writeText(text); showToast(successMsg); } 
    catch (err) { showToast("Kunde inte kopiera", "error"); }
}