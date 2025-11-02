import { initializeApp } from 'https://www.gstatic.com/firebasejs/9.6.1/firebase-app.js';
// HAR TAGIT BORT: getAuth, onAuthStateChanged, signInWithEmailAndPassword, signOut
import { getFirestore, collection, doc, setDoc, deleteDoc, onSnapshot, query, orderBy, getDocs } from 'https://www.gstatic.com/firebasejs/9.6.1/firebase-firestore.js';
import { getStorage, ref, uploadBytes, getDownloadURL, deleteObject } from 'https://www.gstatic.com/firebasejs/9.6.1/firebase-storage.js';
import { getAnalytics } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-analytics.js";


// FIREBASE KONFIGURATION (Oförändrad)
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
// HAR TAGIT BORT: const auth = getAuth(app); 
const db = getFirestore(app);
const storage = getStorage(app); 
const analytics = getAnalytics(app);

let allArticles = []; 
let allAuditLogs = []; 
let currentSortColumn = 'name';
let currentSortDirection = 'asc';
let currentCategoryFilter = '';
let currentSearchQuery = '';
// HAR TAGIT BORT: let currentUser = null; 
const IMAGE_MAX_SIZE = 2 * 1024 * 1024; // 2MB
const CURRENT_USER_PLACEHOLDER = 'ANONYMOUS_USER'; // Används för loggar

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
const appNavbar = document.getElementById('app-navbar');

// HAR TAGIT BORT: loginOverlay, loginForm, loginError, logoutBtn, userEmailDisplay
const themeToggle = document.getElementById('theme-toggle'); 

const editModal = document.getElementById('editModal');
const viewModal = document.getElementById('viewModal');
const confirmModal = document.getElementById('confirmationModal');
const confirmYesBtn = document.getElementById('confirmYes');

const categoryFilter = document.getElementById('category-filter');

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

function openModal(modalElement) {
    modalElement.classList.add('is-open');
}

function closeModal(modalElement) {
    modalElement.classList.remove('is-open');
}

function showConfirmation(title, message) {
    return new Promise(resolve => {
        document.getElementById('confirmationTitle').textContent = title;
        document.getElementById('confirmationMessage').innerHTML = message;
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
        confirmYesBtn.classList.add('btn-danger'); 
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

function initializeTheme() {
    const savedTheme = localStorage.getItem('theme') || 'light';
    document.body.setAttribute('data-theme', savedTheme);
    themeToggle.checked = (savedTheme === 'dark'); 
}

function toggleTheme() {
    const body = document.body;
    const isDark = body.getAttribute('data-theme') === 'dark';
    const newTheme = isDark ? 'light' : 'dark';
    body.setAttribute('data-theme', newTheme);
    localStorage.setItem('theme', newTheme);
}

function initializeAddFormState() {
    const isOpen = localStorage.getItem('addFormOpen') === 'true';
    if (isOpen) {
        addFormWrapper.classList.add('open');
        toggleAddFormBtn.classList.add('open');
    }
}

function toggleAddForm() {
    const isOpen = addFormWrapper.classList.toggle('open');
    toggleAddFormBtn.classList.toggle('open');
    localStorage.setItem('addFormOpen', isOpen);
}


// --- HAR TAGIT BORT: FIREBASE AUTH FUNKTIONER ---


// --- FIREBASE STORAGE / BILDHANTERING ---

/**
 * Laddar upp en fil till Firebase Storage.
 * @param {File} file 
 * @param {string} articleId 
 * @returns {Promise<string>} URL till den uppladdade bilden
 */
async function handleImageUpload(file, articleId) {
    if (!file) return null;
    if (file.size > IMAGE_MAX_SIZE) {
        throw new Error(`Filstorleken får inte överstiga ${IMAGE_MAX_SIZE / 1024 / 1024}MB.`);
    }

    // Unikt filnamn för att undvika konflikter
    const fileName = `${Date.now()}-${file.name}`; 
    const storageRef = ref(storage, `artikelbilder/${articleId}/${fileName}`);
    
    const metadata = { contentType: file.type }; 
    
    const snapshot = await uploadBytes(storageRef, file, metadata);
    const url = await getDownloadURL(snapshot.ref);
    return url;
}

/**
 * Tar bort bilden från Firebase Storage om en bild-URL finns.
 * @param {string} imageUrl 
 */
async function deleteImage(imageUrl) {
    if (!imageUrl) return;

    try {
        const imageRef = ref(storage, imageUrl);
        await deleteObject(imageRef);
    } catch (error) {
        // Ignorera om filen inte hittas
        if (error.code !== 'storage/object-not-found') {
            console.warn("Kunde inte ta bort gammal bild:", error.message);
        }
    }
}

/**
 * Återställer bildförhandsvisningen för ett givet formulär.
 * @param {string} formPrefix 'new' eller 'edit'
 * @param {string|null} imageUrl 
 */
function updateImagePreview(formPrefix, imageUrl) {
    const previewEl = document.getElementById(`${formPrefix}-image-preview`);
    const clearBtn = document.getElementById(`${formPrefix}-clear-image-btn`);
    
    if (imageUrl) {
        previewEl.style.backgroundImage = `url('${imageUrl}')`;
        previewEl.classList.add('has-image');
        clearBtn.style.display = 'inline-block';
    } else {
        previewEl.style.backgroundImage = 'none';
        previewEl.classList.remove('has-image');
        clearBtn.style.display = 'none';
    }
}


// --- AUDIT LOG ---

/**
 * Lägger till en loggpost för en åtgärd.
 * @param {string} articleId 
 * @param {string} action 'CREATE' | 'UPDATE' | 'DELETE'
 * @param {object} changes 
 */
async function handleLogEntry(articleId, action, changes) {
    const logEntry = {
        itemId: articleId,
        timestamp: new Date().toISOString(),
        action: action,
        user: CURRENT_USER_PLACEHOLDER, // Använder placeholder istället för inloggad användare
        details: changes
    };

    try {
        const docId = `log-${Date.now()}-${articleId}`;
        await saveDocument('loggar', docId, logEntry);
    } catch (error) {
        console.error("Kunde inte skapa loggpost:", error);
    }
}

/**
 * Ritar ut granskningsloggen i View Modal.
 * @param {string} articleId 
 */
function renderAuditLog(articleId) {
    const logContainer = document.getElementById('audit-log-container');
    const logs = allAuditLogs
        .filter(log => log.itemId === articleId)
        .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

    if (logs.length === 0) {
        logContainer.innerHTML = `<p style="text-align: center; color: var(--text-light); margin: 0;">Ingen historik för denna artikel.</p>`;
        return;
    }

    logContainer.innerHTML = '';
    logs.forEach(log => {
        const logEl = document.createElement('div');
        logEl.className = `log-entry log-${log.action.toLowerCase()}`;
        
        const date = new Date(log.timestamp).toLocaleString('sv-SE', {
             year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
        });
        
        let actionText = '';
        const userDisplay = log.user === CURRENT_USER_PLACEHOLDER ? 'Användare' : log.user.split('@')[0];

        if (log.action === 'CREATE') {
            actionText = 'skapade artikeln';
        } else if (log.action === 'UPDATE') {
            actionText = 'uppdaterade';
            
            const changes = log.details || {};
            const changeList = Object.keys(changes)
                .filter(key => key !== 'lastModified' && changes[key].oldValue !== changes[key].newValue) // Filtrera bort oförändrade fält
                .map(key => {
                     const oldValue = String(changes[key].oldValue).length > 20 ? `${String(changes[key].oldValue).substring(0, 17)}...` : changes[key].oldValue;
                     const newValue = String(changes[key].newValue).length > 20 ? `${String(changes[key].newValue).substring(0, 17)}...` : changes[key].newValue;
                     return `${key}: <strong>${oldValue}</strong> &rarr; <strong>${newValue}</strong>`;
                });
            
            if (changeList.length > 0) {
                 actionText += ` (${changeList.join('; ')})`;
            }
        } else if (log.action === 'DELETE') {
            actionText = 'TOG BORT artikeln';
        }
        
        logEl.innerHTML = `
            <span><strong>${userDisplay}</strong> ${actionText}</span>
            <span class="log-timestamp">${date}</span>
        `;
        logContainer.appendChild(logEl);
    });
}

/**
 * Lyssnar på alla loggposter i realtid.
 */
function setupAuditLogListener() {
    const q = query(collection(db, "loggar"), orderBy("timestamp", "desc"));

    onSnapshot(q, (snapshot) => {
        allAuditLogs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        // Eftersom vi inte har View Modal öppen som standard, behöver vi inte rendera loggar här.
    }, (error) => {
        console.error("Audit Log realtidsfel:", error);
    });
}


// --- DATABASHANTERING (CRUD) ---

/**
 * Lägger till en ny artikel i Firestore.
 */
async function handleAddArticle(e) {
    e.preventDefault();

    const formData = new FormData(addForm);
    const data = Object.fromEntries(formData.entries());
    const imageFile = document.getElementById('new-image-file').files[0];
    
    data.id = data.id.trim();

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

    try {
        let imageUrl = '';
        if (imageFile) {
            imageUrl = await handleImageUpload(imageFile, data.id);
        }
        
        data.imageUrl = imageUrl;
        data.quantity = parseInt(data.quantity);
        data.price = parseFloat(data.price || 0) || 0;
        data.notes = data.notes || '';
        data.link = data.link || '';
        data.lastModified = new Date().toISOString();
        data.dateCreated = new Date().toISOString();
        // Använder placeholder istället för inloggad användare
        data.createdBy = CURRENT_USER_PLACEHOLDER; 

        await saveDocument('lager', data.id, data);
        
        // Logga händelse
        await handleLogEntry(data.id, 'CREATE', { 
            name: { newValue: data.name }, 
            location: { newValue: data.location }, 
            quantity: { newValue: data.quantity } 
        });

        showToast(`Artikel "${data.name}" lades till.`, 'success');
        addForm.reset();
        updateImagePreview('new', null); // Rensa förhandsvisningen
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
    document.getElementById('edit-image-url-hidden').value = article.imageUrl || '';
    
    updateImagePreview('edit', article.imageUrl);

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
    const imageFile = document.getElementById('edit-image-file').files[0];
    const oldArticle = allArticles.find(a => a.id === id);
    const oldImageUrl = document.getElementById('edit-image-url-hidden').value;
    
    let newImageUrl = oldImageUrl;
    
    try {
        // Steg 1: Hantera bild
        const imagePreviewEl = document.getElementById('edit-image-preview');
        const isImageCleared = !imagePreviewEl.classList.contains('has-image') && !imageFile;
        
        if (imageFile) {
            // Ladda upp ny fil, ta bort gammal om den finns
            if (oldImageUrl) await deleteImage(oldImageUrl);
            newImageUrl = await handleImageUpload(imageFile, id);
        } else if (isImageCleared && oldImageUrl) {
            // Rensa bild knappen trycktes, ta bort från storage
            await deleteImage(oldImageUrl);
            newImageUrl = '';
        }

        // Steg 2: Förbered data och logga ändringar
        const changes = {};

        // Jämför fält för Audit Log
        const fields = ['name', 'location', 'quantity', 'price', 'category', 'notes', 'link'];
        fields.forEach(field => {
            const oldValue = oldArticle[field] || (field === 'price' || field === 'quantity' ? 0 : '');
            let newValue = data[field];
            
            // Typkonvertering för jämförelse
            if (field === 'quantity') {
                newValue = parseInt(newValue);
            } else if (field === 'price') {
                newValue = parseFloat(newValue || 0) || 0;
            }

            if (oldValue !== newValue) {
                changes[field] = { oldValue, newValue };
            }
        });
        
        // Jämför bild-URL
        if (oldImageUrl !== newImageUrl) {
             changes['imageUrl'] = { oldValue: oldImageUrl || 'Ingen bild', newValue: newImageUrl || 'Ingen bild' };
        }

        // Steg 3: Spara i databasen
        data.imageUrl = newImageUrl;
        data.quantity = parseInt(data.quantity);
        data.price = parseFloat(data.price || 0) || 0;
        data.notes = data.notes || '';
        data.link = data.link || '';
        data.lastModified = new Date().toISOString();
        data.createdBy = oldArticle.createdBy; // Behåll skaparen

        await saveDocument('lager', id, data);
        
        if (Object.keys(changes).length > 0) {
            await handleLogEntry(id, 'UPDATE', changes);
        }

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
    const article = allArticles.find(a => a.id === articleId);

    const confirmed = await showConfirmation(
        "Bekräfta Borttagning",
        `Är du säker på att du vill ta bort artikeln <strong>${articleName} (${articleId})</strong> permanent?`
    );

    if (confirmed) {
        try {
            // Steg 1: Ta bort bild från Storage
            if (article.imageUrl) {
                await deleteImage(article.imageUrl);
            }
            
            // Steg 2: Ta bort artikel från Firestore
            await deleteDocument('lager', articleId);
            
            // Steg 3: Skapa loggpost 
            await handleLogEntry(articleId, 'DELETE', { name: { oldValue: articleName, newValue: 'BORTTAGEN' } });

            showToast(`Artikel "${articleName}" togs bort.`, 'success');
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
async function openViewModal(articleId) {
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
        linkContainerEl.style.display = 'block'; 
    }
    
    // Bildhantering i View Modal
    const imgPlaceholder = document.getElementById('view-image-placeholder');
    imgPlaceholder.innerHTML = '';
    if (article.imageUrl) {
        imgPlaceholder.style.backgroundImage = `url('${article.imageUrl}')`;
        imgPlaceholder.textContent = '';
    } else {
        imgPlaceholder.style.backgroundImage = 'none';
        imgPlaceholder.textContent = 'Ingen Bild';
    }
    
    // Fyll i Audit Log
    renderAuditLog(articleId);

    // Lägg till eventlyssnare på knapparna i modalen
    document.getElementById('view-edit-btn').onclick = () => {
        closeModal(viewModal);
        openEditModal(articleId);
    };
    document.getElementById('view-delete-btn').onclick = () => {
        closeModal(viewModal);
        handleDeleteArticle(article.id, article.name);
    };

    openModal(viewModal);
}


// --- DATAHANTERING & RENDERING ---

/**
 * Filterar artiklar baserat på söksträng och kategori.
 * @returns {object[]} Filterad och sorterad lista
 */
function filterAndSortArticles() {
    let filtered = allArticles;
    const query = currentSearchQuery.toLowerCase();
    
    // 1. Kategori-filter
    if (currentCategoryFilter) {
        filtered = filtered.filter(article => article.category === currentCategoryFilter);
    }
    
    // 2. Sökning
    if (query) {
        filtered = filtered.filter(article =>
            article.id.toLowerCase().includes(query) ||
            article.name.toLowerCase().includes(query) ||
            article.location.toLowerCase().includes(query) ||
            article.notes.toLowerCase().includes(query)
        );
    }

    // 3. Sortering
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
    updateSortIcons();
}

/**
 * Ritar ut listan av artiklar i kategorier.
 * @param {object[]} articles 
 */
function renderArticles(articles) {
    listContainer.innerHTML = '';
    
    if (articles.length === 0) {
        listContainer.innerHTML = '<p style="text-align: center; color: var(--text-light); padding: 50px;">Inga artiklar hittades som matchar dina filter/sökning.</p>';
        return;
    }
    
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
        header.setAttribute('data-state', localStorage.getItem(wrapperId) || 'open'); 
        header.innerHTML = `<div>${category} <span class="category-badge">${grouped[category].length} artiklar</span></div><span class="toggle-icon">${header.getAttribute('data-state') === 'open' ? '▼' : '►'}</span>`;
        listContainer.appendChild(header);
        
        // Skapa tabellinnehåll
        const container = createTableContainer(grouped[category]);
        categoryWrapper.appendChild(container);
        listContainer.appendChild(categoryWrapper);
        
        // Dölj om stängt
        if (header.getAttribute('data-state') === 'closed') {
             categoryWrapper.classList.add('collapsed');
        }
    });
}

/**
 * Skapar en tabellbehållare med header och artiklar.
 * @param {object[]} articles 
 * @returns {HTMLElement}
 */
function createTableContainer(articles) {
    const container = document.createElement('div');
    container.className = 'lager-container';

    // Header (ÅTERSTÄLLD med bildkolumn)
    const header = document.createElement('div');
    header.className = 'header';
    header.innerHTML = `
        <span class="image-cell">BILD</span>
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
        row.setAttribute('data-id', article.id);
        
        // Antal-färg
        const quantityClass = article.quantity > 0 ? 'i-lager' : 'slut-i-lager';
        
        // Bildcell
        const imageStyle = article.imageUrl ? `background-image: url('${article.imageUrl}')` : '';
        const imageContent = article.imageUrl ? '' : '🖼️';

        row.innerHTML = `
            <span class="image-cell" style="${imageStyle}">${imageContent}</span>
            <span class="id-cell">${article.id}</span>
            <span class="name-cell">${article.name || ''}</span>
            <span class="location-cell">${article.location || ''}</span>
            <span class="${quantityClass} quantity-cell">${article.quantity} st</span>
            <span class="price-cell">${article.price ? article.price.toFixed(2) + ' kr' : '-'}</span>
            <span class="notes-cell">${article.notes || '-'}</span>
            <span class="category-cell">${article.category || '-'}</span>
            <div class="button-group">
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
                if (action === 'edit') {
                    openEditModal(id);
                } else if (action === 'delete') {
                    handleDeleteArticle(id, article.name);
                }
            });
        });
        
        // Klick på raden öppnar View Modal
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
        icon.innerHTML = ''; 

        if (column === currentSortColumn) {
            header.classList.add('active');
            icon.innerHTML = currentSortDirection === 'asc' ? '▲' : '▼';
        }
    });
}

/**
 * Lyssnar på Firestore-data i realtid.
 */
function setupRealtimeListener() {
    // Visa laddare
    initialLoader.style.display = 'flex'; 

    const q = query(collection(db, "lager"), orderBy("name", "asc"));

    onSnapshot(q, (snapshot) => {
        const statusElement = document.getElementById('sync-status');
        
        if (statusElement) {
            statusElement.className = 'sync-status sync-ok';
            statusElement.innerHTML = `<span class="icon"></span> Synkroniserad`;
        }
        
        allArticles = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        
        initialLoader.style.display = 'none';

        filterAndRenderArticles();

    }, (error) => {
        console.error("Firestore realtidsfel:", error);
        const statusElement = document.getElementById('sync-status');
        if (statusElement) {
            statusElement.className = 'sync-status sync-error';
            statusElement.innerHTML = `<span class="icon"></span> FEL: ${error.code.toUpperCase()}`;
        }
        initialLoader.style.display = 'none';
    });
}


// --- INITIALISERING ---

document.addEventListener('DOMContentLoaded', () => {
    try {
        // 1. Läs in Tema/Sortering/Formulärstatus
        initializeTheme();
        initializeAddFormState();
        currentSortColumn = localStorage.getItem('currentSortColumn') || 'name';
        currentSortDirection = localStorage.getItem('currentSortDirection') || 'asc';
        currentCategoryFilter = localStorage.getItem('currentCategoryFilter') || '';
        categoryFilter.value = currentCategoryFilter;
        
        // 2. Händelselyssnare
        
        // Formulär och UI
        toggleAddFormBtn.addEventListener('click', toggleAddForm);
        themeToggle.addEventListener('change', toggleTheme); 

        addForm.addEventListener('submit', handleAddArticle);
        editForm.addEventListener('submit', handleEditArticle);
        
        // Bildhantering 
        document.getElementById('new-image-preview').addEventListener('click', () => {
            document.getElementById('new-image-file').click();
        });
        document.getElementById('new-image-file').addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (file) {
                if (file.size > IMAGE_MAX_SIZE) {
                    showToast("Bilden är för stor (Max 2MB).", 'error');
                    e.target.value = null; 
                    updateImagePreview('new', null);
                    return;
                }
                const url = URL.createObjectURL(file);
                updateImagePreview('new', url);
            } else {
                updateImagePreview('new', null);
            }
        });
        document.getElementById('new-clear-image-btn').addEventListener('click', (e) => {
            e.preventDefault();
            document.getElementById('new-image-file').value = null;
            updateImagePreview('new', null);
        });

        document.getElementById('edit-image-preview').addEventListener('click', () => {
            document.getElementById('edit-image-file').click();
        });
        document.getElementById('edit-image-file').addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (file) {
                 if (file.size > IMAGE_MAX_SIZE) {
                    showToast("Bilden är för stor (Max 2MB).", 'error');
                    e.target.value = null;
                    return;
                }
                const url = URL.createObjectURL(file);
                updateImagePreview('edit', url);
            }
        });
        document.getElementById('edit-clear-image-btn').addEventListener('click', (e) => {
            e.preventDefault();
            document.getElementById('edit-image-file').value = null;
            document.getElementById('edit-image-url-hidden').value = ''; // Rensa URL
            updateImagePreview('edit', null);
        });

        // Sökning och Filter
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
        
        categoryFilter.addEventListener('change', () => {
            currentCategoryFilter = categoryFilter.value;
            localStorage.setItem('currentCategoryFilter', currentCategoryFilter);
            filterAndRenderArticles();
        });
        
        // Utskrift
        document.getElementById('print-list-btn').addEventListener('click', () => {
            window.print();
        });

        // Kollapsa/Expandera kategorier
        listContainer.addEventListener('click', (e) => {
            if (e.target.classList.contains('collapsible-header') || e.target.closest('.collapsible-header')) {
                const header = e.target.closest('.collapsible-header');
                const targetId = header.getAttribute('data-target');
                const targetWrapper = document.getElementById(targetId);
                const currentState = header.getAttribute('data-state');
                const newState = currentState === 'open' ? 'closed' : 'open';
                
                header.setAttribute('data-state', newState);
                header.querySelector('.toggle-icon').textContent = newState === 'open' ? '▼' : '►';
                
                if (targetWrapper) {
                    targetWrapper.classList.toggle('collapsed');
                }
                
                // Spara tillstånd lokalt
                localStorage.setItem(targetId, newState);
            }
        });
        
        // Hantera Esc för att stänga modal
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                closeModal(editModal);
                closeModal(viewModal);
                closeModal(confirmModal);
            }
        });
        
        // 3. Starta datalyssnare direkt (ingen inloggning krävs)
        setupAuditLogListener(); 
        setupRealtimeListener();

    } catch (e) {
        console.error("App Initialization Error:", e);
        // Fallback om Firebase misslyckas
        const statusElement = document.getElementById('sync-status');
        if (statusElement) {
           statusElement.textContent = "FEL: Initieringsfel!";
           statusElement.className = 'sync-status sync-error';
        }
        initialLoader.style.display = 'none';
    }
});
