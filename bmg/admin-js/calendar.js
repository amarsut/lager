import { collection, onSnapshot, doc, setDoc, updateDoc, deleteDoc } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-firestore.js";
import { db, AppState, showToast } from "./core.js";

let currentCalendarDate = new Date();

const calStyles = {
    'visning': { color: 'bg-purple-100 text-purple-700 border-purple-200 dark:bg-purple-500/20 dark:text-purple-300 dark:border-purple-500/30' },
    'leverans': { color: 'bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-500/20 dark:text-emerald-300 dark:border-emerald-500/30' },
    'mote': { color: 'bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-500/20 dark:text-blue-300 dark:border-blue-500/30' },
    'verkstad': { color: 'bg-orange-100 text-orange-700 border-orange-200 dark:bg-orange-500/20 dark:text-orange-300 dark:border-orange-500/30' },
    'ovrigt': { color: 'bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700' }
};

const weekdays = ["Mån", "Tis", "Ons", "Tor", "Fre", "Lör", "Sön"];

export function initCalendar() {
    setupCalendarScroll();
    renderCalendar();
    listenForCalendarEvents();
    startTodoListener();
    setupCalendarForm();
}

function setupCalendarScroll() {
    const scrollArea = document.getElementById('calendarScrollArea');
    const indicator = document.getElementById('calScrollIndicator');
    if (!scrollArea || !indicator) return;

    window.checkCalendarScroll = () => {
        // Vi lägger till en marginal på 10px för att hantera sub-pixel rendering på mobiler
        const isScrollable = scrollArea.scrollHeight > scrollArea.clientHeight + 10;
        const isAtBottom = Math.ceil(scrollArea.scrollTop + scrollArea.clientHeight) >= scrollArea.scrollHeight - 10;

        if (isScrollable && !isAtBottom) {
            indicator.classList.remove('opacity-0');
        } else {
            indicator.classList.add('opacity-0');
        }
    };

    // Lyssna på manuellt scrollande från användaren
    scrollArea.addEventListener('scroll', window.checkCalendarScroll);
    window.addEventListener('resize', window.checkCalendarScroll);

    // NYTT: Lyssna på när innehållet ändrar form (när bokningar renderas från Firebase)
    const grid = document.getElementById('calendarGrid');
    if (grid) {
        const observer = new ResizeObserver(() => window.checkCalendarScroll());
        observer.observe(grid);
        observer.observe(scrollArea);
    }
}

// --- LÄGG TILL SWIPE-GEST FÖR KALENDERN ---
const gridArea = document.getElementById('calendarScrollArea');
if (gridArea) {
    let touchStartX = 0;
    let touchEndX = 0;

    gridArea.addEventListener('touchstart', e => {
        touchStartX = e.changedTouches[0].screenX;
    }, { passive: true });

    gridArea.addEventListener('touchend', e => {
        touchEndX = e.changedTouches[0].screenX;
        handleSwipe();
    }, { passive: true });

    function handleSwipe() {
        const swipeThreshold = 75; // Hur långt man måste svepa (px)
        if (touchEndX < touchStartX - swipeThreshold) {
            window.changeMonth(1); // Svep vänster = Nästa månad
        }
        if (touchEndX > touchStartX + swipeThreshold) {
            window.changeMonth(-1); // Svep höger = Föregående månad
        }
    }
}

function listenForCalendarEvents() {
    onSnapshot(collection(db, "calendar_events"), (snapshot) => {
        AppState.calendarEvents = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        renderCalendar();
        if (window.updateDashboardBriefing) window.updateDashboardBriefing();
    });
}

function startTodoListener() {
    onSnapshot(collection(db, "global_tasks"), snap => {
        AppState.todos = snap.docs.map(d => ({ id: d.id, ...d.data() })).sort((a, b) => a.done === b.done ? b.createdAt - a.createdAt : a.done ? 1 : -1);

        const list = document.getElementById('todoList');
        if (list) {
            if (AppState.todos.length === 0) {
                list.innerHTML = `<div class="text-center py-10 text-slate-400 dark:text-slate-500 text-sm font-semibold flex flex-col items-center gap-2"><i data-lucide="check-all" class="w-8 h-8 opacity-40 mb-2"></i> Allt är avklarat!</div>`;
            } else {
                list.innerHTML = AppState.todos.map(t => `
<div class="flex items-center gap-3 p-4 hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors border-b border-slate-200 dark:border-slate-700/50 last:border-0 group ${t.done ? 'opacity-50' : ''}">
    <label class="relative flex items-center justify-center mt-0 shrink-0 cursor-pointer min-h-[24px]"> <input type="checkbox" ${t.done ? 'checked' : ''} onchange="window.toggleTodo('${t.id}', this.checked)" class="peer appearance-none w-6 h-6 sm:w-5 sm:h-5 border-2 border-slate-300 hover:border-brand-400 dark:border-slate-600 rounded bg-slate-50 dark:bg-slate-900 checked:bg-emerald-500 checked:border-emerald-500 transition-colors shadow-sm cursor-pointer">
        <i data-lucide="check" class="w-3.5 h-3.5 text-white absolute pointer-events-none opacity-0 peer-checked:opacity-100 transition-opacity"></i>
    </label>
    <div class="flex-1 text-sm font-medium ${t.done ? 'line-through text-slate-500' : 'text-slate-700 dark:text-slate-300'} transition-colors leading-snug whitespace-pre-wrap">${linkify(t.text)}</div>
    <button type="button" onclick="window.deleteTodo('${t.id}')" class="opacity-0 group-hover:opacity-100 text-slate-400 hover:text-red-500 transition-all shrink-0 outline-none flex items-center"><i data-lucide="trash-2" class="w-4 h-4"></i></button> </div>`).join('');
            }
            if (window.lucide) window.lucide.createIcons();
        }
        if (window.updateDashboardBriefing) window.updateDashboardBriefing();
    });
}

function renderCalendar() {
    try {
        const grid = document.getElementById('calendarGrid');
        const header = document.getElementById('calMonthYear');
        if (!grid || !header) return;

        const year = currentCalendarDate.getFullYear();
        const month = currentCalendarDate.getMonth();

        const monthNames = ["Januari", "Februari", "Mars", "April", "Maj", "Juni", "Juli", "Augusti", "September", "Oktober", "November", "December"];
        header.innerText = `${monthNames[month]} ${year}`;

        const firstDay = new Date(year, month, 1).getDay();
        const daysInMonth = new Date(year, month + 1, 0).getDate();
        const daysInPrevMonth = new Date(year, month, 0).getDate();

        let startOffset = firstDay === 0 ? 6 : firstDay - 1;

        grid.innerHTML = '';

        const today = new Date();
        const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;

        if (!Array.isArray(AppState.calendarEvents)) AppState.calendarEvents = [];

        // --- NYTT: Helper för Veckonummer ---
        const getWeekNumber = (d) => {
            d = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
            d.setUTCDate(d.getUTCDate() + 4 - (d.getUTCDay() || 7));
            var yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
            return Math.ceil((((d - yearStart) / 86400000) + 1) / 7);
        };

        // --- NYTT: Enkel lista med röda dagar (uppdatera denna årligen eller hämta från API) ---
        // Format: MM-DD
        const redDays = [
            "01-01", "01-06", "05-01", "06-06", "12-24", "12-25", "12-26", "12-31",
            // Lägg till påsk/midsommar manuellt för det aktuella året om du inte bygger en avancerad kalkylator.
            // För 2024:
            "03-29", // Långfredag
            "03-31", // Påskdagen
            "04-01", // Annandag påsk
            "05-09", // Kristi himmelsfärd
            "06-21", // Midsommarafton
            "06-22", // Midsommardagen
            "11-02", // Alla helgons dag
            // För 2026: Långfredag 04-03, Påskdagen 04-05, Annandag påsk 04-06, Kristi himmelsfärd 05-14, Midsommarafton 06-19, Alla helgons dag 10-31
        ];

        for (let i = 0; i < 42; i++) {
            const dayDiv = document.createElement('div');
            let d, m = month, y = year, isCurrentMonth = true;

            if (i < startOffset) {
                d = daysInPrevMonth - startOffset + i + 1;
                m = month - 1;
                isCurrentMonth = false;
            } else if (i >= startOffset + daysInMonth) {
                d = i - startOffset - daysInMonth + 1;
                m = month + 1;
                isCurrentMonth = false;
            } else {
                d = i - startOffset + 1;
            }

            if (m < 0) { m = 11; y--; } else if (m > 11) { m = 0; y++; }

            const cellDateStr = `${y}-${String(m + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
            const monthDayStr = `${String(m + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`; // För röd-dagar

            const isToday = cellDateStr === todayStr;
            const dayOfWeek = i % 7; // 0=Mån, 5=Lör, 6=Sön
            const isWeekend = dayOfWeek === 5 || dayOfWeek === 6;
            const isRedDay = redDays.includes(monthDayStr) || dayOfWeek === 6; // Söndagar är alltid röda

            const dayName = weekdays[dayOfWeek];

            // --- NYTT: Färgläggning av bakgrunden ---
            let bgClass = '';
            if (isToday) {
                bgClass = 'bg-[#FAFAFA] dark:bg-[#1e293b] z-10'; // Idag: Standardbakgrund
            } else if (isCurrentMonth) {
                if (isWeekend || isRedDay) {
                    bgClass = 'bg-slate-50 dark:bg-[#1e293b]/60'; // Mer kontrast för helger
                } else {
                    bgClass = 'bg-[#FAFAFA] dark:bg-[#1e293b]'; // Vardag
                }
            } else {
                bgClass = 'bg-slate-50 dark:bg-[#1e293b]/40'; // Inte nuvarande månad
            }

            dayDiv.className = `p-2 sm:p-3 flex flex-col transition-colors cursor-pointer group relative hover:bg-slate-50 dark:hover:bg-slate-800 overflow-hidden ${bgClass}`;

            dayDiv.ondragover = (e) => { e.preventDefault(); dayDiv.classList.add('ring-2', 'ring-brand-500', 'ring-inset', 'bg-brand-50', 'dark:bg-brand-500/10'); };
            dayDiv.ondragleave = () => { dayDiv.classList.remove('ring-2', 'ring-brand-500', 'ring-inset', 'bg-brand-50', 'dark:bg-brand-500/10'); };
            dayDiv.ondrop = async (e) => {
                e.preventDefault();
                dayDiv.classList.remove('ring-2', 'ring-brand-500', 'ring-inset', 'bg-brand-50', 'dark:bg-brand-500/10');
                const eventId = e.dataTransfer.getData('eventId');
                if (eventId) {
                    try {
                        await updateDoc(doc(db, "calendar_events", eventId), { date: cellDateStr });
                        showToast("Bokning flyttad!");
                    } catch (err) { showToast("Kunde inte flytta", "error"); }
                }
            };

            dayDiv.onclick = (e) => {
                if (e.target.closest('.cal-event')) return;
                window.openCalendarDrawer(null, cellDateStr);
            };

            const textOpacity = !isCurrentMonth ? 'opacity-30' : 'opacity-100';

            // --- NYTT: Färgläggning av texten (Röda dagar) ---
            let numColor = 'text-slate-800 dark:text-slate-200';
            let dayColor = 'text-slate-500 dark:text-slate-400';

            if (isToday) {
                numColor = 'text-brand-500';
                dayColor = 'text-brand-500';
            } else if (isRedDay) {
                // Mjukare, dämpad röd färg. /80 på dayColor gör den lite mer subtil.
                numColor = 'text-[#e06c75] dark:text-[#e06c75]';
                dayColor = 'text-[#e06c75]/80 dark:text-[#e06c75]/20';
            }

            const dayNameHtml = isToday
                ? `<span class="flex items-center gap-1.5"><div class="w-1.5 h-1.5 rounded-full bg-brand-500"></div>${dayName}</span>`
                : dayName;

            // --- NYTT: Veckonummer på Måndagar ---
            let weekNumberHtml = '';
            if (dayOfWeek === 0) { // Om det är Måndag
                const cellDateObj = new Date(y, m, d);
                const weekNum = getWeekNumber(cellDateObj);
                weekNumberHtml = `<span class="text-[9px] font-bold text-slate-400 ml-2 mt-1">v.${weekNum}</span>`;
            }

            const dateHeader = document.createElement('div');
            dateHeader.className = `mb-1.5 shrink-0 ${textOpacity} pointer-events-none select-none`;
            // --- NYTT: Lägg till veckonummer bredvid datumet ---
            dateHeader.innerHTML = `
                <div class="text-[9px] font-black uppercase tracking-widest ${dayColor} mb-1 leading-none">${dayNameHtml}</div>
                <div class="flex items-center">
                    <div class="text-sm sm:text-base font-bold leading-none tracking-tight ${numColor}">${d}</div>
                    ${weekNumberHtml}
                </div>
            `;
            dayDiv.appendChild(dateHeader);

            const eventsContainer = document.createElement('div');
            eventsContainer.className = 'space-y-1.5 pt-1 w-full';

            const dayEvents = AppState.calendarEvents
                .filter(ev => ev.date === cellDateStr)
                .sort((a, b) => (a.time || "00:00").localeCompare(b.time || "00:00"));

            dayEvents.forEach(ev => {
                const style = calStyles[ev.type] || calStyles['ovrigt'];
                const evDiv = document.createElement('div');

                evDiv.className = `cal-event text-[8.5px] sm:text-xs px-1 sm:px-2 py-0.5 sm:py-1.5 rounded-sm sm:rounded-md border cursor-grab active:cursor-grabbing transition-all hover:brightness-95 dark:hover:brightness-110 shadow-sm flex flex-col leading-tight ${style.color}`;
                evDiv.innerHTML = `
                    <div class="font-bold opacity-80 truncate mb-[1px] sm:mb-0.5">${ev.time || '--:--'}</div>
                    <div class="font-medium truncate sm:whitespace-normal sm:line-clamp-2">${ev.title || 'Okänd'}</div>
                `;

                evDiv.draggable = true;
                evDiv.ondragstart = (e) => {
                    e.dataTransfer.setData('eventId', ev.id);
                    setTimeout(() => evDiv.classList.add('opacity-40'), 0);
                };
                evDiv.ondragend = () => { evDiv.classList.remove('opacity-40'); };
                evDiv.onclick = (e) => { e.stopPropagation(); window.openCalendarDrawer(ev.id); };

                eventsContainer.appendChild(evDiv);
            });

            dayDiv.appendChild(eventsContainer);
            grid.appendChild(dayDiv);
        }

        setTimeout(() => { if (window.checkCalendarScroll) window.checkCalendarScroll(); }, 100);

    } catch (err) {
        console.error("Fel vid uppritning av kalender:", err);
    }
}

window.changeMonth = function (offset) {
    currentCalendarDate.setMonth(currentCalendarDate.getMonth() + offset);
    renderCalendar();
};

window.goToToday = function () {
    currentCalendarDate = new Date();
    renderCalendar();
};

function setupCalendarForm() {
    document.getElementById('calendarForm')?.addEventListener('submit', async (e) => {
        e.preventDefault();
        const btn = document.getElementById('calSubmitBtn');
        const originalText = btn.innerHTML;
        btn.disabled = true;
        btn.innerHTML = '<i data-lucide="loader-2" class="w-4 h-4 animate-spin"></i> Sparar...';

        const id = document.getElementById('cal_id').value;
        const data = {
            type: document.getElementById('cal_type').value,
            title: document.getElementById('cal_title').value,
            date: document.getElementById('cal_date').value,
            time: document.getElementById('cal_time').value,
            notes: document.getElementById('cal_notes').value
        };

        try {
            if (id) {
                await updateDoc(doc(db, "calendar_events", id), data);
                showToast("Bokning uppdaterad!");
            } else {
                await setDoc(doc(collection(db, "calendar_events")), data);
                showToast("Bokning skapad!");
            }
            window.closeCalendarDrawer();
        } catch (error) {
            showToast("Kunde inte spara", "error");
        } finally {
            btn.disabled = false;
            btn.innerHTML = originalText;
            if (window.lucide) window.lucide.createIcons({ root: btn });
        }
    });

    const todoInput = document.getElementById('newTodoInput');
    if (todoInput) {
        todoInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                document.getElementById('addTodoForm')?.dispatchEvent(new Event('submit'));
            } else {
                setTimeout(() => {
                    todoInput.style.height = 'auto';
                    todoInput.style.height = (todoInput.scrollHeight) + 'px';
                }, 0);
            }
        });
    }

    document.getElementById('addTodoForm')?.addEventListener('submit', async e => {
        e.preventDefault();
        const input = document.getElementById('newTodoInput');
        const val = input.value.trim();
        if (!val) return;
        try {
            await setDoc(doc(collection(db, "global_tasks")), { text: val, done: false, createdAt: Date.now() });
            input.value = '';
            input.style.height = '46px';
        } catch (err) { console.error(err); }
    });

    window.toggleTodo = (id, done) => updateDoc(doc(db, "global_tasks", id), { done });
    window.deleteTodo = (id) => deleteDoc(doc(db, "global_tasks", id));
}

window.openCalendarDrawer = function (eventId = null, presetDate = null) {
    const drawer = document.getElementById('calendarDrawer');
    const backdrop = document.getElementById('calendarDrawerBackdrop');
    const form = document.getElementById('calendarForm');

    if (!drawer || !backdrop) return;

    form.reset();
    document.getElementById('cal_id').value = '';

    if (eventId && typeof eventId === 'string') {
        const ev = AppState.calendarEvents.find(e => e.id === eventId);
        if (ev) {
            document.getElementById('drawerTitle').innerHTML = '<i data-lucide="calendar" class="w-5 h-5 text-brand-500"></i> Redigera Bokning';
            document.getElementById('cal_id').value = ev.id;
            document.getElementById('cal_type').value = ev.type || 'ovrigt';
            document.getElementById('cal_title').value = ev.title || '';
            document.getElementById('cal_date').value = ev.date || '';
            document.getElementById('cal_time').value = ev.time || '12:00';
            document.getElementById('cal_notes').value = ev.notes || '';

            document.getElementById('calSubmitBtn').innerHTML = '<i data-lucide="save" class="w-4 h-4"></i> Uppdatera Bokning';
            document.getElementById('calDeleteBtn').classList.remove('hidden');
        }
    } else {
        document.getElementById('drawerTitle').innerHTML = '<i data-lucide="calendar-plus" class="w-5 h-5 text-brand-500"></i> Ny Bokning';

        let dateStr = presetDate;
        if (!dateStr && eventId instanceof Event) dateStr = new Date().toISOString().split('T')[0];
        document.getElementById('cal_date').value = dateStr || new Date().toISOString().split('T')[0];

        document.getElementById('calSubmitBtn').innerHTML = '<i data-lucide="save" class="w-4 h-4"></i> Spara Bokning';
        document.getElementById('calDeleteBtn').classList.add('hidden');
    }

    if (window.lucide) window.lucide.createIcons();

    backdrop.classList.remove('hidden');
    void backdrop.offsetWidth;
    backdrop.classList.remove('opacity-0', 'pointer-events-none');
    drawer.classList.remove('translate-x-full');
};

window.closeCalendarDrawer = function () {
    const drawer = document.getElementById('calendarDrawer');
    const backdrop = document.getElementById('calendarDrawerBackdrop');
    if (!drawer || !backdrop) return;

    drawer.classList.add('translate-x-full');
    backdrop.classList.add('opacity-0', 'pointer-events-none');
    setTimeout(() => { backdrop.classList.add('hidden'); }, 300);
};

window.deleteCalendarEvent = async () => {
    const eventId = document.getElementById('cal_id').value;
    if (!eventId || !confirm("Är du säker på att du vill ta bort denna bokning?")) return;
    try {
        await deleteDoc(doc(db, "calendar_events", eventId));
        showToast("Bokningen raderades");
        window.closeCalendarDrawer();
    } catch (err) {
        showToast("Kunde inte radera", "error");
    }
};

// Hjälpfunktion för att göra länkar klickbara i text
function linkify(text) {
    if (!text) return '';

    // Hittar länkar som börjar på http://, https:// eller www.
    const urlRegex = /(https?:\/\/[^\s]+)|(www\.[^\s]+)/g;

    return text.replace(urlRegex, function (url) {
        let href = url;
        // Om länken bara börjar på "www", lägg till https:// framför så att webbläsaren förstår
        if (!href.startsWith('http')) {
            href = 'https://' + url;
        }

        // Returnerar en klickbar <a>-tagg
        // onclick="event.stopPropagation()" ser till att klicket inte av misstag bockar för uppgiften
        return `<a href="${href}" target="_blank" rel="noopener noreferrer" class="text-brand-500 hover:text-brand-600 hover:underline transition-colors" onclick="event.stopPropagation()">${url}</a>`;
    });
}