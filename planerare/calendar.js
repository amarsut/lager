import { createCalendar, viewDay, viewWeek, viewMonthGrid, viewMonthAgenda } from 'https://cdn.jsdelivr.net/npm/@schedule-x/calendar@1.53.0/+esm';
import { createDragAndDropPlugin } from 'https://cdn.jsdelivr.net/npm/@schedule-x/drag-and-drop@1.53.0/+esm';
import { createEventModalPlugin } from 'https://cdn.jsdelivr.net/npm/@schedule-x/event-modal@1.53.0/+esm';

let calendarApp = null;

function mapJobsToEvents(jobs) {
    return jobs
        .filter(job => !job.deleted && job.status !== 'avbokad')
        .map(job => {
            let startDateTime = job.datum;
            let timePrefix = ""; 

            // 1. Hantera Datum & Tid
            if (!startDateTime.includes('T')) {
                // Om vi bara har datum, använd vald tid eller standard 08:00
                const t = job.tid || '08:00';
                timePrefix = t;
                startDateTime = `${job.datum} ${t}`;
            } else {
                // Om vi har ISO-sträng
                startDateTime = startDateTime.replace('T', ' ');
                try {
                    // Extrahera klockslag (HH:mm) från strängen
                    timePrefix = startDateTime.split(' ')[1].substring(0, 5);
                } catch(e) {}
            }

            // 2. Skapa slutdatum (1 timme senare som standard)
            let endDateTime = startDateTime;
            try {
                const d = new Date(startDateTime.replace(' ', 'T'));
                d.setHours(d.getHours() + 1);
                
                // Formatera manuellt för att slippa tidszonskrångel
                const Y = d.getFullYear();
                const M = String(d.getMonth()+1).padStart(2,'0');
                const D = String(d.getDate()).padStart(2,'0');
                const H = String(d.getHours()).padStart(2,'0');
                const m = String(d.getMinutes()).padStart(2,'0');
                endDateTime = `${Y}-${M}-${D} ${H}:${m}`;
            } catch(e) {}

            // 3. Skapa Titel: "10:00 KUNDNAMN"
            const finalTitle = timePrefix ? `${timePrefix} ${job.kundnamn}` : job.kundnamn;

            return {
                id: job.id,
                title: finalTitle, 
                start: startDateTime,
                end: endDateTime,
                description: job.paket || '',
                calendarId: job.status 
            };
        });
}

export function initCalendar(elementId, jobsData, onEventClickCallback) {
    const calendarEl = document.getElementById(elementId);
    if (!calendarEl) return;

    calendarEl.innerHTML = '';

    const events = mapJobsToEvents(jobsData);
    const isDarkMode = document.documentElement.getAttribute('data-theme') === 'dark';

    const dragAndDrop = createDragAndDropPlugin();
    const eventModal = createEventModalPlugin();

    calendarApp = createCalendar({
        views: [viewMonthGrid, viewWeek, viewDay, viewMonthAgenda], 
        
        // --- VIKTIGT: ALLTID MÅNAD SOM STANDARD ---
        defaultView: viewMonthGrid.name, 
        
        // --- VIKTIGT: STÄNG AV MOBIL-AUTO-LÄGE ---
        // Detta gör att vi kan tvinga fram månadsvy även på små skärmar
        isResponsive: false,
        
        events: events,
        locale: 'sv-SE',
        firstDayOfWeek: 1, 
        isDark: isDarkMode,
        
        dayBoundaries: { start: '06:00', end: '20:00' },

        plugins: [dragAndDrop, eventModal],

        // Färgpalett (Premium Pastel Style)
        calendars: {
            bokad: { 
                colorName: 'bokad', 
                lightColors: { 
                    main: '#3b82f6',       // Stark blå (kant)
                    container: '#eff6ff',  // Ljusblå (bakgrund)
                    onContainer: '#1e40af' // Mörkblå (text)
                } 
            },
            klar: { 
                colorName: 'klar', 
                lightColors: { 
                    main: '#10b981',       // Stark grön
                    container: '#ecfdf5',  // Ljusgrön
                    onContainer: '#065f46' // Mörkgrön
                } 
            },
            faktureras: { 
                colorName: 'faktureras', 
                lightColors: { 
                    main: '#8b5cf6',       // Stark lila
                    container: '#f5f3ff',  // Ljuslila
                    onContainer: '#5b21b6' // Mörklila
                } 
            },
            offererad: { 
                colorName: 'offererad', 
                lightColors: { 
                    main: '#f59e0b',       // Stark orange
                    container: '#fffbeb',  // Ljusorange
                    onContainer: '#92400e' // Mörkorange
                } 
            },
        },

        callbacks: {
            onEventClick(calendarEvent) {
                if (onEventClickCallback) onEventClickCallback(calendarEvent.id);
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
