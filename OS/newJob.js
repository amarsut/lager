// newJob.js

const SafeIcon = ({ name, size = 14, className = "" }) => (
    <span className="inline-flex items-center justify-center shrink-0">
        <window.Icon name={name} size={size} className={className} />
    </span>
);

const FormRow = ({ children }) => <div className="grid grid-cols-1 md:grid-cols-2 gap-3 lg:gap-4 mb-3 lg:mb-4">{children}</div>;

const InputWrapper = ({ label, icon, children }) => (
    <div className="space-y-1.5 group">
        <label className="text-[10px] font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-widest flex items-center gap-2 ml-1 group-focus-within:text-orange-500 dark:group-focus-within:text-orange-400 transition-colors">
            <SafeIcon name={icon} size={12} className="text-zinc-400 dark:text-zinc-500 group-focus-within:text-orange-500 dark:group-focus-within:text-orange-400 transition-colors" />
            {label}
        </label>
        {children}
    </div>
);

const SectionHeader = ({ title, sub, icon }) => (
    <div className="flex items-start gap-2.5 mb-4 lg:mb-5 pb-2.5 lg:pb-3 border-b border-zinc-200 dark:border-white/10">
        <div className="mt-1 h-4 w-1 bg-orange-500 rounded-full" />
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
        const linkHTML = `<a href="${url}" target="_blank" style="color: #f97316; text-decoration: underline; font-weight: bold; cursor: pointer;">${text}</a>`;
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
        if (link) window.open(link.href, '_blank');
    };

    const keepFocus = (e) => e.preventDefault(); 

    return (
        <div className="w-full bg-zinc-50 dark:bg-[#141c2b] focus-within:bg-white dark:focus-within:bg-[#182234] border border-zinc-300 dark:border-white/15 rounded-lg shadow-xs transition-all overflow-hidden flex flex-col focus-within:border-orange-500 focus-within:ring-1 focus-within:ring-orange-500/20">
            
            <div className="flex flex-wrap items-center gap-1.5 p-2 border-b border-zinc-200 dark:border-white/10 bg-[#f4f5f7] dark:bg-[#182234]">
                <button type="button" onMouseDown={keepFocus} onClick={() => format('bold')} className="p-1.5 text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white hover:bg-zinc-200 dark:hover:bg-white/10 rounded transition-colors" title="Fetstil"><SafeIcon name="bold" size={14} /></button>
                <button type="button" onMouseDown={keepFocus} onClick={() => format('italic')} className="p-1.5 text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white hover:bg-zinc-200 dark:hover:bg-white/10 rounded transition-colors" title="Kursiv"><SafeIcon name="italic" size={14} /></button>
                <button type="button" onMouseDown={keepFocus} onClick={() => format('insertUnorderedList')} className="p-1.5 text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white hover:bg-zinc-200 dark:hover:bg-white/10 rounded transition-colors" title="Punktlista"><SafeIcon name="list" size={14} /></button>
                
                <div className="w-px h-4 bg-zinc-300 dark:bg-white/10 mx-1"></div>
                
                <button type="button" onMouseDown={keepFocus} onClick={insertLink} className="p-1.5 text-orange-500 dark:text-orange-400 hover:bg-orange-50 dark:hover:bg-orange-500/10 rounded transition-colors flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider" title="Markera text och klicka för att infoga länk">
                    <SafeIcon name="link" size={12} /> Länk
                </button>
                
                <div className="hidden sm:block w-px h-4 bg-zinc-300 dark:bg-white/10 mx-1"></div>
                
                <button type="button" onMouseDown={keepFocus} onClick={insertTimestamp} className="p-1.5 text-orange-500 dark:text-orange-400 hover:bg-orange-50 dark:hover:bg-orange-500/10 rounded transition-colors flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider">
                    <SafeIcon name="clock" size={12} /> Logg
                </button>
                <button type="button" onMouseDown={keepFocus} onClick={insertTemplate} className="p-1.5 text-orange-500 dark:text-orange-400 hover:bg-orange-50 dark:hover:bg-orange-500/10 rounded transition-colors flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider">
                    <SafeIcon name="file-text" size={12} /> <span className="hidden sm:inline">Felsöknings</span>Mall
                </button>
            </div>

            <div className="relative">
                {!hasContent && (
                    <div className="absolute top-3 left-3 text-zinc-400/70 font-mono text-[12px] pointer-events-none">
                        Skriv dina anteckningar här...
                    </div>
                )}
                <div
                    ref={editorRef}
                    contentEditable
                    onClick={handleEditorClick}
                    onInput={handleInput} 
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
    // NYTT: Referens för att auto-scrolla ner till förslagen när tangentbordet är i vägen
    const suggestionsRef = React.useRef(null);
    const [formData, setFormData] = React.useState({
        kundnamn: '', regnr: '', paket: 'Standard', status: 'BOKAD',
        datum: today, tid: '16:30', kundpris: '100', kommentar: ''
    });
    
    const emptyExpenses = [{ desc: '', amount: '' }, { desc: '', amount: '' }, { desc: '', amount: '' }];
    const [expenses, setExpenses] = React.useState(emptyExpenses);
    
    const emptyPayments = [{ desc: '', amount: '' }];
    const [payments, setPayments] = React.useState(emptyPayments);
    
    const [suggestions, setSuggestions] = React.useState([]);
    const [regnrSuggestions, setRegnrSuggestions] = React.useState([]);
    const [oilLiters, setOilLiters] = React.useState(4.3);
    const [fetchedCarInfo, setFetchedCarInfo] = React.useState(null);

    const [activeJob, setActiveJob] = React.useState(editingJob || null);
    const [expandedMatchIds, setExpandedMatchIds] = React.useState([]);
    const [dismissedMatches, setDismissedMatches] = React.useState(false);

    React.useEffect(() => {
        setActiveJob(editingJob || null);
    }, [editingJob]);

    const matchingOrders = React.useMemo(() => {
        if (activeJob || dismissedMatches) return [];
        const cleanReg = String(formData.regnr || '').toUpperCase().replace(/\s+/g, '');
        const cleanName = String(formData.kundnamn || '').trim().toLowerCase();

        if (cleanReg.length < 2 && cleanName.length < 2) return [];

        return allJobs.filter(j => {
            if (j.deleted) return false;
            const jReg = String(j.regnr || '').toUpperCase().replace(/\s+/g, '');
            const jName = String(j.kundnamn || '').trim().toLowerCase();
            const regMatch = cleanReg.length >= 2 && jReg.includes(cleanReg);
            const nameMatch = cleanName.length >= 2 && jName.includes(cleanName);
            return regMatch || nameMatch;
        }).sort((a, b) => {
            const aActive = a.status !== 'KLAR' ? 1 : 0;
            const bActive = b.status !== 'KLAR' ? 1 : 0;
            if (aActive !== bActive) return bActive - aActive;
            return (b.datum || '').localeCompare(a.datum || '');
        }).slice(0, 6);
    }, [formData.regnr, formData.kundnamn, allJobs, activeJob, dismissedMatches]);

    React.useEffect(() => {
        if (matchingOrders.length > 0) {
            setExpandedMatchIds([matchingOrders[0].id]);
            // NYTT: Scrolla mjukt ner så att varningsrutan och tabellen syns ovanför tangentbordet
            setTimeout(() => {
                if (suggestionsRef.current) {
                    suggestionsRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
                }
            }, 250);
        } else {
            setExpandedMatchIds([]);
        }
        setTimeout(() => { if (window.lucide) window.lucide.createIcons(); }, 30);
    }, [matchingOrders.length, matchingOrders[0]?.id]);

    const toggleExpandMatch = (id) => {
        setExpandedMatchIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
        setTimeout(() => { if (window.lucide) window.lucide.createIcons(); }, 30);
    };

    const handleOpenExistingOrder = (job) => {
        setSuggestions([]);
        setRegnrSuggestions([]);
        setActiveJob(job);
    };

    const handleCreateLinkedOrder = (job) => {
        setFormData(p => ({
            ...p,
            kundnamn: job.kundnamn || p.kundnamn,
            regnr: job.regnr || p.regnr
        }));
        setSuggestions([]);
        setRegnrSuggestions([]);
        setDismissedMatches(true);
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

            if (specs.oil) {
                let oljaNum = parseFloat(String(specs.oil).replace(',', '.').replace(/[^0-9.]/g, ''));
                if (!isNaN(oljaNum) && oljaNum > 0) setOilLiters(oljaNum);
            }
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
                    let loadedExpenses = activeJob.utgifter.map(ex => ({ desc: ex.namn, amount: ex.kostnad }));
                    while (loadedExpenses.length < 3) loadedExpenses.push({ desc: '', amount: '' });
                    setExpenses(loadedExpenses);
                } else setExpenses(emptyExpenses);

                if (activeJob.delbetalningar && activeJob.delbetalningar.length > 0) setPayments(activeJob.delbetalningar);
                else if (activeJob.betaltBelopp > 0) setPayments([{ desc: 'Tidigare inbetalning', amount: activeJob.betaltBelopp }]);
                else setPayments(emptyPayments);
                
                setOilLiters(activeJob.oljevolym || 4.3);
                
                let specs = {};
                const cleanReg = String(activeJob.regnr || '').toUpperCase().replace(/\s+/g, '');
                try { const cache = JSON.parse(localStorage.getItem('os_vehicle_cache') || '{}'); if (cache[cleanReg]) specs = { ...cache[cleanReg] }; } catch(e) {}

                if (window.db && cleanReg) {
                    const doc = await window.db.collection('vehicleSpecs').doc(cleanReg).get();
                    if (doc.exists) specs = { ...specs, ...doc.data() };
                }

                if (activeJob.bilmodell || activeJob.motorkod || activeJob.miltal || Object.keys(specs).length > 0) {
                    setFetchedCarInfo({
                        bilmodell: specs.model || activeJob.bilmodell || "",
                        motorkod: specs.engine || activeJob.motorkod || "",
                        miltal: specs.mileage || activeJob.miltal || "", 
                        oljevolym: specs.oil ? String(specs.oil).replace(' l', '') : (activeJob.oljevolym ? String(activeJob.oljevolym).replace(' l', '') : ""),
                        oljetyp: specs.oil_type || activeJob.oljetyp || "",
                        årsmodell: specs.year || activeJob.årsmodell || "",
                        vin: specs.vin || activeJob.vin || "",
                        isNewData: false
                    });
                }
            } else {
                const prefill = window.prefillName || ''; window.prefillName = null;
                setFormData({ kundnamn: prefill, regnr: '', paket: 'Standard', status: 'BOKAD', datum: today, tid: '16:30', kundpris: '100', kommentar: '' });
                setExpenses(emptyExpenses); setPayments(emptyPayments); setOilLiters(4.3); setSuggestions([]); setRegnrSuggestions([]); setFetchedCarInfo(null);
            }
        };
        loadExistingJob();
    }, [activeJob, today]);

    const updateOilLogic = React.useCallback((liters) => {
        const l = parseFloat(liters) || 0;
        const customerPrice = (l * 200) + 200 + 500;
        setExpenses(prev => {
            const newExpenses = [{ desc: `Motorolja (${l}l á 65kr)`, amount: (l * 65).toString() }, { desc: 'Oljefilter', amount: '200' }, ...prev.slice(2).filter(e => e.desc || e.amount)];
            while (newExpenses.length < 3) newExpenses.push({ desc: '', amount: '' });
            return newExpenses;
        });
        setFormData(p => ({ ...p, kundpris: customerPrice.toString() }));
    }, []);

    const handleOilVolumeChange = (val) => { setOilLiters(val); updateOilLogic(val); };

    const handlePackageChange = (val) => {
        let price = "100"; let newExpenses = [...emptyExpenses];
        if (val === "Hjulskifte") price = "200";
        if (val === "Felsökning") price = "500";
        if (val === "Oljebyte") {
            const l = oilLiters; price = (l * 200 + 700).toString();
            newExpenses = [{ desc: `Motorolja (${l}l á 65kr)`, amount: (l * 65).toString() }, { desc: 'Oljefilter', amount: '200' }, { desc: '', amount: '' }];
        }
        setFormData(p => ({ ...p, paket: val, kundpris: price }));
        setExpenses(newExpenses);
    };

    const handleExpenseAmountChange = (index, newAmount) => {
        const diff = (parseFloat(newAmount) || 0) - (parseFloat(expenses[index].amount) || 0);
        const n = [...expenses]; n[index].amount = newAmount; setExpenses(n);
        setFormData(p => ({ ...p, kundpris: Math.max(0, (parseFloat(p.kundpris) || 0) + diff).toString() }));
    };

    const addExpenseRow = () => setExpenses([...expenses, { desc: '', amount: '' }]);
    
    const removeExpenseRow = (index) => {
        const amountToRemove = parseFloat(expenses[index].amount) || 0;
        const n = expenses.filter((_, i) => i !== index); while (n.length < 3) n.push({ desc: '', amount: '' }); setExpenses(n);
        setFormData(p => ({ ...p, kundpris: Math.max(0, (parseFloat(p.kundpris) || 0) - amountToRemove).toString() }));
    };

    const handleNameChange = (val) => {
        const upperVal = val.toUpperCase();
        setDismissedMatches(false);
        setFormData(p => ({ ...p, kundnamn: upperVal }));
        setSuggestions([]);
    };

    const relatedVehicles = React.useMemo(() => {
        if (!formData.kundnamn || formData.kundnamn.length < 2) return [];
        return [...new Set(allJobs.filter(j => j.kundnamn && j.kundnamn.toLowerCase() === formData.kundnamn.trim().toLowerCase()).map(j => j.regnr ? j.regnr.toUpperCase() : null).filter(r => r))];
    }, [formData.kundnamn, allJobs]);

    const handleRegnrChange = (val) => {
        const upperVal = val ? String(val).toUpperCase() : '';
        setDismissedMatches(false);
        setFormData(p => ({ ...p, regnr: upperVal }));
        if (!upperVal && relatedVehicles.length > 0) {
            setRegnrSuggestions(relatedVehicles);
        } else {
            setRegnrSuggestions([]);
        }
    };

    const handleSpecChange = (key, value) => setFetchedCarInfo(prev => ({ ...prev, [key]: value }));

    const saveSpec = async (key, value) => {
        const finalRegnr = formData.regnr?.toUpperCase().replace(/\s+/g, '');
        if (!finalRegnr || !window.db) return;
        const specUpdates = { updatedAt: new Date().toISOString() };
        if (key === 'årsmodell') specUpdates.year = value; if (key === 'motorkod') specUpdates.engine = value;
        if (key === 'oljevolym') specUpdates.oil = value; if (key === 'miltal') specUpdates.mileage = value; if (key === 'vin') specUpdates.vin = value;
        try { await window.db.collection("vehicleSpecs").doc(finalRegnr).set(specUpdates, { merge: true }); } catch(e) {}
    };

    const handleSave = async (e) => {
        e.preventDefault();
        try {
            const finalRegnr = formData.regnr.toUpperCase().trim();
            const finalExpenses = expenses.filter(ex => ex.desc && ex.amount).map(ex => ({ namn: ex.desc, kostnad: ex.amount }));
            const finalPayments = payments.filter(p => p.desc || p.amount).map(p => ({ desc: p.desc, amount: p.amount }));
            const totalPaidAmount = finalPayments.reduce((sum, item) => sum + (parseFloat(item.amount) || 0), 0);

            const resolvedBilmodell = fetchedCarInfo?.bilmodell || fetchedCarInfo?.model || formData.bilmodell || '';
            const resolvedMotorkod = fetchedCarInfo?.motorkod || fetchedCarInfo?.engine || formData.motorkod || '';
            const resolvedMiltal = fetchedCarInfo?.miltal || fetchedCarInfo?.mileage || formData.miltal || '';
            const resolvedArsmodell = fetchedCarInfo?.årsmodell || fetchedCarInfo?.arsmodell || fetchedCarInfo?.year || formData.årsmodell || '';
            const resolvedOljevolym = fetchedCarInfo?.oljevolym || fetchedCarInfo?.oil || oilLiters;

            const data = { 
                ...formData, betaltBelopp: totalPaidAmount, delbetalningar: finalPayments, regnr: finalRegnr, 
                datum: formData.datum ? `${formData.datum}T${formData.tid}` : '', 
                oljevolym: resolvedOljevolym, bilmodell: resolvedBilmodell, motorkod: resolvedMotorkod, miltal: resolvedMiltal,
                årsmodell: resolvedArsmodell, utgifter: finalExpenses, deleted: false 
            };
            
            if (activeJob && activeJob.id) await window.db.collection("jobs").doc(activeJob.id).set(data, { merge: true });
            else await window.db.collection("jobs").add(data);

            if (finalRegnr && fetchedCarInfo) {
                const specUpdates = {};
                if (resolvedMotorkod) specUpdates.engine = resolvedMotorkod;
                if (resolvedOljevolym) specUpdates.oil = String(resolvedOljevolym).includes('l') ? resolvedOljevolym : `${String(resolvedOljevolym).replace(/[^0-9.,]/g, '')} l`;
                if (resolvedArsmodell) specUpdates.year = resolvedArsmodell; if (fetchedCarInfo.vin) specUpdates.vin = fetchedCarInfo.vin;
                if (resolvedBilmodell) specUpdates.model = resolvedBilmodell; if (resolvedMiltal) specUpdates.mileage = resolvedMiltal;
                
                if (Object.keys(specUpdates).length > 0) {
                    specUpdates.updatedAt = new Date().toISOString();
                    await window.db.collection("vehicleSpecs").doc(finalRegnr.replace(/\s+/g, '')).set(specUpdates, { merge: true });
                }
            }
            setView('DASHBOARD', null);
        } catch (error) { alert("Ett fel uppstod när jobbet skulle sparas."); }
    };

    const partsTotal = expenses.reduce((sum, item) => sum + (parseFloat(item.amount) || 0), 0);
    const finalPriceNum = parseFloat(formData.kundpris) || 0;
    const laborTotal = Math.max(0, finalPriceNum - partsTotal);
    const totalPaid = payments.reduce((sum, item) => sum + (parseFloat(item.amount) || 0), 0);

    const inputClasses = "w-full bg-zinc-50 dark:bg-[#141c2b] focus:bg-white dark:focus:bg-[#182234] border border-zinc-300 dark:border-white/15 p-2.5 text-[13px] font-medium text-zinc-900 dark:text-white outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500/20 transition-all rounded-lg shadow-xs";
    const sectionCardClasses = "bg-white dark:bg-[#1e293b] border border-zinc-200 dark:border-white/10 rounded-xl p-4 lg:p-5 shadow-sm";

    return (
        <div className="flex flex-col min-h-[calc(100vh-80px)] md:min-h-screen bg-transparent text-zinc-900 dark:text-white pb-0 transition-colors duration-500 relative max-w-[1000px] ml-0 w-full animate-in fade-in slide-in-from-left-4">
            
            {/* HEADER */}
            <div className="px-4 pt-4 lg:px-0 lg:pt-0 flex flex-col h-full">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 pb-4 border-b border-zinc-200 dark:border-white/10 gap-4">
                    <div className="flex items-center gap-3 md:gap-4">
                        <div className="relative group cursor-default shrink-0">
                            <div className="absolute inset-0 bg-orange-500/30 blur-lg rounded-full transition-all duration-700" />
                            <div className="relative w-10 h-10 md:w-12 md:h-12 rounded-xl flex items-center justify-center text-white shadow-md border border-white/20 transition-colors bg-orange-500">
                                <SafeIcon name={activeJob ? "edit-3" : "plus"} size={20} className="md:w-6 md:h-6" />
                            </div>
                        </div>
                        <div className="flex flex-col">
                            <h1 className="text-xl md:text-2xl font-black text-zinc-900 dark:text-white uppercase tracking-tight leading-none">
                                {activeJob ? 'UPPDATERA' : 'NYTT'} <span className="text-zinc-400 dark:text-zinc-500 font-light">UPPDRAG</span>
                            </h1>
                            <p className="text-[9px] md:text-[10px] font-bold text-orange-500 dark:text-orange-400 uppercase tracking-widest mt-1 flex items-center gap-1.5">
                                <span className="w-1.5 h-1.5 rounded-full bg-orange-500 animate-pulse"></span>
                                {activeJob ? `Redigerar order #${activeJob.id.substring(0, 6).toUpperCase()}` : 'Sök befintlig eller skapa ny arbetsorder'}
                            </p>
                        </div>
                    </div>

                    {activeJob && (
                        <button
                            type="button"
                            onClick={() => {
                                const currentCustomer = formData.kundnamn;
                                const currentReg = formData.regnr;
                                setActiveJob(null);
                                setDismissedMatches(true);
                                setTimeout(() => {
                                    setFormData(p => ({ ...p, kundnamn: currentCustomer, regnr: currentReg }));
                                }, 50);
                            }}
                            className="self-start sm:self-auto px-3.5 py-2 rounded-lg border border-orange-500/30 bg-orange-50/80 dark:bg-orange-500/10 text-orange-600 dark:text-orange-400 hover:bg-orange-100 dark:hover:bg-orange-500/20 text-[11px] font-bold uppercase tracking-wider flex items-center gap-1.5 transition-all"
                        >
                            <SafeIcon name="plus" size={13} /> Skapa ny länkad order istället
                        </button>
                    )}
                </div>
            </div>

            {/* FORMULÄR */}
            <div className="px-4 lg:px-0">
                <form onSubmit={handleSave} className="space-y-4 flex flex-col">
                    
                    {/* SEKTION 1: IDENTIFIERING & SÖKNING */}
                    <div className={`relative z-40 ${sectionCardClasses}`}>
                        <SectionHeader title="Kund & Fordon" sub="Sök befintlig order eller ange uppgifter för nytt uppdrag" icon="fingerprint" />
                        
                        <FormRow>
                            <InputWrapper label="Kundnamn" icon="user">
                                <div className="relative z-20">
                                    <input 
                                        type="text" value={formData.kundnamn} onChange={e => handleNameChange(e.target.value)} 
                                        className={inputClasses} 
                                        placeholder="Sök kund eller skriv nytt namn..." 
                                    />
                                </div>
                            </InputWrapper>
                            
                            <InputWrapper label="Reg.nr" icon="truck">
                                <div className="relative z-10 flex gap-2">
                                    <div className="relative flex-1 flex items-center">
                                        <input 
                                            type="text" value={formData.regnr} onChange={e => handleRegnrChange(e.target.value)} onFocus={() => handleRegnrChange(formData.regnr)}
                                            // FIX: Tonar rutan lätt orange om det finns träffar
                                            className={`${inputClasses} font-mono uppercase tracking-[0.2em] w-full ${matchingOrders.length > 0 && !dismissedMatches ? 'border-orange-500 bg-orange-50/50 dark:bg-orange-500/10' : ''}`} 
                                            placeholder="ABC 123" autoComplete="off" 
                                        />
                                        
                                        {/* NYTT: Smart knapp inuti inmatningsfältet! Talar om att det finns träffar, stänger tangentbordet och scrollar ner vid klick. */}
                                        {matchingOrders.length > 0 && !dismissedMatches && (
                                            <button 
                                                type="button"
                                                onClick={() => {
                                                    if (document.activeElement) document.activeElement.blur();
                                                    setTimeout(() => {
                                                        const el = document.getElementById('search-results-anchor');
                                                        if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
                                                    }, 150);
                                                }}
                                                className="absolute right-1.5 px-2.5 py-1.5 bg-orange-500 hover:bg-orange-600 text-white text-[9px] sm:text-[10px] font-bold uppercase tracking-wider rounded-md flex items-center gap-1.5 animate-in zoom-in duration-300 shadow-sm transition-colors cursor-pointer"
                                            >
                                                {matchingOrders.length} Träffar <SafeIcon name="arrow-down" size={12} />
                                            </button>
                                        )}

                                        {regnrSuggestions.length > 0 && (
                                            <div className="absolute top-full left-0 z-50 w-full bg-white/95 dark:bg-[#1a2235]/95 backdrop-blur-xl border border-zinc-200 dark:border-white/10 shadow-2xl mt-2 rounded-lg overflow-hidden animate-in fade-in zoom-in-95">
                                                <div className="px-3 py-1.5 bg-zinc-50 dark:bg-white/5 text-[9px] font-bold uppercase tracking-widest text-zinc-400">
                                                    Kundens registrerade fordon
                                                </div>
                                                {regnrSuggestions.map((s, i) => (
                                                    <div key={i} onClick={() => { handleRegnrChange(s); setRegnrSuggestions([]); }} className="p-2.5 px-3 text-[12px] text-zinc-900 dark:text-white hover:bg-orange-50 dark:hover:bg-orange-500/10 hover:text-orange-600 dark:hover:text-orange-400 cursor-pointer font-bold font-mono tracking-widest border-b border-zinc-100 dark:border-white/5 last:border-0 transition-colors">
                                                        {s}
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                    
                                    {window.AutoSearchMenu && (
                                        <window.AutoSearchMenu regnr={formData.regnr} variant="icon" />
                                    )}
                                </div>
                            </InputWrapper>
                        </FormRow>

                        {/* KOMPAKT VY FÖR BEFINTLIGA ORDRAR (Delad vy: Lista på mobil, Tabell på dator) */}
                        {matchingOrders.length > 0 && !dismissedMatches && (
                            <div id="search-results-anchor" className="mt-4 pt-3 border-t border-zinc-200 dark:border-white/10 animate-in fade-in slide-in-from-top-2 duration-200 scroll-mt-6">
                                
                                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-3.5 py-3 mb-3 rounded-xl bg-[#fff7ed] dark:bg-orange-500/10 border border-[#fed7aa] dark:border-orange-500/30 text-[#9a3412] dark:text-orange-200 text-[12px] shadow-sm">
                                    <div className="flex items-center gap-2.5">
                                        <SafeIcon name="info" size={16} className="text-orange-500 shrink-0" />
                                        <span className="font-medium leading-snug">
                                            Arbetsordrar finns tillgängliga för detta fordon / kund ({matchingOrders.length} st)
                                        </span>
                                    </div>
                                    <button 
                                        type="button" 
                                        onClick={() => setDismissedMatches(true)}
                                        className="text-[11px] font-bold uppercase tracking-wider text-orange-700 bg-orange-200/50 hover:bg-orange-200 dark:text-orange-400 dark:bg-orange-500/20 dark:hover:bg-orange-500/30 px-3 py-1.5 rounded-lg transition-colors shrink-0 self-start sm:self-auto"
                                    >
                                        Dölj förslag
                                    </button>
                                </div>

                                {/* --- MOBIL VY: Slimmad, klickbar lista (Syns bara på telefoner) --- */}
                                <div className="flex flex-col gap-2.5 lg:hidden">
                                    {matchingOrders.map((job) => {
                                        const isExpanded = expandedMatchIds.includes(job.id);
                                        const formattedDate = job.datum ? job.datum.replace('T', ' ').substring(0, 16) : 'Ej inbokad';
                                        const serviceTitle = job.paket === 'Oljebyte' && job.oljevolym ? `Oljebyte ${job.oljevolym}l` : (job.paket || 'Standard');

                                        return (
                                            <div key={job.id} className="bg-white dark:bg-[#141c2b] border border-zinc-200 dark:border-white/15 rounded-xl overflow-hidden shadow-xs">
                                                <div onClick={() => toggleExpandMatch(job.id)} className="p-3.5 flex items-center justify-between cursor-pointer hover:bg-zinc-50 dark:hover:bg-white/5 active:scale-[0.99] transition-all">
                                                    <div className="flex flex-col min-w-0">
                                                        <div className="flex items-center gap-2 mb-1">
                                                            <SafeIcon name="wrench" size={13} className="text-orange-500" />
                                                            <span className="font-mono text-[13px] font-bold text-zinc-800 dark:text-zinc-200">{job.regnr || '-'}</span>
                                                            <span className="w-1 h-1 rounded-full bg-zinc-300 dark:bg-zinc-600"></span>
                                                            <span className="text-[13px] font-bold text-zinc-900 dark:text-white truncate">{job.kundnamn || '-'}</span>
                                                        </div>
                                                        <div className="flex items-center gap-2 text-[11px] font-medium text-zinc-500 dark:text-zinc-400 ml-[21px]">
                                                            <span>#{job.id.substring(0, 6).toUpperCase()}</span>
                                                            <span className="w-1 h-1 rounded-full bg-zinc-300 dark:bg-zinc-600"></span>
                                                            <span>{formattedDate}</span>
                                                        </div>
                                                    </div>
                                                    <SafeIcon name={isExpanded ? "chevron-up" : "chevron-down"} size={16} className={`shrink-0 ml-2 transition-transform ${isExpanded ? 'text-orange-500' : 'text-zinc-400'}`} />
                                                </div>

                                                {isExpanded && (
                                                    <div className="p-3.5 pt-0 bg-zinc-50/50 dark:bg-black/20 border-t border-zinc-100 dark:border-white/5 animate-in fade-in duration-200">
                                                        <div className="text-[12px] text-zinc-700 dark:text-zinc-300 mb-4 mt-3 font-medium flex items-center gap-2">
                                                            <SafeIcon name="box" size={13} className="text-orange-500" />
                                                            <span>{serviceTitle}</span>
                                                            {job.kundpris && <span className="ml-auto font-mono text-orange-600 font-bold">{parseInt(job.kundpris).toLocaleString('sv-SE')} kr</span>}
                                                        </div>
                                                        <div className="flex gap-2">
                                                            <button type="button" onClick={(e) => { e.stopPropagation(); handleOpenExistingOrder(job); }} className="flex-1 py-2.5 bg-orange-500 hover:bg-orange-600 text-white rounded-lg text-[11px] font-bold uppercase tracking-wider flex justify-center items-center gap-1.5 shadow-sm active:scale-95 transition-all">
                                                                <SafeIcon name="edit-2" size={13} /> Öppna Order
                                                            </button>
                                                            <button type="button" onClick={(e) => { e.stopPropagation(); handleCreateLinkedOrder(job); }} className="flex-1 py-2.5 bg-zinc-200 dark:bg-white/10 hover:bg-zinc-300 dark:hover:bg-white/20 text-zinc-700 dark:text-zinc-200 rounded-lg text-[11px] font-bold uppercase tracking-wider flex justify-center items-center gap-1.5 active:scale-95 transition-all">
                                                                <SafeIcon name="link" size={13} /> Ny Länkad
                                                            </button>
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>

                                {/* --- DATOR VY: Exakt din originaltabell (Syns bara på stora skärmar) --- */}
                                <div className="hidden lg:block border border-zinc-300 dark:border-white/15 rounded-lg overflow-hidden bg-white dark:bg-[#141c2b] shadow-xs">
                                    <div className="overflow-x-auto">
                                        <table className="w-full text-left border-collapse">
                                            <thead className="bg-[#f4f5f7] dark:bg-[#182234] text-zinc-700 dark:text-zinc-300 text-[11px] font-bold border-b border-zinc-300 dark:border-white/15 select-none">
                                                <tr className="divide-x divide-zinc-300 dark:divide-white/15">
                                                    <th className="w-9 py-2.5 text-center"></th>
                                                    <th className="px-3 py-2.5 w-[130px]">Nr.</th>
                                                    <th className="px-3 py-2.5 w-[110px]">Reg.nr</th>
                                                    <th className="px-3 py-2.5">Kund</th>
                                                    <th className="px-3 py-2.5 w-[160px]">Mottagandedatum</th>
                                                    <th className="px-3 py-2.5 w-[120px]">Orderstatus</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-zinc-200/80 dark:divide-white/10 text-[13px]">
                                                {matchingOrders.map((job) => {
                                                    const isExpanded = expandedMatchIds.includes(job.id);
                                                    const formattedDate = job.datum ? job.datum.replace('T', ' ').substring(0, 16) : 'Ej inbokad';
                                                    const serviceTitle = job.paket === 'Oljebyte' && job.oljevolym ? `Oljebyte ${job.oljevolym}l` : (job.paket || 'Standard');
                                                    const cleanNote = job.kommentar ? String(job.kommentar).replace(/<[^>]*>?/gm, '').replace(/&amp;/g, '&').trim() : '';

                                                    return (
                                                        <React.Fragment key={job.id}>
                                                            <tr onClick={() => toggleExpandMatch(job.id)} className="hover:bg-zinc-50 dark:hover:bg-white/[0.03] cursor-pointer transition-colors">
                                                                <td className="py-2.5 text-center text-zinc-500">
                                                                    <SafeIcon name={isExpanded ? "chevron-down" : "chevron-right"} size={15} />
                                                                </td>
                                                                <td className="px-3 py-2.5 font-medium text-zinc-800 dark:text-zinc-200 whitespace-nowrap">
                                                                    <div className="flex items-center gap-1.5">
                                                                        <SafeIcon name="wrench" size={13} className="text-orange-500" />
                                                                        <span>#{job.id.substring(0, 8).toUpperCase()}</span>
                                                                    </div>
                                                                </td>
                                                                <td className="px-3 py-2.5 font-mono text-[12px] font-semibold text-zinc-700 dark:text-zinc-300 whitespace-nowrap">
                                                                    {job.regnr || '-'}
                                                                </td>
                                                                <td className="px-3 py-2.5 text-zinc-800 dark:text-zinc-200 uppercase truncate max-w-[200px]">
                                                                    {job.kundnamn || '-'}
                                                                </td>
                                                                <td className="px-3 py-2.5 text-zinc-600 dark:text-zinc-400 text-[12px] whitespace-nowrap">
                                                                    {formattedDate}
                                                                </td>
                                                                <td className="px-3 py-2.5 whitespace-nowrap">
                                                                    <span className={`text-[12px] font-medium ${job.status === 'KLAR' ? 'text-emerald-600 dark:text-emerald-400' : job.status === 'BOKAD' ? 'text-orange-600 dark:text-orange-400' : 'text-zinc-700 dark:text-zinc-300'}`}>
                                                                        {job.status ? job.status.charAt(0).toUpperCase() + job.status.slice(1).toLowerCase() : 'Bokad'}
                                                                    </span>
                                                                </td>
                                                            </tr>

                                                            {isExpanded && (
                                                                <tr className="bg-zinc-50/40 dark:bg-black/20">
                                                                    <td></td>
                                                                    <td colSpan="5" className="px-3 pb-3.5 pt-1">
                                                                        <div className="flex flex-wrap items-center gap-2 mb-2.5">
                                                                            <button type="button" onClick={(e) => { e.stopPropagation(); handleOpenExistingOrder(job); }} className="px-3 py-1 rounded border border-orange-500/50 text-orange-600 dark:text-orange-400 hover:bg-orange-500 hover:text-white text-[11px] font-bold uppercase tracking-wider transition-colors">Öppna order</button>
                                                                            <button type="button" onClick={(e) => { e.stopPropagation(); handleCreateLinkedOrder(job); }} className="px-3 py-1 rounded border border-orange-500/50 text-orange-600 dark:text-orange-400 hover:bg-orange-500 hover:text-white text-[11px] font-bold uppercase tracking-wider transition-colors">Ny länkad order</button>
                                                                            {job.kundpris && <span className="ml-auto text-[12px] text-zinc-500 dark:text-zinc-400 pr-2">Pris: <strong className="text-zinc-800 dark:text-zinc-200">{parseInt(job.kundpris).toLocaleString('sv-SE')} kr</strong></span>}
                                                                        </div>
                                                                        <div className="pl-1 space-y-1 text-[12px] text-zinc-700 dark:text-zinc-300">
                                                                            <div className="flex items-center gap-1.5 font-medium"><SafeIcon name="chevron-down" size={13} className="text-zinc-400" /><SafeIcon name="box" size={13} className="text-orange-500" /><span>{serviceTitle}</span></div>
                                                                            {cleanNote && <div className="pl-6 flex items-start gap-1.5 text-zinc-500 dark:text-zinc-400"><SafeIcon name="wrench" size={12} className="text-orange-500 mt-0.5 shrink-0" /><span className="line-clamp-2">{cleanNote}</span></div>}
                                                                            {job.utgifter && job.utgifter.filter(u => u.namn).map((u, idx) => <div key={idx} className="pl-6 flex items-center gap-1.5 text-zinc-500 dark:text-zinc-400"><SafeIcon name="tag" size={11} className="text-orange-500 shrink-0" /><span>{u.namn} ({u.kostnad} kr)</span></div>)}
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
                                    <div className="bg-[#f4f5f7] dark:bg-[#182234] px-3.5 py-2 border-t border-zinc-300 dark:border-white/15 flex items-center justify-between">
                                        <button type="button" onClick={() => setDismissedMatches(true)} className="px-3.5 py-1.5 rounded bg-orange-500 hover:bg-orange-600 text-white text-[11px] font-bold uppercase tracking-wider shadow-xs transition-colors">Fortsätt med ny order</button>
                                        <span className="text-[11px] text-zinc-500 dark:text-zinc-400">{matchingOrders.length} {matchingOrders.length === 1 ? 'post' : 'poster'}</span>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* FORDONDATA-KORT */}
                    {fetchedCarInfo && (
                        <div className="bg-white dark:bg-[#1e293b] border border-zinc-200 dark:border-white/10 rounded-xl p-4 lg:p-5 shadow-sm relative z-30 animate-in slide-in-from-top-2 fade-in duration-300">
                            <div className="mb-4 pb-3 border-b border-zinc-200 dark:border-white/10">
                                <div className="text-[9px] font-black text-orange-500 uppercase tracking-[0.15em] flex items-center gap-1.5 mb-1">
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

                            <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5">
                                {[
                                    { id: 'motorkod', label: 'Motorkod', val: fetchedCarInfo.motorkod, ph: 'CFGB', icon: 'cpu', mono: true },
                                    { id: 'oljevolym', label: 'Oljevolym', val: fetchedCarInfo.oljevolym, ph: '4.7 l', icon: 'droplet', mono: false },
                                    { id: 'oljetyp', label: 'Oljetyp', val: fetchedCarInfo.oljetyp, ph: '5W-30', icon: 'info', mono: true },
                                    { id: 'årsmodell', label: 'Årsmodell', val: fetchedCarInfo.årsmodell, ph: '2016', icon: 'calendar', mono: false }
                                ].map((f, i) => (
                                    <div key={i} className="bg-zinc-50 dark:bg-[#141c2b] border border-zinc-200 dark:border-white/10 rounded-lg p-2.5 flex flex-col justify-center relative group focus-within:border-orange-500 transition-all">
                                        <div className="text-[8px] font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-widest mb-1 flex items-center gap-1.5">
                                            <SafeIcon name={f.icon} size={10} className="text-zinc-400 group-focus-within:text-orange-500" /> {f.label}
                                        </div>
                                        <input type="text" className={`w-full text-[12px] bg-transparent outline-none placeholder:text-zinc-400 truncate text-zinc-900 dark:text-white ${f.mono ? 'font-mono font-bold tracking-wider' : 'font-medium'}`} placeholder={f.ph} value={f.val || ''} onChange={(e) => handleSpecChange(f.id, e.target.value)} onBlur={(e) => saveSpec(f.id, e.target.value)} />
                                    </div>
                                ))}
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5 mt-2.5">
                                <div className="bg-zinc-50 dark:bg-[#141c2b] border border-zinc-200 dark:border-white/10 rounded-lg p-2.5 flex flex-col justify-center relative group focus-within:border-orange-500 transition-all">
                                    <div className="text-[8px] font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-widest mb-1 flex items-center gap-1.5">
                                        <SafeIcon name="navigation" size={10} className="text-zinc-400 group-focus-within:text-orange-500" /> Miltal
                                    </div>
                                    <input type="text" className="w-full text-[12px] font-medium bg-transparent outline-none placeholder:text-zinc-400 text-zinc-900 dark:text-white" placeholder="12 500 mil" value={fetchedCarInfo.miltal || ''} onChange={(e) => handleSpecChange('miltal', e.target.value)} onBlur={(e) => saveSpec('miltal', e.target.value)} />
                                </div>

                                <div className="bg-zinc-50 dark:bg-[#141c2b] border border-zinc-200 dark:border-white/10 rounded-lg p-2.5 flex flex-col justify-center relative group focus-within:border-orange-500 transition-all">
                                    <div className="text-[8px] font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-widest mb-1 flex items-center gap-1.5">
                                        <SafeIcon name="hash" size={10} className="text-zinc-400 group-focus-within:text-orange-500" /> Chassinummer (VIN)
                                    </div>
                                    <input type="text" className="w-full text-[13px] font-mono font-bold tracking-[0.2em] uppercase bg-transparent outline-none placeholder:text-zinc-400 text-zinc-900 dark:text-white" placeholder="WBA00000000000000" value={fetchedCarInfo.vin || ''} onChange={(e) => handleSpecChange('vin', e.target.value.toUpperCase())} onBlur={(e) => saveSpec('vin', e.target.value)} />
                                </div>
                            </div>
                        </div>
                    )}

                    {/* SEKTION 2: PARAMETRAR */}
                    <div className={`relative z-20 ${sectionCardClasses}`}>
                        <SectionHeader title="Uppdragsdetaljer" sub="Tidsbokning och arbetsomfattning" icon="sliders" />

                        <div className="mb-4">
                            <InputWrapper label="Uppdragsstatus" icon="activity">
                                <div className="flex bg-zinc-100 dark:bg-[#141c2b] p-1 rounded-lg border border-zinc-300 dark:border-white/15 w-full overflow-x-auto custom-scrollbar">
                                    {['BOKAD', 'OFFERERAD', 'KLAR', 'FAKTURERAS'].map(s => (
                                        <button
                                            key={s} type="button" onClick={() => setFormData(p => ({ ...p, status: s }))}
                                            className={`flex-1 min-w-[80px] py-2 px-1 text-[9px] lg:text-[10px] font-bold uppercase tracking-widest rounded-md transition-all duration-200 ${formData.status === s ? 'bg-white dark:bg-[#1f2940] shadow-xs text-zinc-900 dark:text-white font-black' : 'text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300'}`}
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
                                    <div className="flex bg-zinc-100 dark:bg-[#141c2b] p-1 rounded-lg border border-zinc-300 dark:border-white/15 w-full overflow-x-auto custom-scrollbar">
                                        {['Standard', 'Oljebyte', 'Hjulskifte', 'Felsökning'].map(pkg => (
                                            <button
                                                key={pkg} 
                                                type="button" 
                                                onClick={() => handlePackageChange(pkg)}
                                                className={`flex-1 min-w-[70px] py-2 px-1 text-[9px] lg:text-[10px] font-bold uppercase tracking-widest rounded-md transition-all duration-200 ${formData.paket === pkg ? 'bg-white dark:bg-[#1f2940] shadow-xs text-zinc-900 dark:text-white font-black' : 'text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300'}`}
                                            >
                                                {pkg}
                                            </button>
                                        ))}
                                    </div>
                                </InputWrapper>
                                
                                {formData.paket === "Oljebyte" && (
                                    <div className="p-3 bg-orange-50/50 dark:bg-orange-950/20 border border-orange-500/30 rounded-lg animate-in slide-in-from-top-2 fade-in duration-300">
                                        <label className="text-[10px] font-bold text-orange-500 uppercase tracking-widest mb-1.5 flex items-center justify-between">
                                            <span className="flex items-center gap-1.5"><SafeIcon name="droplet" size={12} /> Nödvändig Oljevolym (Liter)</span>
                                        </label>
                                        <div className="flex gap-2">
                                            <input 
                                                type="number" step="0.1" value={oilLiters} onChange={e => handleOilVolumeChange(e.target.value)} 
                                                className="w-full bg-white dark:bg-[#141c2b] text-zinc-900 dark:text-white border border-orange-500/30 p-2.5 text-[14px] font-black font-mono outline-none focus:border-orange-500 rounded-lg shadow-xs" 
                                            />
                                            <button 
                                                type="button" 
                                                onClick={() => {
                                                    if (!formData.regnr) { alert("Skriv in ett regnr först!"); return; }
                                                    if (window.osSearchVehicle) window.osSearchVehicle(formData.regnr, 'START_OS_RADAR', true);
                                                }}
                                                className="shrink-0 px-4 bg-orange-500 hover:bg-orange-600 text-white rounded-lg flex items-center justify-center transition-all active:scale-95 shadow-xs"
                                                title="Hämta Oljevolym"
                                            >
                                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                                    <path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z"></path>
                                                </svg>
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>
                            
                            <div className="grid grid-cols-2 gap-3">
                                <InputWrapper label="Bokat Datum" icon="calendar">
                                    <input 
                                        type="date" 
                                        value={formData.datum} 
                                        onChange={e => setFormData(p => ({ ...p, datum: e.target.value }))} 
                                        onClick={(e) => e.target.showPicker && e.target.showPicker()}
                                        className={`${inputClasses} cursor-pointer uppercase tracking-wider text-[12px] [&::-webkit-calendar-picker-indicator]:hidden`} 
                                    />
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
                        <SectionHeader title="Ekonomi & Pris" sub="Prissättning, reservdelar och delbetalningar" icon="credit-card" />

                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 lg:gap-6">
                            
                            {/* VÄNSTER: PRIS & SAMMANFATTNING */}
                            <div className="bg-zinc-50 dark:bg-[#141c2b] rounded-xl border border-zinc-300 dark:border-white/15 flex flex-col relative overflow-hidden shadow-xs">
                                <div className="p-4 lg:p-5 flex-1 flex flex-col justify-center">
                                    <InputWrapper label="Totalpris (inkl. moms)" icon="dollar-sign">
                                        <div className="mt-1 flex items-baseline">
                                            <input 
                                                type="number" value={formData.kundpris} onChange={e => setFormData(p => ({ ...p, kundpris: e.target.value }))} 
                                                className="w-full bg-transparent text-zinc-900 dark:text-white text-4xl md:text-5xl font-light tracking-tighter outline-none focus:text-orange-500 transition-colors" 
                                                placeholder="0" 
                                            />
                                            <span className="text-lg font-bold text-zinc-400 ml-2">SEK</span>
                                        </div>
                                    </InputWrapper>

                                    <div className="mt-5 pt-4 border-t border-zinc-200 dark:border-white/10 flex flex-col gap-2.5">
                                        
                                        <div className="flex justify-between items-center">
                                            <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-zinc-500">
                                                <SafeIcon name="box" size={12} /> Reservdelar
                                            </div>
                                            <div className="flex items-center gap-1">
                                                <span className="text-[13px] font-mono font-bold text-zinc-800 dark:text-zinc-200">{partsTotal.toLocaleString()}</span>
                                                <span className="text-[9px] font-bold uppercase tracking-widest text-zinc-400">kr</span>
                                            </div>
                                        </div>
                                        
                                        <div className="flex justify-between items-center">
                                            <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-zinc-500">
                                                <SafeIcon name="arrow-up" size={12} /> Arbetskostnad
                                            </div>
                                            <div className="flex items-center gap-1 bg-white dark:bg-[#182234] px-2 py-1 w-[100px] rounded border border-zinc-300 dark:border-white/15 shadow-xs">
                                                <input 
                                                    type="number" 
                                                    value={laborTotal === 0 && finalPriceNum === 0 ? '' : laborTotal} 
                                                    onChange={e => {
                                                        const newLabor = parseFloat(e.target.value) || 0;
                                                        setFormData(p => ({ ...p, kundpris: (newLabor + partsTotal).toString() }));
                                                    }}
                                                    className="w-full bg-transparent outline-none text-right font-mono text-[13px] font-bold text-zinc-900 dark:text-white"
                                                    placeholder="0"
                                                />
                                                <span className="text-[9px] font-bold uppercase tracking-widest text-zinc-400">kr</span>
                                            </div>
                                        </div>

                                        <div className="w-full border-t border-dashed border-zinc-200 dark:border-white/10 my-1"></div>

                                        <div className="flex justify-between items-center">
                                            <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-orange-500">
                                                <SafeIcon name="arrow-down" size={12} /> Inbetalt
                                            </div>
                                            <div className="flex items-center gap-1">
                                                <span className="text-[13px] font-mono font-bold text-orange-500">{totalPaid.toLocaleString()}</span>
                                                <span className="text-[9px] font-bold uppercase tracking-widest text-orange-400">kr</span>
                                            </div>
                                        </div>

                                    </div>
                                </div>

                                {totalPaid > 0 && (
                                    <div className="bg-orange-50 dark:bg-orange-500/10 border-t border-orange-500/30 p-3.5 flex justify-between items-center">
                                        <span className="text-[11px] text-orange-700 dark:text-orange-300 uppercase tracking-widest font-bold">
                                            Kvar att fakturera
                                        </span>
                                        <div className="flex items-baseline gap-1 text-orange-600 dark:text-orange-400">
                                            <span className="text-[20px] font-black tracking-tight leading-none">
                                                {Math.max(0, (parseFloat(formData.kundpris) || 0) - totalPaid).toLocaleString('sv-SE')}
                                            </span>
                                            <span className="text-[10px] font-bold uppercase tracking-widest">kr</span>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* HÖGER: LISTOR (RESERVDELAR & DELBETALNINGAR) */}
                            <div className="flex flex-col gap-5">
                                
                                <div className="space-y-2.5">
                                    <div className="flex items-center justify-between pb-1 border-b border-zinc-200 dark:border-white/10">
                                        <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest flex items-center gap-1.5">
                                            <SafeIcon name="shopping-cart" size={10} />Reservdelar & Material
                                        </label>
                                        <button type="button" onClick={addExpenseRow} className="text-[9px] font-bold text-orange-500 bg-orange-50 dark:bg-orange-500/10 hover:bg-orange-100 uppercase px-2 py-1 rounded transition-colors flex items-center gap-1">
                                            <SafeIcon name="plus" size={10} /> Lägg till
                                        </button>
                                    </div>
                                    
                                    <div className="space-y-2 max-h-[160px] overflow-y-auto pr-1 custom-scrollbar">
                                        {expenses.map((ex, i) => (
                                            <div key={i} className="flex gap-2 items-center">
                                                <input 
                                                    placeholder="Artikel / Tjänst" 
                                                    value={ex.desc} 
                                                    onChange={e => { const n = [...expenses]; n[i].desc = e.target.value; setExpenses(n); }} 
                                                    className="flex-1 bg-zinc-50 dark:bg-[#141c2b] border border-zinc-300 dark:border-white/15 py-2 px-3 text-[12px] font-medium text-zinc-900 dark:text-white outline-none rounded-lg shadow-xs" 
                                                />
                                                <div className="relative w-24 shrink-0 flex items-center">
                                                    <input 
                                                        placeholder="0" 
                                                        type="number" 
                                                        value={ex.amount} 
                                                        onChange={e => handleExpenseAmountChange(i, e.target.value)} 
                                                        className="w-full bg-zinc-50 dark:bg-[#141c2b] border border-zinc-300 dark:border-white/15 py-2 pl-2 pr-6 text-[12px] font-mono font-bold text-zinc-900 dark:text-white outline-none text-right rounded-lg shadow-xs" 
                                                    />
                                                    <span className="absolute right-2 text-[9px] text-zinc-400 font-bold uppercase pointer-events-none">kr</span>
                                                </div>
                                                <button type="button" onClick={() => removeExpenseRow(i)} className="text-zinc-400 hover:text-red-500 p-2 transition-all" title="Ta bort">
                                                    <SafeIcon name="trash-2" size={14} />
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                <div className="space-y-2.5 pt-3 border-t border-zinc-200 dark:border-white/10">
                                    <div className="flex items-center justify-between pb-1 border-b border-zinc-200 dark:border-white/10">
                                        <label className="text-[10px] font-bold text-orange-500 uppercase tracking-widest flex items-center gap-1.5">
                                            <SafeIcon name="credit-card" size={10} />Delbetalningar & Förskott
                                        </label>
                                        <button type="button" onClick={() => setPayments([...payments, { desc: '', amount: '' }])} className="text-[9px] font-bold text-orange-500 bg-orange-50 dark:bg-orange-500/10 uppercase px-2 py-1 rounded transition-colors flex items-center gap-1">
                                            <SafeIcon name="plus" size={10} /> Lägg till
                                        </button>
                                    </div>
                                    
                                    <div className="space-y-2 max-h-[160px] overflow-y-auto pr-1 custom-scrollbar">
                                        {payments.map((p, i) => (
                                            <div key={i} className="flex gap-2 items-center">
                                                <input 
                                                    placeholder="Swish / Faktura (t.ex. 21/5)" 
                                                    value={p.desc} 
                                                    onChange={e => { const n = [...payments]; n[i].desc = e.target.value; setPayments(n); }} 
                                                    className="flex-1 bg-zinc-50 dark:bg-[#141c2b] border border-zinc-300 dark:border-white/15 py-2 px-3 text-[12px] font-medium text-zinc-900 dark:text-white outline-none rounded-lg shadow-xs" 
                                                />
                                                <div className="relative w-24 shrink-0 flex items-center">
                                                    <input 
                                                        placeholder="0" 
                                                        type="number" 
                                                        value={p.amount} 
                                                        onChange={e => { const n = [...payments]; n[i].amount = e.target.value; setPayments(n); }} 
                                                        className="w-full bg-zinc-50 dark:bg-[#141c2b] border border-zinc-300 dark:border-white/15 py-2 pl-2 pr-6 text-[12px] font-mono font-bold text-orange-500 outline-none text-right rounded-lg shadow-xs" 
                                                    />
                                                    <span className="absolute right-2 text-[9px] text-orange-400 font-bold uppercase pointer-events-none">kr</span>
                                                </div>
                                                <button type="button" onClick={() => { const n = payments.filter((_, idx) => idx !== i); if(n.length===0) n.push({desc:'', amount:''}); setPayments(n); }} className="text-zinc-400 hover:text-red-500 p-2 transition-all" title="Ta bort">
                                                    <SafeIcon name="trash-2" size={14} />
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                                
                            </div>
                        </div>
                    </div>

                    {/* SEKTION 4: LOGGAR / ANTECKNINGAR */}
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
                            className="w-full sm:w-auto order-3 sm:order-1 px-6 py-2 bg-zinc-100 dark:bg-[#141c2b] border border-zinc-300 dark:border-white/15 text-zinc-700 dark:text-zinc-300 font-bold text-[11px] uppercase tracking-wider rounded-lg transition-all"
                        >
                            Avbryt
                        </button>

                        {activeJob && activeJob.status !== 'KLAR' && (
                            <button 
                                type="button" 
                                onClick={async () => {
                                    await window.db.collection("jobs").doc(activeJob.id).update({ status: 'KLAR' });
                                    setView('DASHBOARD');
                                }} 
                                className="w-full sm:order-2 sm:w-auto px-6 py-2 bg-white dark:bg-[#141c2b] border border-zinc-300 dark:border-white/15 text-orange-500 font-bold text-[11px] uppercase tracking-wider rounded-lg shadow-xs transition-all flex items-center justify-center gap-1.5"
                            >
                                <SafeIcon name="check" size={14} /> Snabbval: Klar
                            </button>
                        )}

                        <button 
                            type="submit" 
                            className="w-full order-1 sm:order-3 sm:w-auto px-8 py-2 bg-orange-500 hover:bg-orange-600 text-white font-bold text-[11px] uppercase tracking-wider shadow-xs rounded-lg transition-all flex items-center justify-center gap-1.5"
                        >
                            <SafeIcon name="save" size={14} /> Spara Jobb
                        </button>
                    </div>

                </form>
            </div>
        </div>
    );
};
