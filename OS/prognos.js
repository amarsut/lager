// prognos.js - Visuell Hierarki för Rekommendationer

const SafeIcon = React.memo(({ name, size = 14, className = "" }) => (
    <span className={`inline-flex items-center justify-center shrink-0 ${className}`}>
        <window.Icon name={name} size={size} />
    </span>
));

const stripHtml = (html) => String(html || '').replace(/<br\s*[\/]?>/gi, " ").replace(/<[^>]*>?/gm, '').trim();

const getMonthDiff = (d1, d2) => {
    return (d1.getFullYear() - d2.getFullYear()) * 12 + (d1.getMonth() - d2.getMonth());
};

window.PrognosView = React.memo(({ allJobs, setView }) => {
    
    const feedData = React.useMemo(() => {
        const groups = {};
        
        allJobs.forEach(job => {
            if (!job.regnr || job.regnr === '-' || job.deleted || !job.datum) return;
            if (job.kundnamn && job.kundnamn.toUpperCase().includes('BMG')) return;

            const reg = job.regnr.toUpperCase().replace(/\s+/g, '');
            if (!groups[reg]) groups[reg] = { jobs: [], customer: job.kundnamn, model: job.bilmodell };
            groups[reg].jobs.push(job);
        });

        const now = new Date();
        const results = {
            LAST_MONTH: [],  
            THIS_MONTH: [],  
            NEXT_MONTH: [],  
            UPCOMING: []     
        };

        Object.keys(groups).forEach(reg => {
            const vehicle = groups[reg];
            
            // Sortera: Nyaste jobbet ligger först
            vehicle.jobs.sort((a,b) => (new Date(b.datum).getTime() || 0) - (new Date(a.datum).getTime() || 0));

            // --- SMART MILTALS-EXTRAHERING ---
            const getKm = (j) => {
                const match = String(j.kommentar || '').match(/(\d+)\s*km/i);
                if (match) return parseInt(match[1], 10);
                
                if (j.miltal) {
                    let m = parseInt(String(j.miltal).replace(/[^0-9]/g, ''));
                    if (m < 50000 && m > 0) return m * 10;
                    return m;
                }
                return 0;
            };

            const validMilJobs = vehicle.jobs
                .map(j => ({ date: new Date(j.datum), km: getKm(j), job: j }))
                .filter(j => j.km > 0)
                .sort((a,b) => b.date.getTime() - a.date.getTime());

            let estMileage = 0;
            let kmPerDay = 41;

            if (validMilJobs.length >= 2) {
                let j1 = validMilJobs[0], j2 = validMilJobs[validMilJobs.length - 1];
                let diffDays = Math.abs((j1.date - j2.date) / (1000 * 60 * 60 * 24));
                if (diffDays > 30 && Math.abs(j1.km - j2.km) > 0) {
                    kmPerDay = Math.min(Math.max(Math.abs(j1.km - j2.km) / diffDays, 5), 150);
                }
            }
            if (validMilJobs.length > 0) {
                let daysSinceLastKnown = Math.floor((now - validMilJobs[0].date) / (1000 * 60 * 60 * 24));
                estMileage = Math.round(validMilJobs[0].km + (daysSinceLastKnown * kmPerDay));
            }

            let lastOilDate = null, 
                lastBrakeDate = null, 
                lastCabinDate = null, 
                lastAirDate = null,
                lastFuelDate = null,
                lastHaldexDate = null,
                lastSparkPlugDate = null;

            // --- STENHÅRD PAKET-LÄSNING BÅKÅT I TIDEN ---
            vehicle.jobs.forEach(j => {
                const p = String(j.paket || '').toLowerCase().trim();
                const c = String(j.kommentar || '').toLowerCase();
                const d = new Date(j.datum);
                const km = getKm(j);
                
                if (p === 'oljebyte' && !lastOilDate) {
                    lastOilDate = { date: d, km: km, job: j };
                }
                
                // Extraherar alla olika tillägg
                if ((p.includes('bromsvätska') || c.includes('bromsvätska')) && !lastBrakeDate) lastBrakeDate = { date: d, job: j };
                if ((p.includes('kupéfilter') || p.includes('kupefilter') || p.includes('pollenfilter') || c.includes('kupéfilter') || c.includes('kupefilter')) && !lastCabinDate) lastCabinDate = { date: d, job: j };
                if ((p.includes('luftfilter') || c.includes('luftfilter')) && !lastAirDate) lastAirDate = { date: d, job: j };
                if ((p.includes('bränslefilter') || c.includes('bränslefilter') || p.includes('dieselfilter') || c.includes('dieselfilter')) && !lastFuelDate) lastFuelDate = { date: d, job: j };
                if ((p.includes('haldex') || c.includes('haldex') || p.includes('fyrhjuls') || c.includes('fyrhjuls')) && !lastHaldexDate) lastHaldexDate = { date: d, job: j };
                if ((p.includes('tändstift') || c.includes('tändstift')) && !lastSparkPlugDate) lastSparkPlugDate = { date: d, job: j };
            });

            if (!lastOilDate) return;

            const needs = ['Oljebyte/Inspektion'];
            
            let earliestDueDate = new Date(lastOilDate.date);
            earliestDueDate.setFullYear(earliestDueDate.getFullYear() + 1);
            let referenceJob = lastOilDate.job; 

            let hasMileageWarning = false;
            if (estMileage > 0 && lastOilDate.km > 0) {
                if (estMileage - lastOilDate.km >= 15000) {
                    hasMileageWarning = true;
                }
            }

            // SMART TILLÄGGS-KOLL MED INTERVALLER
            const checkAddon = (name, lastObj, years, warnIfMissing = false) => {
                if (!lastObj) {
                    // Använder * istället för (?) om historik saknas
                    if (warnIfMissing) needs.push(`${name}*`);
                    return;
                }

                let dueDate = new Date(lastObj.date);
                dueDate.setFullYear(dueDate.getFullYear() + years);
                
                // Buffert: Är det dags inom 3 månader efter servicen? Då tar vi det nu.
                let bufferedDueDate = new Date(earliestDueDate);
                bufferedDueDate.setMonth(bufferedDueDate.getMonth() + 3);

                if (dueDate <= bufferedDueDate) {
                    needs.push(name);
                }
            };

            // Dina specifika intervaller:
            checkAddon('Bromsvätska', lastBrakeDate, 2, true);
            checkAddon('Kupéfilter', lastCabinDate, 2, true);
            checkAddon('Luftfilter', lastAirDate, 6, true);
            checkAddon('Bränslefilter', lastFuelDate, 6, true);
            
            checkAddon('Haldex', lastHaldexDate, 3, false);
            checkAddon('Tändstift', lastSparkPlugDate, 4, false);

            // Självrensande: Över 14 månader försenad = Raderas från vyn
            const monthDiff = getMonthDiff(earliestDueDate, now);
            let bucket = '';

            if (monthDiff < -1) return;
            else if (monthDiff === -1) bucket = 'LAST_MONTH';
            else if (monthDiff === 0) bucket = 'THIS_MONTH';
            else if (monthDiff === 1) bucket = 'NEXT_MONTH';
            else if (monthDiff > 1) bucket = 'UPCOMING'; 

            if (bucket) {
                const monthsSinceJob = getMonthDiff(now, new Date(referenceJob.datum));
                results[bucket].push({
                    id: reg,
                    regnr: reg,
                    customer: vehicle.customer || 'Okänd Kund',
                    referenceJob: referenceJob,
                    monthsSinceJob: monthsSinceJob,
                    monthDiff: monthDiff,
                    hasMileageWarning: hasMileageWarning,
                    needs: needs,
                    sortDate: earliestDueDate
                });
            }
        });

        // Sortera listorna
        const sortByDate = (a, b) => a.sortDate - b.sortDate;
        results.LAST_MONTH.sort(sortByDate);
        results.THIS_MONTH.sort(sortByDate);
        results.NEXT_MONTH.sort(sortByDate);
        
        // Klipper kommande listan till exakt de 5 närmaste
        results.UPCOMING.sort(sortByDate);
        results.UPCOMING = results.UPCOMING.slice(0, 5);

        return results;
    }, [allJobs]);

    React.useEffect(() => {
        if (window.lucide) window.lucide.createIcons();
    }, [feedData]); 

    const openProfile = (regnr, jobId) => {
        if (window.openVehicleProfile) window.openVehicleProfile(regnr, jobId);
    };

    const ListSection = ({ title, items }) => {
        if (items.length === 0) return null;
        
        return (
            <div className="mb-10 animate-in fade-in duration-500">
                {/* Vänsterställd rubrik med linje efteråt */}
                <div className="flex items-center gap-4 mb-5">
                    <span className="text-[10px] sm:text-[11px] font-black uppercase tracking-widest text-zinc-500 dark:text-zinc-400 shrink-0">
                        {title}
                    </span>
                    <div className="h-[1px] flex-1 bg-zinc-200 dark:bg-white/10"></div>
                </div>

                <div className="flex flex-col gap-4">
                    {items.map((item, i) => {
                        const job = item.referenceJob;
                        const commentText = stripHtml(job.kommentar);
                        const exactDate = job.datum ? job.datum.split('T')[0] : '';
                        
                        let timeText = item.monthsSinceJob === 0 ? "nyligen" : `${item.monthsSinceJob} mån sedan`;
                        if (item.monthDiff > 0) {
                            timeText += ` (dags om ${item.monthDiff} mån)`;
                        }

                        let mileageText = item.hasMileageWarning ? " (rek. även efter miltal)" : "";
                        
                        const mainService = item.needs[0];
                        const addOns = item.needs.slice(1);

                        return (
                            <div 
                                key={item.id + i} 
                                onClick={() => openProfile(item.regnr, job.id)}
                                className="bg-white dark:bg-[#182032] p-5 sm:p-6 rounded-2xl shadow-sm border border-zinc-200/80 dark:border-white/5 hover:border-orange-500 dark:hover:border-orange-500 hover:shadow-md transition-all cursor-pointer group"
                            >
                                <div className="text-[13px] sm:text-[14px] text-zinc-700 dark:text-zinc-300 leading-relaxed font-medium">
                                    <p className="mb-1.5 sm:mb-1 block">
                                        <strong className="text-zinc-900 dark:text-white font-black uppercase">{item.customer}</strong>, 
                                        <strong className="font-mono font-black tracking-widest text-zinc-900 dark:text-white mx-1">{item.regnr}</strong> 
                                        utförde oljebyte för 
                                        <strong className="text-zinc-900 dark:text-white font-black mx-1">{timeText}</strong>.
                                    </p>
                                    <p className="text-[12px] sm:text-[13px] leading-snug">
                                        Rekommenderar enligt historik: <span className="text-orange-600 dark:text-orange-400 font-bold">{mainService}</span>
                                        {addOns.length > 0 && (
                                            <span className="text-zinc-500 dark:text-zinc-400 font-medium ml-1">
                                                ({addOns.join(', ')})
                                            </span>
                                        )}
                                        {mileageText && (
                                            <span className="text-orange-600/70 font-bold ml-1">{mileageText}</span>
                                        )}
                                    </p>
                                </div>
                                
                                <div className="mt-4 bg-zinc-50 dark:bg-[#0f1522] rounded-xl p-3.5 sm:p-4 border border-zinc-100 dark:border-transparent flex flex-col gap-2">
                                    <div className="flex items-center justify-between">
                                        <div className="text-[10px] font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-widest flex items-center gap-1.5">
                                            <SafeIcon name="calendar" size={12} /> {exactDate}
                                        </div>
                                        <div className="text-[9px] font-bold text-zinc-400 group-hover:text-orange-500 uppercase tracking-widest transition-colors flex items-center gap-1">
                                            ÖPPNA KVITTO <SafeIcon name="chevron-right" size={10} />
                                        </div>
                                    </div>
                                    {commentText && (
                                        <div className="text-[11px] sm:text-[12px] text-zinc-500 dark:text-zinc-400 italic leading-relaxed mt-1.5">
                                            "{commentText}"
                                        </div>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        );
    };

    const CompactOldSection = ({ items }) => {
        if (items.length === 0) return null;
        return (
            <div className="mb-10 animate-in fade-in duration-500">
                {/* Vänsterställd rubrik */}
                <div className="flex items-center gap-4 mb-5">
                    <span className="text-[10px] sm:text-[11px] font-black uppercase tracking-widest text-zinc-400 dark:text-zinc-500 shrink-0">
                        ÄLDRE FÖRSENADE (VÄNTANDE PÅ UPPDATERING)
                    </span>
                    <div className="h-[1px] flex-1 bg-zinc-200 dark:bg-white/10"></div>
                </div>
                
                {/* justify-start istället för justify-center */}
                <div className="flex flex-wrap gap-2.5 justify-start">
                    {items.map((item, i) => (
                        <div 
                            key={item.id + i} 
                            onClick={() => openProfile(item.regnr, item.referenceJob.id)}
                            title={`${item.customer} - ${item.monthsSinceJob} mån sedan`}
                            className="bg-white dark:bg-[#182032] border border-zinc-200 dark:border-white/10 px-3 py-2 rounded-lg shadow-sm flex items-center gap-2.5 cursor-pointer hover:border-orange-500 hover:shadow-md transition-all hover:-translate-y-0.5 group"
                        >
                            <span className="font-mono text-xs font-black tracking-widest text-zinc-800 dark:text-zinc-200 group-hover:text-orange-500 transition-colors">
                                {item.regnr}
                            </span>
                            <div className="w-[1px] h-3 bg-zinc-200 dark:bg-zinc-700"></div>
                            <span className="text-[10px] font-bold text-zinc-400">
                                {item.monthsSinceJob} mån
                            </span>
                        </div>
                    ))}
                </div>
            </div>
        );
    };

    const totalLeads = feedData.LAST_MONTH.length + feedData.THIS_MONTH.length + feedData.NEXT_MONTH.length + feedData.UPCOMING.length;

    return (
        <div className="flex flex-col h-[100dvh] bg-[#fbfcfd] dark:bg-[#09090b] text-zinc-900 dark:text-white transition-colors duration-500 relative w-full overflow-hidden">
            
            {/* Header: Vänsterställd (items-start, text-left) */}
            <div className="px-4 py-6 md:py-8 shrink-0 z-20 flex flex-col items-start justify-center text-left relative bg-transparent border-b border-zinc-200/50 dark:border-white/5">
                <h1 className="text-2xl md:text-3xl font-black uppercase tracking-tight leading-none text-zinc-900 dark:text-white mb-2">
                    SERVICE<span className="text-zinc-400 font-light">FLÖDE</span>
                </h1>
                <p className="text-[10px] md:text-[11px] font-bold text-orange-500 uppercase tracking-widest flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-orange-500 animate-pulse"></span>
                    {totalLeads} {totalLeads === 1 ? 'bil' : 'bilar'} i bevakning
                </p>
            </div>

            <div className="flex-1 overflow-y-auto overscroll-none custom-scrollbar p-4 md:p-6 lg:p-8 pb-32 relative">
                {/* Max-width ökad och mx-auto borttagen för att stanna till vänster */}
                <div className="w-full max-w-5xl ml-0">
                    
                    {totalLeads === 0 && feedData.OLD_OVERDUE.length === 0 && (
                        <div className="py-20 text-left text-zinc-400 flex flex-col items-start">
                            <SafeIcon name="check-circle" size={40} className="mb-4 opacity-20" />
                            <span className="text-[12px] font-bold uppercase tracking-widest text-zinc-500">Kön är tom! Endast bilar med paketet "Oljebyte" visas.</span>
                        </div>
                    )}

                    <CompactOldSection items={feedData.OLD_OVERDUE} />
                    <ListSection title="FÖRRA MÅNADEN" items={feedData.LAST_MONTH} />
                    <ListSection title="DENNA MÅNAD" items={feedData.THIS_MONTH} />
                    <ListSection title="NÄSTA MÅNAD" items={feedData.NEXT_MONTH} />
                    <ListSection title="KOMMANDE (NÄRMASTE 5)" items={feedData.UPCOMING} />
                    
                </div>
            </div>
        </div>
    );
});
