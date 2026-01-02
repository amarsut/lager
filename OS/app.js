// app.js - Full uppdaterad version

const { useState, useEffect, useMemo, memo } = React;

// --- 1. THEMES ---
const THEMES = {
    MATRIX: { primary: '#f97316', secondary: '#000000', accent: '#fb923c', text: '#ffffff', label: 'Matrix Orange' },
    CYBER: { primary: '#00ff41', secondary: '#0d0208', accent: '#008f11', text: '#ffffff', label: 'Cyber Green' },
    CLEAN_LIGHT: { primary: '#3b82f6', secondary: '#ffffff', accent: '#60a5fa', text: '#1e293b', label: 'Clean Light' },
    SAND: { primary: '#d97706', secondary: '#fef3c7', accent: '#f59e0b', text: '#451a03', label: 'Workshop Sand' }
};

// --- 2. FIREBASE ---
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
const auth = firebase.auth();
window.db = db;
window.firebase = firebase;

// --- 3. GLOBALA KOMPONENTER ---
window.Icon = ({ name, size = 18, className = "" }) => (
    <i data-lucide={name} className={className} style={{ width: size, height: size }}></i>
);

// NY: SPLASH SCREEN KOMPONENT (Matrix Style)
const SplashScreen = () => (
    <div className="fixed inset-0 bg-zinc-950 flex items-center justify-center z-[9999] animate-out fade-out duration-500 delay-1000 fill-mode-forwards pointer-events-none">
        <div className="flex flex-col items-center">
            <div className="w-16 h-16 theme-bg flex items-center justify-center font-black rounded-sm text-black shadow-lg text-3xl animate-pulse">P</div>
            <h1 className="mt-4 text-white font-black uppercase tracking-[0.3em] text-sm">Planerare // OS</h1>
            <div className="mt-6 w-32 h-1 bg-zinc-800 rounded-full overflow-hidden">
                <div className="h-full theme-bg animate-[loading_1s_ease-in-out_infinite]"></div>
            </div>
            <p className="mt-2 text-[8px] font-black text-zinc-500 uppercase tracking-widest">Initializing_Core_Systems...</p>
        </div>
    </div>
);

// --- 5. HUVUDAPPLIKATION ---
const App = () => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [appReady, setAppReady] = useState(false);
    const [view, setView] = useState('DASHBOARD');
    const [sidebarOpen, setSidebarOpen] = useState(window.innerWidth > 1024);
    const [activeFilter, setActiveFilter] = useState('BOKAD');
    const [globalSearch, setGlobalSearch] = useState('');
    const [allJobs, setAllJobs] = useState([]);
    const [editingJob, setEditingJob] = useState(null);
    const [theme, setTheme] = useState(localStorage.getItem('sys_theme') || 'MATRIX');
    const [time, setTime] = useState(new Date());

    const triggerHaptic = () => {
        if (window.navigator && window.navigator.vibrate) {
            window.navigator.vibrate(12);
        }
    };

    useEffect(() => {
        window.openEditModal = (jobId) => {
            const job = allJobs.find(j => j.id === jobId);
            if (job) {
                setEditingJob(job);
                setView('NEW_JOB');
            }
        };
    }, [allJobs]);

    useEffect(() => {
        const timer = setInterval(() => setTime(new Date()), 1000);
        // Visa splash screen i minst 1.5 sekunder
        setTimeout(() => setAppReady(true), 1500);
        return () => clearInterval(timer);
    }, []);

    useEffect(() => { if (window.lucide) window.lucide.createIcons(); }, [view, allJobs, sidebarOpen, activeFilter]);

    useEffect(() => {
        const active = THEMES[theme];
        const root = document.documentElement;
        root.style.setProperty('--brand-primary', active.primary);
        root.style.setProperty('--brand-secondary', active.secondary);
        root.style.setProperty('--sidebar-text', active.text);
        localStorage.setItem('sys_theme', theme);
        
        let styleTag = document.getElementById('dynamic-theme-style');
        if (!styleTag) {
            styleTag = document.createElement('style');
            styleTag.id = 'dynamic-theme-style';
            document.head.appendChild(styleTag);
        }

        styleTag.innerHTML = `
            @keyframes loading { 0% { width: 0%; } 50% { width: 100%; } 100% { width: 0%; } }
            input::-webkit-outer-spin-button, input::-webkit-inner-spin-button { -webkit-appearance: none; margin: 0; }
            input[type=number] { -moz-appearance: textfield; }
            input:focus, select:focus, textarea:focus { border-color: var(--brand-primary) !important; box-shadow: 0 0 0 2px rgba(249, 115, 22, 0.2) !important; outline: none !important; }
            .theme-bg { background-color: var(--brand-primary) !important; }
            .theme-text { color: var(--brand-primary) !important; }
            .theme-border { border-color: var(--brand-primary) !important; }
            .theme-sidebar { background-color: #0d0d0e !important; color: var(--sidebar-text) !important; }
            .theme-sidebar-active { background-color: rgba(249, 115, 22, 0.12) !important; color: var(--brand-primary) !important; border-right: 3px solid var(--brand-primary) !important; }
            .mobile-nav-btn { display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 3px; flex: 1; height: 100%; transition: all 0.2s; color: #52525b; border: none; background: transparent; }
            .mobile-nav-btn.active { color: var(--brand-primary); }
            .mobile-nav-label { font-size: 7px; font-weight: 900; text-transform: uppercase; letter-spacing: 0.1em; }
        `;
    }, [theme]);

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

    if (loading) return <SplashScreen />; // Visa splash screen under initiering
    if (!user) return <LoginScreen />;

    return (
        <>
            {!appReady && <SplashScreen />} {/* Visa splash screen tills appen är redo */}
            <div className="flex h-screen overflow-hidden bg-[#f8f9fa] relative">
                <aside className={`fixed lg:relative h-full z-[200] transition-all duration-300 ease-in-out ${sidebarOpen ? 'translate-x-0 w-[280px]' : '-translate-x-full lg:translate-x-0 lg:w-20'} theme-sidebar border-r border-zinc-200/5 flex flex-col shadow-2xl lg:shadow-none`}>
                    <div className="h-20 flex items-center px-6 gap-3 border-b border-zinc-200/5 overflow-hidden">
                        <div className="min-w-[32px] w-8 h-8 theme-bg flex items-center justify-center font-black rounded-sm text-black shadow-lg">P</div>
                        {sidebarOpen && <span className="font-black tracking-widest text-[10px] uppercase whitespace-nowrap">Planerare // OS</span>}
                    </div>
                    
                    <nav className="flex-1 py-6 space-y-1 overflow-y-auto">
                        {[
                            { id: 'DASHBOARD', icon: 'grid', label: 'Dashboard' },
                            { id: 'NEW_JOB', icon: 'plus-square', label: 'Nytt Jobb' },
                            { id: 'CUSTOMERS', icon: 'users', label: 'Kund-Bas' },
                            { id: 'OIL_SUPPLY', icon: 'droplet', label: 'Olje-Logistik' },
                            { id: 'CALENDAR', icon: 'calendar', label: 'Kalender' }
                        ].map(item => (
                            <div key={item.id} 
                                onClick={() => { 
                                    if(item.id === 'NEW_JOB') setEditingJob(null);
                                    setView(item.id); 
                                    setSidebarOpen(false); 
                                }} 
                                className={`flex items-center px-6 py-4 cursor-pointer transition-all ${view === item.id ? 'theme-sidebar-active' : 'hover:opacity-80'}`}>
                                <window.Icon name={item.icon} size={18} />
                                {sidebarOpen && <span className="ml-4 text-[10px] font-black uppercase tracking-widest">{item.label}</span>}
                            </div>
                        ))}
                    </nav>

                    <div className="mt-auto border-t border-zinc-200/5 p-4 bg-zinc-950/40 pb-20 lg:pb-4">
                        <div className={`flex items-center ${sidebarOpen ? 'justify-between' : 'justify-center'} px-2 gap-3`}>
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
                    <div 
                        onClick={() => { triggerHaptic(); setSidebarOpen(false); }} 
                        className="fixed inset-0 bg-black/40 backdrop-blur-md z-[190] lg:hidden animate-in fade-in duration-300"
                    ></div>
                )}

                <main className="flex-1 flex flex-col min-w-0 overflow-hidden relative">
                    <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-4 lg:px-8 z-50">
                        <div className="flex items-center gap-3">
                            <button onClick={() => { triggerHaptic(); setSidebarOpen(!sidebarOpen); }} className="hidden lg:block p-2 text-zinc-900 bg-zinc-100 rounded-sm hover:bg-zinc-200 transition-colors">
                                <window.Icon name="menu" />
                            </button>
                            
                            <div className="flex items-center gap-4 px-1 ml-0 border-zinc-200">
                                <div className="flex flex-col">
                                    <span className="text-[7px] font-black text-zinc-400 uppercase tracking-widest">System_Time</span>
                                    <span className="text-[9px] font-black font-mono uppercase italic theme-text">
                                        {time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                                    </span>
                                </div>
                                <div className="flex flex-col border-l border-zinc-100 pl-4 hidden xs:flex">
                                    <span className="text-[7px] font-black text-zinc-400 uppercase tracking-widest">Link</span>
                                    <span className="text-[9px] font-black text-green-600 uppercase flex items-center gap-1.5">
                                        <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></span> Secure
                                    </span>
                                </div>
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            <select value={theme} onChange={(e) => setTheme(e.target.value)} className="bg-zinc-100 text-[8px] font-black uppercase p-2 rounded-sm outline-none border border-transparent focus:border-zinc-300">
                                {Object.keys(THEMES).map(t => <option key={t} value={t}>{THEMES[t].label}</option>)}
                            </select>
                        </div>
                    </header>

                    <div className="flex-1 overflow-auto p-4 lg:p-8 space-y-6 pb-24 lg:pb-8">
                        {view === 'DASHBOARD' && (
                            <window.DashboardView 
                                filteredJobs={filteredJobs} 
                                setEditingJob={setEditingJob} 
                                setView={setView} 
                                activeFilter={activeFilter}
                                setActiveFilter={setActiveFilter}
                                statusCounts={statusCounts}
                                globalSearch={globalSearch}
                                setGlobalSearch={setGlobalSearch}
                            />
                        )}
                        {view === 'NEW_JOB' && <window.NewJobView editingJob={editingJob} setView={setView} allJobs={allJobs} />}
                        {view === 'CUSTOMERS' && <window.CustomersView allJobs={allJobs} setView={setView} setEditingJob={setEditingJob} />}
                        {view === 'CALENDAR' && <window.CalendarView allJobs={allJobs} setEditingJob={setEditingJob} setView={setView} />}
                        {view === 'OIL_SUPPLY' && <window.SupplyView allJobs={allJobs} />}
                    </div>

                    {/* BOTTOM NAV - Återställd till standardhöjd H-16 */}
                    <div className="lg:hidden fixed bottom-0 left-0 right-0 h-16 bg-zinc-950 border-t border-zinc-900 flex items-center justify-around z-[210] px-1 pb-safe backdrop-blur-xl">
                        <button onClick={() => { triggerHaptic(); setView('DASHBOARD'); setSidebarOpen(false); }} className={`mobile-nav-btn ${view === 'DASHBOARD' && !sidebarOpen ? 'active' : ''}`}>
                            <window.Icon name="grid" size={18} />
                            <span className="mobile-nav-label">Status</span>
                        </button>
                        
                        <button onClick={() => { triggerHaptic(); setView('CALENDAR'); setSidebarOpen(false); }} className={`mobile-nav-btn ${view === 'CALENDAR' && !sidebarOpen ? 'active' : ''}`}>
                            <window.Icon name="calendar" size={18} />
                            <span className="mobile-nav-label">Plan</span>
                        </button>

                        <button onClick={() => { triggerHaptic(); setEditingJob(null); setView('NEW_JOB'); setSidebarOpen(false); }} className={`mobile-nav-btn ${view === 'NEW_JOB' && !sidebarOpen ? 'active' : ''}`}>
                            <window.Icon name="plus-square" size={18} />
                            <span className="mobile-nav-label">Nytt</span>
                        </button>

                        <button onClick={() => { triggerHaptic(); setView('CUSTOMERS'); setSidebarOpen(false); }} className={`mobile-nav-btn ${view === 'CUSTOMERS' && !sidebarOpen ? 'active' : ''}`}>
                            <window.Icon name="users" size={18} />
                            <span className="mobile-nav-label">Kunder</span>
                        </button>

                        <button 
                            onClick={() => { triggerHaptic(); setSidebarOpen(!sidebarOpen); }} 
                            className={`mobile-nav-btn ${sidebarOpen ? 'active' : ''}`}
                        >
                            <window.Icon name={sidebarOpen ? "x" : "more-horizontal"} size={18} />
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
            <form onSubmit={handleLogin} className="w-full max-w-sm p-8 bg-zinc-950 border border-zinc-900 space-y-6 text-white shadow-2xl">
                <h2 className="text-white font-black uppercase tracking-widest border-b border-orange-600 pb-4 text-center text-xs">System_Core_Access</h2>
                <input type="email" placeholder="EMAIL" className="w-full bg-zinc-900 border border-zinc-800 p-4 text-white text-[10px] outline-none focus:border-orange-500 transition-all" value={email} onChange={e => setEmail(e.target.value)} />
                <input type="password" placeholder="PASSWORD" className="w-full bg-zinc-900 border border-zinc-800 p-4 text-white text-[10px] outline-none focus:border-orange-500 transition-all" value={password} onChange={e => setPassword(e.target.value)} />
                <button type="submit" className="w-full theme-bg text-black font-black py-5 text-[10px] uppercase tracking-[0.3em] hover:bg-white transition-colors active:scale-95 shadow-lg">Authenticate</button>
            </form>
        </div>
    );
};

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(<App />);
