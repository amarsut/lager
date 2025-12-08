// --- DATA (Simulerad Databas) ---
let jobs = [
    { id: 1, date: "2025-12-08T16:30", customer: "HUSE", regNr: "SYU705", status: "Bokad" },
    { id: 2, date: "2025-12-08T16:32", customer: "BMG", regNr: "", status: "Bokad" },
    { id: 3, date: "2025-12-12T10:00", customer: "ASMIR", regNr: "EDW430", status: "Bokad" },
    { id: 4, date: "2026-01-01T08:00", customer: "FOGAROLLI", regNr: "NJZ755", status: "Bokad" },
    { id: 5, date: "2026-01-01T08:00", customer: "FOGAROLLI", regNr: "MYL844", status: "Bokad" }
];

// --- INITIERING ---
document.addEventListener('DOMContentLoaded', () => {
    renderTable();
    setupEventListeners();
});

// --- TABELL HANTERING ---
function renderTable() {
    const tbody = document.getElementById('jobTableBody');
    tbody.innerHTML = ''; 

    jobs.forEach(job => {
        const dateObj = new Date(job.date);
        const dateString = dateObj.toLocaleDateString('sv-SE', { weekday: 'short', day: 'numeric', month: 'short' }) + 
                           " kl. " + 
                           dateObj.toLocaleTimeString('sv-SE', { hour: '2-digit', minute: '2-digit' });

        // Här skapar vi den nya registreringsskylten
        const regHtml = job.regNr 
            ? `<div class="plate-wrapper">
                 <div class="plate-blue">S</div>
                 <div class="plate-text">${job.regNr}</div>
               </div>` 
            : '<span style="color:#ccc; font-size:0.8rem;">---</span>';

        // Ikonlogik för kund (Person vs Företag)
        const userIcon = (job.customer === 'BMG' || job.customer.includes('FOG')) 
            ? 'fa-briefcase' 
            : 'fa-user';

        const row = `
            <tr>
                <td><span class="status-badge">${job.status}</span></td>
                <td>${capitalizeFirst(dateString)}</td>
                <td>
                    <div class="customer-cell">
                        <i class="fa-solid ${userIcon}"></i> 
                        ${job.customer}
                    </div>
                </td>
                <td>${regHtml}</td>
                <td style="text-align: right;" class="action-icons">
                    <i class="fa-regular fa-comment" onclick="openChatWithNote('${job.customer}')" title="Notering"></i>
                    <i class="fa-regular fa-flag" title="Prioritera"></i>
                    <i class="fa-regular fa-circle-check" title="Klarmarkera"></i>
                    <i class="fa-regular fa-trash-can" onclick="deleteJob(${job.id})" title="Ta bort"></i>
                    <i class="fa-solid fa-pen" onclick="editJob(${job.id})" title="Redigera"></i>
                </td>
            </tr>
        `;
        tbody.innerHTML += row;
    });
}

function capitalizeFirst(string) {
    return string.charAt(0).toUpperCase() + string.slice(1);
}

// --- MODAL HANTERING (Nytt/Redigera Jobb) ---
const modal = document.getElementById('jobModal');
const form = document.getElementById('jobForm');

function openJobModal() {
    document.getElementById('modalTitle').innerText = "Nytt Jobb";
    document.getElementById('jobId').value = "";
    form.reset();
    
    // Sätt dagens datum som default
    const now = new Date();
    now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
    document.getElementById('jobDate').value = now.toISOString().slice(0,16);
    
    modal.style.display = 'flex';
}

function editJob(id) {
    const job = jobs.find(j => j.id === id);
    if (!job) return;

    document.getElementById('modalTitle').innerText = "Redigera Jobb";
    document.getElementById('jobId').value = job.id;
    document.getElementById('customerName').value = job.customer;
    document.getElementById('regNr').value = job.regNr;
    document.getElementById('jobDate').value = job.date;

    modal.style.display = 'flex';
}

function closeJobModal() {
    modal.style.display = 'none';
}

// Spara jobbet (Skapa eller Uppdatera)
form.addEventListener('submit', (e) => {
    e.preventDefault();
    
    const id = document.getElementById('jobId').value;
    const customer = document.getElementById('customerName').value;
    const regNr = document.getElementById('regNr').value;
    const date = document.getElementById('jobDate').value;

    if (id) {
        // Uppdatera befintligt
        const index = jobs.findIndex(j => j.id == id);
        if (index !== -1) {
            jobs[index] = { ...jobs[index], customer, regNr, date };
        }
    } else {
        // Skapa nytt
        const newJob = {
            id: Date.now(), // Enkelt ID
            status: "Bokad",
            date: date,
            customer: customer,
            regNr: regNr
        };
        jobs.push(newJob);
    }

    renderTable();
    closeJobModal();
});

// Ta bort jobb
function deleteJob(id) {
    if(confirm("Vill du ta bort detta jobb?")) {
        jobs = jobs.filter(j => j.id !== id);
        renderTable();
    }
}

// --- CHATT / NOTIS FUNKTION ---
function toggleChat() {
    const chatWin = document.getElementById('chatWindow');
    chatWin.style.display = chatWin.style.display === 'flex' ? 'none' : 'flex';
}

function sendMessage() {
    const input = document.getElementById('chatInput');
    const msg = input.value;
    if (!msg) return;

    const chatBody = document.getElementById('chatBody');
    const newMsg = document.createElement('div');
    newMsg.className = 'message self';
    newMsg.innerText = msg;
    
    chatBody.appendChild(newMsg);
    input.value = "";
    
    // Scrolla till botten
    chatBody.scrollTop = chatBody.scrollHeight;
}

// Tillåt att skicka med Enter
document.getElementById('chatInput').addEventListener('keypress', function (e) {
    if (e.key === 'Enter') {
        sendMessage();
    }
});

function openChatWithNote(customerName) {
    toggleChat();
    const input = document.getElementById('chatInput');
    input.value = `Notering angående ${customerName}: `;
    input.focus();
}

function setupEventListeners() {
    // Stäng modal om man klickar utanför
    window.onclick = function(event) {
        if (event.target == modal) {
            closeJobModal();
        }
    }
}
