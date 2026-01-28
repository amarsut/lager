// history.js - "Timeline Edition" (No Space in Regnr)

window.VehicleHistoryModal = ({ regnr, onClose }) => {
    const [history, setHistory] = React.useState([]);
    const [loading, setLoading] = React.useState(true);
    const [stats, setStats] = React.useState({ total: 0, count: 0 });

    React.useEffect(() => {
        const fetchHistory = async () => {
            if (!regnr) return;
            setLoading(true);
            try {
                // Smart sökning (fortfarande flexibel i bakgrunden)
                const cleanReg = regnr.replace(/\s+/g, '').toUpperCase();
                const spacedReg = cleanReg.replace(/^([A-Z]{3})(\d{2,3}[A-Z]?)$/, '$1 $2');
                const rawReg = regnr;
                const searchTerms = [...new Set([cleanReg, spacedReg, rawReg, rawReg.toUpperCase()])];

                const snap = await window.db.collection('jobs')
                    .where('regnr', 'in', searchTerms) 
                    .get();

                const jobs = snap.docs
                    .map(d => ({ id: d.id, ...d.data() }))
                    .filter(j => !j.deleted)
                    .sort((a, b) => {
                        if (!a.datum) return 1;
                        if (!b.datum) return -1;
                        return b.datum.localeCompare(a.datum);
                    });

                setHistory(jobs);
                const sum = jobs.reduce((acc, curr) => acc + (parseInt(curr.kundpris) || 0), 0);
                setStats({ total: sum, count: jobs.length });
                
            } catch (err) {
                console.error("Kunde inte hämta historik:", err);
            } finally {
                setLoading(false);
            }
        };
        fetchHistory();
    }, [regnr]);

    // ÄNDRING HÄR: Ingen formattering med mellanslag längre. Bara Versaler.
    const displayReg = regnr.toUpperCase().replace(/\s+/g, '');

    return (
        <div 
            className="fixed inset-0 z-[300] flex items-end sm:items-center justify-center sm:p-4 animate-in fade-in duration-200"
        >
            <div className="absolute inset-0 bg-[#09090b]/85 backdrop-blur-sm" onClick={onClose}></div>

            <div className="relative w-full h-full sm:h-auto sm:max-w-2xl bg-[#f4f4f5] sm:bg-white sm:rounded-lg shadow-2xl overflow-hidden flex flex-col animate-in slide-in-from-bottom-full sm:slide-in-from-bottom-10 duration-300">
                
                {/* --- HEADER --- */}
                <div className="bg-[#18181b] text-white px-5 py-4 sm:px-6 sm:py-5 border-b border-white/10 shrink-0 flex items-center justify-between sticky top-0 z-50 pt-safe-top shadow-md">
                    <div className="flex items-center gap-4">
                        <button 
                            onClick={onClose}
                            className="w-9 h-9 flex items-center justify-center rounded-full bg-zinc-800 active:bg-zinc-700 transition-colors sm:hidden"
                        >
                            <window.Icon name="arrow-left" size={18} />
                        </button>
                        
                        <div>
                            <div className="flex items-center gap-2 mb-0.5">
                                <span className="w-1.5 h-1.5 rounded-full bg-orange-500 hidden sm:block"></span>
                                <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Journal</span>
                            </div>
                            {/* Visar nu JAZ886 (utan mellanslag) */}
                            <h2 className="text-3xl font-black font-mono tracking-tighter uppercase leading-none text-white">
                                {displayReg}
                            </h2>
                        </div>
                    </div>

                    <div className="hidden sm:flex flex-col items-end">
                        <span className="text-[9px] text-zinc-400 font-bold uppercase tracking-widest mb-0.5">Totalt</span>
                        <div className="flex items-baseline gap-1">
                            <span className="text-xl font-mono font-bold text-orange-500 leading-none">{stats.total.toLocaleString()}</span>
                            <span className="text-[9px] text-zinc-500 font-bold">kr</span>
                        </div>
                    </div>

                     <div className="sm:hidden flex flex-col items-end">
                        <span className="text-[9px] text-zinc-500 font-bold uppercase tracking-widest">Omsättning</span>
                        <span className="text-lg font-mono font-bold text-orange-500 leading-none">{stats.total.toLocaleString()} <span className="text-[10px]">kr</span></span>
                    </div>
                    
                    <button onClick={onClose} className="hidden sm:flex w-8 h-8 items-center justify-center rounded-full hover:bg-white/10 transition-colors absolute right-4 top-4">
                        <window.Icon name="x" size={18} />
                    </button>
                </div>

                {/* --- CONTENT --- */}
                <div className="overflow-y-auto bg-[#f4f4f5] sm:bg-zinc-50 flex-1 p-0 pb-24 sm:pb-0">
                    {loading ? (
                        <div className="flex flex-col items-center justify-center py-20 opacity-50">
                            <window.Icon name="loader" size={24} className="animate-spin text-zinc-400 mb-2" />
                            <span className="text-[10px] font-mono uppercase text-zinc-400">Laddar journal...</span>
                        </div>
                    ) : history.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-32 opacity-40">
                            <window.Icon name="ghost" size={40} className="text-zinc-400 mb-4" />
                            <div className="text-zinc-500 text-[12px] font-black uppercase tracking-widest">Loggen är tom</div>
                        </div>
                    ) : (
                        <>
                            {/* --- DESKTOP TABLE --- */}
                            <div className="hidden sm:block">
                                <table className="w-full text-left border-collapse">
                                    <thead className="bg-white border-b border-zinc-200 sticky top-0 z-10 shadow-sm">
                                        <tr>
                                            <th className="py-3 pl-6 pr-4 text-[9px] font-black text-zinc-400 uppercase tracking-widest w-32">Datum</th>
                                            <th className="py-3 px-4 text-[9px] font-black text-zinc-400 uppercase tracking-widest">Info / Åtgärd</th>
                                            <th className="py-3 px-4 text-[9px] font-black text-zinc-400 uppercase tracking-widest text-right">Status</th>
                                            <th className="py-3 pl-4 pr-6 text-[9px] font-black text-zinc-400 uppercase tracking-widest text-right">Summa</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-zinc-200/50 bg-white">
                                        {history.map((job) => (
                                            <tr key={job.id} className="group hover:bg-zinc-50 transition-colors">
                                                <td className="py-4 pl-6 pr-4 align-top">
                                                    <div className="flex flex-col">
                                                        <span className="text-[11px] font-mono font-bold text-zinc-900">{job.datum ? job.datum.split('T')[0] : '-'}</span>
                                                        <span className="text-[9px] font-mono text-zinc-400 pt-0.5">#{job.id.substring(0,6)}</span>
                                                    </div>
                                                </td>
                                                <td className="py-4 px-4 align-top">
                                                    <div className="flex flex-col gap-1">
                                                        <div className="text-[11px] font-black text-zinc-900 uppercase tracking-tight">{job.kundnamn}</div>
                                                        {job.kommentar ? (
                                                            <div className="text-[11px] text-zinc-600 leading-relaxed font-medium max-w-xs">{job.kommentar}</div>
                                                        ) : <span className="text-[10px] text-zinc-300 italic">Ingen notering</span>}
                                                    </div>
                                                </td>
                                                <td className="py-4 px-4 align-top text-right"><window.Badge status={job.status} /></td>
                                                <td className="py-4 pl-4 pr-6 align-top text-right">
                                                    <div className="text-[13px] font-mono font-bold text-zinc-900">
                                                        {parseInt(job.kundpris) > 0 ? parseInt(job.kundpris).toLocaleString() : '0'}
                                                        <span className="text-[10px] text-zinc-400 ml-1 font-normal">kr</span>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>

                            {/* --- MOBILE TIMELINE --- */}
                            <div className="sm:hidden px-4 py-6">
                                <div className="relative border-l-2 border-zinc-200 ml-4 space-y-8">
                                    {history.map((job) => {
                                        let day = "00";
                                        let month = "JAN";
                                        if(job.datum) {
                                            const d = new Date(job.datum);
                                            day = d.getDate();
                                            month = d.toLocaleDateString('sv-SE', { month: 'short' }).replace('.', '').toUpperCase();
                                        }

                                        return (
                                            <div key={job.id} className="relative pl-6">
                                                <div className={`absolute -left-[7px] top-0 w-[12px] h-[12px] rounded-full border-2 border-[#f4f4f5] 
                                                    ${['KLAR', 'FAKTURERAS'].includes(job.status) ? 'bg-emerald-500' : 'bg-orange-500'}`}>
                                                </div>

                                                <div className="flex items-center gap-2 mb-2 -mt-1.5">
                                                    <span className="text-[13px] font-black text-zinc-900">{day} {month}</span>
                                                    <div className="w-1 h-1 rounded-full bg-zinc-300"></div>
                                                    <span className="text-[10px] font-mono text-zinc-400">ID: {job.id.substring(0,6)}</span>
                                                </div>

                                                <div className="bg-white rounded-lg p-3 shadow-sm border border-zinc-200/60 active:scale-[0.99] transition-transform">
                                                    <div className="flex justify-between items-start mb-2">
                                                        <div className="text-[13px] font-black text-zinc-900 uppercase tracking-tight">{job.kundnamn}</div>
                                                        <window.Badge status={job.status} />
                                                    </div>
                                                    
                                                    {job.kommentar ? (
                                                        <div className="bg-zinc-50 rounded p-2 mb-3 border border-zinc-100">
                                                            <p className="text-[12px] text-zinc-700 leading-snug font-medium">
                                                                {job.kommentar}
                                                            </p>
                                                        </div>
                                                    ) : (
                                                        <div className="mb-3 text-[11px] text-zinc-300 italic">Ingen notering sparad.</div>
                                                    )}

                                                    <div className="flex justify-between items-center border-t border-zinc-100 pt-2">
                                                        <span className="text-[9px] font-bold text-zinc-400 uppercase tracking-wider">Debiterat</span>
                                                        <div className="flex items-baseline gap-1">
                                                            <span className="text-[16px] font-mono font-bold text-zinc-900">
                                                                {parseInt(job.kundpris) > 0 ? parseInt(job.kundpris).toLocaleString() : '0'}
                                                            </span>
                                                            <span className="text-[9px] font-bold text-zinc-400">SEK</span>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        </>
                    )}
                </div>

                {/* --- FOOTER --- */}
                <div className="hidden sm:flex bg-white border-t border-zinc-200 p-3 justify-end shrink-0">
                    <button 
                        onClick={onClose}
                        className="px-6 py-2 bg-zinc-900 hover:bg-zinc-800 text-white text-[10px] font-black uppercase tracking-widest rounded-sm transition-colors"
                    >
                        Stäng
                    </button>
                </div>

                <div className="sm:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-zinc-200 p-3 px-4 pb-safe-bottom shadow-[0_-5px_15px_rgba(0,0,0,0.05)] z-[310]">
                     <button 
                        onClick={onClose}
                        className="w-full py-3 bg-zinc-900 text-white text-[11px] font-black uppercase tracking-widest rounded-[4px] shadow-lg active:scale-[0.98] transition-transform"
                    >
                        Stäng Journal
                    </button>
                </div>

            </div>
        </div>
    );
};
