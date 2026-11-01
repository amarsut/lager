const PROJECT_ID = "planerare-f6006"; 
const COLLECTION = "vehicleSpecs";

async function saveVehicleToCloud(vehicleData) {
    if (!vehicleData || !vehicleData.regnr) return;

    const url = `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents/${COLLECTION}/${vehicleData.regnr}`;
    
    const firestoreData = {
        fields: {
            regnr: { stringValue: vehicleData.regnr || "" },
            modell: { stringValue: vehicleData.bilmodell || "" },
            miltal: { stringValue: vehicleData.miltal || "" },
            status: { stringValue: vehicleData.status || "" },
            senast_uppdaterad: { timestampValue: new Date().toISOString() },
            komplettData: { stringValue: JSON.stringify(vehicleData) },
            os_key: { stringValue: "BMG_AUTO_2026" } 
        }
    };

    try {
        const response = await fetch(url, {
            method: 'PATCH', 
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(firestoreData)
        });

        if (response.ok) {
            console.log(`[Firebase] Synkade ${vehicleData.regnr} till vehicleSpecs!`);
        } else {
            console.error("[Firebase] Något gick fel vid synkning:", await response.text());
        }
    } catch (error) {
        console.error("[Firebase] Nätverksfel vid synkning:", error);
    }
}

async function saveHistoryToCloud(historyArray) {
    const url = `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents/${COLLECTION}/EXTENSION_HISTORY`;
    
    const firestoreData = {
        fields: {
            history_json: { stringValue: JSON.stringify(historyArray) },
            os_key: { stringValue: "BMG_AUTO_2026" }
        }
    };

    try {
        await fetch(url, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(firestoreData) });
    } catch (error) {
        console.error("[Firebase] Fel vid historik-synk:", error);
    }
}

async function getHistoryFromCloud() {
    const url = `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents/${COLLECTION}/EXTENSION_HISTORY`;
    try {
        const response = await fetch(url);
        if (response.ok) {
            const data = await response.json();
            if (data && data.fields && data.fields.history_json) {
                return JSON.parse(data.fields.history_json.stringValue);
            }
        }
    } catch (error) {
        console.error("[Firebase] Fel vid hämtning av historik:", error);
    }
    return null;
}