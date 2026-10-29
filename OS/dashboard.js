// dashboard.js

const APP_CONFIG = {
    weather: { name: 'Eslöv', lat: '55.8390', lon: '13.3034' }
};

const formatTime = (dateStr) => {
    if (!dateStr || !dateStr.includes('T')) return "";
    const currentYear = new Date().getFullYear().toString();
    
    if (!dateStr.startsWith(currentYear)) {
        return "";
    }
    
    return dateStr.split('T')[1].substring(0, 5); 
};

const formatDate = (dateStr) => {
    if (!dateStr) return "";
    const targetDate = new Date(dateStr);
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const isSameDay = (d1, d2) => d1.getFullYear() === d2.getFullYear() && d1.getMonth() === d2.getMonth() && d1.getDate() === d2.getDate();

    if (isSameDay(targetDate, today)) return "IDAG";
    if (isSameDay(targetDate, tomorrow)) return "IMORGON";

    const months = ['JAN', 'FEB', 'MAR', 'APR', 'MAJ', 'JUN', 'JUL', 'AUG', 'SEP', 'OKT', 'NOV', 'DEC'];
    const day = targetDate.getDate();
    const month = months[targetDate.getMonth()];
    
    if (targetDate.getFullYear() !== today.getFullYear()) {
        return `${day} ${month}, ${targetDate.getFullYear()}`;
    }
    
    return `${day} ${month}`;
};

// FIX: Säkrare HTML-rensning med inbyggd DOMParser (avkodar även &amp; korrekt)
const stripHtml = (html) => {
    if (!html) return '';
    try {
        const doc = new DOMParser().parseFromString(html, 'text/html');
        const text = doc.body.textContent || "";
        const doc2 = new DOMParser().parseFromString(text, 'text/html');
        return doc2.body.textContent || text;
    } catch (e) {
        return String(html).replace(/<[^>]*>?/gm, '').replace(/&amp;/g, '&').trim();
    }
};

// 2. PREMIUM STATUS BADGE (Uppdaterad storlek)
window.Badge = React.memo(({ status }) => {
    const s = (status || 'BOKAD').toUpperCase();
    const styles = {
        'BOKAD': 'text-orange-600 dark:text-orange-400',
        'OFFERERAD': 'text-blue-600 dark:text-blue-400',
        'KLAR': 'text-[#00b074] dark:text-emerald-400', // Starkare, krispigare grön
        'FAKTURERAS': 'text-[#0096c7] dark:text-sky-400 decoration-[#0096c7]/50 underline-offset-2' // Tydligare blå
    };
    const textStyle = styles[s] || 'text-zinc-700 dark:text-zinc-300';
    return (
        <span className={`text-[13px] font-medium uppercase tracking-wide inline-flex items-center ${textStyle}`}>
            {s}
        </span>
    );
});

// --- WIDGET: AKTIVITET (12 MÅN) & VÄDER (COMBINED) ---
window.ActivityAndWeatherWidget = React.memo(({ allJobs }) => {
    const [showWeather, setShowWeather] = React.useState(false);
    const [hoveredIdx, setHoveredIdx] = React.useState(null);

    const [weatherData, setWeatherData] = React.useState([]);
    const [loadingWeather, setLoadingWeather] = React.useState(true);
    const [weatherError, setWeatherError] = React.useState(false);

    React.useEffect(() => {
        // FIX: Använder dynamisk config
        const url = `https://opendata-download-metfcst.smhi.se/api/category/snow1g/version/1/geotype/point/lon/${APP_CONFIG.weather.lon}/lat/${APP_CONFIG.weather.lat}/data.json`;

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
                
                const formattedData = dailyData.slice(0, 5).map((day, index) => {
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
                setLoadingWeather(false);
            } catch (err) {
                setWeatherError(true);
                setLoadingWeather(false);
            }
        };

        fetchWeather();
        const interval = setInterval(fetchWeather, 3600000); 
        return () => clearInterval(interval);
    }, []);

    const chartData = React.useMemo(() => {
        const now = new Date();
        now.setHours(0, 0, 0, 0); 
        const data = [];
        const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'Maj', 'Jun', 'Jul', 'Aug', 'Sep', 'Okt', 'Nov', 'Dec'];
        
        for (let i = 29; i >= 0; i--) {
            const d = new Date(now);
            d.setDate(d.getDate() - i);
            const dateStr = d.toISOString().split('T')[0];
            
            data.push({ 
                label: `${d.getDate()} ${monthNames[d.getMonth()]}`, 
                dateStr: dateStr, 
                count: 0 
            });
        }
        
        allJobs.forEach(job => {
            if (!job.datum || job.deleted) return;
            const jobDateStr = job.datum.split('T')[0];
            
            const targetIndex = data.findIndex(d => d.dateStr === jobDateStr);
            if (targetIndex !== -1) {
                data[targetIndex].count++;
            }
        });
        
        const max = Math.max(...data.map(d => d.count), 5);
        return { data, max };
    }, [allJobs]);

    const { data, max } = chartData;
    
    const points = data.map((d, i) => ({ 
        x: (i / 29) * 100, 
        y: 90 - (d.count / max) * 75 
    }));
    
    let linePath = `M ${points[0].x},${points[0].y}`;
    for (let i = 0; i < points.length - 1; i++) {
        const p0 = points[i === 0 ? 0 : i - 1];
        const p1 = points[i];
        const p2 = points[i + 1];
        const p3 = points[i + 2 === points.length ? i + 1 : i + 2];
        
        const cp1x = p1.x + (p2.x - p0.x) / 6;
        const cp1y = p1.y + (p2.y - p0.y) / 6;
        const cp2x = p2.x - (p3.x - p1.x) / 6;
        const cp2y = p2.y - (p3.y - p1.y) / 6;
        
        linePath += ` C ${cp1x},${cp1y} ${cp2x},${cp2y} ${p2.x},${p2.y}`;
    }
    
    const areaPath = `${linePath} L 100,100 L 0,100 Z`;
    const totalJobs = data.reduce((sum, d) => sum + d.count, 0);

    React.useEffect(() => {
        if (window.lucide) window.lucide.createIcons();
    }, [showWeather, weatherData]);

    return (
        <div className="bg-white dark:bg-[#1e293b] rounded-3xl border border-zinc-200 dark:border-white/10 p-5 shadow-lg dark:shadow-[0_10px_30px_rgba(0,0,0,0.5)] relative overflow-hidden group hover:shadow-xl hover:shadow-orange-500/5 dark:hover:shadow-[0_10px_40px_rgba(249,115,22,0.1)] transition-all duration-300 flex flex-col min-h-[170px] justify-between">
            
            <div className={`absolute right-0 top-0 w-32 h-32 blur-3xl rounded-full pointer-events-none transition-colors duration-500 ${showWeather ? 'bg-sky-500/10 group-hover:bg-sky-500/20' : 'bg-orange-500/5 group-hover:bg-orange-500/10'}`}></div>
            
            <div className="relative z-10 flex items-center justify-between mb-2">
                <div className={`text-[10px] font-bold uppercase tracking-widest flex items-center gap-2 transition-colors ${showWeather ? 'text-sky-500' : 'text-orange-500 dark:text-orange-400'}`}>
                    <window.Icon name={showWeather ? "cloud-sun" : "activity"} size={12} /> 
                    {showWeather ? `Prognos ${APP_CONFIG.weather.name}` : 'Uppdrag (Senaste 30d)'}
                </div>
                
                <button 
                    onClick={() => setShowWeather(!showWeather)} 
                    className={`w-7 h-7 flex items-center justify-center rounded-lg border shadow-sm transition-all active:scale-90 ${showWeather ? 'bg-orange-50 text-orange-500 border-orange-200 dark:bg-sky-500/10 dark:border-sky-500/20 dark:text-sky-400' : 'bg-sky-50 text-sky-500 border-sky-200 dark:bg-orange-500/10 dark:border-orange-500/20 dark:text-orange-400'}`}
                    title={showWeather ? 'Visa Diagram' : 'Visa Väder'}
                >
                    <window.Icon name={showWeather ? "activity" : "cloud-sun"} size={12} />
                </button>
            </div>

            <div className="relative z-10 flex-1 flex flex-col w-full">
                {showWeather ? (
                    <div className="flex items-end justify-between gap-1 w-full h-full pb-1 animate-in fade-in zoom-in-95 duration-300 mt-2">
                        {loadingWeather ? (
                            <div className="w-full text-center text-[10px] text-zinc-400 uppercase tracking-widest py-4">Hämtar data...</div>
                        ) : weatherError ? (
                            <div className="w-full text-center text-[10px] text-red-400 uppercase tracking-widest py-4">Kunde inte nå SMHI</div>
                        ) : (
                            weatherData.map((w, i) => (
                                <div key={i} className="flex flex-col items-center justify-end flex-1 cursor-default group/day">
                                    <span className={`text-[8px] font-bold uppercase tracking-widest mb-1.5 transition-all ${i === 0 ? 'text-sky-500' : 'text-zinc-400 group-hover/day:text-zinc-800 dark:group-hover/day:text-zinc-100 group-hover/day:-translate-y-0.5'}`}>
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
                ) : (
                    <div className="flex flex-col flex-1 animate-in fade-in zoom-in-95 duration-300 h-full" onMouseLeave={() => setHoveredIdx(null)}>
                        <div className="text-3xl sm:text-4xl font-light tracking-tighter text-zinc-900 dark:text-white leading-none">
                            {totalJobs} <span className="text-[12px] sm:text-sm font-bold text-zinc-400 uppercase tracking-widest ml-0.5">st</span>
                        </div>

                        <div className="relative w-full flex-1 mt-3 min-h-[65px]">
                            <div className="absolute inset-0 flex flex-col justify-between pointer-events-none pb-4 opacity-[0.15] dark:opacity-20">
                                <div className="w-full h-px border-t border-dashed border-zinc-500"></div>
                                <div className="w-full h-px border-t border-dashed border-zinc-500"></div>
                                <div className="w-full h-px border-t border-zinc-500"></div>
                            </div>

                            <svg viewBox="0 0 100 100" className="absolute inset-0 w-full h-full pb-4 overflow-visible" preserveAspectRatio="none">
                                <defs>
                                    <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="0%" stopColor="#f97316" stopOpacity="0.3" />
                                        <stop offset="100%" stopColor="#f97316" stopOpacity="0.0" />
                                    </linearGradient>
                                </defs>
                                
                                <path d={areaPath} fill="url(#chartGradient)" />
                                <path d={linePath} fill="none" stroke="#f97316" strokeWidth="2.5" vectorEffect="non-scaling-stroke" strokeLinecap="round" />

                                {points.map((p, i) => (
                                    <g key={i} className={`transition-opacity duration-200 ${hoveredIdx === i ? 'opacity-100' : 'opacity-0'}`}>
                                        <line x1={p.x} y1={p.y} x2={p.x} y2="100" stroke="#f97316" strokeWidth="1" strokeDasharray="2,2" vectorEffect="non-scaling-stroke" className="opacity-50" />
                                        <circle cx={p.x} cy={p.y} r="3" fill="#1e293b" stroke="#f97316" strokeWidth="2" vectorEffect="non-scaling-stroke" />
                                        <circle cx={p.x} cy={p.y} r="6" fill="#f97316" fillOpacity="0.2" vectorEffect="non-scaling-stroke" />
                                    </g>
                                ))}
                            </svg>

                            <div className="absolute inset-0 flex pb-4 z-20">
                                {data.map((d, i) => {
                                    let tooltipAlign = "-translate-x-1/2";
                                    if (i === 0) tooltipAlign = "translate-x-0";
                                    if (i === 29) tooltipAlign = "-translate-x-full"; 

                                    return (
                                        <div key={i} className="flex-1 h-full cursor-crosshair relative" onMouseEnter={() => setHoveredIdx(i)} onTouchStart={() => setHoveredIdx(i)}>
                                            {hoveredIdx === i && (
                                                <div 
                                                    className={`absolute top-[-25px] bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 px-2 py-1 rounded-lg shadow-xl pointer-events-none whitespace-nowrap z-30 flex items-center gap-1.5 animate-in zoom-in-95 duration-100 ${tooltipAlign}`} 
                                                    style={{ left: i === 0 ? '0' : i === 29 ? '100%' : '50%' }}
                                                >
                                                    <span className="font-mono font-bold text-[12px] leading-none">{d.count}</span>
                                                    <span className="text-[9px] font-bold uppercase tracking-widest text-zinc-400 dark:text-zinc-500 pt-[1px]">{d.label}</span>
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                            
                            <div className="absolute bottom-0 left-0 right-0 flex justify-between text-[8px] font-bold uppercase tracking-widest text-zinc-400 px-0.5">
                                {data.map((d, i) => (
                                    <span key={i} className={`transition-colors duration-200 ${hoveredIdx === i ? 'text-orange-500 scale-110' : ([0, 7, 15, 22, 29].includes(i) ? 'opacity-100' : 'opacity-0')}`}>
                                        {d.label.split(' ')[0]}
                                    </span>
                                ))}
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
});

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
            <div title="Teknisk fordonsdata finns sparad" className={`absolute right-6 top-1/2 -translate-y-1/2 flex items-center justify-center text-teal-600 dark:text-teal-400 transition-all duration-200 group-hover:opacity-0 pointer-events-none z-0 ${pulse ? 'animate-pulse drop-shadow-md' : ''}`}>
                <window.Icon name="wrench" size={16} />
            </div>
        );
    }

    // FIX: Samma rena ikon-look på mobilen som på datorn! Inga boxar.
    return (
        <div title="Teknisk data tillgänglig i garaget" className={`flex items-center justify-center text-teal-600 dark:text-teal-400 transition-all duration-200 pointer-events-none z-0 ${pulse ? 'animate-pulse drop-shadow-md' : ''}`}>
            <window.Icon name="wrench" size={15} />
        </div>
    );
});

const getAvatarTheme = (name) => {
    if (!name) return 'bg-zinc-100 text-zinc-600 border-zinc-200 dark:bg-[#1e293b] dark:text-zinc-300 dark:border-white/10';
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
                <div className="absolute -bottom-2 -right-2 w-[26px] h-[26px] bg-white dark:bg-[#1e293b] rounded-full border border-zinc-200 dark:border-white/10 shadow-sm flex items-center justify-center p-[3px] overflow-hidden animate-in zoom-in duration-300 z-20">
                    <img src={`https://cdn.simpleicons.org/${brand}`} className="w-full h-full object-contain opacity-80 dark:invert transition-opacity hover:opacity-100" alt={brand} onError={(e) => e.target.style.display = 'none'} />
                </div>
            ) : 
            hasDbData ? (
                <div title="Fordonsteknisk data hittad, men okänt märke" className="absolute -bottom-2 -right-2 w-[26px] h-[26px] bg-zinc-100 dark:bg-[#1e293b] rounded-full border border-zinc-200 dark:border-white/10 shadow-sm flex items-center justify-center overflow-hidden animate-in zoom-in duration-300 z-20 text-zinc-400">
                    <window.Icon name="car" size={14} /> 
                </div>
            ) : null}
        </div>
    );
});

// 3. MOBILKORTET
const mobileCardPropsAreEqual = (prev, next) => {
    return prev.job === next.job && prev.job.status === next.job.status && prev.job.datum === next.job.datum;
};

// FIX: Stramare och mer linjär "affärssystem"-design för mobilkortet
const MobileJobCard = React.memo(({ job, setView, onOpenHistory }) => {
    const [menuOpen, setMenuOpen] = React.useState(false);
    const [copied, setCopied] = React.useState(false);
    
    // NYTT: State för att hämta bilmodellen från fordonsregistret om den saknas på ordern
    const [displayModel, setDisplayModel] = React.useState(job.bilmodell || '');

    React.useEffect(() => {
        setDisplayModel(job.bilmodell || '');
        const regnr = job.regnr ? job.regnr.toUpperCase().trim() : null;
        if (!regnr || regnr === '-' || !window.db) return;

        const unsubscribe = window.db.collection('vehicleSpecs').doc(regnr).onSnapshot(doc => {
            if (doc.exists && doc.data().model) {
                setDisplayModel(doc.data().model);
            }
        });
        return () => unsubscribe();
    }, [job.regnr, job.bilmodell]);

    const isWaiting = !job.datum;
    const dateString = formatDate(job.datum);
    const isUrgentDate = ['IDAG', 'IMORGON'].includes(dateString);
    const isDone = ['KLAR', 'FAKTURERAS'].includes(job.status);

    const vehicleDisplay = job.regnr || job.bilmodell || '-';
    const isReg = vehicleDisplay.length <= 8 && /\d/.test(vehicleDisplay);
    const price = parseInt(job.kundpris) || 0;
    const paid = parseInt(job.betaltBelopp) || 0;
    const remaining = Math.max(0, price - paid);

    const handleCopy = React.useCallback((e) => {
        e.stopPropagation();
        if (!job.regnr || job.regnr === '-') return;
        navigator.clipboard.writeText(vehicleDisplay);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    }, [job.regnr, vehicleDisplay]);

    const handleCardClick = React.useCallback(() => {
        if (job.regnr) onOpenHistory(job.regnr, job.id, job);
    }, [job.regnr, job.id, job, onOpenHistory]);

    const handleMenuToggle = React.useCallback((e) => {
        e.stopPropagation();
        setMenuOpen(prev => !prev);
    }, []);

    return (
        <div
            onClick={handleCardClick}
            // FIX: Använder flex-col för att strukturera kortet och en lite djupare skugga för att lyfta det från bakgrunden
            className={`w-full relative active:scale-[0.98] transition-all duration-200 overflow-hidden mb-3.5 group cursor-pointer border rounded-xl bg-white dark:bg-[#1e293b] flex flex-col
                ${isDone ? 'opacity-70 grayscale-[0.2] border-zinc-200 dark:border-white/5 shadow-sm' : 
                  isUrgentDate ? 'border-orange-300 dark:border-orange-500/50 shadow-md shadow-orange-500/5' : 
                  'border-zinc-200/80 dark:border-white/10 shadow-md dark:shadow-[0_8px_30px_rgba(0,0,0,0.4)]'}
            `}
        >
            {/* ÖVRE DELEN (Kund, Status, Service Typ, Kommentar) */}
            <div className="p-3.5 relative z-10 flex flex-col">
                
                {/* RAD 1: Kund & Status/Meny */}
                <div className="flex justify-between items-start mb-3">
                    <div className="flex items-center gap-3 min-w-0 pr-2 flex-1">
                        <window.CustomerAvatar job={job} />
                        <div className="flex flex-col min-w-0 mt-0.5 flex-1">
                            <div className="flex items-center gap-2 min-w-0 flex-1">
                                <span className="text-[15px] font-bold tracking-tight truncate text-zinc-900 dark:text-white group-hover:text-orange-500 transition-colors shrink-0 max-w-[50%]">
                                    {job.kundnamn}
                                </span>
                                
                                {/* FIX: Tydligare textfärg för bilmodellen (skarpare kontrast) */}
                                {displayModel && displayModel !== '-' && (
                                    <span className="text-[12px] font-medium text-zinc-600 dark:text-zinc-300 truncate pt-[1.5px]">
                                        <span className="mr-1.5 text-zinc-300 dark:text-zinc-600 font-light">/</span>
                                        {displayModel.replace(/VOLKSWAGEN/i, 'VW').replace(/MERCEDES-BENZ/i, 'MB').replace(/MERCEDES/i, 'MB').replace(/LAND ROVER/i, 'LR')}
                                    </span>
                                )}
                            </div>
                        </div>
                    </div>
                    
                    <div className="flex items-center gap-1 shrink-0">
                        <div className="flex items-center gap-1.5 opacity-60 transform scale-[0.85] origin-right pr-1">
                            <window.VehicleDataIcon job={job} isDesktop={false} />
                            <window.Badge status={job.status} />
                        </div>
                        <div className="relative">
                            <button onClick={handleMenuToggle} className="w-8 h-8 flex items-center justify-center text-zinc-400 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white transition-colors hover:bg-zinc-100 dark:hover:bg-white/10 rounded-md active:scale-90 -mr-2">
                                <window.Icon name="more-horizontal" size={18} />
                            </button>
                            {menuOpen && (
                                <>
                                    <div className="fixed inset-0 z-40" onClick={(e) => { e.stopPropagation(); setMenuOpen(false); }}></div>
                                    <div className="absolute right-0 top-full mt-2 w-48 bg-white/95 dark:bg-[#1e293b]/95 backdrop-blur-xl rounded-2xl shadow-2xl border border-zinc-100 dark:border-white/10 z-50 p-2 overflow-hidden animate-in fade-in zoom-in-95 origin-top-right">
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

                {/* RAD 2: Service Typ & Kommentar (FIX: Ligger nu hela vägen till vänster, under loggan) */}
                <div className="flex flex-col min-w-0">
                    <span className="text-[13px] text-zinc-800 dark:text-zinc-200 truncate">
                        {job.paket === 'Oljebyte' && job.oljevolym ? `Oljebyte ${job.oljevolym}l` : (job.paket || 'Standard')}
                    </span>
                    {job.kommentar && (
                        <div className="flex items-start gap-2 text-[11px] text-zinc-800 dark:text-zinc-300 italic mt-2 bg-zinc-50 dark:bg-[#161f30] p-2.5 rounded-lg border border-zinc-200/80 dark:border-white/5">
                            <window.Icon name="message-square" size={11} className="shrink-0 mt-[1.5px] opacity-60 text-zinc-500" />                            <span className="line-clamp-2 leading-relaxed">
                                {stripHtml(job.kommentar)}
                            </span>
                        </div>
                    )}
                </div>
            </div>

            {/* FOTEN: Reg, Datum, Pris (FIX: Tydlig separator med ljusgrå bakgrundsfärg som bryter det vita) */}
            <div className="flex items-center justify-between px-3.5 py-2.5 border-t border-zinc-200 dark:border-white/10 bg-zinc-50/80 dark:bg-black/10 mt-auto">
                <div className="flex items-center gap-3 sm:gap-5 min-w-0 pr-2">
                    {/* Reg Plate */}
                    <div
                        onClick={handleCopy}
                        className={`inline-flex shrink-0 items-center rounded-[4px] border overflow-hidden h-[26px] relative transition-all active:scale-95 cursor-pointer
                            ${copied
                                ? 'border-emerald-400 ring-2 ring-emerald-400/20'
                                : isReg ? 'bg-white dark:bg-black/20 border-zinc-300 dark:border-white/10' : 'border-transparent'
                            }`}
                    >
                        {isReg ? (
                            <>
                                <div className="w-[14px] bg-[#003399] h-full flex flex-col items-center justify-between py-[1px] shrink-0 border-r border-zinc-200 dark:border-white/10">
                                    <div className="w-1.5 h-1.5 rounded-full border-[1px] border-[#ffcc00] mt-[1px]"></div>
                                    <span className="text-[6px] font-sans font-black text-white leading-none mb-[1px]">S</span>
                                </div>
                                <div className={`flex h-full items-center justify-center px-2 relative transition-colors ${copied ? 'bg-emerald-50 dark:bg-emerald-500/20' : 'bg-white dark:bg-transparent'}`}>
                                    <span className={`font-mono font-black text-[13px] tracking-[0.1em] leading-none pt-[1px] ${copied ? 'text-emerald-600 dark:text-emerald-400' : 'text-zinc-900 dark:text-zinc-100'}`}>
                                        {vehicleDisplay}
                                    </span>
                                </div>
                            </>
                        ) : (
                            <div className="px-1">
                                <span className={`font-mono font-bold text-[12px] uppercase leading-none ${copied ? 'text-emerald-600 dark:text-emerald-400' : 'text-zinc-500'}`}>
                                    {vehicleDisplay}
                                </span>
                            </div>
                        )}
                    </div>

                    {/* Datum */}
                    <div className="flex items-center gap-1.5 truncate">
                        {job.datum ? (
                            <>
                                {!isDone && isUrgentDate && (
                                    <span className="relative flex h-2 w-2 shrink-0 hidden sm:flex">
                                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-orange-400 opacity-75"></span>
                                        <span className="relative inline-flex rounded-full h-2 w-2 bg-orange-500"></span>
                                    </span>
                                )}
                                <span className={`text-[12px] font-medium leading-none truncate ${!isDone && isUrgentDate ? 'text-orange-600 dark:text-orange-400 font-bold' : 'text-zinc-700 dark:text-zinc-300'}`}>
                                    {dateString}
                                </span>
                                <span className={`text-[12px] font-medium leading-none shrink-0 ${job.datum.includes('00:00') ? 'text-zinc-300 dark:text-zinc-600' : 'text-zinc-500 dark:text-zinc-400'}`}>
                                    {formatTime(job.datum)}
                                </span>
                            </>
                        ) : (
                            <span className="text-[12px] font-medium text-zinc-400 dark:text-zinc-500">
                                Ej inbokad
                            </span>
                        )}
                    </div>
                </div>

                {/* Pris */}
                <div className="shrink-0 text-right">
                    {price > 0 ? (
                        <div className="flex flex-col items-end">
                            {paid > 0 ? (
                                <>
                                    <span className="text-[9px] text-emerald-500 font-medium tracking-widest uppercase mb-0.5">{paid.toLocaleString('sv-SE')} kr</span>
                                    <div className="flex items-baseline gap-1 text-orange-500">
                                        <span className="text-[14px] font-normal leading-none tracking-tight">
                                            {remaining.toLocaleString('sv-SE')}
                                        </span>
                                        <span className="text-[10px] font-normal uppercase text-zinc-400">kr</span>
                                    </div>
                                </>
                            ) : (
                                <div className="flex items-baseline gap-1">
                                    <span className="text-[14px] font-normal leading-none tracking-tight text-zinc-800 dark:text-zinc-200">
                                        {price.toLocaleString('sv-SE')}
                                    </span>
                                    <span className="text-[10px] text-zinc-400 font-normal uppercase">kr</span>
                                </div>
                            )}
                        </div>
                    ) : (
                        <span className="text-[10px] font-medium text-zinc-400 bg-zinc-100 dark:bg-white/5 px-2 py-1 rounded border border-zinc-200 dark:border-white/5">Ej prissatt</span>
                    )}
                </div>
            </div>
        </div>
    );
}, mobileCardPropsAreEqual);

// --- 4. HUVUDVY ---
const dashboardPropsAreEqual = (prev, next) => {
    return prev.filteredJobs === next.filteredJobs && prev.activeFilter === next.activeFilter && prev.globalSearch === next.globalSearch && prev.statusCounts === next.statusCounts;
};

// FIX: Bättre regex för svenska regnr i texttolken
window.TaskFormatter = React.memo(({ text, isDone }) => {
    const [copiedToken, setCopiedToken] = React.useState(null);
    const regex = /(https?:\/\/[^\s]+|[A-Za-zÅÄÖåäö]{3}\s?\d{2}[A-Za-z0-9])/g;
    const parts = text.split(regex);

    const handleCopy = React.useCallback((e, token) => {
        e.stopPropagation();
        if (isDone) return; 
        navigator.clipboard.writeText(token);
        setCopiedToken(token);
        setTimeout(() => setCopiedToken(null), 1500);
    }, [isDone]);

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
                if (/^[A-Za-zÅÄÖåäö]{3}\s?\d{2}[A-Za-z0-9]$/.test(part)) {
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

// --- DASHBOARD WIDGETS (Auto-scroll till Öppna ordrar) ---
window.DashboardWidgets = React.memo(({ allJobs, setView }) => {
    const [tasks, setTasks] = React.useState([]);
    const [lagerItems, setLagerItems] = React.useState([]);
    const [newTask, setNewTask] = React.useState('');
    const [orderSearch, setOrderSearch] = React.useState('');
    const [vehicleSearch, setVehicleSearch] = React.useState('');
    const [partSearch, setPartSearch] = React.useState('');

    // NYTT: Ref för att kunna styra den horisontella rullningslisten
    const scrollRef = React.useRef(null);

    React.useEffect(() => {
        if (!window.db) return;
        
        const unsubTasks = window.db.collection("tasks").orderBy("createdAt", "asc").limit(50).onSnapshot(snap => {
            setTasks(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
        });

        const unsubLager = window.db.collection("lager").onSnapshot(snap => {
            setLagerItems(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
        });

        return () => { unsubTasks(); unsubLager(); };
    }, []);

    React.useEffect(() => {
        const timer = setTimeout(() => {
            if (window.lucide) window.lucide.createIcons();
        }, 50);
        return () => clearTimeout(timer);
    });

    // NYTT: Scrolla fram till kort nummer 2 ("Öppna ordrar") automatiskt när sektionen laddas
    React.useEffect(() => {
        const timer = setTimeout(() => {
            if (scrollRef.current) {
                const container = scrollRef.current;
                const secondCard = container.children[1]; // Kort index 1 är Öppna ordrar
                if (secondCard) {
                    container.scrollTo({
                        left: secondCard.offsetLeft,
                        behavior: 'smooth'
                    });
                }
            }
        }, 350); // 350ms fördröjning gör att menyns in-animering hinner bli klar först
        return () => clearTimeout(timer);
    }, []);

    const toggleTask = (id, currentStatus) => window.db.collection("tasks").doc(id).update({ done: !currentStatus });
    const addTask = (e) => {
        e.preventDefault();
        if (!newTask.trim()) return;
        window.db.collection("tasks").add({ text: newTask.trim(), done: false, createdAt: window.firebase.firestore.FieldValue.serverTimestamp() });
        setNewTask('');
    };
    const deleteTask = (e, id) => { e.stopPropagation(); window.db.collection("tasks").doc(id).delete(); };

    const sortedTasks = React.useMemo(() => {
        return [...tasks].sort((a, b) => {
            if (a.done !== b.done) return a.done ? 1 : -1;
            return (a.createdAt?.toMillis?.() || 0) - (b.createdAt?.toMillis?.() || 0);
        });
    }, [tasks]);

    const filteredOrders = React.useMemo(() => {
        return allJobs.filter(j => 
            j.status !== 'KLAR' && 
            j.status !== 'FAKTURERAS' && 
            !j.deleted &&
            ((j.id && j.id.toLowerCase().includes(orderSearch.toLowerCase())) || 
             (j.kundnamn && j.kundnamn.toLowerCase().includes(orderSearch.toLowerCase())))
        ).slice(0, 15);
    }, [allJobs, orderSearch]);

    const uniqueVehicles = React.useMemo(() => {
        const seen = new Set();
        const list = [];
        for (const j of allJobs) {
            if (j.regnr && j.regnr !== '-' && !seen.has(j.regnr)) {
                const matchStr = `${j.regnr} ${j.bilmodell}`.toLowerCase();
                if(matchStr.includes(vehicleSearch.toLowerCase())) {
                    seen.add(j.regnr);
                    list.push(j);
                }
            }
        }
        return list.slice(0, 15);
    }, [allJobs, vehicleSearch]);

    const filteredLager = React.useMemo(() => {
        let res = [...lagerItems];
        if (partSearch) {
            const term = partSearch.toLowerCase().replace(/\s+/g, '');
            res = res.filter(i => 
                (i.name || "").toLowerCase().replace(/\s+/g, '').includes(term) ||
                (i.service_filter || "").toLowerCase().replace(/\s+/g, '').includes(term)
            );
        }
        return res.slice(0, 15);
    }, [lagerItems, partSearch]);

    // FIX: Korten fyller ut skärmens höjd på mobilen (100dvh - marginaler), men behåller h-[340px] på dator (lg:h-[340px])
    const cardClass = "bg-white dark:bg-[#1e293b] rounded-2xl border border-zinc-200/80 dark:border-white/10 p-3.5 sm:p-4 shadow-sm hover:shadow-md transition-shadow flex flex-col h-[calc(85dvh-200px)] sm:h-[340px] w-[88vw] sm:w-[350px] lg:w-[400px] shrink-0 snap-start";

    return (
        <div className="mb-6 lg:mb-8 animate-in slide-in-from-top-4 fade-in duration-300">
            {/* NYTT: Satt "relative" och kopplat "ref={scrollRef}" till behållaren */}
            <div ref={scrollRef} className="relative flex overflow-x-auto gap-4 lg:gap-5 pb-4 custom-scrollbar snap-x snap-mandatory pr-8">
                
                {/* 1. Snabblänkar */}
                <div className={cardClass}>
                    <h3 className="text-[16px] text-zinc-800 dark:text-zinc-200 mb-6">
                        Snabblänkar
                    </h3>
                    <div className="flex-1 space-y-4">
                        <div onClick={() => setView && setView('NEW_JOB')} className="flex items-center gap-3 text-[14px] font-medium text-[#308a8a] dark:text-[#40a09b] hover:underline cursor-pointer group w-fit transition-all">
                            <window.Icon name="file-text" size={16} className="text-zinc-400 group-hover:text-[#308a8a] transition-colors shrink-0" />
                            <span className="truncate">Ny serviceorder</span>
                        </div>
                        <div onClick={() => window.dispatchEvent(new CustomEvent('open-spotlight'))} className="flex items-center gap-3 text-[14px] font-medium text-[#308a8a] dark:text-[#40a09b] hover:underline cursor-pointer group w-fit transition-all">
                            <window.Icon name="search" size={16} className="text-zinc-400 group-hover:text-[#308a8a] transition-colors shrink-0" />
                            <span className="truncate">Fordonssökning</span>
                        </div>
                    </div>
                </div>

                {/* 2. Öppna Ordrar */}
                <div className={cardClass}>
                    <h3 className="text-[16px] text-zinc-800 dark:text-zinc-200 mb-3">
                        Öppna ordrar
                    </h3>
                    <div className="flex items-center gap-2 border-b border-zinc-400/50 dark:border-zinc-600 pb-2 mb-4">
                        <window.Icon name="search" size={14} className="text-zinc-500" />
                        <input 
                            type="text" 
                            placeholder="OrderNr eller Kund" 
                            className="bg-transparent border-none outline-none text-[13px] w-full text-zinc-700 dark:text-zinc-300 placeholder:text-zinc-400"
                            value={orderSearch}
                            onChange={(e) => setOrderSearch(e.target.value)}
                        />
                    </div>
                    <div className="flex-1 overflow-y-auto custom-scrollbar pr-2 space-y-4">
                        {filteredOrders.map(job => {
                            let orderNr = job.id ? job.id.substring(0,8).toUpperCase() : 'NY';
                            if (job.datum) {
                                try {
                                    const d = new Date(job.datum);
                                    const yy = String(d.getFullYear()).substring(2);
                                    const mm = String(d.getMonth() + 1).padStart(2, '0');
                                    const dd = String(d.getDate()).padStart(2, '0');
                                    orderNr = `${yy}00${mm}${dd}`;
                                } catch(e) {}
                            }
                            
                            const displayName = job.kundnamn ? job.kundnamn.toUpperCase() : 'OKÄND';
                            const displayReg = job.regnr && job.regnr !== '-' ? job.regnr.toUpperCase() : (job.bilmodell ? job.bilmodell.toUpperCase() : 'INGET FORDON');

                            return (
                                <div key={job.id} onClick={() => setView && setView('NEW_JOB', { job })} className="flex items-start gap-3 cursor-pointer group">
                                    <window.Icon name="users" size={14} className="text-zinc-500 group-hover:text-[#308a8a] transition-colors mt-[3px] shrink-0" />
                                    <span className="text-[13px] text-[#308a8a] dark:text-[#40a09b] group-hover:underline leading-relaxed truncate font-medium">
                                        {orderNr}, {displayName}, {displayReg}
                                    </span>
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* 3. Senast använda fordon */}
                <div className={cardClass}>
                    <h3 className="text-[16px] text-zinc-800 dark:text-zinc-200 mb-3">
                        Senast använda fordon
                    </h3>
                    <div className="flex items-center gap-2 border-b border-zinc-400/50 dark:border-zinc-600 pb-2 mb-4">
                        <window.Icon name="search" size={14} className="text-zinc-500" />
                        <input 
                            type="text" 
                            placeholder="Fordon, registreringsnummer" 
                            className="bg-transparent border-none outline-none text-[13px] w-full text-zinc-700 dark:text-zinc-300 placeholder:text-zinc-400"
                            value={vehicleSearch}
                            onChange={(e) => setVehicleSearch(e.target.value)}
                        />
                    </div>
                    <div className="flex-1 overflow-y-auto custom-scrollbar border border-zinc-200 dark:border-zinc-700 rounded-md bg-white dark:bg-transparent">
                        <table className="w-full text-left table-fixed">
                            <thead className="sticky top-0 z-10 text-[12px] font-medium text-zinc-500 dark:text-zinc-400 shadow-sm">
                                <tr>
                                    <th className="py-2 pl-3 w-[65%] truncate font-normal bg-zinc-50 dark:bg-[#1e293b] border-b border-zinc-200 dark:border-zinc-700">Fordon</th>
                                    <th className="py-2 pl-2 border-l border-zinc-200 dark:border-zinc-700 w-[35%] truncate font-normal text-right pr-3 bg-zinc-50 dark:bg-[#1e293b] border-b border-zinc-200 dark:border-zinc-700">Reg.nr</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-zinc-100 dark:divide-white/5">
                                {uniqueVehicles.map((job, index) => (
                                    <tr key={job.id} onClick={() => { if(window.openVehicleProfile) window.openVehicleProfile(job.regnr, job.id); }} className={`cursor-pointer group hover:bg-zinc-50 dark:hover:bg-white/5 transition-colors ${index === 0 ? 'bg-zinc-50/50 dark:bg-white/[0.02]' : ''}`}>
                                        <td className="py-2.5 pl-3 text-[13px] font-medium text-[#308a8a] dark:text-[#40a09b] group-hover:underline truncate pr-2 flex items-center gap-2.5">
                                            <div className="w-[20px] h-[20px] bg-zinc-500 dark:bg-zinc-600 rounded-[4px] flex items-center justify-center shrink-0">
                                                <window.Icon name="car" size={12} className="text-white" />
                                            </div>
                                            <span className="truncate">{job.bilmodell || 'Okänd'}</span>
                                        </td>
                                        <td className="py-2.5 pl-2 pr-3 text-[12px] text-zinc-600 dark:text-zinc-400 text-right uppercase truncate">
                                            {job.regnr}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* 4. Sök reservdel */}
                <div className={cardClass}>
                    <h3 className="text-[16px] text-zinc-800 dark:text-zinc-200 mb-3">
                        Sök reservdel
                    </h3>
                    <div className="flex items-center gap-2 border-b border-zinc-400/50 dark:border-zinc-600 pb-2 mb-4">
                        <window.Icon name="search" size={14} className="text-zinc-500" />
                        <input 
                            type="text" 
                            placeholder="Artikelnamn eller art.nr..." 
                            className="bg-transparent border-none outline-none text-[13px] w-full text-zinc-700 dark:text-zinc-300 placeholder:text-zinc-400"
                            value={partSearch}
                            onChange={(e) => setPartSearch(e.target.value)}
                        />
                    </div>
                    <div className="flex-1 overflow-y-auto custom-scrollbar border border-zinc-200 dark:border-zinc-700 rounded-md bg-white dark:bg-transparent">
                        <table className="w-full text-left table-fixed">
                            <thead className="sticky top-0 z-10 text-[12px] font-medium text-zinc-500 dark:text-zinc-400 shadow-sm">
                                <tr>
                                    <th className="py-2 pl-3 w-[55%] truncate font-normal bg-zinc-50 dark:bg-[#1e293b] border-b border-zinc-200 dark:border-zinc-700">Artikel</th>
                                    <th className="py-2 pl-2 border-l border-zinc-200 dark:border-zinc-700 w-[45%] truncate font-normal text-right pr-3 bg-zinc-50 dark:bg-[#1e293b] border-b border-zinc-200 dark:border-zinc-700">Saldo</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-zinc-100 dark:divide-white/5">
                                {filteredLager.length === 0 ? (
                                    <tr>
                                        <td colSpan="2" className="py-4 px-3 text-center text-[12px] text-zinc-400">Inga reservdelar hittades.</td>
                                    </tr>
                                ) : (
                                    filteredLager.map((part, index) => {
                                        const qty = parseInt(part.quantity) || 0;
                                        return (
                                            <tr key={part.id} className={`cursor-pointer group hover:bg-zinc-50 dark:hover:bg-white/5 transition-colors ${index === 0 ? 'bg-zinc-50/50 dark:bg-white/[0.02]' : ''}`}>
                                                <td className="py-2.5 pl-3 text-[13px] font-medium text-[#308a8a] dark:text-[#40a09b] group-hover:underline truncate pr-2 flex items-center gap-2.5">
                                                    <div className="w-[20px] h-[20px] bg-zinc-500 dark:bg-zinc-600 rounded-[4px] flex items-center justify-center shrink-0">
                                                        <window.Icon name="package" size={12} className="text-white" />
                                                    </div>
                                                    <span className="truncate">{part.name || 'Okänd artikel'}</span>
                                                </td>
                                                <td className="py-2.5 pl-2 pr-3 text-[12px] text-right truncate">
                                                    <div className="flex justify-end items-center gap-2">
                                                        <span className="">{part.service_filter || '-'}</span>
                                                            {qty} st
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* 5. Anteckningar */}
                <div className={cardClass}>
                    <h3 className="text-[16px] text-zinc-800 dark:text-zinc-200 mb-5 flex justify-between items-center">
                        <span className="truncate">Anteckningar</span>
                        <span className="text-[11px] text-zinc-400 font-normal shrink-0 ml-2">{tasks.filter(t=>t.done).length}/{tasks.length} klara</span>
                    </h3>
                    <div className="flex-1 overflow-y-auto custom-scrollbar pr-2 space-y-3.5 pt-1">
                        {sortedTasks.length === 0 && <div className="text-[13px] text-zinc-400">Inga anteckningar.</div>}
                        {sortedTasks.map(task => (
                            <div key={task.id} className={`flex items-start gap-3 group ${task.done ? 'opacity-50' : ''}`}>
                                <div onClick={() => toggleTask(task.id, task.done)} className={`w-5 h-5 mt-[1px] rounded-[4px] border flex items-center justify-center shrink-0 cursor-pointer transition-colors ${task.done ? 'bg-[#308a8a] border-[#308a8a] text-white' : 'border-zinc-300 dark:border-zinc-600 text-transparent hover:border-[#308a8a]'}`}>
                                    <window.Icon name="check" size={12} className={task.done ? 'scale-100' : 'scale-0 transition-transform'} />
                                </div>
                                <div className={`text-[13px] flex-1 leading-relaxed break-words ${task.done ? 'line-through text-zinc-400' : 'text-zinc-700 dark:text-zinc-300'}`}>
                                    {task.text}
                                </div>
                                <button onClick={(e) => deleteTask(e, task.id)} className="opacity-0 group-hover:opacity-100 text-zinc-400 hover:text-red-500 shrink-0 transition-colors">
                                    <window.Icon name="x" size={16} />
                                </button>
                            </div>
                        ))}
                    </div>
                    <form onSubmit={addTask} className="mt-4 flex items-center gap-2">
                        <input type="text" value={newTask} onChange={e => setNewTask(e.target.value)} placeholder="Skriv ny anteckning..." className="flex-1 bg-white dark:bg-[#1e293b] border border-zinc-300 dark:border-zinc-600 rounded-md px-3 py-2 text-[13px] outline-none focus:border-[#308a8a] dark:text-white transition-colors min-w-0" />
                        <button type="submit" disabled={!newTask.trim()} className="w-9 h-9 bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 rounded-md flex items-center justify-center disabled:opacity-50 hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors shrink-0">
                            <window.Icon name="plus" size={16} />
                        </button>
                    </form>
                </div>

            </div>
        </div>
    );
});

// Hjälpkomponent för att hämta VIN, Märke och Modell i kompakt vy
// Hjälpkomponent för att hämta VIN, Märke och Modell i kompakt vy
window.CompactVehicleCells = React.memo(({ job }) => {
    const [specs, setSpecs] = React.useState({
        vin: job.vin || '',
        brand: '',
        model: job.bilmodell || ''
    });
    
    // NYTT: State för att hålla reda på kopieringsstatus för just chassinumret
    const [copiedVinId, setCopiedVinId] = React.useState(null);

    React.useEffect(() => {
        const localBrand = getLocalBrand(job.bilmodell, '');
        setSpecs(prev => ({
            ...prev,
            vin: job.vin || prev.vin,
            brand: localBrand ? localBrand.toUpperCase() : prev.brand,
            model: job.bilmodell || prev.model
        }));

        const regnr = job.regnr ? job.regnr.toUpperCase().trim() : null;
        if (!regnr || !window.db) return;

        const unsubscribe = window.db.collection('vehicleSpecs').doc(regnr).onSnapshot(doc => {
            if (doc.exists) {
                const data = doc.data();
                const foundBrand = data.fabrikat || data.brand_manual || getLocalBrand(data.model, data.fabrikat) || '';
                setSpecs({
                    vin: data.vin || job.vin || '',
                    brand: foundBrand.toUpperCase(),
                    model: data.model || job.bilmodell || ''
                });
            }
        });
        return () => unsubscribe();
    }, [job.regnr, job.bilmodell, job.vin]);

    // NYTT: Klick- och kopieringsfunktion för chassinumret
    const handleCopyVin = React.useCallback((e, vinText, jobId) => {
        e.stopPropagation();
        if (!vinText || vinText === '-' || vinText.trim() === '') return;
        navigator.clipboard.writeText(vinText);
        setCopiedVinId(jobId);
        setTimeout(() => setCopiedVinId(null), 2000);
    }, []);

    // Gör om VOLKSWAGEN -> VW och ta bort märkesnamnet ur modellbeteckningen för renare vy
    const displayBrand = specs.brand === 'VOLKSWAGEN' ? 'VW' : specs.brand;
    const cleanModel = specs.model && specs.brand && specs.model.toUpperCase().startsWith(specs.brand)
        ? specs.model.substring(specs.brand.length).trim()
        : specs.model;

    return (
        <>
            <td 
                onClick={(e) => handleCopyVin(e, specs.vin, job.id)}
                className="px-3.5 py-3 text-[13px] text-zinc-700 dark:text-zinc-300 truncate max-w-[150px] cursor-pointer hover:text-orange-500 dark:hover:text-orange-400 font-medium transition-colors relative" 
                title={specs.vin ? "Klicka för att kopiera chassinummer" : ""}
            >
                {copiedVinId === job.id ? (
                    <span className="text-emerald-600 dark:text-emerald-400 font-semibold">Kopierad!</span>
                ) : (
                    specs.vin || ''
                )}
            </td>
            <td className="px-3.5 py-3 text-[13px] text-zinc-700 dark:text-zinc-300 truncate max-w-[95px]">
                {displayBrand || ''}
            </td>
            <td className="px-3.5 py-3 text-[13px] text-zinc-700 dark:text-zinc-300 truncate max-w-[170px]" title={specs.model}>
                {cleanModel || ''}
            </td>
        </>
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
    const [showWaitingJobs, setShowWaitingJobs] = React.useState(false);
    const [isCompactView, setIsCompactView] = React.useState(() => {
        return localStorage.getItem('autogrid_table_density') === 'compact';
    });
    const [expandedCompactIds, setExpandedCompactIds] = React.useState([]);
    
    // NYTT: Öppen som standard & minns användarens val
    const [showTopWidgets, setShowTopWidgets] = React.useState(() => {
        const saved = localStorage.getItem('autogrid_top_widgets');
        return saved !== null ? saved === 'true' : true; 
    });

    const toggleTopWidgets = React.useCallback(() => {
        setShowTopWidgets(prev => {
            const newVal = !prev;
            localStorage.setItem('autogrid_top_widgets', newVal);
            return newVal;
        });
    }, []);

    const toggleCompactExpand = React.useCallback((jobId) => {
        setExpandedCompactIds(prev => prev.includes(jobId) ? prev.filter(id => id !== jobId) : [...prev, jobId]);
        setTimeout(() => { if (window.lucide) window.lucide.createIcons(); }, 30);
    }, []);

    const toggleCompactView = React.useCallback((compact) => {
        setIsCompactView(compact);
        localStorage.setItem('autogrid_table_density', compact ? 'compact' : 'spacious');
        setTimeout(() => { if (window.lucide) window.lucide.createIcons(); }, 50);
    }, []);
    
    // State för vehicleSpecs (så vi kan söka, filtrera och sortera på Chnr, Märke & Modell)
    const [specsMap, setSpecsMap] = React.useState({});
    // State för kolumnfilter (tratt-ikonerna i kompakt vy)
    const [columnFilters, setColumnFilters] = React.useState({});
    const [openFilterMenu, setOpenFilterMenu] = React.useState(null);

    React.useEffect(() => {
        // Läs in ev. lokal cache direkt
        try {
            const cached = JSON.parse(localStorage.getItem('os_vehicle_cache') || '{}');
            if (Object.keys(cached).length > 0) setSpecsMap(prev => ({ ...cached, ...prev }));
        } catch (e) {}

        if (!window.db) return;
        const unsubscribe = window.db.collection('vehicleSpecs').onSnapshot(snap => {
            const map = {};
            snap.forEach(doc => { map[doc.id.toUpperCase().trim()] = doc.data(); });
            setSpecsMap(prev => ({ ...prev, ...map }));
        }, () => {});
        return () => unsubscribe();
    }, []);

    // Hjälpfunktion som hämtar Chnr, Märke och Modell för ett jobb
    const getJobVehicleMeta = React.useCallback((job) => {
        const reg = job.regnr ? job.regnr.toUpperCase().trim() : '';
        const spec = specsMap[reg] || {};
        const rawModel = spec.model || job.bilmodell || '';
        const rawBrand = spec.fabrikat || spec.brand_manual || getLocalBrand(rawModel, spec.fabrikat) || '';
        const brandUpper = rawBrand.toUpperCase();
        const displayBrand = brandUpper === 'VOLKSWAGEN' ? 'VW' : brandUpper;
        const cleanModel = rawModel && brandUpper && rawModel.toUpperCase().startsWith(brandUpper)
            ? rawModel.substring(brandUpper.length).trim()
            : rawModel;
        const vin = spec.vin || spec.chassinummer || job.vin || '';
        const engine = spec.engine || job.motorkod || '';
        return { vin, brand: displayBrand, rawBrand: brandUpper, model: cleanModel, rawModel, engine };
    }, [specsMap]);

    React.useEffect(() => {
        setVisibleCount(20);
    }, [activeFilter, globalSearch, columnFilters]);

    // Unika värden för filtermenyerna (trattarna)
    const filterOptions = React.useMemo(() => {
        const base = allJobs.filter(j => !j.deleted && (activeFilter === 'ALLA' || j.status === activeFilter));
        const countValues = (getter) => {
            const counts = {};
            base.forEach(j => {
                const val = getter(j);
                if (val) counts[val] = (counts[val] || 0) + 1;
            });
            return Object.entries(counts).sort((a, b) => b[1] - a[1]);
        };
        return {
            paket: countValues(j => j.paket || 'Standard'),
            kundnamn: countValues(j => (j.kundnamn || '').toUpperCase().trim()),
            status: countValues(j => (j.status || 'BOKAD').toUpperCase()),
            brand: countValues(j => getJobVehicleMeta(j).brand)
        };
    }, [allJobs, activeFilter, getJobVehicleMeta]);

    const toggleColumnFilterValue = (colKey, val) => {
        setColumnFilters(prev => {
            const current = prev[colKey] || [];
            const next = current.includes(val) ? current.filter(x => x !== val) : [...current, val];
            const copy = { ...prev };
            if (next.length === 0) delete copy[colKey];
            else copy[colKey] = next;
            return copy;
        });
    };

    const clearAllColumnFilters = () => {
        setColumnFilters({});
        setOpenFilterMenu(null);
    };

    const sortedAndFilteredJobs = React.useMemo(() => {
        // Om användaren skriver i sökrutan utgår vi från allJobs så att även Chnr, Märke, Modell & Reservdelar hittas!
        const searchQuery = (globalSearch || '').trim().toLowerCase();
        let result = searchQuery
            ? allJobs.filter(j => {
                if (j.deleted) return false;
                if (activeFilter !== 'ALLA' && j.status !== activeFilter) return false;

                const meta = getJobVehicleMeta(j);
                const expensesText = (j.utgifter || []).map(u => `${u.namn || ''} ${u.kostnad || ''}`).join(' ');
                const commentText = stripHtml(j.kommentar || '');

                const searchableString = [
                    j.kundnamn,
                    j.regnr,
                    j.paket,
                    j.datum,
                    j.status,
                    j.kundpris,
                    commentText,
                    expensesText,
                    meta.vin,
                    meta.brand,
                    meta.rawBrand,
                    meta.model,
                    meta.rawModel,
                    meta.engine
                ].filter(Boolean).join(' ').toLowerCase();

                // Stöd för flera sökord (t.ex. "vw kamrem" eller "fogarolli oljebyte")
                const terms = searchQuery.split(/\s+/);
                return terms.every(t => searchableString.includes(t));
            })
            : [...filteredJobs];

        // Applicera aktiva kolumnfilter (från tratt-ikonerna)
        Object.entries(columnFilters).forEach(([colKey, selectedVals]) => {
            if (!selectedVals || selectedVals.length === 0) return;
            result = result.filter(j => {
                if (colKey === 'paket') return selectedVals.includes(j.paket || 'Standard');
                if (colKey === 'kundnamn') return selectedVals.includes((j.kundnamn || '').toUpperCase().trim());
                if (colKey === 'status') return selectedVals.includes((j.status || 'BOKAD').toUpperCase());
                if (colKey === 'brand') return selectedVals.includes(getJobVehicleMeta(j).brand);
                return true;
            });
        });

        result.sort((a, b) => {
            if (!sortConfig.key) {
                if (!a.datum) return 1; if (!b.datum) return -1;
                return activeFilter === 'BOKAD' ? a.datum.localeCompare(b.datum) : b.datum.localeCompare(a.datum);
            }

            let aVal, bVal;
            if (['vin', 'brand', 'model'].includes(sortConfig.key)) {
                aVal = (getJobVehicleMeta(a)[sortConfig.key] || '').toLowerCase();
                bVal = (getJobVehicleMeta(b)[sortConfig.key] || '').toLowerCase();
            } else if (sortConfig.key === 'kundpris') {
                aVal = parseInt(a.kundpris) || 0;
                bVal = parseInt(b.kundpris) || 0;
            } else {
                aVal = (a[sortConfig.key] || '').toString().toLowerCase();
                bVal = (b[sortConfig.key] || '').toString().toLowerCase();
            }

            if (aVal < bVal) return sortConfig.direction === 'asc' ? -1 : 1;
            if (aVal > bVal) return sortConfig.direction === 'asc' ? 1 : -1;
            return 0;
        });
        return result;
    }, [filteredJobs, allJobs, globalSearch, sortConfig, activeFilter, columnFilters, getJobVehicleMeta]);

    const visibleJobsBase = sortedAndFilteredJobs.slice(0, visibleCount);
    const hasMore = visibleCount < sortedAndFilteredJobs.length;

    // Använd enbart den filtrerade listan (Senaste 5 klara är borttaget)
    const visibleJobs = visibleJobsBase;

    const requestSort = (key) => {
        let direction = 'asc';
        if (sortConfig.key === key && sortConfig.direction === 'asc') direction = 'desc';
        setSortConfig({ key, direction });
        setTimeout(() => { if (window.lucide) window.lucide.createIcons(); }, 20);
    };

    const handleCopyDesktop = React.useCallback((e, regnr, jobId) => {
        e.stopPropagation();
        if (!regnr || regnr === '-') return;
        navigator.clipboard.writeText(regnr);
        setCopiedRegId(jobId);
        setTimeout(() => setCopiedRegId(null), 2000);
    }, []);

    const tabsRef = React.useRef(null);
    const filters = ['ALLA', 'BOKAD', 'FAKTURERAS', 'OFFERERAD', 'KLAR'];

    const stats30Days = React.useMemo(() => {
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        return allJobs.filter(j => j.status === 'KLAR' && j.datum && new Date(j.datum) >= thirtyDaysAgo && !j.deleted).length;
    }, [allJobs]);

    const totalJobs30Days = React.useMemo(() => {
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        return allJobs.filter(j => j.datum && new Date(j.datum) >= thirtyDaysAgo && !j.deleted).length;
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

    const revenue30Days = React.useMemo(() => {
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        return allJobs.reduce((sum, j) => {
            if (j.status === 'KLAR' && j.datum && new Date(j.datum) >= thirtyDaysAgo && !j.deleted) {
                return sum + (parseInt(j.kundpris) || 0);
            }
            return sum;
        }, 0);
    }, [allJobs]);

    const nextUpcomingJob = React.useMemo(() => {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const upcoming = allJobs.filter(j => {
            if (!j.datum || j.status === 'KLAR' || j.deleted) return false;
            const d = new Date(j.datum);
            return d >= today;
        }).sort((a, b) => a.datum.localeCompare(b.datum));
        return upcoming.length > 0 ? upcoming[0] : null;
    }, [allJobs]);

    const invoiceStats = React.useMemo(() => {
        if (activeFilter !== 'FAKTURERAS') return { total: 0, topCustomers: [] };
        let totalRemaining = 0;
        const customers = {};
        filteredJobs.forEach(job => {
            const price = parseInt(job.kundpris) || 0;
            const paid = parseInt(job.betaltBelopp) || 0;
            const remaining = Math.max(0, price - paid);

            if (remaining > 0) { 
                totalRemaining += remaining;
                const name = job.kundnamn || 'Okänd kund';
                customers[name] = (customers[name] || 0) + remaining;
            }
        });
        return {
            total: totalRemaining,
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
        <div className="flex flex-col min-h-[calc(100vh-80px)] md:min-h-screen bg-transparent text-zinc-900 dark:text-white pb-0 transition-colors duration-500 relative max-w-[1400px] ml-0 w-full animate-in fade-in slide-in-from-left-4">

            <div className="absolute top-0 left-[-10%] w-[60%] h-[400px] bg-orange-500/10 dark:bg-orange-500/5 blur-[120px] rounded-full pointer-events-none -z-10 hidden lg:block transition-all duration-700"></div>

            <div className="hidden lg:flex flex-col h-full lg:px-0 lg:pt-0">
                
                {/* --- ORIGINAL HEADER MED NOLL TOP-PADDING --- */}
                <div className="flex flex-col md:flex-row md:items-center justify-between mb-4 pb-4 border-b border-zinc-200 dark:border-white/10 gap-4 pt-0">
                    <div className="flex items-center gap-3 md:gap-4">
                        <div className="relative group cursor-default shrink-0">
                            <div className="absolute inset-0 bg-orange-500/40 blur-lg rounded-full transition-all duration-700 group-hover:bg-orange-500/60" />
                            <div className="relative w-10 h-10 md:w-12 md:h-12 rounded-xl flex items-center justify-center text-white shadow-md border border-white/20 transition-colors bg-gradient-to-br from-orange-400 to-orange-600">
                                <window.Icon name="grid" size={20} className="md:w-6 md:h-6" />
                            </div>
                        </div>
                        <div className="flex flex-col">
                            <h1 className="text-xl md:text-2xl font-black text-zinc-900 dark:text-white uppercase tracking-tight leading-none">
                                DASH<span className="text-zinc-400 dark:text-zinc-500 font-light">BOARD</span>
                            </h1>
                            <p className="text-[9px] md:text-[10px] font-bold text-orange-500 dark:text-orange-400 uppercase tracking-widest mt-1 flex items-center gap-1.5">
                                <span className="w-1.5 h-1.5 rounded-full bg-orange-500 animate-pulse"></span>
                                Operationell Status
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-4">
                        <button 
                            onClick={() => window.dispatchEvent(new CustomEvent('open-spotlight'))} 
                            className="group w-96 bg-white/50 dark:bg-[#1e293b] border border-zinc-200 dark:border-white/10 text-zinc-500 dark:text-zinc-400 py-3.5 pl-4 pr-3 rounded-xl flex items-center justify-between hover:bg-white hover:border-orange-300 dark:hover:border-orange-500/50 hover:shadow-md transition-all shadow-sm"
                        >
                            <div className="flex items-center gap-2">
                                <window.Icon name="search" size={16} className="text-zinc-400 dark:text-zinc-400 group-hover:text-orange-500 group-hover:rotate-12 transition-all duration-300" />
                                <span className="text-[12px] font-bold tracking-widest uppercase">Sök i systemet...</span>
                            </div>
                            <span className="text-[10px] font-black uppercase text-zinc-400 dark:text-zinc-400 bg-zinc-100 dark:bg-black/20 border border-zinc-200 dark:border-white/10 px-1.5 py-0.5 rounded-md shadow-sm">⌘K</span>
                        </button>
                        <button onClick={() => setView('NEW_JOB')} className="group bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-400 hover:to-orange-500 text-white border border-orange-400/50 h-[46px] px-8 rounded-xl flex items-center gap-3 shadow-[0_8px_20px_-6px_rgba(249,115,22,0.4)] hover:shadow-[0_12px_25px_-4px_rgba(249,115,22,0.6)] hover:-translate-y-0.5 transition-all duration-300 active:scale-95 active:translate-y-0">
                            <span className="text-[12px] font-black uppercase tracking-widest">Nytt Uppdrag</span>
                            <window.Icon name="plus" size={16} className="group-hover:rotate-90 transition-transform duration-500" />
                        </button>
                        
                        {/* DEN NYA KNAPPEN FÖR ATT FÄLLA UT WIDGETSEN (Nu med minne) */}
                        <button 
                            onClick={toggleTopWidgets}
                            className={`h-[46px] w-[46px] flex items-center justify-center rounded-xl border transition-all active:scale-95 ${showTopWidgets ? 'bg-orange-50 border-orange-200 text-orange-500 dark:bg-orange-500/10 dark:border-orange-500/30' : 'bg-white/50 dark:bg-[#1e293b] border-zinc-200 dark:border-white/10 text-zinc-500 hover:border-orange-300 hover:text-orange-500 shadow-sm hover:shadow-md'}`}
                            title={showTopWidgets ? "Dölj översikt" : "Visa översikt"}
                        >
                            <window.Icon name={showTopWidgets ? "chevron-up" : "chevron-down"} size={20} />
                        </button>
                    </div>
                </div>

                {/* ENDAST DEN NYA WIDGET-VYN */}
                {showTopWidgets && (
                    <window.DashboardWidgets allJobs={allJobs} setView={setView} />
                )}

                <div className="flex flex-col flex-1 pb-10 relative">
                    {/* MINIMALISTISK VERKTYGSRAD MED UNDERLINED TABS */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4 px-1">
                        
                        {/* VÄNSTER: FLIKAR MED KLASSISK UNDERLINED STIL */}
                        <div className="flex items-center space-x-6 overflow-x-auto no-scrollbar border-b border-zinc-200 dark:border-white/10">
                            {filters.map(f => {
                                const isActive = activeFilter === f;
                                const count = statusCounts[f] || 0;
                                return (
                                    <button 
                                        key={f} 
                                        data-tab={f} 
                                        onClick={() => setActiveFilter(f)} 
                                        className={`pb-3 text-[12px] font-bold uppercase tracking-wider transition-all whitespace-nowrap relative flex items-center gap-2 ${
                                            isActive 
                                                ? 'text-orange-500' 
                                                : 'text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200'
                                        }`}
                                    >
                                        <span>{f}</span>
                                        {count > 0 && (
                                            <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold leading-none ${
                                                isActive 
                                                    ? 'bg-orange-50 dark:bg-orange-500/15 text-orange-600 dark:text-orange-400' 
                                                    : 'bg-zinc-100 dark:bg-white/10 text-zinc-500 dark:text-zinc-400'
                                            }`}>
                                                {count}
                                            </span>
                                        )}
                                        {isActive && (
                                            <span className="absolute bottom-0 left-0 right-0 h-[2px] bg-orange-500 rounded-t-full shadow-[0_0_8px_rgba(249,115,22,0.6)]"></span>
                                        )}
                                    </button>
                                );
                            })}
                        </div>

                        {/* HÖGER: SLIMMAD SÖKRUTA + DISKRET VY-VÄXLARE */}
                        <div className="flex items-center gap-2.5 shrink-0">
                            <div className="relative group">
                                <input 
                                    type="text" 
                                    placeholder="Sök i listan..." 
                                    className="h-9 bg-white dark:bg-[#1e293b] border border-zinc-200 dark:border-white/10 focus:border-orange-500 rounded-lg pl-8 pr-7 text-[12px] font-medium text-zinc-900 dark:text-white outline-none w-full sm:w-56 shadow-2xs transition-all placeholder:text-zinc-400"
                                    value={globalSearch}
                                    onChange={(e) => setGlobalSearch(e.target.value)}
                                />
                                <window.Icon name="search" size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-zinc-400 group-focus-within:text-orange-500 transition-colors pointer-events-none" />
                                
                                {globalSearch && (
                                    <button 
                                        onClick={() => setGlobalSearch('')}
                                        className="absolute right-2 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-700 dark:hover:text-white"
                                        title="Rensa sökning"
                                    >
                                        <window.Icon name="x" size={12} />
                                    </button>
                                )}
                            </div>

                            {/* Diskret vy-knapp */}
                            <button
                                type="button"
                                onClick={() => toggleCompactView(!isCompactView)}
                                className="h-9 px-3 rounded-lg bg-white dark:bg-[#1e293b] border border-zinc-200 dark:border-white/10 hover:border-orange-500 text-zinc-700 dark:text-zinc-300 hover:text-orange-600 text-[11px] font-bold uppercase tracking-wider flex items-center gap-1.5 transition-all shadow-2xs"
                                title="Växla vy"
                            >
                                <window.Icon name={isCompactView ? "table" : "layout-list"} size={13} className="text-orange-500" />
                                <span className="hidden sm:inline">{isCompactView ? 'Kompakt' : 'Luftig'}</span>
                            </button>
                        </div>
                    </div>

                    {/* FRISTÅENDE TABELLKORT */}
                    <div className="bg-white dark:bg-[#1e293b] rounded-xl shadow-lg dark:shadow-[0_10px_30px_rgba(0,0,0,0.5)] border border-zinc-200 dark:border-white/10 overflow-hidden flex flex-col">
                        <div className="overflow-x-auto relative"> {/* FIX: Tillåter alltid scroll sidleds, oavsett vy */}
                            <table className="w-full text-left border-collapse min-w-[800px]"> {/* FIX: Säkerställer en minsta bredd så att tabellen inte trycks ihop */}
                                {isCompactView ? (
                                    /* --- KOMPAKT VY: THEAD (Med levande filtermenyer och sortering på alla kolumner) --- */
                                    <thead className="sticky top-0 z-30 bg-[#f4f5f7] dark:bg-[#161f30] text-zinc-800 dark:text-zinc-200 text-[12px] font-bold border-y border-zinc-300 dark:border-white/15 select-none">
                                        <tr className="divide-x divide-zinc-300 dark:divide-white/15">
                                            <th className="w-12 pl-3 py-3 text-center">
                                                {Object.keys(columnFilters).length > 0 && (
                                                    <button 
                                                        type="button" 
                                                        onClick={clearAllColumnFilters}
                                                        title="Rensa alla kolumnfilter"
                                                        className="text-orange-500 hover:text-red-500 transition-colors"
                                                    >
                                                        <window.Icon name="filter-x" size={13} />
                                                    </button>
                                                )}
                                            </th>
                                            {[
                                                { key: 'paket', label: 'Uppdrag', filterKey: 'paket' },
                                                { key: 'kundnamn', label: 'Kund', filterKey: 'kundnamn' },
                                                { key: 'regnr', label: 'Reg.nr' },
                                                { key: 'datum', label: 'Mottagandedatum' },
                                                { key: 'status', label: 'Status', filterKey: 'status' },
                                                { key: 'vin', label: 'Chnr.' },
                                                { key: 'brand', label: 'Märke', filterKey: 'brand' },
                                                { key: 'model', label: 'Modellbeteckning' }
                                            ].map(col => {
                                                const isSorted = sortConfig.key === col.key;
                                                const activeColFilters = col.filterKey ? (columnFilters[col.filterKey] || []) : [];
                                                const isFilterOpen = openFilterMenu === col.filterKey;

                                                return (
                                                    <th key={col.key} className="px-3.5 py-3 relative hover:bg-zinc-200/60 dark:hover:bg-white/5 transition-colors">
                                                        <div className="flex items-center justify-between gap-2">
                                                            <span 
                                                                onClick={() => requestSort(col.key)} 
                                                                className="cursor-pointer flex-1 truncate"
                                                            >
                                                                {col.label}
                                                            </span>
                                                            <div className="flex items-center gap-1.5 shrink-0">
                                                                <button 
                                                                    type="button" 
                                                                    onClick={() => requestSort(col.key)}
                                                                    className="p-0.5 hover:bg-zinc-300/50 dark:hover:bg-white/10 rounded"
                                                                    title="Sortera"
                                                                >
                                                                    <window.Icon 
                                                                        name={isSorted ? (sortConfig.direction === 'asc' ? 'arrow-up' : 'arrow-down') : 'arrow-up-down'} 
                                                                        size={12} 
                                                                        className={isSorted ? "text-orange-600 dark:text-orange-400" : "text-orange-500/70"} 
                                                                    />
                                                                </button>

                                                                {col.filterKey && (
                                                                    <button
                                                                        type="button"
                                                                        onClick={(e) => {
                                                                            e.stopPropagation();
                                                                            setOpenFilterMenu(isFilterOpen ? null : col.filterKey);
                                                                        }}
                                                                        className={`p-1 rounded transition-colors relative ${
                                                                            activeColFilters.length > 0 || isFilterOpen
                                                                                ? 'bg-orange-500 text-white'
                                                                                : 'text-zinc-500 dark:text-zinc-400 hover:bg-zinc-300/60 dark:hover:bg-white/10'
                                                                        }`}
                                                                        title={`Filtrera på ${col.label}`}
                                                                    >
                                                                        <window.Icon name="filter" size={10} />
                                                                        {activeColFilters.length > 0 && (
                                                                            <span className="absolute -top-1 -right-1 w-3.5 h-3.5 rounded-full bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 text-[8px] font-black flex items-center justify-center">
                                                                                {activeColFilters.length}
                                                                            </span>
                                                                        )}
                                                                    </button>
                                                                )}
                                                            </div>
                                                        </div>

                                                        {/* FILTER-POPUP FÖR TRATT-IKONEN */}
                                                        {isFilterOpen && col.filterKey && (
                                                            <>
                                                                <div className="fixed inset-0 z-40" onClick={() => setOpenFilterMenu(null)}></div>
                                                                <div 
                                                                    onClick={(e) => e.stopPropagation()}
                                                                    className="absolute left-0 top-full mt-1 w-56 bg-white dark:bg-[#182234] border border-zinc-300 dark:border-white/15 rounded-lg shadow-2xl z-50 overflow-hidden font-normal animate-in fade-in zoom-in-95 duration-150"
                                                                >
                                                                    <div className="bg-[#f4f5f7] dark:bg-[#141c2b] px-3 py-2 border-b border-zinc-200 dark:border-white/10 flex items-center justify-between">
                                                                        <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-600 dark:text-zinc-300">
                                                                            Filtrera {col.label}
                                                                        </span>
                                                                        {activeColFilters.length > 0 && (
                                                                            <button 
                                                                                type="button"
                                                                                onClick={() => setColumnFilters(prev => { const c = {...prev}; delete c[col.filterKey]; return c; })}
                                                                                className="text-[10px] font-bold text-orange-600 dark:text-orange-400 hover:underline"
                                                                            >
                                                                                Rensa
                                                                            </button>
                                                                        )}
                                                                    </div>
                                                                    <div className="max-h-56 overflow-y-auto p-1.5 space-y-0.5 custom-scrollbar">
                                                                        {(filterOptions[col.filterKey] || []).length === 0 ? (
                                                                            <div className="py-4 text-center text-[11px] text-zinc-400">Inga alternativ</div>
                                                                        ) : (
                                                                            (filterOptions[col.filterKey] || []).map(([val, count]) => {
                                                                                const checked = activeColFilters.includes(val);
                                                                                return (
                                                                                    <label 
                                                                                        key={val} 
                                                                                        onClick={() => toggleColumnFilterValue(col.filterKey, val)}
                                                                                        className={`flex items-center justify-between px-2.5 py-1.5 rounded text-[12px] cursor-pointer transition-colors ${
                                                                                            checked ? 'bg-orange-50 dark:bg-orange-500/15 text-orange-700 dark:text-orange-300 font-semibold' : 'text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-white/5'
                                                                                        }`}
                                                                                    >
                                                                                        <div className="flex items-center gap-2 truncate pr-2">
                                                                                            <input 
                                                                                                type="checkbox" 
                                                                                                checked={checked} 
                                                                                                readOnly 
                                                                                                className="rounded border-zinc-300 text-orange-500 focus:ring-0 pointer-events-none" 
                                                                                            />
                                                                                            <span className="truncate">{val}</span>
                                                                                        </div>
                                                                                        <span className="text-[10px] font-mono text-zinc-400 bg-zinc-100 dark:bg-white/5 px-1.5 py-0.5 rounded">
                                                                                            {count}
                                                                                        </span>
                                                                                    </label>
                                                                                );
                                                                            })
                                                                        )}
                                                                    </div>
                                                                </div>
                                                            </>
                                                        )}
                                                    </th>
                                                );
                                            })}
                                            <th className="px-3.5 py-3 text-right cursor-pointer hover:bg-zinc-200/60 dark:hover:bg-white/5 transition-colors" onClick={() => requestSort('kundpris')}>
                                                <div className="flex items-center justify-end gap-1.5">
                                                    <span>Pris</span>
                                                    <window.Icon name={sortConfig.key === 'kundpris' ? (sortConfig.direction === 'asc' ? 'arrow-up' : 'arrow-down') : 'arrow-up-down'} size={12} className="text-orange-500" />
                                                </div>
                                            </th>
                                        </tr>
                                    </thead>
                                ) : (
                                    /* --- LUFTIG VY: THEAD (Med filtermenyer och sortering) --- */
                                    <thead className="sticky top-0 z-30 bg-[#f4f5f7] dark:bg-[#161f30] text-zinc-800 dark:text-zinc-200 text-[12px] font-bold border-y border-zinc-300 dark:border-white/15 select-none">
                                        <tr className="divide-x divide-zinc-300 dark:divide-white/15">
                                            {[
                                                { key: 'kundnamn', label: 'Kund', width: 'w-[17%]', pl: 'pl-4 pr-3', filterKey: 'kundnamn' },
                                                { key: 'paket', label: 'Service Typ', width: 'w-[31%]', px: 'px-3', filterKey: 'paket' },
                                                { key: 'regnr', label: 'Reg.nr', width: 'w-[14%]', px: 'px-3' },
                                                { key: 'datum', label: 'Bokat datum', width: 'w-[14%]', px: 'px-3' },
                                                { key: 'status', label: 'Status', width: 'w-[11%]', px: 'px-3', filterKey: 'status' }
                                            ].map(col => {
                                                const isSorted = sortConfig.key === col.key;
                                                const activeColFilters = col.filterKey ? (columnFilters[col.filterKey] || []) : [];
                                                const isFilterOpen = openFilterMenu === col.filterKey;

                                                return (
                                                    <th key={col.key} className={`${col.width} ${col.pl || col.px} py-3 relative hover:bg-zinc-200/60 dark:hover:bg-white/5 transition-colors`}>
                                                        <div className="flex items-center justify-between gap-2">
                                                            <span onClick={() => requestSort(col.key)} className="cursor-pointer flex-1 truncate">
                                                                {col.label}
                                                            </span>
                                                            <div className="flex items-center gap-1.5 shrink-0">
                                                                <button 
                                                                    type="button" 
                                                                    onClick={() => requestSort(col.key)}
                                                                    className="p-0.5 hover:bg-zinc-300/50 dark:hover:bg-white/10 rounded"
                                                                    title="Sortera"
                                                                >
                                                                    <window.Icon 
                                                                        name={isSorted ? (sortConfig.direction === 'asc' ? 'arrow-up' : 'arrow-down') : 'arrow-up-down'} 
                                                                        size={12} 
                                                                        className={isSorted ? "text-orange-600 dark:text-orange-400" : "text-orange-500/70"} 
                                                                    />
                                                                </button>

                                                                {col.filterKey && (
                                                                    <button
                                                                        type="button"
                                                                        onClick={(e) => {
                                                                            e.stopPropagation();
                                                                            setOpenFilterMenu(isFilterOpen ? null : col.filterKey);
                                                                        }}
                                                                        className={`p-1 rounded transition-colors relative ${
                                                                            activeColFilters.length > 0 || isFilterOpen
                                                                                ? 'bg-orange-500 text-white'
                                                                                : 'text-zinc-500 dark:text-zinc-400 hover:bg-zinc-300/60 dark:hover:bg-white/10'
                                                                        }`}
                                                                        title={`Filtrera på ${col.label}`}
                                                                    >
                                                                        <window.Icon name="filter" size={10} />
                                                                        {activeColFilters.length > 0 && (
                                                                            <span className="absolute -top-1 -right-1 w-3.5 h-3.5 rounded-full bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 text-[8px] font-black flex items-center justify-center">
                                                                                {activeColFilters.length}
                                                                            </span>
                                                                        )}
                                                                    </button>
                                                                )}
                                                            </div>
                                                        </div>

                                                        {/* FILTER-POPUP FÖR TRATT-IKONEN */}
                                                        {isFilterOpen && col.filterKey && (
                                                            <>
                                                                <div className="fixed inset-0 z-40" onClick={() => setOpenFilterMenu(null)}></div>
                                                                <div 
                                                                    onClick={(e) => e.stopPropagation()}
                                                                    className="absolute left-0 top-full mt-1 w-56 bg-white dark:bg-[#182234] border border-zinc-300 dark:border-white/15 rounded-lg shadow-2xl z-50 overflow-hidden font-normal animate-in fade-in zoom-in-95 duration-150"
                                                                >
                                                                    <div className="bg-[#f4f5f7] dark:bg-[#141c2b] px-3 py-2 border-b border-zinc-200 dark:border-white/10 flex items-center justify-between">
                                                                        <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-600 dark:text-zinc-300">
                                                                            Filtrera {col.label}
                                                                        </span>
                                                                        {activeColFilters.length > 0 && (
                                                                            <button 
                                                                                type="button"
                                                                                onClick={() => setColumnFilters(prev => { const c = {...prev}; delete c[col.filterKey]; return c; })}
                                                                                className="text-[10px] font-bold text-orange-600 dark:text-orange-400 hover:underline"
                                                                            >
                                                                                Rensa
                                                                            </button>
                                                                        )}
                                                                    </div>
                                                                    <div className="max-h-56 overflow-y-auto p-1.5 space-y-0.5 custom-scrollbar">
                                                                        {(filterOptions[col.filterKey] || []).length === 0 ? (
                                                                            <div className="py-4 text-center text-[11px] text-zinc-400">Inga alternativ</div>
                                                                        ) : (
                                                                            (filterOptions[col.filterKey] || []).map(([val, count]) => {
                                                                                const checked = activeColFilters.includes(val);
                                                                                return (
                                                                                    <label 
                                                                                        key={val} 
                                                                                        onClick={() => toggleColumnFilterValue(col.filterKey, val)}
                                                                                        className={`flex items-center justify-between px-2.5 py-1.5 rounded text-[12px] cursor-pointer transition-colors ${
                                                                                            checked ? 'bg-orange-50 dark:bg-orange-500/15 text-orange-700 dark:text-orange-300 font-semibold' : 'text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-white/5'
                                                                                        }`}
                                                                                    >
                                                                                        <div className="flex items-center gap-2 truncate pr-2">
                                                                                            <input 
                                                                                                type="checkbox" 
                                                                                                checked={checked} 
                                                                                                readOnly 
                                                                                                className="rounded border-zinc-300 text-orange-500 focus:ring-0 pointer-events-none" 
                                                                                            />
                                                                                            <span className="truncate">{val}</span>
                                                                                        </div>
                                                                                        <span className="text-[10px] font-mono text-zinc-400 bg-zinc-100 dark:bg-white/5 px-1.5 py-0.5 rounded">
                                                                                            {count}
                                                                                        </span>
                                                                                    </label>
                                                                                );
                                                                            })
                                                                        )}
                                                                    </div>
                                                                </div>
                                                            </>
                                                        )}
                                                    </th>
                                                );
                                            })}
                                            <th className="w-[13%] px-3 py-3 hover:bg-zinc-200/60 dark:hover:bg-white/5 transition-colors cursor-pointer" onClick={() => requestSort('kundpris')}>
                                                <div className="flex items-center justify-end gap-1.5">
                                                    <span>Pris</span>
                                                    <button type="button" className="p-0.5 hover:bg-zinc-300/50 dark:hover:bg-white/10 rounded shrink-0">
                                                        <window.Icon name={sortConfig.key === 'kundpris' ? (sortConfig.direction === 'asc' ? 'arrow-up' : 'arrow-down') : 'arrow-up-down'} size={12} className={sortConfig.key === 'kundpris' ? "text-orange-600 dark:text-orange-400" : "text-orange-500/70"} />
                                                    </button>
                                                </div>
                                            </th>
                                            <th className="w-[110px] pl-2 pr-4 py-3 text-right">
                                                {Object.keys(columnFilters).length > 0 && (
                                                    <button 
                                                        type="button" 
                                                        onClick={clearAllColumnFilters}
                                                        title="Rensa alla kolumnfilter"
                                                        className="text-orange-500 hover:text-red-500 transition-colors"
                                                    >
                                                        <window.Icon name="filter-x" size={13} />
                                                    </button>
                                                )}
                                            </th>
                                        </tr>
                                    </thead>
                                )}
                                
                                {visibleJobs.length === 0 ? (
                                    <tbody>
                                        <tr>
                                            <td colSpan={isCompactView ? "11" : "8"} className="py-32 text-center">
                                                <div className="flex flex-col items-center justify-center text-zinc-400">
                                                    <div className="w-20 h-20 mb-4 rounded-full bg-zinc-100 dark:bg-white/10 flex items-center justify-center">
                                                        <window.Icon name="inbox" size={32} className="opacity-50" />
                                                    </div>
                                                    <span className="text-[14px] font-bold text-zinc-600 dark:text-zinc-300 uppercase tracking-widest mb-1">Inga uppdrag hittades</span>
                                                    <span className="text-[11px] text-zinc-400">Prova att ändra sökning eller byta flik.</span>
                                                </div>
                                            </td>
                                        </tr>
                                    </tbody>
                                ) : (
                                    <tbody className="divide-y divide-zinc-200/70 dark:divide-white/5 relative z-10">
                                    {(() => {
                                        let hasRenderedWaitingHeader = false;
                                        
                                        return visibleJobs.map((job, index) => {
                                            // NYTT: Rita ut avdelaren för klara jobb i tabellen
                                            if (job.isSeparator) {
                                                return (
                                                    <tr key={job.id} className="bg-zinc-100/90 dark:bg-white/5 border-y border-zinc-200 dark:border-white/10">
                                                        <td colSpan="11" className="px-4 py-3 text-[11px] font-bold uppercase tracking-widest text-zinc-500 dark:text-zinc-400">
                                                            <div className="flex items-center gap-2">
                                                                <window.Icon name="check-circle" size={14} className="text-emerald-500" />
                                                                {job.title}
                                                            </div>
                                                        </td>
                                                    </tr>
                                                );
                                            }

                                            const dateText = formatDate(job.datum);
                                            const isUrgent = ['IDAG', 'IMORGON'].includes(dateText) && job.status !== 'KLAR';
                                            const regDisplay = job.regnr || job.bilmodell || '-';
                                            const isReg = regDisplay.length <= 8 && /\d/.test(regDisplay);
                                            const isDone = ['KLAR', 'FAKTURERAS'].includes(job.status);
                                            const price = parseInt(job.kundpris) || 0;
                                            const paid = parseInt(job.betaltBelopp) || 0;
                                            const remaining = Math.max(0, price - paid);
                                            
                                            const isWaiting = !job.datum;
                                            const showWaitingHeader = isWaiting && !hasRenderedWaitingHeader && !job.isRecentCompleted;
                                            if (showWaitingHeader) hasRenderedWaitingHeader = true;

                                            // --- KOMPAKT RAD (Expanderbar med trädvy och action-knappar undertill) ---
                                            if (isCompactView) {
                                                const compactDate = job.datum 
                                                    ? job.datum.replace('T', ' ').substring(0, 16) 
                                                    : '';
                                                const serviceTitle = job.paket === 'Oljebyte' && job.oljevolym ? `Oljebyte ${job.oljevolym}l` : (job.paket || 'Standard');
                                                const cleanComment = stripHtml(job.kommentar);
                                                const isExpanded = expandedCompactIds.includes(job.id);

                                                return (
                                                    <React.Fragment key={job.id}>
                                                        {showWaitingHeader && (
                                                            <tr className="bg-zinc-100/90 dark:bg-white/5 border-y border-zinc-200 dark:border-white/10">
                                                                <td colSpan="10" className="px-4 py-2 text-[11px] font-bold uppercase tracking-widest text-zinc-500 dark:text-zinc-400">
                                                                    Oplanerade Uppdrag
                                                                </td>
                                                            </tr>
                                                        )}
                                                        <tr 
                                                            onClick={() => toggleCompactExpand(job.id)}
                                                            className={`group transition-colors duration-100 cursor-pointer text-[13px] border-b border-zinc-200/80 dark:border-white/5 hover:bg-zinc-100/70 dark:hover:bg-white/5 ${isExpanded ? 'bg-orange-50/30 dark:bg-white/[0.04]' : isDone ? 'bg-zinc-50/60 dark:bg-black/20 text-zinc-400' : 'bg-white dark:bg-[#1e293b]'}`}
                                                        >
                                                            {/* Expanderingspil (v / >) (Nu med bättre luft) */}
                                                            <td className="w-12 pl-3 py-3 text-center text-zinc-500">
                                                                <div className="inline-flex items-center justify-center">
                                                                    <window.Icon name={isExpanded ? "chevron-down" : "chevron-right"} size={15} className={isExpanded ? "text-orange-500" : ""} />
                                                                </div>
                                                            </td>

                                                            {/* Uppdrag + Skiftnyckelikon (utan #ID) */}
                                                            <td className="px-3.5 py-3 max-w-[230px] truncate text-zinc-800 dark:text-zinc-200">
                                                                <div className="flex items-center gap-2 truncate">
                                                                    {/* FIX: Teal färg på skiftnyckeln för enhetlighet */}
                                                                    <window.Icon name="wrench" size={13} className="text-teal-600 dark:text-teal-400 shrink-0" />
                                                                    <span className="font-medium text-zinc-900 dark:text-white">{serviceTitle}</span>
                                                                    {cleanComment && !isExpanded && (
                                                                        <span className="text-zinc-400 dark:text-zinc-500 text-[12px] truncate">
                                                                            – {cleanComment}
                                                                        </span>
                                                                    )}
                                                                </div>
                                                            </td>

                                                            {/* Kund */}
                                                            <td className="px-3.5 py-3 text-zinc-800 dark:text-zinc-200 uppercase max-w-[170px] truncate">
                                                                {job.kundnamn || ''}
                                                            </td>

                                                            {/* Reg.nr (Klicka för att kopiera utan att fälla ihop raden) */}
                                                            <td 
                                                                onClick={(e) => handleCopyDesktop(e, regDisplay, job.id)}
                                                                className="px-3.5 py-3 text-zinc-800 dark:text-zinc-200 hover:text-orange-500 dark:hover:text-orange-400 font-medium whitespace-nowrap"
                                                                title="Klicka för att kopiera Reg.nr"
                                                            >
                                                                {copiedRegId === job.id ? (
                                                                    <span className="text-emerald-600 dark:text-emerald-400 font-semibold">Kopierad!</span>
                                                                ) : (
                                                                    regDisplay === '-' ? '' : regDisplay
                                                                )}
                                                            </td>

                                                            {/* Mottagandedatum */}
                                                            <td className="px-3.5 py-3 text-zinc-800 dark:text-zinc-200 whitespace-nowrap">
                                                                {compactDate || ''}
                                                            </td>

                                                            {/* Status */}
                                                            {/* Status (Ren text med krispig färg) */}
                                                            <td className="px-3.5 py-3 whitespace-nowrap text-[13px]">
                                                                <span className={`font-medium uppercase tracking-wide ${
                                                                    job.status === 'KLAR' ? 'text-[#00b074] dark:text-emerald-400' :
                                                                    job.status === 'BOKAD' ? 'text-orange-600 dark:text-orange-400' :
                                                                    job.status === 'OFFERERAD' ? 'text-blue-600 dark:text-blue-400' :
                                                                    job.status === 'FAKTURERAS' ? 'text-[#0096c7] dark:text-sky-400 decoration-[#0096c7]/50 underline-offset-2' :
                                                                    'text-zinc-700 dark:text-zinc-300'
                                                                }`}>
                                                                    {(job.status || 'BOKAD').toUpperCase()}
                                                                </span>
                                                            </td>

                                                            {/* Chnr, Märke, Modell */}
                                                            <window.CompactVehicleCells job={job} />

                                                            {/* Pris */}
                                                            <td className="px-3.5 py-3 text-right text-zinc-800 dark:text-zinc-200 whitespace-nowrap">
                                                                {remaining > 0 ? `${remaining.toLocaleString('sv-SE')} kr` : (price > 0 ? `${price.toLocaleString('sv-SE')} kr` : '')}
                                                            </td>
                                                        </tr>

                                                        {/* EXPANDERAD RAD UNDERTILL (Samma stil som i newJob.js) */}
                                                        {isExpanded && (
                                                            <tr className="bg-zinc-50/70 dark:bg-black/25 border-b border-zinc-200/80 dark:border-white/10 animate-in fade-in duration-150">
                                                                <td></td>
                                                                <td colSpan="9" className="px-3.5 pb-4 pt-2">
                                                                    <div className="flex flex-wrap items-center gap-2 mb-3">
                                                                        <button
                                                                            type="button"
                                                                            onClick={(e) => { e.stopPropagation(); setView('NEW_JOB', { job: job }); }}
                                                                            className="px-3 py-1 rounded border border-orange-500/60 text-orange-600 dark:text-orange-400 hover:bg-orange-500 hover:text-white text-[11px] font-bold uppercase tracking-wider transition-colors"
                                                                        >
                                                                            Öppna order
                                                                        </button>
                                                                        {job.regnr && (
                                                                            <button
                                                                                type="button"
                                                                                onClick={(e) => { e.stopPropagation(); handleOpenHistory(job.regnr, job.id, job); }}
                                                                                className="px-3 py-1 rounded border border-orange-500/60 text-orange-600 dark:text-orange-400 hover:bg-orange-500 hover:text-white text-[11px] font-bold uppercase tracking-wider transition-colors"
                                                                            >
                                                                                Fordonskort & Historik
                                                                            </button>
                                                                        )}
                                                                        <button
                                                                            type="button"
                                                                            onClick={(e) => { 
                                                                                e.stopPropagation(); 
                                                                                window.prefillName = job.kundnamn || ''; 
                                                                                setView('NEW_JOB'); 
                                                                            }}
                                                                            className="px-3 py-1 rounded border border-orange-500/60 text-orange-600 dark:text-orange-400 hover:bg-orange-500 hover:text-white text-[11px] font-bold uppercase tracking-wider transition-colors"
                                                                        >
                                                                            Ny länkad order
                                                                        </button>
                                                                        {job.status !== 'KLAR' && (
                                                                            <button
                                                                                type="button"
                                                                                onClick={(e) => { e.stopPropagation(); window.db.collection("jobs").doc(job.id).update({ status: 'KLAR' }); }}
                                                                                className="px-3 py-1 rounded border border-emerald-500/50 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500 hover:text-white text-[11px] font-bold uppercase tracking-wider transition-colors"
                                                                            >
                                                                                Markera klar
                                                                            </button>
                                                                        )}
                                                                        <button
                                                                            type="button"
                                                                            onClick={(e) => { e.stopPropagation(); if (confirm("Radera ordern?")) window.db.collection("jobs").doc(job.id).update({ deleted: true }); }}
                                                                            className="ml-auto px-2.5 py-1 rounded border border-red-300 dark:border-red-500/30 text-red-500 hover:bg-red-500 hover:text-white text-[10px] font-bold uppercase tracking-wider transition-colors"
                                                                        >
                                                                            Radera
                                                                        </button>
                                                                    </div>

                                                                    {/* Trädstruktur med paket, hela kommentaren och utgifter */}
                                                                    <div className="pl-1 space-y-1.5 text-[12px] text-zinc-700 dark:text-zinc-300">
                                                                        <div className="flex items-center gap-1.5 font-semibold text-zinc-900 dark:text-white">
                                                                            <window.Icon name="chevron-down" size={13} className="text-zinc-400" />
                                                                            <window.Icon name="box" size={13} className="text-orange-500" />
                                                                            <span>{serviceTitle}</span>
                                                                            {paid > 0 && (
                                                                                <span className="ml-2 text-[11px] font-normal text-emerald-600 dark:text-emerald-400">
                                                                                    (Delbetalt: {paid.toLocaleString('sv-SE')} kr)
                                                                                </span>
                                                                            )}
                                                                        </div>
                                                                        {cleanComment && (
                                                                            <div className="pl-6 flex items-start gap-2 text-zinc-600 dark:text-zinc-300 max-w-3xl">
                                                                                <window.Icon name="wrench" size={12} className="text-orange-500 mt-1 shrink-0" />
                                                                                <span className="whitespace-pre-wrap leading-relaxed" onClick={(e) => e.stopPropagation()}>
                                                                                    <window.TaskFormatter text={cleanComment} isDone={false} />
                                                                                </span>
                                                                            </div>
                                                                        )}
                                                                        {job.utgifter && job.utgifter.filter(u => u.namn).map((u, idx) => (
                                                                            <div key={idx} className="pl-6 flex items-center gap-2 text-zinc-500 dark:text-zinc-400">
                                                                                <window.Icon name="tag" size={11} className="text-orange-500 shrink-0" />
                                                                                <span>{u.namn} ({u.kostnad} kr)</span>
                                                                            </div>
                                                                        ))}
                                                                    </div>
                                                                </td>
                                                            </tr>
                                                        )}
                                                    </React.Fragment>
                                                );
                                            }

                                            // --- LUFTIG RAD (Uppdaterad med tightare sidor & renare design) ---
                                            return (
                                                <React.Fragment key={job.id}>
                                                    {showWaitingHeader && (
                                                        <tr className="bg-zinc-50/60 dark:bg-white/[0.02]">
                                                            <td colSpan="7" className="py-3.5 px-4 relative">
                                                                <div className="flex items-center gap-3">
                                                                    <div className="h-px flex-1 bg-zinc-200/80 dark:bg-white/10"></div>
                                                                    <span className="bg-white dark:bg-[#1a2235] px-3.5 py-1 text-[10px] font-bold uppercase tracking-widest text-zinc-500 dark:text-zinc-400 flex items-center gap-1.5 rounded-full border border-zinc-200/80 dark:border-white/10 shadow-sm">
                                                                        <window.Icon name="inbox" size={12} className="text-orange-500/80" />
                                                                        Oplanerade Uppdrag
                                                                    </span>
                                                                    <div className="h-px flex-1 bg-zinc-200/80 dark:bg-white/10"></div>
                                                                </div>
                                                            </td>
                                                        </tr>
                                                    )}

                                                    {(() => {
                                                        const isSpaciousExpanded = expandedCompactIds.includes(job.id);
                                                        const serviceTitle = job.paket === 'Oljebyte' && job.oljevolym ? `Oljebyte ${job.oljevolym}l` : (job.paket || 'Standard');
                                                        const cleanComment = stripHtml(job.kommentar);

                                                        return (
                                                            <>
                                                                <tr 
                                                                    onClick={() => toggleCompactExpand(job.id)}
                                                                    className={`group transition-all duration-150 cursor-pointer relative hover:bg-orange-50/40 dark:hover:bg-white/[0.04] border-b border-zinc-100 dark:border-white/5 last:border-0 ${isSpaciousExpanded ? 'bg-orange-50/30 dark:bg-white/[0.03]' : isDone ? 'bg-zinc-50/40 dark:bg-black/20 opacity-70 hover:opacity-100' : 'bg-transparent'}`}
                                                                >
                                                                    {/* KUND */}
                                                                    <td className="pl-4 pr-2 py-3.5 align-middle relative">
                                                                        <div className={`absolute left-0 top-1.5 bottom-1.5 w-[3px] bg-orange-500 transition-opacity rounded-r-full shadow-[0_0_8px_rgba(249,115,22,0.5)] ${isSpaciousExpanded ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}></div>
                                                                        <div className="flex items-center gap-3.5">
                                                                            <window.CustomerAvatar job={job} />
                                                                            <div className="min-w-0">
                                                                                <div className="text-[14px] font-bold text-zinc-900 dark:text-white leading-tight group-hover:text-orange-500 transition-colors truncate">
                                                                                    {job.kundnamn}
                                                                                </div>
                                                                            </div>
                                                                        </div>
                                                                    </td>

                                                                    {/* SERVICE TYP */}
                                                                    <td className="px-3 py-3.5 align-middle relative">
                                                                        <div className="flex flex-col min-w-0">
                                                                            <div className="flex items-center gap-1.5">
                                                                                <span className="text-[13px] font-bold text-zinc-700 dark:text-zinc-300 transition-colors group-hover:text-zinc-900 dark:group-hover:text-white truncate max-w-[150px] md:max-w-[200px] xl:max-w-none">
                                                                                    {serviceTitle}
                                                                                </span>
                                                                                <window.Icon name={isSpaciousExpanded ? "chevron-up" : "chevron-down"} size={13} className={`shrink-0 transition-transform duration-200 ${isSpaciousExpanded ? 'text-orange-500' : 'text-zinc-300 dark:text-zinc-600 opacity-0 group-hover:opacity-100'}`} />
                                                                            </div>
                                                                            
                                                                            {cleanComment && !isSpaciousExpanded && (
                                                                                <div className="flex items-center gap-1.5 text-[11px] text-zinc-500 dark:text-zinc-400 italic max-w-[160px] md:max-w-[200px] lg:max-w-[260px] xl:max-w-[380px] mt-1">
                                                                                    <window.Icon name="message-square" size={10} className="shrink-0" />
                                                                                    <span className="truncate">{cleanComment}</span>
                                                                                </div>
                                                                            )}
                                                                        </div>
                                                                    </td>

                                                                    {/* REG.NR */}
                                                                    <td className="px-3 py-3.5 align-middle">
                                                                        <div 
                                                                            onClick={(e) => handleCopyDesktop(e, regDisplay, job.id)} 
                                                                            className={`inline-flex items-center justify-start rounded-[4px] border overflow-hidden w-[110px] h-[30px] cursor-pointer hover:border-orange-500 group/copy relative ${isReg ? 'bg-zinc-50 dark:bg-black/20 border-zinc-200 dark:border-white/10' : 'bg-transparent border-transparent'} transition-all`}
                                                                        >
                                                                            {copiedRegId === job.id && (
                                                                                <div className="absolute inset-0 bg-emerald-500 flex items-center justify-center text-white z-20 animate-in slide-in-from-bottom-2 duration-200">
                                                                                    <window.Icon name="check" size={14} />
                                                                                </div>
                                                                            )}
                                                                            {isReg ? (
                                                                                <>
                                                                                    <div className="w-[16px] h-full bg-[#003399] flex flex-col items-center justify-between py-[2px] shrink-0 border-r border-zinc-200 dark:border-white/10">
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

                                                                    {/* BOKAT DATUM */}
                                                                    <td className="px-3 py-3.5 align-middle">
                                                                        {job.datum ? (
                                                                            <div className="flex items-center gap-2.5">
                                                                                {isUrgent && (
                                                                                    <span className="relative flex h-2 w-2 shrink-0">
                                                                                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-orange-400 opacity-75"></span>
                                                                                        <span className="relative inline-flex rounded-full h-2 w-2 bg-orange-500 shadow-[0_0_8px_rgba(249,115,22,0.8)]"></span>
                                                                                    </span>
                                                                                )}
                                                                                <div className={`flex items-center gap-1.5 text-[13px] font-medium leading-none ${isUrgent ? 'text-orange-600 dark:text-orange-400' : 'text-zinc-800 dark:text-zinc-200 transition-colors'}`}>
                                                                                    <span className="uppercase">{dateText}</span>
                                                                                    <span className={job.datum.includes('00:00') ? 'text-zinc-300 dark:text-zinc-600 font-normal' : ''}>
                                                                                        {formatTime(job.datum)}
                                                                                    </span>
                                                                                </div>
                                                                            </div>
                                                                        ) : (
                                                                            <span className="text-[13px] font-medium text-zinc-400 dark:text-zinc-500">
                                                                                Ej inbokad
                                                                            </span>
                                                                        )}
                                                                    </td>

                                                                    {/* STATUS */}
                                                                    <td className="px-3 py-3.5 align-middle">
                                                                        <window.Badge status={job.status} />
                                                                    </td>

                                                                    {/* PRIS */}
                                                                    <td className="px-3 py-3.5 align-middle text-right">
                                                                        <div className="text-[14px] font-normal leading-none tabular-nums group-hover:text-zinc-900 dark:group-hover:text-white transition-colors flex flex-col items-end">
                                                                            {paid > 0 ? (
                                                                                <>
                                                                                    <span className="text-[10px] text-emerald-500 font-medium tracking-widest uppercase mb-1">
                                                                                        {paid.toLocaleString('sv-SE')} kr
                                                                                    </span>
                                                                                    <div className="text-orange-500">
                                                                                        {remaining.toLocaleString('sv-SE')} <span className="text-[10px] text-zinc-400 dark:text-zinc-500 tracking-widest uppercase font-normal ml-0.5">kr</span>
                                                                                    </div>
                                                                                </>
                                                                            ) : (
                                                                                <div className="text-zinc-700 dark:text-zinc-200">
                                                                                    {price.toLocaleString('sv-SE')} <span className="text-[10px] text-zinc-400 dark:text-zinc-500 tracking-widest uppercase font-normal ml-0.5">kr</span>
                                                                                </div>
                                                                            )}
                                                                        </div>
                                                                    </td>

                                                                    {/* SNABBÅTGÄRDER VID HOVER */}
                                                                    <td className="pl-2 pr-4 py-3.5 align-middle text-right relative">
                                                                        <window.VehicleDataIcon job={job} isDesktop={true} />
                                                                        <div className="opacity-0 group-hover:opacity-100 transition-all duration-200 ease-out flex justify-end items-center gap-1.5 relative z-10 scale-95 group-hover:scale-100">
                                                                            {job.status !== 'KLAR' && (
                                                                                <button onClick={(e) => { e.stopPropagation(); window.db.collection("jobs").doc(job.id).update({status: 'KLAR'}); }} className="w-8 h-8 flex items-center justify-center rounded-lg bg-white dark:bg-black/30 border border-zinc-200 dark:border-white/10 text-zinc-500 hover:bg-emerald-50 dark:hover:bg-emerald-500/10 hover:text-emerald-600 hover:border-emerald-200 shadow-sm transition-all active:scale-95" title="Markera klar">
                                                                                    <window.Icon name="check" size={15} />
                                                                                </button>
                                                                            )}
                                                                            <button onClick={(e) => { e.stopPropagation(); setView('NEW_JOB', { job: job }); }} className="w-8 h-8 flex items-center justify-center rounded-lg bg-white dark:bg-black/30 border border-zinc-200 dark:border-white/10 text-zinc-500 hover:bg-blue-50 dark:hover:bg-blue-500/10 hover:text-blue-600 hover:border-blue-200 shadow-sm transition-all active:scale-95" title="Redigera">
                                                                                <window.Icon name="edit-2" size={14} />
                                                                            </button>
                                                                            <button onClick={(e) => { e.stopPropagation(); if(confirm("Radera?")) window.db.collection("jobs").doc(job.id).update({deleted:true}); }} className="w-8 h-8 flex items-center justify-center rounded-lg bg-white dark:bg-black/30 border border-zinc-200 dark:border-white/10 text-zinc-500 hover:bg-red-50 dark:hover:bg-red-500/10 hover:text-red-600 hover:border-red-200 shadow-sm transition-all active:scale-95" title="Radera">
                                                                                <window.Icon name="trash" size={14} />
                                                                            </button>
                                                                        </div>
                                                                    </td>
                                                                </tr>

                                                                {/* UTFÄLLD PANEL I LUFTIG VY */}
                                                                {isSpaciousExpanded && (
                                                                    <tr className="bg-zinc-50/70 dark:bg-black/25 border-b border-zinc-200/80 dark:border-white/10 animate-in fade-in duration-150">
                                                                        <td colSpan="7" className="pl-[68px] pr-6 pb-4 pt-2.5">
                                                                            <div className="flex flex-wrap items-center gap-2 mb-3">
                                                                                <button
                                                                                    type="button"
                                                                                    onClick={(e) => { e.stopPropagation(); setView('NEW_JOB', { job: job }); }}
                                                                                    className="px-3 py-1 rounded border border-orange-500/60 text-orange-600 dark:text-orange-400 hover:bg-orange-500 hover:text-white text-[11px] font-bold uppercase tracking-wider transition-colors"
                                                                                >
                                                                                    Öppna order
                                                                                </button>
                                                                                {job.regnr && (
                                                                                    <button
                                                                                        type="button"
                                                                                        onClick={(e) => { e.stopPropagation(); handleOpenHistory(job.regnr, job.id, job); }}
                                                                                        className="px-3 py-1 rounded border border-orange-500/60 text-orange-600 dark:text-orange-400 hover:bg-orange-500 hover:text-white text-[11px] font-bold uppercase tracking-wider transition-colors"
                                                                                    >
                                                                                        Fordonskort & Historik
                                                                                    </button>
                                                                                )}
                                                                                <button
                                                                                    type="button"
                                                                                    onClick={(e) => { 
                                                                                        e.stopPropagation(); 
                                                                                        window.prefillName = job.kundnamn || ''; 
                                                                                        setView('NEW_JOB'); 
                                                                                    }}
                                                                                    className="px-3 py-1 rounded border border-orange-500/60 text-orange-600 dark:text-orange-400 hover:bg-orange-500 hover:text-white text-[11px] font-bold uppercase tracking-wider transition-colors"
                                                                                >
                                                                                    Ny länkad order
                                                                                </button>
                                                                            </div>

                                                                            <div className="space-y-1.5 text-[12px] text-zinc-700 dark:text-zinc-300">
                                                                                <div className="flex items-center gap-1.5 font-semibold text-zinc-900 dark:text-white">
                                                                                    <window.Icon name="chevron-down" size={13} className="text-zinc-400" />
                                                                                    <window.Icon name="box" size={13} className="text-orange-500" />
                                                                                    <span>{serviceTitle}</span>
                                                                                </div>
                                                                                {cleanComment && (
                                                                                    <div className="pl-6 flex items-start gap-2 text-zinc-600 dark:text-zinc-300 max-w-3xl">
                                                                                        <window.Icon name="wrench" size={12} className="text-orange-500 mt-1 shrink-0" />
                                                                                        <span className="whitespace-pre-wrap leading-relaxed">{cleanComment}</span>
                                                                                    </div>
                                                                                )}
                                                                                {job.utgifter && job.utgifter.filter(u => u.namn).map((u, idx) => (
                                                                                    <div key={idx} className="pl-6 flex items-center gap-2 text-zinc-500 dark:text-zinc-400">
                                                                                        <window.Icon name="tag" size={11} className="text-orange-500 shrink-0" />
                                                                                        <span>{u.namn} ({u.kostnad} kr)</span>
                                                                                    </div>
                                                                                ))}
                                                                            </div>
                                                                        </td>
                                                                    </tr>
                                                                )}
                                                            </>
                                                        );
                                                    })()}
                                                </React.Fragment>
                                            );
                                        });
                                    })()}
                                </tbody>
                                )}
                            </table>
                            
                            {hasMore && (
                                <div className="flex justify-center p-6 border-t border-zinc-200 dark:border-white/10 bg-zinc-50/50 dark:bg-black/20">
                                    <button onClick={() => setVisibleCount(prev => prev + 20)} className="px-8 py-3 bg-white dark:bg-[#1e293b] border border-zinc-200 dark:border-white/10 hover:bg-zinc-50 dark:hover:bg-white/5 hover:border-orange-500/30 text-zinc-600 dark:text-zinc-300 hover:text-orange-500 text-[11px] font-bold uppercase tracking-widest rounded-xl shadow-sm hover:shadow-md transition-all flex items-center gap-2 active:scale-95">
                                        Ladda in fler <span className="opacity-50 font-medium">({sortedAndFilteredJobs.length - visibleCount} kvar)</span>
                                    </button>
                                </div>
                            )}

                        </div>
                    </div>
                </div>
            </div>

            <div className="lg:hidden flex flex-col min-h-[100dvh] bg-zinc-50/50 dark:bg-[#09090b] transition-colors duration-500">
                {/* FIX: Lade till 'z-50' här så att hela headern och den utfällda menyn alltid ligger över jobbkorten */}
                <div className="bg-white/95 dark:bg-[#1e293b]/95 backdrop-blur-2xl text-zinc-900 dark:text-white pt-safe-top pt-2 shadow-sm border-b border-zinc-200 dark:border-white/10 transition-colors duration-300 relative z-50">                    
                    <div className="px-4 pb-4 pt-2 flex items-center justify-between border-b border-zinc-100 dark:border-white/10">
                        
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
                                className={`w-10 h-10 flex items-center justify-center rounded-xl transition-all border ${showMobileWidgets ? 'bg-orange-500 text-white border-orange-500 shadow-md' : 'bg-zinc-100 dark:bg-black/20 text-zinc-500 dark:text-zinc-400 hover:text-orange-500 hover:bg-orange-50 dark:hover:bg-orange-500/10 dark:hover:text-white border-transparent dark:border-white/10'}`}
                            >
                                <window.Icon name={showMobileWidgets ? "chevron-up" : "layout-dashboard"} size={18} />
                            </button>
                            <button 
                                onClick={() => window.dispatchEvent(new CustomEvent('open-spotlight'))} 
                                className="w-10 h-10 flex items-center justify-center rounded-xl bg-zinc-100 dark:bg-black/20 text-zinc-500 dark:text-zinc-400 hover:text-orange-500 dark:hover:text-white transition-colors border border-transparent dark:border-white/10 active:scale-90"
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
                                <button key={f} data-tab={f} onClick={() => { setActiveFilter(f); setShowMobileWidgets(false); }} className={`py-3 px-1 text-[11px] font-bold uppercase tracking-widest transition-all border-b-2 whitespace-nowrap relative ${isActive ? 'text-orange-500 border-orange-500' : 'text-zinc-400 dark:text-zinc-400 border-transparent'}`}>
                                    {f}
                                    {count > 0 && <span className={`ml-2 px-1.5 py-0.5 rounded-md text-[9px] ${isActive ? 'bg-orange-50 dark:bg-orange-500/10 text-orange-600 dark:text-orange-400' : 'bg-zinc-100 dark:bg-white/5 text-zinc-400'}`}>{count}</span>}
                                </button>
                            );
                        })}
                    </div>

                    {showMobileWidgets && (
                        <>
                            {/* Mörk overlay som skuggar bort jobbkorten i bakgrunden */}
                            <div className="absolute top-full left-0 right-0 h-[100dvh] bg-zinc-900/20 dark:bg-black/50 backdrop-blur-[2px] z-40 animate-in fade-in duration-300 pointer-events-none"></div>
                            
                            {/* FIX: Ändrat till en giltig färgklass (/95). 
                                Lade även till 'rounded-b-3xl' för snygga hörn i botten nu när du kör 90dvh! */}
                            <div className="absolute top-full left-0 right-0 bg-zinc-100/95 dark:bg-[#09090b]/95 backdrop-blur-3xl shadow-[0_40px_80px_rgba(0,0,0,0.3)] dark:shadow-[0_40px_80px_rgba(0,0,0,0.8)] border-b border-zinc-300/50 dark:border-white/10 rounded-b-3xl p-4 pt-5 pb-6 animate-in slide-in-from-top-2 fade-in duration-200 h-[90dvh] overflow-y-auto custom-scrollbar z-50">
                                <window.DashboardWidgets allJobs={allJobs} />
                            </div>
                        </>
                    )}
                </div>

                {activeFilter === 'FAKTURERAS' && invoiceStats.total > 0 && (
                    <div className="mx-3 mt-4 mb-2 p-4 rounded-2xl bg-white/90 dark:bg-[#1e293b]/90 backdrop-blur-xl border border-zinc-200/80 dark:border-white/10 shadow-lg dark:shadow-[0_10px_30px_rgba(0,0,0,0.5)] relative overflow-hidden animate-in fade-in slide-in-from-top-2 duration-300">
                        <div className="absolute right-0 top-0 w-32 h-32 bg-orange-500/10 blur-[50px] rounded-full pointer-events-none"></div>
                        
                        <div className="flex items-center justify-between relative z-10">
                            <div>
                                <h3 className="text-[9px] font-bold text-zinc-400 dark:text-zinc-400 uppercase tracking-widest mb-1 flex items-center gap-1.5">
                                    <window.Icon name="pie-chart" size={10} className="text-orange-500" /> Att Fakturera
                                </h3>
                                <div className="text-2xl font-light text-zinc-900 dark:text-white tracking-tighter leading-none">
                                    {invoiceStats.total.toLocaleString('sv-SE')} <span className="text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-widest ml-0.5">kr</span>
                                </div>
                            </div>
                            <div className="text-right">
                                <span className="text-[10px] font-medium bg-zinc-50 dark:bg-black/30 text-zinc-600 dark:text-zinc-300 px-2.5 py-1.5 rounded-lg border border-zinc-200/80 dark:border-white/10 flex items-center gap-1.5">
                                    <window.Icon name="users" size={10} /> {invoiceStats.topCustomers.length} Kunder
                                </span>
                            </div>
                        </div>

                        <div className="relative z-10 mt-4 pt-4 border-t border-zinc-100 dark:border-white/10">
                            <div className="space-y-3.5">
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
                                            <div className="h-1.5 w-full bg-zinc-100 dark:bg-black/40 rounded-full overflow-hidden border border-transparent dark:border-white/5">
                                                <div 
                                                    className="h-full bg-gradient-to-r from-orange-500 to-orange-400 rounded-full transition-all duration-1000 ease-out" 
                                                    style={{ width: `${percentage}%` }}
                                                ></div>
                                            </div>
                                        </div>
                                    );
                                })}
                                
                                {invoiceStats.topCustomers.length > 5 && (
                                    <div className="text-[10px] font-bold uppercase tracking-widest text-center text-zinc-400 dark:text-zinc-500 pt-1">
                                        + {invoiceStats.topCustomers.length - 5} fler kunder
                                    </div>
                                )}
                            </div>
                        </div>
                        
                    </div>
                )}

                {['ALLA', 'BOKAD', 'KLAR'].includes(activeFilter) && (
                    <div className="px-3 mt-3 mb-2 animate-in fade-in slide-in-from-top-2 duration-300">
                        <div className="relative group">
                            <input 
                                type="text" 
                                placeholder="SÖK I ALLA UPPDRAG..." 
                                className="bg-white dark:bg-[#1e293b] border border-zinc-200/80 dark:border-white/10 hover:border-zinc-300 dark:hover:border-white/20 focus:border-orange-500 focus:ring-4 focus:ring-orange-500/10 py-3.5 pl-11 pr-11 text-[12px] font-bold text-zinc-900 dark:text-white outline-none w-full transition-all uppercase tracking-widest placeholder:text-zinc-400 rounded-lg shadow-md"
                                value={globalSearch}
                                onChange={(e) => setGlobalSearch(e.target.value)}
                            />
                            <window.Icon name="search" size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400 group-focus-within:text-orange-500 transition-colors duration-300" />
                            
                            {globalSearch && (
                                <button 
                                    onClick={() => setGlobalSearch('')}
                                    className="absolute right-2.5 top-1/2 -translate-y-1/2 w-8 h-8 flex items-center justify-center text-zinc-400 hover:text-red-500 bg-zinc-100 dark:bg-white/5 hover:bg-red-50 dark:hover:bg-red-500/20 rounded-xl transition-all active:scale-95"
                                    title="Rensa sökning"
                                >
                                    <window.Icon name="x" size={14} />
                                </button>
                            )}
                        </div>
                    </div>
                )}

                <div className="px-3 pt-1 pb-6 flex flex-col">
                    {sortedAndFilteredJobs.length > 0 ? (
                        <>
                            {(() => {
                                let lastDate = null;
                                const waitingJobsCount = visibleJobs.filter(j => !j.isSeparator && !j.datum).length;

                                return visibleJobs.map((job, index) => { 
                                    // NYTT: Rita ut avdelaren för klara jobb på mobilen
                                    if (job.isSeparator) {
                                        return (
                                            <div key={job.id} className="mt-8 mb-4 px-2 flex items-center gap-2 animate-in fade-in duration-300">
                                                <div className="h-4 w-1 bg-gradient-to-b from-emerald-400 to-emerald-600 rounded-full shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
                                                <h3 className="text-[12px] font-bold text-zinc-900 dark:text-white uppercase tracking-widest flex items-center gap-2">
                                                    {job.title}
                                                </h3>
                                            </div>
                                        );
                                    }

                                    const isWaiting = !job.datum;
                                    const currentDate = isWaiting ? 'INVÄNTAR DATUM' : formatDate(job.datum);
                                    const showHeader = currentDate !== lastDate && !job.isRecentCompleted;
                                    
                                    // Spara endast datum för aktiva jobb, ej klara historik-jobb
                                    if (!job.isRecentCompleted) {
                                        lastDate = currentDate;
                                    }

                                    if (isWaiting && !job.isRecentCompleted) {
                                        return (
                                            <React.Fragment key={job.id}>
                                                {showHeader && (
                                                    <div className={`${index === 0 ? 'mt-4' : 'mt-8'} mb-6 px-4 flex justify-center relative animate-in fade-in duration-300`}>
                                                        <div className="absolute inset-0 flex items-center px-6" aria-hidden="true">
                                                            <div className="w-full h-px bg-gradient-to-r from-transparent via-zinc-200 dark:via-white/10 to-transparent"></div>
                                                        </div>
                                                        <button 
                                                            onClick={() => setShowWaitingJobs(!showWaitingJobs)}
                                                            className="relative bg-white dark:bg-[#1e293b] px-5 py-2 rounded-full border border-zinc-200 dark:border-white/10 shadow-sm flex items-center gap-2.5 hover:border-orange-500 hover:text-orange-500 text-zinc-600 dark:text-zinc-300 transition-all active:scale-95 z-10"
                                                        >
                                                            <window.Icon name="inbox" size={14} className={showWaitingJobs ? 'text-orange-500' : 'text-zinc-400'} />
                                                            <span className="text-[10px] font-bold uppercase tracking-widest mt-[1px] flex items-center gap-1.5">
                                                                Oplanerade
                                                                <span className="bg-zinc-100 dark:bg-white/5 text-zinc-400 px-1.5 py-0.5 rounded-md text-[9px]">{waitingJobsCount}</span>
                                                            </span>
                                                            <window.Icon name="chevron-down" size={14} className={`transition-transform duration-300 ${showWaitingJobs ? 'rotate-180 text-orange-500' : 'text-zinc-400'}`} />
                                                        </button>
                                                    </div>
                                                )}
                                                
                                                {showWaitingJobs && (
                                                    <div className="animate-in slide-in-from-top-2 fade-in duration-300">
                                                        <MobileJobCard job={job} setView={setView} onOpenHistory={handleOpenHistory} />
                                                    </div>
                                                )}
                                            </React.Fragment>
                                        );
                                    }

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
                                    <button onClick={() => setVisibleCount(prev => prev + 20)} className="w-full py-4 bg-white dark:bg-[#1e293b] border border-zinc-200 dark:border-white/10 hover:border-orange-500/50 text-zinc-700 dark:text-zinc-300 hover:text-orange-500 text-[12px] font-bold uppercase tracking-widest rounded-2xl shadow-lg active:scale-95 transition-all">
                                        Ladda in fler ({sortedAndFilteredJobs.length - visibleCount} kvar)
                                    </button>
                                </div>
                            )}
                        </>
                ) : (
                    <div className="flex flex-col items-center justify-center py-24 text-zinc-400">
                        <div className="w-20 h-20 mb-4 rounded-full bg-zinc-100 dark:bg-[#1e293b] flex items-center justify-center shadow-lg">
                            <window.Icon name="inbox" size={32} className="opacity-50 text-zinc-400" />
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
