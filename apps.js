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
        const toggleBtn = document.getElementById('toggle-add-form-btn');
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
        const pwaInstallBtn = document.getElementById('pwa-install-btn');
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
        let currentFilter = 'Alla'; // --- NYTT ---
        let confirmCallback = null; 
        let deferredInstallPrompt = null; // --- NYTT ---
        
        const stopWords = ['till', 'för', 'en', 'ett', 'och', 'eller', 'med', 'på', 'i', 'av', 'det', 'den', 'som', 'att', 'är', 'har', 'kan', 'ska', 'vill', 'sig', 'här', 'nu', 'från', 'man', 'vi', 'du', 'ni'];


        // ----------------------------------------------------------------------
        // LÄNK-FUNKTIONER (inkl. historik)
        // (Oförändrade från förra versionen)
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
        
        window.toggleDropdown = function(id) { const d = document.getElementById(id); if (!d) return; document.querySelectorAll('.dropdown-menu.visible').forEach(o => { if (o.id !== id) o.classList.remove('visible'); }); d.classList.toggle('visible'); };
        window.closeDropdown = function(id) { const d = document.getElementById(id); if (d) d.classList.remove('visible'); };
        document.addEventListener('click', (e) => { if (!e.target.closest('.link-dropdown-container')) { document.querySelectorAll('.dropdown-menu.visible').forEach(d => d.classList.remove('visible')); } });


        // ----------------------------------------------------------------------
        // GLOBAL SÖK-FUNKTION (Oförändrad från förra versionen)
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
        
        // --- NYTT: PWA Installationshanterare ---
        window.addEventListener('beforeinstallprompt', (e) => {
            e.preventDefault(); // Förhindra att webbläsaren visar sin egen prompt
            deferredInstallPrompt = e; // Spara händelsen
            pwaInstallBtn.style.display = 'block'; // Visa vår anpassade knapp
        });
        
        async function handlePwaInstall() {
            if (deferredInstallPrompt) {
                deferredInstallPrompt.prompt(); // Visa webbläsarens installationsdialog
                const { outcome } = await deferredInstallPrompt.userChoice;
                if (outcome === 'accepted') {
                    console.log('Användaren installerade appen');
                    pwaInstallBtn.style.display = 'none'; // Dölj knappen
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
        
        // --- NYTT: Uppdaterar kategorietiketter ---
        function updateCategoryBadges(currentInventory) {
            const serviceItems = currentInventory.filter(i => i.category === 'Service' && i.quantity > 0);
            const motorItems = currentInventory.filter(i => (i.category === 'Motor/Chassi' || i.category === 'Övrigt' || !i.category) && i.quantity > 0);
            const andraItems = currentInventory.filter(i => i.category === 'Andra Märken' && i.quantity > 0);
            
            badges.service.textContent = `${serviceItems.length} st / ${formatPrice(serviceItems.reduce((s, i) => s + (i.price * i.quantity), 0))} kr`;
            badges.motorChassi.textContent = `${motorItems.length} st / ${formatPrice(motorItems.reduce((s, i) => s + (i.price * i.quantity), 0))} kr`;
            badges.andraMarken.textContent = `${andraItems.length} st / ${formatPrice(andraItems.reduce((s, i) => s + (i.price * i.quantity), 0))} kr`;
        }

        function updateSyncStatus(status, message) {
            if (!syncStatusElement) return;
            syncStatusElement.className = `sync-${status}`;
            syncStatusElement.title = message;
            const textEl = syncStatusElement.querySelector('.text');
            if (textEl) textEl.textContent = message;
        }

        // createInventoryRow (Oförändrad från förra versionen)
        function createInventoryRow(item, isOutOfStock) {
            const row = document.createElement('div'); row.className = 'artikel-rad'; row.setAttribute('data-id', item.id);
            row.onclick = () => handleRowSelect(item.id, row);
            if (selectedItemId === item.id) row.classList.add('selected');
            const statusClass = item.quantity > 0 ? 'i-lager' : 'slut'; const statusText = item.quantity > 0 ? 'I lager' : 'Slut';
            const quantityCell = `<div class="quantity-cell"><button class="qty-btn" onclick="adjustQuantity(${item.id}, -1); event.stopPropagation();">-</button><span>${item.quantity}</span><button class="qty-btn" onclick="adjustQuantity(${item.id}, 1); event.stopPropagation();">+</button></div>`;
            const editButton = isOutOfStock ? `<button class="edit-btn order-btn" onclick="handleEdit(${item.id}, true); event.stopPropagation();">Beställ</button>` : `<button class="edit-btn" onclick="handleEdit(${item.id}); event.stopPropagation();">Ändra</button>`;
            const notesCell = `<span class="notes-cell" title="${item.notes || ''}">${item.notes || ''}</span>`;
            const trodoLink = generateTrodoLink(item.service_filter); const aeroMLink = generateAeroMLink(item.service_filter); const thansenLink = generateThansenLink(item.service_filter); const egenLink = item.link;
            let primaryButtonHTML = ''; let linkCellContent = '';
            if (trodoLink) { primaryButtonHTML = `<button class="lank-knapp trodo-btn" onclick="window.open('${trodoLink}', '_blank'); event.stopPropagation();">Trodo</button>`; }
            if (primaryButtonHTML) { linkCellContent += primaryButtonHTML; }
            const hasSecondaryLinks = aeroMLink || thansenLink || egenLink;
            if (hasSecondaryLinks) {
                const dropdownId = `link-dropdown-${item.id}`; let secondaryButtonsHTML = '';
                if (aeroMLink) { secondaryButtonsHTML += `<button class="lank-knapp aero-m-btn" onclick="window.open('${aeroMLink}', '_blank'); closeDropdown('${dropdownId}'); event.stopPropagation();">Aero M</button>`; }
                if (thansenLink) { secondaryButtonsHTML += `<button class="lank-knapp thansen-btn" onclick="window.open('${thansenLink}', '_blank'); closeDropdown('${dropdownId}'); event.stopPropagation();">Thansen</button>`; }
                if (egenLink) { secondaryButtonsHTML += `<button class="lank-knapp egen-lank-btn" onclick="window.open('${egenLink}', '_blank'); closeDropdown('${dropdownId}'); event.stopPropagation();">Egen Länk</button>`; }
                const moreButton = `<button class="lank-knapp more-btn" onclick="toggleDropdown('${dropdownId}'); event.stopPropagation();">Mer</button>`;
                const dropdownMenu = `<div id="${dropdownId}" class="dropdown-menu">${secondaryButtonsHTML}</div>`;
                linkCellContent += `<div class="link-dropdown-container">${moreButton}${dropdownMenu}</div>`;
            }
            if (!linkCellContent) { linkCellContent = '<span>(Saknas)</span>'; }
            const finalLinkCellContent = `<div class="link-buttons">${linkCellContent}</div>`;
            const primarySearchLink = trodoLink || aeroMLink || egenLink; const primarySearchText = trodoLink ? 'Trodo' : (aeroMLink ? 'Aero M' : (egenLink ? 'Egen Länk' : ''));
            const searchButton = primarySearchLink ? `<button class="search-btn" onclick="window.open('${primarySearchLink}', '_blank'); event.stopPropagation();" title="Sök på ${primarySearchText}"><svg viewBox="0 0 16 16" xmlns="http://www.w3.org/2000/svg"><path d="M11.742 10.344a6.5 6.5 0 1 0-1.397 1.398h-.001c.03.04.062.078.098.115l3.85 3.85a1 1 0 0 0 1.415-1.414l-3.85-3.85a1.007 1.007 0 0 0-.115-.1zM12 6.5a5.5 5.5 0 1 1-11 0 5.5 5.5 0 0 1 11 0z"/></svg></button>` : '';
            const serviceFilterCell = `<span class="service-filter-cell">${searchButton}<button class="copy-btn" onclick="copyToClipboard('${item.service_filter.replace(/'/g, "\\'")}'); event.stopPropagation();" title="Kopiera Artikelnummer">&#x1F4CB;</button><span class="service-filter-text">${item.service_filter}</span></span>`;
            row.innerHTML = `${serviceFilterCell}<span>${item.name}</span><span>${formatPrice(item.price)} kr</span>${quantityCell}<span style="display: flex; align-items: center;"><span class="${statusClass}">${statusText}</span></span>${notesCell}<span class="action-cell">${finalLinkCellContent}</span><div class="action-buttons">${editButton}<button class="delete-btn" onclick="handleDelete(${item.id}); event.stopPropagation();">Ta bort</button></div>`;
            return row;
        }

        // --- UPPDATERAD: hanterar nu "tom" vy OCH kategorifilter ---
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

            // --- UPPDATERAD: Logik för att visa/dölja sektioner baserat på filter ---
            const serviceWrapper = document.getElementById('service-artiklar-wrapper');
            const motorWrapper = document.getElementById('motor-chassi-artiklar-wrapper');
            const andraWrapper = document.getElementById('andra-marken-artiklar-wrapper');

            const serviceTitle = document.getElementById('service-artiklar-titel');
            const motorTitle = document.getElementById('motor-chassi-artiklar-titel');
            const andraTitle = document.getElementById('andra-marken-artiklar-titel');
            
            // Visa/dölj sektioner baserat på BÅDE innehåll OCH filter
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

            // Visa/dölj "Tomt" meddelande
            emptyStates.service.style.display = (currentFilter === 'Alla' || currentFilter === 'Service') && serviceArtiklar.length === 0 ? 'flex' : 'none';
            emptyStates.motorChassi.style.display = (currentFilter === 'Alla' || currentFilter === 'Motor/Chassi') && motorChassiArtiklar.length === 0 ? 'flex' : 'none';
            emptyStates.andraMarken.style.display = (currentFilter === 'Alla' || currentFilter === 'Andra Märken') && andraMarkenArtiklar.length === 0 ? 'flex' : 'none';
            emptyStates.slutILager.style.display = (currentFilter === 'Alla' || currentFilter === 'Slut') && slutILager.length === 0 ? 'flex' : 'none';
            
            const totalSearchMatches = data.length;
            if (totalSearchMatches === 0 && searchInput.value.length > 0) {
                Object.values(emptyStates).forEach(el => {
                    if (el.style.display === 'flex') {
                        el.querySelector('h4').textContent = 'Inga träffar';
                        el.querySelector('p').textContent = `Din sökning på "${searchInput.value}" gav inga resultat.`;
                    }
                });
            } else {
                 // Återställ standardtext
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

        // Sökrelevans (oförändrad)
        function calculateRelevance(item, searchWords) {
            let score = 0; const serviceFilter = (item.service_filter || '').toLowerCase(); const name = (item.name || '').toLowerCase(); const notes = (item.notes || '').toLowerCase(); const category = (item.category || '').toLowerCase();
            searchWords.forEach(word => {
                const cleanWord = word.replace(/[^a-z0-9]/g, ''); if (serviceFilter.includes(cleanWord)) { score += 5; } if (name.includes(cleanWord)) { score += 3; } if (category.includes(cleanWord)) { score += 2; } if (notes.includes(cleanWord)) { score += 1; } if (serviceFilter === cleanWord || name === cleanWord) { score += 5; }
            }); return score;
        }

        // --- UPPDATERAD: hanterar nu filter, sortering OCH sökning ---
        function sortAndRender() {
            const searchTerm = searchInput.value.toLowerCase().trim();
            let processedInventory = [...inventory];

            // 1. FILTRERA (Kategori)
            if (currentFilter !== 'Alla') {
                if (currentFilter === 'Slut') {
                    processedInventory = processedInventory.filter(item => item.quantity <= 0);
                } else {
                    // Filtrera på kategori OCH att de är i lager
                    processedInventory = processedInventory.filter(item => item.quantity > 0 && 
                        (item.category === currentFilter || (currentFilter === 'Motor/Chassi' && (item.category === 'Övrigt' || !item.category)))
                    );
                }
            }

            // 2. FILTRERA (Sökterm)
            if (searchTerm !== '') {
                const searchWords = searchTerm.split(/\s+/).filter(word => word.length > 1 && !stopWords.includes(word));
                if (searchWords.length === 0 && searchTerm.length > 0) { searchWords.push(searchTerm); }

                processedInventory = processedInventory
                    .map(item => ({ ...item, relevanceScore: calculateRelevance(item, searchWords) }))
                    .filter(item => item.relevanceScore > 0)
                    .sort((a, b) => b.relevanceScore - a.relevanceScore); // Sortera efter relevans
            } 
            // 3. SORTERA (Kolumn)
            else {
                // Sortera efter vald kolumn om ingen sökning görs
                processedInventory.sort((a, b) => {
                    let aVal = a[currentSort.column]; let bVal = b[currentSort.column];
                    if (typeof aVal === 'string' && typeof bVal === 'string') {
                        return currentSort.direction === 'asc' ? aVal.localeCompare(bVal, 'sv') : bVal.localeCompare(aVal, 'sv');
                    } else {
                        return currentSort.direction === 'asc' ? (aVal || 0) - (bVal || 0) : (bVal || 0) - (aVal || 0);
                    }
                });
            }
            
            renderInventory(processedInventory);

            // Uppdatera sorteringsikoner
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
                    if(searchTerm === '') { // Visa bara ikon om ingen sökning är aktiv
                        icon.textContent = currentSort.direction === 'asc' ? ' ▲' : ' ▼';
                    }
                }
            }
            
            // --- NYTT: Spara filter & sortering ---
            localStorage.setItem('app_sort', JSON.stringify(currentSort));
            localStorage.setItem('app_filter', currentFilter);
        }

        function applySearchFilter() {
             clearTimeout(window.searchTimeout);
             window.searchTimeout = setTimeout(sortAndRender, 150);
        }
        
        async function saveInventoryItem(itemData) { const itemRef = doc(db, INVENTORY_COLLECTION, String(itemData.id)); await setDoc(itemRef, itemData); }
        async function deleteInventoryItem(itemId) { const itemRef = doc(db, INVENTORY_COLLECTION, String(itemId)); await deleteDoc(itemRef); }
        
        // --- UPPDATERAD: Kallar på Dashboard & döljer laddare ---
        function setupRealtimeListener() {
            const q = collection(db, INVENTORY_COLLECTION);
            
            onSnapshot(q, (querySnapshot) => {
                const tempInventory = [];
                querySnapshot.forEach((doc) => { tempInventory.push(doc.data()); });
                inventory = tempInventory;
                
                applySearchFilter(); 
                renderDashboard(inventory); 
                updateCategoryBadges(inventory); // --- NYTT ---
                
                const now = new Date();
                updateSyncStatus('ok', `Synkroniserad ${now.toLocaleTimeString('sv-SE')}`);
                
                // --- NYTT: Dölj laddaren efter första lyckade hämtningen ---
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
        
        // --- UPPDATERAD: auto-fokuserar första fältet ---
        function toggleAddForm() {
            const isCurrentlyOpen = addFormWrapper.classList.contains('open');
            const newState = isCurrentlyOpen ? 'closed' : 'open';
            addFormWrapper.classList.toggle('open');
            toggleBtn.classList.toggle('open');
            localStorage.setItem('add_form_open_state', newState);
            
            if (newState === 'open') {
                // --- NYTT: Auto-fokus ---
                document.getElementById('add_service_filter').focus();
            }
        }
        
        function initializeAddFormState() {
            const storedState = localStorage.getItem('add_form_open_state');
            if (storedState === 'open') { addFormWrapper.classList.add('open'); toggleBtn.classList.add('open'); }
        }
        
        // --- NYTT: Laddar sparad sortering och filter ---
        function loadPersistentState() {
            const savedSort = localStorage.getItem('app_sort');
            const savedFilter = localStorage.getItem('app_filter');
            
            if (savedSort) {
                currentSort = JSON.parse(savedSort);
            }
            if (savedFilter) {
                currentFilter = savedFilter;
                // Uppdatera knapparnas 'active' status
                document.querySelectorAll('#category-filter-bar .btn-secondary').forEach(btn => {
                    btn.classList.toggle('active', btn.getAttribute('data-filter') === currentFilter);
                });
            }
        }

        // --- NYTT: Valideringsfunktion ---
        function validateForm(form) {
            let isValid = true;
            // Rensa gamla fel
            form.querySelectorAll('.has-error').forEach(el => el.classList.remove('has-error'));
            
            const requiredFields = form.querySelectorAll('[required]');
            requiredFields.forEach(field => {
                if (!field.value || field.value.trim() === '') {
                    isValid = false;
                    field.closest('div').classList.add('has-error');
                }
            });
            return isValid;
        }

        async function handleFormSubmit(event) {
            event.preventDefault();
            
            // --- NYTT: Validering ---
            if (!validateForm(addForm)) {
                showToast('Vänligen fyll i alla obligatoriska fält.', 'error');
                return;
            }

            const submitBtn = addForm.querySelector('button[type="submit"]');
            const formData = new FormData(addForm);
            const serviceFilter = (formData.get('service_filter') || '').trim().toUpperCase();

            if (serviceFilter && inventory.some(item => item.service_filter === serviceFilter)) {
                showToast(`Artikelnumret ${serviceFilter} finns redan.`, 'error'); // --- NYTT: Toast ---
                addForm.querySelector('#add_service_filter').closest('div').classList.add('has-error');
                return; 
            }

            submitBtn.disabled = true; submitBtn.textContent = 'Sparar...';
            const newItem = {
                id: Date.now(), 
                service_filter: serviceFilter, 
                name: (formData.get('name') || '').trim().toUpperCase(), 
                price: parseFloat(formData.get('price')) || 0.00,
                quantity: parseInt(formData.get('quantity'), 10) || 0,
                category: formData.get('category') || 'Övrigt', 
                notes: (formData.get('notes') || '').trim(),
                link: (formData.get('link') || '').trim(),
            };
            
            await saveInventoryItem(newItem);
            addForm.reset();
            submitBtn.disabled = false; submitBtn.textContent = 'Spara Artikel';
            if (addFormWrapper.classList.contains('open')) { toggleAddForm(); }
            
            showToast('Artikel sparad!', 'success'); // --- NYTT: Toast ---
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
                const title = editModal.querySelector('h3');
                if (isOrderMode) {
                    title.textContent = 'Beställ Artikel'; submitBtn.textContent = 'Markera som Beställd';
                } else {
                    title.textContent = 'Redigera Artikel'; submitBtn.textContent = 'Spara Ändringar';
                }
                editModal.style.display = 'flex';
                // --- NYTT: Auto-fokus ---
                setTimeout(() => document.getElementById('edit-service_filter').focus(), 50);
            }
        }

        async function handleEditSubmit(event) {
            event.preventDefault();
            
            // --- NYTT: Validering ---
            if (!validateForm(editForm)) {
                showToast('Vänligen fyll i alla obligatoriska fält.', 'error');
                return;
            }

            const submitBtn = editForm.querySelector('button[type="submit"]');
            const originalText = submitBtn.textContent;
            submitBtn.disabled = true; submitBtn.textContent = 'Sparar...';

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
            };

            await saveInventoryItem(updatedItem);
            submitBtn.disabled = false; submitBtn.textContent = originalText;
            closeEditModal();
            
            showToast('Ändringar sparade!', 'success'); // --- NYTT: Toast ---
        }
        
        window.adjustQuantity = async function(id, change) {
            const item = inventory.find(i => i.id === id);
            if (item) {
                const newQuantity = Math.max(0, item.quantity + change);
                const updatedItem = {...item, quantity: newQuantity };
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
                        showToast('Artikel borttagen', 'info'); // --- NYTT: Toast ---
                    }
                }, 'Bekräfta Borttagning', true // --- NYTT: true för "isDanger"
            );
        }
        
        // --- UPPDATERAD: Använder Toast ---
        window.copyToClipboard = (text) => navigator.clipboard.writeText(text).then(() => showToast(`'${text}' har kopierats!`, 'info'));
        
        function closeEditModal() { editModal.style.display = 'none'; }
        function closeConfirmationModal() { confirmationModal.style.display = 'none'; confirmCallback = null; }

        // --- UPPDATERAD: Hanterar "farlig" knapp ---
        function showCustomConfirmation(message, callback, title = 'Bekräfta', isDanger = false) {
            confirmationModal.querySelector('#confirmationTitle').innerHTML = title;
            confirmationModal.querySelector('#confirmationMessage').innerHTML = message;
            confirmationModal.querySelector('#confirmNo').style.display = 'inline-block';
            
            const yesBtn = confirmationModal.querySelector('#confirmYes');
            yesBtn.className = 'btn-primary'; // Återställ
            if (isDanger) {
                yesBtn.classList.add('btn-danger'); // --- NYTT ---
            }
            
            confirmationModal.style.display = 'flex';
            confirmCallback = callback;
        }
        
        // --- Ersatt av showToast, men behålls för copy-paste (som är en "alert") ---
        function showCustomAlert(message, title = 'Meddelande') {
            showCustomConfirmation(message, () => closeConfirmationModal(), title);
            confirmationModal.querySelector('#confirmNo').style.display = 'none';
        }

        function initializeListeners() {
            addForm.addEventListener('submit', handleFormSubmit);
            editForm.addEventListener('submit', handleEditSubmit);
            searchInput.addEventListener('input', applySearchFilter); 
            toggleBtn.addEventListener('click', toggleAddForm);

            // --- NYTT: FAB-knapp ---
            if (fabAddBtn) {
                fabAddBtn.addEventListener('click', () => {
                    if (!addFormWrapper.classList.contains('open')) {
                        toggleAddForm();
                    }
                    addFormWrapper.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    document.getElementById('add_service_filter').focus();
                });
            }

            searchInput.addEventListener('input', () => { clearSearchBtn.style.display = searchInput.value.length > 0 ? 'block' : 'none'; });
            clearSearchBtn.addEventListener('click', () => { searchInput.value = ''; clearSearchBtn.style.display = 'none'; applySearchFilter(); searchInput.focus(); });
            document.querySelectorAll('.lager-container').forEach(c => { c.addEventListener('scroll', () => c.classList.toggle('scrolled', c.scrollTop > 1)); });

            [editModal, confirmationModal].forEach(modal => {
                modal.addEventListener('click', (e) => {
                    if (e.target === modal || e.target.classList.contains('close-btn')) {
                        modal.style.display = 'none';
                    }
                });
            });
            
            // --- NYTT: ESC för att stänga modaler ---
            document.addEventListener('keydown', (e) => {
                if (e.key === 'Escape') {
                    closeEditModal();
                    closeConfirmationModal();
                    if(globalSearchResults.style.display === 'block') {
                        globalSearchResults.style.display = 'none';
                    }
                }
            });
            
            document.querySelectorAll('.header span[data-sort]').forEach(header => {
                header.addEventListener('click', () => {
                    const column = header.getAttribute('data-sort');
                    if (searchInput.value !== '') { searchInput.value = ''; }
                    const direction = (currentSort.column === column && currentSort.direction === 'asc') ? 'desc' : 'asc';
                    currentSort = { column, direction };
                    applySearchFilter(); 
                });
            });
            
            document.getElementById('confirmYes').addEventListener('click', () => { if (confirmCallback) confirmCallback(true); closeConfirmationModal(); });
            document.getElementById('confirmNo').addEventListener('click', () => { if (confirmCallback) confirmCallback(false); closeConfirmationModal(); });

            document.querySelectorAll('.collapsible-header').forEach(header => {
                header.addEventListener('click', () => {
                    const wrapperId = header.id.replace('-titel', '-wrapper'); const wrapper = document.getElementById(wrapperId); if (!wrapper) return;
                    const isClosed = header.getAttribute('data-state') === 'closed'; const newState = isClosed ? 'open' : 'closed'; // <-- FIX: 'open' var fel
                    header.setAttribute('data-state', newState); wrapper.classList.toggle('collapsed', !isClosed);
                    localStorage.setItem(header.id, newState);
                });
            });

            // JSON-knappar (oförändrad, men använder nu Toast)
            document.getElementById('download-json-btn').addEventListener('click', () => {
                const dataStr = JSON.stringify(inventory, null, 2); const blob = new Blob([dataStr], {type: "application/json"});
                const url = URL.createObjectURL(blob); const a = document.createElement('a'); a.href = url; a.download = "lager_backup.json"; a.click(); URL.revokeObjectURL(url);
                showToast('Lagerdata nedladdad!', 'success');
            });
            document.getElementById('upload-json-input').addEventListener('change', (event) => {
                const file = event.target.files[0]; if (!file) return;
                const reader = new FileReader();
                reader.onload = async (e) => {
                    try {
                        const uploadedInventory = JSON.parse(e.target.result);
                        if(Array.isArray(uploadedInventory)) {
                            showCustomConfirmation(`Detta kommer att skriva över ${inventory.length} befintliga artiklar med ${uploadedInventory.length} artiklar från filen. Vill du fortsätta?`, async (result) => {
                                if (result) {
                                    for (const item of inventory) { await deleteInventoryItem(item.id); }
                                    for (const item of uploadedInventory) { await saveInventoryItem(item); }
                                    showToast(`${uploadedInventory.length} artiklar uppladdade!`, 'success');
                                }
                            }, 'Skriv över lager?', true);
                        } else { showToast('Fel: JSON-filen är inte en giltig lista (array).', 'error'); }
                    } catch(err) { showToast('Kunde inte läsa filen. Ogiltig JSON.', 'error'); }
                };
                reader.readText(file); event.target.value = '';
            });

            // Global sök-knappar (oförändrad)
            if (globalSearchBtn) { globalSearchBtn.addEventListener('click', (e) => { e.preventDefault(); handleGlobalSearch(); }); }
            globalSearchInput.addEventListener('keydown', (e) => { if (e.key === 'Enter') { e.preventDefault(); handleGlobalSearch(); } });

            // Back-to-top (oförändrad)
            const backToTopBtn = document.getElementById('back-to-top-btn');
            if (backToTopBtn) {
                window.addEventListener('scroll', () => { backToTopBtn.style.display = window.scrollY > 300 ? 'flex' : 'none'; });
                backToTopBtn.addEventListener('click', () => { window.scrollTo({ top: 0, behavior: 'smooth' }); });
            }
            
            // --- NYA LYSSNARE ---
            
            // Temaknapp
            if(themeToggle) {
                themeToggle.addEventListener('change', () => {
                    setTheme(themeToggle.checked ? 'dark' : 'light');
                });
            }
            
            // PWA Installationsknapp
            if(pwaInstallBtn) {
                pwaInstallBtn.addEventListener('click', handlePwaInstall);
            }
            
            // Kategorifilter
            if (categoryFilterBar) {
                categoryFilterBar.addEventListener('click', (e) => {
                    if (e.target.tagName === 'BUTTON') {
                        const filter = e.target.getAttribute('data-filter');
                        if (filter) {
                            currentFilter = filter;
                            // Uppdatera 'active' klass
                            categoryFilterBar.querySelectorAll('.btn-secondary').forEach(btn => btn.classList.remove('active'));
                            e.target.classList.add('active');
                            // Rendera om listan
                            applySearchFilter();
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
