// app.js - Refaktorerad och slimmad version

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
                <button type="submit" className="w-full bg-[#f97316] text-black font-black py-4 text-[10px] hover:bg-orange-500 transition-all uppercase tracking-widest mt-4">Initialize Sequence</button>
            </form>
        </div>
    );
};

// --- 3. HUVUDAPPLIKATIONEN ---
const App = () => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [view, setView] = useState('DASHBOARD');
    const [viewProps, setViewProps] = useState(null);
    const [isDarkMode, setIsDarkMode] = useState(true);
    const [allJobs, setAllJobs] = useState([]);
    const [allNotes, setAllNotes] = useState([]);
    const [allLagerItems, setAllLagerItems] = useState([]);
    const [isSpotlightOpen, setIsSpotlightOpen] = useState(false);
    const [isChatOpen, setIsChatOpen] = useState(false);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

    useEffect(() => {
        if (isDarkMode) document.documentElement.classList.add('dark');
        else document.documentElement.classList.remove('dark');
    }, [isDarkMode]);

    useEffect(() => {
        const unsubscribe = auth.onAuthStateChanged(user => {
            setUser(user);
            setLoading(false);
        });
        return unsubscribe;
    }, []);

    useEffect(() => {
        if (!user) return;
        const u1 = db.collection('jobs').onSnapshot(s => setAllJobs(s.docs.map(d => ({ id: d.id, ...d.data() })).filter(x => !x.deleted)));
        const u2 = db.collection('notes').onSnapshot(s => setAllNotes(s.docs.map(d => ({ id: d.id, ...d.data() }))));
        const u3 = db.collection('lager').onSnapshot(s => setAllLagerItems(s.docs.map(d => ({ id: d.id, ...d.data() }))));
        return () => { u1(); u2(); u3(); };
    }, [user]);

    useEffect(() => {
        if (window.lucide) window.lucide.createIcons();
    });

    // Spotlight Shortcuts
    useEffect(() => {
        const handleKeyDown = (e) => {
            if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
                e.preventDefault();
                setIsSpotlightOpen(prev => !prev);
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        window.addEventListener('open-spotlight', () => setIsSpotlightOpen(true));
        return () => {
            window.removeEventListener('keydown', handleKeyDown);
            window.removeEventListener('open-spotlight', () => setIsSpotlightOpen(true));
        };
    }, []);

    if (loading) return <div className="fixed inset-0 bg-black flex items-center justify-center"><div className="text-orange-500 font-mono text-sm animate-pulse">BOOTING_SYSTEM...</div></div>;
    if (!user) return <LoginScreen />;

    const navigateTo = (targetView, props = null) => {
        setViewProps(props);
        setView(targetView);
        setIsMobileMenuOpen(false);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const NavButton = ({ target, icon, label }) => {
        const active = view === target;
        return (
            <button
                onClick={() => navigateTo(target, target === 'NEW_JOB' ? { job: null } : null)}
                className={`w-full flex items-center gap-4 px-6 py-4 transition-all duration-300 relative group
                    ${active ? 'bg-orange-500/10 dark:bg-[#182032] text-orange-600 dark:text-orange-500 border-r-2 border-orange-500' : 'text-zinc-500 dark:text-zinc-500 hover:bg-zinc-50 dark:hover:bg-[#121826] hover:text-zinc-900 dark:hover:text-zinc-300 border-r-2 border-transparent'}
                `}
            >
                <window.Icon name={icon} size={20} className={`transition-all duration-300 ${active ? 'scale-110' : 'group-hover:scale-110'}`} />
                <span className="text-[12px] font-bold tracking-widest uppercase">{label}</span>
            </button>
        );
    };

    // Aggregerad data för Dashboard
    const activeFilter = viewProps?.activeFilter || 'BOKAD';
    const setActiveFilter = (filter) => setViewProps({ ...viewProps, activeFilter: filter });
    const globalSearch = viewProps?.globalSearch || '';
    const setGlobalSearch = (q) => setViewProps({ ...viewProps, globalSearch: q });

    const filteredJobs = useMemo(() => {
        let res = [...allJobs];
        if (activeFilter !== 'ALLA') res = res.filter(j => (j.status || 'BOKAD') === activeFilter);
        if (globalSearch) {
            const q = globalSearch.toLowerCase();
            res = res.filter(j => (j.regnr && j.regnr.toLowerCase().includes(q)) || (j.kundnamn && j.kundnamn.toLowerCase().includes(q)) || (j.telefon && j.telefon.toLowerCase().includes(q)) || (j.id && j.id.toLowerCase().includes(q)));
        }
        return res;
    }, [allJobs, activeFilter, globalSearch]);

    const statusCounts = useMemo(() => {
        const counts = { 'ALLA': allJobs.length, 'BOKAD': 0, 'OFFERERAD': 0, 'KLAR': 0, 'FAKTURERAS': 0 };
        allJobs.forEach(j => { const s = j.status || 'BOKAD'; if (counts[s] !== undefined) counts[s]++; });
        return counts;
    }, [allJobs]);

    return (
        <div className="flex h-screen bg-white dark:bg-[#0a0f18] text-zinc-900 dark:text-white overflow-hidden selection:bg-orange-500/30 font-sans transition-colors duration-500">
            
            {/* --- GLOBALA WIDGETS --- */}
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
            {window.GlobalSystemRadar && (
                <window.GlobalSystemRadar isChatOpen={isChatOpen} />
            )}
            
            {/* --- SIDEBAR (Desktop) --- */}
            <div className="hidden lg:flex w-64 bg-zinc-50 dark:bg-[#0a0f18] border-r border-zinc-200 dark:border-[#1a2235] flex-col shrink-0 relative z-20">
                <div className="h-20 flex items-center px-6 border-b border-zinc-200 dark:border-[#1a2235]">
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-orange-500 rounded-lg flex items-center justify-center shadow-[0_0_15px_rgba(249,115,22,0.4)]">
                            <span className="text-black font-black text-sm">P</span>
                        </div>
                        <span className="font-black text-[10px] tracking-[0.2em] uppercase">Planerare // OS</span>
                    </div>
                </div>

                <div className="flex-1 py-6 overflow-y-auto custom-scrollbar">
                    <NavButton target="DASHBOARD" icon="grid" label="Dashboard" />
                    <div className="h-6"></div>
                    <NavButton target="CALENDAR" icon="calendar" label="Kalender" />
                    <div className="h-6"></div>
                    <NavButton target="NEW_JOB" icon="plus-square" label="Nytt Jobb" />
                    <div className="h-6"></div>
                    <NavButton target="LAGER" icon="package" label="Lager" />
                    <div className="h-6"></div>
                    <NavButton target="CUSTOMERS" icon="users" label="Kund Databas" />
                    <div className="h-6"></div>
                    <NavButton target="GARAGE" icon="droplet" label="Oil Status" />
                    <div className="h-6"></div>
                    <NavButton target="REFERENCE" icon="file-text" label="Dokument" />
                </div>

                <div className="p-6 border-t border-zinc-200 dark:border-[#1a2235]">
                    <button onClick={() => setIsDarkMode(!isDarkMode)} className="w-full flex items-center gap-3 text-zinc-500 hover:text-zinc-900 dark:hover:text-white transition-colors mb-4">
                        <window.Icon name={isDarkMode ? "sun" : "moon"} size={16} />
                        <span className="text-[10px] font-bold uppercase tracking-widest">{isDarkMode ? 'Light Mode' : 'Dark Mode'}</span>
                    </button>
                    <div className="flex items-center gap-3 bg-white dark:bg-[#121826] border border-zinc-200 dark:border-white/5 p-3 rounded-xl cursor-pointer group">
                        <div className="w-8 h-8 rounded-lg bg-orange-50 dark:bg-orange-500/10 flex items-center justify-center text-orange-600 dark:text-orange-500 font-bold text-xs border border-orange-200 dark:border-orange-500/20">A</div>
                        <div className="flex flex-col min-w-0 flex-1">
                            <span className="text-[10px] font-black uppercase truncate tracking-widest">Operator</span>
                            <span className="text-[8px] text-zinc-400 font-mono truncate">{user.email}</span>
                        </div>
                        <button onClick={() => auth.signOut()} className="text-zinc-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all"><window.Icon name="log-out" size={14} /></button>
                    </div>
                </div>
            </div>

            {/* --- HUVUDINNEHÅLL --- */}
            <div className="flex-1 flex flex-col min-w-0 relative h-screen bg-zinc-50 dark:bg-[#0a0f18] transition-colors duration-500">
                <div className="flex-1 overflow-y-auto custom-scrollbar h-full w-full">
                    <div className="w-full h-full lg:p-8">
                        {view === 'DASHBOARD' && window.DashboardView && <window.DashboardView allJobs={allJobs} filteredJobs={filteredJobs} setView={navigateTo} activeFilter={activeFilter} setActiveFilter={setActiveFilter} statusCounts={statusCounts} globalSearch={globalSearch} setGlobalSearch={setGlobalSearch} />}
                        {view === 'NEW_JOB' && window.NewJobView && <window.NewJobView job={viewProps?.job} setView={navigateTo} allJobs={allJobs} />}
                        {view === 'REFERENCE' && window.ReferenceView && <window.ReferenceView />}
                        {view === 'CALENDAR' && window.CalendarView && <window.CalendarView allJobs={allJobs} setView={navigateTo} />}
                        {view === 'LAGER' && window.LagerView && <window.LagerView />}
                        {view === 'CUSTOMERS' && window.CustomerDatabaseView && <window.CustomerDatabaseView allJobs={allJobs} setView={navigateTo} />}
                        {view === 'GARAGE' && window.GarageView && <window.GarageView />}
                    </div>
                </div>
            </div>

            {/* --- CHATT WIDGET --- */}
            {window.SystemChat && <window.SystemChat user={user} isChatOpen={isChatOpen} setIsChatOpen={setIsChatOpen} />}

            {/* --- MOBILE NAVIGATION (Bottom Bar) --- */}
            <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-white/95 dark:bg-[#182032]/95 backdrop-blur-xl border-t border-zinc-200 dark:border-white/10 z-50 px-6 py-4 pb-safe-bottom flex justify-between items-center shadow-[0_-10px_40px_rgba(0,0,0,0.1)] dark:shadow-[0_-10px_40px_rgba(0,0,0,0.3)]">
                <button onClick={() => navigateTo('DASHBOARD')} className={`flex flex-col items-center gap-1.5 transition-colors ${view === 'DASHBOARD' ? 'text-orange-500' : 'text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200'}`}>
                    <window.Icon name="grid" size={20} />
                </button>
                <button onClick={() => navigateTo('CALENDAR')} className={`flex flex-col items-center gap-1.5 transition-colors ${view === 'CALENDAR' ? 'text-orange-500' : 'text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200'}`}>
                    <window.Icon name="calendar" size={20} />
                </button>
                <div className="relative -top-8">
                    <button onClick={() => navigateTo('NEW_JOB', { job: null })} className="w-14 h-14 bg-gradient-to-tr from-orange-600 to-orange-400 text-white rounded-full flex items-center justify-center shadow-[0_10px_25px_rgba(249,115,22,0.5)] active:scale-95 transition-transform border-4 border-white dark:border-[#0a0f18]">
                        <window.Icon name="plus" size={24} />
                    </button>
                </div>
                <button onClick={() => navigateTo('LAGER')} className={`flex flex-col items-center gap-1.5 transition-colors ${view === 'LAGER' ? 'text-orange-500' : 'text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200'}`}>
                    <window.Icon name="package" size={20} />
                </button>
                <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} className={`flex flex-col items-center gap-1.5 transition-colors ${isMobileMenuOpen ? 'text-orange-500' : 'text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200'}`}>
                    <window.Icon name="menu" size={20} />
                </button>
            </div>

            {/* --- MOBILE FULLSCREEN MENU --- */}
            {isMobileMenuOpen && (
                <div className="lg:hidden fixed inset-0 z-[100] bg-white dark:bg-[#0a0f18] animate-in slide-in-from-bottom-full duration-300 flex flex-col">
                    <div className="flex items-center justify-between px-6 py-6 border-b border-zinc-200 dark:border-white/5">
                        <span className="font-black text-[12px] tracking-widest uppercase text-zinc-900 dark:text-white">Meny</span>
                        <button onClick={() => setIsMobileMenuOpen(false)} className="w-10 h-10 flex items-center justify-center bg-zinc-100 dark:bg-white/5 rounded-full text-zinc-600 dark:text-zinc-300"><window.Icon name="x" size={20} /></button>
                    </div>
                    <div className="flex-1 overflow-y-auto px-6 py-8 space-y-2">
                        <button onClick={() => navigateTo('CUSTOMERS')} className={`w-full p-4 rounded-2xl flex items-center gap-4 ${view === 'CUSTOMERS' ? 'bg-orange-50 dark:bg-orange-500/10 text-orange-600 dark:text-orange-500' : 'bg-zinc-50 dark:bg-[#121826] text-zinc-700 dark:text-zinc-300'}`}><window.Icon name="users" size={24} /><span className="text-[14px] font-bold uppercase tracking-widest">Kund Databas</span></button>
                        <button onClick={() => navigateTo('GARAGE')} className={`w-full p-4 rounded-2xl flex items-center gap-4 ${view === 'GARAGE' ? 'bg-orange-50 dark:bg-orange-500/10 text-orange-600 dark:text-orange-500' : 'bg-zinc-50 dark:bg-[#121826] text-zinc-700 dark:text-zinc-300'}`}><window.Icon name="droplet" size={24} /><span className="text-[14px] font-bold uppercase tracking-widest">Oil Status</span></button>
                        <button onClick={() => navigateTo('REFERENCE')} className={`w-full p-4 rounded-2xl flex items-center gap-4 ${view === 'REFERENCE' ? 'bg-orange-50 dark:bg-orange-500/10 text-orange-600 dark:text-orange-500' : 'bg-zinc-50 dark:bg-[#121826] text-zinc-700 dark:text-zinc-300'}`}><window.Icon name="file-text" size={24} /><span className="text-[14px] font-bold uppercase tracking-widest">Dokument</span></button>
                    </div>
                    <div className="p-6 border-t border-zinc-200 dark:border-white/5 space-y-4">
                        <button onClick={() => setIsDarkMode(!isDarkMode)} className="w-full p-4 rounded-2xl bg-zinc-50 dark:bg-[#121826] text-zinc-700 dark:text-zinc-300 flex items-center justify-center gap-3"><window.Icon name={isDarkMode ? "sun" : "moon"} size={20} /><span className="text-[12px] font-bold uppercase tracking-widest">{isDarkMode ? 'Light Mode' : 'Dark Mode'}</span></button>
                        <button onClick={() => auth.signOut()} className="w-full p-4 rounded-2xl bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-500 flex items-center justify-center gap-3"><window.Icon name="log-out" size={20} /><span className="text-[12px] font-bold uppercase tracking-widest">Logga ut</span></button>
                    </div>
                </div>
            )}
        </div>
    );
};

ReactDOM.render(<App />, document.getElementById('root'));
