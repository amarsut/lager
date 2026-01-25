// dashboard.js

// 1. Datumformaterare
const formatDate = (dateStr) => {
    if (!dateStr) return null;
    const d = new Date(dateStr);
    const months = ['JAN', 'FEB', 'MAR', 'APR', 'MAJ', 'JUN', 'JUL', 'AUG', 'SEP', 'OKT', 'NOV', 'DEC'];
    return `${d.getDate()} ${months[d.getMonth()]}`;
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
        <span className={`px-2 py-[3px] text-[9px] font-black uppercase tracking-wider inline-block text-center rounded-[4px] ${styles[s] || styles['BOKAD']}`}>
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
                    flex items-center gap-2 px-4 py-2 text-[10px] font-black uppercase tracking-wider shrink-0 transition-all rounded-full border
                    ${isActive 
                        ? 'bg-zinc-900 text-white border-zinc-900 shadow-md' 
                        : 'bg-white text-zinc-500 border-zinc-200 hover:border-zinc-300'}
                `}
            >
                {label} 
                {statusCounts[label] > 0 && (
                    <span className={`text-[9px] h-[16px] min-w-[16px] px-1 rounded-full font-mono flex items-center justify-center leading-none ${isActive ? 'bg-white text-black' : 'bg-zinc-100 text-zinc-500'}`}>
                        {statusCounts[label]}
                    </span>
                )}
            </button>
        );
    };

    // --- DET NYA KORTET: Hårdkodade SVG-ikoner för stabilitet ---
    const MobileJobCard = ({ job }) => (
        <div 
            onClick={() => setView('NEW_JOB', { job: job })}
            className="w-full bg-white relative active:bg-zinc-50 transition-colors border-b border-zinc-100 last:border-0"
        >
            {/* Orange Accent Line */}
            <div className="absolute left-0 top-0 bottom-0 w-[3px] bg-orange-500"></div>

            <div className="pl-5 pr-4 py-4">
                
                {/* RAD 1: Namn & Status */}
                <div className="flex justify-between items-start mb-3">
                    <div className="text-[15px] font-black uppercase text-zinc-900 tracking-tight truncate pr-2 leading-tight">
                        {job.kundnamn}
                    </div>
                    <window.Badge status={job.status} />
                </div>

                {/* RAD 2: "Tech Box" med Hårdkodade Ikoner */}
                <div className="bg-zinc-50 border border-zinc-200/60 rounded-[6px] p-2.5 flex items-center gap-4 mb-4">
                    
                    {/* RegNr Sektion */}
                    <div className="flex flex-col border-r border-zinc-200 pr-4 min-w-[80px]">
                        <span className="text-[8px] text-zinc-400 font-bold uppercase tracking-widest mb-1">Reg</span>
                        <div className="flex items-center gap-2">
                            {/* TRUCK ICON (Inline SVG) */}
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-zinc-400">
                                <rect x="1" y="3" width="15" height="13"></rect>
                                <polygon points="16 8 20 8 23 11 23 16 16 16 16 8"></polygon>
                                <circle cx="5.5" cy="18.5" r="2.5"></circle>
                                <circle cx="18.5" cy="18.5" r="2.5"></circle>
                            </svg>
                            <span className="text-[12px] font-mono font-bold text-zinc-700 uppercase tracking-tight">
                                {job.regnr || '-'}
                            </span>
                        </div>
                    </div>

                    {/* Tid Sektion */}
                    <div className="flex flex-col">
                        <span className="text-[8px] text-zinc-400 font-bold uppercase tracking-widest mb-1">Tid</span>
                        <div className="flex items-center gap-2">
                            {job.datum ? (
                                <>
                                    {/* CLOCK ICON (Inline SVG) */}
                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-zinc-400">
                                        <circle cx="12" cy="12" r="10"></circle>
                                        <polyline points="12 6 12 12 16 14"></polyline>
                                    </svg>
                                    <span className="text-[12px] font-mono font-bold text-zinc-700 uppercase">
                                        {formatDate(job.datum)}
                                    </span>
                                    <span className="text-[12px] font-mono text-zinc-400 border-l border-zinc-200 pl-2">
                                        {job.datum.split('T')[1]}
                                    </span>
                                </>
                            ) : (
                                <div className="flex items-center gap-1">
                                    {/* ALERT ICON (Inline SVG) */}
                                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-red-400">
                                        <circle cx="12" cy="12" r="10"></circle>
                                        <line x1="12" y1="8" x2="12" y2="12"></line>
                                        <line x1="12" y1="16" x2="12.01" y2="16"></line>
                                    </svg>
                                    <span className="text-[10px] font-bold text-red-400 uppercase">Ej bokad</span>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* RAD 3: ID & Pris */}
                <div className="flex justify-between items-end">
                    <div className="text-[9px] font-mono text-zinc-300 tracking-wider">
                        ID: {job.id.substring(0,6)}
                    </div>
                    <div className="text-[22px] font-black text-zinc-900 leading-none tracking-tighter flex items-start">
                        {(parseInt(job.kundpris) || 0).toLocaleString()} 
                        <span className="text-[9px] text-zinc-400 font-bold ml-1 mt-1">SEK</span>
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
                        {/* Logo Box */}
                        <div className="w-10 h-10 bg-gradient-to-br from-orange-500 to-orange-600 rounded-[8px] flex items-center justify-center text-black shadow-[0_0_15px_rgba(249,115,22,0.3)]">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7"></rect><rect x="14" y="3" width="7" height="7"></rect><rect x="14" y="14" width="7" height="7"></rect><rect x="3" y="14" width="7" height="7"></rect></svg>
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
                                    placeholder="SÖK ORDER..."
                                    className="w-full h-full bg-zinc-900 text-white text-[11px] font-bold rounded-[6px] px-3 pl-9 uppercase focus:outline-none border border-zinc-800 focus:border-orange-500 placeholder:text-zinc-700"
                                />
                                <span className="absolute left-3 top-3 text-zinc-500">
                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
                                </span>
                                <button onClick={() => {setSearchOpen(false); setGlobalSearch('')}} className="absolute right-0 top-0 h-10 w-10 flex items-center justify-center text-zinc-500 hover:text-white">
                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                                </button>
                            </div>
                        ) : (
                            <button onClick={() => setSearchOpen(true)} className="w-10 h-10 flex items-center justify-center text-zinc-400 bg-zinc-900 border border-zinc-800 rounded-[6px] hover:text-white hover:border-zinc-700 transition-colors">
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
                            </button>
                        )}
                    </div>
                </div>

                {/* Filter Bar */}
                <div className="bg-white rounded-t-[12px] border-b border-zinc-200 p-3 flex overflow-x-auto no-scrollbar gap-2">
                    {['ALLA', 'BOKAD', 'OFFERERAD', 'EJ BOKAD', 'KLAR', 'FAKTURERAS'].map(s => (
                        <FilterChip key={s} label={s} />
                    ))}
                </div>
            </div>

            {/* CONTENT AREA */}
            <div className="flex-1 w-full bg-zinc-100">
                
                {/* DESKTOP (Tabell - Oförändrad) */}
                <div className="hidden lg:block bg-white m-8 border border-zinc-200 shadow-xl rounded-sm overflow-hidden">
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
                                    <td className="px-6 py-3 cursor-pointer" onClick={() => setView('NEW_JOB', { job: job })}>
                                        <div className="text-[11px] font-black uppercase text-zinc-900">{job.kundnamn}</div>
                                        <div className="text-[10px] text-[#94a3b8] font-bold uppercase tracking-tight">{job.id.substring(0,8)}</div>
                                    </td>
                                    <td className="px-6 py-3 font-mono font-bold text-[11px] uppercase text-zinc-700">{job.regnr}</td>
                                    <td className="px-6 py-3 text-[11px] font-bold text-zinc-600">
                                        {job.datum ? `${formatDate(job.datum)} ${job.datum.split('T')[1]}` : '-'}
                                    </td>
                                    <td className="px-6 py-3"><window.Badge status={job.status} /></td>
                                    <td className="px-6 py-3 text-right text-[12px] font-black text-zinc-900">{(parseInt(job.kundpris) || 0).toLocaleString()} kr</td>
                                    <td className="px-6 py-3 text-right">
                                        <div className="flex justify-end gap-2 opacity-50 group-hover:opacity-100">
                                            <button onClick={() => setView('NEW_JOB', { job: job })} className="p-1.5 text-zinc-400 hover:text-black">
                                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/></svg>
                                            </button>
                                            <button onClick={() => { if(confirm("Radera?")) window.db.collection("jobs").doc(job.id).update({deleted:true}); }} className="p-1.5 text-zinc-400 hover:text-red-600">
                                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/><line x1="10" y1="11" x2="10" y2="17"/><line x1="14" y1="11" x2="14" y2="17"/></svg>
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {/* MOBIL LISTA: Kant-till-Kant, Separerad, Tech-look */}
                <div className="lg:hidden w-full pb-24 pt-2 px-0 flex flex-col gap-2">
                    {filteredJobs.map(job => (
                        <MobileJobCard key={job.id} job={job} />
                    ))}
                    
                    {filteredJobs.length === 0 && (
                        <div className="flex flex-col items-center justify-center py-24 opacity-40">
                             <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" className="text-zinc-400 mb-2"><polyline points="22 12 16 12 14 15 10 15 8 12 2 12"></polyline><path d="M5.45 5.11L2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z"></path></svg>
                            <p className="text-[10px] font-black uppercase text-zinc-500">Inga order hittades</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
});
