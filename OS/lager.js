// lager.js

// --- Huvudikoner från systemet ---
const SafeIcon = ({ name, size = 16, className = "" }) => (
    <span className={`inline-flex items-center justify-center shrink-0 ${className}`}>
        <window.Icon name={name} size={size} />
    </span>
);

// --- Specialikoner för Lagret ---
const LagerIcon = ({ category, name, size = 32 }) => {
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

    return <svg viewBox="0 0 24 24" width={size} height={size} className="text-slate-600 dark:text-slate-300">{IconContent}</svg>;
};

// --- Hjälpfunktioner ---
const generateTrodoLink = (f) => f ? `https://www.trodo.se/catalogsearch/result/premium?filter[quality_group]=2&product_list_dir=asc&product_list_order=price&q=${encodeURIComponent(f.replace(/[\s-]/g, ''))}` : '#';
const generateThansenLink = (f) => f ? `https://www.thansen.se/search/?query=${encodeURIComponent(f.replace(/[\s-]/g, ''))}` : '#';
const generateAeroMLink = (f) => f ? `https://aeromotors.se/sok?s=${f.replace(/[\s-]/g, '')}&layered_id_feature_1586%5B%5D=3&sort_by=price.asc` : '#';

// --- MODAL (Enterprise Style - Anpassad för mobil) ---
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

    const InputClass = "w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2.5 text-sm text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-orange-500/50 focus:border-orange-500 transition-all placeholder:text-slate-400";
    const LabelClass = "block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5";

    return (
        <div className="fixed inset-0 z-[500] flex items-end sm:items-center justify-center p-0 sm:p-4">
            <div className="absolute inset-0 bg-slate-900/40 dark:bg-black/60 backdrop-blur-sm transition-opacity" onClick={onClose}></div>
            
            <div className="relative w-full max-w-lg bg-white dark:bg-slate-800 rounded-t-3xl sm:rounded-xl shadow-2xl overflow-hidden border-t sm:border border-slate-200 dark:border-slate-700 animate-in slide-in-from-bottom sm:slide-in-from-bottom-0 sm:zoom-in-95 duration-200 flex flex-col max-h-[90vh]">
                
                {/* Drag Handle (Mobile only) */}
                <div className="w-full flex justify-center pt-3 pb-1 sm:hidden">
                    <div className="w-12 h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full"></div>
                </div>

                {/* Header */}
                <div className="px-6 py-4 flex justify-between items-center bg-white dark:bg-slate-800 border-b border-slate-100 dark:border-slate-700/50">
                    <div>
                        <h2 className="text-lg font-black text-slate-900 dark:text-white">
                            {isNew ? 'LÄGG TILL I LAGER' : 'REDIGERA ARTIKEL'}
                        </h2>
                        <p className="text-xs text-slate-500 mt-0.5">Fyll i uppgifter för inventariesystemet.</p>
                    </div>
                    <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-full transition-colors bg-slate-50 dark:bg-slate-900">
                        <SafeIcon name="x" size={18} />
                    </button>
                </div>

                {/* Form (Scrollable area) */}
                <form onSubmit={handleSave} className="p-6 overflow-y-auto">
                    <div className="grid grid-cols-2 gap-5">
                        <div className="col-span-2">
                            <label className={LabelClass}>Artikelnamn *</label>
                            <input autoFocus required type="text" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className={InputClass} placeholder="T.ex. Motorolja Castrol 5W-30" />
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
                        <div className="col-span-2 sm:col-span-1">
                            <label className={LabelClass}>Art.Nummer / Ref</label>
                            <input type="text" value={formData.service_filter} onChange={e => setFormData({...formData, service_filter: e.target.value.toUpperCase()})} className={`${InputClass} font-mono`} placeholder="REF-123" />
                        </div>
                        <div>
                            <label className={LabelClass}>Inköpspris (kr) *</label>
                            <div className="relative">
                                <input type="number" required value={formData.price} onChange={e => setFormData({...formData, price: e.target.value})} className={`${InputClass} pl-8 font-mono`} placeholder="0" />
                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">kr</span>
                            </div>
                        </div>
                        <div>
                            <label className={LabelClass}>Lagersaldo (st) *</label>
                            <input type="number" required value={formData.quantity} onChange={e => setFormData({...formData, quantity: e.target.value})} className={`${InputClass} font-mono`} placeholder="0" />
                        </div>
                        <div className="col-span-2">
                            <label className={LabelClass}>Interna anteckningar</label>
                            <textarea rows="2" value={formData.notes} onChange={e => setFormData({...formData, notes: e.target.value})} className={`${InputClass} resize-none`} placeholder="Passar VAG plattformen..." />
                        </div>
                    </div>

                    {/* Footer Actions */}
                    <div className="flex flex-col-reverse sm:flex-row items-center justify-between mt-8 pt-5 border-t border-slate-100 dark:border-slate-700/50 gap-4">
                        {!isNew ? (
                            <button type="button" onClick={handleDelete} className="w-full sm:w-auto text-sm font-bold text-red-600 hover:text-red-700 dark:text-red-400 px-4 py-2.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors flex items-center justify-center gap-1.5 uppercase tracking-wide">
                                <SafeIcon name="trash-2" size={16} /> Radera
                            </button>
                        ) : <div className="hidden sm:block"></div>}
                        
                        <div className="flex gap-3 w-full sm:w-auto">
                            <button type="button" onClick={onClose} className="flex-1 sm:flex-none px-6 py-2.5 text-sm font-bold text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-700 border border-transparent rounded-lg hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors uppercase tracking-wide">
                                Avbryt
                            </button>
                            <button type="submit" className="flex-1 sm:flex-none px-6 py-2.5 text-sm font-bold text-white bg-[#f97316] hover:bg-orange-600 rounded-lg shadow-md shadow-orange-500/20 focus:ring-2 focus:ring-offset-2 focus:ring-orange-500 transition-colors flex items-center justify-center gap-2 uppercase tracking-wide">
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
    const [activeCat, setActiveCat] = React.useState("Service"); 
    
    // LOGISK ÄNDRING: I lager är nu standard istället för "Alla"
    const [stockFilter, setStockFilter] = React.useState("inStock"); 
    const [editingItem, setEditingItem] = React.useState(null); 

    React.useEffect(() => {
        if (!window.db) return;
        const unsub = window.db.collection("lager").onSnapshot(s => {
            setItems(s.docs.map(d => ({ id: d.id, ...d.data() })));
        });
        return () => unsub();
    }, []);

    const keywords = ["OLJEFILTER", "LUFTFILTER", "KUPEFILTER", "BROMSBELÄGG", "TÄNDSTIFT"];
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

        res.sort((a,b) => (a.name||"").localeCompare(b.name||""));
        return res;
    }, [items, search, activeCat, stockFilter]);

    const getLastSold = (itemId) => {
        if (!allJobs.length) return null;
        const job = allJobs
            .filter(j => !j.deleted && Array.isArray(j.utgifter) && j.utgifter.some(e => String(e.inventoryId) === String(itemId)))
            .sort((a, b) => new Date(b.datum) - new Date(a.datum))[0];
        return job ? { date: job.datum?.split('T')[0] || 'Nyligen', customer: job.kundnamn } : null;
    };

    const mainCats = ['Service', 'Motor/Chassi', 'Bromsar', 'Andra Märken'];
    const totalValue = items.reduce((acc, item) => acc + ((parseInt(item.price)||0) * (parseInt(item.quantity)||0)), 0);
    const lowStockCount = items.filter(i => (parseInt(i.quantity)||0) <= 0).length;

    return (
        <div className="w-full min-h-screen bg-slate-50 dark:bg-[#0B1120] pb-4 font-sans overflow-x-hidden">
            
            {/* ENTERPRISE HEADER */}
            <header className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 sticky top-0 z-30 shadow-sm">
                <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-5 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-[#f97316] rounded-xl flex items-center justify-center text-white shadow-lg shadow-orange-500/30 shrink-0">
                            <SafeIcon name="layers" size={24} />
                        </div>
                        <div className="flex flex-col justify-center">
                            <h1 className="text-2xl font-black text-slate-900 dark:text-white uppercase tracking-tight leading-none mb-1">
                                LAGER<span className="font-light text-slate-500 dark:text-slate-400">HANTERING</span>
                            </h1>
                            <p className="text-[10px] font-bold text-[#f97316] uppercase tracking-widest flex items-center gap-1.5 leading-none">
                                <span className="w-1.5 h-1.5 rounded-full bg-[#f97316]"></span>
                                ÖVERSIKT & INVENTARIE
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-4 w-full sm:w-auto">
                        <div className="hidden md:flex items-center gap-6 mr-4 border-r border-slate-200 dark:border-slate-700 pr-6">
                            <div className="flex flex-col">
                                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Totalt Värde</span>
                                <span className="text-sm font-semibold text-slate-900 dark:text-white font-mono">{totalValue.toLocaleString()} kr</span>
                            </div>
                            <div className="flex flex-col">
                                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Slut i lager</span>
                                <span className={`text-sm font-semibold font-mono ${lowStockCount > 0 ? 'text-red-500' : 'text-slate-900 dark:text-white'}`}>{lowStockCount} st</span>
                            </div>
                        </div>

                        <button onClick={() => setEditingItem({})} className="w-full sm:w-auto bg-[#f97316] hover:bg-orange-600 text-white px-5 py-2.5 rounded-lg text-sm font-bold uppercase tracking-wide flex items-center justify-center gap-2 shadow-md shadow-orange-500/20 transition-all active:scale-95">
                            <SafeIcon name="plus" size={18} />
                            Ny Artikel
                        </button>
                    </div>
                </div>
            </header>

            <div className="max-w-[1600px] mx-auto px-0 sm:px-6 lg:px-8 py-4 sm:py-8 flex flex-col lg:flex-row gap-6 sm:gap-8">
                
                {/* SIDEBAR NAVIGATION (Desktop) */}
                <aside className="hidden lg:block w-64 shrink-0">
                    <nav className="sticky top-32 space-y-8">
                        <div>
                            <h3 className="text-[11px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-3 pl-2">Kategorier</h3>
                            <div className="space-y-1">
                                {['Alla', ...mainCats].map(cat => {
                                    const count = cat === 'Alla' ? items.length : items.filter(i => i.category === cat).length;
                                    const active = activeCat === cat;
                                    return (
                                        <button key={cat} onClick={() => setActiveCat(cat)} className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-sm transition-colors ${active ? 'bg-orange-50 dark:bg-orange-500/10 text-[#f97316] font-bold' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 font-medium'}`}>
                                            <span>{cat}</span>
                                            <span className={`text-[10px] px-2 py-0.5 rounded-lg font-bold ${active ? 'bg-orange-100 dark:bg-orange-500/20' : 'bg-slate-100 dark:bg-slate-800'}`}>{count}</span>
                                        </button>
                                    );
                                })}
                            </div>
                        </div>

                        {subFilters.length > 0 && (
                            <div>
                                <h3 className="text-[11px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-3 pl-2">Smarta Filter</h3>
                                <div className="space-y-1">
                                    {subFilters.map(kw => {
                                        const count = items.filter(i => (i.name||"").toUpperCase().includes(kw)).length;
                                        const active = activeCat === kw;
                                        const label = kw.charAt(0) + kw.slice(1).toLowerCase();
                                        return (
                                            <button key={kw} onClick={() => setActiveCat(kw)} className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-sm transition-colors ${active ? 'bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 font-bold' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 font-medium'}`}>
                                                <span>{label}</span>
                                                <span className={`text-[10px] px-2 py-0.5 rounded-lg font-bold ${active ? 'bg-blue-100 dark:bg-blue-500/20' : 'bg-slate-100 dark:bg-slate-800'}`}>{count}</span>
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>
                        )}
                    </nav>
                </aside>

                {/* MAIN CONTENT AREA */}
                <main className="flex-1 min-w-0">
                    
                    {/* TOOLBAR */}
                    <div className="flex flex-col sm:flex-row gap-3 mb-4 sm:mb-6 px-4 sm:px-0">
                        <div className="relative flex-1">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <SafeIcon name="search" size={18} className="text-slate-400" />
                            </div>
                            <input 
                                type="text" 
                                placeholder="SÖK ARTIKEL, REFERENS ELLER ANTECKNING..." 
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                className="block w-full pl-10 pr-10 py-3 sm:py-2.5 border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-orange-500/50 focus:border-orange-500 text-xs sm:text-sm font-bold tracking-wide uppercase transition-colors shadow-sm text-slate-900 dark:text-white"
                            />
                            {search && (
                                <button onClick={() => setSearch('')} className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 dark:hover:text-white">
                                    <SafeIcon name="x" size={16} />
                                </button>
                            )}
                        </div>

                        {/* Desktop Segmented Control */}
                        <div className="hidden sm:flex bg-slate-100 dark:bg-slate-800 p-1 rounded-xl border border-slate-200 dark:border-slate-700 shrink-0">
                            {[
                                {id: 'all', label: 'Alla artiklar'},
                                {id: 'inStock', label: 'I lager'},
                                {id: 'outOfStock', label: 'Slutsålda'}
                            ].map(filter => (
                                <button 
                                    key={filter.id} 
                                    onClick={() => setStockFilter(filter.id)}
                                    className={`px-4 py-1.5 text-xs font-bold uppercase tracking-wider rounded-lg transition-all ${stockFilter === filter.id ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm ring-1 ring-black/5 dark:ring-white/5' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}
                                >
                                    {filter.label}
                                </button>
                            ))}
                        </div>

                        {/* Mobile Category Dropdown */}
                        <div className="sm:hidden grid grid-cols-2 gap-3">
                            <select 
                                value={activeCat} onChange={(e) => setActiveCat(e.target.value)}
                                className="block w-full py-3 pl-3 pr-8 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 rounded-xl text-xs font-bold uppercase tracking-wider focus:ring-orange-500 focus:border-orange-500 shadow-sm text-slate-900 dark:text-white appearance-none"
                            >
                                <option value="Alla">Alla Kategorier</option>
                                {mainCats.map(c => <option key={c} value={c}>{c}</option>)}
                            </select>
                            <select 
                                value={stockFilter} onChange={(e) => setStockFilter(e.target.value)}
                                className="block w-full py-3 pl-3 pr-8 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 rounded-xl text-xs font-bold uppercase tracking-wider focus:ring-orange-500 focus:border-orange-500 shadow-sm text-slate-900 dark:text-white appearance-none"
                            >
                                <option value="inStock">I Lager</option>
                                <option value="all">Alla Status</option>
                                <option value="outOfStock">Slutsålda</option>
                            </select>
                        </div>
                    </div>

                    {/* DATA VIEW */}
                    <div className="bg-transparent sm:bg-white dark:bg-transparent dark:sm:bg-slate-900 border-none sm:border sm:border-slate-200 dark:sm:border-slate-800 sm:rounded-2xl sm:shadow-sm sm:overflow-hidden">
                        
                        {filteredItems.length === 0 && search ? (
                            <div className="p-8 sm:p-12 text-center flex flex-col items-center justify-center bg-white sm:bg-slate-50/50 dark:bg-slate-900 dark:sm:bg-slate-900/50 rounded-2xl border border-slate-200 sm:border-0 mx-4 sm:mx-0">
                                <div className="w-16 h-16 bg-slate-100 dark:bg-slate-800 rounded-2xl flex items-center justify-center text-slate-400 mb-4 shadow-inner">
                                    <SafeIcon name="search-x" size={32} />
                                </div>
                                <h3 className="text-lg font-black text-slate-900 dark:text-white mb-2 uppercase tracking-wide">Inga träffar för "{search}"</h3>
                                <p className="text-sm text-slate-500 max-w-sm mb-8">Artikeln finns inte i det lokala registret. Sök externt eller lägg in den i systemet.</p>
                                
                                <div className="flex flex-wrap gap-3 justify-center mb-8">
                                    <a href={generateTrodoLink(search)} target="_blank" className="px-5 py-2.5 bg-blue-50 text-blue-700 hover:bg-blue-100 dark:bg-blue-500/10 dark:text-blue-400 rounded-xl text-[11px] font-bold uppercase tracking-widest transition-colors flex items-center gap-2">
                                        Sök Trodo
                                    </a>
                                    <a href={generateThansenLink(search)} target="_blank" className="px-5 py-2.5 bg-red-50 text-red-700 hover:bg-red-100 dark:bg-red-500/10 dark:text-red-400 rounded-xl text-[11px] font-bold uppercase tracking-widest transition-colors flex items-center gap-2">
                                        Sök Thansen
                                    </a>
                                    <a href={generateAeroMLink(search)} target="_blank" className="px-5 py-2.5 bg-teal-50 text-teal-700 hover:bg-teal-100 dark:bg-teal-500/10 dark:text-teal-400 rounded-xl text-[11px] font-bold uppercase tracking-widest transition-colors flex items-center gap-2">
                                        Sök AeroM
                                    </a>
                                </div>

                                <button onClick={() => setEditingItem({ service_filter: search })} className="bg-[#f97316] hover:bg-orange-600 text-white px-8 py-3 rounded-xl font-bold uppercase tracking-widest text-xs flex items-center gap-2 shadow-md transition-colors">
                                    <SafeIcon name="plus" size={16} /> Skapa "{search}"
                                </button>
                            </div>
                        ) : filteredItems.length === 0 ? (
                            <div className="p-16 text-center text-slate-400 font-bold uppercase tracking-widest text-xs bg-white dark:bg-slate-900 rounded-2xl mx-4 sm:mx-0 border border-slate-200 dark:border-slate-800">
                                <SafeIcon name="inbox" size={32} className="mx-auto mb-3 opacity-50" />
                                Inga artiklar i denna vy.
                            </div>
                        ) : (
                            // LOGISK ÄNDRING: Mobilvy har kort och mellanrum (gap-3), desktopvy har rader (divide-y)
                            <div className="flex flex-col gap-3 sm:gap-0 sm:divide-y sm:divide-slate-100 dark:sm:divide-slate-800 px-4 sm:px-0">
                                
                                {/* Desktop Table Header */}
                                <div className="hidden lg:grid grid-cols-12 gap-4 p-4 bg-slate-50 dark:bg-slate-800/50 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                                    <div className="col-span-5 pl-2">Artikel & Referens</div>
                                    <div className="col-span-2">Kategori</div>
                                    <div className="col-span-2 text-right">Saldo</div>
                                    <div className="col-span-2 text-right">Pris</div>
                                    <div className="col-span-1 text-right">Åtgärd</div>
                                </div>

                                {/* List Items */}
                                {filteredItems.map(item => {
                                    const qty = parseInt(item.quantity) || 0;
                                    const inStock = qty > 0;
                                    const lastSold = !inStock ? getLastSold(item.id) : null;
                                    
                                    return (
                                        // LOGISK ÄNDRING: På mobilen blir varje objekt ett rundat kort med skugga. 
                                        <div key={item.id} className="group bg-white dark:bg-slate-900 sm:bg-transparent rounded-2xl sm:rounded-none border border-slate-200 dark:border-slate-800 sm:border-none shadow-sm sm:shadow-none p-4 sm:p-5 flex flex-col lg:grid lg:grid-cols-12 lg:items-center gap-3 sm:gap-4 hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors cursor-pointer" onClick={() => setEditingItem(item)}>
                                            
                                            {/* Name & Icon */}
                                            <div className="col-span-5 flex items-start gap-4">
                                                <div className="w-20 h-20 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center shrink-0">
                                                    <LagerIcon category={item.category} name={item.name} size={48} />
                                                </div>
                                                <div className="min-w-0 flex-1 pt-0.5">
                                                    <h4 className="text-base font-normal text-slate-900 dark:text-white group-hover:text-[#f97316] transition-colors leading-tight mb-1 truncate">
                                                        {item.name}
                                                    </h4>
                                                    <div className="flex flex-col text-xs text-slate-500 gap-1.5 mt-1">
                                                        <div>
                                                            <span className="font-mono font-bold bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded text-[10px]">
                                                                {item.service_filter || 'SAKNAR REF'}
                                                            </span>
                                                        </div>
                                                        {item.notes && <span className="italic text-[11px] whitespace-normal block">{item.notes}</span>}
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Category (Desktop) */}
                                            <div className="hidden lg:block col-span-2 text-[12px] font-bold text-slate-500">
                                                {item.category}
                                            </div>

                                            {/* Quantity & Status (Desktop) */}
                                            <div className="hidden lg:flex col-span-2 justify-end flex-col items-end">
                                                <span className={`inline-flex items-center px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider ${inStock ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400' : 'bg-red-50 text-red-600 dark:bg-red-500/10 dark:text-red-400'}`}>
                                                    {qty} st
                                                </span>
                                                {lastSold && (
                                                    <span className="text-[9px] font-bold uppercase tracking-widest text-slate-400 mt-1.5">Senast: {lastSold.date}</span>
                                                )}
                                            </div>

                                            {/* Price (Desktop) */}
                                            <div className="hidden lg:block col-span-2 text-right">
                                                <span className="text-[15px] font-black text-slate-900 dark:text-white font-mono">
                                                    {(parseInt(item.price)||0).toLocaleString()} kr
                                                </span>
                                            </div>

                                            {/* Actions (Desktop) */}
                                            <div className="hidden lg:flex col-span-1 justify-end">
                                                <button className="p-2 text-slate-400 hover:text-[#f97316] bg-white dark:bg-slate-800 shadow-sm border border-slate-200 dark:border-slate-700 rounded-lg opacity-0 group-hover:opacity-100 transition-all">
                                                    <SafeIcon name="edit-2" size={16} />
                                                </button>
                                            </div>

                                            {/* LOGISK ÄNDRING: Komprimerad mobilvy. Borttagen övre linje för bättre gruppering */}
                                            <div className="lg:hidden flex items-center justify-between pt-1">
                                                <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider ${inStock ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400' : 'bg-red-50 text-red-600 dark:bg-red-500/10 dark:text-red-400'}`}>
                                                    {qty} i lager
                                                </span>
                                                <span className="text-sm font-black text-slate-900 dark:text-white font-mono">
                                                    {(parseInt(item.price)||0).toLocaleString()} kr
                                                </span>
                                            </div>
                                            {/* Mobile Last Sold Alert */}
                                            {lastSold && !inStock && (
                                                <div className="lg:hidden text-[10px] font-bold uppercase tracking-wider text-red-500 bg-red-50 dark:bg-red-500/10 px-2.5 py-1.5 rounded-md flex items-center gap-1.5 border border-red-100 dark:border-red-500/20">
                                                    <SafeIcon name="alert-triangle" size={12} className="shrink-0" />
                                                    <span className="truncate">Såldes {lastSold.date} ({lastSold.customer})</span>
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                </main>
            </div>

            {/* REDIGERINGS MODAL */}
            {editingItem && <LagerItemModal item={editingItem} onClose={() => setEditingItem(null)} />}
        </div>
    );
};
