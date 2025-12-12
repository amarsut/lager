// calendar.js

let calendar = null;

function mapJobsToEvents(jobs) {
    return jobs
        .filter(job => !job.deleted && job.status !== 'avbokad')
        .map(job => {
            let start = job.datum.includes('T') ? job.datum : `${job.datum}T${job.tid || '08:00'}`;
            
            let mainColor = '#3b82f6'; let lightColor = '#eff6ff'; // Blå
            if (job.status === 'klar') { mainColor = '#10b981'; lightColor = '#ecfdf5'; } 
            else if (job.status === 'faktureras') { mainColor = '#8b5cf6'; lightColor = '#f5f3ff'; } 
            else if (job.status === 'offererad') { mainColor = '#f59e0b'; lightColor = '#fffbeb'; } 

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
                    lightColor: lightColor
                },
                backgroundColor: mainColor, 
                borderColor: mainColor
            };
        });
}

// NY FUNKTION: Rita ut listan under kalendern
function renderDayList(dateStr, events) {
    const container = document.getElementById('selectedDayView');
    if (!container) return;

    // Hitta jobb för detta datum
    const dayEvents = events.filter(e => e.start.startsWith(dateStr));
    
    // Sortera på tid
    dayEvents.sort((a,b) => a.start.localeCompare(b.start));

    container.style.display = 'block';
    
    if (dayEvents.length === 0) {
        container.innerHTML = `<div class="day-list-empty">Inga jobb ${dateStr}</div>`;
        return;
    }

    let html = `<div class="day-list-header">Jobb ${dateStr}</div>`;
    
    dayEvents.forEach(evt => {
        const props = evt.extendedProps;
        // Samma snygga design som "Premium Event" fast i lista
        html += `
        <div class="day-list-item" onclick="if(window.openEditModal) window.openEditModal('${evt.id}')" style="border-left: 4px solid ${props.mainColor};">
            <div class="day-list-time">${props.time}</div>
            <div class="day-list-info">
                <span class="day-list-title">${evt.title}</span>
                ${props.regnr ? `<span class="day-list-reg">${props.regnr}</span>` : ''}
            </div>
        </div>`;
    });

    container.innerHTML = html;
}

export function initCalendar(elementId, jobsData, onEventClickCallback) {
    // OBS: Vi monterar kalendern i 'calendar-wrapper' nu, inte direkt i 'calendarView'
    // Se till att HTML är uppdaterad enligt Steg 1.
    const calendarEl = document.getElementById('calendar-wrapper'); 
    if (!calendarEl) return;

    if (calendar) calendar.destroy();

    const isMobile = window.innerWidth <= 768;
    const events = mapJobsToEvents(jobsData);

    calendar = new FullCalendar.Calendar(calendarEl, {
        initialView: 'dayGridMonth',
        locale: 'sv',
        firstDay: 1, 
        fixedWeekCount: false, 
        showNonCurrentDates: false, 
        height: 'auto',
        contentHeight: 'auto',

        headerToolbar: {
            left: 'today prev,next title', 
            center: '',         
            right: '' 
        },
        buttonText: { today: 'Idag' },
        events: events,
        
        eventContent: function(arg) {
            const isMob = window.innerWidth <= 768;
            const props = arg.event.extendedProps;
            
            if (isMob) {
                return { html: `<div class="fc-mobile-dot" style="background-color: ${props.mainColor};"></div>` };
            } else {
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

        // --- HÄR ÄR NYHETEN: KLICK PÅ DATUM ---
        dateClick: function(info) {
            if (isMobile) {
                // 1. Ta bort gammal markering
                const old = document.querySelector('.fc-day-selected');
                if (old) old.classList.remove('fc-day-selected');
                
                // 2. Lägg till ny markering (Cirkel runt datumet)
                info.dayEl.classList.add('fc-day-selected');
                
                // 3. Visa listan
                renderDayList(info.dateStr, events);
            }
        },

        eventClick: function(info) {
            // Om man klickar direkt på en prick/event
            if (onEventClickCallback) onEventClickCallback(info.event.id);
        }
    });

    calendar.render();
}

export function setCalendarTheme(theme) {
    if (calendar) calendar.render();
}
