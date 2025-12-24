/* =========================================
   INVENTORY SEARCH - FIXAD FÖR SERVICE_FILTER
   ========================================= */

const inventoryFirebaseConfig = {
    apiKey: "AIzaSyAC4SLwVEzP3CPO4lLfDeZ71iU0xdr49sw",
    authDomain: "lagerdata-a9b39.firebaseapp.com",
    projectId: "lagerdata-a9b39",
    storageBucket: "lagerdata-a9b39.firebasestorage.app",
    messagingSenderId: "615646392577",
    appId: "1:615646392577:web:fd816443728e88b218eb00"
};

let inventoryApp;
if (!firebase.apps.find(app => app.name === "inventoryApp")) {
    inventoryApp = firebase.initializeApp(inventoryFirebaseConfig, "inventoryApp");
} else {
    inventoryApp = firebase.app("inventoryApp");
}
const invDb = inventoryApp.firestore();
window.invDb = invDb;

async function searchInInventory(searchTerm) {
    if (!searchTerm || searchTerm.length < 2) return [];
    
    const term = searchTerm.toLowerCase().trim();
    const cleanTerm = term.replace(/[\s-]/g, ''); 

    try {
        const snapshot = await invDb.collection("lager").get();
        
        // Vi använder en Map för att lagra unika artiklar
        const uniqueResults = new Map();

        snapshot.forEach(doc => {
            const item = doc.data();
            
            const name = (item.name || "").toLowerCase();
            const serviceFilter = (item.service_filter || "").toLowerCase();
            const notes = (item.notes || "").toLowerCase();
            const cleanFilter = serviceFilter.replace(/[\s-]/g, ''); 

            // Söklogik: Matcha namn, anteckningar eller service_filter
            const isMatch = name.includes(term) || 
                            notes.includes(term) || 
                            serviceFilter.includes(term) || 
                            (cleanFilter.length > 0 && cleanFilter.includes(cleanTerm));

            if (isMatch) {
                // Skapa en unik nyckel baserat på artikelnumret (eller namn om nummer saknas)
                const articleKey = (serviceFilter || name).trim();

                if (uniqueResults.has(articleKey)) {
                    // Om artikeln redan finns i listan, addera lagersaldot till den befintliga träffen
                    const existingItem = uniqueResults.get(articleKey);
                    const currentQty = parseInt(existingItem.quantity) || 0;
                    const newQty = parseInt(item.quantity) || 0;
                    existingItem.quantity = currentQty + newQty;
                } else {
                    // Om det är första gången vi ser artikeln, lägg till den i Map:en
                    uniqueResults.set(articleKey, { id: doc.id, ...item });
                }
            }
        });

        // Gör om vår Map till en vanlig array som app.js förväntar sig
        const finalResults = Array.from(uniqueResults.values());
        
        console.log(`Sökning klar. Hittade ${finalResults.length} unika artiklar.`);
        return finalResults;
    } catch (error) {
        console.error("Fel vid sökning:", error);
        return [];
    }
}

window.createInventoryResultHTML = function(item) {
    const isOutOfStock = (item.quantity || 0) <= 0;
    const iconSvg = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><path d="M12 2l9 4.9V17.1L12 22l-9-4.9V6.9L12 2z"/></svg>`;
    
    return `
        <div class="inv-card-pro ${isOutOfStock ? 'is-empty' : ''}" 
             onclick="openNewJobWithPart('${item.name.replace(/'/g, "\\'")}', ${item.price})">
            <div class="inv-card-icon">${iconSvg}</div>
            <div class="inv-card-content">
                <div class="inv-card-top-row">
                    <span class="inv-card-name">${item.name}</span>
                    <span class="inv-card-price">${item.price}:-</span>
                </div>
                <div class="inv-card-meta">
                    Ref: ${item.service_filter || '-'} • ${isOutOfStock ? 'SLUT' : 'Lager: ' + item.quantity}
                </div>
            </div>
        </div>
    `;
};

window.searchInInventory = searchInInventory;
