// spotlight.js - Fristående modul för Spotlight Search (Cmd/Ctrl + K)

window.SpotlightSearch = ({ isOpen, onClose, allJobs, allNotes, allLagerItems, navigateTo }) => {
    const { useState, useEffect, useMemo, useRef } = React;
    const [query, setQuery] = useState('');
    const [debouncedQuery, setDebouncedQuery] = useState('');
    const [activeIndex, setActiveIndex] = useState(0);
    const [recentSearches, setRecentSearches] = useState([]);
    const [copiedId, setCopiedId] = useState(null);
    const inputRef = useRef(null);

    // Hjälpkomponent för markering av text (Sök-träffar)
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

    // Ladda senaste sökningar
    useEffect(() => {
        const saved = localStorage.getItem('bmg_recent_searches');
        if (saved) setRecentSearches(JSON.parse(saved));
    }, []);

    // Debounce för sökfältet
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
                // 1. Oljemagasinet (Öppnas som Popup + Kör Systemradar)
                { id: 'oljemagasinet', icon: 'droplet', title: `Hämta Oljevolym`, subtitle: `Hämta ny data via tillägg`, type: 'oljemagasinet_radar', url: `https://www.oljemagasinet.se/`, category: `Fordonsuppgifter: ${cleanedQuery}`, copyText: cleanedQuery },
                
                // 2. Car.info (Öppnas som Popup för tillägget)
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

        // 1 & 2. Osynlig Spök-Popup för Tillägg (Oljemagasinet & Car.info)
        if ((item.type === 'oljemagasinet_radar' || item.type === 'popup_link') && item.url) {
            
            // Starta systemradarn nere i hörnet direkt
            window.dispatchEvent(new CustomEvent('show-system-radar', { 
                detail: { regnr: item.copyText, waitForExtension: true } 
            }));

            // Tillbaka till originalet: 400x400 placerad nere i högra hörnet (9999)
            const radarWindow = window.open(
                item.url, 
                'VehicleRadarPopup', 
                'width=400,height=400,left=9999,top=9999'
            );
            
            // Sno tillbaka fokus så man kan fortsätta jobba ostört
            if (radarWindow) {
                radarWindow.blur();
                window.focus();
            }

            if (item.type === 'oljemagasinet_radar') {
                let pings = 0;
                const pingInterval = setInterval(() => {
                    if (radarWindow && !radarWindow.closed) {
                        radarWindow.postMessage({ action: 'START_OS_RADAR', regnr: item.copyText }, '*');
                    }
                    pings++;
                    if (pings > 20) clearInterval(pingInterval); 
                }, 500);
            }
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
            onClose();
            if (window.openVehicleProfile) {
                window.openVehicleProfile(item.job.regnr, item.job.id);
            } else {
                navigateTo('NEW_JOB', { job: item.job });
            }
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
