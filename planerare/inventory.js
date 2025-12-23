// inventory.js

const lagerFirebaseConfig = {
    apiKey: "AIzaSyAC4SLwVEzP3CPO4lLfDeZ71iU0xdr49sw", 
    authDomain: "lagerdata-a9b39.firebaseapp.com",
    projectId: "lagerdata-a9b39",
    storageBucket: "lagerdata-a9b39.firebasestorage.app",
    messagingSenderId: "615646392577",
    appId: "1:615646392577:web:fd816443728e88b218eb00"
};

const lagerApp = firebase.initializeApp(lagerFirebaseConfig, "lagerApp");
export const lagerDb = lagerApp.firestore();

// CACHE-LOGIK
let cachedInventory = [];
let isCacheLoaded = false;

export async function loadInventoryCache() {
    try {
        const snapshot = await lagerDb.collection('lager').get();
        cachedInventory = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
            isLager: true
        }));
        isCacheLoaded = true;
        console.log(`Lager-cache laddad: ${cachedInventory.length} artiklar.`);
    } catch (err) {
        console.error("Kunde inte ladda lager-cache:", err);
    }
}

export async function searchLager(term) {
    const searchTerm = term.toUpperCase();
    if (!isCacheLoaded) await loadInventoryCache();

    return cachedInventory.filter(item => 
        (item.name && item.name.toUpperCase().includes(searchTerm)) || 
        (item.service_filter && item.service_filter.toUpperCase().includes(searchTerm))
    );
}

export async function adjustPartStock(lagerId, change) {
    if (!lagerId) return;
    try {
        await lagerDb.collection('lager').doc(lagerId).update({
            quantity: firebase.firestore.FieldValue.increment(change)
        });
        const index = cachedInventory.findIndex(item => item.id === lagerId);
        if (index !== -1) cachedInventory[index].quantity += change;
    } catch (err) {
        console.error("Kunde inte uppdatera lagersaldo:", err);
    }
}

export async function handleExpenseLagerSearch(e) {
    const term = e.target.value.trim();
    const dropdown = document.getElementById('lagerExpenseSuggestions');
    if (term.length < 2) { dropdown?.classList.remove('show'); return; }

    const results = await searchLager(term);
    if (results.length > 0) {
        dropdown.innerHTML = results.map(item => {
            const safeName = `${item.service_filter || '---'} - ${item.name || ''}`.replace(/'/g, "\\'");
            return `<div class="suggestion-item" onclick="window.selectLagerForExpense('${item.id}', '${safeName}', ${item.price})">
                <div><div class="s-name">${item.service_filter || '---'}</div><div style="font-size:0.7rem; color:#64748b;">${item.name || ''}</div></div>
                <div style="text-align:right;"><div style="font-weight:800;">${item.price}:-</div><div class="s-stock" style="color:${item.quantity > 0 ? '#16a34a' : '#ef4444'}">Saldo: ${item.quantity}</div></div>
            </div>`;
        }).join('');
        dropdown.classList.add('show');
    } else { dropdown?.classList.remove('show'); }
}

export function selectLagerForExpense(id, name, price) {
    const nameInput = document.getElementById('nyUtgiftNamn');
    const priceInput = document.getElementById('nyUtgiftPris');
    if (nameInput) { nameInput.dataset.selectedLagerId = id; nameInput.value = name; }
    if (priceInput) priceInput.value = price;
    document.getElementById('lagerExpenseSuggestions')?.classList.remove('show');
    priceInput?.focus();
}
