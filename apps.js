import { initializeApp } from 'https://www.gstatic.com/firebasejs/11.6.1/firebase-app.js';
import { getAuth, signInAnonymously, signInWithCustomToken } from 'https://www.gstatic.com/firebasejs/11.6.1/firebase-auth.js';
import { getFirestore, doc, setDoc, deleteDoc, onSnapshot, collection, query, setLogLevel, getDoc } from 'https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js';

// Globala variabler för Canvas-miljön
const appId = typeof __app_id !== 'undefined' ? __app_id : 'default-app-id';
const firebaseConfig = typeof __firebase_config !== 'undefined' ? JSON.parse(__firebase_config) : {};
const initialAuthToken = typeof __initial_auth_token !== 'undefined' ? __initial_auth_token : null;

// FIREBASE INITIERING
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);
// setLogLevel('debug'); // Avkommentera för att se Firebase-loggar

// Globalt objekt för att hålla alla produkter
let products = {};
let userId = null;

// --- BAS FUNKTIONER FÖR DATABASEN ---

/**
 * Hämtar den korrekta sökvägen till Firestore-samlingen för inventering.
 * Använder en offentlig sökväg för enkelhet i detta exempel.
 * @returns {object} Firestore Collection Reference
 */
const getInventoryCollection = () => {
    // Sökväg för offentlig delning: /artifacts/{appId}/public/data/inventory
    return collection(db, 'artifacts', appId, 'public', 'data', 'inventory');
};

/**
 * Sparar eller uppdaterar en produkt.
 * @param {string} id - Dokument-ID.
 * @param {object} productData - Produktdata att spara.
 */
const saveProduct = async (id, productData) => {
    try {
        const docRef = doc(getInventoryCollection(), id);
        // Använd setDoc med merge: true för att uppdatera eller skapa
        await setDoc(docRef, productData, { merge: true });
        // Status uppdateras via onSnapshot, inget behov av att uppdatera UI direkt här
    } catch (e) {
        console.error("Fel vid sparande av produkt: ", e);
        showStatus("FEL: Kunde inte spara produkt!", 'var(--danger-color)');
    }
};

/**
 * Raderar en produkt.
 * @param {string} id - Dokument-ID.
 */
const deleteProduct = async (id) => {
    try {
        const docRef = doc(getInventoryCollection(), id);
        await deleteDoc(docRef);
        // Status uppdateras via onSnapshot
    } catch (e) {
        console.error("Fel vid radering av produkt: ", e);
        showStatus("FEL: Kunde inte radera produkt!", 'var(--danger-color)');
    }
};


// --- UI OCH HJÄLPFUNKTIONER ---

/**
 * Visar statusmeddelanden.
 * @param {string} message - Meddelandetext.
 * @param {string} color - CSS färg.
 */
const showStatus = (message, color = 'var(--text-dark)') => {
    const statusElement = document.getElementById('sync-status');
    if (statusElement) {
        statusElement.textContent = message;
        statusElement.style.color = color;
    }
};

/**
 * Konverterar en array av produktdata till en CSV-sträng.
 * @param {Array<object>} data - Listan med produkter.
 * @returns {string} CSV-data.
 */
const convertToCSV = (data) => {
    if (data.length === 0) return '';
    
    const headers = ["ID", "Namn", "Artikelnummer", "Antal", "Plats", "Kategori", "Anteckningar", "Länk"];
    const csvRows = [];
    
    // Lägg till headers
    csvRows.push(headers.join(';'));
    
    // Lägg till datarader
    for (const item of data) {
        const values = [
            item.id || '',
            item.name || '',
            item.articleNumber || '',
            item.count !== undefined ? item.count : '',
            item.location || '',
            item.category || '',
            item.notes || '',
            item.link || ''
        ];
        // Ersätt semikolon i strängar för att undvika problem (enkla citattecken behövs i en riktig CSV-lösning)
        csvRows.push(values.map(val => (typeof val === 'string' ? val.replace(/;/g, ',') : val)).join(';'));
    }

    return csvRows.join('\n');
};

/**
 * Renderar en enskild produkt som ett <li>-element.
 * @param {object} product - Produktobjektet.
 * @returns {string} HTML-sträng.
 */
const createProductListItem = (product) => {
    const { id, name, articleNumber, count, location, notes, link } = product;
    
    // Skapa en länk-knapp om det finns en länk
    const linkButton = link
        ? `<button class="action-btn link-btn" onclick="window.open('${link}', '_blank')">Länk</button>`
        : '';

    // Länk till Trodo: ersätter ALLT utom siffror och bokstäver med bindestreck.
    const trodoLink = `https://www.trodo.se/catalogsearch/result/?q=${articleNumber.replace(/[^a-zA-Z0-9]/g, '-')}`;
    
    // Länk till Aero M (Exempelartikel 06J115403A):
    const aeroMLink = `https://www.aero-m.se/search/?q=${articleNumber.replace(/[^a-zA-Z0-9]/g, '-')}`;

    // Visa popup-knappen används för att visa detaljer
    const showDetailsButton = `<button class="action-btn" data-id="${id}" onclick="showProductPopup('${id}')">Detaljer</button>`;

    return `
        <li data-id="${id}">
            <div class="item-info">
                <span class="item-name" title="${name}">${name}</span>
                <span class="item-count">${count} st</span>
                <span class="item-notes" title="${notes}">${notes || '—'}</span>
                <span class="item-notes" title="${location}">${location}</span>
            </div>
            <div class="item-actions">
                ${showDetailsButton}
                ${linkButton}
                <button class="external-link-btn trodo-btn" onclick="openExternalLink('${trodoLink}')">Trodo</button>
                <button class="external-link-btn aero-m-btn" onclick="openExternalLink('${aeroMLink}')">Aero M</button>
            </div>
        </li>
    `;
};
// Lägg till openExternalLink i globalt scope för att kunna kallas från onclick i HTML
window.openExternalLink = (url) => {
    window.open(url, '_blank');
};


/**
 * Uppdaterar lagerlistorna baserat på det globala products-objektet.
 * Renderar produkterna i sina respektive kategorier.
 */
const renderInventory = () => {
    const container = document.getElementById('inventoryContainer');
    if (!container) return;

    // Gruppera produkter efter kategori
    const categories = {
        'Service': [],
        'Motor/Chassi': [],
        'Andra Märken': []
    };

    Object.values(products).forEach(product => {
        if (categories[product.category]) {
            categories[product.category].push(product);
        } else {
            // Fallback för okända kategorier, läggs till i "Andra Märken"
            categories['Andra Märken'].push(product);
        }
    });
    
    // Sortera produkterna i varje kategori efter namn
    Object.keys(categories).forEach(cat => {
        categories[cat].sort((a, b) => a.name.localeCompare(b.name, 'sv'));
    });

    let html = '';
    // Skapa HTML-struktur för varje kategori
    Object.keys(categories).forEach(categoryName => {
        const categoryProducts = categories[categoryName];
        const categoryId = categoryName.replace(/[^a-zA-Z0-9]/g, '-').toLowerCase();

        // Hämta sparad collapse state
        const isCollapsed = localStorage.getItem(`${categoryId}-titel`) === 'closed';
        const collapseClass = isCollapsed ? 'collapsed' : '';
        const arrow = isCollapsed ? '&#9660;' : '^';

        html += `
            <div class="category-wrapper">
                <h2 id="${categoryId}-titel" class="collapsible-header" data-state="${isCollapsed ? 'closed' : 'open'}">
                    ${categoryName} (${categoryProducts.length})
                    <span id="${categoryId}-icon">${arrow}</span>
                </h2>
                <div id="${categoryId}-wrapper" class="collapsible-wrapper ${collapseClass}">
                    <ul class="item-list">
                        ${categoryProducts.map(createProductListItem).join('')}
                    </ul>
                </div>
            </div>
        `;
    });

    container.innerHTML = html;
};

/**
 * Filterfunktion som körs vid sökning/kategorifiltrering.
 */
const filterProducts = () => {
    const query = document.getElementById('searchQuery').value.toLowerCase();
    const category = document.getElementById('filterCategory').value;
    const searchResults = document.getElementById('searchResults');

    if (!query && !category) {
        searchResults.innerHTML = '';
        return;
    }

    const filteredProducts = Object.values(products).filter(product => {
        const matchesQuery = !query || product.name.toLowerCase().includes(query) || product.articleNumber.toLowerCase().includes(query);
        const matchesCategory = !category || product.category === category;
        return matchesQuery && matchesCategory;
    });
    
    // Sortera resultaten efter namn
    filteredProducts.sort((a, b) => a.name.localeCompare(b.name, 'sv'));

    if (filteredProducts.length > 0) {
        searchResults.innerHTML = `
            <div class="collapsible-header" style="background-color: #333; margin-top: 0; border-top-left-radius: 8px; border-top-right-radius: 8px;">
                Sökresultat (${filteredProducts.length})
            </div>
            ${filteredProducts.map(createProductListItem).join('')}
        `;
    } else {
        searchResults.innerHTML = `
            <div class="collapsible-header" style="background-color: #333; margin-top: 0; border-top-left-radius: 8px; border-top-right-radius: 8px;">
                Inget resultat hittades
            </div>
        `;
    }
};

/**
 * Visar/döljer en modal.
 * @param {string} modalId - ID för modalen.
 * @param {boolean} show - Sant för att visa, falskt för att dölja.
 */
const toggleModal = (modalId, show) => {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.style.display = show ? 'block' : 'none';
    }
};

/**
 * Visar bekräftelsedialogrutan.
 * @param {string} message - Meddelande att visa.
 * @returns {Promise<boolean>} Löser true vid "Ja", false vid "Avbryt".
 */
const showConfirmation = (message) => {
    return new Promise(resolve => {
        const modal = document.getElementById('confirmationModal');
        const msgEl = document.getElementById('confirmationMessage');
        const confirmYes = document.getElementById('confirmYes');
        const confirmNo = document.getElementById('confirmNo');

        msgEl.textContent = message;
        toggleModal('confirmationModal', true);

        // Rensa gamla lyssnare
        confirmYes.onclick = null;
        confirmNo.onclick = null;

        confirmYes.onclick = () => {
            toggleModal('confirmationModal', false);
            resolve(true);
        };
        confirmNo.onclick = () => {
            toggleModal('confirmationModal', false);
            resolve(false);
        };
        
        // Stäng även vid klick utanför eller på X
        modal.onclick = (event) => {
            if (event.target === modal) {
                toggleModal('confirmationModal', false);
                resolve(false);
            }
        };
    });
};

/**
 * Visar pop-up med detaljer för en produkt och sätter upp lyssnare för redigering/radering.
 * @param {string} id - Produkt-ID.
 */
window.showProductPopup = (id) => {
    const product = products[id];
    if (!product) return;

    document.getElementById('popup-name').textContent = product.name;
    document.getElementById('popup-articleNumber').textContent = product.articleNumber;
    document.getElementById('popup-count').textContent = product.count;
    document.getElementById('popup-location').textContent = product.location;
    document.getElementById('popup-category').textContent = product.category;
    document.getElementById('popup-notes').textContent = product.notes || 'Inga anteckningar';
    document.getElementById('popup-link').textContent = product.link || 'Ingen länk';

    // Rensa gamla lyssnare och sätt nya för Edit/Delete
    const editBtn = document.getElementById('popup-edit');
    const deleteBtn = document.getElementById('popup-delete');

    editBtn.onclick = () => {
        toggleModal('productPopup', false);
        openEditModal(id);
    };

    deleteBtn.onclick = async () => {
        toggleModal('productPopup', false);
        const confirmed = await showConfirmation(`Är du säker på att du vill radera produkten "${product.name}"?`);
        if (confirmed) {
            await deleteProduct(id);
            showStatus(`Produkten "${product.name}" raderades.`);
        }
    };
    
    // Visa modalen
    toggleModal('productPopup', true);
};

/**
 * Öppnar redigeringsmodalen med förifyllda data.
 * @param {string} id - Produkt-ID.
 */
const openEditModal = (id) => {
    const product = products[id];
    if (!product) return;

    document.getElementById('edit-id').value = id;
    document.getElementById('edit-name').value = product.name;
    document.getElementById('edit-articleNumber').value = product.articleNumber;
    document.getElementById('edit-count').value = product.count;
    document.getElementById('edit-location').value = product.location;
    document.getElementById('edit-category').value = product.category;
    document.getElementById('edit-notes').value = product.notes;
    document.getElementById('edit-link').value = product.link;

    toggleModal('editModal', true);
};

// --- INITIERING OCH LYSSNARE ---

/**
 * Ställer in realtidslyssnare på Firestore.
 */
const setupRealtimeListener = () => {
    if (!userId) {
         showStatus("FEL: Användar-ID saknas.", 'var(--danger-color)');
         return;
    }
    
    showStatus("Ansluter till lagerdatabasen...");
    
    // Använd onSnapshot för att få realtidsuppdateringar
    const q = query(getInventoryCollection());
    
    onSnapshot(q, (snapshot) => {
        snapshot.docChanges().forEach((change) => {
            const data = change.doc.data();
            const id = change.doc.id;
            
            // Hantera alla CRUD-operationer
            if (change.type === "added" || change.type === "modified") {
                products[id] = { id, ...data };
            } else if (change.type === "removed") {
                delete products[id];
            }
        });

        // Återrenderera UI efter varje ändring
        renderInventory();
        filterProducts(); // Uppdatera sökresultat om de visas
        showStatus(`Synkroniserad: ${Object.keys(products).length} produkter.`, 'var(--success-color)');
    }, (error) => {
        console.error("Firestore lyssnarfel: ", error);
        showStatus("FEL: Det gick inte att ansluta till databasen.", 'var(--danger-color)');
    });
};

/**
 * Hanterar alla händelselyssnare.
 */
const initializeListeners = () => {
    // 1. Lägg till Produkt Formulär
    document.getElementById('addProductForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        const form = e.target;
        
        // Hämta formulärdata
        const productData = {
            name: form.name.value.trim(),
            articleNumber: form.articleNumber.value.trim().toUpperCase(),
            count: parseInt(form.count.value, 10),
            location: form.location.value.trim(),
            category: form.category.value,
            notes: form.notes.value.trim(),
            link: form.link.value.trim()
        };
        
        // Generera ett nytt ID (Firestore genererar ID automatiskt vid addDoc, men vi använder setDoc/doc i detta fall)
        // Vi skapar ID't här om det behövs
        const newId = doc(getInventoryCollection()).id; 
        
        await saveProduct(newId, productData);
        form.reset(); // Rensa formuläret
        localStorage.removeItem('addProductForm'); // Rensa sparad state
        showStatus(`Produkten "${productData.name}" lades till!`);
    });

    // 2. Redigera Produkt Formulär
    document.getElementById('editProductForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        const form = e.target;
        const id = form['edit-id'].value;
        
        const updatedData = {
            name: form['edit-name'].value.trim(),
            articleNumber: form['edit-articleNumber'].value.trim().toUpperCase(),
            count: parseInt(form['edit-count'].value, 10),
            location: form['edit-location'].value.trim(),
            category: form['edit-category'].value,
            notes: form['edit-notes'].value.trim(),
            link: form['edit-link'].value.trim()
        };

        await saveProduct(id, updatedData);
        toggleModal('editModal', false);
        showStatus(`Produkten "${updatedData.name}" uppdaterades.`);
    });
    
    // 3. Modaler: Stäng vid klick på 'x' eller utanför
    document.querySelectorAll('.close-modal').forEach(span => {
        span.addEventListener('click', () => {
            toggleModal('editModal', false);
            toggleModal('confirmationModal', false);
            toggleModal('productPopup', false);
        });
    });

    window.addEventListener('click', (event) => {
        if (event.target.classList.contains('modal')) {
            event.target.style.display = 'none';
        }
    });

    // 4. Fällbara Paneler (Collapse)
    document.querySelectorAll('.collapsible-header').forEach(header => {
        header.addEventListener('click', (e) => {
            const wrapperId = header.id.replace('-titel', '-wrapper');
            const wrapper = document.getElementById(wrapperId);
            const icon = header.querySelector('span');

            if (!wrapper || !icon) return;
            
            const isClosed = wrapper.classList.contains('collapsed');

            if (isClosed) {
                // Öppna
                wrapper.classList.remove('collapsed');
                icon.innerHTML = '^';
                header.setAttribute('data-state', 'open');
                localStorage.setItem(header.id, 'open');
            } else {
                // Stäng
                wrapper.classList.add('collapsed');
                icon.innerHTML = '&#9660;';
                header.setAttribute('data-state', 'closed');
                localStorage.setItem(header.id, 'closed');
            }
        });
    });

    // 5. Sök och Filtrering
    document.getElementById('searchQuery').addEventListener('input', filterProducts);
    document.getElementById('filterCategory').addEventListener('change', filterProducts);

    // 6. Import/Export
    document.getElementById('exportData').addEventListener('click', () => {
        // Hämta alla produkter
        const dataToExport = Object.values(products);

        // Lägg till userId i exporten för att spara kontext
        const exportObject = {
            metadata: {
                timestamp: new Date().toISOString(),
                userId: userId,
                appId: appId
            },
            data: dataToExport
        };

        const jsonString = JSON.stringify(exportObject, null, 2);
        const blob = new Blob([jsonString], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `lagerdata_export_${new Date().toLocaleDateString('sv-SE')}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        showStatus("Data exporterad som JSON.");
    });
    
    document.getElementById('importButton').addEventListener('click', () => {
        document.getElementById('importFile').click();
    });

    document.getElementById('importFile').addEventListener('change', (event) => {
        const file = event.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = async (e) => {
            try {
                const importContent = JSON.parse(e.target.result);
                let importedProducts = importContent.data || importContent; // Stödjer både den nya strukturen och den gamla (endast data-array)
                
                if (!Array.isArray(importedProducts)) {
                    throw new Error("Importerad fil är inte en giltig produktlista.");
                }

                const confirmed = await showConfirmation(`Vill du importera ${importedProducts.length} produkter? Detta kommer att lägga till nya produkter och kan skriva över befintliga med samma ID.`);
                
                if (confirmed) {
                    let count = 0;
                    for (const product of importedProducts) {
                        // Säkerställ att vi har ett ID att spara mot
                        const id = product.id || doc(getInventoryCollection()).id;
                        // Ta bort ID-fältet från datat som sparas (det finns i doc-referensen)
                        const { id: _, ...dataToSave } = product; 
                        await saveProduct(id, dataToSave);
                        count++;
                    }
                    showStatus(`Importerade ${count} produkter framgångsrikt.`);
                } else {
                    showStatus("Import avbruten.");
                }

            } catch (error) {
                console.error("Fel vid import av JSON: ", error);
                showStatus(`FEL vid import: ${error.message}`, 'var(--danger-color)');
            }
        };
        reader.readAsText(file); 
        event.target.value = ''; // Rensa filväljaren
    });
};

/**
 * Initialiserar det fällbara läget för paneler (från localStorage).
 */
const initializeCollapseState = () => {
    document.querySelectorAll('.collapsible-header').forEach(header => {
        const categoryId = header.id.replace('-titel', '');
        const wrapperId = `${categoryId}-wrapper`;
        const wrapper = document.getElementById(wrapperId);

        const savedState = localStorage.getItem(header.id);

        if (savedState === 'closed') {
            header.setAttribute('data-state', 'closed');
            if (wrapper) {
                wrapper.classList.add('collapsed');
                const icon = header.querySelector('span');
                if (icon) icon.innerHTML = '&#9660;';
            }
        } 
        // Annars är den 'open' som standard (eller vid ingen sparad state)
    });
};

/**
 * Återställer sparad formulärdata om den finns.
 */
const initializeAddFormState = () => {
    const addForm = document.getElementById('addProductForm');
    if (!addForm) return;

    try {
        const savedState = localStorage.getItem('addProductForm');
        if (savedState) {
            const state = JSON.parse(savedState);
            Object.keys(state).forEach(key => {
                const element = addForm.elements.namedItem(key);
                if (element) {
                    element.value = state[key];
                }
            });
        }
    } catch (e) {
        console.error("Kunde inte återställa formulärstate:", e);
        localStorage.removeItem('addProductForm');
    }
    
    // Spara formulärdata vid ändring
    addForm.addEventListener('input', () => {
        const state = {
            name: addForm.name.value,
            articleNumber: addForm.articleNumber.value,
            count: addForm.count.value,
            location: addForm.location.value,
            category: addForm.category.value,
            notes: addForm.notes.value,
            link: addForm.link.value
        };
        localStorage.setItem('addProductForm', JSON.stringify(state));
    });
};


// Huvudfunktion för att starta appen
document.addEventListener('DOMContentLoaded', async () => {
    try {
        showStatus("Autentiserar...");
        // Autentisering: Använd custom token om det finns, annars anonym inloggning
        if (initialAuthToken) {
            await signInWithCustomToken(auth, initialAuthToken);
        } else {
            await signInAnonymously(auth);
        }
        
        // Hämta användar-ID efter inloggning
        userId = auth.currentUser?.uid || crypto.randomUUID();
        
        // KÖR ALLT I ORDNING
        initializeAddFormState(); 
        initializeCollapseState();
        initializeListeners(); 
        setupRealtimeListener();

    } catch (e) {
        console.error("App Initialization Error:", e);
        showStatus("FEL: Initieringsfel! Kontrollera konsolen.", 'var(--danger-color)');
    }
});
