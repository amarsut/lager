	// --- Globala Konstanter ---
        const STATUS_TEXT = {
		    'bokad': 'Bokad', 
		    'klar': 'Slutfört', // Ändra texten för att tydliggöra
		    'offererad': 'Offererad', 
		    'avbokad': 'Avbokad',
		    'faktureras': 'Faktureras' // Ny
		};
		// Lägg till dina företagskunder här (små bokstäver för sökning)
		const CORPORATE_CLIENTS = ['fogarolli', 'bmg'];
		const SPECIAL_CLIENTS = ['fogarolli', 'bmg'];
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

        // --- NYTT: Kontextuell Ikon-funktion (UPPDATERAD) ---
		function getJobContextIcon(job) {
		    // Definiera dina företagskunder här igen (du behöver inte "const" om de redan är globala, men det skadar inte)
		    const SPECIAL_CLIENTS = ['fogarolli', 'bmg']; 
		    
		    if (!job || !job.kundnamn) return '#icon-user'; 
		
		    const name = job.kundnamn.toLowerCase();
		    
		    const isCorporate = SPECIAL_CLIENTS.some(client => name.includes(client));
		    
		    if (isCorporate) {
		        return '#icon-office-building'; 
		    }
		    
		    return '#icon-user'; 
		}
        
        document.addEventListener('DOMContentLoaded', function() {
            
            // --- Globalt Tillstånd (State) ---
            let allJobs = [];
			let currentSortField = 'datum'; 
			let currentSortOrder = 'asc';
			let currentOilStock = 0;
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

			const sortBySelect = document.getElementById('sortBy');
			if (sortBySelect) {
			    sortBySelect.addEventListener('change', (e) => {
			        // Uppdatera texten man ser (t.ex. "Datum")
			        const label = e.target.options[e.target.selectedIndex].text;
			        document.querySelector('.select-value').textContent = label;
			        
			        // Uppdatera global variabel och rita om
			        currentSortField = e.target.value;
			        renderTimeline();
			    });
			}

			// 2. Hantera Tillbaka-pilen på mobil
			const mobileBackBtn = document.getElementById('mobileSearchBackBtn');
			if (mobileBackBtn) {
			    mobileBackBtn.addEventListener('click', () => {
			        document.getElementById('mobileSearchModal').style.display = 'none';
			        // Rensa sökning valfritt
			        // performSearch(); 
			    });
			}
			
			const sortDirectionBtn = document.getElementById('sortDirectionBtn');

			if (sortDirectionBtn) {
        		sortDirectionBtn.classList.toggle('descending', currentSortOrder === 'desc');
    		}

			// Lägg i DOMContentLoaded
			const mInput = document.getElementById('mobileSearchBar');
			if (mInput) {
			    mInput.addEventListener('input', debounce(performSearch, 300));
			}
			
			// Koppla "Avbryt"-knappen på mobilen
			const mClose = document.getElementById('mobileSearchCloseBtn');
			if (mClose) {
			    mClose.addEventListener('click', () => {
			        document.getElementById('mobileSearchModal').style.display = 'none';
			        // Nollställ sökning när man stänger
			        if(mInput) mInput.value = '';
			        performSearch(); // Återställ listan
			    });
			}

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
			if (modalKundnamn) {
			    modalKundnamn.addEventListener('input', (e) => {
			        // Spara markörens position så den inte hoppar till slutet
			        const start = e.target.selectionStart;
			        const end = e.target.selectionEnd;
			
			        // Gör om till stora bokstäver
			        e.target.value = e.target.value.toUpperCase();
			
			        // Återställ markören
			        e.target.setSelectionRange(start, end);
			    });
			}
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

			const templateSelect = document.getElementById('templateSelect');

			if (templateSelect) {
			    templateSelect.addEventListener('change', (e) => {
			        const template = e.target.value;
			        const kommentarInput = document.getElementById('kommentarer');
			        const prisInput = document.getElementById('kundpris');
			        
			        if (template === 'oljebyte') {
					    const literOljaprompt = prompt('Hur många liter olja? (t.ex. 4.3)', '4,3');
					    
					    if (literOljaprompt) {
					        const literOlja = parseFloat(literOljaprompt.replace(',', '.')) || 0;
					        
					        // 1. Räkna ut priset
					        const pris = Math.round((literOlja * 200) + 200 + 500);
					        prisInput.value = pris;
					        
					        // 2. SÄKERHETSÅTGÄRD: Se till att listan finns
					        if (typeof currentExpenses === 'undefined') {
					            window.currentExpenses = [];
					        }
					
					        // 3. Skapa de nya raderna
					        const nyaUtgifter = [
					            { name: `MOTOROLJA (${literOlja}L)`, cost: Math.round(literOlja * 65) },
					            { name: "OLJEFILTER", cost: 200 }
					        ];
					
					        // 4. LÄGG TILL dem i listan (istället för att ersätta hela listan)
					        currentExpenses.push(...nyaUtgifter);
					        
					        // 5. Rita ut listan på skärmen
					        renderExpensesList();
					        
					        // 6. Uppdatera kommentaren
					        const nyText = `Oljebyte (${literOlja}L) & Oljefilter`;
					        kommentarInput.value = kommentarInput.value ? kommentarInput.value + "\n" + nyText : nyText;
					        
					        // 7. Uppdatera vinstkalkylen direkt
					        updateLiveProfit();
					    }
					}
			        else if (template === 'hjulskifte') {
			            prisInput.value = 200; // Ditt pris
			            const nyText = "Hjulskifte (Sommar/Vinter)";
			            kommentarInput.value = kommentarInput.value ? kommentarInput.value + "\n" + nyText : nyText;
			            // Rensa utgifter för hjulskifte
			            currentExpenses = [];
			            renderExpensesList();
			        }
			        else if (template === 'bromsbelagg') {
			            prisInput.value = 500;
			            const nyText = "Byte av bromsbelägg (Fram el. Bak)";
			            kommentarInput.value = kommentarInput.value ? kommentarInput.value + "\n" + nyText : nyText;
			            currentExpenses = []; // Nollställ utgifter om du inte vill lägga till delarna automatiskt
			            renderExpensesList();
			        }
			        else if (template === 'bromsskivorbelagg') {
			            prisInput.value = 700;
			            const nyText = "Byte av bromsskivor & belägg (Fram el. Bak)";
			            kommentarInput.value = kommentarInput.value ? kommentarInput.value + "\n" + nyText : nyText;
			            currentExpenses = [];
			            renderExpensesList();
			        }
			
			        updateLiveProfit(); // Uppdatera vinstkalkyl
			        
			        // Återställ dropdown till "Välj mall..." så man kan välja samma igen
			        e.target.value = ""; 
			    });
			}
            
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
			const statsModalFordringar = document.getElementById('statsModalFordringar');
            
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
            const exportCsvBtn = document.getElementById('exportCsvBtn');


            const popoverBackdrop = document.getElementById('popoverBackdrop');
            const commentPopover = document.getElementById('commentPopover');
            const commentPopoverContent = document.getElementById('commentPopoverContent');
            const commentPopoverClose = document.getElementById('commentPopoverClose');

			commentPopover.addEventListener('click', (e) => e.stopPropagation());
            
            const contextMenu = document.getElementById('contextMenu');
            let contextMenuJobId = null;
            
            const toggleCompactView = document.getElementById('toggleCompactView');
            
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
			const mobileViewToggle = document.getElementById('mobileViewToggle');
			const viewSelectModal = document.getElementById('viewSelectModal');
			const viewSelectCloseBtn = document.getElementById('viewSelectCloseBtn');

            const desktopSearchClear = document.getElementById('desktopSearchClear');
            const mobileSearchClear = document.getElementById('mobileSearchClear');

			// --- NYTT: Kanban-element ---
			const kanbanView = document.getElementById('kanbanView');
			const kanbanColOffererad = document.getElementById('kanban-col-offererad');
			const kanbanColBokad = document.getElementById('kanban-col-bokad');
			const kanbanColKlar = document.getElementById('kanban-col-klar');
			const kanbanColFaktureras = document.getElementById('kanban-col-faktureras');

			// --- NY LYSSNARE FÖR KANBAN-VYN ---
            kanbanView.addEventListener('click', (e) => {
                const addBtn = e.target.closest('.kanban-add-btn');
                const card = e.target.closest('.kanban-card');
                
                // 1. Hantera "Snabblägg till"-knappen
                if (addBtn) {
                    const status = addBtn.dataset.status;
                    openJobModal('add'); // Öppna en tom modal
                    
                    // Sätt statusen direkt
                    setTimeout(() => {
                        syncStatusUI(status);
                    }, 50);
                    return;
                }

                // 2. Hantera klick på ett kort (för att öppna summary)
                if (card) {
                    // Ignorera klick på drag-handtaget eller länkar inuti kortet
                    if (e.target.closest('.kanban-drag-handle, .car-link, .customer-link')) {
                        return;
                    }
                    
                    const jobId = card.dataset.id;
                    const job = findJob(jobId);
                    if (job) {
                        openJobSummaryModal(job);
                    }
                }
            });

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
                        left: '',
                        center: 'dayGridMonth,dayGridTwoWeek,timeGridWeek',
                        right: ''
                    },
					footerToolbar: {
					    left: 'title',
					    center: '',
					    right: 'prev,next,today'
					},
                    buttonText: {
                        today:         'Idag',
						month:         'Månad',
                        dayGridTwoWeek:'14 Dagar',
                        timeGridWeek:  'Vecka',
                        timeGridDay:   'Dag',
                        listWeek:      'Vecka' 
                    },
                    
                    views: {
                        // NYTT FÖR ATT FÅ "November" istället för "November 2025"
                        dayGridMonth: { 
                            titleFormat: { month: 'long' } // <-- NY RAD
                        }, 
                        dayGridTwoWeek: {
                            type: 'dayGrid',
                            duration: { weeks: 2 },
                            displayEventTime: true,
                            // FIX FÖR TITELN: "24 nov. - 7 dec."
                            titleFormat: { day: 'numeric', month: 'short' }, // <-- NY RAD
                            dayCellContent: function(arg) {
                                let dayNumberEl = document.createElement('a');
                                dayNumberEl.classList.add('fc-daygrid-day-number');
                                // FIX FÖR DAG-NUMMER: Visar "1" istället för "1 december"
                                dayNumberEl.innerText = arg.date.getDate(); // <-- ÄNDRAD
                                
                                // All vinst-kod borttagen härifrån
                                
                                return { domNodes: [dayNumberEl] }; // <-- ÄNDRAD HÄR
                            }
                        },
                        timeGridWeek: {
                            displayEventTime: true,
                            titleFormat: { day: 'numeric', month: 'short' } // <-- NY RAD (Bonus)
                        },
                        timeGridDay: {
                            displayEventTime: true,
                            titleFormat: { day: 'numeric', month: 'short' } // <-- NY RAD (Bonus)
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
                        const isPast = dateKey < todayString;

                        // Om dagen är i dåtid, returnera ingenting (vit)
                        if (isPast) {
                            return [];
                        }

                        // Steg 1: Leta efter ett "synligt" jobb.
                        // Ett synligt jobb är ett som INTE är raderat OCH INTE är avbokat.
                        const hasVisibleJob = allJobs.some(j => 
                            !j.deleted && 
                            j.datum.startsWith(dateKey) && 
                            (j.status === 'bokad' || j.status === 'offererad' || j.status === 'klar')
                        );

                        // Steg 2: Här är den korrekta logiken.
                        // Om "hasVisibleJob" är FALSKT (!), då är dagen ledig.
                        if (!hasVisibleJob) { 
                            // Inga synliga jobb hittades = LEDIG DAG
                            return ['fc-day-free'];
                        }

                        // Om "hasVisibleJob" var SANT (ett jobb hittades), returnera ingenting (vit).
                        return [];
                    },
                    
                    eventContent: function(arg) {
                        // ... (resten av din eventContent-funktion är oförändrad) ...
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

			// --- MESSENGER KARUSELL LOGIK (UPDATERAD) ---

			let currentGalleryImages = [];
			let currentImageIndex = 0;
			
			window.openImageZoom = function(src) {
			    const modal = document.getElementById('imageZoomModal');
			    if (!modal) return;
			
			    // 1. Hämta alla bilder
			    const allImages = document.querySelectorAll('.chat-bubble-image img');
			    currentGalleryImages = Array.from(allImages).map(img => ({
			        src: img.src,
			        caption: "" 
			    }));
			
			    currentImageIndex = currentGalleryImages.findIndex(img => img.src === src);
			    if (currentImageIndex === -1) {
			        currentGalleryImages = [{ src: src, caption: "" }];
			        currentImageIndex = 0;
			    }
			
			    // 2. Uppdatera UI
			    updateCarouselUI();
			
			    history.pushState({ modal: 'imageZoom' }, 'Bild', '#image');
			    modal.style.display = "flex";
			    updateScrollLock();
			
			    // 3. Koppla knappar
			    document.getElementById('mmCloseBtn').onclick = () => history.back();
			    document.getElementById('mmShareBtn').onclick = downloadCurrentPhoto;
			    document.getElementById('mmForwardBtn').onclick = () => {
			        document.getElementById('mmForwardBtn').onclick = forwardCurrentPhoto;
			    };
			
			    // 4. KLICKA UTANFÖR FÖR ATT STÄNGA
			    // Vi lägger lyssnaren på containern bakom bilderna
			    const backdrop = document.getElementById('mmCarouselBackdrop');
			    if (backdrop) {
			        backdrop.onclick = (e) => {
			            // Om vi klickar direkt på backdropen (inte på en bild) -> Stäng
			            // e.target är det element vi klickade på. 
			            // Bilderna ligger i divvar (.mm-carousel-item).
			            // Om vi klickar på en bild, kommer e.target vara img.
			            if (e.target === backdrop || e.target.classList.contains('mm-carousel-item')) {
			                history.back();
			            }
			        };
			    }
			};
			
			function updateCarouselUI() {
			    const total = currentGalleryImages.length;
			    const counter = document.getElementById('mmCounter');
			    counter.textContent = total > 1 ? `${currentImageIndex + 1} av ${total}` : "";
			
			    const imgMain = document.getElementById('mmImgMain');
			    const imgPrev = document.getElementById('mmImgPrev');
			    const imgNext = document.getElementById('mmImgNext');
			
			    // Huvudbilden
			    imgMain.src = currentGalleryImages[currentImageIndex].src;
			
			    if (total > 1) {
			        // Räkna ut index för föregående (loopa runt)
			        let prevIndex = currentImageIndex - 1;
			        if (prevIndex < 0) prevIndex = total - 1;
			        
			        // Räkna ut index för nästa (loopa runt)
			        let nextIndex = currentImageIndex + 1;
			        if (nextIndex >= total) nextIndex = 0;
			
			        imgPrev.src = currentGalleryImages[prevIndex].src;
			        imgNext.src = currentGalleryImages[nextIndex].src;
			        
			        // Visa sidobilderna
			        imgPrev.parentElement.style.display = 'flex';
			        imgNext.parentElement.style.display = 'flex';
			    } else {
			        // Dölj sidobilderna om det bara finns en
			        imgPrev.parentElement.style.display = 'none';
			        imgNext.parentElement.style.display = 'none';
			    }
			}
			
			function navigateGallery(direction) {
			    if (currentGalleryImages.length <= 1) return;
			
			    currentImageIndex += direction;
			    if (currentImageIndex < 0) currentImageIndex = currentGalleryImages.length - 1;
			    if (currentImageIndex >= currentGalleryImages.length) currentImageIndex = 0;
			
			    updateCarouselUI();
			}
			
			function downloadCurrentPhoto() {
			    if (currentGalleryImages.length === 0) return;
			    const imgUrl = currentGalleryImages[currentImageIndex].src;
			    const a = document.createElement('a');
			    a.href = imgUrl;
			    a.download = imgUrl.split('/').pop().split('?')[0] || 'bild.jpg';
			    document.body.appendChild(a);
			    a.click();
			    document.body.removeChild(a);
			}

			// --- NY FUNKTION: Vidarebefordra från Chatt-menyn ---
			async function handleChatForward(messageId) {
			    if (!messageId) return;
			
			    try {
			        // 1. Hämta meddelandet från databasen
			        const doc = await db.collection("notes").doc(messageId).get();
			        if (!doc.exists) return;
			        const data = doc.data();
			
			        // 2. Kolla om det är BILD eller TEXT
			        if (data.type === 'image' || (data.images && data.images.length > 0)) {
			            // --- DET ÄR EN BILD ---
			            const imgUrl = (data.images && data.images.length > 0) ? data.images[0] : data.image;
			            
			            // Återanvänd logiken: Ladda ner blob och dela/kopiera
			            showToast("Hämtar bild...", "info");
			            const response = await fetch(imgUrl);
			            const blob = await response.blob();
			            const file = new File([blob], "bild.jpg", { type: blob.type });
			            
			            const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
			
			            if (isMobile && navigator.canShare && navigator.canShare({ files: [file] })) {
			                await navigator.share({ files: [file] });
			            } else {
			                await navigator.clipboard.write([new ClipboardItem({ [blob.type]: blob })]);
			                showToast("Bild kopierad!", "success");
			            }
			
			        } else {
			            // --- DET ÄR TEXT ---
			            const textToShare = data.text || "";
			            if (!textToShare) return;
			
			            const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
			
			            // På mobil: Öppna dela-meny för text
			            if (isMobile && navigator.share) {
			                await navigator.share({ text: textToShare });
			            } else {
			                // På dator: Kopiera text
			                await navigator.clipboard.writeText(textToShare);
			                showToast("Text kopierad!", "success");
			            }
			        }
			
			    } catch (err) {
			        console.error(err);
			        if (err.name !== 'AbortError') showToast("Kunde inte vidarebefordra.", "danger");
			    }
			}

			// --- UPPDATERAD FUNKTION: Vidarebefordra/Dela Bild ---
			let isSharingInProgress = false; // Förhindra dubbelklick
			
			async function forwardCurrentPhoto() {
			    // 1. SÄKERHETSKOLL: Om vi redan delar, avbryt.
			    if (isSharingInProgress) {
			        console.log("Delning pågår redan, ignorerar klick.");
			        return; 
			    }
			    
			    if (currentGalleryImages.length === 0) return;
			
			    // 2. LÅS KNAPPEN
			    isSharingInProgress = true;
			    
			    // Hämta knapp-elementet för att kunna ge visuell feedback (valfritt)
			    const btn = document.getElementById('mmForwardBtn');
			    if (btn) btn.style.opacity = "0.5"; // Visa att den jobbar
			
			    showToast("Hämtar bild...", "info");
			
			    const imgUrl = currentGalleryImages[currentImageIndex].src;
			
			    try {
			        // 3. HÄMTA BILDEN
			        const response = await fetch(imgUrl);
			        const blob = await response.blob();
			        const file = new File([blob], "bild.jpg", { type: blob.type });
			
			        // 4. DETEKTION: Mobil eller Dator
			        const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
			        
			        // Kontrollera om enheten faktiskt KAN dela filer
			        const canShareFiles = navigator.canShare && navigator.canShare({ files: [file] });
			
			        // --- SCENARIO A: MOBIL MED STÖD FÖR FIL-DELNING ---
			        if (isMobile && canShareFiles) {
			            try {
			                await navigator.share({
			                    files: [file],
			                    title: 'Bild från Jobbplanerare',
			                    text: '' 
			                });
			                // Om vi kommer hit har delnings-menyn öppnats/slutförts framgångsrikt
			            } catch (shareError) {
			                if (shareError.name !== 'AbortError') {
			                    console.error("Systemdelning misslyckades:", shareError);
			                    showToast("Kunde inte öppna delningsmenyn.", "danger");
			                }
			            }
			        } 
			        // --- SCENARIO B: DATOR ELLER MOBIL UTAN FIL-DELNING (Använd Urklipp) ---
			        else {
			            try {
			                // Försök skriva bild-blob till urklipp
			                await navigator.clipboard.write([
			                    new ClipboardItem({ [blob.type]: blob })
			                ]);
			                showToast("Bild kopierad! (Klistra in med Ctrl+V)", "success");
			            } catch (clipboardErr) {
			                console.error("Urklippsfel:", clipboardErr);
			                
			                // Fallback: Kopiera länk om bild inte gick
			                try {
			                    await navigator.clipboard.writeText(imgUrl);
			                    showToast("Bildlänk kopierad istället.", "info");
			                } catch (linkErr) {
			                    showToast("Kunde inte kopiera bild eller länk.", "warning");
			                }
			            }
			        }
			
			    } catch (err) {
			        console.error("Huvudfel vid delning:", err);
			        showToast("Ett fel uppstod.", "danger");
			    } finally {
			        // 5. VIKTIGT: LÅS ALLTID UPP KNAPPEN (Oavsett vad som hände)
			        isSharingInProgress = false;
			        if (btn) btn.style.opacity = "1"; // Återställ knappens utseende
			    }
			}
			
			// --- SWIPE & KEYBOARD ---
			const imageModal = document.getElementById('imageZoomModal');
			let imgTouchStartX = 0; let imgTouchEndX = 0;
			if (imageModal) {
			    imageModal.addEventListener('touchstart', (e) => imgTouchStartX = e.changedTouches[0].screenX, {passive: true});
			    imageModal.addEventListener('touchend', (e) => {
			        imgTouchEndX = e.changedTouches[0].screenX;
			        if (imgTouchEndX < imgTouchStartX - 50) navigateGallery(1); // Swipe Vänster -> Nästa
			        if (imgTouchEndX > imgTouchStartX + 50) navigateGallery(-1); // Swipe Höger -> Föregående
			    }, {passive: true});
			}
			document.addEventListener('keydown', (e) => {
			    const modal = document.getElementById('imageZoomModal');
			    if (modal && modal.style.display !== 'none') {
			        if (e.key === 'ArrowLeft') navigateGallery(-1);
			        if (e.key === 'ArrowRight') navigateGallery(1);
			        if (e.key === 'Escape') history.back();
			    }
			});

			// --- STÄNG CHATT VID KLICK UTANFÖR ---
			document.addEventListener('click', (e) => {
			    // 1. IGNORERA KLICK PÅ LÄNKAR OCH KNAPPAR
			    if (e.target.closest('a') || e.target.closest('.chat-reg-link') || e.target.closest('button')) {
			        return;
			    }

				if (e.target.closest('#reactionMenu')) {
			        return;
			    }

                // --- FIX HÄR: Klickade vi på en modal-bakgrund? ---
                // Om vi klickar på den mörka bakgrunden av en modal, låt modalen hantera stängningen själv.
                // Stäng INTE chatten i detta läge.
                if (e.target.classList.contains('modal-backdrop')) {
                    return;
                }
                // --------------------------------------------------
			
			    // 2. SÄKERHETSKOLL: Är någon modal öppen?
			    const activeModal = document.querySelector('.modal-backdrop.show');
			    // Om en modal är öppen (och det inte är sök-modalen eller chatten själv), rör inget.
			    if (activeModal && activeModal.id !== 'chatWidget' && activeModal.id !== 'mobileSearchModal') {
			        return;
			    }
			
			    const chatWidget = document.getElementById('chatWidget');
			    const fabChat = document.getElementById('fabChat');
			    const mobileChatBtn = document.getElementById('mobileChatBtn');
			
			    // 3. Om chatten är öppen...
			    if (chatWidget && chatWidget.style.display === 'flex') {
			        
			        // ...och vi klickar utanför själva rutan...
			        if (!chatWidget.contains(e.target) && 
			            (!fabChat || !fabChat.contains(e.target)) &&
			            (!mobileChatBtn || !mobileChatBtn.contains(e.target))) {
			            
			            // Stäng via historik om vi är i chatt-läget
			            if (window.location.hash === '#chat') {
			                history.back();
			            } else {
			                // Fallback
			                chatWidget.style.display = 'none';
			                updateScrollLock();
			                if (mobileChatBtn) mobileChatBtn.classList.remove('active');
			            }
			        }
			    }
			});

			// --- HANTERA CHATT-WIDGET ---
			const chatWidget = document.getElementById('chatWidget');
			const fabChat = document.getElementById('fabChat');
			const closeChatWidgetBtn = document.getElementById('closeChatWidget');
			
			function toggleChatWidget() {
			    if (!chatWidget) return;
			    
			    const isVisible = chatWidget.style.display === 'flex';
			    
			    if (isVisible) {
			        // Om vi är på #chat i historiken -> Backa
			        if (window.location.hash === '#chat') {
			            history.back();
			        } else {
			            // Om vi är synliga men inte har #chat (buggfall) -> Stäng manuellt
			            closeChatUI();
			        }
			    } else {
			        // Öppna
			        history.pushState({ modal: 'chatWidget' }, 'Notiser', '#chat');
			        openChatUI();
			    }
			}
			
			// Hjälpfunktioner (Se till att du har dessa, eller skapa dem nu)
			function openChatUI() {
			    chatWidget.style.display = 'flex';
			    
                // Starta/Ladda om chatten
                if (typeof initChat === 'function') initChat();
			    
                // --- NYTT: Tvinga scroll till botten ---
                forceChatScrollBottom();
                // ---------------------------------------

			    isModalOpen = false;
			    updateScrollLock();
			}
			
			function closeChatUI() {
			    chatWidget.style.display = 'none';
			    const mobileChatBtn = document.getElementById('mobileChatBtn');
			    if(mobileChatBtn) mobileChatBtn.classList.remove('active');
				if (typeof hideReactionMenu === 'function') hideReactionMenu();
			    updateScrollLock();
			}
			
			if (fabChat) fabChat.onclick = toggleChatWidget;
			
			// FIXAD X-KNAPP: Kollar historiken
			if (closeChatWidgetBtn) closeChatWidgetBtn.onclick = () => {
			    if (window.location.hash === '#chat') {
			        history.back();
			    } else {
			        closeChatUI();
			    }
			};

			function updateScrollLock() {
			    const chatWidget = document.getElementById('chatWidget');
			    const imageModal = document.getElementById('imageZoomModal');
			    const anyModalOpen = document.querySelector('.modal-backdrop.show'); 
			    const isMobile = window.innerWidth <= 768;
			
			    const isChatOpen = chatWidget && chatWidget.style.display === 'flex';
			    const isImageOpen = imageModal && imageModal.style.display !== 'none';
			
			    // Om bild är öppen, eller annan modal, eller (chatt + mobil) -> LÅS
			    if (isImageOpen || anyModalOpen || (isChatOpen && isMobile)) {
			        document.body.style.overflow = 'hidden';
			    } else {
			        document.body.style.overflow = '';
			    }
			}

			// --- Ny Hjälpfunktion: Tvinga chatten till botten ---
			function forceChatScrollBottom() {
			    const chatList = document.getElementById('chatMessages');
			    if (!chatList) return;
			
			    // Gör omedelbart
			    chatList.scrollTop = chatList.scrollHeight;
			
			    // Gör det igen efter en kort stund (om layouten ändras/tangentbord)
			    setTimeout(() => {
			        chatList.scrollTop = chatList.scrollHeight;
			    }, 50);
			    
			    // En sista gång för säkerhets skull (om bilder laddas)
			    setTimeout(() => {
			        chatList.scrollTop = chatList.scrollHeight;
			    }, 300);
			}

			// --- REAKTION / TAPBACK FUNKTIONER ---

			// 1. Skapa menyn (körs en gång)
			function createReactionMenu() {
			    if (document.getElementById('reactionMenu')) return; 
			
			    const menu = document.createElement('div');
			    menu.id = 'reactionMenu';
			    menu.className = 'reaction-menu';
			    
			    // --- RAD 1: EMOJIS (Oförändrad) ---
			    const emojiRow = document.createElement('div');
			    emojiRow.style.display = 'flex';
			    emojiRow.style.justifyContent = 'space-between';
			    emojiRow.style.width = '100%';
			    emojiRow.style.marginBottom = '8px';
			    
			    const emojis = ['✅', '❌', '⚠️', '🕓', '❤️', '👍']; 
			    emojis.forEach(icon => {
			        const span = document.createElement('span');
			        span.className = 'reaction-option';
			        span.textContent = icon;
			        span.onclick = (e) => {
			            e.stopPropagation();
			            applyReaction(menu.dataset.targetId, icon);
			            hideReactionMenu();
			        };
			        emojiRow.appendChild(span);
			    });
			    menu.appendChild(emojiRow);
			
			    // --- RAD 2: ACTIONS (Messenger Style) ---
			    const actionRow = document.createElement('div');
			    actionRow.className = 'reaction-actions-row';
			
			    // Helper för att skapa action-knappar
			    const createAction = (label, iconId, onClick, isDanger = false) => {
			        const wrapper = document.createElement('div');
			        wrapper.className = `action-item ${isDanger ? 'danger' : ''}`;
			        wrapper.onclick = (e) => {
			            e.stopPropagation();
			            onClick(menu.dataset.targetId);
			            hideReactionMenu();
			        };
			
			        const circle = document.createElement('div');
			        circle.className = 'icon-circle';
			        // Om du inte har alla ikoner, använd #icon-pencil som fallback eller lägg till nya i HTML
			        circle.innerHTML = `<svg class="icon-sm" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><use href="${iconId}"></use></svg>`;
			        
			        const text = document.createElement('span');
			        text.textContent = label;
			
			        wrapper.appendChild(circle);
			        wrapper.appendChild(text);
			        return wrapper;
			    };
			
			    // 1. Redigera
			    actionRow.appendChild(createAction('Redigera', '#icon-pencil', (id) => enterEditMode(id)));
			    
			    // 2. Kopiera
			    actionRow.appendChild(createAction('Kopiera', '#icon-duplicate', (id) => copyMessageText(id)));
			    
			    // 3. Ta bort (Soptunna)
			    actionRow.appendChild(createAction('Ta bort', '#icon-trash', (id) => {
			        if (confirm("Radera detta meddelande permanent?")) {
			            db.collection("notes").doc(id).delete().catch(err => showToast("Fel: " + err.message, "danger"));
			        }
			    }, true)); // true = danger class
			
			    // 4. Vidarebefodra
			    actionRow.appendChild(createAction('Vidarebefordra', '#icon-forward-arrow', (id) => {
			         // Anropa den nya funktionen och skicka med ID
			         handleChatForward(id); 
			         // hideReactionMenu() anropas automatiskt av createAction-hjälparen i din kod,
			         // men om menyn inte stängs kan du lägga till hideReactionMenu() här.
			    }));
			
			    menu.appendChild(actionRow);
			    document.body.appendChild(menu);
			
			    const handleGlobalClick = (e) => {
		        const menu = document.getElementById('reactionMenu');
		        
		        // Om menyn är öppen och vi klickar utanför den...
		        if (menu && menu.classList.contains('show') && !menu.contains(e.target)) {
		            // Om klicket inte träffade menyn -> Stäng den!
		            e.preventDefault(); 
		            e.stopPropagation();
		            hideReactionMenu();
		        }
		    };
		
		    // Använd "touchstart" för snabbare respons på mobil, annars "click"
		    // passive: false är viktigt här för att kunna använda e.preventDefault()
		    window.addEventListener('touchstart', handleGlobalClick, { passive: false });
		    window.addEventListener('click', handleGlobalClick);
		    window.addEventListener('scroll', hideReactionMenu, true);
			}
			
			// --- NY HJÄLPFUNKTION: REDIGERA MEDDELANDE ---
			async function editMessage(id) {
			    if (!id) return;
			    
			    try {
			        const doc = await db.collection("notes").doc(id).get();
			        if (!doc.exists) return;
			        
			        const data = doc.data();
			        
			        // Hämta befintlig text eller bildtext
			        const currentText = data.text || data.caption || "";
			        
			        // Enkel prompt för redigering (kan bytas mot modal om du vill ha snyggare)
			        const newText = prompt("Redigera text:", currentText);
			        
			        // Om användaren trycker "Avbryt" (null), gör inget. Tom sträng "" är ok (radera text).
			        if (newText === null) return;
			
			        // Uppdatera rätt fält beroende på typ
			        if (data.type === 'image' || data.images) {
			            await db.collection("notes").doc(id).update({ caption: newText });
			        } else {
			            await db.collection("notes").doc(id).update({ text: newText });
			        }
			        
			        showToast("Meddelande uppdaterat!", "success");
			        
			    } catch (err) {
			        console.error("Kunde inte redigera:", err);
			        showToast("Något gick fel.", "danger");
			    }
			}
			
			// NY HJÄLPFUNKTION: Kopiera text
			async function copyMessageText(id) {
			    if (!id) return;
			    try {
			        const doc = await db.collection("notes").doc(id).get();
			        if (doc.exists) {
			            const data = doc.data();
			            const textToCopy = data.text || (data.image ? "[Bild]" : "");
			            
			            if (textToCopy) {
			                await navigator.clipboard.writeText(textToCopy);
			                
			                // --- FIX: Visa BARA notis om vi är på Desktop ---
			                if (window.innerWidth > 768) {
			                    showToast("Notis kopierad till urklipp!", "success");
			                }
			                // ------------------------------------------------
			                
			            } else {
			                if (window.innerWidth > 768) {
			                    showToast("Inget textinnehåll att kopiera.", "info");
			                }
			            }
			        }
			    } catch (err) {
			        console.error("Kunde inte kopiera", err);
			        if (window.innerWidth > 768) {
			            showToast("Misslyckades att kopiera.", "danger");
			        }
			    }
			}
			
			// 2. Visa menyn vid långtryck
			function showReactionMenu(x, y, messageId) {
			    createReactionMenu(); 
			    const menu = document.getElementById('reactionMenu');
			    
			    // Avbryt eventuell pågående stängning!
			    if (menuHideTimer) clearTimeout(menuHideTimer);
			
			    menu.dataset.targetId = messageId;
			    
			    // 1. Återställ menyn för mätning (men osynlig)
			    menu.style.display = 'flex';
			    menu.style.visibility = 'hidden'; 
			    menu.style.opacity = '0';          
			    menu.style.transform = 'scale(0.8)'; // Starta liten
			    menu.style.pointerEvents = 'none';   // Ej klickbar under mätning
			    menu.classList.remove('show');    
			
			    // ... (HÄR LIGGER DIN BEFINTLIGA LOGIK FÖR X/Y POSITIONERING) ...
			    // ... Behåll koden som räknar ut 'left' och 'top' här ...
			    // (Kopiera den logiken från din nuvarande fil eller se nedan för referens)
			    
			    // EXEMPEL PÅ POSITIONERING (Klistra in din logik här):
			    const menuWidth = menu.offsetWidth;
			    const screenWidth = window.innerWidth;
			    let left = x - (menuWidth / 2);
			    if (left + menuWidth > screenWidth - 15) left = screenWidth - menuWidth - 15;
			    if (left < 15) left = 15;
			    let top = y - 70;
			    if (top < 20) top = y + 20;
			    menu.style.left = `${left}px`;
			    menu.style.top = `${top}px`;
			    // ... SLUT POSITIONERING ...
			
			    // 2. Visa menyn (Animation)
			    // Vi använder requestAnimationFrame för att garantera att webbläsaren hinner uppfatta "display: flex" innan vi lägger på klassen
			    requestAnimationFrame(() => {
			        menu.style.visibility = 'visible';
			        menu.style.opacity = '1';
			        menu.classList.add('show');
			        
			        // Aktivera klick efter en kort stund (Säkerhetsbuffert mot spök-klick)
			        setTimeout(() => {
			            if (menu.classList.contains('show')) {
			                menu.style.pointerEvents = 'auto';
			            }
			        }, 150); // Kortare tid (150ms) för rappare känsla
			    });
			    
			    if (navigator.vibrate) navigator.vibrate(10); 
			}
			
			let menuHideTimer = null; // Global variabel (läggs utanför funktionen)

			function hideReactionMenu() {
			    const menu = document.getElementById('reactionMenu');
			    if (!menu) return;
			
			    menu.classList.remove('show');
			    menu.style.pointerEvents = 'none'; // Gör oklickbar direkt
			
			    if (menuHideTimer) clearTimeout(menuHideTimer);
			    
			    // Vänta på animationen (200ms) innan den döljs helt
			    menuHideTimer = setTimeout(() => {
			        menu.style.display = 'none';
			        menu.style.visibility = 'hidden';
			    }, 200);
			}
			
			// 3. Spara till Firebase
			function applyReaction(id, icon) {
			    if (!id) return;
			    
			    // Hämta nuvarande reaktion först för att kunna "toggla" (ta bort om man klickar samma)
			    db.collection("notes").doc(id).get().then(doc => {
			        if (doc.exists) {
			            const current = doc.data().reaction;
			            // Om man klickar på samma ikon igen -> Ta bort den (null). Annars sätt ny.
			            const newReaction = (current === icon) ? null : icon;
			            
			            db.collection("notes").doc(id).update({
			                reaction: newReaction
			            }).catch(err => console.error("Kunde inte spara reaktion", err));
			        }
			    });
			}

			let chatUnsubscribe = null; // För att kunna stänga av lyssnaren

			let currentChatLimit = 50; // Hur många meddelanden vi laddar
            let isFetchingOlderChat = false;

			function initChat() {
			    const chatList = document.getElementById('chatMessages');
			    
			    // OBS: Vi hämtar inte längre 'chatForm' eftersom det är en div nu
			    const chatInput = document.getElementById('chatInput');
			    const chatSendBtn = document.getElementById('chatSendBtn'); // Ny knapp
			    
			    // --- KNAPPAR & ELEMENT ---
			    const chatBackBtn = document.getElementById('chatBackBtn');
			    const searchInput = document.getElementById('chatSearchInput');
			    const clearBtn = document.getElementById('clearChatSearch');
			    const galleryToggleBtn = document.getElementById('toggleChatGallery'); 
			    
			    const plusBtn = document.getElementById('chatPlusBtn');     
			    const cameraBtn = document.getElementById('chatCameraBtn'); 
			    
			    const fileInputGallery = document.getElementById('chatFileInputGallery');
			    const fileInputCamera = document.getElementById('chatFileInputCamera');
			
			    if (!chatList) return; // Tog bort check för chatForm
			    
			    if (typeof currentChatLimit === 'undefined') {
			        window.currentChatLimit = 50;
			    } else {
			        currentChatLimit = 50;
			    }

				let editingMessageId = null; // Håller koll på vilket ID vi redigerar

			    // Hämta de nya elementen vi skapade i HTML
			    const chatEditHeader = document.getElementById('chatEditHeader');
			    const chatEditOverlay = document.getElementById('chatEditOverlay');
			    const cancelEditBtn = document.getElementById('cancelEditBtn');
			    const chatInputArea = document.getElementById('chatInputArea');
			
			    // Funktion för att STARTA redigering (Måste vara window. för att menyn ska hitta den)
			    window.enterEditMode = async (id) => {
			        if (!id) return;
			        try {
			            const doc = await db.collection("notes").doc(id).get();
			            if (!doc.exists) return;
			            const data = doc.data();
			
			            // Spara ID och fyll i text
			            editingMessageId = id;
			            
			            // Fyll input med texten (eller bildtexten om det är en bild)
			            chatInput.value = data.text || data.caption || "";
			            
			            // Visa UI för redigering
			            if(chatEditHeader) chatEditHeader.style.display = 'flex';
			            if(chatEditOverlay) chatEditOverlay.classList.add('show');
			            if(chatInputArea) chatInputArea.classList.add('editing-mode');
			            
			            // Fokusera och flytta markören till slutet
			            chatInput.focus();
			            // Litet hack för att sätta markören sist
			            /*const val = chatInput.value; 
			            chatInput.value = ''; 
			            chatInput.value = val;*/ 
			
			        } catch (err) {
			            console.error(err);
			            showToast("Kunde inte hämta meddelande", "danger");
			        }
			    };
			
			    // Funktion för att AVBRYTA redigering
			    const exitEditMode = () => {
			        editingMessageId = null;
			        chatInput.value = '';
			        
			        if(chatEditHeader) chatEditHeader.style.display = 'none';
			        if(chatEditOverlay) chatEditOverlay.classList.remove('show');
			        if(chatInputArea) chatInputArea.classList.remove('editing-mode');
			    };
			
			    // Koppla krysset i redigerings-headern
			    if (cancelEditBtn) {
			        cancelEditBtn.onclick = (e) => {
			            e.preventDefault();
			            exitEditMode();
			        };
			    }

				// --- LOGIK FÖR ATT DÖLJA KNAPPAR VID SKRIVNING (MOBIL) ---
			    const innerInputActions = document.querySelector('.inner-input-actions');
			    let inputFocusTimer = null;
			
			    if (chatInput && innerInputActions) {
			        
			        // Hjälpfunktion för att visa/dölja
			        const toggleInputButtons = (show) => {
			            // Kör bara detta på mobil (skärmbredd under 768px)
			            if (window.innerWidth > 768) return; 
			
			            if (show) {
			                innerInputActions.style.display = 'flex';
			                innerInputActions.style.opacity = '1';
			                // Justera padding så texten inte överlappar knapparna när de syns
			                chatInput.style.paddingRight = '3rem'; // Plats för ikonerna
			            } else {
			                innerInputActions.style.display = 'none';
			                innerInputActions.style.opacity = '0';
			                // Ge mer plats åt texten när knapparna är borta
			                chatInput.style.paddingRight = '1rem'; 
			            }
			        };
			
			        // 1. När man klickar i fältet (Focus)
			        chatInput.addEventListener('focus', () => {
			            // Om fältet är tomt, dölj tillfälligt i 4 sekunder
			            if (chatInput.value.trim() === "") {
			                toggleInputButtons(false);
			                
			                clearTimeout(inputFocusTimer);
			                inputFocusTimer = setTimeout(() => {
			                    // Om det fortfarande är tomt efter 4 sek, visa igen och återställ padding
			                    if (chatInput.value.trim() === "") {
			                        toggleInputButtons(true);
			                    }
			                }, 4000);
			            } else {
			                // Om det redan finns text, dölj direkt
			                toggleInputButtons(false);
			            }
			        });
			
			        // 2. När man skriver (Input)
			        chatInput.addEventListener('input', () => {
			            clearTimeout(inputFocusTimer); // Avbryt 4-sekunders timern
			
			            if (chatInput.value.trim() !== "") {
			                toggleInputButtons(false);
			            } else {
			                toggleInputButtons(true);
			            }
			        });
			
			        // 3. När man lämnar fältet (Blur)
			        chatInput.addEventListener('blur', () => {
			            // Återställ alltid knapparna när man är klar
			            setTimeout(() => toggleInputButtons(true), 200); 
			        });
			    }
			
			    // --- NY FUNKTION FÖR ATT SKICKA ---
			    const sendMessage = async () => {
				    const text = chatInput.value.trim();
				    if (!text) return; // Skicka inget tomt
				    
				    // --- REDIGERINGSLÄGE ---
				    if (editingMessageId) {
				        try {
				            // Uppdatera befintligt
				            // Kolla först om det var en bild (caption) eller text
				            // För enkelhetens skull, uppdatera 'text' om den finns, annars 'caption'
				            // Men enklast är att göra en get() först eller bara köra update
				            
				            // Vi antar att det är ett textfält vi redigerar.
				            // Om din datastruktur skiljer på text/caption, måste vi veta vilken.
				            // En enkel lösning: Uppdatera 'text' fältet.
				            
				            await db.collection("notes").doc(editingMessageId).update({
				                text: text, // Eller caption beroende på din datamodell
				                isEdited: true // Bra att ha för framtiden
				            });
				            
				            showToast("Meddelande uppdaterat", "success");
				            exitEditMode(); // Stäng läget
				        } catch (err) {
				            console.error(err);
				            showToast("Kunde inte spara ändring", "danger");
				        }
				        return; // VIKTIGT: Avbryt här så vi inte skapar nytt
				    }
				
				    // --- VANLIGT NYTT MEDDELANDE ---
				    try {
				        await db.collection("notes").add({
				            text: text,
				            timestamp: new Date().toISOString(),
				            platform: window.innerWidth <= 768 ? 'mobil' : 'dator'
				        });
				        chatInput.value = '';
				        setTimeout(() => chatList.scrollTop = chatList.scrollHeight, 100);
				        if(window.innerWidth > 768) chatInput.focus();
				    } catch (err) {
				        showToast("Kunde inte skicka notis.", "danger");
				    }
				};
			
			    // Koppla Skicka-knappen (Klick)
			    if (chatSendBtn) {
			        chatSendBtn.onclick = (e) => {
			            e.preventDefault();
			            sendMessage();
			        };
			    }
			
			    // --- 1. HANTERA KNAPPAR ---
			
			    if (chatBackBtn) {
			        chatBackBtn.onclick = (e) => {
			            e.preventDefault();
			            if (window.location.hash === '#chat') {
			                history.back();
			            } else {
			                closeChatUI();
			            }
			        };
			    }
			
			    if (plusBtn && fileInputGallery) {
			        plusBtn.onclick = (e) => {
			            e.preventDefault();
			            fileInputGallery.click();
			        };
			        fileInputGallery.onchange = (e) => { 
			            handleImageUpload(e.target.files[0]); 
			            fileInputGallery.value = ''; 
			        };
			    }
			
			    if (cameraBtn && fileInputCamera) {
			        cameraBtn.onclick = (e) => {
			            e.preventDefault();
			            fileInputCamera.click();
			        };
			        fileInputCamera.onchange = (e) => { 
			            handleImageUpload(e.target.files[0]); 
			            fileInputCamera.value = ''; 
			        };
			    }
			
			    if (galleryToggleBtn) {
			        galleryToggleBtn.onclick = (e) => {
			            e.preventDefault();
			            chatList.classList.toggle('gallery-mode');
			            const isActive = chatList.classList.contains('gallery-mode');
			            galleryToggleBtn.style.color = isActive ? 'var(--primary-color)' : 'var(--text-color-light)';
			            if (!isActive) setTimeout(() => chatList.scrollTop = chatList.scrollHeight, 100);
			        };
			    }
			
			    // --- 2. SÖKFUNKTION ---
			    if (searchInput) {
			        const filterChat = () => {
			            const term = searchInput.value.toLowerCase();
			            const bubbles = chatList.querySelectorAll('.chat-bubble');
			            const times = chatList.querySelectorAll('.chat-time');
			            
			            if (clearBtn) clearBtn.style.display = term ? 'flex' : 'none';
			            
			            bubbles.forEach((bubble, index) => {
			                const originalHTML = bubble.dataset.originalHtml || bubble.innerHTML;
			                const textContent = bubble.textContent.toLowerCase();
			                const isMatch = textContent.includes(term);
			                const isImage = bubble.classList.contains('chat-bubble-image');
			                const timeElement = times[index];
			
			                if (isMatch || (isImage && !term)) {
			                    bubble.style.display = 'block';
			                    if (timeElement) timeElement.style.display = 'block';
			                    if (term && !isImage) {
			                        const regex = new RegExp(`(${term})`, 'gi');
			                        bubble.innerHTML = originalHTML.replace(regex, '<mark>$1</mark>');
			                    } else {
			                        bubble.innerHTML = originalHTML;
			                    }
			                } else {
			                    bubble.style.display = 'none';
			                    if (timeElement) timeElement.style.display = 'none';
			                }
			            });
			        };
			        
			        searchInput.oninput = filterChat;
			        if (clearBtn) {
			            clearBtn.onclick = () => { 
			                searchInput.value = ''; 
			                filterChat(); 
			                searchInput.focus(); 
			            };
			        }
			    }
			
			    // --- 3. FOCUS/BLUR LOGIK ---
			    if (chatInput && !chatInput.dataset.focusListenerAttached) {
			        chatInput.dataset.focusListenerAttached = "true";
			        const mobileNav = document.getElementById('mobileNav');
			        const timelineView = document.getElementById('timelineView'); 
			        const fabAddJob = document.getElementById('fabAddJob'); 
			        
			        chatInput.addEventListener('focus', () => {
			            if (window.innerWidth > 768) return; 
			            if (mobileNav) mobileNav.style.display = 'none';
			            if (timelineView) timelineView.style.display = 'none';
			            if (fabAddJob) fabAddJob.style.display = 'none';
			        });
			
			        chatInput.addEventListener('blur', () => {
			            if (window.innerWidth > 768) return;
			            setTimeout(() => {
			                if (mobileNav) mobileNav.style.display = 'flex';
			                if (timelineView && currentView === 'timeline') timelineView.style.display = 'block'; 
			                if (fabAddJob) fabAddJob.style.display = 'flex';
			            }, 100);
			        });
			        
			        // --- NYTT: Lyssna på ENTER eftersom vi inte har ett formulär ---
			        chatInput.addEventListener('keydown', (e) => {
			            if (e.key === 'Enter') {
			                e.preventDefault(); // Stoppa radbrytning
			                sendMessage();
			            }
			        });
			    }
			
			    // --- 4. TEXT-GENVÄGAR ---
			    const textShortcuts = {
			        ':olja': '🛢', ':däck': '🛞', ':bil': '🚗',
			        ':nyckel': '🔑', ':ok': '✅', ':fel': '❌',
			        ':varning': '⚠️', ':pengar': '💸', ':mek': '👨‍🔧'
			    };
			
			    if (chatInput) {
			        chatInput.addEventListener('input', (e) => {
			            let val = e.target.value;
			            if (val.endsWith(' ')) {
			                const words = val.split(' ');
			                const lastWord = words[words.length - 2]; 
			                if (textShortcuts[lastWord]) {
			                    const newVal = val.slice(0, - (lastWord.length + 1)) + textShortcuts[lastWord] + ' ';
			                    const cursorPos = e.target.selectionStart - (lastWord.length + 1) + textShortcuts[lastWord].length + 1;
			                    e.target.value = newVal;
			                    e.target.setSelectionRange(cursorPos, cursorPos);
			                }
			            }
			        });
			        
			        if (!chatInput.dataset.pasteListenerAttached) {
			            chatInput.addEventListener('paste', async (e) => {
			                const items = (e.clipboardData || e.originalEvent.clipboardData).items;
			                for (let item of items) {
			                    if (item.type.indexOf("image") === 0) {
			                        e.preventDefault();
			                        const blob = item.getAsFile();
			                        handleImageUpload(blob);
			                        return;
			                    }
			                }
			            });
			            chatInput.dataset.pasteListenerAttached = "true";
			        }
			    }
			
			    // --- 5. BILDUPPLADDNING ---
			    const handleImageUpload = async (file) => {
	                if (!file) return;
	                
	                // HÄR TOG VI BORT: const caption = prompt(...)
	                
	                showToast("Bearbetar bild...", "info");
	        
	                try {
	                    const base64Image = await compressImage(file);
	                    await db.collection("notes").add({
	                        image: base64Image,
	                        caption: "", // Vi skickar tom text automatiskt
	                        type: 'image',
	                        timestamp: new Date().toISOString(),
	                        platform: window.innerWidth <= 768 ? 'mobil' : 'dator'
	                    });
	                    showToast("Bild skickad!", "success");
	                    setTimeout(() => chatList.scrollTop = chatList.scrollHeight, 100);
	                } catch (err) {
	                    console.error(err);
	                    showToast("Kunde inte skicka bilden.", "danger");
	                }
	            };
			
			    // --- 6. HUVUDLYSSNAREN ---
			    const setupChatListener = (limit) => {
			        if (chatUnsubscribe) chatUnsubscribe(); 
			        const isLoadMore = limit > 50; 
			        
			        chatUnsubscribe = db.collection("notes")
			            .orderBy("timestamp", "desc") 
			            .limit(limit)                 
			            .onSnapshot(snapshot => {
			                
			                const threshold = 150; 
			                const scrollBottom = chatList.scrollHeight - chatList.scrollTop - chatList.clientHeight;
			                const wasAtBottom = scrollBottom <= threshold || chatList.childElementCount === 0;
			                const previousScrollTop = chatList.scrollTop;
			
			                const docs = [];
			                snapshot.forEach(doc => docs.push({ id: doc.id, ...doc.data() }));
			                docs.reverse(); 
			
			                chatList.innerHTML = ''; 
			                
			                if (docs.length === 0) {
			                    chatList.innerHTML = '<div class="empty-state-chat"><p>Skriv en notis eller ta en bild...</p></div>';
			                    return;
			                }
			
			                docs.forEach(data => {
			                    renderChatBubble(data.id, data, chatList);
			                });
			
			                // --- SPACER (SÅ INGET DÖLJS) ---
			                const spacer = document.createElement('div');
			                spacer.style.height = "50px"; 
			                spacer.style.flexShrink = "0"; 
			                chatList.appendChild(spacer);
			
			                if (searchInput && searchInput.value.trim() !== "") {
			                    searchInput.dispatchEvent(new Event('input'));
			                }
			
			                const isSearching = searchInput && searchInput.value.trim() !== "";
			                
			                if (!isSearching) {
			                    if (isLoadMore && isFetchingOlderChat) {
			                        const newScrollHeight = chatList.scrollHeight;
			                        // Justering eftersom vi lade till spacern, scrollTop kan bete sig annorlunda.
			                        // Enkel lösning: Låt användaren scrolla lite till.
			                        isFetchingOlderChat = false; 
			                    } else if (!isLoadMore) {
			                        if (!chatList.classList.contains('gallery-mode')) {
			                            if (wasAtBottom) {
			                                chatList.scrollTop = chatList.scrollHeight;
			                            } else {
			                                chatList.scrollTop = previousScrollTop; 
			                            }
			                        }
			                    }
			                }
			            });
			    };
			
			    setupChatListener(currentChatLimit);
			
			    // --- 7. LADDA ÄLDRE ---
			    chatList.addEventListener('scroll', () => {
			        if (chatList.scrollTop === 0 && !isFetchingOlderChat && !chatList.classList.contains('gallery-mode')) {
			            isFetchingOlderChat = true;
			            currentChatLimit += 50; 
			            setTimeout(() => { setupChatListener(currentChatLimit); }, 200);
			        }
			    });
			
			    // --- 8. KLICK-HANTERARE ---
			    if (!chatList.dataset.clickListenerAttached) {
			        chatList.addEventListener('click', (e) => {
			            const regLink = e.target.closest('.chat-reg-link');
			            if (regLink) {
			                e.preventDefault(); e.stopPropagation();
			                const regnr = regLink.dataset.reg;
			                if (typeof openCarModal === 'function') openCarModal(regnr);
			                return; 
			            }
			            const customerLink = e.target.closest('.chat-customer-link');
			            if (customerLink) {
			                e.preventDefault(); e.stopPropagation();
			                const kundnamn = customerLink.dataset.kund;
			                if (typeof openCustomerModal === 'function') openCustomerModal(kundnamn);
			                return;
			            }
			        });
			        chatList.dataset.clickListenerAttached = "true";
			    }
			}

			// --- HJÄLPFUNKTION: Komprimera Bild ---
			function compressImage(file) {
			    return new Promise((resolve, reject) => {
			        const reader = new FileReader();
			        reader.readAsDataURL(file);
			        
			        reader.onload = (event) => {
			            const img = new Image();
			            img.src = event.target.result;
			            
			            img.onload = () => {
			                const maxWidth = 800; // Max bredd i pixlar (håller storleken nere)
			                const scaleSize = maxWidth / img.width;
			                const newWidth = (img.width > maxWidth) ? maxWidth : img.width;
			                const newHeight = (img.width > maxWidth) ? (img.height * scaleSize) : img.height;
			
			                const canvas = document.createElement('canvas');
			                canvas.width = newWidth;
			                canvas.height = newHeight;
			
			                const ctx = canvas.getContext('2d');
			                ctx.drawImage(img, 0, 0, newWidth, newHeight);
			
			                // Konvertera till JPEG med 70% kvalitet
			                // Detta ger en sträng som ser ut typ: "data:image/jpeg;base64,/9j/4AAQSk..."
			                const dataUrl = canvas.toDataURL('image/jpeg', 0.7);
			                resolve(dataUrl);
			            };
			            img.onerror = (err) => reject(err);
			        };
			        reader.onerror = (err) => reject(err);
			    });
			}

			// Hjälpfunktion: Gör länkar klickbara
			function linkify(text) {
			    if (!text) return "";
			
			    // 1. Först "säkrar" vi texten (så att <script> inte kan köras om någon skriver det)
			    let safeText = text
			        .replace(/&/g, "&amp;")
			        .replace(/</g, "&lt;")
			        .replace(/>/g, "&gt;")
			        .replace(/"/g, "&quot;")
			        .replace(/'/g, "&#039;");
			
			    // 2. Regex för att hitta URL:er (http/https)
			    const urlPattern = /(https?:\/\/[^\s]+)/g;
			
			    // 3. Byt ut URL:en mot en <a> tagg
			    return safeText.replace(urlPattern, (url) => {
			        return `<a href="${url}" target="_blank" rel="noopener noreferrer" class="chat-link">${url}</a>`;
			    });
			}

			function highlightCustomerNames(text) {
			    if (!text || !allJobs || allJobs.length === 0) return text;
			
			    // 1. Hämta alla unika kundnamn, rensa tomma, och ta bort väldigt korta namn (mindre än 3 bokstäver) för att undvika felträffar
			    const uniqueNames = [...new Set(allJobs.map(j => j.kundnamn))]
			        .filter(name => name && name.length > 2);
			
			    // 2. Sortera namnen så att längsta namnen matchas först 
			    // (För att "Anders Svensson" ska bli en länk, inte bara "Anders")
			    uniqueNames.sort((a, b) => b.length - a.length);
			
			    // 3. Om inga namn finns, returnera
			    if (uniqueNames.length === 0) return text;
			
			    // 4. Skapa en stor Regex för alla namn (escapa specialtecken)
			    // Vi använder \b för att matcha hela ord, så att "Bo" inte matchar i "Boll"
			    const escapedNames = uniqueNames.map(name => name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
			    const pattern = new RegExp(`\\b(${escapedNames.join('|')})\\b`, 'gi');
			
			    // 5. Ersätt träffar med länk-HTML
			    return text.replace(pattern, (match) => {
			        // Behåll original-casing i texten, men spara det fullständiga namnet i data-attributet
			        // Vi måste hitta det "äkta" namnet från listan för att openCustomerModal ska funka bäst
			        const realName = uniqueNames.find(n => n.toLowerCase() === match.toLowerCase());
			        return `<span class="chat-customer-link" data-kund="${realName}">${match}</span>`;
			    });
			}
			
			function renderChatBubble(id, data, container) {
			    const bubble = document.createElement('div');
			    bubble.className = 'chat-bubble';
			
			    // Variabel för att minnas om vi har gjort ett långtryck
			    let isLongPressActive = false;
			
			    // --- 1. INNEHÅLL (TEXT & BILD) ---
			    // Samma innehållslogik som du redan har (kopiera in den om du vill, eller använd din befintliga del 1)
			    // För att spara plats här visar jag bara logiken, men se till att Text/Bild-koden är med!
			    
			    if (data.images && Array.isArray(data.images)) {
			        bubble.classList.add('chat-bubble-image');
			        const carousel = document.createElement('div');
			        carousel.className = 'chat-carousel';
			        data.images.forEach(imgSrc => {
			            const img = document.createElement('img');
			            img.src = imgSrc; img.loading = "lazy"; img.alt = "Bild";
			            img.onclick = (e) => {
			                if (!isLongPressActive) {
			                    e.stopPropagation(); 
			                    if (typeof window.openImageZoom === 'function') window.openImageZoom(imgSrc);
			                }
			            };
			            carousel.appendChild(img);
			        });
			        bubble.appendChild(carousel);
			        if (data.caption) {
			            const captionDiv = document.createElement('div');
			            captionDiv.className = 'chat-caption';
			            captionDiv.textContent = data.caption;
			            bubble.appendChild(captionDiv);
			        }
			    } else if (data.type === 'image' && data.image) {
			        bubble.classList.add('chat-bubble-image');
			        const imgElement = document.createElement('img');
			        imgElement.src = data.image; imgElement.alt = "Bild"; imgElement.loading = "lazy";
			        imgElement.onclick = (e) => {
			            if (!isLongPressActive) {
			                e.stopPropagation(); 
			                if (typeof window.openImageZoom === 'function') window.openImageZoom(data.image);
			            }
			        };
			        bubble.appendChild(imgElement);
			        if (data.caption) {
			            const captionDiv = document.createElement('div');
			            captionDiv.className = 'chat-caption';
			            captionDiv.textContent = data.caption;
			            bubble.appendChild(captionDiv);
			        }
			        bubble.dataset.originalHtml = bubble.innerHTML;
			    } else {
			        // Text-logik (Klistra in din befintliga text-logik här)
			        let rawText = data.text || "";
			        const textContentDiv = document.createElement('div');
			        textContentDiv.className = 'chat-text-content';
			        let processedText = rawText.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
			        const urlPattern = /(https?:\/\/[^\s]+)/g;
			        processedText = processedText.replace(urlPattern, (url) => `<a href="${url}" target="_blank" class="chat-link">${url}</a>`);
			        const regPattern = /\b([A-Za-z]{3})\s?(\d{2}[0-9A-Za-z])\b/g;
			        processedText = processedText.replace(regPattern, (match) => {
			            const cleanReg = match.replace(/\s/g, '').toUpperCase(); 
			            return `<span class="chat-reg-link" data-reg="${cleanReg}">${match.toUpperCase()}</span>`;
			        });
			        if (typeof highlightCustomerNames === 'function') {
			            processedText = highlightCustomerNames(processedText);
			        }
			        textContentDiv.innerHTML = processedText;
			        bubble.appendChild(textContentDiv);
			        if (rawText.length > 300) {
			            textContentDiv.classList.add('truncated');
			            const readMoreBtn = document.createElement('button');
			            readMoreBtn.className = 'read-more-btn';
			            readMoreBtn.textContent = "Visa mer";
			            readMoreBtn.onclick = (e) => {
			                e.stopPropagation();
			                if (textContentDiv.classList.contains('truncated')) {
			                    textContentDiv.classList.remove('truncated');
			                    readMoreBtn.textContent = "Visa mindre";
			                } else {
			                    textContentDiv.classList.add('truncated');
			                    readMoreBtn.textContent = "Visa mer";
			                }
			            };
			            bubble.appendChild(readMoreBtn);
			        }
			        bubble.dataset.originalHtml = bubble.innerHTML;
			    }
			
			    if (data.reaction) {
			        const badge = document.createElement('span');
			        badge.className = 'reaction-badge';
			        badge.textContent = data.reaction;
			        badge.onclick = (e) => { e.stopPropagation(); applyReaction(id, data.reaction); };
			        bubble.appendChild(badge);
			    }
			
			    // --- 2. TOUCH-LOGIK (FIXAD) ---
			    
			    let pressTimer = null;
			    let startX = 0, startY = 0;
			
			    const handleTouchStart = (e) => {
			        if (e.touches.length > 1) return; 
			
			        // NOLLSTÄLL
			        isLongPressActive = false;
			
			        startX = e.touches[0].clientX;
			        startY = e.touches[0].clientY;
			
			        // Edge Guard
			        if (startX < 30 || startX > window.innerWidth - 30) return;
			
			        if (pressTimer) clearTimeout(pressTimer);
			
			        pressTimer = setTimeout(() => {
			            // Långtryck aktiverat!
			            isLongPressActive = true; 
			            
			            if (typeof showReactionMenu === 'function') {
			                showReactionMenu(startX, startY, id);
			            }
			            if (navigator.vibrate) navigator.vibrate(15);
			        }, 250);
			    };
			
			    const handleTouchMove = (e) => {
			        if (!pressTimer) return;
			        // Om vi rör oss, avbryt timern direkt
			        const currentX = e.touches[0].clientX;
			        const currentY = e.touches[0].clientY;
			        if (Math.abs(currentX - startX) > 10 || Math.abs(currentY - startY) > 10) {
			            clearTimeout(pressTimer);
			            pressTimer = null;
			        }
			    };
			
			    const handleTouchEnd = (e) => {
			        // Rensa timer om vi släppte tidigt
			        if (pressTimer) {
			            clearTimeout(pressTimer);
			            pressTimer = null;
			        }
			
			        // HÄR ÄR NYCKELN:
			        // Om vi precis triggade ett långtryck, döda ALLT som händer efteråt (klick, bubblande events)
			        if (isLongPressActive) {
			            if (e.cancelable) e.preventDefault(); // Stoppa mus-eventet från att skapas
			            e.stopPropagation(); // Stoppa bubblande
			            
			            // Vi nollställer flaggan direkt här, eftersom preventDefault() 
			            // har gjort sitt jobb med att stoppa spök-klicket.
			            isLongPressActive = false;
			            return false;
			        }
			    };
			
			    // Kontextmeny (Högerklick)
			    bubble.addEventListener('contextmenu', (e) => {
			        if (window.innerWidth <= 768) {
			            e.preventDefault();
			            e.stopPropagation();
			            return false;
			        }
			        e.preventDefault();
			        showReactionMenu(e.clientX, e.clientY, id);
			        return false;
			    });
			
			    // Koppla listeners
			    // passive: false på touchend är nödvändigt för att kunna köra e.preventDefault()
			    bubble.addEventListener('touchstart', handleTouchStart, { passive: true });
			    bubble.addEventListener('touchmove', handleTouchMove, { passive: true });
			    bubble.addEventListener('touchend', handleTouchEnd, { passive: false }); 
			
			    // --- 3. TIDSSTÄMPEL ---
			    const time = document.createElement('div');
			    time.className = 'chat-time';
			    const dateObj = new Date(data.timestamp);
			    const timeString = dateObj.toLocaleTimeString('sv-SE', {hour: '2-digit', minute:'2-digit'});
			    const dateString = dateObj.toLocaleDateString('sv-SE', {day: 'numeric', month: 'short'});
			    const displayTime = (new Date().toDateString() === dateObj.toDateString()) ? timeString : `${dateString}, ${timeString}`;
			
			    let platformIconHtml = '';
			    if (data.platform === 'mobil') platformIconHtml = `<svg class="platform-icon"><use href="#icon-mobile"></use></svg>`;
			    else if (data.platform === 'dator') platformIconHtml = `<svg class="platform-icon"><use href="#icon-desktop"></use></svg>`;
			
			    time.innerHTML = `${displayTime} ${platformIconHtml}`;
			    if (data.isEdited) time.innerHTML += ` <span style="font-style:italic; opacity:0.7;">(redigerad)</span>`;
			
			    container.appendChild(bubble);
			    container.appendChild(time);
			}
            
			 // --- KORRIGERAD & KOMPLETT toggleView ---
			function toggleView(view) {
			    // 1. HANTERA CHATT (Specialfall: Widget/Popup)
			    if (view === 'chat') {
			        // Öppna widgeten (hanteras av CSS som helskärm på mobil, popup på desktop)
			        if (typeof toggleChatWidget === 'function') {
			            toggleChatWidget();
			        }
			
			        // Uppdatera endast mobil-knappen visuellt
			        const mobileChatBtn = document.getElementById('mobileChatBtn');
			        
			        // Ta bort active från alla knappar först för tydlighet
			        document.querySelectorAll('.mobile-nav-btn').forEach(b => b.classList.remove('active'));
			        
			        // Markera chatt-knappen
			        if (mobileChatBtn) mobileChatBtn.classList.add('active');
			
			        return; // VIKTIGT: Avbryt här. Vi byter inte bort bakgrundsvyn.
			    }
			
			    // 2. STANDARD VY-BYTE (Tidslinje, Kalender, Tavla)
			    // Om vi redan är på denna vy OCH inte navigerar bakåt, gör inget.
			    if (view === currentView && !isNavigatingBack) return;
			
			    currentView = view;
			
			    // --- Hantera knappar (Visuell status) ---
			    const btnToggleTimeline = document.getElementById('btnToggleTimeline');
			    const btnToggleCalendar = document.getElementById('btnToggleCalendar');
			    const btnKanban = document.getElementById('btnToggleKanban');
			
			    // Nollställ mobilknappar (så inte chatten lyser om vi byter till tidslinje)
			    document.querySelectorAll('.mobile-nav-btn').forEach(b => b.classList.remove('active'));
			
			    // Sätt aktiv klass på Desktop-knappar
			    if (btnToggleTimeline) btnToggleTimeline.classList.toggle('active', view === 'timeline');
			    if (btnToggleCalendar) btnToggleCalendar.classList.toggle('active', view === 'calendar');
			    if (btnKanban) btnKanban.classList.toggle('active', view === 'kanban');
			
			    // Sätt aktiv klass på Mobil "Vy"-knapp (för Timeline/Kalender/Kanban)
			    const mobileViewToggle = document.getElementById('mobileViewToggle');
			    if (mobileViewToggle && (view === 'timeline' || view === 'calendar' || view === 'kanban')) {
			        mobileViewToggle.classList.add('active');
			    }
			
			    // --- Dölj alla huvud-vyer ---
			    const timelineView = document.getElementById('timelineView');
			    const calendarView = document.getElementById('calendarView');
			    const kanbanView = document.getElementById('kanbanView');
			    
			    // OBS: Vi rör inte chatWidget här, den lever sitt eget liv
			    if (timelineView) timelineView.style.display = 'none';
			    if (calendarView) calendarView.style.display = 'none';
			    if (kanbanView) kanbanView.style.display = 'none';
			
			    // Se till att Statistik-baren syns (om den varit dold)
			    const statBar = document.getElementById('statBar');
			    if (statBar) statBar.style.display = 'grid';
			
			    // --- Visa vald vy och kör logik ---
			    if (view === 'calendar') {
			        if (calendarView) calendarView.style.display = 'block';
			        
			        if (calendar) {
			            calendar.changeView('dayGridTwoWeek');
			            setTimeout(() => {
			                calendar.updateSize();
			                const activeJobs = allJobs.filter(job => !job.deleted);
			                const calendarEvents = activeJobs.map(mapJobToEvent);
			                calendar.setOption('events', calendarEvents);
			                filterCalendarView();
			            }, 50);
			        }
			
			        if (!isNavigatingBack) {
			            history.pushState({ view: 'calendar' }, 'Kalender', '#calendar');
			        }
			
			    } else if (view === 'kanban') {
			        if (kanbanView) kanbanView.style.display = 'block';
			        const appBrandTitle = document.getElementById('appBrandTitle');
			        if (appBrandTitle) appBrandTitle.style.display = 'block';
			
			        renderKanbanBoard();
			
			        if (!isNavigatingBack) {
			            history.pushState({ view: 'kanban' }, 'Tavla', '#kanban');
			        }
			
			    } else { 
			        // Default: Timeline (Tidslinje)
			        if (timelineView) timelineView.style.display = 'block';
			        const appBrandTitle = document.getElementById('appBrandTitle');
			        if (appBrandTitle) appBrandTitle.style.display = 'block';
			
			        renderTimeline();
			
			        if (!isNavigatingBack) {
			            history.replaceState(null, 'Tidslinje', location.pathname);
			        }
			    }
			}

			// --- UPPDATERAD: renderKanbanBoard (med Sök och Tomt-läge) ---
			function renderKanbanBoard() {
			    // Rensa kolumnerna
			    kanbanColOffererad.innerHTML = '';
			    kanbanColBokad.innerHTML = '';
				kanbanColFaktureras.innerHTML = '';
			    kanbanColKlar.innerHTML = '';

				let fakturerasCount = 0;
			
			    // --- 1. FILTER-LOGIK (Kopierad från renderTimeline) ---
			    let activeJobs = allJobs.filter(job => !job.deleted);

                if (currentSearchTerm) {
                    activeJobs = activeJobs.filter(job => {
                        const term = currentSearchTerm.toLowerCase();
                        const normalizedTerm = term.replace(/\s/g, '');
                        const normalizedPhone = (job.telefon || '').replace(/\D/g, '');
                        const regMatch = (job.regnr && job.regnr.toLowerCase().replace(/\s/g, '').includes(normalizedTerm));
                        
                        return (
                            (job.kundnamn && job.kundnamn.toLowerCase().includes(term)) || 
                            regMatch || 
                            (job.kommentarer && job.kommentarer.toLowerCase().includes(term)) ||
                            (normalizedPhone && normalizedPhone.includes(normalizedTerm)) || 
                            (STATUS_TEXT[job.status] || '').toLowerCase().includes(term)
                        );
                    });
                }
                // --- SLUT FILTER-LOGIK ---

			    // --- 2. Hantera "Klar"-kolumnen ---
			    const klarJobs = activeJobs
        			.filter(j => j.status === 'klar')
			        .sort((a, b) => new Date(b.datum) - new Date(a.datum));
			    
			    const klarJobsToShow = klarJobs.slice(0, 5);
			    
			    klarJobsToShow.forEach(job => {
			        kanbanColKlar.innerHTML += createKanbanCard(job); 
			    });
			    document.querySelector('.kanban-column[data-status="klar"] .kanban-column-count').textContent = klarJobs.length;

                // --- NYTT: Hantera "Tomt läge" för Klar ---
                if (klarJobsToShow.length === 0) {
                    kanbanColKlar.innerHTML = `
                        <div class="kanban-empty-state">
                            <svg class="icon-lg" viewBox="0 0 24 24"><use href="#icon-check"></use></svg>
                            <span>Inga klara jobb${currentSearchTerm ? ' matchade sökningen' : ''}.</span>
                        </div>
                    `;
                }
			
			    // --- 3. Hantera övriga kolumner ---
			    const otherJobs = activeJobs
        			.filter(j => j.status !== 'avbokad' && j.status !== 'klar')
			        .sort((a, b) => {
			            // Samma sorteringslogik som förut
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
						case 'faktureras': // NYTT CASE
			                kanbanColFaktureras.innerHTML += cardHTML;
			                fakturerasCount++;
			                break;
			        }
			    });
			
			    document.querySelector('.kanban-column[data-status="offererad"] .kanban-column-count').textContent = offereradCount;
			    document.querySelector('.kanban-column[data-status="bokad"] .kanban-column-count').textContent = bokadCount;
				document.querySelector('.kanban-column[data-status="faktureras"] .kanban-column-count').textContent = fakturerasCount;
			
                // --- NYTT: Hantera "Tomt läge" för Offererad/Bokad ---
                if (offereradCount === 0) {
                    kanbanColOffererad.innerHTML = `
                        <div class="kanban-empty-state">
                            <svg class="icon-lg" viewBox="0 0 24 24"><use href="#icon-file-text"></use></svg>
                            <span>Inga offerter${currentSearchTerm ? ' matchade sökningen' : ''}.</span>
                        </div>
                    `;
                }
                if (bokadCount === 0) {
                    kanbanColBokad.innerHTML = `
                        <div class="kanban-empty-state">
                            <svg class="icon-lg" viewBox="0 0 24 24"><use href="#icon-briefcase"></use></svg>
                            <span>Inga bokade jobb${currentSearchTerm ? ' matchade sökningen' : ''}.</span>
                        </div>
                    `;
                }

			    // --- 4. Initiera SortableJS (Oförändrad) ---
			    if (!sortableColBokad) {
				    const options = {
				        group: 'shared',
				        animation: 150,
				        onEnd: handleKanbanDrop,
				        handle: '.kanban-drag-handle',
				        ghostClass: 'kanban-card-ghost',
				        chosenClass: 'kanban-card-chosen',
				        
				        // --- TOUCH/MOBIL FIX HÄR ---
				        delay: 200,                  // Kort fördröjning på touch för att skilja drag från skroll
				        touchStartThreshold: 5,      // Liten tolerans för att starta drag
				        scrollSensitivity: 80,       // Ökad känslighet för att utlösa skrollning mellan kolumner
				        scrollSpeed: 10,             // Snabbare skrollning mellan kolumner
				        forceFallback: true,         // Tvinga drag-effekten i mobila webbläsare
				        // --- SLUT TOUCH FIX ---
				    };
			        sortableColOffererad = new Sortable(kanbanColOffererad, options);
			        sortableColBokad = new Sortable(kanbanColBokad, options);
			        sortableColKlar = new Sortable(kanbanColKlar, options);
					sortableColFaktureras = new Sortable(kanbanColFaktureras, options);
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

			function initInventoryListener() {
			    db.collection("settings").doc("inventory").onSnapshot(doc => {
			        if (doc.exists) {
			            const data = doc.data();
			            
			            // Fyll i inställningsfälten
			            const amountInput = document.getElementById('oilStartAmount');
			            const dateInput = document.getElementById('oilStartDate');
			            
			            if (amountInput) amountInput.value = data.oilStartAmount || 205;
			            if (dateInput) dateInput.value = data.oilStartDate || "2024-11-22"; // Din default
			            
			            // Kör beräkningen direkt när vi fått datan
			            calculateOilStock();
			        }
			    });
			}

			function calculateOilStock() {
                // 1. Hämta startvärden från inputs (eller state om modalen är stängd)
                const amountInput = document.getElementById('oilStartAmount');
                const dateInput = document.getElementById('oilStartDate');
                
                // SÄKERHETSÅTGÄRD: Om elementen inte finns (appen laddas), avbryt inte, använd 0
                const startAmount = amountInput ? (parseFloat(amountInput.value) || 0) : 0;
                const startDateVal = dateInput ? dateInput.value : '';
                
                // Om vi inte har data i fälten än (t.ex. vid start), försök inte räkna
                if (!startDateVal && startAmount === 0) return;

                const startDate = new Date(startDateVal);
                startDate.setHours(0, 0, 0, 0); 

                let totalUsed = 0;

                // 2. Loopa igenom ALLA jobb
                allJobs.forEach(job => {
                    // Ignorera raderade jobb och avbokade jobb
                    if (job.deleted || job.status === 'avbokad') return;

                    // Kolla om jobbets datum är EFTER startdatumet
                    const jobDate = new Date(job.datum);
                    if (jobDate >= startDate) {
                        
                        // 3. Leta efter olja i utgiftslistan
                        if (job.expenseItems && Array.isArray(job.expenseItems)) {
                            job.expenseItems.forEach(item => {
                                // Kollar om namnet innehåller "olja"
                                if (item.name && item.name.toLowerCase().includes('motorolja')) {
                                    // Extrahera siffran: "Motorolja (4.3L)" -> 4.3
                                    const match = item.name.match(/([\d.,]+)\s*L/i);
                                    if (match) {
                                        let liters = parseFloat(match[1].replace(',', '.'));
                                        if (!isNaN(liters)) {
                                            totalUsed += liters;
                                        }
                                    }
                                }
                            });
                        }
                    }
                });

                // 4. Visa resultatet
                const currentStock = startAmount - totalUsed;
                const stockElement = document.getElementById('calculatedOilStock');
                
                if (stockElement) {
                    stockElement.textContent = `${currentStock.toFixed(1)} Liter kvar`;
                    
                    if (currentStock < 20) {
                        stockElement.style.color = "var(--danger-color)";
                        stockElement.textContent += " (LÅGT!)";
                    } else {
                        stockElement.style.color = "var(--success-color)";
                    }
                }
                
                currentOilStock = currentStock;
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

			// --- AUTOMATISK STÄDNING (STEG 4) ---
			function cleanupOldTrash() {
			    if (!db) return; // Säkerhetskoll om db inte laddats
			
			    const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000; // 30 dagar i millisekunder
			    const now = Date.now();
			
			    console.log("Kör städning av papperskorgen...");
			
			    db.collection("jobs")
			      .where("deleted", "==", true)
			      .get()
			      .then(snapshot => {
			          let count = 0;
			          snapshot.forEach(doc => {
			              const data = doc.data();
			              // Kontrollera om jobbet har ett raderingsdatum
			              if (data.deletedAt) {
			                  const deletedTime = new Date(data.deletedAt).getTime();
			                  
			                  // Om det gått mer än 30 dagar
			                  if (now - deletedTime > THIRTY_DAYS_MS) {
			                      console.log("Raderar permanent gammalt jobb:", doc.id);
			                      // Permanent borttagning
			                      db.collection("jobs").doc(doc.id).delete();
			                      count++;
			                  }
			              }
			          });
			          if (count > 0) console.log(`Städning klar. ${count} jobb togs bort permanent.`);
			      })
			      .catch(err => console.log("Fel vid städning:", err));
			}
			
			// Kör städningen en gång när scriptet laddas (ca 3 sekunder efter start)
			setTimeout(cleanupOldTrash, 3000);

			// --- PAPPERSKORG LOGIK (STEG 3) ---
    
		    const trashModal = document.getElementById('trashModal');
		    const trashList = document.getElementById('trashList');
		    const openTrashBtn = document.getElementById('openTrashBtn');
		    const trashModalCloseBtn = document.getElementById('trashModalCloseBtn');
		    const trashModalCancelBtn = document.getElementById('trashModalCancelBtn');
		
		    // 1. Öppna papperskorgen
		    openTrashBtn.addEventListener('click', () => {
		        // Stäng inställningarna först
		        closeModal({ popHistory: false });
		        
		        renderTrashList();
		        // Liten fördröjning så modalerna inte krockar
		        setTimeout(() => showModal('trashModal'), 50);
		    });
		
		    // 2. Stäng papperskorgen
		    trashModalCloseBtn.addEventListener('click', () => closeModal());
		    trashModalCancelBtn.addEventListener('click', () => closeModal());
		    trashModal.addEventListener('click', (e) => { 
		        if (e.target === trashModal) closeModal(); 
		    });

			// Öppna Välj Vy-modalen
			mobileViewToggle.addEventListener('click', () => {
			    // Stäng andra nav-knappars modals först
			    closeModal({ popHistory: false }); 
			    showModal('viewSelectModal');
			});
			
			// Stäng Välj Vy-modalen
			viewSelectCloseBtn.addEventListener('click', () => closeModal());
			viewSelectModal.addEventListener('click', (e) => { 
			    if (e.target === viewSelectModal) closeModal(); 
			});
			
			// Hantera klick på vy-knapparna inuti modalen
			viewSelectModal.addEventListener('click', (e) => {
			    const button = e.target.closest('[data-view-select]');
			    if (button) {
			        const view = button.dataset.viewSelect;
			        
			        // FIX: Stäng modalen UTAN att röra webbläsarhistoriken
			        closeModal({ popHistory: false }); // <-- ÄNDRA TILL DETTA
			        
			        // Anropa din befintliga vy-växlingsfunktion
			        setTimeout(() => {
			            // Nu kan toggleView säkert byta vy och lägga till #kanban i historiken
			            toggleView(view);
			            
			            // Sätt den nya knappen som aktiv i bottenmenyn
			            document.querySelectorAll('.mobile-nav-btn').forEach(btn => btn.classList.remove('active'));
			            mobileViewToggle.classList.add('active');
			        }, 50);
			    }
			});
		
		    // 3. Rita ut listan med raderade jobb (TABELL-LÖSNING)
			function renderTrashList() {
			    const trashList = document.getElementById('trashList');
			    if (!trashList) return;
			    
			    trashList.innerHTML = '';
			    const deletedJobs = allJobs.filter(j => j.deleted);
			
			    if (deletedJobs.length === 0) {
			        trashList.innerHTML = '<p style="text-align:center; padding:2rem; color:#888;">Papperskorgen är tom.</p>';
			        return;
			    }
			
			    deletedJobs.forEach(job => {
			        const li = document.createElement('li');
			        li.className = 'trash-item';
			        
			        // Vi nollställer stilen på list-elementet för säkerhets skull
			        li.style.cssText = "padding: 10px; border-bottom: 1px solid #eee; background: rgba(255, 69, 58, 0.03); list-style: none;";
			        
			        const dateStr = job.datum ? job.datum.split('T')[0] : 'Inget datum';
			        
			        // HÄR ÄR FIXEN: En osynlig tabell med 100% bredd
			        // Vänstra cellen = Text. Högra cellen = Knappar.
			        li.innerHTML = `
			            <table style="width: 100%; border-collapse: collapse; border: none;">
			                <tr>
			                    <td style="vertical-align: middle; padding: 0; border: none;">
			                        <div style="font-weight: 700; font-size: 1rem; color: #333;">${job.kundnamn}</div>
			                        <div style="font-size: 0.85rem; color: #666;">${dateStr} | ${job.regnr || '---'}</div>
			                    </td>
			                    
			                    <td style="vertical-align: middle; text-align: right; padding: 0; border: none; white-space: nowrap;">
			                        
			                        <div style="display: inline-flex; align-items: center; gap: 8px;">
			                            
			                            <button class="restore-btn" data-id="${job.id}" style="
			                                display: inline-flex; align-items: center; justify-content: center;
			                                height: 38px; padding: 0 12px;
			                                background: white; border: 1px solid #30d158; color: #30d158;
			                                border-radius: 6px; font-weight: 600; cursor: pointer;">
			                                Återställ
			                            </button>
			
			                            <button class="delete-permanent-btn" data-id="${job.id}" title="Radera permanent" style="
			                                display: inline-flex; align-items: center; justify-content: center;
			                                width: 38px; height: 38px; padding: 0;
			                                background: white; border: 1px solid #ff453a; color: #ff453a;
			                                border-radius: 6px; cursor: pointer;">
			                                <svg class="icon-sm" viewBox="0 0 24 24" style="width: 20px; height: 20px; pointer-events: none; fill: none; stroke: currentColor; stroke-width: 2;"><path stroke-linecap="round" stroke-linejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12.578 0a48.108 48.108 0 01-3.478-.397m15.42 0A48.1 48.1 0 0012 5.11M4.772 5.79L4.772 4.102a2.25 2.25 0 012.25-2.25h1.5a2.25 2.25 0 012.25 2.25v1.688M4.772 5.79l-.175 2.457a1.125 1.125 0 001.12 1.228H18.28a1.125 1.125 0 001.12-1.228l-.175-2.457m0 0l-1.096-1.547a.562.562 0 00-.923 0l-1.096 1.547M19.228 5.79l-1.096-1.547a.562.562 0 01-.923 0l-1.096 1.547" /></svg>
			                            </button>
			
			                        </div>
			                    </td>
			                </tr>
			            </table>
			        `;
			        trashList.appendChild(li);
			    });
			}
		
		   // 4. Hantera "Återställ" och "Radera Permanent" klick
		    trashList.addEventListener('click', (e) => {
                // Hantera Återställning
		        if (e.target.classList.contains('restore-btn')) {
		            const jobId = e.target.dataset.id;
		            restoreJob(jobId);
		        }

                // Hantera Permanent Radering (NYTT)
                const deleteBtn = e.target.closest('.delete-permanent-btn');
                if (deleteBtn) {
                    const jobId = deleteBtn.dataset.id;
                    deleteJobPermanently(jobId);
                }
		    });

            // NY FUNKTION: Radera permanent
            function deleteJobPermanently(jobId) {
                if (confirm('Är du säker? Detta tar bort jobbet permanent och går INTE att ångra.')) {
                    db.collection("jobs").doc(jobId).delete()
                    .then(() => {
                        showToast('Jobb raderat permanent.', 'info');
                        // Uppdatera lokala listan direkt så den försvinner från skärmen
                        allJobs = allJobs.filter(j => j.id !== jobId);
                        renderTrashList(); 
                    })
                    .catch(err => showToast('Kunde inte radera: ' + err.message, 'danger'));
                }
            }
		
		    function restoreJob(jobId) {
		        db.collection("jobs").doc(jobId).update({
		            deleted: false,
		            deletedAt: firebase.firestore.FieldValue.delete() // Tar bort tidsstämpeln
		        })
		        .then(() => {
		            showToast('Jobb återställt!', 'success');
		            renderTrashList(); // Uppdatera listan direkt
		        })
		        .catch(err => showToast('Kunde inte återställa: ' + err.message, 'danger'));
		    }

            // --- Huvud-renderingsfunktioner ---
			function updateUI() {
			    if (!appInitialized) return;

				const activeJobs = allJobs.filter(job => !job.deleted);
			
			    // 1. Globala uppdateringar
			    renderGlobalStats(activeJobs);
			    const calendarEvents = activeJobs.map(mapJobToEvent);
			
			    // 2. Uppdatera Kalendern (alltid, den körs i bakgrunden)
			    if (calendar) { 
			        calendar.setOption('events', calendarEvents);
			        filterCalendarView();
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
				calculateOilStock();
			}

            function renderGlobalStats(jobs) {
			    const now = new Date();
			    now.setHours(0, 0, 0, 0);
			
			    // STEG 1: Filtrera bort alla raderade jobb FÖRST
			    const activeJobs = jobs.filter(job => !job.deleted);
			
			    // STEG 2: Använd activeJobs för ALL statistikräkning
			    const upcomingJobs = activeJobs.filter(j => j.status === 'bokad' && new Date(j.datum) >= now).length;
			    const finishedJobs = activeJobs.filter(j => j.status === 'klar').length;
			    const offeredJobs = activeJobs.filter(j => j.status === 'offererad').length;
			    const invoiceJobs = activeJobs.filter(j => j.status === 'faktureras').length; // Nytt faktureras-kort
			    const allJobCount = activeJobs.length;
			    
			    statUpcoming.textContent = upcomingJobs;
			    statFinished.textContent = finishedJobs;
			    statOffered.textContent = offeredJobs;
			    statAll.textContent = allJobCount;
			    
			    const statInvoice = document.getElementById('stat-invoice');
			    if(statInvoice) statInvoice.textContent = invoiceJobs;
			
			    // NYTT: Dagens Vinst i Header (Måste också använda activeJobs)
			    const todaysProfit = activeJobs
			        .filter(j => j.status === 'klar' && j.datum && j.datum.startsWith(todayString))
			        .reduce((sum, j) => sum + (j.vinst || 0), 0);
			    // (Visningslogiken för Dagens Vinst är i openStatsModal och behöver inte uppdateras här)
			    
			    document.querySelectorAll('.stat-card.active').forEach(c => c.classList.remove('active'));
			    const activeCard = document.getElementById(`stat-card-${currentStatusFilter}`);
			    if (activeCard) activeCard.classList.add('active');
			}

            // --- UPPDATERAD: renderTimeline med Animationslogik ---
            function renderTimeline() {
                // BUGGFIX: Ditt ID i plan.html är "desktopSearchResultCount"
                const desktopSearchCount = document.getElementById('desktopSearchResultCount'); 
                let jobsToDisplay = allJobs.filter(job => !job.deleted);
                
                const now = new Date();
                now.setHours(0, 0, 0, 0);
                
                let sortOrder = 'asc'; // Standard-sortering
                
                // --- BÖRJAN PÅ NY FILTERLOGIK ---
                
                if (currentSearchTerm) {
                    // 1. SÖKNING ÄR AKTIV: Filtrera ALLA jobb
                    clearDayFilterBtn.style.display = 'inline-flex';
                    jobsToDisplay = jobsToDisplay.filter(job => {
                        const term = currentSearchTerm.toLowerCase();
                        
                        // --- KORREKT SÖK-LOGIK ---
                        const normalizedTerm = term.replace(/\s/g, '');
                        const normalizedPhone = (job.telefon || '').replace(/\D/g, '');
                        const regMatch = (job.regnr && job.regnr.toLowerCase().replace(/\s/g, '').includes(normalizedTerm));
                        
                        return (
                            (job.kundnamn && job.kundnamn.toLowerCase().includes(term)) || 
                            regMatch || 
                            (job.kommentarer && job.kommentarer.toLowerCase().includes(term)) ||
                            (normalizedPhone && normalizedPhone.includes(normalizedTerm)) || 
                            (STATUS_TEXT[job.status] || '').toLowerCase().includes(term)
                        );
                    });
                    
                    // Sätt sortering för sökresultat (senaste först är oftast bäst)
                    sortOrder = 'desc';
                    
                    // Uppdatera stat-knapparna visuellt (rensa aktiv, sätt "alla" som aktiv)
                    document.querySelectorAll('.stat-card.active').forEach(c => c.classList.remove('active'));
                    const allaKort = document.getElementById('stat-card-alla');
                    if(allaKort) allaKort.classList.add('active');

                    // Uppdatera sök-räknaren
                    if (desktopSearchCount) {
			            desktopSearchCount.textContent = `${jobsToDisplay.length} träff(ar)`;
			        }

                } else {
                    // 2. INGEN SÖKNING: Använd kategorifiltret som vanligt
                    clearDayFilterBtn.style.display = 'none';
                    
                    switch(currentStatusFilter) {
                        case 'kommande':
                            jobsToDisplay = jobsToDisplay.filter(j => 
                                j.status === 'bokad' && new Date(j.datum) >= now
                            );
                            break;
						case 'faktureras': // NYTT CASE
					        jobsToDisplay = jobsToDisplay.filter(j => j.status === 'faktureras');
					        sortOrder = 'desc'; // Visa nyaste överst
					        break;
                        case 'klar':
                            jobsToDisplay = jobsToDisplay.filter(j => j.status === 'klar');
                            sortOrder = 'desc'; 
                            break;
                        case 'offererad':
                            jobsToDisplay = jobsToDisplay.filter(j => j.status === 'offererad');
                            break;
                        case 'alla':
                            sortOrder = 'desc'; 
                            break;
                    }

                    // Rensa sök-räknaren
                    if (desktopSearchCount) {
                        desktopSearchCount.textContent = '';
                    }

                    // Sätt korrekt stat-knapp som aktiv (hanteras också av renderGlobalStats, men dubbelkolla här)
                    document.querySelectorAll('.stat-card.active').forEach(c => c.classList.remove('active'));
                    const activeCard = document.getElementById(`stat-card-${currentStatusFilter}`);
                    if (activeCard) activeCard.classList.add('active');
                }
                // --- SLUT PÅ NY FILTERLOGIK ---


                jobsToDisplay.sort((a, b) => {
				    // Hämta värdena vi ska jämföra (baserat på vad som valts i listan)
				    let valA = a[currentSortField];
				    let valB = b[currentSortField];
				
				    // Specialhantering för DATUM (gör om till tidpunkter)
				    if (currentSortField === 'datum') {
				        valA = new Date(a.datum || 0).getTime();
				        valB = new Date(b.datum || 0).getTime();
				    }
				    // Specialhantering för TEXT (t.ex. Kundnamn, gör om till små bokstäver)
				    else if (typeof valA === 'string') {
				        valA = valA.toLowerCase();
				        valB = valB.toLowerCase();
				    }
				    // Specialhantering för SIFFROR (t.ex. Pris, hantera tomma fält som 0)
				    else {
				        valA = valA || 0;
				        valB = valB || 0;
				    }
				
				    // Jämför värdena
				    if (valA < valB) return currentSortOrder === 'asc' ? -1 : 1;
				    if (valA > valB) return currentSortOrder === 'asc' ? 1 : -1;
				    return 0;
				});

                // (Resten av din funktion är oförändrad)
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
                            const filterTextEl = document.querySelector(`.stat-card[data-filter="${currentStatusFilter}"] h3`);
                            const filterText = filterTextEl ? filterTextEl.textContent : 'valda filter';
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
			
			    let jobStatusClass = (job.status === 'bokad' && new Date(job.datum) < now) ? 'job-missed' : '';
			
			    const hasComment = job.kommentarer && job.kommentarer.trim().length > 0;
			    const kundnamnHTML = highlightSearchTerm(job.kundnamn, currentSearchTerm);
			    const regnrHTML = highlightSearchTerm(job.regnr || '---', currentSearchTerm);
			    
			    // NYTT: Hämta den dynamiska ikonen som ska användas
			    const customerIconLink = getJobContextIcon(job); 
			    const contextIcon = ''; // Håll denna tom för att slippa texten
			
			    return `
			        <tr data-id="${job.id}" data-status="${job.status}" class="job-entry ${prioClass} ${doneClass} ${jobStatusClass}">
			            <td data-label="Status"><span class="status-badge status-${job.status || 'bokad'}">${STATUS_TEXT[job.status] || 'Bokad'}</span></td>
			            <td data-label="Datum">${formatDate(job.datum)}</td>
			            <td data-label="Kund">
				            <button class="link-btn customer-link" data-kund="${job.kundnamn}">
				                <svg class="icon-sm customer-icon" viewBox="0 0 24 24"><use href="${customerIconLink}"></use></svg>
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

				const customerIconLink = getJobContextIcon(job);
				const contextIcon = '';
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

                const timePart = job.datum ? (formatDate(job.datum).split('kl. ')[1] || 'Okänd tid') : 'Okänd tid';
				let dateDisplay = '';
				if (job.datum) {
				    const d = new Date(job.datum);
				    const day = d.getDate();
				    const month = d.toLocaleString('sv-SE', { month: 'short' }).replace('.', '');
				    dateDisplay = `${day} ${month}`;
				}
                return `
                    <div class="mobile-job-card job-entry ${prioClass} ${doneClass} ${jobStatusClass}" data-id="${job.id}" data-status="${job.status}">
                        <div class="card-content">
						    <div class="card-row">
						        <span class="card-label">Kund</span>
				                <span class="card-value customer-name">
				                    <div class="customer-name-wrapper">
				                        ${contextIcon}
				                        <button class="link-btn customer-link" data-kund="${job.kundnamn}">
				                            <svg class="icon-sm customer-icon" viewBox="0 0 24 24"><use href="${customerIconLink}"></use></svg>
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
							        <span class="search-date-badge" style="display:none; margin-right:8px; color:#374151; font-weight:600;">${dateDisplay}</span>
							        
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

			// --- BÄTTRE KANBAN-KORT (med dra-handtag för mobil-fix) ---
			function createKanbanCard(job) {
			    // (Befintlig logik för klasser...)
			    let prioClass = job.prio ? 'prio-row' : '';
			    const doneClass = (job.status === 'klar' || job.status === 'betald') ? 'done-row' : ''; // <-- ÄNDRAD FÖR NY FUNKTION
			    const isKommandePrio = job.prio && job.status === 'bokad' && new Date(job.datum) >= new Date();
			    if(isKommandePrio) {
			        prioClass += ' kommande-prio-pulse'; // <-- **HÄR ÄR DEN KORRIGERADE RADEN**
			    }
			    const jobStatusClass = (job.status === 'bokad' && new Date(job.datum) < now) ? 'job-missed' : '';
			    const hasComment = job.kommentarer && job.kommentarer.trim().length > 0;
			    
			    // (Befintlig logik för HTML-delar...)
			    const kundnamnHTML = highlightSearchTerm(job.kundnamn, currentSearchTerm);
			    const regnrHTML = highlightSearchTerm(job.regnr || 'OKÄNT', currentSearchTerm);
			    const prioIcon = job.prio ? `<svg class="icon-sm prio-flag-icon" viewBox="0 0 24 24"><use href="#icon-flag"></use></svg>` : '';
			    const timePart = job.datum ? (formatDate(job.datum).split('kl. ')[1] || '---') : '---';

                // --- NYTT: Logik för foten (Datum + Kommentar) ---
                let footerLeftHTML = '';
                if (job.status === 'klar' || job.status === 'betald') { // <-- ÄNDRAD FÖR NY FUNKTION
                    // För "Klar", visa BARA kommentar-ikonen
                    if (hasComment) {
                        footerLeftHTML = `<svg class="kanban-card-icon" viewBox="0 0 24 24" title="Har kommentar"><use href="#icon-chat"></use></svg>`;
                    }
                } else {
                    // För "Bokad" / "Offererad", visa datum + kommentar
                    const formattedDate = job.datum ? formatDate(job.datum, { onlyDate: true }) : 'Okänt datum';
                    footerLeftHTML = `
                        ${hasComment ? `<svg class="kanban-card-icon" viewBox="0 0 24 24" title="Har kommentar"><use href="#icon-chat"></use></svg>` : ''}
                        <span class="kanban-card-date">
                            <svg class="icon-sm" viewBox="0 0 24 24"><use href="#icon-calendar-day"></use></svg>
                            <span>${formattedDate}</span>
                        </span>
                    `;
                }
                // --- SLUT NYTT ---
			
			    return `
			        <div class="kanban-card job-entry ${prioClass} ${doneClass} ${jobStatusClass}" data-id="${job.id}" data-status="${job.status}">
			            
			            <div class="kanban-drag-handle" title="Håll för att flytta">
			                <svg class="icon-sm" viewBox="0 0 16 16"><use href="#icon-drag-handle"></use></svg>
			            </div>
			
			            <div class="kanban-card-content">
			                
                            <div class="kanban-card-title">
			                    ${prioIcon}
                                <button class="link-btn customer-link" data-kund="${job.kundnamn}">
                                    <span class="customer-name-text">${kundnamnHTML}</span>
                                </button>
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
                                <div class="kanban-footer-left">
                                    ${footerLeftHTML}
                                </div>
                                <span class="card-time-badge">${timePart}</span>
                            </div>
			            </div>
			        </div>
			    `;
			}

            // --- Popover, Modal-hantering (FIXAD HISTORIK) ---
            
            function closeModal(options = {}) {
			    const { popHistory = true } = options;
			
			    // 1. Säkerhetsåtgärd: Stäng sök-modalen om den ligger i bakgrunden
			    // Vi kollar noga att elementet finns innan vi rör stilen.
			    if (currentOpenModalId !== 'mobileSearchModal') {
			        const mSearch = document.getElementById('mobileSearchModal');
			        if (mSearch) {
			            mSearch.style.display = 'none';
			            mSearch.classList.remove('show');
			        }
			    }

				document.body.classList.remove('body-scroll-lock');
			
			    if (!isModalOpen) return;
			
			    const modalId = currentOpenModalId;
			    if (!modalId) return; // Om inget ID finns, avbryt
			
			    const modalElement = document.getElementById(modalId);
			
			    // 2. Logik för Sök-modalen
			    if (modalId === 'mobileSearchModal') {
			        currentSearchTerm = ''; // Töm variabeln
			        
			        // Töm input-fälten säkert
			        const dInput = document.getElementById('searchBar');
			        const mInput = document.getElementById('mobileSearchBar');
			        if(dInput) dInput.value = '';
			        if(mInput) mInput.value = '';
			        
			        // Återställ statistik-baren (om den finns)
			        const statBar = document.getElementById('statBar');
			        if (statBar) { 
			            statBar.style.display = 'grid'; // <-- Här kraschade det nog förut om statBar saknades
			        }
			
			        // Uppdatera listan
			        if (typeof performSearch === 'function') {
			            performSearch(); 
			        }
			    }
			
			    // 3. Stäng själva modalen
			    if (modalElement) {
			        modalElement.classList.remove('show');
			        
			        // Rensa förslag om det var jobb-modalen
			        if (modalElement.id === 'jobModal') {
			            const suggestions = document.getElementById('kundnamnSuggestions');
			            if (suggestions) {
			                suggestions.style.display = 'none';
			                suggestions.innerHTML = '';
			            }
			        }
			        
			        setTimeout(() => {
			            // Kontrollera igen att elementet finns innan vi döljer det
			            if (modalElement) {
			                modalElement.style.display = 'none';
			            }
			        }, 200);
			    }
			
			    // 4. Hantera historiken
			    if (popHistory && !isNavigatingBack && history.state && history.state.modal === modalId) {
			        isNavigatingBack = true; 
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
			    if (isNavigatingBack) {
			        isNavigatingBack = false;
			        return;
			    }
			    clearTimeout(backPressTimer);
			
			    const state = event.state || {}; 
			    const currentHash = window.location.hash;
			    
			    const chatWidget = document.getElementById('chatWidget');
			    const imageModal = document.getElementById('imageZoomModal');
			    const mobileChatBtn = document.getElementById('mobileChatBtn');
			
			    // --- 1. BILD-HANTERING (Om vi går FRAMÅT till en bild) ---
			    if (state.modal === 'imageZoom') {
			        if (imageModal) imageModal.style.display = 'flex';
			        updateScrollLock();
			        return;
			    } else if (imageModal && state.modal !== 'imageZoom') {
                    // Om vi inte ska visa bild, se till att den döljs (för säkerhets skull)
                    // Men vi gör det "tyst" här, själva logiken hanteras nedan
			    }
			
			    // --- 2. CHATT-HANTERING (Vi är i chatt-läget) ---
			    if (state.modal === 'chatWidget' || currentHash === '#chat') {
			        
                    // --- NY FIX: Kolla om vi kommer från en "Child"-vy ---
                    let isReturningFromChild = false;

                    // 1. Är bild-zoomen öppen?
                    if (imageModal && getComputedStyle(imageModal).display !== 'none') {
                        isReturningFromChild = true;
                    }

                    // 2. Är någon annan modal öppen (t.ex. bil/kund-info som öppnades via chatt)?
                    // Vi letar efter en modal som har klassen 'show', men som INTE är själva chatten.
                    const openChildModal = document.querySelector('.modal-backdrop.show');
                    if (openChildModal && openChildModal.id !== 'chatWidget') {
                        isReturningFromChild = true;
                    }
                    // ----------------------------------------------------

			        // Stäng alla andra modaler (inklusive bildzoom)
			        document.querySelectorAll('.modal-backdrop').forEach(el => {
			            if (el.id !== 'chatWidget') {
			                el.classList.remove('show');
			                el.style.display = 'none';
			            }
			        });
                    if (imageModal) imageModal.style.display = 'none';
			
			        isModalOpen = false;
			        currentOpenModalId = null;
			
			        if (chatWidget) chatWidget.style.display = 'flex';
			        if (mobileChatBtn) mobileChatBtn.classList.add('active');

                    // --- SCROLL-LOGIK ---
                    // Scrolla BARA ner om vi INTE kommer tillbaka från en bild/modal
                    if (!isReturningFromChild) {
                        if (typeof forceChatScrollBottom === 'function') {
                            forceChatScrollBottom();
                        }
                    }
                    // --------------------
			        
			        if (window.innerWidth > 768) {
			            setTimeout(() => {
			                const input = document.getElementById('chatInput');
			                if(input) input.focus();
			            }, 50);
			        }
			        
			        updateScrollLock();
			        return; 
			    }
			
			    // --- 3. GRUNDLÄGE (Tidslinjen) ---
			    else {
				    const mSearchModal = document.getElementById('mobileSearchModal');
				
				    // NYTT: Kolla om mobil-sök var öppen precis innan back
				    const wasSearchOpen = mSearchModal && getComputedStyle(mSearchModal).display !== 'none';
				
				    // Kolla om något stängdes precis (för att undvika "tryck igen"-varning)
				    const wasChatOpen = chatWidget && chatWidget.style.display === 'flex';
				    const wasModalOpen = wasSearchOpen || isModalOpen || document.querySelector('.modal-backdrop.show');
				
				    // Tvinga bort scroll-låsning
				    document.body.classList.remove('body-scroll-lock');
				    document.body.style.overflow = '';
				
				    // Stäng allt
				    if (chatWidget) chatWidget.style.display = 'none';
				    if (mobileChatBtn) mobileChatBtn.classList.remove('active');
				
				    if (mSearchModal) mSearchModal.style.display = 'none';
				
				    document.querySelectorAll('.modal-backdrop').forEach(el => {
				        el.classList.remove('show');
				        el.style.display = 'none';
				    });
				    if (imageModal) imageModal.style.display = 'none';
				
				    isModalOpen = false;
				    currentOpenModalId = null;
				
				    updateScrollLock();
				
				    // Mobil "Avsluta app" - Visa bara om vi inte just stängde något (inkl. sök)
				    if (window.innerWidth <= 768 && !currentHash && !state.modal) {
				        if (!wasChatOpen && !wasModalOpen) {
				            if (typeof backPressWarned !== 'undefined') {
				                if (backPressWarned) {
				                    backPressWarned = false;
				                    history.back();
				                } else {
				                    backPressWarned = true;
				                    showToast('Tryck bakåt igen för att stänga', 'info');
				                    	backPressTimer = setTimeout(() => {
								    backPressWarned = false;
								}, 2500);
								
								history.pushState(null, null, location.pathname);
				                }
				            }
				        }
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

				document.body.classList.add('body-scroll-lock');
                
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

			// Global variabel för att spara vilken funktion som ska köras
			let pendingConfirmAction = null;
			
			function showConfirmation(title, message, type, callback) {
			    const modal = document.getElementById('confirmModal');
			    const content = modal.querySelector('.modal-content');
			    const titleEl = document.getElementById('confirmTitle');
			    const msgEl = document.getElementById('confirmMessage');
			    const iconContainer = document.getElementById('confirmIconContainer');
			    const yesBtn = document.getElementById('confirmYesBtn');
			
			    // 1. Sätt text och callback
			    titleEl.textContent = title;
			    msgEl.textContent = message;
			    pendingConfirmAction = callback;
			
			    // 2. Styla baserat på typ ('danger' eller 'success')
			    content.className = 'modal-content confirm-box ' + type;
			    
			    if (type === 'danger') {
			        iconContainer.innerHTML = '<svg class="icon-lg" viewBox="0 0 24 24" style="opacity:1;"><use href="#icon-trash"></use></svg>';
			        yesBtn.textContent = "Ta bort";
			    } else {
			        iconContainer.innerHTML = '<svg class="icon-lg" viewBox="0 0 24 24" style="opacity:1;"><use href="#icon-check"></use></svg>';
			        yesBtn.textContent = "Markera Klar";
			    }
			
			    // 3. Visa modalen
			    modal.style.display = 'flex';
			    setTimeout(() => modal.classList.add('show'), 10);
			}
			
			// Koppla knapparna i modalen
			document.getElementById('confirmCancelBtn').addEventListener('click', () => {
			    const modal = document.getElementById('confirmModal');
			    modal.classList.remove('show');
			    setTimeout(() => modal.style.display = 'none', 200);
			    pendingConfirmAction = null;
			});
			
			document.getElementById('confirmYesBtn').addEventListener('click', () => {
			    if (pendingConfirmAction) pendingConfirmAction();
			    // Stäng modalen
			    const modal = document.getElementById('confirmModal');
			    modal.classList.remove('show');
			    setTimeout(() => modal.style.display = 'none', 200);
			});

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
			    const container = document.getElementById('expenseList');
			    if (!container) return;
			    container.innerHTML = ''; 
			
			    currentExpenses.forEach((item, index) => {
			        const div = document.createElement('div');
			        div.className = 'expense-item-original';
			        
			        // Visa om det är en manuell del (valfritt, men bra för översikt)
			        const manualBadge = item.isManual ? '<span style="font-size:0.7em; color:#666; margin-left:5px;">(Manuell)</span>' : '';
			
			        div.innerHTML = `
			            <span class="item-name">${item.name} ${manualBadge}</span>
			            <div style="display:flex; align-items:center;">
			                <span class="item-cost">-${formatCurrency(item.cost)}</span>
			                <button type="button" class="delete-btn" title="Ta bort">
			                    <svg class="icon-sm" viewBox="0 0 24 24"><use href="#icon-trash"></use></svg>
			                </button>
			            </div>
			        `;
			        
			        div.querySelector('.delete-btn').addEventListener('click', () => {
			            // Hämta nuvarande kundpris
			            const prisInput = document.getElementById('kundpris');
			            let currentPrice = parseFloat(prisInput.value.replace(/\s/g, '').replace(',', '.')) || 0;
			
			            let deduction = 0;
			
			            // --- LOGIKEN FÖR BORTTAGNING ---
			            if (item.isManual) {
			                // Om den lades till manuellt, dra av 110% (Kostnad + 10%)
			                deduction = Math.round(item.cost * 1.10);
			            } else {
			                // Om den kom från ett paket, dra av den rena kostnaden
			                // (Eftersom paketen ofta har fasta priser är detta säkrast)
			                deduction = Math.round(item.cost);
			            }
			
			            let newPrice = currentPrice - deduction;
			            if (newPrice < 0) newPrice = 0;
			
			            prisInput.value = Math.round(newPrice);
			
			            // Ta bort från listan
			            currentExpenses.splice(index, 1);
			
			            renderExpensesList();
			            updateLiveProfit();
			            
			            //showToast(`Borttagen. Priset justerades med -${deduction} kr.`);
			        });
			        
			        container.appendChild(div);
			    });
			}

            // --- UPPDATERAD FUNKTION: Beräknar vinst & total utgift ---
            function updateLiveProfit() {
			    const prisEl = document.getElementById('kundpris');
			    const pris = prisEl ? (parseFloat(prisEl.value) || 0) : 0;
			    
			    const totalUtgifter = currentExpenses.reduce((sum, item) => sum + (item.cost || 0), 0);
			    const vinst = pris - totalUtgifter;
			    
			    const vinstDiv = document.getElementById('vinstKalkyl');
			    
			    if (vinstDiv) {
			        // Bygg strängen: "Vinst: 986 kr (Utgifter: 434 kr)"
			        let html = `Vinst: <span style="color:${vinst >= 0 ? 'var(--success-color)' : 'var(--danger-color)'}">${formatCurrency(vinst)}</span>`;
			        
			        if (totalUtgifter > 0) {
			            // Lägg till utgifter i en span för att kunna göra den grå
			            html += `<span class="expense-part"> (Utgifter: ${formatCurrency(totalUtgifter)})</span>`;
			        }
			        
			        vinstDiv.innerHTML = html;
			    }
			}

			// --- NY FUNKTION: Kalkylator i Kundpris-fältet ---
		    const prisMathInput = document.getElementById('kundpris');
		
		    if (prisMathInput) {
		        const calculatePriceMath = () => {
		            let val = prisMathInput.value;
		            
		            // Kolla om fältet innehåller matte-tecken (+, -, *, /)
		            // Tillåter t.ex. "500+200" eller "1000*1.25"
		            if (val && val.match(/[+\-*/]/)) {
		                try {
		                    // Ersätt kommatecken med punkt för att JS ska förstå (om man skriver 12,50)
		                    val = val.replace(',', '.');
		                    
		                    // Rensa bort allt som inte är siffror eller matte-tecken (säkerhet)
		                    const safeMath = val.replace(/[^0-9+\-*/().]/g, '');
		                    
		                    // Räkna ut summan säkert
		                    const result = new Function('return ' + safeMath)();
		                    
		                    if (!isNaN(result)) {
		                        // Sätt värdet (avrundat till heltal)
		                        prisMathInput.value = Math.round(result);
		                        
		                        // Uppdatera vinstkalkylen direkt
		                        updateLiveProfit(); 
		                        
		                        // Visa en liten notis (valfritt, men trevligt)
		                        // showToast(`Utraknat: ${Math.round(result)} kr`, 'info'); 
		                    }
		                } catch (e) {
		                    console.log("Kunde inte räkna ut matte:", e);
		                }
		            }
		        };
		
		        // Kör uträkningen när man klickar utanför fältet (blur)
		        prisMathInput.addEventListener('blur', calculatePriceMath);
		
		        // Kör uträkningen när man trycker Enter
		        prisMathInput.addEventListener('keydown', (e) => {
		            if (e.key === 'Enter') {
		                e.preventDefault(); // Hindra att hela formuläret sparas direkt
		                calculatePriceMath();
		                prisMathInput.blur(); // Tar bort fokus så man ser att det är klart
		            }
		        });
		    }

			// --- NY LISTENER: Gör utgiftsnamn till stora bokstäver ---
            expenseNameInput.addEventListener('input', (e) => {
                e.target.value = e.target.value.toUpperCase();
            });
    
		    if (addExpenseBtn) {
		        addExpenseBtn.addEventListener('click', () => {
		            const nameInput = document.getElementById('expenseName');
		            const costInput = document.getElementById('expenseCost');
		            const prisInput = document.getElementById('kundpris');
		            const warningBadge = document.getElementById('laborWarningBadge');
		
		            const name = nameInput.value.trim();
		            const cost = parseFloat(costInput.value) || 0;
		
		            if (!name) {
		                showToast('Du måste ange ett namn för utgiften.', 'danger');
		                nameInput.focus();
		                return;
		            }
		            if (cost <= 0) {
		                showToast('Kostnaden måste vara större än 0.', 'danger');
		                costInput.focus();
		                return;
		            }
		
		            // 1. Lägg till i listan och MARKERA SOM MANUELL
		            // Vi lägger till "isManual: true" för att veta att denna ska ha påslag vid borttagning
		            currentExpenses.push({ name: name, cost: cost, isManual: true });
		
		            // 2. AUTOMATISK PRISÖKNING MED 10%
		            let currentPrice = 0;
		            if (prisInput.value) {
		                currentPrice = parseFloat(prisInput.value.replace(/\s/g, '').replace(',', '.')) || 0;
		            }
		            
		            // HÄR ÄR ÄNDRINGEN: Plussa på kostnad * 1.10 (10%)
		            const markupCost = Math.round(cost * 1.10);
		            const newPrice = currentPrice + markupCost;
		            
		            prisInput.value = Math.round(newPrice);
		
		            // 3. VISA VARNING & ANIMATION
		            if (warningBadge) {
		                warningBadge.style.display = 'inline-block';
		                setTimeout(() => { warningBadge.style.display = 'none'; }, 8000);
		            }
		
		            prisInput.classList.remove('input-warning-flash');
		            void prisInput.offsetWidth; 
		            prisInput.classList.add('input-warning-flash');
		
		            // 4. Återställ & Uppdatera
		            nameInput.value = '';
		            costInput.value = '';
		            nameInput.focus();
		
		            renderExpensesList();
		            updateLiveProfit();
		            
		            //showToast(`Lade till ${cost} kr (+10% påslag: ${markupCost} kr)`);
		        });
		    }

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
			    currentExpenses = []; 
			
			    // 2. Stäng Accordion (Mer uppgifter) så den är snygg
			    const accordionToggle = document.getElementById('extraDetailsToggle');
			    const accordionContent = document.getElementById('extraDetailsContent');
			    if (accordionToggle && accordionContent) {
			        accordionToggle.classList.remove('active');
			        accordionContent.classList.remove('show');
			    }
			
			    // 3. Dölj ring/sms-knappar till en början
			    const btnCall = document.getElementById('jobModalCallBtn');
			    const btnSms = document.getElementById('jobModalSmsBtn');
			    if(btnCall) btnCall.style.display = 'none';
			    if(btnSms) btnSms.style.display = 'none';
			    
			    // Hämta dropdown-elementen säkert
			    const statusSelect = document.getElementById('statusSelect');
			    const templateSelect = document.getElementById('templateSelect');
			
			    // --- LÄGE: LÄGG TILL (ADD) ---
			    if (mode === 'add') {
			        modalTitle.textContent = 'Lägg till nytt jobb';
			        modalSaveBtn.textContent = 'Spara'; 
			        modalJobId.value = '';
					modalKundpris.value = '';
			        
			        // Standardvärden
			        if(statusSelect) statusSelect.value = 'bokad'; 
			        if(templateSelect) templateSelect.value = "";
			
			        if (dataToClone) {
			            // KLONING (Kopiera från ett gammalt jobb)
			            if(statusSelect) statusSelect.value = dataToClone.status || 'bokad';
			            if(document.getElementById('prio')) document.getElementById('prio').checked = dataToClone.prio || false;
			            
			            // Datum & Tid
			            modalDatum.value = dataToClone.datum ? dataToClone.datum.split('T')[0] : new Date().toISOString().split('T')[0];
			            modalTid.value = dataToClone.datum ? new Date(dataToClone.datum).toTimeString().substring(0,5) : new Date().toTimeString().substring(0,5);
			            
			            // Fyll i fält
			            modalRegnr.value = dataToClone.regnr || '';
			            modalKundnamn.value = (dataToClone.kundnamn || '').toUpperCase();
			            modalTelefon.value = dataToClone.telefon || '';
			            modalKundpris.value = dataToClone.kundpris || 0;
			
			            // Utgifter
			            if (dataToClone.expenseItems && Array.isArray(dataToClone.expenseItems)) {
			                currentExpenses = [...dataToClone.expenseItems];
			            } else if (dataToClone.utgifter > 0) {
			                currentExpenses = [{ name: "Generell utgift", cost: dataToClone.utgifter || 0 }];
			            }
			
			            document.getElementById('kommentarer').value = dataToClone.kommentarer || '';
			            document.getElementById('matarstallning').value = dataToClone.matarstallning || '';
			        } else {
			            // HELT NYTT (Tomt)
			            if(document.getElementById('prio')) document.getElementById('prio').checked = false;
			            const now = new Date();
			            modalDatum.value = now.toISOString().split('T')[0];
			            modalTid.value = now.toTimeString().substring(0,5);
			            currentExpenses = [];
			        }
			    } 
			    // --- LÄGE: REDIGERA (EDIT) ---
			    else if (mode === 'edit' && dataToClone) {
			        modalTitle.textContent = 'Redigera Jobb';
			        modalSaveBtn.textContent = 'Spara'; 
			        modalJobId.value = dataToClone.id;
			        
			        // Sätt status
			        if(statusSelect) statusSelect.value = dataToClone.status || 'bokad';
			        if(templateSelect) templateSelect.value = ""; // Nollställ mall vid redigering
			
			        if(document.getElementById('prio')) document.getElementById('prio').checked = dataToClone.prio || false;
			
			        // Fyll i Datum & Tid (Detta saknades troligen förut!)
			        if (dataToClone.datum) {
			            const d = new Date(dataToClone.datum);
			            modalDatum.value = d.toISOString().split('T')[0];
			            modalTid.value = d.toTimeString().substring(0,5);
			        } else {
			            modalDatum.value = ''; modalTid.value = '';
			        }
			        
			        // Fyll i Textfält
			        modalRegnr.value = dataToClone.regnr || '';
			        modalKundnamn.value = (dataToClone.kundnamn || '').toUpperCase();
			        modalTelefon.value = dataToClone.telefon || '';
			        modalKundpris.value = dataToClone.kundpris || 0;
			        
			        // Fyll i Utgifter
			        if (dataToClone.expenseItems && Array.isArray(dataToClone.expenseItems)) {
			            currentExpenses = [...dataToClone.expenseItems];
			        } else if (dataToClone.utgifter > 0) {
			            currentExpenses = [{ name: "Generell utgift", cost: dataToClone.utgifter || 0 }];
			        } else {
			            currentExpenses = [];
			        }
			
			        document.getElementById('kommentarer').value = dataToClone.kommentarer || '';
			        document.getElementById('matarstallning').value = dataToClone.matarstallning || '';
			    }
			    
			    // Uppdatera listor och kalkyler
			    renderExpensesList();
			    updateLiveProfit();
			    
			    // Trigga input-eventet för telefon (visar knappar om nummer finns)
			    if (modalTelefon) modalTelefon.dispatchEvent(new Event('input')); 
			
			    // Visa modalen
			    showModal('jobModal', options);
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

                let tableHTML = `
				    <table class="detail-job-table">
				        <thead>
				            <tr>
				                <th>Datum</th>
				                <th>Info</th>
				                <th>Status</th>
				                <th class="money-related">Vinst</th>
				            </tr>
				        </thead>
				        <tbody>
				`;
				
				/* --- I funktionen renderDetailJobList --- */

				tableHTML += filteredJobs.map(job => {
				    const prioIcon = job.prio ? `...` : ''; 
				    const subline = (listElement === customerModalJobList) ? job.regnr : job.kundnamn;
				
				    // Datum-logik
				    const jobDate = new Date(job.datum);
				    const currentYear = new Date().getFullYear();
				    const jobYear = jobDate.getFullYear();
				    
				    const day = jobDate.getDate();
				    const month = jobDate.toLocaleString('sv-SE', { month: 'short' }).replace('.', '');
				    
				    const yearHTML = (jobYear !== currentYear) 
				        ? `<span style="display:block; font-size:0.75em; color:#9CA3AF; font-weight:400;">${jobYear}</span>` 
				        : '';
				
				    return `
				        <tr data-job-id="${job.id}">
				            <td data-label="Datum">
				                <div class="date-wrapper" style="text-align: right; display: inline-block;">
				                    <span style="font-weight: 700; color: #111;">${day}</span>
				                    <span style="font-size: 0.85em; color: #6B7280; margin-left: 2px;">${month}</span>
				                    ${yearHTML}
				                </div>
				            </td>
				            <td data-label="Info">
				                <span class="job-subline-main">${prioIcon}${subline || '---'}</span>
				                ${job.kommentarer ? `<span class="job-subline-comment">${job.kommentarer}</span>` : ''}
				            </td>
				            <td data-label="Status">
				                <span class="status-badge status-${job.status}">${STATUS_TEXT[job.status]}</span>
				            </td>
				            <td data-label="Vinst" class="job-profit money-related ${job.vinst > 0 ? 'positive' : ''}">
				                ${isPrivacyModeEnabled ? '---' : formatCurrency(job.vinst)}
				            </td>
				        </tr>
				    `;
				}).join('');
				
				tableHTML += `</tbody></table>`;
				listElement.innerHTML = tableHTML;
            }

            function openCustomerModal(kundnamn) {
                const customerJobs = allJobs.filter(j => !j.deleted && j.kundnamn === kundnamn).sort((a, b) => new Date(b.datum) - new Date(a.datum));
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

			// När du väljer något nytt i listan (t.ex. "Pris")
			if (sortBySelect) {
			    sortBySelect.addEventListener('change', (e) => {
			        currentSortField = e.target.value;
			        renderTimeline(); // Rita om listan direkt med nya sorteringen
			    });
			}
			
			// När du klickar på pil-knappen
			if (sortDirectionBtn) {
			    sortDirectionBtn.addEventListener('click', () => {
			        // Byt håll: Om den var 'asc', bli 'desc'. Annars bli 'asc'.
			        currentSortOrder = (currentSortOrder === 'desc') ? 'asc' : 'desc';
			        
			        // Vänd på pil-ikonen visuellt
			        sortDirectionBtn.classList.toggle('descending', currentSortOrder === 'desc');
			        
			        renderTimeline(); // Rita om listan
			    });
			}

            function openCarModal(regnr) {
                if (!regnr) return;
                const carJobs = allJobs.filter(j => !j.deleted && j.regnr === regnr).sort((a, b) => new Date(b.datum) - new Date(a.datum));
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
                const completedJobs = allJobs.filter(j => !j.deleted && j.status === 'klar');
				const utgaendeFordringar = allJobs
			        .filter(j => !j.deleted && j.status === 'faktureras')
			        .reduce((sum, j) => sum + (j.vinst || 0), 0);
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
				statsModalFordringar.textContent = formatCurrency(utgaendeFordringar);
    			statsModalFordringar.className = utgaendeFordringar > 0 ? 'stat-value warning' : 'stat-value'; // Använd warning-färg

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
			    if (confirm('Vill du flytta jobbet till papperskorgen?')) {
			        // ÄNDRING: Vi använder .update istället för .delete
			        db.collection("jobs").doc(jobId).update({
			            deleted: true,              // Markera som raderad
			            deletedAt: new Date().toISOString() // Spara datumet då det raderades (för 30-dagars regeln)
			        })
			        .then(() => showToast('Jobb flyttat till papperskorgen.', 'info'))
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
			        
			        let statusToSet = newStatus;
			        let toastMessage = '';
			
			        // LOGIK FÖR FÖRETAGSKUNDER
			        // Om vi försöker sätta den till "Klar", kolla om det är en företagskund
			        if (newStatus === 'klar') {
			            const kundLiten = job.kundnamn.toLowerCase();
			            const isCorporate = CORPORATE_CLIENTS.some(client => kundLiten.includes(client));
			            
			            if (isCorporate) {
			                statusToSet = 'faktureras'; // Ändra målet till faktureras
			                toastMessage = 'Företagskund: Flyttad till "Fakturering" i väntan på betalning.';
			            }
			        }
			
			        db.collection("jobs").doc(jobId).update({
			            status: statusToSet
			        })
			        .then(() => {
			            if (toastMessage) {
			                showToast(toastMessage, 'info');
			            } else {
			                // Standard meddelanden
			                if (statusToSet === 'klar') {
			                    // Tyst (hanteras av "Ångra"-toasten i anropet)
			                } else {
			                    const statusText = STATUS_TEXT[statusToSet] || statusToSet;
			                    showToast(`Jobb markerat som "${statusText}".`);
			                }
			            }
			            
			            // Om vi tvingade över den till 'faktureras', se till att UI uppdateras korrekt
			            // (renderTimeline/renderKanban körs automatiskt via onSnapshot, så det löser sig)
			        })
			        .catch(err => showToast(`Fel: ${err.message}`, 'danger'));
			    }
			}
            
            // --- `handleFormSubmit` med Spinner ---
            async function handleFormSubmit(e) {
			    e.preventDefault();
			    
			    const statusEl = document.getElementById('statusSelect');
			    const statusVal = statusEl ? statusEl.value : 'bokad'; 
			
			    const jobId = document.getElementById('jobId').value;
			    
			    const prisEl = document.getElementById('kundpris');
			    const kundpris = prisEl ? (parseFloat(prisEl.value) || 0) : 0;
			    
			    // Om currentExpenses inte finns (om du laddat om sidan och variabeln tappats), skapa den
			    if (typeof currentExpenses === 'undefined') {
			        window.currentExpenses = [];
			    }
			
			    const totalUtgifter = currentExpenses.reduce((sum, item) => sum + (item.cost || 0), 0);
			    const vinst = kundpris - totalUtgifter;
			
			    const datumVal = document.getElementById('datum').value;
			    const tidVal = document.getElementById('tid').value || '09:00';
			    const fullDatum = `${datumVal}T${tidVal}`;
			    
			    const regnrVal = document.getElementById('regnr').value.toUpperCase();
			    const namnVal = document.getElementById('kundnamn').value.toUpperCase();
			    const tfnVal = document.getElementById('telefon').value;
			    const kommVal = document.getElementById('kommentarer').value;
			    const matarVal = document.getElementById('matarstallning').value;
			    
			    const prioEl = document.getElementById('prio');
			    const prioVal = prioEl ? prioEl.checked : false;
			
			    if (statusVal === 'klar' && kundpris === 0) {
			        alert('Ett "Klar" jobb kan inte ha 0 kr i kundpris.');
			        return;
			    }
			    
			    const savedData = { 
			        status: statusVal,
			        datum: fullDatum,
			        regnr: regnrVal,
			        kundnamn: namnVal,
			        telefon: tfnVal,
			        kundpris: kundpris,
			        utgifter: totalUtgifter,      
			        expenseItems: currentExpenses,
			        vinst: vinst,                 
			        kommentarer: kommVal,
			        prio: prioVal,
			        matarstallning: matarVal
			    };
			    
			    const saveBtn = document.getElementById('modalSaveBtn');
			    const originalButtonText = saveBtn.textContent;
			    saveBtn.disabled = true;
			    saveBtn.innerHTML = `<span>Sparar...</span>`;
			
			    try {
			        if (jobId) {
			            await db.collection("jobs").doc(jobId).update(savedData);
			            showToast('Jobb uppdaterat!');
			        } else {
			            await db.collection("jobs").add(savedData);
			            showToast('Jobb sparat!');
			        }
			        closeModal();
			    } catch (err) {
			        console.error(err);
			        showToast(`Fel: ${err.message}`, 'danger');
			    } finally {
			        saveBtn.disabled = false;
			        saveBtn.textContent = originalButtonText; 
			    }
			}
            
            // --- `jobListContainer` klick-hanterare med "Ångra" ---
            jobListContainer.addEventListener('click', (e) => {
				e.stopPropagation();
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
							
							    // SKAPA EN VARIABEL FÖR REGNR (om det finns)
							    const regInfo = (job.regnr && job.regnr !== 'OKÄNT') ? ` (${job.regnr})` : '';
							
							    showConfirmation(
							        'Markera som Klar?', 
							        // LÄGG TILL regInfo HÄR:
							        `Vill du avsluta jobbet för ${job.kundnamn}${regInfo}?`, 
							        'success', 
							        () => {
							            quickSetStatus(id, 'klar');
							        }
							    );
							    return;
							}
                        }
                    }
                    if (actionButton.classList.contains('delete-btn')) {
					    e.stopPropagation();
					    
					    const job = findJob(id);
					    
					    // SKAPA NAMN + REGNR FÖR MEDDELANDET
					    let jobDisplay = 'detta jobb';
					    if (job) {
					        const regInfo = (job.regnr && job.regnr !== 'OKÄNT') ? ` (${job.regnr})` : '';
					        jobDisplay = `${job.kundnamn}${regInfo}`;
					    }
					
					    showConfirmation(
					        'Radera jobb?', 
					        // ANVÄND jobDisplay HÄR:
					        `Är du säker på att du vill ta bort jobbet för ${jobDisplay}?`, 
					        'danger', 
					        () => {
					            db.collection("jobs").doc(id).update({
					                deleted: true,
					                deletedAt: new Date().toISOString()
					            })
					            .then(() => showToast('Jobb flyttat till papperskorgen.', 'info'))
					            .catch(err => showToast(`Fel: ${err.message}`, 'danger'));
					        }
					    );
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

			function resetAndCloseSearch() {
			    const mSearchModal = document.getElementById('mobileSearchModal');
			    
			    // 1. Dölj modalen
			    if (mSearchModal) {
			        mSearchModal.style.cssText = 'display: none !important';
			        mSearchModal.classList.remove('show');
			    }
			
			    // 2. Töm alla sökfält
			    const mInput = document.getElementById('mobileSearchBar');
			    const dInput = document.getElementById('searchBar');
			    if (mInput) mInput.value = '';
			    if (dInput) dInput.value = '';
			
			    // 3. Nollställ den interna sökvariabeln
			    currentSearchTerm = '';
			
			    // 4. Dölj alla "Rensa"-knappar
			    const globalClearBtn = document.getElementById('clearDayFilterBtn');
			    const mClearBtn = document.getElementById('mobileSearchClear');
			    const dClearBtn = document.getElementById('desktopSearchClear');
			    
			    if (globalClearBtn) globalClearBtn.style.display = 'none';
			    if (mClearBtn) mClearBtn.style.cssText = 'display: none !important';
			    if (dClearBtn) dClearBtn.style.cssText = 'display: none !important';
			
			    // 5. VIKTIGT: Tvinga startsidan (Tidslinjen) att ritas om helt ren!
			    renderTimeline(); 
			    
			    // (Vi kör även performSearch för att nollställa söklistan inför nästa gång)
			    performSearch();
			}

            // --- Sök-hanterare (Med rensa-knappar) ---
			function performSearch() {
			    const desktopInput = document.getElementById('searchBar');
			    const mobileInput = document.getElementById('mobileSearchBar');
			    const wrapper = document.querySelector('.search-wrapper');
			    
			    const desktopVal = desktopInput ? desktopInput.value : '';
			    const mobileVal = mobileInput ? mobileInput.value : '';
			    currentSearchTerm = desktopVal || mobileVal;
			
			    // Visa/Dölj rensa-knappar
			    if (document.getElementById('desktopSearchClear')) {
			        document.getElementById('desktopSearchClear').style.cssText = desktopVal ? 'display: flex !important' : 'display: none !important';
			    }
			    if (document.getElementById('mobileSearchClear')) {
			        document.getElementById('mobileSearchClear').style.cssText = mobileVal ? 'display: flex !important' : 'display: none !important';
			    }
			
			    if (wrapper) wrapper.classList.remove('is-loading'); 
			    
			    // --- MOBIL LOGIK ---
			    const mobileModal = document.getElementById('mobileSearchModal');
			    const mobileResults = document.getElementById('mobileSearchResults');
			    
			    if (mobileModal && getComputedStyle(mobileModal).display !== 'flex' && window.innerWidth > 768) {
			        // Om vi är på desktop, kör vanliga tidslinjen
			        renderTimeline();
			        return;
			    }
			
			    // Om vi är på mobil och modalen är öppen (eller vi tvingar uppdatering)
			    if (mobileResults) {
			        
			        if (!currentSearchTerm.trim()) {
			            mobileResults.innerHTML = `
			                <div class="empty-search-placeholder" style="text-align: center; padding-top: 3rem; color: #9ca3af;">
			                    <svg class="icon-lg" viewBox="0 0 24 24"><use href="#icon-search"></use></svg>
			                    <p>Sök efter kunder, reg.nr eller info...</p>
			                </div>`;
			            return;
			        }
			
			        let jobs = allJobs.filter(job => !job.deleted);
			        const term = currentSearchTerm.toLowerCase();
			        const normalizedTerm = term.replace(/\s/g, ''); // Ta bort mellanslag för smartare sök
			
			        jobs = jobs.filter(job => {
			            const normalizedPhone = (job.telefon || '').replace(/\D/g, '');
			            const regMatch = (job.regnr && job.regnr.toLowerCase().replace(/\s/g, '').includes(normalizedTerm));
			            
			            return (
			                (job.kundnamn && job.kundnamn.toLowerCase().includes(term)) || 
			                regMatch || 
			                (job.kommentarer && job.kommentarer.toLowerCase().includes(term)) ||
			                (normalizedPhone && normalizedPhone.includes(normalizedTerm))
			            );
			        });
			
			        if (jobs.length === 0) {
			            mobileResults.innerHTML = '<p style="text-align:center; color:#999; margin-top:2rem;">Inga träffar.</p>';
			        } else {
			            // --- HÄR ÄR ÄNDRINGEN FÖR ATT FÅ RUBRIKER ---
			            
			            // 1. Gruppera jobben per datum
			            const groupedJobs = jobs.reduce((acc, job) => {
			                const dateKey = job.datum ? job.datum.split('T')[0] : 'Okänt';
			                if (!acc[dateKey]) { acc[dateKey] = []; }
			                acc[dateKey].push(job);
			                return acc;
			            }, {});
			
			            // 2. Sortera datumen (Nyaste överst oftast bäst vid sök, eller äldst först)
			            // Vi kör fallande (nyaste först) för sökresultat
			            const sortedDateKeys = Object.keys(groupedJobs).sort((a, b) => new Date(b) - new Date(a));
			
			            let listHTML = '';
			
			            // 3. Bygg HTML med rubriker
			            for (const dateKey of sortedDateKeys) {
			                const jobsForDay = groupedJobs[dateKey];
			                const firstJobDate = jobsForDay[0].datum;
			                
			                // Återanvänd din snygga rubrik-klass
			                listHTML += `<div class="mobile-day-group">`;
			                listHTML += `<h2 class="mobile-date-header">${formatDate(firstJobDate, { onlyDate: true })}</h2>`;
			                listHTML += jobsForDay.map(job => createJobCard(job)).join('');
			                listHTML += `</div>`;
			            }
			
			            mobileResults.innerHTML = listHTML;
			        }
			        return; 
			    }
			
			    // Fallback för desktop
			    renderTimeline();
			}

            if (searchBar) {
		        searchBar.addEventListener('input', debounce(() => {
		            if (desktopSearchWrapper) desktopSearchWrapper.classList.add('is-searching');
		            performSearch();
		        }, 300));
		    }
		
		    // Mobil Input
		    if (mobileSearchBar) {
		        mobileSearchBar.addEventListener('input', debounce(performSearch, 300));
		        
		        // Hantera "Enter/Sök" på mobil-tangentbordet
		        mobileSearchBar.addEventListener('keyup', (e) => {
		            if (e.key === 'Enter') {
		                e.preventDefault();
		                mobileSearchBar.blur(); 
		                performSearch(); 
		            }
		        });
		    }

			const mobileSortContainer = document.getElementById('mobileSortOptions');

		    if (mobileSortContainer) {
		        mobileSortContainer.addEventListener('click', (e) => {
		            // Kolla om vi klickade på en av knapparna (chipsen)
		            if (e.target.classList.contains('sort-chip')) {
		                
		                // 1. Visuell uppdatering (Flytta den blå färgen)
		                document.querySelectorAll('.sort-chip').forEach(btn => btn.classList.remove('active'));
		                e.target.classList.add('active');
		                
		                // 2. Uppdatera global sortering (variabeln vi skapade tidigare)
		                currentSortField = e.target.dataset.sort;
		                
		                // 3. (Valfritt) Byt till fallande ordning automatiskt om man väljer Pris
		                if (currentSortField === 'kundpris') {
		                    currentSortOrder = 'desc';
		                } else if (currentSortField === 'datum') {
		                    // Om man går tillbaka till datum, kanske man vill ha "Kommande" (asc) eller "Nyaste" (desc)
		                    // Låt oss behålla nuvarande ordning eller sätta en standard:
		                    // currentSortOrder = 'asc'; 
		                }
		                
		                // 4. Rita om listan med den nya sorteringen
		                performSearch(); 
		            }
		        });
		    }
            
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
                    
                    // ... (kod för sökrensning är oförändrad) ...
                    if (currentSearchTerm) {
                        searchBar.value = '';
                        mobileSearchBar.value = '';
                        currentSearchTerm = '';
                        desktopSearchClear.style.display = 'none';
                        mobileSearchClear.style.display = 'none';
                        clearDayFilterBtn.style.display = 'none';
                        const desktopSearchCount = document.getElementById('desktopSearchResultCount');
                        if (desktopSearchCount) {
                            desktopSearchCount.textContent = '';
                        }
                    }
                    
                    currentStatusFilter = card.dataset.filter;

					// Alltid sortera på Datum som standard när man byter flik
					currentSortField = 'datum'; 
					
					if (currentStatusFilter === 'kommande') {
					    // För Kommande vill vi se det som händer SNART överst (Stigande: 1 jan -> 5 jan)
					    currentSortOrder = 'asc';
					} else {
					    // För Klar, Alla, Faktureras vill vi se det NYASTE överst (Fallande: 5 jan -> 1 jan)
					    currentSortOrder = 'desc';
					}
					
					// 3. VIKTIGT: Uppdatera även själva knapparna i gränssnittet så de visar rätt!
					if (sortBySelect) sortBySelect.value = 'datum'; // Sätt dropdown till Datum
					
					if (sortDirectionBtn) {
					    // Uppdatera pil-ikonens rotation baserat på vår nya ordning
					    sortDirectionBtn.classList.toggle('descending', currentSortOrder === 'desc');
					}
                    
                    // --- KORRIGERAD KANBAN-SCROLL-LOGIK START (Tvingar vertikal position) ---
                    if (currentView === 'kanban') {
                        renderKanbanBoard(); 
                        
                        setTimeout(() => {
                            const kanbanBoard = document.querySelector('.kanban-board');
                            let targetColumn = null;

                            switch (currentStatusFilter) {
                                case 'offererad':
                                case 'alla':
                                    targetColumn = document.getElementById('kanban-col-offererad')?.closest('.kanban-column');
                                    break;
                                case 'bokad':
                                case 'kommande':
                                    targetColumn = document.getElementById('kanban-col-bokad')?.closest('.kanban-column');
                                    break;
                                case 'faktureras':
                                    targetColumn = document.getElementById('kanban-col-faktureras')?.closest('.kanban-column');
                                    break;
                                case 'klar':
                                    targetColumn = document.getElementById('kanban-col-klar')?.closest('.kanban-column');
                                    break;
                            }

                            if (kanbanBoard && targetColumn) {
                                
                                // FIX: Använd scrollTo() för båda fallen, med smart beräkning för "Klar"
                                const boardPaddingLeft = 16; 
                                let scrollLeftPosition = 0;

                                if (currentStatusFilter === 'klar') {
                                    // Beräkna positionen så att kolumnens högra kant når höger sida av skärmen.
                                    // Detta är elementets vänstra offset + dess bredd - skärmens/kanban-behållarens bredd.
                                    const columnWidth = targetColumn.offsetWidth;
                                    const boardWidth = kanbanBoard.offsetWidth;

                                    scrollLeftPosition = (targetColumn.offsetLeft + columnWidth) - boardWidth + boardPaddingLeft;
                                    
                                } else {
                                    // För de andra, scrolla till kolumnens vänstra kant.
                                    scrollLeftPosition = targetColumn.offsetLeft - boardPaddingLeft;
                                }

                                // Vi tvingar nu scrollningen med scrollTo() och sätter 'top' till noll (0)
                                // för att säkerställa att ingen vertikal scrollning sker.
                                kanbanBoard.scrollTo({
                                    left: scrollLeftPosition, 
                                    top: 0, // <--- DETTA FÖRHINDRAR VERTIKAL SCROLLNING
                                    behavior: 'smooth'
                                });
                            }
                        }, 50); 
                    }
                    // --- KORRIGERAD KANBAN-SCROLL-LOGIK SLUT ---
                    
                    renderTimeline();
                    renderGlobalStats(allJobs);
                    filterCalendarView();
                }
            });
            
            jobModalForm.addEventListener('submit', handleFormSubmit);
            fabAddJob.addEventListener('click', () => openJobModal('add'));
            emptyStateAddBtn.addEventListener('click', () => openJobModal('add'));

			const accordionToggle = document.getElementById('extraDetailsToggle');
            const accordionContent = document.getElementById('extraDetailsContent');

            if (accordionToggle && accordionContent) {
                accordionToggle.addEventListener('click', () => {
                    // Växla klasser
                    accordionToggle.classList.toggle('active');
                    accordionContent.classList.toggle('show');
                });
            }
            
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
            
            function openSettingsModal() {
                // Läs in sparat vinstmål och fyll i fältet
                profitGoalInput.value = currentProfitGoal > 0 ? currentProfitGoal : '';
                
                // Läs in sparad standardvy och markera rätt knapp
                const savedView = localStorage.getItem('defaultView') || 'timeline';
                if (savedView === 'calendar') {
                    document.getElementById('defaultViewCalendar').checked = true;
                } else if (savedView === 'kanban') {
                    document.getElementById('defaultViewKanban').checked = true;
                } else {
                    document.getElementById('defaultViewTimeline').checked = true;
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
			
			    // --- NY LOGIK FÖR ATT SPARA OLJE-INSTÄLLNINGAR ---
			    const startAmount = parseFloat(document.getElementById('oilStartAmount').value) || 0;
			    const startDate = document.getElementById('oilStartDate').value;
			
			    db.collection("settings").doc("inventory").set({ 
			        oilStartAmount: startAmount,
			        oilStartDate: startDate
			    }, { merge: true });
			    // -------------------------------------------------
			
			    showToast('Inställningar sparade & lager omräknat!', 'success');
			    closeModal();
			    
			    // Tvinga en omräkning direkt
			    calculateOilStock();
			});

            settingsThemeToggle.addEventListener('click', () => themeToggle.click());
            settingsLockAppBtn.addEventListener('click', () => {
                closeModal();
                setTimeout(() => lockAppBtn.click(), 250);
            });
            
            // --- Klickbara jobblistor i Kund/Bil-modal (FIXAD HISTORIK) ---
            function handleDetailListClick(e) {
                const jobItem = e.target.closest('tr[data-job-id]');
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
                        openJobSummaryModal(job);
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
                        item.dataset.name = name; // <--- HÄR ÄR FIXEN!
                        item.addEventListener('click', () => {
                            const name = item.dataset.name; // Denna rad fungerar nu
                            modalKundnamn.value = name;
                            kundnamnSuggestions.style.display = 'none';
                            kundnamnSuggestions.innerHTML = '';
                            
                            // --- SISTA FIXEN: Fyll bara tomma fält ---
                            const existingJob = findLatestJob('kundnamn', name); 
                            
                            if (existingJob) {
                                // Fyll BARA om telefon-fältet är tomt
                                if (modalTelefon.value === '') {
                                    modalTelefon.value = existingJob.telefon || '';
                                    // Bonus: Trigga input-eventet för att visa Ring/SMS-knapparna
                                    modalTelefon.dispatchEvent(new Event('input'));
                                }
                                // Bonus 2: Fyll även i regnr om det är tomt
                                if (modalRegnr.value === '') {
                                    modalRegnr.value = existingJob.regnr || '';
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
            
			if (quickTimeButtons) {
			    quickTimeButtons.addEventListener('click', (e) => {
			        if (e.target.dataset.time) {
			            e.preventDefault();
			            modalTid.value = e.target.dataset.time;
			        }
			    });
			}

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
            if (copyKundnamnBtn) {
			    copyKundnamnBtn.addEventListener('click', () => copyToClipboard(modalKundnamn.value, 'Kundnamn'));
			}
			
			if (copyRegnrBtn) {
			    copyRegnrBtn.addEventListener('click', () => copyToClipboard(modalRegnr.value, 'Reg.nr'));
			}

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

			// 1. Hämta elementen vi behöver
			const mSearchModal = document.getElementById('mobileSearchModal');
			const mNavOpenBtn = document.getElementById('mobileSearchBtn'); // Knappen i botten-menyn
			const mHeaderBackBtn = document.getElementById('mobileSearchBackBtn');
			
			if (mHeaderBackBtn) {
			    mHeaderBackBtn.onclick = function(e) {
			        e.preventDefault();
			        resetAndCloseSearch(); // Kör vår nya städ-funktion
			    };
			}
			//const mInput = document.getElementById('mobileSearchBar');
			
			// 2. Logik för att ÖPPNA (Knappen i menyn)
			if (mNavOpenBtn && mSearchModal) {
			    mNavOpenBtn.addEventListener('click', (e) => {
			        e.preventDefault();
			        
			        // --- PUNKT 2: LÄGG TILL I HISTORIKEN ---
			        // Detta gör att "Bakåt" på telefonen har något att gå tillbaka till
			        window.history.pushState({ modal: 'mobileSearch' }, 'Sök', '#search');
			        
			        mSearchModal.style.display = 'flex';
			        
			        setTimeout(() => {
			            if (mInput) mInput.focus();
			        }, 150); 
			    });
			}
			
			// 3. Logik för att STÄNGA (Pilen tillbaka)
			if (mHeaderBackBtn && mSearchModal) {
			    mHeaderBackBtn.addEventListener('click', (e) => {
			        e.preventDefault();
			        
			        // 1. Dölj modalen
			        mSearchModal.style.display = 'none';
			        
			        // 2. Töm sökfältet helt
			        if (mInput) mInput.value = '';
			        
			        // 3. NOLLSTÄLL SÖKNINGEN GLOBAL
			        currentSearchTerm = ''; // Viktigt!
			        
			        // 4. Dölj "Rensa"-knappen på hemskärmen (den heter clearDayFilterBtn eller liknande i din HTML)
			        const globalClearBtn = document.getElementById('clearDayFilterBtn'); // Eller 'desktopSearchClear' om den syns
			        if (globalClearBtn) globalClearBtn.style.display = 'none';
			        
			        // 5. Uppdatera listan så alla jobb syns igen
			        performSearch(); 
			    });
			}
            
            function setHeaderDate() {
                let datePart = new Intl.DateTimeFormat(locale, { weekday: 'short', month: 'short', day: 'numeric' }).format(new Date());
                appBrandTitle.textContent = datePart.charAt(0).toUpperCase() + datePart.slice(1);
            }
            setHeaderDate();
            
            document.addEventListener('keydown', (e) => {
                if (currentOpenModalId === 'pinLockModal' && e.key === 'Escape') {
                    e.preventDefault();
                    return;
                }

				const prisInput = document.getElementById('kundpris');
				if (prisInput) {
				    prisInput.addEventListener('input', updateLiveProfit);
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
         
            // --- SÄKERHETSSYSTEM (REVIDERAD & PROFFSIG) ---
            
            // Konfiguration
            const SECURITY_CONFIG = {
                pinKey: 'jobbPlannerarePin',
                sessionKey: 'jobbPlannerareSessionToken', // Används för att se om vi är inloggade just nu
                idleTimeoutMs: 5 * 60 * 1000,    // 5 minuter inaktivitet = Lås
                backgroundLockMs: 60 * 1000,     // 1 minut i bakgrunden (annan flik) = Lås
                defaultPin: '0912'
            };

            let idleTimer;
            let backgroundTimer;

            // Funktion: Starta om inaktivitets-timern
            function resetIdleTimer() {
                clearTimeout(idleTimer);
                // Om appen är låst, gör inget
                if (isAppLocked()) return;

                idleTimer = setTimeout(() => {
                    console.log("Inaktivitet detekterad. Låser appen.");
                    lockApp("Du har varit inaktiv för länge.");
                }, SECURITY_CONFIG.idleTimeoutMs);
            }

            // Funktion: Kontrollera om appen är låst
            function isAppLocked() {
                return !sessionStorage.getItem(SECURITY_CONFIG.sessionKey);
            }

            // Funktion: Visa låsskärmen
            function showPinLock(message = "") {
                // SÄKERHETS-FIX: Dölj innehållet helt (inget blur) för att stoppa blinkande
                if (appContainer) appContainer.style.display = 'none'; 
                
                // Dölj flytande knappar
                if (typeof fabAddJob !== 'undefined' && fabAddJob) fabAddJob.style.display = 'none';
                if (typeof mobileNav !== 'undefined' && mobileNav) mobileNav.style.display = 'none';
                
                // Visa modal
                const pinLockModal = document.getElementById('pinLockModal');
                pinLockModal.style.display = 'flex';
                // Liten delay för animering
                setTimeout(() => pinLockModal.classList.add('show'), 10);
                
                // Fokusera input
                const pinInput = document.getElementById('pinInput');
                if (pinInput) {
                    pinInput.value = '';
                    setTimeout(() => pinInput.focus(), 100);
                }

                // Visa felmeddelande om vi blev utkastade (t.ex. vid inaktivitet)
                const pinError = document.getElementById('pinError');
                if (message && pinError) {
                    pinError.textContent = message;
                    pinError.style.color = "var(--warning-color)";
                } else if (pinError) {
                    pinError.textContent = "";
                }
            }
            
            // Funktion: Lås appen (Rensa session)
            function lockApp(reason = "") {
                // Ta bort session-token
                sessionStorage.removeItem(SECURITY_CONFIG.sessionKey);
                
                // Stäng eventuella öppna modaler (för säkerhet)
                if (typeof closeModal === 'function') closeModal({ popHistory: false });
                
                showPinLock(reason);
            }

            // Funktion: Lås upp appen
            function unlockApp() {
                // Sätt session-token
                sessionStorage.setItem(SECURITY_CONFIG.sessionKey, 'active');
                
                // SÄKERHETS-FIX: Visa innehållet nu när vi är inloggade
                if (appContainer) {
                    appContainer.style.display = 'block'; 
                    appContainer.style.filter = "none"; // Ta bort eventuell gammal blur
                    appContainer.style.pointerEvents = "auto";
                }

                // Visa knappar igen
                if (typeof fabAddJob !== 'undefined' && fabAddJob) fabAddJob.style.display = 'flex';
                if (typeof mobileNav !== 'undefined' && mobileNav && window.innerWidth <= 768) {
                    mobileNav.style.display = 'flex';
                }
                
                // Dölj modal
                const pinLockModal = document.getElementById('pinLockModal');
                pinLockModal.classList.remove('show');
                setTimeout(() => { pinLockModal.style.display = 'none'; }, 300);

                // Starta timers för inaktivitet
                resetIdleTimer();
                
                // Initiera data om det är första gången (så listan laddas)
                if (!appInitialized) {
                    appInitialized = true;
                    console.log("Appen upplåst -> Initierar system...");
                    if (typeof initializeCalendar === 'function') initializeCalendar();
                    if (typeof initRealtimeListener === 'function') initRealtimeListener();
                    if (typeof initInventoryListener === 'function') initInventoryListener();
                    
                    // Se till att rätt vy visas
                    if (typeof toggleView === 'function') toggleView(currentView);
                }
                
                //if (typeof showToast === 'function') showToast("Välkommen tillbaka!", "success");
            }
            
            // --- SÄKERHETSSYSTEM (FIREBASE AUTH) ---

            const auth = firebase.auth();
            const pinLockModal = document.getElementById('pinLockModal');
            const authForm = document.getElementById('authForm');
            const authError = document.getElementById('authError');
            const lockAppBtn = document.getElementById('lockAppBtn');

            // 1. Lyssna på inloggningsstatus (Detta är hjärtat i säkerheten)
            auth.onAuthStateChanged(user => {
                if (user) {
                    // --- ANVÄNDAREN ÄR INLOGGAD ---
                    console.log("Inloggad som:", user.email);
                    
                    // Dölj låsskärmen
                    pinLockModal.classList.remove('show');
                    setTimeout(() => { 
                        pinLockModal.style.display = 'none'; 
                        // Visa appens innehåll
                        appContainer.style.display = 'block';
                    }, 300);

                    // Initiera appen om det inte redan är gjort
                    if (!appInitialized) {
                        appInitialized = true;
                        initializeCalendar();
                        initRealtimeListener();
                        initInventoryListener();
                        toggleView(currentView);
                    }
                } else {
                    // --- ANVÄNDAREN ÄR UTLOGGAD ---
                    console.log("Utloggad.");
                    
                    // Dölj appens innehåll
                    appContainer.style.display = 'none';
                    
                    // Visa låsskärmen
                    pinLockModal.style.display = 'flex';
                    setTimeout(() => pinLockModal.classList.add('show'), 10);
                }
            });

            // 2. Hantera inloggning (När du trycker på knappen)
            if (authForm) {
                authForm.addEventListener('submit', (e) => {
                    e.preventDefault();
                    
                    const email = document.getElementById('authEmail').value;
                    const password = document.getElementById('authPassword').value;
                    const btn = document.getElementById('authBtn');

                    // Visa att vi jobbar
                    btn.disabled = true;
                    btn.textContent = "Loggar in...";
                    authError.textContent = "";

                    auth.signInWithEmailAndPassword(email, password)
                        .then((userCredential) => {
                            // Lyckad inloggning! 
                            // (onAuthStateChanged ovan kommer köras automatiskt och låsa upp appen)
                            authForm.reset();
                            btn.disabled = false;
                            btn.textContent = "Logga in";
                        })
                        .catch((error) => {
                            btn.disabled = false;
                            btn.textContent = "Logga in";
                            console.error("Inloggningsfel:", error);
                            
                            // Visa felmeddelande
                            if (error.code === 'auth/wrong-password' || error.code === 'auth/user-not-found') {
                                authError.textContent = "Fel e-post eller lösenord.";
                            } else if (error.code === 'auth/too-many-requests') {
                                authError.textContent = "För många försök. Vänta en stund.";
                            } else {
                                authError.textContent = "Något gick fel. Försök igen.";
                            }
                            
                            // Skaka rutan (visuell feedback)
                            const container = document.querySelector('.pin-lock-container');
                            if(container) {
                                container.classList.add('shake-error');
                                setTimeout(() => container.classList.remove('shake-error'), 500);
                            }
                        });
                });
            }

            // 3. Hantera manuell låsning (Logga ut)
            if (lockAppBtn) {
                lockAppBtn.addEventListener('click', () => {
                    // Stäng menyn först
                    closeModal();
                    // Logga ut från Firebase
                    auth.signOut().then(() => {
                        showToast('Du har loggats ut.', 'info');
                    }).catch((error) => {
                        console.error("Utloggningsfel:", error);
                    });
                });
            }

			/* --- KLICK-HANTERARE FÖR MOBIL SÖKLISTA (RENSAD) --- */
		    const mobileResultList = document.getElementById('mobileSearchResults');
		
		    if (mobileResultList) {
		        mobileResultList.addEventListener('click', (e) => {
		            e.stopPropagation(); 
		
		            const target = e.target;
		            const customerLink = target.closest('.customer-link');
		            const carLink = target.closest('.car-link');
		            const card = target.closest('.mobile-job-card');
		
		            // Funktion för att öppna modal säkert och stänga tangentbord
		            const openSafe = (action) => {
		                if (document.activeElement) document.activeElement.blur();
		                setTimeout(action, 50);
		            };
		
		            if (customerLink) {
		                openSafe(() => openCustomerModal(customerLink.dataset.kund));
		                return;
		            }
		
		            if (carLink) {
		                openSafe(() => openCarModal(carLink.dataset.regnr));
		                return;
		            }
		
		            if (card) {
		                const job = findJob(card.dataset.id);
		                if (job) {
		                    openSafe(() => openJobSummaryModal(job));
		                }
		            }			
	    });
	}

});
