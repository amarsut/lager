// dashboard.js

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

// 2. STATUS BADGE (Uppdaterad för att inte vara en "cirkus" i Dark Mode)
window.Badge = React.memo(({ status }) => {
    const s = (status || 'BOKAD').toUpperCase();
    const config = {
        'BOKAD': { bg: 'bg-orange-50 dark:bg-[#1a2235]', text: 'text-orange-700 dark:text-zinc-300', border: 'border-orange-200/60 dark:border-[#2a3441]', dot: 'bg-orange-500' },
        'OFFERERAD': { bg: 'bg-blue-50 dark:bg-[#1a2235]', text: 'text-blue-700 dark:text-zinc-300', border: 'border-blue-200/60 dark:border-[#2a3441]', dot: 'bg-blue-500' },
        'KLAR': { bg: 'bg-emerald-50 dark:bg-[#1a2235]', text: 'text-emerald-700 dark:text-zinc-300', border: 'border-emerald-200/60 dark:border-[#2a3441]', dot: 'bg-emerald-500' },
        'FAKTURERAS': { bg: 'bg-zinc-100 dark:bg-[#1a2235]', text: 'text-zinc-600 dark:text-zinc-300', border: 'border-zinc-200 dark:border-[#2a3441]', dot: 'bg-zinc-400' },
    };
    const style = config[s] || config['BOKAD'];
    return (
        <span className={`px-2.5 py-1 text-[9px] font-bold uppercase tracking-wider inline-flex items-center gap-1.5 rounded-full border ${style.bg} ${style.text} ${style.border}`}>
            <span className={`w-1.5 h-1.5 rounded-full ${style.dot}`}></span>
            {s}
        </span>
    );
});

// Färg-generator för avatarer (Skapar fasta, mjuka färger baserat på namnet)
const getAvatarTheme = (name) => {
    if (!name) return 'bg-zinc-100 text-zinc-600 border-zinc-200 dark:bg-[#1a2235] dark:text-zinc-400 dark:border-white/5';
    const themes = [
        'bg-blue-50 text-blue-600 border-blue-200 dark:bg-blue-500/10 dark:text-blue-400 dark:border-blue-500/20',
        'bg-emerald-50 text-emerald-600 border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20',
        'bg-violet-50 text-violet-600 border-violet-200 dark:bg-violet-500/10 dark:text-violet-400 dark:border-violet-500/20',
        'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-500/10 dark:text-amber-400 dark:border-amber-500/20',
        'bg-rose-50 text-rose-600 border-rose-200 dark:bg-rose-500/10 dark:text-rose-400 dark:border-rose-500/20',
        'bg-cyan-50 text-cyan-600 border-cyan-200 dark:bg-cyan-500/10 dark:text-cyan-400 dark:border-cyan-500/20'
    ];
    let hash = 0;
    for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
    return themes[Math.abs(hash) % themes.length];
};

// 3. MOBILKORTET (Städat och proffsigt)
const mobileCardPropsAreEqual = (prev, next) => {
    return prev.job === next.job && prev.job.status === next.job.status && prev.job.datum === next.job.datum;
};

const MobileJobCard = React.memo(({ job, setView, onOpenHistory }) => {
    const [menuOpen, setMenuOpen] = React.useState(false);

    const isWaiting = !job.datum;
    const dateString = formatDate(job.datum);
    const isUrgentDate = ['IDAG', 'IMORGON', 'IGÅR'].includes(dateString);
    const isDone = ['KLAR', 'FAKTURERAS'].includes(job.status);
    const showAsHistory = isDone || (!isWaiting && !isUrgentDate);

    const vehicleDisplay = job.regnr || job.bilmodell || '-';
    const isReg = vehicleDisplay.length <= 8 && /\d/.test(vehicleDisplay);
    const price = parseInt(job.kundpris) || 0;

    const initials = job.kundnamn ? job.kundnamn.split(' ').map(n => n[0]).join('').substring(0,2).toUpperCase() : '??';
    const avatarTheme = getAvatarTheme(job.kundnamn);

    return (
        <div
            onClick={() => job.regnr ? onOpenHistory(job.regnr, job.id) : null}
            className={`w-full relative active:scale-[0.98] transition-all bg-white hover:bg-orange-50 dark:bg-[#182032] dark:hover:bg-[#1f2940] border border-zinc-300 dark:border-white/10 rounded-xl shadow-md group select-none overflow-hidden ${isDone ? 'opacity-70 grayscale-[0.3]' : ''}`}
        >
            <div className="p-4">
                {/* RAD 1: Header med Avatar, Namn, Status och Meny */}
                <div className="flex justify-between items-start mb-4">
                    <div className="flex items-center gap-3 min-w-0 pr-2">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center text-[13px] font-bold shrink-0 border ${avatarTheme}`}>
                            {initials}
                        </div>
                        <div className="flex flex-col min-w-0">
                            <div className={`text-[15px] font-bold truncate leading-tight mb-0.5 ${isDone ? 'text-zinc-600 dark:text-zinc-500' : 'text-zinc-900 dark:text-white'}`}>
                                {job.kundnamn}
                            </div>
                            <div className="text-[11px] font-mono text-zinc-400 dark:text-zinc-500">#{job.id.substring(0, 6)}</div>
                        </div>
                    </div>

                    <div className="flex items-center gap-3 relative z-30">
                        <window.Badge status={job.status} />
                        <div className="relative">
                            <button onClick={(e) => { e.stopPropagation(); setMenuOpen(!menuOpen); }} className="w-8 h-8 -mr-2 -mt-1 flex items-center justify-center text-zinc-400 hover:text-black dark:text-zinc-500 dark:hover:text-white transition-colors">
                                <window.Icon name="more-horizontal" size={18} />
                            </button>
                            {/* Menyn */}
                            {menuOpen && (
                                <>
                                    <div className="fixed inset-0 z-40 cursor-default" onClick={(e) => { e.stopPropagation(); setMenuOpen(false); }}></div>
                                    <div className="absolute right-0 top-full mt-1 w-48 bg-white dark:bg-[#1a2235] rounded-lg shadow-xl dark:shadow-2xl border border-zinc-200 dark:border-white/5 z-50 py-1 overflow-hidden animate-in fade-in zoom-in-95 duration-100 origin-top-right">
                                        {job.status !== 'KLAR' && (
                                            <button onClick={(e) => { e.stopPropagation(); window.db.collection("jobs").doc(job.id).update({ status: 'KLAR' }); setMenuOpen(false); }} className="w-full text-left px-4 py-3 text-[13px] font-bold uppercase tracking-wide text-zinc-600 dark:text-zinc-300 hover:bg-emerald-50 dark:hover:bg-[#252f48] hover:text-emerald-700 dark:hover:text-emerald-400 flex items-center gap-3 border-b border-zinc-50 dark:border-white/5">
                                                <window.Icon name="check" size={16} className="text-emerald-500" /> Markera klar
                                            </button>
                                        )}
                                        <button onClick={(e) => { e.stopPropagation(); setView('NEW_JOB', { job: job }); setMenuOpen(false); }} className="w-full text-left px-4 py-3 text-[13px] font-bold uppercase tracking-wide text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-[#252f48] flex items-center gap-3 border-b border-zinc-50 dark:border-white/5">
                                            <window.Icon name="edit-2" size={16} className="text-blue-500" /> Redigera order
                                        </button>
                                        <button onClick={(e) => { e.stopPropagation(); if (confirm("Radera ordern?")) { window.db.collection("jobs").doc(job.id).update({ deleted: true }); } setMenuOpen(false); }} className="w-full text-left px-4 py-3 text-[13px] font-bold uppercase tracking-wide text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-[#252f48] flex items-center gap-3">
                                            <window.Icon name="trash-2" size={16} className="text-red-500" /> Radera order
                                        </button>
                                    </div>
                                </>
                            )}
                        </div>
                    </div>
                </div>

                {/* RAD 2: Den inre informations-boxen */}
                <div className="flex items-center p-3 mb-4 rounded-lg border border-zinc-200 dark:border-white/10 bg-zinc-50/80 dark:bg-white/[0.04] divide-x divide-zinc-200 dark:divide-white/10">
                    
                    {/* VÄNSTER: Fordon */}
                    <div className="flex flex-col flex-1 pr-3 min-w-0">
                        <span className="text-[9px] text-zinc-400 dark:text-zinc-500 font-black uppercase tracking-widest mb-1.5 flex items-center gap-1.5">
                            <window.Icon name="truck" size={10} /> Fordon
                        </span>
                        <div className={`inline-flex items-center rounded-[3px] border overflow-hidden h-[24px] ${isReg ? 'bg-white dark:bg-[#1a2235] border-zinc-300 dark:border-[#2a3441]' : 'bg-transparent border-transparent'}`}>
                            {isReg ? (
                                <>
                                    <div className="w-[12px] bg-[#003399] h-full flex flex-col items-center justify-between py-[1px] shrink-0 border-r border-zinc-200 dark:border-[#2a3441]">
                                        <div className="w-1.5 h-1.5 rounded-full border-[1px] border-[#ffcc00] mt-[1px]"></div>
                                        <span className="text-[6px] font-sans font-black text-white leading-none antialiased mb-[1px]">S</span>
                                    </div>
                                    <div className="flex h-full items-center justify-center px-2 min-w-[60px]"><span className="font-mono font-bold text-[12px] text-zinc-900 dark:text-zinc-200 tracking-wider leading-none mt-[1px]">{vehicleDisplay}</span></div>
                                </>
                            ) : (
                                <span className="font-mono font-bold text-[13px] text-zinc-800 dark:text-zinc-300 uppercase leading-none mt-[1px]">{vehicleDisplay}</span>
                            )}
                        </div>
                    </div>

                    {/* HÖGER: Datum & Tid */}
                    <div className="flex flex-col items-end text-right flex-1 pl-3 min-w-0 justify-center">
                        <span className="text-[9px] text-zinc-400 dark:text-zinc-500 font-black uppercase tracking-widest mb-1.5 flex items-center justify-end gap-1.5 w-full">
                            <window.Icon name="clock" size={10} /> {job.datum ? 'Datum & Tid' : 'Status'}
                        </span>
                        {job.datum ? (
                            <div className="flex items-center justify-end gap-1.5 h-[24px]">
                                {!isDone && isUrgentDate && (
                                    <span className="relative flex h-2 w-2 shrink-0">
                                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-orange-400 opacity-75"></span>
                                        <span className="relative inline-flex rounded-full h-2 w-2 bg-orange-500"></span>
                                    </span>
                                )}
                                <span className={`text-[12px] font-black uppercase leading-none truncate mt-[1px] ${!isDone && isUrgentDate ? 'text-orange-600' : 'text-zinc-900 dark:text-white'}`}>
                                    {dateString}, <span className="font-mono font-bold text-[11px] text-zinc-500 dark:text-zinc-400">{job.datum.split('T')[1]}</span>
                                </span>
                            </div>
                        ) : (
                            <div className="flex items-center justify-end h-[24px]">
                                <span className="text-[11px] font-bold text-red-500 uppercase tracking-widest mt-[1px]">Inväntar</span>
                            </div>
                        )}
                    </div>
                </div>

                {/* RAD 3: Tjänst & Pris */}
                <div className="flex items-end justify-between mt-1">
                    <div className="flex-1 min-w-0 mr-4">
                        <span className="text-[14px] font-black text-zinc-900 dark:text-white uppercase tracking-tight block truncate">{job.paket || 'Standard'}</span>
                        {job.kommentar && (
                            <span className="text-[11px] text-zinc-600 dark:text-zinc-400 mt-1 line-clamp-1 italic flex items-center gap-1.5 font-medium">
                                <window.Icon name="message-square" size={10} className="shrink-0" />
                                {job.kommentar}
                            </span>
                        )}
                    </div>
                    
                    <div className="shrink-0 text-right">
                        {price > 0 ? (
                            <div className="flex items-baseline justify-end gap-1">
                                <span className="text-[18px] font-mono font-black text-zinc-900 dark:text-white leading-none">
                                    {price.toLocaleString('sv-SE')}
                                </span> 
                                <span className="text-[10px] text-zinc-400 font-sans font-bold uppercase tracking-wider">kr</span>
                            </div>
                        ) : (
                            <span className="text-[10px] font-medium text-zinc-400 uppercase tracking-widest block mt-1">Ej prissatt</span>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}, mobileCardPropsAreEqual);

// --- 4. HUVUDVY ---
const dashboardPropsAreEqual = (prev, next) => {
    return prev.filteredJobs === next.filteredJobs && prev.activeFilter === next.activeFilter && prev.globalSearch === next.globalSearch && prev.statusCounts === next.statusCounts;
};

window.DashboardView = React.memo(({
    allJobs,
    filteredJobs, setEditingJob, setView,
    activeFilter, setActiveFilter, statusCounts,
    globalSearch, setGlobalSearch
}) => {
    const [searchOpen, setSearchOpen] = React.useState(!!globalSearch);
    const [historyTarget, setHistoryTarget] = React.useState(null);

    // --- PAGINERING (Load More) ---
    const [visibleCount, setVisibleCount] = React.useState(20);
    
    // Återställ antalet visade jobb till 20 när vi byter flik eller söker
    React.useEffect(() => {
        setVisibleCount(20);
    }, [activeFilter, globalSearch]);

    // Skapa en ny lista som bara innehåller exakt så många vi ska visa
    const visibleJobs = filteredJobs.slice(0, visibleCount);
    const hasMore = visibleCount < filteredJobs.length;

    const [timerActive, setTimerActive] = React.useState(false);
    const [timerSeconds, setTimerSeconds] = React.useState(0);
    const timerInterval = React.useRef(null);

    const tabsRef = React.useRef(null);
    const filters = ['ALLA', 'BOKAD', 'OFFERERAD', 'FAKTURERAS', 'KLAR'];

    const stats30Days = React.useMemo(() => {
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        return allJobs.filter(j => j.status === 'KLAR' && j.datum && new Date(j.datum) >= thirtyDaysAgo && !j.deleted).length;
    }, [allJobs]);

    const statsNext7Days = React.useMemo(() => {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const nextWeek = new Date(today);
        nextWeek.setDate(nextWeek.getDate() + 7);
        return allJobs.filter(j => {
            if (!j.datum || j.status === 'KLAR' || j.deleted) return false;
            const d = new Date(j.datum);
            return d >= today && d <= nextWeek;
        }).length;
    }, [allJobs]);

    const urgentCount = React.useMemo(() => {
        return filteredJobs.filter(j => {
            if (!j.datum) return false;
            const d = formatDate(j.datum);
            return ['IDAG', 'IMORGON'].includes(d) && j.status !== 'KLAR';
        }).length;
    }, [filteredJobs]);

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

    const handleOpenHistory = React.useCallback((regnr, jobId) => {
        setHistoryTarget({ regnr, highlightId: jobId });
    }, []);

    React.useEffect(() => {
        if (tabsRef.current) {
            const activeBtn = tabsRef.current.querySelector(`[data-tab="${activeFilter}"]`);
            if (activeBtn) activeBtn.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
        }
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
            <button onClick={() => setActiveFilter(label)} className={`px-4 py-2 text-[12px] font-semibold tracking-wide transition-all border-b-2 mb-[-1px] ${isActive ? 'text-orange-500 border-orange-500 bg-transparent' : 'text-zinc-500 border-transparent hover:text-zinc-700 dark:hover:text-zinc-300'}`}>
                {label}
                {count > 0 && <span className={`ml-2 text-[9px] ${isActive ? 'text-orange-600 dark:text-orange-500' : 'text-zinc-400 dark:text-zinc-600'}`}>({count})</span>}
            </button>
        );
    };

    return (
        <div className="flex flex-col min-h-screen bg-transparent text-zinc-900 dark:text-white pb-20 lg:pb-0 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none] transition-colors duration-300">

            {/* --- DESKTOP VY --- */}
            <div className="hidden lg:flex flex-col h-full">
    
                {/* REN BMG HEADER MED TYDLIG LINJE & ORGINAL-LOGGA */}
                <div className="flex flex-col md:flex-row md:items-center justify-between mb-4 pb-4 border-b border-zinc-200 dark:border-white/5 gap-4">
                    
                    {/* LOGGA OCH TITEL */}
                    <div className="flex items-center gap-4">
                        <div className="w-10 h-10 bg-orange-500 rounded-[4px] flex items-center justify-center text-black font-bold shadow-[0_0_20px_rgba(249,115,22,0.3)] shrink-0">
                            <window.Icon name="grid" size={20} />
                        </div>
                        <div className="flex flex-col">
                            <h1 className="text-xl md:text-2xl font-black text-black dark:text-white uppercase tracking-[-0.03em] leading-none drop-shadow-sm dark:drop-shadow-none">
                                DASH<span className="text-zinc-500 dark:text-zinc-500">BOARD</span>
                            </h1>
                            <p className="text-[11px] font-bold text-zinc-500 uppercase tracking-widest mt-1.5">Översikt & Operationell Status</p>
                        </div>
                    </div>

                    {/* SÖK OCH NYTT JOBB */}
                    <div className="flex items-center gap-4">
                        <div className="relative group shadow-sm dark:shadow-none">
                            <input type="text" value={globalSearch} onChange={e => setGlobalSearch(e.target.value)} placeholder="SÖK..." className="w-64 bg-white dark:bg-[#182032] border border-zinc-200 dark:border-white/10 text-zinc-900 dark:text-white text-[13px] font-medium py-2.5 pl-4 pr-10 rounded-md focus:outline-none focus:border-orange-500 focus:ring-4 focus:ring-orange-500/10 hover:border-zinc-300 dark:hover:border-white/20 transition-all placeholder:text-zinc-400 dark:placeholder:text-zinc-500 shadow-sm" />
                            <window.Icon name="search" size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-300 dark:text-zinc-500" />
                        </div>
                        <button onClick={() => setView('NEW_JOB')} className="bg-black dark:bg-[#1a2235] hover:bg-zinc-800 dark:hover:bg-[#252f48] text-white h-[42px] px-6 rounded-[4px] flex items-center gap-3 shadow-lg dark:shadow-none border border-black dark:border-[#2a3441] transition-colors">
                            <span className="text-[11px] font-black uppercase tracking-widest">Nytt Jobb</span>
                            <window.Icon name="plus" size={16} className="text-orange-500" />
                        </button>
                    </div>
                </div>

                {/* Desktop Stats */}
                <div className="grid grid-cols-3 gap-4 mb-6">
                    <div className="bg-white dark:bg-[#182032] rounded-xl border border-zinc-200 dark:border-white/5 p-5 shadow-sm dark:shadow-md relative overflow-hidden transition-colors">
                        <window.Icon name="check-circle" size={80} className="absolute -right-6 -bottom-6 text-zinc-200 dark:text-white/10 transition-colors" />
                        <div className="relative z-10">
                            <div className="text-[11px] font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wide mb-2">Utförda (30d)</div>
                            <div className="text-[26px] font-bold tracking-tight text-zinc-900 dark:text-white leading-none">{stats30Days} <span className="text-[14px] text-zinc-400 dark:text-zinc-600 font-medium">st</span></div>
                        </div>
                    </div>

                    <div className="bg-white dark:bg-[#182032] rounded-xl border border-zinc-200 dark:border-white/5 p-5 shadow-sm dark:shadow-md relative overflow-hidden transition-colors">
                        <window.Icon name="calendar" size={80} className="absolute -right-6 -bottom-6 text-zinc-200 dark:text-white/10 transition-colors" />
                        <div className="relative z-10">
                            <div className="text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-widest mb-1">Kommande (7d)</div>
                            <div className="text-[26px] font-bold tracking-tight text-zinc-900 dark:text-white leading-none">{statsNext7Days} <span className="text-[14px] text-zinc-400 dark:text-zinc-600 font-medium">st</span></div>
                        </div>
                    </div>

                    <div className="bg-white dark:bg-[#182032] rounded-xl border border-zinc-200 dark:border-white/5 p-5 shadow-sm dark:shadow-md relative overflow-hidden transition-colors">
                        <window.Icon name="alert-triangle" size={80} className="absolute -right-6 -bottom-6 text-zinc-200 dark:text-white/10 transition-colors" />
                        <div className="relative z-10">
                            <div className="text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-widest mb-1">Prioritet</div>
                            <div className={`text-[26px] font-bold tracking-tight leading-none ${urgentCount > 0 ? 'text-orange-500' : 'text-zinc-900 dark:text-white'}`}>
                                {urgentCount} <span className="text-[14px] text-zinc-400 dark:text-zinc-600 font-medium">st</span>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="flex flex-col flex-1">
                    <div className="flex px-2 space-x-1">{filters.map(f => <TabButton key={f} label={f} />)}</div>

                    {/* TABELLEN (Anpassad för Dark Mode) */}
                    <div className="bg-white dark:bg-[#182032] rounded-xl shadow-sm dark:shadow-md border border-zinc-200 dark:border-white/5 overflow-hidden flex flex-col flex-1 min-h-[500px] transition-colors">
                        <div className="flex-1 overflow-auto">
                            <table className="w-full text-left border-collapse">
                                <thead className="bg-zinc-50 dark:bg-[#182032] border-b border-zinc-200 dark:border-white/5 text-zinc-500 dark:text-zinc-400 text-[11px] uppercase tracking-wider font-semibold sticky top-0 z-10">
                                    <tr>
                                        <th className="pl-6 pr-4 py-4 w-[25%]">Kund</th>
                                        <th className="px-4 py-4 w-[15%]">Uppdrag</th>
                                        <th className="px-4 py-4 w-[15%]">Fordon</th>
                                        <th className="px-4 py-4 w-[15%]">Datum</th>
                                        <th className="px-4 py-4 w-[15%]">Status</th>
                                        <th className="px-4 py-4 w-[15%] text-right">Belopp</th>
                                        <th className="pl-4 pr-6 py-4 w-[10%] text-right"></th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-zinc-100 dark:divide-white/5">
                                    {visibleJobs.map((job, index) => {
                                        const dateText = formatDate(job.datum);
                                        const isUrgent = ['IDAG', 'IMORGON'].includes(dateText) && job.status !== 'KLAR';
                                        const regDisplay = job.regnr || job.bilmodell || '-';
                                        const isReg = regDisplay.length <= 8 && /\d/.test(regDisplay);
                                        const initials = job.kundnamn ? job.kundnamn.split(' ').map(n => n[0]).join('').substring(0,2).toUpperCase() : '??';
                                        const avatarTheme = getAvatarTheme(job.kundnamn);

                                        return (
                                            <tr key={job.id} onClick={() => job.regnr ? handleOpenHistory(job.regnr, job.id) : null} className={`group transition-all duration-200 cursor-pointer relative bg-white dark:bg-transparent hover:bg-orange-50 dark:hover:bg-[#1f2940] active:scale-[0.995] active:bg-orange-100 dark:active:bg-[#25324d] border-b border-zinc-100 dark:border-white/5 last:border-0`}>
                                                <td className="pl-6 pr-4 py-4 align-middle">
                                                    <div className="flex items-center gap-3">
                                                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-[11px] font-bold shrink-0 border ${avatarTheme}`}>
                                                            {initials}
                                                        </div>
                                                        <div>
                                                            <div className="text-[14px] font-medium text-zinc-900 dark:text-zinc-100 leading-none mb-1">{job.kundnamn}</div>
                                                            <div className="flex items-center gap-2">
                                                                <span className="text-[10px] font-mono text-zinc-500 dark:text-zinc-400">#{job.id.substring(0,6)}</span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-4 py-4 align-middle">
                                                    <div className="flex flex-col min-w-0">
                                                        <span className="text-[12px] font-medium text-zinc-800 dark:text-zinc-300">{job.paket || 'Standard'}</span>
                                                        {job.kommentar && (
                                                            <div className="flex items-center gap-1 text-[11px] text-zinc-500 dark:text-zinc-400 mt-1 italic truncate max-w-[120px]">
                                                                <window.Icon name="message-square" size={10} className="shrink-0" />
                                                                <span className="truncate">{job.kommentar}</span>
                                                            </div>
                                                        )}
                                                    </div>
                                                </td>
                                                <td className="px-4 py-4 align-middle">
                                                    <div onClick={(e) => { e.stopPropagation(); if(job.regnr) setHistoryTarget({ regnr: job.regnr, highlightId: job.id }); }} className={`inline-flex items-stretch rounded-[3px] border overflow-hidden w-[100px] h-[28px] ${isReg ? 'bg-white dark:bg-[#1a2235] border-zinc-300 dark:border-[#2a3441] hover:border-orange-400 dark:hover:border-orange-400' : 'bg-white dark:bg-[#1a2235] border-zinc-300 dark:border-[#2a3441]'} transition-colors`}>
                                                        {isReg ? (
                                                            <>
                                                                <div className="w-[14px] bg-[#003399] flex flex-col items-center justify-between py-[2px] shrink-0 border-r border-zinc-200 dark:border-[#2a3441]">
                                                                    <div className="w-2 h-2 rounded-full border-[1px] border-[#ffcc00] mt-[1px]"></div>
                                                                    <span className="text-[9px] font-sans font-black text-white leading-none antialiased mb-[1px]">S</span>
                                                                </div>
                                                                <div className="flex-1 flex items-center justify-center">
                                                                    <span className="font-mono font-black text-[13px] text-zinc-900 dark:text-zinc-300 tracking-widest leading-none pt-[2px]">{regDisplay}</span>
                                                                </div>
                                                            </>
                                                        ) : (
                                                            <div className="flex-1 flex items-center justify-center px-1">
                                                                <span className="font-mono font-black text-[11px] text-zinc-900 dark:text-zinc-300 tracking-widest uppercase truncate leading-none pt-[2px]">{regDisplay}</span>
                                                            </div>
                                                        )}
                                                    </div>
                                                </td>
                                                <td className="px-4 py-4 align-middle">
                                                    {job.datum ? (
                                                        <div className="flex items-center gap-2">
                                                            {isUrgent && (
                                                                <span className="relative flex h-2 w-2 shrink-0">
                                                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-orange-400 opacity-75"></span>
                                                                    <span className="relative inline-flex rounded-full h-2 w-2 bg-orange-500"></span>
                                                                </span>
                                                            )}
                                                            <div>
                                                                <div className={`text-[12px] font-semibold ${isUrgent ? 'text-orange-600' : 'text-zinc-800 dark:text-zinc-300'}`}>{dateText}</div>
                                                                <div className="text-[10px] font-mono text-zinc-400 dark:text-zinc-500">{job.datum.split('T')[1]}</div>
                                                            </div>
                                                        </div>
                                                    ) : <span className="text-[10px] font-bold text-zinc-300 dark:text-zinc-600 uppercase">Inväntar</span>}
                                                </td>
                                                <td className="px-4 py-4 align-middle">
                                                    <window.Badge status={job.status} />
                                                </td>
                                                <td className="px-4 py-4 align-middle text-right">
                                                    <div className="flex flex-col items-end">
                                                        <div className="font-mono font-bold text-[15px] text-zinc-900 dark:text-zinc-100 leading-none">
                                                            {(parseInt(job.kundpris) || 0).toLocaleString()} <span className="text-[9px] text-zinc-400 dark:text-zinc-500 font-sans tracking-normal">kr</span>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="pl-4 pr-6 py-4 align-middle text-right">
                                                    <div className="opacity-0 group-hover:opacity-100 translate-x-2 group-hover:translate-x-0 transition-all duration-300 flex justify-end items-center gap-2">
                                                        {job.status !== 'KLAR' && (
                                                            <button onClick={(e) => { e.stopPropagation(); window.db.collection("jobs").doc(job.id).update({status: 'KLAR'}); }} className="w-8 h-8 flex items-center justify-center rounded-sm bg-white dark:bg-[#1a2235] border border-zinc-200 dark:border-[#2a3441] text-zinc-400 dark:text-zinc-500 hover:text-emerald-600 dark:hover:text-emerald-400 transition-all">
                                                                <window.Icon name="check" size={14} />
                                                            </button>
                                                        )}
                                                        <button onClick={(e) => { e.stopPropagation(); setView('NEW_JOB', { job: job }); }} className="w-8 h-8 flex items-center justify-center rounded-sm bg-white dark:bg-[#1a2235] border border-zinc-200 dark:border-[#2a3441] text-zinc-400 dark:text-zinc-500 hover:text-blue-600 dark:hover:text-blue-400 transition-all"><window.Icon name="edit-2" size={14} /></button>
                                                        <button onClick={(e) => { e.stopPropagation(); if(confirm("Radera?")) window.db.collection("jobs").doc(job.id).update({deleted:true}); }} className="w-8 h-8 flex items-center justify-center rounded-sm bg-white dark:bg-[#1a2235] border border-zinc-200 dark:border-[#2a3441] text-zinc-400 dark:text-zinc-500 hover:text-red-600 dark:hover:text-red-400 transition-all"><window.Icon name="trash" size={14} /></button>
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                            
                            {/* KNAPP FÖR ATT VISA FLER (DESKTOP) */}
                            {hasMore && (
                                <div className="flex justify-center p-6 border-t border-zinc-200 dark:border-white/5">
                                    <button onClick={() => setVisibleCount(prev => prev + 20)} className="px-6 py-2.5 bg-zinc-100 dark:bg-[#1f2940] hover:bg-zinc-200 dark:hover:bg-[#25324d] text-zinc-700 dark:text-zinc-300 text-[11px] font-bold uppercase tracking-widest rounded-md transition-colors">
                                        Visa fler ({filteredJobs.length - visibleCount} kvar)
                                    </button>
                                </div>
                            )}

                        </div>
                    </div>
                </div>
            </div>

            {/* --- MOBILE VY (RENSAD BMG HEADER & TONAD DESIGN) --- */}
            <div
                className="lg:hidden flex flex-col min-h-screen bg-transparent touch-pan-y transition-colors duration-300"
                onTouchStart={onTouchStart} onTouchEnd={onTouchEnd}
            >
                <div className="bg-zinc-950 dark:bg-[#121826] text-white pt-safe-top sticky top-0 z-40 shadow-md dark:border-b dark:border-[#1a2235] transition-colors duration-300">
                    <div className="px-4 py-5 flex items-center justify-between border-b border-zinc-800 dark:border-[#1a2235]">
                        
                        {/* NY LOGGA OCH TITEL */}
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-orange-500 rounded-[4px] flex items-center justify-center text-black font-bold shadow-[0_0_15px_rgba(249,115,22,0.3)]">
                                <window.Icon name="grid" size={20} />
                            </div>
                            <div className="flex flex-col">
                                <span className="text-lg font-black uppercase tracking-tighter leading-none mb-1 text-white">
                                    DASHBOARD <span className="text-zinc-400 dark:text-zinc-500">OVERVIEW</span>
                                </span>
                                <span className="text-[9px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-widest">{getHeaderDate()}</span>
                            </div>
                        </div>

                        <button onClick={() => setSearchOpen(!searchOpen)} className="text-zinc-400 dark:text-zinc-500 hover:text-white transition-colors">
                            <window.Icon name={searchOpen ? "x" : "search"} size={22} />
                        </button>
                    </div>

                    {/* SÖKFÄLT */}
                    {searchOpen && (
                        <div className="px-4 py-4 border-b border-zinc-800 dark:border-[#1a2235] animate-in slide-in-from-top-2">
                            <input autoFocus type="text" value={globalSearch} onChange={e => setGlobalSearch(e.target.value)} placeholder="SÖK UPPDRAG, REGNR..." className="w-full h-11 bg-zinc-900 dark:bg-[#1a2235] text-white rounded-[4px] px-4 text-[12px] font-bold uppercase focus:outline-none focus:border-orange-500 border border-zinc-800 dark:border-[#2a3441]" />
                        </div>
                    )}

                    {/* DINA FILTER-TABS (Intakta!) */}
                    <div
                        ref={tabsRef}
                        className="flex overflow-x-auto px-4 pt-2 space-x-3 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]"
                        onTouchStart={(e) => e.stopPropagation()}
                        onTouchMove={(e) => e.stopPropagation()}
                        onTouchEnd={(e) => e.stopPropagation()}
                    >
                        {filters.map(f => {
                            const isActive = activeFilter === f;
                            const count = statusCounts[f] || 0;
                            return (
                                <button key={f} data-tab={f} onClick={() => setActiveFilter(f)} className={`py-3 px-1 text-[10px] font-bold uppercase tracking-wider transition-all border-b-2 whitespace-nowrap ${isActive ? 'text-orange-500 border-orange-500' : 'text-zinc-400 dark:text-zinc-500 border-transparent hover:text-zinc-300 dark:hover:text-zinc-300'}`}>
                                    {f}
                                    {count > 0 && <span className={`ml-1.5 px-1.5 py-0.5 rounded-full text-[8px] ${isActive ? 'bg-orange-500/20 text-orange-500' : 'bg-zinc-800 dark:bg-[#2a3441] text-zinc-500'}`}>{count}</span>}
                                </button>
                            );
                        })}
                    </div>
                </div>

                {/* KORTEN MED DATUM-GRUPPERING */}
                <div className="px-3 py-3 pb-24 flex flex-col gap-2">
                    {filteredJobs.length > 0 ? (
                        <>
                            {(() => {
                                let lastDate = null;
                                return visibleJobs.map((job) => {
                                // Kolla vilket datum jobbet har (eller om det väntar)
                                const currentDate = job.datum ? formatDate(job.datum) : 'INVÄNTAR DATUM';
                                const showHeader = currentDate !== lastDate;
                                lastDate = currentDate;

                                return (
                                    <React.Fragment key={job.id}>
                                        {showHeader && (
                                            <div className="mt-5 mb-1 px-2 first:mt-1 flex items-center gap-2">
                                                <window.Icon name={job.datum ? "calendar" : "clock"} size={12} className="text-orange-500" />
                                                <h3 className="text-[11px] font-black text-zinc-500 dark:text-zinc-400 uppercase tracking-[0.15em]">
                                                    {currentDate}
                                                </h3>
                                            </div>
                                        )}
                                        <MobileJobCard job={job} setView={setView} onOpenHistory={handleOpenHistory} />
                                    </React.Fragment>
                                );
                            });
                        })()}
                        
                        {/* KNAPP FÖR ATT VISA FLER (MOBIL) */}
                        {hasMore && (
                            <div className="mt-4 px-1">
                                <button onClick={() => setVisibleCount(prev => prev + 20)} className="w-full py-4 bg-white dark:bg-[#182032] border border-zinc-200 dark:border-white/5 text-zinc-700 dark:text-zinc-300 text-[11px] font-bold uppercase tracking-widest rounded-xl shadow-sm active:scale-95 transition-all">
                                    Visa fler ({filteredJobs.length - visibleCount} kvar)
                                </button>
                            </div>
                        )}
                    </>
                ) : (
                    <div className="flex flex-col items-center justify-center py-20 text-zinc-400 dark:text-zinc-600">
                            <window.Icon name="inbox" size={32} className="mb-2 opacity-50" />
                            <span className="text-[10px] font-black uppercase tracking-widest">Inga jobb här</span>
                        </div>
                    )}
                </div>
            </div>

            {/* MODUL: History */}
            {historyTarget && window.VehicleProfileLoader && (
                <window.VehicleProfileLoader
                    regnr={historyTarget.regnr}
                    highlightId={historyTarget.highlightId}
                    onClose={() => setHistoryTarget(null)}
                    setView={setView}
                />
            )}
        </div>
    );
}, dashboardPropsAreEqual);
