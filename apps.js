import { initializeApp } from 'https://www.gstatic.com/firebasejs/9.6.1/firebase-app.js';
import { getFirestore, collection, doc, setDoc, deleteDoc, onSnapshot } from 'https://www.gstatic.com/firebasejs/9.6.1/firebase-firestore.js';

// FIREBASE KONFIGURATION (Placeholder-värden)
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

// Initialisera Firebase och Firestore
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const articlesCollection = collection(db, "articles");

// Globala variabler för data och filter
let articles = [];
let currentSearchQuery = '';
let currentStatusFilter = '';
let currentSupplierFilter = '';
let searchHistory = JSON.parse(localStorage.getItem('searchHistory')) || [];

// DOM-element
const articleList = document.getElementById('article-list');
const initialLoader = document.getElementById('initial-loader');
const addEditModal = document.getElementById('add-edit-modal');
const articleForm = document.getElementById('article-form');
const searchInput = document.getElementById('search-input');
const statusFiltersContainer = document.getElementById('status-filters');
const supplierFiltersContainer = document.getElementById('supplier-filters');
const searchHistoryContainer = document.getElementById('search-history');


// =======================================================
// --- NYA FUNKTIONER FÖR TOOLBAR OCH STATUS ---
// =======================================================

/**
 * Uppdaterar synkroniseringsstatusen i toolbaren med ikon och text.
 * @param {string} status - 'connecting', 'synced', eller 'error'.
 * @param {string} message - Meddelandet att visa.
 */
function updateSyncStatus(status, message) {
    const statusDiv = document.getElementById('sync-status');
    const messageSpan = document.getElementById('sync-message');
    const iconSvg = document.getElementById('sync-icon');
    
    if (statusDiv) {
        statusDiv.classList.remove('status-connecting', 'status-synced', 'status-error');
        statusDiv.classList.add(`status-${status}`);
    }
    
    if (messageSpan) {
        messageSpan.textContent = message;
    }

    if (iconSvg) {
        let path = '';
        let title = '';
        if (status === 'connecting') {
            // Ikon för anslutning/laddning (Återställningspilar)
            path = 'M12 4V1L8 5l4 4V6c3.31 0 6 2.69 6 6 0 1.01-.25 1.97-.7 2.8L18.33 16C18.77 15.02 19 14.04 19 13c0-3.87-3.13-7-7-7zM6.71 8.23l1.41 1.41C7.79 10.46 7 11.66 7 13c0 3.87 3.13 7 7 7v3l4-4-4-4v3c-3.31 0-6-2.69-6-6 0-.82.17-1.61.49-2.35z';
            title = 'Ansluter till databasen...';
        } else if (status === 'synced') {
            // Ikon för klar/synkad (bock)
            path = 'M9 16.2L4.8 12l-1.4 1.4L9 19 21 7l-1.4-1.4L9 16.2z'; 
            title = 'Databas synkroniserad.';
        } else if (status === 'error') {
            // Ikon för fel (utropstecken)
            path = 'M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z';
            title = 'Synkroniseringsfel! Se konsolen.';
        }
        iconSvg.innerHTML = `<path d="${path}"/>`;
        statusDiv.setAttribute('title', title);
    }
}

/**
 * Uppdaterar temaväxlingsknappens ikon baserat på det aktuella temat.
 * @param {boolean} isDarkMode - True om dark mode är aktivt.
 */
function updateThemeToggleIcon(isDarkMode) {
    const themeToggle = document.getElementById('theme-toggle');
    if (themeToggle) {
        const iconSvg = themeToggle.querySelector('svg');
        if (iconSvg) {
            let path = '';
            if (isDarkMode) {
                // Måne (Dark Mode)
                path = 'M12 3a9 9 0 109 9 9 9 0 00-9-9zM4.64 15.93a7.5 7.5 0 0011.72-7.89 8.95 8.95 0 01-1.57-2.85 9 9 0 10-10.15 10.74z'; 
                themeToggle.setAttribute('title', 'Växla till ljust tema');
            } else {
                // Sol (Light Mode)
                path = 'M12 18.75a6.75 6.75 0 100-13.5 6.75 6.75 0 000 13.5zM12 21a.75.75 0 01-.75-.75V17a.75.75 0 011.5 0v3.25a.75.75 0 01-.75.75zM12 3a.75.75 0 01-.75-.75V.75a.75.75 0 011.5 0v1.5A.75.75 0 0112 3zM21.25 12a.75.75 0 01-.75.75h-1.5a.75.75 0 010-1.5h1.5a.75.75 0 01.75.75zM3.5 12a.75.75 0 01-.75.75H1.25a.75.75 0 010-1.5h1.5a.75.75 0 01.75.75zM18.89 5.84a.75.75 0 01-.53.22h-.03a.75.75 0 01-.53-.22L16.2 4.14a.75.75 0 011.06-1.06l1.62 1.62a.75.75 0 01.22.53.75.75 0 01-.22.53zM5.11 18.16a.75.75 0 01-.53.22h-.03a.75.75 0 01-.53-.22L2.4 16.54a.75.75 0 111.06-1.06l1.62 1.62a.75.75 0 01.22.53.75.75 0 01-.22.53zM18.89 18.16a.75.75 0 01-.53.22h-.03a.75.75 0 01-.53-.22L16.2 16.54a.75.75 0 111.06-1.06l1.62 1.62a.75.75 0 01.22.53.75.75 0 01-.22.53zM5.11 5.84a.75.75 0 01-.53.22h-.03a.75.75 0 01-.53-.22L2.4 4.14a.75.75 0 011.06-1.06l1.62 1.62a.75.75 0 01.22.53.75.75 0 01-.22.53z';
                themeToggle.setAttribute('title', 'Växla till mörkt tema');
            }
            iconSvg.innerHTML = `<path d="${path}"/>`;
        }
    }
}

// =======================================================
// --- KÄRNFUNKTIONER (CRUD, RENDERERING, FILTER) ---
// =======================================================

// Lagrar data i Firebase
async function saveArticle(articleData, id = null) {
    try {
        if (id) {
            await setDoc(doc(db, "articles", id), articleData, { merge: true });
            console.log("Artikel uppdaterad med ID: ", id);
        } else {
            const newDocRef = doc(articlesCollection);
            await setDoc(newDocRef, { ...articleData, id: newDocRef.id });
            console.log("Ny artikel tillagd med ID: ", newDocRef.id);
        }
        toggleAddForm(false);
    } catch (e) {
        console.error("Fel vid sparande av dokument: ", e);
        alert("Ett fel inträffade vid sparande.");
    }
}

// Tar bort data från Firebase
async function deleteArticle(id) {
    try {
        await deleteDoc(doc(db, "articles", id));
        console.log("Artikel borttagen med ID: ", id);
    } catch (e) {
        console.error("Fel vid borttagning av dokument: ", e);
        alert("Ett fel inträffade vid borttagning.");
    }
}

// Rendera en enskild artikelkort
function renderArticleCard(article) {
    // Skapa prisjämförelse HTML
    const pricesHtml = article.prices ? article.prices.map((price, index) => {
        if (!price.store || !price.amount) return ''; // Hoppa över om butik/pris saknas

        const priceDisplay = price.amount.toFixed(2).replace('.', ',') + ' kr';
        const linkHtml = price.link ? 
            `<a href="#" data-link="${price.link}" class="price-link view-link" title="Öppna produktsidan i popup">${price.store}</a>` :
            `<span>${price.store}</span>`;
            
        return `
            <div class="price-item">
                ${linkHtml}
                <span>${priceDisplay}</span>
            </div>
        `;
    }).join('') : '';

    const card = document.createElement('div');
    card.className = 'article-card';
    card.setAttribute('data-id', article.id);
    card.innerHTML = `
        <h3>${article.name}</h3>
        <div class="card-info">
            <div><span>Leverantör:</span> <strong>${article.supplier}</strong></div>
            <div><span>Lagersaldo:</span> <strong>${article.quantity} st</strong></div>
            <div><span>Status:</span> <span class="status status-${article.status}">${article.status}</span></div>
            ${article.lastUpdated ? `<div><span>Uppdaterad:</span> <span>${new Date(article.lastUpdated).toLocaleDateString('sv-SE')}</span></div>` : ''}
        </div>
        ${pricesHtml ? `
            <div class="price-comparison">
                <h4>Prisjämförelse</h4>
                ${pricesHtml}
            </div>
        ` : ''}
        <div class="card-actions">
            <button class="btn btn-secondary edit-btn">Redigera</button>
            <button class="btn btn-danger delete-btn">Ta bort</button>
        </div>
    `;

    // Lägg till eventlyssnare för Redigera och Ta bort
    card.querySelector('.edit-btn').addEventListener('click', () => editArticle(article.id));
    card.querySelector('.delete-btn').addEventListener('click', () => confirmDelete(article.id, article.name));
    
    // Lägg till eventlyssnare för länkar
    card.querySelectorAll('.view-link').forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const url = link.getAttribute('data-link');
            if (url) {
                openProductPopup(url);
            }
        });
    });

    return card;
}

// Huvudrenderfunktion som filtrerar och visar listan
function renderArticleList() {
    // 1. Filtrering
    const filteredArticles = articles.filter(article => {
        const matchesSearch = !currentSearchQuery || 
                              article.name.toLowerCase().includes(currentSearchQuery.toLowerCase()) ||
                              article.supplier.toLowerCase().includes(currentSearchQuery.toLowerCase());
        
        const matchesStatus = !currentStatusFilter || article.status === currentStatusFilter;
        
        const matchesSupplier = !currentSupplierFilter || article.supplier === currentSupplierFilter;

        return matchesSearch && matchesStatus && matchesSupplier;
    });

    // 2. Töm listan och lägg till nya kort
    articleList.innerHTML = '';
    if (filteredArticles.length === 0) {
        articleList.innerHTML = '<p style="text-align: center; grid-column: 1 / -1; margin-top: 30px; color: var(--text-light);">Hittade inga artiklar som matchar filtren.</p>';
    } else {
        filteredArticles.forEach(article => {
            articleList.appendChild(renderArticleCard(article));
        });
    }
}

// Filtrerar listan baserat på aktuell sökning och filter
function applySearchFilter() {
    currentSearchQuery = searchInput.value.trim();
    savePersistentState();
    renderArticleList();
}

// Hanterar formulärets visning och döljning
function toggleAddForm(show, articleId = null) {
    const modalTitle = document.getElementById('modal-title');
    const saveButton = articleForm.querySelector('button[type="submit"]');
    
    // Dölj/Visa
    if (show) {
        addEditModal.style.display = 'block';
        addEditModal.style.opacity = 1;
        // Återställ formulär
        articleForm.reset();
        document.getElementById('article-id').value = '';
        document.getElementById('edit-fields').style.display = 'none';

        if (articleId) {
            modalTitle.textContent = 'Redigera artikel';
            saveButton.textContent = 'Spara Ändringar';
            // Fyll i formuläret med befintlig data
            const article = articles.find(a => a.id === articleId);
            if (article) {
                document.getElementById('article-id').value = article.id;
                document.getElementById('name').value = article.name;
                document.getElementById('supplier').value = article.supplier;
                document.getElementById('quantity').value = article.quantity;
                document.getElementById('status').value = article.status;

                // Fyll i prisdata. I denna version fyller vi bara i det första priset.
                if (article.prices && article.prices[0]) {
                    document.getElementById('link').value = article.prices[0].link || '';
                    document.getElementById('price-store-1').value = article.prices[0].store || '';
                    document.getElementById('price-amount-1').value = article.prices[0].amount || '';
                }
            }
        } else {
            modalTitle.textContent = 'Lägg till ny artikel';
            saveButton.textContent = 'Spara Artikel';
        }

    } else {
        addEditModal.style.opacity = 0;
        setTimeout(() => {
            addEditModal.style.display = 'none';
        }, 300);
    }
}

// Redigeringsfunktion
function editArticle(id) {
    toggleAddForm(true, id);
}

// =======================================================
// --- EXPORT/IMPORT OCH TEMA FUNKTIONER ---
// =======================================================

// Ladda ner artiklar som JSON
function handleDownloadJSON() {
    const dataStr = JSON.stringify(articles, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    
    const exportFileDefaultName = 'lagerdata.json';
    
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
    console.log("JSON-data nedladdad.");
}

// Ladda upp artiklar från JSON (simulerad)
function handleUploadJSON() {
    alert("Funktionen för att ladda upp JSON är simulerad i denna demo. I en riktig app skulle en filväljare öppnas och datan skulle valideras och laddas upp till Firebase.");
    // I en riktig app skulle du:
    // 1. Skapa en dold filinput.
    // 2. Klicka på den via JS.
    // 3. Lyssna på 'change' eventet.
    // 4. Läsa filen.
    // 5. Parsa JSON och ladda upp till Firebase.
}

// Tema-hantering
function toggleTheme() {
    document.body.classList.toggle('dark-mode');
    const isDarkMode = document.body.classList.contains('dark-mode');
    localStorage.setItem('theme', isDarkMode ? 'dark' : 'light');
}

function checkTheme() {
    if (localStorage.getItem('theme') === 'dark') {
        document.body.classList.add('dark-mode');
    }
}

// =======================================================
// --- LISTENERS OCH INITIALISERING ---
// =======================================================

function initializeListeners() {
    
    // --- NYA TOOLBAR-LISTENERS ---

    // 1. Integrera "Lägg till ny artikel" knappen (koppla till den nya toolbar-knappen)
    const toolbarAddButton = document.getElementById('toolbar-add-btn');
    if (toolbarAddButton) {
        toolbarAddButton.addEventListener('click', (e) => {
            e.preventDefault();
            toggleAddForm(true); 
        });
    }

    // 2. Logik för Inställningar Dropdown (Kugghjulet)
    const settingsBtn = document.getElementById('settings-btn');
    const settingsDropdown = document.getElementById('settings-dropdown-menu');
    
    if (settingsBtn && settingsDropdown) {
        settingsBtn.addEventListener('click', (e) => {
            e.stopPropagation(); 
            settingsDropdown.classList.toggle('show');
        });

        // Stäng dropdown när man klickar utanför
        document.addEventListener('click', (e) => {
            if (settingsDropdown.classList.contains('show') && !settingsBtn.contains(e.target) && !settingsDropdown.contains(e.target)) {
                settingsDropdown.classList.remove('show');
            }
        });
        
        // 3. Koppla JSON-funktionerna
        const downloadJsonBtn = document.getElementById('download-json-btn');
        const uploadJsonBtn = document.getElementById('upload-json-btn');
        
        if (downloadJsonBtn) {
            downloadJsonBtn.addEventListener('click', () => {
                settingsDropdown.classList.remove('show');
                handleDownloadJSON(); 
            });
        }

        if (uploadJsonBtn) {
            uploadJsonBtn.addEventListener('click', () => {
                settingsDropdown.classList.remove('show');
                handleUploadJSON(); 
            });
        }
    }

    // 4. Lägg till listener för tema-knappen och uppdatera dess ikon
    const themeToggleBtn = document.getElementById('theme-toggle');
    if (themeToggleBtn) {
        themeToggleBtn.addEventListener('click', () => {
            toggleTheme(); 
            const isDarkMode = document.body.classList.contains('dark-mode');
            updateThemeToggleIcon(isDarkMode);
        });
    }

    // --- BEFINTLIGA LISTENERS ---

    // Sökfunktionalitet
    searchInput.addEventListener('input', () => {
        applySearchFilter();
    });

    // Lyssna på formulärinlämning
    articleForm.addEventListener('submit', handleFormSubmit);

    // Lyssna på stängningsknappar i modalen
    addEditModal.querySelector('.close-btn').addEventListener('click', () => toggleAddForm(false));
    window.addEventListener('click', (e) => {
        if (e.target === addEditModal) {
            toggleAddForm(false);
        }
    });

    // Lyssna på Status filter
    statusFiltersContainer.addEventListener('click', (e) => {
        if (e.target.tagName === 'BUTTON') {
            const newFilter = e.target.getAttribute('data-filter-status') || '';
            if (currentStatusFilter !== newFilter) {
                currentStatusFilter = newFilter;
                
                // Hantera visuell aktiv status
                statusFiltersContainer.querySelectorAll('button').forEach(btn => btn.classList.remove('active'));
                e.target.classList.add('active');
                
                // Rendera om listan
                renderArticleList();
                savePersistentState();
            }
        }
    });
    
    // Lyssna på Leverantörsfilter (dynamiskt innehåll)
    supplierFiltersContainer.addEventListener('click', (e) => {
        if (e.target.tagName === 'BUTTON') {
            const newFilter = e.target.getAttribute('data-filter-supplier') || '';
            if (currentSupplierFilter !== newFilter) {
                currentSupplierFilter = newFilter;
                
                // Hantera visuell aktiv status
                supplierFiltersContainer.querySelectorAll('button').forEach(btn => btn.classList.remove('active'));
                e.target.classList.add('active');
                
                // Rendera om listan
                renderArticleList();
                savePersistentState();
            }
        }
    });

    // Lyssna på sök historik taggar
    searchHistoryContainer.addEventListener('click', (e) => {
        if (e.target.tagName === 'SPAN') {
            const term = e.target.textContent;
            searchInput.value = term;
            applySearchFilter();
        } else if (e.target.tagName === 'BUTTON') {
            const tag = e.target.closest('.search-history-tag');
            const term = tag.querySelector('span').textContent;
            removeSearchHistory(term);
        }
    });

    // Hantera kollapsning av grupper
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

    // Tillbaka till toppen-knappen
    const backToTopBtn = document.getElementById('back-to-top-btn');
    window.addEventListener('scroll', () => {
        if (document.body.scrollTop > 300 || document.documentElement.scrollTop > 300) {
            backToTopBtn.style.display = "flex";
        } else {
            backToTopBtn.style.display = "none";
        }
    });

    backToTopBtn.addEventListener('click', () => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    });

}

// Skickar formuläret till Firebase
async function handleFormSubmit(e) {
    e.preventDefault();
    
    const id = document.getElementById('article-id').value || null;
    const name = document.getElementById('name').value;
    const supplier = document.getElementById('supplier').value;
    const quantity = parseInt(document.getElementById('quantity').value);
    const status = document.getElementById('status').value;
    const link = document.getElementById('link').value.trim();
    const priceStore1 = document.getElementById('price-store-1').value.trim();
    const priceAmount1 = parseFloat(document.getElementById('price-amount-1').value) || null;

    if (currentSearchQuery) {
        addSearchHistory(currentSearchQuery);
    }
    
    // Hantera prisobjekt
    const prices = [];
    if (priceStore1 && priceAmount1 !== null) {
        prices.push({
            store: priceStore1,
            amount: priceAmount1,
            link: link
        });
    }

    const articleData = {
        name,
        supplier,
        quantity,
        status,
        prices,
        lastUpdated: Date.now()
    };
    
    // Tar bort priser om arrayen är tom för att undvika onödig data
    if (prices.length === 0) {
        delete articleData.prices;
    }

    // Lägg till/Uppdatera
    await saveArticle(articleData, id);
    articleForm.reset();
}

// =======================================================
// --- HJÄLPFUNKTIONER (PRISER, HISTORIK, PERSISTENS) ---
// =======================================================

// Rendera dynamiska leverantörsfilter
function renderSupplierFilters() {
    const suppliers = [...new Set(articles.map(a => a.supplier))].sort();
    
    let buttonsHtml = '<button data-filter-supplier="" class="btn-secondary ' + (!currentSupplierFilter ? 'active' : '') + '">Alla Leverantörer</button>';
    
    suppliers.forEach(supplier => {
        const isActive = currentSupplierFilter === supplier ? 'active' : '';
        buttonsHtml += `<button data-filter-supplier="${supplier}" class="btn-secondary ${isActive}">${supplier}</button>`;
    });

    supplierFiltersContainer.innerHTML = buttonsHtml;
    
    // Se till att den aktiva statusen på Status-filter också är korrekt satt
    statusFiltersContainer.querySelectorAll('button').forEach(btn => {
        const filterValue = btn.getAttribute('data-filter-status') || '';
        btn.classList.toggle('active', filterValue === currentStatusFilter);
    });
}

// Hanterar persistent sök/filter-tillstånd
function savePersistentState() {
    const state = {
        search: currentSearchQuery,
        statusFilter: currentStatusFilter,
        supplierFilter: currentSupplierFilter
    };
    localStorage.setItem('article_app_state', JSON.stringify(state));
}

function loadPersistentState() {
    const state = JSON.parse(localStorage.getItem('article_app_state'));
    if (state) {
        currentSearchQuery = state.search || '';
        currentStatusFilter = state.statusFilter || '';
        currentSupplierFilter = state.supplierFilter || '';
        searchInput.value = currentSearchQuery;
    }
}

// Hanterar sök historik
function addSearchHistory(term) {
    term = term.trim();
    if (!term || searchHistory.includes(term)) return;
    
    searchHistory.unshift(term);
    if (searchHistory.length > 5) { // Behåll max 5 söktermer
        searchHistory.pop();
    }
    localStorage.setItem('searchHistory', JSON.stringify(searchHistory));
    renderSearchHistory();
}

function removeSearchHistory(term) {
    searchHistory = searchHistory.filter(t => t !== term);
    localStorage.setItem('searchHistory', JSON.stringify(searchHistory));
    renderSearchHistory();
}

function renderSearchHistory() {
    searchHistoryContainer.innerHTML = '';
    searchHistory.forEach(term => {
        const tag = document.createElement('div');
        tag.className = 'search-history-tag';
        tag.innerHTML = `<span>${term}</span><button type="button">&times;</button>`;
        searchHistoryContainer.appendChild(tag);
    });
}

// Hantera bekräftelsemodal för borttagning
function confirmDelete(id, name) {
    const modal = document.getElementById('confirmationModal');
    document.getElementById('confirmationTitle').textContent = `Bekräfta borttagning`;
    document.getElementById('confirmationMessage').innerHTML = `Är du säker på att du vill ta bort artikeln: <strong>${name}</strong>?`;
    
    modal.style.display = 'block';

    const confirmYes = document.getElementById('confirmYes');
    const confirmNo = document.getElementById('confirmNo');

    // Rensa gamla lyssnare
    const newConfirmYes = confirmYes.cloneNode(true);
    confirmYes.parentNode.replaceChild(newConfirmYes, confirmYes);

    const newConfirmNo = confirmNo.cloneNode(true);
    confirmNo.parentNode.replaceChild(newConfirmNo, confirmNo);

    // Lägg till nya lyssnare
    newConfirmYes.addEventListener('click', async () => {
        modal.style.display = 'none';
        await deleteArticle(id);
    });

    newConfirmNo.addEventListener('click', () => {
        modal.style.display = 'none';
    });
    
    // Stäng vid klick utanför
    window.addEventListener('click', (e) => {
        if (e.target === modal) {
            modal.style.display = 'none';
        }
    });
}

// Öppna produktsidan i iframe popup
function openProductPopup(url) {
    const popup = document.getElementById('productPopup');
    const iframe = document.getElementById('productIframe');
    
    iframe.src = url;
    popup.style.display = 'block';

    // Stängningslogik
    popup.querySelector('.close-btn').onclick = () => {
        popup.style.display = 'none';
        iframe.src = ''; // Rensa iframe-källan
    };
}

// Hantera collapse-status
function initializeCollapseState() {
    document.querySelectorAll('.collapsible-header').forEach(header => {
        const savedState = localStorage.getItem(header.id); 
        const wrapperId = header.id.replace('-titel', '-wrapper'); 
        const wrapper = document.getElementById(wrapperId);
        
        if (savedState === 'closed') { 
            header.setAttribute('data-state', 'closed'); 
            if (wrapper) { wrapper.classList.add('collapsed'); } 
        } else {
            // Se till att standardtillståndet är 'open' om inget sparat
            header.setAttribute('data-state', 'open');
            if (wrapper) { wrapper.classList.remove('collapsed'); } 
        }
    });
}

// Anslutning till Firebase (Realtime Listener)
function setupRealtimeListener() {
    const unsubscribe = onSnapshot(articlesCollection, (snapshot) => {
        // Uppdatera den globala arrayen
        articles = snapshot.docs.map(doc => ({
            ...doc.data(),
            id: doc.id
        })).sort((a, b) => a.name.localeCompare(b.name, 'sv', { sensitivity: 'base' }));

        // 1. Rendera allt
        renderSupplierFilters(); // Uppdatera leverantörsfilter baserat på ny data
        renderArticleList();     // Filtrera och rendera listan
        
        // 2. Uppdatera status
        updateSyncStatus('synced', 'Synkroniserad');
        
        // 3. Dölj laddaren
        if(initialLoader) initialLoader.classList.add('hidden');

    }, (error) => {
        console.error("Firestore lyssningsfel:", error);
        updateSyncStatus('error', 'Synkroniseringsfel!');
        if(initialLoader) {
            initialLoader.querySelector('p').textContent = 'Kunde inte ladda data.';
            initialLoader.classList.remove('hidden'); // Visa felet
        }
    });
    
    // Returnera unsubscribe-funktionen om du behöver sluta lyssna senare
    return unsubscribe; 
}


// Huvudfunktion som körs när DOM är laddad
document.addEventListener('DOMContentLoaded', () => {
    try {
        // KÖR ALLT I ORDNING
        checkTheme(); 
        updateThemeToggleIcon(document.body.classList.contains('dark-mode')); // NYTT: Sätt korrekt ikon
        updateSyncStatus('connecting', 'Ansluter...'); 
        initializeCollapseState();
        loadPersistentState(); 
        renderSearchHistory(); // Rendera historiken baserat på laddat tillstånd
        initializeListeners(); 
        
        // Starta databaslyssnaren
        setupRealtimeListener(); 

    } catch (e) {
        console.error("App Initialization Error:", e);
        updateSyncStatus('error', 'Initieringsfel!'); 
        if(initialLoader) initialLoader.querySelector('p').textContent = 'Kritiskt fel vid initiering.';
    }
});
