// newJob.js

const SafeIcon = ({ name, size = 14, className = "" }) => (
    <span className="inline-flex items-center justify-center shrink-0">
        <window.Icon name={name} size={size} className={className} />
    </span>
);

const FormRow = ({ children }) => <div className="grid grid-cols-1 md:grid-cols-2 gap-3 lg:gap-4 mb-3 lg:mb-4">{children}</div>;

const InputWrapper = ({ label, icon, children }) => (
    <div className="space-y-1.5 group">
        <label className="text-[10px] font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-widest flex items-center gap-2 ml-1 group-focus-within:text-orange-500 transition-colors">
            <SafeIcon name={icon} size={12} className="text-zinc-400 dark:text-zinc-500 group-focus-within:text-orange-500 transition-colors" />
            {label}
        </label>
        {children}
    </div>
);

const SectionHeader = ({ title, sub, icon }) => (
    <div className="flex items-start gap-2.5 mb-4 lg:mb-5 pb-2.5 lg:pb-3 border-b border-zinc-200/50 dark:border-white/5">
        <div className="mt-1 h-4 w-1 bg-gradient-to-b from-orange-400 to-orange-600 rounded-full shadow-[0_0_10px_rgba(249,115,22,0.4)]" />
        <div>
            <div className="flex items-center gap-1.5">
                <SafeIcon name={icon} size={14} className="text-zinc-400 dark:text-zinc-500" />
                <h3 className="text-[12px] font-bold uppercase tracking-widest text-zinc-900 dark:text-white">{title}</h3>
            </div>
            {sub && <p className="text-[9px] font-medium uppercase tracking-[0.15em] text-zinc-400 dark:text-zinc-500 mt-0.5">{sub}</p>}
        </div>
    </div>
);

const RichNoteEditor = ({ value, onChange }) => {
    const editorRef = React.useRef(null);
    
    // NYTT: Lokalt state som döljer/visar placeholdern omedelbart
    const [hasContent, setHasContent] = React.useState(!!value && value !== '<br>');

    // NYTT: Ser till att placeholdern uppdateras om värdet ändras utifrån (t.ex. vid redigering)
    React.useEffect(() => {
        const isEmpty = !value || value === '<br>' || value === '<div><br></div>';
        setHasContent(!isEmpty);
    }, [value]);

    // NYTT: Lyssna på varje knapptryck för att dölja placeholdern direkt
    const handleInput = (e) => {
        const text = e.currentTarget.textContent.trim();
        const html = e.currentTarget.innerHTML.trim();
        const isEmpty = text.length === 0 && (html === '' || html === '<br>' || html === '<br/>');
        setHasContent(!isEmpty);
    };

    const format = (command, val = null) => {
        document.execCommand(command, false, val);
        if (editorRef.current) {
            editorRef.current.focus();
            onChange(editorRef.current.innerHTML);
        }
    };

    const insertLink = () => {
        const selection = window.getSelection();
        const selectedText = selection.toString();

        const url = prompt('Klistra in webbadressen (t.ex. https://...):');
        if (!url) return;
        
        const text = selectedText || prompt('Vad ska länken heta?', url) || url;
        
        const linkHTML = `<a href="${url}" target="_blank" style="color: #3b82f6; text-decoration: underline; font-weight: bold; cursor: pointer;">${text}</a>`;
        format('insertHTML', linkHTML);
    };

    const insertTimestamp = () => {
        const time = new Date().toLocaleString('sv-SE', { hour: '2-digit', minute:'2-digit', day:'2-digit', month:'short' });
        format('insertHTML', `<strong style="color: #f97316;">[${time}]</strong>&nbsp;`);
    };

    const insertTemplate = () => {
        const template = `<br/><strong>• Kundens felbeskrivning:</strong> <br/><strong>• Verkstadens diagnos:</strong> <br/><strong>• Åtgärd/Reservdelar:</strong> <br/>`;
        format('insertHTML', template);
    };

    const handleEditorClick = (e) => {
        const link = e.target.closest('a');
        if (link) {
            window.open(link.href, '_blank');
        }
    };

    const keepFocus = (e) => {
        e.preventDefault(); 
    };

    return (
        <div className="w-full bg-zinc-50 dark:bg-[#1a2235] focus-within:bg-white dark:focus-within:bg-[#1f2940] border border-zinc-200/80 dark:border-white/10 rounded-xl shadow-sm transition-all overflow-hidden flex flex-col focus-within:border-orange-500 focus-within:ring-2 focus-within:ring-orange-500/10">
            
            <div className="flex flex-wrap items-center gap-1.5 p-2 border-b border-zinc-200/80 dark:border-white/10 bg-zinc-100/50 dark:bg-[#182032]/50">
                <button type="button" onMouseDown={keepFocus} onClick={() => format('bold')} className="p-1.5 text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white hover:bg-zinc-200 dark:hover:bg-white/10 rounded transition-colors" title="Fetstil">
                    <SafeIcon name="bold" size={14} />
                </button>
                <button type="button" onMouseDown={keepFocus} onClick={() => format('italic')} className="p-1.5 text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white hover:bg-zinc-200 dark:hover:bg-white/10 rounded transition-colors" title="Kursiv">
                    <SafeIcon name="italic" size={14} />
                </button>
                <button type="button" onMouseDown={keepFocus} onClick={() => format('insertUnorderedList')} className="p-1.5 text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white hover:bg-zinc-200 dark:hover:bg-white/10 rounded transition-colors" title="Punktlista">
                    <SafeIcon name="list" size={14} />
                </button>
                
                <div className="w-px h-4 bg-zinc-300 dark:bg-white/10 mx-1"></div>
                
                <button type="button" onMouseDown={keepFocus} onClick={insertLink} className="p-1.5 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-500/10 rounded transition-colors flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider" title="Markera text och klicka för att infoga länk">
                    <SafeIcon name="link" size={12} /> Länk
                </button>
                
                <div className="hidden sm:block w-px h-4 bg-zinc-300 dark:bg-white/10 mx-1"></div>
                
                <button type="button" onMouseDown={keepFocus} onClick={insertTimestamp} className="p-1.5 text-orange-600 dark:text-orange-400 hover:bg-orange-50 dark:hover:bg-orange-500/10 rounded transition-colors flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider">
                    <SafeIcon name="clock" size={12} /> Logg
                </button>
                <button type="button" onMouseDown={keepFocus} onClick={insertTemplate} className="p-1.5 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-500/10 rounded transition-colors flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider">
                    <SafeIcon name="file-text" size={12} /> <span className="hidden sm:inline">Felsöknings</span>Mall
                </button>
            </div>

            <div className="relative">
                {/* ÄNDRAT: Kollar nu mot hasContent istället för !value */}
                {!hasContent && (
                    <div className="absolute top-3 left-3 text-zinc-400/70 font-mono text-[12px] pointer-events-none">
                        Skriv dina anteckningar här...
                    </div>
                )}
                <div
                    ref={editorRef}
                    contentEditable
                    onClick={handleEditorClick}
                    onInput={handleInput} /* NYTT: triggar state omedelbart vid skrift */
                    onBlur={(e) => onChange(e.currentTarget.innerHTML)} 
                    dangerouslySetInnerHTML={{ __html: value }}
                    className="p-3 min-h-[100px] text-[13px] leading-relaxed text-zinc-900 dark:text-white outline-none cursor-text [&_ul]:list-disc [&_ul]:pl-6 [&_ul]:my-1 [&_li]:mb-1 [&_li]:marker:text-orange-500"
                    style={{ whiteSpace: 'pre-wrap' }}
                />
            </div>
        </div>
    );
};

window.NewJobView = ({ editingJob, setView, allJobs = [] }) => {
    const today = new Date().toISOString().split('T')[0];
    const [formData, setFormData] = React.useState({
        kundnamn: '', regnr: '', paket: 'Standard', status: 'BOKAD',
        datum: today, tid: '16:30', kundpris: '100', kommentar: '', betaltBelopp: ''
    });
    
    const emptyExpenses = [{ desc: '', amount: '' }, { desc: '', amount: '' }, { desc: '', amount: '' }];
    const [expenses, setExpenses] = React.useState(emptyExpenses);
    
    const [suggestions, setSuggestions] = React.useState([]);
    const [regnrSuggestions, setRegnrSuggestions] = React.useState([]);
    const [oilLiters, setOilLiters] = React.useState(4.3);
    
    const [fetchedCarInfo, setFetchedCarInfo] = React.useState(null);

    React.useEffect(() => {
        const cleanReg = formData.regnr?.toUpperCase().trim();
        if (!cleanReg || cleanReg.length < 5 || !window.db) return;

        const unsubscribe = window.db.collection('vehicleSpecs').doc(cleanReg).onSnapshot(doc => {
            if (doc.exists) {
                const specs = doc.data();
                setFetchedCarInfo(prev => ({
                    regnr: cleanReg,
                    bilmodell: specs.model || prev?.bilmodell || "",
                    motorkod: specs.engine || prev?.motorkod || "",
                    miltal: specs.mileage || prev?.miltal || "",
                    oljevolym: specs.oil ? specs.oil.replace(' l', '') : (prev?.oljevolym || ""),
                    årsmodell: specs.year || prev?.årsmodell || "",
                    vin: specs.vin || prev?.vin || "",
                    isNewData: false
                }));

                if (specs.oil) {
                    let oljaNum = parseFloat(specs.oil.toString().replace(',', '.').replace(/[^0-9.]/g, ''));
                    if (!isNaN(oljaNum) && oljaNum > 0) {
                        setOilLiters(oljaNum);
                    }
                }
            }
        });
        return () => unsubscribe();
    }, [formData.regnr]);

    React.useEffect(() => {
        const loadExistingJob = async () => {
            if (editingJob) {
                setFormData(prev => ({ 
                    ...prev,
                    ...editingJob, 
                    betaltBelopp: editingJob.betaltBelopp || '',
                    datum: editingJob.datum ? editingJob.datum.split('T')[0] : '',
                    tid: editingJob.datum && editingJob.datum.includes('T') ? editingJob.datum.split('T')[1] : '16:30' 
                }));
                
                if (editingJob.utgifter && editingJob.utgifter.length > 0) {
                    let loadedExpenses = editingJob.utgifter.map(ex => ({ desc: ex.namn, amount: ex.kostnad }));
                    while (loadedExpenses.length < 3) loadedExpenses.push({ desc: '', amount: '' });
                    setExpenses(loadedExpenses);
                } else {
                    setExpenses(emptyExpenses);
                }
                
                setOilLiters(editingJob.oljevolym || 4.3);
                
                let specs = {};
                if (window.db && editingJob.regnr) {
                    const doc = await window.db.collection('vehicleSpecs').doc(editingJob.regnr).get();
                    if (doc.exists) specs = doc.data();
                }

                if (editingJob.bilmodell || editingJob.motorkod || editingJob.miltal || Object.keys(specs).length > 0) {
                    setFetchedCarInfo({
                        bilmodell: specs.model || editingJob.bilmodell || "",
                        motorkod: specs.engine || editingJob.motorkod || "",
                        miltal: editingJob.miltal || specs.mileage || "",
                        oljevolym: editingJob.oljevolym ? `${editingJob.oljevolym} l` : (specs.oil || ""),
                        årsmodell: specs.year || editingJob.årsmodell || "",
                        vin: specs.vin || "",
                        isNewData: false
                    });
                }
            } else {
                const prefill = window.prefillName || ''; 
                window.prefillName = null;

                setFormData({
                    kundnamn: prefill, regnr: '', paket: 'Standard', status: 'BOKAD',
                    datum: today, tid: '16:30', kundpris: '100', kommentar: ''
                });
                setExpenses(emptyExpenses);
                setOilLiters(4.3);
                setSuggestions([]);
                setRegnrSuggestions([]);
                setFetchedCarInfo(null);
            }
        };
        loadExistingJob();
    }, [editingJob, today]);

    const updateOilLogic = React.useCallback((liters) => {
        const l = parseFloat(liters) || 0;
        const purchasePrice = l * 65;
        const customerPrice = (l * 200) + 200 + 500;

        setExpenses(prev => {
            const newExpenses = [
                { desc: `Motorolja (${l}l á 65kr)`, amount: purchasePrice.toString() },
                { desc: 'Oljefilter', amount: '200' },
                ...prev.slice(2).filter(e => e.desc || e.amount)
            ];
            while (newExpenses.length < 3) newExpenses.push({ desc: '', amount: '' });
            return newExpenses;
        });

        setFormData(p => ({ ...p, kundpris: customerPrice.toString() }));
    }, []);

    const handleOilVolumeChange = (val) => {
        setOilLiters(val);
        updateOilLogic(val);
    };

    const handlePackageChange = (val) => {
        let price = "100";
        let newExpenses = [...emptyExpenses];

        if (val === "Hjulskifte") price = "200";
        if (val === "Felsökning") price = "500";
        if (val === "Oljebyte") {
            const l = oilLiters;
            price = (l * 200 + 700).toString();
            newExpenses = [
                { desc: `Motorolja (${l}l á 65kr)`, amount: (l * 65).toString() },
                { desc: 'Oljefilter', amount: '200' },
                { desc: '', amount: '' }
            ];
        }
        setFormData(p => ({ ...p, paket: val, kundpris: price }));
        setExpenses(newExpenses);
    };

    const handleExpenseAmountChange = (index, newAmount) => {
        const oldAmountNum = parseFloat(expenses[index].amount) || 0;
        const newAmountNum = parseFloat(newAmount) || 0;
        const diff = newAmountNum - oldAmountNum;

        const n = [...expenses];
        n[index].amount = newAmount;
        setExpenses(n);

        setFormData(p => ({
            ...p,
            kundpris: Math.max(0, (parseFloat(p.kundpris) || 0) + diff).toString()
        }));
    };

    const addExpenseRow = () => setExpenses([...expenses, { desc: '', amount: '' }]);
    
    const removeExpenseRow = (index) => {
        const amountToRemove = parseFloat(expenses[index].amount) || 0;
        const n = expenses.filter((_, i) => i !== index);
        while (n.length < 3) n.push({ desc: '', amount: '' });
        setExpenses(n);

        setFormData(p => ({
            ...p,
            kundpris: Math.max(0, (parseFloat(p.kundpris) || 0) - amountToRemove).toString()
        }));
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

    const handleRegnrChange = async (val) => {
        const upperVal = val ? val.toUpperCase() : '';
        setFormData(p => ({ ...p, regnr: upperVal }));
        
        if (upperVal.length > 0) {
            const matches = allJobs.filter(j => j.regnr?.toUpperCase().includes(upperVal)).map(j => j.regnr.toUpperCase());
            setRegnrSuggestions([...new Set(matches)].slice(0, 5));
        } else {
            if (relatedVehicles.length > 0) setRegnrSuggestions(relatedVehicles);
            else setRegnrSuggestions([]);
        }

        if (upperVal.length >= 5) {
            const previousJobs = allJobs.filter(j => j.regnr === upperVal).sort((a,b) => (b.datum||'').localeCompare(a.datum||''));
            const lastJob = previousJobs.length > 0 ? previousJobs[0] : null;
            
            let specs = {};
            if (window.db) {
                const specDoc = await window.db.collection('vehicleSpecs').doc(upperVal).get();
                if (specDoc.exists) specs = specDoc.data();
            }

            if (lastJob || Object.keys(specs).length > 0) {
                setFetchedCarInfo({
                    regnr: upperVal,
                    bilmodell: specs.model || lastJob?.bilmodell || "",
                    motorkod: specs.engine || lastJob?.motorkod || "",
                    miltal: specs.mileage || lastJob?.miltal || "",
                    oljevolym: specs.oil ? specs.oil.replace(' l', '') : (lastJob?.oljevolym || ""),
                    årsmodell: specs.year || lastJob?.årsmodell || "",
                    vin: specs.vin || "",
                    isNewData: false
                });

                let rawOil = specs.oil || lastJob?.oljevolym;
                if (rawOil) {
                    let oljaNum = parseFloat(rawOil.toString().replace(',', '.').replace(/[^0-9.]/g, ''));
                    if (!isNaN(oljaNum) && oljaNum > 0) {
                        setOilLiters(oljaNum);
                    }
                }
            }
        } else {
            setFetchedCarInfo(null);
        }
    };

    const handleSpecChange = (key, value) => {
        setFetchedCarInfo(prev => ({ ...prev, [key]: value }));
    };

    const saveSpec = async (key, value) => {
        const finalRegnr = formData.regnr?.toUpperCase().trim();
        if (!finalRegnr || !window.db) return;

        const specUpdates = { updatedAt: new Date().toISOString() };
        if (key === 'årsmodell') specUpdates.year = value;
        if (key === 'motorkod') specUpdates.engine = value;
        if (key === 'oljevolym') specUpdates.oil = value;
        if (key === 'miltal') specUpdates.mileage = value;
        if (key === 'vin') specUpdates.vin = value;

        try {
            await window.db.collection("vehicleSpecs").doc(finalRegnr).set(specUpdates, { merge: true });
        } catch(e) {
            console.error("Kunde inte spara specifikationen:", e);
        }
    };

    const handleSave = async (e) => {
        e.preventDefault();
        try {
            const finalRegnr = formData.regnr.toUpperCase().trim();
            
            const data = { 
                ...formData,
                betaltBelopp: parseInt(formData.betaltBelopp) || 0, 
                regnr: finalRegnr, 
                datum: formData.datum ? `${formData.datum}T${formData.tid}` : '', 
                oljevolym: oilLiters,
                bilmodell: fetchedCarInfo?.bilmodell || formData.bilmodell || '',
                motorkod: fetchedCarInfo?.motorkod || formData.motorkod || '',
                miltal: fetchedCarInfo?.miltal || formData.miltal || '',
                utgifter: expenses.filter(ex => ex.desc && ex.amount).map(ex => ({ namn: ex.desc, kostnad: ex.amount })),
                deleted: false 
            };
            
            if (editingJob && editingJob.id) {
                await window.db.collection("jobs").doc(editingJob.id).set(data, { merge: true });
            } else {
                await window.db.collection("jobs").add(data);
            }

            if (finalRegnr && fetchedCarInfo) {
                const specUpdates = {};
                if (fetchedCarInfo.motorkod) specUpdates.engine = fetchedCarInfo.motorkod;
                if (fetchedCarInfo.oljevolym) specUpdates.oil = fetchedCarInfo.oljevolym.includes('l') ? fetchedCarInfo.oljevolym : `${fetchedCarInfo.oljevolym.replace(/[^0-9.,]/g, '')} l`;
                if (fetchedCarInfo.årsmodell) specUpdates.year = fetchedCarInfo.årsmodell;
                if (fetchedCarInfo.vin) specUpdates.vin = fetchedCarInfo.vin;
                
                if (Object.keys(specUpdates).length > 0) {
                    specUpdates.updatedAt = new Date().toISOString();
                    await window.db.collection("vehicleSpecs").doc(finalRegnr).set(specUpdates, { merge: true });
                }
            }

            setView('DASHBOARD', null);
        } catch (error) {
            console.error("Kunde inte spara jobbet:", error);
            alert("Ett fel uppstod när jobbet skulle sparas.");
        }
    };

    const partsTotal = expenses.reduce((sum, item) => sum + (parseFloat(item.amount) || 0), 0);
    const finalPriceNum = parseFloat(formData.kundpris) || 0;
    const laborTotal = Math.max(0, finalPriceNum - partsTotal);

    // Hitta historik automatiskt baserat på Reg.nr eller Kundnamn
    const historyJobs = React.useMemo(() => {
        let matches = [];
        if (formData.regnr && formData.regnr.length >= 5) {
            matches = allJobs.filter(j => j.regnr === formData.regnr && j.id !== (editingJob ? editingJob.id : null));
        } else if (formData.kundnamn && formData.kundnamn.length > 2) {
            matches = allJobs.filter(j => j.kundnamn.toLowerCase() === formData.kundnamn.toLowerCase() && j.id !== (editingJob ? editingJob.id : null));
        }
        return matches.sort((a,b) => (b.datum||'').localeCompare(a.datum||''));
    }, [formData.regnr, formData.kundnamn, allJobs, editingJob]);

    const inputClasses = "w-full bg-zinc-50/50 dark:bg-[#1a2235] focus:bg-white dark:focus:bg-[#1f2940] border border-zinc-200/80 dark:border-white/10 p-2.5 text-[13px] font-medium text-zinc-900 dark:text-white outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 transition-all rounded-lg lg:rounded-xl shadow-sm";
    const sectionCardClasses = "bg-white/80 dark:bg-[#182032]/80 backdrop-blur-xl border border-zinc-200/80 dark:border-white/5 rounded-2xl lg:rounded-3xl p-4 lg:p-5 shadow-sm hover:shadow-md transition-shadow";

    return (
        <div className="relative max-w-4xl ml-0 animate-in fade-in slide-in-from-left-4 duration-700 w-full">
            
            <div className="absolute top-0 left-[-10%] w-[80%] h-[400px] bg-orange-500/10 dark:bg-orange-500/5 blur-[120px] rounded-full pointer-events-none -z-10"></div>

            {/* HEADER */}
            <div className="flex flex-col md:flex-row md:items-center justify-between mb-4 pb-3 md:pb-4 border-b border-zinc-200 dark:border-white/5 gap-3 md:gap-4 pt-2 lg:pt-0 px-4 lg:px-0">
                <div className="flex items-center gap-3 md:gap-4">
                    <div className="relative group cursor-default shrink-0">
                        <div className="absolute inset-0 bg-orange-500/40 blur-lg rounded-full transition-all duration-700 group-hover:bg-orange-500/60" />
                        <div className="relative w-10 h-10 md:w-12 md:h-12 rounded-xl flex items-center justify-center text-white shadow-md border border-white/20 transition-colors bg-gradient-to-br from-orange-400 to-orange-600">
                            <SafeIcon name={editingJob ? "edit-3" : "plus"} size={20} className="md:w-6 md:h-6" />
                        </div>
                    </div>
                    <div className="flex flex-col">
                        <h1 className="text-xl md:text-2xl font-black text-zinc-900 dark:text-white uppercase tracking-tight leading-none">
                            {editingJob ? 'UPPDATERA' : 'NYTT'} <span className="text-zinc-400 dark:text-zinc-500 font-light">UPPDRAG</span>
                        </h1>
                        <p className="text-[9px] md:text-[10px] font-bold text-orange-500 dark:text-orange-400 uppercase tracking-widest mt-1 flex items-center gap-1.5">
                            <span className="w-1.5 h-1.5 rounded-full bg-orange-500 animate-pulse"></span>
                            {editingJob ? 'Redigera arbetsorder' : 'Skapa arbetsorder'}
                        </p>
                    </div>
                </div>
            </div>

            {/* FORMULÄR */}
            <div className="px-4 lg:px-0">
                <form onSubmit={handleSave} className="space-y-4 flex flex-col">
                    
                    {/* SEKTION 1: IDENTIFIERING */}
                    <div className={`relative z-40 ${sectionCardClasses}`}>
                        <SectionHeader title="Kund & Fordon" sub="Information om kund och fordon" icon="fingerprint" />
                        
                        <FormRow>
                            <InputWrapper label="Kundnamn" icon="user">
                                <div className="relative z-20">
                                    <input 
                                        type="text" value={formData.kundnamn} onChange={e => handleNameChange(e.target.value)} 
                                        className={inputClasses} 
                                        placeholder="Sök eller skriv namn..." 
                                    />
                                    {suggestions.length > 0 && (
                                        <div className="absolute z-50 w-full bg-white/95 dark:bg-[#1a2235]/95 backdrop-blur-xl border border-zinc-200 dark:border-white/10 shadow-2xl mt-2 rounded-xl overflow-hidden animate-in fade-in zoom-in-95">
                                            {suggestions.map((s, i) => (
                                                <div key={i} onClick={() => { setFormData(p => ({ ...p, kundnamn: s })); setSuggestions([]); }} className="p-3 text-[12px] text-zinc-900 dark:text-white hover:bg-orange-50 dark:hover:bg-[#25324d] hover:text-orange-600 dark:hover:text-orange-400 cursor-pointer font-bold uppercase border-b border-zinc-100 dark:border-white/5 last:border-0 transition-colors">
                                                    {s}
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </InputWrapper>
                            
                            <InputWrapper label="Reg.nr" icon="truck">
                                <div className="relative z-10 flex gap-2">
                                    <div className="relative flex-1">
                                        <input 
                                            type="text" value={formData.regnr} onChange={e => handleRegnrChange(e.target.value)} onFocus={() => handleRegnrChange(formData.regnr)}
                                            className={`${inputClasses} font-mono uppercase tracking-[0.2em] w-full`} 
                                            placeholder="ABC 123" autoComplete="off" 
                                        />
                                        {regnrSuggestions.length > 0 && (
                                            <div className="absolute z-50 w-full bg-white/95 dark:bg-[#1a2235]/95 backdrop-blur-xl border border-zinc-200 dark:border-white/10 shadow-2xl mt-2 rounded-xl overflow-hidden animate-in fade-in zoom-in-95">
                                                {regnrSuggestions.map((s, i) => (
                                                    <div key={i} onClick={() => { handleRegnrChange(s); setRegnrSuggestions([]); }} className="p-3 text-[12px] text-zinc-900 dark:text-white hover:bg-orange-50 dark:hover:bg-[#25324d] hover:text-orange-600 dark:hover:text-orange-400 cursor-pointer font-bold font-mono tracking-widest border-b border-zinc-100 dark:border-white/5 last:border-0 transition-colors">
                                                        {s}
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                    
                                    <button 
                                        type="button"
                                        onClick={() => {
                                            if(!formData.regnr) { alert("Skriv in ett regnr först!"); return; }
                                            if (window.osSearchVehicle) window.osSearchVehicle(formData.regnr, 'SMART_SEARCH');
                                        }}
                                        className="shrink-0 bg-zinc-100 dark:bg-white/5 border border-zinc-200 dark:border-white/10 hover:bg-orange-50 dark:hover:bg-orange-500/10 hover:text-orange-500 hover:border-orange-200 dark:hover:border-orange-500/30 text-zinc-500 px-3 rounded-lg flex items-center justify-center transition-all"
                                        title="Smart Sökning (Hämtar all tillgänglig fordonsdata)"
                                    >
                                        <window.Icon name="zap" size={16} /> 
                                    </button>
                                </div>
                            </InputWrapper>
                        </FormRow>
                    </div>

                    {fetchedCarInfo && (
                        <div className="bg-zinc-50/80 dark:bg-[#1a2235]/40 border border-zinc-200/80 dark:border-white/5 rounded-2xl lg:rounded-3xl p-4 lg:p-5 shadow-sm animate-in slide-in-from-top-2 fade-in duration-300 relative z-30">
                            
                            {/* Rubrik / Bilmodell */}
                            <div className="mb-4 pb-3 border-b border-zinc-200/80 dark:border-white/5">
                                <div className="text-[9px] font-black text-orange-500 dark:text-orange-400 uppercase tracking-[0.15em] flex items-center gap-1.5 mb-1">
                                    <SafeIcon name="database" size={10} /> Teknisk Fordonsdata
                                </div>
                                {fetchedCarInfo.bilmodell ? (
                                    <div className="text-sm md:text-base font-black text-zinc-900 dark:text-white uppercase tracking-wide">
                                        {fetchedCarInfo.bilmodell}
                                    </div>
                                ) : (
                                    <div className="text-sm md:text-base font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wide italic">
                                        Inget fordonsnamn hittades
                                    </div>
                                )}
                            </div>

                            {/* Data-rutor */}
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5">
                                {[
                                    { id: 'årsmodell', label: 'Årsmodell', val: fetchedCarInfo.årsmodell, ph: '2016', icon: 'calendar', mono: false },
                                    { id: 'motorkod', label: 'Motorkod', val: fetchedCarInfo.motorkod, ph: 'CFGB', icon: 'cpu', mono: true },
                                    { id: 'oljevolym', label: 'Oljevolym', val: fetchedCarInfo.oljevolym, ph: '4.7 l', icon: 'droplet', mono: false },
                                    { id: 'miltal', label: 'Miltal', val: fetchedCarInfo.miltal, ph: '12 500 mil', icon: 'navigation', mono: false }
                                ].map((f, i) => (
                                    <div key={i} className="bg-white/60 dark:bg-[#182032]/60 border border-zinc-200/50 dark:border-white/5 rounded-xl p-2.5 flex flex-col justify-center relative group focus-within:border-orange-500/50 focus-within:bg-white dark:focus-within:bg-[#1f2940] focus-within:shadow-[0_0_10px_rgba(249,115,22,0.1)] transition-all">
                                        <div className="text-[8px] font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-widest mb-1 flex items-center gap-1.5">
                                            <SafeIcon name={f.icon} size={10} className="text-zinc-400 dark:text-zinc-500 group-focus-within:text-orange-500 transition-colors" />
                                            {f.label}
                                        </div>
                                        <input 
                                            type="text" 
                                            className={`w-full text-[12px] bg-transparent outline-none placeholder:text-zinc-300 dark:placeholder:text-zinc-600 truncate text-zinc-900 dark:text-white ${f.mono ? 'font-mono font-bold tracking-wider' : 'font-medium'}`}
                                            placeholder={f.ph}
                                            value={f.val || ''}
                                            onChange={(e) => handleSpecChange(f.id, e.target.value)}
                                            onBlur={(e) => saveSpec(f.id, e.target.value)}
                                        />
                                    </div>
                                ))}

                                {/* Chassinummer (Full bredd) */}
                                <div className="col-span-2 md:col-span-4 bg-white/60 dark:bg-[#182032]/60 border border-zinc-200/50 dark:border-white/5 rounded-xl p-2.5 flex flex-col justify-center group focus-within:border-orange-500/50 focus-within:bg-white dark:focus-within:bg-[#1f2940] focus-within:shadow-[0_0_10px_rgba(249,115,22,0.1)] transition-all">
                                    <div className="text-[8px] font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-widest mb-1 flex items-center gap-1.5">
                                        <SafeIcon name="hash" size={10} className="text-zinc-400 dark:text-zinc-500 group-focus-within:text-orange-500 transition-colors" />
                                        Chassinummer (VIN)
                                    </div>
                                    <input 
                                        type="text" 
                                        className="w-full text-[13px] font-mono font-bold text-zinc-900 dark:text-white bg-transparent outline-none placeholder:text-zinc-300 dark:placeholder:text-zinc-600 tracking-[0.2em] uppercase"
                                        placeholder="WBA00000000000000"
                                        value={fetchedCarInfo.vin || ''}
                                        onChange={(e) => handleSpecChange('vin', e.target.value.toUpperCase())}
                                        onBlur={(e) => saveSpec('vin', e.target.value)}
                                    />
                                </div>
                            </div>
                        </div>
                    )}

                    {/* SEKTION 2: PARAMETRAR */}
                    <div className={`relative z-20 ${sectionCardClasses}`}>
                        <SectionHeader title="Uppdragsdetaljer" sub="Tidsbokning och arbetsomfattning" icon="sliders" />

                        <div className="mb-4">
                            <InputWrapper label="Uppdragsstatus" icon="activity">
                                <div className="flex bg-zinc-100 dark:bg-[#1a2235] p-1 rounded-xl border border-zinc-200/80 dark:border-white/5 w-full overflow-x-auto custom-scrollbar">
                                    {['BOKAD', 'OFFERERAD', 'KLAR', 'FAKTURERAS'].map(s => (
                                        <button
                                            key={s} type="button" onClick={() => setFormData(p => ({ ...p, status: s }))}
                                            className={`flex-1 min-w-[80px] py-2 px-1 text-[9px] lg:text-[10px] font-bold uppercase tracking-widest rounded-lg transition-all duration-300 ${formData.status === s ? 'bg-white dark:bg-[#25324d] shadow-sm text-zinc-900 dark:text-white' : 'text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300 hover:bg-zinc-200/50 dark:hover:bg-white/5'}`}
                                        >
                                            {s}
                                        </button>
                                    ))}
                                </div>
                            </InputWrapper>
                        </div>

                        <FormRow>
                            <div className="space-y-3">
                                <InputWrapper label="Servicepaket" icon="layers">
                                    <div className="flex bg-zinc-100 dark:bg-[#1a2235] p-1 rounded-xl border border-zinc-200/80 dark:border-white/5 w-full overflow-x-auto custom-scrollbar">
                                        {['Standard', 'Oljebyte', 'Hjulskifte', 'Felsökning'].map(pkg => (
                                            <button
                                                key={pkg} 
                                                type="button" 
                                                onClick={() => handlePackageChange(pkg)}
                                                className={`flex-1 min-w-[70px] py-2 px-1 text-[9px] lg:text-[10px] font-bold uppercase tracking-widest rounded-lg transition-all duration-300 ${formData.paket === pkg ? 'bg-white dark:bg-[#25324d] shadow-sm text-zinc-900 dark:text-white' : 'text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300 hover:bg-zinc-200/50 dark:hover:bg-white/5'}`}
                                            >
                                                {pkg}
                                            </button>
                                        ))}
                                    </div>
                                </InputWrapper>
                                
                                {formData.paket === "Oljebyte" && (
                                    <div className="p-3 bg-orange-50/50 dark:bg-orange-500/5 border border-orange-200 dark:border-orange-500/20 rounded-xl animate-in slide-in-from-top-2 fade-in duration-300">
                                        <label className="text-[10px] font-bold text-orange-600 dark:text-orange-400 uppercase tracking-widest mb-1.5 flex items-center justify-between">
                                            <span className="flex items-center gap-1.5"><SafeIcon name="droplet" size={12} /> Nödvändig Oljevolym (Liter)</span>
                                        </label>
                                        <div className="flex gap-2">
                                            <input 
                                                type="number" step="0.1" value={oilLiters} onChange={e => handleOilVolumeChange(e.target.value)} 
                                                className="w-full bg-white dark:bg-[#0f1522] text-zinc-900 dark:text-white border border-orange-200 dark:border-orange-500/30 p-2.5 text-[14px] font-black font-mono outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 rounded-lg shadow-sm transition-all" 
                                            />
                                            <button 
                                                type="button" 
                                                onClick={() => {
                                                    if (!formData.regnr) { alert("Skriv in ett regnr först!"); return; }
                                                    if (window.osSearchVehicle) window.osSearchVehicle(formData.regnr, 'START_OS_RADAR', true);
                                                }}
                                                className="shrink-0 px-5 bg-orange-500 text-white rounded-lg flex items-center justify-center transition-all active:scale-95 shadow-sm group border border-transparent"
                                                title="Hämta Oljevolym"
                                            >
                                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="group-hover:scale-110 transition-transform">
                                                    <path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z"></path>
                                                </svg>
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>
                            
                            <div className="grid grid-cols-2 gap-3">
                                <InputWrapper label="Bokat Datum" icon="calendar">
                                    <div className="flex gap-2">
                                        <input 
                                            type="date" 
                                            value={formData.datum} 
                                            onChange={e => setFormData(p => ({ ...p, datum: e.target.value }))} 
                                            onClick={(e) => e.target.showPicker && e.target.showPicker()}
                                            className={`${inputClasses} cursor-pointer uppercase tracking-wider text-[12px] [&::-webkit-calendar-picker-indicator]:hidden flex-1`} 
                                        />
                                    </div>
                                </InputWrapper>
                                <InputWrapper label="Bokad Tid" icon="clock">
                                    <input 
                                        type="time" 
                                        min="06:00" 
                                        max="21:00" 
                                        value={formData.tid} 
                                        onChange={e => setFormData(p => ({ ...p, tid: e.target.value }))} 
                                        onClick={(e) => e.target.showPicker && e.target.showPicker()}
                                        className={`${inputClasses} cursor-pointer uppercase tracking-wider text-[12px] [&::-webkit-calendar-picker-indicator]:hidden`} 
                                    />
                                </InputWrapper>
                            </div>
                        </FormRow>
                    </div>

                    {/* SEKTION 3: EKONOMI */}
                    <div className={`relative z-30 ${sectionCardClasses}`}>
                        <SectionHeader title="Ekonomi & Pris" sub="Prissättning och reservdelar" icon="credit-card" />

                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 lg:gap-6">
                            
                            {/* VÄNSTER KOLUMN: PRIS & SAMMANFATTNING */}
                            <div className="bg-zinc-50 dark:bg-[#1a2235]/50 rounded-2xl border border-zinc-200/80 dark:border-white/5 flex flex-col relative overflow-hidden group h-full shadow-sm hover:shadow-md transition-shadow">
                                <div className="absolute right-0 top-0 w-32 h-32 bg-orange-500/5 blur-3xl rounded-full pointer-events-none transition-all group-focus-within:bg-orange-500/10"></div>
                                
                                {/* ÖVRE DELEN (Paddad yta) */}
                                <div className="p-4 lg:p-5 flex-1 flex flex-col justify-center relative z-10">
                                    <InputWrapper label="Totalpris (inkl. moms)" icon="dollar-sign">
                                        <div className="mt-1 flex items-baseline relative z-10">
                                            <input 
                                                type="number" value={formData.kundpris} onChange={e => setFormData(p => ({ ...p, kundpris: e.target.value }))} 
                                                className="w-full bg-transparent text-zinc-900 dark:text-white text-4xl md:text-5xl font-light tracking-tighter outline-none focus:text-orange-500 transition-colors" 
                                                placeholder="0" 
                                            />
                                            <span className="text-lg font-bold text-zinc-400 dark:text-zinc-500 ml-2">SEK</span>
                                        </div>
                                    </InputWrapper>

                                    {/* DETALJER (Reservdelar, Arbete, Delbetalt) */}
                                    <div className="mt-5 pt-4 border-t border-zinc-200/80 dark:border-white/10 flex flex-col gap-2">
                                        
                                        {/* 1. RESERVDELAR */}
                                        <div className="flex justify-between items-center group/row">
                                            <div className="flex items-center gap-2.5 text-[10px] font-bold uppercase tracking-widest text-zinc-500 dark:text-zinc-400">
                                                <div className="w-6 h-6 rounded-md bg-zinc-100 dark:bg-[#1f2940] flex items-center justify-center shrink-0">
                                                    <SafeIcon name="box" size={12} className="text-zinc-400 dark:text-zinc-500" />
                                                </div>
                                                Reservdelar
                                            </div>
                                            
                                            {/* Osynlig box för att linjera exakt med input-fälten under */}
                                            <div className="flex items-center justify-end gap-1.5 px-2 py-1.5 w-[100px]">
                                                <span className="text-[13px] font-mono font-bold text-zinc-700 dark:text-zinc-300">{partsTotal.toLocaleString()}</span>
                                                <span className="text-[9px] font-bold uppercase tracking-widest text-zinc-400">kr</span>
                                            </div>
                                        </div>
                                        
                                        {/* 2. ARBETSKOSTNAD */}
                                        <div className="flex justify-between items-center group/row">
                                            <div className="flex items-center gap-2.5 text-[10px] font-bold uppercase tracking-widest text-zinc-500 dark:text-zinc-400">
                                                <div className="w-6 h-6 rounded-md bg-zinc-100 dark:bg-[#1f2940] flex items-center justify-center shrink-0">
                                                    <SafeIcon name="arrow-up" size={12} className="text-zinc-400 dark:text-zinc-500 group-focus-within/row:text-orange-500 transition-colors" />
                                                </div>
                                                Arbetskostnad
                                            </div>
                                            
                                            <div 
                                                className="flex items-center gap-1.5 bg-white dark:bg-[#1f2940] px-2 py-1.5 w-[100px] rounded-md border border-zinc-200 dark:border-white/10 focus-within:border-orange-500 focus-within:ring-2 focus-within:ring-orange-500/10 transition-all cursor-text shadow-sm" 
                                                onClick={(e) => e.currentTarget.querySelector('input').focus()}
                                            >
                                                <input 
                                                    type="number" 
                                                    value={laborTotal === 0 && finalPriceNum === 0 ? '' : laborTotal} 
                                                    onChange={e => {
                                                        const newLabor = parseFloat(e.target.value) || 0;
                                                        setFormData(p => ({ ...p, kundpris: (newLabor + partsTotal).toString() }));
                                                    }}
                                                    className={`w-full bg-transparent outline-none text-right font-mono text-[13px] ${laborTotal > 0 ? 'text-zinc-900 dark:text-white font-black' : 'text-zinc-500 dark:text-zinc-400 font-bold'}`}
                                                    placeholder="0"
                                                />
                                                <span className="text-[9px] font-bold uppercase tracking-widest text-zinc-400">kr</span>
                                            </div>
                                        </div>

                                        {/* Mjuk avskiljare innan betalning */}
                                        <div className="w-full border-t border-dashed border-zinc-200/80 dark:border-white/10 my-1"></div>

                                        {/* 3. FÖRSKOTT / DELBETALT */}
                                        <div className="flex justify-between items-center group/row">
                                            <div className="flex items-center gap-2.5 text-[10px] font-bold uppercase tracking-widest text-emerald-600 dark:text-emerald-500">
                                                <div className="w-6 h-6 rounded-md bg-emerald-50 dark:bg-emerald-500/10 flex items-center justify-center shrink-0">
                                                    <SafeIcon name="arrow-down" size={12} className="text-emerald-500 dark:text-emerald-400 group-focus-within/row:scale-110 transition-transform" />
                                                </div>
                                                Delbetalt
                                            </div>
                                            
                                            <div 
                                                className="flex items-center gap-1 bg-white dark:bg-[#1f2940] px-2 py-1.5 w-[100px] rounded-md border border-emerald-200 dark:border-emerald-500/30 focus-within:border-emerald-500 focus-within:ring-2 focus-within:ring-emerald-500/10 transition-all cursor-text shadow-sm" 
                                                onClick={(e) => e.currentTarget.querySelector('input').focus()}
                                            >
                                                <SafeIcon name="minus" size={10} className="text-emerald-400 shrink-0" />
                                                <input 
                                                    type="number" 
                                                    value={formData.betaltBelopp || ''} 
                                                    onChange={e => setFormData(p => ({ ...p, betaltBelopp: e.target.value }))}
                                                    className="w-full bg-transparent outline-none text-right font-mono text-[13px] text-emerald-600 dark:text-emerald-400 font-black placeholder:text-emerald-300 dark:placeholder:text-emerald-700"
                                                    placeholder="0"
                                                />
                                                <span className="text-[9px] font-bold uppercase tracking-widest text-emerald-500/70">kr</span>
                                            </div>
                                        </div>

                                    </div>
                                </div>

                                {/* NEDRE DELEN: KVAR ATT BETALA (Fyller hela bredden i botten) */}
                                {parseFloat(formData.betaltBelopp) > 0 && (
                                    <div className="bg-orange-50/80 dark:bg-orange-500/10 border-t border-orange-200/60 dark:border-orange-500/20 p-4 lg:px-5 flex justify-between items-center animate-in slide-in-from-bottom-4 fade-in duration-300">
                                        <span className="text-[11px] text-orange-800 dark:text-orange-300 uppercase tracking-widest font-black flex items-center gap-1.5">
                                            <SafeIcon name="pie-chart" size={12} className="text-orange-500" /> Kvar att fakturera
                                        </span>
                                        <div className="flex items-baseline gap-1 text-orange-600 dark:text-orange-400">
                                            <span className="text-[22px] font-black tracking-tight leading-none">
                                                {Math.max(0, (parseFloat(formData.kundpris) || 0) - parseFloat(formData.betaltBelopp)).toLocaleString('sv-SE')}
                                            </span>
                                            <span className="text-[10px] font-bold uppercase tracking-widest ml-0.5">kr</span>
                                        </div>
                                    </div>
                                )}
                            </div>

                            <div className="space-y-3">
                                <div className="flex items-center justify-between pb-1.5 border-b border-zinc-100 dark:border-white/5">
                                    <label className="text-[10px] font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-widest flex items-center gap-1.5">
                                        <SafeIcon name="shopping-cart" size={10} />Reservdelar & Material
                                    </label>
                                    <div className="flex gap-2">
                                        <button type="button" onClick={addExpenseRow} className="text-[9px] font-bold text-orange-600 dark:text-orange-400 bg-orange-50 dark:bg-orange-500/10 hover:bg-orange-100 dark:hover:bg-orange-500/20 uppercase px-2.5 py-1.5 rounded-md transition-colors flex items-center gap-1 shadow-sm">
                                            <SafeIcon name="plus" size={10} /> Lägg till
                                        </button>
                                    </div>
                                </div>
                                
                                <div className="space-y-2 max-h-[180px] overflow-y-auto pr-1 custom-scrollbar">
                                    {expenses.map((ex, i) => (
                                        <div key={i} className="flex gap-2 items-center group/row">
                                            {/* Artikelnamn med inbyggd ikon */}
                                            <div className="flex-1 relative flex items-center">
                                                <div className="absolute left-3 text-zinc-400 dark:text-zinc-500 pointer-events-none group-focus-within/row:text-orange-500 transition-colors">
                                                    <SafeIcon name="tag" size={12} />
                                                </div>
                                                <input 
                                                    placeholder="Artikel / Tjänst" 
                                                    value={ex.desc} 
                                                    onChange={e => { const n = [...expenses]; n[i].desc = e.target.value; setExpenses(n); }} 
                                                    className="w-full bg-zinc-50 dark:bg-[#1a2235] focus:bg-white dark:focus:bg-[#1f2940] border border-zinc-200/80 dark:border-white/10 py-2.5 pl-8 pr-3 text-[12px] font-medium text-zinc-900 dark:text-white outline-none rounded-xl focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 transition-all shadow-sm" 
                                                />
                                            </div>

                                            {/* Pris med inbyggt "kr" i fältet */}
                                            <div className="relative w-28 shrink-0 flex items-center">
                                                <input 
                                                    placeholder="0" 
                                                    type="number" 
                                                    onFocus={(e) => e.target.select()}
                                                    value={ex.amount} 
                                                    onChange={e => handleExpenseAmountChange(i, e.target.value)} 
                                                    className="w-full bg-zinc-50 dark:bg-[#1a2235] focus:bg-white dark:focus:bg-[#1f2940] border border-zinc-200/80 dark:border-white/10 py-2.5 pl-3 pr-7 text-[12px] font-mono font-bold text-zinc-900 dark:text-white outline-none text-right rounded-xl focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 transition-all shadow-sm" 
                                                />
                                                <span className="absolute right-3 text-[9px] text-zinc-400 font-bold uppercase tracking-widest pointer-events-none">kr</span>
                                            </div>

                                            {/* Snyggare papperskorg */}
                                            <button 
                                                type="button" 
                                                onClick={() => removeExpenseRow(i)} 
                                                className="text-zinc-300 dark:text-zinc-600 hover:text-red-500 dark:hover:text-red-400 transition-all p-2.5 bg-zinc-50 hover:bg-red-50 dark:bg-[#1a2235] dark:hover:bg-red-500/10 rounded-xl shrink-0 active:scale-95"
                                                title="Ta bort rad"
                                            >
                                                <SafeIcon name="trash-2" size={14} />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* SEKTION 4: LOGGAR */}
                    <div className={`relative z-10 ${sectionCardClasses}`}>
                        <SectionHeader title="Arbetsanteckningar" sub="Mekanikerns anteckningar och felkoder" icon="terminal" />
                        <InputWrapper label="Egna Noteringar" icon="file-text">
                            <RichNoteEditor 
                                value={formData.kommentar} 
                                onChange={(newHTML) => setFormData(p => ({ ...p, kommentar: newHTML }))} 
                            />
                        </InputWrapper>
                    </div>

                    {/* KNAPPAR */}
                    <div className="pt-2 flex flex-col sm:flex-row gap-2.5 items-center justify-end">
                        <button 
                            type="button" 
                            onClick={() => window.history.back()} 
                            className="w-full sm:w-auto order-3 sm:order-1 px-6 py-2.5 bg-zinc-100 dark:bg-[#1a2235] border border-transparent text-zinc-600 dark:text-zinc-300 font-bold text-[11px] lg:text-[12px] uppercase tracking-widest hover:bg-zinc-200 dark:hover:bg-[#25324d] transition-all active:scale-95 text-center rounded-lg"
                        >
                            Avbryt
                        </button>

                        {editingJob && editingJob.status !== 'KLAR' && (
                            <button 
                                type="button" 
                                onClick={async () => {
                                    await window.db.collection("jobs").doc(editingJob.id).update({ status: 'KLAR' });
                                    setView('DASHBOARD');
                                }} 
                                className="w-full sm:order-2 sm:w-auto px-6 py-2.5 bg-white dark:bg-[#182032] border border-zinc-200 dark:border-white/10 text-zinc-500 dark:text-zinc-400 font-bold text-[11px] lg:text-[12px] uppercase tracking-widest hover:border-emerald-500/50 hover:text-emerald-600 dark:hover:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-500/10 transition-all active:scale-95 text-center rounded-lg flex items-center justify-center gap-1.5 shadow-sm"
                            >
                                <SafeIcon name="check" size={14} /> Snabbval: Klar
                            </button>
                        )}

                        <button 
                            type="submit" 
                            className="w-full order-1 sm:order-3 sm:w-auto px-8 py-2.5 bg-gradient-to-r from-orange-500 to-orange-600 text-white font-bold text-[11px] lg:text-[12px] uppercase tracking-widest shadow-[0_8px_20px_-6px_rgba(249,115,22,0.4)] hover:shadow-[0_8px_25px_-4px_rgba(249,115,22,0.5)] border border-orange-400/50 active:scale-95 transition-all text-center rounded-lg flex items-center justify-center gap-1.5"
                        >
                            <SafeIcon name="save" size={14} /> Spara Jobb
                        </button>
                    </div>

                </form>
            </div>
        </div>
    );
};
