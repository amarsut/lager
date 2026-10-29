// settings.js

const SafeIcon = React.memo(({ name, size = 16, className = "" }) => (
    <span className={`inline-flex items-center justify-center shrink-0 ${className}`}>
        <window.Icon name={name} size={size} />
    </span>
));

const SettingToggle = ({ label, description, icon, active, onChange, danger = false }) => (
    <div 
        onClick={() => onChange(!active)}
        className="flex items-center justify-between p-4 sm:p-5 bg-white dark:bg-[#182032] border border-zinc-200 dark:border-white/5 rounded-2xl cursor-pointer hover:shadow-md transition-all group"
    >
        <div className="flex items-center gap-4 pr-4">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 transition-colors ${active ? (danger ? 'bg-red-50 text-red-500 dark:bg-red-500/10 dark:text-red-400' : 'bg-orange-50 text-orange-500 dark:bg-orange-500/10 dark:text-orange-400') : 'bg-zinc-100 dark:bg-black/20 text-zinc-400 group-hover:text-zinc-600 dark:group-hover:text-zinc-200'}`}>
                <SafeIcon name={icon} size={18} />
            </div>
            <div className="flex flex-col">
                <span className="text-[13px] font-bold text-zinc-900 dark:text-white leading-tight mb-0.5">{label}</span>
                <span className="text-[11px] text-zinc-500 dark:text-zinc-400 leading-snug">{description}</span>
            </div>
        </div>
        <div className={`w-11 h-6 rounded-full flex items-center p-1 shrink-0 transition-colors duration-300 ${active ? (danger ? 'bg-red-500' : 'bg-orange-500') : 'bg-zinc-200 dark:bg-white/10'}`}>
            <div className={`w-4 h-4 rounded-full bg-white shadow-sm transform transition-transform duration-300 ${active ? 'translate-x-5' : 'translate-x-0'}`}></div>
        </div>
    </div>
);

window.SettingsView = React.memo(({ user, enableJobLimit, setEnableJobLimit, isDark, setIsDark, isNightLight, setIsNightLight }) => {
    
    const [isCompact, setIsCompact] = React.useState(() => localStorage.getItem('autogrid_table_density') === 'compact');
    const [cacheCleared, setCacheCleared] = React.useState(false);

    const handleCompactToggle = (val) => {
        setIsCompact(val);
        localStorage.setItem('autogrid_table_density', val ? 'compact' : 'spacious');
        setTimeout(() => window.location.reload(), 300); // Tvingar omladdning för att applicera överallt
    };

    const clearLocalVehicleCache = () => {
        if(confirm("Vill du rensa den lokala cachen för fordonsdata? Appen kommer att hämta ny data från databasen nästa gång bilarna visas.")){
            localStorage.removeItem('os_vehicle_cache');
            setCacheCleared(true);
            setTimeout(() => setCacheCleared(false), 3000);
        }
    };

    React.useEffect(() => {
        if (window.lucide) window.lucide.createIcons();
    });

    return (
        <div className="relative w-full max-w-[1400px] ml-0 animate-in fade-in slide-in-from-left-4 duration-700 pb-20 lg:pb-12">
            <div className="absolute top-0 left-[-10%] w-[60%] h-[400px] bg-orange-500/10 dark:bg-orange-500/5 blur-[120px] rounded-full pointer-events-none -z-10 hidden lg:block"></div>

            <div className="flex items-center gap-3 md:gap-4 mb-6 sm:mb-8 px-4 pt-4 lg:px-0 lg:pt-0">
                <div className="relative group cursor-default shrink-0">
                    <div className="absolute inset-0 bg-orange-500/40 blur-lg rounded-full transition-all duration-700 group-hover:bg-orange-500/60" />
                    <div className="relative w-10 h-10 md:w-12 md:h-12 rounded-xl flex items-center justify-center text-white shadow-md border border-white/20 transition-colors bg-gradient-to-br from-orange-400 to-orange-600">
                        <SafeIcon name="settings" size={20} className="md:w-6 md:h-6" />
                    </div>
                </div>
                <div className="flex flex-col">
                    <h1 className="text-xl md:text-2xl font-black text-zinc-900 dark:text-white uppercase tracking-tight leading-none">
                        SYSTEM<span className="text-zinc-400 dark:text-zinc-500 font-light">INSTÄLLNINGAR</span>
                    </h1>
                    <p className="text-[9px] md:text-[10px] font-bold text-orange-500 dark:text-orange-400 uppercase tracking-widest mt-1">
                        Konfiguration & Prestanda
                    </p>
                </div>
            </div>

            {/* Begränsar bredden på själva korten så de inte blir för utdragna */}
            <div className="px-4 lg:px-0 space-y-8 max-w-3xl">
                
                <div className="space-y-3">
                    <h3 className="text-[11px] font-bold uppercase tracking-widest text-zinc-500 flex items-center gap-2">
                        <SafeIcon name="database" size={14} /> Databas & Prestanda
                    </h3>
                    <div className="flex flex-col gap-3">
                        <SettingToggle 
                            label="Prestandaspärr (150 senaste uppdragen)" 
                            description="Hämtar endast de 150 senast skapade uppdragen för snabbare laddtider. Slå av tillfälligt för att söka i hela arkivet." 
                            icon="zap" 
                            active={enableJobLimit} 
                            onChange={setEnableJobLimit} 
                        />
                        <div className="flex items-center justify-between p-4 sm:p-5 bg-white dark:bg-[#182032] border border-zinc-200 dark:border-white/5 rounded-2xl">
                            <div className="flex items-center gap-4 pr-4">
                                <div className="w-10 h-10 rounded-xl bg-zinc-100 dark:bg-black/20 text-zinc-400 flex items-center justify-center shrink-0">
                                    <SafeIcon name="hard-drive" size={18} />
                                </div>
                                <div className="flex flex-col">
                                    <span className="text-[13px] font-bold text-zinc-900 dark:text-white leading-tight mb-0.5">Rensa lokal fordons-cache</span>
                                    <span className="text-[11px] text-zinc-500 dark:text-zinc-400 leading-snug">Rensar sparade specifikationer på din enhet och tvingar fram ny hämtning.</span>
                                </div>
                            </div>
                            <button 
                                onClick={clearLocalVehicleCache}
                                className={`px-4 py-2 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all shadow-sm flex items-center gap-1.5 active:scale-95 shrink-0 ${cacheCleared ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/20' : 'bg-white dark:bg-[#25324d] text-zinc-700 dark:text-zinc-300 border border-zinc-200 dark:border-white/10 hover:border-orange-500 hover:text-orange-500'}`}
                            >
                                <SafeIcon name={cacheCleared ? "check" : "trash-2"} size={14} /> 
                                {cacheCleared ? "Rensad" : "Rensa Cache"}
                            </button>
                        </div>
                    </div>
                </div>

                <div className="space-y-3">
                    <h3 className="text-[11px] font-bold uppercase tracking-widest text-zinc-500 flex items-center gap-2">
                        <SafeIcon name="monitor" size={14} /> Utseende & Gränssnitt
                    </h3>
                    <div className="flex flex-col gap-3">
                        <SettingToggle 
                            label="Mörkt Läge (Dark Mode)" 
                            description="Växla mellan ljust och mörkt gränssnitt." 
                            icon="moon" 
                            active={isDark} 
                            onChange={setIsDark} 
                        />
                        {!isDark && (
                            <SettingToggle 
                                label="Nattljus (Varmare färger)" 
                                description="Aktiverar ett skärmfilter med varmare toner för att skona ögonen." 
                                icon="sun" 
                                active={isNightLight} 
                                onChange={setIsNightLight} 
                            />
                        )}
                        <SettingToggle 
                            label="Kompakt Tabellvy (Dashboard)" 
                            description="Fäller ihop rader och komprimerar Dashboarden som standard." 
                            icon="align-justify" 
                            active={isCompact} 
                            onChange={handleCompactToggle} 
                        />
                    </div>
                </div>

                <div className="space-y-3">
                    <h3 className="text-[11px] font-bold uppercase tracking-widest text-zinc-500 flex items-center gap-2">
                        <SafeIcon name="user" size={14} /> Konto
                    </h3>
                    <div className="bg-white dark:bg-[#182032] border border-zinc-200 dark:border-white/5 rounded-2xl p-5 shadow-sm flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <div className="w-10 h-10 bg-zinc-800 flex items-center justify-center font-black rounded-xl text-white shadow-sm uppercase text-[14px]">
                                {user?.email ? user.email[0] : 'U'}
                            </div>
                            <div className="flex flex-col">
                                <span className="text-[13px] font-bold text-zinc-900 dark:text-white uppercase tracking-wider">{user?.displayName || 'Operator'}</span>
                                <span className="text-[11px] text-zinc-500 font-mono tracking-tighter">{user?.email}</span>
                            </div>
                        </div>
                        <button 
                            onClick={() => window.firebase.auth().signOut()}
                            className="px-4 py-2 bg-red-50 text-red-600 dark:bg-red-500/10 dark:text-red-400 border border-red-200 dark:border-red-500/20 hover:bg-red-100 dark:hover:bg-red-500/20 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all shadow-sm flex items-center gap-1.5 active:scale-95"
                        >
                            <SafeIcon name="log-out" size={14} /> Logga ut
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
});
