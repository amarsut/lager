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
        
        // GLOBALA VARIABLER
        let inventory = []; 
        let selectedItemId = null;
        let currentSort = { column: 'name', direction: 'desc' };
        let confirmCallback = null; 
        
        // KORRIGERING: Definiera stoppord för naturligt språk-sökning (svenska)
        const stopWords = ['till', 'för', 'en', 'ett', 'och', 'eller', 'med', 'på', 'i', 'av', 'det', 'den', 'som', 'att', 'är', 'har', 'kan', 'ska', 'vill', 'sig', 'här', 'nu', 'från', 'man', 'vi', 'du', 'ni'];


        // ----------------------------------------------------------------------
        // FUNKTIONER
        // ----------------------------------------------------------------------
        
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
                // Använd den nya smarta filter-funktionen
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

        function formatPrice(price) {
            return new Intl.NumberFormat('sv-SE', { 
                minimumFractionDigits: 2, 
                maximumFractionDigits: 2 
            }).format(price);
        }

        // NY FUNKTION: Genererar Aero M-länken (OBS: Antagen URL-struktur)
        function generateAeroMLink(serviceFilter) {
            if (!serviceFilter) return null;
            
            const searchFilter = serviceFilter.replace(/[\s-]/g, ''); 
            const searchQuery = encodeURIComponent(searchFilter);
            
            // Antagen URL för Aero M
            return `https://www.aerom.se/search?q=${searchQuery}`; 
        }

        function generateTrodoLink(serviceFilter) {
            if (!serviceFilter) return null;
            
            // Tar bort alla mellanslag och bindestreck för att få en ren artikelnummer-sträng.
            const searchFilter = serviceFilter.replace(/[\s-]/g, ''); 
            const searchQuery = encodeURIComponent(searchFilter);
            
            // Trodo länk
            return `https://www.trodo.se/catalogsearch/result/premium?filter[quality_group]=2&product_list_dir=asc&product_list_order=price&q=${searchQuery}`;
        }
        
        // Befintlig funktion: Genererar Thansen-länken
        function generateThansenLink(serviceFilter) {
            if (!serviceFilter) return null;
            
            // Tar bort alla mellanslag och bindestreck för att få en ren artikelnummer-sträng.
            const searchFilter = serviceFilter.replace(/[\s-]/g, ''); 
            const searchQuery = encodeURIComponent(searchFilter);
            
            // Thansen länkformat
            return `https://www.thansen.se/bil/reservdelar/sok?query=${searchQuery}`;
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
            
            // NY LOGIK: Generera alla länknappar i en container
            const aeroMLink = generateAeroMLink(item.service_filter); 
            const trodoLink = generateTrodoLink(item.service_filter);
            const thansenLink = generateThansenLink(item.service_filter);
            
            let linkButtonsHTML = '';
            
            // 1. Användar-angiven Länk ("Egen Länk")
            if (item.link) {
                linkButtonsHTML += `<button class="lank-knapp" onclick="window.open('${item.link}', '_blank'); event.stopPropagation();">Egen Länk</button>`;
            }
            
            // 2. NYTT: Aero M-knapp (återställd och använder .aero-m-btn stilen)
            if (aeroMLink) {
                linkButtonsHTML += `<button class="lank-knapp aero-m-btn" onclick="window.open('${aeroMLink}', '_blank'); event.stopPropagation();">Aero M</button>`;
            }
            
            // 3. Trodo-knapp (standardstil, kan stajlas med .trodo-btn om önskas)
            if (trodoLink) {
                // Jag lägger till 'trodo-btn' här så att du kan ge den en unik stil i CSS om du vill
                linkButtonsHTML += `<button class="lank-knapp trodo-btn" onclick="window.open('${trodoLink}', '_blank'); event.stopPropagation();">Trodo</button>`;
            }
            
            // 4. Thansen-knapp
            if (thansenLink) {
                linkButtonsHTML += `<button class="lank-knapp thansen-btn" onclick="window.open('${thansenLink}', '_blank'); event.stopPropagation();">Thansen</button>`;
            }
            
            // Kolumnens innehåll
            const linkCellContent = linkButtonsHTML ? `<div class="link-buttons">${linkButtonsHTML}</div>` : `<span>(Saknas)</span>`;

            // UPPDATERING: Den primära sökikonen (förstoringsglaset) på artikelnumret ska länka till den mest relevanta/första länken.
            const primarySearchLink = item.link || aeroMLink || trodoLink;
            const primarySearchText = item.link ? 'Egen Länk' : (aeroMLink ? 'Aero M' : 'Trodo');

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
                <span class="action-cell">${linkCellContent}</span>
                <div class="action-buttons">${editButton}<button class="delete-btn" onclick="handleDelete(${item.id}); event.stopPropagation();">Ta bort</button></div>`;
            return row;
        }

        function renderInventory(data) {
            serviceArtiklarLista.innerHTML = '';
            motorChassiArtiklarLista.innerHTML = '';
            andraMarkenArtiklarLista.innerHTML = '';
            slutILagerLista.innerHTML = '';
            
            // I detta steg har datan redan filtrerats och sorterats av sortAndRender
            const iLager = data.filter(item => item.quantity > 0);
            const slutILager = data.filter(item => item.quantity <= 0);

            const serviceArtiklar = iLager.filter(item => item.category === 'Service');
            // OBS: I det smarta sökfallet kommer alla artiklar att finnas i 'data' listan.
            // För att visa alla matchande artiklar under de rätta rubrikerna måste vi filtrera BARA iLager.
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

        // KORRIGERING: Ny logik för Viktad Nyckelordssökning
        function calculateRelevance(item, searchWords) {
            let score = 0;
            
            // Konvertera artikelns text till en sträng för matchning
            const serviceFilter = (item.service_filter || '').toLowerCase();
            const name = (item.name || '').toLowerCase();
            const notes = (item.notes || '').toLowerCase();
            const category = (item.category || '').toLowerCase();
            
            searchWords.forEach(word => {
                // Ta bort icke-alfanumeriska tecken för att få bättre matchningar på artikelnummer
                const cleanWord = word.replace(/[^a-z0-9]/g, '');

                // 1. Högst Prioritet: Artikelnummer (service_filter)
                if (serviceFilter.includes(cleanWord)) {
                    score += 5; 
                }
                
                // 2. Hög Prioritet: Namn
                if (name.includes(cleanWord)) {
                    score += 3;
                }
                
                // 3. Mellan Prioritet: Kategori
                if (category.includes(cleanWord)) {
                    score += 2;
                }

                // 4. Låg Prioritet: Anteckningar
                if (notes.includes(cleanWord)) {
                    score += 1;
                }
                
                // Exakt matchning på hela artikeln
                if (serviceFilter === cleanWord || name === cleanWord) {
                     score += 5;
                }
            });

            return score;
        }


        function sortAndRender() {
            const searchTerm = searchInput.value.toLowerCase().trim();
            
            if (searchTerm === '') {
                 // Om sökfältet är tomt, sortera hela lagret enligt standard
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

            // STEG 1: Rensa sökfrågan (Natural Language Processing light)
            const searchWords = searchTerm.split(/\s+/)
                                          .filter(word => word.length > 1 && !stopWords.includes(word));
            
            // Lägg till sökordet som det är, för att få exakta fraser och nummer med i beräkningen
            if (searchWords.length === 0 && searchTerm.length > 0) {
                 searchWords.push(searchTerm);
            }

            // STEG 2: Beräkna relevanspoäng och filtrera
            const scoredInventory = inventory
                .map(item => ({
                    ...item,
                    relevanceScore: calculateRelevance(item, searchWords)
                }))
                .filter(item => item.relevanceScore > 0);
            
            // STEG 3: Sortera - Högst Poäng FÖRST, sedan enligt användarens val (currentSort)
            const sortedAndFilteredInventory = scoredInventory.sort((a, b) => {
                // Sortera PRIMÄRT efter relevans (fallande)
                if (b.relevanceScore !== a.relevanceScore) {
                    return b.relevanceScore - a.relevanceScore;
                }
                
                // Sortera SEKUNDÄRT efter den valda kolumnen (t.ex. 'name' eller 'price')
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
             // Lägg in en liten debounce (fördröjning) för bättre prestanda (se tips #22)
             clearTimeout(window.searchTimeout);
             window.searchTimeout = setTimeout(sortAndRender, 150);
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
            
            await saveInventoryItem(newItem); // Väntar på att sparandet ska bli klart
            
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
            const originalText = submitBtn.textContent; // Spara originaltexten
            submitBtn.disabled = true;
            submitBtn.textContent = 'Sparar...';
            // -------------------------

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

            await saveInventoryItem(updatedItem); // Väntar på att sparandet ska bli klart
            
            submitBtn.disabled = false;
            submitBtn.textContent = originalText; // Återställ till det den var (t.ex. "Spara Ändringar" eller "Markera som Beställd")

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
            
            // Detta tar varje ord, gör första bokstaven stor och behåller resten
            let transformedValue = value.split(' ').map(word => 
                word.charAt(0).toUpperCase() + word.slice(1) // Notera: slice(1) lämnar resten av ordet som det är
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
            // KORRIGERING: Använd den nya debounced-funktionen
            searchInput.addEventListener('input', applySearchFilter); 
            toggleBtn.addEventListener('click', toggleAddForm);

          // Hanterar synligheten av "X"-knappen i sökfältet
            searchInput.addEventListener('input', () => {
    if (searchInput.value.length > 0) {
        clearSearchBtn.style.display = 'block';
    } else {
        clearSearchBtn.style.display = 'none';
    }
});

// Hanterar klick på "X"-knappen
clearSearchBtn.addEventListener('click', () => {
    searchInput.value = ''; // Töm fältet
    clearSearchBtn.style.display = 'none'; // Göm knappen
    applySearchFilter(); // Uppdatera listan (med tom sökning)
    searchInput.focus(); // Sätt fokus tillbaka i sökfältet
});

          document.querySelectorAll('.lager-container').forEach(container => {
                container.addEventListener('scroll', () => {
                    // Lägg till 'scrolled' klassen om vi har scrollat mer än 1px
                    container.classList.toggle('scrolled', container.scrollTop > 1);
                });
            });

            // Modal stängningslogik
            [editModal, confirmationModal].forEach(modal => {
                modal.addEventListener('click', (e) => {
                    if (e.target === modal || e.target.classList.contains('close-btn')) {
                        modal.style.display = 'none';
                    }
                });
            });
            
            // Sortering
            document.querySelectorAll('.header span[data-sort]').forEach(header => {
                header.addEventListener('click', () => {
                    const column = header.getAttribute('data-sort');
                    const direction = (currentSort.column === column && currentSort.direction === 'asc') ? 'desc' : 'asc';
                    currentSort = { column, direction };
                    // Använd den nya smarta sorteringsfunktionen
                    applySearchFilter(); 
                });
            });
            
            // Bekräftelsemodal-knappar
            document.getElementById('confirmYes').addEventListener('click', () => { if (confirmCallback) confirmCallback(true); closeConfirmationModal(); });
            document.getElementById('confirmNo').addEventListener('click', () => { if (confirmCallback) confirmCallback(false); closeConfirmationModal(); });

            // Fällbara sektioner - KORRIGERING: Gör logiken för att hämta wrapper-ID mer robust
            document.querySelectorAll('.collapsible-header').forEach(header => {
                header.addEventListener('click', () => {
                    // Antar att wrapper-ID:t är header-ID:t + '-wrapper'
                    const wrapperId = header.id.replace('-titel', '-wrapper');
                    const wrapper = document.getElementById(wrapperId); 
                    
                    if (!wrapper) return; // Avbryt om wrapper inte hittas
                    
                    const isClosed = header.getAttribute('data-state') === 'closed';
                    const newState = isClosed ? 'open' : 'closed';
                    header.setAttribute('data-state', newState);
                    wrapper.classList.toggle('collapsed', !isClosed);
                    localStorage.setItem(header.id, newState);
                });
            });

            // JSON-hantering
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
                                    // Ta bort allt gammalt först
                                    for (const item of inventory) { await deleteInventoryItem(item.id); }
                                    // Spara det nya
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
        
        // KORRIGERING: Hantera det fällbara läget mer robust
        function initializeCollapseState() {
            document.querySelectorAll('.collapsible-header').forEach(header => {
                const savedState = localStorage.getItem(header.id);
                const wrapperId = header.id.replace('-titel', '-wrapper');
                const wrapper = document.getElementById(wrapperId);

                // Vi använder bara localStorage om det finns en sparad state
                if (savedState === 'closed') {
                    header.setAttribute('data-state', 'closed');
                    if (wrapper) {
                        wrapper.classList.add('collapsed');
                    }
                } 
                // Om savedState INTE finns, eller om det är "open", gör vi ingenting (låter den vara öppen som standard)
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
