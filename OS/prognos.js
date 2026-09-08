// prognos.js - Stabilt och kronologiskt Serviceflöde (Flimmer-fixad)

const SafeIcon = React.memo(({ name, size = 14, className = "" }) => (
    <span className={`inline-flex items-center justify-center shrink-0 ${className}`}>
        <window.Icon name={name} size={size} />
    </span>
));

const stripHtml = (html) => String(html || '').replace(/<br\s*[\/]?>/gi, " ").replace(/<[^>]*>?/gm, '').trim();

// Hjälpfunktion för att räkna skillnad i månader
const getMonthDiff = (d1, d2) => {
    return (d1.getFullYear() - d2.getFullYear()) * 12 + (d1.getMonth() - d2.getMonth());
};

window.PrognosView = React.memo(({ allJobs, setView }) => {
    
    const feedData = React.useMemo(() => {
        const groups = {};
        
        // 1. Gruppera alla jobb och exkludera BMG helt
        allJobs.forEach(job => {
            if (!job.regnr || job.regnr === '-' || job.deleted || !job.datum) return;
            if (job.kundnamn && job.kundnamn.toUpperCase().includes('BMG')) return;

            const reg = job.regnr.toUpperCase().replace(/\s+/g, '');
            if (!groups[reg]) groups[reg] = { jobs: [], customer: job.kundnamn, model: job.bilmodell };
            groups[reg].jobs.push(job);
        });

        const now = new Date();
        const results = {
            OLD_OVERDUE: [], // Äldre än 1 månad försenade
            LAST_MONTH: [],  // Skulle gjorts förra månaden
            THIS_MONTH: [],  // Ska göras denna månad
            NEXT_MONTH: [],  // Ska göras nästa månad
            UPCOMING: []     // 2-5 månader framåt
        };

        Object.keys(groups).forEach(reg => {
            const vehicle = groups[reg];
            vehicle.jobs.sort((a,b) => new Date(b.datum) - new Date(a.datum));

            // -- Kalkylera Miltal för att se om de passerat gränsen snabbare --
            const validMilJobs = vehicle.jobs.filter(j => j.miltal && parseInt(j.miltal.replace(/[^0-9]/g, '')) > 0).sort((a,b) => new Date(b.datum) - new Date(a.datum));
            let estMileage = 0;
            let milPerDay = 4.1; // Snitt 1500 mil/år

            if (validMilJobs.length >= 2) {
                let j1 = validMilJobs[0], j2 = validMilJobs[validMilJobs.length - 1];
                let diffDays = Math.abs((new Date(j1.datum) - new Date(j2.datum)) / (1000 * 60 * 60 * 24));
                let m1 = parseInt(j1.miltal.replace(/[^0-9]/g, '')), m2 = parseInt(j2.miltal.replace(/[^0-9]/g, ''));
                if (diffDays > 30 && Math.abs(m1 - m2) > 0) milPerDay = Math.min(Math.max(Math.abs(m1 - m2) / diffDays, 0.5), 15);
            }
            if (validMilJobs.length > 0) {
                let daysSinceLastKnown = Math.floor((now - new Date(validMilJobs[0].datum)) / (1000 * 60 * 60 * 24));
                estMileage = Math.round(parseInt(validMilJobs[0].miltal.replace(/[^0-9]/g, '')) + (daysSinceLastKnown * milPerDay));
            }

            let lastOilDate = null, lastBrakeDate = null, lastCabinDate = null, lastAirDate = null;

            // -- Extremt strikt sökning i historiken (Ignorera hjullager etc) --
            vehicle.jobs.forEach(j => {
                const p = (j.paket || '').toLowerCase();
                const c = (j.kommentar || '').toLowerCase();
                const d = new Date(j.datum);
                const mil = j.miltal ? parseInt(j.miltal.replace(/[^0-9]/g, '')) : 0;
                
                const isRepairOrTire = p.includes('felsökning') || p.includes('hjulskifte') || p.includes('hjul') || p.includes('däck') || p.includes('ac ') || p.includes('glas');

                if (!isRepairOrTire) {
                    if (!lastOilDate && (p.includes('olja') || p.includes('standard') || p.includes('service') || c.includes('olja') || c.includes('oljebyte') || c.includes('inspektion'))) {
                        lastOilDate = { date: d, mil: mil, job: j };
                    }
                    if (!lastBrakeDate && (p.includes('bromsvätska') || c.includes('bromsvätska'))) lastBrakeDate = { date: d, job: j };
                    if (!lastCabinDate && (p.includes('kupéfilter') || p.includes('kupefilter') || p.includes('pollenfilter') || c.includes('kupéfilter') || c.includes('kupefilter'))) lastCabinDate = { date: d, job: j };
                    if (!lastAirDate && (p.includes('luftfilter') || p.includes('bränslefilter') || c.includes('luftfilter') || c.includes('bränslefilter'))) lastAirDate = { date: d, job: j };
                }
            });

            const needs = [];
            let earliestDueDate = new Date(now.getFullYear() + 10, 0, 1);
            let referenceJob = null;
            let isMileageUrgent = false;

            const checkNeed = (name, lastObj, years, milLimit = null) => {
                if (!lastObj) return;
                let dueDate = new Date(lastObj.date);
                dueDate.setFullYear(dueDate.getFullYear() + years);
                
                if (milLimit && estMileage > 0 && lastObj.mil > 0) {
                    if (estMileage - lastObj.mil >= milLimit) {
                        dueDate = new Date(now); // Tvinga till "Nu" om miltalet passerat
                        if (name.includes('Oljebyte')) isMileageUrgent = true;
                    }
                }

                // Kolla om förfallodatumet ligger inom vår synliga radar (Max 5 månader fram)
                let horizon = new Date(now);
                horizon.setMonth(horizon.getMonth() + 5); 

                if (dueDate <= horizon) {
                    needs.push(name);
                    if (dueDate < earliestDueDate) {
                        earliestDueDate = dueDate;
                        referenceJob = lastObj.job;
                    }
                }
            };

            // Applicera intervallerna
            checkNeed('Oljebyte/Inspektion', lastOilDate, 1, 1500);
            checkNeed('Bromsvätska', lastBrakeDate, 2);
            checkNeed('Kupéfilter', lastCabinDate, 2);
            checkNeed('Luft/Bränsle-filter', lastAirDate, 3);

            // Om vi har något behov att larma om, och kunden inte är "död" (över 3 år)
            if (needs.length > 0 && referenceJob) {
                const daysSinceLastContact = Math.floor((now - new Date(referenceJob.datum)) / (1000 * 60 * 60 * 24));
                if (daysSinceLastContact > 1095) return; 

                const monthDiff = getMonthDiff(earliestDueDate, now);
                let bucket = '';

                if (monthDiff < -1) bucket = 'OLD_OVERDUE';
                else if (monthDiff === -1) bucket = 'LAST_MONTH';
                else if (monthDiff === 0) bucket = 'THIS_MONTH';
                else if (monthDiff === 1) bucket = 'NEXT_MONTH';
                else if (monthDiff > 1 && monthDiff <= 5) bucket = 'UPCOMING';
                else return;

                const monthsSinceJob = getMonthDiff(now, new Date(referenceJob.datum));

                results[bucket].push({
                    id: reg,
                    regnr: reg,
                    customer: vehicle.customer || 'Okänd Kund',
                    referenceJob: referenceJob,
                    monthsSinceJob: monthsSinceJob,
                    isMileageUrgent: isMileageUrgent,
                    needs: needs,
                    sortDate: earliestDueDate
                });
            }
        });

        // Sortera listorna internt
        const sortByDate = (a, b) => a.sortDate - b.sortDate;
        results.OLD_OVERDUE.sort(sortByDate);
        results.LAST_MONTH.sort(sortByDate);
        results.THIS_MONTH.sort(sortByDate);
        results.NEXT_MONTH.sort(sortByDate);
        results.UPCOMING.sort(sortByDate);

        return results;
    }, [allJobs]);

    // FIXEN LIGGER HÄR: Låser fast ikonladdningen så den inte körs av misstag varje sekund!
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
                        const paketName = (job.paket || 'service').toLowerCase();
                        const commentText = stripHtml(job.kommentar);
                        const exactDate = job.datum ? job.datum.split('T')[0] : '';
                        
                        let descText = `utförde ${paketName} för ${item.monthsSinceJob} mån sedan`;
                        if (item.monthsSinceJob === 0) descText = `utförde ${paketName} nyligen`;

                        return (
                            <div 
                                key={item.id + i} 
                                onClick={() => openProfile(item.regnr, job.id)}
                                className="bg-white dark:bg-[#182032] p-5 sm:p-6 rounded-2xl shadow-sm border border-zinc-200/80 dark:border-white/5 hover:border-orange-500 dark:hover:border-orange-500 hover:shadow-md transition-all cursor-pointer group"
                            >
                                <div className="text-[13px] sm:text-[14px] text-zinc-800 dark:text-zinc-200 leading-relaxed font-medium">
                                    <strong className="text-zinc-900 dark:text-white font-black uppercase">{item.customer}</strong>, <span className="font-mono font-bold tracking-widest text-zinc-600 dark:text-zinc-400">{item.regnr}</span> {descText}. 
                                    Rekommenderar {item.isMileageUrgent ? 'pga miltal' : 'enligt serviceintervall'}: <span className="text-orange-600 dark:text-orange-400 font-bold">{item.needs.join(' & ')}</span>.
                                </div>
                                
                                <div className="mt-4 bg-zinc-50 dark:bg-[#0f1522] rounded-xl p-3.5 sm:p-4 border border-zinc-100 dark:border-transparent flex flex-col gap-2">
                                    <div className="flex items-center justify-between">
                                        <div className="text-[10px] font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-widest flex items-center gap-1.5">
                                            <SafeIcon name="calendar" size={12} /> {exactDate}
                                        </div>
                                        <div className="text-[9px] font-bold text-zinc-400 group-hover:text-orange-500 uppercase tracking-widest transition-colors flex items-center gap-1">
                                            Öppna kvitto <SafeIcon name="chevron-right" size={10} />
                                        </div>
                                    </div>
                                    {commentText && (
                                        <div className="text-[11px] sm:text-[12px] text-zinc-600 dark:text-zinc-400 italic leading-relaxed mt-1">
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
            
            {/* Avskalad Header */}
            <div className="px-4 py-6 md:py-8 shrink-0 z-20 flex flex-col items-center justify-center text-center relative bg-transparent border-b border-zinc-200/50 dark:border-white/5">
                <h1 className="text-2xl md:text-3xl font-black uppercase tracking-tight leading-none text-zinc-900 dark:text-white mb-2">
                    SERVICE<span className="text-zinc-400 font-light">FLÖDE</span>
                </h1>
                <p className="text-[10px] md:text-[11px] font-bold text-orange-500 uppercase tracking-widest">
                    {totalLeads} {totalLeads === 1 ? 'bil' : 'bilar'} i bevakning
                </p>
            </div>

            {/* Innehåll - Maxbredd på 900px håller det läsbart och samlat */}
            <div className="flex-1 overflow-y-auto overscroll-none custom-scrollbar p-4 md:p-6 lg:p-8 pb-32 relative">
                <div className="w-full max-w-4xl mx-auto">
                    
                    {totalLeads === 0 && (
                        <div className="py-20 text-center text-zinc-400 flex flex-col items-center">
                            <SafeIcon name="check-circle" size={40} className="mb-4 opacity-20" />
                            <span className="text-[12px] font-bold uppercase tracking-widest text-zinc-500">Kön är tom!</span>
                        </div>
                    )}

                    {/* Sektionerna renderas i exakt den ordning du önskade */}
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
