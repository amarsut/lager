// spotlight.js - Kompakt och responsiv Command Palette (Med färgkodade badges)

window.SpotlightSearch = ({ isOpen, onClose, allJobs, allNotes, allLagerItems, navigateTo }) => {
    const { useState, useEffect, useMemo, useRef } = React;
    const [query, setQuery] = useState('');
    const [debouncedQuery, setDebouncedQuery] = useState('');
    const [activeIndex, setActiveIndex] = useState(0);
    const [recentSearches, setRecentSearches] = useState([]);
    const [copiedId, setCopiedId] = useState(null);
    
    const inputRef = useRef(null);
    const resultsContainerRef = useRef(null);
    const activeItemRef = useRef(null);

    const localStripHtml = (html) => {
        if (!html) return '';
        try {
            const doc = new DOMParser().parseFromString(html, 'text/html');
            return doc.body.textContent || "";
        } catch (e) {
            return String(html).replace(/<[^>]*>?/gm, '').trim();
        }
    };

    const HighlightText = ({ text, highlight }) => {
        if (!text) return null;
        if (!highlight || !highlight.trim()) return <>{text}</>;
        const regex = new RegExp(`(${highlight})`, 'gi');
        const parts = text.split(regex);
        return (
            <>{parts.map((part, i) =>
                regex.test(part) ? (
                    <span key={i} className="text-zinc-900 dark:text-white font-bold bg-orange-500/20 px-0.5 rounded-sm">
                        {part}
                    </span>
                ) : <span key={i}>{part}</span>
            )}</>
        );
    };

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
            setQuery('');
            setDebouncedQuery('');
            setActiveIndex(0);
            setTimeout(() => inputRef.current?.focus(), 10);
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'unset';
        }
        return () => { document.body.style.overflow = 'unset'; };
    }, [isOpen]);

    useEffect(() => {
        if (activeItemRef.current && resultsContainerRef.current) {
            activeItemRef.current.scrollIntoView({
                behavior: 'auto', 
                block: 'nearest',
            });
        }
    }, [activeIndex]);

    const saveSearch = (q) => {
        if (!q.trim()) return;
        const updated = [q, ...recentSearches.filter(item => item !== q)].slice(0, 4);
        setRecentSearches(updated);
        localStorage.setItem('autogrid_recent_searches', JSON.stringify(updated));
    };

    const handleCopy = (e, text) => {
        e.stopPropagation();
        navigator.clipboard.writeText(text);
        setCopiedId(text);
        setTimeout(() => setCopiedId(null), 1000);
    };

    const results = useMemo(() => {
        const q = debouncedQuery.toLowerCase();
        const cleanedQuery = debouncedQuery.replace(/\s+/g, '').toUpperCase();
        
        const isRegNr = /^[A-Z]{3}\d{2}[A-Z0-9]$/.test(cleanedQuery);
        let externalLinks = [];
        if (isRegNr) {
            externalLinks = [
                { id: 'smart_search', icon: 'zap', title: `System Radar`, subtitle: `Snabb fordonsuppslag på ${cleanedQuery}`, type: 'os_radar_action', actionTarget: 'SMART_SEARCH', category: `Fordonsuppgifter` },
            ];
        }

        if (!debouncedQuery.trim()) {
            return [
                { id: 'NEW_JOB', icon: 'plus', title: 'Skapa nytt uppdrag', subtitle: 'Genväg', type: 'page', category: 'Snabba åtgärder', isQuickAction: true },
                { id: 'REFERENCE', icon: 'folder', title: 'Dokumenthantering', subtitle: 'Genväg', type: 'page', category: 'Snabba åtgärder', isQuickAction: true },
                { id: 'CALENDAR', icon: 'calendar', title: 'Öppna Kalendern', subtitle: 'Genväg', type: 'page', category: 'Snabba åtgärder', isQuickAction: true },
                { id: 'CUSTOMERS', icon: 'users', title: 'Sök i kunddatabasen', subtitle: 'Meny', type: 'page', category: 'Snabba åtgärder', isQuickAction: true }
            ];
        }

        const pages = [
            { id: 'DASHBOARD', icon: 'grid', title: 'Dashboard', subtitle: 'Genväg', category: 'Systemnavigering' },
            { id: 'GARAGE', icon: 'tool', title: 'Garage', subtitle: 'Genväg', category: 'Systemnavigering' },
        ].filter(p => p.title.toLowerCase().includes(q)).map(p => ({ ...p, type: 'page' }));

        const jobs = allJobs.filter(j => 
            (j.regnr && j.regnr.toLowerCase().includes(q)) || 
            (j.kundnamn && j.kundnamn.toLowerCase().includes(q)) ||
            (j.kommentar && j.kommentar.toLowerCase().includes(q))
        ).slice(0, 10).map(j => {
            const cleanComment = localStripHtml(j.kommentar);
            return {
                id: j.id, job: j, icon: 'car', 
                title: j.kundnamn || 'Inget Namn', 
                subtitle: j.regnr || 'Okänt', 
                snippet: cleanComment,
                type: 'job', category: 'Uppdrag & Kunder',
                copyText: j.regnr || j.kundnamn,
                status: j.status
            };
        });

        const inv = (allLagerItems || []).filter(i => 
            (i.name && String(i.name).toLowerCase().includes(q)) || 
            (i.service_filter && String(i.service_filter).toLowerCase().includes(q))
        ).slice(0, 3).map(i => ({
            id: `LAGER_ITEM_${i.id}`, targetPage: 'LAGER', icon: 'package', 
            title: String(i.name || 'Okänd Artikel'), 
            subtitle: `${i.price || 0} kr`, 
            type: 'page', category: 'Lager', 
            copyText: String(i.service_filter || i.name || '')
        }));

        return [...externalLinks, ...pages, ...jobs, ...inv];
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

        if (item.type === 'os_radar_action') {
            if (window.osSearchVehicle) window.osSearchVehicle(item.copyText, item.actionTarget);
        } else if (item.type === 'page') {
            const target = item.targetPage || item.id;
            navigateTo(target, target === 'NEW_JOB' ? { job: null } : null);
        } else if (item.type === 'job') {
            if (window.openVehicleProfile) window.openVehicleProfile(item.job.regnr, item.job.id);
            else navigateTo('NEW_JOB', { job: item.job });
        }
    };

    if (!isOpen) return null;

    let lastCategory = null;
    const quickActions = results.filter(r => r.isQuickAction);
    const standardResults = results.filter(r => !r.isQuickAction);

    // --- NYTT: FÄRGKODAD KOMPAKT BADGE ---
    const SpotlightBadge = ({ status }) => {
        const s = (status || 'BOKAD').toUpperCase();
        const config = {
            'BOKAD': { bg: 'bg-orange-50 dark:bg-orange-500/10', text: 'text-orange-600 dark:text-orange-400', border: 'border-orange-200 dark:border-orange-500/20', dot: 'bg-orange-500' },
            'OFFERERAD': { bg: 'bg-blue-50 dark:bg-blue-500/10', text: 'text-blue-600 dark:text-blue-400', border: 'border-blue-200 dark:border-blue-500/20', dot: 'bg-blue-500' },
            'KLAR': { bg: 'bg-emerald-50 dark:bg-emerald-500/10', text: 'text-emerald-600 dark:text-emerald-400', border: 'border-emerald-200 dark:border-emerald-500/20', dot: 'bg-emerald-500' },
            'FAKTURERAS': { bg: 'bg-zinc-100 dark:bg-white/10', text: 'text-zinc-500 dark:text-zinc-400', border: 'border-zinc-200 dark:border-white/10', dot: 'bg-zinc-400' },
        };
        const style = config[s] || config['BOKAD'];
        
        return (
            <span className={`h-5 px-2 text-[9px] font-bold uppercase tracking-widest inline-flex items-center gap-1.5 rounded-full border shrink-0 ${style.bg} ${style.text} ${style.border}`}>
                <span className={`w-1 h-1 rounded-full ${style.dot}`}></span>
                {s}
            </span>
        );
    };

    return (
        <div className="fixed inset-0 z-[9999] flex justify-center items-start sm:pt-[5vh] bg-zinc-900/10 dark:bg-black/40 backdrop-blur-sm">
            <div className="absolute inset-0" onClick={onClose}></div>
            
            <div className="relative w-full h-[100dvh] sm:h-auto sm:w-[650px] bg-white dark:bg-[#18181b] sm:rounded-2xl shadow-none sm:shadow-[0_20px_60px_-10px_rgba(0,0,0,0.15)] flex flex-col sm:border border-zinc-200 dark:border-white/10 overflow-hidden sm:ring-1 ring-black/5">
                
                <div className="flex items-center px-4 sm:px-5 py-3 sm:py-4 border-b border-zinc-100 dark:border-white/5 shrink-0 bg-white dark:bg-[#18181b] z-20">
                    <window.Icon name="search" size={20} strokeWidth={2} className="text-orange-500 shrink-0 mr-3" />
                    <input
                        ref={inputRef}
                        type="text"
                        value={query}
                        onChange={e => setQuery(e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder="Sök i systemet.."
                        className="w-full bg-transparent border-0 ring-0 outline-none text-lg sm:text-xl font-normal text-zinc-900 dark:text-white placeholder:text-zinc-300 dark:placeholder:text-zinc-600 appearance-none p-0"
                        autoComplete="off"
                        spellCheck="false"
                    />
                    {query && (
                        <button onClick={() => { setQuery(''); inputRef.current?.focus(); }} className="shrink-0 p-1.5 hover:bg-zinc-100 dark:hover:bg-white/10 rounded-md text-zinc-400 transition-colors ml-2">
                            <window.Icon name="x" size={16} />
                        </button>
                    )}
                    
                    <button onClick={onClose} className="sm:hidden shrink-0 ml-3 px-2 py-2 text-[10px] font-bold uppercase tracking-widest text-zinc-500">
                        Avbryt
                    </button>
                    <div className="hidden sm:flex shrink-0 items-center gap-1 ml-3 px-2 py-1 bg-zinc-50 dark:bg-white/5 rounded border border-zinc-200 dark:border-white/10">
                        <span className="text-[10px] font-bold text-zinc-400 uppercase">ESC</span>
                    </div>
                </div>

                <div ref={resultsContainerRef} className="flex-1 overflow-y-auto custom-scrollbar p-2 sm:max-h-[60vh]">
                    
                    {!debouncedQuery && recentSearches.length > 0 && (
                        <div className="px-3 mb-3 pt-2">
                            <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 block mb-2 px-1">Senaste Sökningar</span>
                            <div className="flex flex-wrap gap-2">
                                {recentSearches.map((sq, i) => (
                                    <button key={i} onClick={() => setQuery(sq)} className="px-3 py-1 bg-zinc-50 dark:bg-white/5 hover:bg-orange-50 text-[11px] font-medium text-zinc-600 dark:text-zinc-300 rounded-full border border-zinc-200 dark:border-white/10 flex items-center gap-1.5">
                                        <window.Icon name="clock" size={12} className="text-zinc-400" /> {sq}
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    {!debouncedQuery && quickActions.length > 0 && (
                        <div className="px-1">
                            <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 block mb-1 px-3 pt-2">Snabba Åtgärder</span>
                            <div className="flex flex-col">
                                {quickActions.map((item, index) => {
                                    const isActive = activeIndex === index;
                                    return (
                                        <div 
                                            key={item.id}
                                            ref={isActive ? activeItemRef : null}
                                            onMouseEnter={() => setActiveIndex(index)}
                                            onClick={() => executeAction(item)}
                                            className={`flex items-center gap-3 px-3 py-2.5 rounded-lg cursor-pointer transition-none active:bg-zinc-100 sm:hover:bg-zinc-50 dark:sm:hover:bg-white/5 ${isActive ? 'sm:bg-orange-50/50 dark:sm:bg-white/5' : 'bg-transparent'}`}
                                        >
                                            <div className={`w-8 h-8 flex items-center justify-center rounded-lg shrink-0 ${isActive ? 'sm:bg-orange-500 sm:text-white sm:border-transparent bg-zinc-100 dark:bg-white/5 text-zinc-500 border-transparent' : 'bg-zinc-100 dark:bg-white/5 text-zinc-500 border border-transparent'}`}>
                                                <window.Icon name={item.icon} size={16} strokeWidth={1.5} />
                                            </div>
                                            <div className="flex flex-col flex-1">
                                                <span className={`text-[13px] leading-none ${isActive ? 'sm:font-bold text-zinc-900 dark:text-white font-medium' : 'font-medium text-zinc-700 dark:text-zinc-300'}`}>{item.title}</span>
                                                <span className="text-[11px] text-zinc-400 mt-1">{item.subtitle}</span>
                                            </div>
                                            {isActive && (
                                                <div className="hidden sm:flex items-center gap-1.5 px-2 py-0.5 bg-orange-100 dark:bg-orange-500/20 text-orange-600 rounded text-[9px] font-bold uppercase">
                                                    Enter ↵
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}

                    {debouncedQuery && standardResults.length > 0 && standardResults.map((item, index) => {
                        const showCategory = item.category !== lastCategory;
                        lastCategory = item.category;
                        const isActive = activeIndex === index;

                        return (
                            <React.Fragment key={`${item.type}-${item.id}`}>
                                {showCategory && (
                                    <div className="px-3 pt-3 pb-1 text-[10px] font-bold uppercase tracking-widest text-zinc-400">
                                        {item.category}
                                    </div>
                                )}
                                <div 
                                    ref={isActive ? activeItemRef : null}
                                    onMouseEnter={() => setActiveIndex(index)}
                                    onClick={() => executeAction(item)}
                                    className={`flex flex-col px-3 py-2.5 rounded-lg cursor-pointer transition-none relative active:bg-zinc-100 dark:active:bg-white/5 sm:hover:bg-zinc-50 dark:sm:hover:bg-white/5 ${isActive ? 'sm:bg-orange-50/50 dark:sm:bg-white/5' : 'bg-transparent'}`}
                                >
                                    {isActive && <div className="hidden sm:block absolute left-0 top-3 bottom-3 w-1 bg-orange-500 rounded-r-full"></div>}

                                    <div className="flex items-start gap-3 w-full">
                                        
                                        <div className={`w-9 h-9 flex items-center justify-center rounded-lg shrink-0 mt-0.5 transition-colors ${isActive ? 'sm:bg-orange-500 sm:text-white sm:border-transparent bg-transparent border border-zinc-200 dark:border-white/10 text-zinc-500' : 'bg-transparent border border-zinc-200 dark:border-white/10 text-zinc-500'}`}>
                                            <window.Icon name={item.icon} size={16} strokeWidth={1.5} />
                                        </div>
                                        
                                        <div className="flex flex-col flex-1 min-w-0">
                                            
                                            <div className="flex items-center justify-between w-full gap-2">
                                                <span className={`text-[14px] leading-tight truncate ${isActive ? 'sm:text-orange-600 sm:font-bold text-zinc-900 dark:text-white font-bold' : 'text-zinc-800 dark:text-zinc-200 font-bold'}`}>
                                                    <HighlightText text={item.title} highlight={debouncedQuery} />
                                                </span>
                                                {/* IMPLEMENTATION AV FÄRGKODAD BADGE */}
                                                {item.type === 'job' && item.status && (
                                                    <div className="shrink-0">
                                                        <SpotlightBadge status={item.status} />
                                                    </div>
                                                )}
                                            </div>
                                            
                                            <div className="flex items-center gap-2 mt-1">
                                                {item.type === 'job' && <span className="font-mono bg-zinc-100 dark:bg-white/10 text-zinc-500 px-1.5 py-px rounded text-[10px] shrink-0">REG</span>}
                                                <span className="text-[12px] text-zinc-500 truncate">
                                                    <HighlightText text={item.subtitle} highlight={debouncedQuery} />
                                                </span>
                                            </div>

                                            {item.snippet && (
                                                <div className="mt-2 text-[12px] leading-snug text-zinc-500 italic border-l-2 border-zinc-200 sm:border-orange-200 dark:border-white/10 pl-2 line-clamp-2">
                                                    <HighlightText text={item.snippet} highlight={debouncedQuery} />
                                                </div>
                                            )}
                                        </div>
                                        
                                        <div className="hidden sm:flex items-center gap-1.5 shrink-0 self-start">
                                            {item.copyText && (
                                                <button 
                                                    onClick={(e) => handleCopy(e, item.copyText)} 
                                                    className={`w-7 h-7 flex items-center justify-center rounded border transition-colors ${isActive ? 'bg-white border-orange-200 text-orange-500' : 'bg-transparent border-transparent text-zinc-400 hover:text-zinc-600'}`}
                                                    title="Kopiera"
                                                >
                                                    {copiedId === item.copyText ? <window.Icon name="check" size={14} className="text-emerald-500" /> : <window.Icon name="copy" size={14} strokeWidth={1.5} />}
                                                </button>
                                            )}
                                            
                                            {isActive && (
                                                <div className="flex items-center gap-1 px-1.5 py-1 bg-orange-100 dark:bg-orange-500/20 text-orange-600 rounded text-[9px] font-bold uppercase">
                                                    Öppna ↵
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </React.Fragment>
                        );
                    })}

                    {debouncedQuery && standardResults.length === 0 && (
                        <div className="px-6 py-12 text-center flex flex-col items-center">
                            <window.Icon name="search-x" size={24} strokeWidth={1.5} className="text-zinc-300 mb-3" />
                            <p className="text-[14px] font-bold text-zinc-800 mb-1">Inga resultat för "{query}"</p>
                        </div>
                    )}
                </div>

                <div className="hidden sm:flex items-center justify-between px-5 py-2.5 bg-zinc-50 dark:bg-[#18181b] border-t border-zinc-100 dark:border-white/5 shrink-0">
                    <div className="flex items-center gap-3">
                        <span className="text-[10px] text-zinc-400 flex items-center gap-1.5">
                            <span className="px-1 border border-zinc-200 dark:border-white/10 rounded">↑</span>
                            <span className="px-1 border border-zinc-200 dark:border-white/10 rounded">↓</span>
                            Navigera
                        </span>
                        <span className="text-[10px] text-zinc-400 flex items-center gap-1.5">
                            <span className="px-1 border border-zinc-200 dark:border-white/10 rounded">↵</span>
                            Välj och öppna
                        </span>
                    </div>
                    <span className="text-[9px] font-bold tracking-widest text-zinc-400 uppercase flex items-center gap-1.5">
                        <window.Icon name="command" size={10} strokeWidth={2} /> AutoGrid Command
                    </span>
                </div>
            </div>
        </div>
    );
};
