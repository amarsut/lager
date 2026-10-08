// lager.js - AutoGrid EPC (Electronic Parts Catalogue) Premium Edition

// --- 1. SÄKER IKON-KOMPONENT ---
const SafeIcon = ({ name, size = 16, className = "" }) => (
    <span className={`inline-flex items-center justify-center shrink-0 ${className}`}>
        {window.Icon ? <window.Icon name={name} size={size} /> : <i data-lucide={name} width={size} height={size}></i>}
    </span>
);

// --- 2. EGNA TEKNISKA SVG-IKONER ---
const customIcons = {
    layers: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="12 2 2 7 12 12 22 7 12 2"></polygon><polyline points="2 12 12 17 22 12"></polyline><polyline points="2 17 12 22 22 17"></polyline></svg>`,
    settings: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"></circle><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path></svg>`,
    cpu: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="4" y="4" width="16" height="16" rx="2" ry="2"></rect><rect x="9" y="9" width="6" height="6"></rect><line x1="9" y1="1" x2="9" y2="4"></line><line x1="15" y1="1" x2="15" y2="4"></line><line x1="9" y1="20" x2="9" y2="23"></line><line x1="15" y1="20" x2="15" y2="23"></line><line x1="20" y1="9" x2="23" y2="9"></line><line x1="20" y1="14" x2="23" y2="14"></line><line x1="1" y1="9" x2="4" y2="9"></line><line x1="1" y1="14" x2="4" y2="14"></line></svg>`,
    zap: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"></polygon></svg>`,
    shield: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path></svg>`,
    disc: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="32" cy="32" r="28" /><circle cx="32" cy="32" r="10" /><circle cx="32" cy="25" r="2" /><circle cx="32" cy="39" r="2" /><circle cx="25" cy="32" r="2" /><circle cx="39" cy="32" r="2" /><path d="M12 20h12v24H12c-4 0-6-10-6-12s2-12 6-12z" /></svg>`,
    filter: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="10" y="24" width="44" height="32" rx="1" /><path d="M16 24v32" /><path d="M24 24v32" /><path d="M32 24v32" /><path d="M40 24v32" /><path d="M48 24v32" /><path d="M22 6v12" /><path d="M18 14l4 4 4-4" /><path d="M42 6v12" /><path d="M38 14l4 4 4-4" /></svg>`,
    wind: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="8" y="16" width="48" height="32" rx="2" /><rect x="4" y="12" width="56" height="6" rx="1" /><path d="M16 18v30" /><path d="M24 18v30" /><path d="M32 18v30" /><path d="M40 18v30" /><path d="M48 18v30" /></svg>`,
    droplet: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="16" y="20" width="32" height="40" rx="4" /><rect x="14" y="14" width="36" height="6" rx="2" /><path d="M24 14v-4h16v4" /><path d="M28 10V6h8v4" /><line x1="24" y1="20" x2="24" y2="60" /><line x1="32" y1="20" x2="32" y2="60" /><line x1="40" y1="20" x2="40" y2="60" /></svg>`,
    sparkplug: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M30 4h4v6h-4z" /><path d="M28 10h8v12h-8z" /><path d="M26 14h12" /><path d="M26 18h12" /><path d="M24 22h16v8h-16z" /><path d="M26 30h12v16h-12z" /><path d="M26 34h12" /><path d="M26 38h12" /><path d="M26 42h12" /><path d="M31 46h2v4h-2z" /><path d="M38 46v6H32" /></svg>`
};

// --- Hjälpfunktioner ---
const generateTrodoLink = (f) => f ? `https://www.trodo.se/catalogsearch/result/premium?filter[quality_group]=2&product_list_dir=asc&product_list_order=price&q=${encodeURIComponent(f.replace(/[\s-]/g, ''))}` : '#';
const generateThansenLink = (f) => f ? `https://www.thansen.se/search?query=${encodeURIComponent(f.replace(/[\s-]/g, ''))}` : '#';
const normalizeStr = (str) => (str || "").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/\s+/g, '');

// Automatisk VAG-formatering (03l115562 -> 03L 115 562)
const formatPartNumber = (str) => {
    if (!str) return 'SAKNAS';
    let clean = str.replace(/[\s-]/g, '').toUpperCase();
    const match = clean.match(/^([A-Z0-9]{3})([A-Z0-9]{3})([A-Z0-9]{3})(.*)$/);
    if (match) return `${match[1]} ${match[2]} ${match[3]} ${match[4]}`.trim();
    return clean;
};

// --- BILD-REGISTER (Ändra dina länkar här!) ---
const getDiagramImageLink = (category) => {
    const links = {
        'Alla': './icons/alla.png',
        'Bromsar': './icons/bromsar.png',
        'Motor': './icons/motor.png',
        'Chassi': './icons/chassi.png',
        'Elsystem': './icons/elsystem.png',
        'Service': './icons/service.png',
        'Kupéfilter': './icons/kupefilter.png',
        'Luftfilter': './icons/luftfilter.png',
        'Oljefilter': './icons/oljefilter.png',
        'Tändstift': './icons/tändstift.png',
        'Bränslefilter': './icons/bränslefilter.png',
        'Kaross': './icons/kaross.png',
        // 'Service': '/* LÄNK TILL SERVICE-BILD */'
    };
    return links[category] || links['Alla'];
};

// ==========================================
// MODALER
// ==========================================

const LagerScannerModal = ({ items, onOpenItem, onAddNewWithCode, onClose }) => {
    const [scannedCode, setScannedCode] = React.useState('');
    const [scanError, setScanError] = React.useState('');
    const inputRef = React.useRef(null);

    React.useEffect(() => { if (window.lucide) window.lucide.createIcons(); });
    React.useEffect(() => { if (inputRef.current) inputRef.current.focus(); }, []);

    const handleImageUpload = (e) => {
        const file = e.target.files[0];
        if (!file) return;
        alert(`Bild mottagen: ${file.name}\n(Här kan ett system för bildtolkning kopplas in i framtiden)`);
    };

    const handleCodeSubmit = (e) => {
        e.preventDefault();
        const cleanCode = scannedCode.trim().toUpperCase();
        if (!cleanCode) return;
        const foundItem = items.find(i => (i.service_filter || '').toUpperCase().replace(/[^A-Z0-9]/g, '') === cleanCode.replace(/[^A-Z0-9]/g, ''));
        if (foundItem) { onOpenItem(foundItem); onClose(); } else { setScanError(`Ingen träff i lagret för "${cleanCode}"`); }
    };

    return (
        <div className="fixed inset-0 z-[9999] flex items-end sm:items-center justify-center p-0 sm:p-4">
            <div className="absolute inset-0 bg-zinc-900/60 dark:bg-black/80 backdrop-blur-sm transition-opacity" onClick={onClose}></div>
            <div className="relative w-full h-[calc(100vh-5rem)] sm:h-auto max-w-md bg-white dark:bg-[#182032] text-zinc-900 dark:text-white rounded-t-3xl sm:rounded-3xl shadow-2xl border border-zinc-200 dark:border-white/10 p-6 animate-in slide-in-from-bottom sm:zoom-in-95 duration-200 flex flex-col justify-between mb-20 sm:mb-0 overflow-y-auto custom-scrollbar">
                <div>
                    <div className="flex justify-between items-center mb-6">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-orange-50 dark:bg-orange-500/10 text-orange-500 border border-orange-200 dark:border-orange-500/20 flex items-center justify-center shadow-sm"><SafeIcon name="scan" size={20} /></div>
                            <div>
                                <h2 className="text-sm font-black uppercase tracking-widest">Skanna Artikel</h2>
                                <p className="text-[10px] text-zinc-500 uppercase font-bold tracking-wider">Kamera eller Manuell inmatning</p>
                            </div>
                        </div>
                        <button onClick={onClose} className="w-8 h-8 flex items-center justify-center text-zinc-400 hover:text-zinc-900 dark:hover:text-white bg-zinc-100 dark:bg-[#121826] rounded-lg border border-zinc-200 dark:border-white/10"><SafeIcon name="x" size={14} /></button>
                    </div>
                    <form onSubmit={handleCodeSubmit} className="space-y-5">
                        <div className="grid grid-cols-2 gap-3">
                            <label className="relative h-28 bg-zinc-100 dark:bg-[#0f1522] rounded-2xl border-2 border-dashed border-zinc-300 dark:border-zinc-700 overflow-hidden flex flex-col items-center justify-center text-center p-3 group cursor-pointer hover:bg-zinc-200 dark:hover:bg-zinc-800 transition-colors">
                                <input type="file" accept="image/*" capture="environment" className="hidden" onChange={handleImageUpload} />
                                <SafeIcon name="camera" size={28} className="text-zinc-400 group-hover:text-orange-500 transition-colors mb-2" />
                                <span className="text-[11px] font-bold uppercase tracking-widest">Kamera</span>
                                <span className="text-[8px] text-zinc-500 mt-1 max-w-[90%] leading-relaxed">Öppna direkt</span>
                            </label>
                            <label className="relative h-28 bg-zinc-100 dark:bg-[#0f1522] rounded-2xl border-2 border-dashed border-zinc-300 dark:border-zinc-700 overflow-hidden flex flex-col items-center justify-center text-center p-3 group cursor-pointer hover:bg-zinc-200 dark:hover:bg-zinc-800 transition-colors">
                                <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
                                <SafeIcon name="image" size={28} className="text-zinc-400 group-hover:text-orange-500 transition-colors mb-2" />
                                <span className="text-[11px] font-bold uppercase tracking-widest">Välj fil</span>
                                <span className="text-[8px] text-zinc-500 mt-1 max-w-[90%] leading-relaxed">Från bibliotek</span>
                            </label>
                        </div>
                        <div className="relative">
                            <input
                                ref={inputRef} type="text" value={scannedCode} onChange={e => { setScannedCode(e.target.value); setScanError(''); }}
                                className="w-full bg-zinc-50 dark:bg-[#0f1522] border border-zinc-200 dark:border-white/10 rounded-xl px-4 py-3 text-center text-sm font-mono font-bold tracking-widest outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all shadow-inner text-zinc-900 dark:text-white"
                                placeholder="Art. nummer eller streckkod"
                            />
                        </div>
                        {scanError && (
                            <div className="bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 rounded-xl p-4 text-center animate-in fade-in zoom-in-95 duration-200 flex flex-col gap-3">
                                <p className="text-xs font-bold text-red-600 dark:text-red-400">{scanError}</p>
                                <div className="flex gap-2">
                                    <a href={generateTrodoLink(scannedCode)} target="_blank" rel="noopener noreferrer" className="flex-1 h-10 bg-white dark:bg-[#121826] hover:bg-zinc-50 border border-zinc-200 dark:border-white/10 rounded-lg text-[10px] font-bold text-zinc-700 dark:text-zinc-300 uppercase tracking-widest flex items-center justify-center gap-1.5 shadow-sm transition-all"><SafeIcon name="external-link" size={12} /> Trodo</a>
                                    <a href={generateThansenLink(scannedCode)} target="_blank" rel="noopener noreferrer" className="flex-1 h-10 bg-white dark:bg-[#121826] hover:bg-zinc-50 border border-zinc-200 dark:border-white/10 rounded-lg text-[10px] font-bold text-zinc-700 dark:text-zinc-300 uppercase tracking-widest flex items-center justify-center gap-1.5 shadow-sm transition-all"><SafeIcon name="external-link" size={12} /> thansen</a>
                                </div>
                                <button type="button" onClick={() => { onAddNewWithCode(scannedCode.toUpperCase()); onClose(); }} className="w-full h-10 bg-orange-500 hover:bg-orange-600 text-white rounded-lg text-[10px] font-bold uppercase tracking-widest flex items-center justify-center gap-1.5 shadow-md transition-all"><SafeIcon name="plus" size={12} /> Lägg till i databasen</button>
                            </div>
                        )}
                        {!scanError && (
                            <button type="submit" className="w-full h-12 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-400 hover:to-orange-500 text-white font-bold text-xs uppercase tracking-widest rounded-xl shadow-[0_4px_14px_0_rgba(249,115,22,0.39)] transition-all flex items-center justify-center gap-2"><SafeIcon name="search" size={14} /> Sök i databas</button>
                        )}
                    </form>
                </div>
            </div>
        </div>
    );
};

const LagerSidePanel = ({ item, defaultMode = 'edit', allJobs = [], onClose }) => {
    const [mode, setMode] = React.useState(defaultMode);

    // --- EDIT STATE ---
    const [formData, setFormData] = React.useState({
        name: item?.name || '', price: item?.price || '', category: item?.category || 'Service',
        quantity: item?.quantity || '', service_filter: item?.service_filter || '', notes: item?.notes || ''
    });
    const isNew = !item?.id;

    // --- LINK STATE ---
    const [qty, setQty] = React.useState(1);
    const [search, setSearch] = React.useState('');
    const [selectedJob, setSelectedJob] = React.useState(null);
    const [isSaving, setIsSaving] = React.useState(false);

    React.useEffect(() => { if (window.lucide) window.lucide.createIcons(); });

    // --- EDIT LOGIC ---
    const handleSave = async (e) => {
        e.preventDefault();
        const dataToSave = { ...formData, price: parseInt(formData.price) || 0, quantity: parseInt(formData.quantity) || 0 };
        try {
            if (isNew) await window.db.collection("lager").add(dataToSave);
            else await window.db.collection("lager").doc(String(item.id)).update(dataToSave);
            onClose();
        } catch (err) { alert("Ett fel uppstod vid sparning."); }
    };

    const handleDelete = async () => {
        if (!isNew && confirm("Är du säker på att du vill radera denna artikel permanent?")) {
            try { await window.db.collection("lager").doc(String(item.id)).delete(); onClose(); } catch (err) { }
        }
    };

    // --- LINK LOGIC ---
    const activeJobs = React.useMemo(() => {
        let jobs = allJobs.filter(j => j.status !== 'FAKTURERAS' && !j.deleted);
        if (search) { 
            const s = search.toLowerCase(); 
            jobs = jobs.filter(j => (j.regnr || '').toLowerCase().includes(s) || (j.kundnamn || '').toLowerCase().includes(s)); 
        }
        jobs.sort((a, b) => (b.datum || '').localeCompare(a.datum || ''));
        // Visa endast de 5 senaste om man inte har skrivit något i sökrutan!
        return search ? jobs : jobs.slice(0, 5);
    }, [allJobs, search]);

    const handleLink = async (e) => {
        e.preventDefault();
        if (!selectedJob) return alert("Välj en arbetsorder först.");
        setIsSaving(true);
        try {
            const jobRef = window.db.collection('jobs').doc(String(selectedJob.id));
            const partRef = window.db.collection('lager').doc(String(item.id));

            await window.db.runTransaction(async (t) => {
                const jobDoc = await t.get(jobRef);
                const partDoc = await t.get(partRef);
                const pData = partDoc.data(), jData = jobDoc.data();

                t.update(partRef, { quantity: Math.max(0, (parseInt(pData.quantity) || 0) - qty), history: [...(pData.history || []), { date: new Date().toISOString(), action: 'KOPPLAD', qty: qty, regnr: jData.regnr || 'SAKNAS', jobId: String(selectedJob.id), kundnamn: jData.kundnamn || 'Okänd' }] });

                let utgifter = jData.utgifter || [];
                const cost = (parseFloat(pData.price) || 0) * qty;
                utgifter.push({ namn: qty > 1 ? `${qty}x ${pData.name}` : pData.name, kostnad: String(cost), qty: 1, partId: String(item.id), deducted: true });
                t.update(jobRef, { utgifter, kundpris: String((parseFloat(jData.kundpris) || 0) + cost) });
            });
            onClose();
        } catch (err) { setIsSaving(false); alert("Något gick fel vid kopplingen."); }
    };

    const InputClass = "w-full bg-zinc-50 dark:bg-[#0f1522] border border-zinc-200/80 dark:border-white/10 rounded-xl px-4 py-3 text-[13px] font-medium text-zinc-900 dark:text-white outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all shadow-inner";
    const LabelClass = "block text-[10px] font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-widest mb-1.5 ml-1";

    return (
        <div className="fixed inset-0 z-[9999] flex justify-end">
            {/* Mörk tonad bakgrund utan suddighet – precis som på dashboarden */}
            <div className="absolute inset-0 bg-zinc-900/60 dark:bg-black/70 transition-opacity animate-in fade-in duration-300" onClick={onClose}></div>
            
            {/* Sidopanelen (Lade till pb-[75px] för mobilen så att foten hamnar snyggt ovanför den svarta menyraden) */}
            <div className="relative w-full sm:max-w-md h-full bg-white dark:bg-[#182032] shadow-2xl border-l border-zinc-200 dark:border-white/10 flex flex-col animate-in slide-in-from-right duration-300">
                
                {/* Header med integrerade flikar */}
                <div className="flex flex-col bg-zinc-50/50 dark:bg-[#1a2235]/50 border-b border-zinc-200 dark:border-white/10 shrink-0">
                    <div className="px-5 py-4 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-orange-50 dark:bg-orange-500/10 text-orange-500 flex items-center justify-center border border-orange-200/50 dark:border-orange-500/20 shrink-0">
                                <SafeIcon name={isNew ? "plus" : (mode === 'edit' ? "edit-2" : "link")} size={18} />
                            </div>
                            <div className="min-w-0 pr-4">
                                <h2 className="text-[13px] font-black uppercase tracking-widest truncate">{isNew ? 'Ny Artikel' : item.name || 'Hantera Artikel'}</h2>
                                <p className="text-[10px] text-zinc-500 font-mono mt-0.5 truncate">{item?.service_filter || 'SKAPA NY'}</p>
                            </div>
                        </div>
                        <button onClick={onClose} className="w-8 h-8 flex items-center justify-center text-zinc-400 hover:text-zinc-900 dark:hover:text-white bg-white dark:bg-[#121826] rounded-lg shadow-sm border border-zinc-200 dark:border-white/10 shrink-0">
                            <SafeIcon name="x" size={14} />
                        </button>
                    </div>
                    
                    {!isNew && (
                        <div className="flex px-4 gap-2 pb-3">
                            {/* Gjorde flikarna mycket tydligare när de är aktiva */}
                            <button onClick={() => setMode('edit')} className={`flex-1 py-2 text-[11px] font-bold uppercase tracking-widest rounded-lg transition-all ${mode === 'edit' ? 'bg-orange-50 dark:bg-orange-500/10 text-orange-600 dark:text-orange-400 shadow-sm border border-orange-200 dark:border-orange-500/20' : 'text-zinc-500 hover:bg-zinc-100 dark:hover:bg-white/5 border border-transparent'}`}>Redigera</button>
                            <button onClick={() => setMode('link')} className={`flex-1 py-2 text-[11px] font-bold uppercase tracking-widest rounded-lg transition-all ${mode === 'link' ? 'bg-orange-50 dark:bg-orange-500/10 text-orange-600 dark:text-orange-400 shadow-sm border border-orange-200 dark:border-orange-500/20' : 'text-zinc-500 hover:bg-zinc-100 dark:hover:bg-white/5 border border-transparent'}`}>Koppla Jobb</button>
                        </div>
                    )}
                </div>

                {/* Innehållsyta (Scrollbar) */}
                <div className="flex-1 overflow-y-auto custom-scrollbar flex flex-col">
                    
                    {/* --- FLIK 1: REDIGERA --- */}
                    {mode === 'edit' && (
                        <form id="sidePanelForm" onSubmit={handleSave} className="px-6 pt-6 pb-6 flex flex-col gap-5">
                            <div className="group"><label className={LabelClass}>Artikelnamn / Beskrivning</label><input autoFocus required type="text" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} className={InputClass} placeholder="T.ex. Bromsbeläggssats Bak..." /></div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="group"><label className={LabelClass}>Art.Nummer / ID</label><input type="text" value={formData.service_filter} onChange={e => setFormData({ ...formData, service_filter: e.target.value.toUpperCase() })} className={`${InputClass} font-mono tracking-wider`} placeholder="BOS-1234" /></div>
                                <div className="group"><label className={LabelClass}>Kategori</label><select value={formData.category} onChange={e => setFormData({ ...formData, category: e.target.value })} className={InputClass}><option value="Service">Service</option><option value="Motor">Motor</option><option value="Chassi">Chassi</option><option value="Bromsar">Bromsar</option><option value="Elsystem">Elsystem</option><option value="Kaross">Kaross</option><option value="Andra Märken">Andra Märken</option></select></div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="group"><label className={LabelClass}>Inköpspris</label><div className="relative"><input type="number" required value={formData.price} onChange={e => setFormData({ ...formData, price: e.target.value })} className={`${InputClass} pr-12 font-mono font-bold text-lg`} placeholder="0" /><span className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-400 text-[10px] font-bold uppercase tracking-widest">SEK</span></div></div>
                                <div className="group"><label className={LabelClass}>Lagersaldo</label><input type="number" required value={formData.quantity} onChange={e => setFormData({ ...formData, quantity: e.target.value })} className={`${InputClass} font-mono font-bold text-lg`} placeholder="0" /></div>
                            </div>
                            <div className="group">
                                <label className={LabelClass}>Egenskaper / Specifikation</label>
                                <textarea 
                                    rows="6" 
                                    value={formData.notes} 
                                    onChange={e => {
                                        setFormData({ ...formData, notes: e.target.value });
                                        e.target.style.height = 'auto';
                                        e.target.style.height = (e.target.scrollHeight) + 'px';
                                    }} 
                                    className={`${InputClass} resize-y min-h-[160px] max-h-[350px] custom-scrollbar`} 
                                    placeholder="Placering: Bakaxel. Passar VAG plattform..." 
                                />
                            </div>

                            {!isNew && (
                                <div className="mt-2 pt-5 border-t border-zinc-200/80 dark:border-white/5 pb-4">
                                    <label className={`${LabelClass} flex items-center gap-2 mb-3`}><SafeIcon name="history" size={12} className="text-orange-500" /> Historik</label>
                                    {item?.history && item.history.length > 0 ? (
                                        <div className="space-y-2">
                                            {[...item.history].sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, 5).map((log, idx) => (
                                                <div key={idx} className="flex justify-between items-center bg-zinc-50 dark:bg-[#0f1522] p-3 rounded-xl border border-zinc-200/50 dark:border-white/5 shadow-sm">
                                                    <div className="min-w-0">
                                                        <div className="text-[11px] font-black uppercase tracking-wider truncate">{log.regnr}</div>
                                                        <div className="text-[9px] text-zinc-500 truncate mt-0.5">{log.date ? log.date.split('T')[0] : ''}</div>
                                                    </div>
                                                    <div className="text-[13px] font-black font-mono text-red-500 dark:text-red-400 shrink-0">-{log.qty}</div>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <div className="text-center py-5 bg-zinc-50/50 dark:bg-[#121826]/50 rounded-xl border border-zinc-200/50 dark:border-white/5 border-dashed">
                                            <span className="text-[9px] font-bold uppercase tracking-widest text-zinc-400">Inga transaktioner</span>
                                        </div>
                                    )}
                                </div>
                            )}
                        </form>
                    )}

                    {/* --- FLIK 2: KOPPLA TILL JOBB --- */}
                    {mode === 'link' && !isNew && (
                        <div className="p-6 flex flex-col h-full">
                            <div className="bg-orange-50 dark:bg-orange-500/10 border border-orange-200 dark:border-orange-500/20 rounded-xl p-4 mb-5 flex flex-col items-center justify-center gap-3">
                                <span className="text-[10px] font-bold text-orange-600 dark:text-orange-400 uppercase tracking-widest">Antal att montera</span>
                                <div className="flex items-center bg-white dark:bg-[#121826] border border-orange-200 dark:border-orange-500/30 rounded-lg p-1 shadow-sm">
                                    <button type="button" onClick={() => setQty(Math.max(1, qty - 1))} className="w-10 h-10 flex items-center justify-center text-zinc-500 hover:text-zinc-900 hover:bg-zinc-50 dark:hover:bg-white/5 rounded-md transition-colors"><SafeIcon name="minus" size={14} /></button>
                                    <span className="w-12 text-center text-[16px] font-black font-mono">{qty}</span>
                                    <button type="button" onClick={() => setQty(qty + 1)} className="w-10 h-10 flex items-center justify-center text-zinc-500 hover:text-zinc-900 hover:bg-zinc-50 dark:hover:bg-white/5 rounded-md transition-colors"><SafeIcon name="plus" size={14} /></button>
                                </div>
                            </div>
                            
                            <div className="relative mb-3 shrink-0">
                                <input type="text" placeholder="Sök regnr eller kund..." value={search} onChange={(e) => setSearch(e.target.value)} className="w-full bg-zinc-50 dark:bg-[#0f1522] border border-zinc-200 dark:border-white/10 rounded-xl px-4 pl-10 py-3 text-[12px] font-medium outline-none focus:border-orange-500 transition-all shadow-inner" />
                                <SafeIcon name="search" size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400" />
                            </div>
                            
                            {/* Smart rubrik som visar vad listan innehåller */}
                            <div className="text-[9px] font-bold text-zinc-400 uppercase tracking-widest mb-2 px-1">
                                {search ? `Sökresultat (${activeJobs.length})` : 'Senaste 5 aktiva jobben'}
                            </div>

                            <div className="flex flex-col gap-2 flex-1 pb-4">
                                {activeJobs.length === 0 ? <div className="text-center text-[10px] text-zinc-400 uppercase tracking-widest py-8">Inga aktiva jobb</div> : activeJobs.map(job => (
                                    <div key={job.id} onClick={() => setSelectedJob(job)} className={`p-3 rounded-xl border transition-all cursor-pointer flex items-center gap-3 group shadow-sm ${selectedJob?.id === job.id ? 'bg-orange-50 dark:bg-orange-500/10 border-orange-500' : 'bg-zinc-50 dark:bg-[#0f1522] border-zinc-200 dark:border-white/5 hover:border-orange-300'}`}>
                                        <div className={`w-5 h-5 rounded-md flex items-center justify-center shrink-0 border transition-colors ${selectedJob?.id === job.id ? 'bg-orange-500 border-orange-500 text-white' : 'bg-white dark:bg-zinc-800 border-zinc-300 dark:border-zinc-600'}`}>
                                            {selectedJob?.id === job.id && <SafeIcon name="check" size={12} />}
                                        </div>
                                        <div className="min-w-0">
                                            <div className={`font-black font-mono tracking-widest text-[13px] truncate ${selectedJob?.id === job.id ? 'text-orange-600 dark:text-orange-400' : ''}`}>{job.regnr || 'SAKNAS'}</div>
                                            <div className="text-[10px] text-zinc-500 truncate mt-0.5">{job.kundnamn}</div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                {/* --- FAST FOOTER LÄNGST NER (Ligger utanför scroll-ytan och klistrar sig alltid i botten) --- */}
                <div className="p-4 md:p-5 border-t border-zinc-200 dark:border-white/10 bg-white dark:bg-[#182032] shrink-0 pb-[85px] sm:pb-5">
                    {mode === 'edit' ? (
                        <div className="flex gap-3">
                            {!isNew && <button type="button" onClick={handleDelete} className="w-11 h-11 flex items-center justify-center text-red-500 hover:text-red-600 bg-red-50 dark:bg-red-500/10 rounded-xl hover:bg-red-100 dark:hover:bg-red-500/20 transition-all shrink-0 shadow-sm border border-transparent hover:border-red-200" title="Radera"><SafeIcon name="trash-2" size={16} /></button>}
                            <button form="sidePanelForm" type="submit" className="flex-1 h-11 text-[11px] font-bold text-white bg-orange-500 hover:bg-orange-600 rounded-xl shadow-[0_4px_14px_0_rgba(249,115,22,0.39)] transition-all flex items-center justify-center gap-2 uppercase tracking-widest"><SafeIcon name="check" size={16} /> Spara</button>
                        </div>
                    ) : (
                        <button onClick={handleLink} disabled={!selectedJob || isSaving} className="w-full h-11 text-[11px] font-bold text-white bg-orange-500 hover:bg-orange-600 rounded-xl shadow-[0_4px_14px_0_rgba(249,115,22,0.39)] transition-all flex items-center justify-center gap-2 uppercase tracking-widest disabled:opacity-50">
                            {isSaving ? <SafeIcon name="loader-2" size={14} className="animate-spin" /> : <SafeIcon name="link" size={16} />} Bekräfta Koppling
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};

// ==========================================
// IDIOTSÄKER HOTSPOT
// ==========================================
const DiagramHotspot = ({ top, left, label, area, iconType, activeArea, onClick, dx = 0, dy = 0 }) => {
    const isStrictlyActive = activeArea === area;

    const getSvgIcon = () => {
        if (iconType === 'motor') return <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" fill="none" stroke="currentColor" />;
        if (iconType === 'bromsar') return <g fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="12" r="10" /><circle cx="12" cy="12" r="3" /></g>;
        if (iconType === 'service') return <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" fill="none" stroke="currentColor" />;
        if (iconType === 'kaross') return <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 12h3M20 12h2M6 9h4M10 9l3-2v10l-3-2M13 8h7M7 5c2-3 8-3 11 1M16 6.5l2.5.5L18 4.5M18 19c-2 3-8 3-11-1M9 18.5l-2.5-.5L7 20.5" fill="none" stroke="currentColor" />;
        if (iconType === 'elsystem') return <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" fill="none" stroke="currentColor" />;
        return <circle cx="12" cy="12" r="8" fill="none" stroke="currentColor" strokeWidth="2" />;
    };

    return (
        <div className="absolute z-20" style={{ top, left }}>
            <svg className="absolute overflow-visible pointer-events-none" style={{ left: 0, top: 0 }}>
                <line x1="0" y1="0" x2={dx} y2={dy} stroke="currentColor" strokeWidth="2" className="text-zinc-400 dark:text-zinc-600 opacity-60" />
                <circle cx="0" cy="0" r="3" fill="currentColor" className="text-orange-500" />
            </svg>

            <div
                onClick={() => { if (navigator.vibrate) navigator.vibrate(10); onClick(area); }}
                className="absolute flex flex-col items-center gap-1.5 group transition-all duration-300 cursor-pointer outline-none hover:z-30"
                style={{ transform: `translate(calc(-50% + ${dx}px), calc(-50% + ${dy}px))` }}
            >
                <div className={`w-10 h-10 rounded-full border-[2px] flex items-center justify-center backdrop-blur-md transition-all duration-300 shadow-md ${isStrictlyActive ? 'bg-orange-500 border-orange-200 text-white scale-110 shadow-[0_0_15px_rgba(249,115,22,0.6)]' : 'bg-white/95 dark:bg-zinc-800/95 border-zinc-300 dark:border-zinc-600 text-zinc-700 dark:text-zinc-300 group-hover:border-orange-400 group-hover:text-orange-500'}`}>
                    <svg width="18" height="18" viewBox="0 0 24 24">{getSvgIcon()}</svg>
                </div>
                <div className={`text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-lg backdrop-blur-md transition-colors shadow-sm whitespace-nowrap border ${isStrictlyActive ? 'bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white border-orange-200 dark:border-orange-500/30' : 'bg-white/95 dark:bg-zinc-800/95 text-zinc-600 dark:text-zinc-400 border-zinc-200 dark:border-zinc-700 group-hover:border-orange-300'}`}>
                    {label}
                </div>
            </div>
        </div>
    );
};

// ==========================================
// HUVUDVY - EPC SAAS EDITION 
// ==========================================
window.LagerView = ({ allJobs = [] }) => {
    React.useEffect(() => { if (window.lucide) window.lucide.createIcons(); });

    const [items, setItems] = React.useState([]);
    const [search, setSearch] = React.useState("");
    const [activeArea, setActiveArea] = React.useState("Alla");
    const [showTable, setShowTable] = React.useState(false);
    const [zoomMultiplier, setZoomMultiplier] = React.useState(1); // NYTT STATE FÖR ZOOM

    // NYA STATES FÖR FILTER OCH SORTERING
    const [stockFilter, setStockFilter] = React.useState('ALL'); // ALL, IN_STOCK, OUT_OF_STOCK
    const [sortConfig, setSortConfig] = React.useState({ key: 'partnumber', direction: 'asc' });
    const [showFilterMenu, setShowFilterMenu] = React.useState(false); // LÄGG TILL DENNA RAD!

    const [editingItem, setEditingItem] = React.useState(null);
    const [linkingItem, setLinkingItem] = React.useState(null);
    const [isScannerOpen, setIsScannerOpen] = React.useState(false);
    const [copiedId, setCopiedId] = React.useState(null);
    const searchInputRef = React.useRef(null);
    const [activeMenuId, setActiveMenuId] = React.useState(null);

    React.useEffect(() => {
        if (!window.db) return;
        const unsub = window.db.collection("lager").onSnapshot(s => setItems(s.docs.map(d => ({ id: d.id, ...d.data() }))));
        return () => unsub();
    }, []);

    React.useEffect(() => {
        const handleKeyDown = (e) => {
            if (e.key === '/' && document.activeElement.tagName !== 'INPUT' && document.activeElement.tagName !== 'TEXTAREA') {
                e.preventDefault();
                searchInputRef.current?.focus();
            }
        };
        document.addEventListener('keydown', handleKeyDown);
        return () => document.removeEventListener('keydown', handleKeyDown);
    }, []);

    const handleSelectArea = (area) => {
        setActiveArea(area);
        setSearch('');
        setShowTable(true);
        setZoomMultiplier(1); // Nollställ zoom
    };

    const etkaCategories = [
        { id: 'Alla', name: 'Alla', icon: 'layers' },
        { id: 'Service', name: 'Service', icon: 'settings' },
        { id: 'Motor', name: 'Motor', icon: 'cpu' },
        { id: 'Chassi', name: 'Chassi', icon: 'layers' },
        { id: 'Bromsar', name: 'Bromsar', icon: 'disc' },
        { id: 'Elsystem', name: 'Elsystem', icon: 'zap' },
        { id: 'Kaross', name: 'Kaross', icon: 'shield' },
        { id: 'Kupéfilter', name: 'Kupéfilter', icon: 'filter' },
        { id: 'Luftfilter', name: 'Luftfilter', icon: 'wind' },
        { id: 'Oljefilter', name: 'Oljefilter', icon: 'droplet' },
        { id: 'Tändstift', name: 'Tändstift', icon: 'sparkplug' },
        { id: 'Bränslefilter', name: 'Bränslefilter', icon: 'droplet' }
    ];

    // --- NYTT: Håller koll på bild och inzoomning för både mobil och dator ---
    const diagramConfig = {
        'Alla': { src: getDiagramImageLink('Alla'), scale: 1.0 },
        'Bromsar': { src: getDiagramImageLink('Bromsar'), scale: 1.2 },
        'Motor': { src: getDiagramImageLink('Motor'), scale: 1.2 },
        'Chassi': { src: getDiagramImageLink('Chassi'), scale: 1.2 },
        'Elsystem': { src: getDiagramImageLink('Elsystem'), scale: 1.2 },
        'Kaross': { src: getDiagramImageLink('Kaross'), scale: 1.2 },
        'Service': { src: getDiagramImageLink('Service'), scale: 1.2 },

        'Kupéfilter': { src: getDiagramImageLink('Kupéfilter'), scale: 1.2 },
        'Luftfilter': { src: getDiagramImageLink('Luftfilter'), scale: 1.2 },
        'Oljefilter': { src: getDiagramImageLink('Oljefilter'), scale: 1.2 },
        'Tändstift': { src: getDiagramImageLink('Tändstift'), scale: 1.2 },
        'Bränslefilter': { src: getDiagramImageLink('Bränslefilter'), scale: 1.2 },
    };
    const activeConfig = diagramConfig[activeArea] || diagramConfig['Alla'];
    const isMainDiagram = activeArea === 'Alla';

    const handleSort = (key) => {
        setSortConfig(prev => ({
            key,
            direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc'
        }));
    };

    // UPPDATERAD FILTRERING & SORTERING
    const filteredItems = React.useMemo(() => {
        let res = [...items];
        const quick = ['Kupéfilter', 'Luftfilter', 'Oljefilter', 'Bränslefilter', 'Tändstift'];
        if (activeArea !== 'Alla') {
            if (quick.includes(activeArea)) {
                res = res.filter(i => normalizeStr(i.name).includes(normalizeStr(activeArea)));
            } else {
                res = res.filter(i => normalizeStr(i.category) === normalizeStr(activeArea));
            }
        }

        if (search) {
            const term = search.toLowerCase().replace(/\s+/g, '');
            res = res.filter(i =>
                (i.name || "").toLowerCase().replace(/\s+/g, '').includes(term) ||
                (i.service_filter || "").toLowerCase().replace(/\s+/g, '').includes(term) ||
                (i.notes || "").toLowerCase().replace(/\s+/g, '').includes(term)
            );
        }

        // Lagerstatus-filter
        if (stockFilter === 'IN_STOCK') {
            res = res.filter(i => (parseInt(i.quantity) || 0) > 0);
        } else if (stockFilter === 'OUT_OF_STOCK') {
            res = res.filter(i => (parseInt(i.quantity) || 0) <= 0);
        }

        // Sortering
        res.sort((a, b) => {
            let aVal, bVal;
            if (sortConfig.key === 'partnumber') {
                aVal = a.service_filter || '';
                bVal = b.service_filter || '';
            } else if (sortConfig.key === 'name') {
                aVal = a.name || '';
                bVal = b.name || '';
            } else if (sortConfig.key === 'stock') {
                aVal = parseInt(a.quantity) || 0;
                bVal = parseInt(b.quantity) || 0;
            }
            if (aVal < bVal) return sortConfig.direction === 'asc' ? -1 : 1;
            if (aVal > bVal) return sortConfig.direction === 'asc' ? 1 : -1;
            return 0;
        });

        return res;
    }, [items, search, activeArea, stockFilter, sortConfig]);

    const copyToClipboard = (e, text, id) => {
        e.stopPropagation();
        if (!text || text === 'SAKNAS') return;
        navigator.clipboard.writeText(text);
        setCopiedId(id);
        setTimeout(() => setCopiedId(null), 2000);
    };

    // NYTT: Funktion för att snabbt justera lagersaldo
    const handleQuickAdjust = async (item, change) => {
        const currentQty = parseInt(item.quantity) || 0;
        const newQty = Math.max(0, currentQty + change); // Hindrar saldot från att bli minus
        if (newQty === currentQty) return; 

        try {
            // Uppdaterar databasen direkt i bakgrunden utan att öppna modal
            await window.db.collection("lager").doc(String(item.id)).update({
                quantity: newQty
            });
        } catch (err) {
            console.error("Kunde inte uppdatera saldo:", err);
        }
    };

    return (
        <div className="absolute inset-0 w-full h-full overflow-hidden animate-in fade-in duration-700 flex flex-col select-none pb-[64px] md:pb-0 bg-transparent">

            <div className="absolute top-0 left-[-10%] w-[60%] h-[400px] bg-orange-500/10 dark:bg-orange-500/5 blur-[120px] rounded-full pointer-events-none -z-10 hidden lg:block"></div>

            {/* HEADER */}
            <div className="flex flex-row items-center justify-between pb-2 md:pb-4 gap-2 md:gap-4 shrink-0 m-0 p-3 md:p-4 z-50 bg-transparent">

                <div className="flex items-center shrink-0 gap-3">
                    {/* Loggan (Ikonen) - Syns på både mobil och dator */}
                    <div className="relative group cursor-default shrink-0">
                        <div className="absolute inset-0 bg-orange-500/40 blur-lg rounded-xl transition-all duration-700 group-hover:bg-orange-500/60" />
                        <div className="relative w-10 h-10 md:w-12 md:h-12 rounded-xl flex items-center justify-center text-white shadow-md border border-white/20 transition-colors bg-gradient-to-br from-orange-400 to-orange-600">
                            <SafeIcon name="package" size={18} className="md:w-5 md:h-5" />
                        </div>
                    </div>
                    {/* Titeln - Gömd på mobilen, synlig på datorn */}
                    <h1 className="hidden md:block text-2xl font-black text-zinc-900 dark:text-white uppercase tracking-tight leading-none">
                        ARTIKEL<span className="text-zinc-400 dark:text-zinc-500 font-light">SÖK</span>
                    </h1>
                </div>

                <div className="flex flex-row items-center gap-2 md:gap-4 z-10 flex-1 justify-end">
                    {/* Sökfältet tar upp all yta som blir över (flex-1) */}
                    <div className="relative group flex-1 min-w-0 md:max-w-none">
                        <input
                            ref={searchInputRef}
                            type="text" value={search} onChange={e => { setSearch(e.target.value); if (e.target.value) setShowTable(true); }}
                            placeholder="Sök..."
                            className="h-10 md:h-12 bg-white dark:bg-[#182032] border border-zinc-200/80 dark:border-white/5 text-[12px] font-bold px-3 pl-8 md:pl-11 rounded-xl outline-none focus:border-orange-500 w-full text-zinc-900 dark:text-white transition-all shadow-sm placeholder:text-zinc-400"
                        />
                        <SafeIcon name="search" size={14} className="absolute left-2.5 md:left-4 top-1/2 -translate-y-1/2 text-zinc-400 group-focus-within:text-orange-500" />
                        {search && <button onClick={() => { setSearch(''); }} className="absolute right-1 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-red-500 p-1 rounded-md active:scale-95 transition-all"><SafeIcon name="x" size={12} /></button>}
                    </div>

                    <button onClick={() => setIsScannerOpen(true)} className="w-10 h-10 md:h-12 md:w-auto md:px-5 bg-white dark:bg-[#182032] border border-zinc-200/80 dark:border-white/5 hover:border-orange-300 rounded-xl flex items-center justify-center text-zinc-700 dark:text-zinc-300 shadow-sm transition-all active:scale-95 shrink-0" title="Skanna">
                        <SafeIcon name="scan" size={16} /> <span className="hidden md:block ml-2 font-bold uppercase text-[10px] tracking-widest">SKANNA</span>
                    </button>

                    <button onClick={() => setEditingItem({})} className="w-10 h-10 md:h-12 md:w-auto md:px-6 bg-orange-500 hover:bg-orange-600 border border-orange-400/50 text-white rounded-xl flex items-center justify-center shadow-sm transition-all active:scale-95 shrink-0" title="Ny Artikel">
                        <SafeIcon name="plus" size={16} /> <span className="hidden md:block ml-2 font-bold uppercase text-[11px] tracking-widest">NY ARTIKEL</span>
                    </button>
                </div>
            </div>

            <div className="flex-1 min-h-0 flex flex-col overflow-hidden bg-white/90 dark:bg-[#182032]/90 border border-zinc-200/80 dark:border-white/5 rounded-t-3xl md:rounded-3xl shadow-sm mb-0">
                <div className="flex-1 min-h-0 flex overflow-hidden relative">

                    {/* MITTEN: THE BLUEPRINT */}
                    <div className={`${showTable ? 'hidden xl:flex xl:w-[35%] shrink-0' : 'flex'} flex-1 flex-col border-r border-zinc-200/80 dark:border-white/5 relative bg-zinc-50/30 dark:bg-[#0b0f19] overflow-hidden group/diagram items-center justify-center p-1 md:p-6`}>

                        <div className="relative w-[130%] md:w-full max-w-4xl aspect-[16/9] z-10 flex items-center justify-center mb-20 md:mb-0">

                            {/* BILD FÖR MOBIL (Syns upp till xl-brytpunkten) -> Visar ALLTID huvudskissen */}
                            <img
                                src={diagramConfig['Alla'].src}
                                style={{ transform: `scale(${diagramConfig['Alla'].scale * zoomMultiplier})` }}
                                className="xl:hidden absolute inset-0 w-full h-full object-contain dark:invert grayscale dark:opacity-90 opacity-80 transition-transform duration-300 pointer-events-none"
                                alt="Sprängskiss Huvudvy"
                            />

                            {/* BILD FÖR DATOR (Syns från xl och uppåt) -> Visar dynamisk bild och zoom */}
                            <img
                                src={activeConfig.src}
                                style={{ transform: `scale(${activeConfig.scale * zoomMultiplier})` }}
                                className="hidden xl:block absolute inset-0 w-full h-full object-contain dark:invert grayscale dark:opacity-90 opacity-80 transition-transform duration-300 pointer-events-none"
                                alt={`Sprängskiss ${activeArea}`}
                            />

                            <div className={isMainDiagram ? 'block' : 'xl:hidden'}>
                                <DiagramHotspot top="45%" left="42%" dx={-75} dy={-40} label="Motor" area="Motor" iconType="motor" activeArea={activeArea} onClick={handleSelectArea} />
                                <DiagramHotspot top="54%" left="38%" dx={-40} dy={0} label="Chassi" area="Chassi" iconType="settings" activeArea={activeArea} onClick={handleSelectArea} />
                                <DiagramHotspot top="62%" left="74%" dx={-10} dy={60} label="Bromsar" area="Bromsar" iconType="bromsar" activeArea={activeArea} onClick={handleSelectArea} />
                                <DiagramHotspot top="55%" left="50%" dx={0} dy={65} label="Service" area="Service" iconType="service" activeArea={activeArea} onClick={handleSelectArea} />
                                <DiagramHotspot top="70%" left="35%" dx={-45} dy={45} label="Elsystem" area="Elsystem" iconType="elsystem" activeArea={activeArea} onClick={handleSelectArea} />
                                <DiagramHotspot top="30%" left="62%" dx={40} dy={-65} label="Kaross" area="Kaross" iconType="kaross" activeArea={activeArea} onClick={handleSelectArea} />
                            </div>
                        </div>

                        {/* ZOOM-KNAPPAR FÖR HUVUDVY (Dator + Mobil) */}
                        {/* Flyttade till top-4 (för mobil) och xl:top-[110px] (för dator, hamnar precis under miniatyren). Fyrkantiga (rounded-md) och mindre (w-8 h-8). */}
                        <div className="absolute right-4 top-4 xl:top-[110px] z-40 flex flex-col gap-1.5">
                            <button onClick={(e) => { e.stopPropagation(); setZoomMultiplier(z => Math.min(z + 0.3, 4)); }} className="w-8 h-8 bg-white/90 dark:bg-[#182032]/90 border border-zinc-300 dark:border-zinc-600 shadow-sm rounded-md flex items-center justify-center text-zinc-700 dark:text-zinc-300 hover:text-orange-500 transition-all backdrop-blur-md active:scale-95" title="Zooma in">
                                <SafeIcon name="zoom-in" size={16} />
                            </button>
                            <button onClick={(e) => { e.stopPropagation(); setZoomMultiplier(z => Math.max(z - 0.3, 0.5)); }} className="w-8 h-8 bg-white/90 dark:bg-[#182032]/90 border border-zinc-300 dark:border-zinc-600 shadow-sm rounded-md flex items-center justify-center text-zinc-700 dark:text-zinc-300 hover:text-orange-500 transition-all backdrop-blur-md active:scale-95" title="Zooma ut">
                                <SafeIcon name="zoom-out" size={16} />
                            </button>
                        </div>

                        {/* MINIATYRBILD TILLBAKA (Klassisk EPC-katalogstil) */}
                        {!isMainDiagram && (
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    setShowTable(false);
                                    setActiveArea('Alla');
                                    setSearch('');
                                }}
                                className="absolute top-4 right-4 z-40 w-24 md:w-36 aspect-[16/9] bg-white dark:bg-[#182032] border border-zinc-300 dark:border-white/20 rounded-none shadow-sm overflow-hidden cursor-pointer group/mini transition-all hover:border-zinc-800 dark:hover:border-white hover:shadow-md hidden xl:block active:scale-95"
                                title="Visa översikt"
                            >
                                <img src={diagramConfig['Alla'].src} className="w-full h-full object-contain p-2 dark:invert grayscale dark:contrast-125 opacity-75 group-hover/mini:opacity-100 transition-opacity pointer-events-none" alt="Huvudvy Miniatyr" />

                                {/* Klassisk EPC-etikett i nedre högra hörnet */}
                                <div className="absolute bottom-1 right-1 px-1.5 py-0.5 bg-white/90 dark:bg-black/80 border border-zinc-300 dark:border-zinc-700 text-[9px] font-mono font-black uppercase text-zinc-800 dark:text-zinc-200 pointer-events-none shadow-xs">
                                    ÖVERSIKT
                                </div>
                            </button>
                        )}

                        {/* KNAPPARNA (Mobilen) */}
                        <div className="absolute -bottom-[1px] left-0 right-0 w-full md:hidden z-20">
                            {/* Ändrat till gap-1 för tajtare mellanrum */}
                            <div className="flex w-full gap-1 px-4 pb-0 mb-0 items-end overflow-x-auto snap-x snap-mandatory custom-scrollbar" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
                                {etkaCategories.filter(c => ['Alla', 'Kupéfilter', 'Luftfilter', 'Oljefilter', 'Bränslefilter', 'Tändstift'].includes(c.id)).map(cat => {
                                    const isSelected = activeArea === cat.id;
                                    const config = diagramConfig[cat.id] || diagramConfig['Alla'];

                                    const handleCategoryClick = () => {
                                        if (cat.id === 'Alla') {
                                            setActiveArea('Alla');
                                            setShowTable(false);
                                            setSearch('');
                                        } else {
                                            handleSelectArea(cat.id);
                                        }
                                    };

                                    return (
                                        <button
                                            key={cat.id}
                                            onClick={handleCategoryClick}
                                            // Ändrat från rounded-t-xl till rounded-t-sm för fyrkantigt utseende
                                            className={`shrink-0 relative w-[76px] h-[90px] bg-white dark:bg-[#182032] border border-b-0 rounded-t-sm transition-all cursor-pointer shadow-[0_-2px_10px_rgba(0,0,0,0.05)] overflow-hidden snap-start ${isSelected ? 'border-orange-500 ring-1 ring-orange-500/50 z-10' : 'border-zinc-200 dark:border-white/10'}`}
                                        >
                                            {/* Sänkt skalningen från 1.2 till 0.85 för att zooma ut bilden */}
                                            <img
                                                src={config.src}
                                                style={{ transform: `scale(${config.scale * 0.85})` }}
                                                className="absolute inset-0 w-full h-full object-contain p-1.5 pb-6 dark:invert grayscale dark:contrast-125 opacity-85 pointer-events-none"
                                                alt={cat.name}
                                            />

                                            <div className="absolute bottom-0 inset-x-0 bg-white/95 dark:bg-[#0b0f19]/95 border-t border-zinc-100 dark:border-white/5 py-1.5 px-1 text-center">
                                                <span className={`text-[8px] font-black uppercase tracking-wider truncate block w-full ${isSelected ? 'text-orange-600 dark:text-orange-500' : 'text-zinc-600 dark:text-zinc-400'}`}>
                                                    {cat.name}
                                                </span>
                                            </div>
                                        </button>
                                    );
                                })}
                                <div className="shrink-0 w-16 h-1 pointer-events-none"></div>
                            </div>
                        </div>
                    </div>

                    {/* HÖGER: DATATABELL (Hela högra panelen blir scrollbar på mobilen!) */}
                    <div className={`${showTable ? 'flex xl:flex xl:w-[65%] xl:shrink-0' : 'hidden'} flex-1 min-h-0 flex-col bg-white dark:bg-[#121214] z-30 xl:z-10 animate-in fade-in duration-300 overflow-y-auto custom-scrollbar xl:overflow-hidden relative`}>

                        {/* MOBIL BILD-VY (Flyttad hit: Ligger nu ovanför kontrollraden) */}
                        <div className="xl:hidden w-full h-[35vh] sm:h-[45vh] shrink-0 relative bg-zinc-50/50 dark:bg-[#0b0f19] flex items-center justify-center border-b border-zinc-200/80 dark:border-white/5 overflow-hidden">
                            <img 
                                src={activeConfig.src} 
                                style={{ transform: `scale(${activeConfig.scale * zoomMultiplier})` }}
                                className="absolute inset-0 w-full h-full object-contain p-4 dark:invert grayscale dark:opacity-90 opacity-80 pointer-events-none transition-transform duration-300" 
                                alt={`Sprängskiss ${activeArea}`} 
                            />
                            
                            {/* ZOOM-KNAPPAR (Mobil Tabellvy) - Nu fyrkantiga och mindre */}
                            <div className="absolute right-3 bottom-3 z-40 flex flex-col gap-1.5">
                                <button onClick={(e) => { e.stopPropagation(); setZoomMultiplier(z => Math.min(z + 0.3, 4)); }} className="w-8 h-8 bg-white/90 dark:bg-[#182032]/90 border border-zinc-300 dark:border-zinc-700 shadow-sm rounded-md flex items-center justify-center text-zinc-700 dark:text-zinc-300 hover:text-orange-500 transition-all backdrop-blur-md active:scale-95" title="Zooma in">
                                    <SafeIcon name="zoom-in" size={16} />
                                </button>
                                <button onClick={(e) => { e.stopPropagation(); setZoomMultiplier(z => Math.max(z - 0.3, 0.5)); }} className="w-8 h-8 bg-white/90 dark:bg-[#182032]/90 border border-zinc-300 dark:border-zinc-700 shadow-sm rounded-md flex items-center justify-center text-zinc-700 dark:text-zinc-300 hover:text-orange-500 transition-all backdrop-blur-md active:scale-95" title="Zooma ut">
                                    <SafeIcon name="zoom-out" size={16} />
                                </button>
                            </div>

                            <div className="absolute inset-x-0 bottom-0 h-12 bg-gradient-to-t from-white dark:from-[#121214] to-transparent pointer-events-none"></div>
                        </div>

                        {/* SAMLAD STICKY HEADER (Denna klibbar fast i toppen när bilden scrollas bort) */}
                        <div className="sticky top-0 z-30 flex flex-col shrink-0 w-full shadow-sm bg-white dark:bg-[#121214]">

                            {/* Övre Kontrollrad (Balanserad storlek) */}
                            <div className="px-3 py-2.5 border-b border-zinc-200/80 dark:border-white/10 flex flex-row items-center justify-between bg-white dark:bg-[#121214]">
                                <div className="flex items-center gap-2.5 min-w-0">
                                    <button
                                        onClick={() => {
                                            setShowTable(false);
                                            setActiveArea('Alla');
                                            setSearch('');
                                            setZoomMultiplier(1); // Nollställ zoom
                                        }}
                                        className="p-1.5 -ml-1 flex items-center justify-center text-zinc-900 dark:text-white hover:text-orange-500 rounded-lg transition-colors cursor-pointer"
                                        title="Tillbaka"
                                    >
                                        <SafeIcon name="arrow-left" size={19} />
                                    </button>

                                    <h2 className="text-xs md:text-sm font-black text-zinc-900 dark:text-white uppercase tracking-wider truncate">
                                        {activeArea}
                                    </h2>
                                </div>

                                <div className="relative shrink-0">
                                    <button
                                        onClick={() => setShowFilterMenu(!showFilterMenu)}
                                        className={`p-1.5 -mr-1 flex items-center justify-center rounded-lg transition-colors relative cursor-pointer ${stockFilter !== 'ALL' ? 'text-orange-500 bg-orange-50 dark:bg-orange-500/10' : 'text-zinc-900 dark:text-white hover:text-orange-500'}`}
                                        title="Filtrera"
                                    >
                                        <SafeIcon name="filter" size={18} />
                                        {stockFilter !== 'ALL' && (
                                            <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 bg-orange-500 rounded-full"></span>
                                        )}
                                    </button>

                                    {showFilterMenu && (
                                        <>
                                            <div className="fixed inset-0 z-40" onClick={() => setShowFilterMenu(false)}></div>
                                            <div className="absolute right-0 top-full mt-1.5 z-50 w-36 bg-white dark:bg-[#182032] border border-zinc-200 dark:border-white/10 shadow-xl rounded-xl p-1 flex flex-col gap-0.5 animate-in fade-in zoom-in-95">
                                                <button onClick={() => { setStockFilter('ALL'); setShowFilterMenu(false); }} className={`px-2.5 py-2 rounded-lg text-[10px] font-bold uppercase tracking-wider text-left transition-all flex items-center justify-between ${stockFilter === 'ALL' ? 'bg-orange-50 text-orange-600 dark:bg-orange-500/10 dark:text-orange-400' : 'text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-white/5'}`}>
                                                    Visa Alla {stockFilter === 'ALL' && <SafeIcon name="check" size={12} />}
                                                </button>
                                                <button onClick={() => { setStockFilter('IN_STOCK'); setShowFilterMenu(false); }} className={`px-2.5 py-2 rounded-lg text-[10px] font-bold uppercase tracking-wider text-left transition-all flex items-center justify-between ${stockFilter === 'IN_STOCK' ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400' : 'text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-white/5'}`}>
                                                    Endast i lager {stockFilter === 'IN_STOCK' && <SafeIcon name="check" size={12} />}
                                                </button>
                                                <button onClick={() => { setStockFilter('OUT_OF_STOCK'); setShowFilterMenu(false); }} className={`px-2.5 py-2 rounded-lg text-[10px] font-bold uppercase tracking-wider text-left transition-all flex items-center justify-between ${stockFilter === 'OUT_OF_STOCK' ? 'bg-red-50 text-red-600 dark:bg-red-500/10 dark:text-red-400' : 'text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-white/5'}`}>
                                                    Slut i lager {stockFilter === 'OUT_OF_STOCK' && <SafeIcon name="check" size={12} />}
                                                </button>
                                            </div>
                                        </>
                                    )}
                                </div>
                            </div>

                            {/* Klickbara Sorteringsrubriker */}
                            <div className="flex border-b border-zinc-200/80 dark:border-white/10 bg-zinc-100/90 dark:bg-[#1a2235]/90 backdrop-blur-md text-[9px] font-black text-zinc-500 dark:text-zinc-400 uppercase tracking-widest items-center">
                                {/* Spacer för färgkanten så att headern linjerar med raderna */}
                                <div className="w-1 shrink-0"></div>

                                <div className="w-8 md:w-12 border-r border-zinc-200/80 dark:border-white/5 px-1 md:px-2 py-3 text-center shrink-0">#</div>

                                <div className="w-24 md:w-44 border-r border-zinc-200/80 dark:border-white/5 px-2 md:px-4 py-3 cursor-pointer hover:bg-zinc-200/50 dark:hover:bg-white/5 transition-colors select-none flex items-center justify-between shrink-0" onClick={() => handleSort('partnumber')}>
                                    <span>ART.NR</span>
                                    {sortConfig.key === 'partnumber' && <span className="text-orange-500">{sortConfig.direction === 'asc' ? '↑' : '↓'}</span>}
                                </div>

                                <div className="flex-1 border-r border-zinc-200/80 dark:border-white/5 px-2 md:px-4 py-3 cursor-pointer hover:bg-zinc-200/50 dark:hover:bg-white/5 transition-colors select-none flex items-center justify-between min-w-0" onClick={() => handleSort('name')}>
                                    <span>BESKRIVNING</span>
                                    {sortConfig.key === 'name' && <span className="text-orange-500">{sortConfig.direction === 'asc' ? '↑' : '↓'}</span>}
                                </div>

                                {/* Breddat till w-20 md:w-24 */}
                                <div className="w-20 md:w-24 border-r border-zinc-200/80 dark:border-white/5 px-1 py-3 cursor-pointer hover:bg-zinc-200/50 dark:hover:bg-white/5 transition-colors select-none flex items-center justify-center gap-1 shrink-0" onClick={() => handleSort('stock')}>
                                    <span>SALDO</span>
                                    {sortConfig.key === 'stock' && <span className="text-orange-500">{sortConfig.direction === 'asc' ? '↑' : '↓'}</span>}
                                </div>

                                <div className="w-10 md:w-[180px] px-1 md:px-3 py-3 text-center shrink-0 hidden sm:block">ACTION</div>
                            </div>
                        </div>

                        {/* LISTAN (Scroll-behållaren) */}
                        <div className="flex-none h-auto overflow-visible xl:flex-1 xl:overflow-y-auto overflow-x-hidden custom-scrollbar xl:min-h-0 pb-10">
                            
                            {/* Visa bannern i toppen ENDAST om inga artiklar hittades */}
                            {filteredItems.length === 0 && search && (
                                <div className="p-4 md:p-6 border-b border-zinc-200 dark:border-white/10 bg-zinc-50/50 dark:bg-[#1a2235]/30 flex flex-col sm:flex-row items-center justify-between gap-4 animate-in fade-in">
                                    <div className="flex items-center gap-3 w-full sm:w-auto">
                                        <div className="w-10 h-10 rounded-full bg-blue-50 dark:bg-blue-500/10 flex items-center justify-center shrink-0 border border-blue-100 dark:border-blue-500/20">
                                            <SafeIcon name="globe" size={18} className="text-blue-500" />
                                        </div>
                                        <div className="min-w-0 text-left">
                                            <div className="text-[11px] md:text-[12px] font-black text-zinc-900 dark:text-white uppercase tracking-wider truncate">Hittar du inte rätt del?</div>
                                            <div className="text-[9px] md:text-[10px] text-zinc-500 truncate">Sök efter "{search}" hos leverantörer</div>
                                        </div>
                                    </div>
                                    <div className="flex gap-2 w-full sm:w-auto shrink-0">
                                        <a href={generateTrodoLink(search)} target="_blank" rel="noopener noreferrer" className="flex-1 sm:flex-none sm:w-28 h-10 bg-white dark:bg-[#121826] hover:bg-zinc-100 dark:hover:bg-white/5 border border-zinc-200 dark:border-white/10 rounded-xl text-[10px] font-bold text-zinc-700 dark:text-zinc-300 uppercase tracking-widest flex items-center justify-center gap-2 shadow-sm transition-all hover:border-blue-300">
                                            <img src="https://www.google.com/s2/favicons?domain=trodo.se&sz=32" className="w-3.5 h-3.5 object-contain" alt="Trodo" /> Trodo
                                        </a>
                                        <a href={generateThansenLink(search)} target="_blank" rel="noopener noreferrer" className="flex-1 sm:flex-none sm:w-28 h-10 bg-white dark:bg-[#121826] hover:bg-zinc-100 dark:hover:bg-white/5 border border-zinc-200 dark:border-white/10 rounded-xl text-[10px] font-bold text-zinc-700 dark:text-zinc-300 uppercase tracking-widest flex items-center justify-center gap-2 shadow-sm transition-all hover:border-orange-300">
                                            <img src="https://www.google.com/s2/favicons?domain=thansen.se&sz=32" className="w-3.5 h-3.5 object-contain" alt="thansen" /> thansen
                                        </a>
                                    </div>
                                </div>
                            )}

                            {filteredItems.length === 0 ? (
                                <div className="py-20 text-center flex flex-col items-center justify-center">
                                    <div className="w-16 h-16 rounded-full bg-zinc-100 dark:bg-white/5 flex items-center justify-center mb-0 border border-zinc-200 dark:border-white/5 shadow-inner">
                                        <SafeIcon name="inbox" size={24} className="text-zinc-400" />
                                    </div>
                                    <span className="text-[11px] font-bold uppercase tracking-widest text-zinc-500 mt-3">Inga artiklar hittades</span>
                                </div>
                            ) : (
                                filteredItems.map((item, idx) => {
                                    const qty = parseInt(item.quantity) || 0;

                                    // Exakta färgkoder (Hex) matchade mot din bild
                                    const statusColor = qty === 0
                                        ? 'bg-[#dc2626]' // Röd om slut
                                        : (qty < 2 ? 'bg-[#d89c00]' : 'bg-[#7a9d34]'); // Senapsgul & Olivgrön

                                    return (
                                        <div
                                            key={item.id}
                                            onDoubleClick={() => setEditingItem(item)}
                                            className="flex border-b border-zinc-200 dark:border-white/10 text-[12px] items-stretch bg-white dark:bg-[#121214] hover:bg-zinc-50 dark:hover:bg-white/5 transition-colors group cursor-pointer"
                                        >
                                            {/* Här är den nya tjockare färgindikatorn. Radens border-b kommer skära av denna i botten och bilda avdelaren! */}
                                            <div className={`w-[6px] md:w-[8px] shrink-0 ${statusColor}`}></div>

                                            <div className="w-8 md:w-12 border-r border-zinc-200 dark:border-white/10 py-3 px-1 flex items-center justify-center shrink-0">
                                                <span className="text-[10px] md:text-[11px] font-bold text-zinc-500">{idx + 1}</span>
                                            </div>

                                            <div
                                                className="w-24 md:w-40 border-r border-zinc-200 dark:border-white/10 px-2 md:px-4 py-3 font-mono font-bold tracking-wider text-[10px] md:text-[12px] text-zinc-900 dark:text-white shrink-0 group-hover:text-orange-500 transition-colors flex items-center truncate"
                                                onClick={(e) => copyToClipboard(e, item.service_filter, item.id)}
                                                title={`Kopiera: ${item.service_filter}`}
                                            >
                                                {formatPartNumber(item.service_filter)}
                                            </div>

                                            <div className="flex-1 border-r border-zinc-200 dark:border-white/10 px-2 md:px-4 py-3 min-w-0 flex flex-col justify-center">
                                                {/* 3. whitespace-normal och line-clamp-2 låter texten brytas till max 2 rader */}
                                                <div className="text-[10px] md:text-[12px] font-bold text-zinc-800 dark:text-zinc-200 uppercase whitespace-normal line-clamp-2 leading-tight">{item.name}</div>
                                                <div className="text-[9px] md:text-[10px] text-zinc-500 whitespace-normal line-clamp-2 mt-0.5" title={item.notes}>{item.notes || '-'}</div>
                                            </div>

                                            {/* Minimalistisk Quick-Adjust */}
                                            <div className="w-20 md:w-24 border-r border-zinc-200 dark:border-white/10 px-1 py-3 text-center shrink-0 flex items-center justify-center gap-1 md:gap-2">
                                                <button 
                                                    onClick={(e) => { e.stopPropagation(); handleQuickAdjust(item, -1); }} 
                                                    className="w-5 h-5 flex items-center justify-center text-zinc-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 rounded transition-all active:scale-95" 
                                                    title="Minska saldo"
                                                >
                                                    <SafeIcon name="minus" size={13} />
                                                </button>
                                                
                                                <span className="font-bold text-[11px] md:text-[13px] text-zinc-900 dark:text-white w-4 text-center">
                                                    {qty}
                                                </span>
                                                
                                                <button 
                                                    onClick={(e) => { e.stopPropagation(); handleQuickAdjust(item, 1); }} 
                                                    className="w-5 h-5 flex items-center justify-center text-zinc-400 hover:text-emerald-500 hover:bg-emerald-50 dark:hover:bg-emerald-500/10 rounded transition-all active:scale-95" 
                                                    title="Öka saldo"
                                                >
                                                    <SafeIcon name="plus" size={13} />
                                                </button>
                                            </div>

                                            {/* Minskad px-3 till pr-2 för att putta dem till höger, gap minskat från 2 till 1.5, storlek w-8 h-8 */}
                                                <div className="w-[180px] px-2 py-3 justify-center gap-1.5 hidden sm:flex shrink-0 items-center">
                                                    <div className="flex items-center gap-1.5 opacity-75 group-hover:opacity-100 transition-opacity">
                                                        <button onClick={(e)=>{e.stopPropagation(); setLinkingItem(item);}} className="w-9 h-9 flex items-center justify-center rounded-lg bg-white dark:bg-black/20 border border-zinc-200 dark:border-white/10 text-zinc-400 hover:text-orange-500 hover:border-orange-200 shadow-sm transition-all" title="Koppla till arbetsorder"><SafeIcon name="link" size={16}/></button>
                                                        <button onClick={(e)=>{e.stopPropagation(); setEditingItem(item);}} className="w-9 h-9 flex items-center justify-center rounded-lg bg-white dark:bg-black/20 border border-zinc-200 dark:border-white/10 text-zinc-400 hover:text-blue-500 hover:border-blue-200 shadow-sm transition-all" title="Redigera artikel"><SafeIcon name="pen" size={16}/></button>
                                                        <a href={generateTrodoLink(item.service_filter)} target="_blank" rel="noopener noreferrer" onClick={(e)=>e.stopPropagation()} className="w-9 h-9 flex items-center justify-center rounded-lg bg-white dark:bg-black/25 border border-zinc-200 dark:border-white/10 hover:border-blue-300 dark:hover:border-blue-500/50 shadow-sm transition-all group/btn" title="Sök hos Trodo">
                                                            <img src="https://www.google.com/s2/favicons?domain=trodo.se&sz=32" alt="Trodo" className="w-4 h-4 object-contain group-hover/btn:scale-110 transition-transform" />
                                                        </a>
                                                        <a href={generateThansenLink(item.service_filter)} target="_blank" rel="noopener noreferrer" onClick={(e)=>e.stopPropagation()} className="w-9 h-9 flex items-center justify-center rounded-lg bg-white dark:bg-black/25 border border-zinc-200 dark:border-white/10 hover:border-orange-300 dark:hover:border-orange-500/50 shadow-sm transition-all group/btn" title="Sök hos thansen">
                                                            <img src="https://www.google.com/s2/favicons?domain=thansen.se&sz=32" alt="thansen" className="w-4 h-4 object-contain group-hover/btn:scale-110 transition-transform" />
                                                        </a>
                                                    </div>
                                                </div>

                                            <div className="w-12 px-1 py-3 flex sm:hidden justify-center items-center shrink-0 relative">
                                                <button 
                                                    onClick={(e) => { e.stopPropagation(); setActiveMenuId(activeMenuId === item.id ? null : item.id); }} 
                                                    className={`w-10 h-10 flex items-center justify-center rounded-lg transition-all ${activeMenuId === item.id ? 'bg-orange-100 text-orange-500' : 'text-zinc-400 bg-transparent'}`}
                                                >
                                                    <SafeIcon name="more-vertical" size={20} />
                                                </button>
                                                
                                                {activeMenuId === item.id && (
                                                    <>
                                                        <div className="fixed inset-0 z-40" onClick={(e) => { e.stopPropagation(); setActiveMenuId(null); }}></div>
                                                        <div className="absolute right-12 top-1/2 -translate-y-1/2 z-50 bg-white dark:bg-[#182032] border-2 border-zinc-200 dark:border-zinc-700 shadow-2xl rounded-2xl p-1.5 flex gap-1.5 animate-in fade-in zoom-in-95">
                                                            <button onClick={(e)=>{e.stopPropagation(); setActiveMenuId(null); setLinkingItem(item);}} className="w-12 h-12 flex items-center justify-center rounded-lg bg-zinc-50 dark:bg-white/5 text-zinc-600 dark:text-zinc-300 hover:bg-orange-50 dark:hover:bg-orange-500/20 hover:text-orange-500"><SafeIcon name="link" size={20}/></button>
                                                            <button onClick={(e)=>{e.stopPropagation(); setActiveMenuId(null); setEditingItem(item);}} className="w-12 h-12 flex items-center justify-center rounded-lg bg-zinc-50 dark:bg-white/5 text-zinc-600 dark:text-zinc-300 hover:bg-blue-50 dark:hover:bg-blue-500/20 hover:text-blue-500"><SafeIcon name="pen" size={20}/></button>
                                                            <a href={generateTrodoLink(item.service_filter)} target="_blank" rel="noopener noreferrer" onClick={(e)=>{e.stopPropagation(); setActiveMenuId(null);}} className="w-12 h-12 flex items-center justify-center rounded-lg bg-blue-50 dark:bg-blue-500/10 hover:bg-blue-100 dark:hover:bg-blue-500/30 transition-colors">
                                                                <img src="https://www.google.com/s2/favicons?domain=trodo.se&sz=32" alt="Trodo" className="w-5 h-5 object-contain" />
                                                            </a>
                                                            <a href={generateThansenLink(item.service_filter)} target="_blank" rel="noopener noreferrer" onClick={(e)=>{e.stopPropagation(); setActiveMenuId(null);}} className="w-12 h-12 flex items-center justify-center rounded-lg bg-orange-50 dark:bg-orange-500/10 hover:bg-orange-100 dark:hover:bg-orange-500/30 transition-colors">
                                                                <img src="https://www.google.com/s2/favicons?domain=thansen.se&sz=32" alt="thansen" className="w-5 h-5 object-contain" />
                                                            </a>
                                                        </div>
                                                    </>
                                                )}
                                            </div>
                                        </div>
                                    )
                                })
                            )}

                            {/* Visa bannern i BOTTEN av listan ENDAST om det finns träffar i lagret */}
                            {filteredItems.length > 0 && search && (
                                <div className="p-4 md:p-6 border-b border-zinc-200 dark:border-white/10 bg-zinc-50/50 dark:bg-[#1a2235]/30 flex flex-col sm:flex-row items-center justify-between gap-4 animate-in fade-in">
                                    <div className="flex items-center gap-3 w-full sm:w-auto">
                                        <div className="w-10 h-10 rounded-full bg-blue-50 dark:bg-blue-500/10 flex items-center justify-center shrink-0 border border-blue-100 dark:border-blue-500/20">
                                            <SafeIcon name="globe" size={18} className="text-blue-500" />
                                        </div>
                                        <div className="min-w-0 text-left">
                                            <div className="text-[11px] md:text-[12px] font-black text-zinc-900 dark:text-white uppercase tracking-wider truncate">Hittar du inte rätt del?</div>
                                            <div className="text-[9px] md:text-[10px] text-zinc-500 truncate">Sök efter "{search}" hos leverantörer</div>
                                        </div>
                                    </div>
                                    <div className="flex gap-2 w-full sm:w-auto shrink-0">
                                        <a href={generateTrodoLink(search)} target="_blank" rel="noopener noreferrer" className="flex-1 sm:flex-none sm:w-28 h-10 bg-white dark:bg-[#121826] hover:bg-zinc-100 dark:hover:bg-white/5 border border-zinc-200 dark:border-white/10 rounded-xl text-[10px] font-bold text-zinc-700 dark:text-zinc-300 uppercase tracking-widest flex items-center justify-center gap-2 shadow-sm transition-all hover:border-blue-300">
                                            <img src="https://www.google.com/s2/favicons?domain=trodo.se&sz=32" className="w-3.5 h-3.5 object-contain" alt="Trodo" /> Trodo
                                        </a>
                                        <a href={generateThansenLink(search)} target="_blank" rel="noopener noreferrer" className="flex-1 sm:flex-none sm:w-28 h-10 bg-white dark:bg-[#121826] hover:bg-zinc-100 dark:hover:bg-white/5 border border-zinc-200 dark:border-white/10 rounded-xl text-[10px] font-bold text-zinc-700 dark:text-zinc-300 uppercase tracking-widest flex items-center justify-center gap-2 shadow-sm transition-all hover:border-orange-300">
                                            <img src="https://www.google.com/s2/favicons?domain=thansen.se&sz=32" className="w-3.5 h-3.5 object-contain" alt="thansen" /> thansen
                                        </a>
                                    </div>
                                </div>
                            )}

                            {filteredItems.length > 0 && !search && <div className="h-4 w-full shrink-0"></div>}
                        </div>
                    </div>
                </div>

                <div className="hidden md:flex w-full bg-[#e9edf2] dark:bg-[#0f1522] border-t border-zinc-300 dark:border-white/10 p-2 overflow-x-auto custom-scrollbar shrink-0 items-center gap-2">
                    {etkaCategories.map(cat => {
                        const isSelected = activeArea === cat.id;
                        const config = diagramConfig[cat.id] || diagramConfig['Alla'];
                        return (
                            <button
                                key={cat.id}
                                onClick={() => handleSelectArea(cat.id)}
                                className={`shrink-0 relative w-28 h-36 bg-white dark:bg-[#182032] border transition-all cursor-pointer group overflow-hidden hover:border-zinc-800 dark:hover:border-white ${isSelected ? 'border-zinc-900 dark:border-orange-500 ring-2 ring-orange-500/40 z-10' : 'border-zinc-300 dark:border-white/20'}`}
                                title={cat.name}
                            >
                                <img
                                    src={config.src}
                                    style={{ transform: `scale(${config.scale * 0.8})` }}
                                    className="absolute inset-0 w-full h-full object-contain p-2 dark:invert grayscale dark:contrast-125 opacity-85 group-hover:opacity-100 transition-opacity pointer-events-none"
                                    alt={cat.name}
                                />

                                {/* 
                                  Här skapar vi ETKA-krispigheten:
                                  1. style={{ fontFamily: 'Arial...' }} stänger av den moderna webbfonten
                                  2. text-black ger ren #000 svart färg
                                  3. pl-1.5 pt-0.5 maskerar skissen bakom utan att se ut som en "knapp"
                                */}
                                <div
                                    className="absolute bottom-1 right-1 bg-white dark:bg-[#182032] pl-1.5 pt-0.5 text-[11px] font-bold text-black dark:text-white uppercase pointer-events-none z-20"
                                    style={{
                                        fontFamily: 'Arial, Helvetica, sans-serif',
                                        letterSpacing: '0px',
                                        WebkitFontSmoothing: 'none' // Tar bort luddig utjämning i vissa webbläsare
                                    }}
                                >
                                    {cat.name}
                                </div>
                            </button>
                        );
                    })}
                    <div className="shrink-0 w-24 h-10 pointer-events-none"></div>
                </div>
            </div>

            {isScannerOpen && <LagerScannerModal items={items} onOpenItem={(item) => { setEditingItem(item); }} onAddNewWithCode={(code) => { setEditingItem({ service_filter: code }); }} onClose={() => setIsScannerOpen(false)} />}
            {/* Vår nya integrerade sidopanel anropas nu för både redigering och koppling */}
            {editingItem && <LagerSidePanel item={editingItem} defaultMode="edit" allJobs={allJobs} onClose={() => setEditingItem(null)} />}
            {linkingItem && <LagerSidePanel item={linkingItem} defaultMode="link" allJobs={allJobs} onClose={() => setLinkingItem(null)} />}
        </div>
    );
};
