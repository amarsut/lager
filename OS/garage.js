// garage.js - "Precision & Density" V20 (Refactored & Optimized)

// --- KONFIGURATION & DATA ---
const BRANDS = { 'Volvo':'volvo', 'BMW':'bmw', 'Audi':'audi', 'VW':'volkswagen', 'Mercedes':'mercedes', 'Tesla':'tesla', 'Toyota':'toyota', 'Ford':'ford', 'Kia':'kia', 'Saab':'saab', 'Porsche':'porsche', 'Seat':'seat', 'Skoda':'skoda', 'Nissan':'nissan', 'Peugeot':'peugeot', 'Renault':'renault', 'Fiat':'fiat', 'Iveco':'iveco', 'Honda':'honda', 'Mazda':'mazda', 'Hyundai':'hyundai', 'Polestar':'polestar', 'Mini':'mini', 'Jeep':'jeep', 'Land Rover':'landrover', 'Subaru':'subaru', 'Suzuki':'suzuki', 'Lexus':'lexus', 'Chevrolet':'chevrolet', 'Citroen':'citroen', 'Opel':'opel', 'Dacia':'dacia', 'Mitsubishi':'mitsubishi', 'Jaguar':'jaguar', 'Dodge':'dodge', 'Ram':'ram', 'Cupra':'cupra' };

const getBrand = (t) => {
    if (!t) return null;
    const l = t.toLowerCase();
    for (const [n, s] of Object.entries(BRANDS)) if (l.includes(n.toLowerCase()) || l.includes(s)) return s;
    return (l.includes('merc') || l.includes('benz')) ? 'mercedes' : null;
};

// --- IKONER (Optimerad Struktur) ---
const ICONS = {
    db: <path d="M3 5c0-1.1 4.5-2 10-2s10 .9 10 2a2 2 0 0 1 0 .6l-8.3 4.7a3.5 3.5 0 0 1-3.4 0L3 5.6A2 2 0 0 1 3 5zm0 6c0-1.1 4.5-2 10-2s10 .9 10 2a2 2 0 0 1 0 .6l-8.3 4.7a3.5 3.5 0 0 1-3.4 0L3 11.6A2 2 0 0 1 3 11zm0 6c0-1.1 4.5-2 10-2s10 .9 10 2a2 2 0 0 1 0 .6l-8.3 4.7a3.5 3.5 0 0 1-3.4 0L3 17.6A2 2 0 0 1 3 17z" />,
    x: <path d="M18 6 6 18M6 6l12 12" />,
    search: <><circle cx="11" cy="11" r="8" /><path d="m21 21-4.3-4.3" /></>,
    plus: <path d="M5 12h14M12 5v14" />,
    right: <path d="m9 18 6-6-6-6" />,
    clock: <><circle cx="12" cy="12" r="10" /><path d="M12 6v6l4 2" /></>,
    trend: <><polyline points="23 6 13.5 15.5 8.5 10.5 1 18" /><polyline points="17 6 23 6 23 12" /></>,
    ext: <><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" /><polyline points="15 3 21 3 21 9" /><line x1="10" y1="14" x2="21" y2="3" /></>,
    drop: <path d="M12 22a7 7 0 0 0 7-7c0-2-1-3.9-3-5.5s-3.5-4-4-6.5c-.5 2.5-2 4.9-4 6.5C6 11.1 5 13 5 15a7 7 0 0 0 7 7z" />,
    car: <><path d="M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9C18.7 10.6 16 10 16 10s-1.3-1.4-2.2-2.3c-.5-.4-1.1-.7-1.8-.7H7.7c-.7 0-1.3.3-1.8.7C5 8.6 3.7 10 3.7 10s-2.7.6-4.5 1.1C-.3 11.3 0 12.1 0 13v3c0 .6.4 1 1 1h2" /><circle cx="7" cy="17" r="2" /><circle cx="17" cy="17" r="2" /></>,
    edit: <><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" /><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" /></>,
    hist: <><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/><path d="M12 7v5l4 2"/></>,
    eng: <path fillRule="evenodd" clipRule="evenodd" d="M43.58,92.2L31.9,80.53h-8.04c-2.81,0-5.11-2.3-5.11-5.11v-8.7h-4.87V76.9c0,2.17-1.78,3.95-3.95,3.95H3.95 C1.78,80.85,0,79.07,0,76.9V42.4c0-2.17,1.78-3.95,3.95-3.95h5.98c2.17,0,3.95,1.78,3.95,3.95v10.18h4.87v-9.36 c0-2.81,2.3-5.11,5.11-5.11h8.54l12.07-12.83c1.4-1.22,3.26-1.65,5.43-1.56h49.73c1.72,0.19,3.03,0.85,3.83,2.09 c0.8,1.22,0.67,1.91,0.67,3.28v23.49H109V42.4c0-2.17,1.78-3.95,3.95-3.95h5.98c2.17,0,3.95,1.78,3.95,3.95v34.5 c0,2.17-1.78,3.95-3.95,3.95h-5.98c-2.17,0-3.95-1.78-3.95-3.95V66.72h-4.87v0.92c0,2.73,0.08,4.38-1.66,6.64 c-0.33,0.43-0.7,0.84-1.11,1.22L83.53,92.96c-0.89,0.99-2.24,1.53-4.02,1.63h-30.4C46.84,94.49,44.99,93.71,43.58,92.2L43.58,92.2z M63.71,61.78l-12.64-1.19l10.48-22.96h14.33l-8.13,13.17l14.62,1.62L55.53,84.64L63.71,61.78L63.71,61.78z M51.98,0h34.5 c2.17,0,3.95,1.78,3.95,3.95v5.98c0,2.17-1.78,3.95-3.95,3.95H76.3v5.03H62.16v-5.03H51.98c-2.17,0-3.95-1.78-3.95-3.95V3.95 C48.03,1.78,49.81,0,51.98,0L51.98,0z" />,
    belt: <><path d="M512 896a384 384 0 1 0 0-768 384 384 0 0 0 0 768zm0 64a448 448 0 1 1 0-896 448 448 0 0 1 0 896z"></path><path d="M192 512a320 320 0 1 1 640 0 32 32 0 1 1-64 0 256 256 0 1 0-512 0 32 32 0 0 1-64 0z"></path><path d="M570.432 627.84A96 96 0 1 1 509.568 608l60.992-187.776A32 32 0 1 1 631.424 440l-60.992 187.776zM502.08 734.464a32 32 0 1 0 19.84-60.928 32 32 0 0 0-19.84 60.928z"></path></>,
    trq: <path d="M865.3 244.7c-.3-.3-61.1 59.8-182.1 180.6l-84.9-84.9 180.9-180.9c-95.2-57.3-217.5-42.6-296.8 36.7A244.42 244.42 0 0 0 419 432l1.8 6.7-283.5 283.4c-6.2 6.2-6.2 16.4 0 22.6l141.4 141.4c6.2 6.2 16.4 6.2 22.6 0l283.3-283.3 6.7 1.8c83.7 22.3 173.6-.9 236-63.3 79.4-79.3 94.1-201.6 38-296.6z"></path>,
    bat: <path d="M432,132V60h-96v72H176V60H80v72H0v320h512V132H432z M181.156,258.063H82.719V227.5h98.438V258.063z M436,258.063h-33.938V292H371.5v-33.938h-33.938V227.5H371.5v-33.938h30.563V227.5H436V258.063z"></path>,
    wgt: <path d="M256 46c-45.074 0-82 36.926-82 82 0 25.812 12.123 48.936 30.938 64H128L32 480h448l-96-288h-76.938C325.877 176.936 338 153.812 338 128c0-45.074-36.926-82-82-82zm0 36c25.618 0 46 20.382 46 46s-20.382 46-46 46-46-20.382-46-46 20.382-46 46-46zm-82.215 202.95h23.5v33.263l33.873-33.264h27.283l-43.883 43.15 48.4 47.974H233.54l-36.255-35.888v35.888h-23.5V284.95zm119.934 21.24c4.76 0 8.952.934 12.573 2.806 3.62 1.872 6.938 4.82 9.95 8.85v-10.13h21.972v61.462c0 10.986-3.48 19.368-10.438 25.146-6.917 5.82-16.968 8.727-30.152 8.727-4.272 0-8.4-.325-12.39-.976-3.986-.65-7.996-1.647-12.024-2.99v-17.03c3.826 2.198 7.57 3.826 11.23 4.884 3.664 1.098 7.347 1.648 11.05 1.648 7.162 0 12.41-1.566 15.746-4.7 3.337-3.132 5.006-8.035 5.006-14.708v-4.7c-3.01 3.986-6.328 6.916-9.95 8.788-3.62 1.87-7.813 2.808-12.573 2.808-8.343 0-15.238-3.275-20.69-9.826-5.453-6.592-8.18-14.974-8.18-25.146 0-10.214 2.727-18.576 8.18-25.086 5.452-6.55 12.347-9.827 20.69-9.827zm8.118 15.746c-4.517 0-8.038 1.67-10.56 5.005-2.523 3.338-3.784 8.058-3.784 14.162 0 6.266 1.22 11.026 3.662 14.28 2.442 3.215 6.003 4.823 10.682 4.823 4.557 0 8.096-1.67 10.62-5.006 2.522-3.337 3.784-8.036 3.784-14.098 0-6.104-1.262-10.824-3.785-14.16-2.523-3.337-6.062-5.006-10.62-5.006z" />,
    ac: <><path d="M12 3v18"/><path d="M3 12h18"/><path d="M5.6 5.6l12.8 12.8"/><path d="M18.4 5.6L5.6 18.4"/></>,
    oilcan: <><path fill="none" d="M0 0h24v24H0z"></path><path d="M8 5h11a1 1 0 0 1 1 1v15a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V11l4-6zm5-4h5a1 1 0 0 1 1 1v2h-7V2a1 1 0 0 1 1-1zM6 12v7h2v-7H6z"></path></>
};

const SafeIcon = ({ name, size = 16, className = "" }) => {
    const icon = ICONS[name] || <circle cx="12" cy="12" r="2" />;
    // Specialfall för custom viewbox ikoner (motor, rem, etc)
    const isCustom = ['eng','belt','trq','bat','wgt'].includes(name);
    const vb = isCustom ? (name==='bat'?'0 0 512 512':name==='eng'?'0 -14.14 122.88 122.88':'0 0 1024 1024') : "0 0 24 24";
    return <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox={vb} fill={isCustom?"currentColor":"none"} stroke={isCustom?"none":"currentColor"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>{icon}</svg>;
};

const StatusBadge = ({ status }) => {
    const c = { 'KLAR': 'emerald', 'BETALD': 'emerald', 'PÅBÖRJAD': 'blue', 'AKTIV': 'blue', 'BOKAD': 'orange' }[status] || 'zinc';
    return <span className={`px-1.5 py-0.5 rounded text-[9px] font-black uppercase tracking-wider border bg-${c}-100 text-${c}-700 border-${c}-200`}>{status}</span>;
};

// --- KOMPONENT: FORDONSAKT ---
const VehicleProfile = ({ v, onClose, setView }) => {
    const [activeTab, setActiveTab] = React.useState('TECH'); // Standard: Teknisk data
    const [brand, setBrand] = React.useState(v.brand_manual || getBrand(v.model));
    const tStart = React.useRef(null);

    // Swipe Logic
    const handleTouchStart = (e) => { tStart.current = e.targetTouches[0].clientX; };
    const handleTouchEnd = (e) => {
        if (!tStart.current) return;
        const diff = e.changedTouches[0].clientX - tStart.current;
        // Swipe Höger (>60px): Om på Historik -> Stäng. Om på Tech -> Gå till Historik
        if (diff > 60) {
            if (activeTab === 'HISTORY') onClose();
            else setActiveTab('HISTORY');
        }
        // Swipe Vänster (<-60px): Om på Historik -> Gå till Tech
        else if (diff < -60 && activeTab === 'HISTORY') {
            setActiveTab('TECH');
        }
        tStart.current = null;
    };

    React.useEffect(() => {
        if (!v.regnr || !window.db) return;
        return window.db.collection('vehicleSpecs').doc(v.regnr).onSnapshot(d => d.exists && d.data().brand_manual && setBrand(d.data().brand_manual));
    }, [v.regnr]);

    const changeBrand = (e) => {
        setBrand(e.target.value);
        window.db && window.db.collection('vehicleSpecs').doc(v.regnr).set({ brand_manual: e.target.value, updatedAt: new Date().toISOString() }, { merge: true });
    };

    const copyReg = () => navigator.clipboard && navigator.clipboard.writeText(v.regnr);

    const grid = [
        { id: 'car', label: 'Bil', val: v.regnr, icon: 'car' }, // Visar Regnr
        { id: 'cam', label: 'Kamrem', val: '15 000 mil / 10 år', icon: 'belt' },
        { id: 'eng', label: 'Motor', val: 'D4204T204 (197 hk)', icon: 'eng' },
        { id: 'trq', label: 'Moment', val: 'Hjul 140 Nm • Plugg 38', icon: 'trq' },
        { id: 'oil', label: 'Olja', val: '5.6 L • 0W-20', icon: 'oilcan' },
        { id: 'bat', label: 'Batteri', val: '80Ah AGM (Bagage)', icon: 'bat' },
        { id: 'ac',  label: 'AC / Gas', val: 'R-1234yf (575g)', icon: 'ac' },
        { id: 'tow', label: 'Dragvikt', val: '2000 Kg', icon: 'wgt' }
    ];

    return (
        <div className="fixed inset-0 z-[400] flex justify-end animate-in fade-in duration-200">
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose}></div>
            <div onTouchStart={handleTouchStart} onTouchEnd={handleTouchEnd} className="relative w-full sm:w-[500px] h-full bg-[#f8f8f8] sm:bg-white shadow-2xl flex flex-col animate-in slide-in-from-right duration-300 border-l border-zinc-800">
                
                {/* HEADER */}
                <div className="bg-[#111113] text-white shrink-0 relative overflow-hidden shadow-md z-20">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-orange-500/10 rounded-full blur-[80px] pointer-events-none"></div>
                    <div className="flex justify-between items-start p-5 pb-2 relative z-10">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-full bg-white/10 border border-white/20 flex items-center justify-center relative overflow-hidden group shadow-lg hover:bg-white/20 transition-all">
                                <select className="absolute inset-0 opacity-0 cursor-pointer z-30 w-full h-full" onChange={changeBrand} value={brand||""}>
                                    <option value="">...</option>{Object.entries(BRANDS).map(([n,s])=><option key={s} value={s}>{n}</option>)}
                                </select>
                                {brand ? <img src={`https://cdn.simpleicons.org/${brand}`} className="w-6 h-6 object-contain z-10 filter invert pointer-events-none"/> : <SafeIcon name="car" size={20} className="text-zinc-400 z-10"/>}
                                <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity z-20 pointer-events-none"><SafeIcon name="edit" size={14} className="text-white"/></div>
                            </div>
                            <div>
                                <div className="flex items-center gap-2 mb-1 opacity-50"><SafeIcon name="db" size={10} /><span className="text-[9px] font-bold uppercase tracking-widest">Fordonsakt</span></div>
                                <h2 className="text-3xl sm:text-4xl font-black font-mono tracking-tighter uppercase leading-none text-white">{v.regnr}</h2>
                                {/* Visar Kundnamn här istället för modell */}
                                <div className="text-[11px] font-bold text-zinc-400 uppercase tracking-wide mt-1 truncate max-w-[200px]">{v.customer || v.model}</div>
                            </div>
                        </div>
                        <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 transition-all"><SafeIcon name="x" size={16} /></button>
                    </div>
                    <div className="grid grid-cols-3 border-t border-white/10 bg-white/[0.02]">
                        <div className="p-3 border-r border-white/10 text-center"><div className="text-[9px] text-zinc-500 font-black uppercase tracking-widest">Omsättning</div><div className="text-lg font-mono font-bold text-emerald-400">{v.totalRevenue > 1000 ? (v.totalRevenue/1000).toFixed(1)+'k' : v.totalRevenue}</div></div>
                        <div className="p-3 border-r border-white/10 text-center"><div className="text-[9px] text-zinc-500 font-black uppercase tracking-widest">Besök</div><div className="text-lg font-mono font-bold text-white">{v.visitCount}</div></div>
                        <div className="p-3 text-center"><div className="text-[9px] text-zinc-500 font-black uppercase tracking-widest">Senast</div><div className="text-lg font-mono font-bold text-zinc-300">{v.lastVisit ? v.lastVisit.split('T')[0].substring(2) : '-'}</div></div>
                    </div>
                </div>

                {/* TABS */}
                <div className="px-4 pt-4 bg-[#f8f8f8] sm:bg-white shrink-0 flex border-b border-zinc-200">
                    {[{id:'TECH',l:'Teknisk Data'},{id:'HISTORY',l:'Historik'}].map(t => (
                        <button key={t.id} onClick={()=>setActiveTab(t.id)} className={`flex-1 pb-3 text-[11px] font-black uppercase tracking-widest border-b-2 transition-colors ${activeTab===t.id ? 'border-orange-500 text-black':'border-transparent text-zinc-400'}`}>{t.l}</button>
                    ))}
                </div>

                {/* CONTENT */}
                <div className="flex-1 overflow-y-auto bg-[#f8f8f8] p-4 sm:p-6 pb-24">
                    {activeTab === 'HISTORY' ? (
                        <div className="space-y-6 animate-in fade-in duration-300 pb-20 relative border-l border-zinc-300 ml-3">
                            {v.history.sort((a,b)=>b.datum.localeCompare(a.datum)).map(j => (
                                <div key={j.id} onClick={()=>setView('NEW_JOB',{job:j})} className="relative pl-6 group cursor-pointer">
                                    <div className={`absolute -left-[5px] top-1.5 w-2.5 h-2.5 rounded-full border-2 border-[#f8f8f8] shadow-sm z-10 ${['KLAR','FAKTURERAS'].includes(j.status)?'bg-emerald-500':'bg-orange-500'}`}></div>
                                    <div className="transition-transform group-hover:translate-x-1 duration-200">
                                        <div className="flex justify-between items-baseline mb-1"><div className="font-mono text-[11px] font-bold text-zinc-400">{j.datum.split('T')[0]}</div><div className="font-mono text-[12px] font-bold text-zinc-900">{parseInt(j.kundpris||0).toLocaleString()} <span className="text-[10px] text-zinc-400">kr</span></div></div>
                                        <div className="bg-white border border-zinc-200 p-3 rounded-lg shadow-sm group-hover:border-orange-300 transition-colors">
                                            <div className="flex justify-between items-start mb-1"><div className="text-[11px] font-black uppercase text-zinc-800">{j.kundnamn}</div><StatusBadge status={j.status}/></div>
                                            <p className="text-[11px] text-zinc-600 line-clamp-2">{j.kommentar||"Ingen notering."}</p>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="space-y-4 animate-in fade-in duration-300 pb-20">
                            <div className="flex gap-2">
                                <a href={`https://biluppgifter.se/fordon/${v.regnr}#fordonsdata`} target="_blank" className="flex-1 bg-white border border-zinc-200 p-3 rounded flex items-center gap-3 hover:border-blue-400 hover:text-blue-600 transition-colors group no-underline">
                                    <img src="https://biluppgifter.se/favicon.ico" alt="B" className="w-6 h-6 rounded shrink-0"/>
                                    <span className="text-[10px] font-black uppercase tracking-wider text-zinc-700 group-hover:text-blue-600">Biluppgifter</span>
                                </a>
                                <a href="https://www.oljemagasinet.se/" target="_blank" onClick={copyReg} className="flex-1 bg-white border border-zinc-200 p-3 rounded flex items-center gap-3 hover:border-orange-400 hover:text-orange-600 transition-colors group no-underline">
                                    <img src="https://www.google.com/s2/favicons?domain=oljemagasinet.se" alt="O" className="w-6 h-6 rounded shrink-0"/>
                                    <span className="text-[10px] font-black uppercase tracking-wider text-zinc-700 group-hover:text-orange-600">Oljemagasinet</span>
                                </a>
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                {grid.map(i => (
                                    <div key={i.id} className="bg-white border border-zinc-200 p-2.5 flex items-center gap-3 shadow-sm rounded-[2px] hover:border-zinc-300">
                                        <div className="w-8 h-8 flex items-center justify-center text-zinc-400 shrink-0"><SafeIcon name={i.icon} size={18}/></div>
                                        <div className="overflow-hidden"><div className="text-[9px] font-bold text-zinc-400 uppercase tracking-wide leading-none mb-1">{i.label}</div><div className="text-[12px] font-bold text-zinc-900 truncate leading-none">{i.val}</div></div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
                <div className="p-4 border-t border-zinc-200 bg-white shrink-0">
                    <button onClick={()=>setView('NEW_JOB',{prefillRegnr:v.regnr})} className="w-full py-3 bg-zinc-900 hover:bg-black text-white text-[11px] font-black uppercase tracking-widest rounded flex items-center justify-center gap-2 active:scale-[0.98]">
                        <SafeIcon name="plus" size={14}/> Nytt Arbete
                    </button>
                </div>
            </div>
        </div>
    );
};

// --- HUVUDVY ---
window.GarageView = ({ allJobs, setView }) => {
    const [q, setQ] = React.useState("");
    const [filter, setFilter] = React.useState('ALL');
    const [sel, setSel] = React.useState(null);
    const [bMap, setBMap] = React.useState({});

    const open = (v) => { window.history.pushState({view:'GARAGE',sub:'PROFILE',regnr:v.regnr},"","#garage/"+v.regnr); setSel(v); };
    const close = () => { if(sel) window.history.back(); };

    React.useEffect(() => {
        const hPop = (e) => { if(sel && (!e.state || e.state.sub!=='PROFILE')) setSel(null); };
        window.addEventListener('popstate', hPop);
        window.db && window.db.collection('vehicleSpecs').get().then(s => { const m={}; s.forEach(d=>d.data().brand_manual&&(m[d.id]=d.data().brand_manual)); setBMap(m); });
        return () => window.removeEventListener('popstate', hPop);
    }, [sel]);

    const vs = React.useMemo(() => {
        const m = {};
        allJobs.forEach(j => {
            if(!j.regnr) return;
            const r = j.regnr.toUpperCase().replace(/\s+/g,'');
            if(!m[r]) m[r] = { regnr:r, model:j.bilmodell||'Okänd', customer:j.kundnamn||'Okänd', lastVisit:j.datum, visitCount:0, totalRevenue:0, history:[] };
            const v = m[r];
            v.visitCount++; v.totalRevenue+=(parseInt(j.kundpris)||0); v.history.push(j);
            if(j.datum > v.lastVisit) { v.lastVisit=j.datum; v.model=j.bilmodell||v.model; v.customer=j.kundnamn||v.customer; }
        });
        return Object.values(m);
    }, [allJobs]);

    const dVs = React.useMemo(() => {
        let r = vs;
        if(q) { const u = q.toUpperCase(); r = r.filter(v=>v.regnr.includes(u)||v.model.toUpperCase().includes(u)||v.customer.toUpperCase().includes(u)); }
        return filter==='RECENT' ? r.sort((a,b)=>b.lastVisit.localeCompare(a.lastVisit)) : filter==='TOP' ? r.sort((a,b)=>b.totalRevenue-a.totalRevenue) : r.sort((a,b)=>a.regnr.localeCompare(b.regnr));
    }, [vs, q, filter]);

    return (
        <div className="flex flex-col h-[calc(100vh-64px)] lg:h-screen bg-[#f4f4f5] overflow-hidden">
            <div className="bg-zinc-900 text-white shrink-0 shadow-lg z-30">
                <div className="max-w-6xl mx-auto w-full px-4 pt-4 pb-0">
                    <div className="flex justify-between items-center mb-6">
                        <div className="flex items-center gap-3"><div className="w-8 h-8 bg-orange-500 rounded flex items-center justify-center text-black shadow-lg"><SafeIcon name="db" size={16}/></div><div><h1 className="text-lg font-black uppercase tracking-tighter leading-none">Garaget</h1><p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest leading-none">Fordonsregister</p></div></div>
                        <div className="text-right hidden sm:block"><span className="text-2xl font-mono font-bold text-white tracking-tight">{vs.length}</span><span className="block text-[9px] font-bold text-zinc-500 uppercase tracking-widest">Fordon</span></div>
                    </div>
                </div>
                <div className="bg-white border-b border-zinc-200 px-4 py-3 shadow-sm">
                    <div className="max-w-6xl mx-auto w-full flex flex-col sm:flex-row gap-4 items-center justify-between">
                        <div className="relative w-full sm:w-[400px]"><div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-zinc-400"><SafeIcon name="search" size={16}/></div><input type="text" placeholder="Sök regnr, kund..." value={q} onChange={e=>setQ(e.target.value)} className="block w-full pl-10 pr-3 py-2.5 border border-zinc-300 rounded-md bg-zinc-50 text-zinc-900 text-[13px] font-bold uppercase focus:bg-white focus:border-orange-500 focus:outline-none"/></div>
                        <div className="flex gap-2 w-full sm:w-auto overflow-x-auto no-scrollbar">{[{id:'ALL',l:'Alla'},{id:'RECENT',l:'Senaste',i:'clock'},{id:'TOP',l:'Toppkunder',i:'trend'}].map(f=><button key={f.id} onClick={()=>setFilter(f.id)} className={`flex items-center gap-2 px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-wider border whitespace-nowrap ${filter===f.id?'bg-zinc-900 text-white border-zinc-900':'bg-white text-zinc-500 border-zinc-200'}`}>{f.i&&<SafeIcon name={f.i} size={12}/>}{f.l}</button>)}</div>
                    </div>
                </div>
            </div>
            
            <div className="flex-1 overflow-y-auto bg-[#f4f4f5]">
                <div className="max-w-6xl mx-auto w-full p-0 sm:p-6 pb-20">
                    <div className="hidden lg:grid grid-cols-12 gap-4 px-4 py-2 text-[9px] font-black text-zinc-400 uppercase tracking-widest select-none"><div className="col-span-3">Fordon</div><div className="col-span-3">Senaste Kund</div><div className="col-span-2">Senast sedd</div><div className="col-span-2 text-right">Omsättning</div><div className="col-span-2 text-right">Status</div></div>
                    <div className="space-y-px lg:space-y-2">
                        {dVs.map(v => {
                            const b = bMap[v.regnr] || getBrand(v.model);
                            return (
                                <div key={v.regnr} onClick={()=>open(v)} className="bg-white lg:rounded-md border-b lg:border border-zinc-200 cursor-pointer hover:border-orange-300 hover:shadow-md transition-all active:bg-zinc-50 group">
                                    <div className="lg:hidden p-4 flex justify-between items-center">
                                        <div className="flex items-center gap-4">{b?<img src={`https://cdn.simpleicons.org/${b}`} className="w-8 h-8 object-contain opacity-80"/>:<div className={`w-1.5 h-10 rounded-full ${v.totalRevenue>15000?'bg-orange-500':'bg-zinc-200'}`}></div>}<div><div className="flex items-baseline gap-2 mb-0.5"><span className="font-mono font-black text-[16px] text-zinc-900">{v.regnr}</span></div><div className="text-[11px] text-zinc-500 font-bold uppercase truncate max-w-[150px]">{v.model}</div></div></div>
                                        <div className="text-right"><div className="font-mono font-bold text-[14px] text-zinc-900">{v.totalRevenue>0?(v.totalRevenue/1000).toFixed(1)+'k':'-'}</div><div className="text-[10px] text-zinc-400 font-bold uppercase">{v.visitCount} besök</div></div>
                                    </div>
                                    <div className="hidden lg:grid grid-cols-12 gap-4 items-center p-3">
                                        <div className="col-span-3"><div className="flex items-center gap-3"><div className="w-8 h-8 flex items-center justify-center bg-zinc-50 rounded-full shrink-0">{b?<img src={`https://cdn.simpleicons.org/${b}`} className="w-4 h-4 object-contain opacity-60 grayscale group-hover:grayscale-0 transition-all"/>:<div className={`w-2 h-2 rounded-full ${v.visitCount>1?'bg-orange-500':'bg-zinc-300'}`}></div>}</div><div><div className="font-mono font-black text-[14px] text-zinc-900 group-hover:text-orange-600 transition-colors">{v.regnr}</div><div className="text-[10px] text-zinc-400 font-bold uppercase truncate max-w-[140px]">{v.model}</div></div></div></div>
                                        <div className="col-span-3 text-[11px] font-bold text-zinc-600 uppercase truncate pr-4">{v.customer}</div>
                                        <div className="col-span-2 text-[11px] font-mono text-zinc-500">{v.lastVisit?v.lastVisit.split('T')[0]:'-'}</div>
                                        <div className="col-span-2 text-right font-mono font-bold text-[13px] text-zinc-800">{v.totalRevenue.toLocaleString()} kr</div>
                                        <div className="col-span-2 flex justify-end pr-2 text-zinc-300 group-hover:text-orange-500"><SafeIcon name="right" size={16}/></div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>
            {sel && <VehicleProfile v={sel} onClose={close} setView={setView} />}
        </div>
    );
};

window.VehicleProfileLoader = ({ regnr, onClose, setView }) => {
    const [d, setD] = React.useState(null);
    React.useEffect(() => {
        if(!regnr || !window.db) return;
        window.db.collection('jobs').where('regnr','==',regnr).get().then(s => {
            const j = s.docs.map(d=>({id:d.id,...d.data()})).filter(x=>!x.deleted).sort((a,b)=>(b.datum||'').localeCompare(a.datum||''));
            if(j.length){ const l=j[0]; setD({regnr:regnr,model:l.bilmodell||'Okänd',customer:l.kundnamn||'Okänd',lastVisit:l.datum,visitCount:j.length,totalRevenue:j.reduce((s,x)=>s+(parseInt(x.kundpris)||0),0),history:j,brand_manual:l.brand_manual}); }
            else setD({regnr:regnr,model:'Okänd',customer:'-',lastVisit:null,visitCount:0,totalRevenue:0,history:[],brand_manual:null});
        });
    }, [regnr]);
    return d ? <VehicleProfile v={d} onClose={onClose} setView={setView}/> : null;
};
