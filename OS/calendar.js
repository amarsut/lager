// calendar.js

const SafeIcon = ({ name, size = 12, className = "" }) => (
    <span className="inline-flex items-center justify-center shrink-0">
        <window.Icon name={name} size={size} className={className} />
    </span>
);

window.CalendarView = ({ allJobs = [], setEditingJob, setView }) => {
    const [currentDate, setCurrentDate] = React.useState(new Date());
    const [viewMode, setViewMode] = React.useState('WEEK');
    const [touchStart, setTouchStart] = React.useState(null); // För Swipe

    const monthNames = ["Januari", "Februari", "Mars", "April", "Maj", "Juni", "Juli", "Augusti", "September", "Oktober", "November", "December"];
    const weekDays = ["Mån", "Tis", "Ons", "Tor", "Fre", "Lör", "Sön"];

    // --- 1. NAVIGERING & SWIPE LOGIK ---
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

    // --- 2. DRAG & DROP LOGIK ---
    const onDragStart = (e, job) => {
        e.dataTransfer.setData("jobId", job.id);
        e.currentTarget.style.opacity = '0.4';
    };

    const onDrop = async (e, dateStr) => {
        e.preventDefault();
        const jobId = e.dataTransfer.getData("jobId");
        const job = allJobs.find(j => j.id === jobId);
        
        if (job) {
            const timePart = job.datum.split('T')[1] || "08:00";
            const newDatum = `${dateStr}T${timePart}`;
            
            // Uppdaterar direkt i Firebase
            try {
                await window.db.collection('jobs').doc(jobId).update({ datum: newDatum });
            } catch (err) {
                console.error("Failed_to_move_mission:", err);
            }
        }
    };

    // --- 3. DATABEREDNING ---
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
            // NY LOGIK: "Rullande vecka" (Igår + 6 dagar framåt)
            const start = new Date(currentDate);
            start.setDate(start.getDate() - 1); // Backa 1 dag

            return [...Array(7)].map((_, i) => {
                const d = new Date(start);
                d.setDate(start.getDate() + i);
                return { date: d, isCurrentMonth: true };
            });
        } else {
            // MÅNADSVY (Oförändrad)
            const year = currentDate.getFullYear();
            const month = currentDate.getMonth();
            const firstDay = new Date(year, month, 1);
            const days = [];
            const startPadding = (firstDay.getDay() + 6) % 7;
            for (let i = startPadding; i > 0; i--) {
                days.push({ date: new Date(year, month, 1 - i), isCurrentMonth: false });
            }
            const lastDay = new Date(year, month + 1, 0).getDate();
            for (let i = 1; i <= lastDay; i++) {
                days.push({ date: new Date(year, month, i), isCurrentMonth: true });
            }
            return days;
        }
    }, [currentDate, viewMode]);

    const isToday = (date) => date.toDateString() === new Date().toDateString();

    return (
        <div 
            className="space-y-4 animate-in fade-in duration-500 pb-20 md:pb-0"
            onTouchStart={handleTouchStart}
            onTouchEnd={handleTouchEnd}
        >
            {/* HEADER */}
            <div className="bg-zinc-950 p-3 md:p-4 border-b-2 theme-border shadow-2xl relative overflow-hidden">
                <div className="absolute right-4 bottom-[-10px] text-white opacity-[0.03] text-3xl md:text-5xl font-black italic select-none pointer-events-none">SCHEDULE_V4</div>
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 md:w-10 md:h-10 theme-bg flex items-center justify-center rounded-sm">
                            <SafeIcon name="calendar" className="text-black" size={18} />
                        </div>
                        <div>
                            <h2 className="text-sm md:text-lg font-black text-white uppercase tracking-tighter italic leading-none">
                                {viewMode === 'WEEK' ? `Week_Sequence` : monthNames[currentDate.getMonth()].toUpperCase()}
                            </h2>
                            <div className="flex items-center gap-2 mt-0.5">
                                <span className="w-1.5 h-1.5 rounded-full theme-bg animate-pulse"></span>
                                <span className="text-[7px] font-black text-zinc-500 uppercase tracking-widest">Pulse_Active</span>
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center justify-between md:justify-end gap-2 md:gap-4">
                        <div className="flex bg-zinc-900 p-1 border border-zinc-800 rounded-sm">
                            {['WEEK', 'MONTH'].map(m => (
                                <button key={m} onClick={() => setViewMode(m)} 
                                    className={`px-3 md:px-4 py-1.5 text-[8px] md:text-[9px] font-black uppercase transition-all ${viewMode === m ? 'theme-bg text-black' : 'text-zinc-500 hover:text-white'}`}>
                                    {m === 'WEEK' ? 'Vecka' : 'Månad'}
                                </button>
                            ))}
                        </div>
                        <div className="flex gap-1">
                            <button onClick={() => changeDate(viewMode === 'WEEK' ? -7 : -30)} className="p-2 bg-zinc-900 text-white border border-zinc-800 hover:theme-border transition-all">
                                <SafeIcon name="chevron-left" size={14}/>
                            </button>
                            <button onClick={() => setCurrentDate(new Date())} className="px-3 py-2 bg-zinc-900 text-[9px] font-black text-white uppercase border border-zinc-800 theme-text">IDAG</button>
                            <button onClick={() => changeDate(viewMode === 'WEEK' ? 7 : 30)} className="p-2 bg-zinc-900 text-white border border-zinc-800 hover:theme-border transition-all">
                                <SafeIcon name="chevron-right" size={14}/>
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* GRID */}
            <div className="bg-zinc-50 border border-zinc-200 shadow-2xl overflow-hidden rounded-sm">
                <div className="grid grid-cols-7 divide-x divide-zinc-200">
                    {calendarDays.map(({ date, isCurrentMonth }, i) => {
                        const dStr = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
                        const jobs = jobsByDate[dStr] || [];
                        const today = isToday(date);
                        
                        return (
                            <div 
                                key={i} 
                                onDragOver={(e) => e.preventDefault()}
                                onDrop={(e) => onDrop(e, dStr)}
                                className={`min-w-0 flex flex-col transition-all border-b border-zinc-200 
                                    ${viewMode === 'WEEK' ? 'min-h-[500px] md:min-h-[650px]' : 'min-h-[100px] md:min-h-[150px]'} 
                                    ${!isCurrentMonth ? 'bg-zinc-50/30' : ''} ${today ? 'bg-white' : ''}`}
                            >
                                <div className={`p-2 md:p-4 border-b transition-colors ${today ? 'bg-zinc-950' : 'bg-zinc-100/50'}`}>
                                    <div className={`text-[7px] md:text-[10px] font-black uppercase tracking-widest mb-0.5 md:mb-1 ${today ? 'theme-text' : 'text-zinc-400'}`}>
                                        {weekDays[date.getDay() === 0 ? 6 : date.getDay() - 1]}
                                    </div>
                                    <div className={`text-sm md:text-2xl font-black font-mono leading-none ${today ? 'text-white' : 'text-zinc-900'}`}>
                                        {date.getDate()}
                                    </div>
                                </div>

                                <div 
                                    className="p-1 md:p-3 space-y-1.5 md:space-y-3 flex-1 bg-white/50 relative cursor-crosshair"
                                    onClick={() => setView('NEW_JOB', { job: { datum: `${dStr}T08:00`, status: 'BOKAD' } })}
                                >
                                    {jobs.map(job => (
                                        <div 
                                            key={job.id} 
                                            draggable="true"
                                            onDragStart={(e) => onDragStart(e, job)}
                                            onDragEnd={(e) => e.currentTarget.style.opacity = '1'}
                                            onClick={(e) => { e.stopPropagation(); setView('NEW_JOB', { job: job }); }}
                                            className="group relative bg-white border border-zinc-200 p-1.5 md:p-4 hover:border-zinc-900 transition-all cursor-grab active:cursor-grabbing shadow-sm hover:shadow-xl overflow-hidden rounded-sm"
                                        >
                                            <div className="absolute left-0 top-0 bottom-0 w-0.5 md:w-1 theme-bg"></div>
                                            <div className="flex flex-col gap-0.5">
                                                <div className="text-[7px] md:text-[12px] font-black uppercase text-zinc-900 truncate group-hover:theme-text transition-colors">
                                                    {job.kundnamn}
                                                </div>
                                                <div className="flex flex-col md:flex-row md:items-center md:justify-between border-t border-zinc-50 pt-1 mt-1 gap-1">
                                                    <div className="flex items-center gap-1 text-[6px] md:text-[10px] text-zinc-400 font-bold uppercase">
                                                        <SafeIcon name="clock" size={10} className="theme-text" />
                                                        {job.datum?.split('T')[1]?.substring(0, 5)}
                                                    </div>
                                                    <div className="bg-zinc-900 text-white px-1 py-0.5 font-black text-[6px] md:text-[9px] tracking-tighter self-start">
                                                        {job.regnr}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    ))}

                                    {/* NULL_SEQUENCE WATERMARK */}
                                    {jobs.length === 0 && (
                                        <div className="text-[10px] font-black text-zinc-300 uppercase tracking-tighter flex items-center justify-center">
                                            <SafeIcon name="calendar-off" size={12} /> 
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
