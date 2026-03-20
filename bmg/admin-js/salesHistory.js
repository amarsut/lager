// admin-js/salesHistory.js
import { db } from './core.js';
import { collection, doc, getDoc, getDocs, setDoc, updateDoc } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-firestore.js";

export async function syncSalesHistory() {
    try {
        console.log("[Sales Tracker] Kör bakgrundskontroll av lagret...");

        // 1. Hämta live-bilar (Via din säkra databaskoppling)
        const invSnap = await getDoc(doc(db, "system", "inventory"));
        let liveCars = [];
        
        if (invSnap.exists() && invSnap.data().cars) {
            liveCars = invSnap.data().cars.map(c => ({
                id: String(c.id),
                brand: c.make || "",
                model: c.modelRaw || c.model || "",
                regNo: c.regNo || "",
                price: c.price?.value || 0
            }));
        }

        // 2. Hämta vår historik-lista (tracked_cars)
        const trackedSnap = await getDocs(collection(db, "tracked_cars"));
        let trackedDocs = [];
        trackedSnap.forEach(d => {
            trackedDocs.push({ id: d.id, ...d.data() });
        });

        const liveIds = liveCars.map(car => car.id);

        // 3A. Markera bilar som sålda om de försvunnit
        for (const tDoc of trackedDocs) {
            if (tDoc.status === "active" && !liveIds.includes(tDoc.id)) {
                await updateDoc(doc(db, "tracked_cars", tDoc.id), {
                    status: "sold",
                    date_removed: new Date() // Sparar exakt datum och tid
                });
                console.log(`[Sales Tracker] Bil markerad som såld: ${tDoc.regNo}`);
            }
        }

        // 3B. Lägg till helt nya bilar i historiken
        for (const car of liveCars) {
            const existing = trackedDocs.find(d => d.id === car.id);
            
            if (!existing) {
                await setDoc(doc(db, "tracked_cars", car.id), {
                    carId: car.id,
                    brand: car.brand,
                    model: car.model,
                    regNo: car.regNo,
                    price: car.price,
                    status: "active",
                    date_added: new Date()
                });
                console.log(`[Sales Tracker] Ny bil började spåras: ${car.regNo}`);
            } 
            else if (existing.status === "sold") {
                // Om en såld bil kommer tillbaka i lagret
                await updateDoc(doc(db, "tracked_cars", car.id), {
                    status: "active",
                    date_removed: null
                });
            }
        }
        
        console.log("[Sales Tracker] Kontroll slutförd!");

    } catch (err) {
        console.error("[Sales Tracker] Fel vid uppdatering av historik:", err);
    }
}