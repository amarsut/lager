// customers.js

// Behåller SafeIcon för att undvika krascher
const SafeIcon = ({ name, size = 16, className = "" }) => (
    <span className="inline-flex items-center justify-center shrink-0">
        <window.Icon name={name} size={size} className={className} />
    </span>
);

const HUDStat = ({ label, value, icon }) => (
    <div className="bg-zinc-950 border-l-4 border-orange-600 p-3 flex-1 shadow-lg relative overflow-hidden group">
        <div className="absolute right-[-5px] top-[-5px] opacity-10">
            <SafeIcon name={icon} size={40} />
        </div>
        <span className="text-[7px] font-black text-orange-500 uppercase tracking-widest block mb-0.5">{label}</span>
        <span className="text-xl font-mono font-black text-white leading-none">{value}</span>
    </div>
);

window.CustomersView = ({ allJobs = [], setView }) => {
    const [search, setSearch] = React.useState('');
    const [viewing, setViewing] = React.useState(null);

    const customers = React.useMemo(() => {
        if (!allJobs || allJobs.length === 0) return [];
        const map = {};
        allJobs.forEach(j => {
            if (!j || !j.kundnamn) return;
            const key = j.kundnamn.toLowerCase().trim();
            if (!map[key]) {
                map[key] = { name: j.kundnamn, jobs: [], regs: new Set(), last: j.datum || '' };
            }
            map[key].jobs.push(j);
            if (j.regnr) map[key].regs.add(j.regnr.toUpperCase());
            if (j.datum && j.datum > map[key].last) map[key].last = j.datum;
        });
        return Object.values(map).sort((a,b) => b.jobs.length - a.jobs.length);
    }, [allJobs]);

    const filtered = customers.filter(c => 
        (c.name || '').toLowerCase().includes(search.toLowerCase())
    );

    if (viewing) {
        return (
            <div key="profile-view" className="space-y-4 animate-in fade-in duration-200">
                <button onClick={() => setViewing(null)} className="text-[9px] font-black uppercase theme-text flex items-center gap-2 hover:opacity-70">
                    <SafeIcon name="arrow-left" size={12} /> TILLBAKA
                </button>
                
                <div className="bg-zinc-950 p-6 border-l-4 border-orange-600 shadow-xl">
                    <span className="text-[8px] font-black text-orange-500 uppercase tracking-widest block mb-1">DATA_IDENTITY</span>
                    <h2 className="text-xl font-black uppercase text-white">{viewing.name}</h2>
                    <div className="flex flex-wrap gap-1.5 mt-3">
                        {Array.from(viewing.regs).map(r => (
                            <span key={r} className="bg-zinc-800 px-2 py-1 text-[10px] font-mono font-black text-white border border-zinc-700 uppercase">
                                {r}
                            </span>
                        ))}
                    </div>
                </div>

                <div className="bg-white border border-zinc-200 shadow-lg rounded-sm overflow-hidden">
                    <div className="p-3 bg-zinc-900 text-white text-[9px] font-black uppercase tracking-widest flex items-center gap-2">
                        <SafeIcon name="database" size={14} className="text-orange-500" /> LOG_HISTORY
                    </div>
                    <table className="w-full text-left text-[11px]">
                        <thead className="bg-zinc-50 border-b border-zinc-100 text-[8px] font-black text-zinc-400 uppercase">
                            <tr><th className="p-3">UNIT</th><th className="p-3">SERVICE</th><th className="p-3">DATE</th><th className="p-3 text-right">FEE</th></tr>
                        </thead>
                        <tbody className="divide-y divide-zinc-100">
                            {viewing.jobs.sort((a,b) => (b.datum || '').localeCompare(a.datum || '')).map(j => (
                                <tr key={j.id} className="hover:bg-zinc-50">
                                    <td className="p-3 font-mono font-black text-orange-600 uppercase">{j.regnr || 'N/A'}</td>
                                    <td className="p-3 font-black uppercase text-zinc-800">{j.paket || 'SERVICE'}</td>
                                    <td className="p-3 text-zinc-500 font-mono text-[10px]">{j.datum?.replace('T', ' // ')}</td>
                                    <td className="p-3 text-right font-black text-zinc-900">{(parseInt(j.kundpris) || 0).toLocaleString()} kr</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        );
    }

    return (
        <div key="grid-view" className="space-y-4 animate-in fade-in duration-300">
            {/* HUD: Mindre padding */}
            <div className="flex flex-col lg:flex-row gap-3">
                <HUDStat label="REGISTERED_CLIENTS" value={customers.length} icon="users" />
                <HUDStat label="TOTAL_ACTIVE_UNITS" value={customers.reduce((a,b) => a + b.regs.size, 0)} icon="truck" />
            </div>

            {/* SEARCH: Kompaktare */}
            <div className="relative shadow-md">
                <SafeIcon name="search" size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-orange-500" />
                <input 
                    value={search} 
                    onChange={e => setSearch(e.target.value)} 
                    placeholder="SÖK IDENTITET..." 
                    className="w-full bg-zinc-900 text-white p-3.5 pl-12 border-b-2 border-zinc-800 font-mono text-xs focus:border-orange-600 outline-none uppercase tracking-widest" 
                />
            </div>

            {/* GRID: Tätare gap för 14" skärm */}
            <div className="hidden lg:grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                {filtered.map(c => (
                    <div 
                        key={c.name} 
                        className="bg-white border border-zinc-200 shadow-sm hover:border-orange-600/30 transition-all rounded-sm flex flex-col"
                    >
                        <div className="p-4 flex-1">
                            <div className="flex justify-between items-start mb-4">
                                <div>
                                    <h3 className="font-black uppercase text-sm text-zinc-950 leading-none mb-1">{c.name}</h3>
                                    <div className="flex items-center gap-1">
                                        <div className="w-1.5 h-1.5 rounded-full bg-green-500 shadow-[0_0_5px_rgba(34,197,94,0.5)]"></div>
                                        <span className="text-[8px] text-zinc-400 font-black uppercase tracking-tighter">VERIFIED</span>
                                    </div>
                                </div>
                                <div className="bg-zinc-900 text-white p-1.5 rounded-sm">
                                    <SafeIcon name="user" size={14} />
                                </div>
                            </div>

                            {/* Data Matrix: Tätare padding */}
                            <div className="grid grid-cols-3 gap-0 border border-zinc-100 rounded-sm overflow-hidden mb-4">
                                <div className="p-2 border-r border-zinc-100 bg-zinc-50/50 text-center">
                                    <span className="block text-[7px] font-black text-zinc-400 uppercase mb-1">FORDON</span>
                                    <span className="font-black text-base text-zinc-900 font-mono">{c.regs.size}</span>
                                </div>
                                <div className="p-2 border-r border-zinc-100 bg-zinc-50/50 text-center">
                                    <span className="block text-[7px] font-black text-zinc-400 uppercase mb-1">BESÖK</span>
                                    <span className="font-black text-base text-zinc-900 font-mono">{c.jobs.length}</span>
                                </div>
                                {/* SENASTE BESÖK: Stor och Tydlig */}
                                <div className="p-2 bg-white text-center">
                                    <span className="block text-[7px] font-black text-orange-600/50 uppercase mb-1 tracking-tighter">SENAST</span>
                                    <span className="font-mono text-[11px] font-black text-orange-600 block leading-none">
                                        {c.last ? c.last.split('T')[0] : 'N/A'}
                                    </span>
                                </div>
                            </div>

                            <button 
                                onClick={() => setViewing(c)}
                                className="w-full bg-zinc-950 text-white font-black py-2.5 text-[10px] uppercase tracking-widest hover:bg-orange-600 transition-all flex items-center justify-center gap-2"
                            >
                                ACCESS_PROFILE <SafeIcon name="chevron-right" size={14} />
                            </button>
                        </div>
                    </div>
                ))}
            </div>

            {/* MOBILVY */}
            <div className="lg:hidden space-y-3">
                {filtered.map(c => (
                    <div key={c.name} onClick={() => setViewing(c)} className="bg-white border-l-4 border-orange-600 p-4 shadow-md flex justify-between items-center active:scale-95 transition-all">
                        <div>
                            <div className="text-sm font-black uppercase text-zinc-950">{c.name}</div>
                            <div className="text-[9px] font-mono text-orange-600 font-black mt-1">{c.regs.size} UNITS // {c.jobs.length} LOGS</div>
                        </div>
                        <SafeIcon name="chevron-right" className="text-zinc-300" size={18} />
                    </div>
                ))}
            </div>
        </div>
    );
};
