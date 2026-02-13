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

const statusColors = {
    'BOKAD': 'bg-orange-500',
    'OFFERERAD': 'bg-blue-500',
    'KLAR': 'bg-emerald-500',
    'FAKTURERAS': 'bg-zinc-400',
};

// 3. MOBILKORTET (Flyttad UTANFÖR DashboardView för att fixa menubuggen)
const MobileJobCard = React.memo(({ job, setView, onOpenHistory }) => {
    const [menuOpen, setMenuOpen] = React.useState(false);

    // --- LOGIK ---
    const isWaiting = !job.datum;
    const dateString = formatDate(job.datum);
    const isUrgentDate = ['IDAG', 'IMORGON', 'IGÅR'].includes(dateString);
    
    // Avgör om jobbet är "historia" (klart eller långt fram i tiden)
    const isDone = ['KLAR', 'FAKTURERAS'].includes(job.status);
    const showAsHistory = isDone || (!isWaiting && !isUrgentDate);

    // Formattera fordon & Pris
    const vehicleDisplay = job.regnr || job.bilmodell || '-';
    // Koll: Ser det ut som ett regnr? (Kort + innehåller siffra)
    const isReg = vehicleDisplay.length <= 8 && /\d/.test(vehicleDisplay);
    const price = parseInt(job.kundpris) || 0;

    // Färger för vänsterkanten
    const statusColors = {
        'BOKAD': 'bg-orange-500',
        'OFFERERAD': 'bg-blue-500',
        'KLAR': 'bg-emerald-500',
        'FAKTURERAS': 'bg-zinc-400',
    };
    const sidebarColor = statusColors[job.status] || 'bg-orange-500';

    return (
        <div 
            onClick={() => setView('NEW_JOB', { job: job })}
            // Dämpa kortet om det är klart
            className={`w-full relative active:bg-zinc-50 transition-all border-b border-zinc-200 last:border-0 shadow-sm bg-white group select-none 
                ${isDone ? 'opacity-70 grayscale-[0.3]' : ''}`}
            style={isWaiting ? { backgroundImage: 'repeating-linear-gradient(45deg, #ffffff, #ffffff 10px, #f8fafc 10px, #f8fafc 20px)' } : {}}
        >
            {/* Vänsterlinje (Statusfärg) */}
            <div className={`absolute left-0 top-0 bottom-0 w-[4px] ${isDone ? 'bg-zinc-300' : sidebarColor}`}></div>

            <div className="pl-6 pr-4 py-3">
                
                {/* --- RAD 1: NAMN & MENY --- */}
                <div className="flex justify-between items-start mb-2">
                    <div className="flex flex-col min-w-0 pr-2">
                        <div className={`text-[16px] font-black uppercase tracking-tight truncate leading-none mb-1.5 ${isDone ? 'text-zinc-600' : 'text-zinc-900'}`}>
                            {job.kundnamn}
                        </div>
                        <div className="inline-flex">
                            <span className="text-[10px] font-mono text-zinc-400 bg-zinc-50 px-1.5 rounded-[2px] border border-zinc-100">
                                #{job.id.substring(0,6)}
                            </span>
                        </div>
                    </div>
                    
                    <div className="flex items-center gap-1.5 relative z-30">
                        <window.Badge status={job.status} />

                        {/* Meny-knapp med stor träffyta */}
                        <div className="relative">
                            <button 
                                onClick={(e) => {
                                    e.stopPropagation();
                                    setMenuOpen(!menuOpen);
                                }}
                                className="w-10 h-10 -mr-2 flex items-center justify-center focus:outline-none"
                            >
                                <div className={`w-[26px] h-[26px] flex items-center justify-center rounded-md border transition-all duration-200 pointer-events-none
                                    ${menuOpen 
                                        ? 'bg-zinc-800 text-white border-zinc-800' 
                                        : 'bg-white text-zinc-400 border-zinc-200 group-hover:border-zinc-300'
                                    }`}
                                >
                                    <window.Icon name="more-horizontal" size={16} />
                                </div>
                            </button>

                            {menuOpen && (
                                <>
                                    <div className="fixed inset-0 z-40 cursor-default" onClick={(e) => { e.stopPropagation(); setMenuOpen(false); }}></div>
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
                                                <window.Icon name="check" size={16} className="text-emerald-500" /> Markera klar
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
                                            <window.Icon name="trash-2" size={16} className="text-red-500" /> Radera order
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
                        
                        {/* FORDON & HISTORIK */}
                        <div className="flex flex-col pr-2">
                            <span className="text-[9px] text-zinc-400 font-bold uppercase tracking-widest mb-0.5">Fordon</span>
                            <div className="flex items-start gap-2">
                                <window.Icon name="car" size={15} className="text-zinc-400 shrink-0 mt-0.5" />
                                <div className="flex flex-col min-w-0">
                                    {/* Regnummer med "Skylt-look" om det är ett regnr */}
                                    <span className={`truncate leading-tight mt-0.5 ${isReg 
                                        ? 'font-mono text-[11px] bg-white border border-zinc-300 px-1.5 py-0.5 rounded-[3px] text-black tracking-widest shadow-sm w-fit' 
                                        : 'text-[13px] font-bold text-zinc-800'
                                    }`}>
                                        {vehicleDisplay}
                                    </span>
                                    
                                    {/* KNAPP: SE HISTORIK */}
                                    {(job.regnr && onOpenHistory) && (
                                        <button 
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                onOpenHistory(job.regnr);
                                            }}
                                            className="text-[9px] font-bold text-blue-600 hover:text-blue-800 flex items-center gap-1 mt-1.5 active:opacity-50 transition-opacity w-fit"
                                        >
                                            <window.Icon name="history" size={10} />
                                            Se historik
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* TID/DATUM */}
                        <div className="flex flex-col pl-4">
                            <span className="text-[9px] text-zinc-400 font-bold uppercase tracking-widest mb-0.5">
                                {showAsHistory ? 'Datum' : 'Tidpunkt'}
                            </span>
                            <div className="flex items-center gap-2">
                                <window.Icon name="clock" size={15} className={`shrink-0 ${!isDone && isUrgentDate ? 'text-orange-500' : 'text-zinc-400'}`} />
                                {job.datum ? (
                                    <div className="flex flex-col">
                                        <span className={`text-[13px] font-bold leading-tight ${showAsHistory ? 'text-zinc-700' : 'text-zinc-900'}`}>
                                            {showAsHistory ? dateString : job.datum.split('T')[1]}
                                        </span>
                                        <span className={`text-[9px] font-bold uppercase leading-none mt-0.5 ${!isDone && isUrgentDate ? 'text-orange-600' : 'text-zinc-400'}`}>
                                            {showAsHistory ? job.datum.split('T')[1] : dateString}
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
                                <window.Icon name="message-square" size={12} className="text-zinc-400 shrink-0 mt-[2px]" />
                                <span className="text-[10px] italic font-medium leading-tight line-clamp-2 text-zinc-600">
                                    {job.kommentar}
                                </span>
                            </div>
                        )}
                    </div>
                    
                    <div className="ml-auto flex flex-col items-end shrink-0 text-right">
                        {price > 0 ? (
                            <div className="flex items-baseline justify-end w-full">
                                <div className={`text-[20px] font-mono font-bold leading-none tracking-tight ${isDone ? 'text-zinc-700' : 'text-zinc-900'}`}>
                                    {price.toLocaleString('sv-SE')} 
                                </div>
                                <span className="text-[9px] text-zinc-400 font-medium ml-1 translate-y-[-1px]">KR</span>
                            </div>
                        ) : (
                            <span className="text-[10px] font-bold text-zinc-300 uppercase tracking-wide">Ej prissatt</span>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
});

// --- 4. HUVUDVY (Komplett med Historik-Modal State) ---
// --- 4. HUVUDVY (STRUCTURED & CONTAINED) ---
window.DashboardView = React.memo(({ 
    filteredJobs, setEditingJob, setView, 
    activeFilter, setActiveFilter, statusCounts,
    globalSearch, setGlobalSearch 
}) => {
    // --- STATE ---
    const [searchOpen, setSearchOpen] = React.useState(false);
    const [historyRegnr, setHistoryRegnr] = React.useState(null);

    const filters = ['ALLA', 'BOKAD', 'OFFERERAD', 'FAKTURERAS', 'KLAR'];

    // --- KPI LOGIK ---
    const totalValue = React.useMemo(() => {
        return filteredJobs.reduce((acc, job) => acc + (parseInt(job.kundpris) || 0), 0);
    }, [filteredJobs]);

    const urgentCount = React.useMemo(() => {
        return filteredJobs.filter(j => {
             if(!j.datum) return false;
             const d = formatDate(j.datum);
             return ['IDAG', 'IMORGON'].includes(d) && j.status !== 'KLAR';
        }).length;
    }, [filteredJobs]);

    // --- SWIPE (Mobile) ---
    const touchStart = React.useRef(null);
    const touchStartY = React.useRef(null);
    const onTouchStart = (e) => { touchStart.current = e.targetTouches[0].clientX; touchStartY.current = e.targetTouches[0].clientY; };
    const onTouchEnd = (e) => {
        if (touchStart.current === null || touchStartY.current === null) return;
        const xDiff = touchStart.current - e.changedTouches[0].clientX;
        const yDiff = touchStartY.current - e.changedTouches[0].clientY;
        touchStart.current = null; touchStartY.current = null;
        if (Math.abs(yDiff) >= Math.abs(xDiff) || Math.abs(xDiff) < 40) return;
        const currIdx = filters.indexOf(activeFilter);
        let nextIdx = currIdx + (xDiff > 0 ? 1 : -1);
        if (nextIdx >= 0 && nextIdx < filters.length) setActiveFilter(filters[nextIdx]);
    };

    // --- KOMPONENTER ---
    
    const TabButton = ({ label }) => {
        const isActive = activeFilter === label;
        const count = statusCounts[label] || 0;
        return (
            <button 
                onClick={() => setActiveFilter(label)}
                className={`px-4 py-2 text-[11px] font-bold uppercase tracking-wider transition-all rounded-t-lg border-t-2 
                    ${isActive 
                        ? 'bg-white text-black border-orange-500 shadow-[0_-5px_10px_rgba(0,0,0,0.02)]' 
                        : 'bg-transparent text-zinc-400 border-transparent hover:text-zinc-600 hover:bg-zinc-200/50'}
                `}
            >
                {label}
                {count > 0 && <span className={`ml-2 text-[9px] ${isActive ? 'text-orange-600' : 'text-zinc-400'}`}>({count})</span>}
            </button>
        );
    };

    return (
        // VIKTIGT: Mörkare bakgrund (zinc-100) för att skapa kontrast mot de vita boxarna
        <div className="flex flex-col min-h-screen bg-[#f4f4f5] font-sans text-zinc-900">
            
            {/* --- DESKTOP VY --- */}
            <div className="hidden lg:flex flex-col h-full px-8 py-8">
                
                {/* 1. HEADER (High Contrast) */}
                <div className="flex justify-between items-end mb-8">
                    <div>
                        <div className="flex items-center gap-2 mb-2">
                            <span className="w-2 h-2 rounded-full bg-orange-500 shadow-[0_0_10px_orange]"></span>
                            <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">System Online</span>
                        </div>
                        <h1 className="text-4xl font-black text-black uppercase tracking-tighter leading-none drop-shadow-sm">
                            Mission <span className="text-zinc-400">Control</span>
                        </h1>
                    </div>

                    <div className="flex items-center gap-4">
                        {/* Search Box (White on Gray) */}
                        <div className="relative group shadow-sm">
                            <input 
                                type="text" 
                                value={globalSearch} 
                                onChange={e => setGlobalSearch(e.target.value)}
                                placeholder="SÖK..." 
                                className="w-64 bg-white border border-zinc-200 text-black text-[12px] font-bold py-3 pl-4 pr-10 uppercase rounded-[4px] focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 transition-all placeholder:text-zinc-300"
                            />
                            <window.Icon name="search" size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-300" />
                        </div>
                        
                        <button 
                            onClick={() => setView('NEW_JOB')}
                            className="bg-black hover:bg-zinc-800 text-white h-[42px] px-6 rounded-[4px] flex items-center gap-3 shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all group border border-black"
                        >
                            <span className="text-[11px] font-black uppercase tracking-widest">Nytt Jobb</span>
                            <window.Icon name="plus" size={16} className="text-orange-500" />
                        </button>
                    </div>
                </div>

                {/* 2. STATS BAR (Separat vit box) */}
                <div className="bg-white rounded-[4px] border-l-4 border-l-orange-500 shadow-sm border-y border-r border-zinc-200 p-5 mb-6 flex items-center gap-12">
                    <div>
                        <div className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-1">Estimerat Värde</div>
                        <div className="text-[22px] font-black tracking-tight text-zinc-900 leading-none">{totalValue.toLocaleString()} <span className="text-[14px] text-zinc-400 font-medium">kr</span></div>
                    </div>
                    <div className="w-[1px] h-8 bg-zinc-100"></div>
                    <div>
                        <div className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-1">Antal Order</div>
                        <div className="text-[22px] font-black tracking-tight text-zinc-900 leading-none">{filteredJobs.length} <span className="text-[14px] text-zinc-400 font-medium">st</span></div>
                    </div>
                    <div className="w-[1px] h-8 bg-zinc-100"></div>
                    <div>
                        <div className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-1">Prioritet</div>
                        <div className={`text-[22px] font-black tracking-tight leading-none ${urgentCount > 0 ? 'text-orange-500' : 'text-zinc-900'}`}>
                            {urgentCount} <span className="text-[14px] text-zinc-400 font-medium text-black">st</span>
                        </div>
                    </div>
                </div>

                {/* 3. TABELL-CONTAINER (Detta fixar "allt smälter ihop") */}
                <div className="flex flex-col flex-1">
                    {/* Tabs sitter ihop med boxen */}
                    <div className="flex px-2 space-x-1">
                        {filters.map(f => <TabButton key={f} label={f} />)}
                    </div>

                    {/* Själva vita boxen */}
                    <div className="bg-white rounded-lg rounded-tl-none shadow-[0_2px_15px_-3px_rgba(0,0,0,0.07),0_10px_20px_-2px_rgba(0,0,0,0.04)] border border-zinc-200 overflow-hidden flex flex-col flex-1 min-h-[500px]">
                        <div className="flex-1 overflow-auto">
                            <table className="w-full text-left border-collapse">
                                <thead className="bg-zinc-50 border-b border-zinc-200 text-zinc-500 text-[10px] uppercase tracking-widest font-bold">
                                    <tr>
                                        <th className="pl-6 pr-4 py-4 w-[25%]">Kund</th>
                                        <th className="px-4 py-4 w-[15%]">Fordon</th>
                                        <th className="px-4 py-4 w-[15%]">Datum</th>
                                        <th className="px-4 py-4 w-[15%]">Status</th>
                                        <th className="px-4 py-4 w-[15%] text-right">Belopp</th>
                                        <th className="pl-4 pr-6 py-4 w-[15%] text-right"></th>
                                    </tr>
                                </thead>
                                {/* Divide-y skapar linjer mellan varje rad */}
                                <tbody className="divide-y divide-zinc-100">
                                    {filteredJobs.map((job, idx) => {
                                        const dateText = formatDate(job.datum);
                                        const isUrgent = ['IDAG', 'IMORGON'].includes(dateText) && job.status !== 'KLAR';
                                        const regDisplay = job.regnr || job.bilmodell || '-';
                                        const isReg = regDisplay.length <= 8 && /\d/.test(regDisplay);

                                        return (
                                            <tr 
                                                key={job.id} 
                                                onClick={() => setView('NEW_JOB', { job: job })}
                                                className="group hover:bg-orange-50/30 transition-colors cursor-pointer"
                                            >
                                                {/* KUND */}
                                                <td className="pl-6 pr-4 py-4 align-top">
                                                    <div className="flex items-start gap-3">
                                                        <div className={`mt-1.5 w-2 h-2 rounded-sm shrink-0 ${isUrgent ? 'bg-orange-500' : 'bg-zinc-300'}`}></div>
                                                        <div>
                                                            <div className="text-[14px] font-bold text-zinc-900 leading-none mb-1">
                                                                {job.kundnamn}
                                                            </div>
                                                            <div className="flex items-center gap-2">
                                                                <span className="text-[10px] font-mono text-zinc-400 bg-zinc-50 px-1 rounded border border-zinc-100">#{job.id.substring(0,6)}</span>
                                                                {job.kommentar && <window.Icon name="message-circle" size={12} className="text-zinc-400" />}
                                                            </div>
                                                        </div>
                                                    </div>
                                                </td>

                                                {/* FORDON */}
                                                <td className="px-4 py-4 align-top">
                                                    <div 
                                                        onClick={(e) => { e.stopPropagation(); if(job.regnr) setHistoryRegnr(job.regnr); }}
                                                        className={`inline-block font-mono font-bold text-[11px] px-2 py-1 rounded-[3px] border transition-transform hover:-translate-y-0.5
                                                            ${isReg 
                                                                ? 'bg-white border-zinc-300 text-black shadow-sm group-hover:border-orange-300' 
                                                                : 'bg-transparent border-transparent text-zinc-400'
                                                            }`}
                                                    >
                                                        {regDisplay}
                                                    </div>
                                                </td>

                                                {/* DATUM */}
                                                <td className="px-4 py-4 align-top">
                                                    {job.datum ? (
                                                        <div>
                                                            <div className={`text-[11px] font-black uppercase ${isUrgent ? 'text-orange-600' : 'text-zinc-800'}`}>
                                                                {dateText}
                                                            </div>
                                                            <div className="text-[10px] font-mono text-zinc-400">
                                                                {job.datum.split('T')[1]}
                                                            </div>
                                                        </div>
                                                    ) : <span className="text-[10px] font-bold text-zinc-300 uppercase">Inväntar</span>}
                                                </td>

                                                {/* STATUS */}
                                                <td className="px-4 py-4 align-top">
                                                    <window.Badge status={job.status} />
                                                </td>

                                                {/* BELOPP */}
                                                <td className="px-4 py-4 align-top text-right">
                                                    <div className="font-mono font-bold text-[14px] text-zinc-900">
                                                        {(parseInt(job.kundpris) || 0).toLocaleString()} <span className="text-[10px] text-zinc-400">kr</span>
                                                    </div>
                                                </td>

                                                {/* ACTIONS */}
                                                <td className="pl-4 pr-6 py-4 align-middle text-right">
                                                    <div className="opacity-0 group-hover:opacity-100 transition-opacity flex justify-end gap-2">
                                                        <button 
                                                            onClick={(e) => { e.stopPropagation(); setView('NEW_JOB', { job: job }); }} 
                                                            className="w-8 h-8 flex items-center justify-center rounded bg-white border border-zinc-200 text-zinc-400 hover:text-blue-600 hover:border-blue-300 hover:shadow-sm transition-all"
                                                        >
                                                            <window.Icon name="edit-2" size={14} />
                                                        </button>
                                                        <button 
                                                            onClick={(e) => { e.stopPropagation(); if(confirm("Radera?")) window.db.collection("jobs").doc(job.id).update({deleted:true}); }} 
                                                            className="w-8 h-8 flex items-center justify-center rounded bg-white border border-zinc-200 text-zinc-400 hover:text-red-600 hover:border-red-300 hover:shadow-sm transition-all"
                                                        >
                                                            <window.Icon name="trash" size={14} />
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                    {filteredJobs.length === 0 && (
                                        <tr><td colSpan="6" className="py-20 text-center text-zinc-400 text-[10px] font-bold uppercase">Listan är tom</td></tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>

            {/* --- MOBILE VIEW (Standard) --- */}
            <div 
                className="lg:hidden flex flex-col min-h-screen bg-[#f4f4f5]"
                onTouchStart={onTouchStart} onTouchEnd={onTouchEnd}
            >
                <div className="bg-[#0f0f11] text-white pt-safe-top sticky top-0 z-40 shadow-md pb-0">
                     <div className="px-4 py-3 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                             <div className="w-8 h-8 bg-orange-500 rounded-[2px] flex items-center justify-center text-black font-bold">
                                <window.Icon name="grid" size={16} />
                            </div>
                            <span className="text-[14px] font-black uppercase tracking-wider">Mission Control</span>
                        </div>
                        <button onClick={() => setSearchOpen(!searchOpen)} className="text-zinc-400"><window.Icon name={searchOpen ? "x" : "search"} size={20} /></button>
                     </div>
                     {searchOpen && (
                         <div className="px-4 pb-3">
                             <input autoFocus type="text" value={globalSearch} onChange={e => setGlobalSearch(e.target.value)} placeholder="SÖK..." className="w-full h-10 bg-zinc-800 text-white rounded-[2px] px-3 text-sm focus:outline-none" />
                         </div>
                     )}
                     <div className="flex overflow-x-auto gap-2 px-4 pb-3" style={{scrollbarWidth:'none'}}>
                         {filters.map(s => {
                             const isActive = activeFilter === s;
                             return (
                                 <button key={s} onClick={() => setActiveFilter(s)} 
                                    className={`px-3 py-1.5 text-[10px] font-black uppercase tracking-wider rounded-[2px] border whitespace-nowrap flex items-center gap-2
                                    ${isActive ? 'bg-white text-black border-white' : 'bg-zinc-800 text-zinc-500 border-zinc-700'}`}>
                                    {s} 
                                    {statusCounts[s] > 0 && <span className={`px-1 rounded-[2px] ${isActive ? 'bg-black text-white' : 'bg-zinc-700 text-zinc-400'}`}>{statusCounts[s]}</span>}
                                 </button>
                             )
                         })}
                     </div>
                </div>

                <div className="px-3 py-2 pb-24 flex flex-col gap-2">
                    {filteredJobs.map((job) => (
                        <MobileJobCard key={job.id} job={job} setView={setView} onOpenHistory={setHistoryRegnr} />
                    ))}
                </div>
            </div>

            {/* MODUL: History */}
            {historyRegnr && window.VehicleProfileLoader && (
                <window.VehicleProfileLoader regnr={historyRegnr} onClose={() => setHistoryRegnr(null)} setView={setView} />
            )}
        </div>
    );
});
