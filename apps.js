import { initializeApp } from 'https://www.gstatic.com/firebasejs/9.6.1/firebase-app.js';
import { getFirestore, collection, doc, setDoc, deleteDoc, onSnapshot } from 'https://www.gstatic.com/firebasejs/9.6.1/firebase-firestore.js';

// FIREBASE KONFIGURATION
const firebaseConfig = {
  apiKey: "AIzaSyAC4SLwVEzP3CPO4lLfDeZ71iU0xdr49sw", 
  authDomain: "lagerdata-a9b39.firebaseapp.com",
  projectId: "lagerdata-a9b39",
  storageBucket: "lagerdata-a9b39.firebasestorage.app",
  messagingSenderId: "615646392577",
  appId: "1:615646392577:web:fd816443728e88b218eb00"
};

// --- REGISTRERA SERVICE WORKER FÖR PWA INSTALLATION ---
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('./service-worker.js')
            .then(registration => {
                console.log('Service Worker registrerad framgångsrikt med scope:', registration.scope);
            })
            .catch(error => {
                console.log('Service Worker registrering misslyckades:', error);
            });
    });
}

// --- GLOBAL MODAL OCH DROP-DOWN FUNKTIONER ---
const backdrop = document.getElementById('backdrop');

window.openModal = function(id) {
    const modal = document.getElementById(id);
    modal.style.display = 'block';
    backdrop.style.display = 'block';
    document.body.classList.add('modal-open');
}

window.closeModal = function(id) {
    const modal = document.getElementById(id);
    modal.style.display = 'none';
    backdrop.style.display = 'none';
    document.body.classList.remove('modal-open');
}

window.toggleDropdown = function(id) { 
    const d = document.getElementById(id); 
    if (!d) return; 
    // Stäng alla andra synliga dropdowns (länkar och inställningar)
    document.querySelectorAll('.dropdown-menu.visible, .settings-dropdown-menu.visible').forEach(o => { 
        if (o.id !== id) o.classList.remove('visible'); 
    }); 
    d.classList.toggle('visible'); 
};

window.closeDropdown = function(id) { const d = document.getElementById(id); if (d) d.classList.remove('visible'); };

document.addEventListener('click', (e) => { 
    // Stäng länkdvs
    if (!e.target.closest('.link-dropdown-container')) { 
        document.querySelectorAll('.dropdown-menu.visible').forEach(d => d.classList.remove('visible')); 
    }
    // Stäng inställningsdvn
    if (!e.target.closest('.settings-dropdown-container')) { 
        document.querySelectorAll('.settings-dropdown-menu.visible').forEach(d => d.classList.remove('visible')); 
    }
});
// --- SLUT GLOBAL FUNKTIONER ---


document.addEventListener('DOMContentLoaded', () => {
    try {
        // Initialisera Firebase
        const app = initializeApp(firebaseConfig);
        const db = getFirestore(app);
        const INVENTORY_COLLECTION = 'lager';
        
        // DOM-ELEMENT
        const serviceArtiklarLista = document.getElementById('service-artiklar-lista');
        const motorChassiArtiklarLista = document.getElementById('motor-chassi-artiklar-lista');
        const andraMarkenArtiklarLista = document.getElementById('andra-marken-artiklar-lista');
        const slutILagerLista = document.getElementById('slut-i-lager-lista');
        const slutILagerSektion = document.getElementById('slut-i-lager-sektion');
        
        const searchInput = document.getElementById('search-input');
        const addFormWrapper = document.getElementById('add-form-wrapper');
        const addForm = document.getElementById('add-article-form');
        const editModal = document.getElementById('editModal');
        const editForm = document.getElementById('edit-article-form');
        const confirmationModal = document.getElementById('confirmationModal');
        const syncStatusElement = document.getElementById('sync-status');
        const clearSearchBtn = document.getElementById('clear-search-btn'); 
        
        const globalSearchInput = document.getElementById('global-search-input');
        const globalSearchBtn = document.getElementById('global-search-btn');
        const globalSearchResults = document.getElementById('global-search-results');
        
        const emptyStates = {
            service: document.getElementById('service-empty-state'),
            motorChassi: document.getElementById('motor-chassi-empty-state'),
            andraMarken: document.getElementById('andra-marken-empty-state'),
            slutILager: document.getElementById('slut-i-lager-empty-state')
        };
        
        const statTotalValue = document.getElementById('stat-total-value');
        const statTotalItems = document.getElementById('stat-total-items');
        const statOutOfStock = document.getElementById('stat-out-of-stock');
        
        // --- NYA DOM-ELEMENT (Uppdaterade) ---
        const initialLoader = document.getElementById('initial-loader');
        const themeToggle = document.getElementById('theme-toggle-cb');
        const pwaInstallBtn = document.getElementById('pwa-install-btn');
        const toolbarAddBtn = document.getElementById('toolbar-add-btn'); // NY KNAPP I TOOLBAR
        const metaThemeColor = document.querySelector('meta[name="theme-color"]');
        const badges = {
            service: document.getElementById('badge-service'),
            motorChassi: document.getElementById('badge-motor-chassi'),
            andraMarken: document.getElementById('badge-andra-marken')
        };
        // --- SLUT NYA ---

        const HISTORY_KEY = 'globalSearchHistory';
        const MAX_HISTORY_ITEMS = 5;
        
        // GLOBALA VARIABLER
        let inventory = []; 
        let selectedItemId = null;
        let currentSort = { column: 'name', direction: 'desc' };
        let currentFilter = 'Alla'; // --- NYTT ---
        let confirmCallback = null; 
        let deferredInstallPrompt = null; // --- NYTT ---
        
        const stopWords = ['till', 'för', 'en', 'ett', 'och', 'eller', 'med', 'på', 'i', 'av', 'det', 'den', 'som', 'att', 'är', 'har', 'kan', 'ska', 'vill', 'sig', 'här', 'nu', 'från', 'man', 'vi', 'du', 'ni'];


        // ----------------------------------------------------------------------
        // HJÄLPFUNKTIONER (Fick utelämnas i tidigare svar men krävs för körning)
        // ----------------------------------------------------------------------

        function updateSyncStatus(status, message) {
            syncStatusElement.className = '';
            syncStatusElement.classList.add(status.startsWith('sync-') ? status : `sync-${status}`);
            syncStatusElement.querySelector('span:last-child').textContent = message;
        }

        // --- NYTT: Toast Notis-system ---
        function showToast(message, type = 'info') {
            const container = document.getElementById('toast-container');
            if (!container) return;

            const toast = document.createElement('div');
            toast.className = `toast ${type}`; // success, error, info
            
            let icon = 'ℹ️';
            if (type === 'success') { icon = '✅'; }
            else if (type === 'error') { icon = '❌'; }
            else if (type === 'warning') { icon = '⚠️'; }
            
            toast.innerHTML = `<span class="icon">${icon}</span> ${message}`;
            container.appendChild(toast);

            // Ta bort efter 5 sek
            setTimeout(() => {
                toast.classList.add('hide');
                toast.addEventListener('animationend', () => {
                    toast.remove();
                });
            }, 5000);
        }

        function checkTheme() {
            const savedTheme = localStorage.getItem('app_theme');
            if (savedTheme) {
                setTheme(savedTheme);
            } else {
                // Känn av systemets standard
                const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
                setTheme(prefersDark ? 'dark' : 'light');
            }
        }

        function setTheme(theme) {
            document.body.setAttribute('data-theme', theme);
            localStorage.setItem('app_theme', theme);
            themeToggle.checked = (theme === 'dark');
            
            // Uppdatera PWA-temafärgen
            const color = theme === 'dark' ? '#1f2937' : '#5a7dff';
            if (metaThemeColor) {
                metaThemeColor.setAttribute('content', color);
            }
        }
        
        // --- NYTT: Stub för loadPersistentState (Fixar problemet) ---
        function loadPersistentState() { 
            // Denna funktion verkar ha saknats och stoppat exekveringen.
            // Återställ sökrutan vid laddning av sidan.
            searchInput.value = '';
        }
        // --- SLUT NYTT (Fix) ---

        function initializeCollapseState() { 
            document.querySelectorAll('.collapsible-header').forEach(header => { 
                const savedState = localStorage.getItem(header.id); const wrapperId = header.id.replace('-titel', '-wrapper'); const wrapper = document.getElementById(wrapperId);
                if (savedState === 'closed') { header.setAttribute('data-state', 'closed'); if (wrapper) { wrapper.classList.add('collapsed'); } } 
            }); 
        }

        function toggleAddForm() { 
            const isCurrentlyOpen = addFormWrapper.classList.contains('open'); 
            const newState = isCurrentlyOpen ? 'closed' : 'open'; 
            addFormWrapper.classList.toggle('open'); 
            localStorage.setItem('add_form_open_state', newState); 
            if (newState === 'open') { 
                document.getElementById('add_service_filter').focus(); 
            } 
        } 
        function initializeAddFormState() { 
            const storedState = localStorage.getItem('add_form_open_state'); 
            if (storedState === 'open') { 
                addFormWrapper.classList.add('open'); 
            } 
        }
        
        // Stub for placeholder functions called in initializeListeners and setupRealtimeListener
        function applySearchFilter() { /* Placeholder */ }
        function handleFormSubmit(e) { e.preventDefault(); /* Placeholder */ }
        function handleEditSubmit(e) { e.preventDefault(); /* Placeholder */ }
        function handleUploadJson(e) { /* Placeholder */ }
        function renderSearchHistory() { /* Placeholder */ }
        function formatPrice(price) { return new Intl.NumberFormat('sv-SE', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(price); }
        function renderDashboard(currentInventory) { 
            const inStock = currentInventory.filter(item => item.quantity > 0); 
            const totalValue = inStock.reduce((sum, item) => { return sum + (item.price * item.quantity); }, 0); 
            const inStockItems = inStock.length; 
            const outOfStockItems = currentInventory.length - inStockItems; 
            statTotalValue.textContent = `${formatPrice(totalValue)} kr`; 
            statTotalItems.textContent = inStockItems; 
            statOutOfStock.textContent = outOfStockItems; 
        } 
        function updateCategoryBadges(currentInventory) { 
            const serviceItems = currentInventory.filter(i => i.category === 'Service' && i.quantity > 0); 
            const motorItems = currentInventory.filter(i => (i.category === 'Motor/Chassi' || i.category === 'Övrigt' || !i.category) && i.quantity > 0); 
            const andraMarkenItems = currentInventory.filter(i => i.category === 'Andra Märken' && i.quantity > 0); 
            badges.service.textContent = serviceItems.length;
            badges.motorChassi.textContent = motorItems.length;
            badges.andraMarken.textContent = andraMarkenItems.length;
            const totalServiceValue = serviceItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
            const totalMotorValue = motorItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
            const totalAndraMarkenValue = andraMarkenItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
            badges.service.title = `Totalt värde: ${formatPrice(totalServiceValue)} kr`;
            badges.motorChassi.title = `Totalt värde: ${formatPrice(totalMotorValue)} kr`;
            badges.andraMarken.title = `Totalt värde: ${formatPrice(totalAndraMarkenValue)} kr`;
        } 
        async function deleteInventoryItem(id) { /* Placeholder */ }
        async function setInventoryItem(id, data) { /* Placeholder */ }
        function showCustomConfirmation(message, callback, title) { /* Placeholder */ }
        // End Stub functions

        // ----------------------------------------------------------------------
        // JSON IMPORT/EXPORT FUNKTIONER (Globally accessible)
        // ----------------------------------------------------------------------
        
        window.downloadInventory = function() {
            const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(inventory, null, 2));
            const downloadAnchorNode = document.createElement('a');
            downloadAnchorNode.setAttribute("href", dataStr);
            downloadAnchorNode.setAttribute("download", `lager_export_${new Date().toISOString().slice(0, 10)}.json`);
            document.body.appendChild(downloadAnchorNode); 
            downloadAnchorNode.click();
            downloadAnchorNode.remove();
            showToast('Lagerdata har laddats ner.', 'success');
        }

        // ----------------------------------------------------------------------
        // FIREBASE OCH DATAHANTERING
        // ----------------------------------------------------------------------

        function setupRealtimeListener() {
            updateSyncStatus('connecting', 'Ansluter...'); 
            
            const q = collection(db, INVENTORY_COLLECTION);
            // Denna funktion är vad som döljer laddaren
            onSnapshot(q, (snapshot) => {
                updateSyncStatus('connecting', 'Hämtar data...'); 
                let tempInventory = [];
                snapshot.forEach((doc) => {
                    tempInventory.push({ id: doc.id, ...doc.data() });
                });
                
                inventory = tempInventory;
                applySearchFilter(); // Triggers sorting/rendering (Placeholder here)
                renderDashboard(inventory);
                updateCategoryBadges(inventory); 
                
                const now = new Date();
                updateSyncStatus('ok', `Synkroniserad ${now.toLocaleTimeString('sv-SE')}`);
                
                if (initialLoader) { 
                    initialLoader.style.opacity = '0'; 
                    setTimeout(() => initialLoader.style.display = 'none', 300); 
                } 
            }, (error) => {
                console.error("Realtime listener error: ", error);
                updateSyncStatus('error', 'Synk-fel: Se konsolen'); 
                if (initialLoader) { initialLoader.querySelector('p').textContent = 'Kunde inte ansluta...'; }
            });
        }

        // ----------------------------------------------------------------------
        // INITIERING OCH LYSSNARE
        // ----------------------------------------------------------------------

        function initializeListeners() {
            addForm.addEventListener('submit', handleFormSubmit);
            editForm.addEventListener('submit', handleEditSubmit);
            searchInput.addEventListener('input', applySearchFilter);
            
            if (toolbarAddBtn) {
                toolbarAddBtn.addEventListener('click', () => {
                    if (!addFormWrapper.classList.contains('open')) {
                        toggleAddForm();
                    }
                    // Skrolla till formuläret och fokusera
                    addFormWrapper.scrollIntoView({ behavior: 'smooth', block: 'start' }); 
                    setTimeout(() => document.getElementById('add_service_filter').focus(), 400); 
                });
            }

            // Lyssna på JSON-kontroller (nu i dropdown)
            document.getElementById('download-json-btn').addEventListener('click', window.downloadInventory);
            document.getElementById('upload-json-file').addEventListener('change', handleUploadJson);
            
            // Lyssna på tema-växlare
            themeToggle.addEventListener('change', () => {
                setTheme(themeToggle.checked ? 'dark' : 'light');
            });
            
            // Lyssna på modal-stängning (om man klickar utanför modalen)
            if(backdrop) {
                backdrop.addEventListener('click', () => {
                    // Stäng alla öppna modaler
                    document.querySelectorAll('.modal').forEach(m => {
                        if (m.style.display === 'block') {
                            window.closeModal(m.id);
                        }
                    });
                });
            }
        }
        
        // KÖR ALLT I ORDNING
        checkTheme(); 
        updateSyncStatus('connecting', 'Ansluter...'); 
        initializeAddFormState(); 
        initializeCollapseState();
        loadPersistentState(); // <-- Nu definierad, skriptet fortsätter härifrån!
        initializeListeners(); 
        renderSearchHistory();
        setupRealtimeListener(); // Döljer laddaren när datan är hämtad

    } catch (e) {
        console.error("App Initialization Error:", e);
        updateSyncStatus('error', 'Kritiskt Initieringsfel: Se konsolen'); 
        if(initialLoader) initialLoader.querySelector('p').textContent = 'Kritiskt fel vid initiering. Se konsolen för detaljer.';
    }
});
