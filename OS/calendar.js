// calendar.js

const SafeIcon = ({ name, size = 12, className = "" }) => (
    <span className="inline-flex items-center justify-center shrink-0">
        <window.Icon name={name} size={size} className={className} />
    </span>
);

window.CalendarView = ({ allJobs = [], setEditingJob, setView }) => {
    const [currentDate, setCurrentDate] = React.useState(new Date());
    const [viewMode, setViewMode] = React.useState('MONTH');
    const [touchStart, setTouchStart] = React.useState(null);
    const [blockedDates, setBlockedDates] = React.useState([]);
    const [calSearch, setCalSearch] = React.useState('');
    const [statusFilter, setStatusFilter] = React.useState('ALLA');
    
    const [isSidebarOpen, setIsSidebarOpen] = React.useState(true);
    const [expandedCategories, setExpandedCategories] = React.useState({ 'Oplanerade jobb': true });

    // --- SCROLL-LOGIK FÖR FAB ---
    const [showFab, setShowFab] = React.useState(true);
    const [lastScrollY, setLastScrollY] = React.useState(0);
    
    React.useEffect(() => {
        const handleScroll = (e) => {
            const currentScrollY = e.target.scrollTop !== undefined ? e.target.scrollTop : window.scrollY;
            if (currentScrollY > lastScrollY && currentScrollY > 50) {
                setShowFab(false);
            } else {
                setShowFab(true);
            }
            setLastScrollY(currentScrollY);
        };
        
        window.addEventListener('scroll', handleScroll, { passive: true, capture: true });
        return () => window.removeEventListener('scroll', handleScroll, { capture: true });
    }, [lastScrollY]);

    // --- NYTT FÖR MOBILVYN ---

    // --- NYTT FÖR MOBILVYN ---
    const [selectedMobileDate, setSelectedMobileDate] = React.useState(new Date());
    const mobileMonthDays = React.useMemo(() => {
        const year = currentDate.getFullYear();
        const month = currentDate.getMonth();
        const days = [];
        const startPadding = (new Date(year, month, 1).getDay() + 6) % 7;
        for (let i = startPadding; i > 0; i--) days.push({ date: new Date(year, month, 1 - i), isCurrentMonth: false });
        const lastDay = new Date(year, month + 1, 0).getDate();
        for (let i = 1; i <= lastDay; i++) days.push({ date: new Date(year, month, i), isCurrentMonth: true });
        return days;
    }, [currentDate]);

    const monthNames = ["Januari", "Februari", "Mars", "April", "Maj", "Juni", "Juli", "Augusti", "September", "Oktober", "November", "December"];

    const backlogJobs = React.useMemo(() => {
        const categories = {
            'Oplanerade jobb': [],
            'Offererade': []
        };
        allJobs.forEach(j => {
            if ((!j.datum || j.datum === '') && !j.deleted) {
                if (j.status === 'OFFERERAD') {
                    categories['Offererade'].push(j);
                } else {
                    categories['Oplanerade jobb'].push(j);
                }
            }
        });
        return categories;
    }, [allJobs]);
    const weekDays = ["Mån", "Tis", "Ons", "Tor", "Fre", "Lör", "Sön"];

    const getWeekNumber = (d) => {
        const date = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
        const dayNum = date.getUTCDay() || 7;
        date.setUTCDate(date.getUTCDate() + 4 - dayNum);
        const yearStart = new Date(Date.UTC(date.getUTCFullYear(), 0, 1));
        return Math.ceil((((date - yearStart) / 86400000) + 1) / 7);
    };

    const copyDaySchedule = (e, dateStr, jobs) => {
        e.stopPropagation();
        if (jobs.length === 0) return;
        const text = `SCHEMA ${dateStr}:\n` + jobs.map(j => `- ${j.datum?.split('T')[1] || '08:00'} | ${j.regnr || 'OKÄND'} | ${j.kundnamn} | ${j.paket}`).join('\n');
        navigator.clipboard.writeText(text);
        alert("Dagens schema kopierat till Urklipp!");
    };

    const postponeJob = async (e, job) => {
        e.stopPropagation();
        if (!job || !job.datum) return;
        const current = new Date(job.datum);
        current.setDate(current.getDate() + 1);
        const newDateStr = `${current.getFullYear()}-${String(current.getMonth() + 1).padStart(2, '0')}-${String(current.getDate()).padStart(2, '0')}T${job.datum.split('T')[1] || '08:00'}`;
        try {
            await window.db.collection('jobs').doc(job.id).update({ datum: newDateStr });
        } catch (err) { console.error(err); }
    };

    React.useEffect(() => {
        if (!window.db) return;
        const unsub = window.db.collection('blocked_dates').onSnapshot(s => {
            setBlockedDates(s.docs.map(d => d.data().date));
        });
        return () => unsub();
    }, []);

    const jobsByDate = React.useMemo(() => {
        const map = {};
        const q = calSearch.trim().toLowerCase();
        allJobs.forEach(j => {
            if (j.datum && !j.deleted) {
                if (q) {
                    const match = `${j.kundnamn || ''} ${j.regnr || ''} ${j.paket || ''} ${j.bilmodell || ''}`.toLowerCase();
                    if (!match.includes(q)) return;
                }
                if (statusFilter !== 'ALLA' && j.status !== statusFilter) return;

                const dateKey = j.datum.split('T')[0];
                if (!map[dateKey]) map[dateKey] = [];
                map[dateKey].push(j);
            }
        });
        Object.keys(map).forEach(k => {
            map[k].sort((a, b) => (a.datum || '').localeCompare(b.datum || ''));
        });
        return map;
    }, [allJobs, calSearch, statusFilter]);

    const calendarDays = React.useMemo(() => {
        if (viewMode === 'WEEK') {
            const start = new Date(currentDate);
            const dayOffset = (start.getDay() + 6) % 7;
            start.setDate(start.getDate() - dayOffset);
            return [...Array(7)].map((_, i) => {
                const d = new Date(start);
                d.setDate(start.getDate() + i);
                return { date: d, isCurrentMonth: true };
            });
        } else {
            const year = currentDate.getFullYear();
            const month = currentDate.getMonth();
            const days = [];
            const startPadding = (new Date(year, month, 1).getDay() + 6) % 7;
            for (let i = startPadding; i > 0; i--) {
                days.push({ date: new Date(year, month, 1 - i), isCurrentMonth: false });
            }
            const lastDay = new Date(year, month + 1, 0).getDate();
            for (let i = 1; i <= lastDay; i++) {
                days.push({ date: new Date(year, month, i), isCurrentMonth: true });
            }
            const endPadding = (7 - (days.length % 7)) % 7;
            for (let i = 1; i <= endPadding; i++) {
                days.push({ date: new Date(year, month + 1, i), isCurrentMonth: false });
            }
            return days;
        }
    }, [currentDate, viewMode]);

    React.useEffect(() => {
        const timer = setTimeout(() => {
            if (window.lucide) window.lucide.createIcons();
        }, 30);
        return () => clearTimeout(timer);
    }, [viewMode, currentDate, calendarDays, calSearch, allJobs]);

    const [monthAnim, setMonthAnim] = React.useState('');
    const [dayAnim, setDayAnim] = React.useState('');
    const [monthTouch, setMonthTouch] = React.useState(null);
    const [dayTouch, setDayTouch] = React.useState(null);

    const changeSelectedDay = (days) => {
        setDayAnim(days > 0 ? 'slide-left' : 'slide-right');
        const d = new Date(selectedMobileDate);
        d.setDate(d.getDate() + days);
        setSelectedMobileDate(d);
        
        // Auto-byt månad om vi svajpar oss in i en ny månad
        if (d.getMonth() !== currentDate.getMonth() || d.getFullYear() !== currentDate.getFullYear()) {
            const newMonthDate = new Date(d);
            newMonthDate.setDate(1);
            setCurrentDate(newMonthDate);
            setMonthAnim(days > 0 ? 'slide-left' : 'slide-right');
        }
    };

    const handleMonthTouchStart = (e) => setMonthTouch(e.targetTouches[0].clientX);
    const handleMonthTouchEnd = (e) => {
        if (!monthTouch) return;
        const diff = monthTouch - e.changedTouches[0].clientX;
        if (diff > 50) changeDate(30);
        else if (diff < -50) changeDate(-30);
        setMonthTouch(null);
    };

    const handleDayTouchStart = (e) => setDayTouch(e.targetTouches[0].clientX);
    const handleDayTouchEnd = (e) => {
        if (!dayTouch) return;
        const diff = dayTouch - e.changedTouches[0].clientX;
        if (diff > 50) changeSelectedDay(1);
        else if (diff < -50) changeSelectedDay(-1);
        setDayTouch(null);
    };

    const changeDate = (days) => {
        const d = new Date(currentDate);
        d.setDate(d.getDate() + days);
        setCurrentDate(d);
    };

    const onDragStart = (e, job) => {
        e.dataTransfer.setData("jobId", job.id);
        e.currentTarget.style.opacity = '0.4';
    };

    const onDropToCalendar = async (e, dateStr) => {
        e.preventDefault();
        if (blockedDates.includes(dateStr)) {
            alert("Detta datum är spärrat/semester.");
            return;
        }
        const jobId = e.dataTransfer.getData("jobId");
        const job = allJobs.find(j => j.id === jobId);
        if (job) {
            const timePart = job.datum?.split('T')[1] || "08:00";
            const newDatum = `${dateStr}T${timePart}`;
            try { await window.db.collection('jobs').doc(jobId).update({ datum: newDatum }); }
            catch (err) { console.error("Misslyckades att flytta uppdrag:", err); }
        }
    };

    const onDropToBacklog = async (e) => {
        e.preventDefault();
        const jobId = e.dataTransfer.getData("jobId");
        if (!jobId) return;
        try {
            await window.db.collection('jobs').doc(jobId).update({ datum: '' });
        } catch (err) {
            console.error("Kunde inte flytta till oplanerat:", err);
        }
    };

    const isToday = (date) => date.toDateString() === new Date().toDateString();

    return (
        <>
        <div className="flex flex-col min-h-[calc(100vh-80px)] md:min-h-screen bg-transparent text-zinc-900 dark:text-white pb-0 transition-colors duration-500 relative max-w-full ml-0 w-full animate-in fade-in slide-in-from-left-4">
            
            <div className="absolute top-0 left-[-10%] w-[60%] h-[400px] bg-orange-500/10 dark:bg-orange-500/5 blur-[120px] rounded-full pointer-events-none -z-10 hidden lg:block"></div>

            {/* HUVUD-CONTAINER: p-0 för exakt 0 i padding överallt */}
            <div className="flex flex-col w-full px-2 pt-2 xl:p-0 h-full">
                
                {/* HEADER */}
                <div className="flex flex-col md:flex-row md:items-end justify-between mb-1 pb-2 md:mb-4 md:pb-4 border-b border-zinc-200/50 dark:border-white/5 lg:border-none lg:pb-0 gap-4 p-0">
                    <div className="flex items-center justify-between w-full">
                        <div className="flex items-center gap-3 md:gap-4">
                            <div className="relative group cursor-default shrink-0">
                                <div className="absolute inset-0 bg-orange-500/40 blur-lg rounded-full transition-all duration-700 group-hover:bg-orange-500/60" />
                                <div className="relative w-10 h-10 md:w-12 md:h-12 rounded-xl flex items-center justify-center text-white shadow-md border border-white/20 transition-colors bg-gradient-to-br from-orange-400 to-orange-600">
                                    <SafeIcon name="calendar" size={20} className="md:w-6 md:h-6" />
                                </div>
                            </div>
                            <div className="flex flex-col">
                                <h1 className="text-xl md:text-2xl font-black text-zinc-900 dark:text-white uppercase tracking-tight leading-none">
                                    CAL <span className="text-zinc-400 dark:text-zinc-500 font-light">ENDAR</span>
                                </h1>
                            </div>
                        </div>

                        {/* Dagens datum-knapp */}
                        <button 
                            onClick={() => { setCurrentDate(new Date()); setSelectedMobileDate(new Date()); }} 
                            className="md:hidden w-10 h-10 flex items-center justify-center rounded-[10px] border border-zinc-200 dark:border-white/10 text-[15px] font-bold text-zinc-700 dark:text-zinc-300 active:scale-95 transition-all shadow-sm bg-white dark:bg-[#121826] hover:text-orange-500 dark:hover:text-orange-400 mr-1"
                            title="Gå till idag"
                        >
                            {new Date().getDate()}
                        </button>
                    </div>
                </div>

                {/* CONTROLS */}
                {/* CONTROLS */}
                <div className="hidden md:flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5 z-10 mb-4 mt-2 xl:mt-0 p-0">
                    <div className="flex flex-wrap items-center gap-2.5">
                        <div className="hidden md:flex bg-white dark:bg-[#1e293b] p-1 border border-zinc-200 dark:border-white/10 rounded-lg shadow-sm">
                            {['WEEK', 'MONTH'].map(m => (
                                <button key={m} onClick={() => setViewMode(m)} className={`px-4 py-2 text-[10px] md:text-[11px] font-bold uppercase tracking-wider rounded-md transition-all flex-1 sm:flex-none ${viewMode === m ? 'bg-orange-500 text-white shadow-sm' : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white'}`}>
                                    {m === 'WEEK' ? 'Vecka' : 'Månad'}
                                </button>
                            ))}
                        </div>
                        <div className="hidden md:flex gap-1 bg-white dark:bg-[#1e293b] p-1 border border-zinc-200 dark:border-white/10 rounded-lg shadow-sm items-center">
                            <button onClick={() => changeDate(viewMode === 'WEEK' ? -7 : -30)} className="w-9 md:w-10 py-2 bg-transparent text-zinc-500 hover:bg-zinc-100 dark:hover:bg-white/5 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white rounded-md transition-all flex items-center justify-center">
                                <SafeIcon name="chevron-left" size={15}/>
                            </button>
                            <button onClick={() => setCurrentDate(new Date())} className="px-3 md:px-5 py-2 bg-transparent text-[10px] md:text-[11px] font-bold text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-white/5 hover:text-orange-500 uppercase tracking-wider rounded-md transition-all flex-1 sm:flex-none">
                                IDAG
                            </button>
                            <button onClick={() => changeDate(viewMode === 'WEEK' ? 7 : 30)} className="w-9 md:w-10 py-2 bg-transparent text-zinc-500 hover:bg-zinc-100 dark:hover:bg-white/5 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white rounded-md transition-all flex items-center justify-center">
                                <SafeIcon name="chevron-right" size={15}/>
                            </button>
                            
                            <div className="hidden lg:flex items-center gap-2 border-l border-zinc-200 dark:border-white/10 pl-2 ml-1 h-6">
                                <span className="text-[10px] font-black uppercase">V.{getWeekNumber(currentDate)}</span>
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center gap-2 w-full sm:w-auto">
                        <div className="relative shrink-0 w-[110px] sm:w-[130px]">
                            <select
                                value={statusFilter}
                                onChange={(e) => setStatusFilter(e.target.value)}
                                className="w-full h-9 bg-white dark:bg-[#1e293b] border border-zinc-200 dark:border-white/10 rounded-lg pl-3 pr-7 text-[10.5px] font-bold uppercase tracking-wider text-zinc-700 dark:text-zinc-200 outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 shadow-sm appearance-none cursor-pointer transition-all"
                            >
                                <option value="ALLA">Alla jobb</option>
                                <option value="BOKAD">Bokad</option>
                                <option value="OFFERERAD">Offererad</option>
                                <option value="KLAR">Klar</option>
                                <option value="FAKTURERAS">Faktureras</option>
                            </select>
                            <SafeIcon name="chevron-down" size={14} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-400 pointer-events-none" />
                        </div>

                        <div className="relative flex-1 sm:w-64">
                            <SafeIcon name="search" size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400 pointer-events-none" />
                            <input
                                type="text"
                                value={calSearch}
                                onChange={(e) => setCalSearch(e.target.value)}
                                placeholder="Filtrera kund, regnr, jobb..."
                                className="w-full h-9 bg-white dark:bg-[#1e293b] border border-zinc-200 dark:border-white/10 focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 rounded-lg pl-8 pr-7 text-[12px] font-medium text-zinc-900 dark:text-white outline-none shadow-sm transition-all placeholder:text-zinc-400"
                            />
                            {calSearch && (
                                <button onClick={() => setCalSearch('')} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-800 dark:hover:text-white">
                                    <SafeIcon name="x" size={12} />
                                </button>
                            )}
                        </div>

                        {!isSidebarOpen && (
                            <button onClick={() => setIsSidebarOpen(true)} className="flex shrink-0 items-center justify-center w-9 h-9 bg-white dark:bg-[#1e293b] border border-zinc-200 dark:border-white/10 rounded-lg shadow-sm text-zinc-500 hover:text-orange-500 dark:text-zinc-400 dark:hover:text-orange-500 transition-colors ml-1" title="Visa Oplanerade Jobb">
                                <SafeIcon name="panel-right-open" size={16} />
                            </button>
                        )}
                    </div>
                </div>

                {/* HUVUDGRID: Kalender & Sidebar helt utan padding i kanterna */}
                <div className="flex flex-col xl:flex-row w-full gap-2 items-start p-0">
                    
                    {/* VÄNSTRA SIDAN: Kalenderrutnät */}
                    <div className="flex-1 flex flex-col min-w-0 w-full p-0 relative">
                        
                        {/* --- NY MOBILVY (Lista & Kompakt månad) --- */}
                        <div className="md:hidden flex flex-col w-full h-full pb-24 px-2 mt-2 relative">
                            
                            {/* Kompakt Månadskalender (Med Swipe & Animation) */}
                            <div className="mb-2 pt-0 overflow-x-hidden" onTouchStart={handleMonthTouchStart} onTouchEnd={handleMonthTouchEnd}>
                                
                                {/* Header med knappar och centrerad text */}
                                <div className="flex justify-between items-center mb-3 px-1">
                                    <button onClick={() => changeDate(-30)} className="w-10 h-10 flex items-center justify-start bg-transparent active:scale-95 transition-all">
                                        <SafeIcon name="chevron-left" size={20} className="text-zinc-400"/>
                                    </button>
                                    <span className="text-[16px] font-bold text-zinc-800 dark:text-white uppercase tracking-wide">
                                        {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
                                    </span>
                                    <button onClick={() => changeDate(30)} className="w-10 h-10 flex items-center justify-end bg-transparent active:scale-95 transition-all">
                                        <SafeIcon name="chevron-right" size={20} className="text-zinc-400"/>
                                    </button>
                                </div>
                                
                                <div className="relative -ml-[10px] -mr-[10px]">
                                    {/* Den kontinuerliga vertikala linjen (utanför animationen så den står still) */}
                                    <div className="absolute top-0 bottom-0 left-[22px] w-px bg-zinc-200 dark:bg-white/10 z-10"></div>
                                    
                                    <div 
                                        key={`${currentDate.toISOString()}-month`} 
                                        className={`w-full ${monthAnim === 'slide-left' ? 'animate-in slide-in-from-right-16 fade-in duration-300' : monthAnim === 'slide-right' ? 'animate-in slide-in-from-left-16 fade-in duration-300' : ''}`}
                                    >
                                        <div className="grid grid-cols-[24px_1fr_1fr_1fr_1fr_1fr_1fr_1fr] mb-3 gap-x-1">
                                            <div className="text-center text-[8px] font-black text-black dark:text-white pt-0.5 pr-1">V.</div>
                                            {["Må", "Ti", "On", "To", "Fr", "Lö", "Sö"].map((wd, idx) => (
                                                <div key={idx} className={`text-center text-[12px] font-medium uppercase ${idx >= 5 ? 'text-red-500' : 'text-black dark:text-white'}`}>{wd}</div>
                                            ))}
                                        </div>
                                        
                                        <div className="grid grid-cols-[24px_1fr_1fr_1fr_1fr_1fr_1fr_1fr] gap-y-3 gap-x-1">
                                            {mobileMonthDays.map(({ date, isCurrentMonth }, i) => {
                                                const showWeekNum = i % 7 === 0;
                                                const weekNum = showWeekNum ? getWeekNumber(date) : null;
                                                const dStr = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
                                                const dayJobs = jobsByDate[dStr] || [];
                                                const isSelected = date.toDateString() === selectedMobileDate.toDateString();
                                                const isTodayDate = date.toDateString() === new Date().toDateString();
                                                
                                                return (
                                                    <React.Fragment key={i}>
                                                        {showWeekNum ? (
                                                            <div className="flex items-center justify-center text-[8px] text-black dark:text-white h-8 pr-1">
                                                                {weekNum}
                                                            </div>
                                                        ) : null}
                                                        <div 
                                                            onClick={() => {
                                                                if (date > selectedMobileDate) setDayAnim('slide-left');
                                                                else if (date < selectedMobileDate) setDayAnim('slide-right');
                                                                setSelectedMobileDate(date);
                                                            }}
                                                            className={`relative flex flex-col items-center justify-center h-8 rounded-full cursor-pointer transition-all ${
                                                                isSelected ? 'bg-orange-500 text-white shadow-md' : 
                                                                isTodayDate ? 'bg-gradient-to-br from-white to-zinc-100 dark:from-zinc-700 dark:to-zinc-800 text-black dark:text-white shadow-sm border border-zinc-300 dark:border-white/10' :
                                                                !isCurrentMonth ? 'text-zinc-400/50 dark:text-zinc-600' : 
                                                                'text-zinc-800 dark:text-zinc-200'
                                                            }`}
                                                        >
                                                            <span className={`text-[13px] ${isSelected || isTodayDate ? 'font-black' : 'font-medium'}`}>
                                                                {String(date.getDate()).padStart(2, '0')}
                                                            </span>
                                                            {dayJobs.length > 0 && !isSelected && (
                                                                <div className={`absolute bottom-0.5 w-1 h-1 rounded-full bg-orange-500`}></div>
                                                            )}
                                                        </div>
                                                    </React.Fragment>
                                                );
                                            })}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Jobb-lista för vald dag (Med Swipe & Animation) */}
                            <div className="flex flex-col gap-3 px-1 overflow-x-hidden" onTouchStart={handleDayTouchStart} onTouchEnd={handleDayTouchEnd}>
                                <div 
                                    key={`${selectedMobileDate.toISOString()}-day`} 
                                    className={`flex flex-col gap-3 w-full ${dayAnim === 'slide-left' ? 'animate-in slide-in-from-right-16 fade-in duration-300' : dayAnim === 'slide-right' ? 'animate-in slide-in-from-left-16 fade-in duration-300' : ''}`}
                                >
                                    <div className="flex items-baseline gap-2 mb-2 mt-3 border-b border-zinc-100 dark:border-white/5 pb-2">
                                        <h3 className="text-[24px] font-black text-black dark:text-white tracking-tighter leading-none">
                                            {selectedMobileDate.getDate()}
                                        </h3>
                                        <span className="text-[12px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-widest">
                                            {weekDays[selectedMobileDate.getDay() === 0 ? 6 : selectedMobileDate.getDay() - 1]} {monthNames[selectedMobileDate.getMonth()]}
                                        </span>
                                    </div>
                                    
                                    {(() => {
                                        const selectedDStr = `${selectedMobileDate.getFullYear()}-${String(selectedMobileDate.getMonth() + 1).padStart(2, '0')}-${String(selectedMobileDate.getDate()).padStart(2, '0')}`;
                                        const activeJobs = jobsByDate[selectedDStr] || [];
                                        
                                        if (activeJobs.length === 0) {
                                            return <div className="text-center text-zinc-400 dark:text-zinc-500 text-xs py-8">Ledig dag, inga inbokade jobb.</div>;
                                        }
                                        
                                        return activeJobs.map(job => {
                                            const serviceLabel = job.paket === 'Oljebyte' && job.oljevolym ? `Oljebyte ${job.oljevolym}l` : (job.paket || 'Standard');
                                            const timeStr = job.datum?.split('T')[1]?.substring(0, 5) || '08:00';
                                            const isKlar = job.status === 'KLAR';
                                            const statusAccent = isKlar ? 'bg-emerald-500' : job.status === 'FAKTURERAS' ? 'bg-sky-500' : job.status === 'OFFERERAD' ? 'bg-blue-500' : 'bg-[#f97316]';
                                            const price = parseInt(job.kundpris) || 0;
                                            
                                            // Hämtar kommentar och rensar bort all HTML och osynliga tecken från editorn
                                            const rawDesc = job.kommentar || job.orderanteckningar || job.anteckningar || job.kommentarer || job.beskrivning || job.notering || '';
                                            const descText = rawDesc ? String(rawDesc).replace(/<[^>]*>?/gm, '').replace(/&nbsp;/g, ' ').trim() : '';

                                            return (
                                                <div 
                                                    key={job.id}
                                                    onClick={() => setView('NEW_JOB', { job })}
                                                    className={`group relative bg-white dark:bg-[#161f30] border border-zinc-200 dark:border-white/10 rounded-xl shadow-sm overflow-hidden flex flex-row active:scale-[0.98] transition-all cursor-pointer ${isKlar ? 'opacity-70' : ''}`}
                                                >
                                                    {/* Vänster status-linje */}
                                                    <div className={`absolute left-0 top-0 bottom-0 w-[4px] ${statusAccent}`}></div>
                                                    
                                                    {/* Datum & Tid till vänster */}
                                                    <div className="flex flex-col items-center justify-center w-[70px] shrink-0 py-3 pl-2">
                                                        <span className={`text-[28px] font-normal leading-none ${isKlar ? 'text-emerald-500' : 'text-[#f67664]'}`}>
                                                            {selectedMobileDate.getDate()}
                                                        </span>
                                                        <span className={`text-[11px] font-bold uppercase tracking-widest mt-1 mb-2 ${isKlar ? 'text-emerald-500' : 'text-[#f67664]'}`}>
                                                            {monthNames[selectedMobileDate.getMonth()].substring(0,3)}
                                                        </span>
                                                        {timeStr !== '00:00' && (
                                                            <span className="text-[11px] font-medium text-zinc-500 dark:text-zinc-400 tabular-nums">
                                                                {timeStr}
                                                            </span>
                                                        )}
                                                    </div>
                                                    
                                                    {/* Informationsblocket */}
                                                    <div className="flex flex-col flex-1 p-2.5 border-l border-zinc-100 dark:border-white/5 w-[calc(100%-70px)] min-w-0">
                                                        <div className="flex items-start justify-between gap-1 w-full">
                                                            <span className="text-[12px] font-semibold uppercase tracking-tight text-black dark:text-white truncate transition-colors leading-snug">
                                                                {job.kundnamn}
                                                            </span>
                                                            {price > 0 && (
                                                                <span className="text-[11px] font-medium tabular-nums text-black dark:text-white shrink-0 pl-1">
                                                                    {price.toLocaleString('sv-SE')} kr
                                                                </span>
                                                            )}
                                                        </div>

                                                        <div className="text-[10.5px] text-zinc-900 dark:text-zinc-100 truncate font-medium mt-1 flex items-center gap-1.5">
                                                            <span className="truncate">{serviceLabel}</span>
                                                        </div>

                                                        {descText !== '' && (
                                                            <div className="text-[10.5px] dark:text-zinc-400 truncate font-medium italic mt-1 w-full block">
                                                                {descText}
                                                            </div>
                                                        )}

                                                        <div className="flex items-center justify-end border-t border-zinc-200 dark:border-white/10 pt-1.5 mt-1.5 w-full">
                                                            {job.regnr && job.regnr !== '-' && (
                                                                <div className="flex items-center bg-white dark:bg-[#121826] border border-zinc-400 dark:border-white/30 rounded-[4px] overflow-hidden shadow-sm h-[17px]">
                                                                    <div className="bg-[#003399] h-full w-[12px] flex flex-col items-center justify-between py-[1px] shrink-0 border-r border-zinc-400 dark:border-white/30">
                                                                        <div className="w-1 h-1 rounded-full border-[0.5px] border-[#ffcc00] mt-[1px]"></div>
                                                                        <span className="text-[5px] font-sans font-black text-white leading-none mb-[0.5px]">S</span>
                                                                    </div>
                                                                    <span className="font-mono font-semibold text-[11px] tracking-widest text-black dark:text-white leading-none px-1.5 pt-[1px]">
                                                                        {job.regnr}
                                                                    </span>
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                            );
                                        });
                                    })()}
                                </div>
                            </div>
                        </div>

                        {/* FAB borttagen härifrån - flyttas till botten utanför animationen */}

                        {/* --- DESKTOP VY (Gömms helt på mobilen) --- */}
                        <div className="hidden md:block bg-white dark:bg-[#1e293b] border border-zinc-200 dark:border-white/10 shadow-lg dark:shadow-[0_10px_30px_rgba(0,0,0,0.5)] overflow-hidden rounded-xl mb-6">
                            <div className="overflow-x-auto snap-x snap-mandatory w-full hide-scrollbars">
                                <div className="w-[140%] sm:w-full min-w-[350px]">
                                    
                                    {viewMode === 'MONTH' && (
                                        <div className="grid grid-cols-7 divide-x divide-zinc-200 dark:divide-white/10 bg-[#f4f5f7] dark:bg-[#161f30] border-b border-zinc-300 dark:border-white/15">
                                            {weekDays.map((wd, idx) => (
                                                <div key={wd} className={`py-2.5 text-center text-[10px] md:text-[11px] font-bold uppercase tracking-wider ${idx === 6 ? 'text-red-500 dark:text-red-400' : 'text-zinc-900 dark:text-zinc-100'}`}>
                                                    {wd}
                                                </div>
                                            ))}
                                        </div>
                                    )}

                                    <div className="grid grid-cols-7 divide-x divide-zinc-200 dark:divide-white/10">
                                        {calendarDays.map(({ date, isCurrentMonth }, i) => {
                                            const dStr = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
                                            const allDayJobs = jobsByDate[dStr] || [];
                                            const displayJobs = viewMode === 'MONTH' ? allDayJobs.slice(0, 4) : allDayJobs;
                                            const extraCount = allDayJobs.length - displayJobs.length;
                                            const today = isToday(date);
                                            const isBlocked = blockedDates.includes(dStr);
                                            const dayRevenue = allDayJobs.reduce((sum, j) => sum + (parseInt(j.kundpris) || 0), 0);
                                            const isFull = allDayJobs.length >= 5;
                                            
                                            let weekendJobsCount = 0;
                                            if (date.getDay() === 5) {
                                                const sat = new Date(date); sat.setDate(sat.getDate() + 1);
                                                const sun = new Date(date); sun.setDate(sun.getDate() + 2);
                                                const satStr = `${sat.getFullYear()}-${String(sat.getMonth() + 1).padStart(2, '0')}-${String(sat.getDate()).padStart(2, '0')}`;
                                                const sunStr = `${sun.getFullYear()}-${String(sun.getMonth() + 1).padStart(2, '0')}-${String(sun.getDate()).padStart(2, '0')}`;
                                                weekendJobsCount = (jobsByDate[satStr] || []).length + (jobsByDate[sunStr] || []).length;
                                            }
                                            
                                            const blockedBgClass = isBlocked ? "bg-[repeating-linear-gradient(45deg,transparent,transparent_10px,rgba(0,0,0,0.03)_10px,rgba(0,0,0,0.03)_20px)] dark:bg-[repeating-linear-gradient(45deg,transparent,transparent_10px,rgba(255,255,255,0.02)_10px,rgba(255,255,255,0.02)_20px)]" : "";

                                            return (
                                                <div 
                                                    key={i} 
                                                    onDragOver={(e) => { if (!isBlocked) e.preventDefault(); }} 
                                                    onDrop={(e) => onDropToCalendar(e, dStr)} 
                                                    className={`snap-start group/day min-w-0 flex flex-col transition-all border-b border-zinc-200 dark:border-white/10 ${viewMode === 'WEEK' ? 'min-h-[440px] md:min-h-[580px]' : 'min-h-[140px] md:min-h-[165px]'} ${!isCurrentMonth ? 'bg-zinc-50/40 dark:bg-[#141c2b]/40' : 'bg-white dark:bg-[#1e293b]'} ${blockedBgClass}`}
                                                >
                                                    <div 
                                                        onClick={() => { if(!isBlocked) setView('NEW_JOB', { job: { datum: `${dStr}T08:00`, status: 'BOKAD' } }); }}
                                                        className={`relative px-2 py-2 md:px-3 md:py-2.5 border-b transition-colors cursor-pointer group/hdr ${
                                                            today 
                                                                ? 'bg-orange-500/10 dark:bg-orange-500/20 border-zinc-200 dark:border-white/10' 
                                                                : 'bg-[#f8f9fa] dark:bg-[#161f30] border-zinc-200/80 dark:border-white/10 hover:bg-orange-50 dark:hover:bg-orange-500/10'
                                                        }`}
                                                    >
                                                        <div className="flex justify-between items-center gap-1">
                                                            <div className="flex items-center gap-1.5 min-w-0">
                                                                {viewMode === 'WEEK' && (
                                                                    <span className={`text-[9.5px] md:text-[11px] font-black uppercase tracking-wider ${today ? 'text-orange-600 dark:text-orange-400' : 'text-zinc-900 dark:text-zinc-300'}`}>
                                                                        {weekDays[date.getDay() === 0 ? 6 : date.getDay() - 1]}
                                                                    </span>
                                                                )}
                                                                <span className={`${viewMode === 'WEEK' ? 'text-lg md:text-xl' : 'text-sm md:text-[15px]'} font-black tracking-tight leading-none ${today ? 'text-orange-600 dark:text-orange-400' : isBlocked ? 'text-zinc-400 line-through' : 'text-zinc-900 dark:text-white'}`}>
                                                                    {date.getDate()}
                                                                </span>
                                                            </div>

                                                            <div className="flex items-center gap-1 shrink-0">
                                                                {!isBlocked && allDayJobs.length > 0 && (
                                                                    <button type="button" onClick={(e) => copyDaySchedule(e, dStr, allDayJobs)} className="hidden group-hover/hdr:flex w-4 h-4 rounded items-center justify-center bg-zinc-200 dark:bg-white/10 text-zinc-600 dark:text-white hover:bg-orange-500 hover:text-white transition-colors" title="Kopiera schema">
                                                                        <SafeIcon name="copy" size={9} />
                                                                    </button>
                                                                )}
                                                                {isFull && !today && (
                                                                    <span className="text-[7px] font-black uppercase text-red-500 bg-red-50 dark:bg-red-500/20 px-1 py-[1px] rounded">FULLT</span>
                                                                )}
                                                                {allDayJobs.length > 0 && (
                                                                    <span className={`hidden xl:inline-block text-[9px] font-bold px-1.5 py-0.5 rounded-md ${today ? 'bg-white/20 text-white' : 'text-zinc-700 dark:text-zinc-300'}`}>
                                                                        {allDayJobs.length} st {dayRevenue > 0 ? `• ${(dayRevenue/1000).toFixed(1)}k` : ''}
                                                                    </span>
                                                                )}
                                                            </div>
                                                        </div>

                                                        {date.getDay() === 5 && weekendJobsCount > 0 && (
                                                            <div className="absolute right-0 top-0 bottom-0 flex items-center md:hidden z-10 pointer-events-none pr-0">
                                                                <div className="flex items-center bg-orange-500 text-white text-[7.5px] font-black pl-1.5 pr-0.5 py-1 rounded-l-md shadow-sm opacity-90">
                                                                    HELG ({weekendJobsCount}) <SafeIcon name="chevron-right" size={10} className="ml-0.5" />
                                                                </div>
                                                            </div>
                                                        )}
                                                    </div>
                                                    
                                                    <div className="p-1 md:p-2 space-y-1.5 md:space-y-2 flex-1 flex flex-col relative">
                                                        {displayJobs.map(job => {
                                                            const serviceLabel = job.paket === 'Oljebyte' && job.oljevolym ? `Oljebyte ${job.oljevolym}l` : (job.paket || 'Standard');
                                                            const timeStr = job.datum?.split('T')[1]?.substring(0, 5) || '';
                                                            const price = parseInt(job.kundpris) || 0;
                                                            const isKlar = job.status === 'KLAR';
                                                            const statusAccent = isKlar ? 'bg-emerald-500' : job.status === 'FAKTURERAS' ? 'bg-sky-500' : job.status === 'OFFERERAD' ? 'bg-blue-500' : 'bg-[#f97316]';
                                                            const descText = job.orderanteckningar || job.anteckningar || job.kommentarer || job.beskrivning || job.notering || '';

                                                            return (
                                                                <div 
                                                                    key={job.id} 
                                                                    draggable={!isBlocked} 
                                                                    onDragStart={(e) => onDragStart(e, job)} 
                                                                    onDragEnd={(e) => e.currentTarget.style.opacity = '1'} 
                                                                    onClick={(e) => { e.stopPropagation(); setView('NEW_JOB', { job: job }); }} 
                                                                    className={`group relative bg-white dark:bg-[#161f30] border border-zinc-200 dark:border-white/10 md:p-1 md:px-2.5 md:py-2 transition-all ${!isBlocked ? 'cursor-grab active:cursor-grabbing hover:border-zinc-300 dark:hover:border-white/30 hover:shadow-md hover:-translate-y-0.5' : ''} shadow-xs rounded-lg overflow-hidden ${isKlar ? 'opacity-70 hover:opacity-100' : ''} flex flex-col`}
                                                                >
                                                                    {price === 0 && !isKlar && (
                                                                        <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 bg-red-500 rounded-full shadow-[0_0_5px_rgba(239,68,68,0.8)] z-10" title="Pris saknas"></span>
                                                                    )}

                                                                    {/* Statuslinje som stannar ovanför reg-skylten på mobil */}
                                                                    <div className={`absolute left-0 top-0 bottom-0 md:bottom-0 ${job.regnr && job.regnr !== '-' ? 'max-md:bottom-[16px]' : ''} w-[2.5px] ${statusAccent} z-10`}></div>
                                                                    
                                                                    {/* --- MOBIL VY --- */}
                                                                    <div className="md:hidden flex flex-col w-full h-full">
                                                                        {/* Innehållssektion med mjukare padding */}
                                                                        <div className="flex flex-col gap-[2px] p-1.5 pb-2">
                                                                            <span className="text-[9.5px] font-bold text-black dark:text-white uppercase tracking-tight truncate w-full">
                                                                                {job.kundnamn}
                                                                            </span>
                                                                            <span className="text-[8.5px] font-semibold text-zinc-900 dark:text-zinc-100 truncate">
                                                                                {serviceLabel}
                                                                            </span>
                                                                            {timeStr !== '00:00' && (
                                                                                <span className="text-[8.5px] font-semibold text-zinc-900 dark:text-zinc-100">
                                                                                    {timeStr}
                                                                                </span>
                                                                            )}
                                                                        </div>

                                                                        {/* Reg-skylt kant-i-kant i botten */}
                                                                        {job.regnr && job.regnr !== '-' && (
                                                                            <div className="mt-auto w-full z-20">
                                                                                <div className="flex items-center w-full bg-white dark:bg-[#121826] border-t border-zinc-200 dark:border-white/10 h-[17px]">
                                                                                    <div className="bg-[#003399] h-full w-[11px] flex flex-col items-center justify-between py-[1.5px] shrink-0 border-r border-zinc-200 dark:border-white/10">
                                                                                        <div className="w-[3px] h-[3px] rounded-full border-[0.5px] border-[#ffcc00]"></div>
                                                                                        <span className="text-[4.5px] font-sans font-black text-white leading-none mb-[0.5px]">S</span>
                                                                                    </div>
                                                                                    <span className="font-mono font-bold text-[9.5px] tracking-widest text-black dark:text-white flex-1 text-center truncate bg-white dark:bg-[#121826] pt-[1px]">
                                                                                        {job.regnr}
                                                                                    </span>
                                                                                </div>
                                                                            </div>
                                                                        )}
                                                                    </div>

                                                                    <div className="hidden md:flex flex-col pl-1.5 w-full">
                                                                        <div className="flex items-start justify-between gap-1 w-full relative">
                                                                            <span className="text-[12px] font-semibold uppercase tracking-tight text-black dark:text-white truncate group-hover:text-[#f97316] transition-colors leading-snug">
                                                                                {job.kundnamn}
                                                                            </span>
                                                                            <div className="flex items-center shrink-0 h-4 relative overflow-hidden min-w-[35px] justify-end">
                                                                                <div className="absolute right-0 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-all translate-x-4 group-hover:translate-x-0 bg-white dark:bg-[#161f30] z-10 pl-2">
                                                                                    {!isKlar && (
                                                                                        <button type="button" onClick={(e) => postponeJob(e, job)} title="Skjut fram 1 dag" className="w-6 h-4 rounded bg-orange-50 dark:bg-orange-500/20 text-orange-600 hover:bg-orange-500 hover:text-white flex items-center justify-center transition-colors text-[8px] font-bold">
                                                                                            +1d
                                                                                        </button>
                                                                                    )}
                                                                                    {!isKlar && (
                                                                                        <button type="button" onClick={(e) => { e.stopPropagation(); window.db.collection("jobs").doc(job.id).update({ status: 'KLAR' }); }} title="Markera som KLAR" className="w-4 h-4 rounded bg-emerald-50 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500 hover:text-white flex items-center justify-center transition-colors">
                                                                                            <SafeIcon name="check" size={10} />
                                                                                        </button>
                                                                                    )}
                                                                                </div>
                                                                                <div className={`flex items-center gap-1 transition-opacity duration-200 ${!isKlar ? 'group-hover:opacity-0' : ''}`}>
                                                                                    {price > 0 && (
                                                                                        <span className="text-[11px] font-medium tabular-nums text-black dark:text-white group-hover:hidden">
                                                                                            {price.toLocaleString('sv-SE')} kr
                                                                                        </span>
                                                                                    )}
                                                                                    {isKlar && (
                                                                                        <span className="text-emerald-500 ml-1" title="Klar"><SafeIcon name="check-circle" size={11} /></span>
                                                                                    )}
                                                                                </div>
                                                                            </div>
                                                                        </div>

                                                                        <div className="text-[10.5px] text-zinc-900 dark:text-zinc-100 truncate font-medium mt-1 flex items-center gap-1.5">
                                                                            <SafeIcon name="wrench" size={10} className="text-teal-600 dark:text-teal-400 shrink-0" />
                                                                            <span className="truncate">{serviceLabel}</span>
                                                                        </div>

                                                                        {descText && (
                                                                            <div className="text-[10.5px] text-zinc-900 dark:text-zinc-100 truncate font-medium italic mt-1">
                                                                                {descText}
                                                                            </div>
                                                                        )}

                                                                        <div className="flex items-center justify-between border-t border-zinc-200 dark:border-white/10 pt-1.5 mt-1.5 gap-1 h-[24px]">
                                                                            <span className="text-[11px] text-black dark:text-white font-medium tabular-nums flex items-center h-full">
                                                                                {timeStr !== '00:00' ? timeStr : '-'}
                                                                            </span>

                                                                            {job.regnr && job.regnr !== '-' && (
                                                                                <div 
                                                                                    onClick={(e) => { e.stopPropagation(); if (navigator.clipboard) navigator.clipboard.writeText(job.regnr); if (window.openVehicleProfile) window.openVehicleProfile(job.regnr, job.id); }}
                                                                                    title="Kopiera & Öppna Fordonskort"
                                                                                    className="flex items-center bg-white dark:bg-[#121826] border border-zinc-400 dark:border-white/30 rounded-[4px] overflow-hidden shadow-sm hover:border-[#003399] transition-colors cursor-pointer active:scale-95 group/plate h-[17px]"
                                                                                >
                                                                                    <div className="bg-[#003399] h-full w-[12px] flex flex-col items-center justify-between py-[1px] shrink-0 border-r border-zinc-400 dark:border-white/30">
                                                                                        <div className="w-1 h-1 rounded-full border-[0.5px] border-[#ffcc00] mt-[1px]"></div>
                                                                                        <span className="text-[5px] font-sans font-black text-white leading-none mb-[0.5px]">S</span>
                                                                                    </div>
                                                                                    <span className="font-mono font-semibold text-[11px] tracking-widest text-black dark:text-white leading-none px-1.5 pt-[1px]">
                                                                                        {job.regnr}
                                                                                    </span>
                                                                                </div>
                                                                            )}
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            );
                                                        })}

                                                        {viewMode === 'MONTH' && extraCount > 0 && (
                                                            <button onClick={(e) => { e.stopPropagation(); setCurrentDate(date); setViewMode('WEEK'); }} className="w-full py-1 text-[9.5px] font-bold uppercase tracking-wider text-zinc-700 dark:text-zinc-200 bg-zinc-200 dark:bg-white/10 hover:bg-orange-500 hover:text-white rounded-md transition-all">
                                                                +{extraCount} fler
                                                            </button>
                                                        )}
                                                        
                                                        {!isBlocked && allDayJobs.length === 0 && (
                                                            <div 
                                                                onClick={() => { if(!isBlocked) setView('NEW_JOB', { job: { datum: `${dStr}T08:00`, status: 'BOKAD' } }); }}
                                                                className="flex-1 flex items-center justify-center min-h-[60px] cursor-pointer group/plus"
                                                            >
                                                                <div className="w-7 h-7 rounded-lg bg-zinc-50 dark:bg-white/[0.04] group-hover/plus:bg-orange-50 dark:group-hover/plus:bg-orange-500/15 border border-dashed border-zinc-300 dark:border-white/15 group-hover/plus:border-orange-400 flex items-center justify-center transition-all">
                                                                    <SafeIcon name="plus" size={14} className="text-zinc-400 dark:text-zinc-500 group-hover/plus:text-orange-500 transition-colors" />
                                                                </div>
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* HÖGRA SIDAN: SIDEBAR (0 padding mot höger, döljs helt på mobil) */}
                    {isSidebarOpen && (
                        <div 
                            onDragOver={(e) => e.preventDefault()}
                            onDrop={onDropToBacklog}
                            className="hidden md:flex flex-col bg-white dark:bg-[#1e293b] border-y border-l border-zinc-200 dark:border-white/10 rounded-l-xl rounded-r-none shadow-xl transition-all overflow-hidden w-full xl:w-[350px] shrink-0 border-r-0 mr-0"
                        >
                            <div className="flex items-center justify-between p-2.5 border-b border-zinc-200 dark:border-white/10 bg-zinc-50 dark:bg-white/5 shrink-0 h-[45px]">
                                <span className="text-[10px] font-black uppercase tracking-wider">Oplanerad Dropzone</span>
                                <button onClick={() => setIsSidebarOpen(false)} className="flex items-center gap-1 text-[10px] font-bold text-zinc-400 hover:text-zinc-800 dark:hover:text-white transition-colors px-2 py-1 rounded bg-white dark:bg-white/10 border border-zinc-200 dark:border-white/10" title="Dölj panel">
                                    Dölj panel <SafeIcon name="panel-right-close" size={13} />
                                </button>
                            </div>
                            
                            <div className="flex-1 overflow-y-auto custom-scrollbar">
                                {Object.entries(backlogJobs).map(([catName, jobs]) => (
                                    <div key={catName} className="flex flex-col border-b border-zinc-200 dark:border-white/10 last:border-b-0">
                                        <div 
                                            onClick={() => setExpandedCategories(prev => ({ ...prev, [catName]: !prev[catName] }))}
                                            className="flex items-center justify-between p-3 cursor-pointer hover:bg-zinc-50 dark:hover:bg-white/[0.02] transition-colors"
                                        >
                                            <div className="flex items-center gap-2">
                                                <SafeIcon name={expandedCategories[catName] ? "chevron-down" : "chevron-right"} size={13} className="text-zinc-400" />
                                                <span className="text-[11px] font-black uppercase tracking-tight text-zinc-800 dark:text-zinc-200">{catName}</span>
                                            </div>
                                            <span className="text-[9.5px] font-bold px-2 py-0.5 rounded-md bg-white dark:bg-white/10 border border-zinc-200 dark:border-white/10 text-zinc-600 dark:text-zinc-300">
                                                {jobs.length} st
                                            </span>
                                        </div>
                                        
                                        {expandedCategories[catName] && jobs.length > 0 && (
                                            <div className="p-2 pt-0 space-y-2">
                                                {jobs.map(job => {
                                                    const serviceLabel = job.paket === 'Oljebyte' && job.oljevolym ? `Oljebyte ${job.oljevolym}l` : (job.paket || 'Standard');
                                                    const statusAccent = job.status === 'OFFERERAD' ? 'bg-blue-500' : 'bg-[#f97316]';
                                                    const rawDesc = job.kommentar || job.orderanteckningar || job.anteckningar || job.kommentarer || job.beskrivning || job.notering || '';
                                                    const descText = rawDesc ? String(rawDesc).replace(/<[^>]*>?/gm, '').replace(/&amp;/g, '&').trim() : '';
                                                    const price = parseInt(job.kundpris) || 0;

                                                    return (
                                                        <div 
                                                            key={job.id}
                                                            draggable
                                                            onDragStart={(e) => onDragStart(e, job)}
                                                            onClick={() => setView('NEW_JOB', { job })}
                                                            className="group relative bg-white dark:bg-[#161f30] border border-zinc-200 dark:border-white/10 p-2.5 transition-all cursor-grab active:cursor-grabbing hover:border-orange-500 dark:hover:border-orange-500/70 hover:shadow-md rounded-lg overflow-hidden"
                                                            title="Dra till kalendern för att boka"
                                                        >
                                                            <div className={`absolute left-0 top-0 bottom-0 w-[3px] ${statusAccent}`}></div>

                                                            <div className="flex flex-col pl-1.5 w-full">
                                                                <div className="flex items-start justify-between gap-1 w-full">
                                                                    <span className="text-[12px] font-semibold uppercase tracking-tight text-black dark:text-white truncate group-hover:text-[#f97316] transition-colors leading-snug">
                                                                        {job.kundnamn}
                                                                    </span>
                                                                    {price > 0 && (
                                                                        <span className="text-[11px] font-medium tabular-nums text-black dark:text-white shrink-0">
                                                                            {price.toLocaleString('sv-SE')} kr
                                                                        </span>
                                                                    )}
                                                                </div>

                                                                <div className="text-[10.5px] text-zinc-900 dark:text-zinc-100 truncate font-medium mt-1 flex items-center gap-1.5">
                                                                    <SafeIcon name="wrench" size={10} className="text-teal-600 dark:text-teal-400 shrink-0" />
                                                                    <span className="truncate">{serviceLabel}</span>
                                                                </div>

                                                                {descText && (
                                                                    <div className="text-[10.5px] text-zinc-900 dark:text-zinc-100 truncate font-medium italic mt-1">
                                                                        {descText}
                                                                    </div>
                                                                )}

                                                                <div className="flex items-center justify-end border-t border-zinc-200 dark:border-white/10 pt-1.5 mt-1.5">
                                                                    {job.regnr && job.regnr !== '-' && (
                                                                        <div className="flex items-center bg-white dark:bg-[#121826] border border-zinc-400 dark:border-white/30 rounded-[4px] overflow-hidden shadow-sm h-[17px]">
                                                                            <div className="bg-[#003399] h-full w-[12px] flex flex-col items-center justify-between py-[1px] shrink-0 border-r border-zinc-400 dark:border-white/30">
                                                                                <div className="w-1 h-1 rounded-full border-[0.5px] border-[#ffcc00] mt-[1px]"></div>
                                                                                <span className="text-[5px] font-sans font-black text-white leading-none mb-[0.5px]">S</span>
                                                                            </div>
                                                                            <span className="font-mono font-semibold text-[11px] tracking-widest text-black dark:text-white leading-none px-1.5 pt-[1px]">
                                                                                {job.regnr}
                                                                            </span>
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                </div>
            </div>
        </div>

        {/* FAB: Placerad utanför huvudcontainern för att behålla 'fixed' i skärmen */}
        <div className={`md:hidden fixed bottom-24 right-4 z-[9999] transition-all duration-300 ease-in-out ${showFab ? 'translate-y-0 opacity-100' : 'translate-y-[200px] opacity-0 pointer-events-none'}`}>
            <button 
                onClick={() => setView('NEW_JOB', { job: { datum: `${selectedMobileDate.getFullYear()}-${String(selectedMobileDate.getMonth() + 1).padStart(2, '0')}-${String(selectedMobileDate.getDate()).padStart(2, '0')}T08:00`, status: 'BOKAD' } })}
                className="w-14 h-14 bg-gradient-to-tr from-[#f97316] to-[#fba918] rounded-full flex items-center justify-center text-white shadow-lg hover:scale-105 active:scale-95 transition-all border border-white/20"
            >
                <SafeIcon name="plus" size={24} />
            </button>
        </div>
        </>
    );
};
