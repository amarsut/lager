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
        'KLAR': 'bg-zinc-900 text-white font-bold',
        'FAKTURERAS': 'bg-zinc-100 text-zinc-500 border border-zinc-200',
    };
    return (
        <span className={`px-2 py-0.5 text-[9px] uppercase tracking-[0.05em] inline-block w-20 text-center rounded-[2px] ${styles[s] || styles['BOKAD']}`}>
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

    const FilterButton = ({ label }) => (
        <button 
            onClick={() => setActiveFilter(label)} 
            className={`
                px-3 py-2 text-[10px] font-black uppercase transition-all flex items-center gap-2 rounded-sm shrink-0
                ${activeFilter === label 
                    ? 'theme-bg text-black shadow-md' 
                    : 'bg-zinc-800 text-zinc-500 border border-zinc-700 hover:text-zinc-300'}
            `}
        >
            {label} 
            <span className={`
                text-[8px] px-1 rounded-[1px] font-mono
                ${activeFilter === label ? 'bg-black/20 text-black' : 'bg-zinc-700 text-zinc-500'}
            `}>
                {statusCounts[label] || 0}
            </span>
        </button>
    );

    return (
        <div className="min-h-screen bg-zinc-100 pb-20 lg:pb-0 animate-in fade-in duration-500">
            
            {/* HEADER - INTE STICKY */}
            <div className="bg-[#111] border-b-2 theme-border shadow-xl">
                <div className="p-5 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <div className="w-10 h-10 theme-bg flex items-center justify-center rounded-sm shadow-lg">
                            <SafeIcon name="grid" size={20} className="text-black" />
                        </div>
                        <div>
                            <span className="text-[8px] font-black theme-text uppercase tracking-[0.3em] block leading-none mb-1 opacity-70">
                                Operational_Overview
                            </span>
                            <h2 className="text-sm font-black text-white uppercase tracking-widest leading-none">
                                Mission_Control
                            </h2>
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        {searchOpen && (
                            <input 
                                autoFocus
                                type="text" 
                                value={globalSearch}
                                onChange={e => setGlobalSearch(e.target.value)}
                                placeholder="SÖK..." 
                                className="w-32 bg-zinc-900 border border-zinc-800 px-3 py-2 text-[10px] font-bold text-white outline-none uppercase rounded-sm"
                            />
                        )}
                        <button 
                            onClick={() => setSearchOpen(!searchOpen)}
                            className="h-10 w-10 flex items-center justify-center rounded-sm bg-zinc-900 border border-zinc-800 text-zinc-500"
                        >
                            <SafeIcon name={searchOpen ? "x" : "search"} size={18} />
                        </button>
                    </div>
                </div>

                {/* FILTERBAR */}
                <div className="px-5 pb-5 overflow-x-auto no-scrollbar flex items-center gap-2">
                    {['ALLA', 'BOKAD', 'OFFERERAD', 'EJ BOKAD', 'KLAR', 'FAKTURERAS'].map(s => (
                        <FilterButton key={s} label={s} />
                    ))}
                </div>
            </div>

            {/* MOBIL LISTVY - EDGE TO EDGE */}
            <div className="lg:hidden">
                {filteredJobs.map((job, index) => (
                    <div 
                        key={job.id} 
                        onClick={() => setView('NEW_JOB', { job: job })} 
                        className={`bg-white p-5 active:bg-zinc-50 border-b border-zinc-200 flex flex-col gap-4`}
                    >
                        {/* Övre raden: Regnr och Status */}
                        <div className="flex justify-between items-center">
                            <div className="flex items-center gap-2">
                                <div className="w-1.5 h-1.5 rounded-full theme-bg"></div>
                                <span className="text-[11px] font-mono font-black text-zinc-400 tracking-tighter uppercase">
                                    {job.regnr || 'SAKNAS'}
                                </span>
                            </div>
                            <window.Badge status={job.status} />
                        </div>

                        {/* Mitten: Kundnamn och Pris */}
                        <div className="flex justify-between items-start">
                            <div className="flex-1">
                                <h3 className="text-[16px] font-black text-zinc-900 leading-tight uppercase tracking-tight">
                                    {job.kundnamn}
                                </h3>
                                <p className="text-[9px] text-zinc-400 font-bold mt-0.5 tracking-widest">
                                    ID: {job.id.substring(0, 8)}
                                </p>
                            </div>
                            <div className="text-right ml-4">
                                <div className="text-xl font-black text-zinc-900 leading-none">
                                    {(parseInt(job.kundpris) || 0).toLocaleString()}
                                    <span className="text-[10px] ml-1 text-zinc-400 uppercase">kr</span>
                                </div>
                            </div>
                        </div>

                        {/* Nedre raden: Datum och Tid */}
                        <div className="flex items-center gap-4 pt-3 border-t border-zinc-50">
                            {job.datum ? (
                                <>
                                    <div className="flex items-center gap-1.5 text-zinc-600">
                                        <SafeIcon name="calendar" size={12} className="text-zinc-400" />
                                        <span className="text-[11px] font-bold">{formatDate(job.datum)}</span>
                                    </div>
                                    <div className="flex items-center gap-1.5">
                                        <SafeIcon name="clock" size={12} className="theme-text" />
                                        <span className="text-[11px] font-black text-zinc-800">{job.datum.split('T')[1] || '--:--'}</span>
                                    </div>
                                </>
                            ) : (
                                <div className="flex items-center gap-1.5 text-zinc-300">
                                    <SafeIcon name="calendar-off" size={12} />
                                    <span className="text-[10px] font-black uppercase tracking-tighter">Ej schemalagd</span>
                                </div>
                            )}
                        </div>
                    </div>
                ))}
            </div>

            {/* DESKTOP TABELL (Oförändrad struktur) */}
            <div className="hidden lg:block p-8">
                <div className="bg-white border border-zinc-200 shadow-2xl rounded-sm overflow-hidden">
                    <table className="w-full text-left border-collapse">
                        <thead className="bg-[#1e1e1e] text-[#94a3b8] text-[9px] uppercase tracking-widest font-black">
                            <tr>
                                <th className="px-6 py-4">Kund / Order</th>
                                <th className="px-6 py-4">Regnr</th>
                                <th className="px-6 py-4">Datum & Tid</th> 
                                <th className="px-6 py-4">Status</th>
                                <th className="px-6 py-4 w-[120px] text-right">Belopp</th>
                                <th className="px-6 py-4 w-28 text-right">Åtgärd</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white">
                            {filteredJobs.map(job => (
                                <tr key={job.id} className="hover:bg-zinc-50 transition-all border-b border-[#edf2f7] cursor-pointer" onClick={() => setView('NEW_JOB', { job: job })}>
                                    <td className="px-6 py-3">
                                        <div className="text-[11px] font-black uppercase text-zinc-900">{job.kundnamn}</div>
                                        <div className="text-[10px] text-[#94a3b8] font-bold uppercase tracking-tight">{job.id.substring(0,8)}</div>
                                    </td>
                                    <td className="px-6 py-3 font-mono font-black text-[#1e293b] text-[11px] uppercase">{job.regnr}</td>
                                    <td className="px-6 py-3">
                                        {job.datum ? (
                                            <>
                                                <div className="text-[13px] font-bold text-zinc-700">{formatDate(job.datum)}</div>
                                                <div className="text-[11px] text-[#64748b] font-bold">kl. {job.datum.split('T')[1] || '--:--'}</div>
                                            </>
                                        ) : (
                                            <div className="text-[10px] font-black text-zinc-300 uppercase tracking-tighter flex items-center gap-1">
                                                <SafeIcon name="calendar-off" size={12} /> Ej Bokad
                                            </div>
                                        )}
                                    </td>
                                    <td className="px-6 py-3"><window.Badge status={job.status} /></td>
                                    <td className="px-6 py-3 text-right font-black text-zinc-900">{(parseInt(job.kundpris) || 0).toLocaleString()} kr</td>
                                    <td className="px-6 py-3 text-right">
                                        <button className="p-1.5 text-zinc-400 hover:theme-text transition-colors">
                                            <SafeIcon name="edit-3" size={16} />
                                        </button>
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
