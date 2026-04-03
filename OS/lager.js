// lager.js

// --- Huvudikoner från systemet ---
const SafeIcon = ({ name, size = 16, className = "" }) => (
    <span className={`inline-flex items-center justify-center shrink-0 ${className}`}>
        <window.Icon name={name} size={size} />
    </span>
);

// --- Specialikoner för Lagret ---
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

// --- MODAL (Redigering) ---
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

    const InputClass = "w-full bg-white dark:bg-[#121826] border border-zinc-200 dark:border-[#1a2235] rounded-lg px-3 py-2.5 sm:py-3 text-sm text-zinc-900 dark:text-white outline-none focus:ring-2 focus:ring-orange-500/50 focus:border-orange-500 transition-all placeholder:text-zinc-400";
    const LabelClass = "block text-[10px] sm:text-[11px] font-bold text-zinc-500 uppercase tracking-wider mb-1 sm:mb-1.5";

    return (
        <div className="fixed inset-0 z-[500] flex items-end sm:items-center justify-center p-0 sm:p-4">
            <div className="absolute inset-0 bg-zinc-900/60 dark:bg-black/60 backdrop-blur-sm transition-opacity" onClick={onClose}></div>
            
            <div className="relative w-full max-w-2xl bg-zinc-50 dark:bg-[#09090b] rounded-t-2xl sm:rounded-2xl shadow-2xl overflow-hidden border-t sm:border border-zinc-200 dark:border-[#1a2235] animate-in slide-in-from-bottom sm:slide-in-from-bottom-0 sm:zoom-in-95 duration-200 flex flex-col max-h-[85vh] sm:max-h-[90vh]">
                
                <div className="w-full flex justify-center pt-3 pb-1 sm:hidden bg-zinc-50 dark:bg-[#09090b]">
                    <div className="w-12 h-1.5 bg-zinc-300 dark:bg-zinc-700 rounded-full"></div>
                </div>

                <div className="px-4 py-3.5 sm:px-6 sm:py-5 flex justify-between items-center bg-zinc-50 dark:bg-[#09090b] border-b border-zinc-200 dark:border-[#1a2235]">
                    <div>
                        <h2 className="text-lg sm:text-xl font-black text-zinc-900 dark:text-white uppercase tracking-tight leading-none">
                            {isNew ? 'LÄGG TILL ARTIKEL' : 'REDIGERA ARTIKEL'}
                        </h2>
                        <p className="text-[10px] sm:text-xs text-orange-500 font-bold tracking-widest uppercase mt-1">Produktdatabas</p>
                    </div>
                    <button type="button" onClick={onClose} className="p-1.5 sm:p-2 text-zinc-400 hover:text-zinc-600 dark:hover:text-white bg-white dark:bg-[#121826] border border-zinc-200 dark:border-[#1a2235] rounded-xl transition-colors shadow-sm">
                        <SafeIcon name="x" size={16} className="sm:w-[18px] sm:h-[18px]" />
                    </button>
                </div>

                <form onSubmit={handleSave} className="p-4 sm:p-6 overflow-y-auto">
                    <div className="grid grid-cols-2 gap-3 sm:gap-5">
                        <div className="col-span-2">
                            <label className={LabelClass}>Artikelnamn / Beskrivning</label>
                            <input autoFocus required type="text" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className={InputClass} placeholder="T.ex. Bromsbeläggssats..." />
                        </div>
                        <div className="col-span-2 sm:col-span-1">
                            <label className={LabelClass}>Art.Nummer / ID</label>
                            <input type="text" value={formData.service_filter} onChange={e => setFormData({...formData, service_filter: e.target.value.toUpperCase()})} className={`${InputClass} font-mono`} placeholder="BOS-1234" />
                        </div>
                        <div className="col-span-2 sm:col-span-1">
                            <label className={LabelClass}>Kategori</label>
                            <select value={formData.category} onChange={e => setFormData({...formData, category: e.target.value})} className={InputClass}>
                                <option value="Service">Service</option>
                                <option value="Motor/Chassi">Motor/Chassi</option>
                                <option value="Bromsar">Bromsar</option>
                                <option value="Andra Märken">Andra Märken</option>
                            </select>
                        </div>
                        <div>
                            <label className={LabelClass}>Pris (kr)</label>
                            <div className="relative">
                                <input type="number" required value={formData.price} onChange={e => setFormData({...formData, price: e.target.value})} className={`${InputClass} pr-10 font-mono font-bold sm:text-lg`} placeholder="0" />
                                <span className="absolute right-3 sm:right-4 top-1/2 -translate-y-1/2 text-zinc-400 text-[10px] sm:text-xs font-bold uppercase">SEK</span>
                            </div>
                        </div>
                        <div>
                            <label className={LabelClass}>Lagersaldo (st)</label>
                            <input type="number" required value={formData.quantity} onChange={e => setFormData({...formData, quantity: e.target.value})} className={`${InputClass} font-mono font-bold sm:text-lg`} placeholder="0" />
                        </div>
                        <div className="col-span-2">
                            <label className={LabelClass}>Egenskaper / Specifikation</label>
                            <textarea rows="2" value={formData.notes} onChange={e => setFormData({...formData, notes: e.target.value})} className={`${InputClass} resize-none`} placeholder="Placering: Bakaxel..." />
                        </div>
                    </div>

                    <div className="flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-between mt-4 sm:mt-5 pt-4 sm:pt-5 border-t border-zinc-200 dark:border-[#1a2235] gap-3 pb-1 sm:pb-0">
                        {!isNew ? (
                            <button type="button" onClick={handleDelete} className="h-12 sm:h-11 px-4 flex items-center justify-center text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 rounded-xl hover:bg-red-100 dark:hover:bg-red-500/20 transition-colors shadow-sm">
                                <SafeIcon name="trash-2" size={16} className="mr-2" />
                                <span className="text-xs font-bold uppercase tracking-widest">Radera Artikel</span>
                            </button>
                        ) : <div className="hidden sm:block"></div>}
                        
                        <div className="flex gap-3">
                            <button type="button" onClick={onClose} className="flex-1 sm:w-28 h-12 sm:h-11 text-xs font-bold text-zinc-600 dark:text-zinc-300 bg-white dark:bg-[#121826] border border-zinc-200 dark:border-[#1a2235] rounded-xl hover:bg-zinc-50 dark:hover:bg-[#182032] transition-colors uppercase tracking-widest shadow-sm">
                                Avbryt
                            </button>
                            <button type="submit" className="flex-1 sm:w-36 h-12 sm:h-11 text-xs font-bold text-white bg-[#0066cc] hover:bg-[#0052a3] rounded-xl shadow-md transition-colors flex items-center justify-center gap-2 uppercase tracking-widest">
                                <SafeIcon name="check" size={16} className="hidden sm:block" /> Spara
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
    const [activeCat, setActiveCat] = React.useState("Service"); 
    const [stockFilter, setStockFilter] = React.useState("inStock"); 
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
        return Object.keys(found).filter(kw => found[kw] >= 2);
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

    const getLastSold = (itemId) => {
        if (!allJobs.length) return null;
        const job = allJobs
            .filter(j => !j.deleted && Array.isArray(j.utgifter) && j.utgifter.some(e => String(e.inventoryId) === String(itemId)))
            .sort((a, b) => new Date(b.datum) - new Date(a.datum))[0];
        return job ? { date: job.datum?.split('T')[0] || 'Nyligen', customer: job.kundnamn } : null;
    };

    const mainCats = ['Service', 'Motor/Chassi', 'Bromsar', 'Andra Märken'];

    return (
        <div className="relative w-full min-h-screen font-sans"> 
            
            <div className="flex flex-col min-h-screen text-zinc-900 dark:text-white pb-6 transition-colors duration-500 relative max-w-[1400px] ml-0 w-full animate-in fade-in slide-in-from-left-4 duration-700">
                
                <div className="absolute top-0 left-[-10%] w-[60%] h-[400px] bg-orange-500/10 dark:bg-orange-500/5 blur-[120px] rounded-full pointer-events-none -z-10 hidden lg:block"></div>

                {/* Container med dynamisk padding för att matcha Dashboard exakt */}
                <div className="flex flex-col h-full lg:px-2">
                    
                    {/* --- HEADER --- (px-4 på mobil för att matcha dashboard-headern, px-0 på desktop) */}
                    <div className="flex flex-col md:flex-row md:items-center justify-between mb-4 pb-4 border-b border-zinc-200 dark:border-white/5 gap-4 pt-2 lg:pt-0 px-4 lg:px-0">
                        <div className="flex items-center gap-4 md:gap-5">
                            <div className="relative group cursor-default shrink-0">
                                <div className="absolute inset-0 bg-orange-500/40 blur-xl rounded-full transition-all duration-700 group-hover:bg-orange-500/60" />
                                <div className="relative w-14 h-14 rounded-2xl flex items-center justify-center text-white shadow-xl border border-white/20 transition-colors bg-gradient-to-br from-orange-400 to-orange-600">
                                    <window.Icon name="layers" size={24} />
                                </div>
                            </div>
                            <div className="flex flex-col">
                                <h1 className="text-3xl font-black text-zinc-900 dark:text-white uppercase tracking-tight leading-none drop-shadow-sm dark:drop-shadow-none">
                                    INVEN<span className="text-zinc-400 dark:text-zinc-500 font-light">TORY</span>
                                </h1>
                                <p className="text-[11px] font-bold text-orange-500 dark:text-orange-400 uppercase tracking-widest mt-1.5 flex items-center gap-2">
                                    <span className="w-1.5 h-1.5 rounded-full bg-orange-500 animate-pulse"></span>
                                    Produktdatabas
                                </p>
                            </div>
                        </div>

                        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4">
                            <div className="relative w-full sm:w-64 group">
                                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                    <window.Icon name="search" size={16} className="text-zinc-400 dark:text-zinc-500 group-focus-within:text-orange-500 transition-colors" />
                                </div>
                                <input 
                                    type="text"
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    placeholder="Sök i systemet..."
                                    className="w-full bg-white dark:bg-[#121826] border border-zinc-200 dark:border-[#1a2235] text-zinc-900 dark:text-white py-3.5 pl-11 pr-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500/50 focus:border-orange-500 transition-all shadow-sm text-[12px] font-bold tracking-widest uppercase placeholder:text-zinc-400 dark:placeholder:text-zinc-500"
                                />
                            </div>
                            <button onClick={() => setEditingItem({})} className="bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-400 hover:to-orange-500 text-white border border-orange-400/50 h-[46px] px-8 rounded-xl flex items-center justify-center gap-3 shadow-[0_8px_20px_-6px_rgba(249,115,22,0.4)] hover:shadow-[0_8px_25px_-4px_rgba(249,115,22,0.5)] transition-all active:scale-95 shrink-0">
                                <span className="text-[12px] font-black uppercase tracking-widest">Ny Artikel</span>
                                <window.Icon name="plus" size={16} />
                            </button>
                        </div>
                    </div>

                    {/* --- HUVUDINNEHÅLL --- (px-3 på mobil för att matcha exakt dashboardens list-padding) */}
                    <div className="flex flex-col lg:flex-row gap-4 lg:gap-6 mt-2 px-3 lg:px-0">
                        
                        {/* VÄNSTER MENY (Desktop) */}
                        <aside className="hidden lg:block w-64 shrink-0">
                            <div className="bg-white/80 dark:bg-[#182032]/80 backdrop-blur-xl border border-zinc-200/80 dark:border-white/5 rounded-2xl overflow-hidden shadow-sm">
                                <div className="p-4 bg-zinc-50/50 dark:bg-white/5 border-b border-zinc-200/50 dark:border-white/5 flex items-center gap-2 font-bold text-sm text-zinc-900 dark:text-white">
                                    <SafeIcon name="chevron-left" size={16} className="text-zinc-500" />
                                    <span>Kategorier</span>
                                </div>
                                <nav className="p-2 flex flex-col">
                                    {['Alla', ...mainCats].map(cat => (
                                        <button key={cat} onClick={() => setActiveCat(cat)} className={`text-left px-3 py-2.5 rounded-lg text-sm transition-colors ${activeCat === cat ? 'bg-zinc-100 dark:bg-white/10 font-bold text-zinc-900 dark:text-white' : 'text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-white/5 hover:text-zinc-900 dark:hover:text-white'}`}>
                                            {cat}
                                        </button>
                                    ))}
                                    {subFilters.length > 0 && (
                                        <div className="mt-4 pt-4 border-t border-zinc-200/50 dark:border-white/5">
                                            <span className="px-3 text-[10px] font-bold uppercase tracking-widest text-zinc-400 mb-2 block">Populära Filter</span>
                                            {subFilters.map(kw => (
                                                <button key={kw} onClick={() => setActiveCat(kw)} className={`w-full text-left px-3 py-2.5 rounded-lg text-sm transition-colors ${activeCat === kw ? 'bg-zinc-100 dark:bg-white/10 font-bold text-zinc-900 dark:text-white' : 'text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-white/5 hover:text-zinc-900 dark:hover:text-white'}`}>
                                                    {kw.charAt(0) + kw.slice(1).toLowerCase()}
                                                </button>
                                            ))}
                                        </div>
                                    )}
                                </nav>
                            </div>
                        </aside>

                        {/* PRODUKTLISTA */}
                        <main className="flex-1 min-w-0">
                            
                            <div className="flex flex-row items-center justify-between gap-2 sm:gap-3 mb-3 lg:mb-4">
                                <div className="flex lg:hidden flex-1">
                                    <select 
                                        value={activeCat} onChange={(e) => setActiveCat(e.target.value)}
                                        className="w-full bg-white dark:bg-[#121826] border border-zinc-200 dark:border-[#1a2235] py-2.5 px-2 sm:px-3 rounded-lg text-xs sm:text-sm font-medium outline-none text-zinc-700 dark:text-zinc-300 shadow-sm"
                                    >
                                        <option value="Alla">Alla Kategorier</option>
                                        {mainCats.map(c => <option key={c} value={c}>{c}</option>)}
                                        {subFilters.map(c => <option key={c} value={c}>{c}</option>)}
                                    </select>
                                </div>

                                <div className="flex flex-1 sm:flex-none justify-end">
                                    <select 
                                        value={sortBy} onChange={(e) => setSortBy(e.target.value)}
                                        className="w-full sm:w-auto bg-white dark:bg-[#121826] border border-zinc-200 dark:border-[#1a2235] py-2.5 px-2 sm:px-3 rounded-lg text-xs sm:text-sm font-medium outline-none text-zinc-700 dark:text-zinc-300 shadow-sm"
                                    >
                                        <option value="name_asc">A-Ö</option>
                                        <option value="price_asc">Lägst pris</option>
                                        <option value="price_desc">Högst pris</option>
                                        <option value="stock_desc">Mest i lager</option>
                                    </select>
                                </div>

                                <div className="hidden sm:flex items-center bg-white dark:bg-[#121826] border border-zinc-200 dark:border-[#1a2235] rounded-lg p-1 shadow-sm shrink-0">
                                    <button className="p-1.5 text-zinc-900 dark:text-white bg-zinc-100 dark:bg-[#1a2235] rounded shadow-sm"><SafeIcon name="list" size={16} /></button>
                                    <button className="p-1.5 text-zinc-400 hover:text-zinc-600"><SafeIcon name="grid" size={16} /></button>
                                </div>
                            </div>

                            <div className="space-y-3 sm:space-y-4">
                                {filteredItems.length === 0 ? (
                                    <div className="p-12 text-center bg-white/80 dark:bg-[#182032]/80 backdrop-blur-xl border border-zinc-200/80 dark:border-white/5 rounded-xl lg:rounded-3xl shadow-sm">
                                        <SafeIcon name="search" size={32} className="text-zinc-300 mb-4 mx-auto" />
                                        <h3 className="text-sm font-bold uppercase tracking-widest text-zinc-500">Inga artiklar hittades</h3>
                                    </div>
                                ) : (
                                    filteredItems.map(item => {
                                        const qty = parseInt(item.quantity) || 0;
                                        const inStock = qty > 0;
                                        const lastSold = !inStock ? getLastSold(item.id) : null;
                                        
                                        return (
                                            <div key={item.id} className="bg-white/80 dark:bg-[#182032]/80 backdrop-blur-xl border border-zinc-200/80 dark:border-white/5 rounded-xl lg:rounded-3xl p-3.5 sm:p-5 flex flex-col sm:flex-row relative gap-4 sm:gap-6 shadow-sm hover:shadow-md transition-shadow">
                                                
                                                <div className="absolute top-3 right-3 sm:relative sm:top-0 sm:right-0 w-16 h-16 sm:w-32 sm:h-auto flex flex-col items-center justify-center bg-zinc-50 dark:bg-[#0f1522] border border-zinc-100 dark:border-white/5 rounded-xl shrink-0 p-2">
                                                    <div className="hidden sm:flex self-start text-[#e3000f] font-black text-[10px] tracking-widest mb-2"><SafeIcon name="tool" size={12} className="mr-1"/> OEM</div>
                                                    <LagerIcon category={item.category} name={item.name} size={48} className="sm:size-16" />
                                                </div>

                                                <div className="flex-1 pr-16 sm:pr-0">
                                                    <h3 className="text-sm sm:text-base font-bold text-zinc-900 dark:text-white leading-tight mb-2 hover:text-[#0066cc] cursor-pointer" onClick={() => setEditingItem(item)}>
                                                        {item.name}
                                                    </h3>
                                                    
                                                    <div className="flex flex-wrap items-center gap-2 mb-3 sm:mb-4">
                                                        <span className="bg-zinc-100 dark:bg-white/5 text-zinc-600 dark:text-zinc-300 text-[9px] px-2 py-1 rounded font-bold uppercase tracking-widest border border-zinc-200/50 dark:border-white/10">
                                                            Art.nr
                                                        </span>
                                                        <button 
                                                            onClick={(e) => handleCopyId(e, item.service_filter, item.id)}
                                                            className={`text-[10px] font-mono px-2.5 py-1 rounded-lg border transition-all flex items-center gap-1.5 cursor-pointer ${copiedId === item.id ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-500/20' : 'bg-zinc-50 dark:bg-[#09090b] text-zinc-700 dark:text-zinc-300 border-zinc-200/50 dark:border-white/10 hover:border-orange-300 dark:hover:border-orange-500/50 hover:text-orange-600 dark:hover:text-orange-400 shadow-sm'}`}
                                                        >
                                                            <SafeIcon name={copiedId === item.id ? "check" : "copy"} size={10} />
                                                            {item.service_filter || 'SAKNAS'}
                                                        </button>
                                                    </div>

                                                    <div className="text-xs text-zinc-600 dark:text-zinc-400 space-y-1.5 w-full sm:w-3/4 mb-3 sm:mb-0">
                                                        <p className="flex items-center gap-1"><span className="text-zinc-400">Kategori:</span> <span className="font-medium text-zinc-900 dark:text-white">{item.category}</span></p>
                                                        {item.notes && <p className="truncate sm:whitespace-normal"><span className="text-zinc-400">Egenskaper:</span> <span className="font-medium text-zinc-900 dark:text-white">{item.notes}</span></p>}
                                                        {lastSold && !inStock && <p className="text-red-500 font-medium">Senast såld: {lastSold.date}</p>}
                                                    </div>
                                                    
                                                    <div className="flex gap-3 mt-1.5 sm:mt-4">
                                                        <a 
                                                            href={generateTrodoLink(item.service_filter || item.name)} 
                                                            target="_blank" rel="noopener noreferrer"
                                                            onClick={e => e.stopPropagation()} 
                                                            className="text-[11px] font-bold text-[#0066cc] dark:text-[#3399ff] hover:underline flex items-center gap-1"
                                                        >
                                                            Visa på Trodo
                                                        </a>
                                                        <a 
                                                            href={generateThansenLink(item.service_filter || item.name)} 
                                                            target="_blank" rel="noopener noreferrer"
                                                            onClick={e => e.stopPropagation()} 
                                                            className="text-[11px] font-bold text-[#0066cc] dark:text-[#3399ff] hover:underline flex items-center gap-1"
                                                        >
                                                            Visa på Thansen
                                                        </a>
                                                    </div>
                                                </div>

                                                <div className="w-full sm:w-48 shrink-0 flex flex-col sm:items-end justify-between border-t border-zinc-100 dark:border-white/5 sm:border-0 pt-3 sm:pt-0">
                                                    <div className="mb-3 sm:mb-0 flex flex-row sm:flex-col items-center sm:items-end justify-between">
                                                        <div className="text-2xl font-bold text-zinc-900 dark:text-white leading-none">
                                                            {(parseInt(item.price)||0).toLocaleString()} <span className="text-lg font-medium">kr</span>
                                                        </div>
                                                        <div className="text-[10px] text-zinc-500 mt-1 hidden sm:block text-right">inkl. moms 25% | exkl. montering</div>
                                                        <div className="text-[10px] text-zinc-500 sm:hidden">inkl. moms</div>
                                                    </div>

                                                    <div className="flex sm:flex-col items-center gap-2 w-full mt-auto">
                                                        <div className="flex flex-1 sm:w-full items-center bg-white dark:bg-[#0f1522] border border-zinc-200/80 dark:border-white/10 rounded-lg overflow-hidden h-12">
                                                            <button onClick={(e) => quickAdjustStock(e, item, -1)} className="w-12 h-full flex items-center justify-center text-zinc-500 hover:bg-zinc-50 dark:hover:bg-white/5 transition-colors border-r border-zinc-200/80 dark:border-white/10">
                                                                <SafeIcon name="minus" size={16} />
                                                            </button>
                                                            <div className="flex-1 h-full flex flex-col items-center justify-center bg-zinc-50/30 dark:bg-transparent py-1">
                                                                <span className="text-base font-black text-zinc-900 dark:text-white leading-none mb-1">{qty}</span>
                                                            </div>
                                                            <button onClick={(e) => quickAdjustStock(e, item, 1)} className="w-12 h-full flex items-center justify-center text-zinc-500 hover:bg-zinc-50 dark:hover:bg-white/5 transition-colors border-l border-zinc-200/80 dark:border-white/10">
                                                                <SafeIcon name="plus" size={16} />
                                                            </button>
                                                        </div>

                                                        <button onClick={() => setEditingItem(item)} className="flex-[1.5] sm:w-full bg-[#0066cc] hover:bg-[#0052a3] text-white h-12 rounded-lg flex items-center justify-center font-bold text-[13px] transition-colors shadow-sm gap-2">
                                                            <SafeIcon name="edit-2" size={14} className="sm:hidden" />
                                                            <span>Redigera</span>
                                                        </button>
                                                    </div>

                                                    <div className="hidden sm:flex items-center gap-1.5 mt-3 text-[10px] font-bold">
                                                        <SafeIcon name="box" size={12} className={inStock ? "text-emerald-500" : "text-red-500"} />
                                                        <span className={inStock ? "text-zinc-700 dark:text-zinc-300" : "text-red-500"}>
                                                            {inStock ? 'Finns på det lokala lagret' : 'Slutsåld'}
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })
                                )}
                            </div>
                        </main>
                    </div>
                </div>
            </div>

            {editingItem && <LagerItemModal item={editingItem} onClose={() => setEditingItem(null)} />}
        </div>
    );
};
