// calendar.js
// Vi använder JSDelivr med specifika versioner för stabilitet (+esm flaggan är viktig!)
import { createCalendar, viewDay, viewWeek, viewMonthGrid } from 'https://cdn.jsdelivr.net/npm/@schedule-x/calendar@1.53.0/+esm';

// Ta bort CSS-importen härifrån - den ligger redan i din HTML <head>

let calendarApp = null;

function mapJobsToEvents(jobs) {
    return jobs
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
            } catch(e) { console.error("Datumfel", e); }

            return {
                id: job.id,
                title: `${job.regnr} - ${job.kundnamn}`,
                start: startDate,
                end: endDate,
                description: job.paket || '',
                calendarId: job.status 
            };
        });
}

export function initCalendar(elementId, jobsData, onEventClickCallback) {
    const calendarEl = document.getElementById(elementId);
    if (!calendarEl) {
        console.error(`Kunde inte hitta elementet #${elementId}`);
        return;
    }

    calendarEl.innerHTML = '';

    const events = mapJobsToEvents(jobsData);
    const isDarkMode = document.documentElement.getAttribute('data-theme') === 'dark';

    calendarApp = createCalendar({
        views: [viewMonthGrid, viewWeek, viewDay],
        defaultView: viewWeek.name,
        events: events,
        locale: 'sv-SE',
        firstDayOfWeek: 1, 
        isDark: isDarkMode,
        
        calendars: {
            bokad: { colorName: 'bokad', lightColors: { main: '#3b82f6', container: '#dbeafe', onContainer: '#1e3a8a' } },
            klar: { colorName: 'klar', lightColors: { main: '#10B981', container: '#d1fae5', onContainer: '#064e3b' } },
            faktureras: { colorName: 'faktureras', lightColors: { main: '#8B5CF6', container: '#ede9fe', onContainer: '#4c1d95' } },
            offererad: { colorName: 'offererad', lightColors: { main: '#F59E0B', container: '#fef3c7', onContainer: '#78350f' } },
        },

        callbacks: {
            onEventClick(calendarEvent) {
                if (onEventClickCallback) {
                    onEventClickCallback(calendarEvent.id);
                }
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
