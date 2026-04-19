// app.js - AutoGrid Edition (Beta/Premium UX)

const { useState, useEffect, useMemo, useRef, useCallback, memo } = React;

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
window.Icon = memo(({ name, size = 18, className = "" }) => (
    <span className={`inline-flex items-center justify-center ${className}`} style={{ width: size, height: size }}>
        <i data-lucide={name} style={{ width: '100%', height: '100%' }}></i>
    </span>
));

const HexLogo = memo(({ className = "", iconColor = "fill-zinc-900 dark:fill-white" }) => (
    <svg viewBox="0 0 100 100" className={`drop-shadow-[0_0_15px_rgba(249,115,22,0.4)] ${className}`}>
        <polygon points="50,5 90,27 90,73 50,95 10,73 10,27" fill="none" stroke="#f97316" strokeWidth="3" opacity="0.6"/>
        <polygon points="50,12 83,31 83,69 50,88 17,69 17,31" fill="none" stroke="#f97316" strokeWidth="1" opacity="0.3"/>
        <path d="M50 25 L28 75 L40 75 L50 50 L60 75 L72 75 Z" className={`${iconColor} transition-colors duration-300`} />
        <path d="M35 60 L65 60" stroke="#f97316" strokeWidth="5" strokeLinecap="round" />
    </svg>
));

const SplashScreen = memo(() => (
    <div className="fixed inset-0 bg-zinc-50 dark:bg-zinc-950 flex items-center justify-center z-[9999] animate-out fade-out zoom-out-95 duration-700 delay-1000 fill-mode-forwards pointer-events-none transition-colors duration-300">
        <div className="flex flex-col items-center">
            <div className="w-24 h-24 flex items-center justify-center mb-6 animate-[pulse_2s_ease-in-out_infinite]">
                <HexLogo className="w-20 h-20" />
            </div>
            <h1 className="text-zinc-900 dark:text-white font-black uppercase tracking-[0.25em] text-lg flex items-center">
                AUTO<span className="text-orange-500 font-light">GRID</span>
            </h1>
            <div className="mt-8 w-40 h-1 bg-black/10 dark:bg-white/5 rounded-full overflow-hidden relative">
                <div className="absolute inset-y-0 left-0 bg-gradient-to-r from-orange-600 to-orange-400 animate-[loading_1.5s_ease-in-out_infinite] w-1/2 rounded-full"></div>
            </div>
            <p className="mt-4 text-[8px] font-black text-zinc-500 uppercase tracking-widest animate-pulse">Initializing_Core_Systems...</p>
        </div>
    </div>
));

// Fast Navigations-data för att undvika re-renders
const NAV_ITEMS = [
    { id: 'DASHBOARD', icon: 'grid', label: 'Dashboard' },
    { id: 'CALENDAR', icon: 'calendar', label: 'Kalender' },
    { id: 'NEW_JOB', icon: 'plus-square', label: 'Nytt_Jobb' },
    { id: 'LAGER', icon: 'package', label: 'Lager' },
    { id: 'CUSTOMERS', icon: 'users', label: 'Kund_Databas' },
    { id: 'OIL_SUPPLY', icon: 'droplet', label: 'Oil_Status' },
    { id: 'REFERENCE', icon: 'file-text', label: 'Dokument' },
    { id: 'STATISTICS', icon: 'bar-chart-2', label: 'Statistik' },
    { id: 'CHAT', icon: 'message-square', label: 'System_Chat' }
];

// --- 3. HUVUDAPPLIKATION (App) ---
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
    const [isDark, setIsDark] = useState(() => localStorage.getItem('sys_theme') !== 'light'); 
    const [isNightLight, setIsNightLight] = useState(() => localStorage.getItem('sys_nightlight') === 'true');
    const [time, setTime] = useState(new Date());
    const [hasUnread, setHasUnread] = useState(false);
    const [isChatOpen, setIsChatOpen] = useState(false);
    const [isOnline, setIsOnline] = useState(navigator.onLine);
    const [isSpotlightOpen, setIsSpotlightOpen] = useState(false);
    const [globalVehicle, setGlobalVehicle] = useState(null);

    useEffect(() => {
        localStorage.setItem('sys_nightlight', isNightLight);
    }, [isNightLight]);

    // AUTOMATISK UTLOGGNING
    useEffect(() => {
        if (!user) return;
        let timeoutId;
        const INACTIVITY_LIMIT = 15 * 60 * 1000; // 15 min
        
        const resetTimer = () => {
            clearTimeout(timeoutId);
            timeoutId = setTimeout(() => {
                auth.signOut();
                console.log("Automatiskt utloggad pga inaktivitet.");
            }, INACTIVITY_LIMIT);
        };

        const events = ['mousedown', 'mousemove', 'keydown', 'scroll', 'touchstart', 'click'];
        events.forEach(event => document.addEventListener(event, resetTimer, { passive: true }));
        resetTimer();

        return () => {
            clearTimeout(timeoutId);
            events.forEach(event => document.removeEventListener(event, resetTimer));
        };
    }, [user]);

    useEffect(() => {
        window.openVehicleProfile = (regnr, highlightId = null) => setGlobalVehicle({ regnr, highlightId });
    }, []);

    const triggerHaptic = useCallback(() => {
        if (window.navigator && window.navigator.vibrate) window.navigator.vibrate(12);
    }, []);

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

    // CSS INJECTION & THEME
    useEffect(() => {
        const root = document.documentElement;
        root.style.setProperty('--brand-primary', '#f97316');

        if (isDark) {
            root.classList.add('dark');
            localStorage.setItem('sys_theme', 'dark');
            document.body.style.background = '#09090b';
        } else {
            root.classList.remove('dark');
            localStorage.setItem('sys_theme', 'light');
            document.body.style.background = '#fafafa'; 
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
            @keyframes loading { 0% { transform: translateX(-100%); } 100% { transform: translateX(200%); } }
            input::-webkit-outer-spin-button, input::-webkit-inner-spin-button { -webkit-appearance: none; margin: 0; }
            input[type=number] { -moz-appearance: textfield; }
            input:focus, select:focus, textarea:focus { outline: none !important; box-shadow: none !important; }
            
            /* Snygga Custom Scrollbars */
            ::-webkit-scrollbar { width: 6px; height: 6px; }
            ::-webkit-scrollbar-track { background: transparent; }
            ::-webkit-scrollbar-thumb { background: rgba(156, 163, 175, 0.3); border-radius: 10px; }
            .dark ::-webkit-scrollbar-thumb { background: rgba(255, 255, 255, 0.1); }
            ::-webkit-scrollbar-thumb:hover { background: rgba(249, 115, 22, 0.5); }
            
            .mobile-nav-btn { display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 3px; flex: 1; height: 100%; transition: all 0.2s; border: none; background: transparent; }
            .mobile-nav-label { font-size: 8px; font-weight: 900; text-transform: uppercase; letter-spacing: 0.1em; transition: color 0.3s; }
        `;
    }, [isDark]);

    // DATA FETCHING
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

    const navigateTo = useCallback((newView, params = null) => {
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
        setGlobalVehicle(null);
        
        // Auto-scroll till toppen vid vy-byte
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }, [view, triggerHaptic]);

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
                setGlobalVehicle(null);
            }
        };
        window.addEventListener('popstate', handlePopState);
        return () => window.removeEventListener('popstate', handlePopState);
    }, []);

    useEffect(() => {
        const syncWithUrl = () => {
            const hash = window.location.hash.replace('#', '').toUpperCase();
            const validViews = ['DASHBOARD', 'STATISTICS', 'CALENDAR', 'NEW_JOB', 'CUSTOMERS', 'OIL_SUPPLY', 'CHAT', 'LAGER', 'GARAGE', 'REFERENCE'];
            if (hash && validViews.includes(hash)) {
                setView(hash);
                if (window.innerWidth < 1024) setSidebarOpen(false);
                setGlobalVehicle(null);
            }
        };
        syncWithUrl();
        window.addEventListener('hashchange', syncWithUrl);
        return () => window.removeEventListener('hashchange', syncWithUrl);
    }, []);

    useEffect(() => { window.openEditModal = (jobId) => { const job = allJobs.find(j => j.id === jobId); if (job) navigateTo('NEW_JOB', { job: job }); }; }, [allJobs, navigateTo]);
    
    useEffect(() => { 
        const timer = setInterval(() => setTime(new Date()), 1000); 
        setAppReady(true); 
        return () => clearInterval(timer); 
    }, []);
    
    // Säkerställ att ikoner laddas, med en liten delay som fallback
    useEffect(() => { 
        if (window.lucide) {
            window.lucide.createIcons();
            setTimeout(() => window.lucide.createIcons(), 100);
        }
    }, [view, allJobs, sidebarOpen, activeFilter, isDark, isSpotlightOpen, allNotes, appReady]);

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
            
            {/* OFFLINE BANNER */}
            {!isOnline && (
                <div className="fixed top-4 left-1/2 -translate-x-1/2 z-[9999] bg-red-500/95 text-white px-5 py-2.5 rounded-full text-[11px] font-bold tracking-widest uppercase backdrop-blur-md flex items-center gap-2 shadow-[0_10px_30px_rgba(239,68,68,0.4)] animate-in slide-in-from-top-4 fade-in duration-300">
                    <window.Icon name="wifi-off" size={14} /> System Offline
                </div>
            )}

            {window.SpotlightSearch && (
                <window.SpotlightSearch isOpen={isSpotlightOpen} onClose={() => setIsSpotlightOpen(false)} allJobs={allJobs} allNotes={allNotes} allLagerItems={allLagerItems} navigateTo={navigateTo} />
            )}
            {/* Svävande Systemradarn */}
            {window.GlobalSystemRadar && (
                <window.GlobalSystemRadar isChatOpen={isChatOpen} navigateTo={navigateTo} />
            )}

            {/* === NYTT: NATTLJUS-FILTER === */}
            <div 
                className={`fixed inset-0 pointer-events-none z-[9999] transition-opacity duration-1000 mix-blend-multiply ${isNightLight && !isDark ? 'opacity-100' : 'opacity-0'}`}
                style={{ backgroundColor: '#ffb04f', opacity: isNightLight && !isDark ? 0.15 : 0 }} 
            ></div>
            {/* ============================= */}

            <div className="flex h-screen overflow-hidden bg-zinc-50 dark:bg-[#0f1522] relative transition-colors duration-300">
                
                {/* DYNAMISK SIDEBAR */}
                {/* DYNAMISK SIDEBAR (Alltid mörk, oavsett tema) */}
                {/* DYNAMISK SIDEBAR (Låst till Alltid Mörk) */}
                <aside className={`fixed lg:relative h-full z-[200] transition-all duration-300 ease-in-out ${sidebarOpen ? 'translate-x-0 w-[280px]' : '-translate-x-full lg:translate-x-0 lg:w-20'} bg-[#0b0f19] text-white border-r border-white/5 flex flex-col shadow-2xl lg:shadow-none select-none group/sidebar`}>
                    
                    <div className={`h-20 flex items-center ${sidebarOpen ? 'justify-between px-6' : 'justify-center'} border-b border-white/5 overflow-hidden shrink-0`}>
                        <div className="flex items-center gap-3.5">
                            {/* Klickbar logga som öppnar/stänger sidebaren */}
                            <div 
                                onClick={() => { triggerHaptic(); setSidebarOpen(!sidebarOpen); }} 
                                className="cursor-pointer shrink-0 relative flex items-center justify-center group/logo"
                                title={sidebarOpen ? "Fäll in meny" : "Fäll ut meny"}
                            >
                                {/* Använder iconColor="fill-white" så A:et ALDRIG blir svart */}
                                <HexLogo 
                                    className={`transition-all duration-300 group-hover/logo:scale-110 drop-shadow-[0_0_12px_rgba(249,115,22,0.4)] group-hover/logo:drop-shadow-[0_0_20px_rgba(249,115,22,0.8)] ${sidebarOpen ? 'w-8 h-8' : 'w-10 h-10'}`} 
                                    iconColor="fill-white" 
                                />
                            </div>
                            
                            {sidebarOpen && (
                                <span className="font-black tracking-[0.2em] text-[14px] uppercase whitespace-nowrap flex items-center text-white animate-in fade-in duration-300 mt-[2px] cursor-pointer" onClick={() => navigateTo('DASHBOARD')}>
                                    AUTO<span className="text-orange-500 font-light">GRID</span>
                                </span>
                            )}
                        </div>
                        
                        {sidebarOpen && (
                            <button 
                                onClick={() => { triggerHaptic(); setSidebarOpen(false); }} 
                                className="hidden lg:flex w-7 h-7 items-center justify-center rounded-md text-zinc-500 hover:text-white hover:bg-white/10 transition-all"
                            >
                                <window.Icon name="chevron-left" size={18} />
                            </button>
                        )}
                    </div>
                    
                    <nav className="flex-1 py-6 space-y-1 overflow-y-auto custom-scrollbar">
                        {NAV_ITEMS.map(item => {
                            const isActive = view === item.id;
                            return (
                                <div key={item.id} 
                                    onClick={() => navigateTo(item.id, item.id === 'NEW_JOB' ? { job: null } : null)} 
                                    // Hover-färgerna är nu låsta till hover:bg-white/[0.05] och hover:text-white
                                    className={`flex items-center px-6 py-4 cursor-pointer transition-all duration-300 group relative ${item.id === 'CHAT' ? 'lg:hidden' : ''} ${isActive ? 'bg-orange-500/10 text-orange-500' : 'text-zinc-500 hover:text-white hover:bg-white/[0.05]'}`}>                                
                                    
                                    {isActive && <div className="absolute left-0 top-0 bottom-0 w-1 bg-orange-500 rounded-r-full shadow-[0_0_8px_rgba(249,115,22,0.5)] animate-in fade-in duration-300"></div>}

                                    <div className={`relative flex items-center justify-center transition-transform duration-300 ${isActive ? '' : 'group-hover:translate-x-1'}`}>
                                        <window.Icon name={item.icon} size={18} />
                                        {item.id === 'CHAT' && hasUnread && (
                                            <span className="absolute -top-1 -right-1 flex h-2.5 w-2.5 z-[999]">
                                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-orange-400 opacity-75"></span>
                                                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-orange-500 border border-[#0d0d0e]"></span>
                                            </span>
                                        )}
                                    </div>
                                    {sidebarOpen && <span className={`ml-4 text-[12px] font-medium transition-transform duration-300 ${isActive ? '' : 'group-hover:translate-x-1'}`}>{item.label.replace('_', ' ')}</span>}
                                </div>
                            );
                        })}
                    </nav>

                    <div className="mt-auto border-t border-white/5 bg-black/20 pb-20 lg:pb-0 transition-colors duration-300">
    
                        {/* NYTT: Nattljus-knapp (Visas endast i ljust tema) */}
                        {!isDark && (
                            <button onClick={() => { triggerHaptic(); setIsNightLight(!isNightLight); }} className={`w-full flex items-center ${sidebarOpen ? 'justify-start px-6' : 'justify-center'} py-3.5 text-zinc-500 hover:text-white transition-colors border-b border-white/5 gap-4 group`}>
                                <div className="relative w-5 h-5 flex items-center justify-center">
                                    <window.Icon name="eye" size={16} className={`transition-colors duration-500 ${isNightLight ? "text-orange-400" : "text-zinc-400 group-hover:text-white"}`} />
                                </div>
                                {sidebarOpen && <span className="text-[10px] font-black uppercase tracking-widest">{isNightLight ? 'Nattljus PÅ' : 'Nattljus AV'}</span>}
                            </button>
                        )}

                        {/* Tightare padding: py-3.5 istället för py-5, lite mindre ikoner */}
                        <button onClick={() => setIsDark(!isDark)} className={`w-full flex items-center ${sidebarOpen ? 'justify-start px-6' : 'justify-center'} py-3.5 text-zinc-500 hover:text-white transition-colors border-b border-white/5 gap-4 group`}>
                            <div className="relative w-5 h-5 flex items-center justify-center">
                                <window.Icon name={isDark ? "sun" : "moon"} size={16} className={`absolute transition-all duration-500 ${isDark ? "text-orange-500 rotate-0 opacity-100 scale-100" : "-rotate-90 opacity-0 scale-50"}`} />
                                <window.Icon name={isDark ? "sun" : "moon"} size={16} className={`absolute transition-all duration-500 ${!isDark ? "text-zinc-400 rotate-0 opacity-100 scale-100 group-hover:text-white" : "rotate-90 opacity-0 scale-50"}`} />
                            </div>
                            {sidebarOpen && <span className="text-[10px] font-black uppercase tracking-widest">{isDark ? 'Light Mode' : 'Dark Mode'}</span>}
                        </button>

                        <div className={`flex items-center ${sidebarOpen ? 'justify-between px-6' : 'justify-center'} py-3.5 gap-3 group/profile cursor-pointer`}>
                            <div className="flex items-center gap-3 min-w-0">
                                {/* Profilikon låst till mörk tema färg */}
                                <div className="min-w-[32px] w-8 h-8 bg-zinc-800 flex items-center justify-center font-black rounded-lg text-white shadow-sm uppercase text-[12px] transition-transform duration-300 group-hover/profile:scale-105">
                                    {user?.email ? user.email[0] : 'U'}
                                </div>
                                {sidebarOpen && (
                                    <div className="flex flex-col min-w-0">
                                        <span className="text-[10px] font-black uppercase tracking-widest text-white truncate transition-colors">{user?.displayName || 'Operator'}</span>
                                        <span className="text-[7px] text-zinc-500 truncate font-mono uppercase tracking-tighter">{user?.email}</span>
                                    </div>
                                )}
                            </div>
                            {sidebarOpen && (
                                <button onClick={() => { triggerHaptic(); auth.signOut(); }} className="p-2 text-red-500 hover:bg-red-500/10 rounded-lg transition-all group/logout shrink-0 z-10" title="Logga ut">
                                    <window.Icon name="log-out" size={16} className="group-hover/logout:translate-x-0.5 transition-transform" />
                                </button>
                            )}
                        </div>
                    </div>
                </aside>

                {sidebarOpen && window.innerWidth < 1024 && (
                    <div onClick={() => { triggerHaptic(); setSidebarOpen(false); }} className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[190] lg:hidden animate-in fade-in duration-300"></div>
                )}

                <main className="flex-1 flex flex-col min-w-0 overflow-hidden relative">
                    
                    {/* Svävande Chattbubbla */}
                    <button 
                        onClick={() => setIsChatOpen(!isChatOpen)} 
                        className={`hidden lg:flex fixed bottom-8 right-8 w-16 h-16 rounded-full items-center justify-center transition-all duration-300 z-[600] animate-in zoom-in-50 duration-500 ${isChatOpen ? 'bg-zinc-800 text-white hover:scale-105 shadow-lg' : hasUnread ? 'bg-orange-500 text-white hover:scale-110 shadow-[0_0_20px_rgba(249,115,22,0.6)] animate-[pulse_2s_infinite]' : 'bg-orange-500 text-black hover:scale-110 active:scale-95 shadow-[0_10px_30px_rgba(249,115,22,0.4)]'}`}
                    >
                        <window.Icon name={isChatOpen ? "x" : "message-square"} size={24} />
                        {hasUnread && !isChatOpen && (
                            <span className="absolute top-0 right-0 flex h-4 w-4">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-4 w-4 bg-red-500 border-2 border-orange-500 shadow-sm"></span>
                            </span>
                        )}
                    </button>

                    {isChatOpen && window.innerWidth >= 1024 && window.ChatView && (
                        <>
                            <div className="fixed inset-0 z-[490]" onClick={() => setIsChatOpen(false)}></div>
                            <div className="hidden lg:block fixed bottom-[104px] right-8 z-[500] w-[450px] h-[700px] max-h-[85vh] shadow-[0_20px_60px_rgba(0,0,0,0.3)] rounded-2xl overflow-hidden border border-zinc-200/80 dark:border-[#2a3441] bg-white dark:bg-[#121826] ring-1 ring-black/5 animate-in slide-in-from-bottom-8 fade-in duration-300">
                                <window.ChatView user={user} setView={navigateTo} viewParams={viewParams} isPopup={true} onClose={() => setIsChatOpen(false)} />
                            </div>
                        </>
                    )}

                    <div className={`flex-1 overflow-auto lg:p-8 space-y-6 pb-24 lg:pb-8 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none] ${['DASHBOARD', 'CALENDAR', 'NEW_JOB', 'CUSTOMERS', 'GARAGE', 'OIL_SUPPLY'].includes(view) ? 'p-0' : 'p-4'}`}>
                        {view === 'DASHBOARD' && window.DashboardView && <window.DashboardView allJobs={allJobs} filteredJobs={filteredJobs} setEditingJob={setEditingJob} setView={navigateTo} activeFilter={activeFilter} setActiveFilter={setActiveFilter} statusCounts={statusCounts} globalSearch={globalSearch} setGlobalSearch={setGlobalSearch} />}
                        {view === 'NEW_JOB' && window.NewJobView && <window.NewJobView editingJob={editingJob} setView={navigateTo} allJobs={allJobs} />}
                        {view === 'GARAGE' && window.GarageView && <window.GarageView allJobs={allJobs} setView={navigateTo} />}
                        {view === 'LAGER' && window.LagerView && <window.LagerView allJobs={allJobs} />} 
                        {view === 'CUSTOMERS' && window.CustomersView && <window.CustomersView allJobs={allJobs} setView={navigateTo} viewParams={viewParams} setEditingJob={setEditingJob} />}
                        {view === 'CALENDAR' && window.CalendarView && <window.CalendarView allJobs={allJobs} setEditingJob={setEditingJob} setView={navigateTo} />}
                        {view === 'OIL_SUPPLY' && window.SupplyView && <window.SupplyView allJobs={allJobs} setView={navigateTo} />}
                        {view === 'CHAT' && window.innerWidth < 1024 && window.ChatView && <window.ChatView user={user} setView={navigateTo} viewParams={viewParams} />}
                        {view === 'STATISTICS' && window.StatisticsView && <window.StatisticsView allJobs={allJobs} />}
                        {view === 'REFERENCE' && window.ReferenceView && <window.ReferenceView setView={navigateTo} />}
                    </div>

                    {/* Mobila Bottenmenyn (Förfinad Glassmorphism) */}
                    <div className="lg:hidden fixed bottom-0 left-0 right-0 h-16 bg-[#0b0f19]/95 border-t border-white/5 flex items-center justify-around z-[210] px-1 pb-safe backdrop-blur-2xl shadow-[0_-10px_20px_rgba(0,0,0,0.3)] select-none">
                        {[
                            { id: 'DASHBOARD', icon: 'grid', label: 'Status' },
                            { id: 'CALENDAR', icon: 'calendar', label: 'Plan' },
                            { id: 'NEW_JOB', icon: 'plus-square', label: 'Nytt', param: { job: null } },
                            { id: 'CHAT', icon: 'message-square', label: 'Chatt', hasBadge: hasUnread },
                        ].map(item => {
                            const isActive = view === item.id && !sidebarOpen;
                            return (
                                <button key={item.id} onClick={() => { triggerHaptic(); navigateTo(item.id, item.param); }} className={`mobile-nav-btn relative ${isActive ? 'text-orange-500' : 'text-zinc-500 hover:text-zinc-300'}`}>
                                    <div className="relative inline-flex items-center justify-center p-1 mb-0.5">
                                        <window.Icon name={item.icon} size={20} className={isActive ? 'scale-110 transition-transform duration-300' : 'transition-transform duration-300'} />
                                        {item.hasBadge && (
                                            <span className="absolute -top-1 -right-1 flex h-3 w-3 z-[999]">
                                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-orange-400 opacity-75"></span>
                                                {/* Badge-border är nu mörk för att matcha */}
                                                <span className="relative inline-flex rounded-full h-3 w-3 bg-orange-500 border-2 border-[#0b0f19] shadow-sm"></span>
                                            </span>
                                        )}
                                    </div>
                                    <span className="mobile-nav-label">{item.label}</span>
                                    {isActive && <span className="absolute bottom-1 w-1 h-1 bg-orange-500 rounded-full animate-in fade-in duration-300"></span>}
                                </button>
                            );
                        })}
                        
                        <button onClick={() => { triggerHaptic(); setSidebarOpen(!sidebarOpen); }} className={`mobile-nav-btn relative ${sidebarOpen ? 'text-orange-500' : 'text-zinc-500 hover:text-zinc-300'}`}>
                            <div className="relative inline-flex items-center justify-center p-1 mb-0.5">
                                <window.Icon name={sidebarOpen ? "x" : "more-horizontal"} size={20} className={sidebarOpen ? 'scale-110 transition-transform duration-300' : 'transition-transform duration-300'} />
                            </div>
                            <span className="mobile-nav-label">{sidebarOpen ? "Stäng" : "Mer"}</span>
                            {sidebarOpen && <span className="absolute bottom-1 w-1 h-1 bg-orange-500 rounded-full animate-in fade-in duration-300"></span>}
                        </button>
                    </div>

                    {globalVehicle && window.VehicleProfileLoader && (
                        <window.VehicleProfileLoader regnr={globalVehicle.regnr} highlightId={globalVehicle.highlightId} onClose={() => setGlobalVehicle(null)} setView={navigateTo} />
                    )}
                </main>
            </div>
        </>
    );
};

// --- 4. DYNAMISK INLOGGNINGSSKÄRM ---
const LoginScreen = memo(() => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const emailRef = useRef(null);

    // Auto-fokus på e-post när skärmen laddas
    useEffect(() => {
        if (emailRef.current) {
            emailRef.current.focus();
        }
    }, []);

    useEffect(() => {
        if (window.lucide) window.lucide.createIcons();
    }, [showPassword, error]);

    const handleLogin = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        setError('');
        try {
            await auth.signInWithEmailAndPassword(email, password);
        } catch (err) {
            setError('Åtkomst nekad. Kontrollera dina uppgifter.');
            setIsLoading(false);
            if (emailRef.current) emailRef.current.focus();
        }
    };

    return (
        <div className="fixed inset-0 bg-[#06080a] flex items-center justify-center z-[300] overflow-hidden selection:bg-orange-500 selection:text-black font-sans animate-in fade-in duration-700 transition-colors duration-300">
            
            <style dangerouslySetInnerHTML={{__html: `
                input:-webkit-autofill,
                input:-webkit-autofill:hover, 
                input:-webkit-autofill:focus, 
                input:-webkit-autofill:active {
                    -webkit-box-shadow: 0 0 0 30px #0f131c inset !important;
                    -webkit-text-fill-color: white !important;
                    transition: background-color 5000s ease-in-out 0s;
                }
            `}} />

            {/* Dynamiska Bakgrundseffekter (Pulsar extremt långsamt för Premium-feel) */}
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,_#161c29_0%,_#06080a_70%)] pointer-events-none transition-colors duration-500"></div>
            <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[120%] aspect-square sm:w-[600px] sm:h-[600px] bg-orange-500/10 rounded-full blur-[100px] pointer-events-none animate-[pulse_10s_ease-in-out_infinite]"></div>

            <div className="relative w-full max-w-[400px] mx-5 sm:mx-0 bg-[#0b0e14]/70 backdrop-blur-2xl border border-white/[0.08] shadow-[0_40px_100px_rgba(0,0,0,0.8),inset_0_1px_0_rgba(255,255,255,0.1)] rounded-[32px] sm:rounded-[40px] z-10 overflow-hidden group transition-colors duration-300">
                
                <div className="absolute top-0 left-0 right-0 h-[1.5px] bg-gradient-to-r from-transparent via-orange-500/60 to-transparent group-hover:via-orange-500 transition-all duration-700"></div>

                <div className="p-8 sm:p-12">
                    
                    <div className="flex flex-col items-center mb-10">
                        <div className="w-20 h-20 bg-gradient-to-b from-[#1a1f2e] to-[#0a0d14] flex items-center justify-center rounded-[24px] shadow-[0_15px_40px_rgba(0,0,0,0.5),inset_0_1px_0_rgba(255,255,255,0.1)] mb-6 ring-1 ring-white/10 relative overflow-hidden group-hover:shadow-[0_15px_40px_rgba(249,115,22,0.2)] transition-all duration-500">
                            <HexLogo className="w-12 h-12 relative z-10" iconColor="fill-white" />
                            <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/5 to-transparent translate-y-full group-hover:-translate-y-full transition-transform duration-1000"></div>
                        </div>
                        
                        <h1 className="text-white font-black uppercase tracking-[0.25em] text-xl flex items-center transition-colors">
                            AUTO<span className="text-orange-500 font-light">GRID</span>
                        </h1>
                        <p className="text-zinc-500 text-[9px] font-bold tracking-[0.3em] uppercase mt-2">Secure Access</p>
                    </div>

                    <form onSubmit={handleLogin} className="space-y-5">
                        {error && (
                            <div className="p-4 bg-red-900/20 border border-red-500/30 rounded-2xl text-red-400 text-[13px] font-medium flex items-center gap-3 animate-in slide-in-from-top-2">
                                <window.Icon name="alert-octagon" size={20} className="shrink-0 text-red-500" />
                                <span>{error}</span>
                            </div>
                        )}

                        <div className="space-y-2">
                            <label htmlFor="emailInput" className="text-[10px] font-black text-zinc-500 uppercase tracking-widest pl-2">
                                E-postadress
                            </label>
                            <div className="relative group/input">
                                <div className="absolute inset-y-0 left-0 flex items-center pl-4 pointer-events-none text-zinc-500 group-focus-within/input:text-orange-500 transition-colors">
                                    <window.Icon name="mail" size={18} />
                                </div>
                                <input 
                                    id="emailInput"
                                    ref={emailRef}
                                    type="email" 
                                    placeholder="namn@foretag.se" 
                                    required
                                    className="w-full h-14 bg-white/5 border border-white/10 rounded-2xl pl-12 text-white text-[15px] outline-none focus:border-orange-500/50 focus:bg-white/10 focus:ring-4 focus:ring-orange-500/10 transition-all placeholder:text-zinc-600 disabled:opacity-50" 
                                    value={email} 
                                    onChange={e => setEmail(e.target.value)} 
                                    disabled={isLoading}
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label htmlFor="passwordInput" className="text-[10px] font-black text-zinc-500 uppercase tracking-widest pl-2">
                                Lösenord
                            </label>
                            <div className="relative group/input">
                                <div className="absolute inset-y-0 left-0 flex items-center pl-4 pointer-events-none text-zinc-500 group-focus-within/input:text-orange-500 transition-colors">
                                    <window.Icon name="lock" size={18} />
                                </div>
                                <input 
                                    id="passwordInput"
                                    type={showPassword ? "text" : "password"} 
                                    placeholder="••••••••" 
                                    required
                                    className="w-full h-14 bg-white/5 border border-white/10 rounded-2xl pl-12 pr-12 text-white text-[15px] outline-none focus:border-orange-500/50 focus:bg-white/10 focus:ring-4 focus:ring-orange-500/10 transition-all placeholder:text-zinc-600 disabled:opacity-50 tracking-widest font-mono" 
                                    value={password} 
                                    onChange={e => setPassword(e.target.value)} 
                                    disabled={isLoading}
                                />
                                <button 
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute inset-y-0 right-0 flex items-center pr-4 text-zinc-500 hover:text-white transition-colors focus:outline-none disabled:opacity-50"
                                    tabIndex="-1"
                                    disabled={isLoading}
                                >
                                    <window.Icon name={showPassword ? "eye-off" : "eye"} size={18} />
                                </button>
                            </div>
                        </div>

                        <button 
                            type="submit" 
                            disabled={isLoading}
                            className="w-full h-14 mt-8 relative overflow-hidden group/btn bg-gradient-to-r from-orange-500 via-orange-500 to-orange-600 disabled:opacity-70 disabled:cursor-not-allowed text-black font-black rounded-2xl text-[14px] tracking-[0.15em] uppercase transition-all hover:scale-[1.02] shadow-[0_10px_30px_rgba(249,115,22,0.3)] hover:shadow-[0_15px_40px_rgba(249,115,22,0.5)] active:scale-[0.98] flex items-center justify-center gap-3"
                        >
                            {isLoading ? (
                                <>
                                    <window.Icon name="loader-2" size={20} className="animate-spin text-black/80" />
                                    <span>Verifierar...</span>
                                </>
                            ) : (
                                <>
                                    <span>Logga in</span>
                                    <window.Icon name="arrow-right" size={18} className="opacity-80 group-hover/btn:translate-x-1.5 transition-transform" />
                                </>
                            )}
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
});

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(<App />);
