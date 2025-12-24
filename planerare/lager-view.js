// planerare/lager-view.js

let lagerUnsubscribe = null;
window.allItemsCache = [];
window.currentFilter = 'all';

/**
 * Initierar lagervyn och sätter upp realtidslyssnare mot Firebase.
 */
export function initLagerView() {
    if (lagerUnsubscribe) lagerUnsubscribe();
    const database = window.invDb || window.db || firebase.firestore(); 

    lagerUnsubscribe = database.collection("lager").onSnapshot(snapshot => {
        window.allItemsCache = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        renderEliteTable(window.allItemsCache);
    }, err => console.error("Firebase Error:", err));

    // FIX: Koppla sökning för BÅDE dator och mobil ordentligt
    const pcSearch = document.getElementById('lagerSearchInput');
    if (pcSearch) pcSearch.oninput = () => renderEliteTable(window.allItemsCache);
    
    const mobileSearch = document.getElementById('lagerSearchInputMobile');
    if (mobileSearch) mobileSearch.oninput = () => renderEliteTable(window.allItemsCache);

    const saveBtn = document.getElementById('btnSaveLagerItem');
    if (saveBtn) saveBtn.onclick = window.saveLagerItemChanges;
}

// Globala hjälpfunktioner för mobil-headern
window.syncSearch = (val) => {
    const desktopInput = document.getElementById('lagerSearchInput');
    if (desktopInput) desktopInput.value = val;
    renderEliteTable(window.allItemsCache);
};

window.toggleSortMenu = () => {
    const menu = document.getElementById('mobileSortDropdown');
    if (menu) menu.style.display = menu.style.display === 'none' ? 'flex' : 'none';
};

window.setMobileSort = (val) => {
    const sortSelect = document.getElementById('sortSelect');
    if (sortSelect) {
        sortSelect.value = val;
        window.toggleSortMenu();
        window.triggerLagerRender();
    }
};

function renderSidebar(items, sidebar) {
    if (!sidebar) return;
    const subFilters = getDynamicSubFilters(items);
    const mainCats = ['Service', 'Motor/Chassi', 'Bromsar', 'Andra märken'];
    
    // 1. Grundkategorier
    let html = `<div class="sidebar-cat-link ${window.currentFilter === 'all' ? 'active' : ''}" onclick="window.setLagerFilter('all')">
                    <span>Alla</span><span class="cat-badge">${items.length}</span>
                </div>`;
                
    html += mainCats.map(cat => {
        const count = items.filter(i => (i.category || "").trim().toLowerCase() === cat.toLowerCase()).length;
        return `<div class="sidebar-cat-link ${window.currentFilter === cat ? 'active' : ''}" onclick="window.setLagerFilter('${cat}')">
                    <span>${cat}</span><span class="cat-badge">${count}</span>
                </div>`;
    }).join('');

    // 2. Dynamiska Snabbval (Smartfilter)
    if (subFilters.length > 0) {
        // Divider och etikett visas bara på dator (desktop-only klassen sköter detta)
        html += `<div class="sidebar-divider desktop-only"></div><div class="sidebar-sub-label desktop-only">Snabbval</div>`;
        
        html += subFilters.map(kw => {
            const count = items.filter(i => (i.name || "").toUpperCase().includes(kw)).length;
            // Snygga till etiketten (t.ex. "OLJEFILTER" -> "Oljefilter")
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

    // Återställ sidebar för desktop
    if (sidebar && window.innerWidth > 768) {
        renderSidebar(items, sidebar);
    }

    const pcInput = document.getElementById('lagerSearchInput');
    const mobileInput = document.getElementById('lagerSearchInputMobile');
    const term = (pcInput?.value || mobileInput?.value || "").toLowerCase();

    // Hantera lagerstatus-filter
    let showInStock, showOutOfStock;
    if (window.innerWidth <= 768) {
        const stockVal = document.getElementById('mobileFilterStock').value;
        showInStock = (stockVal === 'in' || stockVal === 'both');
        showOutOfStock = (stockVal === 'out' || stockVal === 'both');
    } else {
        showInStock = document.getElementById('filterInStock')?.checked;
        showOutOfStock = document.getElementById('filterOutOfStock')?.checked;
    }

    let filtered = items.filter(i => {
        const qty = parseInt(i.quantity) || 0;
        const matchStock = (showInStock && qty > 0) || (showOutOfStock && qty <= 0);
        
        const matchCat = window.currentFilter === 'all' || 
                         (i.category || "").toLowerCase() === window.currentFilter.toLowerCase() ||
                         (i.name || "").toUpperCase().includes(window.currentFilter.toUpperCase());

        // UTÖKAD SÖKNING (Namn, ID, Ref och Kommentarer)
        const matchSearch = 
            (i.name || "").toLowerCase().includes(term) ||
            (String(i.id || "")).toLowerCase().includes(term) ||
            (i.service_filter || "").toLowerCase().includes(term) ||
            (i.notes || "").toLowerCase().includes(term);

        return matchStock && matchCat && matchSearch;
    });

    // Rendering av korten
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

// Säkrare redigeringsfunktion
window.editLagerItemById = (id) => {
    const item = window.allItemsCache.find(i => i.id === id);
    if (item) window.openLagerDrawer(item);
};

function getDynamicSubFilters(items) {
    // Definiera de specifika ord vi letar efter
    const keywords = ["OLJEFILTER", "LUFTFILTER", "KUPEFILTER", "BROMSBELÄGG"];
    const found = {};
    
    items.forEach(i => {
        const n = (i.name || "").toUpperCase();
        keywords.forEach(kw => { 
            if (n.includes(kw)) found[kw] = (found[kw] || 0) + 1; 
        });
    });

    // Returnera de ord som finns på minst 2 artiklar
    return Object.keys(found).filter(kw => found[kw] >= 2); 
}

window.openLagerDrawer = (item) => {
    document.getElementById('editItemId').value = item.id;
    document.getElementById('editItemName').value = item.name || '';
    document.getElementById('editItemPrice').value = item.price || 0;
    document.getElementById('editItemRef').value = item.category || '';
    document.getElementById('editItemNotes').value = item.notes || '';
    document.getElementById('lagerDrawer').classList.add('open');
    document.getElementById('lagerDrawerOverlay').classList.add('show');
};

window.closeLagerDrawer = () => {
    document.getElementById('lagerDrawer').classList.remove('open');
    document.getElementById('lagerDrawerOverlay').classList.remove('show');
};

window.saveLagerItemChanges = async () => {
    const id = document.getElementById('editItemId').value;
    const database = window.invDb || window.db;
    const data = {
        name: document.getElementById('editItemName').value,
        price: parseInt(document.getElementById('editItemPrice').value) || 0,
        category: document.getElementById('editItemRef').value,
        notes: document.getElementById('editItemNotes').value
    };
    try {
        await database.collection("lager").doc(id).update(data);
        window.closeLagerDrawer();
    } catch (e) { console.error(e); }
};

window.setLagerFilter = (c) => { window.currentFilter = c; renderEliteTable(window.allItemsCache); };
window.triggerLagerRender = () => renderEliteTable(window.allItemsCache);
