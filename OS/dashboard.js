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

// 2. PREMIUM STATUS BADGE
window.Badge = React.memo(({ status }) => {
    const s = (status || 'BOKAD').toUpperCase();
    const config = {
        'BOKAD': { bg: 'bg-orange-50/80 dark:bg-orange-500/10', text: 'text-orange-700 dark:text-orange-400', border: 'border-orange-200/60 dark:border-orange-500/20', dot: 'bg-orange-500 shadow-[0_0_8px_rgba(249,115,22,0.6)]' },
        'OFFERERAD': { bg: 'bg-blue-50/80 dark:bg-blue-500/10', text: 'text-blue-700 dark:text-blue-400', border: 'border-blue-200/60 dark:border-blue-500/20', dot: 'bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.6)]' },
        'KLAR': { bg: 'bg-emerald-50/80 dark:bg-emerald-500/10', text: 'text-emerald-700 dark:text-emerald-400', border: 'border-emerald-200/60 dark:border-emerald-500/20', dot: 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.6)]' },
        'FAKTURERAS': { bg: 'bg-zinc-100/80 dark:bg-white/5', text: 'text-zinc-600 dark:text-zinc-300', border: 'border-zinc-200/80 dark:border-white/10', dot: 'bg-zinc-400' },
    };
    const style = config[s] || config['BOKAD'];
    return (
        <span className={`px-2.5 py-1 text-[9px] font-bold uppercase tracking-widest inline-flex items-center gap-1.5 rounded-lg border backdrop-blur-sm ${style.bg} ${style.text} ${style.border}`}>
            <span className={`w-1.5 h-1.5 rounded-full ${style.dot}`}></span>
            {s}
        </span>
    );
});

// Färg-generator för avatarer
const getAvatarTheme = (name) => {
    if (!name) return 'bg-zinc-100 text-zinc-600 border-zinc-200 dark:bg-[#182032] dark:text-zinc-400 dark:border-white/5';
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

// 3. MOBILKORTET (Kompakt med tydliga linjer, men premium-look)
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
            className={`w-full relative active:scale-[0.98] transition-all bg-white hover:bg-orange-50 dark:bg-[#182032] dark:hover:bg-[#1f2940] border border-zinc-200 dark:border-white/5 rounded-xl shadow-sm group select-none overflow-hidden mb-3 ${isDone ? 'opacity-70 grayscale-[0.3]' : ''}`}
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
                            <div className="text-[11px] font-mono text-zinc-400 dark:text-zinc-500 flex items-center gap-1">
                                <window.Icon name="hash" size={10} /> {job.id.substring(0, 6)}
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center gap-3 relative z-30">
                        <window.Badge status={job.status} />
                        <div className="relative">
                            <button onClick={(e) => { e.stopPropagation(); setMenuOpen(!menuOpen); }} className="w-8 h-8 -mr-2 -mt-1 flex items-center justify-center text-zinc-400 hover:text-black dark:text-zinc-500 dark:hover:text-white transition-colors">
                                <window.Icon name="more-horizontal" size={18} />
                            </button>
                            {/* Premium Menyn (Mobil) */}
                            {menuOpen && (
                                <>
                                    <div className="fixed inset-0 z-40 cursor-default" onClick={(e) => { e.stopPropagation(); setMenuOpen(false); }}></div>
                                    <div className="absolute right-0 top-full mt-2 w-48 bg-white/95 dark:bg-[#182032]/95 backdrop-blur-xl rounded-xl shadow-2xl border border-zinc-200 dark:border-white/10 z-50 p-1.5 overflow-hidden animate-in fade-in zoom-in-95 origin-top-right">
                                        {job.status !== 'KLAR' && (
                                            <button onClick={(e) => { e.stopPropagation(); window.db.collection("jobs").doc(job.id).update({ status: 'KLAR' }); setMenuOpen(false); }} className="w-full text-left px-3 py-2.5 text-[12px] font-bold uppercase tracking-wide text-zinc-700 dark:text-zinc-300 hover:bg-emerald-50 dark:hover:bg-emerald-500/10 hover:text-emerald-600 dark:hover:text-emerald-400 flex items-center gap-2.5 rounded-lg transition-colors">
                                                <window.Icon name="check-circle" size={14} className="text-emerald-500" /> Markera klar
                                            </button>
                                        )}
                                        <button onClick={(e) => { e.stopPropagation(); setView('NEW_JOB', { job: job }); setMenuOpen(false); }} className="w-full text-left px-3 py-2.5 text-[12px] font-bold uppercase tracking-wide text-zinc-700 dark:text-zinc-300 hover:bg-blue-50 dark:hover:bg-blue-500/10 hover:text-blue-600 dark:hover:text-blue-400 flex items-center gap-2.5 rounded-lg transition-colors">
                                            <window.Icon name="edit-2" size={14} className="text-blue-500" /> Redigera order
                                        </button>
                                        <div className="h-px bg-zinc-100 dark:bg-white/5 my-1 mx-2"></div>
                                        <button onClick={(e) => { e.stopPropagation(); if (confirm("Radera ordern?")) { window.db.collection("jobs").doc(job.id).update({ deleted: true }); } setMenuOpen(false); }} className="w-full text-left px-3 py-2.5 text-[12px] font-bold uppercase tracking-wide text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 flex items-center gap-2.5 rounded-lg transition-colors">
                                            <window.Icon name="trash-2" size={14} className="text-red-500" /> Radera order
                                        </button>
                                    </div>
                                </>
                            )}
                        </div>
                    </div>
                </div>

                {/* RAD 2: Den inre informations-boxen med tydliga borders */}
                <div className="flex items-center p-3 mb-4 rounded-lg border border-zinc-200 dark:border-white/5 bg-zinc-50/80 dark:bg-[#0f1522]/50 divide-x divide-zinc-200 dark:divide-white/5">
                    
                    {/* VÄNSTER: Fordon */}
                    <div className="flex flex-col flex-1 pr-3 min-w-0">
                        <span className="text-[9px] text-zinc-400 dark:text-zinc-500 font-black uppercase tracking-widest mb-1.5 flex items-center gap-1.5">
                            <window.Icon name="truck" size={10} /> Fordon
                        </span>
                        <div className={`inline-flex items-center rounded-[3px] border overflow-hidden h-[24px] ${isReg ? 'bg-white dark:bg-[#182032] border-zinc-300 dark:border-[#2a3441]' : 'bg-transparent border-transparent'}`}>
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
                                        <span className="relative inline-flex rounded-full h-2 w-2 bg-orange-500 shadow-[0_0_8px_rgba(249,115,22,0.6)]"></span>
                                    </span>
                                )}
                                <span className={`text-[12px] font-black uppercase leading-none truncate mt-[1px] ${!isDone && isUrgentDate ? 'text-orange-500' : 'text-zinc-900 dark:text-white'}`}>
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
    const [visibleCount, setVisibleCount] = React.useState(20);
    
    React.useEffect(() => {
        setVisibleCount(20);
    }, [activeFilter, globalSearch]);

    const visibleJobs = filteredJobs.slice(0, visibleCount);
    const hasMore = visibleCount < filteredJobs.length;

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

    const getHeaderDate = () => {
        const d = new Date();
        const days = ['Söndag', 'Måndag', 'Tisdag', 'Onsdag', 'Torsdag', 'Fredag', 'Lördag'];
        const months = ['Jan', 'Feb', 'Mar', 'Apr', 'Maj', 'Jun', 'Jul', 'Aug', 'Sep', 'Okt', 'Nov', 'Dec'];
        return `${days[d.getDay()]} ${d.getDate()} ${months[d.getMonth()]}`;
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
            <button onClick={() => setActiveFilter(label)} className={`px-5 py-3 text-[12px] font-bold tracking-widest transition-all rounded-t-xl relative ${isActive ? 'text-orange-500 bg-white/50 dark:bg-white/5 backdrop-blur-md border-b-2 border-orange-500' : 'text-zinc-400 border-b-2 border-transparent hover:text-zinc-700 dark:hover:text-zinc-300'}`}>
                {label}
                {count > 0 && <span className={`ml-2 text-[10px] ${isActive ? 'text-orange-600 dark:text-orange-400' : 'text-zinc-400'}`}>({count})</span>}
            </button>
        );
    };

    return (
        // LAYOUT-FIX: ml-0 istället för mx-auto (Vänsterställd mot sidebaren) och en maxbredd på 1400px
        <div className="flex flex-col min-h-screen bg-transparent text-zinc-900 dark:text-white pb-0 transition-colors duration-500 relative max-w-[1400px] ml-0 w-full">

            {/* Ambient Background Glow */}
            <div className="absolute top-0 left-[-10%] w-[60%] h-[400px] bg-orange-500/10 dark:bg-orange-500/5 blur-[120px] rounded-full pointer-events-none -z-10 hidden lg:block"></div>

            {/* --- DESKTOP VY --- */}
            <div className="hidden lg:flex flex-col h-full px-4 lg:px-2">
    
                {/* HEADER */}
                <div className="flex flex-col md:flex-row md:items-center justify-between mb-4 pb-4 border-b border-zinc-200 dark:border-white/5 gap-4 pt-2 lg:pt-0">
                    
                    {/* LOGGA OCH TITEL */}
                    <div className="flex items-center gap-4 md:gap-5">
                        <div className="relative group cursor-default shrink-0">
                            <div className="absolute inset-0 bg-orange-500/40 blur-xl rounded-full transition-all duration-700 group-hover:bg-orange-500/60" />
                            <div className="relative w-14 h-14 rounded-2xl flex items-center justify-center text-white shadow-xl border border-white/20 transition-colors bg-gradient-to-br from-orange-400 to-orange-600">
                                <window.Icon name="grid" size={24} />
                            </div>
                        </div>
                        <div className="flex flex-col">
                            <h1 className="text-3xl font-black text-zinc-900 dark:text-white uppercase tracking-tight leading-none drop-shadow-sm dark:drop-shadow-none">
                                DASH<span className="text-zinc-400 dark:text-zinc-500 font-light">BOARD</span>
                            </h1>
                            <p className="text-[11px] font-bold text-orange-500 dark:text-orange-400 uppercase tracking-widest mt-1.5 flex items-center gap-2">
                                <span className="w-1.5 h-1.5 rounded-full bg-orange-500 animate-pulse"></span>
                                Operationell Status
                            </p>
                        </div>
                    </div>

                    {/* SÖK OCH NYTT JOBB */}
                    <div className="flex items-center gap-4">
                        <div className="relative group">
                            <input type="text" value={globalSearch} onChange={e => setGlobalSearch(e.target.value)} placeholder="SÖK UPPDRAG..." className="w-64 bg-white/80 dark:bg-[#1a2235]/80 backdrop-blur-md border border-zinc-200/80 dark:border-white/10 text-zinc-900 dark:text-white text-[13px] font-bold py-3.5 pl-4 pr-12 rounded-2xl focus:outline-none focus:border-orange-500 focus:ring-4 focus:ring-orange-500/10 hover:border-zinc-300 dark:hover:border-white/20 transition-all placeholder:text-zinc-400 tracking-widest shadow-sm" />
                            <window.Icon name="search" size={16} className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-400 group-focus-within:text-orange-500 transition-colors" />
                        </div>
                        <button onClick={() => setView('NEW_JOB')} className="bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-400 hover:to-orange-500 text-white h-[46px] px-8 rounded-2xl flex items-center gap-3 shadow-[0_8px_20px_-6px_rgba(249,115,22,0.4)] hover:shadow-[0_8px_25px_-4px_rgba(249,115,22,0.5)] border border-orange-400/50 transition-all active:scale-95">
                            <span className="text-[12px] font-bold uppercase tracking-widest">Nytt Uppdrag</span>
                            <window.Icon name="plus" size={16} />
                        </button>
                    </div>
                </div>

                {/* Desktop Stats (Premium cards with dark blue theme) */}
                <div className="grid grid-cols-3 gap-6 mb-8">
                    <div className="bg-white/80 dark:bg-[#182032]/80 backdrop-blur-xl rounded-3xl border border-zinc-200/80 dark:border-white/5 p-6 shadow-sm relative overflow-hidden group hover:shadow-xl hover:shadow-orange-500/5 transition-all">
                        <div className="absolute right-0 top-0 w-32 h-32 bg-emerald-500/5 blur-3xl rounded-full pointer-events-none"></div>
                        <window.Icon name="check-circle" size={100} className="absolute -right-8 -bottom-8 text-zinc-100 dark:text-white/5 group-hover:text-emerald-500/10 transition-colors" />
                        <div className="relative z-10">
                            <div className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-2 flex items-center gap-2">
                                <window.Icon name="bar-chart-2" size={12} /> Utförda (30d)
                            </div>
                            <div className="text-4xl font-light tracking-tighter text-zinc-900 dark:text-white leading-none">{stats30Days} <span className="text-lg font-bold text-zinc-400 uppercase tracking-widest ml-1">Op</span></div>
                        </div>
                    </div>

                    <div className="bg-white/80 dark:bg-[#182032]/80 backdrop-blur-xl rounded-3xl border border-zinc-200/80 dark:border-white/5 p-6 shadow-sm relative overflow-hidden group hover:shadow-xl hover:shadow-blue-500/5 transition-all">
                        <div className="absolute right-0 top-0 w-32 h-32 bg-blue-500/5 blur-3xl rounded-full pointer-events-none"></div>
                        <window.Icon name="calendar" size={100} className="absolute -right-8 -bottom-8 text-zinc-100 dark:text-white/5 group-hover:text-blue-500/10 transition-colors" />
                        <div className="relative z-10">
                            <div className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-2 flex items-center gap-2">
                                <window.Icon name="clock" size={12} /> Kommande (7d)
                            </div>
                            <div className="text-4xl font-light tracking-tighter text-zinc-900 dark:text-white leading-none">{statsNext7Days} <span className="text-lg font-bold text-zinc-400 uppercase tracking-widest ml-1">Op</span></div>
                        </div>
                    </div>

                    <div className="bg-white/80 dark:bg-[#182032]/80 backdrop-blur-xl rounded-3xl border border-zinc-200/80 dark:border-white/5 p-6 shadow-sm relative overflow-hidden group hover:shadow-xl hover:shadow-red-500/5 transition-all">
                        <div className="absolute right-0 top-0 w-32 h-32 bg-red-500/5 blur-3xl rounded-full pointer-events-none"></div>
                        <window.Icon name="alert-triangle" size={100} className="absolute -right-8 -bottom-8 text-zinc-100 dark:text-white/5 group-hover:text-red-500/10 transition-colors" />
                        <div className="relative z-10">
                            <div className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-2 flex items-center gap-2">
                                <window.Icon name="zap" size={12} /> Prioritet
                            </div>
                            <div className={`text-4xl font-light tracking-tighter leading-none ${urgentCount > 0 ? 'text-red-500' : 'text-zinc-900 dark:text-white'}`}>
                                {urgentCount} <span className="text-lg font-bold text-zinc-400 uppercase tracking-widest ml-1">Op</span>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="flex flex-col flex-1 pb-10">
                    <div className="flex px-4 border-b border-zinc-200 dark:border-white/10 space-x-2">{filters.map(f => <TabButton key={f} label={f} />)}</div>

                    {/* TABELLEN (Mörkblå/Slate-temat) */}
                    <div className="bg-white/80 dark:bg-[#182032]/80 backdrop-blur-xl rounded-b-3xl shadow-sm border border-t-0 border-zinc-200/80 dark:border-white/5 overflow-hidden flex flex-col min-h-[500px]">
                        <div className="flex-1 overflow-auto custom-scrollbar">
                            <table className="w-full text-left border-collapse">
                                <thead className="bg-zinc-50/50 dark:bg-white/5 text-zinc-400 dark:text-zinc-500 text-[10px] uppercase tracking-widest font-bold sticky top-0 z-10 border-b border-zinc-200 dark:border-white/10">
                                    <tr>
                                        <th className="pl-8 pr-4 py-5 w-[25%]">Kund_Data</th>
                                        <th className="px-4 py-5 w-[15%]">Service_Type</th>
                                        <th className="px-4 py-5 w-[15%]">Asset_ID</th>
                                        <th className="px-4 py-5 w-[15%]">Deploy_Date</th>
                                        <th className="px-4 py-5 w-[15%]">Status</th>
                                        <th className="px-4 py-5 w-[15%] text-right">Value</th>
                                        <th className="pl-4 pr-8 py-5 w-[10%] text-right"></th>
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
                                            <tr key={job.id} onClick={() => job.regnr ? handleOpenHistory(job.regnr, job.id) : null} className={`group transition-all duration-300 cursor-pointer relative bg-transparent hover:bg-zinc-50 dark:hover:bg-white/[0.02] border-b border-zinc-100 dark:border-white/5 last:border-0 border-l-4 border-l-transparent hover:border-l-orange-500`}>
                                                <td className="pl-7 pr-4 py-4 align-middle">
                                                    <div className="flex items-center gap-4">
                                                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-[12px] font-bold shrink-0 border shadow-sm ${avatarTheme}`}>
                                                            {initials}
                                                        </div>
                                                        <div>
                                                            <div className="text-[14px] font-bold text-zinc-900 dark:text-white leading-none mb-1.5 group-hover:text-orange-500 transition-colors">{job.kundnamn}</div>
                                                            <div className="flex items-center gap-2">
                                                                <span className="text-[10px] font-mono font-medium text-zinc-400 dark:text-zinc-500 uppercase tracking-widest"><window.Icon name="hash" size={10} className="inline mr-1 -mt-0.5" />{job.id.substring(0,6)}</span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-4 py-4 align-middle">
                                                    <div className="flex flex-col min-w-0">
                                                        <span className="text-[13px] font-bold text-zinc-700 dark:text-zinc-300">{job.paket || 'Standard_Deploy'}</span>
                                                        {job.kommentar && (
                                                            <div className="flex items-center gap-1.5 text-[11px] text-zinc-400 mt-1 italic truncate max-w-[140px]">
                                                                <window.Icon name="message-square" size={10} className="shrink-0" />
                                                                <span className="truncate">{job.kommentar}</span>
                                                            </div>
                                                        )}
                                                    </div>
                                                </td>
                                                <td className="px-4 py-4 align-middle">
                                                    <div onClick={(e) => { e.stopPropagation(); if(job.regnr) setHistoryTarget({ regnr: job.regnr, highlightId: job.id }); }} className={`inline-flex items-stretch rounded-lg border overflow-hidden w-[110px] h-[30px] ${isReg ? 'bg-white dark:bg-[#1a2235] border-zinc-200 dark:border-[#2a3441] shadow-sm' : 'bg-transparent border-transparent'} transition-colors`}>
                                                        {isReg ? (
                                                            <>
                                                                <div className="w-[16px] bg-[#003399] flex flex-col items-center justify-between py-[2px] shrink-0 border-r border-zinc-200 dark:border-[#2a3441]">
                                                                    <div className="w-2 h-2 rounded-full border-[1px] border-[#ffcc00] mt-[1px]"></div>
                                                                    <span className="text-[9px] font-sans font-black text-white leading-none antialiased mb-[1px]">S</span>
                                                                </div>
                                                                <div className="flex-1 flex items-center justify-center">
                                                                    <span className="font-mono font-black text-[14px] text-zinc-900 dark:text-zinc-200 tracking-[0.15em] leading-none pt-[2px]">{regDisplay}</span>
                                                                </div>
                                                            </>
                                                        ) : (
                                                            <div className="flex-1 flex items-center justify-start px-1">
                                                                <span className="font-mono font-bold text-[12px] text-zinc-500 tracking-widest uppercase truncate leading-none pt-[2px]">{regDisplay}</span>
                                                            </div>
                                                        )}
                                                    </div>
                                                </td>
                                                <td className="px-4 py-4 align-middle">
                                                    {job.datum ? (
                                                        <div className="flex items-center gap-2.5">
                                                            {isUrgent && (
                                                                <span className="relative flex h-2 w-2 shrink-0">
                                                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-orange-400 opacity-75"></span>
                                                                    <span className="relative inline-flex rounded-full h-2 w-2 bg-orange-500 shadow-[0_0_8px_rgba(249,115,22,0.8)]"></span>
                                                                </span>
                                                            )}
                                                            <div>
                                                                <div className={`text-[12px] font-bold uppercase tracking-wide ${isUrgent ? 'text-orange-600' : 'text-zinc-800 dark:text-zinc-300'}`}>{dateText}</div>
                                                                <div className="text-[11px] font-mono text-zinc-400 dark:text-zinc-500 mt-0.5">{job.datum.split('T')[1]}</div>
                                                            </div>
                                                        </div>
                                                    ) : <span className="text-[10px] font-bold text-red-500 bg-red-50 dark:bg-red-500/10 px-2 py-1 rounded-md uppercase tracking-widest">Inväntar data</span>}
                                                </td>
                                                <td className="px-4 py-4 align-middle">
                                                    <window.Badge status={job.status} />
                                                </td>
                                                <td className="px-4 py-4 align-middle text-right">
                                                    <div className="flex flex-col items-end">
                                                        <div className="font-mono font-light tracking-tighter text-[18px] text-zinc-900 dark:text-white leading-none">
                                                            {(parseInt(job.kundpris) || 0).toLocaleString()} <span className="text-[10px] text-zinc-400 dark:text-zinc-500 font-sans tracking-widest uppercase font-bold ml-0.5">kr</span>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="pl-4 pr-8 py-4 align-middle text-right">
                                                    <div className="opacity-0 group-hover:opacity-100 translate-x-4 group-hover:translate-x-0 transition-all duration-300 flex justify-end items-center gap-2">
                                                        {job.status !== 'KLAR' && (
                                                            <button title="Markera Klar" onClick={(e) => { e.stopPropagation(); window.db.collection("jobs").doc(job.id).update({status: 'KLAR'}); }} className="w-9 h-9 flex items-center justify-center rounded-xl bg-white dark:bg-[#1a2235] border border-zinc-200 dark:border-white/5 text-zinc-400 hover:bg-emerald-50 dark:hover:bg-emerald-500/10 hover:border-emerald-200 dark:hover:border-emerald-500/30 hover:text-emerald-600 dark:hover:text-emerald-400 shadow-sm transition-all">
                                                                <window.Icon name="check" size={16} />
                                                            </button>
                                                        )}
                                                        <button title="Redigera" onClick={(e) => { e.stopPropagation(); setView('NEW_JOB', { job: job }); }} className="w-9 h-9 flex items-center justify-center rounded-xl bg-white dark:bg-[#1a2235] border border-zinc-200 dark:border-white/5 text-zinc-400 hover:bg-blue-50 dark:hover:bg-blue-500/10 hover:border-blue-200 dark:hover:border-blue-500/30 hover:text-blue-600 dark:hover:text-blue-400 shadow-sm transition-all">
                                                            <window.Icon name="edit-2" size={16} />
                                                        </button>
                                                        <button title="Radera" onClick={(e) => { e.stopPropagation(); if(confirm("Radera?")) window.db.collection("jobs").doc(job.id).update({deleted:true}); }} className="w-9 h-9 flex items-center justify-center rounded-xl bg-white dark:bg-[#1a2235] border border-zinc-200 dark:border-white/5 text-zinc-400 hover:bg-red-50 dark:hover:bg-red-500/10 hover:border-red-200 dark:hover:border-red-500/30 hover:text-red-600 dark:hover:text-red-400 shadow-sm transition-all">
                                                            <window.Icon name="trash" size={16} />
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                            
                            {/* KNAPP FÖR ATT VISA FLER (DESKTOP) */}
                            {hasMore && (
                                <div className="flex justify-center p-6 border-t border-zinc-200 dark:border-white/5 bg-zinc-50/30 dark:bg-white/[0.01]">
                                    <button onClick={() => setVisibleCount(prev => prev + 20)} className="px-8 py-3 bg-white dark:bg-[#1a2235] border border-zinc-200 dark:border-white/10 hover:bg-zinc-50 dark:hover:bg-white/5 text-zinc-600 dark:text-zinc-300 text-[11px] font-bold uppercase tracking-widest rounded-xl shadow-sm transition-colors flex items-center gap-2">
                                        Ladda in fler <span className="opacity-50">({filteredJobs.length - visibleCount} kvar)</span>
                                    </button>
                                </div>
                            )}

                        </div>
                    </div>
                </div>
            </div>

            {/* --- MOBILE VY (Dark Blue/Slate tema) --- */}
            <div
                className="lg:hidden flex flex-col min-h-screen bg-zinc-50 dark:bg-[#0f1522] touch-pan-y transition-colors duration-500"
                onTouchStart={onTouchStart} onTouchEnd={onTouchEnd}
            >
                {/* VIKTIGT: pt-2 för minimal top-padding på mobil */}
                <div className="bg-white/90 dark:bg-[#182032]/90 backdrop-blur-2xl text-zinc-900 dark:text-white pt-safe-top pt-2 sticky top-0 z-40 shadow-sm dark:border-b dark:border-white/5 transition-colors duration-300">
                    <div className="px-4 pb-4 pt-2 flex items-center justify-between border-b border-zinc-100 dark:border-white/5">
                        
                        {/* LOGGA OCH TITEL */}
                        <div className="flex items-center gap-4">
                            <div className="relative group cursor-default shrink-0">
                                <div className="absolute inset-0 bg-orange-500/40 blur-xl rounded-full transition-all duration-700 group-hover:bg-orange-500/60" />
                                <div className="relative w-12 h-12 rounded-xl flex items-center justify-center text-white shadow-md border border-white/20 bg-gradient-to-br from-orange-400 to-orange-600">
                                    <window.Icon name="grid" size={24} />
                                </div>
                            </div>
                            <div className="flex flex-col">
                                <h1 className="text-xl font-black text-zinc-900 dark:text-white uppercase tracking-tight leading-none drop-shadow-sm dark:drop-shadow-none">
                                    DASH<span className="text-zinc-400 dark:text-zinc-500 font-light">BOARD</span>
                                </h1>
                                <p className="text-[9px] font-bold text-orange-500 uppercase tracking-widest mt-1 flex items-center gap-1.5">
                                    <span className="w-1.5 h-1.5 rounded-full bg-orange-500 animate-pulse"></span>
                                    {getHeaderDate()}
                                </p>
                            </div>
                        </div>

                        <button onClick={() => setSearchOpen(!searchOpen)} className="w-10 h-10 flex items-center justify-center rounded-xl bg-zinc-100 dark:bg-[#1a2235] text-zinc-500 dark:text-zinc-400 hover:text-orange-500 dark:hover:text-white transition-colors border border-transparent dark:border-white/5">
                            <window.Icon name={searchOpen ? "x" : "search"} size={18} />
                        </button>
                    </div>

                    {/* SÖKFÄLT */}
                    {searchOpen && (
                        <div className="px-4 py-3 border-b border-zinc-100 dark:border-white/5 bg-zinc-50/50 dark:bg-black/20 animate-in slide-in-from-top-2">
                            <div className="relative">
                                <input autoFocus type="text" value={globalSearch} onChange={e => setGlobalSearch(e.target.value)} placeholder="SÖK UPPDRAG, REGNR..." className="w-full h-12 bg-white dark:bg-[#1a2235] text-zinc-900 dark:text-white rounded-xl px-11 text-[12px] font-bold uppercase tracking-widest focus:outline-none focus:border-orange-500 focus:ring-4 focus:ring-orange-500/10 border border-zinc-200 dark:border-white/10 shadow-sm transition-all" />
                                <window.Icon name="search" size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400" />
                            </div>
                        </div>
                    )}

                    {/* DINA FILTER-TABS */}
                    <div
                        ref={tabsRef}
                        // Bytte ut "custom-scrollbar" mot klasser som döljer scrollbaren helt på alla enheter
                        className="flex overflow-x-auto px-4 pt-2 space-x-4 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]"
                        onTouchStart={(e) => e.stopPropagation()}
                        onTouchMove={(e) => e.stopPropagation()}
                        onTouchEnd={(e) => e.stopPropagation()}
                    >
                        {filters.map(f => {
                            const isActive = activeFilter === f;
                            const count = statusCounts[f] || 0;
                            return (
                                <button key={f} data-tab={f} onClick={() => setActiveFilter(f)} className={`py-3 text-[11px] font-bold uppercase tracking-widest transition-all border-b-2 whitespace-nowrap relative ${isActive ? 'text-orange-500 border-orange-500' : 'text-zinc-400 dark:text-zinc-500 border-transparent'}`}>
                                    {f}
                                    {count > 0 && <span className={`ml-2 px-1.5 py-0.5 rounded-md text-[9px] ${isActive ? 'bg-orange-50 dark:bg-orange-500/10 text-orange-600 dark:text-orange-400' : 'bg-zinc-100 dark:bg-white/5 text-zinc-500'}`}>{count}</span>}
                                </button>
                            );
                        })}
                    </div>
                </div>

                {/* KORTEN MED DATUM-GRUPPERING */}
                <div className="px-3 pt-4 pb-0 flex flex-col">
                    {filteredJobs.length > 0 ? (
                        <>
                            {(() => {
                                let lastDate = null;
                                return visibleJobs.map((job) => {
                                const currentDate = job.datum ? formatDate(job.datum) : 'INVÄNTAR DATUM';
                                const showHeader = currentDate !== lastDate;
                                lastDate = currentDate;

                                return (
                                    <React.Fragment key={job.id}>
                                        {showHeader && (
                                            <div className="mt-4 mb-3 px-2 flex items-center gap-2">
                                                <div className="h-4 w-1 bg-gradient-to-b from-orange-400 to-orange-600 rounded-full shadow-[0_0_8px_rgba(249,115,22,0.5)]" />
                                                <h3 className="text-[12px] font-bold text-zinc-900 dark:text-white uppercase tracking-widest flex items-center gap-2">
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
                            <div className="mt-2 mb-6 px-1">
                                <button onClick={() => setVisibleCount(prev => prev + 20)} className="w-full py-4 bg-white dark:bg-[#182032] border border-zinc-200 dark:border-white/5 text-zinc-700 dark:text-zinc-300 text-[12px] font-bold uppercase tracking-widest rounded-2xl shadow-sm active:scale-95 transition-all">
                                    Ladda in fler ({filteredJobs.length - visibleCount} kvar)
                                </button>
                            </div>
                        )}
                    </>
                ) : (
                    <div className="flex flex-col items-center justify-center py-24 text-zinc-400">
                        <window.Icon name="inbox" size={48} className="mb-4 opacity-20" />
                        <span className="text-[11px] font-bold uppercase tracking-widest">Inga uppdrag hittades</span>
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
