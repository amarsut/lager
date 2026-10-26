// newJob.js

const SafeIcon = ({ name, size = 14, className = "" }) => (
    <span className="inline-flex items-center justify-center shrink-0">
        <window.Icon name={name} size={size} className={className} />
    </span>
);

const FormRow = ({ children }) => <div className="grid grid-cols-1 md:grid-cols-2 gap-3 lg:gap-4 mb-3 lg:mb-4">{children}</div>;

const InputWrapper = ({ label, icon, children }) => (
    <div className="space-y-1.5 group">
        <label className="text-[10px] font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-widest flex items-center gap-2 ml-1 group-focus-within:text-[#f97316] transition-colors">
            {icon && <SafeIcon name={icon} size={12} className="text-zinc-400 dark:text-zinc-500 group-focus-within:text-[#f97316] transition-colors" />}
            {label}
        </label>
        {children}
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
        format('insertHTML', `<a href="${url}" target="_blank" style="color: #f97316; text-decoration: underline; font-weight: bold; cursor: pointer;">${text}</a>`);
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
        <div className="w-full flex flex-col transition-all bg-white dark:bg-[#1e293b]">
            <div className="flex flex-wrap items-center gap-1.5 p-2 border-b border-zinc-200 dark:border-white/10 bg-zinc-50/50 dark:bg-black/10">
                <button type="button" onMouseDown={keepFocus} onClick={() => format('bold')} className="p-1.5 text-zinc-600 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-white/10 rounded transition-colors" title="Fetstil"><SafeIcon name="bold" size={14} /></button>
                <button type="button" onMouseDown={keepFocus} onClick={() => format('italic')} className="p-1.5 text-zinc-600 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-white/10 rounded transition-colors" title="Kursiv"><SafeIcon name="italic" size={14} /></button>
                <button type="button" onMouseDown={keepFocus} onClick={() => format('insertUnorderedList')} className="p-1.5 text-zinc-600 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-white/10 rounded transition-colors" title="Punktlista"><SafeIcon name="list" size={14} /></button>
                <div className="w-px h-4 bg-zinc-300 dark:bg-white/10 mx-1"></div>
                <button type="button" onMouseDown={keepFocus} onClick={normalizeText} className="p-1.5 text-zinc-600 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-white/10 rounded transition-colors flex items-center gap-1" title="Rensa formatering">
                    <SafeIcon name="eraser" size={14} />
                </button>
                <div className="w-px h-4 bg-zinc-300 dark:bg-white/10 mx-1"></div>
                <button type="button" onMouseDown={keepFocus} onClick={insertLink} className="p-1.5 text-[#f97316] hover:bg-[#f97316]/10 rounded flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider" title="Infoga länk">
                    <SafeIcon name="link" size={12} /> Länk
                </button>
            </div>
            <div className="relative">
                {!hasContent && <div className="absolute top-3 left-4 text-zinc-400 font-medium text-[13px] pointer-events-none">Anteckningar, felsökningsprotokoll...</div>}
                <div
                    ref={editorRef}
                    contentEditable
                    onInput={handleInput} 
                    onPaste={handlePaste}
                    onBlur={(e) => onChange(e.currentTarget.innerHTML)} 
                    dangerouslySetInnerHTML={{ __html: value }}
                    className="p-3 min-h-[80px] max-h-[250px] overflow-y-auto text-[13px] leading-relaxed text-zinc-900 dark:text-white outline-none cursor-text [&_ul]:list-disc [&_ul]:pl-6 [&_ul]:my-1 [&_*]:!text-[13px] [&_*]:!leading-relaxed"
                    style={{ whiteSpace: 'pre-wrap' }}
                />
            </div>
        </div>
    );
};

window.NewJobView = ({ editingJob, setView, allJobs = [] }) => {
    const today = new Date().toISOString().split('T')[0];
    
    const [step, setStep] = React.useState(editingJob ? 'DETAIL' : 'SEARCH');
    const [activeTab, setActiveTab] = React.useState('ORDEROMFATTNING');

    const [searchQuery, setSearchQuery] = React.useState('');
    const [advFilters, setAdvFilters] = React.useState({
        status: 'ALLA',
        dateStart: '',
        dateEnd: ''
    });

    React.useEffect(() => {
        if (step === 'DETAIL') {
            window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
        }
        setTimeout(() => { if (window.lucide) window.lucide.createIcons(); }, 50);
    }, [step, activeTab, advFilters, searchQuery]);

    const [formData, setFormData] = React.useState({
        kundnamn: '', regnr: '', paket: 'Standard', status: 'BOKAD',
        datum: today, tid: '16:30', kundpris: '100', kommentar: ''
    });
    
    const emptyExpenses = [
        { desc: '', antal: '1', amount: '', type: 'arbetsoperation' }, 
        { desc: '', antal: '1', amount: '', type: 'reservdel' }
    ];
    const [expenses, setExpenses] = React.useState(emptyExpenses);
    const [selectedExpenses, setSelectedExpenses] = React.useState([]);
    
    const emptyPayments = [{ desc: '', amount: '' }];
    const [payments, setPayments] = React.useState(emptyPayments);
    
    const [fetchedCarInfo, setFetchedCarInfo] = React.useState(null);
    const [activeJob, setActiveJob] = React.useState(editingJob || null);
    const [isEditingVehicle, setIsEditingVehicle] = React.useState(false);
    const [copiedField, setCopiedField] = React.useState(null);
    const [expandedMatchIds, setExpandedMatchIds] = React.useState([]);

    const toggleExpandMatch = (id) => {
        setExpandedMatchIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
        setTimeout(() => { if (window.lucide) window.lucide.createIcons(); }, 30);
    };

    const matchingOrders = React.useMemo(() => {
        const isSearching = searchQuery.trim().length > 0 || advFilters.status !== 'ALLA' || advFilters.dateStart || advFilters.dateEnd;
        if (!isSearching) return [];

        let filtered = allJobs.filter(j => !j.deleted);

        if (advFilters.status !== 'ALLA') {
            filtered = filtered.filter(j => j.status === advFilters.status);
        }
        if (advFilters.dateStart) {
            filtered = filtered.filter(j => j.datum && j.datum.split('T')[0] >= advFilters.dateStart);
        }
        if (advFilters.dateEnd) {
            filtered = filtered.filter(j => j.datum && j.datum.split('T')[0] <= advFilters.dateEnd);
        }

        const query = searchQuery.trim().toLowerCase();
        if (query) {
            const terms = query.split(/\s+/);
            filtered = filtered.filter(j => {
                const expensesText = (j.utgifter || []).map(u => u.namn || '').join(' ');
                const cleanComment = (j.kommentar || '').replace(/<[^>]*>?/gm, '');
                const searchableString = [
                    j.kundnamn, j.regnr, j.vin, j.bilmodell, j.paket, j.status, cleanComment, expensesText
                ].filter(Boolean).join(' ').toLowerCase();
                
                return terms.every(t => searchableString.includes(t));
            });
        }

        return filtered.sort((a, b) => (b.datum || '').localeCompare(a.datum || '')).slice(0, 50);
    }, [advFilters, searchQuery, allJobs]);

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
    }, [formData.regnr, allJobs]);

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
                        desc: ex.namn || '', 
                        antal: ex.antal || '1',
                        amount: ex.kostnad || '',
                        type: ex.type || 'reservdel' 
                    }));
                    while (loadedExpenses.length < 2) loadedExpenses.push({ desc: '', antal: '1', amount: '', type: 'reservdel' });
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

    const handlePackageChange = (val) => setFormData(p => ({ ...p, paket: val }));
    const handleSpecChange = (key, value) => setFetchedCarInfo(prev => ({ ...prev, [key]: value }));

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

    const handleSave = async (e, overrideStatus = null) => {
        if (e) e.preventDefault();
        try {
            const finalRegnr = (formData.regnr || '').toUpperCase().trim();
            const finalExpenses = (expenses || []).filter(ex => ex && (ex.desc || ex.amount)).map(ex => ({ 
                namn: ex.desc || '', 
                antal: ex.antal || '1', 
                kostnad: ex.amount || '', 
                type: ex.type || 'reservdel'
            }));
            const finalPayments = (payments || []).filter(p => p && (p.desc || p.amount)).map(p => ({ desc: p.desc, amount: p.amount }));
            const totalPaidAmount = finalPayments.reduce((sum, item) => sum + (parseFloat(item.amount) || 0), 0);

            const resolvedBilmodell = fetchedCarInfo?.bilmodell || formData.bilmodell || '';
            const resolvedMotorkod = fetchedCarInfo?.motorkod || formData.motorkod || '';
            const resolvedMiltal = fetchedCarInfo?.miltal || formData.miltal || '';
            const resolvedArsmodell = fetchedCarInfo?.årsmodell || formData.årsmodell || '';
            const resolvedVin = fetchedCarInfo?.vin || formData.vin || '';
            const finalStatus = overrideStatus || formData.status || 'BOKAD';

            const cleanFormData = { ...formData };
            Object.keys(cleanFormData).forEach(key => { if (cleanFormData[key] === undefined) cleanFormData[key] = ''; });

            const data = { 
                ...cleanFormData, status: finalStatus, betaltBelopp: totalPaidAmount, delbetalningar: finalPayments, 
                regnr: finalRegnr, datum: formData.datum ? `${formData.datum}T${formData.tid || '16:30'}` : '', 
                bilmodell: resolvedBilmodell, motorkod: resolvedMotorkod, miltal: resolvedMiltal,
                årsmodell: resolvedArsmodell, vin: resolvedVin, utgifter: finalExpenses, deleted: false 
            };
            
            if (activeJob && activeJob.id) await window.db.collection("jobs").doc(activeJob.id).set(data, { merge: true });
            else await window.db.collection("jobs").add(data);

            if (typeof setView === 'function') setView('DASHBOARD');
        } catch (error) { 
            console.error("Fel vid sparande:", error);
            alert("Kunde inte spara: " + error.message); 
        }
    };

    const finalPriceNum = parseFloat(formData.kundpris) || 0;
    const totalPaid = payments.reduce((sum, item) => sum + (parseFloat(item.amount) || 0), 0);
    const materialCost = expenses.filter(ex => ex.type !== 'arbetsoperation').reduce((sum, item) => sum + (parseFloat(item.amount) || 0), 0);
    const laborCost = Math.max(0, finalPriceNum - materialCost);

    const vehicleCache = React.useMemo(() => {
        try { return JSON.parse(localStorage.getItem('os_vehicle_cache') || '{}'); } catch(e) { return {}; }
    }, []);

    const isFiltering = searchQuery || advFilters.status !== 'ALLA' || advFilters.dateStart || advFilters.dateEnd;

    return (
        <div className="flex flex-col text-zinc-900 dark:text-white pb-0 md:pb-10 transition-colors duration-500 relative max-w-[1400px] ml-0 w-full min-h-[calc(100vh-80px)]">
            
            {/* === STICKY HEADER === */}
            <div className="sticky top-[-16px] lg:top-[-32px] z-[100] pt-[28px] lg:pt-[32px] pb-4 px-4 lg:px-8 mb-4 flex flex-col sm:flex-row sm:items-center justify-between border-b border-zinc-200 dark:border-white/10 gap-4 bg-white/95 dark:bg-[#1e293b]/95 backdrop-blur-2xl shadow-sm -mt-4 lg:-mt-8 w-full lg:-mx-8 lg:w-[calc(100%+64px)]">
                <div className="flex items-center gap-4">
                    {step === 'DETAIL' ? (
                        <button onClick={() => setStep('SEARCH')} className="relative group shrink-0 active:scale-95 transition-all" title="Gå tillbaka till sök">
                            <div className="absolute inset-0 bg-orange-500/40 blur-xl rounded-full transition-all duration-700 group-hover:bg-orange-500/60" />
                            <div className="relative w-12 h-12 rounded-xl flex items-center justify-center text-white shadow-md border border-white/20 transition-colors bg-gradient-to-br from-orange-400 to-orange-600">
                                <SafeIcon name="arrow-left" size={24} />
                            </div>
                        </button>
                    ) : (
                        <div className="relative group cursor-default shrink-0">
                            <div className="absolute inset-0 bg-orange-500/40 blur-xl rounded-full transition-all duration-700" />
                            <div className="relative w-12 h-12 rounded-xl flex items-center justify-center text-white shadow-md border border-white/20 transition-colors bg-gradient-to-br from-orange-400 to-orange-600">
                                <SafeIcon name="search" size={24} />
                            </div>
                        </div>
                    )}
                    <div className="flex flex-col">
                        <h1 className="text-xl md:text-2xl font-black text-zinc-900 dark:text-white uppercase tracking-tight leading-none drop-shadow-sm dark:drop-shadow-none">
                            {step === 'SEARCH' ? 'SÖK FORDON' : (activeJob ? 'UPPDATERA' : 'NYTT')} <span className="text-zinc-400 dark:text-zinc-500 font-light">UPPDRAG</span>
                        </h1>
                        <p className="text-[9px] md:text-[10px] font-bold text-orange-500 uppercase tracking-widest mt-1 flex items-center gap-1.5">
                            <span className="w-1.5 h-1.5 rounded-full bg-orange-500 animate-pulse"></span>
                            {step === 'SEARCH' ? 'Filtrera och sök i orderhistoriken' : (activeJob ? `REDIGERAR ORDER • ${formData.regnr || activeJob.id.substring(0,6).toUpperCase()}` : 'SKAPAR NY ARBETSORDER')}
                        </p>
                    </div>
                </div>
            </div>

            {/* === SÖK VY === */}
            {step === 'SEARCH' && (
                <div className="w-full flex flex-col gap-2 px-4 lg:px-0 animate-in fade-in duration-300">
                    <div className="bg-white dark:bg-[#1e293b] border border-zinc-200 dark:border-white/10 rounded-xl p-4 shadow-sm">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-4">
                            <div className="flex flex-col sm:flex-row sm:items-center md:col-span-2">
                                <label className="text-[12px] font-bold text-zinc-700 dark:text-zinc-300 w-full sm:w-[160px] shrink-0 mb-1 sm:mb-0">Fritekstsökning</label>
                                <div className="relative w-full">
                                    <SafeIcon name="search" size={14} className="absolute left-0 bottom-2 text-zinc-400" />
                                    <input 
                                        type="text" 
                                        autoFocus={typeof window !== 'undefined' && window.innerWidth > 768}
                                        value={searchQuery} 
                                        onChange={e => setSearchQuery(e.target.value)} 
                                        placeholder="Sök på reg.nr, kundnamn, jobb, beskrivning..." 
                                        className="w-full bg-transparent border-b-2 border-zinc-200 dark:border-white/20 focus:border-[#f97316] pl-6 pr-8 py-1.5 text-[13px] outline-none text-zinc-900 dark:text-white transition-colors placeholder:text-zinc-400" 
                                    />
                                    {searchQuery && (
                                        <button onClick={() => setSearchQuery('')} className="absolute right-0 bottom-2 text-zinc-400 hover:text-[#f97316]">
                                            <SafeIcon name="x" size={14} />
                                        </button>
                                    )}
                                </div>
                            </div>
                            <div className="flex flex-col sm:flex-row sm:items-center">
                                <label className="text-[12px] font-bold text-zinc-700 dark:text-zinc-300 w-full sm:w-[160px] shrink-0 mb-1 sm:mb-0">Datum för kostnadsdokument</label>
                                <div className="flex items-center gap-2 w-full">
                                    <input type="date" value={advFilters.dateStart} onChange={e => setAdvFilters(p => ({...p, dateStart: e.target.value}))} className="w-full bg-transparent border-b-2 border-transparent border-b-zinc-200 dark:border-b-white/20 focus:border-b-[#f97316] px-2 py-1.5 text-[12px] uppercase outline-none text-zinc-900 dark:text-white transition-colors [&::-webkit-calendar-picker-indicator]:cursor-pointer" />
                                    <span className="text-zinc-400">-</span>
                                    <input type="date" value={advFilters.dateEnd} onChange={e => setAdvFilters(p => ({...p, dateEnd: e.target.value}))} className="w-full bg-transparent border-b-2 border-transparent border-b-zinc-200 dark:border-b-white/20 focus:border-b-[#f97316] px-2 py-1.5 text-[12px] uppercase outline-none text-zinc-900 dark:text-white transition-colors [&::-webkit-calendar-picker-indicator]:cursor-pointer" />
                                </div>
                            </div>
                            <div className="flex flex-col sm:flex-row sm:items-center">
                                <label className="text-[12px] font-bold text-zinc-700 dark:text-zinc-300 w-full sm:w-[160px] shrink-0 mb-1 sm:mb-0">Klusterstatus (Order)</label>
                                <select value={advFilters.status} onChange={e => setAdvFilters(p => ({...p, status: e.target.value}))} className="w-full bg-transparent border-b-2 border-transparent border-b-zinc-200 dark:border-b-white/20 focus:border-b-[#f97316] px-2 py-1.5 text-[12px] uppercase outline-none text-zinc-900 dark:text-white transition-colors cursor-pointer">
                                    <option value="ALLA">Visa Alla</option>
                                    <option value="BOKAD">Bokad (Ny)</option>
                                    <option value="OFFERERAD">Offererad</option>
                                    <option value="KLAR">Stängd (Klar)</option>
                                    <option value="FAKTURERAS">Faktureras</option>
                                </select>
                            </div>
                        </div>
                        
                        <div className="mt-4 pt-4 border-t border-zinc-100 dark:border-white/5 flex flex-wrap items-center justify-between gap-3">
                            <button onClick={() => { setAdvFilters({status: 'ALLA', dateStart: '', dateEnd: ''}); setSearchQuery(''); }} className="px-6 py-2 bg-transparent border border-zinc-300 dark:border-zinc-600 text-zinc-600 dark:text-zinc-300 text-[11px] font-bold uppercase tracking-wider rounded-sm hover:bg-zinc-100 dark:hover:bg-white/5 transition-colors shadow-sm">
                                ÅTERSTÄLL
                            </button>
                            <button 
                                onClick={() => {
                                    const q = searchQuery.toUpperCase().trim();
                                    if (q.length <= 6 && !q.includes(' ')) setFormData(p => ({ ...p, regnr: q }));
                                    else setFormData(p => ({ ...p, kundnamn: q }));
                                    setStep('DETAIL');
                                }}
                                className="px-5 py-2 bg-[#f97316] hover:bg-[#ea580c] text-white text-[11px] font-bold uppercase tracking-wider rounded-sm transition-colors shadow-sm flex items-center gap-2"
                            >
                                <SafeIcon name="plus" size={14} /> SKAPA NYTT JOBB
                            </button>
                        </div>
                    </div>

                    {matchingOrders.length > 0 ? (
                        <div className="w-full animate-in fade-in duration-300 mt-2">
                                {/* MOBILVY FÖR TABELLEN (Visas bara på små skärmar) */}
                                <div className="block lg:hidden space-y-2.5">
                                    {matchingOrders.map(job => {
                                        let formattedModel = job.bilmodell ? job.bilmodell.toUpperCase() : 'OKÄND MODELL';
                                        formattedModel = formattedModel.replace(/VOLKSWAGEN/i, 'VW').replace(/MERCEDES-BENZ/i, 'MB').replace(/MERCEDES/i, 'MB').replace(/LAND ROVER/i, 'LR');
                                        const brandId = (typeof window !== 'undefined' && window.getVehicleBrand) ? window.getVehicleBrand(job.bilmodell) : null;
                                        
                                        const cleanComment = job.kommentar ? String(job.kommentar).replace(/<[^>]*>?/gm, '').replace(/&amp;/g, '&').trim() : '';
                                        
                                        const cleanReg = (job.regnr || '').toUpperCase().replace(/\s+/g, '');
                                        const chnr = job.vin || (vehicleCache && vehicleCache[cleanReg]?.vin) || '-';
                                        
                                        const displayStatus = (job.status || 'BOKAD').toUpperCase();
                                        
                                        return (
                                            <div key={job.id} onClick={() => handleOpenExistingOrder(job)} className="bg-white dark:bg-[#1e293b] border border-zinc-200 dark:border-white/10 shadow-sm rounded-2xl p-3 cursor-pointer hover:border-[#168a9c] transition-colors">
                                                <div className="flex items-center mb-2">
                                                    <div className="flex items-center gap-2.5 truncate">
                                                        <div className="w-8 h-8 bg-[#6b7280] rounded-xl flex items-center justify-center shrink-0 overflow-hidden relative">
                                                        {brandId ? (
                                                            <>
                                                                <img src={`https://cdn.simpleicons.org/${brandId === 'mercedes' ? 'mercedesbenz' : brandId}/white`} className="w-5 h-5 object-contain" alt="logo" onError={(e) => { e.currentTarget.style.display = 'none'; const f = e.currentTarget.parentElement.querySelector('.fallback-car'); if(f) f.style.display = 'flex'; }} />
                                                                <div className="fallback-car hidden items-center justify-center absolute inset-0"><SafeIcon name="car" size={16} className="text-white" /></div>
                                                            </>
                                                        ) : ( <SafeIcon name="car" size={16} className="text-white" /> )}
                                                        </div>
                                                        <span className="text-[#168a9c] font-medium text-[15px] uppercase underline underline-offset-2 truncate">{formattedModel}</span>
                                                    </div>
                                                </div>
                                                <div className="flex flex-col gap-0.5 text-[13px] text-zinc-800 dark:text-zinc-200">
                                                    <div className="flex items-center"><span className="font-bold w-[70px] shrink-0 text-zinc-900 dark:text-white">Reg.Nr.:</span> <span className="uppercase">{job.regnr || '-'}</span></div>
                                                    <div className="flex items-center"><span className="font-bold w-[70px] shrink-0 text-zinc-900 dark:text-white">Ch.nr:</span> <span className="uppercase truncate">{chnr}</span></div>
                                                    <div className="flex items-center"><span className="font-bold w-[70px] shrink-0 text-zinc-900 dark:text-white">Kund:</span> <span className="capitalize truncate">{job.kundnamn || '-'}</span></div>
                                                    <div className="flex items-center"><span className="font-bold w-[70px] shrink-0 text-zinc-900 dark:text-white">Datum:</span> <span>{job.datum ? job.datum.split('T')[0] : '-'}</span></div>
                                                    <div className="flex items-center">
                                                        <span className="font-bold w-[70px] shrink-0 text-zinc-900 dark:text-white">Status:</span> 
                                                        <span className={`uppercase font-medium ${
                                                            displayStatus === 'KLAR' ? 'text-[#00b074] dark:text-emerald-400' :
                                                            displayStatus === 'BOKAD' ? 'text-orange-600 dark:text-orange-400' :
                                                            displayStatus === 'OFFERERAD' ? 'text-blue-600 dark:text-blue-400' :
                                                            displayStatus === 'FAKTURERAS' ? 'text-[#0096c7] dark:text-sky-400' :
                                                            'text-zinc-700 dark:text-zinc-300'
                                                        }`}>
                                                            {displayStatus}
                                                        </span>
                                                    </div>
                                                    <div className="pt-1.5 mt-1 border-t border-zinc-100 dark:border-white/5">
                                                        <div className="font-bold text-zinc-900 dark:text-white flex items-center gap-1.5">
                                                            <SafeIcon name="wrench" size={12} className="text-[#168a9c]"/>
                                                            {job.paket === 'Oljebyte' && job.oljevolym ? `Oljebyte ${job.oljevolym}l` : (job.paket || 'Standard')}
                                                        </div>
                                                        {cleanComment && <div className="text-[11px] italic line-clamp-2 leading-tight mt-0.5 pr-2">{cleanComment}</div>}
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>

                                {/* DATORVY FÖR TABELLEN (Visas bara på stora skärmar) */}
                                <div className="hidden lg:block overflow-x-auto bg-white dark:bg-[#1e293b] border border-zinc-300 dark:border-white/10 shadow-sm rounded-xl">
                                    <table className="w-full text-left border-collapse min-w-[1200px]">
                                        <thead className="bg-[#f4f5f7] dark:bg-[#161f30] text-zinc-800 dark:text-zinc-200 text-[12px] font-bold border-b border-zinc-300 dark:border-white/15 select-none">
                                            <tr className="divide-x divide-zinc-300 dark:divide-white/15">
                                                <th className="w-12 pl-3 py-3 text-center"></th>
                                                <th className="px-3.5 py-3">Uppdrag</th>
                                                <th className="px-3.5 py-3">Kund</th>
                                                <th className="px-3.5 py-3">Reg.nr</th>
                                                <th className="px-3.5 py-3">Mottagandedatum</th>
                                                <th className="px-3.5 py-3">Status</th>
                                                <th className="px-3.5 py-3">Chnr.</th>
                                                <th className="px-3.5 py-3">Märke</th>
                                                <th className="px-3.5 py-3">Modellbeteckning</th>
                                                <th className="px-3.5 py-3 text-right">Pris</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-zinc-200/80 dark:divide-white/5 bg-white dark:bg-transparent">
                                            {matchingOrders.map((job) => {
                                                const isExpanded = expandedMatchIds.includes(job.id);
                                                const formattedDate = job.datum ? job.datum.replace('T', ' ').substring(0, 16) : '';
                                                const serviceTitle = job.paket === 'Oljebyte' && job.oljevolym ? `Oljebyte ${job.oljevolym}l` : (job.paket || 'Standard');
                                                const cleanComment = job.kommentar ? String(job.kommentar).replace(/<[^>]*>?/gm, '').replace(/&amp;/g, '&').trim() : '';
                                                
                                                let rawModel = job.bilmodell || '';
                                                let brandId = (typeof window !== 'undefined' && window.getVehicleBrand) ? window.getVehicleBrand(rawModel) : null;
                                                let displayBrand = '-';
                                                let cleanModel = rawModel.toUpperCase();
                                                if (brandId) {
                                                    displayBrand = brandId === 'volkswagen' ? 'VW' : brandId === 'mercedesbenz' ? 'MB' : brandId.toUpperCase();
                                                    if (cleanModel.startsWith(displayBrand)) {
                                                        cleanModel = cleanModel.substring(displayBrand.length).trim();
                                                    } else if (brandId === 'volkswagen' && cleanModel.startsWith('VOLKSWAGEN')) {
                                                        cleanModel = cleanModel.substring(10).trim();
                                                    }
                                                }

                                                const cleanReg = (job.regnr || '').toUpperCase().replace(/\s+/g, '');
                                                const chnr = job.vin || (vehicleCache && vehicleCache[cleanReg]?.vin) || (vehicleCache && vehicleCache[(job.regnr || '').toUpperCase()]?.vin) || '-';
                                                const displayStatus = (job.status || 'BOKAD').toUpperCase();

                                                return (
                                                    <React.Fragment key={job.id}>
                                                        <tr onClick={() => toggleExpandMatch(job.id)} className={`group transition-colors duration-100 cursor-pointer text-[13px] border-b border-zinc-200/80 dark:border-white/5 hover:bg-zinc-100/70 dark:hover:bg-white/5 ${isExpanded ? 'bg-orange-50/30 dark:bg-white/[0.04]' : 'bg-white dark:bg-[#1e293b]'}`}>
                                                            <td className="w-12 pl-3 py-3 text-center text-zinc-500 align-middle">
                                                                <div className="inline-flex items-center justify-center">
                                                                    <SafeIcon name={isExpanded ? "chevron-down" : "chevron-right"} size={15} className={isExpanded ? "text-orange-500" : ""} />
                                                                </div>
                                                            </td>
                                                            <td className="px-3.5 py-3 max-w-[230px] truncate text-zinc-800 dark:text-zinc-200 align-middle">
                                                                <div className="flex items-center gap-2 truncate">
                                                                    <SafeIcon name="wrench" size={13} className="text-teal-600 dark:text-teal-400 shrink-0" />
                                                                    <span className="font-medium text-zinc-900 dark:text-white">{serviceTitle}</span>
                                                                    {cleanComment && !isExpanded && (
                                                                        <span className="text-zinc-400 dark:text-zinc-500 text-[12px] truncate ml-1">
                                                                            – {cleanComment}
                                                                        </span>
                                                                    )}
                                                                </div>
                                                            </td>
                                                            <td className="px-3.5 py-3 text-zinc-800 dark:text-zinc-200 uppercase max-w-[170px] truncate align-middle">
                                                                {job.kundnamn || ''}
                                                            </td>
                                                            <td className="px-3.5 py-3 text-zinc-800 dark:text-zinc-200 hover:text-orange-500 dark:hover:text-orange-400 font-medium whitespace-nowrap align-middle">
                                                                {job.regnr || '-'}
                                                            </td>
                                                            <td className="px-3.5 py-3 text-zinc-800 dark:text-zinc-200 whitespace-nowrap align-middle">
                                                                {formattedDate}
                                                            </td>
                                                            <td className="px-3.5 py-3 whitespace-nowrap text-[13px] align-middle">
                                                                <span className={`font-medium uppercase tracking-wide ${
                                                                    displayStatus === 'KLAR' ? 'text-[#00b074] dark:text-emerald-400' :
                                                                    displayStatus === 'BOKAD' ? 'text-orange-600 dark:text-orange-400' :
                                                                    displayStatus === 'OFFERERAD' ? 'text-blue-600 dark:text-blue-400' :
                                                                    displayStatus === 'FAKTURERAS' ? 'text-[#0096c7] dark:text-sky-400 decoration-[#0096c7]/50 underline-offset-2' :
                                                                    'text-zinc-700 dark:text-zinc-300'
                                                                }`}>
                                                                    {displayStatus}
                                                                </span>
                                                            </td>
                                                            <td className="px-3.5 py-3 text-[13px] text-zinc-700 dark:text-zinc-300 truncate max-w-[150px] align-middle" title={chnr}>
                                                                {chnr}
                                                            </td>
                                                            <td className="px-3.5 py-3 text-[13px] text-zinc-700 dark:text-zinc-300 truncate max-w-[95px] align-middle">
                                                                {displayBrand}
                                                            </td>
                                                            <td className="px-3.5 py-3 text-[13px] text-zinc-700 dark:text-zinc-300 truncate max-w-[170px] align-middle" title={cleanModel}>
                                                                {cleanModel || '-'}
                                                            </td>
                                                            <td className="px-3.5 py-3 text-right text-zinc-800 dark:text-zinc-200 whitespace-nowrap align-middle">
                                                                {job.kundpris ? `${parseInt(job.kundpris).toLocaleString('sv-SE')} kr` : '0 kr'}
                                                            </td>
                                                        </tr>
                                                        {isExpanded && (
                                                            <tr className="bg-zinc-50/70 dark:bg-black/25 border-b border-zinc-200/80 dark:border-white/10 animate-in fade-in duration-150">
                                                                <td></td>
                                                                <td colSpan="9" className="px-3.5 pb-4 pt-2">
                                                                    <div className="flex flex-wrap items-center gap-2 mb-3">
                                                                        <button type="button" onClick={(e) => { e.stopPropagation(); handleOpenExistingOrder(job); }} className="px-3 py-1 rounded border border-orange-500/60 text-orange-600 dark:text-orange-400 hover:bg-orange-500 hover:text-white text-[11px] font-bold uppercase tracking-wider transition-colors">Öppna order</button>
                                                                        <button type="button" onClick={async (e) => { e.stopPropagation(); await window.db.collection("jobs").doc(job.id).update({ status: 'KLAR' }); }} className="px-3 py-1 rounded border border-emerald-500/50 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500 hover:text-white text-[11px] font-bold uppercase tracking-wider transition-colors">Markera klar</button>
                                                                        <button type="button" onClick={(e) => { e.stopPropagation(); if (confirm("Radera ordern?")) window.db.collection("jobs").doc(job.id).update({ deleted: true }); }} className="ml-auto px-2.5 py-1 rounded border border-red-300 dark:border-red-500/30 text-red-500 hover:bg-red-500 hover:text-white text-[10px] font-bold uppercase tracking-wider transition-colors">Radera</button>
                                                                    </div>
                                                                    <div className="pl-1 space-y-1.5 text-[12px] text-zinc-700 dark:text-zinc-300">
                                                                        <div className="flex items-center gap-1.5 font-semibold text-zinc-900 dark:text-white">
                                                                            <SafeIcon name="chevron-down" size={13} className="text-zinc-400" />
                                                                            <SafeIcon name="box" size={13} className="text-[#f97316]" />
                                                                            <span>{serviceTitle}</span>
                                                                        </div>
                                                                        {cleanComment && (
                                                                            <div className="pl-6 flex items-start gap-2 text-zinc-600 dark:text-zinc-300 max-w-3xl">
                                                                                <SafeIcon name="wrench" size={12} className="text-[#f97316] mt-1 shrink-0" />
                                                                                <span className="whitespace-pre-wrap leading-relaxed">{cleanComment}</span>
                                                                            </div>
                                                                        )}
                                                                        {job.utgifter && job.utgifter.filter(u => u.namn || u.kostnad).map((u, idx) => (
                                                                            <div key={idx} className="pl-6 flex items-center gap-2 text-zinc-500 dark:text-zinc-400">
                                                                                <SafeIcon name={u.type === 'arbetsoperation' ? 'wrench' : 'tag'} size={11} className="text-[#f97316] shrink-0" />
                                                                                <span>{u.antal && u.antal !== '1' ? `${u.antal}x ` : ''}{u.namn || 'Ospecificerad artikel'} {u.kostnad ? ` (${u.kostnad} kr)` : ''}</span>
                                                                            </div>
                                                                        ))}
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
                        </div>
                    ) : (
                        isFiltering ? ( <div className="w-full text-center text-zinc-500 py-10 text-[13px] bg-white border border-zinc-200 mt-2 rounded-xl">Inga fordon hittades för dina valda filter.</div> ) : null
                    )}
                </div>
            )}

            {/* === DETALJ VY (Blanketten) === */}
            {step === 'DETAIL' && (
                <div className="px-4 lg:px-0 pb-0 lg:pb-6">
                    <form onSubmit={handleSave} className="flex flex-col lg:flex-row gap-3 lg:gap-8 relative lg:items-stretch mt-0 lg:mt-4">
                        
                        {/* === VÄNSTER KOLUMN === */}
                        <div className="flex-1 flex flex-col min-w-0 order-2 lg:order-1">
                            
                            {/* 1. Uppdragsstatus */}
                            <div className="w-full flex items-center gap-4 mb-6">
                                <InputWrapper label="Uppdragsstatus" icon="">
                                    <select value={formData.status} onChange={e => setFormData(p => ({ ...p, status: e.target.value }))} className="bg-white dark:bg-[#1e293b] border border-zinc-200 dark:border-white/10 text-[13px] font-bold p-2.5 rounded-sm outline-none focus:border-[#168a9c] shadow-sm w-[150px]">
                                        <option value="BOKAD">BOKAD</option>
                                        <option value="OFFERERAD">OFFERERAD</option>
                                        <option value="KLAR">KLAR</option>
                                        <option value="FAKTURERAS">FAKTURERAS</option>
                                    </select>
                                </InputWrapper>
                            </div>

                            {/* 2. Orderinformation */}
                            <div className="w-full mb-8">
                                <h2 className="text-[22px] font-normal text-zinc-800 dark:text-white mb-3">Orderinformation</h2>
                                
                                {/* Flikarna ligger nu fritt utan en yttre box, enbart en bottenlinje */}
                                <div className="flex items-center gap-6 border-b border-zinc-200 dark:border-white/10 mb-4">
                                    <button type="button" onClick={() => setActiveTab('ORDEROMFATTNING')} className={`text-[14px] pb-2 -mb-px border-b-2 transition-colors ${activeTab === 'ORDEROMFATTNING' ? 'text-[#168a9c] border-[#168a9c] font-medium' : 'text-zinc-500 dark:text-zinc-400 border-transparent hover:text-zinc-700'}`}>Orderomfattning</button>
                                    <button type="button" onClick={() => setActiveTab('KOSTNADSFÖRDELNING')} className={`text-[14px] pb-2 -mb-px border-b-2 transition-colors ${activeTab === 'KOSTNADSFÖRDELNING' ? 'text-[#168a9c] border-[#168a9c] font-medium' : 'text-zinc-500 dark:text-zinc-400 border-transparent hover:text-zinc-700'}`}>Kostnadsfördelning</button>
                                </div>
                                
                                {activeTab === 'ORDEROMFATTNING' && (
                                    <div className="animate-in fade-in duration-200">
                                        {/* Verktygsrad (Knapparna fristående precis som på Bild 1) */}
                                        <div className="flex flex-wrap items-center gap-2 mb-3">
                                            <button type="button" onClick={() => { setExpenses([...expenses, { desc: '', antal: '1', amount: '', type: 'reservdel' }]); setTimeout(() => { if (window.lucide) window.lucide.createIcons(); }, 30); }} className="px-3 py-1.5 bg-transparent border border-[#168a9c] text-[#168a9c] rounded-sm text-[11px] font-bold uppercase tracking-wider hover:bg-[#168a9c] hover:text-white transition-colors">
                                                LÄGG TILL
                                            </button>
                                            <button type="button" onClick={() => { const n = expenses.filter((_, idx) => !selectedExpenses.includes(idx)); setExpenses(n); setSelectedExpenses([]); }} disabled={selectedExpenses.length === 0} className={`px-3 py-1.5 bg-transparent border rounded-sm text-[11px] font-bold uppercase tracking-wider transition-colors ${selectedExpenses.length > 0 ? 'border-zinc-400 text-zinc-600 hover:border-red-500 hover:text-red-500' : 'border-zinc-200 text-zinc-400 cursor-not-allowed'}`}>
                                                TA BORT
                                            </button>
                                            
                                            <div className="ml-auto flex items-center gap-2 border border-[#168a9c] px-2 py-1 rounded-sm">
                                                <select value={formData.paket} onChange={e => handlePackageChange(e.target.value)} className="bg-transparent text-[11px] font-bold uppercase tracking-wider text-[#168a9c] outline-none cursor-pointer">
                                                    <option value="Standard">Standard (Flexibel)</option>
                                                    <option value="Oljebyte">Oljebyte</option>
                                                    <option value="Hjulskifte">Hjulskifte</option>
                                                    <option value="Felsökning">Felsökning</option>
                                                </select>
                                            </div>
                                        </div>
                                        
                                        {/* Själva tabellen (Har nu enbart kantlinje runt sig själv) */}
                                        <div className="border border-zinc-200 dark:border-white/10 rounded-sm overflow-hidden">
                                            <table className="w-full text-left text-[13px] text-zinc-800 dark:text-zinc-200">
                                                <thead className="bg-[#f8f9fa] dark:bg-[#161f30] border-b border-zinc-200 dark:border-white/10 text-[12px] font-medium text-zinc-600 dark:text-zinc-300">
                                                    <tr>
                                                        <th className="w-8 sm:w-10 py-2 text-center border-r border-zinc-200 dark:border-white/10">
                                                            <input type="checkbox" checked={expenses.length > 0 && selectedExpenses.length === expenses.length} onChange={(e) => { if (e.target.checked) setSelectedExpenses(expenses.map((_, idx) => idx)); else setSelectedExpenses([]); }} className="rounded-sm border-zinc-300 cursor-pointer focus:ring-0" />
                                                        </th>
                                                        <th className="px-2 sm:px-3 py-2 border-r border-zinc-200 dark:border-white/10">Artikel</th>
                                                        
                                                        {/* Döljs på mobilen (hidden sm:table-cell) */}
                                                        <th className="hidden sm:table-cell px-3 py-2 border-r border-zinc-200 dark:border-white/10 text-center w-[70px]">Antal</th>
                                                        
                                                        {/* Minskad yta på mobilen (w-[85px]) för att ge mer plats till artikel */}
                                                        <th className="px-2 sm:px-3 py-2 w-[85px] sm:w-[110px] text-right">Bruttopris</th>
                                                    </tr>
                                                </thead>
                                                <tbody className="divide-y divide-zinc-200 dark:divide-white/5 bg-white dark:bg-[#1e293b]">
                                                    {expenses.map((ex, i) => (
                                                        <tr key={i} className={`group transition-colors ${selectedExpenses.includes(i) ? 'bg-[#168a9c]/5' : 'hover:bg-zinc-50 dark:hover:bg-white/5'}`}>
                                                            <td className="p-1 sm:p-2 border-r border-zinc-200 dark:border-white/10 text-center">
                                                                <input type="checkbox" checked={selectedExpenses.includes(i)} onChange={() => setSelectedExpenses(prev => prev.includes(i) ? prev.filter(idx => idx !== i) : [...prev, i])} className="rounded-sm border-zinc-300 cursor-pointer focus:ring-0" />
                                                            </td>
                                                            <td className="p-1 sm:p-2 border-r border-zinc-200 dark:border-white/10">
                                                                <div className="flex items-center gap-1.5 sm:gap-2">
                                                                    <button type="button" onClick={() => { const n = [...expenses]; n[i] = { ...n[i], type: ex.type === 'arbetsoperation' ? 'reservdel' : 'arbetsoperation' }; setExpenses(n); setTimeout(() => { if (window.lucide) window.lucide.createIcons(); }, 30); }} className="shrink-0 p-1 hover:bg-zinc-200 dark:hover:bg-white/10 rounded transition-colors">
                                                                        <SafeIcon key={`icon-${ex.type}-${i}`} name={ex.type === 'arbetsoperation' ? 'wrench' : 'tag'} size={13} className="text-[#168a9c]" />
                                                                    </button>
                                                                    <input placeholder={ex.type === 'arbetsoperation' ? "Arbetsoperation..." : "Reservdel..."} value={ex.desc || ''} onChange={e => { const n = [...expenses]; n[i] = { ...n[i], desc: e.target.value }; setExpenses(n); }} className="w-full bg-transparent outline-none text-[#168a9c] hover:underline cursor-text text-[13px] py-0.5" />
                                                                </div>
                                                            </td>
                                                            
                                                            {/* Döljs på mobilen */}
                                                            <td className="hidden sm:table-cell p-1 sm:p-2 border-r border-zinc-200 dark:border-white/10 text-center">
                                                                <input type="number" value={ex.antal || ''} onChange={e => { const n = [...expenses]; n[i] = { ...n[i], antal: e.target.value }; setExpenses(n); }} placeholder="1" className="w-full bg-transparent outline-none text-center text-[13px]" />
                                                            </td>
                                                            
                                                            <td className="p-1 sm:p-2">
                                                                <div className="flex items-center justify-end gap-1 px-1">
                                                                    <input type="number" value={ex.amount || ''} onChange={e => { const n = [...expenses]; n[i] = { ...n[i], amount: e.target.value }; setExpenses(n); }} placeholder="0" className="w-full min-w-0 bg-transparent outline-none text-right font-mono text-[13px]" />
                                                                    <span className="text-zinc-400 text-[11px] shrink-0">kr</span>
                                                                </div>
                                                            </td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>
                                )}

                                {activeTab === 'KOSTNADSFÖRDELNING' && (
                                    <div className="animate-in fade-in duration-200">
                                        <div className="border border-zinc-200 dark:border-white/10 rounded-sm overflow-hidden bg-white dark:bg-[#1e293b]">
                                            <table className="w-full text-left text-[13px] text-zinc-800 dark:text-zinc-200">
                                                <tbody className="divide-y divide-zinc-200 dark:divide-white/5">
                                                    <tr>
                                                        <td className="px-4 py-3 border-r border-zinc-200 dark:border-white/10 w-[60%]">
                                                            <div className="flex items-center gap-2.5">
                                                                <SafeIcon name="tag" size={14} className="text-zinc-400 shrink-0" />
                                                                <span className="font-normal text-zinc-600 dark:text-zinc-300">Reservdelar (Material)</span>
                                                            </div>
                                                        </td>
                                                        <td className="px-4 py-3 text-right font-mono font-medium text-zinc-900 dark:text-white">
                                                            {materialCost.toLocaleString()} kr
                                                        </td>
                                                    </tr>
                                                    <tr>
                                                        <td className="px-4 py-3 border-r border-zinc-200 dark:border-white/10">
                                                            <div className="flex items-center gap-2.5">
                                                                <SafeIcon name="wrench" size={14} className="text-zinc-400 shrink-0" />
                                                                <span className="font-normal text-zinc-600 dark:text-zinc-300">Arbetskostnad (Tjänst)</span>
                                                            </div>
                                                        </td>
                                                        <td className="px-4 py-3 text-right font-mono font-medium text-zinc-900 dark:text-white">
                                                            {laborCost.toLocaleString()} kr
                                                        </td>
                                                    </tr>
                                                    <tr>
                                                        <td className="px-4 py-3 border-r border-zinc-200 dark:border-white/10">
                                                            <div className="flex items-center gap-2.5">
                                                                <SafeIcon name="dollar-sign" size={14} className="text-[#168a9c] shrink-0" />
                                                                <span className="font-bold text-zinc-900 dark:text-white">Fastställt Totalpris</span>
                                                            </div>
                                                        </td>
                                                        <td className="px-4 py-3 text-right font-mono font-bold text-zinc-900 dark:text-white text-[14px]">
                                                            {finalPriceNum.toLocaleString()} kr
                                                        </td>
                                                    </tr>
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* 3. Ekonomi */}
                            <div className="w-full mb-8">
                                <h2 className="text-[22px] font-normal text-zinc-800 dark:text-white mb-3">Kostnad</h2>
                                <div className="w-full border border-zinc-200 dark:border-white/10 rounded-sm flex flex-col md:flex-row overflow-hidden bg-white dark:bg-[#1e293b]">
                                    <div className="flex-1 border-b md:border-b-0 md:border-r border-zinc-200 dark:border-white/10 flex flex-col p-5 bg-zinc-50/50 dark:bg-transparent">
                                        <div className="font-medium text-[13px] text-zinc-500 mb-2 uppercase tracking-wider">Summa (inkl. moms)</div>
                                        <div className="flex items-baseline mb-4">
                                            <input type="number" value={formData.kundpris} onChange={e => setFormData(p => ({ ...p, kundpris: e.target.value }))} className="w-full bg-transparent text-zinc-900 dark:text-white text-4xl font-light tracking-tighter outline-none focus:text-[#168a9c] transition-colors" placeholder="0" />
                                            <span className="text-lg font-medium text-zinc-400 ml-2">SEK</span>
                                        </div>
                                        <div className="pt-4 border-t border-zinc-200 dark:border-white/10 flex justify-between items-center text-[13px] mt-auto">
                                            <span className="text-zinc-500">Inbetalt hittills:</span>
                                            <span className="font-mono font-medium text-emerald-600">{totalPaid.toLocaleString()} kr</span>
                                        </div>
                                        {totalPaid > 0 && (
                                            <div className="mt-2 bg-orange-50 dark:bg-white/5 px-3 py-2 rounded-sm border border-orange-100 dark:border-white/10 flex justify-between items-center">
                                                <span className="text-[12px] text-orange-800 dark:text-orange-300">Kvar att fakturera</span>
                                                <span className="font-bold text-orange-600 text-[14px]">{Math.max(0, (parseFloat(formData.kundpris) || 0) - totalPaid).toLocaleString()} kr</span>
                                            </div>
                                        )}
                                    </div>
                                    <div className="flex-1 p-5">
                                        <div className="flex items-center justify-between mb-4">
                                            <span className="font-medium text-[13px] text-zinc-500 uppercase tracking-wider">Delbetalningar</span>
                                            <button type="button" onClick={() => setPayments([...payments, { desc: '', amount: '' }])} className="text-[10px] font-bold text-[#168a9c] border border-[#168a9c] hover:bg-[#168a9c] hover:text-white transition-colors uppercase px-2 py-1 rounded-sm flex items-center gap-1"><SafeIcon name="plus" size={10} /> Lägg till</button>
                                        </div>
                                        <div className="space-y-2">
                                            {payments.map((p, i) => (
                                                <div key={i} className="flex gap-2 items-center">
                                                    <input placeholder="T.ex. Swish" value={p.desc} onChange={e => { const n = [...payments]; n[i].desc = e.target.value; setPayments(n); }} className="flex-1 bg-white dark:bg-[#141c2b] border border-zinc-200 dark:border-white/10 py-1.5 px-3 text-[13px] outline-none rounded-sm text-zinc-900 dark:text-white focus:border-[#168a9c]" />
                                                    <div className="relative w-24 shrink-0 flex items-center">
                                                        <input placeholder="0" type="number" value={p.amount} onChange={e => { const n = [...payments]; n[i].amount = e.target.value; setPayments(n); }} className="w-full bg-white dark:bg-[#141c2b] border border-zinc-200 dark:border-white/10 py-1.5 pl-2 pr-6 text-[13px] font-mono outline-none text-right rounded-sm focus:border-[#168a9c]" />
                                                        <span className="absolute right-2 text-[10px] text-zinc-400 font-medium uppercase pointer-events-none">kr</span>
                                                    </div>
                                                    <button type="button" onClick={() => { const n = payments.filter((_, idx) => idx !== i); if(n.length===0) n.push({desc:'', amount:''}); setPayments(n); }} className="text-zinc-400 hover:text-red-500 p-1"><SafeIcon name="trash-2" size={14} /></button>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* 4. Arbetsanteckningar */}
                            <div className="w-full mb-8">
                                <h2 className="text-[22px] font-normal text-zinc-800 dark:text-white mb-3">Anteckningar</h2>
                                <div className="w-full bg-white dark:bg-[#1e293b] border border-zinc-200 dark:border-white/10 rounded-sm overflow-hidden focus-within:border-[#168a9c] transition-colors">
                                    <RichNoteEditor value={formData.kommentar} onChange={(newHTML) => setFormData(p => ({ ...p, kommentar: newHTML }))} />
                                </div>
                            </div>

                            {/* Mobilknappar */}
                            <div className="lg:hidden flex flex-col gap-2 w-full mb-8">
                                <button type="submit" className="w-full px-6 py-3.5 bg-[#ea580c] hover:bg-[#c2410c] text-white font-bold text-[14px] shadow-sm rounded-sm transition-colors flex items-center justify-center gap-2">
                                    <SafeIcon name="save" size={18} /> SPARA JOBB
                                </button>
                                {formData.status !== 'KLAR' && (
                                    <button type="button" onClick={(e) => handleSave(e, 'KLAR')} className="w-full px-6 py-3.5 bg-zinc-100 dark:bg-white/5 border border-zinc-200 dark:border-white/10 text-zinc-700 dark:text-zinc-300 font-bold text-[14px] shadow-sm rounded-sm transition-colors flex items-center justify-center gap-2">
                                        <SafeIcon name="check" size={16} /> SNABBVAL: KLAR
                                    </button>
                                )}
                            </div>
                        </div>

                        {/* === HÖGER KOLUMN === */}
                        <div className="w-full lg:w-[320px] xl:w-[340px] shrink-0 order-1 lg:order-2">
                            <div className="sticky top-[75px] lg:top-[90px] flex flex-col gap-3 lg:gap-4 pb-0 lg:pb-10">
                                
                                <div className="hidden lg:flex flex-col gap-2">
                                    <button type="submit" className="w-full px-6 py-3 bg-[#ea580c] hover:bg-[#c2410c] text-white font-bold text-[13px] tracking-widest uppercase rounded-sm transition-colors flex items-center justify-center gap-2 shadow-sm">
                                        <SafeIcon name="save" size={16} /> SPARA JOBB
                                    </button>
                                    {activeJob && activeJob.status !== 'KLAR' && (
                                        <button type="button" onClick={(e) => handleSave(e, 'KLAR')} className="w-full px-6 py-2.5 bg-zinc-100 dark:bg-white/5 hover:bg-zinc-200 border border-zinc-200 dark:border-white/10 text-zinc-700 dark:text-zinc-300 font-bold text-[12px] uppercase tracking-widest shadow-sm rounded-sm transition-colors flex items-center justify-center gap-2">
                                            <SafeIcon name="check" size={14} /> SNABBVAL: KLAR
                                        </button>
                                    )}
                                </div>

                                {/* Fordonskortet */}
                                <div className="bg-white border border-zinc-200 rounded-sm shadow-sm dark:bg-[#1e293b] dark:border-white/10 overflow-hidden">
                                    {/* Övre sektion: Grå bakgrund med underlinje */}
                                    <div className="flex items-center gap-3 px-4 py-3 bg-zinc-50 dark:bg-[#161f30] border-b border-zinc-200 dark:border-white/10">
                                        <div className="w-10 h-10 bg-white dark:bg-white/5 rounded-xl flex items-center justify-center text-zinc-600 dark:text-zinc-300 shrink-0 overflow-hidden relative border border-zinc-200 dark:border-white/10 shadow-sm">
                                            {(() => {
                                                const currentModel = fetchedCarInfo?.bilmodell || formData.bilmodell || '';
                                                const brandId = (typeof window !== 'undefined' && window.getVehicleBrand) ? window.getVehicleBrand(currentModel) : null;
                                                return brandId ? (
                                                    <>
                                                        <img src={`https://cdn.simpleicons.org/${brandId === 'mercedes' ? 'mercedesbenz' : brandId}/3f3f46`} className="w-6 h-6 object-contain dark:invert opacity-90" alt="logo" onError={(e) => { e.currentTarget.style.display = 'none'; const f = e.currentTarget.parentElement.querySelector('.fallback-car'); if(f) f.style.display = 'flex'; }} />
                                                        <div className="fallback-car hidden items-center justify-center absolute inset-0"><SafeIcon name="car" size={20} className="text-zinc-500" /></div>
                                                    </>
                                                ) : ( <SafeIcon name="car" size={22} className="text-zinc-500" /> );
                                            })()}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            {isEditingVehicle ? (
                                                <input 
                                                    type="text" 
                                                    value={fetchedCarInfo?.bilmodell || formData.bilmodell || ''} 
                                                    onChange={(e) => handleSpecChange('bilmodell', e.target.value)}
                                                    onBlur={(e) => saveSpec('bilmodell', e.target.value)}
                                                    placeholder="Märke & Modell..."
                                                    className="w-full bg-white dark:bg-black/20 border border-zinc-200 dark:border-white/10 px-2 py-1 rounded outline-none font-bold text-[14px] text-zinc-900 dark:text-white truncate" 
                                                />
                                            ) : (
                                                <div className="font-bold text-[14px] text-zinc-900 dark:text-white truncate uppercase">
                                                    {(() => {
                                                        const raw = fetchedCarInfo?.bilmodell || formData.bilmodell || '';
                                                        return raw.replace(/VOLKSWAGEN/i, 'VW').replace(/MERCEDES-BENZ/i, 'MB').replace(/MERCEDES/i, 'MB').replace(/LAND ROVER/i, 'LR') || 'OKÄND MODELL';
                                                    })()}
                                                </div>
                                            )}
                                        </div>
                                        <button type="button" onClick={() => setIsEditingVehicle(!isEditingVehicle)} className={`p-1.5 rounded transition-colors shrink-0 ${isEditingVehicle ? 'bg-zinc-800 text-white' : 'text-zinc-500 hover:bg-zinc-200 dark:hover:bg-white/5'}`}>
                                            <SafeIcon name={isEditingVehicle ? "check" : "edit-2"} size={16} />
                                        </button>
                                    </div>
                                    
                                    {/* Nedre sektion: Vit bakgrund, ingen ruta i ruta */}
                                    <div className="flex flex-col py-2 bg-white dark:bg-[#1e293b]">
                                        {[
                                            { label: 'Reg.Nr.:', val: formData.regnr, id: 'regnr', uppercase: true, action: (v) => setFormData(p => ({...p, regnr: v.toUpperCase()})) },
                                            { label: 'Ch.nr:', val: fetchedCarInfo?.vin || '', id: 'vin', uppercase: true, action: (v) => handleSpecChange('vin', v.toUpperCase()), blur: (v) => saveSpec('vin', v) },
                                            { label: 'Motor:', val: fetchedCarInfo?.motorkod || '', id: 'motorkod', uppercase: true, action: (v) => handleSpecChange('motorkod', v), blur: (v) => saveSpec('motorkod', v) },
                                            { label: 'År:', val: fetchedCarInfo?.årsmodell || '', id: 'årsmodell', action: (v) => handleSpecChange('årsmodell', v), blur: (v) => saveSpec('årsmodell', v) },
                                            { label: 'Miltal:', val: fetchedCarInfo?.miltal || '', id: 'miltal', action: (v) => handleSpecChange('miltal', v), blur: (v) => saveSpec('miltal', v) },
                                            { label: 'Olje:', val: fetchedCarInfo?.oljevolym || '', id: 'oljevolym', action: (v) => handleSpecChange('oljevolym', v), blur: (v) => saveSpec('oljevolym', v) }
                                        ].map((field, idx) => (
                                            <div key={field.id} className={`flex items-center group min-h-[26px] px-4 text-[13px] transition-colors duration-300 ${copiedField === field.id ? 'bg-emerald-50 dark:bg-emerald-500/10' : (idx % 2 === 0 ? 'bg-white dark:bg-[#1e293b]' : 'bg-zinc-50/50 dark:bg-[#161f30]/50')}`}>
                                                <span className="font-bold text-zinc-900 dark:text-white w-[75px] shrink-0 text-[10px] uppercase tracking-wider">{field.label}</span>
                                                {isEditingVehicle ? (
                                                    <input 
                                                        value={field.val} 
                                                        onChange={e => field.action(e.target.value)}
                                                        onBlur={e => field.blur ? field.blur(e.target.value) : null}
                                                        className={`w-full bg-zinc-100 dark:bg-black/20 border border-zinc-200 dark:border-white/10 px-1.5 py-0.5 rounded-sm outline-none text-zinc-900 dark:text-white ${field.uppercase ? 'uppercase' : ''}`} 
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
                                                        className={`w-full bg-transparent cursor-pointer flex items-center justify-between transition-colors duration-300 ${copiedField === field.id ? 'text-emerald-600 dark:text-emerald-400 font-medium' : 'text-zinc-800 dark:text-zinc-200 hover:text-[#168a9c]'} ${field.uppercase ? 'uppercase' : ''}`}
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
                                        {isEditingVehicle && (
                                            <div className="px-4 pb-2 pt-3">
                                                <button 
                                                    type="button" 
                                                    onClick={() => {
                                                        if (!formData.regnr) { alert("Skriv in ett regnr först!"); return; }
                                                        if (window.osSearchVehicle) window.osSearchVehicle(formData.regnr, 'START_OS_RADAR', true);
                                                    }}
                                                    className="w-full py-1.5 border border-[#168a9c] text-[#168a9c] hover:bg-[#168a9c] hover:text-white rounded-sm text-[11px] font-bold uppercase tracking-wider transition-colors flex items-center justify-center gap-1.5 shadow-sm"
                                                >
                                                    <SafeIcon name="refresh-cw" size={14} /> Hämta Fordonsdata
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Kund- och Datumkortet */}
                                <div className="bg-white border border-zinc-200 rounded-sm shadow-sm dark:bg-[#1e293b] dark:border-white/10 overflow-hidden">
                                    {/* Övre sektion: Grå bakgrund med underlinje */}
                                    <div className="flex items-center gap-3 px-4 py-3 bg-zinc-50 dark:bg-[#161f30] border-b border-zinc-200 dark:border-white/10">
                                        <div className="w-10 h-10 bg-zinc-200 dark:bg-[#161f30] border border-zinc-300 dark:border-white/5 rounded-full flex items-center justify-center text-zinc-500 font-bold text-[14px] shrink-0 shadow-sm">
                                            {formData.kundnamn ? formData.kundnamn.substring(0,2).toUpperCase() : '??'}
                                        </div>
                                        <div className="flex-1 min-w-0 flex flex-col">
                                            <input 
                                                type="text" 
                                                value={formData.kundnamn} 
                                                onChange={e => setFormData(p => ({ ...p, kundnamn: e.target.value.toUpperCase() }))} 
                                                placeholder="Kundens namn"
                                                className="w-full bg-transparent outline-none font-bold text-[14px] text-[#168a9c] hover:underline underline-offset-2 truncate" 
                                            />
                                            <span className="text-[12px] text-zinc-500 mt-0.5">Kund</span>
                                        </div>
                                    </div>
                                    
                                    {/* Nedre sektion: Vit bakgrund, ingen ruta i ruta */}
                                    <div className="flex flex-col py-2 bg-white dark:bg-[#1e293b]">
                                        <div className="flex items-center min-h-[26px] px-4 bg-white dark:bg-[#1e293b] text-[13px] relative group cursor-pointer" onClick={() => { const el = document.getElementById('bokat-datum-input'); if(el && el.showPicker) el.showPicker(); }}>
                                            <span className="font-bold text-zinc-900 dark:text-white w-[75px] shrink-0 text-[10px] uppercase tracking-wider">Bokat:</span>
                                            <input 
                                                id="bokat-datum-input"
                                                type="date" 
                                                value={formData.datum} 
                                                onChange={e => setFormData(p => ({ ...p, datum: e.target.value }))} 
                                                className="w-full bg-transparent outline-none text-zinc-800 dark:text-zinc-200 cursor-pointer [&::-webkit-calendar-picker-indicator]:hidden" 
                                            />
                                            <SafeIcon name="calendar" size={14} className="text-zinc-400 absolute right-4 group-hover:text-zinc-700 transition-colors pointer-events-none" />
                                        </div>
                                        
                                        <div className="flex items-center min-h-[26px] px-4 bg-zinc-50/50 dark:bg-[#161f30]/50 text-[13px] relative group cursor-pointer" onClick={() => { const el = document.getElementById('bokat-tid-input'); if(el && el.showPicker) el.showPicker(); }}>
                                            <span className="font-bold text-zinc-900 dark:text-white w-[75px] shrink-0 text-[10px] uppercase tracking-wider">Tid:</span>
                                            <input 
                                                id="bokat-tid-input"
                                                type="time" 
                                                value={formData.tid} 
                                                onChange={e => setFormData(p => ({ ...p, tid: e.target.value }))} 
                                                className="w-full bg-transparent outline-none text-zinc-800 dark:text-zinc-200 cursor-pointer [&::-webkit-calendar-picker-indicator]:hidden" 
                                            />
                                            <SafeIcon name="clock" size={14} className="text-zinc-400 absolute right-4 group-hover:text-zinc-700 transition-colors pointer-events-none" />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                    </form>
                </div>
            )}
        </div>
    );
};
