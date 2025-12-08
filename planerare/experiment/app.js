// 1. FIREBASE KONFIGURATION
const firebaseConfig = {
  apiKey: "AIzaSyDwCQkUl-je3L3kF7EuxRC6Dm6Gw2N0nJw",
  authDomain: "planerare-f6006.firebaseapp.com",
  projectId: "planerare-f6006",
  storageBucket: "planerare-f6006.firebasestorage.app",
  messagingSenderId: "360462069749",
  appId: "1:360462069749:web:c754879f3f75d5ef3cbabc",
  measurementId: "G-L6516XLZ1Y"
};

let db;
let allJobs = []; 
let currentStatusFilter = 'kommande'; 
let currentSearchTerm = '';
let currentExpenses = [];

// 2. INITIERA APPEN
document.addEventListener('DOMContentLoaded', function() {
    try {
        if (!firebase.apps.length) {
            firebase.initializeApp(firebaseConfig);
        }
        db = firebase.firestore();
        console.log("Firebase ansluten.");
        initRealtimeListener();
        setupEventListeners();
    } catch (e) {
        console.error("Kunde inte starta Firebase:", e);
        alert("Ett fel uppstod vid start av databasen.");
    }
});

// 3. HÄMTA DATA
function initRealtimeListener() {
    const container = document.getElementById('jobListContainer');
    db.collection("jobs").onSnapshot(snapshot => {
        allJobs = [];
        snapshot.forEach(doc => {
            allJobs.push({ id: doc.id, ...doc.data() });
        });
        renderDashboard();
    }, error => {
        console.error("Fel vid hämtning av jobb:", error);
        if (error.code === 'permission-denied') {
            container.innerHTML = `<div style="text-align:center; padding: 2rem;"><h3>Behörighet saknas!</h3></div>`;
        }
    });
}

// 4. RENDERA DASHBOARD
function renderDashboard() {
    let jobsToDisplay = filterJobs(allJobs);
    updateStatsCounts(allJobs); // Uppdatera siffrorna i korten

    const container = document.getElementById('jobListContainer');
    
    if (jobsToDisplay.length === 0) {
        container.innerHTML = '<p style="text-align:center; padding:2rem; color:#888;">Inga jobb hittades för detta filter.</p>';
        return;
    }

    let tableHTML = `
        <table id="jobsTable">
            <thead>
                <tr>
                    <th>Status</th>
                    <th>Datum</th>
                    <th>Kund</th>
                    <th>Reg.nr</th>
                    <th style="text-align:right">Kundpris</th>
                    <th class="action-col">Åtgärder</th>
                </tr>
            </thead>
            <tbody>
    `;

    jobsToDisplay.forEach(job => {
        tableHTML += createJobRow(job);
    });

    tableHTML += `</tbody></table>`;
    container.innerHTML = tableHTML;
}

// Hjälpfunktion: Skapa HTML för en rad
function createJobRow(job) {
    const statusText = {
        'bokad': 'Bokad', 'klar': 'Slutfört', 'faktureras': 'Fakturering', 'offererad': 'Offererad'
    };
    
    // Datumformatering
    let fullDate = "---";
    if (job.datum) {
        try {
            const d = new Date(job.datum);
            const dateStr = d.toLocaleDateString('sv-SE', { weekday: 'short', day: 'numeric', month: 'short' });
            const timeStr = d.toLocaleTimeString('sv-SE', { hour: '2-digit', minute: '2-digit' });
            const capDateStr = dateStr.charAt(0).toUpperCase() + dateStr.slice(1);
            fullDate = `${capDateStr}. kl. ${timeStr.replace('.', ':')}`;
        } catch(e) {}
    }

    // Företagskunds-logik
    const nameLower = (job.kundnamn || '').toLowerCase();
    const isCorporate = ['bmg', 'fogarolli', 'huse'].some(c => nameLower.includes(c));
    
    const iconType = isCorporate ? '#icon-office-building' : '#icon-user';
    const iconColor = isCorporate ? '#10B981' : '#0066FF'; 

    // Reg-skylt
	const regPlate = (job.regnr && job.regnr.toUpperCase() !== 'OKÄNT') 
	    ? `<div class="reg-plate" style="cursor:pointer;" onclick="event.stopPropagation(); openVehicleModal('${job.regnr}')">
	         <span class="reg-country">S</span>
	         <span class="reg-number">${job.regnr}</span>
	       </div>` 
	    : '---';

    // OBS: onclick="event.stopPropagation()" på knapparna förhindrar att redigeringsmodalen öppnas när man klickar på dem.
    return `
        <tr data-id="${job.id}" class="job-row">
            <td><span class="status-badge status-${job.status}">${statusText[job.status] || job.status}</span></td>
            <td>${fullDate}</td>
            <td>
                <div class="customer-link">
                    <svg class="icon-sm" style="color: ${iconColor}"><use href="${iconType}"></use></svg>
                    <span>${job.kundnamn}</span>
                </div>
            </td>
            <td>${regPlate}</td>
            <td style="text-align:right" class="money-related">${job.kundpris || 0} kr</td>
            <td class="action-col">
                <button class="icon-btn" title="Chatt" onclick="event.stopPropagation(); alert('Funktion kommer snart')"><svg class="icon-sm"><use href="#icon-chat"></use></svg></button>
                <button class="icon-btn" title="Prio" onclick="event.stopPropagation()"><svg class="icon-sm"><use href="#icon-flag"></use></svg></button>
                <button class="icon-btn" title="Klar" onclick="event.stopPropagation(); setStatus('${job.id}', 'klar')"><svg class="icon-sm"><use href="#icon-check"></use></svg></button>
                <button class="icon-btn" title="Radera" onclick="event.stopPropagation(); deleteJob('${job.id}')"><svg class="icon-sm"><use href="#icon-trash"></use></svg></button>
            </td>
        </tr>
    `;
}

// 5. FILTER-LOGIK
function filterJobs(jobs) {
    let filtered = jobs.filter(j => !j.deleted);

    if (currentSearchTerm) {
        const term = currentSearchTerm.toLowerCase();
        filtered = filtered.filter(j => 
            (j.kundnamn && j.kundnamn.toLowerCase().includes(term)) || 
            (j.regnr && j.regnr.toLowerCase().includes(term))
        );
        return filtered.sort((a,b) => new Date(b.datum) - new Date(a.datum));
    }

    const today = new Date();
    today.setHours(0,0,0,0);

    if (currentStatusFilter === 'kommande') {
        return filtered.filter(j => j.status === 'bokad' && new Date(j.datum) >= today).sort((a,b) => new Date(a.datum) - new Date(b.datum));
    } else if (currentStatusFilter === 'alla') {
        return filtered.sort((a,b) => new Date(b.datum) - new Date(a.datum));
    } else {
        return filtered.filter(j => j.status === currentStatusFilter);
    }
}

// 6. UPPDATERA BADGES (SIFFROR)
function updateStatsCounts(jobs) {
    const active = jobs.filter(j => !j.deleted);
    const today = new Date(); today.setHours(0,0,0,0);

    document.getElementById('stat-upcoming').textContent = active.filter(j => j.status === 'bokad' && new Date(j.datum) >= today).length;
    document.getElementById('stat-invoice').textContent = active.filter(j => j.status === 'faktureras').length;
    document.getElementById('stat-finished').textContent = active.filter(j => j.status === 'klar').length;
    document.getElementById('stat-offered').textContent = active.filter(j => j.status === 'offererad').length;
    document.getElementById('stat-all').textContent = active.length;
}

// 7. EVENT LISTENERS
function setupEventListeners() {
    
    // Hantera klick på statistik-korten (Filter)
    document.querySelectorAll('.stat-card').forEach(card => {
        card.addEventListener('click', () => {
            document.querySelectorAll('.stat-card').forEach(c => c.classList.remove('active'));
            card.classList.add('active');
            currentStatusFilter = card.dataset.filter;
            currentSearchTerm = '';
            document.getElementById('searchBar').value = '';
            renderDashboard();
        });
    });

    // Hantera klick på rader i tabellen (Redigera jobb)
    document.getElementById('jobListContainer').addEventListener('click', (e) => {
        // Hitta närmaste tr-element (rad)
        const row = e.target.closest('tr');
        // Om vi klickade på en rad och den har ett ID
        if (row && row.dataset.id) {
            openEditModal(row.dataset.id);
        }
    });

    // Sökfältet
    document.getElementById('searchBar').addEventListener('input', (e) => {
        currentSearchTerm = e.target.value;
        renderDashboard();
    });

    // Modal: Nytt Jobb (FAB)
    document.getElementById('fabAddJob').addEventListener('click', () => {
        openNewJobModal();
    });

    // Stäng-knappar
    document.getElementById('modalCloseBtn').addEventListener('click', closeModals);
    document.getElementById('modalCancelBtn').addEventListener('click', closeModals);
    
    // Spara jobb (Både nytt och redigerat)
    document.getElementById('jobModalForm').addEventListener('submit', handleSaveJob);
}

// --- MODAL FUNKTIONER ---

function openNewJobModal() {
    const form = document.getElementById('jobModalForm');
    form.reset();
    document.getElementById('jobId').value = "";
    document.getElementById('modalTitle').textContent = "Lägg till nytt jobb";
    document.getElementById('datum').valueAsDate = new Date();
    document.getElementById('tid').value = "08:00";
    document.getElementById('statusSelect').value = "bokad";
    
    // Nollställ utgifter
    currentExpenses = [];
    renderExpenses();

    document.getElementById('jobModal').classList.add('show');
}

function openEditModal(id) {
    const job = allJobs.find(j => j.id === id);
    if (!job) return;

    // Sätt ID och Titel
    document.getElementById('jobId').value = job.id;
    document.getElementById('modalTitle').textContent = "Redigera jobb";

    // Fyll i standardfält
    document.getElementById('kundnamn').value = job.kundnamn || '';
    document.getElementById('regnr').value = job.regnr || '';
    document.getElementById('kundpris').value = job.kundpris || 0;
    document.getElementById('statusSelect').value = job.status || 'bokad';
    document.getElementById('paketSelect').value = job.paket || '';     // NYTT
    document.getElementById('kommentar').value = job.kommentar || '';   // NYTT

    // Datum och Tid
    if (job.datum && job.datum.includes('T')) {
        const parts = job.datum.split('T');
        document.getElementById('datum').value = parts[0];
        document.getElementById('tid').value = parts[1];
    }

    // UTGIFTER: Ladda in och rendera
	currentExpenses = Array.isArray(job.utgifter) ? job.utgifter : []; 
	renderExpenses();

    document.getElementById('jobModal').classList.add('show');
}

function closeModals() {
    document.querySelectorAll('.modal-backdrop').forEach(m => m.classList.remove('show'));
}

// 8. DATABAS-FUNKTIONER

async function handleSaveJob(e) {
    e.preventDefault();
    
    const jobId = document.getElementById('jobId').value;
    const kund = document.getElementById('kundnamn').value; // Namn kan vara case-sensitive om man vill, annars .toUpperCase()
    const reg = document.getElementById('regnr').value.toUpperCase();
    const datum = document.getElementById('datum').value;
    const tid = document.getElementById('tid').value;
    const pris = parseInt(document.getElementById('kundpris').value) || 0;
    const status = document.getElementById('statusSelect').value;
    const paket = document.getElementById('paketSelect').value; // NYTT
    const kommentar = document.getElementById('kommentar').value; // NYTT

    const jobData = {
        kundnamn: kund,
        regnr: reg,
        datum: `${datum}T${tid}`,
        kundpris: pris,
        status: status,
        paket: paket,           // Spara paket
        kommentar: kommentar,   // Spara kommentar
        utgifter: currentExpenses, // Spara listan med utgifter
        deleted: false
    };

    try {
        if (jobId) {
            await db.collection("jobs").doc(jobId).update(jobData);
        } else {
            jobData.created = new Date().toISOString();
            await db.collection("jobs").add(jobData);
        }
        closeModals();
        document.getElementById('jobModalForm').reset();
    } catch (err) {
        console.error("Fel vid spara:", err);
        alert("Kunde inte spara.");
    }
}

async function setStatus(id, status) {
    try {
        await db.collection("jobs").doc(id).update({ status: status });
    } catch (err) { console.error(err); }
}

async function deleteJob(id) {
    if(confirm("Vill du ta bort detta jobb?")) {
        try {
            await db.collection("jobs").doc(id).update({ deleted: true });
        } catch (err) { console.error(err); }
    }
}

// Lägg till utgift-knapp
document.getElementById('btnAddExpense').addEventListener('click', () => {
    const namnInput = document.getElementById('nyUtgiftNamn');
    const prisInput = document.getElementById('nyUtgiftPris');
    
    const namn = namnInput.value.trim();
    const kostnad = parseInt(prisInput.value);

    if (namn && kostnad > 0) {
        currentExpenses.push({ namn: namn, kostnad: kostnad });
        namnInput.value = '';
        prisInput.value = '';
        renderExpenses(); // Rita om listan och räkna vinst
    }
});

// Uppdatera vinst när kundpris ändras
document.getElementById('kundpris').addEventListener('input', renderExpenses);

function renderExpenses() {
    const listContainer = document.getElementById('expenseList');
    listContainer.innerHTML = '';
    
    let totalUtgifter = 0;
    
    // Skydd: Om currentExpenses inte är en array, nollställ den och avbryt.
    if (!Array.isArray(currentExpenses)) {
        currentExpenses = [];
    }

    // Loopa igenom utgifter och skapa HTML
    currentExpenses.forEach((item, index) => {
        totalUtgifter += item.kostnad;
        
        const div = document.createElement('div');
        div.className = 'expense-item';
        div.innerHTML = `
            <span>${item.namn}</span>
            <div style="display:flex; gap:10px; align-items:center;">
                <strong>-${item.kostnad} kr</strong>
                <button type="button" class="btn-remove-expense" onclick="removeExpense(${index})">&times;</button>
            </div>
        `;
        listContainer.appendChild(div);
    });

    // Räkna ut vinst
    const kundpris = parseInt(document.getElementById('kundpris').value) || 0;
    const vinst = kundpris - totalUtgifter;

    // Uppdatera texten
    document.getElementById('utgifterDisplay').textContent = totalUtgifter;
    const vinstEl = document.getElementById('vinstDisplay');
    vinstEl.textContent = `${vinst} kr`;
    
    // Byt färg om förlust
    vinstEl.style.color = vinst >= 0 ? '#10B981' : '#EF4444';
}

// Ta bort en utgift
window.removeExpense = function(index) {
    currentExpenses.splice(index, 1);
    renderExpenses();
};

// ==========================================
// FORDONSHISTORIK & TEKNISK DATA MODAL (FIXAD)
// ==========================================

function openVehicleModal(regnr) {
    if(!regnr || regnr === '---') return;
    
    const cleanReg = regnr.replace(/\s/g, '').toUpperCase();
    const modal = document.getElementById('vehicleModal');
    
    // 1. Sätt rubriker och länkar
    document.getElementById('vehicleRegTitle').textContent = cleanReg;
    document.getElementById('linkBiluppgifter').href = `https://biluppgifter.se/fordon/${cleanReg}`;
    
    document.getElementById('btnCopyRegModal').onclick = () => {
        navigator.clipboard.writeText(cleanReg);
        showToast('Reg.nr kopierat!');
    };

    // 2. Renderar historik
    renderVehicleHistory(cleanReg);

    // 3. HANTERA TEKNISK DATA
    const dataContainer = document.getElementById('techDataContainer');
    const fetchContainer = document.getElementById('fetchDataContainer');
    const fetchBtn = document.getElementById('btnFetchTechData');
    
    // Nollställ UI
    dataContainer.style.display = 'none';
    fetchContainer.style.display = 'none';
    dataContainer.innerHTML = ''; // Töm gammalt innehåll
    
    fetchBtn.disabled = false;
    fetchBtn.innerHTML = `<svg class="icon-sm" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg> Hämta Data med AI`;

    // 4. KOLLA FIREBASE
    db.collection("vehicleSpecs").doc(cleanReg).get().then(doc => {
        if (doc.exists) {
            const data = doc.data();
            // VIKTIGT: Vi antar nu att ALL data är i nya JSON-formatet.
            // Vi har tagit bort kollen för gammal htmlContent.
            console.log("Data hittad (JSON). Renderar lista.");
            populateTechCard(data, cleanReg); // Skickar med regnr för rubriken
            dataContainer.style.display = 'block';
            fetchContainer.style.display = 'none';
        } else {
            // DATA SAKNAS
            console.log("Ingen data sparad. Visar knapp.");
            dataContainer.style.display = 'none';
            fetchContainer.style.display = 'block';
            
            fetchBtn.onclick = function() {
                fetchTechnicalData(cleanReg);
            };
        }
    }).catch(err => {
        console.error("Fel vid Firebase-koll:", err);
        fetchContainer.style.display = 'block';
    });

    modal.classList.add('show');
    document.getElementById('vehicleModalClose').onclick = () => {
        modal.classList.remove('show');
    };
}

// Denna körs när man trycker på knappen (Hämtar NY JSON-data)
async function fetchTechnicalData(regnr) {
    const cleanReg = regnr.replace(/\s/g, '').toUpperCase();
    const docRef = db.collection("vehicleSpecs").doc(cleanReg);
    const fetchBtn = document.getElementById('btnFetchTechData');

    fetchBtn.disabled = true;
    fetchBtn.innerHTML = `<span>⏳ Analyserar med AI...</span>`;

    try {
        await scrapeAndAnalyze(cleanReg, docRef);
        
        // Hämta igen för att visa
        const doc = await docRef.get();
        if(doc.exists) {
            populateTechCard(doc.data());
            document.getElementById('techDataCard').style.display = 'block';
            document.getElementById('fetchDataContainer').style.display = 'none';
            showToast('Teknisk data hämtad och sparad!', 'success');
        }

    } catch (error) {
        console.error("Fel vid AI-hämtning:", error);
        
        // Kolla om det var 403 (API Key fel)
        if (error.message.includes('403') || error.message.includes('Forbidden')) {
            showToast('Fel: Ogiltig API-nyckel.', 'danger');
        } else {
            showToast('Kunde inte hämta data. Försök igen.', 'danger');
        }
        
        fetchBtn.disabled = false;
        fetchBtn.innerHTML = `<span>Försök igen</span>`;
    }
}

async function scrapeAndAnalyze(regnr, docRef) {
    // 1. Skrapa
    const proxy = "https://corsproxy.io/?";
    const url = `https://biluppgifter.se/fordon/${regnr}`;
    
    const response = await fetch(proxy + encodeURIComponent(url));
    if (!response.ok) throw new Error("Kunde inte nå biluppgifter");
    
    const htmlText = await response.text();
    const rawText = htmlText.replace(/\s+/g, ' ').substring(0, 15000);

    // 2. Prompt för JSON
    const prompt = `
        Du är en expertmekaniker. Analysera denna rådata för bilen ${regnr}:
        """${rawText}"""

        Din uppgift: Extrahera teknisk data och returnera ENDAST ett JSON-objekt. 
        Gissa kvalificerat om exakt data saknas.
        
        Formatet ska vara exakt så här (inga markdown-backticks, bara rå JSON):
        {
            "model": "T.ex. Volvo V70 D4 (2015)",
            "engine": "T.ex. D4204T5 (181 hk)",
            "oil": "T.ex. 5.2 L • 0W-20",
            "ac": "T.ex. R134a (700g)",
            "timing_belt": "T.ex. 15 000 mil / 10 år",
            "torque": "Hjul 140 Nm • Plugg 38 Nm",
            "battery": "T.ex. 80Ah AGM (Bagage)",
            "tow_weight": "T.ex. 1800 Kg"
        }
    `;

    // 3. API Anrop
    // VIKTIGT: Byt ut CONFIG.AI_API_KEY mot din faktiska nyckelsträng om du inte har config.js laddad
    const apiKey = typeof CONFIG !== 'undefined' ? CONFIG.AI_API_KEY : 'DIN_GEMINI_API_KEY_HÄR'; 
    
    if (!apiKey || apiKey === 'DIN_GEMINI_API_KEY_HÄR') {
        throw new Error("API-nyckel saknas! Lägg in den i koden.");
    }

    const aiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;

    const aiResponse = await fetch(aiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] })
    });

    if (!aiResponse.ok) {
        throw new Error(`AI Error: ${aiResponse.status} ${aiResponse.statusText}`);
    }

    const aiData = await aiResponse.json();
    
    // 4. Parsa och spara
    let aiText = aiData.candidates[0].content.parts[0].text;
    aiText = aiText.replace(/```json/g, '').replace(/```/g, '').trim();
    
    const vehicleData = JSON.parse(aiText);

    // Spara det som rena fält i dokumentet (inte inuti htmlContent)
    await docRef.set(vehicleData);
}

function populateTechCard(data) {
    const fields = {
        'model': data.model,
        'engine': data.engine,
        'oil': data.oil,
        'ac': data.ac,
        'cam': data.timing_belt,
        'torque': data.torque,
        'battery': data.battery,
        'tow': data.tow_weight
    };

    for (const [id, value] of Object.entries(fields)) {
        const el = document.getElementById(`td-${id}`);
        if (el) {
            el.textContent = value || "Ej hittad";
            el.style.color = "#111827";
            el.style.fontWeight = "500";
        }
    }
}

function renderVehicleHistory(regnr) {
    const historyBody = document.getElementById('vehicleHistoryList');
    const searchInput = document.getElementById('vehicleHistorySearch');
    
    // Hitta alla jobb
    const history = allJobs.filter(j => j.regnr === regnr && !j.deleted)
                           .sort((a,b) => new Date(b.datum) - new Date(a.datum));

    if(history.length > 0) {
        document.getElementById('vehicleOwner').textContent = history[0].kundnamn;
    } else {
        document.getElementById('vehicleOwner').textContent = "---";
    }

    const renderRows = (jobs) => {
        historyBody.innerHTML = '';
        if (jobs.length === 0) {
            historyBody.innerHTML = '<tr><td colspan="4" style="text-align:center; color:#999; padding:20px;">Ingen historik.</td></tr>';
            return;
        }
        jobs.forEach(job => {
            let totalUtgifter = 0;
            if(job.utgifter && Array.isArray(job.utgifter)) { 
                 // Stöd för ev. array-logik om du har det
            } else { totalUtgifter = job.utgifter || 0; }
            
            const vinst = (job.kundpris || 0) - totalUtgifter;
            const dateStr = job.datum ? job.datum.split('T')[0] : '-';
            const statusHtml = `<span class="status-badge status-${job.status}" style="transform:scale(0.9); origin:left;">${job.status}</span>`;

            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td style="font-weight:600; color:#374151;">${dateStr}</td>
                <td>${job.kundnamn}</td>
                <td>${statusHtml}</td>
                <td style="text-align:right; font-weight:700;">${vinst} kr</td>
            `;
            historyBody.appendChild(tr);
        });
    };

    renderRows(history);

    searchInput.oninput = (e) => {
        const term = e.target.value.toLowerCase();
        const filtered = history.filter(j => 
            j.kundnamn.toLowerCase().includes(term) || 
            (j.kommentarer && j.kommentarer.toLowerCase().includes(term))
        );
        renderRows(filtered);
    };
}

// ==========================================
// AI & TEKNISK DATA LOGIK
// ==========================================

async function fetchTechnicalData(regnr) {
    const cleanReg = regnr.replace(/\s/g, '').toUpperCase();
    const docRef = db.collection("vehicleSpecs").doc(cleanReg);
    const fetchBtn = document.getElementById('btnFetchTechData');

    fetchBtn.disabled = true;
    fetchBtn.innerHTML = `<span>⏳ Analyserar med AI...</span>`;

    try {
        await scrapeAndAnalyze(cleanReg, docRef);
        
        // Hämta igen för att visa
        const doc = await docRef.get();
        if(doc.exists) {
            populateTechCard(doc.data(), cleanReg);
            document.getElementById('techDataContainer').style.display = 'block';
            document.getElementById('fetchDataContainer').style.display = 'none';
            showToast('Teknisk data hämtad och sparad!', 'success');
        }

    } catch (error) {
        console.error("Fel vid AI-hämtning:", error);
         if (error.message.includes('403') || error.message.includes('Forbidden')) {
            showToast('Fel: Ogiltig API-nyckel.', 'danger');
        } else {
            showToast('Kunde inte hämta data. Försök igen.', 'danger');
        }
        fetchBtn.disabled = false;
        fetchBtn.innerHTML = `<span>Försök igen</span>`;
    }
}

function populateTechCard(data, regnr) {
    const container = document.getElementById('techDataContainer');
    let html = '';

    // 1. Skapa Rubriken (Med en generell bil-ikon)
    html += `
       <div class="tech-header-main">
           <svg class="brand-icon-svg"><use href="#icon-car-tech"></use></svg>
           <h4>Teknisk Data ${regnr}</h4>
        </div>
    `;

    html += '<ul class="tech-list">';

    // 2. Definiera fälten, deras etiketter och vilken ikon de ska ha
    // Vi mappar JSON-nycklarna till dina specifika ikoner.
    const fields = [
        { key: 'model', label: 'Bil', icon: '#icon-car-tech' },
        { key: 'engine', label: 'Motor', icon: '#icon-engine-tech' },
        { key: 'oil', label: 'Motorolja', icon: '#icon-oil-tech' },
        { key: 'ac', label: 'AC', icon: '#icon-ac-tech' },
        // OBS: AI:n returnerar 'timing_belt', men vi vill visa 'Kamrem'
        { key: 'timing_belt', label: 'Kamrem', icon: '#icon-belt-tech' }, 
        { key: 'torque', label: 'Moment', icon: '#icon-torque-tech' },
        { key: 'battery', label: 'Batteri', icon: '#icon-battery-tech' },
        { key: 'tow_weight', label: 'Dragvikt', icon: '#icon-weight-tech' }
    ];

    // 3. Loopa igenom och skapa listpunkter (<li>)
    fields.forEach(field => {
        // Hämta värdet, eller visa "Ej hittad" om det är tomt/null
        const value = data[field.key] ? data[field.key] : 'Ej hittad';
        
        html += `
            <li>
                <svg class="spec-icon-svg"><use href="${field.icon}"></use></svg>
                <span><b>${field.label}:</b> ${value}</span>
            </li>
        `;
    });

    html += '</ul>';
    
    // 4. Injicera HTML:en i behållaren
    container.innerHTML = html;
}

// Skrapar Biluppgifter.se och skickar till Gemini AI
async function scrapeAndAnalyze(regnr, docRef) {
    try {
        // A. Skrapa data via Proxy
        const proxy = "https://corsproxy.io/?";
        const url = `https://biluppgifter.se/fordon/${regnr}`;
        
        const response = await fetch(proxy + encodeURIComponent(url));
        if (!response.ok) throw new Error("Kunde inte nå biluppgifter");
        
        const htmlText = await response.text();
        
        // Rensa texten lite för att spara tokens (ta de första 15k tecknen, där infon brukar finnas)
        const rawText = htmlText.replace(/\s+/g, ' ').substring(0, 15000);

        // B. Förbered AI-prompten (Be om JSON)
        const prompt = `
            Du är en expertmekaniker. Analysera denna rådata för bilen ${regnr}:
            """${rawText}"""

            Din uppgift: Extrahera teknisk data och returnera ENDAST ett JSON-objekt. 
            Gissa kvalificerat om exakt data saknas (t.ex. motorkod baserat på hk/modell).
            
            Formatet ska vara exakt så här (inga markdown-backticks, bara rå JSON):
            {
                "model": "T.ex. Volvo V70 D4 (2015)",
                "engine": "T.ex. D4204T5 (181 hk)",
                "oil": "T.ex. 5.2 L • 0W-20",
                "ac": "T.ex. R134a (700g)",
                "timing_belt": "T.ex. 15 000 mil / 10 år",
                "torque": "Hjul 140 Nm • Plugg 38 Nm",
                "battery": "T.ex. 80Ah AGM (Bagage)",
                "tow_weight": "T.ex. 1800 Kg"
            }
        `;

        // C. Anropa Gemini API
        // OBS: Byt ut CONFIG.AI_API_KEY mot din nyckel om du inte har config-filen
        const apiKey = CONFIG.AI_API_KEY; 
        const aiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;

        const aiResponse = await fetch(aiUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] })
        });

        const aiData = await aiResponse.json();
        
        // D. Parsa svaret
        let aiText = aiData.candidates[0].content.parts[0].text;
        
        // Städa bort eventuell markdown (```json ... ```)
        aiText = aiText.replace(/```json/g, '').replace(/```/g, '').trim();
        
        const vehicleData = JSON.parse(aiText);

        // E. Spara till Firebase och uppdatera UI
        await docRef.set(vehicleData);
        populateTechCard(vehicleData);

    } catch (err) {
        console.error("AI Analysis Failed:", err);
        setTechDataError();
    }
}

// Hjälpfunktion: Fyller UI med data
function populateTechCard(data) {
    const fields = {
        'model': data.model,
        'engine': data.engine,
        'oil': data.oil,
        'ac': data.ac,
        'cam': data.timing_belt,
        'torque': data.torque,
        'battery': data.battery,
        'tow': data.tow_weight
    };

    for (const [id, value] of Object.entries(fields)) {
        const el = document.getElementById(`td-${id}`);
        if (el) {
            el.textContent = value || "Ej hittad";
            el.style.color = "#111827"; // Svart färg när data är laddad
            el.style.fontWeight = "500";
        }
    }
}

// Hjälpfunktion: Sätter UI i laddningsläge
function setTechDataLoading(isLoading) {
    const ids = ['model', 'engine', 'oil', 'ac', 'cam', 'torque', 'battery', 'tow'];
    ids.forEach(id => {
        const el = document.getElementById(`td-${id}`);
        if(el) {
            el.textContent = isLoading ? "Hämtar data..." : "---";
            el.style.color = "#9ca3af"; // Grå färg
            el.style.fontWeight = "400";
        }
    });
}

// Hjälpfunktion: Visar felmeddelande
function setTechDataError() {
    const ids = ['model', 'engine', 'oil', 'ac', 'cam', 'torque', 'battery', 'tow'];
    ids.forEach(id => {
        const el = document.getElementById(`td-${id}`);
        if(el) el.textContent = "Kunde inte hämta";
    });
}
