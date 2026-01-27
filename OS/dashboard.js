// dashboard.js

// 1. SMART DATUMFORMATERARE
const formatDate = (dateStr) => {
    if (!dateStr) return null;
    
    const targetDate = new Date(dateStr);
    const today = new Date();
    
    targetDate.setHours(0, 0, 0, 0);
    today.setHours(0, 0, 0, 0);
    
    const diffTime = targetDate - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return "IDAG";
    if (diffDays === 1) return "IMORGON";
    if (diffDays === -1) return "IGÅR";
    
    if (diffDays >= 2 && diffDays <= 7) {
        const weekDays = ['SÖNDAG', 'MÅNDAG', 'TISDAG', 'ONSDAG', 'TORSDAG', 'FREDAG', 'LÖRDAG'];
        return weekDays[targetDate.getDay()];
    }
    
    const months = ['JAN', 'FEB', 'MAR', 'APR', 'MAJ', 'JUN', 'JUL', 'AUG', 'SEP', 'OKT', 'NOV', 'DEC'];
    return `${targetDate.getDate()} ${months[targetDate.getMonth()]}`;
};

// 2. STATUS BADGE (Uppfräschad design)
window.Badge = React.memo(({ status }) => {
    const s = (status || 'BOKAD').toUpperCase();
    
    // Färger och "dot"-färger
    const config = {
        'BOKAD':      { bg: 'bg-orange-50', text: 'text-orange-700', border: 'border-orange-200/60', dot: 'bg-orange-500' },
        'OFFERERAD':  { bg: 'bg-blue-50',   text: 'text-blue-700',   border: 'border-blue-200/60',   dot: 'bg-blue-500' },
        'KLAR':       { bg: 'bg-emerald-50',text: 'text-emerald-700',border: 'border-emerald-200/60',dot: 'bg-emerald-500' },
        'FAKTURERAS': { bg: 'bg-zinc-100',  text: 'text-zinc-600',   border: 'border-zinc-200',      dot: 'bg-zinc-400' },
    };

    const style = config[s] || config['BOKAD'];

    return (
        <span className={`pl-1.5 pr-2 py-1 text-[9px] font-bold uppercase tracking-wider inline-flex items-center gap-1.5 rounded-md border ${style.bg} ${style.text} ${style.border}`}>
            <span className={`w-1.5 h-1.5 rounded-full ${style.dot}`}></span>
            {s}
        </span>
    );
});

// 3. MOBILKORTET (Flyttad UTANFÖR DashboardView för att fixa menubuggen)
window.MobileJobCard = React.memo(({ job, setView }) => {
    const [menuOpen, setMenuOpen] = React.useState(false);

    const isWaiting = !job.datum;
    const dateString = formatDate(job.datum);
    const isUrgentDate = ['IDAG', 'IMORGON', 'IGÅR'].includes(dateString);
    const vehicleDisplay = job.regnr || job.bilmodell || '-';

    return (
        <div 
            onClick={() => setView('NEW_JOB', { job: job })}
            className="w-full relative active:bg-zinc-50 transition-colors border-b border-zinc-200 last:border-0 shadow-sm bg-white group select-none"
            style={isWaiting ? { backgroundImage: 'repeating-linear-gradient(45deg, #ffffff, #ffffff 10px, #f8fafc 10px, #f8fafc 20px)' } : {}}
        >
            {/* Statuslinje vänster */}
            <div className="absolute left-0 top-0 bottom-0 w-[4px] bg-orange-500"></div>

            <div className="pl-6 pr-4 py-3">
                
                {/* --- RAD 1: NAMN & MENY --- */}
                <div className="flex justify-between items-start mb-2">
                    
                    {/* Vänster: Namn & ID */}
                    <div className="flex flex-col min-w-0 pr-2">
                        <div className="text-[16px] font-black uppercase text-zinc-900 tracking-tight truncate leading-none mb-1.5">
                            {job.kundnamn}
                        </div>
                        <div className="inline-flex">
                            <span className="text-[10px] font-mono text-zinc-400 bg-zinc-50 px-1.5 rounded-[2px] border border-zinc-100">
                                #{job.id.substring(0,6)}
                            </span>
                        </div>
                    </div>
                    
                    {/* Höger: Badge + Meny-knapp */}
                    <div className="flex items-center gap-1.5 relative z-30">
                        <window.Badge status={job.status} />

                        {/* MENY-KNAPP - Ny design */}
                        <div className="relative">
                            <button 
                                onClick={(e) => {
                                    e.stopPropagation();
                                    setMenuOpen(!menuOpen);
                                }}
                                className={`w-[26px] h-[26px] flex items-center justify-center rounded-md border transition-all duration-200 
                                    ${menuOpen 
                                        ? 'bg-zinc-800 text-white border-zinc-800' 
                                        : 'bg-white text-zinc-400 border-zinc-200 hover:border-zinc-300 hover:text-zinc-600'
                                    }`}
                            >
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                    <circle cx="12" cy="12" r="1"></circle>
                                    <circle cx="12" cy="5" r="1"></circle>
                                    <circle cx="12" cy="19" r="1"></circle>
                                </svg>
                            </button>

                            {/* --- POPUP MENY --- */}
                            {menuOpen && (
                                <>
                                    <div 
                                        className="fixed inset-0 z-40 cursor-default" 
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            setMenuOpen(false);
                                        }}
                                    ></div>

                                    <div className="absolute right-0 top-full mt-1 w-48 bg-white rounded-lg shadow-xl border border-zinc-200 z-50 py-1 overflow-hidden animate-in fade-in zoom-in-95 duration-100 origin-top-right">
                                        {job.status !== 'KLAR' && (
                                            <button 
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    window.db.collection("jobs").doc(job.id).update({status: 'KLAR'});
                                                    setMenuOpen(false);
                                                }}
                                                className="w-full text-left px-4 py-3 text-[13px] font-bold uppercase tracking-wide text-zinc-600 hover:bg-emerald-50 hover:text-emerald-700 flex items-center gap-3 border-b border-zinc-50"
                                            >
                                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-emerald-500"><polyline points="20 6 9 17 4 12"></polyline></svg>
                                                Markera klar
                                            </button>
                                        )}

                                        <button 
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                if(confirm("Radera ordern?")) {
                                                    window.db.collection("jobs").doc(job.id).update({deleted:true});
                                                }
                                                setMenuOpen(false);
                                            }}
                                            className="w-full text-left px-4 py-3 text-[13px] font-bold uppercase tracking-wide text-red-600 hover:bg-red-50 flex items-center gap-3"
                                        >
                                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-red-500"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
                                            Radera order
                                        </button>
                                    </div>
                                </>
                            )}
                        </div>
                    </div>
                </div>

                {/* --- RAD 2: TECH BOX --- */}
                <div className="border border-zinc-200 rounded-[4px] bg-zinc-50/60 py-2 px-3 mb-2">
                    <div className="grid grid-cols-2 gap-4 divide-x divide-zinc-200 relative">
                        <div className="flex flex-col pr-2">
                            <span className="text-[9px] text-zinc-400 font-bold uppercase tracking-widest mb-0.5">Fordon</span>
                            <div className="flex items-center gap-2">
                                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-zinc-400 shrink-0">
                                    <path d="M14 16H9m10 0h3v-3.15a1 1 0 00-.84-.99L16 11l-2.7-3.6a1 1 0 00-.8-.4H5.24a2 2 0 00-1.8 1.1l-.8 1.63A6 6 0 002 12.42V16h2"></path>
                                    <circle cx="6.5" cy="16.5" r="2.5"></circle>
                                    <circle cx="16.5" cy="16.5" r="2.5"></circle>
                                </svg>
                                <span className="text-[13px] font-bold text-zinc-800 truncate leading-tight mt-0.5">
                                    {vehicleDisplay}
                                </span>
                            </div>
                        </div>
                        <div className="flex flex-col pl-4">
                            <span className="text-[9px] text-zinc-400 font-bold uppercase tracking-widest mb-0.5">Tidpunkt</span>
                            <div className="flex items-center gap-2">
                                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className={`shrink-0 ${isUrgentDate ? 'text-orange-500' : 'text-zinc-400'}`}>
                                    <circle cx="12" cy="12" r="10"></circle>
                                    <polyline points="12 6 12 12 16 14"></polyline>
                                </svg>
                                {job.datum ? (
                                    <div className="flex flex-col">
                                        <span className="text-[13px] font-bold text-zinc-800 leading-tight">
                                            {job.datum.split('T')[1]}
                                        </span>
                                        <span className={`text-[9px] font-bold uppercase leading-none mt-0.5 ${isUrgentDate ? 'text-orange-600' : 'text-zinc-400'}`}>
                                            {dateString}
                                        </span>
                                    </div>
                                ) : (
                                    <span className="text-[11px] font-bold text-red-500 mt-0.5">Inväntar</span>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {/* --- RAD 3: KOMMENTAR & PRIS --- */}
                <div className="flex items-end pt-1 min-h-[24px]">
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
});

// 4. HUVUDVY
window.DashboardView = React.memo(({ 
    filteredJobs, setEditingJob, setView, 
    activeFilter, setActiveFilter, statusCounts,
    globalSearch, setGlobalSearch 
}) => {
    const [searchOpen, setSearchOpen] = React.useState(false);
    const filters = ['BOKAD', 'OFFERERAD', 'FAKTURERAS', 'KLAR', 'ALLA'];
    
    // --- SWIPE LOGIC ---
    const touchStart = React.useRef(null);
    const touchStartY = React.useRef(null);

    const onTouchStart = (e) => {
        touchStart.current = e.targetTouches[0].clientX;
        touchStartY.current = e.targetTouches[0].clientY;
    };

    const onTouchEnd = (e) => {
        if (touchStart.current === null || touchStartY.current === null) return;

        const touchEnd = e.changedTouches[0].clientX;
        const touchEndY = e.changedTouches[0].clientY;
        const xDistance = touchStart.current - touchEnd;
        const yDistance = touchStartY.current - touchEndY;

        touchStart.current = null;
        touchStartY.current = null;

        if (Math.abs(yDistance) >= Math.abs(xDistance)) return; 
        if (Math.abs(xDistance) < 40) return;

        const isLeftSwipe = xDistance > 0;
        const currentIndex = filters.indexOf(activeFilter);
        let nextIndex = currentIndex;

        if (isLeftSwipe) {
            if (currentIndex < filters.length - 1) nextIndex = currentIndex + 1;
        } else {
            if (currentIndex > 0) nextIndex = currentIndex - 1;
        }

        if (nextIndex !== currentIndex) {
            setActiveFilter(filters[nextIndex]);
            const btn = document.getElementById(`filter-btn-${filters[nextIndex]}`);
            if (btn) btn.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
        }
    };

    const FilterChip = ({ label }) => {
        const isActive = activeFilter === label;
        return (
            <button 
                id={`filter-btn-${label}`}
                onClick={() => setActiveFilter(label)} 
                className={`
                    flex items-center gap-2 px-3 py-1.5 text-[9px] font-black uppercase tracking-wider shrink-0 transition-all rounded-[2px] border snap-start scroll-ml-4
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

    return (
        <div className="flex flex-col min-h-screen bg-zinc-100">
            {/* HEADER */}
            <div className="bg-[#0f0f11] text-white pt-safe-top pb-0 z-20 shadow-lg relative">
                <div className="px-0 py-4 flex items-center justify-between lg:px-4">
                    <div className="flex items-center gap-3 pl-4 lg:pl-0">
                        <div className="w-10 h-10 bg-gradient-to-br from-orange-500 to-orange-600 rounded-[2px] flex items-center justify-center text-black shadow-[0_0_15px_rgba(249,115,22,0.3)]">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="7" height="7"></rect><rect x="14" y="3" width="7" height="7"></rect><rect x="14" y="14" width="7" height="7"></rect><rect x="3" y="14" width="7" height="7"></rect></svg>
                        </div>
                        <div className={searchOpen ? 'hidden xs:block' : 'block'}>
                            <div className="text-[9px] text-zinc-500 font-bold uppercase tracking-widest leading-none mb-1">System</div>
                            <div className="text-[15px] font-black text-white uppercase tracking-wider leading-none">Mission Control</div>
                        </div>
                    </div>
                    <div className={`transition-all duration-300 pr-4 lg:pr-0 ${searchOpen ? 'flex-1 ml-4' : 'w-auto'}`}>
                        {searchOpen ? (
                            <div className="relative flex items-center h-10">
                                <input autoFocus type="text" value={globalSearch} onChange={e => setGlobalSearch(e.target.value)} placeholder="SÖK..." className="w-full h-full bg-zinc-900 text-white text-[11px] font-bold rounded-[2px] px-3 pl-9 uppercase focus:outline-none border border-zinc-800 focus:border-orange-500 placeholder:text-zinc-700" />
                                <span className="absolute left-3 top-3 text-zinc-500"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg></span>
                                <button onClick={() => {setSearchOpen(false); setGlobalSearch('')}} className="absolute right-0 top-0 h-10 w-10 flex items-center justify-center text-zinc-500 hover:text-white"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg></button>
                            </div>
                        ) : (
                            <button onClick={() => setSearchOpen(true)} className="w-10 h-10 flex items-center justify-center text-zinc-400 bg-zinc-900 border border-zinc-800 rounded-[2px] hover:text-white hover:border-zinc-700 transition-colors"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg></button>
                        )}
                    </div>
                </div>
                
                <div className="bg-white border-b border-zinc-200 p-3 flex overflow-x-auto gap-2 whitespace-nowrap" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
                    <style>{`div::-webkit-scrollbar { display: none; }`}</style>
                    {filters.map(s => <FilterChip key={s} label={s} />)}
                </div>
            </div>

            {/* CONTENT AREA */}
            <div 
                className="flex-1 w-full bg-zinc-100 min-h-[85vh] touch-pan-y" 
                style={{ touchAction: 'pan-y' }}
                onTouchStart={onTouchStart}
                onTouchEnd={onTouchEnd}
            >
                {/* DESKTOP TABELL - OFÖRÄNDRAD MEN REFERERAR NYA BADGEN */}
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
                                    <td className="px-6 py-4">
                                        {job.datum ? (
                                            <div className="flex flex-col">
                                                <span className="text-[12px] font-bold text-zinc-700">{formatDate(job.datum)}</span>
                                                <span className="text-[10px] font-mono text-zinc-400">{job.datum.split('T')[1]}</span>
                                            </div>
                                        ) : <span className="text-zinc-400">-</span>}
                                    </td>
                                    <td className="px-6 py-4"><window.Badge status={job.status} /></td>
                                    <td className="px-6 py-4 text-right text-[13px] font-mono font-bold text-zinc-900">{(parseInt(job.kundpris) || 0).toLocaleString()} kr</td>
                                    <td className="px-6 py-4 text-right">
                                        <div className="flex justify-end gap-3 opacity-50 group-hover:opacity-100">
                                            <button onClick={() => setView('NEW_JOB', { job: job })} className="text-zinc-400 hover:text-black"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/></svg></button>
                                            <button onClick={() => { if(confirm("Radera?")) window.db.collection("jobs").doc(job.id).update({deleted:true}); }} className="text-zinc-400 hover:text-red-600"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/><line x1="10" y1="11" x2="10" y2="17"/><line x1="14" y1="11" x2="14" y2="17"/></svg></button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {/* MOBIL LISTA */}
                <div className="lg:hidden w-full pb-24 px-4 flex flex-col gap-2 mt-2">
                    {filteredJobs.map((job, index) => {
                        const prevJob = filteredJobs[index - 1];
                        const currentDay = job.datum ? job.datum.split('T')[0] : 'NODATE';
                        const prevDay = prevJob && prevJob.datum ? prevJob.datum.split('T')[0] : 'NODATE';
                        const showHeader = index === 0 || currentDay !== prevDay;

                        return (
                            <React.Fragment key={job.id}>
                                {showHeader && (
                                    <div className={`flex items-end gap-2 mb-1 ${index !== 0 ? 'mt-3' : 'mt-1'}`}>
                                        <div className="text-[9px] font-black text-zinc-400 uppercase tracking-widest leading-none">
                                            {job.datum ? formatDate(job.datum) : 'Datum ej satt'}
                                        </div>
                                        <div className="h-[1px] bg-zinc-200 flex-1 mb-[2px]"></div>
                                    </div>
                                )}
                                {/* Nu använder vi den externa komponenten och skickar med setView */}
                                <window.MobileJobCard job={job} setView={setView} />
                            </React.Fragment>
                        );
                    })}
                    
                    {filteredJobs.length === 0 && (
                        <div className="flex flex-col items-center justify-center py-24 opacity-40">
                            <p className="text-[10px] font-black uppercase text-zinc-500">Inga order hittades</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
});
