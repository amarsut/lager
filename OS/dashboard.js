// dashboard.js

const formatDate = (dateStr) => {
    if (!dateStr) return null;
    const targetDate = new Date(dateStr);
    const today = new Date();
    targetDate.setHours(0, 0, 0, 0);
    today.setHours(0, 0, 0, 0);
    const diffTime = targetDate - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    if (diffDays === 0) return "IDAG";
    if (diffDays === 1) return "IMORGON";
    if (diffDays === -1) return "IGÅR";
    if (diffDays >= 2 && diffDays <= 7) {
        const weekDays = ['SÖNDAG', 'MÅNDAG', 'TISDAG', 'ONSDAG', 'TORSDAG', 'FREDAG', 'LÖRDAG'];
        return weekDays[targetDate.getDay()];
    }
    const months = ['JAN', 'FEB', 'MAR', 'APR', 'MAJ', 'JUN', 'JUL', 'AUG', 'SEP', 'OKT', 'NOV', 'DEC'];
    return `${targetDate.getDate()} ${months[targetDate.getMonth()]}`;
};

// 2. PREMIUM STATUS BADGE
window.Badge = React.memo(({ status }) => {
    const s = (status || 'BOKAD').toUpperCase();
    const config = {
        'BOKAD': { bg: 'bg-orange-50/80 dark:bg-orange-500/10', text: 'text-orange-700 dark:text-orange-400', border: 'border-orange-200/60 dark:border-orange-500/20', dot: 'bg-orange-500 shadow-[0_0_8px_rgba(249,115,22,0.6)]' },
        'OFFERERAD': { bg: 'bg-blue-50/80 dark:bg-blue-500/10', text: 'text-blue-700 dark:text-blue-400', border: 'border-blue-200/60 dark:border-blue-500/20', dot: 'bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.6)]' },
        'KLAR': { bg: 'bg-emerald-50/80 dark:bg-emerald-500/10', text: 'text-emerald-700 dark:text-emerald-400', border: 'border-emerald-200/60 dark:border-emerald-500/20', dot: 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.6)]' },
        'FAKTURERAS': { bg: 'bg-zinc-100/80 dark:bg-white/5', text: 'text-zinc-600 dark:text-zinc-300', border: 'border-zinc-200/80 dark:border-white/10', dot: 'bg-zinc-400' },
    };
    const style = config[s] || config['BOKAD'];
    return (
        <span className={`h-[20px] px-2 text-[8px] font-bold uppercase tracking-widest inline-flex items-center justify-center gap-1 rounded-lg border backdrop-blur-sm transition-all duration-300 ${style.bg} ${style.text} ${style.border}`}>
            <span className={`w-1 h-1 rounded-full ${style.dot}`}></span>
            {s}
        </span>
    );
});

// --- WIDGET 3: LIVE VÄDERPROGNOS (SMHI SNOW1g) ---
window.WeatherWidget = React.memo(() => {
    const [weatherData, setWeatherData] = React.useState([]);
    const [loading, setLoading] = React.useState(true);
    const [error, setError] = React.useState(false);

    React.useEffect(() => {
        const lon = "13.3034";
        const lat = "55.8390";
        const url = `https://opendata-download-metfcst.smhi.se/api/category/snow1g/version/1/geotype/point/lon/${lon}/lat/${lat}/data.json`;

        const fetchWeather = async () => {
            try {
                const response = await fetch(url);
                if (!response.ok) throw new Error("Kunde inte ansluta till SMHI");
                const data = await response.json();
                
                const todayStr = new Date().toISOString().split('T')[0];
                const dailyData = [];
                const seenDays = new Set();
                
                data.timeSeries.forEach(entry => {
                    const dateStr = entry.time.split('T')[0];
                    const isNoon = entry.time.includes("12:00:00");
                    
                    if (!seenDays.has(dateStr)) {
                        if (dateStr === todayStr) {
                            dailyData.push(entry);
                            seenDays.add(dateStr);
                        } else if (isNoon) {
                            dailyData.push(entry);
                            seenDays.add(dateStr);
                        }
                    }
                });
                
                const mapSmhiIcon = (symbolCode) => {
                    if (symbolCode === 9999) return 'cloud'; 
                    if (symbolCode >= 1 && symbolCode <= 2) return 'sun'; 
                    if (symbolCode >= 3 && symbolCode <= 4) return 'cloud-sun'; 
                    if (symbolCode >= 5 && symbolCode <= 7) return 'cloud'; 
                    if (symbolCode >= 8 && symbolCode <= 10) return 'cloud-drizzle'; 
                    if (symbolCode >= 18 && symbolCode <= 20) return 'cloud-rain'; 
                    if (symbolCode >= 11 && symbolCode <= 17) return 'cloud-snow'; 
                    if (symbolCode === 21) return 'cloud-lightning'; 
                    return 'cloud';
                };

                const days = ['Sön', 'Mån', 'Tis', 'Ons', 'Tor', 'Fre', 'Lör'];
                
                const formattedData = dailyData.slice(0, 7).map((day, index) => {
                    const date = new Date(day.time);
                    const temp = day.data?.air_temperature !== undefined && day.data?.air_temperature !== 9999 
                        ? `${Math.round(day.data.air_temperature)}°` 
                        : '-°';
                        
                    const symbol = day.data?.symbol_code !== undefined && day.data?.symbol_code !== 9999 
                        ? mapSmhiIcon(day.data.symbol_code) 
                        : 'cloud';
                    
                    return {
                        day: index === 0 ? 'Idag' : days[date.getDay()],
                        icon: symbol,
                        temp: temp
                    };
                });

                setWeatherData(formattedData);
                setLoading(false);
            } catch (err) {
                console.error("Fel vid hämtning av väderdata:", err);
                setError(true);
                setLoading(false);
            }
        };

        fetchWeather();
        const interval = setInterval(fetchWeather, 3600000); 
        return () => clearInterval(interval);
    }, []);

    React.useEffect(() => {
        if (!loading && !error && window.lucide) {
            window.lucide.createIcons();
        }
    }, [weatherData, loading, error]);

    return (
        <div className="bg-white/80 dark:bg-[#182032]/80 backdrop-blur-xl rounded-3xl border border-zinc-200/80 dark:border-white/5 p-5 shadow-sm relative overflow-hidden group hover:shadow-xl hover:shadow-sky-500/10 transition-all duration-300 flex flex-col justify-between min-h-[140px] bg-[radial-gradient(#00000008_1px,transparent_1px)] dark:bg-[radial-gradient(#ffffff08_1px,transparent_1px)] [background-size:12px_12px]">
            <div className="absolute right-0 top-0 w-32 h-32 bg-sky-500/10 blur-3xl rounded-full pointer-events-none transition-all duration-500 group-hover:bg-sky-500/20"></div>
            
            <div className="relative z-10 flex items-center justify-between mb-3">
                <div className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest flex items-center gap-2 group-hover:text-zinc-500 dark:group-hover:text-zinc-300 transition-colors">
                    <window.Icon name="cloud-sun" size={12} className="text-sky-500 group-hover:scale-110 transition-transform" /> Väder (7d)
                </div>
                <span className="text-[8px] font-bold text-sky-600 dark:text-sky-400 bg-sky-50 dark:bg-sky-500/10 px-2 py-0.5 rounded-md border border-sky-200/50 dark:border-sky-500/20 uppercase tracking-widest flex items-center gap-1 shadow-sm">
                    {loading ? <span className="w-2 h-2 rounded-full bg-sky-400 animate-pulse"></span> : null}
                    Eslöv
                </span>
            </div>

            <div className="relative z-10 flex items-end justify-between gap-1 w-full mt-auto min-h-[40px]">
                {loading ? (
                    <div className="w-full text-center text-[10px] text-zinc-400 uppercase tracking-widest py-2">Hämtar data...</div>
                ) : error ? (
                    <div className="w-full text-center text-[10px] text-red-400 uppercase tracking-widest font-bold py-2">Kunde inte nå SMHI</div>
                ) : (
                    weatherData.map((w, i) => (
                        <div key={i} className="flex flex-col items-center justify-end flex-1 group/day cursor-default">
                            <span className={`text-[8px] font-bold uppercase tracking-widest mb-1.5 transition-all duration-300 ${i === 0 ? 'text-sky-500' : 'text-zinc-400 group-hover/day:text-zinc-800 dark:group-hover/day:text-zinc-100 group-hover/day:-translate-y-0.5'}`}>
                                {w.day}
                            </span>
                            <div className="transition-transform duration-300 group-hover/day:scale-125 group-hover/day:-translate-y-1">
                                <window.Icon name={w.icon} size={16} className={`mb-1.5 ${i === 0 ? 'text-sky-500 drop-shadow-sm' : 'text-zinc-500 dark:text-zinc-400'}`} />
                            </div>
                            <span className="text-[11px] font-bold text-zinc-900 dark:text-white leading-none transition-transform duration-300 group-hover/day:scale-110">
                                {w.temp}
                            </span>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
});

// 3. SMART DATA-IKON
window.VehicleDataIcon = React.memo(({ job, isDesktop }) => {
    const [hasData, setHasData] = React.useState(false);
    const [pulse, setPulse] = React.useState(false);

    React.useEffect(() => {
        if (!job) return;

        const isValid = (val) => val && String(val).trim().length > 0 && String(val).trim() !== '-' && String(val).trim().toLowerCase() !== 'okänd modell';
        const checkOil = (vol) => {
            if (!vol) return false;
            const num = parseFloat(String(vol).replace(/,/g, '.').replace(/[^\d.]/g, ''));
            return !isNaN(num) && num > 0 && num !== 4.3;
        };

        const localHasData = isValid(job.bilmodell) || isValid(job.motorkod) || isValid(job.vin) || isValid(job.miltal) || isValid(job.årsmodell) || checkOil(job.oljevolym);

        if (localHasData) {
            setHasData(true);
            return;
        }

        const regnr = job.regnr ? job.regnr.toUpperCase().trim() : null;
        if (!regnr || !window.db) return;

        const unsubscribe = window.db.collection('vehicleSpecs').doc(regnr).onSnapshot(doc => {
            if (doc.exists) {
                const data = doc.data();
                const registryHasData = isValid(data.model) || isValid(data.engine) || isValid(data.vin) || isValid(data.mileage) || isValid(data.year) || checkOil(data.oil);
                if (registryHasData && !hasData) {
                    setPulse(true);
                    setTimeout(() => setPulse(false), 2000);
                }
                setHasData(registryHasData);
            } else {
                setHasData(false);
            }
        });

        return () => unsubscribe();
    }, [job.id, job.regnr, job.bilmodell, job.motorkod, job.vin, job.miltal, job.årsmodell, job.oljevolym, hasData]);

    React.useEffect(() => {
        if (hasData && window.lucide) window.lucide.createIcons();
    }, [hasData]);

    if (!hasData) return null;

    if (isDesktop) {
        return (
            <div title="Teknisk fordonsdata finns sparad" className={`absolute right-8 top-1/2 -translate-y-1/2 flex items-center justify-center w-9 h-9 rounded-xl bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200/50 dark:border-emerald-500/20 text-emerald-600 dark:text-emerald-400 transition-all duration-300 group-hover:opacity-0 group-hover:scale-75 group-hover:translate-x-4 shadow-sm pointer-events-none z-0 ${pulse ? 'animate-pulse ring-4 ring-emerald-500/20' : ''}`}>
                <window.Icon name="database" size={16} />
            </div>
        );
    }

    return (
        <span title="Teknisk data tillgänglig i garaget" className="h-[20px] px-2 text-[8px] font-bold uppercase tracking-widest text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-500/10 inline-flex items-center justify-center gap-1 rounded-lg border border-emerald-200/50 dark:border-emerald-500/20 shadow-sm transition-all">
            <window.Icon name="database" size={9} className={pulse ? "animate-spin" : ""} /> DATA
        </span>
    );
});

const getAvatarTheme = (name) => {
    if (!name) return 'bg-zinc-100 text-zinc-600 border-zinc-200 dark:bg-[#182032] dark:text-zinc-400 dark:border-white/5';
    const themes = [
        'bg-blue-50 text-blue-600 border-blue-200 dark:bg-blue-500/10 dark:text-blue-400 dark:border-blue-500/20',
        'bg-emerald-50 text-emerald-600 border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20',
        'bg-violet-50 text-violet-600 border-violet-200 dark:bg-violet-500/10 dark:text-violet-400 dark:border-violet-500/20',
        'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-500/10 dark:text-amber-400 dark:border-amber-500/20',
        'bg-rose-50 text-rose-600 border-rose-200 dark:bg-rose-500/10 dark:text-rose-400 dark:border-rose-500/20',
        'bg-cyan-50 text-cyan-600 border-cyan-200 dark:bg-cyan-500/10 dark:text-cyan-400 dark:border-cyan-500/20'
    ];
    let hash = 0;
    for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
    return themes[Math.abs(hash) % themes.length];
};

const AVATAR_BRANDS = { 'Volvo':'volvo', 'BMW':'bmw', 'Audi':'audi', 'VW':'volkswagen', 'Volkswagen':'volkswagen', 'Mercedes':'mercedes', 'Benz':'mercedes', 'Tesla':'tesla', 'Toyota':'toyota', 'Ford':'ford', 'Kia':'kia', 'Saab':'saab', 'Porsche':'porsche', 'Seat':'seat', 'Skoda':'skoda', 'Nissan':'nissan', 'Peugeot':'peugeot', 'Renault':'renault', 'Fiat':'fiat', 'Iveco':'iveco', 'Honda':'honda', 'Mazda':'mazda', 'Hyundai':'hyundai', 'Polestar':'polestar', 'Mini':'mini', 'Jeep':'jeep', 'Land Rover':'landrover', 'Subaru':'subaru', 'Suzuki':'suzuki', 'Lexus':'lexus', 'Chevrolet':'chevrolet', 'Citroen':'citroen', 'Opel':'opel', 'Dacia':'dacia', 'Mitsubishi':'mitsubishi', 'Jaguar':'jaguar', 'Dodge':'dodge', 'Ram':'ram', 'Cupra':'cupra' };

const getLocalBrand = (text1, text2) => {
    const combined = `${text1 || ''} ${text2 || ''}`.toLowerCase();
    if (!combined.trim()) return null;
    for (const [key, slug] of Object.entries(AVATAR_BRANDS)) {
        if (combined.includes(key.toLowerCase()) || combined.includes(slug)) return slug;
    }
    return null;
};

window.CustomerAvatar = React.memo(({ job }) => {
    const [brand, setBrand] = React.useState(null);
    const [hasDbData, setHasDbData] = React.useState(false); 

    React.useEffect(() => {
        if (job.bilmodell) {
            const initialBrand = getLocalBrand(job.bilmodell);
            if (initialBrand) setBrand(initialBrand);
        }
        const regnr = job.regnr ? job.regnr.toUpperCase().trim() : null;
        if (!regnr || !window.db) return;
        const unsubscribe = window.db.collection('vehicleSpecs').doc(regnr).onSnapshot(doc => {
            if (doc.exists) {
                const data = doc.data();
                setHasDbData(true);
                if (data.brand_manual) {
                    setBrand(data.brand_manual);
                } else {
                    const foundBrand = getLocalBrand(data.model, data.fabrikat);
                    if (foundBrand) setBrand(foundBrand);
                }
            }
        });
        return () => unsubscribe();
    }, [job.regnr, job.bilmodell]);

    React.useEffect(() => {
        if (hasDbData && !brand && window.lucide) window.lucide.createIcons();
    }, [hasDbData, brand]);

    const initials = job.kundnamn ? job.kundnamn.split(' ').map(n => n[0]).join('').substring(0,2).toUpperCase() : '??';
    const avatarTheme = getAvatarTheme(job.kundnamn);
    const isDone = ['KLAR', 'FAKTURERAS'].includes(job.status);

    return (
        <div className="relative shrink-0 z-10 group-hover:scale-105 transition-transform duration-300">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-[13px] sm:text-[12px] font-bold border shadow-sm transition-all ${avatarTheme} ${isDone ? 'opacity-70 grayscale' : ''}`}>
                {initials}
            </div>
            
            {brand ? (
                /* ÄNDRING: 
                   - w-[22px] och h-[22px] är ändrat till w-[26px] h-[26px]
                   - p-[4px] är ändrat till p-[3px] (gör att själva bilden får ta mer plats)
                   - positionen är ändrad till -bottom-2 -right-2
                */
                <div className="absolute -bottom-2 -right-2 w-[26px] h-[26px] bg-white dark:bg-[#182032] rounded-full border border-zinc-200 dark:border-[#2a3441] shadow-sm flex items-center justify-center p-[3px] overflow-hidden animate-in zoom-in duration-300 z-20">
                    <img src={`https://cdn.simpleicons.org/${brand}`} className="w-full h-full object-contain opacity-80 dark:invert transition-opacity hover:opacity-100" alt={brand} onError={(e) => e.target.style.display = 'none'} />
                </div>
            ) : 
            hasDbData ? (
                /* ÄNDRING: Samma storleksändringar för den allmänna bil-ikonen (fallback) */
                <div title="Fordonsteknisk data hittad, men okänt märke" className="absolute -bottom-2 -right-2 w-[26px] h-[26px] bg-zinc-100 dark:bg-[#1a2235] rounded-full border border-zinc-200 dark:border-[#2a3441] shadow-sm flex items-center justify-center overflow-hidden animate-in zoom-in duration-300 z-20 text-zinc-400">
                    <window.Icon name="car" size={14} /> {/* Ikonen är också lite större (size 14 istället för 12) */}
                </div>
            ) : null}
        </div>
    );
});

// 3. MOBILKORTET
const mobileCardPropsAreEqual = (prev, next) => {
    return prev.job === next.job && prev.job.status === next.job.status && prev.job.datum === next.job.datum;
};

// --- UPPGRADERAT MOBILKORT ---
const MobileJobCard = React.memo(({ job, setView, onOpenHistory }) => {
    const [menuOpen, setMenuOpen] = React.useState(false);
    const [copied, setCopied] = React.useState(false);

    const isWaiting = !job.datum;
    const dateString = formatDate(job.datum);
    const isUrgentDate = ['IDAG', 'IMORGON'].includes(dateString);
    const isDone = ['KLAR', 'FAKTURERAS'].includes(job.status);

    const vehicleDisplay = job.regnr || job.bilmodell || '-';
    const isReg = vehicleDisplay.length <= 8 && /\d/.test(vehicleDisplay);
    const price = parseInt(job.kundpris) || 0;

    const handleCopy = (e) => {
        e.stopPropagation();
        if (!job.regnr || job.regnr === '-') return;
        navigator.clipboard.writeText(vehicleDisplay);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <div
            onClick={() => job.regnr ? onOpenHistory(job.regnr, job.id, job) : null}
            // Tunnare ram (border-2) och skarpare hörn (rounded-2xl)
            className={`w-full relative active:scale-[0.97] transition-all duration-200 overflow-hidden mb-4 group cursor-pointer border-2 rounded-2xl
                ${isDone ? 'opacity-60 grayscale-[0.2] border-zinc-200 dark:border-white/5' : 
                  isUrgentDate ? 'border-orange-300 dark:border-orange-500/50 shadow-[0_4px_15px_-3px_rgba(249,115,22,0.1)]' : 
                  'border-zinc-200 dark:border-[#2a3441] shadow-[0_4px_10px_-3px_rgba(0,0,0,0.05)]'}
            `}
        >
            {/* Kortets bakgrund */}
            <div className={`absolute inset-0 transition-colors duration-300 ${
                isUrgentDate && !isDone 
                ? 'bg-gradient-to-b from-orange-50 to-white dark:from-orange-500/10 dark:to-[#182032]' 
                : 'bg-white dark:bg-[#182032]'
            }`}></div>

            <div className="p-4 relative z-10">
                {/* HEADER I KORTET */}
                <div className="flex justify-between items-start mb-4">
                    <div className="flex items-center gap-3 min-w-0 pr-2">
                        <window.CustomerAvatar job={job} />
                        <div className="flex flex-col min-w-0">
                            <div className="text-[15px] font-black tracking-tight truncate leading-tight text-zinc-900 dark:text-white group-hover:text-orange-500 transition-colors">
                                {job.kundnamn}
                            </div>
                            <div className="text-[10px] font-mono text-zinc-400 dark:text-zinc-500 flex items-center gap-1 mt-0.5">
                                <span className="bg-zinc-100 dark:bg-white/5 px-1.5 py-0.5 rounded text-[9px]">#{job.id.substring(0, 6)}</span>
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center gap-2 relative z-30">
                        {/* Data-badge direkt bredvid Status */}
                        <window.VehicleDataIcon job={job} isDesktop={false} />
                        <window.Badge status={job.status} />
                        
                        <div className="relative">
                            <button onClick={(e) => { e.stopPropagation(); setMenuOpen(!menuOpen); }} className="w-8 h-8 flex items-center justify-center text-zinc-400 hover:text-zinc-900 dark:text-zinc-500 dark:hover:text-white transition-colors hover:bg-zinc-100 dark:hover:bg-white/10 rounded-full active:scale-90 -mr-2">
                                <window.Icon name="more-horizontal" size={18} />
                            </button>
                            {/* Menyn */}
                            {menuOpen && (
                                <>
                                    <div className="fixed inset-0 z-40" onClick={(e) => { e.stopPropagation(); setMenuOpen(false); }}></div>
                                    <div className="absolute right-0 top-full mt-2 w-48 bg-white/95 dark:bg-[#1f2940]/95 backdrop-blur-xl rounded-2xl shadow-2xl border border-zinc-100 dark:border-white/10 z-50 p-2 overflow-hidden animate-in fade-in zoom-in-95 origin-top-right">
                                        {job.status !== 'KLAR' && (
                                            <button onClick={(e) => { e.stopPropagation(); window.db.collection("jobs").doc(job.id).update({ status: 'KLAR' }); setMenuOpen(false); }} className="w-full text-left px-3 py-3 text-[12px] font-bold uppercase tracking-wide text-zinc-700 dark:text-zinc-200 hover:bg-emerald-50 dark:hover:bg-emerald-500/20 hover:text-emerald-600 dark:hover:text-emerald-400 flex items-center gap-3 rounded-xl transition-colors">
                                                <window.Icon name="check-circle" size={16} className="text-emerald-500" /> Markera klar
                                            </button>
                                        )}
                                        <button onClick={(e) => { e.stopPropagation(); setView('NEW_JOB', { job: job }); setMenuOpen(false); }} className="w-full text-left px-3 py-3 text-[12px] font-bold uppercase tracking-wide text-zinc-700 dark:text-zinc-200 hover:bg-blue-50 dark:hover:bg-blue-500/20 hover:text-blue-600 dark:hover:text-blue-400 flex items-center gap-3 rounded-xl transition-colors">
                                            <window.Icon name="edit-2" size={16} className="text-blue-500" /> Redigera order
                                        </button>
                                        <div className="h-[1px] bg-zinc-100 dark:bg-white/5 my-1 mx-2"></div>
                                        <button onClick={(e) => { e.stopPropagation(); if (confirm("Radera ordern?")) { window.db.collection("jobs").doc(job.id).update({ deleted: true }); } setMenuOpen(false); }} className="w-full text-left px-3 py-3 text-[12px] font-bold uppercase tracking-wide text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/20 flex items-center gap-3 rounded-xl transition-colors">
                                            <window.Icon name="trash-2" size={16} className="text-red-500" /> Radera order
                                        </button>
                                    </div>
                                </>
                            )}
                        </div>
                    </div>
                </div>

                {/* INFO BUBBLOR (Delade lådor som du ville ha det) */}
                <div className="flex items-stretch gap-2 mb-4">
                    {/* Fordon */}
                        <div className="flex-1 bg-zinc-50/90 dark:bg-[#0f1522]/50 shadow-inner rounded-lg p-3 border border-zinc-200/80 dark:border-white/5 flex flex-col justify-between">                        
                            <div className="flex items-center justify-between mb-2">
                            <span className="text-[9px] text-zinc-500 dark:text-zinc-500 font-bold uppercase tracking-widest mb-2 flex items-center gap-1.5">
                                <window.Icon name="car" size={10} /> Fordon
                            </span>
                        </div>
                        
                        <div 
                            onClick={handleCopy} 
                            className={`inline-flex items-center rounded-md border shadow-sm overflow-hidden h-[28px] relative transition-all duration-300 active:scale-95 cursor-pointer
                                ${copied 
                                    ? 'border-emerald-400 ring-2 ring-emerald-400/20 dark:border-emerald-500 dark:ring-emerald-500/20' 
                                    : isReg ? 'border-zinc-300 dark:border-[#2a3441]' : 'border-transparent'
                                }`}
                        >
                            {isReg ? (
                                <>
                                    <div className="w-[16px] bg-[#003399] h-full flex flex-col items-center justify-between py-[2px] shrink-0 border-r border-zinc-200 dark:border-[#2a3441]">
                                        <div className="w-1.5 h-1.5 rounded-full border-[1px] border-[#ffcc00] mt-[1px]"></div>
                                        <span className="text-[7px] font-sans font-black text-white leading-none antialiased mb-[1px]">S</span>
                                    </div>
                                    
                                    {/* Mjuk grön bakgrund vid kopiering - "relative" tillagt för att hålla ikonen på plats */}
                                    <div className={`flex h-full items-center justify-center px-2.5 w-full relative transition-colors duration-300 ${copied ? 'bg-emerald-50 dark:bg-emerald-500/20' : 'bg-white dark:bg-[#1a2235]'}`}>
                                        
                                        {/* Texten ligger alltid i mitten och ändrar bara färg */}
                                        <span className={`font-mono font-bold text-[14px] tracking-[0.1em] leading-none mt-[1px] transition-colors duration-300 ${copied ? 'text-emerald-600 dark:text-emerald-400' : 'text-zinc-900 dark:text-zinc-100'}`}>
                                            {vehicleDisplay}
                                        </span>

                                        {/* Ikonen svävar fritt till höger så texten slipper hoppa */}
                                        <div className={`absolute right-1.5 transition-all duration-300 ${copied ? 'opacity-100 scale-100' : 'opacity-0 scale-50'}`}>
                                            <window.Icon name="check" size={12} className="text-emerald-500" />
                                        </div>
                                    </div>
                                </>
                            ) : (
                                // Samma princip för bilar som saknar reg-nummer
                                <div className={`relative flex items-center justify-center px-2 py-1 rounded w-full transition-colors duration-300 ${copied ? 'text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-500/20' : 'text-zinc-800 dark:text-zinc-300'}`}>
                                    <span className="font-mono font-bold text-[13px] uppercase leading-none mt-[1px]">
                                        {vehicleDisplay}
                                    </span>
                                    <div className={`absolute right-1 transition-all duration-300 ${copied ? 'opacity-100 scale-100' : 'opacity-0 scale-50'}`}>
                                        <window.Icon name="check" size={12} />
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Datum */}
                        <div className="flex-1 bg-zinc-50/90 dark:bg-[#0f1522]/50 shadow-inner rounded-lg p-3 border border-zinc-200/80 dark:border-white/5 flex flex-col justify-between">                        
                        <span className="text-[9px] text-zinc-500 dark:text-zinc-500 font-bold uppercase tracking-widest mb-2 flex items-center gap-1.5">
                            <window.Icon name="calendar" size={10} /> {job.datum ? 'Tid & Datum' : 'Status'}
                        </span>
                        {job.datum ? (
                            <div className="flex flex-col">
                                <div className="flex items-center gap-1.5">
                                    {!isDone && isUrgentDate && (
                                        <span className="relative flex h-2 w-2 shrink-0">
                                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-orange-400 opacity-75"></span>
                                            <span className="relative inline-flex rounded-full h-2 w-2 bg-orange-500"></span>
                                        </span>
                                    )}
                                    <span className={`text-[13px] font-black uppercase leading-none truncate ${!isDone && isUrgentDate ? 'text-orange-600 dark:text-orange-400' : 'text-zinc-900 dark:text-white'}`}>
                                        {dateString}
                                    </span>
                                    {/* Klockslaget ligger nu bredvid datumet och saknar bakgrundsfärg */}
                                    <span className={`font-mono font-bold text-[13px] ${job.datum.includes('00:00') ? 'text-zinc-300 dark:text-zinc-600' : 'text-zinc-500 dark:text-zinc-400'}`}>
                                       {job.datum.split('T')[1]}
                                    </span>
                                </div>
                            </div>
                        ) : (
                            <span className="text-[11px] font-bold text-red-500 uppercase tracking-widest mt-auto">Inväntar tid</span>
                        )}
                    </div>
                </div>

                {/* FOOTER I KORTET */}
                <div className="flex items-end justify-between gap-4 mt-2">
                    <div className="flex-1 min-w-0">
                        <span className="text-[13px] font-black text-zinc-900 dark:text-white uppercase tracking-tight block truncate">
                            {job.paket === 'Oljebyte' && job.oljevolym ? `Oljebyte ${job.oljevolym}l` : (job.paket || 'Standard')}
                        </span>
                        {job.kommentar && (
                            <span className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-1 line-clamp-2 leading-snug flex items-start gap-1.5 font-medium">
                                <window.Icon name="message-square" size={10} className="shrink-0 mt-[2px] opacity-70" />
                                {job.kommentar}
                            </span>
                        )}
                    </div>
                    
                    <div className="shrink-0 text-right">
                        {price > 0 ? (
                            <div className="flex flex-col items-end">
                                <span className="text-[18px] font-black text-zinc-900 dark:text-white leading-none tracking-tight">
                                    {price.toLocaleString('sv-SE')}
                                </span> 
                                <span className="text-[9px] text-zinc-400 font-bold uppercase tracking-widest mt-1">SEK inkl. moms</span>
                            </div>
                        ) : (
                            <span className="text-[9px] font-bold text-zinc-400 bg-zinc-100 dark:bg-white/5 px-2 py-1 rounded-md uppercase tracking-widest">Ej prissatt</span>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}, mobileCardPropsAreEqual);

// --- 4. HUVUDVY ---
const dashboardPropsAreEqual = (prev, next) => {
    return prev.filteredJobs === next.filteredJobs && prev.activeFilter === next.activeFilter && prev.globalSearch === next.globalSearch && prev.statusCounts === next.statusCounts;
};

// --- SMART TEXTTOLK FÖR UPPGIFTER ---
window.TaskFormatter = React.memo(({ text, isDone }) => {
    const [copiedToken, setCopiedToken] = React.useState(null);
    const regex = /(https?:\/\/[^\s]+|[a-zA-ZåäöÅÄÖ]{3}\s?\d{2}[a-zA-Z0-9])/g;
    const parts = text.split(regex);

    const handleCopy = (e, token) => {
        e.stopPropagation();
        if (isDone) return; 
        navigator.clipboard.writeText(token);
        setCopiedToken(token);
        setTimeout(() => setCopiedToken(null), 1500);
    };

    return (
        <>
            {parts.map((part, i) => {
                if (!part) return null;
                if (isDone) return <span key={i} className="transition-all duration-500">{part}</span>;

                if (/^https?:\/\//.test(part)) {
                    return (
                        <a key={i} href={part} target="_blank" rel="noopener noreferrer" className="text-blue-500 dark:text-blue-400 border-b border-dashed border-blue-500/50 hover:text-orange-500 hover:border-orange-500 transition-colors pb-[1px]">
                            {part}
                        </a>
                    );
                }
                if (/^[a-zA-ZåäöÅÄÖ]{3}\s?\d{2}[a-zA-Z0-9]$/.test(part)) {
                    const cleanReg = part.replace(/\s+/g, '').toUpperCase();
                    const isCopied = copiedToken === cleanReg;
                    
                    if (isCopied) {
                        return (
                            <span key={i} className="text-emerald-600 dark:text-emerald-400 border-b border-dashed border-emerald-500/30 pb-[1px] animate-in slide-in-from-bottom-1 duration-200">
                                <window.Icon name="check" size={12} className="inline mr-0.5 relative -top-[1px]" />
                                {cleanReg}
                            </span>
                        );
                    }
                    return (
                        <span key={i} onClick={(e) => handleCopy(e, cleanReg)} title="Klicka för att kopiera" className="cursor-pointer border-b border-dashed border-zinc-400/60 dark:border-zinc-500/60 hover:text-orange-500 hover:border-orange-500 dark:hover:text-orange-400 dark:hover:border-orange-400 transition-colors pb-[1px]">
                            {cleanReg}
                        </span>
                    );
                }
                return <span key={i}>{part}</span>;
            })}
        </>
    );
});

// --- DASHBOARD WIDGETS ---
window.DashboardWidgets = React.memo(({ allJobs }) => {
    
    const [tasks, setTasks] = React.useState([]);
    const [newTask, setNewTask] = React.useState('');

    React.useEffect(() => {
        if (!window.db) return;
        const unsubscribe = window.db.collection("tasks")
            .orderBy("createdAt", "asc")
            .onSnapshot(snap => {
                const fetchedTasks = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
                setTasks(fetchedTasks);
            }, error => console.error("Kunde inte hämta uppgifter:", error));
        return () => unsubscribe();
    }, []);

    const toggleTask = (id, currentStatus) => {
        window.db.collection("tasks").doc(id).update({ done: !currentStatus });
    };

    const addTask = (e) => {
        e.preventDefault();
        if (!newTask.trim()) return;
        window.db.collection("tasks").add({ 
            text: newTask.trim(), 
            done: false,
            createdAt: window.firebase.firestore.FieldValue.serverTimestamp()
        });
        setNewTask('');
    };

    const deleteTask = (e, id) => {
        e.stopPropagation();
        window.db.collection("tasks").doc(id).delete();
    };

    const clearCompletedTasks = () => {
        const completed = tasks.filter(t => t.done);
        if(completed.length > 0 && confirm(`Radera ${completed.length} klara uppgifter?`)) {
            completed.forEach(t => window.db.collection("tasks").doc(t.id).delete());
        }
    };

    const completedTasks = tasks.filter(t => t.done).length;
    const taskProgress = tasks.length === 0 ? 0 : Math.round((completedTasks / tasks.length) * 100);
    const progressColor = taskProgress === 100 ? 'from-emerald-400 to-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.4)]' : 'from-orange-400 to-orange-500 shadow-[0_0_10px_rgba(249,115,22,0.4)]';

    const sortedTasks = React.useMemo(() => {
        return [...tasks].sort((a, b) => {
            if (a.done !== b.done) return a.done ? 1 : -1;
            const timeA = a.createdAt?.toMillis?.() || Number.MAX_SAFE_INTEGER;
            const timeB = b.createdAt?.toMillis?.() || Number.MAX_SAFE_INTEGER;
            return timeA - timeB;
        });
    }, [tasks]);

    const upcomingDays = React.useMemo(() => {
        const days = [];
        const today = new Date();
        const dayNames = ['Sön', 'Mån', 'Tis', 'Ons', 'Tor', 'Fre', 'Lör'];
        let maxJobs = 1; 

        for (let i = 0; i < 5; i++) {
            const d = new Date();
            d.setDate(today.getDate() + i);
            const targetIso = d.toISOString().split('T')[0];
            const count = allJobs.filter(j => j.datum && j.datum.startsWith(targetIso)).length;
            if (count > maxJobs) maxJobs = count;
        }

        for (let i = 0; i < 5; i++) {
            const targetDate = new Date();
            targetDate.setDate(today.getDate() + i);
            const targetIso = targetDate.toISOString().split('T')[0];

            const jobsThisDay = allJobs.filter(job => {
                if (!job.datum) return false;
                return job.datum.startsWith(targetIso);
            }).length;

            const heightPercent = jobsThisDay === 0 ? 5 : (jobsThisDay / maxJobs) * 100;
            
            let colorClass = 'from-orange-400 to-orange-300'; 
            if (jobsThisDay > 4) colorClass = 'from-orange-500 to-orange-400'; 
            if (jobsThisDay > 8) colorClass = 'from-red-500 to-orange-500'; 

            days.push({
                label: i === 0 ? 'Idag' : dayNames[targetDate.getDay()],
                dateLabel: `${targetDate.getDate()} ${['Jan','Feb','Mar','Apr','Maj','Jun','Jul','Aug','Sep','Okt','Nov','Dec'][targetDate.getMonth()]}`,
                count: jobsThisDay,
                isToday: i === 0,
                height: `${heightPercent}%`,
                colorClass: colorClass
            });
        }
        return days;
    }, [allJobs]);

    React.useEffect(() => {
        if (window.lucide) window.lucide.createIcons();
    }, [tasks, upcomingDays]);

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 lg:gap-6 mb-2 lg:mb-8">
            
            <div className="bg-white/80 dark:bg-[#182032]/80 backdrop-blur-xl rounded-3xl border border-zinc-200/80 dark:border-white/5 p-6 shadow-sm hover:shadow-md transition-all duration-300 flex flex-col justify-between group/widget relative overflow-hidden bg-[radial-gradient(#00000008_1px,transparent_1px)] dark:bg-[radial-gradient(#ffffff08_1px,transparent_1px)] [background-size:12px_12px]">
                <div className="absolute right-0 bottom-0 w-32 h-32 bg-orange-500/5 blur-3xl rounded-full pointer-events-none transition-all duration-500 group-hover/widget:bg-orange-500/10"></div>

                <div className="flex justify-between items-start mb-6 relative z-10">
                    <div>
                        <h3 className="text-[13px] font-bold text-zinc-900 dark:text-white flex items-center gap-2 mb-1 group-hover/widget:text-orange-500 transition-colors">
                            Arbetsbelastning
                        </h3>
                        <p className="text-[10px] text-zinc-500 dark:text-zinc-400 font-bold uppercase tracking-widest flex items-center gap-1.5">
                            <window.Icon name="calendar" size={10} /> Kommande 5 Dagar
                        </p>
                    </div>
                    <div className="flex items-center gap-1 bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 px-2 py-1 rounded-lg text-[9px] font-bold uppercase tracking-widest border border-emerald-200/50 dark:border-emerald-500/20 shadow-sm">
                        <window.Icon name="trending-up" size={10} /> Live
                    </div>
                </div>
                
                <div className="flex items-end justify-between h-32 gap-3 mt-auto pt-4 relative z-10">
                    {/* Referenslinjer */}
                    <div className="absolute inset-0 flex flex-col justify-between pt-4 pb-8 pointer-events-none px-2 opacity-20 dark:opacity-10 z-0">
                        <div className="w-full border-b border-dashed border-zinc-800 dark:border-white"></div>
                        <div className="w-full border-b border-dashed border-zinc-800 dark:border-white"></div>
                        <div className="w-full border-b border-zinc-800 dark:border-white"></div>
                    </div>

                    {upcomingDays.map((day, i) => (
                        <div key={i} className="flex flex-col items-center flex-1 group h-full justify-end cursor-default relative z-10">
                            <div className="absolute -top-4 opacity-0 group-hover:opacity-100 group-hover:-translate-y-2 transition-all duration-300 flex flex-col items-center pointer-events-none z-20">
                                <span className="bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 text-[11px] font-bold px-2.5 py-1.5 rounded-lg shadow-xl whitespace-nowrap flex flex-col items-center">
                                    <span>{day.count} Bilar</span>
                                    <span className="text-[8px] font-mono text-zinc-400 dark:text-zinc-500 uppercase">{day.dateLabel}</span>
                                </span>
                                <div className="w-0 h-0 border-l-[4px] border-r-[4px] border-t-[4px] border-l-transparent border-r-transparent border-t-zinc-900 dark:border-t-white -mt-[1px]"></div>
                            </div>

                            <div className="w-full max-w-[36px] h-full bg-zinc-100/80 dark:bg-white/5 rounded-xl flex items-end overflow-hidden p-1 relative shadow-inner">
                                <div 
                                    className={`w-full rounded-lg transition-all duration-1000 ease-out bg-gradient-to-t ${day.isToday || day.count > 0 ? day.colorClass : 'from-zinc-300 to-zinc-200 dark:from-zinc-700 dark:to-zinc-600'} group-hover:brightness-110`}
                                    style={{ height: day.height }}
                                ></div>
                            </div>
                            <span className={`text-[10px] font-bold uppercase tracking-widest mt-3 transition-colors ${day.isToday ? 'text-orange-500' : 'text-zinc-400 group-hover:text-zinc-700 dark:group-hover:text-zinc-200'}`}>
                                {day.label}
                            </span>
                        </div>
                    ))}
                </div>
            </div>

            <div className="bg-white/80 dark:bg-[#182032]/80 backdrop-blur-xl rounded-3xl border border-zinc-200/80 dark:border-white/5 p-6 shadow-sm hover:shadow-md transition-all duration-300 relative overflow-hidden flex flex-col min-h-[220px]">
                
                <div className="absolute top-0 left-0 right-0 h-1 bg-zinc-100 dark:bg-white/5">
                    <div 
                        className={`h-full bg-gradient-to-r transition-all duration-500 ease-out ${progressColor}`}
                        style={{ width: `${taskProgress}%` }}
                    ></div>
                </div>
                
                <div className="flex justify-between items-end mb-4 relative z-10 pt-2">
                    <div>
                        <h3 className="text-[13px] font-bold text-zinc-900 dark:text-white mb-1 flex items-center gap-2">
                            Mina Uppgifter
                        </h3>
                        <div className="flex items-center gap-3">
                            <span className="text-[10px] text-zinc-500 uppercase tracking-widest font-bold">
                                {completedTasks} av {tasks.length} Klara
                            </span>
                            {completedTasks > 0 && (
                                <button onClick={clearCompletedTasks} title="Rensa klara uppgifter" className="text-[9px] text-red-400 hover:text-red-500 bg-red-50 hover:bg-red-100 dark:bg-red-500/10 dark:hover:bg-red-500/20 px-1.5 py-0.5 rounded flex items-center gap-1 transition-colors uppercase font-bold tracking-wider">
                                    <window.Icon name="trash" size={10} /> Rensa
                                </button>
                            )}
                        </div>
                    </div>
                    <div className={`text-2xl font-light tracking-tighter transition-colors duration-500 ${taskProgress === 100 ? 'text-emerald-500' : 'text-zinc-900 dark:text-white'}`}>
                        {taskProgress}<span className={`text-[12px] font-bold ml-0.5 ${taskProgress === 100 ? 'text-emerald-500/50' : 'text-zinc-400'}`}>%</span>
                    </div>
                </div>

                <div className="flex-1 space-y-2.5 overflow-y-auto custom-scrollbar relative z-10 pr-2 max-h-[140px] mt-2">
                    {tasks.length === 0 && (
                        <div className="flex flex-col items-center justify-center py-4 opacity-50">
                            <window.Icon name="check-circle" size={24} className="mb-2 text-zinc-400" />
                            <p className="text-[11px] font-bold uppercase tracking-widest text-zinc-500">Allt är klart!</p>
                        </div>
                    )}
                    {sortedTasks.map((task) => (
                        <div key={task.id} className={`flex items-start justify-between gap-3 group py-1.5 px-2 -mx-2 rounded-xl transition-all duration-300 ${task.done ? 'opacity-50' : 'hover:bg-zinc-50 dark:hover:bg-white/5'}`}>
                            
                            <div className="flex items-start gap-3 min-w-0 flex-1">
                                <div 
                                    onClick={() => toggleTask(task.id, task.done)}
                                    className={`mt-[2px] w-5 h-5 rounded-md border flex items-center justify-center shrink-0 cursor-pointer transition-all duration-300 ${task.done ? 'bg-emerald-500 border-emerald-500 text-white shadow-[0_0_8px_rgba(16,185,129,0.4)]' : 'border-zinc-300 dark:border-zinc-600 bg-white/50 dark:bg-transparent text-transparent hover:border-orange-500 hover:shadow-sm'}`}
                                >
                                    <window.Icon name="check" size={12} className={`transition-transform duration-300 ${task.done ? 'scale-100' : 'scale-0 opacity-0'}`} />
                                </div>
                                
                                <div className="flex-1 min-w-0 select-text text-[13px] font-medium leading-relaxed relative">
                                    <span className={`transition-colors duration-500 ${task.done ? 'text-zinc-400 dark:text-zinc-500' : 'text-zinc-700 dark:text-zinc-200'}`}>
                                        <window.TaskFormatter text={task.text} isDone={task.done} />
                                    </span>
                                    {/* Mjuk animerad överstrykning */}
                                    <div className={`absolute left-0 top-1/2 h-[1.5px] bg-zinc-400 dark:bg-zinc-500 transition-all duration-300 ease-out origin-left ${task.done ? 'w-full opacity-100 scale-x-100' : 'w-0 opacity-0 scale-x-0'}`}></div>
                                </div>
                            </div>
                            
                            <button 
                                onClick={(e) => deleteTask(e, task.id)} 
                                className="mt-0.5 opacity-0 group-hover:opacity-100 w-6 h-6 flex items-center justify-center text-zinc-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-md transition-all shrink-0 cursor-pointer"
                                title="Radera uppgift"
                            >
                                <window.Icon name="trash-2" size={12} />
                            </button>
                        </div>
                    ))}
                </div>
                
                <form onSubmit={addTask} className="mt-4 relative z-10 flex items-center gap-2 pt-2 border-t border-zinc-100 dark:border-white/5">
                    <input
                        type="text"
                        value={newTask}
                        onChange={(e) => setNewTask(e.target.value)}
                        placeholder="Skriv ny uppgift..."
                        className="flex-1 bg-zinc-50 dark:bg-[#0f1522] border border-zinc-200 dark:border-white/5 rounded-xl px-4 py-2.5 text-[12px] text-zinc-900 dark:text-white outline-none focus:border-orange-500/50 focus:ring-2 focus:ring-orange-500/20 dark:focus:border-orange-500/50 transition-all placeholder:text-zinc-400"
                    />
                    <button 
                        type="submit" 
                        disabled={!newTask.trim()}
                        className="w-10 h-10 bg-zinc-900 dark:bg-white disabled:bg-zinc-100 dark:disabled:bg-white/5 disabled:text-zinc-400 hover:bg-orange-500 dark:hover:bg-orange-500 text-white dark:text-zinc-900 rounded-xl flex items-center justify-center shrink-0 transition-colors shadow-sm"
                    >
                        <window.Icon name="plus" size={16} />
                    </button>
                </form>
            </div>
        </div>
    );
});

window.DashboardView = React.memo(({
    allJobs,
    filteredJobs, setEditingJob, setView,
    activeFilter, setActiveFilter, statusCounts,
    globalSearch, setGlobalSearch
}) => {
    const [historyTarget, setHistoryTarget] = React.useState(null);
    const [visibleCount, setVisibleCount] = React.useState(20);
    const [copiedRegId, setCopiedRegId] = React.useState(null); 
    const [sortConfig, setSortConfig] = React.useState({ key: null, direction: 'asc' });
    const [showMobileWidgets, setShowMobileWidgets] = React.useState(false);
    
    React.useEffect(() => {
        setVisibleCount(20);
    }, [activeFilter, globalSearch]);

    const sortedAndFilteredJobs = React.useMemo(() => {
        let result = [...filteredJobs];

        result.sort((a, b) => {
            if (!sortConfig.key) {
                if (!a.datum) return 1; if (!b.datum) return -1;
                return activeFilter === 'BOKAD' ? a.datum.localeCompare(b.datum) : b.datum.localeCompare(a.datum);
            }

            let aVal = a[sortConfig.key];
            let bVal = b[sortConfig.key];

            if (sortConfig.key === 'kundpris') {
                aVal = parseInt(aVal) || 0;
                bVal = parseInt(bVal) || 0;
            } else {
                aVal = (aVal || '').toString().toLowerCase();
                bVal = (bVal || '').toString().toLowerCase();
            }

            if (aVal < bVal) return sortConfig.direction === 'asc' ? -1 : 1;
            if (aVal > bVal) return sortConfig.direction === 'asc' ? 1 : -1;
            return 0;
        });
        return result;
    }, [filteredJobs, sortConfig, activeFilter]);

    const visibleJobs = sortedAndFilteredJobs.slice(0, visibleCount);
    const hasMore = visibleCount < sortedAndFilteredJobs.length;

    const requestSort = (key) => {
        let direction = 'asc';
        if (sortConfig.key === key && sortConfig.direction === 'asc') direction = 'desc';
        setSortConfig({ key, direction });
    };

    const handleCopyDesktop = (e, regnr, jobId) => {
        e.stopPropagation();
        if (!regnr || regnr === '-') return;
        navigator.clipboard.writeText(regnr);
        setCopiedRegId(jobId);
        setTimeout(() => setCopiedRegId(null), 2000);
    };

    const tabsRef = React.useRef(null);
    const filters = ['ALLA', 'BOKAD', 'FAKTURERAS', 'OFFERERAD', 'KLAR'];

    const stats30Days = React.useMemo(() => {
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        return allJobs.filter(j => j.status === 'KLAR' && j.datum && new Date(j.datum) >= thirtyDaysAgo && !j.deleted).length;
    }, [allJobs]);

    const statsNext7Days = React.useMemo(() => {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const nextWeek = new Date(today);
        nextWeek.setDate(nextWeek.getDate() + 7);
        return allJobs.filter(j => {
            if (!j.datum || j.status === 'KLAR' || j.deleted) return false;
            const d = new Date(j.datum);
            return d >= today && d <= nextWeek;
        }).length;
    }, [allJobs]);

    const invoiceStats = React.useMemo(() => {
        if (activeFilter !== 'FAKTURERAS') return { total: 0, topCustomers: [] };
        let total = 0;
        const customers = {};
        filteredJobs.forEach(job => {
            const price = parseInt(job.kundpris) || 0;
            total += price;
            const name = job.kundnamn || 'Okänd kund';
            customers[name] = (customers[name] || 0) + price;
        });
        return {
            total,
            topCustomers: Object.entries(customers).sort((a, b) => b[1] - a[1])
        };
    }, [filteredJobs, activeFilter]);

    const getHeaderDate = () => {
        const d = new Date();
        const days = ['Söndag', 'Måndag', 'Tisdag', 'Onsdag', 'Torsdag', 'Fredag', 'Lördag'];
        const months = ['Jan', 'Feb', 'Mar', 'Apr', 'Maj', 'Jun', 'Jul', 'Aug', 'Sep', 'Okt', 'Nov', 'Dec'];
        return `${days[d.getDay()]} ${d.getDate()} ${months[d.getMonth()]}`;
    };

    const handleOpenHistory = React.useCallback((regnr, jobId, job) => {
        if (window.openVehicleProfile) {
            window.openVehicleProfile(regnr, jobId); 
        }
    }, []);

    React.useEffect(() => {
        if (tabsRef.current) {
            const activeBtn = tabsRef.current.querySelector(`[data-tab="${activeFilter}"]`);
            if (activeBtn) activeBtn.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
        }
    }, [activeFilter]);

    const touchStart = React.useRef(null);
    const touchStartY = React.useRef(null);
    const onTouchStart = React.useCallback((e) => {
        touchStart.current = e.targetTouches[0].clientX;
        touchStartY.current = e.targetTouches[0].clientY;
    }, []);
    const onTouchEnd = React.useCallback((e) => {
        if (touchStart.current === null || touchStartY.current === null) return;
        const xDiff = touchStart.current - e.changedTouches[0].clientX;
        const yDiff = touchStartY.current - e.changedTouches[0].clientY;
        touchStart.current = null; touchStartY.current = null;
        if (Math.abs(yDiff) >= Math.abs(xDiff) || Math.abs(xDiff) < 50) return;
        const currIdx = filters.indexOf(activeFilter);
        if (currIdx === -1) return;
        let nextIdx = currIdx + (xDiff > 0 ? 1 : -1);
        if (nextIdx >= 0 && nextIdx < filters.length) setActiveFilter(filters[nextIdx]);
    }, [activeFilter, filters, setActiveFilter]);

    return (
        <div className="flex flex-col min-h-screen bg-transparent text-zinc-900 dark:text-white pb-0 transition-colors duration-500 relative max-w-[1400px] ml-0 w-full">

            <div className="absolute top-0 left-[-10%] w-[60%] h-[400px] bg-orange-500/10 dark:bg-orange-500/5 blur-[120px] rounded-full pointer-events-none -z-10 hidden lg:block transition-all duration-700"></div>

            {/* --- DESKTOP VY --- */}
            <div className="hidden lg:flex flex-col h-full px-4 lg:px-2">
                {/* HEADER */}
                <div className="flex flex-col md:flex-row md:items-center justify-between mb-4 pb-4 border-b border-zinc-200 dark:border-white/5 gap-4 pt-2 lg:pt-0">
                    <div className="flex items-center gap-4 md:gap-5">
                        <div className="relative group cursor-default shrink-0">
                            <div className="absolute inset-0 bg-orange-500/40 blur-xl rounded-full transition-all duration-700 group-hover:bg-orange-500/60 group-hover:scale-110" />
                            <div className="relative w-14 h-14 rounded-2xl flex items-center justify-center text-white shadow-xl border border-white/20 transition-all duration-300 bg-gradient-to-br from-orange-400 to-orange-600 group-hover:scale-105">
                                <window.Icon name="grid" size={24} />
                            </div>
                        </div>
                        <div className="flex flex-col">
                            <h1 className="text-3xl font-black text-zinc-900 dark:text-white uppercase tracking-tight leading-none drop-shadow-sm dark:drop-shadow-none">
                                DASH<span className="text-zinc-400 dark:text-zinc-500 font-light">BOARD</span>
                            </h1>
                            <p className="text-[11px] font-bold text-orange-500 dark:text-orange-400 uppercase tracking-widest mt-1.5 flex items-center gap-2">
                                <span className="w-1.5 h-1.5 rounded-full bg-orange-500 animate-pulse"></span>
                                Operationell Status
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-4">
                        <button 
                            onClick={() => window.dispatchEvent(new CustomEvent('open-spotlight'))} 
                            className="group w-64 bg-white/50 dark:bg-[#121826] border border-zinc-200 dark:border-[#1a2235] text-zinc-500 dark:text-zinc-400 py-3.5 pl-4 pr-3 rounded-xl flex items-center justify-between hover:bg-white dark:hover:bg-[#182032] hover:border-orange-300 dark:hover:border-orange-500/50 hover:shadow-md transition-all shadow-sm"
                        >
                            <div className="flex items-center gap-2">
                                <window.Icon name="search" size={16} className="text-zinc-400 dark:text-zinc-500 group-hover:text-orange-500 group-hover:rotate-12 transition-all duration-300" />
                                <span className="text-[12px] font-bold tracking-widest uppercase">Sök i systemet...</span>
                            </div>
                            <span className="text-[10px] font-black uppercase text-zinc-400 dark:text-zinc-500 bg-zinc-100 dark:bg-black/50 border border-zinc-200 dark:border-[#1a2235] px-1.5 py-0.5 rounded-md shadow-sm">⌘K</span>
                        </button>
                        <button onClick={() => setView('NEW_JOB')} className="group bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-400 hover:to-orange-500 text-white border border-orange-400/50 h-[46px] px-8 rounded-xl flex items-center gap-3 shadow-[0_8px_20px_-6px_rgba(249,115,22,0.4)] hover:shadow-[0_12px_25px_-4px_rgba(249,115,22,0.6)] hover:-translate-y-0.5 transition-all duration-300 active:scale-95 active:translate-y-0">
                            <span className="text-[12px] font-black uppercase tracking-widest">Nytt Uppdrag</span>
                            <window.Icon name="plus" size={16} className="group-hover:rotate-90 transition-transform duration-500" />
                        </button>
                    </div>
                </div>

                <window.DashboardWidgets allJobs={allJobs} />

                {/* DYNAMISK TOP-GRID (Desktop) */}
                <div className="grid grid-cols-3 gap-6 mb-8">
                    <div className="bg-white/80 dark:bg-[#182032]/80 backdrop-blur-xl rounded-3xl border border-zinc-200/80 dark:border-white/5 p-6 shadow-sm relative overflow-hidden group hover:shadow-xl hover:shadow-emerald-500/5 transition-all duration-300">
                        <div className="absolute right-0 top-0 w-32 h-32 bg-emerald-500/5 blur-3xl rounded-full pointer-events-none transition-all group-hover:bg-emerald-500/10"></div>
                        <window.Icon name="check-circle" size={100} className="absolute -right-8 -bottom-8 text-zinc-100 dark:text-white/5 group-hover:text-emerald-500/10 group-hover:scale-110 group-hover:-rotate-12 transition-all duration-500" />
                        <div className="relative z-10">
                            <div className="text-[10px] font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-widest mb-2 flex items-center gap-2 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                                <window.Icon name="bar-chart-2" size={12} /> Utförda (30d)
                            </div>
                            <div className="text-4xl font-light tracking-tighter text-zinc-900 dark:text-white leading-none">{stats30Days} <span className="text-lg font-bold text-zinc-400 uppercase tracking-widest ml-1">st</span></div>
                            
                            {/* Trendindikator Placeholder */}
                            {stats30Days > 0 && (
                                <div className="mt-4 text-[10px] font-bold text-emerald-500 bg-emerald-50 dark:bg-emerald-500/10 inline-flex items-center gap-1 px-2 py-0.5 rounded-md border border-emerald-100 dark:border-emerald-500/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                                    <window.Icon name="trending-up" size={10} /> +12% vs förra veckan
                                </div>
                            )}
                        </div>
                    </div>

                    {activeFilter === 'FAKTURERAS' ? (
                        <div className="col-span-2 bg-white/80 dark:bg-[#182032]/80 backdrop-blur-xl rounded-3xl border border-zinc-200/80 dark:border-white/5 p-6 shadow-sm hover:shadow-md relative overflow-hidden flex items-center justify-between group animate-in fade-in slide-in-from-right-4 duration-500 transition-all">
                            <div className="absolute right-0 top-0 w-64 h-64 bg-orange-500/10 blur-[80px] rounded-full pointer-events-none"></div>
                            <window.Icon name="file-text" size={120} className="absolute -right-4 -bottom-8 text-zinc-100 dark:text-white/[0.02] group-hover:text-orange-500/10 group-hover:scale-105 transition-all duration-700" />
                            
                            <div className="relative z-10 flex flex-col justify-center">
                                <div className="text-[10px] font-bold text-zinc-500 dark:text-zinc-500 uppercase tracking-widest mb-2 flex items-center gap-2 group-hover:text-orange-500 transition-colors">
                                    <window.Icon name="pie-chart" size={12} className="text-orange-500" /> Att Fakturera
                                </div>
                                <div className="text-5xl font-light tracking-tighter text-zinc-900 dark:text-white leading-none">
                                    {invoiceStats.total.toLocaleString('sv-SE')} <span className="text-xl font-bold text-zinc-400 dark:text-zinc-600 uppercase tracking-widest ml-1">kr</span>
                                </div>
                            </div>

                            <div className="relative z-10 flex flex-col justify-center flex-1 max-w-sm pl-8 ml-8 border-l border-zinc-200 dark:border-white/5">
                                <div className="text-[9px] font-bold text-zinc-500 dark:text-zinc-500 uppercase tracking-widest mb-3 flex items-center justify-between">
                                    <span>Berörda Kunder ({invoiceStats.topCustomers.length})</span>
                                </div>
                                <div className="space-y-2.5">
                                    {invoiceStats.topCustomers.slice(0, 3).map(([name, amount], idx) => {
                                        const percentage = invoiceStats.total > 0 ? Math.round((amount / invoiceStats.total) * 100) : 0;
                                        return (
                                            <div key={idx} className="flex flex-col gap-1 group/cust">
                                                <div className="flex justify-between text-[11px] font-medium text-zinc-700 dark:text-zinc-300 group-hover/cust:text-orange-600 dark:group-hover/cust:text-orange-400 transition-colors">
                                                    <span className="truncate pr-2">{name}</span>
                                                    <span className="font-mono text-zinc-500 dark:text-zinc-400 shrink-0">{amount.toLocaleString('sv-SE')} kr</span>
                                                </div>
                                                <div className="h-1.5 w-full bg-zinc-100 dark:bg-black/40 rounded-full overflow-hidden">
                                                    <div className="h-full bg-gradient-to-r from-orange-500 to-orange-400 rounded-full transition-all duration-1000 ease-out" style={{ width: `${percentage}%` }}></div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                    {invoiceStats.topCustomers.length > 3 && (
                                        <div className="text-[10px] font-medium text-zinc-400 dark:text-zinc-500 pt-1">
                                            + {invoiceStats.topCustomers.length - 3} fler kunder
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    ) : (
                        <>
                            <div className="bg-white/80 dark:bg-[#182032]/80 backdrop-blur-xl rounded-3xl border border-zinc-200/80 dark:border-white/5 p-6 shadow-sm relative overflow-hidden group hover:shadow-xl hover:shadow-blue-500/5 transition-all duration-300">
                                <div className="absolute right-0 top-0 w-32 h-32 bg-blue-500/5 blur-3xl rounded-full pointer-events-none transition-all group-hover:bg-blue-500/10"></div>
                                <window.Icon name="calendar" size={100} className="absolute -right-8 -bottom-8 text-zinc-100 dark:text-white/5 group-hover:text-blue-500/10 group-hover:scale-110 group-hover:rotate-12 transition-all duration-500" />
                                <div className="relative z-10">
                                    <div className="text-[10px] font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-widest mb-2 flex items-center gap-2 group-hover:text-blue-500 transition-colors">
                                        <window.Icon name="clock" size={12} /> Kommande (7d)
                                    </div>
                                    <div className="text-4xl font-light tracking-tighter text-zinc-900 dark:text-white leading-none">{statsNext7Days} <span className="text-lg font-bold text-zinc-400 uppercase tracking-widest ml-1">st</span></div>
                                    
                                    {statsNext7Days > 0 && (
                                        <div className="mt-4 text-[10px] font-bold text-blue-500 bg-blue-50 dark:bg-blue-500/10 inline-flex items-center gap-1 px-2 py-0.5 rounded-md border border-blue-100 dark:border-blue-500/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                                            <window.Icon name="trending-down" size={10} /> -5% vs förra veckan
                                        </div>
                                    )}
                                </div>
                            </div>

                            <window.WeatherWidget />
                        </>
                    )}
                </div>

                <div className="flex flex-col flex-1 pb-10 relative">
                    {/* STICKY FLIKAR PÅ DESKTOP */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between px-4 border-b border-zinc-200 dark:border-white/10 gap-3 sm:gap-0 sticky top-0 z-20 bg-zinc-50/90 dark:bg-[#0f1522]/90 backdrop-blur-md pt-2">
                        <div className="flex space-x-2">
                            {filters.map(f => (
                                <button 
                                    key={f} 
                                    data-tab={f} 
                                    onClick={() => setActiveFilter(f)} 
                                    className={`py-3 px-5 text-[11px] font-bold uppercase tracking-widest transition-all whitespace-nowrap relative ${activeFilter === f ? 'text-orange-500' : 'text-zinc-400 dark:text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300 hover:bg-zinc-100/50 dark:hover:bg-white/5 rounded-t-lg'}`}
                                >
                                    {f}
                                    {(statusCounts[f] || 0) > 0 && (
                                        <span className={`ml-2 px-1.5 py-0.5 rounded-md text-[9px] transition-colors ${activeFilter === f ? 'bg-orange-50 dark:bg-orange-500/10 text-orange-600 dark:text-orange-400' : 'bg-zinc-100 dark:bg-white/5 text-zinc-500'}`}>
                                            {statusCounts[f]}
                                        </span>
                                    )}
                                    {activeFilter === f && (
                                        <span className="absolute bottom-[-1px] left-0 right-0 h-[3px] bg-orange-500 rounded-t-full shadow-[0_0_8px_rgba(249,115,22,0.4)]"></span>
                                    )}
                                </button>
                            ))}
                        </div>

                        <div className="relative group mb-2 sm:mb-0 shrink-0">
                            <input 
                                type="text" 
                                placeholder="SÖK I LISTAN..." 
                                className="bg-white dark:bg-[#1a2235]/50 border border-zinc-200 dark:border-white/10 focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 py-2 pl-9 pr-8 text-[11px] font-bold text-zinc-900 dark:text-white outline-none w-full sm:w-64 transition-all uppercase tracking-widest placeholder:text-zinc-400 rounded-lg shadow-sm"
                                value={globalSearch}
                                onChange={(e) => setGlobalSearch(e.target.value)}
                            />
                            <window.Icon name="search" size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400 group-focus-within:text-orange-500 group-focus-within:rotate-90 transition-all duration-300" />
                            
                            {globalSearch && (
                                <button 
                                    onClick={() => setGlobalSearch('')}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-red-500 bg-zinc-50 dark:bg-black/30 hover:bg-red-50 dark:hover:bg-red-500/20 rounded-md p-0.5 transition-colors"
                                    title="Rensa sökning"
                                >
                                    <window.Icon name="x" size={12} />
                                </button>
                            )}
                        </div>
                    </div>

                    <div className="bg-white/80 dark:bg-[#182032]/80 backdrop-blur-xl rounded-b-3xl shadow-sm border border-t-0 border-zinc-200/80 dark:border-white/5 overflow-hidden flex flex-col min-h-[500px]">
                        <div className="flex-1 overflow-auto custom-scrollbar">
                            <table className="w-full text-left border-collapse">
                                <thead className="bg-zinc-50/80 dark:bg-white/5 text-zinc-500 dark:text-zinc-500 text-[10px] uppercase tracking-widest font-bold border-b border-zinc-200 dark:border-white/10">
                                    <tr>
                                        {/* Justerade gap och items-center för perfekt linjering i header */}
                                        <th className="pl-8 pr-4 py-4 w-[25%] cursor-pointer hover:text-orange-500 transition-colors select-none group" onClick={() => requestSort('kundnamn')}>
                                            <div className="flex items-center gap-1.5">
                                                Kund
                                                <window.Icon name={sortConfig.key === 'kundnamn' ? (sortConfig.direction === 'asc' ? 'chevron-up' : 'chevron-down') : 'chevrons-up-down'} size={12} className={`shrink-0 ${sortConfig.key === 'kundnamn' ? "text-orange-500" : "opacity-30 group-hover:opacity-100 transition-opacity"}`} />
                                            </div>
                                        </th>
                                        <th className="px-4 py-4 w-[15%] cursor-pointer hover:text-orange-500 transition-colors select-none group" onClick={() => requestSort('paket')}>
                                            <div className="flex items-center gap-1.5">
                                                Service Typ
                                                <window.Icon name={sortConfig.key === 'paket' ? (sortConfig.direction === 'asc' ? 'chevron-up' : 'chevron-down') : 'chevrons-up-down'} size={12} className={`shrink-0 ${sortConfig.key === 'paket' ? "text-orange-500" : "opacity-30 group-hover:opacity-100 transition-opacity"}`} />
                                            </div>
                                        </th>
                                        <th className="px-4 py-4 w-[15%] cursor-pointer hover:text-orange-500 transition-colors select-none group" onClick={() => requestSort('regnr')}>
                                            <div className="flex items-center gap-1.5">
                                                Reg.nr
                                                <window.Icon name={sortConfig.key === 'regnr' ? (sortConfig.direction === 'asc' ? 'chevron-up' : 'chevron-down') : 'chevrons-up-down'} size={12} className={`shrink-0 ${sortConfig.key === 'regnr' ? "text-orange-500" : "opacity-30 group-hover:opacity-100 transition-opacity"}`} />
                                            </div>
                                        </th>
                                        <th className="px-4 py-4 w-[15%] cursor-pointer hover:text-orange-500 transition-colors select-none group" onClick={() => requestSort('datum')}>
                                            <div className="flex items-center gap-1.5">
                                                Bokat datum
                                                <window.Icon name={sortConfig.key === 'datum' ? (sortConfig.direction === 'asc' ? 'chevron-up' : 'chevron-down') : 'chevrons-up-down'} size={12} className={`shrink-0 ${sortConfig.key === 'datum' ? "text-orange-500" : "opacity-30 group-hover:opacity-100 transition-opacity"}`} />
                                            </div>
                                        </th>
                                        <th className="px-4 py-4 w-[15%] cursor-pointer hover:text-orange-500 transition-colors select-none group" onClick={() => requestSort('status')}>
                                            <div className="flex items-center gap-1.5">
                                                Status
                                                <window.Icon name={sortConfig.key === 'status' ? (sortConfig.direction === 'asc' ? 'chevron-up' : 'chevron-down') : 'chevrons-up-down'} size={12} className={`shrink-0 ${sortConfig.key === 'status' ? "text-orange-500" : "opacity-30 group-hover:opacity-100 transition-opacity"}`} />
                                            </div>
                                        </th>
                                        <th className="px-4 py-4 w-[15%] text-right cursor-pointer hover:text-orange-500 transition-colors select-none group" onClick={() => requestSort('kundpris')}>
                                            <div className="flex items-center justify-end gap-1.5">
                                                Pris
                                                <window.Icon name={sortConfig.key === 'kundpris' ? (sortConfig.direction === 'asc' ? 'chevron-up' : 'chevron-down') : 'chevrons-up-down'} size={12} className={`shrink-0 ${sortConfig.key === 'kundpris' ? "text-orange-500" : "opacity-30 group-hover:opacity-100 transition-opacity"}`} />
                                            </div>
                                        </th>
                                        <th className="pl-4 pr-8 py-4 w-[10%] text-right"></th>
                                    </tr>
                                </thead>
                                
                                {visibleJobs.length === 0 ? (
                                    <tbody>
                                        <tr>
                                            <td colSpan="7" className="py-32 text-center">
                                                <div className="flex flex-col items-center justify-center text-zinc-400">
                                                    <div className="w-20 h-20 mb-4 rounded-full bg-zinc-100 dark:bg-white/5 flex items-center justify-center">
                                                        <window.Icon name="inbox" size={32} className="opacity-50" />
                                                    </div>
                                                    <span className="text-[14px] font-bold text-zinc-600 dark:text-zinc-300 uppercase tracking-widest mb-1">Inga uppdrag hittades</span>
                                                    <span className="text-[11px] text-zinc-400">Prova att ändra sökning eller byta flik.</span>
                                                </div>
                                            </td>
                                        </tr>
                                    </tbody>
                                ) : (
                                    <tbody className="divide-y divide-zinc-100 dark:divide-white/5 relative z-10">
                                        {visibleJobs.map((job, index) => {
                                            const dateText = formatDate(job.datum);
                                            const isUrgent = ['IDAG', 'IMORGON'].includes(dateText) && job.status !== 'KLAR';
                                            const regDisplay = job.regnr || job.bilmodell || '-';
                                            const isReg = regDisplay.length <= 8 && /\d/.test(regDisplay);
                                            const isDone = ['KLAR', 'FAKTURERAS'].includes(job.status);
                                            const price = parseInt(job.kundpris) || 0;

                                            return (
                                                <tr 
                                                    key={job.id} 
                                                    onClick={() => job.regnr ? handleOpenHistory(job.regnr, job.id, job) : null}
                                                    // Svävande 3D-effekt vid hover
                                                    className={`group transition-all duration-300 cursor-pointer relative bg-transparent hover:bg-white dark:hover:bg-[#1f2940] hover:shadow-lg hover:-translate-y-[1px] hover:z-20 border-b border-zinc-100 dark:border-white/5 last:border-0 ${isDone ? 'opacity-70 hover:opacity-100' : ''}`}
                                                >
                                                    <td className="pl-7 pr-4 py-4 align-middle relative rounded-l-xl">
                                                        <div className="absolute left-0 top-0 bottom-0 w-[3px] bg-orange-500 opacity-0 group-hover:opacity-100 transition-opacity rounded-r-full shadow-[0_0_8px_rgba(249,115,22,0.5)]"></div>
                                                        
                                                        <div className="flex items-center gap-4 group-hover:translate-x-1 transition-transform duration-300">
                                                            <window.CustomerAvatar job={job} />
                                                            <div>
                                                                <div className="text-[14px] font-bold text-zinc-900 dark:text-white leading-none mb-1.5 group-hover:text-orange-500 transition-colors">{job.kundnamn}</div>
                                                                <div className="flex items-center gap-2">
                                                                    <span className="text-[10px] font-mono font-medium text-zinc-400 dark:text-zinc-500 uppercase tracking-widest"><window.Icon name="hash" size={10} className="inline mr-1 -mt-0.5" />{job.id.substring(0,6)}</span>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="px-4 py-4 align-middle">
                                                        <div className="flex flex-col min-w-0">
                                                            <span className="text-[13px] font-bold text-zinc-700 dark:text-zinc-300 transition-colors group-hover:text-zinc-900 dark:group-hover:text-white">
                                                                {job.paket === 'Oljebyte' && job.oljevolym ? `Oljebyte ${job.oljevolym}l` : (job.paket || 'Standard')}
                                                            </span>
                                                            
                                                            {job.kommentar && (
                                                                <div className="flex items-center gap-1.5 text-[11px] text-zinc-500 dark:text-zinc-400 mt-1 italic truncate max-w-[140px]">
                                                                    <window.Icon name="message-square" size={10} className="shrink-0" />
                                                                    <span className="truncate">{job.kommentar}</span>
                                                                </div>
                                                            )}
                                                        </div>
                                                    </td>
                                                    <td className="px-4 py-4 align-middle">
                                                        <div 
                                                            onClick={(e) => handleCopyDesktop(e, regDisplay, job.id)} 
                                                            title="Kopiera Reg.nr"
                                                            className={`inline-flex items-center justify-start rounded-[4px] border overflow-hidden w-[110px] h-[30px] cursor-pointer hover:border-orange-500 group/copy relative ${isReg ? 'bg-zinc-50 dark:bg-[#1a2235] border-zinc-200 dark:border-[#2a3441]' : 'bg-transparent border-transparent'} transition-all`}
                                                        >
                                                            {copiedRegId === job.id && (
                                                                <div className="absolute inset-0 bg-emerald-500 flex items-center justify-center text-white z-20 animate-in slide-in-from-bottom-2 duration-200">
                                                                    <window.Icon name="check" size={14} />
                                                                </div>
                                                            )}
                                                            {isReg ? (
                                                                <>
                                                                    <div className="w-[16px] bg-[#003399] flex flex-col items-center justify-between py-[2px] shrink-0 border-r border-zinc-200 dark:border-[#2a3441]">
                                                                        <div className="w-2 h-2 rounded-full border-[1px] border-[#ffcc00] mt-[1px]"></div>
                                                                        <span className="text-[9px] font-sans font-black text-white leading-none antialiased mb-[1px]">S</span>
                                                                    </div>
                                                                    <div className="flex-1 flex items-center justify-center bg-white dark:bg-transparent">
                                                                        <span className="font-mono font-black text-[14px] text-zinc-900 dark:text-zinc-200 tracking-[0.15em] leading-none pt-[2px] group-hover/copy:text-orange-600 dark:group-hover/copy:text-orange-400 transition-colors">{regDisplay}</span>
                                                                    </div>
                                                                </>
                                                            ) : (
                                                                <div className="flex-1 flex items-center justify-start px-1">
                                                                    <span className="font-mono font-bold text-[12px] text-zinc-500 tracking-widest uppercase truncate leading-none pt-[2px] group-hover/copy:text-orange-500 transition-colors">{regDisplay}</span>
                                                                </div>
                                                            )}
                                                        </div>
                                                    </td>
                                                    <td className="px-4 py-4 align-middle">
                                                        {job.datum ? (
                                                            <div className="flex items-center gap-2.5">
                                                                {isUrgent && (
                                                                    <span className="relative flex h-2 w-2 shrink-0">
                                                                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-orange-400 opacity-75"></span>
                                                                        <span className="relative inline-flex rounded-full h-2 w-2 bg-orange-500 shadow-[0_0_8px_rgba(249,115,22,0.8)]"></span>
                                                                    </span>
                                                                )}
                                                                <div>
                                                                    <div className={`text-[12px] font-bold uppercase tracking-wide ${isUrgent ? 'text-orange-600' : 'text-zinc-800 dark:text-zinc-300 group-hover:text-zinc-900 dark:group-hover:text-white transition-colors'}`}>{dateText}</div>
                                                                    <div className={`text-[11px] font-mono mt-0.5 ${job.datum.includes('00:00') ? 'text-zinc-300 dark:text-zinc-600' : 'text-zinc-400 dark:text-zinc-500'}`}>{job.datum.split('T')[1]}</div>
                                                                </div>
                                                            </div>
                                                        ) : <span className="text-[10px] font-bold text-red-500 bg-red-50 dark:bg-red-500/10 px-2 py-1 rounded-md uppercase tracking-widest">Inväntar</span>}
                                                    </td>
                                                    <td className="px-4 py-4 align-middle">
                                                        <window.Badge status={job.status} />
                                                    </td>
                                                    <td className="px-4 py-4 align-middle text-right">
                                                        <div className="flex flex-col items-end">
                                                            <div className={`font-mono font-light tracking-tighter text-[18px] leading-none tabular-nums transition-colors ${price > 10000 ? 'font-medium text-zinc-900 dark:text-white' : 'text-zinc-700 dark:text-zinc-200 group-hover:text-zinc-900 dark:group-hover:text-white'}`}>
                                                                {price.toLocaleString('sv-SE')} <span className="text-[10px] text-zinc-400 dark:text-zinc-500 font-sans tracking-widest uppercase font-bold ml-0.5">kr</span>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="pl-4 pr-8 py-4 align-middle text-right relative rounded-r-xl">
                                                        
                                                        <window.VehicleDataIcon job={job} isDesktop={true} />

                                                        {/* MJUKARE QUICK ACTIONS */}
                                                        <div className="opacity-0 group-hover:opacity-100 translate-x-4 group-hover:translate-x-0 transition-all duration-300 ease-out flex justify-end items-center gap-2 relative z-10 scale-95 group-hover:scale-100">
                                                            {job.status !== 'KLAR' && (
                                                                <button title="Markera Klar" onClick={(e) => { e.stopPropagation(); window.db.collection("jobs").doc(job.id).update({status: 'KLAR'}); }} className="w-9 h-9 flex items-center justify-center rounded-xl bg-white dark:bg-[#1a2235] border border-zinc-200 dark:border-white/5 text-zinc-400 hover:bg-emerald-50 dark:hover:bg-emerald-500/10 hover:border-emerald-200 dark:hover:border-emerald-500/30 hover:text-emerald-600 dark:hover:text-emerald-400 shadow-sm transition-all hover:scale-110 active:scale-95">
                                                                    <window.Icon name="check" size={16} />
                                                                </button>
                                                            )}
                                                            <button title="Redigera" onClick={() => {
                                                                setView('NEW_JOB', { job: job });
                                                                if (window.openVehicleProfile) {
                                                                    window.openVehicleProfile(job.regnr, job.id);
                                                                }
                                                            }}
                                                            className="w-9 h-9 flex items-center justify-center rounded-xl bg-white dark:bg-[#1a2235] border border-zinc-200 dark:border-white/5 text-zinc-400 hover:bg-blue-50 dark:hover:bg-blue-500/10 hover:border-blue-200 dark:hover:border-blue-500/30 hover:text-blue-600 dark:hover:text-blue-400 shadow-sm transition-all hover:scale-110 active:scale-95">
                                                                <window.Icon name="edit-2" size={16} />
                                                            </button>
                                                            <button title="Radera" onClick={(e) => { e.stopPropagation(); if(confirm("Radera?")) window.db.collection("jobs").doc(job.id).update({deleted:true}); }} className="w-9 h-9 flex items-center justify-center rounded-xl bg-white dark:bg-[#1a2235] border border-zinc-200 dark:border-white/5 text-zinc-400 hover:bg-red-50 dark:hover:bg-red-500/10 hover:border-red-200 dark:hover:border-red-500/30 hover:text-red-600 dark:hover:text-red-400 shadow-sm transition-all hover:scale-110 active:scale-95">
                                                                <window.Icon name="trash" size={16} />
                                                            </button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                )}
                            </table>
                            
                            {hasMore && (
                                <div className="flex justify-center p-6 border-t border-zinc-200 dark:border-white/5 bg-zinc-50/50 dark:bg-white/[0.02]">
                                    <button onClick={() => setVisibleCount(prev => prev + 20)} className="px-8 py-3 bg-white dark:bg-[#1a2235] border border-zinc-200 dark:border-white/10 hover:bg-zinc-50 dark:hover:bg-white/5 hover:border-orange-500/30 text-zinc-600 dark:text-zinc-300 hover:text-orange-500 text-[11px] font-bold uppercase tracking-widest rounded-xl shadow-sm hover:shadow-md transition-all flex items-center gap-2 active:scale-95">
                                        Ladda in fler <span className="opacity-50 font-medium">({sortedAndFilteredJobs.length - visibleCount} kvar)</span>
                                    </button>
                                </div>
                            )}

                        </div>
                    </div>
                </div>
            </div>

            {/* --- MOBILE VY --- */}
            <div
                className="lg:hidden flex flex-col min-h-screen bg-zinc-50/50 dark:bg-[#0f1522] touch-pan-y transition-colors duration-500"
                onTouchStart={onTouchStart} onTouchEnd={onTouchEnd}
            >
                <div className="bg-white/95 dark:bg-[#182032]/95 backdrop-blur-2xl text-zinc-900 dark:text-white pt-safe-top pt-2 sticky top-0 z-40 shadow-sm border-b border-zinc-200 dark:border-white/10 transition-colors duration-300 relative">
                    
                    <div className="px-4 pb-4 pt-2 flex items-center justify-between border-b border-zinc-100 dark:border-white/5">
                        
                        <div className="flex items-center gap-4">
                            <div className="relative group cursor-default shrink-0">
                                <div className="absolute inset-0 bg-orange-500/40 blur-xl rounded-full transition-all duration-700" />
                                <div className="relative w-12 h-12 rounded-xl flex items-center justify-center text-white shadow-md border border-white/20 bg-gradient-to-br from-orange-400 to-orange-600">
                                    <window.Icon name="grid" size={24} />
                                </div>
                            </div>
                            <div className="flex flex-col">
                                <h1 className="text-xl font-black text-zinc-900 dark:text-white uppercase tracking-tight leading-none drop-shadow-sm dark:drop-shadow-none">
                                    DASH<span className="text-zinc-400 dark:text-zinc-500 font-light">BOARD</span>
                                </h1>
                                <p className="text-[9px] font-bold text-orange-500 uppercase tracking-widest mt-1 flex items-center gap-1.5">
                                    <span className="w-1.5 h-1.5 rounded-full bg-orange-500 animate-pulse"></span>
                                    {getHeaderDate()}
                                </p>
                            </div>
                        </div>

                        <div className="flex items-center gap-2">
                            <button 
                                onClick={() => setShowMobileWidgets(!showMobileWidgets)} 
                                className={`w-10 h-10 flex items-center justify-center rounded-xl transition-all border ${showMobileWidgets ? 'bg-orange-500 text-white border-orange-500 shadow-md' : 'bg-zinc-100 dark:bg-[#1a2235] text-zinc-500 dark:text-zinc-400 hover:text-orange-500 hover:bg-orange-50 dark:hover:bg-orange-500/10 dark:hover:text-white border-transparent dark:border-white/5'}`}
                            >
                                <window.Icon name={showMobileWidgets ? "chevron-up" : "layout-dashboard"} size={18} />
                            </button>
                            <button 
                                onClick={() => window.dispatchEvent(new CustomEvent('open-spotlight'))} 
                                className="w-10 h-10 flex items-center justify-center rounded-xl bg-zinc-100 dark:bg-[#1a2235] text-zinc-500 dark:text-zinc-400 hover:text-orange-500 dark:hover:text-white transition-colors border border-transparent dark:border-white/5 active:scale-90"
                            >
                                <window.Icon name="search" size={18} />
                            </button>
                        </div>
                    </div>

                    <div
                        ref={tabsRef}
                        className="flex overflow-x-auto px-4 pt-2 pb-0 space-x-4 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none] scroll-smooth"
                        onTouchStart={(e) => e.stopPropagation()}
                        onTouchMove={(e) => e.stopPropagation()}
                        onTouchEnd={(e) => e.stopPropagation()}
                    >
                        {filters.map(f => {
                            const isActive = activeFilter === f;
                            const count = statusCounts[f] || 0;
                            return (
                                <button key={f} data-tab={f} onClick={() => { setActiveFilter(f); setShowMobileWidgets(false); }} className={`py-3 px-1 text-[11px] font-bold uppercase tracking-widest transition-all border-b-2 whitespace-nowrap relative ${isActive ? 'text-orange-500 border-orange-500' : 'text-zinc-400 dark:text-zinc-500 border-transparent'}`}>
                                    {f}
                                    {count > 0 && <span className={`ml-2 px-1.5 py-0.5 rounded-md text-[9px] ${isActive ? 'bg-orange-50 dark:bg-orange-500/10 text-orange-600 dark:text-orange-400' : 'bg-zinc-100 dark:bg-white/5 text-zinc-500'}`}>{count}</span>}
                                </button>
                            );
                        })}
                    </div>

                    {showMobileWidgets && (
                        <div className="absolute top-full left-0 right-0 bg-zinc-50/95 dark:bg-[#0f1522]/95 backdrop-blur-3xl shadow-[0_20px_40px_rgba(0,0,0,0.15)] dark:shadow-[0_20px_40px_rgba(0,0,0,0.5)] border-b border-zinc-200 dark:border-white/10 p-4 pt-5 animate-in slide-in-from-top-2 fade-in duration-200 max-h-[75vh] overflow-y-auto custom-scrollbar z-50">
                            <window.DashboardWidgets allJobs={allJobs} />
                        </div>
                    )}
                </div>

                {activeFilter === 'FAKTURERAS' && invoiceStats.total > 0 && (
                    <div className="mx-3 mt-4 mb-2 p-4 rounded-2xl bg-white/90 dark:bg-[#182032]/90 backdrop-blur-xl border border-zinc-200/80 dark:border-white/5 shadow-sm relative overflow-hidden animate-in fade-in slide-in-from-top-2 duration-300">
                        <div className="absolute right-0 top-0 w-32 h-32 bg-orange-500/10 blur-[50px] rounded-full pointer-events-none"></div>
                        
                        {/* Övre summeringen */}
                        <div className="flex items-center justify-between relative z-10">
                            <div>
                                <h3 className="text-[9px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-widest mb-1 flex items-center gap-1.5">
                                    <window.Icon name="pie-chart" size={10} className="text-orange-500" /> Att Fakturera
                                </h3>
                                <div className="text-2xl font-light text-zinc-900 dark:text-white tracking-tighter leading-none">
                                    {invoiceStats.total.toLocaleString('sv-SE')} <span className="text-[10px] font-bold text-zinc-400 dark:text-zinc-600 uppercase tracking-widest ml-0.5">kr</span>
                                </div>
                            </div>
                            <div className="text-right">
                                <span className="text-[10px] font-medium bg-zinc-50 dark:bg-black/30 text-zinc-600 dark:text-zinc-300 px-2.5 py-1.5 rounded-lg border border-zinc-200/80 dark:border-white/5 flex items-center gap-1.5">
                                    <window.Icon name="users" size={10} /> {invoiceStats.topCustomers.length} Kunder
                                </span>
                            </div>
                        </div>

                        {/* NY DEL: Kund-översikt för mobil */}
                        <div className="relative z-10 mt-4 pt-4 border-t border-zinc-100 dark:border-white/5">
                            <div className="space-y-3.5">
                                {/* Visar de 5 största kunderna på mobilen för att spara plats */}
                                {invoiceStats.topCustomers.slice(0, 5).map(([name, amount], idx) => {
                                    const percentage = invoiceStats.total > 0 ? Math.round((amount / invoiceStats.total) * 100) : 0;
                                    return (
                                        <div key={idx} className="flex flex-col gap-1.5">
                                            <div className="flex justify-between items-end text-[12px] font-medium text-zinc-800 dark:text-zinc-200 leading-none">
                                                <span className="truncate pr-2">{name}</span>
                                                <span className="font-mono font-bold shrink-0">
                                                    {amount.toLocaleString('sv-SE')} <span className="text-[9px] text-zinc-400 font-sans tracking-widest">kr</span>
                                                </span>
                                            </div>
                                            <div className="h-1.5 w-full bg-zinc-100 dark:bg-black/40 rounded-full overflow-hidden">
                                                <div 
                                                    className="h-full bg-gradient-to-r from-orange-500 to-orange-400 rounded-full transition-all duration-1000 ease-out" 
                                                    style={{ width: `${percentage}%` }}
                                                ></div>
                                            </div>
                                        </div>
                                    );
                                })}
                                
                                {/* Om det finns fler än 5 kunder, visa hur många som är dolda */}
                                {invoiceStats.topCustomers.length > 5 && (
                                    <div className="text-[10px] font-bold uppercase tracking-widest text-center text-zinc-400 dark:text-zinc-500 pt-1">
                                        + {invoiceStats.topCustomers.length - 5} fler kunder
                                    </div>
                                )}
                            </div>
                        </div>
                        
                    </div>
                )}

                <div className="px-3 pt-1 pb-6 flex flex-col">
                    {sortedAndFilteredJobs.length > 0 ? (
                        <>
                            {(() => {
                                let lastDate = null;
                                return visibleJobs.map((job, index) => { 
                                const currentDate = job.datum ? formatDate(job.datum) : 'INVÄNTAR DATUM';
                                const showHeader = currentDate !== lastDate;
                                lastDate = currentDate;

                                return (
                                    <React.Fragment key={job.id}>
                                        {showHeader && (
                                            <div className={`${index === 0 ? 'mt-3' : 'mt-6'} mb-3 px-2 flex items-center gap-2 animate-in fade-in duration-300`}>
                                                <div className="h-4 w-1 bg-gradient-to-b from-orange-400 to-orange-600 rounded-full shadow-[0_0_8px_rgba(249,115,22,0.5)]" />
                                                <h3 className="text-[12px] font-bold text-zinc-900 dark:text-white uppercase tracking-widest flex items-center gap-2">
                                                    {currentDate}
                                                </h3>
                                            </div>
                                        )}
                                        <MobileJobCard job={job} setView={setView} onOpenHistory={handleOpenHistory} />
                                    </React.Fragment>
                                );
                            });
                        })()}
                        
                        {hasMore && (
                            <div className="mt-2 mb-6 px-1">
                                <button onClick={() => setVisibleCount(prev => prev + 20)} className="w-full py-4 bg-white dark:bg-[#182032] border border-zinc-200 dark:border-white/5 hover:border-orange-500/50 text-zinc-700 dark:text-zinc-300 hover:text-orange-500 text-[12px] font-bold uppercase tracking-widest rounded-2xl shadow-sm active:scale-95 transition-all">
                                    Ladda in fler ({sortedAndFilteredJobs.length - visibleCount} kvar)
                                </button>
                            </div>
                        )}
                    </>
                ) : (
                    <div className="flex flex-col items-center justify-center py-24 text-zinc-400">
                        <div className="w-20 h-20 mb-4 rounded-full bg-zinc-100 dark:bg-white/5 flex items-center justify-center">
                            <window.Icon name="inbox" size={32} className="opacity-50" />
                        </div>
                        <span className="text-[14px] font-bold text-zinc-600 dark:text-zinc-300 uppercase tracking-widest mb-1">Inga uppdrag hittades</span>
                        <span className="text-[11px] text-zinc-400">Prova att ändra sökning eller byta flik.</span>
                    </div>
                )}
                </div>
            </div>
        </div>
    );
}, dashboardPropsAreEqual);
