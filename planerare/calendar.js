import { createCalendar, viewMonthGrid, viewWeek, viewDay } from 'https://cdn.jsdelivr.net/npm/@schedule-x/calendar@1.53.0/+esm';
import { createDragAndDropPlugin } from 'https://cdn.jsdelivr.net/npm/@schedule-x/drag-and-drop@1.53.0/+esm';
import { createEventModalPlugin } from 'https://cdn.jsdelivr.net/npm/@schedule-x/event-modal@1.53.0/+esm';

let calendarApp = null;

function mapJobsToEvents(jobs) {
    return jobs
        .filter(job => !job.deleted && job.status !== 'avbokad')
        .map(job => {
            // Skapa start- och slutdatum
            let startDateTime = job.datum;
            let timeString = "";

            if (!startDateTime.includes('T')) {
                // Om datumet bara är YYYY-MM-DD
                timeString = job.tid || '08:00';
                startDateTime = `${job.datum} ${timeString}`;
            } else {
                // Om datumet är ISO-sträng
                startDateTime = startDateTime.replace('T', ' ');
                try {
                    timeString = startDateTime.split(' ')[1].substring(0, 5);
                } catch(e) {}
            }

            let endDateTime = startDateTime;
            try {
                const d = new Date(startDateTime.replace(' ', 'T'));
                d.setHours(d.getHours() + 1); // Standardlängd 1 timme
                
                const Y = d.getFullYear();
                const M = String(d.getMonth()+1).padStart(2,'0');
                const D = String(d.getDate()).padStart(2,'0');
                const H = String(d.getHours()).padStart(2,'0');
                const m = String(d.getMinutes()).padStart(2,'0');
                endDateTime = `${Y}-${M}-${D} ${H}:${m}`;
            } catch(e) {}

            // Titel: "10:00 KUNDNAMN"
            const title = timeString ? `${timeString} ${job.kundnamn}` : job.kundnamn;

            return {
                id: job.id,
                title: title, 
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
        
        // --- VIKTIGT: TVINGA MÅNADSVY ---
        defaultView: viewMonthGrid.name,
        
        // --- VIKTIGT: STÄNG AV MOBIL-ANPASSNING ---
        // Detta gör att den inte byter till Dagsvy automatiskt på mobilen
        isResponsive: false,
        
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
