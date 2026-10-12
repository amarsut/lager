// --- IKONER ---
const SunIcon = ({ className }) => <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className={className}><circle cx="12" cy="12" r="4"/><path d="M12 2v2"/><path d="M12 20v2"/><path d="m4.93 4.93 1.41 1.41"/><path d="m17.66 17.66 1.41 1.41"/><path d="M2 12h2"/><path d="M20 12h2"/><path d="m6.34 17.66-1.41 1.41"/><path d="m19.07 4.93-1.41 1.41"/></svg>;
const MoonIcon = ({ className }) => <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z"/></svg>;
const SunsetIcon = ({ className }) => <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M12 10V2"/><path d="m4.93 10.93 1.41 1.41"/><path d="M2 18h20"/><path d="M20 14h2"/><path d="m19.07 10.93-1.41 1.41"/><path d="M22 22H2"/><path d="m8 6 4-4 4 4"/><path d="M16 18a4 4 0 0 0-8 0"/></svg>;
const SettingsIcon = ({ className }) => <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="square" strokeLinejoin="miter" className={className}><path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/><circle cx="12" cy="12" r="3"/></svg>;
const ArrowLeftIcon = ({ className }) => <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="square" strokeLinejoin="miter" className={className}><path d="m12 19-7-7 7-7"/><path d="M19 12H5"/></svg>;
const ChevronDownIcon = ({ className }) => <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="square" strokeLinejoin="miter" className={className}><path d="m6 9 6 6 6-6"/></svg>;
const ClockIcon = ({ className }) => <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="square" strokeLinejoin="miter" className={className}><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg>;
const DownloadIcon = ({ className }) => <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="square" strokeLinejoin="miter" className={className}><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" x2="12" y1="15" y2="3"/></svg>;

// --- SPRÅK / ÖVERSÄTTNINGAR ---
const TRANSLATIONS = {
    bs: {
        greetingMorning: "Dobro jutro, Ajla",
        greetingDay: "Dobar dan, Ajla",
        greetingEvening: "Dobro veče, Ajla",
        weekLong: "Sedmica",
        now: "Trenutno:",
        upcomingRotation: "Naredna rotacija",
        currentWeek: "Ove sedmice",
        nextWeek: "Naredna sedmica",
        settings: "Postavke",
        appearance: "Izgled",
        darkTheme: "Tamna tema",
        language: "Jezik",
        calibrateTitle: "Kalibracija Rasporeda",
        calibrateQ: "Koju smjenu radite OVE sedmice (S.",
        calibrateDesc: "Promijenite ovo ako je raspored ispao iz sinhronizacije.",
        patternTitle: "Uzorak rotacije",
        showMore: "Prikaži više (+10)",
        installApp: "Instaliraj Aplikaciju",
        installDesc: "Dodaj na početni ekran za brzi pristup.",
        shiftNames: { 1: "Smjena 1", 2: "Smjena 2", 3: "Smjena 3" },
        shiftTypes: { 1: "1. Jutarnja", 2: "2. Večernja", 3: "3. Noćna" },
        patterns: { "1,3,2": "1, 3, 2 (Jutarnja → Noćna → Večernja)", "1,2,3": "1, 2, 3 (Jutarnja → Večernja → Noćna)", "3,2,1": "3, 2, 1 (Noćna → Večernja → Jutarnja)" },
        shiftDetails: {
            1: [ { days: "Pon - Čet", hours: "05:48 - 13:48" }, { days: "Petak", hours: "05:48 - 12:00" } ],
            2: [ { days: "Pon - Čet", hours: "13:48 - 21:48" }, { days: "Petak", hours: "Slobodno" } ],
            3: [ { days: "Nedjelja", hours: "20:48 - 05:48" }, { days: "Pon - Čet", hours: "21:48 - 05:48" } ]
        }
    },
    sv: {
        greetingMorning: "God morgon, Ajla",
        greetingDay: "God dag, Ajla",
        greetingEvening: "God kväll, Ajla",
        weekLong: "Vecka",
        now: "Nu:",
        upcomingRotation: "Kommande Rotation",
        currentWeek: "Denna vecka",
        nextWeek: "Nästa vecka",
        settings: "Inställningar",
        appearance: "Utseende",
        darkTheme: "Mörkt tema",
        language: "Språk",
        calibrateTitle: "Kalibrera Schema",
        calibrateQ: "Vad jobbar du DITT NUVARANDE skift (V.",
        calibrateDesc: "Ändra detta om rullschemat har hamnat i osynk.",
        patternTitle: "Rotationsmönster",
        showMore: "Visa mer (+10)",
        installApp: "Installera Appen",
        installDesc: "Spara på hemskärmen för snabb åtkomst.",
        shiftNames: { 1: "Skift 1", 2: "Skift 2", 3: "Skift 3" },
        shiftTypes: { 1: "1:a Morgon", 2: "2:a Kväll", 3: "3:e Natt" },
        patterns: { "1,3,2": "1, 3, 2 (Morgon → Natt → Kväll)", "1,2,3": "1, 2, 3 (Morgon → Kväll → Natt)", "3,2,1": "3, 2, 1 (Natt → Kväll → Morgon)" },
        shiftDetails: {
            1: [ { days: "Mån - Tors", hours: "05:48 - 13:48" }, { days: "Fredag", hours: "05:48 - 12:00" } ],
            2: [ { days: "Mån - Tors", hours: "13:48 - 21:48" }, { days: "Fredag", hours: "Ledig" } ],
            3: [ { days: "Söndag", hours: "20:48 - 05:48" }, { days: "Mån - Tors", hours: "21:48 - 05:48" } ]
        }
    }
};

// --- GRUNDDATA ---
const getShiftBaseInfo = (id) => {
    if (id === 1) return { id: 1, icon: SunIcon, colors: { bg: "bg-blue-50 dark:bg-blue-500/10", text: "text-blue-700 dark:text-blue-400", border: "border-blue-100 dark:border-blue-500/20" } };
    if (id === 2) return { id: 2, icon: SunsetIcon, colors: { bg: "bg-amber-50 dark:bg-amber-500/10", text: "text-amber-700 dark:text-amber-400", border: "border-amber-100 dark:border-amber-500/20" } };
    if (id === 3) return { id: 3, icon: MoonIcon, colors: { bg: "bg-indigo-50 dark:bg-indigo-500/10", text: "text-indigo-700 dark:text-indigo-400", border: "border-indigo-100 dark:border-indigo-500/20" } };
};

const ROTATION_PATTERNS = { "1,3,2": [1, 3, 2], "1,2,3": [1, 2, 3], "3,2,1": [3, 2, 1] };

const getWeekNumber = (date) => {
    const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
    const dayNum = d.getUTCDay() || 7;
    d.setUTCDate(d.getUTCDate() + 4 - dayNum);
    const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
    return Math.ceil((((d - yearStart) / 86400000) + 1) / 7);
};

const getGreeting = (t) => {
    const hour = new Date().getHours();
    if (hour < 10) return t.greetingMorning;
    if (hour < 18) return t.greetingDay;
    return t.greetingEvening;
};

function useLocalStorage(key, initialValue) {
    const [storedValue, setStoredValue] = React.useState(() => {
        try { return window.localStorage.getItem(key) ? JSON.parse(window.localStorage.getItem(key)) : initialValue; } 
        catch (error) { return initialValue; }
    });
    const setValue = (value) => {
        try {
            const valueToStore = value instanceof Function ? value(storedValue) : value;
            setStoredValue(valueToStore);
            window.localStorage.setItem(key, JSON.stringify(valueToStore));
        } catch (error) { console.error(error); }
    };
    return [storedValue, setValue];
}

// --- HUVUDAPP ---
const ShiftApp = () => {
    const [currentView, setCurrentView] = React.useState('HOME');
    const [theme, setTheme] = useLocalStorage('theme', 'light');
    const [language, setLanguage] = useLocalStorage('language', 'bs'); 
    const [rotationKey, setRotationKey] = useLocalStorage('rotationKey', '1,3,2');
    const [visibleWeeks, setVisibleWeeks] = React.useState(13);
    
    const today = new Date();
    const currentWeek = getWeekNumber(today);
    
    // Nuvarande vecka är expanderad som standard
    const [expandedWeek, setExpandedWeek] = React.useState(currentWeek);
    const [deferredPrompt, setDeferredPrompt] = React.useState(null);

    const t = TRANSLATIONS[language];

    const [anchorWeek, setAnchorWeek] = useLocalStorage('anchorWeek', 42);
    const [anchorShiftId, setAnchorShiftId] = useLocalStorage('anchorShiftId', 1);

    // Hantera Tema
    React.useEffect(() => {
        const root = document.documentElement;
        if (theme === 'dark') { root.classList.add('dark'); root.classList.remove('light'); } 
        else { root.classList.add('light'); root.classList.remove('dark'); }
        document.querySelector('meta[name="theme-color"]').setAttribute('content', theme === 'dark' ? '#020617' : '#f8fafc');
    }, [theme]);

    // Fånga upp PWA Install eventet
    React.useEffect(() => {
        window.addEventListener('beforeinstallprompt', (e) => {
            e.preventDefault();
            setDeferredPrompt(e);
        });
    }, []);

    const handleInstallClick = async () => {
        if (deferredPrompt) {
            deferredPrompt.prompt();
            const { outcome } = await deferredPrompt.userChoice;
            if (outcome === 'accepted') setDeferredPrompt(null);
        }
    };

    const calculateShiftForWeek = (targetWeek) => {
        const pattern = ROTATION_PATTERNS[rotationKey];
        const anchorIndex = pattern.indexOf(anchorShiftId);
        let diff = (targetWeek - anchorWeek) % pattern.length;
        if (diff < 0) diff += pattern.length;
        const targetIndex = (anchorIndex + diff) % pattern.length;
        const shiftId = pattern[targetIndex];
        
        return {
            ...getShiftBaseInfo(shiftId),
            name: t.shiftNames[shiftId],
            type: t.shiftTypes[shiftId]
        };
    };

    const upcomingWeeks = Array.from({ length: visibleWeeks }).map((_, i) => {
        const targetDate = new Date(today);
        targetDate.setDate(today.getDate() + (i * 7));
        return { week: getWeekNumber(targetDate), shift: calculateShiftForWeek(getWeekNumber(targetDate)) };
    });

    if (currentView === 'SETTINGS') {
        const currentActiveShiftId = calculateShiftForWeek(currentWeek).id;

        return (
            <div className="min-h-screen px-0 sm:px-4 max-w-md mx-auto animate-in fade-in slide-in-from-right-4 duration-300 pb-12">
                <div className="flex items-center justify-between mb-4 px-4 pt-4">
                    <button onClick={() => setCurrentView('HOME')} className="w-10 h-10 flex items-center justify-center rounded-none bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-300 dark:hover:bg-slate-700 transition-colors">
                        <ArrowLeftIcon className="w-5 h-5" />
                    </button>
                    <h1 className="text-xl font-bold text-slate-800 dark:text-slate-100">{t.settings}</h1>
                    <div className="w-10"></div> {/* Spacer */}
                </div>

                <div className="space-y-6 px-2 sm:px-0">
                    {deferredPrompt && (
                        <div className="bg-emerald-500 text-white rounded-none p-4 flex items-center justify-between shadow-sm cursor-pointer hover:bg-emerald-600 transition-colors" onClick={handleInstallClick}>
                            <div>
                                <h2 className="font-bold text-sm mb-0.5">{t.installApp}</h2>
                                <p className="text-[10px] uppercase tracking-widest opacity-90">{t.installDesc}</p>
                            </div>
                            <DownloadIcon className="w-5 h-5" />
                        </div>
                    )}

                    <div>
                        <h2 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-1.5 ml-1">{t.appearance} & {t.language}</h2>
                        <div className="bg-white dark:bg-slate-900 rounded-none border border-slate-200 dark:border-slate-800 overflow-hidden">
                            <div className="flex items-center justify-between p-4 border-b border-slate-200 dark:border-slate-800">
                                <span className="text-sm font-semibold text-slate-700 dark:text-slate-300">{t.darkTheme}</span>
                                {/* Temaknapp: Nu helt rund */}
                                <button onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')} className={`w-12 h-6 relative transition-colors rounded-full border ${theme === 'dark' ? 'bg-emerald-500 border-emerald-500' : 'bg-slate-200 dark:bg-slate-700 border-slate-300 dark:border-slate-600'}`}>
                                    <span className={`absolute top-0.5 left-0.5 bg-white w-4 h-4 rounded-full transition-transform ${theme === 'dark' ? 'translate-x-6' : 'translate-x-0'}`}></span>
                                </button>
                            </div>
                            <select value={language} onChange={(e) => setLanguage(e.target.value)} className="w-full bg-white dark:bg-slate-900 border-none text-slate-700 dark:text-slate-300 text-sm rounded-none px-4 py-4 outline-none appearance-none font-medium cursor-pointer">
                                <option value="bs">Bosanski</option>
                                <option value="sv">Svenska</option>
                            </select>
                        </div>
                    </div>

                    <div>
                        <h2 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-1.5 ml-1">{t.calibrateTitle}</h2>
                        <div className="bg-white dark:bg-slate-900 rounded-none border border-slate-200 dark:border-slate-800 p-4 mb-4">
                            <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">{t.calibrateQ}{currentWeek})?</label>
                            <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">{t.calibrateDesc}</p>
                            <div className="grid grid-cols-3 gap-2">
                                {[1, 2, 3].map(id => (
                                    <button key={id} onClick={() => { setAnchorWeek(currentWeek); setAnchorShiftId(id); }} className={`py-2 rounded-none text-[11px] font-bold transition-colors border ${currentActiveShiftId === id ? 'bg-emerald-500 text-white border-emerald-500' : 'bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700'}`}>
                                        {t.shiftNames[id]}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="bg-white dark:bg-slate-900 rounded-none border border-slate-200 dark:border-slate-800 p-4">
                            <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">{t.patternTitle}</label>
                            <select value={rotationKey} onChange={(e) => setRotationKey(e.target.value)} className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-sm rounded-none px-4 py-3 outline-none appearance-none font-medium cursor-pointer">
                                <option value="1,3,2">{t.patterns["1,3,2"]}</option>
                                <option value="1,2,3">{t.patterns["1,2,3"]}</option>
                                <option value="3,2,1">{t.patterns["3,2,1"]}</option>
                            </select>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    const current = upcomingWeeks[0];

    return (
        <div className="min-h-screen px-0 sm:px-4 max-w-md mx-auto animate-in fade-in duration-300 pb-12">
            
            <div className="flex justify-between items-center mb-4 px-4 pt-4">
                <div>
                    <h1 className="text-[22px] font-black tracking-tight text-slate-800 dark:text-slate-100 leading-none">
                        {getGreeting(t)}
                    </h1>
                    <div className="flex items-center gap-2 mt-1">
                        <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">
                            {t.weekLong} {current.week}
                        </span>
                        <span className="w-1 h-1 bg-slate-300 dark:bg-slate-700"></span>
                        <span className={`text-xs font-bold uppercase tracking-widest ${current.shift.colors.text}`}>
                            {t.now} {current.shift.type}
                        </span>
                    </div>
                </div>
                <button onClick={() => setCurrentView('SETTINGS')} className="w-10 h-10 rounded-none flex items-center justify-center bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition-colors shadow-sm">
                    <SettingsIcon className="w-5 h-5" />
                </button>
            </div>

            <div className="px-2 sm:px-0">
                <div className="bg-white dark:bg-slate-900 rounded-none shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden">
                    <div className="divide-y divide-slate-100 dark:divide-slate-800/50">
                        {upcomingWeeks.map((item, idx) => {
                            const ItemIcon = item.shift.icon;
                            const isCurrentWeek = idx === 0;
                            const isNextWeek = idx === 1;
                            const isExpanded = expandedWeek === item.week;

                            return (
                                <div key={item.week} className="flex flex-col">
                                    <div 
                                        onClick={() => setExpandedWeek(isExpanded ? null : item.week)}
                                        className={`relative flex items-center justify-between p-4 transition-colors cursor-pointer select-none ${isCurrentWeek ? 'bg-emerald-50/50 dark:bg-emerald-500/10' : 'hover:bg-slate-50 dark:hover:bg-slate-800/50'} ${isExpanded && !isCurrentWeek ? 'bg-slate-50 dark:bg-slate-800/50' : ''}`}
                                    >
                                        {isCurrentWeek && (
                                            <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]"></div>
                                        )}

                                        <div className="flex items-center gap-4">
                                            <div className={`text-lg font-medium w-6 text-center ${isCurrentWeek ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-400 dark:text-slate-500'}`}>
                                                {item.week}
                                            </div>
                                            <div className="flex items-center gap-3">
                                                <div className={`w-9 h-9 rounded-none flex items-center justify-center border ${item.shift.colors.bg} ${item.shift.colors.text} ${item.shift.colors.border}`}>
                                                    <ItemIcon className="w-4 h-4" />
                                                </div>
                                                <div className="flex flex-col">
                                                    <span className={`font-bold leading-tight flex items-center gap-2 ${isCurrentWeek ? 'text-emerald-700 dark:text-emerald-400' : 'text-slate-800 dark:text-slate-200'}`}>
                                                        {item.shift.type}
                                                    </span>
                                                    {isCurrentWeek && (
                                                        <span className="text-[9px] font-extrabold text-emerald-500 uppercase tracking-widest mt-0.5">
                                                            {t.currentWeek}
                                                        </span>
                                                    )}
                                                    {isNextWeek && (
                                                        <span className="text-[9px] font-extrabold text-slate-400 uppercase tracking-widest mt-0.5">
                                                            {t.nextWeek}
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                        
                                        <div className="flex items-center gap-2 sm:gap-3">
                                            <div className={`text-[9px] font-bold uppercase tracking-widest bg-white dark:bg-slate-950 px-2 py-1 rounded-none border ${isCurrentWeek ? 'text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-500/20' : `${item.shift.colors.text}${item.shift.colors.border}`}`}>
                                                {item.shift.name}
                                            </div>
                                            <ChevronDownIcon className={`w-4 h-4 text-slate-400 transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`} />
                                        </div>
                                    </div>
                                    
                                    {isExpanded && (
                                        <div className={`px-4 py-3 border-t border-slate-100 dark:border-slate-800/50 animate-in slide-in-from-top-1 fade-in duration-200 ${isCurrentWeek ? 'bg-emerald-50/30 dark:bg-emerald-900/10' : 'bg-slate-50/50 dark:bg-slate-800/20'}`}>
                                            <div className="space-y-2.5 ml-10 sm:ml-12">
                                                {t.shiftDetails[item.shift.id].map((detail, dIdx) => (
                                                    <div key={dIdx} className="flex justify-between items-center text-[12px] sm:text-[13px]">
                                                        <span className="text-slate-500 dark:text-slate-400 font-medium flex items-center gap-2">
                                                            <ClockIcon className="w-3.5 h-3.5 opacity-60" />
                                                            {detail.days}
                                                        </span>
                                                        <span className={`font-bold ${isCurrentWeek ? 'text-emerald-700 dark:text-emerald-400' : 'text-slate-700 dark:text-slate-300'}`}>
                                                            {detail.hours}
                                                        </span>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </div>
                
                <button onClick={() => setVisibleWeeks(prev => prev + 10)} className="w-full mt-2 py-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-slate-800 dark:hover:text-slate-200 transition-all active:scale-[0.98] shadow-sm rounded-none">
                    {t.showMore}
                </button>
            </div>
        </div>
    );
};

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(<ShiftApp />);
