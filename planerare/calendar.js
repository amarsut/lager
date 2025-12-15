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
        height: '100%', // Fyller hela höjden i vår nya split-view
        contentHeight: 'auto',
        
        // --- DRAG & DROP INSTÄLLNINGAR ---
        editable: true,       // Tillåter att man drar events inuti kalendern
        droppable: true,      // Tillåt drop från utsidan (Sidopanelen)
        eventStartEditable: true, 
        eventDurationEditable: false, // Vi låser längden (tills vidare)
        
        titleFormat: isMobile 
            ? { year: 'numeric', month: 'short' } 
            : { year: 'numeric', month: 'long' },

        headerToolbar: {
            left: 'prev,next today', 
            center: 'title',         
            right: '' 
        },
        buttonText: { today: 'Idag' },

        // --- HOVER LOGIK (Din nya snygga kod) ---
        eventMouseEnter: function(info) {
            if (window.innerWidth <= 768) return; 
            const props = info.event.extendedProps;
            const dateObj = info.event.start;
            const timeStr = dateObj ? dateObj.toLocaleTimeString('sv-SE', { hour: '2-digit', minute: '2-digit' }).replace(':', '.') : '';
            const regNr = props.regnr || '---';
            const customerName = info.event.title;
            const commentText = props.description || '';

            let tooltip = document.getElementById('fc-custom-tooltip');
            if (!tooltip) {
                tooltip = document.createElement('div');
                tooltip.id = 'fc-custom-tooltip';
                tooltip.className = 'calendar-tooltip';
                document.body.appendChild(tooltip);
            }

            const iconStatus = `<svg class="tt-status-icon" style="color: ${props.mainColor};" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" /></svg>`;
            const iconComment = `<svg class="tt-icon tt-icon-gray" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg>`;
            const iconClock = `<svg class="tt-icon tt-icon-gray" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>`;

            let htmlContent = `
                <div class="tt-row-primary">
                    ${iconStatus}
                    <span class="tt-reg">${regNr}</span>
                    <span class="tt-sep">•</span>
                    <span class="tt-name">${customerName}</span>
                </div>`;

            if (commentText.trim().length > 0) {
                htmlContent += `
                <div class="tt-row-detail">
                    ${iconComment}
                    <span>${commentText}</span>
                </div>`;
            }

            htmlContent += `
                <div class="tt-row-time">
                    ${iconClock}
                    <span>${timeStr}</span>
                </div>`;

            tooltip.innerHTML = htmlContent;
            tooltip.classList.add('show');
            
            const tooltipRect = tooltip.getBoundingClientRect();
            const x = info.jsEvent.clientX;
            const y = info.jsEvent.clientY;
            let top = y + 15;
            let left = x + 15;

            if (top + tooltipRect.height > window.innerHeight) top = y - tooltipRect.height - 10;
            if (left + tooltipRect.width > window.innerWidth) left = x - tooltipRect.width - 10;

            tooltip.style.top = top + 'px';
            tooltip.style.left = left + 'px';
        },
        
        eventMouseLeave: function(info) {
            const tooltip = document.getElementById('fc-custom-tooltip');
            if (tooltip) {
                tooltip.classList.remove('show');
                tooltip.style.left = '-9999px'; 
            }
        },
        
        // --- CALLBACKS ---
        
        // 1. När man flyttar ett jobb SOM REDAN FINNS i kalendern
        eventDrop: function(info) {
            const d = info.event.start;
            const newDateStr = formatDateForFirebase(d);
            if (onDropCallback) onDropCallback(info.event.id, newDateStr, info.revert);
        },

        // 2. När man drar in ett NYTT jobb från SIDOPANELEN
        eventReceive: function(info) {
            // Hämta info från det dragna elementet
            const newDate = info.event.start;
            const jobId = info.event.id; // Vi sätter ID på elementet i app.js
            
            // Ta bort eventet visuellt direkt (vi laddar om datan från Firebase strax ändå)
            info.event.remove();

            const newDateStr = formatDateForFirebase(newDate);
            
            // Anropa app.js för att spara
            if (onExternalDropCallback) {
                onExternalDropCallback(jobId, newDateStr);
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
                // Den snygga "Block-designen"
                return { 
                    html: `
                    <div class="modern-event-block" style="
                        border-left-color: ${props.mainColor}; 
                        background-color: ${props.lightColor}; 
                        color: ${props.mainColor === '#3b82f6' ? '#1e3a8a' : (props.mainColor === '#10b981' ? '#064e3b' : (props.mainColor === '#f59e0b' ? '#78350f' : '#4c1d95'))};">
                        <span class="modern-event-time">${props.time}</span>
                        <span class="modern-event-title">${arg.event.title}</span>
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
                document.querySelectorAll('.fc-day-selected').forEach(el => el.classList.remove('fc-day-selected'));
                if (dayEl) dayEl.classList.add('fc-day-selected');
                renderDayList(eventDate, events);
                info.jsEvent.stopPropagation();
            } else {
                if (onEventClickCallback) onEventClickCallback(info.event.id);
            }
        }
    });

    calendar.render();

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
