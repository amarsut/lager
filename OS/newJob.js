// newJob.js

const SafeIcon = ({ name, size = 14, className = "" }) => (
    <span className="inline-flex items-center justify-center shrink-0">
        <window.Icon name={name} size={size} className={className} />
    </span>
);

const FormRow = ({ children }) => <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">{children}</div>;

const InputWrapper = ({ label, icon, children }) => (
    <div className="space-y-1">
        <label className="text-[9px] font-black text-zinc-400 uppercase tracking-widest flex items-center gap-2 ml-1">
            <SafeIcon name={icon} size={10} className="theme-text" />
            {label}
        </label>
        {children}
    </div>
);

window.NewJobView = ({ editingJob, setView, allJobs = [] }) => {
    const today = new Date().toISOString().split('T')[0];
    const [formData, setFormData] = React.useState({
        kundnamn: '', regnr: '', paket: 'Standard', status: 'BOKAD',
        datum: today, tid: '08:00', kundpris: '100', kommentar: ''
    });
    
    // Startar med 2 rader som standard
    const [expenses, setExpenses] = React.useState([{ desc: '', amount: '' }, { desc: '', amount: '' }]);
    const [suggestions, setSuggestions] = React.useState([]);
    const [oilLiters, setOilLiters] = React.useState(5);

    React.useEffect(() => {
        if (editingJob) {
            setFormData({ 
                ...editingJob, 
                datum: editingJob.datum?.split('T')[0] || today, 
                tid: editingJob.datum?.split('T')[1] || '08:00' 
            });
            if (editingJob.utgifter) {
                setExpenses(editingJob.utgifter.map(ex => ({ desc: ex.namn, amount: ex.kostnad })));
            }
        }
    }, [editingJob]);

    // Beräkning av inköpspris och kundpris för olja
    const calculateOil = (liters) => {
        const purchasePrice = liters * 65; // 65kr/l inköp
        const customerPrice = (liters * 200) + 200 + 500; // 200kr/l + filter + arbete
        return { purchasePrice, customerPrice };
    };

    const handlePackageChange = (val) => {
        let price = "0";
        let newExpenses = [{ desc: '', amount: '' }, { desc: '', amount: '' }];

        if (val === "Standard") price = "100";
        if (val === "Hjulskifte") price = "200";
        if (val === "Felsökning") price = "500";
        
        if (val === "Oljebyte") {
            const { purchasePrice, customerPrice } = calculateOil(oilLiters);
            price = customerPrice.toString();
            newExpenses = [
                { desc: `Motorolja (${oilLiters}L) [Inköp: ${purchasePrice} kr]`, amount: purchasePrice.toString() },
                { desc: 'Oljefilter', amount: '200' }
            ];
        }

        setFormData(p => ({ ...p, paket: val, kundpris: price }));
        setExpenses(newExpenses);
    };

    const handleOilVolumeChange = (liters) => {
        const l = parseFloat(liters) || 0;
        setOilLiters(l);
        if (formData.paket === "Oljebyte") {
            const { purchasePrice, customerPrice } = calculateOil(l);
            const newExpenses = [
                { desc: `Motorolja (${l}L) [Inköp: ${purchasePrice} kr]`, amount: purchasePrice.toString() },
                { desc: 'Oljefilter', amount: '200' },
                ...expenses.slice(2) // Behåll eventuella manuellt tillagda rader
            ];
            setFormData(p => ({ ...p, kundpris: customerPrice.toString() }));
            setExpenses(newExpenses);
        }
    };

    const addExpenseRow = () => setExpenses([...expenses, { desc: '', amount: '' }]);
    const removeExpenseRow = (index) => {
        const newExpenses = expenses.filter((_, i) => i !== index);
        setExpenses(newExpenses.length ? newExpenses : [{ desc: '', amount: '' }]);
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
        <div className="max-w-3xl ml-0 animate-in fade-in slide-in-from-left-4 duration-500">
            <div className="bg-white border border-zinc-200 shadow-2xl rounded-sm overflow-hidden">
                <div className="bg-zinc-950 p-4 flex items-center justify-between border-b-2 theme-border">
                    <div className="flex items-center gap-4">
                        <div className="w-10 h-10 theme-bg flex items-center justify-center rounded-sm">
                            <SafeIcon name={editingJob ? "edit-3" : "plus"} size={20} className="text-black" />
                        </div>
                        <h2 className="text-sm font-black text-white uppercase tracking-widest">
                            {editingJob ? 'Update_Sequence' : 'Create_New_Mission'}
                        </h2>
                    </div>
                </div>

                <form onSubmit={handleSave} className="p-6 lg:p-8 space-y-6 bg-zinc-50/20">
                    <FormRow>
                        <InputWrapper label="Client_Name" icon="user">
                            <input type="text" value={formData.kundnamn} onChange={e => setFormData(p => ({...p, kundnamn: e.target.value}))} className="w-full bg-white border border-zinc-200 p-2.5 text-xs font-bold outline-none focus:theme-border" />
                        </InputWrapper>
                        <InputWrapper label="Registry_Number" icon="truck">
                            <input type="text" value={formData.regnr} onChange={e => setFormData(p => ({ ...p, regnr: e.target.value.toUpperCase() }))} className="w-full bg-white border border-zinc-200 p-2.5 text-sm font-black theme-text font-mono outline-none focus:theme-border uppercase tracking-widest" />
                        </InputWrapper>
                    </FormRow>

                    <FormRow>
                        <InputWrapper label="Mission_Status" icon="activity">
                            <select value={formData.status} onChange={e => setFormData(p => ({ ...p, status: e.target.value }))} className="w-full bg-white border border-zinc-200 p-2.5 text-xs font-black uppercase outline-none focus:theme-border">
                                <option value="BOKAD">Bokad</option>
                                <option value="OFFERERAD">Offererad</option>
                                <option value="KLAR">Klar</option>
                                <option value="FAKTURERAS">Faktureras</option>
                            </select>
                        </InputWrapper>
                        <div className="space-y-0">
                            <InputWrapper label="Service_Type" icon="layers">
                                <select value={formData.paket} onChange={e => handlePackageChange(e.target.value)} className="w-full bg-white border border-zinc-200 p-2.5 text-xs font-bold outline-none focus:theme-border">
                                    <option value="Standard">Standard</option>
                                    <option value="Oljebyte">Oljebyte</option>
                                    <option value="Hjulskifte">Hjulskifte</option>
                                    <option value="Felsökning">Felsökning</option>
                                </select>
                            </InputWrapper>
                            
                            {/* Oljevolym tätt under paketet utan extra luft */}
                            {formData.paket === "Oljebyte" && (
                                <div className="mt-2 p-3 bg-zinc-100 border border-zinc-200 rounded-sm animate-in slide-in-from-top-1">
                                    <label className="text-[8px] font-black text-zinc-500 uppercase tracking-tighter mb-1 block">Volym (L)</label>
                                    <input type="number" step="0.1" value={oilLiters} onChange={e => handleOilVolumeChange(e.target.value)} className="w-full bg-white border border-zinc-300 p-1.5 text-xs font-black font-mono outline-none focus:border-orange-500" />
                                </div>
                            )}
                        </div>
                    </FormRow>

                    <FormRow>
                        <InputWrapper label="Deployment_Date" icon="calendar">
                            <input type="date" value={formData.datum} onChange={e => setFormData(p => ({ ...p, datum: e.target.value }))} className="w-full bg-white border border-zinc-200 p-2.5 text-xs font-mono font-bold outline-none focus:theme-border" />
                        </InputWrapper>
                        <InputWrapper label="Timeline_Window" icon="clock">
                            <input type="time" value={formData.tid} onChange={e => setFormData(p => ({ ...p, tid: e.target.value }))} className="w-full bg-white border border-zinc-200 p-2.5 text-xs font-mono font-bold outline-none focus:theme-border" />
                        </InputWrapper>
                    </FormRow>

                    {/* Prisbox utan extra luft invändigt på mobil */}
                    <div className="p-0 md:p-4 bg-zinc-100/50 rounded-sm border-0 md:border border-zinc-200/50">
                        <InputWrapper label="Final_Price_SEK" icon="credit-card">
                            <div className="bg-white p-3 border border-zinc-300 shadow-sm flex items-center">
                                <input type="number" value={formData.kundpris} onChange={e => setFormData(p => ({ ...p, kundpris: e.target.value }))} className="w-full bg-transparent text-zinc-900 text-lg font-black font-mono outline-none text-right" />
                                <span className="ml-2 text-[8px] font-black text-zinc-400">SEK</span>
                            </div>
                        </InputWrapper>
                    </div>

                    {/* Utgifter separerade med tydlig avdelning */}
                    <div className="pt-6 border-t border-zinc-200 space-y-3">
                        <div className="flex items-center justify-between mb-2">
                            <label className="text-[9px] font-black text-zinc-400 uppercase tracking-widest flex items-center gap-2">
                                <SafeIcon name="shopping-cart" size={10} className="theme-text" />Resource_Expenses
                            </label>
                            <button type="button" onClick={addExpenseRow} className="text-[8px] font-black theme-text uppercase border border-orange-500/20 px-2 py-1 hover:bg-orange-500 hover:text-white transition-all">
                                <SafeIcon name="plus" size={8} className="mr-1" /> Add_Line
                            </button>
                        </div>
                        {expenses.map((ex, i) => (
                            <div key={i} className="flex gap-2 group animate-in fade-in duration-300">
                                <input placeholder="Beskrivning" value={ex.desc} onChange={e => { const n = [...expenses]; n[i].desc = e.target.value; setExpenses(n); }} className="flex-1 bg-white border border-zinc-200 p-2 text-[10px] font-bold outline-none focus:theme-border" />
                                <input placeholder="Kr" type="number" value={ex.amount} onChange={e => { const n = [...expenses]; n[i].amount = e.target.value; setExpenses(n); }} className="w-20 md:w-28 bg-white border border-zinc-200 p-2 text-[10px] font-bold font-mono outline-none focus:theme-border text-right" />
                                <button type="button" onClick={() => removeExpenseRow(i)} className="p-2 text-zinc-300 hover:text-red-500 transition-colors">
                                    <SafeIcon name="trash-2" size={12} />
                                </button>
                            </div>
                        ))}
                    </div>

                    <InputWrapper label="Internal_Mission_Logs" icon="file-text">
                        <textarea value={formData.kommentar} onChange={e => setFormData(p => ({ ...p, kommentar: e.target.value }))} className="w-full border border-zinc-200 p-3 font-mono text-[10px] min-h-[80px] outline-none focus:theme-border bg-white resize-none" placeholder="Skriv anteckningar här..." />
                    </InputWrapper>

                    <div className="pt-6 border-t border-zinc-200 flex gap-3">
                        <button type="submit" className="flex-1 theme-bg text-black font-black py-4 text-[11px] uppercase tracking-[0.3em] shadow-lg hover:brightness-110 active:scale-95 transition-all">Confirm_Push</button>
                        <button type="button" onClick={() => setView('DASHBOARD')} className="px-10 border border-zinc-200 text-zinc-400 font-black py-4 text-[11px] uppercase tracking-widest hover:bg-zinc-50 transition-all">Abort</button>
                    </div>
                </form>
            </div>
        </div>
    );
};
