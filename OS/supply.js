// supply.js

const SafeIcon = ({ name, size = 14, className = "" }) => (
    <span className="inline-flex items-center justify-center shrink-0">
        <window.Icon name={name} size={size} className={className} />
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
        const fillPercentage = Math.min(100, Math.max(0, (currentVolume / startAmount) * 100)) || 0;

        return {
            current: currentVolume,
            initial: startAmount,
            history: usageHistory.sort((a, b) => b.datum.localeCompare(a.datum)),
            estimatedMissions,
            fillPercentage,
            isLow: currentVolume < 10
        };
    }, [jobs, settings]);

    const handleJobClick = (id) => {
        const job = allJobs.find(j => j.id === id);
        if (job) {
            setView('NEW_JOB', { job: job });
        }
    };

    if (loading) return (
        <div className="flex flex-col items-start justify-center h-64 gap-4 pl-8 text-zinc-400 animate-pulse">
            <SafeIcon name="droplet" size={32} className="opacity-50" />
            <span className="text-sm font-bold tracking-widest uppercase">Initializing_Link...</span>
        </div>
    );

    return (
        // ÄNDRING HÄR: Borttagen 'mx-auto', ändrad animation till 'slide-in-from-left-4', 
        // satt 'max-w-5xl' för att det ska få ta lite bredd om skärmen tillåter men ändå hålla sig till vänster.
        <div className="relative max-w-5xl animate-in fade-in slide-in-from-left-4 duration-700 pb-24 ml-0">
            
            {/* Ambient Background Glow - Ändrad till att utgå från vänster (left-[-10%]) istället för mitten */}
            <div className="absolute top-0 left-[-10%] w-[80%] h-[400px] bg-orange-500/10 dark:bg-orange-500/5 blur-[120px] rounded-full pointer-events-none -z-10"></div>

            {/* HEADER */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 px-5 pt-8 pb-8 lg:px-2">
                <div className="flex items-center gap-5">
                    {/* Glowing Icon Container */}
                    <div className="relative group cursor-default">
                        <div className={`absolute inset-0 bg-orange-500/40 blur-xl rounded-full transition-all duration-700 ${oilStatus.isLow ? 'animate-pulse bg-red-500/40' : 'group-hover:bg-orange-500/60'}`} />
                        <div className={`relative w-14 h-14 rounded-2xl flex items-center justify-center text-white shadow-xl border border-white/20 transition-colors ${oilStatus.isLow ? 'bg-gradient-to-br from-red-500 to-red-700' : 'bg-gradient-to-br from-orange-400 to-orange-600'}`}>
                            <SafeIcon name="droplet" size={24} />
                        </div>
                    </div>
                    
                    <div className="flex flex-col">
                        <h1 className="text-2xl md:text-3xl font-black text-zinc-900 dark:text-white uppercase tracking-tight leading-none">
                            Oil <span className="text-zinc-400 dark:text-zinc-500 font-light">Status</span>
                        </h1>
                        <p className="text-[11px] font-bold text-orange-500 dark:text-orange-400 uppercase tracking-[0.2em] mt-2 flex items-center gap-2">
                            <span className="w-1.5 h-1.5 rounded-full bg-orange-500 animate-pulse"></span>
                            Resource_Nexus // Active
                        </p>
                    </div>
                </div>
            </div>

            <div className="px-4 lg:px-2 space-y-6">
                
                {/* METRICS GRID */}
                <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
                    
                    {/* HERO STAT CARD: Current Storage */}
                    <div className="md:col-span-3 p-6 lg:p-8 bg-white/80 dark:bg-[#121214]/80 backdrop-blur-xl rounded-3xl border border-zinc-200/80 dark:border-white/5 shadow-sm relative overflow-hidden group hover:shadow-xl hover:shadow-orange-500/5 transition-all duration-500">
                        <SectionHeader title="Current_Storage" sub="Live Volume Tracking" />
                        
                        <div className="flex items-baseline gap-3 mt-8">
                            <span className={`text-6xl lg:text-7xl font-light tracking-tighter ${oilStatus.isLow ? 'text-red-500 animate-pulse' : 'text-zinc-900 dark:text-white'}`}>
                                {oilStatus.current.toFixed(1)}
                            </span>
                            <span className="text-lg font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-widest">Litres</span>
                        </div>
                        
                        {/* Modern Progress Bar */}
                        <div className="mt-8 relative">
                            <div className="flex justify-between text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-3">
                                <span>Depleted</span>
                                <span>{oilStatus.fillPercentage.toFixed(0)}% Capacity</span>
                            </div>
                            <div className="h-3 w-full bg-zinc-100 dark:bg-black/40 rounded-full overflow-hidden border border-zinc-200 dark:border-white/5 shadow-inner">
                                <div 
                                    className={`h-full relative transition-all duration-1000 ease-out ${oilStatus.isLow ? 'bg-gradient-to-r from-red-500 to-red-600' : 'bg-gradient-to-r from-orange-400 to-orange-500'}`}
                                    style={{ width: `${oilStatus.fillPercentage}%` }}
                                >
                                    {/* Shimmer Effect */}
                                    <div className="absolute top-0 left-0 right-0 bottom-0 bg-gradient-to-r from-transparent via-white/30 to-transparent -translate-x-full animate-[shimmer_2s_infinite]"></div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* SECONDARY STATS */}
                    <div className="md:col-span-2 flex flex-col gap-6">
                        {/* Forecast Card */}
                        <div className="flex-1 p-6 bg-white/80 dark:bg-[#121214]/80 backdrop-blur-xl rounded-3xl border border-zinc-200/80 dark:border-white/5 shadow-sm flex flex-col justify-center relative overflow-hidden hover:shadow-lg transition-all">
                            <div className="absolute right-0 top-0 w-32 h-32 bg-blue-500/5 blur-3xl rounded-full pointer-events-none"></div>
                            <h4 className="text-[11px] font-bold text-zinc-400 uppercase tracking-widest mb-1">Estimated_Reach</h4>
                            <div className="flex items-baseline gap-2">
                                <span className="text-4xl font-light text-zinc-900 dark:text-white tracking-tighter">~{oilStatus.estimatedMissions}</span>
                                <span className="text-[10px] font-bold text-blue-500 uppercase tracking-widest">Missions</span>
                            </div>
                        </div>

                        {/* Config Card */}
                        <div className="flex-1 p-6 bg-white/80 dark:bg-[#121214]/80 backdrop-blur-xl rounded-3xl border border-zinc-200/80 dark:border-white/5 shadow-sm flex flex-col justify-center">
                            <div className="space-y-4">
                                <div>
                                    <h4 className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-0.5">Base_Volume</h4>
                                    <span className="text-xl font-medium text-zinc-900 dark:text-zinc-200">{oilStatus.initial.toFixed(1)} L</span>
                                </div>
                                <div className="h-px w-full bg-zinc-100 dark:bg-white/5"></div>
                                <div>
                                    <h4 className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-0.5">Start_Date</h4>
                                    <span className="text-sm font-mono text-zinc-600 dark:text-zinc-400">{settings.oilStartDate}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* USAGE LOGS */}
                <div className="mt-8">
                    <SectionHeader title="Operational_Usage_Logs" sub="Mission Specific Deductions" />
                    
                    <div className="bg-white/80 dark:bg-[#121214]/80 backdrop-blur-xl border border-zinc-200/80 dark:border-white/5 rounded-3xl overflow-hidden shadow-sm">
                        
                        {/* DESKTOP TABLE */}
                        <table className="hidden md:table w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-zinc-50/50 dark:bg-white/5 text-zinc-400 dark:text-zinc-500 text-[10px] font-bold uppercase tracking-widest border-b border-zinc-200 dark:border-white/5">
                                    <th className="px-6 py-4 font-medium">Mission_Entity</th>
                                    <th className="px-6 py-4 font-medium">Timestamp</th>
                                    <th className="px-6 py-4 font-medium">Unit_ID</th>
                                    <th className="px-6 py-4 font-medium text-right">Debit_Vol</th>
                                    <th className="px-6 py-4 w-12"></th>
                                </tr>
                            </thead>
                            <tbody className="text-[13px] text-zinc-700 dark:text-zinc-300">
                                {oilStatus.history.length === 0 ? (
                                    <tr><td colSpan="5" className="px-6 py-8 text-center text-zinc-500">Ingen data hittades</td></tr>
                                ) : (
                                    oilStatus.history.map((log, i) => (
                                        <tr 
                                            key={i} 
                                            className="border-b border-zinc-100 dark:border-white/5 hover:bg-zinc-50 dark:hover:bg-white/[0.02] cursor-pointer transition-all group"
                                            onClick={() => handleJobClick(log.id)}
                                        >
                                            <td className="px-6 py-4 font-semibold text-zinc-900 dark:text-white group-hover:translate-x-1 transition-transform">{log.kund}</td>
                                            <td className="px-6 py-4 font-mono text-[12px]">{log.datum}</td>
                                            <td className="px-6 py-4 font-mono text-[12px] text-zinc-500">{log.reg}</td>
                                            <td className="px-6 py-4 text-right font-mono font-bold text-orange-500">-{log.mangd.toFixed(1)} L</td>
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
                                <div className="p-8 text-center text-zinc-500 text-sm">Ingen data hittades</div>
                            ) : (
                                oilStatus.history.map((log, i) => (
                                    <div 
                                        key={i} 
                                        className="p-5 active:bg-zinc-50 dark:active:bg-white/[0.02] flex justify-between items-center transition-colors group cursor-pointer" 
                                        onClick={() => handleJobClick(log.id)}
                                    >
                                        <div className="space-y-1.5 flex-1">
                                            <div className="text-[14px] font-bold text-zinc-900 dark:text-white group-hover:text-orange-500 transition-colors">{log.kund}</div>
                                            <div className="flex gap-3 text-[11px] font-mono items-center">
                                                <span className="text-zinc-500 dark:text-zinc-400">{log.datum}</span>
                                                <span className="w-1 h-1 bg-zinc-300 dark:bg-zinc-700 rounded-full"></span>
                                                <span className="text-zinc-400 dark:text-zinc-500">{log.reg}</span>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-4">
                                            <div className="text-[14px] font-bold text-orange-500 font-mono">-{log.mangd.toFixed(1)} L</div>
                                            <div className="text-zinc-300 dark:text-zinc-600"><ExternalLinkIcon /></div>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </div>

            </div>
        </div>
    );
};
