// calendar.js

let calendar = null;

function mapJobsToEvents(jobs) {
    return jobs
        .filter(job => !job.deleted && job.status !== 'avbokad')
        .map(job => {
            // 1. Datum & Tid
            let start = job.datum.includes('T') ? job.datum : `${job.datum}T${job.tid || '08:00'}`;
            
            // 2. Färger (Pastell)
            let mainColor = '#3b82f6'; let lightColor = '#eff6ff';
            if (job.status === 'klar') { mainColor = '#10b981'; lightColor = '#ecfdf5'; }
            else if (job.status === 'faktureras') { mainColor = '#8b5cf6'; lightColor = '#f5f3ff'; }
            else if (job.status === 'offererad') { mainColor = '#f59e0b'; lightColor = '#fffbeb'; }

            // 3. Titel-data (Vi bygger strängen i eventContent senare)
            // Vi sparar regnr och namn separat
            return {
                id: job.id,
                title: job.kundnamn,
                start: start,
                extendedProps: {
                    time: start.split('T')[1].substring(0, 5).replace(':', '.'), // "10.00" istället för "10:00"
                    regnr: job.regnr && job.regnr !== 'OKÄNT' ? job.regnr : '', // Tomt om inget regnr
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
        firstDay: 1, // Måndag
        
        // PUNKT 4: Visa inte 6 veckor om det inte behövs (oftast 4-5)
        fixedWeekCount: false,
        showNonCurrentDates: false, // Dölj dagar från förra/nästa månad för renare look
        
        // Höjdhantering
        height: 'auto',
        contentHeight: 'auto',

        // PUNKT 3: "Idag" -> "Titel" -> "Pilar"
        headerToolbar: {
            left: 'today title prev,next', 
            center: '',         
            right: '' 
        },
        
        buttonText: { today: 'Idag' },
        
        events: events,
        
        // --- EVENT DESIGN (PUNKT 6 & 7) ---
        eventContent: function(arg) {
            const isMob = window.innerWidth <= 768;
            const props = arg.event.extendedProps;
            
            // Mobil: Prick
            if (isMob) {
                return { html: `<div class="fc-mobile-dot" style="background-color: ${props.mainColor};"></div>` };
            } 
            
            // Dator: "10.00 ABC123 Johan"
            else {
                // Bygg strängen: Tid + Regnr (om finns) + Namn
                let textContent = `<span style="font-weight:500">${props.time}</span> `;
                if (props.regnr) textContent += `<span style="font-weight:500">${props.regnr}</span> `;
                textContent += arg.event.title;

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
