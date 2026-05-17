// garage.js

const BRANDS = { 'Volvo':'volvo', 'BMW':'bmw', 'Audi':'audi', 'VW':'volkswagen', 'Mercedes':'mercedes', 'Tesla':'tesla', 'Toyota':'toyota', 'Ford':'ford', 'Kia':'kia', 'Saab':'saab', 'Porsche':'porsche', 'Seat':'seat', 'Skoda':'skoda', 'Nissan':'nissan', 'Peugeot':'peugeot', 'Renault':'renault', 'Fiat':'fiat', 'Iveco':'iveco', 'Honda':'honda', 'Mazda':'mazda', 'Hyundai':'hyundai', 'Polestar':'polestar', 'Mini':'mini', 'Jeep':'jeep', 'Land Rover':'landrover', 'Subaru':'subaru', 'Suzuki':'suzuki', 'Lexus':'lexus', 'Chevrolet':'chevrolet', 'Citroen':'citroen', 'Opel':'opel', 'Dacia':'dacia', 'Mitsubishi':'mitsubishi', 'Jaguar':'jaguar', 'Dodge':'dodge', 'Ram':'ram', 'Cupra':'cupra' };

const getBrand = (t) => {
    if (!t) return null;
    const l = t.toLowerCase();
    for (const [n, s] of Object.entries(BRANDS)) if (l.includes(n.toLowerCase()) || l.includes(s)) return s;
    return (l.includes('merc') || l.includes('benz')) ? 'mercedes' : null;
};

// NYTT: Gör märkestolken tillgänglig globalt för Dashboarden!
window.VEHICLE_BRANDS = BRANDS;
window.getVehicleBrand = getBrand;

// Tar bort HTML från rich text-anteckningar
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

const SafeIcon = ({ name, size = 16, className = "" }) => {
    const s = size; const c = className;
    switch (name) {
        case 'x': return <svg xmlns="http://www.w3.org/2000/svg" width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className={c}><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>;
        case 'db': return <svg xmlns="http://www.w3.org/2000/svg" width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={c}><path d="M3 5c0-1.1 4.5-2 10-2s10 .9 10 2a2 2 0 0 1 0 .6l-8.3 4.7a3.5 3.5 0 0 1-3.4 0L3 5.6A2 2 0 0 1 3 5zm0 6c0-1.1 4.5-2 10-2s10 .9 10 2a2 2 0 0 1 0 .6l-8.3 4.7a3.5 3.5 0 0 1-3.4 0L3 11.6A2 2 0 0 1 3 11zm0 6c0-1.1 4.5-2 10-2s10 .9 10 2a2 2 0 0 1 0 .6l-8.3 4.7a3.5 3.5 0 0 1-3.4 0L3 17.6A2 2 0 0 1 3 17z"/></svg>;
        case 'search': return <svg xmlns="http://www.w3.org/2000/svg" width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={c}><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>;
        case 'plus': return <svg xmlns="http://www.w3.org/2000/svg" width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className={c}><path d="M5 12h14M12 5v14"/></svg>;
        case 'right': return <svg xmlns="http://www.w3.org/2000/svg" width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={c}><path d="m9 18 6-6-6-6"/></svg>;
        case 'chevron-right': return <svg xmlns="http://www.w3.org/2000/svg" width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={c}><polyline points="9 18 15 12 9 6"></polyline></svg>;
        case 'clock': return <svg xmlns="http://www.w3.org/2000/svg" width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={c}><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg>;
        case 'trend': return <svg xmlns="http://www.w3.org/2000/svg" width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={c}><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/></svg>;
        case 'edit': return <svg xmlns="http://www.w3.org/2000/svg" width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={c}><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>;
        case 'car': return <svg xmlns="http://www.w3.org/2000/svg" width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={c}><path d="M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9C18.7 10.6 16 10 16 10s-1.3-1.4-2.2-2.3c-.5-.4-1.1-.7-1.8-.7H7.7c-.7 0-1.3.3-1.8.7C5 8.6 3.7 10 3.7 10s-2.7.6-4.5 1.1C-.3 11.3 0 12.1 0 13v3c0 .6.4 1 1 1h2"/><circle cx="7" cy="17" r="2"/><circle cx="17" cy="17" r="2"/></svg>;
        case 'oil': return <svg xmlns="http://www.w3.org/2000/svg" width={s} height={s} viewBox="0 0 24 24" fill="currentColor" stroke="none" className={c}><path fill="none" d="M0 0h24v24H0z"></path><path d="M8 5h11a1 1 0 0 1 1 1v15a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V11l4-6zm5-4h5a1 1 0 0 1 1 1v2h-7V2a1 1 0 0 1 1-1zM6 12v7h2v-7H6z"></path></svg>;
        case 'eng': return <svg xmlns="http://www.w3.org/2000/svg" width={s} height={s} viewBox="0 -14.14 122.88 122.88" fill="currentColor" stroke="none" className={c}><path d="M43.58,92.2L31.9,80.53h-8.04c-2.81,0-5.11-2.3-5.11-5.11v-8.7h-4.87V76.9c0,2.17-1.78,3.95-3.95,3.95H3.95 C1.78,80.85,0,79.07,0,76.9V42.4c0-2.17,1.78-3.95,3.95-3.95h5.98c2.17,0,3.95,1.78,3.95,3.95v10.18h4.87v-9.36 c0-2.81,2.3-5.11,5.11-5.11h8.54l12.07-12.83c1.4-1.22,3.26-1.65,5.43-1.56h49.73c1.72,0.19,3.03,0.85,3.83,2.09 c0.8,1.22,0.67,1.91,0.67,3.28v23.49H109V42.4c0-2.17,1.78-3.95,3.95-3.95h5.98c2.17,0,3.95,1.78,3.95,3.95v34.5 c0,2.17-1.78,3.95-3.95,3.95h-5.98c-2.17,0-3.95-1.78-3.95-3.95V66.72h-4.87v0.92c0,2.73,0.08,4.38-1.66,6.64 c-0.33,0.43-0.7,0.84-1.11,1.22L83.53,92.96c-0.89,0.99-2.24,1.53-4.02,1.63h-30.4C46.84,94.49,44.99,93.71,43.58,92.2L43.58,92.2z M63.71,61.78l-12.64-1.19l10.48-22.96h14.33l-8.13,13.17l14.62,1.62L55.53,84.64L63.71,61.78L63.71,61.78z M51.98,0h34.5 c2.17,0,3.95,1.78,3.95,3.95v5.98c0,2.17-1.78,3.95-3.95,3.95H76.3v5.03H62.16v-5.03H51.98c-2.17,0-3.95-1.78-3.95-3.95V3.95 C48.03,1.78,49.81,0,51.98,0L51.98,0z"></path></svg>;
        case 'download': return <svg xmlns="http://www.w3.org/2000/svg" width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className={c}><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>;
        case 'calendar': return <svg xmlns="http://www.w3.org/2000/svg" width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={c}><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>;
        default: return <svg xmlns="http://www.w3.org/2000/svg" width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={c}><circle cx="12" cy="12" r="2" /></svg>;
    }
};

const VehicleProfile = ({ v, highlightId, onClose, setView }) => {
    const [brand, setBrand] = React.useState(v.brand_manual || getBrand(v.model));
    const [specs, setSpecs] = React.useState({});
    const [histQ, setHistQ] = React.useState("");
    const [regCopied, setRegCopied] = React.useState(false);
    const [vinCopied, setVinCopied] = React.useState(false);
    const tStart = React.useRef(null);

    // MAGIN: Tvingar ditt system att rita upp Lucide-ikoner i det nya fönstret!
    React.useEffect(() => {
        if (window.lucide) {
            window.lucide.createIcons();
        }
    }); // Körs efter varje uppdatering så ikonerna aldrig "tappas bort"

    // Ladda teknisk data
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

    // Lyssna på Chrome-tillägget (Uppdaterar live om radarn fångar data)
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
                    // Spara i bakgrunden (Hanteras primärt av radarn, men bra som säkerhet här)
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
        // Sök i den städade texten, inte i HTML-taggarna!
        const cleanKommentar = stripHtml(j.kommentar || '').toLowerCase();
        return (j.kundnamn||'').toLowerCase().includes(q) || cleanKommentar.includes(q) || (j.datum||'').includes(q);
    }).sort((a, b) => {
        // 1. Prioritet: Jobbet vi precis klickade in från i Dashboarden (highlightId) ska alltid ligga absolut högst upp
        if (a.id === highlightId) return -1;
        if (b.id === highlightId) return 1;
        
        // 2. Prioritet: Jobb som helt saknar datum (Oplanerade/Väntande) läggs näst högst upp
        if (!a.datum && b.datum) return -1;
        if (a.datum && !b.datum) return 1;
        
        // 3. Prioritet: Vanlig sortering där nyaste datumet ligger överst
        return (b.datum || '').localeCompare(a.datum || '');
    });

    return (
        <div className="fixed inset-0 z-[400] flex justify-end animate-in fade-in duration-200">
            
            <div className="absolute inset-0 bg-transparent cursor-default" onClick={onClose}></div>
            
            <div onTouchStart={handleTouchStart} onTouchEnd={handleTouchEnd} className="relative w-full sm:w-[500px] h-full bg-zinc-50 dark:bg-[#0f1522] shadow-2xl flex flex-col animate-in slide-in-from-right duration-300 border-l border-zinc-200 dark:border-white/10">
                
                {/* --- HEADER --- */}
                <div className="bg-white/90 dark:bg-[#182032]/90 backdrop-blur-xl text-zinc-900 dark:text-white shrink-0 relative overflow-hidden shadow-sm z-20 border-b border-zinc-200 dark:border-white/5 transition-colors">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-orange-500/10 rounded-full blur-[80px] pointer-events-none"></div>
                    
                    {/* Huvudinfo (Bil & Kund) - ÄNDRING: flex-1 min-w-0 fixar mobilkrysset! */}
                    <div className="flex justify-between items-start p-4 sm:p-6 pb-4 sm:pb-5 relative z-10">
                        <div className="flex items-center gap-3 sm:gap-5 flex-1 min-w-0 pr-2">
                            <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-zinc-100 dark:bg-[#1a2235] border border-zinc-200 dark:border-white/5 flex items-center justify-center relative overflow-hidden group shadow-sm hover:border-orange-500/50 transition-all shrink-0">
                                <select className="absolute inset-0 opacity-0 cursor-pointer z-30 w-full h-full text-black" onChange={changeBrand} value={brand||""}>
                                    <option value="">...</option>{Object.entries(BRANDS).map(([n,s])=><option key={s} value={s}>{n}</option>)}
                                </select>
                                {brand ? <img src={`https://cdn.simpleicons.org/${brand}`} className="w-6 h-6 sm:w-7 sm:h-7 object-contain z-10 opacity-80 dark:invert pointer-events-none"/> : <SafeIcon name="car" size={24} className="text-zinc-600 dark:text-zinc-400 z-10"/>}
                                <div className="absolute inset-0 bg-white/80 dark:bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity z-20 pointer-events-none"><SafeIcon name="edit" size={16} className="text-orange-500 dark:text-white"/></div>
                            </div>
                            
                            <div className="flex flex-col justify-center flex-1 min-w-0">
                                <div className="flex items-center gap-3">
                                    <h2 onClick={copyRegClick} className="text-2xl sm:text-3xl font-black font-mono tracking-tight uppercase leading-none text-zinc-900 dark:text-white cursor-pointer hover:text-orange-500 transition-colors">
                                        {v.regnr}
                                    </h2>
                                    {regCopied && (
                                        <span className="text-[9px] bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/20 px-2 py-0.5 rounded-md font-bold tracking-widest uppercase animate-in fade-in zoom-in">
                                            Kopierad
                                        </span>
                                    )}
                                </div>
                                <div className="flex flex-col mt-1 sm:mt-1.5 min-w-0">
                                    <span className="text-[11px] sm:text-[12px] font-bold text-zinc-600 dark:text-zinc-300 uppercase tracking-widest truncate w-full leading-tight">
                                        {specs.model || v.model || 'Okänd Modell'}
                                    </span>
                                    {v.customer && v.customer !== 'Okänd' && (
                                        <span className="text-[10px] font-medium text-zinc-400 dark:text-zinc-500 uppercase tracking-wider mt-0.5 truncate w-full flex items-center">
                                            <window.Icon name="user" size={10} className="inline-block mr-1.5 opacity-70" />
                                            {v.customer}
                                        </span>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* ÄNDRING: Krymper aldrig (shrink-0) så knapparna alltid får plats */}
                        <div className="flex items-center gap-2 shrink-0 pl-2">
                            <button onClick={()=>setView('NEW_JOB',{prefillRegnr:v.regnr})} title="Nytt arbete" className="w-9 h-9 sm:w-10 sm:h-10 flex items-center justify-center rounded-xl bg-orange-50 hover:bg-orange-100 dark:bg-orange-500/10 dark:hover:bg-orange-500/20 transition-all z-50 group text-orange-600 dark:text-orange-400 border border-transparent dark:hover:border-orange-500/30">
                                <window.Icon name="plus" size={18} className="transition-transform group-active:scale-90" />
                            </button>
                            <button onClick={onClose} title="Stäng" className="w-9 h-9 sm:w-10 sm:h-10 flex items-center justify-center rounded-xl bg-zinc-100 hover:bg-zinc-200 dark:bg-white/5 dark:hover:bg-white/10 transition-all z-50 text-zinc-800 dark:text-zinc-200 border border-transparent dark:hover:border-white/10">
                                <window.Icon name="x" size={18} className="text-zinc-800 dark:text-zinc-200" />
                            </button>
                        </div>
                    </div>

                    {/* Teknisk Data Grid */}
                    <div className="bg-zinc-50/50 dark:bg-black/20 border-t border-zinc-200 dark:border-white/5 px-4 py-3">
                        
                        <div className="grid grid-cols-3 gap-2 mb-2">
                            {/* ÄNDRING: Lade till focus: true för motorkod och oljevolym */}
                            {[
                                { id: 'year', label: 'Årsmodell', val: specs.year, ph: '2016', focus: false },
                                { id: 'engine', label: 'Motorkod', val: specs.engine, ph: 'CFGB', focus: true },
                                { id: 'oil', label: 'Oljevolym', val: specs.oil, ph: '4.7 l', focus: true }
                            ].map(f => {
                                const boxStyle = f.focus 
                                    ? 'bg-[#1e293b]/5 dark:bg-[#1e293b] border-orange-500/40 shadow-[inset_0_0_15px_rgba(249,115,22,0.05)] focus-within:border-orange-500 focus-within:bg-orange-50/50 dark:focus-within:bg-[#1a2235]' 
                                    : 'bg-white dark:bg-[#1a2235] border-zinc-200 dark:border-white/5 shadow-sm focus-within:border-orange-500';
                                
                                const labelStyle = f.focus 
                                    ? 'text-orange-600 dark:text-orange-400' 
                                    : 'text-zinc-500 dark:text-zinc-400';

                                return (
                                    <div key={f.id} className={`${boxStyle} border rounded-lg p-2 flex flex-col justify-center relative group transition-colors`}>
                                        <div className={`text-[8px] font-bold uppercase tracking-widest mb-0.5 ${labelStyle}`}>{f.label}</div>
                                        <input 
                                            type="text" 
                                            className="w-full text-[11px] font-bold text-zinc-900 dark:text-white bg-transparent outline-none placeholder:text-zinc-300 dark:placeholder:text-zinc-600 truncate"
                                            placeholder={f.ph}
                                            value={f.val || ''}
                                            onChange={(e) => setSpecs({...specs, [f.id]: e.target.value})}
                                            onBlur={(e) => saveSpec(f.id, e.target.value)}
                                        />
                                    </div>
                                );
                            })}
                        </div>
                            
                        <div className="grid grid-cols-3 gap-2">
                            <div className="col-span-2 bg-white dark:bg-[#1a2235] border border-zinc-200 dark:border-white/5 rounded-lg p-1.5 pl-2.5 shadow-sm flex items-center justify-between group focus-within:border-orange-500 transition-colors">
                                
                                {/* Vänster sida: Etikett och Inmatning */}
                                <div className="flex flex-col justify-center flex-1 min-w-0">
                                    <div className="text-[8px] font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-widest mb-0.5">
                                        Chassinummer (VIN)
                                    </div>
                                    <input 
                                        type="text" 
                                        className="w-full text-[12px] font-mono font-bold text-zinc-900 dark:text-white bg-transparent outline-none placeholder:text-zinc-300 dark:placeholder:text-zinc-600 tracking-[0.15em] uppercase"
                                        placeholder="WBA00000000000000"
                                        value={specs.vin || ''}
                                        onChange={(e) => setSpecs({...specs, vin: e.target.value.toUpperCase()})}
                                        onBlur={(e) => saveSpec('vin', e.target.value)}
                                    />
                                </div>

                                {/* Höger sida: Stor och alltid synlig kopiera-knapp */}
                                {specs.vin && (
                                    <button 
                                        onClick={copyVinClick}
                                        title="Kopiera VIN"
                                        className={`ml-2 shrink-0 h-[32px] px-3 flex items-center justify-center gap-1.5 rounded-md text-[9px] font-bold uppercase tracking-widest transition-all duration-300 active:scale-95
                                            ${vinCopied 
                                                ? 'bg-emerald-50 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400' 
                                                : 'bg-zinc-100 dark:bg-white/10 text-zinc-700 dark:text-zinc-300 hover:bg-orange-50 dark:hover:bg-orange-500/20 hover:text-orange-600 dark:hover:text-orange-400'
                                            }`}
                                    >
                                        <window.Icon name={vinCopied ? "check" : "copy"} size={12} />
                                        {vinCopied ? '' : ''}
                                    </button>
                                )}
                            </div>
                            
                            <div className="col-span-1 bg-white dark:bg-[#1a2235] border border-zinc-200 dark:border-white/5 rounded-lg p-2 shadow-sm flex flex-col justify-center group focus-within:border-orange-500 transition-colors">
                                <div className="text-[8px] font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-widest mb-0.5">
                                    Miltal
                                </div>
                                <input 
                                    type="text" 
                                    className="w-full text-[11px] font-bold text-zinc-900 dark:text-white bg-transparent outline-none placeholder:text-zinc-300 dark:placeholder:text-zinc-600 truncate"
                                    placeholder="12 500 mil"
                                    value={specs.mileage || ''}
                                    onChange={(e) => setSpecs({...specs, mileage: e.target.value})}
                                    onBlur={(e) => saveSpec('mileage', e.target.value)}
                                />
                            </div>
                        </div>
                    </div>
                </div>

                {/* --- CONTENT: HISTORIK --- */}
                <div className="flex-1 overflow-y-auto p-4 sm:p-6 pb-24 transition-colors">
                    <div className="space-y-4 animate-in fade-in duration-300 pb-20 relative">
                        
                        <div className="relative mb-6">
                            <input 
                                type="text" 
                                placeholder="SÖK I HISTORIK..." 
                                value={histQ}
                                onChange={(e) => setHistQ(e.target.value)}
                                className="w-full bg-white dark:bg-[#1a2235] text-zinc-900 dark:text-white border border-zinc-200 dark:border-white/5 rounded-xl p-3.5 pl-11 text-[12px] font-bold uppercase tracking-widest focus:outline-none focus:border-orange-500 shadow-sm transition-all"
                            />
                            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400 flex items-center justify-center pointer-events-none">
                                <window.Icon name="search" size={16} className="text-zinc-400"/>
                            </span>
                        </div>

                        <div className="relative border-l-2 border-zinc-200 dark:border-white/10 ml-4 space-y-6">
                            {filteredHistory.map((j, index) => {
                                const isHighlighted = j.id === highlightId;
                                const isLast = index === filteredHistory.length - 1;

                                return (
                                    <div key={j.id} className="relative pl-6 group">
                                        {/* Tidslinje-strecket */}
                                        {isHighlighted && (
                                            <div className="absolute bg-orange-500 z-0" style={{ left: '-2px', top: '16px', bottom: isLast ? '0' : '-24px', width: '2px' }}></div>
                                        )}
                                        {/* Tidslinje-punkten */}
                                        <div className={`absolute -left-[7px] top-4 w-3 h-3 rounded-full border-2 shadow-sm z-10 transition-colors ${isHighlighted ? 'bg-orange-500 border-white dark:border-[#0f1522]' : (['KLAR','FAKTURERAS'].includes(j.status)?'bg-emerald-500 border-white dark:border-[#0f1522]':'bg-zinc-300 dark:bg-zinc-600 border-white dark:border-[#0f1522]')}`}></div>

                                        <div 
                                            onClick={() => {
                                                setView('NEW_JOB', { job: j });
                                                if (window.innerWidth < 1024) onClose();
                                            }} 
                                            // ÄNDRING: Kompaktare padding (p-3.5), skuggor och en mjuk pop-effekt (scale) på det aktiva kortet
                                            className={`cursor-pointer rounded-2xl p-3.5 transition-all duration-300 relative z-10 ${
                                                isHighlighted 
                                                ? 'bg-white dark:bg-[#182032] border-2 border-orange-500 shadow-md scale-[1.02]' 
                                                : 'bg-white/80 dark:bg-[#1a2235]/80 border border-zinc-200/80 dark:border-white/5 hover:border-zinc-300 dark:hover:border-white/10 shadow-sm hover:shadow hover:-translate-y-px active:scale-95'
                                            }`}
                                        >
                                            {/* RAD 1: Datum & Status */}
                                            <div className="flex justify-between items-center mb-1.5">
                                                <div className={`flex items-center gap-1.5 font-mono text-[10px] font-bold uppercase tracking-widest ${isHighlighted ? 'text-orange-600 dark:text-orange-400' : 'text-zinc-500 dark:text-zinc-400'}`}>
                                                    <window.Icon name="calendar" size={10} className={isHighlighted ? "text-orange-500" : "text-zinc-400"} />
                                                    {j.datum ? j.datum.split('T')[0] : 'Inväntar'}
                                                </div>
                                                {window.Badge && <window.Badge status={j.status} />}
                                            </div>
                                            
                                            {/* RAD 2: Kundnamn & Pris */}
                                            <div className="flex justify-between items-end gap-3">
                                                <div className={`text-[13px] font-black uppercase tracking-tight truncate ${isHighlighted ? 'text-zinc-900 dark:text-white' : 'text-zinc-800 dark:text-zinc-200'}`}>
                                                    {j.kundnamn}
                                                </div>
                                                <div className={`font-mono text-[14px] font-black shrink-0 leading-none ${isHighlighted ? 'text-zinc-900 dark:text-white' : 'text-zinc-700 dark:text-zinc-300'}`}>
                                                    {parseInt(j.kundpris||0).toLocaleString()} <span className="text-[9px] text-zinc-400 dark:text-zinc-500 font-sans uppercase tracking-widest">kr</span>
                                                </div>
                                            </div>

                                            {/* RAD 3: Kommentar (Separerad och snygg) */}
                                            {j.kommentar && (
                                                <div className="mt-2.5 pt-2 border-t border-zinc-100 dark:border-white/5">
                                                    <p className={`text-[11px] leading-snug line-clamp-2 italic ${isHighlighted ? 'text-orange-800 dark:text-orange-200/80' : 'text-zinc-500 dark:text-zinc-400'}`}>
                                                        {stripHtml(j.kommentar)}
                                                    </p>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>
                
                {/* --- BOTTOM ACTION BAR: SMART SEARCH & MOBILE FALLBACK --- */}
                <div className="p-4 sm:p-5 border-t border-zinc-200 dark:border-[#1a2235] bg-zinc-50 dark:bg-[#121826] shrink-0 transition-colors z-20 flex gap-3">
                    
                    {/* SMART SÖKNING (flex-1 gör den lika bred som manuell-knappen på mobil) */}
                    <button 
                        onClick={() => {
                            if (window.osSearchVehicle) {
                                window.osSearchVehicle(v.regnr.trim(), 'SMART_SEARCH');
                            }
                        }}
                        className="flex-1 bg-white dark:bg-[#1a2235] border border-orange-500/30 dark:border-orange-500/20 py-3 rounded-xl flex items-center justify-center gap-2 hover:border-orange-400 dark:hover:border-orange-500 hover:text-orange-600 dark:hover:text-orange-400 transition-all group shadow-sm active:scale-95 text-orange-500 dark:text-orange-500 min-w-0"
                    >
                        <window.Icon name="zap" size={16} className="text-orange-500 group-hover:scale-110 transition-transform shrink-0" />
                        <span className="text-[10px] sm:text-[11px] font-black uppercase tracking-widest truncate">Smart Sök</span>
                    </button>

                    {/* ENBART MOBIL: Manuell sökning (flex-1) */}
                    <button 
                        onClick={() => {
                            if (navigator.clipboard) {
                                navigator.clipboard.writeText(v.regnr.trim());
                                setRegCopied(true);
                                setTimeout(() => setRegCopied(false), 2000);
                            }
                            window.open('https://www.oljemagasinet.se/', '_blank');
                        }}
                        className="flex sm:hidden flex-1 bg-white dark:bg-[#1a2235] border border-zinc-200 dark:border-white/5 py-3 rounded-xl items-center justify-center gap-2 active:scale-95 text-zinc-700 dark:text-zinc-300 shadow-sm min-w-0"
                    >
                        <img src="https://www.google.com/s2/favicons?domain=oljemagasinet.se" alt="O" className="w-3.5 h-3.5 rounded shrink-0 grayscale opacity-80" />
                        <span className="text-[10px] font-bold uppercase tracking-widest truncate">Manuell</span>
                    </button>

                </div>

            </div>
        </div>
    );
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

    // Lyssna om vi skickades hit från Spotlight!
    React.useEffect(() => {
        const state = window.history.state;
        if (state && state.params && state.params.activeRegnr) {
            const vehicle = vs.find(v => v.regnr === state.params.activeRegnr);
            if (vehicle) {
                setSel(vehicle);
            } else {
                // Om bilen inte fanns i Garage-listan, skapa en tillfällig profil för att visa historiken
                setSel({ regnr: state.params.activeRegnr, model: 'Sökt Fordon', customer: 'Okänd', history: [] });
            }
        }
    }, [vs]);

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

    const visibleItems = dVs.slice(0, visibleCount);
    const hasMore = visibleCount < dVs.length;

    return (
        <div className="w-full">
            <div className="relative max-w-5xl w-full animate-in fade-in slide-in-from-left-4 duration-700 pb-0 ml-0">
                <div className="absolute top-0 left-[-10%] w-[60%] h-[400px] bg-orange-500/10 dark:bg-orange-500/5 blur-[120px] rounded-full pointer-events-none -z-10 hidden lg:block"></div>

                {/* HEADER */}
                <div className="flex flex-col md:flex-row md:items-center justify-between mb-4 pb-4 border-b border-zinc-200 dark:border-white/5 gap-4 px-4 pt-5 lg:px-0 lg:pt-0">
                    <div className="flex items-center gap-4 md:gap-5">
                        <div className="relative group cursor-default shrink-0">
                            <div className="absolute inset-0 bg-orange-500/40 blur-xl rounded-full transition-all duration-700 group-hover:bg-orange-500/60" />
                            <div className="relative w-12 h-12 md:w-14 md:h-14 rounded-xl md:rounded-2xl flex items-center justify-center text-white shadow-xl border border-white/20 transition-colors bg-gradient-to-br from-orange-400 to-orange-600">
                                <SafeIcon name="car" size={24} className="text-white" />
                            </div>
                        </div>
                        <div className="flex flex-col">
                            <h1 className="text-2xl md:text-3xl font-black text-black dark:text-white uppercase tracking-tight leading-none drop-shadow-sm dark:drop-shadow-none">
                                GARAGE <span className="text-zinc-500 dark:text-zinc-500 font-light">REGISTER</span>
                            </h1>
                            <p className="text-[10px] md:text-[11px] font-bold text-orange-500 dark:text-orange-400 uppercase tracking-widest mt-1.5 flex items-center gap-2">
                                <span className="w-1.5 h-1.5 rounded-full bg-orange-500 animate-pulse"></span>
                                Fordonsdatabas // Totalt: {vs.length} st
                            </p>
                        </div>
                    </div>

                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 z-10">
                        <div className="flex bg-white dark:bg-[#1a2235] p-1 border border-zinc-200 dark:border-white/5 rounded-xl shadow-sm">
                            {[{id:'ALL',l:'Alla',i:'car'},{id:'RECENT',l:'Senaste',i:'clock'},{id:'TOP',l:'Toppkunder',i:'trend'}].map(f => (
                                <button 
                                    key={f.id}
                                    onClick={() => setFilter(f.id)}
                                    className={`py-2.5 px-4 transition-all flex-1 sm:flex-none flex justify-center items-center gap-2 rounded-lg text-[10px] font-bold uppercase tracking-widest ${filter === f.id ? 'bg-zinc-100 dark:bg-[#2a3441] text-zinc-900 dark:text-white shadow-sm' : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white'}`}
                                >
                                    <SafeIcon name={f.i} size={14} className={filter === f.id ? "text-zinc-900 dark:text-white" : "text-zinc-500 dark:text-zinc-400"} /> 
                                    <span className="hidden sm:inline">{f.l}</span>
                                </button>
                            ))}
                        </div>

                        <div className="relative group">
                            <input 
                                type="text" 
                                placeholder="SÖK REGNR, KUND..." 
                                className="bg-white/80 dark:bg-[#1a2235]/80 backdrop-blur-md border border-zinc-200/80 dark:border-white/10 focus:border-orange-500 p-3.5 pl-12 text-[12px] font-bold text-zinc-900 dark:text-white outline-none w-full md:w-64 transition-all uppercase tracking-widest placeholder:text-zinc-400 rounded-2xl shadow-sm"
                                value={q}
                                onChange={(e) => setQ(e.target.value)}
                            />
                            <SafeIcon name="search" size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400 group-focus-within:text-orange-500 transition-colors" />
                        </div>
                    </div>
                </div>

                {/* LISTAN */}
                <div className="bg-white/80 dark:bg-[#182032]/80 backdrop-blur-xl rounded-2xl shadow-sm border border-zinc-200/80 dark:border-white/5 overflow-hidden flex flex-col mx-4 lg:mx-2 mb-0">
                    
                    <div className="hidden md:flex items-center px-6 py-3 bg-zinc-50/50 dark:bg-black/20 border-b border-zinc-200 dark:border-white/10 text-[9px] uppercase tracking-widest font-bold text-zinc-500 dark:text-zinc-400">
                        <div className="w-1/3 pl-1">Fordon</div>
                        <div className="w-1/4">Senaste Kund</div>
                        <div className="w-1/6">Senast Sedd</div>
                        <div className="w-1/4 text-right pr-6">Omsättning</div>
                    </div>

                    <div className="flex flex-col divide-y divide-zinc-100 dark:divide-white/5">
                        {dVs.length === 0 ? (
                            <div className="p-12 text-center text-zinc-400 uppercase tracking-widest text-[11px] font-bold">
                                <SafeIcon name="car" size={32} className="mb-3 opacity-20 mx-auto text-zinc-400" />
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
                                            className="group flex flex-col md:flex-row md:items-center justify-between p-3 md:px-6 md:py-2.5 bg-transparent hover:bg-zinc-50 dark:hover:bg-[#1f2940] cursor-pointer transition-colors border-l-2 border-l-transparent hover:border-l-orange-500"
                                        >
                                            <div className="md:hidden flex items-center justify-between w-full gap-3">
                                                <div className="flex items-center gap-3 min-w-0">
                                                    <div className="w-9 h-9 rounded-full bg-zinc-50 dark:bg-[#1a2235] flex items-center justify-center shrink-0 border border-zinc-200 dark:border-white/5">
                                                        {b ? <img src={`https://cdn.simpleicons.org/${b}`} className="w-5 h-5 object-contain opacity-70 dark:invert"/> : <SafeIcon name="car" size={16} className="text-zinc-400"/>}
                                                    </div>
                                                    <div className="flex flex-col min-w-0">
                                                        <span className="font-mono font-black text-[14px] text-zinc-900 dark:text-white leading-none mb-1 truncate">{v.regnr}</span>
                                                        <span className="text-[10px] font-bold text-zinc-500 dark:text-zinc-400 uppercase truncate">{v.model}</span>
                                                    </div>
                                                </div>
                                                <div className="flex flex-col items-end shrink-0">
                                                    <span className="font-mono font-black text-[13px] text-zinc-900 dark:text-white">{(v.totalRevenue/1000).toFixed(1)}k</span>
                                                    <span className="text-[9px] font-bold text-zinc-400 uppercase tracking-widest">{v.visitCount} Besök</span>
                                                </div>
                                            </div>

                                            <div className="hidden md:flex flex-row items-center w-full">
                                                <div className="flex items-center gap-3 w-1/3">
                                                    <div className="w-8 h-8 rounded-full bg-zinc-50 dark:bg-[#1a2235] flex items-center justify-center shrink-0 border border-zinc-200 dark:border-white/5">
                                                        {b ? <img src={`https://cdn.simpleicons.org/${b}`} className="w-4 h-4 object-contain opacity-70 dark:invert group-hover:opacity-100 transition-opacity"/> : <SafeIcon name="car" size={14} className="text-zinc-400"/>}
                                                    </div>
                                                    <div>
                                                        <div className="font-mono font-black text-[13px] text-zinc-900 dark:text-white group-hover:text-orange-500 transition-colors">{v.regnr}</div>
                                                        <div className="text-[10px] font-bold text-zinc-500 dark:text-zinc-400 uppercase truncate max-w-[150px]">{v.model}</div>
                                                    </div>
                                                </div>
                                                
                                                <div className="w-1/4">
                                                    <span className="text-[12px] font-bold text-zinc-700 dark:text-zinc-300 uppercase truncate block pr-4">{v.customer}</span>
                                                </div>

                                                <div className="w-1/6">
                                                    <span className="text-[12px] font-mono font-medium text-zinc-500 dark:text-zinc-400">{v.lastVisit ? v.lastVisit.split('T')[0] : '-'}</span>
                                                </div>

                                                <div className="w-1/4 text-right pr-6 flex items-center justify-end gap-6">
                                                    <span className="text-[13px] font-mono font-black text-zinc-900 dark:text-white">{v.totalRevenue.toLocaleString()} kr</span>
                                                    <SafeIcon name="chevron-right" size={16} className="text-zinc-300 dark:text-zinc-600 opacity-0 group-hover:opacity-100 transition-all -translate-x-2 group-hover:translate-x-0" />
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}

                                {hasMore && (
                                    <div className="flex justify-center p-4 border-t border-zinc-200 dark:border-white/5 bg-zinc-50/30 dark:bg-white/[0.01]">
                                        <button onClick={() => setVisibleCount(prev => prev + 20)} className="px-6 py-2.5 bg-white dark:bg-[#1a2235] border border-zinc-200 dark:border-white/10 hover:bg-zinc-50 dark:hover:bg-white/5 text-zinc-600 dark:text-zinc-300 text-[11px] font-bold uppercase tracking-widest rounded-xl shadow-sm transition-colors flex items-center gap-2">
                                            Visa fler <span className="opacity-50">({dVs.length - visibleCount} kvar)</span>
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
                    // NYTT: Plocka upp historisk data från senaste jobbet!
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
