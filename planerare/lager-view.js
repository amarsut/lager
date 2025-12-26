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
            </g>
        `,

        injector: `
            <g stroke="#1e293b" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M5 19l2 2 15-15-2-2-15 15z" fill="#94a3b8" />
                <path d="M16 4l4 4M7 17l4 4" stroke="#1e293b" />
                <rect x="14" y="3" width="6" height="4" transform="rotate(-45 17 5)" fill="#ef4444" stroke="none" />
                <rect x="6" y="15" width="5" height="4" transform="rotate(-45 8.5 17)" fill="#ef4444" stroke="none" />
                <path d="M4 20l-2 2" stroke-width="2" />
                <rect x="11" y="9" width="4" height="4" transform="rotate(-45 13 11)" fill="#475569" stroke="none" />
            </g>
        `,

        spring: `
            <g fill="#1e293b">
                <rect x="4" y="2" width="16" height="2.5" rx="1.2" />
                <path d="M6 4.5l12 3v2.5l-12-3z" />
                <rect x="4" y="7" width="16" height="2.5" rx="1.2" />
                <path d="M6 9.5l12 3v2.5l-12-3z" />
                <rect x="4" y="12" width="16" height="2.5" rx="1.2" />
                <path d="M6 14.5l12 3v2.5l-12-3z" />
                <rect x="4" y="17" width="16" height="2.5" rx="1.2" />
                <rect x="4" y="21" width="16" height="2.5" rx="1.2" />
            </g>
        `,

        belt: `
            <g stroke="#1e293b" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M12 5L20 16H4L12 5" fill="none" stroke="#ef4444" stroke-width="2.5" />
                <circle cx="12" cy="6" r="4" fill="#cbd5e1" />
                <circle cx="12" cy="6" r="2" fill="#334155" />
                <circle cx="18" cy="16" r="3.5" fill="#94a3b8" />
                <circle cx="18" cy="16" r="1.5" fill="#334155" />
                <circle cx="6" cy="16" r="5" fill="#475569" />
                <circle cx="6" cy="16" r="2.5" fill="#94a3b8" />
                <circle cx="6" cy="16" r="0.8" fill="#1e293b" stroke="none" />
            </g>
        `,

        glowPlug: `
            <g stroke="#1e293b" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round">
                <rect x="11.5" y="2" width="1" height="3" fill="#64748b" />
                <rect x="10" y="5" width="4" height="8" fill="#94a3b8" />
                <path d="M10 7h4M10 9h4M10 11h4" stroke="#475569" stroke-width="0.5" />
                <path d="M11.5 13v7" stroke-width="2" stroke="#475569" />
                <path d="M11.5 18v3" stroke="#f97316" stroke-width="2.5" />
                <path d="M11.5 20v1.5" stroke="#fbbf24" stroke-width="1.5" />
            </g>
        `,

        brakePad: `
            <g fill="none" stroke="#1e293b" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
                <path d="M7 10h10v6H7z" />
                <path d="M7 10l-2 2v2l2 2M17 10l2 2v2l-2 2" />
                <path d="M12 10v6" stroke-width="1" />
                <path d="M5 11v-2h2M19 11v-2h-2" />
            </g>
        `,

        brakeCaliper: `
            <g fill="none" stroke="#1e293b" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M18 4v16M18 4h-2c-4 0-8 4-8 8s4 8 8 8h2" stroke-width="1.8" />
                <circle cx="12" cy="7" r="1.5" fill="#94a3b8" />
                <circle cx="10" cy="12" r="1.5" fill="#94a3b8" />
                <circle cx="12" cy="17" r="1.5" fill="#94a3b8" />
                <path d="M15 8v8" opacity="0.5" />
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
            <g stroke="#000" stroke-width="1.2">
                <rect x="11" y="2" width="2" height="20" fill="#334155" /> <ellipse cx="12" cy="6" rx="6" ry="2" fill="#fff" />
                <rect x="7" y="6" width="10" height="13" fill="#facc15" /> <path d="M9 6 v13 M12 8 v11 M15 6 v13" stroke-width="0.8" opacity="0.4" />
                <ellipse cx="12" cy="19" rx="6" ry="2" fill="none" />
            </g>
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
        `,

        exhaustClamp: `
            <g stroke="#1e293b" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round">
                <rect x="3" y="10" width="18" height="6" fill="#cbd5e1" />
                <rect x="6" y="8" width="4" height="10" fill="#94a3b8" />
                <rect x="14" y="8" width="4" height="10" fill="#94a3b8" />
                <circle cx="8" cy="7" r="1.5" fill="#475569" />
                <circle cx="16" cy="7" r="1.5" fill="#475569" />
            </g>
        `,

        oilBarrel: `
            <g stroke="#1e293b" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round">
                <rect x="6" y="4" width="12" height="16" rx="1.5" fill="#facc15" />
                
                <rect x="5" y="3.5" width="14" height="1.5" rx="0.7" fill="#eab308" />
                <rect x="5" y="11.2" width="14" height="1.5" rx="0.7" fill="#eab308" />
                <rect x="5" y="19" width="14" height="1.5" rx="0.7" fill="#eab308" />
                
                <rect x="8" y="2" width="3" height="1.5" fill="#334155" />
                
                <path d="M12 6.5 c-1.2 1.8 -1.5 3 -1.5 4 a1.5 1.5 0 0 0 3 0 c0 -1 -0.3 -2.2 -1.5 -4z" fill="#1e3a8a" stroke="none" />
                
                <path d="M9 15h6M10 17h4" stroke-width="0.8" opacity="0.6" />
            </g>
        `
    };

    if (itemName.includes('klämma') || itemName.includes('avgasklämma') || cat.includes('skarvmuff')) { return icons.exhaustClamp; }
    if (itemName.includes('bromsok') || itemName.includes('caliper') || cat.includes('bromsok')) { return icons.brakeCaliper; }
    if (itemName.includes('fat') || itemName.includes('olja') || cat.includes('motorolja')) { return icons.oilBarrel; }
    if (itemName.includes('insprut') || itemName.includes('spridare') || cat.includes('insprut')) { return icons.injector;}
    if (itemName.includes('fjäder') || itemName.includes('fjädrar') || cat.includes('fjäder')) { return icons.spring; }
    if (itemName.includes('rem') || cat.includes('rem')) { return icons.belt; }
    if (itemName.includes('glödstift') || cat.includes('glödstift')) { return icons.glowPlug; }
    if (cat.includes('kupefilter') || itemName.includes('kupefilter') || cat.includes('kupé')) {return icons.cabinFilter; }
    if (itemName.includes('tändstift') || cat.includes('tändstift')) return icons.sparkPlug;
    if (itemName.includes('bränslefilter') || cat.includes('bränslefilter')) return icons.fuelFilter;
    if (cat.includes('oljefilter') || itemName.includes('oljefilter')) return icons.oilFilter;
    if (cat.includes('dsg') || itemName.includes('dsg')) return icons.oilFilter;
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
    const clearBtn = document.getElementById('clearLagerSearch');

    if (searchInput && clearBtn) {
        searchInput.oninput = () => {
            // Visa X om det finns text, annars dölj
            clearBtn.style.display = searchInput.value ? 'block' : 'none';
            renderEliteTable(window.allItemsCache);
        };

        clearBtn.onclick = () => {
            searchInput.value = '';
            clearBtn.style.display = 'none';
            searchInput.focus();
            renderEliteTable(window.allItemsCache);
        };
    }

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
    
    // Snabbval (Oljefilter osv) baseres på HELE lageret så menuen ikke forsvinder
    const subFilters = getDynamicSubFilters(window.allItemsCache);
    const mainCats = ['Service', 'Motor/Chassi', 'Bromsar', 'Andra Märken'];
    
    let html = `<div class="sidebar-cat-link ${window.currentFilter === 'all' ? 'active' : ''}" onclick="window.setLagerFilter('all')">
                    <span>Alla</span><span class="cat-badge">${items.length}</span>
                </div>`;
                
    html += mainCats.map(cat => {
        // Tæl kun de varer der matcher det nuværende lagerfilter (f.eks. Slut i lager)
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

    // 1. Hantera filter för lagerstatus
    let showInStock = true;
    let showOutOfStock = false;
    const mobileStockSelect = document.getElementById('mobileFilterStock');

    if (window.innerWidth <= 768 && mobileStockSelect) {
        const val = mobileStockSelect.value;
        showInStock = (val === 'in' || val === 'both');
        showOutOfStock = (val === 'out' || val === 'both');
    } else {
        showInStock = document.getElementById('filterInStock')?.checked;
        showOutOfStock = document.getElementById('filterOutOfStock')?.checked;
    }

    const filteredByStock = items.filter(i => {
        const qty = parseInt(i.quantity) || 0;
        return (showInStock && qty > 0) || (showOutOfStock && qty <= 0);
    });

    if (sidebar && window.innerWidth > 768) {
        renderSidebar(filteredByStock, sidebar);
    }

    // 2. Hämta sökterm
    const searchInput = document.getElementById('lagerSearchInput');
    const term = (searchInput?.value || "").trim();
    const normalizedTerm = term.toLowerCase().replace(/\s+/g, ''); 
    const sortVal = document.getElementById('sortSelect')?.value || 'name';

    // 3. Filtrera listan
    let filtered = filteredByStock.filter(i => {
        const itemCat = (i.category || "").trim().toLowerCase(); 
        const matchCat = window.currentFilter === 'all' || 
                         itemCat === window.currentFilter.toLowerCase() ||
                         (i.name || "").toUpperCase().includes(window.currentFilter.toUpperCase());

        const matchSearch = 
            (i.name || "").toLowerCase().replace(/\s+/g, '').includes(normalizedTerm) ||
            String(i.id || "").toLowerCase().replace(/\s+/g, '').includes(normalizedTerm) ||
            (i.service_filter || "").toLowerCase().replace(/\s+/g, '').includes(normalizedTerm) ||
            (i.notes || "").toLowerCase().replace(/\s+/g, '').includes(normalizedTerm);

        return matchCat && matchSearch;
    });

    // 4. Sortering
    filtered.sort((a, b) => {
        if (sortVal === 'name') return (a.name || "").localeCompare(b.name || "");
        if (sortVal === 'price-low') return (parseFloat(a.price) || 0) - (parseFloat(b.price) || 0);
        if (sortVal === 'price-high') return (parseFloat(b.price) || 0) - (parseFloat(a.price) || 0);
        return 0;
    });

    // 5. Hantera Motorolja (Virtuell artikel) - TVINGA ÖVERST
    const oilQty = window.currentOilQuantity || 0;
    const oilMatchStock = (showInStock && oilQty > 0) || (showOutOfStock && oilQty <= 0);
    
    filtered = filtered.filter(item => (item.name || "").toLowerCase() !== 'motorolja');

    if (oilMatchStock && (window.currentFilter === 'all' || window.currentFilter.toLowerCase() === 'service')) {
        const motorOilItem = {
            id: 'OIL-SYSTEM',
            name: 'Motorolja',
            category: 'Service',
            quantity: oilQty,
            price: window.oilPricePerLiter || 0,
            service_filter: 'Lösvikt (liter)',
            notes: 'Synkad med oljefat'
        };
        
        if (!term || motorOilItem.name.toLowerCase().includes(normalizedTerm)) {
            filtered.unshift(motorOilItem); 
        }
    }

    // 6. RENDERING LOGIK
    if (filtered.length === 0 && term.length > 0) {
        // --- VISAR EMPTY STATE MED LÄNKAR ---
        const trodoUrl = generateTrodoLink(term);
        const thansenUrl = generateThansenLink(term);
        const aeroUrl = generateAeroMLink(term);

        container.innerHTML = `
            <div class="lager-empty-search" style="padding: 40px 20px; text-align: center; background: white; border-radius: 16px; border: 2px dashed #e2e8f0; margin: 20px 0;">
                <div style="font-size: 3rem; margin-bottom: 15px;">📦</div>
                <h3 style="margin-bottom: 10px; color: #1e293b;">Ingen träff i lagret för "${term}"</h3>
                <p style="color: #64748b; margin-bottom: 25px;">Artikeln saknas i ditt lokala saldo. Sök externt eller lägg till den:</p>
                
                <div style="display: flex; gap: 10px; justify-content: center; flex-wrap: wrap; margin-bottom: 25px;">
                    <a href="${trodoUrl}" target="_blank" style="background: #2563eb; color: white; padding: 12px 20px; border-radius: 10px; text-decoration: none; font-weight: 600; font-size: 0.85rem;">Sök på Trodo</a>
                    <a href="${thansenUrl}" target="_blank" style="background: #ed1c24; color: white; padding: 12px 20px; border-radius: 10px; text-decoration: none; font-weight: 600; font-size: 0.85rem;">Sök på Thansen</a>
                    <a href="${aeroUrl}" target="_blank" style="background: #0056b3; color: white; padding: 12px 20px; border-radius: 10px; text-decoration: none; font-weight: 600; font-size: 0.85rem;">Sök på AeroMotors</a>
                </div>

                <button onclick="window.openNewLagerItemDrawer('${term}')" style="background: #10b981; color: white; border: none; padding: 15px 30px; border-radius: 12px; font-weight: 700; cursor: pointer; display: flex; align-items: center; gap: 10px; margin: 0 auto;">
                    <svg width="20" height="20" fill="none" stroke="currentColor" stroke-width="3" viewBox="0 0 24 24"><path d="M12 5v14M5 12h14"></path></svg>
                    LÄGG TILL "${term.toUpperCase()}" I LAGER
                </button>
            </div>
        `;
    } else if (filtered.length === 0) {
        container.innerHTML = `<p style="text-align:center; padding: 2rem; color: #888;">Inga artiklar matchar filtret.</p>`;
    } else {
        // --- RENDERA ARTIKLAR SOM VANLIGT ---
        container.innerHTML = filtered.map(item => {
            const qty = parseInt(item.quantity) || 0;
            const notes = item.notes || ""; 
            const iconContent = getCategoryIconHtml(item.category, item.name);
            const supplierLinks = getAllSupplierLinks(item.service_filter || item.name);

            // --- NYTT: Logik för att hitta senaste försäljning ---
            let lastSoldInfo = "";
            if (qty <= 0 && window.allJobs) {
                const lastJob = window.allJobs
                    .filter(j => !j.deleted && Array.isArray(j.utgifter) && j.utgifter.some(e => String(e.inventoryId) === String(item.id)))
                    .sort((a, b) => new Date(b.datum) - new Date(a.datum))[0];
                
                if (lastJob) {
                    const date = lastJob.datum ? lastJob.datum.split('T')[0] : 'Inget datum';
                    lastSoldInfo = `
                        <div style="margin-top: 4px; display: flex; align-items: flex-start; gap: 5px; color: #e11d48; font-size: 0.68rem; font-weight: 600; letter-spacing: -0.1px; line-height: 1.3;">
                            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" style="flex-shrink:0; margin-top: 1px;">
                                <circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline>
                            </svg>
                            <div style="word-break: break-word; flex: 1;">
                                SIST: ${date} • ${lastJob.kundnamn}
                            </div>
                        </div>`;
                }
            }

            return `
                    <div class="article-card-pro" onclick="window.toggleArticleExpand(event, this)">                    <div class="card-img-box-pro">
                        <svg viewBox="0 0 24 24" width="46" height="46">${iconContent}</svg>
                    </div>
                    <div class="card-info-pro">
                        <div class="card-id-label">ARTIKELNR: ${String(item.id || "").toUpperCase()}</div>
                        <h3>${item.name || 'Namnlös'}</h3>
                        <div class="card-ref-pro">Ref: ${item.service_filter || '-'}</div>
                        
                        ${lastSoldInfo}
                        
                        ${notes ? `
                            <div class="card-notes-pro" style="margin-top: 8px; font-size: 0.70rem; color: #64748b; font-style: italic; border-top: 1px solid #f1f5f9; padding-top: 4px;">
                                "${notes.length > 80 ? notes.substring(0, 80) + '...' : notes}"
                            </div>
                        ` : ''}
                    </div>
                    <div class="card-actions-pro">
                        <div class="card-price-container-pro" style="display: flex; flex-direction: column; align-items: flex-end; gap: 6px;">
                            <div class="card-price-pro">${item.price || 0}:-</div>
                        </div>
                        <div class="stock-pill ${qty > 0 ? 'stock-in' : 'stock-out'}">${qty} st i lager</div>
                        <button class="btn-redigera-pro" onclick='window.editLagerItemById("${item.id}")'>REDIGERA</button>
                    </div>
                </div>`;
        }).join('');
    }

    const statsEl = document.getElementById('paginationStats');
    if (statsEl) statsEl.textContent = `Visar ${filtered.length} av ${items.length}`;
}

window.toggleArticleExpand = (event, cardElement) => {
    // Förhindra expandering om man klickar på knappar eller länkar
    if (event.target.closest('button') || event.target.closest('a')) {
        return;
    }
    
    const notesElement = cardElement.querySelector('.card-notes-pro');
    if (notesElement) {
        notesElement.classList.toggle('full-text');
    }
};

// 3. FIX: Kopplar funktionen korrekt till det globala fönstret
window.editLagerItemById = (id) => {
    const item = window.allItemsCache.find(i => String(i.id) === String(id));
    if (item) {
        // Lägg till ett (1) steg i historiken för att hantera bakåt-gesten korrekt
        window.addHistoryState('lagerDrawer');

        document.getElementById('editItemId').value = item.id;
        document.getElementById('editItemName').value = item.name || '';
        document.getElementById('editItemPrice').value = item.price || 0;
        document.getElementById('editItemCategory').value = item.category || 'Service';
        document.getElementById('editItemQty').value = item.quantity || 0;
        document.getElementById('editItemRefNum').value = item.service_filter || '';
        document.getElementById('editItemNotes').value = item.notes || '';
        
        // Öppna drawern visuellt
        document.getElementById('lagerDrawer').classList.add('open');
        document.getElementById('lagerDrawerOverlay').classList.add('show');

        // Uppdatera titeln i drawern
        const titleEl = document.querySelector('#lagerDrawer .std-title');
        if (titleEl) titleEl.textContent = "Redigera Artikel";
    }
};

window.closeLagerDrawer = (isPopState = false) => {
    document.getElementById('lagerDrawer').classList.remove('open');
    document.getElementById('lagerDrawerOverlay').classList.remove('show');

    // Om vi stängde via krysset (inte swipe), ta bort steget från historiken
    if (!isPopState && history.state && history.state.drawerOpen) {
        history.back();
    }
};

// --- FUNKTION FÖR ATT ÖPPNA FÖR NY ARTIKEL ---
window.openNewLagerItemDrawer = (prefillRef = "") => {
    // Registrera tillståndet i historiken
    window.addHistoryState('lagerDrawer');
    
    // Rensa alla fält för en ny artikel
    document.getElementById('editItemId').value = "";
    document.getElementById('editItemName').value = "";
    document.getElementById('editItemPrice').value = "";
    document.getElementById('editItemCategory').value = "Service";
    document.getElementById('editItemQty').value = "";
    document.getElementById('editItemRefNum').value = prefillRef.toUpperCase();
    document.getElementById('editItemNotes').value = "";
    
    const titleEl = document.querySelector('#lagerDrawer .std-title');
    if (titleEl) titleEl.textContent = "Ny Artikel";

    // Öppna drawern visuellt
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

window.getCategoryIconHtml = getCategoryIconHtml;
window.getAllSupplierLinks = getAllSupplierLinks;
