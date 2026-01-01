// newJob.js

// Säkra ikoner för att undvika removeChild-felet
const SafeIcon = ({ name, size = 14, className = "" }) => (
    <span className="inline-flex items-center justify-center shrink-0">
        <window.Icon name={name} size={size} className={className} />
    </span>
);

const FormSection = ({ icon, title, label, children }) => (
    <div className="space-y-3">
        <div className="flex items-center gap-2 border-b border-zinc-100 pb-2">
            <div className="theme-bg p-1 rounded-sm text-black">
                <SafeIcon name={icon} size={12} />
            </div>
            <div>
                <h3 className="text-[10px] font-black uppercase tracking-widest text-zinc-950 leading-none">{title}</h3>
                <span className="text-[7px] font-bold text-zinc-400 uppercase tracking-tighter">{label}</span>
            </div>
        </div>
        <div className="space-y-2.5">
            {children}
        </div>
    </div>
);

const CompactInput = ({ label, children }) => (
    <div className="space-y-1">
        <label className="text-[8px] font-black text-zinc-400 uppercase tracking-tight ml-0.5">{label}</label>
        {children}
    </div>
);

window.NewJobView = ({ editingJob, setView, allJobs = [] }) => {
    const today = new Date().toISOString().split('T')[0];
    const [formData, setFormData] = React.useState({
        kundnamn: '', regnr: '', paket: 'Standard Service', status: 'BOKAD',
        datum: today, tid: '08:00', kundpris: '', kommentar: ''
    });
    
    // Alltid 5 rader som standard
    const [expenses, setExpenses] = React.useState(Array(4).fill({ desc: '', amount: '' }));
    const [suggestions, setSuggestions] = React.useState([]);

    React.useEffect(() => {
        if (editingJob) {
            setFormData({ 
                ...editingJob, 
                datum: editingJob.datum?.split('T')[0] || today, 
                tid: editingJob.datum?.split('T')[1] || '08:00' 
            });
            if (editingJob.utgifter) {
                const padded = [...editingJob.utgifter.map(ex => ({ desc: ex.namn, amount: ex.kostnad }))];
                while (padded.length < 5) padded.push({ desc: '', amount: '' });
                setExpenses(padded);
            }
        }
    }, [editingJob]);

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
        <div className="bg-white border border-zinc-200 shadow-2xl rounded-sm overflow-hidden animate-in zoom-in-95 duration-200 max-w-6xl mx-auto">
            {/* Header: Kompakt och mörk */}
            <div className="bg-zinc-950 p-4 flex items-center justify-between border-b border-orange-600">
                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 theme-bg flex items-center justify-center rounded-sm shadow-lg">
                        <SafeIcon name={editingJob ? "edit-3" : "plus"} size={18} className="text-black" />
                    </div>
                    <div>
                        <span className="text-[8px] font-black text-orange-500 uppercase tracking-[0.3em] block">Mission_Control</span>
                        <h2 className="text-sm font-black text-white uppercase tracking-widest">
                            {editingJob ? 'Update_Sequence' : 'New_Matrix_Entry'}
                        </h2>
                    </div>
                </div>
                <div className="text-[9px] font-mono text-zinc-500 font-bold uppercase tracking-widest">
                    Status: <span className="text-orange-500">System_Active</span>
                </div>
            </div>

            <form onSubmit={handleSave} className="p-4 lg:p-6 bg-zinc-50/30">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    
                    {/* KOLUMN 1: IDENTITET */}
                    <FormSection icon="truck" title="Identity" label="Vehicle & Client Info">
                        <CompactInput label="Registry_Number">
                            <div className="relative">
                                <input type="text" value={formData.regnr} onChange={e => setFormData(p => ({ ...p, regnr: e.target.value.toUpperCase() }))} className="w-full bg-white border border-zinc-200 p-2 text-sm font-black theme-text font-mono outline-none focus:border-orange-500 uppercase pr-10" />
                                <button type="button" onClick={copyToClipboard} className="absolute right-2 top-1/2 -translate-y-1/2 text-zinc-300 hover:theme-text"><SafeIcon name="copy" size={14} /></button>
                            </div>
                        </CompactInput>
                        <CompactInput label="Client_Name">
                            <input type="text" value={formData.kundnamn} onChange={e => setFormData(p => ({ ...p, kundnamn: e.target.value }))} className="w-full bg-white border border-zinc-200 p-2 text-xs font-bold outline-none focus:border-orange-500" />
                        </CompactInput>
                        <CompactInput label="Service_Type">
                            <select value={formData.paket} onChange={e => setFormData(p => ({ ...p, paket: e.target.value }))} className="w-full bg-white border border-zinc-200 p-2 text-xs font-bold outline-none focus:border-orange-500 cursor-pointer">
                                <option>Standard Service</option>
                                <option>Oljebyte</option>
                                <option>Bromsservice</option>
                                <option>Felsökning</option>
                            </select>
                        </CompactInput>
                    </FormSection>

                    {/* KOLUMN 2: OPS */}
                    <FormSection icon="clock" title="Operations" label="Scheduling & Logs">
                        <div className="grid grid-cols-2 gap-2">
                            <CompactInput label="Date"><input type="date" value={formData.datum} onChange={e => setFormData(p => ({ ...p, datum: e.target.value }))} className="w-full border p-2 text-xs font-mono font-bold outline-none" /></CompactInput>
                            <CompactInput label="Time"><input type="time" value={formData.tid} onChange={e => setFormData(p => ({ ...p, tid: e.target.value }))} className="w-full border p-2 text-xs font-mono font-bold outline-none" /></CompactInput>
                        </div>
                        <CompactInput label="Mission_Status">
                            <select value={formData.status} onChange={e => setFormData(p => ({ ...p, status: e.target.value }))} className="w-full theme-panel p-2 text-xs font-black uppercase outline-none theme-border border">
                                <option value="BOKAD">Bokad</option>
                                <option value="OFFERERAD">Offererad</option>
                                <option value="KLAR">Klar</option>
                                <option value="FAKTURERAS">Faktureras</option>
                            </select>
                        </CompactInput>
                        <CompactInput label="Internal_Log">
                            <textarea value={formData.kommentar} onChange={e => setFormData(p => ({ ...p, kommentar: e.target.value }))} className="w-full border border-zinc-200 p-2 font-mono text-[10px] min-h-[85px] outline-none focus:border-orange-500 bg-white" placeholder="LOG_ENTRY_PROMPT..." />
                        </CompactInput>
                    </FormSection>

                    {/* KOLUMN 3: FINANCE */}
                    <FormSection icon="credit-card" title="Finance" label="Revenue & Expenses">
                        <CompactInput label="Final_Price_SEK">
                            <div className="bg-zinc-950 p-3 rounded-sm border-l-4 border-orange-500 shadow-inner">
                                <input type="number" value={formData.kundpris} onChange={e => setFormData(p => ({ ...p, kundpris: e.target.value }))} className="w-full bg-transparent text-white text-xl font-black font-mono outline-none text-right" placeholder="0" />
                            </div>
                        </CompactInput>
                        
                        <div className="mt-4">
                            <label className="text-[8px] font-black text-zinc-400 uppercase tracking-widest block mb-2">Resource_Allocation (Utgifter)</label>
                            <div className="space-y-1 max-h-[160px] overflow-y-auto pr-1 no-scrollbar">
                                {expenses.map((ex, i) => (
                                    <div key={i} className="flex gap-1 group items-center">
                                        <input 
                                            placeholder="Del" 
                                            value={ex.desc} 
                                            onChange={e => { const n = [...expenses]; n[i].desc = e.target.value; setExpenses(n); }} 
                                            className="flex-1 border-b border-zinc-100 p-1.5 text-[10px] font-bold outline-none focus:border-orange-500 bg-transparent" 
                                        />
                                        <input 
                                            placeholder="Kr" 
                                            type="number" 
                                            value={ex.amount} 
                                            onChange={e => { const n = [...expenses]; n[i].amount = e.target.value; setExpenses(n); }} 
                                            className="w-16 border-b border-zinc-100 p-1.5 text-[10px] font-bold font-mono outline-none focus:border-orange-500 bg-transparent text-right" 
                                        />
                                        
                                        {/* Uppdaterad knapp: Alltid synlig och mer markerad */}
                                        <button 
                                            type="button" 
                                            onClick={() => setExpenses(expenses.filter((_, idx) => idx !== i))} 
                                            className="text-zinc-400 hover:text-red-600 transition-colors p-1.5"
                                            title="Radera rad"
                                        >
                                            <SafeIcon name="trash-2" size={14} />
                                        </button>
                                    </div>
                                ))}
                            </div>
                            <button type="button" onClick={() => setExpenses([...expenses, {desc:'', amount:''}])} className="text-[8px] font-black theme-text uppercase hover:underline mt-2 flex items-center gap-1">
                                <SafeIcon name="plus" size={8} /> Add_Row
                            </button>
                        </div>
                    </FormSection>
                </div>

                <div className="mt-8 pt-4 border-t border-zinc-100 flex flex-col sm:flex-row gap-3">
                    <button type="submit" className="flex-1 theme-bg text-black font-black py-3 text-[10px] uppercase tracking-[0.3em] shadow-lg hover:brightness-110 active:scale-[0.98] transition-all">
                        Execute_Save_Sequence
                    </button>
                    <button type="button" onClick={() => setView('DASHBOARD')} className="px-8 border border-zinc-200 text-zinc-400 font-black py-3 text-[10px] uppercase tracking-widest hover:bg-zinc-50 transition-all">
                        Abort_Action
                    </button>
                </div>
            </form>
        </div>
    );
};
