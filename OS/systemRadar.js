// systemRadar.js - Fristående modul för Systemradarn

window.GlobalSystemRadar = ({ isChatOpen }) => {
    const { useState, useEffect } = React;
    
    // Ladda från webbläsarens minne vid start!
    const [radars, setRadars] = useState(() => {
        try {
            const saved = localStorage.getItem('os_active_radars');
            return saved ? JSON.parse(saved) : [];
        } catch(e) { 
            return []; 
        }
    });
    const [copiedVins, setCopiedVins] = useState({});

    // Spara till minnet varje gång en radar ändras, öppnas eller stängs!
    useEffect(() => {
        localStorage.setItem('os_active_radars', JSON.stringify(radars));
    }, [radars]);

    useEffect(() => {
        const handleTrigger = async (e) => {
            const regnr = e.detail?.regnr?.toUpperCase();
            const waitForExt = e.detail?.waitForExtension;
            if (!regnr || !window.db) return;

            setRadars(prev => {
                const existing = prev.find(r => r.regnr === regnr);
                if (existing) {
                    return prev.map(r => r.regnr === regnr ? { ...r, status: 'loading', isMinimized: false } : r);
                }
                return [...prev, { regnr, status: 'loading', data: null, isMinimized: false }];
            });

            if (waitForExt) {
                setTimeout(() => {
                    setRadars(prev => prev.map(r => (r.regnr === regnr && r.status === 'loading') ? { ...r, status: 'not_found' } : r));
                }, 15000); 
                // FIX: Ingen 'return;' här! Vi låter den fortsätta och kolla Firebase direkt också.
            }

            try {
                setTimeout(async () => {
                    const doc = await window.db.collection('vehicleSpecs').doc(regnr).get();
                    if (doc.exists && Object.keys(doc.data()).length > 0) {
                        // Hittar den bilen lokalt så skriver den över och visar direkt!
                        setRadars(prev => prev.map(r => r.regnr === regnr ? { ...r, status: 'success', data: doc.data() } : r));
                    } else if (!waitForExt) {
                        // Visa bara "not found" direkt om vi INTE väntar på tillägget
                        setRadars(prev => prev.map(r => r.regnr === regnr ? { ...r, status: 'not_found' } : r));
                    }
                }, 800);
            } catch (err) {
                if (!waitForExt) setRadars(prev => prev.map(r => r.regnr === regnr ? { ...r, status: 'not_found' } : r));
            }
        };

        const handleMessage = async (event) => {
            const fordonData = event.data;
            if (!fordonData || !['Car.info_Extension', 'Oljemagasinet_Extension'].includes(fordonData.source)) return;

            const data = {
                oil: fordonData.oljevolym ? `${fordonData.oljevolym.replace(/[^0-9.,]/g, '')} l` : '',
                engine: fordonData.motorkod || '',
                year: fordonData.årsmodell || '',
                mileage: fordonData.miltal || '',
                vin: fordonData.vin || '',
                model: fordonData.bilmodell || ''
            };

            const regnr = fordonData.regnr?.toUpperCase();

            setRadars(prev => {
                const existing = prev.find(r => r.regnr === regnr);
                // Har Spotlight startat denna sökning? Uppdatera och visa rutan!
                if (existing) {
                    return prev.map(r => r.regnr === regnr ? {
                        ...r,
                        status: 'success',
                        data: { ...(r.data || {}), ...data },
                        isMinimized: false
                    } : r);
                } 
                // Om inte, ignorera popupen helt!
                return prev;
            });

            if (regnr && window.db) {
                const cleanData = Object.fromEntries(Object.entries(data).filter(([_, v]) => v !== ''));
                if (Object.keys(cleanData).length > 0) {
                    cleanData.updatedAt = new Date().toISOString();
                    try {
                        await window.db.collection('vehicleSpecs').doc(regnr).set(cleanData, { merge: true });
                    } catch(e) {}
                }
            }
        };

        window.addEventListener('show-system-radar', handleTrigger);
        window.addEventListener('message', handleMessage);
        return () => {
            window.removeEventListener('show-system-radar', handleTrigger);
            window.removeEventListener('message', handleMessage);
        };
    }, []);

    useEffect(() => {
        if (window.lucide && radars.length > 0) {
            window.lucide.createIcons();
        }
    });

    const handleCopyVin = (regnr, vin) => {
        if (vin) {
            navigator.clipboard.writeText(vin);
            setCopiedVins(prev => ({ ...prev, [regnr]: true }));
            setTimeout(() => {
                setCopiedVins(prev => ({ ...prev, [regnr]: false }));
            }, 2000);
        }
    };

    const setMinimized = (regnr, val) => {
        setRadars(prev => prev.map(r => r.regnr === regnr ? { ...r, isMinimized: val } : r));
    };

    const closeRadar = (regnr) => {
        setRadars(prev => prev.filter(r => r.regnr !== regnr));
    };

    if (radars.length === 0) return null;

    const StatCard = ({ icon, label, val }) => {
        const displayVal = val || '-';
        return (
            <div className="bg-[#1e293b]/90 border border-white/5 rounded-xl p-3.5 flex flex-col gap-1.5 relative overflow-hidden group hover:border-emerald-500/30 transition-colors">
                <div className="absolute right-0 top-0 w-16 h-16 bg-emerald-500/5 blur-xl rounded-full pointer-events-none transition-all group-hover:bg-emerald-500/10"></div>
                <div className="text-[9px] font-bold uppercase tracking-widest text-slate-400 flex items-center gap-1.5">
                    <window.Icon name={icon} size={10} className="text-emerald-400/80" /> {label}
                </div>
                <div className={`text-[14px] font-bold truncate ${val ? 'text-white' : 'text-slate-600'}`} title={displayVal}>
                    {displayVal}
                </div>
            </div>
        );
    };

    return (
        <div className={`fixed bottom-[112px] z-[9999] flex flex-col gap-3 items-end pointer-events-none transition-all duration-500 ease-in-out ${isChatOpen ? 'lg:right-[490px] right-4 sm:right-8' : 'right-4 sm:right-8'}`}>
            {radars.map(radar => {
                
                if (radar.isMinimized) {
                    return (
                        <div key={radar.regnr} className="pointer-events-auto animate-in slide-in-from-right-8 fade-in duration-300">
                            <div 
                                onClick={() => setMinimized(radar.regnr, false)}
                                className="bg-[#0f172a]/95 backdrop-blur-2xl border border-emerald-500/40 shadow-[0_10px_25px_rgba(0,0,0,0.5),_0_0_15px_rgba(16,185,129,0.2)] rounded-full px-4 py-2 flex items-center gap-3 cursor-pointer hover:bg-[#1e293b] hover:border-emerald-400/60 transition-all group"
                            >
                                <span className="relative flex h-2.5 w-2.5 shrink-0">
                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                                    <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
                                </span>
                                
                                <div className="flex flex-col">
                                    <span className="text-[8px] font-black uppercase tracking-widest text-emerald-400 leading-none">Aktiv</span>
                                    <span className="text-[12px] font-mono font-bold text-white leading-none mt-1">{radar.regnr}</span>
                                </div>

                                <div className="w-px h-6 bg-white/10 mx-1"></div>

                                <button 
                                    onClick={(e) => { e.stopPropagation(); closeRadar(radar.regnr); }}
                                    className="w-6 h-6 flex items-center justify-center rounded-full text-slate-400 hover:bg-red-500/20 hover:text-red-400 transition-colors"
                                    title="Stäng radarn helt"
                                >
                                    <window.Icon name="x" size={14} />
                                </button>
                            </div>
                        </div>
                    );
                }

                const isCopied = copiedVins[radar.regnr];

                return (
                    <div key={radar.regnr} className="pointer-events-auto animate-in slide-in-from-right-8 fade-in zoom-in-95 duration-300">
                        <div className="bg-[#0f172a]/95 backdrop-blur-2xl border border-emerald-500/30 shadow-[0_20px_50px_rgba(0,0,0,0.5),_0_0_30px_rgba(16,185,129,0.15)] rounded-2xl w-[calc(100vw-2rem)] sm:w-[420px] relative overflow-hidden flex flex-col font-sans">
                            
                            <div className={`absolute top-0 left-0 w-full h-1 transition-colors ${radar.status === 'loading' ? 'bg-orange-500 animate-pulse' : radar.status === 'success' ? 'bg-emerald-500 shadow-[0_0_15px_#10b981]' : 'bg-red-500'}`}></div>
                            
                            <button 
                                onClick={() => setMinimized(radar.regnr, true)}
                                className="absolute top-4 right-12 w-7 h-7 flex items-center justify-center text-slate-500 hover:text-white hover:bg-white/10 rounded-full transition-colors z-20"
                                title="Minimera till hörnet"
                            >
                                <window.Icon name="minus" size={14} />
                            </button>

                            <button 
                                onClick={() => closeRadar(radar.regnr)}
                                className="absolute top-4 right-4 w-7 h-7 flex items-center justify-center text-slate-500 hover:text-white hover:bg-white/10 rounded-full transition-colors z-20"
                                title="Stäng radarn"
                            >
                                <window.Icon name="x" size={14} />
                            </button>

                            <div className="p-4 sm:p-6">
                                <div className="flex items-center gap-3 sm:gap-5 mb-4 sm:mb-5">
                                    <div className="shrink-0 relative flex items-center justify-center">
                                        {radar.status === 'loading' ? (
                                            <>
                                                <window.Icon name="loader" size={36} className="text-orange-500 animate-spin absolute" />
                                                <div className="w-8 h-8 bg-orange-500/20 rounded-full animate-pulse"></div>
                                            </>
                                        ) : radar.status === 'success' ? (
                                            <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 flex items-center justify-center border border-emerald-500/30 shadow-[0_0_15px_rgba(16,185,129,0.2)]">
                                                <window.Icon name="check-circle" size={26} className="text-emerald-400" />
                                            </div>
                                        ) : (
                                            <div className="w-14 h-14 rounded-2xl bg-red-500/10 flex items-center justify-center border border-red-500/30">
                                                <window.Icon name="x-circle" size={26} className="text-red-400" />
                                            </div>
                                        )}
                                    </div>
                                    
                                    <div className="flex flex-col flex-1 min-w-0 pr-12">
                                        <span className={`text-[10px] font-black uppercase tracking-widest mb-1 drop-shadow-sm ${radar.status === 'loading' ? 'text-orange-500' : radar.status === 'success' ? 'text-emerald-400' : 'text-red-400'}`}>
                                            {radar.status === 'loading' ? 'SYSTEMRADAR SÖKER...' : radar.status === 'success' ? 'DATA FÅNGAD' : 'SYSTEMRADAR'}
                                        </span>
                                        <div className="flex items-baseline gap-2">
                                            <h3 className="text-2xl font-black text-white tracking-wider font-mono uppercase leading-none">{radar.regnr}</h3>
                                        </div>
                                        {radar.data?.model && radar.status === 'success' && (
                                            <p className="text-[11px] text-slate-300 font-bold uppercase truncate mt-1.5 tracking-widest">{radar.data.model}</p>
                                        )}
                                        {radar.status === 'loading' && (
                                            <p className="text-[11px] text-slate-400 font-medium mt-1.5">Etablerar anslutning till register...</p>
                                        )}
                                    </div>
                                </div>

                                {radar.status === 'success' && radar.data && (
                                    <div className="flex flex-col gap-3 animate-in fade-in slide-in-from-bottom-2 duration-500">
                                        <div className="grid grid-cols-2 gap-2.5">
                                            <StatCard icon="droplet" label="Oljevolym" val={radar.data.oil} />
                                            <StatCard icon="cpu" label="Motorkod" val={radar.data.engine} />
                                            <StatCard icon="calendar" label="Årsmodell" val={radar.data.year} />
                                            <StatCard icon="gauge" label="Miltal" val={radar.data.mileage} />
                                        </div>

                                        <div 
                                            onClick={() => handleCopyVin(radar.regnr, radar.data.vin)}
                                            title="Kopiera Chassinummer"
                                            className={`mt-1.5 group cursor-pointer border rounded-xl p-4 flex items-center justify-between transition-all duration-300 ${isCopied ? 'bg-emerald-500/20 border-emerald-500/50' : 'bg-[#1e293b]/80 border-white/5 hover:border-emerald-500/30'}`}
                                        >
                                            <div className="flex flex-col min-w-0">
                                                <span className="text-[9px] font-bold uppercase tracking-widest text-slate-400 mb-1 flex items-center gap-1.5">
                                                    <window.Icon name="fingerprint" size={10} className="text-slate-500" /> Chassinummer (VIN)
                                                </span>
                                                <span className={`font-mono text-[14px] font-bold tracking-[0.15em] truncate transition-colors ${isCopied ? 'text-emerald-400' : radar.data.vin ? 'text-white group-hover:text-emerald-400' : 'text-slate-600'}`}>
                                                    {radar.data.vin || '-'}
                                                </span>
                                            </div>
                                            <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 transition-all ${isCopied ? 'bg-emerald-500 text-white shadow-[0_0_15px_rgba(16,185,129,0.4)] scale-110' : radar.data.vin ? 'bg-white/5 text-slate-400 group-hover:bg-emerald-500/20 group-hover:text-emerald-400' : 'bg-transparent text-transparent'}`}>
                                                {radar.data.vin && <window.Icon name={isCopied ? "check" : "copy"} size={16} />}
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {radar.status === 'not_found' && (
                                    <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 flex items-start gap-3 mt-2">
                                        <window.Icon name="alert-circle" size={18} className="text-red-400 shrink-0 mt-0.5" />
                                        <span className="text-[12px] font-medium text-red-200 leading-relaxed">Ingen teknisk fordonsdata hittades för {radar.regnr}. Prova att skanna via Car.info istället.</span>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                );
            })}
        </div>
    );
};

// ==========================================
// NYTT: GLOBAL TRANSPORTSTYRELSEN MODAL
// ==========================================
window.TsDataModal = ({ data, onClose, navigateTo }) => {
    const { useEffect } = React;
    
    useEffect(() => {
        if (data && window.lucide) {
            setTimeout(() => window.lucide.createIcons(), 10); 
        }
    }, [data]);

    if (!data) return null;
    
    const status = String(data.fordonsstatus || '');
    const forbid = String(data.användningsförbud || '');
    const isOk = status.toLowerCase().includes('påställt') && !forbid.toLowerCase().includes('ja');

    // ACTION: Skapa förifyllt jobb
    const handleCreateJob = () => {
        const prefilledJob = {
            regnr: data.regnr,
            bilmodell: `${data.fabrikat !== 'SAKNAS' ? data.fabrikat : ''} ${data.handelsbeteckning !== 'SAKNAS' ? data.handelsbeteckning : ''}`.trim(),
            årsmodell: data.fordonsår !== 'SAKNAS' ? data.fordonsår : '',
            vin: data.chassinummer !== 'SAKNAS' ? data.chassinummer : '',
            miltal: data.mätarställning !== 'SAKNAS' ? data.mätarställning.replace(/\D/g, '') : '',
            kommentar: `--- TS DATA ---\nStatus: ${data.fordonsstatus}\nMotor: ${data.motoreffekt}\nVäxellåda: ${data.växellåda}\nBesiktn: ${data.besiktning_senast}`
        };
        onClose();
        navigateTo('NEW_JOB', { job: prefilledJob });
    };

    // ACTION: Skicka vidare till Oljemagasinet
    const handleSearchOil = () => {
        window.dispatchEvent(new CustomEvent('show-system-radar', { detail: { regnr: data.regnr, waitForExtension: true } }));
        const radarWindow = window.open('https://www.oljemagasinet.se/', 'VehicleRadarPopup', 'width=400,height=400,left=9999,top=9999');
        if (radarWindow) { radarWindow.blur(); window.focus(); }
        let pings = 0;
        const pingInterval = setInterval(() => {
            if (radarWindow && !radarWindow.closed) { radarWindow.postMessage({ action: 'START_OS_RADAR', regnr: data.regnr }, '*'); }
            pings++; if (pings > 20) clearInterval(pingInterval); 
        }, 500);
    };

    return (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-zinc-950/60 backdrop-blur-md" onClick={onClose}></div>
            
            <div className="relative w-full max-w-3xl bg-white dark:bg-[#0f1522] rounded-3xl shadow-[0_30px_90px_rgba(0,0,0,0.5)] flex flex-col max-h-[85vh] animate-in zoom-in-95 fade-in duration-300 border border-zinc-200 dark:border-white/10 overflow-hidden">
                <div className="absolute top-0 left-0 right-0 h-32 bg-gradient-to-b from-blue-500/20 to-transparent dark:from-blue-500/10 pointer-events-none"></div>

                <div className="relative px-6 py-5 md:px-8 md:py-6 border-b border-zinc-100 dark:border-white/5 flex items-start justify-between gap-4 shrink-0">
                    <div>
                        <div className="text-[10px] font-black text-blue-600 dark:text-blue-500 uppercase tracking-[0.2em] flex items-center gap-2 mb-1">
                            <window.Icon name="shield" size={14} /> Myndighetsutdrag
                        </div>
                        <h2 className="text-2xl md:text-3xl font-black text-zinc-900 dark:text-white tracking-tight uppercase">
                            {data.regnr} <span className="font-light text-zinc-400">|</span> <span className="text-lg md:text-2xl">{data.fabrikat}</span>
                        </h2>
                        <p className="text-xs font-bold text-zinc-500 uppercase tracking-widest mt-1">{data.handelsbeteckning}</p>
                    </div>
                    <button onClick={onClose} className="p-2 bg-zinc-100 dark:bg-white/5 hover:bg-zinc-200 dark:hover:bg-white/10 rounded-xl text-zinc-500 transition-colors shrink-0">
                        <window.Icon name="x" size={20} />
                    </button>
                </div>

                <div className="relative px-6 py-6 md:px-8 bg-zinc-50/50 dark:bg-transparent overflow-y-auto custom-scrollbar flex-1">
                    <div className={`mb-6 p-4 rounded-2xl flex items-center gap-4 border shadow-sm ${isOk ? 'bg-emerald-50 dark:bg-emerald-500/10 border-emerald-200 dark:border-emerald-500/20 text-emerald-800 dark:text-emerald-300' : 'bg-red-50 dark:bg-red-500/10 border-red-200 dark:border-red-500/20 text-red-800 dark:text-red-300'}`}>
                        <div className={`p-2 rounded-xl ${isOk ? 'bg-emerald-100 dark:bg-emerald-500/20 text-emerald-600' : 'bg-red-100 dark:bg-red-500/20 text-red-600'}`}>
                            <window.Icon name={isOk ? "check-circle" : "alert-triangle"} size={24} />
                        </div>
                        <div>
                            <div className="text-xs font-black uppercase tracking-widest opacity-80 mb-0.5">Fordonsstatus</div>
                            <div className="text-sm font-bold uppercase">{status} {forbid.toLowerCase().includes('ja') && " (KÖRFÖRBUD)"}</div>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-8">
                        <div className="space-y-3">
                            <div className="text-[10px] font-black text-blue-500 dark:text-blue-500 uppercase tracking-widest border-b border-blue-100 dark:border-blue-500/20 pb-2 mb-3">Besiktning & Status</div>
                            {[
                                { label: "Körförbud", val: data.användningsförbud, warn: forbid.toLowerCase().includes('ja') },
                                { label: "Besiktigas Senast", val: data.besiktning_senast },
                                { label: "Mätarställning (TS)", val: data.mätarställning },
                                { label: "Upplysningar", val: data.upplysningar }
                            ].map((item, i) => (
                                <div key={i} className="flex justify-between items-center py-1 border-b border-zinc-100 dark:border-white/5 border-dashed last:border-0">
                                    <span className="text-xs font-medium text-zinc-500 dark:text-zinc-400">{item.label}</span>
                                    <span className={`text-xs font-bold uppercase ${item.warn ? 'text-red-500' : 'text-zinc-900 dark:text-white'} text-right max-w-[180px] truncate`} title={item.val}>{item.val}</span>
                                </div>
                            ))}
                        </div>

                        <div className="space-y-3">
                            <div className="text-[10px] font-black text-blue-500 dark:text-blue-500 uppercase tracking-widest border-b border-blue-100 dark:border-blue-500/20 pb-2 mb-3">Teknisk Identitet</div>
                            {[
                                { label: "Chassinummer", val: data.chassinummer },
                                { label: "Fordonsår", val: data.fordonsår },
                                { label: "Tillverkad", val: data.tillverkad },
                                { label: "Färg", val: data.färg },
                                { label: "Import", val: data.import }
                            ].map((item, i) => (
                                <div key={i} className="flex justify-between items-center py-1 border-b border-zinc-100 dark:border-white/5 border-dashed last:border-0">
                                    <span className="text-xs font-medium text-zinc-500 dark:text-zinc-400">{item.label}</span>
                                    <span className="text-xs font-bold uppercase text-zinc-900 dark:text-white text-right truncate">{item.val}</span>
                                </div>
                            ))}
                        </div>

                        <div className="space-y-3">
                            <div className="text-[10px] font-black text-blue-500 dark:text-blue-500 uppercase tracking-widest border-b border-blue-100 dark:border-blue-500/20 pb-2 mb-3">Skatt & Ekonomi</div>
                            {[
                                { label: "Årsskatt", val: data.årsskatt },
                                { label: "Betalningsmånad", val: data.betalningsmånad },
                                { label: "Återbetalning (Avställn.)", val: data.återbetalning }
                            ].map((item, i) => (
                                <div key={i} className="flex justify-between items-center py-1 border-b border-zinc-100 dark:border-white/5 border-dashed last:border-0">
                                    <span className="text-xs font-medium text-zinc-500 dark:text-zinc-400">{item.label}</span>
                                    <span className="text-xs font-bold uppercase text-zinc-900 dark:text-white text-right truncate">{item.val}</span>
                                </div>
                            ))}
                        </div>

                        <div className="space-y-3">
                            <div className="text-[10px] font-black text-blue-500 dark:text-blue-500 uppercase tracking-widest border-b border-blue-100 dark:border-blue-500/20 pb-2 mb-3">Motor & Prestanda</div>
                            {[
                                { label: "Växellåda", val: data.växellåda },
                                { label: "Drivmedel", val: data.drivmedel },
                                { label: "Motoreffekt", val: data.motoreffekt },
                                { label: "Euroklassning", val: data.euroklass },
                                { label: "Förbrukning (Blandad)", val: data.blandad_körning }
                            ].map((item, i) => (
                                <div key={i} className="flex justify-between items-center py-1 border-b border-zinc-100 dark:border-white/5 border-dashed last:border-0">
                                    <span className="text-xs font-medium text-zinc-500 dark:text-zinc-400">{item.label}</span>
                                    <span className="text-xs font-bold uppercase text-zinc-900 dark:text-white text-right truncate">{item.val}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                <div className="px-6 py-4 md:px-8 border-t border-zinc-100 dark:border-white/5 bg-white dark:bg-[#0f1522] flex flex-col-reverse sm:flex-row items-center justify-between gap-3 shrink-0 rounded-b-3xl">
                    <button onClick={onClose} className="w-full sm:w-auto px-5 py-2.5 text-xs font-bold text-zinc-500 hover:text-zinc-900 dark:hover:text-white transition-colors">
                        Stäng
                    </button>
                    
                    <div className="flex items-center gap-3 w-full sm:w-auto">
                        <button 
                            onClick={handleSearchOil}
                            className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl border border-zinc-200 dark:border-white/10 hover:border-orange-500 dark:hover:border-orange-500 text-zinc-700 dark:text-zinc-300 hover:text-orange-500 transition-all text-xs font-bold uppercase tracking-widest bg-zinc-50 dark:bg-[#1a2235]"
                        >
                            <window.Icon name="droplet" size={14} /> Hämta Olja
                        </button>

                        <button 
                            onClick={handleCreateJob}
                            className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl bg-orange-500 hover:bg-orange-600 text-white shadow-lg shadow-orange-500/30 transition-all text-xs font-black uppercase tracking-widest"
                        >
                            <window.Icon name="plus" size={14} /> Skapa Arbetsorder
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};
