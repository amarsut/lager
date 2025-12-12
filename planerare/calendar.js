// calendar.js
import { createCalendar, viewDay, viewWeek, viewMonthGrid } from 'https://cdn.jsdelivr.net/npm/@schedule-x/calendar@1.53.0/+esm';
import { createDragAndDropPlugin } from 'https://cdn.jsdelivr.net/npm/@schedule-x/drag-and-drop@1.53.0/+esm';
import { createEventModalPlugin } from 'https://cdn.jsdelivr.net/npm/@schedule-x/event-modal@1.53.0/+esm';

let calendarApp = null;

// Konvertera jobb till event
function mapJobsToEvents(jobs) {
    const realEvents = jobs
        .filter(job => !job.deleted && job.status !== 'avbokad')
        .map(job => {
            const startDate = job.datum.includes('T') ? job.datum.replace('T', ' ') : `${job.datum} ${job.tid}`;
            let endDate = startDate;
            
            // Enkel logik för sluttid (+1 timme)
            try {
                const d = new Date(job.datum.includes('T') ? job.datum : `${job.datum}T${job.tid}`);
                d.setHours(d.getHours() + 1);
                const iso = d.toISOString(); // Ger YYYY-MM-DDTHH:mm...
                // Schedule-X vill ha YYYY-MM-DD HH:mm
                endDate = iso.substring(0, 10) + ' ' + iso.substring(11, 16);
            } catch(e) {}

            return {
                id: job.id,
                title: `${job.regnr} - ${job.kundnamn}`,
                start: startDate,
                end: endDate,
                description: job.paket || '',
                calendarId: job.status 
            };
        });

    // --- TESTDATA: Så du ser hur snyggt det blir direkt (Ta bort sen) ---
    const testEvents = [
        { id: 't1', title: 'Service Volvo V70', start: '2025-12-08 09:00', end: '2025-12-08 11:00', calendarId: 'bokad', description: 'Stor service' },
        { id: 't2', title: 'Hjulskifte BMW', start: '2025-12-08 13:00', end: '2025-12-08 13:45', calendarId: 'klar' },
        { id: 't3', title: 'Felsökning Audi', start: '2025-12-09 10:00', end: '2025-12-09 12:00', calendarId: 'faktureras' },
        { id: 't4', title: 'Oljebyte Saab', start: '2025-12-10 14:00', end: '2025-12-10 15:00', calendarId: 'offererad' },
        { id: 't5', title: 'Bromsbyte VW', start: '2025-12-11 08:00', end: '2025-12-11 11:00', calendarId: 'bokad' },
        { id: 't6', title: 'AC Service', start: '2025-12-12 09:30', end: '2025-12-12 10:30', calendarId: 'bokad' }
    ];

    return [...realEvents, ...testEvents];
}

export function initCalendar(elementId, jobsData, onEventClickCallback) {
    const calendarEl = document.getElementById(elementId);
    if (!calendarEl) return;

    calendarEl.innerHTML = '';

    const events = mapJobsToEvents(jobsData);
    const isDarkMode = document.documentElement.getAttribute('data-theme') === 'dark';

    // Initiera plugins
    const dragAndDrop = createDragAndDropPlugin();
    const eventModal = createEventModalPlugin();

    calendarApp = createCalendar({
        views: [viewMonthGrid, viewWeek, viewDay],
        defaultView: viewWeek.name,
        events: events,
        locale: 'sv-SE',
        firstDayOfWeek: 1,
        isDark: isDarkMode,
        
        // Lägg till plugins här
        plugins: [dragAndDrop, eventModal],

        // Samma färger som demon (ungefär)
        calendars: {
            bokad: { colorName: 'bokad', lightColors: { main: '#6366f1', container: '#e0e7ff', onContainer: '#312e81' } }, // Indigo (Liknar demon)
            klar: { colorName: 'klar', lightColors: { main: '#10b981', container: '#d1fae5', onContainer: '#064e3b' } }, // Grön
            faktureras: { colorName: 'faktureras', lightColors: { main: '#8b5cf6', container: '#ede9fe', onContainer: '#4c1d95' } }, // Lila
            offererad: { colorName: 'offererad', lightColors: { main: '#f59e0b', container: '#fef3c7', onContainer: '#78350f' } }, // Orange
        },

        callbacks: {
            onEventClick(calendarEvent) {
                // Om det är ett riktigt jobb (inte testdata), öppna modal
                if (!calendarEvent.id.startsWith('t')) { 
                    if (onEventClickCallback) onEventClickCallback(calendarEvent.id);
                }
            },
            
            // Uppdatera tid om man drar i kalendern (valfritt att spara till databas senare)
            onEventUpdate(updatedEvent) {
                console.log('Event flyttat:', updatedEvent);
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
