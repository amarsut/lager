// newJob.js

const SafeIcon = ({ name, size = 14, className = "" }) => (
    <span className="inline-flex items-center justify-center shrink-0">
        <window.Icon name={name} size={size} className={className} />
    </span>
);

const FormRow = ({ children }) => <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-5">{children}</div>;

const InputWrapper = ({ label, icon, children }) => (
    <div className="space-y-2 group">
        <label className="text-[11px] font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-widest flex items-center gap-2 ml-1 group-focus-within:text-orange-500 transition-colors">
            <SafeIcon name={icon} size={12} className="text-zinc-400 dark:text-zinc-500 group-focus-within:text-orange-500 transition-colors" />
            {label}
        </label>
        {children}
    </div>
);

const SectionHeader = ({ title, sub, icon }) => (
    <div className="flex items-start gap-3 mb-6 pb-4 border-b border-zinc-200/50 dark:border-white/5">
        <div className="mt-1 h-5 w-1 bg-gradient-to-b from-orange-400 to-orange-600 rounded-full shadow-[0_0_10px_rgba(249,115,22,0.4)]" />
        <div>
            <div className="flex items-center gap-2">
                <SafeIcon name={icon} size={14} className="text-zinc-400 dark:text-zinc-500" />
                <h3 className="text-[13px] font-bold uppercase tracking-widest text-zinc-900 dark:text-white">{title}</h3>
            </div>
            {sub && <p className="text-[10px] font-medium uppercase tracking-[0.15em] text-zinc-400 dark:text-zinc-500 mt-1">{sub}</p>}
        </div>
    </div>
);

window.NewJobView = ({ editingJob, setView, allJobs = [] }) => {
    const today = new Date().toISOString().split('T')[0];
    const [formData, setFormData] = React.useState({
        kundnamn: '', regnr: '', paket: 'Standard', status: 'BOKAD',
        datum: today, tid: '16:00', kundpris: '100', kommentar: ''
    });
    
    const [expenses, setExpenses] = React.useState([{ desc: '', amount: '' }, { desc: '', amount: '' }]);
    const [suggestions, setSuggestions] = React.useState([]);
    const [regnrSuggestions, setRegnrSuggestions] = React.useState([]);
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
        } else {
            const prefill = window.prefillName || ''; 
            window.prefillName = null;

            setFormData({
                kundnamn: prefill,
                regnr: '', paket: 'Standard', status: 'BOKAD',
                datum: today, tid: '16:30', kundpris: '100', kommentar: ''
            });
            setExpenses([{ desc: '', amount: '' }, { desc: '', amount: '' }]);
            setOilLiters(5);
            setSuggestions([]);
            setRegnrSuggestions([]);
        }
    }, [editingJob, today]);

    const updateOilLogic = (liters) => {
        const l = parseFloat(liters) || 0;
        const purchasePrice = l * 65;
        const customerPrice = (l * 200) + 200 + 500;
        
        const newExpenses = [
            { desc: `Motorolja (${l}l á 65kr)`, amount: purchasePrice.toString() },
            { desc: 'Oljefilter', amount: '200' },
            ...expenses.slice(2).filter(e => e.desc || e.amount)
        ];
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
            const matches = allJobs.filter(j => j.kundnamn.toLowerCase().includes(val.toLowerCase())).map(j => j.kundnamn);
            setSuggestions([...new Set(matches)].slice(0, 5));
        } else setSuggestions([]);
    };

    const relatedVehicles = React.useMemo(() => {
        if (!formData.kundnamn || formData.kundnamn.length < 2) return [];
        const matches = allJobs
            .filter(j => j.kundnamn && j.kundnamn.toLowerCase() === formData.kundnamn.trim().toLowerCase())
            .map(j => j.regnr ? j.regnr.toUpperCase() : null)
            .filter(r => r);
        return [...new Set(matches)];
    }, [formData.kundnamn, allJobs]);

    const handleRegnrChange = (val) => {
        const upperVal = val ? val.toUpperCase() : '';
        setFormData(p => ({ ...p, regnr: upperVal }));
        if (upperVal.length > 0) {
            const matches = allJobs.filter(j => j.regnr?.toUpperCase().includes(upperVal)).map(j => j.regnr.toUpperCase());
            setRegnrSuggestions([...new Set(matches)].slice(0, 5));
        } else {
            if (relatedVehicles.length > 0) setRegnrSuggestions(relatedVehicles);
            else setRegnrSuggestions([]);
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
                await window.db.collection("jobs").doc(editingJob.id).set(data, { merge: true });
            } else {
                await window.db.collection("jobs").add(data);
            }
            setView('DASHBOARD', null);
        } catch (error) {
            console.error("Kunde inte spara jobbet:", error);
            alert("Ett fel uppstod när jobbet skulle sparas.");
        }
    };

    // FIX: Justerad färg till mörkblå (#1a2235) och minskad padding p-3 istället för p-3.5 så det får plats på mobilen
    const inputClasses = "w-full bg-zinc-50/50 dark:bg-[#1a2235] focus:bg-white dark:focus:bg-[#1f2940] border border-zinc-200/80 dark:border-white/10 p-3 text-[13px] sm:text-[14px] font-medium text-zinc-900 dark:text-white outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 transition-all rounded-xl shadow-sm";

    return (
        <div className="relative max-w-5xl animate-in fade-in slide-in-from-left-4 duration-700 pb-0 ml-0 w-full">
            
            {/* Ambient Background Glow */}
            <div className="absolute top-0 left-[-10%] w-[80%] h-[400px] bg-orange-500/10 dark:bg-orange-500/5 blur-[120px] rounded-full pointer-events-none -z-10"></div>

            {/* HEADER */}
            <div className="flex flex-col md:flex-row md:items-center justify-between mb-4 pb-4 border-b border-zinc-200 dark:border-white/5 gap-4 px-4 pt-2 lg:px-0 lg:pt-0">
                <div className="flex items-center gap-4 md:gap-5">
                    <div className="relative group cursor-default shrink-0">
                        <div className="absolute inset-0 bg-orange-500/40 blur-xl rounded-full transition-all duration-700 group-hover:bg-orange-500/60" />
                        <div className="relative w-12 h-12 md:w-14 md:h-14 rounded-xl md:rounded-2xl flex items-center justify-center text-white shadow-xl border border-white/20 transition-colors bg-gradient-to-br from-orange-400 to-orange-600">
                            <SafeIcon name={editingJob ? "edit-3" : "plus"} size={24} />
                        </div>
                    </div>
                    <div className="flex flex-col">
                        <h1 className="text-2xl md:text-3xl font-black text-zinc-900 dark:text-white uppercase tracking-tight leading-none">
                            {editingJob ? 'Mission' : 'New'} <span className="text-zinc-400 dark:text-zinc-500 font-light">{editingJob ? 'Update' : 'Job'}</span>
                        </h1>
                        <p className="text-[10px] md:text-[11px] font-bold text-orange-500 dark:text-orange-400 uppercase tracking-widest mt-1.5 flex items-center gap-2">
                            <span className="w-1.5 h-1.5 rounded-full bg-orange-500 animate-pulse"></span>
                            {editingJob ? 'Update_Sequence_Active' : 'Initialization_Phase'}
                        </p>
                    </div>
                </div>
            </div>

            {/* FORMULÄR */}
            <div className="px-4 lg:px-2">
                <form onSubmit={handleSave} className="space-y-6 md:space-y-8">
                    
                    {/* SEKTION 1: IDENTIFIERING */}
                    {/* FIX: dark:bg-[#182032] för hela rutorna */}
                    <div className="bg-white/80 dark:bg-[#182032]/80 backdrop-blur-xl border border-zinc-200/80 dark:border-white/5 rounded-3xl p-6 lg:p-8 shadow-sm hover:shadow-md transition-shadow">
                        <SectionHeader title="Entity_Identifier" sub="Client and Vehicle Data" icon="fingerprint" />
                        
                        <FormRow>
                            <InputWrapper label="Client_Name" icon="user">
                                <div className="relative">
                                    <input 
                                        type="text" value={formData.kundnamn} onChange={e => handleNameChange(e.target.value)} 
                                        className={inputClasses} 
                                        placeholder="Sök eller skriv namn..." 
                                    />
                                    {suggestions.length > 0 && (
                                        <div className="absolute z-50 w-full bg-white/95 dark:bg-[#1a2235]/95 backdrop-blur-xl border border-zinc-200 dark:border-white/10 shadow-2xl mt-2 rounded-xl overflow-hidden animate-in fade-in zoom-in-95">
                                            {suggestions.map((s, i) => (
                                                <div key={i} onClick={() => { setFormData(p => ({ ...p, kundnamn: s })); setSuggestions([]); }} className="p-3.5 text-[13px] text-zinc-900 dark:text-white hover:bg-orange-50 dark:hover:bg-[#25324d] hover:text-orange-600 dark:hover:text-orange-400 cursor-pointer font-bold uppercase border-b border-zinc-100 dark:border-white/5 last:border-0 transition-colors">
                                                    {s}
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </InputWrapper>
                            
                            <InputWrapper label="Registry_Number" icon="truck">
                                <div className="relative">
                                    <input 
                                        type="text" value={formData.regnr} onChange={e => handleRegnrChange(e.target.value)} onFocus={() => handleRegnrChange(formData.regnr)}
                                        className={`${inputClasses} font-mono uppercase tracking-[0.2em]`} 
                                        placeholder="ABC 123" autoComplete="off" 
                                    />
                                    {regnrSuggestions.length > 0 && (
                                        <div className="absolute z-50 w-full bg-white/95 dark:bg-[#1a2235]/95 backdrop-blur-xl border border-zinc-200 dark:border-white/10 shadow-2xl mt-2 rounded-xl overflow-hidden animate-in fade-in zoom-in-95">
                                            {regnrSuggestions.map((s, i) => (
                                                <div key={i} onClick={() => { setFormData(p => ({ ...p, regnr: s })); setRegnrSuggestions([]); }} className="p-3.5 text-[13px] text-zinc-900 dark:text-white hover:bg-orange-50 dark:hover:bg-[#25324d] hover:text-orange-600 dark:hover:text-orange-400 cursor-pointer font-bold font-mono tracking-widest border-b border-zinc-100 dark:border-white/5 last:border-0 transition-colors">
                                                    {s}
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </InputWrapper>
                        </FormRow>
                    </div>

                    {/* SEKTION 2: PARAMETRAR */}
                    <div className="bg-white/80 dark:bg-[#182032]/80 backdrop-blur-xl border border-zinc-200/80 dark:border-white/5 rounded-3xl p-6 lg:p-8 shadow-sm hover:shadow-md transition-shadow">
                        <SectionHeader title="Mission_Parameters" sub="Scheduling and Service Configuration" icon="sliders" />

                        <div className="mb-6">
                            <InputWrapper label="Mission_Status" icon="activity">
                                {/* FIX: Dark theme färg och mindre text/padding för att förhindra trängsel */}
                                <div className="flex bg-zinc-100 dark:bg-[#1a2235] p-1.5 rounded-xl border border-zinc-200/80 dark:border-white/5 w-full">
                                    {['BOKAD', 'OFFERERAD', 'KLAR', 'FAKTURERAS'].map(s => (
                                        <button
                                            key={s} type="button" onClick={() => setFormData(p => ({ ...p, status: s }))}
                                            className={`flex-1 py-2.5 px-1 text-[9px] sm:text-[11px] font-bold uppercase tracking-widest rounded-lg transition-all duration-300 ${formData.status === s ? 'bg-white dark:bg-[#25324d] shadow-sm text-zinc-900 dark:text-white' : 'text-zinc-500 dark:text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300 hover:bg-zinc-200/50 dark:hover:bg-white/5'}`}
                                        >
                                            {s}
                                        </button>
                                    ))}
                                </div>
                            </InputWrapper>
                        </div>

                        <FormRow>
                            <div className="space-y-4">
                                <InputWrapper label="Service_Type" icon="layers">
                                    <div className="relative">
                                        <select value={formData.paket} onChange={e => handlePackageChange(e.target.value)} className={`${inputClasses} appearance-none cursor-pointer pr-10`}>
                                            <option value="Standard">Standard</option>
                                            <option value="Oljebyte">Oljebyte</option>
                                            <option value="Hjulskifte">Hjulskifte</option>
                                            <option value="Felsökning">Felsökning</option>
                                        </select>
                                        <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-zinc-400">
                                            <SafeIcon name="chevron-down" size={16} />
                                        </div>
                                    </div>
                                </InputWrapper>
                                
                                {formData.paket === "Oljebyte" && (
                                    <div className="p-5 bg-orange-50/50 dark:bg-orange-500/5 border border-orange-200 dark:border-orange-500/20 rounded-xl animate-in slide-in-from-top-2 fade-in duration-300">
                                        <label className="text-[10px] font-bold text-orange-600 dark:text-orange-400 uppercase tracking-widest mb-2 flex items-center gap-2">
                                            <SafeIcon name="droplet" size={12} />
                                            Required Oil Volume (Litres)
                                        </label>
                                        <input 
                                            type="number" step="0.1" value={oilLiters} onChange={e => handleOilVolumeChange(e.target.value)} 
                                            className="w-full bg-white dark:bg-[#0f1522] text-zinc-900 dark:text-white border border-orange-200 dark:border-orange-500/30 p-3 text-[15px] font-black font-mono outline-none focus:border-orange-500 focus:ring-4 focus:ring-orange-500/20 rounded-lg shadow-sm transition-all" 
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
                                        onClick={(e) => e.target.showPicker && e.target.showPicker()}
                                        // FIX: La till 'text-[12px] sm:text-[14px]' och en specifik CSS-regel ([&::-webkit-calendar-picker-indicator]:hidden) för att dölja webbläsarens inbyggda kalenderikon och ge mer plats åt datumet.
                                        className={`${inputClasses} cursor-pointer uppercase tracking-wider text-[12px] sm:text-[14px] [&::-webkit-calendar-picker-indicator]:hidden`} 
                                    />
                                </InputWrapper>
                                <InputWrapper label="Time_Win" icon="clock">
                                    <input 
                                        type="time" 
                                        min="06:00" 
                                        max="21:00" 
                                        value={formData.tid} 
                                        onChange={e => setFormData(p => ({ ...p, tid: e.target.value }))} 
                                        onClick={(e) => e.target.showPicker && e.target.showPicker()}
                                        // FIX: Samma sak här för tidsväljaren.
                                        className={`${inputClasses} cursor-pointer uppercase tracking-wider text-[12px] sm:text-[14px] [&::-webkit-calendar-picker-indicator]:hidden`} 
                                    />
                                </InputWrapper>
                            </div>
                        </FormRow>
                    </div>

                    {/* SEKTION 3: EKONOMI */}
                    <div className="bg-white/80 dark:bg-[#182032]/80 backdrop-blur-xl border border-zinc-200/80 dark:border-white/5 rounded-3xl p-6 lg:p-8 shadow-sm hover:shadow-md transition-shadow">
                        <SectionHeader title="Financial_Data" sub="Pricing and Expenses" icon="credit-card" />

                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                            
                            {/* Final Price Card */}
                            <div className="bg-zinc-50 dark:bg-[#1a2235]/50 p-6 rounded-2xl border border-zinc-200/80 dark:border-white/5 flex flex-col justify-center relative overflow-hidden group">
                                <div className="absolute right-0 top-0 w-32 h-32 bg-orange-500/5 blur-3xl rounded-full pointer-events-none transition-all group-focus-within:bg-orange-500/10"></div>
                                <InputWrapper label="Final_Price" icon="dollar-sign">
                                    <div className="mt-2 flex items-baseline">
                                        <input 
                                            type="number" value={formData.kundpris} onChange={e => setFormData(p => ({ ...p, kundpris: e.target.value }))} 
                                            className="w-full bg-transparent text-zinc-900 dark:text-white text-5xl md:text-6xl font-light tracking-tighter outline-none focus:text-orange-500 transition-colors" 
                                            placeholder="0" 
                                        />
                                        <span className="text-xl font-bold text-zinc-400 dark:text-zinc-500 ml-2">SEK</span>
                                    </div>
                                </InputWrapper>
                            </div>

                            {/* Expenses List */}
                            <div className="space-y-4">
                                <div className="flex items-center justify-between pb-2 border-b border-zinc-100 dark:border-white/5">
                                    <label className="text-[11px] font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-widest flex items-center gap-2">
                                        <SafeIcon name="shopping-cart" size={12} />Resource_Expenses
                                    </label>
                                    <button type="button" onClick={addExpenseRow} className="text-[10px] font-bold text-orange-600 dark:text-orange-400 bg-orange-50 dark:bg-orange-500/10 hover:bg-orange-100 dark:hover:bg-orange-500/20 uppercase px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1">
                                        <SafeIcon name="plus" size={10} /> Add Item
                                    </button>
                                </div>
                                
                                <div className="space-y-3 max-h-[220px] overflow-y-auto pr-2 custom-scrollbar">
                                    {expenses.map((ex, i) => (
                                        <div key={i} className="flex gap-3 items-center group/row">
                                            <input 
                                                placeholder="Artikel/Delnamn" value={ex.desc} onChange={e => { const n = [...expenses]; n[i].desc = e.target.value; setExpenses(n); }} 
                                                className="flex-1 bg-zinc-50 dark:bg-[#1a2235] focus:bg-white dark:focus:bg-[#1f2940] border border-zinc-200/80 dark:border-white/10 p-3 text-[13px] font-medium text-zinc-900 dark:text-white outline-none rounded-xl focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 transition-all shadow-sm" 
                                            />
                                            <div className="relative w-28">
                                                <input 
                                                    placeholder="0" type="number" value={ex.amount} onChange={e => { const n = [...expenses]; n[i].amount = e.target.value; setExpenses(n); }} 
                                                    className="w-full bg-zinc-50 dark:bg-[#1a2235] focus:bg-white dark:focus:bg-[#1f2940] border border-zinc-200/80 dark:border-white/10 p-3 pr-8 text-[13px] font-mono font-bold text-zinc-900 dark:text-white outline-none text-right rounded-xl focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 transition-all shadow-sm" 
                                                />
                                                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] text-zinc-400 font-bold">kr</span>
                                            </div>
                                            <button type="button" onClick={() => removeExpenseRow(i)} className="text-zinc-300 dark:text-zinc-600 hover:text-red-500 dark:hover:text-red-400 transition-colors p-2 bg-zinc-50 hover:bg-red-50 dark:bg-[#1a2235] dark:hover:bg-red-500/10 rounded-xl">
                                                <SafeIcon name="trash-2" size={16} />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* SEKTION 4: LOGGAR */}
                    <div className="bg-white/80 dark:bg-[#182032]/80 backdrop-blur-xl border border-zinc-200/80 dark:border-white/5 rounded-3xl p-6 lg:p-8 shadow-sm hover:shadow-md transition-shadow">
                        <SectionHeader title="System_Logs" sub="Internal Terminal Notes" icon="terminal" />
                        <InputWrapper label="Internal_Mission_Logs" icon="file-text">
                            <div className="relative">
                                <div className="absolute top-4 left-4 text-zinc-400 font-mono text-[12px] pointer-events-none">&gt;_</div>
                                <textarea 
                                    value={formData.kommentar} 
                                    onChange={e => setFormData(p => ({ ...p, kommentar: e.target.value }))} 
                                    className="w-full bg-zinc-50 dark:bg-[#1a2235] focus:bg-white dark:focus:bg-[#1f2940] border border-zinc-200/80 dark:border-white/10 p-4 pl-10 font-mono text-[13px] leading-relaxed text-zinc-700 dark:text-zinc-300 min-h-[120px] outline-none focus:border-orange-500 focus:ring-4 focus:ring-orange-500/10 transition-all resize-y rounded-2xl shadow-sm" 
                                    placeholder="Skriv dina anteckningar här..." 
                                />
                            </div>
                        </InputWrapper>
                    </div>

                    {/* KNAPPAR */}
                    <div className="pt-2 pb-0 md:pb-0 flex flex-col sm:flex-row gap-3 items-center justify-end md:sticky md:bottom-6 md:z-50">
                        
                        <button 
                            type="button" 
                            onClick={() => window.history.back()} 
                            className="w-full sm:w-auto order-3 sm:order-1 px-8 py-4 bg-white/90 dark:bg-[#1a2235]/90 backdrop-blur-md border border-zinc-200 dark:border-white/10 text-zinc-600 dark:text-zinc-300 font-bold text-[13px] uppercase tracking-widest hover:bg-zinc-100 dark:hover:bg-[#25324d] hover:text-red-500 dark:hover:text-red-400 transition-all active:scale-95 text-center shadow-lg rounded-2xl"
                        >
                            Cancel
                        </button>

                        {editingJob && editingJob.status !== 'KLAR' && (
                            <button 
                                type="button" 
                                onClick={async () => {
                                    await window.db.collection("jobs").doc(editingJob.id).update({ status: 'KLAR' });
                                    setView('DASHBOARD');
                                }} 
                                className="w-full sm:order-2 sm:w-auto px-8 py-4 bg-emerald-500/90 backdrop-blur-md border border-emerald-400/50 text-white font-bold text-[13px] uppercase tracking-widest hover:bg-emerald-500 transition-all shadow-[0_8px_20px_-6px_rgba(16,185,129,0.4)] active:scale-95 text-center rounded-2xl flex items-center justify-center gap-2"
                            >
                                <SafeIcon name="check-circle" size={16} /> Markera Klar
                            </button>
                        )}

                        <button 
                            type="submit" 
                            className="w-full order-1 sm:order-3 sm:w-auto px-10 py-4 bg-gradient-to-r from-orange-500 to-orange-600 text-white font-bold text-[13px] uppercase tracking-widest shadow-[0_8px_20px_-6px_rgba(249,115,22,0.4)] hover:shadow-[0_8px_25px_-4px_rgba(249,115,22,0.5)] hover:from-orange-400 hover:to-orange-500 border border-orange-400/50 active:scale-95 transition-all text-center rounded-2xl flex items-center justify-center gap-2"
                        >
                            <SafeIcon name="save" size={16} /> Confirm_Push
                        </button>

                    </div>

                </form>
            </div>
        </div>
    );
};
