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
    const [settings, setSettings] = React.useState({ oilStartDate: '2025-11-22', oilStartAmount: 20.0 });
    const [loading, setLoading] = React.useState(true);

    // DIREKT DATABASKOPPLING (Självständig lyssnare)
    React.useEffect(() => {
        const db = window.db; // Hämtar Firebase-referensen direkt
        
        // 1. Lyssna på lagerinställningar (Startdatum & Mängd)
        const unsubSettings = db.collection('settings').doc('inventory').onSnapshot(doc => {
            if (doc.exists) {
                setSettings(doc.data());
            }
        });

        // 2. Lyssna på jobb (Filtrerar bort raderade)
        const unsubJobs = db.collection('jobs')
            .where('deleted', '==', false)
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

    // LOGIK: BERÄKNA VOLYM & HISTORIK
    const oilStatus = React.useMemo(() => {
        const usageHistory = [];
        let totalUsed = 0;
        const startDate = settings.oilStartDate;
        const startAmount = parseFloat(settings.oilStartAmount) || 0;

        jobs.forEach(job => {
            // Använder 'datum' fältet från sparlogiken
            if (!job.datum || job.datum < startDate) return;

            const jobUtgifter = Array.isArray(job.utgifter) ? job.utgifter : [];
            let oilInThisJob = 0;

            jobUtgifter.forEach(u => {
                const desc = (u.namn || "").toLowerCase();
                if (desc.includes('olja')) {
                    // Extrahera volym från text (t.ex. "4.3L") eller använd kostnad om < 15
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

        return {
            current: startAmount - totalUsed,
            initial: startAmount,
            history: usageHistory.sort((a, b) => b.datum.localeCompare(a.datum))
        };
    }, [jobs, settings]);

    if (loading) return <div className="p-8 text-zinc-400 font-black uppercase text-[10px] tracking-widest">Initializing_Database_Link...</div>;

    return (
        <div className="max-w-3xl ml-0 animate-in fade-in slide-in-from-left-4 duration-500 pb-10">
            <div className="bg-zinc-50 border border-zinc-200 rounded-sm overflow-hidden shadow-2xl">
                
                {/* HEADER - MATRIX DARK */}
                <div className="bg-zinc-950 p-4 flex items-center justify-between border-b-2 theme-border">
                    <div className="flex items-center gap-4">
                        <div className="w-10 h-10 theme-bg flex items-center justify-center rounded-sm shadow-[0_0_15px_rgba(255,102,0,0.2)]">
                            <SafeIcon name="droplet" size={18} className="text-black" />
                        </div>
                        <h2 className="text-xs font-black text-white uppercase tracking-[0.3em]">Resource_Nexus // Oil_Control</h2>
                    </div>
                </div>

                <div className="p-6 space-y-6">
                    
                    {/* STATUS-PANEL */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-4 bg-zinc-100/50 rounded-sm border border-zinc-200/50">
                        {/* Aktuellt lager */}
                        <div className="p-4 bg-white border border-zinc-200 rounded-sm">
                            <SectionHeader title="Current_Storage" sub="Litre_Metric" />
                            <div className="text-4xl font-black font-mono tracking-tighter theme-text text-right">
                                {oilStatus.current.toFixed(1)} <span className="text-[10px] text-zinc-400">L</span>
                            </div>
                            <div className="w-full bg-zinc-100 h-1 mt-3 rounded-full overflow-hidden">
                                <div className="theme-bg h-full transition-all duration-1000" style={{ width: `${(oilStatus.current / oilStatus.initial) * 100}%` }} />
                            </div>
                        </div>

                        {/* Inköpsinfo - Vit text på mörk bakgrund */}
                        <div className="p-4 bg-zinc-950 rounded-sm border border-zinc-800">
                            <SectionHeader title="Deployment_Info" sub="Database_Reference" light={true} />
                            <div className="space-y-2 mt-2">
                                <div className="flex justify-between text-[10px] font-bold border-b border-zinc-800 pb-1">
                                    <span className="text-zinc-500 uppercase">Start_Date</span>
                                    <span className="text-white font-mono">{settings.oilStartDate}</span>
                                </div>
                                <div className="flex justify-between text-[10px] font-bold">
                                    <span className="text-zinc-500 uppercase">Base_Vol</span>
                                    <span className="theme-text font-mono">{oilStatus.initial.toFixed(1)} L</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* KOMPAKT LOGGÖVERSIKT */}
                    <div className="space-y-3">
                        <SectionHeader title="Usage_Logs" sub="Mission_History" />
                        <div className="bg-white border border-zinc-200 rounded-sm overflow-hidden shadow-sm">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="bg-zinc-100 text-zinc-500 text-[8px] font-black uppercase tracking-widest border-b border-zinc-200">
                                        <th className="px-4 py-2 border-r border-zinc-200">Mission_Entity / Timestamp</th>
                                        <th className="px-4 py-2 border-r border-zinc-200 text-center">Unit</th>
                                        <th className="px-4 py-2 text-right">Debit</th>
                                    </tr>
                                </thead>
                                <tbody className="text-[10px] font-bold uppercase">
                                    {oilStatus.history.map((log, i) => (
                                        <tr key={i} className="border-b border-zinc-50 hover:bg-zinc-50 transition-colors">
                                            <td className="px-4 py-2 border-r border-zinc-50">
                                                <div className="flex items-center gap-2">
                                                    <span className="text-zinc-900">{log.kund}</span>
                                                    <span className="text-[8px] theme-text font-mono">[{log.datum}]</span>
                                                </div>
                                            </td>
                                            <td className="px-4 py-2 border-r border-zinc-50 text-center text-zinc-400 font-mono italic">{log.reg}</td>
                                            <td className="px-4 py-2 text-right theme-text font-black">-{log.mangd.toFixed(1)} L</td>
                                        </tr>
                                    ))}
                                    {oilStatus.history.length === 0 && (
                                        <tr>
                                            <td colSpan="3" className="p-10 text-center text-zinc-300 font-black italic tracking-widest text-[9px]">
                                                NO_CONSUMPTION_DETECTED_AFTER_{settings.oilStartDate.replace(/-/g, '_')}
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* FOOTER */}
                    <div className="pt-6 border-t border-zinc-100 flex justify-between items-center opacity-50">
                        <div className="text-[8px] font-black text-zinc-400 uppercase tracking-[0.3em]">
                            Oil_Logistic_OS_v10.1
                        </div>
                        <div className="flex items-center gap-2 text-[8px] font-black theme-text uppercase tracking-widest">
                            <div className="w-1 h-1 rounded-full theme-bg animate-pulse" />
                            Direct_Firebase_Link_Active
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
