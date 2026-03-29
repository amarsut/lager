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
        'BOKAD': { bg: 'bg-orange-50', text: 'text-orange-700', border: 'border-orange-200/60', dot: 'bg-orange-500' },
        'OFFERERAD': { bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200/60', dot: 'bg-blue-500' },
        'KLAR': { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200/60', dot: 'bg-emerald-500' },
        'FAKTURERAS': { bg: 'bg-zinc-100', text: 'text-zinc-600', border: 'border-zinc-200', dot: 'bg-zinc-400' },
    };

    const style = config[s] || config['BOKAD'];

    return (
        <span className={`pl-1.5 pr-2 py-1 text-[9px] font-bold uppercase tracking-wider inline-flex items-center gap-1.5 rounded-md border ${style.bg} ${style.text} ${style.border}`}>
            <span className={`w-1.5 h-1.5 rounded-full ${style.dot}`}></span>
            {s}
        </span>
    );
});

// 3. MOBILKORTET (Uppgraderad med Avatarer & Nya Skyltar)
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

    // FÄRGKODAD AVATAR
    const initials = job.kundnamn ? job.kundnamn.split(' ').map(n => n[0]).join('').substring(0,2).toUpperCase() : '??';
    const avatarColors = ['bg-blue-50 text-blue-600 border-blue-200', 'bg-emerald-50 text-emerald-600 border-emerald-200', 'bg-purple-50 text-purple-600 border-purple-200', 'bg-pink-50 text-pink-600 border-pink-200', 'bg-cyan-50 text-cyan-600 border-cyan-200', 'bg-indigo-50 text-indigo-600 border-indigo-200'];
    const charCode = job.kundnamn ? job.kundnamn.charCodeAt(0) + job.kundnamn.length : 0;
    const avatarTheme = avatarColors[charCode % avatarColors.length];

    return (
        <div
            onClick={() => job.regnr ? onOpenHistory(job.regnr, job.id) : null}
            className={`w-full relative active:bg-zinc-50 transition-all border-b border-zinc-200 last:border-0 shadow-sm bg-white group select-none 
                ${isDone ? 'opacity-70 grayscale-[0.3]' : ''}`}
            style={isWaiting ? { backgroundImage: 'repeating-linear-gradient(45deg, #ffffff, #ffffff 10px, #f8fafc 10px, #f8fafc 20px)' } : {}}
        >
            <div className={`absolute left-0 top-0 bottom-0 w-[4px] ${isDone ? 'bg-zinc-300' : sidebarColor}`}></div>

            <div className="pl-5 pr-4 py-4">
                {/* --- RAD 1: AVATAR, NAMN & MENY --- */}
                <div className="flex justify-between items-start mb-3">
                    <div className="flex items-center gap-3 min-w-0 pr-2">
                        <div className={`w-10 h-10 rounded-[8px] flex items-center justify-center text-[13px] font-black tracking-widest shrink-0 border ${!isDone && isUrgentDate ? 'bg-orange-100 text-orange-600 border-orange-200' : avatarTheme}`}>
                            {initials}
                        </div>
                        <div className="flex flex-col min-w-0">
                            <div className={`text-[15px] font-black uppercase tracking-tight truncate leading-none mb-1 ${isDone ? 'text-zinc-600' : 'text-zinc-900'}`}>
                                {job.kundnamn}
                            </div>
                            <div className="inline-flex">
                                <span className="text-[10px] font-mono text-zinc-400">#{job.id.substring(0, 6)}</span>
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center gap-2 relative z-30">
                        <window.Badge status={job.status} />
                        <div className="relative">
                            <button onClick={(e) => { e.stopPropagation(); setMenuOpen(!menuOpen); }} className="w-8 h-8 -mr-2 flex items-center justify-center text-zinc-400 hover:text-black transition-colors">
                                <window.Icon name="more-horizontal" size={20} />
                            </button>
                            {menuOpen && (
                                <>
                                    <div className="fixed inset-0 z-40 cursor-default" onClick={(e) => { e.stopPropagation(); setMenuOpen(false); }}></div>
                                    <div className="absolute right-0 top-full mt-1 w-48 bg-white rounded-lg shadow-xl border border-zinc-200 z-50 py-1 overflow-hidden animate-in fade-in zoom-in-95 duration-100 origin-top-right">
                                        {job.status !== 'KLAR' && (
                                            <button onClick={(e) => { e.stopPropagation(); window.db.collection("jobs").doc(job.id).update({ status: 'KLAR' }); setMenuOpen(false); }} className="w-full text-left px-4 py-3 text-[13px] font-bold uppercase tracking-wide text-zinc-600 hover:bg-emerald-50 hover:text-emerald-700 flex items-center gap-3 border-b border-zinc-50">
                                                <window.Icon name="check" size={16} className="text-emerald-500" /> Markera klar
                                            </button>
                                        )}
                                        <button onClick={(e) => { e.stopPropagation(); setView('NEW_JOB', { job: job }); setMenuOpen(false); }} className="w-full text-left px-4 py-3 text-[13px] font-bold uppercase tracking-wide text-blue-600 hover:bg-blue-50 flex items-center gap-3 border-b border-zinc-50">
                                            <window.Icon name="edit-2" size={16} className="text-blue-500" /> Redigera order
                                        </button>
                                        <button onClick={(e) => { e.stopPropagation(); if (confirm("Radera ordern?")) { window.db.collection("jobs").doc(job.id).update({ deleted: true }); } setMenuOpen(false); }} className="w-full text-left px-4 py-3 text-[13px] font-bold uppercase tracking-wide text-red-600 hover:bg-red-50 flex items-center gap-3">
                                            <window.Icon name="trash-2" size={16} className="text-red-500" /> Radera order
                                        </button>
                                    </div>
                                </>
                            )}
                        </div>
                    </div>
                </div>

                {/* --- RAD 2: TECH BOX (Nya skyltarna) --- */}
                <div className="border border-zinc-200 rounded-md bg-[#fafafa] py-2.5 px-3 mb-2">
                    <div className="grid grid-cols-2 gap-4 divide-x divide-zinc-200 relative">
                        {/* FORDON */}
                        <div className="flex flex-col pr-2">
                            <span className="text-[9px] text-zinc-400 font-bold uppercase tracking-widest mb-1.5 flex items-center gap-1"><window.Icon name="truck" size={12}/> Fordon</span>
                            <div 
                                onClick={(e) => { if (isReg && job.regnr && onOpenHistory) { e.stopPropagation(); onOpenHistory(job.regnr); } }}
                                className={`inline-flex items-stretch rounded-[4px] border overflow-hidden shadow-sm h-[26px] bg-white ${isReg ? 'border-zinc-300' : 'border-zinc-200'} ${isReg && onOpenHistory ? 'cursor-pointer active:scale-95 transition-transform' : ''}`}
                            >
                                {isReg ? (
                                    <>
                                        <div className="w-[14px] bg-[#003399] flex flex-col items-center justify-between py-[1.5px] shrink-0 border-r border-zinc-200">
                                            <div className="w-1.5 h-1.5 rounded-full border-[1px] border-[#ffcc00] mt-[1px]"></div>
                                            <span className="text-[7.5px] font-sans font-black text-white leading-none antialiased mb-[1px]">S</span>
                                        </div>
                                        <div className="flex items-center justify-center px-2 min-w-[65px]"><span className="font-mono font-black text-[12px] text-zinc-900 tracking-widest leading-none pt-[1px]">{vehicleDisplay}</span></div>
                                    </>
                                ) : (
                                    <div className="flex items-center justify-center px-2.5 min-w-[79px]"><span className="font-mono font-black text-[11px] text-zinc-800 tracking-widest uppercase truncate leading-none pt-[1px]">{vehicleDisplay}</span></div>
                                )}
                            </div>
                        </div>

                        {/* TID/DATUM */}
                        <div className="flex flex-col pl-4">
                            <span className="text-[9px] text-zinc-400 font-bold uppercase tracking-widest mb-1.5 flex items-center gap-1">
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
                                            <span className={`text-[12px] font-black uppercase leading-none mb-1 ${!isDone && isUrgentDate ? 'text-orange-600' : 'text-zinc-800'}`}>
                                                {showAsHistory ? dateString : job.datum.split('T')[1]}
                                            </span>
                                            <span className="text-[10px] font-mono text-zinc-400 leading-none">
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
                        <span className="text-[11px] font-black uppercase text-zinc-800 tracking-tight block mb-1">{job.paket || 'Standard'}</span>
                        {job.kommentar && (
                            <div className="flex items-start gap-1.5 text-zinc-500">
                                <window.Icon name="message-square" size={12} className="text-zinc-400 shrink-0 mt-[2px]" />
                                <span className="text-[11px] italic font-medium leading-tight line-clamp-2 text-zinc-600">
                                    {job.kommentar}
                                </span>
                            </div>
                        )}
                    </div>
                    <div className="ml-auto flex flex-col items-end shrink-0 text-right">
                        {price > 0 ? (
                            <div className="flex items-baseline justify-end w-full">
                                <div className={`text-[18px] font-mono font-black leading-none tracking-tight ${isDone ? 'text-zinc-700' : 'text-zinc-900'}`}>
                                    {price.toLocaleString('sv-SE')}
                                </div>
                                <span className="text-[9px] text-zinc-400 font-sans ml-1 translate-y-[-1px]">kr</span>
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
    allJobs,
    filteredJobs, setEditingJob, setView,
    activeFilter, setActiveFilter, statusCounts,
    globalSearch, setGlobalSearch
}) => {
    const [searchOpen, setSearchOpen] = React.useState(!!globalSearch);
    const [historyTarget, setHistoryTarget] = React.useState(null);

    // Timer State
    const [timerActive, setTimerActive] = React.useState(false);
    const [timerSeconds, setTimerSeconds] = React.useState(0);
    const timerInterval = React.useRef(null);

    const tabsRef = React.useRef(null);
    const filters = ['ALLA', 'BOKAD', 'OFFERERAD', 'FAKTURERAS', 'KLAR'];

    // --- 2. STATISTIK ---
    const stats30Days = React.useMemo(() => {
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        return allJobs.filter(j =>
            j.status === 'KLAR' && j.datum && new Date(j.datum) >= thirtyDaysAgo && !j.deleted
        ).length;
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
    const handleOpenHistory = React.useCallback((regnr, jobId) => {
        setHistoryTarget({ regnr, highlightId: jobId });
    }, []);

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
            <button onClick={() => setActiveFilter(label)} className={`px-4 py-2 text-[11px] font-bold uppercase tracking-wider transition-all rounded-t-[4px] border-t-2 ${isActive ? 'bg-white text-black border-orange-500 shadow-[0_-5px_10px_rgba(0,0,0,0.02)]' : 'bg-transparent text-zinc-400 border-transparent hover:text-zinc-600 hover:bg-zinc-200/50'}`}>
                {label}
                {count > 0 && <span className={`ml-2 text-[9px] ${isActive ? 'text-orange-600' : 'text-zinc-400'}`}>({count})</span>}
            </button>
        );
    };

    return (
        <div className="flex flex-col min-h-screen bg-[#f4f4f5] font-sans text-zinc-900 pb-20 lg:pb-0 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">

            {/* --- DESKTOP VY --- */}
            <div className="hidden lg:flex flex-col h-full px-8 py-8">

                {/* Header */}
                <div className="flex justify-between items-end mb-8">
                    <div>
                        <div className="flex items-center gap-6 mb-2">
                            <div className="flex items-center gap-2">
                                <span className="w-2 h-2 rounded-full bg-orange-500 shadow-[0_0_10px_orange]"></span>
                                <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">System Online</span>
                            </div>
                            <div className="flex items-center gap-3">
                                <div className="flex items-center gap-1.5 text-zinc-400">
                                    <window.Icon name="cloud" size={12} />
                                    <span className="text-[10px] font-bold">16°C</span>
                                </div>
                                <div className="w-[1px] h-3 bg-zinc-300"></div>
                                <div className="flex items-center gap-2">
                                    <button onClick={() => setTimerActive(!timerActive)} className={`w-4 h-4 flex items-center justify-center rounded-[2px] ${timerActive ? 'bg-red-500 text-white' : 'bg-green-500 text-white'}`}>
                                        <window.Icon name={timerActive ? "square" : "play"} size={8} fill="currentColor" />
                                    </button>
                                    <span className="text-[11px] font-mono font-bold text-zinc-600 w-[32px]">{formatTimer(timerSeconds)}</span>
                                    <button onClick={() => { setTimerActive(false); setTimerSeconds(0); }} className="text-zinc-400 hover:text-black"><window.Icon name="rotate-ccw" size={10} /></button>
                                </div>
                            </div>
                        </div>

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

                {/* Desktop Stats */}
                <div className="grid grid-cols-3 gap-4 mb-6">
                    <div className="bg-white rounded-sm border border-zinc-200 p-5 shadow-sm relative overflow-hidden group hover:border-zinc-300 transition-colors">
                        <window.Icon name="check-circle" size={80} className="absolute -right-6 -bottom-6 text-zinc-100 group-hover:text-emerald-50 transition-colors" />
                        <div className="relative z-10">
                            <div className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-1">Utförda (30d)</div>
                            <div className="text-[28px] font-black tracking-tight text-zinc-900 leading-none">{stats30Days} <span className="text-[14px] text-zinc-400 font-medium">st</span></div>
                        </div>
                    </div>

                    <div className="bg-white rounded-sm border border-zinc-200 p-5 shadow-sm relative overflow-hidden group hover:border-zinc-300 transition-colors">
                        <window.Icon name="calendar" size={80} className="absolute -right-6 -bottom-6 text-zinc-100 group-hover:text-blue-50 transition-colors" />
                        <div className="relative z-10">
                            <div className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-1">Kommande (7d)</div>
                            <div className="text-[28px] font-black tracking-tight text-zinc-900 leading-none">{statsNext7Days} <span className="text-[14px] text-zinc-400 font-medium">st</span></div>
                        </div>
                    </div>

                    <div className="bg-white rounded-sm border border-zinc-200 border-l-4 border-l-orange-500 p-5 shadow-sm relative overflow-hidden group hover:border-orange-200 transition-colors">
                        <window.Icon name="alert-triangle" size={80} className="absolute -right-6 -bottom-6 text-zinc-100 group-hover:text-orange-50 transition-colors" />
                        <div className="relative z-10">
                            <div className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-1">Prioritet</div>
                            <div className={`text-[28px] font-black tracking-tight leading-none ${urgentCount > 0 ? 'text-orange-500' : 'text-zinc-900'}`}>
                                {urgentCount} <span className="text-[14px] text-zinc-400 font-medium">st</span>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="flex flex-col flex-1">
                    <div className="flex px-2 space-x-1">{filters.map(f => <TabButton key={f} label={f} />)}</div>

                    {/* TABELLEN (Fixad med tbody) */}
                    <div className="bg-white rounded-sm shadow-sm border border-zinc-200 overflow-hidden flex flex-col flex-1 min-h-[500px]">
                        <div className="flex-1 overflow-auto">
                            <table className="w-full text-left border-collapse">
                                <thead className="bg-zinc-50 border-b border-zinc-200 text-zinc-500 text-[10px] uppercase tracking-widest font-bold sticky top-0 z-10">
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
                                <tbody className="divide-y divide-zinc-100">
                                    {filteredJobs.map((job, index) => {
                                        const dateText = formatDate(job.datum);
                                        const isUrgent = ['IDAG', 'IMORGON'].includes(dateText) && job.status !== 'KLAR';
                                        const regDisplay = job.regnr || job.bilmodell || '-';
                                        const isReg = regDisplay.length <= 8 && /\d/.test(regDisplay);
                                        
                                        const initials = job.kundnamn ? job.kundnamn.split(' ').map(n => n[0]).join('').substring(0,2).toUpperCase() : '??';
                                        const avatarColors = ['bg-blue-50 text-blue-600 border-blue-200', 'bg-emerald-50 text-emerald-600 border-emerald-200', 'bg-purple-50 text-purple-600 border-purple-200', 'bg-pink-50 text-pink-600 border-pink-200', 'bg-cyan-50 text-cyan-600 border-cyan-200', 'bg-indigo-50 text-indigo-600 border-indigo-200'];
                                        const charCode = job.kundnamn ? job.kundnamn.charCodeAt(0) + job.kundnamn.length : 0;
                                        const avatarTheme = avatarColors[charCode % avatarColors.length];

                                        return (
                                            <tr key={job.id} onClick={() => job.regnr ? handleOpenHistory(job.regnr, job.id) : null} className={`group transition-all cursor-pointer relative ${index % 2 === 0 ? 'bg-white' : 'bg-zinc-50/40'} hover:bg-orange-50/40 hover:shadow-[0_4px_15px_-4px_rgba(249,115,22,0.15)] hover:z-10 hover:-translate-y-[1px] border-b border-zinc-100 last:border-0`}>
                                                <td className="pl-6 pr-4 py-4 align-middle">
                                                    <div className="flex items-center gap-3">
                                                        <div className={`w-8 h-8 rounded-sm flex items-center justify-center text-[10px] font-black tracking-widest shrink-0 border ${isUrgent ? 'bg-orange-100 text-orange-600 border-orange-200' : avatarTheme + ' group-hover:bg-orange-500 group-hover:text-black group-hover:border-transparent transition-colors'}`}>
                                                            {initials}
                                                        </div>
                                                        <div>
                                                            <div className="text-[13px] font-black text-zinc-900 leading-none mb-1 uppercase tracking-tight">{job.kundnamn}</div>
                                                            <div className="flex items-center gap-2">
                                                                <span className="text-[9px] font-mono text-zinc-400">#{job.id.substring(0,6)}</span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-4 py-4 align-middle">
                                                    <div className="flex flex-col min-w-0">
                                                        <span className="text-[11px] font-black uppercase text-zinc-800 tracking-tight">{job.paket || 'Standard'}</span>
                                                        {job.kommentar && (
                                                            <div className="flex items-center gap-1 text-[10px] text-zinc-400 mt-1 italic truncate max-w-[120px]">
                                                                <window.Icon name="message-square" size={10} className="shrink-0" />
                                                                <span className="truncate">{job.kommentar}</span>
                                                            </div>
                                                        )}
                                                    </div>
                                                </td>
                                                <td className="px-4 py-4 align-middle">
                                                    <div onClick={(e) => { e.stopPropagation(); if(job.regnr) setHistoryTarget({ regnr: job.regnr, highlightId: job.id }); }} className={`inline-flex items-stretch rounded-[3px] border overflow-hidden transition-transform hover:-translate-y-0.5 cursor-pointer shadow-sm w-[100px] h-[28px] bg-white ${isReg ? 'border-zinc-300 hover:border-orange-400' : 'border-zinc-300 hover:border-zinc-400'}`}>
                                                        {isReg ? (
                                                            <>
                                                                <div className="w-[14px] bg-[#003399] flex flex-col items-center justify-between py-[2px] shrink-0 border-r border-zinc-200">
                                                                    <div className="w-2 h-2 rounded-full border-[1px] border-[#ffcc00] mt-[1px]"></div>
                                                                    <span className="text-[9px] font-sans font-black text-white leading-none antialiased mb-[1px]">S</span>
                                                                </div>
                                                                <div className="flex-1 flex items-center justify-center">
                                                                    <span className="font-mono font-black text-[13px] text-zinc-900 tracking-widest leading-none pt-[2px]">{regDisplay}</span>
                                                                </div>
                                                            </>
                                                        ) : (
                                                            <div className="flex-1 flex items-center justify-center px-1">
                                                                <span className="font-mono font-black text-[11px] text-zinc-900 tracking-widest uppercase truncate leading-none pt-[2px]">{regDisplay}</span>
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
                                                                <div className={`text-[11px] font-black uppercase ${isUrgent ? 'text-orange-600' : 'text-zinc-800'}`}>{dateText}</div>
                                                                <div className="text-[10px] font-mono text-zinc-400">{job.datum.split('T')[1]}</div>
                                                            </div>
                                                        </div>
                                                    ) : <span className="text-[10px] font-bold text-zinc-300 uppercase">Inväntar</span>}
                                                </td>
                                                <td className="px-4 py-4 align-middle">
                                                    <window.Badge status={job.status} />
                                                </td>
                                                <td className="px-4 py-4 align-middle text-right">
                                                    <div className="flex flex-col items-end">
                                                        <div className="font-mono font-black text-[14px] text-zinc-900 tracking-tight leading-none">
                                                            {(parseInt(job.kundpris) || 0).toLocaleString()} <span className="text-[9px] text-zinc-400 font-sans tracking-normal">kr</span>
                                                        </div>
                                                        {job.status === 'FAKTURERAS' && (
                                                            <span className="text-[8px] font-black text-blue-500 uppercase tracking-widest mt-1">Väntar_Betalning</span>
                                                        )}
                                                    </div>
                                                </td>
                                                <td className="pl-4 pr-6 py-4 align-middle text-right">
                                                    <div className="opacity-0 group-hover:opacity-100 transition-opacity flex justify-end items-center gap-2">
                                                        {job.status !== 'KLAR' && (
                                                            <button onClick={(e) => { e.stopPropagation(); window.db.collection("jobs").doc(job.id).update({status: 'KLAR'}); }} title="Markera som klar" className="w-8 h-8 flex items-center justify-center rounded-sm bg-white border border-zinc-200 text-zinc-400 hover:text-emerald-600 hover:border-emerald-300 hover:shadow-sm transition-all">
                                                                <window.Icon name="check" size={14} />
                                                            </button>
                                                        )}
                                                        <button onClick={(e) => { e.stopPropagation(); setView('NEW_JOB', { job: job }); }} className="w-8 h-8 flex items-center justify-center rounded-sm bg-white border border-zinc-200 text-zinc-400 hover:text-blue-600 hover:border-blue-300 hover:shadow-sm transition-all"><window.Icon name="edit-2" size={14} /></button>
                                                        <button onClick={(e) => { e.stopPropagation(); if(confirm("Radera?")) window.db.collection("jobs").doc(job.id).update({deleted:true}); }} className="w-8 h-8 flex items-center justify-center rounded-sm bg-white border border-zinc-200 text-zinc-400 hover:text-red-600 hover:border-red-300 hover:shadow-sm transition-all"><window.Icon name="trash" size={14} /></button>
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

            {/* --- MOBILE VY (RENSAD HEADER & NYA FILTREN) --- */}
            <div
                className="lg:hidden flex flex-col min-h-screen bg-[#f4f4f5] touch-pan-y"
                onTouchStart={onTouchStart} onTouchEnd={onTouchEnd}
            >
                <div className="bg-zinc-950 text-white pt-safe-top sticky top-0 z-40 shadow-md">

                    {/* Titel & Sök */}
                    <div className="px-4 py-5 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-orange-500 rounded-[4px] flex items-center justify-center text-black font-bold shadow-[0_0_15px_rgba(249,115,22,0.3)]">
                                <window.Icon name="grid" size={20} />
                            </div>
                            <div className="flex flex-col">
                                <span className="text-xl font-black uppercase tracking-tighter leading-none mb-1">Mission Control</span>
                                <span className="text-[9px] font-bold text-zinc-400 uppercase tracking-widest">{getHeaderDate()}</span>
                            </div>
                        </div>
                        <button onClick={() => setSearchOpen(!searchOpen)} className="w-10 h-10 flex items-center justify-center bg-zinc-900 rounded-full text-zinc-400 hover:text-white transition-colors border border-zinc-800">
                            <window.Icon name={searchOpen ? "x" : "search"} size={18} />
                        </button>
                    </div>

                    {/* SÖK-INPUT */}
                    {searchOpen && (
                        <div className="px-4 pb-4 animate-in slide-in-from-top-2">
                            <input autoFocus type="text" value={globalSearch} onChange={e => setGlobalSearch(e.target.value)} placeholder="SÖK UPPDRAG, REGNR..." className="w-full h-11 bg-zinc-900 text-white rounded-[4px] px-4 text-[12px] font-bold uppercase focus:outline-none focus:border-orange-500 border border-zinc-800" />
                        </div>
                    )}

                    {/* STATS (Rena och snygga) */}
                    {!searchOpen && (
                        <div className="px-4 pb-2 grid grid-cols-2 gap-3">
                             <div className="bg-zinc-900 border border-zinc-800 rounded-[4px] p-3 flex justify-between items-center">
                                <div>
                                    <div className="text-[8px] font-bold text-zinc-500 uppercase tracking-widest">30D Utförda</div>
                                    <div className="text-lg font-black text-emerald-500 leading-none mt-1">{stats30Days} <span className="text-[9px] text-zinc-500">st</span></div>
                                </div>
                            </div>
                            <div className="bg-zinc-900 border border-zinc-800 rounded-[4px] p-3 flex justify-between items-center">
                                <div>
                                    <div className="text-[8px] font-bold text-zinc-500 uppercase tracking-widest">7D Kommande</div>
                                    <div className="text-lg font-black text-blue-500 leading-none mt-1">{statsNext7Days} <span className="text-[9px] text-zinc-500">st</span></div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* NYA FILTER / TABS */}
                    <div
                        ref={tabsRef}
                        className="flex overflow-x-auto px-4 pt-2 space-x-3 border-b border-zinc-800 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]"
                        onTouchStart={(e) => e.stopPropagation()}
                        onTouchMove={(e) => e.stopPropagation()}
                        onTouchEnd={(e) => e.stopPropagation()}
                    >
                        {filters.map(f => {
                            const isActive = activeFilter === f;
                            const count = statusCounts[f] || 0;
                            return (
                                <button key={f} data-tab={f} onClick={() => setActiveFilter(f)} className={`py-3 px-1 text-[10px] font-bold uppercase tracking-wider transition-all border-b-2 whitespace-nowrap ${isActive ? 'text-orange-500 border-orange-500' : 'text-zinc-400 border-transparent hover:text-zinc-300'}`}>
                                    {f}
                                    {count > 0 && <span className={`ml-1.5 px-1.5 py-0.5 rounded-full text-[8px] ${isActive ? 'bg-orange-500/20 text-orange-500' : 'bg-zinc-800 text-zinc-500'}`}>{count}</span>}
                                </button>
                            );
                        })}
                    </div>
                </div>

                <div className="px-3 py-3 pb-24 flex flex-col gap-2">
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
            {historyTarget && window.VehicleProfileLoader && (
                <window.VehicleProfileLoader
                    regnr={historyTarget.regnr}
                    highlightId={historyTarget.highlightId} // Skicka med ID!
                    onClose={() => setHistoryTarget(null)}
                    setView={setView}
                />
            )}
        </div>
    );
}, dashboardPropsAreEqual);
