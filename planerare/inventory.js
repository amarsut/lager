// inventory.js

// 1. LAGER FIREBASE KONFIGURATION
const lagerFirebaseConfig = {
    apiKey: "AIzaSyAC4SLwVEzP3CPO4lLfDeZ71iU0xdr49sw", 
    authDomain: "lagerdata-a9b39.firebaseapp.com",
    projectId: "lagerdata-a9b39",
    storageBucket: "lagerdata-a9b39.firebasestorage.app",
    messagingSenderId: "615646392577",
    appId: "1:615646392577:web:fd816443728e88b218eb00"
};

// 2. INITIERA LAGER-APPEN
const lagerApp = firebase.initializeApp(lagerFirebaseConfig, "lagerApp");
export const lagerDb = lagerApp.firestore();

/**
 * Söker i lagret baserat på en term
 */
export async function searchLager(term) {
    const searchTerm = term.toUpperCase();
    try {
        const snapshot = await lagerDb.collection('lager').get();
        return snapshot.docs
            .map(doc => ({ id: doc.id, ...doc.data(), isLager: true }))
            .filter(item => 
                (item.name && item.name.toUpperCase().includes(searchTerm)) || 
                (item.service_filter && item.service_filter.toUpperCase().includes(searchTerm))
            );
    } catch (err) {
        console.error("Kunde inte söka i lagret:", err);
        return [];
    }
}

/**
 * Justerar lagersaldo för en specifik artikel
 */
export async function adjustPartStock(lagerId, change) {
    if (!lagerId) return;
    try {
        await lagerDb.collection('lager').doc(lagerId).update({
            quantity: firebase.firestore.FieldValue.increment(change)
        });
        console.log(`Lagersaldo uppdaterat (${change > 0 ? '+' : ''}${change})`);
    } catch (err) {
        console.error("Kunde inte uppdatera lagersaldo:", err);
    }
}

/**
 * Söklogik för utgiftsfältet i modalen (Nytt/Redigera jobb)
 */
export async function handleExpenseLagerSearch(e) {
    const term = e.target.value.trim();
    const dropdown = document.getElementById('lagerExpenseSuggestions');
    
    if (term.length < 2) {
        dropdown?.classList.remove('show');
        return;
    }

    const results = await searchLager(term);

    if (results.length > 0) {
        dropdown.innerHTML = results.map(item => {
            const combinedName = `${item.service_filter || '---'} - ${item.name || ''}`;
            const safeName = combinedName.replace(/'/g, "\\'");

            return `
                <div class="suggestion-item" onclick="window.selectLagerForExpense('${item.id}', '${safeName}', ${item.price})">
                    <div>
                        <div class="s-name">${item.service_filter || '---'}</div>
                        <div style="font-size:0.7rem; color:#64748b;">${item.name || ''}</div>
                    </div>
                    <div style="text-align:right;">
                        <div style="font-weight:800; color:#1e293b;">${item.price}:-</div>
                        <div class="s-stock" style="color:${item.quantity > 0 ? '#16a34a' : '#ef4444'}">
                            Saldo: ${item.quantity}
                        </div>
                    </div>
                </div>`;
        }).join('');
        dropdown.classList.add('show');
    } else {
        dropdown?.classList.remove('show');
    }
}

/**
 * När man väljer en del från förslagslistan
 */
export function selectLagerForExpense(id, name, price) {
    const nameInput = document.getElementById('nyUtgiftNamn');
    const priceInput = document.getElementById('nyUtgiftPris');
    const dropdown = document.getElementById('lagerExpenseSuggestions');

    if (nameInput) {
        nameInput.dataset.selectedLagerId = id;
        nameInput.value = name;
    }
    if (priceInput) priceInput.value = price;

    dropdown?.classList.remove('show');
    priceInput?.focus();
}
