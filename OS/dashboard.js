// dashboard.js

// 1. Datumformaterare
const formatDate = (dateStr) => {
    if (!dateStr) return null;
    const d = new Date(dateStr);
    const months = ['JAN', 'FEB', 'MAR', 'APR', 'MAJ', 'JUN', 'JUL', 'AUG', 'SEP', 'OKT', 'NOV', 'DEC'];
    return `${d.getDate()} ${months[d.getMonth()]}`;
};

// --- HÅRDKODADE IKONER (SVG) ---
const SafeIcon = ({ name, size = 16, className = "" }) => {
    const style = { width: size, height: size, display: 'inline-block', strokeWidth: 2 };
    
    if (name === 'search') return <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" className={className} style={style}><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>;
    if (name === 'x') return <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" className={className} style={style}><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>;
    if (name === 'edit-3') return <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" className={className} style={style}><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/></svg>;
    if (name === 'trash-2') return <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" className={className} style={style}><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/><line x1="10" y1="11" x2="10" y2="17"/><line x1="14" y1="11" x2="14" y2="17"/></svg>;
    if (name === 'inbox') return <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" className={className} style={style}><polyline points="22 12 16 12 14 15 10 15 8 12 2 12"></polyline><path d="M5.45 5.11L2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z"></path></svg>;
    if (name === 'message-square') return <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" className={className} style={style}><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg>;
    
    return null;
};

// 2. Status Badge
window.Badge = React.memo(({ status }) => {
    const s = (status || 'BOKAD').toUpperCase();
    const styles = {
        'BOKAD': 'bg-orange-100 text-orange-700 border border-orange-200',
        'OFFERERAD': 'bg-blue-50 text-blue-700 border border-blue-200',
        'KLAR': 'bg-zinc-900 text-white border border-black',
        'FAKTURERAS': 'bg-zinc-50 text-zinc-500 border border-zinc-200',
    };
    return (
        <span className={`px-1.5 py-[2px] text-[8px] font-black uppercase tracking-wider inline-block text-center rounded-[2px] ${styles[s] || styles['BOKAD']}`}>
            {s}
        </span>
    );
});

// 3. Huvudvy
window.DashboardView = React.memo(({ 
    filteredJobs, setEditingJob, setView, 
    activeFilter, setActiveFilter, statusCounts,
    globalSearch, setGlobalSearch 
}) => {
    const [searchOpen, setSearchOpen] = React.useState(false);

    const FilterChip = ({ label }) => {
        const isActive = activeFilter === label;
        return (
            <button 
                onClick={() => setActiveFilter(label)} 
                className={`
                    flex items-center gap-2 px-3 py-1.5 text-[9px] font-black uppercase tracking-wider shrink-0 transition-all rounded-[2px] border
                    ${isActive 
                        ? 'bg-zinc-900 text-white border-zinc-900 shadow-sm' 
                        : 'bg-white text-zinc-500 border-zinc-200 hover:border-zinc-300'}
                `}
            >
                {label} 
                {statusCounts[label] > 0 && (
                    <span className={`text-[8px] h-[14px] min-w-[14px] px-1 rounded-[2px] font-mono flex items-center justify-center leading-none ${isActive ? 'bg-white text-black' : 'bg-zinc-100 text-zinc-500'}`}>
                        {statusCounts[label]}
                    </span>
                )}
            </button>
        );
    };

    // --- MOBILKORTET ---
    const MobileJobCard = ({ job }) => (
        <div 
            onClick={() => setView('NEW_JOB', { job: job })}
            className="w-full bg-white relative active:bg-zinc-50 transition-colors border-b border-zinc-200 last:border-0 shadow-sm group"
        >
            {/* Orange Accent Line */}
            <div className="absolute left-0 top-0 bottom-0 w-[4px] bg-orange-500"></div>

            <div className="pl-6 pr-4 py-3">
                
                {/* RAD 1: Namn & Status & ID */}
                <div className="flex justify-between items-start mb-2">
                    <div className="flex flex-col min-w-0 pr-2">
                         <div className="text-[15px] font-black uppercase text-zinc-900 tracking-tight truncate leading-none mb-1">
                            {job.kundnamn}
                        </div>
                        {/* ID som "Code Tag" */}
                        <div className="inline-flex">
                            <span className="text-[9px] font-mono text-zinc-500 bg-zinc-100 px-1 rounded-[2px] border border-zinc-200/50">
                                #{job.id.substring(0,6)}
                            </span>
                        </div>
                    </div>
                    <window.Badge status={job.status} />
                </div>

                {/* RAD 2: Tech Box */}
                <div className="bg-[#f8fafc] border border-zinc-200 rounded-[2px] p-2 flex items-center gap-4 mb-2">
                    {/* RegNr */}
                    <div className="flex flex-col border-r border-zinc-200 pr-4">
                        <span className="text-[7px] text-zinc-500 font-bold uppercase tracking-widest mb-0.5">Fordon</span>
                        <div className="flex items-center gap-1.5">
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-zinc-400"><rect x="1" y="3" width="15" height="13"></rect><polygon points="16 8 20 8 23 11 23 16 16 16 16 8"></polygon><circle cx="5.5" cy="18.5" r="2.5"></circle><circle cx="18.5" cy="18.5" r="2.5"></circle></svg>
                            <span className="text-[11px] font-mono font-bold text-zinc-900 uppercase tracking-tight bg-white px-1 border border-zinc-200 rounded-[2px]">
                                {job.regnr || '-'}
                            </span>
                        </div>
                    </div>
                    {/* Tid */}
                    <div className="flex flex-col">
                        <span className="text-[7px] text-zinc-500 font-bold uppercase tracking-widest mb-0.5">Tidpunkt</span>
                        <div className="flex items-center gap-1.5">
                            {job.datum ? (
                                <>
                                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-zinc-400"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
                                    <span className="text-[11px] font-mono font-bold text-zinc-900 uppercase">
                                        {formatDate(job.datum)}
                                    </span>
                                    <span className="text-[11px] font-mono text-zinc-500 border-l border-zinc-300 pl-2">
                                        {job.datum.split('T')[1]}
                                    </span>
                                </>
                            ) : (
                                <div className="flex items-center gap-1">
                                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-red-500"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>
                                    <span className="text-[9px] font-bold text-red-500 uppercase">Ej bokad</span>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* RAD 3: Kommentar & Pris */}
                <div className="flex items-end pt-1 min-h-[24px]">
                    
                    {/* VÄNSTER: KOMMENTAR (Maximerad bredd) */}
                    <div className="flex-1 min-w-0 mr-2"> 
                        {job.kommentar && (
                            <div className="flex items-start gap-1.5 text-zinc-500">
                                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-zinc-400 shrink-0 mt-[2px]">
                                    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
                                </svg>
                                <span className="text-[10px] italic font-medium leading-tight line-clamp-2 text-zinc-600">
                                    {job.kommentar}
                                </span>
                            </div>
                        )}
                    </div>

                    {/* HÖGER: PRIS (Helt högerställt, ingen pil) */}
                    <div className="ml-auto flex flex-col items-end shrink-0 text-right">
                        <div className="flex items-baseline justify-end w-full">
                            <div className="text-[20px] font-mono font-bold text-zinc-900 leading-none tracking-tight">
                                {(parseInt(job.kundpris) || 0).toLocaleString()} 
                            </div>
                            <span className="text-[9px] text-zinc-400 font-bold ml-1 font-sans">SEK</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );

    return (
        <div className="flex flex-col min-h-screen bg-zinc-100">
            
            {/* HEADER */}
            <div className="bg-[#0f0f11] text-white pt-safe-top pb-0 z-20 shadow-lg relative">
                <div className="px-4 py-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gradient-to-br from-orange-500 to-orange-600 rounded-[2px] flex items-center justify-center text-black shadow-[0_0_15px_rgba(249,115,22,0.3)]">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="7" height="7"></rect><rect x="14" y="3" width="7" height="7"></rect><rect x="14" y="14" width="7" height="7"></rect><rect x="3" y="14" width="7" height="7"></rect></svg>
                        </div>
                        <div className={searchOpen ? 'hidden xs:block' : 'block'}>
                            <div className="text-[9px] text-zinc-500 font-bold uppercase tracking-widest leading-none mb-1">System</div>
                            <div className="text-[15px] font-black text-white uppercase tracking-wider leading-none">Mission Control</div>
                        </div>
                    </div>

                    {/* Sökfält */}
                    <div className={`transition-all duration-300 ${searchOpen ? 'flex-1 ml-4' : 'w-auto'}`}>
                        {searchOpen ? (
                            <div className="relative flex items-center h-10">
                                <input 
                                    autoFocus
                                    type="text" 
                                    value={globalSearch}
                                    onChange={e => setGlobalSearch(e.target.value)}
                                    placeholder="SÖK..."
                                    className="w-full h-full bg-zinc-900 text-white text-[11px] font-bold rounded-[2px] px-3 pl-9 uppercase focus:outline-none border border-zinc-800 focus:border-orange-500 placeholder:text-zinc-700"
                                />
                                <span className="absolute left-3 top-3 text-zinc-500">
                                    <SafeIcon name="search" size={14} />
                                </span>
                                <button onClick={() => {setSearchOpen(false); setGlobalSearch('')}} className="absolute right-0 top-0 h-10 w-10 flex items-center justify-center text-zinc-500 hover:text-white">
                                    <SafeIcon name="x" size={14} />
                                </button>
                            </div>
                        ) : (
                            <button onClick={() => setSearchOpen(true)} className="w-10 h-10 flex items-center justify-center text-zinc-400 bg-zinc-900 border border-zinc-800 rounded-[2px] hover:text-white hover:border-zinc-700 transition-colors">
                                <SafeIcon name="search" size={18} />
                            </button>
                        )}
                    </div>
                </div>

                {/* Filter Bar */}
                <div className="bg-white border-b border-zinc-200 p-3 flex overflow-x-auto no-scrollbar gap-2">
                    {['ALLA', 'BOKAD', 'OFFERERAD', 'EJ BOKAD', 'KLAR', 'FAKTURERAS'].map(s => (
                        <FilterChip key={s} label={s} />
                    ))}
                </div>
            </div>

            {/* CONTENT AREA */}
            <div className="flex-1 w-full bg-zinc-100">
                
                {/* DESKTOP TABELL */}
                <div className="hidden lg:block bg-white border-b border-zinc-200 shadow-sm">
                    <table className="w-full text-left border-collapse">
                        <thead className="bg-[#1e1e1e] text-zinc-400 text-[9px] uppercase tracking-widest font-black">
                            <tr>
                                <th className="px-6 py-4">Kund</th>
                                <th className="px-6 py-4">Regnr</th>
                                <th className="px-6 py-4">Datum</th> 
                                <th className="px-6 py-4">Status</th>
                                <th className="px-6 py-4 text-right">Belopp</th>
                                <th className="px-6 py-4 text-right">Åtgärd</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredJobs.map(job => (
                                <tr key={job.id} className="border-b border-zinc-100 hover:bg-zinc-50 border-l-4 border-l-transparent hover:border-l-orange-500 transition-all cursor-pointer group">
                                    <td className="px-6 py-4 cursor-pointer" onClick={() => setView('NEW_JOB', { job: job })}>
                                        <div className="text-[12px] font-black uppercase text-zinc-900">{job.kundnamn}</div>
                                        <div className="text-[10px] text-[#94a3b8] font-bold uppercase tracking-tight">{job.id.substring(0,8)}</div>
                                    </td>
                                    <td className="px-6 py-4 font-mono font-bold text-[12px] uppercase text-zinc-700">{job.regnr}</td>
                                    <td className="px-6 py-4 text-[12px] font-bold text-zinc-600">
                                        {job.datum ? `${formatDate(job.datum)} ${job.datum.split('T')[1]}` : '-'}
                                    </td>
                                    <td className="px-6 py-4"><window.Badge status={job.status} /></td>
                                    <td className="px-6 py-4 text-right text-[13px] font-mono font-bold text-zinc-900">{(parseInt(job.kundpris) || 0).toLocaleString()} kr</td>
                                    <td className="px-6 py-4 text-right">
                                        <div className="flex justify-end gap-3 opacity-50 group-hover:opacity-100">
                                            <button onClick={() => setView('NEW_JOB', { job: job })} className="text-zinc-400 hover:text-black">
                                                <SafeIcon name="edit-3" size={16} />
                                            </button>
                                            <button onClick={() => { if(confirm("Radera?")) window.db.collection("jobs").doc(job.id).update({deleted:true}); }} className="text-zinc-400 hover:text-red-600">
                                                <SafeIcon name="trash-2" size={16} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {/* MOBIL LISTA */}
                <div className="lg:hidden w-full pb-24 px-0 flex flex-col gap-2 bg-zinc-100">
                    {filteredJobs.map(job => (
                        <MobileJobCard key={job.id} job={job} />
                    ))}
                    
                    {filteredJobs.length === 0 && (
                        <div className="flex flex-col items-center justify-center py-24 opacity-40">
                             <SafeIcon name="inbox" size={40} className="text-zinc-400 mb-2" />
                            <p className="text-[10px] font-black uppercase text-zinc-500">Inga order hittades</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
});
