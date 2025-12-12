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

// FIXAD FUNKTION: Renderar listan
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

export function initCalendar(elementId, jobsData, onEventClickCallback) {
    const wrapperEl = document.getElementById('calendar-wrapper'); // OBS: Wrapper
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

        titleFormat: isMobile 
            ? { year: 'numeric', month: 'short' } 
            : { year: 'numeric', month: 'long' },

        headerToolbar: {
            left: 'today prev,next title', 
            center: '',         
            right: '' 
        },
        
        buttonText: { today: 'Idag' },

        // --- NY LOGIK FÖR HOVER (DESKTOP) ---
        eventMouseEnter: function(info) {
            if (window.innerWidth <= 768) return; // Endast desktop
        
            const props = info.event.extendedProps;
            
            // Hämta tid
            const dateObj = info.event.start;
            // Format: 10.00
            const timeStr = dateObj ? dateObj.toLocaleTimeString('sv-SE', { hour: '2-digit', minute: '2-digit' }).replace(':', '.') : '';
        
            // Skapa tooltip om den inte finns
            let tooltip = document.getElementById('fc-custom-tooltip');
            if (!tooltip) {
                tooltip = document.createElement('div');
                tooltip.id = 'fc-custom-tooltip';
                tooltip.className = 'calendar-tooltip';
                document.body.appendChild(tooltip);
            }
        
            // Data
            const regNr = props.regnr || '---';
            const customerName = info.event.title;
            // Om ingen kommentar finns, visa bindestreck eller tom sträng (välj själv)
            const commentText = props.description || '-'; 
        
            // Ikoner (SVG)
            const iconComment = `<svg class="tt-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg>`;
            const iconClock = `<svg class="tt-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>`;
        
            // Bygg HTML enligt din önskan:
            // 1. ABC123 • NAMN
            // 2. (ikon) Kommentar
            // 3. (ikon) 10.00
            tooltip.innerHTML = `
                <div class="tt-row-primary">
                    <span class="tt-reg">${regNr}</span>
                    <span class="tt-sep">•</span>
                    <span class="tt-name">${customerName}</span>
                </div>
                <div class="tt-row-detail">
                    ${iconComment}
                    <span>${commentText}</span>
                </div>
                <div class="tt-row-time">
                    ${iconClock}
                    <span>${timeStr}</span>
                </div>
            `;
        
            tooltip.classList.add('show');
        
            // Positionering (Samma som förut men med lite justering)
            const x = info.jsEvent.clientX;
            const y = info.jsEvent.clientY;
            
            // Placera tooltip en bit ifrån musen så den inte blinkar
            tooltip.style.left = (x + 15) + 'px';
            tooltip.style.top = (y + 10) + 'px';
        },
        
        eventMouseLeave: function(info) {
            if (window.innerWidth <= 768) return;
            
            const tooltip = document.getElementById('fc-custom-tooltip');
            if (tooltip) {
                tooltip.classList.remove('show');
                tooltip.style.left = '-9999px'; // Flytta bort helt
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
                let textString = `${props.time} `;
                if (props.regnr) textString += `${props.regnr} `;
                textString += arg.event.title;

                return { 
                    html: `
                    <div class="fc-premium-event" style="
                        border-left: 3px solid ${props.mainColor}; 
                        background-color: ${props.lightColor}; 
                        color: ${props.mainColor};">
                        <span class="fc-event-text">${textString}</span>
                    </div>` 
                };
            }
        },

        // --- KLICK LOGIK (MOBIL) ---
        dateClick: function(info) {
            if (isMobile) {
                document.querySelectorAll('.fc-day-selected').forEach(el => el.classList.remove('fc-day-selected'));
                if (info.dayEl) info.dayEl.classList.add('fc-day-selected');
                renderDayList(info.dateStr, events);
            }
        },

        eventClick: function(info) {
            if (isMobile) {
                // NY LOGIK: Förhindra att redigeringsmodalen öppnas på mobil.
                // Vi vill istället öppna daglistan även om man klickar på ett event.
                // Hämta datumet från eventet
                const eventDate = info.event.startStr.split('T')[0];
                const dayEl = document.querySelector(`.fc-day[data-date="${eventDate}"]`);

                document.querySelectorAll('.fc-day-selected').forEach(el => el.classList.remove('fc-day-selected'));
                if (dayEl) dayEl.classList.add('fc-day-selected');
                
                renderDayList(eventDate, events);

                // Stoppa eventbubbling för att säkerställa att inget annat händer
                info.jsEvent.stopPropagation();
            } else {
                // BEFINTLIG LOGIK FÖR DESKTOP: Öppna redigeringsmodal
                if (onEventClickCallback) onEventClickCallback(info.event.id);
            }
        }
    });

    calendar.render();

    // --- NY KOD: Auto-välj idag på mobil ---
    const isMobileStart = window.innerWidth <= 768;
    if (isMobileStart) {
        const today = new Date();
        const dateStr = today.toISOString().split('T')[0]; // Enklare format YYYY-MM-DD
    
        const dayEl = document.querySelector(`.fc-day[data-date="${dateStr}"]`);
        if (dayEl) dayEl.classList.add('fc-day-selected');
        
        renderDayList(dateStr, events); 
    }

    // PUNKT 4: Lägg till lyssnare för bakåtknappen
    window.addEventListener('popstate', function(event) {
        const container = document.getElementById('selectedDayView');
        // Om vi backar och listan är öppen -> stäng den
        if (container && container.classList.contains('show')) {
            container.classList.remove('show');
            document.querySelectorAll('.fc-day-selected').forEach(el => el.classList.remove('fc-day-selected'));
        }
    });
}

export function setCalendarTheme(theme) {
    if (calendar) calendar.render();
}
