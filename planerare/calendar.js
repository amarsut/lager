// calendar.js

let calendar = null;

function mapJobsToEvents(jobs) {
    return jobs
        .filter(job => !job.deleted && job.status !== 'avbokad')
        .map(job => {
            let start = job.datum;
            if (!start.includes('T')) {
                start = `${job.datum}T${job.tid || '08:00'}`;
            } else {
                start = start.replace(' ', 'T');
            }
            
            // Färgkodning (HELA rutan färgad, inte bara kant)
            // Vi använder en ljusare bakgrund och en mörkare kant/text för snygg kontrast
            let bgColor = '#eff6ff';     // Ljusblå
            let borderColor = '#3b82f6'; // Stark blå
            let textColor = '#1e3a8a';   // Mörkblå text
            
            if (job.status === 'klar') { 
                bgColor = '#ecfdf5'; borderColor = '#10b981'; textColor = '#064e3b'; 
            }
            if (job.status === 'faktureras') { 
                bgColor = '#f5f3ff'; borderColor = '#8b5cf6'; textColor = '#4c1d95'; 
            }
            if (job.status === 'offererad') { 
                bgColor = '#fffbeb'; borderColor = '#f59e0b'; textColor = '#78350f'; 
            }

            return {
                id: job.id,
                title: job.kundnamn,
                start: start,
                extendedProps: {
                    time: start.split('T')[1].substring(0, 5),
                    status: job.status
                },
                backgroundColor: bgColor,
                borderColor: borderColor,
                textColor: textColor,
                classNames: ['fc-event-custom'] // Lägg till klass för extra styling
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
        
        // KOMPAKTARE VY: Visa bara nödvändiga veckor (oftast 5 istället för 6)
        fixedWeekCount: false, 
        
        // Header (Titel i mitten, knappar på sidorna)
        headerToolbar: {
            left: 'prev,next today', 
            center: 'title',         
            right: ''                
        },
        buttonText: { today: 'Idag' },
        
        // Höjdhantering
        height: 'auto', // Anpassa höjden efter innehållet
        contentHeight: 'auto', // Ingen scrollbar
        
        events: events,
        
        eventContent: function(arg) {
            const isMob = window.innerWidth <= 768;
            const color = arg.event.borderColor; 
            
            if (isMob) {
                return { html: `<div class="fc-mobile-dot" style="background-color: ${color};"></div>` };
            } else {
                const time = arg.event.extendedProps.time;
                const title = arg.event.title;
                // Skapa en färgad "pille" på datorn
                return { 
                    html: `<div class="fc-desktop-pill">
                             <span class="fc-pill-time">${time}</span>
                             <span class="fc-pill-title">${title}</span>
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
