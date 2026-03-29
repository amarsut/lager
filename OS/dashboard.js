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
        <span className={`pl-1.5 pr-2 py-1 text-[9px] font-bold uppercase tracking-wider inline-flex items-center gap-1.5 rounded-md border ${style.bg} ${style.text} ${style.border}`}>
            <span className={`w-1.5 h-1.5 rounded-full ${style.dot}`}></span>
            {s}
        </span>
    );
});

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
    
    // ENHETLIGT TEMA ISTÄLLET FÖR REGNBÅGE
    const avatarTheme = 'bg-zinc-100 text-zinc-600 border-zinc-200 dark:bg-[#1a2235] dark:text-zinc-400 dark:border-[#2a3441]';

    return (
        <div
            onClick={() => job.regnr ? onOpenHistory(job.regnr, job.id) : null}
            className={`w-full relative active:bg-zinc-50 dark:active:bg-[#1a2235] transition-all border-b border-zinc-200 dark:border-[#1a2235] last:border-0 bg-white dark:bg-[#121826] group select-none 
                ${isDone ? 'opacity-70 grayscale-[0.3]' : ''}`}
        >
            <div className="pl-4 pr-4 py-4">
                <div className="flex justify-between items-start mb-3">
                    <div className="flex items-center gap-3 min-w-0 pr-2">
                        <div className={`w-10 h-10 rounded-[8px] flex items-center justify-center text-[13px] font-black tracking-widest shrink-0 border ${avatarTheme}`}>
                            {initials}
                        </div>
                        <div className="flex flex-col min-w-0">
                            <div className={`text-[15px] font-black uppercase tracking-tight truncate leading-none mb-1 ${isDone ? 'text-zinc-600 dark:text-zinc-500' : 'text-zinc-900 dark:text-white'}`}>
                                {job.kundnamn}
                            </div>
                            <div className="inline-flex items-center gap-2">
                                <span className="text-[10px] font-mono text-zinc-400 dark:text-zinc-500">#{job.id.substring(0, 6)}</span>
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center gap-2 relative z-30">
                        <window.Badge status={job.status} />
                        <div className="relative">
                            <button onClick={(e) => { e.stopPropagation(); setMenuOpen(!menuOpen); }} className="w-8 h-8 -mr-2 flex items-center justify-center text-zinc-400 hover:text-black dark:text-zinc-500 dark:hover:text-white transition-colors">
                                <window.Icon name="more-horizontal" size={20} />
                            </button>
                            {menuOpen && (
                                <>
                                    <div className="fixed inset-0 z-40 cursor-default" onClick={(e) => { e.stopPropagation(); setMenuOpen(false); }}></div>
                                    <div className="absolute right-0 top-full mt-1 w-48 bg-white dark:bg-[#1a2235] rounded-lg shadow-xl dark:shadow-2xl border border-zinc-200 dark:border-[#2a3441] z-50 py-1 overflow-hidden animate-in fade-in zoom-in-95 duration-100 origin-top-right">
                                        {job.status !== 'KLAR' && (
                                            <button onClick={(e) => { e.stopPropagation(); window.db.collection("jobs").doc(job.id).update({ status: 'KLAR' }); setMenuOpen(false); }} className="w-full text-left px-4 py-3 text-[13px] font-bold uppercase tracking-wide text-zinc-600 dark:text-zinc-300 hover:bg-emerald-50 dark:hover:bg-[#252f48] hover:text-emerald-700 dark:hover:text-emerald-400 flex items-center gap-3 border-b border-zinc-50 dark:border-zinc-800">
                                                <window.Icon name="check" size={16} className="text-emerald-500" /> Markera klar
                                            </button>
                                        )}
                                        <button onClick={(e) => { e.stopPropagation(); setView('NEW_JOB', { job: job }); setMenuOpen(false); }} className="w-full text-left px-4 py-3 text-[13px] font-bold uppercase tracking-wide text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-[#252f48] flex items-center gap-3 border-b border-zinc-50 dark:border-zinc-800">
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

                <div className="border border-zinc-200 dark:border-[#1a2235] rounded-md bg-[#fafafa] dark:bg-[#0a0f18] py-2.5 px-3 mb-2">
                    <div className="grid grid-cols-2 gap-4 divide-x divide-zinc-200 dark:divide-[#1a2235] relative">
                        {/* FORDON - Dämpad registreringsskylt i dark mode */}
                        <div className="flex flex-col pr-2">
                            <span className="text-[9px] text-zinc-400 dark:text-zinc-500 font-bold uppercase tracking-widest mb-1.5 flex items-center gap-1"><window.Icon name="truck" size={12}/> Fordon</span>
                            <div 
                                onClick={(e) => { if (isReg && job.regnr && onOpenHistory) { e.stopPropagation(); onOpenHistory(job.regnr); } }}
                                className={`inline-flex items-stretch rounded-[4px] border overflow-hidden h-[26px] ${isReg ? 'bg-white dark:bg-[#1a2235] border-zinc-300 dark:border-[#2a3441]' : 'bg-white dark:bg-[#1a2235] border-zinc-200 dark:border-[#2a3441]'} ${isReg && onOpenHistory ? 'cursor-pointer active:scale-95 transition-transform' : ''}`}
                            >
                                {isReg ? (
                                    <>
                                        <div className="w-[14px] bg-[#003399] flex flex-col items-center justify-between py-[1.5px] shrink-0 border-r border-zinc-200 dark:border-[#2a3441]">
                                            <div className="w-1.5 h-1.5 rounded-full border-[1px] border-[#ffcc00] mt-[1px]"></div>
                                            <span className="text-[7.5px] font-sans font-black text-white leading-none antialiased mb-[1px]">S</span>
                                        </div>
                                        <div className="flex items-center justify-center px-2 min-w-[65px]"><span className="font-mono font-black text-[12px] text-zinc-900 dark:text-zinc-300 tracking-widest leading-none pt-[1px]">{vehicleDisplay}</span></div>
                                    </>
                                ) : (
                                    <div className="flex items-center justify-center px-2.5 min-w-[79px]"><span className="font-mono font-black text-[11px] text-zinc-800 dark:text-zinc-400 tracking-widest uppercase truncate leading-none pt-[1px]">{vehicleDisplay}</span></div>
                                )}
                            </div>
                        </div>

                        {/* TID/DATUM */}
                        <div className="flex flex-col pl-4">
                            <span className="text-[9px] text-zinc-400 dark:text-zinc-500 font-bold uppercase tracking-widest mb-1.5 flex items-center gap-1">
                                <window.Icon name="clock" size={12}/> {showAsHistory ? 'Datum' : 'Tidpunkt'}
                            </span>
                            <div className="flex items-center gap-1.5">
                                {job.datum ? (
                                    <div className="flex items-center gap-1.5">
                                        {!isDone && isUrgentDate && (
                                            <span className="relative flex h-2 w-2 shrink-0">
                                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-orange-400 opacity-75"></span>
                                                <span className="relative inline-flex rounded-full h-2 w-2 bg-orange-500"></span>
                                            </span>
                                        )}
                                        <div className="flex flex-col">
                                            <span className={`text-[12px] font-black uppercase leading-none mb-1 ${!isDone && isUrgentDate ? 'text-orange-600' : 'text-zinc-800 dark:text-zinc-200'}`}>
                                                {showAsHistory ? dateString : job.datum.split('T')[1]}
                                            </span>
                                            <span className="text-[10px] font-mono text-zinc-400 dark:text-zinc-500 leading-none">
                                                {showAsHistory ? job.datum.split('T')[1] : dateString}
                                            </span>
                                        </div>
                                    </div>
                                ) : (
                                    <span className="text-[11px] font-bold text-red-500">Inväntar</span>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {/* --- RAD 3: KOMMENTAR & PRIS --- */}
                <div className="flex items-end pt-1 min-h-[24px]">
                    <div className="flex-1 min-w-0 mr-2">
                        <span className="text-[11px] font-black uppercase text-zinc-800 dark:text-zinc-300 tracking-tight block mb-1">{job.paket || 'Standard'}</span>
                        {job.kommentar && (
                            <div className="flex items-start gap-1.5 text-zinc-500 dark:text-zinc-400">
                                <window.Icon name="message-square" size={12} className="text-zinc-400 dark:text-zinc-500 shrink-0 mt-[2px]" />
                                <span className="text-[11px] italic font-medium leading-tight line-clamp-2">
                                    {job.kommentar}
                                </span>
                            </div>
                        )}
                    </div>
                    <div className="ml-auto flex flex-col items-end shrink-0 text-right">
                        {price > 0 ? (
                            <div className="flex items-baseline justify-end w-full">
                                <div className={`text-[18px] font-mono font-black leading-none tracking-tight ${isDone ? 'text-zinc-700 dark:text-zinc-500' : 'text-zinc-900 dark:text-white'}`}>
                                    {price.toLocaleString('sv-SE')}
                                </div>
                                <span className="text-[9px] text-zinc-400 dark:text-zinc-500 font-sans ml-1 translate-y-[-1px]">kr</span>
                            </div>
                        ) : (
                            <span className="text-[10px] font-bold text-zinc-300 dark:text-zinc-600 uppercase tracking-wide">Ej prissatt</span>
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
            <button onClick={() => setActiveFilter(label)} className={`px-4 py-2 text-[11px] font-bold uppercase tracking-wider transition-all rounded-t-[4px] border-t-2 ${isActive ? 'bg-white dark:bg-[#121826] text-black dark:text-white border-orange-500 shadow-[0_-5px_10px_rgba(0,0,0,0.02)] dark:shadow-none' : 'bg-transparent text-zinc-400 dark:text-zinc-500 border-transparent hover:text-zinc-600 dark:hover:text-zinc-300 hover:bg-zinc-200/50 dark:hover:bg-[#1a2235]/50'}`}>
                {label}
                {count > 0 && <span className={`ml-2 text-[9px] ${isActive ? 'text-orange-600 dark:text-orange-500' : 'text-zinc-400 dark:text-zinc-600'}`}>({count})</span>}
            </button>
        );
    };

    return (
        <div className="flex flex-col min-h-screen bg-transparent font-sans text-zinc-900 dark:text-white pb-20 lg:pb-0 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none] transition-colors duration-300">

            {/* --- DESKTOP VY --- */}
            <div className="hidden lg:flex flex-col h-full px-8 py-6">
                
                {/* REN BMG HEADER MED TYDLIG LINJE & ORGINAL-LOGGA */}
                <div className="flex justify-between items-center mb-6 pb-6 border-b border-zinc-200 dark:border-[#1a2235]">
                    
                    {/* LOGGA OCH TITEL */}
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-orange-500 rounded-[4px] flex items-center justify-center text-black font-bold shadow-[0_0_20px_rgba(249,115,22,0.3)]">
                            <window.Icon name="grid" size={24} />
                        </div>
                        <div className="flex flex-col">
                            <h1 className="text-4xl md:text-5xl font-black text-black dark:text-white uppercase tracking-tighter leading-none drop-shadow-sm dark:drop-shadow-none">
                                Dash<span className="text-zinc-400 dark:text-zinc-600">board</span>
                            </h1>
                            <p className="text-[11px] font-bold text-zinc-500 uppercase tracking-widest mt-1.5">Översikt & Operationell Status</p>
                        </div>
                    </div>

                    {/* SÖK OCH NYTT JOBB */}
                    <div className="flex items-center gap-4">
                        <div className="relative group shadow-sm dark:shadow-none">
                            <input type="text" value={globalSearch} onChange={e => setGlobalSearch(e.target.value)} placeholder="SÖK..." className="w-64 bg-white dark:bg-[#121826] border border-zinc-200 dark:border-[#1a2235] text-black dark:text-white text-[12px] font-bold py-3 pl-4 pr-10 uppercase rounded-[4px] focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 transition-colors" />
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
                    <div className="bg-white dark:bg-[#121826] rounded-sm border border-zinc-200 dark:border-[#1a2235] p-5 shadow-sm dark:shadow-none relative overflow-hidden transition-colors">
                        <window.Icon name="check-circle" size={80} className="absolute -right-6 -bottom-6 text-zinc-100 dark:text-[#1a2235] transition-colors" />
                        <div className="relative z-10">
                            <div className="text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-widest mb-1">Utförda (30d)</div>
                            <div className="text-[28px] font-black tracking-tight text-zinc-900 dark:text-white leading-none">{stats30Days} <span className="text-[14px] text-zinc-400 dark:text-zinc-600 font-medium">st</span></div>
                        </div>
                    </div>

                    <div className="bg-white dark:bg-[#121826] rounded-sm border border-zinc-200 dark:border-[#1a2235] p-5 shadow-sm dark:shadow-none relative overflow-hidden transition-colors">
                        <window.Icon name="calendar" size={80} className="absolute -right-6 -bottom-6 text-zinc-100 dark:text-[#1a2235] transition-colors" />
                        <div className="relative z-10">
                            <div className="text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-widest mb-1">Kommande (7d)</div>
                            <div className="text-[28px] font-black tracking-tight text-zinc-900 dark:text-white leading-none">{statsNext7Days} <span className="text-[14px] text-zinc-400 dark:text-zinc-600 font-medium">st</span></div>
                        </div>
                    </div>

                    <div className="bg-white dark:bg-[#121826] rounded-sm border border-zinc-200 dark:border-[#1a2235] p-5 shadow-sm dark:shadow-none relative overflow-hidden transition-colors">
                        <window.Icon name="alert-triangle" size={80} className="absolute -right-6 -bottom-6 text-zinc-100 dark:text-[#1a2235] transition-colors" />
                        <div className="relative z-10">
                            <div className="text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-widest mb-1">Prioritet</div>
                            <div className={`text-[28px] font-black tracking-tight leading-none ${urgentCount > 0 ? 'text-orange-500' : 'text-zinc-900 dark:text-white'}`}>
                                {urgentCount} <span className="text-[14px] text-zinc-400 dark:text-zinc-600 font-medium">st</span>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="flex flex-col flex-1">
                    <div className="flex px-2 space-x-1">{filters.map(f => <TabButton key={f} label={f} />)}</div>

                    {/* TABELLEN (Anpassad för Dark Mode) */}
                    <div className="bg-white dark:bg-[#121826] rounded-sm shadow-sm dark:shadow-none border border-zinc-200 dark:border-[#1a2235] overflow-hidden flex flex-col flex-1 min-h-[500px] transition-colors">
                        <div className="flex-1 overflow-auto">
                            <table className="w-full text-left border-collapse">
                                <thead className="bg-zinc-50 dark:bg-[#1a2235] border-b border-zinc-200 dark:border-[#2a3441] text-zinc-500 dark:text-zinc-400 text-[10px] uppercase tracking-widest font-bold sticky top-0 z-10">
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
                                <tbody className="divide-y divide-zinc-100 dark:divide-[#1a2235]">
                                    {filteredJobs.map((job, index) => {
                                        const dateText = formatDate(job.datum);
                                        const isUrgent = ['IDAG', 'IMORGON'].includes(dateText) && job.status !== 'KLAR';
                                        const regDisplay = job.regnr || job.bilmodell || '-';
                                        const isReg = regDisplay.length <= 8 && /\d/.test(regDisplay);
                                        const initials = job.kundnamn ? job.kundnamn.split(' ').map(n => n[0]).join('').substring(0,2).toUpperCase() : '??';
                                        
                                        // Enhetlig Avatar i Tabellen
                                        const avatarTheme = 'bg-zinc-100 text-zinc-600 border-zinc-200 dark:bg-[#1a2235] dark:text-zinc-400 dark:border-[#2a3441]';

                                        return (
                                            <tr key={job.id} onClick={() => job.regnr ? handleOpenHistory(job.regnr, job.id) : null} className={`group transition-all cursor-pointer relative ${index % 2 === 0 ? 'bg-white dark:bg-[#121826]' : 'bg-zinc-50/40 dark:bg-[#1a2235]/40'} hover:bg-orange-50/40 dark:hover:bg-[#1a2235] hover:shadow-[0_4px_15px_-4px_rgba(249,115,22,0.15)] dark:hover:shadow-none hover:z-10 hover:-translate-y-[1px] border-b border-zinc-100 dark:border-[#1a2235] last:border-0`}>
                                                <td className="pl-6 pr-4 py-4 align-middle">
                                                    <div className="flex items-center gap-3">
                                                        <div className={`w-8 h-8 rounded-sm flex items-center justify-center text-[10px] font-black tracking-widest shrink-0 border ${avatarTheme}`}>
                                                            {initials}
                                                        </div>
                                                        <div>
                                                            <div className="text-[13px] font-black text-zinc-900 dark:text-white leading-none mb-1 uppercase tracking-tight">{job.kundnamn}</div>
                                                            <div className="flex items-center gap-2">
                                                                <span className="text-[9px] font-mono text-zinc-400 dark:text-zinc-500">#{job.id.substring(0,6)}</span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-4 py-4 align-middle">
                                                    <div className="flex flex-col min-w-0">
                                                        <span className="text-[11px] font-black uppercase text-zinc-800 dark:text-zinc-300 tracking-tight">{job.paket || 'Standard'}</span>
                                                        {job.kommentar && (
                                                            <div className="flex items-center gap-1 text-[10px] text-zinc-400 dark:text-zinc-500 mt-1 italic truncate max-w-[120px]">
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
                                                                <div className={`text-[11px] font-black uppercase ${isUrgent ? 'text-orange-600' : 'text-zinc-800 dark:text-zinc-300'}`}>{dateText}</div>
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
                                                        <div className="font-mono font-black text-[14px] text-zinc-900 dark:text-white tracking-tight leading-none">
                                                            {(parseInt(job.kundpris) || 0).toLocaleString()} <span className="text-[9px] text-zinc-400 dark:text-zinc-500 font-sans tracking-normal">kr</span>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="pl-4 pr-6 py-4 align-middle text-right">
                                                    <div className="opacity-0 group-hover:opacity-100 transition-opacity flex justify-end items-center gap-2">
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
                                <span className="text-xl font-black uppercase tracking-tighter leading-none mb-1 text-white">
                                    Mission <span className="text-zinc-500">Control</span>
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

                {/* KORTEN */}
                <div className="px-3 py-3 pb-24 flex flex-col gap-2">
                    {filteredJobs.length > 0 ? (
                        filteredJobs.map((job) => (
                            <MobileJobCard key={job.id} job={job} setView={setView} onOpenHistory={handleOpenHistory} />
                        ))
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
