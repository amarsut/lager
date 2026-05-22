// calendar.js

const SafeIcon = ({ name, size = 12, className = "" }) => (
    <span className="inline-flex items-center justify-center shrink-0">
        <window.Icon name={name} size={size} className={className} />
    </span>
);

window.CalendarView = ({ allJobs = [], setEditingJob, setView }) => {
    const [currentDate, setCurrentDate] = React.useState(new Date());
    const [viewMode, setViewMode] = React.useState('WEEK');
    const [touchStart, setTouchStart] = React.useState(null);
    const [blockedDates, setBlockedDates] = React.useState([]);

    const monthNames = ["Januari", "Februari", "Mars", "April", "Maj", "Juni", "Juli", "Augusti", "September", "Oktober", "November", "December"];
    const weekDays = ["Mån", "Tis", "Ons", "Tor", "Fre", "Lör", "Sön"];

    // Hämta blockerade datum
    React.useEffect(() => {
        if (!window.db) return;
        const unsub = window.db.collection('blocked_dates').onSnapshot(s => {
            setBlockedDates(s.docs.map(d => d.data().date));
        });
        return () => unsub();
    }, []);

    const toggleBlockDate = async (dateStr, isBlocked) => {
        try {
            if (isBlocked) {
                const snapshot = await window.db.collection('blocked_dates').where('date', '==', dateStr).get();
                snapshot.forEach(doc => doc.ref.delete());
            } else {
                await window.db.collection('blocked_dates').add({ date: dateStr });
            }
        } catch (err) {
            console.error("Kunde inte spärra datum:", err);
        }
    };

    const handleTouchStart = (e) => setTouchStart(e.targetTouches[0].clientX);
    const handleTouchEnd = (e) => {
        if (!touchStart) return;
        const touchEnd = e.changedTouches[0].clientX;
        const threshold = 100;
        if (touchStart - touchEnd > threshold) changeDate(viewMode === 'WEEK' ? 7 : 30); 
        if (touchStart - touchEnd < -threshold) changeDate(viewMode === 'WEEK' ? -7 : -30); 
        setTouchStart(null);
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

    const onDrop = async (e, dateStr) => {
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

    const jobsByDate = React.useMemo(() => {
        const map = {};
        allJobs.forEach(j => {
            if (j.datum && !j.deleted) {
                const dateKey = j.datum.split('T')[0];
                if (!map[dateKey]) map[dateKey] = [];
                map[dateKey].push(j);
            }
        });
        return map;
    }, [allJobs]);

    const calendarDays = React.useMemo(() => {
        if (viewMode === 'WEEK') {
            const start = new Date(currentDate);
            start.setDate(start.getDate() - 1); 
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
            for (let i = startPadding; i > 0; i--) { days.push({ date: new Date(year, month, 1 - i), isCurrentMonth: false }); }
            const lastDay = new Date(year, month + 1, 0).getDate();
            for (let i = 1; i <= lastDay; i++) { days.push({ date: new Date(year, month, i), isCurrentMonth: true }); }
            return days;
        }
    }, [currentDate, viewMode]);

    const isToday = (date) => date.toDateString() === new Date().toDateString();

    return (
        <div 
            className="flex flex-col min-h-[calc(100vh-80px)] md:min-h-screen bg-transparent text-zinc-900 dark:text-white pb-0 transition-colors duration-500 relative max-w-[1400px] ml-0 w-full animate-in fade-in slide-in-from-left-4" 
            onTouchStart={handleTouchStart} 
            onTouchEnd={handleTouchEnd}
        >
            {/* Ambient Background Glow */}
            <div className="absolute top-0 left-[-10%] w-[60%] h-[400px] bg-orange-500/10 dark:bg-orange-500/5 blur-[120px] rounded-full pointer-events-none -z-10 hidden lg:block"></div>

            {/* HEADER */}
            <div className="flex flex-col md:flex-row md:items-end justify-between mb-5 gap-4 px-4 pt-4 lg:px-0 lg:pt-0">
                <div className="flex items-center gap-3 md:gap-4">
                    <div className="relative group cursor-default shrink-0">
                        <div className="absolute inset-0 bg-orange-500/40 blur-lg rounded-full transition-all duration-700 group-hover:bg-orange-500/60" />
                        <div className="relative w-10 h-10 md:w-12 md:h-12 rounded-xl flex items-center justify-center text-white shadow-md border border-white/20 transition-colors bg-gradient-to-br from-orange-400 to-orange-600">
                            <SafeIcon name="calendar" size={20} className="md:w-6 md:h-6" />
                        </div>
                    </div>
                    <div className="flex flex-col">
                        <h1 className="text-xl md:text-2xl font-black text-zinc-900 dark:text-white uppercase tracking-tight leading-none">
                            SCHEDULE <span className="text-zinc-400 dark:text-zinc-500 font-light">TIMELINE</span>
                        </h1>
                        <p className="text-[9px] md:text-[10px] font-bold text-orange-500 dark:text-orange-400 uppercase tracking-widest mt-1 flex items-center gap-1.5">
                            <span className="w-1.5 h-1.5 rounded-full bg-orange-500 animate-pulse"></span>
                            {viewMode === 'WEEK' ? `Veckoöversikt` : `Månadsöversikt: ${monthNames[currentDate.getMonth()]}`}
                        </p>
                    </div>
                </div>

                {/* CONTROLS */}
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 md:gap-4 z-10">
                    <div className="flex bg-white/90 dark:bg-[#182032]/90 backdrop-blur-md p-1 border border-zinc-200/80 dark:border-white/10 rounded-xl md:rounded-2xl shadow-sm">
                        {['WEEK', 'MONTH'].map(m => (
                            <button key={m} onClick={() => setViewMode(m)} className={`px-5 py-2.5 md:py-3 text-[10px] md:text-[11px] font-bold uppercase tracking-widest rounded-lg md:rounded-xl transition-all flex-1 sm:flex-none ${viewMode === m ? 'bg-zinc-100 dark:bg-[#2a3441] text-zinc-900 dark:text-white shadow-sm' : 'text-zinc-500 hover:text-zinc-900 dark:hover:text-white'}`}>
                                {m === 'WEEK' ? 'Vecka' : 'Månad'}
                            </button>
                        ))}
                    </div>
                    <div className="flex gap-2 bg-white/90 dark:bg-[#182032]/90 backdrop-blur-md p-1 border border-zinc-200/80 dark:border-white/10 rounded-xl md:rounded-2xl shadow-sm">
                        <button onClick={() => changeDate(viewMode === 'WEEK' ? -7 : -30)} className="w-10 md:w-12 py-2.5 md:py-3 bg-transparent text-zinc-500 hover:bg-zinc-100 dark:hover:bg-[#2a3441] dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white rounded-lg md:rounded-xl transition-all flex items-center justify-center">
                            <SafeIcon name="chevron-left" size={16}/>
                        </button>
                        <button onClick={() => setCurrentDate(new Date())} className="px-6 py-2.5 md:py-3 bg-transparent text-[10px] md:text-[11px] font-bold text-zinc-500 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-[#2a3441] hover:text-zinc-900 dark:hover:text-white uppercase tracking-widest rounded-lg md:rounded-xl transition-all flex-1 sm:flex-none">
                            IDAG
                        </button>
                        <button onClick={() => changeDate(viewMode === 'WEEK' ? 7 : 30)} className="w-10 md:w-12 py-2.5 md:py-3 bg-transparent text-zinc-500 hover:bg-zinc-100 dark:hover:bg-[#2a3441] dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white rounded-lg md:rounded-xl transition-all flex items-center justify-center">
                            <SafeIcon name="chevron-right" size={16}/>
                        </button>
                    </div>
                </div>
            </div>

            {/* CALENDAR GRID */}
            <div className="bg-white/80 dark:bg-[#182032]/80 backdrop-blur-2xl border border-zinc-200/80 dark:border-white/10 shadow-[0_8px_30px_rgb(0,0,0,0.04)] overflow-hidden rounded-[24px] md:rounded-[32px] mx-2 md:mx-0 mb-4">
                <div className="grid grid-cols-7 divide-x divide-zinc-200/80 dark:divide-white/5">
                    {calendarDays.map(({ date, isCurrentMonth }, i) => {
                        const dStr = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
                        const allDayJobs = jobsByDate[dStr] || [];
                        const displayJobs = viewMode === 'MONTH' ? allDayJobs.slice(0, 3) : allDayJobs;
                        const extraCount = allDayJobs.length - displayJobs.length;
                        const today = isToday(date);
                        const isBlocked = blockedDates.includes(dStr);
                        
                        // Dynamisk bakgrund för spärrad dag (diagonal ränder)
                        const blockedBgClass = isBlocked ? "bg-[repeating-linear-gradient(45deg,transparent,transparent_10px,rgba(0,0,0,0.03)_10px,rgba(0,0,0,0.03)_20px)] dark:bg-[repeating-linear-gradient(45deg,transparent,transparent_10px,rgba(255,255,255,0.02)_10px,rgba(255,255,255,0.02)_20px)]" : "";

                        return (
                            <div 
                                key={i} 
                                onDragOver={(e) => { if (!isBlocked) e.preventDefault(); }} 
                                onDrop={(e) => onDrop(e, dStr)} 
                                className={`group/day min-w-0 flex flex-col transition-all border-b border-zinc-200/80 dark:border-white/5 ${viewMode === 'WEEK' ? 'min-h-[400px] md:min-h-[550px]' : 'min-h-[85px] md:min-h-[120px]'} ${!isCurrentMonth ? 'bg-zinc-50/50 dark:bg-[#121826]/30' : 'bg-transparent'} ${today && !isBlocked ? 'bg-gradient-to-b from-orange-50/50 to-transparent dark:from-orange-500/[0.03] dark:to-transparent' : ''} ${blockedBgClass}`}
                            >
                                {/* Dag-Header med Spärr-knapp */}
                                <div className={`relative p-2 md:p-4 border-b border-zinc-200/80 dark:border-white/5 transition-colors ${today ? 'bg-orange-100/30 dark:bg-orange-500/10' : 'bg-zinc-50/40 dark:bg-[#1a2235]/30'}`}>
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <div className={`text-[9px] md:text-[11px] font-black uppercase tracking-widest mb-0.5 md:mb-1 ${today ? 'text-orange-600 dark:text-orange-400' : 'text-zinc-500 dark:text-zinc-400'}`}>
                                                {weekDays[date.getDay() === 0 ? 6 : date.getDay() - 1]}
                                            </div>
                                            <div className={`text-xl md:text-3xl font-light tracking-tighter leading-none ${today ? 'text-orange-600 dark:text-orange-400 font-bold' : isBlocked ? 'text-zinc-400' : 'text-zinc-900 dark:text-white'}`}>
                                                {date.getDate()}
                                            </div>
                                        </div>
                                        {/* Spärrknapp (Lås) */}
                                        <button 
                                            onClick={(e) => { e.stopPropagation(); toggleBlockDate(dStr, isBlocked); }}
                                            className={`md:opacity-0 md:group-hover/day:opacity-100 transition-opacity p-1.5 rounded-md ${isBlocked ? 'text-red-500 bg-red-50 dark:bg-red-500/10' : 'text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-[#2a3441]'}`}
                                            title={isBlocked ? "Lås upp dag" : "Spärra dag"}
                                        >
                                            <SafeIcon name={isBlocked ? "lock" : "unlock"} size={14} />
                                        </button>
                                    </div>
                                </div>
                                
                                {/* Släpp/Klick-Yta för Jobb */}
                                <div 
                                    className={`p-1 md:p-3 space-y-1.5 md:space-y-2 flex-1 relative ${isBlocked ? 'cursor-not-allowed' : 'cursor-crosshair group/area'}`} 
                                    onClick={() => { if(!isBlocked) setView('NEW_JOB', { job: { datum: `${dStr}T08:00`, status: 'BOKAD' } })}}
                                >
                                    {displayJobs.map(job => {
                                        return (
                                            <div 
                                                key={job.id} 
                                                draggable={!isBlocked} 
                                                onDragStart={(e) => onDragStart(e, job)} 
                                                onDragEnd={(e) => e.currentTarget.style.opacity = '1'} 
                                                onClick={(e) => { e.stopPropagation(); setView('NEW_JOB', { job: job }); }} 
                                                className={`group relative bg-white dark:bg-[#1e2638] border border-zinc-200/80 dark:border-white/10 p-1.5 md:p-3 transition-all ${!isBlocked ? 'cursor-grab active:cursor-grabbing hover:border-orange-500/50 hover:shadow-lg hover:-translate-y-0.5' : ''} shadow-sm rounded-lg md:rounded-xl overflow-hidden backdrop-blur-md`}
                                            >
                                                {/* Premium 3D inre kant (Top highlight) */}
                                                <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white to-transparent opacity-50 dark:opacity-10 pointer-events-none"></div>

                                                {/* Dynamisk accent-linje baserad på status */}
                                                <div className={`absolute left-0 top-0 bottom-0 w-1 md:w-1.5 opacity-90 bg-gradient-to-b ${
                                                    job.status === 'KLAR' ? 'from-emerald-400 to-emerald-600' : 
                                                    job.status === 'OFFERERAD' ? 'from-blue-400 to-blue-600' : 
                                                    'from-orange-400 to-orange-600'
                                                }`}></div>
                                                
                                                {/* --- MOBIL VY: Strikt och ren utan att bryta text --- */}
                                                <div className="md:hidden flex flex-col justify-start pl-1.5 gap-0.5">
                                                    <span className="text-[8px] font-black text-zinc-900 dark:text-white uppercase leading-tight truncate w-full">
                                                        {job.kundnamn}
                                                    </span>
                                                    <span className="text-[7.5px] font-mono font-bold text-orange-600 dark:text-orange-400 tracking-tighter truncate">
                                                        {job.datum?.split('T')[1]?.substring(0, 5)}
                                                    </span>
                                                </div>

                                                {/* --- DESKTOP VY: Fullständig information --- */}
                                                <div className="hidden md:flex flex-col gap-1 pl-2">
                                                    <div className="text-[12px] font-black uppercase tracking-wide text-zinc-900 dark:text-white truncate group-hover:text-orange-500 transition-colors">
                                                        {job.kundnamn}
                                                    </div>
                                                    <div className="flex items-center justify-between border-t border-zinc-100 dark:border-white/5 pt-1.5 mt-1 gap-1.5">
                                                        <div className="flex items-center gap-1.5 text-[10px] text-zinc-500 dark:text-zinc-400 font-bold uppercase tracking-wider">
                                                            <SafeIcon name="clock" size={10} className="text-orange-500" />
                                                            {job.datum?.split('T')[1]?.substring(0, 5)}
                                                        </div>
                                                        {job.regnr && (
                                                            <div className="bg-zinc-100/80 dark:bg-[#121826]/80 text-zinc-600 dark:text-zinc-400 px-1.5 py-0.5 rounded border border-zinc-200/50 dark:border-white/5 font-mono font-bold text-[9px] tracking-widest truncate max-w-[60px]">
                                                                {job.regnr}
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })}

                                    {/* Visa "+X fler"-knapp */}
                                    {viewMode === 'MONTH' && extraCount > 0 && (
                                        <button 
                                            onClick={(e) => { 
                                                e.stopPropagation(); 
                                                setCurrentDate(date); 
                                                setViewMode('WEEK'); 
                                            }}
                                            className="w-full mt-1 py-1 text-[9px] font-bold uppercase tracking-widest text-zinc-500 dark:text-zinc-400 bg-zinc-100/50 dark:bg-white/5 hover:bg-orange-500/10 hover:text-orange-500 rounded-lg transition-all border border-transparent hover:border-orange-500/20 shadow-sm"
                                        >
                                            +{extraCount} fler
                                        </button>
                                    )}
                                    
                                    {/* Subtil hover-effekt för att lägga till på tomma dagar (visas ej på spärrade dagar) */}
                                    {!isBlocked && allDayJobs.length === 0 && (
                                        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover/area:opacity-100 transition-opacity pointer-events-none">
                                            <div className="w-8 h-8 rounded-full bg-zinc-100 dark:bg-[#1a2235] flex items-center justify-center shadow-sm border border-zinc-200/50 dark:border-white/5">
                                                <SafeIcon name="plus" size={16} className="text-zinc-400" />
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
    );
};
