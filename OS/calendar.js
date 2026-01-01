// calendar.js

window.CalendarView = ({ allJobs = [], setEditingJob, setView }) => {
    const [currentDate, setCurrentDate] = React.useState(new Date());
    // 3. Möjlighet att växla till Vecko-vy
    const [viewMode, setViewMode] = React.useState('WEEK'); 

    const daysInMonth = (year, month) => new Date(year, month + 1, 0).getDate();
    const firstDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1).getDay();
    const startOffset = firstDayOfMonth === 0 ? 6 : firstDayOfMonth - 1;

    const monthNames = ["Januari", "Februari", "Mars", "April", "Maj", "Juni", "Juli", "Augusti", "September", "Oktober", "November", "December"];
    const weekDays = ["Mån", "Tis", "Ons", "Tor", "Fre", "Lör", "Sön"];

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

    // Funktion för att hämta dagarna för aktuell vecka
    const getWeekDays = () => {
        const start = new Date(currentDate);
        const day = start.getDay();
        const diff = start.getDate() - day + (day === 0 ? -6 : 1);
        start.setDate(diff);
        
        return [...Array(7)].map((_, i) => {
            const d = new Date(start);
            d.setDate(start.getDate() + i);
            return d;
        });
    };

    const changeMonth = (offset) => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + offset, 1));
    const changeWeek = (offset) => {
        const d = new Date(currentDate);
        d.setDate(d.getDate() + (offset * 7));
        setCurrentDate(d);
    };

    return (
        <div className="space-y-4 animate-in fade-in">
            {/* HEADER: Optimerad för två vy-lägen */}
            <div className="theme-sidebar p-4 border-l-4 theme-border flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 shadow-lg">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 theme-bg flex items-center justify-center rounded-sm shadow-lg">
                        <window.Icon name="calendar" className="text-black" size={20} />
                    </div>
                    <div>
                        <span className="text-[9px] font-black theme-text uppercase tracking-[0.3em] block leading-none mb-1">Matrix_Schedule</span>
                        <h2 className="text-xl font-black text-white uppercase leading-none">
                            {viewMode === 'MONTH' ? monthNames[currentDate.getMonth()] : `Vecka ${Math.ceil(currentDate.getDate() / 7)}`}
                        </h2>
                    </div>
                </div>
                
                <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto justify-end">
                    {/* Vy-väljare: Grupperad separat */}
                    <div className="bg-zinc-800/50 p-1 rounded-sm flex border border-zinc-700">
                        <button 
                            onClick={() => setViewMode('MONTH')} 
                            className={`px-3 py-1.5 text-[9px] font-black uppercase transition-all ${viewMode === 'MONTH' ? 'theme-bg text-black shadow-md' : 'text-zinc-500 hover:text-zinc-300'}`}
                        >
                            Månad
                        </button>
                        <button 
                            onClick={() => setViewMode('WEEK')} 
                            className={`px-3 py-1.5 text-[9px] font-black uppercase transition-all ${viewMode === 'WEEK' ? 'theme-bg text-black shadow-md' : 'text-zinc-500 hover:text-zinc-300'}`}
                        >
                            Vecka
                        </button>
                    </div>

                    {/* Navigering: Grupperad separat */}
                    <div className="flex items-center gap-1">
                        <button onClick={() => viewMode === 'MONTH' ? changeMonth(-1) : changeWeek(-1)} className="p-2 bg-zinc-800 text-white border border-zinc-700 hover:theme-border transition-all">
                            <window.Icon name="chevron-left" size={16}/>
                        </button>
                        <button onClick={() => setCurrentDate(new Date())} className="px-4 py-2 bg-zinc-800 text-[10px] font-black text-white uppercase border border-zinc-700 hover:theme-border transition-all">
                            Idag
                        </button>
                        <button onClick={() => viewMode === 'MONTH' ? changeMonth(1) : changeWeek(1)} className="p-2 bg-zinc-800 text-white border border-zinc-700 hover:theme-border transition-all">
                            <window.Icon name="chevron-right" size={16}/>
                        </button>
                    </div>
                </div>
            </div>

            {/* GRID: Nu med bättre kolumnbredd för veckovyn */}
            <div className="bg-white border border-zinc-200 shadow-2xl rounded-sm overflow-hidden">
                <div className="overflow-x-auto no-scrollbar">
                    {viewMode === 'MONTH' ? (
                        <div className="min-w-[600px]">
                            <div className="grid grid-cols-7 bg-zinc-900 text-[9px] font-black text-zinc-500 uppercase py-3 text-center border-b border-zinc-800">
                                {weekDays.map(d => <div key={d}>{d}</div>)}
                            </div>
                            <div className="grid grid-cols-7 auto-rows-[minmax(120px,auto)]">
                                {[...Array(startOffset)].map((_, i) => <div key={i} className="border-b border-r border-zinc-100 bg-zinc-50/30"></div>)}
                                {[...Array(daysInMonth(currentDate.getFullYear(), currentDate.getMonth()))].map((_, i) => {
                                    const day = i + 1;
                                    const dStr = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
                                    const jobs = jobsByDate[dStr] || [];
                                    const isT = new Date().toISOString().split('T')[0] === dStr;
                                    return (
                                        <div key={day} className={`border-b border-r border-zinc-100 p-2 relative transition-all ${isT ? 'bg-orange-50/40' : 'hover:bg-zinc-50/50'}`}>
                                            <div className={`text-[12px] font-black font-mono mb-2 ${isT ? 'theme-text underline decoration-2' : 'text-zinc-300'}`}>{day}</div>
                                            <div className="space-y-1.5">
                                                {jobs.map(job => (
                                                    <div key={job.id} onClick={() => { setEditingJob(job); setView('NEW_JOB'); }} className="bg-zinc-900 border-l-2 theme-border shadow-md cursor-pointer hover:translate-y-[-1px] transition-all">
                                                        <div className="px-1.5 py-1 text-[9px] font-black uppercase text-white truncate border-b border-zinc-800/50">{job.kundnamn}</div>
                                                        <div className="flex text-[8px] font-black font-mono">
                                                            <div className="flex-1 px-1.5 py-0.5 text-zinc-400 bg-zinc-800/50">{job.datum?.split('T')[1]}</div>
                                                            <div className="px-1.5 py-0.5 theme-bg text-black">{job.regnr}</div>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    ) : (
                        /* VECKO-VY: Optimerad bredd och ledigt-markering */
                        <div className="min-w-[800px] flex divide-x divide-zinc-100">
                            {getWeekDays().map(date => {
                                const dStr = date.toISOString().split('T')[0];
                                const jobs = jobsByDate[dStr] || [];
                                const isT = new Date().toISOString().split('T')[0] === dStr;
                                return (
                                    <div key={dStr} className={`flex-1 min-h-[500px] transition-all ${isT ? 'bg-orange-50/20' : 'hover:bg-zinc-50/30'}`}>
                                        <div className="bg-zinc-900 p-3 text-center border-b border-zinc-800">
                                            <div className="text-[9px] font-black text-zinc-500 uppercase tracking-widest mb-1">{weekDays[date.getDay() === 0 ? 6 : date.getDay() - 1]}</div>
                                            <div className={`text-xl font-black font-mono ${isT ? 'theme-text' : 'text-white'}`}>{date.getDate()}</div>
                                        </div>
                                        <div className="p-3 space-y-3">
                                            {jobs.map(job => (
                                                <div key={job.id} onClick={() => { setEditingJob(job); setView('NEW_JOB'); }} className="bg-zinc-900 border-l-4 theme-border p-3 shadow-xl cursor-pointer hover:scale-[1.02] transition-all">
                                                    <div className="text-[11px] font-black uppercase text-white mb-2 leading-tight">{job.kundnamn}</div>
                                                    <div className="flex justify-between items-center text-[10px] font-mono border-t border-zinc-800 pt-2">
                                                        <span className="text-zinc-400 font-bold flex items-center gap-1">
                                                            <window.Icon name="clock" size={10} className="theme-text" />
                                                            {job.datum?.split('T')[1]}
                                                        </span>
                                                        <span className="theme-bg text-black px-1.5 py-0.5 font-black uppercase">{job.regnr}</span>
                                                    </div>
                                                </div>
                                            ))}
                                            {jobs.length === 0 && (
                                                <div className="flex flex-col items-center justify-center py-20 opacity-10">
                                                    <window.Icon name="coffee" size={24} className="mb-2" />
                                                    <span className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Ledigt</span>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
