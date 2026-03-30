const SafeIcon = ({ name, size = 14, className = "" }) => (
    <span className="inline-flex items-center justify-center shrink-0">
        <window.Icon name={name} size={size} className={className} />
    </span>
);

const ExternalLinkIcon = () => (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path>
        <polyline points="15 3 21 3 21 9"></polyline>
        <line x1="10" y1="14" x2="21" y2="3"></line>
    </svg>
);

const SectionHeader = ({ title, sub }) => (
    <div className="flex items-center gap-3 mb-4">
        <div className="h-4 w-1 bg-orange-500 shadow-[0_0_8px_rgba(249,115,22,0.5)] rounded-full" />
        <div>
            <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-900 dark:text-white">{title}</h3>
            {sub && <p className="text-[8px] font-bold uppercase tracking-widest text-zinc-500 dark:text-zinc-400">{sub}</p>}
        </div>
    </div>
);

window.SupplyView = ({ allJobs, setView }) => {
    const [jobs, setJobs] = React.useState([]);
    const [settings, setSettings] = React.useState({ oilStartDate: '2025-11-22', oilStartAmount: 0 });
    const [loading, setLoading] = React.useState(true);

    React.useEffect(() => {
        const db = window.db;
        
        const unsubSettings = db.collection('settings').doc('inventory').onSnapshot(doc => {
            if (doc.exists) setSettings(doc.data());
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

    const oilStatus = React.useMemo(() => {
        const usageHistory = [];
        let totalUsed = 0;
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
                totalUsed += oilInThisJob;
                usageHistory.push({
                    id: job.id,
                    kund: job.kundnamn || 'MISSION_ENTITY',
                    datum: job.datum.split('T')[0],
                    mangd: oilInThisJob,
                    reg: job.regnr || 'N/A'
                });
            }
        });

        const currentVolume = startAmount - totalUsed;
        const avgUsage = usageHistory.length > 0 ? totalUsed / usageHistory.length : 0;
        const estimatedMissions = avgUsage > 0 ? Math.floor(currentVolume / avgUsage) : 0;

        return {
            current: currentVolume,
            initial: startAmount,
            history: usageHistory.sort((a, b) => b.datum.localeCompare(a.datum)),
            estimatedMissions,
            isLow: currentVolume < 10
        };
    }, [jobs, settings]);

    const handleJobClick = (id) => {
        const job = allJobs.find(j => j.id === id);
        if (job) {
            // Använder vår nya navigerings-logik
            setView('NEW_JOB', { job: job });
        }
    };

    if (loading) return <div className="p-8 text-zinc-400 font-black uppercase text-[10px] tracking-widest animate-pulse">Initializing_Link...</div>;

    return (
        <div className="max-w-3xl ml-0 animate-in fade-in slide-in-from-left-4 duration-500 mb-6 transition-colors duration-300">
            
            {/* PREMIUM HEADER - UTANFÖR KORTET */}
            <div className="flex flex-col md:flex-row md:items-center justify-between mb-4 pb-4 border-b border-zinc-200 dark:border-white/5 gap-4 px-5 pt-5 lg:px-0 lg:pt-0">
                <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-orange-500 rounded-[4px] flex items-center justify-center text-black font-bold shadow-[0_0_20px_rgba(249,115,22,0.3)] shrink-0">
                        <SafeIcon name="droplet" size={20} />
                    </div>
                    <div className="flex flex-col">
                        <h1 className="text-xl md:text-2xl font-black text-black dark:text-white uppercase tracking-[-0.03em] leading-none drop-shadow-sm dark:drop-shadow-none">
                            OIL <span className="text-zinc-500 dark:text-zinc-500">STATUS</span>
                        </h1>
                        <p className="text-[11px] font-bold text-zinc-500 uppercase tracking-widest mt-1.5">
                            Resource_Nexus // Oil_Control
                        </p>
                    </div>
                </div>
            </div>

            {/* FORMULÄRETS KORT */}
            <div className="bg-white dark:bg-[#182032] lg:shadow-md lg:rounded-xl overflow-hidden border border-zinc-200 dark:border-white/5 transition-colors duration-300 min-h-[80vh] lg:min-h-0">
                <div className="p-4 lg:p-8 space-y-8">
                    
                    {/* STATUS-PANEL */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 lg:gap-6 p-4 lg:p-5 bg-zinc-50 dark:bg-[#0f1522]/50 rounded-xl border border-zinc-200 dark:border-white/5">
                        <div className="p-4 lg:p-6 bg-white dark:bg-[#1f2940] border border-zinc-200 dark:border-white/5 rounded-xl shadow-sm relative overflow-hidden transition-colors">
                            <SectionHeader title="Current_Storage" sub="Litre_Metric" />
                            <div className="flex items-baseline justify-end gap-2 mt-4">
                                <span className={`text-4xl lg:text-5xl font-black font-mono tracking-tighter text-orange-500 ${oilStatus.isLow ? 'animate-pulse' : ''}`}>
                                    {oilStatus.current.toFixed(1)}
                                </span>
                                <span className="text-[10px] font-black text-zinc-400 dark:text-zinc-500 uppercase tracking-widest">Litres</span>
                            </div>
                            
                            {/* PROGNOS: Hur många missions kvar */}
                            <div className="mt-4 pt-3 border-t border-zinc-100 dark:border-white/5 flex justify-between items-center">
                                <span className="text-[8px] font-black text-zinc-400 dark:text-zinc-500 uppercase tracking-widest">Estimated_Reach</span>
                                <span className="text-[10px] font-black text-orange-500 uppercase tracking-tighter">
                                    ~{oilStatus.estimatedMissions} MISSIONS
                                </span>
                            </div>

                            <div className="mt-4 flex gap-1 h-1.5 lg:h-2">
                                {[...Array(20)].map((_, i) => (
                                    <div key={i} className={`flex-1 rounded-sm ${i / 20 < (oilStatus.current / oilStatus.initial) ? 'bg-orange-500 shadow-[0_0_5px_rgba(249,115,22,0.3)]' : 'bg-zinc-100 dark:bg-white/5'}`} />
                                ))}
                            </div>
                        </div>

                        <div className="p-4 lg:p-6 bg-white dark:bg-[#1f2940] rounded-xl border border-zinc-200 dark:border-white/5 flex flex-col justify-between shadow-sm transition-colors">
                            <SectionHeader title="Deployment_Info" sub="Database_Reference" />
                            <div className="space-y-3 mt-2">
                                <div className="flex justify-between border-b border-zinc-100 dark:border-white/5 pb-2">
                                    <span className="text-[9px] text-zinc-500 font-bold uppercase tracking-widest">Start_Date</span>
                                    <span className="text-[12px] font-black font-mono text-zinc-900 dark:text-white tracking-tighter">{settings.oilStartDate}</span>
                                </div>
                                <div className="flex justify-between border-b border-zinc-100 dark:border-white/5 pb-2">
                                    <span className="text-[9px] text-zinc-500 font-bold uppercase tracking-widest">Base_Volume</span>
                                    <span className="text-[12px] font-black font-mono text-orange-500 tracking-tighter">{oilStatus.initial.toFixed(1)} L</span>
                                </div>
                                {oilStatus.isLow && (
                                    <div className="text-[9px] font-black text-red-500 uppercase tracking-widest animate-pulse mt-2">
                                        ⚠️ CRITICAL_STORAGE_LEVEL
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* USAGE LOGS */}
                    <div className="space-y-4">
                        <SectionHeader title="Operational_Usage_Logs" sub="Mission_Specific_Deductions" />
                        <div className="bg-white dark:bg-[#1f2940] border border-zinc-200 dark:border-white/5 rounded-xl overflow-hidden shadow-sm transition-colors">
                            <table className="hidden md:table w-full text-left border-collapse">
                                <thead>
                                    <tr className="bg-zinc-50 dark:bg-[#0f1522]/50 text-zinc-500 dark:text-zinc-400 text-[9px] font-black uppercase tracking-[0.2em] border-b border-zinc-200 dark:border-white/5">
                                        <th className="px-4 py-3 border-r border-zinc-200 dark:border-white/5">Mission_Entity</th>
                                        <th className="px-4 py-3 border-r border-zinc-200 dark:border-white/5 text-center">Timestamp</th>
                                        <th className="px-4 py-3 border-r border-zinc-200 dark:border-white/5 text-center">Unit_ID</th>
                                        <th className="px-4 py-3 text-right">Debit_Vol</th>
                                        <th className="px-4 py-3 text-center w-10"></th>
                                    </tr>
                                </thead>
                                <tbody className="text-[11px] font-bold uppercase text-zinc-900 dark:text-white">
                                    {oilStatus.history.map((log, i) => (
                                        <tr 
                                            key={i} 
                                            className="border-b border-zinc-100 dark:border-white/5 hover:bg-zinc-50 dark:hover:bg-[#25324d] cursor-pointer transition-colors group"
                                            onClick={() => handleJobClick(log.id)}
                                        >
                                            <td className="px-4 py-3 border-r border-zinc-50 dark:border-white/5">{log.kund}</td>
                                            <td className="px-4 py-3 border-r border-zinc-50 dark:border-white/5 text-center font-mono font-black">{log.datum}</td>
                                            <td className="px-4 py-3 border-r border-zinc-50 dark:border-white/5 text-center font-mono text-zinc-400 dark:text-zinc-500 italic tracking-widest">{log.reg}</td>
                                            <td className="px-4 py-3 text-right text-orange-500 font-black">-{log.mangd.toFixed(1)} L</td>
                                            <td className="px-4 py-3 text-center text-zinc-300 dark:text-zinc-600 group-hover:text-orange-500 transition-colors">
                                                <ExternalLinkIcon />
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>

                            {/* MOBILE LIST VIEW */}
                            <div className="md:hidden divide-y divide-zinc-100 dark:divide-white/5 bg-white dark:bg-transparent">
                                {oilStatus.history.map((log, i) => (
                                    <div key={i} className="p-4 active:bg-zinc-50 dark:active:bg-[#25324d] flex justify-between items-center transition-colors" onClick={() => handleJobClick(log.id)}>
                                        <div className="space-y-1">
                                            <div className="text-[12px] font-black text-zinc-900 dark:text-white uppercase tracking-tight">{log.kund}</div>
                                            <div className="flex gap-3 text-[10px] font-bold items-center">
                                                <span className="text-orange-500 font-mono font-black">{log.datum}</span>
                                                <span className="text-zinc-400 dark:text-zinc-500 font-mono italic tracking-widest">{log.reg}</span>
                                                <span className="text-zinc-300 dark:text-zinc-600"><ExternalLinkIcon /></span>
                                            </div>
                                        </div>
                                        <div className="text-[15px] font-black text-orange-500 font-mono">-{log.mangd.toFixed(1)} L</div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
