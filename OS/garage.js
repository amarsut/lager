// garage.js

const BRANDS = { 'Volvo':'volvo', 'BMW':'bmw', 'Audi':'audi', 'VW':'volkswagen', 'Mercedes':'mercedes', 'Tesla':'tesla', 'Toyota':'toyota', 'Ford':'ford', 'Kia':'kia', 'Saab':'saab', 'Porsche':'porsche', 'Seat':'seat', 'Skoda':'skoda', 'Nissan':'nissan', 'Peugeot':'peugeot', 'Renault':'renault', 'Fiat':'fiat', 'Iveco':'iveco', 'Honda':'honda', 'Mazda':'mazda', 'Hyundai':'hyundai', 'Polestar':'polestar', 'Mini':'mini', 'Jeep':'jeep', 'Land Rover':'landrover', 'Subaru':'subaru', 'Suzuki':'suzuki', 'Lexus':'lexus', 'Chevrolet':'chevrolet', 'Citroen':'citroen', 'Opel':'opel', 'Dacia':'dacia', 'Mitsubishi':'mitsubishi', 'Jaguar':'jaguar', 'Dodge':'dodge', 'Ram':'ram', 'Cupra':'cupra' };

const getBrand = (t) => {
    if (!t) return null;
    const l = t.toLowerCase();
    for (const [n, s] of Object.entries(BRANDS)) if (l.includes(n.toLowerCase()) || l.includes(s)) return s;
    return (l.includes('merc') || l.includes('benz')) ? 'mercedes' : null;
};

const StatCard = ({ icon, label, val, highlight }) => {
    const displayVal = val || '-';
    let colorClass = 'text-emerald-600 dark:text-emerald-400';
    let borderGlow = 'border-zinc-200 dark:border-white/5 hover:border-emerald-500/30 hover:bg-emerald-50 dark:hover:bg-emerald-400/5';
    let bgClass = 'bg-white dark:bg-slate-700/30';
    
    if (highlight) {
        colorClass = 'text-red-500 dark:text-red-400';
        borderGlow = 'border-red-200 dark:border-red-400/30 hover:border-red-300 dark:hover:border-red-400/50 shadow-[inset_0_0_20px_rgba(239,68,68,0.05)] dark:shadow-[inset_0_0_20px_rgba(239,68,68,0.1)]';
        bgClass = 'bg-red-50 dark:bg-red-500/5';
    }

    return (
        <div className={`${bgClass} backdrop-blur-md rounded-xl p-3.5 flex flex-col gap-1.5 transition-all duration-300 border ${borderGlow} group hover:-translate-y-0.5 shadow-sm`}>
            <div className={`text-[8px] font-black uppercase tracking-widest text-zinc-500 dark:text-slate-400 flex items-center gap-1.5`}>
                <SafeIcon name={icon} size={10} className={colorClass} /> {label}
            </div>
            <div className={`text-[13px] font-bold tracking-wide truncate ${val ? 'text-zinc-900 dark:text-slate-100 group-hover:text-black dark:group-hover:text-white transition-colors' : 'text-zinc-400 dark:text-slate-500'}`} title={displayVal}>
                {displayVal}
            </div>
        </div>
    );
};

const TimelineItem = ({ j, isHighlighted, isLast, setView, onClose }) => {
    const isKlar = ['KLAR', 'FAKTURERAS'].includes(j.status);
    
    return (
        <div className="relative pl-7 sm:pl-8 pb-3 group">
            {/* Tidslinjen - Nu perfekt centrerad och ENSAM */}
            <div className="absolute left-[13px] sm:left-[15px] top-[26px] bottom-[-14px] w-[2px] bg-zinc-200 dark:bg-white/5 group-last:bg-transparent transition-colors"></div>
            {isHighlighted && <div className="absolute left-[13px] sm:left-[15px] top-[26px] bottom-[-14px] w-[2px] bg-orange-500/40 z-0 group-last:bg-transparent"></div>}
            
            {/* Pricken med Radar-puls för aktivt val */}
            <div className="absolute left-[9px] sm:left-[11px] top-6 flex items-center justify-center">
                {isHighlighted && <div className="absolute w-6 h-6 rounded-full bg-orange-500/20 animate-pulse z-0"></div>}
                <div className={`relative w-2.5 h-2.5 rounded-full border-[2px] border-zinc-50 dark:border-slate-800 z-10 transition-all duration-300 ${isHighlighted ? 'bg-orange-500 ring-2 ring-orange-500/40 scale-110' : (isKlar ? 'bg-emerald-500' : 'bg-zinc-400 dark:bg-slate-500')}`}></div>
            </div>

            {/* Kortet - Med horisontell hover (translate-x-1) istället för translate-y */}
            <div 
                onClick={() => {
                    setView('NEW_JOB', { job: j });
                    if (window.innerWidth < 1024) onClose();
                }} 
                className={`cursor-pointer rounded-xl p-4 transition-all duration-300 relative z-10 ${
                    isHighlighted 
                    ? 'bg-orange-50/80 dark:bg-slate-700/60 border border-orange-500 shadow-md translate-x-1' 
                    : 'bg-white dark:bg-slate-700/30 border border-zinc-200 dark:border-white/5 hover:bg-zinc-50 dark:hover:bg-slate-700/50 hover:border-zinc-300 dark:hover:border-white/10 shadow-sm hover:shadow hover:translate-x-1'
                }`}
            >
                <div className="flex justify-between items-start mb-2.5">
                    <div className={`flex items-center gap-1.5 font-mono text-[10px] font-bold uppercase tracking-widest ${isHighlighted ? 'text-orange-600 dark:text-orange-400' : 'text-zinc-500 dark:text-slate-400'}`}>
                        <SafeIcon name="calendar" size={10} className={isHighlighted ? "text-orange-500 dark:text-orange-400" : "text-zinc-400 dark:text-slate-500"} />
                        {j.datum ? j.datum.split('T')[0] : 'Inväntar'}
                    </div>
                    {/* Skarpare Badges */}
                    {window.Badge ? <window.Badge status={j.status} /> : (
                        <span className={`text-[8px] font-black uppercase tracking-widest px-2 py-0.5 rounded shadow-sm ${isKlar ? 'bg-emerald-100 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/30' : 'bg-orange-100 dark:bg-orange-500/20 text-orange-700 dark:text-orange-400 border border-orange-200 dark:border-orange-500/30'}`}>{j.status}</span>
                    )}
                </div>
                
                <div className="flex justify-between items-end gap-3 mb-1">
                    <div className="text-[13px] font-black uppercase tracking-tight truncate text-zinc-900 dark:text-slate-100 group-hover:text-black dark:group-hover:text-white transition-colors">
                        {j.kundnamn}
                    </div>
                    <div className="font-mono text-[14px] font-black shrink-0 leading-none text-zinc-800 dark:text-slate-200">
                        {parseInt(j.kundpris||0).toLocaleString()} <span className="text-[9px] text-zinc-500 dark:text-slate-500 font-sans uppercase tracking-widest">kr</span>
                    </div>
                </div>

                {j.kommentar && (
                    <div className="mt-3 pt-3 border-t border-zinc-100 dark:border-white/5">
                        <p className="text-[11px] leading-relaxed line-clamp-3 italic text-zinc-600 dark:text-slate-400 group-hover:text-zinc-800 dark:group-hover:text-slate-300 transition-colors">
                            {stripHtml(j.kommentar)}
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
};

// Gör märkestolken tillgänglig globalt för Dashboarden
window.VEHICLE_BRANDS = BRANDS;
window.getVehicleBrand = getBrand;

// Tar bort HTML från rich text-anteckningar för renare historik-vy
const stripHtml = (html) => {
    if (!html) return '';
    const text = String(html).replace(/<br\s*[\/]?>/gi, " ").replace(/<\/p>/gi, " ");
    if (typeof document !== 'undefined') {
        const tmp = document.createElement("DIV");
        tmp.innerHTML = text;
        return (tmp.textContent || tmp.innerText || "").trim();
    }
    return text.replace(/<[^>]*>?/gm, '').trim(); 
};

// Smart ikon-hanterare: Använder window.Icon om den finns (lucide), annars fallbacks/custom
const SafeIcon = ({ name, size = 16, className = "" }) => {
    const s = size; const c = className;
    
    // Custom SVGs för specifika fall
    if (name === 'db') return <svg xmlns="http://www.w3.org/2000/svg" width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={c}><path d="M3 5c0-1.1 4.5-2 10-2s10 .9 10 2a2 2 0 0 1 0 .6l-8.3 4.7a3.5 3.5 0 0 1-3.4 0L3 5.6A2 2 0 0 1 3 5zm0 6c0-1.1 4.5-2 10-2s10 .9 10 2a2 2 0 0 1 0 .6l-8.3 4.7a3.5 3.5 0 0 1-3.4 0L3 11.6A2 2 0 0 1 3 11zm0 6c0-1.1 4.5-2 10-2s10 .9 10 2a2 2 0 0 1 0 .6l-8.3 4.7a3.5 3.5 0 0 1-3.4 0L3 17.6A2 2 0 0 1 3 17z"/></svg>;
    if (name === 'trend') return <svg xmlns="http://www.w3.org/2000/svg" width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={c}><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/></svg>;
    if (name === 'car') return <svg xmlns="http://www.w3.org/2000/svg" width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={c}><path d="M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9C18.7 10.6 16 10 16 10s-1.3-1.4-2.2-2.3c-.5-.4-1.1-.7-1.8-.7H7.7c-.7 0-1.3.3-1.8.7C5 8.6 3.7 10 3.7 10s-2.7.6-4.5 1.1C-.3 11.3 0 12.1 0 13v3c0 .6.4 1 1 1h2"/><circle cx="7" cy="17" r="2"/><circle cx="17" cy="17" r="2"/></svg>;
    if (name === 'oil') return <svg xmlns="http://www.w3.org/2000/svg" width={s} height={s} viewBox="0 0 24 24" fill="currentColor" stroke="none" className={c}><path fill="none" d="M0 0h24v24H0z"></path><path d="M8 5h11a1 1 0 0 1 1 1v15a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V11l4-6zm5-4h5a1 1 0 0 1 1 1v2h-7V2a1 1 0 0 1 1-1zM6 12v7h2v-7H6z"></path></svg>;
    if (name === 'eng') return <svg xmlns="http://www.w3.org/2000/svg" width={s} height={s} viewBox="0 -14.14 122.88 122.88" fill="currentColor" stroke="none" className={c}><path d="M43.58,92.2L31.9,80.53h-8.04c-2.81,0-5.11-2.3-5.11-5.11v-8.7h-4.87V76.9c0,2.17-1.78,3.95-3.95,3.95H3.95 C1.78,80.85,0,79.07,0,76.9V42.4c0-2.17,1.78-3.95,3.95-3.95h5.98c2.17,0,3.95,1.78,3.95,3.95v10.18h4.87v-9.36 c0-2.81,2.3-5.11,5.11-5.11h8.54l12.07-12.83c1.4-1.22,3.26-1.65,5.43-1.56h49.73c1.72,0.19,3.03,0.85,3.83,2.09 c0.8,1.22,0.67,1.91,0.67,3.28v23.49H109V42.4c0-2.17,1.78-3.95,3.95-3.95h5.98c2.17,0,3.95,1.78,3.95,3.95v34.5 c0,2.17-1.78,3.95-3.95,3.95h-5.98c-2.17,0-3.95-1.78-3.95-3.95V66.72h-4.87v0.92c0,2.73,0.08,4.38-1.66,6.64 c-0.33,0.43-0.7,0.84-1.11,1.22L83.53,92.96c-0.89,0.99-2.24,1.53-4.02,1.63h-30.4C46.84,94.49,44.99,93.71,43.58,92.2L43.58,92.2z M63.71,61.78l-12.64-1.19l10.48-22.96h14.33l-8.13,13.17l14.62,1.62L55.53,84.64L63.71,61.78L63.71,61.78z M51.98,0h34.5 c2.17,0,3.95,1.78,3.95,3.95v5.98c0,2.17-1.78,3.95-3.95,3.95H76.3v5.03H62.16v-5.03H51.98c-2.17,0-3.95-1.78-3.95-3.95V3.95 C48.03,1.78,49.81,0,51.98,0L51.98,0z"></path></svg>;

    // Fallback till globala Lucide-ikoner om tillgängligt
    if (window.Icon) {
        return (
            <span className={`inline-flex items-center justify-center shrink-0 ${c}`}>
                <window.Icon name={name} size={s} />
            </span>
        );
    }
    return <span className={c}>•</span>;
};

// ==========================================
// KUND/FORDONS - PROFIL (Sidopanelen)
// ==========================================
const VehicleProfile = ({ v, highlightId, onClose, setView }) => {
    const [brand, setBrand] = React.useState(v.brand_manual || getBrand(v.model));
    const [specs, setSpecs] = React.useState({});
    const [histQ, setHistQ] = React.useState("");
    const [regCopied, setRegCopied] = React.useState(false);
    const [vinCopied, setVinCopied] = React.useState(false);
    const [showAllSpecs, setShowAllSpecs] = React.useState(false); // NEW: State för "Visa mer"
    const tStart = React.useRef(null);

    React.useEffect(() => {
        if (window.lucide) window.lucide.createIcons();
    }); 

    React.useEffect(() => {
        if (!v.regnr || !window.db) return;
        const u1 = window.db.collection('vehicleSpecs').doc(v.regnr).onSnapshot(d => {
            if (d.exists) {
                const data = d.data();
                if(data.brand_manual) setBrand(data.brand_manual);
                setSpecs({ ...(v.latestSpecs || {}), ...data }); 
            } else {
                if (v.latestSpecs) setSpecs(v.latestSpecs);
            }
        });
        return () => u1();
    }, [v.regnr]);

    React.useEffect(() => {
        const handleMessage = async (event) => {
            const fordonData = event.data;
            if (fordonData && ['Car.info_Extension', 'Oljemagasinet_Extension', 'Transportstyrelsen_Extension'].includes(fordonData.source)) {
                const specUpdates = {};
                if (fordonData.motorkod) specUpdates.engine = fordonData.motorkod;
                if (fordonData.oljevolym) specUpdates.oil = fordonData.oljevolym.toString().includes('l') ? fordonData.oljevolym : `${fordonData.oljevolym} l`;
                if (fordonData.miltal) specUpdates.mileage = fordonData.miltal;
                if (fordonData.årsmodell) specUpdates.year = fordonData.årsmodell;
                if (fordonData.vin) specUpdates.vin = fordonData.vin;
                if (fordonData.bilmodell) specUpdates.model = fordonData.bilmodell;
                
                if (Object.keys(specUpdates).length > 0) {
                    specUpdates.updatedAt = new Date().toISOString();
                    setSpecs(prev => ({ ...prev, ...specUpdates }));
                }
            }
        };
        window.addEventListener('message', handleMessage);
        return () => window.removeEventListener('message', handleMessage);
    }, [v.regnr]);

    const changeBrand = (e) => {
        const val = e.target.value;
        setBrand(val);
        window.db && window.db.collection('vehicleSpecs').doc(v.regnr).set({ brand_manual: val }, { merge: true });
    };

    const saveSpec = (id, val) => {
        if(!window.db) return;
        window.db.collection('vehicleSpecs').doc(v.regnr).set({ [id]: val, updatedAt: new Date().toISOString() }, { merge: true });
    };

    const copyRegClick = () => {
        if(navigator.clipboard) {
            navigator.clipboard.writeText(v.regnr);
            setRegCopied(true);
            setTimeout(() => setRegCopied(false), 2000);
        }
    };

    const copyVinClick = () => {
        if(navigator.clipboard && specs.vin) {
            navigator.clipboard.writeText(specs.vin);
            setVinCopied(true);
            setTimeout(() => setVinCopied(false), 2000);
        }
    };

    const handleQuickLink = (e, textToCopy, url) => {
        e.stopPropagation();
        if (textToCopy && navigator.clipboard) navigator.clipboard.writeText(textToCopy);
        window.open(url, '_blank', 'noopener,noreferrer');
    };

    const handleTouchStart = (e) => { tStart.current = e.targetTouches[0].clientX; };
    const handleTouchEnd = (e) => {
        if (!tStart.current) return;
        const diff = e.changedTouches[0].clientX - tStart.current;
        if (diff > 60) onClose(); 
        tStart.current = null;
    };

    const filteredHistory = v.history.filter(j => {
        if (!histQ) return true;
        const q = histQ.toLowerCase();
        const cleanKommentar = stripHtml(j.kommentar || '').toLowerCase();
        return (j.kundnamn||'').toLowerCase().includes(q) || cleanKommentar.includes(q) || (j.datum||'').includes(q);
    }).sort((a, b) => {
        if (a.id === highlightId) return -1;
        if (b.id === highlightId) return 1;
        if (!a.datum && b.datum) return -1;
        if (a.datum && !b.datum) return 1;
        return (b.datum || '').localeCompare(a.datum || '');
    });

    return (
        <div className="fixed inset-0 z-[400] flex justify-end animate-in fade-in duration-300">
            {/* BACKDROP - Massivt djup */}
            <div className="absolute inset-0 bg-zinc-900/40 backdrop-blur-[2px] cursor-default" onClick={onClose}></div>
            
            {/* SIDEBAR - Anpassar sig till Ljust/Mörkt tema */}
            <div 
                onTouchStart={handleTouchStart} 
                onTouchEnd={handleTouchEnd} 
                className="relative w-full sm:w-[480px] h-full bg-zinc-50 dark:bg-slate-800 text-zinc-900 dark:text-slate-200 shadow-[-30px_0_60px_-15px_rgba(0,0,0,0.4)] flex flex-col animate-in slide-in-from-right duration-300 border-l border-zinc-200 dark:border-white/10"
            >
                {/* HEADER (Sticky) */}
                <div className="bg-white/95 dark:bg-slate-800/95 backdrop-blur-xl border-b border-zinc-200 dark:border-white/5 p-5 shrink-0 z-30 flex justify-between items-start relative overflow-hidden shadow-sm">
                    {/* Subtil glöd i toppen (syns mest i mörkt läge) */}
                    <div className="absolute top-0 right-0 w-64 h-64 bg-orange-500/5 dark:bg-orange-500/10 rounded-full blur-[80px] pointer-events-none"></div>

                    <div className="flex items-center gap-4 min-w-0 relative z-10">
                        <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-xl bg-zinc-100 dark:bg-[#1e293b] border border-zinc-200 dark:border-white/10 flex items-center justify-center relative overflow-hidden group shadow-sm shrink-0">
                            <select className="absolute inset-0 opacity-0 cursor-pointer z-30 w-full h-full" onChange={changeBrand} value={brand||""}>
                                <option value="">...</option>{Object.entries(BRANDS).map(([n,s])=><option key={s} value={s}>{n}</option>)}
                            </select>
                            {brand ? <img src={`https://cdn.simpleicons.org/${brand}`} className="w-6 h-6 sm:w-7 sm:h-7 object-contain z-10 opacity-80 dark:invert pointer-events-none"/> : <SafeIcon name="car" size={24} className="text-zinc-400 dark:text-slate-400 z-10"/>}
                            <div className="absolute inset-0 bg-white/80 dark:bg-black/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity z-20 pointer-events-none"><SafeIcon name="edit" size={16} className="text-orange-500 dark:text-white"/></div>
                        </div>
                        
                        <div className="flex flex-col justify-center min-w-0">
                            <div className="flex items-center gap-3 mb-1">
                                <h2 onClick={copyRegClick} className="text-2xl sm:text-3xl font-black font-mono tracking-tight uppercase leading-none text-zinc-900 dark:text-white cursor-pointer hover:text-orange-500 transition-colors drop-shadow-sm">
                                    {v.regnr}
                                </h2>
                                {regCopied && <span className="text-[9px] bg-emerald-100 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/30 px-2 py-0.5 rounded-md font-bold tracking-widest uppercase animate-in fade-in zoom-in">Kopierad</span>}
                            </div>
                            <span className="text-[11px] font-bold text-zinc-500 dark:text-slate-300 uppercase tracking-widest truncate w-full">
                                {specs.model || v.model || 'Okänd Modell'}
                            </span>
                            {v.customer && v.customer !== 'Okänd' && (
                                <span className="text-[10px] font-medium text-zinc-400 dark:text-slate-500 uppercase tracking-wider mt-0.5 truncate w-full flex items-center">
                                    <SafeIcon name="user" size={10} className="mr-1.5 opacity-70" />
                                    {v.customer}
                                </span>
                            )}
                        </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0 relative z-10">
                        <button onClick={()=>setView('NEW_JOB',{prefillRegnr:v.regnr})} title="Nytt arbete" className="w-9 h-9 flex items-center justify-center rounded-xl bg-orange-50 hover:bg-orange-100 dark:bg-orange-500/10 dark:hover:bg-orange-500/20 text-orange-500 dark:text-orange-400 border border-transparent hover:border-orange-200 dark:hover:border-orange-500/30 transition-all active:scale-95">
                            <SafeIcon name="plus" size={16} />
                        </button>
                        <button onClick={onClose} title="Stäng" className="w-9 h-9 flex items-center justify-center rounded-xl bg-zinc-100 hover:bg-zinc-200 dark:bg-white/5 dark:hover:bg-white/10 text-zinc-600 dark:text-slate-300 hover:text-zinc-900 dark:hover:text-white border border-transparent hover:border-zinc-300 dark:hover:border-white/20 transition-all active:scale-95">
                            <SafeIcon name="x" size={16} />
                        </button>
                    </div>
                </div>

                {/* SCROLLBART INNEHÅLL */}
                <div className="flex-1 overflow-y-auto custom-scrollbar relative">
                    
                    {/* Sektion: Teknisk Data (Visa Mer-funktion) */}
                    <div className="p-4 sm:p-5 space-y-3">
                        <div className="grid grid-cols-2 gap-2.5">
                            {/* Alltid synliga */}
                            <StatCard icon="cpu" label="Motorkod" val={specs.engine} />
                            <StatCard icon="droplet" label="Oljevolym" val={specs.oil} />
                            
                            {/* Fälls ut vid "Visa mer" */}
                            {showAllSpecs && (
                                <>
                                    <StatCard icon="calendar" label="Årsmodell" val={specs.year} />
                                    <StatCard icon="navigation" label="Miltal" val={specs.mileage} />
                                    <StatCard icon="activity" label="Status" val={specs.ts_status || '-'} highlight={(specs.ts_status||'').toLowerCase().includes('avställd')} />
                                    <StatCard icon="check-circle" label="Besiktigad" val={specs.ts_inspection || '-'} />
                                    <StatCard icon="settings" label="Växellåda" val={specs.ts_gearbox || '-'} />
                                    <StatCard icon="zap" label="Drivmedel" val={specs.ts_fuel || '-'} />
                                </>
                            )}
                        </div>

                        {/* Terminal-VIN (Alltid synlig, anpassad för ljust/mörkt) */}
                        <div 
                            onClick={copyVinClick}
                            title="Kopiera Chassinummer"
                            className={`group cursor-pointer rounded-xl p-3.5 sm:p-4 flex items-center justify-between transition-all duration-500 relative overflow-hidden ${vinCopied ? 'bg-emerald-50 dark:bg-emerald-500/20 ring-1 ring-emerald-500/60' : 'bg-white dark:bg-slate-900/40 ring-1 ring-zinc-200 dark:ring-white/10 hover:bg-zinc-50 dark:hover:bg-slate-900/60 shadow-sm'}`}
                        >
                            <div className="absolute inset-0 opacity-[0.02] dark:opacity-[0.03] bg-[radial-gradient(#000_1px,transparent_1px)] dark:bg-[radial-gradient(#fff_1px,transparent_1px)] [background-size:8px_8px] pointer-events-none"></div>
                            <div className={`absolute inset-0 bg-gradient-to-r from-transparent via-emerald-400/10 to-transparent translate-x-[-100%] transition-transform duration-700 ${vinCopied ? 'translate-x-[100%]' : ''}`}></div>
                            
                            <div className="flex flex-col min-w-0 relative z-10">
                                <span className="text-[8px] font-black uppercase tracking-widest text-zinc-500 dark:text-slate-400 mb-1 flex items-center gap-1.5">
                                    <SafeIcon name="fingerprint" size={10} /> CHASSINUMMER (VIN)
                                </span>
                                <span className={`font-mono text-[13px] sm:text-[14px] font-medium tracking-[0.25em] truncate transition-colors ${vinCopied ? 'text-emerald-600 dark:text-emerald-400' : specs.vin ? 'text-zinc-900 dark:text-slate-200 group-hover:text-orange-500' : 'text-zinc-400 dark:text-slate-500'}`}>
                                    {vinCopied ? 'KOPIERAD!' : (specs.vin || 'SAKNAS')}
                                </span>
                            </div>
                            <div className={`shrink-0 relative z-10 transition-all duration-300 ${vinCopied ? 'text-emerald-500 scale-110' : specs.vin ? 'text-zinc-400 dark:text-slate-400 group-hover:text-orange-500' : 'opacity-0'}`}>
                                <SafeIcon name={vinCopied ? "check" : "copy"} size={16} />
                            </div>
                        </div>

                        {/* Visa mer/mindre knapp */}
                        <button 
                            onClick={() => setShowAllSpecs(!showAllSpecs)}
                            className="w-full py-1.5 flex justify-center items-center gap-2 text-[9px] font-bold uppercase tracking-widest text-zinc-500 hover:text-orange-500 dark:text-slate-400 dark:hover:text-orange-400 transition-colors"
                        >
                            {showAllSpecs ? 'Göm specifikationer' : 'Visa mer fordonsdata'}
                            <SafeIcon name={showAllSpecs ? "chevron-up" : "chevron-down"} size={12} />
                        </button>

                        {/* --- INFLYTTAD ACTION HUB --- */}
                        <div className="pt-4 mt-2 border-t border-zinc-200 dark:border-white/5 space-y-2">
                            <div className="grid grid-cols-4 gap-1.5 sm:gap-2">
                                <button onClick={() => window.osSearchVehicle && window.osSearchVehicle(v.regnr, 'START_TS_RADAR', true)} className="h-10 flex items-center justify-center gap-1.5 bg-zinc-100 dark:bg-slate-700/40 hover:bg-purple-50 dark:hover:bg-purple-500/15 text-zinc-600 dark:text-slate-300 hover:text-purple-600 dark:hover:text-purple-300 border border-zinc-200 dark:border-white/5 hover:border-purple-300 dark:hover:border-purple-500/30 rounded-xl text-[9px] font-bold uppercase tracking-widest transition-all group">
                                    <SafeIcon name="shield" size={12} className="text-purple-500 dark:text-purple-400 group-hover:rotate-180 transition-transform duration-500" /> TS
                                </button>
                                <button onClick={() => window.osSearchVehicle && window.osSearchVehicle(v.regnr, 'START_OS_RADAR', true)} className="h-10 flex items-center justify-center gap-1.5 bg-zinc-100 dark:bg-slate-700/40 hover:bg-orange-50 dark:hover:bg-orange-500/15 text-zinc-600 dark:text-slate-300 hover:text-orange-600 dark:hover:text-orange-300 border border-zinc-200 dark:border-white/5 hover:border-orange-300 dark:hover:border-orange-500/30 rounded-xl text-[9px] font-bold uppercase tracking-widest transition-all group">
                                    <SafeIcon name="droplet" size={12} className="text-orange-500 dark:text-orange-400 group-hover:rotate-180 transition-transform duration-500" /> Olja
                                </button>
                                <button onClick={(e) => handleQuickLink(e, v.regnr, 'https://www.oljemagasinet.se/')} className="h-10 flex items-center justify-center gap-1.5 bg-zinc-100 dark:bg-slate-700/40 hover:bg-blue-50 dark:hover:bg-blue-500/15 text-zinc-600 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-300 border border-zinc-200 dark:border-white/5 hover:border-blue-300 dark:hover:border-blue-500/30 rounded-xl text-[9px] font-bold uppercase tracking-widest transition-all group">
                                    <SafeIcon name="external-link" size={12} className="text-blue-500 dark:text-blue-400 group-hover:scale-110 transition-transform" /> <span className="hidden sm:inline">Oljemag.</span><span className="sm:hidden">OM</span>
                                </button>
                                <button onClick={(e) => handleQuickLink(e, specs.vin || v.regnr, 'https://superetka.com/etka')} className="h-10 flex items-center justify-center gap-1.5 bg-zinc-100 dark:bg-slate-700/40 hover:bg-zinc-200 dark:hover:bg-white/10 text-zinc-700 dark:text-slate-300 hover:text-black dark:hover:text-white border border-zinc-200 dark:border-white/5 hover:border-zinc-300 dark:hover:border-white/20 rounded-xl text-[9px] font-bold uppercase tracking-widest transition-all group">
                                    <img src="https://www.etka.com/etkaportal/static/icons/logo.5feba87b.svg" alt="ETKA" className="h-3 opacity-60 dark:opacity-70 group-hover:opacity-100 group-hover:scale-110 transition-all dark:invert-0 invert" /> ETKA
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Sektion: Historik Tidslinje (Full bredd, minskad luft) */}
                    <div className="px-3 sm:px-5 pb-24">
                        
                        <div className="sticky top-0 bg-zinc-50/95 dark:bg-slate-800/95 backdrop-blur-md z-20 py-3 mb-2 flex items-center justify-between border-b border-zinc-200 dark:border-white/5">
                            <div className="text-[10px] font-black text-zinc-500 dark:text-slate-400 uppercase tracking-[0.15em] flex items-center gap-1.5 pl-2 sm:pl-0">
                                <SafeIcon name="clock" size={12} className="text-orange-500 dark:text-orange-400" /> Historik
                            </div>
                            
                            <div className="relative group w-32 sm:w-40">
                                <input 
                                    type="text" 
                                    placeholder="SÖK I HISTORIK..." 
                                    value={histQ}
                                    onChange={(e) => setHistQ(e.target.value)}
                                    className="w-full bg-white dark:bg-slate-900/50 border border-zinc-200 dark:border-white/10 rounded-lg py-1.5 pl-7 pr-3 text-[9px] font-bold text-zinc-900 dark:text-white uppercase tracking-widest outline-none focus:border-orange-500 shadow-sm transition-all"
                                />
                                <SafeIcon name="search" size={10} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-zinc-400 dark:text-slate-500 group-focus-within:text-orange-500 transition-colors" />
                            </div>
                        </div>

                        {filteredHistory.length > 0 ? (
                            <div className="mt-3 flex flex-col ml-0 sm:ml-1"> {/* Tillsammans med TimelineItem bygger detta den perfekta linjen */}
                                {filteredHistory.map((j, idx) => (
                                    <TimelineItem 
                                        key={j.id || idx} 
                                        j={j} 
                                        isHighlighted={j.id === highlightId} 
                                        isLast={idx === filteredHistory.length - 1} 
                                        setView={setView}
                                        onClose={onClose}
                                    />
                                ))}
                            </div>
                        ) : (
                            <div className="py-12 text-center flex flex-col items-center">
                                <div className="w-12 h-12 bg-white dark:bg-white/5 rounded-full flex items-center justify-center mb-3 shadow-sm border border-zinc-200 dark:border-transparent">
                                    <SafeIcon name="inbox" size={20} className="text-zinc-400 dark:text-slate-600" />
                                </div>
                                <span className="text-[11px] font-bold uppercase tracking-widest text-zinc-400 dark:text-slate-500">Ingen historik hittades</span>
                            </div>
                        )}
                    </div>
                </div>
                
                {/* STICKY BOTTOM ACTION BAR (Ligger alltid i botten) */}
                <div className="p-4 sm:p-5 border-t border-zinc-200 dark:border-white/5 bg-white/95 dark:bg-slate-800/95 backdrop-blur-xl shrink-0 z-30 shadow-[0_-10px_20px_rgba(0,0,0,0.05)]">

                    {/* Rad 2: Smart Sök */}
                    <button 
                        onClick={() => window.osSearchVehicle && window.osSearchVehicle(v.regnr.trim(), 'SMART_SEARCH')}
                        className="w-full bg-orange-50 dark:bg-white/5 border border-orange-200 dark:border-orange-500/20 py-3 rounded-xl flex items-center justify-center gap-2 hover:border-orange-400 dark:hover:border-orange-500/40 hover:bg-orange-100 dark:hover:bg-orange-500/10 text-orange-600 dark:text-orange-400 transition-all group shadow-sm active:scale-95 min-w-0"
                    >
                        <SafeIcon name="zap" size={16} className="text-orange-500 group-hover:scale-110 transition-transform shrink-0" />
                        <span className="text-[11px] font-black uppercase tracking-widest truncate">Smart Sökning</span>
                    </button>
                </div>

            </div>
        </div>
    );
};

// ==========================================
// HUVUDVY GARAGE (Listan)
// ==========================================
window.GarageView = ({ allJobs, setView }) => {
    const [q, setQ] = React.useState("");
    const [filter, setFilter] = React.useState('ALL');
    const [sel, setSel] = React.useState(null);
    const [bMap, setBMap] = React.useState({});
    const [visibleCount, setVisibleCount] = React.useState(20);

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

    React.useEffect(() => {
        const state = window.history.state;
        if (state && state.params && state.params.activeRegnr) {
            const vehicle = vs.find(v => v.regnr === state.params.activeRegnr);
            if (vehicle) {
                setSel(vehicle);
            } else {
                setSel({ regnr: state.params.activeRegnr, model: 'Sökt Fordon', customer: 'Okänd', history: [] });
            }
        }
    }, [vs]);

    const dVs = React.useMemo(() => {
        let r = vs;
        if(q) { const u = q.toUpperCase(); r = r.filter(v=>v.regnr.includes(u)||v.model.toUpperCase().includes(u)||v.customer.toUpperCase().includes(u)); }
        return filter==='RECENT' ? r.sort((a,b)=>b.lastVisit.localeCompare(a.lastVisit)) : filter==='TOP' ? r.sort((a,b)=>b.totalRevenue-a.totalRevenue) : r.sort((a,b)=>a.regnr.localeCompare(b.regnr));
    }, [vs, q, filter]);

    const visibleItems = dVs.slice(0, visibleCount);
    const hasMore = visibleCount < dVs.length;

    return (
        <div className="w-full">
            <div className="relative max-w-[1400px] w-full animate-in fade-in slide-in-from-left-4 duration-700 pb-12 ml-0">
                <div className="absolute top-0 left-[-10%] w-[60%] h-[400px] bg-orange-500/10 dark:bg-orange-500/5 blur-[120px] rounded-full pointer-events-none -z-10 hidden lg:block"></div>

                {/* HEADER */}
                <div className="flex flex-col md:flex-row md:items-end justify-between mb-5 gap-4 px-4 pt-5 lg:px-0 lg:pt-0">
                    <div className="flex items-center gap-4 md:gap-5">
                        <div className="relative group cursor-default shrink-0">
                            <div className="absolute inset-0 bg-orange-500/40 blur-lg rounded-full transition-all duration-700 group-hover:bg-orange-500/60" />
                            <div className="relative w-12 h-12 md:w-14 md:h-14 rounded-xl flex items-center justify-center text-white shadow-md border border-white/20 transition-colors bg-gradient-to-br from-orange-400 to-orange-600">
                                <SafeIcon name="car" size={24} />
                            </div>
                        </div>
                        <div className="flex flex-col">
                            <h1 className="text-2xl md:text-3xl font-black text-zinc-900 dark:text-white uppercase tracking-tight leading-none">
                                GARAGE<span className="text-zinc-400 dark:text-zinc-500 font-light">REGISTER</span>
                            </h1>
                            <p className="text-[10px] md:text-[11px] font-bold text-orange-500 dark:text-orange-400 uppercase tracking-widest mt-1 flex items-center gap-1.5">
                                <span className="w-1.5 h-1.5 rounded-full bg-orange-500 animate-pulse"></span>
                                Fordonsdatabas // Totalt: {vs.length} st
                            </p>
                        </div>
                    </div>

                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 lg:gap-4 z-10">
                        <div className="flex bg-white/90 dark:bg-[#182032]/90 p-1.5 border border-zinc-200/80 dark:border-white/5 rounded-2xl shadow-sm h-12">
                            {[{id:'ALL',l:'Alla',i:'car'},{id:'RECENT',l:'Senaste',i:'clock'},{id:'TOP',l:'Toppkunder',i:'trend'}].map(f => (
                                <button 
                                    key={f.id}
                                    onClick={() => setFilter(f.id)}
                                    className={`px-4 transition-all flex-1 sm:flex-none flex justify-center items-center gap-2 rounded-xl text-[10px] font-bold uppercase tracking-widest ${filter === f.id ? 'bg-zinc-100 dark:bg-[#2a3441] text-zinc-900 dark:text-white shadow-sm' : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-50 dark:hover:bg-white/5'}`}
                                >
                                    <SafeIcon name={f.i} size={14} className={filter === f.id ? "text-zinc-900 dark:text-white" : "text-zinc-500 dark:text-zinc-400"} /> 
                                    <span className="hidden sm:inline">{f.l}</span>
                                </button>
                            ))}
                        </div>

                        <div className="relative group h-12">
                            <input 
                                type="text" 
                                placeholder="SÖK REGNR, KUND..." 
                                className="h-full bg-white/90 dark:bg-[#182032]/90 border border-zinc-200/80 dark:border-white/5 focus:border-orange-500 p-3 pl-11 text-[12px] font-bold text-zinc-900 dark:text-white outline-none w-full md:w-64 transition-all uppercase tracking-widest placeholder:text-zinc-400 rounded-2xl shadow-sm"
                                value={q}
                                onChange={(e) => setQ(e.target.value)}
                            />
                            <SafeIcon name="search" size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400 group-focus-within:text-orange-500 transition-colors" />
                        </div>
                    </div>
                </div>

                {/* LISTAN (Tips 4 & 6 tillämpat) */}
                <div className="bg-white/90 dark:bg-[#182032]/90 lg:backdrop-blur-2xl rounded-2xl shadow-sm border border-zinc-200/80 dark:border-white/5 overflow-hidden flex flex-col mx-4 lg:mx-0 relative">
                    
                    {/* Sticky Header för listan (Tips 6) */}
                    <div className="hidden md:flex items-center px-6 py-4 bg-zinc-50/90 dark:bg-[#182032]/90 backdrop-blur-md sticky top-0 z-20 border-b border-zinc-200/80 dark:border-white/10 text-[9px] uppercase tracking-widest font-bold text-zinc-500 dark:text-zinc-400">
                        <div className="w-1/3 pl-1">Fordon</div>
                        <div className="w-1/4">Senaste Kund</div>
                        <div className="w-1/6">Senast Sedd</div>
                        <div className="w-1/4 text-right pr-6">Omsättning</div>
                    </div>

                    <div className="flex flex-col divide-y divide-zinc-100 dark:divide-white/5">
                        {dVs.length === 0 ? (
                            <div className="p-16 text-center text-zinc-400 uppercase tracking-widest text-[11px] font-bold">
                                <SafeIcon name="car" size={40} className="mb-4 opacity-20 mx-auto" />
                                Inga fordon hittades
                            </div>
                        ) : (
                            <>
                                {visibleItems.map((v) => {
                                    const b = bMap[v.regnr] || getBrand(v.model);
                                    return (
                                        <div 
                                            key={v.regnr} 
                                            onClick={()=>open(v)} 
                                            // Taktyl Hover-effekt (Tips 4)
                                            className="group flex flex-col md:flex-row md:items-center justify-between p-3 md:px-6 md:py-3.5 bg-transparent hover:bg-zinc-50 dark:hover:bg-white/[0.02] cursor-pointer transition-all duration-300 border-l-2 border-l-transparent hover:border-l-orange-500"
                                        >
                                            <div className="md:hidden flex items-center justify-between w-full gap-3">
                                                <div className="flex items-center gap-3 min-w-0">
                                                    <div className="w-10 h-10 rounded-xl bg-zinc-50 dark:bg-[#1a2235] flex items-center justify-center shrink-0 border border-zinc-200 dark:border-white/5 shadow-sm group-hover:border-orange-500/30 transition-colors">
                                                        {b ? <img src={`https://cdn.simpleicons.org/${b}`} className="w-5 h-5 object-contain opacity-70 dark:invert group-hover:opacity-100"/> : <SafeIcon name="car" size={16} className="text-zinc-400 group-hover:text-zinc-600 dark:group-hover:text-zinc-200"/>}
                                                    </div>
                                                    <div className="flex flex-col min-w-0">
                                                        <span className="font-mono font-black text-[15px] text-zinc-900 dark:text-white leading-none mb-1 truncate group-hover:text-orange-500 transition-colors">{v.regnr}</span>
                                                        <span className="text-[10px] font-bold text-zinc-500 dark:text-zinc-400 uppercase truncate">{v.model}</span>
                                                    </div>
                                                </div>
                                                <div className="flex flex-col items-end shrink-0">
                                                    <span className="font-mono font-black text-[14px] text-zinc-900 dark:text-white">{(v.totalRevenue/1000).toFixed(1)}k</span>
                                                    <span className="text-[9px] font-bold text-zinc-400 uppercase tracking-widest">{v.visitCount} Besök</span>
                                                </div>
                                            </div>

                                            <div className="hidden md:flex flex-row items-center w-full">
                                                <div className="flex items-center gap-4 w-1/3">
                                                    <div className="w-12 h-12 rounded-xl bg-zinc-50 dark:bg-[#121826] flex items-center justify-center shrink-0 border border-zinc-200/80 dark:border-white/10 shadow-sm group-hover:border-orange-500/30 transition-colors">
                                                        {b ? <img src={`https://cdn.simpleicons.org/${b}`} className="w-6 h-6 object-contain opacity-70 dark:invert group-hover:opacity-100 transition-opacity"/> : <SafeIcon name="car" size={20} className="text-zinc-400 group-hover:text-zinc-600 dark:group-hover:text-zinc-200"/>}
                                                    </div>
                                                    <div className="min-w-0 pr-4">
                                                        <div className="font-mono font-black text-[15px] text-zinc-900 dark:text-white group-hover:text-orange-500 transition-colors mb-0.5">{v.regnr}</div>
                                                        <div className="text-[11px] font-bold text-zinc-500 dark:text-zinc-400 uppercase truncate">{v.model}</div>
                                                    </div>
                                                </div>
                                                
                                                <div className="w-1/4">
                                                    <span className="text-[13px] font-black text-zinc-700 dark:text-zinc-300 uppercase truncate block pr-4">{v.customer}</span>
                                                </div>

                                                <div className="w-1/6">
                                                    <span className="text-[12px] font-mono font-bold text-zinc-500 dark:text-zinc-400">{v.lastVisit ? v.lastVisit.split('T')[0] : '-'}</span>
                                                </div>

                                                <div className="w-1/4 text-right pr-6 flex items-center justify-end gap-4 relative">
                                                    <span className="text-[16px] font-light tracking-tighter text-zinc-900 dark:text-white group-hover:scale-105 transition-transform origin-right">
                                                        {v.totalRevenue.toLocaleString()} <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-400">kr</span>
                                                    </span>
                                                    <div className="absolute right-0 opacity-0 group-hover:opacity-100 transition-all -translate-x-2 group-hover:translate-x-0">
                                                        <SafeIcon name="chevron-right" size={16} className="text-zinc-400 dark:text-zinc-500" />
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}

                                {hasMore && (
                                    <div className="flex justify-center p-6 border-t border-zinc-200 dark:border-white/5 bg-zinc-50/50 dark:bg-white/[0.01]">
                                        <button onClick={() => setVisibleCount(prev => prev + 20)} className="px-8 py-3.5 bg-white dark:bg-[#1a2235] border border-zinc-200 dark:border-white/10 hover:bg-zinc-50 dark:hover:bg-[#25324d] text-zinc-600 dark:text-zinc-300 hover:text-orange-500 text-[11px] font-bold uppercase tracking-widest rounded-xl shadow-sm transition-all active:scale-95 flex items-center gap-2">
                                            <SafeIcon name="refresh-cw" size={14} /> Visa fler fordon <span className="opacity-50">({dVs.length - visibleCount} kvar)</span>
                                        </button>
                                    </div>
                                )}
                            </>
                        )}
                    </div>
                </div>
            </div>

            {/* MODAL FÖR FORDONSAKT */}
            {sel && <VehicleProfile v={sel} onClose={close} setView={setView} />}
        </div>
    );
};

window.VehicleProfileLoader = ({ regnr, highlightId, onClose, setView }) => {
    const [d, setD] = React.useState(null);
    React.useEffect(() => {
        if(!regnr || !window.db) return;
        window.db.collection('jobs').where('regnr','==',regnr).get().then(s => {
            const j = s.docs.map(d=>({id:d.id,...d.data()})).filter(x=>!x.deleted).sort((a,b)=>(b.datum||'').localeCompare(a.datum||''));
            if(j.length){ 
                const l=j[0]; 
                setD({
                    regnr:regnr,
                    model:l.bilmodell||'Okänd',
                    customer:l.kundnamn||'Okänd',
                    lastVisit:l.datum,
                    visitCount:j.length,
                    totalRevenue:j.reduce((s,x)=>s+(parseInt(x.kundpris)||0),0),
                    history:j,
                    brand_manual:l.brand_manual,
                    latestSpecs: {
                        engine: l.motorkod || '',
                        oil: l.oljevolym ? (l.oljevolym.toString().includes('l') ? l.oljevolym : `${l.oljevolym} l`) : '',
                        mileage: l.miltal || '',
                        year: l.årsmodell || ''
                    }
                }); 
            }
            else setD({regnr:regnr,model:'Okänd',customer:'-',lastVisit:null,visitCount:0,totalRevenue:0,history:[],brand_manual:null});
        });
    }, [regnr]);
    return d ? <VehicleProfile v={d} highlightId={highlightId} onClose={onClose} setView={setView}/> : null;
};
