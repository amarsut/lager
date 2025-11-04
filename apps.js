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
        const emptyStateAddBtn = document.getElementById('empty-state-add-btn'); 
        
        const desktopSearchInput = document.getElementById('desktop-search-input');
        const mobileSearchInput = document.getElementById('mobile-search-input');
        const desktopClearSearchBtn = document.getElementById('desktop-clear-search-btn');
        const mobileClearSearchBtn = document.getElementById('mobile-clear-search-btn');
        const desktopSearchResults = document.getElementById('desktop-search-results');
        const mobileSearchResults = document.getElementById('mobile-search-results');
        
        const addFormWrapper = document.getElementById('add-form-wrapper');
        const addForm = document.getElementById('add-article-form');
        const addFormArtnrWarning = document.getElementById('add-form-artnr-warning');
        const editModal = document.getElementById('editModal');
        const editForm = document.getElementById('edit-article-form');
        const confirmationModal = document.getElementById('confirmationModal');
        const actionsModal = document.getElementById('actionsModal'); // NYTT: Åtgärdsmodal
        const syncStatusElement = document.getElementById('sync-status');
        
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

        // Toolbar
        const toolbarFilterBadge = document.getElementById('toolbar-filter-badge'); 

        // Formulär-hjälpmedel
        const pasteArtnrBtn = document.getElementById('paste-artnr-btn'); 
        const quickCategoryBtns = document.querySelectorAll('.quick-category-btn'); 

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
                                    <span class="history-term">${escapeHTML(term)}</span>
                                    <i class="delete-history" data-term="${escapeHTML(term)}">&times;</i>
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
        
        // --- NYTT: Normaliserar artikelnummer för sökning ---
        function normalizeArtNr(artNr) {
            if (!artNr) return null;
            return artNr.replace(/[\s-]/g, ''); // Tar bort mellanslag och bindestreck
        }
        
        function generateAeroMLink(f) { const s = normalizeArtNr(f); if (!s) return null; return `https://aeromotors.se/sok?s=${s}&layered_id_feature_1586%5B%5D=3&sort_by=price.asc`; }
        function generateTrodoLink(f) { const s = normalizeArtNr(f); if (!s) return null; const q = encodeURIComponent(s); return `https://www.trodo.se/catalogsearch/result/premium?filter[quality_group]=2&product_list_dir=asc&product_list_order=price&q=${q}`; }
        function generateThansenLink(f) { const s = normalizeArtNr(f); if (!s) return null; const q = encodeURIComponent(s); return `https://www.thansen.se/search/?query=${q}`; }
        function generateSkruvatLink(f) { const s = normalizeArtNr(f); if (!s) return null; const q = encodeURIComponent(s); return `https://skruvat.se/search?q=${q}`; }
        function generateVortoLink(f) { const s = normalizeArtNr(f); if (!s) return null; const q = encodeURIComponent(s); return `https://vorto.se/sok?search=${q}`; }
        function generateAutodocLink(f) { const s = normalizeArtNr(f); if (!s) return null; const q = encodeURIComponent(s); return `https://autodoc.se/search?keyword=${q}`; }
        function generateBildelsbasenLink(f) { const s = normalizeArtNr(f); if (!s) return null; const q = encodeURIComponent(s); return `https://bildelsbasen.se/sv-se/OEM/${q}`; }
        function generateReservdelar24Link(f) { const s = normalizeArtNr(f); if (!s) return null; const q = encodeURIComponent(s); return `https://reservdelar24.se/suche.html?keyword=${q}`; }
        
        window.toggleDropdown = function(id) { const d = document.getElementById(id); if (!d) return; document.querySelectorAll('.dropdown-menu.visible').forEach(o => { if (o.id !== id) o.classList.remove('visible'); }); d.classList.toggle('visible'); };
        window.closeDropdown = function(id) { const d = document.getElementById(id); if (d) d.classList.remove('visible'); };
        
        document.addEventListener('click', (e) => {
            if (!e.target.closest('.search-wrapper') && !e.target.closest('#sticky-search-bar')) {
                desktopSearchResults.style.display = 'none';
                mobileSearchResults.style.display = 'none';
            }
            if (!e.target.closest('.link-dropdown-container')) {
                document.querySelectorAll('.dropdown-menu.visible').forEach(d => d.classList.remove('visible'));
            }
        });


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

        async function handleGlobalSearch(searchTermOverride) {
            const searchTerm = (searchTermOverride ? searchTermOverride.trim() : globalSearchInput.value.trim());
            if (searchTerm === '') {
                globalSearchResults.style.display = 'none';
                return;
            }
            
            globalSearchBtn.disabled = true;
            saveSearchToHistory(searchTerm.toUpperCase()); 
            
            // --- REG-NR KONTROLL ---
            const regNrRegex = /^[A-ZÅÄÖ]{3}[\s]?[0-9]{2}[A-ZÅÄÖ0-9]{1}$/i; // i-flagg för case-insensitive
            const cleanRegNr = searchTerm.replace(/\s/g, '').toUpperCase(); 
            
            if (regNrRegex.test(searchTerm) || (cleanRegNr.length === 6 && regNrRegex.test(cleanRegNr))) {
                
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
                
                globalSearchResults.scrollIntoView({ behavior: 'smooth', block: 'start' });
                globalSearchBtn.disabled = false;
                return; 
            }
            
            // --- ARTIKELNUMMER-SÖKNING ---
            biluppgifterResultContainer.style.display = 'none';
            
            try {
                internalResultsContainer.innerHTML = '';
                externalResultsContainer.innerHTML = '';
                exportLinksContainer.style.display = 'none';
                searchDisclaimer.style.display = 'none';
                globalSearchResults.style.display = 'block';
                currentExternalLinks = []; 
                
                globalSearchResults.scrollIntoView({ behavior: 'smooth', block: 'start' });

                // --- ÄNDRAD: Normalisera söktermen för artikelnummer ---
                const normalizedSearchTerm = normalizeArtNr(searchTerm.toUpperCase());
                
                // 1. Interna resultat
                const internalMatches = inventory.filter(item => {
                    const normalizedItemArtNr = normalizeArtNr(item.service_filter || '');
                    return (normalizedItemArtNr && normalizedItemArtNr.includes(normalizedSearchTerm)) || 
                           (item.name || '').toUpperCase().includes(searchTerm.toUpperCase());
                });

                let internalHTML = '';
                if (internalMatches.length > 0) {
                    internalHTML = '<h4 class="internal-search-title">Hittades i ditt lager:</h4>';
                    internalMatches.forEach(item => { 
                        internalHTML += `<a href="#" class="internal-result-item" data-id="${item.id}"><div><strong>${escapeHTML(item.service_filter)}</strong> - ${escapeHTML(item.name)}</div><span>Antal: ${item.quantity}</span></a>`; 
                    });
                } else {
                    internalHTML = '<h4 class="internal-search-title">Inga träffar i ditt lager</h4>';
                }
                internalResultsContainer.innerHTML = internalHTML;
                if (internalMatches.length === 0) {
                    quickAddFromSearchBtn.innerHTML = `<span class="icon-span">add_circle</span>Lägg till "${escapeHTML(searchTerm.toUpperCase())}" i lagret`;
                    quickAddFromSearchBtn.setAttribute('data-artnr', searchTerm.toUpperCase());
                    internalResultsContainer.appendChild(quickAddFromSearchBtn);
                }


                // 2. Externa resultat (använder den *onormaliserade* termen, då länk-generatorerna normaliserar själva)
                let externalHTML = '';
                let hasDisclaimer = false;
                
                externalSearchProviders.forEach(provider => {
                    const link = provider.linkGenerator(searchTerm); // Skicka den ursprungliga termen
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
                        // Detta händer sällan nu, men bra att ha kvar
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
            downloadFile(dataStr, 'lager_export.json', 'application/json');
        }

        function exportToCSV() {
            if (inventory.length === 0) {
                showToast('Lagret är tomt, inget att exportera', 'info');
                return;
            }
            
            const allKeys = inventory.reduce((keys, item) => {
                Object.keys(item).forEach(key => {
                    if (!keys.includes(key)) {
                        keys.push(key);
                    }
                });
                return keys;
            }, []);

            allKeys.sort((a, b) => {
                if (a === 'id') return -1;
                if (b === 'id') return 1;
                if (a === 'service_filter') return -1;
                if (b === 'service_filter') return 1;
                if (a === 'name') return -1;
                if (b === 'name') return 1;
                return a.localeCompare(b);
            });

            const headers = allKeys.join(',');
            
            const rows = inventory.map(item => {
                return allKeys.map(key => {
                    let value = item[key];
                    if (value === null || value === undefined) {
                        value = '';
                    }
                    let strValue = String(value);
                    if (strValue.includes(',') || strValue.includes('"') || strValue.includes('\n')) {
                        strValue = `"${strValue.replace(/"/g, '""')}"`;
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
        
        function renderRecentItems(currentInventory) {
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
                                <span class="recent-item-category">${escapeHTML(item.category || 'Övrigt')}</span>
                                <strong>${escapeHTML(item.service_filter)}</strong>
                                <span>${escapeHTML(item.name)}</span>
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
            syncStatusElement.classList.remove('flash');
            syncStatusElement.className = `sync-${status}`;
            syncStatusElement.title = message;
            const textEl = syncStatusElement.querySelector('.text');
            if (textEl) textEl.textContent = message;
        }

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

        function parseNotes(notesText) {
            if (!notesText) return '';
            
            const plateRegex = /\[([A-ZÅÄÖ0-9]{1,3}[\s]?[A-ZÅÄÖ0-9]{1,3})\]/gi;
            const parts = notesText.split(plateRegex);
            let html = '';

            for (let i = 0; i < parts.length; i++) {
                if (i % 2 === 1) {
                    const plateContent = parts[i].toUpperCase();
                    html += `<span class="plate-tag">
                                <span class="plate-eu-s">S</span>
                                <span class="plate-text">${escapeHTML(plateContent)}</span>
                             </span>`;
                } else if (parts[i]) {
                    html += `<span class="notes-text-part">${escapeHTML(parts[i])}</span>`;
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
                html += `<span class="plate-tag">
                            <span class="plate-eu-s">S</span>
                            <span class="plate-text">${escapeHTML(plateContent)}</span>
                         </span>`;
            }
            return html;
        }
        
        // --- NYTT: Funktion för Åtgärdsmodal ---
        function closeActionsModal() {
            if (actionsModal) {
                actionsModal.style.display = 'none';
                const buttonContainer = document.getElementById('actionsModalButtons');
                if (buttonContainer) {
                    buttonContainer.innerHTML = '';
                }
            }
        }
        window.closeActionsModal = closeActionsModal; // Exponera globalt

        window.showActionsModal = function(id) {
            const item = inventory.find(i => i.id === id);
            if (!item) return;

            const titleEl = document.getElementById('actionsModalTitle');
            const subtitleEl = document.getElementById('actionsModalSubtitle');
            const buttonContainer = document.getElementById('actionsModalButtons');

            if (!titleEl || !subtitleEl || !buttonContainer) return;

            titleEl.innerHTML = '<span class="icon-span">settings</span>Åtgärder';
            subtitleEl.textContent = `${escapeHTML(item.name)} (${escapeHTML(item.service_filter)})`;

            const trodoLink = generateTrodoLink(item.service_filter);
            const aeroMLink = generateAeroMLink(item.service_filter);
            const thansenLink = generateThansenLink(item.service_filter);
            const egenLink = item.link;

            let buttonsHTML = '';

            // Länk-knappar
            if (trodoLink) {
                buttonsHTML += `<button class="action-modal-btn link-trodo" onclick="window.open('${trodoLink}', '_blank'); closeActionsModal(); event.stopPropagation();">
                                    <span class="icon-span">open_in_new</span>Sök på Trodo
                                </button>`;
            }
            if (aeroMLink) {
                buttonsHTML += `<button class="action-modal-btn link-aero" onclick="window.open('${aeroMLink}', '_blank'); closeActionsModal(); event.stopPropagation();">
                                    <span class="icon-span">open_in_new</span>Sök på AeroMotors
                                </button>`;
            }
            if (thansenLink) {
                buttonsHTML += `<button class="action-modal-btn link-thansen" onclick="window.open('${thansenLink}', '_blank'); closeActionsModal(); event.stopPropagation();">
                                    <span class="icon-span">open_in_new</span>Sök på Thansen
                                </button>`;
            }
            if (egenLink) {
                buttonsHTML += `<button class="action-modal-btn link-egen" onclick="window.open('${egenLink}', '_blank'); closeActionsModal(); event.stopPropagation();">
                                    <span class="icon-span">open_in_new</span>Öppna Egen Länk
                                </button>`;
            }
            
            // Åtgärds-knappar
            buttonsHTML += `<button class="action-modal-btn" onclick="handleEdit(${item.id}); closeActionsModal(); event.stopPropagation();">
                                <span class="icon-span">edit</span>Redigera Artikel
                            </button>`;
            
            buttonsHTML += `<button class="action-modal-btn danger" onclick="handleDelete(${item.id}); closeActionsModal(); event.stopPropagation();">
                                <span class="icon-span">delete</span>Ta bort Artikel
                            </button>`;

            buttonContainer.innerHTML = buttonsHTML;
            actionsModal.style.display = 'flex';
            
            // Fokusera på första knappen i modalen
            setTimeout(() => {
                const firstButton = buttonContainer.querySelector('button');
                if (firstButton) {
                    firstButton.focus();
                }
            }, 50);
        }
        // --- SLUT ÅTGÄRDSMODAL ---

        function createInventoryRow(item, isOutOfStock) {
            const row = document.createElement('div');
            row.className = 'artikel-rad';
            row.setAttribute('data-id', item.id);
            row.onclick = () => handleRowSelect(item.id, row);
            if (selectedItemId === item.id) {
                row.classList.add('selected');
            }

            const statusClass = item.quantity > 0 ? 'i-lager' : 'slut';
            const statusText = item.quantity > 0 ? 'I lager' : 'Slut';
            const formattedNotes = parseNotes(item.notes || '');
            const safeServiceFilter = escapeHTML(item.service_filter).replace(/'/g, "\\'");
            
            const trodoLink = generateTrodoLink(item.service_filter);
            const aeroMLink = generateAeroMLink(item.service_filter);
            const egenLink = item.link;
            
            const primarySearchLink = trodoLink || aeroMLink || egenLink;
            const primarySearchText = trodoLink ? 'Trodo' : (aeroMLink ? 'AeroMotors' : (egenLink ? 'Egen Länk' : ''));

            row.innerHTML = `
                <span class="cell-copy-wrapper" title="${escapeHTML(item.service_filter)}">
                    ${primarySearchLink ? `
                        <button class="search-btn" onclick="window.open('${primarySearchLink}', '_blank'); event.stopPropagation();" title="Sök på ${primarySearchText}">
                            <svg viewBox="0 0 16 16" xmlns="http://www.w3.org/2000/svg"><path d="M11.742 10.344a6.5 6.5 0 1 0-1.397 1.398h-.001c.03.04.062.078.098.115l3.85 3.85a1 1 0 0 0 1.415-1.414l-3.85-3.85a1.007 1.007 0 0 0-.115-.1zM12 6.5a5.5 5.5 0 1 1-11 0 5.5 5.5 0 0 1 11 0z"/></svg>
                        </button>
                    ` : ''}
                    <button class="copy-btn" onclick="copyToClipboard(this, '${safeServiceFilter}'); event.stopPropagation();" title="Kopiera Artikelnummer">&#x1F4CB;</button>
                    <span class="cell-copy-text artnr-cell-text">${escapeHTML(item.service_filter)}</span>
                </span>

                <span class="cell-copy-wrapper" title="${escapeHTML(item.name)}">
                    <span class="cell-copy-text">${escapeHTML(item.name)}</span>
                </span>

                <span>${formatPrice(item.price)} kr</span>

                <div class="quantity-cell">
                    <button class="qty-btn" onclick="adjustQuantity(${item.id}, -1); event.stopPropagation();">-</button>
                    <span>${item.quantity}</span>
                    <button class="qty-btn" onclick="adjustQuantity(${item.id}, 1); event.stopPropagation();">+</button>
                </div>

                <span style="display: flex; align-items: center;">
                    <span class="${statusClass}">${statusText}</span>
                </span>

                <span class="notes-cell" title="${escapeHTML(item.notes || '')}">${formattedNotes}</span>

                <div class="action-buttons" style="justify-content: center;">
                    <button class="action-menu-btn" onclick="showActionsModal(${item.id}); event.stopPropagation();" title="Visa åtgärder">
                        <span class="icon-span">more_horiz</span>
                    </button>
                </div>
            `;
            
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
            
            const totalItems = inventory.length; 
            if (totalItems === 0) {
                fullEmptyState.style.display = 'flex';
                serviceTitle.style.display = 'none'; serviceWrapper.style.display = 'none';
                motorTitle.style.display = 'none'; motorWrapper.style.display = 'none';
                andraTitle.style.display = 'none'; andraWrapper.style.display = 'none';
                slutILagerSektion.style.display = 'none';
            } else {
                fullEmptyState.style.display = 'none';
            }

            const currentSearchTerm = desktopSearchInput.value;
            if (currentSearchTerm.length > 0) {
                Object.values(emptyStates).forEach(el => {
                    if (el.style.display === 'flex') {
                        el.querySelector('h4').textContent = 'Inga träffar';
                        el.querySelector('p').textContent = `Din sökning på "${escapeHTML(currentSearchTerm)}" gav inga resultat.`;
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
            let score = 0; 
            
            // --- ÄNDRAD: Använd normaliserat artikelnummer för relevans ---
            const serviceFilter = normalizeArtNr((item.service_filter || ''));
            const name = (item.name || '').toLowerCase(); 
            const notes = (item.notes || '').toLowerCase(); 
            const category = (item.category || '').toLowerCase();
            
            searchWords.forEach(word => {
                // --- ÄNDRAD: Normalisera även sökordet på samma sätt ---
                const cleanWord = normalizeArtNr(word); 
                
                if (serviceFilter.includes(cleanWord)) { score += 5; } 
                if (name.includes(word)) { score += 3; } // Behåll onormaliserat för namn
                if (category.includes(word)) { score += 2; } 
                if (notes.includes(word)) { score += 1; } 
                if (serviceFilter === cleanWord || name === word) { score += 5; }
            }); 
            return score;
        }

        function renderSearchDropdown(searchTerm, results) {
            if (searchTerm.length < 1 || results.length === 0) {
                desktopSearchResults.innerHTML = '';
                mobileSearchResults.innerHTML = '';
                desktopSearchResults.style.display = 'none';
                mobileSearchResults.style.display = 'none';
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
            desktopSearchResults.style.display = 'none';
            mobileSearchResults.style.display = 'none';
            
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
            } else {
                toolbarFilterBadge.style.display = 'none';
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
                // --- ÄNDRAD: Skicka *onormaliserade* sökord till relevansberäkningen ---
                const searchWords = generalSearchTerm.split(/\s+/).filter(word => word.length > 0 && !stopWords.includes(word));
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
            const q = collection(db, INVENTORY_COLLECTION);
            
            onSnapshot(q, (querySnapshot) => {
                const tempInventory = [];
                querySnapshot.forEach((doc) => { tempInventory.push(doc.data()); });
                inventory = tempInventory;
                
                applySearchFilter(desktopSearchInput.value); 
                renderDashboard(inventory); 
                updateCategoryBadges(inventory);
                renderRecentItems(inventory);
                
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
        
        function toggleAddForm() {
            const isCurrentlyOpen = addFormWrapper.classList.contains('open');
            const newState = isCurrentlyOpen ? 'closed' : 'open';
            
            addFormWrapper.classList.toggle('open');
            fabAddBtn.classList.toggle('open'); 
            
            localStorage.setItem('add_form_open_state', newState);
            
            if (newState === 'open') {
                document.getElementById('add_service_filter').focus();
            }
        }
        
        function initializeAddFormState() {
            const storedState = localStorage.getItem('add_form_open_state');
            if (storedState === 'open') { 
                addFormWrapper.classList.add('open'); 
                fabAddBtn.classList.add('open'); 
            } else {
                addFormWrapper.classList.remove('open');
                fabAddBtn.classList.remove('open'); 
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
                        wrapper.classList.add('has-error', 'shake'); 
                        setTimeout(() => wrapper.classList.remove('shake'), 500); 
                    }
                }
            });
            return isValid;
        }
        
        function scrollToAndHighlight(itemId) {
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

            // --- ÄNDRAD: Normalisera för dubblettkontroll ---
            const normalizedServiceFilter = normalizeArtNr(serviceFilter);
            if (normalizedServiceFilter && inventory.some(item => normalizeArtNr(item.service_filter) === normalizedServiceFilter)) {
                showToast(`Artikelnumret ${escapeHTML(serviceFilter)} finns redan.`, 'error');
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
                lastUpdated: Date.now() 
            };
            
            await saveInventoryItem(newItem);
            addForm.reset();
            addFormArtnrWarning.textContent = '';
            quickCategoryBtns.forEach(b => b.classList.remove('active')); 
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
                
                // NYTT: Fokusera och välj text i första fältet
                setTimeout(() => {
                    const firstInput = document.getElementById(isOrderMode ? 'edit-quantity' : 'edit-service_filter');
                    firstInput.focus();
                    firstInput.select();
                }, 50);
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
                lastUpdated: Date.now() 
            };

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
                const updatedItem = {...item, quantity: newQuantity, lastUpdated: Date.now() }; 
                await saveInventoryItem(updatedItem);
            }
        }
        
        window.handleDelete = function(id) {
            const item = inventory.find(i => i.id === id);
            showCustomConfirmation(
                `Är du säker på att du vill ta bort <strong>${escapeHTML(item.name)} (${escapeHTML(item.service_filter)})</strong>?`,
                async (result) => {
                    if (result) {
                        await deleteInventoryItem(id);
                        showToast('Artikel borttagen', 'info');
                    }
                }, 'Bekräfta Borttagning', true
            );
        }
        
        window.copyToClipboard = (buttonEl, text) => {
            const row = buttonEl.closest('.artikel-rad'); 
            
            navigator.clipboard.writeText(text).then(() => {
                const originalContent = buttonEl.innerHTML;
                buttonEl.innerHTML = '✅';
                buttonEl.disabled = true;
                
                if (row) {
                    row.classList.add('flash-success');
                    setTimeout(() => row.classList.remove('flash-success'), 800);
                }
                
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
            
            // Fokusera på "Ja"-knappen
            setTimeout(() => yesBtn.focus(), 50);
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
        
        // --- NYTT: Funktion för "Focus Trap" i modals ---
        function trapFocus(modalElement) {
            const focusableElements = modalElement.querySelectorAll(
                'a[href]:not([disabled]), button:not([disabled]), textarea:not([disabled]), input[type="text"]:not([disabled]), input[type="radio"]:not([disabled]), input[type="checkbox"]:not([disabled]), input[type="number"]:not([disabled]), select:not([disabled])'
            );
            const firstElement = focusableElements[0];
            const lastElement = focusableElements[focusableElements.length - 1];
            
            modalElement.addEventListener('keydown', (e) => {
                if (e.key !== 'Tab') return;

                if (e.shiftKey) { // Shift + Tab
                    if (document.activeElement === firstElement) {
                        lastElement.focus();
                        e.preventDefault();
                    }
                } else { // Tab
                    if (document.activeElement === lastElement) {
                        firstElement.focus();
                        e.preventDefault();
                    }
                }
            });
        }
        
        function initializeListeners() {
            addForm.addEventListener('submit', handleFormSubmit);
            document.getElementById('add-form-cancel-btn').addEventListener('click', () => {
                if (addFormWrapper.classList.contains('open')) {
                    toggleAddForm();
                }
                addForm.reset();
                addFormArtnrWarning.textContent = '';
                addForm.querySelectorAll('.has-error').forEach(el => el.classList.remove('has-error'));
                quickCategoryBtns.forEach(b => b.classList.remove('active')); 
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
            
            const handleClearSearch = () => {
                clearAndHideSearch(); 
                desktopSearchInput.focus(); 
            };

            desktopClearSearchBtn.addEventListener('click', handleClearSearch);
            mobileClearSearchBtn.addEventListener('click', handleClearSearch);

            addForm.querySelector('#add_service_filter').addEventListener('input', (e) => {
                const value = e.target.value.trim().toUpperCase();
                // --- ÄNDRAD: Normalisera för dubblettkontroll ---
                const normalizedValue = normalizeArtNr(value);
                if (normalizedValue && inventory.some(item => normalizeArtNr(item.service_filter) === normalizedValue)) {
                    addFormArtnrWarning.textContent = 'Detta artikelnummer finns redan!';
                } else {
                    addFormArtnrWarning.textContent = '';
                }
            });

            if (fabAddBtn) {
                fabAddBtn.addEventListener('click', () => {
                    toggleAddForm(); 
                    if (addFormWrapper.classList.contains('open')) {
                        addFormWrapper.scrollIntoView({ behavior: 'smooth', block: 'center' });
                        document.getElementById('add_service_filter').focus();
                    }
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
            
            if (emptyStateAddBtn) {
                emptyStateAddBtn.addEventListener('click', () => {
                    if (!addFormWrapper.classList.contains('open')) {
                        toggleAddForm();
                    }
                    addFormWrapper.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    setTimeout(() => document.getElementById('add_service_filter').focus(), 400);
                });
            }
            
            document.querySelectorAll('.lager-container').forEach(c => { c.addEventListener('scroll', () => c.classList.toggle('scrolled', c.scrollTop > 1)); });

            editModal.addEventListener('click', (e) => {
                if (e.target === editModal || e.target.classList.contains('close-btn')) {
                    closeEditModal();
                }
            });
            confirmationModal.addEventListener('click', (e) => {
                if (e.target === confirmationModal || e.target.classList.contains('close-btn')) {
                    closeConfirmationModal();
                }
            });
            actionsModal.addEventListener('click', (e) => {
                if (e.target === actionsModal || e.target.classList.contains('close-btn')) {
                    closeActionsModal();
                }
            });
            
            // --- NYTT: Applicera Focus Trap på modals ---
            trapFocus(editModal);
            trapFocus(confirmationModal);
            trapFocus(actionsModal);
            
            document.addEventListener('keydown', (e) => {
                if (e.key === 'Escape') {
                    closeEditModal();
                    closeConfirmationModal();
                    closeActionsModal(); 
                    closeAppMenu();
                    if(globalSearchResults.style.display === 'block') {
                        globalSearchResults.style.display = 'none';
                    }
                    desktopSearchResults.style.display = 'none';
                    mobileSearchResults.style.display = 'none';
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

            pasteArtnrBtn.addEventListener('click', handlePasteAndFill);

            quickCategoryBtns.forEach(btn => {
                btn.addEventListener('click', () => {
                    const category = btn.getAttribute('data-category');
                    addForm.querySelector('#add_category').value = category;
                    quickCategoryBtns.forEach(b => b.classList.remove('active'));
                    btn.classList.add('active');
                    // NYTT: Flytta fokus till "Anteckningar" för snabbare arbetsflöde
                    addForm.querySelector('#add_notes').focus();
                });
            });
            
            addForm.querySelector('#add_category').addEventListener('change', (e) => {
                const selectedCategory = e.target.value;
                quickCategoryBtns.forEach(btn => {
                    btn.classList.toggle('active', btn.getAttribute('data-category') === selectedCategory);
                });
            });

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
        initializeAddFormState(); 
        initializeCollapseState();
        loadPersistentState();
        initializeListeners(); 
        renderSearchHistory();
        setupRealtimeListener();

    } catch (e) {
        console.error("App Initialization Error:", e);
        const loader = document.getElementById('initial-loader');
        if(loader) loader.querySelector('p').textContent = 'Kritiskt fel vid initiering.';
        else console.error("Kunde inte visa felmeddelande i UI.");
    }
});
