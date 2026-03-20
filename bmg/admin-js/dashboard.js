import { AppState } from "./core.js";

export function initDashboardBriefing() {
    startClock();
    window.updateDashboardBriefing();
}

function startClock() {
    const clockEl = document.getElementById('dashClock');
    const dateEl = document.getElementById('dashDate');
    if (!clockEl) return;

    const updateTime = () => {
        const now = new Date();
        clockEl.innerText = now.toLocaleTimeString('sv-SE', { hour: '2-digit', minute: '2-digit' });
        if (dateEl) {
            dateEl.innerText = now.toLocaleDateString('sv-SE', { weekday: 'long', day: 'numeric', month: 'short' });
        }
    };

    setInterval(updateTime, 1000);
    updateTime();
}

window.goToTab = function (tabId, filterValue) {
    const tabBtn = document.querySelector(`[data-target='${tabId}']`);
    if (tabBtn) tabBtn.click();

    setTimeout(() => {
        if (tabId === 'crm' && filterValue) {
            const filterEl = document.getElementById('kanbanFilter');
            if (filterEl) { filterEl.value = filterValue; filterEl.dispatchEvent(new Event('change')); }
        }
        if (tabId === 'inventory' && filterValue) {
            const filterEl = document.getElementById('tableSorter');
            if (filterEl) { filterEl.value = filterValue; filterEl.dispatchEvent(new Event('change')); }
        }
    }, 150);
}

window.updateDashboardBriefing = function () {
    const hour = new Date().getHours();
    let greeting = "Goddag";
    if (hour < 10) greeting = "God morgon";
    else if (hour > 17) greeting = "God kväll";
    const msgEl = document.getElementById('greetingMsg');
    if (msgEl) msgEl.innerText = `${greeting}, Ibrahim`;

    // 1. KALENDER (Fyrkantiga block)
    const agendaList = document.getElementById('dashAgendaList');
    if (agendaList) {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const nextWeek = new Date(today);
        nextWeek.setDate(today.getDate() + 7);
        nextWeek.setHours(23, 59, 59, 999);

        const upcomingEvents = AppState.calendarEvents.filter(e => {
            const evDate = new Date(`${e.date}T00:00:00`);
            return evDate >= today && evDate <= nextWeek;
        }).sort((a, b) => {
            const dateA = new Date(`${a.date}T${a.time}`);
            const dateB = new Date(`${b.date}T${b.time}`);
            return dateA - dateB;
        });

        if (upcomingEvents.length === 0) {
            agendaList.innerHTML = `<div class="p-6 text-sm text-slate-600 font-medium text-center">Inga bokningar närmaste veckan.</div>`;
        } else {
            const styles = {
                'visning': 'text-purple-500 bg-purple-50 dark:bg-purple-500/10 border-purple-200 dark:border-purple-500/20',
                'leverans': 'text-emerald-500 bg-emerald-50 dark:bg-emerald-500/10 border-emerald-200 dark:border-emerald-500/20',
                'mote': 'text-blue-500 bg-blue-50 dark:bg-blue-500/10 border-blue-200 dark:border-blue-500/20',
                'verkstad': 'text-orange-500 bg-orange-50 dark:bg-orange-500/10 border-orange-200 dark:border-orange-500/20',
                'ovrigt': 'text-slate-600 bg-slate-50 dark:bg-slate-500/10 border-slate-200 dark:border-slate-500/20'
            };

            agendaList.innerHTML = upcomingEvents.map(ev => {
                const badgeStyle = styles[ev.type] || styles['ovrigt'];
                const evDateObj = new Date(ev.date);
                let dayStr = evDateObj.toDateString() === today.toDateString() ? "Idag" : evDateObj.toLocaleDateString('sv-SE', { weekday: 'short' });

                return `
                <div class="flex items-center gap-3 sm:gap-4 p-3 sm:p-4 hover:bg-slate-50 dark:hover:bg-slate-800/40 cursor-pointer transition-colors border-b border-slate-200 dark:border-slate-700/50 last:border-0 group" onclick="window.goToTab('calendar')">
                    <div class="flex flex-col items-center justify-center w-10 h-10 sm:w-12 sm:h-12 rounded bg-slate-100 dark:bg-slate-800 group-hover:bg-[#FAFAFA] dark:group-hover:bg-slate-700 transition-colors shrink-0 border border-slate-200 dark:border-slate-700/50 shadow-sm">
                        <span class="text-[8px] sm:text-[9px] font-bold uppercase tracking-widest text-slate-600 dark:text-slate-400 mb-0.5">${dayStr}</span>
                        <span class="text-xs sm:text-sm font-black text-slate-800 dark:text-white leading-none">${ev.time}</span>
                    </div>
                    <div class="flex-1 min-w-0">
                        <div class="font-bold text-xs sm:text-sm text-slate-800 dark:text-white truncate group-hover:text-brand-500 transition-colors">${ev.title}</div>
                    </div>
                    <div class="px-1.5 py-1 sm:px-2 sm:py-1.5 rounded text-[8px] sm:text-[9px] font-bold uppercase tracking-widest border shrink-0 ${badgeStyle}">${ev.type}</div>
                </div>`;
            }).join('');
        }
    }

    // 2. UPPGIFTER (Fyrkantiga custom checkboxes)
    const dashTodoList = document.getElementById('dashTodoList');
    if (dashTodoList) {
        const activeTodos = AppState.todos.filter(t => !t.done).slice(0, 5);
        if (activeTodos.length === 0) {
            dashTodoList.innerHTML = `<div class="p-6 text-sm text-slate-600 font-medium text-center">Inga uppgifter.</div>`;
        } else {
            dashTodoList.innerHTML = activeTodos.map(t => `
            <div class="flex items-start gap-3 p-4 hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors border-b border-slate-200 dark:border-slate-700/50 last:border-0 group min-h-[44px]">
                <label class="relative flex items-center justify-center mt-0.5 shrink-0 cursor-pointer">
                    <input type="checkbox" onchange="window.toggleTodo('${t.id}', this.checked)" class="peer appearance-none w-6 h-6 sm:w-5 sm:h-5 border-2 border-slate-300 hover:border-brand-400 dark:border-slate-600 rounded bg-slate-50 dark:bg-slate-900 checked:bg-emerald-500 checked:border-emerald-500 transition-colors cursor-pointer shadow-sm">
                    <i data-lucide="check" class="w-3 h-3 sm:w-3.5 sm:h-3.5 text-white absolute pointer-events-none opacity-0 peer-checked:opacity-100 transition-opacity"></i>
                </label>
                <span class="flex-1 text-xs sm:text-sm font-medium text-slate-700 dark:text-slate-300 group-hover:text-slate-900 dark:group-hover:text-white transition-colors leading-snug line-clamp-2">${linkify(t.text)}</span>
            </div>`).join('');
        }
    }

    // 3. FLÖDE
    const feedList = document.getElementById('dashActivityFeed');
    if (feedList) {
        let feedItems = [];
        const recentLeads = [...AppState.leads].filter(l => l.status === 'new').sort((a, b) => (b.createdAt?.toMillis() || 0) - (a.createdAt?.toMillis() || 0)).slice(0, 4);
        recentLeads.forEach(lead => feedItems.push({ type: 'lead', time: lead.createdAt ? lead.createdAt.toMillis() : Date.now(), title: 'Ny Lead inkommen', desc: lead.name, color: 'bg-blue-500' }));

        feedItems.sort((a, b) => b.time - a.time);

        if (feedItems.length === 0) {
            feedList.innerHTML = `<div class="p-6 text-sm text-slate-600 font-medium text-center">Ingen aktivitet.</div>`;
        } else {
            feedList.innerHTML = feedItems.map((item, i) => `
            <div class="relative flex gap-4 items-start p-4 hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors cursor-pointer group border-b border-slate-200 dark:border-slate-700/50 last:border-0" onclick="window.goToTab('crm')">
                ${i !== feedItems.length - 1 ? `<div class="absolute left-[21.5px] top-10 bottom-[-16px] w-[2px] bg-slate-200 dark:bg-slate-700/50"></div>` : ''}
                <div class="w-3 h-3 rounded-full ${item.color} mt-1.5 shrink-0 ring-4 ring-white dark:ring-[#1e293b] group-hover:ring-slate-50 dark:group-hover:ring-slate-800/40 z-10 transition-all"></div>
                <div class="flex-1">
                    <div class="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-0.5">${item.title}</div>
                    <div class="text-sm font-semibold text-slate-800 dark:text-white group-hover:text-brand-500 transition-colors">${item.desc}</div>
                </div>
                <div class="w-6 h-6 rounded flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"><i data-lucide="chevron-right" class="w-4 h-4 text-slate-400"></i></div>
            </div>`).join('');
        }
    }

    const leadKpi = document.getElementById('kpiLeads');
    if (leadKpi) leadKpi.innerText = AppState.leads.filter(l => l.status === 'new').length;

    if (window.lucide) window.lucide.createIcons();
}

// Hjälpfunktion för att göra länkar klickbara på dashboarden (anpassad för <label>)
function linkify(text) {
    if (!text) return '';
    const urlRegex = /(https?:\/\/[^\s]+)|(www\.[^\s]+)/g;
    
    return text.replace(urlRegex, function(url) {
        let href = url;
        if (!href.startsWith('http')) href = 'https://' + url;
        
        // window.open och return false förhindrar att checkboxen triggas när vi klickar på länken
        return `<a href="${href}" class="text-brand-500 hover:text-brand-600 hover:underline transition-colors pointer-events-auto" onclick="window.open(this.href, '_blank'); return false;">${url}</a>`;
    });
}