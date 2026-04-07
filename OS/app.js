// app.js - Full uppdaterad version med Native Navigation, Dark Mode & Kompakt Spotlight

const { useState, useEffect, useMemo, useRef, memo } = React;

// --- 1. FIREBASE ---
const firebaseConfig = {
    apiKey: "AIzaSyDwCQkUl-je3L3kF7EuxRC6Dm6Gw2N0nJw",
    authDomain: "planerare-f6006.firebaseapp.com",
    projectId: "planerare-f6006",
    storageBucket: "planerare-f6006.firebasestorage.app",
    messagingSenderId: "360462069749",
    appId: "1:360462069749:web:c754879f3f75d5ef3cbabc"
};

if (!firebase.apps.length) firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();

// AKTIVERA OFFLINE-STÖD
db.settings({ cacheSizeBytes: firebase.firestore.CACHE_SIZE_UNLIMITED });
db.enablePersistence({ synchronizeTabs: true }).catch(err => {
    console.warn("Offline persistence failed:", err.code);
});

const auth = firebase.auth();
window.db = db;
window.firebase = firebase;

// --- 2. GLOBALA KOMPONENTER ---
window.Icon = ({ name, size = 18, className = "" }) => (
    <span className={`inline-flex items-center justify-center ${className}`} style={{ width: size, height: size }}>
        <i data-lucide={name} style={{ width: '100%', height: '100%' }}></i>
    </span>
);

const SplashScreen = () => (
    <div className="fixed inset-0 bg-zinc-950 flex items-center justify-center z-[9999] animate-out fade-out duration-500 delay-1000 fill-mode-forwards pointer-events-none">
        <div className="flex flex-col items-center">
            <div className="w-16 h-16 bg-[#f97316] flex items-center justify-center font-black rounded-sm text-black shadow-lg text-3xl animate-pulse">P</div>
            <h1 className="mt-4 text-white font-black uppercase tracking-[0.3em] text-sm">Planerare // OS</h1>
            <div className="mt-6 w-32 h-1 bg-zinc-800 rounded-full overflow-hidden">
                <div className="h-full bg-[#f97316] animate-[loading_1s_ease-in-out_infinite]"></div>
            </div>
            <p className="mt-2 text-[8px] font-black text-zinc-500 uppercase tracking-widest">Initializing_Core_Systems...</p>
        </div>
    </div>
);

// HJÄLPKOMPONENT: Highlighting av söktext
const HighlightText = ({ text, highlight }) => {
    if (!text) return null;
    if (!highlight || !highlight.trim()) return <>{text}</>;
    const regex = new RegExp(`(${highlight})`, 'gi');
    const parts = text.split(regex);
    return (
        <>{parts.map((part, i) =>
            regex.test(part) ? <span key={i} className="bg-orange-500/30 text-orange-700 dark:text-orange-400 rounded-[2px] px-0.5">{part}</span> : <span key={i}>{part}</span>
        )}</>
    );
};

// --- 3. NATIVE SYSTEMRADAR WIDGET (Premium Multitasking & Cache Memory) ---
const GlobalSystemRadar = ({ isChatOpen }) => {
    // NYTT: Ladda från webbläsarens minne vid start!
    const [radars, setRadars] = useState(() => {
        try {
            const saved = localStorage.getItem('os_active_radars');
            return saved ? JSON.parse(saved) : [];
        } catch(e) { 
            return []; 
        }
    });
    const [copiedVins, setCopiedVins] = useState({});

    // NYTT: Spara till minnet varje gång en radar ändras, öppnas eller stängs!
    useEffect(() => {
        localStorage.setItem('os_active_radars', JSON.stringify(radars));
    }, [radars]);

    useEffect(() => {
        const handleTrigger = async (e) => {
            const regnr = e.detail?.regnr?.toUpperCase();
            const waitForExt = e.detail?.waitForExtension;
            if (!regnr || !window.db) return;

            setRadars(prev => {
                const existing = prev.find(r => r.regnr === regnr);
                if (existing) {
                    return prev.map(r => r.regnr === regnr ? {
                        ...r,
                        status: 'success',
                        data: { ...(r.data || {}), ...data },
                        isMinimized: false
                    } : r);
                }
                // NYTT: Om sökningen INTE startades av Spotlight (utan t.ex. från garage.js)
                // Returnera 'prev' oförändrad så att rutan inte poppar upp!
                return prev; 
            });

            if (waitForExt) {
                setTimeout(() => {
                    setRadars(prev => prev.map(r => (r.regnr === regnr && r.status === 'loading') ? { ...r, status: 'not_found' } : r));
                }, 15000); 
                return;
            }

            try {
                setTimeout(async () => {
                    const doc = await window.db.collection('vehicleSpecs').doc(regnr).get();
                    if (doc.exists && Object.keys(doc.data()).length > 0) {
                        setRadars(prev => prev.map(r => r.regnr === regnr ? { ...r, status: 'success', data: doc.data() } : r));
                    } else {
                        setRadars(prev => prev.map(r => r.regnr === regnr ? { ...r, status: 'not_found' } : r));
                    }
                }, 800);
            } catch (err) {
                setRadars(prev => prev.map(r => r.regnr === regnr ? { ...r, status: 'not_found' } : r));
            }
        };

        const handleMessage = async (event) => {
            const fordonData = event.data;
            if (!fordonData || !['Car.info_Extension', 'Oljemagasinet_Extension'].includes(fordonData.source)) return;

            const data = {
                oil: fordonData.oljevolym ? `${fordonData.oljevolym.replace(/[^0-9.,]/g, '')} l` : '',
                engine: fordonData.motorkod || '',
                year: fordonData.årsmodell || '',
                mileage: fordonData.miltal || '',
                vin: fordonData.vin || '',
                model: fordonData.bilmodell || ''
            };

            const regnr = fordonData.regnr?.toUpperCase();

            setRadars(prev => {
                const existing = prev.find(r => r.regnr === regnr);
                if (existing) {
                    return prev.map(r => r.regnr === regnr ? {
                        ...r,
                        status: 'success',
                        data: { ...(r.data || {}), ...data },
                        isMinimized: false
                    } : r);
                } else {
                    return [...prev, { regnr, status: 'success', data, isMinimized: false }];
                }
            });

            if (regnr && window.db) {
                const cleanData = Object.fromEntries(Object.entries(data).filter(([_, v]) => v !== ''));
                if (Object.keys(cleanData).length > 0) {
                    cleanData.updatedAt = new Date().toISOString();
                    try {
                        await window.db.collection('vehicleSpecs').doc(regnr).set(cleanData, { merge: true });
                    } catch(e) {}
                }
            }
        };

        window.addEventListener('show-system-radar', handleTrigger);
        window.addEventListener('message', handleMessage);
        return () => {
            window.removeEventListener('show-system-radar', handleTrigger);
            window.removeEventListener('message', handleMessage);
        };
    }, []);

    useEffect(() => {
        if (window.lucide && radars.length > 0) {
            window.lucide.createIcons();
        }
    });

    const handleCopyVin = (regnr, vin) => {
        if (vin) {
            navigator.clipboard.writeText(vin);
            setCopiedVins(prev => ({ ...prev, [regnr]: true }));
            setTimeout(() => {
                setCopiedVins(prev => ({ ...prev, [regnr]: false }));
            }, 2000);
        }
    };

    const setMinimized = (regnr, val) => {
        setRadars(prev => prev.map(r => r.regnr === regnr ? { ...r, isMinimized: val } : r));
    };

    const closeRadar = (regnr) => {
        setRadars(prev => prev.filter(r => r.regnr !== regnr));
    };

    if (radars.length === 0) return null;

    const StatCard = ({ icon, label, val }) => {
        const displayVal = val || '-';
        return (
            <div className="bg-[#1e293b]/90 border border-white/5 rounded-xl p-3.5 flex flex-col gap-1.5 relative overflow-hidden group hover:border-emerald-500/30 transition-colors">
                <div className="absolute right-0 top-0 w-16 h-16 bg-emerald-500/5 blur-xl rounded-full pointer-events-none transition-all group-hover:bg-emerald-500/10"></div>
                <div className="text-[9px] font-bold uppercase tracking-widest text-slate-400 flex items-center gap-1.5">
                    <window.Icon name={icon} size={10} className="text-emerald-400/80" /> {label}
                </div>
                <div className={`text-[14px] font-bold truncate ${val ? 'text-white' : 'text-slate-600'}`} title={displayVal}>
                    {displayVal}
                </div>
            </div>
        );
    };

    return (
        <div className={`fixed bottom-[112px] z-[9999] flex flex-col gap-3 items-end pointer-events-none transition-all duration-500 ease-in-out ${isChatOpen ? 'lg:right-[490px] right-4 sm:right-8' : 'right-4 sm:right-8'}`}>
            {radars.map(radar => {
                
                if (radar.isMinimized) {
                    return (
                        <div key={radar.regnr} className="pointer-events-auto animate-in slide-in-from-right-8 fade-in duration-300">
                            <div 
                                onClick={() => setMinimized(radar.regnr, false)}
                                className="bg-[#0f172a]/95 backdrop-blur-2xl border border-emerald-500/40 shadow-[0_10px_25px_rgba(0,0,0,0.5),_0_0_15px_rgba(16,185,129,0.2)] rounded-full px-4 py-2 flex items-center gap-3 cursor-pointer hover:bg-[#1e293b] hover:border-emerald-400/60 transition-all group"
                            >
                                <span className="relative flex h-2.5 w-2.5 shrink-0">
                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                                    <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
                                </span>
                                
                                <div className="flex flex-col">
                                    <span className="text-[8px] font-black uppercase tracking-widest text-emerald-400 leading-none">Aktiv</span>
                                    <span className="text-[12px] font-mono font-bold text-white leading-none mt-1">{radar.regnr}</span>
                                </div>

                                <div className="w-px h-6 bg-white/10 mx-1"></div>

                                <button 
                                    onClick={(e) => { e.stopPropagation(); closeRadar(radar.regnr); }}
                                    className="w-6 h-6 flex items-center justify-center rounded-full text-slate-400 hover:bg-red-500/20 hover:text-red-400 transition-colors"
                                    title="Stäng radarn helt"
                                >
                                    <window.Icon name="x" size={14} />
                                </button>
                            </div>
                        </div>
                    );
                }

                const isCopied = copiedVins[radar.regnr];

                return (
                    <div key={radar.regnr} className="pointer-events-auto animate-in slide-in-from-right-8 fade-in zoom-in-95 duration-300">
                        <div className="bg-[#0f172a]/95 backdrop-blur-2xl border border-emerald-500/30 shadow-[0_20px_50px_rgba(0,0,0,0.5),_0_0_30px_rgba(16,185,129,0.15)] rounded-2xl w-[calc(100vw-2rem)] sm:w-[420px] relative overflow-hidden flex flex-col font-sans">
                            
                            <div className={`absolute top-0 left-0 w-full h-1 transition-colors ${radar.status === 'loading' ? 'bg-orange-500 animate-pulse' : radar.status === 'success' ? 'bg-emerald-500 shadow-[0_0_15px_#10b981]' : 'bg-red-500'}`}></div>
                            
                            <button 
                                onClick={() => setMinimized(radar.regnr, true)}
                                className="absolute top-4 right-12 w-7 h-7 flex items-center justify-center text-slate-500 hover:text-white hover:bg-white/10 rounded-full transition-colors z-20"
                                title="Minimera till hörnet"
                            >
                                <window.Icon name="minus" size={14} />
                            </button>

                            <button 
                                onClick={() => closeRadar(radar.regnr)}
                                className="absolute top-4 right-4 w-7 h-7 flex items-center justify-center text-slate-500 hover:text-white hover:bg-white/10 rounded-full transition-colors z-20"
                                title="Stäng radarn"
                            >
                                <window.Icon name="x" size={14} />
                            </button>

                            <div className="p-6">
                                <div className="flex items-center gap-3 sm:gap-5 mb-4 sm:mb-5">
                                    <div className="shrink-0 relative flex items-center justify-center">
                                        {radar.status === 'loading' ? (
                                            <>
                                                <window.Icon name="loader" size={36} className="text-orange-500 animate-spin absolute" />
                                                <div className="w-8 h-8 bg-orange-500/20 rounded-full animate-pulse"></div>
                                            </>
                                        ) : radar.status === 'success' ? (
                                            <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 flex items-center justify-center border border-emerald-500/30 shadow-[0_0_15px_rgba(16,185,129,0.2)]">
                                                <window.Icon name="check-circle" size={26} className="text-emerald-400" />
                                            </div>
                                        ) : (
                                            <div className="w-14 h-14 rounded-2xl bg-red-500/10 flex items-center justify-center border border-red-500/30">
                                                <window.Icon name="x-circle" size={26} className="text-red-400" />
                                            </div>
                                        )}
                                    </div>
                                    
                                    <div className="flex flex-col flex-1 min-w-0 pr-12">
                                        <span className={`text-[10px] font-black uppercase tracking-widest mb-1 drop-shadow-sm ${radar.status === 'loading' ? 'text-orange-500' : radar.status === 'success' ? 'text-emerald-400' : 'text-red-400'}`}>
                                            {radar.status === 'loading' ? 'SYSTEMRADAR SÖKER...' : radar.status === 'success' ? 'DATA FÅNGAD' : 'SYSTEMRADAR'}
                                        </span>
                                        <div className="flex items-baseline gap-2">
                                            <h3 className="text-2xl font-black text-white tracking-wider font-mono uppercase leading-none">{radar.regnr}</h3>
                                        </div>
                                        {radar.data?.model && radar.status === 'success' && (
                                            <p className="text-[11px] text-slate-300 font-bold uppercase truncate mt-1.5 tracking-widest">{radar.data.model}</p>
                                        )}
                                        {radar.status === 'loading' && (
                                            <p className="text-[11px] text-slate-400 font-medium mt-1.5">Etablerar anslutning till register...</p>
                                        )}
                                    </div>
                                </div>

                                {radar.status === 'success' && radar.data && (
                                    <div className="flex flex-col gap-3 animate-in fade-in slide-in-from-bottom-2 duration-500">
                                        <div className="grid grid-cols-2 gap-2.5">
                                            <StatCard icon="droplet" label="Oljevolym" val={radar.data.oil} />
                                            <StatCard icon="cpu" label="Motorkod" val={radar.data.engine} />
                                            <StatCard icon="calendar" label="Årsmodell" val={radar.data.year} />
                                            <StatCard icon="gauge" label="Miltal" val={radar.data.mileage} />
                                        </div>

                                        <div 
                                            onClick={() => handleCopyVin(radar.regnr, radar.data.vin)}
                                            title="Kopiera Chassinummer"
                                            className={`mt-1.5 group cursor-pointer border rounded-xl p-4 flex items-center justify-between transition-all duration-300 ${isCopied ? 'bg-emerald-500/20 border-emerald-500/50' : 'bg-[#1e293b]/80 border-white/5 hover:border-emerald-500/30'}`}
                                        >
                                            <div className="flex flex-col min-w-0">
                                                <span className="text-[9px] font-bold uppercase tracking-widest text-slate-400 mb-1 flex items-center gap-1.5">
                                                    <window.Icon name="fingerprint" size={10} className="text-slate-500" /> Chassinummer (VIN)
                                                </span>
                                                <span className={`font-mono text-[14px] font-bold tracking-[0.15em] truncate transition-colors ${isCopied ? 'text-emerald-400' : radar.data.vin ? 'text-white group-hover:text-emerald-400' : 'text-slate-600'}`}>
                                                    {radar.data.vin || '-'}
                                                </span>
                                            </div>
                                            <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 transition-all ${isCopied ? 'bg-emerald-500 text-white shadow-[0_0_15px_rgba(16,185,129,0.4)] scale-110' : radar.data.vin ? 'bg-white/5 text-slate-400 group-hover:bg-emerald-500/20 group-hover:text-emerald-400' : 'bg-transparent text-transparent'}`}>
                                                {radar.data.vin && <window.Icon name={isCopied ? "check" : "copy"} size={16} />}
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {radar.status === 'not_found' && (
                                    <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 flex items-start gap-3 mt-2">
                                        <window.Icon name="alert-circle" size={18} className="text-red-400 shrink-0 mt-0.5" />
                                        <span className="text-[12px] font-medium text-red-200 leading-relaxed">Ingen teknisk fordonsdata hittades för {radar.regnr}. Prova att skanna via Car.info istället.</span>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                );
            })}
        </div>
    );
};

// --- 4. BMG INTELLIGENCE SPOTLIGHT SEARCH ---
const SpotlightSearch = ({ isOpen, onClose, allJobs, allNotes, allLagerItems, navigateTo }) => {
    const [query, setQuery] = useState('');
    const [debouncedQuery, setDebouncedQuery] = useState('');
    const [activeIndex, setActiveIndex] = useState(0);
    const [recentSearches, setRecentSearches] = useState([]);
    const [copiedId, setCopiedId] = useState(null);
    const inputRef = useRef(null);

    // Ladda senaste sökningar
    useEffect(() => {
        const saved = localStorage.getItem('bmg_recent_searches');
        if (saved) setRecentSearches(JSON.parse(saved));
    }, []);

    // Debounce
    useEffect(() => {
        const timer = setTimeout(() => setDebouncedQuery(query), 200);
        return () => clearTimeout(timer);
    }, [query]);

    useEffect(() => {
        if (isOpen) {
            setQuery('');
            setDebouncedQuery('');
            setActiveIndex(0);
            setTimeout(() => inputRef.current?.focus(), 100);
        }
    }, [isOpen]);

    const saveSearch = (q) => {
        if (!q.trim()) return;
        const updated = [q, ...recentSearches.filter(item => item !== q)].slice(0, 5);
        setRecentSearches(updated);
        localStorage.setItem('bmg_recent_searches', JSON.stringify(updated));
    };

    const handleCopy = (e, text) => {
        e.stopPropagation();
        navigator.clipboard.writeText(text);
        setCopiedId(text);
        setTimeout(() => setCopiedId(null), 2000);
    };

    const results = useMemo(() => {
        const q = debouncedQuery.toLowerCase();
        const cleanedQuery = debouncedQuery.replace(/\s+/g, '').toUpperCase();
        
        // --- 1. DETEKTERA REG.NR ---
        const isRegNr = /^[A-Z]{3}\d{2}[A-Z0-9]$/.test(cleanedQuery);
        
        let externalLinks = [];
        if (isRegNr) {
            externalLinks = [
                // 1. Oljemagasinet (Intern Systemradar i Appen)
                { id: 'oljemagasinet', icon: 'droplet', title: `Hämta Oljevolym`, subtitle: `Kör Systemradar i bakgrunden`, type: 'radar', category: `Fordonsuppgifter: ${cleanedQuery}`, copyText: cleanedQuery },
                
                // 2. Car.info (Öppnas som Popup för tillägget - NU MED #bmg_export)
                { id: 'carinfo', icon: 'external-link', title: `Sök på Car.info`, subtitle: `Hämta ny fordonsdata via tillägg`, type: 'popup_link', url: `https://www.car.info/sv-se/license-plate/S/${cleanedQuery}#bmg_export`, category: `Fordonsuppgifter: ${cleanedQuery}`, copyText: cleanedQuery },
                
                // 3. Biluppgifter (Öppnas i ny vanlig flik)
                { id: 'biluppgifter', icon: 'external-link', title: `Sök på Biluppgifter`, subtitle: `biluppgifter.se/fordon/${cleanedQuery}`, type: 'link', url: `https://biluppgifter.se/fordon/${cleanedQuery}`, category: `Fordonsuppgifter: ${cleanedQuery}`, copyText: cleanedQuery }
            ];
        }

        // --- 2. OM SÖKFÄLTET ÄR TOMT ---
        if (!debouncedQuery.trim()) {
            return [
                { id: 'NEW_JOB', icon: 'plus-square', title: 'Skapa nytt uppdrag', subtitle: 'Genväg', type: 'page', category: 'Snabba åtgärder' },
                { id: 'REFERENCE', icon: 'cloud-upload', title: 'Dokumenthantering', subtitle: 'Genväg', type: 'page', category: 'Snabba åtgärder' },
                { id: 'CALENDAR', icon: 'calendar', title: 'Öppna Kalendern', subtitle: 'Genväg', type: 'page', category: 'Snabba åtgärder' },
                { id: 'CUSTOMERS', icon: 'users', title: 'Sök i kunddatabasen', subtitle: 'Meny', type: 'page', category: 'Snabba åtgärder' }
            ];
        }

        // --- 3. SIDOR (Navigation) ---
        const pages = [
            { id: 'DASHBOARD', icon: 'grid', title: 'Dashboard', subtitle: 'Startsida', category: 'Systemnavigering' },
            { id: 'GARAGE', icon: 'car', title: 'Garage', subtitle: 'Fordonshantering', category: 'Systemnavigering' },
            { id: 'CHAT', icon: 'message-square', title: 'System Chat', subtitle: 'Kommunikation', category: 'Systemnavigering' },
        ].filter(p => p.title.toLowerCase().includes(q) || p.id.toLowerCase().includes(q))
         .map(p => ({ ...p, type: 'page' }));

        // --- 4. DATABAS: JOBB ---
        const jobs = allJobs.filter(j => 
            (j.regnr && j.regnr.toLowerCase().includes(q)) || 
            (j.kundnamn && j.kundnamn.toLowerCase().includes(q)) ||
            (j.status && j.status.toLowerCase().includes(q)) ||
            (j.kommentar && j.kommentar.toLowerCase().includes(q)) ||
            (j.paket && j.paket.toLowerCase().includes(q))
        ).slice(0, 8).map(j => ({
            id: j.id, job: j, icon: 'briefcase', 
            title: j.regnr || j.kundnamn || 'Inget Regnr', 
            subtitle: `${j.kundnamn} • ${j.status}`, 
            type: 'job', category: 'Sökresultat: Uppdrag & Kunder',
            copyText: j.regnr || j.kundnamn
        }));

        // --- 5. DATABAS: DOKUMENT/FILER ---
        const docs = (allNotes || []).filter(n => 
            (n.type === 'file' || n.type === 'image' || n.fileUrl) && 
            (n.text && n.text.toLowerCase().includes(q))
        ).slice(0, 4).map(n => ({
            id: n.id, icon: 'file-text', title: n.text || 'Namnlös fil', subtitle: 'Dokument', type: 'link', url: n.fileUrl, category: 'Sökresultat: Dokument', copyText: n.text
        }));

        // --- 6. DATABAS: LAGER ---
        const inv = (allLagerItems || []).filter(i => 
            (i.name && String(i.name).toLowerCase().includes(q)) || 
            (i.service_filter && String(i.service_filter).toLowerCase().includes(q)) ||
            (i.id && String(i.id).toLowerCase().includes(q))
        ).slice(0, 4).map(i => ({
            id: `LAGER_ITEM_${i.id}`, 
            targetPage: 'LAGER',
            icon: 'package', 
            title: String(i.name || 'Okänd Artikel'), 
            subtitle: `${i.quantity || 0} i lager • ${i.price || 0} kr`, 
            type: 'page', 
            category: 'Sökresultat: Lager & Inventarie', 
            copyText: String(i.service_filter || i.name || '')
        }));

        return [...externalLinks, ...pages, ...jobs, ...docs, ...inv];
    }, [debouncedQuery, allJobs, allNotes, allLagerItems]);

    useEffect(() => {
        setActiveIndex(0);
        if (window.lucide) window.lucide.createIcons();
    }, [results]);

    const handleKeyDown = (e) => {
        if (e.key === 'ArrowDown') {
            e.preventDefault();
            setActiveIndex(prev => (prev < results.length - 1 ? prev + 1 : prev));
        } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            setActiveIndex(prev => (prev > 0 ? prev - 1 : 0));
        } else if (e.key === 'Enter' && results[activeIndex]) {
            e.preventDefault();
            executeAction(results[activeIndex]);
        } else if (e.key === 'Escape') {
            onClose();
        }
    };

    const executeAction = (item) => {
        if (debouncedQuery) saveSearch(debouncedQuery);
        onClose();

        // 1. Intern Systemradar (Oljemagasinet) - Stannar i appen
        if (item.type === 'radar') {
            window.dispatchEvent(new CustomEvent('show-system-radar', { 
                detail: { regnr: item.copyText } 
            }));
        } 
        // 2. NYTT: Car.info - Tvingar fram ett litet popup-fönster OCH sätter radarn i vänteläge
        else if (item.type === 'popup_link' && item.url) {
            
            // Starta radarn i appen, men säg åt den att vänta på Chrome-tillägget!
            window.dispatchEvent(new CustomEvent('show-system-radar', { 
                detail: { regnr: item.copyText, waitForExtension: true } 
            }));

            const w = 450;
            const h = 600;
            const left = (window.screen.width / 2) - (w / 2);
            const top = (window.screen.height / 2) - (h / 2);
            window.open(item.url, 'VehicleRadarPopup', `width=${w},height=${h},top=${top},left=${left}`);
        } 
        // 3. Vanliga länkar (Biluppgifter öppnas i ny standardflik)
        else if (item.type === 'link' && item.url) {
            window.open(item.url, '_blank');
        } 
        else if (item.type === 'page') {
            const target = item.targetPage || item.id;
            navigateTo(target, target === 'NEW_JOB' ? { job: null } : null);
        } 
        else if (item.type === 'job') {
            navigateTo('NEW_JOB', { job: item.job });
        }
    };

    const handleClearOrClose = () => {
        if (query) { setQuery(''); inputRef.current?.focus(); }
        else onClose();
    };

    if (!isOpen) return null;

    let lastCategory = null;

    return (
        <div className="fixed inset-0 z-[9999] flex justify-center items-start lg:pt-[10vh] bg-zinc-900/40 backdrop-blur-sm transition-opacity">
            <div className="absolute inset-0" onClick={onClose}></div>
            
            <div className="relative w-full h-[85vh] lg:h-auto lg:max-h-[80vh] lg:w-[800px] bg-white dark:bg-[#121826] rounded-b-2xl lg:rounded-2xl shadow-[0_30px_90px_rgba(0,0,0,0.4)] flex flex-col animate-in slide-in-from-top-4 lg:zoom-in-95 duration-200 overflow-hidden border border-zinc-200 dark:border-white/10">
                
                <div className="flex items-center px-5 py-4 border-b border-zinc-100 dark:border-[#1a2235] shrink-0 bg-transparent">
                    <window.Icon name="search" size={22} className="text-orange-500 shrink-0" />
                    <input
                        ref={inputRef}
                        type="text"
                        value={query}
                        onChange={e => setQuery(e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder="Sök i Spotlight.."
                        style={{ outline: 'none', boxShadow: 'none' }}
                        className="w-full bg-transparent border-0 ring-0 outline-none focus:ring-0 focus:outline-none focus:border-transparent text-xl font-medium text-zinc-900 dark:text-white px-4 placeholder:text-zinc-400 dark:placeholder:text-zinc-600 appearance-none"
                        autoComplete="off"
                        spellCheck="false"
                    />
                    <button onClick={handleClearOrClose} className="shrink-0 p-2 bg-zinc-100 dark:bg-white/5 rounded-lg text-zinc-400 hover:text-zinc-700 dark:hover:text-white transition-colors">
                        <window.Icon name="x" size={16} />
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto custom-scrollbar px-2 py-2 bg-white dark:bg-[#121826]">
                    
                    {!debouncedQuery && recentSearches.length > 0 && (
                        <div className="px-4 py-3 mb-2 border-b border-zinc-100 dark:border-white/5">
                            <span className="text-[10px] font-black uppercase tracking-widest text-zinc-400 block mb-2">Senaste Sökningar</span>
                            <div className="flex flex-wrap gap-2">
                                {recentSearches.map((sq, i) => (
                                    <button key={i} onClick={() => setQuery(sq)} className="px-3 py-1.5 bg-zinc-100 dark:bg-white/5 hover:bg-orange-50 dark:hover:bg-orange-500/10 hover:text-orange-600 dark:hover:text-orange-400 text-[11px] font-bold text-zinc-600 dark:text-zinc-400 rounded-full transition-colors flex items-center gap-1.5 border border-zinc-200 dark:border-white/5">
                                        <window.Icon name="clock" size={10} /> {sq}
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    {results.length > 0 ? results.map((item, index) => {
                        const showCategory = item.category !== lastCategory;
                        lastCategory = item.category;

                        return (
                            <React.Fragment key={`${item.type}-${item.id}`}>
                                {showCategory && (
                                    <div className="px-4 pt-4 pb-2 text-[10px] font-black uppercase tracking-widest text-zinc-400 dark:text-zinc-500">
                                        {item.category}
                                    </div>
                                )}
                                <div 
                                    onMouseEnter={() => setActiveIndex(index)}
                                    className={`flex items-center gap-4 px-4 py-3 mx-2 my-0.5 rounded-xl cursor-pointer transition-all duration-100 group ${activeIndex === index ? 'bg-orange-50 dark:bg-orange-500/10' : 'bg-transparent hover:bg-zinc-50 dark:hover:bg-[#1a2235]'}`}
                                    onClick={() => executeAction(item)}
                                >
                                    <div className={`w-10 h-10 flex items-center justify-center rounded-lg shrink-0 transition-colors ${activeIndex === index ? 'bg-orange-500 text-white shadow-md shadow-orange-500/20' : 'bg-zinc-100 dark:bg-[#1a2235] text-zinc-500 dark:text-zinc-400'}`}>
                                        <window.Icon name={item.icon} size={18} />
                                    </div>
                                    
                                    <div className="flex flex-col flex-1 min-w-0">
                                        <span className={`text-[14px] font-bold leading-tight mb-0.5 truncate ${activeIndex === index ? 'text-orange-700 dark:text-orange-400' : 'text-zinc-900 dark:text-zinc-200'}`}>
                                            <HighlightText text={item.title} highlight={debouncedQuery} />
                                        </span>
                                        <span className="text-[12px] text-zinc-500 truncate leading-none">
                                            <HighlightText text={item.subtitle} highlight={debouncedQuery} />
                                        </span>
                                    </div>
                                    
                                    <div className="flex items-center gap-2 shrink-0">
                                        {item.copyText && (
                                            <button 
                                                onClick={(e) => handleCopy(e, item.copyText)} 
                                                className="w-8 h-8 flex items-center justify-center rounded-md bg-white dark:bg-[#182032] border border-zinc-200 dark:border-white/5 text-zinc-400 hover:text-orange-500 hover:border-orange-200 dark:hover:border-orange-500/30 transition-all opacity-0 group-hover:opacity-100"
                                                title="Kopiera text"
                                            >
                                                {copiedId === item.copyText ? <window.Icon name="check" size={14} className="text-emerald-500" /> : <window.Icon name="copy" size={14} />}
                                            </button>
                                        )}
                                        
                                        {activeIndex === index && (
                                            <div className="flex items-center gap-1.5 px-2 py-1 bg-white dark:bg-[#182032] border border-orange-200 dark:border-orange-500/20 rounded-md shadow-sm">
                                                <span className="text-[9px] font-bold text-orange-500 uppercase tracking-widest">Enter</span>
                                                <window.Icon name="corner-down-left" size={12} className="text-orange-500" />
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </React.Fragment>
                        );
                    }) : (
                        <div className="px-6 py-16 text-center flex flex-col items-center justify-center">
                            <div className="w-16 h-16 bg-zinc-100 dark:bg-white/5 rounded-full flex items-center justify-center mb-4">
                                <window.Icon name="search-x" size={32} className="text-zinc-300 dark:text-zinc-600" />
                            </div>
                            <p className="text-[14px] font-bold text-zinc-900 dark:text-white mb-1">Inga resultat för "{query}"</p>
                            <p className="text-[12px] text-zinc-500">Kontrollera stavningen eller testa ett annat sökord.</p>
                        </div>
                    )}
                </div>

                <div className="flex items-center justify-between px-5 py-3 bg-zinc-50 dark:bg-[#0f1522] border-t border-zinc-200 dark:border-white/5 shrink-0">
                    <span className="text-[10px] text-zinc-400 font-medium flex items-center gap-2">
                        <span className="px-1.5 py-0.5 bg-zinc-200 dark:bg-white/10 rounded text-zinc-600 dark:text-zinc-300">↑</span>
                        <span className="px-1.5 py-0.5 bg-zinc-200 dark:bg-white/10 rounded text-zinc-600 dark:text-zinc-300">↓</span>
                        Navigera
                    </span>
                    <span className="text-[10px] font-black tracking-widest text-zinc-400 uppercase flex items-center gap-2">
                        <window.Icon name="command" size={12} /> Spotlight Global Search
                    </span>
                </div>
            </div>
        </div>
    );
};


// --- 5. HUVUDAPPLIKATION (App) ---
const App = () => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [appReady, setAppReady] = useState(false);
    const [view, setView] = useState('DASHBOARD');
    const [viewParams, setViewParams] = useState(null);
    const [sidebarOpen, setSidebarOpen] = useState(window.innerWidth > 1024);
    const [activeFilter, setActiveFilter] = useState('BOKAD');
    const [globalSearch, setGlobalSearch] = useState('');
    const [allJobs, setAllJobs] = useState([]);
    const [editingJob, setEditingJob] = useState(null);
    const [allLagerItems, setAllLagerItems] = useState([]);
    const [allNotes, setAllNotes] = useState([]);
    const [isDark, setIsDark] = useState(() => localStorage.getItem('sys_theme') === 'dark');
    const [time, setTime] = useState(new Date());
    const [hasUnread, setHasUnread] = useState(false);
    const [isChatOpen, setIsChatOpen] = useState(false);
    const [isOnline, setIsOnline] = useState(navigator.onLine);
    const [isSpotlightOpen, setIsSpotlightOpen] = useState(false);

    const triggerHaptic = () => {
        if (window.navigator && window.navigator.vibrate) window.navigator.vibrate(12);
    };

    // --- SPOTLIGHT EVENT LISTENERS ---
    useEffect(() => {
        const handleOpenSpotlight = () => setIsSpotlightOpen(true);
        const handleCmdK = (e) => {
            if ((e.metaKey || e.ctrlKey) && e.key === 'f') {
                e.preventDefault();
                setIsSpotlightOpen(true);
            }
        };

        window.addEventListener('open-spotlight', handleOpenSpotlight);
        window.addEventListener('keydown', handleCmdK);

        return () => {
            window.removeEventListener('open-spotlight', handleOpenSpotlight);
            window.removeEventListener('keydown', handleCmdK);
        };
    }, []);

    // --- DARK MODE INJECTION ---
    useEffect(() => {
        const root = document.documentElement;
        root.style.setProperty('--brand-primary', '#f97316');
        root.style.setProperty('--sidebar-text', '#ffffff');

        if (isDark) {
            root.classList.add('dark');
            localStorage.setItem('sys_theme', 'dark');
            document.body.style.background = '#09090b';
        } else {
            root.classList.remove('dark');
            localStorage.setItem('sys_theme', 'light');
            document.body.style.background = 'linear-gradient(to bottom right, #ffffff, #f4f4f5, #e4e4e7)'; 
        }

        let meta = document.querySelector('meta[name="theme-color"]');
        if (!meta) {
            meta = document.createElement('meta');
            meta.name = 'theme-color';
            document.head.appendChild(meta);
        }
        meta.content = isDark ? '#0a0f18' : '#ffffff';

        let styleTag = document.getElementById('dynamic-theme-style');
        if (!styleTag) {
            styleTag = document.createElement('style');
            styleTag.id = 'dynamic-theme-style';
            document.head.appendChild(styleTag);
        }

        styleTag.innerHTML = `
            @keyframes loading { 0% { width: 0%; } 50% { width: 100%; } 100% { width: 0%; } }
            @keyframes subtleGradient { 0% { background-position: 0% 50%; } 50% { background-position: 100% 50%; } 100% { background-position: 0% 50%; } }
            .dark-premium-bg { background: linear-gradient(-45deg, #020617, #0f172a, #1e293b, #020617); background-size: 400% 400%; animation: subtleGradient 20s ease infinite; }
            input::-webkit-outer-spin-button, input::-webkit-inner-spin-button { -webkit-appearance: none; margin: 0; }
            input[type=number] { -moz-appearance: textfield; }
            input:focus, select:focus, textarea:focus { outline: none !important; box-shadow: none !important; }
            .theme-bg { background-color: var(--brand-primary) !important; }
            .theme-text { color: var(--brand-primary) !important; }
            .theme-border { border-color: var(--brand-primary) !important; }
            .theme-sidebar-active { background-color: rgba(249, 115, 22, 0.12) !important; color: var(--brand-primary) !important; border-right: 3px solid var(--brand-primary) !important; }
            .mobile-nav-btn { display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 3px; flex: 1; height: 100%; transition: all 0.2s; color: #52525b; border: none; background: transparent; }
            .mobile-nav-btn.active { color: var(--brand-primary); }
            .mobile-nav-label { font-size: 7px; font-weight: 900; text-transform: uppercase; letter-spacing: 0.1em; }
        `;
    }, [isDark]);

    useEffect(() => {
        if (!user) return;
        const clockRegex = /[🕒🕓🕔🕕🕖🕗🕘🕙🕚🕛⏰⌚⌛⏳]/u;
        const unsubscribe = db.collection("notes").orderBy("timestamp", "desc").limit(150).onSnapshot(snap => {
            if (snap.empty) { setHasUnread(false); return; }
            const allMsgs = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            setAllNotes(allMsgs);
            const clockFound = allMsgs.some(msg => Object.values(msg).some(val => typeof val === 'string' && clockRegex.test(val)));
            if (view === 'CHAT') setHasUnread(false); else setHasUnread(clockFound);
        });
        return () => unsubscribe();
    }, [user, view]);

    const navigateTo = (newView, params = null) => {
        triggerHaptic();
        const hashPath = `#${newView.toLowerCase()}`;
        if (view === newView) {
             window.history.replaceState({ view: newView, params: params }, "", hashPath);
        } else {
             window.history.pushState({ view: newView, params: params }, "", hashPath);
        }
        setView(newView);
        setViewParams(params);
        if (params && Object.prototype.hasOwnProperty.call(params, 'job')) setEditingJob(params.job);
        if (window.innerWidth < 1024) setSidebarOpen(false);
    };

    useEffect(() => {
        const handleStatus = () => setIsOnline(navigator.onLine);
        window.addEventListener('online', handleStatus);
        window.addEventListener('offline', handleStatus);
        return () => { window.removeEventListener('online', handleStatus); window.removeEventListener('offline', handleStatus); };
    }, []);

    useEffect(() => {
        if (!window.history.state) window.history.replaceState({ view: 'DASHBOARD', params: null }, "");
        const handlePopState = (event) => {
            if (event.state) {
                setView(event.state.view);
                setViewParams(event.state.params);
                if (event.state.params && Object.prototype.hasOwnProperty.call(event.state.params, 'job')) setEditingJob(event.state.params.job);
                else setEditingJob(null);
            }
        };
        window.addEventListener('popstate', handlePopState);
        return () => window.removeEventListener('popstate', handlePopState);
    }, []);

    useEffect(() => {
        const syncWithUrl = () => {
            const hash = window.location.hash.replace('#', '').toUpperCase();
            const validViews = ['DASHBOARD', 'CALENDAR', 'NEW_JOB', 'CUSTOMERS', 'OIL_SUPPLY', 'CHAT', 'LAGER'];
            if (hash && validViews.includes(hash)) {
                setView(hash);
                if (window.innerWidth < 1024) setSidebarOpen(false);
            }
        };
        syncWithUrl();
        window.addEventListener('hashchange', syncWithUrl);
        return () => window.removeEventListener('hashchange', syncWithUrl);
    }, []);

    useEffect(() => { window.openEditModal = (jobId) => { const job = allJobs.find(j => j.id === jobId); if (job) navigateTo('NEW_JOB', { job: job }); }; }, [allJobs]);
    useEffect(() => { const timer = setInterval(() => setTime(new Date()), 1000); setAppReady(true); return () => clearInterval(timer); }, []);
    
    useEffect(() => { if (window.lucide) window.lucide.createIcons(); }, [view, allJobs, sidebarOpen, activeFilter, isDark, isSpotlightOpen, allNotes]);

    useEffect(() => {
        const unsubscribe = auth.onAuthStateChanged(u => { setUser(u); setLoading(false); });
        return () => unsubscribe();
    }, []);

    useEffect(() => {
        if (!user) return;
        return db.collection("jobs").orderBy("datum", "desc").onSnapshot(snap => {
            setAllJobs(snap.docs.map(doc => ({ ...doc.data(), id: doc.id })).filter(j => !j.deleted));
        });
    }, [user]);

    useEffect(() => {
        if (!user) return;
        return db.collection("lager").onSnapshot(snap => {
            setAllLagerItems(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
        });
    }, [user]);

    const statusCounts = useMemo(() => {
        const counts = { 'ALLA': allJobs.length, 'BOKAD': 0, 'OFFERERAD': 0, 'EJ BOKAD': 0, 'KLAR': 0, 'FAKTURERAS': 0 };
        allJobs.forEach(job => {
            const s = (job.status || '').toUpperCase();
            if (!job.datum) counts['EJ BOKAD']++;
            if (counts.hasOwnProperty(s)) counts[s]++;
        });
        return counts;
    }, [allJobs]);

    const filteredJobs = useMemo(() => {
        let result = allJobs.filter(job => {
            const q = globalSearch.toLowerCase();
            const matchesGlobal = (job.regnr || '').toLowerCase().includes(q) || (job.kundnamn || '').toLowerCase().includes(q);
            if (activeFilter === 'EJ BOKAD') return matchesGlobal && !job.datum;
            const matchesStatus = activeFilter === 'ALLA' || (job.status || '').toUpperCase() === activeFilter;
            return matchesGlobal && matchesStatus;
        });
        result.sort((a, b) => {
            if (!a.datum) return 1; if (!b.datum) return -1;
            return activeFilter === 'BOKAD' ? a.datum.localeCompare(b.datum) : b.datum.localeCompare(a.datum);
        });
        return result;
    }, [globalSearch, activeFilter, allJobs]);

    if (loading) return <SplashScreen />;
    if (!user) return <LoginScreen />;

    return (
        <>
            {!appReady && <SplashScreen />}
            
            {/* Global Spotlight Render */}
            <SpotlightSearch isOpen={isSpotlightOpen} onClose={() => setIsSpotlightOpen(false)} allJobs={allJobs} allNotes={allNotes} allLagerItems={allLagerItems} navigateTo={navigateTo} />

            {/* NYTT: Den Svävande Systemradarn */}
            <GlobalSystemRadar isChatOpen={isChatOpen} />

            {/* Huvudlayout med Dark Mode bakgrund */}
            <div className="flex h-screen overflow-hidden bg-zinc-50 dark:bg-[#0f1522] relative transition-colors duration-300">
                
                {/* Sidomeny (Sömlös i Dark Mode) */}
                <aside className={`fixed lg:relative h-full z-[200] transition-all duration-300 ease-in-out ${sidebarOpen ? 'translate-x-0 w-[280px]' : '-translate-x-full lg:translate-x-0 lg:w-20'} bg-zinc-950 dark:bg-[#0b0f19] text-white border-r border-zinc-800 dark:border-white/5 flex flex-col shadow-2xl lg:shadow-none`}>
                    <div className="h-20 flex items-center justify-between px-6 border-b border-zinc-800 dark:border-[#1a2235] overflow-hidden shrink-0">
                        <div className="flex items-center gap-3">
                            <div onClick={() => { triggerHaptic(); setSidebarOpen(!sidebarOpen); }} className="min-w-[32px] w-8 h-8 theme-bg flex items-center justify-center font-black rounded-sm text-black shadow-lg cursor-pointer hover:scale-105 transition-transform">P</div>
                            {sidebarOpen && <span className="font-black tracking-widest text-[10px] uppercase whitespace-nowrap">Planerare // OS</span>}
                        </div>
                        {sidebarOpen && (
                            <button onClick={() => { triggerHaptic(); setSidebarOpen(false); }} className="hidden lg:block text-zinc-500 hover:text-white transition-colors">
                                <window.Icon name="chevron-left" size={18} />
                            </button>
                        )}
                    </div>
                    
                    <nav className="flex-1 py-6 space-y-1 overflow-y-auto custom-scrollbar">
                        {[
                            { id: 'DASHBOARD', icon: 'grid', label: 'Dashboard' },
                            { id: 'CALENDAR', icon: 'calendar', label: 'Kalender' },
                            { id: 'NEW_JOB', icon: 'plus-square', label: 'Nytt_Jobb' },
                            { id: 'LAGER', icon: 'package', label: 'Lager' },
                            { id: 'CUSTOMERS', icon: 'users', label: 'Kund_Databas' },
                            { id: 'OIL_SUPPLY', icon: 'droplet', label: 'Oil_Status' },
                            { id: 'REFERENCE', icon: 'file-text', label: 'Dokument' },
                            { id: 'CHAT', icon: 'message-square', label: 'System_Chat' }
                        ].map(item => (
                            <div key={item.id} 
                                onClick={() => navigateTo(item.id, item.id === 'NEW_JOB' ? { job: null } : null)} 
                                className={`flex items-center px-6 py-4 cursor-pointer transition-all ${item.id === 'CHAT' ? 'lg:hidden' : ''} ${view === item.id ? 'theme-sidebar-active' : 'hover:opacity-80 text-zinc-400 hover:text-white'}`}>                                
                                <div className="relative flex items-center justify-center">
                                    <window.Icon name={item.icon} size={18} />
                                    {item.id === 'CHAT' && hasUnread && (
                                        <span className="absolute -top-1 -right-1 flex h-2.5 w-2.5 z-[999]">
                                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-orange-400 opacity-75"></span>
                                            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-orange-500 border border-[#0d0d0e]"></span>
                                        </span>
                                    )}
                                </div>
                                {sidebarOpen && <span className="ml-4 text-[12px] font-medium">{item.label.replace('_', ' ')}</span>}
                            </div>
                        ))}
                    </nav>

                    <div className="mt-auto border-t border-zinc-800 dark:border-[#1a2235] bg-black/20 pb-20 lg:pb-0">
                        <button onClick={() => setIsDark(!isDark)} className={`w-full flex items-center ${sidebarOpen ? 'justify-start px-6' : 'justify-center'} py-5 text-zinc-400 hover:text-white transition-colors border-b border-zinc-800 dark:border-[#1a2235] gap-4`}>
                            <window.Icon name={isDark ? "sun" : "moon"} size={18} className={isDark ? "text-orange-500" : ""} />
                            {sidebarOpen && <span className="text-[10px] font-black uppercase tracking-widest">{isDark ? 'Light Mode' : 'Dark Mode'}</span>}
                        </button>

                        <div className={`flex items-center ${sidebarOpen ? 'justify-between px-6' : 'justify-center'} py-5 gap-3`}>
                            <div className="flex items-center gap-3 min-w-0">
                                <div className="min-w-[32px] w-8 h-8 theme-bg flex items-center justify-center font-black rounded-sm text-black shadow-lg uppercase text-[10px]">
                                    {user.email ? user.email[0] : 'U'}
                                </div>
                                {sidebarOpen && (
                                    <div className="flex flex-col min-w-0">
                                        <span className="text-[10px] font-black uppercase tracking-widest text-white truncate">{user.displayName || 'Operator'}</span>
                                        <span className="text-[7px] text-zinc-500 truncate font-mono uppercase tracking-tighter">{user.email}</span>
                                    </div>
                                )}
                            </div>
                            {sidebarOpen && (
                                <button onClick={() => { triggerHaptic(); auth.signOut(); }} className="p-2 text-red-500 hover:bg-red-500/10 rounded-sm transition-all group shrink-0">
                                    <window.Icon name="log-out" size={16} className="group-hover:translate-x-0.5 transition-transform" />
                                </button>
                            )}
                        </div>
                    </div>
                </aside>

                {sidebarOpen && window.innerWidth < 1024 && (
                    <div onClick={() => { triggerHaptic(); setSidebarOpen(false); }} className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[190] lg:hidden animate-in fade-in duration-300"></div>
                )}

                <main className="flex-1 flex flex-col min-w-0 overflow-hidden relative">
                    
                    {/* Chattbubbla */}
                    <button 
                        onClick={() => setIsChatOpen(!isChatOpen)} 
                        className={`hidden lg:flex fixed bottom-8 right-8 w-16 h-16 rounded-full shadow-[0_10px_30px_rgba(249,115,22,0.4)] items-center justify-center transition-all z-[600] border border-black/20 ${isChatOpen ? 'bg-zinc-800 text-white hover:scale-105' : 'theme-bg text-black hover:scale-110 active:scale-95'}`}
                    >
                        <window.Icon name={isChatOpen ? "x" : "message-square"} size={24} />
                        {hasUnread && !isChatOpen && (
                            <span className="absolute top-0 right-0 flex h-4 w-4">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-4 w-4 bg-red-500 border-2 border-orange-500 shadow-sm"></span>
                            </span>
                        )}
                    </button>

                    {isChatOpen && window.innerWidth >= 1024 && (
                        <>
                            <div className="fixed inset-0 z-[490]" onClick={() => setIsChatOpen(false)}></div>
                            <div className="hidden lg:block fixed bottom-[104px] right-8 z-[500] w-[450px] h-[700px] max-h-[85vh] shadow-[0_20px_60px_rgba(0,0,0,0.3)] rounded-2xl overflow-hidden border border-zinc-200/80 dark:border-[#2a3441] bg-white dark:bg-[#121826] ring-1 ring-black/5 animate-in slide-in-from-bottom-4 fade-in duration-300">
                                <window.ChatView user={user} setView={navigateTo} viewParams={viewParams} isPopup={true} onClose={() => setIsChatOpen(false)} />
                            </div>
                        </>
                    )}

                    {/* DYNAMISK VY-CONTAINER */}
                    <div className={`flex-1 overflow-auto lg:p-8 space-y-6 pb-24 lg:pb-8 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none] ${['DASHBOARD', 'CALENDAR', 'NEW_JOB', 'CUSTOMERS', 'OIL_SUPPLY'].includes(view) ? 'p-0' : 'p-4'}`}>
                        {view === 'DASHBOARD' && (
                            <window.DashboardView 
                                allJobs={allJobs} filteredJobs={filteredJobs} setEditingJob={setEditingJob} setView={navigateTo} 
                                activeFilter={activeFilter} setActiveFilter={setActiveFilter} statusCounts={statusCounts}
                                globalSearch={globalSearch} setGlobalSearch={setGlobalSearch}
                            />
                        )}
                        {view === 'NEW_JOB' && <window.NewJobView editingJob={editingJob} setView={navigateTo} allJobs={allJobs} />}
                        {view === 'GARAGE' && <window.GarageView allJobs={allJobs} setView={navigateTo} />}
                        {view === 'LAGER' && <window.LagerView allJobs={allJobs} />} 
                        {view === 'CUSTOMERS' && <window.CustomersView allJobs={allJobs} setView={navigateTo} viewParams={viewParams} setEditingJob={setEditingJob} />}
                        {view === 'CALENDAR' && <window.CalendarView allJobs={allJobs} setEditingJob={setEditingJob} setView={navigateTo} />}
                        {view === 'OIL_SUPPLY' && <window.SupplyView allJobs={allJobs} setView={navigateTo} />}
                        {view === 'CHAT' && window.innerWidth < 1024 && <window.ChatView user={user} setView={navigateTo} viewParams={viewParams} />}
                        {view === 'REFERENCE' && <window.ReferenceView setView={navigateTo} />}
                    </div>

                    {/* Mobila Bottenmenyn */}
                    <div className="lg:hidden fixed bottom-0 left-0 right-0 h-16 bg-zinc-950 dark:bg-[#121826] border-t border-zinc-900 dark:border-[#1a2235] flex items-center justify-around z-[210] px-1 pb-safe backdrop-blur-xl">
                        <button onClick={() => navigateTo('DASHBOARD')} className={`mobile-nav-btn ${view === 'DASHBOARD' && !sidebarOpen ? 'active' : 'dark:text-zinc-500'}`}>
                            <div className="relative inline-flex items-center justify-center p-1"><window.Icon name="grid" size={20} /></div>
                            <span className="mobile-nav-label">Status</span>
                        </button>
                        <button onClick={() => navigateTo('CALENDAR')} className={`mobile-nav-btn ${view === 'CALENDAR' && !sidebarOpen ? 'active' : 'dark:text-zinc-500'}`}>
                            <div className="relative inline-flex items-center justify-center p-1"><window.Icon name="calendar" size={20} /></div>
                            <span className="mobile-nav-label">Plan</span>
                        </button>
                        <button onClick={() => navigateTo('NEW_JOB', { job: null })} className={`mobile-nav-btn ${view === 'NEW_JOB' && !sidebarOpen ? 'active' : 'dark:text-zinc-500'}`}>
                            <div className="relative inline-flex items-center justify-center p-1"><window.Icon name="plus-square" size={20} /></div>
                            <span className="mobile-nav-label">Nytt</span>
                        </button>
                        <button onClick={() => navigateTo('CHAT')} className={`mobile-nav-btn ${view === 'CHAT' ? 'active' : 'dark:text-zinc-500'}`}>
                            <div className="relative inline-flex items-center justify-center p-1">
                                <window.Icon name="message-square" size={20} />
                                {hasUnread && (
                                    <span className="absolute -top-1 -right-1 flex h-3 w-3 z-[999]">
                                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-orange-400 opacity-75"></span>
                                        <span className="relative inline-flex rounded-full h-3 w-3 bg-orange-500 border-2 border-black dark:border-[#121826] shadow-[0_0_10px_rgba(249,115,22,1)]"></span>
                                    </span>
                                )}
                            </div>
                            <span className="mobile-nav-label">Chatt</span>
                        </button>
                        <button onClick={() => setSidebarOpen(!sidebarOpen)} className={`mobile-nav-btn ${sidebarOpen ? 'active' : 'dark:text-zinc-500'}`}>
                            <div className="relative inline-flex items-center justify-center p-1"><window.Icon name={sidebarOpen ? "x" : "more-horizontal"} size={20} /></div>
                            <span className="mobile-nav-label">{sidebarOpen ? "Stäng" : "Mer"}</span>
                        </button>
                    </div>
                </main>
            </div>
        </>
    );
};

const LoginScreen = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const handleLogin = (e) => { e.preventDefault(); auth.signInWithEmailAndPassword(email, password); };
    return (
        <div className="fixed inset-0 bg-black flex items-center justify-center font-mono z-[300]">
            <form onSubmit={handleLogin} className="w-full max-w-sm p-8 bg-[#0a0f18] border border-[#1a2235] space-y-6 text-white shadow-2xl">
                <h2 className="text-white font-black uppercase tracking-widest border-b border-orange-600 pb-4 text-center text-xs">System_Core_Access</h2>
                <input type="email" placeholder="EMAIL" className="w-full bg-[#121826] border border-[#1a2235] p-4 text-white text-[10px] outline-none focus:border-orange-500 transition-all" value={email} onChange={e => setEmail(e.target.value)} />
                <input type="password" placeholder="PASSWORD" className="w-full bg-[#121826] border border-[#1a2235] p-4 text-white text-[10px] outline-none focus:border-orange-500 transition-all" value={password} onChange={e => setPassword(e.target.value)} />
                <button type="submit" className="w-full bg-[#f97316] text-black font-black py-5 text-[10px] uppercase tracking-[0.3em] hover:bg-white transition-colors active:scale-95 shadow-lg">Authenticate</button>
            </form>
        </div>
    );
};

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(<App />);
