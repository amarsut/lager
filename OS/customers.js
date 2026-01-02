// customers.js - VERSION: TACTICAL_MOBILE_OPTIMIZED

const SafeIcon = ({ name, size = 14, className = "" }) => (
    <span className="inline-flex items-center justify-center shrink-0">
        <window.Icon name={name} size={size} className={className} />
    </span>
);

window.CustomersView = ({ allJobs, setView, setEditingJob }) => {
    const [searchQuery, setSearchQuery] = React.useState('');
    const [selectedCustomer, setSelectedCustomer] = React.useState(null);
    const [sortMode, setSortMode] = React.useState('revenue'); 
    const [logSearch, setLogSearch] = React.useState('');

    React.useEffect(() => {
        if (window.lucide) {
            window.lucide.createIcons();
        }
    }, [selectedCustomer, logSearch, searchQuery]);

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
                    topVehicle: '',
                    packageStats: {}
                };
            }
            const price = parseInt(job.kundpris) || 0;
            acc[name].totalSpent += price;
            acc[name].missionCount += 1;
            acc[name].jobs.push(job);
            
            const pkg = job.paket || 'Standard';
            acc[name].packageStats[pkg] = (acc[name].packageStats[pkg] || 0) + 1;

            if (job.regnr) acc[name].vehicles.add(job.regnr.toUpperCase());
            if (new Date(job.datum) > new Date(acc[name].lastSeen)) acc[name].lastSeen = job.datum;
            
            return acc;
        }, {});

        return Object.values(groups).map(c => {
            c.avgValue = c.totalSpent / c.missionCount;
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

    const RankBadge = ({ rank }) => {
        const colors = {
            'S-TIER': 'bg-orange-500 text-black shadow-[0_0_10px_rgba(249,115,22,0.5)]',
            'A-TIER': 'bg-zinc-800 text-orange-400 border border-orange-500/30',
            'B-TIER': 'bg-zinc-100 text-zinc-800',
            'C-TIER': 'bg-zinc-50 text-zinc-400'
        };
        return (
            <span className={`text-[7px] font-black px-1.5 py-0.5 rounded-sm tracking-tighter shrink-0 ${colors[rank] || colors['C-TIER']}`}>
                {rank}
            </span>
        );
    };

    // --- 3. VY: PROFIL (FIXAD HEADER) ---
    if (selectedCustomer) {
        const loyaltyScore = Math.min(100, (selectedCustomer.missionCount * 5));
        const daysSinceLast = Math.floor((new Date() - new Date(selectedCustomer.lastSeen)) / (1000 * 60 * 60 * 24));
        
        const filteredLogs = selectedCustomer.jobs
            .filter(j => 
                (j.regnr || '').toLowerCase().includes(logSearch.toLowerCase()) || 
                (j.kommentar || '').toLowerCase().includes(logSearch.toLowerCase()) ||
                (j.paket || '').toLowerCase().includes(logSearch.toLowerCase())
            )
            .sort((a,b) => b.datum.localeCompare(a.datum));

        return (
            <div className="animate-in fade-in slide-in-from-right-8 duration-500 pb-20 px-4 md:px-0">
                {/* RESPONSIV PROFIL-HEADER */}
                <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 bg-zinc-950 p-4 border-l-4 theme-border shadow-2xl relative overflow-hidden gap-6">
                    <div className="absolute top-0 right-0 p-8 opacity-5 pointer-events-none">
                        <SafeIcon name="shield-check" size={100} />
                    </div>

                    <div className="flex items-center gap-4 md:gap-6 relative z-10">
                        <button onClick={() => setSelectedCustomer(null)} className="group bg-zinc-900 border border-zinc-800 text-zinc-400 p-3 md:p-4 hover:theme-bg hover:text-black transition-all shrink-0">
                            <SafeIcon name="arrow-left" size={20} className="group-hover:-translate-x-1 transition-transform" />
                            <span className="text-[10px] font-black uppercase tracking-[0.3em] ml-3 hidden md:inline">Return_to_Nexus</span>
                        </button>
                        
                        <div className="min-w-0">
                            <div className="flex flex-wrap items-center gap-2 md:gap-4 mb-2">
                                <h2 className="text-xl md:text-2xl font-black text-white uppercase tracking-tighter leading-none truncate">{selectedCustomer.name}</h2>
                                <div className="flex items-center gap-2">
                                    <RankBadge rank={selectedCustomer.rank} />
                                    <span className="text-[7px] md:text-[8px] font-bold bg-zinc-800 text-zinc-500 px-1.5 py-0.5 rounded-sm border border-zinc-700 whitespace-nowrap">UID: {selectedCustomer.name.substring(0,6).toUpperCase()}</span>
                                </div>
                            </div>
                            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[9px] font-mono font-black text-zinc-500 uppercase tracking-widest">
                                <span className="flex items-center gap-2">
                                    <div className={`w-1.5 h-1.5 rounded-full ${daysSinceLast < 45 ? 'bg-emerald-500 shadow-[0_0_8px_#10b981]' : 'bg-red-500'}`}></div>
                                    {daysSinceLast < 45 ? 'SIGNAL_ACTIVE' : 'SIGNAL_LOST'}
                                </span>
                                <span>TOTAL_OPS: {selectedCustomer.missionCount}</span>
                            </div>
                        </div>
                    </div>
                    
                    <button 
                        onClick={() => { setEditingJob(null); window.prefillName = selectedCustomer.name; setView('NEW_JOB'); }}
                        className="w-full md:w-auto theme-bg text-black px-6 py-4 md:py-3 text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-white transition-all shadow-lg relative z-10"
                    >
                        <SafeIcon name="plus-circle" size={14} /> Start_New_Deployment
                    </button>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                    {/* Stats och Loggar (Behålls men optimeras i grid) */}
                    <div className="space-y-6">
                        <div className="bg-zinc-900 p-6 rounded-sm relative overflow-hidden border border-zinc-800">
                            <div className="relative z-10">
                                <div className="text-[8px] font-black text-zinc-500 uppercase tracking-widest mb-1">Loyalty_Pulse_Score</div>
                                <div className="text-3xl font-mono font-black text-white mb-4">{loyaltyScore}%</div>
                                <div className="w-full bg-zinc-800 h-1.5 rounded-full overflow-hidden shadow-inner">
                                    <div className="theme-bg h-full shadow-[0_0_10px_#f97316]" style={{ width: `${loyaltyScore}%` }}></div>
                                </div>
                            </div>
                            <SafeIcon name="activity" size={80} className="absolute -right-4 -bottom-4 text-white opacity-5" />
                        </div>
                        {/* Fler sidopanels-element... */}
                        <div className="bg-white border border-zinc-200 p-6 shadow-sm">
                            <div className="text-[9px] font-black text-zinc-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                                <SafeIcon name="rss" size={12} /> Communication_Status
                            </div>
                            <div className="flex items-center gap-4">
                                <div className={`w-3 h-3 rounded-full ${daysSinceLast < 30 ? 'bg-emerald-500 animate-pulse' : 'bg-red-500'}`}></div>
                                <div>
                                    <div className="text-[11px] font-black uppercase text-zinc-900">{daysSinceLast < 30 ? 'Active_Node' : 'Latent_Node'}</div>
                                    <div className="text-[9px] font-mono text-zinc-400 uppercase">Last Pulse: {daysSinceLast}d ago</div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="lg:col-span-3 space-y-6">
                        {/* Top Stats Grid */}
                        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                            {[
                                { label: 'Net_Worth', val: selectedCustomer.totalSpent.toLocaleString(), unit: 'kr', icon: 'credit-card', color: 'text-emerald-600' },
                                { label: 'Payload_Avg', val: Math.round(selectedCustomer.avgValue).toLocaleString(), unit: 'kr', icon: 'zap', color: 'theme-text' },
                                { label: 'Deployments', val: selectedCustomer.missionCount, unit: 'Ops', icon: 'list', color: 'text-zinc-900' },
                                { label: 'Managed_Assets', val: selectedCustomer.vehicles.size, unit: 'Units', icon: 'truck', color: 'text-zinc-900' }
                            ].map((s, i) => (
                                <div key={i} className="bg-white border border-zinc-200 p-4 md:p-5 group hover:border-zinc-950 transition-all shadow-sm">
                                    <div className="text-[8px] font-black text-zinc-400 uppercase tracking-widest mb-2 flex items-center justify-between">
                                        {s.label} <SafeIcon name={s.icon} size={10} className="group-hover:theme-text transition-colors" />
                                    </div>
                                    <div className={`text-lg md:text-xl font-mono font-black ${s.color}`}>{s.val} <span className="text-[10px] opacity-40 font-sans tracking-normal">{s.unit}</span></div>
                                </div>
                            ))}
                        </div>

                        {/* History Log */}
                        <div className="bg-white border border-zinc-200 shadow-2xl rounded-sm overflow-hidden flex flex-col">
                            <div className="bg-zinc-950 p-4 flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-zinc-800">
                                <div className="text-[10px] font-black text-white uppercase tracking-[0.3em] flex items-center gap-3">
                                    <SafeIcon name="database" size={14} className="theme-text" /> 
                                    Mission_Log_Buffer <span className="text-zinc-600 font-mono text-[9px] tracking-normal hidden sm:inline">[{selectedCustomer.jobs.length}_ENTRIES]</span>
                                </div>
                                <div className="relative w-full md:w-64">
                                    <input 
                                        type="text" 
                                        placeholder="FILTER_HISTORY..." 
                                        className="bg-zinc-900 border border-zinc-800 text-[9px] font-black text-white px-3 py-2 outline-none focus:theme-border w-full uppercase tracking-widest"
                                        value={logSearch}
                                        onChange={(e) => setLogSearch(e.target.value)}
                                    />
                                    <SafeIcon name="search" size={10} className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-600" />
                                </div>
                            </div>

                            <div className="divide-y divide-zinc-100 max-h-[450px] overflow-auto custom-scrollbar bg-white">
                                {filteredLogs.length > 0 ? filteredLogs.map((j, i) => (
                                    <div 
                                        key={i} 
                                        onClick={() => { setEditingJob(j); setView('NEW_JOB'); }}
                                        className="p-4 md:p-5 hover:bg-zinc-50 transition-all flex flex-col md:flex-row md:items-center justify-between group cursor-pointer border-l-4 border-transparent hover:border-orange-500 gap-4"
                                    >
                                        <div className="flex items-center gap-4 md:gap-8 flex-1">
                                            <div className="text-center w-12 md:w-14 border-r border-zinc-100 pr-4 md:pr-6 shrink-0">
                                                <div className="text-sm md:text-base font-black text-zinc-950 leading-none">{j.datum?.split('-')[2]?.split('T')[0]}</div>
                                                <div className="text-[8px] md:text-[9px] font-black text-zinc-400 uppercase">{j.datum?.split('-')[1]}</div>
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="flex flex-wrap items-center gap-2 md:gap-3 mb-1">
                                                    <div className="text-[12px] md:text-[13px] font-black uppercase text-zinc-900 truncate group-hover:theme-text transition-colors">
                                                        {j.paket || 'Standard_Deployment'}
                                                    </div>
                                                    <span className="text-[9px] font-mono font-bold bg-zinc-950 text-white px-2 py-0.5 rounded-sm tracking-widest shrink-0 border border-zinc-800">
                                                        {j.regnr}
                                                    </span>
                                                </div>
                                                {j.kommentar ? (
                                                    <div className="text-[10px] text-zinc-500 italic truncate max-w-full flex items-center gap-2">
                                                        <SafeIcon name="message-square" size={10} className="text-zinc-300" />
                                                        "{j.kommentar}"
                                                    </div>
                                                ) : (
                                                    <div className="text-[9px] text-zinc-300 uppercase tracking-tighter italic">No_System_Notes</div>
                                                )}
                                            </div>
                                        </div>
                                        <div className="flex items-center justify-between md:justify-end gap-8 mt-2 md:mt-0 shrink-0">
                                            <div className="text-right">
                                                <div className="text-base md:text-lg font-mono font-black text-zinc-950">{(parseInt(j.kundpris) || 0).toLocaleString()} <span className="text-[10px] opacity-30">kr</span></div>
                                                <div className={`text-[8px] font-black uppercase px-2 py-0.5 rounded-full inline-block ${j.status === 'KLAR' ? 'bg-emerald-50 text-emerald-600' : 'bg-orange-50 theme-text'}`}>
                                                    ● {j.status}
                                                </div>
                                            </div>
                                            <div className="bg-zinc-100 p-2 md:opacity-0 group-hover:opacity-100 hover:bg-zinc-950 hover:text-white transition-all rounded-sm border border-zinc-200">
                                                <SafeIcon name="external-link" size={14} />
                                            </div>
                                        </div>
                                    </div>
                                )) : (
                                    <div className="p-20 text-center text-zinc-300 font-black uppercase tracking-[0.5em] text-[10px]">
                                        No_Logs_Stored
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    // --- 4. VY: HUVUDGRID (Nexus Interface) ---
    return (
        <div className="space-y-6 animate-in fade-in duration-500 pb-20 px-4 md:px-0">
            <div className="bg-zinc-950 p-4 md:p-6 flex flex-col md:flex-row md:items-center justify-between border-b-2 theme-border shadow-2xl gap-4">
                <div className="flex items-center gap-4 md:gap-5">
                    <div className="w-10 h-10 md:w-12 md:h-12 theme-bg flex items-center justify-center rounded-sm shadow-lg">
                        <SafeIcon name="users" size={20} className="text-black" />
                    </div>
                    <div>
                        <span className="text-[8px] md:text-[10px] font-black theme-text uppercase tracking-[0.4em] block leading-none mb-1.5">
                            Entity_Database_Nexus
                        </span>
                        <h2 className="text-lg md:text-xl font-black text-white uppercase tracking-widest flex items-center gap-3">
                            Briefing <span className="text-[9px] bg-zinc-800 px-2 py-1 text-zinc-500 font-mono hidden sm:inline">COUNT:{customerData.length}</span>
                        </h2>
                    </div>
                </div>

                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                    <div className="flex bg-zinc-900 border border-zinc-800 p-1 rounded-sm">
                        {[
                            { id: 'revenue', icon: 'dollar-sign' },
                            { id: 'count', icon: 'hash' },
                            { id: 'recent', icon: 'clock' }
                        ].map(m => (
                            <button 
                                key={m.id}
                                onClick={() => setSortMode(m.id)}
                                className={`flex-1 sm:flex-none p-2 transition-all ${sortMode === m.id ? 'theme-bg text-black shadow-lg' : 'text-zinc-600 hover:text-white'}`}
                            >
                                <SafeIcon name={m.icon} size={14} />
                            </button>
                        ))}
                    </div>

                    <div className="relative group flex-1">
                        <input 
                            type="text" 
                            placeholder="SEARCH_ENTITY..." 
                            className="bg-zinc-900 border border-zinc-800 focus:theme-border p-3 pl-10 text-[10px] font-bold text-white outline-none w-full md:w-64 uppercase tracking-widest shadow-2xl transition-all"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                        <SafeIcon name="search" size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-600" />
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-6 gap-4">
                {customerData.map((customer, i) => (
                    <div 
                        key={i} 
                        onClick={() => setSelectedCustomer(customer)}
                        className="group bg-white border border-zinc-200 hover:border-zinc-950 transition-all cursor-pointer relative overflow-hidden flex flex-col h-[180px] shadow-sm"
                    >
                        <div className="absolute -bottom-6 -right-4 text-[80px] font-black text-zinc-50 group-hover:theme-text/5 transition-colors pointer-events-none italic select-none">
                            {customer.rank[0]}
                        </div>

                        <div className="p-5 flex-1 relative z-10">
                            <div className="flex justify-between items-start mb-3">
                                <RankBadge rank={customer.rank} />
                                <div className="text-[10px] font-mono font-black text-zinc-300">#{i + 1}</div>
                            </div>
                            <h3 className="text-[14px] font-black uppercase leading-tight mb-4 group-hover:theme-text transition-colors truncate">{customer.name}</h3>
                            <div className="grid grid-cols-2 border-t border-zinc-50 pt-3 gap-2">
                                <div>
                                    <div className="text-[7px] font-black text-zinc-400 uppercase">Revenue</div>
                                    <div className="text-xs font-mono font-black italic">{(customer.totalSpent / 1000).toFixed(1)}k</div>
                                </div>
                                <div className="text-right">
                                    <div className="text-[7px] font-black text-zinc-400 uppercase">Ops</div>
                                    <div className="text-xs font-mono font-black">{customer.missionCount}x</div>
                                </div>
                            </div>
                        </div>

                        <div className="mt-auto bg-zinc-950 p-3 flex items-center justify-between border-t border-zinc-900 group-hover:bg-zinc-900 transition-colors">
                            <div className="flex items-center gap-2">
                                <div className={`w-1.5 h-1.5 rounded-full ${Math.floor((new Date() - new Date(customer.lastSeen)) / (1000 * 60 * 60 * 24)) < 45 ? 'bg-emerald-500 animate-pulse' : 'bg-zinc-700'}`}></div>
                                <span className="text-[9px] font-mono font-bold text-zinc-400 uppercase truncate max-w-[80px]">{customer.topVehicle}</span>
                            </div>
                            <SafeIcon name="arrow-right" size={12} className="text-zinc-600 group-hover:theme-text transition-all group-hover:translate-x-1" />
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};
