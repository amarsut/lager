const SafeIcon = ({ name, size = 14, className = "" }) => (
    <span className="inline-flex items-center justify-center shrink-0">
        <window.Icon name={name} size={size} className={className} />
    </span>
);

const SectionHeader = ({ title, sub, light = false }) => (
    <div className="flex items-center gap-3 mb-4">
        <div className="h-4 w-1 theme-bg shadow-[0_0_8px_rgba(255,102,0,0.5)]" />
        <div>
            <h3 className={`text-[9px] font-black uppercase tracking-[0.2em] ${light ? 'text-white' : 'text-zinc-900'}`}>{title}</h3>
            {sub && <p className={`text-[7px] font-bold uppercase tracking-widest ${light ? 'text-zinc-500' : 'text-zinc-400'}`}>{sub}</p>}
        </div>
    </div>
);

window.SupplyView = () => {
    const [jobs, setJobs] = React.useState([]);
    const [settings, setSettings] = React.useState({ oilStartDate: '2025-11-22', oilStartAmount: 235.0 });
    const [loading, setLoading] = React.useState(true);

    React.useEffect(() => {
        const db = window.db; //
        
        const unsubSettings = db.collection('settings').doc('inventory').onSnapshot(doc => {
            if (doc.exists) setSettings(doc.data());
        });

        const unsubJobs = db.collection('jobs')
            .where('deleted', '==', false) //
            .onSnapshot(snapshot => {
                const jobList = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
                setJobs(jobList);
                setLoading(false);
            });

        return () => {
            unsubSettings();
            unsubJobs();
        };
    }, []);

    const oilStatus = React.useMemo(() => {
        const usageHistory = [];
        let totalUsed = 0;
        const startDate = settings.oilStartDate;
        const startAmount = parseFloat(settings.oilStartAmount) || 0;

        jobs.forEach(job => {
            if (!job.datum || job.datum < startDate) return; //

            const jobUtgifter = Array.isArray(job.utgifter) ? job.utgifter : []; //
            let oilInThisJob = 0;

            jobUtgifter.forEach(u => {
                const desc = (u.namn || "").toLowerCase(); //
                if (desc.includes('olja')) {
                    const match = u.namn.match(/(\d+[.,]\d+|\d+)/);
                    let detectedVolume = match ? parseFloat(match[0].replace(',', '.')) : 0;
                    
                    const costVal = parseFloat(String(u.kostnad || "0").replace(',', '.')); //
                    if (detectedVolume === 0 && costVal < 15) detectedVolume = costVal;
                    
                    oilInThisJob += detectedVolume;
                }
            });

            if (oilInThisJob > 0) {
                totalUsed += oilInThisJob;
                usageHistory.push({
                    id: job.id,
                    kund: job.kundnamn || 'MISSION_ENTITY', //
                    datum: job.datum.split('T')[0], //
                    mangd: oilInThisJob,
                    reg: job.regnr || 'N/A' //
                });
            }
        });

        return {
            current: startAmount - totalUsed,
            initial: startAmount,
            history: usageHistory.sort((a, b) => b.datum.localeCompare(a.datum))
        };
    }, [jobs, settings]);

    if (loading) return <div className="p-8 text-zinc-400 font-black uppercase text-[10px] tracking-widest animate-pulse">Initializing_Database_Link...</div>;

    return (
        <div className="max-w-3xl ml-0 animate-in fade-in slide-in-from-left-4 duration-500 pb-10">
            <div className="bg-zinc-50 border border-zinc-200 rounded-sm overflow-hidden shadow-2xl">
                
                {/* HEADER */}
                <div className="bg-zinc-950 p-4 flex items-center justify-between border-b-2 theme-border">
                    <div className="flex items-center gap-4">
                        <div className="w-10 h-10 theme-bg flex items-center justify-center rounded-sm shadow-[0_0_15px_rgba(255,102,0,0.2)]">
                            <SafeIcon name="droplet" size={18} className="text-black" />
                        </div>
                        <h2 className="text-xs font-black text-white uppercase tracking-[0.3em]">Resource_Nexus // Oil_Control</h2>
                    </div>
                </div>

                <div className="p-4 lg:p-8 space-y-6 lg:space-y-10">
                    
                    {/* STATUS-PANEL: Stackar på mobil, Grid på desktop */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 lg:gap-8 p-3 lg:p-4 bg-zinc-100/50 rounded-sm border border-zinc-200/50">
                        {/* Aktuellt lager */}
                        <div className="p-4 lg:p-6 bg-white border border-zinc-200 rounded-sm shadow-sm">
                            <SectionHeader title="Current_Storage" sub="Litre_Metric" />
                            <div className="flex items-baseline justify-end gap-2 mt-4">
                                <span className="text-3xl lg:text-5xl font-black font-mono tracking-tighter theme-text">
                                    {oilStatus.current.toFixed(1)}
                                </span>
                                <span className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">Litres</span>
                            </div>
                            <div className="mt-4 flex gap-1 h-1.5 lg:h-2">
                                {[...Array(20)].map((_, i) => (
                                    <div 
                                        key={i} 
                                        className={`flex-1 ${i / 20 < (oilStatus.current / oilStatus.initial) ? 'theme-bg shadow-[0_0_5px_rgba(255,102,0,0.5)]' : 'bg-zinc-100'}`} 
                                    />
                                ))}
                            </div>
                        </div>

                        {/* Inköpsinfo: Fixad vit text mot mörk bakgrund */}
                        <div className="p-4 lg:p-6 bg-zinc-950 text-white rounded-sm border border-zinc-800 flex flex-col justify-between">
                            <SectionHeader title="Deployment_Info" sub="Database_Reference" light={true} />
                            <div className="space-y-3 lg:space-y-4 mt-2">
                                <div className="flex justify-between border-b border-zinc-800 pb-2">
                                    <span className="text-[9px] text-zinc-500 font-bold uppercase tracking-widest">Start_Date</span>
                                    <span className="text-xs font-black font-mono text-white">{settings.oilStartDate}</span>
                                </div>
                                <div className="flex justify-between border-b border-zinc-800 pb-2">
                                    <span className="text-[9px] text-zinc-500 font-bold uppercase tracking-widest">Base_Vol</span>
                                    <span className="text-xs font-black font-mono theme-text">{oilStatus.initial.toFixed(1)} L</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* HISTORIK: Ny kolumn för datum, mobil-optimerad overflow */}
                    <div className="space-y-4">
                        <SectionHeader title="Operational_Usage_Logs" sub="Mission_Specific_Deductions" />
                        
                        <div className="bg-white border border-zinc-200 rounded-sm overflow-hidden shadow-sm">
                            <div className="overflow-x-auto">
                                <table className="w-full text-left border-collapse min-w-[450px] lg:min-w-full">
                                    <thead>
                                        <tr className="bg-zinc-100/80 text-zinc-500 text-[8px] font-black uppercase tracking-[0.2em] border-b border-zinc-200">
                                            <th className="p-3 lg:p-4 border-r border-zinc-200">Mission_Entity</th>
                                            <th className="p-3 lg:p-4 border-r border-zinc-200 text-center">Timestamp</th>
                                            <th className="p-3 lg:p-4 border-r border-zinc-200 text-center">Unit_ID</th>
                                            <th className="p-3 lg:p-4 text-right">Debit_Vol</th>
                                        </tr>
                                    </thead>
                                    <tbody className="text-[10px] font-bold uppercase">
                                        {oilStatus.history.map((log, i) => (
                                            <tr key={i} className="border-b border-zinc-100 hover:bg-zinc-50 transition-colors group">
                                                <td className="p-3 lg:p-4 border-r border-zinc-100 text-zinc-900 tracking-tight">
                                                    {log.kund}
                                                </td>
                                                <td className="p-3 lg:p-4 border-r border-zinc-100 text-center text-[8px] theme-text font-mono font-black italic">
                                                    {log.datum}
                                                </td>
                                                <td className="p-3 lg:p-4 border-r border-zinc-100 text-center font-mono text-zinc-400 group-hover:text-zinc-900 transition-colors">
                                                    {log.reg}
                                                </td>
                                                <td className="p-3 lg:p-4 text-right">
                                                    <div className="theme-text font-black text-xs">-{log.mangd.toFixed(1)} L</div>
                                                </td>
                                            </tr>
                                        ))}
                                        {oilStatus.history.length === 0 && (
                                            <tr>
                                                <td colSpan="4" className="p-10 lg:p-16 text-center">
                                                    <div className="flex flex-col items-center gap-3 opacity-20">
                                                        <SafeIcon name="slash" size={32} />
                                                        <span className="text-[10px] font-black uppercase tracking-[0.4em]">No_Active_Logs_Detected</span>
                                                    </div>
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>

                    {/* FOOTER */}
                    <div className="pt-8 border-t border-zinc-200 flex flex-col lg:flex-row justify-between items-center gap-4 opacity-50">
                        <div className="flex gap-6 lg:gap-10">
                            <div>
                                <p className="text-[7px] font-black text-zinc-400 uppercase tracking-widest text-center lg:text-left">System_Status</p>
                                <div className="flex items-center justify-center lg:justify-start gap-2 mt-1 text-zinc-900">
                                    <div className="w-1.5 h-1.5 rounded-full theme-bg animate-pulse" />
                                    <span className="text-[9px] font-black uppercase tracking-widest">Synchronized</span>
                                </div>
                            </div>
                            <div>
                                <p className="text-[7px] font-black text-zinc-400 uppercase tracking-widest text-center lg:text-left">Protocol</p>
                                <p className="text-[9px] font-black text-zinc-900 uppercase mt-1">OS_Oil_Logistic_v11</p>
                            </div>
                        </div>
                        <div className="text-center lg:text-right">
                            <p className="text-[7px] font-black text-zinc-400 uppercase tracking-widest">Internal_Link</p>
                            <p className="text-[9px] font-black theme-text uppercase mt-1 tracking-widest">● Encrypted_Secure</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
