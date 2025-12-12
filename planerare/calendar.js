// calendar.js

let calendar = null;

// Hjälpfunktion: Hitta nästa 2 jobb och visa dem
function renderMobileTimeline(events) {
    const container = document.getElementById('mobileUpcomingContainer');
    if (!container) return;

    // 1. Filtrera fram kommande jobb (från idag och framåt)
    const now = new Date();
    now.setHours(0,0,0,0);
    
    let upcoming = events.filter(e => {
        // Enkel koll om datumet är idag eller framåt
        const d = new Date(e.start);
        return d >= now;
    });

    // 2. Sortera på datum
    upcoming.sort((a,b) => new Date(a.start) - new Date(b.start));

    // 3. Ta de 2 första
    const nextTwo = upcoming.slice(0, 2);

    // 4. Skapa HTML
    if (nextTwo.length === 0) {
        container.innerHTML = '<div class="timeline-empty">Inga kommande jobb</div>';
        return;
    }

    let html = '<div class="timeline-header">Nästa jobb</div><div class="timeline-row">';
    
    nextTwo.forEach(job => {
        // Formatera datum snyggt (t.ex. "Idag 10:00" eller "12 dec 14:00")
        const jobDate = new Date(job.start);
        const dateStr = jobDate.toLocaleDateString('sv-SE', { day: 'numeric', month: 'short' });
        const timeStr = job.extendedProps.time;
        
        html += `
        <div class="timeline-card" style="border-left: 4px solid ${job.borderColor};">
            <div class="t-time">${dateStr} • ${timeStr}</div>
            <div class="t-title">${job.title}</div>
            <div class="t-reg">${job.extendedProps.regnr || ''}</div>
        </div>`;
    });
    
    html += '</div>';
    container.innerHTML = html;
}

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

export function initCalendar(elementId, jobsData, onEventClickCallback) {
    const calendarEl = document.getElementById(elementId);
    if (!calendarEl) return;

    if (calendar) calendar.destroy();

    const isMobile = window.innerWidth <= 768;
    const events = mapJobsToEvents(jobsData);

    // KÖR TIDSLINJEN PÅ MOBIL
    if (isMobile) {
        renderMobileTimeline(events);
    }

    calendar = new FullCalendar.Calendar(calendarEl, {
        initialView: 'dayGridMonth',
        locale: 'sv',
        firstDay: 1, 
        
        fixedWeekCount: false, 
        showNonCurrentDates: false, 
        
        // Ta bort höjd-tvingande så vi kan styra med CSS
        height: '100%', 
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
            
            // --- MOBIL: SAMSUNG STYLE (LINJER) ---
            if (isMob) {
                // Vi returnerar en "Bar" istället för en "Dot"
                return { 
                    html: `<div class="fc-mobile-line" style="background-color: ${props.mainColor};"></div>` 
                };
            } 
            
            // DATOR: PREMIUM BLOCK
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

        eventClick: function(info) {
            if (onEventClickCallback) onEventClickCallback(info.event.id);
        }
    });

    calendar.render();
}

export function setCalendarTheme(theme) {
    if (calendar) calendar.render();
}
