// prognos.js - Strikt Tidsstyrt Serviceflöde (Alltid 5 kommande)

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
            OLD_OVERDUE: [], 
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

            let lastOilDate = null, lastBrakeDate = null, lastCabinDate = null, lastAirDate = null;

            // --- STENHÅRD PAKET-LÄSNING ---
            vehicle.jobs.forEach(j => {
                const p = String(j.paket || '').toLowerCase().trim();
                const c = String(j.kommentar || '').toLowerCase();
                const d = new Date(j.datum);
                const km = getKm(j);
                
                if (p === 'oljebyte' && !lastOilDate) {
                    lastOilDate = { date: d, km: km, job: j };
                }
                
                if ((p.includes('bromsvätska') || c.includes('bromsvätska')) && !lastBrakeDate) lastBrakeDate = { date: d, job: j };
                if ((p.includes('kupéfilter') || p.includes('kupefilter') || p.includes('pollenfilter') || c.includes('kupéfilter') || c.includes('kupefilter')) && !lastCabinDate) lastCabinDate = { date: d, job: j };
                if ((p.includes('luftfilter') || p.includes('bränslefilter') || c.includes('luftfilter') || c.includes('bränslefilter')) && !lastAirDate) lastAirDate = { date: d, job: j };
            });

            if (!lastOilDate) return;

            const needs = ['Oljebyte/Inspektion'];
            
            // OLJEBYTET BESTÄMMER TIDEN (Exakt 12 månader)
            let earliestDueDate = new Date(lastOilDate.date);
            earliestDueDate.setFullYear(earliestDueDate.getFullYear() + 1);
            let referenceJob = lastOilDate.job; 

            let hasMileageWarning = false;
            if (estMileage > 0 && lastOilDate.km > 0) {
                if (estMileage - lastOilDate.km >= 15000) {
                    hasMileageWarning = true;
                }
            }

            const checkAddon = (name, lastObj, years) => {
                if (!lastObj) return;
                let dueDate = new Date(lastObj.date);
                dueDate.setFullYear(dueDate.getFullYear() + years);
                if (dueDate <= earliestDueDate) {
                    needs.push(name);
                }
            };

            checkAddon('Bromsvätska', lastBrakeDate, 2);
            checkAddon('Kupéfilter', lastCabinDate, 2);
            checkAddon('Luft/Bränsle-filter', lastAirDate, 3);

            const daysSinceLastContact = Math.floor((now - new Date(vehicle.jobs[0].datum)) / (1000 * 60 * 60 * 24));
            if (daysSinceLastContact > 1095) return; 

            // Månadsberäkning baserad 100% på tid
            const monthDiff = getMonthDiff(earliestDueDate, now);
            let bucket = '';

            if (monthDiff < -1) bucket = 'OLD_OVERDUE';
            else if (monthDiff === -1) bucket = 'LAST_MONTH';
            else if (monthDiff === 0) bucket = 'THIS_MONTH';
            else if (monthDiff === 1) bucket = 'NEXT_MONTH';
            else if (monthDiff > 1) bucket = 'UPCOMING'; // ALLA framtida bilar (>1 mån) kastas in i denna hink!

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
        results.OLD_OVERDUE.sort(sortByDate);
        results.LAST_MONTH.sort(sortByDate);
        results.THIS_MONTH.sort(sortByDate);
        results.NEXT_MONTH.sort(sortByDate);
        
        // Sortera kommande och klipp listan till exakt max 5 st!
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
                <div className="flex items-center gap-4 mb-5">
                    <div className="h-[1px] flex-1 bg-zinc-200 dark:bg-white/10"></div>
                    <span className="text-[10px] sm:text-[11px] font-black uppercase tracking-widest text-zinc-500 dark:text-zinc-400">
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

                        return (
                            <div 
                                key={item.id + i} 
                                onClick={() => openProfile(item.regnr, job.id)}
                                className="bg-white dark:bg-[#182032] p-5 sm:p-6 rounded-2xl shadow-sm border border-zinc-200/80 dark:border-white/5 hover:border-orange-500 dark:hover:border-orange-500 hover:shadow-md transition-all cursor-pointer group"
                            >
                                <div className="text-[13px] sm:text-[14px] text-zinc-700 dark:text-zinc-300 leading-relaxed font-medium">
                                    <strong className="text-zinc-900 dark:text-white font-black uppercase">{item.customer}</strong>, <strong className="font-mono font-black tracking-widest text-zinc-900 dark:text-white mx-1">{item.regnr}</strong> utförde oljebyte för <strong className="text-zinc-900 dark:text-white font-black mx-1">{timeText}</strong>. 
                                    <br className="hidden sm:block" />
                                    Rekommenderar enligt serviceintervall: <span className="text-orange-600 dark:text-orange-400 font-bold">{item.needs.join(' & ')}</span><span className="text-orange-600/70 font-bold">{mileageText}</span>.
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

    const totalLeads = feedData.OLD_OVERDUE.length + feedData.LAST_MONTH.length + feedData.THIS_MONTH.length + feedData.NEXT_MONTH.length + feedData.UPCOMING.length;

    return (
        <div className="flex flex-col h-[100dvh] bg-[#fbfcfd] dark:bg-[#09090b] text-zinc-900 dark:text-white transition-colors duration-500 relative w-full overflow-hidden">
            
            <div className="px-4 py-6 md:py-8 shrink-0 z-20 flex flex-col items-center justify-center text-center relative bg-transparent border-b border-zinc-200/50 dark:border-white/5">
                <h1 className="text-2xl md:text-3xl font-black uppercase tracking-tight leading-none text-zinc-900 dark:text-white mb-2">
                    SERVICE<span className="text-zinc-400 font-light">FLÖDE</span>
                </h1>
                <p className="text-[10px] md:text-[11px] font-bold text-orange-500 uppercase tracking-widest">
                    {totalLeads} {totalLeads === 1 ? 'bil' : 'bilar'} i bevakning
                </p>
            </div>

            <div className="flex-1 overflow-y-auto overscroll-none custom-scrollbar p-4 md:p-6 lg:p-8 pb-32 relative">
                <div className="w-full max-w-4xl mx-auto">
                    
                    {totalLeads === 0 && (
                        <div className="py-20 text-center text-zinc-400 flex flex-col items-center">
                            <SafeIcon name="check-circle" size={40} className="mb-4 opacity-20" />
                            <span className="text-[12px] font-bold uppercase tracking-widest text-zinc-500">Kön är tom! Endast bilar med paketet "Oljebyte" visas.</span>
                        </div>
                    )}

                    <ListSection title="FÖRSENADE (ÄLDRE ÄN 1 MÅN)" items={feedData.OLD_OVERDUE} />
                    <ListSection title="FÖRRA MÅNADEN" items={feedData.LAST_MONTH} />
                    <ListSection title="DENNA MÅNAD" items={feedData.THIS_MONTH} />
                    <ListSection title="NÄSTA MÅNAD" items={feedData.NEXT_MONTH} />
                    <ListSection title="KOMMANDE" items={feedData.UPCOMING} />
                    
                </div>
            </div>
        </div>
    );
});
