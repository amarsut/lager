// spotlight.js - AutoGrid Pro Command Palette (Fullt optimerad för mobil & dator)

window.SpotlightSearch = ({ isOpen, onClose, allJobs, allNotes, allLagerItems, navigateTo }) => {
    const { useState, useEffect, useMemo, useRef } = React;
    const [query, setQuery] = useState('');
    const [debouncedQuery, setDebouncedQuery] = useState('');
    const [activeIndex, setActiveIndex] = useState(0);
    const [activeTab, setActiveTab] = useState('ALLA'); 
    const [recentSearches, setRecentSearches] = useState([]);
    
    const inputRef = useRef(null);
    const resultsContainerRef = useRef(null);
    const activeItemRef = useRef(null);

    // --- HJÄLPFUNKTIONER ---
    const localStripHtml = (html) => {
        if (!html) return '';
        try { return new DOMParser().parseFromString(html, 'text/html').body.textContent || ""; } 
        catch (e) { return String(html).replace(/<[^>]*>?/gm, '').trim(); }
    };

    const HighlightText = ({ text, highlight }) => {
        if (!text) return null;
        if (!highlight || !highlight.trim()) return <>{text}</>;
        const escaped = highlight.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        const regex = new RegExp(`(${escaped})`, 'gi');
        return (
            <>{text.split(regex).map((part, i) =>
                regex.test(part) ? <span key={i} className="text-orange-500 font-black">{part}</span> : <span key={i}>{part}</span>
            )}</>
        );
    };

    // --- EFFECTS ---
    useEffect(() => {
        const saved = localStorage.getItem('autogrid_recent_searches');
        if (saved) setRecentSearches(JSON.parse(saved));
    }, []);

    useEffect(() => {
        const timer = setTimeout(() => setDebouncedQuery(query), 50); 
        return () => clearTimeout(timer);
    }, [query]);

    useEffect(() => {
        if (isOpen) {
            setQuery(''); setDebouncedQuery(''); setActiveIndex(0); setActiveTab('ALLA');
            setTimeout(() => inputRef.current?.focus(), 10);
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'unset';
        }
        return () => { document.body.style.overflow = 'unset'; };
    }, [isOpen]);

    useEffect(() => {
        if (activeItemRef.current && resultsContainerRef.current) {
            activeItemRef.current.scrollIntoView({ behavior: 'auto', block: 'nearest' });
        }
    }, [activeIndex]);

    const saveSearch = (q) => {
        if (!q.trim()) return;
        const updated = [q, ...recentSearches.filter(item => item !== q)].slice(0, 5);
        setRecentSearches(updated);
        localStorage.setItem('autogrid_recent_searches', JSON.stringify(updated));
    };

    // --- SÖKMOTOR & KATEGORISERING ---
    const results = useMemo(() => {
        const q = debouncedQuery.toLowerCase();
        const cleaned = debouncedQuery.replace(/\s+/g, '').toUpperCase();
        
        // 1. Kalkylator
        if (/^[0-9+\-*/().\s]+$/.test(q) && q.match(/[+\-*/]/)) {
            try {
                // eslint-disable-next-line no-eval
                const calcResult = eval(q);
                if (!isNaN(calcResult) && isFinite(calcResult)) {
                    return [{
                        id: 'calc_result', icon: 'calculator', title: `${calcResult.toLocaleString('sv-SE')}`, subtitle: `Resultat av ${q}`, 
                        type: 'math', category: 'Kalkylator', color: 'bg-indigo-500/20 text-indigo-400', copyText: String(calcResult)
                    }];
                }
            } catch(e) {}
        }

        // 2. Tomt Sökfält = Mini Dashboard
        if (!debouncedQuery.trim()) {
            return [
                { id: 'NEW_JOB', icon: 'plus-circle', title: 'Skapa nytt uppdrag', subtitle: 'Boka in ny arbetsorder', type: 'page', category: 'Snabba åtgärder', color: 'bg-orange-500/20 text-orange-500' },
                { id: 'SEARCH_CUST', icon: 'users', title: 'Sök Kund', subtitle: 'Öppna register', type: 'page', category: 'Snabba åtgärder', color: 'bg-emerald-500/20 text-emerald-500' },
                { id: 'ADD_INV', icon: 'package-plus', title: 'Inleverans Lager', subtitle: 'Lägg till artiklar', type: 'page', category: 'Snabba åtgärder', color: 'bg-blue-500/20 text-blue-500' },
                { id: 'SETTINGS', icon: 'settings', title: 'Inställningar', subtitle: 'Konfigurera systemet', type: 'page', category: 'Snabba åtgärder', color: 'bg-zinc-500/20 text-zinc-400' },
            ];
        }

        let items = [];

        // 3. Fordon & Jobb
        if (activeTab === 'ALLA' || activeTab === 'FORDON') {
            const isRegNr = /^[A-Z]{3}\d{2}[A-Z0-9]$/.test(cleaned);
            if (isRegNr) {
                items.push({ id: 'smart_search', icon: 'zap', title: `Sök System Radar: ${cleaned}`, subtitle: `Hämta all fordonsdata online`, type: 'os_radar_action', actionTarget: 'SMART_SEARCH', category: `Externa Tjänster`, color: 'bg-yellow-500/20 text-yellow-500', copyText: cleaned });
            }

            const jobs = allJobs.filter(j => 
                (j.regnr && j.regnr.toLowerCase().includes(q)) || 
                (j.kundnamn && j.kundnamn.toLowerCase().includes(q)) ||
                (j.kommentar && j.kommentar.toLowerCase().includes(q))
            ).map(j => ({
                id: j.id, job: j, icon: 'car', 
                title: j.kundnamn || 'Okänd Kund', 
                subtitle: j.regnr || '-', 
                snippet: localStripHtml(j.kommentar), // Beskrivning/kommentar
                type: 'job', category: 'Arbetsordrar & Kunder',
                copyText: j.regnr || j.kundnamn,
                status: j.status,
                color: 'bg-orange-500/10 text-orange-500'
            }));
            items = [...items, ...jobs];
        }

        // 4. Lager & Reservdelar
        if (activeTab === 'ALLA' || activeTab === 'LAGER') {
            const inv = (allLagerItems || []).filter(i => {
                const searchQ = q.replace(/\s+/g, '');
                return (i.name && String(i.name).toLowerCase().includes(q)) || 
                       (i.orgnr && String(i.orgnr).toLowerCase().replace(/\s+/g, '').includes(searchQ)) ||
                       (i.service_filter && String(i.service_filter).toLowerCase().includes(q));
            }).map(i => {
                const displayNum = i.orgnr || i.artnr || i.service_filter || '';
                return {
                    id: `LAGER_ITEM_${i.id}`, targetPage: 'LAGER', icon: 'package', 
                    title: i.name || 'Okänd Artikel', 
                    subtitle: displayNum, 
                    snippet: `Pris: ${i.price || 0} kr • Hylla: ${i.hylla || 'Ej angiven'}`, // Snippet för lager
                    qty: parseInt(i.quantity) || 0, price: i.price || 0,
                    type: 'inventory', category: 'Lager & Inventarie', 
                    copyText: displayNum || i.name,
                    color: 'bg-emerald-500/10 text-emerald-500',
                    itemData: i
                };
            });
            items = [...items, ...inv];
        }

        // 5. System & Navigation
        if (activeTab === 'ALLA') {
            const pages = [
                { id: 'DASHBOARD', icon: 'grid', title: 'Dashboard', subtitle: 'Gå till', category: 'Systemnavigering', color: 'bg-zinc-500/20 text-zinc-300' },
                { id: 'CALENDAR', icon: 'calendar', title: 'Kalender', subtitle: 'Gå till', category: 'Systemnavigering', color: 'bg-zinc-500/20 text-zinc-300' },
            ].filter(p => p.title.toLowerCase().includes(q));
            items = [...items, ...pages];
        }

        return items.slice(0, 15);
    }, [debouncedQuery, allJobs, allNotes, allLagerItems, activeTab]);

    useEffect(() => {
        setActiveIndex(0);
        if (window.lucide) window.lucide.createIcons();
    }, [results, activeTab]);

    const handleKeyDown = (e) => {
        if (e.key === 'ArrowDown') {
            e.preventDefault(); setActiveIndex(prev => (prev < results.length - 1 ? prev + 1 : prev));
        } else if (e.key === 'ArrowUp') {
            e.preventDefault(); setActiveIndex(prev => (prev > 0 ? prev - 1 : 0));
        } else if (e.key === 'Enter' && results[activeIndex]) {
            e.preventDefault(); executeAction(results[activeIndex]);
        } else if (e.key === 'Escape') {
            onClose();
        } else if (e.key === 'Tab') {
            e.preventDefault();
            const tabs = ['ALLA', 'FORDON', 'LAGER'];
            const next = tabs[(tabs.indexOf(activeTab) + 1) % tabs.length];
            setActiveTab(next);
            inputRef.current?.focus();
        }
    };

    const executeAction = (item) => {
        if (item.type === 'math') {
            navigator.clipboard.writeText(item.title); onClose(); return;
        }
        if (debouncedQuery) saveSearch(debouncedQuery);
        onClose();

        if (item.type === 'os_radar_action' && window.osSearchVehicle) window.osSearchVehicle(item.copyText, item.actionTarget);
        else if (item.type === 'page' || item.type === 'inventory') navigateTo(item.targetPage || item.id, item.id === 'NEW_JOB' ? { job: null } : null);
        else if (item.type === 'job') {
            if (window.openVehicleProfile) window.openVehicleProfile(item.job.regnr, item.job.id);
            else navigateTo('NEW_JOB', { job: item.job });
        }
    };

    if (!isOpen) return null;

    const activeItem = results[activeIndex];
    let lastCategory = null;

    const Badge = ({ status }) => {
        const s = (status || 'BOKAD').toUpperCase();
        const colors = { 'KLAR': 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20', 'BOKAD': 'bg-orange-500/10 text-orange-400 border-orange-500/20', 'FAKTURERAS': 'bg-zinc-800 text-zinc-300 border-zinc-700' };
        return <span className={`px-2 py-0.5 text-[9px] font-black tracking-widest rounded border ${colors[s] || colors['BOKAD']}`}>{s}</span>;
    };

    const StatusDot = ({ active }) => (
        <span className="relative flex h-2 w-2 mr-2">
            {active && <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>}
            <span className={`relative inline-flex rounded-full h-2 w-2 ${active ? 'bg-emerald-500' : 'bg-red-500'}`}></span>
        </span>
    );

    return (
        <div className="fixed inset-0 z-[9999] flex justify-center items-start pt-0 sm:pt-[8vh] bg-zinc-950/60 backdrop-blur-sm p-0 sm:p-2">
            <div className="absolute inset-0" onClick={onClose}></div>
            
            {/* HUVUDCONTAINER: Fullskärm på mobil, Split-pane på dator */}
            <div className="relative w-full h-[100dvh] sm:h-[650px] sm:w-[900px] bg-[#0c0c0e] sm:rounded-2xl shadow-[0_0_0_1px_rgba(255,255,255,0.05),0_30px_60px_rgba(0,0,0,0.5)] flex flex-col overflow-hidden">
                
                {/* 1. TOP HEADER & SÖK */}
                <div className="flex flex-col border-b border-white/5 bg-[#121214] z-20 shrink-0">
                    <div className="flex items-center px-4 sm:px-6 py-4">
                        <window.Icon name="search" size={22} strokeWidth={2} className="text-zinc-500 shrink-0 mr-3" />
                        <input
                            ref={inputRef}
                            type="text"
                            value={query}
                            onChange={e => setQuery(e.target.value)}
                            onKeyDown={handleKeyDown}
                            placeholder="Sök kommandon, fordon, lager..."
                            className="w-full bg-transparent border-0 ring-0 outline-none text-lg sm:text-xl font-medium text-white placeholder:text-zinc-600 appearance-none p-0"
                            autoComplete="off" spellCheck="false"
                        />
                        {query && (
                            <button onClick={() => setQuery('')} className="p-1 hover:bg-white/10 rounded text-zinc-500 transition-colors mr-2">
                                <window.Icon name="x" size={18} />
                            </button>
                        )}
                        {/* Avbryt-knapp för mobil */}
                        <button onClick={onClose} className="sm:hidden px-3 py-1 bg-white/10 rounded text-xs font-bold text-zinc-300">
                            Stäng
                        </button>
                        <div className="hidden sm:flex items-center gap-1.5 px-2 py-1 bg-white/5 rounded border border-white/10 shrink-0">
                            <span className="text-[10px] font-bold text-zinc-400">ESC</span>
                        </div>
                    </div>
                    
                    {/* FLIKAR / FILTER */}
                    <div className="flex items-center gap-1 px-4 sm:px-6 pb-3">
                        {['ALLA', 'FORDON', 'LAGER'].map(tab => (
                            <button 
                                key={tab} onClick={() => { setActiveTab(tab); inputRef.current?.focus(); }}
                                className={`px-3 py-1 text-[10px] font-bold tracking-widest rounded-full transition-colors ${activeTab === tab ? 'bg-orange-500/20 text-orange-400 border border-orange-500/20' : 'bg-transparent text-zinc-500 hover:text-zinc-300'}`}
                            >
                                {tab}
                            </button>
                        ))}
                    </div>
                </div>

                {/* 2. INNEHÅLLSYTA */}
                <div className="flex flex-1 overflow-hidden">
                    
                    {/* LISTAN: Tar hela bredden på mobil, 55% på dator */}
                    <div ref={resultsContainerRef} className="flex-1 w-full sm:w-[55%] overflow-y-auto custom-scrollbar p-2 flex flex-col gap-1">
                        
                        {results.length > 0 ? results.map((item, index) => {
                            const showCategory = item.category !== lastCategory;
                            lastCategory = item.category;
                            const isActive = activeIndex === index;

                            return (
                                <React.Fragment key={`${item.type}-${item.id}`}>
                                    {showCategory && (
                                        <div className="px-3 pt-3 pb-1 text-[9px] font-black uppercase tracking-widest text-zinc-600">
                                            {item.category}
                                        </div>
                                    )}
                                    <div 
                                        ref={isActive ? activeItemRef : null}
                                        onMouseEnter={() => setActiveIndex(index)}
                                        onClick={() => executeAction(item)}
                                        className={`flex items-start gap-3 px-3.5 py-3 rounded-xl cursor-pointer transition-none relative group ${isActive ? 'bg-white/10 sm:bg-white/10' : 'bg-white/5 sm:bg-transparent hover:bg-white/5'}`}
                                    >
                                        {isActive && <div className="hidden sm:block absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-orange-500 rounded-r-md"></div>}

                                        <div className={`w-8 h-8 flex items-center justify-center rounded-md shrink-0 mt-0.5 ${item.color || 'bg-white/5 text-zinc-400'}`}>
                                            <window.Icon name={item.icon} size={16} strokeWidth={2} />
                                        </div>
                                        
                                        <div className="flex flex-col flex-1 min-w-0">
                                            <div className="flex items-center justify-between w-full gap-2">
                                                <span className={`text-[13px] truncate ${isActive ? 'text-white font-bold' : 'text-zinc-300 font-medium'}`}>
                                                    <HighlightText text={item.title} highlight={debouncedQuery} />
                                                </span>
                                                {item.type === 'job' && item.status && <Badge status={item.status} />}
                                                {item.type === 'inventory' && <span className="text-[11px] font-mono text-zinc-400 font-bold">{item.qty} st</span>}
                                            </div>
                                            
                                            <div className="text-[11px] text-zinc-500 truncate mt-0.5">
                                                <HighlightText text={item.subtitle} highlight={debouncedQuery} />
                                            </div>

                                            {/* NYTT: Visar beskrivning/kommentar direkt i mobilvyn och listan */}
                                            {item.snippet && (
                                                <div className="mt-1.5 text-[11px] text-zinc-400 italic line-clamp-2 border-l border-orange-500/50 pl-2">
                                                    <HighlightText text={item.snippet} highlight={debouncedQuery} />
                                                </div>
                                            )}
                                        </div>
                                        
                                        <window.Icon name="chevron-right" size={14} className="text-zinc-600 shrink-0 sm:hidden self-center" />
                                    </div>
                                </React.Fragment>
                            );
                        }) : (
                            <div className="flex flex-col items-center justify-center h-full text-zinc-500 pb-10">
                                <window.Icon name="search-x" size={32} className="mb-3 opacity-20" />
                                <span className="text-sm font-medium">Inga träffar på "{query}"</span>
                            </div>
                        )}
                    </div>

                    {/* HÖGERPANEL: Preview (Endast Desktop) */}
                    <div className="hidden sm:flex flex-col w-[45%] border-l border-white/5 bg-[#0f0f11] p-6 overflow-y-auto custom-scrollbar">
                        {activeItem ? (
                            <div className="animate-in fade-in zoom-in-95 duration-100 flex flex-col h-full">
                                
                                <div className="flex flex-col items-center text-center mb-6 mt-4">
                                    <div className={`w-16 h-16 flex items-center justify-center rounded-2xl mb-4 ${activeItem.color || 'bg-white/5 text-zinc-400'}`}>
                                        <window.Icon name={activeItem.icon} size={32} strokeWidth={1.5} />
                                    </div>
                                    <h2 className="text-xl font-bold text-white mb-1 leading-tight">{activeItem.title}</h2>
                                    <p className="text-sm text-zinc-400 font-mono bg-white/5 px-2 py-1 rounded-md inline-block">{activeItem.subtitle}</p>
                                </div>

                                {activeItem.type === 'job' && (
                                    <div className="flex flex-col gap-4 w-full">
                                        <div className="grid grid-cols-2 gap-2">
                                            <div className="bg-white/5 rounded-lg p-3 border border-white/5">
                                                <span className="text-[10px] uppercase text-zinc-500 font-bold block mb-1">Status</span>
                                                <Badge status={activeItem.status} />
                                            </div>
                                            <div className="bg-white/5 rounded-lg p-3 border border-white/5">
                                                <span className="text-[10px] uppercase text-zinc-500 font-bold block mb-1">Pris</span>
                                                <span className="text-[14px] text-white font-bold">{(parseInt(activeItem.job.kundpris)||0).toLocaleString('sv-SE')} kr</span>
                                            </div>
                                        </div>
                                        {activeItem.snippet && (
                                            <div className="bg-white/5 rounded-lg p-3 border border-white/5">
                                                <span className="text-[10px] uppercase text-zinc-500 font-bold block mb-1">Kommentar</span>
                                                <p className="text-[12px] text-zinc-300 italic leading-relaxed">{activeItem.snippet}</p>
                                            </div>
                                        )}
                                    </div>
                                )}

                                {activeItem.type === 'inventory' && (
                                    <div className="flex flex-col gap-4 w-full">
                                        <div className="grid grid-cols-2 gap-2">
                                            <div className="bg-white/5 rounded-lg p-3 border border-white/5 flex items-center justify-between">
                                                <div>
                                                    <span className="text-[10px] uppercase text-zinc-500 font-bold block mb-1">Lagersaldo</span>
                                                    <span className="text-[14px] text-white font-bold">{activeItem.qty} st</span>
                                                </div>
                                                <StatusDot active={activeItem.qty > 0} />
                                            </div>
                                            <div className="bg-white/5 rounded-lg p-3 border border-white/5">
                                                <span className="text-[10px] uppercase text-zinc-500 font-bold block mb-1">Utpris</span>
                                                <span className="text-[14px] text-white font-bold">{activeItem.price} kr</span>
                                            </div>
                                        </div>
                                        
                                        <div className="bg-white/5 rounded-lg p-3 border border-white/5">
                                            <span className="text-[10px] uppercase text-zinc-500 font-bold block mb-2">Artikelinformation</span>
                                            <div className="flex justify-between text-[11px] py-1 border-b border-white/5">
                                                <span className="text-zinc-500">Org.nummer</span>
                                                <span className="text-white font-mono">{activeItem.itemData?.orgnr || '-'}</span>
                                            </div>
                                            <div className="flex justify-between text-[11px] py-1 border-b border-white/5">
                                                <span className="text-zinc-500">Artikel nr</span>
                                                <span className="text-white font-mono">{activeItem.itemData?.artnr || '-'}</span>
                                            </div>
                                            <div className="flex justify-between text-[11px] py-1">
                                                <span className="text-zinc-500">Hyllplats</span>
                                                <span className="text-orange-400 font-mono font-bold">{activeItem.itemData?.hylla || 'Okänd'}</span>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                <div className="mt-auto pt-6 flex flex-col gap-2">
                                    <button onClick={() => executeAction(activeItem)} className="w-full py-2.5 bg-orange-500 hover:bg-orange-600 text-white text-[12px] font-bold rounded-lg transition-colors flex items-center justify-center gap-2">
                                        {activeItem.type === 'os_radar_action' ? 'Sök Fordon' : 'Öppna'} 
                                        <kbd className="bg-black/20 px-1.5 py-0.5 rounded text-[10px]">↵</kbd>
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <div className="flex items-center justify-center h-full text-zinc-600">
                                Välj ett objekt för att se detaljer
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};
