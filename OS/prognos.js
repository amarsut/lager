// prognos.js - Live CRM & Kunduppföljning

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

const stripHtml = (html) => {
    if (!html) return '';
    return String(html).replace(/<br\s*[\/]?>/gi, " ").replace(/<[^>]*>?/gm, '').trim(); 
};

window.PrognosView = ({ allJobs, setView }) => {
    const [searchQuery, setSearchQuery] = React.useState('');
    const [filter, setFilter] = React.useState('ALL'); 
    const [selectedId, setSelectedId] = React.useState(null);
    const [fetchedSpecs, setFetchedSpecs] = React.useState({});
    const [copiedReg, setCopiedReg] = React.useState(false);

    React.useEffect(() => {
        if (window.lucide) window.lucide.createIcons();
    });

    // 1. SMART DATA-MOTOR: Strikt Service-intervaller & Exkluderar BMG
    const leads = React.useMemo(() => {
        const groups = {};
        allJobs.forEach(job => {
            if (!job.regnr || job.regnr === '-' || job.deleted || !job.datum) return;
            // EXKLUDERA BMG HELT OCH HÅLLET
            if (job.kundnamn && job.kundnamn.toUpperCase().includes('BMG')) return;

            const reg = job.regnr.toUpperCase().replace(/\s+/g, '');
            if (!groups[reg]) groups[reg] = { jobs: [], customer: job.kundnamn, model: job.bilmodell };
            groups[reg].jobs.push(job);
        });

        const now = new Date();
        const results = [];

        Object.keys(groups).forEach(reg => {
            const vehicle = groups[reg];
            vehicle.jobs.sort((a,b) => new Date(b.datum) - new Date(a.datum));

            let lastOil = null, lastBrake = null, lastCabin = null, lastAir = null;

            // Skanna igenom historiken för att hitta senaste datumet för varje specifik service
            vehicle.jobs.forEach(j => {
                const text = `${j.paket || ''} ${j.kommentar || ''}`.toLowerCase();
                const d = new Date(j.datum);
                
                if (!lastOil && (text.includes('olja') || text.includes('oljebyte') || text.includes('service') || text.includes('standard') || text.includes('inspektion'))) lastOil = d;
                if (!lastBrake && text.includes('bromsvätska')) lastBrake = d;
                if (!lastCabin && (text.includes('kupéfilter') || text.includes('kupefilter') || text.includes('pollenfilter'))) lastCabin = d;
                if (!lastAir && (text.includes('luftfilter') || text.includes('bränslefilter'))) lastAir = d;
            });

            const needs = [];
            let maxDays = 0;

            if (lastOil) {
                const days = Math.floor((now - lastOil) / (1000 * 60 * 60 * 24));
                if (days > 330) { needs.push('Oljebyte'); maxDays = Math.max(maxDays, days); }
            }
            if (lastBrake) {
                const days = Math.floor((now - lastBrake) / (1000 * 60 * 60 * 24));
                if (days > 700) { needs.push('Bromsvätska'); maxDays = Math.max(maxDays, days); }
            }
            if (lastCabin) {
                const days = Math.floor((now - lastCabin) / (1000 * 60 * 60 * 24));
                if (days > 700) { needs.push('Kupéfilter'); maxDays = Math.max(maxDays, days); }
            }
            if (lastAir) {
                const days = Math.floor((now - lastAir) / (1000 * 60 * 60 * 24));
                if (days > 1050) { needs.push('Luft/Bränsle-filter'); maxDays = Math.max(maxDays, days); }
            }

            // Fallback: Om vi aldrig noterat en specifik service, men bilen var inne för över 1 år sen
            if (needs.length === 0 && vehicle.jobs.length > 0) {
                const latestD = new Date(vehicle.jobs[0].datum);
                const days = Math.floor((now - latestD) / (1000 * 60 * 60 * 24));
                if (days > 330) {
                    needs.push('Årlig Service');
                    maxDays = days;
                }
            }

            if (needs.length > 0) {
                results.push({
                    id: reg,
                    regnr: reg,
                    customer: vehicle.jobs[0].kundnamn,
                    model: vehicle.jobs[0].bilmodell,
                    daysSince: maxDays,
                    prio: maxDays > 365 ? 'HIGH' : 'MEDIUM',
                    reason: 'Servicedags',
                    needsList: needs,
                    insight: `Det är rekommenderat att utföra: ${needs.join(', ')}. Baserat på verkstadshistoriken passerades senaste service-intervallet för ${Math.floor(maxDays/30)} månader sedan.`,
                    jobs: vehicle.jobs
                });
            }
        });

        // Sortera: Flest dagar sedan service hamnar överst
        return results.sort((a, b) => b.daysSince - a.daysSince);
    }, [allJobs]);

    const visibleLeads = React.useMemo(() => {
        let filtered = leads;
        if (searchQuery) {
            const sq = searchQuery.toLowerCase();
            filtered = filtered.filter(l => l.regnr.toLowerCase().includes(sq) || (l.customer||'').toLowerCase().includes(sq) || (l.model||'').toLowerCase().includes(sq));
        }
        if (filter === 'HIGH') filtered = filtered.filter(l => l.prio === 'HIGH');
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
        const cName = lead.customer ? lead.customer.split(' ')[0] : 'Kunden';
        const actions = lead.needsList.join(' och ').toLowerCase();
        return `Hej ${cName}! Det börjar närma sig dags för ${actions} på din bil (${lead.regnr}). Ska vi boka in en tid för detta? Mvh Amar, BMG Motorgrupp`;
    };

    const stats = {
        totalLeads: leads.length,
        potValue: leads.length * 3500 // Grov kalkyl: 3500kr per service-snitt
    };

    return (
        <div className="flex flex-col min-h-[calc(100vh-80px)] md:min-h-screen bg-transparent text-zinc-900 dark:text-white pb-0 transition-colors duration-500 relative max-w-[1400px] ml-0 w-full animate-in fade-in slide-in-from-left-4 overflow-hidden">
            
            <div className="absolute top-0 left-[-10%] w-[60%] h-[400px] bg-orange-500/10 dark:bg-orange-500/5 blur-[120px] rounded-full pointer-events-none -z-10 hidden lg:block"></div>

            {/* HEADER - Exakt kopia av Dashboard/Customers */}
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

            {/* HUVUDVY (SPLIT) */}
            <div className="flex flex-col lg:flex-row flex-1 lg:rounded-[1.5rem] lg:border border-zinc-200/80 dark:border-white/5 shadow-sm overflow-hidden min-h-0 relative z-10 mx-0 lg:mx-0 bg-zinc-50 dark:bg-[#0f1522]">
                
                {/* VÄNSTERPANEL: LISTAN */}
                <div className={`w-full lg:w-[320px] border-r border-zinc-200/80 dark:border-white/5 bg-white dark:bg-[#121826] flex flex-col h-full z-10 relative ${selectedId && window.innerWidth < 1024 ? 'hidden' : 'flex'}`}>
                    
                    {/* Sök & Filter */}
                    <div className="p-3 border-b border-zinc-200/80 dark:border-white/5 shrink-0 bg-white dark:bg-[#121826]">
                        <div className="relative mb-2.5 group">
                            <input 
                                type="text" placeholder="Sök regnr, kund..." 
                                value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full py-2.5 pl-9 pr-3 text-[11px] font-bold rounded-lg border border-zinc-200/80 dark:border-white/10 bg-zinc-50 dark:bg-[#0f1522] outline-none focus:border-orange-500 shadow-inner uppercase tracking-widest text-zinc-900 dark:text-white placeholder:text-zinc-400 transition-all"
                            />
                            <SafeIcon name="search" size={12} className="text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2 group-focus-within:text-orange-500 transition-colors" />
                        </div>
                        
                        <div className="flex bg-zinc-100 dark:bg-[#0f1522] p-1 rounded-lg border border-zinc-200/80 dark:border-white/5">
                            {[{id:'ALL', l:'Alla'}, {id:'HIGH', l:'Över 1 År'}].map(f => (
                                <button key={f.id} onClick={() => setFilter(f.id)} className={`flex-1 py-1.5 text-[9px] font-bold uppercase tracking-widest rounded-md transition-all ${filter === f.id ? 'bg-white dark:bg-[#25324d] text-zinc-900 dark:text-white shadow-sm' : 'text-zinc-500 hover:text-zinc-700'}`}>
                                    {f.l}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Listobjekt */}
                    <div className="overflow-y-auto flex-1 custom-scrollbar bg-zinc-50/30 dark:bg-[#0f1522]/30">
                        {visibleLeads.length === 0 ? (
                            <div className="p-8 text-center text-zinc-400">
                                <SafeIcon name="check-circle" size={24} className="mx-auto mb-2 opacity-20" />
                                <span className="text-[10px] font-bold uppercase tracking-widest">Inget att följa upp</span>
                            </div>
                        ) : visibleLeads.map(lead => {
                            const isActive = selectedId === lead.id;
                            
                            return (
                                <div 
                                    key={lead.id} onClick={() => setSelectedId(lead.id)}
                                    className={`p-3.5 border-b border-zinc-200/60 dark:border-white/5 cursor-pointer transition-all flex items-start gap-3 ${isActive ? 'bg-white dark:bg-[#182032] shadow-sm relative z-10 border-l-2 border-l-orange-500' : 'bg-transparent hover:bg-white dark:hover:bg-white/[0.02] border-l-2 border-l-transparent'}`}
                                >
                                    <div className="flex-1 min-w-0">
                                        <div className="flex justify-between items-center mb-1.5">
                                            <div className="scale-90 origin-left"><LicensePlate regnr={lead.regnr} size="md" /></div>
                                            <span className={`px-1.5 py-[2px] rounded text-[8px] font-bold uppercase tracking-widest transition-opacity opacity-100 ${lead.prio === 'HIGH' ? 'text-orange-600 bg-orange-100 dark:bg-orange-500/10 dark:text-orange-400' : 'text-zinc-500 bg-zinc-100 dark:bg-white/5'}`}>
                                                {lead.reason}
                                            </span>
                                        </div>
                                        <div className={`text-[12px] font-bold tracking-tight truncate ${isActive ? 'text-zinc-900 dark:text-white' : 'text-zinc-700 dark:text-zinc-300'}`}>
                                            {lead.customer || 'Okänd Kund'}
                                        </div>
                                        <div className="flex items-center justify-between mt-1.5">
                                            <div className={`text-[9px] font-bold uppercase tracking-widest flex items-center gap-1 ${isActive ? 'text-orange-500' : 'text-zinc-400'}`}>
                                                <SafeIcon name="clock" size={10} /> {lead.daysSince > 365 ? `${Math.floor(lead.daysSince/365)} år, ${Math.floor((lead.daysSince%365)/30)} mån sen` : `${Math.floor(lead.daysSince/30)} mån sen`}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* HÖGERPANEL: DETALJVY */}
                <div className={`flex-1 flex flex-col bg-zinc-50 dark:bg-[#0f1522] relative min-w-0 h-full ${!selectedId && window.innerWidth < 1024 ? 'hidden' : 'flex'}`}>
                    
                    {activeLead ? (
                        <>
                            {/* SCROLLBART INNEHÅLL */}
                            <div className="flex-1 overflow-y-auto custom-scrollbar p-5 sm:p-6 lg:p-8">
                                
                                <button onClick={() => setSelectedId(null)} className="lg:hidden mb-4 flex items-center gap-1.5 text-[9px] font-bold uppercase tracking-widest text-zinc-500 hover:text-orange-500 bg-white border border-zinc-200 px-2.5 py-1.5 rounded-md shadow-sm">
                                    <SafeIcon name="arrow-left" size={12} /> Tillbaka
                                </button>

                                {/* HEADER KORT */}
                                <div className="bg-white dark:bg-[#182032] border border-zinc-200/80 dark:border-white/5 rounded-2xl p-5 sm:p-6 shadow-sm mb-6">
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <div className="flex flex-wrap items-center gap-3 mb-2">
                                                <h2 className="text-3xl font-black text-zinc-900 dark:text-white tracking-tighter uppercase font-mono">{activeLead.regnr}</h2>
                                            </div>
                                            <p className="text-[13px] text-zinc-600 dark:text-zinc-400 font-medium">
                                                <strong className="text-zinc-900 dark:text-white font-black">{activeLead.customer}</strong> • {fetchedSpecs[activeLead.regnr]?.model || activeLead.model || 'Okänd Modell'}
                                            </p>
                                        </div>
                                        <div className="flex gap-1.5">
                                            <button onClick={() => handleCopy(activeLead.regnr)} className="w-10 h-10 flex items-center justify-center bg-zinc-50 border border-zinc-200 rounded-lg hover:bg-zinc-100 text-zinc-400 hover:text-zinc-700 transition-colors shadow-sm">
                                                <SafeIcon name={copiedReg ? "check" : "copy"} size={16} className={copiedReg ? "text-emerald-500" : ""} />
                                            </button>
                                        </div>
                                    </div>
                                </div>

                                {/* SYSTEMETS ANALYS KORT */}
                                <div className="bg-orange-50/50 dark:bg-orange-500/5 rounded-2xl border border-orange-200/60 dark:border-orange-500/20 shadow-sm p-5 sm:p-6 mb-6">
                                    <h3 className="text-[10px] font-black text-orange-600 dark:text-orange-400 uppercase tracking-widest flex items-center gap-1.5 mb-3">
                                        <SafeIcon name="sparkles" size={12} /> Systemets Analys
                                    </h3>
                                    
                                    <div className="flex flex-col sm:flex-row gap-4 sm:gap-6 justify-between items-center">
                                        <div className="flex-1">
                                            <p className="text-[13px] leading-relaxed text-zinc-800 dark:text-zinc-200 font-medium mb-3">
                                                {activeLead.insight}
                                            </p>
                                            <div className="flex items-center gap-2 text-[11px] text-zinc-500 font-medium">
                                                <SafeIcon name="info" size={14} className="shrink-0" />
                                                <span>Identifierat från verkstadshistoriken.</span>
                                            </div>
                                        </div>
                                        <div className="border-t sm:border-t-0 sm:border-l border-orange-200/50 dark:border-orange-500/20 pt-4 sm:pt-0 sm:pl-6 shrink-0 flex flex-col justify-center">
                                            <span className="text-[9px] font-bold text-orange-600/70 uppercase tracking-widest mb-1">Datapunkter</span>
                                            <div className="flex items-end gap-1">
                                                <span className="text-2xl font-light text-orange-600 dark:text-orange-400 leading-none tabular-nums tracking-tighter">
                                                    {activeLead.jobs.length}
                                                </span>
                                                <span className="text-[10px] font-bold text-orange-500 uppercase tracking-widest pb-0.5">Besök</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* HISTORIK */}
                                <h4 className="text-[11px] font-bold text-zinc-900 dark:text-white uppercase tracking-widest border-b border-zinc-200 dark:border-white/10 pb-2 mb-4">Verkstadshistorik</h4>
                                
                                <div className="space-y-0 relative">
                                    <div className="absolute left-[13px] top-4 bottom-4 w-px bg-zinc-200 dark:bg-white/10 z-0"></div>
                                    
                                    {activeLead.jobs.map((job, idx) => (
                                        <div 
                                            key={job.id} 
                                            onClick={() => { if (window.openVehicleProfile) window.openVehicleProfile(job.regnr, job.id); }}
                                            className="relative z-10 flex gap-4 items-start py-3 cursor-pointer group"
                                        >
                                            <div className="w-7 h-7 rounded-full bg-white dark:bg-[#182032] border-[2px] border-zinc-200 dark:border-zinc-700 flex items-center justify-center shrink-0 mt-0.5 group-hover:border-orange-500 transition-colors shadow-sm">
                                                {idx === 0 && <SafeIcon name="check" size={12} className="text-orange-500" />}
                                            </div>
                                            
                                            <div className="flex-1 bg-white dark:bg-[#121826] p-4 rounded-xl border border-zinc-200 dark:border-white/5 shadow-sm group-hover:border-orange-400/50 transition-all">
                                                <div className="flex justify-between items-start mb-1">
                                                    <div className="text-[13px] font-black text-zinc-900 dark:text-white">{job.datum ? job.datum.split('T')[0] : 'Okänt'}</div>
                                                    <div className="text-[10px] font-mono font-bold text-zinc-500 bg-zinc-50 dark:bg-white/5 px-1.5 py-0.5 rounded border border-zinc-100">{job.miltal || '-'}</div>
                                                </div>
                                                <div className="text-[12px] text-zinc-700 dark:text-zinc-300 font-medium mb-2">{job.paket || 'Standard'}</div>
                                                
                                                {job.kommentar && (
                                                    <div className="text-[11px] text-zinc-500 italic bg-zinc-50 dark:bg-[#0f1522] p-2.5 rounded-lg leading-relaxed border border-zinc-100">
                                                        <span className="flex items-start gap-2">
                                                            <SafeIcon name="message-square" size={14} className="shrink-0 mt-[1px] opacity-40" />
                                                            {stripHtml(job.kommentar)}
                                                        </span>
                                                    </div>
                                                )}
                                                
                                                <div className="mt-3 flex justify-end">
                                                    <span className="text-[9px] font-bold text-zinc-400 uppercase tracking-widest flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                        Öppna akt <SafeIcon name="chevron-right" size={10} />
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* SMS-BOX OCH KNAPPAR - Sitter fast i botten, bryter ingenting */}
                            <div className="shrink-0 p-4 sm:p-5 border-t border-zinc-200 dark:border-white/5 bg-white dark:bg-[#182032] flex flex-col sm:flex-row gap-3 z-30 shadow-[0_-5px_20px_rgba(0,0,0,0.03)]">
                                
                                <div className="flex-1 relative">
                                    <div className="absolute -top-2 left-3 bg-white border border-zinc-200 text-emerald-600 text-[8px] font-bold uppercase tracking-widest px-2 py-[2px] rounded-md shadow-sm">
                                        FÖRSLAG PÅ SMS
                                    </div>
                                    <textarea 
                                        className="w-full bg-zinc-50 dark:bg-[#0f1522] border border-zinc-200 dark:border-white/10 rounded-xl p-3 pt-4 text-[12px] text-zinc-700 dark:text-zinc-300 resize-none outline-none focus:border-emerald-500 focus:bg-white focus:ring-2 focus:ring-emerald-500/10 transition-all h-20 custom-scrollbar" 
                                        spellCheck="false"
                                        defaultValue={getSmsTemplate(activeLead)}
                                    ></textarea>
                                </div>

                                <div className="flex flex-row sm:flex-col gap-2 shrink-0 w-full sm:w-36 h-auto sm:h-20">
                                    <button className="flex-1 bg-white border border-emerald-200 text-emerald-600 rounded-xl text-[10px] font-bold uppercase tracking-widest shadow-sm hover:bg-emerald-50 transition-colors flex items-center justify-center gap-1.5">
                                        <SafeIcon name="send" size={12} /> Skicka SMS
                                    </button>
                                    <button onClick={() => setView('NEW_JOB', { prefillRegnr: activeLead.regnr })} className="flex-1 bg-orange-500 hover:bg-orange-600 text-white rounded-xl text-[10px] font-bold uppercase tracking-widest shadow-sm transition-all flex items-center justify-center gap-1.5">
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
