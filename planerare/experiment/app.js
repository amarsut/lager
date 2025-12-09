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

let chatUnsubscribe = null;
let currentChatLimit = 50;
let isFetchingOlderChat = false;
let expandedMessageIds = new Set();

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

	// --- NYTT: KOPPLA CHATT-KNAPPEN ---
    const fabChat = document.getElementById('fabChat');
    if (fabChat) {
        fabChat.addEventListener('click', () => {
            toggleChatWidget();
        });
    }
    
    // Starta lyssnaren för chatten direkt (så man ser om man fått nya meddelanden)
    initChat();

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
// FORDONSHISTORIK & TEKNISK DATA MODAL (ANPASSAD FÖR vehicleModal)
// ==========================================

function openVehicleModal(regnr) {
    if(!regnr || regnr === '---') return;
    
    const cleanReg = regnr.replace(/\s/g, '').toUpperCase();
    
    // HÄR ÄR ÄNDRINGEN: Vi hämtar vehicleModal istället för carModal
    const modal = document.getElementById('vehicleModal');
    
    if (!modal) {
        console.error("Hittar inte 'vehicleModal' i HTML-koden.");
        return;
    }
    
    // 1. Sätt rubriker och länkar (Matchar din HTML)
    const titleEl = document.getElementById('vehicleRegTitle');
    const linkBiluppgifter = document.getElementById('linkBiluppgifter');
    
    if(titleEl) titleEl.textContent = cleanReg;
    if(linkBiluppgifter) linkBiluppgifter.href = `https://biluppgifter.se/fordon/${cleanReg}`;
	
	const linkOljemagasinet = document.getElementById('linkOljemagasinet');

	if(titleEl) titleEl.textContent = cleanReg;
	    
	// Uppdatera länkarna
	if(linkBiluppgifter) linkBiluppgifter.href = `https://biluppgifter.se/fordon/${cleanReg}`;
	    
	// Ny länk till Oljemagasinet (Sökning)
	if(linkOljemagasinet) linkOljemagasinet.href = `https://www.oljemagasinet.se/`;
    
    // Kopiera-knapp
    const copyBtn = document.getElementById('btnCopyRegModal');
    if(copyBtn) {
        copyBtn.onclick = () => {
            navigator.clipboard.writeText(cleanReg);
            showToast('Reg.nr kopierat!');
        };
    }

    // 2. Rendera historik (Matchar din HTML)
    renderVehicleHistory(cleanReg);

    // 3. HANTERA TEKNISK DATA
    // I din HTML heter behållaren 'techDataContainer'
    const specsContainer = document.getElementById('techDataContainer'); 
    const fetchContainer = document.getElementById('fetchDataContainer'); // Behållaren för knappen
    const fetchBtn = document.getElementById('btnFetchTechData');
    
    // Nollställ UI
    if(specsContainer) {
        specsContainer.style.display = 'none';
        specsContainer.innerHTML = ''; 
    }
    
    // Visa knappen för att hämta data
    if(fetchContainer) fetchContainer.style.display = 'block';
    if(fetchBtn) {
        fetchBtn.disabled = false;
        fetchBtn.innerHTML = `<svg class="icon-sm" viewBox="0 0 24 24"><use href="#icon-search"></use></svg> Hämta Data med AI`;
        
        // Koppla knapptryck
        fetchBtn.onclick = function() {
            fetchTechnicalData(cleanReg);
        };
    }

    // 4. KOLLA OM DATA REDAN FINNS I FIREBASE
    db.collection("vehicleSpecs").doc(cleanReg).get().then(doc => {
        if (doc.exists) {
            const data = doc.data();

            // Om vi har data (antingen gammal HTML eller nya fält)
            if (data.htmlContent || data.oil || data.engine) {
                if(specsContainer) {
                    // Om det är nya formatet (fält), generera HTML. Annars använd sparad HTML.
                    specsContainer.innerHTML = (data.oil || data.engine) ? generateTechSpecHTML(data, cleanReg) : data.htmlContent;
                    specsContainer.style.display = 'block';
                }
                // Dölj hämt-knappen eftersom vi redan har data
                if(fetchContainer) fetchContainer.style.display = 'none';
            }
        }
    }).catch(err => console.log("Kunde inte hämta specs:", err));

    // Visa modalen
    modal.classList.add('show');
    
    // Stäng-knapp logik (Din HTML använder vehicleModalClose)
    const closeBtn = document.getElementById('vehicleModalClose');
    if(closeBtn) {
        closeBtn.onclick = () => modal.classList.remove('show');
    }
}

function renderVehicleHistory(regnr) {
    // I din HTML heter listan 'vehicleHistoryList'
    const historyBody = document.getElementById('vehicleHistoryList'); 
    const searchInput = document.getElementById('vehicleHistorySearch');
    const ownerEl = document.getElementById('vehicleOwner'); 
    
    if(!historyBody) return;

    // Hitta alla jobb för denna bil
    const history = allJobs.filter(j => j.regnr === regnr && !j.deleted)
                           .sort((a,b) => new Date(b.datum) - new Date(a.datum));

    if(ownerEl) {
        if(history.length > 0) ownerEl.textContent = history[0].kundnamn;
        else ownerEl.textContent = "---";
    }

    const renderRows = (jobs) => {
        historyBody.innerHTML = '';
        if (jobs.length === 0) {
            // Anpassad för tabellstruktur (tr/td) som du verkar ha i vehicleModal
            historyBody.innerHTML = '<tr><td colspan="4" style="text-align:center; color:#999; padding:20px;">Ingen historik hittades.</td></tr>';
            return;
        }
        
        jobs.forEach(job => {
            let totalUtgifter = 0;
            if(job.utgifter && Array.isArray(job.utgifter)) {
                job.utgifter.forEach(u => totalUtgifter += (parseInt(u.kostnad) || 0));
            }

            const vinst = (parseInt(job.kundpris) || 0) - totalUtgifter;
            const dateStr = job.datum ? job.datum.split('T')[0] : '-';
            
            const tr = document.createElement('tr');
            tr.style.cursor = 'pointer';
            tr.innerHTML = `
                <td style="font-weight:600; color:#374151;">${dateStr}</td>
                <td>${job.kundnamn}</td>
                <td><span class="status-badge status-${job.status}" style="transform:scale(0.9); origin:left;">${job.status}</span></td>
                <td style="text-align:right; font-weight:700; color:${vinst > 0 ? '#10B981' : '#111'};">${vinst} kr</td>
            `;
            
            tr.onclick = () => {
                document.getElementById('vehicleModal').classList.remove('show');
                openEditModal(job.id);
            };

            historyBody.appendChild(tr);
        });
    };

    renderRows(history);

    if(searchInput) {
        searchInput.oninput = (e) => {
            const term = e.target.value.toLowerCase();
            const filtered = history.filter(j => 
                j.kundnamn.toLowerCase().includes(term) || 
                (j.kommentar && j.kommentar.toLowerCase().includes(term))
            );
            renderRows(filtered);
        };
    }
}

// ==========================================
// AI & TEKNISK DATA LOGIK
// ==========================================

async function fetchTechnicalData(regnr) {
    const cleanReg = regnr.replace(/\s/g, '').toUpperCase();
    const docRef = db.collection("vehicleSpecs").doc(cleanReg);
    
    const fetchBtn = document.getElementById('btnFetchTechData');
    const specsContainer = document.getElementById('techDataContainer'); 
    const fetchContainer = document.getElementById('fetchDataContainer');

    if(fetchBtn) {
        fetchBtn.disabled = true;
        fetchBtn.innerHTML = `<span>⏳ Analyserar med AI...</span>`;
    }

    try {
        // ÄNDRING: Ta emot datan direkt från funktionen istället för att läsa från DB
        const data = await scrapeAndAnalyze(cleanReg, docRef);
        
        // Nu har vi "data" direkt. Vi behöver inte göra docRef.get()
        if(specsContainer) {
            specsContainer.innerHTML = generateTechSpecHTML(data, cleanReg);
            specsContainer.style.display = 'block';
        }
        if(fetchContainer) fetchContainer.style.display = 'none';
        
        showToast('Teknisk data hämtad och sparad!', 'success');

    } catch (error) {
        console.error("Fel vid AI-hämtning:", error);
        // ... din felhantering ...
        if(fetchBtn) {
            fetchBtn.disabled = false;
            fetchBtn.innerHTML = `<span>Försök igen</span>`;
        }
    }
}

// Skrapar Biluppgifter.se och skickar till Gemini AI
async function scrapeAndAnalyze(regnr, docRef) {
    // 1. Skrapa data via Proxy
    const proxy = "https://corsproxy.io/?";
    const url = `https://biluppgifter.se/fordon/${regnr}`;
    
    const response = await fetch(proxy + encodeURIComponent(url));
    if (!response.ok) throw new Error("Kunde inte nå biluppgifter");
    
    const htmlText = await response.text();
    // Rensa texten lite för att spara tokens
    const rawText = htmlText.replace(/\s+/g, ' ').substring(0, 15000);

    // 2. Förbered AI-prompten (Be om JSON)
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

    // 3. Anropa Gemini API
    const apiKey = CONFIG.AI_API_KEY; 
    const aiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;

    const aiResponse = await fetch(aiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] })
    });

    if(!aiResponse.ok) throw new Error(`AI API Error: ${aiResponse.status}`);

    const aiData = await aiResponse.json();
    
    // 4. Parsa svaret
    let aiText = aiData.candidates[0].content.parts[0].text;
    aiText = aiText.replace(/```json/g, '').replace(/```/g, '').trim();
    
    const vehicleData = JSON.parse(aiText);

    // 5. Spara till Firebase
    await docRef.set(vehicleData);
	
	return vehicleData;
}

// --- HJÄLPFUNKTION: Bygg HTML från lösa fält (DENNA BEHÖVS FÖR NYA DESIGNEN) ---
function generateTechSpecHTML(data, regnr) {
    // 1. Märkes-logik (Oförändrad)
    let brandIcon = '#icon-brand-generic';
    const modelStr = (data.model || '').toLowerCase();
    
    if (modelStr.includes('volvo')) brandIcon = '#icon-brand-volvo';
    else if (modelStr.includes('bmw')) brandIcon = '#icon-brand-bmw';
    else if (modelStr.includes('audi')) brandIcon = '#icon-brand-audi';
    else if (modelStr.includes('mercedes') || modelStr.includes('benz')) brandIcon = '#icon-brand-merc';
    else if (modelStr.includes('vw') || modelStr.includes('volkswagen')) brandIcon = '#icon-brand-vw';
    else if (modelStr.includes('seat')) brandIcon = '#icon-brand-seat';
    else if (modelStr.includes('skoda')) brandIcon = '#icon-brand-skoda';
    else if (modelStr.includes('fiat')) brandIcon = '#icon-brand-fiat';

    // Hjälpfunktion för att skapa smart input (Sparar plats och kod)
    const createInput = (key, val) => {
        const value = val || '';
        // Sätter bredden till antal tecken + 2 (för lite luft). Minst 60px via CSS.
        return `<input class="spec-input" 
                       value="${value}" 
                       style="width: ${value.length + 3}ch;" 
                       oninput="this.style.width = (this.value.length + 3) + 'ch'"
                       onchange="saveTechSpec('${regnr}', '${key}', this.value)">`;
    };

    return `
        <div class="tech-header-main">
           <svg class="brand-icon-svg"><use href="${brandIcon}"></use></svg>
           <h4>Teknisk Data ${regnr}</h4>
        </div>
        <ul class="tech-list">
            <li>
                <svg class="spec-icon-svg"><use href="#icon-car-v2"></use></svg> 
                <span><b>Bil:</b> ${createInput('model', data.model)}</span>
            </li>
            <li>
                <svg class="spec-icon-svg"><use href="#icon-belt-v2"></use></svg> 
                <span><b>Kamrem:</b> ${createInput('timing_belt', data.timing_belt)}</span>
            </li>
            
            <li>
                <svg class="spec-icon-svg"><use href="#icon-engine-v2"></use></svg> 
                <span><b>Motor:</b> ${createInput('engine', data.engine)}</span>
            </li>
            <li>
                <svg class="spec-icon-svg"><use href="#icon-torque-v2"></use></svg> 
                <span><b>Moment:</b> ${createInput('torque', data.torque)}</span>
            </li>

            <li>
                <svg class="spec-icon-svg"><use href="#icon-oil-v2"></use></svg> 
                <span><b>Olja:</b> ${createInput('oil', data.oil)}</span>
            </li>
            <li>
                <svg class="spec-icon-svg"><use href="#icon-battery-v2"></use></svg> 
                <span><b>Batteri:</b> ${createInput('battery', data.battery)}</span>
            </li>

            <li>
                <svg class="spec-icon-svg"><use href="#icon-ac-v2"></use></svg> 
                <span><b>AC:</b> ${createInput('ac', data.ac)}</span>
            </li>
            <li>
                <svg class="spec-icon-svg"><use href="#icon-weight-v2"></use></svg> 
                <span><b>Drag:</b> ${createInput('tow_weight', data.tow_weight)}</span>
            </li>
        </ul>
    `;
}

// --- Spara teknisk data när man ändrar manuellt ---
async function saveTechSpec(regnr, field, newValue) {
    const cleanReg = regnr.replace(/\s/g, '').toUpperCase();
    
    try {
        // Uppdatera ENDAST det fältet som ändrades i Firebase
        await db.collection("vehicleSpecs").doc(cleanReg).update({
            [field]: newValue
        });
        
        // Visa en liten bekräftelse (Toast)
        showToast(`Uppdaterade ${field} till: ${newValue}`, 'success');
        
    } catch (error) {
        console.error("Kunde inte spara ändring:", error);
        showToast("Kunde inte spara ändringen.", 'danger');
    }
}

// ==========================================
// CHATT & NOTERINGAR (INTEGRERAD)
// ==========================================

function toggleChatWidget() {
    const chatWidget = document.getElementById('chatWidget');
    if (!chatWidget) return;

    if (chatWidget.style.display === 'flex') {
        chatWidget.style.display = 'none';
        document.body.style.overflow = ''; // Lås upp scroll
    } else {
        chatWidget.style.display = 'flex';
        document.body.style.overflow = 'hidden'; // Lås bakgrundsscroll på mobil
        
        // Scrolla till botten direkt
        setTimeout(() => {
            const chatList = document.getElementById('chatMessages');
            if (chatList) chatList.scrollTop = chatList.scrollHeight;
        }, 100);
    }
}

function initChat() {
    const chatList = document.getElementById('chatMessages');
    if (!chatList) return;

    // 1. Koppla UI-element
    const chatInput = document.getElementById('chatInput');
    const sendBtn = document.getElementById('chatSendBtn');
    const closeBtn = document.getElementById('closeChatWidget');
    
    // Knappar för bilder
    const plusBtn = document.getElementById('chatPlusBtn');      
    const cameraBtn = document.getElementById('chatCameraBtn'); 
    const fileInputGallery = document.getElementById('chatFileInputGallery');
    const fileInputCamera = document.getElementById('chatFileInputCamera');

    // 2. Stäng-knapp
    if (closeBtn) {
        closeBtn.addEventListener('click', toggleChatWidget);
    }

    // 3. Skicka meddelande (Klick + Enter)
    const sendMessage = async () => {
        const text = chatInput.value.trim();
        if (!text) return;

        try {
            await db.collection("notes").add({
                text: text,
                timestamp: new Date().toISOString(),
                platform: window.innerWidth <= 768 ? 'mobil' : 'dator',
                type: 'text'
            });
            chatInput.value = '';
            // Scrolla ner
            setTimeout(() => chatList.scrollTop = chatList.scrollHeight, 100);
        } catch (err) {
            console.error("Fel vid sändning:", err);
            alert("Kunde inte skicka meddelandet.");
        }
    };

    if (sendBtn) sendBtn.addEventListener('click', sendMessage);
    
    if (chatInput) {
        chatInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                sendMessage();
            }
        });
    }

    // 4. Bild-uppladdning (Galleri & Kamera)
    if (plusBtn && fileInputGallery) {
        plusBtn.addEventListener('click', () => fileInputGallery.click());
        fileInputGallery.addEventListener('change', (e) => handleImageUpload(e.target.files[0]));
    }

    if (cameraBtn && fileInputCamera) {
        cameraBtn.addEventListener('click', () => fileInputCamera.click());
        fileInputCamera.addEventListener('change', (e) => handleImageUpload(e.target.files[0]));
    }

    // 5. Starta lyssnare mot Firebase (Hämta gamla meddelanden)
    setupChatListener(50); // Hämta de 50 senaste
}

function setupChatListener(limit) {
    if (chatUnsubscribe) chatUnsubscribe(); // Stäng ev. gammal lyssnare

    const chatList = document.getElementById('chatMessages');
    
    // Hjälpfunktion: Kolla om två datum är samma dag
    const isSameDay = (d1, d2) => {
        return d1.getFullYear() === d2.getFullYear() &&
               d1.getMonth() === d2.getMonth() &&
               d1.getDate() === d2.getDate();
    };

    chatUnsubscribe = db.collection("notes")
        .orderBy("timestamp", "desc")
        .limit(limit)
        .onSnapshot(snapshot => {
            const docs = [];
            snapshot.forEach(doc => docs.push({ id: doc.id, ...doc.data() }));
            
            // Vänd ordningen så nyaste hamnar längst ner
            docs.reverse();

            chatList.innerHTML = ''; // Rensa listan

            if (docs.length === 0) {
                // Snyggare tom-state
                chatList.innerHTML = '<div style="text-align:center; padding:30px; color:#9ca3af; font-size:0.9rem;">Inga meddelanden än.</div>';
                return;
            }

            let lastDateKey = null; // Håller koll på datum-gruppering

            docs.forEach(data => {
                // Datum-separator logic
                if (data.timestamp) {
                    const msgDateObj = new Date(data.timestamp);
                    // Skapa en nyckel för jämförelse (t.ex. "Mon Dec 02 2024")
                    const currentDateKey = msgDateObj.toDateString();

                    if (currentDateKey !== lastDateKey) {
                        const sep = document.createElement('div');
                        sep.className = 'chat-date-separator'; 
                        
                        // --- LOGIK FÖR IDAG / IGÅR ---
                        const today = new Date();
                        const yesterday = new Date();
                        yesterday.setDate(yesterday.getDate() - 1);

                        let displayText = '';

                        if (isSameDay(msgDateObj, today)) {
                            displayText = 'Idag';
                        } else if (isSameDay(msgDateObj, yesterday)) {
                            displayText = 'Igår';
                        } else {
                            // Fallback: "9 dec" (Svenskt format)
                            let options = { day: 'numeric', month: 'short' };
                            // Om det är ett annat år, visa det också
                            if (msgDateObj.getFullYear() !== today.getFullYear()) {
                                options.year = 'numeric';
                            }
                            displayText = msgDateObj.toLocaleDateString('sv-SE', options).replace('.', ''); // Tar bort ev. punkt
                        }

                        // VIKTIGT: Wrappa i <span> för att CSS-linjen ska ligga bakom texten snyggt
                        sep.innerHTML = `<span>${displayText}</span>`;
                        
                        chatList.appendChild(sep);
                        lastDateKey = currentDateKey;
                    }
                }
                
                // Rendera bubblan (använder din befintliga funktion)
                // OBS: Se till att skicka med ID också om du vill ha högerklick-menyn
                // Eftersom docs redan har 'id' inbakat (se rad 14) så skickar vi hela 'data'-objektet
                renderChatBubble(data, chatList);
            });

            // Scrolla till botten vid första laddningen
            if (limit === 50) {
                setTimeout(() => chatList.scrollTop = chatList.scrollHeight, 100);
            }

        }, error => {
            console.error("Fel vid chatt-hämtning:", error);
        });
}

function renderChatBubble(data, container) {
    const bubble = document.createElement('div');
    // Om det är system (AI) eller användare
    const typeClass = (data.platform === 'system') ? 'system' : 'me';
    bubble.className = `chat-bubble ${typeClass}`; // CSS-klasser: .chat-bubble, .me, .system

    // 1. Text
    if (data.text) {
        const textDiv = document.createElement('div');
        // Enkel länk-fix (gör länkar klickbara)
        textDiv.innerHTML = data.text.replace(/(https?:\/\/[^\s]+)/g, '<a href="$1" target="_blank" style="color:white; text-decoration:underline;">$1</a>');
        bubble.appendChild(textDiv);
    }

    // 2. Bild
    if (data.image) {
        const imgContainer = document.createElement('div');
        imgContainer.className = 'chat-bubble-image';
        const img = document.createElement('img');
        img.src = data.image;
        img.loading = "lazy";
        
        // Klick för att zooma bild
        img.onclick = () => window.openImageZoom(data.image);
        
        imgContainer.appendChild(img);
        bubble.appendChild(imgContainer);
    }

    // 3. Tid
    const timeDiv = document.createElement('div');
    timeDiv.className = 'chat-time';
    if (data.timestamp) {
        const t = new Date(data.timestamp);
        timeDiv.textContent = t.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
    }
    bubble.appendChild(timeDiv);

    container.appendChild(bubble);
}

// --- BILD-HANTERING ---

async function handleImageUpload(file) {
    if (!file) return;
    
    // Visa tillfällig "Laddar..." toast om du har den funktionen, annars console.log
    console.log("Bearbetar bild...");

    try {
        const base64Image = await compressImage(file);
        
        await db.collection("notes").add({
            image: base64Image,
            text: "", // Ingen text, bara bild
            type: 'image',
            timestamp: new Date().toISOString(),
            platform: window.innerWidth <= 768 ? 'mobil' : 'dator'
        });
        
        // Återställ fil-inputsen så man kan välja samma bild igen
        document.getElementById('chatFileInputGallery').value = '';
        document.getElementById('chatFileInputCamera').value = '';

    } catch (err) {
        console.error("Bildfel:", err);
        alert("Kunde inte ladda upp bilden.");
    }
}

// Komprimera bild innan uppladdning (Viktigt för Firestore!)
function compressImage(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        
        reader.onload = (event) => {
            const img = new Image();
            img.src = event.target.result;
            
            img.onload = () => {
                const maxWidth = 800; // Max bredd
                const scaleSize = maxWidth / img.width;
                const newWidth = (img.width > maxWidth) ? maxWidth : img.width;
                const newHeight = (img.width > maxWidth) ? (img.height * scaleSize) : img.height;

                const canvas = document.createElement('canvas');
                canvas.width = newWidth;
                canvas.height = newHeight;

                const ctx = canvas.getContext('2d');
                ctx.drawImage(img, 0, 0, newWidth, newHeight);

                // Spara som JPEG med 70% kvalitet
                const dataUrl = canvas.toDataURL('image/jpeg', 0.7);
                resolve(dataUrl);
            };
            img.onerror = (err) => reject(err);
        };
        reader.onerror = (err) => reject(err);
    });
}

// Enkel bild-zoom funktion
window.openImageZoom = function(src) {
    const modal = document.getElementById('imageZoomModal');
    const imgMain = document.getElementById('mmImgMain');
    const closeBtn = document.getElementById('mmCloseBtn');
    
    if (modal && imgMain) {
        imgMain.src = src;
        modal.style.display = 'flex';
        
        if(closeBtn) {
            closeBtn.onclick = () => {
                modal.style.display = 'none';
            };
        }
        
        // Stäng vid klick utanför bilden
        modal.onclick = (e) => {
            if (e.target === modal) modal.style.display = 'none';
        };
    }
};
