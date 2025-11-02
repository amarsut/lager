import { initializeApp } from 'https://www.gstatic.com/firebasejs/9.6.1/firebase-app.js';
import { getFirestore, collection, doc, setDoc, deleteDoc, onSnapshot } from 'https://www.gstatic.com/firebasejs/9.6.1/firebase-firestore.js';

// FIREBASE KONFIGURATION (OBS: BÖR FLYTTAS TILL SÄKER BACKEND I PRODUKTION!)
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

// Globala variabler
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const itemsCollection = collection(db, 'inventoryItems');
let allInventoryData = [];
let currentCategoryFilter = 'Alla';
let currentSearchTerm = '';
let currentSort = { column: 'partNumber', direction: 'asc' };

// DOM-element
const initialLoader = document.getElementById('initial-loader');
const fabAddBtn = document.getElementById('fab-add-btn');
const addArticleModal = document.getElementById('addArticleModal'); // NY MODAL
const closeAddModalBtn = document.getElementById('close-add-modal'); // NY MODAL
const addItemForm = document.getElementById('add-item-form');
const editArticleModal = document.getElementById('editArticleModal');
const editItemForm = document.getElementById('edit-item-form');
const confirmationModal = document.getElementById('confirmationModal');
const inventoryListBody = document.getElementById('inventory-list');
const wishlistListBody = document.getElementById('wishlist-list');
const searchInput = document.getElementById('search-input');
const categoryFilter = document.getElementById('category-filter');
const clearFiltersBtn = document.getElementById('clear-filters-btn');
const syncStatusElement = document.getElementById('sync-status');
const themeToggle = document.getElementById('theme-toggle');
const htmlElement = document.documentElement;

// Statistik-element (NYA)
const totalValueStat = document.getElementById('total-value-stat');
const totalItemsStat = document.getElementById('total-items-stat');
const outOfStockStat = document.getElementById('out-of-stock-stat');
const lowStockStat = document.getElementById('low-stock-stat');


// --- HJÄLPFUNKTIONER ---

function updateSyncStatus(status, message) {
    syncStatusElement.textContent = message;
    syncStatusElement.className = `sync-${status}`;
}

function showToast(message, type = 'success') {
    // Enkel toast-implementering: Lägg till senare om du vill ha en
    console.log(`[Toast ${type.toUpperCase()}]: ${message}`);
}

function formatPrice(price) {
    return (price).toFixed(2).replace('.', ',') + ' kr';
}

function formatCount(count) {
    return count + ' st';
}

// --- PWA & Tema ---

function checkTheme() {
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'dark') {
        htmlElement.classList.add('dark-mode');
    }
}

function toggleTheme() {
    htmlElement.classList.toggle('dark-mode');
    const newTheme = htmlElement.classList.contains('dark-mode') ? 'dark' : 'light';
    localStorage.setItem('theme', newTheme);
}

// --- MODAL HANTERING (NY) ---

function openModal(modalElement) {
    modalElement.style.display = 'block';
    setTimeout(() => {
        modalElement.classList.add('active');
        // Fokusera på första inmatningsfältet
        const firstInput = modalElement.querySelector('input, textarea, select');
        if (firstInput) firstInput.focus();
    }, 10);
}

function closeModal(modalElement) {
    modalElement.classList.remove('active');
    setTimeout(() => {
        modalElement.style.display = 'none';
    }, 300); // Måste matcha CSS-övergången
}

// --- CRUD OPERATIONER ---

async function addItem(item) {
    try {
        updateSyncStatus('busy', 'Sparar...');
        const newDocRef = doc(itemsCollection); // Låter Firebase generera ID
        item.id = newDocRef.id;
        item.timestamp = Date.now();
        await setDoc(newDocRef, item);
        showToast('Artikel tillagd!', 'success');
        updateSyncStatus('ok', 'Synkad');
    } catch (e) {
        console.error("Error adding document: ", e);
        showToast('Kunde inte lägga till artikel.', 'error');
        updateSyncStatus('error', 'Synkfel!');
    }
}

async function updateItem(id, updates) {
    try {
        updateSyncStatus('busy', 'Uppdaterar...');
        updates.timestamp = Date.now();
        await setDoc(doc(db, 'inventoryItems', id), updates, { merge: true });
        showToast('Artikel uppdaterad!', 'success');
        updateSyncStatus('ok', 'Synkad');
    } catch (e) {
        console.error("Error updating document: ", e);
        showToast('Kunde inte uppdatera artikel.', 'error');
        updateSyncStatus('error', 'Synkfel!');
    }
}

async function deleteItem(id) {
    try {
        updateSyncStatus('busy', 'Raderar...');
        await deleteDoc(doc(db, 'inventoryItems', id));
        showToast('Artikel raderad!', 'success');
        updateSyncStatus('ok', 'Synkad');
    } catch (e) {
        console.error("Error deleting document: ", e);
        showToast('Kunde inte radera artikel.', 'error');
        updateSyncStatus('error', 'Synkfel!');
    }
}

// --- VISUELL UPPDATERING OCH STATISTIK ---

/**
 * NY FUNKTION: Beräknar och uppdaterar statistikpanelen.
 */
function updateStatistics(data) {
    let totalValue = 0;
    let inStockCount = 0;
    let lowStockCount = 0;
    let outOfStockCount = 0;

    // Filtrera endast artiklar som ÄR i lager (dvs. inte önskelista)
    const inventoryItems = data.filter(item => item.category !== 'Önskelista');

    inventoryItems.forEach(item => {
        const count = item.count || 0;
        const price = item.price || 0;
        const minStock = item.minStock || 0;

        // 1. Totalt Värde
        totalValue += count * price;

        // 2. Artiklar i Lager
        if (count > 0) {
            inStockCount++;
        }

        // 3. Artiklar Slut
        if (count <= 0) {
            outOfStockCount++;
        }
        
        // 4. Artiklar med Låg Nivå (räknar även slut i lager här, om de har minStock > 0)
        if (count > 0 && count <= minStock) {
            lowStockCount++;
        }
    });

    // Uppdatera DOM-element
    totalValueStat.textContent = formatPrice(totalValue);
    totalItemsStat.textContent = formatCount(inventoryItems.length); // Totala antalet unika artiklar i lager-listorna (oavsett antal > 0)
    outOfStockStat.textContent = formatCount(outOfStockCount);
    lowStockStat.textContent = formatCount(lowStockCount);
}

/**
 * Rendera en enskild tabellrad.
 */
function renderItem(item, isWishlist) {
    const row = document.createElement('tr');
    row.dataset.id = item.id;
    row.dataset.category = item.category;
    row.dataset.partNumber = item.partNumber;

    if (isWishlist) {
        row.innerHTML = `
            <td>${item.partNumber}</td>
            <td>${item.description}</td>
            <td>${item.category}</td>
            <td class="notes-cell" title="${item.notes || 'Inga anteckningar'}">${item.notes || '-'}</td>
            <td><a href="${item.link}" target="_blank">${item.link ? 'Länk' : '-'}</a></td>
            <td>
                ${generatePriceComparisonButtons(item.partNumber, item.description)}
            </td>
            <td class="actions-cell">
                <button class="edit-btn" title="Redigera">✍️</button>
                <button class="delete-btn" title="Radera">🗑️</button>
            </td>
        `;
    } else {
        const count = item.count || 0;
        const minStock = item.minStock || 0;
        const totalPrice = (count * (item.price || 0));
        let statusClass = 'status-in-stock';
        let statusText = 'I lager';
        
        if (count <= 0) {
            statusClass = 'status-out-of-stock';
            statusText = 'Slut i lager';
        } else if (count <= minStock) {
            statusClass = 'status-low-stock';
            statusText = 'Lågt antal';
        }
        
        row.innerHTML = `
            <td>${item.partNumber}</td>
            <td>${item.description}</td>
            <td>${item.category}</td>
            <td class="count-cell ${statusClass}" title="${statusText}">${count}</td>
            <td>${minStock}</td>
            <td class="price-cell">${formatPrice(item.price || 0)}</td>
            <td class="price-cell">${formatPrice(totalPrice)}</td>
            <td class="notes-cell" title="${item.notes || 'Inga anteckningar'}">${item.notes || '-'}</td>
            <td><a href="${item.link}" target="_blank">${item.link ? 'Länk' : '-'}</a></td>
            <td>
                ${generatePriceComparisonButtons(item.partNumber, item.description)}
            </td>
            <td class="actions-cell">
                <button class="edit-btn" title="Redigera">✍️</button>
                <button class="delete-btn" title="Radera">🗑️</button>
            </td>
        `;
    }
    return row;
}

/**
 * Renderar listorna efter filter och sortering.
 */
function renderLists(data) {
    // 1. Filtrera data
    let filteredData = data.filter(item => {
        const matchesCategory = currentCategoryFilter === 'Alla' || 
                               (currentCategoryFilter === 'Motor/Chassi' && item.category !== 'Service' && item.category !== 'Verktyg' && item.category !== 'Önskelista') ||
                               item.category === currentCategoryFilter ||
                               (currentCategoryFilter === 'Övrigt' && !item.category) ||
                               (currentCategoryFilter === 'Motor/Chassi' && (item.category === 'Övrigt' || !item.category));
        
        const matchesSearch = !currentSearchTerm || 
                              item.partNumber?.toLowerCase().includes(currentSearchTerm) ||
                              item.description?.toLowerCase().includes(currentSearchTerm) ||
                              item.notes?.toLowerCase().includes(currentSearchTerm);

        return matchesCategory && matchesSearch;
    });

    // 2. Sortera data
    const { column, direction } = currentSort;
    filteredData.sort((a, b) => {
        let aVal = a[column];
        let bVal = b[column];
        
        if (typeof aVal === 'string') aVal = aVal.toLowerCase();
        if (typeof bVal === 'string') bVal = bVal.toLowerCase();

        if (aVal < bVal) return direction === 'asc' ? -1 : 1;
        if (aVal > bVal) return direction === 'asc' ? 1 : -1;
        return 0;
    });

    // 3. Separera lager och önskelista
    const inventoryItems = filteredData.filter(item => item.category !== 'Önskelista');
    const wishlistItems = filteredData.filter(item => item.category === 'Önskelista');
    
    // 4. Rendera listorna
    const inventoryFragment = document.createDocumentFragment();
    inventoryItems.forEach(item => inventoryFragment.appendChild(renderItem(item, false)));
    inventoryListBody.innerHTML = '';
    inventoryListBody.appendChild(inventoryFragment);

    const wishlistFragment = document.createDocumentFragment();
    wishlistItems.forEach(item => wishlistFragment.appendChild(renderItem(item, true)));
    wishlistListBody.innerHTML = '';
    wishlistListBody.appendChild(wishlistFragment);

    // 5. Uppdatera antal
    document.getElementById('inventory-count').textContent = `(${inventoryItems.length})`;
    document.getElementById('wishlist-count').textContent = `(${wishlistItems.length})`;

    // 6. Visa/dölj meddelanden om tom lista
    document.getElementById('inventory-empty-message').style.display = inventoryItems.length === 0 ? 'block' : 'none';
    document.getElementById('wishlist-empty-message').style.display = wishlistItems.length === 0 ? 'block' : 'none';
}

// --- FILTER OCH SÖK LOGIK ---

function applyCategoryFilter(category) {
    currentCategoryFilter = category;
    localStorage.setItem('categoryFilter', category);
    renderLists(allInventoryData);
}

function applySearchFilter() {
    currentSearchTerm = searchInput.value.toLowerCase().trim();
    renderLists(allInventoryData);
}

function loadPersistentState() {
    const savedCategory = localStorage.getItem('categoryFilter') || 'Alla';
    currentCategoryFilter = savedCategory;

    // Aktivera rätt knapp
    document.querySelectorAll('#category-filter .btn-secondary').forEach(btn => {
        btn.classList.remove('active');
        if (btn.dataset.category === savedCategory) {
            btn.classList.add('active');
        }
    });
}

function clearFilters() {
    searchInput.value = '';
    currentSearchTerm = '';
    
    // Återställ kategori till "Alla"
    document.querySelector('#category-filter button.active').classList.remove('active');
    document.querySelector('#category-filter button[data-category="Alla"]').classList.add('active');
    currentCategoryFilter = 'Alla';
    localStorage.setItem('categoryFilter', 'Alla');
    
    // Återställ sortering
    document.querySelectorAll('th.sorted-asc, th.sorted-desc').forEach(th => th.classList.remove('sorted-asc', 'sorted-desc'));
    currentSort = { column: 'partNumber', direction: 'asc' };
    
    renderLists(allInventoryData);
    showToast('Filter och sortering rensade.', 'info');
}

// --- DATABAS LYSSNARE ---

function setupRealtimeListener() {
    const unsubscribe = onSnapshot(itemsCollection, (snapshot) => {
        try {
            updateSyncStatus('busy', 'Hämtar data...');
            
            // Konvertera snapshot till en vanlig array
            allInventoryData = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
            
            // NY: Uppdatera statistik
            updateStatistics(allInventoryData);

            // Uppdatera listorna baserat på filter/sökning
            renderLists(allInventoryData);
            
            updateSyncStatus('ok', 'Synkad');

            // Dölj laddningsskärmen
            if (initialLoader && initialLoader.style.opacity !== '0') {
                initialLoader.style.opacity = '0';
                setTimeout(() => initialLoader.style.display = 'none', 500);
            }

        } catch (e) {
            console.error("Fel vid hantering av realtidsdata: ", e);
            updateSyncStatus('error', 'Synkfel!');
        }
    }, (error) => {
        console.error("Realtidslyssnare misslyckades: ", error);
        updateSyncStatus('error', 'Kunde inte ansluta till databasen!');
        if(initialLoader) initialLoader.querySelector('p').textContent = 'Kritiskt fel: Kunde inte ladda data.';
    });
    
    // Obs: Du kan returnera unsubscribe för att stoppa lyssnaren om appen stängs
    return unsubscribe;
}

// --- PRISJÄMFÖRELSE FUNKTIONER ---

function generateAeroMLink(partNumber) {
    if (!partNumber) return null;
    return `https://aerom.se/search?q=${encodeURIComponent(partNumber)}`;
}

function generateTrodoLink(partNumber) {
    if (!partNumber) return null;
    return `https://www.trodo.se/catalog/search?query=${encodeURIComponent(partNumber)}`;
}

function generateSkruvatLink(partNumber, description) {
    if (!partNumber && !description) return null;
    const query = partNumber || description.split(' ')[0] || '';
    if (!query) return null;
    return `https://www.skruvat.se/search/all?query=${encodeURIComponent(query)}`;
}

function generateGoogleLink(partNumber, description) {
    const query = partNumber ? `${partNumber} ${description}` : description;
    if (!query) return null;
    return `https://www.google.com/search?q=${encodeURIComponent(query)}&tbm=shop`; // tbm=shop ger shoppingresultat
}

function generatePriceComparisonButtons(partNumber, description) {
    const aeroMLink = generateAeroMLink(partNumber);
    const trodoLink = generateTrodoLink(partNumber);
    const skruvatLink = generateSkruvatLink(partNumber, description);
    const googleLink = generateGoogleLink(partNumber, description);
    
    let buttons = '';
    
    if (aeroMLink) buttons += `<button class="price-btn" data-link="${aeroMLink}" title="Jämför på AeroM">AeroM</button>`;
    if (trodoLink) buttons += `<button class="price-btn" data-link="${trodoLink}" title="Jämför på Trodo">Trodo</button>`;
    if (skruvatLink) buttons += `<button class="price-btn" data-link="${skruvatLink}" title="Jämför på Skruvat">Skruvat</button>`;
    if (googleLink) buttons += `<button class="price-btn" data-link="${googleLink}" title="Jämför på Google">Google</button>`;

    if (!buttons) return 'Inga länkar';
    
    return buttons;
}

// --- HÄNDELSELYSSNARE ---

function initializeListeners() {
    
    // FAB Lägg till knapp (Öppnar NY Modal)
    fabAddBtn.addEventListener('click', () => {
        addItemForm.reset();
        // Sätter count till 1 och minStock till 1 som standard
        document.getElementById('new-count').value = '1'; 
        document.getElementById('new-minStock').value = '1';
        document.getElementById('new-price').value = '0.00';
        document.getElementById('new-category').value = ''; 
        openModal(addArticleModal);
    });

    // Stäng lägg till modal
    closeAddModalBtn.addEventListener('click', () => closeModal(addArticleModal));
    // Stäng modal vid klick utanför
    window.addEventListener('click', (event) => {
        if (event.target === addArticleModal) {
            closeModal(addArticleModal);
        } else if (event.target === editArticleModal) {
            closeModal(editArticleModal);
        } else if (event.target === confirmationModal) {
            closeModal(confirmationModal);
        }
    });

    // Lägg till formulär
    addItemForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const partNumber = document.getElementById('new-partNumber').value.trim();
        const description = document.getElementById('new-description').value.trim();
        const category = document.getElementById('new-category').value.trim();
        const count = parseInt(document.getElementById('new-count').value, 10);
        const minStock = parseInt(document.getElementById('new-minStock').value, 10);
        const price = parseFloat(document.getElementById('new-price').value.replace(',', '.'));
        const notes = document.getElementById('new-notes').value.trim();
        const link = document.getElementById('new-link').value.trim();

        if (partNumber && description && category && !isNaN(count) && !isNaN(price)) {
            await addItem({ partNumber, description, category, count, minStock, price, notes, link });
            closeModal(addArticleModal); // Stänger modalen efter lyckad tilläggning
        } else {
            showToast('Fyll i alla obligatoriska fält.', 'error');
        }
    });

    // Övriga lyssnare (redigera, radera, filter, sortering etc.)

    // Redigera/Radera/Prisknappar lyssnare (Event Delegation)
    document.body.addEventListener('click', (e) => {
        const targetRow = e.target.closest('tr');
        if (!targetRow) return;
        const id = targetRow.dataset.id;
        const item = allInventoryData.find(i => i.id === id);

        if (e.target.classList.contains('edit-btn')) {
            if (item) {
                // Fyll i redigeringsformuläret
                document.getElementById('edit-id').value = item.id;
                document.getElementById('edit-partNumber').value = item.partNumber || '';
                document.getElementById('edit-description').value = item.description || '';
                document.getElementById('edit-category').value = item.category || 'Övrigt';
                document.getElementById('edit-count').value = item.count || 0;
                document.getElementById('edit-minStock').value = item.minStock || 0;
                document.getElementById('edit-price').value = item.price || 0;
                document.getElementById('edit-notes').value = item.notes || '';
                document.getElementById('edit-link').value = item.link || '';
                
                // Visa/Dölj Antal/Min. Antal om Önskelista
                const countGroup = document.querySelector('#edit-count').closest('.form-group');
                const minStockGroup = document.querySelector('#edit-minStock').closest('.form-group');
                const priceGroup = document.querySelector('#edit-price').closest('.form-group');
                
                if (item.category === 'Önskelista') {
                    countGroup.style.display = 'none';
                    minStockGroup.style.display = 'none';
                    priceGroup.style.display = 'none';
                } else {
                    countGroup.style.display = '';
                    minStockGroup.style.display = '';
                    priceGroup.style.display = '';
                }

                // Lyssna på kategoriändring i edit-modalen
                document.getElementById('edit-category').onchange = function() {
                    if (this.value === 'Önskelista') {
                        countGroup.style.display = 'none';
                        minStockGroup.style.display = 'none';
                        priceGroup.style.display = 'none';
                        document.getElementById('edit-count').value = 0;
                        document.getElementById('edit-minStock').value = 0;
                        document.getElementById('edit-price').value = 0;
                    } else {
                        countGroup.style.display = '';
                        minStockGroup.style.display = '';
                        priceGroup.style.display = '';
                        // Återställ till sparade värden om de finns, annars standard
                        document.getElementById('edit-count').value = item.count || 1;
                        document.getElementById('edit-minStock').value = item.minStock || 1;
                        document.getElementById('edit-price').value = item.price || 0;
                    }
                };

                openModal(editArticleModal);
            }
        } else if (e.target.classList.contains('delete-btn')) {
            if (item) {
                confirmAction('Radera Artikel', `Är du säker på att du vill radera artikeln **${item.partNumber} - ${item.description}** permanent?`, () => deleteItem(id));
            }
        } else if (e.target.classList.contains('price-btn')) {
            const link = e.target.dataset.link;
            if (link) {
                openProductPopup(link);
            }
        }
    });

    // Spara ändringar i redigeringsformuläret
    editItemForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const id = document.getElementById('edit-id').value;
        const updates = {
            partNumber: document.getElementById('edit-partNumber').value.trim(),
            description: document.getElementById('edit-description').value.trim(),
            category: document.getElementById('edit-category').value.trim(),
            notes: document.getElementById('edit-notes').value.trim(),
            link: document.getElementById('edit-link').value.trim()
        };
        
        // Hantera numeriska fält endast om kategorin inte är Önskelista
        if (updates.category !== 'Önskelista') {
            updates.count = parseInt(document.getElementById('edit-count').value, 10) || 0;
            updates.minStock = parseInt(document.getElementById('edit-minStock').value, 10) || 0;
            updates.price = parseFloat(document.getElementById('edit-price').value.replace(',', '.')) || 0;
        } else {
            // Sätt nollvärden för önskelista för att undvika felaktiga beräkningar
            updates.count = 0;
            updates.minStock = 0;
            updates.price = 0;
        }

        if (updates.partNumber && updates.description && updates.category) {
            await updateItem(id, updates);
            closeModal(editArticleModal);
        } else {
            showToast('Artikelnummer, Beskrivning och Kategori är obligatoriska.', 'error');
        }
    });
    
    // Sökfält
    searchInput.addEventListener('input', applySearchFilter);
    
    // Kategori-filter
    categoryFilter.addEventListener('click', (e) => {
        if (e.target.tagName === 'BUTTON') {
            document.querySelectorAll('#category-filter .btn-secondary').forEach(btn => btn.classList.remove('active'));
            e.target.classList.add('active');
            applyCategoryFilter(e.target.dataset.category);
        }
    });
    
    // Rensa filter
    clearFiltersBtn.addEventListener('click', clearFilters);
    
    // Sorteringslyssnare
    document.querySelectorAll('#inventory-table th, #wishlist-table th').forEach(header => {
        header.addEventListener('click', () => {
            const sortBy = header.dataset.sortBy;
            if (!sortBy) return;

            let direction = 'asc';
            if (currentSort.column === sortBy) {
                direction = currentSort.direction === 'asc' ? 'desc' : 'asc';
            }
            
            // Uppdatera visuell sorteringsindikator
            document.querySelectorAll('th').forEach(th => th.classList.remove('sorted-asc', 'sorted-desc'));
            header.classList.add(direction === 'asc' ? 'sorted-asc' : 'sorted-desc');
            
            currentSort = { column: sortBy, direction: direction };
            renderLists(allInventoryData);
        });
    });
    
    // Tema-växlare
    themeToggle.addEventListener('click', toggleTheme);
    
    // Import/Export (Implementering för enkel JSON-hantering)
    document.getElementById('export-btn').addEventListener('click', exportData);
    document.getElementById('import-btn').addEventListener('click', () => document.getElementById('import-file-input').click());
    document.getElementById('import-file-input').addEventListener('change', importData);
    
    // Collapse-lyssnare
    document.querySelectorAll('.collapsible-header').forEach(header => {
        header.addEventListener('click', () => {
            const wrapperId = header.id.replace('-titel', '-wrapper');
            const wrapper = document.getElementById(wrapperId);
            const currentState = header.getAttribute('data-state');
            
            if (currentState === 'open') {
                header.setAttribute('data-state', 'closed');
                wrapper.classList.add('collapsed');
                localStorage.setItem(header.id, 'closed');
            } else {
                header.setAttribute('data-state', 'open');
                wrapper.classList.remove('collapsed');
                localStorage.setItem(header.id, 'open');
            }
        });
    });
    
    // Globalsökning (utvidgad)
    const globalSearchInput = document.getElementById('global-search-input');
    const globalSearchResults = document.getElementById('global-search-results');
    globalSearchInput.addEventListener('input', handleGlobalSearch);
    globalSearchInput.addEventListener('focus', handleGlobalSearch);
    globalSearchInput.addEventListener('blur', (e) => {
        // Fördröj stängning för att tillåta klick på resultat
        setTimeout(() => globalSearchResults.style.display = 'none', 200);
    });
    
    // Tillbaka till toppen-knapp
    window.addEventListener('scroll', () => {
        const backToTopBtn = document.getElementById('back-to-top-btn');
        if (window.scrollY > 300) {
            backToTopBtn.style.display = 'flex';
        } else {
            backToTopBtn.style.display = 'none';
        }
    });
    document.getElementById('back-to-top-btn').addEventListener('click', () => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    });
}

function handleGlobalSearch() {
    const globalSearchInput = document.getElementById('global-search-input');
    const globalSearchResults = document.getElementById('global-search-results');
    const term = globalSearchInput.value.toLowerCase().trim();

    if (term.length < 2) {
        globalSearchResults.innerHTML = '';
        globalSearchResults.style.display = 'none';
        return;
    }

    const results = allInventoryData
        .filter(item => 
            item.partNumber?.toLowerCase().includes(term) ||
            item.description?.toLowerCase().includes(term)
        )
        .slice(0, 10); // Begränsa till 10 resultat

    globalSearchResults.innerHTML = '';

    if (results.length === 0) {
        globalSearchResults.innerHTML = '<div style="padding: 10px; color: var(--text-light);">Inga matchande artiklar.</div>';
    } else {
        const resultFragment = document.createDocumentFragment();
        results.forEach(item => {
            const div = document.createElement('div');
            div.className = 'search-result-item';
            div.dataset.id = item.id;
            div.innerHTML = `<span class="result-part-number">${item.partNumber}</span> <span class="result-description">${item.description}</span>`;
            
            div.addEventListener('mousedown', (e) => { // Använd mousedown för att fånga klick innan blur stänger
                e.preventDefault(); 
                scrollToItem(item.id, item.category);
                globalSearchInput.value = ''; // Rensa sökfältet efter val
                globalSearchResults.style.display = 'none';
            });
            resultFragment.appendChild(div);
        });
        globalSearchResults.appendChild(resultFragment);
    }
    
    globalSearchResults.style.display = 'block';
}

function scrollToItem(id, category) {
    const targetRow = document.querySelector(`tr[data-id="${id}"]`);
    if (targetRow) {
        // 1. Säkerställ att rätt lista är expanderad
        const isWishlist = category === 'Önskelista';
        const header = document.getElementById(isWishlist ? 'wishlist-titel' : 'inventory-titel');
        const wrapper = document.getElementById(isWishlist ? 'wishlist-wrapper' : 'inventory-wrapper');
        
        if (header.getAttribute('data-state') === 'closed') {
             header.setAttribute('data-state', 'open');
             wrapper.classList.remove('collapsed');
             localStorage.setItem(header.id, 'open');
        }
        
        // Scrolla till artikeln
        targetRow.scrollIntoView({ behavior: 'smooth', block: 'center' });
        
        // Visuell markering (blinkning)
        targetRow.classList.add('selected');
        setTimeout(() => targetRow.classList.remove('selected'), 1000); // Tar bort markeringen efter 1 sekund
    }
}

// --- BEKRÄFTELSE MODAL ---

function confirmAction(title, message, callback) {
    const titleElement = document.getElementById('confirmationTitle');
    const messageElement = document.getElementById('confirmationMessage');
    const confirmYesBtn = document.getElementById('confirmYes');
    const confirmNoBtn = document.getElementById('confirmNo');
    
    titleElement.textContent = title;
    messageElement.innerHTML = message;
    
    const clickHandler = async () => {
        confirmYesBtn.removeEventListener('click', clickHandler);
        confirmNoBtn.removeEventListener('click', closeHandler);
        await callback();
        closeModal(confirmationModal);
    };
    
    const closeHandler = () => {
        confirmYesBtn.removeEventListener('click', clickHandler);
        confirmNoBtn.removeEventListener('click', closeHandler);
        closeModal(confirmationModal);
    };

    confirmYesBtn.addEventListener('click', clickHandler);
    confirmNoBtn.addEventListener('click', closeHandler);
    
    openModal(confirmationModal);
}

// --- POPUP FÖR PRISJÄMFÖRELSE ---

function openProductPopup(url) {
    const productPopup = document.getElementById('productPopup');
    const productIframe = document.getElementById('productIframe');
    productIframe.src = url;
    
    productPopup.style.display = 'flex';
    setTimeout(() => productPopup.classList.add('active'), 10);
}

document.querySelector('#productPopup .close-btn').addEventListener('click', () => {
    const productPopup = document.getElementById('productPopup');
    productPopup.classList.remove('active');
    setTimeout(() => {
        productPopup.style.display = 'none';
        document.getElementById('productIframe').src = ''; // Rensa iframe
    }, 300);
});

// --- IMPORT/EXPORT LOGIK ---

function exportData() {
    const dataStr = JSON.stringify(allInventoryData, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `lagerdata_export_${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    showToast('Lagerdata exporterad framgångsrikt.', 'success');
}

function importData(event) {
    const file = event.target.files[0];
    if (!file) return;

    confirmAction('Importera Data', 'Är du säker på att du vill **skriva över** all befintlig data med innehållet från filen? Detta kan inte ångras.', async () => {
        const reader = new FileReader();
        reader.onload = async (e) => {
            try {
                const importedData = JSON.parse(e.target.result);
                if (!Array.isArray(importedData)) {
                    showToast('Ogiltigt filformat. Förväntade en array.', 'error');
                    return;
                }

                // Radera befintlig data (förenklad metod, bör optimeras för stora datamängder)
                updateSyncStatus('busy', 'Raderar gammal data...');
                const deletePromises = allInventoryData.map(item => deleteDoc(doc(db, 'inventoryItems', item.id)));
                await Promise.all(deletePromises);
                
                // Lägg till ny data
                updateSyncStatus('busy', 'Importerar ny data...');
                const addPromises = importedData.map(item => {
                    const newDocRef = doc(itemsCollection);
                    item.id = newDocRef.id; // Säkerställ unikt ID
                    item.timestamp = Date.now();
                    return setDoc(newDocRef, item);
                });
                await Promise.all(addPromises);
                
                showToast(`Importerade ${importedData.length} artiklar framgångsrikt.`, 'success');
                updateSyncStatus('ok', 'Synkad');

            } catch (error) {
                console.error("Fel vid import: ", error);
                showToast('Fel vid import. Kontrollera filformatet.', 'error');
                updateSyncStatus('error', 'Importfel!');
            } finally {
                // Rensa filinmatningen för att tillåta ny import
                event.target.value = null; 
            }
        };
        reader.readAsText(file);
    });
}

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

// --- KÖR ALLT I ORDNING ---
document.addEventListener('DOMContentLoaded', () => {
    try {
        checkTheme(); // --- NYTT: Sätt tema FÖRST
        updateSyncStatus('connecting', 'Ansluter...'); 
        initializeCollapseState();
        loadPersistentState(); // --- NYTT: Ladda sparade filter
        initializeListeners(); 
        setupRealtimeListener(); // Döljer laddaren när datan är hämtad
    } catch (e) {
        console.error("App Initialization Error:", e);
        updateSyncStatus('error', 'Initieringsfel!'); 
        if(initialLoader) initialLoader.querySelector('p').textContent = 'Kritiskt fel vid initiering.';
    }
});
