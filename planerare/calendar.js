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
        height: '100%',
        contentHeight: 'auto',
        
        // Drag & Drop
        editable: true,       
        droppable: true,      
        eventStartEditable: true, 
        eventDurationEditable: false,
        
        // --- HÄR ÄR NYCKELN FÖR KNAPPEN ---
        customButtons: {
            toggleSidebarBtn: {
                text: 'Visa Obokade', // Texten på knappen
                click: function() {
                    toggleCalendarSidebar(); // Funktionen som körs
                }
            }
        },

        // --- HÄR PLACERAR VI KNAPPEN ---
        headerToolbar: {
            // Vänster: Pilar + Titel + Idag (allt i en klump)
            left: 'prev,next title', 
            // Mitten: Tomt
            center: '',         
            // Höger: Vår specialknapp + Idag
            right: 'toggleSidebarBtn today' 
        },
        
        buttonText: { today: 'Idag' },

        events: events,

        // ... (Klistra in dina callbacks: eventDrop, eventReceive, etc.) ...
        // Jag inkluderar dem kortfattat här för helheten:
        
        eventDrop: function(info) {
            const d = info.event.start;
            const newDateStr = formatDateForFirebase(d);
            if (onDropCallback) onDropCallback(info.event.id, newDateStr, info.revert);
        },

        eventReceive: function(info) {
            const newDate = info.event.start;
            const jobId = info.event.id; 
            info.event.remove();
            const newDateStr = formatDateForFirebase(newDate);
            if (onExternalDropCallback) {
                onExternalDropCallback(jobId, newDateStr);
            }
        },

        // --- UTSEENDE ---
        eventContent: function(arg) {
            const isMob = window.innerWidth <= 768;
            const props = arg.event.extendedProps;
            
            if (isMob) {
                return { html: `<div class="fc-mobile-dot" style="background-color: ${props.mainColor};"></div>` };
            } 
            else {
                // Den tjocka vänsterlinjen styrs nu via CSS på .modern-event-block
                // Vi sätter border-color inline här
                return { 
                    html: `
                    <div class="modern-event-block" style="
                        border-left-color: ${props.mainColor}; 
                        background-color: ${props.lightColor}; 
                        color: ${props.mainColor === '#3b82f6' ? '#1e3a8a' : (props.mainColor === '#10b981' ? '#064e3b' : (props.mainColor === '#f59e0b' ? '#78350f' : '#4c1d95'))};">
                        
                        <span class="modern-event-time">${props.time}</span>
                        <span class="modern-event-title">
                            ${arg.event.title} 
                            ${props.regnr ? `<span style="opacity:0.7; font-size:0.9em; margin-left:4px;">(${props.regnr})</span>` : ''}
                        </span>
                    </div>` 
                };
            }
        },

        // Dina klick-handlers
        dateClick: function(info) {
            if (isMobile) {
                document.querySelectorAll('.fc-day-selected').forEach(el => el.classList.remove('fc-day-selected'));
                if (info.dayEl) info.dayEl.classList.add('fc-day-selected');
                renderDayList(info.dateStr, events);
            }
        },

        eventClick: function(info) {
            if (isMobile) {
                // ... mobilkod ...
            } else {
                if (onEventClickCallback) onEventClickCallback(info.event.id);
            }
        },
        
        // Behåll din hover-logik här
        eventMouseEnter: function(info) { /* ... din kod ... */ },
        eventMouseLeave: function(info) { /* ... din kod ... */ }
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
