// planerare/lager-view.js

let lagerUnsubscribe = null;
window.allItemsCache = [];
// 1. MODIFIERAD: Sätter standardfilter till 'Service' för bättre prestanda och fokus
window.currentFilter = 'Service'; 

/**
 * Initierar lagervyn och sätter upp realtidslyssnare mot Firebase.
 */
export function initLagerView() {
    if (lagerUnsubscribe) lagerUnsubscribe();
    const database = window.invDb || window.db || firebase.firestore(); 

    lagerUnsubscribe = database.collection("lager").onSnapshot(snapshot => {
        window.allItemsCache = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        
        // Vid första laddning, se till att rätt kategori visas i mobilmenyn
        const mobileCat = document.getElementById('mobileFilterMain');
        if (mobileCat && window.innerWidth <= 768) {
            mobileCat.value = window.currentFilter; 
        }

        renderEliteTable(window.allItemsCache);
    }, err => console.error("Firebase Error:", err));

    // Koppla sökning
    const searchInput = document.getElementById('lagerSearchInput');
    if (searchInput) searchInput.oninput = () => renderEliteTable(window.allItemsCache);
    
    // Koppla sortering (A-Ö, Pris etc)
    const sortSelect = document.getElementById('sortSelect');
    if (sortSelect) sortSelect.onchange = () => renderEliteTable(window.allItemsCache);

    // Koppla spara-knappen i drawern
    const saveBtn = document.getElementById('btnSaveLagerItem');
    if (saveBtn) saveBtn.onclick = () => window.saveLagerItemChanges();
}

// Globala hjälpfunktioner
window.syncSearch = (val) => {
    const desktopInput = document.getElementById('lagerSearchInput');
    if (desktopInput) desktopInput.value = val;
    renderEliteTable(window.allItemsCache);
};

window.triggerLagerRender = () => renderEliteTable(window.allItemsCache);

window.setLagerFilter = (c) => { 
    window.currentFilter = c; 
    // Uppdatera även mobila dropdowns om de finns så de visar rätt kategori
    const mobileCat = document.getElementById('mobileFilterMain');
    if (mobileCat) mobileCat.value = c;
    renderEliteTable(window.allItemsCache); 
};

function renderSidebar(items, sidebar) {
    if (!sidebar) return;
    const subFilters = getDynamicSubFilters(items);
    const mainCats = ['Service', 'Motor/Chassi', 'Bromsar', 'Andra märken'];
    
    let html = `<div class="sidebar-cat-link ${window.currentFilter === 'all' ? 'active' : ''}" onclick="window.setLagerFilter('all')">
                    <span>Alla</span><span class="cat-badge">${items.length}</span>
                </div>`;
                
    html += mainCats.map(cat => {
        const count = items.filter(i => (i.category || "").trim().toLowerCase() === cat.toLowerCase()).length;
        return `<div class="sidebar-cat-link ${window.currentFilter === cat ? 'active' : ''}" onclick="window.setLagerFilter('${cat}')">
                    <span>${cat}</span><span class="cat-badge">${count}</span>
                </div>`;
    }).join('');

    if (subFilters.length > 0) {
        html += `<div class="sidebar-divider desktop-only"></div><div class="sidebar-sub-label desktop-only">Snabbval</div>`;
        html += subFilters.map(kw => {
            const count = items.filter(i => (i.name || "").toUpperCase().includes(kw)).length;
            const label = kw.charAt(0) + kw.slice(1).toLowerCase();
            return `<div class="sidebar-cat-link sub-link ${window.currentFilter === kw ? 'active' : ''}" onclick="window.setLagerFilter('${kw}')">
                        <span>${label}</span><span class="cat-badge">${count}</span>
                    </div>`;
        }).join('');
    }
    sidebar.innerHTML = html;
}

export function renderEliteTable(items) {
    const container = document.getElementById('lagerListElite');
    const sidebar = document.getElementById('sidebarCatList');
    if (!container) return;

    if (sidebar && window.innerWidth > 768) {
        renderSidebar(items, sidebar);
    }

    // 1. Hämta sökterm och sortering
    const term = (document.getElementById('lagerSearchInput')?.value || "").toLowerCase();
    const sortVal = document.getElementById('sortSelect')?.value || 'name';
    
    // NYTT: Normalisera söktermen (ta bort alla mellanslag)
    const normalizedTerm = term.replace(/\s+/g, ''); 

    // 2. Hantera lagerstatus-filter
    let showInStock, showOutOfStock;
    if (window.innerWidth <= 768) {
        const stockVal = document.getElementById('mobileFilterStock')?.value || 'both';
        showInStock = (stockVal === 'in' || stockVal === 'both');
        showOutOfStock = (stockVal === 'out' || stockVal === 'both');
    } else {
        showInStock = document.getElementById('filterInStock')?.checked;
        showOutOfStock = document.getElementById('filterOutOfStock')?.checked;
    }

    // 3. FILTRERING (Här deklareras 'filtered' endast EN gång)
    let filtered = items.filter(i => {
        const qty = parseInt(i.quantity) || 0;
        const matchStock = (showInStock && qty > 0) || (showOutOfStock && qty <= 0);
        
        const matchCat = window.currentFilter === 'all' || 
                         (i.category || "").toLowerCase() === window.currentFilter.toLowerCase() ||
                         (i.name || "").toUpperCase().includes(window.currentFilter.toUpperCase());

        // Normaliserad sökning på namn, artikelnr och kommentarer
        const matchSearch = 
            (i.name || "").toLowerCase().replace(/\s+/g, '').includes(normalizedTerm) ||
            String(i.id || "").toLowerCase().replace(/\s+/g, '').includes(normalizedTerm) ||
            (i.service_filter || "").toLowerCase().replace(/\s+/g, '').includes(normalizedTerm) ||
            (i.notes || "").toLowerCase().replace(/\s+/g, '').includes(normalizedTerm);

        return matchStock && matchCat && matchSearch;
    });

    // 4. SORTERING
    filtered.sort((a, b) => {
        if (sortVal === 'name') return (a.name || "").localeCompare(b.name || "");
        if (sortVal === 'price-low') return (parseFloat(a.price) || 0) - (parseFloat(b.price) || 0);
        if (sortVal === 'price-high') return (parseFloat(b.price) || 0) - (parseFloat(a.price) || 0);
        return 0;
    });

    // RENDERING (Kompakt layout)
    container.innerHTML = filtered.map(item => {
        const qty = parseInt(item.quantity) || 0;
        const notes = item.notes || "";
        const truncatedNotes = notes.length > 65 ? notes.substring(0, 65) + "..." : notes;
        
        return `
            <div class="article-card-pro">
                <div class="card-img-box-pro">
                    <svg viewBox="0 0 24 24" width="40" height="40" fill="#e2e8f0"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path></svg>
                </div>
                <div class="card-info-pro">
                    <div class="card-id-label">ARTIKELNR: ${String(item.id || "").toUpperCase()}</div>
                    <h3>${item.name || 'Namnlös'}</h3>
                    <div class="card-ref-pro">Ref: ${item.service_filter || '-'}</div>
                    ${notes ? `<div class="card-notes-pro" title="${notes}">${truncatedNotes}</div>` : ''}
                </div>
                <div class="card-actions-pro">
                    <div class="card-price-pro">${item.price || 0}:-</div>
                    <div class="stock-pill ${qty > 0 ? 'stock-in' : 'stock-out'}">${qty} st i lager</div>
                    <button class="btn-redigera-pro" onclick='window.editLagerItemById("${item.id}")'>REDIGERA</button>
                </div>
            </div>`;
    }).join('');

    const statsEl = document.getElementById('paginationStats');
    if (statsEl) statsEl.textContent = `Visar ${filtered.length} av ${items.length}`;
}

// 3. FIX: Kopplar funktionen korrekt till det globala fönstret
window.editLagerItemById = (id) => {
    const item = window.allItemsCache.find(i => String(i.id) === String(id));
    if (item) {
        document.getElementById('editItemId').value = item.id;
        document.getElementById('editItemName').value = item.name || '';
        document.getElementById('editItemPrice').value = item.price || 0;
        document.getElementById('editItemCategory').value = item.category || 'Service';
        
        // NYTT: Hämta antal från cachen
        document.getElementById('editItemQty').value = item.quantity || 0; 
        
        document.getElementById('editItemRefNum').value = item.service_filter || '';
        document.getElementById('editItemNotes').value = item.notes || '';
        
        document.getElementById('lagerDrawer').classList.add('open');
        document.getElementById('lagerDrawerOverlay').classList.add('show');
    }
};

window.closeLagerDrawer = () => {
    document.getElementById('lagerDrawer').classList.remove('open');
    document.getElementById('lagerDrawerOverlay').classList.remove('show');
};

window.saveLagerItemChanges = async () => {
    const id = document.getElementById('editItemId').value;
    const database = window.invDb || window.db || firebase.firestore();
    
    const data = {
        name: document.getElementById('editItemName').value,
        price: parseInt(document.getElementById('editItemPrice').value) || 0,
        category: document.getElementById('editItemCategory').value,
        
        // NYTT: Spara det nya antalet som en siffra
        quantity: parseInt(document.getElementById('editItemQty').value) || 0,
        
        service_filter: document.getElementById('editItemRefNum').value,
        notes: document.getElementById('editItemNotes').value
    };

    try {
        await database.collection("lager").doc(id).update(data);
        window.closeLagerDrawer();
    } catch (e) { 
        console.error("Update Error:", e);
    }
};

window.deleteLagerItem = async () => {
    const id = document.getElementById('editItemId').value;
    if (!id) return;

    if (confirm("Är du säker på att du vill radera denna artikel permanent?")) {
        const database = window.invDb || window.db || firebase.firestore();
        try {
            await database.collection("lager").doc(id).delete();
            window.closeLagerDrawer();
            console.log("Artikel raderad.");
        } catch (e) {
            console.error("Fel vid radering:", e);
            alert("Kunde inte radera artikeln.");
        }
    }
};

function getDynamicSubFilters(items) {
    const keywords = ["OLJEFILTER", "LUFTFILTER", "KUPEFILTER", "BROMSBELÄGG"];
    const found = {};
    items.forEach(i => {
        const n = (i.name || "").toUpperCase();
        keywords.forEach(kw => { if (n.includes(kw)) found[kw] = (found[kw] || 0) + 1; });
    });
    return Object.keys(found).filter(kw => found[kw] >= 2); 
}
