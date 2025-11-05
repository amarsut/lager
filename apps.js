import { initializeApp } from 'https://www.gstatic.com/firebasejs/9.6.1/firebase-app.js';
import { getFirestore, collection, doc, setDoc, deleteDoc, onSnapshot, query, orderBy as firestoreOrderBy } from 'https://www.gstatic.com/firebasejs/9.6.1/firebase-firestore.js';

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
    // --- Skrolla till toppen vid omladdning ---
    if ('scrollRestoration' in history) {
        history.scrollRestoration = 'manual';
    }
    window.scrollTo(0, 0);
    
    // --- VIKTIGT: Flyttade updateSyncStatus UTANFÖR try...catch ---
    const syncStatusElement = document.getElementById('sync-status');
    function updateSyncStatus(status, message) {
        if (!syncStatusElement) return;
        const textEl = syncStatusElement.querySelector('.text');
        if (!textEl) return; // Säkerhetskoll
    
        syncStatusElement.classList.remove('flash');
        syncStatusElement.className = `sync-${status}`;
        syncStatusElement.title = message;
        textEl.textContent = message;
    
        // --- LÄGG TILL DETTA BLOCK ---
        textEl.style.opacity = 1; // Se till att den syns
    
        // Om status är OK, tona ut texten efter 4 sekunder
        if (status === 'ok') {
            setTimeout(() => {
                textEl.style.opacity = 0;
            }, 4000);
        }
        // --- SLUT PÅ NYTT BLOCK ---
    }
    
    try {
        // Initialisera Firebase
        const app = initializeApp(firebaseConfig);
        const db = getFirestore(app);
        const INVENTORY_COLLECTION = 'lager';
        
        // DOM-ELEMENT
        // Listor
        const serviceArtiklarLista = document.getElementById('service-artiklar-lista');
        const motorChassiArtiklarLista = document.getElementById('motor-chassi-artiklar-lista');
        const andraMarkenArtiklarLista = document.getElementById('andra-marken-artiklar-lista');
        const slutILagerLista = document.getElementById('slut-i-lager-lista');
        
        const serviceArtiklarKortLista = document.getElementById('service-artiklar-kort-lista');
        const motorChassiArtiklarKortLista = document.getElementById('motor-chassi-artiklar-kort-lista');
        const andraMarkenArtiklarKortLista = document.getElementById('andra-marken-artiklar-kort-lista');
        const slutILagerKortLista = document.getElementById('slut-i-lager-kort-lista');
        
        // Sektioner & Tomma lägen
        const slutILagerSektion = document.getElementById('slut-i-lager-wrapper');
        const slutILagerTitel = document.getElementById('slut-i-lager-titel');
        const fullEmptyState = document.getElementById('full-empty-state');
        const emptyStateAddBtn = document.getElementById('empty-state-add-btn');
        const emptyStates = {
            service: document.getElementById('service-empty-state'),
            motorChassi: document.getElementById('motor-chassi-empty-state'),
            andraMarken: document.getElementById('andra-marken-empty-state'),
            slutILager: document.getElementById('slut-i-lager-empty-state')
        };
        
        // Sök & Filter
        const desktopSearchInput = document.getElementById('desktop-search-input');
        const mobileSearchInput = document.getElementById('mobile-search-input');
        const desktopClearSearchBtn = document.getElementById('desktop-clear-search-btn');
        const mobileClearSearchBtn = document.getElementById('mobile-clear-search-btn');
        const desktopSearchResults = document.getElementById('desktop-search-results');
        const mobileSearchResults = document.getElementById('mobile-search-results');
        const categoryFilterBar = document.getElementById('category-filter-bar');
        const toolbarFilterBadge = document.getElementById('toolbar-filter-badge');

        // Modaler & Formulär
        const addItemModal = document.getElementById('addModal');
        const addForm = document.getElementById('add-article-form');
        const addFormSubmitBtn = addForm.querySelector('button[type="submit"]');

        const editModal = document.getElementById('editModal');
        const editForm = document.getElementById('edit-article-form');
        const editFormSubmitBtn = editForm.querySelector('button[type="submit"]');
        
        const confirmationModal = document.getElementById('confirmationModal');
        
        // Global sök
        const globalSearchInput = document.getElementById('global-search-input');
        const globalSearchBtn = document.getElementById('global-search-btn');
        const globalSearchResults = document.getElementById('global-search-results');
        const biluppgifterResultContainer = document.getElementById('biluppgifter-result-container');
        const internalResultsContainer = document.getElementById('internal-results-container');
        const externalResultsContainer = document.getElementById('external-results-container');
        const exportLinksContainer = document.getElementById('export-search-links-container');
        const searchDisclaimer = document.getElementById('search-disclaimer');
        const quickAddFromSearchBtn = document.createElement('button');
        quickAddFromSearchBtn.id = 'quick-add-from-search';
        quickAddFromSearchBtn.className = 'btn-primary';

        // Toolbar & Knappar
        const toolbarAddBtn = document.getElementById('toolbar-add-btn');
        const fabAddBtn = document.getElementById('fab-add-btn');
        const pwaInstallBtn = document.getElementById('pwa-install-btn');
        
        // App-meny & Dashboard
        const dashboardContainer = document.querySelector('.app-menu-content .dashboard-container');
        const statTotalItems = document.getElementById('stat-total-items');
        const statTotalUnits = document.getElementById('stat-total-units');
        const statOutOfStock = document.getElementById('stat-out-of-stock');
        const recentItemsList = document.getElementById('recent-items-list');
        const recentItemsEmpty = document.getElementById('recent-items-empty');
        const topValueList = document.getElementById('top-value-list');
        const topValueEmpty = document.getElementById('top-value-empty');
        const appMenuBtn = document.getElementById('app-menu-btn');
        const appMenuModal = document.getElementById('app-menu-modal');
        const appMenuOverlay = document.getElementById('app-menu-overlay');
        const appMenuCloseBtn = document.getElementById('app-menu-close-btn');

        // Exportera
        const exportCsvBtn = document.getElementById('export-csv-btn');
        const exportJsonBtn = document.getElementById('export-json-btn');
        
        // Övrigt
        const initialLoader = document.getElementById('initial-loader');
        const themeToggle = document.getElementById('theme-toggle-cb');
        const metaThemeColor = document.querySelector('meta[name="theme-color"]');
        const rowActionPopover = document.getElementById('row-action-popover');
        const popoverContent = document.getElementById('popover-content');
        
        const badges = {
            service: document.getElementById('badge-service'),
            motorChassi: document.getElementById('badge-motor-chassi'),
            andraMarken: document.getElementById('badge-andra-marken'),
            slutILager: document.getElementById('badge-slut-i-lager')
        };
        
        const HISTORY_KEY = 'globalSearchHistory';
        const MAX_HISTORY_ITEMS = 5;
        
        // GLOBALA VARIABLER
        let inventory = []; 
        let selectedItemId = null;
        let currentSort = { column: 'name', direction: 'desc' };
        let currentFilter = 'Alla';
        let confirmCallback = null; 
        let deferredInstallPrompt = null;
        let currentExternalLinks = [];
        let isNavigatingViaSearch = false;
        let isPopoverOpen = false;
        let currentPopoverItemId = null;

        const stopWords = ['till', 'för', 'en', 'ett', 'och', 'eller', 'med', 'på', 'i', 'av', 'det', 'den', 'som', 'att', 'är', 'har', 'kan', 'ska', 'vill', 'sig', 'här', 'nu', 'från', 'man', 'vi', 'du', 'ni'];

        // ----------------------------------------------------------------------
        // LÄNK-FUNKTIONER (inkl. historik)
        // ----------------------------------------------------------------------

        function saveSearchToHistory(term) {
            if (!term) return;
            let history = JSON.parse(localStorage.getItem(HISTORY_KEY) || '[]');
            history = history.filter(h => h.toLowerCase() !== term.toLowerCase());
            history.unshift(term);
            if (history.length > MAX_HISTORY_ITEMS) {
                history = history.slice(0, MAX_HISTORY_ITEMS);
            }
            localStorage.setItem(HISTORY_KEY, JSON.stringify(history));
            renderSearchHistory();
        }
        
        function removeSearchFromHistory(term) {
            let history = JSON.parse(localStorage.getItem(HISTORY_KEY) || '[]');
            history = history.filter(h => h.toLowerCase() !== term.toLowerCase());
            localStorage.setItem(HISTORY_KEY, JSON.stringify(history));
            renderSearchHistory();
        }

        function renderSearchHistory() {
            const historyContainer = document.getElementById('global-search-history');
            if (!historyContainer) return;
            const history = JSON.parse(localStorage.getItem(HISTORY_KEY) || '[]');
            
            if (history.length === 0) {
                historyContainer.innerHTML = '';
                return;
            }
            
            let historyHTML = '';
            history.forEach(term => {
                historyHTML += `<span class="history-item">
                                    <span class="history-term">${term}</span>
                                    <i class="delete-history" data-term="${term}">&times;</i>
                                </span>`;
            });
            historyContainer.innerHTML = historyHTML;
            
            historyContainer.querySelectorAll('.history-term').forEach(item => {
                item.addEventListener('click', (e) => {
                    const term = e.target.textContent;
                    globalSearchInput.value = term;
                    globalSearchInput.dispatchEvent(new Event('input'));
                    handleGlobalSearch(term);
                    document.querySelector('.global-search-container').scrollIntoView({ behavior: 'smooth', block: 'center' });
                });
            });
            
            historyContainer.querySelectorAll('.delete-history').forEach(item => {
                item.addEventListener('click', (e) => {
                    e.stopPropagation();
                    const term = e.target.getAttribute('data-term');
                    removeSearchFromHistory(term);
                });
            });
        }
      
        function formatPrice(price) { return new Intl.NumberFormat('sv-SE', { style: 'currency', currency: 'SEK', minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(price); }
        function generateAeroMLink(f) { if (!f) return null; const s = f.replace(/[\s-]/g, ''); return `https://aeromotors.se/sok?s=${s}&layered_id_feature_1586%5B%5D=3&sort_by=price.asc`; }
        function generateTrodoLink(f) { if (!f) return null; const s = f.replace(/[\s-]/g, ''); const q = encodeURIComponent(s); return `https://www.trodo.se/catalogsearch/result/premium?filter[quality_group]=2&product_list_dir=asc&product_list_order=price&q=${q}`; }
        function generateThansenLink(f) { if (!f) return null; const s = f.replace(/[\s-]/g, ''); const q = encodeURIComponent(s); return `https://www.thansen.se/search/?query=${q}`; }
        function generateSkruvatLink(f) { if (!f) return null; const s = encodeURIComponent(f.replace(/[\s-]/g, '')); return `https://skruvat.se/search?q=${s}`; }
        function generateVortoLink(f) { if (!f) return null; const s = encodeURIComponent(f.replace(/[\s-]/g, '')); return `https://vorto.se/sok?search=${s}`; }
        function generateAutodocLink(f) { if (!f) return null; const s = encodeURIComponent(f.replace(/[\s-]/g, '')); return `https://autodoc.se/search?keyword=${s}`; }
        function generateBildelsbasenLink(f) { if (!f) return null; const s = encodeURIComponent(f.replace(/[\s-]/g, '')); return `https://bildelsbasen.se/sv-se/OEM/${s}`; }
        function generateReservdelar24Link(f) { if (!f) return null; const s = encodeURIComponent(f.replace(/[\s-]/g, '')); return `https://reservdelar24.se/suche.html?keyword=${s}`; }
        
        function hideSearchDropdowns() {
            desktopSearchResults.style.display = 'none';
            mobileSearchResults.style.display = 'none';
        }
        
        document.addEventListener('click', (e) => {
            if (!e.target.closest('.search-wrapper') && !e.target.closest('#sticky-search-bar')) {
                hideSearchDropdowns();
            }
            if (isPopoverOpen && !e.target.closest('#row-action-popover') && !e.target.closest('.row-action-btn')) {
                closeRowActionPopover();
            }
            if (!e.target.closest('.link-dropdown-container')) {
                document.querySelectorAll('.dropdown-menu.visible').forEach(d => d.classList.remove('visible'));
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
        
        function isRegNr(term) {
            const regNrRegex = /^[A-ZÅÄÖ]{3}[\s]?[0-9]{2}[A-ZÅÄÖ0-9]{1}$/;
            const cleanRegNr = term.replace(/\s/g, '');
            return regNrRegex.test(term) || (cleanRegNr.length === 6 && regNrRegex.test(cleanRegNr));
        }

        function updateGlobalSearchButton(term) {
            const btnText = globalSearchBtn.querySelector('.btn-text');
            const btnIcon = globalSearchBtn.querySelector('.icon-span');
            
            if (isRegNr(term)) {
                btnText.textContent = 'Fordons-sök';
                btnIcon.textContent = 'directions_car';
            } else if (term.trim() !== '') {
                btnText.textContent = 'Jämför priser';
                btnIcon.textContent = 'compare_arrows';
            } else {
                btnText.textContent = 'Sök';
                btnIcon.textContent = 'search';
            }
        }

        async function handleGlobalSearch(searchTermOverride) {
            const searchTerm = (searchTermOverride ? searchTermOverride.trim().toUpperCase() : globalSearchInput.value.trim().toUpperCase());
            if (searchTerm === '') {
                globalSearchResults.style.display = 'none';
                return;
            }
            
            globalSearchBtn.disabled = true;
            saveSearchToHistory(searchTerm); 
            
            if (isRegNr(searchTerm)) {
                const cleanRegNr = searchTerm.replace(/\s/g, '');
                
                const biluppgifterLink = `https://biluppgifter.se/fordon/${cleanRegNr}#vehicle-data`;
                const carInfoLink = `https://car.info/sv-se/license-plate/S/${cleanRegNr}#attributes`;
                
                biluppgifterResultContainer.innerHTML = `
                    <h4 class="internal-search-title">Fordonsuppslag:</h4>
                    <div class="provider-card">
                        <img src="https://biluppgifter.se/favicon/favicon.ico" alt="Biluppgifter.se" class="provider-card-logo">
                        <div class="provider-card-content">
                            <span class="provider-card-name">${cleanRegNr} (Biluppgifter)</span>
                            <a href="${biluppgifterLink}" target="_blank" class="btn-provider-search">Visa</a>
                        </div>
                    </div>
                    <div class="provider-card">
                        <img src="https://car.info/favicon.ico" alt="Car.info" class="provider-card-logo">
                        <div class="provider-card-content">
                            <span class="provider-card-name">${cleanRegNr} (Car.info)</span>
                            <a href="${carInfoLink}" target="_blank" class="btn-provider-search">Visa</a>
                        </div>
                    </div>
                `;
                biluppgifterResultContainer.style.display = 'block';
                
                internalResultsContainer.innerHTML = '';
                externalResultsContainer.innerHTML = '';
                exportLinksContainer.style.display = 'none';
                searchDisclaimer.style.display = 'none';
                globalSearchResults.style.display = 'block';

                document.getElementById('global-search-close-btn').addEventListener('click', () => { 
                  globalSearchResults.style.display = 'none'; 
                });
                
                document.querySelector('.global-search-container').scrollIntoView({ behavior: 'smooth', block: 'start' });
                
                globalSearchBtn.disabled = false;
                return; 
            }

            biluppgifterResultContainer.style.display = 'none';
            
            try {
                internalResultsContainer.innerHTML = '';
                externalResultsContainer.innerHTML = '';
                exportLinksContainer.style.display = 'none';
                searchDisclaimer.style.display = 'none';
                globalSearchResults.style.display = 'block';
                currentExternalLinks = []; 
                
                document.querySelector('.global-search-container').scrollIntoView({ behavior: 'smooth', block: 'start' });

                const searchTermNoSpace = searchTerm.replace(/\s/g, '');

                const internalMatches = inventory.filter(item => {
                    const itemServiceFilter = (item.service_filter || '').toUpperCase().replace(/\s/g, '');
                    const itemName = (item.name || '').toUpperCase();
                    
                    return itemServiceFilter.includes(searchTermNoSpace) || itemName.includes(searchTerm);
                });
                
                let internalHTML = '';
                if (internalMatches.length > 0) {
                    internalHTML = '<h4 class="internal-search-title">Hittades i ditt lager:</h4>';
                    internalMatches.forEach(item => { 
                        internalHTML += `<a href="#" class="internal-result-item" data-id="${item.id}"><div><strong>${item.service_filter}</strong> - ${item.name}</div><span>Antal: ${item.quantity}</span></a>`; 
                    });
                } else {
                    internalHTML = '<h4 class="internal-search-title">Inga träffar i ditt lager</h4>';
                }
                internalResultsContainer.innerHTML = internalHTML;
                if (internalMatches.length === 0) {
                    quickAddFromSearchBtn.innerHTML = `<span class="icon-span">add_circle</span>Lägg till "${searchTerm}" i lagret`;
                    quickAddFromSearchBtn.setAttribute('data-search-term', searchTerm);
                    internalResultsContainer.appendChild(quickAddFromSearchBtn);
                }

                // 2. Externa resultat
                let externalHTML = '';
                let hasDisclaimer = false;
                
                externalSearchProviders.forEach(provider => {
                    const link = provider.linkGenerator(searchTerm);
                    if (link) {
                        currentExternalLinks.push({ name: provider.name, link: link });
                        if (provider.name.includes('Bildelsbasen')) {
                            hasDisclaimer = true;
                        }
                        
                        externalHTML += `
                            <div class="provider-card">
                                <img src="${provider.icon}" alt="${provider.name}" class="provider-card-logo">
                                <div class="provider-card-content">
                                    <span class="provider-card-name">${provider.name}</span>
                                    <a href="${link}" target="_blank" class="btn-provider-search">Sök</a>
                                </div>
                            </div>
                        `;
                    } else {
                        externalHTML += `
                            <div class="provider-card disabled">
                                <img src="${provider.icon}" alt="${provider.name}" class="provider-card-logo">
                                <div class="provider-card-content">
                                    <span class="provider-card-name">${provider.name}</span>
                                    <a class="btn-provider-search">Sök</a>
                                </div>
                            </div>
                        `;
                    }
                });
                
                externalResultsContainer.innerHTML = externalHTML;
                
                if (currentExternalLinks.length > 0) {
                    exportLinksContainer.style.display = 'inline-block';
                }
                if (hasDisclaimer) {
                    searchDisclaimer.style.display = 'block';
                }

                // 3. Återbind lyssnare
                document.querySelectorAll('.internal-result-item').forEach(link => {
                    link.addEventListener('click', (e) => {
                        e.preventDefault(); 
                        const itemId = e.currentTarget.getAttribute('data-id');
                        scrollToAndHighlight(itemId);
                        globalSearchResults.style.display = 'none';
                    });
                });
                
                document.getElementById('global-search-close-btn').addEventListener('click', () => { 
                  globalSearchResults.style.display = 'none'; 
                });
                
            } catch (error) {
                console.error("Fel vid global sökning: ", error);
                showToast("Ett fel inträffade vid sökningen", "error");
            } finally {
                globalSearchBtn.disabled = false;
            }
        }
        
        function handleCopyAllLinks(buttonEl, type = 'text') {
            if (currentExternalLinks.length === 0) return;
            let contentToCopy = '';
            if (type === 'json') {
                const linksObject = currentExternalLinks.reduce((acc, item) => {
                    acc[item.name] = item.link;
                    return acc;
                }, {});
                contentToCopy = JSON.stringify(linksObject, null, 2);
            } else {
                contentToCopy = currentExternalLinks.map(item => item.link).join('\n');
            }
            navigator.clipboard.writeText(contentToCopy).then(() => {
                const originalText = buttonEl.innerHTML;
                buttonEl.innerHTML = 'Kopierat!';
                buttonEl.disabled = true;
                setTimeout(() => {
                    buttonEl.innerHTML = originalText;
                    buttonEl.disabled = false;
                }, 1500);
            }).catch(() => {
                showToast('Kunde inte kopiera länkar', 'error');
            });
        }

        // ----------------------------------------------------------------------
        // TEMA, TOASTS, PWA
        // ----------------------------------------------------------------------

        function setTheme(theme) {
            document.body.setAttribute('data-theme', theme);
            localStorage.setItem('app_theme', theme);
            themeToggle.checked = (theme === 'dark');
            const color = theme === 'dark' ? '#111827' : '#f8fafc'; 
            if (metaThemeColor) {
                metaThemeColor.setAttribute('content', color);
            }
        }

        function checkTheme() {
            const savedTheme = localStorage.getItem('app_theme');
            if (savedTheme) {
                setTheme(savedTheme);
            } else {
                const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
                setTheme(prefersDark ? 'dark' : 'light');
            }
        }
        
        function showToast(message, type = 'info') {
            const container = document.getElementById('toast-container');
            if (!container) return;
            const toast = document.createElement('div');
            toast.className = `toast ${type}`;
            let icon = 'info';
            if (type === 'success') icon = 'check_circle';
            if (type === 'error') icon = 'error';
            toast.innerHTML = `<span class="icon-span toast-icon">${icon}</span> ${message}`;
            container.appendChild(toast);
            setTimeout(() => {
                toast.classList.add('exiting');
                toast.addEventListener('animationend', () => {
                    toast.remove();
                });
            }, 3000);
        }
        
        window.addEventListener('beforeinstallprompt', (e) => {
            e.preventDefault(); 
            deferredInstallPrompt = e;
            pwaInstallBtn.style.display = 'inline-flex';
        });
        
        async function handlePwaInstall() {
            if (deferredInstallPrompt) {
                deferredInstallPrompt.prompt();
                const { outcome } = await deferredInstallPrompt.userChoice;
                if (outcome === 'accepted') {
                    pwaInstallBtn.style.display = 'none';
                }
                deferredInstallPrompt = null;
            }
        }

        // ----------------------------------------------------------------------
        // APP-MENY & EXPORT
        // ----------------------------------------------------------------------

        function openAppMenu() {
            appMenuModal.style.display = 'flex';
            appMenuOverlay.style.display = 'block';
            appMenuModal.classList.remove('closing');
            appMenuOverlay.classList.remove('closing');
        }
        
        function closeAppMenu() {
            appMenuModal.classList.add('closing');
            appMenuOverlay.classList.add('closing');
            setTimeout(() => {
                appMenuModal.style.display = 'none';
                appMenuOverlay.style.display = 'none';
            }, 200);
        }

        function downloadFile(content, fileName, contentType) {
            const a = document.createElement('a');
            const file = new Blob([content], { type: contentType });
            a.href = URL.createObjectURL(file);
            a.download = fileName;
            a.click();
            URL.revokeObjectURL(a.href);
        }

        function exportToJSON() {
            const dataStr = JSON.stringify(inventory, null, 2);
            downloadFile('lager_export.json', dataStr, 'application/json');
            showToast('Lager exporterat som JSON', 'success');
        }

        function exportToCSV() {
            if (inventory.length === 0) {
                showToast('Lagret är tomt, inget att exportera', 'info');
                return;
            }
            
            const headers = Object.keys(inventory[0]).join(',');
            const rows = inventory.map(item => {
                return Object.values(item).map(value => {
                    let strValue = String(value || '');
                    if (strValue.includes(',')) {
                        strValue = `"${strValue}"`;
                    }
                    return strValue;
                }).join(',');
            });
            
            const csvContent = [headers, ...rows].join('\n');
            downloadFile('lager_export.csv', csvContent, 'text/csv;charset=utf-8;');
            showToast('Lager exporterat som CSV', 'success');
        }


        // ----------------------------------------------------------------------
        // MODAL-HANTERING (ÄNDRAD)
        // ----------------------------------------------------------------------
        
        /**
         * Öppnar en modal baserat på ID.
         * @param {string} modalId ID på modal-elementet som ska öppnas.
         */
        function openModal(modalId) {
            const modal = document.getElementById(modalId);
            if (!modal) return;

            // --- NYTT: Lås bakgrunds-scroll ---
            document.body.style.overflow = 'hidden';
            
            modal.style.display = 'flex';
            // En liten fördröjning så att CSS-animationen hinner starta
            setTimeout(() => {
                modal.classList.add('open');
            }, 10); 

            const firstInput = modal.querySelector('input[type="text"], input[type="number"], select');
            if (firstInput) {
                setTimeout(() => firstInput.focus(), 100); // Liten fördröjning för animation
            }
        }

        /**
         * Stänger en modal baserat på ID eller element.
         * @param {string | HTMLElement} modalIdentifier ID eller själva modal-elementet.
         */
        function closeModal(modalIdentifier) {
            const modal = (typeof modalIdentifier === 'string')
                ? document.getElementById(modalIdentifier)
                : (modalIdentifier.closest ? modalIdentifier.closest('.modal') : null);

            if (!modal || !modal.classList.contains('open')) return;
            
            // --- NYTT: Lås upp bakgrunds-scroll ---
            document.body.style.overflow = '';
            
            modal.classList.remove('open');
            
            // Lyssna efter att animationen är klar innan display: none
            const onAnimationEnd = () => {
                if (!modal.classList.contains('open')) {
                    modal.style.display = 'none';
                }
                modal.removeEventListener('animationend', onAnimationEnd);
            };
            
            modal.addEventListener('animationend', onAnimationEnd);

            // Fallback om animationend-eventet av nån anledning inte körs
            setTimeout(() => {
                 if (!modal.classList.contains('open')) {
                    modal.style.display = 'none';
                }
            }, 300); // 300ms matchar CSS-animationen
        }
        
        // ----------------------------------------------------------------------
        // GRÄNSSNITT OCH HUVUDFUNKTIONER (UPPDATERADE)
        // ----------------------------------------------------------------------
        
        // --- POPOVER-LOGIK ---
        function openRowActionPopover(event) {
            event.stopPropagation();
            const buttonEl = event.currentTarget;
            const itemId = parseInt(buttonEl.dataset.id, 10);
            
            if (isPopoverOpen && currentPopoverItemId === itemId) {
                closeRowActionPopover();
                return;
            }
            
            const item = inventory.find(i => i.id === itemId);
            if (!item) return;

            const trodoLink = generateTrodoLink(item.service_filter);
            const aeroMLink = generateAeroMLink(item.service_filter);
            const thansenLink = generateThansenLink(item.service_filter);
            const egenLink = item.link;
            
            let html = '';
            const linkIcon = "open_in_new"; 
            
            if (trodoLink) html += `<button class="btn-popover link-btn" data-action="open-link" data-url="${trodoLink}"><span class="icon-span">${linkIcon}</span>Trodo</button>`;
            if (aeroMLink) html += `<button class="btn-popover link-btn" data-action="open-link" data-url="${aeroMLink}"><span class="icon-span">${linkIcon}</span>AeroMotors</button>`;
            if (thansenLink) html += `<button class="btn-popover link-btn" data-action="open-link" data-url="${thansenLink}"><span class="icon-span">${linkIcon}</span>Thansen</button>`;
            if (egenLink) html += `<button class="btn-popover link-btn" data-action="open-link" data-url="${egenLink}"><span class="icon-span">link</span>Egen Länk</button>`;
            
            if (html !== '') {
                html += '<hr style="border: none; border-top: 1px solid var(--border-color); margin: 6px 0;">';
            }

            html += `<button class="btn-popover edit-btn" data-action="edit" data-id="${itemId}"><span class="icon-span">edit</span>Ändra</button>`;
            html += `<button class="btn-popover delete-btn" data-action="delete" data-id="${itemId}"><span class="icon-span">delete</span>Ta bort</button>`;
            
            popoverContent.innerHTML = html;
            
            const btnRect = buttonEl.getBoundingClientRect();
            rowActionPopover.style.display = 'block';
            const popoverRect = rowActionPopover.getBoundingClientRect();
            
            let top = btnRect.top + window.scrollY - (popoverRect.height / 2) + (btnRect.height / 2);
            let left = btnRect.left + window.scrollX - popoverRect.width - 10;

            if (left < 10) {
                left = btnRect.right + window.scrollX + 10;
            }
            if (top < (window.scrollY + 10)) {
                top = window.scrollY + 10;
            }
            if (top + popoverRect.height > (window.scrollY + window.innerHeight - 10)) {
                top = window.scrollY + window.innerHeight - popoverRect.height - 10;
            }
            
            rowActionPopover.style.top = `${top}px`;
            rowActionPopover.style.left = `${left}px`;
            
            isPopoverOpen = true;
            currentPopoverItemId = itemId;
            
            popoverContent.querySelectorAll('button').forEach(btn => btn.addEventListener('click', handlePopoverAction));
        }

        function closeRowActionPopover() {
            if (!isPopoverOpen) return;
            rowActionPopover.style.display = 'none';
            popoverContent.innerHTML = '';
            isPopoverOpen = false;
            currentPopoverItemId = null;
        }

        function handlePopoverAction(event) {
            event.stopPropagation();
            const button = event.currentTarget;
            const action = button.dataset.action;
            const url = button.dataset.url;
            const id = parseInt(button.dataset.id, 10);
            
            closeRowActionPopover();
            
            switch (action) {
                case 'open-link':
                    window.open(url, '_blank');
                    break;
                case 'edit':
                    handleEdit(id);
                    break;
                case 'delete':
                    handleDelete(id);
                    break;
            }
        }
        
        function bindRowActionButtons() {
            document.querySelectorAll('.row-action-btn').forEach(btn => {
                const newBtn = btn.cloneNode(true);
                btn.parentNode.replaceChild(newBtn, btn);
                newBtn.addEventListener('click', openRowActionPopover);
            });
        }
        
        // --- SLUT POPOVER-LOGIK ---

        function renderDashboard(currentInventory) {
            const inStock = currentInventory.filter(item => item.quantity > 0);
            const totalUnits = inStock.reduce((sum, item) => sum + item.quantity, 0);
            const inStockItems = inStock.length;
            const outOfStockItems = currentInventory.length - inStockItems;

            statTotalItems.textContent = inStockItems;
            statTotalUnits.textContent = totalUnits;
            statOutOfStock.textContent = outOfStockItems;
        }
        
        function renderRecentItems(currentInventory) {
            const sortedItems = [...currentInventory].sort((a, b) => (b.lastUpdated || b.id) - (a.lastUpdated || a.id));
            const recent = sortedItems.slice(0, 5);
            
            if (recent.length === 0) {
                recentItemsList.innerHTML = '';
                recentItemsEmpty.style.display = 'block';
            } else {
                recentItemsEmpty.style.display = 'none';
                let html = '';
                recent.forEach(item => {
                    html += `<a href="#" class="recent-item" data-id="${item.id}">
                                <span class="recent-item-category">${item.category || 'Övrigt'}</span>
                                <strong>${item.service_filter}</strong>
                                <span>${item.name}</span>
                             </a>`;
                });
                recentItemsList.innerHTML = html;
            }
        }
        
        function renderTopValueItems(currentInventory) {
            const inStock = currentInventory.filter(item => item.quantity > 0);
            
            const valuedItems = inStock.map(item => ({
                ...item,
                totalValue: (item.price || 0) * (item.quantity || 0)
            })).sort((a, b) => b.totalValue - a.totalValue);
            
            const top5 = valuedItems.slice(0, 5);
            
            if (top5.length === 0) {
                topValueList.innerHTML = '';
                topValueEmpty.style.display = 'block';
            } else {
                topValueEmpty.style.display = 'none';
                let html = '';
                top5.forEach(item => {
                    html += `<a href="#" class="top-value-item" data-id="${item.id}">
                                <span class="top-value-badge">${formatPrice(item.totalValue)}</span>
                                <strong>${item.service_filter}</strong>
                                <span>${item.name} (Antal: ${item.quantity})</span>
                             </a>`;
                });
                topValueList.innerHTML = html;
            }
        }
        
        function updateCategoryBadges(currentInventory) {
            const serviceItems = currentInventory.filter(i => i.category === 'Service' && i.quantity > 0);
            const motorItems = currentInventory.filter(i => (i.category === 'Motor/Chassi' || i.category === 'Övrigt' || !i.category) && i.quantity > 0);
            const andraItems = currentInventory.filter(i => i.category === 'Andra Märken' && i.quantity > 0);
            const slutItems = currentInventory.filter(i => i.quantity <= 0);

            badges.service.textContent = `${serviceItems.length} st`;
            badges.motorChassi.textContent = `${motorItems.length} st`;
            badges.andraMarken.textContent = `${andraItems.length} st`;
            badges.slutILager.textContent = `${slutItems.length} st`;
        }

        function escapeHTML(str) {
            if (typeof str !== 'string') return '';
            return str.replace(/[&<>"']/g, function(match) {
                return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[match];
            });
        }

        function parseNotes(notesText) {
            if (!notesText) return '';
            const plateRegex = /\[([A-ZÅÄÖ0-9]{1,3}[\s]?[A-ZÅÄÖ0-9]{1,3})\]/gi;
            const parts = notesText.split(plateRegex);
            let html = '';
            for (let i = 0; i < parts.length; i++) {
                if (i % 2 === 1) {
                    const plateContent = parts[i].toUpperCase();
                    html += `<span class="plate-tag"><span class="plate-eu-s">S</span><span class="plate-text">${escapeHTML(plateContent)}</span></span>`;
                } else if (parts[i]) {
                    html += escapeHTML(parts[i]);
                }
            }
            return html;
        }

        function extractPlatesHTML(notesText) {
            if (!notesText) return '';
            const plateRegex = /\[([A-ZÅÄÖ0-9]{1,3}[\s]?[A-ZÅÄÖ0-9]{1,3})\]/gi;
            let matches;
            let html = '';
            while ((matches = plateRegex.exec(notesText)) !== null) {
                const plateContent = matches[1].toUpperCase();
                html += `<span class="plate-tag"><span class="plate-eu-s">S</span><span class="plate-text">${escapeHTML(plateContent)}</span></span>`;
            }
            return html;
        }
        
        function guessCategoryFromName(name) {
            const lowerName = name.toLowerCase();
            const serviceWords = ['filter', 'olja', 'tändstift', 'bromsbelägg', 'bromsskiva', 'olja', 'glykol', 'spolarvätska', 'torkarblad', 'bromsok', 'glödstift'];
            const motorWords = ['länkarm', 'bussning', 'stötdämpare', 'fjäder', 'motorfäste', 'avgassystem', 'kamrem', 'vattenpump', 'drivknut', 'hjullager', 'styrled', 'spindel', 'krängningshämmare'];
            
            if (serviceWords.some(word => lowerName.includes(word))) {
                return 'Service';
            }
            if (motorWords.some(word => lowerName.includes(word))) {
                return 'Motor/Chassi';
            }
            return '';
        }

        // --- SKAPA HTML FÖR RAD (DESKTOP) ---
        function createInventoryRow(item, isOutOfStock) {
            const row = document.createElement('div');
            row.className = 'artikel-rad';
            row.setAttribute('data-id', item.id);
            row.onclick = (e) => handleRowSelect(item.id, e.currentTarget);
            if (selectedItemId === item.id) {
                row.classList.add('selected');
            }

            const statusClass = item.quantity > 0 ? 'i-lager' : 'slut';
            const statusText = item.quantity > 0 ? 'I lager' : 'Slut';
            const formattedNotes = parseNotes(item.notes || '');
            const safeServiceFilter = escapeHTML(item.service_filter).replace(/'/g, "\\'");
            const safeName = escapeHTML(item.name).replace(/'/g, "\\'");

            const trodoLink = generateTrodoLink(item.service_filter);
            const aeroMLink = generateAeroMLink(item.service_filter);
            const egenLink = item.link;
            const primarySearchLink = trodoLink || aeroMLink || egenLink;
            const primarySearchText = trodoLink ? 'Trodo' : (aeroMLink ? 'AeroMotors' : (egenLink ? 'Egen Länk' : ''));

            row.innerHTML = `
                <span class="cell-copy-wrapper">
                    ${primarySearchLink ? `
                        <button class="search-btn" onclick="window.open('${primarySearchLink}', '_blank'); event.stopPropagation();" title="Sök på ${primarySearchText}">
                            <svg viewBox="0 0 16 16" xmlns="http://www.w3.org/2000/svg"><path d="M11.742 10.344a6.5 6.5 0 1 0-1.397 1.398h-.001c.03.04.062.078.098.115l3.85 3.85a1 1 0 0 0 1.415-1.414l-3.85-3.85a1.007 1.007 0 0 0-.115-.1zM12 6.5a5.5 5.5 0 1 1-11 0 5.5 5.5 0 0 1 11 0z"/></svg>
                        </button>
                    ` : ''}
                    <button class="copy-btn" onclick="copyToClipboard(this, '${safeServiceFilter}', 'Artikelnummer'); event.stopPropagation();" title="Kopiera Artikelnummer">&#x1F4CB;</button>
                    <span class="cell-copy-text">${escapeHTML(item.service_filter)}</span>
                </span>
                <span title="${safeName}">${escapeHTML(item.name)}</span>
                <span>${formatPrice(item.price)}</span>
                <div class="quantity-cell">
                    <button class="qty-btn" onclick="adjustQuantity(${item.id}, -1, this); event.stopPropagation();">-</button>
                    <span>${item.quantity}</span>
                    <button class="qty-btn" onclick="adjustQuantity(${item.id}, 1, this); event.stopPropagation();">+</button>
                </div>
                <span style="display: flex; align-items: center;">
                    <span class="${statusClass}">${statusText}</span>
                </span>
                <span class="notes-cell" title="${escapeHTML(item.notes || '')}">${formattedNotes}</span>
                <div class="action-buttons-cell">
                    <button class="btn-secondary row-action-btn" data-id="${item.id}" title="Åtgärder" onclick="event.stopPropagation();">
                        <span class="icon-span">more_vert</span>
                    </button>
                </div>
            `;
            return row;
        }
        
        // --- SKAPA HTML FÖR KORT (MOBIL) ---
        function createInventoryCard(item) {
            const card = document.createElement('div');
            card.className = 'artikel-kort';
            card.setAttribute('data-id', item.id);
            card.onclick = (e) => handleRowSelect(item.id, e.currentTarget);
            if (selectedItemId === item.id) {
                card.classList.add('selected');
            }

            const statusClass = item.quantity > 0 ? 'i-lager' : 'slut';
            if (statusClass === 'slut') {
                  card.classList.add('status-slut');
            } else {
                  // Lägg till en klass för kategorin, t.ex. "category-service"
                  // Ersätter / med - för att få en giltig klass
                  const categoryClass = (item.category || 'ovrigt').toLowerCase().replace(/[\s\/]/g, '-');
                  card.classList.add('category-' + categoryClass);
            }
            const statusText = item.quantity > 0 ? 'I lager' : 'Slut';
            const formattedNotes = parseNotes(item.notes || '');
            const safeServiceFilter = escapeHTML(item.service_filter).replace(/'/g, "\\'");
            
            const trodoLink = generateTrodoLink(item.service_filter);
            
            card.innerHTML = `
                <div class="artikel-kort-header">
                    <div class="artikel-kort-header-text">
                        <div class="artikel-kort-artnr-wrapper">
                            <span class="artikel-kort-artnr" title="${safeServiceFilter}">${escapeHTML(item.service_filter)}</span>
                        </div>
                        <div class="artikel-kort-name" title="${escapeHTML(item.name)}">${escapeHTML(item.name)}</div>
                    </div>
                    
                    <div class="artikel-kort-actions">
                        <button class="copy-btn" onclick="copyToClipboard(this, '${safeServiceFilter}', 'Artikelnummer'); event.stopPropagation();" title="Kopiera Artikelnummer">&#x1F4CB;</button>
                        
                        ${trodoLink ? `
                            <button class="search-btn" onclick="window.open('${trodoLink}', '_blank'); event.stopPropagation();" title="Sök på Trodo">
                                <svg viewBox="0 0 16 16" xmlns="http://www.w3.org/2000/svg"><path d="M11.742 10.344a6.5 6.5 0 1 0-1.397 1.398h-.001c.03.04.062.078.098.115l3.85 3.85a1 1 0 0 0 1.415-1.414l-3.85-3.85a1.007 1.007 0 0 0-.115-.1zM12 6.5a5.5 5.5 0 1 1-11 0 5.5 5.5 0 0 1 11 0z"/></svg>
                            </button>
                        ` : ''}
                        
                        <button class="btn-secondary row-action-btn" data-id="${item.id}" title="Åtgärder" onclick="event.stopPropagation();">
                            <span class="icon-span">more_vert</span>
                        </button>
                    </div>
                    </div>
                <div class="artikel-kort-body">
                    <div>
                        <div class="artikel-kort-label">Pris</div>
                        <div class="artikel-kort-price">${formatPrice(item.price)}</div>
                    </div>
                    <div class="quantity-cell">
                        <button class="qty-btn" onclick="adjustQuantity(${item.id}, -1, this); event.stopPropagation();">-</button>
                        <span>${item.quantity}</span>
                        <button class="qty-btn" onclick="adjustQuantity(${item.id}, 1, this); event.stopPropagation();">+</button>
                    </div>
                    <div>
                        <div class="artikel-kort-label">Status</div>
                        <span class="${statusClass}" style="font-weight: 600;">${statusText}</span>
                    </div>
                </div>
                ${formattedNotes ? `
                <div class="artikel-kort-footer">
                    <span class="notes-cell" title="${escapeHTML(item.notes || '')}">${formattedNotes}</span>
                </div>
                ` : ''}
            `;
            return card;
        }

        // --- KOPIERA OCH ERSÄTT HELA renderInventory-FUNKTIONEN MED DETTA ---

        // --- KOPIERA OCH ERSÄTT HELA renderInventory-FUNKTIONEN MED DETTA ---

        // --- KOPIERA OCH ERSÄTT HELA FUNKTIONEN ---

        function renderInventory(data, searchTerm = '') {
            closeRowActionPopover(); 
            
            // Rensa listor
            serviceArtiklarLista.innerHTML = '';
            motorChassiArtiklarLista.innerHTML = '';
            andraMarkenArtiklarLista.innerHTML = '';
            slutILagerLista.innerHTML = '';
            
            serviceArtiklarKortLista.innerHTML = '';
            motorChassiArtiklarKortLista.innerHTML = '';
            andraMarkenArtiklarKortLista.innerHTML = '';
            slutILagerKortLista.innerHTML = '';
            
            // Hämta elementen för sektionerna
            const serviceWrapper = document.getElementById('service-artiklar-wrapper');
            const motorWrapper = document.getElementById('motor-chassi-artiklar-wrapper');
            const andraWrapper = document.getElementById('andra-marken-artiklar-wrapper');
            const serviceTitle = document.getElementById('service-artiklar-titel');
            const motorTitle = document.getElementById('motor-chassi-artiklar-titel');
            const andraTitle = document.getElementById('andra-marken-artiklar-titel');
            // (Lade till saknade referenser från din kod)
            const slutILagerSektion = document.getElementById('slut-i-lager-wrapper');
            const slutILagerTitel = document.getElementById('slut-i-lager-titel');
        
            // Definiera artikellistorna
            const iLager = data.filter(item => item.quantity > 0);
            let slutILager = data.filter(item => item.quantity <= 0); // Använd let för att kunna sortera
        
            const serviceArtiklar = iLager.filter(item => item.category === 'Service');
            const motorChassiArtiklar = iLager.filter(item => item.category === 'Motor/Chassi' || item.category === 'Övrigt' || !item.category);
            const andraMarkenArtiklar = iLager.filter(item => item.category === 'Andra Märken');
        
            // Sortera slut-i-lager-listan efter senast uppdaterad (nyast först)
            slutILager.sort((a, b) => (b.lastUpdated || b.id) - (a.lastUpdated || a.id));
        
            // Fyll listorna med de filtrerade artiklarna
            serviceArtiklar.forEach(item => {
                serviceArtiklarLista.appendChild(createInventoryRow(item, false));
                serviceArtiklarKortLista.appendChild(createInventoryCard(item));
            });
            motorChassiArtiklar.forEach(item => {
                motorChassiArtiklarLista.appendChild(createInventoryRow(item, false));
                motorChassiArtiklarKortLista.appendChild(createInventoryCard(item));
            });
            andraMarkenArtiklar.forEach(item => {
                andraMarkenArtiklarLista.appendChild(createInventoryRow(item, false));
                andraMarkenArtiklarKortLista.appendChild(createInventoryCard(item));
            });
            slutILager.forEach(item => {
                slutILagerLista.appendChild(createInventoryRow(item, true));
                slutILagerKortLista.appendChild(createInventoryCard(item));
            });
        
            // === NY LOGIK FÖR ATT HANTERA TOMMA LÄGEN OCH SÖKNINGAR ===
            const isSearchActive = searchTerm.length > 0;
            
            // Hämta vår nya "tom sökning"-platshållare
            const searchEmptyState = document.getElementById('search-empty-state');
            const searchEmptyStateText = document.getElementById('search-empty-state-text');
            
            // Kontrollera om sökningen gav noll träffar totalt
            const allListsEmptyFromSearch = data.length === 0 && isSearchActive;
            
            // Kontrollera om hela lagret är tomt (när ingen sökning är aktiv)
            const isTotalInventoryEmpty = inventory.length === 0 && !isSearchActive;
        
            // Dölj båda tomma-läges-elementen som standard
            fullEmptyState.style.display = 'none'; 
            if (searchEmptyState) searchEmptyState.style.display = 'none';
        
            if (allListsEmptyFromSearch) {
                // FALL 1: SÖKNING GAV NOLL TRÄFFAR TOTALT (Din bild)
                // Visa den nya, kompakta "search-empty-state"
                if (searchEmptyState) {
                    if (searchEmptyStateText) { 
                        searchEmptyStateText.textContent = `Din sökning på "${escapeHTML(searchTerm)}" gav inga resultat.`;
                    }
                    searchEmptyState.style.display = 'flex';
                }
        
                // Dölj alla kategori-sektioner
                serviceTitle.style.display = 'none'; serviceWrapper.style.display = 'none';
                motorTitle.style.display = 'none'; motorWrapper.style.display = 'none';
                andraTitle.style.display = 'none'; andraWrapper.style.display = 'none';
                slutILagerTitel.style.display = 'none'; slutILagerSektion.style.display = 'none';
            
            } else if (isTotalInventoryEmpty) {
                // FALL 2: HELA LAGRET ÄR TOMT (Utan aktiv sökning)
                // Visa den stora "full-empty-state"
                fullEmptyState.style.display = 'flex';
                fullEmptyState.querySelector('h4').textContent = 'Ditt lager är tomt';
                fullEmptyState.querySelector('p').textContent = 'Börja med att lägga till din första artikel.';
                fullEmptyState.querySelector('#empty-state-add-btn').style.display = 'inline-flex';
        
                // Dölj alla kategori-sektioner
                serviceTitle.style.display = 'none'; serviceWrapper.style.display = 'none';
                motorTitle.style.display = 'none'; motorWrapper.style.display = 'none';
                andraTitle.style.display = 'none'; andraWrapper.style.display = 'none';
                slutILagerTitel.style.display = 'none'; slutILagerSektion.style.display = 'none';
            
            } else {
                // FALL 3: STANDARD-VY (Antingen ingen sökning, eller en sökning som gav träffar)
                
                // Dölj båda "tom"-meddelandena
                fullEmptyState.style.display = 'none'; 
                if (searchEmptyState) searchEmptyState.style.display = 'none';
        
                // === LOGIK FÖR ATT ÖPPNA/STÄNGA PANELER ===
                
                // 1. Återställ alla paneler till sitt sparade (eller stängda) läge FÖRST
                //    om ingen sökning är aktiv.
                if (!isSearchActive) {
                    // Denna funktion läser localStorage och återställer .collapsed-klasser
                    initializeCollapseState(); 
                }
        
                // 2. Bestäm vilka paneler som ska visas baserat på filter
                const isServiceCategoryActive = (currentFilter === 'Alla' || currentFilter === 'Service');
                const isMotorCategoryActive = (currentFilter === 'Alla' || currentFilter === 'Motor/Chassi');
                const isAndraCategoryActive = (currentFilter === 'Alla' || currentFilter === 'Andra Märken');
                const isSlutCategoryActive = (currentFilter === 'Slut');
        
                // 3. Loopa igenom och tillämpa logik
                // (Säkerställer att alla referenser finns)
                const sections = [
                    { title: serviceTitle, wrapper: serviceWrapper, articles: serviceArtiklar, active: isServiceCategoryActive, emptyState: emptyStates.service, listDesktop: serviceArtiklarLista, listMobile: serviceArtiklarKortLista },
                    { title: motorTitle, wrapper: motorWrapper, articles: motorChassiArtiklar, active: isMotorCategoryActive, emptyState: emptyStates.motorChassi, listDesktop: motorChassiArtiklarLista, listMobile: motorChassiArtiklarKortLista },
                    { title: andraTitle, wrapper: andraWrapper, articles: andraMarkenArtiklar, active: isAndraCategoryActive, emptyState: emptyStates.andraMarken, listDesktop: andraMarkenArtiklarLista, listMobile: andraMarkenArtiklarKortLista },
                    { title: slutILagerTitel, wrapper: slutILagerSektion, articles: slutILager, active: isSlutCategoryActive, emptyState: emptyStates.slutILager, listDesktop: slutILagerLista, listMobile: slutILagerKortLista }
                ];
        
                sections.forEach(section => {
                    // Säkerhetskoll om en HTML-referens saknas
                    if (!section.title || !section.wrapper) return; 
                    
                    const hasResults = section.articles.length > 0;
                    
                    if (isSearchActive) {
                        // --- SÖKNING ÄR AKTIV ---
                        if (hasResults && section.active) {
                            // Sökning har träffar: Visa OCH tvinga panelen att öppnas
                            section.title.style.display = 'flex';
                            section.wrapper.style.display = 'block';
                            section.title.setAttribute('data-state', 'open');
                            section.wrapper.classList.remove('collapsed');
                        } else {
                            // Sökning har inga träffar: Dölj panelen
                            section.title.style.display = 'none';
                            section.wrapper.style.display = 'none';
                        }
                    } else {
                        // --- INGEN SÖKNING (STANDARD-VY) ---
                        // Visa/dölj baserat på filter
                        section.title.style.display = section.active ? 'flex' : 'none';
                        section.wrapper.style.display = section.active ? 'block' : 'none';
                        
                        // Visa "tom"-rutan inuti om panelen är tom
                        if (section.emptyState) {
                            section.emptyState.style.display = section.active && !hasResults ? 'flex' : 'none';
                        }
                    }
        
                    // Hantera "Slut i Lager"-filtret (specialfall)
                    if (currentFilter === 'Slut') {
                        if (section.title.id !== 'slut-i-lager-titel') {
                            section.title.style.display = 'none';
                            section.wrapper.style.display = 'none';
                        }
                    } else {
                        if (section.title.id === 'slut-i-lager-titel') {
                            section.title.style.display = 'none';
                            section.wrapper.style.display = 'none';
                        }
                    }
        
                    // Dölj listorna om de är tomma (så att "Tom-stat" syns när man inte söker)
                    if(section.listDesktop) section.listDesktop.style.display = hasResults ? 'block' : 'none';
                    if(section.listMobile) section.listMobile.style.display = hasResults ? '' : 'none';
                });
        
            } // Slut på FALL 3
        
            bindRowActionButtons();
        }
        // --- SLUT PÅ renderInventory-FUNKTIONEN ---

        function calculateRelevance(item, searchWords) {
            let score = 0; 
            const serviceFilter = (item.service_filter || '').toLowerCase().replace(/\s/g, ''); 
            const name = (item.name || '').toLowerCase(); 
            const notes = (item.notes || '').toLowerCase(); 
            const category = (item.category || '').toLowerCase();
            
            searchWords.forEach(word => {
                const cleanWord = word.replace(/[^a-z0-9]/g, ''); 
                if (serviceFilter.includes(cleanWord)) { score += 5; } 
                if (name.includes(cleanWord)) { score += 3; } 
                if (category.includes(cleanWord)) { score += 2; } 
                if (notes.includes(cleanWord)) { score += 1; } 
                if (serviceFilter === cleanWord || name === cleanWord) { score += 5; }
            }); 
            return score;
        }

        function renderSearchDropdown(searchTerm, results) {
            if (searchTerm.length < 1 || results.length === 0) {
                hideSearchDropdowns();
                return;
            }

            let html = '';
            results.slice(0, 10).forEach(item => {
                const platesHTML = extractPlatesHTML(item.notes || '');
                html += `<a href="#" class="search-result-item" data-id="${item.id}">
                            <div class="search-result-content">
                                <div class="search-result-text">
                                    <strong>${escapeHTML(item.service_filter)}</strong>
                                    <span>${escapeHTML(item.name)}</span>
                                </div>
                                <div class="search-result-plates">
                                    ${platesHTML}
                                </div>
                            </div>
                         </a>`;
            });

            desktopSearchResults.innerHTML = html;
            mobileSearchResults.innerHTML = html;
            desktopSearchResults.style.display = 'block';
            mobileSearchResults.style.display = 'block';

            addDropdownListeners();
        }

        function clearAndHideSearch() {
            desktopSearchInput.value = '';
            mobileSearchInput.value = '';
            
            desktopSearchResults.innerHTML = '';
            mobileSearchResults.innerHTML = '';
            hideSearchDropdowns();
            
            desktopClearSearchBtn.style.display = 'none';
            mobileClearSearchBtn.style.display = 'none';
            
            applySearchFilter('');
        }

        function addDropdownListeners() {
            document.querySelectorAll('.search-result-item').forEach(item => {
                item.replaceWith(item.cloneNode(true));
            });
            
            document.querySelectorAll('.search-result-item').forEach(item => {
                item.addEventListener('click', (e) => {
                    e.preventDefault();
                    isNavigatingViaSearch = true; 
                    
                    const itemId = e.currentTarget.getAttribute('data-id');
                    clearAndHideSearch();
                    scrollToAndHighlight(itemId);
                    
                    setTimeout(() => {
                        isNavigatingViaSearch = false;
                    }, 100);
                });
            });
        }
        
        function sortAndRender(searchTermOverride) {
            let searchTerm = (searchTermOverride !== undefined ? searchTermOverride : desktopSearchInput.value).toLowerCase().trim();
            let processedInventory = [...inventory];
            let syntaxFilterUsed = false;
            let generalSearchTerm = '';

            const syntaxMatches = searchTerm.match(/(k:|kategori:|p>|p<|q=|q>|q<)(\S+)/g) || [];
            
            if (syntaxMatches.length > 0) {
                syntaxFilterUsed = true;
                generalSearchTerm = searchTerm.replace(/(k:|kategori:|p>|p<|q=|q>|q<)(\S+)/g, '').trim();
                
                syntaxMatches.forEach(match => {
                    if (match.startsWith('k:') || match.startsWith('kategori:')) {
                        const filterWord = match.split(':')[1];
                        let foundFilter = null;
                        if (filterWord.includes('service')) foundFilter = 'Service';
                        else if (filterWord.includes('motor')) foundFilter = 'Motor/Chassi';
                        else if (filterWord.includes('andra')) foundFilter = 'Andra Märken';
                        else if (filterWord.includes('slut')) foundFilter = 'Slut';
                        else if (filterWord.includes('alla')) foundFilter = 'Alla';
                        if (foundFilter) currentFilter = foundFilter;
                    } else if (match.startsWith('p>')) {
                        const value = parseFloat(match.substring(2));
                        if (!isNaN(value)) processedInventory = processedInventory.filter(i => i.price > value);
                    } else if (match.startsWith('p<')) {
                        const value = parseFloat(match.substring(2));
                        if (!isNaN(value)) processedInventory = processedInventory.filter(i => i.price < value);
                    } else if (match.startsWith('q=')) {
                        const value = parseInt(match.substring(2), 10);
                        if (!isNaN(value)) processedInventory = processedInventory.filter(i => i.quantity === value);
                        if (value === 0) currentFilter = 'Slut';
                    } else if (match.startsWith('q>')) {
                        const value = parseInt(match.substring(2), 10);
                        if (!isNaN(value)) processedInventory = processedInventory.filter(i => i.quantity > value);
                    } else if (match.startsWith('q<')) {
                        const value = parseInt(match.substring(2), 10);
                        if (!isNaN(value)) processedInventory = processedInventory.filter(i => i.quantity < value);
                    }
                });
            } else {
                generalSearchTerm = searchTerm;
            }

            categoryFilterBar.querySelectorAll('.btn-secondary').forEach(btn => {
                btn.classList.toggle('active', btn.getAttribute('data-filter') === currentFilter);
            });
            
            if (currentFilter !== 'Alla') {
                toolbarFilterBadge.textContent = currentFilter.toUpperCase();
                toolbarFilterBadge.style.display = 'inline-flex';
                if (currentFilter === 'Slut') {
                    toolbarFilterBadge.classList.add('filter-slut');
                } else {
                    toolbarFilterBadge.classList.remove('filter-slut');
                }
            } else {
                toolbarFilterBadge.style.display = 'none';
                toolbarFilterBadge.classList.remove('filter-slut');
            }

            if (currentFilter !== 'Alla' && !syntaxFilterUsed) {
                if (currentFilter === 'Slut') {
                    processedInventory = processedInventory.filter(item => item.quantity <= 0);
                } else {
                    processedInventory = processedInventory.filter(item => item.quantity > 0 && 
                        (item.category === currentFilter || (currentFilter === 'Motor/Chassi' && (item.category === 'Övrigt' || !item.category)))
                    );
                }
            }

            let dropdownResults = [];
            if (generalSearchTerm !== '') {
                const searchWords = generalSearchTerm.split(/\s+/).filter(word => word.length > 1 && !stopWords.includes(word));
                if (searchWords.length === 0 && generalSearchTerm.length > 0) { searchWords.push(generalSearchTerm); }

                processedInventory = processedInventory
                    .map(item => ({ ...item, relevanceScore: calculateRelevance(item, searchWords) }))
                    .filter(item => item.relevanceScore > 0)
                    .sort((a, b) => b.relevanceScore - a.relevanceScore);
                
                if (!syntaxFilterUsed) {
                    dropdownResults = [...processedInventory];
                }
            } 
            else {
                processedInventory.sort((a, b) => {
                    let aVal = a[currentSort.column]; let bVal = b[currentSort.column];
                    if (typeof aVal === 'string' && typeof bVal === 'string') {
                        return currentSort.direction === 'asc' ? aVal.localeCompare(bVal, 'sv') : bVal.localeCompare(aVal, 'sv');
                    } else {
                        return currentSort.direction === 'asc' ? (aVal || 0) - (bVal || 0) : (bVal || 0) - (aVal || 0);
                    }
                });
            }
            
            const resultsForDropdown = syntaxFilterUsed ? processedInventory : dropdownResults;
            renderSearchDropdown(generalSearchTerm, resultsForDropdown);

            renderInventory(processedInventory, generalSearchTerm);
          
            document.querySelectorAll('.header span[data-sort]').forEach(span => {
                span.classList.remove('active', 'asc', 'desc');
                const icon = span.querySelector('.sort-icon');
                if (icon) icon.textContent = ''; 
            });
            
            const activeHeader = document.querySelector(`.header span[data-sort="${currentSort.column}"]`);
            if (activeHeader) {
                activeHeader.classList.add('active', currentSort.direction);
                const icon = activeHeader.querySelector('.sort-icon');
                if (icon) {
                    if(generalSearchTerm === '') {
                        icon.textContent = currentSort.direction === 'asc' ? ' ▲' : ' ▼';
                    }
                }
            }
            
            localStorage.setItem('app_sort', JSON.stringify(currentSort));
            localStorage.setItem('app_filter', currentFilter);
        }

        function applySearchFilter(term) {
             if (isNavigatingViaSearch) return;
             clearTimeout(window.searchTimeout);
             window.searchTimeout = setTimeout(() => sortAndRender(term), 150);
        }
        
        async function saveInventoryItem(itemData) { const itemRef = doc(db, INVENTORY_COLLECTION, String(itemData.id)); await setDoc(itemRef, itemData); }
        async function deleteInventoryItem(itemId) { const itemRef = doc(db, INVENTORY_COLLECTION, String(itemId)); await deleteDoc(itemRef); }
        
        function setupRealtimeListener() {
            const q = query(collection(db, INVENTORY_COLLECTION), firestoreOrderBy("name"));
            
            onSnapshot(q, (querySnapshot) => {
                const tempInventory = [];
                querySnapshot.forEach((doc) => { tempInventory.push(doc.data()); });
                inventory = tempInventory;
                
                if (!currentSort.column) {
                    currentSort = { column: 'name', direction: 'asc' };
                }

                applySearchFilter(desktopSearchInput.value);
                renderDashboard(inventory); 
                updateCategoryBadges(inventory);
                renderRecentItems(inventory);
                renderTopValueItems(inventory);
                
                const now = new Date();
                updateSyncStatus('ok', `Synkroniserad ${now.toLocaleTimeString('sv-SE')}`);
                
                syncStatusElement.classList.add('flash');
                setTimeout(() => syncStatusElement.classList.remove('flash'), 1200);
                
                if (initialLoader) {
                    initialLoader.style.opacity = '0';
                    setTimeout(() => initialLoader.style.display = 'none', 300);
                }
                
            }, (error) => {
                console.error("Realtime listener error: ", error);
                updateSyncStatus('error', 'Synk-fel: Se konsolen');
                if (initialLoader) {
                    initialLoader.querySelector('p').textContent = 'Kunde inte ansluta...';
                }
            });
        }
        
        function loadPersistentState() {
            const savedSort = localStorage.getItem('app_sort');
            const savedFilter = localStorage.getItem('app_filter');
            
            if (savedSort) {
                currentSort = JSON.parse(savedSort);
            }
            if (savedFilter) {
                currentFilter = savedFilter;
                document.querySelectorAll('#category-filter-bar .btn-secondary').forEach(btn => {
                    btn.classList.toggle('active', btn.getAttribute('data-filter') === currentFilter);
                });
            }
        }

        function validateForm(form, isEdit = false) {
            let isValid = true;
            form.querySelectorAll('.has-error').forEach(el => el.classList.remove('has-error'));
            form.querySelectorAll('.form-warning').forEach(el => el.textContent = '');

            const requiredFields = form.querySelectorAll('[required]');
            
            requiredFields.forEach(field => {
                if (!field.value || field.value.trim() === '') {
                    isValid = false;
                    const wrapper = field.closest('.form-field-full, .form-field-half');
                    if (wrapper) {
                        wrapper.classList.add('has-error');
                        const warningEl = wrapper.querySelector('.form-warning');
                        if (warningEl) {
                            warningEl.textContent = 'Detta fält är obligatoriskt.';
                        }
                    }
                }
            });
            
            if (!isEdit) {
                const serviceFilterField = form.querySelector('#add_service_filter');
                const serviceFilter = (serviceFilterField.value || '').trim().toUpperCase();
                
                if (serviceFilter && inventory.some(item => item.service_filter === serviceFilter)) {
                    isValid = false;
                    const wrapper = serviceFilterField.closest('.form-field-full');
                    if (wrapper) {
                        wrapper.classList.add('has-error');
                        const warningEl = wrapper.querySelector('.form-warning');
                        if (warningEl) {
                            warningEl.textContent = `Artikeln ${serviceFilter} finns redan.`;
                        }
                    }
                }
            }
            
            if (!isValid) {
                const modalContent = form.closest('.modal-content');
                if (modalContent) {
                    modalContent.classList.add('shake');
                    setTimeout(() => modalContent.classList.remove('shake'), 500);
                }
            }
            
            return isValid;
        }
        
        function scrollToAndHighlight(itemId) {
            const element = document.querySelector(`.artikel-rad[data-id="${itemId}"], .artikel-kort[data-id="${itemId}"]`);
            
            if (element) {
                
                // --- NYTT: KONTROLLERA OM PANELEN ÄR STÄNGD ---
                const wrapper = element.closest('.lager-wrapper');
                if (wrapper && wrapper.classList.contains('collapsed')) {
                    // Den är stängd. Vi måste öppna den.
                    const wrapperId = wrapper.id; // t.ex. "service-artiklar-wrapper"
                    const titleId = wrapperId.replace('-wrapper', '-titel'); // "service-artiklar-titel"
                    const title = document.getElementById(titleId);

                    if (title) {
                        // Öppna panelen visuellt
                        title.setAttribute('data-state', 'open');
                        wrapper.classList.remove('collapsed');
                    }
                }
                // --- SLUT PÅ NY KOD ---

                // Den gamla logiken körs nu *efter* panelen garanterat är öppen
                element.scrollIntoView({ behavior: 'smooth', block: 'center' });
                
                document.querySelectorAll('.artikel-rad.highlight, .artikel-kort.highlight').forEach(r => r.classList.remove('highlight'));
                
                element.classList.add('highlight');
                
                const twinSelector = element.classList.contains('artikel-rad') 
                    ? `.artikel-kort[data-id="${itemId}"]` 
                    : `.artikel-rad[data-id="${itemId}"]`;
                const twinElement = document.querySelector(twinSelector);
                
                if (twinElement) {
                    twinElement.classList.add('highlight');
                }
            }
        }

        async function handleFormSubmit(event) {
            event.preventDefault();
            
            if (!validateForm(addForm, false)) {
                showToast('Vänligen fyll i alla obligatoriska fält.', 'error');
                return;
            }

            const serviceFilter = (addForm.querySelector('#add_service_filter').value || '').trim().toUpperCase();

            addFormSubmitBtn.disabled = true; 
            addFormSubmitBtn.innerHTML = '<span class="icon-span">hourglass_top</span>Sparar...';
            
            const newItem = {
                id: Date.now(), 
                service_filter: serviceFilter, 
                name: (addForm.querySelector('#add_name').value || '').trim().toUpperCase(), 
                price: parseFloat(addForm.querySelector('#add_price').value) || 0.00,
                quantity: parseInt(addForm.querySelector('#add-quantity').value, 10) || 0,
                category: addForm.querySelector('#add_category').value || 'Övrigt', 
                notes: (addForm.querySelector('#add_notes').value || '').trim(),
                link: (addForm.querySelector('#add_link').value || '').trim(),
                lastUpdated: Date.now()
            };
            
            await saveInventoryItem(newItem);
            
            addForm.reset();
            addForm.querySelector('#add-quantity').value = 1; 
            addForm.querySelectorAll('.form-warning').forEach(el => el.textContent = '');
            addForm.querySelectorAll('.has-error').forEach(el => el.classList.remove('has-error'));
            addForm.querySelectorAll('.quick-category-btn').forEach(b => b.classList.remove('active'));
            
            addFormSubmitBtn.disabled = false; 
            addFormSubmitBtn.innerHTML = '<span class="icon-span">save</span>Spara Artikel';
            
            closeModal(addItemModal);
            
            showToast('Artikel sparad!', 'success');
            
            setTimeout(() => scrollToAndHighlight(newItem.id), 300);
        }
        
        function handleRowSelect(id, element) {
            document.querySelectorAll('.artikel-rad.selected, .artikel-kort.selected').forEach(r => r.classList.remove('selected'));
            
            if (selectedItemId === id) { 
                selectedItemId = null; 
            } else { 
                selectedItemId = id; 
                element.classList.add('selected'); 
                
                const twinSelector = element.classList.contains('artikel-rad') 
                    ? `.artikel-kort[data-id="${id}"]` 
                    : `.artikel-rad[data-id="${id}"]`;
                const twinElement = document.querySelector(twinSelector);
                if (twinElement) {
                    twinElement.classList.add('selected');
                }
            }
        }

        window.handleEdit = function(id, isOrderMode = false) {
            const item = inventory.find(i => i.id === id);
            if (item) {
                editForm.querySelectorAll('.has-error').forEach(el => el.classList.remove('has-error'));
                editForm.querySelectorAll('.form-warning').forEach(el => el.textContent = '');
            
                editForm.querySelector('#edit-id').value = item.id;
                editForm.querySelector('#edit-service_filter').value = item.service_filter;
                editForm.querySelector('#edit-name').value = item.name;
                editForm.querySelector('#edit-price').value = item.price;
                editForm.querySelector('#edit-quantity').value = isOrderMode ? 1 : item.quantity;
                editForm.querySelector('#edit-category').value = item.category;
                editForm.querySelector('#edit-notes').value = item.notes;
                editForm.querySelector('#edit-link').value = item.link;
                
                const titleEl = editModal.querySelector('h3');
                const iconEl = editModal.querySelector('h3 .icon-span');
                
                if (isOrderMode) {
                    titleEl.childNodes[1].nodeValue = ' Beställ Artikel';
                    iconEl.textContent = 'shopping_cart';
                    editFormSubmitBtn.innerHTML = '<span class="icon-span">check</span>Markera som Beställd';
                } else {
                    titleEl.childNodes[1].nodeValue = ' Redigera Artikel';
                    iconEl.textContent = 'edit';
                    editFormSubmitBtn.innerHTML = '<span class="icon-span">save</span>Spara Ändringar';
                }
                
                openModal('editModal');
            }
        }

        async function handleEditSubmit(event) {
            event.preventDefault();
            
            if (!validateForm(editForm, true)) {
                showToast('Vänligen fyll i alla obligatoriska fält.', 'error');
                return;
            }

            const originalHTML = editFormSubmitBtn.innerHTML;
            editFormSubmitBtn.disabled = true; 
            editFormSubmitBtn.innerHTML = '<span class="icon-span">hourglass_top</span>Sparar...';

            const id = parseInt(editForm.querySelector('#edit-id').value, 10);
            const originalItem = inventory.find(i => i.id === id);
            
            const updatedItem = {
                ...originalItem,
                service_filter: editForm.querySelector('#edit-service_filter').value.trim().toUpperCase(),
                name: editForm.querySelector('#edit-name').value.trim().toUpperCase(),
                price: parseFloat(editForm.querySelector('#edit-price').value) || 0.00,
                quantity: parseInt(editForm.querySelector('#edit-quantity').value, 10) || 0,
                category: editForm.querySelector('#edit-category').value,
                notes: editForm.querySelector('#edit-notes').value.trim(),
                link: editForm.querySelector('#edit-link').value.trim(),
                lastUpdated: Date.now()
            };

            await saveInventoryItem(updatedItem);
            editFormSubmitBtn.disabled = false; 
            editFormSubmitBtn.innerHTML = originalHTML;
            
            closeModal(editModal);
            
            showToast('Ändringar sparade!', 'success');
            
            setTimeout(() => scrollToAndHighlight(updatedItem.id), 300);
        }
        
        window.adjustQuantity = async function(id, change, buttonEl) {
            const item = inventory.find(i => i.id === id);
            if (item) {
                const newQuantity = Math.max(0, item.quantity + change);
                const updatedItem = {...item, quantity: newQuantity, lastUpdated: Date.now() };
                await saveInventoryItem(updatedItem);

                const element = buttonEl.closest('.artikel-rad, .artikel-kort');
                if (element) {
                    element.classList.remove('flash-quantity');
                    requestAnimationFrame(() => {
                        element.classList.add('flash-quantity');
                    });
                    element.addEventListener('animationend', () => {
                        element.classList.remove('flash-quantity');
                    }, { once: true });
                }
            }
        }
        
        window.handleDelete = function(id) {
            const item = inventory.find(i => i.id === id);
            showCustomConfirmation(
                `Är du säker på att du vill ta bort <strong>${item.name} (${item.service_filter})</strong>?`,
                async (result) => {
                    if (result) {
                        await deleteInventoryItem(id);
                        showToast('Artikel borttagen', 'info');
                    }
                }, 'Bekräfta Borttagning', true
            );
        }
        
        window.copyToClipboard = (buttonEl, text, typeName) => {
            const row = buttonEl.closest('.artikel-rad, .artikel-kort');
            
            navigator.clipboard.writeText(text).then(() => {
                const originalContent = buttonEl.innerHTML;
                buttonEl.innerHTML = '✅';
                buttonEl.disabled = true;
                
                showToast(`${typeName} kopierad: ${text}`, 'success');
                
                if (row) {
                    row.classList.add('flash-success');
                    row.addEventListener('animationend', () => {
                        row.classList.remove('flash-success');
                    }, { once: true });
                }
                
                setTimeout(() => {
                    buttonEl.innerHTML = originalContent;
                    buttonEl.disabled = false;
                }, 1000);
            }).catch(() => {
                showToast('Kunde inte kopiera', 'error');
            });
        };
        
        function closeConfirmationModal() { 
            closeModal(confirmationModal);
            confirmCallback = null; 
        }

        function showCustomConfirmation(message, callback, title = 'Bekräfta', isDanger = false) {
            confirmationModal.querySelector('#confirmationTitle').innerHTML = title;
            confirmationModal.querySelector('#confirmationMessage').innerHTML = message;
            confirmationModal.querySelector('#confirmNo').style.display = 'inline-flex';
            
            const yesBtn = confirmationModal.querySelector('#confirmYes');
            const iconEl = confirmationModal.querySelector('#confirmationIcon');
            
            yesBtn.className = 'btn-primary';
            
            if (isDanger) {
                yesBtn.classList.add('btn-danger');
                iconEl.textContent = 'warning';
                iconEl.style.color = 'var(--danger-color)';
            } else {
                iconEl.textContent = 'help';
                iconEl.style.color = 'var(--primary-color)';
            }
            
            openModal('confirmationModal');
            confirmCallback = callback;
        }
        
        async function handlePasteAndFill() {
            try {
                const text = await navigator.clipboard.readText();
                const parts = text.split(/\s+/);
                if (parts.length > 0) {
                    const artnr = parts[0].toUpperCase();
                    const name = parts.slice(1).join(' ').toUpperCase();
                    
                    addForm.querySelector('#add_service_filter').value = artnr;
                    if (name) {
                        addForm.querySelector('#add_name').value = name;
                    }
                    showToast('Innehåll inklistrat!', 'success');
                    
                    addForm.querySelector('#add_service_filter').dispatchEvent(new Event('input'));
                }
            } catch (err) {
                showToast('Kunde inte läsa urklipp', 'error');
            }
        }
        
        function initializeListeners() {
            addForm.addEventListener('submit', handleFormSubmit);
            
            document.getElementById('add-qty-plus').addEventListener('click', () => {
                const input = document.getElementById('add-quantity');
                input.value = parseInt(input.value || 0, 10) + 1;
            });
            document.getElementById('add-qty-minus').addEventListener('click', () => {
                const input = document.getElementById('add-quantity');
                input.value = Math.max(0, parseInt(input.value || 0, 10) - 1);
            });
            
            document.getElementById('edit-qty-plus').addEventListener('click', () => {
                const input = document.getElementById('edit-quantity');
                input.value = parseInt(input.value || 0, 10) + 1;
            });
            document.getElementById('edit-qty-minus').addEventListener('click', () => {
                const input = document.getElementById('edit-quantity');
                input.value = Math.max(0, parseInt(input.value || 0, 10) - 1);
            });
            
            editForm.addEventListener('submit', handleEditSubmit);
            
            const handleSearchInput = (e) => {
                const term = e.target.value;
                if (e.target.id === 'desktop-search-input') {
                    mobileSearchInput.value = term;
                } else {
                    desktopSearchInput.value = term;
                }
                const showClear = term.length > 0;
                desktopClearSearchBtn.style.display = showClear ? 'block' : 'none';
                mobileClearSearchBtn.style.display = showClear ? 'block' : 'none';
                applySearchFilter(term);
            };

            desktopSearchInput.addEventListener('input', handleSearchInput);
            mobileSearchInput.addEventListener('input', handleSearchInput);
        
            // --- ÄNDRAD: Lade till scroll-logik vid Enter ---
            const handleSearchKeydown = (e) => {
                if (e.key === 'Enter') {
                    e.preventDefault();
                    e.target.blur(); // Dölj tangentbordet

                    // --- NYTT: Skrolla till filter-knapparna ---
                    const targetElement = document.getElementById('category-filter-bar');
                    if (targetElement) {
                        let stickyHeaderHeight = 0;
                        const stickyToolbar = document.querySelector('.top-toolbar');
                        const stickySearchBar = document.getElementById('sticky-search-bar');
                        
                        // Hitta vilket sticky-element som är aktivt
                        if (stickyToolbar && window.getComputedStyle(stickyToolbar).position === 'sticky') {
                            stickyHeaderHeight = stickyToolbar.offsetHeight;
                        } else if (stickySearchBar && window.getComputedStyle(stickySearchBar).display !== 'none') {
                            stickyHeaderHeight = stickySearchBar.offsetHeight;
                        }

                        // Beräkna positionen
                        const targetRect = targetElement.getBoundingClientRect();
                        const targetScrollY = window.scrollY + targetRect.top - stickyHeaderHeight - 20; // 20px marginal

                        window.scrollTo({
                            top: targetScrollY,
                            behavior: 'smooth'
                        });
                    }
                    // --- SLUT NYTT ---
                }
            };
            desktopSearchInput.addEventListener('keydown', handleSearchKeydown);
            mobileSearchInput.addEventListener('keydown', handleSearchKeydown);
            
            const handleClearSearch = () => {
                clearAndHideSearch();
                desktopSearchInput.focus();
            };

            desktopClearSearchBtn.addEventListener('click', handleClearSearch);
            mobileClearSearchBtn.addEventListener('click', handleClearSearch);

            addForm.querySelector('#add_service_filter').addEventListener('input', (e) => {
                const value = e.target.value.trim().toUpperCase();
                const warningEl = e.target.closest('.form-field-full').querySelector('.form-warning');
                
                if (value && inventory.some(item => item.service_filter === value)) {
                    warningEl.textContent = 'Detta artikelnummer finns redan!';
                    e.target.closest('.form-field-full').classList.add('has-error');
                } else {
                    warningEl.textContent = '';
                    e.target.closest('.form-field-full').classList.remove('has-error');
                }
            });

            if (fabAddBtn) {
                fabAddBtn.addEventListener('click', () => openModal('addModal'));
            }
            if (toolbarAddBtn) {
                toolbarAddBtn.addEventListener('click', () => openModal('addModal'));
            }
            if (emptyStateAddBtn) {
                emptyStateAddBtn.addEventListener('click', () => openModal('addModal'));
            }
            
            document.querySelectorAll('.lager-container').forEach(c => { 
                c.addEventListener('scroll', () => {
                    c.classList.toggle('scrolled', c.scrollTop > 1);
                    closeRowActionPopover();
                }); 
            });

            // --- ÄNDRAD: Generell lyssnare för alla .modal-close-btn ---
            document.querySelectorAll('.modal-close-btn').forEach(btn => {
                btn.addEventListener('click', () => {
                    closeModal(btn.closest('.modal'));
                });
            });

            // Lyssnare för att stänga modal vid klick på bakgrund
            document.querySelectorAll('.modal').forEach(modal => {
                modal.addEventListener('click', (e) => {
                    if (e.target === modal) {
                        closeModal(modal);
                    }
                });
            });
            
            document.addEventListener('keydown', (e) => {
                if (e.key === 'Escape') {
                    // Stäng den översta (senast öppnade) modalen
                    const openModals = document.querySelectorAll('.modal.open');
                    if (openModals.length > 0) {
                        closeModal(openModals[openModals.length - 1]);
                    }
                    
                    closeRowActionPopover();
                    if(globalSearchResults.style.display === 'block') {
                        globalSearchResults.style.display = 'none';
                    }
                    hideSearchDropdowns();
                }
            });
            
            document.querySelectorAll('.header span[data-sort]').forEach(header => {
                header.addEventListener('click', () => {
                    const column = header.getAttribute('data-sort');
                    if (desktopSearchInput.value !== '') { 
                        clearAndHideSearch();
                    }
                    const direction = (currentSort.column === column && currentSort.direction === 'asc') ? 'desc' : 'asc';
                    currentSort = { column, direction };
                    applySearchFilter('');
                });
            });
            
            document.getElementById('confirmYes').addEventListener('click', () => { if (confirmCallback) confirmCallback(true); closeConfirmationModal(); });
            document.getElementById('confirmNo').addEventListener('click', () => { if (confirmCallback) confirmCallback(false); closeConfirmationModal(); });

            document.querySelectorAll('.collapsible-header').forEach(header => {
                header.addEventListener('click', () => {
                    const wrapperId = header.id.replace('-titel', '-wrapper'); const wrapper = document.getElementById(wrapperId); if (!wrapper) return;
                    const isClosed = header.getAttribute('data-state') === 'closed'; const newState = isClosed ? 'open' : 'closed';
                    header.setAttribute('data-state', newState); wrapper.classList.toggle('collapsed', !isClosed);
                    localStorage.setItem(header.id, newState);
                });
            });

            if (globalSearchBtn) { globalSearchBtn.addEventListener('click', (e) => { e.preventDefault(); handleGlobalSearch(); }); }
            globalSearchInput.addEventListener('keydown', (e) => { if (e.key === 'Enter') { e.preventDefault(); handleGlobalSearch(); } });
            globalSearchInput.addEventListener('input', (e) => { updateGlobalSearchButton(e.target.value.trim().toUpperCase()); });

            document.getElementById('btn-copy-all-links-text').addEventListener('click', (e) => {
                handleCopyAllLinks(e.currentTarget, 'text');
            });
            document.getElementById('btn-copy-all-links-json').addEventListener('click', (e) => {
                handleCopyAllLinks(e.currentTarget, 'json');
            });
            
            quickAddFromSearchBtn.addEventListener('click', () => {
                const searchTerm = quickAddFromSearchBtn.getAttribute('data-search-term');
                
                const parts = searchTerm.split(/\s+/);
                const artnr = parts[0] || '';
                const name = parts.slice(1).join(' ').toUpperCase();
                const guessedCategory = guessCategoryFromName(name);

                openModal('addModal');
                
                addForm.querySelector('#add_service_filter').value = artnr;
                addForm.querySelector('#add_name').value = name;
                
                if (guessedCategory) {
                    addForm.querySelector('#add_category').value = guessedCategory;
                    addForm.querySelector('#add_category').dispatchEvent(new Event('change'));
                }
                
                globalSearchResults.style.display = 'none';
                
                setTimeout(() => {
                    if (name) {
                        addForm.querySelector('#add_price').focus();
                    } else {
                        addForm.querySelector('#add_name').focus();
                    }
                }, 50);
            });
            
            if (recentItemsList) {
                recentItemsList.addEventListener('click', (e) => {
                    const itemLink = e.target.closest('.recent-item');
                    if (itemLink) {
                        e.preventDefault();
                        const itemId = itemLink.getAttribute('data-id');
                        closeAppMenu();
                        setTimeout(() => scrollToAndHighlight(itemId), 250);
                    }
                });
            }
            
            if (topValueList) {
                topValueList.addEventListener('click', (e) => {
                    const itemLink = e.target.closest('.top-value-item');
                    if (itemLink) {
                        e.preventDefault();
                        const itemId = itemLink.getAttribute('data-id');
                        closeAppMenu();
                        setTimeout(() => scrollToAndHighlight(itemId), 250);
                    }
                });
            }
            
            if (dashboardContainer) {
                dashboardContainer.addEventListener('click', (e) => {
                    const statCard = e.target.closest('.dashboard-stat');
                    if (statCard && statCard.dataset.filterTarget) {
                        const filter = statCard.dataset.filterTarget;
                        currentFilter = filter;
                        categoryFilterBar.querySelectorAll('.btn-secondary').forEach(btn => {
                            btn.classList.toggle('active', btn.getAttribute('data-filter') === currentFilter);
                        });
                        applySearchFilter(desktopSearchInput.value);
                        closeAppMenu();
                    }
                });
            }

            appMenuBtn.addEventListener('click', openAppMenu);
            appMenuOverlay.addEventListener('click', closeAppMenu);
            appMenuCloseBtn.addEventListener('click', closeAppMenu);
            
            exportCsvBtn.addEventListener('click', exportToCSV);
            exportJsonBtn.addEventListener('click', exportToJSON);
            document.getElementById('paste-artnr-btn').addEventListener('click', handlePasteAndFill);

            addForm.querySelectorAll('.quick-category-btn').forEach(btn => {
                btn.addEventListener('click', () => {
                    const category = btn.getAttribute('data-category');
                    addForm.querySelector('#add_category').value = category;
                    addForm.querySelectorAll('.quick-category-btn').forEach(b => b.classList.remove('active'));
                    btn.classList.add('active');
                    
                    const wrapper = btn.closest('.form-field-full');
                    if(wrapper) {
                        wrapper.classList.remove('has-error');
                        const warningEl = wrapper.querySelector('.form-warning');
                        if (warningEl) warningEl.textContent = '';
                    }
                });
            });
            
            addForm.querySelector('#add_category').addEventListener('change', (e) => {
                const selectedCategory = e.target.value;
                addForm.querySelectorAll('.quick-category-btn').forEach(btn => {
                    btn.classList.toggle('active', btn.getAttribute('data-category') === selectedCategory);
                });
            });
            
            [addForm, editForm].forEach(form => {
                form.querySelectorAll('[required]').forEach(field => {
                    field.addEventListener('input', (e) => {
                        if (e.target.value.trim() !== '') {
                            const wrapper = e.target.closest('.form-field-full, .form-field-half');
                            if (wrapper && wrapper.classList.contains('has-error')) {
                                wrapper.classList.remove('has-error');
                                const warningEl = wrapper.querySelector('.form-warning');
                                if (warningEl) warningEl.textContent = '';
                            }
                        }
                    });
                });
            });

            const backToTopBtn = document.getElementById('back-to-top-btn');
            if (backToTopBtn) {
                window.addEventListener('scroll', () => { 
                    backToTopBtn.style.display = window.scrollY > 300 ? 'flex' : 'none'; 
                    closeRowActionPopover();
                    hideSearchDropdowns();
                });
                backToTopBtn.addEventListener('click', () => { window.scrollTo({ top: 0, behavior: 'smooth' }); });
            }
            
            if(themeToggle) {
                themeToggle.addEventListener('change', () => {
                    setTheme(themeToggle.checked ? 'dark' : 'light');
                });
            }
            
            if(pwaInstallBtn) {
                pwaInstallBtn.addEventListener('click', handlePwaInstall);
            }
            
            if (categoryFilterBar) {
                categoryFilterBar.addEventListener('click', (e) => {
                    if (e.target.tagName === 'BUTTON') {
                        const filter = e.target.getAttribute('data-filter');
                        if (filter) {
                            currentFilter = filter;
                            if(desktopSearchInput.value) {
                                clearAndHideSearch();
                            }
                            applySearchFilter('');
                        }
                    }
                });
            }
        }
        
        function initializeCollapseState() {
            document.querySelectorAll('.collapsible-header').forEach(header => {
                const savedState = localStorage.getItem(header.id); const wrapperId = header.id.replace('-titel', '-wrapper'); const wrapper = document.getElementById(wrapperId);
                if (savedState === 'closed') { header.setAttribute('data-state', 'closed'); if (wrapper) { wrapper.classList.add('collapsed'); } } 
            });
        }

        // KÖR ALLT I ORDNING
        checkTheme();
        updateSyncStatus('connecting', 'Ansluter...'); 
        initializeCollapseState();
        loadPersistentState();
        initializeListeners(); 
        renderSearchHistory();
        setupRealtimeListener();

    } catch (e) {
        console.error("App Initialization Error:", e);
        updateSyncStatus('error', 'Initieringsfel! Se konsol.'); 
        if(initialLoader) initialLoader.querySelector('p').textContent = 'Kritiskt fel vid initiering.';
    }
});















