const SafeIcon = ({ name, size = 14, className = "" }) => (
    <span className="inline-flex items-center justify-center shrink-0">
        <window.Icon name={name} size={size} className={className} />
    </span>
);

const InputWrapper = ({ label, icon, children }) => (
    <div className="space-y-1">
        <label className="text-[9px] font-black text-zinc-400 uppercase tracking-widest flex items-center gap-2 ml-1">
            <SafeIcon name={icon} size={10} className="theme-text" />
            {label}
        </label>
        {children}
    </div>
);

window.SupplyView = ({ jobs = [] }) => {
    const PURCHASE_DATE = '2025-11-22';
    const INITIAL_VOLUME = 20.0;

    const oilStatus = React.useMemo(() => {
        const usageHistory = [];
        let totalUsed = 0;

        // Vi loopar igenom jobs och matchar exakt mot strukturen i newJob.js
        (jobs || []).forEach(job => {
            // 1. Datum-matchning (newJob använder fältet 'datum')
            if (!job.datum || job.datum < PURCHASE_DATE) return;

            // 2. Utgifts-matchning (newJob sparar som 'utgifter' array med 'namn' och 'kostnad')
            const jobUtgifter = Array.isArray(job.utgifter) ? job.utgifter : [];
            let oilInThisJob = 0;

            jobUtgifter.forEach(u => {
                // Vi kollar om namnet innehåller "olja"
                if (u.namn && u.namn.toLowerCase().includes('olja')) {
                    const amount = parseFloat(String(u.kostnad).replace(',', '.')) || 0;
                    oilInThisJob += amount;
                }
            });

            if (oilInThisJob > 0) {
                totalUsed += oilInThisJob;
                usageHistory.push({
                    id: job.id || Math.random(),
                    kund: job.kundnamn || 'Oidentifierad_Mission',
                    reg: job.regnr || 'N/A',
                    datum: job.datum.split('T')[0],
                    mangd: oilInThisJob
                });
            }
        });

        return {
            current: INITIAL_VOLUME - totalUsed,
            used: totalUsed,
            history: usageHistory.sort((a, b) => b.datum.localeCompare(a.datum))
        };
    }, [jobs]);

    return (
        <div className="max-w-3xl ml-0 animate-in fade-in slide-in-from-left-4 duration-500 pb-10">
            <div className="bg-white border border-zinc-200 shadow-2xl rounded-sm overflow-hidden">
                
                {/* HEADER - EXAKT SOM NEWJOB.JS */}
                <div className="bg-zinc-950 p-4 flex items-center justify-between border-b-2 theme-border">
                    <div className="flex items-center gap-4">
                        <div className="w-10 h-10 theme-bg flex items-center justify-center rounded-sm">
                            <SafeIcon name="droplet" size={20} className="text-black" />
                        </div>
                        <div>
                            <h2 className="text-sm font-black text-white uppercase tracking-widest">
                                Resource_Logistics // Motor_Oil_Control
                            </h2>
                        </div>
                    </div>
                </div>

                <div className="p-6 lg:p-8 space-y-8 bg-zinc-50/20">
                    
                    {/* ÖVRE SEKTION: LAGERSTATUS (Industriell Grå Box) */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 p-6 bg-zinc-100/50 rounded-sm border border-zinc-200/50">
                        <InputWrapper label="Current_Stock" icon="activity">
                            <div className="bg-white p-3 border border-zinc-300 shadow-sm">
                                <span className="text-2xl font-black font-mono theme-text tracking-tighter">
                                    {oilStatus.current.toFixed(1)}
                                </span>
                                <span className="ml-2 text-[9px] font-bold text-zinc-400">LITRES</span>
                                <div className="w-full bg-zinc-100 h-1.5 mt-2 rounded-full overflow-hidden">
                                    <div 
                                        className="theme-bg h-full transition-all duration-1000" 
                                        style={{ width: `${Math.max(0, (oilStatus.current / INITIAL_VOLUME) * 100)}%` }}
                                    />
                                </div>
                            </div>
                        </InputWrapper>

                        <InputWrapper label="Total_Burned" icon="trending-down">
                            <div className="bg-white p-3 border border-zinc-300 shadow-sm">
                                <span className="text-2xl font-black font-mono text-zinc-800 tracking-tighter">
                                    {oilStatus.used.toFixed(1)}
                                </span>
                                <span className="ml-2 text-[9px] font-bold text-zinc-400">USED</span>
                            </div>
                        </InputWrapper>

                        <InputWrapper label="Inbound_Reference" icon="calendar">
                            <div className="bg-white p-3 border border-zinc-200 shadow-sm flex flex-col justify-center h-[58px]">
                                <div className="text-[11px] font-black">{PURCHASE_DATE}</div>
                                <div className="text-[8px] font-bold text-zinc-400 uppercase tracking-tighter">Batch_Size: {INITIAL_VOLUME}L</div>
                            </div>
                        </InputWrapper>
                    </div>

                    {/* NEDRE SEKTION: INTERNAL MISSION LOGS */}
                    <div className="space-y-3">
                        <label className="text-[9px] font-black text-zinc-400 uppercase tracking-widest flex items-center gap-2 ml-1">
                            <SafeIcon name="file-text" size={10} className="theme-text" />
                            Consumption_History_Logs
                        </label>
                        
                        <div className="bg-white border border-zinc-200 rounded-sm overflow-hidden">
                            <div className="overflow-x-auto">
                                <table className="w-full text-left border-collapse">
                                    <thead>
                                        <tr className="bg-zinc-950 text-white text-[9px] font-black uppercase tracking-[0.2em]">
                                            <th className="p-3 border-r border-zinc-800">Mission_Client</th>
                                            <th className="p-3 border-r border-zinc-800">Reg_Unit</th>
                                            <th className="p-3 border-r border-zinc-800">Timestamp</th>
                                            <th className="p-3 text-right">Debit_Vol</th>
                                        </tr>
                                    </thead>
                                    <tbody className="text-[10px] font-bold uppercase tracking-tight">
                                        {oilStatus.history.map((log, i) => (
                                            <tr key={i} className="border-b border-zinc-100 hover:bg-zinc-50 transition-colors">
                                                <td className="p-3 border-r border-zinc-50">{log.kund}</td>
                                                <td className="p-3 border-r border-zinc-50 font-mono text-zinc-500">{log.reg}</td>
                                                <td className="p-3 border-r border-zinc-50 text-zinc-400">{log.datum}</td>
                                                <td className="p-3 text-right font-mono theme-text font-black">-{log.mangd.toFixed(1)} L</td>
                                            </tr>
                                        ))}
                                        {oilStatus.history.length === 0 && (
                                            <tr>
                                                <td colSpan="4" className="p-10 text-center text-zinc-300 font-black italic tracking-widest text-[9px]">
                                                    DATA_QUERY_EMPTY // NO_CONSUMPTION_DETECTED_AFTER_{PURCHASE_DATE.replace(/-/g, '_')}
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>

                    {/* FOOTER */}
                    <div className="pt-6 border-t border-zinc-100 flex justify-between items-center">
                        <div className="text-[8px] font-black text-zinc-300 uppercase tracking-[0.3em]">
                            Oil_Logistic_Core_V6.2
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="w-1.5 h-1.5 rounded-full theme-bg animate-pulse"></div>
                            <span className="text-[8px] font-black text-zinc-400 uppercase tracking-widest">System_Stable</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
