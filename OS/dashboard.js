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
        <span className={`px-2 py-0.5 text-[8px] uppercase tracking-[0.1em] inline-block w-20 text-center rounded-[4px] ${styles[s] || styles['BOKAD']}`}>
            {s}
        </span>
    );
});

window.DashboardView = React.memo(({ 
    filteredJobs, setEditingJob, setView, 
    activeFilter, setActiveFilter, statusCounts,
    globalSearch, setGlobalSearch 
}) => {
    const [searchOpen, setSearchOpen] = React.useState(false);

    return (
        <div className="space-y-6 pb-20 lg:pb-0 animate-in fade-in duration-500">
            
            {/* COMMAND HEADER MED INTEGRERAD FILTER & SÖK */}
            <div className="bg-zinc-950 p-4 flex items-center justify-between border-b-2 theme-border shadow-2xl relative">
                <div className="flex items-center gap-4 shrink-0">
                    <div className="w-10 h-10 theme-bg flex items-center justify-center rounded-sm shadow-lg">
                        <SafeIcon name="grid" size={20} className="text-black" />
                    </div>
                    <div className={searchOpen ? 'hidden md:block' : ''}>
                        <span className="text-[9px] font-black theme-text uppercase tracking-[0.3em] block leading-none mb-1">
                            Operational_Overview
                        </span>
                        <h2 className="text-sm font-black text-white uppercase tracking-widest">
                            Mission_Control
                        </h2>
                    </div>
                </div>

                {/* HÖGER SEKTION: FILTRERING + SÖK */}
                    <div className="flex items-center gap-4">
                        
                        {/* FILTRERING - Mindre och mer kompakt */}
                        <div className={`hidden lg:flex transition-all duration-300 ${searchOpen ? 'opacity-0 scale-95 pointer-events-none' : 'opacity-100'}`}>
                            <div className="flex bg-zinc-900/30 p-0.5 border border-zinc-800/50 rounded-sm gap-0.5">
                                {['ALLA', 'BOKAD', 'OFFERERAD', 'EJ BOKAD', 'KLAR', 'FAKTURERAS'].map(s => (
                                    <button 
                                        key={s} 
                                        onClick={() => setActiveFilter(s)} 
                                        className={`
                                            px-2.5 py-1 text-[9px] font-bold uppercase transition-all flex items-center gap-2 rounded-sm
                                            ${activeFilter === s 
                                                ? 'theme-bg text-black shadow-sm' 
                                                : 'text-zinc-500 hover:bg-zinc-800/50 hover:text-zinc-300'}
                                        `}
                                    >
                                        {s} 
                                        <span className={`
                                            text-[8px] px-1 rounded-[1px] font-mono
                                            ${activeFilter === s ? 'bg-black/10' : 'bg-zinc-800 text-zinc-600'}
                                        `}>
                                            {statusCounts[s]}
                                        </span>
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* EXPANDERBAR SÖK - Fixad positionering och storlek */}
                        <div className="flex items-center">
                            <div className={`relative flex items-center h-8 transition-all duration-500 ${searchOpen ? 'w-64 md:w-80' : 'w-9'}`}>
                                {searchOpen && (
                                    <input 
                                        autoFocus
                                        type="text" 
                                        value={globalSearch}
                                        onChange={e => setGlobalSearch(e.target.value)}
                                        onBlur={() => !globalSearch && setSearchOpen(false)}
                                        placeholder="SEARCH_DATABASE..." 
                                        className="w-full h-full bg-zinc-950 border border-zinc-800 px-3 pr-10 text-[10px] font-bold text-white outline-none animate-in fade-in slide-in-from-right-4 uppercase tracking-widest rounded-sm"
                                    />
                                )}
                                <button 
                                    onClick={() => setSearchOpen(!searchOpen)}
                                    className={`h-8 w-8 transition-all flex items-center justify-center rounded-sm z-10 ${searchOpen ? 'absolute right-0 text-zinc-500 hover:text-white' : 'bg-zinc-900 border border-zinc-800 text-zinc-500 hover:theme-text'}`}
                                >
                                    <SafeIcon name={searchOpen ? "x" : "search"} size={14} />
                                </button>
                            </div>

                            {/* QUEUE - Visas bara när sök är stängd */}
                            {!searchOpen && (
                                <div className="hidden md:flex flex-col text-right border-l border-zinc-800 pl-4 ml-4">
                                    <span className="text-[7px] font-black text-zinc-500 uppercase tracking-widest leading-none mb-1">Queue</span>
                                    <span className="text-xs font-mono font-black text-white leading-none">{filteredJobs.length}</span>
                                </div>
                            )}
                        </div>
                    </div>
            </div>

            <div className="hidden lg:block bg-white border border-zinc-200 shadow-2xl rounded-sm overflow-hidden">
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
                            <tr key={job.id} className="hover:bg-zinc-50 transition-all border-b border-[#edf2f7] border-l-4 border-l-transparent hover:border-l-orange-500 group">
                                <td className="px-6 py-3 cursor-pointer" onClick={() => { setEditingJob(job); setView('NEW_JOB'); }}>
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
                                    <div className="flex justify-end gap-2">
                                        <button onClick={() => { setEditingJob(job); setView('NEW_JOB'); }} className="p-1.5 text-zinc-400 hover:theme-text"><SafeIcon name="edit-3" size={16} /></button>
                                        <button onClick={() => { if(confirm("Radera?")) window.db.collection("jobs").doc(job.id).update({deleted:true}); }} className="p-1.5 text-zinc-400 hover:text-red-500 mt-[-2px]"><SafeIcon name="trash-2" size={16} /></button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            <div className="lg:hidden space-y-3">
                {filteredJobs.map(job => (
                    <div key={job.id} onClick={() => { setEditingJob(job); setView('NEW_JOB'); }} className="bg-white border-l-4 theme-border p-4 shadow-md rounded-sm active:scale-[0.98]">
                        <div className="flex justify-between items-start mb-2">
                            <div>
                                <div className="text-[13px] font-black uppercase text-zinc-900 leading-tight">{job.kundnamn}</div>
                                <div className="text-[11px] font-mono theme-text font-black tracking-tight">{job.regnr}</div>
                            </div>
                            <window.Badge status={job.status} />
                        </div>
                        <div className="flex justify-between items-end border-t border-zinc-50 pt-2 mt-2">
                            <div className="text-[10px] font-mono flex flex-col">
                                {job.datum ? (
                                    <>
                                        <span className="text-zinc-400">{formatDate(job.datum)}</span>
                                        <span className="theme-text font-black">kl. {job.datum.split('T')[1] || '--:--'}</span>
                                    </>
                                ) : (
                                    <span className="text-zinc-300 font-black uppercase tracking-tighter flex items-center gap-1">
                                        <SafeIcon name="calendar-off" size={10} /> Ej Bokad
                                    </span>
                                )}
                            </div>
                            <div className="font-black text-zinc-900 text-sm">{(parseInt(job.kundpris) || 0).toLocaleString()} kr</div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
});
