// calendar.js
import { createCalendar, viewDay, viewWeek, viewMonthGrid, viewMonthAgenda } from 'https://cdn.jsdelivr.net/npm/@schedule-x/calendar@1.53.0/+esm';
import { createDragAndDropPlugin } from 'https://cdn.jsdelivr.net/npm/@schedule-x/drag-and-drop@1.53.0/+esm';
import { createEventModalPlugin } from 'https://cdn.jsdelivr.net/npm/@schedule-x/event-modal@1.53.0/+esm';

let calendarApp = null;

function mapJobsToEvents(jobs) {
    const realEvents = jobs
        .filter(job => !job.deleted && job.status !== 'avbokad')
        .map(job => {
            // Hantera datum och tid
            let startDateTime = job.datum; 
            if (!startDateTime.includes('T')) {
                startDateTime = `${job.datum} ${job.tid || '08:00'}`;
            } else {
                startDateTime = startDateTime.replace('T', ' ');
            }

            let endDateTime = startDateTime;
            try {
                const dateObj = new Date(startDateTime.replace(' ', 'T')); 
                dateObj.setHours(dateObj.getHours() + 1);
                
                const year = dateObj.getFullYear();
                const month = String(dateObj.getMonth() + 1).padStart(2, '0');
                const day = String(dateObj.getDate()).padStart(2, '0');
                const hour = String(dateObj.getHours()).padStart(2, '0');
                const min = String(dateObj.getMinutes()).padStart(2, '0');
                endDateTime = `${year}-${month}-${day} ${hour}:${min}`;
            } catch(e) {}

            return {
                id: job.id,
                title: `${job.kundnamn}`, // Visar Kundnamn i kalendern
                start: startDateTime,
                end: endDateTime,
                description: job.paket || '',
                calendarId: job.status 
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

    const dragAndDrop = createDragAndDropPlugin();
    const eventModal = createEventModalPlugin();

    calendarApp = createCalendar({
        // Vi behåller vyerna men sätter MonthGrid som default
        views: [viewMonthGrid, viewWeek, viewDay, viewMonthAgenda], 
        
        // --- VIKTIGT: Månadsvy som standard överallt ---
        defaultView: viewMonthGrid.name, 
        
        events: events,
        locale: 'sv-SE',
        firstDayOfWeek: 1, // Måndag
        isDark: isDarkMode,
        
        // Tidsgränser (påverkar bara vecka/dag-vyerna om man byter till dem)
        dayBoundaries: {
            start: '06:00',
            end: '20:00',
        },

        plugins: [dragAndDrop, eventModal],

        // Färgteman (Matchar reklambilden - Rena och snygga)
        calendars: {
            bokad: { 
                colorName: 'bokad', 
                lightColors: { main: '#3b82f6', container: '#eff6ff', onContainer: '#1e3a8a' } 
            },
            klar: { 
                colorName: 'klar', 
                lightColors: { main: '#10b981', container: '#ecfdf5', onContainer: '#064e3b' } 
            },
            faktureras: { 
                colorName: 'faktureras', 
                lightColors: { main: '#8b5cf6', container: '#f5f3ff', onContainer: '#4c1d95' } 
            },
            offererad: { 
                colorName: 'offererad', 
                lightColors: { main: '#f59e0b', container: '#fffbeb', onContainer: '#78350f' } 
            },
        },

        callbacks: {
            onEventClick(calendarEvent) {
                if (onEventClickCallback) onEventClickCallback(calendarEvent.id);
            },
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
