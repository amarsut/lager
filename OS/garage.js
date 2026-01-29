// garage.js - "Precision & Density" V18 (Restored UI + Swipe & Nav Fixes)

// --- 0. KONFIGURATION & HJÄLPFUNKTIONER ---
const AVAILABLE_BRANDS = {
    'Volvo': 'volvo', 'BMW': 'bmw', 'Audi': 'audi', 'VW': 'volkswagen',
    'Mercedes': 'mercedes', 'Tesla': 'tesla', 'Toyota': 'toyota', 'Ford': 'ford', 
    'Kia': 'kia', 'Saab': 'saab', 'Porsche': 'porsche', 'Seat': 'seat', 
    'Skoda': 'skoda', 'Nissan': 'nissan', 'Peugeot': 'peugeot', 'Renault': 'renault', 
    'Fiat': 'fiat', 'Iveco': 'iveco', 'Honda': 'honda', 'Mazda': 'mazda',
    'Hyundai': 'hyundai', 'Polestar': 'polestar', 'Mini': 'mini', 'Jeep': 'jeep',
    'Land Rover': 'landrover', 'Subaru': 'subaru', 'Suzuki': 'suzuki', 'Lexus': 'lexus',
    'Chevrolet': 'chevrolet', 'Citroen': 'citroen', 'Opel': 'opel', 'Dacia': 'dacia',
    'Mitsubishi': 'mitsubishi', 'Jaguar': 'jaguar', 'Dodge': 'dodge', 'Ram': 'ram',
    'Cupra': 'cupra'
};

const guessBrandSlug = (text) => {
    if (!text) return null;
    const lower = text.toLowerCase();
    for (const [name, slug] of Object.entries(AVAILABLE_BRANDS)) {
        if (lower.includes(name.toLowerCase()) || lower.includes(slug)) return slug;
    }
    if (lower.includes('merc') || lower.includes('benz')) return 'mercedes';
    return null;
};

// SÄKRA IKONER (Original + history support)
const SafeIcon = ({ name, size = 16, className = "" }) => {
    const common = { xmlns: "http://www.w3.org/2000/svg", width: size, height: size, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round", className };
    switch (name) {
        case 'database': return <svg {...common}><path d="M3 5c0-1.1 4.5-2 10-2s10 .9 10 2a2 2 0 0 1 0 .6l-8.3 4.7a3.5 3.5 0 0 1-3.4 0L3 5.6A2 2 0 0 1 3 5zm0 6c0-1.1 4.5-2 10-2s10 .9 10 2a2 2 0 0 1 0 .6l-8.3 4.7a3.5 3.5 0 0 1-3.4 0L3 11.6A2 2 0 0 1 3 11zm0 6c0-1.1 4.5-2 10-2s10 .9 10 2a2 2 0 0 1 0 .6l-8.3 4.7a3.5 3.5 0 0 1-3.4 0L3 17.6A2 2 0 0 1 3 17z" /></svg>;
        case 'x': return <svg {...common}><path d="M18 6 6 18M6 6l12 12" /></svg>;
        case 'search': return <svg {...common}><circle cx="11" cy="11" r="8" /><path d="m21 21-4.3-4.3" /></svg>;
        case 'plus': return <svg {...common}><path d="M5 12h14M12 5v14" /></svg>;
        case 'chevronRight': return <svg {...common}><path d="m9 18 6-6-6-6" /></svg>;
        case 'clock': return <svg {...common}><circle cx="12" cy="12" r="10" /><path d="M12 6v6l4 2" /></svg>;
        case 'trendingUp': return <svg {...common}><polyline points="23 6 13.5 15.5 8.5 10.5 1 18" /><polyline points="17 6 23 6 23 12" /></svg>;
        case 'externalLink': return <svg {...common}><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" /><polyline points="15 3 21 3 21 9" /><line x1="10" y1="14" x2="21" y2="3" /></svg>;
        case 'droplet': return <svg {...common}><path d="M12 22a7 7 0 0 0 7-7c0-2-1-3.9-3-5.5s-3.5-4-4-6.5c-.5 2.5-2 4.9-4 6.5C6 11.1 5 13 5 15a7 7 0 0 0 7 7z" /></svg>;
        case 'car': return <svg {...common}><path d="M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9C18.7 10.6 16 10 16 10s-1.3-1.4-2.2-2.3c-.5-.4-1.1-.7-1.8-.7H7.7c-.7 0-1.3.3-1.8.7C5 8.6 3.7 10 3.7 10s-2.7.6-4.5 1.1C-.3 11.3 0 12.1 0 13v3c0 .6.4 1 1 1h2" /><circle cx="7" cy="17" r="2" /><circle cx="17" cy="17" r="2" /></svg>;
        case 'edit': return <svg {...common}><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" /><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" /></svg>;
        case 'history': return <svg {...common}><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/><path d="M12 7v5l4 2"/></svg>;
        default: return <svg {...common}><circle cx="12" cy="12" r="2" /></svg>;
    }
};

const StatusBadge = ({ status }) => {
    let colors = "bg-zinc-100 text-zinc-500 border-zinc-200";
    if (['KLAR', 'BETALD'].includes(status)) colors = "bg-emerald-100 text-emerald-700 border-emerald-200";
    if (['PÅBÖRJAD', 'AKTIV'].includes(status)) colors = "bg-blue-100 text-blue-700 border-blue-200";
    if (['BOKAD', 'MOTTAGEN'].includes(status)) colors = "bg-orange-100 text-orange-700 border-orange-200";
    return <span className={`px-1.5 py-0.5 rounded text-[9px] font-black uppercase tracking-wider border ${colors}`}>{status}</span>;
};

// --- 3. KOMPONENT: FORDONSAKT ---
const VehicleProfile = ({ v, onClose, setView }) => {
    const [activeTab, setActiveTab] = React.useState('HISTORY'); 
    const [brandSlug, setBrandSlug] = React.useState(v.brand_manual || guessBrandSlug(v.model));
    
    // NYTT: Swipe Logic
    const touchStart = React.useRef(null);
    const handleTouchStart = (e) => { touchStart.current = e.targetTouches[0].clientX; };
    const handleTouchEnd = (e) => {
        const touchEnd = e.changedTouches[0].clientX;
        if (touchStart.current && touchEnd - touchStart.current > 100) {
            onClose(); 
        }
    };

    React.useEffect(() => {
        if (!v.regnr || !window.db) return;
        const unsubscribe = window.db.collection('vehicleSpecs').doc(v.regnr)
            .onSnapshot((doc) => {
                if (doc.exists) {
                    const data = doc.data();
                    if (data.brand_manual) {
                        setBrandSlug(data.brand_manual);
                    }
                }
            });
        return () => unsubscribe();
    }, [v.regnr]);

    const handleBrandChange = (e) => {
        const newSlug = e.target.value;
        setBrandSlug(newSlug);
        if (window.db) {
            window.db.collection('vehicleSpecs').doc(v.regnr).set({ 
                brand_manual: newSlug,
                updatedAt: new Date().toISOString()
            }, { merge: true });
        }
    };

    // --- TEKNISKA IKONER (Original SVG:er återställda) ---
    const techIcons = {
        car: (
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="18" height="18">
                <path d="M3 8L5.72187 10.2682C5.90158 10.418 6.12811 10.5 6.36205 10.5H17.6379C17.8719 10.5 18.0984 10.418 18.2781 10.2682L21 8M6.5 14H6.51M17.5 14H17.51M8.16065 4.5H15.8394C16.5571 4.5 17.2198 4.88457 17.5758 5.50772L20.473 10.5777C20.8183 11.1821 21 11.8661 21 12.5623V18.5C21 19.0523 20.5523 19.5 20 19.5H19C18.4477 19.5 18 19.0523 18 18.5V17.5H6V18.5C6 19.0523 5.55228 19.5 5 19.5H4C3.44772 19.5 3 19.0523 3 18.5V12.5623C3 11.8661 3.18166 11.1821 3.52703 10.5777L6.42416 5.50772C6.78024 4.88457 7.44293 4.5 8.16065 4.5ZM7 14C7 14.2761 6.77614 14.5 6.5 14.5C6.22386 14.5 6 14.2761 6 14C6 13.7239 6.22386 13.5 6.5 13.5C6.77614 13.5 7 13.7239 7 14ZM18 14C18 14.2761 17.7761 14.5 17.5 14.5C17.2239 14.5 17 14.2761 17 14C17 13.7239 17.2239 13.5 17.5 13.5C17.7761 13.5 18 13.7239 18 14Z"></path>
            </svg>
        ),
        engine: (
            <svg viewBox="0 -14.14 122.88 122.88" fill="currentColor" stroke="none" width="18" height="18">
                <path fillRule="evenodd" clipRule="evenodd" d="M43.58,92.2L31.9,80.53h-8.04c-2.81,0-5.11-2.3-5.11-5.11v-8.7h-4.87V76.9c0,2.17-1.78,3.95-3.95,3.95H3.95 C1.78,80.85,0,79.07,0,76.9V42.4c0-2.17,1.78-3.95,3.95-3.95h5.98c2.17,0,3.95,1.78,3.95,3.95v10.18h4.87v-9.36 c0-2.81,2.3-5.11,5.11-5.11h8.54l12.07-12.83c1.4-1.22,3.26-1.65,5.43-1.56h49.73c1.72,0.19,3.03,0.85,3.83,2.09 c0.8,1.22,0.67,1.91,0.67,3.28v23.49H109V42.4c0-2.17,1.78-3.95,3.95-3.95h5.98c2.17,0,3.95,1.78,3.95,3.95v34.5 c0,2.17-1.78,3.95-3.95,3.95h-5.98c-2.17,0-3.95-1.78-3.95-3.95V66.72h-4.87v0.92c0,2.73,0.08,4.38-1.66,6.64 c-0.33,0.43-0.7,0.84-1.11,1.22L83.53,92.96c-0.89,0.99-2.24,1.53-4.02,1.63h-30.4C46.84,94.49,44.99,93.71,43.58,92.2L43.58,92.2z M63.71,61.78l-12.64-1.19l10.48-22.96h14.33l-8.13,13.17l14.62,1.62L55.53,84.64L63.71,61.78L63.71,61.78z M51.98,0h34.5 c2.17,0,3.95,1.78,3.95,3.95v5.98c0,2.17-1.78,3.95-3.95,3.95H76.3v5.03H62.16v-5.03H51.98c-2.17,0-3.95-1.78-3.95-3.95V3.95 C48.03,1.78,49.81,0,51.98,0L51.98,0z"></path>
            </svg>
        ),
        oil: (
            <svg viewBox="0 0 24 24" fill="currentColor" stroke="none" width="18" height="18">
                <path fill="none" d="M0 0h24v24H0z"></path>
                <path d="M8 5h11a1 1 0 0 1 1 1v15a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V11l4-6zm5-4h5a1 1 0 0 1 1 1v2h-7V2a1 1 0 0 1 1-1zM6 12v7h2v-7H6z"></path>
            </svg>
        ),
        belt: (
            <svg viewBox="0 0 1024 1024" fill="currentColor" stroke="none" width="18" height="18">
                <path d="M512 896a384 384 0 1 0 0-768 384 384 0 0 0 0 768zm0 64a448 448 0 1 1 0-896 448 448 0 0 1 0 896z"></path><path d="M192 512a320 320 0 1 1 640 0 32 32 0 1 1-64 0 256 256 0 1 0-512 0 32 32 0 0 1-64 0z"></path><path d="M570.432 627.84A96 96 0 1 1 509.568 608l60.992-187.776A32 32 0 1 1 631.424 440l-60.992 187.776zM502.08 734.464a32 32 0 1 0 19.84-60.928 32 32 0 0 0-19.84 60.928z"></path>
            </svg>
        ),
        torque: (
            <svg viewBox="0 0 1024 1024" fill="currentColor" stroke="none" width="18" height="18">
                <path d="M865.3 244.7c-.3-.3-61.1 59.8-182.1 180.6l-84.9-84.9 180.9-180.9c-95.2-57.3-217.5-42.6-296.8 36.7A244.42 244.42 0 0 0 419 432l1.8 6.7-283.5 283.4c-6.2 6.2-6.2 16.4 0 22.6l141.4 141.4c6.2 6.2 16.4 6.2 22.6 0l283.3-283.3 6.7 1.8c83.7 22.3 173.6-.9 236-63.3 79.4-79.3 94.1-201.6 38-296.6z"></path>
            </svg>
        ),
        battery: (
            <svg viewBox="0 0 512 512" fill="currentColor" stroke="none" width="18" height="18">
                <path d="M432,132V60h-96v72H176V60H80v72H0v320h512V132H432z M181.156,258.063H82.719V227.5h98.438V258.063z M436,258.063h-33.938V292H371.5v-33.938h-33.938V227.5H371.5v-33.938h30.563V227.5H436V258.063z"></path>
            </svg>
        ),
        weight: (
            <svg viewBox="0 0 512 512" fill="currentColor" stroke="none" width="18" height="18">
                <path d="M256 46c-45.074 0-82 36.926-82 82 0 25.812 12.123 48.936 30.938 64H128L32 480h448l-96-288h-76.938C325.877 176.936 338 153.812 338 128c0-45.074-36.926-82-82-82zm0 36c25.618 0 46 20.382 46 46s-20.382 46-46 46-46-20.382-46-46 20.382-46 46-46zm-82.215 202.95h23.5v33.263l33.873-33.264h27.283l-43.883 43.15 48.4 47.974H233.54l-36.255-35.888v35.888h-23.5V284.95zm119.934 21.24c4.76 0 8.952.934 12.573 2.806 3.62 1.872 6.938 4.82 9.95 8.85v-10.13h21.972v61.462c0 10.986-3.48 19.368-10.438 25.146-6.917 5.82-16.968 8.727-30.152 8.727-4.272 0-8.4-.325-12.39-.976-3.986-.65-7.996-1.647-12.024-2.99v-17.03c3.826 2.198 7.57 3.826 11.23 4.884 3.664 1.098 7.347 1.648 11.05 1.648 7.162 0 12.41-1.566 15.746-4.7 3.337-3.132 5.006-8.035 5.006-14.708v-4.7c-3.01 3.986-6.328 6.916-9.95 8.788-3.62 1.87-7.813 2.808-12.573 2.808-8.343 0-15.238-3.275-20.69-9.826-5.453-6.592-8.18-14.974-8.18-25.146 0-10.214 2.727-18.576 8.18-25.086 5.452-6.55 12.347-9.827 20.69-9.827zm8.118 15.746c-4.517 0-8.038 1.67-10.56 5.005-2.523 3.338-3.784 8.058-3.784 14.162 0 6.266 1.22 11.026 3.662 14.28 2.442 3.215 6.003 4.823 10.682 4.823 4.557 0 8.096-1.67 10.62-5.006 2.522-3.337 3.784-8.036 3.784-14.098 0-6.104-1.262-10.824-3.785-14.16-2.523-3.337-6.062-5.006-10.62-5.006z"></path>
            </svg>
        ),
        ac: (
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="18" height="18">
                <path d="M12 3v18"/><path d="M3 12h18"/><path d="M5.6 5.6l12.8 12.8"/><path d="M18.4 5.6L5.6 18.4"/>
            </svg>
        )
    };

    const gridItems = [
        { id: 'car', label: 'Bil', val: v.model || 'Okänd', icon: techIcons.car },
        { id: 'cam', label: 'Kamrem', val: '15 000 mil / 10 år', icon: techIcons.belt },
        { id: 'eng', label: 'Motor', val: 'D4204T204 (197 hk)', icon: techIcons.engine },
        { id: 'trq', label: 'Moment', val: 'Hjul 140 Nm • Plugg 38 ...', icon: techIcons.torque },
        { id: 'oil', label: 'Olja', val: '5.6 L • 0W-20', icon: techIcons.oil },
        { id: 'bat', label: 'Batteri', val: '80Ah AGM (Bagage)', icon: techIcons.battery },
        { id: 'ac',  label: 'AC / Gas', val: 'R-1234yf (575g)', icon: techIcons.ac },
        { id: 'tow', label: 'Dragvikt', val: '2000 Kg', icon: techIcons.weight }
    ];

    return (
        <div className="fixed inset-0 z-[400] flex justify-end animate-in fade-in duration-200">
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose}></div>

            <div 
                onTouchStart={handleTouchStart}
                onTouchEnd={handleTouchEnd}
                className="relative w-full sm:w-[500px] h-full bg-[#f8f8f8] sm:bg-white shadow-2xl flex flex-col animate-in slide-in-from-right duration-300 border-l border-zinc-800"
            >
                {/* HEADER (Återställd design med blur) */}
                <div className="bg-[#111113] text-white shrink-0 relative overflow-hidden shadow-md z-20">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-orange-500/10 rounded-full blur-[80px] pointer-events-none"></div>

                    <div className="flex justify-between items-start p-5 pb-2 relative z-10">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-full bg-white/10 border border-white/20 flex items-center justify-center relative overflow-hidden group shadow-lg hover:bg-white/20 hover:border-white/40 transition-all cursor-pointer">
                                <select 
                                    className="absolute inset-0 opacity-0 cursor-pointer z-30 w-full h-full text-black"
                                    onChange={handleBrandChange}
                                    value={brandSlug || ""}
                                >
                                    <option value="" className="text-black bg-white">Välj märke...</option>
                                    {Object.entries(AVAILABLE_BRANDS).map(([name, slug]) => (
                                        <option key={slug} value={slug} className="text-black bg-white">{name}</option>
                                    ))}
                                </select>
                                {brandSlug ? (
                                    <img src={`https://cdn.simpleicons.org/${brandSlug}`} className="w-6 h-6 object-contain z-10 pointer-events-none filter invert" alt={brandSlug} />
                                ) : (
                                    <SafeIcon name="car" size={20} className="text-zinc-400 z-10 pointer-events-none" />
                                )}
                                <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity z-20 pointer-events-none">
                                    <SafeIcon name="edit" size={14} className="text-white" />
                                </div>
                            </div>

                            <div>
                                <div className="flex items-center gap-2 mb-1 opacity-50">
                                    <SafeIcon name="database" size={10} />
                                    <span className="text-[9px] font-bold uppercase tracking-widest">Fordonsakt</span>
                                </div>
                                <h2 className="text-3xl sm:text-4xl font-black font-mono tracking-tighter uppercase leading-none text-white">{v.regnr}</h2>
                                <div className="text-[11px] font-bold text-zinc-400 uppercase tracking-wide mt-1 truncate max-w-[200px]">{v.model}</div>
                            </div>
                        </div>
                        <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 transition-all">
                            <SafeIcon name="x" size={16} />
                        </button>
                    </div>

                    <div className="grid grid-cols-3 border-t border-white/10 bg-white/[0.02]">
                        <div className="p-3 border-r border-white/10 text-center">
                            <div className="text-[9px] text-zinc-500 font-black uppercase tracking-widest">Omsättning</div>
                            <div className="text-lg font-mono font-bold text-emerald-400">{v.totalRevenue > 1000 ? (v.totalRevenue/1000).toFixed(1) + 'k' : v.totalRevenue}</div>
                        </div>
                        <div className="p-3 border-r border-white/10 text-center">
                            <div className="text-[9px] text-zinc-500 font-black uppercase tracking-widest">Besök</div>
                            <div className="text-lg font-mono font-bold text-white">{v.visitCount}</div>
                        </div>
                        <div className="p-3 text-center">
                            <div className="text-[9px] text-zinc-500 font-black uppercase tracking-widest">Senast</div>
                            <div className="text-lg font-mono font-bold text-zinc-300">{v.lastVisit ? v.lastVisit.split('T')[0].substring(2) : '-'}</div>
                        </div>
                    </div>
                </div>

                {/* TABS */}
                <div className="px-4 pt-4 bg-[#f8f8f8] sm:bg-white shrink-0">
                    <div className="flex border-b border-zinc-200">
                        <button onClick={() => setActiveTab('HISTORY')} className={`flex-1 pb-3 text-[11px] font-black uppercase tracking-widest border-b-2 transition-colors ${activeTab === 'HISTORY' ? 'border-orange-500 text-black' : 'border-transparent text-zinc-400'}`}>Historik</button>
                        <button onClick={() => setActiveTab('TECH')} className={`flex-1 pb-3 text-[11px] font-black uppercase tracking-widest border-b-2 transition-colors ${activeTab === 'TECH' ? 'border-orange-500 text-black' : 'border-transparent text-zinc-400'}`}>Teknisk Data</button>
                    </div>
                </div>

                {/* CONTENT */}
                <div className="flex-1 overflow-y-auto bg-[#f8f8f8] p-4 sm:p-6 pb-24">
                    {/* HISTORIK */}
                    {activeTab === 'HISTORY' && (
                        <div className="space-y-6 animate-in fade-in duration-300 pb-20">
                             <div className="relative border-l border-zinc-300 ml-3 space-y-6">
                                {v.history.sort((a,b) => b.datum.localeCompare(a.datum)).map((job) => (
                                    <div key={job.id} onClick={() => setView('NEW_JOB', { job })} className="relative pl-6 group cursor-pointer">
                                        <div className={`absolute -left-[5px] top-1.5 w-2.5 h-2.5 rounded-full border-2 border-[#f8f8f8] shadow-sm z-10 ${['KLAR','FAKTURERAS'].includes(job.status) ? 'bg-emerald-500' : 'bg-orange-500'}`}></div>
                                        <div className="transition-transform group-hover:translate-x-1 duration-200">
                                            <div className="flex justify-between items-baseline mb-1">
                                                <div className="font-mono text-[11px] font-bold text-zinc-400">{job.datum.split('T')[0]}</div>
                                                <div className="font-mono text-[12px] font-bold text-zinc-900">{parseInt(job.kundpris||0).toLocaleString()} <span className="text-[10px] text-zinc-400">kr</span></div>
                                            </div>
                                            <div className="bg-white border border-zinc-200 p-3 rounded-lg shadow-sm group-hover:border-orange-300 transition-colors">
                                                <div className="flex justify-between items-start mb-1">
                                                    <div className="text-[11px] font-black uppercase text-zinc-800">{job.kundnamn}</div>
                                                    <StatusBadge status={job.status} />
                                                </div>
                                                <p className="text-[11px] text-zinc-600 leading-relaxed line-clamp-2">{job.kommentar || "Ingen notering."}</p>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* TEKNISK DATA */}
                    {activeTab === 'TECH' && (
                        <div className="space-y-4 animate-in fade-in duration-300 pb-20">
                            <div className="flex gap-2">
                                <a href={`https://biluppgifter.se/fordon/${v.regnr}`} target="_blank" rel="noreferrer" className="flex-1 bg-white border border-zinc-200 p-3 rounded flex items-center justify-between hover:border-blue-400 hover:text-blue-600 transition-colors group">
                                    <span className="text-[10px] font-black uppercase tracking-wider">Biluppgifter</span>
                                    <SafeIcon name="externalLink" size={12} className="text-zinc-300 group-hover:text-blue-500" />
                                </a>
                                <a href={`https://www.google.com/search?q=olja+${v.regnr}+oljemagasinet`} target="_blank" rel="noreferrer" className="flex-1 bg-white border border-zinc-200 p-3 rounded flex items-center justify-between hover:border-orange-400 hover:text-orange-600 transition-colors group">
                                    <span className="text-[10px] font-black uppercase tracking-wider">Oljemagasinet</span>
                                    <SafeIcon name="droplet" size={12} className="text-zinc-300 group-hover:text-orange-500" />
                                </a>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                {gridItems.map((item) => (
                                    <div key={item.id} className="bg-white border border-zinc-200 p-2.5 flex items-center gap-3 shadow-sm rounded-[2px] transition-all hover:border-zinc-300">
                                        <div className="w-8 h-8 flex items-center justify-center text-zinc-400 shrink-0">
                                            {item.icon}
                                        </div>
                                        <div className="overflow-hidden">
                                            <div className="text-[9px] font-bold text-zinc-400 uppercase tracking-wide leading-none mb-1">{item.label}</div>
                                            <div className="text-[12px] font-bold text-zinc-900 truncate leading-none">{item.val}</div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                <div className="p-4 border-t border-zinc-200 bg-white shrink-0">
                    <button onClick={() => setView('NEW_JOB', { prefillRegnr: v.regnr })} className="w-full py-3 bg-zinc-900 hover:bg-black text-white text-[11px] font-black uppercase tracking-widest rounded flex items-center justify-center gap-2 transition-all active:scale-[0.98]">
                        <SafeIcon name="plus" size={14} />
                        Nytt Arbete
                    </button>
                </div>
            </div>
        </div>
    );
};

// --- 4. HUVUDVY: GARAGE DASHBOARD (Återställd design + Nav Logic) ---
window.GarageView = ({ allJobs, setView }) => {
    const [searchTerm, setSearchTerm] = React.useState("");
    const [activeFilter, setActiveFilter] = React.useState('ALL');
    const [selectedVehicle, setSelectedVehicle] = React.useState(null);
    const [brandMap, setBrandMap] = React.useState({});

    // NYTT: History/Nav Logic
    const openVehicle = (v) => {
        const hashPath = `#garage/${v.regnr}`;
        window.history.pushState({ view: 'GARAGE', subView: 'PROFILE', regnr: v.regnr }, "", hashPath);
        setSelectedVehicle(v);
    };

    const closeVehicle = () => {
        if (selectedVehicle) {
            window.history.back(); // Låter popstate-lyssnaren hantera nullställning
        }
    };

    React.useEffect(() => {
        const handlePop = (e) => {
            if (selectedVehicle && (!e.state || e.state.subView !== 'PROFILE')) {
                setSelectedVehicle(null);
            }
        };
        window.addEventListener('popstate', handlePop);
        return () => window.removeEventListener('popstate', handlePop);
    }, [selectedVehicle]);

    React.useEffect(() => {
        if (!window.db) return;
        window.db.collection('vehicleSpecs').get().then(snapshot => {
            const map = {};
            snapshot.forEach(doc => {
                const data = doc.data();
                if (data.brand_manual) {
                    map[doc.id] = data.brand_manual;
                }
            });
            setBrandMap(map);
        });
    }, []);
    
    const vehicles = React.useMemo(() => {
        const map = {};
        allJobs.forEach(job => {
            if (!job.regnr) return;
            const reg = job.regnr.toUpperCase().replace(/\s+/g, '');
            if (!map[reg]) {
                map[reg] = {
                    regnr: reg,
                    model: job.bilmodell || 'Okänd',
                    customer: job.kundnamn || 'Okänd',
                    lastVisit: job.datum,
                    visitCount: 0,
                    totalRevenue: 0,
                    history: []
                };
            }
            const v = map[reg];
            v.visitCount++;
            v.totalRevenue += (parseInt(job.kundpris) || 0);
            v.history.push(job);
            if (job.datum > v.lastVisit) {
                v.lastVisit = job.datum;
                v.model = job.bilmodell || v.model;
                v.customer = job.kundnamn || v.customer;
            }
        });
        return Object.values(map);
    }, [allJobs]);

    const displayedVehicles = React.useMemo(() => {
        let result = vehicles;
        if (searchTerm) {
            const q = searchTerm.toUpperCase();
            result = result.filter(v => v.regnr.includes(q) || v.model.toUpperCase().includes(q) || v.customer.toUpperCase().includes(q));
        }
        switch (activeFilter) {
            case 'RECENT': return result.sort((a,b) => b.lastVisit.localeCompare(a.lastVisit));
            case 'TOP': return result.sort((a,b) => b.totalRevenue - a.totalRevenue);
            default: return result.sort((a,b) => a.regnr.localeCompare(b.regnr));
        }
    }, [vehicles, searchTerm, activeFilter]);

    return (
        <div className="flex flex-col h-[calc(100vh-64px)] lg:h-screen bg-[#f4f4f5] overflow-hidden">
            <div className="bg-zinc-900 text-white shrink-0 shadow-lg z-30">
                <div className="max-w-6xl mx-auto w-full px-4 pt-4 pb-0">
                    <div className="flex justify-between items-center mb-6">
                        <div className="flex items-center gap-3">
                            <div className="w-8 h-8 bg-orange-500 rounded flex items-center justify-center text-black shadow-lg shadow-orange-500/20">
                                <SafeIcon name="database" size={16} />
                            </div>
                            <div>
                                <h1 className="text-lg font-black uppercase tracking-tighter leading-none">Garaget</h1>
                                <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest leading-none">Fordonsregister</p>
                            </div>
                        </div>
                        <div className="text-right hidden sm:block">
                            <span className="text-2xl font-mono font-bold text-white tracking-tight">{vehicles.length}</span>
                            <span className="block text-[9px] font-bold text-zinc-500 uppercase tracking-widest">Totalt antal fordon</span>
                        </div>
                    </div>
                </div>
                <div className="bg-white border-b border-zinc-200 px-4 py-3 shadow-sm">
                    <div className="max-w-6xl mx-auto w-full flex flex-col sm:flex-row gap-4 items-center justify-between">
                        <div className="relative w-full sm:w-[400px]">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-zinc-400">
                                <SafeIcon name="search" size={16} />
                            </div>
                            <input type="text" placeholder="Sök regnr, kund..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="block w-full pl-10 pr-3 py-2.5 border border-zinc-300 rounded-md leading-5 bg-zinc-50 text-zinc-900 placeholder-zinc-400 focus:outline-none focus:bg-white focus:border-orange-500 focus:ring-1 focus:ring-orange-500 text-[13px] font-bold uppercase transition-all" />
                        </div>
                        <div className="flex gap-2 w-full sm:w-auto overflow-x-auto no-scrollbar">
                            {[{id:'ALL',label:'Alla'},{id:'RECENT',label:'Senaste',icon:'clock'},{id:'TOP',label:'Toppkunder',icon:'trendingUp'}].map(f => (
                                <button key={f.id} onClick={() => setActiveFilter(f.id)} className={`flex items-center gap-2 px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-wider border transition-all whitespace-nowrap ${activeFilter === f.id ? 'bg-zinc-900 text-white border-zinc-900 shadow-md' : 'bg-white text-zinc-500 border-zinc-200 hover:border-zinc-300 hover:bg-zinc-50'}`}>{f.icon && <SafeIcon name={f.icon} size={12} />}{f.label}</button>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
            
            <div className="flex-1 overflow-y-auto bg-[#f4f4f5]">
                <div className="max-w-6xl mx-auto w-full p-0 sm:p-6 pb-20">
                    <div className="hidden lg:grid grid-cols-12 gap-4 px-4 py-2 text-[9px] font-black text-zinc-400 uppercase tracking-widest select-none">
                        <div className="col-span-3">Fordon</div><div className="col-span-3">Senaste Kund</div><div className="col-span-2">Senast sedd</div><div className="col-span-2 text-right">Omsättning</div><div className="col-span-2 text-right">Status</div>
                    </div>
                    <div className="space-y-px lg:space-y-2">
                        {displayedVehicles.map(v => {
                            const listBrandSlug = brandMap[v.regnr] || guessBrandSlug(v.model);
                            return (
                                <div key={v.regnr} onClick={() => openVehicle(v)} className="bg-white lg:rounded-md border-b lg:border border-zinc-200 cursor-pointer hover:border-orange-300 hover:shadow-md transition-all active:bg-zinc-50 group">
                                    <div className="lg:hidden p-4 flex justify-between items-center">
                                        <div className="flex items-center gap-4">
                                            {listBrandSlug ? <img src={`https://cdn.simpleicons.org/${listBrandSlug}`} className="w-8 h-8 object-contain opacity-80" alt="" /> : <div className={`w-1.5 h-10 rounded-full ${v.totalRevenue > 15000 ? 'bg-orange-500' : 'bg-zinc-200'}`}></div>}
                                            <div><div className="flex items-baseline gap-2 mb-0.5"><span className="font-mono font-black text-[16px] text-zinc-900">{v.regnr}</span></div><div className="text-[11px] text-zinc-500 font-bold uppercase truncate max-w-[150px]">{v.model}</div></div>
                                        </div>
                                        <div className="text-right"><div className="font-mono font-bold text-[14px] text-zinc-900">{v.totalRevenue > 0 ? (v.totalRevenue/1000).toFixed(1) + 'k' : '-'}</div><div className="text-[10px] text-zinc-400 font-bold uppercase">{v.visitCount} besök</div></div>
                                    </div>
                                    <div className="hidden lg:grid grid-cols-12 gap-4 items-center p-3">
                                        <div className="col-span-3"><div className="flex items-center gap-3"><div className="w-8 h-8 flex items-center justify-center bg-zinc-50 rounded-full shrink-0">{listBrandSlug ? <img src={`https://cdn.simpleicons.org/${listBrandSlug}`} className="w-4 h-4 object-contain opacity-60 grayscale group-hover:grayscale-0 transition-all" alt="" /> : <div className={`w-2 h-2 rounded-full ${v.visitCount > 1 ? 'bg-orange-500' : 'bg-zinc-300'}`}></div>}</div><div><div className="font-mono font-black text-[14px] text-zinc-900 group-hover:text-orange-600 transition-colors">{v.regnr}</div><div className="text-[10px] text-zinc-400 font-bold uppercase truncate max-w-[140px]">{v.model}</div></div></div></div>
                                        <div className="col-span-3 text-[11px] font-bold text-zinc-600 uppercase truncate pr-4">{v.customer}</div>
                                        <div className="col-span-2 text-[11px] font-mono text-zinc-500">{v.lastVisit ? v.lastVisit.split('T')[0] : '-'}</div>
                                        <div className="col-span-2 text-right font-mono font-bold text-[13px] text-zinc-800 tracking-tight">{v.totalRevenue.toLocaleString()} kr</div>
                                        <div className="col-span-2 flex justify-end pr-2 text-zinc-300 group-hover:text-orange-500 transition-colors"><SafeIcon name="chevronRight" size={16} /></div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                    {displayedVehicles.length === 0 && (
                        <div className="py-20 text-center"><div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-zinc-100 text-zinc-300 mb-4"><SafeIcon name="search" size={24} /></div><p className="text-[12px] font-black uppercase text-zinc-400 tracking-widest">Inga fordon matchade sökningen</p></div>
                    )}
                </div>
            </div>

            {selectedVehicle && (
                <VehicleProfile 
                    v={selectedVehicle} 
                    onClose={closeVehicle} 
                    setView={setView} 
                />
            )}
        </div>
    );
};

// --- 5. EXPORTED HELPER (Loader för Dashboard) ---
window.VehicleProfileLoader = ({ regnr, onClose, setView }) => {
    const [vehicleData, setVehicleData] = React.useState(null);

    React.useEffect(() => {
        const loadData = async () => {
            if (!regnr || !window.db) return;
            try {
                const snap = await window.db.collection('jobs').where('regnr', '==', regnr).get();
                const jobs = snap.docs.map(d => ({ id: d.id, ...d.data() })).filter(j => !j.deleted);

                if (jobs.length > 0) {
                    jobs.sort((a,b) => (b.datum || '').localeCompare(a.datum || ''));
                    const latest = jobs[0];
                    const v = {
                        regnr: regnr,
                        model: latest.bilmodell || 'Okänd modell',
                        customer: latest.kundnamn || 'Okänd kund',
                        lastVisit: latest.datum,
                        visitCount: jobs.length,
                        totalRevenue: jobs.reduce((sum, j) => sum + (parseInt(j.kundpris) || 0), 0),
                        history: jobs,
                        brand_manual: latest.brand_manual || null
                    };
                    setVehicleData(v);
                } else {
                    setVehicleData({ regnr: regnr, model: 'Okänd', customer: '-', lastVisit: null, visitCount: 0, totalRevenue: 0, history: [], brand_manual: null });
                }
            } catch (err) {
                console.error("Kunde inte ladda fordonsakt:", err);
                onClose();
            }
        };
        loadData();
    }, [regnr]);

    if (!vehicleData) return null;
    return <VehicleProfile v={vehicleData} onClose={onClose} setView={setView} />;
};
