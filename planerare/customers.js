// customers.js
import { db } from './firebase-config.js';

export let cachedCustomers = [];

export async function loadCustomersCache() {
    try {
        const snapshot = await db.collection('jobs').get();
        const seenNames = new Set();
        const customers = [];

        snapshot.forEach(doc => {
            const data = doc.data();
            // ÄNDRAT: Använd 'kundnamn' och 'telefon' för att matcha app.js
            const name = data.kundnamn ? data.kundnamn.trim() : "";
            if (name && !seenNames.has(name.toLowerCase())) {
                customers.push({
                    name: name,
                    phone: data.telefon || data.phone || ''
                });
                seenNames.add(name.toLowerCase());
            }
        });

        cachedCustomers = customers;
        console.log(`Kund-cache laddad: ${cachedCustomers.length} unika kunder.`);
    } catch (err) {
        console.error("Kunde inte ladda kund-cache:", err);
    }
}

export function searchCustomersLocal(term) {
    if (!term) return [];
    const searchTerm = term.toLowerCase();
    return cachedCustomers.filter(c => 
        c.name.toLowerCase().includes(searchTerm) || 
        (c.phone && c.phone.includes(searchTerm))
    );
}

export function addCustomerToCache(customer) {
    if (!customer || !customer.name) return;
    const exists = cachedCustomers.some(c => c.name.toLowerCase() === customer.name.toLowerCase());
    if (!exists) {
        cachedCustomers.push({ name: customer.name, phone: customer.phone || '' });
    }
}
