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

window.Badge = memo(({ status }) => {
    const s = (status || 'BOKAD').toUpperCase();
    const styles = {
        'BOKAD': 'theme-bg text-black font-black',
        'KLAR': 'bg-black text-white font-bold',
        'FAKTURERAS': 'bg-zinc-100 text-zinc-500 border border-zinc-200',
        'OFFERERAD': 'bg-blue-500 text-white'
    };
    return <span className={`px-2 py-0.5 text-[8px] uppercase tracking-[0.1em] inline-block w-20 text-center rounded-xs ${styles[s] || styles['BOKAD']}`}>{s}</span>;
});

// --- 4. DASHBOARD (OPTIMERAD) ---
const Dashboard = memo(({ filteredJobs, setEditingJob, setView }) => (
    <div className="space-y-4 pb-20 lg:pb-0">
        <div className="hidden lg:block bg-white border border-zinc-200 shadow-2xl rounded-sm overflow-hidden">
            <table className="w-full text-left">
                <thead className="bg-zinc-900 text-zinc-400 text-[9px] uppercase tracking-widest font-black">
                    <tr>
                        <th className="px-6 py-4">Kund / Order</th>
                        <th className="px-6 py-4">Regnr</th>
                        <th className="px-6 py-4">Datum // Tid</th>
                        <th className="px-6 py-4">Status</th>
                        <th className="px-6 py-4 text-right">Belopp</th>
                        <th className="px-6 py-4 w-28 text-right">Åtgärd</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100">
                    {filteredJobs.map(job => (
                        <tr key={job.id} className="hover:bg-zinc-50 transition-all border-l-4 border-transparent hover:theme-border group">
                            <td className="px-6 py-3 cursor-pointer" onClick={() => { setEditingJob(job); setView('NEW_JOB'); }}>
                                <div className="text-[11px] font-black uppercase text-zinc-900">{job.kundnamn}</div>
                                <div className="text-[8px] text-zinc-400 font-bold uppercase">{job.id.substring(0,8)}</div>
                            </td>
                            <td className="px-6 py-3 font-mono font-black theme-text text-[11px] uppercase">{job.regnr}</td>
                            <td className="px-6 py-3">
                                <div className="text-[11px] font-bold text-zinc-500 font-mono">{job.datum?.split('T')[0]}</div>
                                <div className="text-[10px] theme-text font-black font-mono tracking-tighter">kl. {job.datum?.split('T')[1] || '--:--'}</div>
                            </td>
                            <td className="px-6 py-3"><window.Badge status={job.status} /></td>
                            <td className="px-6 py-3 text-right font-black text-zinc-900">{(parseInt(job.kundpris) || 0).toLocaleString()} kr</td>
                            <td className="px-6 py-3 text-right">
                                <div className="flex justify-end gap-2">
                                    <button onClick={() => { setEditingJob(job); setView('NEW_JOB'); }} className="p-1.5 text-zinc-400 hover:theme-text"><window.Icon name="edit-3" size={16} /></button>
                                    <button onClick={() => { if(confirm("Radera?")) db.collection("jobs").doc(job.id).update({deleted:true}); }} className="p-1.5 text-zinc-400 hover:text-red-500"><window.Icon name="trash-2" size={16} /></button>
                                </div>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
        <div className="lg:hidden space-y-3">
            {filteredJobs.map(job => (
                <div key={job.id} onClick={() => { setEditingJob(job); setView('NEW_JOB'); }} className="bg-white border-l-4 theme-border p-4 shadow-md rounded-sm active:scale-[0.98] transition-all">
                    <div className="flex justify-between items-start mb-2">
                        <div>
                            <div className="text-[13px] font-black uppercase text-zinc-900 leading-tight">{job.kundnamn}</div>
                            <div className="text-[11px] font-mono theme-text font-black tracking-tight">{job.regnr}</div>
                        </div>
                        <window.Badge status={job.status} />
                    </div>
                    <div className="flex justify-between items-end border-t border-zinc-50 pt-3 mt-2">
                        <div className="text-[10px] font-mono text-zinc-400">{job.datum?.replace('T', ' / ')}</div>
                        <div className="font-black text-zinc-900">{(parseInt(job.kundpris) || 0).toLocaleString()} kr</div>
                    </div>
                </div>
            ))}
        </div>
    </div>
));

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

    // Optimera Lucide
    useEffect(() => { if (window.lucide) window.lucide.createIcons(); }, [view, allJobs, sidebarOpen]);

    // Optimera Theme Engine (Inga dubbletter av style-tags)
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
        const counts = { 'ALLA': allJobs.length, 'BOKAD': 0, 'KLAR': 0, 'FAKTURERAS': 0 };
        allJobs.forEach(job => {
            const s = (job.status || '').toUpperCase();
            if (counts.hasOwnProperty(s)) counts[s]++;
        });
        return counts;
    }, [allJobs]);

    const filteredJobs = useMemo(() => {
        let result = allJobs.filter(job => {
            const q = globalSearch.toLowerCase();
            const matchesGlobal = (job.regnr || '').toLowerCase().includes(q) || (job.kundnamn || '').toLowerCase().includes(q);
            const matchesStatus = activeFilter === 'ALLA' || (job.status || '').toUpperCase() === activeFilter;
            return matchesGlobal && matchesStatus;
        });

        // Sorteringslogik: Tidigaste först för BOKAD, annars senaste först
        if (activeFilter === 'BOKAD') {
            result.sort((a, b) => (a.datum || '').localeCompare(b.datum || ''));
        } else {
            result.sort((a, b) => (b.datum || '').localeCompare(a.datum || ''));
        }
        
        return result;
    }, [globalSearch, activeFilter, allJobs]);

    if (loading) return null;
    if (!user) return <LoginScreen />;

    return (
        <div className="flex h-screen overflow-hidden bg-[#f8f9fa] relative">
            <aside className={`fixed lg:relative h-full z-[100] transition-transform duration-300 ease-in-out ${sidebarOpen ? 'translate-x-0 w-[260px]' : '-translate-x-full lg:translate-x-0 lg:w-20'} theme-sidebar border-r border-zinc-800 flex flex-col`}>
                <div className="h-20 flex items-center px-6 gap-3 border-b border-zinc-200/10 overflow-hidden">
                    <div className="min-w-[32px] w-8 h-8 theme-bg flex items-center justify-center font-black rounded-sm text-black">P</div>
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

            {sidebarOpen && window.innerWidth < 1024 && <div onClick={() => setSidebarOpen(false)} className="fixed inset-0 bg-black/60 z-[90] backdrop-blur-sm lg:hidden"></div>}

            <main className="flex-1 flex flex-col min-w-0 overflow-hidden relative">
                <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-4 lg:px-8 z-50">
                    <div className="flex items-center gap-3 flex-1">
                        <button onClick={() => setSidebarOpen(!sidebarOpen)} className="p-2 text-zinc-900 bg-zinc-100 rounded-sm"><window.Icon name="menu" /></button>
                        <div className="relative w-full max-w-[140px] lg:max-w-md">
                            <window.Icon name="search" size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-zinc-400" />
                            <input type="text" value={globalSearch} onChange={e => setGlobalSearch(e.target.value)} placeholder="SÖK..." className="w-full bg-zinc-100 p-2 pl-8 text-[10px] font-bold outline-none font-mono focus:bg-white border-transparent focus:theme-border border transition-all uppercase" />
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <select value={theme} onChange={(e) => setTheme(e.target.value)} className="bg-zinc-100 text-[8px] font-black uppercase p-2 rounded-sm outline-none">
                            {Object.keys(THEMES).map(t => <option key={t} value={t}>{THEMES[t].label}</option>)}
                        </select>
                        <div className="w-9 h-9 theme-sidebar flex items-center justify-center font-black border theme-border shadow-md uppercase text-xs">{user.email[0]}</div>
                    </div>
                </header>

                <div className="flex-1 overflow-auto p-4 lg:p-8 space-y-6 pb-24 lg:pb-8">
                    {view === 'DASHBOARD' && (
                        <>
                            <div className="flex overflow-x-auto gap-2 no-scrollbar pb-2">
                                {['ALLA', 'BOKAD', 'KLAR', 'FAKTURERAS'].map(s => (
                                    <button key={s} onClick={() => setActiveFilter(s)} className={`px-4 py-2 text-[10px] font-black border flex-shrink-0 transition-all flex items-center gap-2 ${activeFilter === s ? 'theme-bg text-black theme-border' : 'bg-white text-zinc-400 border-zinc-100'}`}>
                                        {s} <span className={`px-1 rounded-xs text-[8px] ${activeFilter === s ? 'bg-black text-white' : 'bg-zinc-100'}`}>{statusCounts[s]}</span>
                                    </button>
                                ))}
                            </div>
                            <Dashboard filteredJobs={filteredJobs} setEditingJob={setEditingJob} setView={setView} />
                        </>
                    )}
                    {view === 'NEW_JOB' && <window.NewJobView editingJob={editingJob} setView={setView} allJobs={allJobs} />}
                    {view === 'CUSTOMERS' && <window.CustomersView allJobs={allJobs} setView={setView} />}
                    {view === 'CALENDAR' && <window.CalendarView allJobs={allJobs} setEditingJob={setEditingJob} setView={setView} />}
                </div>
            </main>
        </div>
    );
};

const LoginScreen = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const handleLogin = (e) => { e.preventDefault(); auth.signInWithEmailAndPassword(email, password); };
    return (
        <div className="fixed inset-0 bg-black flex items-center justify-center font-mono z-[200]">
            <form onSubmit={handleLogin} className="w-full max-w-sm p-8 bg-zinc-950 border border-zinc-800 space-y-6 shadow-2xl">
                <h2 className="text-white font-black uppercase tracking-widest border-b border-orange-500 pb-4 text-center">System Access</h2>
                <input type="email" placeholder="EMAIL" className="w-full bg-zinc-900 border border-zinc-800 p-3 text-white text-xs outline-none focus:border-orange-500" value={email} onChange={e => setEmail(e.target.value)} />
                <input type="password" placeholder="PASSWORD" className="w-full bg-zinc-900 border border-zinc-800 p-3 text-white text-xs outline-none focus:border-orange-500" value={password} onChange={e => setPassword(e.target.value)} />
                <button type="submit" className="w-full theme-bg text-black font-black py-4 text-[10px] uppercase tracking-widest transition-all hover:bg-white">Connect</button>
            </form>
        </div>
    );
};

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(<App />);
