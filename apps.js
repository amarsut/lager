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

document.addEventListener('DOMContentLoaded', () => {
    try {
        // Initialisera Firebase
        const app = initializeApp(firebaseConfig);
        const db = getFirestore(app);
        const INVENTORY_COLLECTION = 'lager';
        
        // DOM-ELEMENT
        const serviceArtiklarLista = document.getElementById('service-artiklar-lista');
        const motorChassiArtiklarLista = document.getElementById('motor-chassi-artiklar-lista');
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
        
        // GLOBALA VARIABLER
        let inventory = []; 
        let selectedItemId = null;
        let currentSort = { column: 'name', direction: 'desc' };
        let confirmCallback = null; 

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

        function generateTrodoLink(serviceFilter) {
            if (!serviceFilter) return null;
            
            // Tar bort alla mellanslag och bindestreck för att få en ren artikelnummer-sträng.
            const searchFilter = serviceFilter.replace(/[\s-]/g, ''); 
            const searchQuery = encodeURIComponent(searchFilter);
            
            // Denna länk är baserad på "PREMIUM"-exemplet från din bild.
            // Den lägger till /premium/ i sökvägen, sorterar efter pris (asc)
            // och sätter filter[quality_group]=2.
            return `https://www.trodo.se/catalogsearch/result/premium?filter[quality_group]=2&product_list_dir=asc&product_list_order=price&q=${searchQuery}`;
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
            
            let linkToUse = item.link || generateTrodoLink(item.service_filter);
            let linkText = item.link ? 'Länk' : 'Trodo';

            const linkContent = linkToUse ? `<button class="lank-knapp" onclick="window.open('${linkToUse}', '_blank'); event.stopPropagation();">${linkText}</button>` : `<span>(Saknas)</span>`;

            const quantityCell = `<div class="quantity-cell"><button class="qty-btn" onclick="adjustQuantity(${item.id}, -1); event.stopPropagation();">-</button><span>${item.quantity}</span><button class="qty-btn" onclick="adjustQuantity(${item.id}, 1); event.stopPropagation();">+</button></div>`;
            const editButton = isOutOfStock ? `<button class="edit-btn order-btn" onclick="handleEdit(${item.id}, true); event.stopPropagation();">Beställ</button>` : `<button class="edit-btn" onclick="handleEdit(${item.id}); event.stopPropagation();">Ändra</button>`;
            const notesCell = `<span class="notes-cell" title="${item.notes || ''}">${item.notes || ''}</span>`;
            
            // Förstoringsglas-knappen
            const searchButton = linkToUse ? 
                `<button class="search-btn" onclick="window.open('${linkToUse}', '_blank'); event.stopPropagation();" title="Sök på ${linkText}">
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
                <span class="action-cell">${linkContent}</span>
                <div class="action-buttons">${editButton}<button class="delete-btn" onclick="handleDelete(${item.id}); event.stopPropagation();">Ta bort</button></div>`;
            return row;
        }

        function renderInventory(data) {
            serviceArtiklarLista.innerHTML = '';
            motorChassiArtiklarLista.innerHTML = '';
            slutILagerLista.innerHTML = '';
            
            const iLager = data.filter(item => item.quantity > 0);
            const slutILager = data.filter(item => item.quantity <= 0);

            const serviceArtiklar = iLager.filter(item => item.category === 'Service');
            const motorChassiArtiklar = iLager.filter(item => item.category === 'Motor/Chassi' || item.category === 'Övrigt' || !item.category);
            
            serviceArtiklar.forEach(item => serviceArtiklarLista.appendChild(createInventoryRow(item, false)));
            motorChassiArtiklar.forEach(item => motorChassiArtiklarLista.appendChild(createInventoryRow(item, false)));
            slutILager.forEach(item => slutILagerLista.appendChild(createInventoryRow(item, true)));

            document.getElementById('service-artiklar-titel').style.display = serviceArtiklar.length > 0 ? 'flex' : 'none';
            document.getElementById('service-artiklar-wrapper').style.display = serviceArtiklar.length > 0 ? 'block' : 'none';
            document.getElementById('motor-chassi-artiklar-titel').style.display = motorChassiArtiklar.length > 0 ? 'flex' : 'none';
            document.getElementById('motor-chassi-artiklar-wrapper').style.display = motorChassiArtiklar.length > 0 ? 'block' : 'none';
            slutILagerSektion.style.display = slutILager.length > 0 ? 'block' : 'none';
        }

        function sortAndRender() {
            const sortedInventory = [...inventory].sort((a, b) => {
                let aVal = a[currentSort.column];
                let bVal = b[currentSort.column];

                if (typeof aVal === 'string' && typeof bVal === 'string') {
                    return currentSort.direction === 'asc' ? aVal.localeCompare(bVal, 'sv') : bVal.localeCompare(aVal, 'sv');
                } else {
                    return currentSort.direction === 'asc' ? (aVal || 0) - (bVal || 0) : (bVal || 0) - (aVal || 0);
                }
            });

            const searchTerm = searchInput.value.toLowerCase().trim();
            const filteredInventory = sortedInventory.filter(item => {
                 const text = `${item.service_filter} ${item.name} ${item.notes} ${item.category}`.toLowerCase();
                 const searchWords = searchTerm.split(/\s+/).filter(word => word.length > 0);
                 return searchWords.every(word => text.includes(word));
            });
            
            renderInventory(filteredInventory);
        }

        function applySearchFilter() {
             sortAndRender();
        }

        async function handleFormSubmit(event) {
            event.preventDefault();
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
                    applySearchFilter();
                });
            });
            
            // Bekräftelsemodal-knappar
            document.getElementById('confirmYes').addEventListener('click', () => { if (confirmCallback) confirmCallback(true); closeConfirmationModal(); });
            document.getElementById('confirmNo').addEventListener('click', () => { if (confirmCallback) confirmCallback(false); closeConfirmationModal(); });

            // Fällbara sektioner
            document.querySelectorAll('.collapsible-header').forEach(header => {
                header.addEventListener('click', () => {
                    const wrapper = document.getElementById(header.id.replace('-titel', '-wrapper'));
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
        
        function initializeCollapseState() {
            document.querySelectorAll('.collapsible-header').forEach(header => {
                const savedState = localStorage.getItem(header.id);
                if (savedState === 'closed') {
                    header.setAttribute('data-state', 'closed');
                    document.getElementById(header.id.replace('-titel', '-wrapper')).classList.add('collapsed');
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

