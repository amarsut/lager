// Hjälpkomponenter som matchar ditt system exakt
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

        (jobs || []).forEach(job => {
            // Mappar mot job.datum formatet "YYYY-MM-DDTHH:mm" i newJob.js
            if (!job.datum || job.datum < PURCHASE_DATE) return;

            const jobUtgifter = Array.isArray(job.utgifter) ? job.utgifter : [];
            let oilInThisJob = 0;

            jobUtgifter.forEach(u => {
                // Letar efter "olja" i namnfältet (beskrivningen)
                if (u.namn && u.namn.toLowerCase().includes('olja')) {
                    // Vi tar värdet från kostnadsfältet och tolkar som liter
                    const val = String(u.kostnad).replace(',', '.');
                    oilInThisJob += (parseFloat(val) || 0);
                }
            });

            if (oilInThisJob > 0) {
                totalUsed += oilInThisJob;
                usageHistory.push({
                    id: job.id,
                    kund: job.kundnamn || 'SYSTEM_MISSION',
                    reg: job.regnr || '---',
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
        <div className="max-w-3xl ml-0 animate-in fade-in slide-in-from-left-4 duration-500">
            <div className="bg-white border border-zinc-200 shadow-2xl rounded-sm overflow-hidden">
                
                {/* HEADER - Identisk med NewJobView */}
                <div className="bg-zinc-950 p-4 flex items-center justify-between border-b-2 theme-border">
                    <div className="flex items-center gap-4">
                        <div className="w-10 h-10 theme-bg flex items-center justify-center rounded-sm">
                            <SafeIcon name="droplet" size={20} className="text-black" />
                        </div>
                        <div>
                            <h2 className="text-sm font-black text-white uppercase tracking-widest">
                                Resource_Logistics // Motor_Oil
                            </h2>
                        </div>
                    </div>
                </div>

                <div className="p-6 lg:p-8 space-y-6 bg-zinc-50/20">
                    
                    {/* Rad 1: Status (Samma layout som Pris/Utgifter i din bild) */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-4 bg-zinc-100/50 rounded-sm border border-zinc-200/50">
                        <InputWrapper label="Current_Stock_Level" icon="activity">
                            <div className="bg-white p-3 rounded-sm border border-zinc-300 shadow-sm flex items-center">
                                <span className="w-full text-zinc-900 text-2xl font-black font-mono outline-none text-right theme-text">
                                    {oilStatus.current.toFixed(1)}
                                </span>
                                <span className="ml-2 text-[8px] font-black text-zinc-400">LITRE</span>
                            </div>
                            <div className="w-full bg-zinc-200 h-1 mt-1">
                                <div className="theme-bg h-full" style={{ width: `${(oilStatus.current / INITIAL_VOLUME) * 100}%` }} />
                            </div>
                        </InputWrapper>

                        <InputWrapper label="Deployment_Reference" icon="calendar">
                            <div className="bg-white p-3 rounded-sm border border-zinc-300 shadow-sm h-[54px] flex flex-col justify-center">
                                <div className="text-xs font-black uppercase tracking-widest">{PURCHASE_DATE}</div>
                                <div className="text-[8px] font-black text-zinc-400 uppercase">Initial_Base: {INITIAL_VOLUME} L</div>
                            </div>
                        </InputWrapper>
                    </div>

                    {/* Rad 2: Logg (Matchar tabellstilen i din Dashboard) */}
                    <div className="space-y-2">
                        <label className="text-[9px] font-black text-zinc-400 uppercase tracking-widest flex items-center gap-2 ml-1">
                            <SafeIcon name="file-text" size={10} className="theme-text" />
                            Internal_Mission_Logs
                        </label>
                        <div className="bg-white border border-zinc-200 rounded-sm overflow-hidden">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="bg-zinc-950 text-white text-[8px] font-black uppercase tracking-widest">
                                        <th className="p-3 border-r border-zinc-800">Client</th>
                                        <th className="p-3 border-r border-zinc-800">Date</th>
                                        <th className="p-3 text-right">Debit_Vol</th>
                                    </tr>
                                </thead>
                                <tbody className="text-[10px] font-bold uppercase">
                                    {oilStatus.history.map((log, i) => (
                                        <tr key={i} className="border-b border-zinc-100 hover:bg-zinc-50 transition-colors">
                                            <td className="p-3 border-r border-zinc-50">{log.kund}</td>
                                            <td className="p-3 border-r border-zinc-50 text-zinc-400 font-mono">{log.datum}</td>
                                            <td className="p-3 text-right theme-text font-black">-{log.mangd.toFixed(1)} L</td>
                                        </tr>
                                    ))}
                                    {oilStatus.history.length === 0 && (
                                        <tr>
                                            <td colSpan="3" className="p-10 text-center text-zinc-300 font-black italic tracking-widest">
                                                No_Consumption_Detected_After_{PURCHASE_DATE.replace(/-/g, '_')}
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* Footer - Samma stil som Confirm_Push knappen */}
                    <div className="pt-6 border-t border-zinc-100 flex justify-between items-center">
                        <div className="text-[8px] font-black text-zinc-300 uppercase tracking-[0.3em]">
                            System_ID: OIL_TRACK_V7 // ACTIVE
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="w-1.5 h-1.5 rounded-full theme-bg animate-pulse"></div>
                            <span className="text-[8px] font-black theme-text uppercase tracking-widest">Encrypted_Link_Stable</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
