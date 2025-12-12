// calendar.js
import { createCalendar, viewDay, viewWeek, viewMonthGrid } from 'https://esm.sh/@schedule-x/calendar';
import '@schedule-x/theme-default/dist/index.css';

let calendarApp = null;

// Hjälpfunktion: Gör om dina Firebase-jobb till Kalender-events
function mapJobsToEvents(jobs) {
    return jobs
        .filter(job => !job.deleted && job.status !== 'avbokad') // Dölj raderade/avbokade
        .map(job => {
            // Datumhantering: Slå ihop datum och tid till "YYYY-MM-DD HH:MM"
            const startDate = job.datum.includes('T') ? job.datum.replace('T', ' ') : `${job.datum} ${job.tid}`;
            
            // Beräkna sluttid (Vi lägger på 1 timme som standard)
            let endDate = startDate;
            try {
                const d = new Date(job.datum.includes('T') ? job.datum : `${job.datum}T${job.tid}`);
                d.setHours(d.getHours() + 1);
                
                // Formatera datumet manuellt för att slippa tidszonskrångel
                const year = d.getFullYear();
                const month = String(d.getMonth() + 1).padStart(2, '0');
                const day = String(d.getDate()).padStart(2, '0');
                const hour = String(d.getHours()).padStart(2, '0');
                const min = String(d.getMinutes()).padStart(2, '0');
                endDate = `${year}-${month}-${day} ${hour}:${min}`;
            } catch(e) { console.error("Datumfel i kalender:", e); }

            return {
                id: job.id,
                title: `${job.regnr} - ${job.kundnamn}`,
                start: startDate,
                end: endDate,
                description: job.paket || '',
                calendarId: job.status // Används för att färga eventet
            };
        });
}

// Huvudfunktion: Initiera och rita ut kalendern
export function initCalendar(elementId, jobsData, onEventClickCallback) {
    const calendarEl = document.getElementById(elementId);
    if (!calendarEl) {
        console.error(`Kunde inte hitta elementet #${elementId}`);
        return;
    }

    // Rensa tidigare kalender för att undvika dubletter
    calendarEl.innerHTML = '';

    const events = mapJobsToEvents(jobsData);
    
    // Kolla om mörkt läge är aktivt i din app
    const isDarkMode = document.documentElement.getAttribute('data-theme') === 'dark';

    calendarApp = createCalendar({
        views: [viewMonthGrid, viewWeek, viewDay],
        defaultView: viewWeek.name,
        events: events,
        locale: 'sv-SE',       // Svenska
        firstDayOfWeek: 1,     // Måndag
        isDark: isDarkMode,
        
        // Färgteman kopplade till din status
        calendars: {
            bokad: { colorName: 'bokad', lightColors: { main: '#3b82f6', container: '#dbeafe', onContainer: '#1e3a8a' } },
            klar: { colorName: 'klar', lightColors: { main: '#10B981', container: '#d1fae5', onContainer: '#064e3b' } },
            faktureras: { colorName: 'faktureras', lightColors: { main: '#8B5CF6', container: '#ede9fe', onContainer: '#4c1d95' } },
            offererad: { colorName: 'offererad', lightColors: { main: '#F59E0B', container: '#fef3c7', onContainer: '#78350f' } },
        },

        callbacks: {
            // När man klickar på ett event -> Kör funktionen vi skickade med (öppna modal)
            onEventClick(calendarEvent) {
                if (onEventClickCallback) {
                    onEventClickCallback(calendarEvent.id);
                }
            }
        }
    });

    calendarApp.render(calendarEl);
}

// Funktion för att byta tema live (utan att ladda om allt)
export function setCalendarTheme(theme) {
    if (calendarApp) {
        calendarApp.setTheme(theme === 'dark' ? 'dark' : 'light');
    }
}
