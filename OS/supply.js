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

const SectionHeader = ({ title, sub }) => (
    <div className="flex items-start gap-2.5 mb-4">
        <div className="mt-1 h-4 w-1 bg-gradient-to-b from-orange-400 to-orange-600 rounded-full shadow-[0_0_8px_rgba(249,115,22,0.4)]" />
        <div>
            <h3 className="text-[12px] font-bold uppercase tracking-widest text-zinc-900 dark:text-white leading-none">{title}</h3>
            {sub && <p className="text-[9px] font-medium uppercase tracking-[0.15em] text-zinc-400 dark:text-zinc-500 mt-1">{sub}</p>}
        </div>
    </div>
);

// --- NY 3-VÄGS TOGGLE / SLIDER ---
const ThreeWayToggle = ({ value, onChange, jobId }) => {
    const getBgColor = () => {
        if (value === 'FAT') return 'bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.4)]';
        if (value === 'ANNAN') return 'bg-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.4)]';
        if (value === 'JOBBET') return 'bg-purple-500 shadow-[0_0_10px_rgba(168,85,247,0.4)]';
        return 'bg-emerald-500';
    };

    // Styr sliderns position baserat på värde
    const getTransform = () => {
        if (value === 'FAT') return 'translateX(0)';
        if (value === 'ANNAN') return 'translateX(100%)';
        if (value === 'JOBBET') return 'translateX(200%)';
        return 'translateX(0)';
    };

    return (
        <div 
            className="relative inline-flex bg-zinc-200/50 dark:bg-black/40 rounded-full p-1 w-[160px] h-8 shadow-inner border border-zinc-200/50 dark:border-white/5" 
            onClick={(e) => e.stopPropagation()}
        >
            {/* Själva Slider-knappen som åker fram och tillbaka */}
            <div 
                className={`absolute top-1 bottom-1 w-[calc(33.33%-2.66px)] rounded-full transition-transform duration-300 ease-out ${getBgColor()}`} 
                style={{ transform: getTransform() }}
            ></div>
            
            <button onClick={(e) => onChange(e, jobId, 'FAT')} className={`relative flex-1 flex justify-center items-center z-10 text-[9px] font-black uppercase tracking-widest transition-colors ${value === 'FAT' ? 'text-white' : 'text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-white'}`}>
                Fat
            </button>
            <button onClick={(e) => onChange(e, jobId, 'ANNAN')} className={`relative flex-1 flex justify-center items-center z-10 text-[9px] font-black uppercase tracking-widest transition-colors ${value === 'ANNAN' ? 'text-white' : 'text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-white'}`}>
                Annan
            </button>
            <button onClick={(e) => onChange(e, jobId, 'JOBBET')} className={`relative flex-1 flex justify-center items-center z-10 text-[9px] font-black uppercase tracking-widest transition-colors ${value === 'JOBBET' ? 'text-white' : 'text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-white'}`}>
                Jobb
            </button>
        </div>
    );
};

window.SupplyView = ({ allJobs, setView }) => {
    const [jobs, setJobs] = React.useState([]);
    const [settings, setSettings] = React.useState({ oilStartDate: '2025-11-22', oilStartAmount: 235 });
    const [loading, setLoading] = React.useState(true);
    
    const [isEditing, setIsEditing] = React.useState(false);
    const [editConfig, setEditConfig] = React.useState({ date: '', amount: '' });
    const [visibleLogCount, setVisibleLogCount] = React.useState(10); // Visar fler på en gång nu när det är kompakt

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

    const changeOilSource = async (e, jobId, newSource) => {
        e.stopPropagation();
        try {
            await window.db.collection('jobs').doc(jobId).update({
                oilSource: newSource,
                excludeFromOilCalc: newSource !== 'FAT' 
            });
        } catch (error) {
            console.error("Kunde inte uppdatera oljekälla:", error);
        }
    };

    const oilStatus = React.useMemo(() => {
        const usageHistory = [];
        let totalUsed = 0;
        let totalAnnan = 0;
        let totalJobbet = 0;
        
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
                let source = job.oilSource;
                if (!source) source = job.excludeFromOilCalc ? 'ANNAN' : 'FAT';

                if (source === 'FAT') totalUsed += oilInThisJob;
                else if (source === 'JOBBET') totalJobbet += oilInThisJob;
                else totalAnnan += oilInThisJob;
                
                usageHistory.push({
                    id: job.id,
                    kund: job.kundnamn || 'Okänd Kund',
                    datum: job.datum.split('T')[0],
                    mangd: oilInThisJob,
                    reg: job.regnr || '-',
                    source: source
                });
            }
        });

        const currentVolume = Math.max(0, startAmount - totalUsed);
        const activeUsageHistory = usageHistory.filter(h => h.source === 'FAT');
        const avgUsage = activeUsageHistory.length > 0 ? totalUsed / activeUsageHistory.length : 0;
        const estimatedMissions = avgUsage > 0 ? Math.floor(currentVolume / avgUsage) : 0;
        const fillPercentage = Math.min(100, Math.max(0, (currentVolume / startAmount) * 100)) || 0;
        const potentialRevenue = currentVolume * 200; 

        return {
            current: currentVolume,
            initial: startAmount,
            totalAnnan,
            totalJobbet,
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
        <div className="flex flex-col min-h-[calc(100vh-80px)] md:min-h-screen bg-transparent text-zinc-900 dark:text-white pb-10 transition-colors duration-500 relative max-w-[1400px] ml-0 w-full animate-in fade-in slide-in-from-left-4">
            
            <div className="absolute top-0 left-[-10%] w-[60%] h-[400px] bg-orange-500/10 dark:bg-orange-500/5 blur-[120px] rounded-full pointer-events-none -z-10 hidden lg:block"></div>

            <div className="px-4 pt-4 lg:px-0 lg:pt-0 flex flex-col">
                {/* HEADER (Kompaktare) */}
                <div className="flex flex-col md:flex-row md:items-center justify-between mb-3 pb-3 border-b border-zinc-200/50 dark:border-white/5 gap-3">
                    <div className="flex items-center gap-3">
                        <div className="relative group cursor-default shrink-0">
                            <div className="absolute inset-0 bg-orange-500/40 blur-lg rounded-full transition-all duration-700" />
                            <div className="relative w-10 h-10 rounded-xl flex items-center justify-center text-white shadow-md border border-white/20 transition-colors bg-gradient-to-br from-orange-400 to-orange-600">
                                <SafeIcon name="droplet" size={20} />
                            </div>
                        </div>
                        <div className="flex flex-col">
                            <h1 className="text-xl font-black text-zinc-900 dark:text-white uppercase tracking-tight leading-none">
                                OLJE<span className="text-zinc-400 dark:text-zinc-500 font-light">LAGER</span>
                            </h1>
                            <p className="text-[9px] font-bold text-orange-500 dark:text-orange-400 uppercase tracking-widest mt-1 flex items-center gap-1.5">
                                <span className="w-1.5 h-1.5 rounded-full bg-orange-500 animate-pulse"></span>
                                Lagerhantering // Bulkfat
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            <div className="px-4 lg:px-0 space-y-4">
                
                {/* METRICS GRID (Tajtare padding och fontstorlekar) */}
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-5 gap-3 lg:gap-4">
                    
                    {/* HERO STAT CARD */}
                    <div className="xl:col-span-3 p-5 lg:p-6 bg-white/90 dark:bg-[#182032]/90 backdrop-blur-xl rounded-[20px] border border-zinc-200/80 dark:border-white/5 shadow-sm relative overflow-hidden group transition-all duration-500 flex flex-col justify-between">
                        <div>
                            <SectionHeader title="Aktuell Volym" sub="Realtidsövervakning av aktivt fat" />
                            <div className="flex items-baseline gap-2 mt-2">
                                <span className={`text-5xl lg:text-6xl font-light tracking-tighter leading-none transition-colors ${oilStatus.isLow ? 'text-red-500 animate-pulse' : 'text-orange-500 dark:text-orange-400 group-hover:text-orange-600'}`}>
                                    {oilStatus.current.toFixed(1)}
                                </span>
                                <span className="text-sm font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-widest">Liter</span>
                            </div>
                        </div>
                        
                        <div className="mt-6 lg:mt-8 relative">
                            <div className="flex justify-between text-[9px] font-bold text-zinc-500 uppercase tracking-widest mb-2.5">
                                <span>{oilStatus.fillPercentage < 20 ? 'Kritisk nivå' : 'Tillgängligt'}</span>
                                <span className={oilStatus.isLow ? 'text-red-500' : 'text-orange-500'}>{oilStatus.fillPercentage.toFixed(0)}% Kapacitet</span>
                            </div>
                            <div className="h-2.5 w-full bg-zinc-100 dark:bg-black/40 rounded-full overflow-hidden border border-zinc-200 dark:border-white/5 shadow-inner relative">
                                <div 
                                    className={`h-full absolute left-0 top-0 transition-all duration-1000 ease-out ${oilStatus.isLow ? 'bg-gradient-to-r from-red-500 to-red-600' : 'bg-gradient-to-r from-orange-400 to-orange-500'}`}
                                    style={{ width: `${oilStatus.fillPercentage}%` }}
                                >
                                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent -translate-x-full animate-[shimmer_1.5s_infinite]"></div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* SIDE CARDS (Tajtare) */}
                    <div className="xl:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-3 lg:gap-4">
                        
                        <div className="p-4 bg-white/90 dark:bg-[#182032]/90 backdrop-blur-xl rounded-[20px] border border-zinc-200/80 dark:border-white/5 shadow-sm flex flex-col justify-center relative overflow-hidden group">
                            <div className="absolute right-0 top-0 w-20 h-20 bg-blue-500/5 blur-xl rounded-full pointer-events-none group-hover:bg-blue-500/10"></div>
                            <h4 className="text-[9px] font-bold text-zinc-400 uppercase tracking-widest mb-2 flex items-center gap-1.5"><SafeIcon name="trending-up" size={10} className="text-blue-500" /> Estimerad Räckvidd</h4>
                            <div className="flex items-baseline gap-1.5">
                                <span className="text-3xl font-light text-zinc-900 dark:text-white tracking-tighter">~{oilStatus.estimatedMissions}</span>
                                <span className="text-[9px] font-bold text-blue-500 uppercase tracking-widest">Uppdrag</span>
                            </div>
                        </div>

                        <div className="p-4 bg-white/90 dark:bg-[#182032]/90 backdrop-blur-xl rounded-[20px] border border-zinc-200/80 dark:border-white/5 shadow-sm flex flex-col justify-center relative overflow-hidden group">
                            <div className="absolute right-0 top-0 w-20 h-20 bg-emerald-500/5 blur-xl rounded-full pointer-events-none group-hover:bg-emerald-500/10"></div>
                            <h4 className="text-[9px] font-bold text-zinc-400 uppercase tracking-widest mb-2 flex items-center gap-1.5"><SafeIcon name="dollar-sign" size={10} className="text-emerald-500" /> Potentiellt Värde</h4>
                            <div className="flex items-baseline gap-1">
                                <span className="text-2xl font-black text-emerald-600 dark:text-emerald-400 tracking-tighter">{oilStatus.potentialRevenue.toLocaleString('sv-SE')}</span>
                                <span className="text-[9px] font-bold text-emerald-500/70 uppercase tracking-widest">kr</span>
                            </div>
                        </div>

                        <div className="p-4 bg-zinc-50/90 dark:bg-black/30 backdrop-blur-xl rounded-[20px] border border-zinc-200/80 dark:border-white/5 shadow-inner flex flex-col justify-center relative overflow-hidden">
                            <h4 className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest mb-1.5 flex items-center gap-1.5"><SafeIcon name="package" size={10} /> Extern Volym</h4>
                            <div className="flex items-baseline gap-1.5 mb-2">
                                <span className="text-2xl font-light text-zinc-700 dark:text-zinc-300 tracking-tighter">{(oilStatus.totalAnnan + oilStatus.totalJobbet).toFixed(1)}</span>
                                <span className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest">L Totalt</span>
                            </div>
                            <div className="flex flex-col gap-1 mt-auto border-t border-zinc-200/50 dark:border-white/5 pt-2">
                                <div className="flex justify-between items-center text-[9px] font-bold">
                                    <span className="text-zinc-400 uppercase tracking-widest flex items-center gap-1.5"><SafeIcon name="briefcase" size={10} className="text-purple-400"/> Från Jobbet</span>
                                    <span className="text-zinc-700 dark:text-zinc-300 font-mono">{oilStatus.totalJobbet.toFixed(1)} L</span>
                                </div>
                                <div className="flex justify-between items-center text-[9px] font-bold">
                                    <span className="text-zinc-400 uppercase tracking-widest flex items-center gap-1.5"><SafeIcon name="info" size={10} className="text-blue-400"/> Annan Olja</span>
                                    <span className="text-zinc-700 dark:text-zinc-300 font-mono">{oilStatus.totalAnnan.toFixed(1)} L</span>
                                </div>
                            </div>
                        </div>

                        <div className="p-4 bg-white/90 dark:bg-[#182032]/90 backdrop-blur-xl rounded-[20px] border border-zinc-200/80 dark:border-white/5 shadow-sm flex flex-col justify-center relative transition-all duration-300">
                            {!isEditing ? (
                                <div className="space-y-3 relative">
                                    <button onClick={() => setIsEditing(true)} className="absolute -top-1 -right-1 p-1.5 text-zinc-400 hover:text-orange-500 hover:bg-orange-50 dark:hover:bg-orange-500/10 rounded-lg transition-colors" title="Redigera Fat">
                                        <SafeIcon name="edit-2" size={12} />
                                    </button>
                                    <div>
                                        <h4 className="text-[9px] font-bold text-zinc-400 uppercase tracking-widest mb-0.5">Startvolym</h4>
                                        <span className="text-lg font-medium text-zinc-900 dark:text-zinc-200">{oilStatus.initial.toFixed(1)} L</span>
                                    </div>
                                    <div className="h-px w-full bg-zinc-100 dark:bg-white/5"></div>
                                    <div>
                                        <h4 className="text-[9px] font-bold text-zinc-400 uppercase tracking-widest mb-0.5">Inköpt Datum</h4>
                                        <span className="text-xs font-mono font-bold text-zinc-600 dark:text-zinc-400">{settings.oilStartDate}</span>
                                    </div>
                                </div>
                            ) : (
                                <div className="space-y-2 animate-in fade-in zoom-in-95 duration-200">
                                    <div>
                                        <label className="text-[8px] font-bold text-zinc-500 uppercase tracking-widest mb-0.5 block">Startvolym (L)</label>
                                        <input type="number" value={editConfig.amount} onChange={e => setEditConfig(p => ({ ...p, amount: e.target.value }))} className="w-full bg-zinc-50 dark:bg-[#1a2235] border border-zinc-200 dark:border-white/10 rounded-md p-1.5 text-[11px] font-mono text-zinc-900 dark:text-white outline-none focus:border-orange-500"/>
                                    </div>
                                    <div>
                                        <label className="text-[8px] font-bold text-zinc-500 uppercase tracking-widest mb-0.5 block">Startdatum</label>
                                        <input type="date" value={editConfig.date} onChange={e => setEditConfig(p => ({ ...p, date: e.target.value }))} className="w-full bg-zinc-50 dark:bg-[#1a2235] border border-zinc-200 dark:border-white/10 rounded-md p-1.5 text-[11px] font-mono text-zinc-900 dark:text-white outline-none focus:border-orange-500 uppercase"/>
                                    </div>
                                    <div className="flex gap-1.5 pt-1">
                                        <button onClick={() => setIsEditing(false)} className="flex-1 py-1.5 text-[9px] font-bold uppercase tracking-widest text-zinc-500 bg-zinc-100 dark:bg-white/5 rounded-md">Avbryt</button>
                                        <button onClick={handleSaveSettings} className="flex-1 py-1.5 text-[9px] font-bold uppercase tracking-widest text-white bg-emerald-500 rounded-md">Spara</button>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* USAGE LOGS (Superkompakt) */}
                <div className="mt-6 lg:mt-8 pb-12">
                    <SectionHeader title="Förbrukningslogg" sub="Spåra åtgång per specifikt fordon" />
                    
                    <div className="bg-white/90 dark:bg-[#182032]/90 backdrop-blur-xl border border-zinc-200/80 dark:border-white/5 rounded-2xl overflow-hidden shadow-sm">
                        
                        {/* DESKTOP TABLE */}
                        <table className="hidden md:table w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-zinc-50/80 dark:bg-white/5 text-zinc-400 dark:text-zinc-500 text-[9px] font-bold uppercase tracking-widest border-b border-zinc-200 dark:border-white/5">
                                    <th className="px-4 py-3 font-medium">Kund</th>
                                    <th className="px-4 py-3 font-medium">Datum</th>
                                    <th className="px-4 py-3 font-medium">Reg.nr</th>
                                    <th className="px-4 py-3 font-medium text-center">Källa (Volym)</th>
                                    <th className="px-4 py-3 font-medium text-right">Volym</th>
                                    <th className="px-4 py-3 w-10"></th>
                                </tr>
                            </thead>
                            <tbody className="text-[13px] text-zinc-700 dark:text-zinc-300">
                                {oilStatus.history.length === 0 ? (
                                    <tr><td colSpan="6" className="px-4 py-10 text-center text-zinc-500 font-bold uppercase tracking-widest text-[10px]">Ingen historik hittades</td></tr>
                                ) : (
                                    oilStatus.history.slice(0, visibleLogCount).map((log, i) => (
                                        <tr 
                                            key={i} 
                                            className={`border-b border-zinc-100 dark:border-white/5 hover:bg-zinc-50 dark:hover:bg-white/[0.02] cursor-pointer transition-all group animate-in fade-in slide-in-from-bottom-2 duration-300 ${log.source !== 'FAT' ? 'bg-zinc-50/50 dark:bg-black/10' : ''}`}
                                            onClick={() => handleJobClick(log.id)}
                                            style={{ animationDelay: `${i * 15}ms` }}
                                        >
                                            <td className={`px-4 py-2.5 font-bold transition-colors ${log.source !== 'FAT' ? 'text-zinc-400 dark:text-zinc-500' : 'text-zinc-900 dark:text-white group-hover:text-orange-500'}`}>
                                                {log.kund}
                                            </td>
                                            <td className={`px-4 py-2.5 font-mono text-[11px] ${log.source !== 'FAT' ? 'text-zinc-400 dark:text-zinc-500' : ''}`}>{log.datum}</td>
                                            <td className={`px-4 py-2.5 font-mono text-[11px] ${log.source !== 'FAT' ? 'text-zinc-400 dark:text-zinc-500' : 'text-zinc-500'}`}>{log.reg}</td>
                                            
                                            <td className="px-4 py-2.5 text-center">
                                                <ThreeWayToggle value={log.source} onChange={changeOilSource} jobId={log.id} />
                                            </td>
                                            
                                            <td className="px-4 py-2.5 text-right font-mono font-bold">
                                                <span className={`${log.source !== 'FAT' ? 'text-zinc-400 dark:text-zinc-500' : 'text-orange-500'}`}>
                                                    -{log.mangd.toFixed(1)} L
                                                </span>
                                            </td>
                                            <td className="px-4 py-2.5 text-center text-zinc-300 dark:text-zinc-600 group-hover:text-orange-500 transition-colors">
                                                <div className="opacity-0 group-hover:opacity-100 -translate-x-1 group-hover:translate-x-0 transition-all">
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
                                <div className="p-6 text-center text-zinc-500 text-[10px] font-bold uppercase tracking-widest">Ingen historik hittades</div>
                            ) : (
                                oilStatus.history.slice(0, visibleLogCount).map((log, i) => (
                                    <div 
                                        key={i} 
                                        className={`px-4 py-3 flex flex-col gap-2 transition-colors group cursor-pointer animate-in fade-in slide-in-from-bottom-2 duration-300 ${log.source !== 'FAT' ? 'bg-zinc-50/50 dark:bg-black/10' : 'active:bg-zinc-50 dark:active:bg-white/[0.02]'}`} 
                                        onClick={() => handleJobClick(log.id)}
                                        style={{ animationDelay: `${i * 15}ms` }}
                                    >
                                        <div className="flex justify-between items-start">
                                            <div className="space-y-1">
                                                <div className={`text-[13px] font-bold flex items-center gap-2 ${log.source !== 'FAT' ? 'text-zinc-400 dark:text-zinc-500' : 'text-zinc-900 dark:text-white'}`}>
                                                    {log.kund}
                                                </div>
                                                <div className="flex gap-1.5 text-[10px] font-mono items-center">
                                                    <span className={log.source !== 'FAT' ? 'text-zinc-400 dark:text-zinc-600' : 'text-zinc-500 dark:text-zinc-400'}>{log.datum}</span>
                                                    <span className="w-1 h-1 bg-zinc-300 dark:bg-zinc-700 rounded-full"></span>
                                                    <span className={log.source !== 'FAT' ? 'text-zinc-400 dark:text-zinc-600' : 'text-zinc-400 dark:text-zinc-500'}>{log.reg}</span>
                                                </div>
                                            </div>
                                            <div className={`text-[14px] font-black font-mono ${log.source !== 'FAT' ? 'text-zinc-400 dark:text-zinc-500' : 'text-orange-500'}`}>
                                                -{log.mangd.toFixed(1)} L
                                            </div>
                                        </div>
                                        
                                        <div className="pt-2 flex justify-between items-center border-t border-zinc-100 dark:border-white/5 mt-1">
                                            <span className="text-[8px] font-bold uppercase tracking-widest text-zinc-400">Källa:</span>
                                            <ThreeWayToggle value={log.source} onChange={changeOilSource} jobId={log.id} />
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>

                    {hasMoreLogItems && (
                        <div className="mt-4 flex justify-center animate-in fade-in duration-500">
                            <button 
                                onClick={() => setVisibleLogCount(prev => prev + 10)}
                                className="px-5 py-2 text-[10px] font-bold uppercase tracking-widest text-zinc-600 dark:text-zinc-400 bg-white/80 dark:bg-[#182032]/80 backdrop-blur-sm rounded-lg border border-zinc-200 dark:border-white/10 hover:border-orange-500/50 hover:text-orange-500 transition-all flex items-center gap-1.5 active:scale-95 shadow-sm"
                            >
                                <SafeIcon name="arrow-down" size={12} />
                                Ladda fler ({oilStatus.history.length - visibleLogCount})
                            </button>
                        </div>
                    )}
                </div>

            </div>
        </div>
    );
};
