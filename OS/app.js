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

// --- 5. HUVUDAPPLIKATION ---
const App = () => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [view, setView] = useState('DASHBOARD');
    const [sidebarOpen, setSidebarOpen] = useState(window.innerWidth > 1024);
    const [activeFilter, setActiveFilter] = useState('BOKAD');
    const [globalSearch, setGlobalSearch] = useState('');
    const [allJobs, setAllJobs] = useState([]);
    const [editingJob, setEditingJob] = useState(null);
    const [theme, setTheme] = useState(localStorage.getItem('sys_theme') || 'MATRIX');

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
            input::-webkit-outer-spin-button, input::-webkit-inner-spin-button { -webkit-appearance: none; margin: 0; }
            input[type=number] { -moz-appearance: textfield; }
            .theme-bg { background-color: var(--brand-primary) !important; }
            .theme-text { color: var(--brand-primary) !important; }
            .theme-border { border-color: var(--brand-primary) !important; }
            .theme-sidebar { background-color: var(--brand-secondary) !important; color: var(--sidebar-text) !important; }
            .theme-sidebar-active { background-color: var(--brand-primary) !important; color: #000 !important; }
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

    if (loading) return null;
    if (!user) return <LoginScreen />;

    return (
        <div className="flex h-screen overflow-hidden bg-[#f8f9fa] relative">
            {/* --- SIDEBAR --- */}
            <aside className={`fixed lg:relative h-full z-[100] transition-transform duration-300 ease-in-out ${sidebarOpen ? 'translate-x-0 w-[260px]' : '-translate-x-full lg:translate-x-0 lg:w-20'} theme-sidebar border-r border-zinc-200/10 flex flex-col`}>
                <div className="h-20 flex items-center px-6 gap-3 border-b border-zinc-200/10 overflow-hidden">
                    <div className="min-w-[32px] w-8 h-8 theme-bg flex items-center justify-center font-black rounded-sm text-black shadow-lg">P</div>
                    {sidebarOpen && <span className="font-black tracking-widest text-[10px] uppercase whitespace-nowrap">Planerare // OS</span>}
                </div>
                <nav className="flex-1 py-6 space-y-1">
                    {[
                        { id: 'DASHBOARD', icon: 'grid', label: 'Dashboard' },
                        { id: 'NEW_JOB', icon: 'plus-square', label: 'Nytt Jobb' },
                        { id: 'CUSTOMERS', icon: 'users', label: 'Kund-Bas' },
                        { id: 'CALENDAR', icon: 'calendar', label: 'Kalender' }
                    ].map(item => (
                        <div key={item.id} onClick={() => { setView(item.id); if(window.innerWidth < 1024) setSidebarOpen(false); }} className={`flex items-center px-6 py-4 cursor-pointer transition-all ${view === item.id ? 'theme-sidebar-active' : 'hover:opacity-80'}`}>
                            <window.Icon name={item.icon} size={20} />
                            {sidebarOpen && <span className="ml-4 text-[11px] font-black uppercase tracking-widest">{item.label}</span>}
                        </div>
                    ))}
                </nav>
            </aside>

            {/* Overlay för mobil-sidebar */}
            {sidebarOpen && window.innerWidth < 1024 && <div onClick={() => setSidebarOpen(false)} className="fixed inset-0 bg-black/60 z-[90] backdrop-blur-sm lg:hidden"></div>}

            {/* --- HUVUDINNEHÅLL --- */}
            <main className="flex-1 flex flex-col min-w-0 overflow-hidden relative">
                <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-4 lg:px-8 z-50">
                    <div className="flex items-center gap-3 flex-1">
                        <button onClick={() => setSidebarOpen(!sidebarOpen)} className="p-2 text-zinc-900 bg-zinc-100 rounded-sm hover:bg-zinc-200 transition-colors">
                            <window.Icon name="menu" />
                        </button>
                        <div className="relative w-full max-w-[140px] lg:max-w-md">
                            <window.Icon name="search" size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-zinc-400" />
                            <input type="text" value={globalSearch} onChange={e => setGlobalSearch(e.target.value)} placeholder="SÖK..." className="w-full bg-zinc-100 p-2 pl-8 text-[10px] font-bold outline-none font-mono focus:bg-white border-transparent focus:theme-border border transition-all uppercase" />
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <select value={theme} onChange={(e) => setTheme(e.target.value)} className="bg-zinc-100 text-[8px] font-black uppercase p-2 rounded-sm outline-none">
                            {Object.keys(THEMES).map(t => <option key={t} value={t}>{THEMES[t].label}</option>)}
                        </select>
                        <div className="w-9 h-9 theme-sidebar text-white flex items-center justify-center font-black border theme-border shadow-md uppercase text-xs">{user.email[0]}</div>
                    </div>
                </header>

                <div className="flex-1 overflow-auto p-4 lg:p-8 space-y-6 pb-24 lg:pb-8">
                    {view === 'DASHBOARD' && (
                        <>
                            <div className="flex overflow-x-auto gap-2 no-scrollbar pb-2">
                                {['ALLA', 'BOKAD', 'OFFERERAD', 'EJ BOKAD', 'KLAR', 'FAKTURERAS'].map(s => (
                                    <button key={s} onClick={() => setActiveFilter(s)} className={`px-4 py-2 text-[10px] font-black border flex-shrink-0 transition-all flex items-center gap-2 ${activeFilter === s ? 'theme-bg text-black theme-border shadow-md' : 'bg-white text-zinc-400 border-zinc-100'}`}>
                                        {s} <span className={`px-1 rounded-xs text-[8px] ${activeFilter === s ? 'bg-black text-white' : 'bg-zinc-100'}`}>{statusCounts[s]}</span>
                                    </button>
                                ))}
                            </div>
                            <window.DashboardView 
                                filteredJobs={filteredJobs} 
                                setEditingJob={setEditingJob} 
                                setView={setView} 
                            />
                        </>
                    )}
                    {view === 'NEW_JOB' && <window.NewJobView editingJob={editingJob} setView={setView} allJobs={allJobs} />}
                    {view === 'CUSTOMERS' && <window.CustomersView allJobs={allJobs} setView={setView} />}
                    {view === 'CALENDAR' && <window.CalendarView allJobs={allJobs} setEditingJob={setEditingJob} setView={setView} />}
                </div>
            </main>

            {/* --- BOTTOM APP MENU (MOBIL) --- */}
            <nav className="fixed bottom-0 left-0 right-0 h-20 bg-white border-t border-zinc-100 flex items-center justify-around z-[150] lg:hidden px-4 pb-safe">
                <div onClick={() => setView('DASHBOARD')} 
                    className={`mobile-nav-item ${view === 'DASHBOARD' ? 'active' : ''}`}>
                    <window.Icon name="layout-grid" size={24} />
                    <span>Hem</span>
                </div>
                
                <div onClick={() => { setEditingJob(null); setView('NEW_JOB'); }} 
                    className={`mobile-nav-item ${view === 'NEW_JOB' ? 'active' : ''}`}>
                    <window.Icon name="plus-square" size={24} />
                    <span>Nytt jobb</span>
                </div>

                <div onClick={() => setView('CALENDAR')} 
                    className={`mobile-nav-item ${view === 'CALENDAR' ? 'active' : ''}`}>
                    <window.Icon name="calendar" size={24} />
                    <span>Kalender</span>
                </div>

                <div onClick={() => setSidebarOpen(true)} className="mobile-nav-item">
                    <window.Icon name="menu" size={24} />
                    <span>Mer</span>
                </div>
            </nav>
        </div>
    );
};

const LoginScreen = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const handleLogin = (e) => { e.preventDefault(); auth.signInWithEmailAndPassword(email, password); };
    return (
        <div className="fixed inset-0 bg-black flex items-center justify-center font-mono z-[200]">
            <form onSubmit={handleLogin} className="w-full max-w-sm p-8 bg-zinc-950 border border-zinc-800 space-y-6">
                <h2 className="text-white font-black uppercase tracking-widest border-b border-orange-500 pb-4 text-center">System Access</h2>
                <input type="email" placeholder="EMAIL" className="w-full bg-zinc-900 border border-zinc-800 p-3 text-white text-xs outline-none focus:border-orange-500" value={email} onChange={e => setEmail(e.target.value)} />
                <input type="password" placeholder="PASSWORD" className="w-full bg-zinc-900 border border-zinc-800 p-3 text-white text-xs outline-none focus:border-orange-500" value={password} onChange={e => setPassword(e.target.value)} />
                <button type="submit" className="w-full theme-bg text-black font-black py-4 text-[10px] uppercase tracking-widest hover:bg-white transition-colors">Connect</button>
            </form>
        </div>
    );
};

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(<App />);
