// calendar.js

const SafeIcon = ({ name, size = 12, className = "" }) => (
    <span className="inline-flex items-center justify-center shrink-0">
        <window.Icon name={name} size={size} className={className} />
    </span>
);

// Notera: Jag la till 'onUpdateJob' i props så du kan spara ändringen när man drar ett jobb
window.CalendarView = ({ allJobs = [], setEditingJob, setView, onUpdateJob }) => {
    const [currentDate, setCurrentDate] = React.useState(new Date());
    const [viewMode, setViewMode] = React.useState('WEEK'); 
    const [touchStart, setTouchStart] = React.useState(null);

    const monthNames = ["Januari", "Februari", "Mars", "April", "Maj", "Juni", "Juli", "Augusti", "September", "Oktober", "November", "December"];
    const weekDays = ["Mån", "Tis", "Ons", "Tor", "Fre", "Lör", "Sön"];

    // --- SWIPE LOGIK (Tips 14) ---
    const handleTouchStart = (e) => setTouchStart(e.targetTouches[0].clientX);
    const handleTouchEnd = (e) => {
        if (!touchStart) return;
        const touchEnd = e.changedTouches[0].clientX;
        if (touchStart - touchEnd > 70) changeDate(1); // Swipe vänster -> Nästa
        if (touchStart - touchEnd < -70) changeDate(-1); // Swipe höger -> Bakåt
    };

    const changeDate = (days) => {
        const d = new Date(currentDate);
        d.setDate(d.getDate() + days);
        setCurrentDate(d);
    };

    // --- DRAG & DROP LOGIK ---
    const onDragStart = (e, job) => {
        e.dataTransfer.setData("jobId", job.id);
        e.currentTarget.style.opacity = '0.4';
    };

    const onDrop = (e, dateStr) => {
        e.preventDefault();
        const jobId = e.dataTransfer.getData("jobId");
        const job = allJobs.find(j => j.id === jobId);
        if (job && onUpdateJob) {
            // Bevara tiden men byt datum
            const timePart = job.datum.split('T')[1] || "08:00";
            const newDatum = `${dateStr}T${timePart}`;
            onUpdateJob({ ...job, datum: newDatum });
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
        Object.keys(map).forEach(date => {
            map[date].sort((a, b) => (a.datum.split('T')[1] || '').localeCompare(b.datum.split('T')[1] || ''));
        });
        return map;
    }, [allJobs]);

    // --- ÄNDRAD VY: 2 dagar bakåt, 5 dagar framåt ---
    const getSequenceDays = () => {
        return [...Array(8)].map((_, i) => {
            const d = new Date(currentDate);
            d.setDate(currentDate.getDate() - 2 + i);
            return d;
        });
    };

    const isToday = (date) => new Date().toISOString().split('T')[0] === date.toISOString().split('T')[0];

    return (
        <div 
            className="space-y-4 animate-in fade-in duration-500"
            onTouchStart={handleTouchStart}
            onTouchEnd={handleTouchEnd}
        >
            {/* MOBILANPASSAD HEADER */}
            <div className="bg-zinc-950 p-4 flex flex-col sm:flex-row items-center justify-between border-b-2 theme-border shadow-2xl overflow-hidden relative gap-4">
                <div className="absolute right-4 bottom-[-10px] text-white opacity-[0.03] text-5xl font-black italic select-none">SCHEDULE_V4</div>
                
                <div className="flex items-center gap-4 z-10 w-full sm:w-auto">
                    <div className="w-10 h-10 theme-bg flex items-center justify-center rounded-sm">
                        <SafeIcon name="calendar" className="text-black" size={20} />
                    </div>
                    <div>
                        <h2 className="text-lg font-black text-white uppercase tracking-tighter italic">
                            {viewMode === 'WEEK' ? `Sequence_Range` : monthNames[currentDate.getMonth()].toUpperCase()}
                        </h2>
                        <div className="flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full theme-bg animate-pulse"></span>
                            <span className="text-[8px] font-black text-zinc-500 uppercase tracking-[0.3em]">System_Pulse_Active</span>
                        </div>
                    </div>
                </div>

                <div className="flex flex-wrap items-center justify-center gap-2 z-10 w-full sm:w-auto">
                    <div className="flex bg-zinc-900 p-1 border border-zinc-800">
                        {['WEEK', 'MONTH'].map(m => (
                            <button key={m} onClick={() => setViewMode(m)} className={`px-4 py-1.5 text-[9px] font-black uppercase transition-all ${viewMode === m ? 'theme-bg text-black' : 'text-zinc-500 hover:text-white'}`}>
                                {m === 'WEEK' ? 'Sekvens' : 'Månad'}
                            </button>
                        ))}
                    </div>
                    <div className="flex gap-1">
                        <button onClick={() => changeDate(-7)} className="p-2 bg-zinc-900 text-white border border-zinc-800 hover:theme-border transition-all">
                            <SafeIcon name="chevron-left" size={16}/>
                        </button>
                        <button onClick={() => setCurrentDate(new Date())} className="px-4 py-2 bg-zinc-900 text-[10px] font-black text-white uppercase border border-zinc-800 hover:theme-border transition-all">IDAG</button>
                        <button onClick={() => changeDate(7)} className="p-2 bg-zinc-900 text-white border border-zinc-800 hover:theme-border transition-all">
                            <SafeIcon name="chevron-right" size={16}/>
                        </button>
                    </div>
                </div>
            </div>

            <div className="bg-zinc-50 border border-zinc-200 shadow-2xl overflow-x-auto rounded-sm">
                <div className="inline-grid grid-cols-8 divide-x divide-zinc-200 min-w-full">
                    {getSequenceDays().map(date => {
                        const dStr = date.toISOString().split('T')[0];
                        const jobs = jobsByDate[dStr] || [];
                        const today = isToday(date);
                        
                        return (
                            <div 
                                key={dStr} 
                                className={`min-w-[140px] min-h-[600px] flex flex-col transition-all ${today ? 'bg-white' : ''}`}
                                onDragOver={(e) => e.preventDefault()}
                                onDrop={(e) => onDrop(e, dStr)}
                            >
                                <div className={`p-4 border-b transition-colors ${today ? 'bg-zinc-950' : 'bg-zinc-100/50'}`}>
                                    <div className={`text-[10px] font-black uppercase tracking-[0.2em] mb-1 ${today ? 'theme-text' : 'text-zinc-400'}`}>
                                        {weekDays[date.getDay() === 0 ? 6 : date.getDay() - 1]}
                                    </div>
                                    <div className={`text-2xl font-black font-mono leading-none ${today ? 'text-white' : 'text-zinc-900'}`}>
                                        {date.getDate()}
                                    </div>
                                </div>

                                {/* Tips 4: Quick-Add yta (klicka på tomrum för att skapa nytt jobb) */}
                                <div 
                                    className="p-3 space-y-3 flex-1 bg-white/50 cursor-crosshair"
                                    onClick={(e) => {
                                        if (e.target === e.currentTarget) {
                                            setEditingJob({ datum: `${dStr}T08:00` });
                                            setView('NEW_JOB');
                                        }
                                    }}
                                >
                                    {jobs.map(job => (
                                        <div 
                                            key={job.id} 
                                            draggable="true"
                                            onDragStart={(e) => onDragStart(e, job)}
                                            onDragEnd={(e) => e.currentTarget.style.opacity = '1'}
                                            onClick={(e) => { e.stopPropagation(); setEditingJob(job); setView('NEW_JOB'); }} 
                                            className="group relative bg-white border border-zinc-200 p-4 hover:border-zinc-900 transition-all cursor-grab active:cursor-grabbing shadow-sm hover:shadow-xl overflow-hidden"
                                            title={`Klicka för att redigera ${job.kundnamn}\nRegnr: ${job.regnr}`} // Tips 2: Enkel tooltip
                                        >
                                            <div className="absolute left-0 top-0 bottom-0 w-1 theme-bg"></div>
                                            <div className="flex justify-between items-start mb-2">
                                                <div className="text-[12px] font-black uppercase text-zinc-900 leading-tight group-hover:theme-text transition-colors truncate pr-2">
                                                    {job.kundnamn}
                                                </div>
                                                <div className="w-1.5 h-1.5 rounded-full theme-bg shrink-0"></div>
                                            </div>
                                            <div className="flex items-center justify-between text-[10px] font-mono border-t border-zinc-50 pt-2 mt-2">
                                                <div className="flex items-center gap-1.5 text-zinc-500 font-bold">
                                                    <SafeIcon name="clock" size={12} className="theme-text" />
                                                    {job.datum?.split('T')[1]?.substring(0,5)}
                                                </div>
                                                <div className="bg-zinc-900 text-white px-2 py-0.5 font-black text-[9px] tracking-widest">
                                                    {job.regnr}
                                                </div>
                                            </div>
                                        </div>
                                    ))}

                                    {jobs.length === 0 && (
                                        <div className="h-full flex flex-col items-center justify-center py-20 opacity-[0.05] grayscale select-none pointer-events-none">
                                            <SafeIcon name="database" size={40} className="mb-2" />
                                            <span className="text-[10px] font-black uppercase tracking-[0.4em] rotate-90 whitespace-nowrap">Null_Sequence</span>
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
