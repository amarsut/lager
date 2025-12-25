/* =========================================
   UNIFIERAD INVENTORY SEARCH MED CACHE
   ========================================= */

const inventoryFirebaseConfig = {
    apiKey: "AIzaSyAC4SLwVEzP3CPO4lLfDeZ71iU0xdr49sw",
    authDomain: "lagerdata-a9b39.firebaseapp.com",
    projectId: "lagerdata-a9b39",
    storageBucket: "lagerdata-a9b39.firebasestorage.app",
    messagingSenderId: "615646392577",
    appId: "1:615646392577:web:fd816443728e88b218eb00"
};

// Initiera Inventory App separat från huvud-appen
let inventoryApp;
if (!firebase.apps.find(app => app.name === "inventoryApp")) {
    inventoryApp = firebase.initializeApp(inventoryFirebaseConfig, "inventoryApp");
} else {
    inventoryApp = firebase.app("inventoryApp");
}

const invDb = inventoryApp.firestore();
window.invDb = invDb;

// --- CACHE-LOGIK FÖR BLIXTSNABB SÖKNING ---
window.inventoryCache = [];

/**
 * Laddar in hela lagret i minnet vid start för att undvika nätverks-lagg vid sökning.
 */
function initInventoryCache() {
    invDb.collection("lager").onSnapshot(snapshot => {
        window.inventoryCache = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        console.log("Lager-cache uppdaterad i realtid");
    });
}

/**
 * Söker i den lokala cachen istället för att göra nya databasanrop.
 */
async function searchInInventory(searchTerm) {
    if (!searchTerm || searchTerm.length < 2) return [];
    
    const term = searchTerm.toLowerCase().trim();
    const cleanTerm = term.replace(/[\s-]/g, ''); 

    // Sök i cachen: Matcha namn, ref/artikelnr eller kommentarer
    const results = window.inventoryCache.filter(item => {
        const name = (item.name || "").toLowerCase();
        const ref = (item.service_filter || "").toLowerCase();
        const notes = (item.notes || "").toLowerCase();
        const cleanRef = ref.replace(/[\s-]/g, '');

        return name.includes(term) || 
               notes.includes(term) || 
               ref.includes(term) || 
               (cleanRef.length > 0 && cleanRef.includes(cleanTerm));
    });

    // Returnera de 5 bästa träffarna för att hålla listan ren
    return results.slice(0, 5);
}

/**
 * Skapar HTML för ett kompakt lagerkort i sökresultaten.
 */
window.createInventoryResultHTML = function(item) {
    const qty = parseInt(item.quantity) || 0;
    const isOutOfStock = qty <= 0;
    const price = item.price || 0;
    const notes = item.notes || "";
    
    const iconContent = window.getCategoryIconHtml ? window.getCategoryIconHtml(item.category, item.name) : '';
    const supplierLinks = window.getAllSupplierLinks ? window.getAllSupplierLinks(item.service_filter || item.name) : [];

    // Logik för "SIST SÅLD"
    let lastSoldInfo = "";
    if (isOutOfStock && window.allJobs) {
        const lastJob = window.allJobs
            .filter(j => !j.deleted && Array.isArray(j.utgifter) && j.utgifter.some(e => String(e.inventoryId) === String(item.id)))
            .sort((a, b) => new Date(b.datum) - new Date(a.datum))[0];
        
        if (lastJob) {
            const date = lastJob.datum ? lastJob.datum.split('T')[0] : 'Inget datum';
            lastSoldInfo = `
                <div style="margin-top: 4px; display: flex; align-items: center; gap: 4px; color: #e11d48; font-size: 0.65rem; font-weight: 700;">
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
                    <span>SIST: ${date} • ${lastJob.kundnamn}</span>
                </div>`;
        }
    }

    return `
    <div class="article-card-pro search-result-card ${isOutOfStock ? 'stock-out-bg' : ''}" 
         onclick="window.openNewJobWithPart('${item.name.replace(/'/g, "\\'")}', ${price}, '${item.id}')"
         style="cursor: pointer; margin-bottom: 0px; display: flex; align-items: stretch; min-height: 110px; padding: 12px; border-radius: 12px; border: 1px solid #e2e8f0; background: #fff;">
        
        <div class="card-img-box-pro" style="width: 50px; flex-shrink: 0; display: flex; align-items: center; justify-content: center; background: #f8fafc; border-radius: 8px; margin-right: 12px;">
            <svg viewBox="0 0 24 24" width="28" height="28">${iconContent}</svg>
        </div>

        <div class="card-info-pro" style="flex: 1; display: flex; flex-direction: column; justify-content: center; min-width: 0;">
            <div style="font-size: 0.6rem; color: #94a3b8; font-weight: 700; letter-spacing: 0.5px;">ARTIKELNR: ${String(item.id || "").toUpperCase()}</div>
            
            <h3 style="margin: 2px 0; font-size: 0.95rem; line-height: 1.2; color: #1e293b; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">
                ${item.name || 'Namnlös'}
            </h3>
            
            <div style="font-size: 0.75rem; color: #64748b;">Ref: ${item.service_filter || '-'}</div>
            
            ${lastSoldInfo}
            
            ${notes ? `
                <div style="margin-top: 4px; font-size: 0.7rem; color: #64748b; font-style: italic; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; line-height: 1.3;">
                    "${notes}"
                </div>
            ` : ''}
        </div>

        <div class="card-actions-pro" style="width: 90px; flex-shrink: 0; display: flex; flex-direction: column; align-items: flex-end; justify-content: space-between; border-left: 1px solid #f1f5f9; padding-left: 10px; margin-left: 10px;">
            <div style="text-align: right;">
                <div style="font-size: 1.1rem; font-weight: 800; color: #0f172a;">${price}:-</div>
                <div class="supplier-compare-row" style="display: flex; gap: 4px; margin-top: 4px; justify-content: flex-end;">
                    ${supplierLinks.map(s => `
                        <a href="${s.url}" target="_blank" onclick="event.stopPropagation();"
                           style="background-color: ${s.color}; width: 18px; height: 18px; border-radius: 50%; display: flex; align-items: center; justify-content: center; color: #fff; font-size: 8px; font-weight: 900; text-decoration: none;">
                           ${s.name.charAt(0)}
                        </a>
                    `).join('')}
                </div>
            </div>
            
            <div class="stock-pill ${!isOutOfStock ? 'stock-in' : 'stock-out'}" style="font-size: 0.65rem; padding: 2px 6px; white-space: nowrap;">
                ${qty} i lager
            </div>
        </div>
    </div>
    `;
};

window.searchInInventory = searchInInventory;

// Starta inläsningen av cachen omedelbart
initInventoryCache();

// Fix för mobilfel: Koppla den mobila sökfunktionen till den befintliga söklogiken
window.performMobileSearch = function(query) {
    const mainSearchInput = document.getElementById('searchBar');

    if (mainSearchInput) {
        // 1. Skriv in sökordet i det dolda/vanliga sökfältet
        mainSearchInput.value = query;

        // 2. Trigga de händelser som app.js lyssnar på (input och keyup)
        mainSearchInput.dispatchEvent(new Event('input', { bubbles: true }));
        mainSearchInput.dispatchEvent(new Event('keyup', { bubbles: true }));
    } else {
        console.error("Kunde inte hitta fältet #searchBar. Kontrollera att ID:t stämmer i HTML.");
    }
};
