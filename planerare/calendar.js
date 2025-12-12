// calendar.js
import { createCalendar, viewDay, viewWeek, viewMonthGrid, viewMonthAgenda } from 'https://cdn.jsdelivr.net/npm/@schedule-x/calendar@1.53.0/+esm';
import { createDragAndDropPlugin } from 'https://cdn.jsdelivr.net/npm/@schedule-x/drag-and-drop@1.53.0/+esm';
import { createEventModalPlugin } from 'https://cdn.jsdelivr.net/npm/@schedule-x/event-modal@1.53.0/+esm';

let calendarApp = null;

function mapJobsToEvents(jobs) {
    const realEvents = jobs
        .filter(job => !job.deleted && job.status !== 'avbokad')
        .map(job => {
            // Skapa start- och slutdatum
            // Om ingen tid finns, sätts en standardtid, annars används vald tid
            let startDateTime = job.datum; 
            
            // Om datumet inte har T (bara YYYY-MM-DD), lägg till tid
            if (!startDateTime.includes('T')) {
                startDateTime = `${job.datum} ${job.tid || '08:00'}`;
            } else {
                // Byt T mot mellanslag för schedule-x format (YYYY-MM-DD HH:mm)
                startDateTime = startDateTime.replace('T', ' ');
            }

            // Räkna ut sluttid (Standard: 1 timme senare)
            // För en mer avancerad lösning kan du spara 'sluttid' i din databas
            let endDateTime = startDateTime;
            try {
                // Konvertera sträng till Date-objekt för beräkning
                const dateObj = new Date(startDateTime.replace(' ', 'T')); 
                dateObj.setHours(dateObj.getHours() + 1); // Lägg på 1 timme
                
                // Formatera tillbaka till YYYY-MM-DD HH:mm
                const year = dateObj.getFullYear();
                const month = String(dateObj.getMonth() + 1).padStart(2, '0');
                const day = String(dateObj.getDate()).padStart(2, '0');
                const hour = String(dateObj.getHours()).padStart(2, '0');
                const min = String(dateObj.getMinutes()).padStart(2, '0');
                endDateTime = `${year}-${month}-${day} ${hour}:${min}`;
            } catch(e) {
                console.error("Fel vid datumkonvertering", e);
            }

            return {
                id: job.id,
                title: `${job.regnr} - ${job.kundnamn}`,
                start: startDateTime,
                end: endDateTime,
                description: job.paket || '',
                calendarId: job.status // Används för färgerna
            };
        });

    return realEvents;
}

export function initCalendar(elementId, jobsData, onEventClickCallback) {
    const calendarEl = document.getElementById(elementId);
    if (!calendarEl) return;

    calendarEl.innerHTML = '';

    const events = mapJobsToEvents(jobsData);
    const isDarkMode = document.documentElement.getAttribute('data-theme') === 'dark';
    const isMobile = window.innerWidth <= 768;

    const dragAndDrop = createDragAndDropPlugin();
    const eventModal = createEventModalPlugin();

    // --- KONFIGURATION ---
    // Bestäm vilken vy som ska vara standard. 
    // Desktop: viewWeek (för att likna reklambilden).
    // Mobil: viewDay (för att det ska vara läsbart).
    const defaultViewMode = isMobile ? viewDay.name : viewWeek.name;

    calendarApp = createCalendar({
        views: [viewDay, viewWeek, viewMonthGrid, viewMonthAgenda], 
        defaultView: defaultViewMode, 
        
        events: events,
        locale: 'sv-SE',
        firstDayOfWeek: 1, // Måndag
        isDark: isDarkMode,
        
        // Begränsa tiderna så kalendern inte blir milslång
        dayBoundaries: {
            start: '06:00',
            end: '20:00',
        },

        plugins: [dragAndDrop, eventModal],

        // --- FÄRGER (Matchar reklambilden bättre) ---
        calendars: {
            bokad: { 
                colorName: 'bokad', 
                lightColors: { 
                    main: '#3b82f6', // Starkare blå linje
                    container: '#eff6ff', // Väldigt ljus blå bakgrund
                    onContainer: '#1e3a8a' // Mörkblå text
                } 
            },
            klar: { 
                colorName: 'klar', 
                lightColors: { 
                    main: '#10b981', 
                    container: '#ecfdf5', 
                    onContainer: '#064e3b' 
                } 
            },
            faktureras: { 
                colorName: 'faktureras', 
                lightColors: { 
                    main: '#8b5cf6', 
                    container: '#f5f3ff', 
                    onContainer: '#4c1d95' 
                } 
            },
            offererad: { 
                colorName: 'offererad', 
                lightColors: { 
                    main: '#f59e0b', 
                    container: '#fffbeb', 
                    onContainer: '#78350f' 
                } 
            },
        },

        callbacks: {
            onEventClick(calendarEvent) {
                if (onEventClickCallback) onEventClickCallback(calendarEvent.id);
            },
            onEventUpdate(updatedEvent) {
                console.log('Event flyttat:', updatedEvent);
                // Här kan du lägga till kod för att spara ny tid till Firebase om du vill
            }
        }
    });

    calendarApp.render(calendarEl);
}

export function setCalendarTheme(theme) {
    if (calendarApp) {
        calendarApp.setTheme(theme === 'dark' ? 'dark' : 'light');
    }
}
