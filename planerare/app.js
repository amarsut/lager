	// --- Globala Konstanter ---
        const STATUS_TEXT = {
            'bokad': 'Bokad', 'klar': 'Klar', 
            'offererad': 'Offererad', 'avbokad': 'Avbokad'
        };
        const formatCurrency = (num) => `${(num || 0).toLocaleString('sv-SE')} kr`;
        const locale = 'sv-SE';
        
        const formatDate = (dateString, options = {}) => {
            const { onlyDate = false } = options;
            if (!dateString) return 'Okänt datum';
            try {
                const d = new Date(dateString);
                
                const dateOptions = { weekday: 'short', month: 'short', day: 'numeric' };
                const timeOptions = { hour: '2-digit', minute: '2-digit', hour12: false };
                
                let datePart = new Intl.DateTimeFormat(locale, dateOptions).format(d);
                datePart = datePart.charAt(0).toUpperCase() + datePart.slice(1); 
                
                if (onlyDate) {
                    return datePart;
                }
                
                const timePart = new Intl.DateTimeFormat(locale, timeOptions).format(d).replace(':', '.');
                
                return `${datePart} kl. ${timePart}`;

            } catch (e) { return "Ogiltigt datum"; }
        };
        
        const debounce = (func, timeout = 300) => {
            let timer;
            return (...args) => {
                clearTimeout(timer);
                timer = setTimeout(() => { func.apply(this, args); }, timeout);
            };
        };
        function highlightSearchTerm(text, term) {
            if (!term) return text;
            const safeText = String(text).replace(/</g, '&lt;').replace(/>/g, '&gt;');
            const regex = new RegExp(`(${term.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&')})`, 'gi');
            return safeText.replace(regex, '<mark>$1</mark>');
        }

        // --- NYTT: Kontextuell Ikon-funktion ---
        function getJobContextIcon(job) {
            return ''; // Returnera tom sträng om inget matchar
        }
        
        document.addEventListener('DOMContentLoaded', function() {
            
            // --- Globalt Tillstånd (State) ---
            let allJobs = [];
			let backPressWarned = false;
            let backPressTimer;
            let currentSearchTerm = "";
            let currentStatusFilter = 'kommande';
            let appInitialized = false;
			let lockOnHideTimer = null;
            const today = new Date();
            const todayString = today.toISOString().split('T')[0];
			const now = new Date();
            
            let calendar;
            let currentView = localStorage.getItem('defaultView') || 'timeline';
            
            let isModalOpen = false;
            let currentOpenModalId = null;
            let isNavigatingBack = false; 

            let statsChartInstance = null;
            let weekdayChartInstance = null;
            let currentProfitGoal = localStorage.getItem('profitGoal') || 0; 

			// --- NYTT: Kanban Sorterings-instanser ---
			let sortableColOffererad, sortableColBokad, sortableColKlar;

            // --- DOM-element ---
            const docElement = document.documentElement;
			const privacyToggle = document.getElementById('privacyToggle');
			const settingsPrivacyToggle = document.getElementById('settingsPrivacyToggle');

			let isPrivacyModeEnabled = localStorage.getItem('privacyMode') === 'true';
            const appContainer = document.querySelector('.app-container');
            const toast = document.getElementById('toastNotification');
            
            const appBrandTitle = document.getElementById('appBrandTitle'); 
            
            const timelineView = document.getElementById('timelineView');
            const jobListContainer = document.getElementById('jobListContainer');
            const emptyStateTimeline = document.getElementById('emptyStateTimeline');
            const emptyStateTitleTimeline = document.getElementById('emptyStateTitleTimeline');
            const emptyStateTextTimeline = document.getElementById('emptyStateTextTimeline');
            const emptyStateAddBtn = document.getElementById('emptyStateAddBtn');
            const searchBar = document.getElementById('searchBar');
			const desktopSearchWrapper = document.querySelector('#view-controls .search-wrapper');
            const clearDayFilterBtn = document.getElementById('clearDayFilterBtn');

            const calendarView = document.getElementById('calendarView');
            const calendarContainer = document.getElementById('calendarContainer');
            const viewToggleButtons = document.getElementById('viewToggleButtons');
            const btnToggleTimeline = document.getElementById('btnToggleTimeline');
            const btnToggleCalendar = document.getElementById('btnToggleCalendar');
            
            const themeToggle = document.getElementById('themeToggle');
            const statBar = document.getElementById('statBar');
            const statUpcoming = document.getElementById('stat-upcoming');
            const statFinished = document.getElementById('stat-finished');
            const statOffered = document.getElementById('stat-offered');
            const statAll = document.getElementById('stat-all');
            
            const jobModal = document.getElementById('jobModal');
            const jobModalForm = document.getElementById('jobModalForm');
            const modalTitle = document.getElementById('modalTitle');
            const modalSaveBtn = document.getElementById('modalSaveBtn');
            const jobTemplates = document.getElementById('jobTemplates'); 
            const fabAddJob = document.getElementById('fabAddJob');
            const modalCloseBtn = document.getElementById('modalCloseBtn');
            const modalCancelBtn = document.getElementById('modalCancelBtn');
            const modalJobId = document.getElementById('jobId');
            const modalKundpris = document.getElementById('kundpris');
            const modalUtgifter = document.getElementById('utgifter');
            const modalVinstKalkyl = document.getElementById('vinstKalkyl');
			const expenseNameInput = document.getElementById('expenseName');
            const expenseCostInput = document.getElementById('expenseCost');
            const addExpenseBtn = document.getElementById('addExpenseBtn');
            const expenseListContainer = document.getElementById('expenseList');
            const modalRegnr = document.getElementById('regnr');
            const modalDatum = document.getElementById('datum');
            const modalTid = document.getElementById('tid');
            const quickTimeButtons = document.getElementById('quickTimeButtons');
            const modalKundnamn = document.getElementById('kundnamn');
            const kundnamnSuggestions = document.getElementById('kundnamnSuggestions');
            const modalTelefon = document.getElementById('telefon');
			const jobModalCallBtn = document.getElementById('jobModalCallBtn'); // <-- NY
            const jobModalSmsBtn = document.getElementById('jobModalSmsBtn'); // <-- NY
            const modalStatusSelect = document.getElementById('status');
            const quickStatusButtons = document.getElementById('quickStatusButtons');
            const copyKundnamnBtn = document.getElementById('copyKundnamn');
            const copyRegnrBtn = document.getElementById('copyRegnr');
            const copyCarRegnrBtn = document.getElementById('copyCarRegnrBtn'); // <-- NY

			// --- NYTT: Översikts-modal ---
            const jobSummaryModal = document.getElementById('jobSummaryModal');
            const modalSummaryCloseBtn = document.getElementById('modalSummaryCloseBtn');
            const modalSummaryStangBtn = document.getElementById('modalSummaryStangBtn');
            const modalSummaryEditBtn = document.getElementById('modalSummaryEditBtn');
            
            const modalSummaryKundnamn = document.getElementById('modalSummaryKundnamn');
            const modalSummaryTelefon = document.getElementById('modalSummaryTelefon');
            const modalSummaryRegnr = document.getElementById('modalSummaryRegnr');
            const modalSummaryStatus = document.getElementById('modalSummaryStatus');
            const modalSummaryDatum = document.getElementById('modalSummaryDatum');
            const modalSummaryMatarstallning = document.getElementById('modalSummaryMatarstallning');
            const modalSummaryKundpris = document.getElementById('modalSummaryKundpris');
            const modalSummaryTotalUtgift = document.getElementById('modalSummaryTotalUtgift');
            const modalSummaryVinst = document.getElementById('modalSummaryVinst');
            const modalSummaryExpenseBox = document.getElementById('modalSummaryExpenseBox');
            const modalSummaryExpenseList = document.getElementById('modalSummaryExpenseList');
            const modalSummaryKommentarer = document.getElementById('modalSummaryKommentarer');
            // --- SLUT ÖVERSIKTS-MODAL ---
            
            const customerModal = document.getElementById('customerModal');
            const customerModalCloseBtn = document.getElementById('customerModalCloseBtn');
            const customerModalName = document.getElementById('customerModalName');
            const customerModalPhone = document.getElementById('customerModalPhone');
            const editCustomerPhoneBtn = document.getElementById('editCustomerPhoneBtn'); 
			const customerModalCallBtn = document.getElementById('customerModalCallBtn'); // <-- NY
            const customerModalSmsBtn = document.getElementById('customerModalSmsBtn'); // <-- NY
            const customerModalTotalProfit = document.getElementById('customerModalTotalProfit');
            const customerModalJobCount = document.getElementById('customerModalJobCount');
            const customerModalJobList = document.getElementById('customerModalJobList');
            const customerSearch = document.getElementById('customerSearch'); 
            
            const carModal = document.getElementById('carModal');
            const carModalCloseBtn = document.getElementById('carModalCloseBtn');
            const carModalRegnr = document.getElementById('carModalRegnr');
            const carModalOwner = document.getElementById('carModalOwner');
            const carModalExternalLink = document.getElementById('carModalExternalLink'); 
            const carModalExternalLinkMobile = document.getElementById('carModalExternalLinkMobile'); 
			const carModalOljemagasinetLink = document.getElementById('carModalOljemagasinetLink');
            const carModalOljemagasinetLinkMobile = document.getElementById('carModalOljemagasinetLinkMobile');
            const carModalTotalProfit = document.getElementById('carModalTotalProfit');
            const carModalJobCount = document.getElementById('carModalJobCount');
            const carModalJobList = document.getElementById('carModalJobList');
            const carSearch = document.getElementById('carSearch'); 

            const navLogo = document.querySelector('.nav-logo');
            const statsModal = document.getElementById('statsModal');
            const statsModalCloseBtn = document.getElementById('statsModalCloseBtn');
            const statsModalTotalProfit = document.getElementById('statsModalTotalProfit');
            const statsModalJobCount = document.getElementById('statsModalJobCount');
            const statsModalBody = document.getElementById('statsModalBody');
            
            const settingsBtn = document.getElementById('settingsBtn');
            const mobileSettingsBtn = document.getElementById('mobileSettingsBtn');
            const settingsModal = document.getElementById('settingsModal');
            const settingsModalCloseBtn = document.getElementById('settingsModalCloseBtn');
            const settingsModalCancelBtn = document.getElementById('settingsModalCancelBtn');
            const settingsModalSaveBtn = document.getElementById('settingsModalSaveBtn');
            const settingsModalForm = document.getElementById('settingsModalForm');
            const profitGoalInput = document.getElementById('profitGoalInput');
            const profitGoalProgress = document.getElementById('profitGoalProgress');
            const profitGoalCurrent = document.getElementById('profitGoalCurrent');
            const profitGoalTarget = document.getElementById('profitGoalTarget');
            const profitGoalFill = document.getElementById('profitGoalFill');
            const mobileSettingsGroup = document.getElementById('mobileSettingsGroup');
            const settingsThemeToggle = document.getElementById('settingsThemeToggle');
            const settingsToggleCompactView = document.getElementById('settingsToggleCompactView');
            const settingsLockAppBtn = document.getElementById('settingsLockAppBtn');
            const exportCsvBtn = document.getElementById('exportCsvBtn');


            const popoverBackdrop = document.getElementById('popoverBackdrop');
            const commentPopover = document.getElementById('commentPopover');
            const commentPopoverContent = document.getElementById('commentPopoverContent');
            const commentPopoverClose = document.getElementById('commentPopoverClose');

			commentPopover.addEventListener('click', (e) => e.stopPropagation());
            
            const contextMenu = document.getElementById('contextMenu');
            let contextMenuJobId = null;
            
            const toggleCompactView = document.getElementById('toggleCompactView');
            
            const pinLockModal = document.getElementById('pinLockModal');
            const pinLockForm = document.getElementById('pinLockForm');
            const pinInput = document.getElementById('pinInput');
            const pinError = document.getElementById('pinError');
            const lockAppBtn = document.getElementById('lockAppBtn');
            const APP_PIN_KEY = 'jobbPlannerarePin';
            const PIN_LAST_UNLOCKED_KEY = 'jobbPlannerareLastUnlocked';

            // Mobila DOM-element
            const mobileNav = document.getElementById('mobileNav');
            const mobileAddJobBtn = document.getElementById('mobileAddJobBtn');
            const mobileSearchBtn = document.getElementById('mobileSearchBtn');
            const mobileSearchModal = document.getElementById('mobileSearchModal');
            const mobileSearchForm = document.getElementById('mobileSearchForm'); 
            const mobileSearchBar = document.getElementById('mobileSearchBar');
            const mobileSearchCloseBtn = document.getElementById('mobileSearchCloseBtn');

            const desktopSearchClear = document.getElementById('desktopSearchClear');
            const mobileSearchClear = document.getElementById('mobileSearchClear');

			// --- NYTT: Kanban-element ---
			const kanbanView = document.getElementById('kanbanView');
			const kanbanColOffererad = document.getElementById('kanban-col-offererad');
			const kanbanColBokad = document.getElementById('kanban-col-bokad');
			const kanbanColKlar = document.getElementById('kanban-col-klar');

            // --- Toast-funktion med "Ångra" ---
            let toastTimer;
            function showToast(message, type = 'success', undoCallback = null) {
                clearTimeout(toastTimer);
                
                toast.innerHTML = ''; 
                
                const textSpan = document.createElement('span');
                textSpan.textContent = message;
                toast.appendChild(textSpan);

                toast.className = `toast show ${type}`;
                
                let duration = 3000;

                if (undoCallback) {
                    duration = 5000; 
                    const undoButton = document.createElement('button');
                    undoButton.className = 'button secondary'; 
                    undoButton.textContent = 'Ångra';
                    
                    undoButton.addEventListener('click', (e) => {
                        e.stopPropagation(); 
                        undoCallback(); 
                        toast.className = 'toast'; 
                        clearTimeout(toastTimer);
                    });
                    
                    toast.appendChild(undoButton);
                }

                toastTimer = setTimeout(() => { 
                    toast.className = 'toast'; 
                }, duration);
            }
            
            // --- Kalender-funktioner ---
            function initializeCalendar() {
                calendar = new FullCalendar.Calendar(calendarContainer, {
                    initialView: 'dayGridTwoWeek', 
                    locale: 'sv',
                    firstDay: 1, 
                    height: 'auto', 
                    
                    headerToolbar: { 
                        left: 'prev,next today',
                        center: 'title',
                        right: 'dayGridTwoWeek,timeGridWeek,timeGridDay'
                    },
                    buttonText: {
                        today:         'Idag',
                        dayGridTwoWeek:'14 Dagar',
                        timeGridWeek:  'Vecka',
                        timeGridDay:   'Dag',
                        listWeek:      'Vecka' 
                    },
                    
                    views: {
                        dayGridTwoWeek: {
                            type: 'dayGrid',
                            duration: { weeks: 2 },
                            displayEventTime: true,
                            dayCellContent: function(arg) {
                                let dayNumberEl = document.createElement('a');
                                dayNumberEl.classList.add('fc-daygrid-day-number');
                                dayNumberEl.innerText = arg.dayNumberText;

                                let profitEl = document.createElement('div');
                                profitEl.classList.add('calendar-day-profit', 'money-related');
                                profitEl.setAttribute('data-date', arg.date.toISOString().split('T')[0]);

                                return { domNodes: [dayNumberEl, profitEl] };
                            }
                        },
                        timeGridWeek: {
                            displayEventTime: true
                        },
                        timeGridDay: {
                            displayEventTime: true
                        },
                        listWeek: {
                            type: 'list',
                            duration: { weeks: 1 },
                            listDayFormat: false, 
                            listDaySideFormat: false,
                            noEventsText: 'Inga jobb denna vecka'
                        }
                    },
                    
                    editable: true,
                    selectable: true,
                    slotMinTime: '07:00:00',
                    slotMaxTime: '21:00:00',
                    allDaySlot: false,
                    
                    eventClick: (clickInfo) => {
                        const jobId = clickInfo.event.id;
                        const job = findJob(jobId);
                        if (job) {
                            openJobSummaryModal(job);
                        }
                    },
                    
                    eventDrop: (dropInfo) => {
                        const jobId = dropInfo.event.id;
                        const newDate = dropInfo.event.start.toISOString();
                        handleJobDrop(jobId, newDate);
                    },
                    
                    select: (selectionInfo) => {
                        const startDate = selectionInfo.start;
                        const [datePart, timePart] = startDate.toISOString().split('T');
                        const time = timePart ? timePart.substring(0, 5) : '09:00';

                        openJobModal('add');
                        modalDatum.value = datePart;
                        modalTid.value = time;
                    },

					dayCellClassNames: function(arg) {
                        const dateKey = arg.date.toISOString().split('T')[0];
                        const isPast = dateKey < todayString; // todayString är en global variabel

                        // Om dagen är i dåtid, gör ingenting
                        if (isPast) {
                            return [];
                        }

                        // Kolla om det finns några "aktiva" jobb (bokade eller offererade)
                        const hasActiveJob = allJobs.some(j => 
                            j.datum.startsWith(dateKey) && 
                            (j.status === 'bokad' || j.status === 'offererad')
                        );

                        // Om det INTE finns några aktiva jobb, returnera vår nya klass
                        if (!hasActiveJob) {
                            return ['fc-day-free'];
                        }

                        return [];
                    },
                    
                    eventContent: function(arg) {
                        const job = arg.event.extendedProps.originalJob; 
                        
                        if (!job) {
                            return { html: `<div>${arg.event.title}</div>` };
                        }
                        
                        if (job.status === 'avbokad') {
                            return { html: '' }; 
                        }

                        if (arg.view.type === 'listWeek') {
                            const prioIcon = job.prio ? `<span class="fc-event-prio-flag">🚩</span>` : '';
                            const timePart = job.datum ? formatDate(job.datum).split('kl. ')[1] || '' : '';
                            return { 
                                html: `
                                <div class="mobile-calendar-card ${job.prio ? 'prio-row' : ''}">
                                    <span class="card-time-badge">${timePart}</span>
                                    <div class="card-job-details">
                                        <span class="card-job-customer">${prioIcon}${job.kundnamn}</span>
                                        <span class="card-job-regnr">${job.regnr || 'Okänt reg.nr'}</span>
                                    </div>
                                    <span class="status-badge status-${job.status}">${STATUS_TEXT[job.status]}</span>
                                </div>
                                `
                            };
                        }

                        const isMobile = window.innerWidth <= 768;

                        if (isMobile) {
                            const prioClass = job.prio ? 'prio-dot' : '';
                            let contentHtml = `
                                <span class="calendar-job-dot ${prioClass}" title="${job.kundnamn} (${job.regnr || '---'})"></span>
                            `;
                            return { html: contentHtml };

                        } else {
                            const prioIcon = job.prio ? `<span class="fc-event-prio-flag">🚩</span>` : '';
                            let contentHtml = '';
                            
                            if (job.regnr && job.regnr.toUpperCase() !== 'OKÄNT') {
                                contentHtml = `
                                    <div class="reg-plate-small">
                                        <span class="reg-country-small">S</span>
                                        <span class="reg-number-small">${job.regnr}</span>
                                    </div>
                                `;
                            } else {
                                contentHtml = `
                                    <div class="user-plate-small">
                                        <span class="user-icon-small">
                                            <svg class="icon" viewBox="0 0 24 24"><use href="#icon-user"></use></svg>
                                        </span>
                                        <span class="user-name-small">${prioIcon}${job.kundnamn}</span>
                                    </div>
                                `;
                            }
                            
                            return { html: contentHtml };
                        }
                    },
                });
                calendar.render();
            }

            function filterCalendarView() {
                if (!calendar) return;

                const now = new Date();
                now.setHours(0, 0, 0, 0);

                calendar.getEvents().forEach(event => {
                    const job = event.extendedProps.originalJob;
                    if (!job) return;

                    let isVisible = false;
                    switch(currentStatusFilter) {
                        case 'kommande':
                            isVisible = job.status === 'bokad' && new Date(job.datum) >= now;
                            break;
                        case 'klar':
                            isVisible = job.status === 'klar';
                            break;
                        case 'offererad':
                            isVisible = job.status === 'offererad';
                            break;
                        case 'alla':
                            isVisible = true;
                            break;
                    }
                    
                    const classNames = event.classNames.filter(c => c !== 'event-dimmed');
                    if (!isVisible) {
                        classNames.push('event-dimmed');
                    }
                    event.setProp('classNames', classNames);
                });
            }

            // FIXAD: Logik för Dagens Vinst
            function updateDailyProfitInCalendar(jobs) {
                if (currentView !== 'calendar' || !calendar) return;

                const dailyProfits = {};
                
                // Hämta den månad som kalendern visar
                const calendarDate = calendar.getDate();
                const currentMonth = calendarDate.getMonth();
                const currentYear = calendarDate.getFullYear();

                // 1. Summera vinst per dag för "Klar"-jobb
                jobs.filter(j => j.status === 'klar' && j.vinst > 0).forEach(job => {
                    const dateKey = job.datum.split('T')[0];
                    if (!dailyProfits[dateKey]) {
                        dailyProfits[dateKey] = 0;
                    }
                    dailyProfits[dateKey] += job.vinst;
                });

                const profitElements = calendarContainer.querySelectorAll('.calendar-day-profit');
                
                profitElements.forEach(el => {
                    const date = el.dataset.date;
                    const elDate = new Date(date + 'T12:00:00'); // Sätt tid för att undvika tidszonsfel

                    // FIX: Visa bara vinst för dagar i denna månad
                    if (dailyProfits[date] && elDate.getMonth() === currentMonth && elDate.getFullYear() === currentYear) {
                        el.textContent = `+${formatCurrency(dailyProfits[date])}`;
                        el.style.display = ''; 
                    } else {
                        el.textContent = '';
                        el.style.display = 'none'; 
                    }
                });
            }


            function mapJobToEvent(job) {
                return {
                    id: job.id,
                    title: `${job.kundnamn} (${job.regnr || '---'})`,
                    start: job.datum,
                    className: `status-${job.status}`, 
                    extendedProps: {
                        status: job.status,
                        prio: job.prio,
                        originalJob: job 
                    }
                };
            }
            
            async function handleJobDrop(jobId, newDateTime) {
                try {
                    await db.collection("jobs").doc(jobId).update({
                        datum: newDateTime
                    });
                    showToast('Jobb ombokat!');
                } catch (err) {
                    showToast(`Kunde inte flytta jobbet: ${err.message}`, 'danger');
                    console.error(err);
                }
            }
            
            // --- UPPDATERAD: toggleView med Kanban ---
			function toggleView(view) {
			    // NYTT: Om vi redan är på denna vy OCH vi inte navigerar (via bakåtknapp), gör inget.
			    if (view === currentView && !isNavigatingBack) return;
			
			    currentView = view;
			
			    // 1. Hantera knappar (Desktop & Mobil)
			    btnToggleTimeline.classList.toggle('active', view === 'timeline');
			    btnToggleCalendar.classList.toggle('active', view === 'calendar');
			    // NYTT: Lägg till din nya knapp-ID här (om du döpte den till btnToggleKanban)
			    document.getElementById('btnToggleKanban')?.classList.toggle('active', view === 'kanban');
			
			    document.querySelector('.mobile-nav-btn[data-view="timeline"]').classList.toggle('active', view === 'timeline');
			    document.querySelector('.mobile-nav-btn[data-view="calendar"]').classList.toggle('active', view === 'calendar');
			    // NYTT: Lägg till mobilknappen
			    document.querySelector('.mobile-nav-btn[data-view="kanban"]').classList.toggle('active', view === 'kanban');
			
			    // 2. Dölj alla vyer först
			    timelineView.style.display = 'none';
			    calendarView.style.display = 'none';
			    kanbanView.style.display = 'none'; // NYTT
			
			    // 3. Visa den valda vyn
			    if (view === 'calendar') {
			        calendarView.style.display = 'block';
			        calendar.changeView('dayGridTwoWeek'); 
			
			        const isMobile = window.innerWidth <= 768;
			        if (isMobile) {
			            // ... (din befintliga mobil-kalender-logik) ...
			        } else {
			            // ... (din befintliga desktop-kalender-logik) ...
			        }
			
			        setTimeout(() => {
			            calendar.updateSize();
			            const calendarEvents = allJobs.map(mapJobToEvent);
			            calendar.setOption('events', calendarEvents);
			
			            filterCalendarView();
			            updateDailyProfitInCalendar(allJobs);
			
			        }, 50);
			
			        if (!isNavigatingBack) {
			            if (history.state?.view === 'calendar') {
			                history.replaceState({ view: 'calendar' }, 'Kalender', '#calendar');
			            } else {
			                history.pushState({ view: 'calendar' }, 'Kalender', '#calendar');
			            }
			        }
			
			    } else if (view === 'kanban') { // --- NYTT BLOCK ---
			
			        kanbanView.style.display = 'block';
			        appBrandTitle.style.display = 'block'; 
			
			        // Rendera tavlan med korten
			        renderKanbanBoard(); 
			
			        if (!isNavigatingBack) {
			            // Skapa en ny historik-post för kanban
			            if (history.state?.view === 'kanban') {
			                history.replaceState({ view: 'kanban' }, 'Tavla', '#kanban');
			            } else {
			                history.pushState({ view: 'kanban' }, 'Tavla', '#kanban');
			            }
			        }
			        // --- SLUT NYTT BLOCK ---
			
			    } else { // (view === 'timeline')
			        timelineView.style.display = 'block';
			        appBrandTitle.style.display = 'block'; 
			
			        if (!isNavigatingBack) {
			            if (history.state && (history.state.view === 'calendar' || history.state.view === 'kanban')) {
			                history.back();
			            } else {
			                history.replaceState(null, 'Tidslinje', location.pathname);
			            }
			        }
			    }
			}

			// --- SLUTGILTIG VERSION: renderKanbanBoard ---
			function renderKanbanBoard() {
			    // Rensa kolumnerna
			    kanbanColOffererad.innerHTML = '';
			    kanbanColBokad.innerHTML = '';
			    kanbanColKlar.innerHTML = '';
			
			    // --- 1. Hantera "Klar"-kolumnen ---
			    const klarJobs = allJobs
			        .filter(j => j.status === 'klar')
			        .sort((a, b) => new Date(b.datum) - new Date(a.datum)); // Nyast först
			    
			    // Ta bara de 5 senaste
			    const klarJobsToShow = klarJobs.slice(0, 5);
			    
			    klarJobsToShow.forEach(job => {
			        kanbanColKlar.innerHTML += createKanbanCard(job); 
			    });
			    // UPPDATERA ANTAL (NYTT)
			    document.querySelector('.kanban-column[data-status="klar"] .kanban-column-count').textContent = klarJobs.length;
			
			
			    // --- 2. Hantera övriga kolumner ---
			    const otherJobs = allJobs
			        .filter(j => j.status !== 'avbokad' && j.status !== 'klar')
			        .sort((a, b) => {
			            const prioA = (a.prio && a.status !== 'klar');
			            const prioB = (b.prio && b.status !== 'klar');
			            if (prioA && !prioB) return -1;
			            if (!prioA && prioB) return 1;
			            return new Date(a.datum) - new Date(b.datum);
			        });
			
			    let offereradCount = 0;
			    let bokadCount = 0;
			
			    otherJobs.forEach(job => {
			        const cardHTML = createKanbanCard(job);
			        
			        switch (job.status) {
			            case 'offererad':
			                kanbanColOffererad.innerHTML += cardHTML;
			                offereradCount++;
			                break;
			            case 'bokad':
			                kanbanColBokad.innerHTML += cardHTML;
			                bokadCount++;
			                break;
			        }
			    });
			    // UPPDATERA ANTAL (NYTT)
			    document.querySelector('.kanban-column[data-status="offererad"] .kanban-column-count').textContent = offereradCount;
			    document.querySelector('.kanban-column[data-status="bokad"] .kanban-column-count').textContent = bokadCount;
			
			
			    // --- 3. Initiera SortableJS (UPPDATERAD) ---
			    if (!sortableColBokad) {
			        const options = {
			            group: 'shared',
			            animation: 150,
			            onEnd: handleKanbanDrop, // Din befintliga drop-funktion
			            
			            // --- DEN VIKTIGA ÄNDRINGEN FÖR MOBILEN ---
			            handle: '.kanban-drag-handle', // Säger åt SortableJS att endast denna klass kan starta ett drag
			            
			            // --- BONUS: Snyggare CSS-klasser ---
			            ghostClass: 'kanban-card-ghost',   // CSS-klass för "skuggan" där kortet kan landa
			            chosenClass: 'kanban-card-chosen'  // CSS-klass för kortet du lyfter
			        };
			        sortableColOffererad = new Sortable(kanbanColOffererad, options);
			        sortableColBokad = new Sortable(kanbanColBokad, options);
			        sortableColKlar = new Sortable(kanbanColKlar, options);
			    }
			}
		
		    // --- NY FUNKTION: Hanterar dra-och-släpp-händelsen ---
		    async function handleKanbanDrop(evt) {
		        const jobCard = evt.item; // Det flyttade HTML-elementet
		        const jobId = jobCard.dataset.id;
		        
		        // Hitta den nya kolumnen och dess status
		        const newColumn = evt.to.closest('.kanban-column');
		        const newStatus = newColumn.dataset.status;
		
		        // Hämta originaljobbet (från din befintliga funktion)
		        const job = findJob(jobId); //
		        if (!job) return; // Säkerhetskoll
		
		        const originalStatus = job.status;
		
		        // Om statusen faktiskt har ändrats
		        if (originalStatus !== newStatus) {
		            try {
		                // 1. Uppdatera Firebase
		                await db.collection("jobs").doc(jobId).update({
		                    status: newStatus
		                });
		
		                // 2. Uppdatera lokala data-arrayen (VIKTIGT!)
		                job.status = newStatus;
		
		                // 3. Visa din befintliga Ångra-toast
		                if (newStatus === 'klar') {
		                    showToast('Jobb markerat som "Klar"', 'success', () => {
		                        // ÅNGRA-LOGIK:
		                        db.collection("jobs").doc(jobId).update({ status: originalStatus });
		                        job.status = originalStatus; // Återställ lokalt
		                        renderKanbanBoard(); // Rita om tavlan
		                        showToast('Status återställd.', 'info');
		                    });
		                } else {
		                    const statusText = STATUS_TEXT[newStatus] || newStatus; //
		                    showToast(`Status ändrad till "${statusText}".`);
		                }
		                
		                // 4. Rita om tavlan för att få rätt sortering (t.ex. prio tas bort från "Klar"-kolumnen)
		                renderKanbanBoard();
		
		            } catch (err) {
		                showToast(`Fel: ${err.message}`, 'danger');
		                // Om Firebase misslyckas, flytta tillbaka kortet visuellt
		                evt.from.appendChild(jobCard); 
		            }
		        }
		    }

            // --- Firebase Listener ---
            function initRealtimeListener() {
                if (!db) return;

                if (allJobs.length === 0) {
                    showSkeletonLoader();
                }
                
                db.collection("jobs").onSnapshot(snapshot => {
                    allJobs = [];
                    snapshot.forEach(doc => {
                        allJobs.push({ id: doc.id, ...doc.data() });
                    });
                    
                    updateUI();
                    
                }, error => {
                    console.error("Fel vid hämtning av jobb: ", error);
                    alert("Kunde inte ansluta till databasen.");
                });
            }

            function showSkeletonLoader() {
                let skeletonHTML = '';
                const isMobile = window.innerWidth <= 768;
                
                if (isMobile) {
                    for (let i = 0; i < 5; i++) {
                        skeletonHTML += `
                        <div class="skeleton-card">
                            <div class="skeleton-pulse line-1"></div>
                            <div class="skeleton-pulse line-2"></div>
                            <div class="skeleton-pulse line-3"></div>
                        </div>
                        `;
                    }
                    jobListContainer.innerHTML = `<div id="mobileJobList">${skeletonHTML}</div>`;
                } else {
                    // Desktop skelett-laddare (Bonus)
                    for (let i = 0; i < 5; i++) {
                        skeletonHTML += `
                        <div class="skeleton-table-row">
                            <div class="skeleton-pulse sk-item sk-item-1"></div>
                            <div class="skeleton-pulse sk-item sk-item-2"></div>
                            <div class="skeleton-pulse sk-item sk-item-3"></div>
                            <div class="skeleton-pulse sk-item sk-item-4"></div>
                            <div class="skeleton-pulse sk-item sk-item-5"></div>
                            <div class="skeleton-pulse sk-item sk-item-6"></div>
                        </div>
                        `;
                    }
                    jobListContainer.innerHTML = `<div class="table-container">${skeletonHTML}</div>`;
                }
                jobListContainer.style.display = 'block';
                emptyStateTimeline.style.display = 'none';
            }


            // --- Huvud-renderingsfunktioner ---
			function updateUI() {
			    if (!appInitialized) return;
			
			    // 1. Globala uppdateringar
			    renderGlobalStats(allJobs);
			    const calendarEvents = allJobs.map(mapJobToEvent);
			
			    // 2. Uppdatera Kalendern (alltid, den körs i bakgrunden)
			    if (calendar) { 
			        calendar.setOption('events', calendarEvents);
			        filterCalendarView();
			        updateDailyProfitInCalendar(allJobs);
			        calendar.render();
			    }
			
			    // 3. Uppdatera den VY SOM ÄR AKTIV
			    if (currentView === 'timeline') {
			        renderTimeline(); 
			    } else if (currentView === 'kanban') {
			        renderKanbanBoard(); // NYTT
			    }
			
			    // 4. Se till att rätt vy-container visas
			    if (currentView === 'calendar') {
			        timelineView.style.display = 'none';
			        kanbanView.style.display = 'none'; // NYTT
			        calendarView.style.display = 'block';
			    } else if (currentView === 'kanban') { // NYTT
			        timelineView.style.display = 'none';
			        calendarView.style.display = 'none';
			        kanbanView.style.display = 'block';
			    } else { // Timeline
			        calendarView.style.display = 'none';
			        kanbanView.style.display = 'none'; // NYTT
			        timelineView.style.display = 'block';
			    }
			}

            function renderGlobalStats(jobs) {
                const now = new Date();
                now.setHours(0, 0, 0, 0);

                const upcomingJobs = jobs.filter(j => j.status === 'bokad' && new Date(j.datum) >= now).length;
                const finishedJobs = jobs.filter(j => j.status === 'klar').length;
                const offeredJobs = jobs.filter(j => j.status === 'offererad').length;
                const allJobCount = jobs.length;
                
                statUpcoming.textContent = upcomingJobs;
                statFinished.textContent = finishedJobs;
                statOffered.textContent = offeredJobs;
                statAll.textContent = allJobCount;
                
                // NYTT: Dagens Vinst i Header
                const todaysProfit = jobs
                    .filter(j => j.status === 'klar' && j.datum && j.datum.startsWith(todayString))
                    .reduce((sum, j) => sum + (j.vinst || 0), 0);

                document.querySelectorAll('.stat-card.active').forEach(c => c.classList.remove('active'));
                const activeCard = document.getElementById(`stat-card-${currentStatusFilter}`);
                if (activeCard) activeCard.classList.add('active');
            }

            // --- UPPDATERAD: renderTimeline med Animationslogik ---
            function renderTimeline() {
                const desktopSearchCount = document.getElementById('desktopSearchCount');
                let jobsToDisplay = [...allJobs];
                
                const now = new Date();
                now.setHours(0, 0, 0, 0);
                
                let sortOrder = 'asc'; 
                
                // --- BÖRJAN PÅ FILTERLOGIK ---
                switch(currentStatusFilter) {
                    case 'kommande':
                        jobsToDisplay = jobsToDisplay.filter(j => 
                            j.status === 'bokad' && new Date(j.datum) >= now
                        );
                        break;
                    case 'klar':
                        jobsToDisplay = jobsToDisplay.filter(j => j.status === 'klar');
                        sortOrder = 'desc'; 
                        break;
                    case 'offererad':
                        jobsToDisplay = jobsToDisplay.filter(j => j.status === 'offererad');
                        break;
                    case 'alla':
                        // 'alla' betyder inget filter, bara ändra sortering
                        sortOrder = 'desc'; 
                        break;
                }
                
                if (currentSearchTerm) {
                    clearDayFilterBtn.style.display = 'inline-flex';
                    jobsToDisplay = jobsToDisplay.filter(job => {
                        const term = currentSearchTerm.toLowerCase();
                        
                        // --- KORREKT SÖK-LOGIK ---
                        // Normalisera söktermen (ta bort alla mellanslag)
                        const normalizedTerm = term.replace(/\s/g, '');
                        
                        // Normalisera telefonnumret för sökning
                        const normalizedPhone = (job.telefon || '').replace(/\D/g, '');
                        
                        const regMatch = (job.regnr && job.regnr.toLowerCase().replace(/\s/g, '').includes(normalizedTerm));
                        // --- SLUT KORREKT SÖK-LOGIK ---
                        
                        return (
                            (job.kundnamn && job.kundnamn.toLowerCase().includes(term)) || 
                            regMatch || // Använd den nya, korrekta matchningen
                            (job.kommentarer && job.kommentarer.toLowerCase().includes(term)) ||
                            (normalizedPhone && normalizedPhone.includes(normalizedTerm)) || // Sök på normaliserat tel.nr
                            (STATUS_TEXT[job.status] || '').toLowerCase().includes(term)
                        );
                    });
                    
                    if (desktopSearchCount) {
			            desktopSearchCount.textContent = `${jobsToDisplay.length} träff(ar)`;
			        }
                } else {
                    clearDayFilterBtn.style.display = 'none';
                    if (window.innerWidth <= 768) {
                        renderGlobalStats(allJobs); 
                    }
                    // FIX: Se till att räknaren rensas
                    if (desktopSearchCount) {
                        desktopSearchCount.textContent = '';
                    }
                }
                // --- SLUT PÅ FILTERLOGIK ---

                jobsToDisplay.sort((a, b) => {
                    const dateA = new Date(a.datum);
                    const dateB = new Date(b.datum);
                    if (sortOrder === 'desc') {
                        return dateB - dateA; 
                    } else {
                        return dateA - dateB; 
                    }
                });

                // Flytta definitionen av renderNewContent hit upp
                function renderNewContent() {
                    let timelineCount = 0;
                    const isMobile = window.innerWidth <= 768;
                    
                    if (isMobile) {
                        timelineCount = renderMobileCardList(jobsToDisplay);
                    } else {
                        timelineCount = renderTimelineTable(jobsToDisplay);
                    }
                    
                    if (timelineCount === 0) {
                        jobListContainer.style.display = 'none';
                        emptyStateTimeline.style.display = 'block';
                        
                        if (currentSearchTerm) {
                            emptyStateTitleTimeline.textContent = "Inga träffar";
                            emptyStateTextTimeline.textContent = `Din sökning på "${currentSearchTerm}" gav inga resultat.`;
                        } else if (allJobs.length > 0) {
                            const filterText = document.querySelector(`.stat-card[data-filter="${currentStatusFilter}"] h3`).textContent;
                            emptyStateTitleTimeline.textContent = `Inga ${filterText.toLowerCase()}`;
                            emptyStateTextTimeline.textContent = "Det finns inga jobb som matchar detta filter.";
                        } else {
                            emptyStateTitleTimeline.textContent = "Du har inga jobb";
                            emptyStateTextTimeline.textContent = "Klicka på '+' för att börja.";
                        }
                    } else {
                        jobListContainer.style.display = 'block';
                        emptyStateTimeline.style.display = 'none';
                    }
                }

                // TA BORT ALL LOGIK FÖR FADE-OUT OCH SETTIMEOUT
                // Anropa renderNewContent direkt
                renderNewContent();
            }

            function renderTimelineTable(jobs) {
                jobListContainer.innerHTML = '';
                if (jobs.length === 0) { return 0; }

                let tableHTML = `
                    <div class="table-wrapper">
                        <table id="jobbOversikt">
                            ${createTableHead()}
                            <tbody>
                                ${jobs.map(job => createJobRow(job)).join('')}
                            </tbody>
                        </table>
                    </div>
                `;
                jobListContainer.innerHTML = tableHTML;
                return jobs.length;
            }

            function createTableHead() {
                return `
                    <thead>
                        <tr>
                            <th>Status</th>
                            <th>Datum</th>
                            <th>Kund</th>
                            <th>Reg.nr</th>
                            <th>Kundpris</th>
                            <th class="action-col">Åtgärder</th>
                        </tr>
                    </thead>
                `;
            }

            // --- UPPDATERAD: createJobRow med Kontextuell Ikon ---
            function createJobRow(job) {
                let prioClass = job.prio ? 'prio-row' : '';
                const doneClass = (job.status === 'klar') ? 'done-row' : '';

                const isKommandePrio = job.prio && job.status === 'bokad' && new Date(job.datum) >= new Date();
                if(isKommandePrio) {
                    prioClass += ' kommande-prio-pulse';
                }

                // --- NY LOGIK FÖR "MISSAT JOBB" ---
                let jobStatusClass = '';
                if (job.status === 'bokad' && new Date(job.datum) < now) {
                    jobStatusClass = 'job-missed';
                }
                // --- SLUT NY LOGIK ---

                const prioIcon = job.prio ? `<svg class="icon-sm prio-flag-icon" viewBox="0 0 24 24"><use href="#icon-flag"></use></svg>` : '';
                const hasComment = job.kommentarer && job.kommentarer.trim().length > 0;
                const kundnamnHTML = highlightSearchTerm(job.kundnamn, currentSearchTerm);
                const regnrHTML = highlightSearchTerm(job.regnr || '---', currentSearchTerm);
                const contextIcon = getJobContextIcon(job);

                return `
                    <tr data-id="${job.id}" data-status="${job.status}" class="job-entry ${prioClass} ${doneClass} ${jobStatusClass}">
                        <td data-label="Status"><span class="status-badge status-${job.status || 'bokad'}">${STATUS_TEXT[job.status] || 'Bokad'}</span></td>
                        <td data-label="Datum">${formatDate(job.datum)}</td>
                        <td data-label="Kund">
	                        <button class="link-btn customer-link" data-kund="${job.kundnamn}">
	                            <svg class="icon-sm customer-icon" viewBox="0 0 24 24"><use href="#icon-user"></use></svg>
	                            <span class="customer-name-text">${kundnamnHTML}</span>
	                        </button> ${contextIcon}
	                    </td>
                        <td data-label="Reg.nr">
                            ${(job.regnr && job.regnr.toUpperCase() !== 'OKÄNT') ? `
	                        <button class="car-link reg-plate" data-regnr="${job.regnr}">
	                            <span class="reg-country">S</span>
	                            <span class="reg-number">${regnrHTML}</span>
	                        </button>
                            ` : '---'}
                    	</td>
                        <td data-label="Kundpris" class="money-related">${formatCurrency(job.kundpris)}</td>
                        <td class="action-col">
                            ${hasComment ? `
                            <button class="icon-btn" data-action="showComment" data-comment="${encodeURIComponent(job.kommentarer)}" title="Visa kommentar" aria-label="Visa kommentar">
                                <svg class="icon-sm" viewBox="0 0 24 24"><use href="#icon-chat"></use></svg>
                            </button>
                            ` : `<span class="icon-btn-placeholder"></span>`}

                            <button class="icon-btn ${job.prio ? 'active-prio' : ''}" data-action="togglePrio" title="Växla Prio" aria-label="Växla Prio">
                            	<svg class="icon-sm" viewBox="0 0 24 24"><use href="#icon-flag"></use></svg>
                        	</button>
                            <button class="icon-btn" data-action="setStatusKlar" title="Markera som Klar" aria-label="Markera som Klar">
                                <svg class="icon-sm" viewBox="0 0 24 24"><use href="#icon-check"></use></svg>
                            </button>

                            <button class="icon-btn delete-btn" data-id="${job.id}" title="Ta bort" aria-label="Ta bort jobb">
                                <svg class="icon-sm" viewBox="0 0 24 24"><use href="#icon-trash"></use></svg>
                            </button>
                        </td>
                    </tr>
                `;
            }
            
            function renderMobileCardList(jobs) {
                jobListContainer.innerHTML = '';
                if (jobs.length === 0) { return 0; }
                
                const groupedJobs = jobs.reduce((acc, job) => {
                    const dateKey = job.datum ? job.datum.split('T')[0] : 'Okänt';
                    if (!acc[dateKey]) {
                        acc[dateKey] = [];
                    }
                    acc[dateKey].push(job);
                    return acc;
                }, {});
                
                let listHTML = '<div id="mobileJobList">';
                
                const sortOrder = (currentStatusFilter === 'klar' || currentStatusFilter === 'alla') ? 'desc' : 'asc';
                const sortedDateKeys = Object.keys(groupedJobs).sort((a, b) => {
                     if (sortOrder === 'desc') {
                        return new Date(b) - new Date(a);
                    } else {
                        return new Date(a) - new Date(b);
                    }
                });
                
                for (const dateKey of sortedDateKeys) {
                    const jobsForDay = groupedJobs[dateKey];
                    const firstJobDate = jobsForDay[0].datum;
                    
                    listHTML += `<div class="mobile-day-group">`;
                    listHTML += `<h2 class="mobile-date-header">${formatDate(firstJobDate, { onlyDate: true })}</h2>`;
                    listHTML += jobsForDay.map(job => createJobCard(job)).join('');
                    listHTML += `</div>`;
                }
                
                listHTML += '</div>';
                jobListContainer.innerHTML = listHTML;
                return jobs.length;
            }
            
            // --- UPPDATERAD: createJobCard med Kontextuell Ikon ---
            function createJobCard(job) {
                let prioClass = job.prio ? 'prio-row' : '';
                const doneClass = (job.status === 'klar') ? 'done-row' : '';

                const isKommandePrio = job.prio && job.status === 'bokad' && new Date(job.datum) >= new Date();
                if(isKommandePrio) {
                    prioClass += ' kommande-prio-pulse';
                }

                // --- NY LOGIK FÖR "MISSAT JOBB" ---
                let jobStatusClass = '';
                if (job.status === 'bokad' && new Date(job.datum) < now) {
                    jobStatusClass = 'job-missed';
                }
                // --- SLUT NY LOGIK ---

                const hasComment = job.kommentarer && job.kommentarer.trim().length > 0;

                const kundnamnHTML = highlightSearchTerm(job.kundnamn, currentSearchTerm);
                const regnrHTML = highlightSearchTerm(job.regnr || 'OKÄNT', currentSearchTerm);
                const contextIcon = getJobContextIcon(job);

                const timePart = job.datum ? (formatDate(job.datum).split('kl. ')[1] || 'Okänd tid') : 'Okänd tid';

                return `
                    <div class="mobile-job-card job-entry ${prioClass} ${doneClass} ${jobStatusClass}" data-id="${job.id}" data-status="${job.status}">
                        <div class="card-content">
						    <div class="card-row">
						        <span class="card-label">Kund</span>
                                <span class="card-value customer-name">
                                    <div class="customer-name-wrapper">
                                        ${contextIcon}
                                        <button class="link-btn customer-link" data-kund="${job.kundnamn}">
                                            <svg class="icon-sm customer-icon" viewBox="0 0 24 24"><use href="#icon-user"></use></svg>
                                            <span class="customer-name-text">${kundnamnHTML}</span>
                                        </button>
                                    </div>
                                </span>
                            </div>
                            <div class="card-row">
                                <span class="card-label">Reg.nr</span>
                                <span class="card-value">
                                    ${(job.regnr && job.regnr.toUpperCase() !== 'OKÄNT') ? `
                                    <button class="car-link reg-plate" data-regnr="${job.regnr}">
                                        <span class="reg-country">S</span>
                                        <span class="reg-number">${regnrHTML}</span>
                                    </button>
                                    ` : `
                                    <span class="reg-unknown">${regnrHTML}</span>
                                    `}
                                </span>
                            </div>
                            <div class="card-row">
                                <span class="card-label">Tid / Status</span>
                                <span class="card-value time-status-wrapper">
                                    <span class="card-time-badge">${timePart}</span>
                                    <span class="status-badge status-${job.status || 'bokad'}">${STATUS_TEXT[job.status] || 'Bokad'}</span>
                                </span>
                            </div>
                            <div class="card-row money-related">
                                <span class="card-label">Kundpris</span>
                                <span class="card-value customer-price">${formatCurrency(job.kundpris)}</span>
                            </div>
                        </div>
                        <div class="action-col">
                            ${hasComment ? `
                            <button class="icon-btn" data-action="showComment" data-comment="${encodeURIComponent(job.kommentarer)}" aria-label="Visa kommentar">
                                <svg class="icon-sm" viewBox="0 0 24 24"><use href="#icon-chat"></use></svg>
                            </button>
                            ` : `<span class="icon-btn-placeholder"></span>`}

                            <button class="icon-btn" data-action="togglePrio" aria-label="Växla Prio">
                                <svg class="icon-sm" viewBox="0 0 24 24"><use href="#icon-flag"></use></svg>
                            </button>
                            <button class="icon-btn" data-action="setStatusKlar" aria-label="Markera som Klar">
                                <svg class="icon-sm" viewBox="0 0 24 24"><use href="#icon-check"></use></svg>
                            </button>

                            <button class="icon-btn delete-btn" data-id="${job.id}" aria-label="Ta bort jobb">
                                <svg class="icon-sm" viewBox="0 0 24 24"><use href="#icon-trash"></use></svg>
                            </button>
                        </div>
                    </div>
                `;
            }

			// --- UPPDATERAD: Skapar ett kompakt Kanban-kort MED DRA-HANDTAG ---
			function createKanbanCard(job) {
			    // (Befintlig logik för klasser...)
			    let prioClass = job.prio ? 'prio-row' : '';
			    const doneClass = (job.status === 'klar') ? 'done-row' : '';
			    const isKommandePrio = job.prio && job.status === 'bokad' && new Date(job.datum) >= new Date();
			    if(isKommandePrio) {
			        prioClass += ' kommande-prio-pulse';
			    }
			    const jobStatusClass = (job.status === 'bokad' && new Date(job.datum) < now) ? 'job-missed' : '';
			    const hasComment = job.kommentarer && job.kommentarer.trim().length > 0;
			    
			    const kundnamnHTML = highlightSearchTerm(job.kundnamn, currentSearchTerm);
			    const regnrHTML = highlightSearchTerm(job.regnr || 'OKÄNT', currentSearchTerm);
			    const prioIcon = job.prio ? `<svg class="icon-sm prio-flag-icon" viewBox="0 0 24 24"><use href="#icon-flag"></use></svg>` : '';
			    const timePart = job.datum ? (formatDate(job.datum).split('kl. ')[1] || 'Okänd tid') : 'Okänd tid';
			
			    // NY, UPPDATERAD HTML-STRUKTUR:
			    return `
			        <div class_name="kanban-card job-entry ${prioClass} ${doneClass} ${jobStatusClass}" data-id="${job.id}" data-status="${job.status}">
			            
			            <div class="kanban-drag-handle" title="Håll för att flytta">
			                <svg class="icon-sm" viewBox="0 0 16 16"><use href="#icon-drag-handle"></use></svg>
			            </div>
			
			            <div class="kanban-card-content"> <div class="kanban-card-header">
			                    <span class="kanban-card-title">${prioIcon} ${kundnamnHTML}</span>
			                    <span class="card-time-badge">${timePart}</span>
			                </div>
			                
			                ${(job.regnr && job.regnr.toUpperCase() !== 'OKÄNT') ? `
			                <button class="car-link reg-plate" data-regnr="${job.regnr}">
			                    <span class="reg-country">S</span>
			                    <span class="reg-number">${regnrHTML}</span>
			                </button>
			                ` : `
			                <span class="reg-unknown">${regnrHTML}</span>
			                `}
			                
			                <div class="kanban-card-footer">
			                    ${hasComment ? `
			                    <svg class="kanban-card-icon" viewBox="0 0 24 24" title="Har kommentar"><use href="#icon-chat"></use></svg>
			                    ` : '<span></span>'}
			                </div>
			            </div>
			        </div>
			    `;
			}

            // --- Popover, Modal-hantering (FIXAD HISTORIK) ---
            
            function closeModal(options = {}) {
                const { popHistory = true } = options; 

                if (!isModalOpen) return;
                
                const modalId = currentOpenModalId;
                const modalElement = document.getElementById(modalId);

				if (modalId === 'mobileSearchModal' && currentSearchTerm === "") { 
				    document.getElementById('statBar').style.display = 'grid';
				}
                if (modalElement) {
                    modalElement.classList.remove('show');
                    if (modalElement.id === 'jobModal') {
                        kundnamnSuggestions.style.display = 'none';
                        kundnamnSuggestions.innerHTML = '';
                    }
                    setTimeout(() => {
                        modalElement.style.display = 'none';
                    }, 200);
                }

                if (popHistory && !isNavigatingBack && history.state && history.state.modal === modalId) {
				    isNavigatingBack = true; // <-- 1. Sätt flaggan FÖRST
				    history.back();
				}
                
                isModalOpen = false;
                currentOpenModalId = null;
            }

			searchBar.addEventListener('input', () => {
			    if (desktopSearchWrapper) {
			        desktopSearchWrapper.classList.add('is-searching');
			    }
			});

            window.addEventListener('popstate', (event) => {
                clearTimeout(backPressTimer); 

				if (isNavigatingBack) {
			        isNavigatingBack = false; // Återställ flaggan
			        backPressWarned = false; // Se till att varningen rensas
			        return; // Gör ingenting mer, detta var avsiktligt
			    }
				
                const state = event.state; 

                if (isModalOpen) {
                    // FALL 1: En modal var öppen. (Användaren tryckte "Bakåt" i webbläsaren)
                    // Detta är den ENDA logiken vi vill köra.
                    
                    isNavigatingBack = true;
                    closeModal({ popHistory: false }); // Stäng modal-UI:t
                    isNavigatingBack = false;
                    
                    // Nollställ varningen, vi vill inte stänga appen
                    backPressWarned = false; 
					return;
                } else if (state && state.view === 'calendar') {
                    // FALL 2: Vi har navigerat TILL kalender-vyn
                    // (Antingen "Framåt" i webbläsaren, eller så har en modalstängning avslöjat detta state)
                    
                    // Om vi *inte* redan är på kalendern, byt UI.
                    if (currentView !== 'calendar') {
                        isNavigatingBack = true;
                        toggleView('calendar');
                        isNavigatingBack = false;
                    }
                    backPressWarned = false; // Nollställ alltid varningen här

                } else if (!state || !state.view) { 
                    // FALL 3: Vi är på tidslinjen (state är null)
                    
                    // Om vi *inte* redan är på tidslinjen, byt UI.
                    if (currentView !== 'timeline') {
                        isNavigatingBack = true;
                        toggleView('timeline');
                        isNavigatingBack = false;
                    }

                    // Hantera dubbeltryck för att stänga
                    if (backPressWarned) {
                        backPressWarned = false;
                    } else {
                        backPressWarned = true;
                        showToast('Tryck bakåt igen för att stänga', 'info');
                        history.pushState(null, 'Tidslinje', location.pathname); 
                        
                        backPressTimer = setTimeout(() => {
                            backPressWarned = false;
                        }, 2000); 
                    }
                }
            });

            function showModal(modalId, options = {}) {
				if (modalId === 'mobileSearchModal') {
				    document.getElementById('statBar').style.display = 'none';
				}
                if (isModalOpen) {
                    closeModal({ popHistory: false }); 
                }
                
                const modalElement = document.getElementById(modalId);
                if (!modalElement) {
                    console.error(`Modal med id "${modalId}" hittades inte.`);
                    return;
                }

                modalElement.style.display = 'flex';
                setTimeout(() => modalElement.classList.add('show'), 10);
                
                isModalOpen = true;
                currentOpenModalId = modalId;
                
                // PUNKT 7: Undvik att pusha historik för mobil sök-modal
                const { replaceHistory = false } = options; // <--- NY

                if (history.state?.modal !== modalId && modalId !== 'mobileSearchModal') {
                    try {
                        if (replaceHistory) {
                            // Ersätt nuvarande historik-post
                            history.replaceState({ modal: modalId }, `Modal ${modalId}`, `#${modalId}`); // <--- NY
                        } else {
                            // Lägg till en ny historik-post (standard)
                            history.pushState({ modal: modalId }, `Modal ${modalId}`, `#${modalId}`); // <--- NY
                        }
                    } catch (e) {
                        console.warn("Kunde inte använda history.pushState", e);
                    }
                }

                // Tabb-fälla (Bonus)
                const focusableElements = modalElement.querySelectorAll(
                    'a[href], button, input, textarea, select, [tabindex]:not([tabindex="-1"])'
                );
                const firstElement = focusableElements[0];
                const lastElement = focusableElements[focusableElements.length - 1];

                if (firstElement && modalId !== 'pinLockModal') {
                    setTimeout(() => firstElement.focus(), 50); 
                }

                modalElement.addEventListener('keydown', (e) => {
                    if (e.key !== 'Tab') return;

                    if (e.shiftKey) { 
                        if (document.activeElement === firstElement) {
                            lastElement.focus();
                            e.preventDefault();
                        }
                    } else { 
                        if (document.activeElement === lastElement) {
                            firstElement.focus();
                            e.preventDefault();
                        }
                    }
                });
            }


            function showCommentPopover(button) {
                const commentText = decodeURIComponent(button.dataset.comment);
                commentPopoverContent.textContent = commentText;
                const rect = button.getBoundingClientRect();
                
                commentPopover.style.display = 'block'; // Visa först för att mäta
                
                const popoverWidth = commentPopover.offsetWidth;
                const popoverHeight = commentPopover.offsetHeight;

                commentPopover.classList.remove('arrow-top', 'arrow-bottom');

                let popoverTop = rect.bottom + window.scrollY + 8; // 8px marginal
                let popoverLeft = rect.left + window.scrollX - (popoverWidth / 2) + (rect.width / 2);

                // Justera vänster/höger
                if (popoverLeft < 10) {
                    popoverLeft = 10;
                } else if (popoverLeft + popoverWidth > window.innerWidth - 10) {
                    popoverLeft = window.innerWidth - popoverWidth - 10;
                }
                
                // Justera topp/botten
                if (popoverTop + popoverHeight > window.innerHeight + window.scrollY - 10) {
                    // Visa ovanför
                    popoverTop = rect.top + window.scrollY - popoverHeight - 8; // 8px marginal
                    commentPopover.classList.add('arrow-bottom'); 
                } else {
                    // Visa nedanför
                    commentPopover.classList.add('arrow-top'); 
                }
                
                // PUNKT 5 (FIX): `popoverTop` var felaktigt, ska vara `popoverLeft`
                // Sätt pilens position
                const arrowOffset = rect.left + (rect.width / 2) - popoverLeft;
                commentPopover.style.setProperty('--arrow-left-offset', `${arrowOffset}px`);

                commentPopover.style.top = `${popoverTop}px`;
                commentPopover.style.left = `${popoverLeft}px`;
                
                popoverBackdrop.classList.add('show');
                commentPopover.classList.add('show');
            }
			
            function hideCommentPopover() {
                popoverBackdrop.classList.remove('show');
                commentPopover.classList.remove('show');
				commentPopover.classList.remove('arrow-top', 'arrow-bottom');
            }

			// --- NY FUNKTION: Renderar listan med utgifter i modalen ---
            function renderExpensesList() {
                expenseListContainer.innerHTML = ''; // Rensa listan
                
                if (currentExpenses.length === 0) {
                    expenseListContainer.innerHTML = `<span style="color: var(--text-color-light); font-style: italic; font-size: 0.9rem;">Inga utgifter tillagda.</span>`;
                    return;
                }

                currentExpenses.forEach((item, index) => {
                    const itemHtml = `
                        <div class="expense-item">
                            <span>
                                <span class="item-name">${item.name}</span>
                                <span class="item-cost">-${formatCurrency(item.cost)}</span>
                            </span>
                            <button type="button" class="delete-expense-btn" data-index="${index}" title="Ta bort utgift">
                                <svg class="icon-sm" viewBox="0 0 24 24"><use href="#icon-trash"></use></svg>
                            </button>
                        </div>
                    `;
                    expenseListContainer.innerHTML += itemHtml;
                });
            }

            // --- UPPDATERAD FUNKTION: Beräknar vinst & total utgift ---
            function updateLiveProfit() {
                const pris = parseFloat(modalKundpris.value) || 0;
                
                // Beräkna total utgift från arrayen
                const totalUtgifter = currentExpenses.reduce((sum, item) => sum + (item.cost || 0), 0);
                
                const vinst = pris - totalUtgifter;
                
                // Uppdatera UI med både vinst och totala utgifter
                modalVinstKalkyl.innerHTML = `
                    <span style="color: ${vinst < 0 ? 'var(--danger-color)' : (vinst > 0 ? 'var(--success-color)' : 'var(--text-color)')};">Vinst: ${formatCurrency(vinst)}</span>
                    <span style="font-size: 0.9rem; color: var(--text-color-light); margin-left: 1rem;">(Utgifter: ${formatCurrency(totalUtgifter)})</span>
                `;
            }
            
            // NYTT: Funktion för att synka quick-buttons med select
            function syncStatusUI(newStatus) {
                modalStatusSelect.value = newStatus;
                quickStatusButtons.querySelectorAll('.button').forEach(btn => {
                    btn.classList.toggle('active', btn.dataset.status === newStatus);
                });
            }

            quickStatusButtons.addEventListener('click', (e) => {
                const button = e.target.closest('.button[data-status]');
                if (button) {
                    syncStatusUI(button.dataset.status);
                }
            });

			// --- NY LISTENER: Gör utgiftsnamn till stora bokstäver ---
            expenseNameInput.addEventListener('input', (e) => {
                e.target.value = e.target.value.toUpperCase();
            });

			// --- NY LISTENER: Lägg till en utgift ---
            addExpenseBtn.addEventListener('click', () => {
                const name = expenseNameInput.value.trim();
                const cost = parseFloat(expenseCostInput.value) || 0;

                if (!name) {
                    showToast('Du måste ange ett namn för utgiften.', 'danger');
                    expenseNameInput.focus();
                    return;
                }
                if (cost <= 0) {
                    showToast('Kostnaden måste vara större än 0.', 'danger');
                    expenseCostInput.focus();
                    return;
                }

                // Lägg till i vår temporära array
                currentExpenses.push({ name: name, cost: cost });

                // Återställ formuläret
                expenseNameInput.value = '';
                expenseCostInput.value = '';
                expenseNameInput.focus(); // Gör det enkelt att lägga till nästa

                // Uppdatera UI
                renderExpensesList();
                updateLiveProfit();
            });

            // --- NY LISTENER: Ta bort en utgift (med event delegation) ---
            expenseListContainer.addEventListener('click', (e) => {
                const deleteButton = e.target.closest('.delete-expense-btn');
                if (deleteButton) {
                    const indexToRemove = parseInt(deleteButton.dataset.index, 10);
                    
                    // Ta bort från arrayen
                    currentExpenses.splice(indexToRemove, 1);

                    // Uppdatera UI
                    renderExpensesList();
                    updateLiveProfit();
                    showToast('Utgift borttagen', 'info');
                }
            });

			// --- NY FUNKTION: Öppnar Översikts-modalen ---
            function openJobSummaryModal(job) {
                if (!job) return;

                // Fyll i data
                modalSummaryKundnamn.textContent = job.kundnamn || '---';
                modalSummaryTelefon.textContent = job.telefon || '---';
                modalSummaryRegnr.textContent = job.regnr || '---';
                
                const statusText = STATUS_TEXT[job.status] || job.status;
                modalSummaryStatus.textContent = statusText;
                modalSummaryStatus.className = `summary-value status-badge status-${job.status}`; // Återanvänder din status-badge-stil

                modalSummaryDatum.textContent = formatDate(job.datum);
                modalSummaryMatarstallning.textContent = job.matarstallning ? `${job.matarstallning} km` : '---';

                modalSummaryKundpris.textContent = formatCurrency(job.kundpris);
                modalSummaryTotalUtgift.textContent = formatCurrency(job.utgifter);
                
                const vinst = job.vinst || (job.kundpris || 0) - (job.utgifter || 0);
                modalSummaryVinst.textContent = formatCurrency(vinst);
                modalSummaryVinst.className = vinst > 0 ? 'summary-value vinst' : 'summary-value';

                // Fyll i kommentarer
                if (job.kommentarer && job.kommentarer.trim().length > 0) {
                    modalSummaryKommentarer.textContent = job.kommentarer;
                    modalSummaryKommentarer.parentElement.style.display = 'flex';
                } else {
                    modalSummaryKommentarer.textContent = '';
                    modalSummaryKommentarer.parentElement.style.display = 'none';
                }

                // Fyll i utgiftslistan
                if (job.expenseItems && job.expenseItems.length > 0) {
                    modalSummaryExpenseList.innerHTML = '';
                    job.expenseItems.forEach(item => {
                        modalSummaryExpenseList.innerHTML += `
                            <li>
                                <span class="expense-name">${item.name}</span>
                                <span class="expense-cost">-${formatCurrency(item.cost)}</span>
                            </li>
                        `;
                    });
                    modalSummaryExpenseBox.style.display = 'flex';
                } else {
                    modalSummaryExpenseList.innerHTML = '';
                    modalSummaryExpenseBox.style.display = 'none';
                }

                // Spara jobb-ID på redigera-knappen
                modalSummaryEditBtn.dataset.jobId = job.id;

                showModal('jobSummaryModal');
            }

            function openJobModal(mode, dataToClone = null, options = {}) {
                jobModalForm.reset();
                currentExpenses = []; // Nollställ alltid utgifts-arrayen

                // NYTT: Återställ/dölj knapparna varje gång
                jobModalCallBtn.style.display = 'none';
                jobModalSmsBtn.style.display = 'none';
                
                if (mode === 'add') {
                    modalTitle.textContent = 'Lägg till nytt jobb';
                    modalSaveBtn.textContent = 'Spara'; 
                    modalJobId.value = '';
                    if (dataToClone) {
                        // Kloningslogik
                        syncStatusUI(dataToClone.status || 'bokad');
                        document.getElementById('prio').checked = dataToClone.prio || false;
                        modalDatum.value = dataToClone.datum ? dataToClone.datum.split('T')[0] : todayString; // Sätt till dagens datum om källan saknar
                        modalTid.value = dataToClone.datum ? new Date(dataToClone.datum).toTimeString().substring(0,5) : new Date().toTimeString().substring(0,5);
                        modalRegnr.value = dataToClone.regnr;
                        modalKundnamn.value = dataToClone.kundnamn.toUpperCase();
                        modalTelefon.value = dataToClone.telefon || '';
                        modalKundpris.value = dataToClone.kundpris;
                        
                        // --- NY UTGIFTS-LOGIK (för kloning) ---
                        if (dataToClone.expenseItems && Array.isArray(dataToClone.expenseItems)) {
                            currentExpenses = [...dataToClone.expenseItems]; // Kopiera den nya array-datan
                        } else if (dataToClone.utgifter > 0) {
                            // Hantera gamla jobb som bara har ett nummer
                            currentExpenses = [{ name: "Generell utgift", cost: dataToClone.utgifter || 0 }];
                        } else {
                            currentExpenses = [];
                        }
                        // --- SLUT NY LOGIK ---

                        document.getElementById('kommentarer').value = dataToClone.kommentarer;
						document.getElementById('matarstallning').value = dataToClone.matarstallning || '';
                    } else {
                        // Logik för ett helt nytt, tomt jobb
                        syncStatusUI('bokad');
                        document.getElementById('prio').checked = false;
                        const now = new Date();
                        modalDatum.value = todayString;
                        modalTid.value = now.toTimeString().substring(0,5);
                        currentExpenses = []; // Tom för ett helt nytt jobb
                    }
                } 
                else if (mode === 'edit' && dataToClone) {
                    // REDIGERINGS-LÄGE (Här var felet)
                    modalTitle.textContent = 'Redigera Jobb';
                    modalSaveBtn.textContent = 'Spara'; 
                    modalJobId.value = dataToClone.id;
                    syncStatusUI(dataToClone.status || 'bokad');
                    document.getElementById('prio').checked = dataToClone.prio || false;

                    // --- START: DEN SAKNADE KODEN SOM NU ÄR TILLBAKA ---
                    if (dataToClone.datum) {
                        const d = new Date(dataToClone.datum);
                        modalDatum.value = d.toISOString().split('T')[0];
                        modalTid.value = d.toTimeString().substring(0,5);
                    } else {
                        modalDatum.value = ''; modalTid.value = '';
                    }
                    modalRegnr.value = dataToClone.regnr;
                    modalKundnamn.value = dataToClone.kundnamn.toUpperCase();
                    modalTelefon.value = dataToClone.telefon || '';
                    // --- SLUT: DEN SAKNADE KODEN ---
                    
                    modalKundpris.value = dataToClone.kundpris;
                    
                    // --- NY UTGIFTS-LOGIK (för redigering) ---
                    if (dataToClone.expenseItems && Array.isArray(dataToClone.expenseItems)) {
                        currentExpenses = [...dataToClone.expenseItems]; // Läs in den sparade arrayen
                    } else if (dataToClone.utgifter > 0) {
                        // Bakåtkompatibilitet: Omvandla gammal data
                        currentExpenses = [{ name: "Generell utgift", cost: dataToClone.utgifter || 0 }];
                    } else {
                        currentExpenses = []; // Starta tom om gamla utgifter var 0
                    }
                    // --- SLUT NY LOGIK ---

                    document.getElementById('kommentarer').value = dataToClone.kommentarer;
					document.getElementById('matarstallning').value = dataToClone.matarstallning || '';
                }
                
                renderExpensesList(); // <-- Denna körs
                updateLiveProfit(); // <-- Denna körs
                
                // Trigga input-eventet för att visa/dölja knappar om ett nr finns
                modalTelefon.dispatchEvent(new Event('input')); 

                showModal('jobModal', options);
                modalKundnamn.focus();
            }
            
            function getJobDataFromForm() {
                const kundpris = parseFloat(modalKundpris.value) || 0;
                const utgifter = parseFloat(modalUtgifter.value) || 0;
                return {
                    id: modalJobId.value,
                    status: modalStatusSelect.value, // Läs från <select>
                    datum: modalDatum.value,
                    tid: modalTid.value,
                    regnr: modalRegnr.value.toUpperCase(),
                    kundnamn: document.getElementById('kundnamn').value.toUpperCase(),
                    telefon: modalTelefon.value, // NYTT FÄLT
                    kundpris: kundpris,
                    utgifter: utgifter,
                    vinst: kundpris - utgifter,
                    kommentarer: document.getElementById('kommentarer').value,
                    prio: document.getElementById('prio').checked,
					matarstallning: document.getElementById('matarstallning').value
                };
            }
            
            // BONUS: Om-renderar jobblistan i kund/bil-modal
            function renderDetailJobList(listElement, jobs, filterTerm) {
                const filteredJobs = jobs.filter(job => {
                    const term = filterTerm.toLowerCase();
                    return !term ||
                           formatDate(job.datum).toLowerCase().includes(term) ||
                           (job.regnr && job.regnr.toLowerCase().includes(term)) ||
                           job.kundnamn.toLowerCase().includes(term) ||
                           (job.kommentarer && job.kommentarer.toLowerCase().includes(term));
                });

                listElement.innerHTML = filteredJobs.map(job => {
                    const prioIcon = job.prio ? `<svg class="icon-sm prio-flag-icon" viewBox="0 0 24 24"><use href="#icon-flag"></use></svg>` : '';
                    return `<li data-job-id="${job.id}">
			            <div>
			                <span class="job-date">${prioIcon}${formatDate(job.datum)}</span>
			                <span class="job-subline">${job.regnr || job.kundnamn} (${STATUS_TEXT[job.status]})</span>
			                ${job.kommentarer ? `<p class="job-comment">${job.kommentarer}</p>` : ''}
			            </div>
			            <span class="job-profit profit ${job.vinst > 0 ? 'positive' : ''}">
			                ${isPrivacyModeEnabled ? '---' : formatCurrency(job.vinst)}
			            </span>
			        </li>`
                }).join('');
            }

            function openCustomerModal(kundnamn) {
                const customerJobs = allJobs.filter(j => j.kundnamn === kundnamn).sort((a, b) => new Date(b.datum) - new Date(a.datum));
                if (customerJobs.length === 0) return;
                
                // NY LOGIK: Hitta senaste telefonnummer
                const latestPhoneJob = customerJobs.find(j => j.telefon);
                const latestPhone = latestPhoneJob ? latestPhoneJob.telefon : null; // Hämta numret eller null

                const totalVinst = customerJobs.reduce((sum, j) => sum + (j.vinst || 0), 0);
                
                customerModalName.textContent = kundnamn;

                // NY LOGIK: Dölj/visa knappar baserat på om nummer finns
                if (latestPhone) {
                    // Finns ett nummer
                    customerModalPhone.textContent = latestPhone;
                    customerModalCallBtn.href = `tel:${latestPhone}`;
                    customerModalSmsBtn.href = `sms:${latestPhone}`;
                    customerModalCallBtn.style.display = 'inline-flex';
                    customerModalSmsBtn.style.display = 'inline-flex';
                } else {
                    // Finns inget nummer
                    customerModalPhone.textContent = 'Inget tel.nr sparat';
                    customerModalCallBtn.href = '#'; // Återställ
                    customerModalSmsBtn.href = '#'; // Återställ
                    customerModalCallBtn.style.display = 'none';
                    customerModalSmsBtn.style.display = 'none';
                }
                
                // Se till att redigera-knappen alltid syns
                editCustomerPhoneBtn.style.display = 'inline-flex';

                customerModalTotalProfit.textContent = isPrivacyModeEnabled ? "---" : formatCurrency(totalVinst);
                customerModalTotalProfit.className = totalVinst > 0 ? 'stat-value money-related positive' : 'stat-value money-related';
                customerModalJobCount.textContent = customerJobs.length;
                
                customerSearch.value = ''; 
                renderDetailJobList(customerModalJobList, customerJobs, ''); 
                showModal('customerModal'); 
            }
            
            // NY (PUNKT 6): Hanterare för redigeringsknappen
            editCustomerPhoneBtn.addEventListener('click', () => {
                const kundnamn = customerModalName.textContent;
                const customerJobs = allJobs
                    .filter(j => j.kundnamn === kundnamn)
                    .sort((a, b) => new Date(b.datum) - new Date(a.datum));
                
                if (customerJobs.length > 0) {
                    const latestJob = customerJobs[0]; // Ta det senaste jobbet
                    
                    if (history.state?.modal) {
                        isNavigatingBack = true;
                        history.back();
                        isNavigatingBack = false;
                    } else {
                        closeModal({ popHistory: false });
                    }
                    
                    setTimeout(() => {
                        openJobModal('edit', latestJob);
                        // Fokusera på telefonfältet
                        setTimeout(() => modalTelefon.focus(), 100); 
                    }, 50);
                }
            });


            function openCarModal(regnr) {
                if (!regnr) return;
                const carJobs = allJobs.filter(j => j.regnr === regnr).sort((a, b) => new Date(b.datum) - new Date(a.datum));
                if (carJobs.length === 0) return;

                const latestOwner = carJobs[0].kundnamn;
                const totalVinst = carJobs.reduce((sum, j) => sum + (j.vinst || 0), 0);
                
                const biluppgifterUrl = `https://biluppgifter.se/fordon/${regnr}#vehicle-data`;
                
                carModalRegnr.textContent = regnr;
                carModalExternalLink.href = biluppgifterUrl;
                carModalExternalLinkMobile.href = biluppgifterUrl; 
                carModalOwner.textContent = `Senaste ägare: ${latestOwner}`;
                carModalTotalProfit.textContent = isPrivacyModeEnabled ? "---" : formatCurrency(totalVinst);
                carModalTotalProfit.className = totalVinst > 0 ? 'stat-value money-related positive' : 'stat-value money-related';
                carModalJobCount.textContent = carJobs.length;

                carSearch.value = ''; 
                renderDetailJobList(carModalJobList, carJobs, ''); 
                showModal('carModal'); 
            }

			// --- NY HJÄLPFUNKTION FÖR TOPPLISTOR ---
			function calculateTopList(jobs, key) {
			    const stats = jobs.reduce((acc, job) => {
			        const groupName = job[key] ? job[key].toUpperCase() : 'OKÄND';
			        if (groupName === 'OKÄND' || groupName === '') return acc; // Ignorera tomma
			
			        if (!acc[groupName]) {
			            acc[groupName] = { name: groupName, vinst: 0 };
			        }
			        acc[groupName].vinst += (job.vinst || 0);
			        return acc;
			    }, {});
			
			    // Sortera listan och ta de 5 bästa
			    return Object.values(stats)
			        .sort((a, b) => b.vinst - a.vinst)
			        .slice(0, 5);
			}
			
			// --- NY HJÄLPFUNKTION FÖR ATT SKAPA HTML ---
			function generateTopListHTML(list, title, type) {
			    if (list.length === 0) {
			        return `<h3 class="top-list-title">${title}</h3><p>Ingen data att visa.</p>`;
			    }
			
			    let html = `<h3 class="top-list-title">${title}</h3>`;
			    html += '<ul class="top-list">';
			
			    list.forEach(item => {
			        const vinstClass = item.vinst > 0 ? '' : 'no-profit';
			        const dataType = (type === 'kund') ? 'data-kund' : 'data-regnr';

					html += `
					    <li>
					        <button class="link-btn item-name" ${dataType}="${item.name}">${item.name}</button>
					        <span class="item-value money-related ${vinstClass}">${formatCurrency(item.vinst)}</span>
					    </li>
					`;
			    });
			
			    html += '</ul>';
			    return html;
			}

			function openStatsModal() {
                const completedJobs = allJobs.filter(j => j.status === 'klar');
				// 1. Beräkna listorna
		        const topCustomers = calculateTopList(completedJobs, 'kundnamn');
		        const topCars = calculateTopList(completedJobs, 'regnr');
		
		        // 2. Skapa HTML
		        const customerListHTML = generateTopListHTML(topCustomers, 'Mest lönsamma kunder', 'kund');
		        const carListHTML = generateTopListHTML(topCars, 'Mest lönsamma bilar (Reg.nr)', 'bil');
                const totalVinst = completedJobs.reduce((sum, j) => sum + (j.vinst || 0), 0);
                const totalJobb = completedJobs.length;

				// NY KOD: Beräkna Dagens vinst
		        const todayString = new Date().toISOString().split('T')[0];
		        const todaysProfit = allJobs
		            .filter(j => j.status === 'klar' && j.datum && j.datum.startsWith(todayString))
		            .reduce((sum, j) => sum + (j.vinst || 0), 0);
		
		        // Sätt värdet
		        document.getElementById('statsModalDagensVinst').textContent = formatCurrency(todaysProfit);
		        // Sätt färg
		        document.getElementById('statsModalDagensVinst').className = todaysProfit > 0 ? 'stat-value positive' : 'stat-value';

                statsModalTotalProfit.textContent = formatCurrency(totalVinst);
                statsModalJobCount.textContent = totalJobb;
                statsModalTotalProfit.className = totalVinst > 0 ? 'stat-value money-related positive' : 'stat-value money-related';

                const now = new Date();
                const currentMonthKey = `${now.getFullYear()}-${(now.getMonth() + 1).toString().padStart(2, '0')}`;
                
                const goal = parseFloat(currentProfitGoal) || 0;
                
                const thisMonthVinst = completedJobs
                    .filter(job => job.datum.startsWith(currentMonthKey))
                    .reduce((sum, j) => sum + (j.vinst || 0), 0);

                if (goal > 0) {
                    profitGoalProgress.style.display = 'block';
                    profitGoalCurrent.textContent = formatCurrency(thisMonthVinst);
                    profitGoalTarget.textContent = `Mål: ${formatCurrency(goal)}`;
                    const percent = Math.min((thisMonthVinst / goal) * 100, 100);
                    profitGoalFill.style.width = `${percent}%`;
                } else {
                    profitGoalProgress.style.display = 'none'; 
                }

                const monthlyStats = completedJobs.reduce((acc, job) => {
                    try {
                        const d = new Date(job.datum);
                        const key = `${d.getFullYear()}-${(d.getMonth() + 1).toString().padStart(2, '0')}`;
                        
                        if (!acc[key]) {
                            acc[key] = {
                                key: key,
                                year: d.getFullYear(),
                                month: d.getMonth() + 1,
                                monthName: new Date(d.getFullYear(), d.getMonth()).toLocaleString(locale, { month: 'short' }),
                                vinst: 0,
                                jobb: 0
                            };
                        }
                        
                        acc[key].vinst += (job.vinst || 0);
                        acc[key].jobb += 1;

                    } catch(e) { /* Ignorera ogiltiga datum */ }
                    return acc;
                }, {});

                const statsArray = Object.values(monthlyStats);
                statsArray.sort((a, b) => b.key.localeCompare(a.key));
                
                let tableHtml = `
                    <h3 class="chart-title">Månadsöversikt (Klart-jobb)</h3>
                    <table id="statsModalTable">
                        <thead>
                            <tr>
                                <th>Period</th>
                                <th>Antal Jobb</th>
                                <th style="text-align: right;" class="money-related">Total Vinst</th>
                            </tr>
                        </thead>
                        <tbody>
                `;

                if (statsArray.length === 0) {
                    tableHtml += `<tr><td colspan="3" style="text-align: center; padding: 2rem;">Inga klarmarkerade jobb att visa.</td></tr>`;
                } else {
                    statsArray.forEach(item => {
                        const monthName = new Date(item.year, item.month - 1)
                            .toLocaleString(locale, { month: 'long' });
                        
                        tableHtml += `
                            <tr>
                                <td>
                                    <span class="stat-month">${monthName.charAt(0).toUpperCase() + monthName.slice(1)}</span>
                                    <span class="stat-year">${item.year}</span>
                                </td>
                                <td style="text-align: center;">${item.jobb}</td>
                                <td class="stat-profit money-related">${formatCurrency(item.vinst)}</td>
                            </tr>
                        `;
                    });
                }
                tableHtml += `</tbody></table>`;
                
                statsModalBody.querySelector('#statsModalTable')?.remove(); 
                statsModalBody.insertAdjacentHTML('beforeend', tableHtml);

                // --- MÅNADSGRAF (BEFINTLIG) ---
                const chartData = Object.values(monthlyStats).sort((a, b) => a.key.localeCompare(b.key));
                const recentChartData = chartData.slice(-12); 

                const chartLabels = recentChartData.map(d => `${d.monthName} ${d.year}`);
                const chartVinstData = recentChartData.map(d => d.vinst);
                
                const ctx = document.getElementById('statsChart').getContext('2d');
                
                if (statsChartInstance) {
                    statsChartInstance.destroy(); 
                }

                statsChartInstance = new Chart(ctx, {
                    type: 'bar', 
                    data: {
                        labels: chartLabels,
                        datasets: [{
                            label: 'Vinst per Månad',
                            data: chartVinstData,
                            backgroundColor: 'rgba(10, 132, 255, 0.7)', 
                            borderColor: 'rgba(10, 132, 255, 1)',
                            borderWidth: 1,
                            borderRadius: 4
                        }]
                    },
                    options: {
                        responsive: true,
                        maintainAspectRatio: false,
                        plugins: {
                            legend: { display: false },
                            tooltip: {
                                callbacks: {
                                    label: function(context) {
                                        return ` Vinst: ${formatCurrency(context.raw)}`;
                                    }
                                }
                            }
                        },
                        scales: {
                            y: {
                                beginAtZero: true,
                                ticks: {
                                    callback: function(value) {
                                        return formatCurrency(value);
                                    }
                                }
                            }
                        }
                    }
                });

                // --- VECKODAGSGRAF (NY KOD HÄR) ---
                
                // 1. Definiera labels och data-array FÖRST
                const weekdayLabels = ['Mån', 'Tis', 'Ons', 'Tor', 'Fre', 'Lör', 'Sön'];
                const weekdayCounts = [0, 0, 0, 0, 0, 0, 0]; // 7 dagar, Mån=0, Sön=6

                // 2. Fyll på data-arrayen
                completedJobs.forEach(job => {
                    try {
                        const d = new Date(job.datum);
                        let dayOfWeek = d.getDay(); // 0=Söndag, 1=Måndag, ... 6=Lördag

                        if (dayOfWeek === 0) {
                            dayOfWeek = 6; // Flytta Söndag till slutet
                        } else {
                            dayOfWeek = dayOfWeek - 1; // Flytta Mån-Lör ett steg bakåt
                        }
                        
                        if(dayOfWeek >= 0 && dayOfWeek <= 6) {
                            weekdayCounts[dayOfWeek]++;
                        }
                    } catch(e) { /* Ignorera ogiltiga datum */ }
                });

                // 3. Hämta canvas och förstör gammal instans
                const weekdayCtx = document.getElementById('weekdayChart').getContext('2d');
                
                if (weekdayChartInstance) {
                    weekdayChartInstance.destroy(); 
                }

                // 4. Skapa den nya grafen
                weekdayChartInstance = new Chart(weekdayCtx, {
                    type: 'bar',
                    data: {
                        labels: weekdayLabels, // Använd den definierade variabeln
                        datasets: [{
                            label: 'Antal Jobb',
                            data: weekdayCounts, // Använd den definierade variabeln
                            backgroundColor: 'rgba(48, 209, 88, 0.7)',
                            borderColor: 'rgba(48, 209, 88, 1)',
                            borderWidth: 1,
                            borderRadius: 4
                        }]
                    },
                    options: {
                        responsive: true,
                        maintainAspectRatio: false,
                        plugins: {
                            legend: { display: false },
                            tooltip: {
                                callbacks: {
                                    label: function(context) {
                                        return ` Antal Jobb: ${context.raw}`;
                                    }
                                }
                            }
                        },
                        scales: {
                            y: {
                                beginAtZero: true,
                                ticks: {
                                    stepSize: 1 
                                }
                            }
                        }
                    }
                });

				// --- NY KOD: Fyll på topplistorna innan modalen visas ---
	            const topCustomersContainer = document.getElementById('topCustomersContainer');
	            if (topCustomersContainer) {
	                topCustomersContainer.innerHTML = customerListHTML;
	            }
	            const topCarsContainer = document.getElementById('topCarsContainer');
	            if (topCarsContainer) {
	                topCarsContainer.innerHTML = carListHTML;
	            }
                
                // Slutligen, visa modalen
                showModal('statsModal');
            }
            
            function showContextMenu(e, jobId) {
                hideContextMenu();
                e.preventDefault();
                
                const job = allJobs.find(j => j.id === jobId);
                if (!job) return;
                
                contextMenuJobId = jobId; 
                
                const prioText = job.prio ? 'Ta bort Prio' : 'Sätt Prio';
                
                contextMenu.innerHTML = `
                    <button class="context-menu-button" data-action="edit">
                        <svg class="icon-sm" viewBox="0 0 24 24"><use href="#icon-pencil"></use></svg>
                        <span>Redigera...</span>
                    </button>
                    <button class="context-menu-button" data-action="prio">
                        <svg class="icon-sm" viewBox="0 0 24 24"><use href="#icon-flag"></use></svg>
                        <span>${prioText}</span>
                    </button>
                    <button class="context-menu-button" data-action="duplicate">
                        <svg class="icon-sm" viewBox="0 0 24 24"><use href="#icon-duplicate"></use></svg>
                        <span>Duplicera</span>
                    </button>
                    <div class="context-menu-divider"></div>
                    <button class="context-menu-button" data-action="setStatusKlar">
                        <svg class="icon-sm" viewBox="0 0 24 24"><use href="#icon-check"></use></svg>
                        <span>Markera som Klar</span>
                    </button>
                    <button class="context-menu-button" data-action="setStatusBokad">
                        <svg class="icon-sm" viewBox="0 0 24 24"><use href="#icon-briefcase"></use></svg>
                        <span>Markera som Bokad</span>
                    </button>
                    <div class="context-menu-divider"></div>
                    <button class="context-menu-button danger" data-action="delete">
                        <svg class="icon-sm" viewBox="0 0 24 24"><use href="#icon-trash"></use></svg>
                        <span>Ta bort</span>
                    </button>
                `;
                
                contextMenu.style.left = `${e.clientX}px`;
                contextMenu.style.top = `${e.clientY}px`;
                contextMenu.classList.add('show');
            }
            function hideContextMenu() {
                contextMenu.classList.remove('show');
                contextMenuJobId = null;
            }
            
            // --- Åtgärdsfunktioner ---
            function findJob(jobId) {
                return allJobs.find(j => j.id === jobId);
            }
            function deleteJob(jobId) {
                if (confirm('Är du säker på att du vill ta bort detta jobb från molnet?')) {
                    db.collection("jobs").doc(jobId).delete()
                        .then(() => showToast('Jobb borttaget från molnet.', 'danger'))
                        .catch(err => showToast(`Fel: ${err.message}`, 'danger'));
                }
            }
            function togglePrio(jobId) {
                const job = findJob(jobId);
                if (job) {
                    db.collection("jobs").doc(jobId).update({ prio: !job.prio })
                    .then(() => showToast(job.prio ? 'Prio borttagen.' : 'Jobb markerat som prio!'))
                    .catch(err => showToast(`Fel: ${err.message}`, 'danger'));
                }
            }
            function duplicateJob(jobId) {
                const job = findJob(jobId);
                if (job) {
                    const jobData = {...job};
                    delete jobData.id;
                    jobData.datum = todayString;
                    jobData.tid = new Date().toTimeString().substring(0,5);
                    openJobModal('add', jobData);
                    showToast('Jobb duplicerat. Sätt nytt datum och spara.');
                }
            }
            function quickSetStatus(jobId, newStatus) {
                const job = findJob(jobId);
                if (job && job.status !== newStatus) {
                    db.collection("jobs").doc(jobId).update({
                        status: newStatus
                    })
                    .then(() => {
                        if (newStatus === 'klar') {
                            // Tyst, hanteras av "Ångra"-toasten
                        } else {
                            const statusText = STATUS_TEXT[newStatus] || newStatus;
                            showToast(`Jobb markerat som "${statusText}".`);
                        }
                    })
                    .catch(err => showToast(`Fel: ${err.message}`, 'danger'));
                }
            }
            
            // --- `handleFormSubmit` med Spinner ---
            async function handleFormSubmit(e) {
                e.preventDefault();
                
                // Hämta grunddata från formuläret
                const jobId = modalJobId.value;
                const kundpris = parseFloat(modalKundpris.value) || 0;
                
                // --- NY BERÄKNING AV UTGIFT & VINST ---
                const totalUtgifter = currentExpenses.reduce((sum, item) => sum + (item.cost || 0), 0);
                const vinst = kundpris - totalUtgifter;
                // --- SLUT NY BERÄKNING ---

                if (modalStatusSelect.value === 'klar' && kundpris === 0) {
                    alert('Ett "Klar" jobb kan inte ha 0 kr i kundpris.');
                    return;
                }
                const fullDatum = `${modalDatum.value}T${modalTid.value || '09:00'}`;
                
                // Detta är det nya objektet vi sparar till Firebase
                const savedData = { 
                    status: modalStatusSelect.value,
                    datum: fullDatum,
                    regnr: modalRegnr.value.toUpperCase(),
                    kundnamn: document.getElementById('kundnamn').value.toUpperCase(),
                    telefon: modalTelefon.value,
                    kundpris: kundpris,
                    utgifter: totalUtgifter,      // Sparar den totala summan (som förr)
                    expenseItems: currentExpenses,  // <-- NYTT: Sparar detalj-arrayen
                    vinst: vinst,                 // Sparar den nyberäknade vinsten
                    kommentarer: document.getElementById('kommentarer').value,
                    prio: document.getElementById('prio').checked,
					matarstallning: document.getElementById('matarstallning').value
                };
                
                const originalButtonText = modalSaveBtn.textContent;
                modalSaveBtn.disabled = true;
                modalSaveBtn.innerHTML = `
                    <span>Sparar...</span>
                    <div class="button-spinner"></div>
                `;

                try {
                    if (jobId) {
                        await db.collection("jobs").doc(jobId).update(savedData);
                        showToast('Jobb uppdaterat i molnet!');
                    } else {
                        await db.collection("jobs").add(savedData);
                        showToast('Jobb sparat i molnet!');
                    }
                    closeModal();
                } catch (err) {
                    showToast(`Fel: ${err.message}`, 'danger');
                } finally {
                    modalSaveBtn.disabled = false;
                    modalSaveBtn.innerHTML = originalButtonText;
                }
            }
            
            // --- `jobListContainer` klick-hanterare med "Ångra" ---
            jobListContainer.addEventListener('click', (e) => {
                const target = e.target;
                
                const actionButton = target.closest('.icon-btn');
                const customerLink = target.closest('.customer-link');
                const carLink = target.closest('.car-link');
                
                const jobElement = target.closest('tr[data-id], .mobile-job-card[data-id]');
                
                if (!jobElement) return;
                const id = jobElement.dataset.id;
                
                if (actionButton) {
                    const action = actionButton.dataset.action;
                    if (action) {
                        e.stopPropagation();
                        switch (action) {
                            case 'showComment':
                                showCommentPopover(actionButton);
                                return;
                            case 'togglePrio':
                                togglePrio(id);
                                return;
                            
                            case 'setStatusKlar': { 
                                const job = findJob(id);
                                if (!job) return;
                                
                                const originalStatus = job.status;
                                if (originalStatus === 'klar') return; 

                                quickSetStatus(id, 'klar');
                                
                                showToast('Jobb markerat som "Klar"', 'success', () => {
                                    quickSetStatus(id, originalStatus);
                                    showToast('Status återställd.', 'info');
                                });
                                return;
                            }
                        }
                    }
                    if (actionButton.classList.contains('delete-btn')) {
                        e.stopPropagation();
                        deleteJob(id);
                        return;
                    }
                }
                
                if (customerLink) { e.stopPropagation(); openCustomerModal(customerLink.dataset.kund); return; }
                if (carLink) { e.stopPropagation(); openCarModal(carLink.dataset.regnr); return; }
                
                const job = findJob(id);
                if (job) openJobSummaryModal(job);
            });
            
            // --- Långtryck- & Kontextmeny-hanterare ---
            jobListContainer.addEventListener('contextmenu', (e) => {
                e.preventDefault(); 
                if (window.innerWidth <= 768) {
                    return; 
                }
                const row = e.target.closest('tr[data-id]');
                if (row) showContextMenu(e, row.dataset.id);
            });
            
            let touchTimer;
            let touchStartX, touchStartY;
            
            jobListContainer.addEventListener('touchstart', (e) => {
                const jobElement = e.target.closest('.mobile-job-card[data-id]');
                if (!jobElement) return;

                const jobId = jobElement.dataset.id;
                const touch = e.touches[0];
                touchStartX = touch.clientX;
                touchStartY = touch.clientY;

                touchTimer = setTimeout(() => {
                    e.preventDefault(); 
                    
                    const longPressEvent = {
                        clientX: touchStartX,
                        clientY: touchStartY,
                        preventDefault: () => {}
                    };
                    showContextMenu(longPressEvent, jobId);
                    
                }, 750); 

            }, { passive: true });

            jobListContainer.addEventListener('touchmove', (e) => {
                if (!touchTimer) return;
                const touch = e.touches[0];
                if (Math.abs(touch.clientX - touchStartX) > 10 || Math.abs(touch.clientY - touchStartY) > 10) {
                    clearTimeout(touchTimer);
                    touchTimer = null;
                }
            });

            jobListContainer.addEventListener('touchend', (e) => {
                clearTimeout(touchTimer); 
                touchTimer = null;
            });
            
            jobListContainer.addEventListener('touchcancel', (e) => {
                clearTimeout(touchTimer); 
                touchTimer = null;
            });
            
            contextMenu.addEventListener('click', (e) => {
                const action = e.target.closest('.context-menu-button')?.dataset.action;
                if (!action || !contextMenuJobId) {
                    hideContextMenu();
                    return;
                }
                switch(action) {
                    case 'edit': const job = findJob(contextMenuJobId); if(job) openJobSummaryModal(job); break;
                    case 'prio': togglePrio(contextMenuJobId); break;
                    case 'duplicate': duplicateJob(contextMenuJobId); break; 
                    
                    case 'setStatusKlar': {
                        const job = findJob(contextMenuJobId);
                        if (!job) return;
                        const originalStatus = job.status;
                        if (originalStatus === 'klar') return; 
                        quickSetStatus(contextMenuJobId, 'klar');
                        showToast('Jobb markerat som "Klar"', 'success', () => {
                            quickSetStatus(contextMenuJobId, originalStatus);
                            showToast('Status återställd.', 'info');
                        });
                        break;
                    }
                    
                    case 'setStatusBokad': quickSetStatus(contextMenuJobId, 'bokad'); break;
                    case 'delete': deleteJob(contextMenuJobId); break;
                }
                hideContextMenu();
            });
            
            window.addEventListener('click', () => { hideCommentPopover(); hideContextMenu(); });
            popoverBackdrop.addEventListener('click', hideCommentPopover);
            commentPopoverClose.addEventListener('click', hideCommentPopover);

            // --- Sök-hanterare (Med rensa-knappar) ---
            function performSearch() {
				if (currentView === 'calendar') {
			        toggleView('timeline');
			    }
			    const desktopQuery = searchBar.value;
			    const mobileQuery = mobileSearchBar.value;
			
			    currentSearchTerm = (desktopQuery.length > mobileQuery.length) ? desktopQuery : mobileQuery;
			
                desktopSearchClear.style.display = desktopQuery.length > 0 ? 'flex' : 'none';
                mobileSearchClear.style.display = mobileQuery.length > 0 ? 'flex' : 'none';

			    clearDayFilterBtn.style.display = currentSearchTerm ? 'inline-flex' : 'none';
			    renderTimeline();
			
			    if (desktopSearchWrapper) {
			        desktopSearchWrapper.classList.remove('is-searching');
			    }
			}

            searchBar.addEventListener('input', debounce(performSearch, 300));
            mobileSearchBar.addEventListener('input', debounce(performSearch, 300));

            mobileSearchForm.addEventListener('submit', (e) => {
                e.preventDefault();
                mobileSearchBar.blur(); 
                closeModal(); 
                performSearch(); 
            });
            
            function clearSearch() {
			    searchBar.value = '';
			    mobileSearchBar.value = '';
			    currentSearchTerm = ''; // Sätt söktermen till tom
			
			    performSearch(); // Anropa performSearch för att uppdatera listan OCH headern
			
			    // Se till att stat-rutorna visas igen på mobilen
			    if (window.innerWidth <= 768) {
			        document.getElementById('statBar').style.display = 'grid';
			    }
			}
            
            clearDayFilterBtn.addEventListener('click', () => {
                clearSearch();
                searchBar.focus();
            });
            
            desktopSearchClear.addEventListener('click', () => {
                clearSearch();
                searchBar.focus();
            });

            mobileSearchClear.addEventListener('click', () => {
                clearSearch();
                mobileSearchBar.focus();
            });
            
            // --- Filter & Modalklick-hanterare ---
            statBar.addEventListener('click', (e) => {
                const card = e.target.closest('.stat-card');
                if (card && card.dataset.filter) {
                    currentStatusFilter = card.dataset.filter;
                    renderTimeline();
                    renderGlobalStats(allJobs);
                    filterCalendarView();
                }
            });
            
            jobModalForm.addEventListener('submit', handleFormSubmit);
            fabAddJob.addEventListener('click', () => openJobModal('add'));
            emptyStateAddBtn.addEventListener('click', () => openJobModal('add'));
            
            modalCloseBtn.addEventListener('click', () => closeModal());
            modalCancelBtn.addEventListener('click', () => closeModal());
            customerModalCloseBtn.addEventListener('click', () => closeModal());
            carModalCloseBtn.addEventListener('click', () => closeModal());
            mobileSearchCloseBtn.addEventListener('click', () => closeModal({ popHistory: false })); // PUNKT 7: Ändrad
            settingsModalCloseBtn.addEventListener('click', () => closeModal()); 
            settingsModalCancelBtn.addEventListener('click', () => closeModal()); 
			statsModalCloseBtn.addEventListener('click', () => closeModal());

			modalSummaryCloseBtn.addEventListener('click', () => closeModal());
            modalSummaryStangBtn.addEventListener('click', () => closeModal());
            jobSummaryModal.addEventListener('click', (e) => { if (e.target === jobSummaryModal) closeModal(); }); 
            
            modalSummaryEditBtn.addEventListener('click', (e) => {
                const jobId = e.currentTarget.dataset.jobId;
                const job = findJob(jobId);
                if (job) {
                    // Stäng nuvarande (summary) modal - UTAN ATT RÖRA HISTORIKEN
                    closeModal({ popHistory: false }); // <--- NY
                    
                    // Öppna redigerings-modalen OCH tala om för den att ERSÄTTA historiken
                    setTimeout(() => {
                        openJobModal('edit', job, { replaceHistory: true }); // <--- NY
                    }, 50);
                }
            });
            
            jobModal.addEventListener('click', (e) => { if (e.target === jobModal) closeModal(); });
            customerModal.addEventListener('click', (e) => { if (e.target === customerModal) closeModal(); });
            carModal.addEventListener('click', (e) => { if (e.target === carModal) closeModal(); });
            mobileSearchModal.addEventListener('click', (e) => { if (e.target === mobileSearchModal) closeModal({ popHistory: false }); }); // PUNKT 7: Ändrad
            statsModal.addEventListener('click', (e) => { if (e.target === statsModal) closeModal(); });
			statsModalBody.addEventListener('click', (e) => {
			    const customerBtn = e.target.closest('button[data-kund]');
			    const carBtn = e.target.closest('button[data-regnr]');
			
			    if (customerBtn) {
			        e.preventDefault();
			        const kundnamn = customerBtn.dataset.kund;
			        closeModal(); // Stäng statistik-modalen
			        // En liten fördröjning så att modalerna inte krockar
			        setTimeout(() => openCustomerModal(kundnamn), 50); 
			    } else if (carBtn) {
			        e.preventDefault();
			        const regnr = carBtn.dataset.regnr;
			        closeModal(); // Stäng statistik-modalen
			        setTimeout(() => openCarModal(regnr), 50); 
			    }
			});
            settingsModal.addEventListener('click', (e) => { if (e.target === settingsModal) closeModal(); }); 

            navLogo.addEventListener('click', (e) => {
			    e.preventDefault();
			    // NY KONTROLL: Blockera i privat läge
			    if (isPrivacyModeEnabled) {
			        showToast('Statistiköversikten är dold i privat läge.', 'info');
			        return;
			    } 
			    openStatsModal();
			});
            
            // --- Inställnings-modal (Vinstmål) ---
            // 1. FUNKTIONEN FÖR ATT ÖPPNA MODALEN
            // Denna funktion läser bara sparade värden och visar dem.
            function openSettingsModal() {
                // Läs in sparat vinstmål och fyll i fältet
                profitGoalInput.value = currentProfitGoal > 0 ? currentProfitGoal : '';
                
                // Läs in sparad standardvy och markera rätt knapp
                const savedView = localStorage.getItem('defaultView') || 'timeline';
                if (savedView === 'calendar') {
                    document.getElementById('defaultViewCalendar').checked = true;
                } else {
                    document.getElementById('defaultViewTimeline').checked = true;
                }
                
                // Hantera visning av mobil-specifika knappar
                if (window.innerWidth <= 768) {
                    mobileSettingsGroup.style.display = 'grid';
                } else {
                    mobileSettingsGroup.style.display = 'none';
                }
                
                // Visa själva modalen
                showModal('settingsModal');
            }

            // 2. DEN NYA LYSSNAREN (LIGGER UTANFÖR)
            // Denna kod körs 1 gång när sidan laddas.
            // Den lyssnar efter klick på radioknapparna och sparar direkt.
            document.querySelectorAll('input[name="defaultView"]').forEach(radio => {
                radio.addEventListener('change', (e) => {
                    // Om knappen blir "checked"
                    if(e.target.checked) {
                        const selectedView = e.target.value;
                        // Spara valet direkt i localStorage
                        localStorage.setItem('defaultView', selectedView);
                        
                        // Ge visuell feedback på datorn (där "Spara"-knappen inte används för detta)
                        if (window.innerWidth > 768) {
                            showToast('Standardvy sparad!', 'success');
                        }
                    }
                });
            });

            // 3. KOPPLINGAR TILL KNAPPARNA (Dessa rader har du redan, se till att de ligger efter)
            settingsBtn.addEventListener('click', openSettingsModal);
            mobileSettingsBtn.addEventListener('click', openSettingsModal);
            
            settingsModalForm.addEventListener('submit', (e) => {
                e.preventDefault();
                currentProfitGoal = parseFloat(profitGoalInput.value) || 0;
                localStorage.setItem('profitGoal', currentProfitGoal);

				//const selectedView = document.querySelector('input[name="defaultView"]:checked').value;
                //localStorage.setItem('defaultView', selectedView);
				
                showToast('Inställningar sparade!', 'success');
                closeModal();
            });

            settingsThemeToggle.addEventListener('click', () => themeToggle.click());
            settingsLockAppBtn.addEventListener('click', () => {
                closeModal();
                setTimeout(() => lockAppBtn.click(), 250);
            });

            // --- Jobb-mallar (FIXAD) ---
            jobTemplates.addEventListener('click', (e) => {
                const button = e.target.closest('.template-btn');
                if (!button) return;

                const template = button.dataset.template;
                
                if (template === 'oljebyte') {
                    const literOljaprompt = prompt('Hur många liter olja? (t.ex. 4.3)', '4,3');
                    if (literOljaprompt === null) return; 
                    
                    const literOlja = parseFloat(literOljaprompt.replace(',', '.')) || 0;
                    
                    if (literOlja > 0) {
                        const oljekostnad = literOlja * 200; 
                        const filterkostnad = 200; 
                        const arbetskostnad = 500; 
                        
                        modalKundpris.value = Math.round(oljekostnad + filterkostnad + arbetskostnad);
                        
                        // --- NY LOGIK FÖR UTGIFTER ---
                        currentExpenses = [
                            { name: `Motorolja (${literOlja}L)`, cost: Math.round(oljekostnad) },
                            { name: "Oljefilter", cost: filterkostnad }
                        ];
                        renderExpensesList(); // Uppdatera listan
                        // --- SLUT NY LOGIK ---
                        
                        document.getElementById('kommentarer').value = `Oljebyte:\n- Motorolja (${literOlja}L)\n- Oljefilter`;
                        showToast('Mall tillämpad!', 'info');
                    } else {
                        showToast('Ogiltigt antal liter.', 'danger');
                    }
                    
                } else if (template === 'hjulskifte') {
                    modalKundpris.value = 200;
                    
                    // --- NY LOGIK FÖR UTGIFTER ---
                    currentExpenses = []; // Inga utgifter för hjulskifte
                    renderExpensesList(); // Rensa listan
                    // --- SLUT NY LOGIK ---

                    document.getElementById('kommentarer').value = 'Hjulskifte (sommar/vinter)';
                    showToast('Mall tillämpad!', 'info');
                }
                
                updateLiveProfit(); // Beräkna om vinsten
            });
            
            // --- Klickbara jobblistor i Kund/Bil-modal (FIXAD HISTORIK) ---
            function handleDetailListClick(e) {
                const jobItem = e.target.closest('li[data-job-id]');
                if (!jobItem) return;

                const jobId = jobItem.dataset.jobId;
                const job = findJob(jobId);
                
                if (job) {
                    // FIX: Stäng nuvarande modal, men tryck "bakåt" i historiken
                    if (history.state?.modal) {
                        isNavigatingBack = true;
                        history.back(); // Gå tillbaka från customer/car-modalen
                        isNavigatingBack = false;
                    } else {
                        closeModal({ popHistory: false }); // Fallback
                    }
                    
                    setTimeout(() => {
                        openJobModal('edit', job);
                    }, 50); 
                }
            }
            customerModalJobList.addEventListener('click', handleDetailListClick);
            carModalJobList.addEventListener('click', handleDetailListClick);
            
            // BONUS: Sök i detalj-modalerna
            customerSearch.addEventListener('input', debounce((e) => {
                const kundnamn = customerModalName.textContent;
                const customerJobs = allJobs.filter(j => j.kundnamn === kundnamn).sort((a, b) => new Date(b.datum) - new Date(a.datum));
                renderDetailJobList(customerModalJobList, customerJobs, e.target.value);
            }, 300));

            carSearch.addEventListener('input', debounce((e) => {
                const regnr = carModalRegnr.textContent;
                const carJobs = allJobs.filter(j => j.regnr === regnr).sort((a, b) => new Date(b.datum) - new Date(a.datum));
                renderDetailJobList(carModalJobList, carJobs, e.target.value);
            }, 300));


            // --- Övriga formulär-hanterare ---
            modalKundpris.addEventListener('input', updateLiveProfit);
            
            // NYTT: Funktion för att hitta senaste jobbet
            function findLatestJob(key, value) {
                return [...allJobs].reverse().find(job => job[key] && job[key].toLowerCase() === value.toLowerCase());
            }

			modalTelefon.addEventListener('input', () => {
	            const telefonNummer = modalTelefon.value;
	            // Enkel validering (t.ex. minst 5 siffror)
	            if (telefonNummer && telefonNummer.replace(/\D/g, '').length >= 5) {
	                jobModalCallBtn.href = `tel:${telefonNummer}`;
	                jobModalSmsBtn.href = `sms:${telefonNummer}`;
	                jobModalCallBtn.style.display = 'inline-flex';
	                jobModalSmsBtn.style.display = 'inline-flex';
	            } else {
	                jobModalCallBtn.style.display = 'none';
	                jobModalSmsBtn.style.display = 'none';
	            }
	        });
            
            modalRegnr.addEventListener('blur', (e) => {
                // Ta det synliga värdet. Trimma endast bort inledande/avslutande mellanslag.
			    let visualValue = e.target.value.toUpperCase().trim();
                
                // Omvandla till ett internt format (utan mellanslag) för SÖKNING
                let searchValue = visualValue.replace(/\s/g, ''); 
                
			    if (searchValue.length < 4 || searchValue.length > 7) {
                    // Återställ det visuella värdet och avsluta
                    e.target.value = visualValue; 
                    return; 
                }
			
                // VI SLUTAR ATT TVINGA FORMATET HÄR!
                // Din korrigering till t.ex. "ABC123" kommer nu att sparas.
                e.target.value = visualValue; 
                
			    // Trigga din befintliga "auto-fyll"-logik
			    const regnrToSearch = searchValue; // Sök med den rensade strängen
			    const existingJob = findLatestJob('regnr', regnrToSearch); 
			    
                // --- KVARVARANDE LOGIK FÖR ATT FÖRHINDRA ÖVERSKRIVNING ---
			    if (existingJob) {
                    // Fyll BARA kundnamn om fältet är tomt
                    if (modalKundnamn.value === '') {
                        modalKundnamn.value = existingJob.kundnamn.toUpperCase();
                    }
                    // Fyll BARA telefon om fältet är tomt
                    if (modalTelefon.value === '') {
                        modalTelefon.value = existingJob.telefon || '';
                    }
                }
            });
            
            modalRegnr.addEventListener('input', (e) => {
                e.target.value = e.target.value.toUpperCase();
            });

            modalKundnamn.addEventListener('input', () => {
                const query = modalKundnamn.value.toLowerCase();
                kundnamnSuggestions.innerHTML = '';

                if (query.length < 2) {
                    kundnamnSuggestions.style.display = 'none';
                    return;
                }
                const allNames = allJobs.map(job => job.kundnamn);
                const uniqueNames = [...new Set(allNames)];
                const matches = uniqueNames
                    .filter(name => name.toLowerCase().includes(query))
                    .slice(0, 5);

                if (matches.length > 0) {
                    matches.forEach(name => {
                        const item = document.createElement('div');
                        item.classList.add('suggestion-item');
                        item.textContent = name;
                        item.addEventListener('click', () => {
                            const name = item.dataset.name; // Återanvänd variabeln 'name'
                            modalKundnamn.value = name;
                            kundnamnSuggestions.style.display = 'none';
                            kundnamnSuggestions.innerHTML = '';
                            
                            // --- SISTA FIXEN: Fyll bara tomma fält ---
                            const existingJob = findLatestJob('kundnamn', name); 
                            
                            if (existingJob) {
                                // Fyll BARA om telefon-fältet är tomt
                                if (modalTelefon.value === '') {
                                    modalTelefon.value = existingJob.telefon || '';
                                }
                            }
                        });
                        kundnamnSuggestions.appendChild(item);
                    });
                    kundnamnSuggestions.style.display = 'block';
                } else {
                    kundnamnSuggestions.style.display = 'none';
                }
            });
            modalKundnamn.addEventListener('change', () => {
                modalKundnamn.value = modalKundnamn.value.toUpperCase();
            });

            jobModalForm.addEventListener('click', (e) => {
                if (e.target.id !== 'kundnamn') {
                    kundnamnSuggestions.style.display = 'none';
                }
            });
            modalKundnamn.addEventListener('blur', () => {
                setTimeout(() => {
                    kundnamnSuggestions.style.display = 'none';
                }, 150);
            });
            
            quickTimeButtons.addEventListener('click', (e) => {
                if (e.target.dataset.time) {
                    e.preventDefault();
                    modalTid.value = e.target.dataset.time;
                }
            });

            // NYTT: Kopieringsknappar
            async function copyToClipboard(text, fieldName) {
                if (!text) {
                    showToast(`Fältet "${fieldName}" är tomt.`, 'danger');
                    return;
                }
                try {
                    await navigator.clipboard.writeText(text);
                    showToast(`"${fieldName}" kopierad!`, 'success');
                } catch (err) {
                    showToast('Kunde inte kopiera.', 'danger');
                }
            }
            copyKundnamnBtn.addEventListener('click', () => copyToClipboard(modalKundnamn.value, 'Kundnamn'));
            copyRegnrBtn.addEventListener('click', () => copyToClipboard(modalRegnr.value, 'Reg.nr'));

            copyCarRegnrBtn.addEventListener('click', (e) => {
                e.stopPropagation(); // Förhindra att klicket går vidare
                copyToClipboard(carModalRegnr.textContent, 'Reg.nr');
            });

			// --- NYTT: Kopiera Reg.nr vid klick på Oljemagasinet ---
            function handleOljemagasinetClick(e) {
                const regnr = carModalRegnr.textContent;
                if (regnr) {
                    // Anropa den befintliga kopieringsfunktionen "tyst".
                    // Den kommer visa en toast om den lyckas.
                    copyToClipboard(regnr, 'Reg.nr');
                }
                // VIKTIGT: Vi kör *inte* e.preventDefault() här,
                // eftersom vi vill att länken fortfarande ska öppnas.
            }
            
            // Koppla lyssnaren till båda Oljemagasinet-knapparna
            if (carModalOljemagasinetLink) {
                carModalOljemagasinetLink.addEventListener('click', handleOljemagasinetClick);
            }
            if (carModalOljemagasinetLinkMobile) {
                carModalOljemagasinetLinkMobile.addEventListener('click', handleOljemagasinetClick);
            }
            // --- SLUT PÅ NY KOD ---
			
            // --- App-inställningar (Tema, Kompakt, Lås) ---
            themeToggle.addEventListener('click', () => {
                const currentTheme = docElement.getAttribute('data-theme') || 'dark';
                setTheme(currentTheme === 'dark' ? 'light' : 'dark');
            });

			privacyToggle.addEventListener('click', () => setPrivacyMode(!isPrivacyModeEnabled));
			settingsPrivacyToggle.addEventListener('click', () => setPrivacyMode(!isPrivacyModeEnabled));
			
            function setTheme(theme) {
                docElement.setAttribute('data-theme', theme);
                localStorage.setItem('theme', theme);
            }
            const savedTheme = localStorage.getItem('theme') || 'light';
            setTheme(savedTheme);
			setPrivacyMode(isPrivacyModeEnabled);

			// --- NY FUNKTION: Sekretessläge ---
			function setPrivacyMode(isEnabled) {
			    isPrivacyModeEnabled = isEnabled;
			    if (isEnabled) {
			        docElement.classList.add('privacy-mode-enabled');
			        localStorage.setItem('privacyMode', 'true');
			    } else {
			        docElement.classList.remove('privacy-mode-enabled');
			        localStorage.setItem('privacyMode', 'false');
			    }
			    // Uppdatera kalendern, som kanske visar vinst
			    if (calendar) {
			        updateDailyProfitInCalendar(allJobs);
			    }
			}
            
            // --- NYTT: Uppgraderad funktion med SÄKERHETSKONTROLL ---
            function setCompactMode(level) {
                // Rensa alltid gamla klasser först
                docElement.classList.remove('compact-mode', 'extra-compact-mode');
                toggleCompactView.classList.remove('active');
                
                // SÄKERHETSKONTROLL: Kör bara om mobil-knappen existerar
                if (settingsToggleCompactView) { 
                    settingsToggleCompactView.classList.remove('active');
                }
                
                const levelNum = parseInt(level) || 0; 

                if (levelNum === 1) {
                    // Läge 1: Kompakt
                    docElement.classList.add('compact-mode');
                    toggleCompactView.classList.add('active');
                    toggleCompactView.title = "Växla till Extra Kompakt vy";
                    
                    // SÄKERHETSKONTROLL
                    if (settingsToggleCompactView) {
                        settingsToggleCompactView.classList.add('active');
                        settingsToggleCompactView.title = "Växla till Extra Kompakt vy";
                    }

                } else if (levelNum === 2) {
                    // Läge 2: Extra Kompakt
                    docElement.classList.add('extra-compact-mode'); 
                    toggleCompactView.classList.add('active');
                    toggleCompactView.title = "Växla till Standardvy";

                    // SÄKERHETSKONTROLL
                    if (settingsToggleCompactView) {
                        settingsToggleCompactView.classList.add('active');
                        settingsToggleCompactView.title = "Växla till Standardvy";
                    }

                } else {
                    // Läge 0: Normal
                    toggleCompactView.title = "Växla till Kompakt vy";
                    
                    // SÄKERHETSKONTROLL
                    if (settingsToggleCompactView) {
                        settingsToggleCompactView.title = "Växla till Kompakt vy";
                    }
                }
                
                localStorage.setItem('compactModeLevel', levelNum.toString());
            }

            // --- NYTT (Steg 2): Uppgraderad klick-hanterare som cyklar ---
            function handleCompactToggleClick() {
                // Hämta nuvarande nivå, default 0 (Normal)
                let currentLevel = parseInt(localStorage.getItem('compactModeLevel') || '0');
                
                // Öka nivån
                currentLevel++;
                
                // Om vi går över 2, börja om på 0
                if (currentLevel > 2) {
                    currentLevel = 0; 
                }
                
                // Anropa funktionen med den nya nivån
                setCompactMode(currentLevel);
            }

            // Koppla den nya cykel-funktionen till knapparna
            toggleCompactView.addEventListener('click', handleCompactToggleClick);
            
            // SÄKERHETSKONTROLL: Koppla bara lyssnaren om knappen existerar
            if (settingsToggleCompactView) {
                settingsToggleCompactView.addEventListener('click', handleCompactToggleClick);
            }
            
            // --- NYTT (Steg 3): Läs in den sparade nivån vid start ---
            const savedCompactLevel = localStorage.getItem('compactModeLevel') || '1';
            setCompactMode(savedCompactLevel);

            function setupViewToggles() {
                const allToggleButtons = document.querySelectorAll('.button-toggle-view, .mobile-nav-btn[data-view]');
                allToggleButtons.forEach(button => {
                    button.addEventListener('click', (e) => {
                        const view = e.currentTarget.dataset.view;
                        if (view) {
                            toggleView(view);
                        }
                    });
                });
            }
            setupViewToggles();
            
            mobileAddJobBtn.addEventListener('click', () => openJobModal('add'));
            mobileSearchBtn.addEventListener('click', () => {
				if (currentView === 'calendar') {
                    toggleView('timeline');
                }
                showModal('mobileSearchModal');
                mobileSearchBar.focus();
            });
            
            function setHeaderDate() {
                let datePart = new Intl.DateTimeFormat(locale, { weekday: 'short', month: 'short', day: 'numeric' }).format(new Date());
                appBrandTitle.textContent = datePart.charAt(0).toUpperCase() + datePart.slice(1);
            }
            setHeaderDate();


            // --- PIN-lås & Initiering ---
            function showPinLock() {
                appContainer.style.display = 'none';
                fabAddJob.style.display = 'none';
                mobileNav.style.display = 'none';
                
                showModal('pinLockModal');
                setTimeout(() => pinInput.focus(), 100);
            }
            
            function hidePinLock() {
                appContainer.style.display = 'flex';
                fabAddJob.style.display = 'flex';
                if(window.innerWidth <= 768) {
                    mobileNav.style.display = 'flex';
                }
                
                closeModal({ popHistory: false }); 
                localStorage.setItem(PIN_LAST_UNLOCKED_KEY, Date.now().toString());
            }
            
            pinLockForm.addEventListener('submit', (e) => {
                e.preventDefault();
                const storedPin = localStorage.getItem(APP_PIN_KEY);
                const enteredPin = pinInput.value;
                if (enteredPin === storedPin) {
                    pinError.textContent = ''; pinInput.value = '';
                    hidePinLock();
                    if (!appInitialized) {
                        appInitialized = true;
                        initializeCalendar();
                        initRealtimeListener();
						toggleView(currentView);
                    }
                } else {
                    pinError.textContent = 'Fel PIN-kod. Försök igen.';
                    pinLockModal.classList.add('shake-error');
                    pinInput.value = ''; pinInput.focus();
                    setTimeout(() => pinLockModal.classList.remove('shake-error'), 500);
                }
            });
            lockAppBtn.addEventListener('click', () => {
            	localStorage.removeItem(PIN_LAST_UNLOCKED_KEY);
                showPinLock();
                showToast('Appen är nu låst.', 'info');
            });
            
            document.addEventListener('keydown', (e) => {
                if (currentOpenModalId === 'pinLockModal' && e.key === 'Escape') {
                    e.preventDefault();
                    return;
                }

                if (e.key === 'Escape') {
                    if (isModalOpen) {
                        e.preventDefault();
                        // PUNKT 7: Hantera escape för mobil-sök
                        if (currentOpenModalId === 'mobileSearchModal') {
                            closeModal({ popHistory: false });
                        } else {
                            closeModal(); 
                        }
                    } else if (commentPopover.classList.contains('show')) {
                        e.preventDefault();
                        hideCommentPopover();
                    } else {
                        hideContextMenu();
                    }
                    return;
                }
                
                const isInputFocused = document.activeElement.tagName === 'INPUT' || document.activeElement.tagName === 'TEXTAREA' || document.activeElement.tagName === 'SELECT';
                
                if (isModalOpen && e.key === 'Enter' && document.activeElement.tagName !== 'TEXTAREA') {
                    if (currentOpenModalId === 'jobModal') {
                        e.preventDefault();
                        modalSaveBtn.click();
                    } else if (currentOpenModalId === 'settingsModal') {
                        e.preventDefault();
                        settingsModalSaveBtn.click();
                    }
                }

                if (isModalOpen || isInputFocused || contextMenu.classList.contains('show')) return;
                
                switch(e.key.toLowerCase()) {
                    case 'n': e.preventDefault(); openJobModal('add'); break;
                    case 'f': 
                        e.preventDefault(); 
                        if (window.innerWidth <= 768) {
                            mobileSearchBtn.click();
                        } else {
                            searchBar.focus();
                        }
                        break;
                }
            });

            // --- NYTT: CSV-Export ---
            function exportToCsv(data) {
                const headers = [
                    "ID", "Status", "Datum", "Tid", "Kundnamn", "Telefon", 
                    "Regnr", "Mätarställning", "Kundpris", "Utgifter", "Vinst", 
                    "Prioritet", "Kommentarer"
                ];
                
                const rows = data.map(job => {
                    const d = new Date(job.datum);
                    const date = d.toISOString().split('T')[0];
                    const time = d.toTimeString().substring(0, 5);
                    
                    const row = [
                        job.id,
                        STATUS_TEXT[job.status] || job.status,
                        date,
                        time,
                        job.kundnamn,
                        job.telefon || '',
                        job.regnr || '',
                        job.matarstallning || '',
                        job.kundpris || 0,
                        job.utgifter || 0,
                        job.vinst || 0,
                        job.prio ? 'Ja' : 'Nej',
                        (job.kommentarer || '').replace(/"/g, '""').replace(/\n/g, ' ')
                    ];
                    return `"${row.join('","')}"`;
                });

                const csvContent = "data:text/csv;charset=utf-8," 
                    + `"${headers.join('","')}"\n` 
                    + rows.join("\n");
                
                const encodedUri = encodeURI(csvContent);
                const link = document.createElement("a");
                link.setAttribute("href", encodedUri);
                link.setAttribute("download", `jobb_export_${todayString}.csv`);
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
                showToast('CSV-fil exporterad!', 'success');
            }
            
            exportCsvBtn.addEventListener('click', () => {
                if (allJobs.length > 0) {
                    exportToCsv(allJobs);
                } else {
                    showToast('Det finns inga jobb att exportera.', 'danger');
                }
            });
         
            const storedPin = localStorage.getItem(APP_PIN_KEY);
            const lastUnlockedTimestamp = localStorage.getItem(PIN_LAST_UNLOCKED_KEY);
            let isUnlocked = false; 

            if (lastUnlockedTimestamp) {
                const lastUnlocked = parseInt(lastUnlockedTimestamp, 10);
                const elapsedHours = (Date.now() - lastUnlocked) / (1000 * 60 * 60);
                
                if (elapsedHours <= 1) {
                    isUnlocked = true;
                } else {
                    localStorage.removeItem(PIN_LAST_UNLOCKED_KEY);
                }
            }
            
            if (storedPin) {
                if (isUnlocked) {
                    appInitialized = true;
                    initializeCalendar();
                    initRealtimeListener();
					toggleView(currentView);
                } else {
                    showPinLock();
                }
            } else {
                localStorage.setItem(APP_PIN_KEY, '0912');
                localStorage.setItem(PIN_LAST_UNLOCKED_KEY, Date.now().toString());
                //showToast('Standard PIN "0912" har ställts in.', 'info');
                appInitialized = true;
                initializeCalendar();
                initRealtimeListener();
				toggleView(currentView);
            }
            
            window.addEventListener('resize', debounce(() => {
                renderTimeline();
                if (calendar && currentView === 'calendar') {
                    calendar.rerenderEvents();
                    updateDailyProfitInCalendar(allJobs);
                }
            }, 200));

			// --- NY KOD: Lås vid inaktivitet ---
            document.addEventListener('visibilitychange', () => {
                if (document.hidden) {
                    // Användaren lämnade appen, starta en kort timer
                    clearTimeout(lockOnHideTimer); // Rensa gammal timer
                    lockOnHideTimer = setTimeout(() => {
                        // Ta bort "olåst"-nyckeln efter 30 sek
                        localStorage.removeItem(PIN_LAST_UNLOCKED_KEY); 
                    }, 300000); // 5 minuter
                } else {
                    // Användaren kom tillbaka, avbryt timern
                    clearTimeout(lockOnHideTimer);
                }
            });

        });
