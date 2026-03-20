import { collection, onSnapshot, doc, updateDoc, deleteDoc, setDoc } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-firestore.js";
import { db, AppState, showToast, formatRelativeDate } from "./core.js";

const kanbanColumns = [
    { id: 'new', title: 'Nya Leads', dotClass: 'bg-blue-500 shadow-[0_0_6px_rgba(59,130,246,0.8)]' },
    { id: 'contacted', title: 'Kontaktade', dotClass: 'bg-amber-500 shadow-[0_0_6px_rgba(245,158,11,0.8)]' },
    { id: 'viewing', title: 'Visning Inbokad', dotClass: 'bg-purple-500 shadow-[0_0_6px_rgba(168,85,247,0.8)]' },
    { id: 'won', title: 'Vunna Affärer', dotClass: 'bg-emerald-500 shadow-[0_0_6px_rgba(16,185,129,0.8)]' }
];

export function initCRM() {
    buildKanbanColumns();
    listenForLeads();
    setupCRMListeners();
}

function buildKanbanColumns() {
    const container = document.getElementById('kanbanContainer');
    if(!container) return;
    container.innerHTML = '';
    
    kanbanColumns.forEach((col, index) => {
        const colDiv = document.createElement('div');
        colDiv.className = 'kanban-col relative';
        
        // Pilen som binder ihop kolumnerna (ritas inte ut på sista kolumnen)
        const isLast = index === kanbanColumns.length - 1;
        const arrowHtml = !isLast ? `
            <div class="absolute -right-4 sm:-right-6 top-3.5 z-0 hidden sm:flex items-center justify-center text-slate-300 dark:text-slate-700 pointer-events-none">
                <i data-lucide="chevron-right" class="w-5 h-5"></i>
            </div>
        ` : '';

        colDiv.innerHTML = `
            ${arrowHtml}
            <div class="flex items-center justify-between mb-4 px-1 shrink-0 select-none relative z-10">
                <div class="inline-flex items-center gap-2 px-3 py-1.5 rounded bg-[#FAFAFA] dark:bg-[#1e293b] border border-slate-200 dark:border-slate-800 shadow-sm">
                    <span class="w-2 h-2 rounded-full ${col.dotClass}"></span>
                    <span class="text-[11px] font-bold text-slate-800 dark:text-slate-200 tracking-wider uppercase">${col.title}</span>
                </div>
                
                <button type="button" onclick="window.openCrmDrawer(null, '${col.id}')" class="w-7 h-7 flex items-center justify-center rounded text-slate-400 hover:text-brand-500 hover:bg-[#FAFAFA] dark:hover:bg-[#1e293b] hover:shadow-sm border border-transparent hover:border-slate-200 dark:hover:border-slate-700 transition-all outline-none" title="Skapa ny i ${col.title}">
                    <i data-lucide="plus" class="w-4 h-4"></i>
                </button>
            </div>
            
            <div id="col-${col.id}" class="flex-1 overflow-y-auto no-scrollbar flex flex-col gap-3 pb-10 min-h-[150px] transition-colors rounded border border-slate-100 dark:border-transparent bg-slate-100/50 dark:bg-transparent p-2 sm:p-3 relative z-10"></div>
        `;
        
        const dropZone = colDiv.querySelector(`#col-${col.id}`);
        colDiv.addEventListener('dragover', e => { e.preventDefault(); dropZone.classList.add('bg-slate-100/50', 'dark:bg-[#1e293b]/50', 'dark:border-slate-800/50'); });
        colDiv.addEventListener('dragleave', () => dropZone.classList.remove('bg-slate-100/50', 'dark:bg-[#1e293b]/50', 'dark:border-slate-800/50'));
        colDiv.addEventListener('drop', e => { dropZone.classList.remove('bg-slate-100/50', 'dark:bg-[#1e293b]/50', 'dark:border-slate-800/50'); handleDrop(e, col.id); });
        
        container.appendChild(colDiv);
    });
}

function listenForLeads() {
    onSnapshot(collection(db, "leads"), (snapshot) => {
        AppState.leads = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        renderKanban();
        
        const newCount = AppState.leads.filter(l => l.status === 'new').length;
        const badge = document.getElementById('crmBadge');
        if(badge) {
            if (newCount > 0) { badge.innerText = newCount; badge.classList.remove('hidden'); } 
            else { badge.classList.add('hidden'); }
        }
        if(window.updateDashboardBriefing) window.updateDashboardBriefing(); 
    });
}

function renderKanban() {
    kanbanColumns.forEach(col => {
        const el = document.getElementById(`col-${col.id}`);
        if(el) el.innerHTML = '';
    });
    
    const sortedLeads = [...AppState.leads].sort((a, b) => (b.createdAt?.toMillis() || 0) - (a.createdAt?.toMillis() || 0));

    // Rita ut korten
    sortedLeads.forEach(lead => {
        // Om användaren raderat filterna via HTML, ignoreras dessa nu tyst
        if (AppState.filterMode === 'active' && lead.status === 'won') return;
        if (AppState.filterMode === 'hot' && lead.status !== 'viewing') return;
        if (AppState.filterMode === 'new' && lead.status !== 'new') return;
        if (AppState.searchQuery) {
            const searchStr = `${lead.name} ${lead.email} ${lead.phone} ${lead.subject} ${lead.notes}`.toLowerCase();
            if (!searchStr.includes(AppState.searchQuery)) return;
        }
        
        const colId = kanbanColumns.find(c => c.id === lead.status) ? lead.status : null;
        if (colId) {
            document.getElementById(`col-${colId}`)?.appendChild(createLeadCard(lead));
        }
    });

    // Rita ut snygga "Tomt"-meddelanden för kolumner utan kort
    kanbanColumns.forEach(col => {
        const colEl = document.getElementById(`col-${col.id}`);
        if (colEl && colEl.children.length === 0) {
            colEl.innerHTML = `
                <div class="h-full flex flex-col items-center justify-center text-slate-400 dark:text-slate-600 pointer-events-none mt-4 opacity-50">
                    <i data-lucide="inbox" class="w-8 h-8 mb-2"></i>
                    <span class="text-[10px] font-bold uppercase tracking-widest">Tomt</span>
                </div>
            `;
        }
    });

    if(window.lucide) window.lucide.createIcons();
}

function createLeadCard(lead) {
    const card = document.createElement('div');
    const isOld = lead.createdAt && (Date.now() - lead.createdAt.toMillis()) > 14 * 24 * 60 * 60 * 1000;
    
    card.className = `bg-[#FAFAFA] dark:bg-[#1e293b] p-4 rounded shadow-lg border border-slate-200 dark:border-slate-800 hover:border-brand-500/50 dark:hover:border-brand-500/50 transition-all cursor-grab active:cursor-grabbing group relative select-none flex flex-col gap-3`;
    card.draggable = true;
    
    card.addEventListener('dragstart', e => { e.dataTransfer.setData("leadId", lead.id); setTimeout(() => card.classList.add('opacity-40', 'scale-95'), 0); });
    card.addEventListener('dragend', () => card.classList.remove('opacity-40', 'scale-95'));
    card.addEventListener('click', () => window.openCrmDrawer(lead.id));

    let carModel = lead.subject || 'Okänt fordon';
    if (carModel.toLowerCase().includes('intresseanmälan:')) carModel = carModel.replace(/intresseanmälan:/i, '').trim();
    carModel = carModel.split(' ').slice(0, 3).join(' ');

    const dateStr = lead.createdAt ? formatRelativeDate(lead.createdAt) : '';
    
    card.innerHTML = `
        <div class="flex justify-between items-start pointer-events-none gap-2">
            <h4 class="text-[15px] font-black text-slate-900 dark:text-white leading-snug truncate">${lead.name || 'Okänd'}</h4>
            <button class="text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity shrink-0 outline-none hover:text-brand-500 pointer-events-auto" title="Hantera">
                <i data-lucide="more-horizontal" class="w-5 h-5"></i>
            </button>
        </div>

        <div class="flex flex-wrap items-center gap-2 pointer-events-none">
            <div class="inline-flex items-center gap-1.5 bg-slate-50 dark:bg-[#0f172a] border border-slate-200 dark:border-slate-700/50 text-slate-700 dark:text-slate-300 text-[10px] font-bold px-2 py-0.5 rounded shadow-sm uppercase tracking-widest">
                <i data-lucide="car" class="w-3 h-3 opacity-70"></i>
                <span class="truncate max-w-[160px]">${carModel}</span>
            </div>
            
            ${isOld && lead.status !== 'won' ? `
            <div class="inline-flex items-center gap-1.5 bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 text-red-600 dark:text-red-400 text-[10px] font-bold px-2 py-0.5 rounded shadow-sm uppercase tracking-widest">
                <span class="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse"></span> Kall
            </div>` : ''}
        </div>

        <div class="flex items-center justify-between mt-1 border-t border-slate-200 dark:border-slate-800/60 pt-3 pointer-events-none">
            <div class="flex items-center gap-1.5 text-[9px] font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500">
                <i data-lucide="clock" class="w-3.5 h-3.5"></i> ${dateStr}
            </div>
            
            <div class="flex gap-1.5 items-center pointer-events-auto">
                ${lead.notes?.trim() ? `<div class="text-brand-500 mr-1" title="Anteckningar finns"><i data-lucide="align-left" class="w-4 h-4"></i></div>` : ''}
                ${lead.phone ? `<button type="button" onclick="event.stopPropagation(); window.location.href='tel:${lead.phone.replace(/\s/g, '')}'" class="w-8 h-8 flex items-center justify-center rounded hover:bg-slate-100 dark:hover:bg-[#0f172a] text-slate-500 dark:text-slate-300 hover:text-brand-500 dark:hover:text-white transition-colors outline-none shadow-sm"><i data-lucide="phone" class="w-3.5 h-3.5"></i></button>` : ''}
                ${lead.email ? `<button type="button" onclick="event.stopPropagation(); window.location.href='mailto:${lead.email}'" class="w-8 h-8 flex items-center justify-center rounded hover:bg-slate-100 dark:hover:bg-[#0f172a] text-slate-500 dark:text-slate-300 hover:text-brand-500 dark:hover:text-white transition-colors outline-none shadow-sm"><i data-lucide="mail" class="w-3.5 h-3.5"></i></button>` : ''}
            </div>
        </div>
    `;
    return card;
}

async function handleDrop(e, newStatus) {
    const leadId = e.dataTransfer.getData("leadId");
    if (!leadId) return;

    const lead = AppState.leads.find(l => l.id === leadId);
    if (lead && lead.status !== newStatus) {
        lead.status = newStatus;
        renderKanban(); 
        try { await updateDoc(doc(db, "leads", leadId), { status: newStatus }); showToast("Kund flyttad!"); } 
        catch (err) { showToast("Kunde inte flytta", "error"); }
    }
}

function setupCRMListeners() {
    // Sök & filter ignorerar error nu om du tagit bort dem från HTML
    document.getElementById('kanbanSearch')?.addEventListener('input', e => { AppState.searchQuery = e.target.value.toLowerCase(); renderKanban(); });
    document.getElementById('kanbanFilter')?.addEventListener('change', e => { AppState.filterMode = e.target.value; renderKanban(); });
    
    document.getElementById('btnNewLead')?.addEventListener('click', () => { window.openCrmDrawer(null); });

    document.getElementById('newLeadForm')?.addEventListener('submit', async e => {
        e.preventDefault();
        const btn = e.target.querySelector('button'); 
        const originalText = btn.innerHTML;
        btn.disabled = true; btn.innerHTML = '<i data-lucide="loader-2" class="w-4 h-4 animate-spin"></i> Sparar...';
        try {
            await setDoc(doc(collection(db, "leads")), {
                name: document.getElementById('nl_name').value, phone: document.getElementById('nl_phone').value,
                email: document.getElementById('nl_email').value, subject: document.getElementById('nl_subject').value,
                status: document.getElementById('nl_status').value, message: "Inlagd manuellt.", notes: "", createdAt: new Date()
            });
            showToast("Lead skapat!"); 
            window.closeCrmDrawer();
        } catch (err) { showToast("Kunde inte spara", "error"); } 
        finally { btn.disabled = false; btn.innerHTML = originalText; if(window.lucide) window.lucide.createIcons({root: btn}); }
    });

    document.getElementById('modalLeadStatus')?.addEventListener('change', async e => {
        if (!AppState.currentLeadId) return;
        try { await updateDoc(doc(db, "leads", AppState.currentLeadId), { status: e.target.value }); showToast("Status uppdaterad!"); } 
        catch (err) { showToast("Fel vid ändring", "error"); }
    });

    document.getElementById('btnDeleteLead')?.addEventListener('click', async () => {
        if (!AppState.currentLeadId || !confirm("Radera detta lead permanent?")) return;
        try { await deleteDoc(doc(db, "leads", AppState.currentLeadId)); showToast("Lead raderades"); window.closeCrmDrawer(); } 
        catch (err) { showToast("Fel vid radering", "error"); }
    });

    let noteTimeout;
    document.getElementById('modalLeadNotes')?.addEventListener('input', e => {
        if (!AppState.currentLeadId) return;
        clearTimeout(noteTimeout);
        const statusEl = document.getElementById('saveNotesStatus'); 
        statusEl.classList.remove('hidden', 'opacity-0');
        noteTimeout = setTimeout(async () => {
            try { await updateDoc(doc(db, "leads", AppState.currentLeadId), { notes: e.target.value }); setTimeout(() => statusEl.classList.add('opacity-0'), 2000); } 
            catch (err) { showToast("Fel vid sparning", "error"); }
        }, 800);
    });
}

// Gör så att + knappen kan skicka med vilken kolumn den tillhör
window.openCrmDrawer = function(id = null, defaultCol = 'new') {
    const drawer = document.getElementById('crmDrawer');
    const backdrop = document.getElementById('crmDrawerBackdrop');
    const newForm = document.getElementById('newLeadForm');
    const viewArea = document.getElementById('crmDrawerView');
    const title = document.getElementById('crmDrawerTitle');

    if (id) {
        const lead = AppState.leads.find(l => l.id === id);
        if (!lead) return;
        AppState.currentLeadId = id;
        
        newForm.classList.add('hidden');
        viewArea.classList.remove('hidden');
        title.innerHTML = '<i data-lucide="user" class="w-5 h-5 text-brand-500"></i> Hantera Lead';

        document.getElementById('modalLeadName').innerText = lead.name || 'Okänd Kund';
        let cleanSubject = lead.subject || 'Generell Fråga';
        if (cleanSubject.includes('Intresseanmälan:')) cleanSubject = cleanSubject.replace('Intresseanmälan:', '').trim().split(' ').slice(0, 3).join(' ');
        document.getElementById('modalLeadSubject').innerHTML = `Gäller: ${cleanSubject}`;

        const pEl = document.getElementById('modalLeadPhone'); 
        pEl.innerText = lead.phone || '-'; pEl.href = lead.phone ? `tel:${lead.phone.replace(/\s/g, '')}` : '#';
        const eEl = document.getElementById('modalLeadEmail'); 
        eEl.innerText = lead.email || '-'; eEl.href = lead.email ? `mailto:${lead.email}` : '#';
        
        document.getElementById('modalLeadMessage').innerText = lead.message || 'Inget meddelande angivet.';
        document.getElementById('modalLeadNotes').value = lead.notes || '';
        document.getElementById('modalLeadStatus').value = lead.status || 'new';

        if(window.calculateFinance) window.calculateFinance(); 
    } else {
        AppState.currentLeadId = null;
        document.getElementById('newLeadForm').reset();
        
        // Sätt dropdown i formuläret till den kolumn man klickade på
        const statusDropdown = document.getElementById('nl_status');
        if(statusDropdown) statusDropdown.value = defaultCol;
        
        viewArea.classList.add('hidden');
        newForm.classList.remove('hidden');
        title.innerHTML = '<i data-lucide="user-plus" class="w-5 h-5 text-brand-500"></i> Nytt Lead';
    }

    if(window.lucide) window.lucide.createIcons();
    backdrop.classList.remove('hidden');
    void backdrop.offsetWidth; 
    backdrop.classList.remove('opacity-0', 'pointer-events-none');
    drawer.classList.remove('translate-x-full');
};

window.closeCrmDrawer = function() {
    const drawer = document.getElementById('crmDrawer');
    const backdrop = document.getElementById('crmDrawerBackdrop');
    
    drawer.classList.add('translate-x-full');
    backdrop.classList.add('opacity-0', 'pointer-events-none');
    setTimeout(() => { backdrop.classList.add('hidden'); }, 300);
};