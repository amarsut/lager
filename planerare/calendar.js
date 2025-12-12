// calendar.js
import { createCalendar, viewDay, viewWeek, viewMonthGrid, viewMonthAgenda } from 'https://cdn.jsdelivr.net/npm/@schedule-x/calendar@1.53.0/+esm';
import { createDragAndDropPlugin } from 'https://cdn.jsdelivr.net/npm/@schedule-x/drag-and-drop@1.53.0/+esm';
import { createEventModalPlugin } from 'https://cdn.jsdelivr.net/npm/@schedule-x/event-modal@1.53.0/+esm';

let calendarApp = null;

function mapJobsToEvents(jobs) {
    const realEvents = jobs
        .filter(job => !job.deleted && job.status !== 'avbokad')
        .map(job => {
            const startDate = job.datum.includes('T') ? job.datum.replace('T', ' ') : `${job.datum} ${job.tid}`;
            let endDate = startDate;
            
            try {
                const d = new Date(job.datum.includes('T') ? job.datum : `${job.datum}T${job.tid}`);
                d.setHours(d.getHours() + 1);
                
                const year = d.getFullYear();
                const month = String(d.getMonth() + 1).padStart(2, '0');
                const day = String(d.getDate()).padStart(2, '0');
                const hour = String(d.getHours()).padStart(2, '0');
                const min = String(d.getMinutes()).padStart(2, '0');
                endDate = `${year}-${month}-${day} ${hour}:${min}`;
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
        // Lägg till viewMonthAgenda för bättre mobilvy
        views: [viewMonthGrid, viewWeek, viewDay, viewMonthAgenda], 
        
        // 1. SÄTT MÅNAD SOM STANDARD
        defaultView: viewMonthGrid.name, 
        
        events: events,
        locale: 'sv-SE',
        firstDayOfWeek: 1,
        isDark: isDarkMode,
        
        // 2. BEGRÄNSA TIDER (07:00 - 21:00)
        dayBoundaries: {
            start: '07:00',
            end: '21:00',
        },

        plugins: [dragAndDrop, eventModal],

        calendars: {
            bokad: { colorName: 'bokad', lightColors: { main: '#6366f1', container: '#e0e7ff', onContainer: '#312e81' } },
            klar: { colorName: 'klar', lightColors: { main: '#10b981', container: '#d1fae5', onContainer: '#064e3b' } },
            faktureras: { colorName: 'faktureras', lightColors: { main: '#8b5cf6', container: '#ede9fe', onContainer: '#4c1d95' } },
            offererad: { colorName: 'offererad', lightColors: { main: '#f59e0b', container: '#fef3c7', onContainer: '#78350f' } },
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
