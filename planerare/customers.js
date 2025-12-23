// customers.js
import { db } from './firebase-config.js';

let cachedCustomers = [];
let isCustomersLoaded = false;

/**
 * Hämtar alla unika kunder från jobb-databasen en gång.
 */
export async function loadCustomersCache() {
    try {
        const snapshot = await db.collection('jobs').get();
        const seenNames = new Set();
        const customers = [];

        snapshot.forEach(doc => {
            const data = doc.data();
            if (data.customerName && !seenNames.has(data.customerName.trim().toLowerCase())) {
                customers.push({
                    name: data.customerName,
                    phone: data.customerPhone || '',
                    email: data.customerEmail || ''
                });
                seenNames.add(data.customerName.trim().toLowerCase());
            }
        });

        cachedCustomers = customers;
        isCustomersLoaded = true;
        console.log(`Kund-cache laddad: ${cachedCustomers.length} unika kunder.`);
    } catch (err) {
        console.error("Kunde inte ladda kund-cache:", err);
    }
}

/**
 * Söker blixtsnabbt i den lokala kundlistan.
 */
export function searchCustomersLocal(term) {
    if (!term) return [];
    const searchTerm = term.toLowerCase();
    
    return cachedCustomers.filter(c => 
        c.name.toLowerCase().includes(searchTerm) || 
        (c.phone && c.phone.includes(searchTerm))
    );
}

/**
 * Lägger till en ny kund i cachen manuellt (används när ett nytt jobb sparas)
 */
export function addCustomerToCache(customer) {
    const exists = cachedCustomers.some(c => c.name.toLowerCase() === customer.name.toLowerCase());
    if (!exists) {
        cachedCustomers.push(customer);
    }
}
