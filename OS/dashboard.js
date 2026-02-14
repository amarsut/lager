// dashboard.js

// 1. SMART DATUMFORMATERARE
const formatDate = (dateStr) => {
    if (!dateStr) return null;
    
    const targetDate = new Date(dateStr);
    const today = new Date();
    
    targetDate.setHours(0, 0, 0, 0);
    today.setHours(0, 0, 0, 0);
    
    const diffTime = targetDate - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return "IDAG";
    if (diffDays === 1) return "IMORGON";
    if (diffDays === -1) return "IGÅR";
    
    if (diffDays >= 2 && diffDays <= 7) {
        const weekDays = ['SÖNDAG', 'MÅNDAG', 'TISDAG', 'ONSDAG', 'TORSDAG', 'FREDAG', 'LÖRDAG'];
        return weekDays[targetDate.getDay()];
    }
    
    const months = ['JAN', 'FEB', 'MAR', 'APR', 'MAJ', 'JUN', 'JUL', 'AUG', 'SEP', 'OKT', 'NOV', 'DEC'];
    return `${targetDate.getDate()} ${months[targetDate.getMonth()]}`;
};

// 2. STATUS BADGE
window.Badge = React.memo(({ status }) => {
    const s = (status || 'BOKAD').toUpperCase();
    
    const config = {
        'BOKAD':      { bg: 'bg-orange-50', text: 'text-orange-700', border: 'border-orange-200/60', dot: 'bg-orange-500' },
        'OFFERERAD':  { bg: 'bg-blue-50',   text: 'text-blue-700',   border: 'border-blue-200/60',   dot: 'bg-blue-500' },
        'KLAR':       { bg: 'bg-emerald-50',text: 'text-emerald-700',border: 'border-emerald-200/60',dot: 'bg-emerald-500' },
        'FAKTURERAS': { bg: 'bg-zinc-100',  text: 'text-zinc-600',   border: 'border-zinc-200',      dot: 'bg-zinc-400' },
    };

    const style = config[s] || config['BOKAD'];

    return (
        <span className={`pl-1.5 pr-2 py-1 text-[9px] font-bold uppercase tracking-wider inline-flex items-center gap-1.5 rounded-md border ${style.bg} ${style.text} ${style.border}`}>
            <span className={`w-1.5 h-1.5 rounded-full ${style.dot}`}></span>
            {s}
        </span>
    );
});

// 3. MOBILKORTET
const mobileCardPropsAreEqual = (prev, next) => {
    return (
        prev.job === next.job && 
        prev.job.status === next.job.status &&
        prev.job.datum === next.job.datum
    );
};

const MobileJobCard = React.memo(({ job, setView, onOpenHistory }) => {
    const [menuOpen, setMenuOpen] = React.useState(false);

    // --- LOGIK ---
    const isWaiting = !job.datum;
    const dateString = formatDate(job.datum);
    const isUrgentDate = ['IDAG', 'IMORGON', 'IGÅR'].includes(dateString);
    
    const isDone = ['KLAR', 'FAKTURERAS'].includes(job.status);
    const showAsHistory = isDone || (!isWaiting && !isUrgentDate);

    const vehicleDisplay = job.regnr || job.bilmodell || '-';
    const isReg = vehicleDisplay.length <= 8 && /\d/.test(vehicleDisplay);
    const price = parseInt(job.kundpris) || 0;

    const statusColors = {
        'BOKAD': 'bg-orange-500',
        'OFFERERAD': 'bg-blue-500',
        'KLAR': 'bg-emerald-500',
        'FAKTURERAS': 'bg-zinc-400',
    };
    const sidebarColor = statusColors[job.status] || 'bg-orange-500';

    return (
        <div 
            onClick={() => setView('NEW_JOB', { job: job })}
            className={`w-full relative active:bg-zinc-50 transition-all border-b border-zinc-200 last:border-0 shadow-sm bg-white group select-none 
                ${isDone ? 'opacity-70 grayscale-[0.3]' : ''}`}
            style={isWaiting ? { backgroundImage: 'repeating-linear-gradient(45deg, #ffffff, #ffffff 10px, #f8fafc 10px, #f8fafc 20px)' } : {}}
        >
            {/* Vänsterlinje */}
            <div className={`absolute left-0 top-0 bottom-0 w-[4px] ${isDone ? 'bg-zinc-300' : sidebarColor}`}></div>

            <div className="pl-6 pr-4 py-3">
                
                {/* --- RAD 1: NAMN & MENY --- */}
                <div className="flex justify-between items-start mb-2">
                    <div className="flex flex-col min-w-0 pr-2">
                        <div className={`text-[16px] font-black uppercase tracking-tight truncate leading-none mb-1.5 ${isDone ? 'text-zinc-600' : 'text-zinc-900'}`}>
                            {job.kundnamn}
                        </div>
                        <div className="inline-flex">
                            <span className="text-[10px] font-mono text-zinc-400 bg-zinc-50 px-1.5 rounded-[2px] border border-zinc-100">
                                #{job.id.substring(0,6)}
                            </span>
                        </div>
                    </div>
                    
                    <div className="flex items-center gap-1.5 relative z-30">
                        <window.Badge status={job.status} />

                        {/* Meny-knapp */}
                        <div className="relative">
                            <button 
                                onClick={(e) => {
                                    e.stopPropagation();
                                    setMenuOpen(!menuOpen);
                                }}
                                className="w-10 h-10 -mr-2 flex items-center justify-center focus:outline-none active:scale-90 transition-transform"
                            >
                                <div className={`w-[26px] h-[26px] flex items-center justify-center rounded-md border transition-colors duration-200
                                    ${menuOpen 
                                        ? 'bg-zinc-800 text-white border-zinc-800' 
                                        : 'bg-white text-zinc-400 border-zinc-200 group-hover:border-zinc-300'
                                    }`}
                                >
                                    <window.Icon name="more-horizontal" size={16} />
                                </div>
                            </button>

                            {menuOpen && (
                                <>
                                    <div className="fixed inset-0 z-40 cursor-default" onClick={(e) => { e.stopPropagation(); setMenuOpen(false); }}></div>
                                    <div className="absolute right-0 top-full mt-1 w-48 bg-white rounded-lg shadow-xl border border-zinc-200 z-50 py-1 overflow-hidden animate-in fade-in zoom-in-95 duration-100 origin-top-right">
                                        {job.status !== 'KLAR' && (
                                            <button 
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    window.db.collection("jobs").doc(job.id).update({status: 'KLAR'});
                                                    setMenuOpen(false);
                                                }}
                                                className="w-full text-left px-4 py-3 text-[13px] font-bold uppercase tracking-wide text-zinc-600 hover:bg-emerald-50 hover:text-emerald-700 flex items-center gap-3 border-b border-zinc-50"
                                            >
                                                <window.Icon name="check" size={16} className="text-emerald-500" /> Markera klar
                                            </button>
                                        )}
                                        <button 
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                if(confirm("Radera ordern?")) {
                                                    window.db.collection("jobs").doc(job.id).update({deleted:true});
                                                }
                                                setMenuOpen(false);
                                            }}
                                            className="w-full text-left px-4 py-3 text-[13px] font-bold uppercase tracking-wide text-red-600 hover:bg-red-50 flex items-center gap-3"
                                        >
                                            <window.Icon name="trash-2" size={16} className="text-red-500" /> Radera order
                                        </button>
                                    </div>
                                </>
                            )}
                        </div>
                    </div>
                </div>

                {/* --- RAD 2: TECH BOX --- */}
                <div className="border border-zinc-200 rounded-[4px] bg-zinc-50/60 py-2 px-3 mb-2">
                    <div className="grid grid-cols-2 gap-4 divide-x divide-zinc-200 relative">
                        
                        {/* FORDON & HISTORIK */}
                        <div className="flex flex-col pr-2">
                            <span className="text-[9px] text-zinc-400 font-bold uppercase tracking-widest mb-0.5">Fordon</span>
                            <div className="flex items-start gap-2">
                                <window.Icon name="car" size={15} className="text-zinc-400 shrink-0 mt-0.5" />
                                <div className="flex flex-col min-w-0">
                                    <span className={`truncate leading-tight mt-0.5 ${isReg 
                                        ? 'font-mono text-[11px] bg-white border border-zinc-300 px-1.5 py-0.5 rounded-[3px] text-black tracking-widest shadow-sm w-fit' 
                                        : 'text-[13px] font-bold text-zinc-800'
                                    }`}>
                                        {vehicleDisplay}
                                    </span>
                                    
                                    {(job.regnr && onOpenHistory) && (
                                        <button 
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                onOpenHistory(job.regnr);
                                            }}
                                            className="text-[9px] font-bold text-blue-600 hover:text-blue-800 flex items-center gap-1 mt-1.5 active:opacity-50 transition-opacity w-fit"
                                        >
                                            <window.Icon name="history" size={10} />
                                            Se historik
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* TID/DATUM */}
                        <div className="flex flex-col pl-4">
                            <span className="text-[9px] text-zinc-400 font-bold uppercase tracking-widest mb-0.5">
                                {showAsHistory ? 'Datum' : 'Tidpunkt'}
                            </span>
                            <div className="flex items-center gap-2">
                                <window.Icon name="clock" size={15} className={`shrink-0 ${!isDone && isUrgentDate ? 'text-orange-500' : 'text-zinc-400'}`} />
                                {job.datum ? (
                                    <div className="flex flex-col">
                                        <span className={`text-[13px] font-bold leading-tight ${showAsHistory ? 'text-zinc-700' : 'text-zinc-900'}`}>
                                            {showAsHistory ? dateString : job.datum.split('T')[1]}
                                        </span>
                                        <span className={`text-[9px] font-bold uppercase leading-none mt-0.5 ${!isDone && isUrgentDate ? 'text-orange-600' : 'text-zinc-400'}`}>
                                            {showAsHistory ? job.datum.split('T')[1] : dateString}
                                        </span>
                                    </div>
                                ) : (
                                    <span className="text-[11px] font-bold text-red-500 mt-0.5">Inväntar</span>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {/* --- RAD 3: KOMMENTAR & PRIS --- */}
                <div className="flex items-end pt-1 min-h-[24px]">
                    <div className="flex-1 min-w-0 mr-2"> 
                        {job.kommentar && (
                            <div className="flex items-start gap-1.5 text-zinc-500">
                                <window.Icon name="message-square" size={12} className="text-zinc-400 shrink-0 mt-[2px]" />
                                <span className="text-[10px] italic font-medium leading-tight line-clamp-2 text-zinc-600">
                                    {job.kommentar}
                                </span>
                            </div>
                        )}
                    </div>
                    
                    <div className="ml-auto flex flex-col items-end shrink-0 text-right">
                        {price > 0 ? (
                            <div className="flex items-baseline justify-end w-full">
                                <div className={`text-[20px] font-mono font-bold leading-none tracking-tight ${isDone ? 'text-zinc-700' : 'text-zinc-900'}`}>
                                    {price.toLocaleString('sv-SE')} 
                                </div>
                                <span className="text-[9px] text-zinc-400 font-medium ml-1 translate-y-[-1px]">KR</span>
                            </div>
                        ) : (
                            <span className="text-[10px] font-bold text-zinc-300 uppercase tracking-wide">Ej prissatt</span>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}, mobileCardPropsAreEqual);

// --- 4. HUVUDVY ---
const dashboardPropsAreEqual = (prev, next) => {
    return (
        prev.filteredJobs === next.filteredJobs &&
        prev.activeFilter === next.activeFilter &&
        prev.globalSearch === next.globalSearch &&
        prev.statusCounts === next.statusCounts
    );
};

window.DashboardView = React.memo(({ 
    filteredJobs, setEditingJob, setView, 
    activeFilter, setActiveFilter, statusCounts,
    globalSearch, setGlobalSearch 
}) => {
    const [searchOpen, setSearchOpen] = React.useState(!!globalSearch);
    const [historyRegnr, setHistoryRegnr] = React.useState(null);
    
    // Globala jobb för statistik
    const [statsJobs, setStatsJobs] = React.useState([]); 

    // Timer State
    const [timerActive, setTimerActive] = React.useState(false);
    const [timerSeconds, setTimerSeconds] = React.useState(0);
    const timerInterval = React.useRef(null);

    const tabsRef = React.useRef(null);
    const filters = ['ALLA', 'BOKAD', 'OFFERERAD', 'FAKTURERAS', 'KLAR'];

    // --- 1. HÄMTA ALL DATA FÖR STATISTIK ---
    React.useEffect(() => {
        const unsubscribe = window.db.collection("jobs").onSnapshot(snapshot => {
            const allJobs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            setStatsJobs(allJobs);
        });
        return () => unsubscribe();
    }, []);

    // --- 2. STATISTIK ---
    const stats30Days = React.useMemo(() => {
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        return statsJobs.filter(j => 
            j.status === 'KLAR' && j.datum && new Date(j.datum) >= thirtyDaysAgo && !j.deleted
        ).length;
    }, [statsJobs]);

    const statsNext7Days = React.useMemo(() => {
        const today = new Date();
        today.setHours(0,0,0,0);
        const nextWeek = new Date(today);
        nextWeek.setDate(nextWeek.getDate() + 7);
        return statsJobs.filter(j => {
            if(!j.datum || j.status === 'KLAR' || j.deleted) return false;
            const d = new Date(j.datum);
            return d >= today && d <= nextWeek;
        }).length;
    }, [statsJobs]);

    const urgentCount = React.useMemo(() => {
        return filteredJobs.filter(j => {
             if(!j.datum) return false;
             const d = formatDate(j.datum);
             return ['IDAG', 'IMORGON'].includes(d) && j.status !== 'KLAR';
        }).length;
    }, [filteredJobs]);

    // --- TIMER ---
    React.useEffect(() => {
        if (timerActive) {
            timerInterval.current = setInterval(() => setTimerSeconds(s => s + 1), 1000);
        } else {
            clearInterval(timerInterval.current);
        }
        return () => clearInterval(timerInterval.current);
    }, [timerActive]);

    const formatTimer = (totalSeconds) => {
        const m = Math.floor(totalSeconds / 60).toString().padStart(2, '0');
        const s = (totalSeconds % 60).toString().padStart(2, '0');
        return `${m}:${s}`;
    };

    const getHeaderDate = () => {
        const d = new Date();
        const days = ['Söndag', 'Måndag', 'Tisdag', 'Onsdag', 'Torsdag', 'Fredag', 'Lördag'];
        const months = ['Januari', 'Februari', 'Mars', 'April', 'Maj', 'Juni', 'Juli', 'Augusti', 'September', 'Oktober', 'November', 'December'];
        return `${days[d.getDay()]}, ${d.getDate()} ${months[d.getMonth()]}`;
    };

    // --- NAVIGERING ---
    const handleOpenHistory = React.useCallback((regnr) => {
        window.history.pushState({ view: 'DASHBOARD', modal: 'HISTORY' }, "", window.location.href);
        setHistoryRegnr(regnr);
    }, []);

    React.useEffect(() => {
        const handlePopState = () => {
            if (historyRegnr) setHistoryRegnr(null);
        };
        window.addEventListener('popstate', handlePopState);
        return () => window.removeEventListener('popstate', handlePopState);
    }, [historyRegnr]);

    React.useEffect(() => {
        if (tabsRef.current) {
            const activeBtn = tabsRef.current.querySelector(`[data-tab="${activeFilter}"]`);
            if (activeBtn) activeBtn.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
        }
        if (navigator.vibrate) navigator.vibrate(5);
    }, [activeFilter]);

    React.useEffect(() => {
        if (globalSearch && !searchOpen && document.activeElement.tagName !== 'INPUT') {
             setSearchOpen(true);
        }
    }, [globalSearch]);

    const touchStart = React.useRef(null);
    const touchStartY = React.useRef(null);
    const onTouchStart = React.useCallback((e) => { 
        touchStart.current = e.targetTouches[0].clientX; 
        touchStartY.current = e.targetTouches[0].clientY; 
    }, []);
    const onTouchEnd = React.useCallback((e) => {
        if (touchStart.current === null || touchStartY.current === null) return;
        const xDiff = touchStart.current - e.changedTouches[0].clientX;
        const yDiff = touchStartY.current - e.changedTouches[0].clientY;
        touchStart.current = null; touchStartY.current = null;
        if (Math.abs(yDiff) >= Math.abs(xDiff) || Math.abs(xDiff) < 50) return;
        const currIdx = filters.indexOf(activeFilter);
        if (currIdx === -1) return;
        let nextIdx = currIdx + (xDiff > 0 ? 1 : -1);
        if (nextIdx >= 0 && nextIdx < filters.length) setActiveFilter(filters[nextIdx]);
    }, [activeFilter, filters, setActiveFilter]);

    const TabButton = ({ label }) => {
        const isActive = activeFilter === label;
        const count = statusCounts[label] || 0;
        return (
            <button onClick={() => setActiveFilter(label)} className={`px-4 py-2 text-[11px] font-bold uppercase tracking-wider transition-all rounded-t-lg border-t-2 ${isActive ? 'bg-white text-black border-orange-500 shadow-[0_-5px_10px_rgba(0,0,0,0.02)]' : 'bg-transparent text-zinc-400 border-transparent hover:text-zinc-600 hover:bg-zinc-200/50'}`}>
                {label}
                {count > 0 && <span className={`ml-2 text-[9px] ${isActive ? 'text-orange-600' : 'text-zinc-400'}`}>({count})</span>}
            </button>
        );
    };

    return (
        <div className="flex flex-col min-h-screen bg-[#f4f4f5] font-sans text-zinc-900">
            
            {/* --- DESKTOP VY (REPARERAD) --- */}
            <div className="hidden lg:flex flex-col h-full px-8 py-8">
                
                {/* Header (Med nya widgets) */}
                <div className="flex justify-between items-end mb-8">
                    <div>
                        {/* System Online + Widgets */}
                        <div className="flex items-center gap-6 mb-2">
                            <div className="flex items-center gap-2">
                                <span className="w-2 h-2 rounded-full bg-orange-500 shadow-[0_0_10px_orange]"></span>
                                <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">System Online</span>
                            </div>
                            
                            {/* Desktop Widgets */}
                            <div className="flex items-center gap-3">
                                 {/* Väder */}
                                 <div className="flex items-center gap-1.5 text-zinc-400">
                                     <window.Icon name="cloud" size={12} />
                                     <span className="text-[10px] font-bold">16°C</span>
                                 </div>
                                 <div className="w-[1px] h-3 bg-zinc-300"></div>
                                 {/* Timer */}
                                 <div className="flex items-center gap-2">
                                     <button onClick={() => setTimerActive(!timerActive)} className={`w-4 h-4 flex items-center justify-center rounded-[2px] ${timerActive ? 'bg-red-500 text-white' : 'bg-green-500 text-white'}`}>
                                         <window.Icon name={timerActive ? "square" : "play"} size={8} fill="currentColor" />
                                     </button>
                                     <span className="text-[11px] font-mono font-bold text-zinc-600 w-[32px]">{formatTimer(timerSeconds)}</span>
                                     <button onClick={() => {setTimerActive(false); setTimerSeconds(0);}} className="text-zinc-400 hover:text-black"><window.Icon name="rotate-ccw" size={10} /></button>
                                 </div>
                            </div>
                        </div>

                        {/* Title & Icon */}
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 bg-orange-500 rounded-[4px] flex items-center justify-center text-black font-bold shadow-[0_0_20px_rgba(249,115,22,0.3)]">
                                <window.Icon name="grid" size={24} />
                            </div>
                            <h1 className="text-5xl font-black text-black uppercase tracking-tighter leading-none drop-shadow-sm">
                                Mission <span className="text-zinc-400">Control</span>
                            </h1>
                        </div>
                    </div>

                    <div className="flex items-center gap-4">
                        <div className="relative group shadow-sm">
                            <input type="text" value={globalSearch} onChange={e => setGlobalSearch(e.target.value)} placeholder="SÖK..." className="w-64 bg-white border border-zinc-200 text-black text-[12px] font-bold py-3 pl-4 pr-10 uppercase rounded-[4px] focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500" />
                            <window.Icon name="search" size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-300" />
                        </div>
                        <button onClick={() => setView('NEW_JOB')} className="bg-black hover:bg-zinc-800 text-white h-[42px] px-6 rounded-[4px] flex items-center gap-3 shadow-lg group border border-black">
                            <span className="text-[11px] font-black uppercase tracking-widest">Nytt Jobb</span>
                            <window.Icon name="plus" size={16} className="text-orange-500" />
                        </button>
                    </div>
                </div>
                
                {/* Desktop Stats (Uppdaterad med 30d/7d) */}
                <div className="bg-white rounded-[4px] border-l-4 border-l-orange-500 shadow-sm border-y border-r border-zinc-200 p-5 mb-6 flex items-center gap-12">
                    <div>
                        <div className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-1">Utförda (30d)</div>
                        <div className="text-[22px] font-black tracking-tight text-zinc-900 leading-none">{stats30Days} <span className="text-[14px] text-zinc-400 font-medium">st</span></div>
                    </div>
                    <div className="w-[1px] h-8 bg-zinc-100"></div>
                    <div>
                        <div className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-1">Kommande (7d)</div>
                        <div className="text-[22px] font-black tracking-tight text-zinc-900 leading-none">{statsNext7Days} <span className="text-[14px] text-zinc-400 font-medium">st</span></div>
                    </div>
                    <div className="w-[1px] h-8 bg-zinc-100"></div>
                    <div>
                        <div className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-1">Prioritet</div>
                        <div className={`text-[22px] font-black tracking-tight leading-none ${urgentCount > 0 ? 'text-orange-500' : 'text-zinc-900'}`}>
                            {urgentCount} <span className="text-[14px] text-zinc-400 font-medium text-black">st</span>
                        </div>
                    </div>
                </div>

                <div className="flex flex-col flex-1">
                    <div className="flex px-2 space-x-1">{filters.map(f => <TabButton key={f} label={f} />)}</div>
                    
                    {/* TABELLEN - ÅTERSTÄLLD TILL BILD 1 DESIGN */}
                    <div className="bg-white rounded-lg rounded-tl-none shadow-[0_2px_15px_-3px_rgba(0,0,0,0.07),0_10px_20px_-2px_rgba(0,0,0,0.04)] border border-zinc-200 overflow-hidden flex flex-col flex-1 min-h-[500px]">
                        <div className="flex-1 overflow-auto">
                            <table className="w-full text-left border-collapse">
                                <thead className="bg-zinc-50 border-b border-zinc-200 text-zinc-500 text-[10px] uppercase tracking-widest font-bold">
                                    <tr>
                                        <th className="pl-6 pr-4 py-4 w-[25%]">Kund</th>
                                        <th className="px-4 py-4 w-[15%]">Fordon</th>
                                        <th className="px-4 py-4 w-[15%]">Datum</th>
                                        <th className="px-4 py-4 w-[15%]">Status</th>
                                        <th className="px-4 py-4 w-[15%] text-right">Belopp</th>
                                        <th className="pl-4 pr-6 py-4 w-[15%] text-right"></th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-zinc-100">
                                    {filteredJobs.map((job) => {
                                        const dateText = formatDate(job.datum);
                                        const isUrgent = ['IDAG', 'IMORGON'].includes(dateText) && job.status !== 'KLAR';
                                        const regDisplay = job.regnr || job.bilmodell || '-';
                                        const isReg = regDisplay.length <= 8 && /\d/.test(regDisplay);

                                        return (
                                            <tr key={job.id} onClick={() => setView('NEW_JOB', { job: job })} className="group hover:bg-orange-50/30 transition-colors cursor-pointer">
                                                
                                                {/* KUND (Samma som bild 1) */}
                                                <td className="pl-6 pr-4 py-4 align-top">
                                                    <div className="flex items-start gap-3">
                                                        <div className={`mt-1.5 w-2 h-2 rounded-sm shrink-0 ${isUrgent ? 'bg-orange-500' : 'bg-zinc-300'}`}></div>
                                                        <div>
                                                            <div className="text-[14px] font-bold text-zinc-900 leading-none mb-1">{job.kundnamn}</div>
                                                            <div className="flex items-center gap-2">
                                                                <span className="text-[10px] font-mono text-zinc-400 bg-zinc-50 px-1 rounded border border-zinc-100">#{job.id.substring(0,6)}</span>
                                                                {job.kommentar && <window.Icon name="message-circle" size={12} className="text-zinc-400" />}
                                                            </div>
                                                        </div>
                                                    </div>
                                                </td>

                                                {/* FORDON (Badge-design från bild 1) */}
                                                <td className="px-4 py-4 align-top">
                                                    <div onClick={(e) => { e.stopPropagation(); if(job.regnr) setHistoryRegnr(job.regnr); }} className={`inline-block font-mono font-bold text-[11px] px-2 py-1 rounded-[3px] border transition-transform hover:-translate-y-0.5 ${isReg ? 'bg-white border-zinc-300 text-black shadow-sm group-hover:border-orange-300' : 'bg-transparent border-transparent text-zinc-400'}`}>
                                                        {regDisplay}
                                                    </div>
                                                </td>

                                                {/* DATUM (Split view från bild 1) */}
                                                <td className="px-4 py-4 align-top">
                                                    {job.datum ? (
                                                        <div>
                                                            <div className={`text-[11px] font-black uppercase ${isUrgent ? 'text-orange-600' : 'text-zinc-800'}`}>{dateText}</div>
                                                            <div className="text-[10px] font-mono text-zinc-400">{job.datum.split('T')[1]}</div>
                                                        </div>
                                                    ) : <span className="text-[10px] font-bold text-zinc-300 uppercase">Inväntar</span>}
                                                </td>

                                                {/* STATUS */}
                                                <td className="px-4 py-4 align-top">
                                                    <window.Badge status={job.status} />
                                                </td>

                                                {/* BELOPP */}
                                                <td className="px-4 py-4 align-top text-right">
                                                    <div className="font-mono font-bold text-[14px] text-zinc-900">
                                                        {(parseInt(job.kundpris) || 0).toLocaleString()} <span className="text-[10px] text-zinc-400">kr</span>
                                                    </div>
                                                </td>

                                                {/* ACTIONS */}
                                                <td className="pl-4 pr-6 py-4 align-middle text-right">
                                                    <div className="opacity-0 group-hover:opacity-100 transition-opacity flex justify-end gap-2">
                                                        <button onClick={(e) => { e.stopPropagation(); setView('NEW_JOB', { job: job }); }} className="w-8 h-8 flex items-center justify-center rounded bg-white border border-zinc-200 text-zinc-400 hover:text-blue-600 hover:border-blue-300 hover:shadow-sm transition-all"><window.Icon name="edit-2" size={14} /></button>
                                                        <button onClick={(e) => { e.stopPropagation(); if(confirm("Radera?")) window.db.collection("jobs").doc(job.id).update({deleted:true}); }} className="w-8 h-8 flex items-center justify-center rounded bg-white border border-zinc-200 text-zinc-400 hover:text-red-600 hover:border-red-300 hover:shadow-sm transition-all"><window.Icon name="trash" size={14} /></button>
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                    {filteredJobs.length === 0 && (<tr><td colSpan="6" className="py-20 text-center text-zinc-400 text-[10px] font-bold uppercase">Listan är tom</td></tr>)}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>

            {/* --- MOBILE VY (Orörd från tidigare förutom Icon Grid fix) --- */}
            <div 
                className="lg:hidden flex flex-col min-h-screen bg-[#f4f4f5] touch-pan-y"
                onTouchStart={onTouchStart} onTouchEnd={onTouchEnd}
            >
                {/* --- HEADER --- */}
                <div className="bg-[#0f0f11] text-white pt-safe-top sticky top-0 z-40 shadow-md pb-0">
                     
                     {/* RAD 1: Titel, Datum & Sök */}
                     <div className="px-4 py-4 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                             <div className="w-10 h-10 bg-orange-500 rounded-[3px] flex items-center justify-center text-black font-bold shadow-[0_0_15px_rgba(249,115,22,0.4)]">
                                <window.Icon name="grid" size={20} />
                            </div>
                            <div className="flex flex-col">
                                <span className="text-2xl font-black uppercase tracking-tighter leading-none mb-1">Mission Control</span>
                                <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">{getHeaderDate()}</span>
                            </div>
                        </div>
                        <button onClick={() => setSearchOpen(!searchOpen)} className="w-10 h-10 flex items-center justify-center bg-zinc-800/50 rounded-full text-zinc-400 hover:text-white transition-colors border border-zinc-700/50">
                            <window.Icon name={searchOpen ? "x" : "search"} size={20} />
                        </button>
                     </div>

                     {/* RAD 2: WIDGETS (Fixad: Ingen scroll, flex-wrap) */}
                     {!searchOpen && (
                         <div className="px-4 pb-4 flex flex-wrap items-center gap-3">
                             
                             {/* WIDGET 1: VÄDER */}
                             <div className="flex items-center gap-2 bg-zinc-900 border border-zinc-800 rounded-[4px] px-3 py-2 h-[38px]">
                                 <window.Icon name="cloud" size={14} className="text-zinc-400" />
                                 <span className="text-[12px] font-bold text-white">16°C</span>
                             </div>

                             {/* WIDGET 2: TIMER */}
                             <div className="flex items-center gap-2 bg-zinc-900 border border-zinc-800 rounded-[4px] px-2 py-1 h-[38px]">
                                 <button onClick={() => setTimerActive(!timerActive)} className={`w-6 h-6 flex items-center justify-center rounded-[3px] transition-colors ${timerActive ? 'bg-red-500/20 text-red-500' : 'bg-green-500/20 text-green-500'}`}>
                                     <window.Icon name={timerActive ? "square" : "play"} size={10} fill="currentColor" />
                                 </button>
                                 <span className="text-[14px] font-mono font-bold text-white w-[40px] text-center">{formatTimer(timerSeconds)}</span>
                                 <button onClick={() => {setTimerActive(false); setTimerSeconds(0);}} className="text-zinc-500 hover:text-white px-1"><window.Icon name="rotate-ccw" size={12} /></button>
                             </div>

                             {/* WIDGET 3: STATS (Global data) */}
                             <div className="flex items-center gap-3 bg-zinc-900 border border-zinc-800 rounded-[4px] px-3 py-1 h-[38px] flex-grow justify-between sm:flex-grow-0">
                                 <div className="flex flex-col justify-center">
                                     <span className="text-[7px] font-bold text-zinc-500 uppercase tracking-widest leading-none mb-0.5">30d</span>
                                     <span className="text-[12px] font-mono font-bold text-emerald-500 leading-none">
                                         {stats30Days} <span className="text-[8px] text-zinc-600">st</span>
                                     </span>
                                 </div>
                                 <div className="w-[1px] h-4 bg-zinc-800"></div>
                                 <div className="flex flex-col justify-center text-right">
                                     <span className="text-[7px] font-bold text-zinc-500 uppercase tracking-widest leading-none mb-0.5">7d</span>
                                     <span className="text-[12px] font-mono font-bold text-blue-500 leading-none">
                                         {statsNext7Days} <span className="text-[8px] text-zinc-600">st</span>
                                     </span>
                                 </div>
                             </div>
                         </div>
                     )}

                     {/* RAD 3: SÖK-INPUT */}
                     {searchOpen && (
                         <div className="px-4 pb-3 animate-in slide-in-from-top-2">
                             <input autoFocus type="text" value={globalSearch} onChange={e => setGlobalSearch(e.target.value)} placeholder="SÖK..." className="w-full h-10 bg-zinc-800 text-white rounded-[2px] px-3 text-sm focus:outline-none focus:ring-1 focus:ring-orange-500 border border-zinc-700" />
                         </div>
                     )}
                     
                     {/* RAD 4: FILTER MENY */}
                     <div ref={tabsRef} className="flex overflow-x-auto gap-2 px-4 pb-3" style={{scrollbarWidth:'none'}}>
                         {filters.map(s => {
                             const isActive = activeFilter === s;
                             return (
                                 <button key={s} data-tab={s} onClick={() => setActiveFilter(s)} 
                                    className={`px-3 py-1.5 text-[10px] font-black uppercase tracking-wider rounded-[2px] border whitespace-nowrap flex items-center gap-2 transition-all
                                    ${isActive ? 'bg-white text-black border-white' : 'bg-zinc-800 text-zinc-500 border-zinc-700'}`}>
                                    {s} 
                                    {statusCounts[s] > 0 && <span className={`px-1 rounded-[2px] ${isActive ? 'bg-black text-white' : 'bg-zinc-700 text-zinc-400'}`}>{statusCounts[s]}</span>}
                                 </button>
                             )
                         })}
                     </div>
                </div>

                <div className="px-3 py-2 pb-24 flex flex-col gap-2">
                    {filteredJobs.length > 0 ? (
                        filteredJobs.map((job) => (
                            <MobileJobCard key={job.id} job={job} setView={setView} onOpenHistory={handleOpenHistory} />
                        ))
                    ) : (
                        <div className="flex flex-col items-center justify-center py-20 text-zinc-400">
                            <window.Icon name="inbox" size={32} className="mb-2 opacity-50" />
                            <span className="text-[10px] font-black uppercase tracking-widest">Inga jobb här</span>
                        </div>
                    )}
                </div>
            </div>

            {/* MODUL: History */}
            {historyRegnr && window.VehicleProfileLoader && (
                <window.VehicleProfileLoader 
                    regnr={historyRegnr} 
                    onClose={() => window.history.back()} 
                    setView={setView} 
                />
            )}
        </div>
    );
}, dashboardPropsAreEqual);
