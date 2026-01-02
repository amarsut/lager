// calendar.js

const SafeIcon = ({ name, size = 12, className = "" }) => (
    <span className="inline-flex items-center justify-center shrink-0">
        <window.Icon name={name} size={size} className={className} />
    </span>
);

window.CalendarView = ({ allJobs = [], setEditingJob, setView }) => {
    const [currentDate, setCurrentDate] = React.useState(new Date());
    const [viewMode, setViewMode] = React.useState('WEEK'); 

    const monthNames = ["Januari", "Februari", "Mars", "April", "Maj", "Juni", "Juli", "Augusti", "September", "Oktober", "November", "December"];
    const weekDays = ["Mån", "Tis", "Ons", "Tor", "Fre", "Lör", "Sön"];

    // --- 1. LOGIK FÖR DAGAR (Fixad Månadsvy) ---
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
            const day = start.getDay();
            const diff = start.getDate() - day + (day === 0 ? -6 : 1);
            start.setDate(diff);
            return [...Array(7)].map((_, i) => {
                const d = new Date(start);
                d.setDate(start.getDate() + i);
                return { date: d, isCurrentMonth: true };
            });
        } else {
            const year = currentDate.getFullYear();
            const month = currentDate.getMonth();
            const firstDay = new Date(year, month, 1);
            const lastDay = new Date(year, month + 1, 0);
            const days = [];
            const startPadding = (firstDay.getDay() + 6) % 7;
            for (let i = startPadding; i > 0; i--) {
                days.push({ date: new Date(year, month, 1 - i), isCurrentMonth: false });
            }
            for (let i = 1; i <= lastDay.getDate(); i++) {
                days.push({ date: new Date(year, month, i), isCurrentMonth: true });
            }
            return days;
        }
    }, [currentDate, viewMode]);

    const isToday = (date) => new Date().toISOString().split('T')[0] === date.toISOString().split('T')[0];

    return (
        <div className="space-y-4 animate-in fade-in duration-500 pb-20 md:pb-0">
            
            {/* 2. HEADER - Återställd till horisontell layout på Desktop */}
            <div className="bg-zinc-950 p-3 md:p-4 border-b-2 theme-border shadow-2xl relative overflow-hidden">
                <div className="absolute right-4 bottom-[-10px] text-white opacity-[0.03] text-3xl md:text-5xl font-black italic select-none">SCHEDULE_V4</div>
                
                {/* flex-col på mobil, flex-row på desktop för att linjera knappar till höger */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 md:w-10 md:h-10 theme-bg flex items-center justify-center rounded-sm">
                            <SafeIcon name="calendar" className="text-black" size={18} />
                        </div>
                        <div>
                            <h2 className="text-sm md:text-lg font-black text-white uppercase tracking-tighter italic leading-none">
                                {viewMode === 'WEEK' ? `Sequence_Week_${Math.ceil(currentDate.getDate() / 7)}` : monthNames[currentDate.getMonth()].toUpperCase()}
                            </h2>
                            <div className="flex items-center gap-2 mt-0.5">
                                <span className="w-1.5 h-1.5 rounded-full theme-bg animate-pulse"></span>
                                <span className="text-[7px] font-black text-zinc-500 uppercase tracking-widest">Pulse_Active</span>
                            </div>
                        </div>
                    </div>

                    {/* Navigeringsgrupp - Flyttas till höger på Desktop */}
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
                            <button onClick={() => { const d = new Date(currentDate); d.setDate(d.getDate() - (viewMode === 'WEEK' ? 7 : 30)); setCurrentDate(d); }} className="p-2 bg-zinc-900 text-white border border-zinc-800 hover:theme-border">
                                <SafeIcon name="chevron-left" size={14}/>
                            </button>
                            <button onClick={() => setCurrentDate(new Date())} className="px-3 py-2 bg-zinc-900 text-[9px] font-black text-white uppercase border border-zinc-800 theme-text">IDAG</button>
                            <button onClick={() => { const d = new Date(currentDate); d.setDate(d.getDate() + (viewMode === 'WEEK' ? 7 : 30)); setCurrentDate(d); }} className="p-2 bg-zinc-900 text-white border border-zinc-800 hover:theme-border">
                                <SafeIcon name="chevron-right" size={14}/>
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* 3. GRID - 7 kolumner med optimerat innehåll */}
            <div className="bg-zinc-50 border border-zinc-200 shadow-2xl overflow-hidden rounded-sm">
                <div className="grid grid-cols-7 divide-x divide-zinc-200">
                    {calendarDays.map(({ date, isCurrentMonth }, i) => {
                        const dStr = date.toISOString().split('T')[0];
                        const jobs = jobsByDate[dStr] || [];
                        const today = isToday(date);
                        
                        return (
                            <div key={i} className={`min-w-0 flex flex-col transition-all border-b border-zinc-200 
                                ${viewMode === 'WEEK' ? 'min-h-[500px] md:min-h-[650px]' : 'min-h-[100px] md:min-h-[150px]'} 
                                ${!isCurrentMonth ? 'bg-zinc-50/30' : ''} ${today ? 'bg-white' : ''}`}>
                                
                                <div className={`p-2 md:p-4 border-b transition-colors ${today ? 'bg-zinc-950' : 'bg-zinc-100/50'}`}>
                                    <div className={`text-[7px] md:text-[10px] font-black uppercase tracking-widest mb-0.5 md:mb-1 ${today ? 'theme-text' : 'text-zinc-400'}`}>
                                        {weekDays[date.getDay() === 0 ? 6 : date.getDay() - 1]}
                                    </div>
                                    <div className={`text-sm md:text-2xl font-black font-mono leading-none ${today ? 'text-white' : 'text-zinc-900'}`}>
                                        {date.getDate()}
                                    </div>
                                </div>

                                <div className="p-1 md:p-3 space-y-1.5 md:space-y-3 flex-1 bg-white/50 relative">
                                    {jobs.map(job => (
                                        <div key={job.id} onClick={() => { setEditingJob(job); setView('NEW_JOB'); }} 
                                            className="group relative bg-white border border-zinc-200 p-1.5 md:p-4 hover:border-zinc-900 transition-all cursor-pointer shadow-sm hover:shadow-xl active:scale-95 overflow-hidden rounded-sm">
                                            <div className="absolute left-0 top-0 bottom-0 w-0.5 md:w-1 theme-bg"></div>
                                            
                                            <div className="flex flex-col gap-0.5">
                                                <div className="text-[7px] md:text-[12px] font-black uppercase text-zinc-900 leading-tight group-hover:theme-text truncate">
                                                    {job.kundnamn}
                                                </div>
                                                
                                                <div className="flex flex-col md:flex-row md:items-center md:justify-between border-t border-zinc-50 pt-1 mt-1 gap-1">
                                                    <div className="flex items-center gap-1 text-[6px] md:text-[10px] text-zinc-400 font-bold">
                                                        <SafeIcon name="clock" size={10} className="theme-text" />
                                                        {job.datum?.split('T')[1]?.substring(0, 5)}
                                                    </div>
                                                    <div className="bg-zinc-900 text-white px-1 py-0.5 font-black text-[6px] md:text-[9px] tracking-tighter md:tracking-widest self-start md:self-auto">
                                                        {job.regnr}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    ))}

                                    {/* ÅTERSTÄLLD VATTENSTÄMPEL */}
                                    {jobs.length === 0 && (
                                        <div className="absolute inset-0 flex flex-col items-center justify-center opacity-[0.03] grayscale select-none pointer-events-none">
                                            <SafeIcon name="database" size={24} className="mb-1 md:size-10" />
                                            <span className="text-[6px] md:text-[10px] font-black uppercase tracking-[0.4em] rotate-90 whitespace-nowrap">Null_Sequence</span>
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
