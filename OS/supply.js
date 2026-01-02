const SafeIcon = ({ name, size = 14, className = "" }) => (
    <span className="inline-flex items-center justify-center shrink-0">
        <window.Icon name={name} size={size} className={className} />
    </span>
);

const SectionHeader = ({ title, sub }) => (
    <div className="flex items-center gap-3 mb-6">
        <div className="h-5 w-1 theme-bg shadow-[0_0_10px_rgba(255,102,0,0.5)]" />
        <div>
            <h3 className="text-[10px] font-black text-zinc-900 uppercase tracking-[0.3em]">{title}</h3>
            {sub && <p className="text-[8px] text-zinc-400 font-bold uppercase tracking-widest">{sub}</p>}
        </div>
    </div>
);

window.SupplyView = ({ jobs = [] }) => {
    const PURCHASE_DATE = '2025-11-22';
    const INITIAL_VOLUME = 20.0;

    const oilStatus = React.useMemo(() => {
        const usageHistory = [];
        let totalUsed = 0;

        (jobs || []).forEach(job => {
            // Filtrera på datum (från newJob.js: job.datum)
            if (!job.datum || job.datum < PURCHASE_DATE) return;

            const jobUtgifter = Array.isArray(job.utgifter) ? job.utgifter : [];
            let oilInThisJob = 0;

            jobUtgifter.forEach(u => {
                // Sök efter "olja" i namnet (Del-rutan)
                if (u.namn && u.namn.toLowerCase().includes('olja')) {
                    // Tolka 'kostnad' (Kr-rutan) som mängd (decimaler som 4.3 hanteras)
                    const val = String(u.kostnad).replace(',', '.');
                    const amount = parseFloat(val) || 0;
                    oilInThisJob += amount;
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
            current: INITIAL_VOLUME - totalUsed,
            used: totalUsed,
            history: usageHistory.sort((a, b) => b.datum.localeCompare(a.datum))
        };
    }, [jobs]);

    return (
        <div className="max-w-3xl ml-0 animate-in fade-in slide-in-from-left-4 duration-700 pb-20">
            {/* HUVUDCONTAINER */}
            <div className="bg-zinc-50 border border-zinc-200 rounded-sm overflow-hidden shadow-2xl">
                
                {/* BLACK INDUSTRIAL HEADER (Från Dashboard/Kalender) */}
                <div className="bg-zinc-950 p-5 flex items-center justify-between border-b-2 theme-border relative overflow-hidden">
                    <div className="flex items-center gap-5 relative z-10">
                        <div className="w-12 h-12 theme-bg flex items-center justify-center rounded-sm shadow-[0_0_20px_rgba(255,102,0,0.3)]">
                            <SafeIcon name="droplet" size={24} className="text-black" />
                        </div>
                        <div>
                            <h2 className="text-sm font-black text-white uppercase tracking-[0.4em]">Resource_Nexus // Oil_Control</h2>
                            <p className="text-[9px] text-zinc-500 font-bold uppercase tracking-widest mt-1 italic">V.7.5 // Sequence_Active</p>
                        </div>
                    </div>
                    {/* Bakgrundsdekor (som i din dashboard) */}
                    <div className="absolute right-[-20px] top-[-10px] text-white/5 font-black text-6xl italic select-none pointer-events-none">OIL</div>
                </div>

                <div className="p-8 space-y-10">
                    
                    {/* LAGERSTATUS (Inspirerad av Kund-basens vyer) */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div className="relative p-6 bg-white border border-zinc-200 rounded-sm shadow-sm group hover:border-zinc-400 transition-all">
                            <SectionHeader title="Current_Storage" sub="Litre_Metric_System" />
                            <div className="flex items-baseline justify-end gap-3 mt-4">
                                <span className="text-5xl font-black font-mono tracking-tighter theme-text">
                                    {oilStatus.current.toFixed(1)}
                                </span>
                                <span className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">Litres</span>
                            </div>
                            {/* Industriell mätare */}
                            <div className="mt-6 flex gap-1 h-2">
                                {[...Array(20)].map((_, i) => (
                                    <div 
                                        key={i} 
                                        className={`flex-1 ${i / 20 < (oilStatus.current / INITIAL_VOLUME) ? 'theme-bg shadow-[0_0_5px_rgba(255,102,0,0.5)]' : 'bg-zinc-100'}`} 
                                    />
                                ))}
                            </div>
                        </div>

                        <div className="p-6 bg-zinc-950 text-white rounded-sm border border-zinc-800 flex flex-col justify-between">
                            <SectionHeader title="Deployment_Info" sub="Base_Register" />
                            <div className="space-y-4">
                                <div className="flex justify-between border-b border-zinc-800 pb-2">
                                    <span className="text-[9px] text-zinc-500 font-bold uppercase">Initial_Base</span>
                                    <span className="text-xs font-black font-mono">{INITIAL_VOLUME.toFixed(1)} L</span>
                                </div>
                                <div className="flex justify-between border-b border-zinc-800 pb-2">
                                    <span className="text-[9px] text-zinc-500 font-bold uppercase">Purchase_Date</span>
                                    <span className="text-xs font-black font-mono theme-text">{PURCHASE_DATE}</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* HISTORIK (Inspirerad av Dashboardens Mission Control) */}
                    <div className="space-y-4">
                        <SectionHeader title="Operational_Usage_Logs" sub="Mission_Specific_Deductions" />
                        
                        <div className="bg-white border border-zinc-200 rounded-sm overflow-hidden shadow-sm">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="bg-zinc-100/80 text-zinc-500 text-[8px] font-black uppercase tracking-[0.2em] border-b border-zinc-200">
                                        <th className="p-4 border-r border-zinc-200">Mission_Entity</th>
                                        <th className="p-4 border-r border-zinc-200 text-center">Unit_ID</th>
                                        <th className="p-4 text-right">Burn_Rate</th>
                                    </tr>
                                </thead>
                                <tbody className="text-[10px] font-bold uppercase">
                                    {oilStatus.history.map((log, i) => (
                                        <tr key={i} className="border-b border-zinc-100 hover:bg-zinc-50 transition-colors group">
                                            <td className="p-4 border-r border-zinc-100">
                                                <div className="flex flex-col">
                                                    <span className="text-zinc-900 tracking-tight">{log.kund}</span>
                                                    <span className="text-[8px] text-zinc-400 font-mono italic">{log.datum}</span>
                                                </div>
                                            </td>
                                            <td className="p-4 border-r border-zinc-100 text-center font-mono text-zinc-400 group-hover:text-zinc-900 transition-colors">
                                                {log.reg}
                                            </td>
                                            <td className="p-4 text-right">
                                                <div className="theme-text font-black text-xs">-{log.mangd.toFixed(1)} L</div>
                                            </td>
                                        </tr>
                                    ))}
                                    {oilStatus.history.length === 0 && (
                                        <tr>
                                            <td colSpan="3" className="p-16 text-center">
                                                <div className="flex flex-col items-center gap-3 opacity-20">
                                                    <SafeIcon name="slash" size={32} />
                                                    <span className="text-[10px] font-black uppercase tracking-[0.4em]">Data_Stream_Empty</span>
                                                </div>
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* FOOTER (Inspirerad av Operational Overview system bar) */}
                    <div className="pt-8 border-t border-zinc-200 flex justify-between items-center opacity-50">
                        <div className="flex gap-10">
                            <div>
                                <p className="text-[7px] font-black text-zinc-400 uppercase tracking-widest">System_Status</p>
                                <div className="flex items-center gap-2 mt-1">
                                    <div className="w-1.5 h-1.5 rounded-full theme-bg animate-pulse" />
                                    <span className="text-[9px] font-black text-zinc-900 uppercase">Synchronized</span>
                                </div>
                            </div>
                            <div>
                                <p className="text-[7px] font-black text-zinc-400 uppercase tracking-widest">Protocol</p>
                                <p className="text-[9px] font-black text-zinc-900 uppercase mt-1">Industrial_Logic_v7</p>
                            </div>
                        </div>
                        <div className="text-right">
                            <p className="text-[7px] font-black text-zinc-400 uppercase tracking-widest">ID_Reference</p>
                            <p className="text-[9px] font-black text-zinc-900 uppercase mt-1">#OS_OIL_026</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
