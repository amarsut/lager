// calendar.js

let calendar = null;

function mapJobsToEvents(jobs) {
    return jobs
        .filter(job => !job.deleted && job.status !== 'avbokad')
        .map(job => {
            // Datum & Tid
            let start = job.datum.includes('T') ? job.datum : `${job.datum}T${job.tid || '08:00'}`;
            
            // Färgpalett
            let mainColor = '#3b82f6'; let lightColor = '#eff6ff'; // Blå
            
            if (job.status === 'klar') { mainColor = '#10b981'; lightColor = '#ecfdf5'; } // Grön
            else if (job.status === 'faktureras') { mainColor = '#8b5cf6'; lightColor = '#f5f3ff'; } // Lila
            else if (job.status === 'offererad') { mainColor = '#f59e0b'; lightColor = '#fffbeb'; } // Orange

            let regnr = job.regnr && job.regnr !== 'OKÄNT' ? job.regnr : '';
            
            return {
                id: job.id,
                title: job.kundnamn,
                start: start,
                extendedProps: {
                    time: start.split('T')[1].substring(0, 5).replace(':', '.'),
                    regnr: regnr,
                    status: job.status,
                    mainColor: mainColor,
                    lightColor: lightColor,
                    description: job.kommentar || ''
                },
                backgroundColor: mainColor, 
                borderColor: mainColor
            };
        });
}

// FIXAD FUNKTION: Renderar listan för vald dag (Mobilvy)
function renderDayList(dateStr, events) {
    const container = document.getElementById('selectedDayView');
    if (!container) return;

    // FIX: Jämför bara de första 10 tecknen (YYYY-MM-DD) för att ignorera tid
    const dayEvents = events.filter(e => e.start.substring(0, 10) === dateStr);
    
    // Sortera på tid
    dayEvents.sort((a,b) => a.start.localeCompare(b.start));

    container.style.display = 'block';
    
    // Scrolla ner till listan så den syns
    setTimeout(() => {
        container.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }, 100);

    container.classList.add('show');

    if (!history.state || !history.state.dayListOpen) {
        history.pushState({ uiState: 'calendar', dayListOpen: true }, null, window.location.href);
    }

    if (dayEvents.length === 0) {
        container.innerHTML = `<div class="day-list-empty">Inga jobb detta datum (${dateStr})</div>`;
        return;
    }

    let html = `<div class="day-list-header">Jobb ${dateStr}</div>`;
    
    dayEvents.forEach(evt => {
        const props = evt.extendedProps;
        // Skapa kortet
        html += `
        <div class="day-list-item" onclick="if(window.openEditModal) window.openEditModal('${evt.id}')" style="border-left: 4px solid ${props.mainColor};">
            <div class="day-list-time">${props.time}</div>
            <div class="day-list-info">
                <span class="day-list-title">${evt.title}</span>
                <div class="day-list-meta">
                    ${props.regnr ? `<span class="day-list-reg">${props.regnr}</span>` : ''}
                    ${props.description ? `<span class="day-list-desc">${props.description}</span>` : ''}
                </div>
            </div>
        </div>`;
    });

    container.innerHTML = html;
}

// Global funktion för att stänga listan
window.closeDayList = function() {
    const container = document.getElementById('selectedDayView');
    if (container) {
        container.classList.remove('show');
        // Ta bort markeringen i kalendern
        document.querySelectorAll('.fc-day-selected').forEach(el => el.classList.remove('fc-day-selected'));
    }
    // Om vi stänger manuellt, backa historiken om den är öppen
    if (history.state && history.state.dayListOpen) {
        history.back();
    }
};

// Hjälpfunktion för datumformat vid Drag & Drop
function formatDateForFirebase(dateObj) {
    const year = dateObj.getFullYear();
    const month = String(dateObj.getMonth() + 1).padStart(2, '0');
    const day = String(dateObj.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}T08:00`; // Sätter standardtid 08:00 vid drop
}

export function initCalendar(elementId, jobsData, onEventClickCallback, onDropCallback, onExternalDropCallback) {
    const wrapperEl = document.getElementById('calendar-wrapper');
    if (!wrapperEl) return;

    if (calendar) calendar.destroy();

    const isMobile = window.innerWidth <= 768;
    const events = mapJobsToEvents(jobsData);

    calendar = new FullCalendar.Calendar(wrapperEl, {
        initialView: 'dayGridMonth',
        locale: 'sv',
        firstDay: 1,
        fixedWeekCount: false,
        showNonCurrentDates: false,
        height: 'auto',
        contentHeight: 'auto',
        
        // --- Drag & Drop ---
        editable: true,       
        droppable: true,      // Måste vara true för att ta emot externa
        eventStartEditable: true, 
        eventDurationEditable: false,
        
        // --- PUNKT 5: Anpassat datumformat ---
        titleFormat: isMobile 
            ? { year: 'numeric', month: 'short' } // "Dec 2025" på mobil
            : { year: 'numeric', month: 'long' }, // "December 2025" på dator

        // --- Anpassad knapp ---
        customButtons: {
            toggleSidebarBtn: {
                text: 'Visa',
                click: function() {
                    // Vi kallar den globala funktionen (definierad i app.js)
                    if(window.toggleCalendarSidebar) window.toggleCalendarSidebar();
                }
            }
        },

        headerToolbar: {
            // Vänster sida: Pilar + Titel
            left: 'prev,next title', 
            
            // Mitten: Tomt
            center: '',         
            
            // Höger sida: "Visa Obokade" + "Idag" (Med mellanslag emellan så de hamnar i samma grupp)
            right: 'today toggleSidebarBtn' 
        },
        buttonText: { today: 'Idag' },

        // --- PUNKT 1: HOVER LOGIK (Fixad positionering) ---
        eventMouseEnter: function(info) {
            if (window.innerWidth <= 768) return; // Ingen hover på mobil
            
            const props = info.event.extendedProps;
            const timeStr = props.time || '';
            const regNr = props.regnr || '---';
            const title = info.event.title;
            const desc = props.description || '';

            // Hämta eller skapa tooltip
            let tooltip = document.getElementById('fc-custom-tooltip');
            if (!tooltip) {
                tooltip = document.createElement('div');
                tooltip.id = 'fc-custom-tooltip';
                tooltip.className = 'calendar-tooltip';
                document.body.appendChild(tooltip); // Lägg i body för att undvika clipping
            }

            // Ikoner
            const iClock = `<svg style="width:14px;height:14px;" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>`;
            const iInfo = `<svg style="width:14px;height:14px;" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>`;

            let html = `
                <div class="tt-row-primary">
                    <span style="color:${props.mainColor}">●</span>
                    <span class="tt-reg">${regNr}</span>
                    <span>${title}</span>
                </div>`;
            
            if (desc) {
                html += `<div class="tt-row-detail">${iInfo} <span>${desc}</span></div>`;
            }
            
            html += `<div class="tt-row-time">${iClock} <span>${timeStr}</span></div>`;

            tooltip.innerHTML = html;
            tooltip.classList.add('show');

            // Positionering (Följer INTE musen, utan ligger fast vid eventet för stabilitet)
            const rect = info.el.getBoundingClientRect();
            let top = rect.bottom + 5;
            let left = rect.left + (rect.width / 2) - 100; // Centrera

            // Håll inom skärmen
            if (left < 10) left = 10;
            if (top + 100 > window.innerHeight) top = rect.top - 100; // Flytta upp om det är trångt nere

            tooltip.style.top = top + 'px';
            tooltip.style.left = left + 'px';
        },
        
        eventMouseLeave: function() {
            const tooltip = document.getElementById('fc-custom-tooltip');
            if (tooltip) {
                tooltip.classList.remove('show');
                tooltip.style.left = '-9999px'; // Flytta bort
            }
        },

        // --- PUNKT 3: DRAG & DROP LOGIK ---
        
        // 1. Flytta befintligt kort
        eventDrop: function(info) {
            const d = info.event.start;
            // Skapa datumsträng: YYYY-MM-DDTHH:MM
            const newDateStr = formatDateForFirebase(d);
            if (onDropCallback) onDropCallback(info.event.id, newDateStr, info.revert);
        },

        // 2. Ta emot NYTT kort från sidomenyn
        eventReceive: function(info) {
            console.log("🔥 eventReceive triggad! Något släpptes i kalendern.");
            console.log("Event ID:", info.event.id);
            console.log("Datum:", info.event.start);

            // Hämta datumet där vi släppte
            const newDate = info.event.start;
            
            // Formatet ska vara YYYY-MM-DDTHH:MM
            const newDateStr = formatDateForFirebase(newDate);
            console.log("Formaterat datum:", newDateStr);
            
            const jobId = info.event.id; 
            
            // Ta bort det temporära eventet visuellt (vi laddar om från Firebase strax)
            info.event.remove();

            // Anropa app.js
            if (onExternalDropCallback) {
                console.log("Anropar app.js callback...");
                onExternalDropCallback(jobId, newDateStr);
            } else {
                console.error("❌ Ingen callback (handleExternalDrop) kopplad!");
            }
        },

        events: events,
        
        eventContent: function(arg) {
            const isMob = window.innerWidth <= 768;
            const props = arg.event.extendedProps;
            
            if (isMob) {
                return { html: `<div class="fc-mobile-dot" style="background-color: ${props.mainColor};"></div>` };
            } 
            else {
                let displayText = arg.event.title;
                if (props.regnr) displayText += ` (${props.regnr})`;

                return { 
                    html: `
                    <div class="modern-event-block" style="
                        border-left-color: ${props.mainColor}; 
                        background-color: ${props.lightColor}; 
                        color: ${props.mainColor === '#3b82f6' ? '#1e3a8a' : (props.mainColor === '#10b981' ? '#064e3b' : (props.mainColor === '#f59e0b' ? '#78350f' : '#4c1d95'))};">
                        
                        <span class="modern-event-time">${props.time}</span>
                        <span class="modern-event-title" title="${displayText}">${displayText}</span>
                    </div>` 
                };
            }
        },

        dateClick: function(info) {
            if (isMobile) {
                document.querySelectorAll('.fc-day-selected').forEach(el => el.classList.remove('fc-day-selected'));
                if (info.dayEl) info.dayEl.classList.add('fc-day-selected');
                renderDayList(info.dateStr, events);
            }
        },

        eventClick: function(info) {
            if (isMobile) {
                const eventDate = info.event.startStr.split('T')[0];
                const dayEl = document.querySelector(`.fc-day[data-date="${eventDate}"]`);
                if (dayEl) {
                    document.querySelectorAll('.fc-day-selected').forEach(el => el.classList.remove('fc-day-selected'));
                    dayEl.classList.add('fc-day-selected');
                }
                renderDayList(eventDate, events);
                info.jsEvent.stopPropagation();
            } else {
                if (onEventClickCallback) onEventClickCallback(info.event.id);
            }
        }
    });

    calendar.render();
    
    // Spara kalendern globalt eller på window för att nå den från toggle-funktionen
    window.currentCalendar = calendar; 

    // Auto-välj idag på mobil... (Din befintliga kod här)
    const isMobileStart = window.innerWidth <= 768;
    if (isMobileStart) {
        const today = new Date();
        const dateStr = today.toISOString().split('T')[0];
        const dayEl = document.querySelector(`.fc-day[data-date="${dateStr}"]`);
        if (dayEl) dayEl.classList.add('fc-day-selected');
        renderDayList(dateStr, events); 
    }

    window.addEventListener('popstate', function(event) {
        const container = document.getElementById('selectedDayView');
        if (container && container.classList.contains('show')) {
            container.classList.remove('show');
            document.querySelectorAll('.fc-day-selected').forEach(el => el.classList.remove('fc-day-selected'));
        }
    });
}

export function setCalendarTheme(theme) {
    if (calendar) calendar.render();
}
