// newJob.js

const SafeIcon = ({ name, size = 14, className = "" }) => (
    <span className="inline-flex items-center justify-center shrink-0">
        <window.Icon name={name} size={size} className={className} />
    </span>
);

const FormRow = ({ children }) => <div className="grid grid-cols-1 md:grid-cols-2 gap-3 lg:gap-4 mb-3 lg:mb-4">{children}</div>;

const InputWrapper = ({ label, icon, children }) => (
    <div className="space-y-1.5 group">
        <label className="text-[10px] font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-widest flex items-center gap-2 ml-1 group-focus-within:text-[#168a9c] transition-colors">
            <SafeIcon name={icon} size={12} className="text-zinc-400 dark:text-zinc-500 group-focus-within:text-[#168a9c] transition-colors" />
            {label}
        </label>
        {children}
    </div>
);

const SectionHeader = ({ title, sub, icon }) => (
    <div className="flex items-start gap-2.5 mb-4 lg:mb-5 pb-2.5 lg:pb-3 border-b border-zinc-200 dark:border-white/10">
        <div className="mt-1 h-4 w-1 bg-[#168a9c] rounded-full" />
        <div>
            <div className="flex items-center gap-1.5">
                <SafeIcon name={icon} size={14} className="text-zinc-500 dark:text-zinc-400" />
                <h3 className="text-[12px] font-bold uppercase tracking-widest text-zinc-900 dark:text-white">{title}</h3>
            </div>
            {sub && <p className="text-[9px] font-medium uppercase tracking-[0.15em] text-zinc-400 dark:text-zinc-500 mt-0.5">{sub}</p>}
        </div>
    </div>
);

const RichNoteEditor = ({ value, onChange }) => {
    const editorRef = React.useRef(null);
    const [hasContent, setHasContent] = React.useState(!!value && value !== '<br>');

    React.useEffect(() => {
        const isEmpty = !value || value === '<br>' || value === '<div><br></div>';
        setHasContent(!isEmpty);
    }, [value]);

    const handleInput = (e) => {
        const text = e.currentTarget.textContent.trim();
        const html = e.currentTarget.innerHTML.trim();
        setHasContent(!(text.length === 0 && (html === '' || html === '<br>' || html === '<br/>')));
    };

    // NYTT: Tvingar inklistrad text att tappa sin formatering och bli ren text
    const handlePaste = (e) => {
        e.preventDefault();
        const text = e.clipboardData ? e.clipboardData.getData('text/plain') : '';
        document.execCommand('insertText', false, text);
    };

    const format = (command, val = null) => {
        document.execCommand(command, false, val);
        if (editorRef.current) {
            editorRef.current.focus();
            onChange(editorRef.current.innerHTML);
        }
    };

    const insertLink = () => {
        const url = prompt('Klistra in webbadressen (t.ex. https://...):');
        if (!url) return;
        const selection = window.getSelection();
        const text = selection.toString() || prompt('Vad ska länken heta?', url) || url;
        format('insertHTML', `<a href="${url}" target="_blank" style="color: #168a9c; text-decoration: underline; font-weight: bold; cursor: pointer;">${text}</a>`);
    };

    const normalizeText = () => {
        document.execCommand('removeFormat', false, null);
        if (editorRef.current) {
            const elements = editorRef.current.querySelectorAll('*');
            elements.forEach(el => { el.removeAttribute('style'); el.removeAttribute('class'); });
            onChange(editorRef.current.innerHTML);
        }
    };

    const keepFocus = (e) => e.preventDefault(); 

    return (
        // FIX: Tog bort boxens yttre border/radie för att den ska smälta in snyggt i kortet
        <div className="w-full flex flex-col transition-all">
            <div className="flex flex-wrap items-center gap-1.5 p-2.5 border-b border-zinc-200 bg-white">
                <button type="button" onMouseDown={keepFocus} onClick={() => format('bold')} className="p-1.5 text-zinc-600 hover:bg-zinc-100 rounded transition-colors" title="Fetstil"><SafeIcon name="bold" size={14} /></button>
                <button type="button" onMouseDown={keepFocus} onClick={() => format('italic')} className="p-1.5 text-zinc-600 hover:bg-zinc-100 rounded transition-colors" title="Kursiv"><SafeIcon name="italic" size={14} /></button>
                <button type="button" onMouseDown={keepFocus} onClick={() => format('insertUnorderedList')} className="p-1.5 text-zinc-600 hover:bg-zinc-100 rounded transition-colors" title="Punktlista"><SafeIcon name="list" size={14} /></button>
                
                <div className="w-px h-4 bg-zinc-300 mx-1"></div>
                
                <button type="button" onMouseDown={keepFocus} onClick={normalizeText} className="p-1.5 text-zinc-600 hover:bg-zinc-100 rounded transition-colors flex items-center gap-1" title="Rensa formatering">
                    <SafeIcon name="eraser" size={14} />
                </button>

                <div className="w-px h-4 bg-zinc-300 mx-1"></div>

                <button type="button" onMouseDown={keepFocus} onClick={insertLink} className="p-1.5 text-[#168a9c] hover:bg-[#168a9c]/10 rounded flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider" title="Infoga länk">
                    <SafeIcon name="link" size={12} /> Länk
                </button>
            </div>
            <div className="relative bg-white">
                {!hasContent && <div className="absolute top-4 left-4 text-zinc-400 font-medium text-[13px] pointer-events-none">Felsökningsprotokoll och mekanikerns noteringar...</div>}
                <div
                    ref={editorRef}
                    contentEditable
                    onInput={handleInput} 
                    onPaste={handlePaste}
                    onBlur={(e) => onChange(e.currentTarget.innerHTML)} 
                    dangerouslySetInnerHTML={{ __html: value }}
                    // FIX: [&_*]:!text-[13px] tvingar alla element i hela boxen att bli 13px oavsett vad
                    className="p-4 min-h-[180px] text-[13px] leading-relaxed text-zinc-900 outline-none cursor-text [&_ul]:list-disc [&_ul]:pl-6 [&_ul]:my-1 [&_*]:!text-[13px] [&_*]:!leading-relaxed"
                    style={{ whiteSpace: 'pre-wrap' }}
                />
            </div>
        </div>
    );
};

window.NewJobView = ({ editingJob, setView, allJobs = [] }) => {
    const today = new Date().toISOString().split('T')[0];
    
    // STEG-HANTERING
    const [step, setStep] = React.useState(editingJob ? 'DETAIL' : 'SEARCH');
    const [searchQuery, setSearchQuery] = React.useState('');
    const [activeTab, setActiveTab] = React.useState('ORDEROMFATTNING');

    const [formData, setFormData] = React.useState({
        kundnamn: '', regnr: '', paket: 'Standard', status: 'BOKAD',
        datum: today, tid: '16:30', kundpris: '100', kommentar: ''
    });
    
    // NYTT: expenses har nu "type" (reservdel eller arbetsoperation)
    const emptyExpenses = [
        { desc: '', amount: '', type: 'reservdel' }, 
        { desc: '', amount: '', type: 'arbetsoperation' }, 
        { desc: '', amount: '', type: 'reservdel' }
    ];
    const [expenses, setExpenses] = React.useState(emptyExpenses);
    const [selectedExpenses, setSelectedExpenses] = React.useState([]); // NYTT: Håller koll på vilka rader som är ikryssade
    
    const emptyPayments = [{ desc: '', amount: '' }];
    const [payments, setPayments] = React.useState(emptyPayments);
    
    const [oilLiters, setOilLiters] = React.useState(4.3);
    const [fetchedCarInfo, setFetchedCarInfo] = React.useState(null);
    const [activeJob, setActiveJob] = React.useState(editingJob || null);

    // NYTT: Hanterar redigeringsläge vs. kopieringsläge för fordonskortet
    const [isEditingVehicle, setIsEditingVehicle] = React.useState(false);
    const [copiedField, setCopiedField] = React.useState(null);
    
    // FIX: Hanterar expandering av rader i sökresultatet
    const [expandedMatchIds, setExpandedMatchIds] = React.useState([]);
    const toggleExpandMatch = (id) => {
        setExpandedMatchIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
        setTimeout(() => { if (window.lucide) window.lucide.createIcons(); }, 30);
    };

    // SÖKLOGIK FÖR STEG 1
    const matchingOrders = React.useMemo(() => {
        const query = searchQuery.trim().toLowerCase().replace(/\s+/g, '');
        if (query.length < 2) return [];

        return allJobs.filter(j => {
            if (j.deleted) return false;
            const jReg = String(j.regnr || '').toLowerCase().replace(/\s+/g, '');
            const jName = String(j.kundnamn || '').toLowerCase();
            return jReg.includes(query) || jName.includes(query);
        }).sort((a, b) => (b.datum || '').localeCompare(a.datum || '')).slice(0, 6);
    }, [searchQuery, allJobs]);

    const handleOpenExistingOrder = (job) => {
        setActiveJob(job);
        setStep('DETAIL');
    };

    React.useEffect(() => {
        const rawReg = formData.regnr || '';
        const cleanReg = String(rawReg).toUpperCase().replace(/\s+/g, '');
        let isMounted = true;
        let unsubscribe = () => {};

        if (cleanReg.length < 5) {
            setFetchedCarInfo(null);
            return;
        }

        const getLocalCache = (reg) => {
            try { return JSON.parse(localStorage.getItem('os_vehicle_cache') || '{}')[reg] || {}; } catch(e) { return {}; }
        };
        const localData = getLocalCache(cleanReg);
        const previousJobs = allJobs.filter(j => String(j.regnr || '').toUpperCase().replace(/\s+/g, '') === cleanReg).sort((a,b) => (b.datum||'').localeCompare(a.datum||''));
        const lastJob = previousJobs.length > 0 ? previousJobs[0] : null;

        const updateCarInfo = (specs) => {
            if (!isMounted) return;
            const isHistoryUnknown = lastJob && lastJob.bilmodell && lastJob.bilmodell.toLowerCase().includes('okänd');

            setFetchedCarInfo(prev => {
                const updated = prev ? { ...prev } : { regnr: rawReg, bilmodell: "", motorkod: "", miltal: "", oljevolym: "", oljetyp: "", årsmodell: "", vin: "", isNewData: false };
                
                if (specs.model) updated.bilmodell = specs.model; else if (!updated.bilmodell && lastJob && !isHistoryUnknown) updated.bilmodell = lastJob.bilmodell;
                if (specs.engine) updated.motorkod = specs.engine; else if (!updated.motorkod && lastJob?.motorkod) updated.motorkod = lastJob.motorkod;
                if (specs.mileage) updated.miltal = specs.mileage; else if (!updated.miltal && lastJob?.miltal) updated.miltal = lastJob.miltal;
                if (specs.year) updated.årsmodell = specs.year; else if (!updated.årsmodell && lastJob?.årsmodell) updated.årsmodell = lastJob.årsmodell;
                if (specs.vin || specs.chassinummer) updated.vin = specs.vin || specs.chassinummer; else if (!updated.vin && lastJob?.vin) updated.vin = lastJob.vin;
                if (specs.oil) updated.oljevolym = String(specs.oil).replace(' l', ''); else if (!updated.oljevolym && lastJob?.oljevolym) updated.oljevolym = String(lastJob.oljevolym).replace(' l', '');
                if (specs.oil_type) updated.oljetyp = specs.oil_type; else if (!updated.oljetyp && lastJob?.oljetyp) updated.oljetyp = lastJob.oljetyp;

                return updated;
            });
        };

        updateCarInfo(localData);

        if (window.db) {
            unsubscribe = window.db.collection('vehicleSpecs').doc(cleanReg).onSnapshot(doc => {
                if (doc.exists) updateCarInfo(doc.data());
            });
        }
        return () => { isMounted = false; unsubscribe(); };
    }, [formData.regnr]);

    React.useEffect(() => {
        const loadExistingJob = async () => {
            if (activeJob) {
                setFormData(prev => ({ 
                    ...prev, ...activeJob, 
                    datum: activeJob.datum ? activeJob.datum.split('T')[0] : '',
                    tid: activeJob.datum && activeJob.datum.includes('T') ? activeJob.datum.split('T')[1] : '16:30' 
                }));
                
                if (activeJob.utgifter && activeJob.utgifter.length > 0) {
                    let loadedExpenses = activeJob.utgifter.map(ex => ({ 
                        desc: ex.namn, 
                        amount: ex.kostnad,
                        type: ex.type || 'reservdel' 
                    }));
                    while (loadedExpenses.length < 3) loadedExpenses.push({ desc: '', amount: '', type: 'reservdel' });
                    setExpenses(loadedExpenses);
                } else setExpenses(emptyExpenses);

                if (activeJob.delbetalningar && activeJob.delbetalningar.length > 0) setPayments(activeJob.delbetalningar);
                else if (activeJob.betaltBelopp > 0) setPayments([{ desc: 'Tidigare inbetalning', amount: activeJob.betaltBelopp }]);
                else setPayments(emptyPayments);
                
            } else {
                setFormData(p => ({ ...p, datum: today, tid: '16:30', kundpris: '100', status: 'BOKAD', paket: 'Standard' }));
                setExpenses(emptyExpenses); setPayments(emptyPayments);
            }
        };
        loadExistingJob();
    }, [activeJob, today]);

    const handlePackageChange = (val) => {
        setFormData(p => ({ ...p, paket: val }));
    };

    // FIX: Denna saknades vilket gjorde att redigering av kundnamn kraschade sparningen
    const handleNameChange = (val) => {
        setFormData(p => ({ ...p, kundnamn: val.toUpperCase() }));
    };

    const handleSpecChange = (key, value) => {
        setFetchedCarInfo(prev => ({ ...prev, [key]: value }));
    };

    // FIX: Vi lägger till saveSpec här så att fordonsdata auto-sparas när du klickar utanför ett fält
    const saveSpec = async (key, value) => {
        const finalRegnr = formData.regnr?.toUpperCase().replace(/\s+/g, '');
        if (!finalRegnr || !window.db) return;
        const specUpdates = { updatedAt: new Date().toISOString() };
        if (key === 'årsmodell') specUpdates.year = value; 
        if (key === 'motorkod') specUpdates.engine = value;
        if (key === 'oljevolym') specUpdates.oil = value; 
        if (key === 'miltal') specUpdates.mileage = value; 
        if (key === 'vin') specUpdates.vin = value;
        if (key === 'bilmodell') specUpdates.model = value;
        try { await window.db.collection("vehicleSpecs").doc(finalRegnr).set(specUpdates, { merge: true }); } catch(e) {}
    };

    // FIX: Låter handleSave ta emot 'overrideStatus' så Snabbvalsknappen sparar ALLT, inte bara statusen
    const handleSave = async (e, overrideStatus = null) => {
        if (e) e.preventDefault();
        try {
            const finalRegnr = formData.regnr.toUpperCase().trim();
            const finalExpenses = expenses.filter(ex => ex.desc && ex.amount).map(ex => ({ 
                namn: ex.desc, 
                kostnad: ex.amount,
                type: ex.type 
            }));
            const finalPayments = payments.filter(p => p.desc || p.amount).map(p => ({ desc: p.desc, amount: p.amount }));
            const totalPaidAmount = finalPayments.reduce((sum, item) => sum + (parseFloat(item.amount) || 0), 0);

            const resolvedBilmodell = fetchedCarInfo?.bilmodell || formData.bilmodell || '';
            const resolvedMotorkod = fetchedCarInfo?.motorkod || formData.motorkod || '';
            const resolvedMiltal = fetchedCarInfo?.miltal || formData.miltal || '';
            const resolvedArsmodell = fetchedCarInfo?.årsmodell || formData.årsmodell || '';
            const finalStatus = overrideStatus || formData.status;

            const data = { 
                ...formData, 
                status: finalStatus,
                betaltBelopp: totalPaidAmount, 
                delbetalningar: finalPayments, 
                regnr: finalRegnr, 
                datum: formData.datum ? `${formData.datum}T${formData.tid}` : '', 
                bilmodell: resolvedBilmodell, 
                motorkod: resolvedMotorkod, 
                miltal: resolvedMiltal,
                årsmodell: resolvedArsmodell, 
                utgifter: finalExpenses, 
                deleted: false 
            };
            
            if (activeJob && activeJob.id) await window.db.collection("jobs").doc(activeJob.id).set(data, { merge: true });
            else await window.db.collection("jobs").add(data);

            setView('DASHBOARD', null);
        } catch (error) { alert("Ett fel uppstod när jobbet skulle sparas."); }
    };

    const partsTotal = expenses.reduce((sum, item) => sum + (parseFloat(item.amount) || 0), 0);
    const finalPriceNum = parseFloat(formData.kundpris) || 0;
    const totalPaid = payments.reduce((sum, item) => sum + (parseFloat(item.amount) || 0), 0);

    // NYTT: Uträkningar för den smarta Kostnadsfördelningen
    const materialCost = expenses.filter(ex => ex.type !== 'arbetsoperation').reduce((sum, item) => sum + (parseFloat(item.amount) || 0), 0);
    const laborCost = Math.max(0, finalPriceNum - materialCost);

    return (
        <div className="flex flex-col min-h-[calc(100vh-80px)] md:min-h-screen bg-zinc-50/50 dark:bg-transparent text-zinc-900 dark:text-white pb-0 md:pb-10 transition-colors duration-500 relative max-w-[1400px] ml-0 w-full animate-in fade-in slide-in-from-left-4">
            
            {/* Gamla Headern - visas BARA i Detaljvyn nu */}
            {step === 'DETAIL' && (
                <div className="px-4 pt-4 lg:px-0 lg:pt-0 flex flex-col mb-4">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-zinc-200 dark:border-white/10 gap-4">
                        <div className="flex items-center gap-3 md:gap-4">
                            {!activeJob && (
                                <button onClick={() => setStep('SEARCH')} className="w-10 h-10 rounded-xl bg-white dark:bg-white/5 border border-zinc-200 dark:border-white/10 flex items-center justify-center text-zinc-500 hover:text-zinc-900 transition-colors shrink-0 shadow-sm">
                                    <SafeIcon name="arrow-left" size={18} />
                                </button>
                            )}
                            <div className="relative group cursor-default shrink-0">
                                <div className="absolute inset-0 bg-[#f97316]/30 blur-lg rounded-full transition-all duration-700" />
                                <div className="relative w-10 h-10 md:w-12 md:h-12 rounded-[12px] flex items-center justify-center text-white shadow-md border border-white/20 transition-colors bg-[#f97316]">
                                    <SafeIcon name={activeJob ? "edit-2" : "plus"} size={20} className="md:w-6 md:h-6" />
                                </div>
                            </div>
                            <div className="flex flex-col">
                                <h1 className="text-xl md:text-2xl font-black text-zinc-900 dark:text-white uppercase tracking-tight leading-none">
                                    {activeJob ? 'UPPDATERA' : 'NYTT'} <span className="text-zinc-400 font-light">UPPDRAG</span>
                                </h1>
                                <p className="text-[9px] md:text-[10px] font-bold text-[#f97316] uppercase tracking-widest mt-1 flex items-center gap-1.5">
                                    <span className="w-1.5 h-1.5 rounded-full bg-[#f97316] animate-pulse"></span>
                                    {activeJob ? `REDIGERAR ORDER • ${formData.regnr || activeJob.id.substring(0,6).toUpperCase()}` : 'SKAPAR NY ARBETSORDER'}
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* === STEG 1: SÖK-VYN (ElsaPro Style) === */}
            {step === 'SEARCH' && (
                <div className="w-full bg-white dark:bg-[#141c2b] min-h-[calc(100vh-80px)] rounded-xl border border-zinc-200 dark:border-white/10 shadow-sm overflow-hidden mb-6">
                    
                    {/* Brödsmulor / Top Header (Referens Bild 1) */}
                    <div className="px-6 pt-6 pb-0 border-b border-zinc-200 dark:border-white/10">
                        <div className="flex items-center gap-3 mb-6">
                            <SafeIcon name="arrow-left" size={24} className="text-[#168a9c]" />
                            <h1 className="text-[22px] md:text-[26px] font-light text-zinc-800 dark:text-white tracking-tight">Ny serviceorder</h1>
                            <span className="text-[11px] text-zinc-500 mt-1.5">2 Eslöv</span>
                        </div>
                        <div className="flex items-center gap-4 md:gap-8 text-[11px] md:text-[12px] text-zinc-400 dark:text-zinc-500 uppercase tracking-widest font-bold overflow-x-auto whitespace-nowrap hide-scrollbar">
                            <span className="text-zinc-900 dark:text-white border-b-[3px] border-[#168a9c] pb-3 px-1">1. Fordon</span>
                            <span className="pb-3"><SafeIcon name="chevron-right" size={14}/></span>
                            <span className="pb-3">2. Betalare</span>
                            <span className="pb-3"><SafeIcon name="chevron-right" size={14}/></span>
                            <span className="pb-3">3. Kontakt</span>
                        </div>
                    </div>

                    {/* Sök-innehåll */}
                    <div className="p-4 md:p-6 max-w-[1400px]">
                        
                        {/* Sökfältet */}
                        <div className="flex flex-col md:flex-row md:items-end gap-4 md:gap-6 mb-4">
                            <div className="relative w-full md:w-[350px]">
                                <SafeIcon name="search" size={16} className="absolute left-0 bottom-2 text-zinc-400" />
                                <input 
                                    type="text" 
                                    autoFocus
                                    value={searchQuery}
                                    onChange={e => setSearchQuery(e.target.value)}
                                    className="w-full bg-transparent border-b-2 border-zinc-200 focus:border-[#168a9c] dark:border-white/20 dark:focus:border-[#168a9c] pl-7 pr-6 pb-1.5 text-[14px] outline-none text-zinc-900 dark:text-white transition-colors placeholder:text-zinc-400"
                                />
                                {searchQuery && (
                                    <button onClick={() => setSearchQuery('')} className="absolute right-0 bottom-2 text-[#168a9c]">
                                        <SafeIcon name="x" size={14} />
                                    </button>
                                )}
                            </div>
                            <div className="flex items-center gap-4 text-zinc-400 pb-1.5 hidden md:flex">
                                <SafeIcon name="key" size={16} className="text-[#168a9c]" />
                                <span className="text-[12px] border-b border-zinc-200 dark:border-white/10 pb-1 flex items-center gap-2 cursor-pointer hover:border-zinc-300 transition-colors">Märke <SafeIcon name="chevron-down" size={12}/></span>
                                <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">Servicenyckel</span>
                            </div>
                        </div>

                        <button 
                            onClick={() => {
                                const query = searchQuery.toUpperCase();
                                if (query.length <= 6 && !query.includes(' ')) {
                                    setFormData(p => ({ ...p, regnr: query }));
                                } else {
                                    setFormData(p => ({ ...p, kundnamn: query }));
                                }
                                setStep('DETAIL');
                            }}
                            className="mb-6 md:mb-8 px-4 py-1.5 border border-[#168a9c] text-[#168a9c] text-[10px] font-bold uppercase tracking-wider rounded-sm hover:bg-[#168a9c] hover:text-white transition-colors bg-transparent"
                        >
                            Skapande av fordon
                        </button>

                        {/* Resultat-Tabellen (Exakt enligt Order Historik-referensbild) */}
                        {matchingOrders.length > 0 ? (
                            <div className="mt-2 border border-zinc-300 dark:border-white/10 shadow-sm overflow-x-auto bg-white dark:bg-[#141c2b]">
                                <table className="w-full text-left border-collapse min-w-[1300px] text-[12px] font-sans">
                                    <thead className="bg-white dark:bg-black/20 text-zinc-800 dark:text-zinc-300 font-bold border-b border-zinc-300 dark:border-white/10 select-none">
                                        <tr className="divide-x divide-zinc-200 dark:divide-white/10">
                                            <th className="w-8 py-2.5 px-2 text-center"></th>
                                            <th className="py-2.5 px-3 hover:bg-zinc-50 cursor-pointer whitespace-nowrap group">
                                                <div className="flex justify-between items-center gap-2">Nr. <span className="text-[#168a9c] flex flex-col leading-[0.5] text-[7px] opacity-40 group-hover:opacity-100"><span>▲</span><span>▼</span></span></div>
                                            </th>
                                            <th className="py-2.5 px-3 hover:bg-zinc-50 cursor-pointer whitespace-nowrap group">
                                                <div className="flex justify-between items-center gap-2">SR <span className="text-[#168a9c] flex flex-col leading-[0.5] text-[7px] opacity-40 group-hover:opacity-100"><span>▲</span><span>▼</span></span></div>
                                            </th>
                                            <th className="py-2.5 px-3 hover:bg-zinc-50 cursor-pointer whitespace-nowrap group">
                                                <div className="flex justify-between items-center gap-2">Kund <span className="text-[#168a9c] flex flex-col leading-[0.5] text-[7px] opacity-40 group-hover:opacity-100"><span>▲</span><span>▼</span></span></div>
                                            </th>
                                            <th className="py-2.5 px-3 hover:bg-zinc-50 cursor-pointer whitespace-nowrap group">
                                                <div className="flex justify-between items-center gap-2">Reg.nr <span className="text-[#168a9c] flex flex-col leading-[0.5] text-[7px] opacity-40 group-hover:opacity-100"><span>▲</span><span>▼</span></span></div>
                                            </th>
                                            <th className="py-2.5 px-3 hover:bg-zinc-50 cursor-pointer whitespace-nowrap group">
                                                <div className="flex justify-between items-center gap-2">Mottagandedatum <span className="text-[#168a9c] flex flex-col leading-[0.5] text-[7px] opacity-40 group-hover:opacity-100"><span>▲</span><span>▼</span></span></div>
                                            </th>
                                            <th className="py-2.5 px-3 hover:bg-zinc-50 cursor-pointer whitespace-nowrap group">
                                                <div className="flex items-center gap-2">Datum för<br/>kostnadsdokument</div>
                                            </th>
                                            <th className="py-2.5 px-3 hover:bg-zinc-50 cursor-pointer whitespace-nowrap group">
                                                <div className="flex justify-between items-center gap-2">Mätarställning <span className="text-[#168a9c] flex flex-col leading-[0.5] text-[7px] opacity-40 group-hover:opacity-100"><span>▲</span><span>▼</span></span></div>
                                            </th>
                                            <th className="py-2.5 px-3 hover:bg-zinc-50 cursor-pointer whitespace-nowrap text-right">
                                                Kund belopp
                                            </th>
                                            <th className="py-2.5 px-3 hover:bg-zinc-50 cursor-pointer whitespace-nowrap text-right">
                                                Garanti Kund
                                            </th>
                                            <th className="py-2.5 px-3 hover:bg-zinc-50 cursor-pointer whitespace-nowrap text-right">
                                                Internt belopp
                                            </th>
                                            <th className="py-2.5 px-3 hover:bg-zinc-50 cursor-pointer whitespace-nowrap group">
                                                <div className="flex justify-between items-center gap-2">Status <span className="text-[#168a9c] flex flex-col leading-[0.5] text-[7px] opacity-40 group-hover:opacity-100"><span>▲</span><span>▼</span></span></div>
                                            </th>
                                            <th className="py-2.5 px-3 hover:bg-zinc-50 cursor-pointer whitespace-nowrap group">
                                                <div className="flex justify-between items-center gap-2">Anläggning <span className="text-[#168a9c] flex flex-col leading-[0.5] text-[7px] opacity-40 group-hover:opacity-100"><span>▲</span><span>▼</span></span></div>
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-zinc-200 dark:divide-white/10 text-[12.5px] text-zinc-800 dark:text-zinc-200 bg-white dark:bg-transparent">
                                        {matchingOrders.map((job) => {
                                            const isExpanded = expandedMatchIds.includes(job.id);
                                            const formattedDate = job.datum ? job.datum.replace('T', ' ') : '';
                                            const displayStatus = job.status === 'BOKAD' ? 'Ny' : job.status === 'KLAR' ? 'Stängd' : (job.status || 'Ny');
                                            const safeId = job.id ? job.id.substring(0,8).toUpperCase() : 'UNKNOWN';
                                            
                                            return (
                                                <React.Fragment key={job.id}>
                                                    <tr onClick={() => toggleExpandMatch(job.id)} className={`hover:bg-[#f2fcfd] dark:hover:bg-white/5 cursor-pointer transition-colors ${isExpanded ? 'bg-[#f2fcfd] dark:bg-white/[0.03]' : ''}`}>
                                                        <td className="py-2.5 px-2 text-center text-zinc-700">
                                                            <SafeIcon name={isExpanded ? "chevron-down" : "chevron-right"} size={16} />
                                                        </td>
                                                        <td className="py-2.5 px-3 whitespace-nowrap">
                                                            <button onClick={(e) => { e.stopPropagation(); handleOpenExistingOrder(job); }} className="flex items-center gap-1.5 text-[#168a9c] hover:underline font-medium">
                                                                <SafeIcon name="wrench" size={13} />
                                                                <span>2026{safeId}</span>
                                                            </button>
                                                        </td>
                                                        <td className="py-2.5 px-3 whitespace-nowrap text-zinc-600">
                                                            -
                                                        </td>
                                                        <td className="py-2.5 px-3 whitespace-nowrap truncate max-w-[140px]">
                                                            {job.kundnamn || '-'}
                                                        </td>
                                                        <td className="py-2.5 px-3 whitespace-nowrap text-zinc-800 font-medium">
                                                            {job.regnr || '-'}
                                                        </td>
                                                        <td className="py-2.5 px-3 whitespace-nowrap text-zinc-800">
                                                            {formattedDate}
                                                        </td>
                                                        <td className="py-2.5 px-3 whitespace-nowrap text-zinc-800">
                                                            {formattedDate}
                                                        </td>
                                                        <td className="py-2.5 px-3 whitespace-nowrap text-right pr-6">
                                                            {job.miltal || '-'}
                                                        </td>
                                                        <td className="py-2.5 px-3 whitespace-nowrap text-right font-medium">
                                                            <div className="flex items-center justify-end gap-1.5">
                                                                <SafeIcon name="info" size={12} className="text-[#168a9c] opacity-80" />
                                                                <span>{job.kundpris ? `${parseInt(job.kundpris).toLocaleString('sv-SE')},00 kr` : '0,00 kr'}</span>
                                                            </div>
                                                        </td>
                                                        <td className="py-2.5 px-3 whitespace-nowrap text-right text-zinc-600">
                                                            0,00 kr
                                                        </td>
                                                        <td className="py-2.5 px-3 whitespace-nowrap text-right text-zinc-600">
                                                            0,00 kr
                                                        </td>
                                                        <td className="py-2.5 px-3 whitespace-nowrap">
                                                            {displayStatus}
                                                        </td>
                                                        <td className="py-2.5 px-3 whitespace-nowrap text-zinc-600">
                                                            2 Eslöv
                                                        </td>
                                                    </tr>

                                                    {isExpanded && (
                                                        <tr className="bg-[#f2fcfd] dark:bg-white/[0.02]">
                                                            <td></td>
                                                            <td colSpan="12" className="px-3 pb-6 pt-2">
                                                                <div className="pl-6 space-y-2.5">
                                                                    <div className="flex items-center gap-1.5 font-medium text-[12px] text-zinc-800 dark:text-white">
                                                                        <SafeIcon name="chevron-down" size={14} className="text-zinc-600" />
                                                                        <SafeIcon name="box" size={14} className="text-[#168a9c]" />
                                                                        <span>{job.paket || 'Inspektion'}</span>
                                                                    </div>
                                                                    
                                                                    {job.kommentar && (
                                                                        <div className="pl-7 flex items-start gap-1.5 text-[12px] text-zinc-600 dark:text-zinc-400">
                                                                            <SafeIcon name="message-square" size={13} className="text-[#168a9c] mt-0.5 shrink-0" />
                                                                            <div className="leading-relaxed [&_a]:text-[#168a9c] [&_a]:underline" dangerouslySetInnerHTML={{ __html: job.kommentar }} />
                                                                        </div>
                                                                    )}
                                                                    
                                                                    {job.utgifter && job.utgifter.filter(u => u.namn).map((u, idx) => (
                                                                        <div key={idx} className="pl-7 flex items-center gap-1.5 text-[12px] text-zinc-600 dark:text-zinc-400">
                                                                            <SafeIcon name="tag" size={13} className="text-[#168a9c] shrink-0" />
                                                                            <span>{u.namn}</span>
                                                                        </div>
                                                                    ))}
                                                                </div>

                                                                <div className="flex flex-wrap items-center gap-2 mt-5 pl-6">
                                                                    <button type="button" onClick={(e) => { e.stopPropagation(); handleOpenExistingOrder(job); }} className="px-5 py-2 bg-[#168a9c] hover:bg-[#127282] text-white rounded-[2px] text-[10px] font-bold uppercase tracking-wider transition-colors shadow-sm">ÖPPNA ORDER</button>
                                                                    <button type="button" onClick={async (e) => { e.stopPropagation(); await window.db.collection("jobs").doc(job.id).update({ status: 'KLAR' }); }} className="px-5 py-2 bg-white border border-[#168a9c] text-[#168a9c] rounded-[2px] text-[10px] font-bold uppercase tracking-wider transition-colors shadow-sm hover:bg-[#eaf5f7]">MARKERA STÄNGD</button>
                                                                </div>
                                                            </td>
                                                        </tr>
                                                    )}
                                                </React.Fragment>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        ) : (
                            searchQuery.length >= 2 && (
                                <div className="w-full text-center text-zinc-500 py-10 text-[13px] bg-white border border-zinc-200 mt-2">
                                    Inga fordon hittades för "{searchQuery}".
                                </div>
                            )
                        )}
                    </div>
                </div>
            )}

            {/* === STEG 2: ORDER-DETALJER === */}
            {step === 'DETAIL' && (
                <div className="px-4 lg:px-0 pb-0 lg:pb-6">
                    {/* FIX: CSS Grid på dator (2 kolumner), Flexbox på mobil (rak lista). Order-klasserna bestämmer exakt ordning på mobilen! */}
                    <form onSubmit={handleSave} className="flex flex-col lg:grid lg:grid-cols-[1fr_320px] xl:grid-cols-[1fr_340px] gap-5 lg:items-start relative">
                        
                        {/* 1. STATUS (Vänster kolumn på dator, block 1 överst på mobil) */}
                        <div className="order-1 lg:col-start-1 w-full flex items-center gap-4 mb-2 lg:mb-0">
                            <InputWrapper label="Uppdragsstatus" icon="activity">
                                <select value={formData.status} onChange={e => setFormData(p => ({ ...p, status: e.target.value }))} className="bg-white dark:bg-[#1e293b] border border-zinc-200 dark:border-white/10 text-zinc-900 dark:text-white text-[12px] font-bold p-2.5 rounded-lg outline-none focus:border-[#168a9c] shadow-sm w-[150px]">
                                    <option value="BOKAD">BOKAD</option>
                                    <option value="OFFERERAD">OFFERERAD</option>
                                    <option value="KLAR">KLAR</option>
                                    <option value="FAKTURERAS">FAKTURERAS</option>
                                </select>
                            </InputWrapper>
                        </div>

                        {/* 2. HÖGERKOLUMN (Höger på dator, block 2 på mobil mellan Status och Orderomfattning) */}
                        <div className="order-2 lg:col-start-2 lg:row-span-4 w-full flex flex-col gap-4 lg:sticky lg:top-4 pb-0 lg:pb-20">
                            
                            {/* SPARA-KNAPPAR DATOR (Dold på mobil, visas på stor skärm) */}
                            <div className="hidden lg:flex flex-col gap-2">
                                <button type="submit" className="w-full px-6 py-3 bg-[#f97316] hover:bg-[#ea580c] text-white font-bold text-[13px] shadow-sm rounded-xl transition-colors flex items-center justify-center gap-2">
                                    <SafeIcon name="save" size={16} /> SPARA JOBB
                                </button>
                                {activeJob && activeJob.status !== 'KLAR' && (
                                    <button type="button" onClick={(e) => handleSave(e, 'KLAR')} className="w-full px-6 py-2.5 bg-zinc-100 hover:bg-zinc-200 border border-zinc-200 text-zinc-700 font-bold text-[12px] shadow-sm rounded-xl transition-colors flex items-center justify-center gap-2">
                                        <SafeIcon name="check" size={14} /> SNABBVAL: KLAR
                                    </button>
                                )}
                            </div>

                            {/* FORDONSKORT (Nu med rounded-xl) */}
                            <div className="bg-white border border-zinc-200 rounded-xl p-4 shadow-sm dark:bg-[#1e293b] dark:border-white/10">
                                <div className="flex items-center gap-3 mb-4">
                                    <div className="w-10 h-10 bg-zinc-500 rounded-xl flex items-center justify-center text-white shrink-0">
                                        <SafeIcon name="car" size={24} />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        {isEditingVehicle ? (
                                            <input 
                                                type="text" 
                                                value={fetchedCarInfo?.bilmodell || formData.bilmodell || ''} 
                                                onChange={(e) => handleSpecChange('bilmodell', e.target.value)}
                                                onBlur={(e) => saveSpec('bilmodell', e.target.value)}
                                                placeholder="Märke & Modell..."
                                                className="w-full bg-zinc-100 dark:bg-black/20 border border-zinc-200 dark:border-white/10 px-2 py-1 rounded outline-none font-bold text-[14px] text-[#168a9c] truncate" 
                                            />
                                        ) : (
                                            <div className="font-bold text-[14px] text-[#168a9c] truncate uppercase">
                                                {(() => {
                                                    const raw = fetchedCarInfo?.bilmodell || formData.bilmodell || '';
                                                    return raw.replace(/VOLKSWAGEN/i, 'VW').replace(/MERCEDES-BENZ/i, 'MB').replace(/MERCEDES/i, 'MB').replace(/LAND ROVER/i, 'LR') || 'OKÄND MODELL';
                                                })()}
                                            </div>
                                        )}
                                    </div>
                                    <button type="button" onClick={() => setIsEditingVehicle(!isEditingVehicle)} className={`p-1.5 rounded transition-colors shrink-0 ${isEditingVehicle ? 'bg-[#168a9c] text-white' : 'text-[#168a9c] hover:bg-zinc-100 dark:hover:bg-white/5'}`}>
                                        <SafeIcon name={isEditingVehicle ? "check" : "edit-2"} size={16} />
                                    </button>
                                </div>
                                
                                <div className="space-y-2.5 text-[13px]">
                                    {[
                                        { label: 'Reg.Nr.:', val: formData.regnr, id: 'regnr', uppercase: true, action: (v) => setFormData(p => ({...p, regnr: v.toUpperCase()})) },
                                        { label: 'Ch.nr:', val: fetchedCarInfo?.vin || '', id: 'vin', uppercase: true, action: (v) => handleSpecChange('vin', v.toUpperCase()), blur: (v) => saveSpec('vin', v) },
                                        { label: 'Motornummer:', val: fetchedCarInfo?.motorkod || '', id: 'motorkod', uppercase: true, action: (v) => handleSpecChange('motorkod', v), blur: (v) => saveSpec('motorkod', v) },
                                        { label: 'Årsmodell:', val: fetchedCarInfo?.årsmodell || '', id: 'årsmodell', action: (v) => handleSpecChange('årsmodell', v), blur: (v) => saveSpec('årsmodell', v) },
                                        { label: 'Miltal:', val: fetchedCarInfo?.miltal || '', id: 'miltal', action: (v) => handleSpecChange('miltal', v), blur: (v) => saveSpec('miltal', v) },
                                        { label: 'Oljevolym:', val: fetchedCarInfo?.oljevolym || '', id: 'oljevolym', action: (v) => handleSpecChange('oljevolym', v), blur: (v) => saveSpec('oljevolym', v) }
                                    ].map(field => (
                                        <div key={field.id} className="flex items-center gap-2 group min-h-[24px]">
                                            <span className="font-bold text-zinc-800 dark:text-zinc-200 w-[95px] shrink-0">{field.label}</span>
                                            {isEditingVehicle ? (
                                                <input 
                                                    value={field.val} 
                                                    onChange={e => field.action(e.target.value)}
                                                    onBlur={e => field.blur ? field.blur(e.target.value) : null}
                                                    className={`w-full bg-zinc-100 dark:bg-black/20 border border-zinc-200 dark:border-white/10 px-2 py-0.5 rounded outline-none text-zinc-900 dark:text-white ${field.uppercase ? 'uppercase' : ''}`} 
                                                    placeholder="-" 
                                                />
                                            ) : (
                                                <div 
                                                    onClick={() => {
                                                        if(field.val) {
                                                            navigator.clipboard.writeText(field.val);
                                                            setCopiedField(field.id);
                                                            setTimeout(() => setCopiedField(null), 2000);
                                                        }
                                                    }}
                                                    className={`w-full bg-transparent text-zinc-600 dark:text-zinc-400 cursor-pointer flex items-center justify-between hover:text-[#168a9c] transition-colors ${field.uppercase ? 'uppercase' : ''}`}
                                                    title={field.val ? "Klicka för att kopiera" : ""}
                                                >
                                                    <span className="truncate">{field.val || '-'}</span>
                                                    {copiedField === field.id ? (
                                                        <SafeIcon name="check" size={14} className="text-emerald-500 shrink-0" />
                                                    ) : (
                                                        field.val && <SafeIcon name="copy" size={12} className="opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                                
                                {isEditingVehicle && (
                                    <button 
                                        type="button" 
                                        onClick={() => {
                                            if (!formData.regnr) { alert("Skriv in ett regnr först!"); return; }
                                            if (window.osSearchVehicle) window.osSearchVehicle(formData.regnr, 'START_OS_RADAR', true);
                                        }}
                                        className="w-full mt-4 py-2 border border-[#168a9c] text-[#168a9c] hover:bg-[#168a9c] hover:text-white rounded-xl text-[11px] font-bold uppercase tracking-wider transition-colors flex items-center justify-center gap-1.5 shadow-sm"
                                    >
                                        <SafeIcon name="refresh-cw" size={14} /> Hämta Fordonsdata
                                    </button>
                                )}
                            </div>

                            {/* KUNDKORT (Nu med rounded-xl) */}
                            <div className="bg-white border border-zinc-200 rounded-xl p-4 shadow-sm dark:bg-[#1e293b] dark:border-white/10">
                                <div className="flex items-start gap-3 mb-4">
                                    <div className="w-10 h-10 bg-zinc-500 rounded-full flex items-center justify-center text-white font-bold text-[14px] shrink-0">
                                        {formData.kundnamn ? formData.kundnamn.substring(0,2).toUpperCase() : '??'}
                                    </div>
                                    <div className="flex-1 min-w-0 flex flex-col">
                                        <input 
                                            type="text" 
                                            value={formData.kundnamn} 
                                            onChange={e => setFormData(p => ({ ...p, kundnamn: e.target.value.toUpperCase() }))} 
                                            placeholder="Kundens namn"
                                            className="w-full bg-transparent outline-none font-bold text-[14px] text-[#168a9c] hover:underline truncate" 
                                        />
                                        <span className="text-[13px] text-zinc-500 mt-0.5">Kund</span>
                                    </div>
                                </div>
                                <div className="space-y-2.5 text-[13px] pt-4 border-t border-zinc-100 dark:border-white/10">
                                    <div className="flex items-center gap-2 relative group cursor-pointer" onClick={() => { const el = document.getElementById('bokat-datum-input'); if(el && el.showPicker) el.showPicker(); }}>
                                        <span className="font-bold text-zinc-800 dark:text-zinc-200 min-w-[100px] shrink-0">Bokat datum:</span>
                                        <input 
                                            id="bokat-datum-input"
                                            type="date" 
                                            value={formData.datum} 
                                            onChange={e => setFormData(p => ({ ...p, datum: e.target.value }))} 
                                            className="w-full bg-transparent outline-none text-zinc-600 dark:text-zinc-400 cursor-pointer [&::-webkit-calendar-picker-indicator]:hidden" 
                                        />
                                        <SafeIcon name="calendar" size={16} className="text-zinc-400 absolute right-1 group-hover:text-[#168a9c] transition-colors pointer-events-none" />
                                    </div>
                                    <div className="flex items-center gap-2 relative group cursor-pointer" onClick={() => { const el = document.getElementById('bokat-tid-input'); if(el && el.showPicker) el.showPicker(); }}>
                                        <span className="font-bold text-zinc-800 dark:text-zinc-200 min-w-[100px] shrink-0">Tid:</span>
                                        <input 
                                            id="bokat-tid-input"
                                            type="time" 
                                            value={formData.tid} 
                                            onChange={e => setFormData(p => ({ ...p, tid: e.target.value }))} 
                                            className="w-full bg-transparent outline-none text-zinc-600 dark:text-zinc-400 cursor-pointer [&::-webkit-calendar-picker-indicator]:hidden" 
                                        />
                                        <SafeIcon name="clock" size={16} className="text-zinc-400 absolute right-1 group-hover:text-[#168a9c] transition-colors pointer-events-none" />
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* 3. ORDEROMFATTNING (Vänster kolumn på dator, block 3 på mobil under Fordon/Kund) */}
                        <div className="order-3 lg:col-start-1 w-full bg-white dark:bg-[#1e293b] border border-zinc-200 dark:border-white/10 rounded-xl shadow-sm overflow-hidden min-h-[350px]">
                            <div className="p-4 border-b border-zinc-200 dark:border-white/10 flex items-center gap-4 bg-zinc-50/50 dark:bg-black/10">
                                <button type="button" onClick={() => setActiveTab('ORDEROMFATTNING')} className={`font-bold text-[13px] uppercase tracking-wider pb-4 -mb-4 border-b-2 transition-colors ${activeTab === 'ORDEROMFATTNING' ? 'text-[#168a9c] border-[#168a9c]' : 'text-zinc-400 border-transparent hover:text-zinc-600'}`}>
                                    Orderomfattning
                                </button>
                                <button type="button" onClick={() => setActiveTab('KOSTNADSFÖRDELNING')} className={`font-bold text-[13px] uppercase tracking-wider pb-4 -mb-4 border-b-2 transition-colors ${activeTab === 'KOSTNADSFÖRDELNING' ? 'text-[#168a9c] border-[#168a9c]' : 'text-zinc-400 border-transparent hover:text-zinc-600'}`}>
                                    Kostnadsfördelning
                                </button>
                            </div>
                            
                            {activeTab === 'ORDEROMFATTNING' && (
                                <div className="animate-in fade-in duration-200">
                                    <div className="p-3 border-b border-zinc-200 dark:border-white/10 bg-zinc-50 dark:bg-white/5 flex flex-col sm:flex-row sm:items-center gap-3">
                                        <div className="flex items-center gap-2">
                                            <SafeIcon name="box" size={16} className="text-[#168a9c]" />
                                            <span className="text-[12px] font-bold text-zinc-500 uppercase tracking-widest">Paket</span>
                                        </div>
                                        <select value={formData.paket} onChange={e => handlePackageChange(e.target.value)} className="bg-transparent font-bold text-[13px] text-zinc-900 dark:text-white outline-none cursor-pointer">
                                            <option value="Standard">Standard (Flexibel)</option>
                                            <option value="Oljebyte">Oljebyte</option>
                                            <option value="Hjulskifte">Hjulskifte</option>
                                            <option value="Felsökning">Felsökning</option>
                                        </select>
                                    </div>

                                    <div className="p-2 border-b border-zinc-200 dark:border-white/10 flex flex-wrap gap-2 bg-zinc-50/50 dark:bg-black/20">
                                        <button 
                                            type="button" 
                                            onClick={() => {
                                                setExpenses([...expenses, { desc: '', amount: '', type: 'reservdel' }]);
                                                setTimeout(() => { if (window.lucide) window.lucide.createIcons(); }, 30);
                                            }} 
                                            className="px-3 py-1.5 bg-white dark:bg-[#141c2b] border border-zinc-200 dark:border-white/10 rounded text-[10px] font-bold text-zinc-600 dark:text-zinc-300 hover:text-[#168a9c] hover:border-[#168a9c] transition-colors shadow-xs"
                                        >
                                            LÄGG TILL
                                        </button>
                                        <button 
                                            type="button" 
                                            onClick={() => {
                                                const n = expenses.filter((_, idx) => !selectedExpenses.includes(idx));
                                                setExpenses(n);
                                                setSelectedExpenses([]);
                                            }} 
                                            disabled={selectedExpenses.length === 0}
                                            className={`px-3 py-1.5 bg-white dark:bg-[#141c2b] border border-zinc-200 dark:border-white/10 rounded text-[10px] font-bold transition-colors shadow-xs ${selectedExpenses.length > 0 ? 'text-zinc-600 dark:text-zinc-300 hover:text-red-500 hover:border-red-500' : 'text-zinc-300 dark:text-zinc-600 cursor-not-allowed opacity-70'}`}
                                        >
                                            RADERA
                                        </button>
                                    </div>
                                    
                                    {/* Responsiv tabell: Döljer "Antal" och minskar text/ytor på mobil */}
                                    <div className="overflow-x-auto pb-8 sm:pb-0">
                                        <table className="w-full text-left text-[13px]">
                                            <thead className="bg-zinc-50/50 dark:bg-black/20 border-b border-zinc-200 dark:border-white/10">
                                                <tr>
                                                    <th className="w-8 sm:w-10 p-1.5 sm:p-2 border-r border-zinc-200 dark:border-white/10 text-center">
                                                        <input 
                                                            type="checkbox" 
                                                            checked={expenses.length > 0 && selectedExpenses.length === expenses.length}
                                                            onChange={(e) => {
                                                                if (e.target.checked) setSelectedExpenses(expenses.map((_, idx) => idx));
                                                                else setSelectedExpenses([]);
                                                            }}
                                                            className="rounded-sm border-zinc-300 cursor-pointer accent-[#168a9c]" 
                                                        />
                                                    </th>
                                                    <th className="p-1.5 sm:p-2 border-r border-zinc-200 dark:border-white/10 font-bold text-zinc-700 dark:text-zinc-300">
                                                        <span className="sm:hidden">Artikel</span>
                                                        <span className="hidden sm:inline">Artikel / Arbetsoperation</span>
                                                    </th>
                                                    <th className="hidden sm:table-cell p-1.5 sm:p-2 border-r border-zinc-200 dark:border-white/10 font-bold text-zinc-700 dark:text-zinc-300 text-center w-[70px]">Antal</th>
                                                    <th className="p-1.5 sm:p-2 font-bold text-zinc-700 dark:text-zinc-300 w-[70px] sm:w-[110px] text-right">
                                                        <span className="sm:hidden">Pris</span>
                                                        <span className="hidden sm:inline">Bruttopris</span>
                                                    </th>
                                                    <th className="w-8 sm:w-10 p-1.5 sm:p-2 text-center"></th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-zinc-200/80 dark:divide-white/5">
                                                {expenses.map((ex, i) => (
                                                    <tr key={i} className={`group transition-colors ${selectedExpenses.includes(i) ? 'bg-[#168a9c]/5 dark:bg-[#168a9c]/10' : 'hover:bg-zinc-50 dark:hover:bg-white/5'}`}>
                                                        <td className="p-1.5 sm:p-2 border-r border-zinc-200 dark:border-white/10 text-center">
                                                            <input 
                                                                type="checkbox" 
                                                                checked={selectedExpenses.includes(i)}
                                                                onChange={() => setSelectedExpenses(prev => prev.includes(i) ? prev.filter(idx => idx !== i) : [...prev, i])}
                                                                className="rounded-sm border-zinc-300 cursor-pointer accent-[#168a9c]" 
                                                            />
                                                        </td>
                                                        <td className="p-1.5 sm:p-2 border-r border-zinc-200 dark:border-white/10">
                                                            <div className="flex items-center gap-1.5 sm:gap-2">
                                                                <button 
                                                                    type="button" 
                                                                    onClick={() => {
                                                                        const n = [...expenses];
                                                                        n[i].type = ex.type === 'arbetsoperation' ? 'reservdel' : 'arbetsoperation';
                                                                        setExpenses(n);
                                                                        setTimeout(() => { if (window.lucide) window.lucide.createIcons(); }, 30);
                                                                    }}
                                                                    className="shrink-0 p-1 hover:bg-zinc-200 dark:hover:bg-white/10 rounded transition-colors"
                                                                >
                                                                    <SafeIcon key={`icon-${ex.type}-${i}`} name={ex.type === 'arbetsoperation' ? 'wrench' : 'tag'} size={14} className="text-[#168a9c]" />
                                                                </button>
                                                                <input 
                                                                    placeholder={ex.type === 'arbetsoperation' ? "Arbetsoperation..." : "Reservdel..."}
                                                                    value={ex.desc} 
                                                                    onChange={e => { const n = [...expenses]; n[i].desc = e.target.value; setExpenses(n); }} 
                                                                    className="w-full bg-transparent outline-none text-[#168a9c] hover:underline cursor-text font-medium text-[12px] sm:text-[13px]" 
                                                                />
                                                            </div>
                                                        </td>
                                                        <td className="hidden sm:table-cell p-1.5 sm:p-2 border-r border-zinc-200 dark:border-white/10 text-center">
                                                            <input type="number" placeholder="1" className="w-full bg-transparent outline-none text-center text-[12px] sm:text-[13px]" />
                                                        </td>
                                                        <td className="p-1.5 sm:p-2">
                                                            <div className="flex items-center justify-end gap-1">
                                                                <input type="number" value={ex.amount} onChange={e => { const n = [...expenses]; n[i].amount = e.target.value; setExpenses(n); }} placeholder="0" className="w-full bg-transparent outline-none text-right font-mono font-medium min-w-0 text-[12px] sm:text-[13px]" />
                                                                <span className="text-zinc-400 text-[10px] sm:text-[11px]">kr</span>
                                                            </div>
                                                        </td>
                                                        <td className="p-1.5 sm:p-2 text-center relative">
                                                            <button 
                                                                type="button" 
                                                                onClick={() => { const n = expenses.filter((_, idx) => idx !== i); setExpenses(n); }} 
                                                                className="text-zinc-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity relative z-10 block mx-auto lg:opacity-100"
                                                            >
                                                                <SafeIcon name="trash-2" size={14}/>
                                                            </button>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            )}

                            {/* Smart Kostnadsfördelnings-vy */}
                            {activeTab === 'KOSTNADSFÖRDELNING' && (
                                <div className="p-6 animate-in fade-in duration-200 bg-zinc-50/30 dark:bg-black/10 h-full">
                                    <h3 className="text-[12px] font-bold uppercase tracking-widest text-zinc-500 mb-4 border-b border-zinc-200 dark:border-white/10 pb-2">Ekonomisk Översikt</h3>
                                    
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                                        <div className="bg-white dark:bg-[#1e293b] border border-zinc-200 dark:border-white/10 p-5 rounded-xl shadow-sm flex flex-col justify-center items-center text-center">
                                            <SafeIcon name="tag" size={24} className="text-[#168a9c] mb-2" />
                                            <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 mb-1">Reservdelar (Material)</span>
                                            <span className="text-xl font-bold text-zinc-900 dark:text-white">{materialCost.toLocaleString()} kr</span>
                                        </div>
                                        <div className="bg-white dark:bg-[#1e293b] border border-zinc-200 dark:border-white/10 p-5 rounded-xl shadow-sm flex flex-col justify-center items-center text-center">
                                            <SafeIcon name="wrench" size={24} className="text-[#168a9c] mb-2" />
                                            <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 mb-1">Arbetskostnad (Tjänst)</span>
                                            <span className="text-xl font-bold text-zinc-900 dark:text-white">{laborCost.toLocaleString()} kr</span>
                                        </div>
                                        <div className="bg-[#168a9c]/10 border border-[#168a9c]/30 p-5 rounded-xl shadow-sm flex flex-col justify-center items-center text-center relative overflow-hidden">
                                            <div className="absolute -right-4 -bottom-4 opacity-10 text-[#168a9c]"><SafeIcon name="dollar-sign" size={80} /></div>
                                            <SafeIcon name="dollar-sign" size={24} className="text-[#168a9c] mb-2 relative z-10" />
                                            <span className="text-[10px] font-bold uppercase tracking-widest text-[#168a9c] mb-1 relative z-10">Fastställt Totalpris</span>
                                            <span className="text-2xl font-black text-[#168a9c] relative z-10">{finalPriceNum.toLocaleString()} kr</span>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* 4. TOTALPRIS & INBETALNINGAR (Vänster kolumn på dator, block 4 på mobil) */}
                        <div className="order-4 lg:col-start-1 w-full bg-white dark:bg-[#1e293b] border border-zinc-200 dark:border-white/10 rounded-xl shadow-sm overflow-hidden flex flex-col md:flex-row">
                            <div className="flex-1 p-5 border-b md:border-b-0 md:border-r border-zinc-200 dark:border-white/10 flex flex-col justify-center">
                                <InputWrapper label="Totalpris (inkl. moms)" icon="dollar-sign">
                                    <div className="mt-1 flex items-baseline">
                                        <input type="number" value={formData.kundpris} onChange={e => setFormData(p => ({ ...p, kundpris: e.target.value }))} className="w-full bg-transparent text-zinc-900 dark:text-white text-4xl font-light tracking-tighter outline-none focus:text-[#168a9c] transition-colors" placeholder="0" />
                                        <span className="text-lg font-bold text-zinc-400 ml-2">SEK</span>
                                    </div>
                                </InputWrapper>
                                <div className="mt-4 pt-4 border-t border-zinc-200 dark:border-white/10 flex justify-between items-center text-[13px]">
                                    <span className="font-bold text-zinc-500">Inbetalt hittills:</span>
                                    <span className="font-mono font-bold text-orange-500">{totalPaid.toLocaleString()} kr</span>
                                </div>
                                {totalPaid > 0 && (
                                    <div className="mt-2 bg-orange-50 dark:bg-orange-500/10 p-2.5 rounded-lg flex justify-between items-center">
                                        <span className="text-[11px] text-orange-700 dark:text-orange-300 uppercase font-bold">Kvar att fakturera</span>
                                        <span className="font-black text-orange-600 text-[16px]">{Math.max(0, (parseFloat(formData.kundpris) || 0) - totalPaid).toLocaleString()} kr</span>
                                    </div>
                                )}
                            </div>
                            <div className="flex-1 p-5">
                                <div className="flex items-center justify-between mb-3">
                                    <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest flex items-center gap-1.5"><SafeIcon name="credit-card" size={12} />Delbetalningar</label>
                                    <button type="button" onClick={() => setPayments([...payments, { desc: '', amount: '' }])} className="text-[9px] font-bold text-[#168a9c] bg-[#168a9c]/10 uppercase px-2 py-1 rounded transition-colors flex items-center gap-1"><SafeIcon name="plus" size={10} /> Lägg till</button>
                                </div>
                                <div className="space-y-2">
                                    {payments.map((p, i) => (
                                        <div key={i} className="flex gap-2 items-center">
                                            <input placeholder="T.ex. Swish" value={p.desc} onChange={e => { const n = [...payments]; n[i].desc = e.target.value; setPayments(n); }} className="flex-1 bg-zinc-50 dark:bg-[#141c2b] border border-zinc-200 dark:border-white/10 py-2 px-3 text-[12px] font-medium outline-none rounded" />
                                            <div className="relative w-24 shrink-0 flex items-center">
                                                <input placeholder="0" type="number" value={p.amount} onChange={e => { const n = [...payments]; n[i].amount = e.target.value; setPayments(n); }} className="w-full bg-zinc-50 dark:bg-[#141c2b] border border-zinc-200 dark:border-white/10 py-2 pl-2 pr-6 text-[12px] font-mono font-bold text-orange-500 outline-none text-right rounded" />
                                                <span className="absolute right-2 text-[9px] text-orange-400 font-bold uppercase pointer-events-none">kr</span>
                                            </div>
                                            <button type="button" onClick={() => { const n = payments.filter((_, idx) => idx !== i); if(n.length===0) n.push({desc:'', amount:''}); setPayments(n); }} className="text-zinc-400 hover:text-red-500 p-1"><SafeIcon name="trash-2" size={14} /></button>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* 5. ARBETSANTECKNINGAR (Vänster kolumn på dator, block 5 nederst på mobil) */}
                        <div className="order-5 lg:col-start-1 w-full bg-white border border-zinc-200 rounded-xl shadow-sm overflow-hidden focus-within:border-[#168a9c] transition-colors">
                            <div className="p-4 border-b border-zinc-200 flex items-center gap-3 bg-zinc-50/50">
                                <SafeIcon name="terminal" size={16} className="text-[#168a9c]" />
                                <h2 className="text-[13px] font-bold text-zinc-800 uppercase tracking-widest">
                                    Arbetsanteckningar
                                </h2>
                            </div>
                            <RichNoteEditor value={formData.kommentar} onChange={(newHTML) => setFormData(p => ({ ...p, kommentar: newHTML }))} />
                        </div>

                        {/* 6. SPARA-KNAPPAR MOBIL (Visas bara på mobil, längst ner) */}
                        <div className="order-6 lg:hidden flex flex-col gap-2 w-full mt-2 mb-4">
                            <button type="submit" className="w-full px-6 py-3.5 bg-[#f97316] hover:bg-[#ea580c] text-white font-bold text-[14px] shadow-sm rounded-xl transition-colors flex items-center justify-center gap-2">
                                <SafeIcon name="save" size={18} /> SPARA JOBB
                            </button>
                            {activeJob && activeJob.status !== 'KLAR' && (
                                <button type="button" onClick={(e) => handleSave(e, 'KLAR')} className="w-full px-6 py-3.5 bg-zinc-100 border border-zinc-200 text-zinc-700 font-bold text-[14px] shadow-sm rounded-xl transition-colors flex items-center justify-center gap-2">
                                    <SafeIcon name="check" size={16} /> SNABBVAL: KLAR
                                </button>
                            )}
                        </div>

                    </form>
                </div>
            )}
        </div>
    );
};
