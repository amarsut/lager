// planerare/lager-view.js

let lagerUnsubscribe = null;
window.allItemsCache = [];
window.currentFilter = 'all';

/**
 * Initierar lagervyn och sätter upp realtidslyssnare mot Firebase.
 */
export function initLagerView() {
    if (lagerUnsubscribe) lagerUnsubscribe();
    const database = window.invDb || window.db; 

    lagerUnsubscribe = database.collection("lager").onSnapshot(snapshot => {
        window.allItemsCache = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        renderEliteTable(window.allItemsCache);
    }, err => console.error("Firebase Error:", err));

    const searchInput = document.getElementById('lagerSearchInput');
    if (searchInput) searchInput.oninput = () => renderEliteTable(window.allItemsCache);
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

    renderSidebar(items, sidebar);

    const term = (window.innerWidth < 768 
        ? document.getElementById('lagerSearchInputMobile')?.value 
        : document.getElementById('lagerSearchInput')?.value || "").toLowerCase();

    const showInStock = document.getElementById('filterInStock')?.checked;
    const showOutOfStock = document.getElementById('filterOutOfStock')?.checked;

    let filtered = items.filter(i => {
        const qty = parseInt(i.quantity) || 0;
        const matchStock = (showInStock && qty > 0) || (showOutOfStock && qty <= 0);
        
        // ÄNDRING HÄR: Vi lägger till en check som kollar om namnet innehåller ordet (för snabbval)
        const matchCat = window.currentFilter === 'all' || 
                        (i.category || "").toLowerCase() === window.currentFilter.toLowerCase() ||
                        (i.name || "").toUpperCase().includes(window.currentFilter.toUpperCase());
        
        return matchStock && matchCat && (i.name || "").toLowerCase().includes(term);
    });

    // Sortering
    const sortVal = document.getElementById('sortSelect')?.value;
    if (sortVal === 'price-low') filtered.sort((a,b) => (a.price || 0) - (b.price || 0));
    else if (sortVal === 'price-high') filtered.sort((a,b) => (b.price || 0) - (a.price || 0));
    else filtered.sort((a,b) => (a.name || "").localeCompare(b.name || ""));

    container.innerHTML = filtered.map(item => {
        const qty = parseInt(item.quantity) || 0;
        const artId = String(item.id || "").substring(0, 10).toUpperCase();
        return `
            <div class="article-card-pro">
                <div class="card-img-box-pro">
                    <svg viewBox="0 0 24 24" width="36" height="36" fill="#e2e8f0"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path></svg>
                </div>
                <div class="card-info-pro">
                    <div class="card-id-label">ARTIKELNR: ${artId}</div>
                    <h3>${item.name || 'Namnlös'}</h3>
                    <div class="card-ref-pro">Ref: ${item.service_filter || '-'}</div>
                </div>
                <div class="card-actions-pro">
                    <div class="card-price-pro">${item.price || 0}:-</div>
                    <div class="stock-pill ${qty > 0 ? 'stock-in' : 'stock-out'}">${qty} st i lager</div>
                    <button class="btn-redigera-pro" onclick='window.openLagerDrawer(${JSON.stringify(item).replace(/'/g, "&apos;")})'>REDIGERA</button>
                </div>
            </div>`;
    }).join('');

    const statsEl = document.getElementById('paginationStats');
    if (statsEl) statsEl.textContent = `Visar ${filtered.length} av ${items.length}`;
}

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
