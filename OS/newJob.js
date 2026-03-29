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
        datum: today, tid: '16:0', kundpris: '100', kommentar: ''
    });
    
    // Startar med 2 rader som standard
    const [expenses, setExpenses] = React.useState([{ desc: '', amount: '' }, { desc: '', amount: '' }]);
    const [suggestions, setSuggestions] = React.useState([]);
    const [regnrSuggestions, setRegnrSuggestions] = React.useState([]); // Ny state för regnr-förslag
    const [oilLiters, setOilLiters] = React.useState(5);

    // Återställning av data vid redigering
    React.useEffect(() => {
        if (editingJob) {
            // FALL 1: REDIGERA (Fyll i befintlig data)
            setFormData({ 
                ...editingJob, 
                datum: editingJob.datum?.split('T')[0] || today, 
                tid: editingJob.datum?.split('T')[1] || '08:00' 
            });
            if (editingJob.utgifter) {
                setExpenses(editingJob.utgifter.map(ex => ({ desc: ex.namn, amount: ex.kostnad })));
            }
        } else {
            // FALL 2: NYTT JOBB (Återställ till standardvärden)
            const prefill = window.prefillName || ''; 
            window.prefillName = null; // Rensa så det inte ligger kvar nästa gång

            setFormData({
                kundnamn: prefill, // Använd namn från kundprofilen om det finns
                regnr: '', 
                paket: 'Standard', 
                status: 'BOKAD',
                datum: today, 
                tid: '16:30', 
                kundpris: '100', 
                kommentar: ''
            });
            setExpenses([{ desc: '', amount: '' }, { desc: '', amount: '' }]);
            setOilLiters(5);
            setSuggestions([]);
            setRegnrSuggestions([]);
        }
    }, [editingJob]);

    // Beräkning för Oljebyte
    const updateOilLogic = (liters) => {
        const l = parseFloat(liters) || 0;
        const purchasePrice = l * 65;
        const customerPrice = (l * 200) + 200 + 500;
        
        const newExpenses = [
            { desc: `Motorolja (${l}l á 65kr)`, amount: purchasePrice.toString() },
            { desc: 'Oljefilter', amount: '200' },
            ...expenses.slice(2).filter(e => e.desc || e.amount) // Behåll manuella rader
        ];
        
        // Se till att vi har minst 2 rader totalt
        while (newExpenses.length < 2) newExpenses.push({ desc: '', amount: '' });

        setFormData(p => ({ ...p, kundpris: customerPrice.toString() }));
        setExpenses(newExpenses);
    };

    const handlePackageChange = (val) => {
        let price = "100";
        let newExpenses = [{ desc: '', amount: '' }, { desc: '', amount: '' }];

        if (val === "Hjulskifte") price = "200";
        if (val === "Felsökning") price = "500";
        if (val === "Oljebyte") {
            const l = oilLiters;
            price = (l * 200 + 700).toString();
            newExpenses = [
                { desc: `Motorolja (${l}l á 65kr)`, amount: (l * 65).toString() },
                { desc: 'Oljefilter', amount: '200' }
            ];
        }

        setFormData(p => ({ ...p, paket: val, kundpris: price }));
        setExpenses(newExpenses);
    };

    const handleOilVolumeChange = (val) => {
        setOilLiters(val);
        updateOilLogic(val);
    };

    const addExpenseRow = () => setExpenses([...expenses, { desc: '', amount: '' }]);
    const removeExpenseRow = (index) => {
        const n = expenses.filter((_, i) => i !== index);
        setExpenses(n.length ? n : [{ desc: '', amount: '' }]);
    };

    const handleNameChange = (val) => {
        setFormData(p => ({ ...p, kundnamn: val }));
        if (val.length > 1) {
            const matches = allJobs
                .filter(j => j.kundnamn.toLowerCase().includes(val.toLowerCase()))
                .map(j => j.kundnamn);
            setSuggestions([...new Set(matches)].slice(0, 5));
        } else {
            setSuggestions([]);
        }
    };

    // NYTT: Hitta bilar kopplade till det aktuella kundnamnet
    const relatedVehicles = React.useMemo(() => {
        if (!formData.kundnamn || formData.kundnamn.length < 2) return [];
        
        // Hitta alla jobb med exakt detta kundnamn (case-insensitive)
        const matches = allJobs
            .filter(j => j.kundnamn && j.kundnamn.toLowerCase() === formData.kundnamn.trim().toLowerCase())
            .map(j => j.regnr ? j.regnr.toUpperCase() : null)
            .filter(r => r); // Ta bort tomma
            
        return [...new Set(matches)]; // Returnera unika regnr
    }, [formData.kundnamn, allJobs]);

    // Ny funktion för att hantera sökförslag på regnr
    const handleRegnrChange = (val) => {
        const upperVal = val ? val.toUpperCase() : '';
        setFormData(p => ({ ...p, regnr: upperVal }));
        
        if (upperVal.length > 0) {
            // Om man skriver: Sök globalt bland alla jobb
            const matches = allJobs
                .filter(j => j.regnr?.toUpperCase().includes(upperVal))
                .map(j => j.regnr.toUpperCase());
            setRegnrSuggestions([...new Set(matches)].slice(0, 5));
        } else {
            // Om fältet är tomt: Visa kundens bilar om de finns
            if (relatedVehicles.length > 0) {
                setRegnrSuggestions(relatedVehicles);
            } else {
                setRegnrSuggestions([]);
            }
        }
    };

    const handleSave = async (e) => {
        e.preventDefault();
        try {
            const data = { 
                ...formData, 
                regnr: formData.regnr.toUpperCase().trim(), 
                datum: formData.datum ? `${formData.datum}T${formData.tid}` : '', 
                utgifter: expenses.filter(ex => ex.desc && ex.amount).map(ex => ({ namn: ex.desc, kostnad: ex.amount })),
                deleted: false 
            };

            if (editingJob && editingJob.id) {
                // Uppdatera befintligt jobb
                await window.db.collection("jobs").doc(editingJob.id).set(data, { merge: true });
            } else {
                // Skapa helt nytt jobb
                await window.db.collection("jobs").add(data);
            }
            
            // Gå tillbaka till dashboarden
            setView('DASHBOARD', null);
        } catch (error) {
            console.error("Kunde inte spara jobbet:", error);
            alert("Ett fel uppstod när jobbet skulle sparas. Kolla uppkopplingen!");
        }
    };

    return (
        // max-w-3xl och ml-0 behåller din vänsterställda, kompakta layout!
        <div className="max-w-3xl ml-0 animate-in fade-in slide-in-from-left-4 duration-500 mb-6">
            <div className="bg-white lg:shadow-2xl lg:rounded-sm overflow-hidden border border-zinc-200">
                
                {/* HEADER */}
                <div className="bg-zinc-950 p-6 flex items-center justify-between border-b-2 theme-border">
                    <div className="flex items-center gap-4">
                        <div className="w-10 h-10 theme-bg flex items-center justify-center rounded-sm shadow-[0_0_15px_rgba(249,115,22,0.3)]">
                            <SafeIcon name={editingJob ? "edit-3" : "plus"} size={20} className="text-black" />
                        </div>
                        <div>
                            <span className="text-[8px] font-black theme-text uppercase tracking-[0.3em] block leading-none mb-1.5">System_Input</span>
                            <h2 className="text-sm font-black text-white uppercase tracking-widest leading-none">
                                {editingJob ? 'Update_Sequence' : 'Create_New_Mission'}
                            </h2>
                        </div>
                    </div>
                </div>

                <form onSubmit={handleSave} className="p-6 lg:p-8 space-y-10 bg-[#f8f8f8]">
                    
                    {/* SEKTION 1: IDENTIFIERING */}
                    <div className="space-y-5">
                        <div className="flex items-center gap-2 border-b border-zinc-200 pb-2">
                            <SafeIcon name="fingerprint" size={12} className="theme-text" />
                            <span className="text-[10px] font-black text-zinc-800 uppercase tracking-[0.2em]">Entity_Identifier</span>
                        </div>
                        <FormRow>
                            <InputWrapper label="Client_Name" icon="user">
                                <div className="relative">
                                    <input 
                                        type="text" value={formData.kundnamn} onChange={e => handleNameChange(e.target.value)} 
                                        className="w-full bg-zinc-50 focus:bg-white border border-zinc-200 p-3 text-xs font-bold outline-none focus:theme-border focus:shadow-[0_0_0_3px_rgba(249,115,22,0.1)] transition-all rounded-sm" 
                                        placeholder="Sök eller skriv namn..." 
                                    />
                                    {suggestions.length > 0 && (
                                        <div className="absolute z-10 w-full bg-white border border-zinc-200 shadow-xl mt-1 rounded-sm overflow-hidden">
                                            {suggestions.map((s, i) => (
                                                <div key={i} onClick={() => { setFormData(p => ({ ...p, kundnamn: s })); setSuggestions([]); }} className="p-3 text-xs hover:bg-zinc-100 cursor-pointer font-bold uppercase border-b border-zinc-50 last:border-0">{s}</div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </InputWrapper>
                            <InputWrapper label="Registry_Number" icon="truck">
                                <div className="relative">
                                    <input 
                                        type="text" value={formData.regnr} onChange={e => handleRegnrChange(e.target.value)} onFocus={() => handleRegnrChange(formData.regnr)}
                                        className="w-full bg-zinc-50 focus:bg-white border border-zinc-200 p-3 text-sm font-black theme-text font-mono outline-none focus:theme-border focus:shadow-[0_0_0_3px_rgba(249,115,22,0.1)] uppercase tracking-widest transition-all rounded-sm" 
                                        placeholder="ABC123" autoComplete="off" 
                                    />
                                    {regnrSuggestions.length > 0 && (
                                        <div className="absolute z-10 w-full bg-white border border-zinc-200 shadow-xl mt-1 rounded-sm overflow-hidden">
                                            {regnrSuggestions.map((s, i) => (
                                                <div key={i} onClick={() => { setFormData(p => ({ ...p, regnr: s })); setRegnrSuggestions([]); }} className="p-3 text-xs hover:bg-zinc-100 cursor-pointer font-bold font-mono border-b border-zinc-50 last:border-0">{s}</div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </InputWrapper>
                        </FormRow>
                    </div>

                    {/* SEKTION 2: PARAMETRAR */}
                    <div className="space-y-5">
                        <div className="flex items-center gap-2 border-b border-zinc-200 pb-2">
                            <SafeIcon name="sliders" size={12} className="theme-text" />
                            <span className="text-[10px] font-black text-zinc-800 uppercase tracking-[0.2em]">Mission_Parameters</span>
                        </div>

                        {/* NYTT: Segmenterad Status-väljare (Mycket snabbare än dropdown) */}
                        <InputWrapper label="Mission_Status" icon="activity">
                            <div className="flex bg-zinc-200/50 p-1 rounded-sm border border-zinc-200/80 w-full mb-4">
                                {['BOKAD', 'OFFERERAD', 'KLAR', 'FAKTURERAS'].map(s => (
                                    <button
                                        key={s} type="button" onClick={() => setFormData(p => ({ ...p, status: s }))}
                                        className={`flex-1 py-2.5 text-[9px] font-black uppercase tracking-wider rounded-[2px] transition-all ${formData.status === s ? 'bg-white shadow-sm text-black border border-zinc-200/80 scale-[1.02]' : 'text-zinc-400 hover:text-zinc-600'}`}
                                    >
                                        {s}
                                    </button>
                                ))}
                            </div>
                        </InputWrapper>

                        <FormRow>
                            <div>
                                <InputWrapper label="Service_Type" icon="layers">
                                    <select value={formData.paket} onChange={e => handlePackageChange(e.target.value)} className="w-full bg-zinc-50 focus:bg-white border border-zinc-200 p-3 text-xs font-bold outline-none focus:theme-border focus:shadow-[0_0_0_3px_rgba(249,115,22,0.1)] transition-all rounded-sm cursor-pointer">
                                        <option value="Standard">Standard</option>
                                        <option value="Oljebyte">Oljebyte</option>
                                        <option value="Hjulskifte">Hjulskifte</option>
                                        <option value="Felsökning">Felsökning</option>
                                    </select>
                                </InputWrapper>
                                {formData.paket === "Oljebyte" && (
                                    <div className="mt-3 p-4 bg-zinc-100 border border-zinc-200 rounded-sm animate-in slide-in-from-top-2">
                                        <label className="text-[8px] font-black text-zinc-500 uppercase tracking-tighter mb-1.5 block">Antal liter motorolja</label>
                                        <input 
                                            type="number" step="0.1" value={oilLiters} onChange={e => handleOilVolumeChange(e.target.value)} 
                                            className="w-full bg-white border border-zinc-300 p-2 text-xs font-black font-mono outline-none focus:border-orange-500 rounded-sm" 
                                        />
                                    </div>
                                )}
                            </div>
                            
                            <div className="grid grid-cols-2 gap-4">
                                <InputWrapper label="Deploy_Date" icon="calendar">
                                    <input 
                                        type="date" 
                                        value={formData.datum} 
                                        onChange={e => setFormData(p => ({ ...p, datum: e.target.value }))} 
                                        /* Tvingar upp kalendern vid klick var som helst i fältet */
                                        onClick={(e) => e.target.showPicker && e.target.showPicker()}
                                        className="w-full bg-zinc-50 focus:bg-white border border-zinc-200 p-3 text-[11px] font-mono font-bold outline-none focus:theme-border focus:shadow-[0_0_0_3px_rgba(249,115,22,0.1)] transition-all rounded-sm cursor-pointer" 
                                    />
                                </InputWrapper>
                                <InputWrapper label="Time_Win" icon="clock">
                                    <input 
                                        type="time" 
                                        /* Begränsar valbara tider i de flesta webbläsare */
                                        min="06:00"
                                        max="21:00"
                                        value={formData.tid} 
                                        onChange={e => setFormData(p => ({ ...p, tid: e.target.value }))} 
                                        /* Tvingar upp klockan vid klick var som helst i fältet */
                                        onClick={(e) => e.target.showPicker && e.target.showPicker()}
                                        className="w-full bg-zinc-50 focus:bg-white border border-zinc-200 p-3 text-[11px] font-mono font-bold outline-none focus:theme-border focus:shadow-[0_0_0_3px_rgba(249,115,22,0.1)] transition-all rounded-sm cursor-pointer" 
                                    />
                                </InputWrapper>
                            </div>
                        </FormRow>
                    </div>

                    {/* SEKTION 3: EKONOMI */}
                    <div className="space-y-5">
                        <div className="flex items-center gap-2 border-b border-zinc-200 pb-2">
                            <SafeIcon name="credit-card" size={12} className="theme-text" />
                            <span className="text-[10px] font-black text-zinc-800 uppercase tracking-[0.2em]">Financial_Data</span>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-5 bg-white rounded-sm border border-zinc-200 shadow-sm">
                            <InputWrapper label="Final_Price" icon="dollar-sign">
                                <div className="bg-zinc-50 p-2 rounded-sm border border-zinc-300 flex items-center focus-within:bg-white focus-within:theme-border focus-within:shadow-[0_0_0_3px_rgba(249,115,22,0.1)] transition-all">
                                    <input type="number" value={formData.kundpris} onChange={e => setFormData(p => ({ ...p, kundpris: e.target.value }))} className="w-full bg-transparent text-zinc-900 text-2xl font-black font-mono outline-none text-right" placeholder="0" />
                                    <span className="ml-3 text-[10px] font-black text-zinc-400 mr-2">SEK</span>
                                </div>
                            </InputWrapper>

                            <div className="space-y-3">
                                <div className="flex items-center justify-between">
                                    <label className="text-[9px] font-black text-zinc-400 uppercase tracking-widest flex items-center gap-2 ml-1">
                                        <SafeIcon name="shopping-cart" size={10} className="theme-text" />Resource_Expenses
                                    </label>
                                    <button type="button" onClick={addExpenseRow} className="text-[8px] font-black theme-bg text-black uppercase px-2 py-1 rounded-[2px] hover:brightness-110 active:scale-95 transition-all">+ Lägg till</button>
                                </div>
                                {expenses.map((ex, i) => (
                                    <div key={i} className="flex gap-2 items-center">
                                        <input placeholder="Del / Artikel" value={ex.desc} onChange={e => { const n = [...expenses]; n[i].desc = e.target.value; setExpenses(n); }} className="flex-1 bg-zinc-50 focus:bg-white border border-zinc-200 p-2.5 text-[11px] font-bold outline-none rounded-sm transition-colors focus:border-zinc-400" />
                                        <input placeholder="Kr" type="number" value={ex.amount} onChange={e => { const n = [...expenses]; n[i].amount = e.target.value; setExpenses(n); }} className="w-20 bg-zinc-50 focus:bg-white border border-zinc-200 p-2.5 text-[11px] font-bold font-mono outline-none text-right rounded-sm transition-colors focus:border-zinc-400" />
                                        <button type="button" onClick={() => removeExpenseRow(i)} className="text-zinc-400 hover:text-red-500 transition-colors p-2">
                                            <SafeIcon name="trash-2" size={14} />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* SEKTION 4: LOGGAR */}
                    <div className="space-y-5">
                        <div className="flex items-center gap-2 border-b border-zinc-200 pb-2">
                            <SafeIcon name="terminal" size={12} className="theme-text" />
                            <span className="text-[10px] font-black text-zinc-800 uppercase tracking-[0.2em]">System_Logs</span>
                        </div>
                        <InputWrapper label="Internal_Mission_Logs" icon="file-text">
                            <textarea value={formData.kommentar} onChange={e => setFormData(p => ({ ...p, kommentar: e.target.value }))} className="w-full border border-zinc-200 p-4 font-mono text-[11px] font-bold text-zinc-700 min-h-[100px] outline-none focus:theme-border focus:shadow-[0_0_0_3px_rgba(249,115,22,0.1)] bg-zinc-50 focus:bg-white transition-all resize-y rounded-sm" placeholder=">_ Skriv terminal-anteckningar här..." />
                        </InputWrapper>
                    </div>

                    {/* KNAPPAR */}
                    <div className="pt-6 mt-8 border-t border-zinc-200 flex flex-col sm:flex-row gap-3">
                        <button type="submit" className="flex-1 theme-bg text-black font-black py-4 text-[12px] uppercase tracking-[0.2em] shadow-[0_10px_20px_rgba(249,115,22,0.2)] hover:brightness-110 active:scale-95 transition-all text-center rounded-sm">
                            Confirm_Push
                        </button>
                        
                        {editingJob && editingJob.status !== 'KLAR' && (
                            <button 
                                type="button" 
                                onClick={async () => {
                                    await window.db.collection("jobs").doc(editingJob.id).update({ status: 'KLAR' });
                                    setView('DASHBOARD');
                                }} 
                                className="w-full sm:w-auto px-8 bg-emerald-500 text-white font-black py-4 text-[12px] uppercase tracking-widest hover:bg-emerald-600 transition-all shadow-md active:scale-95 text-center rounded-sm"
                            >
                                Markera Klar
                            </button>
                        )}

                        <button type="button" onClick={() => window.history.back()} className="w-full sm:w-auto px-10 border border-zinc-300 bg-white text-zinc-500 font-black py-4 text-[12px] uppercase tracking-widest hover:bg-zinc-100 hover:text-red-500 transition-all active:scale-95 text-center shadow-sm rounded-sm">
                            Cancel
                        </button>
                    </div>

                </form>
            </div>
        </div>
    );
};
