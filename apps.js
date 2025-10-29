// Import Firebase v9 Syntax via CDN
        import { initializeApp } from 'https://www.gstatic.com/firebase/9.6.1/firebase-app.js';
        import { getFirestore, collection, doc, setDoc, deleteDoc, onSnapshot } from 'https://www.gstatic.com/firebase/9.6.1/firebase-firestore.js';

        // ----------------------------------------------------------------------
        // 2.1. FIREBASE KONFIGURATION (ERSÄTT DESSA VÄRDEN)
        // ----------------------------------------------------------------------
        const firebaseConfig = {
          apiKey: "AIzaSyAC4SLwVEzP3CPO4lLfDeZ71iU0xdr49sw",
          authDomain: "lagerdata-a9b39.firebaseapp.com",
          projectId: "lagerdata-a9b39",
          storageBucket: "lagerdata-a9b39.firebasestorage.app",
          messagingSenderId: "615646392577",
          appId: "1:615646392577:web:fd816443728e88b218eb00"
        };

        // Initialisera Firebase och Firestore
        try {
            const app = initializeApp(firebaseConfig);
            const db = getFirestore(app);
            const INVENTORY_COLLECTION = 'lager';
            
            // Lyssna på "online"-händelsen för att uppdatera status tidigt
            window.addEventListener('online', () => syncStatusElement.textContent = 'Återansluter...');
            window.addEventListener('offline', () => syncStatusElement.textContent = 'OFFLINE');

            // ----------------------------------------------------------------------
            // 2.2. GLOBALA VARIABLER OCH DOM-ELEMENT
            // ----------------------------------------------------------------------
            
            let inventory = []; 
            let selectedItemId = null;
            let currentSort = { column: 'service_filter', direction: 'asc' };

            const inventoryList = document.getElementById('inventory-list');
            const searchInput = document.getElementById('search-input');
            const toggleBtn = document.getElementById('toggle-add-form-btn');
            const addFormContainer = document.getElementById('add-article-form-container');
            const addForm = document.getElementById('add-article-form');
            const editModal = document.getElementById('editModal');
            const editForm = document.getElementById('edit-article-form');
            const confirmationModal = document.getElementById('confirmationModal');
            const syncStatusElement = document.getElementById('sync-status');
            
            let confirmCallback = null; 

            // ----------------------------------------------------------------------
            // 2.3. FIREBASE DATABAS LOGIK
            // ----------------------------------------------------------------------
            
            async function saveInventoryItem(itemData) {
                const itemRef = doc(db, INVENTORY_COLLECTION, String(itemData.id));
                // Låter Firestore hantera uppdateringen
                await setDoc(itemRef, itemData);
                console.log("Artikel sparad/uppdaterad i Firebase:", itemData.id);
            }
            
            async function deleteInventoryItem(itemId) {
                const itemRef = doc(db, INVENTORY_COLLECTION, String(itemId));
                await deleteDoc(itemRef);
                console.log("Artikel borttagen från Firebase:", itemId);
            }
            
            function setupRealtimeListener() {
                const q = collection(db, INVENTORY_COLLECTION);
                
                onSnapshot(q, (querySnapshot) => {
                    const tempInventory = [];
                    querySnapshot.forEach((doc) => {
                        tempInventory.push(doc.data());
                    });
                    
                    inventory = tempInventory;
                    
                    sortInventory(currentSort.column, currentSort.direction);
                    applySearchFilter();
                    
                    // Uppdatera synkroniseringsstatus
                    const now = new Date();
                    syncStatusElement.textContent = `Synkroniserad ${now.toLocaleTimeString('sv-SE', {hour: '2-digit', minute:'2-digit', second:'2-digit'})}`;

                }, (error) => {
                    console.error("Realtime listener error: ", error);
                    syncStatusElement.textContent = `FEL: Se konsolen`;
                    showCustomAlert('Kunde inte ansluta till realtidsdatabasen. Kontrollera nätverket och att Firebase-reglerna tillåter läsning.', 'Allvarligt Fel');
                });
            }

            // ----------------------------------------------------------------------
            // 2.4. HJÄLPFUNKTIONER 
            // ----------------------------------------------------------------------

            function formatPrice(price) {
                return parseFloat(price).toFixed(2).replace('.', ',');
            }

            function generateTrodoLink(serviceFilter) {
                if (!serviceFilter) return null;
                const cleanedFilter = serviceFilter.replace(/\s/g, '+').replace(/[^a-zA-Z0-9+]/g, '');
                return `https://www.trodo.se/catalogsearch/result/?q=${cleanedFilter}`;
            }
            
            function toggleAddForm() {
                const isVisible = addFormContainer.style.display !== 'none';
                if (isVisible) {
                    addFormContainer.style.display = 'none';
                    localStorage.setItem('addFormCollapsed', 'true');
                    toggleBtn.textContent = 'Lägg till artikel';
                } else {
                    addFormContainer.style.display = 'block';
                    localStorage.setItem('addFormCollapsed', 'false');
                    toggleBtn.textContent = 'Dölj formulär';
                }
            }
            
            function initializeAddFormState() {
                const isCollapsed = localStorage.getItem('addFormCollapsed') === 'true';
                if (isCollapsed) {
                    addFormContainer.style.display = 'none';
                    toggleBtn.textContent = 'Lägg till artikel';
                } else {
                    addFormContainer.style.display = 'block';
                    toggleBtn.textContent = 'Dölj formulär';
                }
            }
            
            // ----------------------------------------------------------------------
            // 2.5. UI/RENDERING LOGIK
            // ----------------------------------------------------------------------

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
    
    let linkToUse = item.link;
    let linkText = 'Länk';
    
    if (!linkToUse || linkToUse.length === 0) {
        linkToUse = generateTrodoLink(item.service_filter);
        linkText = 'Trodo'; 
    }

    // KORRIGERAT: BARA onclick används
    const linkContent = linkToUse
        ? `<button class="lank-knapp" onclick="openProductPopup('${linkToUse}'); event.stopPropagation();">${linkText}</button>`
        : `<span style="text-align:center; color:#999; font-style: italic;">(Saknas)</span>`;

    const quantityCell = `
        <div class="quantity-cell">
            <button class="qty-btn" onclick="adjustQuantity(${item.id}, -1); event.stopPropagation();">-</button>
            <span>${item.quantity}</span>
            <button class="qty-btn" onclick="adjustQuantity(${item.id}, 1); event.stopPropagation();">+</button>
        </div>
    `;
    
    let editButton;
    if (isOutOfStock) {
        // KORRIGERAT: BARA onclick används
        editButton = `<button class="edit-btn order-btn" onclick="handleEdit(${item.id}, true); event.stopPropagation();">Beställ</button>`;
    } else {
        // KORRIGERAT: BARA onclick används
        editButton = `<button class="edit-btn" onclick="handleEdit(${item.id}); event.stopPropagation();">Ändra</button>`;
    }
    
    // KORRIGERAT: BARA onclick används, och den inkorrekta data-action togs bort
    const searchLinkButton = linkToUse
        ? `<button 
            class="copy-btn" 
            onclick="openProductPopup('${linkToUse}'); event.stopPropagation();" 
            title="Öppna länk (samma som Länk/Trodo-knapp)">
            &#128269;
           </button>` 
        : `<button 
            class="copy-btn" 
            disabled 
            style="cursor: not-allowed; opacity: 0.5;"
            title="Ingen länk tillgänglig">
            &#128269;
           </button>`;
    
    
    const serviceFilterCell = `
        <span class="service-filter-cell">
            ${searchLinkButton} 
            <button class="copy-btn" onclick="copyToClipboard(${item.id}, '${item.service_filter.replace(/'/g, "\\'")
            }'); event.stopPropagation();" title="Kopiera Artikelnummer">
                &#x1F4CB; </button>
            <span class="service-filter-text">${item.service_filter}</span>
        </span>
    `;

    const notesCell = `<span class="notes-cell" title="${item.notes.replace(/"/g, '&quot;')}">${item.notes}</span>`;


    row.innerHTML = `
        ${serviceFilterCell}
        <span>${item.name}</span>
        <span>${formatPrice(item.price)} kr</span>
        ${quantityCell}
        <span style="display: flex; align-items: center;"><span class="${statusClass}">${statusText}</span></span>
        ${notesCell}
        <span class="action-cell">${linkContent}</span>
        <div class="action-buttons">
            ${editButton}
            <button class="delete-btn" onclick="handleDelete(${item.id}); event.stopPropagation();">Ta bort</button>
        </div>
    `;

    return row;
}


            function renderInventory(data) {
                inventoryList.innerHTML = '';
                
                const searchTerm = searchInput.value.toLowerCase().trim();
                
                data.filter(item => {
                    if (!item.service_filter || !item.name) return false;
                    const matchesSearch = item.service_filter.toLowerCase().includes(searchTerm) || 
                                          item.name.toLowerCase().includes(searchTerm);
                    return matchesSearch;
                })
                .forEach(item => {
                    const isOutOfStock = item.quantity <= 0;
                    const row = createInventoryRow(item, isOutOfStock);
                    inventoryList.appendChild(row);
                });
            }

            function sortInventory(column, direction) {
                currentSort = { column, direction };
                
                document.querySelectorAll('.header .sort-icon').forEach(icon => {
                    icon.classList.remove('active');
                    icon.innerHTML = '';
                });

                const header = document.querySelector(`.header span[data-sort="${column}"]`);
                if (header) {
                    const icon = header.querySelector('.sort-icon');
                    icon.classList.add('active');
                    icon.innerHTML = direction === 'asc' ? '&#9650;' : '&#9660;';
                }
                
                const sortedInventory = [...inventory].sort((a, b) => {
                    let aVal = a[column];
                    let bVal = b[column];

                    if (column === 'quantity' || column === 'price') {
                        aVal = parseFloat(aVal) || 0;
                        bVal = parseFloat(bVal) || 0;
                        return direction === 'asc' ? aVal - bVal : bVal - aVal;
                    } 
                    
                    if (typeof aVal === 'string' && typeof bVal === 'string') {
                        aVal = aVal.toLowerCase();
                        bVal = bVal.toLowerCase();
                        return direction === 'asc' ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal);
                    }

                    return 0;
                });

                renderInventory(sortedInventory);
            }

            function applySearchFilter() {
                 sortInventory(currentSort.column, currentSort.direction);
            }

            // ----------------------------------------------------------------------
            // 2.6. HÄNDELSEHANTERARE (ASYNKRONA FÖR FIREBASE)
            // ----------------------------------------------------------------------

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
                
                try {
                    await saveInventoryItem(newItem);
                    addForm.reset();
                    document.getElementById('add-quantity').value = 1; 
                    toggleAddForm(); 
                } catch (e) {
                    // Felmeddelande visas i saveInventoryItem
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

            function handleEdit(id, isOrderMode = false) {
                const item = inventory.find(i => i.id === id);
                if (item) {
                    document.getElementById('edit-id').value = item.id;
                    document.getElementById('edit-service_filter').value = item.service_filter;
                    document.getElementById('edit-service_filter_hidden').value = item.service_filter;
                    document.getElementById('edit-name').value = item.name;
                    document.getElementById('edit-price').value = item.price;
                    document.getElementById('edit-quantity').value = item.quantity;
                    document.getElementById('edit-category').value = item.category;
                    document.getElementById('edit-notes').value = item.notes;
                    document.getElementById('edit-link').value = item.link;

                    const submitBtn = editForm.querySelector('.primary-btn');
                    if (isOrderMode) {
                        editModal.querySelector('h2').textContent = 'Beställ Artikel';
                        submitBtn.textContent = 'Markera som Beställd (Öka Antal)';
                        document.getElementById('edit-quantity').value = 1;
                        document.getElementById('edit-quantity').focus();
                    } else {
                        editModal.querySelector('h2').textContent = 'Redigera Artikel';
                        submitBtn.textContent = 'Spara Ändringar';
                    }

                    editModal.style.display = 'block';
                }
            }

            async function handleEditSubmit(event) {
                event.preventDefault();
                
                const formData = new FormData(editForm);
                
                const originalItem = inventory.find(i => i.id === parseInt(formData.get('id'), 10));
                if (!originalItem) {
                    showCustomAlert('Kunde inte hitta artikeln för redigering.', 'Fel');
                    return;
                }

                const updatedItem = {
                    ...originalItem,
                    id: parseInt(formData.get('id'), 10),
                    service_filter: (formData.get('service_filter_hidden') || '').trim().toUpperCase(),
                    name: (formData.get('name') || '').trim(),
                    price: parseFloat(formData.get('price')) || 0.00,
                    quantity: parseInt(formData.get('quantity'), 10) || 0,
                    category: formData.get('category') || 'Övrigt',
                    notes: (formData.get('notes') || '').trim(),
                    link: (formData.get('link') || '').trim(),
                };

                try {
                    await saveInventoryItem(updatedItem);
                    closeEditModal();
                    selectedItemId = null; 
                } catch (e) {
                    // Felmeddelande visas i saveInventoryItem
                }
            }

            async function adjustQuantity(id, change) {
                const item = inventory.find(i => i.id === id);
                if (item) {
                    const updatedItem = {...item, quantity: item.quantity + change }; // Skapa en kopia
                    if (updatedItem.quantity < 0) updatedItem.quantity = 0; 
                    
                    try {
                        await saveInventoryItem(updatedItem);
                    } catch (e) {
                        // Felmeddelande visas i saveInventoryItem
                    }
                }
            }

            function handleDelete(id) {
                showCustomConfirmation(
                    `Är du säker på att du vill ta bort artikel **${inventory.find(i => i.id === id)?.service_filter}** permanent?`,
                    async (result) => {
                        if (result) {
                            try {
                                await deleteInventoryItem(id);
                                selectedItemId = null; 
                            } catch (e) {
                                // Felmeddelande visas i deleteInventoryItem
                            }
                        }
                    },
                    'Bekräfta Borttagning'
                );
            }
            
            window.copyToClipboard = function(id, text) {
                navigator.clipboard.writeText(text).then(() => {
                    showCustomAlert(`Artikelnummer **${text}** kopierat!`, 'Kopiering Lyckades');
                }).catch(err => {
                    showCustomAlert('Kunde inte kopiera text: ' + err, 'Fel');
                });
            }
            
            window.openProductPopup = function(url) {
                const productIframe = document.getElementById('productIframe');
                productIframe.src = url;
                document.getElementById('productPopup').style.display = 'block';
            }
            
            // ----------------------------------------------------------------------
            // 2.7. MODAL/ALERT LOGIK
            // ----------------------------------------------------------------------
            
            window.closeEditModal = function() {
                editModal.style.display = 'none';
            }
            
            window.closeConfirmationModal = function() {
                confirmationModal.style.display = 'none';
                confirmationModal.classList.remove('alert-mode');
                confirmCallback = null;
            }

            window.showCustomConfirmation = function(message, callback, title = 'Bekräfta Åtgärd', yesText = 'Ja', noText = 'Avbryt') {
                document.getElementById('confirmationTitle').innerHTML = title;
                document.getElementById('confirmationMessage').innerHTML = message;
                document.getElementById('confirmYes').textContent = yesText;
                document.getElementById('confirmNo').textContent = noText;
                
                confirmationModal.classList.remove('alert-mode');
                confirmationModal.style.display = 'block';
                confirmCallback = callback;
            }
            
            window.showCustomAlert = function(message, title = 'Meddelande', buttonText = 'OK') {
                document.getElementById('confirmationTitle').innerHTML = title;
                document.getElementById('confirmationMessage').innerHTML = message;
                document.getElementById('confirmYes').textContent = buttonText;
                
                confirmationModal.classList.add('alert-mode');
                confirmationModal.style.display = 'block';
                confirmCallback = (result) => { if (result) closeConfirmationModal(); };
            }
            
            // ----------------------------------------------------------------------
            // 2.8. JSON BACKUP/ÅTERSTÄLLNING (Anpassad för Firebase)
            // ----------------------------------------------------------------------

            window.downloadJson = function() {
                const backupData = {
                    lastModified: new Date().toISOString(),
                    inventory: inventory
                };
                
                const jsonString = JSON.stringify(backupData, null, 2);
                const blob = new Blob([jsonString], { type: 'application/json' });
                
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `lager_backup_${new Date().toISOString().slice(0, 10)}.json`;
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                URL.revokeObjectURL(url);
                
                showCustomAlert('Lagerbackup nedladdad! Filen innehåller en snapshot av molnets data.', 'Backup Skapad');
            };

            window.uploadJson = function(event) {
                const file = event.target.files[0];
                const fileInput = event.target;
                
                if (!file) {
                    fileInput.value = '';
                    showCustomAlert('Ingen fil vald.', 'Fel');
                    return;
                }

                const reader = new FileReader();
                reader.onload = async function(e) { // Gör onload ASYNC
                    try {
                        const uploadedData = JSON.parse(e.target.result);
                        
                        let uploadedInventory;
                        
                        if (uploadedData.inventory) {
                            uploadedInventory = uploadedData.inventory;
                        } else if (Array.isArray(uploadedData)) {
                            uploadedInventory = uploadedData;
                        } else {
                            throw new Error('Okänt filformat.');
                        }
                        
                        if (!Array.isArray(uploadedInventory)) {
                             throw new Error('Inventariedatan i filen är inte en lista (array).');
                        }

                        showCustomConfirmation(
                            `<strong>VARNING:</strong> Du håller på att ladda upp **${uploadedInventory.length}** artiklar från en fil. Detta kommer att **lägga till/skriva över** artiklar i molnet. Detta bör endast användas för återställning.`,
                            async (result) => { // Gör callback ASYNC
                                if (result) {
                                    await processUploadToFirebase(uploadedInventory, fileInput);
                                } else {
                                    fileInput.value = '';
                                }
                            },
                            'Bekräfta Återställning',
                            'Ja, Fortsätt',
                            'Avbryt'
                        );
                        
                    } catch (error) {
                        showCustomAlert(`Kunde inte läsa JSON-filen. Kontrollera att filen är korrekt formaterad.`, 'Fel vid uppladdning');
                        console.error('JSON Parse Error:', error);
                        fileInput.value = '';
                    }
                };
                
                reader.onerror = function() {
                    showCustomAlert('Ett okänt fel uppstod vid läsning av filen.', 'Fel');
                };

                reader.readAsText(file);
            };
            
            async function processUploadToFirebase(uploadedInventory, fileInputElement) {
                let successCount = 0;
                let errorCount = 0;
                
                for (const item of uploadedInventory) {
                    const sanitizedItem = {
                        id: item.id && !isNaN(parseInt(item.id)) ? parseInt(item.id, 10) : Date.now() + Math.floor(Math.random() * 1000000),
                        service_filter: (item.service_filter || '').trim().toUpperCase(),
                        name: (item.name || '').trim(),
                        price: parseFloat(item.price) || 0.00,
                        quantity: parseInt(item.quantity, 10) || 0,
                        category: item.category || 'Övrigt',
                        notes: (item.notes || '').trim(),
                        link: (item.link || '').trim(),
                    };
                    
                    try {
                        await saveInventoryItem(sanitizedItem);
                        successCount++;
                    } catch (e) {
                        errorCount++;
                    }
                }
                
                showCustomAlert(`Återställning slutförd! ${successCount} artiklar lades till/uppdaterades i molnet. ${errorCount > 0 ? `(${errorCount} fel uppstod.)` : ''}`, 'Återställning Klar');
                
                if (fileInputElement) {
                    fileInputElement.value = '';
                }
            }

            // ----------------------------------------------------------------------
            // 2.9. INITIERING
            // ----------------------------------------------------------------------

            addForm.addEventListener('submit', handleFormSubmit);
            editForm.addEventListener('submit', handleEditSubmit);
            searchInput.addEventListener('input', applySearchFilter);

            document.getElementById('productPopup').addEventListener('click', (e) => {
                if (e.target.id === 'productPopup') {
                    e.target.style.display = 'none';
                }
            });
            
            document.querySelectorAll('.header span[data-sort]').forEach(header => {
                header.addEventListener('click', (e) => {
                    let target = e.target;
                    while (target && !target.hasAttribute('data-sort')) {
                        target = target.parentNode;
                        if (target.className === 'header' || target.className === 'lager-container') break; 
                    }
                    if (!target || !target.hasAttribute('data-sort')) return;

                    const column = target.getAttribute('data-sort');
                    let direction = 'asc';

                    if (currentSort.column === column) {
                        direction = currentSort.direction === 'asc' ? 'desc' : 'asc';
                    } else if (column === 'quantity' || column === 'price') {
                        direction = 'desc'; 
                    }

                    currentSort = { column, direction };
                    sortInventory(column, direction);
                });
            });
            
            toggleBtn.addEventListener('click', toggleAddForm);
            
            document.getElementById('confirmYes').addEventListener('click', () => {
                if (confirmCallback) confirmCallback(true);
                closeConfirmationModal();
            });
            
            document.getElementById('confirmNo').addEventListener('click', () => {
                if (confirmCallback) confirmCallback(false);
                closeConfirmationModal();
            });
            
            document.addEventListener('DOMContentLoaded', () => {
                initializeAddFormState(); 
                setupRealtimeListener();
            });


            // ----------------------------------------------------------------------
            // 3. GLOBALA EXPONERINGAR (FÖR ONCLICK)
            // ----------------------------------------------------------------------
            // Dessa måste ligga sist i modulen
            window.handleEdit = handleEdit;
            window.handleDelete = handleDelete;
            window.adjustQuantity = adjustQuantity;
            window.copyToClipboard = copyToClipboard;
            window.openProductPopup = openProductPopup; 
            window.closeEditModal = closeEditModal;
            window.closeConfirmationModal = closeConfirmationModal;
            window.showCustomConfirmation = showCustomConfirmation;
            window.showCustomAlert = showCustomAlert;
            window.downloadJson = downloadJson;
            window.uploadJson = uploadJson;


        } catch (e) {
            // Fångar fel vid själva initialiseringen (t.ex. felaktig config)
            console.error("Firebase Initialization Error:", e);
            const statusElement = document.getElementById('sync-status');
            if(statusElement) statusElement.textContent = "FEL: Konfigurationsfel i Firebase!";
            window.showCustomAlert('Det gick inte att ansluta till Firebase. Kontrollera att din "firebaseConfig" är korrekt och att du har nätverksåtkomst.', 'Kritiskt Fel');
        }
