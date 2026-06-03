// customers.js

const SafeIcon = ({ name, size = 14, className = "" }) => (
    <span className="inline-flex items-center justify-center shrink-0">
        <window.Icon name={name} size={size} className={className} />
    </span>
);

const SectionHeader = ({ title, sub, icon }) => (
    <div className="flex items-start gap-3 mb-4 sm:mb-5 pb-3 sm:pb-4 border-b border-zinc-200/50 dark:border-white/5">
        <div className="mt-1 h-5 w-1 bg-gradient-to-b from-orange-400 to-orange-600 rounded-full shadow-[0_0_10px_rgba(249,115,22,0.4)]" />
        <div>
            <div className="flex items-center gap-2 text-zinc-900 dark:text-white">
                <SafeIcon name={icon} size={14} className="text-zinc-400 dark:text-zinc-500" />
                <h3 className="text-[12px] sm:text-[13px] font-bold uppercase tracking-widest">{title}</h3>
            </div>
            {sub && <p className="text-[9px] sm:text-[10px] font-medium uppercase tracking-[0.15em] text-zinc-400 dark:text-zinc-500 mt-0.5">{sub}</p>}
        </div>
    </div>
);

const getAvatarTheme = (name) => {
    if (!name) return 'bg-zinc-100 text-zinc-600 border-zinc-200 dark:bg-[#182032] dark:text-zinc-400 dark:border-white/5';
    const themes = [
        'bg-blue-50/50 text-blue-600 border-blue-200 dark:bg-blue-500/10 dark:text-blue-400 dark:border-blue-500/20',
        'bg-emerald-50/50 text-emerald-600 border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20',
        'bg-violet-50/50 text-violet-600 border-violet-200 dark:bg-violet-500/10 dark:text-violet-400 dark:border-violet-500/20',
        'bg-amber-50/50 text-amber-700 border-amber-200 dark:bg-amber-500/10 dark:text-amber-400 dark:border-amber-500/20',
        'bg-rose-50/50 text-rose-600 border-rose-200 dark:bg-rose-500/10 dark:text-rose-400 dark:border-rose-500/20',
        'bg-cyan-50/50 text-cyan-600 border-cyan-200 dark:bg-cyan-500/10 dark:text-cyan-400 dark:border-cyan-500/20'
    ];
    let hash = 0;
    for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
    return themes[Math.abs(hash) % themes.length];
};

const LicensePlate = ({ regnr, size = 'md' }) => {
    if (!regnr || regnr === '-' || regnr.length > 8 || regnr.toLowerCase() === 'okänt') {
        return (
            <div className="bg-zinc-100 dark:bg-[#2a3441] border border-zinc-200 dark:border-white/10 rounded px-2.5 py-1 flex items-center justify-center shadow-sm shrink-0">
                <span className="font-mono font-bold text-zinc-500 dark:text-zinc-400 uppercase text-[10px] tracking-widest">{regnr && regnr !== '-' ? regnr : 'OKÄNT'}</span>
            </div>
        );
    }
    
    const sizes = { sm: 'h-[20px] text-[10px] w-[10px] pt-[1px]', md: 'h-[24px] text-[12px] w-[12px] pt-[1px]', lg: 'h-[30px] text-[15px] w-[16px] pt-[2px]' };
    
    return (
        <div className={`inline-flex items-center rounded border overflow-hidden relative shadow-sm bg-white dark:bg-[#1a2235] border-zinc-300 dark:border-[#2a3441] shrink-0 ${sizes[size].split(' ')[0]}`}>
            <div className={`bg-[#003399] h-full flex flex-col items-center justify-between shrink-0 border-r border-zinc-300 dark:border-[#2a3441] ${sizes[size].split(' ')[2]} py-[2px]`}>
                <div className="w-[60%] aspect-square rounded-full border-[1px] border-[#ffcc00] mt-[1px]"></div>
                <span className={`font-sans font-black text-white leading-none ${size === 'sm' ? 'text-[5px]' : size === 'md' ? 'text-[6px]' : 'text-[9px]'} mb-[1px]`}>S</span>
            </div>
            <div className="flex h-full items-center justify-center px-2.5">
                <span className={`font-mono font-black text-zinc-900 dark:text-zinc-200 tracking-[0.1em] uppercase leading-none ${sizes[size].split(' ')[1]} ${sizes[size].split(' ')[3]}`}>
                    {regnr}
                </span>
            </div>
        </div>
    );
};

window.CustomersView = ({ allJobs, setView, setEditingJob, viewParams }) => {
    const [searchQuery, setSearchQuery] = React.useState('');
    const [selectedCustomer, setSelectedCustomer] = React.useState(null);
    
    const [sortMode, setSortMode] = React.useState('revenue'); 
    const [statusFilter, setStatusFilter] = React.useState('all'); 
    const [viewMode, setViewMode] = React.useState('GRID'); 
    
    const [logSearch, setLogSearch] = React.useState('');
    const [visibleCount, setVisibleCount] = React.useState(20);
    const [showAllVehicles, setShowAllVehicles] = React.useState(false);
    const [historyVisible, setHistoryVisible] = React.useState(10);
    const [vehicleModels, setVehicleModels] = React.useState({});

    React.useEffect(() => {
        if (window.lucide) window.lucide.createIcons();
    });

    React.useEffect(() => {
        if (viewParams && viewParams.selectedCustomer) {
            setSelectedCustomer(viewParams.selectedCustomer);
        } else {
            setSelectedCustomer(null);
        }
        setShowAllVehicles(false);
        setHistoryVisible(10);
    }, [viewParams]);

    React.useEffect(() => {
        setVisibleCount(20);
    }, [searchQuery, sortMode, statusFilter]);

    React.useEffect(() => {
        let isMounted = true;
        const fetchVehicleModels = async () => {
            if (!selectedCustomer) return;
            const newModels = {};
            selectedCustomer.jobs.forEach(j => {
                if (j.regnr && j.regnr !== '-' && j.bilmodell) {
                    const bm = j.bilmodell.toLowerCase();
                    if (bm !== 'okänd modell' && !bm.includes('kaffepaus')) {
                        newModels[j.regnr.toUpperCase()] = j.bilmodell;
                    }
                }
            });
            if (isMounted) setVehicleModels(prev => ({ ...prev, ...newModels }));
            if (window.db) {
                for (let regnr of Array.from(selectedCustomer.vehicles)) {
                    if (regnr === '-' || regnr.toLowerCase() === 'okänt' || newModels[regnr]) continue;
                    try {
                        const doc = await window.db.collection('vehicleSpecs').doc(regnr).get();
                        if (doc.exists && doc.data().model && isMounted) {
                            const dbModel = doc.data().model;
                            if (!dbModel.toLowerCase().includes('kaffepaus')) {
                                setVehicleModels(prev => ({ ...prev, [regnr]: dbModel }));
                            }
                        }
                    } catch (e) {}
                }
            }
        };
        fetchVehicleModels();
        return () => { isMounted = false; };
    }, [selectedCustomer]);

    const customerData = React.useMemo(() => {
        const groups = allJobs.reduce((acc, job) => {
            const name = job.kundnamn || 'Oidentifierad Kund';
            if (!acc[name]) {
                acc[name] = {
                    name: name, totalSpent: 0, missionCount: 0, vehicles: new Set(),
                    lastSeen: job.datum, firstSeen: job.datum, jobs: [], avgValue: 0, rank: 'Standard', packageStats: {}
                };
            }
            const price = parseInt(job.kundpris) || 0;
            acc[name].totalSpent += price;
            acc[name].missionCount += 1;
            acc[name].jobs.push(job);
            
            const pkg = job.paket || 'Standard';
            acc[name].packageStats[pkg] = (acc[name].packageStats[pkg] || 0) + 1;

            if (job.regnr && job.regnr !== '-') acc[name].vehicles.add(job.regnr.toUpperCase());
            
            if (job.datum) {
                if (!acc[name].lastSeen || new Date(job.datum) > new Date(acc[name].lastSeen)) acc[name].lastSeen = job.datum;
                if (!acc[name].firstSeen || new Date(job.datum) < new Date(acc[name].firstSeen)) acc[name].firstSeen = job.datum;
            }
            return acc;
        }, {});

        let processed = Object.values(groups).map(c => {
            c.avgValue = c.totalSpent / c.missionCount;
            if (c.totalSpent > 50000 || c.missionCount > 20) c.rank = 'Premium';
            else if (c.totalSpent > 20000) c.rank = 'Guld';
            else if (c.totalSpent > 5000) c.rank = 'Silver';
            else c.rank = 'Standard';
            
            c.daysSinceLast = Math.floor((new Date() - new Date(c.lastSeen)) / (1000 * 60 * 60 * 24));
            c.isActive = c.daysSinceLast < 60;
            
            return c;
        });

        if (searchQuery) {
            const sq = searchQuery.toLowerCase();
            processed = processed.filter(c => 
                c.name.toLowerCase().includes(sq) || 
                Array.from(c.vehicles).some(v => v.toLowerCase().includes(sq))
            );
        }

        if (statusFilter === 'active') processed = processed.filter(c => c.isActive);
        if (statusFilter === 'inactive') processed = processed.filter(c => !c.isActive);

        processed.sort((a, b) => {
            if (sortMode === 'revenue') return b.totalSpent - a.totalSpent;
            if (sortMode === 'count') return b.missionCount - a.missionCount;
            if (sortMode === 'recent') return b.lastSeen.localeCompare(a.lastSeen);
            return 0;
        });

        return processed;
    }, [allJobs, searchQuery, sortMode, statusFilter]);

    const visibleCustomers = customerData.slice(0, visibleCount);
    const hasMore = visibleCount < customerData.length;
    
    const RankBadge = ({ rank }) => {
        const styles = {
            'Premium': 'bg-gradient-to-r from-orange-400 to-orange-600 text-white shadow-[0_2px_12px_-2px_rgba(249,115,22,0.6)] border-transparent',
            'Guld': 'bg-gradient-to-br from-zinc-800 to-zinc-900 dark:from-white dark:to-zinc-200 text-orange-400 dark:text-orange-600 border-transparent shadow-sm',
            'Silver': 'bg-zinc-100 dark:bg-white/10 text-zinc-600 dark:text-zinc-300 border-zinc-200/80 dark:border-white/10',
            'Standard': 'bg-transparent text-zinc-400 border-zinc-200 dark:border-white/10 opacity-80'
        };
        return (
            <span className={`text-[9px] font-black px-2 py-0.5 rounded-md uppercase tracking-widest flex items-center gap-1.5 border ${styles[rank] || styles['Standard']}`}>
                {rank === 'Premium' && <SafeIcon name="crown" size={10} className="drop-shadow-md" />}
                {rank === 'Guld' && <SafeIcon name="star" size={10} />}
                {rank}
            </span>
        );
    };

    if (selectedCustomer) {
        const loyaltyScore = Math.min(100, (selectedCustomer.missionCount * 5));
        const daysSinceLast = Math.floor((new Date() - new Date(selectedCustomer.lastSeen)) / (1000 * 60 * 60 * 24));
        const firstVisitYear = selectedCustomer.firstSeen ? selectedCustomer.firstSeen.split('-')[0] : new Date().getFullYear();
        
        const filteredLogs = selectedCustomer.jobs
            .filter(j => 
                (j.regnr || '').toLowerCase().includes(logSearch.toLowerCase()) || 
                (j.kommentar || '').toLowerCase().includes(logSearch.toLowerCase()) ||
                (j.paket || '').toLowerCase().includes(logSearch.toLowerCase())
            )
            .sort((a,b) => b.datum.localeCompare(a.datum));

        const visibleLogs = filteredLogs.slice(0, historyVisible);
        const vehiclesArray = Array.from(selectedCustomer.vehicles);
        const displayedVehicles = showAllVehicles ? vehiclesArray : vehiclesArray.slice(0, 4);

        return (
            <div className="relative w-full max-w-[1400px] mx-auto animate-in fade-in slide-in-from-left-4 duration-700 pb-0">
                <div className="absolute top-0 left-[-10%] w-[80%] h-[400px] bg-orange-500/10 dark:bg-orange-500/5 blur-[120px] rounded-full pointer-events-none -z-10 hidden lg:block"></div>

                {/* KOMPAKT HEADER */}
                <div className="flex flex-col md:flex-row md:items-center justify-between mb-4 pb-4 border-b border-zinc-200 dark:border-white/5 gap-3 px-3 pt-3 lg:px-0 lg:pt-0">
                    <div className="flex items-center gap-3 md:gap-4">
                        <button onClick={() => setSelectedCustomer(null)} className="group shrink-0 relative w-10 h-10 md:w-12 md:h-12 flex items-center justify-center bg-white dark:bg-[#182032] border border-zinc-200 dark:border-white/5 text-zinc-500 dark:text-zinc-400 hover:text-orange-500 hover:border-orange-500/50 transition-all rounded-xl shadow-sm hover:shadow-md">
                            <SafeIcon name="arrow-left" size={20} className="group-hover:-translate-x-1 transition-transform" />
                        </button>
                        <div className="flex flex-col">
                            <div className="flex flex-wrap items-center gap-2 sm:gap-3 mb-1">
                                <h1 className="text-xl md:text-2xl font-black text-zinc-900 dark:text-white uppercase tracking-tight leading-none truncate max-w-[200px] sm:max-w-md">
                                    {selectedCustomer.name}
                                </h1>
                                <RankBadge rank={selectedCustomer.rank} />
                            </div>
                            <p className="text-[9px] md:text-[10px] font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-widest flex items-center gap-1.5">
                                <span className={`w-1.5 h-1.5 rounded-full ${daysSinceLast < 60 ? 'bg-emerald-500 shadow-[0_0_8px_#10b981] animate-pulse' : 'bg-red-500'}`}></span>
                                {daysSinceLast < 60 ? 'Aktiv Kund' : 'Inaktiv Kund'}
                            </p>
                        </div>
                    </div>
                    
                    <button 
                        onClick={() => { setEditingJob(null); window.prefillName = selectedCustomer.name; setView('NEW_JOB'); }}
                        className="w-full sm:w-auto px-6 py-3 bg-gradient-to-r from-orange-500 to-orange-600 text-white font-bold text-[11px] sm:text-[12px] uppercase tracking-widest shadow-[0_4px_14px_-4px_rgba(249,115,22,0.4)] hover:shadow-[0_6px_20px_-4px_rgba(249,115,22,0.5)] border border-orange-400/50 active:scale-95 transition-all text-center rounded-xl flex items-center justify-center gap-2"
                    >
                        <SafeIcon name="plus" size={16} /> Nytt Uppdrag
                    </button>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-5 px-3 lg:px-0">
                    {/* VÄNSTER SPALT */}
                    <div className="lg:col-span-4 space-y-4 sm:space-y-5">
                        <div className="bg-white/80 dark:bg-[#182032]/80 backdrop-blur-2xl p-5 sm:p-6 rounded-2xl relative overflow-hidden border border-zinc-200/80 dark:border-white/5 shadow-sm hover:shadow-md transition-shadow">
                            <div className="relative z-10">
                                <SectionHeader title="Kundlojalitet" sub="Bedömd återkomstfrekvens" icon="heart" />
                                <div className="text-5xl font-light tracking-tighter text-zinc-900 dark:text-white mb-4">
                                    {loyaltyScore}<span className="text-lg text-orange-500 font-bold ml-1">%</span>
                                </div>
                                <div className="h-1.5 w-full bg-zinc-200 dark:bg-white/10 rounded-full overflow-hidden">
                                    <div className="h-full bg-gradient-to-r from-orange-400 to-orange-600 shadow-[0_0_15px_rgba(249,115,22,0.6)] transition-all duration-1000" style={{ width: `${loyaltyScore}%` }}></div>
                                </div>
                            </div>
                            <SafeIcon name="activity" size={100} className="absolute -right-6 -bottom-6 text-zinc-100 dark:text-white opacity-[0.03]" />
                        </div>

                        <div className="grid grid-cols-1 gap-4">
                            <div className="bg-white/80 dark:bg-[#182032]/80 backdrop-blur-2xl p-5 sm:p-6 rounded-2xl border border-zinc-200/80 dark:border-white/5 shadow-sm flex flex-col justify-center">
                                <div className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-2 flex items-center gap-1.5">
                                    <SafeIcon name="calendar" size={12} /> Senaste Besök
                                </div>
                                <div className="flex items-center justify-between">
                                    <div className="text-2xl font-light text-zinc-900 dark:text-white">{daysSinceLast} <span className="text-xs font-bold text-zinc-400 uppercase tracking-widest">Dagar</span></div>
                                    <div className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest bg-zinc-100 dark:bg-white/5 px-2 py-1 rounded-md">
                                        {selectedCustomer.lastSeen.split('T')[0]}
                                    </div>
                                </div>
                            </div>

                            <div className="bg-white/80 dark:bg-[#182032]/80 backdrop-blur-2xl p-5 sm:p-6 rounded-2xl border border-zinc-200/80 dark:border-white/5 shadow-sm">
                                <SectionHeader title="Tjänstefördelning" sub="Vanligaste åtgärderna" icon="pie-chart" />
                                <div className="space-y-3.5 mt-1">
                                    {Object.entries(selectedCustomer.packageStats)
                                        .sort((a, b) => b[1] - a[1]) 
                                        .map(([pkg, count]) => (
                                        <div key={pkg} className="group">
                                            <div className="flex justify-between text-[10px] font-bold uppercase mb-1.5 text-zinc-600 dark:text-zinc-400">
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

                    {/* HÖGER SPALT */}
                    <div className="lg:col-span-8 space-y-4 sm:space-y-5">
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
                            {[
                                { label: 'Omsättning', val: selectedCustomer.totalSpent.toLocaleString(), unit: 'kr', icon: 'credit-card', color: 'text-emerald-500' },
                                { label: 'Snittvärde', val: Math.round(selectedCustomer.avgValue).toLocaleString(), unit: 'kr/jobb', icon: 'trending-up', color: 'text-orange-500' },
                                { label: 'Uppdrag', val: selectedCustomer.missionCount, unit: 'Totalt', icon: 'wrench', color: 'text-zinc-900 dark:text-white' },
                                { label: 'Fordon', val: selectedCustomer.vehicles.size, unit: 'Stycken', icon: 'truck', color: 'text-zinc-900 dark:text-white' }
                            ].map((s, i) => (
                                <div key={i} className="bg-white/80 dark:bg-[#182032]/80 backdrop-blur-2xl border border-zinc-200/80 dark:border-white/5 rounded-2xl p-4 sm:p-5 hover:shadow-md transition-all group flex flex-col justify-between">
                                    <div className="text-[9px] font-bold text-zinc-400 uppercase tracking-widest mb-2 flex items-center justify-between">
                                        {s.label} <SafeIcon name={s.icon} size={12} className="group-hover:text-orange-500 transition-colors" />
                                    </div>
                                    <div className={`text-xl sm:text-2xl lg:text-3xl font-light tracking-tighter text-right sm:text-left ${s.color}`}>{s.val}</div>
                                    <div className="text-[8px] sm:text-[9px] font-bold text-zinc-400 dark:text-zinc-500 uppercase mt-1 text-right sm:text-left">{s.unit}</div>
                                </div>
                            ))}
                        </div>

                        <div className="bg-white/80 dark:bg-[#182032]/80 backdrop-blur-2xl border border-zinc-200/80 dark:border-white/5 rounded-2xl p-5 sm:p-6 shadow-sm">
                            <SectionHeader title="Kundens Fordon" sub="Kända fordon kopplade till kunden" icon="truck" />
                            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
                                {displayedVehicles.map(v => (
                                    <div key={v} className="bg-zinc-50/80 dark:bg-[#1a2235] border border-zinc-200 dark:border-white/5 p-3 rounded-xl hover:border-orange-500/50 hover:shadow-sm transition-all group flex flex-col justify-center gap-2 min-w-0">
                                        <LicensePlate regnr={v} size="lg" />
                                        {vehicleModels[v] && (
                                            <div className="text-[10px] font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-widest truncate min-w-0 w-full" title={vehicleModels[v]}>
                                                {vehicleModels[v]}
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                            
                            {vehiclesArray.length > 4 && !showAllVehicles && (
                                <button 
                                    onClick={() => setShowAllVehicles(true)}
                                    className="mt-3 w-full py-2.5 bg-zinc-100 dark:bg-[#1f2940] border border-zinc-200 dark:border-white/5 rounded-xl hover:bg-zinc-200 dark:hover:bg-[#25324d] transition-all flex items-center justify-center gap-2 text-[10px] sm:text-[11px] font-bold text-zinc-600 dark:text-zinc-300 uppercase shadow-sm"
                                >
                                    <SafeIcon name="plus" size={14} /> Visa {vehiclesArray.length - 4} till
                                </button>
                            )}
                        </div>

                        <div className="bg-white/80 dark:bg-[#182032]/80 backdrop-blur-2xl border border-zinc-200/80 dark:border-white/5 rounded-2xl shadow-sm overflow-hidden flex flex-col">
                            <div className="bg-zinc-50/50 dark:bg-[#1a2235]/50 p-4 sm:p-5 flex flex-col md:flex-row md:items-center justify-between gap-3 sm:gap-4 border-b border-zinc-200/50 dark:border-white/10">
                                <SectionHeader title="Servicehistorik" sub={`Totalt ${selectedCustomer.jobs.length} registrerade uppdrag`} icon="clipboard" />
                                <div className="relative group w-full md:w-56">
                                    <input 
                                        type="text" 
                                        placeholder="SÖK I HISTORIK..." 
                                        className="bg-white dark:bg-[#0f1522] border border-zinc-200/80 dark:border-white/10 text-[10px] sm:text-[11px] font-bold text-zinc-900 dark:text-white pl-9 pr-3 py-2.5 outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500/30 w-full uppercase tracking-widest rounded-xl transition-all shadow-inner placeholder:text-zinc-400"
                                        value={logSearch}
                                        onChange={(e) => setLogSearch(e.target.value)}
                                    />
                                    <SafeIcon name="search" size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400 group-focus-within:text-orange-500 transition-colors" />
                                </div>
                            </div>

                            <div className="max-h-[600px] overflow-y-auto custom-scrollbar p-3 sm:p-4 space-y-3">
                                {visibleLogs.length > 0 ? visibleLogs.map((j, i) => {
                                    const jobDate = j.datum ? j.datum.split('T')[0] : 'Inget Datum';
                                    const regnr = j.regnr || '-';
                                    let model = vehicleModels[regnr] || j.bilmodell || 'Okänd Fordonsmodell';
                                    if (model.toLowerCase().includes('kaffepaus')) model = vehicleModels[regnr] || 'Okänd Fordonsmodell';
                                    
                                    return (
                                        <div 
                                            key={i} 
                                            onClick={() => { if (window.openVehicleProfile) window.openVehicleProfile(regnr, j.id); }}
                                            className="group p-3 sm:p-4 bg-white/50 dark:bg-[#182032] border border-zinc-200 dark:border-white/5 hover:border-orange-400 dark:hover:border-orange-500/50 hover:shadow-md transition-all cursor-pointer rounded-2xl flex flex-col min-w-0"
                                        >
                                            <div className="flex flex-col sm:flex-row sm:items-start justify-between mb-2.5 border-b border-zinc-100 dark:border-white/5 pb-2.5 min-w-0 gap-2">
                                                <div className="flex items-center gap-2.5 min-w-0 flex-1 pr-2">
                                                    <div className="shrink-0"><LicensePlate regnr={regnr} size="md" /></div>
                                                    <span className="text-[12px] sm:text-[13px] font-bold uppercase text-zinc-900 dark:text-white truncate block w-full" title={model}>
                                                        {model}
                                                    </span>
                                                </div>
                                                <div className="text-lg sm:text-lg font-light text-zinc-900 dark:text-white tracking-tighter shrink-0 text-right sm:mt-0.5 self-end sm:self-auto">
                                                    {(parseInt(j.kundpris) || 0).toLocaleString()}<span className="text-[9px] font-bold text-zinc-400 ml-1 uppercase">kr</span>
                                                </div>
                                            </div>

                                            <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 mb-2.5">
                                                <span className="text-[9px] sm:text-[10px] font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-widest flex items-center gap-1 sm:gap-1.5 bg-zinc-100 dark:bg-[#0f1522] px-2 py-1 sm:py-1.5 rounded-lg border border-zinc-200/50 dark:border-white/5 shadow-sm">
                                                    <SafeIcon name="calendar" size={12} /> {jobDate}
                                                </span>
                                                <span className="text-[9px] sm:text-[10px] font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-widest flex items-center gap-1 sm:gap-1.5 bg-zinc-100 dark:bg-[#0f1522] px-2 py-1 sm:py-1.5 rounded-lg border border-zinc-200/50 dark:border-white/5 shadow-sm">
                                                    <SafeIcon name="wrench" size={12} /> {j.paket || 'Service'}
                                                </span>
                                                <span className={`text-[8px] sm:text-[9px] font-black uppercase tracking-widest px-2 py-1 sm:py-1.5 rounded-lg border shadow-sm ${j.status === 'KLAR' ? 'bg-emerald-50 text-emerald-600 border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20' : 'bg-orange-50 text-orange-600 border-orange-200 dark:bg-orange-500/10 dark:text-orange-400 dark:border-orange-500/20'}`}>
                                                    {j.status}
                                                </span>
                                            </div>

                                            {/* --- FIX FÖR HTML I KOMMENTARER --- */}
                                            {j.kommentar && (
                                                <div className="bg-zinc-50/80 dark:bg-[#0f1522]/80 p-3 rounded-xl border border-zinc-200/50 dark:border-white/5 shadow-inner relative mt-1">
                                                    <div className="text-[11px] text-zinc-600 dark:text-zinc-400 leading-relaxed flex items-start gap-2.5">
                                                        <SafeIcon name="message-square" size={14} className="shrink-0 mt-0.5 text-zinc-400" />
                                                        <div 
                                                            className="flex-1 break-words space-y-1 [&_br]:block [&_div]:inline-block font-medium"
                                                            dangerouslySetInnerHTML={{ __html: j.kommentar }}
                                                        />
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    );
                                }) : (
                                    <div className="p-10 text-center text-zinc-400 uppercase tracking-widest text-[11px] font-bold bg-white/50 dark:bg-[#182032]/50 rounded-2xl border border-dashed border-zinc-200 dark:border-white/10">
                                        <SafeIcon name="search" size={32} className="mb-3 opacity-20 mx-auto" />
                                        Hittade inga matchande uppdrag
                                    </div>
                                )}
                                
                                {filteredLogs.length > historyVisible && (
                                    <button 
                                        onClick={() => setHistoryVisible(prev => prev + 10)}
                                        className="mt-3 w-full py-2.5 bg-white dark:bg-[#1f2940] border border-zinc-200 dark:border-white/5 rounded-xl hover:bg-zinc-50 dark:hover:bg-[#25324d] transition-all flex items-center justify-center gap-2 text-[10px] sm:text-[11px] font-bold text-zinc-600 dark:text-zinc-300 uppercase shadow-sm active:scale-95"
                                    >
                                        <SafeIcon name="refresh-cw" size={12} /> Ladda fler uppdrag ({filteredLogs.length - historyVisible} kvar)
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    // ==========================================
    // HUVUDLISTA MED KUNDER
    // ==========================================
    return (
        <div className="relative w-full max-w-[1400px] mx-auto animate-in fade-in slide-in-from-left-4 duration-700 pb-32 lg:pb-12">
            <div className="absolute top-0 left-[-10%] w-[60%] h-[400px] bg-orange-500/10 dark:bg-orange-500/5 blur-[120px] rounded-full pointer-events-none -z-10 hidden lg:block"></div>

            <div className="flex flex-col lg:flex-row lg:items-end justify-between mb-4 sm:mb-5 gap-3 px-3 sm:px-4 pt-4 lg:px-0 lg:pt-0">
                <div className="flex items-center gap-3">
                    <div className="relative group cursor-default shrink-0">
                        <div className="absolute inset-0 bg-orange-500/40 blur-lg rounded-full transition-all duration-700 group-hover:bg-orange-500/60" />
                        <div className="relative w-10 h-10 md:w-12 md:h-12 rounded-xl flex items-center justify-center text-white shadow-md border border-white/20 transition-colors bg-gradient-to-br from-orange-400 to-orange-600">
                            <SafeIcon name="users" size={20} className="md:w-6 md:h-6" />
                        </div>
                    </div>
                    <div className="flex flex-col">
                        <h1 className="text-xl md:text-2xl font-black text-zinc-900 dark:text-white uppercase tracking-tight leading-none">
                            KUND<span className="text-zinc-400 dark:text-zinc-500 font-light">REGISTER</span>
                        </h1>
                        <p className="text-[9px] md:text-[10px] font-bold text-orange-500 dark:text-orange-400 uppercase tracking-widest mt-1 flex items-center gap-1.5">
                            <span className="w-1.5 h-1.5 rounded-full bg-orange-500 animate-pulse"></span>
                            CRM & Analys // {customerData.length} Kunder
                        </p>
                    </div>
                </div>
            </div>

            <div className="px-3 sm:px-4 lg:px-0 space-y-3 sm:space-y-4">
                
                {/* --- KONTROLLPANEL --- */}
                <div className="bg-white/90 dark:bg-[#182032]/90 border border-zinc-200/80 dark:border-white/5 rounded-xl sm:rounded-2xl p-2 sm:p-3 shadow-sm flex flex-col lg:flex-row gap-2 sm:gap-3 lg:items-center justify-between mb-3 lg:mb-5">
                    <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 flex-1">
                        
                        <div className="relative group flex-1 lg:max-w-md">
                            <input 
                                type="text" placeholder="Sök kundnamn, regnr..." 
                                className="bg-zinc-50 dark:bg-[#0f1522] border border-zinc-200/80 dark:border-white/10 focus:border-orange-500 p-2.5 sm:p-3 pl-9 sm:pl-10 pr-8 text-[11px] sm:text-[12px] font-bold uppercase tracking-widest text-zinc-900 dark:text-white outline-none w-full transition-all rounded-lg sm:rounded-xl focus:ring-1 focus:ring-orange-500/30 shadow-inner placeholder:text-zinc-400"
                                value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
                            />
                            <SafeIcon name="search" size={14} className="absolute left-3 sm:left-3.5 top-1/2 -translate-y-1/2 text-zinc-400 group-focus-within:text-orange-500 transition-colors" />
                            {searchQuery && (
                                <button onClick={() => setSearchQuery('')} className="absolute right-2 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-red-500 transition-colors bg-white dark:bg-[#1a2235] p-1 rounded-md shadow-sm">
                                    <SafeIcon name="x" size={12} />
                                </button>
                            )}
                        </div>

                        <div className="flex gap-2 sm:gap-3">
                            <select 
                                value={sortMode} onChange={(e) => setSortMode(e.target.value)}
                                className="bg-zinc-50 dark:bg-[#0f1522] border border-zinc-200/80 dark:border-white/10 py-2.5 sm:py-3 px-2 sm:px-3 rounded-lg sm:rounded-xl text-[9px] sm:text-[10px] font-bold uppercase tracking-widest outline-none text-zinc-700 dark:text-zinc-300 shadow-inner flex-1 lg:flex-none lg:w-44"
                            >
                                <option value="revenue">Mest Omsättning</option>
                                <option value="count">Flest Besök</option>
                                <option value="recent">Senaste Besök</option>
                            </select>

                            <div className="flex bg-zinc-50 dark:bg-[#0f1522] border border-zinc-200/80 dark:border-white/10 rounded-lg sm:rounded-xl p-1 shadow-inner h-[38px] sm:h-[42px] flex-1 lg:flex-none">
                                {[
                                    { id: 'all', label: 'Alla' },
                                    { id: 'active', label: 'Aktiva' },
                                    { id: 'inactive', label: 'Inaktiva' }
                                ].map(f => (
                                    <button 
                                        key={f.id} onClick={() => setStatusFilter(f.id)} 
                                        className={`px-2 sm:px-3 text-[8px] sm:text-[9px] font-bold uppercase tracking-widest transition-all rounded-[6px] sm:rounded-lg flex-1 lg:flex-none ${statusFilter === f.id ? 'bg-white dark:bg-[#1a2235] text-zinc-900 dark:text-white shadow-sm' : 'text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300'}`}
                                    >
                                        {f.label}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center gap-2 sm:gap-3 shrink-0">
                        <div className="hidden sm:flex bg-zinc-50 dark:bg-[#0f1522] border border-zinc-200/80 dark:border-white/10 rounded-lg sm:rounded-xl p-1 shadow-inner h-[38px] sm:h-[42px]">
                            <button onClick={() => setViewMode('GRID')} className={`w-10 h-full flex items-center justify-center rounded-[6px] sm:rounded-lg transition-colors ${viewMode === 'GRID' ? 'bg-white dark:bg-[#1a2235] text-orange-500 shadow-sm' : 'text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200'}`} title="Kortvy">
                                <SafeIcon name="layout-grid" size={14} />
                            </button>
                            <button onClick={() => setViewMode('TABLE')} className={`w-10 h-full flex items-center justify-center rounded-[6px] sm:rounded-lg transition-colors ${viewMode === 'TABLE' ? 'bg-white dark:bg-[#1a2235] text-orange-500 shadow-sm' : 'text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200'}`} title="Tabellvy">
                                <SafeIcon name="list" size={14} />
                            </button>
                        </div>

                        <button 
                            onClick={() => setView('NEW_JOB', { job: { jobbtyp: 'STANDARD' } })}
                            className="bg-gradient-to-r from-orange-500 to-orange-600 text-white font-bold text-[10px] sm:text-[11px] uppercase tracking-widest shadow-[0_4px_14px_0_rgba(249,115,22,0.39)] hover:shadow-[0_6px_20px_rgba(249,115,22,0.23)] border border-orange-400/50 active:scale-95 transition-all rounded-lg sm:rounded-xl h-[38px] sm:h-[42px] px-4 sm:px-5 flex items-center justify-center gap-1.5 flex-1 sm:flex-none"
                        >
                            <SafeIcon name="plus" size={14} /> Nytt Uppdrag
                        </button>
                    </div>
                </div>

                {/* --- INNEHÅLLSVY --- */}
                <div className="flex flex-col relative">
                    {customerData.length === 0 ? (
                        <div className="p-10 sm:p-16 text-center bg-white dark:bg-[#182032] rounded-xl sm:rounded-2xl lg:rounded-none shadow-sm lg:shadow-none border border-zinc-200/80 dark:border-white/5">
                            <SafeIcon name="users" size={40} className="mb-4 opacity-20 mx-auto text-zinc-300 dark:text-zinc-600" />
                            <h3 className="text-[11px] sm:text-[12px] font-bold uppercase tracking-widest text-zinc-500">Inga kunder hittades</h3>
                        </div>
                    ) : viewMode === 'GRID' ? (
                        /* PREMIUM KORT-VY */
                        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3 sm:gap-4 pb-6">
                            {visibleCustomers.map((customer, i) => {
                                const initials = customer.name.split(' ').map(n => n[0]).join('').substring(0,2).toUpperCase();
                                const avatarTheme = getAvatarTheme(customer.name);
                                const isPremium = customer.rank === 'Premium';

                                return (
                                    <div 
                                        key={i} 
                                        onClick={() => { setSelectedCustomer(customer); setShowAllVehicles(false); }}
                                        className={`group bg-white dark:bg-[#182032] border rounded-2xl p-4 sm:p-5 shadow-sm hover:shadow-xl transition-all duration-300 cursor-pointer relative flex flex-col overflow-hidden ${isPremium ? 'border-orange-500/30 dark:border-orange-500/30' : 'border-zinc-200/80 dark:border-white/5 hover:border-zinc-300 dark:hover:border-white/10'}`}
                                    >
                                        {isPremium && <div className="absolute -top-10 -right-10 w-32 h-32 bg-orange-500/10 blur-2xl rounded-full pointer-events-none transition-opacity group-hover:opacity-100 opacity-50"></div>}

                                        <div className="flex items-start justify-between mb-4 sm:mb-5 relative z-10">
                                            <div className="flex items-center gap-3 sm:gap-4 min-w-0 pr-2">
                                                <div className={`w-12 h-12 sm:w-14 sm:h-14 rounded-2xl flex items-center justify-center text-[14px] sm:text-[15px] font-black shrink-0 border shadow-sm transition-transform group-hover:scale-105 ${avatarTheme}`}>
                                                    {initials}
                                                </div>
                                                <div className="flex flex-col min-w-0 gap-1">
                                                    <span className={`text-[14px] sm:text-[15px] font-black truncate transition-colors ${isPremium ? 'text-zinc-900 dark:text-white group-hover:text-orange-500' : 'text-zinc-900 dark:text-white group-hover:text-orange-500'}`}>
                                                        {customer.name}
                                                    </span>
                                                    <div className="flex items-center mt-0.5">
                                                        <RankBadge rank={customer.rank} />
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-2 gap-2 sm:gap-3 mb-4 sm:mb-5 relative z-10">
                                            <div className="bg-zinc-50/80 dark:bg-black/20 rounded-xl p-3 sm:p-4 border border-zinc-100 dark:border-white/5 flex flex-col justify-center">
                                                <span className="text-[18px] sm:text-[20px] font-light tracking-tighter text-zinc-900 dark:text-white leading-none mb-1 sm:mb-1.5">
                                                    {customer.totalSpent >= 10000 ? `${(customer.totalSpent / 1000).toFixed(1)}k` : customer.totalSpent.toLocaleString('sv-SE')}
                                                </span>
                                                <span className="text-[8px] sm:text-[9px] font-bold text-zinc-400 uppercase tracking-widest">Omsättning (kr)</span>
                                            </div>
                                            <div className="bg-zinc-50/80 dark:bg-black/20 rounded-xl p-3 sm:p-4 border border-zinc-100 dark:border-white/5 flex flex-col justify-center">
                                                <span className="text-[18px] sm:text-[20px] font-bold text-zinc-900 dark:text-white leading-none mb-1 sm:mb-1.5">{customer.missionCount}</span>
                                                <span className="text-[8px] sm:text-[9px] font-bold text-zinc-400 uppercase tracking-widest">Antal Besök</span>
                                            </div>
                                        </div>

                                        <div className="mt-auto pt-3 sm:pt-4 flex items-center justify-between border-t border-zinc-100 dark:border-white/5 relative z-10">
                                            <div className="flex flex-col gap-1 sm:gap-1.5">
                                                <div className="flex items-center gap-1.5 text-[9px] sm:text-[10px] font-bold uppercase tracking-widest text-zinc-500">
                                                    <SafeIcon name="truck" size={12} className="text-zinc-400" />
                                                    {customer.vehicles.size} Fordon
                                                </div>
                                                <div className="flex items-center gap-1.5 text-[8px] sm:text-[9px] font-bold uppercase tracking-widest text-zinc-400">
                                                    <span className={`w-1.5 h-1.5 rounded-full ${customer.isActive ? 'bg-emerald-500 shadow-[0_0_8px_#10b981]' : 'bg-red-500'}`}></span>
                                                    {customer.daysSinceLast} Dagar sen
                                                </div>
                                            </div>
                                            <button 
                                                onClick={(e) => { e.stopPropagation(); setEditingJob(null); window.prefillName = customer.name; setView('NEW_JOB'); }}
                                                className="bg-white dark:bg-[#25324d] text-orange-500 hover:bg-gradient-to-r hover:from-orange-500 hover:to-orange-600 hover:text-white px-3 py-2 sm:px-4 sm:py-2.5 rounded-xl text-[9px] sm:text-[10px] font-bold uppercase tracking-widest border border-zinc-200 dark:border-white/10 hover:border-transparent transition-all shadow-sm hover:shadow-[0_4px_12px_rgba(249,115,22,0.3)] active:scale-95 flex items-center gap-1.5 sm:gap-2"
                                            >
                                                <SafeIcon name="plus" size={14} /> Nytt
                                            </button>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    ) : (
                        /* ENTERPRISE LIST-VY */
                        <div className="bg-white/90 dark:bg-[#182032]/90 border border-zinc-200/80 dark:border-white/5 rounded-2xl shadow-sm overflow-hidden mb-8 sm:mb-12 flex flex-col">
                            
                            <div className="hidden lg:grid grid-cols-[minmax(0,1.5fr)_140px_160px_160px] gap-4 px-8 py-3.5 bg-zinc-50/80 dark:bg-[#121826]/80 border-b border-zinc-200/80 dark:border-white/5 text-[10px] font-bold uppercase tracking-widest text-zinc-500 dark:text-zinc-400 items-center">
                                <div>Kund & Klassificering</div>
                                <div className="text-center">Uppdrag & Fordon</div>
                                <div className="text-right">Total Omsättning</div>
                                <div className="text-right pr-4">Aktivitet / Åtgärd</div>
                            </div>

                            <div className="flex flex-col divide-y divide-zinc-100 dark:divide-white/5">
                                {visibleCustomers.map((customer, i) => {
                                    const initials = customer.name.split(' ').map(n => n[0]).join('').substring(0,2).toUpperCase();
                                    const avatarTheme = getAvatarTheme(customer.name);
                                    const isPremium = customer.rank === 'Premium';

                                    return (
                                        <div 
                                            key={i} 
                                            onClick={() => { setSelectedCustomer(customer); setShowAllVehicles(false); }}
                                            className={`group relative flex flex-col lg:grid lg:grid-cols-[minmax(0,1.5fr)_140px_160px_160px] gap-3 lg:gap-4 p-3 lg:px-8 lg:py-4 hover:bg-zinc-50/80 dark:hover:bg-white/[0.02] cursor-pointer transition-all duration-300 items-center ${isPremium ? 'hover:bg-orange-50/50 dark:hover:bg-orange-500/5' : ''}`}
                                        >
                                            <div className="flex items-center gap-3 lg:gap-4 min-w-0 w-full lg:w-auto">
                                                <div className={`w-10 h-10 lg:w-12 lg:h-12 rounded-xl lg:rounded-2xl flex items-center justify-center text-[12px] lg:text-[13px] font-bold shrink-0 border shadow-sm ${avatarTheme}`}>
                                                    {initials}
                                                </div>
                                                <div className="flex flex-col min-w-0 gap-1 flex-1">
                                                    <span className="text-[13px] lg:text-[14px] font-black text-zinc-900 dark:text-white truncate group-hover:text-orange-500 transition-colors">
                                                        {customer.name}
                                                    </span>
                                                    <div className="flex items-center">
                                                        <RankBadge rank={customer.rank} />
                                                    </div>
                                                </div>
                                                <SafeIcon name="chevron-right" size={18} className="lg:hidden text-zinc-300 dark:text-zinc-600 group-hover:text-orange-500 shrink-0" />
                                            </div>

                                            <div className="hidden lg:flex flex-col items-center justify-center">
                                                <div className="flex items-baseline gap-1.5 mb-1">
                                                    <span className="text-[14px] font-bold text-zinc-700 dark:text-zinc-200">{customer.missionCount}</span>
                                                    <span className="text-[9px] font-bold text-zinc-400 uppercase tracking-widest">Besök</span>
                                                </div>
                                                <div className="flex items-center gap-1.5 text-zinc-500">
                                                    <SafeIcon name="truck" size={12} className="opacity-70" />
                                                    <span className="text-[9px] font-bold uppercase tracking-widest">{customer.vehicles.size} Fordon</span>
                                                </div>
                                            </div>

                                            <div className="hidden lg:flex flex-col justify-center items-end">
                                                <div className="flex items-baseline gap-1.5">
                                                    <span className="text-[20px] font-light tracking-tighter text-zinc-900 dark:text-white group-hover:scale-105 transition-transform origin-right">
                                                        {customer.totalSpent.toLocaleString('sv-SE')}
                                                    </span>
                                                    <span className="text-[9px] font-bold text-zinc-400 uppercase tracking-widest">kr</span>
                                                </div>
                                            </div>

                                            <div className="hidden lg:flex justify-end items-center relative pr-4">
                                                <div className="flex flex-col items-end transition-all duration-300 absolute group-hover:opacity-0 group-hover:translate-x-4 group-hover:pointer-events-none">
                                                    <div className="flex items-baseline gap-1.5 mb-1">
                                                        <span className="text-[13px] font-bold text-zinc-700 dark:text-zinc-200">{customer.daysSinceLast}</span>
                                                        <span className="text-[9px] font-bold text-zinc-400 uppercase tracking-widest">Dgr sen</span>
                                                    </div>
                                                    <div className="flex items-center gap-1.5">
                                                        <span className={`w-1.5 h-1.5 rounded-full ${customer.isActive ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]' : 'bg-zinc-300 dark:bg-zinc-600'}`}></span>
                                                        <span className={`text-[8px] font-bold uppercase tracking-widest ${customer.isActive ? 'text-emerald-600 dark:text-emerald-400' : 'text-zinc-400'}`}>{customer.isActive ? 'Aktiv Kund' : 'Inaktiv'}</span>
                                                    </div>
                                                </div>

                                                <div className="absolute transition-all duration-300 opacity-0 translate-x-4 group-hover:opacity-100 group-hover:translate-x-0 flex items-center right-4">
                                                    <button 
                                                        onClick={(e) => { e.stopPropagation(); setEditingJob(null); window.prefillName = customer.name; setView('NEW_JOB'); }}
                                                        className="bg-white dark:bg-[#25324d] text-orange-500 hover:bg-orange-500 hover:text-white px-3 py-2 rounded-xl text-[9px] font-bold uppercase tracking-widest border border-zinc-200 dark:border-white/10 hover:border-orange-500 transition-all shadow-sm flex items-center gap-1.5 active:scale-95"
                                                    >
                                                        <SafeIcon name="plus" size={14} /> Nytt
                                                    </button>
                                                </div>
                                            </div>

                                            {/* Förbättrad mobilvy av tabellraden */}
                                            <div className="lg:hidden grid grid-cols-3 gap-2 bg-zinc-50/50 dark:bg-black/10 p-2.5 rounded-xl border border-zinc-200/50 dark:border-white/5 w-full mt-1">
                                                <div className="flex flex-col items-center justify-center border-r border-zinc-200/80 dark:border-white/5">
                                                    <span className="text-[13px] font-bold text-zinc-900 dark:text-white leading-none mb-1">{customer.missionCount}</span>
                                                    <span className="text-[8px] font-bold text-zinc-400 uppercase tracking-widest">Besök</span>
                                                </div>
                                                <div className="flex flex-col items-center justify-center border-r border-zinc-200/80 dark:border-white/5">
                                                    <span className="text-[13px] font-light tracking-tighter text-zinc-900 dark:text-white leading-none mb-1">{(customer.totalSpent / 1000).toFixed(1)}k</span>
                                                    <span className="text-[8px] font-bold text-zinc-400 uppercase tracking-widest">Omsätt.</span>
                                                </div>
                                                <div className="flex flex-col items-center justify-center min-w-0 px-1">
                                                    <div className="flex items-center gap-1.5 leading-none mb-1">
                                                        <span className={`w-1.5 h-1.5 rounded-full ${customer.isActive ? 'bg-emerald-500' : 'bg-red-500'}`}></span>
                                                        <span className="text-[13px] font-bold text-zinc-900 dark:text-white">{customer.daysSinceLast}</span>
                                                    </div>
                                                    <span className="text-[8px] font-bold text-zinc-400 uppercase tracking-widest">Dagar sen</span>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}
                    
                    {hasMore && (
                        <div className="flex justify-center p-3 sm:p-4 lg:p-6">
                            <button onClick={() => setVisibleCount(prev => prev + 20)} className="px-6 sm:px-8 py-3 bg-white dark:bg-[#1a2235] border border-zinc-200 dark:border-white/10 hover:bg-zinc-50 dark:hover:bg-[#25324d] hover:border-orange-500/50 text-zinc-600 dark:text-zinc-300 hover:text-orange-500 text-[10px] sm:text-[11px] font-bold uppercase tracking-widest rounded-xl shadow-sm transition-all flex items-center gap-2 active:scale-95 w-full sm:w-auto justify-center">
                                <SafeIcon name="refresh-cw" size={14} /> Ladda fler kunder <span className="opacity-50 font-medium">({customerData.length - visibleCount} kvar)</span>
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
