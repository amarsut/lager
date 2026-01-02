const SafeIcon = ({ name, size = 14, className = "" }) => (
    <span className="inline-flex items-center justify-center shrink-0">
        <window.Icon name={name} size={size} className={className} />
    </span>
);

// Uppdaterad för att stödja färgbyte (vit text på mörk bakgrund)
const SectionHeader = ({ title, sub, light = false }) => (
    <div className="flex items-center gap-3 mb-4">
        <div className="h-4 w-1 theme-bg shadow-[0_0_8px_rgba(255,102,0,0.5)]" />
        <div>
            <h3 className={`text-[9px] font-black uppercase tracking-[0.2em] ${light ? 'text-white' : 'text-zinc-900'}`}>{title}</h3>
            {sub && <p className={`text-[7px] font-bold uppercase tracking-widest ${light ? 'text-zinc-500' : 'text-zinc-400'}`}>{sub}</p>}
        </div>
    </div>
);

window.SupplyView = ({ jobs = [], inventorySettings = {} }) => {
    // INTEGRATION: Hämtar data från Firebase-inställningarna
    // Om data saknas faller vi tillbaka på dina tidigare önskemål
    const PURCHASE_DATE = inventorySettings.oilStartDate || '2025-11-22';
    const INITIAL_VOLUME = parseFloat(inventorySettings.oilStartAmount) || 20.0;

    const oilStatus = React.useMemo(() => {
        const usageHistory = [];
        let totalUsed = 0;

        (jobs || []).forEach(job => {
            const jobDateRaw = job.datum || job.deploymentDate || job.createdAt;
            if (!jobDateRaw || jobDateRaw < PURCHASE_DATE || job.deleted) return;

            const jobUtgifter = Array.isArray(job.utgifter) ? job.utgifter : [];
            let oilInThisJob = 0;

            jobUtgifter.forEach(u => {
                const desc = (u.namn || "").toLowerCase();
                if (desc.includes('olja')) {
                    // Smart volym-detektor
                    const match = u.namn.match(/(\d+[.,]\d+|\d+)/);
                    let detectedVolume = 0;
                    if (match) {
                        detectedVolume = parseFloat(match[0].replace(',', '.'));
                    } 
                    const costVal = parseFloat(String(u.kostnad || "0").replace(',', '.'));
                    if (detectedVolume === 0 && costVal < 15) {
                        detectedVolume = costVal;
                    }
                    oilInThisJob += detectedVolume;
                }
            });

            if (oilInThisJob > 0) {
                totalUsed += oilInThisJob;
                usageHistory.push({
                    id: job.id,
                    kund: job.kundnamn || 'MISSION_ENTITY',
                    datum: jobDateRaw.split('T')[0],
                    mangd: oilInThisJob,
                    reg: job.regnr || 'N/A'
                });
            }
        });

        return {
            current: INITIAL_VOLUME - totalUsed,
            used: totalUsed,
            history: usageHistory.sort((a, b) => b.datum.localeCompare(a.datum))
        };
    }, [jobs, PURCHASE_DATE, INITIAL_VOLUME]);

    return (
        <div className="max-w-3xl ml-0 animate-in fade-in slide-in-from-left-4 duration-500 pb-10">
            <div className="bg-zinc-50 border border-zinc-200 rounded-sm overflow-hidden shadow-2xl">
                
                {/* HEADER */}
                <div className="bg-zinc-950 p-4 flex items-center justify-between border-b-2 theme-border">
                    <div className="flex items-center gap-4">
                        <div className="w-10 h-10 theme-bg flex items-center justify-center rounded-sm">
                            <SafeIcon name="droplet" size={18} className="text-black" />
                        </div>
                        <h2 className="text-xs font-black text-white uppercase tracking-[0.3em]">Resource_Nexus // Oil_Control</h2>
                    </div>
                </div>

                <div className="p-6 space-y-6">
                    
                    {/* STATUS-KORT */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-4 bg-zinc-100/50 rounded-sm border border-zinc-200/50">
                        <div className="p-4 bg-white border border-zinc-200 rounded-sm">
                            <SectionHeader title="Current_Storage" sub="Litre_Metric" />
                            <div className="text-4xl font-black font-mono tracking-tighter theme-text text-right">
                                {oilStatus.current.toFixed(1)} <span className="text-[10px] text-zinc-400">L</span>
                            </div>
                        </div>

                        {/* FIX 1: Vit text på mörk bakgrund */}
                        <div className="p-4 bg-zinc-950 rounded-sm border border-zinc-800">
                            <SectionHeader title="Deployment_Info" sub="Firebase_Sync" light={true} />
                            <div className="space-y-2 mt-2">
                                <div className="flex justify-between text-[10px] font-bold border-b border-zinc-800 pb-1">
                                    <span className="text-zinc-500">START_DATE</span>
                                    <span className="text-white font-mono">{PURCHASE_DATE}</span>
                                </div>
                                <div className="flex justify-between text-[10px] font-bold">
                                    <span className="text-zinc-500">BASE_VOL</span>
                                    <span className="theme-text font-mono">{INITIAL_VOLUME} L</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* FIX 2: Kompakt och tydlig tabell */}
                    <div className="space-y-3">
                        <SectionHeader title="Usage_Logs" sub="Mission_History" />
                        <div className="bg-white border border-zinc-200 rounded-sm overflow-hidden shadow-sm">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="bg-zinc-100 text-zinc-500 text-[8px] font-black uppercase tracking-widest border-b border-zinc-200">
                                        <th className="px-4 py-2 border-r border-zinc-200">Entity / Date</th>
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
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
