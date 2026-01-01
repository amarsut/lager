// dashboard.js

// 1. Flytta hit SafeIcon för att skydda alla ikoner i vyn
const SafeIcon = ({ name, size = 14, className = "" }) => (
    <span className="inline-flex items-center justify-center shrink-0">
        <window.Icon name={name} size={size} className={className} />
    </span>
);

// 2. Flytta hit Badge så att status-logiken styrs härifrån
window.Badge = React.memo(({ status }) => {
    const s = (status || 'BOKAD').toUpperCase();
    const styles = {
        'BOKAD': 'theme-bg text-black font-black',
        'OFFERERAD': 'bg-blue-500 text-white font-bold',
        'KLAR': 'bg-black text-white font-bold',
        'FAKTURERAS': 'bg-zinc-100 text-zinc-500 border border-zinc-200',
    };
    return (
        <span className={`px-2 py-0.5 text-[8px] uppercase tracking-[0.1em] inline-block w-20 text-center rounded-xs ${styles[s] || styles['BOKAD']}`}>
            {s}
        </span>
    );
});

// 3. Huvudkomponenten för Dashboarden
window.DashboardView = React.memo(({ filteredJobs, setEditingJob, setView }) => {
    return (
        <div className="space-y-4 pb-20 lg:pb-0">
            {/* DATORVY: TABELL */}
            <div className="hidden lg:block bg-white border border-zinc-200 shadow-2xl rounded-sm overflow-hidden">
                <table className="w-full text-left">
                    <thead className="bg-zinc-900 text-zinc-400 text-[9px] uppercase tracking-widest font-black">
                        <tr>
                            <th className="px-6 py-4">Kund / Order</th>
                            <th className="px-6 py-4">Regnr</th>
                            <th className="px-6 py-4">Datum // Tid</th>
                            <th className="px-6 py-4">Status</th>
                            <th className="px-6 py-4 text-right">Belopp</th>
                            <th className="px-6 py-4 w-28 text-right">Åtgärd</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-100">
                        {filteredJobs.map(job => (
                            <tr key={job.id} className="hover:bg-zinc-50 transition-all border-l-4 border-transparent hover:theme-border group">
                                <td className="px-6 py-3 cursor-pointer" onClick={() => { setEditingJob(job); setView('NEW_JOB'); }}>
                                    <div className="text-[11px] font-black uppercase text-zinc-900">{job.kundnamn}</div>
                                    <div className="text-[8px] text-zinc-400 font-bold uppercase">{job.id.substring(0,8)}</div>
                                </td>
                                <td className="px-6 py-3 font-mono font-black theme-text text-[11px] uppercase">{job.regnr}</td>
                                <td className="px-6 py-3">
                                    {job.datum ? (
                                        <>
                                            <div className="text-[11px] font-bold text-zinc-500 font-mono">{job.datum.split('T')[0]}</div>
                                            <div className="text-[10px] theme-text font-black font-mono">kl. {job.datum.split('T')[1] || '--:--'}</div>
                                        </>
                                    ) : (
                                        <div className="text-[10px] font-black text-zinc-300 uppercase tracking-tighter flex items-center gap-1">
                                            <SafeIcon name="calendar-off" size={12} /> Ej Bokad
                                        </div>
                                    )}
                                </td>
                                <td className="px-6 py-3"><window.Badge status={job.status} /></td>
                                <td className="px-6 py-3 text-right font-black text-zinc-900">{(parseInt(job.kundpris) || 0).toLocaleString()} kr</td>
                                <td className="px-6 py-3 text-right">
                                    <div className="flex justify-end gap-2">
                                        <button onClick={() => { setEditingJob(job); setView('NEW_JOB'); }} className="p-1.5 text-zinc-400 hover:theme-text"><SafeIcon name="edit-3" size={16} /></button>
                                        <button onClick={() => { if(confirm("Radera?")) window.db.collection("jobs").doc(job.id).update({deleted:true}); }} className="p-1.5 text-zinc-400 hover:text-red-500"><SafeIcon name="trash-2" size={16} /></button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* MOBILVY: KORT */}
            <div className="lg:hidden space-y-3">
                {filteredJobs.map(job => (
                    <div key={job.id} onClick={() => { setEditingJob(job); setView('NEW_JOB'); }} className="bg-white border-l-4 theme-border p-4 shadow-md rounded-sm active:scale-[0.98]">
                        <div className="flex justify-between items-start mb-2">
                            <div>
                                <div className="text-[13px] font-black uppercase text-zinc-900 leading-tight">{job.kundnamn}</div>
                                <div className="text-[11px] font-mono theme-text font-black tracking-tight">{job.regnr}</div>
                            </div>
                            <window.Badge status={job.status} />
                        </div>
                        <div className="flex justify-between items-end border-t border-zinc-50 pt-2 mt-2">
                            <div className="text-[10px] font-mono flex flex-col">
                                {job.datum ? (
                                    <>
                                        <span className="text-zinc-400">{job.datum.split('T')[0]}</span>
                                        <span className="theme-text font-black">kl. {job.datum.split('T')[1] || '--:--'}</span>
                                    </>
                                ) : (
                                    <span className="text-zinc-300 font-black uppercase tracking-tighter flex items-center gap-1">
                                        <SafeIcon name="calendar-off" size={10} /> Ej Bokad
                                    </span>
                                )}
                            </div>
                            <div className="font-black text-zinc-900 text-sm">{(parseInt(job.kundpris) || 0).toLocaleString()} kr</div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
});
