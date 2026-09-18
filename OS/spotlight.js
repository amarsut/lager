// spotlight.js - AutoGrid Pro Command Palette (Adaptivt Ljust/Mörkt Tema & Fixad Data)

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

    const localStripHtml = (html) => {
        if (!html) return '';
        try { return new DOMParser().parseFromString(html, 'text/html').body.textContent || ""; } 
        catch (e) { return String(html).replace(/<[^>]*>?/gm, '').trim(); }
    };

    // Anpassad highlight för att synas bra på både ljust och mörkt
    const HighlightText = ({ text, highlight }) => {
        if (!text) return null;
        if (!highlight || !highlight.trim()) return <>{text}</>;
        const escaped = highlight.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        const regex = new RegExp(`(${escaped})`, 'gi');
        return (
            <>{text.split(regex).map((part, i) =>
                regex.test(part) ? <span key={i} className="text-orange-600 dark:text-orange-400 font-black bg-orange-500/10 px-0.5 rounded-[3px]">{part}</span> : <span key={i}>{part}</span>
            )}</>
        );
    };

    useEffect(() => {
        const saved = localStorage.getItem('autogrid_recent_searches');
        if (saved) setRecentSearches(JSON.parse(saved));
    }, []);

    useEffect(() => {
        const timer = setTimeout(() => setDebouncedQuery(query), 40); 
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

    const handleCopy = (e, text) => {
        e.stopPropagation();
        navigator.clipboard.writeText(text);
        setCopiedId(text);
        setTimeout(() => setCopiedId(null), 1000);
    };
    const [copiedId, setCopiedId] = useState(null);

    const results = useMemo(() => {
        const q = debouncedQuery.toLowerCase();
        const cleaned = debouncedQuery.replace(/\s+/g, '').toUpperCase();
        
        if (/^[0-9+\-*/().\s]+$/.test(q) && q.match(/[+\-*/]/)) {
            try {
                // eslint-disable-next-line no-eval
                const calcResult = eval(q);
                if (!isNaN(calcResult) && isFinite(calcResult)) {
                    return [{
                        id: 'calc_result', icon: 'calculator', title: `${calcResult.toLocaleString('sv-SE')}`, subtitle: `Resultat av ${q}`, 
                        type: 'math', category: 'Kalkylator', color: 'bg-indigo-100 text-indigo-600 dark:bg-indigo-500/20 dark:text-indigo-400', copyText: String(calcResult)
                    }];
                }
            } catch(e) {}
        }

        if (!debouncedQuery.trim()) {
            return [
                { id: 'NEW_JOB', icon: 'plus-circle', title: 'Skapa nytt uppdrag', subtitle: 'Boka in ny arbetsorder', type: 'page', category: 'Snabba åtgärder', color: 'bg-orange-100 text-orange-600 dark:bg-orange-500/20 dark:text-orange-500' },
                { id: 'SEARCH_CUST', icon: 'users', title: 'Sök Kund', subtitle: 'Öppna register', type: 'page', category: 'Snabba åtgärder', color: 'bg-emerald-100 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-500' },
                { id: 'ADD_INV', icon: 'package-plus', title: 'Inleverans Lager', subtitle: 'Lägg till artiklar', type: 'page', category: 'Snabba åtgärder', color: 'bg-blue-100 text-blue-600 dark:bg-blue-500/20 dark:text-blue-500' },
                { id: 'SETTINGS', icon: 'settings', title: 'Inställningar', subtitle: 'Konfigurera systemet', type: 'page', category: 'Snabba åtgärder', color: 'bg-zinc-200 text-zinc-600 dark:bg-zinc-500/20 dark:text-zinc-400' },
            ];
        }

        let items = [];

        if (activeTab === 'ALLA' || activeTab === 'FORDON') {
            const isRegNr = /^[A-Z]{3}\d{2}[A-Z0-9]$/.test(cleaned);
            if (isRegNr) {
                items.push({ id: 'smart_search', icon: 'zap', title: `Sök System Radar: ${cleaned}`, subtitle: `Hämta all fordonsdata online`, type: 'os_radar_action', actionTarget: 'SMART_SEARCH', category: `Externa Tjänster`, color: 'bg-yellow-100 text-yellow-600 dark:bg-yellow-500/20 dark:text-yellow-400', copyText: cleaned });
            }

            const jobs = allJobs.filter(j => 
                (j.regnr && j.regnr.toLowerCase().includes(q)) || 
                (j.kundnamn && j.kundnamn.toLowerCase().includes(q)) ||
                (j.kommentar && j.kommentar.toLowerCase().includes(q)) ||
                (j.paket && j.paket.toLowerCase().includes(q))
            ).map(j => {
                const titleStr = j.paket ? `${j.paket}${j.oljevolym ? ` ${j.oljevolym}l` : ''}` : 'Standard';
                return {
                    id: j.id, job: j, icon: 'car', 
                    title: j.kundnamn || 'Okänd Kund', 
                    subtitle: j.regnr || '-', 
                    jobTitle: titleStr, 
                    snippet: localStripHtml(j.kommentar),
                    type: 'job', category: 'Arbetsordrar & Kunder',
                    copyText: j.regnr || j.kundnamn,
                    status: j.status,
                    color: 'bg-orange-100 text-orange-600 dark:bg-orange-500/10 dark:text-orange-400',
                    price: parseInt(j.kundpris) || 0
                };
            });
            items = [...items, ...jobs];
        }

        if (activeTab === 'ALLA' || activeTab === 'LAGER') {
            const inv = (allLagerItems || []).filter(i => {
                const searchQ = q.replace(/\s+/g, '');
                return (i.name && String(i.name).toLowerCase().includes(q)) || 
                       (i.orgnr && String(i.orgnr).toLowerCase().replace(/\s+/g, '').includes(searchQ)) ||
                       (i.artnr && String(i.artnr).toLowerCase().replace(/\s+/g, '').includes(searchQ)) ||
                       (i.sku && String(i.sku).toLowerCase().replace(/\s+/g, '').includes(searchQ)) ||
                       (i.service_filter && String(i.service_filter).toLowerCase().includes(q));
            }).map(i => {
                // Aggressiv sökning för att fylla orgnr/artnr
                const fallbackOrg = i.orgnr || i.articleNumber || i.sku || i.service_filter || '';
                const fallbackArt = i.artnr || i.partNumber || '';
                const displayNum = fallbackOrg || fallbackArt || '';
                
                return {
                    id: `LAGER_ITEM_${i.id}`, targetPage: 'LAGER', icon: 'package', 
                    title: i.name || 'Okänd Artikel', 
                    subtitle: displayNum, 
                    snippet: `Pris: ${i.price || 0} kr • Hylla: ${i.hylla || 'Ej angiven'}`,
                    qty: parseInt(i.quantity) || 0, price: i.price || 0,
                    orgnr: fallbackOrg, artnr: fallbackArt, hylla: i.hylla || 'Ej angiven',
                    type: 'inventory', category: 'Lager & Inventarie', 
                    copyText: displayNum || i.name,
                    color: 'bg-emerald-100 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400',
                    itemData: i
                };
            });
            items = [...items, ...inv];
        }

        if (activeTab === 'ALLA') {
            const pages = [
                { id: 'DASHBOARD', icon: 'grid', title: 'Dashboard', subtitle: 'Gå till', category: 'Systemnavigering', color: 'bg-zinc-200 text-zinc-700 dark:bg-zinc-500/20 dark:text-zinc-300' },
                { id: 'CALENDAR', icon: 'calendar', title: 'Kalender', subtitle: 'Gå till', category: 'Systemnavigering', color: 'bg-zinc-200 text-zinc-700 dark:bg-zinc-500/20 dark:text-zinc-300' },
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
        const colors = { 
            'KLAR': 'bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20', 
            'BOKAD': 'bg-orange-100 text-orange-700 border-orange-200 dark:bg-orange-500/10 dark:text-orange-400 dark:border-orange-500/20', 
            'FAKTURERAS': 'bg-zinc-200 text-zinc-700 border-zinc-300 dark:bg-zinc-800 dark:text-zinc-300 dark:border-zinc-700' 
        };
        return <span className={`px-2 py-0.5 text-[9px] font-black tracking-widest rounded border ${colors[s] || colors['BOKAD']}`}>{s}</span>;
    };

    const StatusDot = ({ active }) => (
        <span className="relative flex h-2 w-2 mr-2">
            {active && <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>}
            <span className={`relative inline-flex rounded-full h-2 w-2 ${active ? 'bg-emerald-500' : 'bg-red-500'}`}></span>
        </span>
    );

    return (
        <div className="fixed inset-0 z-[9999] flex justify-center items-start pt-0 sm:pt-[8vh] bg-black/60 dark:bg-black/75 p-0 sm:p-2">
            <div className="absolute inset-0" onClick={onClose}></div>
            
            <div className="relative w-full h-[100dvh] sm:h-[620px] sm:w-[920px] bg-white dark:bg-[#0c0c0e] sm:rounded-2xl shadow-[0_10px_40px_-10px_rgba(0,0,0,0.15)] dark:shadow-[0_0_0_1px_rgba(255,255,255,0.08),0_30px_60px_rgba(0,0,0,0.6)] flex flex-col overflow-hidden">
                
                {/* 1. TOP HEADER & SÖK */}
                {/* 1. TOP HEADER & SÖK */}
<div className="flex flex-col border-b border-zinc-200 dark:border-white/10 bg-white dark:bg-[#121214] z-20 shrink-0">
    <div className="flex items-center justify-between px-4 sm:px-6 py-4">
        <div className="flex items-center flex-1 mr-3">
            <window.Icon name="search" size={20} strokeWidth={2.5} className="text-orange-500 shrink-0 mr-3" />
            <input
                ref={inputRef}
                type="text"
                value={query}
                onChange={e => setQuery(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Sök arbetsorder, kund, regnr eller artikel..."
                className="w-full bg-transparent border-0 ring-0 outline-none text-lg sm:text-xl font-medium text-zinc-900 dark:text-white placeholder:text-zinc-400 dark:placeholder:text-zinc-500 appearance-none p-0"
                autoCorrect="off" autoCapitalize="off" spellCheck="false"
            />
        </div>

        {/* Högerdel: Endast enhetlig rensa/stäng-funktion och ESC-badge */}
        <div className="flex items-center gap-2 shrink-0">
            <div className="hidden sm:flex items-center px-2 py-1 bg-zinc-100 dark:bg-white/5 rounded border border-zinc-200 dark:border-white/10">
                <span className="text-[10px] font-bold text-zinc-500 dark:text-zinc-400 tracking-wider">ESC</span>
            </div>

            <button 
                onClick={() => { if (query) { setQuery(''); inputRef.current?.focus(); } else { onClose(); } }} 
                className="p-1.5 hover:bg-zinc-100 dark:hover:bg-white/10 rounded-lg text-zinc-400 hover:text-zinc-700 dark:hover:text-white transition-colors" 
                title={query ? "Rensa sökning" : "Stäng"}
            >
                <window.Icon name="x" size={18} />
            </button>
        </div>
    </div>
    
    {/* FLIKAR / FILTER */}
    <div className="flex items-center gap-1.5 px-4 sm:px-6 pb-3">
        {['ALLA', 'FORDON', 'LAGER'].map(tab => (
            <button 
                key={tab} onClick={() => { setActiveTab(tab); inputRef.current?.focus(); }}
                className={`px-3.5 py-1 text-[10px] font-black tracking-widest rounded-full transition-all ${activeTab === tab ? 'bg-orange-500 text-white shadow-sm shadow-orange-500/30' : 'bg-zinc-100 text-zinc-500 hover:bg-zinc-200 dark:bg-white/5 dark:text-zinc-400 dark:hover:bg-white/10 dark:hover:text-white'}`}
            >
                {tab}
            </button>
        ))}
    </div>
</div>

                {/* 2. INNEHÅLLSYTA */}
                <div className="flex flex-1 overflow-hidden bg-zinc-50/50 dark:bg-transparent">
                    
                    {/* VÄNSTERPANEL: Listan */}
                    <div ref={resultsContainerRef} className="flex-1 w-full sm:w-[55%] overflow-y-auto custom-scrollbar p-2 sm:p-3 flex flex-col gap-1">
                        
                        {results.length > 0 ? results.map((item, index) => {
                            const showCategory = item.category !== lastCategory;
                            lastCategory = item.category;
                            const isActive = activeIndex === index;

                            return (
                                <React.Fragment key={`${item.type}-${item.id}`}>
                                    {showCategory && (
                                        <div className="px-3 pt-3 pb-1 text-[9px] font-black uppercase tracking-widest text-zinc-500 dark:text-zinc-500">
                                            {item.category}
                                        </div>
                                    )}
                                    <div 
                                        ref={isActive ? activeItemRef : null}
                                        onMouseEnter={() => setActiveIndex(index)}
                                        onClick={() => executeAction(item)}
                                        className={`flex items-start gap-3.5 px-3.5 py-3 rounded-xl cursor-pointer transition-colors relative group ${isActive ? 'bg-white dark:bg-white/10 shadow-sm sm:shadow-none border border-zinc-200 dark:border-transparent' : 'hover:bg-white/50 dark:hover:bg-white/5 border border-transparent'}`}
                                    >
                                        {isActive && <div className="hidden sm:block absolute left-[-1px] top-1/2 -translate-y-1/2 w-1 h-6 bg-orange-500 rounded-r-md"></div>}

                                        <div className={`w-8 h-8 flex items-center justify-center rounded-md shrink-0 mt-0.5 ${item.color || 'bg-zinc-100 text-zinc-500 dark:bg-white/5 dark:text-zinc-400'}`}>
                                            <window.Icon name={item.icon} size={16} strokeWidth={2} />
                                        </div>
                                        
                                        <div className="flex flex-col flex-1 min-w-0">
                                            <div className="flex items-center justify-between w-full gap-2">
                                                <span className={`text-[13px] sm:text-[14px] truncate font-bold ${isActive ? 'text-zinc-900 dark:text-white' : 'text-zinc-700 dark:text-zinc-200'}`}>
                                                    <HighlightText text={item.title} highlight={debouncedQuery} />
                                                </span>
                                                {item.type === 'job' && item.status && <Badge status={item.status} />}
                                                {item.type === 'inventory' && <span className="text-[11px] font-mono text-emerald-600 dark:text-emerald-400 font-bold bg-emerald-100 dark:bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-200 dark:border-transparent">{item.qty} st</span>}
                                            </div>
                                            
                                            {item.jobTitle && (
                                                <div className="text-[11px] font-semibold text-orange-600 dark:text-orange-400/90 mt-0.5">
                                                    {item.jobTitle}
                                                </div>
                                            )}

                                            <div className="text-[11px] sm:text-[12px] text-zinc-500 dark:text-zinc-400 truncate mt-0.5 font-mono">
                                                <HighlightText text={item.subtitle} highlight={debouncedQuery} />
                                            </div>

                                            {item.snippet && (
                                                <div className="mt-1.5 text-[11px] text-zinc-600 dark:text-zinc-400 italic line-clamp-2 border-l-2 border-orange-300 dark:border-orange-500/60 pl-2.5">
                                                    <HighlightText text={item.snippet} highlight={debouncedQuery} />
                                                </div>
                                            )}
                                        </div>
                                        
                                        <window.Icon name="chevron-right" size={14} className="text-zinc-400 dark:text-zinc-600 shrink-0 sm:hidden self-center" />
                                    </div>
                                </React.Fragment>
                            );
                        }) : (
                            <div className="flex flex-col items-center justify-center h-full text-zinc-400 dark:text-zinc-500 pb-10">
                                <window.Icon name="search-x" size={36} className="mb-3 opacity-30" />
                                <span className="text-sm font-medium">Inga träffar på "{query}"</span>
                            </div>
                        )}
                    </div>

                    {/* HÖGERPANEL: Preview (Endast Desktop) */}
                    <div className="hidden sm:flex flex-col w-[45%] border-l border-zinc-200 dark:border-white/10 bg-white/50 dark:bg-[#0f0f11] p-6 overflow-y-auto custom-scrollbar">
                        {activeItem ? (
                            <div className="animate-in fade-in zoom-in-95 duration-100 flex flex-col h-full">
                                
                                <div className="flex flex-col items-center text-center mb-6 mt-4">
                                    <div className={`w-16 h-16 flex items-center justify-center rounded-2xl mb-4 shadow-sm dark:shadow-inner border border-zinc-100 dark:border-transparent ${activeItem.color || 'bg-zinc-100 text-zinc-500 dark:bg-white/5 dark:text-zinc-400'}`}>
                                        <window.Icon name={activeItem.icon} size={32} strokeWidth={2} />
                                    </div>
                                    <h2 className="text-xl font-black text-zinc-900 dark:text-white mb-1 leading-tight">{activeItem.title}</h2>
                                    <p className="text-xs text-zinc-500 dark:text-zinc-300 font-mono bg-zinc-100 dark:bg-white/5 px-2.5 py-1 rounded-md inline-block border border-zinc-200 dark:border-white/5">{activeItem.subtitle}</p>
                                </div>

                                {/* Förhandsvisning: Arbetsorder */}
                                {activeItem.type === 'job' && (
                                    <div className="flex flex-col gap-3 w-full">
                                        {activeItem.jobTitle && (
                                            <div className="bg-orange-50 dark:bg-orange-500/10 border border-orange-200 dark:border-orange-500/20 rounded-xl p-3">
                                                <span className="text-[9px] uppercase text-orange-600 dark:text-orange-400 font-black tracking-widest block mb-0.5">Typ av jobb</span>
                                                <span className="text-[13px] text-zinc-900 dark:text-white font-bold">{activeItem.jobTitle}</span>
                                            </div>
                                        )}
                                        <div className="grid grid-cols-2 gap-2">
                                            <div className="bg-zinc-50 dark:bg-white/5 rounded-xl p-3 border border-zinc-200 dark:border-white/5">
                                                <span className="text-[9px] uppercase text-zinc-500 font-black tracking-widest block mb-1">Status</span>
                                                <Badge status={activeItem.status} />
                                            </div>
                                            <div className="bg-zinc-50 dark:bg-white/5 rounded-xl p-3 border border-zinc-200 dark:border-white/5">
                                                <span className="text-[9px] uppercase text-zinc-500 font-black tracking-widest block mb-1">Pris</span>
                                                <span className="text-[14px] text-zinc-900 dark:text-white font-mono font-bold">{activeItem.price.toLocaleString('sv-SE')} kr</span>
                                            </div>
                                        </div>
                                        {activeItem.snippet && (
                                            <div className="bg-zinc-50 dark:bg-white/5 rounded-xl p-3.5 border border-zinc-200 dark:border-white/5">
                                                <span className="text-[9px] uppercase text-zinc-500 font-black tracking-widest block mb-1.5">Kommentar</span>
                                                <p className="text-[12px] text-zinc-700 dark:text-zinc-300 italic leading-relaxed">{activeItem.snippet}</p>
                                            </div>
                                        )}
                                    </div>
                                )}

                                {/* Förhandsvisning: Lager (Fixad orgnr/artnr logik) */}
                                {activeItem.type === 'inventory' && (
                                    <div className="flex flex-col gap-3 w-full">
                                        <div className="grid grid-cols-2 gap-2">
                                            <div className="bg-zinc-50 dark:bg-white/5 rounded-xl p-3 border border-zinc-200 dark:border-white/5 flex items-center justify-between">
                                                <div>
                                                    <span className="text-[9px] uppercase text-zinc-500 font-black tracking-widest block mb-1">Lagersaldo</span>
                                                    <span className="text-[14px] text-zinc-900 dark:text-white font-bold">{activeItem.qty} st</span>
                                                </div>
                                                <StatusDot active={activeItem.qty > 0} />
                                            </div>
                                            <div className="bg-zinc-50 dark:bg-white/5 rounded-xl p-3 border border-zinc-200 dark:border-white/5">
                                                <span className="text-[9px] uppercase text-zinc-500 font-black tracking-widest block mb-1">Utpris</span>
                                                <span className="text-[14px] text-zinc-900 dark:text-white font-mono font-bold">{activeItem.price} kr</span>
                                            </div>
                                        </div>
                                        
                                        <div className="bg-zinc-50 dark:bg-white/5 rounded-xl p-3.5 border border-zinc-200 dark:border-white/5">
                                            <span className="text-[9px] uppercase text-zinc-500 font-black tracking-widest block mb-2.5">Artikelinformation</span>
                                            <div className="flex justify-between text-[11px] py-1.5 border-b border-zinc-200 dark:border-white/5">
                                                <span className="text-zinc-500">Org.nummer</span>
                                                <span className="text-zinc-900 dark:text-white font-mono font-bold">{activeItem.orgnr || '-'}</span>
                                            </div>
                                            <div className="flex justify-between text-[11px] py-1.5 border-b border-zinc-200 dark:border-white/5">
                                                <span className="text-zinc-500">Artikel nr</span>
                                                <span className="text-zinc-900 dark:text-white font-mono font-bold">{activeItem.artnr || '-'}</span>
                                            </div>
                                            <div className="flex justify-between text-[11px] py-1.5">
                                                <span className="text-zinc-500">Hyllplats</span>
                                                <span className="text-orange-500 dark:text-orange-400 font-mono font-bold">{activeItem.hylla || 'Ej angiven'}</span>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                <div className="mt-auto pt-6 pb-4">
                                    <button onClick={() => executeAction(activeItem)} className="w-full py-3 bg-orange-500 hover:bg-orange-600 text-white text-[12px] font-black uppercase tracking-widest rounded-xl transition-all shadow-md hover:shadow-lg shadow-orange-500/20 flex items-center justify-center gap-2">
                                        {activeItem.type === 'os_radar_action' ? 'Sök Fordon' : 'Öppna Objekt'} 
                                        <kbd className="bg-black/20 px-1.5 py-0.5 rounded text-[10px]">↵</kbd>
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <div className="flex flex-col items-center justify-center h-full text-zinc-400 dark:text-zinc-600">
                                <window.Icon name="mouse-pointer" size={24} className="mb-2 opacity-30 dark:opacity-20" />
                                <span className="text-xs">Välj ett objekt för direkt förhandsvisning</span>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};
