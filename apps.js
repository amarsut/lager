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
        // BORTTAGEN: const toggleBtn = document.getElementById('toggle-add-form-btn');
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
        
        // --- NYA DOM-ELEMENT ---
        const initialLoader = document.getElementById('initial-loader');
        const themeToggle = document.getElementById('theme-toggle-cb');
        // UPPDATERAD: PWA-knappen har flyttats till toolbaren
        const pwaInstallBtnToolbar = document.getElementById('pwa-install-btn-toolbar'); 
        const toolbarAddBtn = document.getElementById('toolbar-add-btn'); // NY KNAPP I TOOLBAR
        const categoryFilterBar = document.getElementById('category-filter-bar');
        const fabAddBtn = document.getElementById('fab-add-btn');
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
        let currentFilter = 'Alla'; 
        let confirmCallback = null; 
        let deferredInstallPrompt = null;
        
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
        
        window.toggleDropdown = function(id) { const d = document.getElementById(id); if (!d) return; document.querySelectorAll('.dropdown-menu.visible, .settings-dropdown-menu.visible').forEach(o => { if (o.id !== id) o.classList.remove('visible'); }); d.classList.toggle('visible'); };
        window.closeDropdown = function(id) { const d = document.getElementById(id); if (d) d.classList.remove('visible'); };
        document.addEventListener('click', (e) => { 
            if (!e.target.closest('.link-dropdown-container') && !e.target.closest('.settings-dropdown-container')) { 
                document.querySelectorAll('.dropdown-menu.visible, .settings-dropdown-menu.visible').forEach(d => d.classList.remove('visible')); 
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

        // --- Temahanterare ---
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
        
        // --- Toast Notis-system ---
        function showToast(message, type = 'info') {
            const container = document.getElementById('toast-container');
            if (!container) return;

            const toast = document.createElement('div');
            toast.className = `toast ${type}`; // success, error, info
            
            let icon = 'ℹ️';
            if (type === 'success') icon = '✅';
            if (type === 'error') icon = '❌';
            
            toast.innerHTML = `<span class="toast-icon">${icon}</span> ${message}`;
            container.appendChild(toast);

            setTimeout(() => {
                toast.classList.add('exiting');
                toast.addEventListener('animationend', () => {
                    toast.remove();
                });
            }, 3000); // Visa i 3 sekunder
        }
        
        // --- PWA Installationshanterare (Uppdaterad för nya knappen) ---
        window.addEventListener('beforeinstallprompt', (e) => {
            e.preventDefault(); // Förhindra att webbläsaren visar sin egen prompt
            deferredInstallPrompt = e; // Spara händelsen
            if(pwaInstallBtnToolbar) pwaInstallBtnToolbar.style.display = 'flex'; // Visa den nya toolbar-knappen
        });

        async function handlePwaInstall() {
            if (deferredInstallPrompt) {
                deferredInstallPrompt.prompt(); // Visa webbläsarens installationsdialog
                const { outcome } = await deferredInstallPrompt.userChoice;
                if (outcome === 'accepted') {
                    console.log('Användaren installerade appen');
                    if(pwaInstallBtnToolbar) pwaInstallBtnToolbar.style.display = 'none'; // Dölj den nya knappen
                } else {
                    console.log('Användaren avböjde installationen');
                }
                deferredInstallPrompt = null; // Rensa händelsen
            }
        }

        // ----------------------------------------------------------------------
        // GRÄNSSNITT OCH HUVUDFUNKTIONER (UPPDATERADE)
        // ----------------------------------------------------------------------
        function renderDashboard(currentInventory) {
            const inStock = currentInventory.filter(item => item.quantity > 0);
            const totalValue = inStock.reduce((sum, item) => {
                return sum + (item.price * item.quantity);
            }, 0);
            const inStockItems = inStock.length;
            const outOfStockItems = currentInventory.length - inStockItems;

            statTotalValue.textContent = `${formatPrice(totalValue)} kr`;
            statTotalItems.textContent = inStockItems;
            statOutOfStock.textContent = outOfStockItems;
        }

        // --- UPPDATERAR KATEGORIETIKETTER ---
        function updateCategoryBadges(currentInventory) {
            const serviceItems = currentInventory.filter(i => i.category === 'Service' && i.quantity > 0);
            const motorItems = currentInventory.filter(i => (i.category === 'Motor/Chassi' || i.category === 'Övrigt' || !i.category) && i.quantity > 0);
            const andraItems = currentInventory.filter(i => i.category === 'Andra Märken' && i.quantity > 0);
            const outOfStock = currentInventory.filter(i => i.quantity <= 0);

            badges.service.textContent = serviceItems.length;
            badges.motorChassi.textContent = motorItems.length;
            badges.andraMarken.textContent = andraItems.length;
            document.getElementById('badge-slut-i-lager').textContent = outOfStock.length;
        }

        function createArtikelRad(item) {
            const statusText = item.quantity > 0 ? 'I lager' : 'Slut';
            const statusClass = item.quantity > 0 ? 'i-lager' : 'slut';
            const statusHtml = `<span class="${statusClass}">${statusText}</span>`;
            const trodoLink = generateTrodoLink(item.service_filter);
            const aeroMLink = generateAeroMLink(item.service_filter);
            const thansenLink = generateThansenLink(item.service_filter);
            const egenLink = item.link;

            let primaryButtonHTML = '';
            if (trodoLink) { primaryButtonHTML = `<button class="lank-knapp trodo-btn" onclick="window.open('${trodoLink}', '_blank'); event.stopPropagation();">Trodo</button>`; }

            let linkCellContent = '';
            if (primaryButtonHTML) { linkCellContent += primaryButtonHTML; }

            const hasSecondaryLinks = aeroMLink || thansenLink || egenLink;
            if (hasSecondaryLinks) {
                const dropdownId = `link-dropdown-${item.id}`;
                let secondaryButtonsHTML = '';
                if (aeroMLink) { secondaryButtonsHTML += `<button class="lank-knapp aero-m-btn" onclick="window.open('${aeroMLink}', '_blank'); closeDropdown('${dropdownId}'); event.stopPropagation();">Aero M</button>`; }
                if (thansenLink) { secondaryButtonsHTML += `<button class="lank-knapp thansen-btn" onclick="window.open('${thansenLink}', '_blank'); closeDropdown('${dropdownId}'); event.stopPropagation();">Thansen</button>`; }
                if (egenLink) { secondaryButtonsHTML += `<button class="lank-knapp egen-lank-btn" onclick="window.open('${egenLink}', '_blank'); closeDropdown('${dropdownId}'); event.stopPropagation();">Egen Länk</button>`; }

                const moreButton = `<button class="lank-knapp more-btn" onclick="toggleDropdown('${dropdownId}'); event.stopPropagation();">Mer</button>`;
                const dropdownMenu = `<div id="${dropdownId}" class="dropdown-menu">${secondaryButtonsHTML}</div>`;
                linkCellContent += `<div class="link-dropdown-container">${moreButton}${dropdownMenu}</div>`;
            }

            if (!linkCellContent) {
                linkCellContent = '<span>(Saknas)</span>';
            }

            const finalLinkCellContent = `<div class="link-buttons">${linkCellContent}</div>`;

            const primarySearchLink = trodoLink || aeroMLink || egenLink;
            const primarySearchText = trodoLink ? 'Trodo' : (aeroMLink ? 'Aero M' : (egenLink ? 'Egen Länk' : ''));

            return `
                <div class="artikel-rad" data-id="${item.id}" onclick="window.handleSelect(${item.id})">
                    <span class="service-filter-cell">
                        <span class="service-filter-text">${item.service_filter}</span>
                        <button class="copy-btn" onclick="window.copyText('${item.service_filter}'); event.stopPropagation();" title="Kopiera Art. nr">⧉</button>
                    </span>
                    <span>${item.name}</span>
                    <span>${formatPrice(item.price)} kr</span>
                    <div class="quantity-cell">
                        <button class="qty-btn" onclick="window.handleQuantityChange(${item.id}, -1); event.stopPropagation();">-</button>
                        <span>${item.quantity}</span>
                        <button class="qty-btn" onclick="window.handleQuantityChange(${item.id}, 1); event.stopPropagation();">+</button>
                    </div>
                    <span>${statusHtml}</span>
                    <span class="notes-cell" title="${item.notes || 'Inga anteckningar'}">${item.notes || '(Inga)'}</span>
                    <div>${finalLinkCellContent}</div>
                    <div class="action-buttons">
                        <button class="btn-secondary" onclick="window.handleEdit(${item.id}); event.stopPropagation();">Redigera</button>
                        <button class="btn-secondary btn-danger" onclick="window.handleDelete(${item.id}); event.stopPropagation();">Radera</button>
                    </div>
                </div>
            `;
        }

        // --- UPPDATERAR LAGERLISTORNA BASERAT PÅ FILTRERAD OCH SORTERAD DATA ---
        function renderInventoryLists(sortedInventory) {
            const serviceArtiklar = sortedInventory.filter(item => item.category === 'Service' && item.quantity > 0);
            const motorChassiArtiklar = sortedInventory.filter(item => (item.category === 'Motor/Chassi' || item.category === 'Övrigt' || !item.category) && item.quantity > 0);
            const andraMarkenArtiklar = sortedInventory.filter(item => item.category === 'Andra Märken' && item.quantity > 0);
            const slutILager = sortedInventory.filter(item => item.quantity <= 0);

            serviceArtiklarLista.innerHTML = serviceArtiklar.map(createArtikelRad).join('');
            motorChassiArtiklarLista.innerHTML = motorChassiArtiklar.map(createArtikelRad).join('');
            andraMarkenArtiklarLista.innerHTML = andraMarkenArtiklar.map(createArtikelRad).join('');
            slutILagerLista.innerHTML = slutILager.map(createArtikelRad).join('');

            // Hämta titlar och wrappers
            const serviceTitle = document.getElementById('service-artiklar-titel');
            const serviceWrapper = document.getElementById('service-artiklar-wrapper');
            const motorTitle = document.getElementById('motor-chassi-artiklar-titel');
            const motorWrapper = document.getElementById('motor-chassi-artiklar-wrapper');
            const andraTitle = document.getElementById('andra-marken-artiklar-titel');
            const andraWrapper = document.getElementById('andra-marken-artiklar-wrapper');

            // Kontrollera vilka sektioner som ska visas/döljas beroende på filter
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
            slutILagerSektion.style.display = showSlut ? 'flex' : 'none';
            document.getElementById('slut-i-lager-wrapper').style.display = showSlut ? 'block' : 'none';

            // Visa/dölj "Tomt" meddelande
            emptyStates.service.style.display = (currentFilter === 'Alla' || currentFilter === 'Service') && serviceArtiklar.length === 0 ? 'flex' : 'none';
            emptyStates.motorChassi.style.display = (currentFilter === 'Alla' || currentFilter === 'Motor/Chassi') && motorChassiArtiklar.length === 0 ? 'flex' : 'none';
            emptyStates.andraMarken.style.display = (currentFilter === 'Alla' || currentFilter === 'Andra Märken') && andraMarkenArtiklar.length === 0 ? 'flex' : 'none';
            emptyStates.slutILager.style.display = (currentFilter === 'Alla' || currentFilter === 'Slut') && slutILager.length === 0 ? 'flex' : 'none';

            // Dölj hela sektionen om Slut i Lager är det enda som visas och det är tomt.
            if (currentFilter === 'Slut' && slutILager.length === 0) {
                slutILagerSektion.style.display = 'none';
                document.getElementById('slut-i-lager-wrapper').style.display = 'none';
            }
        }

        function calculateRelevance(item, searchWords) {
            let score = 0;
            const fields = [item.service_filter, item.name, item.notes, item.link, item.category];

            searchWords.forEach(word => {
                const w = word.toLowerCase();
                if (fields[0] && fields[0].toLowerCase().includes(w)) { score += 10; } // Art nr match
                if (fields[1] && fields[1].toLowerCase().includes(w)) { score += 8; }  // Namn match
                if (fields[2] && fields[2].toLowerCase().includes(w)) { score += 3; }  // Anteckningar
                if (fields[3] && fields[3].toLowerCase().includes(w)) { score += 1; }  // Länk
                if (fields[4] && fields[4].toLowerCase().includes(w)) { score += 1; }  // Kategori

                // Exakt match på Art nr
                if (fields[0] && fields[0].toLowerCase() === w) { score += 5; } 
            });
            return score;
        }

        // --- UPPDATERAD: hanterar nu filter, sortering OCH sökning ---
        function sortAndRender() {
            const searchTerm = searchInput.value.toLowerCase().trim();
            let processedInventory = [...inventory];

            // 1. FILTRERA (Kategori)
            const isSearching = searchTerm !== '';
            if (!isSearching && currentFilter !== 'Alla') {
                if (currentFilter === 'Slut') {
                    processedInventory = processedInventory.filter(item => item.quantity <= 0);
                } else {
                    // Filtrera på kategori OCH att de är i lager
                    processedInventory = processedInventory.filter(item => item.quantity > 0 && (item.category === currentFilter || (currentFilter === 'Motor/Chassi' && (item.category === 'Övrigt' || !item.category)))
                    );
                }
            }

            // 2. FILTRERA (Sökterm)
            if (isSearching) {
                const searchWords = searchTerm.split(/\s+/).filter(word => word.length > 1 && !stopWords.includes(word));
                if (searchWords.length === 0 && searchTerm.length > 0) { searchWords.push(searchTerm); }

                processedInventory = processedInventory
                    .map(item => ({ ...item, relevanceScore: calculateRelevance(item, searchWords) }))
                    .filter(item => item.relevanceScore > 0)
                    .sort((a, b) => b.relevanceScore - a.relevanceScore); // Sortera efter relevans
            }
            
            // 3. SORTERA (Kolumn, endast om ingen sökning pågår)
            else {
                // Sortera efter vald kolumn om ingen sökning pågår
                processedInventory.sort((a, b) => {
                    let aVal = a[currentSort.column];
                    let bVal = b[currentSort.column];

                    if (currentSort.column === 'price' || currentSort.column === 'quantity') {
                        aVal = parseFloat(aVal) || 0;
                        bVal = parseFloat(bVal) || 0;
                    } else {
                        aVal = (aVal || '').toString().toLowerCase();
                        bVal = (bVal || '').toString().toLowerCase();
                    }

                    if (aVal < bVal) return currentSort.direction === 'asc' ? -1 : 1;
                    if (aVal > bVal) return currentSort.direction === 'asc' ? 1 : -1;
                    return 0;
                });
            }

            renderInventoryLists(processedInventory);
        }

        // --- Sökfilter (Anropas vid input) ---
        function applySearchFilter() {
            const searchTerm = searchInput.value.toLowerCase().trim();
            clearSearchBtn.style.display = searchTerm.length > 0 ? 'block' : 'none';
            sortAndRender();
        }
        
        // --- Sortering (Anropas vid klick på kolumnrubrik) ---
        window.handleSort = function(column) {
            if (currentSort.column === column) {
                currentSort.direction = currentSort.direction === 'asc' ? 'desc' : 'asc';
            } else {
                currentSort.column = column;
                currentSort.direction = 'asc';
            }
            localStorage.setItem('app_sort', JSON.stringify(currentSort)); 
            
            // Uppdatera visuell feedback
            document.querySelectorAll('.header span[data-sort]').forEach(header => {
                header.classList.remove('active');
                header.querySelector('.sort-icon').innerHTML = ''; 
            });

            const activeHeader = document.querySelector(`.header span[data-sort="${column}"]`);
            if (activeHeader) {
                activeHeader.classList.add('active');
                const icon = currentSort.direction === 'asc' ? '▲' : '▼';
                activeHeader.querySelector('.sort-icon').textContent = icon;
            }

            sortAndRender();
        };

        // --- Filter (Anropas vid klick på filterknapp) ---
        window.handleFilterChange = function(newFilter) {
            currentFilter = newFilter;
            localStorage.setItem('app_filter', currentFilter);
            
            // Uppdatera aktiv knapp (görs i initializeListeners)
            // Låter applySearchFilter göra renderingen.
            applySearchFilter();
        };

        // ----------------------------------------------------------------------
        // CRUD FUNKTIONER
        // ----------------------------------------------------------------------

        function generateUniqueId() {
            return Date.now();
        }

        // --- VALIDERING ---
        function validateForm(form) {
            let isValid = true;
            form.querySelectorAll('input, select').forEach(input => {
                if (input.hasAttribute('required') && !input.value.trim()) {
                    input.closest('div').classList.add('has-error');
                    isValid = false;
                } else {
                    input.closest('div').classList.remove('has-error');
                }
            });
            return isValid;
        }

        async function saveInventoryItem(item) {
            const itemToSave = {
                ...item,
                price: parseFloat(item.price),
                quantity: parseInt(item.quantity, 10),
                category: item.category || 'Motor/Chassi', // Standardvärde
                notes: item.notes || '',
                link: item.link || '',
                service_filter: item.service_filter.toUpperCase()
            };
            try {
                const docRef = doc(db, INVENTORY_COLLECTION, itemToSave.id.toString());
                await setDoc(docRef, itemToSave);
                showToast(`Artikel ${item.service_filter} sparad!`, 'success');
            } catch (e) {
                console.error("Fel vid sparande: ", e);
                showToast("Kunde inte spara artikeln. Se konsolen.", 'error');
            }
        }

        async function deleteInventoryItem(id) {
            try {
                const docRef = doc(db, INVENTORY_COLLECTION, id.toString());
                await deleteDoc(docRef);
                showToast('Artikel borttagen!', 'success');
            } catch (e) {
                console.error("Fel vid borttagning: ", e);
                showToast("Kunde inte ta bort artikeln. Se konsolen.", 'error');
            }
        }

        async function handleFormSubmit(event) {
            event.preventDefault();

            if (!validateForm(addForm)) {
                showToast('Vänligen fyll i alla obligatoriska fält.', 'error');
                return;
            }

            const formData = new FormData(addForm);
            const newItem = {};
            for (const [key, value] of formData.entries()) {
                newItem[key] = value;
            }

            newItem.id = generateUniqueId();
            
            const submitBtn = addForm.querySelector('button[type="submit"]');
            const originalText = submitBtn.textContent;
            submitBtn.disabled = true;
            submitBtn.textContent = 'Sparar...';

            await saveInventoryItem(newItem);
            
            addForm.reset();
            addForm.querySelectorAll('.has-error').forEach(div => div.classList.remove('has-error'));
            submitBtn.disabled = false;
            submitBtn.textContent = originalText;
            
            // Stäng formuläret efter inmatning (Användaren kan öppna det igen med +)
            toggleAddForm(); 
        }

        window.handleQuantityChange = async function(id, change) {
            const item = inventory.find(i => i.id === id);
            if (!item) return;

            let newQuantity = item.quantity + change;
            if (newQuantity < 0) newQuantity = 0; 
            
            await saveInventoryItem({ ...item, quantity: newQuantity });
        };

        window.handleSelect = function(id) {
            document.querySelectorAll('.artikel-rad').forEach(r => r.classList.remove('selected'));
            const row = document.querySelector(`.artikel-rad[data-id="${id}"]`);
            if (row) {
                row.classList.add('selected');
                selectedItemId = id;
            }
        };

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
                const title = editModal.querySelector('h3');
                if (isOrderMode) {
                    title.textContent = 'Beställ Artikel';
                    submitBtn.textContent = 'Markera som Beställd';
                } else {
                    title.textContent = 'Redigera Artikel';
                    submitBtn.textContent = 'Spara Ändringar';
                }

                editModal.style.display = 'flex';
                setTimeout(() => document.getElementById('edit-service_filter').focus(), 50);
            }
        };

        async function handleEditSubmit(event) {
            event.preventDefault();

            if (!validateForm(editForm)) {
                showToast('Vänligen fyll i alla obligatoriska fält.', 'error');
                return;
            }

            const submitBtn = editForm.querySelector('button[type="submit"]');
            const originalText = submitBtn.textContent;
            submitBtn.disabled = true;
            submitBtn.textContent = 'Sparar...';

            const formData = new FormData(editForm);
            const updatedItem = {};
            for (const [key, value] of formData.entries()) {
                updatedItem[key] = value;
            }

            await saveInventoryItem(updatedItem);

            editModal.style.display = 'none';
            submitBtn.disabled = false;
            submitBtn.textContent = originalText;
            editForm.querySelectorAll('.has-error').forEach(div => div.classList.remove('has-error'));
        }

        window.handleDelete = function(id) {
            showCustomConfirmation('Är du säker på att du vill ta bort denna artikel permanent?', async (result) => {
                if (result) {
                    await deleteInventoryItem(id);
                    closeConfirmationModal();
                }
            });
        };

        // ----------------------------------------------------------------------
        // FIREBASE OCH SYNC
        // ----------------------------------------------------------------------

        function updateSyncStatus(status, message) {
            syncStatusElement.className = '';
            syncStatusElement.classList.add('sync-' + status);
            syncStatusElement.querySelector('span:last-child').textContent = message;
        }

        function setupRealtimeListener() {
            updateSyncStatus('connecting', 'Ansluter...');
            const colRef = collection(db, INVENTORY_COLLECTION);

            onSnapshot(colRef, (snapshot) => {
                const tempInventory = [];
                snapshot.forEach(doc => { tempInventory.push(doc.data()); });

                inventory = tempInventory;
                applySearchFilter();
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
                if (initialLoader) {
                    initialLoader.querySelector('p').textContent = 'Kunde inte ansluta...';
                }
            });
        }

        function toggleAddForm() {
            const isCurrentlyOpen = addFormWrapper.classList.contains('open');
            const newState = isCurrentlyOpen ? 'closed' : 'open';
            addFormWrapper.classList.toggle('open');
            // BORTTAGEN: toggleBtn.classList.toggle('open');
            localStorage.setItem('add_form_open_state', newState);
            
            // Autofokusera endast om formuläret öppnas
            if (newState === 'open') {
                document.getElementById('add-service_filter').focus();
            }
        }

        function initializeAddFormState() {
            const storedState = localStorage.getItem('add_form_open_state');
            if (storedState === 'open') {
                addFormWrapper.classList.add('open');
                // BORTTAGEN: toggleBtn.classList.add('open');
            }
        }

        // --- LADDAR SPARAD SORTERING OCH FILTER ---
        function loadPersistentState() {
            const savedSort = localStorage.getItem('app_sort');
            if (savedSort) {
                currentSort = JSON.parse(savedSort);
                // Sätt de visuella sorteringsikonerna
                const activeHeader = document.querySelector(`.header span[data-sort="${currentSort.column}"]`);
                if (activeHeader) {
                    activeHeader.classList.add('active');
                    const icon = currentSort.direction === 'asc' ? '▲' : '▼';
                    activeHeader.querySelector('.sort-icon').textContent = icon;
                }
            }
            
            const savedFilter = localStorage.getItem('app_filter');
            if (savedFilter) {
                currentFilter = savedFilter;
            }
            
            // Uppdatera de visuella filterknapparna
            document.querySelectorAll('#category-filter-bar button').forEach(btn => btn.classList.remove('active'));
            const activeFilterBtn = document.querySelector(`#category-filter-bar button[data-filter="${currentFilter}"]`);
            if (activeFilterBtn) {
                activeFilterBtn.classList.add('active');
            }
        }

        // ----------------------------------------------------------------------
        // JSON IMPORT/EXPORT FUNKTIONER (Flyttade till Inställningar)
        // ----------------------------------------------------------------------
        window.handleJsonDownload = function() {
            const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(inventory, null, 2));
            const downloadAnchorNode = document.createElement('a');
            downloadAnchorNode.setAttribute("href", dataStr);
            downloadAnchorNode.setAttribute("download", "lagerdata_export_" + new Date().toISOString().slice(0, 10) + ".json");
            document.body.appendChild(downloadAnchorNode);
            downloadAnchorNode.click();
            downloadAnchorNode.remove();
            showToast('Lagerdata nedladdad!', 'success');
        };

        window.handleJsonUpload = function(event) {
            const file = event.target.files[0];
            if (!file) return;

            const reader = new FileReader();
            reader.onload = async (e) => {
                try {
                    const uploadedInventory = JSON.parse(e.target.result);

                    if(Array.isArray(uploadedInventory)) {
                        showCustomConfirmation(`Detta kommer att skriva över ${inventory.length} befintliga artiklar med ${uploadedInventory.length} artiklar från filen. Vill du fortsätta?`, async (result) => {
                            if (result) {
                                // Rensa befintligt lager
                                for (const item of inventory) { await deleteInventoryItem(item.id); }

                                // Ladda upp nytt lager
                                for (const item of uploadedInventory) {
                                    // Se till att varje artikel har ett sträng-ID för Firebase-kompatibilitet
                                    const newId = item.id || generateUniqueId();
                                    await saveInventoryItem({ ...item, id: newId });
                                }
                                showToast('Lagerdata uppladdad och ersatt!', 'success');
                            }
                        });
                    } else {
                        showToast('Fel: Filinnehållet är inte en lista (array).', 'error');
                    }
                } catch (error) {
                    console.error("Fel vid uppladdning:", error);
                    showToast(`Kunde inte ladda upp fil: ${error.message}`, 'error');
                } finally {
                    // Återställ filinput så att samma fil kan laddas upp igen
                    event.target.value = '';
                }
            };
            reader.readAsText(file);
        };

        // ----------------------------------------------------------------------
        // MODAL OCH ALERT
        // ----------------------------------------------------------------------

        function showCustomConfirmation(message, callback, title = 'Bekräfta Åtgärd') {
            document.getElementById('confirmationTitle').textContent = title;
            document.getElementById('confirmationMessage').textContent = message;
            confirmationModal.style.display = 'flex';
            confirmCallback = callback;
        }

        function closeConfirmationModal() {
            confirmationModal.style.display = 'none';
            confirmCallback = null;
        }

        window.closeModal = function(id) {
            document.getElementById(id).style.display = 'none';
            document.getElementById(id).querySelector('form').querySelectorAll('.has-error').forEach(div => div.classList.remove('has-error'));
        }
        
        window.closeProductPopup = function() {
            document.getElementById('productPopup').style.display = 'none';
            document.getElementById('productIframe').src = '';
        }
        
        window.openProductPopup = function(url) {
            document.getElementById('productIframe').src = url;
            document.getElementById('productPopup').style.display = 'block';
        }

        window.copyText = function(text) {
            navigator.clipboard.writeText(text).then(() => {
                showToast('Artikelnummer kopierat!', 'info');
            }).catch(err => {
                console.error('Kunde inte kopiera text: ', err);
                alert('Kunde inte kopiera text. Försök igen eller kopiera manuellt: ' + text);
            });
        };

        // ----------------------------------------------------------------------
        // INITIALISERING
        // ----------------------------------------------------------------------

        function initializeListeners() {
            addForm.addEventListener('submit', handleFormSubmit);
            editForm.addEventListener('submit', handleEditSubmit);
            searchInput.addEventListener('input', applySearchFilter);
            
            // NYTT: Lyssna på den nya toolbar-knappen (Ersätter gamla toggle-knappen)
            if (toolbarAddBtn) {
                toolbarAddBtn.addEventListener('click', () => {
                    if (!addFormWrapper.classList.contains('open')) {
                        toggleAddForm();
                    }
                    // Skrolla till formuläret och fokusera
                    addFormWrapper.scrollIntoView({ behavior: 'smooth', block: 'start' });
                    setTimeout(() => document.getElementById('add-service_filter').focus(), 400); 
                });
            }

            // FAB-knappen (behålls för mobil ifall den inte döljs i CSS)
            if (fabAddBtn) {
                fabAddBtn.addEventListener('click', () => {
                    if (!addFormWrapper.classList.contains('open')) {
                        toggleAddForm();
                    }
                    addFormWrapper.scrollIntoView({ behavior: 'smooth', block: 'start' }); // Ändrat till 'start'
                    document.getElementById('add-service_filter').focus();
                });
            }
            
            // Listener för PWA-installationsknapp i toolbar
            if (pwaInstallBtnToolbar) {
                pwaInstallBtnToolbar.addEventListener('click', handlePwaInstall);
            }

            // JSON-funktioner lyssnar på de flyttade elementen i dropdown-menyn
            document.getElementById('download-json-btn').addEventListener('click', window.handleJsonDownload);
            document.getElementById('upload-json-file').addEventListener('change', window.handleJsonUpload);

            document.getElementById('clear-search-btn').addEventListener('click', () => {
                searchInput.value = '';
                applySearchFilter();
            });

            document.getElementById('editModal').querySelector('.close-btn').addEventListener('click', () => closeModal('editModal'));

            document.getElementById('confirmationModal').querySelector('#confirmNo').addEventListener('click', () => {
                if (confirmCallback) confirmCallback(false);
                closeConfirmationModal();
            });

            document.getElementById('confirmationModal').querySelector('#confirmYes').addEventListener('click', () => {
                if (confirmCallback) confirmCallback(true);
                closeConfirmationModal();
            });
            
            // Lyssna på temaväxlingen
            themeToggle.addEventListener('change', (e) => {
                setTheme(e.target.checked ? 'dark' : 'light');
            });
            
            // Lyssna på klick i sökresultat för att öppna länkar
            globalSearchResults.addEventListener('click', (e) => {
                if (e.target.classList.contains('lank-knapp')) {
                    const link = e.target.getAttribute('href');
                    if (link && e.target.textContent.includes('Bildelsbasen')) {
                        e.preventDefault();
                        openProductPopup(link);
                    }
                }
            });
            
            // Lyssna på scroll för back-to-top och toolbar-skugga (om toolbaren var fixed)
            const backToTopBtn = document.getElementById('back-to-top-btn');
            const topToolbar = document.querySelector('.top-toolbar');

            window.addEventListener('scroll', () => {
                // Visa/dölj back-to-top
                if (backToTopBtn) {
                    if (window.scrollY > 300) {
                        backToTopBtn.style.display = 'flex';
                    } else {
                        backToTopBtn.style.display = 'none';
                    }
                }
                
                // Lägg till skugga på toolbaren (om den är fixed)
                if (topToolbar && topToolbar.style.position === 'fixed') {
                    if (window.scrollY > 0) {
                        topToolbar.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.1)';
                    } else {
                        topToolbar.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.05)';
                    }
                }
            });
            
            if (backToTopBtn) {
                backToTopBtn.addEventListener('click', () => {
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                });
            }

            // Lyssna på filterknapparna
            if (categoryFilterBar) {
                categoryFilterBar.addEventListener('click', (e) => {
                    if (e.target.tagName === 'BUTTON') {
                        const filter = e.target.getAttribute('data-filter');
                        if (filter) {
                            window.handleFilterChange(filter);
                            document.querySelectorAll('#category-filter-bar button').forEach(btn => btn.classList.remove('active'));
                            e.target.classList.add('active');
                            // Rendera om listan
                            applySearchFilter();
                        }
                    }
                });
            }

            // Lyssna på klick på rubrikerna för att fälla ihop
            document.querySelectorAll('.collapsible-header').forEach(header => {
                header.addEventListener('click', () => {
                    const wrapperId = header.id.replace('-titel', '-wrapper');
                    const wrapper = document.getElementById(wrapperId);
                    const isCurrentlyOpen = header.getAttribute('data-state') === 'open';
                    
                    if (isCurrentlyOpen) {
                        header.setAttribute('data-state', 'closed');
                        if (wrapper) wrapper.classList.add('collapsed');
                        localStorage.setItem(header.id, 'closed');
                    } else {
                        header.setAttribute('data-state', 'open');
                        if (wrapper) wrapper.classList.remove('collapsed');
                        localStorage.setItem(header.id, 'open');
                    }
                });
            });
        }
        
        // --- SPARAD FÄLL-IHOP STATE ---
        function initializeCollapseState() {
            document.querySelectorAll('.collapsible-header').forEach(header => {
                const savedState = localStorage.getItem(header.id); 
                const wrapperId = header.id.replace('-titel', '-wrapper'); 
                const wrapper = document.getElementById(wrapperId);
                
                if (savedState === 'closed') { 
                    header.setAttribute('data-state', 'closed'); 
                    if (wrapper) { wrapper.classList.add('collapsed'); } 
                } 
            });
        }

        // KÖR ALLT I ORDNING
        checkTheme(); // --- NYTT: Sätt tema FÖRST
        updateSyncStatus('connecting', 'Ansluter...'); 
        initializeAddFormState(); 
        initializeCollapseState();
        loadPersistentState(); // --- NYTT: Ladda sparade filter
        initializeListeners(); 
        renderSearchHistory();
        setupRealtimeListener(); // Döljer laddaren när datan är hämtad

    } catch (e) {
        console.error("App Initialization Error:", e);
        updateSyncStatus('error', 'Initieringsfel!'); 
        if(initialLoader) initialLoader.querySelector('p').textContent = 'Kritiskt fel vid initiering.';
    }
});
