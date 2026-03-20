// --- 1. IMPORTER FRÅN VÅRA MODULER ---
import { auth } from './admin-js/core.js';
import { initUI } from './admin-js/ui.js';
import { initCRM } from './admin-js/crm.js';
import { initTestDrives } from './admin-js/testdrive.js';
import { initCalendar } from './admin-js/calendar.js';
import { initInventory } from './admin-js/inventory.js';
import { initDocuments } from './admin-js/documents.js';
import { initCMS } from './admin-js/cms.js';
import { initDashboardBriefing } from './admin-js/dashboard.js'; 
import { initPrintSheets } from './admin-js/print.js';
import { syncSalesHistory } from './admin-js/salesHistory.js';
import { initInbox } from './admin-js/Inbox.js';

// Firebase Auth för Inloggning
import { signInWithEmailAndPassword, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-auth.js";

// ==========================================
// INLOGGNING & START AV SYSTEMET
// ==========================================
onAuthStateChanged(auth, (user) => {
    const loginScreen = document.getElementById('loginScreen');
    const adminPanel = document.getElementById('adminPanel');

    if (user) {
        loginScreen.classList.add('opacity-0', 'pointer-events-none');
        setTimeout(() => {
            loginScreen.classList.add('hidden');
            adminPanel.classList.remove('hidden');
            adminPanel.classList.add('flex', 'lg:flex-row');
            
            // --- STARTA ALLA MODULER HÄR ---
            initUI();             
            initCRM();            
            initTestDrives();     
            initCalendar();       
            initInventory();      
            initDocuments();      
            initCMS();            
            initDashboardBriefing();
            initPrintSheets();      
            syncSalesHistory();  
            initInbox();    
        }, 300);
    } else {
        loginScreen.classList.remove('hidden', 'opacity-0', 'pointer-events-none');
        adminPanel.classList.add('hidden');
        adminPanel.classList.remove('flex', 'lg:flex-row');
    }
});

// Hantera Inloggningsformuläret
document.getElementById('loginForm')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const btn = e.target.querySelector('button');
    const email = document.getElementById('loginEmail').value;
    const pass = document.getElementById('loginPassword').value;
    
    btn.innerHTML = '<div class="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div> Loggar in...';
    btn.disabled = true;

    try {
        await signInWithEmailAndPassword(auth, email, pass);
        document.getElementById('loginError').classList.add('hidden');
    } catch (error) {
        document.getElementById('loginError').classList.remove('hidden');
    } finally {
        btn.innerHTML = 'Logga in';
        btn.disabled = false;
    }
});

// Hantera Utloggning
document.getElementById('logoutBtn')?.addEventListener('click', () => signOut(auth));

let deferredPrompt;
const installBtn = document.getElementById('installAppBtn');

// 1. Lyssna efter om appen KAN installeras
window.addEventListener('beforeinstallprompt', (e) => {
    // Förhindra att webbläsaren visar sin egen prompt direkt
    e.preventDefault();
    // Spara eventet så vi kan trigga det senare
    deferredPrompt = e;
    
    // Kontrollera om vi redan körs som en app (standalone)
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone;
    
    if (!isStandalone) {
        // Visa vår snygga knapp
        installBtn.classList.remove('hidden');
    }
});

// 2. Hantera klick på knappen
installBtn?.addEventListener('click', async () => {
    if (!deferredPrompt) return;
    
    // Visa installations-frågan
    deferredPrompt.prompt();
    
    // Vänta på användarens svar
    const { outcome } = await deferredPrompt.userChoice;
    console.log(`Användaren valde: ${outcome}`);
    
    // Rensa prompten (den kan bara användas en gång)
    deferredPrompt = null;
    
    // Dölj knappen igen
    installBtn.classList.add('hidden');
});

// 3. Dölj knappen om appen installeras (från webbläsarens meny t.ex.)
window.addEventListener('appinstalled', () => {
    installBtn.classList.add('hidden');
    deferredPrompt = null;
    console.log('BMG Intelligence installerades framgångsrikt!');
});

// 4. Extra koll vid laddning: Om vi redan är i standalone-läge, se till att den är gömd
if (window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone) {
    installBtn?.classList.add('hidden');
}