// app.js - Återskapad från backup, men slimmad (Radar och Spotlight utbrutna)

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
    const [isDark, setIsDark] = useState(() => localStorage.getItem('sys_theme') === 'dark');
    const [time, setTime] = useState(new Date());
    const [hasUnread, setHasUnread] = useState(false);
    const [isChatOpen, setIsChatOpen] = useState(false);
    const [isOnline, setIsOnline] = useState(navigator.onLine);
    const [isSpotlightOpen, setIsSpotlightOpen] = useState(false);
    const [globalVehicle, setGlobalVehicle] = useState(null);

    useEffect(() => {
        window.openVehicleProfile = (regnr, highlightId = null) => {
            setGlobalVehicle({ regnr, highlightId });
        };
    }, []);

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

        setGlobalVehicle(null);
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
                
                // NYTT: Stäng fordonsdatan när vi backar
                setGlobalVehicle(null);
            }
        };
        window.addEventListener('popstate', handlePopState);
        return () => window.removeEventListener('popstate', handlePopState);
    }, []);

    useEffect(() => {
        const syncWithUrl = () => {
            const hash = window.location.hash.replace('#', '').toUpperCase();
            const validViews = ['DASHBOARD', 'CALENDAR', 'NEW_JOB', 'CUSTOMERS', 'OIL_SUPPLY', 'CHAT', 'LAGER', 'GARAGE', 'REFERENCE'];
            if (hash && validViews.includes(hash)) {
                setView(hash);
                if (window.innerWidth < 1024) setSidebarOpen(false);
                
                // NYTT: Stäng fordonsdatan
                setGlobalVehicle(null);
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
            
            {/* Global Spotlight Render (Laddas in säkert om den finns) */}
            {window.SpotlightSearch && (
                <window.SpotlightSearch 
                    isOpen={isSpotlightOpen} 
                    onClose={() => setIsSpotlightOpen(false)} 
                    allJobs={allJobs} 
                    allNotes={allNotes} 
                    allLagerItems={allLagerItems} 
                    navigateTo={navigateTo} 
                />
            )}

            {/* Den Svävande Systemradarn (Laddas in säkert om den finns) */}
            {window.GlobalSystemRadar && (
                <window.GlobalSystemRadar isChatOpen={isChatOpen} />
            )}

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
                            { id: 'GARAGE', icon: 'droplet', label: 'Oil_Status' },
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

                    {isChatOpen && window.innerWidth >= 1024 && window.ChatView && (
                        <>
                            <div className="fixed inset-0 z-[490]" onClick={() => setIsChatOpen(false)}></div>
                            <div className="hidden lg:block fixed bottom-[104px] right-8 z-[500] w-[450px] h-[700px] max-h-[85vh] shadow-[0_20px_60px_rgba(0,0,0,0.3)] rounded-2xl overflow-hidden border border-zinc-200/80 dark:border-[#2a3441] bg-white dark:bg-[#121826] ring-1 ring-black/5 animate-in slide-in-from-bottom-4 fade-in duration-300">
                                <window.ChatView user={user} setView={navigateTo} viewParams={viewParams} isPopup={true} onClose={() => setIsChatOpen(false)} />
                            </div>
                        </>
                    )}

                    {/* DYNAMISK VY-CONTAINER */}
                    <div className={`flex-1 overflow-auto lg:p-8 space-y-6 pb-24 lg:pb-8 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none] ${['DASHBOARD', 'CALENDAR', 'NEW_JOB', 'CUSTOMERS', 'GARAGE', 'OIL_SUPPLY'].includes(view) ? 'p-0' : 'p-4'}`}>
                        {view === 'DASHBOARD' && window.DashboardView && (
                            <window.DashboardView 
                                allJobs={allJobs} filteredJobs={filteredJobs} setEditingJob={setEditingJob} setView={navigateTo} 
                                activeFilter={activeFilter} setActiveFilter={setActiveFilter} statusCounts={statusCounts}
                                globalSearch={globalSearch} setGlobalSearch={setGlobalSearch}
                            />
                        )}
                        {view === 'NEW_JOB' && window.NewJobView && <window.NewJobView editingJob={editingJob} setView={navigateTo} allJobs={allJobs} />}
                        {view === 'GARAGE' && window.GarageView && <window.GarageView allJobs={allJobs} setView={navigateTo} />}
                        {view === 'LAGER' && window.LagerView && <window.LagerView allJobs={allJobs} />} 
                        {view === 'CUSTOMERS' && window.CustomersView && <window.CustomersView allJobs={allJobs} setView={navigateTo} viewParams={viewParams} setEditingJob={setEditingJob} />}
                        {view === 'CALENDAR' && window.CalendarView && <window.CalendarView allJobs={allJobs} setEditingJob={setEditingJob} setView={navigateTo} />}
                        {view === 'OIL_SUPPLY' && window.SupplyView && <window.SupplyView allJobs={allJobs} setView={navigateTo} />}
                        {view === 'CHAT' && window.innerWidth < 1024 && window.ChatView && <window.ChatView user={user} setView={navigateTo} viewParams={viewParams} />}
                        {view === 'REFERENCE' && window.ReferenceView && <window.ReferenceView setView={navigateTo} />}
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

                    {/* GLOBAL MODUL: Fordonsakt / Sidofält */}
                    {globalVehicle && window.VehicleProfileLoader && (
                        <window.VehicleProfileLoader
                            regnr={globalVehicle.regnr}
                            highlightId={globalVehicle.highlightId}
                            onClose={() => setGlobalVehicle(null)}
                            setView={navigateTo}
                        />
                    )}
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
