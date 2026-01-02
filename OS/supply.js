// Hjälpkomponenter som matchar newJob.js exakt
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
    // KONFIGURATION
    const PURCHASE_DATE = '2025-11-22';
    const INITIAL_VOLUME = 20.0;

    // LOGIK: Beräkna baserat på strukturen i newJob.js
    const oilStatus = React.useMemo(() => {
        const usageHistory = [];
        
        const totalUsed = (jobs || []).reduce((acc, job) => {
            // Kontrollera datum (job.datum i newJob.js är "YYYY-MM-DDTHH:mm")
            if (!job.datum || job.datum < PURCHASE_DATE) return acc;

            // Kontrollera utgifter (i newJob.js: { namn: ex.desc, kostnad: ex.amount })
            const jobUtgifter = Array.isArray(job.utgifter) ? job.utgifter : [];
            const oilAmountInJob = jobUtgifter.reduce((sum, utgift) => {
                const isOil = utgift.namn?.toLowerCase().includes('olja');
                if (isOil) {
                    // Vi tolkar 'kostnad' som mängd (t.ex. 4.3) enligt dina krav
                    const val = String(utgift.kostnad).replace(',', '.');
                    return sum + (parseFloat(val) || 0);
                }
                return sum;
            }, 0);

            if (oilAmountInJob > 0) {
                usageHistory.push({
                    id: job.id,
                    kund: job.kundnamn || 'System_User',
                    datum: job.datum.split('T')[0],
                    mangd: oilAmountInJob
                });
            }

            return acc + oilAmountInJob;
        }, 0);

        return {
            current: INITIAL_VOLUME - totalUsed,
            used: totalUsed,
            history: usageHistory.reverse() // Senaste överst
        };
    }, [jobs]);

    return (
        <div className="max-w-3xl ml-0 animate-in fade-in slide-in-from-left-4 duration-500">
            <div className="bg-white border border-zinc-200 shadow-2xl rounded-sm overflow-hidden">
                
                {/* HEADER - Exakt som NewJobView */}
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
                    
                    {/* Rad 1: Status & Inköpsinfo */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <InputWrapper label="Current_Stock_Level" icon="activity">
                            <div className="bg-white p-4 rounded-sm border border-zinc-300 shadow-sm">
                                <div className="text-3xl font-black font-mono theme-text text-right">
                                    {oilStatus.current.toFixed(1)}
                                    <span className="ml-2 text-[10px] text-zinc-400">LITRE</span>
                                </div>
                                <div className="w-full bg-zinc-100 h-1 mt-2">
                                    <div 
                                        className="theme-bg h-full transition-all duration-1000" 
                                        style={{ width: `${Math.max(0, (oilStatus.current / INITIAL_VOLUME) * 100)}%` }}
                                    />
                                </div>
                            </div>
                        </InputWrapper>

                        <InputWrapper label="Deployment_Reference" icon="calendar">
                            <div className="bg-white p-4 rounded-sm border border-zinc-200 h-full flex flex-col justify-center">
                                <div className="text-xs font-black uppercase">{PURCHASE_DATE}</div>
                                <div className="text-[10px] text-zinc-400 font-bold uppercase tracking-tighter">Initial_Base: {INITIAL_VOLUME} L</div>
                            </div>
                        </InputWrapper>
                    </div>

                    {/* Rad 2: Historik - Samma stil som Internal_Mission_Logs */}
                    <div className="space-y-2">
                        <label className="text-[9px] font-black text-zinc-400 uppercase tracking-widest flex items-center gap-2 ml-1">
                            <SafeIcon name="file-text" size={10} className="theme-text" />
                            Internal_Consumption_Logs
                        </label>
                        <div className="bg-white border border-zinc-200 rounded-sm overflow-hidden">
                            <table className="w-full text-[10px] font-bold uppercase">
                                <thead className="bg-zinc-100/50 border-b border-zinc-200">
                                    <tr>
                                        <th className="p-3 text-left tracking-widest opacity-50">Client</th>
                                        <th className="p-3 text-left tracking-widest opacity-50">Date</th>
                                        <th className="p-3 text-right tracking-widest opacity-50">Amount</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-zinc-100">
                                    {oilStatus.history.map((log, i) => (
                                        <tr key={i} className="hover:bg-zinc-50/50 transition-colors">
                                            <td className="p-3">{log.kund}</td>
                                            <td className="p-3 font-mono text-zinc-400">{log.date}</td>
                                            <td className="p-3 text-right theme-text font-black">-{log.mangd.toFixed(1)} L</td>
                                        </tr>
                                    ))}
                                    {oilStatus.history.length === 0 && (
                                        <tr>
                                            <td colSpan="3" className="p-8 text-center text-zinc-300 italic tracking-widest">
                                                No_Active_Logs_After_{PURCHASE_DATE.replace(/-/g, '_')}
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* Footer - Industriell stil */}
                    <div className="pt-6 border-t border-zinc-100 flex justify-between items-center">
                        <div className="text-[8px] font-black text-zinc-300 uppercase tracking-[0.2em]">
                            System_ID: Oil_Track_V6 // Active
                        </div>
                        <div className="text-[8px] font-black theme-text uppercase tracking-widest animate-pulse">
                            ● Encrypted_Link_Stable
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
