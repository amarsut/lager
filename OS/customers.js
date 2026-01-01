// customers.js

const HUDStat = ({ label, value }) => (
    <div className="theme-sidebar border-l-4 theme-border p-4 flex-1 shadow-lg min-w-[120px]">
        <span className="text-[8px] font-black opacity-50 uppercase tracking-widest block mb-1">{label}</span>
        <span className="text-lg font-mono font-black theme-text">{value}</span>
    </div>
);

window.CustomersView = ({ allJobs = [], setView }) => {
    const [search, setSearch] = React.useState('');
    const [viewing, setViewing] = React.useState(null);

    // Mappa kunder och samla historik
    const customers = React.useMemo(() => {
        const map = {};
        allJobs.forEach(j => {
            if (!j.kundnamn) return;
            const key = j.kundnamn.toLowerCase().trim();
            if (!map[key]) map[key] = { name: j.kundnamn, jobs: [], regs: new Set(), last: j.datum };
            map[key].jobs.push(j);
            if (j.regnr) map[key].regs.add(j.regnr.toUpperCase());
            if (j.datum > map[key].last) map[key].last = j.datum;
        });
        return Object.values(map).sort((a,b) => b.jobs.length - a.jobs.length);
    }, [allJobs]);

    const filtered = customers.filter(c => 
        (c.name || '').toLowerCase().includes(search.toLowerCase()) ||
        Array.from(c.regs).some(r => r.toLowerCase().includes(search.toLowerCase()))
    );

    // --- KUNDPROFIL: DETALJVY (Fix för radbrytning av bilar) ---
    if (viewing) {
        return (
            <div className="space-y-6 animate-in fade-in">
                <button onClick={() => setViewing(null)} className="text-[10px] font-black uppercase theme-text flex items-center gap-2">
                    <window.Icon name="arrow-left" size={14} /> Tillbaka till registret
                </button>
                
                <div className="theme-sidebar p-6 lg:p-8 border-l-4 theme-border">
                    <span className="text-[9px] font-black theme-text uppercase tracking-[0.3em]">Client_Identity</span>
                    <h2 className="text-3xl font-black uppercase text-white leading-tight">{viewing.name}</h2>
                    
                    {/* FIX: flex-wrap gör att bilarna stannar inom vyn */}
                    <div className="flex flex-wrap gap-2 mt-4 max-w-full">
                        {Array.from(viewing.regs).map(r => (
                            <span key={r} className="bg-white/10 px-3 py-1 text-[10px] font-mono font-bold text-white border border-white/20 uppercase rounded-sm whitespace-nowrap">
                                {r}
                            </span>
                        ))}
                    </div>
                </div>

                <div className="bg-white border shadow-2xl rounded-sm overflow-hidden">
                    <div className="p-4 bg-zinc-900 text-white text-[10px] font-black uppercase tracking-widest">Missions_History</div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-[11px] min-w-[500px]">
                            <thead className="bg-zinc-50 border-b text-[9px] font-black text-zinc-400 uppercase">
                                <tr><th className="p-4">Regnr</th><th className="p-4">Tjänst</th><th className="p-4">Datum</th><th className="p-4 text-right">Pris</th></tr>
                            </thead>
                            <tbody className="divide-y">
                                {viewing.jobs.sort((a,b) => b.datum.localeCompare(a.datum)).map(j => (
                                    <tr key={j.id} className="hover:bg-zinc-50">
                                        <td className="p-4 font-mono font-black theme-text uppercase">{j.regnr}</td>
                                        <td className="p-4 font-bold uppercase">{j.paket || 'Service'}</td>
                                        <td className="p-4 text-zinc-500 font-mono whitespace-nowrap">{j.datum?.replace('T', ' ')}</td>
                                        <td className="p-4 text-right font-black">{(parseInt(j.kundpris) || 0).toLocaleString()} kr</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        );
    }

    // --- HUVUDLISTA: KUNDREGISTRET ---
    return (
        <div className="space-y-6">
            <div className="bg-white border shadow-2xl rounded-sm overflow-hidden">
                <div className="p-4 border-b theme-sidebar">
                    <input value={search} onChange={e => setSearch(e.target.value)} placeholder="SÖK IDENTITET..." className="w-full bg-zinc-800/50 text-white p-3 border border-zinc-700 text-[11px] font-bold outline-none font-mono uppercase focus:theme-border" />
                </div>

                {/* DATORVY: Med Besök och Senast Sedd */}
                <table className="hidden lg:table w-full text-left">
                    <thead className="bg-zinc-900 text-zinc-400 text-[9px] uppercase tracking-widest font-black">
                        <tr>
                            <th className="px-6 py-4">Identity // Operator</th>
                            <th className="px-6 py-4">Fleet</th>
                            <th className="px-6 py-4 text-center">Besök</th>
                            <th className="px-6 py-4">Senast Sedd</th>
                            <th className="px-6 py-4 text-right">Profil</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-100">
                        {filtered.map(c => (
                            <tr key={c.name} onClick={() => setViewing(c)} className="hover:bg-zinc-50 cursor-pointer border-l-4 border-transparent hover:theme-border group">
                                <td className="px-6 py-4">
                                    <div className="font-black uppercase text-[12px] text-zinc-900">{c.name}</div>
                                    <div className="text-[8px] text-zinc-400 font-bold uppercase tracking-widest mt-0.5">Verified_Profile</div>
                                </td>
                                <td className="px-6 py-4 font-mono text-[10px] theme-text">
                                    <div className="flex gap-1 flex-wrap">
                                        {Array.from(c.regs).map(r => <span key={r} className="bg-orange-50 px-1 border border-orange-100">{r}</span>)}
                                    </div>
                                </td>
                                <td className="px-6 py-4 text-center font-black text-zinc-900">{c.jobs.length} st</td>
                                <td className="px-6 py-4 font-mono text-[10px] text-zinc-400 italic">
                                    {c.last ? c.last.split('T')[0] : '---'}
                                </td>
                                <td className="px-6 py-4 text-right text-[10px] font-black uppercase theme-text">Öppna →</td>
                            </tr>
                        ))}
                    </tbody>
                </table>

                {/* MOBILVY: Kort */}
                <div className="lg:hidden divide-y divide-zinc-100">
                    {filtered.map(c => (
                        <div key={c.name} onClick={() => setViewing(c)} className="p-4 active:bg-zinc-50 flex justify-between items-center transition-all">
                            <div className="space-y-1">
                                <div className="text-[13px] font-black uppercase text-zinc-900 leading-tight">{c.name}</div>
                                <div className="text-[11px] font-mono theme-text font-black">{Array.from(c.regs).slice(0, 1)} (+{c.regs.size - 1})</div>
                            </div>
                            <div className="flex items-center gap-4">
                                <div className="w-10 h-10 rounded-full bg-zinc-900 text-white font-black flex items-center justify-center font-mono">{c.regs.size}</div>
                                <window.Icon name="chevron-right" className="theme-text" size={16} />
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};
