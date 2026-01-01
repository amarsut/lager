// newJob.js

const SectionHeader = ({ icon, title }) => (
    <div className="flex items-center gap-2 pb-2 border-b-2 border-zinc-100 mb-4">
        <window.Icon name={icon} size={16} className="theme-text" />
        <h3 className="text-[11px] font-black uppercase tracking-widest text-zinc-400">{title}</h3>
    </div>
);

const InputGroup = ({ label, children }) => (
    <div className="space-y-1.5 mb-4">
        <label className="text-[9px] font-black text-zinc-400 uppercase tracking-tighter ml-1">{label}</label>
        {children}
    </div>
);

window.NewJobView = ({ editingJob, setView, allJobs = [] }) => {
    const today = new Date().toISOString().split('T')[0];
    const [formData, setFormData] = React.useState({
        kundnamn: '', regnr: '', paket: 'Standard Service', status: 'BOKAD',
        datum: today, tid: '08:00', kundpris: '', kommentar: ''
    });
    const [expenses, setExpenses] = React.useState([{ desc: '', amount: '' }]);
    const [suggestions, setSuggestions] = React.useState([]);

    // Hämta unik kunddata för sökfunktionen
    const customerDb = React.useMemo(() => {
        const map = {};
        allJobs.forEach(j => {
            if (j.kundnamn) {
                const key = j.kundnamn.toLowerCase().trim();
                if (!map[key] || j.datum > map[key].datum) {
                    map[key] = { name: j.kundnamn, lastReg: j.regnr || '' };
                }
            }
        });
        return Object.values(map);
    }, [allJobs]);

    React.useEffect(() => {
        if (editingJob) {
            setFormData({ 
                ...editingJob, 
                datum: editingJob.datum?.split('T')[0] || today, 
                tid: editingJob.datum?.split('T')[1] || '08:00' 
            });
            if (editingJob.utgifter) {
                setExpenses(editingJob.utgifter.map(ex => ({ 
                    desc: ex.namn || ex.desc || '', 
                    amount: ex.kostnad || ex.amount || '' 
                })));
            }
        }
    }, [editingJob]);

    const handleNameChange = (val) => {
        setFormData(p => ({ ...p, kundnamn: val }));
        if (val.length > 1) {
            setSuggestions(customerDb.filter(c => c.name.toLowerCase().includes(val.toLowerCase())));
        } else {
            setSuggestions([]);
        }
    };

    const copyToClipboard = () => {
        if (!formData.regnr) return;
        navigator.clipboard.writeText(formData.regnr);
    };

    const handleSave = async (e) => {
        e.preventDefault();
        const data = { 
            ...formData, 
            regnr: formData.regnr.toUpperCase().trim(), 
            datum: formData.datum ? `${formData.datum}T${formData.tid}` : '', 
            utgifter: expenses.filter(ex => ex.desc && ex.amount).map(ex => ({ namn: ex.desc, kostnad: ex.amount })),
            deleted: false 
        };
        await window.db.collection("jobs").doc(editingJob?.id || undefined).set(data, { merge: true });
        setView('DASHBOARD');
    };

    return (
        <div className="bg-white border shadow-2xl rounded-sm overflow-hidden animate-in fade-in">
            <div className="bg-zinc-900 p-4 lg:p-6 flex items-center gap-4 border-b border-orange-500/30">
                <div className="w-10 h-10 theme-bg flex items-center justify-center rounded-sm">
                    <window.Icon name={editingJob ? "edit-3" : "plus"} className="text-black" size={24} />
                </div>
                <h2 className="text-white font-black uppercase tracking-widest text-sm">
                    {editingJob ? 'Update Entry' : 'New Matrix Entry'}
                </h2>
            </div>

            <form onSubmit={handleSave} className="p-4 lg:p-8">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 lg:gap-12">
                    
                    {/* KOLUMN 1: IDENTITET */}
                    <div>
                        <SectionHeader icon="truck" title="Client & Vehicle" />
                        <InputGroup label="Regnr">
                            <div className="relative flex items-center">
                                <input type="text" value={formData.regnr} onChange={e => setFormData(p => ({ ...p, regnr: e.target.value.toUpperCase() }))} className="w-full border p-3 text-lg font-black theme-text font-mono outline-none focus:theme-border uppercase pr-12" />
                                <button type="button" onClick={copyToClipboard} className="absolute right-2 p-2 text-zinc-300 hover:theme-text"><window.Icon name="copy" size={18} /></button>
                            </div>
                        </InputGroup>
                        <InputGroup label="Kundnamn">
                            <div className="relative">
                                <input type="text" value={formData.kundnamn} onChange={e => handleNameChange(e.target.value)} className="w-full border p-3 font-bold outline-none focus:theme-border" />
                                {suggestions.length > 0 && (
                                    <div className="absolute z-50 w-full bg-white border shadow-2xl mt-1 max-h-40 overflow-auto">
                                        {suggestions.map(s => (
                                            <div key={s.name} onClick={() => { setFormData(p => ({ ...p, kundnamn: s.name, regnr: s.lastReg })); setSuggestions([]); }} className="p-3 hover:theme-bg hover:text-black cursor-pointer text-[10px] font-black uppercase flex justify-between border-b">
                                                <span>{s.name}</span>
                                                <span className="opacity-50">{s.lastReg}</span>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </InputGroup>
                        <InputGroup label="Tjänst">
                            <select value={formData.paket} onChange={e => setFormData(p => ({ ...p, paket: e.target.value }))} className="w-full border p-3 font-bold outline-none focus:theme-border">
                                <option>Standard Service</option>
                                <option>Oljebyte</option>
                                <option>Bromsservice</option>
                                <option>Felsökning</option>
                            </select>
                        </InputGroup>
                    </div>

                    {/* KOLUMN 2: PLANERING & LOGG */}
                    <div>
                        <SectionHeader icon="clock" title="Planning" />
                        <div className="grid grid-cols-2 gap-4">
                            <InputGroup label="Datum"><input type="date" value={formData.datum} onChange={e => setFormData(p => ({ ...p, datum: e.target.value }))} className="border p-3 w-full font-bold outline-none focus:theme-border" /></InputGroup>
                            <InputGroup label="Tid"><input type="time" value={formData.tid} onChange={e => setFormData(p => ({ ...p, tid: e.target.value }))} className="border p-3 w-full font-bold outline-none focus:theme-border" /></InputGroup>
                        </div>
                        <InputGroup label="Status">
                            <select value={formData.status} onChange={e => setFormData(p => ({ ...p, status: e.target.value }))} className="w-full border-2 theme-border bg-zinc-50 p-3 font-black theme-text uppercase outline-none">
                                <option value="BOKAD">Bokad</option>
                                <option value="KLAR">Klar</option>
                                <option value="FAKTURERAS">Faktureras</option>
                            </select>
                        </InputGroup>
                        <InputGroup label="Arbetsorder / Kommentar">
                            <textarea value={formData.kommentar} onChange={e => setFormData(p => ({ ...p, kommentar: e.target.value }))} className="w-full border p-3 font-mono text-[11px] min-h-[145px] outline-none focus:theme-border bg-zinc-50" placeholder="Beskriv vad som ska göras..." />
                        </InputGroup>
                    </div>

                    {/* KOLUMN 3: EKONOMI & UTGIFTER */}
                    <div>
                        <SectionHeader icon="credit-card" title="Finance & Expenses" />
                        <InputGroup label="Kundpris (SEK)">
                            <input type="number" value={formData.kundpris} onChange={e => setFormData(p => ({ ...p, kundpris: e.target.value }))} className="w-full bg-zinc-900 theme-text p-4 text-3xl font-black font-mono outline-none" />
                        </InputGroup>
                        
                        <div className="space-y-2 mt-4">
                            <label className="text-[9px] font-black text-zinc-400 uppercase tracking-widest">Utgifter / Delar</label>
                            <div className="max-h-[200px] overflow-y-auto pr-2 space-y-2">
                                {expenses.map((ex, i) => (
                                    <div key={i} className="flex gap-2">
                                        <input placeholder="Del/Beskrivning" value={ex.desc} onChange={e => { const n = [...expenses]; n[i].desc = e.target.value; setExpenses(n); }} className="flex-1 border p-2 text-[10px] font-bold outline-none focus:theme-border" />
                                        <input placeholder="Kr" type="number" value={ex.amount} onChange={e => { const n = [...expenses]; n[i].amount = e.target.value; setExpenses(n); }} className="w-20 border p-2 text-[10px] font-bold font-mono outline-none focus:theme-border" />
                                        <button type="button" onClick={() => setExpenses(expenses.filter((_, idx) => idx !== i))} className="text-zinc-300 hover:text-red-500"><window.Icon name="trash-2" size={14} /></button>
                                    </div>
                                ))}
                            </div>
                            <button type="button" onClick={() => setExpenses([...expenses, {desc:'', amount:''}])} className="text-[9px] font-black theme-text uppercase hover:underline pt-2">+ Lägg till rad</button>
                        </div>
                    </div>
                </div>

                <div className="mt-8 pt-6 border-t flex flex-col sm:flex-row gap-3">
                    <button type="submit" className="w-full sm:w-auto px-20 theme-bg text-black font-black py-4 text-[11px] uppercase tracking-widest shadow-lg">Spara Matrix Entry</button>
                    <button type="button" onClick={() => setView('DASHBOARD')} className="w-full sm:w-auto px-10 border border-zinc-200 py-4 text-[11px] font-black uppercase text-zinc-400">Cancel</button>
                </div>
            </form>
        </div>
    );
};
