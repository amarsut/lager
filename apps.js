import { initializeApp } from 'https://www.gstatic.com/firebasejs/9.6.1/firebase-app.js';
// Auth och Storage är borttagna
import { getFirestore, collection, doc, setDoc, deleteDoc, onSnapshot, query, orderBy } from 'https://www.gstatic.com/firebasejs/9.6.1/firebase-firestore.js';
import { getAnalytics } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-analytics.js";

// FIREBASE KONFIGURATION (Inga ändringar gjorda här, men Auth/Storage-moduler används inte)
const firebaseConfig = {
  apiKey: "AIzaSyAC4SLwVEzP3CPO4lLfDeZ71iU0xdr49sw", 
  authDomain: "lagerdata-a9b39.firebaseapp.com",
  projectId: "lagerdata-a9b39",
  storageBucket: "lagerdata-a9b39.firebasestorage.app",
  messagingSenderId: "615646392577",
  appId: "1:615646392577:web:fd816443728e88b218eb00"
};

// --- GLOBALA VARIABLER ---
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const analytics = getAnalytics(app);

let allArticles = []; // Lagrar den kompletta, ofiltrerade datan
let currentSortColumn = 'name';
let currentSortDirection = 'asc';
let currentSearchQuery = '';
let currentFilters = {
    category: [],
    location: []
};
let isSearchMode = false;

// --- DOM ELEMENT CACHE ---
const listContainer = document.getElementById('lager-list-container');
const addForm = document.getElementById('add-article-form');
const editForm = document.getElementById('edit-form');
const addFormWrapper = document.getElementById('add-form-wrapper');
const toggleAddFormBtn = document.getElementById('toggle-add-form-btn');
const searchInput = document.getElementById('search-input');
const clearSearchBtn = document.getElementById('clear-search-btn');
const initialLoader = document.getElementById('initial-loader');
const mainContent = document.getElementById('main-app-content');
const editModal = document.getElementById('editModal');
const viewModal = document.getElementById('viewModal');
const confirmModal = document.getElementById('confirmationModal');
const confirmYesBtn = document.getElementById('confirmYes');

const categoryFilter = document.getElementById('category-filter');
const locationFilter = document.getElementById('location-filter');
const resetFiltersBtn = document.getElementById('reset-filters-btn');
const locationSuggestionsDatalist = document.getElementById('location-suggestions');
const emptyStateContainer = document.getElementById('empty-state-container');

// --- PWA SERVICE WORKER ---
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

// --- VERKTYG & HJÄLPFUNKTIONER ---

/**
 * Visar ett toast-meddelande.
 * @param {string} message 
 * @param {'success'|'error'|'info'} type 
 * @param {number} duration 
 */
function showToast(message, type = 'info', duration = 3000) {
    const container = document.getElementById('toast-container');
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    
    let icon = '';
    if (type === 'success') icon = '✓';
    else if (type === 'error') icon = '×';
    else icon = 'i';
    
    toast.innerHTML = `<span class="toast-icon">${icon}</span> ${message}`;
    container.appendChild(toast);

    setTimeout(() => {
        toast.classList.add('exiting');
        toast.addEventListener('animationend', () => toast.remove());
    }, duration);
}

/**
 * Öppnar en modal.
 * @param {HTMLElement} modalElement 
 */
function openModal(modalElement) {
    modalElement.classList.add('is-open');
}

/**
 * Stänger en modal.
 * @param {HTMLElement} modalElement 
 */
function closeModal(modalElement) {
    modalElement.classList.remove('is-open');
}

/**
 * Visar en bekräftelsedialog.
 * @param {string} title 
 * @param {string} message 
 * @returns {Promise<boolean>}
 */
function showConfirmation(title, message) {
    return new Promise(resolve => {
        document.getElementById('confirmationTitle').textContent = title;
        document.getElementById('confirmationMessage').textContent = message;
        openModal(confirmModal);

        const handleConfirm = () => {
            closeModal(confirmModal);
            confirmYesBtn.removeEventListener('click', handleConfirm);
            document.getElementById('confirmNo').removeEventListener('click', handleCancel);
            resolve(true);
        };

        const handleCancel = () => {
            closeModal(confirmModal);
            confirmYesBtn.removeEventListener('click', handleConfirm);
            document.getElementById('confirmNo').removeEventListener('click', handleCancel);
            resolve(false);
        };

        confirmYesBtn.textContent = "Ja, Fortsätt";
        confirmYesBtn.classList.remove('btn-primary');
        confirmYesBtn.classList.add('btn-danger'); // Gör knappen röd för borttagning
        confirmYesBtn.addEventListener('click', handleConfirm);
        document.getElementById('confirmNo').addEventListener('click', handleCancel);
    });
}

/**
 * Sparar ett objekt till en Firestore-kollektion med ett givet ID.
 * @param {string} collectionName 
 * @param {string} docId 
 * @param {object} data 
 * @returns {Promise<void>}
 */
async function saveDocument(collectionName, docId, data) {
    const docRef = doc(db, collectionName, docId);
    await setDoc(docRef, data, { merge: true });
}

/**
 * Tar bort ett dokument från Firestore.
 * @param {string} collectionName 
 * @param {string} docId 
 * @returns {Promise<void>}
 */
async function deleteDocument(collectionName, docId) {
    const docRef = doc(db, collectionName, docId);
    await deleteDoc(docRef);
}

// --- TEMA/LOKAL LAGRING ---

/**
 * Laddar och applicerar det sparade temat från localStorage.
 */
function initializeTheme() {
    const savedTheme = localStorage.getItem('theme') || 'light';
    document.body.setAttribute('data-theme', savedTheme);
    document.getElementById('theme-toggle').checked = (savedTheme === 'dark');
}

/**
 * Växlar tema och sparar till localStorage.
 */
function toggleTheme() {
    const body = document.body;
    const isDark = body.getAttribute('data-theme') === 'dark';
    const newTheme = isDark ? 'light' : 'dark';
    body.setAttribute('data-theme', newTheme);
    localStorage.setItem('theme', newTheme);
}

/**
 * Initierar och sparar tillstånd för formuläret.
 */
function initializeAddFormState() {
    const isOpen = localStorage.getItem('addFormOpen') === 'true';
    if (isOpen) {
        addFormWrapper.classList.add('open');
        toggleAddFormBtn.classList.add('open');
    }
}

/**
 * Växlar formulär-tillståndet och sparar till localStorage.
 */
function toggleAddForm() {
    const isOpen = addFormWrapper.classList.toggle('open');
    toggleAddFormBtn.classList.toggle('open');
    localStorage.setItem('addFormOpen', isOpen);
}

// --- LOKAL FILTERHANTERING ---

/**
 * Laddar sparade filter från localStorage.
 */
function loadFiltersFromStorage() {
    const storedFilters = JSON.parse(localStorage.getItem('currentFilters'));
    if (storedFilters) {
        currentFilters.category = storedFilters.category || [];
        currentFilters.location = storedFilters.location || [];
    }
    // Uppdatera UI
    updateFilterUI();
}

/**
 * Sparar aktuella filter till localStorage.
 */
function saveFiltersToStorage() {
    localStorage.setItem('currentFilters', JSON.stringify(currentFilters));
}

/**
 * Återställer alla filter och UI.
 */
function resetFilters() {
    currentFilters.category = [];
    currentFilters.location = [];
    saveFiltersToStorage();
    updateFilterUI();
    filterAndRenderArticles();
    showToast("Filter återställda.", 'info');
}

/**
 * Uppdaterar filter-selects i UI baserat på `currentFilters`.
 */
function updateFilterUI() {
    // Kategori-filter
    Array.from(categoryFilter.options).forEach(option => {
        option.selected = currentFilters.category.includes(option.value);
    });

    // Plats-filter (hanteras dynamiskt i `updateLocationFilterOptions`)
    Array.from(locationFilter.options).forEach(option => {
        option.selected = currentFilters.location.includes(option.value);
    });
}

/**
 * Fyller Plats-filtret och datalisten baserat på all data.
 */
function updateLocationOptions(articles) {
    const locations = new Set(articles.map(a => a.location).filter(Boolean));
    const sortedLocations = Array.from(locations).sort();

    // Uppdatera Platsfilter-select
    locationFilter.innerHTML = '<option value="">Alla Platser</option>';
    sortedLocations.forEach(loc => {
        const option = document.createElement('option');
        option.value = loc;
        option.textContent = loc;
        locationFilter.appendChild(option);
    });
    // Återapplicera sparade val
    updateFilterUI();

    // Uppdatera Datalist för formulären (autoslutförande)
    locationSuggestionsDatalist.innerHTML = '';
    sortedLocations.forEach(loc => {
        const option = document.createElement('option');
        option.value = loc;
        locationSuggestionsDatalist.appendChild(option);
    });
}

// --- DATABASHANTERING (CRUD) ---

/**
 * Lägger till en ny artikel i Firestore.
 * @param {Event} e 
 */
async function handleAddArticle(e) {
    e.preventDefault();

    const formData = new FormData(addForm);
    const data = Object.fromEntries(formData.entries());

    // NYTT: Automatisk konvertering av Plats till versaler
    data.location = (data.location || '').toUpperCase().trim();

    // Validering
    if (!data.id || !data.name || !data.location || !data.quantity || !data.category) {
        showToast("Alla obligatoriska fält måste fyllas i.", 'error');
        return;
    }

    if (allArticles.some(a => a.id === data.id)) {
        showToast(`ID ${data.id} finns redan. Välj ett unikt ID.`, 'error');
        document.getElementById('new-id').closest('div').classList.add('has-error');
        return;
    } else {
        document.getElementById('new-id').closest('div').classList.remove('has-error');
    }

    data.quantity = parseInt(data.quantity);
    data.price = parseFloat(data.price || 0) || 0;
    data.notes = data.notes || '';
    data.link = data.link || '';
    data.lastModified = new Date().toISOString();
    
    // NYTT: Spara skapande-datum och den som skapade (hårdkodad då auth är borttagen)
    data.dateCreated = new Date().toISOString();
    data.createdBy = "Systemanvändare"; 

    try {
        // ID är redan unikt (används som docId)
        await saveDocument('lager', data.id, data);
        showToast(`Artikel "${data.name}" lades till.`, 'success');
        addForm.reset();
        // Stäng formuläret efter lyckad inmatning
        toggleAddForm(); 
    } catch (error) {
        console.error("Fel vid tillägg av artikel:", error);
        showToast(`Fel: Kunde inte lägga till artikel. ${error.message}`, 'error');
    }
}

/**
 * Öppnar redigeringsmodalen med vald artikels data.
 * @param {string} articleId 
 */
function openEditModal(articleId) {
    const article = allArticles.find(a => a.id === articleId);
    if (!article) return showToast("Artikel hittades inte.", 'error');

    document.getElementById('edit-article-id-display').textContent = article.id;
    document.getElementById('edit-id-hidden').value = article.id;
    document.getElementById('edit-name').value = article.name || '';
    document.getElementById('edit-location').value = article.location || '';
    document.getElementById('edit-quantity').value = article.quantity;
    document.getElementById('edit-price').value = article.price || 0;
    document.getElementById('edit-category').value = article.category || 'Service';
    document.getElementById('edit-notes').value = article.notes || '';
    document.getElementById('edit-link').value = article.link || '';
    // NYTT: Visar original ID (hårdkodat till nuvarande ID)
    document.getElementById('edit-original-id-display').textContent = article.id; 

    openModal(editModal);
}

/**
 * Sparar ändringar från redigeringsformuläret.
 * @param {Event} e 
 */
async function handleEditArticle(e) {
    e.preventDefault();

    const formData = new FormData(editForm);
    const id = document.getElementById('edit-id-hidden').value;
    const data = Object.fromEntries(formData.entries());
    
    // NYTT: Automatisk konvertering av Plats till versaler
    data.location = (data.location || '').toUpperCase().trim();

    data.quantity = parseInt(data.quantity);
    data.price = parseFloat(data.price || 0) || 0;
    data.notes = data.notes || '';
    data.link = data.link || '';
    data.lastModified = new Date().toISOString();

    try {
        await saveDocument('lager', id, data);
        showToast(`Artikel "${data.name}" uppdaterades.`, 'success');
        closeModal(editModal);
    } catch (error) {
        console.error("Fel vid uppdatering av artikel:", error);
        showToast(`Fel: Kunde inte uppdatera artikel. ${error.message}`, 'error');
    }
}

/**
 * Hanterar borttagning av en artikel.
 * @param {string} articleId 
 * @param {string} articleName 
 */
async function handleDeleteArticle(articleId, articleName) {
    const confirmed = await showConfirmation(
        "Bekräfta Borttagning",
        `Är du säker på att du vill ta bort artikeln <strong>${articleName} (${articleId})</strong> permanent?`
    );

    if (confirmed) {
        try {
            await deleteDocument('lager', articleId);
            showToast(`Artikel "${articleName}" togs bort.`, 'success');
            // Stäng view modal om den är öppen
            if (viewModal.classList.contains('is-open')) {
                closeModal(viewModal);
            }
        } catch (error) {
            console.error("Fel vid borttagning av artikel:", error);
            showToast(`Fel: Kunde inte ta bort artikel. ${error.message}`, 'error');
        }
    }
}

/**
 * Öppnar detaljmodalen.
 * @param {string} articleId 
 */
function openViewModal(articleId) {
    const article = allArticles.find(a => a.id === articleId);
    if (!article) return showToast("Artikel hittades inte.", 'error');

    // Fyll detaljer
    document.getElementById('view-id').textContent = article.id;
    document.getElementById('view-name').textContent = article.name || 'Ej angivet';
    document.getElementById('view-location').textContent = article.location || 'Ej angivet';
    document.getElementById('view-quantity').textContent = article.quantity;
    document.getElementById('view-category').textContent = article.category || 'Ej angivet';
    document.getElementById('view-notes').textContent = article.notes || 'Inga anteckningar';
    document.getElementById('view-price').textContent = article.price ? `${article.price.toFixed(2)} kr` : 'Ej angivet';

    const linkEl = document.getElementById('view-link');
    const linkContainerEl = document.getElementById('view-link-container');
    if (article.link) {
        linkEl.href = article.link.startsWith('http') ? article.link : `http://${article.link}`;
        linkEl.textContent = article.link;
        linkContainerEl.style.display = 'block';
    } else {
        linkEl.href = '#';
        linkEl.textContent = 'Ingen länk angiven';
        linkContainerEl.style.display = 'block'; // Visa fältet ändå
    }

    // Lägg till eventlyssnare på knapparna i modalen
    document.getElementById('view-edit-btn').onclick = () => {
        closeModal(viewModal);
        openEditModal(articleId);
    };
    document.getElementById('view-delete-btn').onclick = () => {
        closeModal(viewModal);
        handleDeleteArticle(article.id, article.name);
    };
    document.getElementById('view-duplicate-btn').onclick = () => {
        closeModal(viewModal);
        handleDuplicateArticle(article);
    };

    openModal(viewModal);
}

/**
 * NYTT: Skapar en kopia av en befintlig artikel och öppnar lägg-till formuläret.
 * @param {object} articleToDuplicate 
 */
function handleDuplicateArticle(articleToDuplicate) {
    // Sätt ID till "Kopia-ID" och Plats till originalet
    const newId = `KOPIA-${articleToDuplicate.id}`; 
    
    // Försök hitta ett ledigt ID i fall KOPIA-ID redan finns
    let finalId = newId;
    let counter = 1;
    while(allArticles.some(a => a.id === finalId)) {
        finalId = `${newId}-${counter++}`;
    }

    // Öppna formuläret om det är stängt
    if (!addFormWrapper.classList.contains('open')) {
        toggleAddForm();
    }
    
    // Fyll i formuläret med kopierad data
    document.getElementById('new-id').value = finalId;
    document.getElementById('new-name').value = articleToDuplicate.name || '';
    document.getElementById('new-location').value = articleToDuplicate.location || '';
    document.getElementById('new-quantity').value = articleToDuplicate.quantity || 1;
    document.getElementById('new-price').value = articleToDuplicate.price || 0;
    document.getElementById('new-category').value = articleToDuplicate.category || 'Service';
    document.getElementById('new-notes').value = `(KOPIA från ${articleToDuplicate.id}) ${articleToDuplicate.notes || ''}`.trim();
    document.getElementById('new-link').value = articleToDuplicate.link || '';
    
    showToast(`Förbereder dubblering av ${articleToDuplicate.id}. Ändra ID och spara.`, 'info', 5000);

    // Skrolla upp till formuläret
    window.scrollTo({ top: 0, behavior: 'smooth' });
}


// --- DATAHANTERING & RENDERING ---

/**
 * Filterar artiklar baserat på söksträng och aktiva filter.
 * @returns {object[]} Filterad och sorterad lista
 */
function filterAndSortArticles() {
    let filtered = allArticles;
    const query = currentSearchQuery.toLowerCase();
    
    // 1. Sökning
    if (query) {
        filtered = filtered.filter(article =>
            article.id.toLowerCase().includes(query) ||
            article.name.toLowerCase().includes(query) ||
            article.location.toLowerCase().includes(query) ||
            article.notes.toLowerCase().includes(query)
        );
        isSearchMode = true;
    } else {
        isSearchMode = false;
    }

    // 2. Kategori-filter (Många val är tillåtna)
    if (currentFilters.category.length > 0) {
        filtered = filtered.filter(article => 
            currentFilters.category.includes(article.category)
        );
    }

    // 3. Plats-filter (Många val är tillåtna)
    if (currentFilters.location.length > 0) {
        filtered = filtered.filter(article => 
            currentFilters.location.includes(article.location)
        );
    }

    // 4. Sortering
    filtered.sort((a, b) => {
        const valA = a[currentSortColumn];
        const valB = b[currentSortColumn];
        let comparison = 0;

        if (valA > valB) {
            comparison = 1;
        } else if (valA < valB) {
            comparison = -1;
        }

        return currentSortDirection === 'desc' ? comparison * -1 : comparison;
    });

    return filtered;
}

/**
 * Hanterar sökning/filtrering och uppdaterar UI.
 */
function filterAndRenderArticles() {
    const filteredArticles = filterAndSortArticles();
    renderArticles(filteredArticles);
}

/**
 * Ritar ut listan av artiklar i kategorier eller som en platt lista vid sökning/filtrering.
 * @param {object[]} articles 
 */
function renderArticles(articles) {
    listContainer.innerHTML = '';
    
    if (articles.length === 0) {
        // Visa tomt tillstånd
        emptyStateContainer.style.display = 'block';
        if (currentSearchQuery) {
            document.getElementById('empty-state-title').textContent = "Inga sökresultat.";
            document.getElementById('empty-state-message').textContent = `Hittade inga artiklar som matchade "${currentSearchQuery}".`;
        } else if (currentFilters.category.length > 0 || currentFilters.location.length > 0) {
             document.getElementById('empty-state-title').textContent = "Inga artiklar matchar filtren.";
             document.getElementById('empty-state-message').textContent = `Justera dina Kategori- eller Plats-filter.`;
        } else {
             document.getElementById('empty-state-title').textContent = "Lagerdatabasen är tom.";
             document.getElementById('empty-state-message').textContent = `Börja med att lägga till din första artikel.`;
        }
        return;
    }
    
    emptyStateContainer.style.display = 'none';

    // Bestäm om artiklarna ska grupperas
    const shouldGroup = !isSearchMode && currentFilters.category.length === 0 && currentFilters.location.length === 0;

    if (shouldGroup) {
        // Gruppera efter Kategori
        const grouped = articles.reduce((acc, article) => {
            const key = article.category || 'Övrigt';
            if (!acc[key]) acc[key] = [];
            acc[key].push(article);
            return acc;
        }, {});

        Object.keys(grouped).sort().forEach(category => {
            const categoryWrapper = document.createElement('div');
            const wrapperId = `category-wrapper-${category.replace(/[^a-zA-Z0-9]/g, '-')}`;
            categoryWrapper.id = wrapperId;
            categoryWrapper.className = 'lager-wrapper';

            // Skapa rubrik
            const header = document.createElement('h3');
            header.className = 'collapsible-header';
            header.setAttribute('data-target', wrapperId);
            header.setAttribute('data-state', 'open'); // NYTT: Standard "open"
            header.innerHTML = `<div>${category} <span class="category-badge">${grouped[category].length} artiklar</span></div><span class="toggle-icon">▼</span>`;
            listContainer.appendChild(header);
            
            // Skapa tabellinnehåll
            const container = createTableContainer(grouped[category]);
            categoryWrapper.appendChild(container);
            listContainer.appendChild(categoryWrapper);
        });
    } else {
        // Platt lista vid sökning/filtrering
        const container = createTableContainer(articles);
        const wrapper = document.createElement('div');
        wrapper.className = 'lager-wrapper';
        wrapper.appendChild(container);
        listContainer.appendChild(wrapper);
    }
    
    // Uppdatera sorteringsikoner efter rendering
    updateSortIcons();
}

/**
 * Skapar en tabellbehållare med header och artiklar.
 * @param {object[]} articles 
 * @returns {HTMLElement}
 */
function createTableContainer(articles) {
    const container = document.createElement('div');
    container.className = 'lager-container';

    // Header
    const header = document.createElement('div');
    header.className = 'header';
    // NYTT: Kolumn för bild borttagen
    header.innerHTML = `
        <span data-sort="id">ID <span class="sort-icon"></span></span>
        <span data-sort="name">Namn <span class="sort-icon"></span></span>
        <span data-sort="location">Plats <span class="sort-icon"></span></span>
        <span data-sort="quantity">Antal <span class="sort-icon"></span></span>
        <span data-sort="price">Pris <span class="sort-icon"></span></span>
        <span data-sort="notes">Anteckningar <span class="sort-icon"></span></span>
        <span data-sort="category">Kategori <span class="sort-icon"></span></span>
        <span style="text-align: right;">Åtgärder</span>
    `;
    container.appendChild(header);

    // Artiklar
    articles.forEach(article => {
        const row = document.createElement('div');
        row.className = 'artikel-rad';
        
        // Formatera sista modifieringsdatum
        const date = article.lastModified ? new Date(article.lastModified) : new Date(article.dateCreated);
        const dateStr = date.toLocaleDateString('sv-SE', { year: 'numeric', month: 'short', day: 'numeric' });
        
        // NYTT: Antal-färg
        const quantityClass = article.quantity > 0 ? 'i-lager' : 'slut-i-lager';

        row.innerHTML = `
            <span class="id-cell">${article.id}</span>
            <span class="name-cell">${article.name || ''}</span>
            <span class="location-cell">${article.location || ''}</span>
            <span class="${quantityClass} quantity-cell">${article.quantity} st</span>
            <span class="price-cell">${article.price ? article.price.toFixed(2) + ' kr' : '-'}</span>
            <span class="notes-cell">${article.notes || '-'}</span>
            <span class="category-cell">${article.category || '-'}</span>
            <div class="button-group">
                <button class="btn-secondary btn-action" data-action="view" data-id="${article.id}" title="Visa detaljer">👁️</button>
                <button class="btn-secondary btn-action" data-action="edit" data-id="${article.id}" title="Redigera">✎</button>
                <button class="btn-danger btn-action" data-action="delete" data-id="${article.id}" title="Ta bort">🗑️</button>
            </div>
        `;

        // Lägg till eventlyssnare på knappar i raden
        row.querySelectorAll('.btn-action').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const id = btn.dataset.id;
                const action = btn.dataset.action;
                if (action === 'view') {
                    openViewModal(id);
                } else if (action === 'edit') {
                    openEditModal(id);
                } else if (action === 'delete') {
                    handleDeleteArticle(id, allArticles.find(a => a.id === id)?.name);
                }
            });
        });
        
        // Klick på raden öppnar View Modal (NYTT: ersätter den gamla popup-funktionen)
        row.addEventListener('click', () => openViewModal(article.id));
        
        container.appendChild(row);
    });

    // Lägg till eventlyssnare på sorteringshuvuden
    header.querySelectorAll('[data-sort]').forEach(sortEl => {
        sortEl.addEventListener('click', () => handleSort(sortEl.dataset.sort));
    });

    return container;
}

/**
 * Hanterar klick på sorteringskolumn.
 * @param {string} column 
 */
function handleSort(column) {
    if (currentSortColumn === column) {
        currentSortDirection = currentSortDirection === 'asc' ? 'desc' : 'asc';
    } else {
        currentSortColumn = column;
        currentSortDirection = 'asc';
    }
    // Spara sortering lokalt
    localStorage.setItem('currentSortColumn', currentSortColumn);
    localStorage.setItem('currentSortDirection', currentSortDirection);
    
    // Återrendera listan
    filterAndRenderArticles();
}

/**
 * Uppdaterar sorteringsikonerna i tabellhuvudet.
 */
function updateSortIcons() {
    document.querySelectorAll('.header span[data-sort]').forEach(header => {
        const icon = header.querySelector('.sort-icon');
        const column = header.dataset.sort;
        
        header.classList.remove('active');
        icon.innerHTML = ''; // Rensa ikonen

        if (column === currentSortColumn) {
            header.classList.add('active');
            icon.innerHTML = currentSortDirection === 'asc' ? '▲' : '▼';
        }
    });
}

/**
 * Initierar realtidslyssnare på Firestore.
 */
function setupRealtimeListener() {
    const q = query(collection(db, "lager"), orderBy("name", "asc"));

    onSnapshot(q, (snapshot) => {
        const statusElement = document.getElementById('sync-status');
        
        if (statusElement) {
            statusElement.className = 'sync-status sync-ok';
            statusElement.innerHTML = `<span class="icon"></span> Synkroniserad`;
        }
        
        // Hämta all data
        allArticles = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        
        // Dölj laddningsskärm och visa innehåll
        initialLoader.style.display = 'none';
        mainContent.classList.add('visible');

        // Fyll i Plats-alternativen
        updateLocationOptions(allArticles);
        
        // Rendera filtrerad/sorterad data
        filterAndRenderArticles();

    }, (error) => {
        console.error("Firestore realtidsfel:", error);
        if (statusElement) {
            statusElement.className = 'sync-status sync-error';
            statusElement.innerHTML = `<span class="icon"></span> FEL: ${error.code.toUpperCase()}`;
        }
    });
}

// --- INITIALISERING ---

document.addEventListener('DOMContentLoaded', () => {
    try {
        // 1. Läs in Tema/Sortering/Filter
        initializeTheme();
        initializeAddFormState();
        currentSortColumn = localStorage.getItem('currentSortColumn') || 'name';
        currentSortDirection = localStorage.getItem('currentSortDirection') || 'asc';
        loadFiltersFromStorage();
        
        // 2. Visa laddningsskärm
        initialLoader.style.display = 'flex';

        // 3. Händelselyssnare
        toggleAddFormBtn.addEventListener('click', toggleAddForm);
        document.getElementById('theme-toggle').addEventListener('change', toggleTheme);
        addForm.addEventListener('submit', handleAddArticle);
        editForm.addEventListener('submit', handleEditArticle);
        
        // 4. Sök- och Filterlyssnare
        
        // Sökning
        const handleSearch = () => {
            currentSearchQuery = searchInput.value.trim();
            clearSearchBtn.style.display = currentSearchQuery ? 'block' : 'none';
            filterAndRenderArticles();
        };

        searchInput.addEventListener('input', handleSearch);
        clearSearchBtn.addEventListener('click', () => {
            searchInput.value = '';
            handleSearch();
        });
        
        // Filter
        const handleFilterChange = () => {
            // Hämta valda kategorier (flervalsstöd)
            currentFilters.category = Array.from(categoryFilter.options)
                .filter(option => option.selected && option.value !== "")
                .map(option => option.value);

            // Hämta valda platser (flervalsstöd)
            currentFilters.location = Array.from(locationFilter.options)
                .filter(option => option.selected && option.value !== "")
                .map(option => option.value);
            
            saveFiltersToStorage();
            filterAndRenderArticles();
        };

        categoryFilter.addEventListener('change', handleFilterChange);
        locationFilter.addEventListener('change', handleFilterChange);
        resetFiltersBtn.addEventListener('click', resetFilters);
        
        // Hantera Esc för att stänga modal
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                closeModal(editModal);
                closeModal(viewModal);
                closeModal(confirmModal);
            }
        });
        
        // 5. Initiera Realtidslyssnare
        setupRealtimeListener();

    } catch (e) {
        console.error("App Initialization Error:", e);
        // Fallback om Firebase misslyckas
        const statusElement = document.getElementById('sync-status');
        if (statusElement) {
           statusElement.textContent = "FEL: Initieringsfel!";
           statusElement.className = 'sync-status sync-error';
        }
    }
});
