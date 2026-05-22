// supply.js

const SafeIcon = ({ name, size = 14, className = "" }) => (
    <span className={`inline-flex items-center justify-center shrink-0 ${className}`}>
        {window.Icon ? (
            <window.Icon name={name} size={size} />
        ) : (
            <div style={{ width: size, height: size }} className="bg-current/10 rounded-sm" title={`Missing ${name}`}></div>
        )}
    </span>
);

const ExternalLinkIcon = () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path>
        <polyline points="15 3 21 3 21 9"></polyline>
        <line x1="10" y1="14" x2="21" y2="3"></line>
    </svg>
);

// Återställd till den rena, snygga designen (Fix för klumpiga rubriker)
const SectionHeader = ({ title, sub }) => (
    <div className="flex items-start gap-3 mb-6">
        <div className="mt-1 h-5 w-1 bg-gradient-to-b from-orange-400 to-orange-600 rounded-full shadow-[0_0_10px_rgba(249,115,22,0.4)]" />
        <div>
            <h3 className="text-[13px] font-bold uppercase tracking-widest text-zinc-900 dark:text-white">{title}</h3>
            {sub && <p className="text-[10px] font-medium uppercase tracking-[0.15em] text-zinc-400 dark:text-zinc-500 mt-0.5">{sub}</p>}
        </div>
    </div>
);

window.SupplyView = ({ allJobs, setView }) => {
    const [jobs, setJobs] = React.useState([]);
    const [settings, setSettings] = React.useState({ oilStartDate: '2025-11-22', oilStartAmount: 235 });
    const [loading, setLoading] = React.useState(true);
    
    // States för redigering
    const [isEditing, setIsEditing] = React.useState(false);
    const [editConfig, setEditConfig] = React.useState({ date: '', amount: '' });

    // State för paginering
    const [visibleLogCount, setVisibleLogCount] = React.useState(7); 

    React.useEffect(() => {
        const db = window.db;
        if (!db) return;
        
        const unsubSettings = db.collection('settings').doc('inventory').onSnapshot(doc => {
            if (doc.exists) {
                const data = doc.data();
                setSettings(data);
                setEditConfig({ date: data.oilStartDate || '', amount: data.oilStartAmount || '' });
            }
        });

        const unsubJobs = db.collection('jobs')
            .where('deleted', '==', false)
            .onSnapshot(snapshot => {
                const jobList = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
                setJobs(jobList);
                setLoading(false);
            });

        return () => { unsubSettings(); unsubJobs(); };
    }, []);

    const handleSaveSettings = async () => {
        try {
            await window.db.collection('settings').doc('inventory').set({
                oilStartDate: editConfig.date,
                oilStartAmount: parseFloat(editConfig.amount) || 0
            }, { merge: true });
            setIsEditing(false);
        } catch (error) {
            console.error("Kunde inte spara inställningar:", error);
            alert("Fel vid sparande av inställningar.");
        }
    };

    const toggleExcludeJob = async (e, jobId, currentStatus) => {
        e.stopPropagation();
        try {
            await window.db.collection('jobs').doc(jobId).update({
                excludeFromOilCalc: !currentStatus
            });
        } catch (error) {
            console.error("Kunde inte uppdatera exkludering:", error);
        }
    };

    const oilStatus = React.useMemo(() => {
        const usageHistory = [];
        let totalUsed = 0;
        let totalExcluded = 0; 
        const startDate = settings.oilStartDate;
        const startAmount = parseFloat(settings.oilStartAmount) || 0;

        jobs.forEach(job => {
            if (!job.datum || job.datum < startDate) return;

            const jobUtgifter = Array.isArray(job.utgifter) ? job.utgifter : [];
            let oilInThisJob = 0;

            jobUtgifter.forEach(u => {
                const desc = (u.namn || "").toLowerCase();
                if (desc.includes('olja')) {
                    const match = u.namn.match(/(\d+[.,]\d+|\d+)/);
                    let detectedVolume = match ? parseFloat(match[0].replace(',', '.')) : 0;
                    const costVal = parseFloat(String(u.kostnad || "0").replace(',', '.'));
                    if (detectedVolume === 0 && costVal < 15) detectedVolume = costVal;
                    oilInThisJob += detectedVolume;
                }
            });

            if (oilInThisJob > 0) {
                if (!job.excludeFromOilCalc) {
                    totalUsed += oilInThisJob;
                } else {
                    totalExcluded += oilInThisJob; 
                }
                
                usageHistory.push({
                    id: job.id,
                    kund: job.kundnamn || 'Okänd Kund',
                    datum: job.datum.split('T')[0],
                    mangd: oilInThisJob,
                    reg: job.regnr || '-',
                    isExcluded: !!job.excludeFromOilCalc
                });
            }
        });

        const currentVolume = Math.max(0, startAmount - totalUsed);
        
        const activeUsageHistory = usageHistory.filter(h => !h.isExcluded);
        const avgUsage = activeUsageHistory.length > 0 ? totalUsed / activeUsageHistory.length : 0;
        
        const estimatedMissions = avgUsage > 0 ? Math.floor(currentVolume / avgUsage) : 0;
        const fillPercentage = Math.min(100, Math.max(0, (currentVolume / startAmount) * 100)) || 0;
        const potentialRevenue = currentVolume * 200; 

        return {
            current: currentVolume,
            initial: startAmount,
            totalExcluded: totalExcluded, 
            history: usageHistory.sort((a, b) => b.datum.localeCompare(a.datum)),
            estimatedMissions,
            fillPercentage,
            potentialRevenue,
            isLow: currentVolume < (startAmount * 0.15)
        };
    }, [jobs, settings]);

    const handleJobClick = (id) => {
        const job = allJobs.find(j => j.id === id);
        if (job) setView('NEW_JOB', { job: job });
    };

    if (loading) return (
        <div className="flex flex-col items-center justify-center h-screen-1/2 gap-4 text-zinc-400 animate-pulse">
            <SafeIcon name="droplet" size={32} className="opacity-50" />
            <span className="text-[11px] font-bold tracking-widest uppercase">Laddar lagerdata...</span>
        </div>
    );

    const hasMoreLogItems = oilStatus.history.length > visibleLogCount;

    return (
        <div className="relative max-w-6xl animate-in fade-in slide-in-from-left-4 duration-700 pb-0 ml-0">
            
            <div className="absolute top-0 left-[-10%] w-[80%] h-[400px] bg-orange-500/10 dark:bg-orange-500/5 blur-[120px] rounded-full pointer-events-none -z-10 animate-[pulse_6s_infinite]"></div>

            {/* HEADER - Avskalad och proffsig igen */}
            <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 pb-4 border-b border-zinc-200 dark:border-white/5 gap-4 px-4 pt-2 lg:px-0 lg:pt-0">
                <div className="flex items-center gap-3 md:gap-4">
                    <div className="relative group cursor-default shrink-0">
                        <div className="absolute inset-0 bg-orange-500/40 blur-lg rounded-full transition-all duration-700 group-hover:bg-orange-500/60" />
                        <div className="relative w-10 h-10 md:w-12 md:h-12 rounded-xl flex items-center justify-center text-white shadow-md border border-white/20 transition-colors bg-gradient-to-br from-orange-400 to-orange-600">
                            <SafeIcon name="droplet" size={20} className="md:w-6 md:h-6" />
                        </div>
                    </div>
                    <div className="flex flex-col">
                        <h1 className="text-xl md:text-2xl font-black text-zinc-900 dark:text-white uppercase tracking-tight leading-none">
                            OLJE<span className="text-zinc-400 dark:text-zinc-500 font-light">LAGER</span>
                        </h1>
                        <p className="text-[9px] md:text-[10px] font-bold text-orange-500 dark:text-orange-400 uppercase tracking-widest mt-1 flex items-center gap-1.5">
                            <span className="w-1.5 h-1.5 rounded-full bg-orange-500 animate-pulse"></span>
                            Lagerhantering // Bulkfat
                        </p>
                    </div>
                </div>
            </div>

            <div className="px-4 lg:px-0 space-y-6">
                
                {/* METRICS GRID */}
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-5 gap-4 lg:gap-6">
                    
                    {/* HERO STAT CARD: Aktuell Volym */}
                    <div className="xl:col-span-3 p-6 lg:p-8 bg-white/90 dark:bg-[#182032]/90 backdrop-blur-xl rounded-3xl border border-zinc-200/80 dark:border-white/5 shadow-sm relative overflow-hidden group hover:shadow-xl hover:shadow-orange-500/5 transition-all duration-500 flex flex-col justify-between">
                        <div>
                            <SectionHeader title="Aktuell Volym" sub="Realtidsövervakning av aktivt fat" />
                            <div className="flex items-baseline gap-3 mt-4 lg:mt-8">
                                <span className={`text-6xl lg:text-7xl font-light tracking-tighter leading-none transition-colors ${oilStatus.isLow ? 'text-red-500 animate-pulse' : 'text-zinc-900 dark:text-white group-hover:text-orange-500'}`}>
                                    {oilStatus.current.toFixed(1)}
                                </span>
                                <span className="text-lg font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-widest">Liter</span>
                            </div>
                        </div>
                        
                        <div className="mt-8 lg:mt-12 relative">
                            <div className="flex justify-between text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-3.5">
                                <span>{oilStatus.fillPercentage < 20 ? 'Kritisk nivå' : 'Tillgängligt'}</span>
                                <span className={oilStatus.isLow ? 'text-red-500' : 'text-orange-500'}>{oilStatus.fillPercentage.toFixed(0)}% Kapacitet</span>
                            </div>
                            <div className="h-3 w-full bg-zinc-100 dark:bg-black/40 rounded-full overflow-hidden border border-zinc-200 dark:border-white/5 shadow-inner relative">
                                <div 
                                    className={`h-full absolute left-0 top-0 transition-all duration-1000 ease-out ${oilStatus.isLow ? 'bg-gradient-to-r from-red-500 to-red-600' : 'bg-gradient-to-r from-orange-400 to-orange-500'}`}
                                    style={{ width: `${oilStatus.fillPercentage}%` }}
                                >
                                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent -translate-x-full animate-[shimmer_1.5s_infinite]"></div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* SIDE CARDS: 2x2 Grid på Desktop */}
                    <div className="xl:col-span-2 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-2 gap-4 lg:gap-6">
                        
                        {/* Estimerad Räckvidd */}
                        <div className="p-5 lg:p-6 bg-white/90 dark:bg-[#182032]/90 backdrop-blur-xl rounded-3xl border border-zinc-200/80 dark:border-white/5 shadow-sm flex flex-col justify-center relative overflow-hidden group hover:shadow-md transition-all">
                            <div className="absolute right-0 top-0 w-24 h-24 bg-blue-500/5 blur-2xl rounded-full pointer-events-none group-hover:bg-blue-500/10 transition-colors"></div>
                            <h4 className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-2 flex items-center gap-1.5"><SafeIcon name="trending-up" size={12} className="text-blue-500" /> Estimerad Räckvidd</h4>
                            <div className="flex items-baseline gap-2">
                                <span className="text-4xl font-light text-zinc-900 dark:text-white tracking-tighter">~{oilStatus.estimatedMissions}</span>
                                <span className="text-[10px] font-bold text-blue-500 uppercase tracking-widest">Uppdrag kvar</span>
                            </div>
                        </div>

                        {/* Potentiellt Värde */}
                        <div className="p-5 lg:p-6 bg-white/90 dark:bg-[#182032]/90 backdrop-blur-xl rounded-3xl border border-zinc-200/80 dark:border-white/5 shadow-sm flex flex-col justify-center relative overflow-hidden group hover:shadow-md transition-all">
                            <div className="absolute right-0 top-0 w-24 h-24 bg-emerald-500/5 blur-2xl rounded-full pointer-events-none group-hover:bg-emerald-500/10 transition-colors"></div>
                            <h4 className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-2 flex items-center gap-1.5"><SafeIcon name="dollar-sign" size={12} className="text-emerald-500" /> Potentiellt Värde</h4>
                            <div className="flex items-baseline gap-1.5">
                                <span className="text-3xl font-black text-emerald-600 dark:text-emerald-400 tracking-tighter">{oilStatus.potentialRevenue.toLocaleString('sv-SE')}</span>
                                <span className="text-[10px] font-bold text-emerald-500/70 uppercase tracking-widest">kr</span>
                            </div>
                        </div>

                        {/* Extern Pott (Exkluderad Volym) */}
                        <div className="p-5 lg:p-6 bg-zinc-50/90 dark:bg-black/30 backdrop-blur-xl rounded-3xl border border-zinc-200/80 dark:border-white/5 shadow-inner flex flex-col justify-center relative overflow-hidden">
                            <h4 className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-2 flex items-center gap-1.5"><SafeIcon name="package" size={12} /> Extern Volym</h4>
                            <div className="flex items-baseline gap-2">
                                <span className="text-3xl font-light text-zinc-700 dark:text-zinc-300 tracking-tighter">{oilStatus.totalExcluded.toFixed(1)}</span>
                                <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">L Exkluderat</span>
                            </div>
                            <div className="text-[9px] font-medium text-zinc-400 mt-2 leading-tight">Olja från småflaskor eller externa källor.</div>
                        </div>

                        {/* Inställningar / Config Card */}
                        <div className="p-5 lg:p-6 bg-white/90 dark:bg-[#182032]/90 backdrop-blur-xl rounded-3xl border border-zinc-200/80 dark:border-white/5 shadow-sm flex flex-col justify-center relative transition-all duration-300">
                            {!isEditing ? (
                                <div className="space-y-4 relative">
                                    <button onClick={() => setIsEditing(true)} className="absolute -top-2 -right-2 p-2 text-zinc-400 hover:text-orange-500 hover:bg-orange-50 dark:hover:bg-orange-500/10 rounded-xl transition-colors" title="Redigera Fat">
                                        <SafeIcon name="edit-2" size={14} />
                                    </button>
                                    <div>
                                        <h4 className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-1">Startvolym</h4>
                                        <span className="text-xl font-medium text-zinc-900 dark:text-zinc-200">{oilStatus.initial.toFixed(1)} L</span>
                                    </div>
                                    <div className="h-px w-full bg-zinc-100 dark:bg-white/5"></div>
                                    <div>
                                        <h4 className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-1">Inköpt Datum</h4>
                                        <span className="text-sm font-mono font-bold text-zinc-600 dark:text-zinc-400">{settings.oilStartDate}</span>
                                    </div>
                                </div>
                            ) : (
                                <div className="space-y-3 animate-in fade-in zoom-in-95 duration-200">
                                    <div>
                                        <label className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest mb-1 block">Ny Startvolym (L)</label>
                                        <input 
                                            type="number" 
                                            value={editConfig.amount} 
                                            onChange={e => setEditConfig(p => ({ ...p, amount: e.target.value }))}
                                            className="w-full bg-zinc-50 dark:bg-[#1a2235] border border-zinc-200 dark:border-white/10 rounded-lg p-2 text-sm font-mono text-zinc-900 dark:text-white outline-none focus:border-orange-500"
                                        />
                                    </div>
                                    <div>
                                        <label className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest mb-1 block">Nytt Startdatum</label>
                                        <input 
                                            type="date" 
                                            value={editConfig.date} 
                                            onChange={e => setEditConfig(p => ({ ...p, date: e.target.value }))}
                                            className="w-full bg-zinc-50 dark:bg-[#1a2235] border border-zinc-200 dark:border-white/10 rounded-lg p-2 text-sm font-mono text-zinc-900 dark:text-white outline-none focus:border-orange-500 uppercase"
                                        />
                                    </div>
                                    <div className="flex gap-2 pt-1">
                                        <button onClick={() => setIsEditing(false)} className="flex-1 py-2 text-[10px] font-bold uppercase tracking-widest text-zinc-500 bg-zinc-100 dark:bg-white/5 hover:bg-zinc-200 dark:hover:bg-white/10 rounded-lg transition-colors">Avbryt</button>
                                        <button onClick={handleSaveSettings} className="flex-1 py-2 text-[10px] font-bold uppercase tracking-widest text-white bg-emerald-500 hover:bg-emerald-600 rounded-lg transition-colors shadow-sm">Spara</button>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* USAGE LOGS - Tajtare rader och paginering */}
                <div className="mt-8 lg:mt-10 pb-12">
                    <SectionHeader title="Förbrukningslogg" sub="Spåra åtgång per specifikt fordon" />
                    
                    <div className="bg-white/90 dark:bg-[#182032]/90 backdrop-blur-xl border border-zinc-200/80 dark:border-white/5 rounded-3xl overflow-hidden shadow-sm">
                        
                        {/* DESKTOP TABLE */}
                        <table className="hidden md:table w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-zinc-50/80 dark:bg-white/5 text-zinc-400 dark:text-zinc-500 text-[10px] font-bold uppercase tracking-widest border-b border-zinc-200 dark:border-white/5">
                                    <th className="px-6 py-4 font-medium">Kund</th>
                                    <th className="px-6 py-4 font-medium">Datum</th>
                                    <th className="px-6 py-4 font-medium">Reg.nr</th>
                                    <th className="px-6 py-4 font-medium text-center">Inkludera i fat</th>
                                    <th className="px-6 py-4 font-medium text-right">Volym</th>
                                    <th className="px-6 py-4 w-12"></th>
                                </tr>
                            </thead>
                            <tbody className="text-[13px] text-zinc-700 dark:text-zinc-300">
                                {oilStatus.history.length === 0 ? (
                                    <tr><td colSpan="6" className="px-6 py-12 text-center text-zinc-500 font-bold uppercase tracking-widest text-[11px]">Ingen historik hittades</td></tr>
                                ) : (
                                    oilStatus.history.slice(0, visibleLogCount).map((log, i) => (
                                        <tr 
                                            key={i} 
                                            className={`border-b border-zinc-100 dark:border-white/5 hover:bg-zinc-50 dark:hover:bg-white/[0.02] cursor-pointer transition-all group animate-in fade-in slide-in-from-bottom-2 duration-300 ${log.isExcluded ? 'bg-zinc-50/50 dark:bg-black/10' : ''}`}
                                            onClick={() => handleJobClick(log.id)}
                                            style={{ animationDelay: `${i * 20}ms` }}
                                        >
                                            <td className={`px-6 py-4 font-bold transition-colors ${log.isExcluded ? 'text-zinc-400 line-through decoration-zinc-300 dark:decoration-zinc-700' : 'text-zinc-900 dark:text-white group-hover:text-orange-500'}`}>
                                                {log.kund}
                                            </td>
                                            <td className={`px-6 py-4 font-mono text-[12px] ${log.isExcluded ? 'text-zinc-400' : ''}`}>{log.datum}</td>
                                            <td className={`px-6 py-4 font-mono text-[12px] ${log.isExcluded ? 'text-zinc-400' : 'text-zinc-500'}`}>{log.reg}</td>
                                            <td className="px-6 py-4 text-center">
                                                {/* iOS Style Toggle Switch */}
                                                <button 
                                                    onClick={(e) => toggleExcludeJob(e, log.id, log.isExcluded)}
                                                    className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors duration-300 focus:outline-none focus:ring-2 focus:ring-orange-500/50 ${log.isExcluded ? 'bg-zinc-200 dark:bg-zinc-800' : 'bg-emerald-500'}`}
                                                    title={log.isExcluded ? 'Räkna med i fatet' : 'Exkludera från fatet'}
                                                >
                                                    <span className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform duration-300 shadow-sm ${log.isExcluded ? 'translate-x-0.5' : 'translate-x-5'}`} />
                                                </button>
                                            </td>
                                            <td className="px-6 py-4 text-right font-mono font-bold">
                                                <span className={`${log.isExcluded ? 'text-zinc-400 line-through decoration-red-500/30' : 'text-orange-500'}`}>
                                                    -{log.mangd.toFixed(1)} L
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-center text-zinc-300 dark:text-zinc-600 group-hover:text-orange-500 transition-colors">
                                                <div className="opacity-0 group-hover:opacity-100 -translate-x-2 group-hover:translate-x-0 transition-all">
                                                    <ExternalLinkIcon />
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>

                        {/* MOBILE LIST VIEW */}
                        <div className="md:hidden divide-y divide-zinc-100 dark:divide-white/5">
                            {oilStatus.history.length === 0 ? (
                                <div className="p-8 text-center text-zinc-500 text-[11px] font-bold uppercase tracking-widest">Ingen historik hittades</div>
                            ) : (
                                oilStatus.history.slice(0, visibleLogCount).map((log, i) => (
                                    <div 
                                        key={i} 
                                        className={`px-5 py-4 flex flex-col gap-2.5 transition-colors group cursor-pointer animate-in fade-in slide-in-from-bottom-2 duration-300 ${log.isExcluded ? 'bg-zinc-50/50 dark:bg-black/10' : 'active:bg-zinc-50 dark:active:bg-white/[0.02]'}`} 
                                        onClick={() => handleJobClick(log.id)}
                                        style={{ animationDelay: `${i * 20}ms` }}
                                    >
                                        <div className="flex justify-between items-start">
                                            <div className="space-y-1">
                                                <div className={`text-[14px] font-bold flex items-center gap-2 ${log.isExcluded ? 'text-zinc-400 line-through decoration-zinc-300 dark:decoration-zinc-700' : 'text-zinc-900 dark:text-white'}`}>
                                                    {log.kund}
                                                </div>
                                                <div className="flex gap-2 text-[11px] font-mono items-center">
                                                    <span className={log.isExcluded ? 'text-zinc-400' : 'text-zinc-500 dark:text-zinc-400'}>{log.datum}</span>
                                                    <span className="w-1 h-1 bg-zinc-300 dark:bg-zinc-700 rounded-full"></span>
                                                    <span className={log.isExcluded ? 'text-zinc-400' : 'text-zinc-400 dark:text-zinc-500'}>{log.reg}</span>
                                                </div>
                                            </div>
                                            <div className={`text-[15px] font-black font-mono ${log.isExcluded ? 'text-zinc-400 line-through decoration-red-500/30' : 'text-orange-500'}`}>
                                                -{log.mangd.toFixed(1)} L
                                            </div>
                                        </div>
                                        
                                        <div className="pt-2 flex justify-between items-center">
                                            <span className={`text-[9px] font-bold uppercase tracking-widest ${log.isExcluded ? 'text-zinc-400' : 'text-emerald-500'}`}>
                                                {log.isExcluded ? 'Exkluderad Volym' : 'Inkluderad i fat'}
                                            </span>
                                            <button 
                                                onClick={(e) => toggleExcludeJob(e, log.id, log.isExcluded)}
                                                className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors duration-300 focus:outline-none ${log.isExcluded ? 'bg-zinc-200 dark:bg-zinc-800' : 'bg-emerald-500'}`}
                                            >
                                                <span className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform duration-300 shadow-sm ${log.isExcluded ? 'translate-x-0.5' : 'translate-x-5'}`} />
                                            </button>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>

                    {/* Visa Mer-knapp */}
                    {hasMoreLogItems && (
                        <div className="mt-5 flex justify-center animate-in fade-in duration-500">
                            <button 
                                onClick={() => setVisibleLogCount(prev => prev + 10)}
                                className="px-6 py-2.5 text-[11px] font-bold uppercase tracking-widest text-zinc-600 dark:text-zinc-400 bg-white/80 dark:bg-[#182032]/80 backdrop-blur-sm rounded-xl border-2 border-dashed border-zinc-200 dark:border-white/10 hover:border-orange-500/50 hover:text-orange-500 transition-all flex items-center gap-2 active:scale-95"
                            >
                                <SafeIcon name="arrow-down" size={14} />
                                Ladda fler ({oilStatus.history.length - visibleLogCount})
                            </button>
                        </div>
                    )}
                </div>

            </div>
        </div>
    );
};
