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
    
    // Läs av URL:en för att bestämma startvy
    const initialStep = React.useMemo(() => {
        if (editingJob) return 'DETAIL';
        const hash = window.location.hash;
        if (hash === '#new_job_form' || hash.startsWith('#job_')) return 'DETAIL';
        return 'SEARCH';
    }, [editingJob]);

    const [step, setStep] = React.useState(initialStep);
    const [activeTab, setActiveTab] = React.useState('ORDEROMFATTNING');

    const [searchQuery, setSearchQuery] = React.useState('');
    const [quickCreate, setQuickCreate] = React.useState({ kund: '', regnr: '' });
    const [isQuickCreateOpen, setIsQuickCreateOpen] = React.useState(false); // NY RAD
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

    const [focusedInput, setFocusedInput] = React.useState(null);
    const [showGrunduppgifter, setShowGrunduppgifter] = React.useState(true); // Håller koll på om Steg 2-rutan är öppen

    // Ser till att rutan automatiskt öppnas igen när du klickar på "Skapa nytt jobb"
    React.useEffect(() => {
        if (!activeJob && step === 'DETAIL') {
            setShowGrunduppgifter(true);
        }
    }, [activeJob, step]);

    // 1. DYNAMISKA LISTOR FÖR STEG 2: Filtrerar varandra korsvis!
    const activeRegnrSuggestions = React.useMemo(() => {
        let pool = allJobs;
        // Om kundnamn är ifyllt, hämta BARA denna kundens bilar
        if (formData.kundnamn && formData.kundnamn.length > 1) {
            pool = pool.filter(j => (j.kundnamn || '').toUpperCase().trim() === formData.kundnamn.toUpperCase().trim());
        }
        
        let uniqueList = [...new Set(pool.map(j => (j.regnr || '').toUpperCase().replace(/\s+/g, '')).filter(Boolean))];
        
        // Om du börjat skriva ett regnr, filtrera förslagen vidare på det du skriver
        if (formData.regnr) uniqueList = uniqueList.filter(r => r.includes(formData.regnr.toUpperCase()) && r !== formData.regnr.toUpperCase());
        
        return uniqueList.slice(0, 15);
    }, [allJobs, formData.regnr, formData.kundnamn]);

    const activeKundSuggestions = React.useMemo(() => {
        let pool = allJobs;
        // Om regnr är ifyllt, hämta BARA de kunder som lämnat in just denna bil
        if (formData.regnr && formData.regnr.length > 2) {
            pool = pool.filter(j => (j.regnr || '').toUpperCase().replace(/\s+/g, '') === formData.regnr.toUpperCase().replace(/\s+/g, ''));
        }
        
        let uniqueList = [...new Set(pool.map(j => (j.kundnamn || '').trim().toUpperCase()).filter(Boolean))];
        
        if (formData.kundnamn) uniqueList = uniqueList.filter(c => c.includes(formData.kundnamn.toUpperCase()) && c !== formData.kundnamn.toUpperCase());
        
        return uniqueList.slice(0, 15);
    }, [allJobs, formData.regnr, formData.kundnamn]);

    // Sparar dina gamla listor intakta så att högerkolumnen fortsätter fungera!
    const uniqueCustomers = React.useMemo(() => [...new Set(allJobs.map(j => (j.kundnamn || '').trim()).filter(Boolean))], [allJobs]);
    const uniqueRegnrs = React.useMemo(() => [...new Set(allJobs.map(j => (j.regnr || '').toUpperCase().replace(/\s+/g, '')).filter(Boolean))], [allJobs]);

    // Logik för att hitta tidigare kopplingar mellan Regnr <-> Kund
    const smartVehicleSuggestions = React.useMemo(() => {
        if (!formData.kundnamn || formData.kundnamn.length < 2) return [];
        const cleanName = formData.kundnamn.toUpperCase().trim();
        return [...new Set(allJobs.filter(j => (j.kundnamn || '').toUpperCase().trim() === cleanName).map(j => j.regnr).filter(Boolean))];
    }, [formData.kundnamn, allJobs]);

    const smartCustomerSuggestions = React.useMemo(() => {
        if (!formData.regnr || formData.regnr.length < 3) return [];
        const cleanReg = formData.regnr.toUpperCase().replace(/\s+/g, '');
        return [...new Set(allJobs.filter(j => (j.regnr || '').toUpperCase().replace(/\s+/g, '') === cleanReg).map(j => j.kundnamn).filter(Boolean))];
    }, [formData.regnr, allJobs]);

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
        window.location.hash = `#job_${job.id}`; // Skapar den unika länken
        setActiveJob(job);
        setIsEditingVehicle(false);
        setStep('DETAIL');
    };

    // NYTT: Lyssna på när du klickar i sidomenyn medan du redan är inne i vyn
    React.useEffect(() => {
        const handleHash = () => {
            const hash = window.location.hash;
            if (hash === '#new_job') {
                setActiveJob(null);
                setStep('SEARCH');
            } else if (hash === '#new_job_form') {
                setActiveJob(null);
                setStep('DETAIL');
            }
        };
        window.addEventListener('hashchange', handleHash);
        return () => window.removeEventListener('hashchange', handleHash);
    }, []);

    // NYTT: Tvinga vyn att uppdateras om app.js ändrar jobbet
    React.useEffect(() => {
        setActiveJob(editingJob || null);
        
        if (editingJob) {
            setStep('DETAIL');
        } else {
            // Om vi nollställer jobbet via menyn, kolla länken. Är vi inte uttryckligen på formuläret, gå till sök!
            if (window.location.hash === '#new_job_form') {
                setStep('DETAIL');
            } else {
                setStep('SEARCH');
            }
        }
    }, [editingJob]);

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

        // NYTT: Fyller i kundnamn automatiskt om vi hittar en tidigare order på detta regnr!
        // NYTT: Fyller i kundnamn automatiskt om vi hittar en tidigare order på detta regnr!
        if (lastJob && lastJob.kundnamn) {
            setFormData(p => p.kundnamn ? p : { ...p, kundnamn: lastJob.kundnamn });
        }

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
                if (specs.oil) updated.oljevolym = String(specs.oil).toLowerCase().includes('l') ? String(specs.oil) : `${specs.oil} l`; else if (!updated.oljevolym && lastJob?.oljevolym) updated.oljevolym = String(lastJob.oljevolym).toLowerCase().includes('l') ? String(lastJob.oljevolym) : `${lastJob.oljevolym} l`;
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
                // NYTT: Kolla efter osparat utkast!
                const savedDraft = localStorage.getItem('os_job_draft');
                let restored = false;
                
                if (savedDraft) {
                    try {
                        const parsed = JSON.parse(savedDraft);
                        if (parsed.formData && (parsed.formData.regnr || parsed.formData.kundnamn)) {
                            if (window.confirm(`Du har ett osparat utkast för ${parsed.formData.regnr || parsed.formData.kundnamn}. Vill du återställa det?`)) {
                                setFormData(parsed.formData);
                                setExpenses(parsed.expenses || emptyExpenses);
                                setPayments(parsed.payments || emptyPayments);
                                setFetchedCarInfo(parsed.fetchedCarInfo || null);
                                restored = true;
                            } else {
                                localStorage.removeItem('os_job_draft');
                            }
                        }
                    } catch(e) {}
                }

                if (!restored) {
                    // Tvingar hela formuläret att bli tomt så inga gamla biluppgifter hänger kvar
                    setFormData({
                        kundnamn: '', regnr: '', paket: 'Standard', status: 'BOKAD',
                        datum: today, tid: '16:30', kundpris: '0', kommentar: '', 
                        bilmodell: '', motorkod: '', miltal: '', årsmodell: '', vin: '', oljevolym: ''
                    });
                    setFetchedCarInfo(null);
                    setExpenses([{ desc: '', antal: '1', amount: '', type: 'arbetsoperation' }, { desc: '', antal: '1', amount: '', type: 'reservdel' }]); 
                    setPayments([{ desc: '', amount: '' }]);
                }
            }
        };
        loadExistingJob();
    }, [activeJob, today]);

    const handleSpecChange = (key, value) => setFetchedCarInfo(prev => ({ ...prev, [key]: value }));

    // NYTT: Auto-spara utkast i bakgrunden vid varje tangenttryck (endast för nya ordrar)
    React.useEffect(() => {
        if (!activeJob && step === 'DETAIL') {
            // Spara bara om vi faktiskt har börjat fylla i något (regnr, kund, utgifter eller anteckning)
            if (formData.regnr || formData.kundnamn || expenses.some(e => e.desc || e.amount) || formData.kommentar) {
                const draft = { formData, expenses, payments, fetchedCarInfo };
                localStorage.setItem('os_job_draft', JSON.stringify(draft));
            }
        }
    }, [formData, expenses, payments, fetchedCarInfo, activeJob, step]);

    const handlePackageChange = (val) => {
        let updatedFormData = { paket: val };

        if (val === 'Oljebyte') {
            let rawVol = fetchedCarInfo?.oljevolym || formData.oljevolym || '';
            let volNum = parseFloat(String(rawVol).replace(',', '.').replace(/[^0-9.]/g, ''));

            if (!volNum || isNaN(volNum)) {
                const userVol = prompt('Oljevolym saknas. Ange antal liter motorolja (t.ex. 4.3):');
                if (userVol) {
                    volNum = parseFloat(userVol.replace(',', '.').replace(/[^0-9.]/g, ''));
                    if (volNum && !isNaN(volNum)) {
                        handleSpecChange('oljevolym', `${volNum} l`); 
                    }
                }
            }

            if (volNum && !isNaN(volNum)) {
                const oilPrice = Math.round(volNum * 200); 
                const filterPrice = 200; 
                const laborPrice = 500; 
                
                setExpenses([
                    { desc: 'Motorolja (á 200kr/l)', antal: String(volNum), amount: String(oilPrice), type: 'reservdel' },
                    { desc: 'Oljefilter', antal: '1', amount: String(filterPrice), type: 'reservdel' },
                    { desc: 'Arbetskostnad Oljebyte', antal: '1', amount: String(laborPrice), type: 'arbetsoperation' }
                ]);
                updatedFormData.kundpris = String(oilPrice + filterPrice + laborPrice);
                
                // Uppdaterar titeln så den sparas som "Oljebyte 6.4l"
                updatedFormData.paket = `Oljebyte ${volNum}l`; 
            } else {
                alert("Välj en giltig oljevolym för att beräkna priset.");
            }
        } 
        else if (val === 'Felsökning') {
            setExpenses([{ desc: 'Felsökning', antal: '1', amount: '500', type: 'arbetsoperation' }]);
            updatedFormData.kundpris = '500';
        } 
        else if (val === 'Hjulskifte') {
            setExpenses([{ desc: 'Hjulskifte', antal: '1', amount: '200', type: 'arbetsoperation' }]);
            updatedFormData.kundpris = '200';
        }
        else if (val === 'Hjulinställning') {
            setExpenses([{ desc: 'Hjulinställning', antal: '1', amount: '1000', type: 'arbetsoperation' }]);
            updatedFormData.kundpris = '1000';
        }
        else if (val === 'DigitalStampel') {
            updatedFormData.paket = formData.paket; 
            setExpenses(prev => [...prev, { desc: 'Digital Servicebok / Stämpel', antal: '1', amount: '500', type: 'arbetsoperation' }]);
            updatedFormData.kundpris = String(Math.max(0, (parseFloat(formData.kundpris) || 0) + 500));
        }
        else if (val === 'AddBromsvatska') {
            updatedFormData.paket = formData.paket;
            setExpenses(prev => [...prev, 
                { desc: 'Bromsvätska', antal: '1', amount: '150', type: 'reservdel' },
                { desc: 'Byte bromsvätska', antal: '1', amount: '400', type: 'arbetsoperation' }
            ]);
            updatedFormData.kundpris = String((parseFloat(formData.kundpris) || 0) + 550);
        }
        else if (val === 'AddArbete100') {
            updatedFormData.paket = formData.paket;
            setExpenses(prev => [...prev, { desc: 'Extra arbetskostnad tillägg', antal: '1', amount: '100', type: 'arbetsoperation' }]);
            updatedFormData.kundpris = String((parseFloat(formData.kundpris) || 0) + 100);
        }
        else if (val === 'AddArbete200') {
            updatedFormData.paket = formData.paket;
            setExpenses(prev => [...prev, { desc: 'Extra arbetskostnad tillägg', antal: '1', amount: '200', type: 'arbetsoperation' }]);
            updatedFormData.kundpris = String((parseFloat(formData.kundpris) || 0) + 200);
        }
        else if (val === 'Standard') {
            setExpenses([
                { desc: '', antal: '1', amount: '', type: 'arbetsoperation' }, 
                { desc: '', antal: '1', amount: '', type: 'reservdel' }
            ]);
            updatedFormData.kundpris = '0';
        }
        
        setFormData(p => ({ ...p, ...updatedFormData }));
        setTimeout(() => { if (window.lucide) window.lucide.createIcons(); }, 50);
    };

    const handleUpdateExpense = (index, field, value) => {
        const newExpenses = [...expenses];
        const oldAmount = parseFloat(newExpenses[index].amount) || 0;
        
        newExpenses[index] = { ...newExpenses[index], [field]: value };
        
        // Magi: Om du ändrar 'antal' på motorolja räknas priset om direkt (liter * 200 kr)
        if (field === 'antal' && newExpenses[index].desc && newExpenses[index].desc.toLowerCase().includes('motorolja')) {
            const liters = parseFloat(String(value).replace(',', '.'));
            newExpenses[index].amount = !isNaN(liters) ? String(Math.round(liters * 200)) : '0';
        }
        
        // Räkna ut prisskillnaden på raden och uppdatera Totalpriset automatiskt!
        const newAmount = parseFloat(newExpenses[index].amount) || 0;
        const diff = newAmount - oldAmount;
        
        if (diff !== 0) {
            setFormData(p => ({ ...p, kundpris: String(Math.max(0, (parseFloat(p.kundpris) || 0) + diff)) }));
        }

        setExpenses(newExpenses);
    };

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

            // NYTT: Rensa utkastet permanent när ordern har sparats i databasen!
            localStorage.removeItem('os_job_draft');

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
            
            {/* DATALISTOR FÖR AUTOCOMPLETE (Syns ej, ger bara sökförslag) */}
            <datalist id="customers-list">
                {[...new Set(allJobs.map(j => j?.kundnamn ? String(j.kundnamn) : '').filter(Boolean))].sort().map(c => <option key={c} value={c} />)}
            </datalist>
            <datalist id="regnr-list">
                {[...new Set(allJobs.map(j => j?.regnr ? String(j.regnr) : '').filter(Boolean))].sort().map(r => <option key={r} value={r} />)}
            </datalist>
            <datalist id="search-history">
                {[...new Set([...allJobs.map(j => j?.kundnamn ? String(j.kundnamn) : ''), ...allJobs.map(j => j?.regnr ? String(j.regnr) : '')].filter(Boolean))].sort().map(item => <option key={item} value={item} />)}
            </datalist>

            {/* === STICKY HEADER === */}
            <div className="sticky top-[-16px] lg:top-[-32px] z-[100] pt-[28px] lg:pt-[32px] pb-4 px-4 lg:px-8 mb-4 flex flex-col sm:flex-row sm:items-center justify-between border-b border-zinc-200 dark:border-white/10 gap-4 bg-white/95 dark:bg-[#1e293b]/95 backdrop-blur-2xl shadow-sm -mt-4 lg:-mt-8 w-full lg:-mx-8 lg:w-[calc(100%+64px)]">
                <div className="flex items-center gap-4">
                    {step === 'DETAIL' ? (
                        <button onClick={() => { window.location.hash = '#new_job'; setStep('SEARCH'); }} className="relative group shrink-0 active:scale-95 transition-all" title="Gå tillbaka till sök">
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
                    <div className="bg-white dark:bg-[#1e293b] border border-zinc-200 dark:border-white/10 rounded-2xl p-4 sm:p-6 shadow-sm">
                        
                        {/* FRITEKSTSÖKNING (Modern pill-design för både mobil och dator) */}
                        <div className="mb-5 sm:mb-6">
                            <div className="relative w-full group">
                                <SafeIcon name="search" size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400 group-focus-within:text-[#ea580c] transition-colors pointer-events-none" />
                                <input 
                                    type="text" 
                                    autoFocus={typeof window !== 'undefined' && window.innerWidth > 768}
                                    value={searchQuery} 
                                    onChange={e => setSearchQuery(e.target.value)} 
                                    placeholder="Sök på reg.nr, kundnamn, jobb..." 
                                    className="w-full bg-zinc-50 dark:bg-black/20 border border-zinc-200 dark:border-white/10 rounded-xl pl-12 pr-12 py-3.5 sm:py-3 text-[16px] sm:text-[14px] outline-none text-zinc-900 dark:text-white transition-all placeholder:text-zinc-500 focus:bg-white dark:focus:bg-[#161f30] focus:border-[#ea580c] shadow-inner focus:shadow-md [&::-webkit-calendar-picker-indicator]:hidden [&::-webkit-calendar-picker-indicator]:opacity-0" 
                                />
                                {searchQuery && (
                                    <button onClick={() => setSearchQuery('')} className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-[#ea580c] transition-all p-1">
                                        <SafeIcon name="x" size={18} />
                                    </button>
                                )}
                            </div>
                        </div>

                        {/* FILTER FÖR DATUM OCH STATUS (Moderna fält) */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-8">
                            <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
                                <label className="text-[10px] sm:text-[11px] font-bold text-zinc-500 dark:text-zinc-400 w-full sm:w-auto shrink-0 uppercase tracking-wider">Datum</label>
                                <div className="flex items-center gap-2 w-full">
                                    <input 
                                        type="date" 
                                        value={advFilters.dateStart} 
                                        onChange={e => setAdvFilters(p => ({...p, dateStart: e.target.value}))} 
                                        onClick={e => e.target.showPicker && e.target.showPicker()}
                                        className="w-full cursor-pointer bg-zinc-50 dark:bg-black/20 border border-zinc-200 dark:border-white/10 rounded-lg px-3 py-2.5 sm:py-2 text-[14px] sm:text-[12px] uppercase outline-none text-zinc-900 dark:text-white transition-colors focus:border-[#ea580c] focus:bg-white dark:focus:bg-[#161f30]" 
                                    />
                                    <span className="text-zinc-300">-</span>
                                    <input 
                                        type="date" 
                                        value={advFilters.dateEnd} 
                                        onChange={e => setAdvFilters(p => ({...p, dateEnd: e.target.value}))} 
                                        onClick={e => e.target.showPicker && e.target.showPicker()}
                                        className="w-full cursor-pointer bg-zinc-50 dark:bg-black/20 border border-zinc-200 dark:border-white/10 rounded-lg px-3 py-2.5 sm:py-2 text-[14px] sm:text-[12px] uppercase outline-none text-zinc-900 dark:text-white transition-colors focus:border-[#ea580c] focus:bg-white dark:focus:bg-[#161f30]" 
                                    />
                                </div>
                            </div>
                            <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
                                <label className="text-[10px] sm:text-[11px] font-bold text-zinc-500 dark:text-zinc-400 w-full sm:w-auto shrink-0 uppercase tracking-wider">Status</label>
                                <select value={advFilters.status} onChange={e => setAdvFilters(p => ({...p, status: e.target.value}))} className="w-full bg-zinc-50 dark:bg-black/20 border border-zinc-200 dark:border-white/10 rounded-lg px-3 py-2.5 sm:py-2 text-[14px] sm:text-[12px] uppercase outline-none text-zinc-900 dark:text-white transition-colors focus:border-[#ea580c] focus:bg-white dark:focus:bg-[#161f30] cursor-pointer">
                                    <option value="ALLA">Visa Alla</option>
                                    <option value="BOKAD">Bokad (Ny)</option>
                                    <option value="OFFERERAD">Offererad</option>
                                    <option value="KLAR">Stängd (Klar)</option>
                                    <option value="FAKTURERAS">Faktureras</option>
                                </select>
                            </div>
                        </div>
                        
                        {/* KNAPPAR */}
                        <div className="mt-6 sm:mt-5 pt-5 sm:pt-5 border-t border-zinc-100 dark:border-white/5 flex flex-col-reverse sm:flex-row sm:items-center justify-between gap-3">
                            <button onClick={() => { setAdvFilters({status: 'ALLA', dateStart: '', dateEnd: ''}); setSearchQuery(''); }} className="w-full sm:w-auto px-6 py-3 sm:py-2.5 bg-transparent border border-zinc-300 dark:border-zinc-600 text-zinc-600 dark:text-zinc-300 text-[13px] sm:text-[11px] font-bold uppercase tracking-wider rounded-xl sm:rounded-lg hover:bg-zinc-100 dark:hover:bg-white/5 transition-colors shadow-sm">
                                Återställ sökning
                            </button>
                            <button 
                                onClick={() => {
                                    const q = searchQuery.toUpperCase().trim();
                                    let parsedReg = '';
                                    let parsedName = '';

                                    if (q.includes(' ')) {
                                        const parts = q.split(/\s+/);
                                        parts.forEach(part => {
                                            if (part.length >= 5 && part.length <= 6 && /\d/.test(part) && !parsedReg) {
                                                parsedReg = part;
                                            } else {
                                                parsedName += (parsedName ? ' ' : '') + part;
                                            }
                                        });
                                    } else {
                                        const isRegnr = q.length > 0 && q.length <= 6 && /\d/.test(q);
                                        if (isRegnr) parsedReg = q;
                                        else parsedName = q;
                                    }
                                    
                                    setFormData(p => ({ 
                                        ...p, 
                                        regnr: parsedReg, 
                                        kundnamn: parsedName,
                                        bilmodell: '', motorkod: '', årsmodell: '', vin: '', miltal: '', oljevolym: '',
                                        datum: new Date().toISOString().split('T')[0], tid: '16:30', status: 'BOKAD', paket: 'Standard', kundpris: '', kommentar: ''
                                    }));
                                    
                                    setExpenses([{ desc: '', antal: '1', amount: '', type: 'arbetsoperation' }, { desc: '', antal: '1', amount: '', type: 'reservdel' }]); 
                                    setPayments([{ desc: '', amount: '' }]); 
                                    setActiveJob(null);
                                    setIsEditingVehicle(false); 
                                    window.location.hash = '#new_job_form';
                                    setStep('DETAIL');
                                }}
                                className="w-full sm:w-auto px-5 py-4 sm:py-2.5 bg-[#f97316] hover:bg-[#ea580c] text-white text-[14px] sm:text-[12px] font-bold uppercase tracking-wider rounded-xl sm:rounded-lg transition-colors shadow-md sm:shadow-sm flex items-center justify-center gap-2"
                            >
                                <SafeIcon name="plus" size={16} /> SKAPA NYTT JOBB
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
                                                                        
                                                                        <button type="button" onClick={(e) => { 
                                                                            e.stopPropagation(); 
                                                                            setFormData(p => ({ ...p, kundnamn: job.kundnamn || '', regnr: job.regnr || '', bilmodell: job.bilmodell || '', motorkod: job.motorkod || '', årsmodell: job.årsmodell || '', vin: job.vin || '', miltal: job.miltal || '', datum: today, tid: '16:30', status: 'BOKAD', paket: 'Standard', kundpris: '0', kommentar: '' }));
                                                                            setExpenses(emptyExpenses); setPayments(emptyPayments); setActiveJob(null); setStep('DETAIL');
                                                                        }} className="px-3 py-1 rounded border border-[#168a9c]/50 text-[#168a9c] hover:bg-[#168a9c] hover:text-white text-[11px] font-bold uppercase tracking-wider transition-colors">Skapa ny order</button>

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
                        isFiltering ? ( 
                            <div className="w-full flex flex-col items-center justify-center py-20 mt-4 text-zinc-400">
                                <SafeIcon name="search-x" size={32} className="mb-4 opacity-50" />
                                <span className="text-[14px] font-medium">Inga uppdrag hittades för din sökning.</span>
                            </div>
                        ) : (
                            <div className="w-full flex flex-col items-center justify-center py-6 pb-24 lg:py-32 mt-0 animate-in fade-in slide-in-from-bottom-4 duration-500">
                                <div className="relative flex items-center justify-center mb-3 lg:mb-6">
                                    {/* Mjuk glow-effekt bakom ikonen */}
                                    <div className="absolute inset-0 bg-orange-500/10 dark:bg-orange-500/5 blur-xl lg:blur-3xl rounded-full scale-150"></div>
                                    
                                    {/* Svävande, polerad ikon-cirkel (Mycket mindre och tajtare på mobil) */}
                                    <div className="w-16 h-16 lg:w-24 lg:h-24 rounded-full bg-white dark:bg-[#1e293b] shadow-[0_4px_20px_rgba(0,0,0,0.04)] dark:shadow-[0_10px_40px_rgba(0,0,0,0.3)] border border-zinc-100 dark:border-white/5 flex items-center justify-center relative z-10 transition-transform duration-700 hover:scale-105 hover:shadow-[0_15px_50px_rgba(234,88,12,0.1)]">
                                        <SafeIcon name="car" size={24} className="text-zinc-300 dark:text-zinc-600 lg:w-[36px] lg:h-[36px]" />
                                    </div>
                                </div>
                                
                                {/* Stilren text med tajtare marginaler */}
                                <h3 className="text-[15px] lg:text-lg font-semibold text-zinc-700 dark:text-zinc-200 tracking-tight mb-1 lg:mb-2 text-center">
                                    Sök i orderhistoriken
                                </h3>
                                <p className="text-[11px] lg:text-[13px] text-zinc-400 dark:text-zinc-500 max-w-[240px] lg:max-w-[300px] text-center leading-relaxed px-2">
                                    Börja skriva ovan för att hitta fordon och uppdrag.
                                </p>
                            </div>
                        )
                    )}
                </div>
            )}

            {/* === DETALJ VY (Blanketten) === */}
            {step === 'DETAIL' && (
                <div className="px-4 lg:px-0 pb-0 lg:pb-6">
                    <form onSubmit={handleSave} className="flex flex-col lg:flex-row gap-3 lg:gap-8 relative lg:items-stretch mt-0 lg:mt-4">
                        
                        {/* === VÄNSTER KOLUMN === */}
                        <div className="flex-1 flex flex-col min-w-0 order-2 lg:order-1">
                            
                            {/* INMATNINGSFÄLT STEG 2 (Visas enbart för nya, osparade ordrar) */}
                            {!activeJob && showGrunduppgifter && (
                                <div className="w-full mb-6 bg-orange-50/50 dark:bg-orange-500/5 border border-orange-200 dark:border-orange-500/20 p-5 rounded-sm shadow-sm animate-in fade-in slide-in-from-top-2 relative">
                                    
                                    {/* STÄNG-KRYSS HÖGST UPP TILL HÖGER */}
                                    <button 
                                        type="button" 
                                        disabled={!(formData.regnr && formData.kundnamn && formData.datum && formData.tid)}
                                        onClick={() => setShowGrunduppgifter(false)}
                                        className={`absolute top-4 right-4 p-1 transition-colors ${
                                            (formData.regnr && formData.kundnamn && formData.datum && formData.tid) 
                                                ? 'text-orange-400 hover:text-orange-600 dark:text-orange-500 dark:hover:text-orange-300 cursor-pointer' 
                                                : 'text-zinc-300 dark:text-zinc-600 cursor-not-allowed'
                                        }`}
                                        title={(formData.regnr && formData.kundnamn && formData.datum && formData.tid) ? "Dölj rutan" : "Fyll i alla uppgifter för att stänga"}
                                    >
                                        <SafeIcon name="x" size={16} />
                                    </button>

                                    <h2 className="text-[16px] font-bold text-orange-800 dark:text-orange-400 mb-4 uppercase tracking-wider flex items-center gap-2">
                                        <SafeIcon name="file-text" size={18} /> Grunduppgifter för ny order
                                    </h2>
                                    
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                                        {/* REGNR FÄLT */}
                                        <div className="relative z-20">
                                            <label className="block text-[11px] font-bold text-orange-700/70 dark:text-orange-400/70 uppercase tracking-wider mb-1.5">Registreringsnummer</label>
                                            <div className="relative">
                                                <input 
                                                    type="text" 
                                                    value={formData.regnr} 
                                                    onChange={e => setFormData(p => ({ ...p, regnr: e.target.value.toUpperCase().replace(/\s+/g, '') }))} 
                                                    onFocus={() => setFocusedInput('steg2_regnr')}
                                                    onBlur={() => setTimeout(() => setFocusedInput(null), 150)}
                                                    placeholder="T.ex. RMK887"
                                                    className="w-full bg-white dark:bg-black/20 border border-orange-200 dark:border-orange-500/30 px-3 py-2.5 rounded-sm outline-none text-zinc-900 dark:text-white font-bold uppercase focus:border-orange-500 transition-colors shadow-sm" 
                                                />
                                                <button 
                                                    type="button"
                                                    onClick={() => {
                                                        if (!formData.regnr) { alert("Skriv in ett regnr först!"); return; }
                                                        // Skickar den smarta signalen till Chrome-tillägget för Car.info + Oljemagasinet
                                                        window.postMessage({ action: 'BMG_REMOTE_SEARCH', regnr: formData.regnr, engine: 'combo-ci-om' }, '*');
                                                    }}
                                                    className={`absolute right-1 top-1 bottom-1 px-3 rounded text-[10px] font-bold uppercase tracking-wider transition-colors flex items-center gap-1.5 z-10 ${
                                                        (fetchedCarInfo && (fetchedCarInfo.bilmodell || fetchedCarInfo.vin))
                                                            ? 'bg-emerald-100 hover:bg-emerald-200 dark:bg-emerald-500/20 dark:hover:bg-emerald-500/40 text-emerald-700 dark:text-emerald-300'
                                                            : 'bg-orange-100 hover:bg-orange-200 dark:bg-orange-500/20 dark:hover:bg-orange-500/40 text-orange-700 dark:text-orange-300'
                                                    }`}
                                                    title="Hämta från Transportstyrelsen"
                                                >
                                                    {(fetchedCarInfo && (fetchedCarInfo.bilmodell || fetchedCarInfo.vin)) ? (
                                                        <><SafeIcon name="check" size={12} /> Hämtad</>
                                                    ) : (
                                                        <><SafeIcon name="refresh-cw" size={12} /> Hämta</>
                                                    )}
                                                </button>
                                            </div>
                                            
                                            {/* DROPDOWN FÖR REGNR */}
                                            {focusedInput === 'steg2_regnr' && activeRegnrSuggestions.length > 0 && (
                                                <div className="absolute top-full left-0 mt-1 w-full max-h-48 overflow-y-auto bg-white dark:bg-[#1e293b] border border-zinc-200 dark:border-white/10 shadow-xl rounded-sm z-[100] animate-in fade-in slide-in-from-top-1">
                                                    {activeRegnrSuggestions.map(r => {
                                                        const linkedJob = allJobs.find(j => j.regnr?.toUpperCase().replace(/\s+/g, '') === r);
                                                        const linkedName = linkedJob ? linkedJob.kundnamn : '';
                                                        return (
                                                            <div key={r} onMouseDown={(e) => {
                                                                e.preventDefault(); 
                                                                setFormData(p => ({ ...p, regnr: r, kundnamn: p.kundnamn ? p.kundnamn : linkedName }));
                                                                setFocusedInput(null);
                                                            }} className="px-3 py-2 text-[13px] font-bold text-zinc-800 dark:text-zinc-200 hover:bg-[#ea580c] hover:text-white cursor-pointer transition-colors border-b border-zinc-100 dark:border-white/5 last:border-0 flex justify-between items-center group">
                                                                <span>{r}</span>
                                                                {linkedName && <span className="text-[10px] font-normal opacity-60 group-hover:opacity-90 truncate max-w-[120px]">{linkedName}</span>}
                                                            </div>
                                                        )
                                                    })}
                                                </div>
                                            )}
                                        </div>

                                        {/* KUNDNAMN FÄLT */}
                                        <div className="relative z-10">
                                            <label className="block text-[11px] font-bold text-orange-700/70 dark:text-orange-400/70 uppercase tracking-wider mb-1.5">Kundnamn</label>
                                            <input 
                                                type="text" 
                                                value={formData.kundnamn} 
                                                onChange={e => setFormData(p => ({ ...p, kundnamn: e.target.value.toUpperCase() }))} 
                                                onFocus={() => setFocusedInput('steg2_kundnamn')}
                                                onBlur={() => setTimeout(() => setFocusedInput(null), 150)}
                                                placeholder="T.ex. ANDERS"
                                                className="w-full bg-white dark:bg-black/20 border border-orange-200 dark:border-orange-500/30 px-3 py-2.5 rounded-sm outline-none text-zinc-900 dark:text-white font-bold uppercase focus:border-orange-500 transition-colors shadow-sm" 
                                            />
                                            
                                            {/* DROPDOWN FÖR KUNDNAMN */}
                                            {focusedInput === 'steg2_kundnamn' && activeKundSuggestions.length > 0 && (
                                                <div className="absolute top-full left-0 mt-1 w-full max-h-48 overflow-y-auto bg-white dark:bg-[#1e293b] border border-zinc-200 dark:border-white/10 shadow-xl rounded-sm z-[100] animate-in fade-in slide-in-from-top-1">
                                                    {activeKundSuggestions.map(c => {
                                                        const linkedJob = allJobs.find(j => j.kundnamn?.toUpperCase().trim() === c.toUpperCase());
                                                        const linkedReg = linkedJob ? linkedJob.regnr : '';
                                                        return (
                                                            <div key={c} onMouseDown={(e) => {
                                                                e.preventDefault(); 
                                                                setFormData(p => ({ ...p, kundnamn: c.toUpperCase(), regnr: p.regnr ? p.regnr : linkedReg }));
                                                                setFocusedInput(null);
                                                            }} className="px-3 py-2 text-[13px] font-bold text-zinc-800 dark:text-zinc-200 hover:bg-[#ea580c] hover:text-white cursor-pointer transition-colors border-b border-zinc-100 dark:border-white/5 last:border-0 flex justify-between items-center group">
                                                                <span className="truncate">{c}</span>
                                                                {linkedReg && <span className="text-[10px] font-normal opacity-60 group-hover:opacity-90">{linkedReg}</span>}
                                                            </div>
                                                        )
                                                    })}
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    {/* DATUM & TID */}
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 border-t border-orange-200/50 dark:border-orange-500/20 pt-4">
                                        <div>
                                            <label className="block text-[11px] font-bold text-orange-700/70 dark:text-orange-400/70 uppercase tracking-wider mb-1.5">Bokat datum</label>
                                            <input 
                                                type="date" 
                                                value={formData.datum} 
                                                onChange={e => setFormData(p => ({ ...p, datum: e.target.value }))} 
                                                onClick={e => e.target.showPicker && e.target.showPicker()}
                                                className="w-full cursor-pointer bg-white dark:bg-black/20 border border-orange-200 dark:border-orange-500/30 px-3 py-2.5 rounded-sm outline-none text-zinc-900 dark:text-white font-bold uppercase focus:border-orange-500 transition-colors shadow-sm" 
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-[11px] font-bold text-orange-700/70 dark:text-orange-400/70 uppercase tracking-wider mb-1.5">Tid</label>
                                            <input 
                                                type="time" 
                                                value={formData.tid} 
                                                onChange={e => setFormData(p => ({ ...p, tid: e.target.value }))} 
                                                onClick={e => e.target.showPicker && e.target.showPicker()}
                                                className="w-full cursor-pointer bg-white dark:bg-black/20 border border-orange-200 dark:border-orange-500/30 px-3 py-2.5 rounded-sm outline-none text-zinc-900 dark:text-white font-bold uppercase focus:border-orange-500 transition-colors shadow-sm" 
                                            />
                                        </div>
                                    </div>
                                    
                                    <div className="mt-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-t border-orange-200/50 dark:border-orange-500/20 pt-4">
                                        <p className="text-[11px] text-orange-600/70 dark:text-orange-400/70 italic flex items-center gap-1.5">
                                            <SafeIcon name="info" size={12} /> Synkas direkt till korten. Döljs när du sparar.
                                        </p>
                                        <button 
                                            type="button" 
                                            disabled={!(formData.regnr && formData.kundnamn && formData.datum && formData.tid)}
                                            onClick={() => setShowGrunduppgifter(false)}
                                            className={`w-full sm:w-auto px-5 py-2 text-[11px] font-bold uppercase tracking-wider rounded-sm transition-colors flex items-center justify-center gap-1.5 ${
                                                (formData.regnr && formData.kundnamn && formData.datum && formData.tid) 
                                                    ? 'bg-orange-100 hover:bg-orange-200 dark:bg-orange-500/20 dark:hover:bg-orange-500/40 text-orange-700 dark:text-orange-300 cursor-pointer' 
                                                    : 'bg-zinc-100 dark:bg-white/5 text-zinc-400 dark:text-zinc-600 cursor-not-allowed'
                                            }`}
                                        >
                                            <SafeIcon name="check" size={14} /> FÄRDIG, DÖLJ RUTAN
                                        </button>
                                    </div>
                                </div>
                            )}
                            
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
                                                <select 
                                                    value={formData.paket?.startsWith('Oljebyte') ? 'Oljebyte' : formData.paket} 
                                                    onChange={e => handlePackageChange(e.target.value)} 
                                                    className="bg-transparent text-[11px] font-bold uppercase tracking-wider text-[#168a9c] outline-none cursor-pointer"
                                                >
                                                    <option value="Standard">Standard (Flexibel)</option>
                                                    <option value="Oljebyte">Oljebyte</option>
                                                    <option value="Hjulskifte">Hjulskifte</option>
                                                    <option value="Hjulinställning">Hjulinställning</option>
                                                    <option value="Felsökning">Felsökning</option>
                                                    <option disabled>── TILLÄGG x ──</option>
                                                    <option value="DigitalStampel">+ Digital stämpel (500 kr)</option>
                                                    <option value="AddBromsvatska">+ Bromsvätskebyte (550 kr)</option>
                                                    <option value="AddArbete100">+ Extra arbete (100 kr)</option>
                                                    <option value="AddArbete200">+ Extra arbete (200 kr)</option>
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
                                                                    <input placeholder={ex.type === 'arbetsoperation' ? "Arbetsoperation..." : "Reservdel..."} value={ex.desc || ''} onChange={e => handleUpdateExpense(i, 'desc', e.target.value)} className="w-full bg-transparent outline-none text-[#168a9c] hover:underline cursor-text text-[13px] py-0.5" />
                                                                </div>
                                                            </td>
                                                            
                                                            {/* Döljs på mobilen */}
                                                            <td className="hidden sm:table-cell p-1 sm:p-2 border-r border-zinc-200 dark:border-white/10 text-center">
                                                                <input type="number" value={ex.antal || ''} onChange={e => handleUpdateExpense(i, 'antal', e.target.value)} placeholder="1" className="w-full bg-transparent outline-none text-center text-[13px]" />
                                                            </td>
                                                            
                                                            <td className="p-1 sm:p-2">
                                                                <div className="flex items-center justify-end gap-1 px-1">
                                                                    <input type="number" value={ex.amount || ''} onChange={e => handleUpdateExpense(i, 'amount', e.target.value)} placeholder="0" className="w-full min-w-0 bg-transparent outline-none text-right font-mono text-[13px]" />
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
                                <div className="w-full border border-zinc-200 dark:border-white/10 rounded-sm flex flex-col md:flex-row overflow-hidden bg-white dark:bg-[#1e293b] shadow-sm">
                                    
                                    {/* VÄNSTER SIDA: DELBETALNINGAR */}
                                    <div className="flex-1 border-b md:border-b-0 md:border-r border-zinc-200 dark:border-white/10 flex flex-col p-4 bg-white dark:bg-transparent">
                                        <div className="flex items-center justify-between mb-3">
                                            <span className="font-bold text-[11px] text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">Delbetalningar</span>
                                            <button type="button" onClick={() => setPayments([...payments, { desc: '', amount: '' }])} className="text-[10px] font-bold text-[#168a9c] border border-[#168a9c] hover:bg-[#168a9c] hover:text-white transition-colors uppercase px-2 py-1 rounded-sm flex items-center gap-1">
                                                <SafeIcon name="plus" size={10} /> Lägg till
                                            </button>
                                        </div>
                                        <div className="space-y-1.5">
                                            {payments.map((p, i) => (
                                                <div key={i} className="flex gap-2 items-center">
                                                    <input 
                                                        placeholder="T.ex. Swish" 
                                                        value={p.desc} 
                                                        onChange={e => { const n = [...payments]; n[i].desc = e.target.value; setPayments(n); }} 
                                                        className="flex-1 bg-zinc-50 dark:bg-[#141c2b] border border-zinc-200 dark:border-white/10 py-1.5 px-2 text-[13px] outline-none rounded-sm text-zinc-900 dark:text-white focus:border-[#168a9c] transition-colors" 
                                                    />
                                                    <div className="relative w-[100px] shrink-0 flex items-center">
                                                        <input 
                                                            placeholder="0" 
                                                            type="number" 
                                                            value={p.amount} 
                                                            onChange={e => { const n = [...payments]; n[i].amount = e.target.value; setPayments(n); }} 
                                                            className="w-full bg-zinc-50 dark:bg-[#141c2b] border border-zinc-200 dark:border-white/10 py-1.5 pl-2 pr-6 text-[13px] font-mono outline-none text-right rounded-sm focus:border-[#168a9c] transition-colors" 
                                                        />
                                                        <span className="absolute right-2 text-[10px] text-zinc-400 font-bold uppercase pointer-events-none">kr</span>
                                                    </div>
                                                    <button 
                                                        type="button" 
                                                        onClick={() => { const n = payments.filter((_, idx) => idx !== i); if(n.length===0) n.push({desc:'', amount:''}); setPayments(n); }} 
                                                        className="text-zinc-400 hover:text-red-500 p-1 transition-colors"
                                                    >
                                                        <SafeIcon name="trash-2" size={14} />
                                                    </button>
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    {/* HÖGER SIDA: SUMMA */}
                                    <div className="flex-1 flex flex-col p-4 bg-zinc-50/50 dark:bg-[#161f30]/30">
                                        <div className="font-bold text-[11px] text-zinc-500 dark:text-zinc-400 mb-1 uppercase tracking-wider">Summa (inkl. moms)</div>
                                        <div className="flex items-baseline justify-end mb-4">
                                            <input 
                                                type="number" 
                                                value={formData.kundpris == 0 ? '' : formData.kundpris} 
                                                onChange={e => setFormData(p => ({ ...p, kundpris: e.target.value }))} 
                                                className="w-full bg-transparent text-zinc-900 dark:text-white text-3xl font-light tracking-tighter outline-none text-right focus:text-[#168a9c] transition-colors" 
                                                placeholder="0" 
                                            />
                                            <span className="text-[13px] font-bold text-zinc-400 ml-1.5 shrink-0 uppercase">SEK</span>
                                        </div>
                                        
                                        <div className="mt-auto flex flex-col gap-2 pt-3 border-t border-zinc-200 dark:border-white/10">
                                            <div className="flex justify-between items-center text-[13px]">
                                                <span className="font-medium text-zinc-500 dark:text-zinc-400">Inbetalt hittills:</span>
                                                <span className="font-mono font-medium text-emerald-600 dark:text-emerald-400">{totalPaid.toLocaleString()} kr</span>
                                            </div>
                                            
                                            {totalPaid > 0 && (
                                                <div className="flex justify-between items-center text-[13px]">
                                                    <span className="text-zinc-900 dark:text-white">Kvar att betala:</span>
                                                    <span className="font-mono font-bold text-orange-600 dark:text-orange-400 text-[14px]">
                                                        {Math.max(0, (parseFloat(formData.kundpris) || 0) - totalPaid).toLocaleString()} kr
                                                    </span>
                                                </div>
                                            )}
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
                                <div className={`bg-white border border-zinc-200 rounded-sm shadow-sm dark:bg-[#1e293b] dark:border-white/10 overflow-hidden ${!activeJob && showGrunduppgifter ? 'hidden lg:block' : 'block'}`}>
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
                                    
                                    <div className="flex flex-col py-2 bg-white dark:bg-[#1e293b]">
                                        {[
                                            { label: 'Reg.Nr.:', val: formData.regnr, id: 'regnr', uppercase: true, action: (v) => setFormData(p => ({...p, regnr: (v || '').toUpperCase()})) },
                                            { label: 'Ch.nr:', val: fetchedCarInfo?.vin, id: 'vin', uppercase: true, action: (v) => handleSpecChange('vin', (v || '').toUpperCase()), blur: (v) => saveSpec('vin', v || '') },
                                            { label: 'Motor:', val: fetchedCarInfo?.motorkod, id: 'motorkod', uppercase: true, action: (v) => handleSpecChange('motorkod', v || ''), blur: (v) => saveSpec('motorkod', v || '') },
                                            { label: 'År:', val: fetchedCarInfo?.årsmodell, id: 'årsmodell', action: (v) => handleSpecChange('årsmodell', v || ''), blur: (v) => saveSpec('årsmodell', v || '') },
                                            { label: 'Miltal:', val: fetchedCarInfo?.miltal, id: 'miltal', action: (v) => handleSpecChange('miltal', v || ''), blur: (v) => saveSpec('miltal', v || '') },
                                            { label: 'Olje:', val: fetchedCarInfo?.oljevolym, id: 'oljevolym', action: (v) => handleSpecChange('oljevolym', v || ''), blur: (v) => saveSpec('oljevolym', v || '') }
                                        ].map((f, idx) => (
                                            <div key={f.id} className={`flex items-center group min-h-[26px] px-4 text-[13px] transition-colors duration-300 ${copiedField === f.id ? 'bg-emerald-50 dark:bg-emerald-500/10' : (idx % 2 === 0 ? 'bg-white dark:bg-[#1e293b]' : 'bg-zinc-50/50 dark:bg-[#161f30]/50')}`}>
                                                <span className="font-bold text-zinc-900 dark:text-white w-[75px] shrink-0 text-[10px] uppercase tracking-wider">{f.label}</span>
                                                {isEditingVehicle ? (
                                                    <div className="relative w-full">
                                                        <input 
                                                            type="text"
                                                            value={f.val || ''} 
                                                            onChange={e => f.action(e.target.value)}
                                                            onFocus={() => setFocusedInput(f.id)}
                                                            onBlur={e => { setTimeout(() => setFocusedInput(null), 200); if (f.blur) f.blur(e.target.value); }}
                                                            className={`w-full bg-zinc-100 dark:bg-black/20 border border-zinc-200 dark:border-white/10 px-1.5 py-0.5 rounded-sm outline-none text-zinc-900 dark:text-white ${f.uppercase ? 'uppercase' : ''}`} 
                                                            placeholder="-" 
                                                        />
                                                        {focusedInput === 'regnr' && f.id === 'regnr' && f.val && uniqueRegnrs.filter(r => r.includes(f.val.toUpperCase()) && r !== f.val.toUpperCase()).length > 0 && (
                                                            <div className="absolute top-full left-0 mt-1 w-[130%] max-h-32 overflow-y-auto bg-white dark:bg-[#1e293b] border border-zinc-200 dark:border-white/10 shadow-xl rounded-sm z-[100]">
                                                                {uniqueRegnrs.filter(r => r.includes(f.val.toUpperCase()) && r !== f.val.toUpperCase()).map(r => (
                                                                    <div key={r} onMouseDown={() => f.action(r)} className="px-3 py-2 text-[13px] font-bold text-zinc-800 dark:text-zinc-200 hover:bg-[#168a9c] hover:text-white cursor-pointer transition-colors border-b border-zinc-100 dark:border-white/5 last:border-0">
                                                                        {r}
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        )}
                                                    </div>
                                                ) : (
                                                    <div 
                                                        onClick={() => { if(f.val) { navigator.clipboard.writeText(f.val); setCopiedField(f.id); setTimeout(() => setCopiedField(null), 2000); } }}
                                                        className={`w-full bg-transparent cursor-pointer flex items-center justify-between transition-colors duration-300 ${copiedField === f.id ? 'text-emerald-600 dark:text-emerald-400 font-medium' : 'text-zinc-800 dark:text-zinc-200 hover:text-[#168a9c]'} ${f.uppercase ? 'uppercase' : ''}`}
                                                        title={f.val ? "Klicka för att kopiera" : ""}
                                                    >
                                                        <span className="truncate">{f.val || '-'}</span>
                                                        {copiedField === f.id ? <SafeIcon name="check" size={14} className="text-emerald-500 shrink-0" /> : (f.val && <SafeIcon name="copy" size={12} className="opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />)}
                                                    </div>
                                                )}
                                            </div>
                                        ))}
                                        {isEditingVehicle && (
                                            <div className="px-4 pb-3 pt-3">
                                                {/* Vi använder din befintliga smarta meny här istället! */}
                                                {window.AutoSearchMenu ? (
                                                    <window.AutoSearchMenu regnr={formData.regnr} variant="full" />
                                                ) : (
                                                    <button type="button" onClick={() => { if (!formData.regnr) { alert("Skriv in ett regnr först!"); return; } if (window.osSearchVehicle) window.osSearchVehicle(formData.regnr, 'START_OS_RADAR', true); }} className="w-full py-2 border border-[#168a9c] text-[#168a9c] hover:bg-[#168a9c] hover:text-white rounded-sm text-[11px] font-bold uppercase tracking-wider transition-colors flex items-center justify-center gap-1.5 shadow-sm">
                                                        <SafeIcon name="refresh-cw" size={14} /> Hämta Fordonsdata
                                                    </button>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Kund- och Datumkortet */}
                                <div className={`bg-white border border-zinc-200 rounded-sm shadow-sm dark:bg-[#1e293b] dark:border-white/10 overflow-hidden relative ${!activeJob && showGrunduppgifter ? 'hidden lg:block' : 'block'}`}>
                                    <div className="flex items-center gap-3 px-4 py-3 bg-zinc-50 dark:bg-[#161f30] border-b border-zinc-200 dark:border-white/10">
                                        {(() => {
                                            const cleanName = (formData.kundnamn || '').toUpperCase().trim();
                                            // Räkna antal ordrar på denna kund
                                            const visitCount = cleanName.length > 1 ? allJobs.filter(j => (j.kundnamn || '').toUpperCase().trim() === cleanName).length : 0;
                                            const isVIP = visitCount >= 3; // Gränsen för att bli guld-stammis

                                            return (
                                                <>
                                                    <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-[14px] shrink-0 transition-all duration-500 relative ${
                                                        isVIP 
                                                        ? 'bg-gradient-to-br from-yellow-300 to-amber-500 border border-yellow-400 text-amber-950 shadow-[0_0_15px_rgba(245,158,11,0.3)]' 
                                                        : 'bg-zinc-200 dark:bg-[#161f30] border border-zinc-300 dark:border-white/5 text-zinc-500 shadow-sm'
                                                    }`}
                                                    title={isVIP ? `Stammis: ${visitCount} tidigare besök` : `${visitCount} tidigare besök`}
                                                    >
                                                        {formData.kundnamn ? formData.kundnamn.substring(0,2).toUpperCase() : '??'}
                                                        {isVIP && (
                                                            <div className="absolute -top-1 -right-1 bg-white dark:bg-[#1e293b] w-4 h-4 rounded-full flex items-center justify-center shadow-sm border border-amber-200 dark:border-white/10 text-[9px]">
                                                                ⭐
                                                            </div>
                                                        )}
                                                    </div>
                                                    
                                                    <div className="flex-1 min-w-0 flex flex-col relative">
                                                        <input 
                                                            type="text" 
                                                            value={formData.kundnamn || ''} 
                                                            onChange={e => setFormData(p => ({ ...p, kundnamn: e.target.value.toUpperCase() }))} 
                                                            onFocus={() => setFocusedInput('kundnamn')}
                                                            onBlur={() => setTimeout(() => setFocusedInput(null), 200)}
                                                            placeholder="Kundens namn"
                                                            className="w-full bg-transparent outline-none font-bold text-[14px] text-[#168a9c] hover:underline underline-offset-2 truncate" 
                                                        />
                                                        {focusedInput === 'kundnamn' && formData.kundnamn && uniqueCustomers.filter(c => c.toUpperCase().includes(formData.kundnamn.toUpperCase()) && c.toUpperCase() !== formData.kundnamn.toUpperCase()).length > 0 && (
                                                            <div className="absolute top-full left-0 mt-1 w-[150%] max-h-40 overflow-y-auto bg-white dark:bg-[#1e293b] border border-zinc-200 dark:border-white/10 shadow-xl rounded-sm z-[100]">
                                                                {uniqueCustomers.filter(c => c.toUpperCase().includes(formData.kundnamn.toUpperCase()) && c.toUpperCase() !== formData.kundnamn.toUpperCase()).map(c => (
                                                                    <div key={c} onMouseDown={() => setFormData(p => ({ ...p, kundnamn: c.toUpperCase() }))} className="px-3 py-2 text-[13px] font-bold text-zinc-800 dark:text-zinc-200 hover:bg-[#168a9c] hover:text-white cursor-pointer transition-colors border-b border-zinc-100 dark:border-white/5 last:border-0">
                                                                        {c}
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        )}
                                                        
                                                        <div className="flex items-center gap-1.5 mt-0.5">
                                                            <span className={`text-[12px] ${isVIP ? 'text-amber-600 dark:text-amber-500 font-bold' : 'text-zinc-500'}`}>
                                                                {isVIP ? 'Kund' : 'Kund'}
                                                            </span>
                                                            {visitCount > 0 && (
                                                                <span className={`text-[10px] ${isVIP ? 'text-amber-600/70 dark:text-amber-500/70' : 'text-zinc-400'}`}>
                                                                    ({visitCount} {visitCount === 1 ? 'besök' : 'besök'})
                                                                </span>
                                                            )}
                                                        </div>
                                                    </div>
                                                </>
                                            );
                                        })()}
                                    </div>
                                    
                                    {/* SMARTA KOPPLINGAR - Visas automatiskt när relationer hittas men fältet gapar tomt */}
                                    {(!formData.regnr && smartVehicleSuggestions.length > 0) && (
                                        <div className="bg-orange-50 dark:bg-orange-500/10 border-b border-orange-100 dark:border-orange-500/20 px-4 py-2.5 flex flex-col gap-2">
                                            <span className="text-[10px] font-bold text-orange-600 dark:text-orange-400 uppercase tracking-wider">Hittade fordon för {formData.kundnamn}</span>
                                            <div className="flex flex-wrap gap-2">
                                                {smartVehicleSuggestions.map(r => (
                                                    <button key={r} type="button" onClick={() => setFormData(p => ({...p, regnr: r}))} className="px-3 py-1.5 bg-white dark:bg-[#1e293b] border border-orange-200 dark:border-orange-500/30 text-orange-700 dark:text-orange-400 rounded-sm text-[11px] font-bold hover:bg-orange-500 hover:border-orange-500 hover:text-white transition-colors shadow-sm">
                                                        + KOPPLA {r}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                    
                                    {(!formData.kundnamn && smartCustomerSuggestions.length > 0) && (
                                        <div className="bg-emerald-50 dark:bg-emerald-500/10 border-b border-emerald-100 dark:border-emerald-500/20 px-4 py-2.5 flex flex-col gap-2">
                                            <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">Tidigare ägare av {formData.regnr}</span>
                                            <div className="flex flex-wrap gap-2">
                                                {smartCustomerSuggestions.map(c => (
                                                    <button key={c} type="button" onClick={() => setFormData(p => ({...p, kundnamn: c}))} className="px-3 py-1.5 bg-white dark:bg-[#1e293b] border border-emerald-200 dark:border-emerald-500/30 text-emerald-700 dark:text-emerald-400 rounded-sm text-[11px] font-bold hover:bg-emerald-500 hover:border-emerald-500 hover:text-white transition-colors shadow-sm">
                                                        + KOPPLA {c}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    <div className="flex flex-col py-2 bg-white dark:bg-[#1e293b]">
                                        <div className="flex items-center min-h-[26px] px-4 bg-white dark:bg-[#1e293b] text-[13px] relative group cursor-pointer" onClick={() => { const el = document.getElementById('bokat-datum-input'); if(el && el.showPicker) el.showPicker(); }}>
                                            <span className="font-bold text-zinc-900 dark:text-white w-[75px] shrink-0 text-[10px] uppercase tracking-wider">Bokat:</span>
                                            <input 
                                                id="bokat-datum-input"
                                                type="date" 
                                                value={formData.datum || ''} 
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
                                                value={formData.tid || ''} 
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
