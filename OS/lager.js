// lager.js

// --- Huvudikoner från systemet (Stabilt renderade med keys) ---
const SafeIcon = ({ name, size = 16, className = "" }) => {
    if (!window.Icon) return null;
    return (
        <span className={`inline-flex items-center justify-center shrink-0 ${className}`}>
            {/* Nyckeln (key) tvingar React att hålla isär ikonerna vid snabba om-renderingar */}
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
const generateThansenLink = (f) => f ? `https://www.thansen.se/search/?query=${encodeURIComponent(f.replace(/[\s-]/g, ''))}` : '#';

// --- STABIL MODAL (Redigering & Ny Artikel) ---
const LagerItemModal = ({ item, onClose }) => {
    const [formData, setFormData] = React.useState({
        name: item?.name || '',
        price: item?.price || '',
        category: item?.category || 'Service',
        quantity: item?.quantity || '',
        service_filter: item?.service_filter || '',
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
                await window.db.collection("lager").doc(item.id).update(dataToSave);
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
                await window.db.collection("lager").doc(item.id).delete();
                onClose();
            } catch (err) {
                console.error("Fel vid radering:", err);
            }
        }
    };

    const InputClass = "w-full bg-zinc-50 dark:bg-[#0f1522] border border-zinc-200/80 dark:border-white/10 rounded-xl px-4 py-3 text-[13px] text-zinc-900 dark:text-white outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all placeholder:text-zinc-400 dark:placeholder:text-zinc-600 shadow-inner";
    const LabelClass = "block text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-1.5 ml-1";

    return (
        <div className="fixed inset-0 z-[9999] flex items-end sm:items-center justify-center p-0 sm:p-4">
            {/* Oskarp bakgrund - Ligger tryggt under själva formuläret */}
            <div className="absolute inset-0 bg-zinc-900/40 dark:bg-black/60 backdrop-blur-sm transition-opacity animate-in fade-in duration-300" onClick={onClose}></div>
            
            {/* Modalen */}
            <div className="relative w-full max-w-2xl bg-white dark:bg-[#182032] rounded-t-3xl sm:rounded-3xl shadow-2xl overflow-hidden border border-zinc-200 dark:border-white/10 animate-in slide-in-from-bottom sm:slide-in-from-bottom-0 sm:zoom-in-95 duration-200 flex flex-col max-h-[90vh]">
                
                {/* Swipe-indikator mobil */}
                <div className="w-full flex justify-center pt-3 pb-2 sm:hidden bg-zinc-50 dark:bg-[#1a2235]">
                    <div className="w-12 h-1.5 bg-zinc-200 dark:bg-white/10 rounded-full"></div>
                </div>

                <div className="px-6 py-5 flex justify-between items-center bg-zinc-50/80 dark:bg-[#1a2235]/50 border-b border-zinc-200/80 dark:border-white/5 relative overflow-hidden">
                    <div className="flex items-center gap-4 relative z-10">
                        <div className="w-12 h-12 rounded-xl bg-orange-100 dark:bg-orange-500/10 text-orange-500 flex items-center justify-center border border-orange-200/50 dark:border-orange-500/20 shadow-sm">
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
                        </div>
                    </div>

                    <div className="px-6 py-5 border-t border-zinc-100 dark:border-white/5 bg-zinc-50/50 dark:bg-[#1a2235]/50 flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-between gap-3">
                        {!isNew ? (
                            <button type="button" onClick={handleDelete} className="h-12 px-5 flex items-center justify-center text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 rounded-xl hover:bg-red-100 dark:hover:bg-red-500/20 transition-all active:scale-95 shadow-sm">
                                <SafeIcon name="trash-2" size={16} className="mr-2" />
                                <span className="text-[11px] font-bold uppercase tracking-widest">Radera</span>
                            </button>
                        ) : <div className="hidden sm:block"></div>}
                        
                        <div className="flex gap-3">
                            <button type="button" onClick={onClose} className="flex-1 sm:w-32 h-12 text-[11px] font-bold text-zinc-600 dark:text-zinc-300 bg-white dark:bg-[#121826] border border-zinc-200 dark:border-white/10 rounded-xl hover:bg-zinc-50 dark:hover:bg-white/5 transition-all uppercase tracking-widest active:scale-95 shadow-sm">
                                Avbryt
                            </button>
                            <button type="submit" className="flex-1 sm:w-40 h-12 text-[11px] font-bold text-white bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-400 hover:to-emerald-500 border border-emerald-400/50 rounded-xl shadow-[0_8px_20px_-6px_rgba(16,185,129,0.4)] transition-all active:scale-95 flex items-center justify-center gap-2 uppercase tracking-widest">
                                <SafeIcon name="check" size={16} /> Spara
                            </button>
                        </div>
                    </div>
                </form>
            </div>
        </div>
    );
};

// --- HUVUDVY FÖR LAGER ---
window.LagerView = ({ allJobs = [] }) => {
    const [items, setItems] = React.useState([]);
    const [search, setSearch] = React.useState("");
    const [activeCat, setActiveCat] = React.useState("Service"); // Rätt standardläge!
    const [stockFilter, setStockFilter] = React.useState("inStock"); // Rätt standardläge!
    const [editingItem, setEditingItem] = React.useState(null); 
    const [sortBy, setSortBy] = React.useState("name_asc");
    const [copiedId, setCopiedId] = React.useState(null);

    React.useEffect(() => {
        if (!window.db) return;
        const unsub = window.db.collection("lager").onSnapshot(s => {
            setItems(s.docs.map(d => ({ id: d.id, ...d.data() })));
        });
        return () => unsub();
    }, []);

    // Tvinga ikoner att laddas in när items ritas om (Löser buggen där ikoner försvinner)
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
            await window.db.collection("lager").doc(item.id).update({ quantity: newQty });
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

        // 1. Lagerstatus (Det nya filtret)
        if (stockFilter === 'inStock') res = res.filter(i => (parseInt(i.quantity)||0) > 0);
        if (stockFilter === 'outOfStock') res = res.filter(i => (parseInt(i.quantity)||0) <= 0);

        // 2. Kategori
        if (activeCat !== 'Alla') {
            if (keywords.includes(activeCat)) {
                res = res.filter(i => (i.name || "").toUpperCase().includes(activeCat));
            } else {
                res = res.filter(i => (i.category || "").toLowerCase() === activeCat.toLowerCase());
            }
        }

        // 3. Sökning
        if (search) {
            const term = search.toLowerCase().replace(/\s+/g, '');
            res = res.filter(i => 
                (i.name || "").toLowerCase().replace(/\s+/g, '').includes(term) ||
                (i.service_filter || "").toLowerCase().replace(/\s+/g, '').includes(term) ||
                (i.notes || "").toLowerCase().replace(/\s+/g, '').includes(term)
            );
        }

        // 4. Sortering
        res.sort((a,b) => {
            if(sortBy === "name_asc") return (a.name||"").localeCompare(b.name||"");
            if(sortBy === "price_asc") return (parseInt(a.price)||0) - (parseInt(b.price)||0);
            if(sortBy === "price_desc") return (parseInt(b.price)||0) - (parseInt(a.price)||0);
            if(sortBy === "stock_desc") return (parseInt(b.quantity)||0) - (parseInt(a.quantity)||0);
            return 0;
        });

        return res;
    }, [items, search, activeCat, stockFilter, sortBy]);

    const totalValue = items.reduce((sum, item) => sum + ((parseInt(item.price) || 0) * (parseInt(item.quantity) || 0)), 0);
    const outOfStock = items.filter(i => (parseInt(i.quantity) || 0) <= 0).length;
    const totalCount = items.length;

    const mainCats = ['Service', 'Motor/Chassi', 'Bromsar', 'Andra Märken'];

    // VIKTIGT: Modalen är nu UTANFÖR den animerade containern
    return (
        <>
            <div className="relative max-w-[1400px] w-full animate-in fade-in slide-in-from-left-4 duration-700 pb-0 ml-0">
                
                <div className="absolute top-0 left-[-10%] w-[60%] h-[400px] bg-orange-500/10 dark:bg-orange-500/5 blur-[120px] rounded-full pointer-events-none -z-10 hidden lg:block"></div>

                {/* --- HEADER --- */}
                <div className="flex flex-col lg:flex-row lg:items-end justify-between mb-8 gap-6 px-4 pt-5 lg:px-0 lg:pt-0">
                    <div className="flex items-center gap-4 md:gap-5">
                        <div className="relative group cursor-default shrink-0">
                            <div className="absolute inset-0 bg-orange-500/40 blur-xl rounded-full transition-all duration-700 group-hover:bg-orange-500/60" />
                            <div className="relative w-14 h-14 md:w-16 md:h-16 rounded-2xl md:rounded-3xl flex items-center justify-center text-white shadow-xl border border-white/20 transition-colors bg-gradient-to-br from-orange-400 to-orange-600">
                                <SafeIcon name="layers" size={28} />
                            </div>
                        </div>
                        <div className="flex flex-col">
                            <h1 className="text-3xl md:text-4xl font-black text-zinc-900 dark:text-white uppercase tracking-tight leading-none drop-shadow-sm dark:drop-shadow-none">
                                LOKALT<span className="text-zinc-400 dark:text-zinc-500 font-light">LAGER</span>
                            </h1>
                            <p className="text-[10px] md:text-[11px] font-bold text-orange-500 dark:text-orange-400 uppercase tracking-widest mt-2 flex items-center gap-2">
                                <span className="w-2 h-2 rounded-full bg-orange-500 animate-pulse"></span>
                                Produktdatabas // Komponenter
                            </p>
                        </div>
                    </div>

                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 z-10 w-full lg:w-auto">
                        <div className="relative group flex-1 lg:w-80">
                            <input 
                                type="text" 
                                placeholder="SÖK I LAGRET..." 
                                className="bg-white/80 dark:bg-[#182032]/80 backdrop-blur-xl border border-zinc-200/80 dark:border-white/10 focus:border-orange-500 p-4 pl-12 pr-10 text-[12px] font-bold text-zinc-900 dark:text-white outline-none w-full transition-all uppercase tracking-widest placeholder:text-zinc-400 rounded-2xl shadow-sm focus:ring-4 focus:ring-orange-500/10"
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                            />
                            <SafeIcon name="search" size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400 group-focus-within:text-orange-500 transition-colors" />
                            {search && (
                                <button onClick={() => setSearch('')} className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-red-500 transition-colors bg-zinc-100 dark:bg-white/5 p-1 rounded-md">
                                    <SafeIcon name="x" size={12} />
                                </button>
                            )}
                            {!search && (
                                <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none hidden sm:block">
                                    <kbd className="px-1.5 py-0.5 text-[9px] font-sans font-bold text-zinc-400 bg-zinc-100 dark:bg-white/5 border border-zinc-200 dark:border-white/10 rounded text-center">⌘K</kbd>
                                </div>
                            )}
                        </div>
                        <button onClick={() => setEditingItem({})} className="bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-400 hover:to-orange-500 text-white font-bold text-[13px] uppercase tracking-widest shadow-[0_8px_20px_-6px_rgba(249,115,22,0.4)] hover:shadow-[0_8px_25px_-4px_rgba(249,115,22,0.5)] border border-orange-400/50 active:scale-95 transition-all rounded-2xl h-[48px] px-8 flex items-center justify-center gap-2 shrink-0">
                            <SafeIcon name="plus" size={16} /> Ny Artikel
                        </button>
                    </div>
                </div>

                <div className="px-3 sm:px-4 lg:px-0 space-y-6">
                    
                    {/* --- KPI CARDS --- */}
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3 sm:gap-4">
                        <div className="bg-white/80 dark:bg-[#182032]/80 backdrop-blur-xl border border-zinc-200/80 dark:border-white/5 rounded-2xl sm:rounded-3xl p-4 sm:p-6 shadow-sm relative overflow-hidden group col-span-2 md:col-span-1">
                            <div className="absolute right-0 top-0 w-24 h-24 bg-emerald-500/5 blur-2xl rounded-full pointer-events-none transition-colors group-hover:bg-emerald-500/10"></div>
                            <div className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-2 flex items-center gap-1.5">
                                <SafeIcon name="dollar-sign" size={12} className="text-emerald-500" /> Totalt Lagervärde
                            </div>
                            <div className="flex items-baseline gap-1.5">
                                <span className="text-3xl sm:text-4xl font-light tracking-tighter text-zinc-900 dark:text-white leading-none">
                                    {totalValue.toLocaleString('sv-SE')}
                                </span>
                                <span className="text-[10px] font-bold text-zinc-400 uppercase">kr</span>
                            </div>
                        </div>
                        
                        <div className="bg-white/80 dark:bg-[#182032]/80 backdrop-blur-xl border border-zinc-200/80 dark:border-white/5 rounded-2xl sm:rounded-3xl p-4 sm:p-6 shadow-sm relative overflow-hidden group">
                            <div className="absolute right-0 top-0 w-24 h-24 bg-blue-500/5 blur-2xl rounded-full pointer-events-none transition-colors group-hover:bg-blue-500/10"></div>
                            <div className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-2 flex items-center gap-1.5">
                                <SafeIcon name="package" size={12} className="text-blue-500" /> Unika Artiklar
                            </div>
                            <div className="flex items-baseline gap-1.5">
                                <span className="text-3xl sm:text-4xl font-light tracking-tighter text-zinc-900 dark:text-white leading-none">
                                    {totalCount}
                                </span>
                                <span className="text-[10px] font-bold text-zinc-400 uppercase">st</span>
                            </div>
                        </div>

                        <div className="bg-white/80 dark:bg-[#182032]/80 backdrop-blur-xl border border-zinc-200/80 dark:border-white/5 rounded-2xl sm:rounded-3xl p-4 sm:p-6 shadow-sm relative overflow-hidden group">
                            <div className={`absolute right-0 top-0 w-24 h-24 blur-2xl rounded-full pointer-events-none transition-colors ${outOfStock > 0 ? 'bg-red-500/10 group-hover:bg-red-500/20' : 'bg-zinc-500/5 group-hover:bg-zinc-500/10'}`}></div>
                            <div className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-2 flex items-center gap-1.5">
                                <SafeIcon name="alert-circle" size={12} className={outOfStock > 0 ? "text-red-500" : "text-zinc-500"} /> Slutsålda
                            </div>
                            <div className="flex items-baseline gap-1.5">
                                <span className={`text-3xl sm:text-4xl font-light tracking-tighter leading-none ${outOfStock > 0 ? 'text-red-500 font-bold animate-pulse' : 'text-zinc-900 dark:text-white'}`}>
                                    {outOfStock}
                                </span>
                                <span className="text-[10px] font-bold text-zinc-400 uppercase">st</span>
                            </div>
                        </div>
                    </div>

                    {/* --- FILTRERING OCH SORTERING (Kompakt layout för mobilen) --- */}
                    <div className="flex flex-col gap-2.5 sm:gap-3 py-1">
                        
                        {/* Rad 1 på mobil: Dropdowns */}
                        <div className="flex gap-2 sm:gap-3">
                            <select 
                                value={activeCat} onChange={(e) => setActiveCat(e.target.value)}
                                className="flex-1 lg:hidden bg-white dark:bg-[#121826] border border-zinc-200 dark:border-[#1a2235] py-2.5 px-3 rounded-xl text-[11px] sm:text-[12px] font-bold uppercase tracking-widest outline-none text-zinc-700 dark:text-zinc-300 shadow-sm"
                            >
                                <option value="Alla">Alla Kategorier</option>
                                {mainCats.map(c => <option key={c} value={c}>{c}</option>)}
                                {subFilters.map(c => <option key={c} value={c}>{c}</option>)}
                            </select>

                            <select 
                                value={sortBy} onChange={(e) => setSortBy(e.target.value)}
                                className="flex-1 lg:w-48 lg:flex-none bg-white dark:bg-[#121826] border border-zinc-200 dark:border-[#1a2235] py-2.5 px-3 rounded-xl text-[11px] sm:text-[12px] font-bold uppercase tracking-widest outline-none text-zinc-700 dark:text-zinc-300 shadow-sm"
                            >
                                <option value="name_asc">Sortera: A-Ö</option>
                                <option value="price_asc">Lägst pris</option>
                                <option value="price_desc">Högst pris</option>
                                <option value="stock_desc">Mest i lager</option>
                            </select>
                        </div>

                        {/* Desktop: Horizontell kategori */}
                        <div className="hidden lg:flex overflow-x-auto custom-scrollbar gap-2 pb-2 -mb-2">
                            {['Alla', ...mainCats, ...subFilters].map(cat => {
                                const isActive = activeCat === cat;
                                return (
                                    <button 
                                        key={cat} onClick={() => setActiveCat(cat)} 
                                        className={`px-4 py-2.5 rounded-xl text-[11px] font-bold uppercase tracking-widest whitespace-nowrap transition-all border ${isActive ? 'bg-white dark:bg-[#25324d] text-zinc-900 dark:text-white border-zinc-200 dark:border-white/10 shadow-sm' : 'bg-transparent text-zinc-500 border-transparent hover:bg-white/50 dark:hover:bg-white/5 hover:text-zinc-700 dark:hover:text-zinc-300'}`}
                                    >
                                        {cat}
                                    </button>
                                );
                            })}
                        </div>

                        {/* Rad 2 på mobil: Lagerstatus Toggle */}
                        <div className="flex bg-white dark:bg-[#121826] border border-zinc-200 dark:border-[#1a2235] rounded-xl p-1 shadow-sm w-full lg:w-auto">
                            {[
                                { id: 'all', label: 'Alla' },
                                { id: 'inStock', label: 'I lager' },
                                { id: 'outOfStock', label: 'Slutsålt' }
                            ].map(f => (
                                <button 
                                    key={f.id}
                                    onClick={() => setStockFilter(f.id)} 
                                    className={`flex-1 px-4 py-2.5 sm:py-2 rounded-lg text-[10px] sm:text-[11px] font-bold uppercase tracking-widest transition-all ${stockFilter === f.id ? 'bg-zinc-100 dark:bg-[#1a2235] text-zinc-900 dark:text-white shadow-sm' : 'text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-white/5'}`}
                                >
                                    {f.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* --- LISTAN --- */}
                    <div className="space-y-3 sm:space-y-4 pb-12">
                        {filteredItems.length === 0 ? (
                            <div className="p-16 text-center bg-white/80 dark:bg-[#182032]/80 backdrop-blur-xl border border-zinc-200/80 dark:border-white/5 rounded-3xl shadow-sm">
                                <SafeIcon name="search" size={40} className="text-zinc-300 dark:text-zinc-600 mb-4 mx-auto opacity-50" />
                                <h3 className="text-[11px] font-bold uppercase tracking-widest text-zinc-500">Inga artiklar hittades</h3>
                            </div>
                        ) : (
                            filteredItems.map(item => {
                                const qty = parseInt(item.quantity) || 0;
                                const inStock = qty > 0;
                                
                                return (
                                    <div key={item.id} className="group bg-white/80 dark:bg-[#182032]/80 backdrop-blur-xl border border-zinc-200/80 dark:border-white/5 rounded-2xl lg:rounded-3xl p-3.5 sm:p-5 flex flex-col lg:flex-row lg:items-center relative gap-4 sm:gap-6 shadow-sm hover:shadow-md hover:border-orange-500/30 transition-all overflow-hidden cursor-pointer" onClick={() => setEditingItem(item)}>
                                        
                                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-transparent to-zinc-50/50 dark:to-white/[0.02] opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"></div>

                                        {/* Ikon Box */}
                                        <div className="flex items-center gap-4 lg:w-1/4">
                                            <div className={`w-14 h-14 sm:w-16 sm:h-16 flex items-center justify-center rounded-2xl shrink-0 border transition-colors relative ${inStock ? 'bg-zinc-50 dark:bg-[#121826] border-zinc-200 dark:border-white/10' : 'bg-red-50 dark:bg-red-500/10 border-red-200 dark:border-red-500/20'}`}>
                                                {!inStock && (
                                                    <div className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-red-500 rounded-full border-2 border-white dark:border-[#182032] flex items-center justify-center animate-pulse"></div>
                                                )}
                                                <LagerIcon category={item.category} name={item.name} size={32} className={inStock ? "" : "text-red-500 opacity-80"} />
                                            </div>
                                            <div className="flex flex-col min-w-0">
                                                <h3 className="text-[14px] sm:text-[15px] font-black text-zinc-900 dark:text-white leading-tight truncate group-hover:text-orange-500 transition-colors">
                                                    {item.name}
                                                </h3>
                                                <div className="flex items-center gap-2 mt-1.5">
                                                    <button 
                                                        onClick={(e) => handleCopyId(e, item.service_filter, item.id)}
                                                        className={`text-[9px] font-mono px-2 py-0.5 rounded-md border transition-all flex items-center gap-1.5 ${copiedId === item.id ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-500/20' : 'bg-zinc-100 dark:bg-black/30 text-zinc-500 dark:text-zinc-400 border-zinc-200/50 dark:border-white/5 hover:text-orange-500'}`}
                                                    >
                                                        <SafeIcon name={copiedId === item.id ? "check" : "hash"} size={10} />
                                                        {item.service_filter || 'SAKNAS'}
                                                    </button>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Egenskaper */}
                                        <div className="lg:w-1/3 flex flex-col justify-center">
                                            <div className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 mb-1 flex items-center gap-1.5">
                                                <SafeIcon name="tag" size={10} /> {item.category}
                                            </div>
                                            {item.notes ? (
                                                <div className="text-[12px] text-zinc-500 dark:text-zinc-400 font-medium truncate" title={item.notes}>
                                                    {item.notes}
                                                </div>
                                            ) : (
                                                <div className="text-[12px] text-zinc-400 italic opacity-50">Ingen beskrivning</div>
                                            )}
                                        </div>

                                        {/* Lager & Pris Container */}
                                        <div className="flex items-center justify-between lg:justify-end flex-1 gap-4 lg:gap-8 pt-3 border-t border-zinc-100 dark:border-white/5 lg:border-t-0 lg:pt-0">
                                            
                                            {/* Stepper för antal */}
                                            <div className="flex items-center bg-zinc-100/80 dark:bg-[#0f1522] border border-zinc-200/80 dark:border-white/5 rounded-xl p-1 shadow-inner h-[42px]" onClick={e => e.stopPropagation()}>
                                                <button onClick={(e) => quickAdjustStock(e, item, -1)} className="w-10 h-full flex items-center justify-center text-zinc-500 hover:bg-white dark:hover:bg-[#1a2235] hover:text-zinc-900 dark:hover:text-white rounded-lg transition-all shadow-sm active:scale-95">
                                                    <SafeIcon name="minus" size={14} />
                                                </button>
                                                <div className="w-10 sm:w-12 h-full flex flex-col items-center justify-center">
                                                    <span className={`text-[15px] font-black font-mono leading-none ${inStock ? 'text-zinc-900 dark:text-white' : 'text-red-500'}`}>{qty}</span>
                                                </div>
                                                <button onClick={(e) => quickAdjustStock(e, item, 1)} className="w-10 h-full flex items-center justify-center text-zinc-500 hover:bg-white dark:hover:bg-[#1a2235] hover:text-zinc-900 dark:hover:text-white rounded-lg transition-all shadow-sm active:scale-95">
                                                    <SafeIcon name="plus" size={14} />
                                                </button>
                                            </div>

                                            {/* Pris */}
                                            <div className="text-right flex flex-col justify-center min-w-[70px] sm:min-w-[80px]">
                                                <div className="text-xl sm:text-2xl font-light tracking-tighter text-zinc-900 dark:text-white leading-none">
                                                    {(parseInt(item.price)||0).toLocaleString()}
                                                </div>
                                                <div className="text-[9px] font-bold text-zinc-400 uppercase mt-1 tracking-widest">SEK / ST</div>
                                            </div>
                                        </div>

                                        {/* Svävande Actions (Hover på Desktop) */}
                                        <div className="hidden lg:flex absolute right-4 opacity-0 group-hover:opacity-100 translate-x-4 group-hover:translate-x-0 transition-all duration-300 items-center gap-2 bg-gradient-to-l from-white via-white to-transparent dark:from-[#182032] dark:via-[#182032] pl-12 h-full top-0">
                                            <a href={generateTrodoLink(item.service_filter || item.name)} target="_blank" rel="noopener noreferrer" onClick={e => e.stopPropagation()} className="w-10 h-10 rounded-xl bg-white dark:bg-[#1a2235] border border-zinc-200 dark:border-white/10 flex items-center justify-center text-[#0066cc] dark:text-[#3399ff] hover:bg-[#0066cc] hover:text-white transition-all shadow-sm" title="Sök på Trodo">
                                                <SafeIcon name="external-link" size={16} />
                                            </a>
                                            <button onClick={(e) => { e.stopPropagation(); setEditingItem(item); }} className="w-10 h-10 rounded-xl bg-white dark:bg-[#1a2235] border border-zinc-200 dark:border-white/10 flex items-center justify-center text-zinc-600 dark:text-zinc-300 hover:bg-orange-500 hover:text-white hover:border-orange-500 transition-all shadow-sm" title="Redigera Artikel">
                                                <SafeIcon name="edit-2" size={16} />
                                            </button>
                                        </div>

                                        {/* Mobile Actions */}
                                        <div className="lg:hidden flex gap-2 w-full pt-3 border-t border-zinc-100 dark:border-white/5">
                                            <a href={generateTrodoLink(item.service_filter || item.name)} target="_blank" rel="noopener noreferrer" onClick={e => e.stopPropagation()} className="flex-1 py-2.5 rounded-lg bg-zinc-50 dark:bg-white/5 border border-zinc-200/50 dark:border-white/10 flex items-center justify-center text-[10px] font-bold text-[#0066cc] dark:text-[#3399ff] uppercase tracking-widest gap-2 active:scale-95 transition-all">
                                                <SafeIcon name="external-link" size={12} /> Trodo
                                            </a>
                                            <button onClick={(e) => { e.stopPropagation(); setEditingItem(item); }} className="flex-1 py-2.5 rounded-lg bg-zinc-50 dark:bg-white/5 border border-zinc-200/50 dark:border-white/10 flex items-center justify-center text-[10px] font-bold text-zinc-600 dark:text-zinc-300 uppercase tracking-widest gap-2 active:scale-95 transition-all">
                                                <SafeIcon name="edit-2" size={12} /> Redigera
                                            </button>
                                        </div>
                                    </div>
                                );
                            })
                        )}
                    </div>
                </div>
            </div>
            
            {/* Modal ligger nu helt separat från huvudcontainern! */}
            {editingItem && <LagerItemModal item={editingItem} onClose={() => setEditingItem(null)} />}
        </>
    );
};
