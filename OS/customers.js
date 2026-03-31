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

// Färg-generator för avatarer
const getAvatarTheme = (name) => {
    if (!name) return 'bg-zinc-100 text-zinc-600 border-zinc-200 dark:bg-[#182032] dark:text-zinc-400 dark:border-white/5';
    const themes = [
        'bg-blue-50 text-blue-600 border-blue-200 dark:bg-blue-500/10 dark:text-blue-400 dark:border-blue-500/20',
        'bg-emerald-50 text-emerald-600 border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20',
        'bg-violet-50 text-violet-600 border-violet-200 dark:bg-violet-500/10 dark:text-violet-400 dark:border-violet-500/20',
        'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-500/10 dark:text-amber-400 dark:border-amber-500/20',
        'bg-rose-50 text-rose-600 border-rose-200 dark:bg-rose-500/10 dark:text-rose-400 dark:border-rose-500/20',
        'bg-cyan-50 text-cyan-600 border-cyan-200 dark:bg-cyan-500/10 dark:text-cyan-400 dark:border-cyan-500/20'
    ];
    let hash = 0;
    for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
    return themes[Math.abs(hash) % themes.length];
};

window.CustomersView = ({ allJobs, setView, setEditingJob, viewParams }) => {
    const [searchQuery, setSearchQuery] = React.useState('');
    const [selectedCustomer, setSelectedCustomer] = React.useState(null);
    const [sortMode, setSortMode] = React.useState('revenue'); 
    const [logSearch, setLogSearch] = React.useState('');
    const [visibleCount, setVisibleCount] = React.useState(20);
    
    // NYTT: State för att visa fler än 4 fordon i detaljvyn
    const [showAllVehicles, setShowAllVehicles] = React.useState(false);

    React.useEffect(() => {
        if (viewParams && viewParams.selectedCustomer) {
            setSelectedCustomer(viewParams.selectedCustomer);
        } else {
            setSelectedCustomer(null);
        }
        setShowAllVehicles(false); // Återställ alltid till max 4 fordon när en ny kund öppnas
    }, [viewParams]);

    React.useEffect(() => {
        setVisibleCount(20);
    }, [searchQuery, sortMode]);

    const customerData = React.useMemo(() => {
        const groups = allJobs.reduce((acc, job) => {
            const name = job.kundnamn || 'Oidentifierad Enhet';
            if (!acc[name]) {
                acc[name] = {
                    name: name, totalSpent: 0, missionCount: 0, vehicles: new Set(),
                    lastSeen: job.datum, jobs: [], avgValue: 0, rank: 'C-TIER', topVehicle: '', packageStats: {}
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

    const visibleCustomers = customerData.slice(0, visibleCount);
    const hasMore = visibleCount < customerData.length;

    const RankBadge = ({ rank }) => {
        const colors = {
            'S-TIER': 'bg-gradient-to-r from-orange-500 to-orange-600 text-white shadow-[0_0_10px_rgba(249,115,22,0.4)] border border-orange-400',
            'A-TIER': 'bg-zinc-900 dark:bg-white/10 text-orange-400 border border-orange-500/30',
            'B-TIER': 'bg-zinc-100 dark:bg-white/5 text-zinc-600 dark:text-zinc-300 border border-zinc-200 dark:border-white/10',
            'C-TIER': 'bg-transparent text-zinc-400 border border-zinc-200 dark:border-white/5 opacity-60'
        };
        return (
            <span className={`text-[8px] font-black px-1.5 py-0.5 rounded shadow-sm tracking-widest uppercase ${colors[rank] || colors['C-TIER']}`}>
                {rank}
            </span>
        );
    };

    // --- DETALJVY FÖR SPECIFIK KUND ---
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

        // Logik för att begränsa antal fordon
        const vehiclesArray = Array.from(selectedCustomer.vehicles);
        const displayedVehicles = showAllVehicles ? vehiclesArray : vehiclesArray.slice(0, 4);

        return (
            <div className="relative max-w-5xl animate-in fade-in slide-in-from-left-4 duration-700 pb-0 ml-0 w-full">
                {/* Ambient Glow */}
                <div className="absolute top-0 left-[-10%] w-[80%] h-[400px] bg-orange-500/10 dark:bg-orange-500/5 blur-[120px] rounded-full pointer-events-none -z-10 hidden lg:block"></div>

                {/* HEADER (Detaljvy) */}
                <div className="flex flex-col md:flex-row md:items-center justify-between mb-4 pb-6 border-b border-zinc-200 dark:border-white/5 gap-4 px-4 pt-5 lg:px-0 lg:pt-0">
                    <div className="flex items-center gap-4 md:gap-5">
                        <button onClick={() => window.history.back()} className="group shrink-0 relative w-12 h-12 md:w-14 md:h-14 flex items-center justify-center bg-white dark:bg-[#182032] border border-zinc-200 dark:border-white/5 text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white transition-all rounded-xl md:rounded-2xl shadow-sm">
                            <SafeIcon name="arrow-left" size={24} className="group-hover:-translate-x-1 transition-transform" />
                        </button>
                        <div className="flex flex-col">
                            <div className="flex items-center gap-3">
                                <h1 className="text-2xl md:text-3xl font-black text-zinc-900 dark:text-white uppercase tracking-tight leading-none truncate max-w-[200px] sm:max-w-md">
                                    {selectedCustomer.name}
                                </h1>
                                <RankBadge rank={selectedCustomer.rank} />
                            </div>
                            <p className="text-[10px] md:text-[11px] font-bold text-orange-500 dark:text-orange-400 uppercase tracking-widest mt-1.5 flex items-center gap-2">
                                <span className={`w-1.5 h-1.5 rounded-full ${daysSinceLast < 45 ? 'bg-emerald-500 animate-pulse' : 'bg-red-500'}`}></span>
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

                {/* DETALJVY INNEHÅLL */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 px-4 lg:px-2">
                    {/* Sidebar Stats */}
                    <div className="lg:col-span-4 space-y-6">
                        {/* Loyalty Card (Nu i Mörkblått tema för konsekvens) */}
                        <div className="bg-white/80 dark:bg-[#182032]/80 backdrop-blur-xl p-8 rounded-3xl relative overflow-hidden border border-zinc-200/80 dark:border-white/5 shadow-sm">
                            <div className="relative z-10">
                                <SectionHeader title="Loyalty_Pulse" sub="Retention Analysis" icon="activity" />
                                <div className="text-6xl font-light tracking-tighter text-zinc-900 dark:text-white mb-6">
                                    {loyaltyScore}<span className="text-xl text-orange-500 font-bold ml-1">%</span>
                                </div>
                                <div className="h-2 w-full bg-zinc-200 dark:bg-white/10 rounded-full overflow-hidden">
                                    <div className="h-full bg-gradient-to-r from-orange-400 to-orange-600 shadow-[0_0_15px_rgba(249,115,22,0.6)] transition-all duration-1000" style={{ width: `${loyaltyScore}%` }}></div>
                                </div>
                            </div>
                            <SafeIcon name="activity" size={120} className="absolute -right-8 -bottom-8 text-zinc-100 dark:text-white opacity-[0.03]" />
                        </div>

                        {/* Status Grid */}
                        <div className="grid grid-cols-1 gap-4">
                            <div className="bg-white/80 dark:bg-[#182032]/80 backdrop-blur-xl p-6 rounded-3xl border border-zinc-200/80 dark:border-white/5 shadow-sm">
                                <div className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-4">Signal_Staleness</div>
                                <div className="flex items-center justify-between">
                                    <div className="text-2xl font-mono font-black text-zinc-900 dark:text-white">{daysSinceLast}d</div>
                                    <span className="text-[9px] font-bold text-zinc-500 uppercase">Since Last Mission</span>
                                </div>
                            </div>

                            <div className="bg-white/80 dark:bg-[#182032]/80 backdrop-blur-xl p-6 rounded-3xl border border-zinc-200/80 dark:border-white/5 shadow-sm">
                                <SectionHeader title="Affinity_Map" sub="Service Distribution" icon="rss" />
                                <div className="space-y-4 mt-2">
                                    {Object.entries(selectedCustomer.packageStats).map(([pkg, count]) => (
                                        <div key={pkg} className="group">
                                            <div className="flex justify-between text-[10px] font-bold uppercase mb-2 text-zinc-600 dark:text-zinc-400">
                                                <span className="group-hover:text-orange-500 transition-colors">{pkg}</span>
                                                <span className="font-mono text-zinc-900 dark:text-white">{Math.round((count / selectedCustomer.missionCount) * 100)}%</span>
                                            </div>
                                            <div className="w-full bg-zinc-100 dark:bg-[#1a2235] h-1.5 rounded-full overflow-hidden">
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
                                <div key={i} className="bg-white/80 dark:bg-[#182032]/80 backdrop-blur-xl border border-zinc-200/80 dark:border-white/5 rounded-2xl p-5 hover:shadow-xl hover:shadow-orange-500/5 transition-all group">
                                    <div className="text-[9px] font-bold text-zinc-400 uppercase tracking-widest mb-3 flex items-center justify-between">
                                        {s.label} <SafeIcon name={s.icon} size={12} className="group-hover:text-orange-500 transition-colors" />
                                    </div>
                                    <div className={`text-xl font-mono font-black ${s.color}`}>{s.val}</div>
                                    <div className="text-[9px] font-bold text-zinc-400 dark:text-zinc-500 uppercase mt-1 tracking-tighter">{s.unit} Total</div>
                                </div>
                            ))}
                        </div>

                        {/* KOMPAKT ASSET INVENTORY CARD (Mörkblått tema + Visa Mer) */}
                        <div className="bg-white/80 dark:bg-[#182032]/80 backdrop-blur-xl border border-zinc-200/80 dark:border-white/5 rounded-3xl p-6 md:p-8 shadow-sm">
                            <SectionHeader title="Asset_Inventory_Registry" sub="Registered Operational Nodes" icon="truck" />
                            <div className="flex flex-wrap gap-2 md:gap-3">
                                {displayedVehicles.map(v => (
                                    <div key={v} className="bg-zinc-50/80 dark:bg-[#1a2235] border border-zinc-200 dark:border-white/5 px-3 py-1.5 rounded-lg hover:border-orange-500/50 transition-all group flex items-center gap-2 w-auto shadow-sm">
                                        <SafeIcon name="truck" size={12} className="text-zinc-400 group-hover:text-orange-500 transition-colors" />
                                        <span className="text-[11px] font-mono font-bold text-zinc-800 dark:text-zinc-200 tracking-wider uppercase pt-[1px]">{v}</span>
                                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_6px_#10b981] ml-1"></div>
                                    </div>
                                ))}
                                
                                {/* Knappen "Visa Fler" visas bara om det finns fler än 4 fordon */}
                                {vehiclesArray.length > 4 && !showAllVehicles && (
                                    <button 
                                        onClick={() => setShowAllVehicles(true)}
                                        className="bg-zinc-100 dark:bg-[#1f2940] border border-zinc-200 dark:border-white/5 px-3 py-1.5 rounded-lg hover:bg-zinc-200 dark:hover:bg-[#25324d] transition-all flex items-center gap-2 text-[11px] font-bold text-zinc-600 dark:text-zinc-300 uppercase shadow-sm"
                                    >
                                        <SafeIcon name="plus" size={12} />
                                        Visa {vehiclesArray.length - 4} till
                                    </button>
                                )}
                            </div>
                        </div>

                        {/* Mission Log Card */}
                        <div className="bg-white/80 dark:bg-[#182032]/80 backdrop-blur-xl border border-zinc-200/80 dark:border-white/5 rounded-3xl shadow-sm overflow-hidden flex flex-col">
                            <div className="bg-zinc-50/50 dark:bg-[#1a2235]/50 p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-zinc-200/50 dark:border-white/10">
                                <SectionHeader title="Mission_Log_Buffer" sub={`Sequence History [${selectedCustomer.jobs.length}]`} icon="database" />
                                <div className="relative group">
                                    <input 
                                        type="text" 
                                        placeholder="FILTER LOGS..." 
                                        className="bg-white dark:bg-[#1a2235] border border-zinc-200 dark:border-white/10 text-[11px] font-bold text-zinc-900 dark:text-white px-10 py-3 outline-none focus:border-orange-500 w-full md:w-56 uppercase tracking-widest rounded-xl transition-all shadow-sm"
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
                                            className="group p-5 hover:bg-zinc-50 dark:hover:bg-[#1f2940] transition-all cursor-pointer border-l-4 border-transparent hover:border-orange-500"
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
                    </div>
                </div>
            </div>
        );
    }

    // --- HUVUDLISTA MED KUNDER ---
    return (
        <div className="relative max-w-[1400px] w-full animate-in fade-in slide-in-from-left-4 duration-700 pb-0 ml-0">
            {/* Ambient Background Glow */}
            <div className="absolute top-0 left-[-10%] w-[60%] h-[400px] bg-orange-500/10 dark:bg-orange-500/5 blur-[120px] rounded-full pointer-events-none -z-10 hidden lg:block"></div>

            {/* HEADER (Huvudvy) */}
            <div className="flex flex-col md:flex-row md:items-center justify-between mb-4 pb-6 border-b border-zinc-200 dark:border-white/5 gap-4 px-4 pt-5 lg:px-0 lg:pt-0">
                <div className="flex items-center gap-4 md:gap-5">
                    {/* Standardiserad, glödande Premium-ikon */}
                    <div className="relative group cursor-default shrink-0">
                        <div className="absolute inset-0 bg-orange-500/40 blur-xl rounded-full transition-all duration-700 group-hover:bg-orange-500/60" />
                        <div className="relative w-12 h-12 md:w-14 md:h-14 rounded-xl md:rounded-2xl flex items-center justify-center text-white shadow-xl border border-white/20 transition-colors bg-gradient-to-br from-orange-400 to-orange-600">
                            <SafeIcon name="users" size={24} />
                        </div>
                    </div>
                    <div className="flex flex-col">
                        <h1 className="text-2xl md:text-3xl font-black text-black dark:text-white uppercase tracking-tight leading-none drop-shadow-sm dark:drop-shadow-none">
                            CUSTOMER <span className="text-zinc-500 dark:text-zinc-500 font-light">DATABASE</span>
                        </h1>
                        <p className="text-[10px] md:text-[11px] font-bold text-orange-500 dark:text-orange-400 uppercase tracking-widest mt-1.5 flex items-center gap-2">
                            <span className="w-1.5 h-1.5 rounded-full bg-orange-500 animate-pulse"></span>
                            Översikt & Analys // Totalt: {customerData.length} st
                        </p>
                    </div>
                </div>

                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 z-10">
                    {/* Sort Controls */}
                    <div className="flex bg-white dark:bg-[#1a2235] p-1 border border-zinc-200 dark:border-white/5 rounded-xl shadow-sm">
                        {[
                            { id: 'revenue', icon: 'dollar-sign', tooltip: 'Revenue' },
                            { id: 'count', icon: 'hash', tooltip: 'Visits' },
                            { id: 'recent', icon: 'clock', tooltip: 'Recent' }
                        ].map(m => (
                            <button 
                                key={m.id}
                                onClick={() => setSortMode(m.id)}
                                className={`py-2.5 px-4 transition-all flex-1 sm:flex-none flex justify-center rounded-lg ${sortMode === m.id ? 'bg-zinc-100 dark:bg-[#2a3441] text-zinc-900 dark:text-white shadow-sm' : 'text-zinc-400 hover:text-zinc-900 dark:hover:text-white'}`}
                                title={m.tooltip}
                            >
                                <SafeIcon name={m.icon} size={16} />
                            </button>
                        ))}
                    </div>

                    <div className="relative group">
                        <input 
                            type="text" 
                            placeholder="SÖK KUND..." 
                            className="bg-white/80 dark:bg-[#1a2235]/80 backdrop-blur-md border border-zinc-200/80 dark:border-white/10 focus:border-orange-500 p-3.5 pl-12 text-[12px] font-bold text-zinc-900 dark:text-white outline-none w-full md:w-64 transition-all uppercase tracking-widest placeholder:text-zinc-400 rounded-2xl shadow-sm"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                        <SafeIcon name="search" size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400 group-focus-within:text-orange-500 transition-colors" />
                    </div>
                </div>
            </div>

            {/* NY LISTVY (Superkompakt, Säkra borders, Minimalt tomrum i botten) */}
            <div className="bg-white/80 dark:bg-[#182032]/80 backdrop-blur-xl rounded-2xl shadow-sm border border-zinc-200/80 dark:border-white/5 overflow-hidden flex flex-col mx-4 lg:mx-2 mb-0">
                
                <div className="hidden md:flex items-center px-6 py-3 bg-zinc-50/50 dark:bg-black/20 border-b border-zinc-200 dark:border-white/10 text-[9px] uppercase tracking-widest font-bold text-zinc-400 dark:text-zinc-500">
                    <div className="w-1/3 pl-1">Kund & ID</div>
                    <div className="w-1/6">Klassificering</div>
                    <div className="w-1/6">Uppdrag</div>
                    <div className="w-1/6 text-right">Omsättning</div>
                    <div className="w-1/6 text-right pr-12">Senast Aktiv</div>
                </div>

                <div className="flex flex-col">
                    {customerData.length === 0 ? (
                        <div className="p-12 text-center text-zinc-400 uppercase tracking-widest text-[11px] font-bold">
                            <SafeIcon name="users" size={32} className="mb-3 opacity-20 mx-auto" />
                            Inga kunder hittades
                        </div>
                    ) : (
                        <>
                            {visibleCustomers.map((customer, i) => {
                                const initials = customer.name.split(' ').map(n => n[0]).join('').substring(0,2).toUpperCase();
                                const avatarTheme = getAvatarTheme(customer.name);
                                const daysSinceLast = Math.floor((new Date() - new Date(customer.lastSeen)) / (1000 * 60 * 60 * 24));
                                const isActive = daysSinceLast < 45;

                                return (
                                    <div 
                                        key={i} 
                                        onClick={() => { setSelectedCustomer(customer); setShowAllVehicles(false); }}
                                        className="group flex flex-col md:flex-row md:items-center justify-between p-3 md:px-6 md:py-2.5 bg-transparent hover:bg-zinc-50 dark:hover:bg-[#1f2940] cursor-pointer transition-colors border-b border-zinc-100 dark:border-white/5 last:border-0"
                                    >
                                        <div className="md:hidden flex items-center w-full gap-3">
                                            <div className={`w-9 h-9 rounded-full flex items-center justify-center text-[11px] font-bold shrink-0 border ${avatarTheme}`}>
                                                {initials}
                                            </div>
                                            <div className="flex flex-col min-w-0 flex-1">
                                                <div className="flex justify-between items-center mb-0.5">
                                                    <span className="text-[13px] font-bold text-zinc-900 dark:text-white truncate pr-2 leading-none">
                                                        {customer.name}
                                                    </span>
                                                    <RankBadge rank={customer.rank} />
                                                </div>
                                                <div className="flex items-center justify-between text-[10px] font-mono leading-none mt-1">
                                                    <span className="text-zinc-500 dark:text-zinc-400">
                                                        <span className="text-zinc-800 dark:text-zinc-200 font-bold">{customer.missionCount}x</span> op
                                                    </span>
                                                    <span className="text-zinc-500 dark:text-zinc-400">
                                                        <span className="text-zinc-800 dark:text-zinc-200 font-bold">{(customer.totalSpent / 1000).toFixed(1)}k</span> sek
                                                    </span>
                                                </div>
                                            </div>
                                            <SafeIcon name="chevron-right" size={16} className="text-zinc-300 dark:text-zinc-600 shrink-0 ml-1 group-hover:text-orange-500" />
                                        </div>

                                        <div className="hidden md:flex flex-row items-center w-full">
                                            <div className="flex items-center gap-3 w-1/3">
                                                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0 border ${avatarTheme}`}>
                                                    {initials}
                                                </div>
                                                <span className="text-[13px] font-bold text-zinc-900 dark:text-white truncate group-hover:text-orange-500 transition-colors">
                                                    {customer.name}
                                                </span>
                                            </div>

                                            <div className="w-1/6">
                                                <RankBadge rank={customer.rank} />
                                            </div>

                                            <div className="w-1/6">
                                                <span className="text-[12px] font-mono font-bold text-zinc-700 dark:text-zinc-300">
                                                    {customer.missionCount}x
                                                </span>
                                            </div>

                                            <div className="w-1/6 text-right">
                                                <span className="text-[13px] font-mono font-black text-zinc-900 dark:text-white">
                                                    {(customer.totalSpent / 1000).toFixed(1)}k
                                                </span>
                                            </div>

                                            <div className="flex items-center justify-end w-1/6 pr-4">
                                                <div className="flex items-center gap-1.5 mr-6">
                                                    <span className={`w-1.5 h-1.5 rounded-full ${isActive ? 'bg-emerald-500' : 'bg-red-500'}`}></span>
                                                    <span className="text-[12px] font-mono font-medium text-zinc-700 dark:text-zinc-300">
                                                        {daysSinceLast}d
                                                    </span>
                                                </div>
                                                <div className="shrink-0 opacity-0 group-hover:opacity-100 transition-all -translate-x-2 group-hover:translate-x-0">
                                                    <SafeIcon name="chevron-right" size={16} className="text-zinc-300 dark:text-zinc-600 group-hover:text-orange-500 transition-colors" />
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                            
                            {/* KNAPP FÖR ATT VISA FLER */}
                            {hasMore && (
                                <div className="flex justify-center p-4 border-t border-zinc-200 dark:border-white/5 bg-zinc-50/30 dark:bg-white/[0.01]">
                                    <button onClick={() => setVisibleCount(prev => prev + 20)} className="px-6 py-2.5 bg-white dark:bg-[#1a2235] border border-zinc-200 dark:border-white/10 hover:bg-zinc-50 dark:hover:bg-white/5 text-zinc-600 dark:text-zinc-300 text-[11px] font-bold uppercase tracking-widest rounded-xl shadow-sm transition-colors flex items-center gap-2">
                                        Visa fler <span className="opacity-50">({customerData.length - visibleCount} kvar)</span>
                                    </button>
                                </div>
                            )}
                        </>
                    )}
                </div>
            </div>
        </div>
    );
};
