// calendar.js

let calendar = null;

function mapJobsToEvents(jobs) {
    return jobs
        .filter(job => !job.deleted && job.status !== 'avbokad')
        .map(job => {
            // Datum & Tid
            let start = job.datum.includes('T') ? job.datum : `${job.datum}T${job.tid || '08:00'}`;
            
            // Färgpalett (Pastell)
            let mainColor = '#3b82f6'; let lightColor = '#eff6ff';
            if (job.status === 'klar') { mainColor = '#10b981'; lightColor = '#ecfdf5'; }
            else if (job.status === 'faktureras') { mainColor = '#8b5cf6'; lightColor = '#f5f3ff'; }
            else if (job.status === 'offererad') { mainColor = '#f59e0b'; lightColor = '#fffbeb'; }

            return {
                id: job.id,
                title: job.kundnamn,
                start: start,
                extendedProps: {
                    // Punkt 1: Formatet "10.00"
                    time: start.split('T')[1].substring(0, 5).replace(':', '.'), 
                    regnr: job.regnr && job.regnr !== 'OKÄNT' ? job.regnr : '', 
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
        
        fixedWeekCount: false, // Visa bara 5 veckor om det räcker
        showNonCurrentDates: true, // PUNKT 4: Visa dagar från nästa månad (1, 2, 3 jan)
        
        // Höjdhantering (Punkt 3: Inget tomrum)
        height: 'auto',
        contentHeight: 'auto',

        // PUNKT 5: Pilar mellan Idag och Titel
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
                // PUNKT 1: Design som liknar bild 1 (Namn i fetstil, tid innan)
                let textContent = `<span style="font-weight:400; opacity:0.8;">${props.time}</span> `;
                // if (props.regnr) textContent += `<span style="font-weight:600">${props.regnr}</span> `; // Avkommentera om du vill ha regnr
                textContent += `<span style="font-weight:700">${arg.event.title}</span>`;

                return { 
                    html: `
                    <div class="fc-premium-event" style="
                        border-left: 3px solid ${props.mainColor}; 
                        background-color: ${props.lightColor}; 
                        color: ${props.mainColor};">
                        <span class="fc-event-text">${textContent}</span>
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
