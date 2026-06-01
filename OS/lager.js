// lager.js

// --- Huvudikoner från systemet ---
const SafeIcon = ({ name, size = 16, className = "" }) => {
    if (!window.Icon) return null;
    return (
        <span className={`inline-flex items-center justify-center shrink-0 ${className}`}>
            <window.Icon name={name} size={size} key={name + size} />
        </span>
    );
};

// --- Specialikoner för Lagret (Optimerade) ---
const LagerIcon = ({ category, name, size = 32, className = "" }) => {
    const cat = (category || "").toLowerCase();
    const itemName = (name || "").toLowerCase();

    let IconContent = <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" fill="currentColor" opacity="0.5" />;

    if (itemName.includes('klämma') || itemName.includes('avgasklämma') || cat.includes('skarvmuff')) {
        IconContent = <g stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="10" width="18" height="6" fill="currentColor" opacity="0.2" /><rect x="6" y="8" width="4" height="10" fill="currentColor" opacity="0.5" /><rect x="14" y="8" width="4" height="10" fill="currentColor" opacity="0.5" /><circle cx="8" cy="7" r="1.5" fill="currentColor" /><circle cx="16" cy="7" r="1.5" fill="currentColor" /></g>;
    } else if (itemName.includes('bromsok') || itemName.includes('caliper') || cat.includes('bromsok')) {
        IconContent = <g fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 4v16M18 4h-2c-4 0-8 4-8 8s4 8 8 8h2" strokeWidth="1.8" /><circle cx="12" cy="7" r="1.5" fill="currentColor" opacity="0.5" /><circle cx="10" cy="12" r="1.5" fill="currentColor" opacity="0.5" /><circle cx="12" cy="17" r="1.5" fill="currentColor" opacity="0.5" /><path d="M15 8v8" opacity="0.3" /></g>;
    } else if (itemName.includes('fat') || itemName.includes('olja') || cat.includes('motorolja')) {
        IconContent = <g stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"><rect x="6" y="4" width="12" height="16" rx="1.5" fill="#f97316" stroke="none" /><rect x="5" y="3.5" width="14" height="1.5" rx="0.7" fill="#ea580c" stroke="none" /><rect x="5" y="11.2" width="14" height="1.5" rx="0.7" fill="#ea580c" stroke="none" /><rect x="5" y="19" width="14" height="1.5" rx="0.7" fill="#ea580c" stroke="none" /><rect x="8" y="2" width="3" height="1.5" fill="currentColor" opacity="0.8" /><path d="M12 6.5 c-1.2 1.8 -1.5 3 -1.5 4 a1.5 1.5 0 0 0 3 0 c0 -1 -0.3 -2.2 -1.5 -4z" fill="#0f172a" stroke="none" opacity="0.8" /><path d="M9 15h6M10 17h4" strokeWidth="0.8" stroke="#000" opacity="0.3" /></g>;
    } else if (itemName.includes('insprut') || itemName.includes('spridare') || cat.includes('insprut')) {
        IconContent = <g stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 19l2 2 15-15-2-2-15 15z" fill="currentColor" opacity="0.3" /><path d="M16 4l4 4M7 17l4 4" /><rect x="14" y="3" width="6" height="4" transform="rotate(-45 17 5)" fill="#f97316" stroke="none" /><rect x="6" y="15" width="5" height="4" transform="rotate(-45 8.5 17)" fill="#f97316" stroke="none" /><path d="M4 20l-2 2" strokeWidth="2" /><rect x="11" y="9" width="4" height="4" transform="rotate(-45 13 11)" fill="currentColor" opacity="0.8" stroke="none" /></g>;
    } else if (itemName.includes('fjäder') || itemName.includes('fjädrar') || cat.includes('fjäder')) {
        IconContent = <g fill="currentColor" opacity="0.8"><rect x="4" y="2" width="16" height="2.5" rx="1.2" /><path d="M6 4.5l12 3v2.5l-12-3z" /><rect x="4" y="7" width="16" height="2.5" rx="1.2" /><path d="M6 9.5l12 3v2.5l-12-3z" /><rect x="4" y="12" width="16" height="2.5" rx="1.2" /><path d="M6 14.5l12 3v2.5l-12-3z" /><rect x="4" y="17" width="16" height="2.5" rx="1.2" /><rect x="4" y="21" width="16" height="2.5" rx="1.2" /></g>;
    } else if (itemName.includes('rem') || cat.includes('rem')) {
        IconContent = <g stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 5L20 16H4L12 5" fill="none" stroke="#f97316" strokeWidth="2.5" /><circle cx="12" cy="6" r="4" fill="currentColor" opacity="0.2" /><circle cx="12" cy="6" r="2" fill="currentColor" opacity="0.8" /><circle cx="18" cy="16" r="3.5" fill="currentColor" opacity="0.4" /><circle cx="18" cy="16" r="1.5" fill="currentColor" opacity="0.8" /><circle cx="6" cy="16" r="5" fill="currentColor" opacity="0.6" /><circle cx="6" cy="16" r="2.5" fill="currentColor" opacity="0.3" /><circle cx="6" cy="16" r="0.8" fill="currentColor" stroke="none" /></g>;
    } else if (itemName.includes('glödstift') || cat.includes('glödstift')) {
        IconContent = <g stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"><rect x="11.5" y="2" width="1" height="3" fill="currentColor" opacity="0.6" /><rect x="10" y="5" width="4" height="8" fill="currentColor" opacity="0.3" /><path d="M10 7h4M10 9h4M10 11h4" strokeWidth="0.5" opacity="0.5" /><path d="M11.5 13v7" strokeWidth="2" opacity="0.7" /><path d="M11.5 18v3" stroke="#f97316" strokeWidth="2.5" /><path d="M11.5 20v1.5" stroke="#fbbf24" strokeWidth="1.5" /></g>;
    } else if (cat.includes('kupefilter') || itemName.includes('kupefilter') || cat.includes('kupé')) {
        IconContent = <g stroke="none"><rect x="2" y="5" width="20" height="14" rx="1.5" fill="currentColor" opacity="0.8" /><rect x="4" y="7" width="16" height="10" rx="0.5" fill="#f8fafc" /><path d="M4 9h16M4 11h16M4 13h16M4 15h16" stroke="#cbd5e1" strokeWidth="0.6" /><rect x="4" y="7" width="16" height="10" rx="0.5" fill="none" stroke="#e2e8f0" strokeWidth="0.5"/></g>;
    } else if (itemName.includes('tändstift') || cat.includes('tändstift')) {
        IconContent = <g stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2v2" strokeWidth="2" opacity="0.6"/><rect x="10" y="4" width="4" height="7" rx="0.5" fill="currentColor" opacity="0.1" strokeWidth="0.8"/><path d="M10 6h4M10 8h4" strokeWidth="0.5" opacity="0.3"/><rect x="9" y="11" width="6" height="3" rx="0.5" fill="currentColor" opacity="0.4" stroke="none"/><rect x="10.5" y="14" width="3" height="6" fill="currentColor" opacity="0.3" stroke="none"/><path d="M10.5 15l3 1M10.5 17l3 1M10.5 19l3 1" strokeWidth="0.5" opacity="0.5"/><rect x="10.5" y="14" width="3" height="6" fill="none"/><path d="M11 22v1c0 .6.4 1 1 1h2" fill="none" strokeWidth="1.2"/></g>;
    } else if (itemName.includes('bränslefilter') || cat.includes('bränslefilter')) {
        IconContent = <g stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" fill="none"><path d="M3 12h3M20 12h2" strokeWidth="1.5"/><rect x="6" y="9" width="4" height="6" fill="currentColor" opacity="0.4" stroke="none"/><path d="M10 9l3-2v10l-3-2z" fill="currentColor" opacity="0.2" stroke="none"/><rect x="13" y="8" width="7" height="8" fill="currentColor" opacity="0.6" stroke="none"/><path d="M13 18.5c0 1.2-1 2-1.5 2s-1.5-.8-1.5-2 1.5-3 1.5-3 1.5 1.8 1.5 3z" fill="#f97316" stroke="none" /><path d="M7 5c2-3 8-3 11 1" stroke="#86efac" strokeWidth="2"/><path d="M16 6.5l2.5.5L18 4.5" stroke="#86efac" strokeWidth="2"/><path d="M18 19c-2 3-8 3-11-1" stroke="#fca5a5" strokeWidth="2"/><path d="M9 18.5l-2.5-.5L7 20.5" stroke="#fca5a5" strokeWidth="2"/><rect x="6" y="9" width="4" height="6"/><path d="M10 9l3-2v10l-3-2z"/><rect x="13" y="8" width="7" height="8"/></g>;
    } else if (cat.includes('oljefilter') || itemName.includes('oljefilter') || cat.includes('dsg') || itemName.includes('dsg')) {
        IconContent = <g stroke="currentColor" strokeWidth="1.2"><rect x="11" y="2" width="2" height="20" fill="currentColor" opacity="0.8" /> <ellipse cx="12" cy="6" rx="6" ry="2" fill="#fff" /> <rect x="7" y="6" width="10" height="13" fill="#f97316" stroke="none" /> <path d="M9 6 v13 M12 8 v11 M15 6 v13" strokeWidth="0.8" stroke="#000" opacity="0.2" /> <ellipse cx="12" cy="19" rx="6" ry="2" fill="none" /></g>;
    } else if (cat.includes('filter') || itemName.includes('filter')) {
        IconContent = <g><path d="M2 10l16-4l4 2l-16 4z" fill="#f97316" /> <path d="M2 10l4 8l16-4l-4-8z" fill="#fbbf24" /> <path d="M2 10l4 8l0 3l-4-8z" fill="#ea580c" /><path d="M6 18l16-4l0 3l-16 4z" fill="#ea580c" /><path d="M5 9.2l3 6M8 8.4l3 6M11 7.6l3 6M14 6.8l3 6M17 6l3 6" stroke="#fff" strokeWidth="1.2" opacity="0.5" /></g>;
    } else if (cat.includes('bromsskivor') || itemName.includes('bromsskivor')) {
        IconContent = <g fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"><circle cx="13" cy="13" r="8.5" /><circle cx="13" cy="13" r="3.2" /><circle cx="13" cy="11.5" r="0.5" fill="currentColor" stroke="none" /><circle cx="14.5" cy="13" r="0.5" fill="currentColor" stroke="none" /><circle cx="13" cy="14.5" r="0.5" fill="currentColor" stroke="none" /><circle cx="11.5" cy="13" r="0.5" fill="currentColor" stroke="none" /><path d="M13 6v2M18 8l-1.5 1.5M20 13h-2M18 18l-1.5-1.5M13 20v-2M8 18l1.5-1.5M6 13h2M8 8l1.5 1.5" strokeWidth="0.8" opacity="0.3" /><path d="M9.5 3.2C6.5 3.8 4.2 6.2 3.5 9.2l1.8 1.8 4.2-2.5 1.5-4.5-1.5-.8z" fill="#ef4444" stroke="#b91c1c" strokeWidth="0.6" /><circle cx="5.2" cy="6.8" r="0.7" fill="#fff" stroke="none" /><circle cx="8" cy="9" r="0.7" fill="#fff" stroke="none" /></g>;
    } else if (itemName.includes('bromsbelägg') || cat.includes('bromsbelägg')) {
        IconContent = <g fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M7 10h10v6H7z" fill="currentColor" opacity="0.1" /><path d="M7 10l-2 2v2l2 2M17 10l2 2v2l-2 2" /><path d="M12 10v6" strokeWidth="1" opacity="0.5" /><path d="M5 11v-2h2M19 11v-2h-2" /></g>;
    }

    return <svg viewBox="0 0 24 24" width={size} height={size} className={`text-zinc-600 dark:text-zinc-300 ${className}`}>{IconContent}</svg>;
};

// --- Hjälpfunktioner ---
const generateTrodoLink = (f) => f ? `https://www.trodo.se/catalogsearch/result/premium?filter[quality_group]=2&product_list_dir=asc&product_list_order=price&q=${encodeURIComponent(f.replace(/[\s-]/g, ''))}` : '#';
const generateThansenLink = (f) => f ? `https://www.thansen.se/search?query=${encodeURIComponent(f.replace(/[\s-]/g, ''))}` : '#';

// --- NY SKANNER MODAL FÖR BÅDE MOBIL & DATOR ---
const LagerScannerModal = ({ items, onOpenItem, onAddNewWithCode, onClose }) => {
    const [scannedCode, setScannedCode] = React.useState('');
    const [scanError, setScanError] = React.useState('');
    const inputRef = React.useRef(null);

    React.useEffect(() => {
        if (inputRef.current) inputRef.current.focus();
    }, []);

    const handleImageUpload = (e) => {
        const file = e.target.files[0];
        if (!file) return;
        // Här kan ett bibliotek (t.ex. html5-qrcode) kopplas in för att läsa filen framöver
        alert(`Bild mottagen: ${file.name}\n(Här kan ett system för bildtolkning kopplas in i framtiden)`);
    };

    const handleCodeSubmit = (e) => {
        e.preventDefault();
        const cleanCode = scannedCode.trim().toUpperCase();
        if (!cleanCode) return;

        // Sök efter exakt matchning i lagret baserat på service_filter (Art.nummer)
        const foundItem = items.find(i => (i.service_filter || '').toUpperCase().replace(/[^A-Z0-9]/g, '') === cleanCode.replace(/[^A-Z0-9]/g, ''));

        if (foundItem) {
            onOpenItem(foundItem);
            onClose();
        } else {
            setScanError(`Ingen träff i lagret för "${cleanCode}"`);
        }
    };

    return (
        <div className="fixed inset-0 z-[9999] flex items-end sm:items-center justify-center p-0 sm:p-4">
            <div className="absolute inset-0 bg-zinc-900/60 dark:bg-black/80 backdrop-blur-sm transition-opacity" onClick={onClose}></div>
            <div className="relative w-full max-w-md bg-white dark:bg-[#182032] rounded-t-3xl sm:rounded-3xl shadow-2xl border border-zinc-200 dark:border-white/10 p-6 animate-in slide-in-from-bottom sm:zoom-in-95 duration-200">
                
                <div className="flex justify-between items-center mb-6">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-orange-50 dark:bg-orange-500/10 text-orange-500 border border-orange-200 dark:border-orange-500/20 flex items-center justify-center shadow-sm">
                            <SafeIcon name="scan" size={20} />
                        </div>
                        <div>
                            <h2 className="text-sm font-black text-zinc-900 dark:text-white uppercase tracking-widest">Skanna Artikel</h2>
                            <p className="text-[10px] text-zinc-500 uppercase font-bold tracking-wider">Kamera eller Manuell inmatning</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="w-8 h-8 flex items-center justify-center text-zinc-400 hover:text-zinc-900 dark:hover:text-white bg-zinc-100 dark:bg-[#121826] rounded-lg border border-zinc-200 dark:border-white/10">
                        <SafeIcon name="x" size={14} />
                    </button>
                </div>

                <form onSubmit={handleCodeSubmit} className="space-y-5">
                    
                    <div className="grid grid-cols-2 gap-3">
                        {/* Öppnar Kameran via capture="environment" */}
                        <label className="relative h-28 bg-zinc-100 dark:bg-[#0f1522] rounded-2xl border-2 border-dashed border-zinc-300 dark:border-zinc-700 overflow-hidden flex flex-col items-center justify-center text-center p-3 group cursor-pointer hover:bg-zinc-200 dark:hover:bg-zinc-800 transition-colors">
                            <input type="file" accept="image/*" capture="environment" className="hidden" onChange={handleImageUpload} />
                            <SafeIcon name="camera" size={28} className="text-zinc-400 group-hover:text-orange-500 transition-colors mb-2" />
                            <span className="text-[11px] text-zinc-700 dark:text-zinc-300 font-bold uppercase tracking-widest">Kamera</span>
                            <span className="text-[8px] text-zinc-500 mt-1 max-w-[90%] leading-relaxed">Öppna direkt</span>
                        </label>

                        {/* Välj fil från telefonen/datorn utan capture */}
                        <label className="relative h-28 bg-zinc-100 dark:bg-[#0f1522] rounded-2xl border-2 border-dashed border-zinc-300 dark:border-zinc-700 overflow-hidden flex flex-col items-center justify-center text-center p-3 group cursor-pointer hover:bg-zinc-200 dark:hover:bg-zinc-800 transition-colors">
                            <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
                            <SafeIcon name="image" size={28} className="text-zinc-400 group-hover:text-orange-500 transition-colors mb-2" />
                            <span className="text-[11px] text-zinc-700 dark:text-zinc-300 font-bold uppercase tracking-widest">Välj fil</span>
                            <span className="text-[8px] text-zinc-500 mt-1 max-w-[90%] leading-relaxed">Från bibliotek</span>
                        </label>
                    </div>

                    <div className="relative">
                        <input
                            ref={inputRef}
                            type="text" value={scannedCode}
                            onChange={e => { setScannedCode(e.target.value); setScanError(''); }}
                            className="w-full bg-zinc-50 dark:bg-[#0f1522] border border-zinc-200 dark:border-white/10 rounded-xl px-4 py-3 text-center text-sm font-mono font-bold tracking-widest text-zinc-900 dark:text-white outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all shadow-inner"
                            placeholder="Art. nummer eller streckkod"
                        />
                    </div>

                    {scanError && (
                        <div className="bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 rounded-xl p-4 text-center animate-in fade-in zoom-in-95 duration-200 flex flex-col gap-3">
                            <p className="text-xs font-bold text-red-600 dark:text-red-400">{scanError}</p>
                            
                            <div className="flex gap-2">
                                <a href={generateTrodoLink(scannedCode)} target="_blank" rel="noopener noreferrer" className="flex-1 h-10 bg-white dark:bg-[#121826] hover:bg-zinc-50 border border-zinc-200 dark:border-white/10 rounded-lg text-[10px] font-bold text-zinc-700 dark:text-zinc-300 uppercase tracking-widest flex items-center justify-center gap-1.5 shadow-sm transition-all">
                                    <SafeIcon name="external-link" size={12} /> Trodo
                                </a>
                                <a href={generateThansenLink(scannedCode)} target="_blank" rel="noopener noreferrer" className="flex-1 h-10 bg-white dark:bg-[#121826] hover:bg-zinc-50 border border-zinc-200 dark:border-white/10 rounded-lg text-[10px] font-bold text-zinc-700 dark:text-zinc-300 uppercase tracking-widest flex items-center justify-center gap-1.5 shadow-sm transition-all">
                                    <SafeIcon name="external-link" size={12} /> thansen
                                </a>
                            </div>

                            <button type="button" onClick={() => { onAddNewWithCode(scannedCode.toUpperCase()); onClose(); }} className="w-full h-10 bg-orange-500 hover:bg-orange-600 text-white rounded-lg text-[10px] font-bold uppercase tracking-widest flex items-center justify-center gap-1.5 shadow-md transition-all">
                                <SafeIcon name="plus" size={12} /> Lägg till i databasen
                            </button>
                        </div>
                    )}

                    {!scanError && (
                        <button type="submit" className="w-full h-12 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-400 hover:to-orange-500 text-white font-bold text-xs uppercase tracking-widest rounded-xl shadow-[0_4px_14px_0_rgba(249,115,22,0.39)] hover:shadow-[0_6px_20px_rgba(249,115,22,0.23)] active:scale-95 flex items-center justify-center gap-2 transition-all">
                            <SafeIcon name="search" size={14} /> Sök i databas
                        </button>
                    )}
                </form>
            </div>
        </div>
    );
};

// --- STABIL MODAL (Redigering & Ny Artikel) ---
const LagerItemModal = ({ item, defaultCode = '', onClose }) => {
    const [formData, setFormData] = React.useState({
        name: item?.name || '',
        price: item?.price || '',
        category: item?.category || 'Service',
        quantity: item?.quantity || '',
        service_filter: item?.service_filter || defaultCode || '',
        notes: item?.notes || ''
    });

    const isNew = !item?.id;

    const handleSave = async (e) => {
        e.preventDefault();
        const dataToSave = { ...formData, price: parseInt(formData.price)||0, quantity: parseInt(formData.quantity)||0 };
        try {
            if (isNew) {
                await window.db.collection("lager").add(dataToSave);
            } else {
                await window.db.collection("lager").doc(String(item.id)).update(dataToSave);
            }
            onClose();
        } catch (err) {
            console.error("Kunde inte spara:", err);
            alert("Ett fel uppstod.");
        }
    };

    const handleDelete = async () => {
        if (!isNew && confirm("Är du säker på att du vill radera denna artikel permanent?")) {
            try {
                await window.db.collection("lager").doc(String(item.id)).delete();
                onClose();
            } catch (err) {
                console.error("Fel vid radering:", err);
            }
        }
    };

    const InputClass = "w-full bg-zinc-50 dark:bg-[#0f1522] border border-zinc-200/80 dark:border-white/10 rounded-xl px-4 py-3 text-[13px] font-medium text-zinc-900 dark:text-white outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all placeholder:text-zinc-400 dark:placeholder:text-zinc-600 shadow-inner";
    const LabelClass = "block text-[10px] font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-widest mb-1.5 ml-1";

    return (
        <div className="fixed inset-0 z-[9999] flex items-end sm:items-center justify-center p-0 sm:p-4">
            <div className="absolute inset-0 bg-zinc-900/40 dark:bg-black/60 backdrop-blur-sm transition-opacity animate-in fade-in duration-300" onClick={onClose}></div>
            
            <div className="relative w-full max-w-2xl bg-white dark:bg-[#182032] rounded-t-3xl sm:rounded-3xl shadow-2xl overflow-hidden border border-zinc-200 dark:border-white/10 animate-in slide-in-from-bottom sm:slide-in-from-bottom-0 sm:zoom-in-95 duration-200 flex flex-col max-h-[90vh]">
                
                <div className="w-full flex justify-center pt-3 pb-2 sm:hidden bg-zinc-50 dark:bg-[#1a2235]">
                    <div className="w-12 h-1.5 bg-zinc-200 dark:bg-white/10 rounded-full"></div>
                </div>

                <div className="px-6 py-5 flex justify-between items-center bg-zinc-50/80 dark:bg-[#1a2235]/50 border-b border-zinc-200/80 dark:border-white/5 relative overflow-hidden">
                    <div className="flex items-center gap-4 relative z-10">
                        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-orange-400 to-orange-600 text-white flex items-center justify-center shadow-md">
                            <SafeIcon name={isNew ? "plus" : "edit-2"} size={20} />
                        </div>
                        <div>
                            <h2 className="text-xl font-black text-zinc-900 dark:text-white uppercase tracking-tight leading-none">
                                {isNew ? 'LÄGG TILL ARTIKEL' : 'UPPDATERA ARTIKEL'}
                            </h2>
                            <p className="text-[10px] text-zinc-500 dark:text-zinc-400 font-bold tracking-widest uppercase mt-1">Lagerhantering // Databas</p>
                        </div>
                    </div>
                    <button type="button" onClick={onClose} className="w-10 h-10 flex items-center justify-center text-zinc-400 hover:text-zinc-900 dark:hover:text-white bg-white dark:bg-[#121826] border border-zinc-200 dark:border-white/10 rounded-xl transition-all hover:bg-zinc-50 dark:hover:bg-white/5 active:scale-95 shadow-sm relative z-10">
                        <SafeIcon name="x" size={16} />
                    </button>
                </div>

                <form onSubmit={handleSave} className="flex flex-col flex-1 overflow-hidden">
                    <div className="p-6 overflow-y-auto custom-scrollbar flex-1">
                        <div className="grid grid-cols-2 gap-5">
                            <div className="col-span-2 group">
                                <label className={LabelClass}>Artikelnamn / Beskrivning</label>
                                <input autoFocus required type="text" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className={InputClass} placeholder="T.ex. Bromsbeläggssats Bak..." />
                            </div>
                            <div className="col-span-2 sm:col-span-1 group">
                                <label className={LabelClass}>Art.Nummer / ID</label>
                                <input type="text" value={formData.service_filter} onChange={e => setFormData({...formData, service_filter: e.target.value.toUpperCase()})} className={`${InputClass} font-mono tracking-wider`} placeholder="BOS-1234" />
                            </div>
                            <div className="col-span-2 sm:col-span-1 group">
                                <label className={LabelClass}>Kategori</label>
                                <select value={formData.category} onChange={e => setFormData({...formData, category: e.target.value})} className={InputClass}>
                                    <option value="Service">Service</option>
                                    <option value="Motor/Chassi">Motor/Chassi</option>
                                    <option value="Bromsar">Bromsar</option>
                                    <option value="Andra Märken">Andra Märken</option>
                                </select>
                            </div>
                            <div className="group">
                                <label className={LabelClass}>Inköpspris / Värde</label>
                                <div className="relative">
                                    <input type="number" required value={formData.price} onChange={e => setFormData({...formData, price: e.target.value})} className={`${InputClass} pr-12 font-mono font-bold text-lg`} placeholder="0" />
                                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-400 text-[10px] font-bold uppercase tracking-widest">SEK</span>
                                </div>
                            </div>
                            <div className="group">
                                <label className={LabelClass}>Lagersaldo (st)</label>
                                <input type="number" required value={formData.quantity} onChange={e => setFormData({...formData, quantity: e.target.value})} className={`${InputClass} font-mono font-bold text-lg`} placeholder="0" />
                            </div>
                            <div className="col-span-2 group">
                                <label className={LabelClass}>Egenskaper / Specifikation</label>
                                <textarea rows="2" value={formData.notes} onChange={e => setFormData({...formData, notes: e.target.value})} className={`${InputClass} resize-none`} placeholder="Placering: Bakaxel. Passar VAG plattform..." />
                            </div>
                            
                            {!isNew && (
                                <div className="col-span-2 mt-4 pt-5 border-t border-zinc-200/80 dark:border-white/5">
                                    <label className={`${LabelClass} flex items-center gap-2 mb-3`}>
                                        <SafeIcon name="history" size={12} className="text-orange-500" /> Transaktionshistorik
                                    </label>
                                    
                                    {item?.history && item.history.length > 0 ? (
                                        <div className="space-y-2 max-h-48 overflow-y-auto custom-scrollbar pr-2">
                                            {[...item.history].sort((a,b) => new Date(b.date) - new Date(a.date)).map((log, idx) => (
                                                <div key={idx} className="flex justify-between items-center bg-white dark:bg-[#121826] p-3 rounded-xl border border-zinc-200/80 dark:border-white/5 shadow-sm hover:border-orange-500/30 transition-colors">
                                                    <div className="flex items-center gap-3.5">
                                                        <div className="w-9 h-9 rounded-lg bg-orange-50 dark:bg-orange-500/10 text-orange-600 dark:text-orange-400 flex items-center justify-center border border-orange-200/50 dark:border-orange-500/20 shadow-sm">
                                                            <SafeIcon name="arrow-up-right" size={14} />
                                                        </div>
                                                        <div>
                                                            <div className="text-[12px] font-black text-zinc-900 dark:text-white uppercase tracking-wider">{log.regnr}</div>
                                                            <div className="text-[10px] text-zinc-500 mt-0.5">{log.kundnamn} • {log.date ? log.date.split('T')[0] : ''}</div>
                                                        </div>
                                                    </div>
                                                    <div className="text-[14px] font-black font-mono text-red-500 dark:text-red-400 shrink-0">
                                                        -{log.qty} st
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <div className="text-center py-6 bg-zinc-50/50 dark:bg-[#121826]/50 rounded-xl border border-zinc-200/50 dark:border-white/5 border-dashed">
                                            <div className="w-10 h-10 mx-auto rounded-full bg-zinc-100 dark:bg-white/5 flex items-center justify-center mb-2">
                                                <SafeIcon name="inbox" size={16} className="text-zinc-400" />
                                            </div>
                                            <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-400">Inga transaktioner registrerade</span>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="px-6 py-5 border-t border-zinc-100 dark:border-white/5 bg-zinc-50/50 dark:bg-[#1a2235]/50 flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-between gap-3">
                        {!isNew ? (
                            <button type="button" onClick={handleDelete} className="h-12 px-5 flex items-center justify-center text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 rounded-xl hover:bg-red-100 dark:hover:bg-red-500/20 transition-all active:scale-95 shadow-sm font-bold uppercase tracking-widest text-[11px]">
                                <SafeIcon name="trash-2" size={16} className="mr-2" /> Radera
                            </button>
                        ) : <div className="hidden sm:block"></div>}
                        
                        <div className="flex gap-3">
                            <button type="button" onClick={onClose} className="flex-1 sm:w-32 h-12 text-[11px] font-bold text-zinc-600 dark:text-zinc-300 bg-white dark:bg-[#121826] border border-zinc-200 dark:border-white/10 rounded-xl hover:bg-zinc-50 dark:hover:bg-white/5 transition-all uppercase tracking-widest active:scale-95 shadow-sm">
                                Avbryt
                            </button>
                            <button type="submit" className="flex-1 sm:w-40 h-12 text-[11px] font-bold text-white bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-400 hover:to-orange-500 border border-orange-400/50 rounded-xl shadow-[0_8px_20px_-6px_rgba(249,115,22,0.4)] transition-all active:scale-95 flex items-center justify-center gap-2 uppercase tracking-widest">
                                <SafeIcon name="check" size={16} /> Spara
                            </button>
                        </div>
                    </div>
                </form>
            </div>
        </div>
    );
};


// --- KOPPLA ARTIKEL TILL UPPDRAG (MED LOGGNING) ---
const LagerLinkJobModal = ({ item, allJobs, onClose }) => {
    const [qty, setQty] = React.useState(1);
    const [search, setSearch] = React.useState('');
    const [selectedJob, setSelectedJob] = React.useState(null);
    const [isSaving, setIsSaving] = React.useState(false);

    const activeJobs = React.useMemo(() => {
        let jobs = allJobs.filter(j => j.status !== 'FAKTURERAS' && !j.deleted);
        if (search) {
            const s = search.toLowerCase();
            jobs = jobs.filter(j => (j.regnr||'').toLowerCase().includes(s) || (j.kundnamn||'').toLowerCase().includes(s));
        }
        return jobs.sort((a,b) => (b.datum||'').localeCompare(a.datum||''));
    }, [allJobs, search]);

    const handleLink = async (e) => {
        e.preventDefault();
        if (!selectedJob) return alert("Välj en arbetsorder först.");
        
        setIsSaving(true);
        try {
            const jobIdStr = String(selectedJob.id).trim();
            const itemIdStr = String(item.id).trim();

            const jobRef = window.db.collection('jobs').doc(jobIdStr);
            const partRef = window.db.collection('lager').doc(itemIdStr);

            await window.db.runTransaction(async (t) => {
                const jobDoc = await t.get(jobRef);
                const partDoc = await t.get(partRef);
                
                if(!jobDoc.exists || !partDoc.exists) throw new Error("Dokument hittades inte i databasen.");

                const jData = jobDoc.data();
                const pData = partDoc.data();

                const currentQty = parseInt(pData.quantity) || 0;
                const newQty = Math.max(0, currentQty - qty);

                const currentHistory = pData.history || [];
                const logEntry = {
                    date: new Date().toISOString(),
                    action: 'KOPPLAD',
                    qty: qty,
                    regnr: jData.regnr || 'SAKNAS',
                    jobId: jobIdStr,
                    kundnamn: jData.kundnamn || 'Okänd'
                };

                t.update(partRef, { 
                    quantity: newQty,
                    history: [...currentHistory, logEntry] 
                });

                let utgifter = jData.utgifter || [];
                let added = false;
                const partTotalCost = (parseFloat(pData.price) || 0) * qty;
                const descName = qty > 1 ? `${qty}x ${pData.name}` : pData.name;
                
                utgifter = utgifter.map(u => {
                    if (!added && (!u.namn || u.namn.trim() === '')) {
                        added = true;
                        return { namn: descName, kostnad: String(partTotalCost), qty: 1, partId: itemIdStr, deducted: true };
                    }
                    return u;
                });
                
                if (!added) {
                    utgifter.push({ namn: descName, kostnad: String(partTotalCost), qty: 1, partId: itemIdStr, deducted: true });
                }

                const currentPrice = parseFloat(jData.kundpris) || 0;
                t.update(jobRef, {
                    utgifter: utgifter,
                    kundpris: String(currentPrice + partTotalCost)
                });
            });

            onClose();
        } catch (err) {
            console.error("Fel vid koppling:", err);
            alert("Något gick fel vid kopplingen av artikeln.");
            setIsSaving(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[9999] flex items-end sm:items-center justify-center p-0 sm:p-4">
            <div className="absolute inset-0 bg-zinc-900/60 dark:bg-black/80 backdrop-blur-sm transition-opacity animate-in fade-in duration-300" onClick={onClose}></div>
            
            <div className="relative w-full max-w-lg bg-white dark:bg-[#182032] rounded-t-3xl sm:rounded-3xl shadow-2xl overflow-hidden border border-zinc-200 dark:border-white/10 animate-in slide-in-from-bottom sm:slide-in-from-bottom-0 sm:zoom-in-95 duration-200 flex flex-col max-h-[90vh]">
                
                <div className="px-5 py-4 border-b border-zinc-100 dark:border-white/5 flex items-center justify-between bg-zinc-50/50 dark:bg-[#1a2235]/50">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-orange-50 dark:bg-orange-500/10 text-orange-500 flex items-center justify-center border border-orange-200/50 dark:border-orange-500/20">
                            <SafeIcon name="link" size={18} />
                        </div>
                        <div>
                            <h2 className="text-[14px] font-black text-zinc-900 dark:text-white uppercase tracking-widest">Koppla Artikel</h2>
                            <p className="text-[9px] text-zinc-500 uppercase tracking-widest">Välj var reservdelen har monterats</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="w-8 h-8 flex items-center justify-center text-zinc-400 hover:text-zinc-900 bg-white dark:bg-[#121826] rounded-lg shadow-sm border border-zinc-200 dark:border-white/10 active:scale-95">
                        <SafeIcon name="x" size={14} />
                    </button>
                </div>

                <div className="p-5 overflow-y-auto custom-scrollbar flex-1">
                    <div className="bg-zinc-50 dark:bg-[#0f1522] border border-zinc-200 dark:border-white/5 rounded-xl p-4 mb-5 flex gap-4 items-center shadow-inner">
                        <div className="w-12 h-12 bg-white dark:bg-[#182032] rounded-lg flex items-center justify-center shadow-sm border border-zinc-200 dark:border-white/5 shrink-0">
                            <LagerIcon category={item.category} name={item.name} size={24} className="text-zinc-600 dark:text-zinc-300" />
                        </div>
                        <div className="flex-1 min-w-0">
                            <div className="text-[13px] font-black text-zinc-900 dark:text-white truncate">{item.name}</div>
                            <div className="text-[10px] text-zinc-500 font-mono mt-0.5">{item.service_filter || 'SAKNAS'}</div>
                        </div>
                        <div className="text-right shrink-0">
                            <div className="text-[13px] font-black font-mono text-zinc-900 dark:text-white">{item.price} kr</div>
                            <div className="text-[9px] font-bold text-zinc-400 uppercase tracking-widest">{(parseInt(item.quantity)||0)} i lager</div>
                        </div>
                    </div>

                    <div className="flex items-center justify-between mb-5 pb-5 border-b border-zinc-100 dark:border-white/5">
                        <label className="text-[11px] font-bold text-zinc-700 dark:text-zinc-300 uppercase tracking-widest flex items-center gap-2">
                            <SafeIcon name="layers" size={12} className="text-zinc-400" /> Antal att koppla
                        </label>
                        <div className="flex items-center bg-white dark:bg-[#121826] border border-zinc-200 dark:border-white/10 rounded-lg p-1 shadow-sm">
                            <button type="button" onClick={() => setQty(Math.max(1, qty - 1))} className="w-10 h-10 flex items-center justify-center text-zinc-500 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-50 dark:hover:bg-[#1a2235] rounded-md transition-colors"><SafeIcon name="minus" size={14} /></button>
                            <span className="w-12 text-center text-[15px] font-black font-mono text-zinc-900 dark:text-white">{qty}</span>
                            <button type="button" onClick={() => setQty(qty + 1)} className="w-10 h-10 flex items-center justify-center text-zinc-500 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-50 dark:hover:bg-[#1a2235] rounded-md transition-colors"><SafeIcon name="plus" size={14} /></button>
                        </div>
                    </div>

                    <div className="mb-3">
                        <label className="text-[11px] font-bold text-zinc-700 dark:text-zinc-300 uppercase tracking-widest flex items-center gap-2 mb-2">
                            <SafeIcon name="search" size={12} className="text-zinc-400" /> Välj Arbetsorder
                        </label>
                        <input 
                            type="text" 
                            placeholder="Sök regnr eller kundnamn..." 
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="w-full bg-zinc-50 dark:bg-[#0f1522] border border-zinc-200 dark:border-white/10 rounded-xl px-4 py-3 text-[12px] font-medium text-zinc-900 dark:text-white outline-none focus:border-orange-500 transition-all shadow-inner"
                        />
                    </div>

                    <div className="flex flex-col gap-2 max-h-[30vh] overflow-y-auto custom-scrollbar pr-1 mb-5">
                        {activeJobs.length === 0 ? (
                            <div className="text-center text-[10px] text-zinc-400 uppercase tracking-widest py-8">Inga aktiva jobb hittades</div>
                        ) : (
                            activeJobs.map(job => (
                                <div 
                                    key={job.id} 
                                    onClick={() => setSelectedJob(job)}
                                    className={`p-3 rounded-xl border transition-all cursor-pointer flex justify-between items-center group ${selectedJob?.id === job.id ? 'bg-orange-50 dark:bg-orange-500/10 border-orange-500 shadow-sm' : 'bg-white dark:bg-[#121826] border-zinc-200 dark:border-white/5 hover:border-orange-300 dark:hover:border-orange-500/40'}`}
                                >
                                    <div className="flex gap-3 items-center min-w-0">
                                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 border transition-colors ${selectedJob?.id === job.id ? 'bg-orange-500 text-white border-orange-500' : 'bg-zinc-50 dark:bg-[#1a2235] text-zinc-400 border-zinc-200 dark:border-white/10'}`}>
                                            <SafeIcon name={selectedJob?.id === job.id ? "check" : "car"} size={14} />
                                        </div>
                                        <div className="min-w-0">
                                            <div className={`font-black font-mono tracking-widest text-[13px] truncate ${selectedJob?.id === job.id ? 'text-orange-600 dark:text-orange-400' : 'text-zinc-900 dark:text-white'}`}>{job.regnr || 'Inget Regnr'}</div>
                                            <div className="text-[10px] text-zinc-500 truncate mt-0.5">{job.kundnamn} • {job.datum ? job.datum.split('T')[0] : 'Obokad'}</div>
                                        </div>
                                    </div>
                                    {window.Badge && <div className="shrink-0 scale-90 origin-right"><window.Badge status={job.status} /></div>}
                                </div>
                            ))
                        )}
                    </div>
                </div>

                <div className="px-5 py-4 border-t border-zinc-100 dark:border-white/5 bg-zinc-50/80 dark:bg-[#1a2235]/50 flex gap-3 z-10">
                    <button onClick={onClose} className="flex-1 h-12 bg-white dark:bg-[#121826] border border-zinc-200 dark:border-white/10 rounded-xl text-[11px] font-bold text-zinc-600 dark:text-zinc-300 uppercase tracking-widest hover:bg-zinc-50 active:scale-95 transition-all shadow-sm">
                        Avbryt
                    </button>
                    <button 
                        onClick={handleLink}
                        disabled={!selectedJob || isSaving}
                        className="flex-1 h-12 bg-gradient-to-r from-orange-500 to-orange-600 text-white border border-orange-400/50 rounded-xl text-[11px] font-bold uppercase tracking-widest shadow-[0_4px_14px_0_rgba(249,115,22,0.39)] disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-[0_6px_20px_rgba(249,115,22,0.23)] active:scale-95 transition-all flex items-center justify-center gap-2"
                    >
                        {isSaving ? <SafeIcon name="loader-2" size={14} className="animate-spin" /> : <SafeIcon name="check" size={14} />}
                        Slutför
                    </button>
                </div>

            </div>
        </div>
    );
};


// --- HUVUDVY FÖR LAGER ---
window.LagerView = ({ allJobs = [] }) => {
    const [items, setItems] = React.useState([]);
    const [search, setSearch] = React.useState("");
    const [activeCat, setActiveCat] = React.useState("Alla");
    const [stockFilter, setStockFilter] = React.useState("inStock");
    const [editingItem, setEditingItem] = React.useState(null); 
    const [linkingItem, setLinkingItem] = React.useState(null);
    const [sortBy, setSortBy] = React.useState("name_asc");
    const [copiedId, setCopiedId] = React.useState(null);

    // NYTT: Hanterar Skannermodalen
    const [isScannerOpen, setIsScannerOpen] = React.useState(false);
    const [scannedDefaultCode, setScannedDefaultCode] = React.useState('');

    React.useEffect(() => {
        if (!window.db) return;
        const unsub = window.db.collection("lager").onSnapshot(s => {
            setItems(s.docs.map(d => ({ id: d.id, ...d.data() })));
        });
        return () => unsub();
    }, []);

    React.useEffect(() => {
        if (window.lucide) {
            setTimeout(() => window.lucide.createIcons(), 50);
        }
    });

    const quickAdjustStock = async (e, item, amount) => {
        e.stopPropagation();
        const currentQty = parseInt(item.quantity) || 0;
        const newQty = Math.max(0, currentQty + amount);
        try {
            await window.db.collection("lager").doc(String(item.id)).update({ quantity: newQty });
        } catch (err) {
            console.error("Fel vid uppdatering av saldo", err);
        }
    };

    const handleCopyId = (e, text, id) => {
        e.stopPropagation();
        if (!text || text === 'SAKNAS') return;
        navigator.clipboard.writeText(text);
        setCopiedId(id);
        setTimeout(() => setCopiedId(null), 2000);
    };

    const keywords = ["OLJEFILTER", "LUFTFILTER", "KUPEFILTER", "BROMSBELÄGG", "TÄNDSTIFT", "BROMSSKIVOR"];
    
    const subFilters = React.useMemo(() => {
        const found = {};
        items.forEach(i => {
            const n = (i.name || "").toUpperCase();
            keywords.forEach(kw => { if (n.includes(kw)) found[kw] = (found[kw] || 0) + 1; });
        });
        return Object.keys(found).filter(kw => found[kw] > 0);
    }, [items]);

    const filteredItems = React.useMemo(() => {
        let res = [...items];

        if (stockFilter === 'inStock') res = res.filter(i => (parseInt(i.quantity)||0) > 0);
        if (stockFilter === 'outOfStock') res = res.filter(i => (parseInt(i.quantity)||0) <= 0);

        if (activeCat !== 'Alla') {
            if (keywords.includes(activeCat)) {
                res = res.filter(i => (i.name || "").toUpperCase().includes(activeCat));
            } else {
                res = res.filter(i => (i.category || "").toLowerCase() === activeCat.toLowerCase());
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

        res.sort((a,b) => {
            if(sortBy === "name_asc") return (a.name||"").localeCompare(b.name||"");
            if(sortBy === "price_asc") return (parseInt(a.price)||0) - (parseInt(b.price)||0);
            if(sortBy === "price_desc") return (parseInt(b.price)||0) - (parseInt(a.price)||0);
            if(sortBy === "stock_desc") return (parseInt(b.quantity)||0) - (parseInt(a.quantity)||0);
            return 0;
        });

        return res;
    }, [items, search, activeCat, stockFilter, sortBy]);

    const mainCats = ['Service', 'Motor/Chassi', 'Bromsar', 'Andra Märken'];

    const renderStepper = (item, qty, inStock) => (
        <div className="flex items-center bg-white dark:bg-[#0f1522] border border-zinc-200/80 dark:border-white/10 rounded-lg p-0.5 shadow-sm" onClick={e => e.stopPropagation()}>
            <button onClick={(e) => quickAdjustStock(e, item, -1)} className="w-8 h-8 sm:w-9 sm:h-9 flex items-center justify-center text-zinc-400 hover:bg-zinc-100 dark:hover:bg-[#1a2235] hover:text-zinc-900 dark:hover:text-white rounded-md transition-all active:scale-95"><SafeIcon name="minus" size={14} /></button>
            <div className="w-10 sm:w-12 text-center"><span className={`text-[14px] sm:text-[15px] font-black font-mono leading-none ${inStock ? 'text-zinc-900 dark:text-white' : 'text-red-500'}`}>{qty}</span></div>
            <button onClick={(e) => quickAdjustStock(e, item, 1)} className="w-8 h-8 sm:w-9 sm:h-9 flex items-center justify-center text-zinc-400 hover:bg-zinc-100 dark:hover:bg-[#1a2235] hover:text-zinc-900 dark:hover:text-white rounded-md transition-all active:scale-95"><SafeIcon name="plus" size={14} /></button>
        </div>
    );

    const renderPrice = (item) => (
        <div className="flex flex-col justify-center items-end">
            <div className="text-[15px] sm:text-[16px] font-bold font-mono text-zinc-900 dark:text-white leading-none">{(parseInt(item.price)||0).toLocaleString()}</div>
            <div className="text-[9px] font-bold text-zinc-400 uppercase mt-0.5 tracking-widest">SEK</div>
        </div>
    );

    const renderActions = (item) => (
        <div className="flex items-center gap-1.5 shrink-0">
            <button onClick={(e) => { e.stopPropagation(); setLinkingItem(item); }} title="Koppla artikel till uppdrag" className="w-9 h-9 sm:w-10 sm:h-10 rounded-lg bg-orange-50 dark:bg-orange-500/10 text-orange-600 dark:text-orange-400 hover:bg-orange-500 hover:text-white dark:hover:bg-orange-500 dark:hover:text-white flex items-center justify-center transition-all shadow-sm active:scale-95 border border-orange-200/50 dark:border-orange-500/20">
                <SafeIcon name="link" size={14} />
            </button>
            <a href={generateTrodoLink(item.service_filter || item.name)} target="_blank" rel="noopener noreferrer" onClick={e => e.stopPropagation()} className="w-9 h-9 sm:w-10 sm:h-10 rounded-lg bg-zinc-100 dark:bg-[#0f1522] text-zinc-400 hover:bg-[#0066cc] hover:text-white hover:border-transparent flex items-center justify-center transition-all shadow-sm active:scale-95 border border-zinc-200/50 dark:border-white/5"><SafeIcon name="external-link" size={14} /></a>
            <button onClick={(e) => { e.stopPropagation(); setEditingItem(item); }} className="w-9 h-9 sm:w-10 sm:h-10 rounded-lg bg-zinc-100 dark:bg-[#0f1522] text-zinc-400 hover:bg-zinc-800 hover:text-white dark:hover:bg-white dark:hover:text-zinc-900 flex items-center justify-center transition-all shadow-sm active:scale-95 border border-zinc-200/50 dark:border-white/5"><SafeIcon name="edit-2" size={14} /></button>
        </div>
    );

    return (
        <>
            {/* ÄNDRAT: pb-32 är ändrat till pb-6 för att ta bort det stora tomrummet i botten */}
            <div className="relative max-w-[1400px] w-[calc(100%+2rem)] -ml-4 sm:w-full sm:ml-0 animate-in fade-in slide-in-from-left-4 duration-700 pb-6">
                <div className="absolute top-0 left-[-10%] w-[60%] h-[400px] bg-orange-500/10 dark:bg-orange-500/5 blur-[120px] rounded-full pointer-events-none -z-10 hidden lg:block"></div>

                {/* --- HEADER (Exakt matchad med Dashboard/Kalender) --- */}
                <div className="flex flex-col md:flex-row md:items-center justify-between mb-4 pb-4 border-b border-zinc-200 dark:border-white/5 gap-4 pt-4 lg:pt-0 px-1.5 sm:px-4 lg:px-0">
                    <div className="flex items-center gap-3 md:gap-4">
                        <div className="relative group cursor-default shrink-0">
                            <div className="absolute inset-0 bg-orange-500/40 blur-lg rounded-full transition-all duration-700 group-hover:bg-orange-500/60" />
                            <div className="relative w-10 h-10 md:w-12 md:h-12 rounded-xl flex items-center justify-center text-white shadow-md border border-white/20 transition-colors bg-gradient-to-br from-orange-400 to-orange-600">
                                <SafeIcon name="search" size={20} className="md:w-6 md:h-6" />
                            </div>
                        </div>
                        <div className="flex flex-col">
                            <h1 className="text-xl md:text-2xl font-black text-zinc-900 dark:text-white uppercase tracking-tight leading-none">
                                ARTIKEL<span className="text-zinc-400 dark:text-zinc-500 font-light">SÖK</span>
                            </h1>
                            <p className="text-[9px] md:text-[10px] font-bold text-orange-500 dark:text-orange-400 uppercase tracking-widest mt-1 flex items-center gap-1.5">
                                <span className="w-1.5 h-1.5 rounded-full bg-orange-500 animate-pulse"></span>
                                Identifiering & Saldo
                            </p>
                        </div>
                    </div>
                </div>

                {/* --- MAIN CONTENT WRAPPER --- */}
                <div className="px-1.5 sm:px-4 lg:px-0 space-y-3 sm:space-y-4">
                    
                    {/* --- CONTROL BAR --- */}
                    <div className="bg-white/90 dark:bg-[#182032]/90 border border-zinc-200/80 dark:border-white/5 rounded-xl sm:rounded-2xl p-1.5 sm:p-3 shadow-sm flex flex-col lg:flex-row gap-2 sm:gap-3 lg:items-center justify-between mb-3 lg:mb-6">
                        <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 flex-1">
                            
                            {/* NYTT: SÖK + SKANNERKNAPP SEPARERAD */}
                            <div className="flex gap-2 flex-1 lg:max-w-md">
                                <div className="relative group flex-1">
                                    <input 
                                        type="text" placeholder="Sök artikel, OEN..." 
                                        className="bg-zinc-50 dark:bg-[#0f1522] border border-zinc-200/80 dark:border-white/10 focus:border-orange-500 p-2.5 sm:p-3 pl-9 sm:pl-11 pr-8 text-[12px] sm:text-[13px] font-medium text-zinc-900 dark:text-white outline-none w-full transition-all rounded-lg sm:rounded-xl focus:ring-2 focus:ring-orange-500/10 shadow-inner"
                                        value={search} onChange={(e) => setSearch(e.target.value)}
                                    />
                                    <SafeIcon name="search" size={14} className="absolute left-3 sm:left-4 top-1/2 -translate-y-1/2 text-zinc-400 group-focus-within:text-orange-500 transition-colors" />
                                    
                                    {search && (
                                        <button 
                                            onClick={() => setSearch('')} 
                                            className="absolute right-2 sm:right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-red-500 transition-colors bg-white dark:bg-[#1a2235] p-1.5 rounded-md shadow-sm border border-zinc-200/80 dark:border-white/5 active:scale-95" 
                                            title="Rensa sökning"
                                        >
                                            <SafeIcon name="x" size={12} />
                                        </button>
                                    )}
                                </div>
                                <button 
                                    onClick={() => setIsScannerOpen(true)}
                                    className="w-[42px] sm:w-[46px] shrink-0 bg-orange-50 dark:bg-orange-500/10 text-orange-600 dark:text-orange-400 hover:bg-orange-500 hover:text-white dark:hover:bg-orange-500 dark:hover:text-white border border-orange-200/50 dark:border-orange-500/20 rounded-lg sm:rounded-xl flex items-center justify-center shadow-sm transition-all active:scale-95"
                                    title="Skanna artikel"
                                >
                                    <SafeIcon name="scan" size={18} />
                                </button>
                            </div>

                            <select 
                                value={activeCat} onChange={(e) => setActiveCat(e.target.value)}
                                className="bg-zinc-50 dark:bg-[#0f1522] border border-zinc-200/80 dark:border-white/10 py-2.5 sm:py-3 px-2 sm:px-3 rounded-lg sm:rounded-xl text-[10px] sm:text-[11px] font-bold uppercase tracking-widest outline-none text-zinc-700 dark:text-zinc-300 shadow-inner lg:w-48"
                            >
                                <option value="Alla">Alla Kategorier</option>
                                {mainCats.map(c => <option key={c} value={c}>{c}</option>)}
                                <optgroup label="Snabblänkar">
                                    {subFilters.map(c => <option key={c} value={c}>{c}</option>)}
                                </optgroup>
                            </select>

                            <div className="flex bg-zinc-50 dark:bg-[#0f1522] border border-zinc-200/80 dark:border-white/10 rounded-lg sm:rounded-xl p-1 shadow-inner h-[38px] sm:h-[46px] lg:h-auto">
                                {[
                                    { id: 'all', label: 'Alla' },
                                    { id: 'inStock', label: 'I lager' },
                                    { id: 'outOfStock', label: 'Slut' }
                                ].map(f => (
                                    <button 
                                        key={f.id} onClick={() => setStockFilter(f.id)} 
                                        className={`px-2 sm:px-4 text-[9px] sm:text-[10px] font-bold uppercase tracking-widest transition-all rounded-[6px] sm:rounded-lg flex-1 lg:flex-none ${stockFilter === f.id ? 'bg-white dark:bg-[#1a2235] text-zinc-900 dark:text-white shadow-sm' : 'text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300'}`}
                                    >
                                        {f.label}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <button onClick={() => setEditingItem({})} className="bg-gradient-to-r from-orange-500 to-orange-600 text-white font-bold text-[10px] sm:text-[11px] uppercase tracking-widest shadow-[0_4px_14px_0_rgba(249,115,22,0.39)] hover:shadow-[0_6px_20px_rgba(249,115,22,0.23)] border border-orange-400/50 active:scale-95 transition-all rounded-lg sm:rounded-xl h-[38px] sm:h-[46px] lg:h-[42px] px-4 sm:px-6 flex items-center justify-center gap-1.5 shrink-0">
                            <SafeIcon name="plus" size={14} /> Ny Artikel
                        </button>
                    </div>

                    {/* --- ENTERPRISE GRID (Huvudlista) --- */}
                    <div className="flex flex-col gap-2 sm:gap-3 lg:gap-0 lg:bg-white/90 lg:dark:bg-[#182032]/90 lg:border lg:border-zinc-200/80 lg:dark:border-white/5 lg:rounded-2xl lg:shadow-sm overflow-hidden">
                        
                        <div className="hidden lg:grid grid-cols-[minmax(0,1fr)_260px_130px_100px_130px] gap-4 px-6 py-3.5 bg-zinc-100/50 dark:bg-[#121826]/80 border-b border-zinc-200/80 dark:border-white/5 text-[10px] font-bold uppercase tracking-widest text-zinc-500 dark:text-zinc-400 items-center">
                            <div className="pl-2">Artikel & Info</div>
                            <div>Specifikation</div>
                            <div className="text-center">Lagersaldo</div>
                            <div className="text-right pr-4">Á-Pris</div>
                            <div className="text-right pr-1">Åtgärd</div>
                        </div>

                        {filteredItems.length === 0 ? (
                            <div className="p-16 text-center bg-white dark:bg-[#182032] rounded-xl sm:rounded-2xl lg:rounded-none shadow-sm lg:shadow-none">
                                <SafeIcon name="search" size={48} className="text-zinc-300 dark:text-zinc-600 mb-4 mx-auto opacity-50" />
                                <h3 className="text-[12px] font-bold uppercase tracking-widest text-zinc-500">Inga artiklar hittades</h3>
                            </div>
                        ) : (
                            filteredItems.map((item) => {
                                const qty = parseInt(item.quantity) || 0;
                                const inStock = qty > 0;
                                const lowStock = qty > 0 && qty <= 2;
                                
                                let statusColor = "bg-emerald-500";
                                if (!inStock) statusColor = "bg-red-500 animate-pulse";
                                else if (lowStock) statusColor = "bg-yellow-500";

                                return (
                                    <div 
                                        key={item.id} 
                                        onClick={() => setEditingItem(item)}
                                        className="group bg-white dark:bg-[#182032] lg:bg-transparent border border-zinc-200/80 lg:border-x-0 lg:border-t-0 lg:border-b dark:border-white/5 rounded-xl sm:rounded-2xl lg:rounded-none shadow-sm lg:shadow-none hover:bg-zinc-50 dark:hover:bg-[#1f2940]/40 transition-all cursor-pointer relative"
                                    >
                                        
                                        {/* --- DESKTOP VIEW --- */}
                                        <div className="hidden lg:grid grid-cols-[minmax(0,1fr)_260px_130px_100px_130px] gap-4 px-6 py-3.5 items-center">
                                            <div className="flex items-center gap-4 min-w-0 pr-4">
                                                <div className="relative shrink-0">
                                                    <div className={`absolute -top-1 -right-1 w-3.5 h-3.5 rounded-full border-[2.5px] border-white dark:border-[#182032] ${statusColor} z-10`}></div>
                                                    <div className="w-12 h-12 flex items-center justify-center rounded-xl bg-white dark:bg-[#121826] border border-zinc-200/80 dark:border-white/10 shadow-sm transition-colors group-hover:border-orange-500/30">
                                                        <LagerIcon category={item.category} name={item.name} size={24} className={inStock ? "text-zinc-700 dark:text-zinc-200" : "text-zinc-400 opacity-50"} />
                                                    </div>
                                                </div>
                                                <div className="flex flex-col min-w-0">
                                                    <h3 className="text-[13px] font-black text-zinc-900 dark:text-white leading-tight truncate group-hover:text-orange-500 transition-colors">
                                                        {item.name}
                                                    </h3>
                                                    <div className="mt-1 flex items-center gap-2">
                                                        <div 
                                                            onClick={(e) => handleCopyId(e, item.service_filter, item.id)}
                                                            className={`text-[11px] font-mono font-bold tracking-widest flex items-center gap-1.5 w-max px-2 py-0.5 rounded border transition-all shadow-sm ${copiedId === item.id ? 'bg-emerald-50 text-emerald-600 border-emerald-200' : 'bg-white dark:bg-[#121826] text-zinc-600 dark:text-zinc-300 border-zinc-200 dark:border-white/10 hover:border-orange-300 hover:text-orange-500'}`}
                                                        >
                                                            <SafeIcon name={copiedId === item.id ? "check" : "hash"} size={10} />
                                                            {item.service_filter || 'SAKNAS'}
                                                        </div>
                                                        <span className="text-[9px] font-bold uppercase tracking-widest text-zinc-400 bg-zinc-100 dark:bg-[#0f1522] px-1.5 py-0.5 rounded border border-zinc-200/50 dark:border-white/5">
                                                            {item.category}
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="text-[12px] text-zinc-500 dark:text-zinc-400 font-medium truncate" title={item.notes}>
                                                {item.notes || '-'}
                                            </div>

                                            <div className="flex items-center justify-center">
                                                {renderStepper(item, qty, inStock)}
                                            </div>

                                            <div className="flex items-center justify-end pr-4">
                                                {renderPrice(item)}
                                            </div>

                                            <div className="flex items-center justify-end">
                                                {renderActions(item)}
                                            </div>
                                        </div>

                                        {/* --- MOBILE VIEW --- */}
                                        <div className="lg:hidden flex flex-col p-3 sm:p-4 gap-2.5">
                                            <div className="flex items-start gap-3 sm:gap-4 min-w-0">
                                                <div className="relative shrink-0">
                                                    <div className={`absolute -top-1 -right-1 w-3 h-3 rounded-full border-[2px] border-white dark:border-[#182032] ${statusColor} z-10`}></div>
                                                    <div className="w-12 h-12 sm:w-14 sm:h-14 flex items-center justify-center rounded-xl bg-zinc-50 dark:bg-[#121826] border border-zinc-200/80 dark:border-white/10 shadow-sm">
                                                        <LagerIcon category={item.category} name={item.name} size={26} className={inStock ? "text-zinc-700 dark:text-zinc-200" : "text-zinc-400 opacity-50"} />
                                                    </div>
                                                </div>
                                                <div className="flex flex-col min-w-0 flex-1 pt-0.5">
                                                    <h3 className="text-[14px] sm:text-[15px] font-black text-zinc-900 dark:text-white leading-tight truncate">
                                                        {item.name}
                                                    </h3>
                                                    <div className="mt-1.5 flex flex-wrap items-center gap-2">
                                                        <div 
                                                            onClick={(e) => handleCopyId(e, item.service_filter, item.id)}
                                                            className={`text-[11px] sm:text-[12px] font-mono font-bold tracking-wider flex items-center gap-1.5 w-max px-2 py-0.5 rounded border transition-colors shadow-sm ${copiedId === item.id ? 'bg-emerald-50 text-emerald-600 border-emerald-200' : 'bg-orange-50 text-orange-600 border-orange-200 hover:bg-orange-100'}`}
                                                        >
                                                            <SafeIcon name={copiedId === item.id ? "check" : "hash"} size={10} />
                                                            {item.service_filter || 'SAKNAS'}
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>

                                            {item.notes && (
                                                <div className="text-[11px] sm:text-[12px] text-zinc-500 dark:text-zinc-400 bg-zinc-50 dark:bg-[#0f1522] p-2 sm:p-2.5 rounded-lg border border-zinc-100 dark:border-white/5 line-clamp-2">
                                                    {item.notes}
                                                </div>
                                            )}

                                            <div className="flex items-center justify-between pt-2 border-t border-zinc-100 dark:border-white/5 w-full mt-0.5">
                                                <div className="flex items-center gap-2 sm:gap-3">
                                                    {renderStepper(item, qty, inStock)}
                                                </div>
                                                <div className="flex items-center gap-3 sm:gap-4 shrink-0">
                                                    {renderPrice(item)}
                                                    {renderActions(item)}
                                                </div>
                                            </div>
                                        </div>

                                    </div>
                                );
                            })
                        )}
                    </div>

                </div>
            </div>
            
            {/* NYTT: Laddar Skannermodalen om den är aktiv */}
            {isScannerOpen && (
                <LagerScannerModal 
                    items={items}
                    onOpenItem={(item) => { setScannedDefaultCode(''); setEditingItem(item); }}
                    onAddNewWithCode={(code) => { setScannedDefaultCode(code); setEditingItem({}); }}
                    onClose={() => setIsScannerOpen(false)}
                />
            )}

            {editingItem && <LagerItemModal item={editingItem} defaultCode={scannedDefaultCode} onClose={() => { setEditingItem(null); setScannedDefaultCode(''); }} />}
            {linkingItem && <LagerLinkJobModal item={linkingItem} allJobs={allJobs} onClose={() => setLinkingItem(null)} />}
        </>
    );
};
