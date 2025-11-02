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

// Initialisera Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const inventoryCollection = collection(db, "inventory");

// Globala variabler
let inventoryData = [];
let filteredInventory = [];
let searchHistory = [];
let globalUnsubscribe = null;
let currentSortColumn = 'name';
let currentSortDirection = 'asc';
let currentCategoryFilter = 'Alla';
let currentStatusFilter = 'Alla';
let currentSearchTerm = '';
let currentViewMode = localStorage.getItem('viewMode') || 'list'; // 'list' eller 'grid'

// DOM-element
const inventoryList = document.getElementById('inventory-list');
const searchInput = document.getElementById('search-input');
const clearSearchBtn = document.getElementById('clear-search-btn');
const categoryFilter = document.getElementById('category-filter');
const statusFilter = document.getElementById('status-filter');
const sortButtons = document.querySelectorAll('.sort-btn');
const listModeBtn = document.getElementById('list-mode-btn');
const gridModeBtn = document.getElementById('grid-mode-btn');
const totalItemsDisplay = document.getElementById('total-items');
const filteredItemsDisplay = document.getElementById('filtered-items');
const addItemForm = document.getElementById('add-item-form');
const editItemForm = document.getElementById('edit-item-form');
const editModal = document.getElementById('editModal');
const initialLoader = document.getElementById('initial-loader');
const syncStatusDisplay = document.getElementById('sync-status');
const jsonExportBtn = document.getElementById('json-export-btn');
const jsonImportBtn = document.getElementById('json-import-btn');
const fileInput = document.getElementById('file-input');
const pwaInstallBtn = document.getElementById('pwa-install-btn');
const themeSwitcher = document.querySelector('.theme-switcher button'); // Selektor för temaväxlingsknappen

// Global sökning element (NYTT/FIXAT)
const globalSearchInput = document.getElementById('global-search-input');
const globalSearchBtn = document.getElementById('global-search-btn');


// --- HJÄLPFUNKTIONER ---

/**
 * Global sökfunktion. Öppnar en ny flik för att söka efter ett artikelnummer.
 * Kan anropas utan argument (använder #global-search-input) eller med en specifik query (från ikon-klick).
 */
function handleGlobalSearch(queryOverride = null) {
    const query = queryOverride || (globalSearchInput ? globalSearchInput.value.trim() : '');

    if (query) {
        // Externa sökningen: Ändra URL till din önskade sökleverantör om du vill.
        const searchUrl = `https://www.google.com/search?q=${encodeURIComponent(query)}`;
        window.open(searchUrl, '_blank');

        // Valfritt: Rensa sökfältet efter sökning (om det inte var ett override)
        if (!queryOverride && globalSearchInput) {
            globalSearchInput.value = '';
        }
    }
}


/**
 * Genererar HTML för artikelnummer-cellen, inklusive Sök- och Kopieringsikon (NYTT).
 * OBS! copyToClipboard() måste vara definierad någonstans i apps.js.
 */
function getServiceFilterCellHtml(item) {
    // HTML för Kopieringsknappen (använder en standard SVG-ikon för att kopiera)
    const copyBtnHTML = `<button class="copy-btn" onclick="copyToClipboard('${item.service_filter}'); event.stopPropagation();" title="Kopiera artikelnummer">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" style="width: 1em; height: 1em;">
            <path fill-rule="evenodd" d="M7 6V5a2 2 0 0 1 2-2h6a2 2 0 0 1 2 2v6a2 2 0 0 1-2 2h-1V9a2 2 0 0 0-2-2H7Zm-2 3v8a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2H7a2 2 0 0 0-2 2Z" clip-rule="evenodd"/>
        </svg>
    </button>`;

    // HTML för Sökknappen (använder den nya handleGlobalSearch-funktionen)
    const searchIconHTML = `<button class="search-btn-in-row" onclick="handleGlobalSearch('${item.service_filter}'); event.stopPropagation();" title="Sök externt">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" width="16" height="16" fill="currentColor" style="width: 1em; height: 1em;">
            <path d="M11.742 10.344a6.5 6.5 0 1 0-1.397 1.398h-.001c.03.04.062.078.098.115l3.85 3.85a1 1 0 0 0 1.415-1.414l-3.85-3.85a1.007 1.007 0 0 0-.115-.1z"/>
        </svg>
    </button>`;

    // Ordnar elementen: Sökikon, Kopieringsikon, Artikelnummertext
    return `<span class="service-filter-cell">
        ${searchIconHTML}
        ${copyBtnHTML}
        <span class="service-filter-text">${item.service_filter}</span>
    </span>`;
}


function renderInventoryItem(item) {
    const isGrid = currentViewMode === 'grid';
    const isLow = item.quantity <= 1;
    const isOut = item.quantity === 0;

    let html = `<div class="item-row ${currentViewMode}-item ${isLow ? 'low-stock' : ''} ${isOut ? 'out-of-stock' : ''}" data-id="${item.id}" onclick="openEditModal('${item.id}')">`;

    if (isGrid) {
        html += `<div class="grid-card">`;
        html += `<h3 class="grid-name">${item.name}</h3>`;
        html += `<p class="grid-service-filter">${getServiceFilterCellHtml(item)}</p>`; // UPPDATERAD
        html += `<p class="grid-quantity">Antal: <span>${item.quantity}</span></p>`;
        html += `<p class="grid-category">Kategori: ${item.category}</p>`;
        html += `<p class="grid-location">Plats: ${item.location}</p>`;
        html += `<p class="grid-status ${item.status}">${item.status}</p>`;
        html += `</div>`;
    } else {
        html += `<div class="cell name">${item.name}</div>`;
        html += `<div class="cell service-filter">${getServiceFilterCellHtml(item)}</div>`; // UPPDATERAD
        html += `<div class="cell quantity ${isLow ? 'low' : ''} ${isOut ? 'out' : ''}">${item.quantity}</div>`;
        html += `<div class="cell category">${item.category}</div>`;
        html += `<div class="cell location">${item.location}</div>`;
        html += `<div class="cell status ${item.status}">${item.status}</div>`;
        html += `<div class="cell link-cell">${generateAeroMLink(item)}</div>`;
        html += `<div class="cell action-cell">`;
        html += `<button class="btn-icon btn-danger" onclick="confirmAndDelete('${item.id}', event)" title="Ta bort artikel">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M8.75 1A2.75 2.75 0 0 0 6 3.75v.42a.75.75 0 0 1-1.5 0v-.42A4.25 4.25 0 0 1 9.75 2h.5A4.25 4.25 0 0 1 15 3.75v.42a.75.75 0 0 1-1.5 0v-.42A2.75 2.75 0 0 0 11.25 1h-2.5Zm-1.5 5.5a.75.75 0 0 1 .75.75v9a.75.75 0 0 1-1.5 0v-9a.75.75 0 0 1 .75-.75Zm3.75-.75a.75.75 0 0 0-1.5 0v9a.75.75 0 0 0 1.5 0v-9Z" clip-rule="evenodd"/></svg>
                 </button>`;
        html += `</div>`;
    }

    html += `</div>`;
    return html;
}

// ... resten av din apps.js kod ...

function initializeListeners() {
    // Sökfält
    searchInput.addEventListener('input', applySearchFilter);
    clearSearchBtn.addEventListener('click', () => {
        searchInput.value = '';
        applySearchFilter();
        clearSearchBtn.style.display = 'none';
    });

    // --- NYTT/FIXAT: Global sökning/Jämför (Artikelnummer) ---
    if (globalSearchBtn && globalSearchInput) {
        // 1. Lyssna på klick på knappen
        globalSearchBtn.addEventListener('click', () => {
            handleGlobalSearch();
        });

        // 2. Lyssna på Enter-tryck i sökfältet
        globalSearchInput.addEventListener('keydown', (event) => {
            if (event.key === 'Enter') {
                event.preventDefault(); // Förhindra formulärsubmit
                handleGlobalSearch();
            }
        });
    }

    // Filter
    categoryFilter.addEventListener('change', (e) => {
        currentCategoryFilter = e.target.value;
        localStorage.setItem('categoryFilter', currentCategoryFilter);
        applySearchFilter();
    });
    statusFilter.addEventListener('change', (e) => {
        currentStatusFilter = e.target.value;
        localStorage.setItem('statusFilter', currentStatusFilter);
        applySearchFilter();
    });

    // Sortering
    sortButtons.forEach(btn => {
        btn.addEventListener('click', handleSortClick);
    });

    // Vy
    listModeBtn.addEventListener('click', () => setViewMode('list'));
    gridModeBtn.addEventListener('click', () => setViewMode('grid'));

    // Lägg till formulär
    addItemForm.addEventListener('submit', handleAddItem);

    // Redigera formulär
    editItemForm.addEventListener('submit', handleEditItem);

    // Modal stängning
    document.querySelector('.close-btn').addEventListener('click', () => editModal.style.display = 'none');
    window.addEventListener('click', (e) => {
        if (e.target === editModal) {
            editModal.style.display = 'none';
        }
    });

    // Rensa söklogg
    const clearHistoryBtn = document.getElementById('clear-history-btn');
    if (clearHistoryBtn) {
        clearHistoryBtn.addEventListener('click', clearSearchHistory);
    }
    
    // JSON Import/Export
    jsonExportBtn.addEventListener('click', exportToJSON);
    jsonImportBtn.addEventListener('click', () => fileInput.click());
    fileInput.addEventListener('change', importFromJSON);

    // PWA Installation
    window.addEventListener('beforeinstallprompt', (e) => {
        deferredInstallPrompt = e;
        pwaInstallBtn.style.display = 'block';
    });
    pwaInstallBtn.addEventListener('click', installPWA);

    // Tillbaka till toppen
    const backToTopBtn = document.getElementById('back-to-top-btn');
    window.onscroll = () => {
        if (document.body.scrollTop > 200 || document.documentElement.scrollTop > 200) {
            backToTopBtn.style.display = "block";
        } else {
            backToTopBtn.style.display = "none";
        }
    };
    backToTopBtn.addEventListener('click', () => {
        document.body.scrollTop = 0; // För Safari
        document.documentElement.scrollTop = 0; // För Chrome, Firefox, IE och Opera
    });

    // Knapp för att lägga till ny artikel (FAB)
    const fabAddBtn = document.getElementById('fab-add-btn');
    if(fabAddBtn) {
        fabAddBtn.addEventListener('click', () => {
            const addFormWrapper = document.getElementById('add-form-wrapper');
            const header = document.getElementById('add-form-titel');
            if (addFormWrapper && header) {
                // Kontrollera om formen är dold/ihopfälld
                if (header.getAttribute('data-state') === 'closed' || addFormWrapper.classList.contains('collapsed')) {
                    toggleCollapse(header, addFormWrapper); // Visa formen
                }
                // Scrolla till formen
                addFormWrapper.scrollIntoView({ behavior: 'smooth' });
                // Fokusera första fältet
                document.getElementById('add-name').focus();
            }
        });
    }

    // Temaväxling
    if (themeSwitcher) {
        themeSwitcher.addEventListener('click', toggleTheme);
    }

    // Kollapsa/Expandera sektioner
    document.querySelectorAll('.collapsible-header').forEach(header => {
        header.addEventListener('click', (e) => {
            // Förhindra kollaps om man klickar på knapp/länk inuti
            if (e.target.closest('button, a')) return;

            const wrapperId = header.id.replace('-titel', '-wrapper');
            const wrapper = document.getElementById(wrapperId);
            if (wrapper) {
                toggleCollapse(header, wrapper);
            }
        });
    });

    // Eventlyssnare för att hantera klick på sökresultat i historiken
    document.getElementById('search-history').addEventListener('click', (e) => {
        if (e.target.classList.contains('history-item')) {
            const searchText = e.target.textContent.trim();
            searchInput.value = searchText;
            applySearchFilter();
            // Scrolla upp till sökfältet
            searchInput.scrollIntoView({ behavior: 'smooth' });
        } else if (e.target.classList.contains('remove-history-btn')) {
             const index = parseInt(e.target.dataset.index);
             removeSearchHistoryItem(index);
        }
    });

}

// ... resten av din apps.js kod ...
