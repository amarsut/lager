// customers.js

const SafeIcon = ({ name, size = 14, className = "" }) => (
    <span className="inline-flex items-center justify-center shrink-0">
        <window.Icon name={name} size={size} className={className} />
    </span>
);

const SectionHeader = ({ title, sub, icon }) => (
    <div className="flex items-start gap-3 mb-6 pb-4 border-b border-zinc-200/50 dark:border-white/5">
        <div className="mt-1 h-5 w-1 bg-gradient-to-b from-orange-400 to-orange-600 rounded-full shadow-[0_0_10px_rgba(249,115,22,0.4)]" />
        <div>
            <div className="flex items-center gap-2 text-zinc-900 dark:text-white">
                <SafeIcon name={icon} size={14} className="text-zinc-400 dark:text-zinc-500" />
                <h3 className="text-[13px] font-bold uppercase tracking-widest">{title}</h3>
            </div>
            {sub && <p className="text-[10px] font-medium uppercase tracking-[0.15em] text-zinc-400 dark:text-zinc-500 mt-1">{sub}</p>}
        </div>
    </div>
);

window.CustomersView = ({ allJobs, setView, setEditingJob, viewParams }) => {
    const [searchQuery, setSearchQuery] = React.useState('');
    const [selectedCustomer, setSelectedCustomer] = React.useState(null);
    const [sortMode, setSortMode] = React.useState('revenue'); 
    const [logSearch, setLogSearch] = React.useState('');

    React.useEffect(() => {
        if (viewParams && viewParams.selectedCustomer) {
            setSelectedCustomer(viewParams.selectedCustomer);
        } else {
            setSelectedCustomer(null);
        }
    }, [viewParams]);

    const customerData = React.useMemo(() => {
        const groups = allJobs.reduce((acc, job) => {
            const name = job.kundnamn || 'Oidentifierad Enhet';
            if (!acc[name]) {
                acc[name] = {
                    name: name, totalSpent: 0, missionCount: 0, vehicles: new Set(),
                    lastSeen: job.datum, jobs: [], avgValue: 0, rank: 'D', topVehicle: '', packageStats: {}
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
            'S-TIER': 'bg-gradient-to-r from-orange-500 to-orange-600 text-white shadow-[0_0_15px_rgba(249,115,22,0.4)] border border-orange-400',
            'A-TIER': 'bg-zinc-900 dark:bg-white/10 text-orange-400 border border-orange-500/30',
            'B-TIER': 'bg-zinc-100 dark:bg-white/5 text-zinc-600 dark:text-zinc-300 border border-zinc-200 dark:border-white/10',
            'C-TIER': 'bg-transparent text-zinc-400 border border-zinc-200 dark:border-white/5 opacity-60'
        };
        return (
            <span className={`text-[9px] font-black px-2 py-0.5 rounded-lg tracking-widest uppercase transition-all hover:scale-105 ${colors[rank] || colors['C-TIER']}`}>
                {rank}
            </span>
        );
    };

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
            <div className="relative max-w-5xl animate-in fade-in slide-in-from-left-4 duration-700 pb-24 ml-0">
                {/* Ambient Glow */}
                <div className="absolute top-0 left-[-10%] w-[80%] h-[400px] bg-orange-500/10 dark:bg-orange-500/5 blur-[120px] rounded-full pointer-events-none -z-10"></div>

                {/* Header Section */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 px-5 pt-8 pb-8 lg:px-2">
                    <div className="flex items-center gap-5">
                        <button onClick={() => setSelectedCustomer(null)} className="group w-12 h-12 flex items-center justify-center bg-white/80 dark:bg-white/5 backdrop-blur-md border border-zinc-200 dark:border-white/10 rounded-2xl shadow-sm hover:shadow-xl hover:shadow-orange-500/5 transition-all">
                            <SafeIcon name="arrow-left" size={20} className="group-hover:-translate-x-1 transition-transform text-zinc-600 dark:text-white" />
                        </button>
                        <div className="flex flex-col">
                            <div className="flex items-center gap-3">
                                <h1 className="text-2xl md:text-3xl font-black text-zinc-900 dark:text-white uppercase tracking-tight leading-none truncate max-w-[200px] sm:max-w-md">
                                    {selectedCustomer.name}
                                </h1>
                                <RankBadge rank={selectedCustomer.rank} />
                            </div>
                            <p className="text-[11px] font-bold text-orange-500 dark:text-orange-400 uppercase tracking-[0.2em] mt-2 flex items-center gap-2">
                                <span className={`w-2 h-2 rounded-full ${daysSinceLast < 45 ? 'bg-emerald-500 animate-pulse' : 'bg-red-500'}`}></span>
                                {daysSinceLast < 45 ? 'Active_Node' : 'Latent_Node'} // ID: {selectedCustomer.name.substring(0,6).toUpperCase()}
                            </p>
                        </div>
                    </div>
                    
                    <button 
                        onClick={() => { setEditingJob(null); window.prefillName = selectedCustomer.name; setView('NEW_JOB'); }}
                        className="w-full sm:w-auto px-8 py-4 bg-gradient-to-r from-orange-500 to-orange-600 text-white font-bold text-[13px] uppercase tracking-widest shadow-[0_8px_20px_-6px_rgba(249,115,22,0.4)] hover:shadow-[0_8px_25px_-4px_rgba(249,115,22,0.5)] border border-orange-400/50 active:scale-95 transition-all text-center rounded-2xl flex items-center justify-center gap-2"
                    >
                        <SafeIcon name="plus" size={18} /> Deploy Mission
                    </button>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 px-4 lg:px-2">
                    {/* Sidebar Stats */}
                    <div className="lg:col-span-4 space-y-6">
                        {/* Loyalty Card */}
                        <div className="bg-zinc-950 dark:bg-[#121214] p-8 rounded-3xl relative overflow-hidden border border-white/5 shadow-2xl">
                            <div className="relative z-10">
                                <SectionHeader title="Loyalty_Pulse" sub="Retention Analysis" icon="activity" />
                                <div className="text-6xl font-light tracking-tighter text-white mb-6">
                                    {loyaltyScore}<span className="text-xl text-orange-500 font-bold ml-1">%</span>
                                </div>
                                <div className="h-2 w-full bg-white/10 rounded-full overflow-hidden">
                                    <div className="h-full bg-gradient-to-r from-orange-400 to-orange-600 shadow-[0_0_15px_rgba(249,115,22,0.6)] transition-all duration-1000" style={{ width: `${loyaltyScore}%` }}></div>
                                </div>
                            </div>
                            <SafeIcon name="activity" size={120} className="absolute -right-8 -bottom-8 text-white opacity-[0.03]" />
                        </div>

                        {/* Status Grid */}
                        <div className="grid grid-cols-1 gap-4">
                            <div className="bg-white/80 dark:bg-[#121214]/80 backdrop-blur-xl p-6 rounded-3xl border border-zinc-200/80 dark:border-white/5 shadow-sm">
                                <div className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-4">Signal_Staleness</div>
                                <div className="flex items-center justify-between">
                                    <div className="text-2xl font-mono font-black text-zinc-900 dark:text-white">{daysSinceLast}d</div>
                                    <span className="text-[9px] font-bold text-zinc-500 uppercase">Since Last Mission</span>
                                </div>
                            </div>

                            <div className="bg-white/80 dark:bg-[#121214]/80 backdrop-blur-xl p-6 rounded-3xl border border-zinc-200/80 dark:border-white/5 shadow-sm">
                                <SectionHeader title="Affinity_Map" sub="Service Distribution" icon="rss" />
                                <div className="space-y-4 mt-2">
                                    {Object.entries(selectedCustomer.packageStats).map(([pkg, count]) => (
                                        <div key={pkg} className="group">
                                            <div className="flex justify-between text-[10px] font-bold uppercase mb-2 text-zinc-600 dark:text-zinc-400">
                                                <span className="group-hover:text-orange-500 transition-colors">{pkg}</span>
                                                <span className="font-mono text-zinc-900 dark:text-white">{Math.round((count / selectedCustomer.missionCount) * 100)}%</span>
                                            </div>
                                            <div className="w-full bg-zinc-100 dark:bg-black/20 h-1.5 rounded-full overflow-hidden">
                                                <div className="bg-orange-500 h-full transition-all duration-1000 opacity-60 group-hover:opacity-100" style={{ width: `${(count / selectedCustomer.missionCount) * 100}%` }}></div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Main Content Area */}
                    <div className="lg:col-span-8 space-y-6">
                        {/* Summary Metrics */}
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            {[
                                { label: 'Net_Worth', val: selectedCustomer.totalSpent.toLocaleString(), unit: 'kr', icon: 'credit-card', color: 'text-emerald-500' },
                                { label: 'Payload_Avg', val: Math.round(selectedCustomer.avgValue).toLocaleString(), unit: 'kr', icon: 'zap', color: 'text-orange-500' },
                                { label: 'Missions', val: selectedCustomer.missionCount, unit: 'Ops', icon: 'list', color: 'text-zinc-900 dark:text-white' },
                                { label: 'Assets', val: selectedCustomer.vehicles.size, unit: 'Nodes', icon: 'truck', color: 'text-zinc-900 dark:text-white' }
                            ].map((s, i) => (
                                <div key={i} className="bg-white/80 dark:bg-[#121214]/80 backdrop-blur-xl border border-zinc-200/80 dark:border-white/5 rounded-2xl p-5 hover:shadow-xl hover:shadow-orange-500/5 transition-all group">
                                    <div className="text-[9px] font-bold text-zinc-400 uppercase tracking-widest mb-3 flex items-center justify-between">
                                        {s.label} <SafeIcon name={s.icon} size={12} className="group-hover:text-orange-500 transition-colors" />
                                    </div>
                                    <div className={`text-xl font-mono font-black ${s.color}`}>{s.val}</div>
                                    <div className="text-[9px] font-bold text-zinc-400 dark:text-zinc-500 uppercase mt-1 tracking-tighter">{s.unit} Total</div>
                                </div>
                            ))}
                        </div>

                        {/* Mission Log Card */}
                        <div className="bg-white/80 dark:bg-[#121214]/80 backdrop-blur-xl border border-zinc-200/80 dark:border-white/5 rounded-3xl shadow-sm overflow-hidden flex flex-col">
                            <div className="bg-zinc-50/50 dark:bg-white/5 p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-zinc-200/50 dark:border-white/10">
                                <SectionHeader title="Mission_Log_Buffer" sub={`Sequence History [${selectedCustomer.jobs.length}]`} icon="database" />
                                <div className="relative group">
                                    <input 
                                        type="text" 
                                        placeholder="FILTER LOGS..." 
                                        className="bg-white dark:bg-black/40 border border-zinc-200 dark:border-white/10 text-[11px] font-bold text-zinc-900 dark:text-white px-10 py-3 outline-none focus:border-orange-500 w-full md:w-56 uppercase tracking-widest rounded-xl transition-all shadow-sm"
                                        value={logSearch}
                                        onChange={(e) => setLogSearch(e.target.value)}
                                    />
                                    <SafeIcon name="search" size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400 group-focus-within:text-orange-500 transition-colors" />
                                </div>
                            </div>

                            <div className="divide-y divide-zinc-100 dark:divide-white/5 max-h-[450px] overflow-y-auto custom-scrollbar">
                                {filteredLogs.length > 0 ? filteredLogs.map((j, i) => {
                                    const jobDate = new Date(j.datum);
                                    const monthNames = ["JAN", "FEB", "MAR", "APR", "MAJ", "JUN", "JUL", "AUG", "SEP", "OKT", "NOV", "DEC"];
                                    
                                    return (
                                        <div 
                                            key={i} 
                                            onClick={() => { setEditingJob(j); setView('NEW_JOB'); }}
                                            className="group p-5 hover:bg-zinc-50 dark:hover:bg-white/[0.02] transition-all cursor-pointer border-l-4 border-transparent hover:border-orange-500"
                                        >
                                            <div className="flex gap-5 items-center">
                                                <div className="flex flex-col items-center w-12 shrink-0">
                                                    <div className="text-xl font-light text-zinc-900 dark:text-white leading-none tracking-tighter">{jobDate.getDate()}</div>
                                                    <div className="text-[9px] font-bold uppercase text-zinc-400 mt-1">{monthNames[jobDate.getMonth()]}</div>
                                                </div>

                                                <div className="flex-1 min-w-0">
                                                    <div className="flex justify-between items-center mb-2">
                                                        <span className="text-[14px] font-bold uppercase text-zinc-900 dark:text-white group-hover:text-orange-500 transition-colors truncate">
                                                            {j.paket || 'Standard_Deployment'}
                                                        </span>
                                                        <div className="text-lg font-mono font-black text-zinc-900 dark:text-white tracking-tighter">
                                                            {(parseInt(j.kundpris) || 0).toLocaleString()}<span className="text-[10px] text-zinc-400 ml-1">kr</span>
                                                        </div>
                                                    </div>
                                                    <div className="flex items-center gap-3">
                                                        <span className="text-[10px] font-mono font-bold bg-zinc-100 dark:bg-white/5 text-zinc-500 dark:text-zinc-400 px-2 py-0.5 rounded-md border border-zinc-200 dark:border-white/5 uppercase">
                                                            {j.regnr}
                                                        </span>
                                                        <span className={`text-[9px] font-black uppercase tracking-widest ${j.status === 'KLAR' ? 'text-emerald-500' : 'text-orange-500'}`}>
                                                            {j.status}
                                                        </span>
                                                    </div>
                                                </div>
                                                <SafeIcon name="chevron-right" size={20} className="text-zinc-300 dark:text-zinc-600 group-hover:text-orange-500 group-hover:translate-x-1 transition-all" />
                                            </div>
                                        </div>
                                    );
                                }) : (
                                    <div className="p-16 text-center text-zinc-400 uppercase tracking-widest text-[11px] font-bold">
                                        <SafeIcon name="database-zap" size={40} className="mb-4 opacity-20 mx-auto" />
                                        No_Mission_Data_Buffer
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Asset Inventory Card */}
                        <div className="bg-white/80 dark:bg-[#121214]/80 backdrop-blur-xl border border-zinc-200/80 dark:border-white/5 rounded-3xl p-8 shadow-sm">
                            <SectionHeader title="Asset_Inventory_Registry" sub="Registered Operational Nodes" icon="truck" />
                            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
                                {Array.from(selectedCustomer.vehicles).map(v => (
                                    <div key={v} className="bg-zinc-50/50 dark:bg-black/20 border border-zinc-200 dark:border-white/10 p-5 rounded-2xl hover:border-orange-500/50 hover:bg-white dark:hover:bg-white/5 transition-all group flex items-center justify-between">
                                        <div className="flex items-center gap-4">
                                            <div className="p-2.5 bg-zinc-100 dark:bg-white/5 rounded-xl group-hover:text-orange-500 transition-colors">
                                                <SafeIcon name="truck" size={18} />
                                            </div>
                                            <span className="text-sm font-mono font-black text-zinc-800 dark:text-zinc-200 tracking-[0.15em] uppercase">{v}</span>
                                        </div>
                                        <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_#10b981]"></div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="relative max-w-5xl animate-in fade-in slide-in-from-left-4 duration-700 pb-24 ml-0">
            {/* Ambient Background Glow */}
            <div className="absolute top-0 left-[-10%] w-[80%] h-[400px] bg-orange-500/10 dark:bg-orange-500/5 blur-[120px] rounded-full pointer-events-none -z-10"></div>

            {/* List Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 px-5 pt-8 pb-8 lg:px-2">
                <div className="flex items-center gap-5">
                    <div className="relative group">
                        <div className="absolute inset-0 bg-orange-500/40 blur-xl rounded-full transition-all duration-700 group-hover:bg-orange-500/60" />
                        <div className="relative w-14 h-14 bg-gradient-to-br from-orange-400 to-orange-600 rounded-2xl flex items-center justify-center text-white shadow-xl border border-white/20">
                            <SafeIcon name="users" size={24} />
                        </div>
                    </div>
                    <div className="flex flex-col">
                        <h1 className="text-2xl md:text-3xl font-black text-zinc-900 dark:text-white uppercase tracking-tight leading-none">
                            Customer <span className="text-zinc-400 dark:text-zinc-500 font-light">Database</span>
                        </h1>
                        <p className="text-[11px] font-bold text-orange-500 dark:text-orange-400 uppercase tracking-[0.2em] mt-2 flex items-center gap-2">
                            <span className="w-1.5 h-1.5 rounded-full bg-orange-500 animate-pulse"></span>
                            Operational Overview // {customerData.length} Active Nodes
                        </p>
                    </div>
                </div>

                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4">
                    {/* Sort Controls */}
                    <div className="flex bg-white/80 dark:bg-white/5 backdrop-blur-md border border-zinc-200 dark:border-white/10 p-1.5 rounded-2xl shadow-sm">
                        {[
                            { id: 'revenue', icon: 'dollar-sign', tooltip: 'Revenue' },
                            { id: 'count', icon: 'hash', tooltip: 'Visits' },
                            { id: 'recent', icon: 'clock', tooltip: 'Recent' }
                        ].map(m => (
                            <button 
                                key={m.id}
                                onClick={() => setSortMode(m.id)}
                                className={`p-3 transition-all flex-1 sm:flex-none flex justify-center rounded-xl ${sortMode === m.id ? 'bg-orange-500 text-white shadow-lg' : 'text-zinc-400 hover:text-zinc-900 dark:hover:text-white'}`}
                                title={m.tooltip}
                            >
                                <SafeIcon name={m.icon} size={16} />
                            </button>
                        ))}
                    </div>

                    <div className="relative group">
                        <input 
                            type="text" 
                            placeholder="SEARCH NODES..." 
                            className="bg-white/80 dark:bg-white/5 border border-zinc-200 dark:border-white/10 focus:border-orange-500 p-4 pl-12 text-[12px] font-bold text-zinc-900 dark:text-white outline-none w-full md:w-64 transition-all uppercase tracking-widest placeholder:text-zinc-400 backdrop-blur-md rounded-2xl shadow-sm"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                        <SafeIcon name="search" size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400 group-focus-within:text-orange-500 transition-colors" />
                    </div>
                </div>
            </div>

            {/* Customer Cards Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 px-4 md:px-2">
                {customerData.map((customer, i) => (
                    <div 
                        key={i} 
                        onClick={() => setSelectedCustomer(customer)}
                        className="group bg-white/80 dark:bg-[#121214]/80 backdrop-blur-xl border border-zinc-200/80 dark:border-white/5 hover:border-orange-500/50 transition-all duration-300 cursor-pointer relative overflow-hidden flex flex-col h-[200px] hover:-translate-y-2 shadow-sm hover:shadow-2xl hover:shadow-orange-500/10 rounded-3xl p-6"
                    >
                        {/* Background Rank Indicator */}
                        <div className="absolute -bottom-8 -right-4 text-[110px] font-black text-zinc-50 dark:text-white/[0.02] group-hover:text-orange-500/[0.03] transition-colors pointer-events-none italic select-none leading-none">
                            {customer.rank[0]}
                        </div>

                        <div className="flex justify-between items-start mb-4 relative z-10">
                            <RankBadge rank={customer.rank} />
                            <div className="text-[10px] font-mono font-bold text-zinc-300 dark:text-zinc-600 group-hover:text-orange-500/50 transition-colors">#{i + 1}</div>
                        </div>

                        <h3 className="text-[16px] font-black text-zinc-900 dark:text-white uppercase leading-tight mb-auto group-hover:text-orange-500 transition-colors truncate relative z-10">
                            {customer.name}
                        </h3>

                        <div className="grid grid-cols-2 pt-4 gap-4 border-t border-zinc-100 dark:border-white/5 relative z-10 mt-4">
                            <div>
                                <div className="text-[8px] font-bold text-zinc-400 uppercase tracking-widest mb-1">Revenue</div>
                                <div className="text-[14px] font-mono font-black text-zinc-900 dark:text-zinc-200">{(customer.totalSpent / 1000).toFixed(1)}k</div>
                            </div>
                            <div className="text-right">
                                <div className="text-[8px] font-bold text-zinc-400 uppercase tracking-widest mb-1">Ops_Count</div>
                                <div className="text-[14px] font-mono font-black text-zinc-900 dark:text-zinc-200">{customer.missionCount}x</div>
                            </div>
                        </div>

                        {/* Hover Overlay Line */}
                        <div className="absolute bottom-0 left-0 w-0 h-1 bg-orange-500 group-hover:w-full transition-all duration-500"></div>
                    </div>
                ))}
            </div>
        </div>
    );
};
