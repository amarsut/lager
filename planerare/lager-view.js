// planerare/lager-view.js

let lagerUnsubscribe = null;
window.allItemsCache = [];
// 1. MODIFIERAD: Sätter standardfilter till 'Service' för bättre prestanda och fokus
window.currentFilter = 'Service'; 

// --- HJÄLPFUNKTION FÖR ATT VÄLJA RÄTT IKON ---
function getCategoryIconHtml(category, name) {
    const cat = (category || "").toLowerCase();
    const itemName = (name || "").toLowerCase();

    // Vi definierar ikoner som fullständiga SVG-innehåll med färger
    const icons = {
        // Standard: Grå låda
        default: '<path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" fill="#94a3b8"></path>',
        
        fuelFilter: `
            <g stroke="#1e293b" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round" fill="none">
                <path d="M3 12h3M20 12h2" stroke-width="1.5"/>
                <rect x="6" y="9" width="4" height="6" fill="#94a3b8" stroke="none"/>
                <path d="M10 9l3-2v10l-3-2z" fill="#cbd5e1" stroke="none"/>
                <rect x="13" y="8" width="7" height="8" fill="#475569" stroke="none"/>
                <path d="M13 18.5c0 1.2-1 2-1.5 2s-1.5-.8-1.5-2 1.5-3 1.5-3 1.5 1.8 1.5 3z" fill="#fbbf24" stroke="none" />
                <path d="M7 5c2-3 8-3 11 1" stroke="#86efac" stroke-width="2"/>
                <path d="M16 6.5l2.5.5L18 4.5" stroke="#86efac" stroke-width="2"/>
                <path d="M18 19c-2 3-8 3-11-1" stroke="#fca5a5" stroke-width="2"/>
                <path d="M9 18.5l-2.5-.5L7 20.5" stroke="#fca5a5" stroke-width="2"/>
                <rect x="6" y="9" width="4" height="6"/><path d="M10 9l3-2v10l-3-2z"/><rect x="13" y="8" width="7" height="8"/>
            </g>`,

        brakePad: `
            <g stroke="#1e293b" stroke-width="0.5" stroke-linejoin="round">
                <path d="M3 13c0-2 4-4 9-4s9 2 9 4l-1 2c0-2-3-3-8-3s-8 1-8 3l-1-2z" fill="#cbd5e1" />
                <path d="M2 12.5c0-1 1-1.5 2-1.5h1c0-1 3-2 7-2s7 1 7 2h1c1 0 2 .5 2 1.5v1c0 1-1 1.5-2 1.5h-16c-1 0-2-.5-2-1.5v-1z" fill="#94a3b8" />
                
                <path d="M4.5 11.5c1.5-1 3.5-1.5 5.5-1.5v3.5c-2 0-4 .5-5.5 1.5v-3.5z" fill="#1e293b" />
                <path d="M14 10c2 0 4 .5 5.5 1.5v3.5c-1.5-1-3.5-1.5-5.5-1.5v-3.5z" fill="#1e293b" />
                
                <path d="M5 11c1.5-.5 3-.8 4.5-.8" stroke="#fff" stroke-width="0.3" opacity="0.4" fill="none" />
            </g>
        `,

        sparkPlug: `
            <g stroke="#475569" stroke-width="1" stroke-linecap="round" stroke-linejoin="round">
                <path d="M12 2v2" stroke-width="2" stroke="#64748b"/>
                
                <rect x="10" y="4" width="4" height="7" rx="0.5" fill="#f8fafc" stroke="#94a3b8" stroke-width="0.8"/>
                <path d="M10 6h4M10 8h4" stroke="#e2e8f0" stroke-width="0.5"/>
                
                <rect x="9" y="11" width="6" height="3" rx="0.5" fill="#cbd5e1"/>
                
                <rect x="10.5" y="14" width="3" height="6" fill="#94a3b8" stroke="none"/>
                <path d="M10.5 15l3 1M10.5 17l3 1M10.5 19l3 1" stroke="#cbd5e1" stroke-width="0.5"/>
                <rect x="10.5" y="14" width="3" height="6" fill="none"/>
                
                <path d="M11 22v1c0 .6.4 1 1 1h2" fill="none" stroke-width="1.2" stroke="#475569"/>
            </g>
        `,

        cabinFilter: `
            <g stroke="none">
                <rect x="2" y="5" width="20" height="14" rx="1.5" fill="#334155" />
                <rect x="4" y="7" width="16" height="10" rx="0.5" fill="#f8fafc" />
                <path d="M4 9h16M4 11h16M4 13h16M4 15h16" stroke="#cbd5e1" stroke-width="0.6" />
                <rect x="4" y="7" width="16" height="10" rx="0.5" fill="none" stroke="#e2e8f0" stroke-width="0.5"/>
            </g>
        `,

        // Oljefilter: Orange/Gul med detaljer (likt Flaticon-stil)
        oilFilter: `
            <rect x="8" y="2" width="8" height="3" rx="1" fill="#cbd5e1" />
            <rect x="5" y="5" width="14" height="4" rx="1" fill="#475569" />
            <rect x="6" y="9" width="12" height="10" fill="#f59e0b" />
            <path d="M8 9v10M10 9v10M12 9v10M14 9v10M16 9v10" stroke="#b45309" stroke-width="0.5" />
            <rect x="5" y="19" width="14" height="4" rx="1" fill="#475569" />
            <rect x="10" y="21" width="4" height="2" fill="#cbd5e1" />
        `,
        
        // Luftfilter/Kupé: Blå/Vit ram
        airFilter: `
            <path d="M2 10l16-4l4 2l-16 4z" fill="#f97316" /> 
            <path d="M2 10l4 8l16-4l-4-8z" fill="#fbbf24" /> 
            <path d="M2 10l4 8l0 3l-4-8z" fill="#ea580c" />
            <path d="M6 18l16-4l0 3l-16 4z" fill="#ea580c" />
            <path d="M5 9.2l3 6M8 8.4l3 6M11 7.6l3 6M14 6.8l3 6M17 6l3 6" stroke="#fff" stroke-width="1.2" opacity="0.5" />
        `,
        
        // Bromsskiva: Silver/Metallisk med rött bromsok
        brakeDisc: `
            <g fill="none" stroke="#1e293b" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round">
                <circle cx="13" cy="13" r="8.5" />
                <circle cx="13" cy="13" r="3.2" />
                <circle cx="13" cy="11.5" r="0.5" fill="#1e293b" stroke="none" />
                <circle cx="14.5" cy="13" r="0.5" fill="#1e293b" stroke="none" />
                <circle cx="13" cy="14.5" r="0.5" fill="#1e293b" stroke="none" />
                <circle cx="11.5" cy="13" r="0.5" fill="#1e293b" stroke="none" />
                <path d="M13 6v2M18 8l-1.5 1.5M20 13h-2M18 18l-1.5-1.5M13 20v-2M8 18l1.5-1.5M6 13h2M8 8l1.5 1.5" stroke-width="0.8" opacity="0.5" />
                <path d="M9.5 3.2C6.5 3.8 4.2 6.2 3.5 9.2l1.8 1.8 4.2-2.5 1.5-4.5-1.5-.8z" fill="#ef4444" stroke="#b91c1c" stroke-width="0.6" />
                <circle cx="5.2" cy="6.8" r="0.7" fill="#fff" stroke="none" />
                <circle cx="8" cy="9" r="0.7" fill="#fff" stroke="none" />
            </g>
        `
    };

    if (cat.includes('kupefilter') || itemName.includes('kupefilter') || cat.includes('kupé')) {
        return icons.cabinFilter;
    }
    if (itemName.includes('tändstift') || cat.includes('tändstift')) return icons.sparkPlug;
    if (itemName.includes('bränslefilter') || cat.includes('bränslefilter')) return icons.fuelFilter;
    if (cat.includes('oljefilter') || itemName.includes('oljefilter')) return icons.oilFilter;
    if (cat.includes('filter') || itemName.includes('filter')) return icons.airFilter;
    if (cat.includes('bromsskivor') || itemName.includes('bromsskivor')) return icons.brakeDisc;
    if (itemName.includes('bromsbelägg') || cat.includes('bromsbelägg')) return icons.brakePad;

    return icons.default;
}

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
    const mainCats = ['Service', 'Motor/Chassi', 'Bromsar', 'Andra Märken'];
    
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
    // 5. RENDERING
    container.innerHTML = filtered.map(item => {
    const qty = parseInt(item.quantity) || 0;
    const notes = item.notes || "";
    const truncatedNotes = notes.length > 65 ? notes.substring(0, 65) + "..." : notes;
    
    // Hämta ikon
    const iconContent = getCategoryIconHtml(item.category, item.name);

    // Generera alla jämförelselänkar baserat på ref eller namn
    const supplierLinks = getAllSupplierLinks(item.service_filter || item.name);

    return `
        <div class="article-card-pro">
            <div class="card-img-box-pro">
                <svg viewBox="0 0 24 24" width="36" height="36">
                    ${iconContent}
                </svg>
            </div>
            <div class="card-info-pro">
                <div class="card-id-label">ARTIKELNR: ${String(item.id || "").toUpperCase()}</div>
                <h3>${item.name || 'Namnlös'}</h3>
                <div class="card-ref-pro">Ref: ${item.service_filter || '-'}</div>
                ${notes ? `<div class="card-notes-pro">${truncatedNotes}</div>` : ''}
            </div>
            <div class="card-actions-pro">
                <div class="card-price-container-pro" style="display: flex; flex-direction: column; align-items: flex-end; gap: 8px;">
                    <div class="card-price-pro">${item.price || 0}:-</div>
                    
                    <div class="supplier-compare-row" style="display: flex; gap: 5px;">
                        ${supplierLinks.map(s => `
                            <a href="${s.url}" 
                               target="_blank" 
                               class="supplier-link-circle" 
                               title="Sök hos ${s.name}"
                               style="background-color: ${s.color}; width: 22px; height: 22px; border-radius: 50%; display: flex; align-items: center; justify-content: center; color: ${s.name === 'Mekonomen' ? '#000' : '#fff'}; font-size: 10px; font-weight: bold; text-decoration: none;">
                                ${s.name.charAt(0)}
                            </a>
                        `).join('')}
                    </div>
                </div>
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

        // Uppdatera titeln
        const titleEl = document.querySelector('#lagerDrawer .std-title');
        if (titleEl) titleEl.textContent = "Redigera Artikel";
        
        document.getElementById('lagerDrawer').classList.add('open');
        document.getElementById('lagerDrawerOverlay').classList.add('show');
    }
};

window.closeLagerDrawer = () => {
    document.getElementById('lagerDrawer').classList.remove('open');
    document.getElementById('lagerDrawerOverlay').classList.remove('show');
};

// --- FUNKTION FÖR ATT ÖPPNA FÖR NY ARTIKEL ---
window.openNewLagerItemDrawer = () => {
    // 1. Rensa alla fält
    document.getElementById('editItemId').value = ""; 
    document.getElementById('editItemName').value = "";
    document.getElementById('editItemPrice').value = "";
    document.getElementById('editItemCategory').value = "Service";
    document.getElementById('editItemQty').value = "";
    document.getElementById('editItemRefNum').value = "";
    document.getElementById('editItemNotes').value = "";
    
    // 2. Ändra titeln i drawern så man ser att det är en ny artikel
    const titleEl = document.querySelector('#lagerDrawer .std-title');
    if (titleEl) titleEl.textContent = "Ny Artikel";

    // 3. Öppna drawern
    document.getElementById('lagerDrawer').classList.add('open');
    document.getElementById('lagerDrawerOverlay').classList.add('show');
};

// --- UPPDATERAD SPARA-FUNKTION ---
window.saveLagerItemChanges = async () => {
    const id = document.getElementById('editItemId').value;
    const database = window.invDb || window.db || firebase.firestore();
    
    const data = {
        name: document.getElementById('editItemName').value,
        price: parseInt(document.getElementById('editItemPrice').value) || 0,
        category: document.getElementById('editItemCategory').value,
        quantity: parseInt(document.getElementById('editItemQty').value) || 0,
        service_filter: document.getElementById('editItemRefNum').value,
        notes: document.getElementById('editItemNotes').value
    };

    try {
        if (id) {
            // Om ID finns -> Uppdatera befintlig
            await database.collection("lager").doc(id).update(data);
        } else {
            // Om ID saknas -> Skapa ny artikel
            await database.collection("lager").add(data);
        }
        window.closeLagerDrawer();
    } catch (e) { 
        console.error("Fel vid sparande:", e);
        alert("Kunde inte spara artikeln.");
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

// --- LEVERANTÖRSFUNKTIONER ---
function generateTrodoLink(f) { 
    if (!f) return null; 
    const s = f.replace(/[\s-]/g, ''); 
    const q = encodeURIComponent(s); 
    return `https://www.trodo.se/catalogsearch/result/premium?filter[quality_group]=2&product_list_dir=asc&product_list_order=price&q=${q}`; 
}

function generateThansenLink(f) { 
    if (!f) return null; 
    const s = f.replace(/[\s-]/g, ''); 
    const q = encodeURIComponent(s); 
    return `https://www.thansen.se/search/?query=${q}`; 
}

function generateAeroMLink(f) { 
    if (!f) return null; 
    const s = f.replace(/[\s-]/g, ''); 
    return `https://aeromotors.se/sok?s=${s}&layered_id_feature_1586%5B%5D=3&sort_by=price.asc`; 
}

// Samlingsfunktion för att hämta alla länkar till kortet
function getAllSupplierLinks(ref) {
    if (!ref) return [];
    return [
        { name: 'Trodo', color: '#2563eb', url: generateTrodoLink(ref) },
        { name: 'Thansen', color: '#ed1c24', url: generateThansenLink(ref) },
        { name: 'AeroM', color: '#0056b3', url: generateAeroMLink(ref) },
    ];
}
