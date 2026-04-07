// statistics.js

const SafeIcon = ({ name, size = 16, className = "" }) => (
    <span className="inline-flex items-center justify-center shrink-0">
        <window.Icon name={name} size={size} className={className} />
    </span>
);

const SectionHeader = ({ title, sub, icon }) => (
    <div className="flex items-start gap-3 mb-4 sm:mb-6 pb-3 sm:pb-4 border-b border-zinc-200/50 dark:border-white/5">
        <div className="mt-1 h-5 w-1 bg-gradient-to-b from-orange-400 to-orange-600 rounded-full shadow-[0_0_10px_rgba(249,115,22,0.4)]" />
        <div>
            <div className="flex items-center gap-2 text-zinc-900 dark:text-white">
                <SafeIcon name={icon} size={14} className="text-zinc-400 dark:text-zinc-500" />
                <h3 className="text-[12px] sm:text-[13px] font-bold uppercase tracking-widest">{title}</h3>
            </div>
            {sub && <p className="text-[9px] sm:text-[10px] font-medium uppercase tracking-[0.15em] text-zinc-400 dark:text-zinc-500 mt-1">{sub}</p>}
        </div>
    </div>
);

// Bilmärken för statistik-kategorisering
const STAT_BRANDS = { 'Volvo':'volvo', 'BMW':'bmw', 'Audi':'audi', 'VW':'volkswagen', 'Volkswagen':'volkswagen', 'Mercedes':'mercedes', 'Tesla':'tesla', 'Toyota':'toyota', 'Ford':'ford', 'Kia':'kia', 'Porsche':'porsche', 'Skoda':'skoda', 'Nissan':'nissan', 'Peugeot':'peugeot', 'Renault':'renault' };
const getBrandCategory = (model) => {
    if (!model) return 'Okänt märke';
    const l = model.toLowerCase();
    for (const [name, slug] of Object.entries(STAT_BRANDS)) {
        if (l.includes(name.toLowerCase()) || l.includes(slug)) return name;
    }
    if (l.includes('merc') || l.includes('benz')) return 'Mercedes';
    return 'Övriga märken';
};

window.StatisticsView = ({ allJobs }) => {
    const currentYear = new Date().getFullYear().toString();
    const [selectedYear, setSelectedYear] = React.useState(currentYear);

    // Datalys och Beräkningar
    const stats = React.useMemo(() => {
        const validJobs = allJobs.filter(j => !j.deleted && j.datum);
        
        const yearsSet = new Set(validJobs.map(j => j.datum.substring(0, 4)));
        yearsSet.add(currentYear); 
        const availableYears = Array.from(yearsSet).sort().reverse();

        const jobsForYear = validJobs.filter(j => j.datum.startsWith(selectedYear));
        const prevYearStr = (parseInt(selectedYear) - 1).toString();
        const jobsForPrevYear = validJobs.filter(j => j.datum.startsWith(prevYearStr));
        
        let totalBookedValue = 0;
        let actualRevenue = 0;
        let prevActualRevenue = 0;
        
        let monthlyActualRev = Array(12).fill(0);
        let monthlyBookedRev = Array(12).fill(0);
        let monthlyCounts = Array(12).fill(0);
        
        let packageCount = {};
        let customerRev = {};
        let brandRev = {};
        let completedJobsCount = 0;

        // Räkna fjolårets omsättning för jämförelse
        jobsForPrevYear.forEach(j => {
            if (['KLAR', 'FAKTURERAS'].includes(j.status)) prevActualRevenue += (parseInt(j.kundpris) || 0);
        });

        jobsForYear.forEach(j => {
            const price = parseInt(j.kundpris) || 0;
            const isDone = ['KLAR', 'FAKTURERAS'].includes(j.status);
            
            totalBookedValue += price;

            const monthIdx = parseInt(j.datum.substring(5, 7)) - 1;
            
            if (monthIdx >= 0 && monthIdx <= 11) {
                if (isDone) {
                    monthlyActualRev[monthIdx] += price;
                } else {
                    monthlyBookedRev[monthIdx] += price;
                }
                monthlyCounts[monthIdx] += 1;
            }

            if (isDone) {
                actualRevenue += price;
                completedJobsCount++;

                const pkg = j.paket || 'Standard';
                packageCount[pkg] = (packageCount[pkg] || 0) + 1;

                const cust = j.kundnamn || 'Okänd Kund';
                customerRev[cust] = (customerRev[cust] || 0) + price;
                
                const brand = getBrandCategory(j.bilmodell);
                brandRev[brand] = (brandRev[brand] || 0) + price;
            }
        });

        // Räkna ut trend (Procentuell ändring mot fg år)
        let trend = 0;
        if (prevActualRevenue > 0) {
            trend = Math.round(((actualRevenue - prevActualRevenue) / prevActualRevenue) * 100);
        } else if (actualRevenue > 0) {
            trend = 100; // Om vi inte fanns förra året men har omsättning i år
        }

        const maxMonthRevenue = Math.max(...monthlyActualRev.map((val, i) => val + monthlyBookedRev[i]), 1);
        const topPackages = Object.entries(packageCount).sort((a, b) => b[1] - a[1]).slice(0, 5);
        const topCustomers = Object.entries(customerRev).sort((a, b) => b[1] - a[1]).slice(0, 5);
        const topBrands = Object.entries(brandRev).sort((a, b) => b[1] - a[1]).slice(0, 5);
        
        const avgPrice = completedJobsCount > 0 ? actualRevenue / completedJobsCount : 0;
        const completionRate = jobsForYear.length > 0 ? Math.round((completedJobsCount / jobsForYear.length) * 100) : 0;

        return { 
            availableYears, totalBookedValue, actualRevenue, prevActualRevenue, trend,
            monthlyActualRev, monthlyBookedRev, monthlyCounts, maxMonthRevenue, 
            topPackages, topCustomers, topBrands, totalJobs: jobsForYear.length, 
            completedJobsCount, avgPrice, completionRate
        };
    }, [allJobs, selectedYear, currentYear]);

    React.useEffect(() => {
        if (window.lucide) window.lucide.createIcons();
    });

    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'Maj', 'Jun', 'Jul', 'Aug', 'Sep', 'Okt', 'Nov', 'Dec'];

    return (
        <div className="relative max-w-[1400px] w-full animate-in fade-in slide-in-from-left-4 duration-700 pb-0 ml-0">
            <div className="absolute top-0 left-[-10%] w-[60%] h-[400px] bg-orange-500/10 dark:bg-orange-500/5 blur-[120px] rounded-full pointer-events-none -z-10 hidden lg:block"></div>

            {/* HEADER */}
            <div className="flex flex-col md:flex-row md:items-center justify-between mb-4 sm:mb-6 pb-4 sm:pb-6 border-b border-zinc-200 dark:border-white/5 gap-4 px-2 sm:px-4 pt-4 lg:px-0 lg:pt-0">
                <div className="flex items-center gap-3 sm:gap-5">
                    <div className="relative group cursor-default shrink-0">
                        <div className="absolute inset-0 bg-orange-500/40 blur-xl rounded-full transition-all duration-700 group-hover:bg-orange-500/60" />
                        <div className="relative w-10 h-10 sm:w-14 sm:h-14 rounded-xl sm:rounded-2xl flex items-center justify-center text-white shadow-xl border border-white/20 transition-colors bg-gradient-to-br from-orange-400 to-orange-600">
                            <SafeIcon name="bar-chart-2" size={20} className="sm:w-6 sm:h-6" />
                        </div>
                    </div>
                    <div className="flex flex-col">
                        <h1 className="text-xl sm:text-3xl font-black text-black dark:text-white uppercase tracking-tight leading-none">
                            ANALYS <span className="text-zinc-500 dark:text-zinc-500 font-light">& STATISTIK</span>
                        </h1>
                        <p className="text-[9px] sm:text-[11px] font-bold text-orange-500 dark:text-orange-400 uppercase tracking-widest mt-1 sm:mt-1.5 flex items-center gap-1.5 sm:gap-2">
                            <span className="w-1.5 h-1.5 rounded-full bg-orange-500 animate-pulse"></span>
                            Finansiell Översikt
                        </p>
                    </div>
                </div>

                {/* ÅR-VÄLJARE */}
                <div className="relative z-10 flex items-center bg-white dark:bg-[#1a2235] border border-zinc-200 dark:border-white/5 rounded-xl shadow-sm p-1 overflow-x-auto custom-scrollbar">
                    {stats.availableYears.map(year => (
                        <button 
                            key={year}
                            onClick={() => setSelectedYear(year)}
                            className={`py-2 px-4 sm:px-6 text-[10px] sm:text-[12px] font-bold uppercase tracking-widest rounded-lg transition-all whitespace-nowrap ${selectedYear === year ? 'bg-orange-50 dark:bg-orange-500/10 text-orange-600 dark:text-orange-400 shadow-sm' : 'text-zinc-400 hover:text-zinc-900 dark:hover:text-white'}`}
                        >
                            {year}
                        </button>
                    ))}
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-3 sm:gap-6 px-0 sm:px-4 lg:px-0 mb-8">
                
                {/* VÄNSTER KOLUMN (Huvud KPI:er & Diagram) */}
                <div className="lg:col-span-8 space-y-3 sm:space-y-6">
                    
                    {/* KPI KORT */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
                        <div className="bg-white/80 dark:bg-[#182032]/80 backdrop-blur-xl border border-zinc-200/80 dark:border-white/5 rounded-2xl sm:rounded-3xl p-5 sm:p-6 shadow-sm relative overflow-hidden group">
                            <window.Icon name="dollar-sign" size={80} className="absolute -right-4 -bottom-4 text-zinc-100 dark:text-white/5 group-hover:text-emerald-500/10 transition-colors" />
                            <div className="text-[9px] sm:text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-2 flex items-center justify-between relative z-10">
                                <span className="flex items-center gap-1.5"><SafeIcon name="check-circle" size={12} className="text-emerald-500" /> Faktisk Omsättning</span>
                                {/* TREND INDIKATOR */}
                                {stats.trend !== 0 && selectedYear === currentYear && (
                                    <span className={`px-1.5 py-0.5 rounded text-[8px] font-black flex items-center gap-0.5 ${stats.trend > 0 ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400' : 'bg-red-50 text-red-600 dark:bg-red-500/10 dark:text-red-400'}`}>
                                        <SafeIcon name={stats.trend > 0 ? 'trending-up' : 'trending-down'} size={8} />
                                        {stats.trend > 0 ? '+' : ''}{stats.trend}%
                                    </span>
                                )}
                            </div>
                            <div className="text-2xl sm:text-3xl font-light tracking-tighter text-zinc-900 dark:text-white relative z-10">
                                {stats.actualRevenue.toLocaleString()} <span className="text-[10px] sm:text-[12px] font-bold text-zinc-400 uppercase tracking-widest ml-1">kr</span>
                            </div>
                            <div className="text-[9px] sm:text-[10px] text-zinc-500 mt-2 font-medium relative z-10">Totalt inkl. inbokat: {stats.totalBookedValue.toLocaleString()} kr</div>
                        </div>

                        <div className="bg-white/80 dark:bg-[#182032]/80 backdrop-blur-xl border border-zinc-200/80 dark:border-white/5 rounded-2xl sm:rounded-3xl p-5 sm:p-6 shadow-sm relative overflow-hidden group">
                            <window.Icon name="trending-up" size={80} className="absolute -right-4 -bottom-4 text-zinc-100 dark:text-white/5 group-hover:text-orange-500/10 transition-colors" />
                            <div className="text-[9px] sm:text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-2 flex items-center gap-1.5 relative z-10">
                                <SafeIcon name="tag" size={12} className="text-orange-500" /> Snittpris per uppdrag
                            </div>
                            <div className="text-2xl sm:text-3xl font-light tracking-tighter text-zinc-900 dark:text-white relative z-10">
                                {Math.round(stats.avgPrice).toLocaleString()} <span className="text-[10px] sm:text-[12px] font-bold text-zinc-400 uppercase tracking-widest ml-1">kr</span>
                            </div>
                            <div className="text-[9px] sm:text-[10px] text-zinc-500 mt-2 font-medium relative z-10">Baserat på {stats.completedJobsCount} avslutade jobb</div>
                        </div>

                        <div className="bg-white/80 dark:bg-[#182032]/80 backdrop-blur-xl border border-zinc-200/80 dark:border-white/5 rounded-2xl sm:rounded-3xl p-5 sm:p-6 shadow-sm relative overflow-hidden group">
                            <window.Icon name="activity" size={80} className="absolute -right-4 -bottom-4 text-zinc-100 dark:text-white/5 group-hover:text-blue-500/10 transition-colors" />
                            <div className="text-[9px] sm:text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-2 flex items-center gap-1.5 relative z-10">
                                <SafeIcon name="target" size={12} className="text-blue-500" /> Avslutade Jobb
                            </div>
                            <div className="text-2xl sm:text-3xl font-light tracking-tighter text-zinc-900 dark:text-white relative z-10">
                                {stats.completionRate}<span className="text-[14px] sm:text-[18px] font-bold text-orange-500 ml-1">%</span>
                            </div>
                            <div className="text-[9px] sm:text-[10px] text-zinc-500 mt-2 font-medium relative z-10">Av totalt {stats.totalJobs} inbokade uppdrag</div>
                        </div>
                    </div>

                    {/* MÅNADSDIAGRAM (Nu med scroll på mobilen och stacked bars) */}
                    <div className="bg-white/80 dark:bg-[#182032]/80 backdrop-blur-xl border border-zinc-200/80 dark:border-white/5 rounded-2xl sm:rounded-3xl p-4 sm:p-8 shadow-sm overflow-hidden">
                        
                        <div className="flex items-center justify-between">
                            <SectionHeader title="Månadsomsättning" sub={`Fakturerat och inbokat under ${selectedYear}`} icon="bar-chart" />
                            {/* Legend */}
                            <div className="hidden sm:flex items-center gap-3 text-[9px] font-bold uppercase tracking-widest text-zinc-500">
                                <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-orange-500"></span> Fakturerat</span>
                                <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-orange-300 dark:bg-orange-500/40"></span> Inbokat</span>
                            </div>
                        </div>
                        
                        {/* Wrapper för mobil-scroll */}
                        {/* Wrapper för mobil-scroll */}
                        <div className="w-full overflow-x-auto custom-scrollbar pb-2 -mx-2 px-2 sm:mx-0 sm:px-0">
                            {/* Lade till px-2 på mobilen så staplarna får lite andrum från kanten */}
                            <div className="flex items-end justify-between h-48 sm:h-56 gap-2 sm:gap-4 mt-12 min-w-[450px] sm:min-w-0 px-2 sm:px-0">
                                {months.map((month, i) => {
                                    const actual = stats.monthlyActualRev[i];
                                    const booked = stats.monthlyBookedRev[i];
                                    const total = actual + booked;
                                    
                                    const totalPercent = total === 0 ? 0 : Math.max((total / stats.maxMonthRevenue) * 100, 5); 
                                    const actualPercent = total === 0 ? 0 : (actual / total) * 100;
                                    const bookedPercent = total === 0 ? 0 : (booked / total) * 100;

                                    // FIX: Smart Tooltip-positionering! Jan=Vänster, Dec=Höger, Resten=Mitten
                                    const tooltipPositionClass = i === 0 ? 'left-0 items-start' : i === 11 ? 'right-0 items-end' : 'left-1/2 -translate-x-1/2 items-center';

                                    return (
                                        <div key={i} className="flex flex-col items-center flex-1 h-full justify-end group relative cursor-default">
                                            
                                            {/* Hover Tooltip */}
                                            <div className={`absolute -top-12 opacity-0 group-hover:opacity-100 transition-all duration-300 flex flex-col pointer-events-none z-20 ${tooltipPositionClass}`}>
                                                <div className="bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 text-[10px] font-bold px-3 py-1.5 rounded-lg shadow-xl flex flex-col gap-0.5 whitespace-nowrap">
                                                    {actual > 0 && <span className="text-orange-400 dark:text-orange-600">Klar: {actual.toLocaleString()} kr</span>}
                                                    {booked > 0 && <span className="text-zinc-400 dark:text-zinc-500">Bokat: {booked.toLocaleString()} kr</span>}
                                                    {actual === 0 && booked === 0 && <span>0 kr</span>}
                                                </div>
                                            </div>

                                            {/* Stapeln */}
                                            <div className="flex-1 w-full max-w-[32px] sm:max-w-[40px] bg-zinc-100 dark:bg-[#1a2235] rounded-t-lg flex flex-col justify-end overflow-hidden relative">
                                                <div className="w-full transition-all duration-1000 ease-out flex flex-col justify-end" style={{ height: `${totalPercent}%` }}>
                                                    {/* Inbokad del (övre) */}
                                                    {bookedPercent > 0 && (
                                                        <div className="w-full bg-orange-300 dark:bg-orange-500/40 transition-all duration-1000 group-hover:brightness-110" style={{ height: `${bookedPercent}%` }}></div>
                                                    )}
                                                    {/* Fakturerad del (undre) */}
                                                    {actualPercent > 0 && (
                                                        <div className="w-full bg-gradient-to-t from-orange-600 to-orange-400 transition-all duration-1000 group-hover:brightness-110" style={{ height: `${actualPercent}%` }}></div>
                                                    )}
                                                </div>
                                            </div>
                                            
                                            {/* Etiketter */}
                                            <div className="mt-2 sm:mt-3 flex flex-col items-center">
                                                <span className={`text-[9px] sm:text-[10px] font-bold uppercase tracking-widest transition-colors ${total > 0 ? 'text-zinc-600 dark:text-zinc-300' : 'text-zinc-400 dark:text-zinc-600'}`}>
                                                    {month}
                                                </span>
                                                {stats.monthlyCounts[i] > 0 && (
                                                    <span className="text-[7px] sm:text-[8px] text-zinc-400 mt-0.5">{stats.monthlyCounts[i]} st</span>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    </div>
                </div>

                {/* HÖGER KOLUMN (Topplistor) */}
                <div className="lg:col-span-4 space-y-3 sm:space-y-6">
                    
                    {/* BÄSTA KUNDERNA */}
                    <div className="bg-white/80 dark:bg-[#182032]/80 backdrop-blur-xl border border-zinc-200/80 dark:border-white/5 rounded-2xl sm:rounded-3xl p-5 sm:p-6 shadow-sm">
                        <SectionHeader title="Toppkunder" sub="Genererad omsättning i år" icon="users" />
                        
                        <div className="space-y-3 sm:space-y-4 mt-2">
                            {stats.topCustomers.length > 0 ? stats.topCustomers.map(([name, revenue], index) => {
                                const percentage = Math.round((revenue / stats.actualRevenue) * 100);
                                return (
                                    <div key={name} className="group">
                                        <div className="flex justify-between items-center mb-1.5">
                                            <span className="text-[11px] sm:text-[12px] font-bold text-zinc-700 dark:text-zinc-300 truncate pr-4 group-hover:text-orange-500 transition-colors">
                                                {index + 1}. {name}
                                            </span>
                                            <span className="text-[10px] sm:text-[11px] font-mono font-bold text-zinc-900 dark:text-white shrink-0">
                                                {revenue.toLocaleString()} kr
                                            </span>
                                        </div>
                                        <div className="w-full bg-zinc-100 dark:bg-[#1a2235] h-1.5 rounded-full overflow-hidden">
                                            <div className="bg-orange-500 h-full transition-all duration-1000 opacity-80 group-hover:opacity-100" style={{ width: `${percentage}%` }}></div>
                                        </div>
                                    </div>
                                );
                            }) : (
                                <div className="text-[10px] sm:text-[11px] text-zinc-500 font-bold uppercase tracking-widest text-center py-4">Ingen data än</div>
                            )}
                        </div>
                    </div>

                    {/* POPULÄRASTE TJÄNSTERNA */}
                    <div className="bg-white/80 dark:bg-[#182032]/80 backdrop-blur-xl border border-zinc-200/80 dark:border-white/5 rounded-2xl sm:rounded-3xl p-5 sm:p-6 shadow-sm">
                        <SectionHeader title="Populära Tjänster" sub="Mest utförda uppdrag" icon="layers" />
                        
                        <div className="space-y-3 sm:space-y-4 mt-2">
                            {stats.topPackages.length > 0 ? stats.topPackages.map(([pkg, count]) => {
                                const percentage = Math.round((count / stats.completedJobsCount) * 100);
                                return (
                                    <div key={pkg} className="group">
                                        <div className="flex justify-between items-center mb-1.5">
                                            <span className="text-[11px] sm:text-[12px] font-bold text-zinc-700 dark:text-zinc-300 truncate pr-4 group-hover:text-emerald-500 transition-colors">
                                                {pkg}
                                            </span>
                                            <span className="text-[9px] sm:text-[11px] font-bold text-zinc-500 uppercase tracking-widest shrink-0 bg-zinc-100 dark:bg-white/5 px-2 py-0.5 rounded-md">
                                                {count} st
                                            </span>
                                        </div>
                                        <div className="w-full bg-zinc-100 dark:bg-[#1a2235] h-1.5 rounded-full overflow-hidden">
                                            <div className="bg-emerald-500 h-full transition-all duration-1000 opacity-60 group-hover:opacity-100" style={{ width: `${percentage}%` }}></div>
                                        </div>
                                    </div>
                                );
                            }) : (
                                <div className="text-[10px] sm:text-[11px] text-zinc-500 font-bold uppercase tracking-widest text-center py-4">Ingen data än</div>
                            )}
                        </div>
                    </div>

                    {/* NYTT: TOPPLISTA BILMÄRKEN */}
                    <div className="bg-white/80 dark:bg-[#182032]/80 backdrop-blur-xl border border-zinc-200/80 dark:border-white/5 rounded-2xl sm:rounded-3xl p-5 sm:p-6 shadow-sm">
                        <SectionHeader title="Mest Lönsamma Fordon" sub="Fördelning per bilmärke" icon="truck" />
                        
                        <div className="space-y-3 sm:space-y-4 mt-2">
                            {stats.topBrands.length > 0 ? stats.topBrands.map(([brand, revenue]) => {
                                const percentage = Math.round((revenue / stats.actualRevenue) * 100);
                                return (
                                    <div key={brand} className="group flex items-center gap-3">
                                        {/* Ikon för bilmärket */}
                                        <div className="w-8 h-8 rounded-lg bg-zinc-100 dark:bg-[#1a2235] flex items-center justify-center shrink-0 border border-zinc-200 dark:border-white/5">
                                            {STAT_BRANDS[brand] ? (
                                                <img src={`https://cdn.simpleicons.org/${STAT_BRANDS[brand]}`} className="w-4 h-4 object-contain opacity-70 dark:invert group-hover:opacity-100 transition-opacity"/>
                                            ) : (
                                                <SafeIcon name="car" size={14} className="text-zinc-400"/>
                                            )}
                                        </div>
                                        
                                        <div className="flex-1 min-w-0">
                                            <div className="flex justify-between items-center mb-1.5">
                                                <span className="text-[11px] sm:text-[12px] font-bold text-zinc-700 dark:text-zinc-300 truncate pr-4 group-hover:text-blue-500 transition-colors">
                                                    {brand}
                                                </span>
                                                <span className="text-[9px] sm:text-[11px] font-bold text-zinc-500 uppercase tracking-widest shrink-0">
                                                    {percentage}%
                                                </span>
                                            </div>
                                            <div className="w-full bg-zinc-100 dark:bg-[#1a2235] h-1.5 rounded-full overflow-hidden">
                                                <div className="bg-blue-500 h-full transition-all duration-1000 opacity-60 group-hover:opacity-100" style={{ width: `${percentage}%` }}></div>
                                            </div>
                                        </div>
                                    </div>
                                );
                            }) : (
                                <div className="text-[10px] sm:text-[11px] text-zinc-500 font-bold uppercase tracking-widest text-center py-4">Ingen data än</div>
                            )}
                        </div>
                    </div>

                </div>
            </div>
        </div>
    );
};
