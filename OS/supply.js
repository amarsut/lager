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
    // STARTINSTÄLLNINGAR
    const PURCHASE_DATE = '2025-11-22';
    const INITIAL_VOLUME = 20.0;

    const oilStatus = React.useMemo(() => {
        const usageHistory = [];
        let totalUsed = 0;

        // Loopa igenom alla jobb i systemet
        (jobs || []).forEach(job => {
            // Säkerställ att vi har ett datum och att det är efter inköpet
            // Vi kollar både 'datum' (från newJob.js) och 'createdAt'
            const jobDateRaw = job.datum || job.createdAt;
            if (!jobDateRaw || jobDateRaw < PURCHASE_DATE) return;

            const jobUtgifter = Array.isArray(job.utgifter) ? job.utgifter : [];
            let oilInThisJob = 0;

            jobUtgifter.forEach(u => {
                // FÖRBÄTTRAD LOGIK: Kolla om texten innehåller "olja" (oavsett vad mer som står där)
                const desc = (u.namn || "").toLowerCase();
                if (desc.includes('olja')) {
                    // Ta värdet från rutan (kostnad) och tolka som liter (t.ex. 4.3)
                    const val = String(u.kostnad || "").replace(',', '.');
                    const parsedAmount = parseFloat(val) || 0;
                    oilInThisJob += parsedAmount;
                }
            });

            if (oilInThisJob > 0) {
                totalUsed += oilInThisJob;
                usageHistory.push({
                    id: job.id || Math.random(),
                    kund: job.kundnamn || 'INTERNAL_MISSION',
                    reg: job.regnr || '---',
                    date: jobDateRaw.split('T')[0],
                    amount: oilInThisJob
                });
            }
        });

        return {
            current: INITIAL_VOLUME - totalUsed,
            used: totalUsed,
            history: usageHistory.sort((a, b) => b.date.localeCompare(a.date))
        };
    }, [jobs]);

    return (
        <div className="max-w-3xl ml-0 animate-in fade-in slide-in-from-left-4 duration-500 pb-20">
            <div className="bg-white border border-zinc-200 shadow-2xl rounded-sm overflow-hidden">
                
                {/* HEADER - MATCHAR NEWJOB.JS 1:1 */}
                <div className="bg-zinc-950 p-4 flex items-center justify-between border-b-2 theme-border">
                    <div className="flex items-center gap-4">
                        <div className="w-10 h-10 theme-bg flex items-center justify-center rounded-sm">
                            <SafeIcon name="droplet" size={20} className="text-black" />
                        </div>
                        <div>
                            <h2 className="text-sm font-black text-white uppercase tracking-widest">
                                Resource_Logistics // Oil_Supply
                            </h2>
                        </div>
                    </div>
                </div>

                <div className="p-6 lg:p-8 space-y-6 bg-zinc-50/20">
                    
                    {/* STATUS-RAD (Samma grå box-stil som i din image_cf6e4f.png) */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-4 bg-zinc-100/50 rounded-sm border border-zinc-200/50">
                        <InputWrapper label="Current_Stock_SEK_L" icon="activity">
                            <div className="bg-white p-3 rounded-sm border border-zinc-300 shadow-sm flex items-center justify-between">
                                <div className="text-2xl font-black font-mono theme-text">
                                    {oilStatus.current.toFixed(1)}
                                </div>
                                <span className="text-[8px] font-black text-zinc-400 uppercase">Litres_Remaining</span>
                            </div>
                            {/* Progress bar under siffran */}
                            <div className="w-full bg-zinc-200 h-1 mt-1 rounded-full overflow-hidden">
                                <div 
                                    className="theme-bg h-full transition-all duration-700" 
                                    style={{ width: `${Math.max(0, (oilStatus.current / INITIAL_VOLUME) * 100)}%` }}
                                />
                            </div>
                        </InputWrapper>

                        <InputWrapper label="Deployment_Reference" icon="calendar">
                            <div className="bg-white p-3 rounded-sm border border-zinc-300 shadow-sm flex flex-col justify-center">
                                <div className="text-xs font-black uppercase tracking-tight">{PURCHASE_DATE}</div>
                                <div className="text-[8px] font-black text-zinc-400 uppercase">Batch_Size: {INITIAL_VOLUME}L</div>
                            </div>
                        </InputWrapper>
                    </div>

                    {/* LOGG - MATCHAR INTERNAL_MISSION_LOGS */}
                    <InputWrapper label="Internal_Consumption_Logs" icon="file-text">
                        <div className="bg-white border border-zinc-200 rounded-sm overflow-hidden">
                            <table className="w-full border-collapse">
                                <thead>
                                    <tr className="bg-zinc-950 text-white text-[8px] font-black uppercase tracking-widest">
                                        <th className="p-3 text-left border-r border-zinc-800">Mission_Client</th>
                                        <th className="p-3 text-left border-r border-zinc-800">Date</th>
                                        <th className="p-3 text-right">Debit_Vol</th>
                                    </tr>
                                </thead>
                                <tbody className="text-[10px] font-bold uppercase tracking-tight">
                                    {oilStatus.history.map((log, i) => (
                                        <tr key={i} className="border-b border-zinc-100 hover:bg-zinc-50 transition-colors">
                                            <td className="p-3 border-r border-zinc-50">{log.kund}</td>
                                            <td className="p-3 border-r border-zinc-50 text-zinc-400 font-mono">{log.date}</td>
                                            <td className="p-3 text-right theme-text font-black">-{log.amount.toFixed(1)} L</td>
                                        </tr>
                                    ))}
                                    {oilStatus.history.length === 0 && (
                                        <tr>
                                            <td colSpan="3" className="p-10 text-center text-zinc-300 font-black italic tracking-widest text-[9px]">
                                                NO_ACTIVE_LOGS_FOUND_FOR_PERIOD
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </InputWrapper>

                    {/* FOOTER */}
                    <div className="pt-4 border-t border-zinc-100 flex justify-between">
                        <div className="text-[8px] font-black text-zinc-300 uppercase tracking-[0.2em]">Oil_Tracker_OS_v7</div>
                        <div className="text-[8px] font-black theme-text uppercase tracking-widest flex items-center gap-2">
                            <div className="w-1 h-1 rounded-full theme-bg animate-pulse" />
                            Encrypted_Connection_Stable
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
