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
            const timePart = job.datum.split('T')[1] || "08:00";
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
        <div className="space-y-4 animate-in fade-in duration-500 pb-20 md:pb-0 bg-transparent transition-colors duration-300" onTouchStart={handleTouchStart} onTouchEnd={handleTouchEnd}>
            
            {/* BMG HEADER MED TYDLIG LINJE */}
            <div className="flex flex-col md:flex-row md:items-center justify-between mb-4 pb-4 border-b border-zinc-200 dark:border-white/5 gap-4 px-5 pt-5 md:px-0 md:pt-0 px-5 pt-6 md:px-0 md:pt-0">
                <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-orange-500 rounded-[4px] flex items-center justify-center text-black font-bold shadow-[0_0_20px_rgba(249,115,22,0.3)] shrink-0">
                        <SafeIcon name="calendar" size={20} />
                    </div>
                    <div className="flex flex-col">
                        <h1 className="text-xl md:text-2xl font-black text-black dark:text-white uppercase tracking-tighter leading-none drop-shadow-sm dark:drop-shadow-none">
                            Schedule <span className="text-zinc-400 dark:text-zinc-600">Timeline</span>
                        </h1>
                        <p className="text-[11px] font-bold text-zinc-500 uppercase tracking-widest mt-1.5">
                            {viewMode === 'WEEK' ? `Veckoöversikt` : `Månadsöversikt: ${monthNames[currentDate.getMonth()]}`}
                        </p>
                    </div>
                </div>

                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4">
                    <div className="flex bg-white dark:bg-[#182032] p-1 border border-zinc-200 dark:border-white/5 rounded-md shadow-sm dark:shadow-md">
                        {['WEEK', 'MONTH'].map(m => (
                            <button key={m} onClick={() => setViewMode(m)} className={`px-4 py-2 text-[10px] font-black uppercase tracking-wider rounded-[4px] transition-all flex-1 sm:flex-none ${viewMode === m ? 'bg-black dark:bg-[#25324d] text-white' : 'text-zinc-500 hover:text-black dark:hover:text-white'}`}>
                                {m === 'WEEK' ? 'Vecka' : 'Månad'}
                            </button>
                        ))}
                    </div>
                    <div className="flex gap-2">
                        <button onClick={() => changeDate(viewMode === 'WEEK' ? -7 : -30)} className="p-2.5 bg-white dark:bg-[#182032] text-zinc-900 dark:text-white border border-zinc-200 dark:border-white/5 rounded-[4px] hover:border-orange-500 dark:hover:border-orange-500 transition-all shadow-sm dark:shadow-none flex-1 sm:flex-none flex justify-center">
                            <SafeIcon name="chevron-left" size={14}/>
                        </button>
                        <button onClick={() => setCurrentDate(new Date())} className="px-4 py-2.5 bg-white dark:bg-[#121826] text-[10px] font-black text-zinc-900 dark:text-white uppercase border border-zinc-200 dark:border-[#1a2235] rounded-[4px] hover:border-orange-500 dark:hover:border-orange-500 transition-all shadow-sm dark:shadow-none">IDAG</button>
                        <button onClick={() => changeDate(viewMode === 'WEEK' ? 7 : 30)} className="p-2.5 bg-white dark:bg-[#182032] text-zinc-900 dark:text-white border border-zinc-200 dark:border-white/5 rounded-[4px] hover:border-orange-500 dark:hover:border-orange-500 transition-all shadow-sm dark:shadow-none flex-1 sm:flex-none flex justify-center">
                            <SafeIcon name="chevron-right" size={14}/>
                        </button>
                    </div>
                </div>
            </div>

            {/* GRID */}
            <div className="bg-zinc-50 dark:bg-[#182032] border border-zinc-200 dark:border-white/5 shadow-sm dark:shadow-md overflow-hidden rounded-xl">
                <div className="grid grid-cols-7 divide-x divide-zinc-200 dark:divide-white/5">
                    {calendarDays.map(({ date, isCurrentMonth }, i) => {
                        const dStr = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
                        const jobs = jobsByDate[dStr] || [];
                        const today = isToday(date);
                        
                        return (
                            <div key={i} onDragOver={(e) => e.preventDefault()} onDrop={(e) => onDrop(e, dStr)} className={`min-w-0 flex flex-col transition-all border-b border-zinc-200 dark:border-white/5 ${viewMode === 'WEEK' ? 'min-h-[500px] md:min-h-[650px]' : 'min-h-[100px] md:min-h-[150px]'} ${!isCurrentMonth ? 'bg-zinc-50/30 dark:bg-[#0f1522]/30' : 'dark:bg-transparent'} ${today ? 'bg-white dark:bg-[#1f2940]/50' : ''}`}>
                                <div className={`p-2 md:p-4 border-b dark:border-white/5 transition-colors ${today ? 'bg-zinc-950 dark:bg-[#1f2940]' : 'bg-zinc-100/50 dark:bg-transparent'}`}>
                                    <div className={`text-[7px] md:text-[10px] font-black uppercase tracking-widest mb-0.5 md:mb-1 ${today ? 'theme-text' : 'text-zinc-400 dark:text-zinc-500'}`}>{weekDays[date.getDay() === 0 ? 6 : date.getDay() - 1]}</div>
                                    <div className={`text-sm md:text-2xl font-black font-mono leading-none ${today ? 'text-white' : 'text-zinc-900 dark:text-zinc-300'}`}>{date.getDate()}</div>
                                </div>
                                <div className="p-1 md:p-3 space-y-1.5 md:space-y-3 flex-1 bg-white/50 dark:bg-transparent relative cursor-crosshair" onClick={() => setView('NEW_JOB', { job: { datum: `${dStr}T08:00`, status: 'BOKAD' } })}>
                                    {jobs.map(job => (
                                        <div key={job.id} draggable="true" onDragStart={(e) => onDragStart(e, job)} onDragEnd={(e) => e.currentTarget.style.opacity = '1'} onClick={(e) => { e.stopPropagation(); setView('NEW_JOB', { job: job }); }} className="group relative bg-white dark:bg-[#25324d] border border-zinc-200 dark:border-white/10 p-1.5 md:p-4 hover:border-zinc-900 dark:hover:border-white/30 transition-all cursor-grab active:cursor-grabbing shadow-sm dark:shadow-md hover:shadow-xl overflow-hidden rounded-md">
                                            <div className="absolute left-0 top-0 bottom-0 w-0.5 md:w-1 theme-bg"></div>
                                            <div className="flex flex-col gap-0.5">
                                                <div className="text-[7px] md:text-[12px] font-black uppercase text-zinc-900 dark:text-white truncate group-hover:theme-text transition-colors">{job.kundnamn}</div>
                                                <div className="flex flex-col md:flex-row md:items-center md:justify-between border-t border-zinc-50 dark:border-white/5 pt-1 mt-1 gap-1">
                                                    <div className="flex items-center gap-1 text-[6px] md:text-[10px] text-zinc-400 dark:text-zinc-500 font-bold uppercase"><SafeIcon name="clock" size={10} className="theme-text" />{job.datum?.split('T')[1]?.substring(0, 5)}</div>
                                                    <div className="bg-zinc-900 dark:bg-[#0f1522] text-white dark:text-zinc-300 px-1 py-0.5 font-black text-[6px] md:text-[9px] tracking-tighter self-start">{job.regnr}</div>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                    {jobs.length === 0 && <div className="text-[10px] font-black text-zinc-300 dark:text-zinc-700 uppercase tracking-tighter flex items-center justify-center"><SafeIcon name="calendar-off" size={12} /></div>}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
};
