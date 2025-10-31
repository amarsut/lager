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
        
        // GLOBALA VARIABLER
        let inventory = []; 
        let selectedItemId = null;
        let currentSort = { column: 'name', direction: 'desc' };
        let confirmCallback = null; 
        
        // KORRIGERING: Definiera stoppord för naturligt språk-sökning (svenska)
        const stopWords = ['till', 'för', 'en', 'ett', 'och', 'eller', 'med', 'på', 'i', 'av', 'det', 'den', 'som', 'att', 'är', 'har', 'kan', 'ska', 'vill', 'sig', 'här', 'nu', 'från', 'man', 'vi', 'du', 'ni'];


        // ----------------------------------------------------------------------
        // LÄNK-FUNKTIONER
        // ----------------------------------------------------------------------
        
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
        // NY GLOBAL PRISJÄMFÖRELSE-FUNKTION
        // ----------------------------------------------------------------------
        function handleGlobalSearch() {
            const searchTerm = globalSearchInput.value.trim().toUpperCase();
            if (searchTerm === '') {
                globalSearchResults.innerHTML = '';
                globalSearchResults.style.display = 'none';
                return;
            }
            
            // Använd samma länk-logik som i createInventoryRow
            const trodoLink = generateTrodoLink(searchTerm);
            const aeroMLink = generateAeroMLink(searchTerm); 
            const thansenLink = generateThansenLink(searchTerm);
            
            let resultsHTML = '<div class="global-search-results-links">';
            let hasLinks = false;

            if (trodoLink) {
                resultsHTML += `<a href="${trodoLink}" target="_blank" class="lank-knapp">Sök på Trodo</a>`;
                hasLinks = true;
            }
            if (aeroMLink) {
                resultsHTML += `<a href="${aeroMLink}" target="_blank" class="lank-knapp aero-m-btn">Sök på Aero M</a>`;
                hasLinks = true;
            }
            if (thansenLink) {
                resultsHTML += `<a href="${thansenLink}" target="_blank" class="lank-knapp thansen-btn">Sök på Thansen</a>`;
                hasLinks = true;
            }
            
            resultsHTML += '</div>';
            
            // Lägg till en stängningsknapp
            resultsHTML += '<button id="global-search-close-btn" title="Stäng resultat">&times;</button>';
            
            if (hasLinks) {
                globalSearchResults.innerHTML = resultsHTML;
                globalSearchResults.style.display = 'block';
                
                // Lägg till event listener för den nya stängningsknappen
                document.getElementById('global-search-close-btn').addEventListener('click', () => {
                    globalSearchResults.innerHTML = '';
                    globalSearchResults.style.display = 'none';
                    // globalSearchInput.value = ''; // Avkommentera om du vill rensa fältet
                });
            } else {
                // Om inga länkar kunde genereras
                globalSearchResults.innerHTML = '';
                globalSearchResults.style.display = 'none';
            }
        }

        // ----------------------------------------------------------------------
        // GRÄNSSNITT OCH HUVUDFUNKTIONER
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
            let secondaryButtonsHTML = '';
            let linkCellContent = '';

            // 1. Primär länk: Trodo (visas direkt)
            if (trodoLink) {
                // Notera den nya klassen 'trodo-btn' (inte 'trodo-main-btn' som var fel i din fil)
                primaryButtonHTML = `<button class="lank-knapp" onclick="window.open('${trodoLink}', '_blank'); event.stopPropagation();">Trodo</button>`;
            }

            // 2. Sekundära länkar (läggs i Mer-menyn)
            let hasSecondaryLinks = false;
            if (aeroMLink) {
                // Notera klassen 'aero-m-btn' för styling
                secondaryButtonsHTML += `<button class="lank-knapp aero-m-btn" onclick="window.open('${aeroMLink}', '_blank'); event.stopPropagation();">Aero M</button>`;
                hasSecondaryLinks = true;
            }
            if (thansenLink) {
                // Notera klassen 'thansen-btn' för styling
                secondaryButtonsHTML += `<button class="lank-knapp thansen-btn" onclick="window.open('${thansenLink}', '_blank'); event.stopPropagation();">Thansen</button>`;
                hasSecondaryLinks = true;
            }
            if (egenLink) {
                // Notera klassen 'egen-lank-btn' för styling
                secondaryButtonsHTML += `<button class="lank-knapp egen-lank-btn" onclick="window.open('${egenLink}', '_blank'); event.stopPropagation();">Egen Länk</button>`;
                hasSecondaryLinks = true;
            }

            
            // Bygg länkcellens innehåll
            if (primaryButtonHTML) {
                linkCellContent += primaryButtonHTML;
            }

            if (hasSecondaryLinks) {
                // Skapa Mer-knappen med dropdown-funktionalitet
                const dropdownId = `link-dropdown-${item.id}`;
                
                // Mer-knappen (använder en enkel knapp med text 'Mer')
                const moreButton = `<button class="lank-knapp" onclick="toggleDropdown('${dropdownId}'); event.stopPropagation();">Mer</button>`;
                
                // Dropdown-menyn (innehåller alla sekundära länkar)
                const dropdownMenu = `
                    <div id="${dropdownId}" class="dropdown-menu">
                        ${secondaryButtonsHTML}
                    </div>
                `;
                
                linkCellContent += `
                    <div class="link-dropdown-container">
                        ${moreButton}
                        ${dropdownMenu}
                    </div>
                `;
            }
            
            // Fallback om inga länkar finns
            if (!linkCellContent) {
                linkCellContent = '<span>(Saknas)</span>';
            }

            // Kolumnens innehåll
            const finalLinkCellContent = `<div class="link-buttons">${linkCellContent}</div>`;


            // Den primära sökikonen (förstoringsglaset) på artikelnumret länkar till Trodo, eller den första tillgängliga länken.
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

        // --- Resten av funktionerna (renderInventory, calculateRelevance, sortAndRender, m.fl.) är desamma ---
        
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
            const andraMarkenHasItems = andraMarkenArtiklar.length > 0;
            const andraMarkenTitle = document.getElementById('andra-marken-artiklar-titel');
            const andraMarkenWrapper = document.getElementById('andra-marken-artiklar-wrapper');

            andraMarkenTitle.style.display = andraMarkenHasItems ? 'flex' : 'none';
            andraMarkenWrapper.style.display = andraMarkenHasItems ? 'block' : 'none';

            slutILagerSektion.style.display = slutILager.length > 0 ? 'block' : 'none';
        }

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


        function sortAndRender() {
            const searchTerm = searchInput.value.toLowerCase().trim();
            
            if (searchTerm === '') {
                const sortedInventory = [...inventory].sort((a, b) => {
                    let aVal = a[currentSort.column];
                    let bVal = b[currentSort.column];
                    if (typeof aVal === 'string' && typeof bVal === 'string') {
                        return currentSort.direction === 'asc' ? aVal.localeCompare(bVal, 'sv') : bVal.localeCompare(aVal, 'sv');
                    } else {
                        return currentSort.direction === 'asc' ? (aVal || 0) - (bVal || 0) : (bVal || 0) - (aVal || 0);
                    }
                });
                renderInventory(sortedInventory);
                return;
            }

            const searchWords = searchTerm.split(/\s+/)
                                          .filter(word => word.length > 1 && !stopWords.includes(word));
            
            if (searchWords.length === 0 && searchTerm.length > 0) {
                 searchWords.push(searchTerm);
            }

            const scoredInventory = inventory
                .map(item => ({
                    ...item,
                    relevanceScore: calculateRelevance(item, searchWords)
                }))
                .filter(item => item.relevanceScore > 0);
            
            const sortedAndFilteredInventory = scoredInventory.sort((a, b) => {
                if (b.relevanceScore !== a.relevanceScore) {
                    return b.relevanceScore - a.relevanceScore;
                }
                let aVal = a[currentSort.column];
                let bVal = b[currentSort.column];
                
                if (typeof aVal === 'string' && typeof bVal === 'string') {
                    return currentSort.direction === 'asc' ? aVal.localeCompare(bVal, 'sv') : bVal.localeCompare(aVal, 'sv');
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

        async function handleFormSubmit(event) {
            event.preventDefault();
            
            const submitBtn = addForm.querySelector('button[type="submit"]');
            submitBtn.disabled = true;
            submitBtn.textContent = 'Sparar...';

            const formData = new FormData(addForm);
            const newItem = {
                id: Date.now(), 
                service_filter: (formData.get('service_filter') || '').trim().toUpperCase(),
                name: (formData.get('name') || '').trim(),
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
                const updatedItem = {...item, quantity: newQuantity };
                await saveInventoryItem(updatedItem);
            }
        }

        window.capitalizeWords = function(inputElement) {
            let value = inputElement.value;
            let transformedValue = value.split(' ').map(word => 
                word.charAt(0).toUpperCase() + word.slice(1)
            ).join(' ');
            inputElement.value = transformedValue;
        }
        
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

        function initializeListeners() {
            addForm.addEventListener('submit', handleFormSubmit);
            editForm.addEventListener('submit', handleEditSubmit);
            searchInput.addEventListener('input', applySearchFilter); 
            toggleBtn.addEventListener('click', toggleAddForm);

            // NYA LYSSNARE FÖR GLOBAL SÖK
            globalSearchBtn.addEventListener('click', handleGlobalSearch);
            globalSearchInput.addEventListener('keydown', (event) => {
                if (event.key === 'Enter') {
                    event.preventDefault(); // Förhindra formulär-submit
                    handleGlobalSearch();
                }
            });
            // SLUT NYA LYSSNARE

            searchInput.addEventListener('input', () => {
                if (searchInput.value.length > 0) {
                    clearSearchBtn.style.display = 'block';
                } else {
                    clearSearchBtn.style.display = 'none';
                }
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
                    const newState = isClosed ? 'open' : 'closed';
                    header.setAttribute('data-state', newState);
                    wrapper.classList.toggle('collapsed', !isClosed);
                    localStorage.setItem(header.id, newState);
                });
            });

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
                        } else {
                            showCustomAlert('Fel: JSON-filen är inte en giltig lista (array).');
                        }
                    } catch(err) {
                        showCustomAlert('Kunde inte läsa filen. Kontrollera att det är en giltig JSON-fil.');
                    }
                };
                reader.readAsText(file); event.target.value = '';
            });
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
        initializeAddFormState(); 
        initializeCollapseState();
        initializeListeners(); 
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


