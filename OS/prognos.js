// prognos.js - Live CRM & Kunduppföljning med Miltalsextrapolering

const SafeIcon = ({ name, size = 14, className = "" }) => (
    <span className="inline-flex items-center justify-center shrink-0">
        <window.Icon name={name} size={size} className={className} />
    </span>
);

const LicensePlate = ({ regnr, size = 'md' }) => {
    if (!regnr || regnr === '-' || regnr.length > 8) return null;
    const sizes = { sm: 'h-[20px] text-[10px] w-[10px] pt-[1px]', md: 'h-[24px] text-[12px] w-[12px] pt-[1px]', lg: 'h-[28px] text-[14px] w-[14px] pt-[2px]' };
    return (
        <div className={`inline-flex items-center rounded border overflow-hidden relative shadow-sm bg-white dark:bg-[#1a2235] border-zinc-300 dark:border-[#2a3441] shrink-0 ${sizes[size].split(' ')[0]}`}>
            <div className={`bg-[#003399] h-full flex flex-col items-center justify-between shrink-0 border-r border-zinc-300 dark:border-[#2a3441] ${sizes[size].split(' ')[2]} py-[2px]`}>
                <div className="w-[60%] aspect-square rounded-full border-[1px] border-[#ffcc00] mt-[1px]"></div>
                <span className={`font-sans font-black text-white leading-none ${size === 'sm' ? 'text-[5px]' : size === 'md' ? 'text-[6px]' : 'text-[8px]'} mb-[1px]`}>S</span>
            </div>
            <div className="flex h-full items-center justify-center px-2.5">
                <span className={`font-mono font-black text-zinc-900 dark:text-zinc-200 tracking-[0.1em] uppercase leading-none ${sizes[size].split(' ')[1]} ${sizes[size].split(' ')[3]}`}>
                    {regnr}
                </span>
            </div>
        </div>
    );
};

const getAvatarTheme = (name) => {
    if (!name) return 'bg-zinc-100 text-zinc-600 border-zinc-200';
    const themes = [
        'bg-blue-50 text-blue-600 border-blue-200', 'bg-emerald-50 text-emerald-600 border-emerald-200',
        'bg-violet-50 text-violet-600 border-violet-200', 'bg-amber-50 text-amber-700 border-amber-200',
        'bg-rose-50 text-rose-600 border-rose-200', 'bg-cyan-50 text-cyan-600 border-cyan-200'
    ];
    let hash = 0;
    for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
    return themes[Math.abs(hash) % themes.length];
};

const stripHtml = (html) => String(html || '').replace(/<br\s*[\/]?>/gi, " ").replace(/<[^>]*>?/gm, '').trim();

window.PrognosView = ({ allJobs, setView }) => {
    const [searchQuery, setSearchQuery] = React.useState('');
    const [filter, setFilter] = React.useState('ALL'); 
    const [selectedId, setSelectedId] = React.useState(null);
    const [fetchedSpecs, setFetchedSpecs] = React.useState({});
    const [copiedReg, setCopiedReg] = React.useState(false);

    React.useEffect(() => { if (window.lucide) window.lucide.createIcons(); });

    // 1. SMART DATA-MOTOR: Intervaller + Miltals-kalkylator
    const leads = React.useMemo(() => {
        const groups = {};
        allJobs.forEach(job => {
            if (!job.regnr || job.regnr === '-' || job.deleted || !job.datum) return;
            
            // EXKLUDERA ALLA BMG-BILART[cite: 5]
            if (job.kundnamn && job.kundnamn.toUpperCase().includes('BMG')) return;

            const reg = job.regnr.toUpperCase().replace(/\s+/g, '');
            if (!groups[reg]) groups[reg] = { jobs: [], customer: job.kundnamn, model: job.bilmodell };
            groups[reg].jobs.push(job);
        });

        const now = new Date();
        const results = [];
        const serviceKeywords = ['olja', 'service', 'filter', 'broms', 'rem', 'stift', 'vätska', 'inspektion'];

        Object.keys(groups).forEach(reg => {
            const vehicle = groups[reg];
            vehicle.jobs.sort((a,b) => new Date(b.datum) - new Date(a.datum));

            // Filtrera ut giltiga miltals-avläsningar för extrapolering
            const validMilJobs = vehicle.jobs.filter(j => j.miltal && parseInt(j.miltal.replace(/[^0-9]/g, '')) > 0).sort((a,b) => new Date(b.datum) - new Date(a.datum));
            
            let milPerDay = 4.1; // Standard: Ca 1500 mil per år
            let estMileage = 0;
            let lastKnownMileage = 0;

            if (validMilJobs.length >= 2) {
                let j1 = validMilJobs[0];
                let j2 = validMilJobs[validMilJobs.length - 1]; // Äldsta kända
                let m1 = parseInt(j1.miltal.replace(/[^0-9]/g, ''));
                let m2 = parseInt(j2.miltal.replace(/[^0-9]/g, ''));
                let d1 = new Date(j1.datum);
                let d2 = new Date(j2.datum);
                let diffDays = Math.abs((d1 - d2) / (1000 * 60 * 60 * 24));
                
                if (diffDays > 30 && Math.abs(m1 - m2) > 0) {
                    milPerDay = Math.abs(m1 - m2) / diffDays;
                    milPerDay = Math.min(Math.max(milPerDay, 0.5), 15); // Spärr: Mellan 180 och 5400 mil per år
                }
            }

            if (validMilJobs.length > 0) {
                lastKnownMileage = parseInt(validMilJobs[0].miltal.replace(/[^0-9]/g, ''));
                let daysSinceLastKnown = Math.floor((now - new Date(validMilJobs[0].datum)) / (1000 * 60 * 60 * 24));
                estMileage = Math.round(lastKnownMileage + (daysSinceLastKnown * milPerDay));
            }

            let lastOil = null, lastBrake = null, lastCabin = null, lastAir = null;
            let lastServiceJob = null;

            // Identifiera när specifika delar byttes sist
            vehicle.jobs.forEach(j => {
                const text = `${j.paket || ''} ${j.kommentar || ''}`.toLowerCase();
                const d = new Date(j.datum);
                const isService = (j.paket === 'Oljebyte' || j.paket === 'Standard' || serviceKeywords.some(kw => text.includes(kw))) && j.paket !== 'Felsökning' && j.paket !== 'Hjulskifte';
                
                if (isService && !lastServiceJob) lastServiceJob = j;

                if (!lastOil && (text.includes('olja') || text.includes('oljebyte') || text.includes('service') || text.includes('standard') || text.includes('inspektion'))) lastOil = { date: d, mil: j.miltal ? parseInt(j.miltal.replace(/[^0-9]/g, '')) : 0 };
                if (!lastBrake && text.includes('bromsvätska')) lastBrake = d;
                if (!lastCabin && (text.includes('kupéfilter') || text.includes('kupefilter') || text.includes('pollenfilter'))) lastCabin = d;
                if (!lastAir && (text.includes('luftfilter') || text.includes('bränslefilter'))) lastAir = d;
            });

            const needs = [];
            let maxDays = 0;

            // --- REGLER: 1 ÅR ELLER 1500 MIL ---
            if (lastOil) {
                const daysSinceOil = Math.floor((now - lastOil.date) / (1000 * 60 * 60 * 24));
                const milSinceOil = (estMileage > 0 && lastOil.mil > 0) ? (estMileage - lastOil.mil) : 0;
                
                let trig = false;
                let reason = '';
                
                if (milSinceOil >= 1500) { trig = true; reason = `Miltal (${milSinceOil} mil sedan sist)`; }
                else if (daysSinceOil >= 330) { trig = true; reason = `Tidintervall (${Math.floor(daysSinceOil/30)} mån sen)`; }

                if (trig) {
                    needs.push({ title: 'Oljebyte / Inspektion', detail: reason });
                    maxDays = Math.max(maxDays, daysSinceOil);
                }
            } else if (lastServiceJob) {
                // Fallback om vi inte uttryckligen skrivit "olja" men gjort en service
                const days = Math.floor((now - new Date(lastServiceJob.datum)) / (1000 * 60 * 60 * 24));
                if (days > 330) {
                    needs.push({ title: 'Årlig Service', detail: `Tidintervall (${Math.floor(days/30)} mån sen)` });
                    maxDays = Math.max(maxDays, days);
                }
            }

            if (lastBrake) {
                const days = Math.floor((now - lastBrake) / (1000 * 60 * 60 * 24));
                if (days >= 700) { needs.push({ title: 'Bromsvätska', detail: 'Tid (Över 2 år)' }); maxDays = Math.max(maxDays, days); }
            }
            if (lastCabin) {
                const days = Math.floor((now - lastCabin) / (1000 * 60 * 60 * 24));
                if (days >= 700) { needs.push({ title: 'Kupéfilter', detail: 'Tid (Över 2 år)' }); maxDays = Math.max(maxDays, days); }
            }
            if (lastAir) {
                const days = Math.floor((now - lastAir) / (1000 * 60 * 60 * 24));
                if (days >= 1050) { needs.push({ title: 'Luft/Bränsle-filter', detail: 'Tid (Över 3 år)' }); maxDays = Math.max(maxDays, days); }
            }

            // Endast fordon som inte varit borta i över 3 år (döda leads)
            if (needs.length > 0 && maxDays < 1095) {
                results.push({
                    id: reg,
                    regnr: reg,
                    customer: vehicle.jobs[0].kundnamn || 'Okänd',
                    model: vehicle.jobs[0].bilmodell,
                    daysSince: maxDays,
                    needs: needs,
                    estMileage: estMileage,
                    milPerYear: Math.round(milPerDay * 365),
                    lastServiceJob: lastServiceJob || vehicle.jobs[0],
                    jobs: vehicle.jobs
                });
            }
        });

        return results.sort((a, b) => b.daysSince - a.daysSince);
    }, [allJobs]);

    const visibleLeads = React.useMemo(() => {
        let filtered = leads;
        if (searchQuery) {
            const sq = searchQuery.toLowerCase();
            filtered = filtered.filter(l => l.regnr.toLowerCase().includes(sq) || l.customer.toLowerCase().includes(sq));
        }
        if (filter === 'OVER1') filtered = filtered.filter(l => l.daysSince > 365);
        return filtered;
    }, [leads, searchQuery, filter]);

    React.useEffect(() => {
        if (!selectedId && visibleLeads.length > 0) setSelectedId(visibleLeads[0].id);
    }, [visibleLeads, selectedId]);

    const activeLead = visibleLeads.find(l => l.id === selectedId) || null;

    React.useEffect(() => {
        if (!activeLead || !window.db) return;
        const reg = activeLead.regnr;
        if (fetchedSpecs[reg]) return;

        window.db.collection('vehicleSpecs').doc(reg).get().then(doc => {
            if (doc.exists) setFetchedSpecs(prev => ({ ...prev, [reg]: doc.data() }));
        });
    }, [activeLead]);

    const handleCopy = (text) => {
        navigator.clipboard.writeText(text);
        setCopiedReg(true);
        setTimeout(() => setCopiedReg(false), 2000);
    };

    const getSmsTemplate = (lead) => {
        if (!lead) return '';
        const cName = lead.customer.split(' ')[0].toUpperCase();
        const actions = lead.needs.map(n => n.title).join(' och ').toLowerCase();
        return `Hej ${cName}! Enligt våra system börjar det bli dags för ${actions} på din bil (${lead.regnr}). Ska vi kika på en tid för detta? Mvh Amar, BMG Motorgrupp`;
    };

    const stats = { totalLeads: leads.length, potValue: leads.length * 3500 };

    return (
        <div className="flex flex-col h-[100dvh] bg-transparent text-zinc-900 dark:text-white pb-0 transition-colors duration-500 relative max-w-[1400px] ml-0 w-full animate-in fade-in slide-in-from-left-4 overflow-hidden">
            
            <div className="absolute top-0 left-[-10%] w-[60%] h-[400px] bg-orange-500/10 dark:bg-orange-500/5 blur-[120px] rounded-full pointer-events-none -z-10 hidden lg:block"></div>

            {/* HEADER */}
            <div className="flex flex-col md:flex-row md:items-end justify-between mb-4 pb-4 border-b border-zinc-200 dark:border-white/10 gap-4 px-4 pt-4 lg:px-0 lg:pt-0 shrink-0">
                <div className="flex items-center gap-3 md:gap-4">
                    <div className="relative group cursor-default shrink-0">
                        <div className="absolute inset-0 bg-orange-500/40 blur-lg rounded-full transition-all duration-700 group-hover:bg-orange-500/60" />
                        <div className="relative w-10 h-10 md:w-12 md:h-12 rounded-xl flex items-center justify-center text-white shadow-md border border-white/20 transition-colors bg-gradient-to-br from-orange-400 to-orange-600">
                            <window.Icon name="inbox" size={20} className="md:w-6 md:h-6" />
                        </div>
                    </div>
                    <div className="flex flex-col">
                        <h1 className="text-xl md:text-2xl font-black text-zinc-900 dark:text-white uppercase tracking-tight leading-none">
                            SERVICE<span className="text-zinc-400 dark:text-zinc-500 font-light">PROGNOS</span>
                        </h1>
                        <p className="text-[9px] md:text-[10px] font-bold text-orange-500 dark:text-orange-400 uppercase tracking-widest mt-1 flex items-center gap-1.5">
                            <span className="w-1.5 h-1.5 rounded-full bg-orange-500 animate-pulse"></span>
                            Automatisk Servicebevakning
                        </p>
                    </div>
                </div>

                <div className="flex gap-2 sm:gap-3 overflow-x-auto [&::-webkit-scrollbar]:hidden pb-1 sm:pb-0">
                    <div className="bg-white/90 dark:bg-[#182032]/90 px-3 py-2 rounded-xl border border-zinc-200/80 dark:border-white/5 shadow-sm flex flex-col items-end justify-center min-w-[90px]">
                        <span className="text-[8px] font-bold text-zinc-400 uppercase tracking-widest mb-0.5">Möjligt Värde</span>
                        <span className="text-lg font-light leading-none tracking-tighter tabular-nums text-zinc-900 dark:text-white">{(stats.potValue/1000).toFixed(1)} <span className="text-[9px] font-bold text-zinc-400">TKR</span></span>
                    </div>
                    <div className="bg-white/90 dark:bg-[#182032]/90 px-3 py-2 rounded-xl border border-zinc-200/80 dark:border-white/5 shadow-sm flex flex-col items-end justify-center min-w-[90px]">
                        <span className="text-[8px] font-bold text-zinc-400 uppercase tracking-widest mb-0.5">Potentiella Jobb</span>
                        <span className="text-lg font-light leading-none tracking-tighter tabular-nums text-zinc-900 dark:text-white">{stats.totalLeads} <span className="text-[9px] font-bold text-zinc-400">ST</span></span>
                    </div>
                </div>
            </div>

            {/* HUVUDVY (SPLIT) - FLEX LAYOUT FÖR ATT FÖRHINDRA ÖVERLAPP */}
            <div className="flex flex-col lg:flex-row flex-1 lg:rounded-[1.5rem] lg:border border-zinc-200/80 dark:border-white/5 shadow-sm overflow-hidden min-h-0 relative z-10 mx-0 lg:mx-0">
                
                {/* VÄNSTERPANEL: TYDLIG LISTA */}
                <div className={`w-full lg:w-[360px] border-r border-zinc-200/80 dark:border-white/5 bg-white dark:bg-[#121826] flex flex-col h-full z-10 relative ${selectedId && window.innerWidth < 1024 ? 'hidden' : 'flex'}`}>
                    
                    <div className="p-3 border-b border-zinc-200/80 dark:border-white/5 shrink-0 bg-white dark:bg-[#121826] z-20">
                        <div className="relative mb-2.5 group">
                            <input 
                                type="text" placeholder="Sök regnr, kund..." 
                                value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full py-2.5 pl-9 pr-3 text-[11px] font-bold rounded-lg border border-zinc-200/80 dark:border-white/10 bg-zinc-50 dark:bg-[#0f1522] outline-none focus:border-orange-500 shadow-inner uppercase tracking-widest text-zinc-900 dark:text-white placeholder:text-zinc-400 transition-all"
                            />
                            <SafeIcon name="search" size={12} className="text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2 group-focus-within:text-orange-500 transition-colors" />
                        </div>
                        
                        <div className="flex bg-zinc-100 dark:bg-[#0f1522] p-1 rounded-lg border border-zinc-200/80 dark:border-white/5">
                            {[{id:'ALL', l:'Alla Leads'}, {id:'OVER1', l:'Över 1 År'}].map(f => (
                                <button key={f.id} onClick={() => setFilter(f.id)} className={`flex-1 py-1.5 text-[9px] font-bold uppercase tracking-widest rounded-md transition-all ${filter === f.id ? 'bg-white dark:bg-[#25324d] text-zinc-900 dark:text-white shadow-sm' : 'text-zinc-500 hover:text-zinc-700'}`}>
                                    {f.l}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="overflow-y-auto flex-1 custom-scrollbar overscroll-none bg-zinc-50/30 dark:bg-[#0f1522]/30">
                        {visibleLeads.length === 0 ? (
                            <div className="p-8 text-center text-zinc-400">
                                <SafeIcon name="check-circle" size={24} className="mx-auto mb-2 opacity-20" />
                                <span className="text-[10px] font-bold uppercase tracking-widest">Inget att följa upp</span>
                            </div>
                        ) : visibleLeads.map(lead => {
                            const isActive = selectedId === lead.id;
                            const initials = lead.customer.substring(0,2).toUpperCase();
                            
                            return (
                                <div 
                                    key={lead.id} onClick={() => setSelectedId(lead.id)}
                                    className={`p-4 border-b border-zinc-200/60 dark:border-white/5 cursor-pointer transition-all flex items-center gap-3 ${isActive ? 'bg-white dark:bg-[#182032] shadow-sm relative z-10 border-l-[3px] border-l-orange-500' : 'bg-transparent hover:bg-white dark:hover:bg-white/[0.02] border-l-[3px] border-l-transparent'}`}
                                >
                                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-black text-[11px] shrink-0 border shadow-sm transition-transform ${isActive ? 'scale-105' : ''} ${getAvatarTheme(lead.customer)}`}>
                                        {initials}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex justify-between items-center mb-0.5">
                                            <div className={`text-[13px] font-black tracking-tight truncate ${isActive ? 'text-zinc-900 dark:text-white' : 'text-zinc-700 dark:text-zinc-300'}`}>
                                                {lead.customer}
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2 mb-1.5">
                                            <div className="scale-75 origin-left"><LicensePlate regnr={lead.regnr} size="md" /></div>
                                            <span className="text-[9px] text-zinc-500 font-bold truncate">{fetchedSpecs[lead.regnr]?.model || lead.model || 'Okänd Modell'}</span>
                                        </div>
                                        <div className="flex flex-wrap gap-1">
                                            {lead.needs.map((n, idx) => (
                                                <span key={idx} className={`px-1.5 py-[2px] rounded text-[8px] font-bold uppercase tracking-widest border ${isActive ? 'bg-orange-50 text-orange-600 border-orange-200' : 'bg-zinc-100 text-zinc-500 border-zinc-200'}`}>
                                                    {n.title}
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* HÖGERPANEL: DETALJVY (Korrekt flexbox) */}
                <div className={`flex-1 flex flex-col bg-zinc-50 dark:bg-[#0f1522] relative min-w-0 h-full ${!selectedId && window.innerWidth < 1024 ? 'hidden' : 'flex'}`}>
                    
                    {activeLead ? (
                        <>
                            {/* Scrollbart innehåll */}
                            <div className="flex-1 overflow-y-auto custom-scrollbar p-4 sm:p-6 lg:p-8 overscroll-none pb-8">
                                
                                <button onClick={() => setSelectedId(null)} className="lg:hidden mb-4 flex items-center gap-1.5 text-[9px] font-bold uppercase tracking-widest text-zinc-500 hover:text-orange-500 bg-white border border-zinc-200 px-2.5 py-1.5 rounded-md shadow-sm">
                                    <SafeIcon name="arrow-left" size={12} /> Tillbaka
                                </button>

                                {/* KUNDKORTET: Tydlig presentation */}
                                <div className="bg-white dark:bg-[#182032] border border-zinc-200/80 dark:border-white/5 rounded-2xl p-5 sm:p-6 shadow-sm mb-6 flex justify-between items-center">
                                    <div className="flex items-center gap-4 sm:gap-5">
                                        <div className={`hidden sm:flex w-14 h-14 rounded-2xl items-center justify-center font-black text-lg border shadow-sm ${getAvatarTheme(activeLead.customer)}`}>
                                            {activeLead.customer.substring(0,2).toUpperCase()}
                                        </div>
                                        <div>
                                            <h2 className="text-2xl sm:text-3xl font-black text-zinc-900 dark:text-white tracking-tight uppercase leading-none mb-2">{activeLead.customer}</h2>
                                            <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                                                <LicensePlate regnr={activeLead.regnr} size="md" />
                                                <span className="text-[11px] sm:text-[12px] font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-widest">
                                                    {fetchedSpecs[activeLead.regnr]?.model || activeLead.model || 'Okänd Fordonsmodell'}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                    <button onClick={() => handleCopy(activeLead.regnr)} className="w-10 h-10 flex items-center justify-center bg-zinc-50 border border-zinc-200 rounded-xl hover:bg-zinc-100 text-zinc-400 hover:text-zinc-700 transition-colors shadow-sm shrink-0" title="Kopiera Regnr">
                                        <SafeIcon name={copiedReg ? "check" : "copy"} size={16} className={copiedReg ? "text-emerald-500" : ""} />
                                    </button>
                                </div>

                                {/* KORT FÖR ÅTGÄRDER OCH INSIKT */}
                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 mb-8">
                                    
                                    {/* Rekommenderad Åtgärd */}
                                    <div className="bg-white dark:bg-[#182032] border border-zinc-200/80 dark:border-white/5 rounded-2xl p-5 shadow-sm flex flex-col justify-between">
                                        <div>
                                            <h3 className="text-[10px] font-black text-orange-500 uppercase tracking-widest flex items-center gap-1.5 mb-4">
                                                <SafeIcon name="alert-circle" size={12} /> Identifierade Behov
                                            </h3>
                                            <div className="flex flex-col gap-2 mb-4">
                                                {activeLead.needs.map((n, idx) => (
                                                    <div key={idx} className="flex items-center justify-between bg-orange-50 dark:bg-orange-500/5 border border-orange-100 dark:border-orange-500/10 p-2.5 rounded-lg">
                                                        <span className="text-[12px] font-black text-orange-700 dark:text-orange-400 uppercase tracking-wide">{n.title}</span>
                                                        <span className="text-[10px] font-bold text-orange-500/70 uppercase tracking-widest">{n.detail}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                        {activeLead.estMileage > 0 && (
                                            <div className="pt-3 border-t border-zinc-100 dark:border-white/5 flex items-center justify-between text-[11px] font-medium text-zinc-500">
                                                <span>Estimerat Miltal idag:</span>
                                                <span className="font-mono font-bold text-zinc-800 dark:text-zinc-200">{activeLead.estMileage.toLocaleString()} mil</span>
                                            </div>
                                        )}
                                    </div>

                                    {/* Systemets Analys & Konfidens */}
                                    <div className="bg-white dark:bg-[#182032] border border-zinc-200/80 dark:border-white/5 rounded-2xl p-5 shadow-sm flex flex-col justify-between">
                                        <div>
                                            <h3 className="text-[10px] font-black text-zinc-400 uppercase tracking-widest flex items-center gap-1.5 mb-3">
                                                <SafeIcon name="brain-circuit" size={12} /> Systemets Analys
                                            </h3>
                                            <p className="text-[13px] leading-relaxed text-zinc-700 dark:text-zinc-300 font-medium mb-4">
                                                {activeLead.insight}
                                            </p>
                                        </div>
                                        
                                        <div className="pt-4 border-t border-zinc-100 dark:border-white/5 grid grid-cols-2 gap-4">
                                            <div>
                                                <span className="text-[9px] font-bold text-zinc-400 uppercase tracking-widest mb-1 block">Körmönster (Snitt)</span>
                                                <div className="text-[14px] font-bold text-zinc-800 dark:text-zinc-200">{activeLead.milPerYear > 0 ? `~${activeLead.milPerYear.toLocaleString()} mil/år` : 'Okänt'}</div>
                                            </div>
                                            <div>
                                                <span className="text-[9px] font-bold text-zinc-400 uppercase tracking-widest mb-1 block">Datapunkter</span>
                                                <div className="text-[14px] font-bold text-zinc-800 dark:text-zinc-200">{activeLead.jobs.length} Verkstadsbesök</div>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* HISTORIK */}
                                <h4 className="text-[10px] sm:text-[11px] font-bold text-zinc-900 dark:text-white uppercase tracking-widest border-b border-zinc-200 dark:border-white/10 pb-2 mb-4">Verkstadshistorik</h4>
                                
                                <div className="space-y-0 relative">
                                    <div className="absolute left-[11px] top-6 bottom-4 w-[2px] bg-zinc-200 dark:bg-white/10 z-0"></div>
                                    
                                    {activeLead.jobs.map((job, idx) => (
                                        <div 
                                            key={job.id} 
                                            onClick={() => { if (window.openVehicleProfile) window.openVehicleProfile(job.regnr, job.id); }}
                                            className="relative z-10 flex gap-4 items-start py-3 cursor-pointer group"
                                        >
                                            <div className="w-6 h-6 rounded-full bg-white dark:bg-[#182032] border-[2px] border-zinc-300 dark:border-zinc-600 flex items-center justify-center shrink-0 mt-1.5 group-hover:border-orange-500 transition-colors shadow-sm">
                                                {idx === 0 && <SafeIcon name="check" size={10} className="text-orange-500" />}
                                            </div>
                                            
                                            <div className="flex-1 bg-white dark:bg-[#121826] p-4 sm:p-5 rounded-2xl border border-zinc-200 dark:border-white/5 shadow-sm group-hover:border-zinc-300 dark:group-hover:border-white/20 transition-all flex flex-col sm:flex-row justify-between sm:items-center gap-3">
                                                <div>
                                                    <div className="flex items-center gap-2 mb-1">
                                                        <div className="text-[13px] sm:text-[14px] font-black text-zinc-900 dark:text-white">{job.datum ? job.datum.split('T')[0] : 'Okänt'}</div>
                                                        <div className="text-[9px] font-mono font-bold text-zinc-500 bg-zinc-50 dark:bg-white/5 px-1.5 py-0.5 rounded border border-zinc-100 dark:border-white/5">{job.miltal || 'Miltal saknas'}</div>
                                                    </div>
                                                    <div className="text-[12px] sm:text-[13px] text-zinc-700 dark:text-zinc-300 font-bold uppercase tracking-wide">{job.paket === 'Oljebyte' && job.oljevolym ? `Oljebyte ${job.oljevolym}l` : (job.paket || 'Standard')}</div>
                                                    
                                                    {job.kommentar && (
                                                        <div className="mt-2 text-[11px] text-zinc-500 italic flex items-start gap-2">
                                                            <SafeIcon name="message-square" size={12} className="shrink-0 mt-[2px] opacity-40" />
                                                            <div className="leading-relaxed">"{stripHtml(job.kommentar)}"</div>
                                                        </div>
                                                    )}
                                                </div>
                                                
                                                <div className="hidden sm:flex justify-end shrink-0">
                                                    <div className="w-8 h-8 rounded-lg bg-zinc-50 dark:bg-white/5 border border-zinc-200 dark:border-white/10 flex items-center justify-center text-zinc-400 group-hover:text-orange-500 group-hover:bg-orange-50 transition-colors">
                                                        <SafeIcon name="chevron-right" size={14} />
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* FAST BOTTENRAD (FLEX SHRINK-0 GÖR ATT DEN ALDRIG ÖVERLAPPAR SCROLLEN) */}
                            <div className="shrink-0 p-4 sm:p-5 border-t border-zinc-200 dark:border-white/5 bg-white dark:bg-[#182032] flex flex-col sm:flex-row gap-3 z-30 shadow-[0_-5px_15px_rgba(0,0,0,0.02)]">
                                
                                <div className="flex-1 relative">
                                    <div className="absolute -top-2.5 left-3 bg-emerald-500 text-white text-[8px] font-bold uppercase tracking-widest px-1.5 py-[2px] rounded-md shadow-sm">
                                        FÖRSLAG PÅ SMS
                                    </div>
                                    <textarea 
                                        className="w-full bg-zinc-50 dark:bg-[#0f1522] border border-emerald-200/50 dark:border-emerald-500/20 rounded-xl p-3 pt-3 text-[11px] sm:text-[12px] text-zinc-700 dark:text-zinc-300 font-medium resize-none outline-none focus:border-emerald-500 focus:bg-white focus:ring-2 focus:ring-emerald-500/10 transition-all h-16 sm:h-20 custom-scrollbar" 
                                        spellCheck="false"
                                        defaultValue={getSmsTemplate(activeLead)}
                                    ></textarea>
                                </div>

                                <div className="flex flex-row sm:flex-col gap-2 shrink-0 w-full sm:w-40 h-auto sm:h-20">
                                    <button className="flex-1 bg-white border border-emerald-200 text-emerald-600 rounded-xl text-[10px] font-bold uppercase tracking-widest shadow-sm hover:bg-emerald-50 transition-colors flex items-center justify-center gap-1.5">
                                        <SafeIcon name="send" size={12} /> Skicka SMS
                                    </button>
                                    <button onClick={() => setView('NEW_JOB', { prefillRegnr: activeLead.regnr })} className="flex-[1.5] sm:flex-1 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-400 hover:to-orange-500 text-white rounded-xl text-[10px] font-bold uppercase tracking-widest shadow-sm transition-all flex items-center justify-center gap-1.5 active:scale-95">
                                        Arbetsorder <SafeIcon name="arrow-right" size={12} />
                                    </button>
                                </div>
                            </div>
                        </>
                    ) : (
                        <div className="flex-1 flex items-center justify-center text-zinc-400 text-[11px] uppercase tracking-widest font-bold">
                            Välj en kund i listan
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
