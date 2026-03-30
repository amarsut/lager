// customers.js

const SafeIcon = ({ name, size = 14, className = "" }) => (
    <span className="inline-flex items-center justify-center shrink-0">
        <window.Icon name={name} size={size} className={className} />
    </span>
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
            'S-TIER': 'bg-orange-500 text-black shadow-[0_0_10px_rgba(249,115,22,0.5)]',
            'A-TIER': 'bg-zinc-800 dark:bg-[#1a2235] text-orange-400 border border-orange-500/30',
            'B-TIER': 'bg-zinc-100 dark:bg-[#252f48] text-zinc-800 dark:text-zinc-300',
            'C-TIER': 'bg-zinc-50 dark:bg-[#1a2235] text-zinc-400 dark:text-zinc-500'
        };
        return (
            <span className={`text-[7px] font-black px-1.5 py-0.5 rounded-sm tracking-tighter ${colors[rank] || colors['C-TIER']}`}>
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
            <div className="animate-in fade-in slide-in-from-right-8 duration-500 pb-20 transition-colors duration-300">
                <div className="flex flex-col md:flex-row md:items-center justify-between mb-4 pb-4 border-b border-zinc-200 dark:border-white/5 gap-4 px-5 pt-5 lg:px-0 lg:pt-0">
                    <div className="flex items-center gap-4">
                        <button onClick={() => window.history.back()} className="group bg-white dark:bg-[#182032] border border-zinc-200 dark:border-white/5 text-zinc-500 dark:text-zinc-400 p-2.5 hover:text-zinc-900 dark:hover:text-white transition-all shrink-0 rounded-md shadow-sm">
                            <SafeIcon name="arrow-left" size={20} className="group-hover:-translate-x-1 transition-transform" />
                        </button>
                        <div className="flex flex-col">
                            <div className="flex items-center gap-3">
                                <h1 className="text-xl md:text-2xl font-black text-black dark:text-white uppercase tracking-[-0.03em] leading-none drop-shadow-sm dark:drop-shadow-none truncate max-w-[200px] sm:max-w-md">
                                    {selectedCustomer.name}
                                </h1>
                                <RankBadge rank={selectedCustomer.rank} />
                            </div>
                            <div className="flex items-center gap-3 mt-1.5">
                                <span className="text-[11px] font-bold text-zinc-500 uppercase tracking-widest">
                                    UID: {selectedCustomer.name.substring(0,6).toUpperCase()}
                                </span>
                                <span className="flex items-center gap-1.5 text-[11px] font-bold text-zinc-500 uppercase tracking-widest">
                                    <div className={`w-1.5 h-1.5 rounded-full ${daysSinceLast < 45 ? 'bg-emerald-500' : 'bg-red-500'}`}></div>
                                    {daysSinceLast < 45 ? 'Aktiv' : 'Passiv'}
                                </span>
                            </div>
                        </div>
                    </div>
                    
                    <button 
                        onClick={() => { setEditingJob(null); window.prefillName = selectedCustomer.name; setView('NEW_JOB'); }}
                        className="bg-orange-500 hover:bg-orange-600 text-white h-[40px] px-5 rounded-md flex items-center justify-center gap-2 shadow-sm dark:shadow-none transition-colors font-semibold text-[13px]"
                    >
                        <SafeIcon name="plus" size={18} /> Nytt Jobb
                    </button>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 px-4 lg:px-0">
                    <div className="space-y-6">
                        <div className="bg-zinc-900 dark:bg-[#121826] p-6 rounded-sm relative overflow-hidden border border-zinc-800 dark:border-[#1a2235]">
                            <div className="relative z-10">
                                <div className="text-[8px] font-black text-zinc-500 uppercase tracking-widest mb-1">Loyalty_Pulse_Score</div>
                                <div className="text-3xl font-mono font-black text-white mb-4">{loyaltyScore}%</div>
                                <div className="w-full bg-zinc-800 dark:bg-[#1a2235] h-1.5 rounded-full overflow-hidden shadow-inner">
                                    <div className="theme-bg h-full shadow-[0_0_10px_#f97316]" style={{ width: `${loyaltyScore}%` }}></div>
                                </div>
                            </div>
                            <SafeIcon name="activity" size={80} className="absolute -right-4 -bottom-4 text-white opacity-5" />
                        </div>

                        <div className="bg-white dark:bg-[#182032] border border-zinc-200 dark:border-white/5 rounded-xl p-6 shadow-sm relative">
                            <div className="absolute top-0 right-0 w-3 h-3 border-t-2 border-r-2 border-zinc-100 dark:border-white/10"></div>
                            <div className="text-[9px] font-black text-zinc-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                                <SafeIcon name="rss" size={12} /> Communication_Status
                            </div>
                            <div className="flex items-center gap-4">
                                <div className={`w-3 h-3 rounded-full ${daysSinceLast < 30 ? 'bg-emerald-500 animate-pulse' : 'bg-red-500'}`}></div>
                                <div>
                                    <div className="text-[11px] font-black uppercase text-zinc-900 dark:text-white">{daysSinceLast < 30 ? 'Active_Node' : 'Latent_Node'}</div>
                                    <div className="text-[9px] font-mono text-zinc-400 uppercase">Last Pulse: {daysSinceLast}d ago</div>
                                </div>
                            </div>
                        </div>

                        <div className="bg-white dark:bg-[#182032] border border-zinc-200 dark:border-white/5 rounded-xl p-6 shadow-sm">
                            <div className="text-[9px] font-black text-zinc-400 uppercase tracking-widest mb-6">Affinity_Analysis</div>
                            <div className="space-y-4">
                                {Object.entries(selectedCustomer.packageStats).map(([pkg, count]) => (
                                    <div key={pkg} className="group">
                                        <div className="flex justify-between text-[9px] font-black uppercase mb-1.5 text-zinc-900 dark:text-white">
                                            <span className="group-hover:theme-text transition-colors">{pkg}</span>
                                            <span className="opacity-50">{Math.round((count / selectedCustomer.missionCount) * 100)}%</span>
                                        </div>
                                        <div className="w-full bg-zinc-100 dark:bg-[#1a2235] h-1 rounded-full overflow-hidden">
                                            <div className="bg-zinc-800 dark:bg-zinc-500 h-full transition-all duration-1000" style={{ width: `${(count / selectedCustomer.missionCount) * 100}%` }}></div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    <div className="lg:col-span-3 space-y-6">
                        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                            {[
                                { label: 'Net_Worth', val: selectedCustomer.totalSpent.toLocaleString(), unit: 'kr', icon: 'credit-card', color: 'text-emerald-600 dark:text-emerald-500' },
                                { label: 'Payload_Avg', val: Math.round(selectedCustomer.avgValue).toLocaleString(), unit: 'kr', icon: 'zap', color: 'theme-text' },
                                { label: 'Deployments', val: selectedCustomer.missionCount, unit: 'Visits', icon: 'list', color: 'text-zinc-900 dark:text-white' },
                                { label: 'Managed_Assets', val: selectedCustomer.vehicles.size, unit: 'Vehicles', icon: 'truck', color: 'text-zinc-900 dark:text-white' }
                            ].map((s, i) => (
                                <div key={i} className="bg-white dark:bg-[#182032] border border-zinc-200 dark:border-white/5 rounded-xl p-5 group hover:border-zinc-950 dark:hover:border-zinc-600 transition-all shadow-sm">
                                    <div className="text-[8px] font-black text-zinc-400 uppercase tracking-widest mb-2 flex items-center justify-between">
                                        {s.label} <SafeIcon name={s.icon} size={10} className="group-hover:theme-text transition-colors" />
                                    </div>
                                    <div className={`text-xl font-mono font-black ${s.color}`}>{s.val} <span className="text-[10px] opacity-40 font-sans tracking-normal">{s.unit}</span></div>
                                </div>
                            ))}
                        </div>

                        <div className="bg-white dark:bg-[#182032] border border-zinc-200 dark:border-white/5 rounded-xl shadow-2xl dark:shadow-none rounded-sm overflow-hidden flex flex-col">
                            <div className="bg-zinc-50 dark:bg-[#0f1522]/50 p-4 flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-zinc-800 dark:border-white/10">
                                <div className="text-[10px] font-black text-white uppercase tracking-[0.3em] flex items-center gap-3">
                                    <SafeIcon name="database" size={14} className="theme-text" /> 
                                    Mission_Log_Buffer <span className="text-zinc-600 dark:text-zinc-400 font-mono text-[9px] tracking-normal">[{selectedCustomer.jobs.length}]</span>
                                </div>
                                <div className="relative">
                                    <input 
                                        type="text" 
                                        placeholder="FILTER..." 
                                        className="bg-zinc-900 dark:bg-[#0a0f18] border border-zinc-800 dark:border-white/10 text-[9px] font-black text-white px-3 py-2 outline-none focus:theme-border w-full md:w-48 uppercase tracking-widest rounded-sm"
                                        value={logSearch}
                                        onChange={(e) => setLogSearch(e.target.value)}
                                    />
                                </div>
                            </div>

                            <div className="divide-y divide-zinc-100 dark:divide-[#1a2235] max-h-[450px] overflow-x-hidden overflow-y-auto custom-scrollbar bg-white dark:bg-[#121826]">
                                {filteredLogs.length > 0 ? filteredLogs
                                    .sort((a, b) => {
                                        if (!a.datum) return 1;
                                        if (!b.datum) return -1;
                                        return b.datum.localeCompare(a.datum);
                                    })
                                    .map((j, i) => {
                                        const jobDate = new Date(j.datum);
                                        const today = new Date();
                                        const isCurrentYear = jobDate.getFullYear() === today.getFullYear();
                                        const monthNames = ["JAN", "FEB", "MAR", "APR", "MAJ", "JUN", "JUL", "AUG", "SEP", "OKT", "NOV", "DEC"];
                                        const subDateDisplay = isCurrentYear ? monthNames[jobDate.getMonth()] : jobDate.getFullYear();

                                        return (
                                            <div 
                                                key={i} 
                                                onClick={() => { setEditingJob(j); setView('NEW_JOB'); }}
                                                className="group p-4 hover:bg-zinc-50 dark:hover:bg-[#1a2235] transition-all cursor-pointer border-l-2 border-transparent hover:border-orange-500"
                                            >
                                                <div className="flex gap-3 md:gap-5 items-start">
                                                    <div className="flex flex-col items-center w-10 shrink-0 pt-0.5">
                                                        <div className="text-[14px] font-black text-zinc-900 dark:text-white leading-none">{jobDate.getDate()}</div>
                                                        <div className={`text-[8px] font-black uppercase tracking-wider ${!isCurrentYear ? 'text-orange-600' : 'text-zinc-400 dark:text-zinc-500'}`}>
                                                            {subDateDisplay}
                                                        </div>
                                                    </div>

                                                    <div className="flex-1 min-w-0">
                                                        <div className="flex justify-between items-start mb-1">
                                                            <div className="flex flex-col min-w-0 pr-2">
                                                                <span className="text-[11px] font-black uppercase text-zinc-900 dark:text-white leading-tight group-hover:theme-text transition-colors truncate">
                                                                    {j.paket || 'Standard_Deployment'}
                                                                </span>
                                                                <div className="flex items-center gap-2 mt-1">
                                                                    <span className="text-[9px] font-mono font-bold bg-zinc-100 dark:bg-[#252f48] text-zinc-600 dark:text-zinc-300 px-1.5 rounded-[2px] border border-zinc-200 dark:border-transparent">
                                                                        {j.regnr}
                                                                    </span>
                                                                    <span className={`text-[8px] font-black uppercase tracking-tight ${j.status === 'KLAR' ? 'text-emerald-600 dark:text-emerald-500' : 'theme-text'}`}>
                                                                        {j.status}
                                                                    </span>
                                                                </div>
                                                            </div>

                                                            <div className="text-right shrink-0">
                                                                    <div className="text-[13px] font-mono font-black text-zinc-900 dark:text-white leading-none">
                                                                    {(parseInt(j.kundpris) || 0).toLocaleString()} <span className="text-[9px] text-zinc-400 dark:text-zinc-500 font-sans">kr</span>
                                                                </div>
                                                            </div>
                                                        </div>

                                                        {j.kommentar && (
                                                            <div className="mt-2 flex items-start gap-1.5 text-[10px] text-zinc-500 dark:text-zinc-400 italic bg-zinc-50/50 dark:bg-[#0a0f18]/50 p-2 rounded-sm border-l-2 border-zinc-200 dark:border-white/10">
                                                                    <SafeIcon name="message-square" size={10} className="text-zinc-300 dark:text-zinc-600 shrink-0 mt-[2px]" />
                                                                <span className="line-clamp-2 leading-relaxed">{j.kommentar}</span>
                                                            </div>
                                                        )}
                                                    </div>

                                                    <div className="self-center pl-1 opacity-20 group-hover:opacity-100 transition-opacity text-zinc-900 dark:text-white">
                                                        <SafeIcon name="chevron-right" size={16} />
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                }) : (
                                    <div className="p-12 text-center text-zinc-300 dark:text-zinc-600 font-black uppercase tracking-[0.2em] text-[9px]">
                                        <SafeIcon name="database-zap" size={24} className="mb-2 opacity-50 mx-auto" />
                                        No_Logs_Found
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="bg-white dark:bg-[#182032] border border-zinc-200 dark:border-white/5 rounded-xl p-6 shadow-xl dark:shadow-none relative overflow-hidden">
                            <div className="text-[10px] font-black text-zinc-400 dark:text-zinc-500 uppercase tracking-widest mb-6 flex items-center justify-between relative z-10">
                                <div className="flex items-center gap-2"><SafeIcon name="cpu" size={14} /> Asset_Inventory_Registry</div>
                                <span className="text-zinc-950 dark:text-white bg-zinc-100 dark:bg-[#1a2235] px-3 py-1 rounded-full text-[10px] font-mono font-bold border border-zinc-200 dark:border-white/10">{selectedCustomer.vehicles.size} NODES</span>
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3 relative z-10">
                                {Array.from(selectedCustomer.vehicles).map(v => (
                                    <div key={v} className="bg-zinc-50 dark:bg-[#0a0f18] border border-zinc-200 dark:border-white/10 p-4 hover:border-zinc-900 dark:hover:border-zinc-500 hover:bg-white dark:hover:bg-[#1a2235] transition-all group flex items-center justify-between cursor-default">
                                        <div className="flex items-center gap-3">
                                            <SafeIcon name="truck" size={16} className="text-zinc-300 dark:text-zinc-600 group-hover:theme-text" />
                                            <span className="text-sm font-mono font-black text-zinc-800 dark:text-zinc-200 tracking-widest uppercase">{v}</span>
                                        </div>
                                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_8px_#10b981]"></div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="bg-zinc-50 dark:bg-[#0f1522]/50 p-6 shadow-inner relative overflow-hidden group">
                            <div className="absolute top-0 left-0 w-1.5 h-full theme-bg shadow-[0_0_15px_rgba(249,115,22,0.5)]"></div>
                            <div className="relative z-10">
                                <div className="text-[8px] font-black theme-text uppercase mb-4 tracking-[0.4em] flex items-center gap-2">
                                    <SafeIcon name="info" size={10} /> Customers_View
                                </div>
                                <p className="text-white text-[10px] font-medium leading-relaxed italic opacity-90 border-l border-zinc-800 dark:border-white/10 pl-4">
                                    "Kunden uppvisar ett lojalt beteendemönster med fokus på {selectedCustomer.topVehicle}. {selectedCustomer.isChurned ? 'Varning: Signalstyrkan har minskat då enheten inte besökt basen på länge.' : 'Signalstyrkan är optimal.'} Rekommenderar riktad service-optimering."
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6 animate-in fade-in duration-500 pb-20 bg-transparent">
            <div className="flex flex-col md:flex-row md:items-center justify-between mb-4 pb-4 border-b border-zinc-200 dark:border-white/5 gap-4 px-5 pt-5 lg:px-0 lg:pt-0">
                <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-orange-500 rounded-[4px] flex items-center justify-center text-black font-bold shadow-[0_0_20px_rgba(249,115,22,0.3)] shrink-0">
                        <SafeIcon name="users" size={20} />
                    </div>
                    <div className="flex flex-col">
                        <h1 className="text-xl md:text-2xl font-black text-black dark:text-white uppercase tracking-[-0.03em] leading-none drop-shadow-sm dark:drop-shadow-none">
                            CUSTOMER <span className="text-zinc-500 dark:text-zinc-500">DATABASE</span>
                        </h1>
                        <p className="text-[11px] font-bold text-zinc-500 uppercase tracking-widest mt-1.5">
                            Översikt & Analys // Totalt: {customerData.length} st
                        </p>
                    </div>
                </div>

                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4">
                    <div className="flex bg-white dark:bg-[#182032] border border-zinc-200 dark:border-white/5 p-1 rounded-md shadow-sm dark:shadow-md justify-between sm:justify-start">
                        {[
                            { id: 'revenue', icon: 'dollar-sign' },
                            { id: 'count', icon: 'hash' },
                            { id: 'recent', icon: 'clock' }
                        ].map(m => (
                            <button 
                                key={m.id}
                                onClick={() => setSortMode(m.id)}
                                className={`p-2 transition-all flex-1 sm:flex-none flex justify-center rounded-[4px] ${sortMode === m.id ? 'bg-zinc-100 dark:bg-[#25324d] text-zinc-900 dark:text-white shadow-sm' : 'text-zinc-500 hover:text-zinc-900 dark:hover:text-white'}`}
                            >
                                <SafeIcon name={m.icon} size={14} />
                            </button>
                        ))}
                    </div>

                    <div className="relative group">
                        <input 
                            type="text" 
                            placeholder="SÖK KUND ELLER FORDON..." 
                            className="bg-white dark:bg-[#182032] border border-zinc-200 dark:border-white/5 focus:border-orange-500 dark:focus:border-orange-500 p-2.5 pl-9 text-[11px] font-bold text-zinc-900 dark:text-white outline-none w-full md:w-64 transition-all uppercase tracking-widest placeholder:text-zinc-400 dark:placeholder:text-zinc-500 shadow-sm dark:shadow-md rounded-md"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                        <SafeIcon name="search" size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400 dark:text-zinc-500 group-focus-within:text-orange-500 transition-colors" />
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-2 md:gap-4 px-4 md:px-0">
                {customerData.map((customer, i) => (
                    <div 
                        key={i} 
                        onClick={() => setView('CUSTOMERS', { selectedCustomer: customer })}
                        className="group bg-white dark:bg-[#182032] border border-zinc-200 dark:border-white/5 hover:border-zinc-300 dark:hover:border-white/20 transition-all cursor-pointer relative overflow-hidden flex flex-col h-[180px] hover:-translate-y-1 shadow-sm dark:shadow-md rounded-xl"
                    >
                        <div className="absolute -bottom-6 -right-4 text-[80px] font-black text-zinc-50 dark:text-[#1a2235]/40 group-hover:theme-text/5 transition-colors pointer-events-none italic select-none">
                            {customer.rank[0]}
                        </div>

                        <div className="p-5 flex-1 relative z-10">
                            <div className="flex justify-between items-start mb-3">
                                <RankBadge rank={customer.rank} />
                                <div className="text-[10px] font-mono font-black text-zinc-300 dark:text-zinc-600">#{i + 1}</div>
                            </div>
                            <h3 className="text-[14px] font-black text-zinc-900 dark:text-white uppercase leading-tight mb-4 group-hover:theme-text transition-colors truncate">{customer.name}</h3>
                            <div className="grid grid-cols-2 border-t border-zinc-50 dark:border-[#1a2235] pt-3 gap-2">
                                <div>
                                    <div className="text-[7px] font-black text-zinc-400 dark:text-zinc-500 uppercase">Revenue_Sum</div>
                                    <div className="text-xs font-mono font-black text-zinc-900 dark:text-zinc-300 italic">{(customer.totalSpent / 1000).toFixed(1)}k</div>
                                </div>
                                <div className="text-right">
                                    <div className="text-[7px] font-black text-zinc-400 dark:text-zinc-500 uppercase">Ops_Count</div>
                                    <div className="text-xs font-mono font-black text-zinc-900 dark:text-zinc-300">{customer.missionCount}x</div>
                                </div>
                            </div>
                        </div>

                        <div className="mt-auto bg-zinc-50 dark:bg-[#0f1522]/50 p-3 flex items-center justify-between border-t border-zinc-100 dark:border-white/5 transition-colors">
                            <div className="flex items-center gap-2">
                                <div className={`w-1.5 h-1.5 rounded-full ${Math.floor((new Date() - new Date(customer.lastSeen)) / (1000 * 60 * 60 * 24)) < 45 ? 'bg-emerald-500 animate-pulse' : 'bg-zinc-700'}`}></div>
                                <span className="text-[9px] font-mono font-bold text-zinc-400 uppercase truncate max-w-[80px]">{customer.topVehicle}</span>
                            </div>
                            <SafeIcon name="arrow-right" size={12} className="text-zinc-600 dark:text-zinc-500 group-hover:theme-text transition-all group-hover:translate-x-1" />
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};
