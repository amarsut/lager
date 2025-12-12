// calendar.js

let calendar = null;

function mapJobsToEvents(jobs) {
    return jobs
        .filter(job => !job.deleted && job.status !== 'avbokad')
        .map(job => {
            // Datumhantering
            let start = job.datum;
            if (!start.includes('T')) {
                start = `${job.datum}T${job.tid || '08:00'}`;
            }
            
            // Färgkodning baserat på status (matchar din gamla stil)
            let color = '#3b82f6'; // Bokad (Blå)
            let borderColor = '#3b82f6';
            
            if (job.status === 'klar') { color = '#10b981'; borderColor = '#059669'; } // Grön
            if (job.status === 'faktureras') { color = '#8b5cf6'; borderColor = '#7c3aed'; } // Lila
            if (job.status === 'offererad') { color = '#f59e0b'; borderColor = '#d97706'; } // Orange

            return {
                id: job.id,
                title: job.kundnamn,
                start: start,
                // FullCalendar räknar ut sluttid själv om den saknas, men vi kan sätta +1h
                extendedProps: {
                    status: job.status,
                    paket: job.paket,
                    regnr: job.regnr
                },
                backgroundColor: color,
                borderColor: borderColor
            };
        });
}

export function initCalendar(elementId, jobsData, onEventClickCallback) {
    const calendarEl = document.getElementById(elementId);
    if (!calendarEl) return;

    // Rensa ev. gammal instans
    if (calendar) {
        calendar.destroy();
    }

    const isMobile = window.innerWidth <= 768;
    const events = mapJobsToEvents(jobsData);

    calendar = new FullCalendar.Calendar(calendarEl, {
        initialView: 'dayGridMonth', // Alltid månadsvy som start
        locale: 'sv', // Svenska
        firstDay: 1, // Måndag
        headerToolbar: {
            left: 'prev,next today', // Knappar till vänster
            center: 'title',         // Titel i mitten
            right: isMobile ? '' : 'dayGridMonth,timeGridWeek,timeGridDay' // Vyer till höger (dölj på mobil för att spara plats)
        },
        buttonText: {
            today: 'Idag',
            month: 'Månad',
            week: 'Vecka',
            day: 'Dag'
        },
        height: 'auto', // Anpassar höjden automatiskt
        contentHeight: 800,
        events: events,
        
        // --- MAGIN FÖR MOBILVYN ---
        // Här bestämmer vi hur eventet ska se ut beroende på skärm
        eventContent: function(arg) {
            const isMob = window.innerWidth <= 768;
            
            // MOBIL: Visa bara en liten färgad prick
            if (isMob) {
                return { 
                    html: `<div class="fc-mobile-dot" style="background-color: ${arg.event.backgroundColor};"></div>` 
                };
            } 
            // DATOR: Visa Tid + Titel
            else {
                const time = arg.event.start.toLocaleTimeString('sv-SE', {hour:'2-digit', minute:'2-digit'});
                return { 
                    html: `<div class="fc-desktop-event"><b>${time}</b> ${arg.event.title}</div>` 
                };
            }
        },

        // Klick på event
        eventClick: function(info) {
            if (onEventClickCallback) onEventClickCallback(info.event.id);
        },
        
        // Klick på dag (för att skapa nytt jobb om du vill, valfritt)
        dateClick: function(info) {
            // Här kan du anropa openNewJobModal() och skicka med info.dateStr
        }
    });

    calendar.render();
}

export function setCalendarTheme(theme) {
    // FullCalendar hanterar oftast detta via CSS-variabler, 
    // men vi kan tvinga en omladdning om det behövs.
    if (calendar) calendar.render();
}
