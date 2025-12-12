// calendar.js - FullCalendar Premium Look

let calendar = null;

function mapJobsToEvents(jobs) {
    return jobs
        .filter(job => !job.deleted && job.status !== 'avbokad')
        .map(job => {
            // Datumhantering: Om tid saknas, sätt 08:00
            let start = job.datum.includes('T') ? job.datum : `${job.datum}T${job.tid || '08:00'}`;
            
            // --- FÄRGPALETT (Premium Pastell) ---
            // Vi definierar en stark färg (border/text) och en ljus färg (bakgrund)
            
            let mainColor = '#3b82f6'; // Standard Blå (Bokad)
            let lightColor = '#eff6ff';
            
            if (job.status === 'klar') { 
                mainColor = '#10b981'; lightColor = '#ecfdf5'; // Grön
            }
            else if (job.status === 'faktureras') { 
                mainColor = '#8b5cf6'; lightColor = '#f5f3ff'; // Lila
            }
            else if (job.status === 'offererad') { 
                mainColor = '#f59e0b'; lightColor = '#fffbeb'; // Orange
            }

            return {
                id: job.id,
                title: job.kundnamn,
                start: start,
                // Vi sparar färgerna och tiden i "extendedProps" för att använda i HTML-mallen senare
                extendedProps: {
                    time: start.split('T')[1].substring(0, 5),
                    status: job.status,
                    mainColor: mainColor,
                    lightColor: lightColor
                },
                // Dessa används av FullCalendar för mobil-prickarna
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
        
        // KOMPAKT INSTÄLLNING: Visa bara 5 veckor om det räcker (slipper tomma rader)
        fixedWeekCount: false,
        
        // Ta bort höjd-tvingande så den blir kompakt
        height: 'auto',
        contentHeight: 'auto',

        // Header: Knappar till vänster, Titel bredvid
        headerToolbar: {
            left: 'prev,next today', 
            center: 'title',         
            right: '' // Tom högersida för renare look
        },
        
        buttonText: { today: 'Idag' },
        
        events: events,
        
        // --- DESIGNA EVENTEN HÄR ---
        eventContent: function(arg) {
            const isMob = window.innerWidth <= 768;
            const props = arg.event.extendedProps;
            
            // MOBIL: Visa bara en liten prick
            if (isMob) {
                return { 
                    html: `<div class="fc-mobile-dot" style="background-color: ${props.mainColor};"></div>` 
                };
            } 
            // DATOR: Visa "Premium Block" (Tid + Namn med färg)
            else {
                // Vi bygger en custom HTML-sträng med färgerna vi valde
                return { 
                    html: `
                    <div class="fc-premium-event" style="
                        border-left: 4px solid ${props.mainColor}; 
                        background-color: ${props.lightColor}; 
                        color: ${props.mainColor};">
                        <span class="fc-event-time">${props.time}</span>
                        <span class="fc-event-title">${arg.event.title}</span>
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
