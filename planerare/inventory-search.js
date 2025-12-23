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
    return `
        <div class="inventory-search-result" style="padding: 12px; border-bottom: 1px solid #eee; display: flex; justify-content: space-between; align-items: center; background: #fffcf0; border-left: 4px solid #f59e0b;">
            <div style="display: flex; align-items: center; gap: 12px;">
                <div style="background: #f59e0b; color: white; padding: 6px; border-radius: 6px; display: flex;">
                    <svg style="width: 16px; height: 16px;" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path></svg>
                </div>
                <div>
                    <div style="font-weight: 700; font-size: 0.85rem; color: #111;">${item.name}</div>
                    <div style="font-size: 0.7rem; color: #64748b;">Ref: ${item.service_filter || '-'} • Lager: ${item.quantity || 0} st</div>
                </div>
            </div>
            <div style="display: flex; align-items: center; gap: 8px;">
                <div style="font-weight: 700; font-size: 0.85rem; color: #111;">${item.price} kr</div>
                <button onclick="addInventoryItemToJob('${item.name.replace(/'/g, "\\'")}', ${item.price})" 
                        style="background: #3b82f6; color: white; border: none; padding: 5px 10px; border-radius: 6px; font-size: 0.7rem; font-weight: 600; cursor: pointer;">
                    Välj
                </button>
            </div>
        </div>
    `;
};

window.searchInInventory = searchInInventory;
