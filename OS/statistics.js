// statistics.js

const SafeIcon = ({ name, size = 16, className = "" }) => (
    <span className="inline-flex items-center justify-center shrink-0">
        <window.Icon name={name} size={size} className={className} />
    </span>
);

const SectionHeader = ({ title, sub, icon, color = "orange" }) => {
    const colorMap = {
        orange: "from-orange-400 to-orange-600 shadow-[0_0_10px_rgba(249,115,22,0.4)]",
        emerald: "from-emerald-400 to-emerald-600 shadow-[0_0_10px_rgba(16,185,129,0.4)]",
        blue: "from-blue-400 to-blue-600 shadow-[0_0_10px_rgba(59,130,246,0.4)]",
        violet: "from-violet-400 to-violet-600 shadow-[0_0_10px_rgba(139,92,246,0.4)]"
    };

    return (
        <div className="flex items-start gap-2.5 mb-4 pb-3 border-b border-zinc-100 dark:border-white/5">
            <div className={`mt-1 h-4 w-1.5 bg-gradient-to-b ${colorMap[color]} rounded-full`} />
            <div>
                <div className="flex items-center gap-2 text-zinc-900 dark:text-white">
                    <SafeIcon name={icon} size={14} className="text-zinc-400 dark:text-zinc-500" />
                    <h3 className="text-[11px] sm:text-[13px] font-black uppercase tracking-[0.15em] leading-none mt-0.5">{title}</h3>
                </div>
                {sub && <p className="text-[9px] sm:text-[10px] font-bold uppercase tracking-widest text-zinc-400 dark:text-zinc-500 mt-1">{sub}</p>}
            </div>
        </div>
    );
};

const getBrandDisplayName = (slug) => {
    if (!slug) return 'Övriga märken';
    const pretty = {
        'volkswagen': 'Volkswagen', 'bmw': 'BMW', 'mercedes': 'Mercedes-Benz', 'audi': 'Audi',
        'volvo': 'Volvo', 'tesla': 'Tesla', 'toyota': 'Toyota', 'ford': 'Ford', 'kia': 'Kia',
        'porsche': 'Porsche', 'skoda': 'Skoda', 'nissan': 'Nissan', 'peugeot': 'Peugeot',
        'renault': 'Renault', 'seat': 'Seat', 'fiat': 'Fiat', 'honda': 'Honda', 'hyundai': 'Hyundai',
        'mazda': 'Mazda', 'subaru': 'Subaru', 'suzuki': 'Suzuki', 'lexus': 'Lexus', 'chevrolet': 'Chevrolet',
        'citroen': 'Citroën', 'opel': 'Opel', 'dacia': 'Dacia', 'mitsubishi': 'Mitsubishi', 'jaguar': 'Jaguar',
        'dodge': 'Dodge', 'ram': 'RAM', 'cupra': 'Cupra'
    };
    return pretty[slug] || slug.charAt(0).toUpperCase() + slug.slice(1);
};

window.StatisticsView = ({ allJobs }) => {
    const currentYear = new Date().getFullYear().toString();
    const [selectedYear, setSelectedYear] = React.useState(currentYear);
    const [brandMap, setBrandMap] = React.useState({});
    const [hoveredMonth, setHoveredMonth] = React.useState(null);

    React.useEffect(() => {
        if (window.db) {
            window.db.collection('vehicleSpecs').get().then(snap => {
                const m = {};
                snap.forEach(doc => {
                    const data = doc.data();
                    const cleanReg = doc.id.toUpperCase().replace(/\s+/g, '');
                    if (data.brand_manual) m[cleanReg] = data.brand_manual;
                    else if (data.fabrikat || data.model) {
                        const found = window.getVehicleBrand ? window.getVehicleBrand(`${data.fabrikat || ''} ${data.model || ''}`) : null;
                        if (found) m[cleanReg] = found;
                    }
                });
                setBrandMap(m);
            });
        }
    }, []);

    const stats = React.useMemo(() => {
        const validJobs = allJobs.filter(j => !j.deleted && j.datum);
        const yearsSet = new Set(validJobs.map(j => j.datum.substring(0, 4)));
        yearsSet.add(currentYear); 
        const availableYears = Array.from(yearsSet).sort().reverse();

        const jobsForYear = validJobs.filter(j => j.datum.startsWith(selectedYear));
        const prevYearStr = (parseInt(selectedYear) - 1).toString();
        const jobsForPrevYear = validJobs.filter(j => j.datum.startsWith(prevYearStr));
        
        let totalBookedValue = 0, actualRevenue = 0, prevActualRevenue = 0;
        let pipeline = { offererat: 0, bokad: 0, klart: 0 };
        
        let monthlyActualRev = Array(12).fill(0);
        let monthlyBookedRev = Array(12).fill(0);
        let monthlyCounts = Array(12).fill(0);
        
        let packageCount = {}, customerRev = {}, brandRev = {}, completedJobsCount = 0;
        let bestMonth = { index: -1, revenue: 0 };

        jobsForPrevYear.forEach(j => {
            if (['KLAR', 'FAKTURERAS'].includes(j.status)) prevActualRevenue += (parseInt(j.kundpris) || 0);
        });

        jobsForYear.forEach(j => {
            const price = parseInt(j.kundpris) || 0;
            const status = j.status || 'BOKAD';
            const isDone = ['KLAR', 'FAKTURERAS'].includes(status);
            
            if (status === 'OFFERERAD') pipeline.offererat += price;
            if (status === 'BOKAD') pipeline.bokad += price;
            if (isDone) pipeline.klart += price;

            totalBookedValue += price;
            const monthIdx = parseInt(j.datum.substring(5, 7)) - 1;
            
            if (monthIdx >= 0 && monthIdx <= 11) {
                if (isDone) monthlyActualRev[monthIdx] += price;
                else monthlyBookedRev[monthIdx] += price;
                monthlyCounts[monthIdx] += 1;
            }

            if (isDone) {
                actualRevenue += price;
                completedJobsCount++;

                const pkg = j.paket || 'Standard';
                packageCount[pkg] = (packageCount[pkg] || 0) + 1;

                const cust = j.kundnamn || 'Okänd Kund';
                customerRev[cust] = (customerRev[cust] || 0) + price;
                
                let brandSlug = null;
                if (j.regnr) {
                    const cleanReg = j.regnr.toUpperCase().replace(/\s+/g, '');
                    if (brandMap[cleanReg]) brandSlug = brandMap[cleanReg];
                }
                if (!brandSlug && window.getVehicleBrand) brandSlug = window.getVehicleBrand(j.bilmodell);

                const brandName = getBrandDisplayName(brandSlug);
                brandRev[brandName] = (brandRev[brandName] || 0) + price;
            }
        });

        monthlyActualRev.forEach((rev, i) => {
            if (rev > bestMonth.revenue) bestMonth = { index: i, revenue: rev };
        });

        let trend = prevActualRevenue > 0 ? Math.round(((actualRevenue - prevActualRevenue) / prevActualRevenue) * 100) : (actualRevenue > 0 ? 100 : 0);

        const maxMonthRevenue = Math.max(...monthlyActualRev.map((val, i) => val + monthlyBookedRev[i]), 1);
        const topPackages = Object.entries(packageCount).sort((a, b) => b[1] - a[1]).slice(0, 5);
        const topCustomers = Object.entries(customerRev).sort((a, b) => b[1] - a[1]).slice(0, 5);
        const topBrands = Object.entries(brandRev).sort((a, b) => b[1] - a[1]).slice(0, 6);
        
        const avgPrice = completedJobsCount > 0 ? actualRevenue / completedJobsCount : 0;
        const completionRate = jobsForYear.length > 0 ? Math.round((completedJobsCount / jobsForYear.length) * 100) : 0;

        return { 
            availableYears, totalBookedValue, actualRevenue, prevActualRevenue, trend,
            monthlyActualRev, monthlyBookedRev, monthlyCounts, maxMonthRevenue, 
            topPackages, topCustomers, topBrands, totalJobs: jobsForYear.length, 
            completedJobsCount, avgPrice, completionRate, bestMonth, pipeline
        };
    }, [allJobs, selectedYear, currentYear, brandMap]);

    React.useEffect(() => { if (window.lucide) window.lucide.createIcons(); });

    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'Maj', 'Jun', 'Jul', 'Aug', 'Sep', 'Okt', 'Nov', 'Dec'];
    const fullMonths = ['Januari', 'Februari', 'Mars', 'April', 'Maj', 'Juni', 'Juli', 'Augusti', 'September', 'Oktober', 'November', 'December'];

    return (
        <div className="relative w-full max-w-[1600px] animate-in fade-in slide-in-from-left-4 duration-500 pb-8 px-2 md:px-4 lg:px-6 ml-0">
            
            <div className="absolute top-0 left-[-5%] w-[40%] h-[400px] bg-gradient-to-br from-orange-500/10 via-emerald-500/5 to-transparent blur-[100px] rounded-full pointer-events-none -z-10 hidden lg:block"></div>

            {/* HEADER */}
            <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-4 pt-4 border-b border-zinc-200/50 dark:border-white/5 pb-4 gap-4">
                <div className="flex items-center gap-3 sm:gap-4">
                    <div className="relative w-12 h-12 sm:w-14 sm:h-14 rounded-xl sm:rounded-2xl flex items-center justify-center text-white shadow-xl border border-white/20 bg-gradient-to-br from-orange-400 to-orange-600 shrink-0">
                        <SafeIcon name="bar-chart-2" size={24} className="sm:w-7 sm:h-7" />
                    </div>
                    <div>
                        <h1 className="text-2xl sm:text-3xl font-black text-zinc-900 dark:text-white tracking-tighter leading-none">
                            INSIGHTS
                        </h1>
                        <p className="text-[9px] sm:text-[10px] font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-[0.2em] mt-1.5 flex items-center gap-1.5">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                            Performance Dashboard
                        </p>
                    </div>
                </div>

                <div className="flex items-center bg-zinc-100/50 dark:bg-[#121826]/80 p-1 rounded-xl sm:rounded-2xl border border-zinc-200/50 dark:border-white/5 backdrop-blur-md overflow-x-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
                    {stats.availableYears.map(year => (
                        <button 
                            key={year} onClick={() => setSelectedYear(year)}
                            className={`py-2 px-4 sm:px-5 text-[10px] sm:text-[11px] font-black uppercase tracking-widest rounded-lg sm:rounded-xl transition-all whitespace-nowrap ${selectedYear === year ? 'bg-white dark:bg-[#1f2940] text-orange-500 shadow-sm' : 'text-zinc-400 hover:text-zinc-900 dark:hover:text-white'}`}
                        >
                            {year}
                        </button>
                    ))}
                </div>
            </div>

            {/* TOP KPI ROW (4 Cards) */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-4 mb-4">
                <div className="bg-white dark:bg-[#182032] border border-zinc-200/80 dark:border-white/5 rounded-2xl sm:rounded-3xl p-3 sm:p-5 shadow-sm relative overflow-hidden group">
                    <div className="absolute right-0 top-0 w-24 h-24 bg-emerald-500/10 blur-[40px] rounded-full pointer-events-none group-hover:bg-emerald-500/20 transition-all"></div>
                    <div className="flex justify-between items-start mb-2 sm:mb-4 relative z-10">
                        <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl bg-emerald-50 dark:bg-emerald-500/10 flex items-center justify-center text-emerald-600 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-500/20">
                            <SafeIcon name="dollar-sign" size={16} className="sm:w-5 sm:h-5" />
                        </div>
                        {stats.trend !== 0 && selectedYear === currentYear && (
                            <span className={`px-1.5 py-0.5 sm:px-2 sm:py-1 rounded-md sm:rounded-lg text-[8px] sm:text-[9px] font-black uppercase flex items-center gap-1 ${stats.trend > 0 ? 'bg-emerald-500 text-white' : 'bg-red-500 text-white'}`}>
                                <SafeIcon name={stats.trend > 0 ? 'trending-up' : 'trending-down'} size={10} />
                                {stats.trend > 0 ? '+' : ''}{stats.trend}%
                            </span>
                        )}
                    </div>
                    <div className="relative z-10">
                        <div className="text-[9px] sm:text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-0.5 sm:mb-1 truncate">Total Omsättning</div>
                        <div className="text-xl sm:text-3xl font-light tracking-tighter text-zinc-900 dark:text-white truncate">
                            {stats.actualRevenue.toLocaleString()} <span className="text-[10px] sm:text-[12px] font-bold text-zinc-400 uppercase tracking-widest">kr</span>
                        </div>
                    </div>
                </div>

                <div className="bg-white dark:bg-[#182032] border border-zinc-200/80 dark:border-white/5 rounded-2xl sm:rounded-3xl p-3 sm:p-5 shadow-sm relative overflow-hidden group">
                    <div className="absolute right-0 top-0 w-24 h-24 bg-orange-500/10 blur-[40px] rounded-full pointer-events-none group-hover:bg-orange-500/20 transition-all"></div>
                    <div className="flex justify-between items-start mb-2 sm:mb-4 relative z-10">
                        <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl bg-orange-50 dark:bg-orange-500/10 flex items-center justify-center text-orange-600 dark:text-orange-400 border border-orange-100 dark:border-orange-500/20">
                            <SafeIcon name="shopping-bag" size={16} className="sm:w-5 sm:h-5" />
                        </div>
                    </div>
                    <div className="relative z-10">
                        <div className="text-[9px] sm:text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-0.5 sm:mb-1 truncate">Snittvärde / Jobb</div>
                        <div className="text-xl sm:text-3xl font-light tracking-tighter text-zinc-900 dark:text-white truncate">
                            {Math.round(stats.avgPrice).toLocaleString()} <span className="text-[10px] sm:text-[12px] font-bold text-zinc-400 uppercase tracking-widest">kr</span>
                        </div>
                    </div>
                </div>

                <div className="bg-white dark:bg-[#182032] border border-zinc-200/80 dark:border-white/5 rounded-2xl sm:rounded-3xl p-3 sm:p-5 shadow-sm relative overflow-hidden group">
                    <div className="absolute right-0 top-0 w-24 h-24 bg-blue-500/10 blur-[40px] rounded-full pointer-events-none group-hover:bg-blue-500/20 transition-all"></div>
                    <div className="flex justify-between items-start mb-2 sm:mb-4 relative z-10">
                        <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl bg-blue-50 dark:bg-blue-500/10 flex items-center justify-center text-blue-600 dark:text-blue-400 border border-blue-100 dark:border-blue-500/20">
                            <SafeIcon name="check-circle" size={16} className="sm:w-5 sm:h-5" />
                        </div>
                        <span className="text-[8px] sm:text-[9px] font-black uppercase tracking-widest text-zinc-400 mt-1 sm:mt-2">{stats.completedJobsCount} klara</span>
                    </div>
                    <div className="relative z-10">
                        <div className="text-[9px] sm:text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-0.5 sm:mb-1 truncate">Avslutade Jobb</div>
                        <div className="text-xl sm:text-3xl font-light tracking-tighter text-zinc-900 dark:text-white">
                            {stats.completionRate}<span className="text-[12px] sm:text-[18px] font-bold text-blue-500 ml-0.5">%</span>
                        </div>
                    </div>
                </div>

                <div className="bg-white dark:bg-[#182032] border border-zinc-200/80 dark:border-white/5 rounded-2xl sm:rounded-3xl p-3 sm:p-5 shadow-sm relative overflow-hidden group">
                    <div className="absolute right-0 top-0 w-24 h-24 bg-violet-500/10 blur-[40px] rounded-full pointer-events-none transition-all group-hover:bg-violet-500/20"></div>
                    <div className="flex justify-between items-start mb-2 sm:mb-4 relative z-10">
                        <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl bg-violet-50 dark:bg-violet-500/10 flex items-center justify-center text-violet-600 dark:text-violet-400 border border-violet-100 dark:border-violet-500/20">
                            <SafeIcon name="layers" size={16} className="sm:w-5 sm:h-5" />
                        </div>
                    </div>
                    <div className="relative z-10">
                        <div className="text-[9px] sm:text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-0.5 sm:mb-1 truncate">Aktiv Pipeline</div>
                        <div className="text-xl sm:text-3xl font-light tracking-tighter text-zinc-900 dark:text-white truncate">
                            {stats.pipeline.offererat.toLocaleString()} <span className="text-[10px] sm:text-[12px] font-bold text-zinc-400 uppercase tracking-widest">kr</span>
                        </div>
                    </div>
                    <div className="absolute bottom-0 left-0 right-0 h-1 bg-zinc-100 dark:bg-white/5 flex">
                        <div className="h-full bg-violet-500" style={{ width: `${stats.totalBookedValue > 0 ? (stats.pipeline.offererat/stats.totalBookedValue)*100 : 0}%` }}></div>
                        <div className="h-full bg-orange-500" style={{ width: `${stats.totalBookedValue > 0 ? (stats.pipeline.bokad/stats.totalBookedValue)*100 : 0}%` }}></div>
                        <div className="h-full bg-emerald-500" style={{ width: `${stats.totalBookedValue > 0 ? (stats.pipeline.klart/stats.totalBookedValue)*100 : 0}%` }}></div>
                    </div>
                </div>
            </div>

            {/* MIDDLE ROW */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-2 sm:gap-4 mb-4">
                
                {/* CHART */}
                <div className="lg:col-span-2 bg-white dark:bg-[#182032] border border-zinc-200/80 dark:border-white/5 rounded-2xl sm:rounded-3xl p-4 sm:p-6 shadow-sm flex flex-col">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 sm:mb-6 gap-3">
                        <div>
                            <h3 className="text-sm sm:text-base font-black text-zinc-900 dark:text-white tracking-tight uppercase">Omsättning över tid</h3>
                            <p className="text-[9px] sm:text-[10px] font-bold text-zinc-500 uppercase tracking-widest mt-0.5">Visar utfört och bokat för {selectedYear}</p>
                        </div>
                        <div className="flex items-center gap-3 bg-zinc-50 dark:bg-[#121826] p-1.5 sm:p-2 rounded-lg sm:rounded-xl border border-zinc-200/50 dark:border-white/5">
                            <div className="flex items-center gap-1.5 text-[8px] sm:text-[9px] font-bold uppercase tracking-widest text-zinc-600 dark:text-zinc-300 px-1 sm:px-2">
                                <span className="w-2 h-2 sm:w-2.5 sm:h-2.5 rounded-sm bg-emerald-400"></span> Fakturerat
                            </div>
                            <div className="flex items-center gap-1.5 text-[8px] sm:text-[9px] font-bold uppercase tracking-widest text-zinc-600 dark:text-zinc-300 px-1 sm:px-2">
                                <span className="w-2 h-2 sm:w-2.5 sm:h-2.5 rounded-sm bg-orange-400 opacity-50"></span> Inbokat
                            </div>
                        </div>
                    </div>
                    
                    <div className="flex-1 w-full overflow-x-auto sm:overflow-visible [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none] pb-2 pt-20 sm:pt-0 -mt-16 sm:mt-0">
                        <div className="flex items-end gap-1 sm:gap-3 relative h-48 sm:h-56 mt-0 sm:mt-12 min-w-[380px] sm:min-w-0">
                            <div className="absolute inset-0 flex flex-col justify-between border-y border-zinc-100 dark:border-white/5 pointer-events-none opacity-50">
                                <div className="w-full h-px bg-zinc-200 dark:bg-white/10"></div>
                                <div className="w-full h-px bg-zinc-200 dark:bg-white/10"></div>
                                <div className="w-full h-px bg-zinc-200 dark:bg-white/10"></div>
                            </div>

                            {months.map((month, i) => {
                                const actual = stats.monthlyActualRev[i];
                                const booked = stats.monthlyBookedRev[i];
                                const total = actual + booked;
                                const heightPct = total === 0 ? 0 : Math.max((total / stats.maxMonthRevenue) * 100, 4);
                                const actPct = total === 0 ? 0 : (actual / total) * 100;
                                const bkdPct = total === 0 ? 0 : (booked / total) * 100;
                                const isHovered = hoveredMonth === i;

                                return (
                                    <div 
                                        key={i} 
                                        className="flex-1 flex flex-col justify-end items-center h-full relative group cursor-crosshair z-10"
                                        onMouseEnter={() => setHoveredMonth(i)}
                                        onMouseLeave={() => setHoveredMonth(null)}
                                        onClick={() => setHoveredMonth(i === hoveredMonth ? null : i)}
                                    >
                                        <div className={`absolute -top-14 sm:-top-16 bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 p-2 sm:p-3 rounded-xl sm:rounded-2xl shadow-xl pointer-events-none transition-all duration-200 z-50 flex flex-col min-w-[100px] sm:min-w-[120px] items-center text-center ${isHovered ? 'opacity-100 translate-y-0 scale-100' : 'opacity-0 translate-y-2 scale-95'}`}>
                                            <div className="text-[8px] sm:text-[9px] font-black uppercase tracking-widest text-zinc-400 dark:text-zinc-500 mb-0.5 sm:mb-1">{fullMonths[i]}</div>
                                            <div className="text-sm sm:text-lg font-black tracking-tighter leading-none mb-1 sm:mb-1.5">{total.toLocaleString()} <span className="text-[8px] sm:text-[9px]">kr</span></div>
                                            {actual > 0 && <div className="text-[8px] font-bold text-emerald-400 dark:text-emerald-600 uppercase tracking-wider">Klar: {actual.toLocaleString()}</div>}
                                            {booked > 0 && <div className="text-[8px] font-bold text-orange-400 dark:text-orange-600 uppercase tracking-wider">Bok: {booked.toLocaleString()}</div>}
                                            <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-2 h-2 sm:w-3 sm:h-3 bg-zinc-900 dark:bg-white rotate-45"></div>
                                        </div>

                                        <div className="w-full max-w-[32px] sm:max-w-[44px] rounded-t-lg sm:rounded-t-xl bg-zinc-100 dark:bg-[#1a2235] flex flex-col justify-end overflow-hidden transition-all duration-500 group-hover:ring-2 group-hover:ring-zinc-300 dark:group-hover:ring-white/20" style={{ height: `${heightPct}%` }}>
                                            {bkdPct > 0 && (
                                                <div className="w-full bg-orange-400/50 transition-all duration-300" style={{ height: `${bkdPct}%` }}></div>
                                            )}
                                            {actPct > 0 && (
                                                <div className="w-full bg-gradient-to-t from-emerald-600 to-emerald-400 transition-all duration-300" style={{ height: `${actPct}%` }}></div>
                                            )}
                                        </div>
                                        <div className={`mt-2 sm:mt-3 text-[8px] sm:text-[9px] font-bold uppercase tracking-widest transition-colors duration-300 ${isHovered ? 'text-zinc-900 dark:text-white' : 'text-zinc-400'}`}>
                                            {month}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>

                {/* INSIGHTS */}
                <div className="bg-gradient-to-b from-orange-400 to-orange-600 rounded-2xl sm:rounded-3xl p-[2px] shadow-sm flex flex-col">
                    <div className="bg-white dark:bg-[#182032] w-full h-full rounded-[14px] sm:rounded-[22px] p-4 sm:p-6 flex flex-col relative overflow-hidden">
                        <div className="absolute top-0 right-0 p-4 sm:p-6 opacity-20 dark:opacity-20 text-orange-500 pointer-events-none">
                            <window.Icon name="zap" size={100} />
                        </div>
                        
                        <div className="flex items-center gap-2 text-orange-500 mb-4 sm:mb-6 relative z-10">
                            <SafeIcon name="sparkles" size={16} />
                            <h3 className="text-[11px] sm:text-[12px] font-black uppercase tracking-widest">AI Insights</h3>
                        </div>

                        <div className="space-y-4 sm:space-y-5 flex-1 flex flex-col justify-center relative z-10">
                            {stats.bestMonth.index !== -1 && stats.bestMonth.revenue > 0 ? (
                                <div>
                                    <div className="text-[9px] sm:text-[10px] font-bold uppercase tracking-widest text-zinc-500 mb-1 sm:mb-1.5">Bästa Månaden</div>
                                    <div className="text-lg sm:text-xl font-light tracking-tight text-zinc-900 dark:text-white leading-tight">
                                        <strong className="font-black">{fullMonths[stats.bestMonth.index]}</strong> leder med <span className="text-orange-500 font-black">{stats.bestMonth.revenue.toLocaleString()} kr</span>.
                                    </div>
                                </div>
                            ) : (
                                <div className="text-zinc-500 italic text-xs">För lite data för att generera insikter.</div>
                            )}

                            {stats.completionRate > 0 && (
                                <div className="p-3 sm:p-4 bg-zinc-50 dark:bg-[#121826] rounded-xl sm:rounded-2xl border border-zinc-200/50 dark:border-white/5">
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-blue-500/10 flex items-center justify-center text-blue-500 shrink-0">
                                            <SafeIcon name="target" size={16} />
                                        </div>
                                        <div>
                                            <div className="text-[9px] sm:text-[10px] font-bold uppercase tracking-widest text-zinc-500 mb-0.5">Hit Rate</div>
                                            <div className="text-xs sm:text-sm font-bold text-zinc-900 dark:text-white">Stänger <span className="text-blue-500">{stats.completionRate}%</span> inbokade.</div>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* BOTTOM ROW */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-2 sm:gap-4">
                
                {/* TOP CUSTOMERS */}
                <div className="bg-white dark:bg-[#182032] border border-zinc-200/80 dark:border-white/5 rounded-2xl sm:rounded-3xl p-4 sm:p-6 shadow-sm">
                    <SectionHeader title="Toppkunder" sub="Ackumulerad omsättning" icon="users" color="blue" />
                    <div className="space-y-3 sm:space-y-4">
                        {stats.topCustomers.length > 0 ? stats.topCustomers.map(([name, revenue], index) => {
                            const pct = Math.round((revenue / stats.actualRevenue) * 100);
                            return (
                                <div key={name} className="group cursor-default">
                                    <div className="flex justify-between items-end mb-1.5">
                                        <div className="flex items-center gap-2 min-w-0 pr-2">
                                            <div className="text-[9px] sm:text-[10px] font-black text-zinc-400 dark:text-zinc-600 w-3">{index + 1}.</div>
                                            <div className="text-[11px] sm:text-[12px] font-bold text-zinc-800 dark:text-zinc-200 truncate group-hover:text-blue-500 transition-colors">{name}</div>
                                        </div>
                                        <div className="text-[11px] sm:text-[12px] font-mono font-black text-zinc-900 dark:text-white shrink-0">{revenue.toLocaleString()} <span className="text-[8px] font-sans text-zinc-400">kr</span></div>
                                    </div>
                                    <div className="w-full bg-zinc-100 dark:bg-[#1a2235] h-1.5 rounded-full overflow-hidden">
                                        <div className="bg-gradient-to-r from-blue-600 to-blue-400 h-full transition-all duration-1000 ease-out" style={{ width: `${pct}%` }}></div>
                                    </div>
                                </div>
                            );
                        }) : <div className="text-center text-zinc-500 text-xs italic py-6">Ingen data</div>}
                    </div>
                </div>

                {/* TOP SERVICES */}
                <div className="bg-white dark:bg-[#182032] border border-zinc-200/80 dark:border-white/5 rounded-2xl sm:rounded-3xl p-4 sm:p-6 shadow-sm">
                    <SectionHeader title="Tjänster" sub="Baserat på volym" icon="layers" color="emerald" />
                    <div className="space-y-3 sm:space-y-4">
                        {stats.topPackages.length > 0 ? stats.topPackages.map(([pkg, count], index) => {
                            const pct = Math.round((count / stats.completedJobsCount) * 100);
                            return (
                                <div key={pkg} className="group cursor-default">
                                    <div className="flex justify-between items-end mb-1.5">
                                        <div className="flex items-center gap-2 min-w-0 pr-2">
                                            <div className="text-[9px] sm:text-[10px] font-black text-zinc-400 dark:text-zinc-600 w-3">{index + 1}.</div>
                                            <div className="text-[11px] sm:text-[12px] font-bold text-zinc-800 dark:text-zinc-200 truncate group-hover:text-emerald-500 transition-colors">{pkg}</div>
                                        </div>
                                        <div className="text-[9px] sm:text-[10px] font-black text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-500/10 px-1.5 py-[1px] rounded uppercase tracking-widest shrink-0">{count} st</div>
                                    </div>
                                    <div className="w-full bg-zinc-100 dark:bg-[#1a2235] h-1.5 rounded-full overflow-hidden">
                                        <div className="bg-gradient-to-r from-emerald-600 to-emerald-400 h-full transition-all duration-1000 ease-out" style={{ width: `${pct}%` }}></div>
                                    </div>
                                </div>
                            );
                        }) : <div className="text-center text-zinc-500 text-xs italic py-6">Ingen data</div>}
                    </div>
                </div>

                {/* TOP BRANDS */}
                <div className="bg-white dark:bg-[#182032] border border-zinc-200/80 dark:border-white/5 rounded-2xl sm:rounded-3xl p-4 sm:p-6 shadow-sm">
                    <SectionHeader title="Fordon" sub="Omsättning per märke" icon="truck" color="violet" />
                    <div className="space-y-2 sm:space-y-3">
                        {stats.topBrands.length > 0 ? stats.topBrands.map(([brand, revenue]) => {
                            const pct = Math.round((revenue / stats.actualRevenue) * 100);
                            let slug = null;
                            if (window.VEHICLE_BRANDS) {
                                const foundKey = Object.keys(window.VEHICLE_BRANDS).find(k => k.toLowerCase() === brand.toLowerCase() || window.VEHICLE_BRANDS[k] === brand.toLowerCase());
                                if (foundKey) slug = window.VEHICLE_BRANDS[foundKey];
                            }

                            return (
                                <div key={brand} className="group flex items-center gap-3 p-1.5 -mx-1.5 rounded-lg hover:bg-zinc-50 dark:hover:bg-white/5 transition-colors cursor-default">
                                    <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-lg bg-zinc-50 dark:bg-[#121826] border border-zinc-200/50 dark:border-white/10 flex items-center justify-center shrink-0 group-hover:border-violet-500/30 transition-colors">
                                        {slug ? (
                                            <img src={`https://cdn.simpleicons.org/${slug}`} className="w-4 h-4 sm:w-4 sm:h-4 object-contain opacity-70 dark:invert group-hover:opacity-100 group-hover:scale-110 transition-all"/>
                                        ) : (
                                            <SafeIcon name="car" size={14} className="text-zinc-400"/>
                                        )}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex justify-between items-center mb-1">
                                            <span className="text-[11px] sm:text-[12px] font-bold text-zinc-800 dark:text-zinc-200 truncate group-hover:text-violet-500 transition-colors">{brand}</span>
                                            <span className="text-[10px] sm:text-[11px] font-mono font-black text-zinc-900 dark:text-white shrink-0">{revenue.toLocaleString()} <span className="text-[8px] font-sans text-zinc-400">kr</span></span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <div className="w-full bg-zinc-100 dark:bg-[#1a2235] h-1 rounded-full overflow-hidden">
                                                <div className="bg-gradient-to-r from-violet-600 to-violet-400 h-full transition-all duration-1000 ease-out" style={{ width: `${pct}%` }}></div>
                                            </div>
                                            <span className="text-[8px] sm:text-[9px] font-black text-zinc-400 uppercase tracking-widest w-5 text-right">{pct}%</span>
                                        </div>
                                    </div>
                                </div>
                            );
                        }) : <div className="text-center text-zinc-500 text-xs italic py-6">Ingen data</div>}
                    </div>
                </div>

            </div>
        </div>
    );
};
