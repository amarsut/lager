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

let isEditingMsg = false;
let currentEditMsgId = null;

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
    updateStatsCounts(allJobs);

    const container = document.getElementById('jobListContainer');
    const isMobile = window.innerWidth <= 768; // Kolla om vi är på mobil
    
    if (jobsToDisplay.length === 0) {
        container.innerHTML = '<p style="text-align:center; padding:2rem; color:#888;">Inga jobb hittades för detta filter.</p>';
        return;
    }

    // --- MOBIL VY (KORT) ---
    if (isMobile) {
        let cardsHTML = `<div class="job-cards-container">`;
        jobsToDisplay.forEach(job => {
            cardsHTML += createJobCard(job);
        });
        cardsHTML += `</div>`;
        container.innerHTML = cardsHTML;
    } 
    // --- DESKTOP VY (TABELL) ---
    else {
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
}

function createJobCard(job) {
    // 1. Datumformat: "MÅN 15 DEC • 08:00"
    let dateDisplay = "";
    if (job.datum) {
        const d = new Date(job.datum);
        const dayName = d.toLocaleDateString('sv-SE', { weekday: 'short' }).replace('.','').toUpperCase();
        const dayNum = d.getDate();
        const month = d.toLocaleDateString('sv-SE', { month: 'short' }).replace('.','').toUpperCase();
        const time = d.toLocaleTimeString('sv-SE', { hour: '2-digit', minute: '2-digit' });
        
        dateDisplay = `${dayName} ${dayNum} ${month} • ${time}`;
    } else {
        dateDisplay = "DATUM SAKNAS";
    }

    // 2. Prisformat
    const price = job.kundpris ? `${job.kundpris} kr` : '0 kr';
    
    // 3. Regnr (utan "OKÄNT")
    const regNr = (job.regnr && job.regnr.toUpperCase() !== 'OKÄNT') ? job.regnr.toUpperCase() : '';
    
    // 4. Kundnamn
    const customerName = job.kundnamn || 'Kund saknas';

    // 5. Status styling
    let statusClass = job.status || 'bokad';
    
    // Check-knapp logik (fylld om klar)
    const isDone = statusClass === 'klar';
    const checkBtnClass = isDone ? 'check-circle-btn checked' : 'check-circle-btn';

    // Vi tar bort labels som "Kund:" och "Regnr:" för en renare look
    return `
        <div class="job-card status-${statusClass}" onclick="openEditModal('${job.id}')">
            
            <div class="job-card-header">
                <span class="job-card-date">${dateDisplay}</span>
                <span class="status-pill ${statusClass}">${statusClass}</span>
            </div>
            
            <div class="job-card-main">
                <div>
                    <span class="job-card-customer">${customerName}</span>
                    ${regNr ? `<span class="job-card-reg">${regNr}</span>` : ''}
                </div>
                <div class="job-card-price">${price}</div>
            </div>

            <div class="job-card-footer">
                <div style="flex-grow:1;"></div> 

                <button class="${checkBtnClass}" onclick="event.stopPropagation(); setStatus('${job.id}', '${isDone ? 'bokad' : 'klar'}')">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
                </button>
            </div>
        </div>
    `;
}

// Hjälpfunktion: Skapa DESKTOP RAD (Samma som innan men inkluderad för helhet)
function createJobRow(job) {
    const statusText = {
        'bokad': 'Bokad', 'klar': 'Slutfört', 'faktureras': 'Fakturering', 'offererad': 'Offererad', 'avbokad': 'Avbokad'
    };
    
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

    const nameLower = (job.kundnamn || '').toLowerCase();
    const isCorporate = ['bmg', 'fogarolli'].some(c => nameLower.includes(c));
    const iconType = isCorporate ? '#icon-office-building' : '#icon-user';
    const iconColor = isCorporate ? '#10B981' : '#0066FF'; 

	const regPlate = (job.regnr && job.regnr.toUpperCase() !== 'OKÄNT') 
	    ? `<div class="reg-plate" style="cursor:pointer;" onclick="event.stopPropagation(); openVehicleModal('${job.regnr}')">
	         <span class="reg-country">S</span>
	         <span class="reg-number">${job.regnr}</span>
	       </div>` 
	    : '---';

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
                <button class="icon-btn" title="Klar" onclick="event.stopPropagation(); setStatus('${job.id}', 'klar')"><svg class="icon-sm"><use href="#icon-check"></use></svg></button>
                <button class="icon-btn" title="Radera" onclick="event.stopPropagation(); deleteJob('${job.id}')"><svg class="icon-sm"><use href="#icon-trash"></use></svg></button>
            </td>
        </tr>
    `;
}

// Lägg till en listener för att rita om när man ändrar storlek på fönstret
window.addEventListener('resize', renderDashboard);

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
    
    // NYTT: Element för redigerings-header
    const closeEditBtn = document.getElementById('closeEditBtn');

    // Knappar för bilder
    const plusBtn = document.getElementById('chatPlusBtn');      
    const cameraBtn = document.getElementById('chatCameraBtn'); 
    const fileInputGallery = document.getElementById('chatFileInputGallery');
    const fileInputCamera = document.getElementById('chatFileInputCamera');

    // 2. Stäng-knapp för widgeten
    if (closeBtn) {
        closeBtn.addEventListener('click', toggleChatWidget);
    }

    // NYTT: Stäng-knapp för redigeringsläget
    if (closeEditBtn) {
        closeEditBtn.addEventListener('click', exitEditMode);
    }

    // 3. Hantera "Skicka" OCH "Spara ändring"
    const handleChatAction = async () => {
        const text = chatInput.value.trim();
        if (!text) return;

        // Om vi är i redigeringsläge: UPPDATERA befintligt meddelande
        if (isEditingMsg && currentEditMsgId) {
            try {
                // Uppdaterar texten i databasen
                await db.collection('notes').doc(currentEditMsgId).update({
                    text: text,
                    isEdited: true // Flagga om du vill visa "redigerad" i UI senare
                });
                
                // Avsluta redigeringsläget
                exitEditMode(); 

            } catch (err) {
                console.error("Fel vid uppdatering:", err);
                alert("Kunde inte spara ändringen.");
            }
        } 
        // Annars: SKAPA nytt meddelande (Din gamla logik)
        else {
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
        }
    };

    // Koppla klick på skicka-knappen till den nya funktionen
    if (sendBtn) sendBtn.onclick = handleChatAction;
    
    // Koppla Enter-tangenten
    if (chatInput) {
        chatInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleChatAction();
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

    // 5. SÖKFUNKTION FÖR CHATTEN
    const searchInput = document.getElementById('chatSearchInput');
    
    if (searchInput) {
        searchInput.addEventListener('input', (e) => {
            const searchTerm = e.target.value.toLowerCase();
            const rows = document.querySelectorAll('.chat-row'); 
            
            rows.forEach(row => {
                const text = row.innerText.toLowerCase();
                if (text.includes(searchTerm)) {
                    row.style.display = 'flex'; 
                } else {
                    row.style.display = 'none'; 
                }
            });

            // Hantera datumavskiljare vid sökning
            const separators = document.querySelectorAll('.chat-date-separator');
            separators.forEach(sep => {
                if(searchTerm === '') {
                    sep.style.display = 'flex';
                } else {
                    sep.style.display = 'none'; 
                }
            });
        });
    }

    // 6. Starta lyssnare mot Firebase
    setupChatListener(50);
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
    const messageId = data.id; 

    // 1. Skapa Wrapper (Raden)
    const row = document.createElement('div');
    
    let senderType = 'other';
    // Ändra logiken här om du har ett riktigt inloggningssystem
    // Just nu: system = system, allt annat = me (för demo) eller other
    if (data.platform === 'system') senderType = 'system';
    else if (data.isMe) senderType = 'me'; // Exempel om du har sådan data
    else senderType = data.platform === 'mobil' || data.platform === 'dator' ? 'me' : 'other';
    
    // Tvinga 'me' för att testa (eller behåll din logik för vem som är vem)
    // I din kod antog du att allt icke-system var 'me'. 
    // Om du vill simulera motpart, se till att senderType blir 'other'.

    row.className = `chat-row ${senderType}`;
    row.dataset.messageId = messageId;
    row.style.position = 'relative';

    // --- HÄR ÄR ÄNDRINGEN: SKAPA MENYN FÖR ALLA ---
    // Vi tog bort "if (senderType === 'me')" så nu skapas den alltid.
    
    const optionsMenu = document.createElement('div');
    optionsMenu.className = 'message-options';
    optionsMenu.innerHTML = `
        <button class="option-btn edit" title="Redigera">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor"><path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" /></svg>
        </button>
        <button class="option-btn delete danger" title="Ta bort">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clip-rule="evenodd" /></svg>
        </button>
    `;

    // Koppla knapparna
    optionsMenu.querySelector('.edit').onclick = () => enterEditMode(row, data.text || "");
    optionsMenu.querySelector('.delete').onclick = () => deleteChatMessage(messageId);
    
    row.appendChild(optionsMenu);
    // --- SLUT PÅ ÄNDRING ---

    // 2. Skapa Bubblan
    const bubble = document.createElement('div');
    bubble.className = 'chat-bubble';

    if (data.type === 'image' || data.image) {
        bubble.classList.add('is-image');
    }

    // Text-innehåll
    if (data.text) {
        const textDiv = document.createElement('div');
        textDiv.className = 'bubble-text-content';
        textDiv.innerHTML = data.text.replace(/(https?:\/\/[^\s]+)/g, '<a href="$1" target="_blank">$1</a>');
        bubble.appendChild(textDiv);
    }

    // Bild-innehåll
    if (data.image) {
        const imgContainer = document.createElement('div');
        imgContainer.className = 'chat-bubble-image';
        const img = document.createElement('img');
        img.src = data.image;
        img.loading = "lazy";
        img.onclick = () => window.openImageZoom(data.image);
        imgContainer.appendChild(img);
        bubble.appendChild(imgContainer);
    }

    row.appendChild(bubble);

    // 3. Tidsstämpel
    if (data.timestamp) {
        const timeDiv = document.createElement('div');
        timeDiv.className = 'chat-time';
        let t;
        if (data.timestamp && typeof data.timestamp.toDate === 'function') {
            t = data.timestamp.toDate();
        } else {
            t = new Date(data.timestamp);
        }
        timeDiv.textContent = t.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
        row.appendChild(timeDiv);
    }

    container.appendChild(row);
}

// ==========================================================================
// FUNKTIONER FÖR REDIGERING & BORTTAGNING (Korrigerad Databas-sökväg)
// ==========================================================================

function enterEditMode(rowElement, currentText) {
    const messageId = rowElement.dataset.messageId;
    if (!messageId) return;

    // Sätt globala variabler
    isEditingMsg = true;
    currentEditMsgId = messageId;

    // UI Referenser
    const chatWidget = document.getElementById('chatWidget');
    const inputField = document.getElementById('chatInput');
    const editHeader = document.getElementById('chatEditHeader');
    const sendBtn = document.getElementById('chatSendBtn');

    // 1. Fyll input med texten
    inputField.value = currentText;
    inputField.focus();
    // Flytta markör till slutet av texten
    inputField.setSelectionRange(inputField.value.length, inputField.value.length);

    // 2. Ändra UI till "Edit Mode" (Dimma bakgrund, visa header)
    chatWidget.classList.add('edit-mode');
    if(editHeader) editHeader.style.display = 'flex';
    
    // Byt ikon på knappen till en "Check/Spara"
    if(sendBtn) {
        sendBtn.innerHTML = '<svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"></polyline></svg>';
    }
}

function exitEditMode() {
    // Nollställ variabler
    isEditingMsg = false;
    currentEditMsgId = null;

    const chatWidget = document.getElementById('chatWidget');
    const inputField = document.getElementById('chatInput');
    const editHeader = document.getElementById('chatEditHeader');
    const sendBtn = document.getElementById('chatSendBtn');

    // Återställ UI
    inputField.value = '';
    chatWidget.classList.remove('edit-mode');
    if(editHeader) editHeader.style.display = 'none';

    // Återställ sänd-ikonen (Pilen)
    if(sendBtn) {
        sendBtn.innerHTML = '<svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="22" y1="2" x2="11" y2="13"></line><polygon points="22 2 15 22 11 13 2 9 22 2"></polygon></svg>';
    }
}

async function deleteChatMessage(messageId) {
    if (!confirm("Ta bort meddelandet?")) return;

    try {
        await db.collection('notes').doc(messageId).delete();
    } catch (error) {
        console.error("Fel vid borttagning:", error);
        alert("Kunde inte ta bort meddelandet.");
    }
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

// --- MOBIL SÖK LOGIK ---

// Koppla knappen i menyn till att öppna modalen
document.getElementById('mobileSearchBtn')?.addEventListener('click', () => {
    const searchModal = document.getElementById('mobileSearchModal');
    const searchInput = document.getElementById('mobileSearchInput');
    const resultsContainer = document.getElementById('mobileSearchResults');
    
    searchModal.classList.add('show');
    searchInput.value = ''; // Rensa gammal sökning
    resultsContainer.innerHTML = ''; // Rensa resultat
    setTimeout(() => searchInput.focus(), 100); // Fokusera i fältet
    
    // Flytta "active" klassen i menyn
    document.querySelectorAll('.mobile-nav-btn').forEach(btn => btn.classList.remove('active'));
    document.getElementById('mobileSearchBtn').classList.add('active');
});

// Stäng sök-modalen
document.getElementById('closeMobileSearchBtn')?.addEventListener('click', () => {
    document.getElementById('mobileSearchModal').classList.remove('show');
    // Sätt tillbaka Hem som aktiv
    document.querySelectorAll('.mobile-nav-btn').forEach(btn => btn.classList.remove('active'));
    document.getElementById('mobileHomeBtn').classList.add('active');
});

// Live-sökning när man skriver
document.getElementById('mobileSearchInput')?.addEventListener('input', (e) => {
    const term = e.target.value.toLowerCase();
    const resultsContainer = document.getElementById('mobileSearchResults');
    
    if (term.length < 2) {
        resultsContainer.innerHTML = '<p style="text-align:center; color:#9ca3af; margin-top:20px;">Skriv minst 2 tecken för att söka.</p>';
        return;
    }
    
    // Filtrera i allJobs arrayen
    const filteredJobs = allJobs.filter(job => {
        return (job.kundnamn && job.kundnamn.toLowerCase().includes(term)) ||
               (job.regnr && job.regnr.toLowerCase().includes(term));
    });
    
    if (filteredJobs.length === 0) {
        resultsContainer.innerHTML = '<p style="text-align:center; color:#9ca3af; margin-top:20px;">Inga träffar.</p>';
    } else {
        // Använd samma snygga kort för resultaten
        resultsContainer.innerHTML = filteredJobs.map(job => createJobCard(job)).join('');
    }
});
