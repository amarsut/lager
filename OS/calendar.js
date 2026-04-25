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

    const monthNames = ["Januari", "Februari", "Mars", "April", "Maj", "Juni", "Juli", "Augusti", "September", "Oktober", "November", "December"];
    const weekDays = ["Mån", "Tis", "Ons", "Tor", "Fre", "Lör", "Sön"];

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
        const jobId = e.dataTransfer.getData("jobId");
        const job = allJobs.find(j => j.id === jobId);
        if (job) {
            const timePart = job.datum?.split('T')[1] || "08:00";
            const newDatum = `${dateStr}T${timePart}`;
            try { await window.db.collection('jobs').doc(jobId).update({ datum: newDatum }); } 
            catch (err) { console.error("Failed_to_move_mission:", err); }
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
            const firstDay = new Date(year, month, 1);
            const days = [];
            const startPadding = (firstDay.getDay() + 6) % 7;
            for (let i = startPadding; i > 0; i--) { days.push({ date: new Date(year, month, 1 - i), isCurrentMonth: false }); }
            const lastDay = new Date(year, month + 1, 0).getDate();
            for (let i = 1; i <= lastDay; i++) { days.push({ date: new Date(year, month, i), isCurrentMonth: true }); }
            return days;
        }
    }, [currentDate, viewMode]);

    const isToday = (date) => date.toDateString() === new Date().toDateString();

    return (
        <div 
            className="flex flex-col min-h-screen bg-transparent text-zinc-900 dark:text-white pb-0 transition-colors duration-500 relative max-w-[1400px] ml-0 w-full animate-in fade-in slide-in-from-left-4" 
            onTouchStart={handleTouchStart} 
            onTouchEnd={handleTouchEnd}
        >
            {/* Ambient Background Glow */}
            <div className="absolute top-0 left-[-10%] w-[60%] h-[400px] bg-orange-500/10 dark:bg-orange-500/5 blur-[120px] rounded-full pointer-events-none -z-10 hidden lg:block"></div>

            {/* HEADER - Minimal top padding (pt-3) */}
            <div className="flex flex-col md:flex-row md:items-center justify-between mb-4 pb-4 border-b border-zinc-200 dark:border-white/5 gap-4 px-4 pt-2 lg:px-0 lg:pt-0">
                <div className="flex items-center gap-4 md:gap-5">
                    <div className="relative group cursor-default shrink-0">
                        <div className="absolute inset-0 bg-orange-500/40 blur-xl rounded-full transition-all duration-700 group-hover:bg-orange-500/60" />
                        <div className="relative w-12 h-12 md:w-14 md:h-14 rounded-xl md:rounded-2xl flex items-center justify-center text-white shadow-xl border border-white/20 transition-colors bg-gradient-to-br from-orange-400 to-orange-600">
                            <SafeIcon name="calendar" size={24} />
                        </div>
                    </div>
                    <div className="flex flex-col">
                        <h1 className="text-2xl md:text-3xl font-black text-zinc-900 dark:text-white uppercase tracking-tight leading-none">
                            Schedule <span className="text-zinc-400 dark:text-zinc-500 font-light">Timeline</span>
                        </h1>
                        <p className="text-[10px] md:text-[11px] font-bold text-orange-500 dark:text-orange-400 uppercase tracking-widest mt-1.5 flex items-center gap-2">
                            <span className="w-1.5 h-1.5 rounded-full bg-orange-500 animate-pulse"></span>
                            {viewMode === 'WEEK' ? `Veckoöversikt` : `Månadsöversikt: ${monthNames[currentDate.getMonth()]}`}
                        </p>
                    </div>
                </div>

                {/* CONTROLS */}
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 z-10">
                    <div className="flex bg-white dark:bg-[#1a2235] p-1 border border-zinc-200 dark:border-white/5 rounded-xl shadow-sm">
                        {['WEEK', 'MONTH'].map(m => (
                            <button key={m} onClick={() => setViewMode(m)} className={`px-5 py-2.5 text-[11px] font-bold uppercase tracking-widest rounded-lg transition-all flex-1 sm:flex-none ${viewMode === m ? 'bg-zinc-100 dark:bg-[#2a3441] text-zinc-900 dark:text-white shadow-sm' : 'text-zinc-500 hover:text-zinc-900 dark:hover:text-white'}`}>
                                {m === 'WEEK' ? 'Vecka' : 'Månad'}
                            </button>
                        ))}
                    </div>
                    <div className="flex gap-2">
                        <button onClick={() => changeDate(viewMode === 'WEEK' ? -7 : -30)} className="p-3 bg-white dark:bg-[#1a2235] text-zinc-900 dark:text-white border border-zinc-200 dark:border-white/5 rounded-xl hover:border-orange-500 dark:hover:border-orange-500 hover:text-orange-500 transition-all shadow-sm flex-1 sm:flex-none flex justify-center">
                            <SafeIcon name="chevron-left" size={16}/>
                        </button>
                        <button onClick={() => setCurrentDate(new Date())} className="px-6 py-3 bg-white dark:bg-[#1a2235] text-[11px] font-bold text-zinc-900 dark:text-white uppercase tracking-widest border border-zinc-200 dark:border-white/5 rounded-xl hover:border-orange-500 dark:hover:border-orange-500 hover:text-orange-500 transition-all shadow-sm flex-1 sm:flex-none">
                            IDAG
                        </button>
                        <button onClick={() => changeDate(viewMode === 'WEEK' ? 7 : 30)} className="p-3 bg-white dark:bg-[#1a2235] text-zinc-900 dark:text-white border border-zinc-200 dark:border-white/5 rounded-xl hover:border-orange-500 dark:hover:border-orange-500 hover:text-orange-500 transition-all shadow-sm flex-1 sm:flex-none flex justify-center">
                            <SafeIcon name="chevron-right" size={16}/>
                        </button>
                    </div>
                </div>
            </div>

            {/* CALENDAR GRID */}
            <div className="bg-white/80 dark:bg-[#182032]/80 backdrop-blur-xl border border-zinc-200/80 dark:border-white/5 shadow-sm overflow-hidden rounded-3xl mx-4 lg:mx-2 mb-0">
                <div className="grid grid-cols-7 divide-x divide-zinc-200 dark:divide-white/5">
                    {calendarDays.map(({ date, isCurrentMonth }, i) => {
                        const dStr = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
                        const allDayJobs = jobsByDate[dStr] || [];
                        // Begränsa till max 3 uppdrag per dag om vi är i månadsvy
                        const displayJobs = viewMode === 'MONTH' ? allDayJobs.slice(0, 3) : allDayJobs;
                        const extraCount = allDayJobs.length - displayJobs.length;
                        const today = isToday(date);
                        
                        return (
                            <div 
                                key={i} 
                                onDragOver={(e) => e.preventDefault()} 
                                onDrop={(e) => onDrop(e, dStr)} 
                                // Minskade min-h värden för att slippa scrolla i onödan
                                className={`min-w-0 flex flex-col transition-all border-b border-zinc-200 dark:border-white/5 ${viewMode === 'WEEK' ? 'min-h-[350px] md:min-h-[500px]' : 'min-h-[80px] md:min-h-[110px]'} ${!isCurrentMonth ? 'bg-zinc-50/50 dark:bg-[#121826]/50' : 'bg-transparent'} ${today ? 'bg-orange-50/30 dark:bg-orange-500/[0.02]' : ''}`}
                            >
                                {/* Dag-Header */}
                                <div className={`p-2 md:p-4 border-b border-zinc-200 dark:border-white/5 transition-colors ${today ? 'bg-orange-100/50 dark:bg-orange-500/10' : 'bg-zinc-50/80 dark:bg-[#1a2235]/50'}`}>
                                    <div className={`text-[9px] md:text-[11px] font-bold uppercase tracking-widest mb-0.5 md:mb-1 ${today ? 'text-orange-600 dark:text-orange-400' : 'text-zinc-500 dark:text-zinc-400'}`}>
                                        {weekDays[date.getDay() === 0 ? 6 : date.getDay() - 1]}
                                    </div>
                                    <div className={`text-lg md:text-2xl font-light tracking-tighter leading-none ${today ? 'text-orange-600 dark:text-orange-400 font-bold' : 'text-zinc-900 dark:text-white'}`}>
                                        {date.getDate()}
                                    </div>
                                </div>
                                
                                {/* Släpp/Klick-Yta för Jobb */}
                                <div 
                                    className="p-1.5 md:p-3 space-y-2 flex-1 relative cursor-crosshair group/area" 
                                    onClick={() => setView('NEW_JOB', { job: { datum: `${dStr}T08:00`, status: 'BOKAD' } })}
                                >
                                    {displayJobs.map(job => {
                                        return (
                                            <div 
                                                key={job.id} 
                                                draggable="true" 
                                                onDragStart={(e) => onDragStart(e, job)} 
                                                onDragEnd={(e) => e.currentTarget.style.opacity = '1'} 
                                                onClick={(e) => { e.stopPropagation(); setView('NEW_JOB', { job: job }); }} 
                                                className="group relative bg-white dark:bg-[#1a2235] border border-zinc-200 dark:border-white/5 p-1.5 md:p-3 hover:border-orange-500/50 dark:hover:border-orange-500/50 transition-all cursor-grab active:cursor-grabbing shadow-sm hover:shadow-md overflow-hidden rounded-lg md:rounded-xl"
                                            >
                                                {/* Dynamisk accent-linje baserad på status */}
                                                <div className={`absolute left-0 top-0 bottom-0 w-1 opacity-80 bg-gradient-to-b ${
                                                    job.status === 'KLAR' ? 'from-emerald-400 to-emerald-600' : 
                                                    job.status === 'OFFERERAD' ? 'from-blue-400 to-blue-600' : 
                                                    'from-orange-400 to-orange-600'
                                                }`}></div>
                                                
                                                {/* --- MOBIL VY: Multiline och extremt kompakt --- */}
                                                <div className="md:hidden flex flex-col justify-start pl-1 gap-[2px]">
                                                    <span className="text-[7.5px] font-bold text-zinc-900 dark:text-white uppercase leading-[8.5px] line-clamp-2 break-all">
                                                        {job.kundnamn}
                                                    </span>
                                                    <span className="text-[7px] font-mono font-bold text-orange-600 dark:text-orange-500 tracking-tighter">
                                                        {job.datum?.split('T')[1]?.substring(0, 5)}
                                                    </span>
                                                </div>

                                                {/* --- DESKTOP VY: Fullständig information --- */}
                                                <div className="hidden md:flex flex-col gap-1 pl-1.5">
                                                    <div className="text-[12px] font-bold uppercase text-zinc-900 dark:text-white truncate group-hover:text-orange-500 transition-colors">
                                                        {job.kundnamn}
                                                    </div>
                                                    <div className="flex flex-col md:flex-row md:items-center md:justify-between border-t border-zinc-100 dark:border-white/5 pt-1.5 mt-1 gap-1.5">
                                                        <div className="flex items-center gap-1.5 text-[10px] text-zinc-500 dark:text-zinc-400 font-bold uppercase tracking-wider">
                                                            <SafeIcon name="clock" size={10} className="text-orange-500" />
                                                            {job.datum?.split('T')[1]?.substring(0, 5)}
                                                        </div>
                                                        <div className="bg-zinc-100 dark:bg-[#121826] text-zinc-700 dark:text-zinc-300 px-1.5 py-0.5 rounded-md font-mono font-bold text-[10px] tracking-widest self-start border border-zinc-200 dark:border-white/5 truncate max-w-full">
                                                            {job.regnr || '-'}
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })}

                                    {/* Visa "+X fler"-knapp om det finns dolda jobb i månadsvyn */}
                                    {viewMode === 'MONTH' && extraCount > 0 && (
                                        <button 
                                            onClick={(e) => { 
                                                e.stopPropagation(); 
                                                setCurrentDate(date); 
                                                setViewMode('WEEK'); 
                                            }}
                                            className="w-full mt-1 py-1 text-[9px] font-bold text-zinc-500 dark:text-zinc-400 bg-zinc-100 dark:bg-white/5 hover:bg-orange-500/10 hover:text-orange-500 rounded-md transition-all border border-transparent hover:border-orange-500/20"
                                        >
                                            +{extraCount} fler
                                        </button>
                                    )}
                                    
                                    {/* Subtil hover-effekt för att lägga till på tomma dagar */}
                                    {allDayJobs.length === 0 && (
                                        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover/area:opacity-100 transition-opacity pointer-events-none">
                                            <SafeIcon name="plus" size={24} className="text-zinc-300 dark:text-zinc-600" />
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
