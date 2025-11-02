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
        // const toggleBtn = document.getElementById('toggle-add-form-btn'); // BORTTAGEN
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
        const categoryFilterBar = document.getElementById('category-filter-bar');
        // const fabAddBtn = document.getElementById('fab-add-btn'); // BORTTAGEN
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
        // LÄNK-FUNKTIONER (inkl. historik)
        // ----------------------------------------------------------------------

        function saveSearchToHistory(term) {
            if (!term) return; let history = JSON.parse(localStorage.getItem(HISTORY_KEY) || '[]'); history = history.filter(h => h !== term); history.unshift(term);
            if (history.length > MAX_HISTORY_ITEMS) { history = history.slice(0, MAX_HISTORY_ITEMS); }
            localStorage.setItem(HISTORY_KEY, JSON.stringify(history)); renderSearchHistory();
        }

        function renderSearchHistory() {
            const historyContainer = document.getElementById('global-search-history'); if (!historyContainer) return; const history = JSON.parse(localStorage.getItem(HISTORY_KEY) || '[]');
            if (history.length === 0) { historyContainer.innerHTML = ''; return; }
            let historyHTML = ''; history.forEach(term => { historyHTML += `<span class="history-item" data-term="${term}">${term}</span>`; });
            historyContainer.innerHTML = historyHTML;
            document.querySelectorAll('.history-item').forEach(item => {
                item.addEventListener('click', (e) => {
                    const term = e.target.getAttribute('data-term');
                    globalSearchInput.value = term; handleGlobalSearch(term);
                    document.querySelector('.global-search-container').scrollIntoView({ behavior: 'smooth', block: 'center' });
                });
            });
        }
      
        function formatPrice(price) { return new Intl.NumberFormat('sv-SE', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(price); }
        function generateAeroMLink(f) { if (!f) return null; const s = f.replace(/[\s-]/g, ''); return `https://aeromotors.se/sok?s=${s}&layered_id_feature_1586%5B%5D=3&sort_by=price.asc`; }
        function generateTrodoLink(f) { if (!f) return null; const s = f.replace(/[\s-]/g, ''); const q = encodeURIComponent(s); return `https://www.trodo.se/catalogsearch/result/premium?filter[quality_group]=2&product_list_dir=asc&product_list_order=price&q=${q}`; }
        function generateThansenLink(f) { if (!f) return null; const s = f.replace(/[\s-]/g, ''); const q = encodeURIComponent(s); return `https://www.thansen.se/search/?query=${q}`; }
        function generateSkruvatLink(f) { if (!f) return null; const s = encodeURIComponent(f.replace(/[\s-]/g, '')); return `https://skruvat.se/search?q=${s}`; }
        function generateVortoLink(f) { if (!f) return null; const s = encodeURIComponent(f.replace(/[\s-]/g, '')); return `https://vorto.se/sok?search=${s}`; }
        function generateAutodocLink(f) { if (!f) return null; const s = encodeURIComponent(f.replace(/[\s-]/g, '')); return `https://autodoc.se/search?keyword=${s}`; }
        function generateBildelsbasenLink(f) { if (!f) return null; const s = encodeURIComponent(f.replace(/[\s-]/g, '')); return `https://bildelsbasen.se/sv-se/OEM/${s}`; }
        function generateReservdelar24Link(f) { if (!f) return null; const s = encodeURIComponent(f.replace(/[\s-]/g, '')); return `https://reservdelar24.se/suche.html?keyword=${s}`; }
        
        // UPPDATERAD: Inkluderar den nya settings-dropdown
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


        // ----------------------------------------------------------------------
        // GLOBAL SÖK-FUNKTION
        // ----------------------------------------------------------------------
        const externalSearchProviders = [
            { name: "Trodo", linkGenerator: generateTrodoLink, icon: "https://www.trodo.se/media/favicon/default/favicon-96x96.png" },
            { name: "AeroMotors", linkGenerator: generateAeroMLink, icon: "https://aeromotors.se/img/favicon.ico?1678367017" },
            { name: "Thansen", linkGenerator: generateThansenLink, icon: "https://cdn.thg.dk/DAT/dom/img/logo-thg.ico" },
            { name: "Skruvat", linkGenerator: generateSkruvatLink, icon: "https://www.skruvat.se/favicon.ico" },
            { name: "Vorto.se", linkGenerator: generateVortoLink, icon: "https://www.vorto.se/favicon.ico" },
            { name: "Autodoc", linkGenerator: generateAutodocLink, icon: "https://autodoc.se/assets/54eb94/images/favicon-196x196.png" },
            { name: "Bildelsbasen*", linkGenerator: generateBildelsbasenLink, icon: "https://www.bildelsbasen.se/favicon.ico" },
            { name: "Reservdelar24", linkGenerator: generateReservdelar24Link, icon: "https://www.reservdelar24.se/favicon.ico" },
        ];

        function handleGlobalSearch(searchTermOverride) {
            const searchTerm = searchTermOverride ? searchTermOverride.trim().toUpperCase() : globalSearchInput.value.trim().toUpperCase();
            if (searchTerm === '') { globalSearchResults.innerHTML = ''; globalSearchResults.style.display = 'none'; return; }
            saveSearchToHistory(searchTerm); 

            const internalMatches = inventory.filter(item => (item.service_filter || '').toUpperCase().includes(searchTerm) || (item.name || '').toUpperCase().includes(searchTerm));
            let internalHTML = '';
            if (internalMatches.length > 0) {
                internalHTML = '<h4 class="internal-search-title">Hittades i ditt lager:</h4>';
                internalMatches.forEach(item => { internalHTML += `<a href="#" class="internal-result-item" data-id="${item.id}"><div><strong>${item.service_filter}</strong> - ${item.name}</div><span>Antal: ${item.quantity}</span></a>`; });
            }

            let externalHTML = '<div class="global-search-results-links">';
            let hasExternalLinks = false;
            externalSearchProviders.forEach(provider => {
                const link = provider.linkGenerator(searchTerm);
                if (link) { const iconHTML = `<img src="${provider.icon}" alt="${provider.name}" class="link-favicon">`; externalHTML += `<a href="${link}" target="_blank" class="lank-knapp">${iconHTML}${provider.name}</a>`; hasExternalLinks = true; }
            });
            externalHTML += '</div>';
            if(hasExternalLinks) { externalHTML = '<h4 class="external-search-title">Externa leverantörer:</h4>' + externalHTML; }

            let disclaimerHTML = '';
            if (searchTerm.length > 0 && hasExternalLinks) { disclaimerHTML = '<div class="search-disclaimer-text">* Bildelsbasen söker primärt efter begagnade delar.</div>'; }

            globalSearchResults.innerHTML = `<button id="global-search-close-btn" title="Stäng">&times;</button>${internalHTML}${externalHTML}${disclaimerHTML}`;
            globalSearchResults.style.display = 'block';

            document.querySelectorAll('.internal-result-item').forEach(link => {
                link.addEventListener('click', (e) => {
                    e.preventDefault(); const itemId = e.currentTarget.getAttribute('data-id'); const row = document.querySelector(`.artikel-rad[data-id="${itemId}"]`);
                    if (row) {
                        searchInput.value = ''; applySearchFilter();
                        setTimeout(() => {
                            row.scrollIntoView({ behavior: 'smooth', block: 'center' });
                            document.querySelectorAll('.artikel-rad').forEach(r => r.classList.remove('selected'));
                            row.classList.add('selected'); selectedItemId = parseInt(itemId, 10);
                        }, 200);
                        globalSearchResults.style.display = 'none';
                    }
                });
            });
            document.getElementById('global-search-close-btn').addEventListener('click', () => { globalSearchResults.innerHTML = ''; globalSearchResults.style.display = 'none'; });
        }

        // ----------------------------------------------------------------------
        // NYA FUNKTIONER: TEMA, TOASTS, M.M.
        // ----------------------------------------------------------------------

        // --- NYTT: Temahanterare ---
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
        
        // ... (Resten av hjälphfunktioner: updateSyncStatus, PWA-hantering, m.m.)

        // ----------------------------------------------------------------------
        // GRÄNSSNITT OCH HUVUDFUNKTIONER (UPPDATERADE)
        // ----------------------------------------------------------------------

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

            // Lägg till värdet i en tooltip
            badges.service.title = `Totalt värde: ${formatPrice(totalServiceValue)} kr`;
            badges.motorChassi.title = `Totalt värde: ${formatPrice(totalMotorValue)} kr`;
            badges.andraMarken.title = `Totalt värde: ${formatPrice(totalAndraMarkenValue)} kr`;
        } 

        // ... (Resten av renderInventoryItem, filter-logik, CRUD-funktioner...)
        
        function updateSyncStatus(status, message) {
            syncStatusElement.className = '';
            syncStatusElement.classList.add(status.startsWith('sync-') ? status : `sync-${status}`);
            syncStatusElement.querySelector('span:last-child').textContent = message;
        }

        // ----------------------------------------------------------------------
        // FIREBASE OCH DATAHANTERING
        // ----------------------------------------------------------------------

        function setupRealtimeListener() {
            updateSyncStatus('connecting', 'Ansluter...'); 
            
            const q = collection(db, INVENTORY_COLLECTION);
            onSnapshot(q, (snapshot) => {
                updateSyncStatus('connecting', 'Hämtar data...'); 
                let tempInventory = [];
                snapshot.forEach((doc) => {
                    tempInventory.push({ id: doc.id, ...doc.data() });
                });
                
                inventory = tempInventory;
                applySearchFilter(); // Triggers sorting/rendering
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

        function toggleAddForm() { 
            const isCurrentlyOpen = addFormWrapper.classList.contains('open'); 
            const newState = isCurrentlyOpen ? 'closed' : 'open'; 
            addFormWrapper.classList.toggle('open'); 
            // toggleBtn.classList.toggle('open'); // BORTTAGEN
            localStorage.setItem('add_form_open_state', newState); 
            if (newState === 'open') { 
                document.getElementById('add_service_filter').focus(); 
            } 
        } 
        function initializeAddFormState() { 
            const storedState = localStorage.getItem('add_form_open_state'); 
            if (storedState === 'open') { 
                addFormWrapper.classList.add('open'); 
                // toggleBtn.classList.add('open'); // BORTTAGEN
            } 
        }
        
        // ... (Resten av CRUD-funktioner, validering)
        
        // ----------------------------------------------------------------------
        // JSON IMPORT/EXPORT FUNKTIONER
        // ----------------------------------------------------------------------
        
        // Export JSON (oförändrad)
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

        // Import JSON (oförändrad)
        async function handleUploadJson(event) {
            const file = event.target.files[0]; 
            if (!file) return; 
            const reader = new FileReader(); 
            reader.onload = async (e) => { 
                try { 
                    const uploadedInventory = JSON.parse(e.target.result); 
                    if(Array.isArray(uploadedInventory)) { 
                        showCustomConfirmation(`Detta kommer att skriva över ${inventory.length} befintliga artiklar med ${uploadedInventory.length} artiklar från filen. Vill du fortsätta?`, async (result) => { 
                            if (result) { 
                                for (const item of inventory) { await deleteInventoryItem(item.id); } 
                                for (const item of uploadedInventory) { 
                                    const newId = item.id ? String(item.id) : String(Date.now() + Math.floor(Math.random() * 1000));
                                    await setInventoryItem(newId, { ...item, id: newId }); 
                                } 
                                showToast('Lagerdata har importerats framgångsrikt!', 'success');
                            }
                            // Rensa filfältet
                            event.target.value = '';
                        }, 'VARNING: Överskrivning');
                    } else {
                        showToast('Filformatet är ogiltigt. Förväntade sig en array.', 'error');
                        event.target.value = '';
                    }
                } catch (error) { 
                    console.error("Fel vid import av JSON:", error); 
                    showToast('Ett fel uppstod vid läsning av filen.', 'error');
                    event.target.value = '';
                } 
            }; 
            reader.readAsText(file);
        }

        // ----------------------------------------------------------------------
        // INITIERING OCH LYSSNARE
        // ----------------------------------------------------------------------

        function initializeListeners() {
            addForm.addEventListener('submit', handleFormSubmit);
            editForm.addEventListener('submit', handleEditSubmit);
            searchInput.addEventListener('input', applySearchFilter);
            
            // --- NYTT: Lyssna på den nya toolbar Add-knappen ---
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
            
            // ... (Resten av lyssnare)
            
            // Lyssna på tema-växlare
            themeToggle.addEventListener('change', () => {
                setTheme(themeToggle.checked ? 'dark' : 'light');
            });
            
            // ... (Resten av lyssnare)
        }
        
        // ... (Resten av initialize-funktioner)

        // KÖR ALLT I ORDNING
        checkTheme(); 
        updateSyncStatus('connecting', 'Ansluter...'); 
        initializeAddFormState(); 
        initializeCollapseState();
        loadPersistentState(); 
        initializeListeners(); 
        renderSearchHistory();
        setupRealtimeListener(); 

    } catch (e) {
        console.error("App Initialization Error:", e);
        updateSyncStatus('error', 'Initieringsfel!'); 
        if(initialLoader) initialLoader.querySelector('p').textContent = 'Kritiskt fel vid initiering.';
    }
});
