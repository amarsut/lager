// dashboard.js

const formatDate = (dateStr) => {
    if (!dateStr) return null;
    const d = new Date(dateStr);
    const months = ['jan', 'feb', 'mar', 'apr', 'maj', 'jun', 'jul', 'aug', 'sep', 'okt', 'nov', 'dec'];
    return `${d.getDate()} ${months[d.getMonth()]}`;
};

const SafeIcon = ({ name, size = 14, className = "" }) => (
    <span className="inline-flex items-center justify-center shrink-0">
        <window.Icon name={name} size={size} className={className} />
    </span>
);

window.Badge = React.memo(({ status }) => {
    const s = (status || 'BOKAD').toUpperCase();
    const styles = {
        'BOKAD': 'theme-bg text-black font-black',
        'OFFERERAD': 'bg-blue-500 text-white font-bold',
        'KLAR': 'bg-black text-white font-bold',
        'FAKTURERAS': 'bg-zinc-100 text-zinc-500 border border-zinc-200',
    };
    return (
        <span className={`px-2 py-0.5 text-[8px] uppercase tracking-[0.1em] inline-block w-18 text-center rounded-[2px] ${styles[s] || styles['BOKAD']}`}>
            {s}
        </span>
    );
});

window.DashboardView = React.memo(({ 
    filteredJobs, setView, 
    activeFilter, setActiveFilter, statusCounts,
    globalSearch, setGlobalSearch 
}) => {
    const [searchOpen, setSearchOpen] = React.useState(false);
    const [currentTime, setCurrentTime] = React.useState(new Date().toLocaleTimeString('sv-SE', { hour: '2-digit', minute: '2-digit' }));

    React.useEffect(() => {
        const timer = setInterval(() => {
            setCurrentTime(new Date().toLocaleTimeString('sv-SE', { hour: '2-digit', minute: '2-digit' }));
        }, 60000);
        return () => clearInterval(timer);
    }, []);

    const FilterButton = ({ label }) => (
        <button 
            onClick={() => setActiveFilter(label)} 
            className={`
                px-3 py-1.5 text-[9px] font-black uppercase transition-all flex items-center gap-1.5 rounded-sm shrink-0
                ${activeFilter === label 
                    ? 'theme-bg text-black shadow-lg scale-105' 
                    : 'bg-zinc-900 text-zinc-500 border border-zinc-800 hover:text-zinc-300'}
            `}
        >
            {label} 
            <span className={`
                text-[8px] px-1 rounded-[1px] font-mono
                ${activeFilter === label ? 'bg-black/20 text-black' : 'bg-zinc-800 text-zinc-600'}
            `}>
                {statusCounts[label] || 0}
            </span>
        </button>
    );

    return (
        <div className="min-h-screen bg-zinc-200/60 pb-20 lg:pb-0 animate-in fade-in duration-500">
            
            {/* --- COMPACT MISSION CONTROL HEADER --- */}
            <div className="bg-[#0a0a0a] border-b theme-border shadow-xl relative overflow-hidden">
                {/* Subtle Scanlines */}
                <div className="absolute inset-0 opacity-[0.02] pointer-events-none bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] bg-[length:100%_2px,3px_100%]"></div>
                
                <div className="px-4 py-3 relative z-10">
                    <div className="flex items-center justify-between h-9 gap-3">
                        
                        {/* Branding - Hides on mobile search */}
                        {!searchOpen && (
                            <div className="flex items-center gap-3 animate-in fade-in slide-in-from-left-2">
                                <div className="w-8 h-8 theme-bg flex items-center justify-center rounded-sm shrink-0 shadow-inner">
                                    <SafeIcon name="grid" size={16} className="text-black" />
                                </div>
                                <div className="leading-none">
                                    <div className="flex items-center gap-1.5 mb-0.5">
                                        <h2 className="text-[12px] font-black text-white uppercase tracking-wider">Mission_Control</h2>
                                        <span className="w-1 h-1 rounded-full bg-emerald-500 animate-pulse"></span>
                                    </div>
                                    <div className="text-[7px] font-mono text-zinc-600 uppercase tracking-widest flex gap-2">
                                        <span>SYSTEM_OK</span>
                                        <span>{currentTime}</span>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Search Input - Expands to fill header */}
                        <div className={`flex items-center transition-all duration-300 ${searchOpen ? 'flex-1' : 'w-8'}`}>
                            {searchOpen ? (
                                <div className="flex items-center w-full bg-zinc-900 border border-orange-500/40 rounded-sm animate-in slide-in-from-right-2">
                                    <input 
                                        autoFocus
                                        type="text" 
                                        value={globalSearch}
                                        onChange={e => setGlobalSearch(e.target.value)}
                                        placeholder="SÖK_LOG..." 
                                        className="w-full bg-transparent px-3 py-1.5 text-[10px] font-black text-white outline-none uppercase tracking-widest placeholder:text-zinc-700"
                                    />
                                    <button 
                                        onClick={() => { setSearchOpen(false); setGlobalSearch(''); }}
                                        className="p-2 text-zinc-500 hover:text-white"
                                    >
                                        <SafeIcon name="x" size={16} />
                                    </button>
                                </div>
                            ) : (
                                <button 
                                    onClick={() => setSearchOpen(true)}
                                    className="h-8 w-8 flex items-center justify-center rounded-sm bg-zinc-900 border border-zinc-800 text-zinc-500 hover:theme-text transition-colors"
                                >
                                    <SafeIcon name="search" size={16} />
                                </button>
                            )}
                        </div>
                    </div>
                </div>

                {/* Filter Row */}
                <div className="px-4 pb-3 overflow-x-auto no-scrollbar flex items-center gap-2">
                    {['ALLA', 'BOKAD', 'OFFERERAD', 'EJ BOKAD', 'KLAR', 'FAKTURERAS'].map(s => (
                        <FilterButton key={s} label={s} />
                    ))}
                </div>
            </div>

            {/* --- COMPACT MOBILE LIST (EDGE-TO-EDGE) --- */}
            <div className="lg:hidden space-y-1 mt-1">
                {filteredJobs.map(job => (
                    <div 
                        key={job.id} 
                        onClick={() => setView('NEW_JOB', { job: job })} 
                        className="bg-white border-y border-zinc-200/60 active:bg-zinc-50 transition-colors px-4 py-3 flex flex-col gap-2"
                    >
                        {/* Row 1: Regnr & Status */}
                        <div className="flex justify-between items-center">
                            <span className="text-[10px] font-mono font-black text-zinc-900 bg-zinc-100 px-1.5 py-0.5 rounded-sm border border-zinc-200 tracking-tighter">
                                {job.regnr || 'NO_REF'}
                            </span>
                            <window.Badge status={job.status} />
                        </div>

                        {/* Row 2: Customer & Price */}
                        <div className="flex justify-between items-center">
                            <div className="flex-1 min-w-0 pr-2">
                                <h3 className="text-[14px] font-black text-zinc-900 leading-tight uppercase truncate tracking-tight">
                                    {job.kundnamn}
                                </h3>
                            </div>
                            <div className="text-right shrink-0">
                                <span className="text-[16px] font-black text-zinc-900 leading-none">
                                    {(parseInt(job.kundpris) || 0).toLocaleString()}
                                </span>
                                <span className="text-[9px] ml-0.5 text-zinc-400 font-bold">KR</span>
                            </div>
                        </div>

                        {/* Row 3: Scheduling info */}
                        <div className="flex items-center justify-between pt-2 border-t border-zinc-50">
                            <div className="flex items-center gap-3">
                                {job.datum ? (
                                    <>
                                        <div className="flex items-center gap-1 text-zinc-500">
                                            <SafeIcon name="calendar" size={11} />
                                            <span className="text-[10px] font-bold uppercase">{formatDate(job.datum)}</span>
                                        </div>
                                        <div className="flex items-center gap-1">
                                            <SafeIcon name="clock" size={11} className="theme-text" />
                                            <span className="text-[10px] font-black text-zinc-900">kl {job.datum.split('T')[1] || '--:--'}</span>
                                        </div>
                                    </>
                                ) : (
                                    <div className="flex items-center gap-1 text-zinc-300">
                                        <SafeIcon name="calendar-off" size={11} />
                                        <span className="text-[9px] font-black uppercase italic tracking-tighter">OPLANERAD</span>
                                    </div>
                                )}
                            </div>
                            <div className="flex items-center gap-1 text-[8px] font-mono text-zinc-300">
                                <span>ID_{job.id.substring(0, 6)}</span>
                                <SafeIcon name="chevron-right" size={12} />
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* --- DESKTOP VIEW (REMAINS OPTIMIZED) --- */}
            <div className="hidden lg:block p-6 max-w-7xl mx-auto">
                <div className="bg-white border border-zinc-200 shadow-2xl rounded-sm overflow-hidden">
                    <table className="w-full text-left border-collapse">
                        <thead className="bg-[#0a0a0a] text-zinc-500 text-[9px] uppercase tracking-widest font-black">
                            <tr>
                                <th className="px-6 py-4">Kund / Log_ID</th>
                                <th className="px-6 py-4">Ref_Nr</th>
                                <th className="px-6 py-4">Schema</th> 
                                <th className="px-6 py-4 text-center">Status</th>
                                <th className="px-6 py-4 text-right">Belopp</th>
                                <th className="px-6 py-4 text-right w-16"></th>
                            </tr>
                        </thead>
                        <tbody className="bg-white">
                            {filteredJobs.map(job => (
                                <tr key={job.id} onClick={() => setView('NEW_JOB', { job: job })} className="hover:bg-zinc-50 border-b border-zinc-100 cursor-pointer group">
                                    <td className="px-6 py-3">
                                        <div className="text-[11px] font-black uppercase text-zinc-900 group-hover:theme-text transition-colors">{job.kundnamn}</div>
                                        <div className="text-[9px] text-zinc-400 font-mono italic">{job.id.substring(0,8)}</div>
                                    </td>
                                    <td className="px-6 py-3 font-mono font-black text-zinc-600 text-[11px] uppercase">{job.regnr}</td>
                                    <td className="px-6 py-3">
                                        {job.datum ? (
                                            <div className="flex flex-col leading-tight">
                                                <span className="text-[11px] font-bold text-zinc-700">{formatDate(job.datum)}</span>
                                                <span className="text-[9px] theme-text font-black uppercase">kl {job.datum.split('T')[1]}</span>
                                            </div>
                                        ) : (
                                            <span className="text-[9px] font-black text-zinc-300 uppercase">Ej bokad</span>
                                        )}
                                    </td>
                                    <td className="px-6 py-3 text-center"><window.Badge status={job.status} /></td>
                                    <td className="px-6 py-3 text-right font-black text-zinc-900 tracking-tight">{(parseInt(job.kundpris) || 0).toLocaleString()} kr</td>
                                    <td className="px-6 py-3 text-right">
                                        <div className="opacity-0 group-hover:opacity-100">
                                            <SafeIcon name="chevron-right" size={16} className="theme-text" />
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
});
