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
        
        // NYA DOM-ELEMENT FÖR GLOBAL SÖK
        const globalSearchInput = document.getElementById('global-search-input');
        const globalSearchBtn = document.getElementById('global-search-btn');
        const globalSearchResults = document.getElementById('global-search-results');
        
        // NYA DOM-ELEMENT FÖR "TOM" VY
        const emptyStates = {
            service: document.getElementById('service-empty-state'),
            motorChassi: document.getElementById('motor-chassi-empty-state'),
            andraMarken: document.getElementById('andra-marken-empty-state'),
            slutILager: document.getElementById('slut-i-lager-empty-state')
        };
        
        // NYA DOM-ELEMENT FÖR DASHBOARD
        const statTotalValue = document.getElementById('stat-total-value');
        const statTotalItems = document.getElementById('stat-total-items');
        const statOutOfStock = document.getElementById('stat-out-of-stock');

        const HISTORY_KEY = 'globalSearchHistory';
        const MAX_HISTORY_ITEMS = 5;
        
        // GLOBALA VARIABLER
        let inventory = []; 
        let selectedItemId = null;
        let currentSort = { column: 'name', direction: 'desc' };
        let confirmCallback = null; 
        
        const stopWords = ['till', 'för', 'en', 'ett', 'och', 'eller', 'med', 'på', 'i', 'av', 'det', 'den', 'som', 'att', 'är', 'har', 'kan', 'ska', 'vill', 'sig', 'här', 'nu', 'från', 'man', 'vi', 'du', 'ni'];


        // ----------------------------------------------------------------------
        // LÄNK-FUNKTIONER (inkl. historik)
        // ----------------------------------------------------------------------

        function saveSearchToHistory(term) {
            if (!term) return;
            let history = JSON.parse(localStorage.getItem(HISTORY_KEY) || '[]');
            history = history.filter(h => h !== term);
            history.unshift(term);
            if (history.length > MAX_HISTORY_ITEMS) {
                history = history.slice(0, MAX_HISTORY_ITEMS);
            }
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
                historyHTML += `<span class="history-item" data-term="${term}">${term}</span>`;
            });
            historyContainer.innerHTML = historyHTML;
            document.querySelectorAll('.history-item').forEach(item => {
                item.addEventListener('click', (e) => {
                    const term = e.target.getAttribute('data-term');
                    const globalSearchInput = document.getElementById('global-search-input');
                    globalSearchInput.value = term;
                    handleGlobalSearch(term);
                    document.querySelector('.global-search-container').scrollIntoView({ behavior: 'smooth', block: 'center' });
                });
            });
        }
      
        function formatPrice(price) {
            return new Intl.NumberFormat('sv-SE', { 
                minimumFractionDigits: 2, 
                maximumFractionDigits: 2 
            }).format(price);
        }
        
        // --- Länkgeneratorer (oförändrade) ---
        function generateAeroMLink(serviceFilter) {
            if (!serviceFilter) return null;
            const searchFilter = serviceFilter.replace(/[\s-]/g, ''); 
            return `https://aeromotors.se/sok?s=${searchFilter}&layered_id_feature_1586%5B%5D=3&sort_by=price.asc`; 
        }
        function generateTrodoLink(serviceFilter) {
            if (!serviceFilter) return null;
            const searchFilter = serviceFilter.replace(/[\s-]/g, ''); 
            const searchQuery = encodeURIComponent(searchFilter);
            return `https://www.trodo.se/catalogsearch/result/premium?filter[quality_group]=2&product_list_dir=asc&product_list_order=price&q=${searchQuery}`;
        }
        function generateThansenLink(serviceFilter) {
            if (!serviceFilter) return null;
            const searchFilter = serviceFilter.replace(/[\s-]/g, ''); 
            const searchQuery = encodeURIComponent(searchFilter);
            return `https://www.thansen.se/search/?query=${searchQuery}`;
        }
        function generateSkruvatLink(serviceFilter) {
            if (!serviceFilter) return null;
            const searchFilter = encodeURIComponent(serviceFilter.replace(/[\s-]/g, ''));
            return `https://skruvat.se/search?q=${searchFilter}`;
        }
        function generateVortoLink(serviceFilter) {
            if (!serviceFilter) return null;
            const searchFilter = encodeURIComponent(serviceFilter.replace(/[\s-]/g, ''));
            return `https://vorto.se/sok?search=${searchFilter}`;
        }
        function generateAutodocLink(serviceFilter) {
            if (!serviceFilter) return null;
            const searchFilter = encodeURIComponent(serviceFilter.replace(/[\s-]/g, ''));
            return `https://autodoc.se/search?keyword=${searchFilter}`;
        }
        function generateBildelsbasenLink(serviceFilter) {
            if (!serviceFilter) return null;
            const searchFilter = encodeURIComponent(serviceFilter.replace(/[\s-]/g, ''));
            return `https://bildelsbasen.se/sv-se/OEM/${searchFilter}`; 
        }
        function generateReservdelar24Link(serviceFilter) {
            if (!serviceFilter) return null;
            const searchFilter = encodeURIComponent(serviceFilter.replace(/[\s-]/g, ''));
            return `https://reservdelar24.se/suche.html?keyword=${searchFilter}`;
        }
        
        // --- Dropdown-logik (oförändrad) ---
        window.toggleDropdown = function(dropdownId) {
            const dropdown = document.getElementById(dropdownId);
            if (!dropdown) return;
            document.querySelectorAll('.dropdown-menu.visible').forEach(openDropdown => {
                if (openDropdown.id !== dropdownId) {
                    openDropdown.classList.remove('visible');
                }
            });
            dropdown.classList.toggle('visible');
        };
        window.closeDropdown = function(dropdownId) {
            const dropdown = document.getElementById(dropdownId);
            if (dropdown) {
                dropdown.classList.remove('visible');
            }
        };
        document.addEventListener('click', (event) => {
            if (!event.target.closest('.link-dropdown-container')) {
                document.querySelectorAll('.dropdown-menu.visible').forEach(dropdown => {
                    dropdown.classList.remove('visible');
                });
            }
        });


        // ----------------------------------------------------------------------
        // NY GLOBAL PRISJÄMFÖRELSE-FUNKTION (UPPDATERAD)
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

        // --- UPPDATERAD: hanterar nu internt sökresultat ---
        function handleGlobalSearch(searchTermOverride) {
            const searchTerm = searchTermOverride ? searchTermOverride.trim().toUpperCase() : globalSearchInput.value.trim().toUpperCase();

            if (searchTerm === '') {
                globalSearchResults.innerHTML = '';
                globalSearchResults.style.display = 'none';
                return;
            }

            saveSearchToHistory(searchTerm); 

            // --- NYTT: Internt sök ---
            const internalMatches = inventory.filter(item => 
                (item.service_filter || '').toUpperCase().includes(searchTerm) || 
                (item.name || '').toUpperCase().includes(searchTerm)
            );
            
            let internalHTML = '';
            if (internalMatches.length > 0) {
                internalHTML = '<h4 class="internal-search-title">Hittades i ditt lager:</h4>';
                internalMatches.forEach(item => {
                    internalHTML += `<a href="#" class="internal-result-item" data-id="${item.id}">
                        <div>
                            <strong>${item.service_filter}</strong> - ${item.name}
                        </div>
                        <span>Antal: ${item.quantity}</span>
                    </a>`;
                });
            }
            // --- SLUT NYTT ---

            let externalHTML = '<div class="global-search-results-links">';
            let hasExternalLinks = false;
            
            externalSearchProviders.forEach(provider => {
                const link = provider.linkGenerator(searchTerm);
                if (link) {
                    const iconHTML = `<img src="${provider.icon}" alt="${provider.name}" class="link-favicon">`;
                    externalHTML += `<a href="${link}" target="_blank" class="lank-knapp">${iconHTML}${provider.name}</a>`;
                    hasExternalLinks = true;
                }
            });
            externalHTML += '</div>';
            
            if(hasExternalLinks) {
                externalHTML = '<h4 class="external-search-title">Externa leverantörer:</h4>' + externalHTML;
            }

            let disclaimerHTML = '';
            if (searchTerm.length > 0 && hasExternalLinks) {
                disclaimerHTML = '<div class="search-disclaimer-text">* Bildelsbasen söker primärt efter begagnade delar.</div>';
            }

            // Sätt ihop allt och visa
            globalSearchResults.innerHTML = `
                <button id="global-search-close-btn" title="Stäng">&times;</button>
                ${internalHTML}
                ${externalHTML}
                ${disclaimerHTML}
            `;
            globalSearchResults.style.display = 'block';

            // --- NYTT: Lägg till lyssnare för interna länkar ---
            document.querySelectorAll('.internal-result-item').forEach(link => {
                link.addEventListener('click', (e) => {
                    e.preventDefault();
                    const itemId = e.currentTarget.getAttribute('data-id');
                    const row = document.querySelector(`.artikel-rad[data-id="${itemId}"]`);
                    if (row) {
                        // Rensa tabell-sökningen för att garantera att raden syns
                        searchInput.value = '';
                        applySearchFilter();
                        
                        // Vänta på att re-render ska ske, scrolla sedan
                        setTimeout(() => {
                            row.scrollIntoView({ behavior: 'smooth', block: 'center' });
                            // Ta bort 'selected' från alla andra, lägg till på denna
                            document.querySelectorAll('.artikel-rad').forEach(r => r.classList.remove('selected'));
                            row.classList.add('selected');
                            selectedItemId = parseInt(itemId, 10);
                        }, 200);
                        
                        // Stäng sökresultaten
                        globalSearchResults.style.display = 'none';
                    }
                });
            });

            // Lyssnare för stäng-knappen (MÅSTE vara här, då knappen återskapas)
            document.getElementById('global-search-close-btn').addEventListener('click', () => {
                globalSearchResults.innerHTML = '';
                globalSearchResults.style.display = 'none';
            });
        }

        // ----------------------------------------------------------------------
        // GRÄNSSNITT OCH HUVUDFUNKTIONER
        // ----------------------------------------------------------------------

        // --- NY FUNKTION: Uppdaterar Dashboard ---
        function renderDashboard(currentInventory) {
            const totalValue = currentInventory.reduce((sum, item) => {
                return sum + (item.price * item.quantity);
            }, 0);
            
            const inStockItems = currentInventory.filter(item => item.quantity > 0).length;
            const outOfStockItems = currentInventory.length - inStockItems;

            statTotalValue.textContent = `${formatPrice(totalValue)} kr`;
            statTotalItems.textContent = inStockItems;
            statOutOfStock.textContent = outOfStockItems;
        }

        // --- NY FUNKTION: Uppdaterar Sync Status-ikonen ---
        function updateSyncStatus(status, message) {
            if (!syncStatusElement) return;
            // status kan vara 'connecting', 'ok', 'error'
            syncStatusElement.className = `sync-${status}`;
            syncStatusElement.title = message;
            const textEl = syncStatusElement.querySelector('.text');
            if (textEl) textEl.textContent = message;
        }

        function createInventoryRow(item, isOutOfStock) {
            // Skapa rad (oförändrad från din logik)
            const row = document.createElement('div');
            row.className = 'artikel-rad';
            row.setAttribute('data-id', item.id);
            row.onclick = () => handleRowSelect(item.id, row);
            if (selectedItemId === item.id) row.classList.add('selected');

            const statusClass = item.quantity > 0 ? 'i-lager' : 'slut';
            const statusText = item.quantity > 0 ? 'I lager' : 'Slut';
            
            const quantityCell = `<div class="quantity-cell"><button class="qty-btn" onclick="adjustQuantity(${item.id}, -1); event.stopPropagation();">-</button><span>${item.quantity}</span><button class="qty-btn" onclick="adjustQuantity(${item.id}, 1); event.stopPropagation();">+</button></div>`;
            const editButton = isOutOfStock ? `<button class="edit-btn order-btn" onclick="handleEdit(${item.id}, true); event.stopPropagation();">Beställ</button>` : `<button class="edit-btn" onclick="handleEdit(${item.id}); event.stopPropagation();">Ändra</button>`;
            const notesCell = `<span class="notes-cell" title="${item.notes || ''}">${item.notes || ''}</span>`;
            
            // Länklogik (oförändrad från din fil)
            const trodoLink = generateTrodoLink(item.service_filter);
            const aeroMLink = generateAeroMLink(item.service_filter); 
            const thansenLink = generateThansenLink(item.service_filter);
            const egenLink = item.link;
            
            let primaryButtonHTML = '';
            let linkCellContent = '';

            if (trodoLink) {
                primaryButtonHTML = `<button class="lank-knapp trodo-btn" onclick="window.open('${trodoLink}', '_blank'); event.stopPropagation();">Trodo</button>`;
            }
            
            if (primaryButtonHTML) {
                linkCellContent += primaryButtonHTML;
            }

            const hasSecondaryLinks = aeroMLink || thansenLink || egenLink;

            if (hasSecondaryLinks) {
                const dropdownId = `link-dropdown-${item.id}`;
                let secondaryButtonsHTML = '';
                if (aeroMLink) {
                    secondaryButtonsHTML += `<button class="lank-knapp aero-m-btn" onclick="window.open('${aeroMLink}', '_blank'); closeDropdown('${dropdownId}'); event.stopPropagation();">Aero M</button>`;
                }
                if (thansenLink) {
                    secondaryButtonsHTML += `<button class="lank-knapp thansen-btn" onclick="window.open('${thansenLink}', '_blank'); closeDropdown('${dropdownId}'); event.stopPropagation();">Thansen</button>`;
                }
                if (egenLink) {
                    secondaryButtonsHTML += `<button class="lank-knapp egen-lank-btn" onclick="window.open('${egenLink}', '_blank'); closeDropdown('${dropdownId}'); event.stopPropagation();">Egen Länk</button>`;
                }
                const moreButton = `<button class="lank-knapp more-btn" onclick="toggleDropdown('${dropdownId}'); event.stopPropagation();">Mer</button>`;
                const dropdownMenu = `<div id="${dropdownId}" class="dropdown-menu">${secondaryButtonsHTML}</div>`;
                linkCellContent += `<div class="link-dropdown-container">${moreButton}${dropdownMenu}</div>`;
            }
            
            if (!linkCellContent) {
                linkCellContent = '<span>(Saknas)</span>';
            }

            const finalLinkCellContent = `<div class="link-buttons">${linkCellContent}</div>`;

            // Sök-knapp logik (oförändrad från din fil)
            const primarySearchLink = trodoLink || aeroMLink || egenLink;
            const primarySearchText = trodoLink ? 'Trodo' : (aeroMLink ? 'Aero M' : (egenLink ? 'Egen Länk' : ''));

            const searchButton = primarySearchLink ? 
                `<button class="search-btn" onclick="window.open('${primarySearchLink}', '_blank'); event.stopPropagation();" title="Sök på ${primarySearchText}">
                    <svg viewBox="0 0 16 16" xmlns="http://www.w3.org/2000/svg"><path d="M11.742 10.344a6.5 6.5 0 1 0-1.397 1.398h-.001c.03.04.062.078.098.115l3.85 3.85a1 1 0 0 0 1.415-1.414l-3.85-3.85a1.007 1.007 0 0 0-.115-.1zM12 6.5a5.5 5.5 0 1 1-11 0 5.5 5.5 0 0 1 11 0z"/></svg>
                </button>` : 
                '';

            const serviceFilterCell = `
                <span class="service-filter-cell">
                    ${searchButton}
                    <button class="copy-btn" onclick="copyToClipboard('${item.service_filter.replace(/'/g, "\\'")}'); event.stopPropagation();" title="Kopiera Artikelnummer">&#x1F4CB;</button>
                    <span class="service-filter-text">${item.service_filter}</span>
                </span>
            `;

            row.innerHTML = `
                ${serviceFilterCell}
                <span>${item.name}</span>
                <span>${formatPrice(item.price)} kr</span>
                ${quantityCell}
                <span style="display: flex; align-items: center;"><span class="${statusClass}">${statusText}</span></span>
                ${notesCell}
                <span class="action-cell">${finalLinkCellContent}</span>
                <div class="action-buttons">${editButton}<button class="delete-btn" onclick="handleDelete(${item.id}); event.stopPropagation();">Ta bort</button></div>`;
            return row;
        }

        // --- UPPDATERAD: hanterar nu "tom" vy ---
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

            // Uppdaterar display-logik för rubriker (oförändrad)
            document.getElementById('service-artiklar-titel').style.display = serviceArtiklar.length > 0 ? 'flex' : 'none';
            document.getElementById('service-artiklar-wrapper').style.display = serviceArtiklar.length > 0 ? 'block' : 'none';
            document.getElementById('motor-chassi-artiklar-titel').style.display = motorChassiArtiklar.length > 0 ? 'flex' : 'none';
            document.getElementById('motor-chassi-artiklar-wrapper').style.display = motorChassiArtiklar.length > 0 ? 'block' : 'none';
            const andraMarkenHasItems = andraMarkenArtiklar.length > 0;
            const andraMarkenTitle = document.getElementById('andra-marken-artiklar-titel');
            const andraMarkenWrapper = document.getElementById('andra-marken-artiklar-wrapper');
            andraMarkenTitle.style.display = andraMarkenHasItems ? 'flex' : 'none';
            andraMarkenWrapper.style.display = andraMarkenHasItems ? 'block' : 'none';
            slutILagerSektion.style.display = slutILager.length > 0 ? 'block' : 'none';
            
            // --- NYTT: Visa/dölj "Tomt" meddelande ---
            // Döljer listan och visar "tom"-meddelandet om listan är tom
            const totalSearchMatches = data.length;
            
            emptyStates.service.style.display = serviceArtiklar.length === 0 ? 'flex' : 'none';
            emptyStates.motorChassi.style.display = motorChassiArtiklar.length === 0 ? 'flex' : 'none';
            emptyStates.andraMarken.style.display = andraMarkenArtiklar.length === 0 ? 'flex' : 'none';
            emptyStates.slutILager.style.display = slutILager.length === 0 ? 'flex' : 'none';
            
            // Om sökningen är tom, justera "tom"-meddelandet
            if (totalSearchMatches === 0 && searchInput.value.length > 0) {
                Object.values(emptyStates).forEach(el => {
                    if (el.style.display === 'flex') { // Justera bara de som visas
                        el.querySelector('h4').textContent = 'Inga träffar';
                        el.querySelector('p').textContent = `Din sökning på "${searchInput.value}" gav inga resultat.`;
                    }
                });
            } else {
                 // Återställ standardtext (du kan göra detta mer robust om du vill)
                 emptyStates.service.querySelector('h4').textContent = 'Inga serviceartiklar';
                 emptyStates.service.querySelector('p').textContent = 'Din sökning gav inga träffar, eller så har du inte lagt till några artiklar i denna kategori.';
                 // ... (upprepa för övriga)
            }
        }

        // Sökrelevans (oförändrad)
        function calculateRelevance(item, searchWords) {
            let score = 0;
            const serviceFilter = (item.service_filter || '').toLowerCase();
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

        // --- UPPDATERAD: hanterar nu sorteringsikoner ---
        function sortAndRender() {
            const searchTerm = searchInput.value.toLowerCase().trim();
            let filteredInventory = [...inventory];

            if (searchTerm !== '') {
                const searchWords = searchTerm.split(/\s+/).filter(word => word.length > 1 && !stopWords.includes(word));
                if (searchWords.length === 0 && searchTerm.length > 0) {
                     searchWords.push(searchTerm);
                }

                filteredInventory = inventory
                    .map(item => ({
                        ...item,
                        relevanceScore: calculateRelevance(item, searchWords)
                    }))
                    .filter(item => item.relevanceScore > 0)
                    .sort((a, b) => b.relevanceScore - a.relevanceScore); // Sortera efter relevans först
            } else {
                // Sortera efter vald kolumn om ingen sökning görs
                filteredInventory.sort((a, b) => {
                    let aVal = a[currentSort.column];
                    let bVal = b[currentSort.column];
                    if (typeof aVal === 'string' && typeof bVal === 'string') {
                        return currentSort.direction === 'asc' ? aVal.localeCompare(bVal, 'sv') : bVal.localeCompare(aVal, 'sv');
                    } else {
                        return currentSort.direction === 'asc' ? (aVal || 0) - (bVal || 0) : (bVal || 0) - (aVal || 0);
                    }
                });
            }
            
            renderInventory(filteredInventory);

            // --- NYTT: Uppdatera sorteringsikoner ---
            document.querySelectorAll('.header span[data-sort]').forEach(span => {
                span.classList.remove('active', 'asc', 'desc');
                const icon = span.querySelector('.sort-icon');
                if (icon) icon.textContent = ''; // Rensa alla ikoner
            });
            
            // Sätt aktiv ikon
            const activeHeader = document.querySelector(`.header span[data-sort="${currentSort.column}"]`);
            if (activeHeader) {
                activeHeader.classList.add('active', currentSort.direction);
                const icon = activeHeader.querySelector('.sort-icon');
                if (icon) {
                    // Visa bara ikon om ingen sökning är aktiv (då relevans styr)
                    if(searchTerm === '') {
                        icon.textContent = currentSort.direction === 'asc' ? ' ▲' : ' ▼';
                    }
                }
            }
        }

        function applySearchFilter() {
             clearTimeout(window.searchTimeout);
             window.searchTimeout = setTimeout(sortAndRender, 150);
        }
        
        // Firebase Spara/Ta bort (oförändrad)
        async function saveInventoryItem(itemData) {
            const itemRef = doc(db, INVENTORY_COLLECTION, String(itemData.id));
            await setDoc(itemRef, itemData);
        }
        
        async function deleteInventoryItem(itemId) {
            const itemRef = doc(db, INVENTORY_COLLECTION, String(itemId));
            await deleteDoc(itemRef);
        }
        
        // --- UPPDATERAD: Kallar på Dashboard & Sync-funktioner ---
        function setupRealtimeListener() {
            const q = collection(db, INVENTORY_COLLECTION);
            
            onSnapshot(q, (querySnapshot) => {
                const tempInventory = [];
                querySnapshot.forEach((doc) => {
                    tempInventory.push(doc.data());
                });
                inventory = tempInventory;
                
                applySearchFilter(); // Renderar om listan
                renderDashboard(inventory); // <-- NYTT: Uppdatera dashboard
                
                const now = new Date();
                updateSyncStatus('ok', `Synkroniserad ${now.toLocaleTimeString('sv-SE')}`); // <-- NYTT
                
            }, (error) => {
                console.error("Realtime listener error: ", error);
                updateSyncStatus('error', 'Synk-fel: Se konsolen'); // <-- NYTT
            });
        }
        
        // Formulär-logik (oförändrad)
        function toggleAddForm() {
            const isCurrentlyOpen = addFormWrapper.classList.contains('open');
            const newState = isCurrentlyOpen ? 'closed' : 'open';
            addFormWrapper.classList.toggle('open');
            toggleBtn.classList.toggle('open');
            localStorage.setItem('add_form_open_state', newState);
        }
        
        function initializeAddFormState() {
            const storedState = localStorage.getItem('add_form_open_state');
            if (storedState === 'open') {
                 addFormWrapper.classList.add('open');
                 toggleBtn.classList.add('open');
            }
        }

        // --- UPPDATERAD: Kontrollerar för dubbletter ---
        async function handleFormSubmit(event) {
            event.preventDefault();
            
            const submitBtn = addForm.querySelector('button[type="submit"]');
            const formData = new FormData(addForm);
            const serviceFilter = (formData.get('service_filter') || '').trim().toUpperCase();

            // --- NYTT: Kontrollera dubbletter ---
            if (serviceFilter && inventory.some(item => item.service_filter === serviceFilter)) {
                showCustomAlert(`Artikeln med artikelnummer <strong>${serviceFilter}</strong> finns redan i lagret. Välj ett unikt artikelnummer.`, 'Dubblett hittad');
                return; // Avbryt
            }
            // --- SLUT NYTT ---

            submitBtn.disabled = true;
            submitBtn.textContent = 'Sparar...';

            const newItem = {
                id: Date.now(), 
                service_filter: serviceFilter, // Använd validerad variabel
                name: (formData.get('name') || '').trim().toUpperCase(), // Ändrade till toUpperCase() för namn också
                price: parseFloat(formData.get('price')) || 0.00,
                quantity: parseInt(formData.get('quantity'), 10) || 0,
                category: formData.get('category') || 'Övrigt', 
                notes: (formData.get('notes') || '').trim(),
                link: (formData.get('link') || '').trim(),
            };
            
            await saveInventoryItem(newItem);
            
            addForm.reset();
            
            submitBtn.disabled = false;
            submitBtn.textContent = 'Spara Artikel';

            if (addFormWrapper.classList.contains('open')) {
                toggleAddForm(); 
            }
        }
        
        // Rad-logik (oförändrad)
        function handleRowSelect(id, row) {
            document.querySelectorAll('.artikel-rad').forEach(r => r.classList.remove('selected'));
            if (selectedItemId === id) {
                selectedItemId = null;
            } else {
                selectedItemId = id;
                row.classList.add('selected');
            }
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
                    title.textContent = 'Beställ Artikel';
                    submitBtn.textContent = 'Markera som Beställd';
                } else {
                    title.textContent = 'Redigera Artikel';
                    submitBtn.textContent = 'Spara Ändringar';
                }
                editModal.style.display = 'flex';
            }
        }

        async function handleEditSubmit(event) {
            event.preventDefault();

            const submitBtn = editForm.querySelector('button[type="submit"]');
            const originalText = submitBtn.textContent;
            submitBtn.disabled = true;
            submitBtn.textContent = 'Sparar...';

            const id = parseInt(editForm.querySelector('#edit-id').value, 10);
            const originalItem = inventory.find(i => i.id === id);
            
            const updatedItem = {
                ...originalItem,
                service_filter: editForm.querySelector('#edit-service_filter').value.trim().toUpperCase(),
                name: editForm.querySelector('#edit-name').value.trim().toUpperCase(), // Ändrade till toUpperCase()
                price: parseFloat(editForm.querySelector('#edit-price').value) || 0.00,
                quantity: parseInt(editForm.querySelector('#edit-quantity').value, 10) || 0,
                category: editForm.querySelector('#edit-category').value,
                notes: editForm.querySelector('#edit-notes').value.trim(),
                link: editForm.querySelector('#edit-link').value.trim(),
            };

            await saveInventoryItem(updatedItem);
            
            submitBtn.disabled = false;
            submitBtn.textContent = originalText;

            closeEditModal();
        }
        
        window.adjustQuantity = async function(id, change) {
            const item = inventory.find(i => i.id === id);
            if (item) {
                const newQuantity = Math.max(0, item.quantity + change);
                const updatedItem = {...item, quantity: newQuantity };
                await saveInventoryItem(updatedItem);
            }
        }
        
        // (Borttagen) window.capitalizeWords - ersatt med toUpperCase() direkt
        
        window.handleDelete = function(id) {
            const item = inventory.find(i => i.id === id);
            showCustomConfirmation(
                `Är du säker på att du vill ta bort <strong>${item.name} (${item.service_filter})</strong>?`,
                async (result) => {
                    if (result) {
                        await deleteInventoryItem(id);
                    }
                }, 'Bekräfta Borttagning'
            );
        }
        
        window.copyToClipboard = (text) => navigator.clipboard.writeText(text).then(() => showCustomAlert(`'${text}' har kopierats!`));
        
        // Modal-logik (oförändrad)
        function closeEditModal() { editModal.style.display = 'none'; }
        function closeConfirmationModal() { confirmationModal.style.display = 'none'; confirmCallback = null; }

        function showCustomConfirmation(message, callback, title = 'Bekräfta') {
            confirmationModal.querySelector('#confirmationTitle').innerHTML = title;
            confirmationModal.querySelector('#confirmationMessage').innerHTML = message;
            confirmationModal.querySelector('#confirmNo').style.display = 'inline-block';
            confirmationModal.style.display = 'flex';
            confirmCallback = callback;
        }
        
        function showCustomAlert(message, title = 'Meddelande') {
            showCustomConfirmation(message, () => closeConfirmationModal(), title);
            confirmationModal.querySelector('#confirmNo').style.display = 'none';
        }

        // --- UPPDATERAD: Lade till "Tillbaka till toppen"-knapp ---
        function initializeListeners() {
            addForm.addEventListener('submit', handleFormSubmit);
            editForm.addEventListener('submit', handleEditSubmit);
            searchInput.addEventListener('input', applySearchFilter); 
            toggleBtn.addEventListener('click', toggleAddForm);

            searchInput.addEventListener('input', () => {
                clearSearchBtn.style.display = searchInput.value.length > 0 ? 'block' : 'none';
            });
            clearSearchBtn.addEventListener('click', () => {
                searchInput.value = '';
                clearSearchBtn.style.display = 'none';
                applySearchFilter();
                searchInput.focus();
            });

            document.querySelectorAll('.lager-container').forEach(container => {
                container.addEventListener('scroll', () => {
                    container.classList.toggle('scrolled', container.scrollTop > 1);
                });
            });

            [editModal, confirmationModal].forEach(modal => {
                modal.addEventListener('click', (e) => {
                    if (e.target === modal || e.target.classList.contains('close-btn')) {
                        modal.style.display = 'none';
                    }
                });
            });
            
            document.querySelectorAll('.header span[data-sort]').forEach(header => {
                header.addEventListener('click', () => {
                    const column = header.getAttribute('data-sort');
                    // Om sökning är aktiv, rensa den och sortera
                    if (searchInput.value !== '') {
                        searchInput.value = '';
                    }
                    const direction = (currentSort.column === column && currentSort.direction === 'asc') ? 'desc' : 'asc';
                    currentSort = { column, direction };
                    applySearchFilter(); 
                });
            });
            
            document.getElementById('confirmYes').addEventListener('click', () => { if (confirmCallback) confirmCallback(true); closeConfirmationModal(); });
            document.getElementById('confirmNo').addEventListener('click', () => { if (confirmCallback) confirmCallback(false); closeConfirmationModal(); });

            document.querySelectorAll('.collapsible-header').forEach(header => {
                header.addEventListener('click', () => {
                    const wrapperId = header.id.replace('-titel', '-wrapper');
                    const wrapper = document.getElementById(wrapperId); 
                    if (!wrapper) return;
                    const isClosed = header.getAttribute('data-state') === 'closed';
                    const newState = isClosed ? 'open' : 'open';
                    header.setAttribute('data-state', newState);
                    wrapper.classList.toggle('collapsed', !isClosed);
                    localStorage.setItem(header.id, newState);
                });
            });

            // JSON-knappar (oförändrad)
            document.getElementById('download-json-btn').addEventListener('click', () => {
                const dataStr = JSON.stringify(inventory, null, 2);
                const blob = new Blob([dataStr], {type: "application/json"});
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a'); a.href = url; a.download = "lager_backup.json"; a.click(); URL.revokeObjectURL(url);
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
                                    showCustomAlert(`${uploadedInventory.length} artiklar uppladdade!`);
                                }
                            }, 'Skriv över lager?');
                        } else { showCustomAlert('Fel: JSON-filen är inte en giltig lista (array).'); }
                    } catch(err) { showCustomAlert('Kunde inte läsa filen. Kontrollera att det är en giltig JSON-fil.'); }
                };
                reader.readText(file); event.target.value = '';
            });

            // Global sök-knappar (oförändrad)
            if (globalSearchBtn) {
                globalSearchBtn.addEventListener('click', (event) => {
                    event.preventDefault(); 
                    handleGlobalSearch();
                });
            }
            globalSearchInput.addEventListener('keydown', (event) => {
                if (event.key === 'Enter') {
                    event.preventDefault(); 
                    handleGlobalSearch();
                }
            });

            // --- NYTT: Tillbaka till toppen-knapp ---
            const backToTopBtn = document.getElementById('back-to-top-btn');
            if (backToTopBtn) {
                window.addEventListener('scroll', () => {
                    if (window.scrollY > 300) {
                        backToTopBtn.style.display = 'flex'; // 'flex' för att centrera ikonen
                    } else {
                        backToTopBtn.style.display = 'none';
                    }
                });
                backToTopBtn.addEventListener('click', () => {
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                });
            }
        }
        
        function initializeCollapseState() {
            document.querySelectorAll('.collapsible-header').forEach(header => {
                const savedState = localStorage.getItem(header.id);
                const wrapperId = header.id.replace('-titel', '-wrapper');
                const wrapper = document.getElementById(wrapperId);

                if (savedState === 'closed') {
                    header.setAttribute('data-state', 'closed');
                    if (wrapper) {
                        wrapper.classList.add('collapsed');
                    }
                } 
            });
        }

        // KÖR ALLT I ORDNING
        updateSyncStatus('connecting', 'Ansluter...'); // <-- NYTT: Sätt initial status
        initializeAddFormState(); 
        initializeCollapseState();
        initializeListeners(); 
        renderSearchHistory();
        setupRealtimeListener();

    } catch (e) {
        console.error("App Initialization Error:", e);
        updateSyncStatus('error', 'Initieringsfel!'); // <-- NYTT: Felhantering
    }
});
