// calendar.js - FullCalendar Version

let calendar = null;

function mapJobsToEvents(jobs) {
    return jobs
        .filter(job => !job.deleted && job.status !== 'avbokad')
        .map(job => {
            // Datumhantering
            let start = job.datum;
            if (!start.includes('T')) {
                // Om tid saknas, sätt 08:00
                start = `${job.datum}T${job.tid || '08:00'}`;
            } else {
                // Fixa till standard ISO-format
                start = start.replace(' ', 'T');
            }
            
            // Färgkodning (Premium Pastel Look)
            // Vi sätter "borderColor" till den starka färgen (vänsterkanten)
            // och "backgroundColor" till den ljusa pastellen.
            let borderColor = '#3b82f6'; // Standard Blå
            let bgColor = '#eff6ff';     // Ljusblå
            let textColor = '#1e3a8a';   // Mörkblå text
            
            if (job.status === 'klar') { 
                borderColor = '#10b981'; bgColor = '#ecfdf5'; textColor = '#064e3b'; 
            }
            if (job.status === 'faktureras') { 
                borderColor = '#8b5cf6'; bgColor = '#f5f3ff'; textColor = '#4c1d95'; 
            }
            if (job.status === 'offererad') { 
                borderColor = '#f59e0b'; bgColor = '#fffbeb'; textColor = '#78350f'; 
            }

            return {
                id: job.id,
                title: job.kundnamn, // Titel
                start: start,
                extendedProps: {
                    time: start.split('T')[1].substring(0, 5), // Spara tiden separat för visning
                    status: job.status
                },
                backgroundColor: bgColor,
                borderColor: borderColor,
                textColor: textColor
            };
        });
}

export function initCalendar(elementId, jobsData, onEventClickCallback) {
    const calendarEl = document.getElementById(elementId);
    if (!calendarEl) return;

    // Rensa om den redan finns
    if (calendar) {
        calendar.destroy();
        calendar = null;
    }

    // Kolla om vi är på mobil
    const isMobile = window.innerWidth <= 768;
    const events = mapJobsToEvents(jobsData);

    calendar = new FullCalendar.Calendar(calendarEl, {
        initialView: 'dayGridMonth', // Alltid månadsvy som standard
        locale: 'sv',                // Svenska
        firstDay: 1,                 // Måndag
        headerToolbar: {
            left: 'prev,next today', // Knappar till vänster
            center: 'title',         // Titel i mitten
            right: ''                // Inget till höger (renare)
        },
        buttonText: {
            today: 'Idag',
            month: 'Månad',
            week: 'Vecka',
            day: 'Dag'
        },
        height: 'auto',              // Låt den ta plats
        contentHeight: isMobile ? 'auto' : 800, // Högre på dator
        events: events,
        
        // --- ANPASSAT UTSEENDE PÅ EVENTEN ---
        eventContent: function(arg) {
            const isMob = window.innerWidth <= 768;
            const color = arg.event.borderColor; // Den starka färgen
            
            // 1. MOBIL: Visa bara en prick (DOT)
            if (isMob) {
                return { 
                    html: `<div class="fc-mobile-dot" style="background-color: ${color};"></div>` 
                };
            } 
            
            // 2. DATOR: Visa Tid + Kund (PREMIUM BLOCK)
            else {
                const time = arg.event.extendedProps.time;
                const title = arg.event.title;
                // Vi bygger HTML manuellt för att få den färgade kanten
                return { 
                    html: `<div class="fc-custom-event-content">
                             <span class="fc-event-time">${time}</span>
                             <span class="fc-event-title">${title}</span>
                           </div>` 
                };
            }
        },

        // Klickhantering
        eventClick: function(info) {
            if (onEventClickCallback) onEventClickCallback(info.event.id);
        }
    });

    calendar.render();
}

export function setCalendarTheme(theme) {
    if (calendar) calendar.render();
}
