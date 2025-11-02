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

        // NYA DOM-ELEMENT FÖR INSTÄLLNINGAR
        const toggleSettingsBtn = document.getElementById('toggle-settings-btn');
        const settingsWrapper = document.getElementById('settings-wrapper');

        const HISTORY_KEY = 'globalSearchHistory';
        const MAX_HISTORY_ITEMS = 5;
        
        // GLOBALA VARIABLER
        let inventory = []; 
        let selectedItemId = null;
        let currentSort = { column: 'name', direction: 'desc' }; // Standard sortering
        let confirmCallback = null; 
        
        // KORRIGERING: Definiera stoppord för naturligt språk-sökning (svenska)
        const stopWords = ['till', 'för', 'en', 'ett', 'och', 'eller', 'med', 'på', 'i', 'av', 'det', 'den', 'som', 'att', 'är', 'har', 'kan', 'ska', 'vill', 'sig', 'här', 'nu', 'från', 'man', 'vi', 'du', 'ni'];


        // ----------------------------------------------------------------------
        // NY FUNKTION: UPPDATERA SORTERINGS-IKONER
        // ----------------------------------------------------------------------

        /**
         * Uppdaterar sorteringsikonerna i tabellrubrikerna baserat på aktuell sortering.
         */
        function updateSortIcons() {
            document.querySelectorAll('.header span[data-sort]').forEach(header => {
                const column = header.getAttribute('data-sort');
                const icon = header.querySelector('.sort-icon');

                // Nollställ alla ikoner
                icon.className = 'sort-icon'; 

                if (column === currentSort.column) {
                    // Lägg till rätt klass för den aktiva kolumnen (asc/desc)
                    icon.classList.add(currentSort.direction);
                }
            });
        }


        // ----------------------------------------------------------------------
        // NYA FUNKTIONER: INSTÄLLNINGAR
        // ----------------------------------------------------------------------
        
        /**
         * Växlar synligheten för inställnings-sektionen.
         */
        function toggleSettings() {
            const isOpen = settingsWrapper.classList.toggle('open');
            toggleSettingsBtn.classList.toggle('open', isOpen);
            localStorage.setItem('settingsFormState', isOpen ? 'open' : 'closed');
        }

        /**
         * Initierar inställnings-sektionens tillstånd från localStorage vid laddning.
         */
        function initializeSettingsState() {
            const savedState = localStorage.getItem('settingsFormState');
            if (savedState === 'open') {
                settingsWrapper.classList.add('open');
                toggleSettingsBtn.classList.add('open');
            }
        }
      
        // ----------------------------------------------------------------------
        // LÄNK-FUNKTIONER (OÄNDRADE)
        // ----------------------------------------------------------------------

        // Funktion för att spara en sökterm till localStorage
        function saveSearchToHistory(term) {
            if (!term) return;
            
            let history = JSON.parse(localStorage.getItem(HISTORY_KEY) || '[]');
            
            // Filtrera bort den nuvarande termen för att undvika dubletter
            history = history.filter(h => h !== term);
            
            // Lägg till den nya termen först
            history.unshift(term);
            
            // Begränsa till MAX_HISTORY_ITEMS
            if (history.length > MAX_HISTORY_ITEMS) {
                history = history.slice(0, MAX_HISTORY_ITEMS);
            }
            
            localStorage.setItem(HISTORY_KEY, JSON.stringify(history));
            
            // Uppdatera visningen direkt
            renderSearchHistory();
        }

        // Funktion för att rita ut historikknapparna
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
                // Lägg till en knapp för varje historik-term
                historyHTML += `<span class="history-item" data-term="${term}">${term}</span>`;
            });
            
            historyContainer.innerHTML = historyHTML;
            
            // Lägg till EventListeners på de nya knapparna
            document.querySelectorAll('.history-item').forEach(item => {
                item.addEventListener('click', (e) => {
                    const term = e.target.getAttribute('data-term');
                    const globalSearchInput = document.getElementById('global-search-input');
                    
                    // 1. Fyll i sökfältet
                    globalSearchInput.value = term;
                    
                    // 2. Kör sökningen (använder den nya 'override'-funktionen)
                    handleGlobalSearch(term);
                    
                    // 3. Scrolla upp till resultat
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
        
        // --- UPPDATERAD LÄNKGENERERING FÖR AERO M ---
        function generateAeroMLink(serviceFilter) {
            if (!serviceFilter) return null;
            // Tar bort alla mellanslag och bindestreck för att få en ren artikelnummer-sträng.
            const searchFilter = serviceFilter.replace(/[\s-]/g, ''); 
            // Observera 'sök' i URL:en och inte 'search'.
            // Den här strukturen baseras på dina exempellänkar.
            return `https://aeromotors.se/sok?s=${searchFilter}&layered_id_feature_1586%5B%5D=3&sort_by=price.asc`; 
        }

        function generateTrodoLink(serviceFilter) {
            if (!serviceFilter) return null;
            const searchFilter = serviceFilter.replace(/[\s-]/g, ''); 
            const searchQuery = encodeURIComponent(searchFilter);
            return `https://www.trodo.se/catalogsearch/result/premium?filter[quality_group]=2&product_list_dir=asc&product_list_order=price&q=${searchQuery}`;
        }
        
        // --- UPPDATERAD LÄNKGENERERING FÖR THANSEN ---
        function generateThansenLink(serviceFilter) {
            if (!serviceFilter) return null;
            const searchFilter = serviceFilter.replace(/[\s-]/g, ''); 
            const searchQuery = encodeURIComponent(searchFilter);
            // Observera den uppdaterade sökvägen /bil/reservdelar/sok?query=
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
            // Bildelsbasen använder formatet /OEM/ARTIKELNUMMER
            return `https://bildelsbasen.se/sv-se/OEM/${searchFilter}`; 
        }

        function generateReservdelar24Link(serviceFilter) {
            if (!serviceFilter) return null;
            const searchFilter = encodeURIComponent(serviceFilter.replace(/[\s-]/g, ''));
            return `https://reservdelar24.se/suche.html?keyword=${searchFilter}`;
        }
        
        // Global funktion för att hantera dropdowns (MÅSTE vara global för att funka i onclick)
        window.toggleDropdown = function(dropdownId) {
            const dropdown = document.getElementById(dropdownId);
            if (!dropdown) return;
            
            // Stäng alla andra öppna dropdowns
            document.querySelectorAll('.dropdown-menu.visible').forEach(openDropdown => {
                if (openDropdown.id !== dropdownId) {
                    openDropdown.classList.remove('visible');
                }
            });

            // Växla synligheten för den valda dropdownen
            dropdown.classList.toggle('visible');
        };

        // NY global funktion för att stänga en specifik dropdown
        window.closeDropdown = function(dropdownId) {
            const dropdown = document.getElementById(dropdownId);
            if (dropdown) {
                dropdown.classList.remove('visible');
            }
        };

        // Lyssnare för att stänga dropdowns när man klickar utanför (globalt i dokumentet)
        document.addEventListener('click', (event) => {
            // Kontrollera om klicket var inuti en 'link-dropdown-container' eller inte
            if (!event.target.closest('.link-dropdown-container')) {
                document.querySelectorAll('.dropdown-menu.visible').forEach(dropdown => {
                    dropdown.classList.remove('visible');
                });
            }
        });


        // ----------------------------------------------------------------------
        // NY GLOBAL PRISJÄMFÖRELSE-FUNKTION (OÄNDRAD)
        // ----------------------------------------------------------------------
        const externalSearchProviders = [
            { name: "Trodo", linkGenerator: generateTrodoLink, icon: "https://www.trodo.se/media/favicon/default/favicon-96x96.png" },
            { name: "AeroMotors", linkGenerator: generateAeroMLink, icon: "https://aeromotors.se/img/favicon.ico?1678367017" }, // Bytt till PNG då ICO är svårt ibland
            { name: "Thansen", linkGenerator: generateThansenLink, icon: "https://cdn.thg.dk/DAT/dom/img/logo-thg.ico" },
            { name: "Skruvat", linkGenerator: generateSkruvatLink, icon: "https://www.skruvat.se/favicon.ico" },
            { name: "Vorto.se", linkGenerator: generateVortoLink, icon: "https://www.vorto.se/favicon.ico" },
            { name: "Autodoc", linkGenerator: generateAutodocLink, icon: "https://autodoc.se/assets/54eb94/images/favicon-196x196.png" },
            { name: "Bildelsbasen*", linkGenerator: generateBildelsbasenLink, icon: "https://www.bildelsbasen.se/favicon.ico" },
            { name: "Reservdelar24", linkGenerator: generateReservdelar24Link, icon: "https://www.reservdelar24.se/favicon.ico" },
        ];


        function handleGlobalSearch(searchTermOverride) {
            // Använd override (från historiken) om den finns, annars hämta från inputfältet
            const searchTerm = searchTermOverride ? searchTermOverride.trim().toUpperCase() : globalSearchInput.value.trim().toUpperCase();

            if (searchTerm === '') {
                globalSearchResults.innerHTML = '';
                globalSearchResults.style.display = 'none';
                return;
            }

            // SPARA SÖKTERM TILL HISTORIKEN (NYTT!)
            saveSearchToHistory(searchTerm); 

            const searchIconSVG = `<svg class="btn-search-icon" ... > ... </svg>`; // Behåll din befintliga SVG här.

            let resultsHTML = '<div class="global-search-results-links">';
            let hasLinks = false;

            externalSearchProviders.forEach(provider => {
                const link = provider.linkGenerator(searchTerm);
                if (link) {
                    // Använd favicon och namnet i knappen (NYTT!)
                    const iconHTML = `<img src="${provider.icon}" alt="${provider.name}" class="link-favicon">`;
                    
                    resultsHTML += `<a href="${link}" target="_blank" class="lank-knapp">${iconHTML}${provider.name}</a>`;
                    hasLinks = true;
                }
            });

            resultsHTML += '</div>';
            
            // Lägg till footer för Bildelsbasen om den är med
            if (searchTerm.length > 0) {
                resultsHTML += '<div class="search-disclaimer-text">* Bildelsbasen söker primärt efter begagnade delar.</div>';
            }

            if (hasLinks) {
                globalSearchResults.innerHTML = resultsHTML;
                globalSearchResults.style.display = 'block';
            } else {
                globalSearchResults.innerHTML = '';
                globalSearchResults.style.display = 'none';
            }
            
            // Stäng-knapp (om du har den, annars ignorera)
            document.getElementById('global-search-close-btn').addEventListener('click', () => {
                globalSearchResults.innerHTML = '';
                globalSearchResults.style.display = 'none';
            });
        }

        // ----------------------------------------------------------------------
        // GRÄNSSNITT OCH HUVUDFUNKTIONER (OÄNDRADE)
        // ----------------------------------------------------------------------

        function createInventoryRow(item, isOutOfStock) {
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
            
            // Generera alla länkar
            const trodoLink = generateTrodoLink(item.service_filter);
            const aeroMLink = generateAeroMLink(item.service_filter); 
            const thansenLink = generateThansenLink(item.service_filter);
            const egenLink = item.link; // Användardefinierad länk
            
            let primaryButtonHTML = '';
            let linkCellContent = '';

            // 1. Primär länk: Trodo (visas direkt, nu med neutral "lank-knapp" stil)
            if (trodoLink) {
                primaryButtonHTML = `<button class="lank-knapp trodo-btn" onclick="window.open('${trodoLink}', '_blank'); event.stopPropagation();">Trodo</button>`;
            }

            // --- 2. UPPDATERAD LOGIK HÄR ---
            // Bygg länkcellens innehåll
            if (primaryButtonHTML) {
                linkCellContent += primaryButtonHTML;
            }

            // Kontrollera om det finns några sekundära länkar
            const hasSecondaryLinks = aeroMLink || thansenLink || egenLink;

            if (hasSecondaryLinks) {
                // Skapa ID:t FÖRST
                const dropdownId = `link-dropdown-${item.id}`;

                // Bygg de sekundära knapparna NU, med ID:t
                // Notera tillägget av closeDropdown('${dropdownId}') i varje onclick
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

                // Skapa dropdown-behållaren
                const dropdownContainer = `
                    <div class="link-dropdown-container">
                        <button class="lank-knapp more-btn" onclick="toggleDropdown('${dropdownId}'); event.stopPropagation();">Mer...</button>
                        <div id="${dropdownId}" class="dropdown-menu">
                            ${secondaryButtonsHTML}
                        </div>
                    </div>
                `;
                
                // Lägg till dropdown-behållaren
                linkCellContent += dropdownContainer;
            }
            
            const serviceFilterCell = `<span style="display: flex; align-items: center;"><span class="copy-btn" onclick="copyToClipboard('${item.service_filter}'); event.stopPropagation();" title="Kopiera artikelnummer">${item.service_filter}</span></span>`;

            // Den sista div:en innehåller åtgärderna, som är den sticky-kolumnen
            row.innerHTML = `
                ${serviceFilterCell}
                <span>${item.name}</span>
                <span>${formatPrice(item.price)} kr</span>
                ${quantityCell}
                <span style="display: flex; align-items: center;"><span class="${statusClass}">${statusText}</span></span>
                ${notesCell}
                <span class="action-cell">${linkCellContent}</span>
                <div class="action-buttons">${editButton}<button class="delete-btn" onclick="handleDelete(${item.id}); event.stopPropagation();">Ta bort</button></div>
            `;
            
            return row;
        }

        // --- Resten av funktionerna (renderInventory, calculateRelevance, m.fl.) är desamma ---

        function renderInventory(data) {
            serviceArtiklarLista.innerHTML = '';
            motorChassiArtiklarLista.innerHTML = '';
            andraMarkenArtiklarLista.innerHTML = '';
            slutILagerLista.innerHTML = '';

            // I detta steg har datan redan filtrerats och sorterats av sortAndRender
            const iLager = data.filter(item => item.quantity > 0);
            const slutILager = data.filter(item => item.quantity <= 0);

            const serviceArtiklar = iLager.filter(item => item.category === 'Service');
            const motorChassiArtiklar = iLager.filter(item => item.category === 'Motor/Chassi' || item.category === 'Övrigt' || !item.category);
            const andraMarkenArtiklar = iLager.filter(item => item.category === 'Andra Märken');

            serviceArtiklar.forEach(item => serviceArtiklarLista.appendChild(createInventoryRow(item, false)));
            motorChassiArtiklar.forEach(item => motorChassiArtiklarLista.appendChild(createInventoryRow(item, false)));
            andraMarkenArtiklar.forEach(item => andraMarkenArtiklarLista.appendChild(createInventoryRow(item, false)));
            slutILager.forEach(item => slutILagerLista.appendChild(createInventoryRow(item, true)));

            // Uppdaterar display-logiken för alla rubriker baserat på innehåll
            document.getElementById('service-artiklar-titel').style.display = serviceArtiklar.length > 0 ? 'flex' : 'none';
            document.getElementById('service-artiklar-wrapper').style.display = serviceArtiklar.length > 0 ? 'block' : 'none';

            document.getElementById('motor-chassi-artiklar-titel').style.display = motorChassiArtiklar.length > 0 ? 'flex' : 'none';
            document.getElementById('motor-chassi-artiklar-wrapper').style.display = motorChassiArtiklar.length > 0 ? 'block' : 'none';

            document.getElementById('andra-marken-artiklar-titel').style.display = andraMarkenArtiklar.length > 0 ? 'flex' : 'none';
            document.getElementById('andra-marken-artiklar-wrapper').style.display = andraMarkenArtiklar.length > 0 ? 'block' : 'none';

            // Uppdaterar display-logiken för "Slut i Lager" sektionen
            const totaltSlut = slutILager.length;
            document.getElementById('slut-i-lager-sektion').style.display = totaltSlut > 0 ? 'flex' : 'none';
            document.getElementById('slut-i-lager-sektion').textContent = `Slut i Lager (${totaltSlut})`;
        }

        // Funktionen som räknar ut relevansen för söktermen (oändrad)
        function calculateRelevance(item, searchWords) {
            let score = 0;
            const fields = [item.service_filter, item.name, item.notes];

            searchWords.forEach(word => {
                const upperWord = word.toUpperCase();
                fields.forEach(field => {
                    if (field && field.toUpperCase().includes(upperWord)) {
                        score += 1;
                        if (field.toUpperCase().startsWith(upperWord)) {
                            score += 1.5; 
                        }
                        if (field.toUpperCase() === upperWord) {
                            score += 5; 
                        }
                    }
                });
            });
            return score;
        }

        // Huvudfunktion för sortering, filtrering och rendering (oändrad)
        function sortAndRender() {
            const searchTerm = searchInput.value.trim().toUpperCase();
            
            if (searchTerm.length === 0) {
                // Ingen sökterm: Sortera hela lagret
                const sortedInventory = [...inventory].sort((a, b) => {
                    let aVal = a[currentSort.column];
                    let bVal = b[currentSort.column];
                    
                    if (typeof aVal === 'string' && typeof bVal === 'string') {
                        // Strängsortering
                        const result = aVal.localeCompare(bVal, 'sv', { sensitivity: 'base' });
                        return currentSort.direction === 'asc' ? result : -result;
                    } else {
                        // Numerisk sortering (Pris, Antal, ID)
                        return currentSort.direction === 'asc' ? (aVal || 0) - (bVal || 0) : (bVal || 0) - (aVal || 0);
                    }
                });
                renderInventory(sortedInventory);
                return;
            }

            const searchWords = searchTerm.split(/\s+/)
                .filter(word => word.length > 1 && !stopWords.includes(word));
            
            // Fånga korta sökningar som inte är stoppord (t.ex. "ID")
            if (searchWords.length === 0 && searchTerm.length > 0) {
                 searchWords.push(searchTerm);
            }

            const scoredInventory = inventory
                .map(item => ({ ...item, relevanceScore: calculateRelevance(item, searchWords) }))
                .filter(item => item.relevanceScore > 0);

            const sortedAndFilteredInventory = scoredInventory.sort((a, b) => {
                // 1. Primär sortering: Relevans
                if (b.relevanceScore !== a.relevanceScore) {
                    return b.relevanceScore - a.relevanceScore;
                }
                
                // 2. Sekundär sortering: Efter vald kolumn (om relevansen är lika)
                let aVal = a[currentSort.column];
                let bVal = b[currentSort.column];
                
                if (typeof aVal === 'string' && typeof bVal === 'string') {
                    const result = aVal.localeCompare(bVal, 'sv', { sensitivity: 'base' });
                    return currentSort.direction === 'asc' ? result : -result;
                } else {
                    return currentSort.direction === 'asc' ? (aVal || 0) - (bVal || 0) : (bVal || 0) - (aVal || 0);
                }
            });
            renderInventory(sortedAndFilteredInventory);
        }

        function applySearchFilter() {
            clearTimeout(window.searchTimeout);
            window.searchTimeout = setTimeout(sortAndRender, 150);
        }

        async function saveInventoryItem(itemData) {
            const itemRef = doc(db, INVENTORY_COLLECTION, String(itemData.id));
            await setDoc(itemRef, itemData);
        }

        async function deleteInventoryItem(itemId) {
            const itemRef = doc(db, INVENTORY_COLLECTION, String(itemId));
            await deleteDoc(itemRef);
        }

        function setupRealtimeListener() {
            const q = collection(db, INVENTORY_COLLECTION);
            onSnapshot(q, (querySnapshot) => {
                const tempInventory = [];
                querySnapshot.forEach((doc) => {
                    tempInventory.push(doc.data());
                });
                inventory = tempInventory;
                applySearchFilter();
                const now = new Date();
                syncStatusElement.textContent = `Synkroniserad ${now.toLocaleTimeString('sv-SE')}`;
                syncStatusElement.style.color = 'var(--success-color)';
            }, (error) => {
                console.error("Realtime listener error: ", error);
                syncStatusElement.textContent = `FEL: Se konsolen`;
                syncStatusElement.style.color = 'var(--danger-color)';
            });
        }
        
        // ... (handleRowSelect, copyToClipboard, closeConfirmationModal, handleAddSubmit, etc. - oändrade)
        
        function handleRowSelect(id, row) {
            if (selectedItemId) {
                document.querySelector(`.artikel-rad[data-id="${selectedItemId}"]`).classList.remove('selected');
            }
            if (selectedItemId === id) {
                selectedItemId = null;
            } else {
                row.classList.add('selected');
                selectedItemId = id;
            }
        }
        
        window.copyToClipboard = function(text) {
            navigator.clipboard.writeText(text).then(() => {
                const message = document.createElement('div');
                message.textContent = `Kopierade: ${text}`;
                message.style.cssText = 'position: fixed; bottom: 20px; right: 20px; background: #333; color: white; padding: 10px 20px; border-radius: 5px; z-index: 9999; opacity: 0; transition: opacity 0.3s;';
                document.body.appendChild(message);
                
                // Visa meddelandet
                setTimeout(() => message.style.opacity = '1', 10);

                // Dölj och ta bort meddelandet
                setTimeout(() => {
                    message.style.opacity = '0';
                    setTimeout(() => message.remove(), 300);
                }, 1500);
            }).catch(err => {
                console.error('Kunde inte kopiera text: ', err);
            });
        };
        
        function closeConfirmationModal() {
            confirmationModal.style.display = 'none';
            confirmCallback = null; 
        }

        function showConfirmationModal(title, message, callback) {
            document.getElementById('confirmationTitle').textContent = title;
            document.getElementById('confirmationMessage').textContent = message;
            confirmationModal.style.display = 'flex';
            confirmCallback = callback;
        }

        async function handleAddSubmit(event) {
            event.preventDefault();
            const form = event.target;
            const submitBtn = form.querySelector('.btn-primary');
            const originalText = submitBtn.textContent;
            submitBtn.disabled = true;
            submitBtn.textContent = 'Sparar...';

            // Generera ett unikt ID för det nya objektet (högsta ID + 1)
            const newId = inventory.reduce((max, item) => Math.max(max, item.id || 0), 0) + 1;

            const newItem = {
                id: newId,
                service_filter: form.elements.service_filter.value.trim().toUpperCase(),
                name: form.elements.name.value.trim(),
                price: parseFloat(form.elements.price.value) || 0.00,
                quantity: parseInt(form.elements.quantity.value, 10) || 0,
                category: form.elements.category.value,
                notes: form.elements.notes.value.trim(),
                link: form.elements.link.value.trim(),
            };

            await saveInventoryItem(newItem);
            
            form.reset();
            submitBtn.disabled = false;
            submitBtn.textContent = originalText;
            
            // Stänger formuläret efter lyckad inmatning
            toggleAddForm(); 
        }


        function closeEditModal() {
            editModal.style.display = 'none';
        }

        function handleEdit(id, isOrderMode = false) {
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
                name: editForm.querySelector('#edit-name').value.trim(),
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
                const updatedItem = {
                    ...item,
                    quantity: newQuantity
                };
                await saveInventoryItem(updatedItem);
            }
        }
        
        function handleDelete(id) {
            const item = inventory.find(i => i.id === id);
            if (!item) return;

            showConfirmationModal(
                'Bekräfta Borttagning',
                `Är du säker på att du vill ta bort artikeln "${item.name}"? Detta kan inte ångras.`,
                (confirmed) => {
                    if (confirmed) {
                        deleteInventoryItem(id);
                        if (id === selectedItemId) selectedItemId = null;
                    }
                }
            );
        }

        function toggleAddForm() {
            const isOpen = addFormWrapper.classList.toggle('open');
            toggleBtn.classList.toggle('open', isOpen);
            localStorage.setItem('addFormState', isOpen ? 'open' : 'closed');
        }

        function initializeAddFormState() {
            const savedState = localStorage.getItem('addFormState');
            if (savedState === 'open') {
                addFormWrapper.classList.add('open');
                toggleBtn.classList.add('open');
            }
        }
        
        // --- FILHANTERING (OÄNDRADE) ---
        function handleDownloadJson() {
            const dataStr = JSON.stringify(inventory, null, 2);
            const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);

            const exportFileDefaultName = 'lager_export.json';

            const linkElement = document.getElementById('download-json-btn');
            linkElement.setAttribute('href', dataUri);
            linkElement.setAttribute('download', exportFileDefaultName);
            linkElement.click();
        }

        function handleUploadJson(event) {
            const file = event.target.files[0];
            if (!file) return;

            const reader = new FileReader();
            reader.onload = async (e) => {
                try {
                    const importedData = JSON.parse(e.target.result);
                    if (!Array.isArray(importedData)) {
                        alert('Fel: Den importerade filen är inte ett giltigt JSON-arrayformat.');
                        return;
                    }
                    
                    showConfirmationModal(
                        'Bekräfta Import',
                        `Är du säker på att du vill lägga till ${importedData.length} artiklar? Detta kommer att slås samman med ditt befintliga lager.`,
                        async (confirmed) => {
                            if (confirmed) {
                                // Hitta det högsta befintliga ID:t i lagret
                                let nextId = inventory.reduce((max, item) => Math.max(max, item.id || 0), 0) + 1;
                                
                                const batch = importedData.map(item => {
                                    // Ge artiklar utan ID ett nytt ID
                                    if (!item.id) {
                                        item.id = nextId++;
                                    }
                                    // Konvertera alla nummer till nummer (Firebase kan annars tolka dem som strängar)
                                    item.price = parseFloat(item.price) || 0.00;
                                    item.quantity = parseInt(item.quantity, 10) || 0;
                                    
                                    const itemRef = doc(db, INVENTORY_COLLECTION, String(item.id));
                                    return setDoc(itemRef, item);
                                });
                                
                                // Här behöver du egentligen en batch-commit för effektivitet, men setDoc fungerar
                                await Promise.all(batch);
                                
                                alert(`Importerade ${importedData.length} artiklar framgångsrikt!`);
                            }
                        }
                    );
                } catch (error) {
                    alert(`Ett fel uppstod vid importen: ${error.message}`);
                    console.error('Import Error:', error);
                }
            };
            reader.readAsText(file);
        }
        
        // --- LYSSNARE ---

        function initializeListeners() {
            addForm.addEventListener('submit', handleAddSubmit);
            editForm.addEventListener('submit', handleEditSubmit);
            toggleBtn.addEventListener('click', toggleAddForm);
            
            // Lyssna på Inställningar-knappen (NYTT!)
            if (toggleSettingsBtn) {
                toggleSettingsBtn.addEventListener('click', toggleSettings);
            }
            
            // Lyssna på JSON-knapparna (nu flyttade till Inställningar)
            document.getElementById('download-json-btn').addEventListener('click', handleDownloadJson);
            document.getElementById('upload-json-input').addEventListener('change', handleUploadJson);

            // Sökfilter-lyssnare
            searchInput.addEventListener('input', applySearchFilter);
            clearSearchBtn.addEventListener('click', () => {
                searchInput.value = '';
                clearSearchBtn.style.display = 'none';
                applySearchFilter();
            });
            searchInput.addEventListener('input', () => {
                 clearSearchBtn.style.display = searchInput.value.length > 0 ? 'block' : 'none';
            });

            // Lyssna på modaler
            document.querySelectorAll('.modal').forEach(modal => {
                modal.addEventListener('click', (e) => {
                    if (e.target === modal || e.target.classList.contains('close-btn')) {
                        modal.style.display = 'none';
                    }
                });
            });

            // Sorteringslyssnare (UPPDATERAD!)
            document.querySelectorAll('.header span[data-sort]').forEach(header => {
                header.addEventListener('click', () => {
                    const column = header.getAttribute('data-sort');
                    // Om vi klickar på samma kolumn, byt riktning. Annars sätt till standard DESC.
                    const direction = (currentSort.column === column && currentSort.direction === 'desc') ? 'asc' : 'desc'; 
                    currentSort = { column, direction };
                    
                    // 1. Uppdatera ikonerna (NYTT!)
                    updateSortIcons(); 

                    // 2. Filtrera/sortera och rendera
                    applySearchFilter();
                });
            });

            document.getElementById('confirmYes').addEventListener('click', () => {
                if (confirmCallback) confirmCallback(true);
                closeConfirmationModal();
            });

            document.getElementById('confirmNo').addEventListener('click', () => {
                if (confirmCallback) confirmCallback(false);
                closeConfirmationModal();
            });

            document.querySelectorAll('.collapsible-header').forEach(header => {
                header.addEventListener('click', () => {
                    const wrapperId = header.id.replace('-titel', '-wrapper');
                    const wrapper = document.getElementById(wrapperId);
                    if (!wrapper) return;

                    const isClosed = header.getAttribute('data-state') === 'closed';
                    const newState = isClosed ? 'open' : 'closed';
                    
                    header.setAttribute('data-state', newState);
                    wrapper.classList.toggle('collapsed', !isClosed);
                    
                    // Spara tillstånd i localStorage
                    localStorage.setItem(header.id, newState);
                });
            });

            if (globalSearchBtn) {
                globalSearchBtn.addEventListener('click', (event) => {
                // Förhindra standardformulärbeteende om knappen ligger i ett formulär
                event.preventDefault(); 
            
                // Anropa din sökfunktion
                handleGlobalSearch();
              });
            }

            globalSearchInput.addEventListener('keydown', (event) => {
                if (event.key === 'Enter') {
                    event.preventDefault(); // Förhindra formulär-submit
                    handleGlobalSearch();
                }
            });
            
            // Uppdatera sorteringsikonerna vid laddning (NYTT!)
            updateSortIcons();
        }

        // Funktion för att initiera tidigare tillstånd för formulär och sektioner (oändrad)
        function initializeCollapseState() {
            document.querySelectorAll('.collapsible-header').forEach(header => {
                const wrapperId = header.id.replace('-titel', '-wrapper');
                const wrapper = document.getElementById(wrapperId);
                const savedState = localStorage.getItem(header.id);
                
                if (savedState === 'closed') {
                    header.setAttribute('data-state', 'closed');
                    if (wrapper) {
                        wrapper.classList.add('collapsed');
                    }
                } 
            });
        }

        // KÖR ALLT I ORDNING
        initializeAddFormState(); 
        initializeSettingsState(); // NYTT!
        initializeCollapseState();
        initializeListeners(); 
        renderSearchHistory();
        setupRealtimeListener();

    } catch (e) {
        console.error("App Initialization Error:", e);
        const statusElement = document.getElementById('sync-status');
        if (statusElement) {
           statusElement.textContent = "FEL: Initieringsfel!";
           statusElement.style.color = 'var(--danger-color)';
        }
    }
});
