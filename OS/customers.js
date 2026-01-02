// customers.js

const SafeIcon = ({ name, size = 14, className = "" }) => (
    <span className="inline-flex items-center justify-center shrink-0">
        <window.Icon name={name} size={size} className={className} />
    </span>
);

window.CustomersView = ({ allJobs, setView }) => {
    const [searchQuery, setSearchQuery] = React.useState('');
    const [selectedCustomer, setSelectedCustomer] = React.useState(null);

    const customerData = React.useMemo(() => {
        const groups = allJobs.reduce((acc, job) => {
            const name = job.kundnamn || 'N/A';
            if (!acc[name]) {
                acc[name] = {
                    name: name,
                    totalSpent: 0,
                    missionCount: 0,
                    vehicles: new Set(),
                    lastSeen: job.datum,
                    jobs: [],
                    avgValue: 0
                };
            }
            const price = parseInt(job.kundpris) || 0;
            acc[name].totalSpent += price;
            acc[name].missionCount += 1;
            acc[name].jobs.push(job);
            if (job.regnr) acc[name].vehicles.add(job.regnr.toUpperCase());
            if (new Date(job.datum) > new Date(acc[name].lastSeen)) acc[name].lastSeen = job.datum;
            acc[name].avgValue = acc[name].totalSpent / acc[name].missionCount;
            return acc;
        }, {});

        return Object.values(groups)
            .filter(c => c.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                    Array.from(c.vehicles).some(v => v.toLowerCase().includes(searchQuery.toLowerCase())))
            .sort((a, b) => b.totalSpent - a.totalSpent);
    }, [allJobs, searchQuery]);

    // --- VY: PROFIL (COMMAND CENTER) ---
    if (selectedCustomer) {
        return (
            <div className="animate-in fade-in zoom-in-95 duration-300">
                <div className="flex items-center justify-between mb-8">
                    <button onClick={() => setSelectedCustomer(null)} className="group flex items-center gap-3 bg-zinc-100 hover:bg-zinc-950 hover:text-white px-4 py-2 transition-all">
                        <SafeIcon name="arrow-left" size={16} className="group-hover:-translate-x-1 transition-transform" />
                        <span className="text-[10px] font-black uppercase tracking-[0.2em]">Exit_Profile</span>
                    </button>
                    <div className="flex gap-2">
                        <div className="bg-zinc-950 text-white px-4 py-2 text-right border-r-4 theme-border">
                            <div className="text-[11px] font-black uppercase tracking-tighter">{selectedCustomer.name}</div>
                            <div className="text-[8px] font-mono text-zinc-500 italic">SYSTEM_UID: {selectedCustomer.name.substring(0,8).toUpperCase()}</div>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 mb-8">
                    {[
                        { label: 'Revenue_Total', val: selectedCustomer.totalSpent.toLocaleString() + ' SEK', icon: 'credit-card' },
                        { label: 'Avg_Ticket', val: Math.round(selectedCustomer.avgValue).toLocaleString() + ' SEK', icon: 'bar-chart' },
                        { label: 'Deployment_Count', val: selectedCustomer.missionCount + ' Units', icon: 'database' },
                        { label: 'Last_Pulse', val: selectedCustomer.lastSeen?.split('T')[0] || 'N/A', icon: 'activity' }
                    ].map((stat, i) => (
                        <div key={i} className="bg-white border border-zinc-200 p-4 relative overflow-hidden group">
                            <div className="absolute top-0 right-0 p-2 opacity-10 group-hover:theme-text transition-colors">
                                <SafeIcon name={stat.icon} size={24} />
                            </div>
                            <div className="text-[8px] font-black text-zinc-400 uppercase tracking-widest mb-1">{stat.label}</div>
                            <div className="text-lg font-black font-mono text-zinc-900">{stat.val}</div>
                        </div>
                    ))}
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <div className="lg:col-span-2 bg-white border border-zinc-200 rounded-sm overflow-hidden">
                        <div className="bg-zinc-950 p-3 text-white text-[9px] font-black uppercase tracking-[0.3em] flex items-center gap-2">
                            <SafeIcon name="list" size={12} className="theme-text" /> Transaction_History
                        </div>
                        <div className="divide-y divide-zinc-100 max-h-[400px] overflow-auto">
                            {selectedCustomer.jobs.map((j, i) => (
                                <div key={i} className="p-4 hover:bg-zinc-50 transition-colors flex items-center justify-between group">
                                    <div className="flex items-center gap-6">
                                        <div className="text-[10px] font-mono font-bold text-zinc-400">{j.datum?.split('T')[0]}</div>
                                        <div>
                                            <div className="text-[11px] font-black uppercase text-zinc-900">{j.paket}</div>
                                            <div className="text-[9px] font-mono theme-text font-bold">{j.regnr}</div>
                                        </div>
                                    </div>
                                    <div className="text-right flex items-center gap-4">
                                        <div className="text-[12px] font-black font-mono">{(parseInt(j.kundpris) || 0).toLocaleString()} kr</div>
                                        <button onClick={() => { setView('NEW_JOB'); window.editingJob = j; }} className="opacity-0 group-hover:opacity-100 p-2 hover:theme-bg hover:text-black transition-all">
                                            <SafeIcon name="edit-2" size={14} />
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                    
                    <div className="bg-zinc-50 border border-zinc-200 p-6">
                        <div className="text-[9px] font-black text-zinc-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                            <SafeIcon name="truck" size={12} /> Asset_Inventory
                        </div>
                        <div className="space-y-2">
                            {Array.from(selectedCustomer.vehicles).map(v => (
                                <div key={v} className="bg-white border border-zinc-200 p-3 flex items-center justify-between group hover:border-orange-500/50 transition-all">
                                    <span className="text-xs font-mono font-black text-zinc-800">{v}</span>
                                    <div className="flex gap-1">
                                        <div className="w-1.5 h-1.5 rounded-full theme-bg animate-pulse"></div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    // --- VY: GRID (COMPACT SCANNER) ---
    return (
        <div className="space-y-6 animate-in fade-in duration-500 pb-20">
            {/* TITEL-MODUL SOM MATCHAR "NYTT JOBB" */}
            <div className="bg-zinc-950 p-4 flex items-center justify-between border-b-2 theme-border shadow-2xl">
                <div className="flex items-center gap-4">
                    <div className="w-10 h-10 theme-bg flex items-center justify-center rounded-sm shadow-lg">
                        <SafeIcon name="users" size={20} className="text-black" />
                    </div>
                    <div>
                        <span className="text-[9px] font-black theme-text uppercase tracking-[0.3em] block leading-none mb-1">
                            Database_Nexus
                        </span>
                        <h2 className="text-sm font-black text-white uppercase tracking-widest">
                            Intelligence_Briefing
                        </h2>
                    </div>
                </div>

                <div className="relative group hidden md:block">
                    <input 
                        type="text" 
                        placeholder="FILTER_RECORDS..." 
                        className="bg-zinc-900 border border-zinc-800 focus:theme-border p-2.5 pl-9 text-[10px] font-bold text-white outline-none w-64 transition-all uppercase tracking-widest"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                    <SafeIcon name="search" size={12} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500 group-focus-within:theme-text" />
                </div>
            </div>

            {/* MOBIL-SÖK */}
            <div className="md:hidden relative">
                <input 
                    type="text" 
                    placeholder="FILTER_RECORDS..." 
                    className="w-full bg-white border border-zinc-200 p-3 pl-10 text-[10px] font-black uppercase tracking-widest outline-none focus:theme-border"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                />
                <SafeIcon name="search" size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4">
                {customerData.map((customer, i) => (
                    <div 
                        key={i} 
                        onClick={() => setSelectedCustomer(customer)}
                        className="group bg-white border border-zinc-200 hover:border-zinc-950 transition-all cursor-pointer relative overflow-hidden flex flex-col h-[160px]"
                    >
                        <div className="absolute -bottom-4 -right-2 text-[60px] font-black text-zinc-50 group-hover:text-orange-50 transition-colors pointer-events-none italic">
                            #{i + 1}
                        </div>

                        <div className="p-4 flex-1">
                            <div className="flex justify-between items-start mb-4">
                                <div className="max-w-[80%]">
                                    <div className="text-[8px] font-black text-zinc-400 uppercase tracking-widest mb-0.5">Entity_Name</div>
                                    <h3 className="text-[13px] font-black uppercase leading-none truncate group-hover:theme-text transition-colors">{customer.name}</h3>
                                </div>
                                <div className="bg-zinc-100 p-1.5 group-hover:bg-zinc-950 group-hover:text-white transition-all">
                                    <SafeIcon name="maximize-2" size={12} />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <div className="text-[8px] font-black text-zinc-400 uppercase mb-0.5">Revenue</div>
                                    <div className="text-xs font-mono font-black italic">{(customer.totalSpent / 1000).toFixed(1)}k</div>
                                </div>
                                <div className="text-right">
                                    <div className="text-[8px] font-black text-zinc-400 uppercase mb-0.5">Deployments</div>
                                    <div className="text-xs font-mono font-black">{customer.missionCount}x</div>
                                </div>
                            </div>
                        </div>

                        <div className="mt-auto bg-zinc-50 p-3 border-t border-zinc-100 flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <div className={`w-2 h-2 rounded-full ${new Date() - new Date(customer.lastSeen) < 2592000000 ? 'theme-bg' : 'bg-zinc-300'}`}></div>
                                <span className="text-[9px] font-mono font-bold text-zinc-500 uppercase">
                                    {Array.from(customer.vehicles)[0] || '---'}
                                </span>
                            </div>
                            <span className="text-[8px] font-black text-zinc-300 uppercase italic">Status: Valid</span>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};
