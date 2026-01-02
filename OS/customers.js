// customers.js

const SafeIcon = ({ name, size = 14, className = "" }) => (
    <span className="inline-flex items-center justify-center shrink-0">
        <window.Icon name={name} size={size} className={className} />
    </span>
);

window.CustomersView = ({ allJobs, setView }) => {
    const [searchQuery, setSearchQuery] = React.useState('');
    const [selectedCustomer, setSelectedCustomer] = React.useState(null);
    const [sortMode, setSortMode] = React.useState('revenue'); // 'revenue', 'count', 'recent'

    // --- AVANCERAD DATABEREDNING ---
    const customerData = React.useMemo(() => {
        const groups = allJobs.reduce((acc, job) => {
            const name = job.kundnamn || 'Oidentifierad Enhet';
            if (!acc[name]) {
                acc[name] = {
                    name: name,
                    totalSpent: 0,
                    missionCount: 0,
                    vehicles: new Set(),
                    lastSeen: job.datum,
                    jobs: [],
                    avgValue: 0,
                    rank: 'D',
                    topVehicle: ''
                };
            }
            const price = parseInt(job.kundpris) || 0;
            acc[name].totalSpent += price;
            acc[name].missionCount += 1;
            acc[name].jobs.push(job);
            if (job.regnr) acc[name].vehicles.add(job.regnr.toUpperCase());
            if (new Date(job.datum) > new Date(acc[name].lastSeen)) acc[name].lastSeen = job.datum;
            
            return acc;
        }, {});

        // Efterbearbetning och Rankning
        return Object.values(groups).map(c => {
            c.avgValue = c.totalSpent / c.missionCount;
            // Rankningslogik baserat på data
            if (c.totalSpent > 50000 || c.missionCount > 20) c.rank = 'S-TIER';
            else if (c.totalSpent > 20000) c.rank = 'A-TIER';
            else if (c.totalSpent > 5000) c.rank = 'B-TIER';
            else c.rank = 'C-TIER';

            c.topVehicle = Array.from(c.vehicles)[0] || 'N/A';
            return c;
        })
        .filter(c => 
            c.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
            Array.from(c.vehicles).some(v => v.toLowerCase().includes(searchQuery.toLowerCase()))
        )
        .sort((a, b) => {
            if (sortMode === 'revenue') return b.totalSpent - a.totalSpent;
            if (sortMode === 'count') return b.missionCount - a.missionCount;
            if (sortMode === 'recent') return new Date(b.lastSeen) - new Date(a.lastSeen);
            return 0;
        });
    }, [allJobs, searchQuery, sortMode]);

    // --- HJÄLPKOMPONENT: RANK BADGE ---
    const RankBadge = ({ rank }) => {
        const colors = {
            'S-TIER': 'bg-orange-500 text-black shadow-[0_0_10px_rgba(249,115,22,0.5)]',
            'A-TIER': 'bg-zinc-800 text-orange-400 border border-orange-500/30',
            'B-TIER': 'bg-zinc-100 text-zinc-800',
            'C-TIER': 'bg-zinc-50 text-zinc-400'
        };
        return (
            <span className={`text-[7px] font-black px-1.5 py-0.5 rounded-sm tracking-tighter ${colors[rank] || colors['C-TIER']}`}>
                {rank}
            </span>
        );
    };

    // --- VY: PROFIL (INTELLIGENCE HUB) ---
    if (selectedCustomer) {
        return (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                {/* Header Navigation */}
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
                    <div className="flex items-center gap-6">
                        <button onClick={() => setSelectedCustomer(null)} className="group bg-zinc-950 text-white p-4 hover:theme-bg hover:text-black transition-all shadow-xl">
                            <SafeIcon name="arrow-left" size={20} className="group-hover:-translate-x-1 transition-transform" />
                        </button>
                        <div>
                            <div className="flex items-center gap-3 mb-1">
                                <h2 className="text-2xl font-black text-zinc-900 uppercase tracking-tighter">{selectedCustomer.name}</h2>
                                <RankBadge rank={selectedCustomer.rank} />
                            </div>
                            <div className="flex items-center gap-4 text-[10px] font-mono text-zinc-400 uppercase tracking-widest">
                                <span>UID: {selectedCustomer.name.substring(0,8)}</span>
                                <span className="w-1 h-1 rounded-full bg-zinc-300"></span>
                                <span>Active_Assets: {selectedCustomer.vehicles.size}</span>
                            </div>
                        </div>
                    </div>
                    
                    <div className="flex gap-2">
                        <button 
                            onClick={() => { setView('NEW_JOB'); window.prefillName = selectedCustomer.name; }}
                            className="bg-zinc-100 hover:bg-zinc-200 text-zinc-900 px-6 py-3 text-[10px] font-black uppercase tracking-widest flex items-center gap-2 transition-all border-b-2 border-zinc-300"
                        >
                            <SafeIcon name="plus" size={14} /> Initialize_New_Mission
                        </button>
                    </div>
                </div>

                {/* Stats Dashboard */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                    {[
                        { label: 'Net_Revenue', val: selectedCustomer.totalSpent.toLocaleString(), unit: 'SEK', icon: 'trending-up', color: 'text-emerald-600' },
                        { label: 'Avg_Payload', val: Math.round(selectedCustomer.avgValue).toLocaleString(), unit: 'SEK', icon: 'zap', color: 'theme-text' },
                        { label: 'Total_Deployments', val: selectedCustomer.missionCount, unit: 'UNITS', icon: 'shield', color: 'text-zinc-900' },
                        { label: 'Last_Pulse', val: selectedCustomer.lastSeen?.split('T')[0] || 'N/A', unit: 'DATE', icon: 'clock', color: 'text-zinc-500' }
                    ].map((stat, i) => (
                        <div key={i} className="bg-white border border-zinc-200 p-5 rounded-sm shadow-sm hover:shadow-md transition-shadow relative group">
                            <div className="text-[8px] font-black text-zinc-400 uppercase tracking-[0.2em] mb-2">{stat.label}</div>
                            <div className={`text-xl font-mono font-black ${stat.color}`}>{stat.val} <span className="text-[10px] opacity-40">{stat.unit}</span></div>
                            <div className="absolute bottom-2 right-2 opacity-5 group-hover:opacity-20 transition-opacity">
                                <SafeIcon name={stat.icon} size={32} />
                            </div>
                        </div>
                    ))}
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Transaction Feed */}
                    <div className="lg:col-span-2 bg-white border border-zinc-200 shadow-xl">
                        <div className="bg-zinc-950 p-4 text-white flex items-center justify-between">
                            <div className="text-[10px] font-black uppercase tracking-widest flex items-center gap-2">
                                <SafeIcon name="activity" size={14} className="theme-text" /> Operational_Logs
                            </div>
                            <span className="text-[9px] font-mono text-zinc-500 uppercase">Buffer_Size: {selectedCustomer.jobs.length}</span>
                        </div>
                        <div className="divide-y divide-zinc-100 max-h-[500px] overflow-auto">
                            {selectedCustomer.jobs.sort((a,b) => b.datum.localeCompare(a.datum)).map((j, i) => (
                                <div key={i} className="p-5 hover:bg-zinc-50 transition-all flex items-center justify-between group">
                                    <div className="flex items-center gap-8">
                                        <div className="text-center">
                                            <div className="text-[14px] font-black text-zinc-900 leading-none">{j.datum?.split('-')[2]?.split('T')[0]}</div>
                                            <div className="text-[8px] font-black text-zinc-400 uppercase">{j.datum?.split('-')[1]}</div>
                                        </div>
                                        <div className="h-8 w-px bg-zinc-100"></div>
                                        <div>
                                            <div className="text-[12px] font-black uppercase text-zinc-900 group-hover:theme-text transition-colors">{j.paket || 'Standard_Service'}</div>
                                            <div className="flex items-center gap-2">
                                                <span className="text-[9px] font-mono font-bold bg-zinc-100 px-1.5 py-0.5 rounded-sm">{j.regnr}</span>
                                                <span className={`w-1.5 h-1.5 rounded-full ${j.status === 'KLAR' ? 'bg-emerald-500' : 'theme-bg'}`}></span>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="text-right flex items-center gap-6">
                                        <div className="font-mono font-black text-sm">{(parseInt(j.kundpris) || 0).toLocaleString()} <span className="text-[10px] text-zinc-400">kr</span></div>
                                        <button onClick={() => { setView('NEW_JOB'); window.editingJob = j; }} className="bg-zinc-100 p-2.5 rounded-sm hover:theme-bg hover:text-black transition-all">
                                            <SafeIcon name="external-link" size={14} />
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                    
                    {/* Asset Explorer & Analytics */}
                    <div className="space-y-6">
                        <div className="bg-zinc-950 p-6 shadow-2xl relative overflow-hidden">
                            <div className="absolute -right-4 -top-4 opacity-10 rotate-12">
                                <SafeIcon name="pie-chart" size={120} className="text-white" />
                            </div>
                            <div className="relative z-10">
                                <div className="text-[10px] font-black text-orange-400 uppercase tracking-widest mb-6">Spending_Volume</div>
                                <div className="space-y-4">
                                    {/* Visual spending bar */}
                                    <div className="w-full bg-zinc-800 h-1.5 rounded-full overflow-hidden">
                                        <div className="theme-bg h-full shadow-[0_0_10px_#f97316]" style={{ width: `${Math.min((selectedCustomer.totalSpent / 50000) * 100, 100)}%` }}></div>
                                    </div>
                                    <div className="flex justify-between text-[9px] font-mono text-zinc-500 uppercase">
                                        <span>Rank: {selectedCustomer.rank}</span>
                                        <span>Limit: 50.0k</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="bg-white border border-zinc-200 p-6">
                            <div className="text-[10px] font-black text-zinc-400 uppercase tracking-widest mb-6 flex items-center justify-between">
                                <div className="flex items-center gap-2"><SafeIcon name="cpu" size={12} /> Registered_Assets</div>
                                <span className="bg-zinc-100 px-2 py-0.5 text-zinc-900 rounded-full">{selectedCustomer.vehicles.size}</span>
                            </div>
                            <div className="grid grid-cols-1 gap-2">
                                {Array.from(selectedCustomer.vehicles).map(v => (
                                    <div key={v} className="group flex items-center justify-between p-3 bg-zinc-50 border-l-2 border-transparent hover:border-orange-500 hover:bg-white transition-all cursor-default">
                                        <span className="text-xs font-mono font-black text-zinc-800">{v}</span>
                                        <SafeIcon name="chevron-right" size={12} className="text-zinc-300 group-hover:theme-text" />
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    // --- VY: MAIN GRID (SCANNER INTERFACE) ---
    return (
        <div className="space-y-6 animate-in fade-in duration-500 pb-20">
            {/* Intel Header */}
            <div className="bg-zinc-950 p-6 flex flex-col md:flex-row md:items-center justify-between border-b-2 theme-border shadow-2xl gap-4">
                <div className="flex items-center gap-5">
                    <div className="w-12 h-12 theme-bg flex items-center justify-center rounded-sm shadow-lg rotate-3 group-hover:rotate-0 transition-transform">
                        <SafeIcon name="users" size={24} className="text-black" />
                    </div>
                    <div>
                        <span className="text-[10px] font-black theme-text uppercase tracking-[0.4em] block leading-none mb-1.5">
                            Entity_Database_Nexus
                        </span>
                        <h2 className="text-xl font-black text-white uppercase tracking-widest flex items-center gap-3">
                            Intelligence_Briefing <span className="text-[10px] bg-zinc-800 px-2 py-1 text-zinc-500 font-mono">COUNT:{customerData.length}</span>
                        </h2>
                    </div>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                    {/* Sort Controls */}
                    <div className="flex bg-zinc-900 border border-zinc-800 p-1 rounded-sm">
                        {[
                            { id: 'revenue', icon: 'dollar-sign' },
                            { id: 'count', icon: 'hash' },
                            { id: 'recent', icon: 'clock' }
                        ].map(m => (
                            <button 
                                key={m.id}
                                onClick={() => setSortMode(m.id)}
                                className={`p-2 transition-all ${sortMode === m.id ? 'theme-bg text-black shadow-inner' : 'text-zinc-600 hover:text-white'}`}
                            >
                                <SafeIcon name={m.icon} size={14} />
                            </button>
                        ))}
                    </div>

                    <div className="relative group">
                        <input 
                            type="text" 
                            placeholder="SEARCH_ENTITY_OR_ASSET..." 
                            className="bg-zinc-900 border border-zinc-800 focus:theme-border p-3 pl-10 text-[10px] font-bold text-white outline-none w-full md:w-72 transition-all uppercase tracking-widest placeholder:text-zinc-700"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                        <SafeIcon name="search" size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-600 group-focus-within:theme-text transition-colors" />
                    </div>
                </div>
            </div>

            {/* Entity Matrix (Cards) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-6 gap-4">
                {customerData.map((customer, i) => (
                    <div 
                        key={i} 
                        onClick={() => setSelectedCustomer(customer)}
                        className="group bg-white border border-zinc-200 hover:border-zinc-950 hover:shadow-2xl transition-all cursor-pointer relative overflow-hidden flex flex-col h-[180px] hover:-translate-y-1"
                    >
                        {/* Background Rank Indicator */}
                        <div className="absolute -bottom-6 -right-4 text-[80px] font-black text-zinc-50 group-hover:text-orange-50 transition-colors pointer-events-none italic select-none">
                            {customer.rank[0]}
                        </div>

                        <div className="p-5 flex-1 relative z-10">
                            <div className="flex justify-between items-start mb-3">
                                <RankBadge rank={customer.rank} />
                                <div className="text-[10px] font-mono font-black text-zinc-300">#{i + 1}</div>
                            </div>

                            <h3 className="text-[14px] font-black uppercase leading-tight mb-4 group-hover:theme-text transition-colors truncate">
                                {customer.name}
                            </h3>

                            <div className="grid grid-cols-2 border-t border-zinc-50 pt-3 gap-2">
                                <div>
                                    <div className="text-[7px] font-black text-zinc-400 uppercase">Revenue_Sum</div>
                                    <div className="text-xs font-mono font-black italic">{(customer.totalSpent / 1000).toFixed(1)}k</div>
                                </div>
                                <div className="text-right">
                                    <div className="text-[7px] font-black text-zinc-400 uppercase">Ops_Count</div>
                                    <div className="text-xs font-mono font-black">{customer.missionCount}x</div>
                                </div>
                            </div>
                        </div>

                        <div className="mt-auto bg-zinc-950 p-3 flex items-center justify-between border-t border-zinc-900">
                            <div className="flex items-center gap-2">
                                <div className={`w-1.5 h-1.5 rounded-full ${new Date() - new Date(customer.lastSeen) < 1209600000 ? 'bg-emerald-500 animate-pulse' : 'bg-zinc-700'}`}></div>
                                <span className="text-[9px] font-mono font-bold text-zinc-400 uppercase truncate max-w-[80px]">
                                    {customer.topVehicle}
                                </span>
                            </div>
                            <SafeIcon name="arrow-right" size={12} className="text-zinc-600 group-hover:theme-text transition-all group-hover:translate-x-1" />
                        </div>
                    </div>
                ))}

                {/* Empty State */}
                {customerData.length === 0 && (
                    <div className="col-span-full py-20 text-center bg-zinc-50 border-2 border-dashed border-zinc-200 rounded-sm">
                        <SafeIcon name="database-zap" size={48} className="text-zinc-200 mx-auto mb-4" />
                        <h4 className="text-zinc-400 font-black uppercase tracking-widest">No_Matches_In_Nexus</h4>
                    </div>
                )}
            </div>
        </div>
    );
};
