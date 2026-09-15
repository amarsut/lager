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
        <div className="flex items-start gap-3 mb-4 pb-3 sm:pb-4 border-b border-zinc-100 dark:border-white/5">
            <div className={`mt-1 h-4 w-1.5 bg-gradient-to-b ${colorMap[color]} rounded-full`} />
            <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 text-zinc-900 dark:text-white">
                    <SafeIcon name={icon} size={14} className="text-zinc-400 dark:text-zinc-500 shrink-0" />
                    <h3 className="text-[12px] sm:text-[13px] font-black uppercase tracking-[0.15em] leading-none truncate mt-0.5">{title}</h3>
                </div>
                {sub && <p className="text-[9px] sm:text-[10px] font-bold uppercase tracking-widest text-zinc-400 dark:text-zinc-500 mt-1.5 truncate">{sub}</p>}
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

window.StatisticsView = ({ allJobs, onSelectJob }) => {
    const currentYear = new Date().getFullYear().toString();
    const currentMonthIdx = new Date().getMonth();
    
    const [selectedYear, setSelectedYear] = React.useState(currentYear);
    const [selectedMonth, setSelectedMonth] = React.useState(currentMonthIdx);
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
        let monthlyJobs = Array.from({ length: 12 }, () => []);
        
        let packageCount = {}, customerRev = {}, brandRev = {}, completedJobsCount = 0;
        let bestMonth = { index: -1, revenue: 0 };

        jobsForPrevYear.forEach(j => {
            const status = (j.status || '').toUpperCase();
            if (['KLAR', 'FAKTURERAS', 'KLART'].includes(status)) prevActualRevenue += (parseInt(j.kundpris) || 0);
        });

        jobsForYear.forEach(j => {
            const price = parseInt(j.kundpris) || 0;
            const status = (j.status || 'BOKAD').toUpperCase();
            const isDone = ['KLAR', 'FAKTURERAS', 'KLART'].includes(status);
            
            if (status === 'OFFERERAD') pipeline.offererat += price;
            if (status === 'BOKAD') pipeline.bokad += price;
            if (isDone) pipeline.klart += price;

            totalBookedValue += price;
            const monthIdx = parseInt(j.datum.substring(5, 7)) - 1;
            
            if (monthIdx >= 0 && monthIdx <= 11) {
                if (isDone) monthlyActualRev[monthIdx] += price;
                else monthlyBookedRev[monthIdx] += price;
                monthlyCounts[monthIdx] += 1;
                monthlyJobs[monthIdx].push(j);
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

        monthlyJobs.forEach(monthArr => monthArr.sort((a, b) => b.datum.localeCompare(a.datum)));

        let trend = prevActualRevenue > 0 ? Math.round(((actualRevenue - prevActualRevenue) / prevActualRevenue) * 100) : (actualRevenue > 0 ? 100 : 0);

        const maxMonthRevenue = Math.max(...monthlyActualRev.map((val, i) => val + monthlyBookedRev[i]), 1);
        const topPackages = Object.entries(packageCount).sort((a, b) => b[1] - a[1]).slice(0, 5);
        const topCustomers = Object.entries(customerRev).sort((a, b) => b[1] - a[1]).slice(0, 5);
        const topBrands = Object.entries(brandRev).sort((a, b) => b[1] - a[1]).slice(0, 6);
        
        const avgPrice = completedJobsCount > 0 ? actualRevenue / completedJobsCount : 0;
        const completionRate = jobsForYear.length > 0 ? Math.round((completedJobsCount / jobsForYear.length) * 100) : 0;

        return { 
            availableYears, totalBookedValue, actualRevenue, prevActualRevenue, trend,
            monthlyActualRev, monthlyBookedRev, monthlyCounts, monthlyJobs, maxMonthRevenue, 
            topPackages, topCustomers, topBrands, totalJobs: jobsForYear.length, 
            completedJobsCount, avgPrice, completionRate, bestMonth, pipeline
        };
    }, [allJobs, selectedYear, currentYear, brandMap]);

    React.useEffect(() => { if (window.lucide) window.lucide.createIcons(); });

    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'Maj', 'Jun', 'Jul', 'Aug', 'Sep', 'Okt', 'Nov', 'Dec'];
    const fullMonths = ['Januari', 'Februari', 'Mars', 'April', 'Maj', 'Juni', 'Juli', 'Augusti', 'September', 'Oktober', 'November', 'December'];

    // Specifik månadsvy data
    const activeMonthJobs = stats.monthlyJobs[selectedMonth] || [];
    const activeMonthActual = stats.monthlyActualRev[selectedMonth] || 0;
    const activeMonthBooked = stats.monthlyBookedRev[selectedMonth] || 0;

    return (
        <div className="flex flex-col h-full min-h-0 bg-transparent text-zinc-900 dark:text-white pb-8 sm:pb-12 transition-colors duration-500 relative max-w-[1400px] animate-in fade-in slide-in-from-left-4 -mx-4 sm:-mx-6 md:-mx-8 lg:mx-0 px-4 sm:px-6 md:px-8 lg:px-0">
            
            <div className="absolute top-0 left-[-10%] w-[60%] h-[400px] bg-orange-500/10 dark:bg-orange-500/5 blur-[120px] rounded-full pointer-events-none -z-10 hidden lg:block"></div>

            {/* HEADER & ÅRSVÄLJARE */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 pt-4 lg:pt-0 gap-4">
                <div className="flex items-center gap-3 sm:gap-4">
                    <div className="relative group cursor-default shrink-0">
                        <div className="absolute inset-0 bg-orange-500/40 blur-lg rounded-full transition-all duration-700 group-hover:bg-orange-500/60" />
                        <div className="relative w-10 h-10 md:w-12 md:h-12 rounded-xl flex items-center justify-center text-white shadow-md border border-white/20 transition-colors bg-gradient-to-br from-orange-400 to-orange-600">
                            <SafeIcon name="bar-chart-2" size={20} className="md:w-6 md:h-6" />
                        </div>
                    </div>
                    <div className="flex flex-col">
                        <h1 className="text-xl md:text-2xl font-black text-zinc-900 dark:text-white uppercase tracking-tight leading-none">
                            STATISTIK<span className="text-zinc-400 dark:text-zinc-500 font-light"> & INSIGHTS</span>
                        </h1>
                        <p className="text-[9px] md:text-[10px] font-bold text-orange-500 dark:text-orange-400 uppercase tracking-widest mt-1 flex items-center gap-1.5">
                            <span className="w-1.5 h-1.5 rounded-full bg-orange-500 animate-pulse"></span>
                            Performance Dashboard
                        </p>
                    </div>
                </div>

                <div className="flex items-center bg-white/80 dark:bg-[#121826]/80 p-1.5 rounded-xl sm:rounded-2xl border border-zinc-200/50 dark:border-white/5 backdrop-blur-md overflow-x-auto [&::-webkit-scrollbar]:hidden shadow-sm shrink-0">
                    {stats.availableYears.map(year => (
                        <button 
                            key={year} onClick={() => { setSelectedYear(year); setSelectedMonth(currentMonthIdx); }}
                            className={`py-2 px-4 sm:px-5 text-[11px] sm:text-[12px] font-black uppercase tracking-widest rounded-lg sm:rounded-xl transition-all whitespace-nowrap ${selectedYear === year ? 'bg-zinc-100 dark:bg-[#1f2940] text-orange-500 shadow-sm' : 'text-zinc-400 hover:text-zinc-900 dark:hover:text-white'}`}
                        >
                            {year}
                        </button>
                    ))}
                </div>
            </div>

            {/* TOP KPI ROW - Andrum och tydlighet */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-5 mb-5 sm:mb-6 shrink-0">
                <div className="bg-white/90 dark:bg-[#182032]/90 border border-zinc-200/80 dark:border-white/5 rounded-2xl sm:rounded-3xl p-4 sm:p-6 shadow-sm relative overflow-hidden flex flex-col justify-center">
                    <div className="absolute right-0 top-0 w-20 h-20 bg-emerald-500/10 blur-[30px] rounded-full pointer-events-none"></div>
                    <div className="flex justify-between items-start mb-2 sm:mb-3 relative z-10">
                        <div className="text-[10px] sm:text-[11px] font-bold text-zinc-500 uppercase tracking-widest flex items-center gap-2">
                            <SafeIcon name="dollar-sign" size={14} className="text-emerald-500" /> Total Omsättning
                        </div>
                        {stats.trend !== 0 && selectedYear === currentYear && (
                            <span className={`px-2 py-1 rounded-md text-[9px] font-black uppercase flex items-center gap-1 ${stats.trend > 0 ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' : 'bg-red-500/10 text-red-600 dark:text-red-400'}`}>
                                {stats.trend > 0 ? '+' : ''}{stats.trend}%
                            </span>
                        )}
                    </div>
                    <div className="text-2xl sm:text-3xl font-light tracking-tighter text-zinc-900 dark:text-white relative z-10">
                        {stats.actualRevenue.toLocaleString()} <span className="text-[10px] sm:text-[12px] font-bold text-zinc-400 uppercase tracking-widest">kr</span>
                    </div>
                </div>

                <div className="bg-white/90 dark:bg-[#182032]/90 border border-zinc-200/80 dark:border-white/5 rounded-2xl sm:rounded-3xl p-4 sm:p-6 shadow-sm relative overflow-hidden flex flex-col justify-center">
                    <div className="absolute right-0 top-0 w-20 h-20 bg-orange-500/10 blur-[30px] rounded-full pointer-events-none"></div>
                    <div className="text-[10px] sm:text-[11px] font-bold text-zinc-500 uppercase tracking-widest flex items-center gap-2 mb-2 sm:mb-3 relative z-10">
                        <SafeIcon name="shopping-bag" size={14} className="text-orange-500" /> Snittvärde / Jobb
                    </div>
                    <div className="text-2xl sm:text-3xl font-light tracking-tighter text-zinc-900 dark:text-white relative z-10">
                        {Math.round(stats.avgPrice).toLocaleString()} <span className="text-[10px] sm:text-[12px] font-bold text-zinc-400 uppercase tracking-widest">kr</span>
                    </div>
                </div>

                <div className="bg-white/90 dark:bg-[#182032]/90 border border-zinc-200/80 dark:border-white/5 rounded-2xl sm:rounded-3xl p-4 sm:p-6 shadow-sm relative overflow-hidden flex flex-col justify-center">
                    <div className="absolute right-0 top-0 w-20 h-20 bg-blue-500/10 blur-[30px] rounded-full pointer-events-none"></div>
                    <div className="flex justify-between items-start mb-2 sm:mb-3 relative z-10">
                        <div className="text-[10px] sm:text-[11px] font-bold text-zinc-500 uppercase tracking-widest flex items-center gap-2">
                            <SafeIcon name="check-circle" size={14} className="text-blue-500" /> Hit Rate
                        </div>
                        <span className="text-[9px] font-black uppercase tracking-widest text-zinc-400 mt-1">{stats.completedJobsCount} klara</span>
                    </div>
                    <div className="text-2xl sm:text-3xl font-light tracking-tighter text-zinc-900 dark:text-white relative z-10 flex items-baseline">
                        {stats.completionRate}<span className="text-[14px] sm:text-[16px] font-bold text-blue-500 ml-1">%</span>
                    </div>
                </div>

                <div className="bg-white/90 dark:bg-[#182032]/90 border border-zinc-200/80 dark:border-white/5 rounded-2xl sm:rounded-3xl p-4 sm:p-6 shadow-sm relative overflow-hidden flex flex-col justify-center group">
                    <div className="absolute right-0 top-0 w-20 h-20 bg-violet-500/10 blur-[30px] rounded-full pointer-events-none"></div>
                    <div className="text-[10px] sm:text-[11px] font-bold text-zinc-500 uppercase tracking-widest flex items-center gap-2 mb-2 sm:mb-3 relative z-10">
                        <SafeIcon name="layers" size={14} className="text-violet-500" /> Pågående & Inbokat
                    </div>
                    <div className="text-2xl sm:text-3xl font-light tracking-tighter text-zinc-900 dark:text-white relative z-10">
                        {stats.pipeline.offererat.toLocaleString()} <span className="text-[10px] sm:text-[12px] font-bold text-zinc-400 uppercase tracking-widest">kr</span>
                    </div>
                    <div className="absolute bottom-0 left-0 right-0 h-1.5 bg-zinc-100 dark:bg-white/5 flex opacity-60 group-hover:opacity-100 transition-opacity">
                        <div className="h-full bg-violet-500" style={{ width: `${stats.totalBookedValue > 0 ? (stats.pipeline.offererat/stats.totalBookedValue)*100 : 0}%` }}></div>
                        <div className="h-full bg-orange-500" style={{ width: `${stats.totalBookedValue > 0 ? (stats.pipeline.bokad/stats.totalBookedValue)*100 : 0}%` }}></div>
                        <div className="h-full bg-emerald-500" style={{ width: `${stats.totalBookedValue > 0 ? (stats.pipeline.klart/stats.totalBookedValue)*100 : 0}%` }}></div>
                    </div>
                </div>
            </div>

            {/* MASTER-DETAIL VIEW: Diagram (Master) + Månadsvy (Detail) */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-5 mb-5 sm:mb-6 lg:h-[440px]">
                
                {/* VÄNSTER: INTERAKTIVT DIAGRAM (Master) */}
                <div className="lg:col-span-7 bg-white/90 dark:bg-[#182032]/90 border border-zinc-200/80 dark:border-white/5 rounded-2xl sm:rounded-3xl p-5 sm:p-6 shadow-sm flex flex-col h-full min-h-[350px] lg:min-h-0">
                    <div className="flex flex-col sm:flex-row sm:items-start justify-between mb-4 sm:mb-6 gap-4 shrink-0">
                        <SectionHeader title="Månadsöversikt" sub={`Tryck på en stapel för att se detaljer (${selectedYear})`} icon="bar-chart" color="blue" />
                        <div className="flex items-center gap-3 sm:gap-4 bg-zinc-50 dark:bg-[#121826] p-2 rounded-xl sm:rounded-2xl border border-zinc-200/50 dark:border-white/5 shrink-0">
                            <div className="flex items-center gap-2 text-[9px] sm:text-[10px] font-bold uppercase tracking-widest text-zinc-600 dark:text-zinc-300 px-2">
                                <span className="w-2.5 h-2.5 rounded-sm bg-emerald-400"></span> Fakturerat
                            </div>
                            <div className="flex items-center gap-2 text-[9px] sm:text-[10px] font-bold uppercase tracking-widest text-zinc-600 dark:text-zinc-300 px-2">
                                <span className="w-2.5 h-2.5 rounded-sm bg-orange-400 opacity-50"></span> Inbokat
                            </div>
                        </div>
                    </div>
                    
                    <div className="flex-1 w-full overflow-x-auto custom-scrollbar pb-2 flex flex-col">
                        <div className="flex items-end gap-1 sm:gap-2 relative flex-1 min-h-[240px] min-w-[420px] sm:min-w-0 pt-10 mt-auto border-b border-zinc-200 dark:border-white/10">

                            {/* Diskreta bakgrundslinjer (Y-axel referens) */}
                            <div className="absolute inset-0 flex flex-col justify-between pointer-events-none opacity-40 pb-6 pt-10">
                                <div className="w-full h-px border-b border-dashed border-zinc-300 dark:border-white/20"></div>
                                <div className="w-full h-px border-b border-dashed border-zinc-300 dark:border-white/20"></div>
                                <div className="w-full h-px border-b border-dashed border-zinc-300 dark:border-white/20"></div>
                            </div>

                            {months.map((month, i) => {
                                const actual = stats.monthlyActualRev[i];
                                const booked = stats.monthlyBookedRev[i];
                                const total = actual + booked;
                                const heightPct = total === 0 ? 0 : Math.max((total / stats.maxMonthRevenue) * 100, 2);
                                const actPct = total === 0 ? 0 : (actual / total) * 100;
                                const bkdPct = total === 0 ? 0 : (booked / total) * 100;
                                const isSelected = selectedMonth === i;

                                return (
                                    <div 
                                        key={i} 
                                        className="flex-1 flex flex-col justify-end items-center h-full relative group cursor-pointer z-10 pb-6"
                                        onClick={() => setSelectedMonth(i)}
                                    >
                                        <div className="w-full flex justify-center items-end h-full relative">
                                            {/* STAPELN */}
                                            <div 
                                                className={`w-full max-w-[24px] sm:max-w-[36px] bg-zinc-100 dark:bg-[#1a2235] flex flex-col justify-end overflow-visible transition-all duration-500 relative ${isSelected ? 'ring-2 ring-orange-500 ring-offset-2 ring-offset-white dark:ring-offset-[#182032] opacity-100 scale-100 shadow-md z-20 rounded-t-md sm:rounded-t-lg' : 'group-hover:opacity-100 opacity-70 scale-95 hover:scale-100 z-10 rounded-t-sm sm:rounded-t-md'}`} 
                                                style={{ height: `${heightPct}%` }}
                                            >
                                                {/* SIFFRAN: Fastspikad OVANFÖR stapeln så den åker upp/ner med höjden */}
                                                {total > 0 && (
                                                    <div className={`absolute -top-6 sm:-top-7 left-1/2 -translate-x-1/2 text-[10px] sm:text-[12px] font-black tracking-tighter transition-all duration-300 ${isSelected ? 'text-zinc-900 dark:text-white scale-110' : 'text-zinc-400 group-hover:text-zinc-600 dark:group-hover:text-zinc-300'}`}>
                                                        {(total/1000).toFixed(total >= 10000 ? 0 : 1)}k
                                                    </div>
                                                )}

                                                {/* Fyllning av stapel */}
                                                {bkdPct > 0 && <div className={`w-full bg-orange-400/60 transition-all duration-500 ${isSelected ? 'rounded-t-md sm:rounded-t-lg' : 'rounded-t-sm sm:rounded-t-md'}`} style={{ height: `${bkdPct}%` }}></div>}
                                                {actPct > 0 && <div className={`w-full bg-gradient-to-t from-emerald-600 to-emerald-400 transition-all duration-500 ${bkdPct === 0 ? (isSelected ? 'rounded-t-md sm:rounded-t-lg' : 'rounded-t-sm sm:rounded-t-md') : ''}`} style={{ height: `${actPct}%` }}></div>}
                                            </div>
                                        </div>

                                        {/* MÅNADSETIKETT */}
                                        <div className={`absolute bottom-0 w-full text-center text-[10px] sm:text-[11px] font-bold uppercase tracking-widest transition-colors duration-300 ${isSelected ? 'text-orange-500' : 'text-zinc-400 group-hover:text-zinc-700 dark:group-hover:text-zinc-300'}`}>
                                            {month}
                                        </div>
                                        
                                        {/* Liten "aktiv-prick" under månaden */}
                                        {isSelected && (
                                            <div className="absolute -bottom-3 sm:-bottom-4 w-1 h-1 rounded-full bg-orange-500 animate-in zoom-in duration-300"></div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>

                {/* HÖGER: VALD MÅNAD (Detail) */}
                <div className="lg:col-span-5 bg-white/90 dark:bg-[#182032]/90 border border-zinc-200/80 dark:border-white/5 rounded-2xl sm:rounded-3xl shadow-sm flex flex-col overflow-hidden h-[450px] lg:h-full">
                    <div className="p-4 sm:p-5 border-b border-zinc-100 dark:border-white/5 bg-zinc-50 dark:bg-[#121826]/50 shrink-0">
                        <div className="flex items-center justify-between mb-3 sm:mb-4">
                            <h3 className="text-[14px] sm:text-[16px] font-black text-zinc-900 dark:text-white uppercase tracking-widest flex items-center gap-2">
                                <SafeIcon name="calendar" size={16} className="text-orange-500" /> {fullMonths[selectedMonth]} {selectedYear}
                            </h3>
                            <span className="text-[10px] sm:text-[11px] font-bold text-zinc-500 bg-white dark:bg-white/5 px-2.5 py-1 rounded-full border border-zinc-200 dark:border-white/10 uppercase tracking-widest shadow-sm">
                                {activeMonthJobs.length} Jobb
                            </span>
                        </div>
                        <div className="flex items-center gap-5 sm:gap-6 bg-white dark:bg-[#182032] p-3 sm:p-4 rounded-xl sm:rounded-2xl border border-zinc-200/50 dark:border-white/5 shadow-sm">
                            <div className="flex flex-col">
                                <span className="text-[16px] sm:text-[20px] font-black text-emerald-600 dark:text-emerald-400 leading-none mb-1">{activeMonthActual > 0 ? activeMonthActual.toLocaleString() : '0'} <span className="text-[10px] font-sans text-zinc-500">kr</span></span>
                                <span className="text-[9px] sm:text-[10px] font-bold uppercase tracking-widest text-zinc-400">Fakturerat</span>
                            </div>
                            <div className="w-px h-8 bg-zinc-200 dark:bg-white/10"></div>
                            <div className="flex flex-col">
                                <span className="text-[16px] sm:text-[20px] font-bold text-orange-500 dark:text-orange-400 leading-none mb-1">{activeMonthBooked > 0 ? activeMonthBooked.toLocaleString() : '0'} <span className="text-[10px] font-sans text-zinc-500">kr</span></span>
                                <span className="text-[9px] sm:text-[10px] font-bold uppercase tracking-widest text-zinc-400">Inbokat</span>
                            </div>
                        </div>
                    </div>

                    <div className="flex-1 overflow-y-auto custom-scrollbar p-3 sm:p-4 bg-zinc-50/30 dark:bg-transparent min-h-0">
                        {activeMonthJobs.length > 0 ? (
                            <div className="flex flex-col gap-2">
                                {activeMonthJobs.map(job => {
                                    const d = new Date(job.datum);
                                    const price = parseInt(job.kundpris) || 0;
                                    const jobStatus = (job.status || 'BOKAD').toUpperCase();
                                    const isDone = ['KLAR', 'FAKTURERAS', 'KLART'].includes(jobStatus);
                                    return (
                                        <div 
                                            key={job.id} 
                                            onClick={() => {
                                                // Öppnar fordonskortet/historiken i första hand
                                                if (job.regnr && window.openVehicleProfile) {
                                                    window.openVehicleProfile(job.regnr, job.id);
                                                } 
                                                // Fallback om regnr saknas - öppnar redigeringsläget direkt
                                                else if (window.openEditModal) {
                                                    window.openEditModal(job.id);
                                                }
                                            }}
                                            className="flex items-center justify-between p-3 sm:p-4 rounded-xl sm:rounded-2xl border border-zinc-100 dark:border-white/5 bg-white dark:bg-[#1a2235] hover:border-zinc-300 dark:hover:border-white/20 transition-colors shadow-sm cursor-pointer group"
                                        >
                                            <div className="flex items-center gap-3 sm:gap-4 min-w-0 pr-3">
                                                <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-zinc-50 dark:bg-black/20 flex flex-col items-center justify-center border border-zinc-200/50 dark:border-white/5 shrink-0 shadow-sm">
                                                    <span className="text-[13px] sm:text-[15px] font-black text-zinc-900 dark:text-white leading-none mb-0.5">{d.getDate()}</span>
                                                    <span className="text-[8px] sm:text-[9px] font-bold uppercase tracking-widest text-zinc-500">{months[d.getMonth()]}</span>
                                                </div>
                                                <div className="min-w-0 flex flex-col gap-0.5">
                                                    <div className="text-[12px] sm:text-[13px] font-bold text-zinc-900 dark:text-white truncate">{job.kundnamn}</div>
                                                    <div className="text-[10px] sm:text-[11px] text-zinc-500 dark:text-zinc-400 truncate flex items-center gap-1.5">
                                                        <span className="font-mono text-zinc-700 dark:text-zinc-300 bg-zinc-100 dark:bg-white/5 px-1 rounded">{job.regnr || '-'}</span>
                                                        {job.paket === 'Oljebyte' && job.oljevolym ? `Oljebyte ${job.oljevolym}l` : (job.paket || 'Standard')}
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="flex flex-col items-end shrink-0 gap-1.5">
                                                <div className="text-[13px] sm:text-[15px] font-black text-zinc-900 dark:text-white leading-none">
                                                    {price > 0 ? price.toLocaleString() : '-'} <span className="text-[9px] font-bold text-zinc-400">kr</span>
                                                </div>
                                                <span className={`px-2 py-0.5 text-[8px] sm:text-[9px] font-bold uppercase tracking-widest rounded-md border shadow-sm ${isDone ? 'bg-emerald-50 text-emerald-600 border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20' : 'bg-orange-50 text-orange-600 border-orange-200 dark:bg-orange-500/10 dark:text-orange-400 dark:border-orange-500/20'}`}>
                                                    {job.status || 'BOKAD'}
                                                </span>
                                            </div>
                                        </div>
                                    )
                                })}
                            </div>
                        ) : (
                            <div className="h-full flex flex-col items-center justify-center text-center p-8 opacity-50 min-h-[200px]">
                                <SafeIcon name="calendar-x" size={32} className="mb-3 text-zinc-400" />
                                <span className="text-[11px] sm:text-[12px] font-bold uppercase tracking-widest text-zinc-500">Inga uppdrag i {months[selectedMonth].toLowerCase()}</span>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* BOTTOM ROW (Topkunder, Tjänster, Fordon) - Luftigare listor */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-5 shrink-0">
                
                <div className="bg-white/90 dark:bg-[#182032]/90 border border-zinc-200/80 dark:border-white/5 rounded-2xl sm:rounded-3xl p-5 sm:p-6 shadow-sm">
                    <SectionHeader title="Toppkunder" sub="Ackumulerad omsättning" icon="users" color="blue" />
                    <div className="space-y-3.5 mt-4">
                        {stats.topCustomers.length > 0 ? stats.topCustomers.map(([name, revenue], index) => {
                            const pct = Math.round((revenue / stats.actualRevenue) * 100);
                            return (
                                <div key={name} className="group">
                                    <div className="flex justify-between items-end mb-1.5">
                                        <div className="flex items-center gap-2 min-w-0 pr-2">
                                            <div className="text-[10px] sm:text-[11px] font-black text-zinc-400 w-4">{index + 1}.</div>
                                            <div className="text-[11px] sm:text-[13px] font-bold text-zinc-800 dark:text-zinc-200 truncate group-hover:text-blue-500 transition-colors">{name}</div>
                                        </div>
                                        <div className="text-[11px] sm:text-[13px] font-mono font-bold text-zinc-900 dark:text-white shrink-0">{revenue.toLocaleString()} <span className="text-[9px] font-sans text-zinc-400">kr</span></div>
                                    </div>
                                    <div className="w-full bg-zinc-100 dark:bg-[#1a2235] h-1.5 rounded-full overflow-hidden">
                                        <div className="bg-gradient-to-r from-blue-600 to-blue-400 h-full transition-all duration-1000 ease-out" style={{ width: `${pct}%` }}></div>
                                    </div>
                                </div>
                            );
                        }) : <div className="text-center text-zinc-500 text-[11px] italic py-6">Ingen data</div>}
                    </div>
                </div>

                <div className="bg-white/90 dark:bg-[#182032]/90 border border-zinc-200/80 dark:border-white/5 rounded-2xl sm:rounded-3xl p-5 sm:p-6 shadow-sm">
                    <SectionHeader title="Tjänster" sub="Baserat på volym" icon="layers" color="emerald" />
                    <div className="space-y-3.5 mt-4">
                        {stats.topPackages.length > 0 ? stats.topPackages.map(([pkg, count], index) => {
                            const pct = Math.round((count / stats.completedJobsCount) * 100);
                            return (
                                <div key={pkg} className="group">
                                    <div className="flex justify-between items-end mb-1.5">
                                        <div className="flex items-center gap-2 min-w-0 pr-2">
                                            <div className="text-[10px] sm:text-[11px] font-black text-zinc-400 w-4">{index + 1}.</div>
                                            <div className="text-[11px] sm:text-[13px] font-bold text-zinc-800 dark:text-zinc-200 truncate group-hover:text-emerald-500 transition-colors">{pkg}</div>
                                        </div>
                                        <div className="text-[10px] sm:text-[11px] font-black text-emerald-600 dark:text-emerald-400 uppercase tracking-widest shrink-0">{count} st</div>
                                    </div>
                                    <div className="w-full bg-zinc-100 dark:bg-[#1a2235] h-1.5 rounded-full overflow-hidden">
                                        <div className="bg-gradient-to-r from-emerald-600 to-emerald-400 h-full transition-all duration-1000 ease-out" style={{ width: `${pct}%` }}></div>
                                    </div>
                                </div>
                            );
                        }) : <div className="text-center text-zinc-500 text-[11px] italic py-6">Ingen data</div>}
                    </div>
                </div>

                <div className="bg-white/90 dark:bg-[#182032]/90 border border-zinc-200/80 dark:border-white/5 rounded-2xl sm:rounded-3xl p-5 sm:p-6 shadow-sm">
                    <SectionHeader title="Fordon" sub="Omsättning per märke" icon="truck" color="violet" />
                    <div className="space-y-3 mt-3">
                        {stats.topBrands.length > 0 ? stats.topBrands.map(([brand, revenue]) => {
                            const pct = Math.round((revenue / stats.actualRevenue) * 100);
                            let slug = null;
                            if (window.VEHICLE_BRANDS) {
                                const foundKey = Object.keys(window.VEHICLE_BRANDS).find(k => k.toLowerCase() === brand.toLowerCase() || window.VEHICLE_BRANDS[k] === brand.toLowerCase());
                                if (foundKey) slug = window.VEHICLE_BRANDS[foundKey];
                            }

                            return (
                                <div key={brand} className="group flex items-center justify-between gap-3 p-1.5 -mx-1.5 rounded-xl hover:bg-zinc-50 dark:hover:bg-white/5 transition-colors">
                                    <div className="flex items-center min-w-0 gap-3">
                                        <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-lg bg-zinc-50 dark:bg-[#121826] border border-zinc-200/50 dark:border-white/10 flex items-center justify-center shrink-0 group-hover:border-violet-500/30 transition-colors shadow-sm">
                                            {slug ? (
                                                <img src={`https://cdn.simpleicons.org/${slug}`} className="w-4 h-4 sm:w-4 sm:h-4 object-contain opacity-70 dark:invert group-hover:opacity-100 group-hover:scale-110 transition-all"/>
                                            ) : (
                                                <SafeIcon name="car" size={14} className="text-zinc-400 group-hover:text-violet-500 transition-colors"/>
                                            )}
                                        </div>
                                        <span className="text-[11px] sm:text-[13px] font-bold text-zinc-800 dark:text-zinc-200 truncate group-hover:text-violet-500 transition-colors">{brand}</span>
                                    </div>
                                    <div className="flex items-center gap-3 shrink-0">
                                        <span className="text-[11px] sm:text-[13px] font-mono font-bold text-zinc-900 dark:text-white">{revenue.toLocaleString()} <span className="text-[9px] font-sans text-zinc-400">kr</span></span>
                                        <span className="text-[9px] sm:text-[10px] font-black text-violet-500 w-7 text-right">{pct}%</span>
                                    </div>
                                </div>
                            );
                        }) : <div className="text-center text-zinc-500 text-[11px] italic py-6">Ingen data</div>}
                    </div>
                </div>

            </div>
        </div>
    );
};
