import { createCalendar, viewDay, viewWeek, viewMonthGrid, viewMonthAgenda } from 'https://cdn.jsdelivr.net/npm/@schedule-x/calendar@1.53.0/+esm';
import { createDragAndDropPlugin } from 'https://cdn.jsdelivr.net/npm/@schedule-x/drag-and-drop@1.53.0/+esm';
import { createEventModalPlugin } from 'https://cdn.jsdelivr.net/npm/@schedule-x/event-modal@1.53.0/+esm';

let calendarApp = null;

function mapJobsToEvents(jobs) {
    return jobs
        .filter(job => !job.deleted && job.status !== 'avbokad')
        .map(job => {
            let startDateTime = job.datum;
            if (!startDateTime.includes('T')) {
                startDateTime = `${job.datum} ${job.tid || '08:00'}`;
            } else {
                startDateTime = startDateTime.replace('T', ' ');
            }

            let endDateTime = startDateTime;
            try {
                const d = new Date(startDateTime.replace(' ', 'T'));
                d.setHours(d.getHours() + 1);
                const Y = d.getFullYear();
                const M = String(d.getMonth()+1).padStart(2,'0');
                const D = String(d.getDate()).padStart(2,'0');
                const H = String(d.getHours()).padStart(2,'0');
                const m = String(d.getMinutes()).padStart(2,'0');
                endDateTime = `${Y}-${M}-${D} ${H}:${m}`;
            } catch(e) {}

            return {
                id: job.id,
                title: job.kundnamn, 
                start: startDateTime,
                end: endDateTime,
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
        views: [viewMonthGrid, viewWeek, viewDay], 
        defaultView: viewMonthGrid.name, 
        isResponsive: false, // VIKTIGT: Stänger av inbyggd mobil-logik så vi kan styra den själva
        
        events: events,
        locale: 'sv-SE',
        firstDayOfWeek: 1, 
        isDark: isDarkMode,
        
        plugins: [dragAndDrop, eventModal],

        calendars: {
            bokad: { colorName: 'bokad', lightColors: { main: '#3b82f6', container: '#eff6ff', onContainer: '#1e3a8a' } },
            klar: { colorName: 'klar', lightColors: { main: '#10b981', container: '#ecfdf5', onContainer: '#064e3b' } },
            faktureras: { colorName: 'faktureras', lightColors: { main: '#8b5cf6', container: '#f5f3ff', onContainer: '#4c1d95' } },
            offererad: { colorName: 'offererad', lightColors: { main: '#f59e0b', container: '#fffbeb', onContainer: '#78350f' } },
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
