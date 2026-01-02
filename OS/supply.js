// supply.js - VERSION: OIL_INTELLIGENCE_SYSTEM

const SafeIcon = ({ name, size = 14, className = "" }) => (
    <span className="inline-flex items-center justify-center shrink-0">
        <window.Icon name={name} size={size} className={className} />
    </span>
);

window.SupplyView = ({ allJobs = [] }) => {
    const [baseStock, setBaseStock] = React.useState(0);
    const [loading, setLoading] = React.useState(true);

    // Hämta lagerstatus från Firebase
    React.useEffect(() => {
        const unsub = window.db.collection("settings").doc("oil_inventory").onSnapshot(doc => {
            if (doc.exists) setBaseStock(doc.data().total || 0);
            setLoading(false);
        });
        return () => unsub();
    }, []);

    // Logik: Beräkna total förbrukning från alla jobb
    const totalUsage = React.useMemo(() => {
        return allJobs.reduce((acc, job) => {
            let jobUsage = 0;
            // Skanna utgifter efter "Motorolja" och extrahera litervolym (t.ex. "4l" eller "4.5l")
            job.utgifter?.forEach(ex => {
                if (ex.namn.toLowerCase().includes('motorolja')) {
                    const match = ex.namn.match(/(\d+(\.\d+)?)l/i);
                    if (match) jobUsage += parseFloat(match[1]);
                }
            });
            return acc + jobUsage;
        }, 0);
    }, [allJobs]);

    const currentStock = baseStock - totalUsage;
    const stockPercentage = Math.max(0, Math.min(100, (currentStock / baseStock) * 100));

    const updateStock = async (newVal) => {
        const amount = parseFloat(newVal);
        // Vi sparar det nya totalvärdet (t.ex. 205 + det som fanns innan)
        await window.db.collection("settings").doc("oil_inventory").set({ total: amount });
    };

    if (loading) return null;

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            {/* HEADER */}
            <div className="bg-zinc-950 p-6 flex flex-col md:flex-row md:items-center justify-between border-b-2 theme-border shadow-2xl gap-4">
                <div className="flex items-center gap-5">
                    <div className="w-12 h-12 theme-bg flex items-center justify-center rounded-sm shadow-lg">
                        <SafeIcon name="droplet" size={24} className="text-black" />
                    </div>
                    <div>
                        <span className="text-[10px] font-black theme-text uppercase tracking-[0.4em] block leading-none mb-1.5">
                            Supply_Chain_Intelligence
                        </span>
                        <h2 className="text-xl font-black text-white uppercase tracking-widest">
                            Oil_Reservoir_Monitor
                        </h2>
                    </div>
                </div>
                
                <button 
                    onClick={() => {
                        const input = prompt("Ange nytt totalt lager (L):", baseStock);
                        if (input) updateStock(input);
                    }}
                    className="bg-zinc-900 border border-zinc-800 text-white px-6 py-3 text-[10px] font-black uppercase tracking-widest hover:theme-border transition-all flex items-center gap-2"
                >
                    <SafeIcon name="refresh-cw" size={14} className="theme-text" /> Register_Supply_Drop
                </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* HUVUDMÄTARE */}
                <div className="lg:col-span-2 bg-zinc-900 p-8 border border-zinc-800 relative overflow-hidden">
                    <div className="relative z-10">
                        <div className="flex justify-between items-end mb-4">
                            <div>
                                <span className="text-[9px] font-black text-zinc-500 uppercase tracking-widest block mb-1">Current_Available_Payload</span>
                                <div className="text-6xl font-mono font-black text-white leading-none">
                                    {currentStock.toFixed(1)} <span className="text-xl text-zinc-600 italic">Liters</span>
                                </div>
                            </div>
                            <div className="text-right">
                                <span className="text-[9px] font-black text-zinc-500 uppercase block mb-1">Status</span>
                                <span className={`text-xs font-black uppercase tracking-widest ${stockPercentage < 20 ? 'text-red-500 animate-pulse' : 'theme-text'}`}>
                                    {stockPercentage < 20 ? 'CRITICAL_LOW' : 'STABLE_SUPPLY'}
                                </span>
                            </div>
                        </div>

                        {/* VISUELL RESERVOAR */}
                        <div className="w-full bg-zinc-950 h-4 border border-zinc-800 rounded-full overflow-hidden shadow-inner relative mt-8">
                            <div 
                                className="h-full theme-bg shadow-[0_0_20px_rgba(249,115,22,0.4)] transition-all duration-1000 ease-out" 
                                style={{ width: `${stockPercentage}%` }}
                            ></div>
                        </div>
                        <div className="flex justify-between mt-2 font-mono text-[8px] text-zinc-600 font-black uppercase">
                            <span>Empty</span>
                            <span>Full_Capacity: {baseStock}L</span>
                        </div>
                    </div>
                    <SafeIcon name="activity" size={200} className="absolute -right-20 -bottom-20 text-white opacity-[0.02] pointer-events-none" />
                </div>

                {/* SNABBSTATS */}
                <div className="space-y-4">
                    <div className="bg-white border border-zinc-200 p-6 shadow-sm">
                        <span className="text-[8px] font-black text-zinc-400 uppercase tracking-widest block mb-1">Total_Historical_Consumption</span>
                        <div className="text-2xl font-mono font-black text-zinc-900">{totalUsage.toFixed(1)} L</div>
                    </div>
                    <div className="bg-white border border-zinc-200 p-6 shadow-sm">
                        <span className="text-[8px] font-black text-zinc-400 uppercase tracking-widest block mb-1">Missions_Requiring_Oil</span>
                        <div className="text-2xl font-mono font-black text-zinc-900">
                            {allJobs.filter(j => j.utgifter?.some(ex => ex.namn.toLowerCase().includes('motorolja'))).length} Ops
                        </div>
                    </div>
                </div>
            </div>

            {/* FÖRBRUKNINGSLOGG */}
            <div className="bg-white border border-zinc-200 shadow-2xl overflow-hidden">
                <div className="bg-zinc-950 p-4 border-b border-zinc-800 flex justify-between items-center">
                    <h3 className="text-[10px] font-black text-white uppercase tracking-[0.2em] flex items-center gap-2">
                        <SafeIcon name="history" size={14} className="theme-text" /> Consumption_History_Buffer
                    </h3>
                </div>
                <div className="divide-y divide-zinc-100 max-h-[400px] overflow-auto">
                    {allJobs
                        .filter(j => j.utgifter?.some(ex => ex.namn.toLowerCase().includes('motorolja')))
                        .map(job => {
                            const oilEntry = job.utgifter.find(ex => ex.namn.toLowerCase().includes('motorolja'));
                            return (
                                <div key={job.id} className="p-4 flex items-center justify-between hover:bg-zinc-50 transition-all border-l-4 border-transparent hover:border-orange-500">
                                    <div className="flex items-center gap-6">
                                        <div className="font-mono text-[10px] text-zinc-400">{job.datum?.split('T')[0]}</div>
                                        <div>
                                            <div className="text-[11px] font-black uppercase text-zinc-950">{job.kundnamn}</div>
                                            <div className="text-[9px] font-mono text-zinc-500">{job.regnr}</div>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <div className="text-sm font-black theme-text font-mono">-{oilEntry.namn.match(/(\d+(\.\d+)?)l/i)?.[0].toUpperCase()}</div>
                                        <div className="text-[8px] text-zinc-400 uppercase font-black tracking-tighter italic">Sequence_Verified</div>
                                    </div>
                                </div>
                            );
                        })}
                </div>
            </div>
        </div>
    );
};
