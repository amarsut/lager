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
        const fullEmptyState = document.getElementById('full-empty-state');
        const emptyStateAddBtn = document.getElementById('empty-state-add-btn'); // NYTT
        
        // --- ÄNDRAD: Unika ID:n för sökfälten ---
        const desktopSearchInput = document.getElementById('desktop-search-input');
        const mobileSearchInput = document.getElementById('mobile-search-input');
        const desktopClearSearchBtn = document.getElementById('desktop-clear-search-btn');
        const mobileClearSearchBtn = document.getElementById('mobile-clear-search-btn');
        const desktopSearchResults = document.getElementById('desktop-search-results');
        const mobileSearchResults = document.getElementById('mobile-search-results');
        // --- SLUT ÄNDRING ---
        
        const dynamicSearchArea = document.getElementById('dynamic-search-area');
        const addFormWrapper = document.getElementById('add-form-wrapper');
        const addForm = document.getElementById('add-article-form');
        const addFormArtnrWarning = document.getElementById('add-form-artnr-warning');
        const editModal = document.getElementById('editModal');
        const editForm = document.getElementById('edit-article-form');
        const confirmationModal = document.getElementById('confirmationModal');
        const syncStatusElement = document.getElementById('sync-status');
        
        // Global sök
        const globalSearchInput = document.getElementById('global-search-input');
        const globalSearchBtn = document.getElementById('global-search-btn');
        const globalSearchResults = document.getElementById('global-search-results');
        // --- NYTT: Container för Biluppgifter ---
        const biluppgifterResultContainer = document.getElementById('biluppgifter-result-container');
        // --- SLUT NYTT ---
        const internalResultsContainer = document.getElementById('internal-results-container');
        const externalResultsContainer = document.getElementById('external-results-container');
        const exportLinksContainer = document.getElementById('export-search-links-container');
        const searchDisclaimer = document.getElementById('search-disclaimer');
        const quickAddFromSearchBtn = document.createElement('button');
        quickAddFromSearchBtn.id = 'quick-add-from-search';
        quickAddFromSearchBtn.className = 'btn-primary'; // Ändrad till btn-primary

        // Toolbar
        const toolbarFilterBadge = document.getElementById('toolbar-filter-badge'); // NYTT

        // Formulär-hjälpmedel
        const pasteArtnrBtn = document.getElementById('paste-artnr-btn'); // NYTT
        const quickCategoryBtns = document.querySelectorAll('.quick-category-btn'); // NYTT

        const emptyStates = {
            service: document.getElementById('service-empty-state'),
            motorChassi: document.getElementById('motor-chassi-empty-state'),
            andraMarken: document.getElementById('andra-marken-empty-state'),
            slutILager: document.getElementById('slut-i-lager-empty-state')
        };
        
        // Dashboard (Nu i App-meny)
        const dashboardContainer = document.querySelector('.dashboard-container');
        const statTotalItems = document.getElementById('stat-total-items');
        const statTotalUnits = document.getElementById('stat-total-units');
        const statOutOfStock = document.getElementById('stat-out-of-stock');
        
        // Senast Hanterade (Nu i App-meny)
        const recentItemsList = document.getElementById('recent-items-list');
        const recentItemsEmpty = document.getElementById('recent-items-empty');
        
        // App-meny
        const appMenuBtn = document.getElementById('app-menu-btn');
        const appMenuModal = document.getElementById('app-menu-modal');
        const appMenuOverlay = document.getElementById('app-menu-overlay');
        const appMenuCloseBtn = document.getElementById('app-menu-close-btn');

        // Exportera (NYTT)
        const exportCsvBtn = document.getElementById('export-csv-btn');
        const exportJsonBtn = document.getElementById('export-json-btn');
        
        // BORTTAGEN: Beställningslista (Order List) element
        
        const initialLoader = document.getElementById('initial-loader');
        const themeToggle = document.getElementById('theme-toggle-cb');
        const pwaInstallBtn = document.getElementById('pwa-install-btn');
        const categoryFilterBar = document.getElementById('category-filter-bar');
        const fabAddBtn = document.getElementById('fab-add-btn');
        const metaThemeColor = document.querySelector('meta[name="theme-color"]');
        const badges = {
            service: document.getElementById('badge-service'),
            motorChassi: document.getElementById('badge-motor-chassi'),
            andraMarken: document.getElementById('badge-andra-marken')
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
        // --- NYTT: Flagg för att förhindra race condition vid sök-klick ---
        let isNavigatingViaSearch = false;
        
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
      
        function formatPrice(price) { return new Intl.NumberFormat('sv-SE', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(price); }
        function generateAeroMLink(f) { if (!f) return null; const s = f.replace(/[\s-]/g, ''); return `https://aeromotors.se/sok?s=${s}&layered_id_feature_1586%5B%5D=3&sort_by=price.asc`; }
        function generateTrodoLink(f) { if (!f) return null; const s = f.replace(/[\s-]/g, ''); const q = encodeURIComponent(s); return `https://www.trodo.se/catalogsearch/result/premium?filter[quality_group]=2&product_list_dir=asc&product_list_order=price&q=${q}`; }
        function generateThansenLink(f) { if (!f) return null; const s = f.replace(/[\s-]/g, ''); const q = encodeURIComponent(s); return `https://www.thansen.se/search/?query=${q}`; }
        function generateSkruvatLink(f) { if (!f) return null; const s = encodeURIComponent(f.replace(/[\s-]/g, '')); return `https://skruvat.se/search?q=${s}`; }
        function generateVortoLink(f) { if (!f) return null; const s = encodeURIComponent(f.replace(/[\s-]/g, '')); return `https://vorto.se/sok?search=${s}`; }
        function generateAutodocLink(f) { if (!f) return null; const s = encodeURIComponent(f.replace(/[\s-]/g, '')); return `https://autodoc.se/search?keyword=${s}`; }
        function generateBildelsbasenLink(f) { if (!f) return null; const s = encodeURIComponent(f.replace(/[\s-]/g, '')); return `https://bildelsbasen.se/sv-se/OEM/${s}`; }
        function generateReservdelar24Link(f) { if (!f) return null; const s = encodeURIComponent(f.replace(/[\s-]/g, '')); return `https://reservdelar24.se/suche.html?keyword=${s}`; }
        
        window.toggleDropdown = function(id) { const d = document.getElementById(id); if (!d) return; document.querySelectorAll('.dropdown-menu.visible').forEach(o => { if (o.id !== id) o.classList.remove('visible'); }); d.classList.toggle('visible'); };
        window.closeDropdown = function(id) { const d = document.getElementById(id); if (d) d.classList.remove('visible'); };
        
        // --- ÄNDRAD: Eventlyssnare för att stänga dropdowns ---
        document.addEventListener('click', (e) => {
            // Stäng sök-dropdowns
            if (!e.target.closest('.search-wrapper') && !e.target.closest('#sticky-search-bar')) {
                desktopSearchResults.style.display = 'none';
                mobileSearchResults.style.display = 'none';
            }
            
            // Stäng länk-dropdowns
            if (!e.target.closest('.link-dropdown-container')) {
                document.querySelectorAll('.dropdown-menu.visible').forEach(d => d.classList.remove('visible'));
            }
        });
        // --- SLUT ÄNDRING ---


        // ----------------------------------------------------------------------
        // GLOBAL SÖK-FUNKTION (OMGJORD)
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

        // --- ÄNDRAD: handleGlobalSearch känner nu igen reg-nr ---
        async function handleGlobalSearch(searchTermOverride) {
            const searchTerm = (searchTermOverride ? searchTermOverride.trim().toUpperCase() : globalSearchInput.value.trim().toUpperCase());
            if (searchTerm === '') {
                globalSearchResults.style.display = 'none';
                return;
            }
            
            globalSearchBtn.disabled = true;
            saveSearchToHistory(searchTerm); 
            
            // --- NYTT: REG-NR KONTROLL ---
            // Känner igen ABC 123, ABC123, och ABC12A
            const regNrRegex = /^[A-ZÅÄÖ]{3}[\s]?[0-9]{2}[A-ZÅÄÖ0-9]{1}$/;
            const cleanRegNr = searchTerm.replace(/\s/g, ''); // Ta bort mellanslag
            
            if (regNrRegex.test(searchTerm) || (cleanRegNr.length === 6 && regNrRegex.test(cleanRegNr))) {
                
                const biluppgifterLink = `https://biluppgifter.se/fordon/${cleanRegNr}#vehicle-data`;
                
                biluppgifterResultContainer.innerHTML = `
                    <h4 class="internal-search-title">Fordonsuppslag:</h4>
                    <div class="provider-card">
                        <img src="https://biluppgifter.se/favicon/favicon.ico" alt="Biluppgifter.se" class="provider-card-logo">
                        <div class="provider-card-content">
                            <span class="provider-card-name">${cleanRegNr}</span>
                            <a href="${biluppgifterLink}" target="_blank" class="btn-provider-search">Visa Fordon</a>
                        </div>
                    </div>
                `;
                biluppgifterResultContainer.style.display = 'block';
                
                // Göm de andra sektionerna
                internalResultsContainer.innerHTML = '';
                externalResultsContainer.innerHTML = '';
                exportLinksContainer.style.display = 'none';
                searchDisclaimer.style.display = 'none';
                globalSearchResults.style.display = 'block';

                // Bind stäng-knappen
                document.getElementById('global-search-close-btn').addEventListener('click', () => { 
                    globalSearchResults.style.display = 'none'; 
                });
                
                globalSearchBtn.disabled = false;
                return; // Avsluta här, vi ska inte söka efter artiklar
            }
            // --- SLUT REG-NR KONTROLL ---

            // Om det inte var ett reg-nr, nollställ biluppgifter-containern
            biluppgifterResultContainer.style.display = 'none';
            
            try {
                internalResultsContainer.innerHTML = '';
                externalResultsContainer.innerHTML = '';
                exportLinksContainer.style.display = 'none';
                searchDisclaimer.style.display = 'none';
                globalSearchResults.style.display = 'block';
                currentExternalLinks = []; 

                // 1. Interna resultat
                const internalMatches = inventory.filter(item => (item.service_filter || '').toUpperCase().includes(searchTerm) || (item.name || '').toUpperCase().includes(searchTerm));
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
                    quickAddFromSearchBtn.setAttribute('data-artnr', searchTerm);
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
                    closeDropdown('export-links-menu');
                }, 1500);
            }).catch(() => {
                showToast('Kunde inte kopiera länkar', 'error');
            });
        }

        // ----------------------------------------------------------------------
        // NYA FUNKTIONER: TEMA, TOASTS, M.M. (Oförändrade)
        // ----------------------------------------------------------------------

        function setTheme(theme) {
            document.body.setAttribute('data-theme', theme);
            localStorage.setItem('app_theme', theme);
            themeToggle.checked = (theme === 'dark');
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
        // NYA FUNKTIONER: App-meny & Exportera
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

        // BORTTAGEN: All logik för OrderList (kundvagnen)

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
            downloadFile('lager_export.json', 'application/json', dataStr);
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
                        strValue = `"${strValue}"`; // Hantera kommatecken i fält
                    }
                    return strValue;
                }).join(',');
            });
            
            const csvContent = [headers, ...rows].join('\n');
            downloadFile(csvContent, 'lager_export.csv', 'text/csv;charset=utf-8;');
            showToast('Lager exporterat som CSV', 'success');
        }


        // ----------------------------------------------------------------------
        // GRÄNSSNITT OCH HUVUDFUNKTIONER (UPPDATERADE)
        // ----------------------------------------------------------------------

        function renderDashboard(currentInventory) {
            const inStock = currentInventory.filter(item => item.quantity > 0);
            
            const totalUnits = inStock.reduce((sum, item) => {
                return sum + item.quantity;
            }, 0);
            
            const inStockItems = inStock.length;
            const outOfStockItems = currentInventory.length - inStockItems;

            statTotalItems.textContent = inStockItems;
            statTotalUnits.textContent = totalUnits;
            statOutOfStock.textContent = outOfStockItems;
        }
        
        // NYTT: Visar "Senast Hanterade" (baserat på `lastUpdated`)
        function renderRecentItems(currentInventory) {
            // Sortera efter `lastUpdated` (senaste först), fall back till `id`
            const sortedItems = [...currentInventory].sort((a, b) => {
                const timeA = a.lastUpdated || a.id;
                const timeB = b.lastUpdated || b.id;
                return timeB - timeA;
            });
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
        
        function updateCategoryBadges(currentInventory) {
            const serviceItems = currentInventory.filter(i => i.category === 'Service' && i.quantity > 0);
            const motorItems = currentInventory.filter(i => (i.category === 'Motor/Chassi' || i.category === 'Övrigt' || !i.category) && i.quantity > 0);
            const andraItems = currentInventory.filter(i => i.category === 'Andra Märken' && i.quantity > 0);
            
            badges.service.textContent = `${serviceItems.length} st`;
            badges.motorChassi.textContent = `${motorItems.length} st`;
            badges.andraMarken.textContent = `${andraItems.length} st`;
        }

        function updateSyncStatus(status, message) {
            if (!syncStatusElement) return;
            syncStatusElement.className = `sync-${status}`;
            syncStatusElement.title = message;
            const textEl = syncStatusElement.querySelector('.text');
            if (textEl) textEl.textContent = message;
        }

        // --- NYTT: Helper för att escapa HTML ---
        function escapeHTML(str) {
            if (typeof str !== 'string') return '';
            return str.replace(/[&<>"']/g, function(match) {
                return {
                    '&': '&amp;',
                    '<': '&lt;',
                    '>': '&gt;',
                    '"': '&quot;',
                    "'": '&#39;'
                }[match];
            });
        }

        // --- NYTT: Funktion för att parsa anteckningar och skapa skyltar ---
        function parseNotes(notesText) {
            if (!notesText) return '';
            
            // Regex för att hitta [ABC123] eller [ABC 123]
            const plateRegex = /\[([A-ZÅÄÖ0-9]{1,3}[\s]?[A-ZÅÄÖ0-9]{1,3})\]/gi;
            
            // Dela upp strängen baserat på regex, men behåll delarna
            const parts = notesText.split(plateRegex);
            let html = '';

            for (let i = 0; i < parts.length; i++) {
                if (i % 2 === 1) {
                    // Detta är en matchad reg-skylt (det som var INUTI parentesen)
                    const plateContent = parts[i].toUpperCase();
                    html += `<span class="plate-tag">
                                <span class="plate-eu-s">S</span>
                                <span class="plate-text">${escapeHTML(plateContent)}</span>
                             </span>`;
                } else if (parts[i]) {
                    // Detta är vanlig text
                    html += escapeHTML(parts[i]);
                }
            }
            return html;
        }

        // --- NYTT: Funktion för att ENDAST hämta skyltar från anteckningar ---
        function extractPlatesHTML(notesText) {
            if (!notesText) return '';
            
            const plateRegex = /\[([A-ZÅÄÖ0-9]{1,3}[\s]?[A-ZÅÄÖ0-9]{1,3})\]/gi;
            let matches;
            let html = '';
            
            // Hitta alla matchningar
            while ((matches = plateRegex.exec(notesText)) !== null) {
                const plateContent = matches[1].toUpperCase(); // matches[1] är gruppen *inuti* hakparentesen
                html += `<span class="plate-tag">
                            <span class="plate-eu-s">S</span>
                            <span class="plate-text">${escapeHTML(plateContent)}</span>
                         </span>`;
            }
            return html;
        }

        function createInventoryRow(item, isOutOfStock) {
            const row = document.createElement('div'); row.className = 'artikel-rad'; row.setAttribute('data-id', item.id);
            row.onclick = () => handleRowSelect(item.id, row);
            if (selectedItemId === item.id) row.classList.add('selected');
            const statusClass = item.quantity > 0 ? 'i-lager' : 'slut'; const statusText = item.quantity > 0 ? 'I lager' : 'Slut';
            const quantityCell = `<div class="quantity-cell"><button class="qty-btn" onclick="adjustQuantity(${item.id}, -1); event.stopPropagation();">-</button><span>${item.quantity}</span><button class="qty-btn" onclick="adjustQuantity(${item.id}, 1); event.stopPropagation();">+</button></div>`;
            
            // --- ÅTERSTÄLLD: "Beställ"-knapp ---
            const editButton = isOutOfStock
                ? `` // Tom sträng istället för Beställ-knappen
                : `<button class="edit-btn" onclick="handleEdit(${item.id}); event.stopPropagation();">Ändra</button>`;
          
            // --- ÄNDRAD: Använder parseNotes() för att formatera anteckningar ---
            const formattedNotes = parseNotes(item.notes || '');
            const notesCell = `<span class="notes-cell" title="${item.notes || ''}">${formattedNotes}</span>`;
            // --- SLUT ÄNDRING ---
            
            const trodoLink = generateTrodoLink(item.service_filter); const aeroMLink = generateAeroMLink(item.service_filter); const thansenLink = generateThansenLink(item.service_filter); const egenLink = item.link;
            let primaryButtonHTML = ''; let linkCellContent = '';
            if (trodoLink) { primaryButtonHTML = `<button class="lank-knapp trodo-btn" onclick="window.open('${trodoLink}', '_blank'); event.stopPropagation();">Trodo</button>`; }
            if (primaryButtonHTML) { linkCellContent += primaryButtonHTML; }
            const hasSecondaryLinks = aeroMLink || thansenLink || egenLink;
            if (hasSecondaryLinks) {
                const dropdownId = `link-dropdown-${item.id}`; let secondaryButtonsHTML = '';
                if (aeroMLink) { secondaryButtonsHTML += `<button class="lank-knapp aero-m-btn" onclick="window.open('${aeroMLink}', '_blank'); closeDropdown('${dropdownId}'); event.stopPropagation();">AeroMotors</button>`; }
                if (thansenLink) { secondaryButtonsHTML += `<button class="lank-knapp thansen-btn" onclick="window.open('${thansenLink}', '_blank'); closeDropdown('${dropdownId}'); event.stopPropagation();">Thansen</button>`; }
                if (egenLink) { secondaryButtonsHTML += `<button class="lank-knapp egen-lank-btn" onclick="window.open('${egenLink}', '_blank'); closeDropdown('${dropdownId}'); event.stopPropagation();">Egen Länk</button>`; }
                const moreButton = `<button class="lank-knapp more-btn" onclick="toggleDropdown('${dropdownId}'); event.stopPropagation();">Mer</button>`;
                const dropdownMenu = `<div id="${dropdownId}" class="dropdown-menu">${secondaryButtonsHTML}</div>`;
                linkCellContent += `<div class="link-dropdown-container">${moreButton}${dropdownMenu}</div>`;
            }
            if (!linkCellContent) { linkCellContent = '<span>(Saknas)</span>'; }
            const finalLinkCellContent = `<div class="link-buttons">${linkCellContent}</div>`;
            const primarySearchLink = trodoLink || aeroMLink || egenLink; const primarySearchText = trodoLink ? 'Trodo' : (aeroMLink ? 'AeroMotors' : (egenLink ? 'Egen Länk' : ''));
            const searchButton = primarySearchLink ? `<button class="search-btn" onclick="window.open('${primarySearchLink}', '_blank'); event.stopPropagation();" title="Sök på ${primarySearchText}"><svg viewBox="0 0 16 16" xmlns="http://www.w3.org/2000/svg"><path d="M11.742 10.344a6.5 6.5 0 1 0-1.397 1.398h-.001c.03.04.062.078.098.115l3.85 3.85a1 1 0 0 0 1.415-1.414l-3.85-3.85a1.007 1.007 0 0 0-.115-.1zM12 6.5a5.5 5.5 0 1 1-11 0 5.5 5.5 0 0 1 11 0z"/></svg></button>` : '';
            
            const copyArtnrBtn = `<button class="copy-btn" onclick="copyToClipboard(this, '${escapeHTML(item.service_filter).replace(/'/g, "\\'")}'); event.stopPropagation();" title="Kopiera Artikelnummer">&#x1F4CB;</button>`;
            const copyNameBtn = `<button class="copy-btn" onclick="copyToClipboard(this, '${escapeHTML(item.name).replace(/'/g, "\\'")}'); event.stopPropagation();" title="Kopiera Namn"><span class="icon-span" style="font-size: 14px;">title</span></button>`; // NYTT
            
            const serviceFilterCell = `<span class="cell-copy-wrapper">${searchButton}${copyArtnrBtn}<span class="cell-copy-text">${escapeHTML(item.service_filter)}</span></span>`;
            const nameCell = `<span class="cell-copy-wrapper">${copyNameBtn}<span class="cell-copy-text">${escapeHTML(item.name)}</span></span>`; // NYTT

            const editButtonSlut = `<button class="edit-btn" onclick="handleEdit(${item.id}); event.stopPropagation();">Ändra</button>`; // Återställd (visa alltid "Ändra")

            row.innerHTML = `${serviceFilterCell}${nameCell}<span>${formatPrice(item.price)} kr</span>${quantityCell}<span style="display: flex; align-items: center;"><span class="${statusClass}">${statusText}</span></span>${notesCell}<span class="action-cell">${finalLinkCellContent}</span><div class="action-buttons">${editButton}${isOutOfStock ? editButtonSlut : ''}<button class="delete-btn" onclick="handleDelete(${item.id}); event.stopPropagation();">Ta bort</button></div>`;
            return row;
        }

        function renderInventory(data) {
            serviceArtiklarLista.innerHTML = '';
            motorChassiArtiklarLista.innerHTML = '';
            andraMarkenArtiklarLista.innerHTML = '';
            slutILagerLista.innerHTML = '';
            
            const iLager = data.filter(item => item.quantity > 0);
            const slutILager = data.filter(item => item.quantity <= 0);

            const serviceArtiklar = iLager.filter(item => item.category === 'Service');
            const motorChassiArtiklar = iLager.filter(item => item.category === 'Motor/Chassi' || item.category === 'Övrigt' || !item.category);
            const andraMarkenArtiklar = iLager.filter(item => item.category === 'Andra Märken');

            serviceArtiklar.forEach(item => serviceArtiklarLista.appendChild(createInventoryRow(item, false)));
            motorChassiArtiklar.forEach(item => motorChassiArtiklarLista.appendChild(createInventoryRow(item, false)));
            andraMarkenArtiklar.forEach(item => andraMarkenArtiklarLista.appendChild(createInventoryRow(item, false)));
            slutILager.forEach(item => slutILagerLista.appendChild(createInventoryRow(item, true)));

            const serviceWrapper = document.getElementById('service-artiklar-wrapper');
            const motorWrapper = document.getElementById('motor-chassi-artiklar-wrapper');
            const andraWrapper = document.getElementById('andra-marken-artiklar-wrapper');

            const serviceTitle = document.getElementById('service-artiklar-titel');
            const motorTitle = document.getElementById('motor-chassi-artiklar-titel');
            const andraTitle = document.getElementById('andra-marken-artiklar-titel');
            
            const showService = (currentFilter === 'Alla' || currentFilter === 'Service') && serviceArtiklar.length > 0;
            const showMotor = (currentFilter === 'Alla' || currentFilter === 'Motor/Chassi') && motorChassiArtiklar.length > 0;
            const showAndra = (currentFilter === 'Alla' || currentFilter === 'Andra Märken') && andraMarkenArtiklar.length > 0;
            const showSlut = (currentFilter === 'Alla' || currentFilter === 'Slut') && slutILager.length > 0;

            serviceTitle.style.display = showService ? 'flex' : 'none';
            serviceWrapper.style.display = showService ? 'block' : 'none';
            motorTitle.style.display = showMotor ? 'flex' : 'none';
            motorWrapper.style.display = showMotor ? 'block' : 'none';
            andraTitle.style.display = showAndra ? 'flex' : 'none';
            andraWrapper.style.display = showAndra ? 'block' : 'none';
            slutILagerSektion.style.display = showSlut ? 'block' : 'none';

            emptyStates.service.style.display = (currentFilter === 'Alla' || currentFilter === 'Service') && serviceArtiklar.length === 0 ? 'flex' : 'none';
            emptyStates.motorChassi.style.display = (currentFilter === 'Alla' || currentFilter === 'Motor/Chassi') && motorChassiArtiklar.length === 0 ? 'flex' : 'none';
            emptyStates.andraMarken.style.display = (currentFilter === 'Alla' || currentFilter === 'Andra Märken') && andraMarkenArtiklar.length === 0 ? 'flex' : 'none';
            emptyStates.slutILager.style.display = (currentFilter === 'Alla' || currentFilter === 'Slut') && slutILager.length === 0 ? 'flex' : 'none';
            
            const totalItems = inventory.length; // Kolla *hela* lagret
            if (totalItems === 0) {
                fullEmptyState.style.display = 'flex';
                serviceTitle.style.display = 'none'; serviceWrapper.style.display = 'none';
                motorTitle.style.display = 'none'; motorWrapper.style.display = 'none';
                andraTitle.style.display = 'none'; andraWrapper.style.display = 'none';
                slutILagerSektion.style.display = 'none';
            } else {
                fullEmptyState.style.display = 'none';
            }

            // --- ÄNDRAD: Använder desktopSearchInput som källa ---
            const currentSearchTerm = desktopSearchInput.value;
            if (currentSearchTerm.length > 0) {
                Object.values(emptyStates).forEach(el => {
                    if (el.style.display === 'flex') {
                        el.querySelector('h4').textContent = 'Inga träffar';
                        el.querySelector('p').textContent = `Din sökning på "${currentSearchTerm}" gav inga resultat.`;
                    }
                });
            } else {
                 emptyStates.service.querySelector('h4').textContent = 'Inga serviceartiklar';
                 emptyStates.service.querySelector('p').textContent = 'Inga artiklar hittades. Prova ändra filtret eller lägg till en ny artikel.';
                 emptyStates.motorChassi.querySelector('h4').textContent = 'Inga motor/chassi-artiklar';
                 emptyStates.motorChassi.querySelector('p').textContent = 'Inga artiklar hittades. Prova ändra filtret eller lägg till en ny artikel.';
                 emptyStates.andraMarken.querySelector('h4').textContent = 'Inga artiklar för andra märken';
                 emptyStates.andraMarken.querySelector('p').textContent = 'Inga artiklar hittades. Prova ändra filtret eller lägg till en ny artikel.';
                 emptyStates.slutILager.querySelector('h4').textContent = 'Inga artiklar slut i lager';
                 emptyStates.slutILager.querySelector('p').textContent = 'Inga artiklar hittades. Prova ändra filtret eller lägg till en ny artikel.';
            }
        }

        function calculateRelevance(item, searchWords) {
            let score = 0; const serviceFilter = (item.service_filter || '').toLowerCase(); const name = (item.name || '').toLowerCase(); const notes = (item.notes || '').toLowerCase(); const category = (item.category || '').toLowerCase();
            searchWords.forEach(word => {
                const cleanWord = word.replace(/[^a-z0-9]/g, ''); if (serviceFilter.includes(cleanWord)) { score += 5; } if (name.includes(cleanWord)) { score += 3; } if (category.includes(cleanWord)) { score += 2; } if (notes.includes(cleanWord)) { score += 1; } if (serviceFilter === cleanWord || name === cleanWord) { score += 5; }
            }); return score;
        }

        // --- ÄNDRAD: Funktion för att rendera sök-dropdown ---
        function renderSearchDropdown(searchTerm, results) {
            if (searchTerm.length < 1 || results.length === 0) {
                desktopSearchResults.innerHTML = '';
                mobileSearchResults.innerHTML = '';
                desktopSearchResults.style.display = 'none';
                mobileSearchResults.style.display = 'none';
                return;
            }

            let html = '';
            // Visa max 10 resultat i dropdown
            results.slice(0, 10).forEach(item => {
                // --- ÄNDRAD: Hämta ENDAST registreringsskyltar ---
                const platesHTML = extractPlatesHTML(item.notes || '');

                // --- ÄNDRAD: Uppdaterad HTML-struktur med flexbox ---
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
        // --- SLUT ÄNDRING ---

        // --- NYTT: Funktion för att rensa sökfält och dölja dropdowns ---
        function clearAndHideSearch() {
            desktopSearchInput.value = '';
            mobileSearchInput.value = '';
            
            desktopSearchResults.innerHTML = '';
            mobileSearchResults.innerHTML = '';
            desktopSearchResults.style.display = 'none';
            mobileSearchResults.style.display = 'none';
            
            desktopClearSearchBtn.style.display = 'none';
            mobileClearSearchBtn.style.display = 'none';
            
            // Kör en tom sökning för att återställa listan
            applySearchFilter('');
        }

        // --- NYTT: Funktion för att binda lyssnare till dropdown-resultat ---
        // --- ÄNDRAD: Hanterar race condition med isNavigatingViaSearch-flaggan ---
        function addDropdownListeners() {
            document.querySelectorAll('.search-result-item').forEach(item => {
                // Ta bort gamla lyssnare för att undvika dubletter
                item.replaceWith(item.cloneNode(true));
            });
            
            document.querySelectorAll('.search-result-item').forEach(item => {
                item.addEventListener('click', (e) => {
                    e.preventDefault();
                    isNavigatingViaSearch = true; // Sätt flaggan
                    
                    const itemId = e.currentTarget.getAttribute('data-id');
                    
                    // Rensa sökfälten och dölj listan
                    clearAndHideSearch();
                    
                    // Scrolla och markera
                    scrollToAndHighlight(itemId);
                    
                    // Återställ flaggan efter en kort fördröjning
                    setTimeout(() => {
                        isNavigatingViaSearch = false;
                    }, 100); // 100ms för att låta renderingen stabiliseras
                });
            });
        }
        
        // --- ÄNDRAD: sortAndRender tar nu emot söktermen ---
        function sortAndRender(searchTermOverride) {
            let searchTerm = (searchTermOverride !== undefined ? searchTermOverride : desktopSearchInput.value).toLowerCase().trim();
            let processedInventory = [...inventory];
            let syntaxFilterUsed = false;
            let generalSearchTerm = '';

            // --- NYTT: Avancerad sök-syntax ---
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
                        if (value === 0) currentFilter = 'Slut'; // Synka med filter
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
            // --- SLUT NY SYNTAX ---

            // Uppdatera UI för filter-knappar
            categoryFilterBar.querySelectorAll('.btn-secondary').forEach(btn => {
                btn.classList.toggle('active', btn.getAttribute('data-filter') === currentFilter);
            });
            
            // NYTT: Uppdatera filter-märke i headern
            if (currentFilter !== 'Alla') {
                toolbarFilterBadge.textContent = currentFilter.toUpperCase();
                toolbarFilterBadge.style.display = 'inline-flex';
            } else {
                toolbarFilterBadge.style.display = 'none';
            }

            if (currentFilter !== 'Alla' && !syntaxFilterUsed) { // Använd bara om ingen syntax angavs
                if (currentFilter === 'Slut') {
                    processedInventory = processedInventory.filter(item => item.quantity <= 0);
                } else {
                    processedInventory = processedInventory.filter(item => item.quantity > 0 && 
                        (item.category === currentFilter || (currentFilter === 'Motor/Chassi' && (item.category === 'Övrigt' || !item.category)))
                    );
                }
            }

            // --- ÄNDRAD: Spara en ofiltrerad lista för dropdown ---
            let dropdownResults = [];

            if (generalSearchTerm !== '') {
                const searchWords = generalSearchTerm.split(/\s+/).filter(word => word.length > 1 && !stopWords.includes(word));
                if (searchWords.length === 0 && generalSearchTerm.length > 0) { searchWords.push(generalSearchTerm); }

                processedInventory = processedInventory
                    .map(item => ({ ...item, relevanceScore: calculateRelevance(item, searchWords) }))
                    .filter(item => item.relevanceScore > 0)
                    .sort((a, b) => b.relevanceScore - a.relevanceScore);
                
                // --- NYTT: Spara resultaten *innan* kategorifiltret applicerats (om man inte använde syntax)
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
            
            // --- NYTT: Rendera sök-dropdown ---
            // Om syntax användes, visa den filtrerade listan. Annars, visa den ofiltrerade.
            const resultsForDropdown = syntaxFilterUsed ? processedInventory : dropdownResults;
            renderSearchDropdown(generalSearchTerm, resultsForDropdown);

            // --- Slut Huvud-filtrering ---
            renderInventory(processedInventory);

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
                    if(generalSearchTerm === '') { // Använd generalSearchTerm
                        icon.textContent = currentSort.direction === 'asc' ? ' ▲' : ' ▼';
                    }
                }
            }
            
            localStorage.setItem('app_sort', JSON.stringify(currentSort));
            localStorage.setItem('app_filter', currentFilter);
        }

        // --- ÄNDRAD: applySearchFilter tar nu emot söktermen ---
        // --- Och kontrollerar isNavigatingViaSearch-flaggan ---
        function applySearchFilter(term) {
             if (isNavigatingViaSearch) return; // <-- FIXEN FÖR RACE CONDITION
             clearTimeout(window.searchTimeout);
             window.searchTimeout = setTimeout(() => sortAndRender(term), 150);
        }
        
        async function saveInventoryItem(itemData) { const itemRef = doc(db, INVENTORY_COLLECTION, String(itemData.id)); await setDoc(itemRef, itemData); }
        async function deleteInventoryItem(itemId) { const itemRef = doc(db, INVENTORY_COLLECTION, String(itemId)); await deleteDoc(itemRef); }
        
        function setupRealtimeListener() {
            const q = collection(db, INVENTORY_COLLECTION);
            
            onSnapshot(q, (querySnapshot) => {
                const tempInventory = [];
                querySnapshot.forEach((doc) => { tempInventory.push(doc.data()); });
                inventory = tempInventory;
                
                applySearchFilter(desktopSearchInput.value); // Kör en sökning med nuvarande värde
                renderDashboard(inventory); 
                updateCategoryBadges(inventory);
                renderRecentItems(inventory);
                
                // BORTTAGEN: Logik för OrderList
                
                const now = new Date();
                updateSyncStatus('ok', `Synkroniserad ${now.toLocaleTimeString('sv-SE')}`);
                
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
        
        function toggleAddForm() {
            const isCurrentlyOpen = addFormWrapper.classList.contains('open');
            const newState = isCurrentlyOpen ? 'closed' : 'open';
            
            addFormWrapper.classList.toggle('open');
            fabAddBtn.style.opacity = isCurrentlyOpen ? '1' : '0';
            fabAddBtn.style.visibility = isCurrentlyOpen ? 'visible' : 'hidden';
            
            localStorage.setItem('add_form_open_state', newState);
            
            if (newState === 'open') {
                document.getElementById('add_service_filter').focus();
            }
        }
        
        function initializeAddFormState() {
            const storedState = localStorage.getItem('add_form_open_state');
            if (storedState === 'open') { 
                addFormWrapper.classList.add('open'); 
                fabAddBtn.style.opacity = '0';
                fabAddBtn.style.visibility = 'hidden';
            } else {
                fabAddBtn.style.opacity = '1';
                fabAddBtn.style.visibility = 'visible';
            }
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

        function validateForm(form) {
            let isValid = true;
            form.querySelectorAll('.has-error').forEach(el => el.classList.remove('has-error'));
            
            const requiredFields = form.querySelectorAll('[required]');
            requiredFields.forEach(field => {
                if (!field.value || field.value.trim() === '') {
                    isValid = false;
                    const wrapper = field.closest('div');
                    if (wrapper) {
                        wrapper.classList.add('has-error', 'shake'); // NYTT: Lägg till shake
                        setTimeout(() => wrapper.classList.remove('shake'), 500); // NYTT: Ta bort shake
                    }
                }
            });
            return isValid;
        }
        
        function scrollToAndHighlight(itemId) {
            // Konvertera till sträng om det är ett nummer, då data-id är en sträng
            const row = document.querySelector(`.artikel-rad[data-id="${itemId}"]`);
            if (row) {
                row.scrollIntoView({ behavior: 'smooth', block: 'center' });
                
                document.querySelectorAll('.artikel-rad.highlight').forEach(r => r.classList.remove('highlight'));
                
                row.classList.add('highlight');
            }
        }

        async function handleFormSubmit(event) {
            event.preventDefault();
            
            if (!validateForm(addForm)) {
                showToast('Vänligen fyll i alla obligatoriska fält.', 'error');
                return;
            }

            const submitBtn = addForm.querySelector('button[type="submit"]');
            const formData = new FormData(addForm);
            const serviceFilter = (formData.get('service_filter') || '').trim().toUpperCase();

            if (serviceFilter && inventory.some(item => item.service_filter === serviceFilter)) {
                showToast(`Artikelnumret ${serviceFilter} finns redan.`, 'error');
                addForm.querySelector('#add_service_filter').closest('div').classList.add('has-error');
                return; 
            }

            submitBtn.disabled = true; submitBtn.innerHTML = '<span class="icon-span">hourglass_top</span>Sparar...';
            const newItem = {
                id: Date.now(), 
                service_filter: serviceFilter, 
                name: (formData.get('name') || '').trim().toUpperCase(), 
                price: parseFloat(formData.get('price')) || 0.00,
                quantity: parseInt(formData.get('quantity'), 10) || 0,
                category: formData.get('category') || 'Övrigt', 
                notes: (formData.get('notes') || '').trim(),
                link: (formData.get('link') || '').trim(),
                lastUpdated: Date.now() // NYTT: För "Senast Hanterade"
            };
            
            await saveInventoryItem(newItem);
            addForm.reset();
            addFormArtnrWarning.textContent = '';
            submitBtn.disabled = false; submitBtn.innerHTML = '<span class="icon-span">save</span>Spara Artikel';
            if (addFormWrapper.classList.contains('open')) { toggleAddForm(); }
            
            showToast('Artikel sparad!', 'success');
            
            setTimeout(() => scrollToAndHighlight(newItem.id), 300);
        }
        
        function handleRowSelect(id, row) {
            document.querySelectorAll('.artikel-rad').forEach(r => r.classList.remove('selected'));
            if (selectedItemId === id) { selectedItemId = null; } 
            else { selectedItemId = id; row.classList.add('selected'); }
        }

        window.handleEdit = function(id, isOrderMode = false) {
            const item = inventory.find(i => i.id === id);
            if (item) {
                editForm.querySelector('#edit-id').value = item.id;
                editForm.querySelector('#edit-service_filter').value = item.service_filter;
                editForm.querySelector('#edit-name').value = item.name;
                editForm.querySelector('#edit-price').value = item.price;
                editForm.querySelector('#edit-quantity').value = isOrderMode ? 1 : item.quantity;
                editForm.querySelector('#edit-category').value = item.category;
                editForm.querySelector('#edit-notes').value = item.notes;
                editForm.querySelector('#edit-link').value = item.link;
                
                const submitBtn = editForm.querySelector('.btn-primary');
                const titleEl = editModal.querySelector('h3');
                const iconEl = editModal.querySelector('h3 .icon-span');
                
                // --- ÅTERSTÄLLD: Logik för "Beställ"-läge ---
                if (isOrderMode) {
                    titleEl.childNodes[1].nodeValue = ' Beställ Artikel';
                    iconEl.textContent = 'shopping_cart';
                    submitBtn.innerHTML = '<span class="icon-span">check</span>Markera som Beställd';
                } else {
                    titleEl.childNodes[1].nodeValue = ' Redigera Artikel';
                    iconEl.textContent = 'edit';
                    submitBtn.innerHTML = '<span class="icon-span">save</span>Spara Ändringar';
                }
                editModal.style.display = 'flex';
                setTimeout(() => (isOrderMode ? document.getElementById('edit-quantity') : document.getElementById('edit-service_filter')).focus(), 50);
            }
        }

        async function handleEditSubmit(event) {
            event.preventDefault();
            
            if (!validateForm(editForm)) {
                showToast('Vänligen fyll i alla obligatoriska fält.', 'error');
                return;
            }

            const submitBtn = editForm.querySelector('button[type="submit"]');
            const originalHTML = submitBtn.innerHTML;
            submitBtn.disabled = true; submitBtn.innerHTML = '<span class="icon-span">hourglass_top</span>Sparar...';

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
                lastUpdated: Date.now() // NYTT: För "Senast Hanterade"
            };

            // BORTTAGEN: Logik för OrderList

            await saveInventoryItem(updatedItem);
            submitBtn.disabled = false; submitBtn.innerHTML = originalHTML;
            closeEditModal();
            
            showToast('Ändringar sparade!', 'success');
            
            setTimeout(() => scrollToAndHighlight(updatedItem.id), 300);
        }
        
        window.adjustQuantity = async function(id, change) {
            const item = inventory.find(i => i.id === id);
            if (item) {
                const newQuantity = Math.max(0, item.quantity + change);
                const updatedItem = {...item, quantity: newQuantity, lastUpdated: Date.now() }; // NYTT: `lastUpdated`
                await saveInventoryItem(updatedItem);
            }
        }
        
        window.handleDelete = function(id) {
            const item = inventory.find(i => i.id === id);
            showCustomConfirmation(
                `Är du säker på att du vill ta bort <strong>${item.name} (${item.service_filter})</strong>?`,
                async (result) => {
                    if (result) {
                        await deleteInventoryItem(id);
                        // BORTTAGEN: Logik för OrderList
                        showToast('Artikel borttagen', 'info');
                    }
                }, 'Bekräfta Borttagning', true
            );
        }
        
        window.copyToClipboard = (buttonEl, text) => {
            navigator.clipboard.writeText(text).then(() => {
                const originalContent = buttonEl.innerHTML;
                buttonEl.innerHTML = '✅';
                buttonEl.disabled = true;
                
                setTimeout(() => {
                    buttonEl.innerHTML = originalContent;
                    buttonEl.disabled = false;
                }, 1000);
            }).catch(() => {
                showToast('Kunde inte kopiera', 'error');
            });
        };
        
        function closeEditModal() { editModal.style.display = 'none'; }
        function closeConfirmationModal() { confirmationModal.style.display = 'none'; confirmCallback = null; }

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
            
            confirmationModal.style.display = 'flex';
            confirmCallback = callback;
        }
        
        // NYTT: Klistra in och fyll i
        async function handlePasteAndFill() {
            try {
                const text = await navigator.clipboard.readText();
                const parts = text.split(/\s+/); // Dela på blanksteg
                if (parts.length > 0) {
                    const artnr = parts[0].toUpperCase();
                    const name = parts.slice(1).join(' ').toUpperCase();
                    
                    addForm.querySelector('#add_service_filter').value = artnr;
                    if (name) {
                        addForm.querySelector('#add_name').value = name;
                    }
                    showToast('Innehåll inklistrat!', 'success');
                    
                    // Trigga dubblett-koll
                    addForm.querySelector('#add_service_filter').dispatchEvent(new Event('input'));
                }
            } catch (err) {
                showToast('Kunde inte läsa urklipp', 'error');
            }
        }

        // --- NYTT: Funktion för att injicera CSS för sök-dropdown ---
        function injectSearchDropdownCSS() {
            const css = `
                .search-result-item .search-result-content {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    width: 100%;
                }
                .search-result-item .search-result-text {
                    display: flex;
                    flex-direction: column;
                    min-width: 0; /* Förhindra overflow */
                }
                /* Applicera ellipsis på namnet inuti den nya strukturen */
                .search-result-item .search-result-text span {
                    white-space: nowrap;
                    overflow: hidden;
                    text-overflow: ellipsis;
                }
                .search-result-item .search-result-plates {
                    display: flex;
                    gap: 4px;
                    flex-shrink: 0; /* Förhindra att skyltar krymper */
                    margin-left: 10px;
                }
                /* Tvinga "S" att vara vitt, eftersom .search-result-item span annars kan störa */
                .search-result-item .plate-eu-s {
                    color: white !important; 
                }
            `;
            const style = document.createElement('style');
            style.type = 'text/css';
            style.appendChild(document.createTextNode(css));
            document.head.appendChild(style);
        }
        
        function initializeListeners() {
            // --- NYTT: Kör CSS-injektionen ---
            injectSearchDropdownCSS();

            addForm.addEventListener('submit', handleFormSubmit);
            document.getElementById('add-form-cancel-btn').addEventListener('click', () => {
                if (addFormWrapper.classList.contains('open')) {
                    toggleAddForm();
                }
                addForm.reset();
                addFormArtnrWarning.textContent = '';
                addForm.querySelectorAll('.has-error').forEach(el => el.classList.remove('has-error'));
            });
            
            editForm.addEventListener('submit', handleEditSubmit);
            
            // --- ÄNDRAD: Lyssnare för sökfälten ---
            const handleSearchInput = (e) => {
                const term = e.target.value;
                // Synkronisera det andra sökfältet
                if (e.target.id === 'desktop-search-input') {
                    mobileSearchInput.value = term;
                } else {
                    desktopSearchInput.value = term;
                }
                
                // Visa/dölj båda rensa-knapparna
                const showClear = term.length > 0;
                desktopClearSearchBtn.style.display = showClear ? 'block' : 'none';
                mobileClearSearchBtn.style.display = showClear ? 'block' : 'none';
                
                // Anropa sökfunktionen
                applySearchFilter(term);
            };

            desktopSearchInput.addEventListener('input', handleSearchInput);
            mobileSearchInput.addEventListener('input', handleSearchInput);
            
            // --- ÄNDRAD: Lyssnare för rensa-knapparna ---
            const handleClearSearch = () => {
                clearAndHideSearch(); // Använd den nya hjälpfunktionen
                desktopSearchInput.focus(); // Fokusera på desktop-sökfältet som standard
            };

            desktopClearSearchBtn.addEventListener('click', handleClearSearch);
            mobileClearSearchBtn.addEventListener('click', handleClearSearch);
            // --- SLUT ÄNDRINGAR SÖK ---


            addForm.querySelector('#add_service_filter').addEventListener('input', (e) => {
                const value = e.target.value.trim().toUpperCase();
                if (value && inventory.some(item => item.service_filter === value)) {
                    addFormArtnrWarning.textContent = 'Detta artikelnummer finns redan!';
                } else {
                    addFormArtnrWarning.textContent = '';
                }
            });

            if (fabAddBtn) {
                fabAddBtn.addEventListener('click', () => {
                    if (!addFormWrapper.classList.contains('open')) {
                        toggleAddForm();
                    }
                    addFormWrapper.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    document.getElementById('add_service_filter').focus();
                });
            }

            const toolbarAddBtn = document.getElementById('toolbar-add-btn');
            if (toolbarAddBtn) {
                toolbarAddBtn.addEventListener('click', () => {
                    if (!addFormWrapper.classList.contains('open')) {
                        toggleAddForm();
                    }
                    addFormWrapper.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    setTimeout(() => document.getElementById('add_service_filter').focus(), 400);
                });
            }
            
            // NYTT: Tomt-läge "Lägg till"-knapp
            if (emptyStateAddBtn) {
                emptyStateAddBtn.addEventListener('click', () => {
                    if (!addFormWrapper.classList.contains('open')) {
                        toggleAddForm();
                    }
                    addFormWrapper.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    setTimeout(() => document.getElementById('add_service_filter').focus(), 400);
                });
            }
            
            // BORTTAGEN: Gamla sök-lyssnare
            // searchInput.addEventListener('input', () => { clearSearchBtn.style.display = searchInput.value.length > 0 ? 'block' : 'none'; });
            // clearSearchBtn.addEventListener('click', () => { searchInput.value = ''; clearSearchBtn.style.display = 'none'; applySearchFilter(); searchInput.focus(); });
            
            document.querySelectorAll('.lager-container').forEach(c => { c.addEventListener('scroll', () => c.classList.toggle('scrolled', c.scrollTop > 1)); });

            [editModal, confirmationModal].forEach(modal => { // BORTTAGEN: orderListModal
                modal.addEventListener('click', (e) => {
                    if (e.target === modal || e.target.classList.contains('close-btn')) {
                        modal.style.display = 'none';
                    }
                });
            });
            
            document.addEventListener('keydown', (e) => {
                if (e.key === 'Escape') {
                    closeEditModal();
                    closeConfirmationModal();
                    closeAppMenu();
                    // BORTTAGEN: closeOrderListModal();
                    if(globalSearchResults.style.display === 'block') {
                        globalSearchResults.style.display = 'none';
                    }
                    // --- NYTT: Dölj sök-dropdowns ---
                    desktopSearchResults.style.display = 'none';
                    mobileSearchResults.style.display = 'none';
                }
            });
            
            document.querySelectorAll('.header span[data-sort]').forEach(header => {
                header.addEventListener('click', () => {
                    const column = header.getAttribute('data-sort');
                    // --- ÄNDRAD: Rensa sökfältet med nya funktionen ---
                    if (desktopSearchInput.value !== '') { 
                        clearAndHideSearch();
                    }
                    const direction = (currentSort.column === column && currentSort.direction === 'asc') ? 'desc' : 'asc';
                    currentSort = { column, direction };
                    applySearchFilter(''); // Kör tom sökning
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

            document.getElementById('btn-copy-all-links-text').addEventListener('click', (e) => {
                handleCopyAllLinks(e.currentTarget, 'text');
            });
            document.getElementById('btn-copy-all-links-json').addEventListener('click', (e) => {
                handleCopyAllLinks(e.currentTarget, 'json');
            });
            
            quickAddFromSearchBtn.addEventListener('click', () => {
                const artnr = quickAddFromSearchBtn.getAttribute('data-artnr');
                if (!addFormWrapper.classList.contains('open')) {
                    toggleAddForm();
                }
                addForm.querySelector('#add_service_filter').value = artnr;
                globalSearchResults.style.display = 'none';
                addFormWrapper.scrollIntoView({ behavior: 'smooth', block: 'start' });
                setTimeout(() => addForm.querySelector('#add_name').focus(), 300);
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
            
            if (dashboardContainer) {
                dashboardContainer.addEventListener('click', (e) => {
                    const statCard = e.target.closest('.dashboard-stat');
                    if (statCard && statCard.dataset.filterTarget) {
                        const filter = statCard.dataset.filterTarget;
                        currentFilter = filter;
                        categoryFilterBar.querySelectorAll('.btn-secondary').forEach(btn => {
                            btn.classList.toggle('active', btn.getAttribute('data-filter') === currentFilter);
                        });
                        applySearchFilter(desktopSearchInput.value); // Behåll söktermen
                        closeAppMenu();
                    }
                });
            }

            appMenuBtn.addEventListener('click', openAppMenu);
            appMenuOverlay.addEventListener('click', closeAppMenu);
            appMenuCloseBtn.addEventListener('click', closeAppMenu);
            
            // BORTTAGEN: Listeners för OrderList
            
            // NYTT: Exportera-knappar
            exportCsvBtn.addEventListener('click', exportToCSV);
            exportJsonBtn.addEventListener('click', exportToJSON);

            // NYTT: Klistra in-knapp
            pasteArtnrBtn.addEventListener('click', handlePasteAndFill);

            // NYTT: Snabb-kategori knappar
            quickCategoryBtns.forEach(btn => {
                btn.addEventListener('click', () => {
                    const category = btn.getAttribute('data-category');
                    addForm.querySelector('#add_category').value = category;
                });
            });

            // BORTTAGEN: Skanna-knappar

            const backToTopBtn = document.getElementById('back-to-top-btn');
            if (backToTopBtn) {
                window.addEventListener('scroll', () => { backToTopBtn.style.display = window.scrollY > 300 ? 'flex' : 'none'; });
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
                            // --- ÄNDRAD: Rensa sökfältet med nya funktionen ---
                            if(desktopSearchInput.value) {
                                clearAndHideSearch();
                            }
                            applySearchFilter(''); // Kör tom sökning
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
        initializeAddFormState(); 
        initializeCollapseState();
        loadPersistentState();
        // BORTTAGEN: loadOrderListFromStorage();
        initializeListeners(); 
        renderSearchHistory();
        setupRealtimeListener();

    } catch (e) {
        console.error("App Initialization Error:", e);
        updateSyncStatus('error', 'Initieringsfel!'); 
        if(initialLoader) initialLoader.querySelector('p').textContent = 'Kritiskt fel vid initiering.';
    }
});
