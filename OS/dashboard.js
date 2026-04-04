// dashboard.js

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

// 2. PREMIUM STATUS BADGE
window.Badge = React.memo(({ status }) => {
    const s = (status || 'BOKAD').toUpperCase();
    const config = {
        'BOKAD': { bg: 'bg-orange-50/80 dark:bg-orange-500/10', text: 'text-orange-700 dark:text-orange-400', border: 'border-orange-200/60 dark:border-orange-500/20', dot: 'bg-orange-500 shadow-[0_0_8px_rgba(249,115,22,0.6)]' },
        'OFFERERAD': { bg: 'bg-blue-50/80 dark:bg-blue-500/10', text: 'text-blue-700 dark:text-blue-400', border: 'border-blue-200/60 dark:border-blue-500/20', dot: 'bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.6)]' },
        'KLAR': { bg: 'bg-emerald-50/80 dark:bg-emerald-500/10', text: 'text-emerald-700 dark:text-emerald-400', border: 'border-emerald-200/60 dark:border-emerald-500/20', dot: 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.6)]' },
        'FAKTURERAS': { bg: 'bg-zinc-100/80 dark:bg-white/5', text: 'text-zinc-600 dark:text-zinc-300', border: 'border-zinc-200/80 dark:border-white/10', dot: 'bg-zinc-400' },
    };
    const style = config[s] || config['BOKAD'];
    return (
        <span className={`px-2.5 py-1 text-[9px] font-bold uppercase tracking-widest inline-flex items-center gap-1.5 rounded-lg border backdrop-blur-sm ${style.bg} ${style.text} ${style.border}`}>
            <span className={`w-1.5 h-1.5 rounded-full ${style.dot}`}></span>
            {s}
        </span>
    );
});

// Färg-generator för avatarer
const getAvatarTheme = (name) => {
    if (!name) return 'bg-zinc-100 text-zinc-600 border-zinc-200 dark:bg-[#182032] dark:text-zinc-400 dark:border-white/5';
    const themes = [
        'bg-blue-50 text-blue-600 border-blue-200 dark:bg-blue-500/10 dark:text-blue-400 dark:border-blue-500/20',
        'bg-emerald-50 text-emerald-600 border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20',
        'bg-violet-50 text-violet-600 border-violet-200 dark:bg-violet-500/10 dark:text-violet-400 dark:border-violet-500/20',
        'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-500/10 dark:text-amber-400 dark:border-amber-500/20',
        'bg-rose-50 text-rose-600 border-rose-200 dark:bg-rose-500/10 dark:text-rose-400 dark:border-rose-500/20',
        'bg-cyan-50 text-cyan-600 border-cyan-200 dark:bg-cyan-500/10 dark:text-cyan-400 dark:border-cyan-500/20'
    ];
    let hash = 0;
    for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
    return themes[Math.abs(hash) % themes.length];
};

// 3. MOBILKORTET
const mobileCardPropsAreEqual = (prev, next) => {
    return prev.job === next.job && prev.job.status === next.job.status && prev.job.datum === next.job.datum;
};

const MobileJobCard = React.memo(({ job, setView, onOpenHistory }) => {
    const [menuOpen, setMenuOpen] = React.useState(false);
    const [copied, setCopied] = React.useState(false); // LOKALT STATE FÖR KOPIERING

    const isWaiting = !job.datum;
    const dateString = formatDate(job.datum);
    const isUrgentDate = ['IDAG', 'IMORGON', 'IGÅR'].includes(dateString);
    const isDone = ['KLAR', 'FAKTURERAS'].includes(job.status);
    const showAsHistory = isDone || (!isWaiting && !isUrgentDate);

    const vehicleDisplay = job.regnr || job.bilmodell || '-';
    const isReg = vehicleDisplay.length <= 8 && /\d/.test(vehicleDisplay);
    const price = parseInt(job.kundpris) || 0;

    const initials = job.kundnamn ? job.kundnamn.split(' ').map(n => n[0]).join('').substring(0,2).toUpperCase() : '??';
    const avatarTheme = getAvatarTheme(job.kundnamn);

    // FUNKTION FÖR SNABBKOPIERING (MOBIL)
    const handleCopy = (e) => {
        e.stopPropagation(); // Förhindrar att kortet öppnas
        if (!job.regnr || job.regnr === '-') return;
        navigator.clipboard.writeText(vehicleDisplay);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <div
            onClick={() => job.regnr ? onOpenHistory(job.regnr, job.id) : null}
            className={`w-full relative active:scale-[0.98] transition-all bg-white hover:bg-orange-50 dark:bg-[#182032] dark:hover:bg-[#1f2940] border-2 border-zinc-200 dark:border-zinc-600 rounded-xl shadow-md group select-none overflow-hidden mb-3 ${isDone ? 'opacity-70 grayscale-[0.3]' : ''}`}
        >
            <div className="p-4">
                {/* RAD 1: Header */}
                <div className="flex justify-between items-start mb-4">
                    <div className="flex items-center gap-3 min-w-0 pr-2">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center text-[13px] font-bold shrink-0 border ${avatarTheme}`}>
                            {initials}
                        </div>
                        <div className="flex flex-col min-w-0">
                            <div className={`text-[15px] font-bold truncate leading-tight mb-0.5 ${isDone ? 'text-zinc-600 dark:text-zinc-500' : 'text-zinc-900 dark:text-white'}`}>
                                {job.kundnamn}
                            </div>
                            <div className="text-[11px] font-mono text-zinc-400 dark:text-zinc-500 flex items-center gap-1">
                                <window.Icon name="hash" size={10} /> {job.id.substring(0, 6)}
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center gap-3 relative z-30">
                        <window.Badge status={job.status} />
                        <div className="relative">
                            <button onClick={(e) => { e.stopPropagation(); setMenuOpen(!menuOpen); }} className="w-8 h-8 -mr-2 -mt-1 flex items-center justify-center text-zinc-400 hover:text-black dark:text-zinc-500 dark:hover:text-white transition-colors">
                                <window.Icon name="more-horizontal" size={18} />
                            </button>
                            {/* Premium Menyn (Mobil) */}
                            {menuOpen && (
                                <>
                                    <div className="fixed inset-0 z-40 cursor-default" onClick={(e) => { e.stopPropagation(); setMenuOpen(false); }}></div>
                                    <div className="absolute right-0 top-full mt-2 w-48 bg-white/95 dark:bg-[#182032]/95 backdrop-blur-xl rounded-xl shadow-2xl border border-zinc-200 dark:border-white/10 z-50 p-1.5 overflow-hidden animate-in fade-in zoom-in-95 origin-top-right">
                                        {job.status !== 'KLAR' && (
                                            <button onClick={(e) => { e.stopPropagation(); window.db.collection("jobs").doc(job.id).update({ status: 'KLAR' }); setMenuOpen(false); }} className="w-full text-left px-3 py-2.5 text-[12px] font-bold uppercase tracking-wide text-zinc-700 dark:text-zinc-300 hover:bg-emerald-50 dark:hover:bg-emerald-500/10 hover:text-emerald-600 dark:hover:text-emerald-400 flex items-center gap-2.5 rounded-lg transition-colors">
                                                <window.Icon name="check-circle" size={14} className="text-emerald-500" /> Markera klar
                                            </button>
                                        )}
                                        <button onClick={(e) => { e.stopPropagation(); setView('NEW_JOB', { job: job }); setMenuOpen(false); }} className="w-full text-left px-3 py-2.5 text-[12px] font-bold uppercase tracking-wide text-zinc-700 dark:text-zinc-300 hover:bg-blue-50 dark:hover:bg-blue-500/10 hover:text-blue-600 dark:hover:text-blue-400 flex items-center gap-2.5 rounded-lg transition-colors">
                                            <window.Icon name="edit-2" size={14} className="text-blue-500" /> Redigera order
                                        </button>
                                        <div className="h-px bg-zinc-100 dark:bg-white/5 my-1 mx-2"></div>
                                        <button onClick={(e) => { e.stopPropagation(); if (confirm("Radera ordern?")) { window.db.collection("jobs").doc(job.id).update({ deleted: true }); } setMenuOpen(false); }} className="w-full text-left px-3 py-2.5 text-[12px] font-bold uppercase tracking-wide text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 flex items-center gap-2.5 rounded-lg transition-colors">
                                            <window.Icon name="trash-2" size={14} className="text-red-500" /> Radera order
                                        </button>
                                    </div>
                                </>
                            )}
                        </div>
                    </div>
                </div>

                {/* RAD 2: Info-box */}
                <div className="flex items-center p-3 mb-4 rounded-lg border border-zinc-200 dark:border-white/5 bg-zinc-50/80 dark:bg-[#0f1522]/50 divide-x divide-zinc-200 dark:divide-white/5">
                    
                    {/* VÄNSTER: Fordon med Kopieringsfunktion */}
                    <div className="flex flex-col flex-1 pr-3 min-w-0">
                        <span className="text-[9px] text-zinc-400 dark:text-zinc-500 font-black uppercase tracking-widest mb-1.5 flex items-center gap-1.5">
                            <window.Icon name="truck" size={10} /> Fordon
                        </span>
                        
                        <div 
                            onClick={handleCopy}
                            title="Kopiera Reg.nr"
                            className={`inline-flex items-center rounded-[3px] border overflow-hidden h-[24px] relative transition-colors cursor-pointer hover:border-orange-400 dark:hover:border-orange-500/50 ${isReg ? 'bg-white dark:bg-[#182032] border-zinc-300 dark:border-[#2a3441]' : 'bg-transparent border-transparent'}`}
                        >
                            {/* Feedback Overlay när kopierad */}
                            {copied && (
                                <div className="absolute inset-0 bg-emerald-500 flex items-center justify-center text-white z-20 animate-in fade-in duration-200">
                                    <window.Icon name="check" size={14} />
                                </div>
                            )}

                            {isReg ? (
                                <>
                                    <div className="w-[12px] bg-[#003399] h-full flex flex-col items-center justify-between py-[1px] shrink-0 border-r border-zinc-200 dark:border-[#2a3441]">
                                        <div className="w-1.5 h-1.5 rounded-full border-[1px] border-[#ffcc00] mt-[1px]"></div>
                                        <span className="text-[6px] font-sans font-black text-white leading-none antialiased mb-[1px]">S</span>
                                    </div>
                                    <div className="flex h-full items-center justify-center px-2 min-w-[60px]"><span className="font-mono font-bold text-[12px] text-zinc-900 dark:text-zinc-200 tracking-wider leading-none mt-[1px]">{vehicleDisplay}</span></div>
                                </>
                            ) : (
                                <span className="font-mono font-bold text-[13px] text-zinc-800 dark:text-zinc-300 uppercase leading-none mt-[1px]">{vehicleDisplay}</span>
                            )}
                        </div>
                    </div>

                    {/* HÖGER: Datum & Tid */}
                    <div className="flex flex-col items-end text-right flex-1 pl-3 min-w-0 justify-center">
                        <span className="text-[9px] text-zinc-400 dark:text-zinc-500 font-black uppercase tracking-widest mb-1.5 flex items-center justify-end gap-1.5 w-full">
                            <window.Icon name="clock" size={10} /> {job.datum ? 'Datum & Tid' : 'Status'}
                        </span>
                        {job.datum ? (
                            <div className="flex items-center justify-end gap-1.5 h-[24px]">
                                {!isDone && isUrgentDate && (
                                    <span className="relative flex h-2 w-2 shrink-0">
                                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-orange-400 opacity-75"></span>
                                        <span className="relative inline-flex rounded-full h-2 w-2 bg-orange-500 shadow-[0_0_8px_rgba(249,115,22,0.6)]"></span>
                                    </span>
                                )}
                                <span className={`text-[12px] font-black uppercase leading-none truncate mt-[1px] ${!isDone && isUrgentDate ? 'text-orange-500' : 'text-zinc-900 dark:text-white'}`}>
                                    {dateString}, <span className="font-mono font-bold text-[11px] text-zinc-500 dark:text-zinc-400">{job.datum.split('T')[1]}</span>
                                </span>
                            </div>
                        ) : (
                            <div className="flex items-center justify-end h-[24px]">
                                <span className="text-[11px] font-bold text-red-500 uppercase tracking-widest mt-[1px]">Inväntar</span>
                            </div>
                        )}
                    </div>
                </div>

                {/* RAD 3: Tjänst & Pris */}
                <div className="flex items-end justify-between mt-1">
                    <div className="flex-1 min-w-0 mr-4">
                        <span className="text-[14px] font-black text-zinc-900 dark:text-white uppercase tracking-tight block truncate">{job.paket || 'Standard'}</span>
                        {job.kommentar && (
                            <span className="text-[11px] text-zinc-600 dark:text-zinc-400 mt-1 line-clamp-1 italic flex items-center gap-1.5 font-medium">
                                <window.Icon name="message-square" size={10} className="shrink-0" />
                                {job.kommentar}
                            </span>
                        )}
                    </div>
                    
                    <div className="shrink-0 text-right">
                        {price > 0 ? (
                            <div className="flex items-baseline justify-end gap-1">
                                <span className="text-[18px] font-mono font-black text-zinc-900 dark:text-white leading-none">
                                    {price.toLocaleString('sv-SE')}
                                </span> 
                                <span className="text-[10px] text-zinc-400 font-sans font-bold uppercase tracking-wider">kr</span>
                            </div>
                        ) : (
                            <span className="text-[10px] font-medium text-zinc-400 uppercase tracking-widest block mt-1">Ej prissatt</span>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}, mobileCardPropsAreEqual);

// --- 4. HUVUDVY ---
const dashboardPropsAreEqual = (prev, next) => {
    return prev.filteredJobs === next.filteredJobs && prev.activeFilter === next.activeFilter && prev.globalSearch === next.globalSearch && prev.statusCounts === next.statusCounts;
};

// --- SMART TEXTTOLK FÖR UPPGIFTER ---
// --- SMART TEXTTOLK FÖR UPPGIFTER (Sömlös version) ---
window.TaskFormatter = React.memo(({ text }) => {
    const [copiedToken, setCopiedToken] = React.useState(null);
    
    // Letar efter antingen länkar ELLER regnr (tillåter mellanslag, t.ex. ABC 123)
    const regex = /(https?:\/\/[^\s]+|[a-zA-ZåäöÅÄÖ]{3}\s?\d{2}[a-zA-Z0-9])/g;
    const parts = text.split(regex);

    const handleCopy = (e, token) => {
        e.stopPropagation();
        navigator.clipboard.writeText(token);
        setCopiedToken(token);
        setTimeout(() => setCopiedToken(null), 1500);
    };

    return (
        <span className="text-[13px] font-medium leading-snug break-words select-text cursor-text text-zinc-700 dark:text-zinc-200">
            {parts.map((part, i) => {
                if (!part) return null;

                // Är det en länk?
                if (/^https?:\/\//.test(part)) {
                    return (
                        <a key={i} href={part} target="_blank" rel="noopener noreferrer" className="text-blue-500 dark:text-blue-400 border-b border-dashed border-blue-500/50 hover:text-orange-500 hover:border-orange-500 transition-colors">
                            {part}
                        </a>
                    );
                }
                
                // Är det ett Reg.nr?
                if (/^[a-zA-ZåäöÅÄÖ]{3}\s?\d{2}[a-zA-Z0-9]$/.test(part)) {
                    const cleanReg = part.replace(/\s+/g, '').toUpperCase();
                    const isCopied = copiedToken === cleanReg;
                    
                    return (
                        <span
                            key={i}
                            onClick={(e) => handleCopy(e, cleanReg)}
                            title="Klicka för att kopiera"
                            className={`inline-flex items-center cursor-pointer transition-colors border-b border-dashed ${
                                isCopied 
                                    ? 'text-emerald-600 dark:text-emerald-400 border-emerald-500/30' 
                                    : 'border-zinc-400/60 dark:border-zinc-500/60 hover:text-orange-500 hover:border-orange-500 dark:hover:text-orange-400 dark:hover:border-orange-400'
                            }`}
                        >
                            {isCopied && <window.Icon name="check" size={12} className="mr-0.5 relative top-[1px]" />}
                            {cleanReg}
                        </span>
                    );
                }
                
                // Vanlig text
                return <span key={i}>{part}</span>;
            })}
        </span>
    );
});

// --- DASHBOARD WIDGETS (Exceptionell Version) ---

window.DashboardWidgets = React.memo(({ allJobs }) => {
    
    // ==========================================
    // 1. LOGIK: UPPGIFTER (Mina Uppgifter - Firebase Live Sync)
    // ==========================================
    const [tasks, setTasks] = React.useState([]);
    const [newTask, setNewTask] = React.useState('');

    // Lyssna på uppgifter från Firebase i realtid
    React.useEffect(() => {
        if (!window.db) return;
        
        const unsubscribe = window.db.collection("tasks")
            .orderBy("createdAt", "asc")
            .onSnapshot(snap => {
                const fetchedTasks = snap.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data()
                }));
                setTasks(fetchedTasks);
            }, error => {
                console.error("Kunde inte hämta uppgifter:", error);
            });

        return () => unsubscribe();
    }, []);

    const toggleTask = (id, currentStatus) => {
        window.db.collection("tasks").doc(id).update({ 
            done: !currentStatus 
        });
    };

    const addTask = (e) => {
        e.preventDefault();
        if (!newTask.trim()) return;
        
        window.db.collection("tasks").add({ 
            text: newTask.trim(), 
            done: false,
            createdAt: window.firebase.firestore.FieldValue.serverTimestamp()
        });
        
        setNewTask('');
    };

    const deleteTask = (e, id) => {
        e.stopPropagation();
        window.db.collection("tasks").doc(id).delete();
    };

    const completedTasks = tasks.filter(t => t.done).length;
    const taskProgress = tasks.length === 0 ? 0 : Math.round((completedTasks / tasks.length) * 100);

    // ==========================================
    // 2. LOGIK: BELÄGGNING (Kommande 5 dagar)
    // ==========================================
    const upcomingDays = React.useMemo(() => {
        const days = [];
        const today = new Date();
        const dayNames = ['Sön', 'Mån', 'Tis', 'Ons', 'Tor', 'Fre', 'Lör'];
        let maxJobs = 1; 

        for (let i = 0; i < 5; i++) {
            const d = new Date();
            d.setDate(today.getDate() + i);
            const targetIso = d.toISOString().split('T')[0];
            const count = allJobs.filter(j => j.datum && j.datum.startsWith(targetIso)).length;
            if (count > maxJobs) maxJobs = count;
        }

        for (let i = 0; i < 5; i++) {
            const targetDate = new Date();
            targetDate.setDate(today.getDate() + i);
            const targetIso = targetDate.toISOString().split('T')[0];

            const jobsThisDay = allJobs.filter(job => {
                if (!job.datum) return false;
                return job.datum.startsWith(targetIso);
            }).length;

            const heightPercent = jobsThisDay === 0 ? 5 : (jobsThisDay / maxJobs) * 100;
            
            let colorClass = 'from-orange-400 to-orange-300'; 
            if (jobsThisDay > 4) colorClass = 'from-orange-500 to-orange-400'; 
            if (jobsThisDay > 8) colorClass = 'from-red-500 to-orange-500'; 

            days.push({
                label: i === 0 ? 'Idag' : dayNames[targetDate.getDay()],
                count: jobsThisDay,
                isToday: i === 0,
                height: `${heightPercent}%`,
                colorClass: colorClass
            });
        }
        return days;
    }, [allJobs]);

    // Ladda in ikoner efter att datan renderats
    React.useEffect(() => {
        if (window.lucide) window.lucide.createIcons();
    }, [tasks, upcomingDays]);

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 lg:gap-6 mb-2 lg:mb-8">
            
            {/* --- WIDGET 1: BELÄGGNING --- */}
            <div className="bg-white/80 dark:bg-[#182032]/80 backdrop-blur-xl rounded-3xl border border-zinc-200/80 dark:border-white/5 p-6 shadow-sm hover:shadow-md transition-all flex flex-col justify-between group/widget relative overflow-hidden">
                <div className="absolute right-0 bottom-0 w-32 h-32 bg-orange-500/5 blur-3xl rounded-full pointer-events-none"></div>

                <div className="flex justify-between items-start mb-6 relative z-10">
                    <div>
                        <h3 className="text-[13px] font-bold text-zinc-900 dark:text-white flex items-center gap-2 mb-1">
                            Arbetsbelastning
                        </h3>
                        <p className="text-[10px] text-zinc-400 font-medium uppercase tracking-widest flex items-center gap-1.5">
                            <window.Icon name="calendar" size={10} /> Kommande 5 Dagar
                        </p>
                    </div>
                    <div className="flex items-center gap-1 bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 px-2 py-1 rounded-lg text-[9px] font-bold uppercase tracking-widest border border-emerald-200/50 dark:border-emerald-500/20">
                        <window.Icon name="trending-up" size={10} /> Live
                    </div>
                </div>
                
                <div className="flex items-end justify-between h-32 gap-3 mt-auto pt-4 relative z-10">
                    {upcomingDays.map((day, i) => (
                        <div key={i} className="flex flex-col items-center flex-1 group h-full justify-end cursor-default">
                            <div className="absolute -top-2 opacity-0 group-hover:opacity-100 group-hover:-translate-y-2 transition-all duration-300 flex flex-col items-center pointer-events-none z-20">
                                <span className="bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 text-[11px] font-bold px-2.5 py-1 rounded-md shadow-xl whitespace-nowrap">
                                    {day.count} Bilar
                                </span>
                                <div className="w-0 h-0 border-l-[4px] border-r-[4px] border-t-[4px] border-l-transparent border-r-transparent border-t-zinc-900 dark:border-t-white"></div>
                            </div>

                            <div className="w-full max-w-[36px] h-full bg-zinc-100 dark:bg-white/5 rounded-xl flex items-end overflow-hidden p-1 relative shadow-inner">
                                <div 
                                    className={`w-full rounded-lg transition-all duration-1000 ease-out bg-gradient-to-t ${day.isToday || day.count > 0 ? day.colorClass : 'from-zinc-300 to-zinc-200 dark:from-zinc-600 dark:to-zinc-500'} group-hover:brightness-110`}
                                    style={{ height: day.height }}
                                ></div>
                            </div>
                            <span className={`text-[10px] font-bold uppercase tracking-widest mt-3 transition-colors ${day.isToday ? 'text-orange-500' : 'text-zinc-400 group-hover:text-zinc-600 dark:group-hover:text-zinc-300'}`}>
                                {day.label}
                            </span>
                        </div>
                    ))}
                </div>
            </div>

            {/* --- WIDGET 2: MINA UPPGIFTER --- */}
            <div className="bg-white/80 dark:bg-[#182032]/80 backdrop-blur-xl rounded-3xl border border-zinc-200/80 dark:border-white/5 p-6 shadow-sm hover:shadow-md transition-all relative overflow-hidden flex flex-col min-h-[220px]">
                
                <div className="absolute top-0 left-0 right-0 h-1 bg-zinc-100 dark:bg-white/5">
                    <div 
                        className="h-full bg-gradient-to-r from-orange-400 to-orange-500 transition-all duration-500 ease-out shadow-[0_0_10px_rgba(249,115,22,0.4)]"
                        style={{ width: `${taskProgress}%` }}
                    ></div>
                </div>
                
                <div className="flex justify-between items-end mb-4 relative z-10 pt-2">
                    <div>
                        <h3 className="text-[13px] font-bold text-zinc-900 dark:text-white mb-1 flex items-center gap-2">
                            Mina Uppgifter
                        </h3>
                        <span className="text-[10px] text-zinc-400 uppercase tracking-widest font-bold">
                            {completedTasks} av {tasks.length} Klara
                        </span>
                    </div>
                    <div className="text-2xl font-light tracking-tighter text-zinc-900 dark:text-white">
                        {taskProgress}<span className="text-[12px] font-bold text-zinc-400 ml-0.5">%</span>
                    </div>
                </div>

                <div className="flex-1 space-y-2.5 overflow-y-auto custom-scrollbar relative z-10 pr-2 max-h-[140px] mt-2">
                    {tasks.length === 0 && (
                        <div className="flex flex-col items-center justify-center py-4 opacity-50">
                            <window.Icon name="check-circle" size={24} className="mb-2 text-zinc-400" />
                            <p className="text-[11px] font-bold uppercase tracking-widest text-zinc-500">Allt är klart!</p>
                        </div>
                    )}
                    {tasks.map((task) => (
                        <div key={task.id} className="flex items-start justify-between gap-3 group py-1.5 px-2 -mx-2 rounded-xl hover:bg-zinc-50 dark:hover:bg-white/5 transition-all">
                            
                            <div className="flex items-start gap-3 min-w-0 flex-1">
                                <div 
                                    onClick={() => toggleTask(task.id, task.done)}
                                    className={`mt-[3px] w-5 h-5 rounded-md border flex items-center justify-center shrink-0 cursor-pointer transition-all duration-300 ${task.done ? 'bg-orange-500 border-orange-500 text-white shadow-[0_0_8px_rgba(249,115,22,0.4)]' : 'border-zinc-300 dark:border-zinc-600 bg-white/50 dark:bg-transparent text-transparent hover:border-orange-500 hover:shadow-sm'}`}
                                >
                                    <window.Icon name="check" size={12} className={task.done ? 'scale-100' : 'scale-0 opacity-0 transition-transform'} />
                                </div>
                                
                                <div className={`flex-1 min-w-0 select-text transition-opacity duration-300 ${task.done ? 'opacity-40 grayscale line-through' : ''}`}>
                                    <window.TaskFormatter text={task.text} />
                                </div>
                            </div>
                            
                            <button 
                                onClick={(e) => deleteTask(e, task.id)} 
                                className="mt-0.5 opacity-0 group-hover:opacity-100 w-6 h-6 flex items-center justify-center text-zinc-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-md transition-all shrink-0 cursor-pointer"
                                title="Radera uppgift"
                            >
                                <window.Icon name="trash-2" size={12} />
                            </button>
                        </div>
                    ))}
                </div>
                
                <form onSubmit={addTask} className="mt-4 relative z-10 flex items-center gap-2 pt-2 border-t border-zinc-100 dark:border-white/5">
                    <input
                        type="text"
                        value={newTask}
                        onChange={(e) => setNewTask(e.target.value)}
                        placeholder="Skriv ny uppgift..."
                        className="flex-1 bg-zinc-50 dark:bg-[#0f1522] border border-zinc-200 dark:border-white/5 rounded-xl px-4 py-2.5 text-[12px] text-zinc-900 dark:text-white outline-none focus:border-orange-500/50 dark:focus:border-orange-500/50 transition-all placeholder:text-zinc-400"
                    />
                    <button 
                        type="submit" 
                        disabled={!newTask.trim()}
                        className="w-10 h-10 bg-zinc-900 dark:bg-white disabled:bg-zinc-100 dark:disabled:bg-white/5 disabled:text-zinc-400 hover:bg-orange-500 dark:hover:bg-orange-500 text-white dark:text-zinc-900 rounded-xl flex items-center justify-center shrink-0 transition-colors shadow-sm"
                    >
                        <window.Icon name="plus" size={16} />
                    </button>
                </form>
            </div>
        </div>
    );
});

window.DashboardView = React.memo(({
    allJobs,
    filteredJobs, setEditingJob, setView,
    activeFilter, setActiveFilter, statusCounts,
    globalSearch, setGlobalSearch
}) => {
    const [historyTarget, setHistoryTarget] = React.useState(null);
    const [visibleCount, setVisibleCount] = React.useState(20);
    const [copiedRegId, setCopiedRegId] = React.useState(null); 
    const [sortConfig, setSortConfig] = React.useState({ key: null, direction: 'asc' });
    
    // NYTT: State för att visa/dölja mobila widgets
    const [showMobileWidgets, setShowMobileWidgets] = React.useState(false);
    
    React.useEffect(() => {
        setVisibleCount(20);
    }, [activeFilter, globalSearch]);

    const sortedAndFilteredJobs = React.useMemo(() => {
        let result = [...filteredJobs];

        result.sort((a, b) => {
            if (!sortConfig.key) {
                if (!a.datum) return 1; if (!b.datum) return -1;
                return activeFilter === 'BOKAD' ? a.datum.localeCompare(b.datum) : b.datum.localeCompare(a.datum);
            }

            let aVal = a[sortConfig.key];
            let bVal = b[sortConfig.key];

            if (sortConfig.key === 'kundpris') {
                aVal = parseInt(aVal) || 0;
                bVal = parseInt(bVal) || 0;
            } else {
                aVal = (aVal || '').toString().toLowerCase();
                bVal = (bVal || '').toString().toLowerCase();
            }

            if (aVal < bVal) return sortConfig.direction === 'asc' ? -1 : 1;
            if (aVal > bVal) return sortConfig.direction === 'asc' ? 1 : -1;
            return 0;
        });
        return result;
    }, [filteredJobs, sortConfig, activeFilter]);

    const visibleJobs = sortedAndFilteredJobs.slice(0, visibleCount);
    const hasMore = visibleCount < sortedAndFilteredJobs.length;

    const requestSort = (key) => {
        let direction = 'asc';
        if (sortConfig.key === key && sortConfig.direction === 'asc') direction = 'desc';
        setSortConfig({ key, direction });
    };

    const handleCopyDesktop = (e, regnr, jobId) => {
        e.stopPropagation();
        if (!regnr || regnr === '-') return;
        navigator.clipboard.writeText(regnr);
        setCopiedRegId(jobId);
        setTimeout(() => setCopiedRegId(null), 2000);
    };

    const tabsRef = React.useRef(null);
    const filters = ['ALLA', 'BOKAD', 'OFFERERAD', 'FAKTURERAS', 'KLAR'];

    const stats30Days = React.useMemo(() => {
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        return allJobs.filter(j => j.status === 'KLAR' && j.datum && new Date(j.datum) >= thirtyDaysAgo && !j.deleted).length;
    }, [allJobs]);

    const statsNext7Days = React.useMemo(() => {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const nextWeek = new Date(today);
        nextWeek.setDate(nextWeek.getDate() + 7);
        return allJobs.filter(j => {
            if (!j.datum || j.status === 'KLAR' || j.deleted) return false;
            const d = new Date(j.datum);
            return d >= today && d <= nextWeek;
        }).length;
    }, [allJobs]);

    const urgentCount = React.useMemo(() => {
        return allJobs.filter(j => { 
            if (!j.datum) return false;
            const d = formatDate(j.datum);
            return ['IDAG', 'IMORGON'].includes(d) && j.status !== 'KLAR' && j.status !== 'FAKTURERAS';
        }).length;
    }, [allJobs]);

    const invoiceStats = React.useMemo(() => {
        if (activeFilter !== 'FAKTURERAS') return { total: 0, topCustomers: [] };
        
        let total = 0;
        const customers = {};
        
        filteredJobs.forEach(job => {
            const price = parseInt(job.kundpris) || 0;
            total += price;
            const name = job.kundnamn || 'Okänd kund';
            customers[name] = (customers[name] || 0) + price;
        });

        return {
            total,
            topCustomers: Object.entries(customers).sort((a, b) => b[1] - a[1])
        };
    }, [filteredJobs, activeFilter]);

    const getHeaderDate = () => {
        const d = new Date();
        const days = ['Söndag', 'Måndag', 'Tisdag', 'Onsdag', 'Torsdag', 'Fredag', 'Lördag'];
        const months = ['Jan', 'Feb', 'Mar', 'Apr', 'Maj', 'Jun', 'Jul', 'Aug', 'Sep', 'Okt', 'Nov', 'Dec'];
        return `${days[d.getDay()]} ${d.getDate()} ${months[d.getMonth()]}`;
    };

    const handleOpenHistory = React.useCallback((regnr, jobId) => {
        setHistoryTarget({ regnr, highlightId: jobId });
    }, []);

    React.useEffect(() => {
        if (tabsRef.current) {
            const activeBtn = tabsRef.current.querySelector(`[data-tab="${activeFilter}"]`);
            if (activeBtn) activeBtn.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
        }
    }, [activeFilter]);

    const touchStart = React.useRef(null);
    const touchStartY = React.useRef(null);
    const onTouchStart = React.useCallback((e) => {
        touchStart.current = e.targetTouches[0].clientX;
        touchStartY.current = e.targetTouches[0].clientY;
    }, []);
    const onTouchEnd = React.useCallback((e) => {
        if (touchStart.current === null || touchStartY.current === null) return;
        const xDiff = touchStart.current - e.changedTouches[0].clientX;
        const yDiff = touchStartY.current - e.changedTouches[0].clientY;
        touchStart.current = null; touchStartY.current = null;
        if (Math.abs(yDiff) >= Math.abs(xDiff) || Math.abs(xDiff) < 50) return;
        const currIdx = filters.indexOf(activeFilter);
        if (currIdx === -1) return;
        let nextIdx = currIdx + (xDiff > 0 ? 1 : -1);
        if (nextIdx >= 0 && nextIdx < filters.length) setActiveFilter(filters[nextIdx]);
    }, [activeFilter, filters, setActiveFilter]);

    const TabButton = ({ label }) => {
        const isActive = activeFilter === label;
        const count = statusCounts[label] || 0;
        return (
            <button onClick={() => setActiveFilter(label)} className={`px-5 py-3 text-[12px] font-bold tracking-widest transition-all rounded-t-xl relative ${isActive ? 'text-orange-500 bg-white/50 dark:bg-white/5 backdrop-blur-md border-b-2 border-orange-500' : 'text-zinc-400 border-b-2 border-transparent hover:text-zinc-700 dark:hover:text-zinc-300'}`}>
                {label}
                {count > 0 && <span className={`ml-2 text-[10px] ${isActive ? 'text-orange-600 dark:text-orange-400' : 'text-zinc-400'}`}>({count})</span>}
            </button>
        );
    };

    return (
        <div className="flex flex-col min-h-screen bg-transparent text-zinc-900 dark:text-white pb-0 transition-colors duration-500 relative max-w-[1400px] ml-0 w-full">

            <div className="absolute top-0 left-[-10%] w-[60%] h-[400px] bg-orange-500/10 dark:bg-orange-500/5 blur-[120px] rounded-full pointer-events-none -z-10 hidden lg:block"></div>

            {/* --- DESKTOP VY (Oförändrad) --- */}
            <div className="hidden lg:flex flex-col h-full px-4 lg:px-2">
                {/* HEADER */}
                <div className="flex flex-col md:flex-row md:items-center justify-between mb-4 pb-4 border-b border-zinc-200 dark:border-white/5 gap-4 pt-2 lg:pt-0">
                    <div className="flex items-center gap-4 md:gap-5">
                        <div className="relative group cursor-default shrink-0">
                            <div className="absolute inset-0 bg-orange-500/40 blur-xl rounded-full transition-all duration-700 group-hover:bg-orange-500/60" />
                            <div className="relative w-14 h-14 rounded-2xl flex items-center justify-center text-white shadow-xl border border-white/20 transition-colors bg-gradient-to-br from-orange-400 to-orange-600">
                                <window.Icon name="grid" size={24} />
                            </div>
                        </div>
                        <div className="flex flex-col">
                            <h1 className="text-3xl font-black text-zinc-900 dark:text-white uppercase tracking-tight leading-none drop-shadow-sm dark:drop-shadow-none">
                                DASH<span className="text-zinc-400 dark:text-zinc-500 font-light">BOARD</span>
                            </h1>
                            <p className="text-[11px] font-bold text-orange-500 dark:text-orange-400 uppercase tracking-widest mt-1.5 flex items-center gap-2">
                                <span className="w-1.5 h-1.5 rounded-full bg-orange-500 animate-pulse"></span>
                                Operationell Status
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-4">
                        <button 
                            onClick={() => window.dispatchEvent(new CustomEvent('open-spotlight'))} 
                            className="group w-64 bg-zinc-50 dark:bg-[#121826] border border-zinc-200 dark:border-[#1a2235] text-zinc-500 dark:text-zinc-400 py-3.5 pl-4 pr-3 rounded-xl flex items-center justify-between hover:bg-white dark:hover:bg-[#182032] hover:border-orange-300 dark:hover:border-orange-500/50 hover:shadow-md transition-all shadow-sm"
                        >
                            <div className="flex items-center gap-2">
                                <window.Icon name="search" size={16} className="text-zinc-400 dark:text-zinc-500 group-hover:text-orange-500 transition-colors" />
                                <span className="text-[12px] font-bold tracking-widest uppercase">Sök i systemet...</span>
                            </div>
                            <span className="text-[10px] font-black uppercase text-zinc-400 dark:text-zinc-500 bg-zinc-200/50 dark:bg-black/50 border border-zinc-200 dark:border-[#1a2235] px-1.5 py-0.5 rounded-md shadow-sm">⌘K</span>
                        </button>
                        <button onClick={() => setView('NEW_JOB')} className="bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-400 hover:to-orange-500 text-white border border-orange-400/50 h-[46px] px-8 rounded-xl flex items-center gap-3 shadow-[0_8px_20px_-6px_rgba(249,115,22,0.4)] hover:shadow-[0_8px_25px_-4px_rgba(249,115,22,0.5)] transition-all active:scale-95">
                            <span className="text-[12px] font-black uppercase tracking-widest">Nytt Uppdrag</span>
                            <window.Icon name="plus" size={16} />
                        </button>
                    </div>
                </div>

                <window.DashboardWidgets allJobs={allJobs} />

                {/* DYNAMISK TOP-GRID (Desktop) */}
                <div className="grid grid-cols-3 gap-6 mb-8">
                    <div className="bg-white/80 dark:bg-[#182032]/80 backdrop-blur-xl rounded-3xl border border-zinc-200/80 dark:border-white/5 p-6 shadow-sm relative overflow-hidden group hover:shadow-xl hover:shadow-orange-500/5 transition-all">
                        <div className="absolute right-0 top-0 w-32 h-32 bg-emerald-500/5 blur-3xl rounded-full pointer-events-none"></div>
                        <window.Icon name="check-circle" size={100} className="absolute -right-8 -bottom-8 text-zinc-100 dark:text-white/5 group-hover:text-emerald-500/10 transition-colors" />
                        <div className="relative z-10">
                            <div className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-2 flex items-center gap-2">
                                <window.Icon name="bar-chart-2" size={12} /> Utförda (30d)
                            </div>
                            <div className="text-4xl font-light tracking-tighter text-zinc-900 dark:text-white leading-none">{stats30Days} <span className="text-lg font-bold text-zinc-400 uppercase tracking-widest ml-1">st</span></div>
                        </div>
                    </div>

                    {activeFilter === 'FAKTURERAS' ? (
                        <div className="col-span-2 bg-white/80 dark:bg-[#182032]/80 backdrop-blur-xl rounded-3xl border border-zinc-200/80 dark:border-white/5 p-6 shadow-sm hover:shadow-md relative overflow-hidden flex items-center justify-between group animate-in fade-in slide-in-from-right-4 duration-500 transition-all">
                            <div className="absolute right-0 top-0 w-64 h-64 bg-orange-500/10 blur-[80px] rounded-full pointer-events-none"></div>
                            <window.Icon name="file-text" size={120} className="absolute -right-4 -bottom-8 text-zinc-100 dark:text-white/[0.02] group-hover:text-orange-500/10 transition-colors duration-700" />
                            
                            <div className="relative z-10 flex flex-col justify-center">
                                <div className="text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-widest mb-2 flex items-center gap-2">
                                    <window.Icon name="pie-chart" size={12} className="text-orange-500" /> Att Fakturera
                                </div>
                                <div className="text-5xl font-light tracking-tighter text-zinc-900 dark:text-white leading-none">
                                    {invoiceStats.total.toLocaleString('sv-SE')} <span className="text-xl font-bold text-zinc-400 dark:text-zinc-600 uppercase tracking-widest ml-1">kr</span>
                                </div>
                            </div>

                            <div className="relative z-10 flex flex-col justify-center flex-1 max-w-sm pl-8 ml-8 border-l border-zinc-200 dark:border-white/5">
                                <div className="text-[9px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-widest mb-3 flex items-center justify-between">
                                    <span>Berörda Kunder ({invoiceStats.topCustomers.length})</span>
                                </div>
                                <div className="space-y-2.5">
                                    {invoiceStats.topCustomers.slice(0, 3).map(([name, amount], idx) => {
                                        const percentage = invoiceStats.total > 0 ? Math.round((amount / invoiceStats.total) * 100) : 0;
                                        return (
                                            <div key={idx} className="flex flex-col gap-1">
                                                <div className="flex justify-between text-[11px] font-medium text-zinc-700 dark:text-zinc-300">
                                                    <span className="truncate pr-2">{name}</span>
                                                    <span className="font-mono text-zinc-500 dark:text-zinc-400 shrink-0">{amount.toLocaleString('sv-SE')} kr</span>
                                                </div>
                                                <div className="h-1.5 w-full bg-zinc-100 dark:bg-black/40 rounded-full overflow-hidden">
                                                    <div className="h-full bg-gradient-to-r from-orange-500 to-orange-400 rounded-full" style={{ width: `${percentage}%` }}></div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                    {invoiceStats.topCustomers.length > 3 && (
                                        <div className="text-[10px] font-medium text-zinc-400 dark:text-zinc-500 pt-1">
                                            + {invoiceStats.topCustomers.length - 3} fler kunder
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    ) : (
                        <>
                            <div className="bg-white/80 dark:bg-[#182032]/80 backdrop-blur-xl rounded-3xl border border-zinc-200/80 dark:border-white/5 p-6 shadow-sm relative overflow-hidden group hover:shadow-xl hover:shadow-blue-500/5 transition-all">
                                <div className="absolute right-0 top-0 w-32 h-32 bg-blue-500/5 blur-3xl rounded-full pointer-events-none"></div>
                                <window.Icon name="calendar" size={100} className="absolute -right-8 -bottom-8 text-zinc-100 dark:text-white/5 group-hover:text-blue-500/10 transition-colors" />
                                <div className="relative z-10">
                                    <div className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-2 flex items-center gap-2">
                                        <window.Icon name="clock" size={12} /> Kommande (7d)
                                    </div>
                                    <div className="text-4xl font-light tracking-tighter text-zinc-900 dark:text-white leading-none">{statsNext7Days} <span className="text-lg font-bold text-zinc-400 uppercase tracking-widest ml-1">st</span></div>
                                </div>
                            </div>

                            <div className="bg-white/80 dark:bg-[#182032]/80 backdrop-blur-xl rounded-3xl border border-zinc-200/80 dark:border-white/5 p-6 shadow-sm relative overflow-hidden group hover:shadow-xl hover:shadow-red-500/5 transition-all">
                                <div className="absolute right-0 top-0 w-32 h-32 bg-red-500/5 blur-3xl rounded-full pointer-events-none"></div>
                                <window.Icon name="alert-triangle" size={100} className="absolute -right-8 -bottom-8 text-zinc-100 dark:text-white/5 group-hover:text-red-500/10 transition-colors" />
                                <div className="relative z-10">
                                    <div className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-2 flex items-center gap-2">
                                        <window.Icon name="zap" size={12} /> Prioritet
                                    </div>
                                    <div className={`text-4xl font-light tracking-tighter leading-none ${urgentCount > 0 ? 'text-red-500' : 'text-zinc-900 dark:text-white'}`}>
                                        {urgentCount} <span className="text-lg font-bold text-zinc-400 uppercase tracking-widest ml-1">st</span>
                                    </div>
                                </div>
                            </div>
                        </>
                    )}
                </div>

                <div className="flex flex-col flex-1 pb-10">
                    <div className="flex px-4 border-b border-zinc-200 dark:border-white/10 space-x-2">
                        {filters.map(f => (
                            <button 
                                key={f} 
                                data-tab={f} 
                                onClick={() => setActiveFilter(f)} 
                                className={`py-3 px-5 text-[11px] font-bold uppercase tracking-widest transition-all whitespace-nowrap relative ${activeFilter === f ? 'text-orange-500' : 'text-zinc-400 dark:text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300'}`}
                            >
                                {f}
                                {(statusCounts[f] || 0) > 0 && (
                                    <span className={`ml-2 px-1.5 py-0.5 rounded-md text-[9px] ${activeFilter === f ? 'bg-orange-50 dark:bg-orange-500/10 text-orange-600 dark:text-orange-400' : 'bg-zinc-100 dark:bg-white/5 text-zinc-500'}`}>
                                        {statusCounts[f]}
                                    </span>
                                )}
                                {activeFilter === f && (
                                    <span className="absolute bottom-[1px] left-0 right-0 h-[3px] bg-orange-500 rounded-t-full shadow-[0_0_8px_rgba(249,115,22,0.4)]"></span>
                                )}
                            </button>
                        ))}
                    </div>

                    {/* TABELLEN MED SORTERING */}
                    <div className="bg-white/80 dark:bg-[#182032]/80 backdrop-blur-xl rounded-b-3xl shadow-sm border border-t-0 border-zinc-200/80 dark:border-white/5 overflow-hidden flex flex-col min-h-[500px]">
                        <div className="flex-1 overflow-auto custom-scrollbar">
                            <table className="w-full text-left border-collapse">
                                <thead className="bg-zinc-50/50 dark:bg-white/5 text-zinc-400 dark:text-zinc-500 text-[10px] uppercase tracking-widest font-bold sticky top-0 z-10 border-b border-zinc-200 dark:border-white/10">
                                    <tr>
                                        {/* Klickbara headers för sortering */}
                                        <th className="pl-8 pr-4 py-5 w-[25%] cursor-pointer hover:text-orange-500 transition-colors select-none group" onClick={() => requestSort('kundnamn')}>
                                            <div className="flex items-center gap-1.5">
                                                Kund
                                                <window.Icon name={sortConfig.key === 'kundnamn' ? (sortConfig.direction === 'asc' ? 'chevron-up' : 'chevron-down') : 'chevrons-up-down'} size={12} className={sortConfig.key === 'kundnamn' ? "text-orange-500" : "opacity-30 group-hover:opacity-100 transition-opacity"} />
                                            </div>
                                        </th>
                                        <th className="px-4 py-5 w-[15%] cursor-pointer hover:text-orange-500 transition-colors select-none group" onClick={() => requestSort('paket')}>
                                            <div className="flex items-center gap-1.5">
                                                Service Typ
                                                <window.Icon name={sortConfig.key === 'paket' ? (sortConfig.direction === 'asc' ? 'chevron-up' : 'chevron-down') : 'chevrons-up-down'} size={12} className={sortConfig.key === 'paket' ? "text-orange-500" : "opacity-30 group-hover:opacity-100 transition-opacity"} />
                                            </div>
                                        </th>
                                        <th className="px-4 py-5 w-[15%] cursor-pointer hover:text-orange-500 transition-colors select-none group" onClick={() => requestSort('regnr')}>
                                            <div className="flex items-center gap-1.5">
                                                Reg.nr
                                                <window.Icon name={sortConfig.key === 'regnr' ? (sortConfig.direction === 'asc' ? 'chevron-up' : 'chevron-down') : 'chevrons-up-down'} size={12} className={sortConfig.key === 'regnr' ? "text-orange-500" : "opacity-30 group-hover:opacity-100 transition-opacity"} />
                                            </div>
                                        </th>
                                        <th className="px-4 py-5 w-[15%] cursor-pointer hover:text-orange-500 transition-colors select-none group" onClick={() => requestSort('datum')}>
                                            <div className="flex items-center gap-1.5">
                                                Bokat datum
                                                <window.Icon name={sortConfig.key === 'datum' ? (sortConfig.direction === 'asc' ? 'chevron-up' : 'chevron-down') : 'chevrons-up-down'} size={12} className={sortConfig.key === 'datum' ? "text-orange-500" : "opacity-30 group-hover:opacity-100 transition-opacity"} />
                                            </div>
                                        </th>
                                        <th className="px-4 py-5 w-[15%] cursor-pointer hover:text-orange-500 transition-colors select-none group" onClick={() => requestSort('status')}>
                                            <div className="flex items-center gap-1.5">
                                                Status
                                                <window.Icon name={sortConfig.key === 'status' ? (sortConfig.direction === 'asc' ? 'chevron-up' : 'chevron-down') : 'chevrons-up-down'} size={12} className={sortConfig.key === 'status' ? "text-orange-500" : "opacity-30 group-hover:opacity-100 transition-opacity"} />
                                            </div>
                                        </th>
                                        <th className="px-4 py-5 w-[15%] text-right cursor-pointer hover:text-orange-500 transition-colors select-none group" onClick={() => requestSort('kundpris')}>
                                            <div className="flex items-center justify-end gap-1.5">
                                                Pris
                                                <window.Icon name={sortConfig.key === 'kundpris' ? (sortConfig.direction === 'asc' ? 'chevron-up' : 'chevron-down') : 'chevrons-up-down'} size={12} className={sortConfig.key === 'kundpris' ? "text-orange-500" : "opacity-30 group-hover:opacity-100 transition-opacity"} />
                                            </div>
                                        </th>
                                        <th className="pl-4 pr-8 py-5 w-[10%] text-right"></th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-zinc-100 dark:divide-white/5">
                                    {visibleJobs.map((job, index) => {
                                        const dateText = formatDate(job.datum);
                                        const isUrgent = ['IDAG', 'IMORGON'].includes(dateText) && job.status !== 'KLAR';
                                        const regDisplay = job.regnr || job.bilmodell || '-';
                                        const isReg = regDisplay.length <= 8 && /\d/.test(regDisplay);
                                        const initials = job.kundnamn ? job.kundnamn.split(' ').map(n => n[0]).join('').substring(0,2).toUpperCase() : '??';
                                        const avatarTheme = getAvatarTheme(job.kundnamn);

                                        return (
                                            <tr 
                                                key={job.id} 
                                                onClick={() => job.regnr ? handleOpenHistory(job.regnr, job.id) : null} 
                                                className={`group transition-all duration-300 cursor-pointer relative bg-transparent hover:bg-orange-50 dark:hover:bg-orange-500/10 border-b border-zinc-100 dark:border-white/5 last:border-0`}
                                            >
                                                <td className="pl-7 pr-4 py-4 align-middle relative">
                                                    <div className="absolute left-0 top-0 bottom-0 w-[3px] bg-orange-500 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                                                    
                                                    <div className="flex items-center gap-4 group-hover:translate-x-1 transition-transform duration-300">
                                                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-[12px] font-bold shrink-0 border shadow-sm ${avatarTheme}`}>
                                                            {initials}
                                                        </div>
                                                        <div>
                                                            <div className="text-[14px] font-bold text-zinc-900 dark:text-white leading-none mb-1.5 group-hover:text-orange-500 transition-colors">{job.kundnamn}</div>
                                                            <div className="flex items-center gap-2">
                                                                <span className="text-[10px] font-mono font-medium text-zinc-400 dark:text-zinc-500 uppercase tracking-widest"><window.Icon name="hash" size={10} className="inline mr-1 -mt-0.5" />{job.id.substring(0,6)}</span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-4 py-4 align-middle">
                                                    <div className="flex flex-col min-w-0">
                                                        <span className="text-[13px] font-bold text-zinc-700 dark:text-zinc-300">{job.paket || 'Standard_Deploy'}</span>
                                                        {job.kommentar && (
                                                            <div className="flex items-center gap-1.5 text-[11px] text-zinc-400 mt-1 italic truncate max-w-[140px]">
                                                                <window.Icon name="message-square" size={10} className="shrink-0" />
                                                                <span className="truncate">{job.kommentar}</span>
                                                            </div>
                                                        )}
                                                    </div>
                                                </td>
                                                <td className="px-4 py-4 align-middle">
                                                    <div 
                                                        onClick={(e) => handleCopyDesktop(e, regDisplay, job.id)} 
                                                        title="Kopiera Reg.nr"
                                                        className={`inline-flex items-center justify-start rounded-[4px] border overflow-hidden w-[110px] h-[30px] cursor-pointer hover:border-orange-500 group/copy relative ${isReg ? 'bg-white dark:bg-[#1a2235] border-zinc-200 dark:border-[#2a3441] shadow-sm' : 'bg-transparent border-transparent'} transition-all`}
                                                    >
                                                        {copiedRegId === job.id && (
                                                            <div className="absolute inset-0 bg-emerald-500 flex items-center justify-center text-white z-20 animate-in fade-in duration-200">
                                                                <window.Icon name="check" size={14} />
                                                            </div>
                                                        )}
                                                        {isReg ? (
                                                            <>
                                                                <div className="w-[16px] bg-[#003399] flex flex-col items-center justify-between py-[2px] shrink-0 border-r border-zinc-200 dark:border-[#2a3441]">
                                                                    <div className="w-2 h-2 rounded-full border-[1px] border-[#ffcc00] mt-[1px]"></div>
                                                                    <span className="text-[9px] font-sans font-black text-white leading-none antialiased mb-[1px]">S</span>
                                                                </div>
                                                                <div className="flex-1 flex items-center justify-center">
                                                                    <span className="font-mono font-black text-[14px] text-zinc-900 dark:text-zinc-200 tracking-[0.15em] leading-none pt-[2px] group-hover/copy:text-orange-600 dark:group-hover/copy:text-orange-400 transition-colors">{regDisplay}</span>
                                                                </div>
                                                            </>
                                                        ) : (
                                                            <div className="flex-1 flex items-center justify-start px-1">
                                                                <span className="font-mono font-bold text-[12px] text-zinc-500 tracking-widest uppercase truncate leading-none pt-[2px] group-hover/copy:text-orange-500 transition-colors">{regDisplay}</span>
                                                            </div>
                                                        )}
                                                    </div>
                                                </td>
                                                <td className="px-4 py-4 align-middle">
                                                    {job.datum ? (
                                                        <div className="flex items-center gap-2.5">
                                                            {isUrgent && (
                                                                <span className="relative flex h-2 w-2 shrink-0">
                                                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-orange-400 opacity-75"></span>
                                                                    <span className="relative inline-flex rounded-full h-2 w-2 bg-orange-500 shadow-[0_0_8px_rgba(249,115,22,0.8)]"></span>
                                                                </span>
                                                            )}
                                                            <div>
                                                                <div className={`text-[12px] font-bold uppercase tracking-wide ${isUrgent ? 'text-orange-600' : 'text-zinc-800 dark:text-zinc-300'}`}>{dateText}</div>
                                                                <div className="text-[11px] font-mono text-zinc-400 dark:text-zinc-500 mt-0.5">{job.datum.split('T')[1]}</div>
                                                            </div>
                                                        </div>
                                                    ) : <span className="text-[10px] font-bold text-red-500 bg-red-50 dark:bg-red-500/10 px-2 py-1 rounded-md uppercase tracking-widest">Inväntar</span>}
                                                </td>
                                                <td className="px-4 py-4 align-middle">
                                                    <window.Badge status={job.status} />
                                                </td>
                                                <td className="px-4 py-4 align-middle text-right">
                                                    <div className="flex flex-col items-end">
                                                        <div className="font-mono font-light tracking-tighter text-[18px] text-zinc-900 dark:text-white leading-none tabular-nums">
                                                            {(parseInt(job.kundpris) || 0).toLocaleString('sv-SE')} <span className="text-[10px] text-zinc-400 dark:text-zinc-500 font-sans tracking-widest uppercase font-bold ml-0.5">kr</span>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="pl-4 pr-8 py-4 align-middle text-right">
                                                    <div className="opacity-0 group-hover:opacity-100 translate-x-4 group-hover:translate-x-0 transition-all duration-300 flex justify-end items-center gap-2">
                                                        {job.status !== 'KLAR' && (
                                                            <button title="Markera Klar" onClick={(e) => { e.stopPropagation(); window.db.collection("jobs").doc(job.id).update({status: 'KLAR'}); }} className="w-9 h-9 flex items-center justify-center rounded-xl bg-white dark:bg-[#1a2235] border border-zinc-200 dark:border-white/5 text-zinc-400 hover:bg-emerald-50 dark:hover:bg-emerald-500/10 hover:border-emerald-200 dark:hover:border-emerald-500/30 hover:text-emerald-600 dark:hover:text-emerald-400 shadow-sm transition-all">
                                                                <window.Icon name="check" size={16} />
                                                            </button>
                                                        )}
                                                        <button title="Redigera" onClick={(e) => { e.stopPropagation(); setView('NEW_JOB', { job: job }); }} className="w-9 h-9 flex items-center justify-center rounded-xl bg-white dark:bg-[#1a2235] border border-zinc-200 dark:border-white/5 text-zinc-400 hover:bg-blue-50 dark:hover:bg-blue-500/10 hover:border-blue-200 dark:hover:border-blue-500/30 hover:text-blue-600 dark:hover:text-blue-400 shadow-sm transition-all">
                                                            <window.Icon name="edit-2" size={16} />
                                                        </button>
                                                        <button title="Radera" onClick={(e) => { e.stopPropagation(); if(confirm("Radera?")) window.db.collection("jobs").doc(job.id).update({deleted:true}); }} className="w-9 h-9 flex items-center justify-center rounded-xl bg-white dark:bg-[#1a2235] border border-zinc-200 dark:border-white/5 text-zinc-400 hover:bg-red-50 dark:hover:bg-red-500/10 hover:border-red-200 dark:hover:border-red-500/30 hover:text-red-600 dark:hover:text-red-400 shadow-sm transition-all">
                                                            <window.Icon name="trash" size={16} />
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                            
                            {hasMore && (
                                <div className="flex justify-center p-6 border-t border-zinc-200 dark:border-white/5 bg-zinc-50/30 dark:bg-white/[0.01]">
                                    <button onClick={() => setVisibleCount(prev => prev + 20)} className="px-8 py-3 bg-white dark:bg-[#1a2235] border border-zinc-200 dark:border-white/10 hover:bg-zinc-50 dark:hover:bg-white/5 text-zinc-600 dark:text-zinc-300 text-[11px] font-bold uppercase tracking-widest rounded-xl shadow-sm transition-colors flex items-center gap-2">
                                        Ladda in fler <span className="opacity-50">({sortedAndFilteredJobs.length - visibleCount} kvar)</span>
                                    </button>
                                </div>
                            )}

                        </div>
                    </div>
                </div>
            </div>

            {/* --- MOBILE VY --- */}
            <div
                className="lg:hidden flex flex-col min-h-screen bg-zinc-50 dark:bg-[#0f1522] touch-pan-y transition-colors duration-500"
                onTouchStart={onTouchStart} onTouchEnd={onTouchEnd}
            >
                {/* STICKY HEADER FÖR MOBIL - MED NYA OVERLAY-FUNKTIONEN */}
                <div className="bg-white/90 dark:bg-[#182032]/90 backdrop-blur-2xl text-zinc-900 dark:text-white pt-safe-top pt-2 sticky top-0 z-40 shadow-sm border-b border-zinc-200 dark:border-white/10 transition-colors duration-300 relative">
                    
                    <div className="px-4 pb-4 pt-2 flex items-center justify-between border-b border-zinc-100 dark:border-white/5">
                        
                        {/* LOGGA OCH TITEL */}
                        <div className="flex items-center gap-4">
                            <div className="relative group cursor-default shrink-0">
                                <div className="absolute inset-0 bg-orange-500/40 blur-xl rounded-full transition-all duration-700 group-hover:bg-orange-500/60" />
                                <div className="relative w-12 h-12 rounded-xl flex items-center justify-center text-white shadow-md border border-white/20 bg-gradient-to-br from-orange-400 to-orange-600">
                                    <window.Icon name="grid" size={24} />
                                </div>
                            </div>
                            <div className="flex flex-col">
                                <h1 className="text-xl font-black text-zinc-900 dark:text-white uppercase tracking-tight leading-none drop-shadow-sm dark:drop-shadow-none">
                                    DASH<span className="text-zinc-400 dark:text-zinc-500 font-light">BOARD</span>
                                </h1>
                                <p className="text-[9px] font-bold text-orange-500 uppercase tracking-widest mt-1 flex items-center gap-1.5">
                                    <span className="w-1.5 h-1.5 rounded-full bg-orange-500 animate-pulse"></span>
                                    {getHeaderDate()}
                                </p>
                            </div>
                        </div>

                        {/* NYTT: MOBILA KNAPPAR (WIDGETS + SPOTLIGHT) */}
                        <div className="flex items-center gap-2">
                            <button 
                                onClick={() => setShowMobileWidgets(!showMobileWidgets)} 
                                className={`w-10 h-10 flex items-center justify-center rounded-xl transition-all border ${showMobileWidgets ? 'bg-orange-500 text-white border-orange-500 shadow-md' : 'bg-zinc-100 dark:bg-[#1a2235] text-zinc-500 dark:text-zinc-400 hover:text-orange-500 hover:bg-orange-50 dark:hover:bg-orange-500/10 dark:hover:text-white border-transparent dark:border-white/5'}`}
                            >
                                <window.Icon name={showMobileWidgets ? "chevron-up" : "layout-dashboard"} size={18} />
                            </button>
                            <button 
                                onClick={() => window.dispatchEvent(new CustomEvent('open-spotlight'))} 
                                className="w-10 h-10 flex items-center justify-center rounded-xl bg-zinc-100 dark:bg-[#1a2235] text-zinc-500 dark:text-zinc-400 hover:text-orange-500 dark:hover:text-white transition-colors border border-transparent dark:border-white/5"
                            >
                                <window.Icon name="search" size={18} />
                            </button>
                        </div>
                    </div>

                    {/* DINA FILTER-TABS */}
                    <div
                        ref={tabsRef}
                        className="flex overflow-x-auto px-4 pt-2 pb-1 space-x-4 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]"
                        onTouchStart={(e) => e.stopPropagation()}
                        onTouchMove={(e) => e.stopPropagation()}
                        onTouchEnd={(e) => e.stopPropagation()}
                    >
                        {filters.map(f => {
                            const isActive = activeFilter === f;
                            const count = statusCounts[f] || 0;
                            return (
                                <button key={f} data-tab={f} onClick={() => { setActiveFilter(f); setShowMobileWidgets(false); }} className={`py-3 text-[11px] font-bold uppercase tracking-widest transition-all border-b-2 whitespace-nowrap relative ${isActive ? 'text-orange-500 border-orange-500' : 'text-zinc-400 dark:text-zinc-500 border-transparent'}`}>
                                    {f}
                                    {count > 0 && <span className={`ml-2 px-1.5 py-0.5 rounded-md text-[9px] ${isActive ? 'bg-orange-50 dark:bg-orange-500/10 text-orange-600 dark:text-orange-400' : 'bg-zinc-100 dark:bg-white/5 text-zinc-500'}`}>{count}</span>}
                                </button>
                            );
                        })}
                    </div>

                    {/* NYTT: FLYTANDE WIDGET-DROPDOWN FÖR MOBIL (Stör inte jobbkorten) */}
                    {showMobileWidgets && (
                        <div className="absolute top-full left-0 right-0 bg-zinc-50/95 dark:bg-[#0f1522]/95 backdrop-blur-3xl shadow-[0_20px_40px_rgba(0,0,0,0.15)] dark:shadow-[0_20px_40px_rgba(0,0,0,0.5)] border-b border-zinc-200 dark:border-white/10 p-4 pt-5 animate-in slide-in-from-top-2 fade-in duration-200 max-h-[75vh] overflow-y-auto custom-scrollbar z-50">
                            <window.DashboardWidgets allJobs={allJobs} />
                        </div>
                    )}
                </div>

                {/* INVOICE BANNER MOBIL */}
                {activeFilter === 'FAKTURERAS' && invoiceStats.total > 0 && (
                    <div className="mx-3 mt-4 mb-2 p-4 rounded-2xl bg-white/90 dark:bg-[#182032]/90 backdrop-blur-xl border border-zinc-200/80 dark:border-white/5 shadow-sm relative overflow-hidden animate-in fade-in slide-in-from-top-2 duration-300">
                        <div className="absolute right-0 top-0 w-32 h-32 bg-orange-500/10 blur-[50px] rounded-full pointer-events-none"></div>
                        <div className="flex items-center justify-between relative z-10">
                            <div>
                                <h3 className="text-[9px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-widest mb-1 flex items-center gap-1.5">
                                    <window.Icon name="pie-chart" size={10} className="text-orange-500" /> Att Fakturera
                                </h3>
                                <div className="text-2xl font-light text-zinc-900 dark:text-white tracking-tighter leading-none">
                                    {invoiceStats.total.toLocaleString('sv-SE')} <span className="text-[10px] font-bold text-zinc-400 dark:text-zinc-600 uppercase tracking-widest ml-0.5">kr</span>
                                </div>
                            </div>
                            <div className="text-right">
                                <span className="text-[10px] font-medium bg-zinc-50 dark:bg-black/30 text-zinc-600 dark:text-zinc-300 px-2.5 py-1.5 rounded-lg border border-zinc-200/80 dark:border-white/5 flex items-center gap-1.5">
                                    <window.Icon name="users" size={10} /> {invoiceStats.topCustomers.length} Kunder
                                </span>
                            </div>
                        </div>
                    </div>
                )}

                {/* KORTEN MED DATUM-GRUPPERING */}
                <div className="px-3 pt-1 pb-0 flex flex-col"> {/* 1. Minskade padding-top (pt-4 -> pt-1) på containern */}
                    {sortedAndFilteredJobs.length > 0 ? (
                        <>
                            {(() => {
                                let lastDate = null;
                                // 2. Lade till 'index' i map-funktionen för att veta vad som är högst upp
                                return visibleJobs.map((job, index) => { 
                                const currentDate = job.datum ? formatDate(job.datum) : 'INVÄNTAR DATUM';
                                const showHeader = currentDate !== lastDate;
                                lastDate = currentDate;

                                return (
                                    <React.Fragment key={job.id}>
                                        {showHeader && (
                                            // 3. Dynamisk margin: Mindre luft (mt-2) om det är första gruppen, mer luft (mt-6) mellan olika dagar
                                            <div className={`${index === 0 ? 'mt-2' : 'mt-6'} mb-3 px-2 flex items-center gap-2`}>
                                                <div className="h-4 w-1 bg-gradient-to-b from-orange-400 to-orange-600 rounded-full shadow-[0_0_8px_rgba(249,115,22,0.5)]" />
                                                <h3 className="text-[12px] font-bold text-zinc-900 dark:text-white uppercase tracking-widest flex items-center gap-2">
                                                    {currentDate}
                                                </h3>
                                            </div>
                                        )}
                                        <MobileJobCard job={job} setView={setView} onOpenHistory={handleOpenHistory} />
                                    </React.Fragment>
                                );
                            });
                        })()}
                        
                        {/* KNAPP FÖR ATT VISA FLER (MOBIL) */}
                        {hasMore && (
                            <div className="mt-2 mb-6 px-1">
                                <button onClick={() => setVisibleCount(prev => prev + 20)} className="w-full py-4 bg-white dark:bg-[#182032] border border-zinc-200 dark:border-white/5 text-zinc-700 dark:text-zinc-300 text-[12px] font-bold uppercase tracking-widest rounded-2xl shadow-sm active:scale-95 transition-all">
                                    Ladda in fler ({sortedAndFilteredJobs.length - visibleCount} kvar)
                                </button>
                            </div>
                        )}
                    </>
                ) : (
                    <div className="flex flex-col items-center justify-center py-24 text-zinc-400">
                        <window.Icon name="inbox" size={48} className="mb-4 opacity-20" />
                        <span className="text-[11px] font-bold uppercase tracking-widest">Inga uppdrag hittades</span>
                    </div>
                )}
                </div>
            </div>

            {/* MODUL: History */}
            {historyTarget && window.VehicleProfileLoader && (
                <window.VehicleProfileLoader
                    regnr={historyTarget.regnr}
                    highlightId={historyTarget.highlightId}
                    onClose={() => setHistoryTarget(null)}
                    setView={setView}
                />
            )}
        </div>
    );
}, dashboardPropsAreEqual);
