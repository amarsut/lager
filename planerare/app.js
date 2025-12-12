// Importera kalenderfunktionen
import { initCalendar, setCalendarTheme } from './calendar.js';

window.openNewJobModal = openNewJobModal;
window.toggleChatWidget = toggleChatWidget;
window.openSettingsModal = openSettingsModal;
window.handleLogout = handleLogout;
window.closeSettings = closeSettings;
window.toggleOilForm = toggleOilForm;
window.saveNewBarrel = saveNewBarrel;
window.closeVehicleModal = closeVehicleModal;
window.openVehicleModal = openVehicleModal;
window.openCustomerByName = openCustomerByName;
window.toggleCardActions = toggleCardActions;
window.setStatus = setStatus;
window.deleteJob = deleteJob;
window.openBrandSelector = openBrandSelector;
window.saveTechSpec = saveTechSpec;
window.filterVehicleHistory = filterVehicleHistory;
window.openEditModal = openEditModal; 
// Slut på kalender

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

// 2. INITIERA FIREBASE DIREKT (Högst upp)
if (!firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
}

// Skapa globala referenser direkt
const db = firebase.firestore();
const auth = firebase.auth(); // Nu är 'auth' definierad korrekt

console.log("Firebase initierad.");

// Globala variabler
let allJobs = []; 
let currentStatusFilter = 'kommande'; 
let currentSearchTerm = '';
let currentExpenses = [];
let jobsUnsubscribe = null;   // Håller koll på jobb-lyssnaren
let specsUnsubscribe = null;  // Håller koll på fordons-lyssnaren

// Chatt-variabler
let chatUnsubscribe = null;
let currentChatLimit = 50;
let isFetchingOlderChat = false;
let expandedMessageIds = new Set();
let isEditingMsg = false;
let currentEditMsgId = null;

const TIMEOUT_MINUTES = 15; // Ändra här om du vill ha annan tid (t.ex. 60)
const INACTIVITY_LIMIT_MS = TIMEOUT_MINUTES * 60 * 1000;

// --- 3. INLOGGNINGSHANTERARE & DATALADDNING ---
auth.onAuthStateChanged((user) => {
    const loginScreen = document.getElementById('loginScreen');
    const mainApp = document.getElementById('mainApp');
    const loadingOverlay = document.getElementById('loadingOverlay');

    // Dölj laddningsskärmen (Nu vet vi status!)
    if (loadingOverlay) loadingOverlay.style.display = 'none';

    if (user) {
        // --- ANVÄNDARE ÄR INLOGGAD ---
        if(loginScreen) loginScreen.style.display = 'none';
        if(mainApp) mainApp.style.display = 'flex'; 
        
        // --- 1. HÄMTA ELEMENT (SIDEBAR & INSTÄLLNINGAR) ---
        // Sidebar
        const sidebarNameEl = document.querySelector('.user-name');
        const sidebarAvatarEl = document.querySelector('.sidebar-avatar');

        // Inställningsmeny (Nya elementen)
        const settingsNameEl = document.querySelector('.settings-user-name');
        const settingsEmailEl = document.querySelector('.settings-user-email');
        const settingsAvatarEl = document.querySelector('.settings-user-avatar');

        // --- 2. LOGIK FÖR NAMN & AVATAR ---
        let displayName = "Användare";
        
        if(user.email) {
            // Ta namnet före @-tecknet
            const emailName = user.email.split('@')[0]; 
            
            // Om namnet har punkt (t.ex. amar.sut), ersätt med mellanslag och gör stor bokstav
            // Resultat: "amar.sut" -> "Amar Sut"
            displayName = emailName
                .split('.')
                .map(part => part.charAt(0).toUpperCase() + part.slice(1))
                .join(' ');
        }

        // Skapa URL för UI Avatars
        const avatarUrl = `https://ui-avatars.com/api/?name=${encodeURIComponent(displayName)}&background=eff6ff&color=3b82f6&bold=true`;

        // --- 3. UPPDATERA UI ---
        
        // Uppdatera Sidebar
        if (sidebarNameEl) sidebarNameEl.textContent = displayName;
        if (sidebarAvatarEl) sidebarAvatarEl.src = avatarUrl;

        // Uppdatera Inställningsmeny
        if (settingsNameEl) settingsNameEl.textContent = displayName;
        if (settingsEmailEl) settingsEmailEl.textContent = user.email; // Visar exakt e-post
        if (settingsAvatarEl) settingsAvatarEl.src = avatarUrl;

        // --- 4. STARTA APPENS FUNKTIONER ---
        startInactivityCheck();
        initRealtimeListener(); 
        initChat();
        
        // NYTT: Starta lyssnaren för lagerstatus (Olja)
        initInventoryListener();
        
        // Initiera inställningar (Privacy/Mörkt läge)
        if (typeof initSettings === 'function') {
            initSettings();
        }
        
    } else {
        // --- UTLOGGAD ---
        if(loginScreen) loginScreen.style.display = 'flex';
        if(mainApp) mainApp.style.display = 'none';
        
        // Stäng av lyssnare om de är igång
        if (chatUnsubscribe) chatUnsubscribe();
        if (typeof jobsUnsubscribe === 'function') jobsUnsubscribe();
        if (typeof specsUnsubscribe === 'function') specsUnsubscribe();
        
        // Stäng av lager-lyssnaren om den finns (du kan behöva skapa en variabel för den också om du vill vara strikt)
        // Men eftersom vi laddar om sidan vid utloggning är det oftast lugnt.
    }
});

// Global cache för sparade märken (Regnr -> Märke)
let vehicleBrandCache = {}; 

// Lista över tillgängliga märken (Namn: Ikon-slug)
const AVAILABLE_BRANDS = {
    'Volvo': 'volvo', 'BMW': 'bmw', 'Audi': 'audi', 'VW': 'volkswagen',
    /*'Mercedes': 'mercedes',*/ 'Tesla': 'tesla', 'Toyota': 'toyota', 'Ford': 'ford', 
    'Kia': 'kia', /*'Saab': 'saab',*/ 'Porsche': 'porsche', 'Seat': 'seat', 
    'Skoda': 'skoda', 'Nissan': 'nissan', 'Peugeot': 'peugeot', 'Renault': 'renault', 
    'Fiat': 'fiat', 'Iveco': 'iveco', 'Honda': 'honda', 'Mazda': 'mazda',
    'Hyundai': 'hyundai', 'Polestar': 'polestar', 'Mini': 'mini', 'Jeep': 'jeep',
    /*'Land Rover': 'landrover',*/ 'Subaru': 'subaru', 'Suzuki': 'suzuki', /*'Lexus': 'lexus',*/
    'Chevrolet': 'chevrolet', 'Citroen': 'citroen', 'Opel': 'opel', 'Dacia': 'dacia'
};

// --- HJÄLPFUNKTION (Högst upp i app.js) ---
function getBrandIconUrl(text, regnr) {
    // 1. PRIORITET: Kolla om vi har sparat ett märke manuellt för detta regnr
    if (regnr && vehicleBrandCache[regnr]) {
        const brandSlug = vehicleBrandCache[regnr];
        return `https://cdn.simpleicons.org/${brandSlug}`;
    }

    // 2. FALLBACK: Gissa baserat på text (din gamla logik)
    const searchStr = (text || '').toLowerCase();
    
    // Vi använder vår globala lista AVAILABLE_BRANDS för att söka
    for (const [name, iconName] of Object.entries(AVAILABLE_BRANDS)) {
        // Sök på både märkesnamnet (t.ex "volvo") och slugen (t.ex "volkswagen")
        if (searchStr.includes(name.toLowerCase()) || searchStr.includes(iconName)) {
            return `https://cdn.simpleicons.org/${iconName}`;
        }
    }
    
    // Specialfall för "Merc" / "Benz" som inte täcks av listan exakt
    if (searchStr.includes('merc') || searchStr.includes('benz')) return `https://cdn.simpleicons.org/mercedes`;

    return null;
}

// --- HJÄLPFUNKTION: AVANCERAD SÖKNING ---
function jobMatchesSearch(job, searchTerm) {
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    
    // Hämta data säkert (om fältet saknas blir det tom text)
    const kund = (job.kundnamn || '').toLowerCase();
    const reg = (job.regnr || '').toLowerCase();
    const kommentar = (job.kommentar || '').toLowerCase(); // Anteckningar
    const paket = (job.paket || '').toLowerCase();
    const status = (job.status || '').toLowerCase();
    
    // Sök igenom utgiftslistan (delar)
    let parts = "";
    if (job.utgifter && Array.isArray(job.utgifter)) {
        parts = job.utgifter.map(u => (u.namn || '').toLowerCase()).join(' ');
    }

    // Returnera SANT om sökordet finns i NÅGOT av fälten
    return kund.includes(term) || 
           reg.includes(term) || 
           kommentar.includes(term) || 
           paket.includes(term) || 
           status.includes(term) ||
           parts.includes(term);
}

// 3. STARTA APPENS UI (När sidan laddat klart)
document.addEventListener('DOMContentLoaded', function() {
    try {
        console.log("Sidan laddad, kopplar event listeners...");
        setupEventListeners();
        
        // Koppla inloggningsformuläret
        const loginForm = document.getElementById('loginForm');
        if (loginForm) {
            loginForm.addEventListener('submit', handleLogin);
        }
        
        // Koppla logga ut-knapp
        const logoutBtn = document.querySelector('.logout-icon-btn');
        if(logoutBtn) {
            logoutBtn.addEventListener('click', handleLogout);
        }

    } catch (e) {
        console.error("Fel vid start:", e);
    }
	initSettings();
});

function handleLogin(e) {
    e.preventDefault();
    const email = document.getElementById('loginEmail').value;
    const password = document.getElementById('loginPassword').value;
    const errorEl = document.getElementById('loginError');
    const btn = e.target.querySelector('button');
    
    // UI Feedback
    const originalText = btn.innerHTML;
    btn.innerHTML = 'Loggar in...';
    btn.disabled = true;
    if(errorEl) errorEl.style.display = 'none';

    firebase.auth().signInWithEmailAndPassword(email, password)
        .catch((error) => {
            let msg = "Fel e-post eller lösenord.";
            if(error.code === 'auth/user-not-found') msg = "Kontot finns inte.";
            if(error.code === 'auth/wrong-password') msg = "Fel lösenord.";
            
            if(errorEl) {
                errorEl.textContent = msg;
                errorEl.style.display = 'block';
            }
            btn.innerHTML = originalText;
            btn.disabled = false;
        });
}

function handleLogout() {
    if(confirm("Vill du logga ut?")) {
        // 1. Stoppa lyssnarna för att slippa felmeddelanden
        if (jobsUnsubscribe) jobsUnsubscribe();
        if (specsUnsubscribe) specsUnsubscribe();
        if (chatUnsubscribe) chatUnsubscribe(); // Om du har chatt igång

        // 2. Logga ut från Firebase
        firebase.auth().signOut().then(() => {
            // 3. Tvinga stängning av inställningsmenyn och andra modaler
            document.querySelectorAll('.modal-backdrop').forEach(el => {
                el.classList.remove('show');
                el.style.display = 'none'; // Säkerställ att de döljs
            });

            // 4. Ladda om sidan för en fräsch start (tar bort all gammal data ur minnet)
            window.location.reload();
        });
    }
}

// 3. HÄMTA DATA
function initRealtimeListener() {
    const container = document.getElementById('jobListContainer');
    
    // VIKTIGT: Spara lyssnaren i variabeln 'jobsUnsubscribe'
    jobsUnsubscribe = db.collection("jobs").onSnapshot(snapshot => {
        allJobs = [];
        snapshot.forEach(doc => {
            allJobs.push({ id: doc.id, ...doc.data() });
        });
        renderDashboard();
    }, error => {
        console.error("Fel vid hämtning av jobb:", error);
        // Ignorera fel om det beror på att vi precis loggat ut
        if (error.code === 'permission-denied') {
            // Gör inget, vi har troligen loggat ut
        }
    });
	
	// VIKTIGT: Spara lyssnaren i variabeln 'specsUnsubscribe'
    specsUnsubscribe = db.collection("vehicleSpecs").onSnapshot(snapshot => {
        vehicleBrandCache = {}; 
        snapshot.forEach(doc => {
            const data = doc.data();
            if (data.brand_manual) {
                vehicleBrandCache[doc.id] = data.brand_manual;
            }
        });
        renderDashboard();
    });
}

// 4. RENDERA DASHBOARD
function renderDashboard() {
    // 1. Uppdatera Header Datum
    updateHeaderDate();
    // 2. Uppdatera Stats
    updateStatsCounts(allJobs);

	updateCustomerDatalist();

    const container = document.getElementById('jobListContainer');
    const isMobile = window.innerWidth <= 768; 
    
    // filterJobs sorterar redan datan korrekt (Kommande = Stigande, Alla = Fallande)
    let jobsToDisplay = filterJobs(allJobs);

    if (jobsToDisplay.length === 0) {
        container.innerHTML = '<p style="text-align:center; padding:2rem; color:#888;">Inga jobb hittades.</p>';
        return;
    }

    if (isMobile) {
        // --- MOBIL: DATUM UTANFÖR KORTET ---
        let html = '';
        let lastDateStr = '';

        // OBS: Vi sorterar INTE om här längre, vi litar på filterJobs ordning (Fix 2)
        
        jobsToDisplay.forEach(job => {
            const d = new Date(job.datum);
            const dateHeader = d.toLocaleDateString('sv-SE', { weekday: 'short', day: 'numeric', month: 'short' });
            const formattedHeader = dateHeader.charAt(0).toUpperCase() + dateHeader.slice(1); 

            if (formattedHeader !== lastDateStr) {
                html += `<div class="date-separator">${formattedHeader}</div>`;
                lastDateStr = formattedHeader;
            }
            html += createJobCard(job);
        });

        container.innerHTML = html;

    } else {
        // DESKTOP (Tabell)
        let tableHTML = `<table id="jobsTable"><thead><tr><th>Status</th><th>Datum</th><th>Kund</th><th>Reg.nr</th><th style="text-align:right">Pris</th><th class="action-col">Åtgärder</th></tr></thead><tbody>`;
        jobsToDisplay.forEach(job => tableHTML += createJobRow(job));
        tableHTML += `</tbody></table>`;
        container.innerHTML = tableHTML;
    }
}

// --- HJÄLPFUNKTION: Uppdatera datumet i headern ---
function updateHeaderDate() {
    const now = new Date();
    const days = ['SÖN','MÅN','TIS','ONS','TORS','FRE','LÖR'];
    const months = ['JAN','FEB','MAR','APR','MAJ','JUN','JUL','AUG','SEP','OKT','NOV','DEC'];
    
    const dayEl = document.getElementById('headerCurrentDay');
    const dateEl = document.getElementById('headerCurrentDate');
    
    // Uppdatera bara om elementen finns (finns bara i mobil-vyn)
    if(dayEl && dateEl) {
        dayEl.textContent = days[now.getDay()];
        dateEl.textContent = `${now.getDate()} ${months[now.getMonth()]}`;
    }
}

// Definiera ikoner som variabler för enklare hantering (kan läggas utanför funktionen)
const ICONS = {
    CAR: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 20a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2H7a2 2 0 0 0-2 2v11a2 2 0 0 0 2 2h10z"/><circle cx="7" cy="18" r="2"/><circle cx="17" cy="18" r="2"/><path d="M5 10H19"/></svg>',
    USER: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>',
    CALENDAR: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>',
    CLOCK: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>',
    PRICE: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>',
    COMMENT: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>'
};


// --- HJÄLPFUNKTION: Skapa Mobilkortet (FINAL LIST V5) ---
function createJobCard(job) {
    const d = new Date(job.datum);
    const now = new Date(); 

    let rawMonth = d.toLocaleDateString('sv-SE', { month: 'short' });
    let cleanMonth = rawMonth.replace(/\./g, '');
    let month = cleanMonth.charAt(0).toUpperCase() + cleanMonth.slice(1);
    
    const dateStr = `${d.getDate()} ${month}. ${d.getFullYear()}`;
    const timeStr = d.toLocaleTimeString('sv-SE', { hour: '2-digit', minute: '2-digit' });
    
    const combinedText = (job.kommentar + " " + job.paket + " " + job.kundnamn + " " + (job.bilmodell || "")).toLowerCase();
    const brandUrl = getBrandIconUrl(combinedText, job.regnr);

    // 1. Ikoner med tvingad storlek (16px)
    let iconHtml = '';
    const iconStyle = 'width:16px; height:16px; margin-right:6px; display:block;';
    
    if (brandUrl) {
        iconHtml = `<img src="${brandUrl}" class="brand-logo-img" alt="Logo" style="${iconStyle} object-fit:contain;">`;
    } else {
        iconHtml = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="${iconStyle}"><path d="M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9C18.7 10.6 16 10 16 10s-1.3-1.4-2.2-2.3c-.5-.4-1.1-.7-1.8-.7H5c-.6 0-1.1.4-1.4.9l-1.4 2.9A3.7 3.7 0 0 0 2 12v4c0 .6.4 1 1 1h2"/><circle cx="7" cy="17" r="2"/><circle cx="17" cy="17" r="2"/><path d="M5 17h8"/></svg>`;
    }

    const price = job.kundpris ? `${job.kundpris}:-` : '0:-';
    const regNr = (job.regnr && job.regnr.toUpperCase() !== 'OKÄNT') ? job.regnr.toUpperCase() : '---';
    const customer = job.kundnamn ? job.kundnamn : 'Okänd'; 
    const paket = job.paket ? job.paket : '-';
    const mileage = '-';

    const statusRaw = job.status || 'bokad';
    const statusText = statusRaw.toUpperCase(); 

    let headerClass = 'bg-bokad'; 

    if(statusRaw === 'klar') headerClass = 'bg-klar';
    if(statusRaw === 'faktureras') headerClass = 'bg-faktureras';
    if(statusRaw === 'avbokad') headerClass = 'bg-avbokad';
    if(statusRaw === 'offererad') headerClass = 'bg-offererad';

    if (statusRaw === 'bokad' && d < now) {
        headerClass = 'bg-overdue';
    }

    const nameLower = (job.kundnamn || '').toLowerCase();
    const isCorporate = ['bmg', 'fogarolli', 'ab'].some(c => nameLower.includes(c));
    
    const iUser = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>`;
    const iBriefcaseGreen = `<svg class="icon-sm" style="color: #10B981;" viewBox="0 0 64 64"><use href="#icon-office-building"></use></svg>`;
    
    const nameValueHtml = isCorporate 
        ? `<span class="company-icon-wrapper">${iBriefcaseGreen}</span><span>${customer}</span>` 
        : `<span>${customer}</span>`;

    let commentHtml = '';
    if (job.kommentar && job.kommentar.length > 0) {
        commentHtml = `<span class="comment-text">${job.kommentar}</span>`;
    } else {
        commentHtml = `<span class="comment-text comment-placeholder">Inga kommentarer finns tillgängliga.</span>`;
    }
    
    const iCal = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>`;
    const iClock = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>`;
    const iComment = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>`;
    const iTag = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"/><line x1="7" y1="7" x2="7.01" y2="7"/></svg>`;
    const iBox = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path><polyline points="3.27 6.96 12 12.01 20.73 6.96"></polyline><line x1="12" y1="22.08" x2="12" y2="12"></line></svg>`;
    const iGauge = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 14c1.66 0 3-1.34 3-3V5h-6v6c0 1.66 1.34 3 3 3z"/><path d="M12 14v7"/><path d="M2 12h2"/><path d="M20 12h2"/><path d="M19.07 4.93L17.66 6.34"/><path d="M4.93 4.93L6.34 6.34"/></svg>`;
    const iInfoSmall = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="width:12px; height:12px; margin-left:4px;"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line></svg>`;

    // --- HÄR ÄR FÖRÄNDRINGEN: Tvingande Inline Styles för Headern ---
    // Height: 34px !important
    return `
        <div class="job-card-new" id="card-${job.id}" onclick="openEditModal('${job.id}')">
            
            <div class="card-header-strip ${headerClass}" style="height: 24px !important; min-height: 24px !important; padding: 0 10px !important; display: flex !important; align-items: center !important;">
                
                <div class="header-reg-clickable" onclick="event.stopPropagation(); openVehicleModal('${regNr}')" style="display: flex; align-items: center; height: 100%;">
                    ${iconHtml} 
                    <span style="font-size: 0.9rem; font-weight: 700; line-height: 1;">${regNr}</span>
                    <span class="reg-info-sup" style="display: flex; align-items: center; opacity: 0.7;">${iInfoSmall}</span>
                </div>
                
                <div class="header-right-side" style="display:flex; align-items:center; gap:8px; height: 100%;">
                    <div class="header-status-badge" style="padding: 1px 6px; font-size: 0.65rem; border-radius: 4px; line-height: 1.2;">
                        ${statusText}
                    </div>
                    <button class="card-menu-btn" onclick="event.stopPropagation(); toggleCardActions('${job.id}', event)" style="height: 30px; width: 30px; display: flex; align-items: center; justify-content: center; padding: 0; background: transparent; border: none; color: inherit;">
                        <svg viewBox="0 0 24 24" fill="currentColor" width="20" height="20"><path d="M12 8c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm0 2c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0 6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z"/></svg>
                    </button>
                </div>
            </div>

            <div class="card-body">
                <div class="info-row">
                    <span class="row-label">${iUser} Namn</span>
                    <span class="row-value" onclick="event.stopPropagation(); openCustomerByName('${customer}')" style="cursor:pointer; text-decoration:underline; text-decoration-color:#cbd5e1; text-underline-offset:3px;">
					    ${nameValueHtml}
					</span>
                </div>
                <div class="info-row"><span class="row-label">${iBox} Paket</span><span class="row-value">${paket}</span></div>
                <div class="info-row"><span class="row-label" title="Mätarställning">${iGauge} Mätarst.</span><span class="row-value">${mileage}</span></div>
                <div class="info-row"><span class="row-label">${iCal} Datum</span><span class="row-value">${dateStr}</span></div>
                <div class="info-row"><span class="row-label">${iClock} Tid</span><span class="row-value">${timeStr}</span></div>
                <div class="info-row price-row"><span class="row-label">${iTag} Att betala</span><span class="row-value">${price}</span></div>
            </div>

            <div class="card-comments-section">
                ${iComment}
                ${commentHtml}
            </div>

            <div class="card-actions-expand" id="actions-${job.id}" onclick="event.stopPropagation()">
                <button class="inline-action-btn success" title="Markera som Klar" onclick="setStatus('${job.id}', 'klar')">
                    <svg class="icon-sm"><use href="#icon-check"></use></svg>
                </button>
                <button class="inline-action-btn warning" title="Till Fakturering" onclick="setStatus('${job.id}', 'faktureras')">
                    <svg class="icon-sm"><use href="#icon-clipboard"></use></svg>
                </button>
                <button class="inline-action-btn danger" title="Radera Jobb" onclick="deleteJob('${job.id}')">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="icon-sm"><path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"></path></svg>
                </button>
            </div>

        </div>`;
}

// Hjälpfunktion: Skapa DESKTOP RAD (Samma som innan men inkluderad för helhet)
function createJobRow(job) {
    const statusText = {
        'bokad': 'Bokad', 'klar': 'Slutfört', 'faktureras': 'Fakturering', 'offererad': 'Offererad', 'avbokad': 'Avbokad'
    };
    
    let fullDate = "---";
    if (job.datum) {
        try {
            const d = new Date(job.datum);
            const dateStr = d.toLocaleDateString('sv-SE', { weekday: 'short', day: 'numeric', month: 'short' });
            const timeStr = d.toLocaleTimeString('sv-SE', { hour: '2-digit', minute: '2-digit' });
            const capDateStr = dateStr.charAt(0).toUpperCase() + dateStr.slice(1);
            fullDate = `${capDateStr}. kl. ${timeStr.replace('.', ':')}`;
        } catch(e) {}
    }

    const nameLower = (job.kundnamn || '').toLowerCase();
    const isCorporate = ['bmg', 'fogarolli'].some(c => nameLower.includes(c));
    const iconType = isCorporate ? '#icon-office-building' : '#icon-user';
    const iconColor = isCorporate ? '#10B981' : '#0066FF'; 

	const regPlate = (job.regnr && job.regnr.toUpperCase() !== 'OKÄNT') 
	    ? `<div class="reg-plate" style="cursor:pointer;" onclick="event.stopPropagation(); openVehicleModal('${job.regnr}')">
	         <span class="reg-country">S</span>
	         <span class="reg-number">${job.regnr}</span>
	       </div>` 
	    : '---';

    // FIX 11: Inline SVG för papperskorgen
    const trashIcon = `<svg class="icon-sm" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>`;

    return `
        <tr data-id="${job.id}" class="job-row">
            <td><span class="status-badge status-${job.status}">${statusText[job.status] || job.status}</span></td>
            <td>${fullDate}</td>
            <td>
                <div class="customer-link">
			    <div class="customer-link" onclick="event.stopPropagation(); openCustomerByName('${job.kundnamn}')" style="cursor:pointer;">
				    <svg class="icon-sm" style="color: ${iconColor}"><use href="${iconType}"></use></svg>
				    <span style="text-decoration:underline; text-decoration-color:#e2e8f0; text-underline-offset:3px;">${job.kundnamn}</span>
				</div>
            </td>
            <td>${regPlate}</td>
            <td style="text-align:right" class="money-related">${job.kundpris || 0} kr</td>
            <td class="action-col">
                <button class="icon-btn" title="Klar" onclick="event.stopPropagation(); setStatus('${job.id}', 'klar')"><svg class="icon-sm"><use href="#icon-check"></use></svg></button>
                <button class="icon-btn" title="Radera" onclick="event.stopPropagation(); deleteJob('${job.id}')">${trashIcon}</button>
            </td>
        </tr>
    `;
}

// Lägg till en listener för att rita om när man ändrar storlek på fönstret
window.addEventListener('resize', renderDashboard);

// 5. FILTER-LOGIK
function filterJobs(jobs) {
    let filtered = jobs.filter(j => !j.deleted);

    // 1. SÖKNING
    if (currentSearchTerm) {
        filtered = filtered.filter(j => jobMatchesSearch(j, currentSearchTerm));
        // Vid sökning, sortera alltid på datum (nyast först)
        return filtered.sort((a,b) => new Date(b.datum) - new Date(a.datum));
    }

    // 2. VANLIG FILTRERING (Om vi inte söker)
    
    // Vi behöver inte "today" variabeln längre för filtreringen av kommande,
    // men den kan vara bra att ha kvar om du vill göra annan logik senare.
    // const today = new Date();
    // today.setHours(0,0,0,0);

    if (currentStatusFilter === 'kommande') {
        // HÄR ÄR ÄNDRINGEN:
        // Vi tog bort "&& new Date(j.datum) >= today"
        // Nu visas ALLT som är bokat, även om datumet passerat.
        return filtered.filter(j => j.status === 'bokad')
                       .sort((a,b) => new Date(a.datum) - new Date(b.datum)); // Äldst först (så missade hamnar i toppen)
                       
    } else if (currentStatusFilter === 'alla') {
        return filtered.sort((a,b) => new Date(b.datum) - new Date(a.datum));
    } else {
        return filtered.filter(j => j.status === currentStatusFilter)
                       .sort((a, b) => new Date(b.datum) - new Date(a.datum));
    }   
}

// 6. UPPDATERA BADGES (SIFFROR)
function updateStatsCounts(jobs) {
    const active = jobs.filter(j => !j.deleted);
    const today = new Date(); today.setHours(0,0,0,0);

    document.getElementById('stat-upcoming').textContent = active.filter(j => j.status === 'bokad' && new Date(j.datum) >= today).length;
    document.getElementById('stat-invoice').textContent = active.filter(j => j.status === 'faktureras').length;
    document.getElementById('stat-finished').textContent = active.filter(j => j.status === 'klar').length;
    document.getElementById('stat-offered').textContent = active.filter(j => j.status === 'offererad').length;
    document.getElementById('stat-all').textContent = active.length;
}

// 7. EVENT LISTENERS
function setupEventListeners() {

	// --- KALENDER KNAPP ---
	const navCalendar = document.getElementById('navCalendar');
	if (navCalendar) {
	    navCalendar.addEventListener('click', () => {
	        // 1. Markera knappen som aktiv
	        document.querySelectorAll('.nav-link').forEach(n => n.classList.remove('active'));
	        navCalendar.classList.add('active');
	
	        // 2. Dölj andra vyer
	        document.getElementById('statBar').style.display = 'none';
	        document.getElementById('timelineView').style.display = 'none';
	        document.getElementById('customersView').style.display = 'none';
	        
	        // 3. Visa kalendern
	        document.getElementById('calendarView').style.display = 'block';
	
	        // 4. Starta kalendern (med dina jobb och redigera-funktionen)
	        // Vi använder setTimeout för att säkerställa att diven är synlig innan kalendern ritas
	        setTimeout(() => {
	            initCalendar('calendar-wrapper', allJobs, openEditModal);
	        }, 50);
	    });
	}

	// --- KOPPLA KALENDER FRÅN MENY/INSTÄLLNINGAR ---
    const menuBtnCalendar = document.getElementById('menuBtnCalendar');
    if (menuBtnCalendar) {
        menuBtnCalendar.addEventListener('click', () => {
            // 1. Stäng menyn (viktigt!)
            closeSettings(); 

            // 2. Dölj andra vyer
            const statBar = document.getElementById('statBar');
            const timelineView = document.getElementById('timelineView');
            const customersView = document.getElementById('customersView');
            
            if(statBar) statBar.style.display = 'none';
            if(timelineView) timelineView.style.display = 'none';
            if(customersView) customersView.style.display = 'none';
            
            // 3. Visa kalendern
            const calView = document.getElementById('calendarView');
            if(calView) calView.style.display = 'block';

            // 4. Ladda kalendern
            // Vi väntar 200ms så menyn hinner stängas snyggt innan vi ritar kalendern
            setTimeout(() => {
                initCalendar('calendar-wrapper', allJobs, openEditModal);
            }, 200);
        });
    }

	/*MER MENY I INSTÄLLNINGAR _ MOBIL*/
	document.getElementById('menuBtnCustomers').addEventListener('click', () => {
	    // 1. Stäng "Mer"-menyn
	    closeSettings(); // Din befintliga funktion för att stänga inställningar
	    
	    // 2. Visa Kundvyn (Samma logik som tidigare)
	    document.getElementById('statBar').style.display = 'none';
	    document.getElementById('timelineView').style.display = 'none';
	    document.getElementById('customersView').style.display = 'block';
	    
	    // 3. Ladda listan
	    renderCustomerView();
	});

	// --- KOPPLA MOBIL-KNAPPEN "KUNDER" ---
	const mobileCustBtn = document.getElementById('mobileCustomersBtn');
	if (mobileCustBtn) {
	    mobileCustBtn.addEventListener('click', () => {
	        // 1. Byt aktiv knapp i menyn
	        document.querySelectorAll('.mobile-nav-item').forEach(btn => btn.classList.remove('active'));
	        mobileCustBtn.classList.add('active');
	
	        // 2. Hantera historik (för back-knappen)
	        addHistoryState();
	
	        // 3. Visa Kundvyn, dölj andra
	        document.getElementById('statBar').style.display = 'none';
	        document.getElementById('timelineView').style.display = 'none';
	        document.getElementById('customersView').style.display = 'block';
	        
	        // 4. Ladda listan
	        renderCustomerView();
	    });
	}
	
	// --- FIX FÖR ATT LÄMNA VYN (MOBIL) ---
	// Koppla "Hem"-knappen (Vy) så den återställer allt
	document.getElementById('mobileHomeBtn').addEventListener('click', () => {
	    document.getElementById('statBar').style.display = 'grid'; // Eller flex/block beroende på din CSS
	    document.getElementById('timelineView').style.display = 'block';
	    document.getElementById('customersView').style.display = 'none';
	    
	    // Nollställ sökning
	    const custSearch = document.getElementById('customerSearchInput');
	    if(custSearch) custSearch.value = '';
	});

	// --- NAVIGERING: ÖVERSIKT (TILLBAKA) ---
    const btnOverview = document.getElementById('btnOverview');
    
    if (btnOverview) {
        btnOverview.addEventListener('click', () => {
            // 1. Uppdatera UI (Markera knappen som aktiv)
            document.querySelectorAll('.nav-link').forEach(n => n.classList.remove('active'));
            btnOverview.classList.add('active');
            
            // 2. Visa översikts-vyerna
            // statBar har display: grid i CSS, så vi återställer till det (eller tom sträng för att låta CSS styra)
            const statBar = document.getElementById('statBar');
            if(statBar) statBar.style.display = ''; 
            
            const timelineView = document.getElementById('timelineView');
            if(timelineView) timelineView.style.display = 'block';
            
            // 3. Dölj kundvyn
            const customersView = document.getElementById('customersView');
            if(customersView) customersView.style.display = 'none';
        });
    }

	// Hitta knappen för "Kunder" i sidebaren (du kanske måste ge den ett ID i HTML, t.ex. id="navCustomers")
	const navCustomers = document.getElementById('navCustomers');

	if (navCustomers) {
	    navCustomers.addEventListener('click', () => {
	        // 1. Uppdatera UI (Markera knappen som aktiv)
	        document.querySelectorAll('.nav-link').forEach(n => n.classList.remove('active'));
	        navCustomers.classList.add('active');
	        
	        // 2. Hantera mobil-menyn (om man är på mobil)
	        // Detta är viktigt så man ser att man är på "Kunder" även i bottenmenyn om du lägger till det där
	        
	        // 3. Dölj andra vyer, visa kundvyn
	        const statBar = document.getElementById('statBar');
	        const timelineView = document.getElementById('timelineView');
	        const customersView = document.getElementById('customersView');
	
	        if(statBar) statBar.style.display = 'none';
	        if(timelineView) timelineView.style.display = 'none';
	        if(customersView) customersView.style.display = 'block';
	        
	        // 4. Ladda datan
	        renderCustomerView();
	    });
	}
	
	// Sökfunktion för kunder
	document.getElementById('customerSearchInput')?.addEventListener('input', (e) => {
	    renderCustomerView(e.target.value);
	});
	
	// Stäng modal
	document.getElementById('closeCustomerModalBtn')?.addEventListener('click', () => {
	    document.getElementById('customerModal').classList.remove('show');
	});

	// Hantera val av paket (Smart ifyllnad med Olje-kalkylator)
    const paketSelect = document.getElementById('paketSelect');
    if (paketSelect) {
        paketSelect.addEventListener('change', (e) => {
            const val = e.target.value;
            const paketData = servicePaket[val];

            if (paketData) {
                // 1. Fyll i kommentar
                const kommentarFalt = document.getElementById('kommentar');
                if (kommentarFalt) {
                    kommentarFalt.value = paketData.kommentar;
                }

                // Nollställ listor
                currentExpenses = []; 
                let totalKundPris = paketData.arbetskostnad || 0; // Börja med arbetskostnaden

                // 2. Hantera material (om det finns)
                if (paketData.material && paketData.material.length > 0) {
                    
                    paketData.material.forEach(item => {
                        
                        // --- A. FLYTANDE (OLJA) ---
                        if (item.typ === 'flytande') {
                            // Fråga om antal liter
                            let input = prompt(`Hur många liter ${item.namn}?`, "4");
                            
                            // Hantera inmatning (byt komma mot punkt)
                            let liter = input ? parseFloat(input.replace(',', '.')) : 0;
                            
                            if (!isNaN(liter) && liter > 0) {
                                // A1. Räkna ut vad KUNDEN ska betala
                                const kostnadForKund = liter * item.prisKundPerLiter;
                                totalKundPris += kostnadForKund;

                                // A2. Räkna ut DIN utgift (Inköpspris)
                                const dinKostnad = Math.round(liter * item.prisInkopPerLiter);
                                
                                // Lägg till i utgiftslistan (Osynligt för kunden, syns för din vinst)
                                currentExpenses.push({
                                    namn: `${item.namn} (${liter}L à ${item.prisInkopPerLiter}kr)`,
                                    kostnad: dinKostnad
                                });
                            }
                        } 
                        
                        // --- B. FASTA DELAR (OLJEFILTER) ---
                        else {
                            // B1. Lägg på priset till kundens total
                            totalKundPris += item.prisKund;

                            // B2. Lägg till din inköpskostnad i utgiftslistan
                            currentExpenses.push({
                                namn: item.namn,
                                kostnad: item.prisInkop || 0 // Om du satt 0 blir utgiften 0
                            });
                        }
                    });
                }

                // 3. Uppdatera UI
                document.getElementById('kundpris').value = totalKundPris;
                renderExpenses(); // Rita ut utgiftslistan och räkna vinst
            }
        });
    }

	// --- HISTORIK-HANTERING (BACK-KNAPP) ---

	// 1. Lyssna på när användaren trycker bakåt (eller swipar)
	window.addEventListener('popstate', function(event) {
	    // Kolla om någon modal är öppen
	    const openModal = document.querySelector('.modal-backdrop.show');
	    const chatWidget = document.getElementById('chatWidget');
	    const mobileSearch = document.getElementById('mobileSearchModal');
	    const imageZoom = document.getElementById('imageZoomModal');
	    const vehicleModal = document.getElementById('vehicleModal');
	
	    // Prioritetsordning för att stänga saker:
	    
	    // 1. Bild-zoom
	    if (imageZoom && imageZoom.style.display === 'flex') {
	        imageZoom.style.display = 'none';
	        return; // Stanna här, stäng inte mer
	    }
	
	    // 2. Fordons-modal (Specialfall då den ibland ligger över andra)
	    if (vehicleModal && vehicleModal.classList.contains('show')) {
	        vehicleModal.classList.remove('show');
	        return;
	    }
	
	    // 3. Chatt-widget
	    if (chatWidget && chatWidget.style.display === 'flex') {
	        chatWidget.style.display = 'none';
	        document.body.style.overflow = ''; // Lås upp scroll
	        return;
	    }
	
	    // 4. Mobil-sök
	    if (mobileSearch && mobileSearch.classList.contains('show')) {
	        mobileSearch.classList.remove('show');
	        return;
	    }
	
	    // 5. Vanliga modaler (Jobb-modal etc)
	    if (openModal) {
	        closeModals(); // Din befintliga funktion
	        return;
	    }
	    
	    // Om inget var öppet, låt webbläsaren göra sin vanliga "back" (vilket kan vara att stänga appen om historiken är slut)
	});
    
	// Hantera klick på Sök-knappen i menyn
	document.getElementById('mobileSearchBtn')?.addEventListener('click', () => {
	    const searchModal = document.getElementById('mobileSearchModal');
	    const searchInput = document.getElementById('mobileSearchInput');
	    const resultsContainer = document.getElementById('mobileSearchResults');

	    // 1. Öppna modalen
	    searchModal.classList.add('show');
	    
	    // 2. Nollställ gamla sökningar för en fräsch start
	    searchInput.value = '';
	    resultsContainer.innerHTML = '';
	    
	    // 3. Markera knappen som aktiv i menyn
	    document.querySelectorAll('.mobile-nav-item').forEach(btn => btn.classList.remove('active'));
	    document.getElementById('mobileSearchBtn').classList.add('active');

	    // 4. VIKTIGT: Sätt fokus i rutan (Tangentbordet kommer upp)
	    // Vi väntar 100ms för att säkerställa att modalen hunnit bli synlig först
	    setTimeout(() => {
	        searchInput.focus();
	    }, 100);
	});
	
    // Hantera klick på statistik-korten (Filter)
    document.querySelectorAll('.stat-card').forEach(card => {
        card.addEventListener('click', () => {
            document.querySelectorAll('.stat-card').forEach(c => c.classList.remove('active'));
            card.classList.add('active');
            currentStatusFilter = card.dataset.filter;
            currentSearchTerm = '';
            document.getElementById('searchBar').value = '';
            renderDashboard();
        });
    });

    // Hantera klick på rader i tabellen (Redigera jobb)
    document.getElementById('jobListContainer').addEventListener('click', (e) => {
        // Hitta närmaste tr-element (rad)
        const row = e.target.closest('tr');
        // Om vi klickade på en rad och den har ett ID
        if (row && row.dataset.id) {
            openEditModal(row.dataset.id);
        }
    });

	// --- NYTT: KOPPLA CHATT-KNAPPEN ---
    const fabChat = document.getElementById('fabChat');
    if (fabChat) {
        fabChat.addEventListener('click', () => {
            toggleChatWidget();
        });
    }

    // Sökfältet
    document.getElementById('searchBar').addEventListener('input', (e) => {
        currentSearchTerm = e.target.value;
        renderDashboard();
    });

    // Modal: Nytt Jobb (FAB)
    document.getElementById('fabAddJob').addEventListener('click', () => {
        openNewJobModal();
    });

    // Stäng-knappar
    const backBtn = document.getElementById('modalBackBtn');
	if (backBtn) {
	    backBtn.addEventListener('click', (e) => {
	        e.preventDefault(); // Förhindra standardbeteende
	        closeModals();
	    });
	}
    document.getElementById('modalCancelBtn').addEventListener('click', closeModals);
    
    // Spara jobb (Både nytt och redigerat)
    document.getElementById('jobModalForm').addEventListener('submit', handleSaveJob);
}

// --- MODAL FUNKTIONER ---

function openNewJobModal() {
	addHistoryState();
    const form = document.getElementById('jobModalForm');
    form.reset();
    document.getElementById('jobId').value = "";
    document.getElementById('modalTitle').textContent = "Lägg till nytt jobb";
    document.getElementById('datum').valueAsDate = new Date();
    document.getElementById('tid').value = "08:00";
    document.getElementById('statusSelect').value = "bokad";
    
    // Nollställ utgifter
    currentExpenses = [];
    renderExpenses();

    document.getElementById('jobModal').classList.add('show');
}

function openEditModal(id) {
	addHistoryState();
    const job = allJobs.find(j => j.id === id);
    if (!job) return;

    // Sätt ID och Titel
    document.getElementById('jobId').value = job.id;
    document.getElementById('modalTitle').textContent = "Redigera jobb";

    // Fyll i standardfält
    document.getElementById('kundnamn').value = job.kundnamn || '';
    document.getElementById('regnr').value = job.regnr || '';
    document.getElementById('kundpris').value = job.kundpris || 0;
    document.getElementById('statusSelect').value = job.status || 'bokad';
    document.getElementById('paketSelect').value = job.paket || '';     // NYTT
    document.getElementById('kommentar').value = job.kommentar || '';   // NYTT

    // Datum och Tid
    if (job.datum && job.datum.includes('T')) {
        const parts = job.datum.split('T');
        document.getElementById('datum').value = parts[0];
        document.getElementById('tid').value = parts[1];
    }

    // UTGIFTER: Ladda in och rendera
	currentExpenses = Array.isArray(job.utgifter) ? job.utgifter : []; 
	renderExpenses();

    document.getElementById('jobModal').classList.add('show');
}

function closeModals() {
    document.querySelectorAll('.modal-backdrop').forEach(m => m.classList.remove('show'));
	if (history.state && history.state.modalOpen) {
        history.back();
    }
}

// 8. DATABAS-FUNKTIONER

async function handleSaveJob(e) {
    e.preventDefault();
    
    const jobIdElement = document.getElementById('jobId');
    const jobId = jobIdElement ? jobIdElement.value : "";
    
    // Hämta värden från formuläret
    const kund = document.getElementById('kundnamn').value || "Okänd kund";
    const reg = document.getElementById('regnr').value.toUpperCase() || "OKÄNT";
    const datum = document.getElementById('datum').value;
    const tid = document.getElementById('tid').value;
    const pris = parseInt(document.getElementById('kundpris').value) || 0;
    const status = document.getElementById('statusSelect').value;
    const paket = document.getElementById('paketSelect').value;
    const kommentar = document.getElementById('kommentar').value;

    // Räkna ut hur mycket olja som finns i formuläret just nu
    const newOilAmount = calculateOilFromExpenses(currentExpenses);

    const jobData = {
        kundnamn: kund,
        regnr: reg,
        datum: `${datum}T${tid}`,
        kundpris: pris,
        status: status,
        paket: paket,
        kommentar: kommentar,
        utgifter: currentExpenses || [],
        deleted: false
    };

    try {
        if (jobId && jobId.trim() !== "") {
            // --- REDIGERA BEFINTLIGT JOBB ---
            
            // 1. Hämta det GAMLA jobbet först för att se vad vi hade förut
            const oldDoc = await db.collection("jobs").doc(jobId).get();
            const oldData = oldDoc.data();
            
            // 2. Räkna ut hur mycket olja det gamla jobbet hade
            const oldOilAmount = calculateOilFromExpenses(oldData.utgifter);
            
            // 3. Räkna ut skillnaden (Nytt - Gammalt)
            // Exempel: Ändra från 4L till 5L. Diff = 1L. Vi ska dra 1L till.
            // Exempel: Ändra från 5L till 4L. Diff = -1L. Vi ska lägga tillbaka 1L.
            const diff = newOilAmount - oldOilAmount;
            
            // 4. Uppdatera jobbet
            await db.collection("jobs").doc(jobId).update(jobData);
            
            // 5. Justera lagret om det blev någon skillnad
            if (diff !== 0) {
                await adjustInventoryBalance(diff);
            }

        } else {
            // --- SKAPA NYTT JOBB ---
            
            jobData.created = new Date().toISOString();
            await db.collection("jobs").add(jobData);
            
            // Dra av hela mängden olja eftersom det är nytt
            if (newOilAmount > 0) {
                await adjustInventoryBalance(newOilAmount);
            }
        }
        
        closeModals();
        document.getElementById('jobModalForm').reset();
        
    } catch (err) {
        console.error("Fel vid spara:", err);
        alert("Kunde inte spara. Felkod: " + err.message);
    }
}

// --- HJÄLPFUNKTION: Räkna ut och dra av olja ---
async function deductOilFromInventory(expenses) {
    let totalOilToDeduct = 0;

    // Loopa igenom utgifterna
    expenses.forEach(item => {
        const name = item.namn || "";
        const nameLower = name.toLowerCase();
        
        // Logik: Leta efter siffra följt av "l" eller "liter"
        // Exempel som fungerar: "Motorolja (4.7L)", "Olja 5,5 liter", "4L Olja"
        if (nameLower.includes('olja')) {
            // Regex för att hitta tal (med punkt eller komma)
            const match = name.match(/(\d+[.,]?\d*)\s*(l|liter)/i); 
            
            if (match) {
                // Byt ut eventuellt komma mot punkt för att JS ska förstå det
                const numberString = match[1].replace(',', '.');
                const liters = parseFloat(numberString);
                
                if (!isNaN(liters)) {
                    totalOilToDeduct += liters;
                }
            }
        }
    });

    if (totalOilToDeduct > 0) {
        console.log(`Drar av ${totalOilToDeduct} liter från lagret...`);
        
        const inventoryRef = db.collection('settings').doc('inventory');
        
        // Använd increment med negativt värde
        await inventoryRef.update({
            motorOil: firebase.firestore.FieldValue.increment(-totalOilToDeduct)
        });
        
        // (Valfritt) Visa en liten popup att det lyckades
        // alert(`Drog av ${totalOilToDeduct}L från lagret.`);
    }
}

async function setStatus(id, status) {
    try {
        await db.collection("jobs").doc(id).update({ status: status });
    } catch (err) { console.error(err); }
}

async function deleteJob(id) {
    if(confirm("Vill du ta bort detta jobb?")) {
        try {
            // 1. Hämta jobbet först
            const doc = await db.collection("jobs").doc(id).get();
            
            if (doc.exists) {
                const data = doc.data();
                
                // SÄKERHETSSPÄRR: Om jobbet redan är raderat, gör ingenting!
                if (data.deleted) {
                    console.warn("Jobbet är redan raderat. Avbryter.");
                    return; 
                }
                
                // 2. Räkna ut oljemängden som ska återföras
                const oilToRefund = calculateOilFromExpenses(data.utgifter);
                
                // 3. Markera som raderat
                await db.collection("jobs").doc(id).update({ deleted: true });
                
                // 4. Lägg tillbaka oljan i lagret
                if (oilToRefund > 0) {
                    await adjustInventoryBalance(-oilToRefund);
                    console.log(`Återförde ${oilToRefund} liter till lagret.`);
                }
            }
        } catch (err) { 
            console.error(err); 
            alert("Kunde inte radera jobbet.");
        }
    }
}

// Lägg till utgift-knapp
document.getElementById('btnAddExpense').addEventListener('click', () => {
    const namnInput = document.getElementById('nyUtgiftNamn');
    const prisInput = document.getElementById('nyUtgiftPris');
    
    const namn = namnInput.value.trim();
    const kostnad = parseInt(prisInput.value);

    if (namn && kostnad > 0) {
        currentExpenses.push({ namn: namn, kostnad: kostnad });
        namnInput.value = '';
        prisInput.value = '';
        renderExpenses(); // Rita om listan och räkna vinst
    }
});

// Uppdatera vinst när kundpris ändras
document.getElementById('kundpris').addEventListener('input', renderExpenses);

function renderExpenses() {
    const listContainer = document.getElementById('expenseList');
    listContainer.innerHTML = '';
    
    let totalUtgifter = 0;
    
    // Skydd: Om currentExpenses inte är en array, nollställ den och avbryt.
    if (!Array.isArray(currentExpenses)) {
        currentExpenses = [];
    }

    // Loopa igenom utgifter och skapa HTML
    currentExpenses.forEach((item, index) => {
        totalUtgifter += item.kostnad;
        
        const div = document.createElement('div');
        div.className = 'expense-item';
        div.innerHTML = `
            <span>${item.namn}</span>
            <div style="display:flex; gap:10px; align-items:center;">
                <strong>-${item.kostnad} kr</strong>
                <button type="button" class="btn-remove-expense" onclick="removeExpense(${index})">&times;</button>
            </div>
        `;
        listContainer.appendChild(div);
    });

    // Räkna ut vinst
    const kundpris = parseInt(document.getElementById('kundpris').value) || 0;
    const vinst = kundpris - totalUtgifter;

    // Uppdatera texten
    document.getElementById('utgifterDisplay').textContent = totalUtgifter;
    const vinstEl = document.getElementById('vinstDisplay');
    vinstEl.textContent = `${vinst} kr`;
    
    // Byt färg om förlust
    vinstEl.style.color = vinst >= 0 ? '#10B981' : '#EF4444';
}

// Ta bort en utgift
window.removeExpense = function(index) {
    currentExpenses.splice(index, 1);
    renderExpenses();
};

// ==========================================
// FORDONSHISTORIK & TEKNISK DATA MODAL (ANPASSAD FÖR vehicleModal)
// ==========================================

function openVehicleModal(regnr) {
    addHistoryState(); // Lägg till i historiken för mobil-back-knapp
    
    if(!regnr || regnr === '---') return;
    
    const cleanReg = regnr.replace(/\s/g, '').toUpperCase();
    const modal = document.getElementById('vehicleModal');
    
    if (!modal) return;

    // 1. Sätt Titel (Regnr)
    const titleEl = document.getElementById('vehicleRegTitle');
    if(titleEl) titleEl.textContent = cleanReg;

    // 2. Injicera Header-knappar (Kopiera & Märke)
    const btnContainer = document.getElementById('vehicleHeaderBtns');
    if (btnContainer) {
        // Hämta märke för ikonen
        const currentLogoUrl = getBrandIconUrl('volvo', cleanReg) || getBrandIconUrl('', cleanReg); 
        
        // Skapa bild-tagg eller fallback-svg
        const logoImgHtml = currentLogoUrl 
            ? `<img src="${currentLogoUrl}" style="width:18px; height:18px; object-fit:contain; filter:grayscale(100%); opacity:0.7;">` 
            : `<svg style="width:16px; height:16px;" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 19l7-7 3 3-7 7-3-3z"></path><path d="M18 13l-1.5-7.5L2 2l3.5 14.5L13 18l5-5z"></path></svg>`;

        btnContainer.innerHTML = `
            <button class="header-icon-action" title="Kopiera" onclick="navigator.clipboard.writeText('${cleanReg}')">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"></path><rect x="8" y="2" width="8" height="4" rx="1" ry="1"></rect></svg>
            </button>
            <button class="header-icon-action" title="Ändra märke" onclick="openBrandSelector('${cleanReg}')">
                ${logoImgHtml}
            </button>
        `;
    }

    // 3. Uppdatera Externa Länkar
    const linkBiluppg = document.getElementById('linkBiluppgifter');
    const linkOljemag = document.getElementById('linkOljemagasinet');
    
    if(linkBiluppg) linkBiluppg.href = `https://biluppgifter.se/fordon/${cleanReg}`;
    if(linkOljemag) linkOljemag.href = `https://www.oljemagasinet.se/`;

    // 4. Hantera AI-Knappen & Teknisk Data
    const specsContainer = document.getElementById('techDataContainer'); 
    const fetchContainer = document.getElementById('fetchDataContainer');
    const fetchBtn = document.getElementById('btnFetchTechData');

    // Nollställ vyerna först (visa inget innan vi vet status)
    if(specsContainer) specsContainer.style.display = 'none';
    if(fetchContainer) fetchContainer.style.display = 'none';

    // Konfigurera knappen
    if (fetchBtn) {
        // VIKTIGT: Sätt onclick här så vi får med rätt 'cleanReg'
        fetchBtn.onclick = function() { 
            fetchTechnicalData(cleanReg); 
        };
        
        // Återställ utseende (om den var "Laddar..." förut)
        fetchBtn.disabled = false;
        fetchBtn.innerHTML = `<svg class="icon-sm" style="margin-right:8px;" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg> Hämta med AI`;
    }

    // Kolla databasen om vi redan har data
    db.collection("vehicleSpecs").doc(cleanReg).get().then(doc => {
        if (doc.exists) {
            const data = doc.data();
            // Kolla om datan verkar giltig (har modell eller olja)
            if (data.model || data.oil || data.engine) {
                if(specsContainer) {
                    specsContainer.innerHTML = generateTechSpecHTML(data, cleanReg);
                    specsContainer.style.display = 'block';
                }
                if(fetchContainer) fetchContainer.style.display = 'none';
            } else {
                // Dokumentet finns men är tomt/felaktigt
                if(fetchContainer) fetchContainer.style.display = 'block';
            }
        } else {
            // Inget dokument = Visa hämta-knappen
            if(fetchContainer) fetchContainer.style.display = 'block';
        }
    }).catch(err => {
        console.error("Fel vid hämtning av specs:", err);
        // Vid fel, visa knappen så man kan försöka igen
        if(fetchContainer) fetchContainer.style.display = 'block';
    });

    // 5. Nollställ sökfältet i historiken
    const searchInput = document.getElementById('vehicleHistorySearch');
    if(searchInput) searchInput.value = '';

    // 6. Ladda Historik
    renderVehicleHistory(cleanReg);

    // 7. Visa Modalen
    modal.classList.add('show');
}

let currentVehicleHistory = [];

function renderVehicleHistory(regnr) {
    // 1. Hämta all data
    currentVehicleHistory = allJobs.filter(j => j.regnr === regnr && !j.deleted)
                                   .sort((a,b) => new Date(b.datum) - new Date(a.datum));

    // 2. Uppdatera ägare
    const ownerEl = document.getElementById('vehicleOwner'); 
    if(ownerEl) {
        ownerEl.textContent = currentVehicleHistory.length > 0 ? currentVehicleHistory[0].kundnamn : "---";
    }

    // 3. Nollställ sökfält
    const searchInput = document.getElementById('vehicleHistorySearch');
    if(searchInput) searchInput.value = '';

    // 4. Rita listan
    drawVehicleHistoryList(currentVehicleHistory);
}

// Hjälpfunktion som ritar HTML (används av både render och sök)
function drawVehicleHistoryList(jobs) {
    const container = document.getElementById('vehicleHistoryList');
    if(!container) return;
    
    container.innerHTML = '';

    if (jobs.length === 0) {
        container.innerHTML = '<div style="text-align:center; padding:30px; color:#9ca3af; font-size:0.85rem;">Ingen historik hittades.</div>';
        return;
    }

    jobs.forEach(job => {
        const row = document.createElement('div');
        row.className = 'history-item-clean';
        row.onclick = () => openEditModal(job.id);

        const dateStr = job.datum.split('T')[0];
        
        // Textlogik: Prioritera Kommentar, sen Paket, sen "Service"
        let commentText = job.kommentar && job.kommentar.trim().length > 0 ? job.kommentar : (job.paket || 'Service');

        row.innerHTML = `
            <div class="h-info-col">
                <div class="h-date">${dateStr}</div>
                <div class="h-desc-row">
                    <span class="h-desc-text" title="${commentText}">${commentText}</span>
                </div>
            </div>
            <div class="h-price">${job.kundpris} kr</div>
        `;
        container.appendChild(row);
    });
}

// Sökfunktion (anropas direkt från HTML oninput)
function filterVehicleHistory(term) {
    const lower = term.toLowerCase();
    const filtered = currentVehicleHistory.filter(j => {
        const txt = (j.kommentar || '') + ' ' + (j.paket || '') + ' ' + (j.kundnamn || '');
        return txt.toLowerCase().includes(lower);
    });
    drawVehicleHistoryList(filtered);
}

// ==========================================
// AI & TEKNISK DATA LOGIK
// ==========================================

async function fetchTechnicalData(regnr) {
    const cleanReg = regnr.replace(/\s/g, '').toUpperCase();
    const docRef = db.collection("vehicleSpecs").doc(cleanReg);
    
    const fetchBtn = document.getElementById('btnFetchTechData');
    const specsContainer = document.getElementById('techDataContainer'); 
    const fetchContainer = document.getElementById('fetchDataContainer');

    if(fetchBtn) {
        fetchBtn.disabled = true;
        fetchBtn.innerHTML = `<span>⏳ Analyserar med AI...</span>`;
    }

    try {
        // ÄNDRING: Ta emot datan direkt från funktionen istället för att läsa från DB
        const data = await scrapeAndAnalyze(cleanReg, docRef);
        
        // Nu har vi "data" direkt. Vi behöver inte göra docRef.get()
        if(specsContainer) {
            specsContainer.innerHTML = generateTechSpecHTML(data, cleanReg);
            specsContainer.style.display = 'block';
        }
        if(fetchContainer) fetchContainer.style.display = 'none';
        
        showToast('Teknisk data hämtad och sparad!', 'success');

    } catch (error) {
        console.error("Fel vid AI-hämtning:", error);
        // ... din felhantering ...
        if(fetchBtn) {
            fetchBtn.disabled = false;
            fetchBtn.innerHTML = `<span>Försök igen</span>`;
        }
    }
}

// Skrapar Biluppgifter.se och skickar till Gemini AI
async function scrapeAndAnalyze(regnr, docRef) {
    // 1. Skrapa data via Proxy
    const proxy = "https://corsproxy.io/?";
    const url = `https://biluppgifter.se/fordon/${regnr}`;
    
    const response = await fetch(proxy + encodeURIComponent(url));
    if (!response.ok) throw new Error("Kunde inte nå biluppgifter");
    
    const htmlText = await response.text();
    // Rensa texten lite för att spara tokens
    const rawText = htmlText.replace(/\s+/g, ' ').substring(0, 15000);

    // 2. Förbered AI-prompten (Be om JSON)
    const prompt = `
        Du är en expertmekaniker. Analysera denna rådata för bilen ${regnr}:
        """${rawText}"""

        Din uppgift: Extrahera teknisk data och returnera ENDAST ett JSON-objekt. 
        Gissa kvalificerat om exakt data saknas (t.ex. motorkod baserat på hk/modell).
        
        Formatet ska vara exakt så här (inga markdown-backticks, bara rå JSON):
        {
            "model": "T.ex. Volvo V70 D4 (2015)",
            "engine": "T.ex. D4204T5 (181 hk)",
            "oil": "T.ex. 5.2 L • 0W-20",
            "ac": "T.ex. R134a (700g)",
            "timing_belt": "T.ex. 15 000 mil / 10 år",
            "torque": "Hjul 140 Nm • Plugg 38 Nm",
            "battery": "T.ex. 80Ah AGM (Bagage)",
            "tow_weight": "T.ex. 1800 Kg"
        }
    `;

    // 3. Anropa Gemini API
    const apiKey = CONFIG.AI_API_KEY; 
    const aiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;

    const aiResponse = await fetch(aiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] })
    });

    if(!aiResponse.ok) throw new Error(`AI API Error: ${aiResponse.status}`);

    const aiData = await aiResponse.json();
    
    // 4. Parsa svaret
    let aiText = aiData.candidates[0].content.parts[0].text;
    aiText = aiText.replace(/```json/g, '').replace(/```/g, '').trim();
    
    const vehicleData = JSON.parse(aiText);

    // 5. Spara till Firebase
    await docRef.set(vehicleData);
	
	return vehicleData;
}

// --- HJÄLPFUNKTION: Bygg HTML från lösa fält (DENNA BEHÖVS FÖR NYA DESIGNEN) ---
function generateTechSpecHTML(data, regnr) {
    let brandIcon = '#icon-brand-generic';
    const modelStr = (data.model || '').toLowerCase();
    
    if (modelStr.includes('volvo')) brandIcon = '#icon-brand-volvo';
    else if (modelStr.includes('bmw')) brandIcon = '#icon-brand-bmw';
    else if (modelStr.includes('audi')) brandIcon = '#icon-brand-audi';
    else if (modelStr.includes('mercedes') || modelStr.includes('benz')) brandIcon = '#icon-brand-merc';
    else if (modelStr.includes('vw') || modelStr.includes('volkswagen')) brandIcon = '#icon-brand-vw';
    else if (modelStr.includes('seat')) brandIcon = '#icon-brand-seat';
    else if (modelStr.includes('skoda')) brandIcon = '#icon-brand-skoda';
    else if (modelStr.includes('fiat')) brandIcon = '#icon-brand-fiat';

	const createInput = (key, val) => {
	        const value = val || '';
	        
	        let extraStyle = '';
	        if (key === 'oil') {
	            extraStyle = 'font-weight: 600; font-size: 1em;';
	        }

	        return `<input class="spec-input" 
	                       style="${extraStyle}"
	                       value="${value}" 
	                       onchange="saveTechSpec('${regnr}', '${key}', this.value)">`;
	    };

    return `
        <div class="tech-header-main">
           <svg class="brand-icon-svg"><use href="${brandIcon}"></use></svg>
           <h4>Teknisk Data ${regnr}</h4>
        </div>
        <ul class="tech-list">
            <li>
                <div class="spec-label-col">
                    <svg class="spec-icon-svg"><use href="#icon-car-v2"></use></svg> 
                    <b>Bil</b>
                </div>
                <div class="spec-value-col">
                    ${createInput('model', data.model)}
                </div>
            </li>
            <li>
                <div class="spec-label-col">
                    <svg class="spec-icon-svg"><use href="#icon-belt-v2"></use></svg> 
                    <b>Kamrem</b>
                </div>
                <div class="spec-value-col">
                    ${createInput('timing_belt', data.timing_belt)}
                </div>
            </li>
            
            <li>
                <div class="spec-label-col">
                    <svg class="spec-icon-svg"><use href="#icon-engine-v2"></use></svg> 
                    <b>Motor</b>
                </div>
                <div class="spec-value-col">
                    ${createInput('engine', data.engine)}
                </div>
            </li>
            <li>
                <div class="spec-label-col">
                    <svg class="spec-icon-svg"><use href="#icon-torque-v2"></use></svg> 
                    <b>Moment</b>
                </div>
                <div class="spec-value-col">
                    ${createInput('torque', data.torque)}
                </div>
            </li>

            <li>
                <div class="spec-label-col">
                    <svg class="spec-icon-svg"><use href="#icon-oil-v2"></use></svg> 
                    <b>Olja</b>
                </div>
                <div class="spec-value-col">
                    ${createInput('oil', data.oil)}
                </div>
            </li>
            <li>
                <div class="spec-label-col">
                    <svg class="spec-icon-svg"><use href="#icon-battery-v2"></use></svg> 
                    <b>Batteri</b>
                </div>
                <div class="spec-value-col">
                    ${createInput('battery', data.battery)}
                </div>
            </li>

            <li>
                <div class="spec-label-col">
                    <svg class="spec-icon-svg"><use href="#icon-ac-v2"></use></svg> 
                    <b>AC</b>
                </div>
                <div class="spec-value-col">
                    ${createInput('ac', data.ac)}
                </div>
            </li>
            <li>
                <div class="spec-label-col">
                    <svg class="spec-icon-svg"><use href="#icon-weight-v2"></use></svg> 
                    <b>Drag</b>
                </div>
                <div class="spec-value-col">
                    ${createInput('tow_weight', data.tow_weight)}
                </div>
            </li>
        </ul>
    `;
}

// --- Spara teknisk data när man ändrar manuellt ---
async function saveTechSpec(regnr, field, newValue) {
    const cleanReg = regnr.replace(/\s/g, '').toUpperCase();
    
    try {
        // Uppdatera ENDAST det fältet som ändrades i Firebase
        await db.collection("vehicleSpecs").doc(cleanReg).update({
            [field]: newValue
        });
        
        // Visa en liten bekräftelse (Toast)
        showToast(`Uppdaterade ${field} till: ${newValue}`, 'success');
        
    } catch (error) {
        console.error("Kunde inte spara ändring:", error);
        showToast("Kunde inte spara ändringen.", 'danger');
    }
}

// ==========================================
// CHATT & NOTERINGAR (INTEGRERAD)
// ==========================================

function toggleChatWidget() {
	addHistoryState();
    const chatWidget = document.getElementById('chatWidget');
    if (!chatWidget) return;

    if (chatWidget.style.display === 'flex') {
        chatWidget.style.display = 'none';
        document.body.style.overflow = ''; // Lås upp scroll
    } else {
        chatWidget.style.display = 'flex';
        document.body.style.overflow = 'hidden'; // Lås bakgrundsscroll på mobil
        
        // Scrolla till botten direkt
        setTimeout(() => {
            const chatList = document.getElementById('chatMessages');
            if (chatList) chatList.scrollTop = chatList.scrollHeight;
        }, 100);
    }
}

function initChat() {
    const chatList = document.getElementById('chatMessages');
    if (!chatList) return;

    // 1. Koppla UI-element
    const chatInput = document.getElementById('chatInput');
    const sendBtn = document.getElementById('chatSendBtn');
    const closeBtn = document.getElementById('closeChatWidget');
    
    // NYTT: Element för redigerings-header
    const closeEditBtn = document.getElementById('closeEditBtn');

    // Knappar för bilder
    const plusBtn = document.getElementById('chatPlusBtn');      
    const cameraBtn = document.getElementById('chatCameraBtn'); 
    const fileInputGallery = document.getElementById('chatFileInputGallery');
    const fileInputCamera = document.getElementById('chatFileInputCamera');

    // 2. Stäng-knapp för widgeten
    if (closeBtn) {
        closeBtn.addEventListener('click', toggleChatWidget);
    }

    // NYTT: Stäng-knapp för redigeringsläget
    if (closeEditBtn) {
        closeEditBtn.addEventListener('click', exitEditMode);
    }

    // 3. Hantera "Skicka" OCH "Spara ändring"
    const handleChatAction = async () => {
        const text = chatInput.value.trim();
        if (!text) return;

        // Om vi är i redigeringsläge: UPPDATERA befintligt meddelande
        if (isEditingMsg && currentEditMsgId) {
            try {
                // Uppdaterar texten i databasen
                await db.collection('notes').doc(currentEditMsgId).update({
                    text: text,
                    isEdited: true // Flagga om du vill visa "redigerad" i UI senare
                });
                
                // Avsluta redigeringsläget
                exitEditMode(); 

            } catch (err) {
                console.error("Fel vid uppdatering:", err);
                alert("Kunde inte spara ändringen.");
            }
        } 
        // Annars: SKAPA nytt meddelande (Din gamla logik)
        else {
            try {
                await db.collection("notes").add({
                    text: text,
                    timestamp: new Date().toISOString(),
                    platform: window.innerWidth <= 768 ? 'mobil' : 'dator',
                    type: 'text'
                });
                chatInput.value = '';
                // Scrolla ner
                setTimeout(() => chatList.scrollTop = chatList.scrollHeight, 100);
            } catch (err) {
                console.error("Fel vid sändning:", err);
                alert("Kunde inte skicka meddelandet.");
            }
        }
    };

    // Koppla klick på skicka-knappen till den nya funktionen
    if (sendBtn) sendBtn.onclick = handleChatAction;
    
    // Koppla Enter-tangenten
    if (chatInput) {
        chatInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleChatAction();
            }
        });
    }

    // 4. Bild-uppladdning (Galleri & Kamera)
    if (plusBtn && fileInputGallery) {
        plusBtn.addEventListener('click', () => fileInputGallery.click());
        fileInputGallery.addEventListener('change', (e) => handleImageUpload(e.target.files[0]));
    }

    if (cameraBtn && fileInputCamera) {
        cameraBtn.addEventListener('click', () => fileInputCamera.click());
        fileInputCamera.addEventListener('change', (e) => handleImageUpload(e.target.files[0]));
    }

    // 5. SÖKFUNKTION FÖR CHATTEN
    const searchInput = document.getElementById('chatSearchInput');
    
    if (searchInput) {
        searchInput.addEventListener('input', (e) => {
            const searchTerm = e.target.value.toLowerCase();
            const rows = document.querySelectorAll('.chat-row'); 
            
            rows.forEach(row => {
                const text = row.innerText.toLowerCase();
                if (text.includes(searchTerm)) {
                    row.style.display = 'flex'; 
                } else {
                    row.style.display = 'none'; 
                }
            });

            // Hantera datumavskiljare vid sökning
            const separators = document.querySelectorAll('.chat-date-separator');
            separators.forEach(sep => {
                if(searchTerm === '') {
                    sep.style.display = 'flex';
                } else {
                    sep.style.display = 'none'; 
                }
            });
        });
    }

    // 6. Starta lyssnare mot Firebase
    setupChatListener(50);
}

function setupChatListener(limit) {
    if (chatUnsubscribe) chatUnsubscribe(); // Stäng ev. gammal lyssnare

    const chatList = document.getElementById('chatMessages');
    
    // Hjälpfunktion: Kolla om två datum är samma dag
    const isSameDay = (d1, d2) => {
        return d1.getFullYear() === d2.getFullYear() &&
               d1.getMonth() === d2.getMonth() &&
               d1.getDate() === d2.getDate();
    };

    chatUnsubscribe = db.collection("notes")
        .orderBy("timestamp", "desc")
        .limit(limit)
        .onSnapshot(snapshot => {
            const docs = [];
            snapshot.forEach(doc => docs.push({ id: doc.id, ...doc.data() }));
            
            // Vänd ordningen så nyaste hamnar längst ner
            docs.reverse();

            chatList.innerHTML = ''; // Rensa listan

            if (docs.length === 0) {
                // Snyggare tom-state
                chatList.innerHTML = '<div style="text-align:center; padding:30px; color:#9ca3af; font-size:0.9rem;">Inga meddelanden än.</div>';
                return;
            }

            let lastDateKey = null; // Håller koll på datum-gruppering

            docs.forEach(data => {
                // Datum-separator logic
                if (data.timestamp) {
                    const msgDateObj = new Date(data.timestamp);
                    // Skapa en nyckel för jämförelse (t.ex. "Mon Dec 02 2024")
                    const currentDateKey = msgDateObj.toDateString();

                    if (currentDateKey !== lastDateKey) {
                        const sep = document.createElement('div');
                        sep.className = 'chat-date-separator'; 
                        
                        // --- LOGIK FÖR IDAG / IGÅR ---
                        const today = new Date();
                        const yesterday = new Date();
                        yesterday.setDate(yesterday.getDate() - 1);

                        let displayText = '';

                        if (isSameDay(msgDateObj, today)) {
                            displayText = 'Idag';
                        } else if (isSameDay(msgDateObj, yesterday)) {
                            displayText = 'Igår';
                        } else {
                            // Fallback: "9 dec" (Svenskt format)
                            let options = { day: 'numeric', month: 'short' };
                            // Om det är ett annat år, visa det också
                            if (msgDateObj.getFullYear() !== today.getFullYear()) {
                                options.year = 'numeric';
                            }
                            displayText = msgDateObj.toLocaleDateString('sv-SE', options).replace('.', ''); // Tar bort ev. punkt
                        }

                        // VIKTIGT: Wrappa i <span> för att CSS-linjen ska ligga bakom texten snyggt
                        sep.innerHTML = `<span>${displayText}</span>`;
                        
                        chatList.appendChild(sep);
                        lastDateKey = currentDateKey;
                    }
                }
                
                // Rendera bubblan (använder din befintliga funktion)
                // OBS: Se till att skicka med ID också om du vill ha högerklick-menyn
                // Eftersom docs redan har 'id' inbakat (se rad 14) så skickar vi hela 'data'-objektet
                renderChatBubble(data, chatList);
            });

            // Scrolla till botten vid första laddningen
            if (limit === 50) {
                setTimeout(() => chatList.scrollTop = chatList.scrollHeight, 100);
            }

        }, error => {
            console.error("Fel vid chatt-hämtning:", error);
        });
}

function renderChatBubble(data, container) {
    const messageId = data.id; 

    // 1. Skapa Wrapper (Raden)
    const row = document.createElement('div');
    
    let senderType = 'other';
    // Ändra logiken här om du har ett riktigt inloggningssystem
    // Just nu: system = system, allt annat = me (för demo) eller other
    if (data.platform === 'system') senderType = 'system';
    else if (data.isMe) senderType = 'me'; // Exempel om du har sådan data
    else senderType = data.platform === 'mobil' || data.platform === 'dator' ? 'me' : 'other';
    
    // Tvinga 'me' för att testa (eller behåll din logik för vem som är vem)
    // I din kod antog du att allt icke-system var 'me'. 
    // Om du vill simulera motpart, se till att senderType blir 'other'.

    row.className = `chat-row ${senderType}`;
    row.dataset.messageId = messageId;
    row.style.position = 'relative';

    // --- HÄR ÄR ÄNDRINGEN: SKAPA MENYN FÖR ALLA ---
    // Vi tog bort "if (senderType === 'me')" så nu skapas den alltid.
    
    const optionsMenu = document.createElement('div');
    optionsMenu.className = 'message-options';
    optionsMenu.innerHTML = `
        <button class="option-btn edit" title="Redigera">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor"><path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" /></svg>
        </button>
        <button class="option-btn delete danger" title="Ta bort">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clip-rule="evenodd" /></svg>
        </button>
    `;

    // Koppla knapparna
    optionsMenu.querySelector('.edit').onclick = () => enterEditMode(row, data.text || "");
    optionsMenu.querySelector('.delete').onclick = () => deleteChatMessage(messageId);
    
    row.appendChild(optionsMenu);
    // --- SLUT PÅ ÄNDRING ---

    // 2. Skapa Bubblan
    const bubble = document.createElement('div');
    bubble.className = 'chat-bubble';

    if (data.type === 'image' || data.image) {
        bubble.classList.add('is-image');
    }

    // Text-innehåll
    if (data.text) {
        const textDiv = document.createElement('div');
        textDiv.className = 'bubble-text-content';
        textDiv.innerHTML = data.text.replace(/(https?:\/\/[^\s]+)/g, '<a href="$1" target="_blank">$1</a>');
        bubble.appendChild(textDiv);
    }

    // Bild-innehåll
    if (data.image) {
        const imgContainer = document.createElement('div');
        imgContainer.className = 'chat-bubble-image';
        const img = document.createElement('img');
        img.src = data.image;
        img.loading = "lazy";
        img.onclick = () => window.openImageZoom(data.image);
        imgContainer.appendChild(img);
        bubble.appendChild(imgContainer);
    }

    row.appendChild(bubble);

    // 3. Tidsstämpel
    if (data.timestamp) {
        const timeDiv = document.createElement('div');
        timeDiv.className = 'chat-time';
        let t;
        if (data.timestamp && typeof data.timestamp.toDate === 'function') {
            t = data.timestamp.toDate();
        } else {
            t = new Date(data.timestamp);
        }
        timeDiv.textContent = t.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
        row.appendChild(timeDiv);
    }

    container.appendChild(row);
}

// ==========================================================================
// FUNKTIONER FÖR REDIGERING & BORTTAGNING (Korrigerad Databas-sökväg)
// ==========================================================================

function enterEditMode(rowElement, currentText) {
    const messageId = rowElement.dataset.messageId;
    if (!messageId) return;

    // Sätt globala variabler
    isEditingMsg = true;
    currentEditMsgId = messageId;

    // UI Referenser
    const chatWidget = document.getElementById('chatWidget');
    const inputField = document.getElementById('chatInput');
    const editHeader = document.getElementById('chatEditHeader');
    const sendBtn = document.getElementById('chatSendBtn');

    // 1. Fyll input med texten
    inputField.value = currentText;
    inputField.focus();
    // Flytta markör till slutet av texten
    inputField.setSelectionRange(inputField.value.length, inputField.value.length);

    // 2. Ändra UI till "Edit Mode" (Dimma bakgrund, visa header)
    chatWidget.classList.add('edit-mode');
    if(editHeader) editHeader.style.display = 'flex';
    
    // Byt ikon på knappen till en "Check/Spara"
    if(sendBtn) {
        sendBtn.innerHTML = '<svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"></polyline></svg>';
    }
}

function exitEditMode() {
    // Nollställ variabler
    isEditingMsg = false;
    currentEditMsgId = null;

    const chatWidget = document.getElementById('chatWidget');
    const inputField = document.getElementById('chatInput');
    const editHeader = document.getElementById('chatEditHeader');
    const sendBtn = document.getElementById('chatSendBtn');

    // Återställ UI
    inputField.value = '';
    chatWidget.classList.remove('edit-mode');
    if(editHeader) editHeader.style.display = 'none';

    // Återställ sänd-ikonen (Pilen)
    if(sendBtn) {
        sendBtn.innerHTML = '<svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="22" y1="2" x2="11" y2="13"></line><polygon points="22 2 15 22 11 13 2 9 22 2"></polygon></svg>';
    }
}

async function deleteChatMessage(messageId) {
    if (!confirm("Ta bort meddelandet?")) return;

    try {
        await db.collection('notes').doc(messageId).delete();
    } catch (error) {
        console.error("Fel vid borttagning:", error);
        alert("Kunde inte ta bort meddelandet.");
    }
}

// --- BILD-HANTERING ---

async function handleImageUpload(file) {
    if (!file) return;
    
    // Visa tillfällig "Laddar..." toast om du har den funktionen, annars console.log
    console.log("Bearbetar bild...");

    try {
        const base64Image = await compressImage(file);
        
        await db.collection("notes").add({
            image: base64Image,
            text: "", // Ingen text, bara bild
            type: 'image',
            timestamp: new Date().toISOString(),
            platform: window.innerWidth <= 768 ? 'mobil' : 'dator'
        });
        
        // Återställ fil-inputsen så man kan välja samma bild igen
        document.getElementById('chatFileInputGallery').value = '';
        document.getElementById('chatFileInputCamera').value = '';

    } catch (err) {
        console.error("Bildfel:", err);
        alert("Kunde inte ladda upp bilden.");
    }
}

// Komprimera bild innan uppladdning (Viktigt för Firestore!)
function compressImage(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        
        reader.onload = (event) => {
            const img = new Image();
            img.src = event.target.result;
            
            img.onload = () => {
                const maxWidth = 800; // Max bredd
                const scaleSize = maxWidth / img.width;
                const newWidth = (img.width > maxWidth) ? maxWidth : img.width;
                const newHeight = (img.width > maxWidth) ? (img.height * scaleSize) : img.height;

                const canvas = document.createElement('canvas');
                canvas.width = newWidth;
                canvas.height = newHeight;

                const ctx = canvas.getContext('2d');
                ctx.drawImage(img, 0, 0, newWidth, newHeight);

                // Spara som JPEG med 70% kvalitet
                const dataUrl = canvas.toDataURL('image/jpeg', 0.7);
                resolve(dataUrl);
            };
            img.onerror = (err) => reject(err);
        };
        reader.onerror = (err) => reject(err);
    });
}

// Enkel bild-zoom funktion
window.openImageZoom = function(src) {
	addHistoryState();
    const modal = document.getElementById('imageZoomModal');
    const imgMain = document.getElementById('mmImgMain');
    const closeBtn = document.getElementById('mmCloseBtn');
    
    if (modal && imgMain) {
        imgMain.src = src;
        modal.style.display = 'flex';
        
        if(closeBtn) {
            closeBtn.onclick = () => {
                modal.style.display = 'none';
            };
        }
        
        // Stäng vid klick utanför bilden
        modal.onclick = (e) => {
            if (e.target === modal) modal.style.display = 'none';
        };
    }
};

// --- MOBIL SÖK LOGIK ---

// Koppla knappen i menyn till att öppna modalen
document.getElementById('mobileSearchBtn')?.addEventListener('click', () => {
	addHistoryState();
    const searchModal = document.getElementById('mobileSearchModal');
    const searchInput = document.getElementById('mobileSearchInput');
    const resultsContainer = document.getElementById('mobileSearchResults');
    
    searchModal.classList.add('show');
    searchInput.value = ''; // Rensa gammal sökning
    resultsContainer.innerHTML = ''; // Rensa resultat
    setTimeout(() => searchInput.focus(), 100); // Fokusera i fältet
    
    // Flytta "active" klassen i menyn
    document.querySelectorAll('.mobile-nav-btn').forEach(btn => btn.classList.remove('active'));
    document.getElementById('mobileSearchBtn').classList.add('active');
});

// Stäng sök-modalen
document.getElementById('closeMobileSearchBtn')?.addEventListener('click', () => {
    document.getElementById('mobileSearchModal').classList.remove('show');
	if (history.state && history.state.modalOpen) {
        history.back();
    }
    // Sätt tillbaka Hem som aktiv
    document.querySelectorAll('.mobile-nav-btn').forEach(btn => btn.classList.remove('active'));
    document.getElementById('mobileHomeBtn').classList.add('active');
});

// Live-sökning när man skriver
document.getElementById('mobileSearchInput')?.addEventListener('input', (e) => {
    const term = e.target.value; 
    const resultsContainer = document.getElementById('mobileSearchResults');
    
    if (term.length < 2) {
        resultsContainer.innerHTML = '<p style="text-align:center; color:#9ca3af; margin-top:20px;">Skriv minst 2 tecken för att söka.</p>';
        return;
    }
    
    // HÄR ÄR FIXEN: Vi lägger till "!job.deleted" i filtret
    const filteredJobs = allJobs.filter(job => !job.deleted && jobMatchesSearch(job, term));
    
    if (filteredJobs.length === 0) {
        resultsContainer.innerHTML = '<p style="text-align:center; color:#9ca3af; margin-top:20px;">Inga träffar.</p>';
    } else {
        resultsContainer.innerHTML = filteredJobs.map(job => createJobCard(job)).join('');
    }
});

function startInactivityCheck() {
    // Sätt starttid om det saknas
    if (!localStorage.getItem('lastActivity')) {
        localStorage.setItem('lastActivity', Date.now());
    }

    // 1. Lyssna på aktivitet (Touch, mus, tangenter)
    const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart', 'click'];
    events.forEach(event => {
        document.addEventListener(event, () => {
            // Varje gång man rör skärmen, spara ny tid
            localStorage.setItem('lastActivity', Date.now());
        }, true);
    });

    // 2. Starta en intervall som kollar klockan varje minut
    setInterval(checkTime, 60000); 
    
    // Gör en kontroll direkt vid start också
    checkTime();
}

function checkTime() {
    // Hämta när användaren senast rörde skärmen
    const lastActive = parseInt(localStorage.getItem('lastActivity') || Date.now());
    const now = Date.now();
    const timeDiff = now - lastActive;

    // Om skillnaden är större än gränsen (30 min)
    if (timeDiff > INACTIVITY_LIMIT_MS) {
	    console.log("Tiden ute. Loggar ut...");
	    
	    localStorage.removeItem('lastActivity');
	    
	    firebase.auth().signOut().then(() => {
	        // Ingen alert här längre
	        window.location.reload(); 
	    });
	}
}


function closeVehicleModal() {
    document.getElementById('vehicleModal').classList.remove('show');
    if (history.state && history.state.modalOpen) {
        history.back();
    }
}

// Hjälpfunktion för att lägga till ett "steg" i historiken
function addHistoryState() {
	// Vi lägger till ett "falskt" steg i historiken
	// Detta gör att "Bakåt" tar bort detta steg istället för att stänga appen
	history.pushState({ modalOpen: true }, null, window.location.href);
}

// Funktion för att visa/dölja åtgärdsmenyn inuti kortet
function toggleCardActions(jobId, event) {
    // Stoppa klicket från att öppna modalen
    if(event) event.stopPropagation();

    // Hitta panelen för just detta jobb
    const panel = document.getElementById(`actions-${jobId}`);
    const menuBtn = event.currentTarget; // Knappen vi tryckte på
    
    if (panel) {
        // Om den redan är öppen, stäng den
        if (panel.classList.contains('show')) {
            panel.classList.remove('show');
            menuBtn.style.opacity = "0.8"; // Återställ knappens utseende
        } else {
            // Stäng alla andra öppna paneler först (så bara en är öppen åt gången)
            document.querySelectorAll('.card-actions-expand.show').forEach(el => {
                el.classList.remove('show');
            });
            
            // Visa denna panel
            panel.classList.add('show');
            menuBtn.style.opacity = "1"; // Markera knappen som aktiv
        }
    }
}

// --- FUNKTIONER FÖR ATT VÄLJA BILMÄRKE ---

function openBrandSelector(regnr) {
	addHistoryState();
    const modal = document.getElementById('brandSelectModal');
    const grid = document.getElementById('brandGrid');
    const searchInput = document.getElementById('brandSearchInput');
    
    // Rensa grid och sök
    grid.innerHTML = '';
    searchInput.value = '';
    
    // Funktion för att rendera listan
    const renderBrands = (filter = '') => {
        grid.innerHTML = '';
        Object.entries(AVAILABLE_BRANDS).forEach(([name, slug]) => {
            if (name.toLowerCase().includes(filter.toLowerCase())) {
                const div = document.createElement('div');
                div.className = 'brand-select-item';
                
                // Markera om detta är det valda märket
                if (vehicleBrandCache[regnr] === slug) {
                    div.classList.add('selected');
                }

                div.innerHTML = `
                    <img src="https://cdn.simpleicons.org/${slug}" loading="lazy">
                    <span>${name}</span>
                `;
                div.onclick = () => saveBrandSelection(regnr, slug);
                grid.appendChild(div);
            }
        });
    };

    // Rendera alla märken först
    renderBrands();

    // Koppla sökfunktionen
    searchInput.oninput = (e) => renderBrands(e.target.value);

    modal.classList.add('show');
}

async function saveBrandSelection(regnr, brandSlug) {
    try {
        // 1. Spara till Firestore (vehicleSpecs)
        // Vi använder set med merge:true ifall dokumentet inte finns än
        await db.collection("vehicleSpecs").doc(regnr).set({
            brand_manual: brandSlug
        }, { merge: true });

        // 2. Stäng modalen
        document.getElementById('brandSelectModal').classList.remove('show');
        
        // 3. Uppdatera ikonen i Fordonsmodalen direkt (visuell feedback)
		const editBtn = document.getElementById('btnEditBrandModal');
		if (editBtn) {
		    editBtn.innerHTML = `<img src="https://cdn.simpleicons.org/${brandSlug}" class="brand-btn-icon">`;
		}

        // Notis (valfritt)
        // alert("Märke uppdaterat!"); 

    } catch (error) {
        console.error("Fel vid sparande av märke:", error);
        alert("Kunde inte spara valet.");
    }
}

// --- INSTÄLLNINGAR & PRIVACY MODE ---

function initSettings() {
    // 1. Privacy Mode
    // Hämta värdet (default false)
    const savedPrivacy = localStorage.getItem('privacyMode') === 'true';
    
    // Hämta checkboxen
    const pToggle = document.getElementById('privacyToggle');
    
    // Debug: Se om vi hittar elementet
    console.log("Init Settings. Found toggle:", pToggle);

    if(pToggle) {
        // Sätt visuellt läge
        pToggle.checked = savedPrivacy;
        
        // Lyssna på ÄNDRINGAR i checkboxen
        pToggle.addEventListener('change', (e) => {
            console.log("Privacy changed to:", e.target.checked);
            setPrivacyMode(e.target.checked);
        });
    }

    // Applicera läget direkt vid start
    setPrivacyMode(savedPrivacy);

    // 2. Dark Mode (Samma logik)
    const savedTheme = localStorage.getItem('theme') || 'light';
    const tToggle = document.getElementById('themeToggle');
    if(tToggle) {
        tToggle.checked = savedTheme === 'dark';
        tToggle.addEventListener('change', (e) => {
            const newTheme = e.target.checked ? 'dark' : 'light';
            setTheme(newTheme);
        });
    }
    setTheme(savedTheme);

    setupSwipeGestures();
}

// Applicerar klassen på <body>
function setPrivacyMode(isActive) {
    if (isActive) {
        document.body.classList.add('privacy-active');
    } else {
        document.body.classList.remove('privacy-active');
    }
    localStorage.setItem('privacyMode', isActive);
}

// Öppnar modalen och lägger till historik
function openSettingsModal() {
    addHistoryState();
    document.getElementById('settingsModal').classList.add('show');
}

// Stänger modalen och backar historiken (vilket triggar stängning)
function closeSettings() {
    if (history.state && history.state.modalOpen) {
        history.back();
    } else {
        document.getElementById('settingsModal').classList.remove('show');
    }
}

// Initiera direkt
initSettings();

function setTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
    
    // Uppdatera kalenderns tema också
    setCalendarTheme(theme);
}

// --- 5. SWIPE GESTURE (SAMSUNG STYLE) ---
function setupSwipeGestures() {
    const modal = document.getElementById('settingsModal');
    if(!modal) return;

    let touchStartX = 0;

    // Lyssna när fingret landar
    modal.addEventListener('touchstart', (e) => {
        touchStartX = e.changedTouches[0].screenX;
    }, {passive: true});

    // Lyssna när fingret lyfter
    modal.addEventListener('touchend', (e) => {
        const touchEndX = e.changedTouches[0].screenX;
        
        // Om man dragit mer än 70px åt höger -> Gå tillbaka
        if (touchEndX > touchStartX + 70) {
            // VIKTIGT: Vi anropar history.back() här. 
            // Då används din befintliga "swipa tillbaka"-logik för att stänga modalen.
            if (history.state && history.state.modalOpen) {
                history.back(); 
            } else {
                modal.classList.remove('show');
            }
        }
    }, {passive: true});
}

// Lägg denna funktion någonstans i app.js
function initInventoryListener() {
    db.collection('settings').doc('inventory').onSnapshot(doc => {
        if (doc.exists) {
            const data = doc.data();
            const current = data.motorOil || 0;
            const max = data.oilStartAmount || 208; 
            const date = data.oilStartDate || "";

            // UI Element
            const textEl = document.getElementById('oilLevelText');
            const percentEl = document.getElementById('oilPercent');
            const barEl = document.getElementById('oilProgressBar');
            const dateEl = document.getElementById('oilDateBadge');

            // --- HÄR ÄR ÄNDRINGEN ---
            // Vi använder toFixed(1) för att alltid visa en decimal (t.ex. "150.5")
            // Om du vill ta bort .0 på heltal kan du använda parseFloat(current.toFixed(1))
            let displayCurrent = parseFloat(current.toFixed(1)); 
            
            if (textEl) textEl.textContent = `${displayCurrent} / ${max} liter`;
            // ------------------------
            
            // Uppdatera procent & bar
            let percent = (current / max) * 100;
            if (percent > 100) percent = 100;
            if (percent < 0) percent = 0;

            if (percentEl) percentEl.textContent = Math.round(percent) + '%';
            if (barEl) {
                barEl.style.width = `${percent}%`;
                // Röd färg om mindre än 10% kvar
                if(percent < 10) barEl.classList.add('critical');
                else barEl.classList.remove('critical');
            }

            // Uppdatera Datum-badge
            if (dateEl) {
                if (date) {
                    dateEl.textContent = `Inköpt: ${date}`; 
                    dateEl.style.display = 'inline-block';
                } else {
                    dateEl.style.display = 'none';
                }
            }
        }
    });
}

// 2. Visa/Dölj formuläret
function toggleOilForm() {
    const form = document.getElementById('oilRefillForm');
    const dateInput = document.getElementById('newBarrelDate');
    
    if (form.style.display === 'none') {
        form.style.display = 'block';
        // Sätt dagens datum som förval
        if (!dateInput.value) {
            dateInput.valueAsDate = new Date();
        }
    } else {
        form.style.display = 'none';
    }
}

// 3. Spara nytt fat till Firebase
async function saveNewBarrel() {
    const volInput = document.getElementById('newBarrelVol');
    const dateInput = document.getElementById('newBarrelDate');
    
    const newVolume = parseFloat(volInput.value);
    const newDate = dateInput.value;

    if (!newVolume || !newDate) {
        alert("Fyll i både volym och datum.");
        return;
    }

    if (confirm(`Bekräfta nytt fat: \nVolym: ${newVolume} liter\nDatum: ${newDate}\n\nDetta återställer lagersaldot.`)) {
        try {
            await db.collection('settings').doc('inventory').set({
                motorOil: newVolume,        // Nuvarande mängd (fullt)
                oilStartAmount: newVolume,  // Maxkapacitet
                oilStartDate: newDate       // Datum
            }, { merge: true }); // Merge behåller ev. andra fält

            // Dölj formuläret och ge feedback
            toggleOilForm();
            alert("Nytt fat registrerat!"); 

        } catch (error) {
            console.error("Fel vid uppdatering:", error);
            alert("Kunde inte spara.");
        }
    }
}

// 1. En ren funktion som bara räknar ut liter från en lista med utgifter
function calculateOilFromExpenses(expenses) {
    if (!expenses || !Array.isArray(expenses)) return 0;
    
    let totalLiters = 0;
    expenses.forEach(item => {
        const name = (item.namn || "").toLowerCase();
        // Letar efter "olja" och en siffra följt av "l" eller "liter"
        if (name.includes('olja')) {
            const match = name.match(/(\d+[.,]?\d*)\s*(l|liter)/i);
            if (match) {
                // Ersätt komma med punkt (t.ex. 4,5 -> 4.5)
                const val = parseFloat(match[1].replace(',', '.'));
                if (!isNaN(val)) totalLiters += val;
            }
        }
    });
    return totalLiters;
}

// 2. Funktion som justerar saldot (Kan både dra av och lägga till)
async function adjustInventoryBalance(litersToDeduct) {
    // Om litersToDeduct är positivt (t.ex. 4) -> Dras 4 liter av.
    // Om litersToDeduct är negativt (t.ex. -4) -> Läggs 4 liter till (minus minus blir plus).
    
    if (litersToDeduct === 0) return;

    const inventoryRef = db.collection('settings').doc('inventory');
    
    try {
        await inventoryRef.update({
            motorOil: firebase.firestore.FieldValue.increment(-litersToDeduct)
        });
        console.log(`Lager justerat med: ${-litersToDeduct} liter.`);
    } catch (err) {
        console.error("Kunde inte justera lagret:", err);
    }
}

/* ==========================================
   KUNDHANTERING (VIRTUELL CRM)
   ========================================== */

// Generera kunddatabas från jobb
function getCustomerDatabase() {
    const customers = {};
    
    // Filtrera bort raderade jobb
    const validJobs = allJobs.filter(j => !j.deleted);

    validJobs.forEach(job => {
        // Normalisera namn
        let rawName = job.kundnamn || "Okänd";
        // Ta bort extra mellanslag och gör första bokstav stor
        let name = rawName.trim();
        
        // Skippa "Drop-in" eller tomma namn om du vill
        if(name.length < 2 || name.toLowerCase() === 'okänd') return;

        if (!customers[name]) {
            customers[name] = {
                name: name,
                totalSpent: 0,
                visitCount: 0,
                lastVisit: null,
                vehicles: new Set(), // Unika regnr
                history: []
            };
        }

        const c = customers[name];
        
        // Addera data
        c.totalSpent += (parseInt(job.kundpris) || 0);
        c.visitCount++;
        c.history.push(job);
        
        if (job.regnr && job.regnr.toUpperCase() !== 'OKÄNT' && job.regnr !== '---') {
            c.vehicles.add(job.regnr.toUpperCase());
        }

        // Kolla datum för "senast sedd"
        const jobDate = new Date(job.datum);
        if (!c.lastVisit || jobDate > c.lastVisit) {
            c.lastVisit = jobDate;
        }
    });

    // Konvertera till array och sortera: VIP (mest pengar) först
    return Object.values(customers).sort((a, b) => b.totalSpent - a.totalSpent);
}

/* --- HJÄLPFUNKTIONER FÖR FÄRGER --- */
function stringToColor(str) {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
        hash = str.charCodeAt(i) + ((hash << 5) - hash);
    }
    const hue = Math.abs(hash % 360);
    // 70% saturation, 90% lightness ger fina pastellfärger
    return `hsl(${hue}, 70%, 90%)`; 
}

function stringToTextColor(str) {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
        hash = str.charCodeAt(i) + ((hash << 5) - hash);
    }
    const hue = Math.abs(hash % 360);
    // Mörkare variant av samma färg för texten
    return `hsl(${hue}, 80%, 30%)`; 
}

/* --- RENDER CUSTOMER VIEW (HELA FUNKTIONEN) --- */
function renderCustomerView(searchTerm = '') {
    const container = document.getElementById('customerGrid');
    if(!container) return;
    
    container.innerHTML = '';
    const customers = getCustomerDatabase();
    const term = searchTerm.toLowerCase();

    // Filtrera listan baserat på sökning
    const filtered = customers.filter(c => {
        // Sök på namn
        if (c.name.toLowerCase().includes(term)) return true;
        // Sök på deras bilar (om regnr finns i deras lista)
        const hasCar = Array.from(c.vehicles).some(reg => reg.toLowerCase().includes(term));
        return hasCar;
    });

    // Om tomt
    if (filtered.length === 0) {
        container.innerHTML = `
            <div style="grid-column: 1/-1; text-align: center; padding: 40px; color: #94a3b8;">
                <svg style="width:48px; height:48px; margin-bottom:10px; opacity:0.5;" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>
                <p>Inga kunder hittades.</p>
            </div>`;
        return;
    }

    // Loopa igenom och skapa kort
    filtered.forEach(c => {
        // Skapa initialer (Max 2 bokstäver)
        const initials = c.name.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase();
        
        // Färg-magi
        const avatarBg = stringToColor(c.name);
        const avatarColor = stringToTextColor(c.name);
        
        // Kolla VIP-status (> 20.000 kr) - Du kan ändra gränsen här
        const isVip = c.totalSpent > 20000;
        
        // Räkna bilar
        const carCount = c.vehicles.size;
        const carText = carCount === 1 ? '1 fordon' : `${carCount} fordon`;

        const card = document.createElement('div');
        card.className = 'customer-card';
        card.onclick = () => openCustomerModal(c);
        
        card.innerHTML = `
            <div class="c-avatar" style="background-color: ${avatarBg}; color: ${avatarColor};">
                ${initials}
            </div>
            <div class="c-info">
                <div style="display:flex; justify-content:space-between; width:100%; align-items:center;">
                    <h3>${c.name}</h3>
                    ${isVip ? '<span style="font-size:1rem;" title="VIP Kund">⭐</span>' : ''}
                </div>
                <div class="c-meta">
                    <span>${carText}</span> • <span>${c.visitCount} besök</span>
                </div>
                <div class="c-meta" style="color:${isVip ? '#d97706' : '#64748b'}; font-weight:${isVip ? '700' : '500'}; margin-top:4px;">
                    Totalt: ${c.totalSpent.toLocaleString()} kr
                </div>
            </div>
        `;
        container.appendChild(card);
    });
}

// Öppna profilen
function openCustomerModal(customer) {
	addHistoryState();
    const modal = document.getElementById('customerModal');
    
    // 1. Fyll Header
    document.getElementById('modalCustomerName').textContent = customer.name;
    
    const badgeContainer = document.getElementById('modalCustomerBadge');
    if (customer.totalSpent > 20000) {
        badgeContainer.innerHTML = `<div class="vip-badge-pill"><span>⭐</span> VIP KUND</div>`;
    } else {
        badgeContainer.innerHTML = '';
    }

    // 2. Fyll Stats
    document.getElementById('custTotalSpent').textContent = customer.totalSpent.toLocaleString() + ' kr';
    document.getElementById('custVisitCount').textContent = customer.visitCount;
    
    // Räkna dagar sedan besök
    if (customer.lastVisit) {
        const diffTime = Math.abs(new Date() - customer.lastVisit);
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); 
        document.getElementById('custLastSeen').textContent = `${diffDays} dgr sen`;
    } else {
        document.getElementById('custLastSeen').textContent = "-";
    }

    // 3. Fyll Fordon
    const vehicleContainer = document.getElementById('custVehicleList');
    vehicleContainer.innerHTML = '';
    
    if(customer.vehicles.size === 0) {
        vehicleContainer.innerHTML = '<span style="color:#9ca3af; font-size:0.85rem;">Inga regnr sparade.</span>';
    } else {
        customer.vehicles.forEach(reg => {
            // Hämta märke för ikonen
            const brandUrl = getBrandIconUrl('', reg);
            const iconHtml = brandUrl ? `<img src="${brandUrl}" style="width:14px; height:14px; opacity:0.7;">` : '🚗';
            
            const btn = document.createElement('div');
            btn.className = 'v-chip';
            btn.innerHTML = `${iconHtml} ${reg}`;
            btn.onclick = () => openVehicleModal(reg); // Återanvänd din befintliga funktion!
            vehicleContainer.appendChild(btn);
        });
    }

    // 4. Fyll Historik (Uppdaterad med kommentarer)
    const historyContainer = document.getElementById('custHistoryList');
    historyContainer.innerHTML = '';
    
    const sortedHistory = customer.history.sort((a,b) => new Date(b.datum) - new Date(a.datum));
    
    if (sortedHistory.length === 0) {
        historyContainer.innerHTML = `
            <div style="text-align:center; padding: 30px 0; color:#9ca3af;">
                <p style="font-size:0.9rem;">Ingen historik än.</p>
            </div>`;
    }

    sortedHistory.forEach(job => {
        const row = document.createElement('div');
        row.className = 'history-item-clean';
        row.onclick = () => openEditModal(job.id);
        
        const dateStr = job.datum.split('T')[0];
        
        // Hämta texten
        let rawText = job.kommentar && job.kommentar.trim().length > 0 
            ? job.kommentar 
            : (job.paket || 'Service');
            
        // Förbered regnr-delen
        let regPart = '';
        if (job.regnr && job.regnr !== '---') {
            // Vi lägger regnr i en separat span som inte får krympa (flex-shrink: 0)
            regPart = `<span class="h-desc-reg">• ${job.regnr}</span>`;
        }

        row.innerHTML = `
            <div class="h-info-col" style="width:100%; overflow:hidden;">
                <div class="h-date">${dateStr}</div>
                <div class="h-desc-row">
                    <span class="h-desc-text">${rawText}</span>
                    ${regPart}
                </div>
            </div>
            <div class="h-price">${job.kundpris} kr</div>
        `;
        historyContainer.appendChild(row);
    });

    // 5. Koppla Action-knappar (HÄR ÄR DEN NYA KODEN)
    
    // --- Ring / Hitta.se Logik ---
    const callBtn = document.getElementById('btnCallCustomer');
    
    // Jag har lagt in riktiga ikoner i HTML-strängen här nedanför:
    if (customer.phone) {
        // Om telefonnummer finns: Visa "Ring"
        callBtn.innerHTML = `
            <svg class="icon-sm" style="margin-right:6px;" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path></svg> 
            Ring`;
        callBtn.onclick = () => window.location.href = `tel:${customer.phone}`;
    } else {
        // Om nummer saknas: Visa "Hitta.se"
        callBtn.innerHTML = `
            <svg class="icon-sm" style="margin-right:6px;" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
            Hitta.se`;
        callBtn.onclick = () => window.open(`https://www.hitta.se/sök?vad=${encodeURIComponent(customer.name)}`, '_blank');
    }

    // --- Nytt Jobb Logik ---
    const newJobBtn = document.getElementById('btnNewJobForCustomer');
    newJobBtn.onclick = () => {
        modal.classList.remove('show'); // Stäng kundprofil
        openNewJobModal(); // Öppna nytt jobb
        // Vänta lite så modalen hinner öppnas, fyll sen i namnet
        setTimeout(() => {
            document.getElementById('kundnamn').value = customer.name;
        }, 100);
    };

    // Visa modal
    modal.classList.add('show');
}

/* =================================================================
   KUND-LÄNKAR & AUTOCOMPLETE
   ================================================================= */

// 1. Öppna kundprofil genom att klicka på namnet
function openCustomerByName(name) {
    if (!name) return;
    
    // Använd din befintliga funktion för att hämta databasen
    const db = getCustomerDatabase(); 
    
    // Hitta kunden (okänsligt för stora/små bokstäver)
    const customer = db.find(c => c.name.toLowerCase() === name.toLowerCase());
    
    if (customer) {
        openCustomerModal(customer);
    } else {
        // Fallback om namnet inte matchar exakt (t.ex. stavfel i gamla jobb)
        // Vi skapar en "tillfällig" profil så man ändå ser historiken för det namnet
        const tempCustomer = {
            name: name,
            totalSpent: 0,
            visitCount: 0,
            lastVisit: null,
            vehicles: new Set(),
            history: allJobs.filter(j => j.kundnamn.toLowerCase() === name.toLowerCase())
        };
        // Räkna ut datan snabbt
        tempCustomer.history.forEach(j => {
            tempCustomer.totalSpent += (parseInt(j.kundpris) || 0);
            if(j.regnr) tempCustomer.vehicles.add(j.regnr);
        });
        openCustomerModal(tempCustomer);
    }
}

// 2. Uppdatera listan med förslag (Autocomplete)
function updateCustomerDatalist() {
    const dataList = document.getElementById('customerListOptions');
    if (!dataList) return;

    dataList.innerHTML = '';
    
    // Hämta unika namn från alla jobb
    const uniqueNames = [...new Set(allJobs.map(j => j.kundnamn ? j.kundnamn.trim().toUpperCase() : ""))];
    
    // Sortera och skapa options
    uniqueNames.sort().forEach(name => {
        if(name.length > 1) { // Skippa tomma/korta
            const option = document.createElement('option');
            option.value = name;
            dataList.appendChild(option);
        }
    });
}
