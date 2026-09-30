// garage.js - Premium UX (Dark Header + Widget Layout + Boxed History)

const BRANDS = { 'Volvo':'volvo', 'BMW':'bmw', 'Audi':'audi', 'VW':'volkswagen', 'Mercedes':'mercedes', 'Tesla':'tesla', 'Toyota':'toyota', 'Ford':'ford', 'Kia':'kia', 'Saab':'saab', 'Porsche':'porsche', 'Seat':'seat', 'Skoda':'skoda', 'Nissan':'nissan', 'Peugeot':'peugeot', 'Renault':'renault', 'Fiat':'fiat', 'Iveco':'iveco', 'Honda':'honda', 'Mazda':'mazda', 'Hyundai':'hyundai', 'Polestar':'polestar', 'Mini':'mini', 'Jeep':'jeep', 'Land Rover':'landrover', 'Subaru':'subaru', 'Suzuki':'suzuki', 'Lexus':'lexus', 'Chevrolet':'chevrolet', 'Citroen':'citroen', 'Opel':'opel', 'Dacia':'dacia', 'Mitsubishi':'mitsubishi', 'Jaguar':'jaguar', 'Dodge':'dodge', 'Ram':'ram', 'Cupra':'cupra' };

const getBrand = (t) => {
    if (!t) return null;
    const l = t.toLowerCase();
    for (const [n, s] of Object.entries(BRANDS)) if (l.includes(n.toLowerCase()) || l.includes(s)) return s;
    return (l.includes('merc') || l.includes('benz')) ? 'mercedes' : null;
};

// ==========================================
// TIMELINE ITEM (Kompakt & Proffsig)
// ==========================================
const TimelineItem = ({ j, isHighlighted, isLast, setView, onClose }) => {
    const isKlar = ['KLAR', 'FAKTURERAS'].includes(j.status);
    const isBokad = j.status === 'BOKAD';

    // Mjukare skuggor och finjusterade kantlinjer för en exklusivare känsla
    const cardClass = `relative bg-white dark:bg-slate-800 rounded-xl p-3.5 sm:p-4 transition-all duration-300 border cursor-pointer group hover:shadow-lg hover:shadow-slate-200/40 dark:hover:shadow-none ${
        isHighlighted || isBokad 
        ? 'border-orange-300 dark:border-orange-500/50 shadow-sm hover:border-orange-400 hover:-translate-y-0.5' 
        : 'border-slate-100 dark:border-white/10 hover:border-slate-300 dark:hover:border-white/20 hover:-translate-y-0.5'
    }`;

    return (
        <div className="relative pl-5 sm:pl-7 pb-3.5">
            {/* Tidslinjen - Supertunn (1.5px) och subtil */}
            {!isLast && (
                <div className="absolute left-[7px] sm:left-[11px] top-[24px] bottom-[-16px] w-[1.5px] bg-slate-200 dark:bg-slate-700/50 z-0"></div>
            )}
            
            {/* Pricken - Återställd till liten, skarp (w-2 h-2) med tunn vit ring */}
            <div className="absolute left-[4px] sm:left-[8px] top-[24px] flex items-center justify-center bg-white dark:bg-slate-900 py-1 z-10">
                {isHighlighted || isBokad ? (
                    <div className="w-2 h-2 rounded-full bg-orange-500 ring-2 ring-orange-100 dark:ring-orange-900 shadow-sm"></div>
                ) : (
                    <div className={`w-2 h-2 rounded-full ${isKlar ? 'bg-emerald-400' : 'bg-slate-300 dark:bg-slate-600'} ring-2 ring-white dark:ring-slate-900 shadow-sm`}></div>
                )}
            </div>

            {/* Kortet */}
            <div 
                onClick={() => {
                    setView('NEW_JOB', { job: j });
                    if (window.innerWidth < 1024) onClose();
                }} 
                className={cardClass}
            >
                {/* Rad 1: Datum och Status */}
                <div className="flex justify-between items-center mb-2">
                    <div className="flex items-center gap-1.5 text-slate-400 dark:text-slate-500">
                        <SafeIcon name="calendar" size={12} className="opacity-80" />
                        <span className="font-semibold text-[10px] sm:text-[11px] tracking-widest uppercase mt-0.5">
                            {j.datum ? j.datum.split('T')[0] : 'Inväntar'}
                        </span>
                    </div>
                    {window.Badge ? <window.Badge status={j.status} /> : (
                        <span className={`text-[8px] font-black uppercase tracking-widest px-2 py-0.5 rounded flex items-center gap-1 shadow-sm border ${
                            isKlar ? 'bg-emerald-50 text-emerald-600 border-emerald-100/50' : 
                            (isBokad ? 'bg-orange-50 text-orange-600 border-orange-100/50' : 'bg-slate-50 text-slate-500 border-slate-100')
                        }`}>
                            <span className={`w-1 h-1 rounded-full ${isKlar ? 'bg-emerald-500' : (isBokad ? 'bg-orange-500' : 'bg-slate-400')}`}></span>
                            {j.status}
                        </span>
                    )}
                </div>
                
                {/* Rad 2: Kundnamn och Pris på exakt samma baslinje */}
                <div className="flex justify-between items-baseline gap-3">
                    <h4 className="text-[13px] sm:text-[14px] font-bold text-slate-800 dark:text-white truncate group-hover:text-orange-500 transition-colors">
                        {j.kundnamn}
                    </h4>
                    
                    <div className="shrink-0 flex items-baseline gap-1">
                        <span className="font-mono text-[16px] sm:text-[18px] font-bold text-slate-800 dark:text-white tracking-tight group-hover:text-orange-500 transition-colors">
                            {parseInt(j.kundpris||0).toLocaleString()}
                        </span>
                        <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">
                            kr
                        </span>
                    </div>
                </div>

                {/* Rad 3: Kommentar underst, så den inte bråkar med priset på mobilen */}
                {j.kommentar && (
                    <p className="mt-1.5 text-[11px] sm:text-[12px] text-slate-500 dark:text-slate-400 line-clamp-2 leading-relaxed italic">
                        {stripHtml(j.kommentar)}
                    </p>
                )}
            </div>
        </div>
    );
};

window.VEHICLE_BRANDS = BRANDS;
window.getVehicleBrand = getBrand;

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

const formatModelName = (name) => {
    if(!name) return '';
    return name.replace(/SCÃ.NIC/ig, 'SCÉNIC')
               .replace(/Ã©/g, 'é').replace(/Ã„/g, 'Ä').replace(/Ã–/g, 'Ö')
               .replace(/Ã…/g, 'Å').replace(/Ã¤/g, 'ä').replace(/Ã¶/g, 'ö').replace(/Ã¥/g, 'å');
};

const SafeIcon = ({ name, size = 16, className = "" }) => {
    const s = size; const c = className;
    if (name === 'db') return <svg xmlns="http://www.w3.org/2000/svg" width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={c}><path d="M3 5c0-1.1 4.5-2 10-2s10 .9 10 2a2 2 0 0 1 0 .6l-8.3 4.7a3.5 3.5 0 0 1-3.4 0L3 5.6A2 2 0 0 1 3 5zm0 6c0-1.1 4.5-2 10-2s10 .9 10 2a2 2 0 0 1 0 .6l-8.3 4.7a3.5 3.5 0 0 1-3.4 0L3 11.6A2 2 0 0 1 3 11zm0 6c0-1.1 4.5-2 10-2s10 .9 10 2a2 2 0 0 1 0 .6l-8.3 4.7a3.5 3.5 0 0 1-3.4 0L3 17.6A2 2 0 0 1 3 17z"/></svg>;
    if (name === 'trend') return <svg xmlns="http://www.w3.org/2000/svg" width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={c}><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/></svg>;
    if (name === 'car') return <svg xmlns="http://www.w3.org/2000/svg" width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={c}><path d="M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9C18.7 10.6 16 10 16 10s-1.3-1.4-2.2-2.3c-.5-.4-1.1-.7-1.8-.7H7.7c-.7 0-1.3.3-1.8.7C5 8.6 3.7 10 3.7 10s-2.7.6-4.5 1.1C-.3 11.3 0 12.1 0 13v3c0 .6.4 1 1 1h2"/><circle cx="7" cy="17" r="2"/><circle cx="17" cy="17" r="2"/></svg>;
    if (name === 'oil') return <svg xmlns="http://www.w3.org/2000/svg" width={s} height={s} viewBox="0 0 24 24" fill="currentColor" stroke="none" className={c}><path fill="none" d="M0 0h24v24H0z"></path><path d="M8 5h11a1 1 0 0 1 1 1v15a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V11l4-6zm5-4h5a1 1 0 0 1 1 1v2h-7V2a1 1 0 0 1 1-1zM6 12v7h2v-7H6z"></path></svg>;

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
    const getLocalCache = (reg) => {
        try {
            const cache = JSON.parse(localStorage.getItem('os_vehicle_cache') || '{}');
            return cache[reg] || {};
        } catch(e) { return {}; }
    };

    const saveLocalCache = (reg, newData) => {
        try {
            const cache = JSON.parse(localStorage.getItem('os_vehicle_cache') || '{}');
            cache[reg] = { ...(cache[reg] || {}), ...newData };
            localStorage.setItem('os_vehicle_cache', JSON.stringify(cache));
        } catch(e) {}
    };

    const [brand, setBrand] = React.useState(v.brand_manual || getBrand(v.model));
    const [specs, setSpecs] = React.useState(() => {
        const local = getLocalCache(v.regnr);
        return { ...(v.latestSpecs || {}), ...local };
    });
    const [histQ, setHistQ] = React.useState("");
    const [regCopied, setRegCopied] = React.useState(false);
    const [vinCopied, setVinCopied] = React.useState(false);
    const [showAllSpecs, setShowAllSpecs] = React.useState(false);
    const [isScanningOEM, setIsScanningOEM] = React.useState(false);
    const [lagerItems, setLagerItems] = React.useState([]);
    const tStart = React.useRef({ x: 0, y: 0 });

    const isInspExpired = React.useMemo(() => {
        if (!specs.ts_inspection || specs.ts_inspection === '-') return false;
        return new Date(specs.ts_inspection) < new Date(new Date().setHours(0,0,0,0));
    }, [specs.ts_inspection]);

    React.useEffect(() => {
        if(window.db) {
            window.db.collection('lager').get().then(s => setLagerItems(s.docs.map(d=>({id:d.id, ...d.data()}))));
        }
    }, []);

    React.useEffect(() => {
        const handleOem = async (e) => {
            if(e.data && e.data.action === 'BMG_ETKA_RESULT') {
                const fetchedParts = e.data.data || [];
                const cleanReg = v.regnr.toUpperCase().replace(/\s+/g, '');
                if (cleanReg && fetchedParts.length > 0) {
                    window.db.collection('vehicleSpecs').doc(cleanReg).set({ oem_parts: fetchedParts }, { merge: true });
                    setSpecs(prev => ({ ...prev, oem_parts: fetchedParts }));
                }
                setIsScanningOEM(false);
            }
        };
        window.addEventListener('message', handleOem);
        return () => window.removeEventListener('message', handleOem);
    }, [v.regnr]);

    const scanLager = () => {
        if(!specs.vin) return alert("Hämta Chassinummer (VIN) först via Smart Sökning!");
        setIsScanningOEM(true);
        window.postMessage({ action: 'BMG_FETCH_ETKA', vin: specs.vin }, '*');
        setTimeout(() => setIsScanningOEM(false), 15000); 
    };

    React.useEffect(() => {
        if (window.lucide) window.lucide.createIcons();
    }); 

    const isValid = (val) => {
        if (val === null || val === undefined) return false;
        const s = String(val).trim();
        const u = s.toUpperCase();
        return s !== '' && u !== '-' && u !== 'SAKNAS' && u !== 'NULL';
    };

    const mergeValidSpecs = (currentSpecs, newSpecs) => {
        const merged = { ...currentSpecs };
        for (const [key, val] of Object.entries(newSpecs)) {
            if (isValid(val)) {
                merged[key] = val;
            } else if (!merged[key]) {
                merged[key] = val;
            }
        }
        return merged;
    };

    React.useEffect(() => {
        if (!v.regnr) return;
        const cleanReg = v.regnr.replace(/\s+/g, ''); 
        
        const localData = getLocalCache(cleanReg);
        if (Object.keys(localData).length > 0) {
            setSpecs(prev => mergeValidSpecs(prev, localData));
        }

        if (window.db) {
            const u1 = window.db.collection('vehicleSpecs').doc(cleanReg).onSnapshot(d => {
                if (d.exists) {
                    const data = d.data();
                    if(data.brand_manual) setBrand(data.brand_manual);
                    setSpecs(prev => {
                        const updated = mergeValidSpecs(prev, data);
                        saveLocalCache(cleanReg, updated);
                        return updated;
                    }); 
                }
            });
            return () => u1();
        }
    }, [v.regnr]);

    const changeBrand = (e) => {
        const val = e.target.value;
        setBrand(val);
        const cleanReg = v.regnr.replace(/\s+/g, '');
        window.db && window.db.collection('vehicleSpecs').doc(cleanReg).set({ brand_manual: val }, { merge: true });
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

    const handleTouchStart = (e) => { tStart.current = { x: e.targetTouches[0].clientX, y: e.targetTouches[0].clientY }; };
    
    const handleTouchEnd = (e) => {
        if (!tStart.current) return;
        const diffX = e.changedTouches[0].clientX - tStart.current.x;
        const diffY = e.changedTouches[0].clientY - tStart.current.y;
        if (diffX > 60 && Math.abs(diffX) > Math.abs(diffY)) onClose(); 
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
            {/* Mörk overlay */}
            <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm cursor-default" onClick={onClose}></div>
            
            {/* DRAWER (Hela rullar som ett dokument) */}
            <div 
                onTouchStart={handleTouchStart} 
                onTouchEnd={handleTouchEnd} 
                className="relative w-full sm:w-[480px] md:w-[560px] lg:w-[640px] h-full bg-zinc-50 dark:bg-slate-900 text-slate-900 dark:text-slate-200 shadow-[-10px_0_40px_rgba(0,0,0,0.5)] animate-in slide-in-from-right duration-300 overflow-y-auto custom-scroll"
            >
                {/* STÄNG/NYTT ARBETE KNAPPAR */}
                <div className="absolute top-5 right-5 flex gap-2 z-20">
                    <button onClick={()=>setView('NEW_JOB',{prefillRegnr:v.regnr})} title="Nytt arbete" className="w-9 h-9 md:w-10 md:h-10 bg-white/10 hover:bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center text-white transition border border-transparent hover:border-white/20 active:scale-95">
                        <SafeIcon name="plus" size={16} />
                    </button>
                    <button onClick={onClose} title="Stäng" className="w-9 h-9 md:w-10 md:h-10 bg-white/10 hover:bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center text-white transition border border-transparent hover:border-white/20 active:scale-95">
                        <SafeIcon name="x" size={16} />
                    </button>
                </div>

                {/* 1. MÖRK HEADER (Rullar med innehållet) */}
                <div className="bg-[#0f172a] text-white pt-6 pb-5 px-6 shadow-md relative z-10">
                    
                    {/* Logga & Fordonsinfo */}
                    <div className="flex items-start gap-4 mb-3 pr-20">
                        <div className="w-12 h-12 md:w-14 md:h-14 bg-white rounded-xl flex items-center justify-center text-yellow-500 shadow-lg shrink-0 relative group">
                            <select className="absolute inset-0 opacity-0 cursor-pointer z-30 w-full h-full" onChange={changeBrand} value={brand||""}>
                                <option value="">...</option>{Object.entries(BRANDS).map(([n,s])=><option key={s} value={s}>{n}</option>)}
                            </select>
                            {brand ? <img src={`https://cdn.simpleicons.org/${brand}`} className="w-7 h-7 md:w-8 md:h-8 object-contain z-10 text-black pointer-events-none"/> : <SafeIcon name="car" size={24} className="text-slate-400 z-10"/>}
                            <div className="absolute inset-0 bg-black/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity z-20 pointer-events-none rounded-xl"><SafeIcon name="edit" size={14} className="text-white"/></div>
                        </div>

                        <div className="min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                                <div onClick={copyRegClick} className="inline-block bg-yellow-400 hover:bg-yellow-300 text-black font-black px-2 py-0.5 rounded text-[16px] md:text-[18px] tracking-wider cursor-pointer transition-colors shadow-sm">
                                    {v.regnr}
                                </div>
                                {regCopied && <span className="text-[9px] bg-emerald-500 text-white px-1.5 py-0.5 rounded font-bold uppercase animate-in fade-in zoom-in">Kopierad</span>}
                            </div>
                            
                            <h1 className="font-medium text-[11px] md:text-xs text-slate-300 leading-tight uppercase truncate">
                                {formatModelName(specs.model || v.model || 'Okänd Modell')}
                            </h1>

                            {/* ÄGARE */}
                            {v.customer && v.customer !== 'Okänd' && (
                                <p className="text-white text-[13px] md:text-[14px] font-bold uppercase mt-1.5 flex items-center gap-1.5 truncate">
                                    <SafeIcon name="user" size={14} className="opacity-80" /> {v.customer}
                                </p>
                            )}
                        </div>
                    </div>

                    {/* Specifikationer inbyggda i headern (Med smarta Tooltips) */}
                    <div className="grid grid-cols-4 gap-y-4 gap-x-3 pt-5 mt-2 border-t border-slate-700/50">
                        {[
                            { label: 'Motorkod', value: specs.engine, color: 'text-white' },
                            { label: 'Oljevolym', value: specs.oil, color: 'text-white' },
                            { label: 'Årsmodell', value: specs.year, color: 'text-white' },
                            { label: 'Miltal', value: specs.mileage, color: 'text-white' },
                            { label: 'Status', value: specs.ts_status, color: (specs.ts_status||'').toLowerCase().includes('avställd') ? 'text-red-400' : 'text-emerald-400' },
                            { label: 'Besiktigad', value: specs.ts_inspection, color: isInspExpired ? 'text-red-400' : 'text-white' },
                            { label: '1:a Reg', value: specs.first_reg, color: 'text-white' },
                            { label: 'Växellåda', value: specs.ts_gearbox, color: 'text-white' }
                        ].map((spec, i) => (
                            <div key={i} className="relative group cursor-pointer min-w-0 outline-none" tabIndex="0">
                                <span className="block text-[10px] text-slate-400 font-semibold uppercase tracking-wider mb-1">{spec.label}</span>
                                <span className={`font-bold text-[13px] truncate block ${spec.color}`}>{spec.value || '-'}</span>
                                
                                {/* Interaktiv Tooltip (Visas vid hover på dator & klick på mobil) */}
                                {spec.value && String(spec.value).length > 7 && (
                                    <div className={`absolute z-[100] top-full mt-2 ${i % 4 >= 2 ? 'right-0' : 'left-0'} opacity-0 invisible group-hover:opacity-100 group-hover:visible group-focus:opacity-100 group-focus:visible bg-slate-800 text-white text-[12px] font-bold px-3 py-2 rounded-lg shadow-xl border border-slate-600 whitespace-nowrap transition-all pointer-events-none`}>
                                        {spec.value}
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>

                    {/* Drivmedel */}
                    {showAllSpecs && (
                        <div className="grid grid-cols-4 gap-3 pt-4 mt-4 border-t border-slate-700/50 animate-in slide-in-from-top-2 fade-in">
                            <div className="relative group cursor-pointer min-w-0 outline-none" tabIndex="0">
                                <span className="block text-[10px] text-slate-400 font-semibold uppercase tracking-wider mb-1">Drivmedel</span>
                                <span className="font-bold text-[13px] text-white truncate block">{specs.ts_fuel || '-'}</span>
                                
                                {specs.ts_fuel && String(specs.ts_fuel).length > 7 && (
                                    <div className="absolute z-[100] left-0 top-full mt-2 opacity-0 invisible group-hover:opacity-100 group-hover:visible group-focus:opacity-100 group-focus:visible bg-slate-800 text-white text-[12px] font-bold px-3 py-2 rounded-lg shadow-xl border border-slate-600 whitespace-nowrap transition-all pointer-events-none">
                                        {specs.ts_fuel}
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </div>

                {/* 2. CHASSINUMMER, LÄNKAR & OEM-DELAR */}
                <div className="bg-white dark:bg-slate-900 pb-4 shadow-sm border-b border-zinc-200 dark:border-white/5 relative z-10 px-6">
                    
                    {/* ENHETLIG VIN BOX */}
                    <div className="mt-4 mb-5">
                        {/* Rubrik utanför rutan för perfekt enhetlighet */}
                        <div className="text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400 mb-2 flex items-center gap-1.5 pl-1">
                            <SafeIcon name="fingerprint" size={14} className="text-orange-500" /> 
                            Chassinummer (VIN)
                        </div>
                        
                        {/* Själva datarutan */}
                        <div 
                            onClick={copyVinClick} 
                            className="flex justify-between items-center bg-white dark:bg-slate-800 border border-slate-200 dark:border-white/10 rounded-xl py-2.5 px-3 sm:px-4 group cursor-pointer hover:border-orange-300 dark:hover:border-orange-500/50 hover:shadow-sm transition-all shadow-sm"
                        >
                            <span className={`font-mono font-bold text-[15px] sm:text-[16px] tracking-[0.15em] leading-none ${vinCopied ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-900 dark:text-white group-hover:text-orange-600 transition-colors'}`}>
                                {vinCopied ? 'KOPIERAD!' : (specs.vin || 'SAKNAS')}
                            </span>
                            <div className={`p-1.5 sm:p-2 rounded-lg transition-all border ${vinCopied ? 'bg-emerald-50 border-emerald-200 text-emerald-600' : 'bg-slate-50 dark:bg-slate-700/50 border-slate-200 dark:border-white/10 text-slate-400 group-hover:text-orange-500 group-hover:bg-orange-50 group-hover:border-orange-200'}`}>
                                <SafeIcon name={vinCopied ? "check" : "copy"} size={14} />
                            </div>
                        </div>
                    </div>

                    {/* ENHETLIG OEM RESERVDELAR */}
                    {showAllSpecs && specs.oem_parts && specs.oem_parts.length > 0 && (
                        <div className="animate-in slide-in-from-top-2 fade-in duration-300 mb-2">
                            
                            {/* Rubrik utanför rutan för perfekt enhetlighet */}
                            <div className="text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400 mb-2 flex items-center gap-1.5 pl-1">
                                <SafeIcon name="layers" size={14} className="text-orange-500" /> 
                                OEM Reservdelar
                            </div>
                            
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 sm:gap-3">
                                {specs.oem_parts.map((p, i) => {
                                    const inStockItem = lagerItems.find(l => l.service_filter && l.service_filter.replace(/[^A-Z0-9]/ig, '') === p.oem);
                                    const qty = inStockItem ? parseInt(inStockItem.quantity || 0) : 0;
                                    
                                    return (
                                        <div key={i} className="flex justify-between items-center p-2.5 sm:p-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-white/10 rounded-xl hover:border-orange-300 dark:hover:border-orange-500/50 transition-all group shadow-sm hover:shadow-md cursor-default">
                                            
                                            <div className="flex flex-col gap-1.5 min-w-0 pr-2">
                                                <div className="flex items-center gap-2">
                                                    <span className="text-[9px] font-black uppercase tracking-wider text-slate-400 dark:text-slate-500 truncate">{p.name}</span>
                                                    
                                                    {/* Lager-indikator (Grön om > 0, Röd om 0) */}
                                                    {qty > 0 ? (
                                                        <span className="text-[8px] font-bold tracking-wider bg-emerald-50 text-emerald-700 border border-emerald-200 px-1.5 py-0.5 rounded whitespace-nowrap">
                                                            {qty} I LAGER
                                                        </span>
                                                    ) : (
                                                        <span className="text-[8px] font-bold tracking-wider bg-red-50 text-red-600 border border-red-100 px-1.5 py-0.5 rounded whitespace-nowrap">
                                                            0 I LAGER
                                                        </span>
                                                    )}
                                                </div>
                                                <span className="font-mono text-[14px] sm:text-[15px] font-bold text-slate-800 dark:text-slate-200 tracking-widest group-hover:text-orange-600 transition-colors truncate">{p.oem}</span>
                                            </div>
                                            
                                            {/* Kopiera-knapp som alltid syns */}
                                            <button 
                                                onClick={(e) => { 
                                                    e.stopPropagation(); 
                                                    navigator.clipboard.writeText(p.oem); 
                                                    alert(`Kopierade ${p.name}: ${p.oem}`); 
                                                }} 
                                                className="shrink-0 p-1.5 sm:p-2 rounded-lg bg-slate-50 dark:bg-slate-700/50 border border-slate-200 dark:border-white/10 text-slate-400 hover:text-orange-500 hover:bg-orange-50 hover:border-orange-200 transition-all outline-none active:scale-95"
                                                title="Kopiera reservdelsnummer"
                                            >
                                                <SafeIcon name="copy" size={14} />
                                            </button>
                                            
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}

                    {/* Toggle knapp med snyggt mellanrum ovanför */}
                    <button onClick={() => setShowAllSpecs(!showAllSpecs)} className="w-full text-center flex items-center justify-center gap-1.5 text-[10px] font-bold text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300 uppercase py-2 mt-4 mb-0 transition-colors outline-none tracking-widest">
                        {showAllSpecs ? 'Göm specifikationer & OEM' : 'Visa specifikationer & OEM'}
                        <SafeIcon name={showAllSpecs ? "chevron-up" : "chevron-down"} size={14} />
                    </button>
                </div>

                {/* 3. ÅTGÄRDSKNAPPAR OVANFÖR HISTORIK (Optimerad responsivitet) */}
                {/* 3. ÅTGÄRDSKNAPPAR OVANFÖR HISTORIK */}
                    <div className="px-4 sm:px-6 py-4 relative z-20">
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                            
                            <button 
                                onClick={(e) => {
                                    if (specs.vin) { navigator.clipboard.writeText(specs.vin); }
                                    handleQuickLink(e, specs.vin || v.regnr, 'https://superetka.com/etka');
                                }} 
                                className="col-span-1 h-12 flex items-center justify-center gap-1.5 sm:gap-2 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 border border-slate-200 dark:border-white/10 rounded-xl text-[9px] sm:text-[10px] font-bold uppercase tracking-widest transition-all shadow-sm hover:shadow-md active:scale-95 group"
                            >
                                <SafeIcon name="layers" size={14} className="opacity-70 group-hover:scale-110 transition-transform" /> 
                                <span className="hidden sm:inline">ETKA (VIN)</span><span className="sm:hidden">ETKA</span>
                            </button>

                            <button 
                                onClick={scanLager} 
                                disabled={isScanningOEM} 
                                className="col-span-1 h-12 flex items-center justify-center gap-1.5 sm:gap-2 bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-100 dark:hover:bg-emerald-500/20 border border-emerald-200 dark:border-emerald-500/20 rounded-xl text-[9px] sm:text-[10px] font-bold uppercase tracking-widest transition-all shadow-sm hover:shadow-md disabled:opacity-50 active:scale-95 group"
                            >
                                {isScanningOEM ? <SafeIcon name="loader-2" size={14} className="animate-spin" /> : <SafeIcon name="search" size={14} className="opacity-70 group-hover:scale-110" />} 
                                <span className="hidden sm:inline">SKANNA OEM</span><span className="sm:hidden">SKANNA</span>
                            </button>
                            
                            <div className="col-span-2 relative w-full">
                                {window.AutoSearchMenu ? (
                                    <window.AutoSearchMenu regnr={v.regnr} variant="full" />
                                ) : (
                                    <button onClick={() => window.osSearchVehicle && window.osSearchVehicle(v.regnr.trim(), 'SMART_SEARCH')} className="w-full h-12 flex items-center justify-center gap-2 bg-orange-500 hover:bg-orange-600 text-white rounded-xl text-[11px] font-black uppercase tracking-widest transition-all shadow-md hover:shadow-lg active:scale-95 group">
                                        <SafeIcon name="zap" size={16} className="group-hover:scale-110 transition-transform" /> HÄMTA FORDONSDATA
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>

                {/* 4. HISTORIK MED BOX-DESIGN */}
                <div className="px-4 sm:px-6 pb-24 relative z-10">
                    <div className="pb-3 mb-4 flex items-center justify-between border-b border-slate-200 dark:border-white/5">
                        <h3 className="text-[12px] font-black text-slate-800 dark:text-white uppercase tracking-wide flex items-center gap-1.5">
                            <SafeIcon name="clock" size={14} className="text-orange-500" />
                            Historik
                        </h3>
                        <div className="relative group">
                            <SafeIcon name="search" size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-orange-500 transition-colors z-10" />
                            <input 
                                type="text" 
                                placeholder="SÖK I HISTORIK..." 
                                value={histQ}
                                onChange={(e) => setHistQ(e.target.value)}
                                className="w-40 sm:w-56 bg-slate-100 dark:bg-slate-800/80 border border-transparent rounded-full text-[10px] uppercase font-bold tracking-widest py-2 pl-8 pr-3 text-slate-900 dark:text-white focus:outline-none focus:bg-white dark:focus:bg-slate-800 focus:border-orange-300 dark:focus:border-orange-500/50 focus:shadow-sm focus:ring-2 focus:ring-orange-500/10 transition-all placeholder:text-slate-400"
                            />
                        </div>
                    </div>

                    {filteredHistory.length > 0 ? (
                        <div className="flex flex-col relative mt-2">
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
                            <div className="w-12 h-12 bg-white dark:bg-slate-800 rounded-full flex items-center justify-center mb-3 border border-slate-200 dark:border-white/5 shadow-sm">
                                <SafeIcon name="inbox" size={20} className="text-slate-400 dark:text-slate-500" />
                            </div>
                            <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500 mb-4">Ingen historik sparad</span>
                            <button 
                                onClick={() => { setView('NEW_JOB', { prefillRegnr: v.regnr }); if (window.innerWidth < 1024) onClose(); }}
                                className="px-5 py-2 bg-orange-50 dark:bg-orange-500/10 text-orange-600 dark:text-orange-400 border border-orange-200 dark:border-orange-500/20 hover:bg-orange-100 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all active:scale-95 flex items-center gap-1.5 shadow-sm"
                            >
                                <SafeIcon name="plus" size={12} /> Skapa arbetsorder
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

// ==========================================
// KVARVARANDE KOD (VehicleProfileLoader & GarageView) ÄR EXAKT SOM DIN ORIGINALFIL
// ==========================================
window.VehicleProfileLoader = ({ regnr, highlightId, onClose, setView }) => {
    const [d, setD] = React.useState(null);

    React.useEffect(() => {
        if(!regnr || !window.db) return;

        let isMounted = true;

        window.db.collection('jobs').where('regnr','==',regnr).get().then(async (s) => {
            if (!isMounted) return;
            
            const j = s.docs.map(doc=>({id:doc.id,...doc.data()})).filter(x=>!x.deleted).sort((a,b)=>(b.datum||'').localeCompare(a.datum||''));
            
            let baseData = {
                regnr: regnr,
                model: 'Okänd',
                customer: '-',
                lastVisit: null,
                visitCount: 0,
                totalRevenue: 0,
                history: [],
                brand_manual: null,
                latestSpecs: {}
            };

            if(j.length){ 
                const l=j[0]; 
                baseData = {
                    ...baseData,
                    model: l.bilmodell || 'Okänd',
                    customer: l.kundnamn || 'Okänd',
                    lastVisit: l.datum,
                    visitCount: j.length,
                    totalRevenue: j.reduce((sum,x)=>sum+(parseInt(x.kundpris)||0),0),
                    history: j,
                    brand_manual: l.brand_manual,
                    latestSpecs: {
                        engine: l.motorkod || '',
                        oil: l.oljevolym ? (l.oljevolym.toString().includes('l') ? l.oljevolym : `${l.oljevolym} l`) : '',
                        mileage: l.miltal || '',
                        year: l.årsmodell || ''
                    }
                }; 
            }

            try {
                const cleanReg = regnr.replace(/\s+/g, '');
                const specDoc = await window.db.collection('vehicleSpecs').doc(cleanReg).get();
                if (specDoc.exists && isMounted) {
                    const specs = specDoc.data();
                    
                    if (specs.model) baseData.model = specs.model;
                    if (specs.brand_manual) baseData.brand_manual = specs.brand_manual;
                    
                    baseData.latestSpecs = {
                        ...baseData.latestSpecs,
                        engine: specs.engine || baseData.latestSpecs.engine || '',
                        oil: specs.oil || baseData.latestSpecs.oil || '',
                        mileage: specs.mileage || baseData.latestSpecs.mileage || '',
                        year: specs.year || baseData.latestSpecs.year || '',
                        vin: specs.vin || '',
                        first_reg: specs.first_reg || '',
                        ts_status: specs.ts_status || '',
                        ts_inspection: specs.ts_inspection || '',
                        ts_gearbox: specs.ts_gearbox || '',
                        ts_fuel: specs.ts_fuel || '',
                        oem_parts: specs.oem_parts || []
                    };
                }
            } catch (err) {
                console.error("Kunde inte hämta färsk vehicleSpecs data:", err);
            }

            if (isMounted) setD(baseData);
        });

        return () => { isMounted = false; };
    }, [regnr]);

    return d ? <VehicleProfile v={d} highlightId={highlightId} onClose={onClose} setView={setView}/> : null;
};

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
                                    className={`px-4 transition-all flex-1 sm:flex-none flex justify-center items-center gap-2 rounded-xl text-[10px] md:text-[11px] font-bold uppercase tracking-widest ${filter === f.id ? 'bg-zinc-100 dark:bg-[#2a3441] text-zinc-900 dark:text-white shadow-sm' : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-50 dark:hover:bg-white/5'}`}
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
                                className="h-full bg-white/90 dark:bg-[#182032]/90 border border-zinc-200/80 dark:border-white/5 focus:border-orange-500 p-4 pl-11 text-[12px] font-bold text-zinc-900 dark:text-white outline-none w-full md:w-64 transition-all uppercase tracking-widest placeholder:text-zinc-400 rounded-2xl shadow-sm"
                                value={q}
                                onChange={(e) => setQ(e.target.value)}
                            />
                            <SafeIcon name="search" size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400 group-focus-within:text-orange-500 transition-colors" />
                        </div>
                    </div>
                </div>

                <div className="bg-white/90 dark:bg-[#182032]/90 lg:backdrop-blur-2xl rounded-2xl shadow-sm border border-zinc-200/80 dark:border-white/5 overflow-hidden flex flex-col mx-4 lg:mx-0 relative">
                    
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

            {sel && <VehicleProfile v={sel} onClose={close} setView={setView} />}
        </div>
    );
};
