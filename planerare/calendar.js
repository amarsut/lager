// calendar.js

let calendar = null;

function mapJobsToEvents(jobs) {
    return jobs
        .filter(job => !job.deleted && job.status !== 'avbokad')
        .map(job => {
            // 1. Datum & Tid
            let start = job.datum.includes('T') ? job.datum : `${job.datum}T${job.tid || '08:00'}`;
            
            // 2. Färger
            let mainColor = '#3b82f6'; let lightColor = '#eff6ff'; // Bokad (Blå)
            
            if (job.status === 'klar') { mainColor = '#10b981'; lightColor = '#ecfdf5'; } // Grön
            else if (job.status === 'faktureras') { mainColor = '#8b5cf6'; lightColor = '#f5f3ff'; } // Lila
            else if (job.status === 'offererad') { mainColor = '#f59e0b'; lightColor = '#fffbeb'; } // Orange

            // 3. Förbered data för titeln
            let regnr = job.regnr && job.regnr !== 'OKÄNT' ? job.regnr : '';
            
            return {
                id: job.id,
                title: job.kundnamn,
                start: start,
                extendedProps: {
                    time: start.split('T')[1].substring(0, 5).replace(':', '.'), // "10.00"
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

    calendar = new FullCalendar.Calendar(calendarEl, {
        initialView: 'dayGridMonth',
        locale: 'sv',
        firstDay: 1, 
        
        fixedWeekCount: false, // Visa bara nödvändiga rader (4-5 st)
        showNonCurrentDates: false, // Dölj dagar från nästa månad för renare look
        
        height: 'auto',
        contentHeight: 'auto',

        headerToolbar: {
            left: 'today prev,next title', 
            center: '',         
            right: '' 
        },
        
        buttonText: { today: 'Idag' },
        
        events: events,
        
        // --- EVENT DESIGN (PUNKT 6) ---
        eventContent: function(arg) {
            const isMob = window.innerWidth <= 768;
            const props = arg.event.extendedProps;
            
            // Mobil: Prick
            if (isMob) {
                return { html: `<div class="fc-mobile-dot" style="background-color: ${props.mainColor};"></div>` };
            } 
            
            // Dator: "10.00 ABC123 NAMN..."
            else {
                // Bygg texten: Tid + Regnr + Namn
                // Vi lägger allt i en sträng för att ellipsis (..) ska funka på hela raden
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
